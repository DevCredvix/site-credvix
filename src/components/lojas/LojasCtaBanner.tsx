import { CtaButton } from '../ui/CtaButton'
import styles from './LojasCtaBanner.module.css'

/** CTA institucional da pagina Lojas. Nao interfere no filtro nem no Footer. */
export function LojasCtaBanner() {
  return (
    <section className={styles.section} aria-labelledby="lojas-banner-title">
      <div className="cvx-shell">
        <div className={styles.banner}>
          <div className={styles.content}>
            <p className={styles.eyebrow}>VAMOS CONVERSAR?</p>
            <h2 id="lojas-banner-title" className={styles.title}>
              ENCONTRE ATENDIMENTO PERTO DE VOCÊ.
            </h2>
            <p className={styles.description}>
              O próximo passo pode ser simples: localize uma unidade Credvix e fale
              com quem está pronto para ouvir.
            </p>
          </div>

          <div className={styles.action}>
            <CtaButton to="/lojas#encontre" label="Ver todas as lojas" variant="dark" />
          </div>

          <img
            className={styles.artwork}
            src="/vagas/cred-circle-mark.svg"
            alt=""
            width={420}
            height={179}
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
