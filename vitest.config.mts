import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 20000,
    hookTimeout: 30000,
    // Os testes de integração compartilham um único banco de dados de teste
    // (Postgres) e usam TRUNCATE entre os casos — execução em paralelo entre
    // arquivos causaria deadlocks e violações de FK entre suítes.
    fileParallelism: false,
  },
});
