# postcss-nth-nested

PostCSS plugin to handle a custom `:nth-nested(n)` descendent depth selector syntax.

## Installation

```bash
npm install postcss-nth-nested --save-dev
```

## Usage

Add it to your PostCSS config:

```js
// CommonJS
module.exports = {
  plugins: [require("postcss-nth-nested")],
};

// ES Modules
export default {
  plugins: [(await import("postcss-nth-nested")).default],
};
```

## What it does

Use this to select elements by their depth in the DOM. This is not the same as [CSS Nested Rules](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting).

Eg:

- `li:nth-nested(2)` will select the `<li>` that is 2 levels deep in a nested list:

  ```html
  <ul>
    <li>
      <ul>
        <li>
          This one
          <ul>
            <li></li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
  ```

- `.foo:nth-nested(3)` will select any `.foo` element that is 3 levels deep, i.e. it has 2 `.foo` ancestors above it in the DOM:
  ```html
  <ul>
    <li>
      <ul class="foo">
        <li class="foo">
          <ul>
            <li class="foo">This one</li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
  ```

## How does it work?

This plugin rewrites the selector using `:where` and `:not` to something much more verbose but well supported:

### Examples:

Selector for nested elements by tag name...

`li:nth-nested(2) > .text { background-color: lime }`

becomes...

`li:where(li li):not(li li li) > .text { background-color: lime }`

---

Selector for nested elements by classname...

`div.foo:nth-nested(4) > p { margin: 0 }`

becomes...

`div.foo:where(div.foo div.foo div.foo div.foo):not(div.foo div.foo div.foo div.foo div.foo) > p { margin: 0 }`

☝️ This is interesting and open to debate because it [has to] behave differently from the `nth-child()` selector to be useful. Arguably there's room for more explicit selctors like`nth-nested-child()` and `nth-nested-of-type()` that would match elements in a similar way to the established `nth-` selectors.
