const prettierOptions = require('./.prettier.js')
module.exports = {
  extends: ['prettier'],
  plugins: ['jest', 'import', 'prettier'],
  env: {
    'jest/globals': true
  },
  globals: {
    window: true
  },
  rules: {
    'prettier/prettier': ['error', prettierOptions]
  }
}
