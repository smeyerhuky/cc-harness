import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/.wrangler/**', 'spikes/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  // The engine's determinism contract (kb/design/architecture.md): ticks, not the clock; seeded
  // streams, not Math.random; no functions JavaScript engines may round differently.
  {
    files: ['src/engine/src/**/*.ts'],
    ignores: [
      'src/engine/src/**/*.test.ts',
      'src/engine/src/testing.ts',
      'src/engine/src/speed-table-gen.ts',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['Date', 'performance', 'setTimeout', 'setInterval', 'queueMicrotask'].map((name) => ({
          name,
          message: 'The engine counts ticks and never reads the clock.',
        })),
        ...['window', 'document', 'navigator', 'process', 'crypto'].map((name) => ({
          name,
          message: 'The engine runs everywhere, so it uses no platform APIs.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use a seeded stream (mulberry32).' },
        ...['pow', 'exp', 'expm1', 'log', 'log1p', 'log2', 'log10', 'cbrt', 'hypot'].map(
          (property) => ({
            object: 'Math',
            property,
            message: 'Not bit-identical across JavaScript engines: precompute a table.',
          }),
        ),
        ...['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh'].map(
          (property) => ({
            object: 'Math',
            property,
            message: 'Not bit-identical across JavaScript engines: precompute a table.',
          }),
        ),
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='**']",
          message: 'Not bit-identical across JavaScript engines: precompute a table.',
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
