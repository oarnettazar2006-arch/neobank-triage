import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // DESIGN.md, section 5.3 : aucun HTML reçu n'est interprété.
      'react/no-danger': 'error',
      'react/no-danger-with-children': 'error',
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'Rendre le texte comme du texte React (DESIGN.md, 5.3).' },
        { property: 'outerHTML', message: 'Rendre le texte comme du texte React (DESIGN.md, 5.3).' },
      ],
      // DESIGN.md, section 10 : dates, progression et jours ouvrés viennent de l'API.
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: "Le front ne calcule aucune date : utiliser les champs de l'API." },
      ],
    },
  },
)
