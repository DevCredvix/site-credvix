import { CircleAlert } from "lucide-react";
import styles from "./IntegridadeAcompanhamento.module.css";

const steps = [
  {
    number: "1",
    title: "Recebido",
    description:
      "Seu relato é registrado e recebe um código de acompanhamento.",
    active: true,
  },
  {
    number: "3",
    title: "Em análise",
    description:
      "Os fatos informados são tratados pela área responsável.",
    active: false,
  },
  {
    number: "4",
    title: "Encerrado",
    description:
      "O tratamento é concluído e o andamento é atualizado.",
    active: false,
  },
];

export function IntegridadeAcompanhamento() {
  return (
    <section className={styles.section}>
      <div className="cvx-shell">
        <div className={styles.header}>
          <span className={styles.eyebrow}>TRANSPARÊNCIA</span>

          <h2 className={styles.title}>
            O QUE ACONTECE
            <br />
            DEPOIS DE ENVIAR
          </h2>

          <p className={styles.description}>
            O relato é recebido para tratamento e pode passar pelas etapas abaixo.
            O acompanhamento público mostra o andamento disponibilizado pelo canal.
          </p>
        </div>

        <div className={styles.timelineCard}>
          <div className={styles.line} />

          <div className={styles.steps}>
            {steps.map((step) => (
              <div key={step.title} className={styles.step}>
                <div
                  className={`${styles.stepNumber} ${
                    step.active ? styles.stepNumberActive : ""
                  }`}
                >
                  {step.number}
                </div>

                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.note}>
          <CircleAlert size={18} strokeWidth={2} />
          <p>
            As etapas ilustram o fluxo de tratamento, a consulta pública pode
            apresentar estados agrupados. O prazo depende do contexto e da
            complexidade do relato.
          </p>
        </div>
      </div>
    </section>
  );
}