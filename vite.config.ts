import { createMemoryLobbyVitePlugins } from "ba-memorylobby-wallpaper-toolkit/vite";
import { createRequire } from "node:module";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);

export default defineConfig({
  base: "./",
  plugins: createMemoryLobbyVitePlugins({
    loggingBootstrapPath: require.resolve(
      "ba-memorylobby-wallpaper-runtime/logging-bootstrap.js",
    ),
    logRoute: "/__hare-log",
  }),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    target: "chrome90",
  },
});
