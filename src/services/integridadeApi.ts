/**
 * Adaptacao do contrato Dev-CredVix/canal-integridade (assets/formulario.js,
 * assets/consultar.js). Persistencia, autorizacao por codigo e URLs assinadas
 * sao responsabilidade da Edge Function reporting-channel existente.
 * NUNCA usar service_role no browser.
 */

export type DadosRelato = {
  category: string
  identity: 'anonymous' | 'identified'
  description: string
  unit: string
  when: string
  people: string
  name: string
  email: string
  website: string
}

export const MAX_FILES = 10
export const MAX_FILE_SIZE = 25 * 1024 * 1024
export const ACCEPTED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'message/rfc822',
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/wav', 'audio/x-wav',
  'video/mp4', 'video/quicktime',
] as const
export const ACCEPTED_FILE_TYPES = ACCEPTED_MIME.join(',')
const allowedMime = new Set<string>(ACCEPTED_MIME)
const BUCKET = 'channel-evidencias'

const apiUrl = import.meta.env.VITE_INTEGRIDADE_API_URL?.trim() ?? ''
const supabaseUrl = import.meta.env.VITE_INTEGRIDADE_SUPABASE_URL?.trim() ?? ''
const publishableKey = import.meta.env.VITE_INTEGRIDADE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

export const canalDisponivel = Boolean(apiUrl)
export const anexosDisponiveis = Boolean(apiUrl && supabaseUrl && publishableKey)

export type CodigoAcesso = { protocol: string; secret: string; code: string }
export type AtualizacaoPublica = { status: string; message: string; createdAt: string }
export type RelatoConsultado = {
  protocol: string
  status: string
  createdAt: string
  updates: AtualizacaoPublica[]
  attachmentCount: number
}
export type Evidencia = {
  name: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  url: string
}

const protocolPattern = /^(?:[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}|CD-[0-9]{6,12})$/i
const secretPattern = /^(?:[a-f0-9]{64}|[A-Za-z0-9_-]{22})$/

/** Nao persista codigos em URL, analytics, sessionStorage ou localStorage. */
export function lerCodigoAcesso(raw: string): CodigoAcesso | null {
  const input = raw.trim()
  const separator = input.indexOf('.')
  if (separator === -1) return null
  const protocol = input.slice(0, separator).toUpperCase()
  const secret = input.slice(separator + 1)
  if (!protocolPattern.test(protocol) || !secretPattern.test(secret)) return null
  return { protocol, secret, code: `${protocol}.${secret}` }
}

export function validarEvidencia(file: File): string | null {
  if (!allowedMime.has(file.type)) return `Formato nao permitido: ${file.name}.`
  if (file.size < 1 || file.size > MAX_FILE_SIZE) return `O arquivo ${file.name} deve ter entre 1 byte e 25 MB.`
  return null
}

function gerarSegredo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function api<T>(payload: Record<string, unknown>): Promise<T> {
  if (!apiUrl) throw new Error('O Canal de Integridade nao foi configurado neste ambiente.')
  let response: Response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  } catch {
    throw new Error('Nao foi possivel conectar ao Canal de Integridade. Verifique a conexao e tente novamente.')
  }
  const body: Record<string, unknown> = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Nao foi possivel concluir a operacao.')
  }
  return body as T
}

export async function registrarRelato(relato: DadosRelato): Promise<CodigoAcesso> {
  const secret = gerarSegredo()
  const requestId = crypto.randomUUID()
  const result = await api<{ protocol?: unknown }>({
    action: 'submit', requestId, secret, website: relato.website,
    report: {
      category: relato.category,
      identity: relato.identity,
      description: relato.description.trim(),
      unit: relato.unit.trim(),
      when: relato.when.trim(),
      people: relato.people.trim(),
      name: relato.identity === 'identified' ? relato.name.trim() : '',
      email: relato.identity === 'identified' ? relato.email.trim() : '',
    },
  })
  if (typeof result.protocol !== 'string' || !protocolPattern.test(result.protocol)) {
    throw new Error('O canal nao retornou um protocolo valido. Solicite suporte antes de reenviar.')
  }
  const protocol = result.protocol.toUpperCase()
  return { protocol, secret, code: `${protocol}.${secret}` }
}

/** Mantem compatibilidade com a antiga pagina de registro (nao roteada). */
export async function enviarRelato(relato: DadosRelato): Promise<string> {
  return (await registrarRelato(relato)).code
}

