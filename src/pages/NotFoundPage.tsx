import { Link } from 'react-router-dom'
import { usePageMetadata } from '../hooks/usePageMetadata'

export default function NotFoundPage() {
  usePageMetadata('Pagina nao encontrada', 'A pagina solicitada nao foi encontrada.')
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <p className="font-bold text-action">404</p>
      <h1 className="mt-3 text-3xl font-bold text-ink">Pagina nao encontrada</h1>
      <p className="mt-4 text-muted">O endereco informado nao corresponde a uma pagina deste site.</p>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-action px-5 py-3 font-semibold text-white">
        Voltar para Home
      </Link>
    </section>
  )
}
