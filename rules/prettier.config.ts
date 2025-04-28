import prettierPluginSortImport from '@ianvs/prettier-plugin-sort-imports'
import type { Config } from 'prettier'
import prettierPluginPkg from 'prettier-plugin-pkg'
import * as prettierPluginTailwindCss from 'prettier-plugin-tailwindcss'

const config: Config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  plugins: [
    prettierPluginPkg,
    prettierPluginSortImport,
    prettierPluginTailwindCss,
  ],
  tailwindFunctions: ['clsx', 'cn'],
}

export default config
