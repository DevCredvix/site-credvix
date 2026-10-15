import type { ReactNode } from 'react'

interface PageScaffoldProps {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PageScaffold({ eyebrow, title, description, children }: PageScaffoldProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-action">{eyebrow}</p>
      <h1 className="max-w-3xl text-3xl font-bold leading-tight text-ink sm:text-5xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted">{description}</p>
      {children}
      <div className="mt-12 rounded-2xl border border-stroke bg-surface p-6 sm:p-10">
        <p className="font-heading text-lg font-semibold text-ink">Estrutura da pagina pronta</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Aqui entra o design aprovado. Nenhum formulario ou integracao de producao foi ativado nesta base.
        </p>
      </div>
    </section>
  )
}
