import { ArrowUpRight, Clock3, Instagram, MapPin, Phone } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import type { Store } from './storeTypes'
import styles from './StoreCard.module.css'

/** Ícone oficial do WhatsApp em SVG, sem dependências adicionais. */
function WhatsAppIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.52 3.48A11.87 11.87 0 0 0 12.05 0C5.47 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.94 11.94 0 0 0 5.8 1.48h.01C18.64 23.84 24 18.48 24 11.9a11.85 11.85 0 0 0-3.48-8.42ZM12.06 21.8a9.92 9.92 0 0 1-5.05-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.87 9.87 0 0 1-1.52-5.23c0-5.46 4.45-9.91 9.92-9.91a9.85 9.85 0 0 1 7.02 2.91A9.85 9.85 0 0 1 22 11.9c0 5.46-4.46 9.9-9.94 9.9Zm5.44-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.8-1.49-1.78-1.66-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.07 4.47.71.31 1.27.49 1.7.62.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  )
}

interface StoreCardProps {
  store: Store
}

/**
 * Card de loja do localizador. A fotografia do Figma era uma ilustração do
 * layout: endereço, contatos e horário vêm exclusivamente das planilhas.
 */
export function StoreCard({ store }: StoreCardProps) {
  const whatsappUrl = store.whatsappDigits
    ? `https://wa.me/${store.whatsappDigits}?text=${encodeURIComponent(
        `Olá! Encontrei a loja ${store.name} no site da Credvix e gostaria de mais informações.`,
      )}`
    : null

  const instagramUrl = store.instagram
    ? `https://www.instagram.com/${store.instagram}/`
    : null

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${store.address}, ${store.uf}, Brasil`,
  )}`

  return (
    <article className={styles.card} aria-labelledby={`store-${store.id}`}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          ATENDIMENTO PRESENCIAL
        </span>
        <span className={styles.stateBadge} aria-label={`Estado ${store.uf}`}>
          {store.uf}
        </span>
      </div>

      <h3 id={`store-${store.id}`} className={styles.name}>
        {store.name}
      </h3>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <MapPin size={20} strokeWidth={1.9} aria-hidden="true" />
          <p>{store.address}</p>
        </div>
        <div className={styles.detailRow}>
          <Phone size={19} strokeWidth={1.9} aria-hidden="true" />
          <p>
            {store.phone && store.phoneDigits ? (
              <a href={`tel:+55${store.phoneDigits}`} className={styles.phoneLink}>
                {store.phone}
              </a>
            ) : (
              'Telefone não informado'
            )}
          </p>
        </div>
        <div className={`${styles.detailRow} ${styles.hours}`}>
          <Clock3 size={19} strokeWidth={1.9} aria-hidden="true" />
          <p>
            {store.hours ? `Horário informado: ${store.hours}` : 'Horário a confirmar com a unidade'}
          </p>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.socialActions}>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Conversar com a unidade ${store.name} pelo WhatsApp`}
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          ) : (
            <span className={`${styles.socialLink} ${styles.unavailable}`}>
              <WhatsAppIcon />
              Sem WhatsApp
            </span>
          )}
          {instagramUrl ? (
            <a
              href={instagramUrl}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir Instagram da unidade ${store.name}`}
            >
              <Instagram size={19} strokeWidth={2} aria-hidden="true" />
              Instagram
            </a>
          ) : (
            <span className={`${styles.socialLink} ${styles.unavailable}`}>
              <Instagram size={19} strokeWidth={2} aria-hidden="true" />
              Sem Instagram
            </span>
          )}
        </div>

        <CtaButton
          href={mapsUrl}
          target="_blank"
          label="Ver no Google Maps"
          variant="amber"
          icon={ArrowUpRight}
          className={styles.mapsCta}
          ariaLabel={`Ver no Google Maps: ${store.name}, ${store.uf}`}
        />
      </div>
    </article>
  )
}
