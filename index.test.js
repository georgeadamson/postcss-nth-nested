const postcss = require('postcss')

const plugin = require('./')

async function run (input, output, opts = {}) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

it('should not generate selector when syntax looks invalid', async () => {
  await run('li nth-nested() { }', 'li nth-nested() { }');
  await run('li:nth-nested { }', 'li:nth-nested { }');
  await run('li:nth-nested() { }', 'li:nth-nested() { }');
  await run('li:nth-nested( ) { }', 'li:nth-nested( ) { }');
  await run('li:nth-nested(0) { }', 'li:nth-nested(0) { }');
  await run('li:nth-nested(a) { }', 'li:nth-nested(a) { }');
  await run('li:nth-nested(1 ) { }', 'li:nth-nested(1 ) { }');
  await run('li:nth-nested (1) { }', 'li:nth-nested (1) { }');
  await run('li:nth-nested(-1) { }', 'li:nth-nested(-1) { }');
})

it('should generate simpler syntax for 1 depth', async () => {
  await run('li:nth-nested(1) { }', 'li:not(li li) { }');
  await run('.foo .bar li:nth-nested(1) { }', '.foo .bar li:not(.foo .bar li li) { }');
})

it('should generate selector n deep', async () => {
  await run('li:nth-nested(2) { }', 'li:where(li li):not(li li li) { }');
  await run('li:nth-nested(3) { }', 'li:where(li li li):not(li li li li) { }');
})

it('should generate selector using univeral "*" when node selector omitted', async () => {
  await run(':nth-nested(1) { }', ':not(* *) { }');
  await run(':nth-nested(2) { }', ':where(* *):not(* * *) { }');
  await run('*:nth-nested(2) { }', '*:where(* *):not(* * *) { }');
})

it('should generate selector reusing the specific node selector syntax', async () => {
  await run('.foo#bar:nth-nested(2) { }', '.foo#bar:where(.foo#bar .foo#bar):not(.foo#bar .foo#bar .foo#bar) { }');
  await run('foo[data-bar]:nth-nested(2) { }', 'foo[data-bar]:where(foo[data-bar] foo[data-bar]):not(foo[data-bar] foo[data-bar] foo[data-bar]) { }');
})

it('should generate selector n deep in container selector', async () => {
  await run('.foo .bar li:nth-nested(2) { }', '.foo .bar li:where(.foo .bar li li):not(.foo .bar li li li) { }');
  await run('.foo ul .item:nth-nested(2) { }', '.foo ul .item:where(.foo ul .item .item):not(.foo ul .item .item .item) { }');
})

it('should generate selector independently within selector lists', async () => {
  await run('a, li:nth-nested(2) { }', 'a, li:where(li li):not(li li li) { }');
  await run('li:nth-nested(2), .foo { }', 'li:where(li li):not(li li li), .foo { }');
})

it('should preserve other rules when processing multiple rules', async () => {
  await run('li:nth-nested(2) { color: red }\na { color: blue }', 'li:where(li li):not(li li li) { color: red }\na { color: blue }');
})

it('should generate selector when other pseudo selectors are present', async () => {
  await run('.foo:is(.bar, .baz) li:nth-nested(2) { }', '.foo:is(.bar, .baz) li:where(.foo:is(.bar, .baz) li li):not(.foo:is(.bar, .baz) li li li) { }');
  await run('li:nth-nested(2):hover { }', 'li:where(li li):not(li li li):hover { }');
  await run('li:hover:nth-nested(2) { }', 'li:hover:where(li:hover li:hover):not(li:hover li:hover li:hover) { }');
})

it('should generate selector for node selectors containing spaces inside syntax', async () => {
  await run('li[data-label="A B"]:nth-nested(2) { }', 'li[data-label="A B"]:where(li[data-label="A B"] li[data-label="A B"]):not(li[data-label="A B"] li[data-label="A B"] li[data-label="A B"]) { }');
  await run('.foo:is(.bar, .baz):nth-nested(2) { }', '.foo:is(.bar, .baz):where(.foo:is(.bar, .baz) .foo:is(.bar, .baz)):not(.foo:is(.bar, .baz) .foo:is(.bar, .baz) .foo:is(.bar, .baz)) { }');
})

it('should not generate selector when nth-nested is inside another pseudo selector', async () => {
  await run(':not(:nth-nested(2)) { }', ':not(:nth-nested(2)) { }');
})

it('should generate selector honouring child selectors', async () => {
  await run('.foo>li:nth-nested(2) { }', '.foo>li:where(.foo> li li):not(.foo> li li li) { }');
  await run('.foo> li:nth-nested(2) { }', '.foo> li:where(.foo> li li):not(.foo> li li li) { }');
  await run('.foo > li:nth-nested(2) { }', '.foo > li:where(.foo > li li):not(.foo > li li li) { }');
})

it('should generate selector honouring general sibling selectors', async () => {
  await run('.foo~li:nth-nested(2) { }', '.foo~li:where(.foo~ li li):not(.foo~ li li li) { }');
  await run('.foo~ li:nth-nested(2) { }', '.foo~ li:where(.foo~ li li):not(.foo~ li li li) { }');
  await run('.foo ~ li:nth-nested(2) { }', '.foo ~ li:where(.foo ~ li li):not(.foo ~ li li li) { }');
})

it('should generate selector honouring adjacent sibling selectors', async () => {
  await run('.foo+li:nth-nested(2) { }', '.foo+li:where(.foo+ li li):not(.foo+ li li li) { }');
  await run('.foo+ li:nth-nested(2) { }', '.foo+ li:where(.foo+ li li):not(.foo+ li li li) { }');
  await run('.foo + li:nth-nested(2) { }', '.foo + li:where(.foo + li li):not(.foo + li li li) { }');
})

it('should generate selector honouring nested nth-nested selectors. #silly!', async () => {
  await run('.foo .bar:nth-nested(2) li:nth-nested(2) { }', '.foo .bar:where(.foo .bar .bar):not(.foo .bar .bar .bar) li:where(.foo .bar:where(.foo .bar .bar):not(.foo .bar .bar .bar) li li):not(.foo .bar:where(.foo .bar .bar):not(.foo .bar .bar .bar) li li li) { }');
})

it('should generate selector no more than 99 deep', async () => {
  await run('li:nth-nested(99) { }', `li:where(${'li '.repeat(99).trim()}):not(${'li '.repeat(100).trim()}) { }`);
  await run('li:nth-nested(100) { }', 'li:nth-nested(100) { }'); // Over 99 deliberately ignored
})
