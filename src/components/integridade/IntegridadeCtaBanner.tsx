import { CtaButton } from '../ui/CtaButton'
import styles from './IntegridadeCtaBanner.module.css'

/**
 * Banner final exclusivo da pagina Canal de Integridade.
 * Reaproveita o SVG do banner de Vagas e o CtaButton compartilhado.
 * Nao altera nem monta o formulario de relatos ou o fluxo de acompanhamento.
 */
export function IntegridadeCtaBanner() {
  return (
    <section className={styles.section} aria-labelledby="integridade-banner-title">
      <div className="cvx-shell">
        <div className={styles.banner}>
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

          <div className={styles.content}>
            <p className={styles.eyebrow}>JÁ ENVIOU UM RELATO?</p>
            <h2 id="integridade-banner-title" className={styles.title}>
              ACOMPANHE O ANDAMENTO
              <span>COM SEU CÓDIGO.</span>
            </h2>
            <p className={styles.description}>
              Use o código completo recebido após o envio para consultar o
              andamento e as atualizações públicas, sem fazer login.
            </p>
          </div>

          <div className={styles.action}>
            <CtaButton
              type="button"
              onClick={() => {}}
              label="Acompanhar relato"
              variant="dark"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
