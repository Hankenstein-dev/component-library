import type { ComponentEntry } from "@/lib/types";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ComponentListProps {
  entries: ComponentEntry[];
  selectedId: string | null;
  onSelect: (entry: ComponentEntry) => void;
}

export function ComponentList({ entries, selectedId, onSelect }: ComponentListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No entries yet. Add one to get started.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`p-3 cursor-pointer hover:bg-accent transition-colors shadow-sm ${selectedId === entry.id ? "bg-accent" : ""}`}
          onClick={() => onSelect(entry)}
        >
          <p className="text-sm font-medium text-foreground">{entry.name || "Untitled"}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {entry.description.slice(0, 100)}{entry.description.length > 100 ? "..." : ""}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {entry.contributed_by && (
              <span className="text-xs text-muted-foreground">{entry.contributed_by}</span>
            )}
            <span className="text-xs text-muted-foreground">{relativeTime(entry.updated_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
