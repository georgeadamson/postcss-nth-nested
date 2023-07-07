// Regex to match valid :nth-nested(n) selector: (With arbitrary limit of :nth-nested(99))
const reSelectorHasNthNested = /:nth-nested\((\d{1,2})\)/;

/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = (/* opts = {} */) => {
  // Work with options here

  return {
    postcssPlugin: 'postcss-nth-nested',

    Root (root /*, postcss */) {
      root.walkRules(reSelectorHasNthNested, (rule) => {
        let safetyLimit = 5; // Abitrary limit just to protect from multiple nth-nested stupidity

        while (reSelectorHasNthNested.test(rule.selector) && safetyLimit--) {
          // Tokenise the selector into the parts we need to produce a valid equivalent selector:
          // Eg: ".foo .bar li:nth-nested(2)" >>> ['.foo .bar li:nth-nested(2)', '.foo .bar', 'li', ':nth-nested(2)', '2']
          // Regex parts:                container↓    node↓    pseudo↓    depth↓
          const matches = rule.selector.match(/^(.*?)([^>~+\s]*)(:nth-nested\((\d*)\))/);
          const [, containerSelector = "", nodeSelector = "*", pseudoSelector, depthString] = matches || [];
          const depth = Math.max(0, depthString || 0);

          console.log(rule.selector, nodeSelector);
          // console.log({ containerSelector, nodeSelector, pseudoSelector, depth });

          if (depth < 1) {
            // Zero means don't allow nesting at all, and we can use a less verbose selector:
            const oneLevelTooDeepSelector = `${nodeSelector || "*"} `.repeat(2).trim();
            const tooDeepInContainer = `${containerSelector.trim()} ${oneLevelTooDeepSelector}`.trim();
            rule.selector = rule.selector.replace(pseudoSelector, `:not(${tooDeepInContainer})`);
          } else {
            const correctDepthSelector = `${nodeSelector || "*"} `.repeat(depth + 1);
            const oneLevelTooDeepSelector = `${nodeSelector || "*"} `.repeat(depth + 2);

            const correctDepthInContainer = `${containerSelector.trim()} ${correctDepthSelector}`.trim();
            const tooDeepInContainer = `${containerSelector.trim()} ${oneLevelTooDeepSelector}`.trim();
            const validNestedSelectorSyntax = `:where(${correctDepthInContainer}):not(${tooDeepInContainer})`;
            rule.selector = rule.selector.replace(pseudoSelector, validNestedSelectorSyntax);
          }
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
