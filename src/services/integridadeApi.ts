/**
 * Contrato de envio preservado do projeto Dev-CredVix/canal-integridade.
 * A API da Edge Function precisa ser explicitamente habilitada no .env.local
 * APÓS validar origens permitidas, políticas de acesso e fluxo de anexos.
 * Nunca incluir service_role ou outros segredos no frontend.
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

function gerarSegredo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function enviarRelato(relato: DadosRelato): Promise<string> {
  const endpoint = import.meta.env.VITE_INTEGRIDADE_API_URL?.trim()
  if (!endpoint) throw new Error('Envio indisponível: a integração ainda está em homologação.')
  const secret = gerarSegredo()
  const requestId = crypto.randomUUID()
  const payload = {
    action: 'submit',
    requestId,
    secret,
    website: relato.website,
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
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Não foi possível conectar ao canal. Tente novamente mais tarde.')
  }
  const body: { protocol?: unknown; error?: unknown } = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Não foi possível concluir o envio.')
  if (typeof body.protocol !== 'string' || !body.protocol.trim()) {
    throw new Error('O servidor não retornou um protocolo válido. Contate o suporte do canal.')
  }
  return `${body.protocol}.${secret}`
}