export async function consultarRelato(code: string): Promise<RelatoConsultado> {
  const credentials = lerCodigoAcesso(code)
  if (!credentials) throw new Error('Confira o codigo completo de acompanhamento.')
  const body = await api<{
    protocol?: unknown; status?: unknown; created_at?: unknown
    attachment_count?: unknown
    updates?: Array<{ status?: unknown; message?: unknown; created_at?: unknown }>
  }>({ action: 'lookup', protocol: credentials.protocol, secret: credentials.secret })
  if (typeof body.status !== 'string' || typeof body.protocol !== 'string') {
    throw new Error('O canal retornou dados de acompanhamento invalidos.')
  }
  return {
    protocol: body.protocol,
    status: body.status,
    createdAt: typeof body.created_at === 'string' ? body.created_at : '',
    updates: Array.isArray(body.updates) ? body.updates.map((update) => ({
      status: typeof update.status === 'string' ? update.status : '',
      message: typeof update.message === 'string' ? update.message : '',
      createdAt: typeof update.created_at === 'string' ? update.created_at : '',
    })) : [],
    attachmentCount: typeof body.attachment_count === 'number' && Number.isFinite(body.attachment_count)
      ? Math.max(0, body.attachment_count) : 0,
  }
}

export async function listarEvidencias(code: string): Promise<Evidencia[]> {
  const credentials = lerCodigoAcesso(code)
  if (!credentials) throw new Error('Codigo de acompanhamento invalido.')
  const body = await api<{ attachments?: Array<{
    name?: unknown; mime_type?: unknown; size_bytes?: unknown; created_at?: unknown; url?: unknown
  }> }>({ action: 'attachment_list', protocol: credentials.protocol, secret: credentials.secret })
  return Array.isArray(body.attachments) ? body.attachments.map((item) => ({
    name: typeof item.name === 'string' ? item.name : 'Arquivo',
    mimeType: typeof item.mime_type === 'string' ? item.mime_type : '',
    sizeBytes: typeof item.size_bytes === 'number' ? item.size_bytes : 0,
    createdAt: typeof item.created_at === 'string' ? item.created_at : '',
    url: typeof item.url === 'string' && /^https:\/\//i.test(item.url) ? item.url : '',
  })) : []
}

async function hashArquivo(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Fluxo original: attachment_init -> uploadToSignedUrl -> attachment_complete.
 * Reproduz o PUT multipart/form-data do @supabase/storage-js sem adicionar uma
 * dependencia so para o upload assinado. Nenhum upload publico e permitido.
 */
export async function enviarEvidencia(code: string, file: File): Promise<void> {
  const credentials = lerCodigoAcesso(code)
  if (!credentials) throw new Error('Codigo de acompanhamento invalido.')
  if (!anexosDisponiveis) throw new Error('Anexos ainda nao foram configurados neste ambiente.')
  const validation = validarEvidencia(file)
  if (validation) throw new Error(validation)

  const init = await api<{ path?: unknown; token?: unknown }>({
    action: 'attachment_init', protocol: credentials.protocol, secret: credentials.secret,
    fileName: file.name, mimeType: file.type, sizeBytes: file.size,
  })
  if (typeof init.path !== 'string' || !init.path || typeof init.token !== 'string' || !init.token) {
    throw new Error('O canal nao autorizou o upload da evidencia.')
  }
  // O caminho vem da Edge Function, nunca de um campo controlado pelo usuario.
  const encodedPath = init.path.split('/').map(encodeURIComponent).join('/')
  const origin = new URL(supabaseUrl)
  if (origin.protocol !== 'https:') throw new Error('O Storage precisa usar HTTPS.')
  const url = new URL(`/storage/v1/object/upload/sign/${BUCKET}/${encodedPath}`, origin)
  url.searchParams.set('token', init.token)
  const multipart = new FormData()
  multipart.append('cacheControl', '3600')
  multipart.append('', file)

  let uploaded: Response
  try {
    uploaded = await fetch(url, {
      method: 'PUT',
      headers: { apikey: publishableKey, 'x-upsert': 'false' },
      body: multipart,
      cache: 'no-store',
    })
  } catch {
    throw new Error(`Falha de conexao ao enviar ${file.name}.`)
  }
  if (!uploaded.ok) throw new Error(`Nao foi possivel transferir ${file.name} (${uploaded.status}).`)

  // A evidencia so e considerada concluida apos registrar metadados + checksum.
  const sha256 = await hashArquivo(file)
  await api({
    action: 'attachment_complete', protocol: credentials.protocol, secret: credentials.secret,
    path: init.path, fileName: file.name, mimeType: file.type, sizeBytes: file.size, sha256,
  })
}
