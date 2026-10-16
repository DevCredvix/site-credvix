import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CircleCheck } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './IntegridadeSucessoModal.module.css'

type UploadState = {
  total: number
  uploaded: number
  failed: string[]
  inProgress: boolean
} | null

type IntegridadeSucessoModalProps = {
  accessCode: string
  uploadState: UploadState
}

/**
 * O código completo é mostrado somente nesta sessão e nunca é incluído
 * em URL, analytics, storage do navegador ou logs da aplicação.
 */
export function IntegridadeSucessoModal({ accessCode, uploadState }: IntegridadeSucessoModalProps) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLElement>(null)
  const [copyResult, setCopyResult] = useState<'idle' | 'copied' | 'error'>('idle')
  const [downloadRequested, setDownloadRequested] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  // F5, recarregar, fechar a guia/janela ou sair para outro site:
  // o navegador decide quando pode mostrar a confirmação nativa.
  // Mantemos o aviso também após fechar o modal, pois o código ainda
  // está disponível para reabertura durante esta visita.
  useEffect(() => {
    function confirmBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      // Compatibilidade com navegadores que exigem returnValue.
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', confirmBeforeUnload)
    return () => window.removeEventListener('beforeunload', confirmBeforeUnload)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    // A verificação seguinte mantém a lógica segura mesmo quando a ref ainda não está montada.
    const dialog = dialogRef.current!
    if (!dialog) return

    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.focus()

    function onKeyDown(event: KeyboardEvent) {
      // Escape permanece bloqueado; o clique fora exige confirmação explícita.
      if (event.key === 'Escape') {
        event.preventDefault()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex="0"]',
      )).filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || active === dialog)) {
        event.preventDefault()
        first.focus()
      }
    }

    function onFocus(event: FocusEvent) {
      if (!dialog) return

      if (event.target instanceof Node && !dialog.contains(event.target)) {
        dialog.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocus)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocus)
      document.body.style.overflow = previousBodyOverflow
      if (priorFocus?.isConnected) priorFocus.focus()
    }
  }, [isOpen])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(accessCode)
      setCopyResult('copied')
    } catch {
      setCopyResult('error')
    }
  }

  function saveCode() {
    try {
      const content = [
        'CANAL DE INTEGRIDADE — CREDVIX',
        '',
        'Código completo de acompanhamento:',
        accessCode,
        '',
        'Confidencial. Guarde este arquivo em um local privado.',
        'Este código é necessário para consultar seu relato.',
      ].join('\n')
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'codigo-de-acompanhamento-credvix.txt'
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownloadRequested(true)
    } catch {
      // O usuário ainda pode selecionar o código e copiá-lo manualmente.
      setDownloadRequested(false)
      setCopyResult('error')
    }
  }

  // A confirmação é sempre exibida, mesmo se a pessoa tiver clicado em copiar/salvar:
  // copiar para a área de transferência não garante que o código foi guardado.
  function confirmCodeSaved(destination: 'fechar' | 'acompanhar') {
    const nextAction = destination === 'fechar' ? 'fechar esta janela' : 'ir para o acompanhamento'
    return window.confirm(
      'Você confirma que já salvou o código de acompanhamento em um local seguro?\n\n' +
      'Ele é único e não poderá ser recuperado depois. Sem o código, você não poderá consultar seu relato.\n\n' +
      `Clique em OK para ${nextAction}, ou Cancelar para permanecer nesta tela.`,
    )
  }

  function closeModal() {
    // Nunca interromper os uploads: o relato já foi registrado no banco.
    if (uploadState?.inProgress) return
    if (!confirmCodeSaved('fechar')) return
    setIsOpen(false)
  }

  function goToTracking() {
    if (uploadState?.inProgress) return
    if (!confirmCodeSaved('acompanhar')) return
    navigate('/canal-de-integridade/acompanhar')
  }

  const uploadsComplete = !uploadState?.inProgress

  if (!isOpen) {
    return (
      <div className={styles.closedNotice} role="status">
        <CircleCheck size={28} strokeWidth={1.9} aria-hidden="true" />
        <div>
          <h3>Relato registrado com sucesso</h3>
          <p>Seu formulário foi concluído. Caso ainda precise copiar o código, reabra a confirmação antes de sair.</p>
        </div>
        <button type="button" onClick={() => setIsOpen(true)}>Reabrir código</button>
      </div>
    )
  }

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={(event) => {
        // Um clique dentro do card nunca deve fechá-lo.
        if (event.target === event.currentTarget) closeModal()
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="integridade-recebido-title"
        aria-describedby="integridade-recebido-description"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <CircleCheck className={styles.confirmIcon} size={54} strokeWidth={2.1} aria-hidden="true" />
          <h2 id="integridade-recebido-title">Relato recebido</h2>
          <p id="integridade-recebido-description">
            Seu relato foi registrado. Guarde o código abaixo: ele é a credencial necessária
            para acompanhar este relato sem fazer login.
          </p>
        </header>

        <section className={styles.codePanel} aria-labelledby="integridade-codigo-title">
          <h3 id="integridade-codigo-title">Código de acompanhamento</h3>
          <div className={styles.codeRow}>
            <code className={styles.codeValue} tabIndex={0} aria-label="Código completo de acompanhamento">
              {accessCode}
            </code>
            <button className={styles.copyButton} type="button" onClick={copyCode}>
              {copyResult === 'copied' ? 'Código copiado' : 'Copiar código'}
            </button>
          </div>
          {copyResult === 'copied' && (
            <p className={styles.codeFeedback} role="status">Código copiado. Guarde-o em local seguro.</p>
          )}
          {copyResult === 'error' && (
            <p className={styles.codeError} role="alert">
              Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente,
              ou use “Salvar código”.
            </p>
          )}
        </section>

        {uploadState?.inProgress ? (
          <div className={styles.uploadProgress} role="status" aria-live="polite">
            Relato registrado. Enviando anexos: {uploadState.uploaded} de {uploadState.total} concluído(s).
            Não feche esta página até terminar.
          </div>
        ) : uploadState?.failed.length ? (
          <div className={styles.uploadWarning} role="alert">
            {uploadState.uploaded} de {uploadState.total} anexo(s) vinculado(s). Não foi possível enviar:
            {' '}{uploadState.failed.join(', ')}. Guarde o código e adicione os arquivos restantes
            na página de acompanhamento. Não reenvie o relato.
          </div>
        ) : (
          <div className={styles.uploadSuccess} role="status">
            {uploadState?.total
              ? `${uploadState.uploaded} anexo(s) enviado(s) com sucesso e vinculado(s) ao relato.`
              : 'Relato registrado com sucesso. Nenhum anexo foi selecionado.'}
          </div>
        )}

        <div className={styles.safetyWarning}>
          <AlertTriangle size={26} strokeWidth={2} aria-hidden="true" />
          <p>
            <strong>Guarde este código em segurança: ele é único e gerado somente uma vez.</strong>
            {' '}Salve o código antes de fechar a página.
          </p>
        </div>

        <div className={styles.actions}>
          <button className={styles.saveButton} type="button" onClick={saveCode}>
            Salvar código
          </button>
          <CtaButton
            type="button"
            label="Acompanhar relato"
            variant="amber"
            onClick={goToTracking}
            disabled={!uploadsComplete}
          />
        </div>
        {downloadRequested && (
          <p className={styles.downloadFeedback} role="status">
            Download solicitado. Confirme que o arquivo foi salvo em seu dispositivo.
          </p>
        )}
      </section>
    </div>,
    document.body,
  )
}
