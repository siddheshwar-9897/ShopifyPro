import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";
import { Eye, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccessibilityControls() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleThemeToggle = () => {
    toggleTheme();
    const newTheme = theme === "default" ? "high contrast" : "default";
    toast({
      title: `Switched to ${newTheme} mode`,
      description: `Display mode has been updated to ${newTheme}`,
      // This will be announced by screen readers
      "aria-live": "polite",
    });
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex gap-2"
      role="region"
      aria-label="Accessibility controls"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={handleThemeToggle}
        aria-pressed={theme === "high-contrast"}
        aria-label={`Toggle high contrast mode, currently ${
          theme === "high-contrast" ? "enabled" : "disabled"
        }`}
      >
        {theme === "high-contrast" ? (
          <Eye className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
