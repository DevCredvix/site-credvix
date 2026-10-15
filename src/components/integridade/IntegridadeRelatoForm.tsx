import { useState, type ChangeEvent } from 'react'
import { AlertCircle, ClipboardCopy, Download, FileText, Paperclip, ShieldCheck, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CtaButton } from '../ui/CtaButton'
import { enviarRelato } from '../../services/integridadeApi'
import styles from './IntegridadeRelatoForm.module.css'

const categories = [
  { title: 'Assédio moral', description: 'Humilhação, perseguição ou intimidação.' },
  { title: 'Assédio sexual', description: 'Abordagem ou conduta sexual inadequada.' },
  { title: 'Discriminação', description: 'Tratamento preconceituoso ou desigual.' },
  { title: 'Fraude ou corrupção', description: 'Desvio, favorecimento, suborno ou falsificação.' },
  { title: 'Uso indevido de informações', description: 'Exposição ou utilização imprópria de dados.' },
  { title: 'Outra conduta inadequada', description: 'Situação não contemplada nas opções acima.' },
] as const

const MAX_FILES = 10
const MAX_FILE_SIZE = 25 * 1024 * 1024
const ACCEPTED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'message/rfc822',
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/wav', 'audio/x-wav',
  'video/mp4', 'video/quicktime',
])

