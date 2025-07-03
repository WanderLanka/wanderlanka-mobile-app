/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary (Green)
        "primary": "#059669", // Default primary color
        "primary-100": "#dcfce7",
        "primary-300": "#86efac",
        "primary-500": "#22c55e",
        "primary-600": "#059669", // Brand color
        "primary-700": "#047857", // Hover
        "primary-800": "#065f46", // Active
        
        // Secondary (Gray)
        "secondary-50": "#f8fafc",
        "secondary-200": "#e2e8f0",
        "secondary-400": "#94a3b8",
        "secondary-500": "#64748b", // Body text
        "secondary-600": "#475569", // Headers
        "secondary-700": "#334155", // Dark text
        
        // Light colors
        "light-100": "#f1f5f9",
        "light-200": "#e2e8f0",
        "light-300": "#cbd5e1",
        "light-400": "#94a3b8",
        "light-500": "#64748b",
        
        // Semantic
        "success": "#10b981",
        "warning": "#f59e0b",
        "error": "#ef4444",
        "info": "#3b82f6",
      },
      fontFamily: {
        inter: ["Inter"],
        poppins: ["Poppins"],
        nunito: ["Nunito"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.1)",
        "soft-lg": "0 10px 15px rgba(0,0,0,0.1)",
        medium: "0 4px 6px rgba(0,0,0,0.1)",
        large: "0 10px 15px rgba(0,0,0,0.1)",
        "extra-large": "0 20px 25px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};
