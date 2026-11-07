import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'eslint.config.mjs']),

  js.configs.recommended,

  // TypeScript rules that use type information (catch real bugs, not style)
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A Promise that is never awaited = an error nobody sees
      '@typescript-eslint/no-floating-promises': 'error',
      // `any` turns off type checking — allowed, but should stand out
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Must be last: turns off rules that conflict with Prettier
  prettier,
]);
