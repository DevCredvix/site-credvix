/**
 * Area restrita do Canal de Integridade Credvix.
 * Autenticacao pelo Supabase Auth e leitura dos relatos exclusivamente pela
 * Edge Function reporting-channel, que verifica channel_reviewers.
 * O JWT permanece somente em memoria enquanto esta pagina estiver aberta.
 */
export type StatusRelatoAdmin = 'received' | 'in_review' | 'closed'

export type RelatoResumoAdmin = {
  id: string
  protocol_code: string
  category: string
  unit: string
  status: StatusRelatoAdmin
  created_at: string
  revision: number
}

export type PaginaRelatosAdmin = {
  reports: RelatoResumoAdmin[]
  offset: number
  hasMore: boolean
}

export type SessaoRevisor = {
  email: string
  accessToken: string
  initialPage: PaginaRelatosAdmin
}

type RespostaAuth = {
  access_token?: unknown
  user?: { email?: unknown }
}

type RespostaErro = { error?: unknown }

const supabaseUrl = import.meta.env.VITE_INTEGRIDADE_SUPABASE_URL?.trim().replace(/\/+$/, '')
const publishableKey = import.meta.env.VITE_INTEGRIDADE_SUPABASE_PUBLISHABLE_KEY?.trim()
const apiUrl = import.meta.env.VITE_INTEGRIDADE_API_URL?.trim()

export class SessaoRevisorExpiradaError extends Error {
  constructor() {
    super('Sua sessao expirou ou seu acesso foi revogado. Entre novamente.')
    this.name = 'SessaoRevisorExpiradaError'
  }
}

function validarPaginaRelatos(body: unknown, offset: number): PaginaRelatosAdmin {
  if (!body || typeof body !== 'object') throw new Error('A lista de relatos retornou uma resposta inválida.')
  const value = body as Record<string, unknown>
  if (!Array.isArray(value.reports) || typeof value.hasMore !== 'boolean') {
    throw new Error('A lista de relatos retornou uma resposta inválida.')
  }
  const reports: RelatoResumoAdmin[] = value.reports.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Um relato retornou dados inválidos.')
    const report = item as Record<string, unknown>
    if (
      typeof report.id !== 'string' || typeof report.protocol_code !== 'string' ||
      typeof report.category !== 'string' || typeof report.unit !== 'string' ||
      typeof report.created_at !== 'string' || typeof report.revision !== 'number' ||
      !['received', 'in_review', 'closed'].includes(String(report.status))
    ) {
      throw new Error('Um relato retornou dados inválidos.')
    }
    return {
      id: report.id,
      protocol_code: report.protocol_code,
      category: report.category,
      unit: report.unit,
      status: report.status as StatusRelatoAdmin,
      created_at: report.created_at,
      revision: report.revision,
    }
  })
  return { reports, offset, hasMore: value.hasMore }
}

async function consultarPagina(accessToken: string, offset: number): Promise<PaginaRelatosAdmin> {
  if (!apiUrl) throw new Error('A API do canal não está configurada neste ambiente.')
  if (!accessToken || !Number.isInteger(offset) || offset < 0 || offset > 100000) {
    throw new Error('Parâmetros inválidos para consultar os relatos.')
  }
  let response: Response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action: 'list', offset }),
      cache: 'no-store',
    })
  } catch {
    throw new Error('Não foi possível conectar ao canal. Tente novamente.')
  }
  if (response.status === 401 || response.status === 403) throw new SessaoRevisorExpiradaError()
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as RespostaErro
    if (response.status === 429) throw new Error('Muitas solicitações. Aguarde e tente novamente.')
    throw new Error(typeof data.error === 'string' ? data.error : 'Não foi possível carregar os relatos.')
  }
  return validarPaginaRelatos(await response.json().catch(() => null), offset)
}

export async function listarRelatosAdmin(accessToken: string, offset: number): Promise<PaginaRelatosAdmin> {
  return consultarPagina(accessToken, offset)
}

