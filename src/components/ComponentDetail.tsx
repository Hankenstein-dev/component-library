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
import type { ComponentEntry } from "@/lib/types";

interface ComponentDetailProps {
  entry: ComponentEntry | null; // null = creating new
  onBack: () => void;
  onSave: (data: { name: string; description: string; contributed_by: string | null }) => Promise<{ error: unknown }>;
  onUpdate: (id: string, data: { name?: string; description?: string; contributed_by?: string | null }) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

export function ComponentDetail({ entry, onBack, onSave, onUpdate, onDelete }: ComponentDetailProps) {
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
        placeholder="Describe this component in detail. Include: what it is, when it's needed, important nuances, common issues, edge cases, and anything a colleague would need to know."
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
