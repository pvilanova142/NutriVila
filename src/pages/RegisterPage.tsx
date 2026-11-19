import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { neonClient } from "@/lib/neon"
import { useAuth } from "@/contexts/AuthContext"
import { translateAuthError } from "@/lib/auth-errors"
import { Logo } from "@/components/Logo"
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

export function RegisterPage() {
  const navigate = useNavigate()
  const { refreshSession, ensureNutricionistaInDb } = useAuth()

  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedNome = nome.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedNome) {
      setError("Por favor, informe seu nome completo.")
      return
    }

    if (!trimmedEmail) {
      setError("Por favor, informe um endereço de e-mail válido.")
      return
    }

    if (password.length < 9) {
      setError("A senha deve ter no mínimo 9 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Verifique e tente novamente.")
      return
    }

    setSubmitting(true)
    try {
      const result = await neonClient.auth.signUp.email({
        name: trimmedNome,
        email: trimmedEmail,
        password,
      })

      if (result.error) {
        setError(translateAuthError(result.error))
        setSubmitting(false)
        return
      }

      if (result.data?.user) {
        await ensureNutricionistaInDb({
          id: result.data.user.id,
          name: trimmedNome,
          email: trimmedEmail,
        })
      }

      await refreshSession()
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      setError(translateAuthError(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f8ff] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Elementos decorativos suaves */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#6c873f]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#6c873f]/15 blur-3xl" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logotipo com o texto "NutriVila" no topo */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <Card className="w-full border-[#6c873f]/15 bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1.5 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-stone-900">
              Crie sua conta
            </CardTitle>
            <CardDescription className="text-stone-500">
              Comece a organizar seu consultório nutricional no NutriVila
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Dra. Maria Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-10"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <span className="text-xs text-stone-400">
                    Mínimo de 9 caracteres
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha criada"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 font-semibold text-base"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-stone-100 pt-5 pb-6">
            <p className="text-sm text-stone-600">
              Já tem conta?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#6c873f] hover:text-[#5b7334] hover:underline transition-colors"
              >
                Faça login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

