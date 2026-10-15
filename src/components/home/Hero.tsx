import { MapPin } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './Hero.module.css'

/**
 * Etapa 02: Hero exclusiva da Home.
 * A marca-modelo e um fundo decorativo exclusivamente desktop, via CSS.
 * O Header e o Footer permanecem compartilhados com as demais rotas.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className="cvx-shell">
        <div className={styles.container}>
          <div className={styles.content}>
            <h1 id="home-hero-title" className={styles.title}>
              <span>CRÉDITO COM</span>
              <span>
                MAIS <strong>PROXIMIDADE.</strong>
              </span>
              <span>MAIS VOCÊ.</span>
            </h1>

            <p className={styles.description}>
              Na Credvix, acreditamos em ouvir, compreender e oferecer um atendimento
              personalizado. Conheça nossa atuação em crédito consignado e encontre
              uma unidade perto de você.
            </p>

            <div className={styles.actions}>
              <CtaButton to="/lojas" label="Encontrar uma loja" variant="amber" />

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
