import styles from './WhoWeAreSection.module.css'

export function WhoWeAreSection() {
  return (
    <section id="quem-somos" className={styles.section} aria-labelledby="quem-somos-title">
      <div className="cvx-shell">
        <div className={styles.grid}>
          <figure className={styles.photoFrame}>
            <img
              src="/home/equipe-credvix-honey-trofeu.png"
              alt="Equipe da Credvix reunida ao ar livre, em frente a uma escultura metálica, segurando a faixa Troféu Honey 2025."
              width={1400}
              height={1050}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className={styles.brandMark} aria-hidden="true">
            <img src="/home/marca-lineart.svg" alt="" width={240} height={239} loading="lazy" decoding="async" />
          </div>

          <div className={styles.content}>
            <h2 id="quem-somos-title" className={styles.title}>
              GENTE QUE ACREDITA EM
              <span>UM ATENDIMENTO</span>
              <span>MAIS PRÓXIMO.</span>
            </h2>

            <p className={styles.description}>
              A Credvix atua no mercado de crédito e valoriza relações construídas
              com respeito, dedicação e profissionalismo. Nosso trabalho tem como
              foco compreender as necessidades de quem busca atendimento.
            </p>

            <article className={styles.missionCard} aria-label="Nossa missão">
              <p className={styles.eyebrow}>NOSSA MISSÃO</p>
              <h3 className={styles.missionTitle}>SIMPLIFICAR A JORNADA FINANCEIRA.</h3>
              <p className={styles.missionText}>
                Trazer soluções financeiras de maneira simples, com atenção às
                necessidades de cada cliente, e um atendimento personalizado e
                eficiente.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
