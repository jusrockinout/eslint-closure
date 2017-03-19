/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	const closureLintPlugin = __webpack_require__(1);
	const closureConfigBase = __webpack_require__(19);
	const closureConfigEs5 = __webpack_require__(20);
	const closureConfigEs6 = __webpack_require__(21);
	const merge = __webpack_require__(22);
	
	// ESLint is added manually by using their browserify config in the Makefile.
	// It's difficult to use Webpack to bundle ESLint ourselves because of the use
	// of fs module and because the way that rules are exposed confuses Webpack.
	const eslint = /** @type {!ESLint.Linter} */ (window['eslint']);
	
	const CodeMirror = window.CodeMirror;
	
	// TODO(jschaf): Clean this up into proper Closure-style code.
	const EDITOR_TEXT_AREA_ELEMENT = document.getElementById('editor');
	const EDITOR = CodeMirror.fromTextArea(EDITOR_TEXT_AREA_ELEMENT, {
	  mode: 'javascript',
	  lineNumbers: true,
	});
	
	const CSS_CLASS_WARNING = 'editor-warning';
	const CSS_CLASS_ERROR = 'editor-error';
	
	// Expose the EDITOR for easy access.
	window.EDITOR = EDITOR;
	
	function clone(obj) {
	  return JSON.parse(JSON.stringify(obj));
	}
	
	const BASE_OPTIONS = closureConfigBase;
	const ES5_OPTIONS = merge(clone(BASE_OPTIONS), closureConfigEs5);
	const ES6_OPTIONS = merge(clone(BASE_OPTIONS), closureConfigEs6);
	let OPTIONS = ES6_OPTIONS;
	
	function switchConfig(configKey) {
	  const es5Button = document.getElementById('es5Button');
	  const es6Button = document.getElementById('es6Button');
	  const buttonHighlight = 'mdl-button--accent';
	  switch (configKey) {
	    case 'es5':
	      OPTIONS = ES5_OPTIONS;
	      es5Button.classList.add(buttonHighlight);
	      es6Button.classList.remove(buttonHighlight);
	      break;
	
	    case 'es6':
	      OPTIONS = ES6_OPTIONS;
	      es6Button.classList.add(buttonHighlight);
	      es5Button.classList.remove(buttonHighlight);
	      break;
	
	    default:
	      throw new Error('Unrecoginized config key, use es5 or es6.');
	  }
	  verify();
	}
	
	window.switchConfig = switchConfig;
	
	function debounce(func, wait, immediate) {
	  let timeout;
	  return function() {
	    const context = this;
	    const args = arguments;
	    const later = function() {
	      timeout = null;
	      if (!immediate) func.apply(context, args);
	    };
	    const callNow = immediate && !timeout;
	    clearTimeout(timeout);
	    timeout = setTimeout(later, wait);
	    if (callNow) func.apply(context, args);
	  };
	}
	
	function makeResultNode(options) {
	  const result = document.createElement('div');
	  const classList = result.classList;
	
	  classList.add('alert');
	
	  if (options.fatal) {
	    classList.add('alert-danger');
	  }
	
	  if (options.hasOwnProperty('severity')) {
	    if (options.severity === 1) {
	      classList.add('alert-warning');
	    } else if (options.severity === 2) {
	      classList.add('alert-danger');
	    }
	  } else {
	    classList.add('alert-success');
	  }
	
	  if (options.hasOwnProperty('column') &&
	      options.hasOwnProperty('line') &&
	      options.hasOwnProperty('message')) {
	
	    // TODO: Add goto error
	    result.onclick = null;
	        // (function(EDITOR, options) {
	        //   EDITOR.onGotoLine(
	        //       options.line - 1, options.column - 1, options.column - 1);
	        // }).bind(null, EDITOR, options);
	
	    result.innerHTML = options.line + ':' + options.column + ' - ' +
	        options.message + ' (<a href="http://eslint.org/docs/rules/' +
	        options.ruleId + '">' + options.ruleId + '</a>)';
	    result.setAttribute('title', options.message);
	  } else if (options.hasOwnProperty('message')) {
	    result.textContent = 'Lint-free!';
	  }
	
	  return result;
	}
	
	function saveConfig() {
	  const environments = {};
	  const rules = {};
	  const ecmaFeatures = {};
	  $('.ecmaFeatures input')
	      .each(function() {
	        const name = $(this).attr('id');
	        const value = $(this).is(':checked');
	        ecmaFeatures[name] = value;
	      });
	  $('.environments input')
	      .each(function() {
	        const name = $(this).attr('id');
	        const value = $(this).is(':checked');
	        environments[name] = value;
	      });
	  $('.rules input')
	      .each(function() {
	        const name = $(this).attr('id');
	        const value = $(this).is(':checked') ? 2 : 0;
	        rules[name] = value;
	      });
	
	  OPTIONS.rules = rules;
	  OPTIONS.env = environments;
	  OPTIONS.ecmaFeatures = ecmaFeatures;
	  localStorage.rules = JSON.stringify(rules);
	  localStorage.ecmaFeatures = JSON.stringify(ecmaFeatures);
	  localStorage.env = JSON.stringify(environments);
	  verify();
	}
	
	function saveConfigAndClose() {
	  saveConfig();
	  $('#configuration').collapse('hide');
	}
	
	function removeWarningsErrors() {
	  EDITOR.getAllMarks().forEach((mark) => {
	    mark.clear();
	  });
	}
	
	function messageSeverityCssClass(eslintMessage) {
	  if (eslintMessage.severty == 2) {
	    return CSS_CLASS_ERROR;
	  } else {
	    return CSS_CLASS_WARNING;
	  }
	}
	
	function addWarningsErrors(eslintMessages) {
	  eslintMessages.forEach((message) => {
	    // ESLint is 1 based, CodeMirror is 0 based.
	    // TODO: handle cases wh
	    const line = message.line - 1;
	    const startColumn = message.column - 1;
	    const endColumn = startColumn + 1;
	    const className = messageSeverityCssClass(message);
	    // TODO: add description on hover
	    const description = `${message.message} (${message.ruleId})`;
	
	    const markStart = {line, ch: startColumn};
	    const markEnd = {line, ch: endColumn};
	    const markOptions = {className};
	
	    EDITOR.markText(markStart, markEnd, markOptions);
	  });
	}
	
	function displayResults(results) {
	  const resultsNode = document.getElementById('results');
	
	  const nodes = Array.from(resultsNode.childNodes);
	  nodes.forEach(resultsNode.removeChild.bind(resultsNode));
	
	  if (results.length === 0) {
	    const resultNode = makeResultNode({message: 'Lint-free!'});
	    resultsNode.appendChild(resultNode);
	  } else {
	    results.forEach(function(result) {
	      const resultNode = makeResultNode(result);
	      resultsNode.appendChild(resultNode);
	    });
	  }
	
	  removeWarningsErrors();
	  addWarningsErrors(results);
	}
	
	function addPopover(checkbox, rule) {
	  // checkbox.popover({
	  //   title: rule,
	  //   content() {
	  //     const me = $(this);
	  //     if (me.data('content')) {
	  //       return me.data('content');
	  //     } else {
	  //       $.ajax({
	  //         url: '/docs/rules/' + me.text() + '.html',
	  //         method: 'GET',
	  //         success(data) {
	  //           const html = $(data);
	  //           const firstParagraph = html.find('p:first');
	  //           $('.popover-content').html(firstParagraph);
	  //           me.data('content', firstParagraph);
	  //         },
	  //       });
	  //       return 'Loading...';
	  //     }
	  //   },
	  //   placement(popover, checkbox) {
	  //     return $(checkbox).offset().left < 270 ? 'right' : 'left';
	  //   },
	  //   html: true,
	  // });
	  // checkbox.on('mouseenter', function() { $(this).popover('show'); });
	  // checkbox.on('mouseleave', function() { $(this).popover('hide'); });
	}
	
	function populateConfiguration(rules, environments, ecmaFeatures) {
	  let checkbox;
	  let parent;
	
	  // ecmaFeatures
	  for (const feature in ecmaFeatures) {
	    checkbox = $(
	        '<div class="checkbox-inline"><label><input class="feature" type="checkbox" />' +
	          feature + '</label></div>');
	    $('input', checkbox)
	        .attr('id', feature)
	        .prop('checked', ecmaFeatures[feature]);
	    $('.ecmaFeatures .list').append(checkbox);
	  }
	
	  // environments
	  for (const env in environments) {
	    checkbox = $(
	        '<div class="checkbox-inline"><label><input type="checkbox" />' +
	          env + '</label></div>');
	    $('input', checkbox)
	        .attr('id', env)
	        .prop('checked', environments[env]);
	    $('.environments .list').append(checkbox);
	  }
	
	  // rules
	  Object.keys(rules).forEach(function(rule, i, keys) {
	    const limit = Math.ceil(keys.length / 3);
	    if (i % limit === 0) {
	      parent = $('<div class="col-md-4"></div>');
	      $('.rules').append(parent);
	    }
	    checkbox =
	        $('<div class="checkbox"><label><input type="checkbox" />' +
	          rule + '</label></div>');
	    addPopover(checkbox, rule);
	    $('input', checkbox)
	        .attr('id', rule)
	        .prop('checked', rules[rule] !== 0);
	    parent.append(checkbox);
	  });
	
	  $('#configuration').on('change', 'input[type=checkbox]', saveConfig);
	  $('#configuration .btn').click(saveConfigAndClose);
	}
	
	// if (localStorage.rules) {
	//   OPTIONS.rules = JSON.parse(localStorage.rules);
	// }
	// if (localStorage.env) {
	//   OPTIONS.env = JSON.parse(localStorage.env);
	// }
	// if (localStorage.ecmaFeatures) {
	//   OPTIONS.ecmaFeatures = JSON.parse(localStorage.ecmaFeatures);
	// }
	
	// ensure certain environments are available
	OPTIONS.env = OPTIONS.env || {};
	OPTIONS.env.node = OPTIONS.env.node || false;
	OPTIONS.env.browser = OPTIONS.env.browser || false;
	OPTIONS.env.amd = OPTIONS.env.amd || false;
	OPTIONS.env.mocha = OPTIONS.env.mocha || false;
	OPTIONS.env.jasmine = OPTIONS.env.jasmine || false;
	OPTIONS.env.phantomjs = OPTIONS.env.phantomjs || false;
	OPTIONS.env.qunit = OPTIONS.env.qunit || false;
	OPTIONS.env.jquery = OPTIONS.env.jquery || false;
	OPTIONS.env.prototypejs = OPTIONS.env.prototypejs || false;
	OPTIONS.env.shelljs = OPTIONS.env.shelljs || false;
	OPTIONS.env.meteor = OPTIONS.env.meteor || false;
	OPTIONS.env.mongo = OPTIONS.env.mongo || false;
	OPTIONS.env.applescript = OPTIONS.env.applescript || false;
	OPTIONS.env.serviceworker = OPTIONS.env.serviceworker || false;
	OPTIONS.env.embertest = OPTIONS.env.embertest || false;
	OPTIONS.env.es6 = OPTIONS.env.es6 || false;
	
	// include certain ecma features
	OPTIONS.ecmaFeatures = OPTIONS.ecmaFeatures || {};
	OPTIONS.ecmaFeatures.modules = OPTIONS.ecmaFeatures.module || false;
	
	populateConfiguration(OPTIONS.rules, OPTIONS.env, OPTIONS.ecmaFeatures);
	
	console.log(closureLintPlugin.rules);
	const prefixedKeys = Object.keys(closureLintPlugin.rules)
	      .reduce((newObj, key) => {
	        const prefixedKey = 'closure/' + key;
	        newObj[prefixedKey] = closureLintPlugin.rules[key];
	        return newObj;
	      }, {});
	eslint.defineRules(prefixedKeys);
	console.log(prefixedKeys);
	
	console.log('OPTIONS', OPTIONS);
	
	const verify = debounce(function() {
	  const content = EDITOR.getValue();
	  removeWarningsErrors();
	  console.log('verifying', content);
	  const results = eslint.verify(content, OPTIONS);
	  console.log(results);
	  displayResults(results);
	}, 500);
	
	verify();
	
	EDITOR.on('change', verify);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2);


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var c = c || {};
	c.global = this;
	c.isDef = function(a) {
	  return void 0 !== a;
	};
	c.exportPath_ = function(a, b, d) {
	  a = a.split(".");
	  d = d || c.global;
	  a[0] in d || !d.execScript || d.execScript("var " + a[0]);
	  for (var e;a.length && (e = a.shift());) {
	    !a.length && c.isDef(b) ? d[e] = b : d = d[e] ? d[e] : d[e] = {};
	  }
	};
	c.define = function(a, b) {
	  c.exportPath_(a, b);
	};
	c.DEBUG = !1;
	c.LOCALE = "en";
	c.TRUSTED_SITE = !0;
	c.STRICT_MODE_COMPATIBLE = !1;
	c.DISALLOW_TEST_ONLY_CODE = !c.DEBUG;
	c.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = !1;
	c.provide = function(a) {
	  if (c.isInModuleLoader_()) {
	    throw Error("goog.provide can not be used within a goog.module.");
	  }
	  c.constructNamespace_(a);
	};
	c.constructNamespace_ = function(a, b) {
	  c.exportPath_(a, b);
	};
	c.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
	c.module = function(a) {
	  if (!c.isString(a) || !a || -1 == a.search(c.VALID_MODULE_RE_)) {
	    throw Error("Invalid module identifier");
	  }
	  if (!c.isInModuleLoader_()) {
	    throw Error("Module " + a + " has been loaded incorrectly. Note, modules cannot be loaded as normal scripts. They require some kind of pre-processing step. You're likely trying to load a module via a script tag or as a part of a concatenated bundle without rewriting the module. For more info see: https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
	  }
	  if (c.moduleLoaderState_.moduleName) {
	    throw Error("goog.module may only be called once per module.");
	  }
	  c.moduleLoaderState_.moduleName = a;
	};
	c.module.get = function(a) {
	  return c.module.getInternal_(a);
	};
	c.module.getInternal_ = function() {
	};
	c.moduleLoaderState_ = null;
	c.isInModuleLoader_ = function() {
	  return null != c.moduleLoaderState_;
	};
	c.module.declareLegacyNamespace = function() {
	  c.moduleLoaderState_.declareLegacyNamespace = !0;
	};
	c.setTestOnly = function(a) {
	  if (c.DISALLOW_TEST_ONLY_CODE) {
	    throw a = a || "", Error("Importing test-only code into non-debug environment" + (a ? ": " + a : "."));
	  }
	};
	c.forwardDeclare = function() {
	};
	c.getObjectByName = function(a, b) {
	  a = a.split(".");
	  b = b || c.global;
	  for (var d;d = a.shift();) {
	    if (c.isDefAndNotNull(b[d])) {
	      b = b[d];
	    } else {
	      return null;
	    }
	  }
	  return b;
	};
	c.globalize = function(a, b) {
	  b = b || c.global;
	  for (var d in a) {
	    b[d] = a[d];
	  }
	};
	c.addDependency = function(a, b, d, e) {
	  if (c.DEPENDENCIES_ENABLED) {
	    var f;
	    a = a.replace(/\\/g, "/");
	    var g = c.dependencies_;
	    e && "boolean" !== typeof e || (e = e ? {module:"goog"} : {});
	    for (var h = 0;f = b[h];h++) {
	      g.nameToPath[f] = a, g.loadFlags[a] = e;
	    }
	    for (e = 0;b = d[e];e++) {
	      a in g.requires || (g.requires[a] = {}), g.requires[a][b] = !0;
	    }
	  }
	};
	c.ENABLE_DEBUG_LOADER = !0;
	c.logToConsole_ = function(a) {
	  c.global.console && c.global.console.error(a);
	};
	c.require = function() {
	};
	c.basePath = "";
	c.nullFunction = function() {
	};
	c.abstractMethod = function() {
	  throw Error("unimplemented abstract method");
	};
	c.addSingletonGetter = function(a) {
	  a.getInstance = function() {
	    if (a.instance_) {
	      return a.instance_;
	    }
	    c.DEBUG && (c.instantiatedSingletons_[c.instantiatedSingletons_.length] = a);
	    return a.instance_ = new a;
	  };
	};
	c.instantiatedSingletons_ = [];
	c.LOAD_MODULE_USING_EVAL = !0;
	c.SEAL_MODULE_EXPORTS = c.DEBUG;
	c.loadedModules_ = {};
	c.DEPENDENCIES_ENABLED = !1;
	c.TRANSPILE = "detect";
	c.TRANSPILER = "transpile.js";
	c.DEPENDENCIES_ENABLED && (c.dependencies_ = {loadFlags:{}, nameToPath:{}, requires:{}, visited:{}, written:{}, deferred:{}}, c.inHtmlDocument_ = function() {
	  var a = c.global.document;
	  return null != a && "write" in a;
	}, c.findBasePath_ = function() {
	  if (c.isDef(c.global.CLOSURE_BASE_PATH)) {
	    c.basePath = c.global.CLOSURE_BASE_PATH;
	  } else {
	    if (c.inHtmlDocument_()) {
	      for (var a = c.global.document.getElementsByTagName("SCRIPT"), b = a.length - 1;0 <= b;--b) {
	        var d = a[b].src, e = d.lastIndexOf("?"), e = -1 == e ? d.length : e;
	        if ("base.js" == d.substr(e - 7, 7)) {
	          c.basePath = d.substr(0, e - 7);
	          break;
	        }
	      }
	    }
	  }
	}, c.importScript_ = function(a, b) {
	  (c.global.CLOSURE_IMPORT_SCRIPT || c.writeScriptTag_)(a, b) && (c.dependencies_.written[a] = !0);
	}, c.IS_OLD_IE_ = !(c.global.atob || !c.global.document || !c.global.document.all), c.importProcessedScript_ = function(a, b, d) {
	  c.importScript_("", 'goog.retrieveAndExec_("' + a + '", ' + b + ", " + d + ");");
	}, c.queuedModules_ = [], c.wrapModule_ = function(a, b) {
	  return c.LOAD_MODULE_USING_EVAL && c.isDef(c.global.JSON) ? "goog.loadModule(" + c.global.JSON.stringify(b + "\n//# sourceURL=" + a + "\n") + ");" : 'goog.loadModule(function(exports) {"use strict";' + b + "\n;return exports});\n//# sourceURL=" + a + "\n";
	}, c.loadQueuedModules_ = function() {
	  var a = c.queuedModules_.length;
	  if (0 < a) {
	    var b = c.queuedModules_;
	    c.queuedModules_ = [];
	    for (var d = 0;d < a;d++) {
	      c.maybeProcessDeferredPath_(b[d]);
	    }
	  }
	}, c.maybeProcessDeferredDep_ = function(a) {
	  c.isDeferredModule_(a) && c.allDepsAreAvailable_(a) && (a = c.getPathFromDeps_(a), c.maybeProcessDeferredPath_(c.basePath + a));
	}, c.isDeferredModule_ = function(a) {
	  var b = (a = c.getPathFromDeps_(a)) && c.dependencies_.loadFlags[a] || {}, d = b.lang || "es3";
	  return a && ("goog" == b.module || c.needsTranspile_(d)) ? c.basePath + a in c.dependencies_.deferred : !1;
	}, c.allDepsAreAvailable_ = function(a) {
	  if ((a = c.getPathFromDeps_(a)) && a in c.dependencies_.requires) {
	    for (var b in c.dependencies_.requires[a]) {
	      if (!c.isProvided_(b) && !c.isDeferredModule_(b)) {
	        return !1;
	      }
	    }
	  }
	  return !0;
	}, c.maybeProcessDeferredPath_ = function(a) {
	  if (a in c.dependencies_.deferred) {
	    var b = c.dependencies_.deferred[a];
	    delete c.dependencies_.deferred[a];
	    c.globalEval(b);
	  }
	}, c.loadModuleFromUrl = function(a) {
	  c.retrieveAndExec_(a, !0, !1);
	}, c.writeScriptSrcNode_ = function(a) {
	  c.global.document.write('<script type="text/javascript" src="' + a + '">\x3c/script>');
	}, c.appendScriptSrcNode_ = function(a) {
	  var b = c.global.document, d = b.createElement("script");
	  d.type = "text/javascript";
	  d.src = a;
	  d.defer = !1;
	  d.async = !1;
	  b.head.appendChild(d);
	}, c.writeScriptTag_ = function(a, b) {
	  if (c.inHtmlDocument_()) {
	    var d = c.global.document;
	    if (!c.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING && "complete" == d.readyState) {
	      if (/\bdeps.js$/.test(a)) {
	        return !1;
	      }
	      throw Error('Cannot write "' + a + '" after document load');
	    }
	    void 0 === b ? c.IS_OLD_IE_ ? (b = " onreadystatechange='goog.onScriptLoad_(this, " + ++c.lastNonModuleScriptIndex_ + ")' ", d.write('<script type="text/javascript" src="' + a + '"' + b + ">\x3c/script>")) : c.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING ? c.appendScriptSrcNode_(a) : c.writeScriptSrcNode_(a) : d.write('<script type="text/javascript">' + b + "\x3c/script>");
	    return !0;
	  }
	  return !1;
	}, c.needsTranspile_ = function(a) {
	  if ("always" == c.TRANSPILE) {
	    return !0;
	  }
	  if ("never" == c.TRANSPILE) {
	    return !1;
	  }
	  c.requiresTranspilation_ || (c.requiresTranspilation_ = c.createRequiresTranspilation_());
	  if (a in c.requiresTranspilation_) {
	    return c.requiresTranspilation_[a];
	  }
	  throw Error("Unknown language mode: " + a);
	}, c.createRequiresTranspilation_ = function() {
	  function a(a, b) {
	    e ? d[a] = !0 : b() ? d[a] = !1 : e = d[a] = !0;
	  }
	  function b(a) {
	    try {
	      return !!eval(a);
	    } catch (g) {
	      return !1;
	    }
	  }
	  var d = {es3:!1}, e = !1;
	  a("es5", function() {
	    return b("[1,].length==1");
	  });
	  a("es6", function() {
	    return b('(()=>{"use strict";class X{constructor(){if(new.target!=String)throw 1;this.x=42}}let q=Reflect.construct(X,[],String);if(q.x!=42||!(q instanceof String))throw 1;for(const a of[2,3]){if(a==2)continue;function f(z={a}){let a=0;return z.a}{function f(){return 0;}}return f()==3}})()');
	  });
	  a("es6-impl", function() {
	    return !0;
	  });
	  a("es7", function() {
	    return b("2 ** 2 == 4");
	  });
	  a("es8", function() {
	    return b("async () => 1, true");
	  });
	  return d;
	}, c.requiresTranspilation_ = null, c.lastNonModuleScriptIndex_ = 0, c.onScriptLoad_ = function(a, b) {
	  "complete" == a.readyState && c.lastNonModuleScriptIndex_ == b && c.loadQueuedModules_();
	  return !0;
	}, c.writeScripts_ = function(a) {
	  function b(a) {
	    if (!(a in f.written || a in f.visited)) {
	      f.visited[a] = !0;
	      if (a in f.requires) {
	        for (var g in f.requires[a]) {
	          if (!c.isProvided_(g)) {
	            if (g in f.nameToPath) {
	              b(f.nameToPath[g]);
	            } else {
	              throw Error("Undefined nameToPath for " + g);
	            }
	          }
	        }
	      }
	      a in e || (e[a] = !0, d.push(a));
	    }
	  }
	  var d = [], e = {}, f = c.dependencies_;
	  b(a);
	  for (a = 0;a < d.length;a++) {
	    var g = d[a];
	    c.dependencies_.written[g] = !0;
	  }
	  var h = c.moduleLoaderState_;
	  c.moduleLoaderState_ = null;
	  for (a = 0;a < d.length;a++) {
	    if (g = d[a]) {
	      var k = f.loadFlags[g] || {}, l = c.needsTranspile_(k.lang || "es3");
	      "goog" == k.module || l ? c.importProcessedScript_(c.basePath + g, "goog" == k.module, l) : c.importScript_(c.basePath + g);
	    } else {
	      throw c.moduleLoaderState_ = h, Error("Undefined script input");
	    }
	  }
	  c.moduleLoaderState_ = h;
	}, c.getPathFromDeps_ = function(a) {
	  return a in c.dependencies_.nameToPath ? c.dependencies_.nameToPath[a] : null;
	}, c.findBasePath_(), c.global.CLOSURE_NO_DEPS || c.importScript_(c.basePath + "deps.js"));
	c.loadModule = function(a) {
	  var b = c.moduleLoaderState_;
	  try {
	    c.moduleLoaderState_ = {moduleName:void 0, declareLegacyNamespace:!1};
	    var d;
	    if (c.isFunction(a)) {
	      d = a.call(void 0, {});
	    } else {
	      if (c.isString(a)) {
	        d = c.loadModuleFromSource_.call(void 0, a);
	      } else {
	        throw Error("Invalid module definition");
	      }
	    }
	    var e = c.moduleLoaderState_.moduleName;
	    if (!c.isString(e) || !e) {
	      throw Error('Invalid module name "' + e + '"');
	    }
	    c.moduleLoaderState_.declareLegacyNamespace ? c.constructNamespace_(e, d) : c.SEAL_MODULE_EXPORTS && Object.seal && c.isObject(d) && Object.seal(d);
	    c.loadedModules_[e] = d;
	  } finally {
	    c.moduleLoaderState_ = b;
	  }
	};
	c.loadModuleFromSource_ = function(a) {
	  eval(a);
	  return {};
	};
	c.normalizePath_ = function(a) {
	  a = a.split("/");
	  for (var b = 0;b < a.length;) {
	    "." == a[b] ? a.splice(b, 1) : b && ".." == a[b] && a[b - 1] && ".." != a[b - 1] ? a.splice(--b, 2) : b++;
	  }
	  return a.join("/");
	};
	c.loadFileSync_ = function(a) {
	  if (c.global.CLOSURE_LOAD_FILE_SYNC) {
	    return c.global.CLOSURE_LOAD_FILE_SYNC(a);
	  }
	  try {
	    var b = new c.global.XMLHttpRequest;
	    b.open("get", a, !1);
	    b.send();
	    return 0 == b.status || 200 == b.status ? b.responseText : null;
	  } catch (d) {
	    return null;
	  }
	};
	c.retrieveAndExec_ = function() {
	};
	c.transpile_ = function(a, b) {
	  var d = c.global.$jscomp;
	  d || (c.global.$jscomp = d = {});
	  var e = d.transpile;
	  if (!e) {
	    var f = c.basePath + c.TRANSPILER, g = c.loadFileSync_(f);
	    if (g) {
	      eval(g + "\n//# sourceURL=" + f);
	      if (c.global.$gwtExport && c.global.$gwtExport.$jscomp && !c.global.$gwtExport.$jscomp.transpile) {
	        throw Error('The transpiler did not properly export the "transpile" method. $gwtExport: ' + JSON.stringify(c.global.$gwtExport));
	      }
	      c.global.$jscomp.transpile = c.global.$gwtExport.$jscomp.transpile;
	      d = c.global.$jscomp;
	      e = d.transpile;
	    }
	  }
	  e || (e = d.transpile = function(a, b) {
	    c.logToConsole_(b + " requires transpilation but no transpiler was found.");
	    return a;
	  });
	  return e(a, b);
	};
	c.typeOf = function(a) {
	  var b = typeof a;
	  if ("object" == b) {
	    if (a) {
	      if (a instanceof Array) {
	        return "array";
	      }
	      if (a instanceof Object) {
	        return b;
	      }
	      var d = Object.prototype.toString.call(a);
	      if ("[object Window]" == d) {
	        return "object";
	      }
	      if ("[object Array]" == d || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) {
	        return "array";
	      }
	      if ("[object Function]" == d || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) {
	        return "function";
	      }
	    } else {
	      return "null";
	    }
	  } else {
	    if ("function" == b && "undefined" == typeof a.call) {
	      return "object";
	    }
	  }
	  return b;
	};
	c.isNull = function(a) {
	  return null === a;
	};
	c.isDefAndNotNull = function(a) {
	  return null != a;
	};
	c.isArray = function(a) {
	  return "array" == c.typeOf(a);
	};
	c.isArrayLike = function(a) {
	  var b = c.typeOf(a);
	  return "array" == b || "object" == b && "number" == typeof a.length;
	};
	c.isDateLike = function(a) {
	  return c.isObject(a) && "function" == typeof a.getFullYear;
	};
	c.isString = function(a) {
	  return "string" == typeof a;
	};
	c.isBoolean = function(a) {
	  return "boolean" == typeof a;
	};
	c.isNumber = function(a) {
	  return "number" == typeof a;
	};
	c.isFunction = function(a) {
	  return "function" == c.typeOf(a);
	};
	c.isObject = function(a) {
	  var b = typeof a;
	  return "object" == b && null != a || "function" == b;
	};
	c.getUid = function(a) {
	  return a[c.UID_PROPERTY_] || (a[c.UID_PROPERTY_] = ++c.uidCounter_);
	};
	c.hasUid = function(a) {
	  return !!a[c.UID_PROPERTY_];
	};
	c.removeUid = function(a) {
	  null !== a && "removeAttribute" in a && a.removeAttribute(c.UID_PROPERTY_);
	  try {
	    delete a[c.UID_PROPERTY_];
	  } catch (b) {
	  }
	};
	c.UID_PROPERTY_ = "closure_uid_" + (1E9 * Math.random() >>> 0);
	c.uidCounter_ = 0;
	c.getHashCode = c.getUid;
	c.removeHashCode = c.removeUid;
	c.cloneObject = function(a) {
	  var b = c.typeOf(a);
	  if ("object" == b || "array" == b) {
	    if (a.clone) {
	      return a.clone();
	    }
	    var b = "array" == b ? [] : {}, d;
	    for (d in a) {
	      b[d] = c.cloneObject(a[d]);
	    }
	    return b;
	  }
	  return a;
	};
	c.bindNative_ = function(a, b, d) {
	  return a.call.apply(a.bind, arguments);
	};
	c.bindJs_ = function(a, b, d) {
	  if (!a) {
	    throw Error();
	  }
	  if (2 < arguments.length) {
	    var e = Array.prototype.slice.call(arguments, 2);
	    return function() {
	      var d = Array.prototype.slice.call(arguments);
	      Array.prototype.unshift.apply(d, e);
	      return a.apply(b, d);
	    };
	  }
	  return function() {
	    return a.apply(b, arguments);
	  };
	};
	c.bind = function(a, b, d) {
	  Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? c.bind = c.bindNative_ : c.bind = c.bindJs_;
	  return c.bind.apply(null, arguments);
	};
	c.partial = function(a, b) {
	  var d = Array.prototype.slice.call(arguments, 1);
	  return function() {
	    var b = d.slice();
	    b.push.apply(b, arguments);
	    return a.apply(this, b);
	  };
	};
	c.mixin = function(a, b) {
	  for (var d in b) {
	    a[d] = b[d];
	  }
	};
	c.now = c.TRUSTED_SITE && Date.now || function() {
	  return +new Date;
	};
	c.globalEval = function(a) {
	  if (c.global.execScript) {
	    c.global.execScript(a, "JavaScript");
	  } else {
	    if (c.global.eval) {
	      if (null == c.evalWorksForGlobals_) {
	        if (c.global.eval("var _evalTest_ = 1;"), "undefined" != typeof c.global._evalTest_) {
	          try {
	            delete c.global._evalTest_;
	          } catch (e) {
	          }
	          c.evalWorksForGlobals_ = !0;
	        } else {
	          c.evalWorksForGlobals_ = !1;
	        }
	      }
	      if (c.evalWorksForGlobals_) {
	        c.global.eval(a);
	      } else {
	        var b = c.global.document, d = b.createElement("SCRIPT");
	        d.type = "text/javascript";
	        d.defer = !1;
	        d.appendChild(b.createTextNode(a));
	        b.body.appendChild(d);
	        b.body.removeChild(d);
	      }
	    } else {
	      throw Error("goog.globalEval not available");
	    }
	  }
	};
	c.evalWorksForGlobals_ = null;
	c.getCssName = function(a, b) {
	  function d(a) {
	    a = a.split("-");
	    for (var b = [], d = 0;d < a.length;d++) {
	      b.push(e(a[d]));
	    }
	    return b.join("-");
	  }
	  function e(a) {
	    return c.cssNameMapping_[a] || a;
	  }
	  if ("." == String(a).charAt(0)) {
	    throw Error('className passed in goog.getCssName must not start with ".". You passed: ' + a);
	  }
	  var f;
	  f = c.cssNameMapping_ ? "BY_WHOLE" == c.cssNameMappingStyle_ ? e : d : function(a) {
	    return a;
	  };
	  a = b ? a + "-" + f(b) : f(a);
	  return c.global.CLOSURE_CSS_NAME_MAP_FN ? c.global.CLOSURE_CSS_NAME_MAP_FN(a) : a;
	};
	c.setCssNameMapping = function(a, b) {
	  c.cssNameMapping_ = a;
	  c.cssNameMappingStyle_ = b;
	};
	c.getMsg = function(a, b) {
	  b && (a = a.replace(/\{\$([^}]+)}/g, function(a, e) {
	    return null != b && e in b ? b[e] : a;
	  }));
	  return a;
	};
	c.getMsgWithFallback = function(a) {
	  return a;
	};
	c.exportSymbol = function(a, b, d) {
	  c.exportPath_(a, b, d);
	};
	c.exportProperty = function(a, b, d) {
	  a[b] = d;
	};
	c.inherits = function(a, b) {
	  function d() {
	  }
	  d.prototype = b.prototype;
	  a.superClass_ = b.prototype;
	  a.prototype = new d;
	  a.prototype.constructor = a;
	  a.base = function(a, d, g) {
	    for (var e = Array(arguments.length - 2), f = 2;f < arguments.length;f++) {
	      e[f - 2] = arguments[f];
	    }
	    return b.prototype[d].apply(a, e);
	  };
	};
	c.base = function(a, b, d) {
	  var e = arguments.callee.caller;
	  if (c.STRICT_MODE_COMPATIBLE || c.DEBUG && !e) {
	    throw Error("arguments.caller not defined.  goog.base() cannot be used with strict mode code. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
	  }
	  if (e.superClass_) {
	    for (var f = Array(arguments.length - 1), g = 1;g < arguments.length;g++) {
	      f[g - 1] = arguments[g];
	    }
	    return e.superClass_.constructor.apply(a, f);
	  }
	  f = Array(arguments.length - 2);
	  for (g = 2;g < arguments.length;g++) {
	    f[g - 2] = arguments[g];
	  }
	  for (var g = !1, h = a.constructor;h;h = h.superClass_ && h.superClass_.constructor) {
	    if (h.prototype[b] === e) {
	      g = !0;
	    } else {
	      if (g) {
	        return h.prototype[b].apply(a, f);
	      }
	    }
	  }
	  if (a[b] === e) {
	    return a.constructor.prototype[b].apply(a, f);
	  }
	  throw Error("goog.base called from a method of one name to a method of a different name");
	};
	c.scope = function(a) {
	  if (c.isInModuleLoader_()) {
	    throw Error("goog.scope is not supported within a goog.module.");
	  }
	  a.call(c.global);
	};
	c.defineClass = function(a, b) {
	  var d = b.constructor, e = b.statics;
	  d && d != Object.prototype.constructor || (d = function() {
	    throw Error("cannot instantiate an interface (no constructor defined).");
	  });
	  d = c.defineClass.createSealingConstructor_(d, a);
	  a && c.inherits(d, a);
	  delete b.constructor;
	  delete b.statics;
	  c.defineClass.applyProperties_(d.prototype, b);
	  null != e && (e instanceof Function ? e(d) : c.defineClass.applyProperties_(d, e));
	  return d;
	};
	c.defineClass.SEAL_CLASS_INSTANCES = c.DEBUG;
	c.defineClass.createSealingConstructor_ = function(a, b) {
	  function d() {
	    var b = a.apply(this, arguments) || this;
	    b[c.UID_PROPERTY_] = b[c.UID_PROPERTY_];
	    this.constructor === d && e && Object.seal instanceof Function && Object.seal(b);
	    return b;
	  }
	  if (!c.defineClass.SEAL_CLASS_INSTANCES) {
	    return a;
	  }
	  var e = !c.defineClass.isUnsealable_(b);
	  return d;
	};
	c.defineClass.isUnsealable_ = function(a) {
	  return a && a.prototype && a.prototype[c.UNSEALABLE_CONSTRUCTOR_PROPERTY_];
	};
	c.defineClass.OBJECT_PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
	c.defineClass.applyProperties_ = function(a, b) {
	  for (var d in b) {
	    Object.prototype.hasOwnProperty.call(b, d) && (a[d] = b[d]);
	  }
	  for (var e = 0;e < c.defineClass.OBJECT_PROTOTYPE_FIELDS_.length;e++) {
	    d = c.defineClass.OBJECT_PROTOTYPE_FIELDS_[e], Object.prototype.hasOwnProperty.call(b, d) && (a[d] = b[d]);
	  }
	};
	c.tagUnsealableClass = function() {
	};
	c.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = "goog_defineClass_legacy_unsealable";
	var q = {UnderscoreForm:{CONSTANT:"constant", LEADING:"leading", NO_UNDERSCORE:"no_underscore", MIDDLE:"middle", OPT_PREFIX:"opt_prefix", TRAILING:"trailing", VAR_ARGS:"var_args"}};
	function v(a, b) {
	  return a.loc.end.line === b.loc.start.line;
	}
	var w = {categorizeUnderscoredIdentifier:function(a) {
	  return "" === a || 0 === a.length ? q.UnderscoreForm.NO_UNDERSCORE : a.toUpperCase() === a ? q.UnderscoreForm.CONSTANT : -1 === a.indexOf("_") ? q.UnderscoreForm.NO_UNDERSCORE : "var_args" === a ? q.UnderscoreForm.VAR_ARGS : "opt_" === a.substring(0, 4) && "opt_" != a ? q.UnderscoreForm.OPT_PREFIX : "_" === a[0] ? q.UnderscoreForm.LEADING : "_" === a[a.length - 1] ? q.UnderscoreForm.TRAILING : q.UnderscoreForm.MIDDLE;
	}, escapeRegexp:function(a) {
	  return String(a).replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
	}, isUnderscored:function(a) {
	  return -1 < a.indexOf("_");
	}, isNodeConstructorFunction:function(a) {
	  return "FunctionExpression" === a.type && a.parent && "MethodDefinition" === a.parent.type && "constructor" === a.parent.kind;
	}, isNodeClassType:function(a) {
	  return "ClassExpression" === a.type || "ClassDeclaration" === a.type;
	}, isNodeGetterFunction:function(a) {
	  return "FunctionExpression" === a.type && a.parent && "Property" === a.parent.type && "get" === a.parent.kind;
	}, isNodeOneLine:function(a) {
	  return v(a, a);
	}, isNodeSetterFunction:function(a) {
	  return "FunctionExpression" === a.type && a.parent && "Property" === a.parent.type && "set" === a.parent.kind;
	}, isValidPrefix:function(a, b) {
	  return a.startsWith(b) ? a === b || "." === a[b.length] : !1;
	}, isTruthy:function(a) {
	  return !!a;
	}, nodesEndOnSameLine:function(a, b) {
	  return a.loc.end.line === b.loc.end.line;
	}, nodesShareOneLine:v, nodesStartOnSameLine:function(a, b) {
	  return a.loc.start.line === b.loc.start.line;
	}};
	var y = {allowVarArgs:!1, allowOptPrefix:!1, allowLeadingUnderscore:!0, allowTrailingUnderscore:!0, checkObjectProperties:!0};
	function z(a, b) {
	  function d(a) {
	    return Object.assign(g, {message:a});
	  }
	  function e(e, g) {
	    return A(e, a, b) ? f : d(g);
	  }
	  var f = {node:a, message:"", hasError:!1}, g = {node:a, message:"", hasError:!0};
	  switch(w.categorizeUnderscoredIdentifier(a.name)) {
	    case q.UnderscoreForm.CONSTANT:
	      return f;
	    case q.UnderscoreForm.LEADING:
	      return b.allowLeadingUnderscore ? e(a.name.replace(/^_+/g, "").replace(/_+$/g, ""), "Identifier '" + a.name + "' is not in camel case after the leading underscore.") : d("Leading underscores are not allowed in '" + a.name + "'.");
	    case q.UnderscoreForm.NO_UNDERSCORE:
	      return f;
	    case q.UnderscoreForm.MIDDLE:
	      return e(a.name, "Identifier '" + a.name + "' is not in camel case.");
	    case q.UnderscoreForm.OPT_PREFIX:
	      return b.allowOptPrefix ? e(a.name.replace(/^opt_/g, ""), "Identifier '" + a.name + "' is not in camel case after the opt_ prefix.") : d("The opt_ prefix is not allowed in '" + a.name + "'.");
	    case q.UnderscoreForm.TRAILING:
	      return b.allowTrailingUnderscore ? e(a.name.replace(/^_+/g, "").replace(/_+$/g, ""), "Identifier '" + a.name + "' is not in camel case before the trailing underscore.") : d("Trailing underscores are not allowed in '" + a.name + "'.");
	    case q.UnderscoreForm.VAR_ARGS:
	      return b.allowVarArgs ? f : d("The var_args identifier is not allowed.");
	    default:
	      throw Error("Unknown undercore form: " + a.name);
	  }
	}
	function A(a, b, d) {
	  var e = b.parent;
	  if (!w.isUnderscored(a)) {
	    return !0;
	  }
	  switch(e.type) {
	    case "MemberExpression":
	      e = b.parent;
	      if (!d.checkObjectProperties) {
	        return !0;
	      }
	      if (e.property === b) {
	        return e.parent && "AssignmentExpression" === e.parent.type ? e.parent.right === e : !0;
	      }
	      break;
	    case "Property":
	      e = b.parent;
	      if (!d.checkObjectProperties || e.parent && "ObjectPattern" === e.parent.type && e.key === b && e.value !== b) {
	        return !0;
	      }
	      break;
	    case "CallExpression":
	      return !0;
	  }
	  return !1;
	}
	;c.debug = {};
	c.debug.Error = function(a) {
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, c.debug.Error);
	  } else {
	    var b = Error().stack;
	    b && (this.stack = b);
	  }
	  a && (this.message = String(a));
	  this.reportErrorToServer = !0;
	};
	c.inherits(c.debug.Error, Error);
	c.debug.Error.prototype.name = "CustomError";
	c.dom = {};
	c.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
	c.string = {};
	c.string.DETECT_DOUBLE_ESCAPING = !1;
	c.string.FORCE_NON_DOM_HTML_UNESCAPING = !1;
	c.string.Unicode = {NBSP:"\u00a0"};
	c.string.startsWith = function(a, b) {
	  return 0 == a.lastIndexOf(b, 0);
	};
	c.string.endsWith = function(a, b) {
	  var d = a.length - b.length;
	  return 0 <= d && a.indexOf(b, d) == d;
	};
	c.string.caseInsensitiveStartsWith = function(a, b) {
	  return 0 == c.string.caseInsensitiveCompare(b, a.substr(0, b.length));
	};
	c.string.caseInsensitiveEndsWith = function(a, b) {
	  return 0 == c.string.caseInsensitiveCompare(b, a.substr(a.length - b.length, b.length));
	};
	c.string.caseInsensitiveEquals = function(a, b) {
	  return a.toLowerCase() == b.toLowerCase();
	};
	c.string.subs = function(a, b) {
	  for (var d = a.split("%s"), e = "", f = Array.prototype.slice.call(arguments, 1);f.length && 1 < d.length;) {
	    e += d.shift() + f.shift();
	  }
	  return e + d.join("%s");
	};
	c.string.collapseWhitespace = function(a) {
	  return a.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "");
	};
	c.string.isEmptyOrWhitespace = function(a) {
	  return /^[\s\xa0]*$/.test(a);
	};
	c.string.isEmptyString = function(a) {
	  return 0 == a.length;
	};
	c.string.isEmpty = c.string.isEmptyOrWhitespace;
	c.string.isEmptyOrWhitespaceSafe = function(a) {
	  return c.string.isEmptyOrWhitespace(c.string.makeSafe(a));
	};
	c.string.isEmptySafe = c.string.isEmptyOrWhitespaceSafe;
	c.string.isBreakingWhitespace = function(a) {
	  return !/[^\t\n\r ]/.test(a);
	};
	c.string.isAlpha = function(a) {
	  return !/[^a-zA-Z]/.test(a);
	};
	c.string.isNumeric = function(a) {
	  return !/[^0-9]/.test(a);
	};
	c.string.isAlphaNumeric = function(a) {
	  return !/[^a-zA-Z0-9]/.test(a);
	};
	c.string.isSpace = function(a) {
	  return " " == a;
	};
	c.string.isUnicodeChar = function(a) {
	  return 1 == a.length && " " <= a && "~" >= a || "\u0080" <= a && "\ufffd" >= a;
	};
	c.string.stripNewlines = function(a) {
	  return a.replace(/(\r\n|\r|\n)+/g, " ");
	};
	c.string.canonicalizeNewlines = function(a) {
	  return a.replace(/(\r\n|\r|\n)/g, "\n");
	};
	c.string.normalizeWhitespace = function(a) {
	  return a.replace(/\xa0|\s/g, " ");
	};
	c.string.normalizeSpaces = function(a) {
	  return a.replace(/\xa0|[ \t]+/g, " ");
	};
	c.string.collapseBreakingSpaces = function(a) {
	  return a.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "");
	};
	c.string.trim = c.TRUSTED_SITE && String.prototype.trim ? function(a) {
	  return a.trim();
	} : function(a) {
	  return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "");
	};
	c.string.trimLeft = function(a) {
	  return a.replace(/^[\s\xa0]+/, "");
	};
	c.string.trimRight = function(a) {
	  return a.replace(/[\s\xa0]+$/, "");
	};
	c.string.caseInsensitiveCompare = function(a, b) {
	  a = String(a).toLowerCase();
	  b = String(b).toLowerCase();
	  return a < b ? -1 : a == b ? 0 : 1;
	};
	c.string.numberAwareCompare_ = function(a, b, d) {
	  if (a == b) {
	    return 0;
	  }
	  if (!a) {
	    return -1;
	  }
	  if (!b) {
	    return 1;
	  }
	  for (var e = a.toLowerCase().match(d), f = b.toLowerCase().match(d), g = Math.min(e.length, f.length), h = 0;h < g;h++) {
	    d = e[h];
	    var k = f[h];
	    if (d != k) {
	      return a = parseInt(d, 10), !isNaN(a) && (b = parseInt(k, 10), !isNaN(b) && a - b) ? a - b : d < k ? -1 : 1;
	    }
	  }
	  return e.length != f.length ? e.length - f.length : a < b ? -1 : 1;
	};
	c.string.intAwareCompare = function(a, b) {
	  return c.string.numberAwareCompare_(a, b, /\d+|\D+/g);
	};
	c.string.floatAwareCompare = function(a, b) {
	  return c.string.numberAwareCompare_(a, b, /\d+|\.\d+|\D+/g);
	};
	c.string.numerateCompare = c.string.floatAwareCompare;
	c.string.urlEncode = function(a) {
	  return encodeURIComponent(String(a));
	};
	c.string.urlDecode = function(a) {
	  return decodeURIComponent(a.replace(/\+/g, " "));
	};
	c.string.newLineToBr = function(a, b) {
	  return a.replace(/(\r\n|\r|\n)/g, b ? "<br />" : "<br>");
	};
	c.string.htmlEscape = function(a, b) {
	  if (b) {
	    a = a.replace(c.string.AMP_RE_, "&amp;").replace(c.string.LT_RE_, "&lt;").replace(c.string.GT_RE_, "&gt;").replace(c.string.QUOT_RE_, "&quot;").replace(c.string.SINGLE_QUOTE_RE_, "&#39;").replace(c.string.NULL_RE_, "&#0;"), c.string.DETECT_DOUBLE_ESCAPING && (a = a.replace(c.string.E_RE_, "&#101;"));
	  } else {
	    if (!c.string.ALL_RE_.test(a)) {
	      return a;
	    }
	    -1 != a.indexOf("&") && (a = a.replace(c.string.AMP_RE_, "&amp;"));
	    -1 != a.indexOf("<") && (a = a.replace(c.string.LT_RE_, "&lt;"));
	    -1 != a.indexOf(">") && (a = a.replace(c.string.GT_RE_, "&gt;"));
	    -1 != a.indexOf('"') && (a = a.replace(c.string.QUOT_RE_, "&quot;"));
	    -1 != a.indexOf("'") && (a = a.replace(c.string.SINGLE_QUOTE_RE_, "&#39;"));
	    -1 != a.indexOf("\x00") && (a = a.replace(c.string.NULL_RE_, "&#0;"));
	    c.string.DETECT_DOUBLE_ESCAPING && -1 != a.indexOf("e") && (a = a.replace(c.string.E_RE_, "&#101;"));
	  }
	  return a;
	};
	c.string.AMP_RE_ = /&/g;
	c.string.LT_RE_ = /</g;
	c.string.GT_RE_ = />/g;
	c.string.QUOT_RE_ = /"/g;
	c.string.SINGLE_QUOTE_RE_ = /'/g;
	c.string.NULL_RE_ = /\x00/g;
	c.string.E_RE_ = /e/g;
	c.string.ALL_RE_ = c.string.DETECT_DOUBLE_ESCAPING ? /[\x00&<>"'e]/ : /[\x00&<>"']/;
	c.string.unescapeEntities = function(a) {
	  return c.string.contains(a, "&") ? !c.string.FORCE_NON_DOM_HTML_UNESCAPING && "document" in c.global ? c.string.unescapeEntitiesUsingDom_(a) : c.string.unescapePureXmlEntities_(a) : a;
	};
	c.string.unescapeEntitiesWithDocument = function(a, b) {
	  return c.string.contains(a, "&") ? c.string.unescapeEntitiesUsingDom_(a, b) : a;
	};
	c.string.unescapeEntitiesUsingDom_ = function(a, b) {
	  var d = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'}, e;
	  e = b ? b.createElement("div") : c.global.document.createElement("div");
	  return a.replace(c.string.HTML_ENTITY_PATTERN_, function(a, b) {
	    var f = d[a];
	    if (f) {
	      return f;
	    }
	    "#" == b.charAt(0) && (b = Number("0" + b.substr(1)), isNaN(b) || (f = String.fromCharCode(b)));
	    f || (e.innerHTML = a + " ", f = e.firstChild.nodeValue.slice(0, -1));
	    return d[a] = f;
	  });
	};
	c.string.unescapePureXmlEntities_ = function(a) {
	  return a.replace(/&([^;]+);/g, function(a, d) {
	    switch(d) {
	      case "amp":
	        return "&";
	      case "lt":
	        return "<";
	      case "gt":
	        return ">";
	      case "quot":
	        return '"';
	      default:
	        return "#" != d.charAt(0) || (d = Number("0" + d.substr(1)), isNaN(d)) ? a : String.fromCharCode(d);
	    }
	  });
	};
	c.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
	c.string.whitespaceEscape = function(a, b) {
	  return c.string.newLineToBr(a.replace(/  /g, " &#160;"), b);
	};
	c.string.preserveSpaces = function(a) {
	  return a.replace(/(^|[\n ]) /g, "$1" + c.string.Unicode.NBSP);
	};
	c.string.stripQuotes = function(a, b) {
	  for (var d = b.length, e = 0;e < d;e++) {
	    var f = 1 == d ? b : b.charAt(e);
	    if (a.charAt(0) == f && a.charAt(a.length - 1) == f) {
	      return a.substring(1, a.length - 1);
	    }
	  }
	  return a;
	};
	c.string.truncate = function(a, b, d) {
	  d && (a = c.string.unescapeEntities(a));
	  a.length > b && (a = a.substring(0, b - 3) + "...");
	  d && (a = c.string.htmlEscape(a));
	  return a;
	};
	c.string.truncateMiddle = function(a, b, d, e) {
	  d && (a = c.string.unescapeEntities(a));
	  if (e && a.length > b) {
	    e > b && (e = b);
	    var f = a.length - e;
	    a = a.substring(0, b - e) + "..." + a.substring(f);
	  } else {
	    a.length > b && (e = Math.floor(b / 2), f = a.length - e, a = a.substring(0, e + b % 2) + "..." + a.substring(f));
	  }
	  d && (a = c.string.htmlEscape(a));
	  return a;
	};
	c.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\", "<":"<"};
	c.string.jsEscapeCache_ = {"'":"\\'"};
	c.string.quote = function(a) {
	  a = String(a);
	  for (var b = ['"'], d = 0;d < a.length;d++) {
	    var e = a.charAt(d), f = e.charCodeAt(0);
	    b[d + 1] = c.string.specialEscapeChars_[e] || (31 < f && 127 > f ? e : c.string.escapeChar(e));
	  }
	  b.push('"');
	  return b.join("");
	};
	c.string.escapeString = function(a) {
	  for (var b = [], d = 0;d < a.length;d++) {
	    b[d] = c.string.escapeChar(a.charAt(d));
	  }
	  return b.join("");
	};
	c.string.escapeChar = function(a) {
	  if (a in c.string.jsEscapeCache_) {
	    return c.string.jsEscapeCache_[a];
	  }
	  if (a in c.string.specialEscapeChars_) {
	    return c.string.jsEscapeCache_[a] = c.string.specialEscapeChars_[a];
	  }
	  var b, d = a.charCodeAt(0);
	  if (31 < d && 127 > d) {
	    b = a;
	  } else {
	    if (256 > d) {
	      if (b = "\\x", 16 > d || 256 < d) {
	        b += "0";
	      }
	    } else {
	      b = "\\u", 4096 > d && (b += "0");
	    }
	    b += d.toString(16).toUpperCase();
	  }
	  return c.string.jsEscapeCache_[a] = b;
	};
	c.string.contains = function(a, b) {
	  return -1 != a.indexOf(b);
	};
	c.string.caseInsensitiveContains = function(a, b) {
	  return c.string.contains(a.toLowerCase(), b.toLowerCase());
	};
	c.string.countOf = function(a, b) {
	  return a && b ? a.split(b).length - 1 : 0;
	};
	c.string.removeAt = function(a, b, d) {
	  var e = a;
	  0 <= b && b < a.length && 0 < d && (e = a.substr(0, b) + a.substr(b + d, a.length - b - d));
	  return e;
	};
	c.string.remove = function(a, b) {
	  return a.replace(b, "");
	};
	c.string.removeAll = function(a, b) {
	  b = new RegExp(c.string.regExpEscape(b), "g");
	  return a.replace(b, "");
	};
	c.string.replaceAll = function(a, b, d) {
	  b = new RegExp(c.string.regExpEscape(b), "g");
	  return a.replace(b, d.replace(/\$/g, "$$$$"));
	};
	c.string.regExpEscape = function(a) {
	  return String(a).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
	};
	c.string.repeat = String.prototype.repeat ? function(a, b) {
	  return a.repeat(b);
	} : function(a, b) {
	  return Array(b + 1).join(a);
	};
	c.string.padNumber = function(a, b, d) {
	  a = c.isDef(d) ? a.toFixed(d) : String(a);
	  d = a.indexOf(".");
	  -1 == d && (d = a.length);
	  return c.string.repeat("0", Math.max(0, b - d)) + a;
	};
	c.string.makeSafe = function(a) {
	  return null == a ? "" : String(a);
	};
	c.string.buildString = function(a) {
	  return Array.prototype.join.call(arguments, "");
	};
	c.string.getRandomString = function() {
	  return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ c.now()).toString(36);
	};
	c.string.compareVersions = function(a, b) {
	  var d = 0;
	  a = c.string.trim(String(a)).split(".");
	  b = c.string.trim(String(b)).split(".");
	  for (var e = Math.max(a.length, b.length), f = 0;0 == d && f < e;f++) {
	    var g = a[f] || "", h = b[f] || "";
	    do {
	      g = /(\d*)(\D*)(.*)/.exec(g) || ["", "", "", ""];
	      h = /(\d*)(\D*)(.*)/.exec(h) || ["", "", "", ""];
	      if (0 == g[0].length && 0 == h[0].length) {
	        break;
	      }
	      var d = 0 == g[1].length ? 0 : parseInt(g[1], 10), k = 0 == h[1].length ? 0 : parseInt(h[1], 10), d = c.string.compareElements_(d, k) || c.string.compareElements_(0 == g[2].length, 0 == h[2].length) || c.string.compareElements_(g[2], h[2]), g = g[3], h = h[3];
	    } while (0 == d);
	  }
	  return d;
	};
	c.string.compareElements_ = function(a, b) {
	  return a < b ? -1 : a > b ? 1 : 0;
	};
	c.string.hashCode = function(a) {
	  for (var b = 0, d = 0;d < a.length;++d) {
	    b = 31 * b + a.charCodeAt(d) >>> 0;
	  }
	  return b;
	};
	c.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0;
	c.string.createUniqueString = function() {
	  return "goog_" + c.string.uniqueStringCounter_++;
	};
	c.string.toNumber = function(a) {
	  var b = Number(a);
	  return 0 == b && c.string.isEmptyOrWhitespace(a) ? NaN : b;
	};
	c.string.isLowerCamelCase = function(a) {
	  return /^[a-z]+([A-Z][a-z]*)*$/.test(a);
	};
	c.string.isUpperCamelCase = function(a) {
	  return /^([A-Z][a-z]*)+$/.test(a);
	};
	c.string.toCamelCase = function(a) {
	  return String(a).replace(/\-([a-z])/g, function(a, d) {
	    return d.toUpperCase();
	  });
	};
	c.string.toSelectorCase = function(a) {
	  return String(a).replace(/([A-Z])/g, "-$1").toLowerCase();
	};
	c.string.toTitleCase = function(a, b) {
	  b = c.isString(b) ? c.string.regExpEscape(b) : "\\s";
	  return a.replace(new RegExp("(^" + (b ? "|[" + b + "]+" : "") + ")([a-z])", "g"), function(a, b, f) {
	    return b + f.toUpperCase();
	  });
	};
	c.string.capitalize = function(a) {
	  return String(a.charAt(0)).toUpperCase() + String(a.substr(1)).toLowerCase();
	};
	c.string.parseInt = function(a) {
	  isFinite(a) && (a = String(a));
	  return c.isString(a) ? /^\s*-?0x/i.test(a) ? parseInt(a, 16) : parseInt(a, 10) : NaN;
	};
	c.string.splitLimit = function(a, b, d) {
	  a = a.split(b);
	  for (var e = [];0 < d && a.length;) {
	    e.push(a.shift()), d--;
	  }
	  a.length && e.push(a.join(b));
	  return e;
	};
	c.string.lastComponent = function(a, b) {
	  if (b) {
	    "string" == typeof b && (b = [b]);
	  } else {
	    return a;
	  }
	  for (var d = -1, e = 0;e < b.length;e++) {
	    if ("" != b[e]) {
	      var f = a.lastIndexOf(b[e]);
	      f > d && (d = f);
	    }
	  }
	  return -1 == d ? a : a.slice(d + 1);
	};
	c.string.editDistance = function(a, b) {
	  var d = [], e = [];
	  if (a == b) {
	    return 0;
	  }
	  if (!a.length || !b.length) {
	    return Math.max(a.length, b.length);
	  }
	  for (var f = 0;f < b.length + 1;f++) {
	    d[f] = f;
	  }
	  for (f = 0;f < a.length;f++) {
	    e[0] = f + 1;
	    for (var g = 0;g < b.length;g++) {
	      e[g + 1] = Math.min(e[g] + 1, d[g + 1] + 1, d[g] + Number(a[f] != b[g]));
	    }
	    for (g = 0;g < d.length;g++) {
	      d[g] = e[g];
	    }
	  }
	  return e[b.length];
	};
	c.asserts = {};
	c.asserts.ENABLE_ASSERTS = c.DEBUG;
	c.asserts.AssertionError = function(a, b) {
	  b.unshift(a);
	  c.debug.Error.call(this, c.string.subs.apply(null, b));
	  b.shift();
	  this.messagePattern = a;
	};
	c.inherits(c.asserts.AssertionError, c.debug.Error);
	c.asserts.AssertionError.prototype.name = "AssertionError";
	c.asserts.DEFAULT_ERROR_HANDLER = function(a) {
	  throw a;
	};
	c.asserts.errorHandler_ = c.asserts.DEFAULT_ERROR_HANDLER;
	c.asserts.doAssertFailure_ = function(a, b, d, e) {
	  var f = "Assertion failed";
	  if (d) {
	    var f = f + (": " + d), g = e;
	  } else {
	    a && (f += ": " + a, g = b);
	  }
	  a = new c.asserts.AssertionError("" + f, g || []);
	  c.asserts.errorHandler_(a);
	};
	c.asserts.setErrorHandler = function(a) {
	  c.asserts.ENABLE_ASSERTS && (c.asserts.errorHandler_ = a);
	};
	c.asserts.assert = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !a && c.asserts.doAssertFailure_("", null, b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.fail = function(a, b) {
	  c.asserts.ENABLE_ASSERTS && c.asserts.errorHandler_(new c.asserts.AssertionError("Failure" + (a ? ": " + a : ""), Array.prototype.slice.call(arguments, 1)));
	};
	c.asserts.assertNumber = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !c.isNumber(a) && c.asserts.doAssertFailure_("Expected number but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertString = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !c.isString(a) && c.asserts.doAssertFailure_("Expected string but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertFunction = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !c.isFunction(a) && c.asserts.doAssertFailure_("Expected function but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertObject = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !c.isObject(a) && c.asserts.doAssertFailure_("Expected object but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertArray = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !c.isArray(a) && c.asserts.doAssertFailure_("Expected array but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertBoolean = function(a, b, d) {
	  c.asserts.ENABLE_ASSERTS && !c.isBoolean(a) && c.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertElement = function(a, b, d) {
	  !c.asserts.ENABLE_ASSERTS || c.isObject(a) && a.nodeType == c.dom.NodeType.ELEMENT || c.asserts.doAssertFailure_("Expected Element but got %s: %s.", [c.typeOf(a), a], b, Array.prototype.slice.call(arguments, 2));
	  return a;
	};
	c.asserts.assertInstanceof = function(a, b, d, e) {
	  !c.asserts.ENABLE_ASSERTS || a instanceof b || c.asserts.doAssertFailure_("Expected instanceof %s but got %s.", [c.asserts.getType_(b), c.asserts.getType_(a)], d, Array.prototype.slice.call(arguments, 3));
	  return a;
	};
	c.asserts.assertObjectPrototypeIsIntact = function() {
	  for (var a in Object.prototype) {
	    c.asserts.fail(a + " should not be enumerable in Object.prototype.");
	  }
	};
	c.asserts.getType_ = function(a) {
	  return a instanceof Function ? a.displayName || a.name || "unknown type name" : a instanceof Object ? a.constructor.displayName || a.constructor.name || Object.prototype.toString.call(a) : null === a ? "null" : typeof a;
	};
	c.functions = {};
	c.functions.constant = function(a) {
	  return function() {
	    return a;
	  };
	};
	c.functions.FALSE = c.functions.constant(!1);
	c.functions.TRUE = c.functions.constant(!0);
	c.functions.NULL = c.functions.constant(null);
	c.functions.identity = function(a) {
	  return a;
	};
	c.functions.error = function(a) {
	  return function() {
	    throw Error(a);
	  };
	};
	c.functions.fail = function(a) {
	  return function() {
	    throw a;
	  };
	};
	c.functions.lock = function(a, b) {
	  b = b || 0;
	  return function() {
	    return a.apply(this, Array.prototype.slice.call(arguments, 0, b));
	  };
	};
	c.functions.nth = function(a) {
	  return function() {
	    return arguments[a];
	  };
	};
	c.functions.partialRight = function(a, b) {
	  var d = Array.prototype.slice.call(arguments, 1);
	  return function() {
	    var b = Array.prototype.slice.call(arguments);
	    b.push.apply(b, d);
	    return a.apply(this, b);
	  };
	};
	c.functions.withReturnValue = function(a, b) {
	  return c.functions.sequence(a, c.functions.constant(b));
	};
	c.functions.equalTo = function(a, b) {
	  return function(d) {
	    return b ? a == d : a === d;
	  };
	};
	c.functions.compose = function(a, b) {
	  var d = arguments, e = d.length;
	  return function() {
	    var a;
	    e && (a = d[e - 1].apply(this, arguments));
	    for (var b = e - 2;0 <= b;b--) {
	      a = d[b].call(this, a);
	    }
	    return a;
	  };
	};
	c.functions.sequence = function(a) {
	  var b = arguments, d = b.length;
	  return function() {
	    for (var a, f = 0;f < d;f++) {
	      a = b[f].apply(this, arguments);
	    }
	    return a;
	  };
	};
	c.functions.and = function(a) {
	  var b = arguments, d = b.length;
	  return function() {
	    for (var a = 0;a < d;a++) {
	      if (!b[a].apply(this, arguments)) {
	        return !1;
	      }
	    }
	    return !0;
	  };
	};
	c.functions.or = function(a) {
	  var b = arguments, d = b.length;
	  return function() {
	    for (var a = 0;a < d;a++) {
	      if (b[a].apply(this, arguments)) {
	        return !0;
	      }
	    }
	    return !1;
	  };
	};
	c.functions.not = function(a) {
	  return function() {
	    return !a.apply(this, arguments);
	  };
	};
	c.functions.create = function(a, b) {
	  function d() {
	  }
	  d.prototype = a.prototype;
	  var e = new d;
	  a.apply(e, Array.prototype.slice.call(arguments, 1));
	  return e;
	};
	c.functions.CACHE_RETURN_VALUE = !0;
	c.functions.cacheReturnValue = function(a) {
	  var b = !1, d;
	  return function() {
	    if (!c.functions.CACHE_RETURN_VALUE) {
	      return a();
	    }
	    b || (d = a(), b = !0);
	    return d;
	  };
	};
	c.functions.once = function(a) {
	  var b = a;
	  return function() {
	    if (b) {
	      var a = b;
	      b = null;
	      a();
	    }
	  };
	};
	c.functions.debounce = function(a, b, d) {
	  d && (a = c.bind(a, d));
	  var e = null;
	  return function(d) {
	    c.global.clearTimeout(e);
	    var f = arguments;
	    e = c.global.setTimeout(function() {
	      a.apply(null, f);
	    }, b);
	  };
	};
	c.functions.throttle = function(a, b, d) {
	  function e() {
	    g = c.global.setTimeout(f, b);
	    a.apply(null, k);
	  }
	  function f() {
	    g = null;
	    h && (h = !1, e());
	  }
	  d && (a = c.bind(a, d));
	  var g = null, h = !1, k = [];
	  return function(a) {
	    k = arguments;
	    g ? h = !0 : e();
	  };
	};
	c.array = {};
	c.NATIVE_ARRAY_PROTOTYPES = c.TRUSTED_SITE;
	c.array.ASSUME_NATIVE_FUNCTIONS = !1;
	c.array.peek = function(a) {
	  return a[a.length - 1];
	};
	c.array.last = c.array.peek;
	c.array.indexOf = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.indexOf) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.indexOf.call(a, b, d);
	} : function(a, b, d) {
	  d = null == d ? 0 : 0 > d ? Math.max(0, a.length + d) : d;
	  if (c.isString(a)) {
	    return c.isString(b) && 1 == b.length ? a.indexOf(b, d) : -1;
	  }
	  for (;d < a.length;d++) {
	    if (d in a && a[d] === b) {
	      return d;
	    }
	  }
	  return -1;
	};
	c.array.lastIndexOf = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.lastIndexOf) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.lastIndexOf.call(a, b, null == d ? a.length - 1 : d);
	} : function(a, b, d) {
	  d = null == d ? a.length - 1 : d;
	  0 > d && (d = Math.max(0, a.length + d));
	  if (c.isString(a)) {
	    return c.isString(b) && 1 == b.length ? a.lastIndexOf(b, d) : -1;
	  }
	  for (;0 <= d;d--) {
	    if (d in a && a[d] === b) {
	      return d;
	    }
	  }
	  return -1;
	};
	c.array.forEach = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.forEach) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  Array.prototype.forEach.call(a, b, d);
	} : function(a, b, d) {
	  for (var e = a.length, f = c.isString(a) ? a.split("") : a, g = 0;g < e;g++) {
	    g in f && b.call(d, f[g], g, a);
	  }
	};
	c.array.forEachRight = function(a, b, d) {
	  for (var e = a.length, f = c.isString(a) ? a.split("") : a, e = e - 1;0 <= e;--e) {
	    e in f && b.call(d, f[e], e, a);
	  }
	};
	c.array.filter = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.filter) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.filter.call(a, b, d);
	} : function(a, b, d) {
	  for (var e = a.length, f = [], g = 0, h = c.isString(a) ? a.split("") : a, k = 0;k < e;k++) {
	    if (k in h) {
	      var l = h[k];
	      b.call(d, l, k, a) && (f[g++] = l);
	    }
	  }
	  return f;
	};
	c.array.map = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.map) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.map.call(a, b, d);
	} : function(a, b, d) {
	  for (var e = a.length, f = Array(e), g = c.isString(a) ? a.split("") : a, h = 0;h < e;h++) {
	    h in g && (f[h] = b.call(d, g[h], h, a));
	  }
	  return f;
	};
	c.array.reduce = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduce) ? function(a, b, d, e) {
	  c.asserts.assert(null != a.length);
	  e && (b = c.bind(b, e));
	  return Array.prototype.reduce.call(a, b, d);
	} : function(a, b, d, e) {
	  var f = d;
	  c.array.forEach(a, function(d, h) {
	    f = b.call(e, f, d, h, a);
	  });
	  return f;
	};
	c.array.reduceRight = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduceRight) ? function(a, b, d, e) {
	  c.asserts.assert(null != a.length);
	  c.asserts.assert(null != b);
	  e && (b = c.bind(b, e));
	  return Array.prototype.reduceRight.call(a, b, d);
	} : function(a, b, d, e) {
	  var f = d;
	  c.array.forEachRight(a, function(d, h) {
	    f = b.call(e, f, d, h, a);
	  });
	  return f;
	};
	c.array.some = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.some) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.some.call(a, b, d);
	} : function(a, b, d) {
	  for (var e = a.length, f = c.isString(a) ? a.split("") : a, g = 0;g < e;g++) {
	    if (g in f && b.call(d, f[g], g, a)) {
	      return !0;
	    }
	  }
	  return !1;
	};
	c.array.every = c.NATIVE_ARRAY_PROTOTYPES && (c.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.every) ? function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.every.call(a, b, d);
	} : function(a, b, d) {
	  for (var e = a.length, f = c.isString(a) ? a.split("") : a, g = 0;g < e;g++) {
	    if (g in f && !b.call(d, f[g], g, a)) {
	      return !1;
	    }
	  }
	  return !0;
	};
	c.array.count = function(a, b, d) {
	  var e = 0;
	  c.array.forEach(a, function(a, g, h) {
	    b.call(d, a, g, h) && ++e;
	  }, d);
	  return e;
	};
	c.array.find = function(a, b, d) {
	  b = c.array.findIndex(a, b, d);
	  return 0 > b ? null : c.isString(a) ? a.charAt(b) : a[b];
	};
	c.array.findIndex = function(a, b, d) {
	  for (var e = a.length, f = c.isString(a) ? a.split("") : a, g = 0;g < e;g++) {
	    if (g in f && b.call(d, f[g], g, a)) {
	      return g;
	    }
	  }
	  return -1;
	};
	c.array.findRight = function(a, b, d) {
	  b = c.array.findIndexRight(a, b, d);
	  return 0 > b ? null : c.isString(a) ? a.charAt(b) : a[b];
	};
	c.array.findIndexRight = function(a, b, d) {
	  for (var e = a.length, f = c.isString(a) ? a.split("") : a, e = e - 1;0 <= e;e--) {
	    if (e in f && b.call(d, f[e], e, a)) {
	      return e;
	    }
	  }
	  return -1;
	};
	c.array.contains = function(a, b) {
	  return 0 <= c.array.indexOf(a, b);
	};
	c.array.isEmpty = function(a) {
	  return 0 == a.length;
	};
	c.array.clear = function(a) {
	  if (!c.isArray(a)) {
	    for (var b = a.length - 1;0 <= b;b--) {
	      delete a[b];
	    }
	  }
	  a.length = 0;
	};
	c.array.insert = function(a, b) {
	  c.array.contains(a, b) || a.push(b);
	};
	c.array.insertAt = function(a, b, d) {
	  c.array.splice(a, d, 0, b);
	};
	c.array.insertArrayAt = function(a, b, d) {
	  c.partial(c.array.splice, a, d, 0).apply(null, b);
	};
	c.array.insertBefore = function(a, b, d) {
	  var e;
	  2 == arguments.length || 0 > (e = c.array.indexOf(a, d)) ? a.push(b) : c.array.insertAt(a, b, e);
	};
	c.array.remove = function(a, b) {
	  b = c.array.indexOf(a, b);
	  var d;
	  (d = 0 <= b) && c.array.removeAt(a, b);
	  return d;
	};
	c.array.removeLast = function(a, b) {
	  b = c.array.lastIndexOf(a, b);
	  return 0 <= b ? (c.array.removeAt(a, b), !0) : !1;
	};
	c.array.removeAt = function(a, b) {
	  c.asserts.assert(null != a.length);
	  return 1 == Array.prototype.splice.call(a, b, 1).length;
	};
	c.array.removeIf = function(a, b, d) {
	  b = c.array.findIndex(a, b, d);
	  return 0 <= b ? (c.array.removeAt(a, b), !0) : !1;
	};
	c.array.removeAllIf = function(a, b, d) {
	  var e = 0;
	  c.array.forEachRight(a, function(f, g) {
	    b.call(d, f, g, a) && c.array.removeAt(a, g) && e++;
	  });
	  return e;
	};
	c.array.concat = function(a) {
	  return Array.prototype.concat.apply(Array.prototype, arguments);
	};
	c.array.join = function(a) {
	  return Array.prototype.concat.apply(Array.prototype, arguments);
	};
	c.array.toArray = function(a) {
	  var b = a.length;
	  if (0 < b) {
	    for (var d = Array(b), e = 0;e < b;e++) {
	      d[e] = a[e];
	    }
	    return d;
	  }
	  return [];
	};
	c.array.clone = c.array.toArray;
	c.array.extend = function(a, b) {
	  for (var d = 1;d < arguments.length;d++) {
	    var e = arguments[d];
	    if (c.isArrayLike(e)) {
	      var f = a.length || 0, g = e.length || 0;
	      a.length = f + g;
	      for (var h = 0;h < g;h++) {
	        a[f + h] = e[h];
	      }
	    } else {
	      a.push(e);
	    }
	  }
	};
	c.array.splice = function(a, b, d, e) {
	  c.asserts.assert(null != a.length);
	  return Array.prototype.splice.apply(a, c.array.slice(arguments, 1));
	};
	c.array.slice = function(a, b, d) {
	  c.asserts.assert(null != a.length);
	  return 2 >= arguments.length ? Array.prototype.slice.call(a, b) : Array.prototype.slice.call(a, b, d);
	};
	c.array.removeDuplicates = function(a, b, d) {
	  function e(a) {
	    return c.isObject(a) ? "o" + c.getUid(a) : (typeof a).charAt(0) + a;
	  }
	  b = b || a;
	  d = d || e;
	  for (var f = {}, g = 0, h = 0;h < a.length;) {
	    var k = a[h++], l = d(k);
	    Object.prototype.hasOwnProperty.call(f, l) || (f[l] = !0, b[g++] = k);
	  }
	  b.length = g;
	};
	c.array.binarySearch = function(a, b, d) {
	  return c.array.binarySearch_(a, d || c.array.defaultCompare, !1, b);
	};
	c.array.binarySelect = function(a, b, d) {
	  return c.array.binarySearch_(a, b, !0, void 0, d);
	};
	c.array.binarySearch_ = function(a, b, d, e, f) {
	  for (var g = 0, h = a.length, k;g < h;) {
	    var l = g + h >> 1, u;
	    u = d ? b.call(f, a[l], l, a) : b(e, a[l]);
	    0 < u ? g = l + 1 : (h = l, k = !u);
	  }
	  return k ? g : ~g;
	};
	c.array.sort = function(a, b) {
	  a.sort(b || c.array.defaultCompare);
	};
	c.array.stableSort = function(a, b) {
	  for (var d = Array(a.length), e = 0;e < a.length;e++) {
	    d[e] = {index:e, value:a[e]};
	  }
	  var f = b || c.array.defaultCompare;
	  c.array.sort(d, function(a, b) {
	    return f(a.value, b.value) || a.index - b.index;
	  });
	  for (e = 0;e < a.length;e++) {
	    a[e] = d[e].value;
	  }
	};
	c.array.sortByKey = function(a, b, d) {
	  var e = d || c.array.defaultCompare;
	  c.array.sort(a, function(a, d) {
	    return e(b(a), b(d));
	  });
	};
	c.array.sortObjectsByKey = function(a, b, d) {
	  c.array.sortByKey(a, function(a) {
	    return a[b];
	  }, d);
	};
	c.array.isSorted = function(a, b, d) {
	  b = b || c.array.defaultCompare;
	  for (var e = 1;e < a.length;e++) {
	    var f = b(a[e - 1], a[e]);
	    if (0 < f || 0 == f && d) {
	      return !1;
	    }
	  }
	  return !0;
	};
	c.array.equals = function(a, b, d) {
	  if (!c.isArrayLike(a) || !c.isArrayLike(b) || a.length != b.length) {
	    return !1;
	  }
	  var e = a.length;
	  d = d || c.array.defaultCompareEquality;
	  for (var f = 0;f < e;f++) {
	    if (!d(a[f], b[f])) {
	      return !1;
	    }
	  }
	  return !0;
	};
	c.array.compare3 = function(a, b, d) {
	  d = d || c.array.defaultCompare;
	  for (var e = Math.min(a.length, b.length), f = 0;f < e;f++) {
	    var g = d(a[f], b[f]);
	    if (0 != g) {
	      return g;
	    }
	  }
	  return c.array.defaultCompare(a.length, b.length);
	};
	c.array.defaultCompare = function(a, b) {
	  return a > b ? 1 : a < b ? -1 : 0;
	};
	c.array.inverseDefaultCompare = function(a, b) {
	  return -c.array.defaultCompare(a, b);
	};
	c.array.defaultCompareEquality = function(a, b) {
	  return a === b;
	};
	c.array.binaryInsert = function(a, b, d) {
	  d = c.array.binarySearch(a, b, d);
	  return 0 > d ? (c.array.insertAt(a, b, -(d + 1)), !0) : !1;
	};
	c.array.binaryRemove = function(a, b, d) {
	  b = c.array.binarySearch(a, b, d);
	  return 0 <= b ? c.array.removeAt(a, b) : !1;
	};
	c.array.bucket = function(a, b, d) {
	  for (var e = {}, f = 0;f < a.length;f++) {
	    var g = a[f], h = b.call(d, g, f, a);
	    c.isDef(h) && (e[h] || (e[h] = [])).push(g);
	  }
	  return e;
	};
	c.array.toObject = function(a, b, d) {
	  var e = {};
	  c.array.forEach(a, function(f, g) {
	    e[b.call(d, f, g, a)] = f;
	  });
	  return e;
	};
	c.array.range = function(a, b, d) {
	  var e = [], f = 0, g = a;
	  d = d || 1;
	  void 0 !== b && (f = a, g = b);
	  if (0 > d * (g - f)) {
	    return [];
	  }
	  if (0 < d) {
	    for (a = f;a < g;a += d) {
	      e.push(a);
	    }
	  } else {
	    for (a = f;a > g;a += d) {
	      e.push(a);
	    }
	  }
	  return e;
	};
	c.array.repeat = function(a, b) {
	  for (var d = [], e = 0;e < b;e++) {
	    d[e] = a;
	  }
	  return d;
	};
	c.array.flatten = function(a) {
	  for (var b = [], d = 0;d < arguments.length;d++) {
	    var e = arguments[d];
	    if (c.isArray(e)) {
	      for (var f = 0;f < e.length;f += 8192) {
	        for (var g = c.array.slice(e, f, f + 8192), g = c.array.flatten.apply(null, g), h = 0;h < g.length;h++) {
	          b.push(g[h]);
	        }
	      }
	    } else {
	      b.push(e);
	    }
	  }
	  return b;
	};
	c.array.rotate = function(a, b) {
	  c.asserts.assert(null != a.length);
	  a.length && (b %= a.length, 0 < b ? Array.prototype.unshift.apply(a, a.splice(-b, b)) : 0 > b && Array.prototype.push.apply(a, a.splice(0, -b)));
	  return a;
	};
	c.array.moveItem = function(a, b, d) {
	  c.asserts.assert(0 <= b && b < a.length);
	  c.asserts.assert(0 <= d && d < a.length);
	  b = Array.prototype.splice.call(a, b, 1);
	  Array.prototype.splice.call(a, d, 0, b[0]);
	};
	c.array.zip = function(a) {
	  if (!arguments.length) {
	    return [];
	  }
	  for (var b = [], d = arguments[0].length, e = 1;e < arguments.length;e++) {
	    arguments[e].length < d && (d = arguments[e].length);
	  }
	  for (e = 0;e < d;e++) {
	    for (var f = [], g = 0;g < arguments.length;g++) {
	      f.push(arguments[g][e]);
	    }
	    b.push(f);
	  }
	  return b;
	};
	c.array.shuffle = function(a, b) {
	  b = b || Math.random;
	  for (var d = a.length - 1;0 < d;d--) {
	    var e = Math.floor(b() * (d + 1)), f = a[d];
	    a[d] = a[e];
	    a[e] = f;
	  }
	};
	c.array.copyByIndex = function(a, b) {
	  var d = [];
	  c.array.forEach(b, function(b) {
	    d.push(a[b]);
	  });
	  return d;
	};
	c.array.concatMap = function(a, b, d) {
	  return c.array.concat.apply([], c.array.map(a, b, d));
	};
	c.object = {};
	c.object.is = function(a, b) {
	  return a === b ? 0 !== a || 1 / a === 1 / b : a !== a && b !== b;
	};
	c.object.forEach = function(a, b, d) {
	  for (var e in a) {
	    b.call(d, a[e], e, a);
	  }
	};
	c.object.filter = function(a, b, d) {
	  var e = {}, f;
	  for (f in a) {
	    b.call(d, a[f], f, a) && (e[f] = a[f]);
	  }
	  return e;
	};
	c.object.map = function(a, b, d) {
	  var e = {}, f;
	  for (f in a) {
	    e[f] = b.call(d, a[f], f, a);
	  }
	  return e;
	};
	c.object.some = function(a, b, d) {
	  for (var e in a) {
	    if (b.call(d, a[e], e, a)) {
	      return !0;
	    }
	  }
	  return !1;
	};
	c.object.every = function(a, b, d) {
	  for (var e in a) {
	    if (!b.call(d, a[e], e, a)) {
	      return !1;
	    }
	  }
	  return !0;
	};
	c.object.getCount = function(a) {
	  var b = 0, d;
	  for (d in a) {
	    b++;
	  }
	  return b;
	};
	c.object.getAnyKey = function(a) {
	  for (var b in a) {
	    return b;
	  }
	};
	c.object.getAnyValue = function(a) {
	  for (var b in a) {
	    return a[b];
	  }
	};
	c.object.contains = function(a, b) {
	  return c.object.containsValue(a, b);
	};
	c.object.getValues = function(a) {
	  var b = [], d = 0, e;
	  for (e in a) {
	    b[d++] = a[e];
	  }
	  return b;
	};
	c.object.getKeys = function(a) {
	  var b = [], d = 0, e;
	  for (e in a) {
	    b[d++] = e;
	  }
	  return b;
	};
	c.object.getValueByKeys = function(a, b) {
	  for (var d = c.isArrayLike(b), e = d ? b : arguments, d = d ? 0 : 1;d < e.length && (a = a[e[d]], c.isDef(a));d++) {
	  }
	  return a;
	};
	c.object.containsKey = function(a, b) {
	  return null !== a && b in a;
	};
	c.object.containsValue = function(a, b) {
	  for (var d in a) {
	    if (a[d] == b) {
	      return !0;
	    }
	  }
	  return !1;
	};
	c.object.findKey = function(a, b, d) {
	  for (var e in a) {
	    if (b.call(d, a[e], e, a)) {
	      return e;
	    }
	  }
	};
	c.object.findValue = function(a, b, d) {
	  return (b = c.object.findKey(a, b, d)) && a[b];
	};
	c.object.isEmpty = function(a) {
	  for (var b in a) {
	    return !1;
	  }
	  return !0;
	};
	c.object.clear = function(a) {
	  for (var b in a) {
	    delete a[b];
	  }
	};
	c.object.remove = function(a, b) {
	  var d;
	  (d = b in a) && delete a[b];
	  return d;
	};
	c.object.add = function(a, b, d) {
	  if (null !== a && b in a) {
	    throw Error('The object already contains the key "' + b + '"');
	  }
	  c.object.set(a, b, d);
	};
	c.object.get = function(a, b, d) {
	  return null !== a && b in a ? a[b] : d;
	};
	c.object.set = function(a, b, d) {
	  a[b] = d;
	};
	c.object.setIfUndefined = function(a, b, d) {
	  return b in a ? a[b] : a[b] = d;
	};
	c.object.setWithReturnValueIfNotSet = function(a, b, d) {
	  if (b in a) {
	    return a[b];
	  }
	  d = d();
	  return a[b] = d;
	};
	c.object.equals = function(a, b) {
	  for (var d in a) {
	    if (!(d in b) || a[d] !== b[d]) {
	      return !1;
	    }
	  }
	  for (d in b) {
	    if (!(d in a)) {
	      return !1;
	    }
	  }
	  return !0;
	};
	c.object.clone = function(a) {
	  var b = {}, d;
	  for (d in a) {
	    b[d] = a[d];
	  }
	  return b;
	};
	c.object.unsafeClone = function(a) {
	  var b = c.typeOf(a);
	  if ("object" == b || "array" == b) {
	    if (c.isFunction(a.clone)) {
	      return a.clone();
	    }
	    var b = "array" == b ? [] : {}, d;
	    for (d in a) {
	      b[d] = c.object.unsafeClone(a[d]);
	    }
	    return b;
	  }
	  return a;
	};
	c.object.transpose = function(a) {
	  var b = {}, d;
	  for (d in a) {
	    b[a[d]] = d;
	  }
	  return b;
	};
	c.object.PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
	c.object.extend = function(a, b) {
	  for (var d, e, f = 1;f < arguments.length;f++) {
	    e = arguments[f];
	    for (d in e) {
	      a[d] = e[d];
	    }
	    for (var g = 0;g < c.object.PROTOTYPE_FIELDS_.length;g++) {
	      d = c.object.PROTOTYPE_FIELDS_[g], Object.prototype.hasOwnProperty.call(e, d) && (a[d] = e[d]);
	    }
	  }
	};
	c.object.create = function(a) {
	  var b = arguments.length;
	  if (1 == b && c.isArray(arguments[0])) {
	    return c.object.create.apply(null, arguments[0]);
	  }
	  if (b % 2) {
	    throw Error("Uneven number of arguments");
	  }
	  for (var d = {}, e = 0;e < b;e += 2) {
	    d[arguments[e]] = arguments[e + 1];
	  }
	  return d;
	};
	c.object.createSet = function(a) {
	  var b = arguments.length;
	  if (1 == b && c.isArray(arguments[0])) {
	    return c.object.createSet.apply(null, arguments[0]);
	  }
	  for (var d = {}, e = 0;e < b;e++) {
	    d[arguments[e]] = !0;
	  }
	  return d;
	};
	c.object.createImmutableView = function(a) {
	  var b = a;
	  Object.isFrozen && !Object.isFrozen(a) && (b = Object.create(a), Object.freeze(b));
	  return b;
	};
	c.object.isImmutableView = function(a) {
	  return !!Object.isFrozen && Object.isFrozen(a);
	};
	c.math = {};
	c.math.randomInt = function(a) {
	  return Math.floor(Math.random() * a);
	};
	c.math.uniformRandom = function(a, b) {
	  return a + Math.random() * (b - a);
	};
	c.math.clamp = function(a, b, d) {
	  return Math.min(Math.max(a, b), d);
	};
	c.math.modulo = function(a, b) {
	  a %= b;
	  return 0 > a * b ? a + b : a;
	};
	c.math.lerp = function(a, b, d) {
	  return a + d * (b - a);
	};
	c.math.nearlyEquals = function(a, b, d) {
	  return Math.abs(a - b) <= (d || 1E-6);
	};
	c.math.standardAngle = function(a) {
	  return c.math.modulo(a, 360);
	};
	c.math.standardAngleInRadians = function(a) {
	  return c.math.modulo(a, 2 * Math.PI);
	};
	c.math.toRadians = function(a) {
	  return a * Math.PI / 180;
	};
	c.math.toDegrees = function(a) {
	  return 180 * a / Math.PI;
	};
	c.math.angleDx = function(a, b) {
	  return b * Math.cos(c.math.toRadians(a));
	};
	c.math.angleDy = function(a, b) {
	  return b * Math.sin(c.math.toRadians(a));
	};
	c.math.angle = function(a, b, d, e) {
	  return c.math.standardAngle(c.math.toDegrees(Math.atan2(e - b, d - a)));
	};
	c.math.angleDifference = function(a, b) {
	  a = c.math.standardAngle(b) - c.math.standardAngle(a);
	  180 < a ? a -= 360 : -180 >= a && (a = 360 + a);
	  return a;
	};
	c.math.sign = function(a) {
	  return 0 < a ? 1 : 0 > a ? -1 : a;
	};
	c.math.longestCommonSubsequence = function(a, b, d, e) {
	  d = d || function(a, b) {
	    return a == b;
	  };
	  e = e || function(b) {
	    return a[b];
	  };
	  for (var f = a.length, g = b.length, h = [], k = 0;k < f + 1;k++) {
	    h[k] = [], h[k][0] = 0;
	  }
	  for (var l = 0;l < g + 1;l++) {
	    h[0][l] = 0;
	  }
	  for (k = 1;k <= f;k++) {
	    for (l = 1;l <= g;l++) {
	      d(a[k - 1], b[l - 1]) ? h[k][l] = h[k - 1][l - 1] + 1 : h[k][l] = Math.max(h[k - 1][l], h[k][l - 1]);
	    }
	  }
	  for (var u = [], k = f, l = g;0 < k && 0 < l;) {
	    d(a[k - 1], b[l - 1]) ? (u.unshift(e(k - 1, l - 1)), k--, l--) : h[k - 1][l] > h[k][l - 1] ? k-- : l--;
	  }
	  return u;
	};
	c.math.sum = function(a) {
	  return c.array.reduce(arguments, function(a, d) {
	    return a + d;
	  }, 0);
	};
	c.math.average = function(a) {
	  return c.math.sum.apply(null, arguments) / arguments.length;
	};
	c.math.sampleVariance = function(a) {
	  var b = arguments.length;
	  if (2 > b) {
	    return 0;
	  }
	  var d = c.math.average.apply(null, arguments);
	  return c.math.sum.apply(null, c.array.map(arguments, function(a) {
	    return Math.pow(a - d, 2);
	  })) / (b - 1);
	};
	c.math.standardDeviation = function(a) {
	  return Math.sqrt(c.math.sampleVariance.apply(null, arguments));
	};
	c.math.isInt = function(a) {
	  return isFinite(a) && 0 == a % 1;
	};
	c.math.isFiniteNumber = function(a) {
	  return isFinite(a) && !isNaN(a);
	};
	c.math.isNegativeZero = function(a) {
	  return 0 == a && 0 > 1 / a;
	};
	c.math.log10Floor = function(a) {
	  if (0 < a) {
	    var b = Math.round(Math.log(a) * Math.LOG10E);
	    return b - (parseFloat("1e" + b) > a ? 1 : 0);
	  }
	  return 0 == a ? -Infinity : NaN;
	};
	c.math.safeFloor = function(a, b) {
	  c.asserts.assert(!c.isDef(b) || 0 < b);
	  return Math.floor(a + (b || 2E-15));
	};
	c.math.safeCeil = function(a, b) {
	  c.asserts.assert(!c.isDef(b) || 0 < b);
	  return Math.ceil(a - (b || 2E-15));
	};
	c.iter = {};
	c.iter.StopIteration = "StopIteration" in c.global ? c.global.StopIteration : {message:"StopIteration", stack:""};
	c.iter.Iterator = function() {
	};
	c.iter.Iterator.prototype.next = function() {
	  throw c.iter.StopIteration;
	};
	c.iter.Iterator.prototype.__iterator__ = function() {
	  return this;
	};
	c.iter.toIterator = function(a) {
	  if (a instanceof c.iter.Iterator) {
	    return a;
	  }
	  if ("function" == typeof a.__iterator__) {
	    return a.__iterator__(!1);
	  }
	  if (c.isArrayLike(a)) {
	    var b = 0, d = new c.iter.Iterator;
	    d.next = function() {
	      for (;;) {
	        if (b >= a.length) {
	          throw c.iter.StopIteration;
	        }
	        if (b in a) {
	          return a[b++];
	        }
	        b++;
	      }
	    };
	    return d;
	  }
	  throw Error("Not implemented");
	};
	c.iter.forEach = function(a, b, d) {
	  if (c.isArrayLike(a)) {
	    try {
	      c.array.forEach(a, b, d);
	    } catch (e) {
	      if (e !== c.iter.StopIteration) {
	        throw e;
	      }
	    }
	  } else {
	    a = c.iter.toIterator(a);
	    try {
	      for (;;) {
	        b.call(d, a.next(), void 0, a);
	      }
	    } catch (e) {
	      if (e !== c.iter.StopIteration) {
	        throw e;
	      }
	    }
	  }
	};
	c.iter.filter = function(a, b, d) {
	  var e = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  a.next = function() {
	    for (;;) {
	      var a = e.next();
	      if (b.call(d, a, void 0, e)) {
	        return a;
	      }
	    }
	  };
	  return a;
	};
	c.iter.filterFalse = function(a, b, d) {
	  return c.iter.filter(a, c.functions.not(b), d);
	};
	c.iter.range = function(a, b, d) {
	  var e = 0, f = a, g = d || 1;
	  1 < arguments.length && (e = a, f = b);
	  if (0 == g) {
	    throw Error("Range step argument must not be zero");
	  }
	  var h = new c.iter.Iterator;
	  h.next = function() {
	    if (0 < g && e >= f || 0 > g && e <= f) {
	      throw c.iter.StopIteration;
	    }
	    var a = e;
	    e += g;
	    return a;
	  };
	  return h;
	};
	c.iter.join = function(a, b) {
	  return c.iter.toArray(a).join(b);
	};
	c.iter.map = function(a, b, d) {
	  var e = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  a.next = function() {
	    var a = e.next();
	    return b.call(d, a, void 0, e);
	  };
	  return a;
	};
	c.iter.reduce = function(a, b, d, e) {
	  var f = d;
	  c.iter.forEach(a, function(a) {
	    f = b.call(e, f, a);
	  });
	  return f;
	};
	c.iter.some = function(a, b, d) {
	  a = c.iter.toIterator(a);
	  try {
	    for (;;) {
	      if (b.call(d, a.next(), void 0, a)) {
	        return !0;
	      }
	    }
	  } catch (e) {
	    if (e !== c.iter.StopIteration) {
	      throw e;
	    }
	  }
	  return !1;
	};
	c.iter.every = function(a, b, d) {
	  a = c.iter.toIterator(a);
	  try {
	    for (;;) {
	      if (!b.call(d, a.next(), void 0, a)) {
	        return !1;
	      }
	    }
	  } catch (e) {
	    if (e !== c.iter.StopIteration) {
	      throw e;
	    }
	  }
	  return !0;
	};
	c.iter.chain = function(a) {
	  return c.iter.chainFromIterable(arguments);
	};
	c.iter.chainFromIterable = function(a) {
	  var b = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  var d = null;
	  a.next = function() {
	    for (;;) {
	      if (null == d) {
	        var a = b.next();
	        d = c.iter.toIterator(a);
	      }
	      try {
	        return d.next();
	      } catch (f) {
	        if (f !== c.iter.StopIteration) {
	          throw f;
	        }
	        d = null;
	      }
	    }
	  };
	  return a;
	};
	c.iter.dropWhile = function(a, b, d) {
	  var e = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  var f = !0;
	  a.next = function() {
	    for (;;) {
	      var a = e.next();
	      if (!f || !b.call(d, a, void 0, e)) {
	        return f = !1, a;
	      }
	    }
	  };
	  return a;
	};
	c.iter.takeWhile = function(a, b, d) {
	  var e = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  a.next = function() {
	    var a = e.next();
	    if (b.call(d, a, void 0, e)) {
	      return a;
	    }
	    throw c.iter.StopIteration;
	  };
	  return a;
	};
	c.iter.toArray = function(a) {
	  if (c.isArrayLike(a)) {
	    return c.array.toArray(a);
	  }
	  a = c.iter.toIterator(a);
	  var b = [];
	  c.iter.forEach(a, function(a) {
	    b.push(a);
	  });
	  return b;
	};
	c.iter.equals = function(a, b, d) {
	  a = c.iter.zipLongest({}, a, b);
	  var e = d || c.array.defaultCompareEquality;
	  return c.iter.every(a, function(a) {
	    return e(a[0], a[1]);
	  });
	};
	c.iter.nextOrValue = function(a, b) {
	  try {
	    return c.iter.toIterator(a).next();
	  } catch (d) {
	    if (d != c.iter.StopIteration) {
	      throw d;
	    }
	    return b;
	  }
	};
	c.iter.product = function(a) {
	  if (c.array.some(arguments, function(a) {
	    return !a.length;
	  }) || !arguments.length) {
	    return new c.iter.Iterator;
	  }
	  var b = new c.iter.Iterator, d = arguments, e = c.array.repeat(0, d.length);
	  b.next = function() {
	    if (e) {
	      for (var a = c.array.map(e, function(a, b) {
	        return d[b][a];
	      }), b = e.length - 1;0 <= b;b--) {
	        c.asserts.assert(e);
	        if (e[b] < d[b].length - 1) {
	          e[b]++;
	          break;
	        }
	        if (0 == b) {
	          e = null;
	          break;
	        }
	        e[b] = 0;
	      }
	      return a;
	    }
	    throw c.iter.StopIteration;
	  };
	  return b;
	};
	c.iter.cycle = function(a) {
	  var b = c.iter.toIterator(a), d = [], e = 0;
	  a = new c.iter.Iterator;
	  var f = !1;
	  a.next = function() {
	    var a = null;
	    if (!f) {
	      try {
	        return a = b.next(), d.push(a), a;
	      } catch (h) {
	        if (h != c.iter.StopIteration || c.array.isEmpty(d)) {
	          throw h;
	        }
	        f = !0;
	      }
	    }
	    a = d[e];
	    e = (e + 1) % d.length;
	    return a;
	  };
	  return a;
	};
	c.iter.count = function(a, b) {
	  var d = a || 0, e = c.isDef(b) ? b : 1;
	  a = new c.iter.Iterator;
	  a.next = function() {
	    var a = d;
	    d += e;
	    return a;
	  };
	  return a;
	};
	c.iter.repeat = function(a) {
	  var b = new c.iter.Iterator;
	  b.next = c.functions.constant(a);
	  return b;
	};
	c.iter.accumulate = function(a) {
	  var b = c.iter.toIterator(a), d = 0;
	  a = new c.iter.Iterator;
	  a.next = function() {
	    return d += b.next();
	  };
	  return a;
	};
	c.iter.zip = function(a) {
	  var b = arguments, d = new c.iter.Iterator;
	  if (0 < b.length) {
	    var e = c.array.map(b, c.iter.toIterator);
	    d.next = function() {
	      return c.array.map(e, function(a) {
	        return a.next();
	      });
	    };
	  }
	  return d;
	};
	c.iter.zipLongest = function(a, b) {
	  var d = c.array.slice(arguments, 1), e = new c.iter.Iterator;
	  if (0 < d.length) {
	    var f = c.array.map(d, c.iter.toIterator);
	    e.next = function() {
	      var b = !1, d = c.array.map(f, function(d) {
	        var e;
	        try {
	          e = d.next(), b = !0;
	        } catch (u) {
	          if (u !== c.iter.StopIteration) {
	            throw u;
	          }
	          e = a;
	        }
	        return e;
	      });
	      if (!b) {
	        throw c.iter.StopIteration;
	      }
	      return d;
	    };
	  }
	  return e;
	};
	c.iter.compress = function(a, b) {
	  var d = c.iter.toIterator(b);
	  return c.iter.filter(a, function() {
	    return !!d.next();
	  });
	};
	c.iter.GroupByIterator_ = function(a, b) {
	  this.iterator = c.iter.toIterator(a);
	  this.keyFunc = b || c.functions.identity;
	};
	c.inherits(c.iter.GroupByIterator_, c.iter.Iterator);
	c.iter.GroupByIterator_.prototype.next = function() {
	  for (;this.currentKey == this.targetKey;) {
	    this.currentValue = this.iterator.next(), this.currentKey = this.keyFunc(this.currentValue);
	  }
	  this.targetKey = this.currentKey;
	  return [this.currentKey, this.groupItems_(this.targetKey)];
	};
	c.iter.GroupByIterator_.prototype.groupItems_ = function(a) {
	  for (var b = [];this.currentKey == a;) {
	    b.push(this.currentValue);
	    try {
	      this.currentValue = this.iterator.next();
	    } catch (d) {
	      if (d !== c.iter.StopIteration) {
	        throw d;
	      }
	      break;
	    }
	    this.currentKey = this.keyFunc(this.currentValue);
	  }
	  return b;
	};
	c.iter.groupBy = function(a, b) {
	  return new c.iter.GroupByIterator_(a, b);
	};
	c.iter.starMap = function(a, b, d) {
	  var e = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  a.next = function() {
	    var a = c.iter.toArray(e.next());
	    return b.apply(d, c.array.concat(a, void 0, e));
	  };
	  return a;
	};
	c.iter.tee = function(a, b) {
	  function d() {
	    var a = e.next();
	    c.array.forEach(f, function(b) {
	      b.push(a);
	    });
	  }
	  var e = c.iter.toIterator(a);
	  a = c.isNumber(b) ? b : 2;
	  var f = c.array.map(c.array.range(a), function() {
	    return [];
	  });
	  return c.array.map(f, function(a) {
	    var b = new c.iter.Iterator;
	    b.next = function() {
	      c.array.isEmpty(a) && d();
	      c.asserts.assert(!c.array.isEmpty(a));
	      return a.shift();
	    };
	    return b;
	  });
	};
	c.iter.enumerate = function(a, b) {
	  return c.iter.zip(c.iter.count(b), a);
	};
	c.iter.limit = function(a, b) {
	  c.asserts.assert(c.math.isInt(b) && 0 <= b);
	  var d = c.iter.toIterator(a);
	  a = new c.iter.Iterator;
	  var e = b;
	  a.next = function() {
	    if (0 < e--) {
	      return d.next();
	    }
	    throw c.iter.StopIteration;
	  };
	  return a;
	};
	c.iter.consume = function(a, b) {
	  c.asserts.assert(c.math.isInt(b) && 0 <= b);
	  for (a = c.iter.toIterator(a);0 < b--;) {
	    c.iter.nextOrValue(a, null);
	  }
	  return a;
	};
	c.iter.slice = function(a, b, d) {
	  c.asserts.assert(c.math.isInt(b) && 0 <= b);
	  a = c.iter.consume(a, b);
	  c.isNumber(d) && (c.asserts.assert(c.math.isInt(d) && d >= b), a = c.iter.limit(a, d - b));
	  return a;
	};
	c.iter.hasDuplicates_ = function(a) {
	  var b = [];
	  c.array.removeDuplicates(a, b);
	  return a.length != b.length;
	};
	c.iter.permutations = function(a, b) {
	  a = c.iter.toArray(a);
	  b = c.isNumber(b) ? b : a.length;
	  b = c.array.repeat(a, b);
	  b = c.iter.product.apply(void 0, b);
	  return c.iter.filter(b, function(a) {
	    return !c.iter.hasDuplicates_(a);
	  });
	};
	c.iter.combinations = function(a, b) {
	  function d(a) {
	    return e[a];
	  }
	  var e = c.iter.toArray(a);
	  a = c.iter.range(e.length);
	  b = c.iter.permutations(a, b);
	  var f = c.iter.filter(b, function(a) {
	    return c.array.isSorted(a);
	  });
	  b = new c.iter.Iterator;
	  b.next = function() {
	    return c.array.map(f.next(), d);
	  };
	  return b;
	};
	c.iter.combinationsWithReplacement = function(a, b) {
	  function d(a) {
	    return e[a];
	  }
	  var e = c.iter.toArray(a);
	  a = c.array.range(e.length);
	  b = c.array.repeat(a, b);
	  b = c.iter.product.apply(void 0, b);
	  var f = c.iter.filter(b, function(a) {
	    return c.array.isSorted(a);
	  });
	  b = new c.iter.Iterator;
	  b.next = function() {
	    return c.array.map(f.next(), d);
	  };
	  return b;
	};
	c.structs = {};
	c.structs.Map = function(a, b) {
	  this.map_ = {};
	  this.keys_ = [];
	  this.version_ = this.count_ = 0;
	  var d = arguments.length;
	  if (1 < d) {
	    if (d % 2) {
	      throw Error("Uneven number of arguments");
	    }
	    for (var e = 0;e < d;e += 2) {
	      this.set(arguments[e], arguments[e + 1]);
	    }
	  } else {
	    a && this.addAll(a);
	  }
	};
	c.structs.Map.prototype.getCount = function() {
	  return this.count_;
	};
	c.structs.Map.prototype.getValues = function() {
	  this.cleanupKeysArray_();
	  for (var a = [], b = 0;b < this.keys_.length;b++) {
	    a.push(this.map_[this.keys_[b]]);
	  }
	  return a;
	};
	c.structs.Map.prototype.getKeys = function() {
	  this.cleanupKeysArray_();
	  return this.keys_.concat();
	};
	c.structs.Map.prototype.containsKey = function(a) {
	  return c.structs.Map.hasKey_(this.map_, a);
	};
	c.structs.Map.prototype.containsValue = function(a) {
	  for (var b = 0;b < this.keys_.length;b++) {
	    var d = this.keys_[b];
	    if (c.structs.Map.hasKey_(this.map_, d) && this.map_[d] == a) {
	      return !0;
	    }
	  }
	  return !1;
	};
	c.structs.Map.prototype.equals = function(a, b) {
	  if (this === a) {
	    return !0;
	  }
	  if (this.count_ != a.getCount()) {
	    return !1;
	  }
	  b = b || c.structs.Map.defaultEquals;
	  this.cleanupKeysArray_();
	  for (var d, e = 0;d = this.keys_[e];e++) {
	    if (!b(this.get(d), a.get(d))) {
	      return !1;
	    }
	  }
	  return !0;
	};
	c.structs.Map.defaultEquals = function(a, b) {
	  return a === b;
	};
	c.structs.Map.prototype.isEmpty = function() {
	  return 0 == this.count_;
	};
	c.structs.Map.prototype.clear = function() {
	  this.map_ = {};
	  this.version_ = this.count_ = this.keys_.length = 0;
	};
	c.structs.Map.prototype.remove = function(a) {
	  return c.structs.Map.hasKey_(this.map_, a) ? (delete this.map_[a], this.count_--, this.version_++, this.keys_.length > 2 * this.count_ && this.cleanupKeysArray_(), !0) : !1;
	};
	c.structs.Map.prototype.cleanupKeysArray_ = function() {
	  if (this.count_ != this.keys_.length) {
	    for (var a = 0, b = 0;a < this.keys_.length;) {
	      var d = this.keys_[a];
	      c.structs.Map.hasKey_(this.map_, d) && (this.keys_[b++] = d);
	      a++;
	    }
	    this.keys_.length = b;
	  }
	  if (this.count_ != this.keys_.length) {
	    for (var e = {}, b = a = 0;a < this.keys_.length;) {
	      d = this.keys_[a], c.structs.Map.hasKey_(e, d) || (this.keys_[b++] = d, e[d] = 1), a++;
	    }
	    this.keys_.length = b;
	  }
	};
	c.structs.Map.prototype.get = function(a, b) {
	  return c.structs.Map.hasKey_(this.map_, a) ? this.map_[a] : b;
	};
	c.structs.Map.prototype.set = function(a, b) {
	  c.structs.Map.hasKey_(this.map_, a) || (this.count_++, this.keys_.push(a), this.version_++);
	  this.map_[a] = b;
	};
	c.structs.Map.prototype.addAll = function(a) {
	  var b;
	  a instanceof c.structs.Map ? (b = a.getKeys(), a = a.getValues()) : (b = c.object.getKeys(a), a = c.object.getValues(a));
	  for (var d = 0;d < b.length;d++) {
	    this.set(b[d], a[d]);
	  }
	};
	c.structs.Map.prototype.forEach = function(a, b) {
	  for (var d = this.getKeys(), e = 0;e < d.length;e++) {
	    var f = d[e], g = this.get(f);
	    a.call(b, g, f, this);
	  }
	};
	c.structs.Map.prototype.clone = function() {
	  return new c.structs.Map(this);
	};
	c.structs.Map.prototype.transpose = function() {
	  for (var a = new c.structs.Map, b = 0;b < this.keys_.length;b++) {
	    var d = this.keys_[b];
	    a.set(this.map_[d], d);
	  }
	  return a;
	};
	c.structs.Map.prototype.toObject = function() {
	  this.cleanupKeysArray_();
	  for (var a = {}, b = 0;b < this.keys_.length;b++) {
	    var d = this.keys_[b];
	    a[d] = this.map_[d];
	  }
	  return a;
	};
	c.structs.Map.prototype.getKeyIterator = function() {
	  return this.__iterator__(!0);
	};
	c.structs.Map.prototype.getValueIterator = function() {
	  return this.__iterator__(!1);
	};
	c.structs.Map.prototype.__iterator__ = function(a) {
	  this.cleanupKeysArray_();
	  var b = 0, d = this.version_, e = this, f = new c.iter.Iterator;
	  f.next = function() {
	    if (d != e.version_) {
	      throw Error("The map has changed since the iterator was created");
	    }
	    if (b >= e.keys_.length) {
	      throw c.iter.StopIteration;
	    }
	    var f = e.keys_[b++];
	    return a ? f : e.map_[f];
	  };
	  return f;
	};
	c.structs.Map.hasKey_ = function(a, b) {
	  return Object.prototype.hasOwnProperty.call(a, b);
	};
	var B = __webpack_require__(3);
	function D(a) {
	  return function(b) {
	    return F(b, a);
	  };
	}
	function F(a, b) {
	  var d = {};
	  return B(a, b, function(a, b) {
	    if ("function" === typeof b) {
	      return a = b(a), c.isObject(a) && c.object.extend(d, a), !!a;
	    }
	  }) ? d : !1;
	}
	var H = {extractAST:function(a, b) {
	  return function(d) {
	    var e = {};
	    e[a] = d;
	    "object" === typeof b && (b = D(b));
	    if ("function" === typeof b) {
	      d = b(d);
	      if ("object" === typeof d) {
	        return c.object.extend(e, d), e;
	      }
	      if (!d) {
	        return !1;
	      }
	    }
	    return e;
	  };
	}, isASTMatch:F, matchesAST:D, matchesASTLength:function(a) {
	  var b = D(a);
	  return function(d) {
	    return c.isArray(d) && c.isArray(a) && d.length === a.length ? b(d) : !1;
	  };
	}};
	function J(a, b) {
	  for (a = a.parent;!b(a) && "Program" !== a.type;) {
	    a = a.parent;
	  }
	  return b(a) ? a : null;
	}
	function N(a, b) {
	  var d = b || "literal";
	  return H.isASTMatch(a, {type:"Literal", value:function(a) {
	    return "string" === typeof a && H.extractAST(d)(a);
	  }});
	}
	var O = {GoogDependencyMatch:void 0, findAncestor:J, findAncestorOfType:function(a, b) {
	  return J(a, function(a) {
	    return a.type == b;
	  });
	}, getFullyQualifedName:function(a) {
	  for (var b = a.name;a.parent && "MemberExpression" == a.parent.type;) {
	    a = a.parent, b += "." + a.property.name;
	  }
	  return b;
	}, isLoop:function(a) {
	  return /^(?:DoWhile|For|ForIn|ForOf|While)Statement$/.test(a.type);
	}, isFunction:function(a) {
	  return /^(?:Function(?:Declaration|Expression)|ArrowFunctionExpression)$/.test(a.type);
	}, matchExtractBareGoogRequire:function(a) {
	  return H.isASTMatch(a, {type:"ExpressionStatement", expression:{type:"CallExpression", callee:{type:"MemberExpression", object:{type:"Identifier", name:"goog"}, property:{type:"Identifier", name:"require"}}, arguments:[function(a) {
	    return N(a, "source");
	  }]}});
	}, matchExtractGoogProvide:function(a) {
	  return H.isASTMatch(a, {type:"ExpressionStatement", expression:{type:"CallExpression", callee:{type:"MemberExpression", object:{type:"Identifier", name:"goog"}, property:{type:"Identifier", name:"provide"}}, arguments:[function(a) {
	    return N(a, "source");
	  }]}});
	}, matchExtractDirective:function(a) {
	  return H.isASTMatch(a, {type:"ExpressionStatement", expression:function(a) {
	    return N(a, "directive");
	  }});
	}, matchExtractStringLiteral:N, matchStringLiteral:function(a) {
	  return H.isASTMatch(a, {type:"Literal", value:function(a) {
	    return "string" === typeof a;
	  }});
	}};
	function aa(a) {
	  return " " == a || "\t" == a;
	}
	function ba(a) {
	  return "\t" == a;
	}
	function P(a, b, d, e) {
	  a = e ? b.getLastToken(a) : b.getFirstToken(a);
	  b = Array.from(b.getText(a, a.loc.start.column));
	  a = b.slice(0, b.findIndex(c.functions.not(aa)));
	  b = a.filter(c.string.isSpace).length;
	  a = a.filter(ba).length;
	  return {space:b, tab:a, goodChar:"space" === d ? b : a, badChar:"space" === d ? a : b};
	}
	function Q(a, b, d) {
	  b = !0 === d ? b.getLastToken(a, 1) : b.getTokenBefore(a);
	  return (!0 === d ? a.loc.end.line : a.loc.start.line) !== (b ? b.loc.end.line : -1);
	}
	function R(a, b) {
	  return !!b && b.parent.loc.start.line === a.loc.start.line && 1 < b.parent.declarations.length;
	}
	function ca(a) {
	  if ("CallExpression" !== a.parent.type) {
	    return !1;
	  }
	  a = a.parent;
	  if ("MemberExpression" !== a.callee.type) {
	    return !1;
	  }
	  a = a.callee;
	  if ("Identifier" !== a.object.type || "Identifier" !== a.property.type) {
	    return !1;
	  }
	  var b = a.property;
	  return "goog" === a.object.name && "scope" === b.name;
	}
	function da(a) {
	  return a.declarations.reduce(function(b, d) {
	    var e = b[b.length - 1];
	    (d.loc.start.line !== a.loc.start.line && !e || e && e.loc.start.line !== d.loc.start.line) && b.push(d);
	    return b;
	  }, []);
	}
	function ea(a) {
	  var b = {indentSize:4, indentType:"space", indentOptions:{SwitchCase:0, VariableDeclarator:{var:1, let:1, const:1}, outerIIFEBody:-1, MemberExpression:-1, FunctionDeclaration:{parameters:-1, body:1}, FunctionExpression:{parameters:-1, body:1}}}, d = b.indentOptions;
	  if (0 < a.length && ("tab" == a[0] ? (b.indentSize = 1, b.indentType = "tab") : "number" === typeof a[0] && (b.indentSize = a[0], b.indentType = "space"), a[1])) {
	    a = a[1];
	    d.SwitchCase = a.SwitchCase || 0;
	    if ("number" === typeof a.VariableDeclarator) {
	      var e = a.VariableDeclarator;
	      d.VariableDeclarator = {var:e, let:e, const:e};
	    } else {
	      "object" === typeof a.VariableDeclarator && Object.assign(d.VariableDeclarator, a.VariableDeclarator);
	    }
	    "number" === typeof a.outerIIFEBody && (d.outerIIFEBody = a.outerIIFEBody);
	    "number" === typeof a.MemberExpression && (d.MemberExpression = a.MemberExpression);
	    "object" === typeof a.FunctionDeclaration && Object.assign(d.FunctionDeclaration, a.FunctionDeclaration);
	    "object" === typeof a.FunctionExpression && Object.assign(d.FunctionExpression, a.FunctionExpression);
	  }
	  return b;
	}
	;var fa = __webpack_require__(5);
	function S(a) {
	  return "NullableLiteral" === a.type || "AllLiteral" === a.type || "NullLiteral" === a.type || "UndefinedLiteral" === a.type || "VoidLiteral" === a.type || "StringLiteralType" === a.type || "NumericLiteralType" === a.type;
	}
	function ga(a) {
	  return S(a) || "NameExpression" === a.type;
	}
	function T(a, b) {
	  b(a);
	  if (!ga(a)) {
	    switch(a.type) {
	      case "ArrayType":
	        a.elements.forEach(function(a) {
	          return T(a, b);
	        });
	        break;
	      case "RecordType":
	        a.fields.forEach(function(a) {
	          return T(a, b);
	        });
	        break;
	      case "FunctionType":
	        a.this && T(a.this, b);
	        a.params.forEach(function(a) {
	          return T(a, b);
	        });
	        a.result && T(a.result, b);
	        break;
	      case "FieldType":
	        a.value && T(a.value, b);
	        break;
	      case "ParameterType":
	      case "RestType":
	      case "NonNullableType":
	      case "OptionalType":
	      case "NullableType":
	        T(a.expression, b);
	        break;
	      case "TypeApplication":
	        T(a.expression, b);
	        a.applications.forEach(function(a) {
	          return T(a, b);
	        });
	        break;
	      case "UnionType":
	        a.elements.forEach(function(a) {
	          return T(a, b);
	        });
	        break;
	      default:
	        throw Error("Unrecoginized tag type: " + a + ".");
	    }
	  }
	}
	function U(a) {
	  return "Block" === a.type && "*" === a.value.charAt(0);
	}
	function ha(a) {
	  var b = ["FunctionExpression", "ArrowFunctionExpression", "ClassExpression"];
	  return H.isASTMatch(a, {type:"VariableDeclaration", declarations:[{type:"VariableDeclarator", init:function(a) {
	    return !!a && -1 !== b.indexOf(a.type);
	  }}]});
	}
	var W = {getJSDocComment:function(a) {
	  return !a.leadingComments || 0 == a.leadingComments.length || ha(a) ? null : a.leadingComments.filter(U).reverse().pop() || null;
	}, hasTypeInformation:function(a) {
	  var b = "type typedef record const private package protected public export".split(" ");
	  return a.tags.some(function(a) {
	    return c.array.contains(b, a.title);
	  });
	}, isLiteral:S, isVoid:function(a) {
	  var b = "NameExpression" == a.type && "void" == a.name;
	  return "VoidLiteral" == a.type || b;
	}, isJSDocComment:U, parseComment:function(a) {
	  try {
	    return fa.parse(a, {strict:!0, unwrap:!0, sloppy:!0});
	  } catch (b) {
	    if (b instanceof Error && /braces/i.test(b.message)) {
	      throw Error("JSDoc type missing brace.");
	    }
	    throw Error("JSDoc syntax error.");
	  }
	}, traverseTags:T};
	var ia = __webpack_require__(5);
	function X(a) {
	  return !c.isDefAndNotNull(a.type) || W.isVoid(a.type) || "UndefinedLiteral" === a.type.type;
	}
	var ja = "string number boolean Object Array Map Set".split(" ");
	function Y(a, b) {
	  b.type && W.traverseTags(b.type, function(b) {
	    "NameExpression" === b.type && (b = b.name, -1 === ja.indexOf(b) && a.markVariableAsUsed(b));
	  });
	}
	;function ka(a) {
	  return !!O.matchExtractDirective(a);
	}
	function la(a, b) {
	  for (var d = 0;d < b.length;++d) {
	    if (!a(b[d])) {
	      return b.slice(0, d);
	    }
	  }
	  return b.slice();
	}
	;var Z = {rules:{}};
	c.exportProperty(Z, "rules", {});
	c.exportProperty(Z.rules, "camelcase", {meta:{docs:{description:"check identifiers for camel case with options for opt_ prefix and var_args identifiers", category:"Stylistic Issues", recommended:!0}, schema:[{type:"object", properties:{allowVarArgs:{type:"boolean"}, allowOptPrefix:{type:"boolean"}, allowLeadingUnderscore:{type:"boolean"}, allowTrailingUnderscore:{type:"boolean"}, checkObjectProperties:{type:"boolean"}}, additionalProperties:!1}]}, create:function(a) {
	  var b = Object.assign({}, y, a.options[0] || {});
	  return {Identifier:function(d) {
	    d = z(d, b);
	    d.hasError && a.report({node:d.node, message:d.message});
	  }};
	}});
	c.exportProperty(Z.rules, "indent", {meta:{docs:{description:"enforce consistent indentation", category:"Stylistic Issues", recommended:!1}, fixable:"whitespace", schema:[{oneOf:[{enum:["tab"]}, {type:"integer", minimum:0}]}, {type:"object", properties:{SwitchCase:{type:"integer", minimum:0}, VariableDeclarator:{oneOf:[{type:"integer", minimum:0}, {type:"object", properties:{var:{type:"integer", minimum:0}, let:{type:"integer", minimum:0}, const:{type:"integer", minimum:0}}}]}, outerIIFEBody:{type:"integer", 
	minimum:0}, MemberExpression:{type:"integer", minimum:0}, FunctionDeclaration:{type:"object", properties:{parameters:{oneOf:[{type:"integer", minimum:0}, {enum:["first"]}]}, body:{type:"integer", minimum:0}}}, FunctionExpression:{type:"object", properties:{parameters:{oneOf:[{type:"integer", minimum:0}, {enum:["first"]}]}, body:{type:"integer", minimum:0}}}}, additionalProperties:!1}]}, create:function(a) {
	  function b(a, b, d) {
	    var e = "space" + (1 === b ? "" : "s"), f = "tab" + (1 === d ? "" : "s");
	    return "Expected indentation of " + (a + " " + t + (1 === a ? "" : "s")) + " but" + (" found " + (0 < b && 0 < d ? b + " " + e + " and " + (d + " " + f) : 0 < b ? "space" === t ? b : b + " " + e : 0 < d ? "tab" === t ? d : d + " " + f : "0") + ".");
	  }
	  function d(d, e, f, g, h, k) {
	    var ma = ("space" === t ? " " : "\t").repeat(e), G = k ? [d.range[1] - f - g - 1, d.range[1] - 1] : [d.range[0] - f - g, d.range[0]];
	    a.report({node:d, loc:h, message:b(e, f, g), fix:function(a) {
	      return a.replaceTextRange(G, ma);
	    }});
	  }
	  function e(a, b) {
	    var e = P(a, m, t, !1);
	    "ArrayExpression" === a.type || "ObjectExpression" === a.type || e.goodChar === b && 0 === e.badChar || !Q(a, m) || d(a, b, e.space, e.tab);
	  }
	  function f(a, b) {
	    a.forEach(function(a) {
	      return e(a, b);
	    });
	  }
	  function g(a, b) {
	    var e = m.getLastToken(a), f = P(e, m, t, !0);
	    f.goodChar === b && 0 === f.badChar || !Q(a, m, !0) || d(a, b, f.space, f.tab, {start:{line:e.loc.start.line, column:e.loc.start.column}}, !0);
	  }
	  function h(a) {
	    var b = P(a, m, t).goodChar, d = a.parent;
	    if ("Property" === d.type || "ArrayExpression" === d.type) {
	      b = P(a, m, t, !1).goodChar;
	    } else {
	      if ("CallExpression" === d.type) {
	        var e;
	        e = 1 <= d.arguments.length ? d.arguments[0].loc.end.line > d.arguments[0].loc.start.line : !1;
	        e && w.isNodeOneLine(d.callee) && !Q(a, m) && (b = P(d, m, t).goodChar);
	      }
	    }
	    return b;
	  }
	  function k(a) {
	    var b = a.body, d = h(a), e = p, f;
	    if (f = -1 !== n.outerIIFEBody) {
	      if (ca(a)) {
	        f = !0;
	      } else {
	        var g = a.parent;
	        f = g.parent;
	        if ("CallExpression" !== g.type || g.callee !== a) {
	          f = !1;
	        } else {
	          for (;"UnaryExpression" === f.type || "AssignmentExpression" === f.type || "LogicalExpression" === f.type || "SequenceExpression" === f.type || "VariableDeclarator" === f.type;) {
	            if ("UnaryExpression" === f.type) {
	              if (g = f, "!" === g.operator || "~" === g.operator || "+" === g.operator || "-" === g.operator) {
	                f = f.parent;
	              } else {
	                break;
	              }
	            } else {
	              f = f.parent;
	            }
	          }
	          f = ("ExpressionStatement" === f.type || "VariableDeclaration" === f.type) && f.parent && "Program" === f.parent.type;
	        }
	      }
	    }
	    f ? e = n.outerIIFEBody * p : "FunctionExpression" === a.type ? e = n.FunctionExpression.body * p : "FunctionDeclaration" === a.type && (e = n.FunctionDeclaration.body * p);
	    d += e;
	    (f = O.findAncestorOfType(a, "VariableDeclarator")) && R(a, f) && (d += p * n.VariableDeclarator[f.parent.kind]);
	    x(b, d, d - e);
	  }
	  function l(a) {
	    if (!w.isNodeOneLine(a)) {
	      var b = a.body;
	      a = h(a);
	      x(b, a + p, a);
	    }
	  }
	  function u(a) {
	    var b = a.parent, e = O.findAncestorOfType(a, "VariableDeclarator"), f = P(b, m, t).goodChar;
	    if (Q(a, m)) {
	      if (e) {
	        if (b === e) {
	          e === e.parent.declarations[0] && (f += p * n.VariableDeclarator[e.parent.kind]);
	        } else {
	          if ("ObjectExpression" === b.type || "ArrayExpression" === b.type || "CallExpression" === b.type || "ArrowFunctionExpression" === b.type || "NewExpression" === b.type || "LogicalExpression" === b.type) {
	            f += p;
	          }
	        }
	      } else {
	        var g;
	        g = "ArrayExpression" !== b.type ? !1 : b.elements[0] ? "ObjectExpression" === b.elements[0].type && b.elements[0].loc.start.line === b.loc.start.line : !1;
	        g || "MemberExpression" === b.type || "ExpressionStatement" === b.type || "AssignmentExpression" === b.type || "Property" === b.type || (f += p);
	      }
	      b = f + p;
	      g = P(a, m, t, !1);
	      g.goodChar === f && 0 === g.badChar || !Q(a, m) || d(a, f, g.space, g.tab, {start:{line:a.loc.start.line, column:a.loc.start.column}});
	    } else {
	      f = P(a, m, t).goodChar, b = f + p;
	    }
	    R(a, e) && (b += p * n.VariableDeclarator[e.parent.kind]);
	    return b;
	  }
	  function x(a, b, d) {
	    w.isNodeOneLine(a) || (f(a.body, b), g(a, d));
	  }
	  function r(a) {
	    var b = P(a, m, t).goodChar, d = b + p;
	    "BlockStatement" === a.body.type ? x(a.body, d, b) : f([a.body], d);
	  }
	  function C(a, b, d) {
	    "first" === d && a.params.length ? f(a.params.slice(1), a.params[0].loc.start.column) : f(a.params, b * d);
	  }
	  function I(a, b) {
	    a = "SwitchStatement" === a.type ? a : a.parent;
	    if (M[a.loc.start.line]) {
	      return M[a.loc.start.line];
	    }
	    "undefined" === typeof b && (b = P(a, m, t).goodChar);
	    b = 0 < a.cases.length && 0 === n.SwitchCase ? b : b + p * n.SwitchCase;
	    return M[a.loc.start.line] = b;
	  }
	  var E = ea(a.options), t = E.indentType, p = E.indentSize, n = E.indentOptions, m = a.getSourceCode(), M = {};
	  return {Program:function(a) {
	    f(a.body, 0);
	  }, ClassDeclaration:l, ClassExpression:l, BlockStatement:function(a) {
	    if (!w.isNodeOneLine(a) && ("BlockStatement" == a.parent.type || "Program" == a.parent.type)) {
	      var b = P(a, m, t).goodChar;
	      x(a, b + p, b);
	    }
	  }, DoWhileStatement:r, ForStatement:r, ForInStatement:r, ForOfStatement:r, WhileStatement:r, WithStatement:r, IfStatement:function(a) {
	    var b = P(a, m, t).goodChar, d = b + p;
	    "BlockStatement" !== a.consequent.type ? w.nodesStartOnSameLine(a, a.consequent) || e(a.consequent, d) : (f(a.consequent.body, d), g(a.consequent, b));
	    if (a.alternate) {
	      var h = m.getTokenBefore(a.alternate);
	      e(h, b);
	      "BlockStatement" !== a.alternate.type ? w.nodesStartOnSameLine(a.alternate, h) || e(a.alternate, d) : (f(a.alternate.body, d), g(a.alternate, b));
	    }
	  }, VariableDeclaration:function(a) {
	    if (!w.nodesStartOnSameLine(a.declarations[0], a.declarations[a.declarations.length - 1])) {
	      var b = da(a), d = P(a, m, t).goodChar, e = b[b.length - 1], d = d + p * n.VariableDeclarator[a.kind];
	      f(b, d);
	      m.getLastToken(a).loc.end.line <= e.loc.end.line || (b = m.getTokenBefore(e), "," === b.value ? g(a, P(b, m, t).goodChar) : g(a, d - p));
	    }
	  }, ObjectExpression:function(a) {
	    if (!w.isNodeOneLine(a)) {
	      var b = a.properties;
	      if (!(0 < b.length && w.nodesStartOnSameLine(b[0], a))) {
	        var d = u(a);
	        f(b, d);
	        g(a, d - p);
	      }
	    }
	  }, ArrayExpression:function(a) {
	    if (!w.isNodeOneLine(a)) {
	      var b = a.elements.filter(function(a) {
	        return null != a;
	      });
	      if (!(0 < b.length && w.nodesStartOnSameLine(b[0], a))) {
	        var d = u(a);
	        f(b, d);
	        g(a, d - p);
	      }
	    }
	  }, MemberExpression:function(a) {
	    if (-1 !== n.MemberExpression && !w.isNodeOneLine(a) && !O.findAncestorOfType(a, "VariableDeclarator") && !O.findAncestorOfType(a, "AssignmentExpression")) {
	      var b = P(a, m, t).goodChar + p * n.MemberExpression, d = [a.property];
	      a = m.getTokenBefore(a.property);
	      "Punctuator" === a.type && "." === a.value && d.push(a);
	      f(d, b);
	    }
	  }, SwitchStatement:function(a) {
	    var b = P(a, m, t).goodChar, d = I(a, b);
	    f(a.cases, d);
	    g(a, b);
	  }, SwitchCase:function(a) {
	    if (!w.isNodeOneLine(a)) {
	      var b = I(a);
	      f(a.consequent, b + p);
	    }
	  }, ArrowFunctionExpression:function(a) {
	    w.isNodeOneLine(a) || "BlockStatement" === a.body.type && k(a);
	  }, FunctionDeclaration:function(a) {
	    w.isNodeOneLine(a) || (-1 !== n.FunctionDeclaration.parameters && C(a, p, n.FunctionDeclaration.parameters), k(a));
	  }, FunctionExpression:function(a) {
	    w.isNodeOneLine(a) || (-1 !== n.FunctionExpression.parameters && C(a, p, n.FunctionExpression.parameters), k(a));
	  }};
	}});
	c.exportProperty(Z.rules, "inline-comment-spacing", {meta:{docs:{description:"enforce consistent spacing before the `//` at line end", category:"Stylistic Issues", recommended:!1}, fixable:"whitespace", schema:[{type:"integer", minimum:0, maximum:5}]}, create:function(a) {
	  var b = null == a.options[0] ? 1 : a.options[0];
	  return {LineComment:function(d) {
	    var e = a.getSourceCode();
	    e.getComments(d);
	    e = e.getTokenBefore(d, 1) || e.getTokenOrCommentBefore(d);
	    if (null != e && w.nodesShareOneLine(d, e)) {
	      var f = d.start - e.end;
	      f < b && a.report({node:d, message:"Expected at least " + b + " " + (1 === b ? "space" : "spaces") + " before inline comment.", fix:function(a) {
	        var e = Array(b - f + 1).join(" ");
	        return a.insertTextBefore(d, e);
	      }});
	    }
	  }};
	}});
	c.exportProperty(Z.rules, "jsdoc", {meta:{docs:{description:"enforce valid JSDoc comments", category:"Possible Errors", recommended:!0}, schema:[{type:"object", properties:{prefer:{type:"object", additionalProperties:{type:"string"}}, preferType:{type:"object", additionalProperties:{type:"string"}}, requireReturn:{type:"boolean"}, requireParamDescription:{type:"boolean"}, requireReturnDescription:{type:"boolean"}, matchDescription:{type:"string"}, requireReturnType:{type:"boolean"}}, additionalProperties:!1}]}, 
	create:function(a) {
	  function b(a) {
	    f.push({returnPresent:"ArrowFunctionExpression" === a.type && "BlockStatement" !== a.body.type || w.isNodeClassType(a)});
	  }
	  function d(b, d) {
	    W.traverseTags(d, function(d) {
	      if ("NameExpression" === d.type) {
	        d = d.name;
	        var e = C[d];
	        e && a.report({node:b, message:"Use '" + e + "' instead of '" + d + "'."});
	      }
	    });
	  }
	  function e(b) {
	    var e = g.getJSDocComment(b), p = f.pop(), n = Object.create(null), m = !1, E = !1, C = !1, G = !1, V = !1, K;
	    if (e) {
	      try {
	        K = ia.parse(e.value, {strict:!0, unwrap:!0, sloppy:!0});
	      } catch (na) {
	        /braces/i.test(na.message) ? a.report({node:e, message:"JSDoc type missing brace."}) : a.report({node:e, message:"JSDoc syntax error."});
	        return;
	      }
	      K.tags.forEach(function(b) {
	        switch(b.title.toLowerCase()) {
	          case "param":
	          case "arg":
	          case "argument":
	            b.type || a.report({node:e, message:"Missing JSDoc parameter type for '" + b.name + "'."});
	            !b.description && u && a.report({node:e, message:"Missing JSDoc parameter description for " + ("'" + b.name + "'.")});
	            n[b.name] ? a.report({node:e, message:"Duplicate JSDoc parameter '" + b.name + "'."}) : -1 === b.name.indexOf(".") && (n[b.name] = 1);
	            break;
	          case "return":
	          case "returns":
	            m = !0;
	            l || p.returnPresent || !c.isNull(b.type) && X(b) || V ? (r && !b.type && a.report({node:e, message:"Missing JSDoc return type."}), X(b) || b.description || !x || a.report({node:e, message:"Missing JSDoc return description."})) : a.report({node:e, message:"Unexpected @{{title}} tag; function has no return statement.", data:{title:b.title}});
	            break;
	          case "constructor":
	          case "class":
	            E = !0;
	            break;
	          case "override":
	          case "inheritdoc":
	            G = !0;
	            break;
	          case "abstract":
	          case "virtual":
	            V = !0;
	            break;
	          case "interface":
	            C = !0;
	        }
	        k.containsKey(b.title) && b.title != k.get(b.title) && a.report({node:e, message:"Use @{{name}} instead.", data:{name:k.get(b.title)}});
	        Y(a, b);
	        I && b.type && d(e, b.type);
	      });
	      G || m || E || C || w.isNodeGetterFunction(b) || w.isNodeSetterFunction(b) || w.isNodeConstructorFunction(b) || w.isNodeClassType(b) || (l || p.returnPresent) && a.report({node:e, message:"Missing JSDoc @return for function."});
	      var L = Object.keys(n);
	      b.params && b.params.forEach(function(b, d) {
	        "AssignmentPattern" === b.type && (b = b.left);
	        var f = b.name;
	        "Identifier" === b.type && (L[d] && f !== L[d] ? a.report({node:e, message:"Expected JSDoc for '" + f + "' but found " + ("'" + L[d] + "'.")}) : n[f] || G || a.report({node:e, message:"Missing JSDoc for parameter '" + f + "'."}));
	      });
	      h.matchDescription && ((new RegExp(h.matchDescription)).test(K.description) || a.report({node:e, message:"JSDoc description does not satisfy the regex pattern."}));
	    }
	  }
	  var f = [], g = a.getSourceCode(), h = a.options[0] || {}, k = new c.structs.Map(h.prefer), l = !1 !== h.requireReturn, u = !1 !== h.requireParamDescription, x = !1 !== h.requireReturnDescription, r = !1 !== h.requireReturnType, C = h.preferType || {}, I = 0 !== Object.keys(C).length;
	  return {ArrowFunctionExpression:b, FunctionExpression:b, FunctionDeclaration:b, ClassExpression:b, ClassDeclaration:b, "ArrowFunctionExpression:exit":e, "FunctionExpression:exit":e, "FunctionDeclaration:exit":e, "ClassExpression:exit":e, "ClassDeclaration:exit":e, ReturnStatement:function(a) {
	    var b = f[f.length - 1];
	    b && !c.isNull(a.argument) && (b.returnPresent = !0);
	  }, VariableDeclaration:function(b) {
	    if (1 === b.declarations.length) {
	      var d = W.getJSDocComment(b);
	      if (d) {
	        var e;
	        try {
	          e = W.parseComment(d.value);
	        } catch (n) {
	          return;
	        }
	        b = b.declarations[0];
	        "Identifier" === b.id.type && (b = b.id.name, W.hasTypeInformation(e) && a.markVariableAsUsed(b), e.tags.forEach(function(b) {
	          Y(a, b);
	        }));
	      }
	    }
	  }};
	}});
	c.exportProperty(Z.rules, "no-undef", {meta:{docs:{description:"disallow the use of undeclared variables unless mentioned in `/*global */` comments", category:"Variables", recommended:!0}, schema:[{type:"object", properties:{typeof:{type:"boolean"}}, additionalProperties:!1}]}, create:function(a) {
	  var b = a.options[0], d = b && !0 === b.typeof || !1, e = [], f = [];
	  return {Program:function(a) {
	    e = a.body.map(O.matchExtractBareGoogRequire).filter(function(a) {
	      return !!a;
	    }).map(function(a) {
	      return a.source;
	    });
	    f = a.body.map(O.matchExtractGoogProvide).filter(function(a) {
	      return !!a;
	    }).map(function(a) {
	      return a.source;
	    });
	  }, "Program:exit":function() {
	    function b(a) {
	      return f.some(function(b) {
	        return w.isValidPrefix(a, b);
	      });
	    }
	    function h(a) {
	      return e.some(function(b) {
	        return w.isValidPrefix(a, b);
	      });
	    }
	    a.getScope().through.forEach(function(e) {
	      e = e.identifier;
	      var f = O.getFullyQualifedName(e), g;
	      if (g = !d) {
	        g = e.parent, g = "UnaryExpression" === g.type && "typeof" === g.operator;
	      }
	      g || b(f) || h(f) || a.report({node:e, message:"'" + e.name + "' is not defined."});
	    });
	  }};
	}});
	c.exportProperty(Z.rules, "no-unused-expressions", {meta:{docs:{description:"disallow unused expressions", category:"Best Practices", recommended:!1}, schema:[{type:"object", properties:{allowShortCircuit:{type:"boolean"}, allowTernary:{type:"boolean"}}, additionalProperties:!1}]}, create:function(a) {
	  function b(a) {
	    if (f && "ConditionalExpression" === a.type) {
	      return b(a.consequent) && b(a.alternate);
	    }
	    if (e && "LogicalExpression" === a.type) {
	      return b(a.right);
	    }
	    var d = /^(?:Assignment|Call|New|Update|Yield|Await)Expression$/.test(a.type);
	    a = "UnaryExpression" === a.type && 0 <= ["delete", "void"].indexOf(a.operator);
	    return d || a;
	  }
	  var d = a.options[0] || {}, e = d.allowShortCircuit || !1, f = d.allowTernary || !1;
	  return {ExpressionStatement:function(d) {
	    var e;
	    if (e = !b(d.expression)) {
	      var f = a.getAncestors();
	      e = f[f.length - 1];
	      f = f[f.length - 2];
	      f = "BlockStatement" === e.type && /Function/.test(f.type);
	      e = "Program" === e.type || f ? c.array.contains(la(ka, e.body), d) : !1;
	      e = !e;
	    }
	    if (e) {
	      var g;
	      if (e = W.getJSDocComment(d)) {
	        try {
	          var u = W.parseComment(e.value);
	          g = W.hasTypeInformation(u);
	        } catch (x) {
	          g = !1;
	        }
	      } else {
	        g = !1;
	      }
	      e = !g;
	    }
	    e && a.report({node:d, message:"Expected an assignment or function call and instead saw an expression."});
	  }};
	}});
	c.exportProperty(Z.rules, "no-unused-vars", {meta:{docs:{description:"disallow unused variables", category:"Variables", recommended:!0}, schema:[{oneOf:[{enum:["all", "local"]}, {type:"object", properties:{vars:{enum:["all", "local"]}, varsIgnorePattern:{type:"string"}, args:{enum:["all", "after-used", "none"]}, argsIgnorePattern:{type:"string"}, caughtErrors:{enum:["all", "none"]}, caughtErrorsIgnorePattern:{type:"string"}, allowUnusedTypes:{type:"boolean"}}}]}]}, create:function(a) {
	  function b(a, b) {
	    return a.range[0] >= b.range[0] && a.range[1] <= b.range[1];
	  }
	  function d(a, d) {
	    var e = a;
	    for (a = a.parent;a && b(a, d);) {
	      switch(a.type) {
	        case "SequenceExpression":
	          var f = a;
	          if (f.expressions[f.expressions.length - 1] !== e) {
	            return !1;
	          }
	          break;
	        case "CallExpression":
	        case "NewExpression":
	          return a.callee !== e;
	        case "AssignmentExpression":
	        case "TaggedTemplateExpression":
	        case "YieldExpression":
	          return !0;
	        default:
	          if (u.test(a.type)) {
	            return !0;
	          }
	      }
	      e = a;
	      a = a.parent;
	    }
	    return !1;
	  }
	  function e(a) {
	    var e = a.defs.filter(function(a) {
	      return "FunctionName" === a.type;
	    }).map(function(a) {
	      return a.node;
	    }), f = 0 < e.length, g = null;
	    return a.references.some(function(a) {
	      var h;
	      h = a.identifier.parent;
	      "VariableDeclarator" === h.type && (h = h.parent.parent);
	      h = "ForInStatement" !== h.type ? !1 : (h = "BlockStatement" === h.body.type ? h.body.body[0] : h.body) ? "ReturnStatement" === h.type : !1;
	      if (h) {
	        return !0;
	      }
	      h = g;
	      var k = a.identifier, l = k.parent, m = l.parent, x;
	      if (x = a.isRead()) {
	        !(l = "AssignmentExpression" === l.type && "ExpressionStatement" === m.type && l.left === k || "UpdateExpression" === l.type && "ExpressionStatement" === m.type) && (l = h && b(k, h)) && (k = O.findAncestor(k, O.isFunction), l = !(k && b(k, h) && d(k, h))), x = l;
	      }
	      h = x;
	      k = g;
	      l = a.identifier;
	      m = l.parent;
	      x = m.parent;
	      var r;
	      if (!(r = a.from.variableScope !== a.resolved.scope.variableScope)) {
	        b: {
	          for (r = l;r;) {
	            if (O.isLoop(r)) {
	              r = !0;
	              break b;
	            }
	            if (O.isFunction(r)) {
	              break;
	            }
	            r = r.parent;
	          }
	          r = !1;
	        }
	      }
	      g = k && b(l, k) ? k : "AssignmentExpression" !== m.type || "ExpressionStatement" !== x.type || l !== m.left || r ? null : m.right;
	      if (h = a.isRead() && !h) {
	        if (h = f) {
	          a: {
	            for (a = a.from;a;) {
	              if (0 <= e.indexOf(a.block)) {
	                h = !0;
	                break a;
	              }
	              a = a.upper;
	            }
	            h = !1;
	          }
	        }
	        h = !h;
	      }
	      return h;
	    });
	  }
	  function f(b) {
	    var d = b.defs[0];
	    return d.index === d.node.params.length - 1 || k.argsIgnorePattern && (d = a.getDeclaredVariables(d.node), d.slice(d.indexOf(b) + 1).every(function(a) {
	      return 0 === a.references.length && k.argsIgnorePattern && k.argsIgnorePattern.test(a.name);
	    })) ? !0 : !1;
	  }
	  function g(a, b) {
	    var d = a.variables, h = a.childScopes, l, r;
	    if ("TDZ" !== a.type && ("global" !== a.type || "all" === k.vars)) {
	      for (l = 0, r = d.length;l < r;++l) {
	        var p = d[l];
	        if (!("class" === a.type && a.block.id === p.identifiers[0] || a.functionExpressionScope || p.eslintUsed || "function" === a.type && "arguments" === p.name && 0 === p.identifiers.length)) {
	          var n = p.defs[0];
	          if (n) {
	            var m = n.type;
	            if ("CatchClause" === m) {
	              if ("none" === k.caughtErrors) {
	                continue;
	              }
	              if (k.caughtErrorsIgnorePattern && k.caughtErrorsIgnorePattern.test(n.name.name)) {
	                continue;
	              }
	            }
	            if ("Parameter" === m) {
	              if ("Property" === n.node.parent.type && "set" === n.node.parent.kind) {
	                continue;
	              }
	              if ("none" === k.args) {
	                continue;
	              }
	              if (k.argsIgnorePattern && k.argsIgnorePattern.test(n.name.name)) {
	                continue;
	              }
	              if ("after-used" === k.args && !f(p)) {
	                continue;
	              }
	            } else {
	              if (k.varsIgnorePattern && k.varsIgnorePattern.test(n.name.name)) {
	                continue;
	              }
	            }
	          }
	          if (n = !e(p)) {
	            a: {
	              if (n = p.defs[0]) {
	                m = n.node;
	                if ("VariableDeclarator" === m.type) {
	                  m = m.parent;
	                } else {
	                  if ("Parameter" === n.type) {
	                    n = !1;
	                    break a;
	                  }
	                }
	                n = 0 === m.parent.type.indexOf("Export");
	              } else {
	                n = !1;
	              }
	            }
	            n = !n;
	          }
	          n && b.push(p);
	        }
	      }
	    }
	    l = 0;
	    for (r = h.length;l < r;++l) {
	      g(h[l], b);
	    }
	    return b;
	  }
	  function h(a) {
	    var b = a.eslintExplicitGlobalComment, d = b.loc.start;
	    a = new RegExp("[\\s,]" + w.escapeRegexp(a.name) + "(?:$|[\\s,:])", "g");
	    a.lastIndex = b.value.indexOf("global") + 6;
	    a = (a = a.exec(b.value)) ? a.index + 1 : 0;
	    var b = b.value.slice(0, a), e = (b.match(/\n/g) || []).length;
	    a = 0 < e ? a - (1 + b.lastIndexOf("\n")) : a + (d.column + 2);
	    return {start:{line:d.line + e, column:a}};
	  }
	  var k = {vars:"all", args:"after-used", caughtErrors:"none", allowUnusedTypes:!1}, l = a.options[0];
	  l && (c.isString(l) ? k.vars = l : (k.vars = l.vars || k.vars, k.args = l.args || k.args, k.caughtErrors = l.caughtErrors || k.caughtErrors, l.varsIgnorePattern && (k.varsIgnorePattern = new RegExp(l.varsIgnorePattern)), l.argsIgnorePattern && (k.argsIgnorePattern = new RegExp(l.argsIgnorePattern)), l.caughtErrorsIgnorePattern && (k.caughtErrorsIgnorePattern = new RegExp(l.caughtErrorsIgnorePattern)), l.allowUnusedTypes && (k.allowUnusedTypes = l.allowUnusedTypes)));
	  var u = /(?:Statement|Declaration)$/;
	  return {"Program:exit":function(b) {
	    g(a.getScope(), []).forEach(function(d) {
	      d.eslintExplicitGlobal ? a.report({node:b, loc:h(d), message:"'{{name}}' is defined but never used.", data:d}) : 0 < d.defs.length && a.report({node:d.identifiers[0], message:"'{{name}}' is defined but never used.", data:d});
	    });
	  }};
	}});
	module.exports = Z;
	


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, module) {/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/** Used to compose bitmasks for comparison styles. */
	var UNORDERED_COMPARE_FLAG = 1,
	    PARTIAL_COMPARE_FLAG = 2;
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    promiseTag = '[object Promise]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]',
	    weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	
	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;
	
	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
	
	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
	
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();
	
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	
	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && freeGlobal.process;
	
	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    return freeProcess && freeProcess.binding('util');
	  } catch (e) {}
	}());
	
	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
	
	/**
	 * A specialized version of `_.some` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {boolean} Returns `true` if any element passes the predicate check,
	 *  else `false`.
	 */
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array ? array.length : 0;
	
	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}
	
	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);
	
	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}
	
	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}
	
	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */
	function isHostObject(value) {
	  // Many host objects are `Object` objects that can coerce to strings
	  // despite having improperly defined `toString` methods.
	  var result = false;
	  if (value != null && typeof value.toString != 'function') {
	    try {
	      result = !!(value + '');
	    } catch (e) {}
	  }
	  return result;
	}
	
	/**
	 * Converts `map` to its key-value pairs.
	 *
	 * @private
	 * @param {Object} map The map to convert.
	 * @returns {Array} Returns the key-value pairs.
	 */
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);
	
	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}
	
	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}
	
	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);
	
	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}
	
	/** Used for built-in method references. */
	var arrayProto = Array.prototype,
	    funcProto = Function.prototype,
	    objectProto = Object.prototype;
	
	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];
	
	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());
	
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);
	
	/** Built-in value references. */
	var Symbol = root.Symbol,
	    Uint8Array = root.Uint8Array,
	    propertyIsEnumerable = objectProto.propertyIsEnumerable,
	    splice = arrayProto.splice;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys = overArg(Object.keys, Object);
	
	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView'),
	    Map = getNative(root, 'Map'),
	    Promise = getNative(root, 'Promise'),
	    Set = getNative(root, 'Set'),
	    WeakMap = getNative(root, 'WeakMap'),
	    nativeCreate = getNative(Object, 'create');
	
	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map),
	    promiseCtorString = toSource(Promise),
	    setCtorString = toSource(Set),
	    weakMapCtorString = toSource(WeakMap);
	
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
	
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	}
	
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  return this.has(key) && delete this.__data__[key];
	}
	
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}
	
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
	}
	
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}
	
	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	}
	
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  return true;
	}
	
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  return index < 0 ? undefined : data[index][1];
	}
	
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}
	
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  if (index < 0) {
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}
	
	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}
	
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  return getMapData(this, key)['delete'](key);
	}
	
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}
	
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}
	
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  getMapData(this, key).set(key, value);
	  return this;
	}
	
	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	
	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values ? values.length : 0;
	
	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}
	
	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED);
	  return this;
	}
	
	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}
	
	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;
	
	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  this.__data__ = new ListCache(entries);
	}
	
	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	}
	
	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  return this.__data__['delete'](key);
	}
	
	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}
	
	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}
	
	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var cache = this.__data__;
	  if (cache instanceof ListCache) {
	    var pairs = cache.__data__;
	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      return this;
	    }
	    cache = this.__data__ = new MapCache(pairs);
	  }
	  cache.set(key, value);
	  return this;
	}
	
	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;
	
	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  // Safari 9 makes `arguments.length` enumerable in strict mode.
	  var result = (isArray(value) || isArguments(value))
	    ? baseTimes(value.length, String)
	    : [];
	
	  var length = result.length,
	      skipIndexes = !!length;
	
	  for (var key in value) {
	    if ((inherited || hasOwnProperty.call(value, key)) &&
	        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}
	
	/**
	 * The base implementation of `getTag`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  return objectToString.call(value);
	}
	
	/**
	 * The base implementation of `_.isEqual` which supports partial comparisons
	 * and tracks traversed objects.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {boolean} [bitmask] The bitmask of comparison flags.
	 *  The bitmask may be composed of the following flags:
	 *     1 - Unordered comparison
	 *     2 - Partial comparison
	 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, customizer, bitmask, stack) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
	}
	
	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
	 *  for more details.
	 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = arrayTag,
	      othTag = arrayTag;
	
	  if (!objIsArr) {
	    objTag = getTag(object);
	    objTag = objTag == argsTag ? objectTag : objTag;
	  }
	  if (!othIsArr) {
	    othTag = getTag(other);
	    othTag = othTag == argsTag ? objectTag : othTag;
	  }
	  var objIsObj = objTag == objectTag && !isHostObject(object),
	      othIsObj = othTag == objectTag && !isHostObject(other),
	      isSameTag = objTag == othTag;
	
	  if (isSameTag && !objIsObj) {
	    stack || (stack = new Stack);
	    return (objIsArr || isTypedArray(object))
	      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
	      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
	  }
	  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
	    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');
	
	    if (objIsWrapped || othIsWrapped) {
	      var objUnwrapped = objIsWrapped ? object.value() : object,
	          othUnwrapped = othIsWrapped ? other.value() : other;
	
	      stack || (stack = new Stack);
	      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  stack || (stack = new Stack);
	  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
	}
	
	/**
	 * The base implementation of `_.isMatch` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property values to match.
	 * @param {Array} matchData The property names, values, and compare flags to match.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 */
	function baseIsMatch(object, source, matchData, customizer) {
	  var index = matchData.length,
	      length = index,
	      noCustomizer = !customizer;
	
	  if (object == null) {
	    return !length;
	  }
	  object = Object(object);
	  while (index--) {
	    var data = matchData[index];
	    if ((noCustomizer && data[2])
	          ? data[1] !== object[data[0]]
	          : !(data[0] in object)
	        ) {
	      return false;
	    }
	  }
	  while (++index < length) {
	    data = matchData[index];
	    var key = data[0],
	        objValue = object[key],
	        srcValue = data[1];
	
	    if (noCustomizer && data[2]) {
	      if (objValue === undefined && !(key in object)) {
	        return false;
	      }
	    } else {
	      var stack = new Stack;
	      if (customizer) {
	        var result = customizer(objValue, srcValue, key, object, source, stack);
	      }
	      if (!(result === undefined
	            ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack)
	            : result
	          )) {
	        return false;
	      }
	    }
	  }
	  return true;
	}
	
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}
	
	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
	}
	
	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
	 *  for more details.
	 * @param {Object} stack Tracks traversed `array` and `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
	  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
	      arrLength = array.length,
	      othLength = other.length;
	
	  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
	    return false;
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(array);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var index = -1,
	      result = true,
	      seen = (bitmask & UNORDERED_COMPARE_FLAG) ? new SetCache : undefined;
	
	  stack.set(array, other);
	  stack.set(other, array);
	
	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];
	
	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, arrValue, index, other, array, stack)
	        : customizer(arrValue, othValue, index, array, other, stack);
	    }
	    if (compared !== undefined) {
	      if (compared) {
	        continue;
	      }
	      result = false;
	      break;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (seen) {
	      if (!arraySome(other, function(othValue, othIndex) {
	            if (!seen.has(othIndex) &&
	                (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
	              return seen.add(othIndex);
	            }
	          })) {
	        result = false;
	        break;
	      }
	    } else if (!(
	          arrValue === othValue ||
	            equalFunc(arrValue, othValue, customizer, bitmask, stack)
	        )) {
	      result = false;
	      break;
	    }
	  }
	  stack['delete'](array);
	  stack['delete'](other);
	  return result;
	}
	
	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
	 *  for more details.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
	  switch (tag) {
	    case dataViewTag:
	      if ((object.byteLength != other.byteLength) ||
	          (object.byteOffset != other.byteOffset)) {
	        return false;
	      }
	      object = object.buffer;
	      other = other.buffer;
	
	    case arrayBufferTag:
	      if ((object.byteLength != other.byteLength) ||
	          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
	        return false;
	      }
	      return true;
	
	    case boolTag:
	    case dateTag:
	    case numberTag:
	      // Coerce booleans to `1` or `0` and dates to milliseconds.
	      // Invalid dates are coerced to `NaN`.
	      return eq(+object, +other);
	
	    case errorTag:
	      return object.name == other.name && object.message == other.message;
	
	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings, primitives and objects,
	      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
	      // for more details.
	      return object == (other + '');
	
	    case mapTag:
	      var convert = mapToArray;
	
	    case setTag:
	      var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
	      convert || (convert = setToArray);
	
	      if (object.size != other.size && !isPartial) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      var stacked = stack.get(object);
	      if (stacked) {
	        return stacked == other;
	      }
	      bitmask |= UNORDERED_COMPARE_FLAG;
	
	      // Recursively compare objects (susceptible to call stack limits).
	      stack.set(object, other);
	      var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
	      stack['delete'](object);
	      return result;
	
	    case symbolTag:
	      if (symbolValueOf) {
	        return symbolValueOf.call(object) == symbolValueOf.call(other);
	      }
	  }
	  return false;
	}
	
	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
	 *  for more details.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
	  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
	      objProps = keys(object),
	      objLength = objProps.length,
	      othProps = keys(other),
	      othLength = othProps.length;
	
	  if (objLength != othLength && !isPartial) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
	      return false;
	    }
	  }
	  // Assume cyclic values are equal.
	  var stacked = stack.get(object);
	  if (stacked && stack.get(other)) {
	    return stacked == other;
	  }
	  var result = true;
	  stack.set(object, other);
	  stack.set(other, object);
	
	  var skipCtor = isPartial;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key];
	
	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, objValue, key, other, object, stack)
	        : customizer(objValue, othValue, key, object, other, stack);
	    }
	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(compared === undefined
	          ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
	          : compared
	        )) {
	      result = false;
	      break;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (result && !skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;
	
	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      result = false;
	    }
	  }
	  stack['delete'](object);
	  stack['delete'](other);
	  return result;
	}
	
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}
	
	/**
	 * Gets the property names, values, and compare flags of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the match data of `object`.
	 */
	function getMatchData(object) {
	  var result = keys(object),
	      length = result.length;
	
	  while (length--) {
	    var key = result[length],
	        value = object[key];
	
	    result[length] = [key, value, isStrictComparable(value)];
	  }
	  return result;
	}
	
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}
	
	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;
	
	// Fallback for data views, maps, sets, and weak maps in IE 11,
	// for data views in Edge < 14, and promises in Node.js.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
	    (Map && getTag(new Map) != mapTag) ||
	    (Promise && getTag(Promise.resolve()) != promiseTag) ||
	    (Set && getTag(new Set) != setTag) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
	  getTag = function(value) {
	    var result = objectToString.call(value),
	        Ctor = result == objectTag ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : undefined;
	
	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag;
	        case mapCtorString: return mapTag;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag;
	        case weakMapCtorString: return weakMapTag;
	      }
	    }
	    return result;
	  };
	}
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}
	
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}
	
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}
	
	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
	
	  return value === proto;
	}
	
	/**
	 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` if suitable for strict
	 *  equality comparisons, else `false`.
	 */
	function isStrictComparable(value) {
	  return value === value && !isObject(value);
	}
	
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}
	
	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
	    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
	}
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}
	
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/**
	 * This method is like `_.isMatch` except that it accepts `customizer` which
	 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
	 * are handled by the method instead. The `customizer` is invoked with five
	 * arguments: (objValue, srcValue, index|key, object, source).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {Object} object The object to inspect.
	 * @param {Object} source The object of property values to match.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	 * @example
	 *
	 * function isGreeting(value) {
	 *   return /^h(?:i|ello)$/.test(value);
	 * }
	 *
	 * function customizer(objValue, srcValue) {
	 *   if (isGreeting(objValue) && isGreeting(srcValue)) {
	 *     return true;
	 *   }
	 * }
	 *
	 * var object = { 'greeting': 'hello' };
	 * var source = { 'greeting': 'hi' };
	 *
	 * _.isMatchWith(object, source, customizer);
	 * // => true
	 */
	function isMatchWith(object, source, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  return baseIsMatch(object, source, getMatchData(source), customizer);
	}
	
	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
	
	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}
	
	module.exports = isMatchWith;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(4)(module)))

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * @fileoverview Main Doctrine object
	 * @author Yusuke Suzuki <utatane.tea@gmail.com>
	 * @author Dan Tao <daniel.tao@gmail.com>
	 * @author Andrew Eisenberg <andrew@eisenberg.as>
	 */
	
	(function () {
	    'use strict';
	
	    var typed,
	        utility,
	        isArray,
	        jsdoc,
	        esutils,
	        hasOwnProperty;
	
	    esutils = __webpack_require__(6);
	    isArray = __webpack_require__(10);
	    typed = __webpack_require__(11);
	    utility = __webpack_require__(12);
	
	    function sliceSource(source, index, last) {
	        return source.slice(index, last);
	    }
	
	    hasOwnProperty = (function () {
	        var func = Object.prototype.hasOwnProperty;
	        return function hasOwnProperty(obj, name) {
	            return func.call(obj, name);
	        };
	    }());
	
	    function shallowCopy(obj) {
	        var ret = {}, key;
	        for (key in obj) {
	            if (obj.hasOwnProperty(key)) {
	                ret[key] = obj[key];
	            }
	        }
	        return ret;
	    }
	
	    function isASCIIAlphanumeric(ch) {
	        return (ch >= 0x61  /* 'a' */ && ch <= 0x7A  /* 'z' */) ||
	            (ch >= 0x41  /* 'A' */ && ch <= 0x5A  /* 'Z' */) ||
	            (ch >= 0x30  /* '0' */ && ch <= 0x39  /* '9' */);
	    }
	
	    function isParamTitle(title) {
	        return title === 'param' || title === 'argument' || title === 'arg';
	    }
	
	    function isReturnTitle(title) {
	        return title === 'return' || title === 'returns';
	    }
	
	    function isProperty(title) {
	        return title === 'property' || title === 'prop';
	    }
	
	    function isNameParameterRequired(title) {
	        return isParamTitle(title) || isProperty(title) ||
	            title === 'alias' || title === 'this' || title === 'mixes' || title === 'requires';
	    }
	
	    function isAllowedName(title) {
	        return isNameParameterRequired(title) || title === 'const' || title === 'constant';
	    }
	
	    function isAllowedNested(title) {
	        return isProperty(title) || isParamTitle(title);
	    }
	
	    function isAllowedOptional(title) {
	        return isProperty(title) || isParamTitle(title);
	    }
	
	    function isTypeParameterRequired(title) {
	        return isParamTitle(title) || isReturnTitle(title) ||
	            title === 'define' || title === 'enum' ||
	            title === 'implements' || title === 'this' ||
	            title === 'type' || title === 'typedef' || isProperty(title);
	    }
	
	    // Consider deprecation instead using 'isTypeParameterRequired' and 'Rules' declaration to pick when a type is optional/required
	    // This would require changes to 'parseType'
	    function isAllowedType(title) {
	        return isTypeParameterRequired(title) || title === 'throws' || title === 'const' || title === 'constant' ||
	            title === 'namespace' || title === 'member' || title === 'var' || title === 'module' ||
	            title === 'constructor' || title === 'class' || title === 'extends' || title === 'augments' ||
	            title === 'public' || title === 'private' || title === 'protected';
	    }
	
	    function trim(str) {
	        return str.replace(/^\s+/, '').replace(/\s+$/, '');
	    }
	
	    function unwrapComment(doc) {
	        // JSDoc comment is following form
	        //   /**
	        //    * .......
	        //    */
	        // remove /**, */ and *
	        var BEFORE_STAR = 0,
	            STAR = 1,
	            AFTER_STAR = 2,
	            index,
	            len,
	            mode,
	            result,
	            ch;
	
	        doc = doc.replace(/^\/\*\*?/, '').replace(/\*\/$/, '');
	        index = 0;
	        len = doc.length;
	        mode = BEFORE_STAR;
	        result = '';
	
	        while (index < len) {
	            ch = doc.charCodeAt(index);
	            switch (mode) {
	            case BEFORE_STAR:
	                if (esutils.code.isLineTerminator(ch)) {
	                    result += String.fromCharCode(ch);
	                } else if (ch === 0x2A  /* '*' */) {
	                    mode = STAR;
	                } else if (!esutils.code.isWhiteSpace(ch)) {
	                    result += String.fromCharCode(ch);
	                    mode = AFTER_STAR;
	                }
	                break;
	
	            case STAR:
	                if (!esutils.code.isWhiteSpace(ch)) {
	                    result += String.fromCharCode(ch);
	                }
	                mode = esutils.code.isLineTerminator(ch) ? BEFORE_STAR : AFTER_STAR;
	                break;
	
	            case AFTER_STAR:
	                result += String.fromCharCode(ch);
	                if (esutils.code.isLineTerminator(ch)) {
	                    mode = BEFORE_STAR;
	                }
	                break;
	            }
	            index += 1;
	        }
	
	        return result.replace(/\s+$/, '');
	    }
	
	    // JSDoc Tag Parser
	
	    (function (exports) {
	        var Rules,
	            index,
	            lineNumber,
	            length,
	            source,
	            recoverable,
	            sloppy,
	            strict;
	
	        function advance() {
	            var ch = source.charCodeAt(index);
	            index += 1;
	            if (esutils.code.isLineTerminator(ch) && !(ch === 0x0D  /* '\r' */ && source.charCodeAt(index) === 0x0A  /* '\n' */)) {
	                lineNumber += 1;
	            }
	            return String.fromCharCode(ch);
	        }
	
	        function scanTitle() {
	            var title = '';
	            // waste '@'
	            advance();
	
	            while (index < length && isASCIIAlphanumeric(source.charCodeAt(index))) {
	                title += advance();
	            }
	
	            return title;
	        }
	
	        function seekContent() {
	            var ch, waiting, last = index;
	
	            waiting = false;
	            while (last < length) {
	                ch = source.charCodeAt(last);
	                if (esutils.code.isLineTerminator(ch) && !(ch === 0x0D  /* '\r' */ && source.charCodeAt(last + 1) === 0x0A  /* '\n' */)) {
	                    waiting = true;
	                } else if (waiting) {
	                    if (ch === 0x40  /* '@' */) {
	                        break;
	                    }
	                    if (!esutils.code.isWhiteSpace(ch)) {
	                        waiting = false;
	                    }
	                }
	                last += 1;
	            }
	            return last;
	        }
	
	        // type expression may have nest brace, such as,
	        // { { ok: string } }
	        //
	        // therefore, scanning type expression with balancing braces.
	        function parseType(title, last) {
	            var ch, brace, type, direct = false;
	
	
	            // search '{'
	            while (index < last) {
	                ch = source.charCodeAt(index);
	                if (esutils.code.isWhiteSpace(ch)) {
	                    advance();
	                } else if (ch === 0x7B  /* '{' */) {
	                    advance();
	                    break;
	                } else {
	                    // this is direct pattern
	                    direct = true;
	                    break;
	                }
	            }
	
	
	            if (direct) {
	                return null;
	            }
	
	            // type expression { is found
	            brace = 1;
	            type = '';
	            while (index < last) {
	                ch = source.charCodeAt(index);
	                if (esutils.code.isLineTerminator(ch)) {
	                    advance();
	                } else {
	                    if (ch === 0x7D  /* '}' */) {
	                        brace -= 1;
	                        if (brace === 0) {
	                            advance();
	                            break;
	                        }
	                    } else if (ch === 0x7B  /* '{' */) {
	                        brace += 1;
	                    }
	                    type += advance();
	                }
	            }
	
	            if (brace !== 0) {
	                // braces is not balanced
	                return utility.throwError('Braces are not balanced');
	            }
	
	            if (isAllowedOptional(title)) {
	                return typed.parseParamType(type);
	            }
	
	            return typed.parseType(type);
	        }
	
	        function scanIdentifier(last) {
	            var identifier;
	            if (!esutils.code.isIdentifierStartES5(source.charCodeAt(index))) {
	                return null;
	            }
	            identifier = advance();
	            while (index < last && esutils.code.isIdentifierPartES5(source.charCodeAt(index))) {
	                identifier += advance();
	            }
	            return identifier;
	        }
	
	        function skipWhiteSpace(last) {
	            while (index < last && (esutils.code.isWhiteSpace(source.charCodeAt(index)) || esutils.code.isLineTerminator(source.charCodeAt(index)))) {
	                advance();
	            }
	        }
	
	        function parseName(last, allowBrackets, allowNestedParams) {
	            var name = '',
	                useBrackets,
	                insideString;
	
	
	            skipWhiteSpace(last);
	
	            if (index >= last) {
	                return null;
	            }
	
	            if (allowBrackets && source.charCodeAt(index) === 0x5B  /* '[' */) {
	                useBrackets = true;
	                name = advance();
	            }
	
	            if (!esutils.code.isIdentifierStartES5(source.charCodeAt(index))) {
	                return null;
	            }
	
	            name += scanIdentifier(last);
	
	            if (allowNestedParams) {
	                if (source.charCodeAt(index) === 0x3A /* ':' */ && (
	                        name === 'module' ||
	                        name === 'external' ||
	                        name === 'event')) {
	                    name += advance();
	                    name += scanIdentifier(last);
	
	                }
	                if(source.charCodeAt(index) === 0x5B  /* '[' */ && source.charCodeAt(index + 1) === 0x5D  /* ']' */){
	                    name += advance();
	                    name += advance();
	                }
	                while (source.charCodeAt(index) === 0x2E  /* '.' */ ||
	                        source.charCodeAt(index) === 0x2F  /* '/' */ ||
	                        source.charCodeAt(index) === 0x23  /* '#' */ ||
	                        source.charCodeAt(index) === 0x2D  /* '-' */ ||
	                        source.charCodeAt(index) === 0x7E  /* '~' */) {
	                    name += advance();
	                    name += scanIdentifier(last);
	                }
	            }
	
	            if (useBrackets) {
	                skipWhiteSpace(last);
	                // do we have a default value for this?
	                if (source.charCodeAt(index) === 0x3D  /* '=' */) {
	                    // consume the '='' symbol
	                    name += advance();
	                    skipWhiteSpace(last);
	
	                    var ch;
	                    var bracketDepth = 1;
	
	                    // scan in the default value
	                    while (index < last) {
	                        ch = source.charCodeAt(index);
	
	                        if (esutils.code.isWhiteSpace(ch)) {
	                            if (!insideString) {
	                                skipWhiteSpace(last);
	                                ch = source.charCodeAt(index);
	                            }
	                        }
	
	                        if (ch === 0x27 /* ''' */) {
	                            if (!insideString) {
	                                insideString = '\'';
	                            } else {
	                                if (insideString === '\'') {
	                                    insideString = '';
	                                }
	                            }
	                        }
	
	                        if (ch === 0x22 /* '"' */) {
	                            if (!insideString) {
	                                insideString = '"';
	                            } else {
	                                if (insideString === '"') {
	                                    insideString = '';
	                                }
	                            }
	                        }
	
	                        if (ch === 0x5B /* '[' */) {
	                            bracketDepth++;
	                        } else if (ch === 0x5D  /* ']' */ &&
	                            --bracketDepth === 0) {
	                            break;
	                        }
	
	                        name += advance();
	                    }
	                }
	
	                skipWhiteSpace(last);
	
	                if (index >= last || source.charCodeAt(index) !== 0x5D  /* ']' */) {
	                    // we never found a closing ']'
	                    return null;
	                }
	
	                // collect the last ']'
	                name += advance();
	            }
	
	            return name;
	        }
	
	        function skipToTag() {
	            while (index < length && source.charCodeAt(index) !== 0x40  /* '@' */) {
	                advance();
	            }
	            if (index >= length) {
	                return false;
	            }
	            utility.assert(source.charCodeAt(index) === 0x40  /* '@' */);
	            return true;
	        }
	
	        function TagParser(options, title) {
	            this._options = options;
	            this._title = title.toLowerCase();
	            this._tag = {
	                title: title,
	                description: null
	            };
	            if (this._options.lineNumbers) {
	                this._tag.lineNumber = lineNumber;
	            }
	            this._last = 0;
	            // space to save special information for title parsers.
	            this._extra = { };
	        }
	
	        // addError(err, ...)
	        TagParser.prototype.addError = function addError(errorText) {
	            var args = Array.prototype.slice.call(arguments, 1),
	                msg = errorText.replace(
	                    /%(\d)/g,
	                    function (whole, index) {
	                        utility.assert(index < args.length, 'Message reference must be in range');
	                        return args[index];
	                    }
	                );
	
	            if (!this._tag.errors) {
	                this._tag.errors = [];
	            }
	            if (strict) {
	                utility.throwError(msg);
	            }
	            this._tag.errors.push(msg);
	            return recoverable;
	        };
	
	        TagParser.prototype.parseType = function () {
	            // type required titles
	            if (isTypeParameterRequired(this._title)) {
	                try {
	                    this._tag.type = parseType(this._title, this._last);
	                    if (!this._tag.type) {
	                        if (!isParamTitle(this._title) && !isReturnTitle(this._title)) {
	                            if (!this.addError('Missing or invalid tag type')) {
	                                return false;
	                            }
	                        }
	                    }
	                } catch (error) {
	                    this._tag.type = null;
	                    if (!this.addError(error.message)) {
	                        return false;
	                    }
	                }
	            } else if (isAllowedType(this._title)) {
	                // optional types
	                try {
	                    this._tag.type = parseType(this._title, this._last);
	                } catch (e) {
	                    //For optional types, lets drop the thrown error when we hit the end of the file
	                }
	            }
	            return true;
	        };
	
	        TagParser.prototype._parseNamePath = function (optional) {
	            var name;
	            name = parseName(this._last, sloppy && isAllowedOptional(this._title), true);
	            if (!name) {
	                if (!optional) {
	                    if (!this.addError('Missing or invalid tag name')) {
	                        return false;
	                    }
	                }
	            }
	            this._tag.name = name;
	            return true;
	        };
	
	        TagParser.prototype.parseNamePath = function () {
	            return this._parseNamePath(false);
	        };
	
	        TagParser.prototype.parseNamePathOptional = function () {
	            return this._parseNamePath(true);
	        };
	
	
	        TagParser.prototype.parseName = function () {
	            var assign, name;
	
	            // param, property requires name
	            if (isAllowedName(this._title)) {
	                this._tag.name = parseName(this._last, sloppy && isAllowedOptional(this._title), isAllowedNested(this._title));
	                if (!this._tag.name) {
	                    if (!isNameParameterRequired(this._title)) {
	                        return true;
	                    }
	
	                    // it's possible the name has already been parsed but interpreted as a type
	                    // it's also possible this is a sloppy declaration, in which case it will be
	                    // fixed at the end
	                    if (isParamTitle(this._title) && this._tag.type && this._tag.type.name) {
	                        this._extra.name = this._tag.type;
	                        this._tag.name = this._tag.type.name;
	                        this._tag.type = null;
	                    } else {
	                        if (!this.addError('Missing or invalid tag name')) {
	                            return false;
	                        }
	                    }
	                } else {
	                    name = this._tag.name;
	                    if (name.charAt(0) === '[' && name.charAt(name.length - 1) === ']') {
	                        // extract the default value if there is one
	                        // example: @param {string} [somebody=John Doe] description
	                        assign = name.substring(1, name.length - 1).split('=');
	                        if (assign[1]) {
	                            this._tag['default'] = assign[1];
	                        }
	                        this._tag.name = assign[0];
	
	                        // convert to an optional type
	                        if (this._tag.type && this._tag.type.type !== 'OptionalType') {
	                            this._tag.type = {
	                                type: 'OptionalType',
	                                expression: this._tag.type
	                            };
	                        }
	                    }
	                }
	            }
	
	
	            return true;
	        };
	
	        TagParser.prototype.parseDescription = function parseDescription() {
	            var description = trim(sliceSource(source, index, this._last));
	            if (description) {
	                if ((/^-\s+/).test(description)) {
	                    description = description.substring(2);
	                }
	                this._tag.description = description;
	            }
	            return true;
	        };
	
	        TagParser.prototype.parseCaption = function parseDescription() {
	            var description = trim(sliceSource(source, index, this._last));
	            var captionStartTag = '<caption>';
	            var captionEndTag = '</caption>';
	            var captionStart = description.indexOf(captionStartTag);
	            var captionEnd = description.indexOf(captionEndTag);
	            if (captionStart >= 0 && captionEnd >= 0) {
	                this._tag.caption = trim(description.substring(
	                    captionStart + captionStartTag.length, captionEnd));
	                this._tag.description = trim(description.substring(captionEnd + captionEndTag.length));
	            } else {
	                this._tag.description = description;
	            }
	            return true;
	        };
	
	        TagParser.prototype.parseKind = function parseKind() {
	            var kind, kinds;
	            kinds = {
	                'class': true,
	                'constant': true,
	                'event': true,
	                'external': true,
	                'file': true,
	                'function': true,
	                'member': true,
	                'mixin': true,
	                'module': true,
	                'namespace': true,
	                'typedef': true
	            };
	            kind = trim(sliceSource(source, index, this._last));
	            this._tag.kind = kind;
	            if (!hasOwnProperty(kinds, kind)) {
	                if (!this.addError('Invalid kind name \'%0\'', kind)) {
	                    return false;
	                }
	            }
	            return true;
	        };
	
	        TagParser.prototype.parseAccess = function parseAccess() {
	            var access;
	            access = trim(sliceSource(source, index, this._last));
	            this._tag.access = access;
	            if (access !== 'private' && access !== 'protected' && access !== 'public') {
	                if (!this.addError('Invalid access name \'%0\'', access)) {
	                    return false;
	                }
	            }
	            return true;
	        };
	
	        TagParser.prototype.parseThis = function parseAccess() {
	            // this name may be a name expression (e.g. {foo.bar})
	            // or a name path (e.g. foo.bar)
	            var value = trim(sliceSource(source, index, this._last));
	            if (value && value.charAt(0) === '{') {
	                var gotType = this.parseType();
	                if (gotType && this._tag.type.type === 'NameExpression') {
	                    this._tag.name = this._tag.type.name;
	                    return true;
	                } else {
	                    return this.addError('Invalid name for this');
	                }
	            } else {
	                return this.parseNamePath();
	            }
	        };
	
	        TagParser.prototype.parseVariation = function parseVariation() {
	            var variation, text;
	            text = trim(sliceSource(source, index, this._last));
	            variation = parseFloat(text, 10);
	            this._tag.variation = variation;
	            if (isNaN(variation)) {
	                if (!this.addError('Invalid variation \'%0\'', text)) {
	                    return false;
	                }
	            }
	            return true;
	        };
	
	        TagParser.prototype.ensureEnd = function () {
	            var shouldBeEmpty = trim(sliceSource(source, index, this._last));
	            if (shouldBeEmpty) {
	                if (!this.addError('Unknown content \'%0\'', shouldBeEmpty)) {
	                    return false;
	                }
	            }
	            return true;
	        };
	
	        TagParser.prototype.epilogue = function epilogue() {
	            var description;
	
	            description = this._tag.description;
	            // un-fix potentially sloppy declaration
	            if (isAllowedOptional(this._title) && !this._tag.type && description && description.charAt(0) === '[') {
	                this._tag.type = this._extra.name;
	                if (!this._tag.name) {
	                    this._tag.name = undefined;
	                }
	
	                if (!sloppy) {
	                    if (!this.addError('Missing or invalid tag name')) {
	                        return false;
	                    }
	                }
	            }
	
	            return true;
	        };
	
	        Rules = {
	            // http://usejsdoc.org/tags-access.html
	            'access': ['parseAccess'],
	            // http://usejsdoc.org/tags-alias.html
	            'alias': ['parseNamePath', 'ensureEnd'],
	            // http://usejsdoc.org/tags-augments.html
	            'augments': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-constructor.html
	            'constructor': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // Synonym: http://usejsdoc.org/tags-constructor.html
	            'class': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // Synonym: http://usejsdoc.org/tags-extends.html
	            'extends': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-example.html
	            'example': ['parseCaption'],
	            // http://usejsdoc.org/tags-deprecated.html
	            'deprecated': ['parseDescription'],
	            // http://usejsdoc.org/tags-global.html
	            'global': ['ensureEnd'],
	            // http://usejsdoc.org/tags-inner.html
	            'inner': ['ensureEnd'],
	            // http://usejsdoc.org/tags-instance.html
	            'instance': ['ensureEnd'],
	            // http://usejsdoc.org/tags-kind.html
	            'kind': ['parseKind'],
	            // http://usejsdoc.org/tags-mixes.html
	            'mixes': ['parseNamePath', 'ensureEnd'],
	            // http://usejsdoc.org/tags-mixin.html
	            'mixin': ['parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-member.html
	            'member': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-method.html
	            'method': ['parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-module.html
	            'module': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // Synonym: http://usejsdoc.org/tags-method.html
	            'func': ['parseNamePathOptional', 'ensureEnd'],
	            // Synonym: http://usejsdoc.org/tags-method.html
	            'function': ['parseNamePathOptional', 'ensureEnd'],
	            // Synonym: http://usejsdoc.org/tags-member.html
	            'var': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-name.html
	            'name': ['parseNamePath', 'ensureEnd'],
	            // http://usejsdoc.org/tags-namespace.html
	            'namespace': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	            // http://usejsdoc.org/tags-private.html
	            'private': ['parseType', 'parseDescription'],
	            // http://usejsdoc.org/tags-protected.html
	            'protected': ['parseType', 'parseDescription'],
	            // http://usejsdoc.org/tags-public.html
	            'public': ['parseType', 'parseDescription'],
	            // http://usejsdoc.org/tags-readonly.html
	            'readonly': ['ensureEnd'],
	            // http://usejsdoc.org/tags-requires.html
	            'requires': ['parseNamePath', 'ensureEnd'],
	            // http://usejsdoc.org/tags-since.html
	            'since': ['parseDescription'],
	            // http://usejsdoc.org/tags-static.html
	            'static': ['ensureEnd'],
	            // http://usejsdoc.org/tags-summary.html
	            'summary': ['parseDescription'],
	            // http://usejsdoc.org/tags-this.html
	            'this': ['parseThis', 'ensureEnd'],
	            // http://usejsdoc.org/tags-todo.html
	            'todo': ['parseDescription'],
	            // http://usejsdoc.org/tags-typedef.html
	            'typedef': ['parseType', 'parseNamePathOptional'],
	            // http://usejsdoc.org/tags-variation.html
	            'variation': ['parseVariation'],
	            // http://usejsdoc.org/tags-version.html
	            'version': ['parseDescription']
	        };
	
	        TagParser.prototype.parse = function parse() {
	            var i, iz, sequences, method;
	
	
	            // empty title
	            if (!this._title) {
	                if (!this.addError('Missing or invalid title')) {
	                    return null;
	                }
	            }
	
	            // Seek to content last index.
	            this._last = seekContent(this._title);
	
	            if (hasOwnProperty(Rules, this._title)) {
	                sequences = Rules[this._title];
	            } else {
	                // default sequences
	                sequences = ['parseType', 'parseName', 'parseDescription', 'epilogue'];
	            }
	
	            for (i = 0, iz = sequences.length; i < iz; ++i) {
	                method = sequences[i];
	                if (!this[method]()) {
	                    return null;
	                }
	            }
	
	            return this._tag;
	        };
	
	        function parseTag(options) {
	            var title, parser, tag;
	
	            // skip to tag
	            if (!skipToTag()) {
	                return null;
	            }
	
	            // scan title
	            title = scanTitle();
	
	            // construct tag parser
	            parser = new TagParser(options, title);
	            tag = parser.parse();
	
	            // Seek global index to end of this tag.
	            while (index < parser._last) {
	                advance();
	            }
	
	            return tag;
	        }
	
	        //
	        // Parse JSDoc
	        //
	
	        function scanJSDocDescription(preserveWhitespace) {
	            var description = '', ch, atAllowed;
	
	            atAllowed = true;
	            while (index < length) {
	                ch = source.charCodeAt(index);
	
	                if (atAllowed && ch === 0x40  /* '@' */) {
	                    break;
	                }
	
	                if (esutils.code.isLineTerminator(ch)) {
	                    atAllowed = true;
	                } else if (atAllowed && !esutils.code.isWhiteSpace(ch)) {
	                    atAllowed = false;
	                }
	
	                description += advance();
	            }
	
	            return preserveWhitespace ? description : trim(description);
	        }
	
	        function parse(comment, options) {
	            var tags = [], tag, description, interestingTags, i, iz;
	
	            if (options === undefined) {
	                options = {};
	            }
	
	            if (typeof options.unwrap === 'boolean' && options.unwrap) {
	                source = unwrapComment(comment);
	            } else {
	                source = comment;
	            }
	
	            // array of relevant tags
	            if (options.tags) {
	                if (isArray(options.tags)) {
	                    interestingTags = { };
	                    for (i = 0, iz = options.tags.length; i < iz; i++) {
	                        if (typeof options.tags[i] === 'string') {
	                            interestingTags[options.tags[i]] = true;
	                        } else {
	                            utility.throwError('Invalid "tags" parameter: ' + options.tags);
	                        }
	                    }
	                } else {
	                    utility.throwError('Invalid "tags" parameter: ' + options.tags);
	                }
	            }
	
	            length = source.length;
	            index = 0;
	            lineNumber = 0;
	            recoverable = options.recoverable;
	            sloppy = options.sloppy;
	            strict = options.strict;
	
	            description = scanJSDocDescription(options.preserveWhitespace);
	
	            while (true) {
	                tag = parseTag(options);
	                if (!tag) {
	                    break;
	                }
	                if (!interestingTags || interestingTags.hasOwnProperty(tag.title)) {
	                    tags.push(tag);
	                }
	            }
	
	            return {
	                description: description,
	                tags: tags
	            };
	        }
	        exports.parse = parse;
	    }(jsdoc = {}));
	
	    exports.version = utility.VERSION;
	    exports.parse = jsdoc.parse;
	    exports.parseType = typed.parseType;
	    exports.parseParamType = typed.parseParamType;
	    exports.unwrapComment = unwrapComment;
	    exports.Syntax = shallowCopy(typed.Syntax);
	    exports.Error = utility.DoctrineError;
	    exports.type = {
	        Syntax: exports.Syntax,
	        parseType: typed.parseType,
	        parseParamType: typed.parseParamType,
	        stringify: typed.stringify
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>
	
	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:
	
	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.
	
	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	
	
	(function () {
	    'use strict';
	
	    exports.ast = __webpack_require__(7);
	    exports.code = __webpack_require__(8);
	    exports.keyword = __webpack_require__(9);
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 7 */
/***/ function(module, exports) {

	/*
	  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>
	
	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:
	
	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.
	
	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	
	(function () {
	    'use strict';
	
	    function isExpression(node) {
	        if (node == null) { return false; }
	        switch (node.type) {
	            case 'ArrayExpression':
	            case 'AssignmentExpression':
	            case 'BinaryExpression':
	            case 'CallExpression':
	            case 'ConditionalExpression':
	            case 'FunctionExpression':
	            case 'Identifier':
	            case 'Literal':
	            case 'LogicalExpression':
	            case 'MemberExpression':
	            case 'NewExpression':
	            case 'ObjectExpression':
	            case 'SequenceExpression':
	            case 'ThisExpression':
	            case 'UnaryExpression':
	            case 'UpdateExpression':
	                return true;
	        }
	        return false;
	    }
	
	    function isIterationStatement(node) {
	        if (node == null) { return false; }
	        switch (node.type) {
	            case 'DoWhileStatement':
	            case 'ForInStatement':
	            case 'ForStatement':
	            case 'WhileStatement':
	                return true;
	        }
	        return false;
	    }
	
	    function isStatement(node) {
	        if (node == null) { return false; }
	        switch (node.type) {
	            case 'BlockStatement':
	            case 'BreakStatement':
	            case 'ContinueStatement':
	            case 'DebuggerStatement':
	            case 'DoWhileStatement':
	            case 'EmptyStatement':
	            case 'ExpressionStatement':
	            case 'ForInStatement':
	            case 'ForStatement':
	            case 'IfStatement':
	            case 'LabeledStatement':
	            case 'ReturnStatement':
	            case 'SwitchStatement':
	            case 'ThrowStatement':
	            case 'TryStatement':
	            case 'VariableDeclaration':
	            case 'WhileStatement':
	            case 'WithStatement':
	                return true;
	        }
	        return false;
	    }
	
	    function isSourceElement(node) {
	      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
	    }
	
	    function trailingStatement(node) {
	        switch (node.type) {
	        case 'IfStatement':
	            if (node.alternate != null) {
	                return node.alternate;
	            }
	            return node.consequent;
	
	        case 'LabeledStatement':
	        case 'ForStatement':
	        case 'ForInStatement':
	        case 'WhileStatement':
	        case 'WithStatement':
	            return node.body;
	        }
	        return null;
	    }
	
	    function isProblematicIfStatement(node) {
	        var current;
	
	        if (node.type !== 'IfStatement') {
	            return false;
	        }
	        if (node.alternate == null) {
	            return false;
	        }
	        current = node.consequent;
	        do {
	            if (current.type === 'IfStatement') {
	                if (current.alternate == null)  {
	                    return true;
	                }
	            }
	            current = trailingStatement(current);
	        } while (current);
	
	        return false;
	    }
	
	    module.exports = {
	        isExpression: isExpression,
	        isStatement: isStatement,
	        isIterationStatement: isIterationStatement,
	        isSourceElement: isSourceElement,
	        isProblematicIfStatement: isProblematicIfStatement,
	
	        trailingStatement: trailingStatement
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 8 */
/***/ function(module, exports) {

	/*
	  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
	  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>
	
	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:
	
	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.
	
	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	
	(function () {
	    'use strict';
	
	    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;
	
	    // See `tools/generate-identifier-regex.js`.
	    ES5Regex = {
	        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
	        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
	        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
	        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
	    };
	
	    ES6Regex = {
	        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
	        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
	        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
	        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
	    };
	
	    function isDecimalDigit(ch) {
	        return 0x30 <= ch && ch <= 0x39;  // 0..9
	    }
	
	    function isHexDigit(ch) {
	        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
	            0x61 <= ch && ch <= 0x66 ||     // a..f
	            0x41 <= ch && ch <= 0x46;       // A..F
	    }
	
	    function isOctalDigit(ch) {
	        return ch >= 0x30 && ch <= 0x37;  // 0..7
	    }
	
	    // 7.2 White Space
	
	    NON_ASCII_WHITESPACES = [
	        0x1680, 0x180E,
	        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
	        0x202F, 0x205F,
	        0x3000,
	        0xFEFF
	    ];
	
	    function isWhiteSpace(ch) {
	        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
	            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
	    }
	
	    // 7.3 Line Terminators
	
	    function isLineTerminator(ch) {
	        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
	    }
	
	    // 7.6 Identifier Names and Identifiers
	
	    function fromCodePoint(cp) {
	        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
	        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
	        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
	        return cu1 + cu2;
	    }
	
	    IDENTIFIER_START = new Array(0x80);
	    for(ch = 0; ch < 0x80; ++ch) {
	        IDENTIFIER_START[ch] =
	            ch >= 0x61 && ch <= 0x7A ||  // a..z
	            ch >= 0x41 && ch <= 0x5A ||  // A..Z
	            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
	    }
	
	    IDENTIFIER_PART = new Array(0x80);
	    for(ch = 0; ch < 0x80; ++ch) {
	        IDENTIFIER_PART[ch] =
	            ch >= 0x61 && ch <= 0x7A ||  // a..z
	            ch >= 0x41 && ch <= 0x5A ||  // A..Z
	            ch >= 0x30 && ch <= 0x39 ||  // 0..9
	            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
	    }
	
	    function isIdentifierStartES5(ch) {
	        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
	    }
	
	    function isIdentifierPartES5(ch) {
	        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
	    }
	
	    function isIdentifierStartES6(ch) {
	        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
	    }
	
	    function isIdentifierPartES6(ch) {
	        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
	    }
	
	    module.exports = {
	        isDecimalDigit: isDecimalDigit,
	        isHexDigit: isHexDigit,
	        isOctalDigit: isOctalDigit,
	        isWhiteSpace: isWhiteSpace,
	        isLineTerminator: isLineTerminator,
	        isIdentifierStartES5: isIdentifierStartES5,
	        isIdentifierPartES5: isIdentifierPartES5,
	        isIdentifierStartES6: isIdentifierStartES6,
	        isIdentifierPartES6: isIdentifierPartES6
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>
	
	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:
	
	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.
	
	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	
	(function () {
	    'use strict';
	
	    var code = __webpack_require__(8);
	
	    function isStrictModeReservedWordES6(id) {
	        switch (id) {
	        case 'implements':
	        case 'interface':
	        case 'package':
	        case 'private':
	        case 'protected':
	        case 'public':
	        case 'static':
	        case 'let':
	            return true;
	        default:
	            return false;
	        }
	    }
	
	    function isKeywordES5(id, strict) {
	        // yield should not be treated as keyword under non-strict mode.
	        if (!strict && id === 'yield') {
	            return false;
	        }
	        return isKeywordES6(id, strict);
	    }
	
	    function isKeywordES6(id, strict) {
	        if (strict && isStrictModeReservedWordES6(id)) {
	            return true;
	        }
	
	        switch (id.length) {
	        case 2:
	            return (id === 'if') || (id === 'in') || (id === 'do');
	        case 3:
	            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
	        case 4:
	            return (id === 'this') || (id === 'else') || (id === 'case') ||
	                (id === 'void') || (id === 'with') || (id === 'enum');
	        case 5:
	            return (id === 'while') || (id === 'break') || (id === 'catch') ||
	                (id === 'throw') || (id === 'const') || (id === 'yield') ||
	                (id === 'class') || (id === 'super');
	        case 6:
	            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
	                (id === 'switch') || (id === 'export') || (id === 'import');
	        case 7:
	            return (id === 'default') || (id === 'finally') || (id === 'extends');
	        case 8:
	            return (id === 'function') || (id === 'continue') || (id === 'debugger');
	        case 10:
	            return (id === 'instanceof');
	        default:
	            return false;
	        }
	    }
	
	    function isReservedWordES5(id, strict) {
	        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
	    }
	
	    function isReservedWordES6(id, strict) {
	        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
	    }
	
	    function isRestrictedWord(id) {
	        return id === 'eval' || id === 'arguments';
	    }
	
	    function isIdentifierNameES5(id) {
	        var i, iz, ch;
	
	        if (id.length === 0) { return false; }
	
	        ch = id.charCodeAt(0);
	        if (!code.isIdentifierStartES5(ch)) {
	            return false;
	        }
	
	        for (i = 1, iz = id.length; i < iz; ++i) {
	            ch = id.charCodeAt(i);
	            if (!code.isIdentifierPartES5(ch)) {
	                return false;
	            }
	        }
	        return true;
	    }
	
	    function decodeUtf16(lead, trail) {
	        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
	    }
	
	    function isIdentifierNameES6(id) {
	        var i, iz, ch, lowCh, check;
	
	        if (id.length === 0) { return false; }
	
	        check = code.isIdentifierStartES6;
	        for (i = 0, iz = id.length; i < iz; ++i) {
	            ch = id.charCodeAt(i);
	            if (0xD800 <= ch && ch <= 0xDBFF) {
	                ++i;
	                if (i >= iz) { return false; }
	                lowCh = id.charCodeAt(i);
	                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
	                    return false;
	                }
	                ch = decodeUtf16(ch, lowCh);
	            }
	            if (!check(ch)) {
	                return false;
	            }
	            check = code.isIdentifierPartES6;
	        }
	        return true;
	    }
	
	    function isIdentifierES5(id, strict) {
	        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
	    }
	
	    function isIdentifierES6(id, strict) {
	        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
	    }
	
	    module.exports = {
	        isKeywordES5: isKeywordES5,
	        isKeywordES6: isKeywordES6,
	        isReservedWordES5: isReservedWordES5,
	        isReservedWordES6: isReservedWordES6,
	        isRestrictedWord: isRestrictedWord,
	        isIdentifierNameES5: isIdentifierNameES5,
	        isIdentifierNameES6: isIdentifierNameES6,
	        isIdentifierES5: isIdentifierES5,
	        isIdentifierES6: isIdentifierES6
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 10 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * @fileoverview Type expression parser.
	 * @author Yusuke Suzuki <utatane.tea@gmail.com>
	 * @author Dan Tao <daniel.tao@gmail.com>
	 * @author Andrew Eisenberg <andrew@eisenberg.as>
	 */
	
	// "typed", the Type Expression Parser for doctrine.
	
	(function () {
	    'use strict';
	
	    var Syntax,
	        Token,
	        source,
	        length,
	        index,
	        previous,
	        token,
	        value,
	        esutils,
	        utility;
	
	    esutils = __webpack_require__(6);
	    utility = __webpack_require__(12);
	
	    Syntax = {
	        NullableLiteral: 'NullableLiteral',
	        AllLiteral: 'AllLiteral',
	        NullLiteral: 'NullLiteral',
	        UndefinedLiteral: 'UndefinedLiteral',
	        VoidLiteral: 'VoidLiteral',
	        UnionType: 'UnionType',
	        ArrayType: 'ArrayType',
	        RecordType: 'RecordType',
	        FieldType: 'FieldType',
	        FunctionType: 'FunctionType',
	        ParameterType: 'ParameterType',
	        RestType: 'RestType',
	        NonNullableType: 'NonNullableType',
	        OptionalType: 'OptionalType',
	        NullableType: 'NullableType',
	        NameExpression: 'NameExpression',
	        TypeApplication: 'TypeApplication',
	        StringLiteralType: 'StringLiteralType',
	        NumericLiteralType: 'NumericLiteralType',
	        BooleanLiteralType: 'BooleanLiteralType'
	    };
	
	    Token = {
	        ILLEGAL: 0,    // ILLEGAL
	        DOT_LT: 1,     // .<
	        REST: 2,       // ...
	        LT: 3,         // <
	        GT: 4,         // >
	        LPAREN: 5,     // (
	        RPAREN: 6,     // )
	        LBRACE: 7,     // {
	        RBRACE: 8,     // }
	        LBRACK: 9,    // [
	        RBRACK: 10,    // ]
	        COMMA: 11,     // ,
	        COLON: 12,     // :
	        STAR: 13,      // *
	        PIPE: 14,      // |
	        QUESTION: 15,  // ?
	        BANG: 16,      // !
	        EQUAL: 17,     // =
	        NAME: 18,      // name token
	        STRING: 19,    // string
	        NUMBER: 20,    // number
	        EOF: 21
	    };
	
	    function isTypeName(ch) {
	        return '><(){}[],:*|?!='.indexOf(String.fromCharCode(ch)) === -1 && !esutils.code.isWhiteSpace(ch) && !esutils.code.isLineTerminator(ch);
	    }
	
	    function Context(previous, index, token, value) {
	        this._previous = previous;
	        this._index = index;
	        this._token = token;
	        this._value = value;
	    }
	
	    Context.prototype.restore = function () {
	        previous = this._previous;
	        index = this._index;
	        token = this._token;
	        value = this._value;
	    };
	
	    Context.save = function () {
	        return new Context(previous, index, token, value);
	    };
	
	    function advance() {
	        var ch = source.charAt(index);
	        index += 1;
	        return ch;
	    }
	
	    function scanHexEscape(prefix) {
	        var i, len, ch, code = 0;
	
	        len = (prefix === 'u') ? 4 : 2;
	        for (i = 0; i < len; ++i) {
	            if (index < length && esutils.code.isHexDigit(source.charCodeAt(index))) {
	                ch = advance();
	                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
	            } else {
	                return '';
	            }
	        }
	        return String.fromCharCode(code);
	    }
	
	    function scanString() {
	        var str = '', quote, ch, code, unescaped, restore; //TODO review removal octal = false
	        quote = source.charAt(index);
	        ++index;
	
	        while (index < length) {
	            ch = advance();
	
	            if (ch === quote) {
	                quote = '';
	                break;
	            } else if (ch === '\\') {
	                ch = advance();
	                if (!esutils.code.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                    case 'n':
	                        str += '\n';
	                        break;
	                    case 'r':
	                        str += '\r';
	                        break;
	                    case 't':
	                        str += '\t';
	                        break;
	                    case 'u':
	                    case 'x':
	                        restore = index;
	                        unescaped = scanHexEscape(ch);
	                        if (unescaped) {
	                            str += unescaped;
	                        } else {
	                            index = restore;
	                            str += ch;
	                        }
	                        break;
	                    case 'b':
	                        str += '\b';
	                        break;
	                    case 'f':
	                        str += '\f';
	                        break;
	                    case 'v':
	                        str += '\v';
	                        break;
	
	                    default:
	                        if (esutils.code.isOctalDigit(ch.charCodeAt(0))) {
	                            code = '01234567'.indexOf(ch);
	
	                            // \0 is not octal escape sequence
	                            // Deprecating unused code. TODO review removal
	                            //if (code !== 0) {
	                            //    octal = true;
	                            //}
	
	                            if (index < length && esutils.code.isOctalDigit(source.charCodeAt(index))) {
	                                //TODO Review Removal octal = true;
	                                code = code * 8 + '01234567'.indexOf(advance());
	
	                                // 3 digits are only allowed when string starts
	                                // with 0, 1, 2, 3
	                                if ('0123'.indexOf(ch) >= 0 &&
	                                        index < length &&
	                                        esutils.code.isOctalDigit(source.charCodeAt(index))) {
	                                    code = code * 8 + '01234567'.indexOf(advance());
	                                }
	                            }
	                            str += String.fromCharCode(code);
	                        } else {
	                            str += ch;
	                        }
	                        break;
	                    }
	                } else {
	                    if (ch ===  '\r' && source.charCodeAt(index) === 0x0A  /* '\n' */) {
	                        ++index;
	                    }
	                }
	            } else if (esutils.code.isLineTerminator(ch.charCodeAt(0))) {
	                break;
	            } else {
	                str += ch;
	            }
	        }
	
	        if (quote !== '') {
	            utility.throwError('unexpected quote');
	        }
	
	        value = str;
	        return Token.STRING;
	    }
	
	    function scanNumber() {
	        var number, ch;
	
	        number = '';
	        ch = source.charCodeAt(index);
	
	        if (ch !== 0x2E  /* '.' */) {
	            number = advance();
	            ch = source.charCodeAt(index);
	
	            if (number === '0') {
	                if (ch === 0x78  /* 'x' */ || ch === 0x58  /* 'X' */) {
	                    number += advance();
	                    while (index < length) {
	                        ch = source.charCodeAt(index);
	                        if (!esutils.code.isHexDigit(ch)) {
	                            break;
	                        }
	                        number += advance();
	                    }
	
	                    if (number.length <= 2) {
	                        // only 0x
	                        utility.throwError('unexpected token');
	                    }
	
	                    if (index < length) {
	                        ch = source.charCodeAt(index);
	                        if (esutils.code.isIdentifierStartES5(ch)) {
	                            utility.throwError('unexpected token');
	                        }
	                    }
	                    value = parseInt(number, 16);
	                    return Token.NUMBER;
	                }
	
	                if (esutils.code.isOctalDigit(ch)) {
	                    number += advance();
	                    while (index < length) {
	                        ch = source.charCodeAt(index);
	                        if (!esutils.code.isOctalDigit(ch)) {
	                            break;
	                        }
	                        number += advance();
	                    }
	
	                    if (index < length) {
	                        ch = source.charCodeAt(index);
	                        if (esutils.code.isIdentifierStartES5(ch) || esutils.code.isDecimalDigit(ch)) {
	                            utility.throwError('unexpected token');
	                        }
	                    }
	                    value = parseInt(number, 8);
	                    return Token.NUMBER;
	                }
	
	                if (esutils.code.isDecimalDigit(ch)) {
	                    utility.throwError('unexpected token');
	                }
	            }
	
	            while (index < length) {
	                ch = source.charCodeAt(index);
	                if (!esutils.code.isDecimalDigit(ch)) {
	                    break;
	                }
	                number += advance();
	            }
	        }
	
	        if (ch === 0x2E  /* '.' */) {
	            number += advance();
	            while (index < length) {
	                ch = source.charCodeAt(index);
	                if (!esutils.code.isDecimalDigit(ch)) {
	                    break;
	                }
	                number += advance();
	            }
	        }
	
	        if (ch === 0x65  /* 'e' */ || ch === 0x45  /* 'E' */) {
	            number += advance();
	
	            ch = source.charCodeAt(index);
	            if (ch === 0x2B  /* '+' */ || ch === 0x2D  /* '-' */) {
	                number += advance();
	            }
	
	            ch = source.charCodeAt(index);
	            if (esutils.code.isDecimalDigit(ch)) {
	                number += advance();
	                while (index < length) {
	                    ch = source.charCodeAt(index);
	                    if (!esutils.code.isDecimalDigit(ch)) {
	                        break;
	                    }
	                    number += advance();
	                }
	            } else {
	                utility.throwError('unexpected token');
	            }
	        }
	
	        if (index < length) {
	            ch = source.charCodeAt(index);
	            if (esutils.code.isIdentifierStartES5(ch)) {
	                utility.throwError('unexpected token');
	            }
	        }
	
	        value = parseFloat(number);
	        return Token.NUMBER;
	    }
	
	
	    function scanTypeName() {
	        var ch, ch2;
	
	        value = advance();
	        while (index < length && isTypeName(source.charCodeAt(index))) {
	            ch = source.charCodeAt(index);
	            if (ch === 0x2E  /* '.' */) {
	                if ((index + 1) >= length) {
	                    return Token.ILLEGAL;
	                }
	                ch2 = source.charCodeAt(index + 1);
	                if (ch2 === 0x3C  /* '<' */) {
	                    break;
	                }
	            }
	            value += advance();
	        }
	        return Token.NAME;
	    }
	
	    function next() {
	        var ch;
	
	        previous = index;
	
	        while (index < length && esutils.code.isWhiteSpace(source.charCodeAt(index))) {
	            advance();
	        }
	        if (index >= length) {
	            token = Token.EOF;
	            return token;
	        }
	
	        ch = source.charCodeAt(index);
	        switch (ch) {
	        case 0x27:  /* ''' */
	        case 0x22:  /* '"' */
	            token = scanString();
	            return token;
	
	        case 0x3A:  /* ':' */
	            advance();
	            token = Token.COLON;
	            return token;
	
	        case 0x2C:  /* ',' */
	            advance();
	            token = Token.COMMA;
	            return token;
	
	        case 0x28:  /* '(' */
	            advance();
	            token = Token.LPAREN;
	            return token;
	
	        case 0x29:  /* ')' */
	            advance();
	            token = Token.RPAREN;
	            return token;
	
	        case 0x5B:  /* '[' */
	            advance();
	            token = Token.LBRACK;
	            return token;
	
	        case 0x5D:  /* ']' */
	            advance();
	            token = Token.RBRACK;
	            return token;
	
	        case 0x7B:  /* '{' */
	            advance();
	            token = Token.LBRACE;
	            return token;
	
	        case 0x7D:  /* '}' */
	            advance();
	            token = Token.RBRACE;
	            return token;
	
	        case 0x2E:  /* '.' */
	            if (index + 1 < length) {
	                ch = source.charCodeAt(index + 1);
	                if (ch === 0x3C  /* '<' */) {
	                    advance();  // '.'
	                    advance();  // '<'
	                    token = Token.DOT_LT;
	                    return token;
	                }
	
	                if (ch === 0x2E  /* '.' */ && index + 2 < length && source.charCodeAt(index + 2) === 0x2E  /* '.' */) {
	                    advance();  // '.'
	                    advance();  // '.'
	                    advance();  // '.'
	                    token = Token.REST;
	                    return token;
	                }
	
	                if (esutils.code.isDecimalDigit(ch)) {
	                    token = scanNumber();
	                    return token;
	                }
	            }
	            token = Token.ILLEGAL;
	            return token;
	
	        case 0x3C:  /* '<' */
	            advance();
	            token = Token.LT;
	            return token;
	
	        case 0x3E:  /* '>' */
	            advance();
	            token = Token.GT;
	            return token;
	
	        case 0x2A:  /* '*' */
	            advance();
	            token = Token.STAR;
	            return token;
	
	        case 0x7C:  /* '|' */
	            advance();
	            token = Token.PIPE;
	            return token;
	
	        case 0x3F:  /* '?' */
	            advance();
	            token = Token.QUESTION;
	            return token;
	
	        case 0x21:  /* '!' */
	            advance();
	            token = Token.BANG;
	            return token;
	
	        case 0x3D:  /* '=' */
	            advance();
	            token = Token.EQUAL;
	            return token;
	
	        case 0x2D: /* '-' */
	            token = scanNumber();
	            return token;
	
	        default:
	            if (esutils.code.isDecimalDigit(ch)) {
	                token = scanNumber();
	                return token;
	            }
	
	            // type string permits following case,
	            //
	            // namespace.module.MyClass
	            //
	            // this reduced 1 token TK_NAME
	            utility.assert(isTypeName(ch));
	            token = scanTypeName();
	            return token;
	        }
	    }
	
	    function consume(target, text) {
	        utility.assert(token === target, text || 'consumed token not matched');
	        next();
	    }
	
	    function expect(target, message) {
	        if (token !== target) {
	            utility.throwError(message || 'unexpected token');
	        }
	        next();
	    }
	
	    // UnionType := '(' TypeUnionList ')'
	    //
	    // TypeUnionList :=
	    //     <<empty>>
	    //   | NonemptyTypeUnionList
	    //
	    // NonemptyTypeUnionList :=
	    //     TypeExpression
	    //   | TypeExpression '|' NonemptyTypeUnionList
	    function parseUnionType() {
	        var elements;
	        consume(Token.LPAREN, 'UnionType should start with (');
	        elements = [];
	        if (token !== Token.RPAREN) {
	            while (true) {
	                elements.push(parseTypeExpression());
	                if (token === Token.RPAREN) {
	                    break;
	                }
	                expect(Token.PIPE);
	            }
	        }
	        consume(Token.RPAREN, 'UnionType should end with )');
	        return {
	            type: Syntax.UnionType,
	            elements: elements
	        };
	    }
	
	    // ArrayType := '[' ElementTypeList ']'
	    //
	    // ElementTypeList :=
	    //     <<empty>>
	    //  | TypeExpression
	    //  | '...' TypeExpression
	    //  | TypeExpression ',' ElementTypeList
	    function parseArrayType() {
	        var elements;
	        consume(Token.LBRACK, 'ArrayType should start with [');
	        elements = [];
	        while (token !== Token.RBRACK) {
	            if (token === Token.REST) {
	                consume(Token.REST);
	                elements.push({
	                    type: Syntax.RestType,
	                    expression: parseTypeExpression()
	                });
	                break;
	            } else {
	                elements.push(parseTypeExpression());
	            }
	            if (token !== Token.RBRACK) {
	                expect(Token.COMMA);
	            }
	        }
	        expect(Token.RBRACK);
	        return {
	            type: Syntax.ArrayType,
	            elements: elements
	        };
	    }
	
	    function parseFieldName() {
	        var v = value;
	        if (token === Token.NAME || token === Token.STRING) {
	            next();
	            return v;
	        }
	
	        if (token === Token.NUMBER) {
	            consume(Token.NUMBER);
	            return String(v);
	        }
	
	        utility.throwError('unexpected token');
	    }
	
	    // FieldType :=
	    //     FieldName
	    //   | FieldName ':' TypeExpression
	    //
	    // FieldName :=
	    //     NameExpression
	    //   | StringLiteral
	    //   | NumberLiteral
	    //   | ReservedIdentifier
	    function parseFieldType() {
	        var key;
	
	        key = parseFieldName();
	        if (token === Token.COLON) {
	            consume(Token.COLON);
	            return {
	                type: Syntax.FieldType,
	                key: key,
	                value: parseTypeExpression()
	            };
	        }
	        return {
	            type: Syntax.FieldType,
	            key: key,
	            value: null
	        };
	    }
	
	    // RecordType := '{' FieldTypeList '}'
	    //
	    // FieldTypeList :=
	    //     <<empty>>
	    //   | FieldType
	    //   | FieldType ',' FieldTypeList
	    function parseRecordType() {
	        var fields;
	
	        consume(Token.LBRACE, 'RecordType should start with {');
	        fields = [];
	        if (token === Token.COMMA) {
	            consume(Token.COMMA);
	        } else {
	            while (token !== Token.RBRACE) {
	                fields.push(parseFieldType());
	                if (token !== Token.RBRACE) {
	                    expect(Token.COMMA);
	                }
	            }
	        }
	        expect(Token.RBRACE);
	        return {
	            type: Syntax.RecordType,
	            fields: fields
	        };
	    }
	
	    // NameExpression :=
	    //    Identifier
	    //  | TagIdentifier ':' Identifier
	    //
	    // Tag identifier is one of "module", "external" or "event"
	    // Identifier is the same as Token.NAME, including any dots, something like
	    // namespace.module.MyClass
	    function parseNameExpression() {
	        var name = value;
	        expect(Token.NAME);
	
	        if (token === Token.COLON && (
	                name === 'module' ||
	                name === 'external' ||
	                name === 'event')) {
	            consume(Token.COLON);
	            name += ':' + value;
	            expect(Token.NAME);
	        }
	
	        return {
	            type: Syntax.NameExpression,
	            name: name
	        };
	    }
	
	    // TypeExpressionList :=
	    //     TopLevelTypeExpression
	    //   | TopLevelTypeExpression ',' TypeExpressionList
	    function parseTypeExpressionList() {
	        var elements = [];
	
	        elements.push(parseTop());
	        while (token === Token.COMMA) {
	            consume(Token.COMMA);
	            elements.push(parseTop());
	        }
	        return elements;
	    }
	
	    // TypeName :=
	    //     NameExpression
	    //   | NameExpression TypeApplication
	    //
	    // TypeApplication :=
	    //     '.<' TypeExpressionList '>'
	    //   | '<' TypeExpressionList '>'   // this is extension of doctrine
	    function parseTypeName() {
	        var expr, applications;
	
	        expr = parseNameExpression();
	        if (token === Token.DOT_LT || token === Token.LT) {
	            next();
	            applications = parseTypeExpressionList();
	            expect(Token.GT);
	            return {
	                type: Syntax.TypeApplication,
	                expression: expr,
	                applications: applications
	            };
	        }
	        return expr;
	    }
	
	    // ResultType :=
	    //     <<empty>>
	    //   | ':' void
	    //   | ':' TypeExpression
	    //
	    // BNF is above
	    // but, we remove <<empty>> pattern, so token is always TypeToken::COLON
	    function parseResultType() {
	        consume(Token.COLON, 'ResultType should start with :');
	        if (token === Token.NAME && value === 'void') {
	            consume(Token.NAME);
	            return {
	                type: Syntax.VoidLiteral
	            };
	        }
	        return parseTypeExpression();
	    }
	
	    // ParametersType :=
	    //     RestParameterType
	    //   | NonRestParametersType
	    //   | NonRestParametersType ',' RestParameterType
	    //
	    // RestParameterType :=
	    //     '...'
	    //     '...' Identifier
	    //
	    // NonRestParametersType :=
	    //     ParameterType ',' NonRestParametersType
	    //   | ParameterType
	    //   | OptionalParametersType
	    //
	    // OptionalParametersType :=
	    //     OptionalParameterType
	    //   | OptionalParameterType, OptionalParametersType
	    //
	    // OptionalParameterType := ParameterType=
	    //
	    // ParameterType := TypeExpression | Identifier ':' TypeExpression
	    //
	    // Identifier is "new" or "this"
	    function parseParametersType() {
	        var params = [], optionalSequence = false, expr, rest = false;
	
	        while (token !== Token.RPAREN) {
	            if (token === Token.REST) {
	                // RestParameterType
	                consume(Token.REST);
	                rest = true;
	            }
	
	            expr = parseTypeExpression();
	            if (expr.type === Syntax.NameExpression && token === Token.COLON) {
	                // Identifier ':' TypeExpression
	                consume(Token.COLON);
	                expr = {
	                    type: Syntax.ParameterType,
	                    name: expr.name,
	                    expression: parseTypeExpression()
	                };
	            }
	            if (token === Token.EQUAL) {
	                consume(Token.EQUAL);
	                expr = {
	                    type: Syntax.OptionalType,
	                    expression: expr
	                };
	                optionalSequence = true;
	            } else {
	                if (optionalSequence) {
	                    utility.throwError('unexpected token');
	                }
	            }
	            if (rest) {
	                expr = {
	                    type: Syntax.RestType,
	                    expression: expr
	                };
	            }
	            params.push(expr);
	            if (token !== Token.RPAREN) {
	                expect(Token.COMMA);
	            }
	        }
	        return params;
	    }
	
	    // FunctionType := 'function' FunctionSignatureType
	    //
	    // FunctionSignatureType :=
	    //   | TypeParameters '(' ')' ResultType
	    //   | TypeParameters '(' ParametersType ')' ResultType
	    //   | TypeParameters '(' 'this' ':' TypeName ')' ResultType
	    //   | TypeParameters '(' 'this' ':' TypeName ',' ParametersType ')' ResultType
	    function parseFunctionType() {
	        var isNew, thisBinding, params, result, fnType;
	        utility.assert(token === Token.NAME && value === 'function', 'FunctionType should start with \'function\'');
	        consume(Token.NAME);
	
	        // Google Closure Compiler is not implementing TypeParameters.
	        // So we do not. if we don't get '(', we see it as error.
	        expect(Token.LPAREN);
	
	        isNew = false;
	        params = [];
	        thisBinding = null;
	        if (token !== Token.RPAREN) {
	            // ParametersType or 'this'
	            if (token === Token.NAME &&
	                    (value === 'this' || value === 'new')) {
	                // 'this' or 'new'
	                // 'new' is Closure Compiler extension
	                isNew = value === 'new';
	                consume(Token.NAME);
	                expect(Token.COLON);
	                thisBinding = parseTypeName();
	                if (token === Token.COMMA) {
	                    consume(Token.COMMA);
	                    params = parseParametersType();
	                }
	            } else {
	                params = parseParametersType();
	            }
	        }
	
	        expect(Token.RPAREN);
	
	        result = null;
	        if (token === Token.COLON) {
	            result = parseResultType();
	        }
	
	        fnType = {
	            type: Syntax.FunctionType,
	            params: params,
	            result: result
	        };
	        if (thisBinding) {
	            // avoid adding null 'new' and 'this' properties
	            fnType['this'] = thisBinding;
	            if (isNew) {
	                fnType['new'] = true;
	            }
	        }
	        return fnType;
	    }
	
	    // BasicTypeExpression :=
	    //     '*'
	    //   | 'null'
	    //   | 'undefined'
	    //   | TypeName
	    //   | FunctionType
	    //   | UnionType
	    //   | RecordType
	    //   | ArrayType
	    function parseBasicTypeExpression() {
	        var context;
	        switch (token) {
	        case Token.STAR:
	            consume(Token.STAR);
	            return {
	                type: Syntax.AllLiteral
	            };
	
	        case Token.LPAREN:
	            return parseUnionType();
	
	        case Token.LBRACK:
	            return parseArrayType();
	
	        case Token.LBRACE:
	            return parseRecordType();
	
	        case Token.NAME:
	            if (value === 'null') {
	                consume(Token.NAME);
	                return {
	                    type: Syntax.NullLiteral
	                };
	            }
	
	            if (value === 'undefined') {
	                consume(Token.NAME);
	                return {
	                    type: Syntax.UndefinedLiteral
	                };
	            }
	
	            if (value === 'true' || value === 'false') {
	                consume(Token.NAME);
	                return {
	                    type: Syntax.BooleanLiteralType,
	                    value: value === 'true'
	                };
	            }
	
	            context = Context.save();
	            if (value === 'function') {
	                try {
	                    return parseFunctionType();
	                } catch (e) {
	                    context.restore();
	                }
	            }
	
	            return parseTypeName();
	
	        case Token.STRING:
	            next();
	            return {
	                type: Syntax.StringLiteralType,
	                value: value
	            };
	
	        case Token.NUMBER:
	            next();
	            return {
	                type: Syntax.NumericLiteralType,
	                value: value
	            };
	
	        default:
	            utility.throwError('unexpected token');
	        }
	    }
	
	    // TypeExpression :=
	    //     BasicTypeExpression
	    //   | '?' BasicTypeExpression
	    //   | '!' BasicTypeExpression
	    //   | BasicTypeExpression '?'
	    //   | BasicTypeExpression '!'
	    //   | '?'
	    //   | BasicTypeExpression '[]'
	    function parseTypeExpression() {
	        var expr;
	
	        if (token === Token.QUESTION) {
	            consume(Token.QUESTION);
	            if (token === Token.COMMA || token === Token.EQUAL || token === Token.RBRACE ||
	                    token === Token.RPAREN || token === Token.PIPE || token === Token.EOF ||
	                    token === Token.RBRACK || token === Token.GT) {
	                return {
	                    type: Syntax.NullableLiteral
	                };
	            }
	            return {
	                type: Syntax.NullableType,
	                expression: parseBasicTypeExpression(),
	                prefix: true
	            };
	        }
	
	        if (token === Token.BANG) {
	            consume(Token.BANG);
	            return {
	                type: Syntax.NonNullableType,
	                expression: parseBasicTypeExpression(),
	                prefix: true
	            };
	        }
	
	        expr = parseBasicTypeExpression();
	        if (token === Token.BANG) {
	            consume(Token.BANG);
	            return {
	                type: Syntax.NonNullableType,
	                expression: expr,
	                prefix: false
	            };
	        }
	
	        if (token === Token.QUESTION) {
	            consume(Token.QUESTION);
	            return {
	                type: Syntax.NullableType,
	                expression: expr,
	                prefix: false
	            };
	        }
	
	        if (token === Token.LBRACK) {
	            consume(Token.LBRACK);
	            expect(Token.RBRACK, 'expected an array-style type declaration (' + value + '[])');
	            return {
	                type: Syntax.TypeApplication,
	                expression: {
	                    type: Syntax.NameExpression,
	                    name: 'Array'
	                },
	                applications: [expr]
	            };
	        }
	
	        return expr;
	    }
	
	    // TopLevelTypeExpression :=
	    //      TypeExpression
	    //    | TypeUnionList
	    //
	    // This rule is Google Closure Compiler extension, not ES4
	    // like,
	    //   { number | string }
	    // If strict to ES4, we should write it as
	    //   { (number|string) }
	    function parseTop() {
	        var expr, elements;
	
	        expr = parseTypeExpression();
	        if (token !== Token.PIPE) {
	            return expr;
	        }
	
	        elements = [expr];
	        consume(Token.PIPE);
	        while (true) {
	            elements.push(parseTypeExpression());
	            if (token !== Token.PIPE) {
	                break;
	            }
	            consume(Token.PIPE);
	        }
	
	        return {
	            type: Syntax.UnionType,
	            elements: elements
	        };
	    }
	
	    function parseTopParamType() {
	        var expr;
	
	        if (token === Token.REST) {
	            consume(Token.REST);
	            return {
	                type: Syntax.RestType,
	                expression: parseTop()
	            };
	        }
	
	        expr = parseTop();
	        if (token === Token.EQUAL) {
	            consume(Token.EQUAL);
	            return {
	                type: Syntax.OptionalType,
	                expression: expr
	            };
	        }
	
	        return expr;
	    }
	
	    function parseType(src, opt) {
	        var expr;
	
	        source = src;
	        length = source.length;
	        index = 0;
	        previous = 0;
	
	        next();
	        expr = parseTop();
	
	        if (opt && opt.midstream) {
	            return {
	                expression: expr,
	                index: previous
	            };
	        }
	
	        if (token !== Token.EOF) {
	            utility.throwError('not reach to EOF');
	        }
	
	        return expr;
	    }
	
	    function parseParamType(src, opt) {
	        var expr;
	
	        source = src;
	        length = source.length;
	        index = 0;
	        previous = 0;
	
	        next();
	        expr = parseTopParamType();
	
	        if (opt && opt.midstream) {
	            return {
	                expression: expr,
	                index: previous
	            };
	        }
	
	        if (token !== Token.EOF) {
	            utility.throwError('not reach to EOF');
	        }
	
	        return expr;
	    }
	
	    function stringifyImpl(node, compact, topLevel) {
	        var result, i, iz;
	
	        switch (node.type) {
	        case Syntax.NullableLiteral:
	            result = '?';
	            break;
	
	        case Syntax.AllLiteral:
	            result = '*';
	            break;
	
	        case Syntax.NullLiteral:
	            result = 'null';
	            break;
	
	        case Syntax.UndefinedLiteral:
	            result = 'undefined';
	            break;
	
	        case Syntax.VoidLiteral:
	            result = 'void';
	            break;
	
	        case Syntax.UnionType:
	            if (!topLevel) {
	                result = '(';
	            } else {
	                result = '';
	            }
	
	            for (i = 0, iz = node.elements.length; i < iz; ++i) {
	                result += stringifyImpl(node.elements[i], compact);
	                if ((i + 1) !== iz) {
	                    result += '|';
	                }
	            }
	
	            if (!topLevel) {
	                result += ')';
	            }
	            break;
	
	        case Syntax.ArrayType:
	            result = '[';
	            for (i = 0, iz = node.elements.length; i < iz; ++i) {
	                result += stringifyImpl(node.elements[i], compact);
	                if ((i + 1) !== iz) {
	                    result += compact ? ',' : ', ';
	                }
	            }
	            result += ']';
	            break;
	
	        case Syntax.RecordType:
	            result = '{';
	            for (i = 0, iz = node.fields.length; i < iz; ++i) {
	                result += stringifyImpl(node.fields[i], compact);
	                if ((i + 1) !== iz) {
	                    result += compact ? ',' : ', ';
	                }
	            }
	            result += '}';
	            break;
	
	        case Syntax.FieldType:
	            if (node.value) {
	                result = node.key + (compact ? ':' : ': ') + stringifyImpl(node.value, compact);
	            } else {
	                result = node.key;
	            }
	            break;
	
	        case Syntax.FunctionType:
	            result = compact ? 'function(' : 'function (';
	
	            if (node['this']) {
	                if (node['new']) {
	                    result += (compact ? 'new:' : 'new: ');
	                } else {
	                    result += (compact ? 'this:' : 'this: ');
	                }
	
	                result += stringifyImpl(node['this'], compact);
	
	                if (node.params.length !== 0) {
	                    result += compact ? ',' : ', ';
	                }
	            }
	
	            for (i = 0, iz = node.params.length; i < iz; ++i) {
	                result += stringifyImpl(node.params[i], compact);
	                if ((i + 1) !== iz) {
	                    result += compact ? ',' : ', ';
	                }
	            }
	
	            result += ')';
	
	            if (node.result) {
	                result += (compact ? ':' : ': ') + stringifyImpl(node.result, compact);
	            }
	            break;
	
	        case Syntax.ParameterType:
	            result = node.name + (compact ? ':' : ': ') + stringifyImpl(node.expression, compact);
	            break;
	
	        case Syntax.RestType:
	            result = '...';
	            if (node.expression) {
	                result += stringifyImpl(node.expression, compact);
	            }
	            break;
	
	        case Syntax.NonNullableType:
	            if (node.prefix) {
	                result = '!' + stringifyImpl(node.expression, compact);
	            } else {
	                result = stringifyImpl(node.expression, compact) + '!';
	            }
	            break;
	
	        case Syntax.OptionalType:
	            result = stringifyImpl(node.expression, compact) + '=';
	            break;
	
	        case Syntax.NullableType:
	            if (node.prefix) {
	                result = '?' + stringifyImpl(node.expression, compact);
	            } else {
	                result = stringifyImpl(node.expression, compact) + '?';
	            }
	            break;
	
	        case Syntax.NameExpression:
	            result = node.name;
	            break;
	
	        case Syntax.TypeApplication:
	            result = stringifyImpl(node.expression, compact) + '.<';
	            for (i = 0, iz = node.applications.length; i < iz; ++i) {
	                result += stringifyImpl(node.applications[i], compact);
	                if ((i + 1) !== iz) {
	                    result += compact ? ',' : ', ';
	                }
	            }
	            result += '>';
	            break;
	
	        case Syntax.StringLiteralType:
	            result = '"' + node.value + '"';
	            break;
	
	        case Syntax.NumericLiteralType:
	            result = String(node.value);
	            break;
	
	        case Syntax.BooleanLiteralType:
	            result = String(node.value);
	            break;
	
	        default:
	            utility.throwError('Unknown type ' + node.type);
	        }
	
	        return result;
	    }
	
	    function stringify(node, options) {
	        if (options == null) {
	            options = {};
	        }
	        return stringifyImpl(node, options.compact, options.topLevel);
	    }
	
	    exports.parseType = parseType;
	    exports.parseParamType = parseParamType;
	    exports.stringify = stringify;
	    exports.Syntax = Syntax;
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * @fileoverview Utilities for Doctrine
	 * @author Yusuke Suzuki <utatane.tea@gmail.com>
	 */
	
	
	(function () {
	    'use strict';
	
	    var VERSION;
	
	    VERSION = __webpack_require__(13).version;
	    exports.VERSION = VERSION;
	
	    function DoctrineError(message) {
	        this.name = 'DoctrineError';
	        this.message = message;
	    }
	    DoctrineError.prototype = (function () {
	        var Middle = function () { };
	        Middle.prototype = Error.prototype;
	        return new Middle();
	    }());
	    DoctrineError.prototype.constructor = DoctrineError;
	    exports.DoctrineError = DoctrineError;
	
	    function throwError(message) {
	        throw new DoctrineError(message);
	    }
	    exports.throwError = throwError;
	
	    exports.assert = __webpack_require__(14);
	}());
	
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = {
		"name": "doctrine",
		"description": "JSDoc parser",
		"homepage": "https://github.com/eslint/doctrine",
		"main": "lib/doctrine.js",
		"version": "2.0.0",
		"engines": {
			"node": ">=0.10.0"
		},
		"directories": {
			"lib": "./lib"
		},
		"files": [
			"lib",
			"LICENSE.BSD",
			"LICENSE.closure-compiler",
			"LICENSE.esprima",
			"README.md"
		],
		"maintainers": [
			{
				"name": "Nicholas C. Zakas",
				"email": "nicholas+npm@nczconsulting.com",
				"web": "https://www.nczonline.net"
			},
			{
				"name": "Yusuke Suzuki",
				"email": "utatane.tea@gmail.com",
				"web": "https://github.com/Constellation"
			}
		],
		"repository": "eslint/doctrine",
		"devDependencies": {
			"coveralls": "^2.11.2",
			"dateformat": "^1.0.11",
			"eslint": "^1.10.3",
			"eslint-release": "^0.10.0",
			"istanbul": "^0.4.1",
			"linefix": "^0.1.1",
			"mocha": "^2.3.3",
			"npm-license": "^0.3.1",
			"semver": "^5.0.3",
			"shelljs": "^0.5.3",
			"shelljs-nodecli": "^0.1.1",
			"should": "^5.0.1"
		},
		"license": "Apache-2.0",
		"scripts": {
			"test": "npm run lint && node Makefile.js test",
			"lint": "eslint lib/",
			"release": "eslint-release",
			"ci-release": "eslint-ci-release",
			"alpharelease": "eslint-prerelease alpha",
			"betarelease": "eslint-prerelease beta"
		},
		"dependencies": {
			"esutils": "^2.0.2",
			"isarray": "^1.0.0"
		}
	};

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
	// original notice:
	
	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	function compare(a, b) {
	  if (a === b) {
	    return 0;
	  }
	
	  var x = a.length;
	  var y = b.length;
	
	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break;
	    }
	  }
	
	  if (x < y) {
	    return -1;
	  }
	  if (y < x) {
	    return 1;
	  }
	  return 0;
	}
	function isBuffer(b) {
	  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
	    return global.Buffer.isBuffer(b);
	  }
	  return !!(b != null && b._isBuffer);
	}
	
	// based on node assert, original notice:
	
	// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
	//
	// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
	//
	// Originally from narwhal.js (http://narwhaljs.org)
	// Copyright (c) 2009 Thomas Robinson <280north.com>
	//
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the 'Software'), to
	// deal in the Software without restriction, including without limitation the
	// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	// sell copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	//
	// The above copyright notice and this permission notice shall be included in
	// all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
	// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var util = __webpack_require__(15);
	var hasOwn = Object.prototype.hasOwnProperty;
	var pSlice = Array.prototype.slice;
	var functionsHaveNames = (function () {
	  return function foo() {}.name === 'foo';
	}());
	function pToString (obj) {
	  return Object.prototype.toString.call(obj);
	}
	function isView(arrbuf) {
	  if (isBuffer(arrbuf)) {
	    return false;
	  }
	  if (typeof global.ArrayBuffer !== 'function') {
	    return false;
	  }
	  if (typeof ArrayBuffer.isView === 'function') {
	    return ArrayBuffer.isView(arrbuf);
	  }
	  if (!arrbuf) {
	    return false;
	  }
	  if (arrbuf instanceof DataView) {
	    return true;
	  }
	  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
	    return true;
	  }
	  return false;
	}
	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.
	
	var assert = module.exports = ok;
	
	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })
	
	var regex = /\s*function\s+([^\(\s]*)\s*/;
	// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
	function getName(func) {
	  if (!util.isFunction(func)) {
	    return;
	  }
	  if (functionsHaveNames) {
	    return func.name;
	  }
	  var str = func.toString();
	  var match = str.match(regex);
	  return match && match[1];
	}
	assert.AssertionError = function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  } else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;
	
	      // try to strip useless frames
	      var fn_name = getName(stackStartFunction);
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }
	
	      this.stack = out;
	    }
	  }
	};
	
	// assert.AssertionError instanceof Error
	util.inherits(assert.AssertionError, Error);
	
	function truncate(s, n) {
	  if (typeof s === 'string') {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}
	function inspect(something) {
	  if (functionsHaveNames || !util.isFunction(something)) {
	    return util.inspect(something);
	  }
	  var rawname = getName(something);
	  var name = rawname ? ': ' + rawname : '';
	  return '[Function' +  name + ']';
	}
	function getMessage(self) {
	  return truncate(inspect(self.actual), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(inspect(self.expected), 128);
	}
	
	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.
	
	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.
	
	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new assert.AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}
	
	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;
	
	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.
	
	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', assert.ok);
	}
	assert.ok = ok;
	
	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);
	
	assert.equal = function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
	};
	
	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);
	
	assert.notEqual = function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', assert.notEqual);
	  }
	};
	
	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);
	
	assert.deepEqual = function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
	  }
	};
	
	assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
	  }
	};
	
	function _deepEqual(actual, expected, strict, memos) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;
	  } else if (isBuffer(actual) && isBuffer(expected)) {
	    return compare(actual, expected) === 0;
	
	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (util.isDate(actual) && util.isDate(expected)) {
	    return actual.getTime() === expected.getTime();
	
	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;
	
	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if ((actual === null || typeof actual !== 'object') &&
	             (expected === null || typeof expected !== 'object')) {
	    return strict ? actual === expected : actual == expected;
	
	  // If both values are instances of typed arrays, wrap their underlying
	  // ArrayBuffers in a Buffer each to increase performance
	  // This optimization requires the arrays to have the same type as checked by
	  // Object.prototype.toString (aka pToString). Never perform binary
	  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
	  // bit patterns are not identical.
	  } else if (isView(actual) && isView(expected) &&
	             pToString(actual) === pToString(expected) &&
	             !(actual instanceof Float32Array ||
	               actual instanceof Float64Array)) {
	    return compare(new Uint8Array(actual.buffer),
	                   new Uint8Array(expected.buffer)) === 0;
	
	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else if (isBuffer(actual) !== isBuffer(expected)) {
	    return false;
	  } else {
	    memos = memos || {actual: [], expected: []};
	
	    var actualIndex = memos.actual.indexOf(actual);
	    if (actualIndex !== -1) {
	      if (actualIndex === memos.expected.indexOf(expected)) {
	        return true;
	      }
	    }
	
	    memos.actual.push(actual);
	    memos.expected.push(expected);
	
	    return objEquiv(actual, expected, strict, memos);
	  }
	}
	
	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}
	
	function objEquiv(a, b, strict, actualVisitedObjects) {
	  if (a === null || a === undefined || b === null || b === undefined)
	    return false;
	  // if one is a primitive, the other must be same
	  if (util.isPrimitive(a) || util.isPrimitive(b))
	    return a === b;
	  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
	    return false;
	  var aIsArgs = isArguments(a);
	  var bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b, strict);
	  }
	  var ka = objectKeys(a);
	  var kb = objectKeys(b);
	  var key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length !== kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] !== kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
	      return false;
	  }
	  return true;
	}
	
	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);
	
	assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
	  }
	};
	
	assert.notDeepStrictEqual = notDeepStrictEqual;
	function notDeepStrictEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
	  }
	}
	
	
	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);
	
	assert.strictEqual = function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', assert.strictEqual);
	  }
	};
	
	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
	
	assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', assert.notStrictEqual);
	  }
	};
	
	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }
	
	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  }
	
	  try {
	    if (actual instanceof expected) {
	      return true;
	    }
	  } catch (e) {
	    // Ignore.  The instanceof check doesn't work for arrow functions.
	  }
	
	  if (Error.isPrototypeOf(expected)) {
	    return false;
	  }
	
	  return expected.call({}, actual) === true;
	}
	
	function _tryBlock(block) {
	  var error;
	  try {
	    block();
	  } catch (e) {
	    error = e;
	  }
	  return error;
	}
	
	function _throws(shouldThrow, block, expected, message) {
	  var actual;
	
	  if (typeof block !== 'function') {
	    throw new TypeError('"block" argument must be a function');
	  }
	
	  if (typeof expected === 'string') {
	    message = expected;
	    expected = null;
	  }
	
	  actual = _tryBlock(block);
	
	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');
	
	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }
	
	  var userProvidedMessage = typeof message === 'string';
	  var isUnwantedException = !shouldThrow && util.isError(actual);
	  var isUnexpectedException = !shouldThrow && actual && !expected;
	
	  if ((isUnwantedException &&
	      userProvidedMessage &&
	      expectedException(actual, expected)) ||
	      isUnexpectedException) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }
	
	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}
	
	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);
	
	assert.throws = function(block, /*optional*/error, /*optional*/message) {
	  _throws(true, block, error, message);
	};
	
	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
	  _throws(false, block, error, message);
	};
	
	assert.ifError = function(err) { if (err) throw err; };
	
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }
	
	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};
	
	
	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }
	
	  if (process.noDeprecation === true) {
	    return fn;
	  }
	
	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }
	
	  return deprecated;
	};
	
	
	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};
	
	
	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;
	
	
	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};
	
	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};
	
	
	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];
	
	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}
	
	
	function stylizeNoColor(str, styleType) {
	  return str;
	}
	
	
	function arrayToHash(array) {
	  var hash = {};
	
	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });
	
	  return hash;
	}
	
	
	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }
	
	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }
	
	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);
	
	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }
	
	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }
	
	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }
	
	  var base = '', array = false, braces = ['{', '}'];
	
	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }
	
	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }
	
	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }
	
	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }
	
	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }
	
	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }
	
	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }
	
	  ctx.seen.push(value);
	
	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }
	
	  ctx.seen.pop();
	
	  return reduceToSingleString(output, base, braces);
	}
	
	
	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}
	
	
	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}
	
	
	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}
	
	
	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }
	
	  return name + ': ' + str;
	}
	
	
	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);
	
	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }
	
	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}
	
	
	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;
	
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;
	
	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;
	
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;
	
	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;
	
	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;
	
	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	
	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;
	
	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;
	
	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;
	
	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;
	
	exports.isBuffer = __webpack_require__(17);
	
	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	
	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}
	
	
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];
	
	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}
	
	
	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};
	
	
	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(18);
	
	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;
	
	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};
	
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(16)))

