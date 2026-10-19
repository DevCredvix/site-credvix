import { CtaButton } from '../ui/CtaButton'
import styles from './VagasCtaBanner.module.css'

/**
 * Banner final exclusivo da pagina Vagas.
 * O grafismo enviado pelo Figma e decorativo, com recorte intencional
 * dentro da caixa. O botao usa o CTA compartilhado, sem recriar estilos.
 */
export function VagasCtaBanner() {
  return (
    <section className={styles.section} aria-labelledby="vagas-cta-title">
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
            <p className={styles.eyebrow}>VAMOS CRESCER JUNTOS?</p>
            <h2 id="vagas-cta-title" className={styles.title}>
              O PRÓXIMO PASSO PODE SER AQUI.
            </h2>
            <p className={styles.description}>
              Conheça nossa área de oportunidades e acompanhe as vagas que combinam
              com o seu perfil.
            </p>
          </div>

          <div className={styles.action}>
            <CtaButton
              href="https://credvix.vagas.solides.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              label="Ver todas as vagas"
              variant="dark"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
