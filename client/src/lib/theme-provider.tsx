import { createContext, useContext, useEffect, useState } from "react";

type Theme = "default" | "high-contrast";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("default");

  const toggleTheme = () => {
    const newTheme = theme === "default" ? "high-contrast" : "default";
    setTheme(newTheme);
    localStorage.setItem("theme-preference", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme-preference") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove("theme-default", "theme-high-contrast");
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
