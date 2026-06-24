# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-06-24

### Changed

- Refactored selector transformation to use `postcss-selector-parser` instead of ad hoc regular-expression selector tokenization.
- Added regression coverage for selector lists, multiple rules, additional pseudo selectors, spaces inside selector syntax, and nested `:nth-nested(...)` usage inside other pseudo selectors.

### Fixed

- Fixed the browser demo after the selector-parser refactor by loading `postcss-selector-parser` from JSPM and exposing it to the CommonJS plugin through a small `require` shim.
- Fixed selector-list handling so only the selector containing `:nth-nested(...)` contributes to generated depth selectors.
- Fixed selectors containing spaces inside attribute values or functional pseudo selectors.
- Left nested `:nth-nested(...)` usage inside other pseudo selectors unchanged instead of generating invalid CSS.

## [1.0.3] - 2025-05-20

### Changed

- Optimized selector string generation for the `:nth-nested(1)` case without changing the generated CSS.
- Raised the package Node.js engine requirement to `>=15.0.0`.
- Updated the GitHub Actions test matrix to run on Node.js 15 and 20.

## [1.0.2] - 2025-05-09

### Added

- Added a CodePen demo link to the README.

### Changed

- Bumped the package version after the publishing metadata and documentation updates in `1.0.1`.

## [1.0.1] - 2025-05-07

### Added

- Added explicit npm package entry metadata with `main` and `files`.
- Added `prepublishOnly` so `npm test` runs before publishing.
- Expanded the README with installation, PostCSS configuration, and DOM-depth examples.

## [1.0.0] - 2025-04-21

### Added

- Promoted the package to the first stable release.
- Documented the `:nth-nested(n)` selector behavior with list and class-based nesting examples.

## [0.0.1] - 2025-04-21

### Added

- Added the `postcss-nth-nested` package metadata, PostCSS plugin name, keywords, repository metadata, peer dependency on PostCSS 8, and npm dependency metadata.
- Added tests covering invalid syntax, omitted node selectors, compound selectors, nested `:nth-nested(...)` selectors, child combinators, general sibling combinators, adjacent sibling combinators, and the deliberate `99` depth limit.

### Changed

- Renamed the early package/plugin identity from `postcss-nth-scion` to `postcss-nth-nested`.
- Made selector depth 1-indexed: `:nth-nested(1)` now represents a non-nested/top-level match, and `:nth-nested(0)` is ignored as invalid syntax.
- Switched the PostCSS visitor from `Root` to `Once`.
- Updated the browser demo to show generated CSS output.

## [0.0.0] - 2025-04-16

### Added

- Added the initial PostCSS plugin implementation for transforming custom `:nth-nested(n)` selectors into standard CSS using `:where(...)` and `:not(...)`.
- Added a browser demo/REPL in `index.html`.
- Added support for transforming more than one `:nth-nested(...)` occurrence in a selector, guarded by a recursion limit.
- Added tests for invalid syntax, exact depth matching, universal selector fallback, container selectors, combinators, nested pseudo usage, and maximum supported depth.

### Changed

- Refactored selector matching into named regular expressions and improved test coverage.
- Tidied tests and removed debug logging from the early implementation.