export async function autenticarRevisor(email: string, password: string): Promise<SessaoRevisor> {
  if (!supabaseUrl || !publishableKey || !apiUrl) {
    throw new Error('A integração do canal ainda não está configurada neste ambiente.')
  }

  let authResponse: Response
  try {
    authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })
  } catch {
    throw new Error('Não foi possível conectar ao serviço de autenticação. Tente novamente.')
  }

  const authData = (await authResponse.json().catch(() => ({}))) as RespostaAuth
  if (!authResponse.ok) {
    throw new Error(
      authResponse.status === 400 || authResponse.status === 401
        ? 'E-mail ou senha inválidos.'
        : 'Não foi possível autenticar agora. Tente novamente mais tarde.',
    )
  }
  if (typeof authData.access_token !== 'string' || !authData.access_token) {
    throw new Error('A autenticação não retornou uma sessão válida.')
  }

  // A resposta de 'list' ja inclui a primeira pagina e so e retornada
  // depois de o backend validar channel_reviewers.
  let initialPage: PaginaRelatosAdmin
  try {
    initialPage = await consultarPagina(authData.access_token, 0)
  } catch (error) {
    if (error instanceof SessaoRevisorExpiradaError) {
      throw new Error('Seu usuário não está autorizado a revisar relatos neste canal.')
    }
    throw error
  }
  return {
    email: typeof authData.user?.email === 'string' ? authData.user.email : email,
    accessToken: authData.access_token,
    initialPage,
  }
}


/**
 * Detalhes completos: devolvidos APENAS pela acao 'detail' da Edge Function,
 * apos autenticar o JWT e conferir o cadastro em channel_reviewers.
 * Nenhum campo do relato original possui API de edicao no site.
 */
export type RelatoDetalheAdmin = {
  report: RelatoResumoAdmin & {
    occurred_at: string
    people: string
    description: string
    identity: 'anonymous' | 'identified'
    reporter_name: string
    reporter_email: string
    updated_at: string
  }
  updates: Array<{
    id: string
    status: StatusRelatoAdmin
    public_message: string
    internal_note: string
    created_at: string
  }>
  attachments: Array<{
    id: string
    original_name: string
    mime_type: string
    size_bytes: number
    created_at: string
    url: string | null
  }>
}

export type AtualizacaoRelatoAdmin = {
  revision: number
  status: StatusRelatoAdmin
}

export class RevisaoRelatoConflitoError extends Error {
  constructor() {
    super('Este relato foi alterado por outro revisor. Os detalhes foram atualizados; revise as informacoes antes de salvar novamente.')
    this.name = 'RevisaoRelatoConflitoError'
  }
}

const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const STATUS_VALIDOS: readonly string[] = ['received', 'in_review', 'closed']

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requiredText(value: unknown): string {
  if (typeof value !== 'string') throw new Error('O servidor retornou dados incompletos do relato.')
  return value
}

function optionalText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return requiredText(value)
}

function checkedStatus(value: unknown): StatusRelatoAdmin {
  if (typeof value !== 'string' || !STATUS_VALIDOS.includes(value)) {
    throw new Error('O servidor retornou um status desconhecido.')
  }
  return value as StatusRelatoAdmin
}

/** Nunca transforma URLs arbitrarias em links clicaveis para evidencias. */
function safeEvidenceUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !supabaseUrl) return null
  try {
    const origin = new URL(supabaseUrl)
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.origin !== origin.origin) return null
    if (!url.pathname.startsWith('/storage/v1/object/sign/channel-evidencias/')) return null
    return url.toString()
  } catch {
    return null
  }
}

async function requisitarAdmin(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  if (!apiUrl) throw new Error('A API do canal nao esta configurada.')
  if (!accessToken) throw new SessaoRevisorExpiradaError()

  let response: Response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  } catch {
    throw new Error('Nao foi possivel conectar ao canal. Tente novamente.')
  }

  if (response.status === 401 || response.status === 403) throw new SessaoRevisorExpiradaError()
  if (response.status === 409) throw new RevisaoRelatoConflitoError()
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as RespostaErro
    if (response.status === 429) throw new Error('Muitas solicitacoes. Aguarde e tente novamente.')
    throw new Error(typeof data.error === 'string' ? data.error : 'Nao foi possivel concluir esta operacao.')
  }
  return response.json().catch(() => { throw new Error('O servidor retornou uma resposta invalida.') })
}

