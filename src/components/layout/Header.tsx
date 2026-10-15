import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { headerNavigation } from '../../app/navigation'
import { SocialLinks } from './SocialLinks'
import { CtaButton } from '../ui/CtaButton'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const isCurrent = (to: string) => {
    if (to.startsWith('/#')) {
      if (location.pathname !== '/') return false
      return location.hash ? to === `/${location.hash}` : to === '/#quem-somos'
    }
    return location.pathname === to
  }

  return (
    <header className="relative z-50 w-full bg-paper pb-2 pt-4 sm:pt-5" aria-label="Cabeçalho do site">
      <div className="cvx-shell">
        <div className="flex min-h-[68px] w-full items-center justify-between gap-3 rounded-full border border-white/80 bg-surface px-4 shadow-[0_5px_25px_rgba(23,20,17,0.065)] sm:px-6 xl:gap-4">
        {/* Logotipos enviados para esta etapa — sem recriacao em texto. */}
        <Link
          to="/"
          aria-label="Credvix e Help! — voltar para a página inicial"
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-sm sm:gap-3"
        >
          <img
            src="/brand/logo-credvix.svg"
            alt="Credvix"
            width={156}
            height={32}
            className="h-auto w-[91px] sm:w-[124px]"
            fetchPriority="high"
          />
          <span className="h-7 w-px bg-[#e6ddd7]" aria-hidden="true" />
          <img
            src="/brand/logo-help.svg"
            alt="Help!"
            width={77}
            height={44}
            className="h-auto w-[45px] sm:w-[58px]"
            fetchPriority="high"
          />
        </Link>

        {/* Desktop: navegacao horizontal central como na referencia. */}
        <nav aria-label="Navegação principal" className="hidden min-w-0 items-center justify-center gap-4 xl:flex">
          {headerNavigation.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              aria-current={isCurrent(to) ? (to.startsWith('/#') ? 'location' : 'page') : undefined}
              className={`whitespace-nowrap rounded-sm font-heading text-[11px] font-semibold tracking-[-0.015em] transition-colors hover:text-action 2xl:text-[12px] ${isCurrent(to) ? 'text-action' : 'text-ink/80'}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <SocialLinks />
          <CtaButton to="/lojas" label="Encontrar uma loja" />
        </div>

        {/* Tablet e mobile: CTA visivel e menu acessivel. */}
        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <div className="hidden sm:block">
            <CtaButton to="/lojas" label="Encontrar uma loja" />
          </div>
          <div className="sm:hidden">
            <CtaButton to="/lojas" label="Encontrar uma loja" compact ariaLabel="Encontrar uma loja da Credvix" />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={menuOpen}
            aria-controls="credvix-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-full border border-stroke bg-white text-ink transition-colors hover:border-action hover:text-action"
          >
            {menuOpen ? <X size={21} strokeWidth={2} aria-hidden="true" /> : <Menu size={21} strokeWidth={2} aria-hidden="true" />}
          </button>
        </div>
        </div>
      </div>

      <div
        id="credvix-mobile-menu"
        className={`${menuOpen ? 'block' : 'hidden'} cvx-shell mt-3 rounded-[24px] border border-stroke bg-surface p-4 shadow-[0_12px_35px_rgba(23,20,17,0.07)] xl:hidden`}
      >
        <nav aria-label="Navegação móvel" className="flex flex-col">
          {headerNavigation.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              aria-current={isCurrent(to) ? (to.startsWith('/#') ? 'location' : 'page') : undefined}
              className={`flex min-h-11 items-center rounded-xl px-4 font-heading text-sm font-semibold transition-colors hover:bg-paper hover:text-action ${isCurrent(to) ? 'bg-paper text-action' : 'text-ink'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stroke px-2 pt-3">
          <SocialLinks mobile />
          <CtaButton to="/lojas" label="Encontrar uma loja" onClick={() => setMenuOpen(false)} />
        </div>
      </div>
    </header>
  )
}
