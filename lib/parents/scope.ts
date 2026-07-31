import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getParentScope(supabase: SupabaseServerClient, userId: string) {
  const { data: parent } = await supabase
    .from("parents")
    .select("id, full_name, phone")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!parent) return { parent: null, parentIds: [] as string[] };

  let legacyQuery = supabase
    .from("parents")
    .select("id")
    .eq("full_name", parent.full_name)
    .is("profile_id", null);

  if (parent.phone) legacyQuery = legacyQuery.eq("phone", parent.phone);

  const { data: legacyParents } = await legacyQuery;

  return {
    parent,
    parentIds: [...new Set([parent.id, ...(legacyParents ?? []).map((item) => item.id)])],
  };
}