/***/ },
/* 16 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 17 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 18 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 19 */
/***/ function(module, exports) {

	/**
	 * @fileoverview Custom ESLint configuration to adhere to the Google style guide
	 * at https://google.github.io/styleguide/javascriptguide.xml.
	 *
	 * All ESLint rules are listed below.  ESLint recommended rules have an #eslint
	 * tag.  Google JS style guide required rules have a #google tag.  Internal
	 * Google guidelines have a #google3 tag.
	 *
	 * Short link to the Google JS Style Guide: https://git.io/vured
	 * Short link to the Google C++ Style Guide: https://git.io/v6Mp3
	 */
	
	
	// Named constants for the numbers eslint uses to indicate lint severity.
	const OFF = 0;
	const WARNING = 1;
	const ERROR = 2;
	
	
	// Private Google JSDoc tags.  #google3
	const GOOGLE_CUSTOM_JSDOC_TAGS = [
	  'abstract',
	  'copyright',
	  'disposes',
	  'externs',
	  // Mark function as returning an ID.  The type can be {consistent}, {unique},
	  // {stable}, {xid} or empty.
	  'idGenerator',
	  'jaggerInject',
	  'jaggerModule',
	  'jaggerProvide',
	  'jaggerProvidePromise',
	  'meaning',  // Localization helper.
	  'modifies',  // For externs.
	  'ngInject',
	  'nocollapse',
	  'nocompile',
	  'nosideeffects',
	  'package',  // Indicates package-private.,
	  'polymerBehavior',
	  'record',
	  'struct',
	  'template',  // Generics.
	  'unrestricted',  // Mark class that's not a @struct or @dict.,
	  'visibility',  // Control blaze build visibility.
	  'wizaction',
	];
	
	
	// Pubically released closure JSDoc tags from
	// https://developers.google.com/closure/compiler/docs/js-for-compiler.  #google
	const CLOSURE_JSDOC_TAGS = [
	  'abstract',
	  'const',
	  'constructor',
	  'define',
	  'deprecated',
	  'dict',
	  'enum',
	  'export',
	  'extends',
	  'final',
	  'implements',
	  'implicitCast',
	  'inheritDoc',
	  'interface',
	  'lends',
	  'license',
	  'preserve',
	  'nocollapse',
	  'nosideeffects',
	  'override',
	  'package',
	  'param',
	  'private',
	  'protected',
	  'record',
	  'return',
	  'struct',
	  'template',
	  'this',
	  'throws',
	  'type',
	  'typedef',
	  'unrestricted',
	];
	
	
	// Possible Errors
	// These rules relate to possible syntax or logic errors in JavaScript code.
	const POSSIBLE_ERROR_RULES = {
	  // Disallow assignment operators in conditional expressions.  #eslint
	  'no-cond-assign': ERROR,
	
	  // Disallow the use of console.  #eslint
	  'no-console': ERROR,
	
	  // Disallow constant expressions in conditions.  #eslint
	  'no-constant-condition': ERROR,
	
	  // Disallow control characters in regular expressions.  #eslint
	  'no-control-regex': ERROR,
	
	  // Disallow the use of debugger.  #eslint
	  'no-debugger': ERROR,
	
	  // Disallow duplicate arguments in function definitions.  #eslint
	  'no-dupe-args': ERROR,
	
	  // Disallow duplicate keys in object literals.  #eslint
	  'no-dupe-keys': ERROR,
	
	  // Disallow duplicate case labels.  #eslint
	  'no-duplicate-case': ERROR,
	
	  // Disallow empty character classes in regular expressions.  #eslint
	  'no-empty-character-class': ERROR,
	
	  // Disallow empty block statements.  #eslint
	  // Google ES6 Section 5.8.2.1
	  'no-empty': ERROR,
	
	  // Disallow reassigning exceptions in catch clauses.  #eslint
	  'no-ex-assign': ERROR,
	
	  // Disallow unnecessary boolean casts.  #eslint
	  // No explicit recommendation in either style guide.
	  'no-extra-boolean-cast': OFF,
	
	  // Disallow unnecessary parentheses.
	  'no-extra-parens': OFF,
	
	  // Disallow unnecessary semicolons.  #eslint
	  'no-extra-semi': ERROR,
	
	  // Disallow reassigning function declarations.  #eslint
	  'no-func-assign': ERROR,
	
	  // Disallow function or var declarations in nested blocks.  #eslint
	  // Google ES5 https://git.io/vured#Nested_functions.
	  'no-inner-declarations': ERROR,
	
	  // Disallow invalid regular expression strings in RegExp constructors.
	  // #eslint
	  'no-invalid-regexp': ERROR,
	
	  // Disallow irregular whitespace outside of strings and comments.  #eslint
	  'no-irregular-whitespace': ERROR,
	
	  // Disallow calling global object properties as functions.  #eslint
	  'no-obj-calls': ERROR,
	
	  // Disallow calling some Object.prototype methods directly on objects.
	  'no-prototype-builtins': OFF,
	
	  // Disallow multiple spaces in regular expressions.  #eslint
	  'no-regex-spaces': ERROR,
	
	  // Disallow sparse arrays.  #eslint
	  'no-sparse-arrays': ERROR,
	
	  // Disallow template literal placeholder syntax in regular strings.
	  'no-template-curly-in-string': OFF,
	
	  // Disallow confusing multiline expressions.  #eslint
	  'no-unexpected-multiline': ERROR,
	
	  // Disallow unreachable code after return, throw, continue, and break
	  // statements.  #eslint
	  'no-unreachable': ERROR,
	
	  // Disallow control flow statements in finally blocks.  #eslint
	  'no-unsafe-finally': ERROR,
	
	  // Disallow negating the left operand of relational operators.
	  'no-unsafe-negation': ERROR,
	
	  // Require calls to isNaN() when checking for NaN.  #eslint
	  'use-isnan': ERROR,
	
	  // Enforce valid JSDoc comments.  Use the jsdoc plugin instead.
	  'valid-jsdoc': OFF,
	
	  // Enforce comparing typeof expressions against valid strings.  #eslint
	  'valid-typeof': ERROR,
	};
	
	
	// Best Practices
	// These rules relate to better ways of doing things to help you avoid problems.
	const BEST_PRACTICE_RULES = {
	  // Enforce getter and setter pairs in objects.
	  'accessor-pairs': OFF,
	
	  // Enforce return statements in callbacks of array methods.
	  'array-callback-return': OFF,
	
	  // Enforce the use of variables within the scope they are defined.
	  'block-scoped-var': OFF,
	
	  // Enforce a maximum cyclomatic complexity allowed in a program.
	  'complexity': OFF,
	
	  // Require return statements to either always or never specify values.
	  'consistent-return': ERROR,
	
	  // Enforce consistent brace style for all control statements.
	
	  // TODO(jschaf): This doesn't quite match Google style guide because it allows
	  // a single statement on the line after a block statement:
	  //
	  // if (foo)
	  //   bar();  // Bad, google style only allows it on the same line like:
	  //
	  // if (foo) bar(); // Good.
	  'curly': [ERROR, 'multi-line'],
	
	  // Require default cases in switch statements.
	  // Google ES6 Section 5.8.3.2
	  'default-case': ERROR,
	
	  // Enforce consistent newlines before and after dots.
	  // Google ES5 https://git.io/vured#Code_formatting
	  // Google ES6 Section 4.5.1
	  'dot-location': [ERROR, 'property'],
	
	  // Enforce dot notation whenever possible.
	  'dot-notation': OFF,
	
	  // Require the use of === and !==.
	  // The style guide says nothing about the great == vs === debate.
	  'eqeqeq': OFF,
	
	  // Require for-in loops to include an if statement.
	  // Google ES6 Section 5.8.1
	  'guard-for-in': ERROR,
	
	  // Disallow the use of alert, confirm, and prompt.
	  'no-alert': OFF,
	
	  // Disallow the use of arguments.caller or arguments.callee.
	  'no-caller': OFF,
	
	  // Disallow lexical declarations in case clauses.  #eslint
	  'no-case-declarations': ERROR,
	
	  // Disallow division operators explicitly at the beginning of regular
	  // expressions.
	  'no-div-regex': OFF,
	
	  // Disallow else blocks after return statements in if statements.
	  'no-else-return': OFF,
	
	  // Disallow empty functions.
	  'no-empty-function': OFF,
	
	  // Disallow empty destructuring patterns.  #eslint
	  'no-empty-pattern': ERROR,
	
	  // Disallow null comparisons without type-checking operators.
	  'no-eq-null': OFF,
	
	  // Disallow the use of eval().
	  // Google ES6 Section 5.10.2
	  'no-eval': ERROR,
	
	  // Disallow extending native types.
	  // Google ES5  https://git.io/vured#Modifying_prototypes_of_builtin_objects
	  // Google ES6 Section 5.10.6
	  'no-extend-native': ERROR,
	
	  // Disallow unnecessary calls to .bind().
	  // Google ES6 Section 5.5.3.  Loosely hinted at, but not specifically
	  // required.
	  'no-extra-bind': WARNING,
	
	  // Disallow unnecessary labels.
	  'no-extra-label': OFF,
	
	  // Disallow fallthrough of case statements.  #eslint
	  // Google ES6 Section 5.8.3.1
	  'no-fallthrough': [ERROR, {
	    commentPattern: '[fF]alls?\\s?[tT]hrough',
	  }],
	
	  // Disallow leading or trailing decimal points in numeric literals.
	  'no-floating-decimal': OFF,
	
	  // Disallow assignments to native objects or read-only global variables.
	  'no-global-assign': OFF,
	
	  // Disallow shorthand type conversions.
	  'no-implicit-coercion': OFF,
	
	  // Disallow var and named function declarations in the global scope.
	  'no-implicit-globals': OFF,
	
	  // Disallow the use of eval()-like methods.
	  'no-implied-eval': OFF,
	
	  // Disallow this keywords outside of classes or class-like objects.
	  'no-invalid-this': OFF,
	
	  // Disallow the use of the __iterator__ property.
	  'no-iterator': OFF,
	
	  // Disallow labeled statements.
	  'no-labels': OFF,
	
	  // Disallow unnecessary nested blocks.
	  'no-lone-blocks': OFF,
	
	  // Disallow function declarations and expressions inside loop statements.
	  'no-loop-func': OFF,
	
	  // Disallow magic numbers.
	  'no-magic-numbers': OFF,
	
	  // Disallow multiple spaces.
	  // Google ES6 Section 4.6.2
	  'no-multi-spaces': ERROR,
	
	  // Disallow multiline strings.
	  // Google ES5 https://git.io/vured#Multiline_string_literals.
	  'no-multi-str': ERROR,
	
	  // Disallow new operators with the Function object.
	  // Google ES6 Section 5.10.2
	  'no-new-func': ERROR,
	
	  // Disallow new operators with the String, Number, and Boolean objects.
	  // Google ES5 https://git.io/vured#Wrapper_objects_for_primitive_types.
	  // Google ES6 Section 5.10.5
	  'no-new-wrappers': ERROR,
	
	  // Disallow new operators outside of assignments or comparisons.
	  'no-new': OFF,
	
	  // Disallow octal escape sequences in string literals.
	  'no-octal-escape': OFF,
	
	  // Disallow octal literals.  #eslint
	  // Google ES6 Section 5.7
	  'no-octal': ERROR,
	
	  // Disallow reassigning function parameters.
	  'no-param-reassign': OFF,
	
	  // Disallow the use of the __proto__ property.
	  'no-proto': OFF,
	
	  // Disallow var redeclaration.  #eslint
	  'no-redeclare': ERROR,
	
	  // Disallow assignment operators in return statements.
	  'no-return-assign': OFF,
	
	  // Disallow javascript: urls.
	  'no-script-url': OFF,
	
	  // Disallow assignments where both sides are exactly the same.  #eslint
	  'no-self-assign': ERROR,
	
	  // Disallow comparisons where both sides are exactly the same.
	  'no-self-compare': OFF,
	
	  // Disallow comma operators.
	  'no-sequences': OFF,
	
	  // Disallow throwing literals as exceptions.
	  'no-throw-literal': OFF,
	
	  // Disallow unmodified loop conditions.
	  'no-unmodified-loop-condition': OFF,
	
	  // Disallow unused expressions.
	  'no-unused-expressions': OFF,
	
	  // Disallow unused labels.  #eslint
	  'no-unused-labels': ERROR,
	
	  // Disallow unnecessary calls to .call() and .apply().
	  'no-useless-call': OFF,
	
	  // Disallow unnecessary concatenation of literals or template literals.
	  'no-useless-concat': OFF,
	
	  // Disallow unnecessary escape characters.
	  'no-useless-escape': OFF,
	
	  // Disallow void operators.
	  'no-void': OFF,
	
	  // Disallow specified warning terms in comments.
	  'no-warning-comments': OFF,
	
	  // Disallow with statements.
	  // Google ES6 Section 5.10.1
	  'no-with': ERROR,
	
	  // Enforce the consistent use of the radix argument when using parseInt().
	  'radix': OFF,
	
	  // Require var declarations be placed at the top of their containing scope.
	  'vars-on-top': OFF,
	
	  // Require parentheses around immediate function invocations.
	  'wrap-iife': OFF,
	
	  // Require or disallow "Yoda" conditions.
	  'yoda': OFF,
	};
	
	
	// Strict Mode
	// These rules relate to strict mode directives.
	const STRICT_MODE_RULES = {
	  // Require or disallow strict mode directives.  The style guide does not
	  // mandate the use of 'use strict'.
	  strict: OFF,
	};
	
	
	// Variables
	// These rules relate to variable declarations.
	const VARIABLE_DECLARATION_RULES = {
	  // Require or disallow initialization in var declarations.
	  'init-declarations': OFF,
	
	  // Disallow catch clause parameters from shadowing variables in the outer
	  // scope.
	  'no-catch-shadow': OFF,
	
	  // Disallow deleting variables.  #eslint
	  'no-delete-var': ERROR,
	
	  // Disallow labels that share a name with a variable.
	  'no-label-var': OFF,
	
	  // Disallow specified global variables.
	  'no-restricted-globals': OFF,
	
	  // Disallow identifiers from shadowing restricted names.
	  'no-shadow-restricted-names': OFF,
	
	  // Disallow var declarations from shadowing variables in the outer scope.
	  'no-shadow': OFF,
	
	  // Disallow initializing variables to undefined.
	  'no-undef-init': OFF,
	
	  // Disallow the use of undeclared variables unless mentioned in /*global */
	  // comments.  #eslint
	  // Disabled for closure rule.
	  // 'no-undef': ERROR,
	
	  // Disallow the use of undefined as an identifier.
	  'no-undefined': OFF,
	
	  // Disallow unused variables.  #eslint
	  'no-unused-vars': WARNING,
	
	  // Disallow the use of variables before they are defined.
	  'no-use-before-define': OFF,
	};
	
	
	// Node.js and CommonJS
	// These rules relate to code running in Node.js, or in browsers with CommonJS.
	const NODEJS_RULES = {
	  // Require return statements after callbacks.
	  'callback-return': OFF,
	
	  // Require require() calls to be placed at top-level module scope.
	  'global-require': OFF,
	
	  // Require error handling in callbacks.
	  'handle-callback-err': OFF,
	
	  // Disallow require calls to be mixed with regular var declarations.
	  'no-mixed-requires': OFF,
	
	  // Disallow new operators with calls to require.
	  'no-new-require': OFF,
	
	  // Disallow string concatenation with __dirname and __filename.
	  'no-path-concat': OFF,
	
	  // Disallow the use of process.env.
	  'no-process-env': OFF,
	
	  // Disallow the use of process.exit().
	  'no-process-exit': OFF,
	
	  // Disallow specified modules when loaded by require.
	  'no-restricted-modules': OFF,
	
	  // Disallow synchronous methods.
	  'no-sync': OFF,
	};
	
	
	// Stylistic Issues
	// These rules relate to style guidelines, and are therefore quite subjective.
	const STYLISTIC_RULES = {
	  // Enforce consistent spacing inside array brackets.
	  // Google ES5 https://git.io/vured#Code_formatting
	  'array-bracket-spacing': [ERROR, 'never'],
	
	  // Enforce consistent spacing inside single-line blocks.
	  'block-spacing': OFF,
	
	  // Enforce consistent brace style for blocks.
	  // Google ES5 https://git.io/vured#Code_formatting
	  // Google ES6 Section 4.1.2
	  'brace-style': [ERROR, '1tbs'],
	
	  // Enforce camelcase naming convention.
	  // Google plugin has more applicable rules.
	  'camelcase': OFF,
	
	  // Require or disallow trailing commas.
	  'comma-dangle': OFF,
	
	  // Enforce consistent spacing before and after commas.
	  // Google ES6 Section 4.6.2
	  'comma-spacing': ERROR,
	
	  // Enforce consistent comma style.
	  // Google ES6 Section 4.5.1
	  'comma-style': [ERROR, 'last'],
	
	  // Enforce consistent spacing inside computed property brackets.
	  'computed-property-spacing': OFF,
	
	  // Enforce consistent naming when capturing the current execution context.
	  'consistent-this': OFF,
	
	  // Enforce at least one newline at the end of files.
	  'eol-last': [ERROR, 'unix'],
	
	  // Require or disallow spacing between function identifiers and their
	  // invocations.
	  // Google ES6 Section 4.6.2
	  'func-call-spacing': [ERROR, 'never'],
	
	  // Require or disallow named function expressions.
	  'func-names': OFF,
	
	  // Enforce the consistent use of either function declarations or expressions.
	  'func-style': OFF,
	
	  // Disallow specified identifiers.
	  'id-blacklist': OFF,
	
	  // Enforce minimum and maximum identifier lengths.
	  'id-length': OFF,
	
	  // Require identifiers to match a specified regular expression.
	  'id-match': OFF,
	
	  // Enforce consistent indentation.
	  // Disabled because the closure/indent supports goog.scope.
	  'indent': OFF,
	
	  // Enforce the consistent use of either double or single quotes in JSX
	  // attributes.
	  'jsx-quotes': OFF,
	
	  // Enforce consistent spacing between keys and values in object literal
	  // properties.
	  // Google ES6 Section 4.6.2
	  'key-spacing': [WARNING, {
	    beforeColon: false,
	    afterColon: true,
	    mode: 'strict', // Enforces exactly 1 space.
	  }],
	
	  // Enforce consistent spacing before and after keywords.
	  // Google ES6 Section 4.6.2
	  'keyword-spacing': ERROR,
	
	  // Enforce consistent linebreak style.
	  'linebreak-style': OFF,
	
	  // Require empty lines around comments.
	  'lines-around-comment': OFF,
	
	  // Enforce a maximum depth that blocks can be nested.
	  'max-depth': OFF,
	
	  // Enforce a maximum line length.
	  // Google ES6 Section 4.4, implied in ES5 guide.
	  'max-len': [ERROR, {
	    code: 80,
	    comments: 80,
	    ignorePattern: '(goog\\.(require|module|provide)|\\brequire)\\(',
	    ignoreComments: false,
	    ignoreUrls: true,
	  }],
	
	  // Enforce a maximum number of lines per file.
	  'max-lines': OFF,
	
	  // Enforce a maximum depth that callbacks can be nested.
	  'max-nested-callbacks': OFF,
	
	  // Enforce a maximum number of parameters in function definitions.
	  'max-params': OFF,
	
	  // Enforce a maximum number of statements allowed per line.
	  // Google ES6 Section 4.3.1
	  'max-statements-per-line': [ERROR, {max: 1}],
	
	  // Enforce a maximum number of statements allowed in function blocks.
	  'max-statements': OFF,
	
	  // Enforce newlines between operands of ternary expressions.
	  'multiline-ternary': OFF,
	
	  // Require constructor function names to begin with a capital letter.
	  'new-cap': OFF,
	
	  // Require parentheses when invoking a constructor with no arguments.
	  'new-parens': ERROR,
	
	  // Require or disallow an empty line after var declarations.
	  'newline-after-var': OFF,
	
	  // Require an empty line before return statements.
	  'newline-before-return': OFF,
	
	  // Require a newline after each call in a method chain.
	  'newline-per-chained-call': OFF,
	
	  // Disallow Array constructors.
	  // Google ES5 https://git.io/vured#Array_and_Object_literals
	  // Google ES6 Section 5.2.2
	  'no-array-constructor': ERROR,
	
	  // Disallow bitwise operators.
	  'no-bitwise': OFF,
	
	  // Disallow continue statements.
	  'no-continue': OFF,
	
	  // Disallow inline comments after code.
	  'no-inline-comments': OFF,
	
	  // Disallow if statements as the only statement in else blocks.
	  'no-lonely-if': OFF,
	
	  // Disallow mixed binary operators.
	  'no-mixed-operators': OFF,
	
	  // Disallow mixed spaces and tabs for indentation.  #eslint
	  'no-mixed-spaces-and-tabs': ERROR,
	
	  // Disallow multiple empty lines.
	  // Google ES6 Section 4.6.1. Allowed.
	  'no-multiple-empty-lines': OFF,
	
	  // Disallow negated conditions.
	  'no-negated-condition': OFF,
	
	  // Disallow nested ternary expressions.
	  'no-nested-ternary': OFF,
	
	  // Disallow Object constructors.
	  // Google ES6 Section 5.3.2
	  'no-new-object': [ERROR],
	
	  // Disallow the unary operators ++ and --.
	  'no-plusplus': OFF,
	
	  // Disallow specified syntax.
	  'no-restricted-syntax': OFF,
	
	  // Disallow tabs in file.
	  'no-tabs': OFF,
	
	  // Disallow ternary operators.
	  'no-ternary': OFF,
	
	  // Disallow trailing whitespace at the end of lines.
	  // Google ES6 Section 4.6.2
	  'no-trailing-spaces': ERROR,
	
	  // Disallow dangling underscores in identifiers.
	  'no-underscore-dangle': OFF,
	
	  // Disallow ternary operators when simpler alternatives exist.
	  'no-unneeded-ternary': OFF,
	
	  // Disallow whitespace before properties.
	  // Google ES6 Section 4.3.2
	  'no-whitespace-before-property': ERROR,
	
	  // Enforce consistent line breaks inside braces.
	  'object-curly-newline': OFF,
	
	  // Enforce consistent spacing inside braces.
	  // Google ES5 https://git.io/vured#Code_formatting
	  // Google ES6 Section 4.2.2
	  'object-curly-spacing': [ERROR, 'never'],
	
	  // Enforce placing object properties on separate lines.
	  'object-property-newline': OFF,
	
	  // Require or disallow newlines around var declarations.
	  'one-var-declaration-per-line': OFF,
	
	  // Enforce variables to be declared either together or separately in
	  // functions.
	  // Google ES5 assumed to follow ES6
	  // Google ES6 Section 5.1.2
	  'one-var': [ERROR, {
	    const: 'never',
	    var: 'never',
	    let: 'never',
	  }],
	
	  // Require or disallow assignment operator shorthand where possible.
	  'operator-assignment': OFF,
	
	  // Enforce consistent linebreak style for operators.
	  // Google ES6 Section 4.5.1
	  'operator-linebreak': [ERROR, 'after'],
	
	  // Require or disallow padding within blocks.
	  'padded-blocks': OFF,
	
	  // Require quotes around object literal property names.
	  // Google ES6 Section 5.3.3
	  'quote-props': [WARNING, 'consistent-as-needed'],
	
	  // Enforce the consistent use of either backticks, double, or single quotes.
	  // Google ES5 https://git.io/vured#Strings
	  // Google ES6 Section 5.6.1, 5.6.2
	  'quotes': [ERROR, 'single', {
	    avoidEscape: true,
	    allowTemplateLiterals: true,
	  }],
	
	  // Require JSDoc comments.
	  'require-jsdoc': OFF,
	
	  // Enforce consistent spacing before and after semicolons.
	  'semi-spacing': ERROR,
	
	  // Require or disallow semicolons instead of ASI.
	  // Google ES5 https://git.io/vured#Strings#Semicolons
	  // Google ES6 Section 4.3.2
	  'semi': [ERROR, 'always'],
	
	  // Requires object keys to be sorted.
	  'sort-keys': OFF,
	
	  // Require variables within the same declaration block to be sorted.
	  'sort-vars': OFF,
	
	  // Enforce consistent spacing before blocks.
	  // Google ES6 Section 4.6.2
	  'space-before-blocks': [ERROR, 'always'],
	
	  // Enforce consistent spacing before function definition opening parenthesis.
	  // Google ES6 Section 4.6.2
	  'space-before-function-paren': [ERROR, 'never'],
	
	  // Enforce consistent spacing inside parentheses.
	  // Google ES6 Section 4.6.2
	  'space-in-parens': [ERROR, 'never'],
	
	  // Require spacing around operators.
	  // Google ES6 Section 5.5.5.1
	  'space-infix-ops': [ERROR, {int32Hint: true}],
	
	  // Enforce consistent spacing before or after unary operators.
	  // Google ES6 Section 4.6.2
	  'space-unary-ops': [ERROR, {
	    words: true,
	    nonwords: false,
	  }],
	
	  // Enforce consistent spacing after the // or /* in a comment.
	  // Google ES6 Section 4.3.2
	  'spaced-comment': [ERROR, 'always', {
	    block: {
	      balanced: true,
	    },
	  }],
	
	  // Require or disallow Unicode byte order mark (BOM).
	  'unicode-bom': OFF,
	
	  // Require parenthesis around regex literals.
	  'wrap-regex': OFF,
	};
	
	
	// ECMAScript 6
	// These rules relate to ES6, also known as ES2015.
	//
	// We apply ES6 rules to the base config to allow code bases to slowly migrate
	// to ES6.  The only rules specified here are those that are legal in both the
	// ES5 and ES6 style guides.
	const ES6_RULES = {
	  // Require braces around arrow function bodies.
	  'arrow-body-style': OFF,
	
	  // Require parentheses around arrow function arguments.
	  'arrow-parens': OFF,
	
	  // Enforce consistent spacing before and after the arrow in arrow functions.
	  // Google ES6 Section ?
	  'arrow-spacing': [WARNING, {
	    before: true,
	    after: true,
	  }],
	
	  // Require super() calls in constructors.  #eslint
	  // Google ES6 Section 5.4.1
	  'constructor-super': ERROR,
	
	  // Enforce consistent spacing around * operators in generator functions.
	  // Google ES6 Section 5.5.4
	  'generator-star-spacing': [WARNING, 'after'],
	
	  // Disallow reassigning class members.  #eslint
	  'no-class-assign': ERROR,
	
	  // Disallow arrow functions where they could be confused with comparisons.
	  'no-confusing-arrow': OFF,
	
	  // Disallow reassigning const variables.  #eslint
	  'no-const-assign': ERROR,
	
	  // Disallow duplicate class members.  #eslint
	  'no-dupe-class-members': ERROR,
	
	  // Disallow duplicate module imports.
	  'no-duplicate-imports': OFF,
	
	  // Disallow new operators with the Symbol object.  #eslint
	  'no-new-symbol': ERROR,
	
	  // Disallow specified modules when loaded by import.
	  'no-restricted-imports': OFF,
	
	  // Disallow this/super before calling super() in constructors.  #eslint
	  'no-this-before-super': ERROR,
	
	  // Disallow unnecessary computed property keys in object literals.
	  // Google ES6 Section 5.3.4
	  'no-useless-computed-key': ERROR,
	
	  // Disallow unnecessary constructors.
	  'no-useless-constructor': OFF,
	
	  // Disallow renaming import, export, and destructured assignments to the same
	  // name.
	  'no-useless-rename': OFF,
	
	  // Require let or const instead of var.
	  'no-var': OFF,
	
	  // Require or disallow method and property shorthand syntax for object
	  // literals.
	  'object-shorthand': OFF,
	
	  // Require arrow functions as callbacks.
	  'prefer-arrow-callback': OFF,
	
	  // Require const declarations for variables that are never reassigned after
	  // declared.
	  'prefer-const': OFF,
	
	  // Require Reflect methods where applicable.
	  'prefer-reflect': OFF,
	
	  // Require rest parameters instead of arguments.
	  'prefer-rest-params': OFF,
	
	  // Require spread operators instead of .apply().
	  // Google ES6 Section 5.5.8
	  'prefer-spread': WARNING,
	
	  // Require template literals instead of string concatenation.
	  'prefer-template': OFF,
	
	  // Require generator functions to contain yield.  #eslint
	  'require-yield': ERROR,
	
	  // Enforce spacing between rest and spread operators and their expressions.
	  // Google ES6 Section 5.2.5
	  'rest-spread-spacing': [ERROR, 'never'],
	
	  // Enforce sorted import declarations within modules.
	  'sort-imports': OFF,
	
	  // Require or disallow spacing around embedded expressions of template
	  // strings.
	  'template-curly-spacing': OFF,
	
	  // Require or disallow spacing around the * in yield* expressions.
	  // Google ES6 Section 5.5.4
	  'yield-star-spacing': [WARNING, 'after'],
	};
	
	
	// Google Plugin Rules
	// These rules are specific to Google code.  See
	// https://github.com/google/eslint-closure/packages/eslint-plugin-closure
	const GOOGLE_PLUGIN_RULES = {
	  'closure/indent': [WARNING, 2, {
	    // Google ES6 Section 4.2.5
	    SwitchCase: 1,
	    // Google ES6 Section 4.5.1
	    MemberExpression: 2,
	    // Google ES5: Aliasing with goog.scope
	    outerIIFEBody: 0,
	  }],
	  'closure/jsdoc': [WARNING, {
	    prefer: {
	      returns: 'return',
	      arg: 'param',
	      argument: 'param',
	    },
	    preferType: {
	      String: 'string',
	      Boolean: 'boolean',
	      Number: 'number',
	      Function: 'function',
	
	    },
	    requireReturn: false,
	    requireReturnType: false,
	    matchDescription: undefined,
	    requireParamDescription: false,
	    requireReturnDescription: false,
	  }],
	  'closure/no-undef': ERROR,
	  'closure/no-unused-expressions': ERROR,
	};
	
	// ESLint configuration object.  Options are described at
	// http://eslint.org/docs/user-guide/configuring.
	const ESLINT_CONFIG = {
	
	  parserOptions: {
	    ecmaVersion: 6,
	    sourceType: 'script',
	  },
	
	  parser: 'espree',
	
	  // An environment defines global variables that are predefined.
	  env: {
	    browser: true,
	    es6: true,
	  },
	
	  globals: {
	    goog: true,
	  },
	
	  plugins: [
	    // https://github.com/google/eslint-closure
	    'closure',
	  ],
	
	  // The list of rules and options are available at
	  // http://eslint.org/docs/rules/.
	  rules: Object.assign(
	    {},
	
	    // ESLint built-in rules.
	    POSSIBLE_ERROR_RULES,
	    BEST_PRACTICE_RULES,
	    STRICT_MODE_RULES,
	    VARIABLE_DECLARATION_RULES,
	    NODEJS_RULES,
	    STYLISTIC_RULES,
	    ES6_RULES,
	
	    // Custom plugin rules.
	    GOOGLE_PLUGIN_RULES
	  ),
	
	  // ESLint supports adding shared settings into configuration file.  The
	  // settings object will be supplied to every rule that will be executed.
	  settings: {
	    jsdoc: {
	      additionalTagNames: {
	        customTags: GOOGLE_CUSTOM_JSDOC_TAGS.concat(CLOSURE_JSDOC_TAGS),
	      },
	      tagNamePreference: {
	        returns: 'return',
	      },
	    },
	  },
	};
	
	
	module.exports = ESLINT_CONFIG;


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Custom ESLint configuration to adhere to the Google style guide
	 * at https://google.github.io/styleguide/javascriptguide.xml.
	 *
	 * Short link to the Google JS Style Guide: https://git.io/vured
	 * Short link to the Google C++ Style Guide: https://git.io/v6Mp3
	 */
	
	
	// Named constants for the numbers eslint uses to indicate lint severity.
	const OFF = 0;
	const WARNING = 1;
	const ERROR = 2;
	
	
	// Possible Errors
	// These rules relate to possible syntax or logic errors in JavaScript code.
	const POSSIBLE_ERROR_RULES = {};
	
	
	// Best Practices
	// These rules relate to better ways of doing things to help you avoid problems.
	const BEST_PRACTICE_RULES = {};
	
	
	// Strict Mode
	// These rules relate to strict mode directives.
	const STRICT_MODE_RULES = {};
	
	
	// Variables
	// These rules relate to variable declarations.
	const VARIABLE_DECLARATION_RULES = {};
	
	
	// Node.js and CommonJS
	// These rules relate to code running in Node.js, or in browsers with CommonJS.
	const NODEJS_RULES = {};
	
	
	// Stylistic Issues
	// These rules relate to style guidelines, and are therefore quite subjective.
	const STYLISTIC_RULES = {
	
	};
	
	
	// ECMAScript 6
	// These rules relate to ES6, also known as ES2015.
	const ES6_RULES = {};
	
	
	// Google Plugin Rules
	// These rules are specific to Google code.  See
	// https://github.com/google/eslint-closure/packages/eslint-plugin-closure
	const GOOGLE_PLUGIN_RULES = {
	  // Allow opt_ prefix and var_args in identifiers.  From
	  // https://git.io/vured#Naming
	  'closure/camelcase': [ERROR, {
	    allowVarArgs: true,
	    allowOptPrefix: true,
	    allowLeadingUnderscore: true,
	    allowTrailingUnderscore: true,
	    // Too many warnings, often required for interop with protobufs.
	    checkObjectProperties: false,
	  }],
	
	  // TODO(jschaf): Is this still valid?
	  // The JS style guide 'follows the C++ style guide in spirit'.  The C++ style
	  // guide mandates two spaces before line-end comments.  See the 'Line
	  // Comments' section under
	  // https://git.io/v6Mp3#Implementation_Comments
	  'closure/inline-comment-spacing': [ERROR, 2],
	};
	
	
	const GOOGLE_ES5_RULES = {
	
	  extends: [
	    /*require.resolve*/(19),
	  ],
	
	  parserOptions: {
	    ecmaVersion: 6,
	    sourceType: 'script',
	  },
	
	  // The list of rules and options are available at
	  // http://eslint.org/docs/rules/.
	  rules: Object.assign(
	      {},
	
	      // ESLint built-in rules.
	      POSSIBLE_ERROR_RULES,
	      BEST_PRACTICE_RULES,
	      STRICT_MODE_RULES,
	      VARIABLE_DECLARATION_RULES,
	      NODEJS_RULES,
	      STYLISTIC_RULES,
	      ES6_RULES,
	
	      // Custom plugin rules.
	      GOOGLE_PLUGIN_RULES
	      ),
	};
	
	module.exports = GOOGLE_ES5_RULES;


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview Custom ESLint configuration to adhere to the Google style guide
	 * for ES6.
	 *
	 * Short link to the Google JS Style Guide: https://git.io/vured
	 */
	
	
	// Named constants for the numbers eslint uses to indicate lint severity.
	const OFF = 0;
	const WARNING = 1;
	const ERROR = 2;
	
	
	// Possible Errors
	// These rules relate to possible syntax or logic errors in JavaScript code.
	const POSSIBLE_ERROR_RULES = {};
	
	
	// Best Practices
	// These rules relate to better ways of doing things to help you avoid problems.
	const BEST_PRACTICE_RULES = {};
	
	
	// Strict Mode
	// These rules relate to strict mode directives.
	const STRICT_MODE_RULES = {};
	
	
	// Variables
	// These rules relate to variable declarations.
	const VARIABLE_DECLARATION_RULES = {};
	
	
	// Node.js and CommonJS
	// These rules relate to code running in Node.js, or in browsers with CommonJS.
	const NODEJS_RULES = {};
	
	
	// Stylistic Issues
	// These rules relate to style guidelines, and are therefore quite subjective.
	const STYLISTIC_RULES = {
	  // Require or disallow trailing commas.
	  // Google ES6 Section 5.2.1, 5.3.1
	  'comma-dangle': [WARNING, 'always-multiline'],
	
	  // Disallow irregular whitespace outside of strings and comments.
	  // Google ES6 Section 2.3.1
	  'no-irregular-whitespace': ERROR,
	
	  // Disallow tabs in file.
	  // Google ES6 Section 2.3.1
	  'no-tabs': ERROR,
	};
	
	
	// ECMAScript 6
	// These rules relate to ES6, also known as ES2015.
	//
	// Most of these rules are applied in the base config to allow code bases to
	// slowly migrate to ES6.  The only rules specified here and not in the base
	// config, are those that would conflict with the ES5 style guide.
	const ES6_RULES = {
	  // Require braces around arrow function bodies.
	  'arrow-body-style': OFF,
	
	  // Require parentheses around arrow function arguments.
	  'arrow-parens': OFF,
	
	  // Enforce consistent spacing before and after the arrow in arrow functions.
	  // SKIP, included in base.
	  // 'arrow-spacing': OFF,
	
	  // Require super() calls in constructors.  #eslint
	  // SKIP, included in base.
	  // 'constructor-super': ERROR,
	
	  // Enforce consistent spacing around * operators in generator functions.
	  // SKIP, included in base.
	  // 'generator-star-spacing': OFF,
	
	  // Disallow reassigning class members.  #eslint
	  // SKIP, included in base.
	  // 'no-class-assign': ERROR,
	
	  // Disallow arrow functions where they could be confused with comparisons.
	  'no-confusing-arrow': OFF,
	
	  // Disallow reassigning const variables.  #eslint
	  // SKIP, included in base.
	  // 'no-const-assign': ERROR,
	
	  // Disallow duplicate class members.  #eslint
	  // SKIP, included in base.
	  // 'no-dupe-class-members': ERROR,
	
	  // Disallow duplicate module imports.
	  'no-duplicate-imports': OFF,
	
	  // Disallow new operators with the Symbol object.  #eslint
	  // SKIP, included in base.
	  // 'no-new-symbol': ERROR,
	
	  // Disallow specified modules when loaded by import.
	  'no-restricted-imports': OFF,
	
	  // Disallow this/super before calling super() in constructors.  #eslint
	  // SKIP, included in base.
	  // 'no-this-before-super': ERROR,
	
	  // Disallow unnecessary computed property keys in object literals.
	  // SKIP, included in base.
	  // 'no-useless-computed-key': ERROR,
	
	  // Disallow unnecessary constructors.
	  'no-useless-constructor': OFF,
	
	  // Disallow renaming import, export, and destructured assignments to the same
	  // name.
	  'no-useless-rename': OFF,
	
	  // Require let or const instead of var.
	  // Google ES6 Section 5.1.1
	  'no-var': ERROR,
	
	  // Require or disallow method and property shorthand syntax for object
	  // literals.
	  // Google ES6 Section 5.3.5
	  'object-shorthand': [ERROR, 'methods'],
	
	  // Require arrow functions as callbacks.
	  'prefer-arrow-callback': OFF,
	
	  // Require const declarations for variables that are never reassigned after
	  // declared.
	  // Google ES6 Section 5.1.1
	  'prefer-const': WARNING,
	
	  // Require Reflect methods where applicable.
	  'prefer-reflect': OFF,
	
	  // Require rest parameters instead of arguments.
	  'prefer-rest-params': OFF,
	
	  // Require spread operators instead of .apply().
	  // SKIP, included in base.
	  // 'prefer-spread': WARNING,
	
	  // Require template literals instead of string concatenation.
	  // Google ES6 Section 5.6.2
	  'prefer-template': [WARNING],
	
	  // Require generator functions to contain yield.  #eslint
	  // SKIP, included in base.
	  // 'require-yield': ERROR,
	
	  // Enforce spacing between rest and spread operators and their expressions.
	  // SKIP, included in base.
	  // 'rest-spread-spacing': [ERROR, 'never'],
	
	  // Enforce sorted import declarations within modules.
	  'sort-imports': OFF,
	
	  // Require or disallow spacing around embedded expressions of template
	  // strings.
	  'template-curly-spacing': OFF,
	
	  // Require or disallow spacing around the * in yield* expressions.
	  // SKIP, included in base.
	  // 'yield-star-spacing': [WARNING, 'after'],
	};
	
	// Google Plugin Rules
	// These rules are specific to Google code.  See
	// https://github.com/google/eslint-closure/packages/eslint-plugin-closure
	const GOOGLE_PLUGIN_RULES = {
	  // Disallow opt_ prefix and var_args as identifiers.
	  'closure/camelcase': [ERROR, {
	    allowVarArgs: false,
	    allowOptPrefix: false,
	    allowLeadingUnderscore: true,
	    allowTrailingUnderscore: true,
	    checkObjectProperties: false,
	  }],
	};
	
	const ECMA_FEATURES = {
	  // Enable arrow functions.
	  arrowFunctions: true,
	
	  // Enable binary literals.
	  binaryLiterals: true,
	
	  // Enable let and const (aka block bindings).
	  blockBindings: true,
	
	  // Enable classes.
	  classes: true,
	
	  // Enable default function parameters.
	  defaultParams: true,
	
	  // Enable destructuring.
	  destructuring: true,
	
	  // Enable for-of loops.
	  forOf: true,
	
	  // Enable generators.
	  generators: true,
	
	  // Enable modules and global strict mode.  Required by Section 3.3.2.
	  modules: false,
	
	  // Enable computed object literal property names.
	  objectLiteralComputedProperties: true,
	
	  // Enable duplicate object literal properties in strict mode.
	  objectLiteralDuplicateProperties: true,
	
	  // Enable object literal shorthand methods.
	  objectLiteralShorthandMethods: true,
	
	  // Enable object literal shorthand properties.
	  objectLiteralShorthandProperties: true,
	
	  // Enable octal literals.
	  octalLiterals: true,
	
	  // Enable the regular expression u flag.
	  regexUFlag: true,
	
	  // Enable the regular expression y flag.
	  regexYFlag: true,
	
	  // Enable the rest parameters.
	  restParams: true,
	
	  // Enable the spread operator for arrays.
	  spread: true,
	
	  // Enable super references inside of functions.
	  superInFunctions: true,
	
	  // Enable template strings.
	  templateStrings: true,
	
	  // Enable code point escapes.
	  unicodeCodePointEscapes: true,
	
	};
	
	
	const GOOGLE_ES6_RULES = {
	
	  extends: [
	    /*require.resolve*/(19),
	  ],
	
	  parserOptions: {
	    ecmaVersion: 6,
	    sourceType: 'script',
	    ecmaFeatures: ECMA_FEATURES,
	  },
	
	  plugins: [
	    'closure',
	  ],
	
	
	  // The list of rules and options are available at
	  // http://eslint.org/docs/rules/.
	  rules: Object.assign(
	    {},
	
	    // ESLint built-in rules.
	    POSSIBLE_ERROR_RULES,
	    BEST_PRACTICE_RULES,
	    STRICT_MODE_RULES,
	    VARIABLE_DECLARATION_RULES,
	    NODEJS_RULES,
	    STYLISTIC_RULES,
	    ES6_RULES,
	
	    // Custom plugin rules.
	    GOOGLE_PLUGIN_RULES
	  ),
	};
	
	module.exports = GOOGLE_ES6_RULES;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, module) {/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;
	
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    promiseTag = '[object Promise]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]',
	    weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';
	
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	
	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;
	
	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;
	
	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag] = cloneableTags[arrayTag] =
	cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
	cloneableTags[boolTag] = cloneableTags[dateTag] =
	cloneableTags[float32Tag] = cloneableTags[float64Tag] =
	cloneableTags[int8Tag] = cloneableTags[int16Tag] =
	cloneableTags[int32Tag] = cloneableTags[mapTag] =
	cloneableTags[numberTag] = cloneableTags[objectTag] =
	cloneableTags[regexpTag] = cloneableTags[setTag] =
	cloneableTags[stringTag] = cloneableTags[symbolTag] =
	cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	cloneableTags[errorTag] = cloneableTags[funcTag] =
	cloneableTags[weakMapTag] = false;
	
	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
	
	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
	
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();
	
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	
	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && freeGlobal.process;
	
	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    return freeProcess && freeProcess.binding('util');
	  } catch (e) {}
	}());
	
	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
	
	/**
	 * Adds the key-value `pair` to `map`.
	 *
	 * @private
	 * @param {Object} map The map to modify.
	 * @param {Array} pair The key-value pair to add.
	 * @returns {Object} Returns `map`.
	 */
	function addMapEntry(map, pair) {
	  // Don't return `map.set` because it's not chainable in IE 11.
	  map.set(pair[0], pair[1]);
	  return map;
	}
	
	/**
	 * Adds `value` to `set`.
	 *
	 * @private
	 * @param {Object} set The set to modify.
	 * @param {*} value The value to add.
	 * @returns {Object} Returns `set`.
	 */
	function addSetEntry(set, value) {
	  // Don't return `set.add` because it's not chainable in IE 11.
	  set.add(value);
	  return set;
	}
	
	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {Array} args The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  switch (args.length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}
	
	/**
	 * A specialized version of `_.forEach` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array ? array.length : 0;
	
	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}
	
	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;
	
	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}
	
	/**
	 * A specialized version of `_.reduce` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {*} [accumulator] The initial value.
	 * @param {boolean} [initAccum] Specify using the first element of `array` as
	 *  the initial value.
	 * @returns {*} Returns the accumulated value.
	 */
	function arrayReduce(array, iteratee, accumulator, initAccum) {
	  var index = -1,
	      length = array ? array.length : 0;
	
	  if (initAccum && length) {
	    accumulator = array[++index];
	  }
	  while (++index < length) {
	    accumulator = iteratee(accumulator, array[index], index, array);
	  }
	  return accumulator;
	}
	
	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);
	
	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}
	
	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}
	
	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */
	function isHostObject(value) {
	  // Many host objects are `Object` objects that can coerce to strings
	  // despite having improperly defined `toString` methods.
	  var result = false;
	  if (value != null && typeof value.toString != 'function') {
	    try {
	      result = !!(value + '');
	    } catch (e) {}
	  }
	  return result;
	}
	
	/**
	 * Converts `map` to its key-value pairs.
	 *
	 * @private
	 * @param {Object} map The map to convert.
	 * @returns {Array} Returns the key-value pairs.
	 */
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);
	
	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}
	
	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}
	
	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);
	
	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}
	
	/** Used for built-in method references. */
	var arrayProto = Array.prototype,
	    funcProto = Function.prototype,
	    objectProto = Object.prototype;
	
	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];
	
	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());
	
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/** Used to infer the `Object` constructor. */
	var objectCtorString = funcToString.call(Object);
	
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;
	
	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);
	
	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : undefined,
	    Symbol = root.Symbol,
	    Uint8Array = root.Uint8Array,
	    getPrototype = overArg(Object.getPrototypeOf, Object),
	    objectCreate = Object.create,
	    propertyIsEnumerable = objectProto.propertyIsEnumerable,
	    splice = arrayProto.splice;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols,
	    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
	    nativeKeys = overArg(Object.keys, Object),
	    nativeMax = Math.max;
	
	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView'),
	    Map = getNative(root, 'Map'),
	    Promise = getNative(root, 'Promise'),
	    Set = getNative(root, 'Set'),
	    WeakMap = getNative(root, 'WeakMap'),
	    nativeCreate = getNative(Object, 'create');
	
	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map),
	    promiseCtorString = toSource(Promise),
	    setCtorString = toSource(Set),
	    weakMapCtorString = toSource(WeakMap);
	
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
	
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	}
	
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  return this.has(key) && delete this.__data__[key];
	}
	
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}
	
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
	}
	
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}
	
	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	}
	
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  return true;
	}
	
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  return index < 0 ? undefined : data[index][1];
	}
	
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}
	
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);
	
	  if (index < 0) {
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}
	
	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries ? entries.length : 0;
	
	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}
	
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}
	
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  return getMapData(this, key)['delete'](key);
	}
	
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}
	
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}
	
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  getMapData(this, key).set(key, value);
	  return this;
	}
	
	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	
	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  this.__data__ = new ListCache(entries);
	}
	
	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	}
	
	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  return this.__data__['delete'](key);
	}
	
	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}
	
	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}
	
	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var cache = this.__data__;
	  if (cache instanceof ListCache) {
	    var pairs = cache.__data__;
	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      return this;
	    }
	    cache = this.__data__ = new MapCache(pairs);
	  }
	  cache.set(key, value);
	  return this;
	}
	
	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;
	
	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  // Safari 9 makes `arguments.length` enumerable in strict mode.
	  var result = (isArray(value) || isArguments(value))
	    ? baseTimes(value.length, String)
	    : [];
	
	  var length = result.length,
	      skipIndexes = !!length;
	
	  for (var key in value) {
	    if ((inherited || hasOwnProperty.call(value, key)) &&
	        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * This function is like `assignValue` except that it doesn't assign
	 * `undefined` values.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignMergeValue(object, key, value) {
	  if ((value !== undefined && !eq(object[key], value)) ||
	      (typeof key == 'number' && value === undefined && !(key in object))) {
	    object[key] = value;
	  }
	}
	
	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
	  var objValue = object[key];
	  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
	      (value === undefined && !(key in object))) {
	    object[key] = value;
	  }
	}
	
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}
	
	/**
	 * The base implementation of `_.assign` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssign(object, source) {
	  return object && copyObject(source, keys(source), object);
	}
	
	/**
	 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
	 * traversed objects.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @param {boolean} [isFull] Specify a clone including symbols.
	 * @param {Function} [customizer] The function to customize cloning.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The parent object of `value`.
	 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
	  var result;
	  if (customizer) {
	    result = object ? customizer(value, key, object, stack) : customizer(value);
	  }
	  if (result !== undefined) {
	    return result;
	  }
	  if (!isObject(value)) {
	    return value;
	  }
	  var isArr = isArray(value);
	  if (isArr) {
	    result = initCloneArray(value);
	    if (!isDeep) {
	      return copyArray(value, result);
	    }
	  } else {
	    var tag = getTag(value),
	        isFunc = tag == funcTag || tag == genTag;
	
	    if (isBuffer(value)) {
	      return cloneBuffer(value, isDeep);
	    }
	    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	      if (isHostObject(value)) {
	        return object ? value : {};
	      }
	      result = initCloneObject(isFunc ? {} : value);
	      if (!isDeep) {
	        return copySymbols(value, baseAssign(result, value));
	      }
	    } else {
	      if (!cloneableTags[tag]) {
	        return object ? value : {};
	      }
	      result = initCloneByTag(value, tag, baseClone, isDeep);
	    }
	  }
	  // Check for circular references and return its corresponding clone.
	  stack || (stack = new Stack);
	  var stacked = stack.get(value);
	  if (stacked) {
	    return stacked;
	  }
	  stack.set(value, result);
	
	  if (!isArr) {
	    var props = isFull ? getAllKeys(value) : keys(value);
	  }
	  arrayEach(props || value, function(subValue, key) {
	    if (props) {
	      key = subValue;
	      subValue = value[key];
	    }
	    // Recursively populate clone (susceptible to call stack limits).
	    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
	  });
	  return result;
	}
	
	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} prototype The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	function baseCreate(proto) {
	  return isObject(proto) ? objectCreate(proto) : {};
	}
	
	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}
	
	/**
	 * The base implementation of `getTag`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  return objectToString.call(value);
	}
	
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}
	
	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
	}
	
	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeysIn(object) {
	  if (!isObject(object)) {
	    return nativeKeysIn(object);
	  }
	  var isProto = isPrototype(object),
	      result = [];
	
	  for (var key in object) {
	    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * The base implementation of `_.merge` without support for multiple sources.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {number} srcIndex The index of `source`.
	 * @param {Function} [customizer] The function to customize merged values.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 */
	function baseMerge(object, source, srcIndex, customizer, stack) {
	  if (object === source) {
	    return;
	  }
	  if (!(isArray(source) || isTypedArray(source))) {
	    var props = baseKeysIn(source);
	  }
	  arrayEach(props || source, function(srcValue, key) {
	    if (props) {
	      key = srcValue;
	      srcValue = source[key];
	    }
	    if (isObject(srcValue)) {
	      stack || (stack = new Stack);
	      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
	    }
	    else {
	      var newValue = customizer
	        ? customizer(object[key], srcValue, (key + ''), object, source, stack)
	        : undefined;
	
	      if (newValue === undefined) {
	        newValue = srcValue;
	      }
	      assignMergeValue(object, key, newValue);
	    }
	  });
	}
	
	/**
	 * A specialized version of `baseMerge` for arrays and objects which performs
	 * deep merges and tracks traversed objects enabling objects with circular
	 * references to be merged.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @param {string} key The key of the value to merge.
	 * @param {number} srcIndex The index of `source`.
	 * @param {Function} mergeFunc The function to merge values.
	 * @param {Function} [customizer] The function to customize assigned values.
	 * @param {Object} [stack] Tracks traversed source values and their merged
	 *  counterparts.
	 */
	function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
	  var objValue = object[key],
	      srcValue = source[key],
	      stacked = stack.get(srcValue);
	
	  if (stacked) {
	    assignMergeValue(object, key, stacked);
	    return;
	  }
	  var newValue = customizer
	    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
	    : undefined;
	
	  var isCommon = newValue === undefined;
	
	  if (isCommon) {
	    newValue = srcValue;
	    if (isArray(srcValue) || isTypedArray(srcValue)) {
	      if (isArray(objValue)) {
	        newValue = objValue;
	      }
	      else if (isArrayLikeObject(objValue)) {
	        newValue = copyArray(objValue);
	      }
	      else {
	        isCommon = false;
	        newValue = baseClone(srcValue, true);
	      }
	    }
	    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
	      if (isArguments(objValue)) {
	        newValue = toPlainObject(objValue);
	      }
	      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
	        isCommon = false;
	        newValue = baseClone(srcValue, true);
	      }
	      else {
	        newValue = objValue;
	      }
	    }
	    else {
	      isCommon = false;
	    }
	  }
	  if (isCommon) {
	    // Recursively merge objects and arrays (susceptible to call stack limits).
	    stack.set(srcValue, newValue);
	    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
	    stack['delete'](srcValue);
	  }
	  assignMergeValue(object, key, newValue);
	}
	
	/**
	 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 */
	function baseRest(func, start) {
	  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);
	
	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    index = -1;
	    var otherArgs = Array(start + 1);
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = array;
	    return apply(func, this, otherArgs);
	  };
	}
	
	/**
	 * Creates a clone of  `buffer`.
	 *
	 * @private
	 * @param {Buffer} buffer The buffer to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Buffer} Returns the cloned buffer.
	 */
	function cloneBuffer(buffer, isDeep) {
	  if (isDeep) {
	    return buffer.slice();
	  }
	  var result = new buffer.constructor(buffer.length);
	  buffer.copy(result);
	  return result;
	}
	
	/**
	 * Creates a clone of `arrayBuffer`.
	 *
	 * @private
	 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function cloneArrayBuffer(arrayBuffer) {
	  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
	  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
	  return result;
	}
	
	/**
	 * Creates a clone of `dataView`.
	 *
	 * @private
	 * @param {Object} dataView The data view to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned data view.
	 */
	function cloneDataView(dataView, isDeep) {
	  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
	  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
	}
	
	/**
	 * Creates a clone of `map`.
	 *
	 * @private
	 * @param {Object} map The map to clone.
	 * @param {Function} cloneFunc The function to clone values.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned map.
	 */
	function cloneMap(map, isDeep, cloneFunc) {
	  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
	  return arrayReduce(array, addMapEntry, new map.constructor);
	}
	
	/**
	 * Creates a clone of `regexp`.
	 *
	 * @private
	 * @param {Object} regexp The regexp to clone.
	 * @returns {Object} Returns the cloned regexp.
	 */
	function cloneRegExp(regexp) {
	  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
	  result.lastIndex = regexp.lastIndex;
	  return result;
	}
	
	/**
	 * Creates a clone of `set`.
	 *
	 * @private
	 * @param {Object} set The set to clone.
	 * @param {Function} cloneFunc The function to clone values.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned set.
	 */
	function cloneSet(set, isDeep, cloneFunc) {
	  var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
	  return arrayReduce(array, addSetEntry, new set.constructor);
	}
	
	/**
	 * Creates a clone of the `symbol` object.
	 *
	 * @private
	 * @param {Object} symbol The symbol object to clone.
	 * @returns {Object} Returns the cloned symbol object.
	 */
	function cloneSymbol(symbol) {
	  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
	}
	
	/**
	 * Creates a clone of `typedArray`.
	 *
	 * @private
	 * @param {Object} typedArray The typed array to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned typed array.
	 */
	function cloneTypedArray(typedArray, isDeep) {
	  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
	  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
	}
	
	/**
	 * Copies the values of `source` to `array`.
	 *
	 * @private
	 * @param {Array} source The array to copy values from.
	 * @param {Array} [array=[]] The array to copy values to.
	 * @returns {Array} Returns `array`.
	 */
	function copyArray(source, array) {
	  var index = -1,
	      length = source.length;
	
	  array || (array = Array(length));
	  while (++index < length) {
	    array[index] = source[index];
	  }
	  return array;
	}
	
	/**
	 * Copies properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Array} props The property identifiers to copy.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @param {Function} [customizer] The function to customize copied values.
	 * @returns {Object} Returns `object`.
	 */
	function copyObject(source, props, object, customizer) {
	  object || (object = {});
	
	  var index = -1,
	      length = props.length;
	
	  while (++index < length) {
	    var key = props[index];
	
	    var newValue = customizer
	      ? customizer(object[key], source[key], key, object, source)
	      : undefined;
	
	    assignValue(object, key, newValue === undefined ? source[key] : newValue);
	  }
	  return object;
	}
	
	/**
	 * Copies own symbol properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbols(source, object) {
	  return copyObject(source, getSymbols(source), object);
	}
	
	/**
	 * Creates a function like `_.assign`.
	 *
	 * @private
	 * @param {Function} assigner The function to assign values.
	 * @returns {Function} Returns the new assigner function.
	 */
	function createAssigner(assigner) {
	  return baseRest(function(object, sources) {
	    var index = -1,
	        length = sources.length,
	        customizer = length > 1 ? sources[length - 1] : undefined,
	        guard = length > 2 ? sources[2] : undefined;
	
	    customizer = (assigner.length > 3 && typeof customizer == 'function')
	      ? (length--, customizer)
	      : undefined;
	
	    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
	      customizer = length < 3 ? undefined : customizer;
	      length = 1;
	    }
	    object = Object(object);
	    while (++index < length) {
	      var source = sources[index];
	      if (source) {
	        assigner(object, source, index, customizer);
	      }
	    }
	    return object;
	  });
	}
	
	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return baseGetAllKeys(object, keys, getSymbols);
	}
	
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}
	
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}
	
	/**
	 * Creates an array of the own enumerable symbol properties of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;
	
	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;
	
	// Fallback for data views, maps, sets, and weak maps in IE 11,
	// for data views in Edge < 14, and promises in Node.js.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
	    (Map && getTag(new Map) != mapTag) ||
	    (Promise && getTag(Promise.resolve()) != promiseTag) ||
	    (Set && getTag(new Set) != setTag) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
	  getTag = function(value) {
	    var result = objectToString.call(value),
	        Ctor = result == objectTag ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : undefined;
	
	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag;
	        case mapCtorString: return mapTag;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag;
	        case weakMapCtorString: return weakMapTag;
	      }
	    }
	    return result;
	  };
	}
	
	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray(array) {
	  var length = array.length,
	      result = array.constructor(length);
	
	  // Add properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}
	
	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject(object) {
	  return (typeof object.constructor == 'function' && !isPrototype(object))
	    ? baseCreate(getPrototype(object))
	    : {};
	}
	
	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {Function} cloneFunc The function to clone values.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag(object, tag, cloneFunc, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag:
	      return cloneArrayBuffer(object);
	
	    case boolTag:
	    case dateTag:
	      return new Ctor(+object);
	
	    case dataViewTag:
	      return cloneDataView(object, isDeep);
	
	    case float32Tag: case float64Tag:
	    case int8Tag: case int16Tag: case int32Tag:
	    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
	      return cloneTypedArray(object, isDeep);
	
	    case mapTag:
	      return cloneMap(object, isDeep, cloneFunc);
	
	    case numberTag:
	    case stringTag:
	      return new Ctor(object);
	
	    case regexpTag:
	      return cloneRegExp(object);
	
	    case setTag:
	      return cloneSet(object, isDeep, cloneFunc);
	
	    case symbolTag:
	      return cloneSymbol(object);
	  }
	}
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}
	
	/**
	 * Checks if the given arguments are from an iteratee call.
	 *
	 * @private
	 * @param {*} value The potential iteratee value argument.
	 * @param {*} index The potential iteratee index or key argument.
	 * @param {*} object The potential iteratee object argument.
	 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
	 *  else `false`.
	 */
	function isIterateeCall(value, index, object) {
	  if (!isObject(object)) {
	    return false;
	  }
	  var type = typeof index;
	  if (type == 'number'
	        ? (isArrayLike(object) && isIndex(index, object.length))
	        : (type == 'string' && index in object)
	      ) {
	    return eq(object[index], value);
	  }
	  return false;
	}
	
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}
	
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}
	
	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
	
	  return value === proto;
	}
	
	/**
	 * This function is like
	 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * except that it includes inherited enumerable properties.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function nativeKeysIn(object) {
	  var result = [];
	  if (object != null) {
	    for (var key in Object(object)) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}
	
	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	function isArguments(value) {
	  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
	  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
	    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
	}
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}
	
	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}
	
	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse;
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 8-9 which returns 'object' for typed array and other constructors.
	  var tag = isObject(value) ? objectToString.call(value) : '';
	  return tag == funcTag || tag == genTag;
	}
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}
	
	/**
	 * Checks if `value` is a plain object, that is, an object created by the
	 * `Object` constructor or one with a `[[Prototype]]` of `null`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.8.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 * }
	 *
	 * _.isPlainObject(new Foo);
	 * // => false
	 *
	 * _.isPlainObject([1, 2, 3]);
	 * // => false
	 *
	 * _.isPlainObject({ 'x': 0, 'y': 0 });
	 * // => true
	 *
	 * _.isPlainObject(Object.create(null));
	 * // => true
	 */
	function isPlainObject(value) {
	  if (!isObjectLike(value) ||
	      objectToString.call(value) != objectTag || isHostObject(value)) {
	    return false;
	  }
	  var proto = getPrototype(value);
	  if (proto === null) {
	    return true;
	  }
	  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
	  return (typeof Ctor == 'function' &&
	    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
	}
	
	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
	
	/**
	 * Converts `value` to a plain object flattening inherited enumerable string
	 * keyed properties of `value` to own properties of the plain object.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {Object} Returns the converted plain object.
	 * @example
	 *
	 * function Foo() {
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.assign({ 'a': 1 }, new Foo);
	 * // => { 'a': 1, 'b': 2 }
	 *
	 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
	 * // => { 'a': 1, 'b': 2, 'c': 3 }
	 */
	function toPlainObject(value) {
	  return copyObject(value, keysIn(value));
	}
	
	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}
	
	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
	}
	
	/**
	 * This method is like `_.assign` except that it recursively merges own and
	 * inherited enumerable string keyed properties of source objects into the
	 * destination object. Source properties that resolve to `undefined` are
	 * skipped if a destination value exists. Array and plain object properties
	 * are merged recursively. Other objects and value types are overridden by
	 * assignment. Source objects are applied from left to right. Subsequent
	 * sources overwrite property assignments of previous sources.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.5.0
	 * @category Object
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = {
	 *   'a': [{ 'b': 2 }, { 'd': 4 }]
	 * };
	 *
	 * var other = {
	 *   'a': [{ 'c': 3 }, { 'e': 5 }]
	 * };
	 *
	 * _.merge(object, other);
	 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
	 */
	var merge = createAssigner(function(object, source, srcIndex) {
	  baseMerge(object, source, srcIndex);
	});
	
	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray() {
	  return [];
	}
	
	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}
	
	module.exports = merge;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(4)(module)))

/***/ }
/******/ ]);
//# sourceMappingURL=app.bundle.js.map