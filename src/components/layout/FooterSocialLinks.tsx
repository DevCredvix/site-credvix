import type { SVGProps } from 'react'
import styles from './Footer.module.css'

type SocialNetwork = 'instagram' | 'facebook' | 'linkedin'

const networks: { network: SocialNetwork; label: string; url: string }[] = [
  { network: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/credvix/' },
  { network: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/credvix.oficial/' },
  { network: 'linkedin', label: 'LinkedIn', url: 'https://br.linkedin.com/company/credvix' },
]

/**
 * Redes sociais usam símbolos vetoriais próprios de marca.
 * Lucide é reservado aos ícones de interface (como a seta de navegação).
 * Ícones locais garantem que a aparência do Header não seja modificada.
 */
function SocialBrandIcon({
  network,
  ...props
}: SVGProps<SVGSVGElement> & { network: SocialNetwork }) {
  if (network === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <rect x="2.3" y="2.3" width="19.4" height="19.4" rx="5.6" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.6" r="1.3" fill="currentColor" />
      </svg>
    )
  }

  if (network === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.096 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.026 1.792-4.697 4.532-4.697 1.312 0 2.686.235 2.686.235v2.967h-1.513c-1.491 0-1.955.93-1.955 1.885v2.271h3.328l-.532 3.49h-2.796V24C19.613 23.096 24 18.1 24 12.073Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.56h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.287ZM5.337 7.433a2.063 2.063 0 1 1 0-4.125 2.063 2.063 0 0 1 0 4.125Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.793 0 0 .774 0 1.729v20.542C0 23.228.793 24 1.771 24h20.451C23.2 24 24 23.228 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

export function FooterSocialLinks() {
  return (
    <div className={styles.socialLinks} role="group" aria-label="Redes sociais da Credvix">
      {networks.map(({ network, label, url }) => (
        <a
          key={network}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} da Credvix (abre em nova aba)`}
          className={styles.socialLink}
        >
          <SocialBrandIcon network={network} width={19} height={19} />
        </a>
      ))}
    </div>
  )
}
