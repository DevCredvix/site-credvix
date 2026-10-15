import { ShieldCheck } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './IntegridadeHero.module.css'

/**
 * Hero exclusiva do Canal de Integridade.
 * O escudo original já inclui os dois cards informativos do Figma.
 * Não contém nenhuma função de envio ou acesso a relatos.
 */
interface IntegridadeHeroProps {
  onStartRelato: () => void
}

export function IntegridadeHero({ onStartRelato }: IntegridadeHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="integridade-hero-title">
      <div className="cvx-shell">
        <div className={styles.container}>
          <div className={styles.content}>
            <h1 id="integridade-hero-title" className={styles.title}>
              <span>SUA VOZ IMPORTA.</span>
              <span>E MERECE</span>
              <span><strong>PROTEÇÃO.</strong></span>
            </h1>

            <p className={styles.description}>
              Este é um espaço para registrar situações que precisam ser apuradas
              com responsabilidade. Você pode fazer seu relato sem se identificar
              e sem criar uma conta.
            </p>

            <div className={styles.actions}>
              <CtaButton
                onClick={onStartRelato}
                label="Registrar um relato"
                variant="amber"
              />
              <p className={styles.hint}>
                <ShieldCheck size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>Identificação opcional</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
