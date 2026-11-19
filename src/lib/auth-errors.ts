export function translateAuthError(error?: { message?: string; code?: string; status?: number } | null): string {
  if (!error) return "Ocorreu um erro inesperado. Tente novamente."

  const msg = (error.message || "").toLowerCase()
  const code = (error.code || "").toLowerCase()

  if (
    msg.includes("invalid email or password") ||
    msg.includes("invalid password") ||
    msg.includes("invalid credentials") ||
    code.includes("invalid_email_or_password") ||
    code.includes("invalid_credentials")
  ) {
    return "E-mail ou senha incorretos. Verifique seus dados e tente novamente."
  }

  if (
    msg.includes("user already exists") ||
    msg.includes("email already") ||
    code.includes("user_already_exists")
  ) {
    return "Este e-mail já está cadastrado em nossa plataforma. Tente fazer login."
  }

  if (msg.includes("user not found") || code.includes("user_not_found")) {
    return "Não encontramos uma conta com este e-mail. Verifique o endereço digitado ou cadastre-se."
  }

  if (msg.includes("password is too short") || msg.includes("password too short")) {
    return "A senha informada é muito curta. Ela deve ter no mínimo 9 caracteres."
  }

  if (msg.includes("invalid email") || code.includes("invalid_email")) {
    return "Por favor, informe um endereço de e-mail válido."
  }

  if (msg.includes("too many requests") || error.status === 429) {
    return "Muitas tentativas realizadas. Aguarde alguns instantes antes de tentar novamente."
  }

  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Erro de conexão com o servidor. Verifique sua internet e tente novamente."
  }

  return error.message || "Não foi possível concluir a operação. Verifique seus dados e tente novamente."
}

