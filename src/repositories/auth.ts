import type { User } from "@supabase/supabase-js";

import { toAppError } from "@/lib/errors";
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

export async function signUp(values: SignUpValues): Promise<User | null> {
  const { data, error } = await getSupabase().auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.full_name
      }
    }
  });
  if (error) {
    throw toAppError(error);
  }
  return data.user;
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
