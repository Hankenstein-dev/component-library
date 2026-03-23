// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLE_MAP: Record<string, string> = {
  document: "documents",
  information: "information",
  knowledge: "knowledge",
};

const SECTION_LABELS: Record<string, string> = {
  document: "DOCUMENTS",
  information: "INFORMATION",
  knowledge: "KNOWLEDGE",
};

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Parse request body
    const { prompt, system_prompt, component_types, model, created_by } = await req.json();

    // 4. Query component tables
    let totalCount = 0;
    let libraryText = "\n\n## YOUR COMPONENT LIBRARY\n";

    for (const type of component_types) {
      const table = TABLE_MAP[type];
      if (!table) continue;

      const { data: components, error: queryError } = await supabase
        .from(table)
        .select("name, description")
        .order("name");

      if (queryError || !components) continue;

      totalCount += components.length;
      libraryText += `\n### ${SECTION_LABELS[type]}\n\n`;

      for (const comp of components) {
        libraryText += `**${comp.name}**\n${comp.description}\n\n`;
      }

      libraryText += "---\n";
    }

    // 5. Assemble full system prompt
    const fullSystemPrompt = system_prompt + libraryText;

    // 6. Determine provider from model prefix
    const startTime = Date.now();
    let responseText = "";
    let tokensInput = 0;
    let tokensOutput = 0;

    if (model.startsWith("claude-")) {
      // Anthropic
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          system: fullSystemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Anthropic API error: ${res.status} ${res.statusText}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const data = await res.json();
      responseText = data.content[0].text;
      tokensInput = data.usage.input_tokens;
      tokensOutput = data.usage.output_tokens;

    } else if (model.startsWith("gemini-")) {
      // Google
      const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: fullSystemPrompt }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 4096, temperature: 0 },
          }),
        }
      );

      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Google API error: ${res.status} ${res.statusText}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const data = await res.json();
      responseText = data.candidates[0].content.parts[0].text;
      tokensInput = data.usageMetadata?.promptTokenCount ?? 0;
      tokensOutput = data.usageMetadata?.candidatesTokenCount ?? 0;

    } else if (model.startsWith("gpt-")) {
      // OpenAI
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          messages: [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ error: `OpenAI API error: ${res.status} ${res.statusText}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const data = await res.json();
      responseText = data.choices[0].message.content;
      tokensInput = data.usage.prompt_tokens;
      tokensOutput = data.usage.completion_tokens;

    } else {
      return new Response(JSON.stringify({ error: `Unsupported model: ${model}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const durationMs = Date.now() - startTime;

    // 7. Log to test_sessions
    const { data: session, error: logError } = await supabase
      .from("test_sessions")
      .insert({
        prompt,
        system_prompt: fullSystemPrompt,
        component_types_included: component_types,
        component_count: totalCount,
        response: responseText,
        model,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        duration_ms: durationMs,
        created_by,
      })
      .select("id")
      .single();

    // 8. Return response
    return new Response(JSON.stringify({
      response: responseText,
      model,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      component_count: totalCount,
      session_id: session?.id ?? null,
      duration_ms: durationMs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
