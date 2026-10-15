import { MapPin, Search } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './LojasHero.module.css'

/**
 * Hero exclusiva da rota /lojas.
 * O CTA aponta para a secao de busca que sera implementada na proxima etapa.
 * Header e Footer permanecem os componentes globais existentes.
 */
export function LojasHero() {
  return (
    <section className={styles.hero} aria-labelledby="lojas-hero-title">
      <div className="cvx-shell">
        <div className={styles.layout}>
          <div className={styles.content}>
            <h1 id="lojas-hero-title" className={styles.title}>
              <span>CRÉDITO COM</span>
              <span>
                MAIS <strong>PROXIMIDADE.</strong>
              </span>
              <span>MAIS VOCÊ.</span>
            </h1>

            <p className={styles.description}>
              A gente acredita que um bom atendimento começa com proximidade.
              Encontre uma unidade Credvix e help! e converse com nossa equipe
              pessoalmente.
            </p>

            <div className={styles.actions}>
              <CtaButton
                to="/lojas#encontre"
                label="Buscar loja mais próxima"
                variant="amber"
                icon={Search}
              />

              <p className={styles.hint}>
                <MapPin size={19} strokeWidth={1.85} aria-hidden="true" />
                <span>O próximo passo pode começar em uma de nossas unidades.</span>
              </p>
            </div>
          </div>

          <div className={styles.artwork}>
            <img
              src="/lojas/map-brasil.svg"
              alt="Mapa ilustrado do Brasil em tons de laranja, com marcador de localização e destaque para atendimento presencial."
              width={653}
              height={715}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
