const postcss = require('postcss')

const plugin = require('./')

async function run (input, output, opts = {}) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

function expectedDepthSelector(depth, nodeSelector = 'li', containerSelector = '') {
  const node = nodeSelector || '*';

  if (depth > 1) {
    const correctDepthSelector = `${node} `.repeat(depth);
    const oneLevelTooDeepSelector = `${node} `.repeat(depth + 1);

    return `:where(${`${containerSelector} ${correctDepthSelector}`.trim()}:not(${`${containerSelector} ${oneLevelTooDeepSelector}`.trim()}))`;
  }

  return `:where(:not(${`${containerSelector}${` ${node}`.repeat(2)}`.trim()}))`;
}

function expectedFormulaSelector(depths, nodeSelector, containerSelector) {
  return `:is(${depths.map((depth) => expectedDepthSelector(depth, nodeSelector, containerSelector)).join(', ')})`;
}

function range(from, to, step = 1) {
  const values = [];

  for (let value = from; value <= to; value += step) {
    values.push(value);
  }

  return values;
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
  await run('li:nth-nested(n+100) { }', 'li:nth-nested(n+100) { }');
})

it('should generate simpler syntax for 1 depth', async () => {
  await run('li:nth-nested(1) { }', `li${expectedDepthSelector(1)} { }`);
  await run('.foo .bar li:nth-nested(1) { }', `.foo .bar li${expectedDepthSelector(1, 'li', '.foo .bar')} { }`);
})

it('should generate selector n deep', async () => {
  await run('li:nth-nested(2) { }', `li${expectedDepthSelector(2)} { }`);
  await run('li:nth-nested(+2) { }', `li${expectedDepthSelector(2)} { }`);
  await run('li:nth-nested(3) { }', `li${expectedDepthSelector(3)} { }`);
})

it('should generate selector for odd and even depth keywords', async () => {
  await run('li:nth-nested(odd) { }', `li${expectedFormulaSelector(range(1, 99, 2))} { }`);
  await run('li:nth-nested(even) { }', `li${expectedFormulaSelector(range(2, 98, 2))} { }`);
})

it('should generate selector for positive An+B depth syntax', async () => {
  await run('li:nth-nested(2n+1) { }', `li${expectedFormulaSelector(range(1, 99, 2))} { }`);
  await run('li:nth-nested(n+3) { }', `li${expectedFormulaSelector(range(3, 99))} { }`);
})

it('should generate selector for signed and finite An+B depth syntax', async () => {
  await run('li:nth-nested(-n+3) { }', `li${expectedFormulaSelector([1, 2, 3])} { }`);
  await run('li:nth-nested(-2n+5) { }', `li${expectedFormulaSelector([1, 3, 5])} { }`);
  await run('li:nth-nested(+3n - 2) { }', `li${expectedFormulaSelector(range(1, 97, 3))} { }`);
})

it('should generate selector for zero coefficient An+B depth syntax', async () => {
  await run('li:nth-nested(0n+2) { }', `li${expectedDepthSelector(2)} { }`);
})

it('should generate selector using univeral "*" when node selector omitted', async () => {
  await run(':nth-nested(1) { }', `${expectedDepthSelector(1, '')} { }`);
  await run(':nth-nested(2) { }', `${expectedDepthSelector(2, '')} { }`);
  await run('*:nth-nested(2) { }', `*${expectedDepthSelector(2, '*')} { }`);
})

it('should generate selector reusing the specific node selector syntax', async () => {
  await run('.foo#bar:nth-nested(2) { }', `.foo#bar${expectedDepthSelector(2, '.foo#bar')} { }`);
  await run('foo[data-bar]:nth-nested(2) { }', `foo[data-bar]${expectedDepthSelector(2, 'foo[data-bar]')} { }`);
})

it('should generate selector n deep in container selector', async () => {
  await run('.foo .bar li:nth-nested(2) { }', `.foo .bar li${expectedDepthSelector(2, 'li', '.foo .bar')} { }`);
  await run('.foo ul .item:nth-nested(2) { }', `.foo ul .item${expectedDepthSelector(2, '.item', '.foo ul')} { }`);
})