const reportSchema = z.object({
  category: z.string().min(1, 'Selecione uma categoria.'),
  description: z.string().trim().min(30, 'Descreva a situação com pelo menos 30 caracteres.').max(10000),
  unit: z.string().max(160),
  when: z.string().max(160),
  people: z.string().max(500),
  identity: z.enum(['anonymous', 'identified']),
  name: z.string().max(120),
  email: z.string().max(254),
  goodFaith: z.boolean().refine(Boolean, 'Confirme a declaração de boa-fé.'),
  website: z.string(),
}).superRefine((value, ctx) => {
  if (value.identity !== 'identified') return
  if (!value.name.trim()) {
    ctx.addIssue({ code: 'custom', path: ['name'], message: 'Informe seu nome.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
    ctx.addIssue({ code: 'custom', path: ['email'], message: 'Informe um e-mail válido.' })
  }
})

type ReportFormData = z.infer<typeof reportSchema>

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`
}

/**
 * Componente exclusivo do Canal de Integridade e renderizado somente após clique.
 * Sem integração de anexos habilitada: arquivos nunca são silenciosamente descartados.
 */
export function IntegridadeRelatoForm() {
  const [files, setFiles] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const [accessCode, setAccessCode] = useState('')

  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    mode: 'onTouched',
    defaultValues: {
      category: '', description: '', unit: '', when: '', people: '',
      identity: 'anonymous', name: '', email: '', goodFaith: false, website: '',
    },
  })

  const identity = watch('identity')
  const description = watch('description') || ''
  const integrationEnabled = Boolean(import.meta.env.VITE_INTEGRIDADE_API_URL?.trim())

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    setAttachmentError('')
    if (incoming.length === 0) return
    const next = [...files]
    let error = ''
    for (const file of incoming) {
      if (next.length >= MAX_FILES) { error = 'O limite é de 10 arquivos por relato.'; break }
      if (!ACCEPTED_MIME.has(file.type)) { error = `Formato não permitido: ${file.name}`; continue }
      if (file.size === 0 || file.size > MAX_FILE_SIZE) { error = `O arquivo ${file.name} deve ter até 25 MB.`; continue }
      const duplicate = next.some((saved) => saved.name === file.name && saved.size === file.size && saved.lastModified === file.lastModified)
      if (!duplicate) next.push(file)
    }
    setFiles(next)
    setAttachmentError(error)
  }

  async function submit(values: ReportFormData) {
    setSubmissionError('')
    if (files.length > 0) {
      setSubmissionError('O envio de anexos ainda está em homologação. Nenhum arquivo será enviado nesta versão. Para continuar sem evidências, remova os arquivos selecionados.')
      return
    }
    if (!integrationEnabled) {
      setSubmissionError('O formulário está em homologação. O recebimento real de relatos ainda não está habilitado neste ambiente.')
      return
    }
    try {
      const code = await enviarRelato({
        category: values.category,
        description: values.description,
        unit: values.unit,
        when: values.when,
        people: values.people,
        identity: values.identity,
        name: values.identity === 'identified' ? values.name : '',
        email: values.identity === 'identified' ? values.email : '',
        website: values.website,
      })
      setAccessCode(code)
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Não foi possível registrar o relato.')
    }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(accessCode) }
    catch { /* O código continua visível para cópia manual. */ }
  }

  function downloadCode() {
    const blob = new Blob([
      `Canal de Integridade Credvix\n\nCódigo de acompanhamento:\n${accessCode}\n\nGuarde este arquivo em local privado.`,
    ], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'codigo-de-acompanhamento-credvix.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (accessCode) {
    return (
      <div className={styles.formCard} role="status" aria-live="polite">
        <div className={styles.success}>
          <ShieldCheck size={44} strokeWidth={1.7} aria-hidden="true" />
          <p className={styles.eyebrow}>RELATO REGISTRADO</p>
          <h3>Seu relato foi recebido.</h3>
          <p>Guarde o código abaixo: ele permite acompanhar seu relato sem criar uma conta.</p>
          <div className={styles.codeBlock}>
            <span>Código de acompanhamento</span>
            <code>{accessCode}</code>
          </div>
          <div className={styles.successActions}>
            <button type="button" onClick={copyCode}><ClipboardCopy size={18} aria-hidden="true" /> Copiar código</button>
            <button type="button" onClick={downloadCode}><Download size={18} aria-hidden="true" /> Salvar em arquivo</button>
          </div>
          <p className={styles.hint}>Por segurança, não há recuperação automática do código. Salve-o antes de sair.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.formCard}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>REGISTRO DE RELATO</p>
          <h3 id="integridade-form-title">CONTE O QUE ACONTECEU.</h3>
          <p>Campos indicados com <strong>*</strong> são obrigatórios.</p>
        </div>
        <span className={styles.noLogin}><ShieldCheck size={14} aria-hidden="true" /> Sem login</span>
      </header>

      <form noValidate aria-labelledby="integridade-form-title" onSubmit={handleSubmit(submit)}>
        <div className={styles.honeypot} aria-hidden="true">
          <label>Website<input tabIndex={-1} autoComplete="off" {...register('website')} /></label>
        </div>

        <fieldset className={styles.sectionBlock} aria-describedby={errors.category ? 'erro-categoria' : undefined}>
          <legend className={styles.legend}>1. Qual é a situação? <span>*</span></legend>
          <small className={styles.categoryHint}>Selecione uma opção</small>
          <div className={styles.categories}>
            {categories.map(({ title, description: detail }) => (
              <label className={styles.category} key={title}>
                <input type="radio" value={title} {...register('category')} />
                <span className={styles.choiceText}><strong>{title}</strong><small>{detail}</small></span>
              </label>
            ))}
          </div>
          {errors.category && <p id="erro-categoria" className={styles.error} role="alert">{errors.category.message}</p>}
        </fieldset>

        <section className={styles.sectionBlock} aria-labelledby="relato-detalhes-title">
          <h4 id="relato-detalhes-title" className={styles.legend}>2. Descreva o ocorrido <span>*</span></h4>
          <label className={styles.field} htmlFor="relato-descricao">
            <strong>O que aconteceu?</strong>
            <textarea
              id="relato-descricao"
              rows={5}
              maxLength={10000}
              placeholder="Conte o que aconteceu, como ocorreu e qualquer detalhe que possa ajudar na apuração."
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
          </label>
          <div className={styles.helpRow}>
            <small>Descreva com pelo menos 30 caracteres.</small>
            <small>{description.length.toLocaleString('pt-BR')} / 10.000</small>
          </div>
          {errors.description && <p className={styles.error} role="alert">{errors.description.message}</p>}

          <div className={styles.twoColumns}>
            <label className={styles.field} htmlFor="relato-unidade">
              <strong>Unidade, loja ou setor (opcional)</strong>
              <input id="relato-unidade" maxLength={160} placeholder="Ex.: Loja Centro, Financeiro" {...register('unit')} />
            </label>
            <label className={styles.field} htmlFor="relato-quando">
              <strong>Quando aconteceu? (opcional)</strong>
              <input id="relato-quando" maxLength={160} placeholder="Ex.: 09/09/2026, à tarde" {...register('when')} />
            </label>
          </div>
          <label className={styles.field} htmlFor="relato-envolvidos">
            <strong>Pessoas envolvidas ou testemunhas (opcional)</strong>
            <input id="relato-envolvidos" maxLength={500} placeholder="Nomes, funções ou outras informações, se souber" {...register('people')} />
          </label>
        </section>

        <section className={styles.sectionBlock} aria-labelledby="relato-evidencias-title">
          <div className={styles.rowHeading}>
            <h4 id="relato-evidencias-title" className={styles.legend}>3. Deseja adicionar evidências?</h4>
            <small>Opcional</small>
          </div>
          <label className={styles.filePicker} htmlFor="relato-arquivos">
            <span className={styles.fileIcon}><Paperclip size={19} strokeWidth={1.8} aria-hidden="true" /></span>
            <span><strong>Selecionar arquivos</strong><small>Imagens, PDFs, áudios e vídeos · até 10 arquivos, 25 MB cada.</small></span>
          </label>
          <input
            id="relato-arquivos"
            className={styles.fileInput}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,message/rfc822,audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/wav,video/mp4,video/quicktime"
            onChange={onFileChange}
          />
          {files.length > 0 && (
            <div className={styles.fileList} aria-label="Arquivos selecionados">
              {files.map((file, index) => (
                <div className={styles.fileItem} key={`${file.name}-${file.size}-${file.lastModified}`}>
                  <FileText size={16} aria-hidden="true" />
                  <span>{file.name} <small>({formatBytes(file.size)})</small></span>
                  <button type="button" aria-label={`Remover ${file.name}`} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}>
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {attachmentError && <p className={styles.error} role="alert">{attachmentError}</p>}
          <p className={styles.fileNote}>O envio de anexos depende da integração final com o canal original.</p>
        </section>

        <fieldset className={styles.sectionBlock}>
          <legend className={styles.legend}>4. Como deseja enviar?</legend>
          <div className={styles.identities}>
            <label className={styles.identityChoice}>
              <input type="radio" value="anonymous" {...register('identity')} />
              <span className={styles.choiceText}>
                <strong>Quero permanecer anônimo</strong>
                <small>Sem informar nome ou e-mail.</small>
              </span>
            </label>
            <label className={styles.identityChoice}>
              <input type="radio" value="identified" {...register('identity')} />
              <span className={styles.choiceText}>
                <strong>Quero me identificar</strong>
                <small>Informe seus dados para eventual contato.</small>
              </span>
            </label>
          </div>
          {identity === 'identified' && (
            <div className={styles.twoColumns}>
              <label className={styles.field} htmlFor="relato-nome">
                <strong>Nome <span>*</span></strong>
                <input id="relato-nome" autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.name)} {...register('name')} />
                {errors.name && <small className={styles.inlineError}>{errors.name.message}</small>}
              </label>
              <label className={styles.field} htmlFor="relato-email">
                <strong>E-mail <span>*</span></strong>
                <input id="relato-email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} {...register('email')} />
                {errors.email && <small className={styles.inlineError}>{errors.email.message}</small>}
              </label>
            </div>
          )}
          <p className={styles.privacyNote}>
            <AlertCircle size={18} aria-hidden="true" />
            Evite incluir dados pessoais que não sejam necessários no relato. Arquivos anexados também podem conter informações que identifiquem pessoas.
          </p>
        </fieldset>

        <div className={styles.finalSection}>
          <label className={styles.goodFaith}>
            <input type="checkbox" {...register('goodFaith')} />
            <span>Confirmo que as informações relatadas foram prestadas de boa-fé e representam, da melhor forma possível, os fatos que desejo comunicar. <strong>*</strong></span>
          </label>
          {errors.goodFaith && <p className={styles.error} role="alert">{errors.goodFaith.message}</p>}

          {submissionError && <p className={styles.error} role="alert">{submissionError}</p>}
          <div className={styles.submitRow}>
            <p>
              {integrationEnabled
                ? 'Ao enviar, você receberá um código exclusivo para acompanhamento.'
                : 'Ao concluir na versão oficial, será gerado um código exclusivo para acompanhamento.'}
            </p>
            <CtaButton type="submit" label={isSubmitting ? 'Enviando...' : 'Enviar relato'} variant="amber" disabled={isSubmitting} />
          </div>
        </div>
      </form>
    </div>
  )
}
