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
li:is(:where(:not(li li)), :where(li li:not(li li li)), :where(li li li:not(li li li li))) > .text {
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

The plugin transforms `:nth-nested(...)` values that match one or more nesting depths from `1` to `99`.

Supported values follow `:nth-child(...)`-style `An+B` syntax:

- integers from `1` to `99`, such as `1`, `2`, or `99`
- `odd` and `even`
- `An+B` formulas, such as `2n+1`, `3n`, `n+3`, `-n+3`, or `-2n+5`

Depth is still capped at `99`. A formula that only matches depths outside that range is left unchanged.

Invalid or unsupported forms are left unchanged:

```css
li:nth-nested(0) {}
li:nth-nested(100) {}
li:nth-nested(n+100) {}
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

Broad `An+B` formulas can generate very large selectors because the plugin expands every matching depth up to `99`. For example, `:nth-nested(odd)` expands to every odd depth from `1` through `99`. Prefer exact depths or narrow finite formulas when possible, and check the generated CSS size before using broad formulas in production.

## Browser support

The generated CSS relies on `:where(...)`, `:not(...)`, and, for `An+B` formulas that match multiple depths, `:is(...)`. Depth guards are kept inside `:where(...)` so generated ancestry checks do not add specificity. Check that your target browsers support those selectors before using the plugin in production.

## Notes

This plugin runs at build time. Browsers do not understand `:nth-nested(...)` directly; your CSS must be processed by PostCSS before it is served.
