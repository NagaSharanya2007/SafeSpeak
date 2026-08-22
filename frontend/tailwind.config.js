/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark, calming color palette (slate and emerald)
        primary: "#0f172a", // slate-900
        secondary: "#1e293b", // slate-800
        accent: "#10b981", // emerald-500
        accentHover: "#059669", // emerald-600
        textLight: "#f8fafc", // slate-50
        textMuted: "#94a3b8", // slate-400
      }
    },
  },
  plugins: [],
}
