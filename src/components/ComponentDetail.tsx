import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ComponentEntry, ComponentType } from "@/lib/types";

const DESCRIPTION_PLACEHOLDERS: Record<ComponentType, string> = {
  information: `WHAT IT IS
Describe this piece of information in plain language. What are we capturing? Include the data shape — is it a name (text), a yes/no question, a date, a number, a currency amount, a selection from options, or a structured group with multiple parts (like an income source with type, amount, frequency, etc)?

WHY IT MATTERS
Why does this information exist in the immigration process? What role does it play? Not which of our systems use it — but why anyone in immigration law cares about it. What decisions or outcomes does it influence?

WHAT GOES WRONG
What do clients get confused about when providing this? What mistakes does the legal team commonly see? What causes problems downstream if this is captured incorrectly? This is the team's hard-won experience — the things a new team member would need to be warned about.`,

  document: `WHAT IT IS
What is this document? Who issues it? What does it look like? Is it a certificate, a form to be filled, a bank-generated report, a government application, a letter?

WHAT IT CONTAINS OR REQUIRES
For evidence documents (passport, bank statement, criminal record certificate): what data can be found in it?
For forms and applications (Schengen application, government submission forms): what information fields does it need to be completed?

WHAT MAKES IT ACCEPTABLE
What are the review criteria? How long is it valid? Does it require an apostille, legalisation, or notarisation? Are there formatting requirements? What specifically causes rejection — expired dates, missing stamps, wrong format, name mismatches?

HOW IT IS OBTAINED
How does someone get this document? Who issues it and what is the process? How long does it typically take? Does the process differ by country — and if so, note the key variations the team has encountered.`,

  knowledge: `WHAT THIS IS ABOUT
Name the subject clearly. This should be specific enough that a team member can look at the title and know whether this entry is current or needs updating — without reading the full content.

THE INSIGHT
The actual intelligence. What is the rule, the threshold, the process, the edge case, the consulate-specific behaviour? Be specific and concrete. This is what an agent will use to make contextual decisions — vague guidance isn't useful. Include numbers, timelines, and specifics where they exist.

CURRENCY
When was this last verified? How stable is this information — is it a regulation that's been consistent for years, or a consulate practice that could change next month? Who on the team contributed or confirmed this?`,
};

interface ComponentDetailProps {
  entry: ComponentEntry | null; // null = creating new
  componentType: ComponentType;
  onBack: () => void;
  onSave: (data: { name: string; description: string; contributed_by: string | null }) => Promise<{ error: unknown }>;
  onUpdate: (id: string, data: { name?: string; description?: string; contributed_by?: string | null }) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

export function ComponentDetail({ entry, componentType, onBack, onSave, onUpdate, onDelete }: ComponentDetailProps) {
  const { user } = useAuth();
  const [name, setName] = useState(entry?.name ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [contributedBy, setContributedBy] = useState(entry?.contributed_by ?? user?.email ?? "");
  const [saving, setSaving] = useState(false);

  const isNew = !entry;
  const hasChanges = isNew
    ? name.trim() !== "" || description.trim() !== ""
    : name !== entry.name || description !== entry.description || contributedBy !== (entry.contributed_by ?? "");

  useEffect(() => {
    setName(entry?.name ?? "");
    setDescription(entry?.description ?? "");
    setContributedBy(entry?.contributed_by ?? user?.email ?? "");
  }, [entry, user?.email]);

  const handleSave = async () => {
    setSaving(true);
    if (isNew) {
      const { error } = await onSave({ name, description, contributed_by: contributedBy || null });
      if (error) toast.error("Failed to save");
      else { toast.success("Saved"); onBack(); }
    } else {
      const { error } = await onUpdate(entry.id, { name, description, contributed_by: contributedBy || null });
      if (error) toast.error("Failed to save");
      else toast.success("Saved");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!entry) return;
    const { error } = await onDelete(entry.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); onBack(); }
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
        ← Back
      </button>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Component name"
        className="text-lg font-medium"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={DESCRIPTION_PLACEHOLDERS[componentType]}
        className="min-h-[400px] resize-y font-mono text-sm bg-background border-input"
      />
      <Input
        value={contributedBy}
        onChange={(e) => setContributedBy(e.target.value)}
        placeholder="Contributed by"
      />
      {!isNew && entry && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Created: {new Date(entry.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(entry.updated_at).toLocaleString()}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {!isNew && entry && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {entry.name || "this entry"}?</AlertDialogTitle>
                <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
