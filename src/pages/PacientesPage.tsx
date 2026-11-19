import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { neonClient } from "@/lib/neon"
import { useAuth } from "@/contexts/AuthContext"
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PacienteRow {
  id: string
  nutricionista_id: string
  nome: string
  objetivos?: string[] | null
  objetivo_texto?: string | null
  email?: string | null
  telefone?: string | null
  whatsapp?: string | null
  created_at?: string
}

interface ConsultaRow {
  id: string
  paciente_id: string
  data_consulta: string
}

interface PacienteListItem extends PacienteRow {
  ultimaConsulta: string | null
}

function formatBrDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-")
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

function formatObjetivoSummary(
  objetivos?: string[] | null,
  objetivoTexto?: string | null
): string {
  const parts: string[] = []
  if (Array.isArray(objetivos) && objetivos.length > 0) {
    parts.push(...objetivos.filter(Boolean))
  }
  if (objetivoTexto && objetivoTexto.trim()) {
    parts.push(objetivoTexto.trim())
  }
  if (parts.length === 0) {
    return "Objetivo não informado"
  }
  return parts.join(" • ")
}

export function PacientesPage() {
  const { user, nutricionista } = useAuth()
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nutricionistaId = nutricionista?.id || user?.id

  const fetchPacientes = useCallback(async () => {
    if (!nutricionistaId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: pacientesData, error: pacientesError } = await neonClient
        .from("pacientes")
        .select(
          "id, nutricionista_id, nome, objetivos, objetivo_texto, email, telefone, whatsapp, created_at"
        )
        .eq("nutricionista_id", nutricionistaId)
        .order("nome", { ascending: true })

      if (pacientesError) {
        throw new Error(pacientesError.message)
      }

      const rows = (pacientesData || []) as PacienteRow[]

      if (rows.length === 0) {
        setPacientes([])
        return
      }

      const pacienteIds = rows.map((p) => p.id)

      const { data: consultasData, error: consultasError } = await neonClient
        .from("consultas")
        .select("id, paciente_id, data_consulta")
        .in("paciente_id", pacienteIds)
        .order("data_consulta", { ascending: false })

      if (consultasError) {
        throw new Error(consultasError.message)
      }

      const consultas = (consultasData || []) as ConsultaRow[]
      const ultimaConsultaMap = new Map<string, string>()

      for (const c of consultas) {
        const current = ultimaConsultaMap.get(c.paciente_id)
        const dateStr = c.data_consulta?.slice(0, 10)
        if (dateStr && (!current || dateStr > current)) {
          ultimaConsultaMap.set(c.paciente_id, dateStr)
        }
      }

      const enriched: PacienteListItem[] = rows.map((p) => ({
        ...p,
        ultimaConsulta: ultimaConsultaMap.get(p.id) || null,
      }))

      setPacientes(enriched)
    } catch (err: any) {
      console.error("Erro ao buscar pacientes:", err)
      setError(
        "Não foi possível carregar a lista de pacientes. Tente novamente."
      )
    } finally {
      setLoading(false)
    }
  }, [nutricionistaId])

  useEffect(() => {
    fetchPacientes()
  }, [fetchPacientes])

  const filteredPacientes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return pacientes
    return pacientes.filter((p) => p.nome.toLowerCase().includes(query))
  }, [pacientes, searchTerm])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página com botão Novo Paciente */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Pacientes
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Gerencie os pacientes cadastrados, acompanhe objetivos e histórico
              de consultas.
            </p>
          </div>

          <Button asChild className="self-start sm:self-auto shadow-sm">
            <Link to="/pacientes/novo">
              <Plus className="h-4 w-4" />
              Novo Paciente
            </Link>
          </Button>
        </div>

        {/* Barra de busca por nome no topo da listagem */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Buscar paciente por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 bg-white border-[#6c873f]/20"
            aria-label="Buscar paciente por nome"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 rounded-md p-0.5 text-stone-400 hover:text-stone-600"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Listagem de pacientes */}
        <Card className="border-[#6c873f]/15 bg-white shadow-sm">
          <CardHeader className="pb-4 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-stone-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#6c873f]" />
                Pacientes Cadastrados
              </CardTitle>
              <span className="inline-flex items-center rounded-full bg-[#6c873f]/10 px-2.5 py-0.5 text-xs font-semibold text-[#6c873f]">
                {filteredPacientes.length}{" "}
                {filteredPacientes.length === 1 ? "paciente" : "pacientes"}
              </span>
            </div>
            <CardDescription>
              Clique em qualquer paciente da lista para acessar o perfil
              completo.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#6c873f]" />
                <span className="text-sm font-medium">
                  Carregando pacientes...
                </span>
              </div>
            ) : pacientes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6c873f]/10 text-[#6c873f]">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-stone-700">
                    Nenhum paciente cadastrado ainda
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm">
                    Comece cadastrando seu primeiro paciente para registrar
                    dados clínicos, hábitos e consultas.
                  </p>
                </div>
                <Button asChild size="sm" className="mt-2">
                  <Link to="/pacientes/novo">
                    <Plus className="h-4 w-4" />
                    Novo Paciente
                  </Link>
                </Button>
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-8 text-center">
                <p className="text-sm font-medium text-stone-600">
                  Nenhum paciente encontrado para "{searchTerm}".
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {filteredPacientes.map((p) => {
                  const objetivoResumo = formatObjetivoSummary(
                    p.objetivos,
                    p.objetivo_texto
                  )
                  return (
                    <li key={p.id} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        to={`/pacientes/${p.id}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 hover:bg-[#6c873f]/10 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6c873f]/15 text-[#6c873f] font-bold text-sm mt-0.5">
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-stone-900 group-hover:text-[#6c873f] transition-colors truncate">
                              {p.nome}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-stone-600">
                              <Target className="h-3.5 w-3.5 shrink-0 text-[#6c873f]" />
                              <span className="truncate">{objetivoResumo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100/80 group-hover:bg-white px-2.5 py-1.5 rounded-lg transition-colors">
                            <Calendar className="h-3.5 w-3.5 text-[#6c873f]" />
                            <span>
                              Última consulta:{" "}
                              <strong className="font-medium text-stone-700">
                                {p.ultimaConsulta
                                  ? formatBrDate(p.ultimaConsulta)
                                  : "Sem consultas"}
                              </strong>
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-[#6c873f] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
