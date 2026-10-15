import { useState } from 'react'
import { ArrowLeft, Check, ClipboardCopy, Download, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePageMetadata } from '../hooks/usePageMetadata'
import { enviarRelato } from '../services/integridadeApi'
import styles from './RelatarIntegridadePage.module.css'

const categorias = [
  'Assédio moral',
  'Assédio sexual',
  'Discriminação',
  'Fraude ou corrupção',
  'Uso indevido de informações',
  'Outra conduta inadequada',
] as const

const schema = z.object({
  category: z.string().min(1, 'Selecione a categoria da situação.'),
  description: z.string().trim().min(30, 'Descreva o ocorrido com pelo menos 30 caracteres.').max(10000),
  unit: z.string().max(160),
  when: z.string().max(160),
  people: z.string().max(500),
  identity: z.enum(['anonymous', 'identified']),
  name: z.string().max(120),
  email: z.string().max(254),
  goodFaith: z.boolean().refine(Boolean, 'Confirme a declaração de boa-fé.'),
  website: z.string(),
}).superRefine((data, ctx) => {
  if (data.identity !== 'identified') return
  if (!data.name.trim()) ctx.addIssue({ code: 'custom', path: ['name'], message: 'Informe seu nome.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    ctx.addIssue({ code: 'custom', path: ['email'], message: 'Informe um e-mail válido.' })
  }
})

type FormValues = z.infer<typeof schema>

const stages = [
  { number: 1, label: 'Categoria' },
  { number: 2, label: 'Detalhes' },
  { number: 3, label: 'Identificação' },
  { number: 4, label: 'Revisão' },
] as const

/**
 * Tela independente da landing. Não é exibida antes do clique nos CTAs.
 * A etapa de anexos e a validação final de integração serão feitas em patch específico.
 */
export default function RelatarIntegridadePage() {
  usePageMetadata('Registrar relato', 'Registre seu relato no Canal de Integridade Credvix.')
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState('')
  const [code, setCode] = useState('')
  const {
    register,
    getValues,
    trigger,
    setError,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: '', description: '', unit: '', when: '', people: '',
      identity: 'anonymous', name: '', email: '', goodFaith: false, website: '',
    },
    mode: 'onTouched',
    shouldUnregister: false,
  })
  const identity = watch('identity')
  const description = watch('description') || ''

  async function next() {
    if (step === 3 && getValues('identity') === 'identified') {
      const name = getValues('name').trim()
      const email = getValues('email').trim()
      if (!name) {
        setError('name', { type: 'manual', message: 'Informe seu nome.' })
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('email', { type: 'manual', message: 'Informe um e-mail válido.' })
        return
      }
    }
    const fields = step === 1 ? ['category'] : step === 2 ? ['description'] : ['identity', 'name', 'email']
    const valid = await trigger(fields as Array<keyof FormValues>)
    if (valid) {
      setServerError('')
      setStep((prev) => Math.min(4, prev + 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function submit(values: FormValues) {
    if (busy) return
    setServerError('')
    setBusy(true)
    try {
      const accessCode = await enviarRelato({
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
      setCode(accessCode)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Não foi possível enviar o relato.')
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(code) }
    catch { /* Valor continua visível para cópia manual. */ }
  }

  function downloadCode() {
    const blob = new Blob([`Canal de Integridade Credvix\n\nCódigo de acompanhamento:\n${code}\n\nGuarde este arquivo em local privado.`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codigo-de-acompanhamento-credvix.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={styles.page} aria-labelledby="integridade-form-title">
      <div className="cvx-shell">
        <div className={styles.narrow}>
          <Link className={styles.backLink} to="/canal-de-integridade">
            <ArrowLeft size={17} aria-hidden="true" /> Voltar ao Canal de Integridade
          </Link>

          {code ? (
            <div className={styles.success} role="status" aria-live="polite">
              <ShieldCheck size={43} strokeWidth={1.6} aria-hidden="true" />
              <h1 id="integridade-form-title">Relato recebido</h1>
              <p>Seu relato foi registrado. Guarde o código: ele é necessário para acompanhar o caso sem login.</p>
              <div className={styles.accessCode}>
                <span>Código de acompanhamento</span>
                <code>{code}</code>
              </div>
              <div className={styles.successActions}>
                <button type="button" onClick={copyCode}><ClipboardCopy size={18} /> Copiar código</button>
                <button type="button" onClick={downloadCode}><Download size={18} /> Salvar em arquivo</button>
              </div>
              <p className={styles.warning}>Por segurança, não fazemos recuperação automática do código. Guarde-o antes de fechar a página.</p>
            </div>
          ) : (
            <>
              <header className={styles.intro}>
                <p className={styles.eyebrow}>CANAL DE INTEGRIDADE</p>
                <h1 id="integridade-form-title">Conte o que aconteceu.</h1>
                <p>Você pode registrar o relato sem se identificar e sem criar uma conta.</p>
              </header>

              {!import.meta.env.VITE_INTEGRIDADE_API_URL && (
                <p className={styles.devNotice} role="status">
                  Formulário em homologação: o envio real ainda não foi habilitado neste ambiente.
                </p>
              )}

              <nav className={styles.progress} aria-label="Progresso do formulário">
                {stages.map((stage) => (
                  <div key={stage.number} className={styles.stage} data-active={stage.number === step} data-done={stage.number < step}>
                    <span>{stage.number < step ? <Check size={14} /> : stage.number}</span>
                    <strong>{stage.label}</strong>
                  </div>
                ))}
              </nav>

              <form className={styles.form} noValidate onSubmit={handleSubmit(submit)}>
                <div className={styles.honeypot} aria-hidden="true">
                  <label>Website<input tabIndex={-1} autoComplete="off" {...register('website')} /></label>
                </div>

                {step === 1 && (
                  <fieldset className={styles.fieldset}>
                    <legend>Qual é o tipo de situação?</legend>
                    <p>Selecione a categoria que mais se aproxima do ocorrido.</p>
                    <div className={styles.choices}>
                      {categorias.map((category) => (
                        <label key={category} className={styles.choice}>
                          <input type="radio" value={category} {...register('category')} />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                    {errors.category && <p className={styles.error} role="alert">{errors.category.message}</p>}
                  </fieldset>
                )}

                {step === 2 && (
                  <div className={styles.fields}>
                    <h2>Descreva o ocorrido</h2>
                    <p>Se souber, informe local, momento e pessoas envolvidas. Esses campos são opcionais.</p>
                    <div className={styles.fieldRow}>
                      <label>Unidade, loja ou setor<input maxLength={160} placeholder="Ex.: Loja Centro, RH" {...register('unit')} /></label>
                      <label>Quando aconteceu?<input maxLength={160} placeholder="Data ou período aproximado" {...register('when')} /></label>
                    </div>
                    <label>Pessoas envolvidas ou testemunhas<input maxLength={500} placeholder="Nomes, funções ou contexto" {...register('people')} /></label>
                    <label>Descreva o que aconteceu *
                      <textarea rows={7} minLength={30} maxLength={10000} placeholder="Descreva os fatos, o contexto e outras informações que ajudem na apuração." {...register('description')} />
                      <span className={styles.helper}>{description.length}/10000 caracteres · mínimo de 30.</span>
                    </label>
                    {errors.description && <p className={styles.error} role="alert">{errors.description.message}</p>}
                    <p className={styles.helper}>A funcionalidade de anexos do canal original será integrada e validada antes do lançamento.</p>
                  </div>
                )}

                {step === 3 && (
                  <div className={styles.fields}>
                    <h2>Como você quer enviar?</h2>
                    <p>É possível permanecer anônimo. A identificação é opcional.</p>
                    <div className={styles.choices}>
                      <label className={styles.choice}><input type="radio" value="anonymous" {...register('identity')} /> Enviar anonimamente</label>
                      <label className={styles.choice}><input type="radio" value="identified" {...register('identity')} /> Quero me identificar</label>
                    </div>
                    {identity === 'identified' && (
                      <div className={styles.fieldRow}>
                        <label>Nome<input maxLength={120} autoComplete="name" {...register('name')} /></label>
                        <label>E-mail<input type="email" autoComplete="email" maxLength={254} {...register('email')} /></label>
                      </div>
                    )}
                    {errors.name && <p className={styles.error} role="alert">{errors.name.message}</p>}
                    {errors.email && <p className={styles.error} role="alert">{errors.email.message}</p>}
                  </div>
                )}

                {step === 4 && (
                  <div className={styles.fields}>
                    <h2>Revise antes de enviar</h2>
                    <p>Confira as informações e confirme sua declaração de boa-fé.</p>
                    <dl className={styles.review}>
                      <div><dt>Categoria</dt><dd>{getValues('category')}</dd></div>
                      <div><dt>Descrição</dt><dd className={styles.preWrap}>{getValues('description')}</dd></div>
                      <div><dt>Unidade/setor</dt><dd>{getValues('unit') || 'Não informado'}</dd></div>
                      <div><dt>Quando</dt><dd>{getValues('when') || 'Não informado'}</dd></div>
                      <div><dt>Pessoas envolvidas</dt><dd>{getValues('people') || 'Não informado'}</dd></div>
                      <div><dt>Identificação</dt><dd>{identity === 'anonymous' ? 'Anônimo' : 'Identificado'}</dd></div>
                    </dl>
                    <label className={styles.goodFaith}>
                      <input type="checkbox" {...register('goodFaith')} />
                      Confirmo que prestei as informações de boa-fé, conforme meu conhecimento dos fatos.
                    </label>
                    {errors.goodFaith && <p className={styles.error} role="alert">{errors.goodFaith.message}</p>}
                  </div>
                )}

                {serverError && <p className={styles.error} role="alert">{serverError}</p>}

                <div className={styles.actions}>
                  {step > 1 ? <button type="button" className={styles.secondary} onClick={() => setStep(step - 1)}>Voltar</button>
                    : <Link className={styles.secondary} to="/canal-de-integridade">Cancelar</Link>}
                  {step < 4 ? <button type="button" className={styles.primary} onClick={next}>Continuar</button>
                    : <button type="submit" className={styles.primary} disabled={busy || !import.meta.env.VITE_INTEGRIDADE_API_URL}>{busy ? 'Enviando...' : 'Enviar relato'}</button>}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

