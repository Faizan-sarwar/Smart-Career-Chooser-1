// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Check localStorage first, default to 'system'
  const [theme, setTheme] = useState(() => localStorage.getItem("app-theme") || "system");

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Function to apply the actual CSS theme
    const applyTheme = (currentTheme) => {
      root.removeAttribute("data-theme");
      
      if (currentTheme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemPrefersDark) root.setAttribute("data-theme", "dark");
      } else if (currentTheme === "dark") {
        root.setAttribute("data-theme", "dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("app-theme", theme);

    // Listen for OS-level changes if set to 'system' (e.g. if the user's Mac switches to night mode)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);