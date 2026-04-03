import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/assets/**', 'public/assets/**',]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
   rules: {
      'no-unused-vars': [
        'error',
        { 
          vars: 'all', 
          args: 'after-used', 
          ignoreRestSiblings: true, 
          varsIgnorePattern: '^[A-Z_]|motion', 
          argsIgnorePattern: '^_' 
        }
      ],
      // Також можна вимкнути або пом'якшити правило залежностей, якщо їх забагато
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
