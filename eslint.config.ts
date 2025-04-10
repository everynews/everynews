import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import preferArrowPlugin from 'eslint-plugin-prefer-arrow-functions'

// Define file patterns
const tsFiles = ['**/*.ts', '**/*.tsx']
const jsFiles = ['**/*.js', '**/*.jsx', '**/*.mjs']

// Define language options
const languageOptions = {
  ecmaVersion: 2022,
  sourceType: 'module',
  globals: {
    ...globals.browser,
    ...globals.node,
    ...globals.es2021,
  },
}

// Define typescript config
const tsConfig = [
  ...tseslint.configs.recommended,
  {
    files: tsFiles,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'prefer-arrow-functions': preferArrowPlugin,
    },
    languageOptions: {
      ...languageOptions,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],

      // Enforce no semicolons
      semi: ['error', 'never'],

      // The important rule for enforcing arrow functions
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          classPropertiesAllowed: false,
          disallowPrototype: true,
          returnStyle: 'implicit',
          singleReturnOnly: false,
          allowNamedFunctions: false,
        },
      ],
    },
  },
]

// Define JavaScript config
const jsConfig = [
  js.configs.recommended,
  {
    files: jsFiles,
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'prefer-arrow-functions': preferArrowPlugin,
    },
    languageOptions: {
      ...languageOptions,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Enforce no semicolons
      semi: ['error', 'never'],

      // Prefer arrow function rule
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          classPropertiesAllowed: false,
          disallowPrototype: true,
          returnStyle: 'implicit',
          singleReturnOnly: false,
          allowNamedFunctions: false,
        },
      ],
    },
  },
]

// Define ignores
const ignores = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      '.vercel/**',
      'build/**',
      'dist/**',
      'coverage/**',
    ],
  },
]

export default [...ignores, ...jsConfig, ...tsConfig]
