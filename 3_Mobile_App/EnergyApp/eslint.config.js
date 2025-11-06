// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  
  // ⬇️ === เพิ่ม Object นี้เข้าไป === ⬇️
  {
    settings: {
      'import/resolver': {
        node: {
          // บอก ESLint ให้หาโมดูลจาก 'node_modules' และ '.' (โฟลเดอร์ราก)
          moduleDirectory: ['node_modules', '.'], 
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  // ⬆️ ========================== ⬆️
]);