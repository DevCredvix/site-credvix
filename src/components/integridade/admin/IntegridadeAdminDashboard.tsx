import { useMemo, useState } from 'react'
import { ChevronDown, FileX2, Search } from 'lucide-react'
import {
  listarRelatosAdmin,
  SessaoRevisorExpiradaError,
  type RelatoResumoAdmin,
  type SessaoRevisor,
  type StatusRelatoAdmin,
} from '../../../services/integridadeAdminApi'
import { IntegridadeRelatoCard } from './IntegridadeRelatoCard'
import { IntegridadeRelatoDetalheModal } from './IntegridadeRelatoDetalheModal'
import styles from './IntegridadeAdminDashboard.module.css'

type FiltroStatus = 'all' | StatusRelatoAdmin

type Props = {
  session: SessaoRevisor
  onLogout: (reason?: string) => void
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

export function IntegridadeAdminDashboard({ session, onLogout }: Props) {
  // A primeira pagina veio da mesma requisicao que validou o revisor no login.
  const [reports, setReports] = useState(session.initialPage.reports)
  const [nextOffset, setNextOffset] = useState(session.initialPage.reports.length)
  const [hasMore, setHasMore] = useState(session.initialPage.hasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState<FiltroStatus>('all')
  const [query, setQuery] = useState('')
  const [selectedReport, setSelectedReport] = useState<RelatoResumoAdmin | null>(null)

  const filteredReports = useMemo(() => {
    const text = normalize(query)
    return reports.filter((report) => {
      if (statusFilter !== 'all' && report.status !== statusFilter) return false
      if (!text) return true
      return [report.protocol_code, report.category, report.unit].some((field) => normalize(field).includes(text))
    })
  }, [reports, statusFilter, query])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadError('')
    try {
      const page = await listarRelatosAdmin(session.accessToken, nextOffset)
      setReports((current) => {
        const existing = new Set(current.map((report) => report.id))
        return [...current, ...page.reports.filter((report) => !existing.has(report.id))]
      })
      setNextOffset((current) => current + page.reports.length)
      setHasMore(page.hasMore && page.reports.length > 0)
    } catch (error) {
      if (error instanceof SessaoRevisorExpiradaError) {
        onLogout('Sua sessão expirou ou seu acesso foi revogado. Entre novamente.')
        return
      }
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar mais relatos.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.topbar}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>ÁREA RESTRITA</p>
          <h1 id="integridade-admin-titulo">DENÚNCIAS</h1>
          <p className={styles.subtitle}>Triagem, análise, evidências e atualizações públicas.</p>
        </div>
        <button type="button" className={styles.logout} onClick={() => onLogout()}>
          Sair
        </button>
      </div>

      <section className={styles.filterPanel} aria-labelledby="integridade-admin-filtros">
        <h2 id="integridade-admin-filtros">Encontre um relato</h2>
        <div className={styles.filterGrid}>
          <div className={styles.field}>
            <label htmlFor="admin-relato-status">Status</label>
            <div className={styles.selectWrap}>
              <select
                id="admin-relato-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as FiltroStatus)
                  setSelectedReport(null)
                }}
              >
                <option value="all">Todos</option>
                <option value="received">Recebidos</option>
                <option value="in_review">Em análise</option>
                <option value="closed">Encerrados</option>
              </select>
              <ChevronDown size={17} strokeWidth={1.8} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-relato-pesquisa">Protocolo ou categoria</label>
            <div className={styles.searchWrap}>
              <Search size={18} strokeWidth={1.8} aria-hidden="true" />
              <input
                id="admin-relato-pesquisa"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelectedReport(null)
                }}
                placeholder="Ex.: CD-000005, assédio, fraude..."
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </section>

      <p className={styles.screenReaderStatus} role="status">
        {filteredReports.length} relato(s) encontrado(s) entre os registros carregados.
      </p>
      <div className={styles.listArea}>
        {filteredReports.length > 0 ? (
          <div className={styles.grid} aria-label="Relatos encontrados">
            {filteredReports.map((report) => (
              <IntegridadeRelatoCard
                key={report.id}
                relato={report}
                selected={selectedReport?.id === report.id}
                onSelect={setSelectedReport}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            <FileX2 size={36} strokeWidth={1.65} aria-hidden="true" />
            <h2>{reports.length === 0 ? 'Nenhum relato para análise' : 'Nenhum relato encontrado'}</h2>
            <p>
              {reports.length === 0
                ? 'Ainda não há relatos registrados neste canal.'
                : 'Tente alterar o status ou pesquisar por outra categoria ou protocolo.'}
            </p>
          </div>
        )}
      </div>

      {selectedReport && (
        <IntegridadeRelatoDetalheModal
          key={selectedReport.id}
          summary={selectedReport}
          accessToken={session.accessToken}
          onClose={() => setSelectedReport(null)}
          onUnauthorized={() => onLogout('Sua sessão expirou ou seu acesso foi revogado. Entre novamente.')}
          onSaved={(updated) => {
            setReports((current) => current.map((report) =>
              report.id === updated.id
                ? { ...report, status: updated.status, revision: updated.revision }
                : report,
            ))
            setSelectedReport((current) => current?.id === updated.id
              ? { ...current, status: updated.status, revision: updated.revision }
              : current)
          }}
        />
      )}

      {loadError && <p className={styles.error} role="alert">{loadError}</p>}
      {hasMore && (
        <div className={styles.pagination}>
          <button type="button" onClick={loadMore} disabled={loadingMore} aria-busy={loadingMore}>
            {loadingMore ? 'Carregando relatos...' : 'Carregar mais relatos'}
          </button>
          <p>Os filtros pesquisam os relatos já carregados. Carregue mais para ampliar a busca.</p>
        </div>
      )}
    </div>
  )
}
