# React + TypeScript + Vite

## Vercel でデプロイする場合

1. Vercel の **Project → Settings → General → Root Directory** を `sns-automation` に設定する（リポジトリ直下ではなくこのフォルダがアプリのルートです）。
2. **Settings → Build & Output** で **Build Command** が `vite build` になっている場合は **削除（空にする）** するか、明示的に `npm run vercel-build` に変更する。  
   `vite build` をシェルがそのまま実行すると `node_modules/.bin` が PATH に入らず、`vite: command not found`（exit 127）になります。
3. **Framework Preset** は **Other** にするか、少なくとも Build Command の上書きをやめて、このリポジトリの `vercel.json` を使う。
4. **Cron Jobs（予約投稿の自動実行）**: Vercel **Hobby** は **1日1回まで**の Cron しか使えません。`vercel.json` の `crons` は **UTC** の `0 15 * * *`（日本時間 0:00 頃）に設定しています。毎分実行したい場合は **Pro** にするか、外部の定期実行を検討してください。

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
