import { IntegridadeCtaBanner } from '../components/integridade/IntegridadeCtaBanner'
import { useEffect, useState } from 'react'
import { IntegridadeHero } from '../components/integridade/IntegridadeHero'
import { IntegridadeSteps } from '../components/integridade/IntegridadeSteps'
import { usePageMetadata } from '../hooks/usePageMetadata'
import { IntegridadeAcompanhamento } from "../components/integridade/IntegridadeAcompanhamento";

export default function CanalIntegridadePage() {
  usePageMetadata(
    'Canal de Integridade',
    'Registre um relato com responsabilidade. Identificação opcional e acompanhamento por código no Canal de Integridade Credvix.',
  )

  const [formOpen, setFormOpen] = useState(false)

  function focusForm() {
    const panel = document.getElementById('formulario-relato')
    if (!panel) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    panel.focus({ preventScroll: true })
  }

  function openForm() {
    if (formOpen) {
      focusForm()
      return
    }
    setFormOpen(true)
  }

  useEffect(() => {
    if (!formOpen) return
    const id = requestAnimationFrame(focusForm)
    return () => cancelAnimationFrame(id)
  }, [formOpen])

  return (
    <>
      <IntegridadeHero onStartRelato={openForm} />
      <IntegridadeSteps onStartRelato={openForm} formOpen={formOpen} />
      <IntegridadeAcompanhamento />
      <IntegridadeCtaBanner />
    </>
  )
}
