/**
 * O portal de vagas da Sólides e a UNICA fonte de oportunidades.
 * Este manifesto e gerado exclusivamente pelo sincronizador autorizado.
 * Se o manifesto estiver ausente, invalido ou desatualizado, nao exibimos vagas.
 */
export type VagaSolides = {
  id: string
  url: string
  title: string
  location: string
  state: string
  salary: string
  postedLabel: string
  workMode: string
  seniority: string
}

export const SOLIDES_PORTAL = 'https://credvix.vagas.solides.com.br/'
const FRESHNESS_MS = 18 * 60 * 60 * 1000
const VALID_STATES = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])
const VALID_MODES = new Set(['', 'Presencial', 'Híbrido', 'Remoto'])
const VALID_SENIORITIES = new Set([
  '', 'Junior', 'Júnior', 'Pleno', 'Sênior', 'Senior', 'Especialista', 'Estagiário',
  'Aprendiz', 'Trainee', 'Principal',
])

export class VagasNaoConfirmadasError extends Error {
  constructor() {
    super('Não foi possível confirmar as vagas abertas no portal oficial agora.')
    this.name = 'VagasNaoConfirmadasError'
  }
}

function isObject(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === 'object' && !Array.isArray(input)
}

/** Nunca permite link fora do portal da empresa, protocolo inseguro ou ID divergente. */
function validateUrl(raw: unknown, id: string): string | null {
  if (typeof raw !== 'string') return null
  try {
    const url = new URL(raw)
    if (url.origin !== 'https://credvix.vagas.solides.com.br' ||
      (url.pathname !== `/vaga/${id}` && url.pathname !== `/vaga/${id}/`) ||
      url.hash || url.username || url.password) return null
    return url.toString()
  } catch { return null }
}

export function validarManifestoVagas(raw: unknown, agora = Date.now()): VagaSolides[] {
  if (!isObject(raw) || raw.source !== SOLIDES_PORTAL || typeof raw.verifiedAt !== 'string' || !Array.isArray(raw.jobs)) {
    throw new VagasNaoConfirmadasError()
  }
  // A lista manual de quatro vagas nao prova que o indice esta completo.
  // Exigimos que a coleta venha de todas as paginas oficiais e que o total
  // informado pela fonte coincida com o total de vagas verificadas.
  if (raw.verificationMethod !== 'live-browser-index' ||
      typeof raw.indexCount !== 'number' || !Number.isInteger(raw.indexCount) ||
      raw.indexCount < 0 || raw.indexCount !== raw.jobs.length) {
    throw new VagasNaoConfirmadasError()
  }
  const verificadoEm = Date.parse(raw.verifiedAt)
  if (!Number.isFinite(verificadoEm) || verificadoEm > agora + 2 * 60_000 || agora - verificadoEm > FRESHNESS_MS) {
    throw new VagasNaoConfirmadasError()
  }
  const ids = new Set<string>()
  const result: VagaSolides[] = []
  for (const item of raw.jobs) {
    if (!isObject(item) || item.open !== true || typeof item.id !== 'string' || !/^\d{3,12}$/.test(item.id) ||
      typeof item.title !== 'string' || !item.title.trim() || item.title.length > 240) {
      throw new VagasNaoConfirmadasError()
    }
    if (ids.has(item.id)) throw new VagasNaoConfirmadasError()
    const url = validateUrl(item.url, item.id)
    if (!url) throw new VagasNaoConfirmadasError()
    const fields = ['location', 'state', 'salary', 'postedLabel', 'workMode', 'seniority'] as const
    if (fields.some((field) => typeof item[field] !== 'string')) throw new VagasNaoConfirmadasError()
    if (item.state && !VALID_STATES.has(item.state as string) ||
        !VALID_MODES.has(item.workMode as string) || !VALID_SENIORITIES.has(item.seniority as string)) {
      throw new VagasNaoConfirmadasError()
    }
    ids.add(item.id)
    result.push({
      id: item.id,
      url,
      title: item.title.trim(),
      location: item.location as string,
      state: item.state as string,
      salary: item.salary as string,
      postedLabel: item.postedLabel as string,
      workMode: item.workMode as string,
      seniority: item.seniority as string,
    })
  }
  return result
}

export async function buscarVagasAbertas(signal?: AbortSignal): Promise<VagaSolides[]> {
  let response: Response
  try {
    response = await fetch('/vagas-solides.json', { cache: 'no-store', signal })
  } catch {
    throw new VagasNaoConfirmadasError()
  }
  if (!response.ok) throw new VagasNaoConfirmadasError()
  const body: unknown = await response.json().catch(() => null)
  return validarManifestoVagas(body)
}
