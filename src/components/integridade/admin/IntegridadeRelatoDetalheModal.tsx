import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, FileText, ShieldCheck, X } from 'lucide-react'
import { CtaButton } from '../../ui/CtaButton'
import {
  atualizarTratamentoRelatoAdmin,
  obterDetalheRelatoAdmin,
  RevisaoRelatoConflitoError,
  SessaoRevisorExpiradaError,
  type RelatoDetalheAdmin,
  type RelatoResumoAdmin,
  type StatusRelatoAdmin,
} from '../../../services/integridadeAdminApi'
import { STATUS_RELATO_LABEL } from './IntegridadeRelatoCard'
import styles from './IntegridadeRelatoDetalheModal.module.css'

type StatusChoice = 'in_review' | 'closed' | null

type Props = {
  summary: RelatoResumoAdmin
  accessToken: string
  onClose: () => void
  onUnauthorized: () => void
  onSaved: (report: Pick<RelatoResumoAdmin, 'id' | 'status' | 'revision'>) => void
}

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : DATE_FORMAT.format(date)
}

function formatFileSize(bytes: number) {
  return bytes < 1048576
    ? `${Math.max(1, Math.ceil(bytes / 1024))} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`
}

function CampoLeitura({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.readonlyField}>
      <span>{label}</span>
      <p>{value.trim() || 'Não informado'}</p>
    </div>
  )
}

/**
 * Os dados da denuncia sao SOMENTE leitura. A unica gravacao disponivel e a
 * acao `update` do backend, restrita a status e novas mensagens do historico.
 * Abrir o modal nao muda o status inicial `received`.
 */
