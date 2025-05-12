/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {}, // ✅ back to Tailwind v3 plugin name
    autoprefixer: {},
  },
};

export default config;
