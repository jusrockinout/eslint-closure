/**
 * @fileoverview This option sets a specific indent width for your code.
 *
 * This rule has been ported and modified from ESLint.
 * @author Vitaly Puzrin
 * @author Gyandeep Singh
 * @author Joe Schafer
 */

goog.module('googlejs.rules.indent');


/**
 * Information about the indentation preceeding a Node.
 * @record
 */
const IndentInfo = function() {};

/**
 * The number of spaces preceding a Node.
 * @type {number}
 */
IndentInfo.prototype.space;

/**
 * The number of tabs preceding a Node.
 * @type {number}
 */
IndentInfo.prototype.tab;

/**
 * The number of the desired indentation character preceding a node.  If a user
 * selected 'spaces' for indentation, `goodChar` is the number of spaces.
 * @type {number}
 */
IndentInfo.prototype.goodChar;

/**
 * The number of unwanted indentation characters preceding a node.  If a user
 * selected 'spaces' for indentation, `badChar` is the number of tabs.
 * @type {number}
 */
IndentInfo.prototype.badChar;

function create(context) {
  const DEFAULT_VARIABLE_INDENT = 1;
  // For backwards compatibility, don't check parameter indentation unless
  // specified in the config
  const DEFAULT_PARAMETER_INDENT = null;
  const DEFAULT_FUNCTION_BODY_INDENT = 1;

  let indentType = 'space';
  let indentSize = 4;
  const options = {
    SwitchCase: 0,
    VariableDeclarator: {
      var: DEFAULT_VARIABLE_INDENT,
      let: DEFAULT_VARIABLE_INDENT,
      const: DEFAULT_VARIABLE_INDENT,
    },
    outerIIFEBody: null,
    FunctionDeclaration: {
      parameters: DEFAULT_PARAMETER_INDENT,
      body: DEFAULT_FUNCTION_BODY_INDENT,
    },
    FunctionExpression: {
      parameters: DEFAULT_PARAMETER_INDENT,
      body: DEFAULT_FUNCTION_BODY_INDENT,
    },
  };

  /** @type {!ESLint.SourceCode} */
  const sourceCode = context.getSourceCode();

  if (context.options.length) {
    if (context.options[0] === 'tab') {
      indentSize = 1;
      indentType = 'tab';
    } else if (typeof context.options[0] === 'number') {
      indentSize = context.options[0];
      indentType = 'space';
    }

    if (context.options[1]) {
      const opts = context.options[1];

      options.SwitchCase = opts.SwitchCase || 0;
      const variableDeclaratorRules = opts.VariableDeclarator;

      if (typeof variableDeclaratorRules === 'number') {
        options.VariableDeclarator = {
          var: variableDeclaratorRules,
          let: variableDeclaratorRules,
          const: variableDeclaratorRules,
        };
      } else if (typeof variableDeclaratorRules === 'object') {
        Object.assign(options.VariableDeclarator, variableDeclaratorRules);
      }

      if (typeof opts.outerIIFEBody === 'number') {
        options.outerIIFEBody = opts.outerIIFEBody;
      }

      if (typeof opts.MemberExpression === 'number') {
        options.MemberExpression = opts.MemberExpression;
      }

      if (typeof opts.FunctionDeclaration === 'object') {
        Object.assign(options.FunctionDeclaration, opts.FunctionDeclaration);
      }

      if (typeof opts.FunctionExpression === 'object') {
        Object.assign(options.FunctionExpression, opts.FunctionExpression);
      }
    }
  }

  const caseIndentStore = {};

  /**
   * Creates an error message for a line, given the expected/actual
   * indentation.
   * @param {number} expectedAmount The expected amount of indentation
   *     characters for this line.
   * @param {number} actualSpaces The actual number of indentation spaces that
   *     were found on this line.
   * @param {number} actualTabs The actual number of indentation tabs that
   *     were found on this line.
   * @return {string} An error message for this line
   */
  function createErrorMessage(expectedAmount, actualSpaces, actualTabs) {
    // Creates message like: "2 tabs"
    const expectedStatement =
          `${expectedAmount} ${indentType}${expectedAmount === 1 ? '' : 's'}`;
    const foundSpacesWord = `space${actualSpaces === 1 ? '' : 's'}`;
    const foundTabsWord = `tab${actualTabs === 1 ? '' : 's'}`;
    let foundStatement;

    if (actualSpaces > 0 && actualTabs > 0) {
      // Statement like "1 space and 2 tabs".
      foundStatement = `${actualSpaces} ${foundSpacesWord} and ` +
        `${actualTabs} ${foundTabsWord}`;
    } else if (actualSpaces > 0) {
      // Abbreviate the message if the expected indentation is also spaces.
      // e.g. 'Expected 4 spaces but found 2' rather than 'Expected 4 spaces
      // but found 2 spaces'
      foundStatement = indentType === 'space' ?
        actualSpaces :
        `${actualSpaces} ${foundSpacesWord}`;
    } else if (actualTabs > 0) {
      foundStatement = indentType === 'tab' ?
        actualTabs :
        `${actualTabs} ${foundTabsWord}`;
    } else {
      foundStatement = '0';
    }

    return `Expected indentation of ${expectedStatement} but` +
      ` found ${foundStatement}.`;
  }

  /**
   * Reports a given indent violation.
   * @param {!Espree.Node} node Node violating the indent rule.
   * @param {number} needed Expected indentation character count.
   * @param {number} gottenSpaces Indentation space count in the actual
   *     node/code.
   * @param {number} gottenTabs Indentation tab count in the actual node/code.
   * @param {Object=} opt_loc Error line and column location.
   * @param {boolean=} opt_isLastNodeCheck Is the error for last node check.
   * @return {void}
   */
  function report(node, needed, gottenSpaces, gottenTabs, opt_loc,
          opt_isLastNodeCheck) {

    const desiredIndent =
          (indentType === 'space' ? ' ' : '\t').repeat(needed);

    /** @type {!Array<number>} */
    const textRange = opt_isLastNodeCheck ?
          [node.range[1] - gottenSpaces - gottenTabs - 1, node.range[1] - 1] :
          [node.range[0] - gottenSpaces - gottenTabs, node.range[0]];

    context.report({
      node,
      loc: opt_loc,
      message: createErrorMessage(needed, gottenSpaces, gottenTabs),
      fix: fixer => fixer.replaceTextRange(textRange, desiredIndent),
    });
  }

  /**
   * Gets the actual indent of the node.
   * @param {!Espree.Node} node Node to examine.
   * @param {boolean=} opt_byLastLine Get indent of node's last line.
   * @return {!IndentInfo} The node's indent. Contains keys `space` and `tab`,
   *     representing the indent of each character. Also contains keys
   *     `goodChar` and `badChar`, where `goodChar` is the amount of the
   *     user's desired indentation character, and `badChar` is the amount of
   *     the other indentation character.
   */
  function getNodeIndent(node, opt_byLastLine) {
    const token = opt_byLastLine ?
          sourceCode.getLastToken(node) :
          sourceCode.getFirstToken(node);
    const srcCharsBeforeNode = sourceCode.getText(
      token, token.loc.start.column).split('');
    const indentChars = srcCharsBeforeNode.slice(
      0,
      srcCharsBeforeNode.findIndex(char => char !== ' ' && char !== '\t'));
    const spaces = indentChars.filter(char => char === ' ').length;
    const tabs = indentChars.filter(char => char === '\t').length;

    return {
      space: spaces,
      tab: tabs,
      goodChar: indentType === 'space' ? spaces : tabs,
      badChar: indentType === 'space' ? tabs : spaces,
    };
  }

  /**
   * Checks node is the first in its own start line. By default it looks by
   * start line.
   * @param {!Espree.Node} node The node to check.
   * @param {boolean=} opt_byEndLocation Lookup based on start position or
   *     end.
   * @return {boolean} true if it's the first in it's start line.
   */
  function isNodeFirstInLine(node, opt_byEndLocation) {
    const firstToken = opt_byEndLocation === true ?
          sourceCode.getLastToken(node, 1) :
          sourceCode.getTokenBefore(node);
    const startLine = opt_byEndLocation === true ?
          node.loc.end.line :
          node.loc.start.line;
    const endLine = firstToken ? firstToken.loc.end.line : -1;
    return startLine !== endLine;
  }

  /**
   * Checks indent for node.
   * @param {(!ESLint.ASTNode|!Espree.Token)} node Node to check.
   * @param {number} neededIndent The needed indent.
   * @return {void}
   */
  function checkNodeIndent(node, neededIndent) {
    const actualIndent = getNodeIndent(node, false);

    if (node.type !== 'ArrayExpression' &&
        node.type !== 'ObjectExpression' &&
        (actualIndent.goodChar !== neededIndent ||
         actualIndent.badChar !== 0) &&
        isNodeFirstInLine(node)
       ) {
      report(node, neededIndent, actualIndent.space, actualIndent.tab);
    }

    if (node.type === 'IfStatement' && node.alternate) {
      const elseToken = sourceCode.getTokenBefore(node.alternate);

      checkNodeIndent(elseToken, neededIndent);

      if (!isNodeFirstInLine(node.alternate)) {
        checkNodeIndent(node.alternate, neededIndent);
      }
    }
  }

  /**
   * Checks indent for nodes list.
   * @param {!Array<!ESLint.ASTNode>} nodes List of node objects.
   * @param {number} indent Needed indent.
   * @return {void}
   */
  function checkNodesIndent(nodes, indent) {
    nodes.forEach(node => checkNodeIndent(node, indent));
  }

  /**
   * Checks taht last node line indent this detects, that block closed
   * correctly.
   * @param {!ESLint.ASTNode} node Node to examine.
   * @param {number} lastLineIndent Needed indent.
   * @return {void}
   */
  function checkLastNodeLineIndent(node, lastLineIndent) {
    const lastToken = sourceCode.getLastToken(node);
    const endIndent = getNodeIndent(lastToken, true);

    if ((endIndent.goodChar !== lastLineIndent || endIndent.badChar !== 0) &&
        isNodeFirstInLine(node, true)) {
      report(
        node,
        lastLineIndent,
        endIndent.space,
        endIndent.tab,
        {line: lastToken.loc.start.line, column: lastToken.loc.start.column},
        true
      );
    }
  }

  /**
   * Checks that first node line indent is correct.
   * @param {!ESLint.ASTNode} node Node to examine.
   * @param {number} firstLineIndent Needed indent.
   * @return {void}
   */
  function checkFirstNodeLineIndent(node, firstLineIndent) {
    const startIndent = getNodeIndent(node, false);

    if ((startIndent.goodChar !== firstLineIndent ||
         startIndent.badChar !== 0) &&
        isNodeFirstInLine(node)) {
      report(
        node,
        firstLineIndent,
        startIndent.space,
        startIndent.tab,
        {line: node.loc.start.line, column: node.loc.start.column}
      );
    }
  }

  /**
   * Returns a parent node of given node based on a specified type.
   * If node is not present then return null.
   * @param {!ESLint.ASTNode} node Node to examine.
   * @param {string} type The type that is being looked for.
   * @return {(!ESLint.ASTNode|null)} If found then node otherwise null.
   */
  function getParentNodeByType(node, type) {
    let parent = node.parent;

    while (parent.type !== type && parent.type !== 'Program') {
      parent = parent.parent;
    }
    return parent.type === type ? parent : null;
  }

  /**
   * Returns the VariableDeclarator based on the current node.
   * If node is nnot present then return null.
   * @param {!ESLint.ASTNode} node Node to examine.
   * @return {(!ESLint.ASTNode|null)} If found then node otherwise null.
   */
  function getVariableDeclaratorNode(node) {
    return getParentNodeByType(node, 'VariableDeclarator');
  }

  /**
   * Returns the ExpressionStatement based on the current node.
   * If node is not present then return null.
   * @param {!ESLint.ASTNode} node Node to examine.
   * @return {(!ESLint.ASTNode|null)} If found then node otherwise null.
   */
  function getAssignmentExpressionNode(node) {
    return getParentNodeByType(node, 'AssignmentExpression');
  }

  /**
   * Check to see if the node is part of the multi-line variable declaration.
   * Also if its on the same line as the varNode.
   * @param {!ESLint.ASTNode} node Node to check.
   * @param {!Espree.VariableDeclarator} varNode Variable declaration node to
   *     check against.
   * @return {boolean} True if all the above condition are satisfied.
   */
  function isNodeInVarOnTop(node, varNode) {
    /** @type {!Espree.VariableDeclaration} */
    const varDeclaration = varNode.parent;
    return varNode &&
      varDeclaration.loc.start.line === node.loc.start.line &&
      varDeclaration.declarations.length > 1;
  }

  /**
   * Checks to see if the argument before the callee node is multi-line and
   * there should only be 1 argument before the callee node.
   * @param {!Espree.Expression} node Node to check.
   * @return {boolean} True if arguments are multi-line.
   */
  function isArgBeforeCalleeNodeMultiline(node) {
    const parent = /** @type {!Espree.CallExpression} */ (node.parent);

    if (parent.arguments.length >= 2 && parent.arguments[1] === node) {
      return parent.arguments[0].loc.end.line >
        parent.arguments[0].loc.start.line;
    }
    return false;
  }

  /**
   * Checks to see if the node is a file level IIFE.
   * @param {!ESLint.ASTNode} node The function node to check.
   * @return {boolean} True if the node is the outer IIFE.
   */
  function isOuterIIFE(node) {
    const parent = node.parent;
    let stmt = parent.parent;

    // Verify that the node is an IIFE.
    if (parent.type !== 'CallExpression' || parent.callee !== node) {
      return false;
    }

    // Navigate legal ancestors to determine whether this IIEF is outer.
    while (
      stmt.type === 'UnaryExpression' && (
        stmt.operator === '!' ||
          stmt.operator === '~' ||
          stmt.operator === '+' ||
          stmt.operator === '-') ||
        stmt.type === 'AssignmentExpression' ||
        stmt.type === 'LogicalExpression' ||
        stmt.type === 'SequenceExpression' ||
        stmt.type === 'VariableDeclarator') {

      stmt = stmt.parent;
    }

    return ((stmt.type === 'ExpressionStatement' ||
             stmt.type === 'VariableDeclaration') &&
            stmt.parent && stmt.parent.type === 'Program');
  }

  /**
   * Checks indent for function block content.
   * @param {!ESLint.ASTNode} node A BlockStatement node that is inside of a
   *     function.
   * @return {void}
   */
  function checkIndentInFunctionBlock(node) {

    /*
     * Search first caller in chain.
     * Ex.:
     *
     * Models <- Identifier
     *   .User
     *   .find()
     *   .exec(function() {
     *   // function body
     * });
     *
     * Looks for 'Models'
     */
    const calleeNode = node.parent; // FunctionExpression
    let indent;

    if (calleeNode.parent &&
        (calleeNode.parent.type === 'Property' ||
         calleeNode.parent.type === 'ArrayExpression')) {

      // If function is part of array or object, comma can be put at left
      indent = getNodeIndent(calleeNode, false).goodChar;
    } else {

      // If function is standalone, simple calculate indent
      indent = getNodeIndent(calleeNode).goodChar;
    }

    if (calleeNode.parent.type === 'CallExpression') {
      const calleeParent = calleeNode.parent;

      if (calleeNode.type !== 'FunctionExpression' &&
          calleeNode.type !== 'ArrowFunctionExpression') {
        if (calleeParent && calleeParent.loc.start.line <
            node.loc.start.line) {
          indent = getNodeIndent(calleeParent).goodChar;
        }
      } else {
        if (isArgBeforeCalleeNodeMultiline(calleeNode) &&
            calleeParent.callee.loc.start.line ==
            calleeParent.callee.loc.end.line &&
            !isNodeFirstInLine(calleeNode)) {
          indent = getNodeIndent(calleeParent).goodChar;
        }
      }
    }

    // function body indent should be indent + indent size, unless this is a
    // FunctionDeclaration, FunctionExpression, or outer IIFE and the
    // corresponding options are enabled.
    let functionOffset = indentSize;

    if (options.outerIIFEBody !== null && isOuterIIFE(calleeNode)) {
      functionOffset = options.outerIIFEBody * indentSize;
    } else if (calleeNode.type === 'FunctionExpression') {
      functionOffset = options.FunctionExpression.body * indentSize;
    } else if (calleeNode.type === 'FunctionDeclaration') {
      functionOffset = options.FunctionDeclaration.body * indentSize;
    }
    indent += functionOffset;

    // check if the node is inside a variable
    const parentVarNode = getVariableDeclaratorNode(node);

    if (parentVarNode && isNodeInVarOnTop(node, parentVarNode)) {
      indent += indentSize *
        options.VariableDeclarator[parentVarNode.parent.kind];
    }

    if (node.body.length > 0) {
      checkNodesIndent(node.body, indent);
    }

    checkLastNodeLineIndent(node, indent - functionOffset);
  }


  /**
   * Checks if the given node starts and ends on the same line.
   * @param {!ESLint.ASTNode} node The node to check.
   * @return {boolean} Whether or not the block starts and ends on the same
   *     line.
   */
  function isSingleLineNode(node) {
    const lastToken = sourceCode.getLastToken(node);
    const startLine = node.loc.start.line;
    const endLine = lastToken.loc.end.line;
    return startLine == endLine;
  }

  /**
   * Check to see if the first element inside an array is an object and on the
   * same line as the node.  If the node is not an array then it will return
   * false.
   * @param {!ESLint.ASTNode} node Node to check.
   * @return {boolean} Success or failure.
   */
  function isFirstArrayElementOnSameLine(node) {
    if (node.type === 'ArrayExpression' && node.elements[0]) {
      return node.elements[0].loc.start.line === node.loc.start.line &&
        node.elements[0].type === 'ObjectExpression';
    } else {
      return false;
    }
  }

  /**
   * Checks indent for array block content or object block content.
   * @param {!ESLint.ASTNode} node Node to examine.
   * @return {void}
   */
  function checkIndentInArrayOrObjectBlock(node) {

    // Skip inline
    if (isSingleLineNode(node)) {
      return;
    }

    let elements = (node.type === 'ArrayExpression') ?
      node.elements :
      node.properties;

    // Filters out empty elements example would be [ , 2] so remove first
    // element as espree considers it as null.
    elements = elements.filter(function(elem) {
      return elem !== null;
    });

    // Skip if first element is in same line with this node
    if (elements.length > 0 && elements[0].loc.start.line ===
        node.loc.start.line) {
      return;
    }

    let nodeIndent;
    let elementsIndent;
    const parentVarNode = getVariableDeclaratorNode(node);

    // TODO - come up with a better strategy in future
    if (isNodeFirstInLine(node)) {
      const parent = node.parent;
      let effectiveParent = parent;

      if (parent.type === 'MemberExpression') {
        if (isNodeFirstInLine(parent)) {
          effectiveParent = parent.parent.parent;
        } else {
          effectiveParent = parent.parent;
        }
      }
      nodeIndent = getNodeIndent(effectiveParent).goodChar;
      if (parentVarNode && parentVarNode.loc.start.line !=
          node.loc.start.line) {
        if (parent.type !== 'VariableDeclarator' ||
            parentVarNode === parentVarNode.parent.declarations[0]) {
          if (parent.type === 'VariableDeclarator' &&
              parentVarNode.loc.start.line ===
              effectiveParent.loc.start.line) {
            nodeIndent = nodeIndent +
              (indentSize *
               options.VariableDeclarator[parentVarNode.parent.kind]);
          } else if (
            parent.type === 'ObjectExpression' ||
              parent.type === 'ArrayExpression' ||
              parent.type === 'CallExpression' ||
              parent.type === 'ArrowFunctionExpression' ||
              parent.type === 'NewExpression' ||
              parent.type === 'LogicalExpression'
          ) {
            nodeIndent = nodeIndent + indentSize;
          }
        }
      } else if (!parentVarNode && !isFirstArrayElementOnSameLine(parent) &&
                 effectiveParent.type !== 'MemberExpression' &&
                 effectiveParent.type !== 'ExpressionStatement' &&
                 effectiveParent.type !== 'AssignmentExpression' &&
                 effectiveParent.type !== 'Property') {
        nodeIndent = nodeIndent + indentSize;
      }

      elementsIndent = nodeIndent + indentSize;

      checkFirstNodeLineIndent(node, nodeIndent);
    } else {
      nodeIndent = getNodeIndent(node).goodChar;
      elementsIndent = nodeIndent + indentSize;
    }

    /*
     * Checks if the node is a multiple variable declaration; if so, then
     * make sure indentation takes that into account.
     */
    if (isNodeInVarOnTop(node, parentVarNode)) {
      elementsIndent += indentSize *
        options.VariableDeclarator[parentVarNode.parent.kind];
    }

    checkNodesIndent(elements, elementsIndent);

    if (elements.length > 0) {

      // Skip last block line check if last item in same line
      if (elements[elements.length - 1].loc.end.line === node.loc.end.line) {
        return;
      }
    }

    checkLastNodeLineIndent(node, elementsIndent - indentSize);
  }

  /**
   * Checks if the node or node body is a BlockStatement or not.
   * @param {!ESLint.ASTNode} node Node to test.
   * @return {boolean} True if it or its body is a block statement.
   */
  function isNodeBodyBlock(node) {
    return node.type === 'BlockStatement' || node.type === 'ClassBody' ||
      (node.body && node.body.type === 'BlockStatement') ||
      (node.consequent && node.consequent.type === 'BlockStatement');
  }

  /**
   * Checks indentation for blocks.
   * @param {!ESLint.ASTNode} node Node to check.
   * @return {void}
   */
  function blockIndentationCheck(node) {

    // Skip inline blocks
    if (isSingleLineNode(node)) {
      return;
    }

    if (node.parent && (
      node.parent.type === 'FunctionExpression' ||
        node.parent.type === 'FunctionDeclaration' ||
        node.parent.type === 'ArrowFunctionExpression'
    )) {
      checkIndentInFunctionBlock(node);
      return;
    }

    let indent;
    let nodesToCheck = [];

    /*
     * For this statements we should check indent from statement beginning,
     * not from the beginning of the block.
     */
    const statementsWithProperties = [
      'IfStatement', 'WhileStatement', 'ForStatement', 'ForInStatement',
      'ForOfStatement', 'DoWhileStatement', 'ClassDeclaration',
    ];

    if (node.parent &&
        statementsWithProperties.indexOf(node.parent.type) !== -1 &&
        isNodeBodyBlock(node)) {
      indent = getNodeIndent(node.parent).goodChar;
    } else {
      indent = getNodeIndent(node).goodChar;
    }

    if (node.type === 'IfStatement' &&
        node.consequent.type !== 'BlockStatement') {
      nodesToCheck = [node.consequent];
    } else if (Array.isArray(node.body)) {
      nodesToCheck = node.body;
    } else {
      nodesToCheck = [node.body];
    }

    if (nodesToCheck.length > 0) {
      checkNodesIndent(nodesToCheck, indent + indentSize);
    }

    if (node.type === 'BlockStatement') {
      checkLastNodeLineIndent(node, indent);
    }
  }

  /**
   * Filters out the elements which are on the same line of each other or the
   * node.  Basically have only 1 elements from each line except the variable
   * declaration line.
   *
   * @param {!ESLint.ASTNode} node Variable declaration node.
   * @return {!Array<!ESLint.ASTNode>} Filtered elements
   */
  function filterOutSameLineVars(node) {
    return node.declarations.reduce(function(finalCollection, elem) {
      const lastElem = finalCollection[finalCollection.length - 1];

      if ((elem.loc.start.line !== node.loc.start.line && !lastElem) ||
          (lastElem && lastElem.loc.start.line !== elem.loc.start.line)) {
        finalCollection.push(elem);
      }

      return finalCollection;
    }, []);
  }

  /**
   * Check indentation for variable declarations.
   * @param {!ESLint.ASTNode} node The node to examine.
   * @return {void}
   */
  function checkIndentInVariableDeclarations(node) {
    const elements = filterOutSameLineVars(node);
    const nodeIndent = getNodeIndent(node).goodChar;
    const lastElement = elements[elements.length - 1];

    const elementsIndent = nodeIndent +
          indentSize * options.VariableDeclarator[node.kind];

    checkNodesIndent(elements, elementsIndent);

    // Only check the last line if there is any token after the last item
    if (sourceCode.getLastToken(node).loc.end.line <=
        lastElement.loc.end.line) {
      return;
    }

    const tokenBeforeLastElement = sourceCode.getTokenBefore(lastElement);

    if (tokenBeforeLastElement.value === ',') {

      // Special case for comma-first syntax where the semicolon is indented.
      checkLastNodeLineIndent(node,
                              getNodeIndent(tokenBeforeLastElement).goodChar);
    } else {
      checkLastNodeLineIndent(node, elementsIndent - indentSize);
    }
  }

  /**
   * Check and decide whether to check for indentation for blockless nodes.
   * Scenarios are for or while statements without braces around them.
   * @param {!ESLint.ASTNode} node The node to examine.
   * @return {void}
   */
  function blockLessNodes(node) {
    if (node.body.type !== 'BlockStatement') {
      blockIndentationCheck(node);
    }
  }

  /**
   * Returns the expected indentation for the case statement.
   * @param {!ESLint.ASTNode} node The node to examine.
   * @param {number=} opt_switchIndent The indent for switch statement.
   * @return {number} The indent size.
   */
  function expectedCaseIndent(node, opt_switchIndent) {
    const switchNode = (node.type === 'SwitchStatement') ? node : node.parent;
    let caseIndent;

    if (caseIndentStore[switchNode.loc.start.line]) {
      return caseIndentStore[switchNode.loc.start.line];
    } else {
      if (typeof opt_switchIndent === 'undefined') {
        opt_switchIndent = getNodeIndent(switchNode).goodChar;
      }

      if (switchNode.cases.length > 0 && options.SwitchCase === 0) {
        caseIndent = opt_switchIndent;
      } else {
        caseIndent = opt_switchIndent + (indentSize * options.SwitchCase);
      }

      caseIndentStore[switchNode.loc.start.line] = caseIndent;
      return caseIndent;
    }
  }

  return {
    Program(node) {
      if (node.body.length > 0) {

        // Root nodes should have no indent
        checkNodesIndent(node.body, getNodeIndent(node).goodChar);
      }
    },

    ClassBody: blockIndentationCheck,

    BlockStatement: blockIndentationCheck,

    WhileStatement: blockLessNodes,

    ForStatement: blockLessNodes,

    ForInStatement: blockLessNodes,

    ForOfStatement: blockLessNodes,

    DoWhileStatement: blockLessNodes,

    IfStatement(node) {
      if (node.consequent.type !== 'BlockStatement' &&
          node.consequent.loc.start.line > node.loc.start.line) {
        blockIndentationCheck(node);
      }
    },

    VariableDeclaration(node) {
      if (node.declarations[node.declarations.length - 1].loc.start.line >
          node.declarations[0].loc.start.line) {
        checkIndentInVariableDeclarations(node);
      }
    },

    ObjectExpression(node) {
      checkIndentInArrayOrObjectBlock(node);
    },

    ArrayExpression(node) {
      checkIndentInArrayOrObjectBlock(node);
    },

    MemberExpression(node) {
      if (typeof options.MemberExpression === 'undefined') {
        return;
      }

      if (isSingleLineNode(node)) {
        return;
      }

      // The typical layout of variable declarations and assignments
      // alter the expectation of correct indentation. Skip them.
      // TODO: Add appropriate configuration options for variable
      // declarations and assignments.
      if (getVariableDeclaratorNode(node)) {
        return;
      }

      if (getAssignmentExpressionNode(node)) {
        return;
      }

      const propertyIndent = getNodeIndent(node).goodChar +
            indentSize * options.MemberExpression;

      const checkNodes = [node.property];

      const dot = context.getTokenBefore(node.property);

      if (dot.type === 'Punctuator' && dot.value === '.') {
        checkNodes.push(dot);
      }

      checkNodesIndent(checkNodes, propertyIndent);
    },

    SwitchStatement(node) {

      // Switch is not a 'BlockStatement'
      const switchIndent = getNodeIndent(node).goodChar;
      const caseIndent = expectedCaseIndent(node, switchIndent);

      checkNodesIndent(node.cases, caseIndent);


      checkLastNodeLineIndent(node, switchIndent);
    },

    SwitchCase(node) {

      // Skip inline cases
      if (isSingleLineNode(node)) {
        return;
      }
      const caseIndent = expectedCaseIndent(node);

      checkNodesIndent(node.consequent, caseIndent + indentSize);
    },

    FunctionDeclaration(node) {
      if (isSingleLineNode(node)) {
        return;
      }
      if (options.FunctionDeclaration.parameters === 'first' &&
          node.params.length) {
        checkNodesIndent(
          node.params.slice(1), node.params[0].loc.start.column);
      } else if (options.FunctionDeclaration.parameters !== null) {
        checkNodesIndent(
          node.params, indentSize * options.FunctionDeclaration.parameters);
      }
    },

    FunctionExpression(node) {
      if (isSingleLineNode(node)) {
        return;
      }
      if (options.FunctionExpression.parameters == 'first' &&
          node.params.length) {
        checkNodesIndent(
          node.params.slice(1), node.params[0].loc.start.column);
      } else if (options.FunctionExpression.parameters !== null) {
        checkNodesIndent(
          node.params, indentSize * options.FunctionExpression.parameters);
      }
    },
  };

}

