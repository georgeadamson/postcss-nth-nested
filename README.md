# postcss-nth-nested

PostCSS plugin to handle a custom `:nth-nested(n)` descendent depth selector syntax.

Eg:

- `li:nth-nested(2)` would select the `<li>` that is two levels deep in a nested list.
- `.foo:nth-nested(4)` would select any `.foo` element that has three `.foo` ancestors above it in the DOM.

### How does it work?

This plugin rewrites the selector using `:where` and `:not` to something much more verbose but well supported:

## Examples:

`li:nth-nested(2) > .text { background-color: lime }`

becomes...

`li:where(li li):not(li li li) > span { background-color: lime }`

---

`div.foo:nth-nested(4) > p { margin: 0 }`

becomes...

`div.foo:where(div.foo div.foo div.foo div.foo):not(div.foo div.foo div.foo div.foo div.foo) > p { margin: 0 }`
