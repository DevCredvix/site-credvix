import { useState, type ChangeEvent, type FormEvent } from 'react'
import { FileText, Paperclip, Search } from 'lucide-react'
import { CtaButton } from '../components/ui/CtaButton'
import { usePageMetadata } from '../hooks/usePageMetadata'
import {
  ACCEPTED_FILE_TYPES, MAX_FILES, anexosDisponiveis, canalDisponivel,
  consultarRelato, enviarEvidencia, lerCodigoAcesso, listarEvidencias, validarEvidencia,
  type Evidencia, type RelatoConsultado,
} from '../services/integridadeApi'
import styles from './AcompanharIntegridadePage.module.css'

const etapas = [
  { key: 'received', label: 'Recebido' },
  { key: 'in_review', label: 'Em análise' },
  { key: 'closed', label: 'Encerrado' },
] as const
const rotulos: Record<string, string> = {
  received: 'Recebido', in_review: 'Em análise', closed: 'Encerrado',
}

function dataLocal(value: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function tamanhoArquivo(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`
}

export default function AcompanharIntegridadePage() {
  usePageMetadata(
    'Acompanhar relato',
    'Consulte o andamento, as atualizações públicas e suas evidências pelo código do Canal de Integridade Credvix.',
  )
  const [inputCode, setInputCode] = useState('')
  const [activeCode, setActiveCode] = useState('')
  const [report, setReport] = useState<RelatoConsultado | null>(null)
  const [attachments, setAttachments] = useState<Evidencia[]>([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [attachmentsError, setAttachmentsError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  async function loadAttachments(code: string) {
    setAttachmentsError('')
    try {
      const list = await listarEvidencias(code)
      setAttachments(list)
      setReport((previous) => previous ? {
        ...previous, attachmentCount: Math.max(previous.attachmentCount, list.length),
      } : previous)
    } catch (error) {
      setAttachmentsError(error instanceof Error ? error.message : 'Não foi possível carregar os anexos.')
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || uploading) return
    setLookupError('')
    setAttachmentsError('')
    setUploadMessage('')
    setReport(null)
    setAttachments([])
    setActiveCode('')
    const parsed = lerCodigoAcesso(inputCode)
    if (!parsed) {
      setLookupError('Confira o código completo, incluindo o ponto e a chave de acesso.')
      return
    }
    setBusy(true)
    try {
      const result = await consultarRelato(parsed.code)
      setReport(result)
      setActiveCode(parsed.code)
      await loadAttachments(parsed.code)
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Não foi possível consultar o relato.')
    } finally {
      setBusy(false)
    }
  }

  async function handleEvidenceChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (!chosen.length || !activeCode || !report || report.status === 'closed' || uploading) return
    setUploadMessage('')
    const remaining = MAX_FILES - Math.max(report.attachmentCount, attachments.length)
    if (chosen.length > remaining) {
      setUploadMessage(`Este relato aceita mais ${Math.max(0, remaining)} anexo(s), até o limite de ${MAX_FILES}.`)
      return
    }
    const invalid = chosen.map(validarEvidencia).find((message) => message !== null)
    if (invalid) { setUploadMessage(invalid); return }
    if (!anexosDisponiveis) {
      setUploadMessage('O envio de evidências ainda não foi configurado neste ambiente.')
      return
    }
    setUploading(true)
    const failed: string[] = []
    let uploaded = 0
    try {
      for (const [index, file] of chosen.entries()) {
        setUploadMessage(`Enviando anexo ${index + 1} de ${chosen.length}: ${file.name}`)
        try {
          await enviarEvidencia(activeCode, file)
          uploaded += 1
        } catch {
          failed.push(file.name)
        }
      }
      setUploadMessage(failed.length
        ? `${uploaded} anexo(s) registrado(s). Não foi possível anexar: ${failed.join(', ')}. Você pode tentar novamente.`
        : `${uploaded} anexo(s) registrado(s) com sucesso.`)
      await loadAttachments(activeCode)
    } finally {
      setUploading(false)
    }
  }

  const currentStage = etapas.findIndex((stage) => stage.key === report?.status)
  const canUpload = Boolean(
    report && activeCode && report.status !== 'closed' &&
    Math.max(report.attachmentCount, attachments.length) < MAX_FILES,
  )

  return (
    <section className={styles.page} aria-labelledby="acompanhar-title">
      <div className="cvx-shell">
        <div className={styles.container}>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>CANAL DE INTEGRIDADE</p>
            <h1 id="acompanhar-title">ACOMPANHE SEU RELATO</h1>
            <p>Consulte o andamento e as atualizações públicas com o código recebido após o envio, sem login.</p>
          </header>

          <div className={`${styles.card} ${styles.searchCard}`}>
            <form className={styles.searchForm} onSubmit={handleLookup} noValidate>
              <label htmlFor="integridade-code">Código completo de acompanhamento</label>
              <div className={styles.searchRow}>
                <input
                  id="integridade-code"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={inputCode}
                  onChange={(event) => setInputCode(event.currentTarget.value)}
                  placeholder="CD-000123.xxxxxxxxxxxxxxxxxxxxxx"
                  disabled={busy || uploading}
                  aria-invalid={Boolean(lookupError)}
                  aria-describedby="integridade-code-help"
                  required
                />
                <CtaButton
                  type="submit"
                  label={busy ? 'Consultando...' : 'Consultar'}
                  ariaLabel={busy ? 'Consultando relato' : 'Consultar relato'}
                  icon={Search}
                  variant="amber"
                  className={styles.searchCta}
                  disabled={busy || uploading || !canalDisponivel}
                />
              </div>
              <p id="integridade-code-help" className={styles.help}>
                Use o código inteiro (protocolo + ponto + chave). Ele é pessoal: não o compartilhe.
              </p>
              {!canalDisponivel && <p className={styles.error} role="alert">A consulta ainda não está configurada neste ambiente.</p>}
              {lookupError && <p className={styles.error} role="alert">{lookupError}</p>}
            </form>
          </div>

          {report && (
            <div className={styles.result} aria-live="polite">
              <article className={`${styles.card} ${styles.resultCard}`} aria-labelledby="andamento-title">
                <header className={styles.resultHeader}>
                  <div className={styles.resultHeading}>
                    <p className={styles.eyebrow}>ACOMPANHAMENTO</p>
                    <h2 id="andamento-title">Andamento do relato</h2>
                    <p className={styles.muted}>Protocolo {report.protocol} · enviado em {dataLocal(report.createdAt)}</p>
                  </div>
                  <span className={styles.status} data-status={report.status}>
                    {rotulos[report.status] ?? report.status}
                  </span>
                </header>

                <div className={styles.progressSection}>
                  <ol className={styles.timeline} aria-label="Etapas do tratamento do relato">
                    {etapas.map((stage, index) => (
                      <li
                        className={styles.timelineItem}
                        key={stage.key}
                        data-completed={index <= currentStage}
                        aria-current={index === currentStage ? 'step' : undefined}
                      >
                        <span className={styles.timelineCircle}>{index + 1}</span>
                        <strong>{stage.label}</strong>
                      </li>
                    ))}
                  </ol>
                </div>

                <section className={styles.updatesSection} aria-labelledby="atualizacoes-title">
                  <h3 id="atualizacoes-title" className={styles.sectionTitle}>Atualizações públicas</h3>
                  {report.updates.length ? (
                    <ol className={styles.updates}>
                      {report.updates.map((update, index) => (
                        <li key={`${update.createdAt}-${index}`}>
                          <strong className={styles.updateTitle}>{rotulos[update.status] ?? update.status}</strong>
                          {update.message && <p>{update.message}</p>}
                          <time dateTime={update.createdAt}>{dataLocal(update.createdAt)}</time>
                        </li>
                      ))}
                    </ol>
                  ) : <p className={styles.muted}>Ainda não existem mensagens públicas adicionais para este relato.</p>}
                </section>

                <section className={styles.evidenceSection} aria-labelledby="evidencias-title">
                  <div className={styles.evidenceHeading}>
                    <div>
                      <h3 id="evidencias-title" className={styles.sectionTitle}>Evidências anexadas</h3>
                      <p className={styles.muted}>Até {MAX_FILES} arquivos, de no máximo 25 MB cada.</p>
                    </div>
                    <span className={styles.fileCounter}>{Math.max(attachments.length, report.attachmentCount)}/{MAX_FILES}</span>
                  </div>
                  {attachmentsError && (
                    <div className={styles.error} role="alert">
                      {attachmentsError}
                      <button type="button" onClick={() => void loadAttachments(activeCode)}>Tentar novamente</button>
                    </div>
                  )}
                  {attachments.length ? (
                    <ul className={styles.fileList}>
                      {attachments.map((file, index) => (
                        <li key={`${file.name}-${file.createdAt}-${index}`}>
                          <FileText size={24} aria-hidden="true" />
                          <div>
                            <strong>{file.name}</strong>
                            <small>{file.mimeType} · {tamanhoArquivo(file.sizeBytes)} · {dataLocal(file.createdAt)}</small>
                          </div>
                          {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Abrir</a>}
                        </li>
                      ))}
                    </ul>
                  ) : !attachmentsError && <p className={styles.muted}>Nenhuma evidência anexada até o momento.</p>}
                  {canUpload && (
                    <div className={styles.uploadArea}>
                      <label htmlFor="integridade-novos-anexos" className={styles.filePicker}>
                        <Paperclip size={21} aria-hidden="true" /> {uploading ? 'Enviando evidências...' : 'Adicionar evidências'}
                      </label>
                      <input
                        id="integridade-novos-anexos"
                        type="file"
                        multiple
                        accept={ACCEPTED_FILE_TYPES}
                        disabled={uploading || !anexosDisponiveis}
                        onChange={(event) => void handleEvidenceChange(event)}
                        className={styles.visuallyHidden}
                      />
                    </div>
                  )}
                  {report.status === 'closed' && <p className={styles.help}>Este relato está encerrado e não recebe novos anexos.</p>}
                  {uploadMessage && <p className={styles.uploadMessage} role="status" aria-live="polite">{uploadMessage}</p>}
                </section>
              </article>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
