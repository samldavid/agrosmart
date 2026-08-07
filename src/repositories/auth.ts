import { AppError, toAppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { ProfileValues, RecoverPasswordValues, SignInValues, SignUpValues } from "@/schemas/forms";
import type { Profile } from "@/types/domain";

export async function signIn(values: SignInValues): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: values.email,
    password: values.password
  });
  if (error) {
    throw toAppError(error);
  }
}

export async function signUp(values: SignUpValues): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke("public-sign-up", {
    body: values
  });

  if (error) {
    throw await toFunctionAppError(error);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password
  });

  if (signInError) {
    throw toAppError(signInError, "Cuenta creada. Inicia sesion con tu correo y contrasena.");
  }
}

export async function recoverPassword(values: RecoverPasswordValues): Promise<void> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(values.email);
  if (error) {
    throw toAppError(error);
  }
}

export async function updateProfile(values: ProfileValues): Promise<Profile> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw toAppError(userError, "Inicia sesion para actualizar tu perfil.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userData.user.id)
    .select("*")
    .single();

  if (error) {
    throw toAppError(error);
  }

  return data as Profile;
}

async function toFunctionAppError(error: unknown): Promise<AppError> {
  const context = (error as { context?: Response }).context;

  if (context) {
    try {
      const body = (await context.clone().json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error.trim().length > 0) {
        return new AppError(body.error);
      }
    } catch {
      // Fall through to the generic Supabase error mapper.
    }
  }

  return toAppError(error);
}
