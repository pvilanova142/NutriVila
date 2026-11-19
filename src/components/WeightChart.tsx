import { useMemo } from "react"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { formatBrDate } from "@/lib/paciente-utils"

export interface WeightPoint {
  id: string
  data_consulta: string
  peso: number | null
}

interface WeightChartProps {
  consultas: WeightPoint[]
}

export function WeightChart({ consultas }: WeightChartProps) {
  const points = useMemo(() => {
    return [...consultas]
      .filter((c) => c.peso !== null && c.peso !== undefined && Number(c.peso) > 0)
      .sort((a, b) => a.data_consulta.localeCompare(b.data_consulta))
      .map((c) => ({
        id: c.id,
        date: c.data_consulta.slice(0, 10),
        peso: Number(c.peso),
      }))
  }, [consultas])

  if (consultas.length === 0 || points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-8 text-center">
        <p className="text-sm font-medium text-stone-600">
          Nenhuma consulta registrada ainda
        </p>
        <p className="text-xs text-stone-400 mt-1">
          O gráfico de evolução de peso aparecerá aqui assim que houver consultas com peso registrado.
        </p>
      </div>
    )
  }

  const width = 680
  const height = 220
  const padLeft = 48
  const padRight = 28
  const padTop = 28
  const padBottom = 38

  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom

  const weights = points.map((p) => p.peso)
  const rawMin = Math.min(...weights)
  const rawMax = Math.max(...weights)
  const padding = rawMax === rawMin ? 2 : Math.max(0.5, (rawMax - rawMin) * 0.2)
  const minW = Math.floor((rawMin - padding) * 10) / 10
  const maxW = Math.ceil((rawMax + padding) * 10) / 10
  const rangeW = maxW - minW || 1

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1
        ? padLeft + innerW / 2
        : padLeft + (idx / (points.length - 1)) * innerW
    const y = padTop + innerH - ((p.peso - minW) / rangeW) * innerH
    return { ...p, x, y }
  })

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ")

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : ""

  const firstWeight = points[0].peso
  const lastWeight = points[points.length - 1].peso
  const diff = Number((lastWeight - firstWeight).toFixed(1))

  const yTicks = [minW, Number(((minW + maxW) / 2).toFixed(1)), maxW]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span>
            Peso inicial:{" "}
            <strong className="text-stone-800">{firstWeight.toFixed(1)} kg</strong>
          </span>
          <span>
            Peso atual:{" "}
            <strong className="text-stone-800">{lastWeight.toFixed(1)} kg</strong>
          </span>
        </div>

        {points.length > 1 && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              diff < 0
                ? "bg-[#6c873f]/15 text-[#4d622b]"
                : diff > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {diff < 0 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : diff > 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg no período
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[460px] h-auto select-none"
          role="img"
          aria-label="Gráfico de evolução de peso"
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c873f" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6c873f" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontais */}
          {yTicks.map((tick, i) => {
            const y = padTop + innerH - ((tick - minW) / rangeW) * innerH
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e7e5e4"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-stone-400 text-[10px] font-medium"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            )
          })}

          {/* Área preenchida */}
          {areaPath && <path d={areaPath} fill="url(#weightAreaGrad)" />}

          {/* Linha principal */}
          {coords.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="#6c873f"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Pontos e rótulos */}
          {coords.map((c) => (
            <g key={c.id}>
              <circle
                cx={c.x}
                cy={c.y}
                r="5"
                fill="#ffffff"
                stroke="#6c873f"
                strokeWidth="2.5"
              />
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor="middle"
                className="fill-stone-800 text-[11px] font-bold"
              >
                {c.peso.toFixed(1)} kg
              </text>
              <text
                x={c.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-stone-500 text-[10px] font-medium"
              >
                {formatBrDate(c.date).slice(0, 5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

