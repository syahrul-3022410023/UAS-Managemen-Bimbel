import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getMentorScope(supabase: SupabaseServerClient, userId: string) {
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, full_name")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!mentor) return { mentor: null, mentorIds: [] as string[] };

  const { data: legacyMentors } = await supabase
    .from("mentors")
    .select("id")
    .eq("full_name", mentor.full_name)
    .is("profile_id", null);

  return {
    mentor,
    mentorIds: [...new Set([mentor.id, ...(legacyMentors ?? []).map((item) => item.id)])],
  };
}
