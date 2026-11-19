export const SEXO_OPTIONS = ["Feminino", "Masculino", "Outro"] as const

export const OBJETIVOS_PRESET = [
  "Emagrecer",
  "Ganhar massa",
  "Controlar diabetes",
  "Saúde geral",
  "Performance esportiva",
  "Reeducação alimentar",
] as const

export const NIVEL_ATIVIDADE_OPTIONS = [
  "Sedentário",
  "Levemente ativo",
  "Moderadamente ativo",
  "Muito ativo",
  "Extremamente ativo",
] as const

export const PATOLOGIAS_PRESET = [
  "Diabetes",
  "Hipertensão",
  "Hipotireoidismo",
  "Hipertireoidismo",
  "Síndrome do ovário policístico",
  "Doença celíaca",
  "Colesterol alto",
] as const

export const RESTRICOES_PRESET = [
  "Lactose",
  "Glúten",
  "Açúcar",
  "Carne vermelha",
  "Frutos do mar",
] as const

export const ALERGIAS_PRESET = [
  "Amendoim",
  "Leite",
  "Ovo",
  "Soja",
  "Trigo",
  "Frutos do mar",
] as const

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function calculateAgeFromBirthdate(isoDate: string): number | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) return null
  const today = new Date()
  let age = today.getFullYear() - year
  const monthDiff = today.getMonth() + 1 - month
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--
  }
  return age >= 0 && age <= 130 ? age : null
}

/**
 * Converte número digitado para formato de hora "HH:mm"
 * Exemplos: 6 -> "06:00", 630 -> "06:30", 23 -> "23:00", 2230 -> "22:30"
 */
export function convertNumericInputToTime(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  if (trimmed.includes(":")) {
    const [hPart, mPart] = trimmed.split(":")
    const hNum = Math.min(23, Math.max(0, parseInt(hPart.replace(/\D/g, "") || "0", 10)))
    const mNum = Math.min(59, Math.max(0, parseInt(mPart.replace(/\D/g, "") || "0", 10)))
    return `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`
  }

  const digits = trimmed.replace(/\D/g, "").slice(0, 4)
  if (!digits) return ""

  let hours = 0
  let minutes = 0

  if (digits.length <= 2) {
    hours = parseInt(digits, 10)
    minutes = 0
  } else if (digits.length === 3) {
    hours = parseInt(digits.slice(0, 1), 10)
    minutes = parseInt(digits.slice(1, 3), 10)
  } else {
    hours = parseInt(digits.slice(0, 2), 10)
    minutes = parseInt(digits.slice(2, 4), 10)
  }

  hours = Math.min(23, Math.max(0, hours))
  minutes = Math.min(59, Math.max(0, minutes))

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function getImcClassification(imc: number): { label: string; colorClass: string } {
  if (imc < 18.5) {
    return { label: "Abaixo do peso", colorClass: "text-amber-700 bg-amber-50 border-amber-200" }
  }
  if (imc < 25) {
    return { label: "Peso normal", colorClass: "text-[#4d622b] bg-[#6c873f]/15 border-[#6c873f]/30" }
  }
  if (imc < 30) {
    return { label: "Sobrepeso", colorClass: "text-amber-700 bg-amber-50 border-amber-200" }
  }
  return { label: "Obesidade", colorClass: "text-red-700 bg-red-50 border-red-200" }
}

export function getTodayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatBrDate(isoDate?: string | null): string {
  if (!isoDate) return "—"
  const [year, month, day] = isoDate.slice(0, 10).split("-")
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

