const selectorParser = require("postcss-selector-parser");

const NTH_NESTED_PSEUDO = ":nth-nested";
const MAX_DEPTH = 50;
const RECURSION_LIMIT = 5;

// Normalizes nth-child-style input into an {a, b} formula so every supported
// spelling can use the same depth-matching path.
function parseNthFormula(rawFormula) {
  const trimmedFormula = rawFormula.trim().toLowerCase();

  if (trimmedFormula === "odd") {
    return { a: 2, b: 1 };
  }

  if (trimmedFormula === "even") {
    return { a: 2, b: 0 };
  }

  if (/^\+?\d{1,2}$/.test(rawFormula)) {
    return { a: 0, b: parseInt(rawFormula) };
  }

  const formulaMatch = /^([+-]?(?:\d+)?)n(?:\s*([+-])\s*(\d+))?$/.exec(
    trimmedFormula,
  );

  if (!formulaMatch) {
    return null;
  }

  const coefficient = formulaMatch[1];
  const a =
    coefficient === "" || coefficient === "+"
      ? 1
      : coefficient === "-"
        ? -1
        : parseInt(coefficient);
  const b = formulaMatch[2]
    ? parseInt(formulaMatch[3]) * (formulaMatch[2] === "-" ? -1 : 1)
    : 0;

  return { a, b };
}

// Keeps the An+B matching rules in one place, including finite negative
// formulas such as -n+3 and exact depths represented as 0n+B.
function doesFormulaMatchDepth(formula, depth) {
  if (formula.a === 0) {
    return depth === formula.b;
  }

  const difference = depth - formula.b;

  return difference % formula.a === 0 && difference / formula.a >= 0;
}

// Expands a formula into concrete depths because the generated CSS has to
// enumerate depth selectors within the plugin's finite 1..99 range.
function getDepthsForFormula(formula) {
  const depths = [];

  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    if (doesFormulaMatchDepth(formula, depth)) {
      depths.push(depth);
    }
  }

  return depths;
}

// Validates that a parser node is a supported top-level :nth-nested(...) call
// and leaves invalid or out-of-range syntax untouched.
function getNthNestedDepths(pseudo) {
  if (pseudo.value !== NTH_NESTED_PSEUDO || pseudo.nodes.length !== 1) {
    return null;
  }

  const formula = parseNthFormula(pseudo.nodes[0].toString());

  if (!formula) {
    return null;
  }

  const depths = getDepthsForFormula(formula);

  return depths.length ? depths : null;
}

// Converts selector-parser nodes back to a selector fragment while preserving
// the meaningful syntax that must be reused in generated ancestor selectors.
function stringifyNodes(nodes) {
  return nodes
    .map((node) => node.toString())
    .join("")
    .trim();
}

// Splits the selector around :nth-nested(...) so the current node selector and
// its container context can be repeated independently in the generated CSS.
function getNodeSelector(selector, pseudoIndex) {
  const nodeStartIndex =
    selector.nodes
      .slice(0, pseudoIndex)
      .map((node) => node.type)
      .lastIndexOf("combinator") + 1;

  return {
    containerSelector: stringifyNodes(selector.nodes.slice(0, nodeStartIndex)),
    nodeSelector: stringifyNodes(
      selector.nodes.slice(nodeStartIndex, pseudoIndex),
    ),
  };
}

// Produces one exact-depth selector with the depth guard inside :where(...) so
// the generated ancestry checks do not add specificity.
function buildDepthReplacementSelector(containerSelector, nodeSelector, depth) {
  const node = nodeSelector || "*";

  if (depth > 1) {
    const correctDepthSelector = `${node} `.repeat(depth);
    const oneLevelTooDeepSelector = `${node} `.repeat(depth + 1);

    const correctDepthInContainer =
      `${containerSelector} ${correctDepthSelector}`.trim();
    const tooDeepInContainer =
      `${containerSelector} ${oneLevelTooDeepSelector}`.trim();

    return `:where(${correctDepthInContainer}:not(${tooDeepInContainer}))`;
  }

  const oneLevelTooDeepSelector = ` ${node}`.repeat(2);
  const tooDeepInContainer =
    `${containerSelector}${oneLevelTooDeepSelector}`.trim();

  return `:where(:not(${tooDeepInContainer}))`;
}

