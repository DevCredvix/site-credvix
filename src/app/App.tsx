import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from '../components/layout/SiteLayout'
import HomePage from '../pages/HomePage'

// Home no bundle inicial para evitar uma requisicao extra no primeiro acesso.
// Demais paginas carregam sob demanda (code splitting).
const LojasPage = lazy(() => import('../pages/LojasPage'))
const VagasPage = lazy(() => import('../pages/VagasPage'))
const CanalIntegridadePage = lazy(() => import('../pages/CanalIntegridadePage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted sm:px-6">
      Carregando pagina...
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/lojas" element={<LojasPage />} />
          <Route path="/vagas" element={<VagasPage />} />
          <Route path="/canal-de-integridade" element={<CanalIntegridadePage />} />
          {/* Acompanhamento desativado temporariamente. */}
          <Route path="/canal-de-integridade/acompanhar" element={<Navigate to="/canal-de-integridade" replace />} />
          {/* Compatibilidade de navegacao interna; 301 HTTP sera definida no lancamento. */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/lojas.html" element={<Navigate to="/lojas" replace />} />
          <Route path="/vagas.html" element={<Navigate to="/vagas" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
