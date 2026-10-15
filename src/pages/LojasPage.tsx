import { LojasHero } from '../components/lojas/LojasHero'
import { StoreLocator } from '../components/lojas/StoreLocator'
import { LojasCtaBanner } from '../components/lojas/LojasCtaBanner'
import { usePageMetadata } from '../hooks/usePageMetadata'

export default function LojasPage() {
  usePageMetadata(
    'Lojas',
    'Encontre uma unidade Credvix e help! perto de você e converse com nossa equipe pessoalmente.',
  )

  return (
    <>
      <LojasHero />
      <StoreLocator />
      <LojasCtaBanner />
    </>
  )
}
