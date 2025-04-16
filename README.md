# postcss-nth-nested

[PostCSS] plugin for :nth-nested(n) descendent depth selector.

[PostCSS]: https://github.com/postcss/postcss

```css
/* Input example */
.menu li:nth-nested(2) {
  padding: 5px;
}
```

```css
/* Output example */
.menu li:where(li li li):not(.menu li li li li) {
  padding: 5px;
}
```

The resulting CSS is compatible with browsers that support [:where()](https://caniuse.com/mdn-css_selectors_where) and :not().
The deeper the nesting, the longer the syntax.

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-nth-nested
```

**Step 2:** Check your project for PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

**Step 3:** Add the plugin to your plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-nth-nested'),
    require('autoprefixer')
  ]
}
```

[official docs]: https://github.com/postcss/postcss#usage
