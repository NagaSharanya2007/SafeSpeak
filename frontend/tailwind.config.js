/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: "#F2EFE9", // warm beige background
        secondary: "#A3C4AC", // sage green (selected state)
        secondaryLight: "#D1DDD3", // lighter sage
        accent: "#F28C69", // terracotta orange
        accentHover: "#D66B4E", // darker terracotta
        textLight: "#1E293B", // dark olive/charcoal for main text
        textMuted: "#475569", // muted olive for subtext
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      }
    },
  },
  plugins: [],
}
