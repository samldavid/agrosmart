import { Link, router } from "expo-router";
import { Check, Leaf, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { ErrorState, LoadingState } from "@/components/feedback/States";
import { TextField } from "@/components/forms/TextField";
import { AppText } from "@/components/primitives/AppText";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { recoverPassword, signIn, signUp } from "@/repositories/auth";
import { formResolver } from "@/lib/formResolver";
import {
  recoverPasswordSchema,
  signInSchema,
  signUpSchema,
  type RecoverPasswordValues,
  type SignInValues,
  type SignUpValues
} from "@/schemas/forms";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function SplashView() {
  return (
    <View style={styles.centerScreen}>
      <Image source={require("../../../assets/brand/agrosmart-logo.png")} style={styles.heroLogo} accessibilityLabel="Logo AgroSmart" />
      <AppText variant="display" style={styles.brand}>
        AgroSmart
      </AppText>
      <AppText color={colors.mutedText} style={styles.centerText}>
        Tecnologia inteligente para el campo y tu ganado
      </AppText>
    </View>
  );
}

export function MissingConfigurationScreen() {
  return (
    <View style={styles.centerScreen}>
      <Card style={styles.authCard}>
        <AppText variant="title">Configura Supabase</AppText>
        <AppText color={colors.mutedText}>
          Crea un archivo `.env` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
          La app no usa datos simulados para funciones que guardan informacion.
        </AppText>
      </Card>
    </View>
  );
}

export function WelcomeScreen() {
  return (
    <View style={styles.authScreen}>
      <Card style={styles.authCard}>
        <Image source={require("../../../assets/brand/agrosmart-logo.png")} style={styles.heroLogo} accessibilityLabel="Logo AgroSmart" />
        <AppText variant="display" style={styles.brand}>
          AgroSmart
        </AppText>
        <AppText color={colors.mutedText} style={styles.centerText}>
          Tecnologia inteligente para el campo y tu ganado.
        </AppText>
        <View style={styles.valueList}>
          <ValueLine text="Controla ganado, productos e inventarios." />
          <ValueLine text="Asigna tareas y recordatorios sin perder informacion." />
          <ValueLine text="Consulta reportes y solicita soporte tecnico." />
        </View>
        <Button title="Crear cuenta" onPress={() => router.push("/(auth)/sign-up")} fullWidth />
        <Button title="Ya tengo cuenta" onPress={() => router.push("/(auth)/sign-in")} variant="secondary" fullWidth />
      </Card>
    </View>
  );
}

function ValueLine({ text }: { text: string }) {
  return (
    <View style={styles.valueLine}>
      <Leaf color={colors.olive} size={18} />
      <AppText>{text}</AppText>
    </View>
  );
}

export function SignInScreen() {
  const form = useForm<SignInValues>({
    resolver: formResolver(signInSchema),
    defaultValues: { email: "", password: "" }
  });
  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: () => router.replace("/")
  });

  return (
    <View style={styles.authScreen}>
      <Card style={styles.authCard}>
        <AuthTitle title="Iniciar sesion" subtitle="Ingresa con tu correo y contrasena." />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Correo electronico"
              placeholder="correo@ejemplo.com"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Contrasena"
              placeholder="Minimo 6 caracteres"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
            />
          )}
        />
        {mutation.isError ? <AppText color={colors.error}>{String(mutation.error.message)}</AppText> : null}
        <Button title="Entrar" icon={<Lock color={colors.white} size={18} />} loading={mutation.isPending} onPress={form.handleSubmit((values) => mutation.mutate(values))} fullWidth />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link">
            <AppText color={colors.forest} style={styles.linkText}>
              Olvide mi contrasena
            </AppText>
          </Pressable>
        </Link>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable accessibilityRole="link">
            <AppText color={colors.forest} style={styles.linkText}>
              Crear cuenta nueva
            </AppText>
          </Pressable>
        </Link>
      </Card>
    </View>
  );
}

