"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}
