import styles from './InstitutionalConnections.module.css'

type Connection = {
  name: string
  description: string
  logo: string
  logoAlt: string
  logoWidth: number
  logoHeight: number
  logoType: 'help' | 'bmg' | 'apis'
}

const connections: Connection[] = [
  {
    name: 'Help! Banco BMG',
    description: 'Marca apresentada junto à Credvix em sua comunicação institucional.',
    logo: '/instituicoes/help.svg',
    logoAlt: 'Logotipo help!',
    logoWidth: 126,
    logoHeight: 72,
    logoType: 'help',
  },
  {
    name: 'Banco BMG S.A.',
    description: 'Instituição citada nas informações institucionais e sobre crédito consignado.',
    logo: '/instituicoes/banco-bmg.svg',
    logoAlt: 'Logotipo Banco BMG',
    logoWidth: 160,
    logoHeight: 72,
    logoType: 'bmg',
  },
  {
    name: 'Apis Group',
    description: 'Grupo empresarial mencionado no site institucional anterior.',
    logo: '/instituicoes/apis-group.svg',
    logoAlt: 'Logotipo Apis Group',
    logoWidth: 138,
    logoHeight: 73,
    logoType: 'apis',
  },
]

/** Etapa 06 da Home: conexões institucionais conforme a referência do Figma. */
export function InstitutionalConnections() {
  return (
    <section
      id="relacoes-institucionais"
      className={styles.section}
      aria-labelledby="connections-title"
    >
      <div className="cvx-shell">
        <div className={styles.heading}>
          <p className={styles.eyebrow}>RELAÇÕES INSTITUCIONAIS</p>
          <h2 id="connections-title" className={styles.title}>
            CONEXÕES PRESENTES
            <span>NA NOSSA HISTÓRIA.</span>
          </h2>
          <p className={styles.intro}>
            Trabalhamos em parceria com as principais instituições do setor financeiro brasileiro.
          </p>
        </div>

        <div className={styles.cards}>
          {connections.map((connection) => (
            <article className={styles.card} key={connection.name}>
              <img
                className={styles.logo}
                data-logo={connection.logoType}
                src={connection.logo}
                alt={connection.logoAlt}
                width={connection.logoWidth}
                height={connection.logoHeight}
                loading="lazy"
                decoding="async"
              />
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{connection.name}</h3>
                <p className={styles.cardDescription}>{connection.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
