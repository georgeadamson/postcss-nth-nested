const postcss = require('postcss')

const plugin = require('./')

async function run (input, output, opts = { }) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

it('should not generate selector when syntax looks invalid', async () => {
  await run('li:nth-nested() { }', 'li:nth-nested() { }', { });
  await run('li:nth-nested(a) { }', 'li:nth-nested(a) { }', { });
  await run('li:nth-nested (1) { }', 'li:nth-nested (1) { }', { });
})

it('should generate reduuced syntax for 0 depth', async () => {
  await run('li:nth-nested(0) { }', 'li:not(li li) { }', { });
  await run('.foo .bar li:nth-nested(0) { }', '.foo .bar li:not(.foo .bar li li) { }', { });
})

it('should generate selector n deep', async () => {
  await run('li:nth-nested(1) { }', 'li:where(li li):not(li li li) { }', { });
  await run('li:nth-nested(2) { }', 'li:where(li li li):not(li li li li) { }', { });
})

it('should generate selector using univeral "*" when node selector omitted', async () => {
  await run(':nth-nested(0) { }', ':not(* *) { }', { });
  await run(':nth-nested(1) { }', ':where(* *):not(* * *) { }', { });
})

it('should generate selector n deep in container selector', async () => {
  await run('.foo .bar li:nth-nested(1) { }', '.foo .bar li:where(.foo .bar li li):not(.foo .bar li li li) { }', { });
})

it('should generate selector honouring child & sibling selectors', async () => {
  await run('.foo>li:nth-nested(1) { }', '.foo>li:where(.foo> li li):not(.foo> li li li) { }', { });
  await run('.foo> li:nth-nested(1) { }', '.foo> li:where(.foo> li li):not(.foo> li li li) { }', { });
  await run('.foo > li:nth-nested(1) { }', '.foo > li:where(.foo > li li):not(.foo > li li li) { }', { });

  await run('.foo~li:nth-nested(1) { }', '.foo~li:where(.foo~ li li):not(.foo~ li li li) { }', { });
  await run('.foo~ li:nth-nested(1) { }', '.foo~ li:where(.foo~ li li):not(.foo~ li li li) { }', { });
  await run('.foo ~ li:nth-nested(1) { }', '.foo ~ li:where(.foo ~ li li):not(.foo ~ li li li) { }', { });

  await run('.foo+li:nth-nested(1) { }', '.foo+li:where(.foo+ li li):not(.foo+ li li li) { }', { });
  await run('.foo+ li:nth-nested(1) { }', '.foo+ li:where(.foo+ li li):not(.foo+ li li li) { }', { });
  await run('.foo + li:nth-nested(1) { }', '.foo + li:where(.foo + li li):not(.foo + li li li) { }', { });
})

