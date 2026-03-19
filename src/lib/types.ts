export const COMPONENT_TYPES = [
  { type: "document", table: "documents", label: "Documents", color: "blue" },
  { type: "information", table: "information", label: "Information", color: "green" },
  { type: "activity", table: "activities", label: "Activities", color: "amber" },
  { type: "knowledge", table: "knowledge", label: "Knowledge", color: "purple" },
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number]["type"];
export type TableName = (typeof COMPONENT_TYPES)[number]["table"];

export interface ComponentEntry {
  id: string;
  name: string;
  description: string;
  contributed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestSession {
  id: string;
  prompt: string;
  system_prompt: string | null;
  component_types_included: string[];
  component_count: number;
  response: string;
  model: string;
  tokens_input: number | null;
  tokens_output: number | null;
  duration_ms: number | null;
  created_at: string;
  created_by: string | null;
}
