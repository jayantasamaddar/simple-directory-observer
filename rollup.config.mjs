import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import externals from 'rollup-plugin-node-externals';

const input = 'src/index.ts';
// Read package.json
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url).pathname)
);
const extensions = ['.ts', '.js'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    input,
    output: [
      {
        format: 'cjs',
        dir: path.dirname(pkg.main),
        preserveModules: true,
        preserveModulesRoot: path.resolve(__dirname, 'src'),
        entryFileNames: '[name].js',
        exports: 'named'
      },
      {
        format: 'esm',
        dir: path.dirname(pkg.module),
        preserveModules: true,
        preserveModulesRoot: path.resolve(__dirname, 'src'),
        entryFileNames: '[name].js'
      }
    ],
    plugins: [
      externals(),
      typescript({ compilerOptions: { module: "ESNext" }}),
      nodeResolve({ extensions }),
      commonjs(),
      terser()
    ]
  }
];