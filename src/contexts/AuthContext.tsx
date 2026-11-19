import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { neonClient } from "@/lib/neon"

export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string | null
}

export interface NutricionistaProfile {
  id: string
  nome: string
  email: string
  created_at?: string
}

interface AuthContextType {
  user: AuthUser | null
  nutricionista: NutricionistaProfile | null
  loading: boolean
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
  ensureNutricionistaInDb: (user: AuthUser) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [nutricionista, setNutricionista] = useState<NutricionistaProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const ensureNutricionistaInDb = useCallback(async (currentUser: AuthUser) => {
    try {
      const { data: existing, error: selectError } = await neonClient
        .from("nutricionistas")
        .select("*")
        .eq("email", currentUser.email)

      if (!selectError && existing && existing.length > 0) {
        setNutricionista(existing[0] as NutricionistaProfile)
        return
      }

      const { data: inserted, error: insertError } = await neonClient
        .from("nutricionistas")
        .insert({
          id: currentUser.id,
          nome: currentUser.name || currentUser.email.split("@")[0],
          email: currentUser.email,
        })
        .select()

      if (!insertError && inserted && inserted.length > 0) {
        setNutricionista(inserted[0] as NutricionistaProfile)
      } else {
        // Retry select in case DB trigger already inserted it concurrently
        const { data: retryData } = await neonClient
          .from("nutricionistas")
          .select("*")
          .eq("email", currentUser.email)

        if (retryData && retryData.length > 0) {
          setNutricionista(retryData[0] as NutricionistaProfile)
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar nutricionista:", err)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const result = await neonClient.auth.getSession()
      if (result.data?.session && result.data?.user) {
        const authUser: AuthUser = {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          image: result.data.user.image,
        }
        setUser(authUser)
        await ensureNutricionistaInDb(authUser)
      } else {
        setUser(null)
        setNutricionista(null)
      }
    } catch (err) {
      console.error("Erro ao verificar sessão:", err)
      setUser(null)
      setNutricionista(null)
    } finally {
      setLoading(false)
    }
  }, [ensureNutricionistaInDb])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const signOut = async () => {
    await neonClient.auth.signOut()
    setUser(null)
    setNutricionista(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        nutricionista,
        loading,
        refreshSession,
        signOut,
        ensureNutricionistaInDb,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider")
  }
  return context
}

