"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/auth/roles";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi")
});

const emailSchema = z.object({
  email: z.string().email("Email tidak valid")
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter")
});

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const loginAction = async (
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> => {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (
      error.name === "AuthRetryableFetchError" ||
      error.message.toLowerCase().includes("fetch")
    ) {
      return {
        status: "error",
        message: "Koneksi ke Supabase gagal. Periksa koneksi server dan coba lagi."
      };
    }

    return { status: "error", message: "Email atau password tidak sesuai." };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const role = user?.app_metadata.role ?? user?.user_metadata.role;

  if (role === "admin" || role === "mentor" || role === "parent") {
    redirect(roleHomePath(role));
  }

  return {
    status: "error",
    message: "Akun belum memiliki role. Hubungi admin sistem."
  };
};

export const logoutAction = async () => {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Logout gagal. Silakan coba lagi.");
  }

  redirect("/login");
};

export const forgotPasswordAction = async (
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> => {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/reset-password`
  });

  if (error) {
    return { status: "error", message: "Permintaan reset password gagal." };
  }

  return {
    status: "success",
    message: "Link reset password telah dikirim jika email terdaftar."
  };
};

export const resetPasswordAction = async (
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> => {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return {
      status: "error",
      message: "Password gagal diperbarui. Buka ulang link reset password."
    };
  }

  return { status: "success", message: "Password berhasil diperbarui." };
};
