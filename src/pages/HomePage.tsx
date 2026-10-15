import { Hero } from '../components/home/Hero'
import { WhoWeAreSection } from '../components/home/WhoWeAreSection'
import { SolutionsSection } from '../components/home/SolutionsSection'
import { ValuesSection } from '../components/home/ValuesSection'
import { InstitutionalConnections } from '../components/home/InstitutionalConnections'
import { CtaBannerSection } from '../components/home/CtaBannerSection'
import { usePageMetadata } from '../hooks/usePageMetadata'

export default function HomePage() {
  usePageMetadata(
    'Home',
    'Crédito com mais proximidade. Conheça a Credvix, nosso atendimento personalizado e encontre uma unidade perto de você.',
  )

  return (
    <>
      <Hero />
      <WhoWeAreSection />
      <SolutionsSection />
      <ValuesSection />
      <InstitutionalConnections />
      <CtaBannerSection />
      {/* A próxima etapa será o footer compartilhado. */}
    </>
  )
}
