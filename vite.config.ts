import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/audit': 'http://localhost:4000',
      '/medicines': 'http://localhost:4000',
      '/residents': 'http://localhost:4000',
      '/stocks': 'http://localhost:4000',
      '/releases': 'http://localhost:4000',
      '/removals': 'http://localhost:4000',
      '/suppliers': 'http://localhost:4000',
      '/transactions': 'http://localhost:4000',
      '/users': 'http://localhost:4000',
      '/verify': 'http://localhost:4000',
      '/sync': 'http://localhost:4000'
    }
  }
});