import { CtaButton } from '../ui/CtaButton'
import styles from './CtaBannerSection.module.css'

export function CtaBannerSection() {
  return (
    <section className={styles.section} aria-labelledby="cta-banner-title">
      <div className="cvx-shell">
        <div className={styles.banner}>
          <div className={styles.art} aria-hidden="true">
            <img src="/home/cta-badge.svg" alt="" width={420} height={398} loading="lazy" decoding="async" />
          </div>

          <div className={styles.content}>
            <p className={styles.eyebrow}>VAMOS CONVERSAR?</p>
            <h2 id="cta-banner-title" className={styles.title}>
              ENCONTRE
              <span>ATENDIMENTO PERTO DE</span>
              <span>VOCÊ.</span>
            </h2>

            <p className={styles.description}>
              O próximo passo pode ser simples: localize uma unidade Credvix e fale
              com quem está pronto pra ouvir você.
            </p>

            <div className={styles.action}>
              <CtaButton to="/lojas" label="Encontrar uma loja" variant="dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
