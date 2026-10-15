import { MapPin, Search } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './VagasHero.module.css'

/**
 * Hero exclusiva de Vagas.
 * Usa a mesma logica aprovada da Home: arte em background à direita
 * e oculta abaixo de 1141px, preservando a .cvx-shell global.
 */
export function VagasHero() {
  return (
    <section className={styles.hero} aria-labelledby="vagas-hero-title">
      <div className="cvx-shell">
        <div className={styles.container}>
          <div className={styles.content}>
            <h1 id="vagas-hero-title" className={styles.title}>
              <span>SEU TALENTO.</span>
              <span>
                NOSSA <strong>PRÓXIMA</strong>
              </span>
              <span>CONQUISTA.</span>
            </h1>

            <p className={styles.description}>
              Gente que acredita em gente. Explore nossas oportunidades e
              encontre seu próximo passo profissional com a Credvix.
            </p>

            <div className={styles.actions}>
              <CtaButton
                to="/vagas#oportunidades"
                label="Ver vagas disponíveis"
                variant="amber"
                icon={Search}
              />

              <p className={styles.hint}>
                <MapPin size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>O próximo passo pode começar em uma de nossas unidades.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
