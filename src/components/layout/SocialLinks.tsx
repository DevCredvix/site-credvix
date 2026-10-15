import type { SVGProps } from 'react'

type SocialNetwork = 'instagram' | 'facebook' | 'linkedin'

type BrandIconProps = SVGProps<SVGSVGElement> & {
  network: SocialNetwork
}

// Logomarcas de redes sociais sao SVGs de marca, nao icones da biblioteca.
// Lucide permanece a unica biblioteca de icones de interface do projeto.
function BrandSocialIcon({ network, ...props }: BrandIconProps) {
  if (network === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.6" r="1.25" fill="currentColor" />
      </svg>
    )
  }

  if (network === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        {/* Logo Facebook com recorte correto do "f" (o anterior ocultava a letra). */}
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.096 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.026 1.792-4.697 4.532-4.697 1.312 0 2.686.235 2.686.235v2.967h-1.513c-1.491 0-1.955.93-1.955 1.885v2.271h3.328l-.532 3.49h-2.796V24C19.613 23.096 24 18.1 24 12.073Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.3 2.5H4.7A2.2 2.2 0 0 0 2.5 4.7v14.6a2.2 2.2 0 0 0 2.2 2.2h14.6a2.2 2.2 0 0 0 2.2-2.2V4.7a2.2 2.2 0 0 0-2.2-2.2ZM8.3 18.25H5.6V9.8h2.7v8.45ZM6.95 8.63a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12Zm11.3 9.62h-2.7v-4.1c0-.98-.02-2.25-1.37-2.25-1.38 0-1.59 1.07-1.59 2.18v4.17h-2.7V9.8h2.6v1.16h.04a2.84 2.84 0 0 1 2.55-1.4c2.73 0 3.17 1.8 3.17 4.14v4.55Z" />
    </svg>
  )
}

const socialLinks: { network: SocialNetwork; label: string; href: string }[] = [
  { network: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/credvix/' },
  { network: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/credvix.oficial/' },
  { network: 'linkedin', label: 'LinkedIn', href: 'https://br.linkedin.com/company/credvix' },
]

export function SocialLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-label="Redes sociais da Credvix">
      {socialLinks.map(({ network, href, label }) => (
        <a
          key={network}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} da Credvix (abre em nova aba)`}
          className={`inline-flex items-center justify-center rounded-full text-ink/75 transition-colors hover:bg-paper hover:text-action focus-visible:outline-offset-1 ${mobile ? 'size-11' : 'size-9'}`}
        >
          <BrandSocialIcon network={network} width={mobile ? 19 : 17} height={mobile ? 19 : 17} />
        </a>
      ))}
    </div>
  )
}
