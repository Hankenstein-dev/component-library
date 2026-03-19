import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "@/components/LoginPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginPage />;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* TopBar and panels will go here in Task 5 */}
      <p className="p-4 text-foreground">Logged in as {user.email}</p>
    </div>
  );
}
