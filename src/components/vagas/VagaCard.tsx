import { ArrowUpRight, BriefcaseBusiness, CircleDollarSign, Clock3, MapPin } from 'lucide-react'
import type { VagaSolides } from '../../services/vagasSolides'
import styles from './VagaCard.module.css'

type Props = { vaga: VagaSolides }

/** Apenas o cargo no titulo: "CONSULTOR DE VENDAS - ARACRUZ" vira
 * "CONSULTOR DE VENDAS". Preserva nomes com hifen interno (ex.: Full-Stack).
 * O titulo integral permanece no manifesto para pesquisa e auditoria.
 */
export function tituloCargo(title: string): string {
  return title.split(/\s+[-–—]\s+/, 1)[0].trim() || title.trim()
}

/** Apenas o CTA abre o link da vaga; o card e informativo. */
export function VagaCard({ vaga }: Props) {
  const cargo = tituloCargo(vaga.title)
  return (
    <article className={styles.card}>
      <div className={styles.topline}>
        <span className={styles.open}><span className={styles.openDot} aria-hidden="true" />ABERTA</span>
        {vaga.state && <span className={styles.state}>{vaga.state}</span>}
      </div>

      <h3 className={styles.title}>{cargo}</h3>

      <div className={styles.details}>
        {vaga.location && (
          <div className={styles.detail}>
            <MapPin size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>{vaga.location}</span>
          </div>
        )}
        {vaga.salary && (
          <div className={styles.detail}>
            <CircleDollarSign size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>{vaga.salary}</span>
          </div>
        )}
        {vaga.postedLabel && (
          <div className={`${styles.detail} ${styles.posted}`}>
            <Clock3 size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>{vaga.postedLabel}</span>
          </div>
        )}
      </div>

      {(vaga.workMode || vaga.seniority) && (
        <div className={styles.tags}>
          {vaga.workMode && <span className={styles.tag}>{vaga.workMode}</span>}
          {vaga.seniority && <span className={styles.tag}>{vaga.seniority}</span>}
        </div>
      )}

      <div className={styles.bottom}>
        <a
          className={styles.ctaLink}
          href={vaga.url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          aria-label={`Ver vaga de ${cargo}${vaga.location ? ` em ${vaga.location}` : ''} na Sólides (abre em nova aba)`}
        >
          <span className={styles.ctaLabel}>
            <BriefcaseBusiness size={21} strokeWidth={1.8} aria-hidden="true" />
            Ver vaga
          </span>
          <span className={styles.ctaCircle} aria-hidden="true">
            <ArrowUpRight size={29} strokeWidth={1.65} />
          </span>
        </a>
      </div>
    </article>
  )
}
