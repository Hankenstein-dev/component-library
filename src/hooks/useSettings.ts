import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useSettings(key: string) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();
    if (!error && data) setValue(data.value);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const save = async (newValue: string) => {
    const { error } = await supabase
      .from("app_settings")
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (!error) setValue(newValue);
    return { error };
  };

  return { value, loading, save };
}
