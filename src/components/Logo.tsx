import { Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
  highlight?: string
}

export function Logo({
  className,
  size = "md",
  text = "Nutri",
  highlight = "Vila",
}: LogoProps) {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }

  const containerSizes = {
    sm: "h-9 w-9 rounded-lg",
    md: "h-11 w-11 rounded-xl",
    lg: "h-13 w-13 rounded-2xl p-3",
  }

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  }

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-[#6c873f] text-[#f8f8ff] shadow-md shadow-[#6c873f]/25",
          containerSizes[size]
        )}
      >
        <Leaf className={iconSizes[size]} strokeWidth={2.2} />
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "font-bold tracking-tight text-stone-900 leading-none",
            textSizes[size]
          )}
        >
          {text}
          {highlight && <span className="text-[#6c873f]">{highlight}</span>}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#6c873f]/80 mt-0.5">
          Gestão Clínica
        </span>
      </div>
    </div>
  )
}

