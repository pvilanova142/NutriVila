import React, { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  Loader2,
  Save,
  User,
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
  CardFooter,
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
} from "@/lib/paciente-utils"
import { MultiChoiceWithNoneAndCustom } from "@/components/MultiChoiceWithNoneAndCustom"

type TabKey = "pessoal" | "clinico" | "habitos"


export function NovoPacientePage() {
  const navigate = useNavigate()
  const { user, nutricionista } = useAuth()

  const [activeTab, setActiveTab] = useState<TabKey>("pessoal")

  // Aba 1 — Pessoal
  const [nome, setNome] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [dataInicioTratamento, setDataInicioTratamento] = useState(
    getTodayIsoDate()
  )
  const [sexo, setSexo] = useState<string>("")
  const [telefone, setTelefone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")

  // Aba 2 — Clínico
  const [pesoAtual, setPesoAtual] = useState("")
  const [alturaCm, setAlturaCm] = useState("")
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [objetivoTexto, setObjetivoTexto] = useState("")
  const [nivelAtividade, setNivelAtividade] = useState<string>("")
  const [patologias, setPatologias] = useState<string[]>([])
  const [restricoesAlimentares, setRestricoesAlimentares] = useState<string[]>(
    []
  )
  const [alergias, setAlergias] = useState<string[]>([])
  const [medicamentos, setMedicamentos] = useState("")
  const [suplementos, setSuplementos] = useState("")

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState("")
  const [horarioAcorda, setHorarioAcorda] = useState("")
  const [horarioDorme, setHorarioDorme] = useState("")
  const [litrosAgua, setLitrosAgua] = useState("")
  const [atividadeFisica, setAtividadeFisica] = useState<boolean | null>(null)
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState("")
  const [observacoes, setObservacoes] = useState("")

  // Estados de envio e feedback
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const nutricionistaId = nutricionista?.id || user?.id

  // Cálculo automático da idade a partir da data de nascimento
  const calculatedAge = useMemo(
    () => calculateAgeFromBirthdate(dataNascimento),
    [dataNascimento]
  )

  // Cálculo automático do IMC a partir do peso (kg) e altura (cm)
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

  const handleHorarioBlur = (
    raw: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const formatted = convertNumericInputToTime(raw)
    setter(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedNome = nome.trim()
    if (!trimmedNome) {
      setError("O campo Nome completo é obrigatório.")
      setActiveTab("pessoal")
      return
    }

    if (!nutricionistaId) {
      setError(
        "Não foi possível identificar a nutricionista logada. Faça login novamente."
      )
      return
    }

    setSubmitting(true)

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

      const payload = {
        nutricionista_id: nutricionistaId,
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

      const { data, error: insertError } = await neonClient
        .from("pacientes")
        .insert(payload)
        .select()

      if (insertError) {
        throw new Error(insertError.message)
      }

      const novoPaciente = data?.[0]

      if (novoPaciente?.id && dataInicioTratamento) {
        const { error: consultaError } = await neonClient
          .from("consultas")
          .insert({
            paciente_id: novoPaciente.id,
            data_consulta: dataInicioTratamento,
            peso:
              parsedPeso !== null && !Number.isNaN(parsedPeso)
                ? parsedPeso
                : null,
            observacoes: "Início do tratamento",
          })

        if (consultaError) {
          console.error(
            "Erro ao registrar primeira consulta:",
            consultaError.message
          )
        }
      }

      setSuccessMessage("Paciente cadastrado com sucesso! Redirecionando...")

      setTimeout(() => {
        if (novoPaciente?.id) {
          navigate(`/pacientes/${novoPaciente.id}`, {
            replace: true,
            state: {
              successMessage: "Paciente cadastrado com sucesso!",
            },
          })
        } else {
          navigate("/pacientes", { replace: true })
        }
      }, 700)
    } catch (err: any) {
      console.error("Erro ao cadastrar paciente:", err)
      setError(
        err?.message ||
          "Ocorreu um erro ao salvar o cadastro do paciente. Tente novamente."
      )
      setSubmitting(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "pessoal", label: "1. Pessoal", icon: User },
    { key: "clinico", label: "2. Clínico", icon: HeartPulse },
    { key: "habitos", label: "3. Hábitos", icon: Activity },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Topo com botão Voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/pacientes">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                Novo Paciente
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Preencha as informações abaixo. Apenas o nome completo é
                obrigatório.
              </p>
            </div>
          </div>
        </div>

        {/* Navegação das 3 abas: Pessoal, Clínico e Hábitos */}
        <div
          role="tablist"
          aria-label="Abas do cadastro de paciente"
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
                  "flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-xs sm:text-sm font-semibold transition-all",
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Card className="border-[#6c873f]/15 bg-white shadow-sm">
            {/* ABA 1 — PESSOAL */}
            {activeTab === "pessoal" && (
              <>
                <CardHeader className="border-b border-stone-100">
                  <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <User className="h-5 w-5 text-[#6c873f]" />
                    Dados Pessoais
                  </CardTitle>
                  <CardDescription>
                    Informações básicas e de contato do paciente.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Nome completo (obrigatório) */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nome" className="font-semibold">
                        Nome completo <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Ex: Ana Carolina Souza"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                      />
                    </div>

                    {/* Data de nascimento + cálculo automático da idade */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dataNascimento">
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
                        id="dataNascimento"
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                      />
                    </div>

                    {/* Sexo (seleção única: Feminino, Masculino, Outro) */}
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

                    {/* Telefone (número formatado) */}
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        type="tel"
                        placeholder="(11) 3456-7890"
                        value={telefone}
                        onChange={(e) =>
                          setTelefone(formatPhoneNumber(e.target.value))
                        }
                      />
                    </div>

                    {/* WhatsApp (número formatado) */}
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 98765-4321"
                        value={whatsapp}
                        onChange={(e) =>
                          setWhatsapp(formatPhoneNumber(e.target.value))
                        }
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="paciente@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {/* Data de início do tratamento */}
                    <div className="space-y-2">
                      <Label htmlFor="dataInicioTratamento">
                        Data de início do tratamento
                      </Label>
                      <Input
                        id="dataInicioTratamento"
                        type="date"
                        value={dataInicioTratamento}
                        onChange={(e) => setDataInicioTratamento(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-stone-100 pt-5">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Paciente
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveTab("clinico")}
                  >
                    Próxima aba: Clínico
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </>
            )}

            {/* ABA 2 — CLÍNICO */}
            {activeTab === "clinico" && (
              <>
                <CardHeader className="border-b border-stone-100">
                  <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-[#6c873f]" />
                    Dados Clínicos e Antropométricos
                  </CardTitle>
                  <CardDescription>
                    Medidas iniciais, objetivos, patologias, restrições e
                    alergias.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-7">
                  {/* Peso, Altura e IMC */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Peso atual em kg */}
                    <div className="space-y-2">
                      <Label htmlFor="pesoAtual">Peso atual</Label>
                      <div className="relative">
                        <Input
                          id="pesoAtual"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Ex: 68.5"
                          value={pesoAtual}
                          onChange={(e) => setPesoAtual(e.target.value)}
                          className="pr-12"
                        />
                        <span className="pointer-events-none absolute right-3.5 top-3 text-xs font-semibold text-stone-500">
                          kg
                        </span>
                      </div>
                    </div>

                    {/* Altura em cm */}
                    <div className="space-y-2">
                      <Label htmlFor="alturaCm">Altura</Label>
                      <div className="relative">
                        <Input
                          id="alturaCm"
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="Ex: 165"
                          value={alturaCm}
                          onChange={(e) => setAlturaCm(e.target.value)}
                          className="pr-12"
                        />
                        <span className="pointer-events-none absolute right-3.5 top-3 text-xs font-semibold text-stone-500">
                          cm
                        </span>
                      </div>
                    </div>

                    {/* IMC calculado automaticamente, somente leitura */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="imc">IMC (calculado)</Label>
                        {calculatedImc !== null && (
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              getImcClassification(calculatedImc).colorClass
                            )}
                          >
                            {getImcClassification(calculatedImc).label}
                          </span>
                        )}
                      </div>
                      <Input
                        id="imc"
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

                  {/* Objetivo (múltipla escolha + campo de texto livre adicional) */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-stone-800">
                        Objetivo
                      </Label>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Selecione um ou mais objetivos e complemente no campo
                        livre se desejar.
                      </p>
                    </div>
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
                    <div className="pt-1">
                      <Input
                        type="text"
                        placeholder="Observações ou objetivo adicional em texto livre..."
                        value={objetivoTexto}
                        onChange={(e) => setObjetivoTexto(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Nível de atividade física (seleção única) */}
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

                  {/* Patologias ou condições de saúde */}
                  <MultiChoiceWithNoneAndCustom
                    label="Patologias ou condições de saúde"
                    presetOptions={PATOLOGIAS_PRESET}
                    selected={patologias}
                    onChange={setPatologias}
                    placeholderCustom="Adicionar outra patologia ou condição..."
                  />

                  {/* Restrições alimentares */}
                  <MultiChoiceWithNoneAndCustom
                    label="Restrições alimentares"
                    presetOptions={RESTRICOES_PRESET}
                    selected={restricoesAlimentares}
                    onChange={setRestricoesAlimentares}
                    placeholderCustom="Adicionar outra restrição alimentar..."
                  />

                  {/* Alergias alimentares */}
                  <MultiChoiceWithNoneAndCustom
                    label="Alergias alimentares"
                    presetOptions={ALERGIAS_PRESET}
                    selected={alergias}
                    onChange={setAlergias}
                    placeholderCustom="Adicionar outra alergia alimentar..."
                  />

                  {/* Medicamentos contínuos e Suplementos em uso */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="medicamentos">
                        Medicamentos contínuos
                      </Label>
                      <textarea
                        id="medicamentos"
                        rows={3}
                        placeholder="Informe medicamentos de uso contínuo e dosagens..."
                        value={medicamentos}
                        onChange={(e) => setMedicamentos(e.target.value)}
                        className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f] focus-visible:border-[#6c873f]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suplementos">Suplementos em uso</Label>
                      <textarea
                        id="suplementos"
                        rows={3}
                        placeholder="Informe suplementos atuais (Whey, Creatina, Vitaminas...)..."
                        value={suplementos}
                        onChange={(e) => setSuplementos(e.target.value)}
                        className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f] focus-visible:border-[#6c873f]"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("pessoal")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Aba anterior: Pessoal
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="shadow-sm"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Paciente
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setActiveTab("habitos")}
                    >
                      Próxima aba: Hábitos
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}

            {/* ABA 3 — HÁBITOS */}
            {activeTab === "habitos" && (
              <>
                <CardHeader className="border-b border-stone-100">
                  <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#6c873f]" />
                    Hábitos e Rotina Diária
                  </CardTitle>
                  <CardDescription>
                    Rotina alimentar, sono, hidratação e prática de exercícios.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Quantas refeições faz por dia */}
                    <div className="space-y-2">
                      <Label htmlFor="refeicoesPorDia">
                        Quantas refeições faz por dia
                      </Label>
                      <Input
                        id="refeicoesPorDia"
                        type="number"
                        min="1"
                        max="15"
                        placeholder="Ex: 4"
                        value={refeicoesPorDia}
                        onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      />
                    </div>

                    {/* Quantidade de água por dia */}
                    <div className="space-y-2">
                      <Label htmlFor="litrosAgua">
                        Quantidade de água por dia
                      </Label>
                      <div className="relative">
                        <Input
                          id="litrosAgua"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Ex: 2.5"
                          value={litrosAgua}
                          onChange={(e) => setLitrosAgua(e.target.value)}
                          className="pr-16"
                        />
                        <span className="pointer-events-none absolute right-3.5 top-3 text-xs font-semibold text-stone-500">
                          litros
                        </span>
                      </div>
                    </div>

                    {/* Horário que acorda (número convertido automaticamente para hora, ex: 6 -> "06:00", 630 -> "06:30") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="horarioAcorda">
                          Horário que acorda
                        </Label>
                        <span className="text-[11px] text-stone-400">
                          Ex: 6 → 06:00 | 630 → 06:30
                        </span>
                      </div>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                        <Input
                          id="horarioAcorda"
                          type="text"
                          inputMode="numeric"
                          placeholder="Digite ex: 6 ou 630"
                          value={horarioAcorda}
                          onChange={(e) => setHorarioAcorda(e.target.value)}
                          onBlur={(e) =>
                            handleHorarioBlur(e.target.value, setHorarioAcorda)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Horário que dorme (número convertido automaticamente para hora, ex: 23 -> "23:00", 2230 -> "22:30") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="horarioDorme">Horário que dorme</Label>
                        <span className="text-[11px] text-stone-400">
                          Ex: 23 → 23:00 | 2230 → 22:30
                        </span>
                      </div>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                        <Input
                          id="horarioDorme"
                          type="text"
                          inputMode="numeric"
                          placeholder="Digite ex: 23 ou 2230"
                          value={horarioDorme}
                          onChange={(e) => setHorarioDorme(e.target.value)}
                          onBlur={(e) =>
                            handleHorarioBlur(e.target.value, setHorarioDorme)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pratica atividade física (sim/não — se sim, abre campo de texto: qual atividade e frequência semanal) */}
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
                      <div className="space-y-2 pt-2 animate-in fade-in-50">
                        <Label htmlFor="atividadeFisicaDescricao">
                          Qual atividade e frequência semanal?
                        </Label>
                        <Input
                          id="atividadeFisicaDescricao"
                          type="text"
                          placeholder="Ex: Musculação 4x por semana e corrida 2x por semana"
                          value={atividadeFisicaDescricao}
                          onChange={(e) =>
                            setAtividadeFisicaDescricao(e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Observações gerais */}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações gerais</Label>
                    <textarea
                      id="observacoes"
                      rows={4}
                      placeholder="Anotações adicionais sobre rotina, preferências alimentares, aversões ou histórico..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="flex w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c873f] focus-visible:border-[#6c873f]"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("clinico")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Aba anterior: Clínico
                  </Button>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando paciente...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Paciente
                      </>
                    )}
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}

