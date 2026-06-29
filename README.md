# postcss-nth-nested

PostCSS plugin for selecting elements by how deeply they are nested in matching ancestor elements.

It adds a custom `:nth-nested(...)` selector and rewrites it to standard CSS using `:where(...)`, `:not(...)`, and `:is(...)`.

```css
/* Input */
li:nth-nested(2) > .text {
  background-color: lime;
}

/* Output */
li:where(li li:not(li li li)) > .text {
  background-color: lime;
}
```

Try the [Demo](https://georgeadamson.github.io/postcss-nth-nested/).

Or tinker with the [demo on CodePen](https://codepen.io/georgeadamson/pen/QWJyjRv).

## When to use it

Use this when your markup contains recursive or repeated nested structures, such as menus, trees, comments, or nested lists, and you want CSS for an exact depth or repeating depth pattern.

For example, `li:nth-nested(2)` matches the second-level `li` here:

```html
<ul>
  <li>
    Depth 1
    <ul>
      <li>
        Depth 2
        <ul>
          <li>Depth 3</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>
```

Depth is 1-indexed:

- `:nth-nested(1)` matches elements that are not nested inside another matching element.
- `:nth-nested(2)` matches elements nested inside one matching ancestor.
- `:nth-nested(3)` matches elements nested inside two matching ancestors.

This is not CSS nesting, and it is not the same as `:nth-child(...)`. It is about matching ancestor depth.

## Install

Install the plugin alongside PostCSS:

```bash
npm install --save-dev postcss postcss-nth-nested
```

Or with another package manager:

```bash
pnpm add -D postcss postcss-nth-nested
yarn add -D postcss postcss-nth-nested
```

## Configure PostCSS

Add the plugin to your PostCSS config.

CommonJS:

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-nth-nested')
  ]
};
```

ES modules:

```js
// postcss.config.mjs
import nthNested from 'postcss-nth-nested';

export default {
  plugins: [
    nthNested()
  ]
};
```

If your build tool uses a `postcss` field in `package.json`, use:

```json
{
  "postcss": {
    "plugins": {
      "postcss-nth-nested": {}
    }
  }
}
```

## Options

### `maxDepth`

Type: `number`

Default: `20`

Sets the highest nesting depth the plugin will generate selectors for. Values must be positive integers; invalid values fall back to the default.

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-nth-nested')({ maxDepth: 75 })
  ]
};
```

```js
// postcss.config.mjs
import nthNested from 'postcss-nth-nested';

export default {
  plugins: [
    nthNested({ maxDepth: 75 })
  ]
};
```

## Examples

Select only the top-level list item:

```css
li:nth-nested(1) {
  font-weight: bold;
}
```

Generated CSS:

```css
li:where(:not(li li)) {
  font-weight: bold;
}
```

Select exactly second-level list item text:

```css
li:nth-nested(2) > .text {
  background-color: lime;
}
```

Generated CSS:

```css
li:where(li li:not(li li li)) > .text {
  background-color: lime;
}
```

Select `.item` elements at the third `.item` nesting level:

```css
.item:nth-nested(3) {
  color: rebeccapurple;
}
```

Generated CSS:

```css
.item:where(.item .item .item:not(.item .item .item .item)) {
  color: rebeccapurple;
}
```

Select the first three list item nesting levels using `An+B` syntax:

```css
li:nth-nested(-n+3) > .text {
  color: rebeccapurple;
}
```

Generated CSS:

```css
li:where(:not(li li li li)) > .text {
  color: rebeccapurple;
}
```

Use a container selector:

```css
.menu li:nth-nested(2) {
  padding-left: 2rem;
}
```

Generated CSS:

```css
.menu li:where(.menu li li:not(.menu li li li)) {
  padding-left: 2rem;
}
```

## Supported syntax

The plugin transforms `:nth-nested(...)` values that match one or more nesting depths from `1` to `20` by default.

Supported values follow `:nth-child(...)`-style `An+B` syntax:

- integers from `1` to `20`, such as `1`, `2`, or `20`
- `odd` and `even`
- `An+B` formulas, such as `2n+1`, `3n`, `n+3`, `-n+3`, or `-2n+5`

Depth is capped at `20` by default. A formula that only matches depths outside the configured range is left unchanged.

Contiguous first-depth formulas such as `-n+3` are optimized to a single upper-bound selector instead of being expanded into every exact depth.

Invalid or unsupported forms are left unchanged:

```css
li:nth-nested(0) {}
li:nth-nested(21) {}
li:nth-nested(n+21) {}
li:nth-nested(a) {}
li:nth-nested(1.5) {}
```

The selector before `:nth-nested(...)` is reused as the repeated nesting selector. If no selector is provided, `*` is used:

```css
:nth-nested(2) {}
```

becomes:

```css
:where(* *:not(* * *)) {}
```

## Selector size warning

Broad `An+B` formulas can generate very large selectors because the plugin expands every matching depth up to the configured `maxDepth`. Contiguous first-depth formulas such as `-n+3` are optimized, but formulas like `:nth-nested(odd)` still expand to every odd depth up to `maxDepth`. Prefer exact depths or narrow finite formulas when possible, and check the generated CSS size before using broad formulas in production.

## Browser support

The generated CSS relies on `:where(...)`, `:not(...)`, and, for `An+B` formulas that match multiple depths, `:is(...)`. Depth guards are kept inside `:where(...)` so generated ancestry checks do not add specificity. Check that your target browsers support those selectors before using the plugin in production.

## Notes

This plugin runs at build time. Browsers do not understand `:nth-nested(...)` directly; your CSS must be processed by PostCSS before it is served.
