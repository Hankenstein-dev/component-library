import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { COMPONENT_TYPES, type ComponentType } from "@/lib/types";
import { MODELS, DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";

interface TestConsoleProps {
  counts: Record<ComponentType, number>;
  onAddComponent: () => void;
}

export function TestConsole({ counts, onAddComponent }: TestConsoleProps) {
  const { session } = useAuth();
  const [enabledTypes, setEnabledTypes] = useState<Record<ComponentType, boolean>>({
    document: true,
    information: true,
    activity: true,
    knowledge: true,
  });
  const [model, setModel] = useState("claude-sonnet-4-5-20250929");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<{
    text: string;
    model: string;
    tokens_input: number;
    tokens_output: number;
    component_count: number;
    duration_ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleTest = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    const enabledTypesList = (Object.entries(enabledTypes) as [ComponentType, boolean][])
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/test-console-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          prompt: prompt,
          system_prompt: systemPrompt,
          component_types: enabledTypesList,
          model: model,
          created_by: session?.user?.email ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? data.msg ?? `Request failed (${res.status})`);
      } else {
        setResponse({
          text: data.response,
          model: data.model,
          tokens_input: data.tokens_input,
          tokens_output: data.tokens_output,
          component_count: data.component_count,
          duration_ms: data.duration_ms,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: ComponentType) => {
    setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const getToggleClasses = (type: ComponentType, color: string) => {
    const isEnabled = enabledTypes[type];
    if (isEnabled) {
      switch (color) {
        case "blue":
          return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
        case "green":
          return "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
        case "amber":
          return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
        case "purple":
          return "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
        default:
          return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      }
    }
    return "bg-muted text-muted-foreground border border-border";
  };

  const enabledCount = COMPONENT_TYPES.reduce((sum, ct) => {
    return sum + (enabledTypes[ct.type] ? counts[ct.type] : 0);
  }, 0);

  return (
    <div className="h-full w-full flex flex-col p-4 bg-muted gap-3">
      {/* Top controls: toggles + model selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {COMPONENT_TYPES.map((ct) => (
            <button
              key={ct.type}
              onClick={() => toggleType(ct.type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors ${getToggleClasses(
                ct.type,
                ct.color
              )}`}
            >
              {ct.label} ({counts[ct.type]})
            </button>
          ))}
        </div>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-[200px] shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info label */}
      <p className="text-xs text-muted-foreground">
        The agent can only see the {enabledCount} components toggled on above.
      </p>

      {/* System prompt collapsible */}
      <Collapsible open={systemPromptOpen} onOpenChange={setSystemPromptOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80">
          <span>{systemPromptOpen ? "▼" : "▶"}</span>
          System Prompt
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-col gap-2">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="font-mono text-xs min-h-[200px] resize-y bg-background border-input"
          />
          {systemPrompt !== DEFAULT_SYSTEM_PROMPT && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground text-left"
              onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
            >
              Reset to default
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            The component library is appended automatically based on your toggles above.
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Response area */}
      <div className="flex-1 overflow-y-auto">
        {!response && !error && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Run a test to see how the agent reasons from your library.
          </p>
        )}

        {error && <p className="text-sm text-destructive py-4">{error}</p>}

        {response && (
          <div className="flex flex-col gap-3">
            <div className="prose prose-sm max-w-none text-foreground bg-background p-4 rounded-md border border-border">
              <ReactMarkdown>{response.text}</ReactMarkdown>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-t border-border">
              <span>{response.model}</span>
              <span>
                {response.tokens_input} in / {response.tokens_output} out
              </span>
              <span>{response.component_count} components</span>
              <span>{response.duration_ms}ms</span>
            </div>

            <Button variant="outline" size="sm" onClick={onAddComponent} className="self-start">
              + Add component
            </Button>
          </div>
        )}
      </div>

      {/* Prompt input (fixed at bottom) */}
      <div className="border-t border-border pt-3 mt-auto">
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a client scenario, paste an email, or ask a question..."
            className="flex-1 min-h-[60px] resize-none shadow-sm"
            disabled={loading}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleTest();
              }
            }}
          />
          <Button disabled={loading || !prompt.trim()} onClick={handleTest} className="shadow-sm">
            {loading ? "Testing..." : "Test"}
          </Button>
        </div>
      </div>
    </div>
  );
}
