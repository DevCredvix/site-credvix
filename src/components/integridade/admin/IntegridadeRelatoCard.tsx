import { Clock3, KeyRound, MapPin } from 'lucide-react'
import type { RelatoResumoAdmin, StatusRelatoAdmin } from '../../../services/integridadeAdminApi'
import styles from './IntegridadeRelatoCard.module.css'

export const STATUS_RELATO_LABEL: Record<StatusRelatoAdmin, string> = {
  received: 'Recebido',
  in_review: 'Em análise',
  closed: 'Encerrado',
}

type IntegridadeRelatoCardProps = {
  relato: RelatoResumoAdmin
  selected: boolean
  onSelect: (relato: RelatoResumoAdmin) => void
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Data indisponível'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

/**
 * Resumo selecionavel. Na proxima etapa, onSelect podera abrir o modal de
 * detalhes. Os campos exibidos sao somente os retornados pela acao 'list'.
 */
export function IntegridadeRelatoCard({ relato, selected, onSelect }: IntegridadeRelatoCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      data-selected={selected ? 'true' : undefined}
      onClick={() => onSelect(relato)}
      aria-pressed={selected}
      aria-label={`${relato.category}. ${STATUS_RELATO_LABEL[relato.status]}. Protocolo ${relato.protocol_code}. Selecionar relato.`}
    >
      <div className={styles.heading}>
        <h3 className={styles.title}>{relato.category}</h3>
        <span className={styles.badge} data-status={relato.status}>
          {STATUS_RELATO_LABEL[relato.status]}
        </span>
      </div>
      <div className={styles.details}>
        <span className={styles.detail}>
          <MapPin size={20} strokeWidth={1.9} aria-hidden="true" />
          <span className={styles.unit}>{relato.unit.trim() || 'Unidade não informada'}</span>
        </span>
        <span className={styles.detail}>
          <Clock3 size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>{formatDate(relato.created_at)}</span>
        </span>
        <span className={styles.detail}>
          <KeyRound size={20} strokeWidth={1.9} aria-hidden="true" />
          <span className={styles.protocol}>{relato.protocol_code}</span>
        </span>
      </div>
    </button>
  )
}