export function IntegridadeRelatoDetalheModal({ summary, accessToken, onClose, onUnauthorized, onSaved }: Props) {
  const [detail, setDetail] = useState<RelatoDetalheAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  // Relatos recebidos nao possuem opcao marcada ate o revisor escolher.
  const [choice, setChoice] = useState<StatusChoice>(null)
  const [publicMessage, setPublicMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const requestCloseRef = useRef<() => void>(() => {})
  const unauthorizedRef = useRef(onUnauthorized)
  unauthorizedRef.current = onUnauthorized

  const currentStatus = detail?.report.status ?? summary.status
  // Permite registrar somente uma nota sem mudar o status (inclusive 'received').
  const requestedStatus: StatusRelatoAdmin = choice ?? currentStatus
  const statusChanged = requestedStatus !== currentStatus
  const hasMessage = Boolean(publicMessage.trim() || internalNote.trim())
  const unsavedChanges = statusChanged || hasMessage
  const canSave = Boolean(detail && !saving && unsavedChanges)

  function requestClose() {
    if (saving) return
    if (unsavedChanges && !window.confirm(
      'Você tem alterações não salvas neste relato. Deseja sair sem salvar?',
    )) return
    onClose()
  }
  requestCloseRef.current = requestClose

  // Modal real: foco contido, Escape, scroll do fundo bloqueado e foco restaurado.
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current
      if (!dialog) return
      if (event.key === 'Escape') {
        event.preventDefault()
        requestCloseRef.current()
      }
      if (event.key !== 'Tab') return
      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    function onFocus(event: FocusEvent) {
      const dialog = dialogRef.current
      if (dialog && event.target instanceof Node && !dialog.contains(event.target)) dialog.focus()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocus)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocus)
      previouslyFocused?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setDetail(null)
    obterDetalheRelatoAdmin(accessToken, summary.id)
      .then((result) => {
        if (!active) return
        setDetail(result)
        // 'received': nenhum radio marcado. Demais estados: opcao atual marcada.
        setChoice(result.report.status === 'received' ? null : result.report.status)
      })
      .catch((cause: unknown) => {
        if (!active) return
        if (cause instanceof SessaoRevisorExpiradaError) unauthorizedRef.current()
        else setError(cause instanceof Error ? cause.message : 'Não foi possível consultar o relato.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [accessToken, summary.id])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || !canSave) return
    setSaving(true)
    setError('')
    setFeedback('')
    const original = detail.report

    try {
      const updated = await atualizarTratamentoRelatoAdmin(accessToken, {
        reportId: original.id,
        revision: original.revision,
        status: requestedStatus,
        publicMessage,
        internalNote,
      })
      // O backend gravou: atualiza a listagem ANTES da consulta complementar.
      onSaved({ id: original.id, status: updated.status, revision: updated.revision })
      setChoice(updated.status === 'received' ? null : updated.status)
      setPublicMessage('')
      setInternalNote('')
      setDetail((current) => current ? {
        ...current,
        report: { ...current.report, status: updated.status, revision: updated.revision },
      } : current)
      setFeedback('Atualização salva. A resposta pública e a nota interna foram registradas no histórico.')
      try {
        const refreshed = await obterDetalheRelatoAdmin(accessToken, original.id)
        setDetail(refreshed)
      } catch (refreshError) {
        if (refreshError instanceof SessaoRevisorExpiradaError) {
          unauthorizedRef.current()
          return
        }
        setFeedback('Atualização salva, mas não foi possível recarregar o histórico. Feche e reabra o relato para consultar a versão atual.')
      }
    } catch (cause) {
      if (cause instanceof SessaoRevisorExpiradaError) {
        unauthorizedRef.current()
        return
      }
      if (cause instanceof RevisaoRelatoConflitoError) {
        try {
          const refreshed = await obterDetalheRelatoAdmin(accessToken, original.id)
          setDetail(refreshed)
          onSaved({ id: original.id, status: refreshed.report.status, revision: refreshed.report.revision })
          setChoice(refreshed.report.status === 'received' ? null : refreshed.report.status)
        } catch (refreshError) {
          if (refreshError instanceof SessaoRevisorExpiradaError) {
            unauthorizedRef.current()
            return
          }
        }
      }
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a atualização.')
    } finally {
      setSaving(false)
    }
  }

  const report = detail?.report
  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestCloseRef.current()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="integridade-admin-modal-title"
        aria-describedby="integridade-admin-modal-description"
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.close}
          onClick={() => requestCloseRef.current()}
          disabled={saving}
          aria-label="Fechar detalhes do relato"
        ><X size={21} aria-hidden="true" /></button>

        <div className={styles.modalBody}>
          <header className={styles.header}>
            <div>
              <p className={styles.kicker} id="integridade-admin-modal-description">ÁREA RESTRITA · DETALHES DO RELATO</p>
              <h2 id="integridade-admin-modal-title">{report?.category ?? summary.category}</h2>
              <p className={styles.protocol}>{report?.protocol_code ?? summary.protocol_code}</p>
              <p className={styles.date}>Criado em {formatDate(report?.created_at ?? summary.created_at)}</p>
            </div>
            <span className={styles.statusBadge} data-status={currentStatus}>
              {STATUS_RELATO_LABEL[currentStatus]}
            </span>
          </header>

          {loading ? (
            <div className={styles.loading} role="status" aria-live="polite">Carregando informações do relato...</div>
          ) : !detail || !report ? (
            <div className={styles.loading} role="alert">
              <AlertCircle size={24} aria-hidden="true" />
              <p>{error || 'Não foi possível carregar os detalhes.'}</p>
              <button type="button" className={styles.retry} onClick={() => requestCloseRef.current()}>Voltar aos relatos</button>
            </div>
          ) : (
            <>
              <section className={styles.section} aria-labelledby="detalhe-dados-title">
                <h3 id="detalhe-dados-title">Dados do relato</h3>
                <p className={styles.readOnlyHint}><ShieldCheck size={15} aria-hidden="true" /> Informações originais protegidas contra alterações.</p>
                <div className={styles.metaGrid}>
                  <CampoLeitura label="UNIDADE / SETOR" value={report.unit} />
                  <CampoLeitura label="QUANDO OCORREU" value={report.occurred_at} />
                  <CampoLeitura label="IDENTIFICAÇÃO" value={report.identity === 'anonymous' ? 'Anônimo' : 'Identificado'} />
                  <CampoLeitura label="PESSOAS ENVOLVIDAS" value={report.people} />
                  {report.identity === 'identified' && (
                    <>
                      <CampoLeitura label="NOME DO DENUNCIANTE" value={report.reporter_name} />
                      <CampoLeitura label="E-MAIL DO DENUNCIANTE" value={report.reporter_email} />
                    </>
                  )}
                </div>
              </section>

              <section className={styles.section} aria-labelledby="detalhe-descricao-title">
                <h3 id="detalhe-descricao-title">Descrição</h3>
                <p className={styles.description}>{report.description}</p>
              </section>

              <section className={styles.section} aria-labelledby="detalhe-evidencias-title">
                <h3 id="detalhe-evidencias-title">Evidências ({detail.attachments.length})</h3>
                {detail.attachments.length ? (
                  <div className={styles.files}>
                    {detail.attachments.map((file) => (
                      <div className={styles.file} key={file.id}>
                        <FileText size={22} strokeWidth={1.6} aria-hidden="true" />
                        <div className={styles.fileInfo}>
                          <strong>{file.original_name}</strong>
                          <span>{file.mime_type} · {formatFileSize(file.size_bytes)} · {formatDate(file.created_at)}</span>
                        </div>
                        {file.url ? (
                          <a className={styles.openFile} href={file.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                            Abrir
                          </a>
                        ) : (
                          <span className={styles.fileUnavailable}>Link indisponível</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyText}>Nenhuma evidência anexada.</p>
                )}
              </section>

              <section className={styles.section} aria-labelledby="detalhe-historico-title">
                <h3 id="detalhe-historico-title">Histórico</h3>
                {detail.updates.length ? (
                  <div className={styles.history}>
                    {detail.updates.map((item) => (
                      <article className={styles.historyItem} key={item.id}>
                        <strong>{STATUS_RELATO_LABEL[item.status]}</strong>
                        {item.public_message && <p><b>Mensagem ao denunciante:</b> {item.public_message}</p>}
                        {item.internal_note && <p><b>Nota interna:</b> {item.internal_note}</p>}
                        <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyText}>Nenhuma atualização registrada até o momento.</p>
                )}
              </section>

              <section className={styles.updateSection} aria-labelledby="detalhe-atualizar-title">
                <h3 id="detalhe-atualizar-title">Atualizar tratamento</h3>
                <form onSubmit={save} aria-busy={saving}>
                  <fieldset className={styles.statusFieldset} disabled={saving}>
                    <legend>Alteração de status</legend>
                    <div className={styles.statusOptions}>
                      <label className={styles.statusOption} data-selected={choice === 'in_review'}>
                        <input
                          type="radio" name="novo-status" value="in_review"
                          checked={choice === 'in_review'}
                          onChange={() => setChoice('in_review')}
                        />
                        <span>
                          <strong>Em análise</strong>
                          <small>Manter o relato em tratamento ou reabri-lo.</small>
                        </span>
                      </label>
                      <label className={styles.statusOption} data-selected={choice === 'closed'}>
                        <input
                          type="radio" name="novo-status" value="closed"
                          checked={choice === 'closed'}
                          onChange={() => setChoice('closed')}
                        />
                        <span>
                          <strong>Encerrado</strong>
                          <small>Concluir o tratamento deste relato.</small>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <label className={styles.textareaLabel} htmlFor="admin-resposta-publica">
                    <strong>Nota ao denunciante</strong>
                    <small>Visível para quem consultar o código de acompanhamento.</small>
                    <textarea
                      id="admin-resposta-publica"
                      rows={3}
                      maxLength={4000}
                      value={publicMessage}
                      onChange={(event) => setPublicMessage(event.target.value)}
                      placeholder="Opcional. Escreva uma resposta pública."
                      disabled={saving}
                    />
                  </label>
                  <label className={styles.textareaLabel} htmlFor="admin-nota-interna">
                    <strong>Nota interna</strong>
                    <small>Visível exclusivamente aos revisores autorizados.</small>
                    <textarea
                      id="admin-nota-interna"
                      rows={3}
                      maxLength={10000}
                      value={internalNote}
                      onChange={(event) => setInternalNote(event.target.value)}
                      placeholder="Opcional. Registre uma observação interna."
                      disabled={saving}
                    />
                  </label>

                  {error && <p className={styles.error} role="alert"><AlertCircle size={18} aria-hidden="true" /> {error}</p>}
                  {feedback && <p className={styles.feedback} role="status"><CheckCircle2 size={18} aria-hidden="true" /> {feedback}</p>}
                  <div className={styles.actions}>
                    <CtaButton
                      type="submit"
                      label={saving ? 'Salvando...' : 'Salvar atualização'}
                      variant="amber"
                      disabled={!canSave}
                    />
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
