import globals from 'globals'

import js from '@eslint/js'
import ts from 'typescript-eslint'
import react from 'eslint-plugin-react'
import hooks from 'eslint-plugin-react-hooks'
import style from '@stylistic/eslint-plugin'
import tw from 'eslint-plugin-tailwindcss'
import perfectionist from 'eslint-plugin-perfectionist'

export default [
    // js
    js.configs.recommended,
    // ts
    ...ts.configs.recommended,
    // style
    {
        plugins: {
            '@stylistic': style
        },
        rules: {
            '@stylistic/jsx-quotes': ['error', 'prefer-single'],
            '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
            '@stylistic/no-extra-semi': 'error',
            '@stylistic/brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            '@stylistic/block-spacing': 'error',
        }
    },
    // ignores
    {
        ignores: ['!**/.server', '!**/.client'],
    },
    // react
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        ...react.configs.flat.recommended,
        plugins: {
            ...react.configs.flat.recommended.plugins,
            'react-hooks': hooks
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...hooks.configs.recommended.rules,
            ...react.configs.flat["jsx-runtime"].rules,
        },
        languageOptions: {
            ...react.configs.flat.recommended.languageOptions,
            parserOptions: react.configs.flat['jsx-runtime'].languageOptions.parserOptions,
            globals: {
                ...globals.browser,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
            formComponents: ['Form'],
            linkComponents: [
                {
                    name: 'Link',
                    linkAttribute: 'to',
                }, {
                    name: 'NavLink',
                    linkAttribute: 'to',
                }
            ],
            'import/resolver': {
                typescript: {},
            },
        },
    },
    // tailwind
    ...tw.configs['flat/recommended'],
    // imports sorting
    {
        plugins: {
            perfectionist,
        },
        rules: {
            'perfectionist/sort-imports': [
                'error',
                {
                    type: 'natural',
                    order: 'asc',
                    ignoreCase: true,
                    internalPattern: ['~/**'],
                    newlinesBetween: 'always',
                    maxLineLength: undefined,
                    groups: [
                        'react',
                        'remix',
                        'node',
                        ['builtin', 'external'],
                        'internal',
                        ['type','internal-type'],
                        ['parent-type', 'sibling-type', 'index-type'],
                        ['parent', 'sibling', 'index'],
                        'object',
                        'unknown',
                    ],
                    customGroups: {
                        value: {
                            node: ['node:*', 'node:*/*'],
                            react: ['react', 'react-*'],
                            remix: ['@remix-run/*']
                        },
                    },
                    environment: 'node',
                },
            ],
        },
    },
]
