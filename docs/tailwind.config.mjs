/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xsm: "400px",
      },
      gridTemplateColumns: {
        content: "minmax(280px, 280px) minmax(320px, 1fr)",
        "content-no-top": "minmax(280px, 280px) minmax(320px, 1fr)",
      },
    },
  },
  plugins: [],
};
