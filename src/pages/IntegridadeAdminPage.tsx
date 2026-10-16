import { useEffect, useState, type FormEvent } from 'react'
import { IntegridadeAdminDashboard } from '../components/integridade/admin/IntegridadeAdminDashboard'
import { autenticarRevisor, type SessaoRevisor } from '../services/integridadeAdminApi'
import { usePageMetadata } from '../hooks/usePageMetadata'
import styles from './IntegridadeAdminPage.module.css'

/**
 * /admin - nao aparece na navegacao publica. A seguranca de dados e feita
 * pela Edge Function reporting-channel, NAO pelo fato de a rota ser discreta.
 * Os detalhes e atualizacoes serao implementados em etapa posterior.
 */
export default function IntegridadeAdminPage() {
  usePageMetadata('Painel do Canal', 'Área reservada aos revisores autorizados do Canal de Integridade.')

  const [session, setSession] = useState<SessaoRevisor | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const meta = existing ?? document.createElement('meta')
    const previous = existing?.content ?? ''
    if (!existing) {
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex,nofollow,noarchive'
    return () => {
      if (existing) meta.content = previous
      else meta.remove()
    }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    if (!email || !password) {
      setError('Informe e-mail e senha para continuar.')
      return
    }

    setPending(true)
    setError('')
    try {
      const authorizedSession = await autenticarRevisor(email, password)
      setSession(authorizedSession)
      form.reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar no painel.')
      const input = form.elements.namedItem('password')
      if (input instanceof HTMLInputElement) input.value = ''
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={styles.section} aria-labelledby="integridade-admin-titulo">
      <div className="cvx-shell">
        {session ? (
          <IntegridadeAdminDashboard
            session={session}
            onLogout={(reason) => {
              setSession(null)
              setError(reason ?? '')
            }}
          />
        ) : (
          <div className={styles.card}>
            <p className={styles.eyebrow}>ÁREA RESTRITA</p>
            <h1 id="integridade-admin-titulo">PAINEL DO CANAL</h1>
            <p className={styles.intro}>
              Acesso exclusivo a revisores autorizados. Entre com o e-mail corporativo
              e a senha cadastrados.
            </p>
            <form className={styles.form} onSubmit={handleLogin} aria-busy={pending}>
              <div className={styles.field}>
                <label htmlFor="integridade-admin-email">E-mail</label>
                <input
                  id="integridade-admin-email"
                  name="email"
                  type="email"
                  placeholder="E-mail"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={pending}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="integridade-admin-senha">Senha</label>
                <input
                  id="integridade-admin-senha"
                  name="password"
                  type="password"
                  placeholder="********************"
                  autoComplete="current-password"
                  autoCapitalize="off"
                  required
                  disabled={pending}
                />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button type="submit" className={styles.submit} disabled={pending}>
                {pending ? 'Verificando acesso...' : 'Entrar no painel'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