/** @const {!ESLint.RuleDefinition} */
const INDENT_RULE = {
  meta: {
    docs: {
      description: 'enforce consistent indentation',
      category: 'Stylistic Issues',
      recommended: false,
    },

    fixable: 'whitespace',

    schema: [
      {
        oneOf: [
          {enum: ['tab']},
          {type: 'integer', minimum: 0},
        ],
      },
      {
        type: 'object',
        properties: {
          SwitchCase: {
            type: 'integer',
            minimum: 0,
          },
          VariableDeclarator: {
            oneOf: [
              {
                type: 'integer',
                minimum: 0,
              },
              {
                type: 'object',
                properties: {
                  var: {type: 'integer', minimum: 0},
                  let: {type: 'integer', minimum: 0},
                  const: {type: 'integer', minimum: 0},
                },
              },
            ],
          },
          outerIIFEBody: {type: 'integer', minimum: 0},
          MemberExpression: {type: 'integer', minimum: 0},
          FunctionDeclaration: {
            type: 'object',
            properties: {
              parameters: {
                oneOf: [
                  {type: 'integer', minimum: 0},
                  {enum: ['first']},
                ],
              },
              body: {type: 'integer', minimum: 0},
            },
          },
          FunctionExpression: {
            type: 'object',
            properties: {
              parameters: {
                oneOf: [
                  {type: 'integer', minimum: 0},
                  {enum: ['first']},
                ],
              },
              body: {type: 'integer', minimum: 0},
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create,
};

exports = INDENT_RULE;