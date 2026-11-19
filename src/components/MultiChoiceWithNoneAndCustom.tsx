import React, { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface MultiChoiceWithNoneAndCustomProps {
  label: string
  description?: string
  presetOptions: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholderCustom?: string
}

export function MultiChoiceWithNoneAndCustom({
  label,
  description,
  presetOptions,
  selected,
  onChange,
  placeholderCustom = "Adicionar outro item...",
}: MultiChoiceWithNoneAndCustomProps) {
  const [customInput, setCustomInput] = useState("")

  const isNoneSelected = selected.includes("Nenhum")

  const toggleOption = (option: string) => {
    if (option === "Nenhum") {
      onChange(isNoneSelected ? [] : ["Nenhum"])
      return
    }

    const withoutNone = selected.filter((item) => item !== "Nenhum")
    if (withoutNone.includes(option)) {
      onChange(withoutNone.filter((item) => item !== option))
    } else {
      onChange([...withoutNone, option])
    }
  }

  const handleAddCustom = () => {
    const val = customInput.trim()
    if (!val) return
    const withoutNone = selected.filter((item) => item !== "Nenhum")
    const exists = withoutNone.some(
      (item) => item.toLowerCase() === val.toLowerCase()
    )
    if (!exists) {
      onChange([...withoutNone, val])
    }
    setCustomInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCustom()
    }
  }

  const customItems = selected.filter(
    (item) => item !== "Nenhum" && !presetOptions.includes(item)
  )

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold text-stone-800">{label}</Label>
        {description && (
          <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {presetOptions.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all",
                active
                  ? "border-[#6c873f] bg-[#6c873f] text-white shadow-xs"
                  : "border-stone-200 bg-white text-stone-700 hover:border-[#6c873f]/50 hover:bg-[#6c873f]/5"
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {option}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => toggleOption("Nenhum")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all",
            isNoneSelected
              ? "border-stone-700 bg-stone-800 text-white shadow-xs"
              : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-400"
          )}
        >
          {isNoneSelected && <Check className="h-3.5 w-3.5" />}
          Nenhum
        </button>
      </div>

      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {customItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#6c873f] bg-[#6c873f]/15 px-3 py-1.5 text-xs font-semibold text-[#4d622b]"
            >
              {item}
              <button
                type="button"
                onClick={() =>
                  onChange(selected.filter((entry) => entry !== item))
                }
                className="rounded-full p-0.5 hover:bg-[#6c873f]/20 text-[#4d622b]"
                aria-label={`Remover ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 max-w-md">
        <Input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderCustom}
          className="h-9 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
          className="shrink-0 border-[#6c873f]/30 text-[#6c873f] hover:bg-[#6c873f]/10"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  )
}

