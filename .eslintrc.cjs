/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  overrides: [
    {
      files: '**/*.vue',
      extends: [
        'eslint:recommended',
        'plugin:vue/vue3-essential',
        '@vue/eslint-config-typescript',
        '@vue/eslint-config-prettier',
      ],
      rules: {
        'prettier/prettier': [
          'error',
          {
            singleQuote: true,
            arrowParens: 'avoid',
            trailingComma: 'es5',
          },
        ],
      },
    },
    {
      files: ['*.cjs', '*.ts', '*.tsx', '*.js', '*.jsx'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended',
        'prettier',
      ],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      rules: {
        'prettier/prettier': [
          'error',
          {
            singleQuote: true,
            // trailingComma: 'none',
            arrowParens: 'avoid',
            trailingComma: 'es5',
          },
        ],
        camelcase: 'warn',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
      },
      env: {
        node: true,
      },
    },
    // {
    //   files: [ '_development/reverse.js'],
    //   extends: [
    //     'eslint:recommended',
    //     'plugin:@typescript-eslint/eslint-recommended',
    //     'plugin:@typescript-eslint/recommended',
    //     'plugin:@typescript-eslint/recommended-requiring-type-checking',
    //     'plugin:prettier/recommended',
    //     'prettier',
    //   ],
    //   plugins: ['@typescript-eslint'],
    //   parser: '@typescript-eslint/parser',
    //   parserOptions: {
    //     sourceType: 'node',
    //     ecmaVersion: 2020,
    //     project: './tsconfig.json',
    //     tsconfigRootDir: __dirname,
    //   },
    //   rules: {
    //     'prettier/prettier': [
    //       'error',
    //       {
    //         singleQuote: true,
    //         arrowParens: 'avoid',
    //         trailingComma: 'es5',
    //       },
    //     ],
    //     camelcase: 'warn',
    //     '@typescript-eslint/no-use-before-define': 'off',
    //     '@typescript-eslint/ban-ts-comment': 'off',
    //     '@typescript-eslint/unbound-method': 'off',
    //     '@typescript-eslint/no-unsafe-assignment': 'off',
    //     '@typescript-eslint/no-unsafe-return': 'off',
    //     '@typescript-eslint/no-floating-promises': 'off',
    //     '@typescript-eslint/no-unused-vars': 'off',
    //     '@typescript-eslint/no-explicit-any': 'off',
    //     '@typescript-eslint/no-unsafe-call': 'off',
    //     '@typescript-eslint/no-var-requires': 'off',
    //     '@typescript-eslint/no-unsafe-argument': 'off',
    //   },
    // },
  ],
};
