import React, { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Pacientes",
    to: "/pacientes",
    icon: Users,
  },
]

export function AppLayout({ children }: AppLayoutProps) {
  const { user, nutricionista, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const displayName = nutricionista?.nome || user?.name || "Nutricionista"
  const displayEmail = nutricionista?.email || user?.email || ""

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f8f8ff] flex">
      {/* Menu lateral fixo (Desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-[#6c873f]/15 bg-white shadow-sm">
        {/* Topo com logo "NutriVila" */}
        <div className="flex h-20 items-center px-6 border-b border-stone-100">
          <Logo size="sm" />
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#6c873f] text-white shadow-sm shadow-[#6c873f]/25"
                      : "text-stone-600 hover:bg-[#6c873f]/10 hover:text-[#6c873f]"
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Rodapé do menu lateral com perfil da nutricionista e botão Sair */}
        <div className="border-t border-stone-100 p-4 space-y-3 bg-stone-50/50">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6c873f]/15 text-[#6c873f] font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-semibold text-stone-800">
                {displayName}
              </span>
              <span className="truncate text-xs text-stone-500">
                {displayEmail}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* Menu Mobile (Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-50 flex w-64 flex-col bg-white h-full shadow-xl">
            <div className="flex h-20 items-center justify-between px-6 border-b border-stone-100">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 px-4 py-6">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                        isActive
                          ? "bg-[#6c873f] text-white shadow-sm shadow-[#6c873f]/25"
                          : "text-stone-600 hover:bg-[#6c873f]/10 hover:text-[#6c873f]"
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            <div className="border-t border-stone-100 p-4 space-y-3">
              <div className="px-2">
                <p className="truncate text-sm font-semibold text-stone-800">
                  {displayName}
                </p>
                <p className="truncate text-xs text-stone-500">{displayEmail}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da conta
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Área Principal */}
      <div className="flex flex-1 flex-col md:pl-64 min-w-0">
        {/* Cabeçalho Mobile */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#6c873f]/15 bg-white/90 px-4 backdrop-blur-md md:hidden">
          <Logo size="sm" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

