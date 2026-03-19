import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ComponentEntry, TableName } from "@/lib/types";

export function useComponents(table: TableName) {
  const [entries, setEntries] = useState<ComponentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setEntries(data);
    setLoading(false);
  }, [table]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async (entry: { name: string; description: string; contributed_by: string | null }) => {
    const { data, error } = await supabase
      .from(table)
      .insert(entry)
      .select()
      .single();
    if (!error && data) {
      setEntries((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  const updateEntry = async (id: string, updates: { name?: string; description?: string; contributed_by?: string | null }) => {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    }
    return { data, error };
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    return { error };
  };

  return { entries, loading, count: entries.length, createEntry, updateEntry, deleteEntry, refetch: fetchEntries };
}
