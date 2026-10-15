import { VagasHero } from '../components/vagas/VagasHero'
import { VagasLocator } from '../components/vagas/VagasLocator'
import { VagasCtaBanner } from '../components/vagas/VagasCtaBanner'
import { usePageMetadata } from '../hooks/usePageMetadata'

export default function VagasPage() {
  usePageMetadata(
    'Vagas',
    'Seu talento. Nossa próxima conquista. Conheça as oportunidades de carreira da Credvix.',
  )

  return (
    <>
      <VagasHero />
      <VagasLocator />
      <VagasCtaBanner />
    </>
  )
}
