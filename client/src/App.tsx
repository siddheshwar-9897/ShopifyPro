import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AccessibilityControls from "@/components/accessibility-controls";

// Placeholder AdminPanel component
function AdminPanel() {
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>This is a placeholder admin panel.</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AccessibilityControls />
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;