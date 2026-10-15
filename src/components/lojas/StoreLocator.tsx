import { useMemo, useState } from 'react'
import { ChevronDown, MapPin, Search, X } from 'lucide-react'
import rawStores from '../../data/lojas.json'
import { CtaButton } from '../ui/CtaButton'
import { StoreCard } from './StoreCard'
import type { Store } from './storeTypes'
import styles from './StoreLocator.module.css'

const stores: Store[] = rawStores

const stateNames: Record<string, string> = {
  BA: 'Bahia',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MG: 'Minas Gerais',
  MT: 'Mato Grosso',
}

const normalizeSearch = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()

const options = Object.entries(stateNames)
  .filter(([uf]) => stores.some((store) => store.uf === uf))
  .sort(([, stateA], [, stateB]) => stateA.localeCompare(stateB, 'pt-BR'))

export function StoreLocator() {
  const [selectedState, setSelectedState] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)

  const normalizedQuery = normalizeSearch(searchTerm)
  const hasFilter = selectedState !== 'todos' || normalizedQuery.length > 0
  const showResults = showAll || hasFilter

  const filteredStores = useMemo(() => {
    if (!showResults) return []

    return stores.filter((store) => {
      if (selectedState !== 'todos' && store.uf !== selectedState) return false
      if (!normalizedQuery) return true

      const searchable = normalizeSearch(
        `${store.name} ${store.address} ${store.uf} ${stateNames[store.uf] ?? ''}`,
      )
      return searchable.includes(normalizedQuery)
    })
  }, [normalizedQuery, selectedState, showResults])

  function resetFilters() {
    setSelectedState('todos')
    setSearchTerm('')
    setShowAll(false)
  }

  function showAllStores() {
    setSelectedState('todos')
    setSearchTerm('')
    setShowAll(true)
  }

  return (
    <section id="encontre" className={styles.section} aria-labelledby="store-locator-title">
      <div className="cvx-shell">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>ENCONTRE UMA UNIDADE</p>
          <h2 id="store-locator-title" className={styles.title}>
            ONDE PODEMOS TE ATENDER?
          </h2>
          <p className={styles.subtitle}>
            Escolha um estado ou pesquise pelo nome de uma cidade ou unidade para
            encontrar a loja ideal para você.
          </p>
        </div>

        <div className={styles.searchPanel}>
          <h3 className={styles.panelTitle}>Busque sua loja</h3>

          <form
            className={styles.form}
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              setShowAll(true)
            }}
          >
            <div className={styles.filters}>
              <div className={styles.field}>
                <label htmlFor="lojas-estado">Estado</label>
                <div className={styles.control}>
                  <MapPin size={18} aria-hidden="true" className={styles.leftIcon} strokeWidth={1.8} />
                  <select
                    id="lojas-estado"
                    name="estado"
                    value={selectedState}
                    onChange={(event) => {
                      setSelectedState(event.target.value)
                      setShowAll(false)
                    }}
                  >
                    <option value="todos">Todos os estados</option>
                    {options.map(([uf, state]) => (
                      <option key={uf} value={uf}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" className={styles.rightIcon} />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="lojas-busca">Cidade ou nome da loja</label>
                <div className={styles.control}>
                  <Search size={18} aria-hidden="true" className={styles.leftIcon} strokeWidth={1.8} />
                  <input
                    id="lojas-busca"
                    type="search"
                    name="busca"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value)
                      setShowAll(false)
                    }}
                    placeholder="Ex.: Vitória, Colatina, Centro..."
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <div className={styles.panelFooter}>
              <CtaButton
                type="button"
                label="Ver todas as lojas"
                variant="dark"
                onClick={showAllStores}
                colors={{ circleBackground: '#171411', circleIcon: '#ffffff' }}
              />
              {showResults && (
                <button className={styles.clearButton} type="button" onClick={resetFilters}>
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                  Limpar filtros
                </button>
              )}
            </div>
          </form>
        </div>

        {!showResults ? (
          <div className={styles.prompt} role="status">
            <MapPin size={36} strokeWidth={1.8} aria-hidden="true" />
            <h3>Vamos encontrar a loja ideal para você?</h3>
            <p>Selecione um estado, digite uma cidade ou veja todas as unidades.</p>
          </div>
        ) : (
          <div className={styles.resultsArea}>
            {filteredStores.length ? (
              <>
                <div className={styles.resultsHeading}>
                  <h3 aria-live="polite" aria-atomic="true">
                    {filteredStores.length} {filteredStores.length === 1 ? 'unidade encontrada' : 'unidades encontradas'}
                  </h3>
                  <p>Confira os contatos e como chegar à unidade escolhida.</p>
                </div>
                <div className={styles.cardsGrid}>
                  {filteredStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyResults} role="status">
                <Search size={32} strokeWidth={1.7} aria-hidden="true" />
                <h3>Nenhuma unidade encontrada</h3>
                <p>Tente outro estado ou pesquise por uma cidade diferente.</p>
                <button type="button" onClick={resetFilters} className={styles.resetButton}>
                  Limpar busca
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
