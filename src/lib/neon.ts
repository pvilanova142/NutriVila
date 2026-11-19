import { createClient } from "@neon/neon-js"

const authUrl = import.meta.env.VITE_NEON_AUTH_URL
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL

export const neonClient = createClient({
  auth: {
    url: authUrl,
  },
  dataApi: {
    url: dataApiUrl,
  },
})

export const authClient = neonClient.auth

