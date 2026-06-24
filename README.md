# postcss-nth-nested

PostCSS plugin for selecting elements by how deeply they are nested in matching ancestor elements.

It adds a custom `:nth-nested(n)` selector and rewrites it to standard CSS using `:where(...)` and `:not(...)`.

```css
/* Input */
li:nth-nested(2) > .text {
  background-color: lime;
}

/* Output */
li:where(li li):not(li li li) > .text {
  background-color: lime;
}
```

[Try the demo on CodePen](https://codepen.io/georgeadamson/pen/QWJyjRv).

## When to use it

Use this when your markup contains recursive or repeated nested structures, such as menus, trees, comments, or nested lists, and you want CSS for an exact depth.

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
li:not(li li) {
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
li:where(li li):not(li li li) > .text {
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
.item:where(.item .item .item):not(.item .item .item .item) {
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
.menu li:where(.menu li li):not(.menu li li li) {
  padding-left: 2rem;
}
```

## Supported syntax

The plugin transforms `:nth-nested(n)` where `n` is an integer from `1` to `99`.

Invalid or unsupported forms are left unchanged:

```css
li:nth-nested(0) {}
li:nth-nested(100) {}
li:nth-nested(a) {}
li:nth-nested(1.5) {}
```

The selector before `:nth-nested(...)` is reused as the repeated nesting selector. If no selector is provided, `*` is used:

```css
:nth-nested(2) {}
```

becomes:

```css
:where(* *):not(* * *) {}
```

## Browser support

The generated CSS relies on `:where(...)` and `:not(...)`. Check that your target browsers support those selectors before using the plugin in production.

## Notes

This plugin runs at build time. Browsers do not understand `:nth-nested(...)` directly; your CSS must be processed by PostCSS before it is served.
