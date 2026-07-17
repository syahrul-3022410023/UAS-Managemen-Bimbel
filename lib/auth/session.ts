import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRole, roleHomePath, type UserRole } from "@/lib/auth/roles";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const role = normalizeRole(user.app_metadata.role ?? user.user_metadata.role);

  if (!role) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role,
    name: user.user_metadata?.full_name as string | undefined
  };
});

export const requireUser = async () => {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
};

export const requireRole = async (allowedRoles: UserRole[]) => {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect(roleHomePath(user.role));
  }

  return user;
};
