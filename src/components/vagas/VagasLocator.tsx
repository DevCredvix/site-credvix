import { useMemo, useState } from 'react'
import { BriefcaseBusiness, ChevronDown, MapPin, Search, X } from 'lucide-react'
import { CtaButton } from '../ui/CtaButton'
import styles from './VagasLocator.module.css'

type VacancyCategory = 'todas' | 'abertas' | 'banco-de-talentos'

const SEM_LOCALIDADES: readonly string[] = []

type VagasLocatorProps = {
  /**
   * As localidades serao derivadas das vagas quando a fonte de dados for conectada.
   * Nenhuma localidade ou oportunidade e simulada nesta etapa.
   */
  localidades?: readonly string[]
}

/**
 * Etapa 02 da pagina Vagas: interface e comportamento inicial dos filtros.
 * Nao consulta API, nao armazena dados de vagas e nao recebe curriculos.
 * A listagem de oportunidades sera integrada em uma etapa futura.
 */
export function VagasLocator({ localidades = SEM_LOCALIDADES }: VagasLocatorProps) {
  const [localidade, setLocalidade] = useState('todas')
  const [categoria, setCategoria] = useState<VacancyCategory>('todas')
  const [nomeDaVaga, setNomeDaVaga] = useState('')
  const [verTodas, setVerTodas] = useState(false)

  const localidadesDisponiveis = useMemo(
    () => [...new Set(localidades.map((item) => item.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [localidades],
  )

  const filtrosAtivos =
    localidade !== 'todas' || categoria !== 'todas' || nomeDaVaga.trim().length > 0
  const mostrarResultado = verTodas || filtrosAtivos

  function limparFiltros() {
    setLocalidade('todas')
    setCategoria('todas')
    setNomeDaVaga('')
    setVerTodas(false)
  }

  function mostrarTodas() {
    setLocalidade('todas')
    setCategoria('todas')
    setNomeDaVaga('')
    setVerTodas(true)
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
            Filtre as vagas disponíveis e encontre aquela que combina com você.
          </p>
        </div>

        <div className={styles.searchPanel}>
          <h3 className={styles.panelTitle}>Encontre sua vaga</h3>
          <form
            className={styles.form}
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              setVerTodas(true)
            }}
          >
            <div className={styles.filters}>
              <div className={styles.field}>
                <label htmlFor="vagas-localidade">Localidade</label>
                <div className={styles.control}>
                  <MapPin size={18} strokeWidth={1.8} className={styles.leftIcon} aria-hidden="true" />
                  <select
                    id="vagas-localidade"
                    name="localidade"
                    value={localidade}
                    onChange={(event) => {
                      setLocalidade(event.target.value)
                      setVerTodas(false)
                    }}
                  >
                    <option value="todas">Todas as localidades</option>
                    {localidadesDisponiveis.map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className={styles.rightIcon} aria-hidden="true" />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="vagas-categoria">Categoria</label>
                <div className={styles.control}>
                  <BriefcaseBusiness size={18} strokeWidth={1.8} className={styles.leftIcon} aria-hidden="true" />
                  <select
                    id="vagas-categoria"
                    name="categoria"
                    value={categoria}
                    onChange={(event) => {
                      setCategoria(event.target.value as VacancyCategory)
                      setVerTodas(false)
                    }}
                  >
                    <option value="todas">Todas as categorias</option>
                    <option value="abertas">Vagas abertas</option>
                    <option value="banco-de-talentos">Banco de talentos</option>
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
                    onChange={(event) => {
                      setNomeDaVaga(event.target.value)
                      setVerTodas(false)
                    }}
                    placeholder="Ex.: Consultor de vendas..."
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className={styles.panelFooter}>
              <CtaButton
                type="button"
                label="Ver todas as vagas"
                variant="dark"
                onClick={mostrarTodas}
                colors={{ circleBackground: '#171411', circleIcon: '#ffffff' }}
              />
              {mostrarResultado && (
                <button type="button" className={styles.clearButton} onClick={limparFiltros}>
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                  Limpar filtros
                </button>
              )}
            </div>
          </form>
        </div>

        {!mostrarResultado ? (
          <div className={styles.prompt} role="status">
            <BriefcaseBusiness size={38} strokeWidth={1.7} aria-hidden="true" />
            <h3>Vamos encontrar a vaga ideal para você?</h3>
            <p>Selecione uma localidade, escolha uma categoria ou veja todas as vagas.</p>
          </div>
        ) : (
          <div className={styles.emptyResults} role="status" aria-live="polite">
            <BriefcaseBusiness size={36} strokeWidth={1.7} aria-hidden="true" />
            <h3>As oportunidades aparecerão aqui quando cadastradas.</h3>
            <p>
              Ainda não há vagas cadastradas nesta página. Os filtros já estão preparados
              para receber futuras oportunidades da Credvix.
            </p>
            <button type="button" className={styles.resetButton} onClick={limparFiltros}>
              Limpar busca
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
