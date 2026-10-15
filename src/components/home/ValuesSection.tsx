import styles from './ValuesSection.module.css'

interface CredvixValue {
  number: string
  title: string
  description: string
  featured?: boolean
}

const values: CredvixValue[] = [
  {
    number: '01',
    title: 'RESPEITO & HONESTIDADE.',
    description:
      'Reconhecer cada pessoa, ouvir suas necessidades e valorizar a transparência nas relações.',
  },
  {
    number: '02',
    title: 'DEDICAÇÃO & COMPROMETIMENTO.',
    description:
      'Levar a sério cada atendimento e o cuidado que uma decisão financeira merece.',
    featured: true,
  },
  {
    number: '03',
    title: 'PROFISSIONALISMO.',
    description:
      'Agir com responsabilidade e buscar eficiência na forma de atender e orientar.',
  },
]

/** Etapa 05: valores institucionais — seção exclusiva da Home. */
export function ValuesSection() {
  return (
    <section
      id="nossos-valores"
      className={styles.section}
      aria-labelledby="home-values-title"
    >
      <div className="cvx-shell">
        <header className={styles.heading}>
          <p className={styles.eyebrow}>O QUE NOS DEFINE</p>
          <h2 id="home-values-title" className={styles.title}>
            VALORES QUE ORIENTAM
            <span>NOSSO JEITO DE TRABALHAR.</span>
          </h2>
          <p className={styles.intro}>
            Os princípios apresentados pela Credvix em sua história institucional.
          </p>
        </header>

        <div className={styles.cards}>
          {values.map(({ number, title, description, featured }) => (
            <article
              className={`${styles.card}${featured ? ` ${styles.featured}` : ''}`}
              key={number}
            >
              <span className={styles.number} aria-hidden="true">
                {number}
              </span>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDescription}>{description}</p>
                <span className={styles.cardAccent} aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
