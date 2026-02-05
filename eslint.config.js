import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'public', 'scripts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': react,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: [
          './tsconfig.app.json',
          './tsconfig.node.json',
          './tsconfig.electron.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // === RIGOROUS BASE RULES ===
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // === REACT RIGOR ===
      'react/jsx-pascal-case': 'error',
      'react/no-array-index-key': 'error',
      'react/self-closing-comp': 'error',

      // === ARCHITECTURAL RULES (Custom via restricted syntax) ===
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[key.name="width"][value.value="40px"]',
          message: 'Hardcoded 40px width found. Ensure this is inside a Ribbon component or use a design token.',
        },
        {
          selector: 'Literal[value=/^[A-Z][A-Z\\s]+$/]', // Flag ALL CAPS strings in JSX
          message: 'Avoid ALL CAPS in UI strings. Use Sentence case as per design docs (a.md).',
        }
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
])