export function SignUpScreen() {
  const [registered, setRegistered] = useState(false);
  const form = useForm<SignUpValues>({
    resolver: formResolver(signUpSchema),
    defaultValues: { email: "", password: "", full_name: "", accepted_privacy: false }
  });
  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => setRegistered(true)
  });

  if (registered) {
    return <VerifyEmailScreen />;
  }

  return (
    <View style={styles.authScreen}>
      <Card style={styles.authCard}>
        <AuthTitle title="Crear cuenta" subtitle="Registra tu acceso principal a AgroSmart." />
        <Controller
          control={form.control}
          name="full_name"
          render={({ field, fieldState }) => (
            <TextField label="Nombre completo" placeholder="Ej. Maira Rojas" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField label="Correo electronico" placeholder="correo@ejemplo.com" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField label="Contrasena" placeholder="Minimo 6 caracteres" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} secureTextEntry />
          )}
        />
        <Controller
          control={form.control}
          name="accepted_privacy"
          render={({ field, fieldState }) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: field.value }}
              onPress={() => field.onChange(!field.value)}
              style={[styles.checkbox, fieldState.error ? styles.checkboxError : null]}
            >
              <View style={[styles.checkBoxSquare, field.value ? styles.checkBoxSquareOn : null]}>
                {field.value ? <Check color={colors.white} size={16} /> : null}
              </View>
              <AppText style={styles.checkboxText}>
                Acepto la politica de privacidad y el tratamiento de mis datos.
              </AppText>
            </Pressable>
          )}
        />
        {form.formState.errors.accepted_privacy?.message ? (
          <AppText color={colors.error} variant="caption">
            {form.formState.errors.accepted_privacy.message}
          </AppText>
        ) : null}
        {mutation.isError ? <AppText color={colors.error}>{String(mutation.error.message)}</AppText> : null}
        <Button title="Registrarme" icon={<Mail color={colors.white} size={18} />} loading={mutation.isPending} onPress={form.handleSubmit((values) => mutation.mutate(values))} fullWidth />
        <Link href="/(auth)/privacy" asChild>
          <Pressable accessibilityRole="link">
            <AppText color={colors.forest} style={styles.linkText}>
              Leer politica de privacidad
            </AppText>
          </Pressable>
        </Link>
      </Card>
    </View>
  );
}

export function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const form = useForm<RecoverPasswordValues>({
    resolver: formResolver(recoverPasswordSchema),
    defaultValues: { email: "" }
  });
  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => setSent(true)
  });

  return (
    <View style={styles.authScreen}>
      <Card style={styles.authCard}>
        <AuthTitle title="Recuperar contrasena" subtitle="Te enviaremos un enlace para restablecer el acceso." />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField label="Correo electronico" placeholder="correo@ejemplo.com" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} keyboardType="email-address" autoCapitalize="none" />
          )}
        />
        {sent ? (
          <AppText color={colors.success}>Revisa tu correo. Si existe una cuenta, recibiras instrucciones.</AppText>
        ) : null}
        {mutation.isError ? <AppText color={colors.error}>{String(mutation.error.message)}</AppText> : null}
        <Button title="Enviar enlace" loading={mutation.isPending} onPress={form.handleSubmit((values) => mutation.mutate(values))} fullWidth />
      </Card>
    </View>
  );
}

export function VerifyEmailScreen() {
  return (
    <View style={styles.authScreen}>
      <Card style={styles.authCard}>
        <AuthTitle title="Verifica tu correo" subtitle="Supabase enviara un enlace de confirmacion si la verificacion esta activa." />
        <AppText color={colors.mutedText}>
          Cuando confirmes tu correo, vuelve a iniciar sesion para completar tu perfil y crear la finca.
        </AppText>
        <Button title="Ir a iniciar sesion" onPress={() => router.replace("/(auth)/sign-in")} fullWidth />
      </Card>
    </View>
  );
}

export function PrivacyScreen() {
  return (
    <View style={styles.authScreen}>
      <Card style={styles.authCard}>
        <AuthTitle title="Politica de privacidad" subtitle="Version inicial para el MVP de AgroSmart." />
        <AppText color={colors.mutedText}>
          AgroSmart guarda datos personales, informacion de fincas, inventario, tareas, finanzas basicas y soporte para
          prestar el servicio. No vendemos datos personales ni usamos credenciales financieras. Puedes solicitar exportar
          tus datos o eliminar tu cuenta desde configuracion.
        </AppText>
        <AppText color={colors.mutedText}>
          Los adjuntos se almacenan en buckets privados y el acceso depende de los permisos configurados en Supabase.
        </AppText>
        <Button title="Entendido" onPress={() => router.back()} fullWidth />
      </Card>
    </View>
  );
}

export function BlockedAccountScreen() {
  return (
    <ErrorState
      title="Cuenta bloqueada"
      message="Tu cuenta no puede operar en este momento. Contacta soporte tecnico si crees que es un error."
    />
  );
}

function AuthTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.titleWrap}>
      <AppText variant="title">{title}</AppText>
      <AppText color={colors.mutedText}>{subtitle}</AppText>
    </View>
  );
}

export function AuthLoading() {
  return <LoadingState title="Preparando AgroSmart" />;
}

const styles = StyleSheet.create({
  authScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    padding: spacing.md
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    padding: spacing.md
  },
  authCard: {
    width: "100%",
    maxWidth: 460,
    gap: spacing.md
  },
  heroLogo: {
    width: 132,
    height: 132,
    alignSelf: "center",
    borderRadius: radius.lg
  },
  brand: {
    color: colors.forestDark,
    fontFamily: typography.brand,
    textAlign: "center"
  },
  centerText: {
    textAlign: "center"
  },
  titleWrap: {
    gap: spacing.xs
  },
  valueList: {
    gap: spacing.sm
  },
  valueLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  linkText: {
    textAlign: "center"
  },
  checkbox: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  checkboxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg
  },
  checkBoxSquare: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  checkBoxSquareOn: {
    borderColor: colors.forestDark,
    backgroundColor: colors.forestDark
  },
  checkboxText: {
    flex: 1
  }
});
