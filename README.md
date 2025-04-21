# postcss-nth-nested

PostCSS plugin to handle a custom `:nth-nested(n)` descendent depth selector syntax.

Eg:

- `li:nth-nested(2)` would select the `<li>` that is two levels deep in a nested list.
- `.foo:nth-nested(4)` would select any `.foo` element that has three `.foo` ancestors elements above it in the DOM.
