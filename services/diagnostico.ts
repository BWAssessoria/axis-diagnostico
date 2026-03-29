import { createClient } from "@/lib/supabase/client";

export type DiagnosticoInsert = {
  user_id?: string;
  dados: Record<string, unknown>;
  status?: "rascunho" | "enviado" | "processado";
};

export async function saveDiagnostico(payload: DiagnosticoInsert) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("diagnosticos")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDiagnosticos(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("diagnosticos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
