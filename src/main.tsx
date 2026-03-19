import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { supabaseMissing } from "@/lib/supabase";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {supabaseMissing ? (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h1>Missing environment variables</h1>
        <p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> and redeploy.</p>
      </div>
    ) : (
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    )}
  </StrictMode>
);
