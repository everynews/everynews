import js from '@eslint/js'
// @ts-expect-error Next.js ESLint Config is still JS-based
import next from '@next/eslint-plugin-next'
import preferArrowPlugin from 'eslint-plugin-prefer-arrow-functions'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
      '@next/next': next,
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

      // Enforce blank lines
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'never', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
        { blankLine: 'always', prev: '*', next: 'class' },
        { blankLine: 'always', prev: 'class', next: '*' },
        { blankLine: 'always', prev: 'const', next: '*' },
        { blankLine: 'always', prev: 'const', next: 'const' },
      ],

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

      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
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
      '@next/next': next,
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

      // Enforce blank lines
      'padding-line-between-statements': [
        'error',
        { blankLine: 'never', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
        { blankLine: 'always', prev: '*', next: 'class' },
        { blankLine: 'always', prev: 'class', next: '*' },
        { blankLine: 'always', prev: '*', next: 'const' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'throw' },
        { blankLine: 'always', prev: '*', next: 'break' },
        { blankLine: 'always', prev: '*', next: 'continue' },
      ],

      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

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
