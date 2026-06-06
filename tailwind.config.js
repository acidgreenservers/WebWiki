/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d1117",
        surface: "#161b22",
        elevated: "#1c2128",
        border: "#30363d",
        "border-subtle": "#21262d",
        primary: {
          DEFAULT: "#3b6ef8",
          hover: "#2d5ce8",
        },
        success: {
          DEFAULT: "#22c55e",
          active: "#22c55e",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#8b949e",
          muted: "#6e7681",
        },
        amber: {
          warning: "#f59e0b",
        },
        red: {
          danger: "#f87171",
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        serif: ['Georgia', 'Times New Roman', 'Palatino Linotype', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
