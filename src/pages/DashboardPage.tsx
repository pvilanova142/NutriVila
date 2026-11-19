import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react"
import { neonClient } from "@/lib/neon"
import { useAuth } from "@/contexts/AuthContext"
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
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
  email?: string | null
  telefone?: string | null
  created_at?: string
}

interface ConsultaRow {
  id: string
  paciente_id: string
  data_consulta: string
  proximo_retorno?: string | null
  created_at?: string
}

interface PacienteSemRetorno {
  id: string
  nome: string
  ultimaConsulta: string
  diasDesdeUltimaConsulta: number
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getCurrentWeekBounds(): { startStr: string; endStr: string } {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 (Dom) a 6 (Sáb)
  // Considerando início da semana no Domingo (ou Segunda-feira se preferir; usamos Domingo a Sábado)
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return {
    startStr: toLocalIsoDate(start),
    endStr: toLocalIsoDate(end),
  }
}

function formatBrDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-")
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

export function DashboardPage() {
  const { user, nutricionista } = useAuth()

  const [totalPacientes, setTotalPacientes] = useState<number>(0)
  const [consultasSemana, setConsultasSemana] = useState<number>(0)
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState<
    PacienteSemRetorno[]
  >([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const displayName = nutricionista?.nome || user?.name || "Nutricionista"
  const nutricionistaId = nutricionista?.id || user?.id

  const loadDashboardData = useCallback(
    async (isBackgroundRefresh = false) => {
      if (!nutricionistaId) {
        setLoading(false)
        return
      }

      if (isBackgroundRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        // 1. Buscar todos os pacientes ativos da nutricionista logada
        const { data: pacientesData, error: pacientesError } = await neonClient
          .from("pacientes")
          .select("id, nutricionista_id, nome, email, telefone, created_at")
          .eq("nutricionista_id", nutricionistaId)
          .order("nome", { ascending: true })

        if (pacientesError) {
          throw new Error(pacientesError.message)
        }

        const pacientes: PacienteRow[] = (pacientesData || []) as PacienteRow[]
        setTotalPacientes(pacientes.length)

        if (pacientes.length === 0) {
          setConsultasSemana(0)
          setPacientesSemRetorno([])
          return
        }

        const pacienteIds = pacientes.map((p) => p.id)

        // 2. Buscar consultas dos pacientes da nutricionista logada
        const { data: consultasData, error: consultasError } = await neonClient
          .from("consultas")
          .select("id, paciente_id, data_consulta, proximo_retorno, created_at")
          .in("paciente_id", pacienteIds)
          .order("data_consulta", { ascending: false })

        if (consultasError) {
          throw new Error(consultasError.message)
        }

        const consultas: ConsultaRow[] = (consultasData || []) as ConsultaRow[]

        // Card 2: Consultas da semana atual
        const { startStr, endStr } = getCurrentWeekBounds()
        const consultasNaSemana = consultas.filter((c) => {
          const dataStr = c.data_consulta?.slice(0, 10)
          return dataStr && dataStr >= startStr && dataStr <= endStr
        })
        setConsultasSemana(consultasNaSemana.length)

        // Card 3: Pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = toLocalIsoDate(today)

        const cutoffDate = new Date(today)
        cutoffDate.setDate(today.getDate() - 30)
        const cutoffStr = toLocalIsoDate(cutoffDate)

        // Agrupar consultas por paciente (já ordenadas por data_consulta DESC)
        const consultasPorPaciente = new Map<string, ConsultaRow[]>()
        for (const consulta of consultas) {
          const lista = consultasPorPaciente.get(consulta.paciente_id) || []
          lista.push(consulta)
          consultasPorPaciente.set(consulta.paciente_id, lista)
        }

        const semRetornoList: PacienteSemRetorno[] = []

        for (const paciente of pacientes) {
          const hist = consultasPorPaciente.get(paciente.id)
          if (!hist || hist.length === 0) {
            continue
          }

          // Garantir que a primeira é a consulta mais recente
          const sorted = [...hist].sort((a, b) =>
            b.data_consulta.localeCompare(a.data_consulta)
          )
          const ultima = sorted[0]
          const ultimaDataStr = ultima.data_consulta.slice(0, 10)

          // Verifica se a última consulta foi há mais de 30 dias (< cutoffStr)
          const foiHaMaisDe30Dias = ultimaDataStr < cutoffStr

          // Verifica se possui próximo retorno agendado (na última consulta ou em qualquer registro ativo futuro)
          const temRetornoAgendado = sorted.some((c) => {
            if (!c.proximo_retorno) return false
            const retornoStr = c.proximo_retorno.slice(0, 10)
            return retornoStr >= todayStr
          }) && Boolean(ultima.proximo_retorno)

          // Se proximo_retorno for nulo/vazio na última consulta (ou já passou e não há retorno agendado)
          const naoPossuiProximoRetorno =
            !ultima.proximo_retorno || !temRetornoAgendado

          if (foiHaMaisDe30Dias && naoPossuiProximoRetorno) {
            const [y, m, d] = ultimaDataStr.split("-").map(Number)
            const ultimaDateObj = new Date(y, m - 1, d)
            const diffTime = today.getTime() - ultimaDateObj.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

            semRetornoList.push({
              id: paciente.id,
              nome: paciente.nome,
              ultimaConsulta: ultimaDataStr,
              diasDesdeUltimaConsulta: diffDays,
            })
          }
        }

        setPacientesSemRetorno(semRetornoList)
      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard:", err)
        setError(
          "Não foi possível carregar os indicadores em tempo real. Tente atualizar novamente."
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [nutricionistaId]
  )

  useEffect(() => {
    loadDashboardData(false)

    // Atualização automática quando a aba ganha foco para refletir dados em tempo real
    const handleFocus = () => {
      loadDashboardData(true)
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [loadDashboardData])

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Cabeçalho de boas-vindas */}
        <div className="rounded-2xl bg-[#6c873f] p-6 sm:p-8 text-white shadow-lg shadow-[#6c873f]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-[#f8f8ff]">
              <UserCheck className="h-3.5 w-3.5" />
              Painel Principal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight pt-1">
              Olá, {displayName}!
            </h1>
            <p className="text-[#f8f8ff]/90 text-sm sm:text-base">
              Acompanhe em tempo real o resumo dos seus pacientes e atendimentos.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={loading || refreshing}
            className="self-start sm:self-center bg-white/15 text-white hover:bg-white/25 border-0"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar dados
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Cards de informação */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card 1 — Total de pacientes ativos */}
          <Card className="border-[#6c873f]/15 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-stone-600">
                Total de pacientes ativos
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-[#6c873f]/10 flex items-center justify-center text-[#6c873f]">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-stone-400">
                  <Loader2 className="h-5 w-5 animate-spin text-[#6c873f]" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-stone-900">
                    {totalPacientes}
                  </div>
                  <CardDescription className="mt-1.5 text-stone-500">
                    Pacientes cadastrados sob seu acompanhamento
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2 — Consultas da semana */}
          <Card className="border-[#6c873f]/15 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-stone-600">
                Consultas da semana
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-[#6c873f]/10 flex items-center justify-center text-[#6c873f]">
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-stone-400">
                  <Loader2 className="h-5 w-5 animate-spin text-[#6c873f]" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-stone-900">
                    {consultasSemana}
                  </div>
                  <CardDescription className="mt-1.5 text-stone-500">
                    Consultas registradas na semana atual
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 3 — Pacientes sem retorno */}
          <Card className="border-[#6c873f]/15 bg-white shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold text-stone-600">
                  Pacientes sem retorno
                </CardTitle>
                <CardDescription className="text-xs text-stone-400 mt-0.5">
                  Última consulta há +30 dias sem retorno agendado
                </CardDescription>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[#6c873f]/10 flex items-center justify-center text-[#6c873f]">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-stone-400">
                  <Loader2 className="h-5 w-5 animate-spin text-[#6c873f]" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : pacientesSemRetorno.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-4 text-center">
                  <p className="text-sm font-medium text-stone-600">
                    Nenhum paciente sem retorno no momento
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-stone-100 max-h-60 overflow-y-auto pr-1">
                  {pacientesSemRetorno.map((paciente) => (
                    <li key={paciente.id} className="py-2 first:pt-0 last:pb-0">
                      <Link
                        to={`/pacientes/${paciente.id}`}
                        className="group flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-[#6c873f]/10 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-800 group-hover:text-[#6c873f] transition-colors">
                            {paciente.nome}
                          </p>
                          <p className="text-xs text-stone-500">
                            Última consulta:{" "}
                            {formatBrDate(paciente.ultimaConsulta)} (
                            {paciente.diasDesdeUltimaConsulta} dias)
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-[#6c873f] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