export async function obterDetalheRelatoAdmin(
  accessToken: string,
  reportId: string,
): Promise<RelatoDetalheAdmin> {
  if (!UUID_V4.test(reportId)) throw new Error('Identificador de relato invalido.')
  const body = await requisitarAdmin(accessToken, { action: 'detail', protocol: reportId })
  if (!isRecord(body) || !isRecord(body.report) || !Array.isArray(body.updates) || !Array.isArray(body.attachments)) {
    throw new Error('O servidor retornou detalhes invalidos do relato.')
  }

  const r = body.report
  if (r.id !== reportId || !['anonymous', 'identified'].includes(String(r.identity)) ||
      !Number.isSafeInteger(r.revision) || (r.revision as number) < 0) {
    throw new Error('O servidor retornou dados invalidos do relato.')
  }
  const report: RelatoDetalheAdmin['report'] = {
    id: requiredText(r.id),
    protocol_code: requiredText(r.protocol_code),
    category: requiredText(r.category),
    unit: optionalText(r.unit),
    created_at: requiredText(r.created_at),
    status: checkedStatus(r.status),
    revision: r.revision as number,
    occurred_at: optionalText(r.occurred_at),
    people: optionalText(r.people),
    description: requiredText(r.description),
    identity: r.identity as 'anonymous' | 'identified',
    reporter_name: optionalText(r.reporter_name),
    reporter_email: optionalText(r.reporter_email),
    updated_at: requiredText(r.updated_at),
  }

  return {
    report,
    updates: body.updates.map((item: unknown) => {
      if (!isRecord(item)) throw new Error('Historico invalido retornado pelo servidor.')
      return {
        id: requiredText(item.id),
        status: checkedStatus(item.status),
        public_message: optionalText(item.public_message),
        internal_note: optionalText(item.internal_note),
        created_at: requiredText(item.created_at),
      }
    }),
    attachments: body.attachments.map((item: unknown) => {
      if (!isRecord(item) || typeof item.size_bytes !== 'number' || !Number.isFinite(item.size_bytes)) {
        throw new Error('Dados de evidencia invalidos retornados pelo servidor.')
      }
      return {
        id: requiredText(item.id),
        original_name: requiredText(item.original_name),
        mime_type: requiredText(item.mime_type),
        size_bytes: item.size_bytes,
        created_at: requiredText(item.created_at),
        url: safeEvidenceUrl(item.url),
      }
    }),
  }
}

/**
 * Unico comando de escrita oferecido pelo painel: altera o status e acrescenta
 * um registro no historico publico/interno. Nao envia dados originais, nem
 * permite exclusao, edicao de anexos ou arquivamento.
 */
export async function atualizarTratamentoRelatoAdmin(
  accessToken: string,
  params: {
    reportId: string
    revision: number
    status: StatusRelatoAdmin
    publicMessage: string
    internalNote: string
  },
): Promise<AtualizacaoRelatoAdmin> {
  if (!UUID_V4.test(params.reportId) || !Number.isSafeInteger(params.revision) || params.revision < 0 ||
      !STATUS_VALIDOS.includes(params.status) ||
      params.publicMessage.length > 4000 || params.internalNote.length > 10000) {
    throw new Error('Confira os dados da atualizacao.')
  }

  const body = await requisitarAdmin(accessToken, {
    action: 'update',
    protocol: params.reportId,
    revision: params.revision,
    status: params.status,
    publicMessage: params.publicMessage.trim(),
    internalNote: params.internalNote.trim(),
  })
  if (!isRecord(body) || !Number.isSafeInteger(body.revision) || !STATUS_VALIDOS.includes(String(body.status))) {
    throw new Error('O servidor nao confirmou os dados da atualizacao.')
  }
  return { revision: body.revision as number, status: body.status as StatusRelatoAdmin }
}
