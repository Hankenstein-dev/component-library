import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useComponents } from "@/hooks/useComponents";
import { LoginPage } from "@/components/LoginPage";
import { TopBar } from "@/components/TopBar";
import { LibraryPanel } from "@/components/LibraryPanel";
import { TestConsole } from "@/components/TestConsole";
import type { ComponentType } from "@/lib/types";

export default function App() {
  const { user, loading } = useAuth();
  const [mobileView, setMobileView] = useState<"library" | "console">("library");
  const [libraryActiveType] = useState<ComponentType>("document");
  const [libraryIsCreating, setLibraryIsCreating] = useState(false);

  // Get counts from each table
  const documents = useComponents("documents");
  const information = useComponents("information");
  const knowledge = useComponents("knowledge");

  const counts = useMemo(
    () => ({
      document: documents.count,
      information: information.count,
      knowledge: knowledge.count,
    }),
    [documents.count, information.count, knowledge.count]
  );

  if (loading) return null;
  if (!user) return <LoginPage />;

  const handleAddFromConsole = () => {
    setLibraryIsCreating(true);
    setMobileView("library");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar />
      {/* Mobile tab toggle */}
      <div className="flex md:hidden border-b border-border">
        <button
          className={`flex-1 py-2 text-xs font-medium text-center ${
            mobileView === "library"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setMobileView("library")}
        >
          Library
        </button>
        <button
          className={`flex-1 py-2 text-xs font-medium text-center ${
            mobileView === "console"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setMobileView("console")}
        >
          Console
        </button>
      </div>
      {/* Desktop: side by side. Mobile: toggled. */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            mobileView === "library" ? "flex" : "hidden"
          } md:flex w-full md:w-2/5 border-r border-border`}
        >
          <LibraryPanel
            externalActiveType={libraryActiveType}
            externalIsCreating={libraryIsCreating}
            onStateChange={() => setLibraryIsCreating(false)}
          />
        </div>
        <div
          className={`${
            mobileView === "console" ? "flex" : "hidden"
          } md:flex w-full md:w-3/5`}
        >
          <TestConsole counts={counts} onAddComponent={handleAddFromConsole} />
        </div>
      </div>
    </div>
  );
}
