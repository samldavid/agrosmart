export class AppError extends Error {
  constructor(
    message: string,
    public readonly causeCode?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

interface SupabaseLikeError {
  message?: string;
  code?: string;
}

const userSafeMessages: Record<string, string> = {
  "23505": "Ya existe un registro con esos datos.",
  "23503": "No se encontro el registro relacionado.",
  "42501": "No tienes permisos para realizar esta accion.",
  PGRST116: "No se encontro la informacion solicitada."
};

export function toAppError(error: unknown, fallback = "No pudimos completar la accion. Intenta de nuevo."): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const maybeError = error as SupabaseLikeError;
  const code = maybeError.code;

  if (code && userSafeMessages[code]) {
    return new AppError(userSafeMessages[code], code);
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim().length > 0) {
    const lower = maybeError.message.toLowerCase();
    if (lower.includes("permission") || lower.includes("row-level security")) {
      return new AppError("No tienes permisos para realizar esta accion.", code);
    }
    if (lower.includes("invalid login credentials")) {
      return new AppError("Correo o contrasena incorrectos.", code);
    }
  }

  return new AppError(fallback, code);
}

export function getErrorMessage(error: unknown): string {
  return toAppError(error).message;
}
