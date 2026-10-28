import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BriefcaseBusiness, ChevronDown, MapPin, Search, X } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import { VagaCard } from './VagaCard'
import { buscarVagasAbertas, type VagaSolides } from '../../services/vagasSolides'
import styles from './VagasLocator.module.css'
import resultStyles from './VagasResults.module.css'

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

/** A Sólides e a unica fonte. Os filtros atuam apenas sobre vagas verificadas. */
export function VagasLocator() {
  const [localidade, setLocalidade] = useState('todas')
  const [nomeDaVaga, setNomeDaVaga] = useState('')
  const [vagas, setVagas] = useState<VagaSolides[]>([])
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando')

  useEffect(() => {
    const controller = new AbortController()
    buscarVagasAbertas(controller.signal)
      .then((resultado) => {
        if (controller.signal.aborted) return
        setVagas(resultado)
        setEstado('pronto')
      })
      .catch(() => {
        if (!controller.signal.aborted) setEstado('erro')
      })
    return () => controller.abort()
  }, [])

  const localidades = useMemo(() => [...new Set(vagas.map((vaga) => vaga.location).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR')), [vagas])

  const filtradas = useMemo(() => vagas.filter((vaga) =>
    (localidade === 'todas' || vaga.location === localidade) &&
    normalizar(vaga.title).includes(normalizar(nomeDaVaga)),
  ), [vagas, localidade, nomeDaVaga])

  const filtrosAtivos = localidade !== 'todas' || nomeDaVaga.trim().length > 0

  function limparFiltros() {
    setLocalidade('todas')
    setNomeDaVaga('')
  }

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    requestAnimationFrame(() => {
      document.getElementById('vagas-resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <section id="oportunidades" className={styles.section} aria-labelledby="vagas-locator-title">
      <div className="cvx-shell">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>OPORTUNIDADES CREDVIX</p>
          <h2 id="vagas-locator-title" className={styles.title}>
            ENCONTRE SUA PRÓXIMA
            <span>OPORTUNIDADE.</span>
          </h2>
          <p className={styles.subtitle}>
            Confira as vagas disponíveis abaixo ou use os filtros para encontrar sua oportunidade.
          </p>
        </div>

        <div className={styles.searchPanel}>
          <h3 className={styles.panelTitle}>Encontre sua vaga</h3>
          <form className={styles.form} role="search" onSubmit={buscar}>
            <div className={`${styles.filters} ${resultStyles.twoFilters}`}>
              <div className={styles.field}>
                <label htmlFor="vagas-localidade">Localidade</label>
                <div className={styles.control}>
                  <MapPin size={18} strokeWidth={1.8} className={styles.leftIcon} aria-hidden="true" />
                  <select
                    id="vagas-localidade"
                    name="localidade"
                    value={localidade}
                    onChange={(event) => setLocalidade(event.target.value)}
                  >
                    <option value="todas">Todas as localidades</option>
                    {localidades.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                  <ChevronDown size={16} className={styles.rightIcon} aria-hidden="true" />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="vagas-nome">Nome da vaga</label>
                <div className={styles.control}>
                  <Search size={18} strokeWidth={1.8} className={styles.leftIcon} aria-hidden="true" />
                  <input
                    id="vagas-nome"
                    type="search"
                    name="nome-da-vaga"
                    value={nomeDaVaga}
                    onChange={(event) => setNomeDaVaga(event.target.value)}
                    placeholder="Ex.: Consultor de vendas..."
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className={styles.panelFooter}>
              <div className={styles.panelMainActions}>
                <CtaButton
                  href="https://auth.vagas.solides.com.br/sign-in"
                  target="_blank"
                  rel="noopener noreferrer"
                  label="Banco de talentos"
                  variant="orange"
                  colors={{ circleBackground: '#C94F08', circleIcon: '#FFFFFF' }}
                />
                {filtrosAtivos && (
                  <button type="button" className={styles.clearButton} onClick={limparFiltros}>
                    <X size={16} strokeWidth={2} aria-hidden="true" />
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div id="vagas-resultados" className={resultStyles.jobsContent} aria-live="polite">
          {estado === 'carregando' ? (
            <div className={styles.emptyResults} role="status">
              <BriefcaseBusiness size={35} strokeWidth={1.7} aria-hidden="true" />
              <h3>Consultando vagas abertas...</h3>
              <p>Aguarde enquanto verificamos as oportunidades da Credvix na Sólides.</p>
            </div>
          ) : estado === 'erro' ? (
            <div className={styles.emptyResults} role="status">
              <BriefcaseBusiness size={35} strokeWidth={1.7} aria-hidden="true" />
              <h3>Não foi possível confirmar as vagas disponíveis.</h3>
              <p>Não foi possível carregar as oportunidades agora. Atualize a página para tentar novamente.</p>
              <button className={styles.resetButton} type="button" onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
          ) : vagas.length === 0 ? (
            <div className={styles.emptyResults} role="status">
              <BriefcaseBusiness size={35} strokeWidth={1.7} aria-hidden="true" />
              <h3>Nenhuma vaga aberta no momento.</h3>
              <p>Não existem oportunidades confirmadas na última verificação. Volte em breve para conferir novas vagas.</p>
            </div>
          ) : filtradas.length === 0 ? (
            <div className={styles.emptyResults} role="status">
              <BriefcaseBusiness size={35} strokeWidth={1.7} aria-hidden="true" />
              <h3>Nenhuma vaga corresponde à sua busca.</h3>
              <p>Tente outra localidade ou procure por um cargo diferente.</p>
              <button type="button" className={styles.resetButton} onClick={limparFiltros}>Limpar busca</button>
            </div>
          ) : (
            <>
              <div className={resultStyles.jobsHeader}>
                <h3 className={resultStyles.jobsHeading}>Vagas abertas <span>({filtradas.length})</span></h3>
                <p>Oportunidades verificadas no portal da Sólides</p>
              </div>
              <div className={resultStyles.jobsGrid}>
                {filtradas.map((vaga) => <VagaCard key={vaga.id} vaga={vaga} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
