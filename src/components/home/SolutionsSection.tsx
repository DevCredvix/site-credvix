import { Banknote, MapPin, MessageSquareText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './SolutionsSection.module.css'

interface SolutionCard {
  title: string
  description: string
  icon: LucideIcon
}

const solutionCards: SolutionCard[] = [
  {
    title: 'CRÉDITO CONSIGNADO',
    description:
      'Conheça a modalidade de crédito apresentada pela Credvix e consulte as condições aplicáveis.',
    icon: Banknote,
  },
  {
    title: 'ATENDIMENTO PERSONALIZADO',
    description:
      'Uma conversa para compreender necessidades e apresentar informações com clareza.',
    icon: MessageSquareText,
  },
  {
    title: 'ENCONTRE UMA UNIDADE',
    description:
      'Localize uma loja perto de você para iniciar seu atendimento presencial.',
    icon: MapPin,
  },
]

export function SolutionsSection() {
  return (
    <section className={styles.section} aria-labelledby="solucoes-credvix-title">
      <div className="cvx-shell">
        <div className={styles.heading}>
          <p className={styles.eyebrow}>SOLUÇÕES CREDVIX</p>
          <h2 id="solucoes-credvix-title" className={styles.title}>
            O CRÉDITO COMEÇA COM
            <span>UMA BOA CONVERSA.</span>
          </h2>
          <p className={styles.description}>
            Conheça a modalidade destacada na nossa apresentação institucional e saiba
            como procurar atendimento.
          </p>
        </div>

        <div className={styles.showcase}>
          <figure className={styles.photoFrame}>
            <img
              src="/home/equipe-loja-credvix.webp"
              alt="Equipe da Credvix reunida em ambiente interno, usando uniformes laranja e roxo."
              width={1400}
              height={1000}
              loading="lazy"
              decoding="async"
            />

            <div className={styles.cards}>
              {solutionCards.map(({ title, description, icon: Icon }) => (
                <article key={title} className={styles.card}>
                  <div className={styles.cardIcon} aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className={styles.cardBody}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </figure>
        </div>

        <div className={styles.actions}>
          <CtaButton to="/lojas" label="Encontrar uma loja" variant="amber" />
        </div>
      </div>
    </section>
  )
}
