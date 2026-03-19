import { useState, useEffect } from "react";
import { COMPONENT_TYPES, type ComponentType, type ComponentEntry } from "@/lib/types";
import { useComponents } from "@/hooks/useComponents";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComponentList } from "./ComponentList";
import { ComponentDetail } from "./ComponentDetail";

interface LibraryPanelProps {
  externalActiveType?: ComponentType;
  externalIsCreating?: boolean;
  onStateChange?: () => void;
}

export function LibraryPanel({ externalActiveType, externalIsCreating, onStateChange }: LibraryPanelProps) {
  const [activeType, setActiveType] = useState<ComponentType>(externalActiveType ?? "document");
  const [selectedEntry, setSelectedEntry] = useState<ComponentEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");

  // Get the active table name
  const activeConfig = COMPONENT_TYPES.find((t) => t.type === activeType);
  const tableName = activeConfig?.table ?? "documents";

  // Hook for the active table
  const { entries, loading, count, createEntry, updateEntry, deleteEntry } = useComponents(tableName);

  // Filter entries by search
  const filteredEntries = entries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle external control
  useEffect(() => {
    if (externalActiveType !== undefined) {
      setActiveType(externalActiveType);
    }
  }, [externalActiveType]);

  useEffect(() => {
    if (externalIsCreating) {
      setIsCreating(true);
      setSelectedEntry(null);
    }
  }, [externalIsCreating]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newType = value as ComponentType;
    setActiveType(newType);
    setSelectedEntry(null);
    setIsCreating(false);
    setSearch("");
    onStateChange?.();
  };

  // Handle entry selection
  const handleSelectEntry = (entry: ComponentEntry) => {
    setSelectedEntry(entry);
    setIsCreating(false);
  };

  // Handle add button
  const handleAddClick = () => {
    setIsCreating(true);
    setSelectedEntry(null);
  };

  // Handle back from detail
  const handleBack = () => {
    setSelectedEntry(null);
    setIsCreating(false);
    onStateChange?.();
  };

  // Badge color classes by type
  const getBadgeClass = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case "green":
        return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
      case "amber":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case "purple":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    }
  };

  // Show detail view if creating or editing
  const showDetail = isCreating || selectedEntry !== null;
  const selectedId = selectedEntry?.id ?? null;

  return (
    <div className="h-full w-full overflow-y-auto p-4 bg-background flex flex-col gap-3">
      <Tabs value={activeType} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          {COMPONENT_TYPES.map((type) => (
            <TabsTrigger key={type.type} value={type.type} className="flex items-center gap-2">
              <span>{type.label}</span>
              <Badge className={getBadgeClass(type.color)}>
                {type.type === activeType ? count : 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {COMPONENT_TYPES.map((type) => (
          <TabsContent key={type.type} value={type.type} className="flex flex-col gap-3">
            {!showDetail && (
              <>
                <Input
                  type="text"
                  placeholder={`Search ${type.label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shadow-sm"
                />
                <Button onClick={handleAddClick} className="shadow-sm">
                  + Add {type.type}
                </Button>
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
                ) : (
                  <ComponentList
                    entries={filteredEntries}
                    selectedId={selectedId}
                    onSelect={handleSelectEntry}
                  />
                )}
              </>
            )}
            {showDetail && (
              <ComponentDetail
                entry={selectedEntry}
                onBack={handleBack}
                onSave={createEntry}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
