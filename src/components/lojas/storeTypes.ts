/** Somente dados públicos de atendimento, extraídos das planilhas das lojas. */
export interface Store {
  id: string
  name: string
  uf: string
  address: string
  phone: string | null
  phoneDigits: string | null
  whatsappDigits: string | null
  instagram: string | null
  /** Faixa horária da planilha; os dias da semana não foram informados. */
  hours: string | null
}