// Collapses "first N" depth ranges into one upper-bound selector, avoiding the
// large :is(...) lists that formulas such as -n+3 would otherwise generate.
function buildFirstDepthsReplacementSelector(
  containerSelector,
  nodeSelector,
  lastDepth,
) {
  const node = nodeSelector || "*";
  const oneLevelTooDeepSelector = `${node} `.repeat(lastDepth + 1);
  const tooDeepInContainer =
    `${containerSelector} ${oneLevelTooDeepSelector}`.trim();

  return `:where(:not(${tooDeepInContainer}))`;
}

// Identifies depth ranges equivalent to "first N" so they can be represented
// as "not one level too deep" instead of enumerating every exact depth.
function getFirstDepthsLimit(depths) {
  if (!depths.length || depths[0] !== 1) {
    return null;
  }

  for (let index = 1; index < depths.length; index++) {
    if (depths[index] !== depths[index - 1] + 1) {
      return null;
    }
  }

  return depths[depths.length - 1];
}

// Keeps single-depth output compact and only wraps in :is(...) when a formula
// expands to multiple depth alternatives.
function buildReplacementSelector(containerSelector, nodeSelector, depths) {
  if (depths.length === 1) {
    return buildDepthReplacementSelector(
      containerSelector,
      nodeSelector,
      depths[0],
    );
  }

  const firstDepthsLimit = getFirstDepthsLimit(depths);

  if (firstDepthsLimit) {
    return buildFirstDepthsReplacementSelector(
      containerSelector,
      nodeSelector,
      firstDepthsLimit,
    );
  }

  return `:is(${depths.map((depth) => buildDepthReplacementSelector(containerSelector, nodeSelector, depth)).join(", ")})`;
}

// Turns generated selector text back into AST nodes so replacements happen
// structurally instead of by brittle string splicing.
function parseReplacementNodes(replacementSelector) {
  return selectorParser()
    .astSync(replacementSelector)
    .nodes[0].nodes.map((node) => node.clone());
}

// Exposes the PostCSS plugin creator and scopes the transform to selectors
// that actually contain the custom pseudo-class.
/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = (/* opts = {} */) => {
  // Work with options here

  return {
    postcssPlugin: "postcss-nth-nested",

    // Walk rules once per stylesheet so every selector list can be parsed,
    // transformed, and written back in a single PostCSS pass.
    Once(root /*, postcss */) {
      root.walkRules((rule) => {
        if (!rule.selector.includes(NTH_NESTED_PSEUDO)) {
          return;
        }

        let remainingReplacements = RECURSION_LIMIT;
        let didReplace = false;

        const transformedSelector = selectorParser((selectors) => {
          selectors.each((selector) => {
            for (
              let index = 0;
              index < selector.nodes.length && remainingReplacements;
              index++
            ) {
              const node = selector.nodes[index];
              const depths =
                node.type === "pseudo" ? getNthNestedDepths(node) : null;

              if (!depths) {
                continue;
              }

              const { containerSelector, nodeSelector } = getNodeSelector(
                selector,
                index,
              );
              const replacementSelector = buildReplacementSelector(
                containerSelector,
                nodeSelector,
                depths,
              );
              const replacementNodes =
                parseReplacementNodes(replacementSelector);

              node.replaceWith(...replacementNodes);
              didReplace = true;
              remainingReplacements--;
              index += replacementNodes.length - 1;
            }
          });
        }).processSync(rule.selector);

        if (didReplace) {
          rule.selector = transformedSelector;
        }
      });
    },

    /*
    Declaration (decl, postcss) {
      // The faster way to find Declaration node
    }
    */

    /*
    Declaration: {
      color: (decl, postcss) {
        // The fastest way find Declaration node if you know property name
      }
    }
    */
  };
};

module.exports.postcss = true;
