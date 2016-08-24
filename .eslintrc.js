module.exports = {
  "env": {
    "browser": true,
    "commonjs": true
  },
  "extends": "eslint:recommended",
  "parser": "babel-eslint",
  "globals": {
    "$": true
  },
  "rules": {
    "accessor-pairs": "error",
    "array-bracket-spacing": [
      "error",
      "never"
    ],
    "array-callback-return": "off",
    "arrow-body-style": "error",
    "arrow-parens": "error",
    "arrow-spacing": "error",
    "block-scoped-var": "off",
    "block-spacing": "off",
    "brace-style": "off",
    "callback-return": "off",
    "camelcase": "off",
    "comma-dangle": [
      "error",
      "only-multiline"
    ],
    "comma-spacing": [
      "error",
      {
        "after": true,
        "before": false
      }
    ],
    "comma-style": [
      "error",
      "last"
    ],
    "complexity": "error",
    "computed-property-spacing": [
      "error",
      "never"
    ],
    "consistent-return": "off",
    "consistent-this": "off",
    "curly": "off",
    "default-case": "error",
    "dot-location": [
      "error",
      "property"
    ],
    "dot-notation": "off",
    "eol-last": "off",
    "eqeqeq": "off",
    "func-names": [
      "error",
      "never"
    ],
    "func-style": "off",
    "generator-star-spacing": "error",
    "global-require": "error",
    "guard-for-in": "off",
    "handle-callback-err": "error",
    "id-blacklist": "error",
    "id-length": "off",
    "id-match": "error",
    "indent": "off",
    "init-declarations": "off",
    "jsx-quotes": "error",
    "key-spacing": "off",
    "keyword-spacing": "off",
    "linebreak-style": [
      "error",
      "unix"
    ],
    "lines-around-comment": "off",
    "max-depth": "error",
    "max-len": "off",
    "max-lines": "off",
    "max-nested-callbacks": "error",
    "max-params": "off",
    "max-statements": "off",
    "max-statements-per-line": "off",
    "multiline-ternary": "off",
    "new-parens": "error",
    "newline-after-var": "off",
    "newline-before-return": "off",
    "newline-per-chained-call": "off",
    "no-alert": "off",
    "no-array-constructor": "error",
    "no-bitwise": "off",
    "no-caller": "error",
    "no-catch-shadow": "error",
    "no-cond-assign": [
      "error",
      "except-parens"
    ],
    "no-confusing-arrow": "error",
    "no-console": "off",
    "no-continue": "off",
    "no-div-regex": "error",
    "no-duplicate-imports": "error",
    "no-else-return": "off",
    "no-empty": [
      "error",
      {
        "allowEmptyCatch": true
      }
    ],
    "no-empty-function": "off",
    "no-eq-null": "error",
    "no-eval": "error",
    "no-extend-native": "error",
    "no-extra-bind": "off",
    "no-extra-label": "error",
    "no-extra-parens": "off",
    "no-floating-decimal": "off",
    "no-implicit-globals": "off",
    "no-implied-eval": "error",
    "no-inline-comments": "off",
    "no-inner-declarations": [
      "error",
      "functions"
    ],
    "no-invalid-this": "warn",
    "no-iterator": "error",
    "no-label-var": "error",
    "no-labels": "error",
    "no-lone-blocks": "error",
    "no-lonely-if": "off",
    "no-loop-func": "off",
    "no-magic-numbers": "off",
    "no-mixed-operators": "off",
    "no-mixed-requires": "error",
    "no-multi-spaces": "off",
    "no-multi-str": "off",
    "no-multiple-empty-lines": "off",
    "no-negated-condition": "off",
    "no-nested-ternary": "error",
    "no-new": "error",
    "no-new-func": "error",
    "no-new-object": "error",
    "no-new-require": "error",
    "no-new-wrappers": "error",
    "no-octal-escape": "error",
    "no-param-reassign": "off",
    "no-path-concat": "error",
    "no-plusplus": "off",
    "no-process-env": "error",
    "no-process-exit": "error",
    "no-proto": "error",
    "no-prototype-builtins": "off",
    "no-restricted-globals": "error",
    "no-restricted-imports": "error",
    "no-restricted-modules": "error",
    "no-restricted-syntax": "error",
    "no-return-assign": "off",
    "no-script-url": "error",
    "no-self-compare": "error",
    "no-sequences": "error",
    "no-shadow": "off",
    "no-shadow-restricted-names": "off",
    "no-spaced-func": "error",
    "no-sync": "error",
    "no-tabs": "off",
    "no-ternary": "off",
    "no-throw-literal": "off",
    "no-trailing-spaces": [
      "error",
      {
        "skipBlankLines": true
      }
    ],
    "no-undef-init": "error",
    "no-undefined": "off",
    "no-underscore-dangle": "off",
    "no-unmodified-loop-condition": "error",
    "no-unneeded-ternary": "error",
    "no-unused-expressions": "error",
    "no-use-before-define": "off",
    "no-useless-call": "error",
    "no-useless-computed-key": "error",
    "no-useless-concat": "off",
    "no-useless-constructor": "error",
    "no-useless-escape": "error",
    "no-useless-rename": "error",
    "no-var": "off",
    "no-void": "error",
    "no-warning-comments": "off",
    "no-whitespace-before-property": "error",
    "no-with": "error",
    "object-curly-newline": "off",
    "object-curly-spacing": "off",
    "object-property-newline": "off",
    "object-shorthand": "off",
    "one-var": "off",
    "one-var-declaration-per-line": "off",
    "operator-assignment": [
      "error",
      "always"
    ],
    "operator-linebreak": "off",
    "padded-blocks": "off",
    "prefer-arrow-callback": "off",
    "prefer-const": "warn",
    "prefer-reflect": "off",
    "prefer-rest-params": "off",
    "prefer-spread": "off",
    "prefer-template": "off",
    "quote-props": "off",
    "quotes": "off",
    "radix": [
      "error",
      "as-needed"
    ],
    "require-jsdoc": "off",
    "rest-spread-spacing": "error",
    "semi": "error",
    "semi-spacing": [
      "error",
      {
        "after": true,
        "before": false
      }
    ],
    "sort-vars": "off",
    "space-before-blocks": "error",
    "space-before-function-paren": "off",
    "space-in-parens": "off",
    "space-infix-ops": "off",
    "space-unary-ops": "error",
    "spaced-comment": "off",
    "strict": [
      "error",
      "never"
    ],
    "template-curly-spacing": "error",
    "unicode-bom": [
      "error",
      "never"
    ],
    "valid-jsdoc": "off",
    "vars-on-top": "off",
    "wrap-regex": "off",
    "yield-star-spacing": "error",
    "yoda": [
      "error",
      "never"
    ]
  }
};
