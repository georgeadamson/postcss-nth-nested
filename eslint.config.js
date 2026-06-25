const js = require('@eslint/js');
const jest = require('eslint-plugin-jest');

module.exports = [
  js.configs.recommended,
  jest.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2017,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    rules: {
      'jest/expect-expect': 'off'
    }
  }
];