it('should generate selector independently within selector lists', async () => {
  await run('a, li:nth-nested(2) { }', `a, li${expectedDepthSelector(2)} { }`);
  await run('li:nth-nested(2), .foo { }', `li${expectedDepthSelector(2)}, .foo { }`);
})

it('should preserve other rules when processing multiple rules', async () => {
  await run('li:nth-nested(2) { color: red }\na { color: blue }', `li${expectedDepthSelector(2)} { color: red }\na { color: blue }`);
})

it('should generate selector when other pseudo selectors are present', async () => {
  await run('.foo:is(.bar, .baz) li:nth-nested(2) { }', `.foo:is(.bar, .baz) li${expectedDepthSelector(2, 'li', '.foo:is(.bar, .baz)')} { }`);
  await run('li:nth-nested(2):hover { }', `li${expectedDepthSelector(2)}:hover { }`);
  await run('li:hover:nth-nested(2) { }', `li:hover${expectedDepthSelector(2, 'li:hover')} { }`);
})

it('should generate selector for node selectors containing spaces inside syntax', async () => {
  await run('li[data-label="A B"]:nth-nested(2) { }', `li[data-label="A B"]${expectedDepthSelector(2, 'li[data-label="A B"]')} { }`);
  await run('.foo:is(.bar, .baz):nth-nested(2) { }', `.foo:is(.bar, .baz)${expectedDepthSelector(2, '.foo:is(.bar, .baz)')} { }`);
})

it('should not generate selector when nth-nested is inside another pseudo selector', async () => {
  await run(':not(:nth-nested(2)) { }', ':not(:nth-nested(2)) { }');
})

it('should generate selector honouring child selectors', async () => {
  await run('.foo>li:nth-nested(2) { }', `.foo>li${expectedDepthSelector(2, 'li', '.foo>')} { }`);
  await run('.foo> li:nth-nested(2) { }', `.foo> li${expectedDepthSelector(2, 'li', '.foo>')} { }`);
  await run('.foo > li:nth-nested(2) { }', `.foo > li${expectedDepthSelector(2, 'li', '.foo >')} { }`);
})

it('should generate selector honouring general sibling selectors', async () => {
  await run('.foo~li:nth-nested(2) { }', `.foo~li${expectedDepthSelector(2, 'li', '.foo~')} { }`);
  await run('.foo~ li:nth-nested(2) { }', `.foo~ li${expectedDepthSelector(2, 'li', '.foo~')} { }`);
  await run('.foo ~ li:nth-nested(2) { }', `.foo ~ li${expectedDepthSelector(2, 'li', '.foo ~')} { }`);
})

it('should generate selector honouring adjacent sibling selectors', async () => {
  await run('.foo+li:nth-nested(2) { }', `.foo+li${expectedDepthSelector(2, 'li', '.foo+')} { }`);
  await run('.foo+ li:nth-nested(2) { }', `.foo+ li${expectedDepthSelector(2, 'li', '.foo+')} { }`);
  await run('.foo + li:nth-nested(2) { }', `.foo + li${expectedDepthSelector(2, 'li', '.foo +')} { }`);
})

it('should generate selector honouring nested nth-nested selectors. #silly!', async () => {
  const firstReplacement = expectedDepthSelector(2, '.bar', '.foo');
  await run('.foo .bar:nth-nested(2) li:nth-nested(2) { }', `.foo .bar${firstReplacement} li${expectedDepthSelector(2, 'li', `.foo .bar${firstReplacement}`)} { }`);
})

it('should generate selector no more than 99 deep', async () => {
  await run('li:nth-nested(99) { }', `li${expectedDepthSelector(99)} { }`);
  await run('li:nth-nested(100) { }', 'li:nth-nested(100) { }'); // Over 99 deliberately ignored
})
