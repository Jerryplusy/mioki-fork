import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  dts: true,
  sourcemap: true,
  target: 'node24',
  treeshake: true,
  tsconfig: './tsconfig.json',
  format: ['cjs', 'esm'],
})
