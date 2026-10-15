import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FooterSocialLinks } from './FooterSocialLinks'
import styles from './Footer.module.css'

const navigation = [
  { label: 'Início', to: '/' },
  { label: 'Quem somos', to: '/#quem-somos' },
  { label: 'Nossos valores', to: '/#nossos-valores' },
  { label: 'Relações institucionais', to: '/#relacoes-institucionais' },
] as const

const exploration = [
  { label: 'Crédito consignado', to: '/#solucoes-credvix-title' },
  { label: 'Encontrar lojas', to: '/lojas' },
  { label: 'Trabalhe conosco', to: '/vagas' },
  { label: 'Canal de Integridade', to: '/canal-de-integridade' },
] as const

/**
 * Rodapé compartilhado entre todas as páginas da Credvix V2.
 * Não depende de seções específicas para sua estrutura visual.
 */
export function Footer() {
  return (
    <footer className={styles.footer} aria-label="Rodapé da Credvix">
      <div className="cvx-shell">
        <div className={styles.columns}>
          <div className={styles.brandColumn}>
            <Link
              to="/"
              className={styles.brandLink}
              aria-label="Credvix e help! — voltar à página inicial"
            >
              <img
                src="/brand/logo-credvix.svg"
                alt="Credvix"
                width={156}
                height={32}
                className={styles.credvixLogo}
                loading="lazy"
                decoding="async"
              />
              <img
                src="/brand/logo-help.svg"
                alt="help!"
                width={77}
                height={44}
                className={styles.helpLogo}
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className={styles.brandDescription}>
              Soluções financeiras com foco em atendimento personalizado e em relações
              construídas com proximidade.
            </p>
            <FooterSocialLinks />
          </div>

          <nav className={styles.linkColumn} aria-label="Navegue pelo site">
            <h2 className={styles.columnTitle}>NAVEGUE</h2>
            <ul className={styles.linkList}>
              {navigation.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={styles.link}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.linkColumn} aria-label="Explore a Credvix">
            <h2 className={styles.columnTitle}>EXPLORE</h2>
            <ul className={styles.linkList}>
              {exploration.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={styles.link}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.contactColumn}>
            <h2 className={styles.columnTitle}>FALE COM A GENTE</h2>
            <address className={styles.contactInfo}>
              <a className={styles.link} href="tel:+552730208584">
                (27) 3020-8584
              </a>
              <a className={styles.link} href="mailto:marketing@credvix.com">
                marketing@credvix.com
              </a>
            </address>
            <p className={styles.contactNote}>
              Para atendimento presencial, consulte as unidades e os horários locais.
            </p>
            <Link to="/lojas" className={styles.unitsLink}>
              Ver unidades <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className={styles.legal}>
          <p className={styles.disclaimer}>
            O crédito consignado está sujeito à análise e aprovação. As condições
            apresentadas podem variar conforme o convênio e a margem consignável
            disponível. Consulte sempre as condições específicas antes da contratação.
            help! é uma marca registrada do Banco BMG S.A.
          </p>
          <div className={styles.bottomBar}>
            <span>© {new Date().getFullYear()} Credvix. Todos os direitos reservados.</span>
            <span>CNPJ: 14.994.452/0001-40</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
