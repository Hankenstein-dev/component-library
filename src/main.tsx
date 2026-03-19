import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </StrictMode>
);
