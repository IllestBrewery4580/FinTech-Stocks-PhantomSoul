// tailwind.config.js
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
    theme: {
      extend: {
        colors: {
          background: "#000000",
          surface: "#0A0A0C",
          primary: "#1A1A1E",
          accent: "#3A3A42",
          highlight: "#E0E0E6",
        },
        keyframes: {
          typing: {
            "0%": { width: "0%" },
            "100%": { width: "100%" },
          },
          blink: {
            "0%, 100%": { borderColor: "transparent" },
            "50%": { borderColor: "#E0E0E6" },
          },
        },
        animation: {
          typing: "typing 3.5s steps(40, end) forwards, blink 0.75s step-end infinite",
        },
      },
    },
    plugins: [],
  };