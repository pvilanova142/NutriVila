import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Loader2,
  Plus,
  Save,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { neonClient } from "@/lib/neon"
import { useAuth } from "@/contexts/AuthContext"
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  SEXO_OPTIONS,
  OBJETIVOS_PRESET,
  NIVEL_ATIVIDADE_OPTIONS,
  PATOLOGIAS_PRESET,
  RESTRICOES_PRESET,
  ALERGIAS_PRESET,
  formatPhoneNumber,
  calculateAgeFromBirthdate,
  convertNumericInputToTime,
  getImcClassification,
  getTodayIsoDate,
  formatBrDate,
} from "@/lib/paciente-utils"
import { MultiChoiceWithNoneAndCustom } from "@/components/MultiChoiceWithNoneAndCustom"
import { WeightChart } from "@/components/WeightChart"

type TabKey = "pessoal" | "clinico" | "habitos"

interface ConsultaRecord {
  id: string
  paciente_id: string
  data_consulta: string
  peso: number | null
  cintura: number | null
  quadril: number | null
  percentual_gordura: number | null
  observacoes: string | null
  proximo_retorno: string | null
  created_at?: string
}

interface PlanoAlimentarRecord {
  id: string
  paciente_id: string
  conteudo: unknown
  created_at: string
}

export function PacientePerfilPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { user, nutricionista } = useAuth()

  const nutricionistaId = nutricionista?.id || user?.id

  const stateSuccessMessage = (
    location.state as { successMessage?: string } | null
  )?.successMessage

  const [showInitialSuccess, setShowInitialSuccess] = useState<boolean>(
    Boolean(stateSuccessMessage)
  )

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("pessoal")

  // Dados editáveis do paciente — Aba 1: Pessoal
  const [nome, setNome] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [sexo, setSexo] = useState("")
  const [telefone, setTelefone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")

  // Aba 2: Clínico
  const [pesoAtual, setPesoAtual] = useState("")
  const [alturaCm, setAlturaCm] = useState("")
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [objetivoTexto, setObjetivoTexto] = useState("")
  const [nivelAtividade, setNivelAtividade] = useState("")
  const [patologias, setPatologias] = useState<string[]>([])
  const [restricoesAlimentares, setRestricoesAlimentares] = useState<string[]>(
    []
  )
  const [alergias, setAlergias] = useState<string[]>([])
  const [medicamentos, setMedicamentos] = useState("")
  const [suplementos, setSuplementos] = useState("")

  // Aba 3: Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState("")
  const [horarioAcorda, setHorarioAcorda] = useState("")
  const [horarioDorme, setHorarioDorme] = useState("")
  const [litrosAgua, setLitrosAgua] = useState("")
  const [atividadeFisica, setAtividadeFisica] = useState<boolean | null>(null)
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState("")
  const [observacoes, setObservacoes] = useState("")

  // Feedback de salvamento dos dados do paciente
  const [savingPaciente, setSavingPaciente] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Seção 2 — Consultas
  const [consultas, setConsultas] = useState<ConsultaRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [novaDataConsulta, setNovaDataConsulta] = useState(getTodayIsoDate())
  const [novoPeso, setNovoPeso] = useState("")
  const [novaCintura, setNovaCintura] = useState("")
  const [novoQuadril, setNovoQuadril] = useState("")
  const [novoPercentualGordura, setNovoPercentualGordura] = useState("")
  const [novasObservacoes, setNovasObservacoes] = useState("")
  const [novoProximoRetorno, setNovoProximoRetorno] = useState("")
  const [savingConsulta, setSavingConsulta] = useState(false)
  const [consultaError, setConsultaError] = useState<string | null>(null)

  // Seção 3 — Planos alimentares
  const [planos, setPlanos] = useState<PlanoAlimentarRecord[]>([])
  const [selectedPlano, setSelectedPlano] =
    useState<PlanoAlimentarRecord | null>(null)

  useEffect(() => {
    if (stateSuccessMessage) {
      setShowInitialSuccess(true)
      const timer = setTimeout(() => setShowInitialSuccess(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [stateSuccessMessage])

  const loadAllData = useCallback(async () => {
    if (!id || !nutricionistaId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setNotFound(false)

    try {
      const { data: pacData, error: pacError } = await neonClient
        .from("pacientes")
        .select("*")
        .eq("id", id)
        .eq("nutricionista_id", nutricionistaId)

      if (pacError) throw new Error(pacError.message)

      if (!pacData || pacData.length === 0) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const p = pacData[0]
      setNome(p.nome || "")
      setDataNascimento(p.data_nascimento ? String(p.data_nascimento).slice(0, 10) : "")
      setSexo(p.sexo || "")
      setTelefone(p.telefone || "")
      setWhatsapp(p.whatsapp || "")
      setEmail(p.email || "")
      setPesoAtual(p.peso_inicial != null ? String(p.peso_inicial) : "")
      setAlturaCm(p.altura != null ? String(p.altura) : "")
      setObjetivos(Array.isArray(p.objetivos) ? p.objetivos : [])
      setObjetivoTexto(p.objetivo_texto || "")
      setNivelAtividade(p.nivel_atividade || "")
      setPatologias(Array.isArray(p.patologias) ? p.patologias : [])
      setRestricoesAlimentares(
        Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : []
      )
      setAlergias(Array.isArray(p.alergias) ? p.alergias : [])
      setMedicamentos(p.medicamentos || "")
      setSuplementos(p.suplementos || "")
      setRefeicoesPorDia(
        p.refeicoes_por_dia != null ? String(p.refeicoes_por_dia) : ""
      )
      setHorarioAcorda(p.horario_acorda || "")
      setHorarioDorme(p.horario_dorme || "")
      setLitrosAgua(p.litros_agua != null ? String(p.litros_agua) : "")
      setAtividadeFisica(
        typeof p.atividade_fisica === "boolean" ? p.atividade_fisica : null
      )
      setAtividadeFisicaDescricao(p.atividade_fisica_descricao || "")
      setObservacoes(p.observacoes || "")

      // Carregar consultas em ordem cronológica decrescente
      const { data: consData, error: consError } = await neonClient
        .from("consultas")
        .select("*")
        .eq("paciente_id", id)
        .order("data_consulta", { ascending: false })

      if (!consError && consData) {
        setConsultas(consData as ConsultaRecord[])
      }

      // Carregar planos alimentares em ordem cronológica decrescente
      const { data: planosData, error: planosError } = await neonClient
        .from("planos_alimentares")
        .select("*")
        .eq("paciente_id", id)
        .order("created_at", { ascending: false })

      if (!planosError && planosData) {
        setPlanos(planosData as PlanoAlimentarRecord[])
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do paciente:", err)
    } finally {
      setLoading(false)
    }
  }, [id, nutricionistaId])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const calculatedAge = useMemo(
    () => calculateAgeFromBirthdate(dataNascimento),
    [dataNascimento]
  )

  const calculatedImc = useMemo(() => {
    const peso = parseFloat(pesoAtual.replace(",", "."))
    const altura = parseFloat(alturaCm.replace(",", "."))
    if (!peso || !altura || peso <= 0 || altura <= 0) return null
    const alturaMetros = altura > 3 ? altura / 100 : altura
    const imc = peso / (alturaMetros * alturaMetros)
    if (!Number.isFinite(imc) || imc <= 0) return null
    return Number(imc.toFixed(1))
  }, [pesoAtual, alturaCm])

  const toggleObjetivo = (objetivo: string) => {
    setObjetivos((prev) =>
      prev.includes(objetivo)
        ? prev.filter((item) => item !== objetivo)
        : [...prev, objetivo]
    )
  }

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)

    const trimmedNome = nome.trim()
    if (!trimmedNome) {
      setSaveError("O campo Nome completo é obrigatório.")
      setActiveTab("pessoal")
      return
    }

    if (!id || !nutricionistaId) return

    setSavingPaciente(true)
    try {
      const parsedPeso = pesoAtual
        ? parseFloat(pesoAtual.replace(",", "."))
        : null
      const parsedAltura = alturaCm
        ? parseFloat(alturaCm.replace(",", "."))
        : null
      const parsedRefeicoes = refeicoesPorDia
        ? parseInt(refeicoesPorDia, 10)
        : null
      const parsedLitrosAgua = litrosAgua
        ? parseFloat(litrosAgua.replace(",", "."))
        : null

      const formattedAcorda = horarioAcorda
        ? convertNumericInputToTime(horarioAcorda)
        : null
      const formattedDorme = horarioDorme
        ? convertNumericInputToTime(horarioDorme)
        : null

      if (formattedAcorda) setHorarioAcorda(formattedAcorda)
      if (formattedDorme) setHorarioDorme(formattedDorme)

      const payload = {
        nome: trimmedNome,
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        peso_inicial:
          parsedPeso !== null && !Number.isNaN(parsedPeso) ? parsedPeso : null,
        altura:
          parsedAltura !== null && !Number.isNaN(parsedAltura)
            ? parsedAltura
            : null,
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares:
          restricoesAlimentares.length > 0 ? restricoesAlimentares : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia:
          parsedRefeicoes !== null && !Number.isNaN(parsedRefeicoes)
            ? parsedRefeicoes
            : null,
        horario_acorda: formattedAcorda || null,
        horario_dorme: formattedDorme || null,
        litros_agua:
          parsedLitrosAgua !== null && !Number.isNaN(parsedLitrosAgua)
            ? parsedLitrosAgua
            : null,
        atividade_fisica: atividadeFisica,
        atividade_fisica_descricao:
          atividadeFisica === true
            ? atividadeFisicaDescricao.trim() || null
            : null,
        observacoes: observacoes.trim() || null,
      }

      const { error: updateError } = await neonClient
        .from("pacientes")
        .update(payload)
        .eq("id", id)
        .eq("nutricionista_id", nutricionistaId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSaveSuccess("Alterações salvas com sucesso!")
      setTimeout(() => setSaveSuccess(null), 5000)
    } catch (err: any) {
      console.error("Erro ao atualizar paciente:", err)
      setSaveError(
        err?.message || "Não foi possível salvar as alterações. Tente novamente."
      )
    } finally {
      setSavingPaciente(false)
    }
  }

  const openNovaConsultaModal = () => {
    setNovaDataConsulta(getTodayIsoDate())
    setNovoPeso("")
    setNovaCintura("")
    setNovoQuadril("")
    setNovoPercentualGordura("")
    setNovasObservacoes("")
    setNovoProximoRetorno("")
    setConsultaError(null)
    setIsModalOpen(true)
  }

  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setConsultaError(null)

    if (!novaDataConsulta) {
      setConsultaError("Informe a data da consulta.")
      return
    }

    setSavingConsulta(true)
    try {
      const parsedPeso = novoPeso ? parseFloat(novoPeso.replace(",", ".")) : null
      const parsedCintura = novaCintura
        ? parseFloat(novaCintura.replace(",", "."))
        : null
      const parsedQuadril = novoQuadril
        ? parseFloat(novoQuadril.replace(",", "."))
        : null
      const parsedGordura = novoPercentualGordura
        ? parseFloat(novoPercentualGordura.replace(",", "."))
        : null

      const { data: inserted, error: insertError } = await neonClient
        .from("consultas")
        .insert({
          paciente_id: id,
          data_consulta: novaDataConsulta,
          peso:
            parsedPeso !== null && !Number.isNaN(parsedPeso) ? parsedPeso : null,
          cintura:
            parsedCintura !== null && !Number.isNaN(parsedCintura)
              ? parsedCintura
              : null,
          quadril:
            parsedQuadril !== null && !Number.isNaN(parsedQuadril)
              ? parsedQuadril
              : null,
          percentual_gordura:
            parsedGordura !== null && !Number.isNaN(parsedGordura)
              ? parsedGordura
              : null,
          observacoes: novasObservacoes.trim() || null,
          proximo_retorno: novoProximoRetorno || null,
        })
        .select()

      if (insertError) {
        throw new Error(insertError.message)
      }

      if (inserted && inserted.length > 0) {
        const nova = inserted[0] as ConsultaRecord
        setConsultas((prev) =>
          [nova, ...prev].sort((a, b) =>
            b.data_consulta.localeCompare(a.data_consulta)
          )
        )
      }

      setIsModalOpen(false)
    } catch (err: any) {
      console.error("Erro ao salvar consulta:", err)
      setConsultaError(
        err?.message || "Não foi possível salvar a consulta. Tente novamente."
      )
    } finally {
      setSavingConsulta(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "pessoal", label: "1. Pessoal", icon: User },
    { key: "clinico", label: "2. Clínico", icon: HeartPulse },
    { key: "habitos", label: "3. Hábitos", icon: Activity },
  ]

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/pacientes">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                {loading ? "Carregando..." : nome || "Perfil do Paciente"}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Dados cadastrais, histórico de consultas e planos alimentares.
              </p>
            </div>
          </div>
        </div>

        {showInitialSuccess && stateSuccessMessage && (
          <Alert variant="success" className="animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {stateSuccessMessage}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card className="border-[#6c873f]/15 bg-white shadow-sm">
            <CardContent className="py-16 flex items-center justify-center gap-2 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#6c873f]" />
              <span>Carregando perfil do paciente...</span>
            </CardContent>
          </Card>
        ) : notFound ? (
          <Card className="border-[#6c873f]/15 bg-white shadow-sm">
            <CardContent className="py-12 text-center text-sm text-stone-500">
              Não foi possível localizar este paciente na sua conta.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* =========================================================
                SEÇÃO 1 — DADOS DO PACIENTE (Editáveis em 3 abas)
               ========================================================= */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#6c873f]" />
                  Dados do Paciente
                </h2>
              </div>

              <div
                role="tablist"
                aria-label="Abas dos dados do paciente"
                className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 border border-[#6c873f]/15 shadow-xs"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-semibold transition-all",
                        isActive
                          ? "bg-[#6c873f] text-white shadow-sm shadow-[#6c873f]/25"
                          : "text-stone-600 hover:bg-[#6c873f]/10 hover:text-[#6c873f]"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {saveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {saveSuccess}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSavePaciente} noValidate>
                <Card className="border-[#6c873f]/15 bg-white shadow-sm">
                  <CardContent className="pt-6 space-y-6">
                    {/* ABA 1 — PESSOAL */}
                    {activeTab === "pessoal" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="edit-nome" className="font-semibold">
                            Nome completo{" "}
                            <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id="edit-nome"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="edit-nascimento">
                              Data de nascimento
                            </Label>
                            {calculatedAge !== null && (
                              <span className="inline-flex items-center rounded-full bg-[#6c873f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#4d622b]">
                                {calculatedAge}{" "}
                                {calculatedAge === 1 ? "ano" : "anos"}
                              </span>
                            )}
                          </div>
                          <Input
                            id="edit-nascimento"
                            type="date"
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Sexo</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {SEXO_OPTIONS.map((option) => {
                              const selected = sexo === option
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    setSexo(selected ? "" : option)
                                  }
                                  className={cn(
                                    "h-11 rounded-lg border text-xs sm:text-sm font-medium transition-all",
                                    selected
                                      ? "border-[#6c873f] bg-[#6c873f] text-white shadow-xs"
                                      : "border-stone-200 bg-white text-stone-700 hover:border-[#6c873f]/50 hover:bg-[#6c873f]/5"
                                  )}
                                >
                                  {option}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-telefone">Telefone</Label>
                          <Input
                            id="edit-telefone"
                            type="tel"
                            placeholder="(11) 3456-7890"
                            value={telefone}
                            onChange={(e) =>
                              setTelefone(formatPhoneNumber(e.target.value))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                          <Input
                            id="edit-whatsapp"
                            type="tel"
                            placeholder="(11) 98765-4321"
                            value={whatsapp}
                            onChange={(e) =>
                              setWhatsapp(formatPhoneNumber(e.target.value))
                            }
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* ABA 2 — CLÍNICO */}
                    {activeTab === "clinico" && (
                      <div className="space-y-7">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-peso">Peso inicial</Label>
                            <div className="relative">
                              <Input
                                id="edit-peso"
                                type="number"
                                step="0.1"
                                min="0"
                                value={pesoAtual}
                                onChange={(e) => setPesoAtual(e.target.value)}
                                className="pr-12"
                              />
                              <span className="pointer-events-none absolute right-3.5 top-3 text-xs font-semibold text-stone-500">
                                kg
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-altura">Altura</Label>
                            <div className="relative">
                              <Input
                                id="edit-altura"
                                type="number"
                                step="0.5"
                                min="0"
                                value={alturaCm}
                                onChange={(e) => setAlturaCm(e.target.value)}
                                className="pr-12"
                              />
                              <span className="pointer-events-none absolute right-3.5 top-3 text-xs font-semibold text-stone-500">
                                cm
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit-imc">IMC (calculado)</Label>
                              {calculatedImc !== null && (
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                    getImcClassification(calculatedImc)
                                      .colorClass
                                  )}
                                >
                                  {getImcClassification(calculatedImc).label}
                                </span>
                              )}
                            </div>
                            <Input
                              id="edit-imc"
                              type="text"
                              readOnly
                              value={
                                calculatedImc !== null
                                  ? `${calculatedImc} kg/m²`
                                  : "Preencha peso e altura"
                              }
                              className="bg-stone-50 text-stone-700 font-semibold cursor-default"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-stone-800">
                            Objetivo
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {OBJETIVOS_PRESET.map((obj) => {
                              const active = objetivos.includes(obj)
                              return (
                                <button
                                  key={obj}
                                  type="button"
                                  onClick={() => toggleObjetivo(obj)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all",
                                    active
                                      ? "border-[#6c873f] bg-[#6c873f] text-white shadow-xs"
                                      : "border-stone-200 bg-white text-stone-700 hover:border-[#6c873f]/50 hover:bg-[#6c873f]/5"
                                  )}
                                >
                                  {active && <Check className="h-3.5 w-3.5" />}
                                  {obj}
                                </button>
                              )
                            })}
                          </div>
                          <Input
                            type="text"
                            placeholder="Objetivo adicional em texto livre..."
                            value={objetivoTexto}
                            onChange={(e) => setObjetivoTexto(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-stone-800">
                            Nível de atividade física
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {NIVEL_ATIVIDADE_OPTIONS.map((nivel) => {
                              const active = nivelAtividade === nivel
                              return (
                                <button
                                  key={nivel}
                                  type="button"
                                  onClick={() =>
                                    setNivelAtividade(active ? "" : nivel)
                                  }
                                  className={cn(
                                    "rounded-xl border px-3 py-2.5 text-xs font-medium transition-all text-center",
                                    active
                                      ? "border-[#6c873f] bg-[#6c873f] text-white shadow-xs"
                                      : "border-stone-200 bg-white text-stone-700 hover:border-[#6c873f]/50 hover:bg-[#6c873f]/5"
                                  )}
                                >
                                  {nivel}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <MultiChoiceWithNoneAndCustom
                          label="Patologias ou condições de saúde"
                          presetOptions={PATOLOGIAS_PRESET}
                          selected={patologias}
                          onChange={setPatologias}
                          placeholderCustom="Adicionar outra patologia ou condição..."
                        />

                        <MultiChoiceWithNoneAndCustom
                          label="Restrições alimentares"
                          presetOptions={RESTRICOES_PRESET}
                          selected={restricoesAlimentares}
                          onChange={setRestricoesAlimentares}
                          placeholderCustom="Adicionar outra restrição alimentar..."
                        />

                        <MultiChoiceWithNoneAndCustom
                          label="Alergias alimentares"
                          presetOptions={ALERGIAS_PRESET}
                          selected={alergias}
                          onChange={setAlergias}
                          placeholderCustom="Adicionar outra alergia alimentar..."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="edit-medicamentos">
                              Medicamentos contínuos
                            </Label>
                            <textarea
                              id="edit-medicamentos"
                              rows={3}
                              value={medicamentos}
                              onChange={(e) => setMedicamentos(e.target.value)}
                              className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-suplementos">
                              Suplementos em uso
                            </Label>
                            <textarea
                              id="edit-suplementos"
                              rows={3}
                              value={suplementos}
                              onChange={(e) => setSuplementos(e.target.value)}
                              className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ABA 3 — HÁBITOS */}
                    {activeTab === "habitos" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="edit-refeicoes">
                              Quantas refeições faz por dia
                            </Label>
                            <Input
                              id="edit-refeicoes"
                              type="number"
                              min="1"
                              max="15"
                              value={refeicoesPorDia}
                              onChange={(e) =>
                                setRefeicoesPorDia(e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-agua">
                              Quantidade de água por dia
                            </Label>
                            <div className="relative">
                              <Input
                                id="edit-agua"
                                type="number"
                                step="0.1"
                                min="0"
                                value={litrosAgua}
                                onChange={(e) => setLitrosAgua(e.target.value)}
                                className="pr-16"
                              />
                              <span className="pointer-events-none absolute right-3.5 top-3 text-xs font-semibold text-stone-500">
                                litros
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-acorda">
                              Horário que acorda
                            </Label>
                            <div className="relative">
                              <Clock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                              <Input
                                id="edit-acorda"
                                type="text"
                                inputMode="numeric"
                                value={horarioAcorda}
                                onChange={(e) =>
                                  setHorarioAcorda(e.target.value)
                                }
                                onBlur={(e) =>
                                  setHorarioAcorda(
                                    convertNumericInputToTime(e.target.value)
                                  )
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-dorme">
                              Horário que dorme
                            </Label>
                            <div className="relative">
                              <Clock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                              <Input
                                id="edit-dorme"
                                type="text"
                                inputMode="numeric"
                                value={horarioDorme}
                                onChange={(e) =>
                                  setHorarioDorme(e.target.value)
                                }
                                onBlur={(e) =>
                                  setHorarioDorme(
                                    convertNumericInputToTime(e.target.value)
                                  )
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-stone-800">
                            Pratica atividade física?
                          </Label>
                          <div className="flex items-center gap-3 max-w-xs">
                            <button
                              type="button"
                              onClick={() => setAtividadeFisica(true)}
                              className={cn(
                                "flex-1 h-11 rounded-xl border text-sm font-semibold transition-all",
                                atividadeFisica === true
                                  ? "border-[#6c873f] bg-[#6c873f] text-white shadow-xs"
                                  : "border-stone-200 bg-white text-stone-700 hover:border-[#6c873f]/50"
                              )}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setAtividadeFisica(false)}
                              className={cn(
                                "flex-1 h-11 rounded-xl border text-sm font-semibold transition-all",
                                atividadeFisica === false
                                  ? "border-stone-700 bg-stone-800 text-white shadow-xs"
                                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                              )}
                            >
                              Não
                            </button>
                          </div>

                          {atividadeFisica === true && (
                            <div className="space-y-2 pt-2">
                              <Label htmlFor="edit-atividade-desc">
                                Qual atividade e frequência semanal?
                              </Label>
                              <Input
                                id="edit-atividade-desc"
                                type="text"
                                value={atividadeFisicaDescricao}
                                onChange={(e) =>
                                  setAtividadeFisicaDescricao(e.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-observacoes">
                            Observações gerais
                          </Label>
                          <textarea
                            id="edit-observacoes"
                            rows={4}
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-stone-100">
                      <Button type="submit" disabled={savingPaciente}>
                        {savingPaciente ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salvar alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </section>

            {/* =========================================================
                SEÇÃO 2 — CONSULTAS
               ========================================================= */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#6c873f]" />
                    Consultas e Evolução
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Acompanhe a evolução de peso e o histórico de atendimentos.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={openNovaConsultaModal}
                  className="self-start sm:self-auto shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Nova Consulta
                </Button>
              </div>

              {/* Gráfico de evolução de peso sempre visível */}
              <Card className="border-[#6c873f]/20 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-stone-100">
                  <CardTitle className="text-base font-bold text-stone-800">
                    Evolução de Peso
                  </CardTitle>
                  <CardDescription>
                    Peso registrado em cada consulta ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <WeightChart consultas={consultas} />
                </CardContent>
              </Card>

              {/* Lista de consultas em ordem cronológica decrescente */}
              <Card className="border-[#6c873f]/15 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-stone-100">
                  <CardTitle className="text-base font-semibold text-stone-800">
                    Histórico de Consultas ({consultas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {consultas.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center">
                      <p className="text-sm font-medium text-stone-600">
                        Nenhuma consulta registrada ainda
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {consultas.map((c) => (
                        <div
                          key={c.id}
                          className="py-4 first:pt-0 last:pb-0 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-stone-900 text-sm">
                              <Calendar className="h-4 w-4 text-[#6c873f]" />
                              {formatBrDate(c.data_consulta)}
                            </span>

                            {c.proximo_retorno && (
                              <span className="inline-flex items-center rounded-full bg-[#6c873f]/10 px-2.5 py-0.5 text-xs font-medium text-[#4d622b]">
                                Próximo retorno: {formatBrDate(c.proximo_retorno)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="rounded-lg bg-stone-50 px-3 py-2 border border-stone-100">
                              <span className="text-stone-500 block">Peso</span>
                              <span className="font-semibold text-stone-800">
                                {c.peso != null ? `${c.peso} kg` : "—"}
                              </span>
                            </div>
                            <div className="rounded-lg bg-stone-50 px-3 py-2 border border-stone-100">
                              <span className="text-stone-500 block">
                                Cintura
                              </span>
                              <span className="font-semibold text-stone-800">
                                {c.cintura != null ? `${c.cintura} cm` : "—"}
                              </span>
                            </div>
                            <div className="rounded-lg bg-stone-50 px-3 py-2 border border-stone-100">
                              <span className="text-stone-500 block">
                                Quadril
                              </span>
                              <span className="font-semibold text-stone-800">
                                {c.quadril != null ? `${c.quadril} cm` : "—"}
                              </span>
                            </div>
                            <div className="rounded-lg bg-stone-50 px-3 py-2 border border-stone-100">
                              <span className="text-stone-500 block">
                                % Gordura
                              </span>
                              <span className="font-semibold text-stone-800">
                                {c.percentual_gordura != null
                                  ? `${c.percentual_gordura}%`
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          {c.observacoes && (
                            <p className="text-xs text-stone-600 bg-stone-50/50 rounded-lg p-2.5 border border-stone-100">
                              <strong className="text-stone-700">
                                Observações:
                              </strong>{" "}
                              {c.observacoes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* =========================================================
                SEÇÃO 3 — PLANOS ALIMENTARES
               ========================================================= */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#6c873f]" />
                    Planos Alimentares
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Histórico de planos alimentares gerados para este paciente.
                  </p>
                </div>

                <Button
                  type="button"
                  className="self-start sm:self-auto shadow-sm"
                  title="Será implementado no próximo passo"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar Plano Alimentar
                </Button>
              </div>

              <Card className="border-[#6c873f]/15 bg-white shadow-sm">
                <CardContent className="pt-6">
                  {planos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-8 text-center">
                      <p className="text-sm font-medium text-stone-600">
                        Nenhum plano alimentar gerado ainda
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ul className="divide-y divide-stone-100">
                        {planos.map((plano) => {
                          const isSelected = selectedPlano?.id === plano.id
                          return (
                            <li key={plano.id} className="py-2 first:pt-0 last:pb-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPlano(isSelected ? null : plano)
                                }
                                className={cn(
                                  "w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left transition-colors",
                                  isSelected
                                    ? "bg-[#6c873f]/10 text-[#4d622b]"
                                    : "hover:bg-stone-50 text-stone-800"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <FileText className="h-4 w-4 text-[#6c873f]" />
                                  <span className="text-sm font-semibold">
                                    Plano gerado em{" "}
                                    {formatBrDate(plano.created_at)}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-[#6c873f]">
                                  {isSelected ? "Ocultar" : "Ver plano"}
                                </span>
                              </button>

                              {isSelected && (
                                <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700 overflow-x-auto">
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {typeof plano.conteudo === "string"
                                      ? plano.conteudo
                                      : JSON.stringify(plano.conteudo, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>

      {/* =========================================================
          MODAL — NOVA CONSULTA
         ========================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-nova-consulta-title"
        >
          <Card className="w-full max-w-lg bg-white shadow-2xl border-[#6c873f]/20 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <CardTitle
                  id="modal-nova-consulta-title"
                  className="text-lg font-bold text-stone-900"
                >
                  Nova Consulta
                </CardTitle>
                <CardDescription>
                  Registre as medidas e observações do atendimento.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveConsulta} noValidate>
              <CardContent className="pt-5 space-y-4">
                {consultaError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{consultaError}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consulta-data">Data da consulta</Label>
                    <Input
                      id="consulta-data"
                      type="date"
                      value={novaDataConsulta}
                      onChange={(e) => setNovaDataConsulta(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consulta-peso">Peso atual (kg)</Label>
                    <Input
                      id="consulta-peso"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 68.5"
                      value={novoPeso}
                      onChange={(e) => setNovoPeso(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consulta-cintura">
                      Cintura (cm){" "}
                      <span className="text-xs text-stone-400">(opcional)</span>
                    </Label>
                    <Input
                      id="consulta-cintura"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 78"
                      value={novaCintura}
                      onChange={(e) => setNovaCintura(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consulta-quadril">
                      Quadril (cm){" "}
                      <span className="text-xs text-stone-400">(opcional)</span>
                    </Label>
                    <Input
                      id="consulta-quadril"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 98"
                      value={novoQuadril}
                      onChange={(e) => setNovoQuadril(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consulta-gordura">
                      % de gordura{" "}
                      <span className="text-xs text-stone-400">(opcional)</span>
                    </Label>
                    <Input
                      id="consulta-gordura"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="Ex: 22.5"
                      value={novoPercentualGordura}
                      onChange={(e) => setNovoPercentualGordura(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consulta-retorno">Próximo retorno</Label>
                    <Input
                      id="consulta-retorno"
                      type="date"
                      value={novoProximoRetorno}
                      onChange={(e) => setNovoProximoRetorno(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consulta-obs">Observações</Label>
                  <textarea
                    id="consulta-obs"
                    rows={3}
                    placeholder="Evolução, aderência ao plano, ajustes realizados..."
                    value={novasObservacoes}
                    onChange={(e) => setNovasObservacoes(e.target.value)}
                    className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f]"
                  />
                </div>
              </CardContent>

              <div className="flex items-center justify-end gap-2 border-t border-stone-100 p-6 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingConsulta}>
                  {savingConsulta ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar consulta
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
