import { CtaButton } from '../ui/CtaButton'
import { IntegridadeRelatoForm } from './IntegridadeRelatoForm'
import styles from './IntegridadeSteps.module.css'

const steps = [
  {
    number: '01',
    title: <>ESCOLHA A<br />CATEGORIA</>,
    description: 'Selecione a opção que melhor representa a situação que deseja comunicar.',
  },
  {
    number: '02',
    title: <>DESCREVA O<br />OCORRIDO</>,
    description: 'Conte os fatos com clareza. Local, data, pessoas e anexos podem ajudar na apuração.',
  },
  {
    number: '03',
    title: <>ESCOLHA COMO<br />ENVIAR</>,
    description: 'Você pode enviar anonimamente ou informar seu nome e e-mail, se preferir.',
  },
  {
    number: '04',
    title: <>REVISE, ENVIE<br />E AGUARDE</>,
    description: 'Confira o relato, confirme as informações e salve o código gerado no envio.',
  },
] as const

interface IntegridadeStepsProps {
  onStartRelato: () => void
  formOpen: boolean
}

export function IntegridadeSteps({ onStartRelato, formOpen }: IntegridadeStepsProps) {
  return (
    <section id="passo-a-passo" className={styles.section} aria-labelledby="integridade-steps-title">
      <div className="cvx-shell">
        <header className={styles.intro}>
          <p className={styles.eyebrow}>PASSO A PASSO</p>
          <h2 className={styles.title} id="integridade-steps-title">
            UM PROCESSO SIMPLES
            <span>SEM BUROCRACIA</span>
          </h2>
          <p className={styles.subtitle}>
            Você faz o relato sem precisar criar conta. Veja as quatro etapas do formulário atual.
          </p>
        </header>

        <ol className={styles.grid} aria-label="Etapas para registrar um relato">
          {steps.map((step, index) => (
            <li key={step.number} className={styles.card} data-accent={index === 1 || index === 3}>
              <span className={styles.number} aria-hidden="true">{step.number}</span>
              <div className={styles.cardContent}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className={styles.cardRule} aria-hidden="true" />
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.action}>
          <CtaButton
            type="button"
            onClick={onStartRelato}
            label="Começar meu relato"
            variant="amber"
            ariaLabel={formOpen ? 'Ir ao formulário de relato aberto abaixo' : 'Abrir formulário de relato nesta página'}
          />
        </div>

        {formOpen && (
          <div id="formulario-relato" className={styles.inlineForm} tabIndex={-1}>
            <IntegridadeRelatoForm />
          </div>
        )}
      </div>
    </section>
  )
}
