import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
      <span className="text-base font-medium text-foreground">Roots — Training Interface</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{user?.email}</span>
        <Button variant="outline" size="sm" onClick={signOut}>
          Log out
        </Button>
      </div>
    </div>
  );
}
