const selectorParser = require('postcss-selector-parser');

const NTH_NESTED_PSEUDO = ':nth-nested';
const MAX_DEPTH = 99;
const RECURSION_LIMIT = 5;

function getNthNestedDepth(pseudo) {
  if (pseudo.value !== NTH_NESTED_PSEUDO || pseudo.nodes.length !== 1) {
    return null;
  }

  const depthString = pseudo.nodes[0].toString();
  const depth = parseInt(depthString);

  if (!/^\d{1,2}$/.test(depthString) || depth < 1 || depth > MAX_DEPTH) {
    return null;
  }

  return depth;
}

function stringifyNodes(nodes) {
  return nodes.map((node) => node.toString()).join('').trim();
}

function getNodeSelector(selector, pseudoIndex) {
  const nodeStartIndex = selector.nodes
    .slice(0, pseudoIndex)
    .map((node) => node.type)
    .lastIndexOf('combinator') + 1;

  return {
    containerSelector: stringifyNodes(selector.nodes.slice(0, nodeStartIndex)),
    nodeSelector: stringifyNodes(selector.nodes.slice(nodeStartIndex, pseudoIndex))
  };
}

function buildReplacementSelector(containerSelector, nodeSelector, depth) {
  const node = nodeSelector || '*';

  if (depth > 1) {
    const correctDepthSelector = `${node} `.repeat(depth);
    const oneLevelTooDeepSelector = `${node} `.repeat(depth + 1);

    const correctDepthInContainer = `${containerSelector} ${correctDepthSelector}`.trim();
    const tooDeepInContainer = `${containerSelector} ${oneLevelTooDeepSelector}`.trim();

    return `:where(${correctDepthInContainer}):not(${tooDeepInContainer})`;
  }

  const oneLevelTooDeepSelector = ` ${node}`.repeat(2);
  const tooDeepInContainer = `${containerSelector}${oneLevelTooDeepSelector}`.trim();

  return `:not(${tooDeepInContainer})`;
}

function parseReplacementNodes(replacementSelector) {
  return selectorParser()
    .astSync(replacementSelector)
    .nodes[0]
    .nodes
    .map((node) => node.clone());
}

/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = (/* opts = {} */) => {
  // Work with options here

  return {
    postcssPlugin: 'postcss-nth-nested',

    Once(root /*, postcss */) {
      root.walkRules((rule) => {
        if (!rule.selector.includes(NTH_NESTED_PSEUDO)) {
          return;
        }

        let remainingReplacements = RECURSION_LIMIT;
        let didReplace = false;

        const transformedSelector = selectorParser((selectors) => {
          selectors.each((selector) => {
            for (let index = 0; index < selector.nodes.length && remainingReplacements; index++) {
              const node = selector.nodes[index];
              const depth = node.type === 'pseudo' ? getNthNestedDepth(node) : null;

              if (!depth) {
                continue;
              }

              const { containerSelector, nodeSelector } = getNodeSelector(selector, index);
              const replacementSelector = buildReplacementSelector(containerSelector, nodeSelector, depth);
              const replacementNodes = parseReplacementNodes(replacementSelector);

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
    }


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
  }
}

module.exports.postcss = true
