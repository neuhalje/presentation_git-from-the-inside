(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	/*!
	 * assertion-error
	 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
	 * MIT Licensed
	 */
	/*!
	 * Return a function that will copy properties from
	 * one object to another excluding any originally
	 * listed. Returned function will create a new `{}`.
	 *
	 * @param {String} excluded properties ...
	 * @return {Function}
	 */

	function exclude () {
	  var excludes = [].slice.call(arguments);

	  function excludeProps (res, obj) {
	    Object.keys(obj).forEach(function (key) {
	      if (!~excludes.indexOf(key)) res[key] = obj[key];
	    });
	  }

	  return function extendExclude () {
	    var args = [].slice.call(arguments)
	      , i = 0
	      , res = {};

	    for (; i < args.length; i++) {
	      excludeProps(res, args[i]);
	    }

	    return res;
	  };
	}
	/*!
	 * Primary Exports
	 */

	var assertionError = AssertionError;

	/**
	 * ### AssertionError
	 *
	 * An extension of the JavaScript `Error` constructor for
	 * assertion and validation scenarios.
	 *
	 * @param {String} message
	 * @param {Object} properties to include (optional)
	 * @param {callee} start stack function (optional)
	 */

	function AssertionError (message, _props, ssf) {
	  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
	    , props = extend(_props || {});

	  // default values
	  this.message = message || 'Unspecified AssertionError';
	  this.showDiff = false;

	  // copy from properties
	  for (var key in props) {
	    this[key] = props[key];
	  }

	  // capture stack trace
	  ssf = ssf || AssertionError;
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, ssf);
	  } else {
	    try {
	      throw new Error();
	    } catch(e) {
	      this.stack = e.stack;
	    }
	  }
	}

	/*!
	 * Inherit from Error.prototype
	 */

	AssertionError.prototype = Object.create(Error.prototype);

	/*!
	 * Statically set name
	 */

	AssertionError.prototype.name = 'AssertionError';

	/*!
	 * Ensure correct constructor
	 */

	AssertionError.prototype.constructor = AssertionError;

	/**
	 * Allow errors to be converted to JSON for static transfer.
	 *
	 * @param {Boolean} include stack (default: `true`)
	 * @return {Object} object that can be `JSON.stringify`
	 */

	AssertionError.prototype.toJSON = function (stack) {
	  var extend = exclude('constructor', 'toJSON', 'stack')
	    , props = extend({ name: this.name }, this);

	  // include stack if exists and not turned off
	  if (false !== stack && this.stack) {
	    props.stack = this.stack;
	  }

	  return props;
	};

	/* !
	 * Chai - pathval utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * @see https://github.com/logicalparadox/filtr
	 * MIT Licensed
	 */

	/**
	 * ### .hasProperty(object, name)
	 *
	 * This allows checking whether an object has own
	 * or inherited from prototype chain named property.
	 *
	 * Basically does the same thing as the `in`
	 * operator but works properly with null/undefined values
	 * and other primitives.
	 *
	 *     var obj = {
	 *         arr: ['a', 'b', 'c']
	 *       , str: 'Hello'
	 *     }
	 *
	 * The following would be the results.
	 *
	 *     hasProperty(obj, 'str');  // true
	 *     hasProperty(obj, 'constructor');  // true
	 *     hasProperty(obj, 'bar');  // false
	 *
	 *     hasProperty(obj.str, 'length'); // true
	 *     hasProperty(obj.str, 1);  // true
	 *     hasProperty(obj.str, 5);  // false
	 *
	 *     hasProperty(obj.arr, 'length');  // true
	 *     hasProperty(obj.arr, 2);  // true
	 *     hasProperty(obj.arr, 3);  // false
	 *
	 * @param {Object} object
	 * @param {String|Symbol} name
	 * @returns {Boolean} whether it exists
	 * @namespace Utils
	 * @name hasProperty
	 * @api public
	 */

	function hasProperty(obj, name) {
	  if (typeof obj === 'undefined' || obj === null) {
	    return false;
	  }

	  // The `in` operator does not work with primitives.
	  return name in Object(obj);
	}

	/* !
	 * ## parsePath(path)
	 *
	 * Helper function used to parse string object
	 * paths. Use in conjunction with `internalGetPathValue`.
	 *
	 *      var parsed = parsePath('myobject.property.subprop');
	 *
	 * ### Paths:
	 *
	 * * Can be infinitely deep and nested.
	 * * Arrays are also valid using the formal `myobject.document[3].property`.
	 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
	 *
	 * @param {String} path
	 * @returns {Object} parsed
	 * @api private
	 */

	function parsePath(path) {
	  var str = path.replace(/([^\\])\[/g, '$1.[');
	  var parts = str.match(/(\\\.|[^.]+?)+/g);
	  return parts.map(function mapMatches(value) {
	    var regexp = /^\[(\d+)\]$/;
	    var mArr = regexp.exec(value);
	    var parsed = null;
	    if (mArr) {
	      parsed = { i: parseFloat(mArr[1]) };
	    } else {
	      parsed = { p: value.replace(/\\([.\[\]])/g, '$1') };
	    }

	    return parsed;
	  });
	}

	/* !
	 * ## internalGetPathValue(obj, parsed[, pathDepth])
	 *
	 * Helper companion function for `.parsePath` that returns
	 * the value located at the parsed address.
	 *
	 *      var value = getPathValue(obj, parsed);
	 *
	 * @param {Object} object to search against
	 * @param {Object} parsed definition from `parsePath`.
	 * @param {Number} depth (nesting level) of the property we want to retrieve
	 * @returns {Object|Undefined} value
	 * @api private
	 */

	function internalGetPathValue(obj, parsed, pathDepth) {
	  var temporaryValue = obj;
	  var res = null;
	  pathDepth = (typeof pathDepth === 'undefined' ? parsed.length : pathDepth);

	  for (var i = 0; i < pathDepth; i++) {
	    var part = parsed[i];
	    if (temporaryValue) {
	      if (typeof part.p === 'undefined') {
	        temporaryValue = temporaryValue[part.i];
	      } else {
	        temporaryValue = temporaryValue[part.p];
	      }

	      if (i === (pathDepth - 1)) {
	        res = temporaryValue;
	      }
	    }
	  }

	  return res;
	}

	/* !
	 * ## internalSetPathValue(obj, value, parsed)
	 *
	 * Companion function for `parsePath` that sets
	 * the value located at a parsed address.
	 *
	 *  internalSetPathValue(obj, 'value', parsed);
	 *
	 * @param {Object} object to search and define on
	 * @param {*} value to use upon set
	 * @param {Object} parsed definition from `parsePath`
	 * @api private
	 */

	function internalSetPathValue(obj, val, parsed) {
	  var tempObj = obj;
	  var pathDepth = parsed.length;
	  var part = null;
	  // Here we iterate through every part of the path
	  for (var i = 0; i < pathDepth; i++) {
	    var propName = null;
	    var propVal = null;
	    part = parsed[i];

	    // If it's the last part of the path, we set the 'propName' value with the property name
	    if (i === (pathDepth - 1)) {
	      propName = typeof part.p === 'undefined' ? part.i : part.p;
	      // Now we set the property with the name held by 'propName' on object with the desired val
	      tempObj[propName] = val;
	    } else if (typeof part.p !== 'undefined' && tempObj[part.p]) {
	      tempObj = tempObj[part.p];
	    } else if (typeof part.i !== 'undefined' && tempObj[part.i]) {
	      tempObj = tempObj[part.i];
	    } else {
	      // If the obj doesn't have the property we create one with that name to define it
	      var next = parsed[i + 1];
	      // Here we set the name of the property which will be defined
	      propName = typeof part.p === 'undefined' ? part.i : part.p;
	      // Here we decide if this property will be an array or a new object
	      propVal = typeof next.p === 'undefined' ? [] : {};
	      tempObj[propName] = propVal;
	      tempObj = tempObj[propName];
	    }
	  }
	}

	/**
	 * ### .getPathInfo(object, path)
	 *
	 * This allows the retrieval of property info in an
	 * object given a string path.
	 *
	 * The path info consists of an object with the
	 * following properties:
	 *
	 * * parent - The parent object of the property referenced by `path`
	 * * name - The name of the final property, a number if it was an array indexer
	 * * value - The value of the property, if it exists, otherwise `undefined`
	 * * exists - Whether the property exists or not
	 *
	 * @param {Object} object
	 * @param {String} path
	 * @returns {Object} info
	 * @namespace Utils
	 * @name getPathInfo
	 * @api public
	 */

	function getPathInfo(obj, path) {
	  var parsed = parsePath(path);
	  var last = parsed[parsed.length - 1];
	  var info = {
	    parent: parsed.length > 1 ? internalGetPathValue(obj, parsed, parsed.length - 1) : obj,
	    name: last.p || last.i,
	    value: internalGetPathValue(obj, parsed),
	  };
	  info.exists = hasProperty(info.parent, info.name);

	  return info;
	}

	/**
	 * ### .getPathValue(object, path)
	 *
	 * This allows the retrieval of values in an
	 * object given a string path.
	 *
	 *     var obj = {
	 *         prop1: {
	 *             arr: ['a', 'b', 'c']
	 *           , str: 'Hello'
	 *         }
	 *       , prop2: {
	 *             arr: [ { nested: 'Universe' } ]
	 *           , str: 'Hello again!'
	 *         }
	 *     }
	 *
	 * The following would be the results.
	 *
	 *     getPathValue(obj, 'prop1.str'); // Hello
	 *     getPathValue(obj, 'prop1.att[2]'); // b
	 *     getPathValue(obj, 'prop2.arr[0].nested'); // Universe
	 *
	 * @param {Object} object
	 * @param {String} path
	 * @returns {Object} value or `undefined`
	 * @namespace Utils
	 * @name getPathValue
	 * @api public
	 */

	function getPathValue(obj, path) {
	  var info = getPathInfo(obj, path);
	  return info.value;
	}

	/**
	 * ### .setPathValue(object, path, value)
	 *
	 * Define the value in an object at a given string path.
	 *
	 * ```js
	 * var obj = {
	 *     prop1: {
	 *         arr: ['a', 'b', 'c']
	 *       , str: 'Hello'
	 *     }
	 *   , prop2: {
	 *         arr: [ { nested: 'Universe' } ]
	 *       , str: 'Hello again!'
	 *     }
	 * };
	 * ```
	 *
	 * The following would be acceptable.
	 *
	 * ```js
	 * var properties = require('tea-properties');
	 * properties.set(obj, 'prop1.str', 'Hello Universe!');
	 * properties.set(obj, 'prop1.arr[2]', 'B');
	 * properties.set(obj, 'prop2.arr[0].nested.value', { hello: 'universe' });
	 * ```
	 *
	 * @param {Object} object
	 * @param {String} path
	 * @param {Mixed} value
	 * @api private
	 */

	function setPathValue(obj, path, val) {
	  var parsed = parsePath(path);
	  internalSetPathValue(obj, val, parsed);
	  return obj;
	}

	var pathval = {
	  hasProperty: hasProperty,
	  getPathInfo: getPathInfo,
	  getPathValue: getPathValue,
	  setPathValue: setPathValue,
	};

	/*!
	 * Chai - flag utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	/**
	 * ### .flag(object, key, [value])
	 *
	 * Get or set a flag value on an object. If a
	 * value is provided it will be set, else it will
	 * return the currently set value or `undefined` if
	 * the value is not set.
	 *
	 *     utils.flag(this, 'foo', 'bar'); // setter
	 *     utils.flag(this, 'foo'); // getter, returns `bar`
	 *
	 * @param {Object} object constructed Assertion
	 * @param {String} key
	 * @param {Mixed} value (optional)
	 * @namespace Utils
	 * @name flag
	 * @api private
	 */

	var flag = function flag(obj, key, value) {
	  var flags = obj.__flags || (obj.__flags = Object.create(null));
	  if (arguments.length === 3) {
	    flags[key] = value;
	  } else {
	    return flags[key];
	  }
	};

	/*!
	 * Chai - test utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Module dependencies
	 */



	/**
	 * ### .test(object, expression)
	 *
	 * Test and object for expression.
	 *
	 * @param {Object} object (constructed Assertion)
	 * @param {Arguments} chai.Assertion.prototype.assert arguments
	 * @namespace Utils
	 * @name test
	 */

	var test = function test(obj, args) {
	  var negate = flag(obj, 'negate')
	    , expr = args[0];
	  return negate ? !expr : expr;
	};

	var typeDetect = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
		 module.exports = factory() ;
	}(commonjsGlobal, (function () {
	/* !
	 * type-detect
	 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var promiseExists = typeof Promise === 'function';

	/* eslint-disable no-undef */
	var globalObject = typeof self === 'object' ? self : commonjsGlobal; // eslint-disable-line id-blacklist

	var symbolExists = typeof Symbol !== 'undefined';
	var mapExists = typeof Map !== 'undefined';
	var setExists = typeof Set !== 'undefined';
	var weakMapExists = typeof WeakMap !== 'undefined';
	var weakSetExists = typeof WeakSet !== 'undefined';
	var dataViewExists = typeof DataView !== 'undefined';
	var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
	var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
	var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
	var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
	var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
	var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
	var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
	var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
	var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
	var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
	var toStringLeftSliceLength = 8;
	var toStringRightSliceLength = -1;
	/**
	 * ### typeOf (obj)
	 *
	 * Uses `Object.prototype.toString` to determine the type of an object,
	 * normalising behaviour across engine versions & well optimised.
	 *
	 * @param {Mixed} object
	 * @return {String} object type
	 * @api public
	 */
	function typeDetect(obj) {
	  /* ! Speed optimisation
	   * Pre:
	   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
	   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
	   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
	   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
	   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
	   * Post:
	   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
	   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
	   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
	   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
	   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
	   */
	  var typeofObj = typeof obj;
	  if (typeofObj !== 'object') {
	    return typeofObj;
	  }

	  /* ! Speed optimisation
	   * Pre:
	   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
	   * Post:
	   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
	   */
	  if (obj === null) {
	    return 'null';
	  }

	  /* ! Spec Conformance
	   * Test: `Object.prototype.toString.call(window)``
	   *  - Node === "[object global]"
	   *  - Chrome === "[object global]"
	   *  - Firefox === "[object Window]"
	   *  - PhantomJS === "[object Window]"
	   *  - Safari === "[object Window]"
	   *  - IE 11 === "[object Window]"
	   *  - IE Edge === "[object Window]"
	   * Test: `Object.prototype.toString.call(this)``
	   *  - Chrome Worker === "[object global]"
	   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
	   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
	   *  - IE 11 Worker === "[object WorkerGlobalScope]"
	   *  - IE Edge Worker === "[object WorkerGlobalScope]"
	   */
	  if (obj === globalObject) {
	    return 'global';
	  }

	  /* ! Speed optimisation
	   * Pre:
	   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
	   * Post:
	   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
	   */
	  if (
	    Array.isArray(obj) &&
	    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
	  ) {
	    return 'Array';
	  }

	  // Not caching existence of `window` and related properties due to potential
	  // for `window` to be unset before tests in quasi-browser environments.
	  if (typeof window === 'object' && window !== null) {
	    /* ! Spec Conformance
	     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
	     * WhatWG HTML$7.7.3 - The `Location` interface
	     * Test: `Object.prototype.toString.call(window.location)``
	     *  - IE <=11 === "[object Object]"
	     *  - IE Edge <=13 === "[object Object]"
	     */
	    if (typeof window.location === 'object' && obj === window.location) {
	      return 'Location';
	    }

	    /* ! Spec Conformance
	     * (https://html.spec.whatwg.org/#document)
	     * WhatWG HTML$3.1.1 - The `Document` object
	     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
	     *       which suggests that browsers should use HTMLTableCellElement for
	     *       both TD and TH elements. WhatWG separates these.
	     *       WhatWG HTML states:
	     *         > For historical reasons, Window objects must also have a
	     *         > writable, configurable, non-enumerable property named
	     *         > HTMLDocument whose value is the Document interface object.
	     * Test: `Object.prototype.toString.call(document)``
	     *  - Chrome === "[object HTMLDocument]"
	     *  - Firefox === "[object HTMLDocument]"
	     *  - Safari === "[object HTMLDocument]"
	     *  - IE <=10 === "[object Document]"
	     *  - IE 11 === "[object HTMLDocument]"
	     *  - IE Edge <=13 === "[object HTMLDocument]"
	     */
	    if (typeof window.document === 'object' && obj === window.document) {
	      return 'Document';
	    }

	    if (typeof window.navigator === 'object') {
	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
	       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
	       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
	       *  - IE <=10 === "[object MSMimeTypesCollection]"
	       */
	      if (typeof window.navigator.mimeTypes === 'object' &&
	          obj === window.navigator.mimeTypes) {
	        return 'MimeTypeArray';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
	       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
	       * Test: `Object.prototype.toString.call(navigator.plugins)``
	       *  - IE <=10 === "[object MSPluginsCollection]"
	       */
	      if (typeof window.navigator.plugins === 'object' &&
	          obj === window.navigator.plugins) {
	        return 'PluginArray';
	      }
	    }

	    if ((typeof window.HTMLElement === 'function' ||
	        typeof window.HTMLElement === 'object') &&
	        obj instanceof window.HTMLElement) {
	      /* ! Spec Conformance
	      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
	      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
	      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
	      *  - IE <=10 === "[object HTMLBlockElement]"
	      */
	      if (obj.tagName === 'BLOCKQUOTE') {
	        return 'HTMLQuoteElement';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
	       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
	       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
	       *       which suggests that browsers should use HTMLTableCellElement for
	       *       both TD and TH elements. WhatWG separates these.
	       * Test: Object.prototype.toString.call(document.createElement('td'))
	       *  - Chrome === "[object HTMLTableCellElement]"
	       *  - Firefox === "[object HTMLTableCellElement]"
	       *  - Safari === "[object HTMLTableCellElement]"
	       */
	      if (obj.tagName === 'TD') {
	        return 'HTMLTableDataCellElement';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
	       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
	       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
	       *       which suggests that browsers should use HTMLTableCellElement for
	       *       both TD and TH elements. WhatWG separates these.
	       * Test: Object.prototype.toString.call(document.createElement('th'))
	       *  - Chrome === "[object HTMLTableCellElement]"
	       *  - Firefox === "[object HTMLTableCellElement]"
	       *  - Safari === "[object HTMLTableCellElement]"
	       */
	      if (obj.tagName === 'TH') {
	        return 'HTMLTableHeaderCellElement';
	      }
	    }
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
	  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
	  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
	  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
	  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
	  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
	  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
	  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
	  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
	  * Post:
	  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
	  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
	  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
	  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
	  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
	  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
	  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
	  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
	  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
	  */
	  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
	  if (typeof stringTag === 'string') {
	    return stringTag;
	  }

	  var objPrototype = Object.getPrototypeOf(obj);
	  /* ! Speed optimisation
	  * Pre:
	  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
	  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
	  * Post:
	  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
	  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
	  */
	  if (objPrototype === RegExp.prototype) {
	    return 'RegExp';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
	  * Post:
	  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
	  */
	  if (objPrototype === Date.prototype) {
	    return 'Date';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
	   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
	   * Test: `Object.prototype.toString.call(Promise.resolve())``
	   *  - Chrome <=47 === "[object Object]"
	   *  - Edge <=20 === "[object Object]"
	   *  - Firefox 29-Latest === "[object Promise]"
	   *  - Safari 7.1-Latest === "[object Promise]"
	   */
	  if (promiseExists && objPrototype === Promise.prototype) {
	    return 'Promise';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
	  * Post:
	  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
	  */
	  if (setExists && objPrototype === Set.prototype) {
	    return 'Set';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
	  * Post:
	  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
	  */
	  if (mapExists && objPrototype === Map.prototype) {
	    return 'Map';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
	  * Post:
	  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
	  */
	  if (weakSetExists && objPrototype === WeakSet.prototype) {
	    return 'WeakSet';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
	  * Post:
	  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
	  */
	  if (weakMapExists && objPrototype === WeakMap.prototype) {
	    return 'WeakMap';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
	   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
	   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (dataViewExists && objPrototype === DataView.prototype) {
	    return 'DataView';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
	   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
	   * Test: `Object.prototype.toString.call(new Map().entries())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (mapExists && objPrototype === mapIteratorPrototype) {
	    return 'Map Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
	   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
	   * Test: `Object.prototype.toString.call(new Set().entries())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (setExists && objPrototype === setIteratorPrototype) {
	    return 'Set Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
	   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
	   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
	    return 'Array Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
	   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
	   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
	    return 'String Iterator';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
	  * Post:
	  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
	  */
	  if (objPrototype === null) {
	    return 'Object';
	  }

	  return Object
	    .prototype
	    .toString
	    .call(obj)
	    .slice(toStringLeftSliceLength, toStringRightSliceLength);
	}

	return typeDetect;

	})));
	});

	/*!
	 * Chai - expectTypes utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .expectTypes(obj, types)
	 *
	 * Ensures that the object being tested against is of a valid type.
	 *
	 *     utils.expectTypes(this, ['array', 'object', 'string']);
	 *
	 * @param {Mixed} obj constructed Assertion
	 * @param {Array} type A list of allowed types for this assertion
	 * @namespace Utils
	 * @name expectTypes
	 * @api public
	 */





	var expectTypes = function expectTypes(obj, types) {
	  var flagMsg = flag(obj, 'message');
	  var ssfi = flag(obj, 'ssfi');

	  flagMsg = flagMsg ? flagMsg + ': ' : '';

	  obj = flag(obj, 'object');
	  types = types.map(function (t) { return t.toLowerCase(); });
	  types.sort();

	  // Transforms ['lorem', 'ipsum'] into 'a lorem, or an ipsum'
	  var str = types.map(function (t, index) {
	    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
	    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
	    return or + art + ' ' + t;
	  }).join(', ');

	  var objType = typeDetect(obj).toLowerCase();

	  if (!types.some(function (expected) { return objType === expected; })) {
	    throw new assertionError(
	      flagMsg + 'object tested must be ' + str + ', but ' + objType + ' given',
	      undefined,
	      ssfi
	    );
	  }
	};

	/*!
	 * Chai - getActual utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	/**
	 * ### .getActual(object, [actual])
	 *
	 * Returns the `actual` value for an Assertion.
	 *
	 * @param {Object} object (constructed Assertion)
	 * @param {Arguments} chai.Assertion.prototype.assert arguments
	 * @namespace Utils
	 * @name getActual
	 */

	var getActual = function getActual(obj, args) {
	  return args.length > 4 ? args[4] : obj._obj;
	};

	/* !
	 * Chai - getFuncName utility
	 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .getFuncName(constructorFn)
	 *
	 * Returns the name of a function.
	 * When a non-function instance is passed, returns `null`.
	 * This also includes a polyfill function if `aFunc.name` is not defined.
	 *
	 * @name getFuncName
	 * @param {Function} funct
	 * @namespace Utils
	 * @api public
	 */

	var toString = Function.prototype.toString;
	var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
	function getFuncName(aFunc) {
	  if (typeof aFunc !== 'function') {
	    return null;
	  }

	  var name = '';
	  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
	    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
	    var match = toString.call(aFunc).match(functionNameMatch);
	    if (match) {
	      name = match[1];
	    }
	  } else {
	    // If we've got a `name` property we just use it
	    name = aFunc.name;
	  }

	  return name;
	}

	var getFuncName_1 = getFuncName;

	/*!
	 * Chai - getProperties utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	/**
	 * ### .getProperties(object)
	 *
	 * This allows the retrieval of property names of an object, enumerable or not,
	 * inherited or not.
	 *
	 * @param {Object} object
	 * @returns {Array}
	 * @namespace Utils
	 * @name getProperties
	 * @api public
	 */

	var getProperties = function getProperties(object) {
	  var result = Object.getOwnPropertyNames(object);

	  function addProperty(property) {
	    if (result.indexOf(property) === -1) {
	      result.push(property);
	    }
	  }

	  var proto = Object.getPrototypeOf(object);
	  while (proto !== null) {
	    Object.getOwnPropertyNames(proto).forEach(addProperty);
	    proto = Object.getPrototypeOf(proto);
	  }

	  return result;
	};

	/*!
	 * Chai - getEnumerableProperties utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	/**
	 * ### .getEnumerableProperties(object)
	 *
	 * This allows the retrieval of enumerable property names of an object,
	 * inherited or not.
	 *
	 * @param {Object} object
	 * @returns {Array}
	 * @namespace Utils
	 * @name getEnumerableProperties
	 * @api public
	 */

	var getEnumerableProperties = function getEnumerableProperties(object) {
	  var result = [];
	  for (var name in object) {
	    result.push(name);
	  }
	  return result;
	};

	var config = {

	  /**
	   * ### config.includeStack
	   *
	   * User configurable property, influences whether stack trace
	   * is included in Assertion error message. Default of false
	   * suppresses stack trace in the error message.
	   *
	   *     chai.config.includeStack = true;  // enable stack on error
	   *
	   * @param {Boolean}
	   * @api public
	   */

	  includeStack: false,

	  /**
	   * ### config.showDiff
	   *
	   * User configurable property, influences whether or not
	   * the `showDiff` flag should be included in the thrown
	   * AssertionErrors. `false` will always be `false`; `true`
	   * will be true when the assertion has requested a diff
	   * be shown.
	   *
	   * @param {Boolean}
	   * @api public
	   */

	  showDiff: true,

	  /**
	   * ### config.truncateThreshold
	   *
	   * User configurable property, sets length threshold for actual and
	   * expected values in assertion errors. If this threshold is exceeded, for
	   * example for large data structures, the value is replaced with something
	   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
	   *
	   * Set it to zero if you want to disable truncating altogether.
	   *
	   * This is especially userful when doing assertions on arrays: having this
	   * set to a reasonable large value makes the failure messages readily
	   * inspectable.
	   *
	   *     chai.config.truncateThreshold = 0;  // disable truncating
	   *
	   * @param {Number}
	   * @api public
	   */

	  truncateThreshold: 40,

	  /**
	   * ### config.useProxy
	   *
	   * User configurable property, defines if chai will use a Proxy to throw
	   * an error when a non-existent property is read, which protects users
	   * from typos when using property-based assertions.
	   *
	   * Set it to false if you want to disable this feature.
	   *
	   *     chai.config.useProxy = false;  // disable use of Proxy
	   *
	   * This feature is automatically disabled regardless of this config value
	   * in environments that don't support proxies.
	   *
	   * @param {Boolean}
	   * @api public
	   */

	  useProxy: true,

	  /**
	   * ### config.proxyExcludedKeys
	   *
	   * User configurable property, defines which properties should be ignored
	   * instead of throwing an error if they do not exist on the assertion.
	   * This is only applied if the environment Chai is running in supports proxies and
	   * if the `useProxy` configuration setting is enabled.
	   * By default, `then` and `inspect` will not throw an error if they do not exist on the
	   * assertion object because the `.inspect` property is read by `util.inspect` (for example, when
	   * using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
	   *
	   *     // By default these keys will not throw an error if they do not exist on the assertion object
	   *     chai.config.proxyExcludedKeys = ['then', 'inspect'];
	   *
	   * @param {Array}
	   * @api public
	   */

	  proxyExcludedKeys: ['then', 'catch', 'inspect', 'toJSON']
	};

	var inspect_1 = createCommonjsModule(function (module, exports) {
	// This is (almost) directly from Node.js utils
	// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js






	module.exports = inspect;

	/**
	 * ### .inspect(obj, [showHidden], [depth], [colors])
	 *
	 * Echoes the value of a value. Tries to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
	 *    properties of objects. Default is false.
	 * @param {Number} depth Depth in which to descend in object. Default is 2.
	 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
	 *    output. Default is false (no coloring).
	 * @namespace Utils
	 * @name inspect
	 */
	function inspect(obj, showHidden, depth, colors) {
	  var ctx = {
	    showHidden: showHidden,
	    seen: [],
	    stylize: function (str) { return str; }
	  };
	  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
	}

	// Returns true if object is a DOM element.
	var isDOMElement = function (object) {
	  if (typeof HTMLElement === 'object') {
	    return object instanceof HTMLElement;
	  } else {
	    return object &&
	      typeof object === 'object' &&
	      'nodeType' in object &&
	      object.nodeType === 1 &&
	      typeof object.nodeName === 'string';
	  }
	};

	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (value && typeof value.inspect === 'function' &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (typeof ret !== 'string') {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // If this is a DOM element, try to get the outer HTML.
	  if (isDOMElement(value)) {
	    if ('outerHTML' in value) {
	      return value.outerHTML;
	      // This value does not have an outerHTML attribute,
	      //   it could still be an XML element
	    } else {
	      // Attempt to serialize it
	      try {
	        if (document.xmlVersion) {
	          var xmlSerializer = new XMLSerializer();
	          return xmlSerializer.serializeToString(value);
	        } else {
	          // Firefox 11- do not support outerHTML
	          //   It does, however, support innerHTML
	          //   Use the following to render the element
	          var ns = "http://www.w3.org/1999/xhtml";
	          var container = document.createElementNS(ns, '_');

	          container.appendChild(value.cloneNode(false));
	          var html = container.innerHTML
	            .replace('><', '>' + value.innerHTML + '<');
	          container.innerHTML = '';
	          return html;
	        }
	      } catch (err) {
	        // This could be a non-native DOM implementation,
	        //   continue with the normal flow:
	        //   printing the element as if it is an object.
	      }
	    }
	  }

	  // Look up the keys of the object.
	  var visibleKeys = getEnumerableProperties(value);
	  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

	  var name, nameSuffix;

	  // Some type of object without properties can be shortcut.
	  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
	  // a `stack` plus `description` property; ignore those for consistency.
	  if (keys.length === 0 || (isError(value) && (
	      (keys.length === 1 && keys[0] === 'stack') ||
	      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
	     ))) {
	    if (typeof value === 'function') {
	      name = getFuncName_1(value);
	      nameSuffix = name ? ': ' + name : '';
	      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = ''
	    , array = false
	    , typedArray = false
	    , braces = ['{', '}'];

	  if (isTypedArray(value)) {
	    typedArray = true;
	    braces = ['[', ']'];
	  }

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (typeof value === 'function') {
	    name = getFuncName_1(value);
	    nameSuffix = name ? ': ' + name : '';
	    base = ' [Function' + nameSuffix + ']';
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
	    return formatError(value);
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
	  } else if (typedArray) {
	    return formatTypedArray(value);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}

	function formatPrimitive(ctx, value) {
	  switch (typeof value) {
	    case 'undefined':
	      return ctx.stylize('undefined', 'undefined');

	    case 'string':
	      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                               .replace(/'/g, "\\'")
	                                               .replace(/\\"/g, '"') + '\'';
	      return ctx.stylize(simple, 'string');

	    case 'number':
	      if (value === 0 && (1/value) === -Infinity) {
	        return ctx.stylize('-0', 'number');
	      }
	      return ctx.stylize('' + value, 'number');

	    case 'boolean':
	      return ctx.stylize('' + value, 'boolean');

	    case 'symbol':
	      return ctx.stylize(value.toString(), 'symbol');
	  }
	  // For some reason typeof null is "object", so special case here.
	  if (value === null) {
	    return ctx.stylize('null', 'null');
	  }
	}

	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}

	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
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

	function formatTypedArray(value) {
	  var str = '[ ';

	  for (var i = 0; i < value.length; ++i) {
	    if (str.length >= config.truncateThreshold - 7) {
	      str += '...';
	      break;
	    }
	    str += value[i] + ', ';
	  }
	  str += ' ]';

	  // Removing trailing `, ` if the array was not truncated
	  if (str.indexOf(',  ]') !== -1) {
	    str = str.replace(',  ]', ' ]');
	  }

	  return str;
	}

	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name;
	  var propDescriptor = Object.getOwnPropertyDescriptor(value, key);
	  var str;

	  if (propDescriptor) {
	    if (propDescriptor.get) {
	      if (propDescriptor.set) {
	        str = ctx.stylize('[Getter/Setter]', 'special');
	      } else {
	        str = ctx.stylize('[Getter]', 'special');
	      }
	    } else {
	      if (propDescriptor.set) {
	        str = ctx.stylize('[Setter]', 'special');
	      }
	    }
	  }
	  if (visibleKeys.indexOf(key) < 0) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(value[key]) < 0) {
	      if (recurseTimes === null) {
	        str = formatValue(ctx, value[key], null);
	      } else {
	        str = formatValue(ctx, value[key], recurseTimes - 1);
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
	  if (typeof name === 'undefined') {
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
	  var length = output.reduce(function(prev, cur) {
	    return prev + cur.length + 1;
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

	function isTypedArray(ar) {
	  // Unfortunately there's no way to check if an object is a TypedArray
	  // We have to check if it's one of these types
	  return (typeof ar === 'object' && /\w+Array]$/.test(objectToString(ar)));
	}

	function isArray(ar) {
	  return Array.isArray(ar) ||
	         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
	}

	function isRegExp(re) {
	  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
	}

	function isDate(d) {
	  return typeof d === 'object' && objectToString(d) === '[object Date]';
	}

	function isError(e) {
	  return typeof e === 'object' && objectToString(e) === '[object Error]';
	}

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	});

	/*!
	 * Chai - flag utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Module dependencies
	 */




	/**
	 * ### .objDisplay(object)
	 *
	 * Determines if an object or an array matches
	 * criteria to be inspected in-line for error
	 * messages or should be truncated.
	 *
	 * @param {Mixed} javascript object to inspect
	 * @name objDisplay
	 * @namespace Utils
	 * @api public
	 */

	var objDisplay = function objDisplay(obj) {
	  var str = inspect_1(obj)
	    , type = Object.prototype.toString.call(obj);

	  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
	    if (type === '[object Function]') {
	      return !obj.name || obj.name === ''
	        ? '[Function]'
	        : '[Function: ' + obj.name + ']';
	    } else if (type === '[object Array]') {
	      return '[ Array(' + obj.length + ') ]';
	    } else if (type === '[object Object]') {
	      var keys = Object.keys(obj)
	        , kstr = keys.length > 2
	          ? keys.splice(0, 2).join(', ') + ', ...'
	          : keys.join(', ');
	      return '{ Object (' + kstr + ') }';
	    } else {
	      return str;
	    }
	  } else {
	    return str;
	  }
	};

	/*!
	 * Chai - message composition utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Module dependencies
	 */



	/**
	 * ### .getMessage(object, message, negateMessage)
	 *
	 * Construct the error message based on flags
	 * and template tags. Template tags will return
	 * a stringified inspection of the object referenced.
	 *
	 * Message template tags:
	 * - `#{this}` current asserted object
	 * - `#{act}` actual value
	 * - `#{exp}` expected value
	 *
	 * @param {Object} object (constructed Assertion)
	 * @param {Arguments} chai.Assertion.prototype.assert arguments
	 * @namespace Utils
	 * @name getMessage
	 * @api public
	 */

	var getMessage = function getMessage(obj, args) {
	  var negate = flag(obj, 'negate')
	    , val = flag(obj, 'object')
	    , expected = args[3]
	    , actual = getActual(obj, args)
	    , msg = negate ? args[2] : args[1]
	    , flagMsg = flag(obj, 'message');

	  if(typeof msg === "function") msg = msg();
	  msg = msg || '';
	  msg = msg
	    .replace(/#\{this\}/g, function () { return objDisplay(val); })
	    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
	    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

	  return flagMsg ? flagMsg + ': ' + msg : msg;
	};

	/*!
	 * Chai - transferFlags utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	/**
	 * ### .transferFlags(assertion, object, includeAll = true)
	 *
	 * Transfer all the flags for `assertion` to `object`. If
	 * `includeAll` is set to `false`, then the base Chai
	 * assertion flags (namely `object`, `ssfi`, `lockSsfi`,
	 * and `message`) will not be transferred.
	 *
	 *
	 *     var newAssertion = new Assertion();
	 *     utils.transferFlags(assertion, newAssertion);
	 *
	 *     var anotherAssertion = new Assertion(myObj);
	 *     utils.transferFlags(assertion, anotherAssertion, false);
	 *
	 * @param {Assertion} assertion the assertion to transfer the flags from
	 * @param {Object} object the object to transfer the flags to; usually a new assertion
	 * @param {Boolean} includeAll
	 * @namespace Utils
	 * @name transferFlags
	 * @api private
	 */

	var transferFlags = function transferFlags(assertion, object, includeAll) {
	  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

	  if (!object.__flags) {
	    object.__flags = Object.create(null);
	  }

	  includeAll = arguments.length === 3 ? includeAll : true;

	  for (var flag in flags) {
	    if (includeAll ||
	        (flag !== 'object' && flag !== 'ssfi' && flag !== 'lockSsfi' && flag != 'message')) {
	      object.__flags[flag] = flags[flag];
	    }
	  }
	};

	/* globals Symbol: false, Uint8Array: false, WeakMap: false */
	/*!
	 * deep-eql
	 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */


	function FakeMap() {
	  this._key = 'chai/deep-eql__' + Math.random() + Date.now();
	}

	FakeMap.prototype = {
	  get: function getMap(key) {
	    return key[this._key];
	  },
	  set: function setMap(key, value) {
	    if (Object.isExtensible(key)) {
	      Object.defineProperty(key, this._key, {
	        value: value,
	        configurable: true,
	      });
	    }
	  },
	};

	var MemoizeMap = typeof WeakMap === 'function' ? WeakMap : FakeMap;
	/*!
	 * Check to see if the MemoizeMap has recorded a result of the two operands
	 *
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @param {MemoizeMap} memoizeMap
	 * @returns {Boolean|null} result
	*/
	function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
	  // Technically, WeakMap keys can *only* be objects, not primitives.
	  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
	    return null;
	  }
	  var leftHandMap = memoizeMap.get(leftHandOperand);
	  if (leftHandMap) {
	    var result = leftHandMap.get(rightHandOperand);
	    if (typeof result === 'boolean') {
	      return result;
	    }
	  }
	  return null;
	}

	/*!
	 * Set the result of the equality into the MemoizeMap
	 *
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @param {MemoizeMap} memoizeMap
	 * @param {Boolean} result
	*/
	function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
	  // Technically, WeakMap keys can *only* be objects, not primitives.
	  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
	    return;
	  }
	  var leftHandMap = memoizeMap.get(leftHandOperand);
	  if (leftHandMap) {
	    leftHandMap.set(rightHandOperand, result);
	  } else {
	    leftHandMap = new MemoizeMap();
	    leftHandMap.set(rightHandOperand, result);
	    memoizeMap.set(leftHandOperand, leftHandMap);
	  }
	}

	/*!
	 * Primary Export
	 */

	var deepEql = deepEqual;
	var MemoizeMap_1 = MemoizeMap;

	/**
	 * Assert deeply nested sameValue equality between two objects of any type.
	 *
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @param {Object} [options] (optional) Additional options
	 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
	 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
	    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
	    references to blow the stack.
	 * @return {Boolean} equal match
	 */
	function deepEqual(leftHandOperand, rightHandOperand, options) {
	  // If we have a comparator, we can't assume anything; so bail to its check first.
	  if (options && options.comparator) {
	    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
	  }

	  var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
	  if (simpleResult !== null) {
	    return simpleResult;
	  }

	  // Deeper comparisons are pushed through to a larger function
	  return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
	}

	/**
	 * Many comparisons can be canceled out early via simple equality or primitive checks.
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @return {Boolean|null} equal match
	 */
	function simpleEqual(leftHandOperand, rightHandOperand) {
	  // Equal references (except for Numbers) can be returned early
	  if (leftHandOperand === rightHandOperand) {
	    // Handle +-0 cases
	    return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
	  }

	  // handle NaN cases
	  if (
	    leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
	    rightHandOperand !== rightHandOperand // eslint-disable-line no-self-compare
	  ) {
	    return true;
	  }

	  // Anything that is not an 'object', i.e. symbols, functions, booleans, numbers,
	  // strings, and undefined, can be compared by reference.
	  if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
	    // Easy out b/c it would have passed the first equality check
	    return false;
	  }
	  return null;
	}

	/*!
	 * The main logic of the `deepEqual` function.
	 *
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @param {Object} [options] (optional) Additional options
	 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
	 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
	    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
	    references to blow the stack.
	 * @return {Boolean} equal match
	*/
	function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
	  options = options || {};
	  options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
	  var comparator = options && options.comparator;

	  // Check if a memoized result exists.
	  var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
	  if (memoizeResultLeft !== null) {
	    return memoizeResultLeft;
	  }
	  var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
	  if (memoizeResultRight !== null) {
	    return memoizeResultRight;
	  }

	  // If a comparator is present, use it.
	  if (comparator) {
	    var comparatorResult = comparator(leftHandOperand, rightHandOperand);
	    // Comparators may return null, in which case we want to go back to default behavior.
	    if (comparatorResult === false || comparatorResult === true) {
	      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
	      return comparatorResult;
	    }
	    // To allow comparators to override *any* behavior, we ran them first. Since it didn't decide
	    // what to do, we need to make sure to return the basic tests first before we move on.
	    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
	    if (simpleResult !== null) {
	      // Don't memoize this, it takes longer to set/retrieve than to just compare.
	      return simpleResult;
	    }
	  }

	  var leftHandType = typeDetect(leftHandOperand);
	  if (leftHandType !== typeDetect(rightHandOperand)) {
	    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
	    return false;
	  }

	  // Temporarily set the operands in the memoize object to prevent blowing the stack
	  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);

	  var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
	  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
	  return result;
	}

	function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
	  switch (leftHandType) {
	    case 'String':
	    case 'Number':
	    case 'Boolean':
	    case 'Date':
	      // If these types are their instance types (e.g. `new Number`) then re-deepEqual against their values
	      return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
	    case 'Promise':
	    case 'Symbol':
	    case 'function':
	    case 'WeakMap':
	    case 'WeakSet':
	    case 'Error':
	      return leftHandOperand === rightHandOperand;
	    case 'Arguments':
	    case 'Int8Array':
	    case 'Uint8Array':
	    case 'Uint8ClampedArray':
	    case 'Int16Array':
	    case 'Uint16Array':
	    case 'Int32Array':
	    case 'Uint32Array':
	    case 'Float32Array':
	    case 'Float64Array':
	    case 'Array':
	      return iterableEqual(leftHandOperand, rightHandOperand, options);
	    case 'RegExp':
	      return regexpEqual(leftHandOperand, rightHandOperand);
	    case 'Generator':
	      return generatorEqual(leftHandOperand, rightHandOperand, options);
	    case 'DataView':
	      return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
	    case 'ArrayBuffer':
	      return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
	    case 'Set':
	      return entriesEqual(leftHandOperand, rightHandOperand, options);
	    case 'Map':
	      return entriesEqual(leftHandOperand, rightHandOperand, options);
	    default:
	      return objectEqual(leftHandOperand, rightHandOperand, options);
	  }
	}

	/*!
	 * Compare two Regular Expressions for equality.
	 *
	 * @param {RegExp} leftHandOperand
	 * @param {RegExp} rightHandOperand
	 * @return {Boolean} result
	 */

	function regexpEqual(leftHandOperand, rightHandOperand) {
	  return leftHandOperand.toString() === rightHandOperand.toString();
	}

	/*!
	 * Compare two Sets/Maps for equality. Faster than other equality functions.
	 *
	 * @param {Set} leftHandOperand
	 * @param {Set} rightHandOperand
	 * @param {Object} [options] (Optional)
	 * @return {Boolean} result
	 */

	function entriesEqual(leftHandOperand, rightHandOperand, options) {
	  // IE11 doesn't support Set#entries or Set#@@iterator, so we need manually populate using Set#forEach
	  if (leftHandOperand.size !== rightHandOperand.size) {
	    return false;
	  }
	  if (leftHandOperand.size === 0) {
	    return true;
	  }
	  var leftHandItems = [];
	  var rightHandItems = [];
	  leftHandOperand.forEach(function gatherEntries(key, value) {
	    leftHandItems.push([ key, value ]);
	  });
	  rightHandOperand.forEach(function gatherEntries(key, value) {
	    rightHandItems.push([ key, value ]);
	  });
	  return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
	}

	/*!
	 * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
	 *
	 * @param {Iterable} leftHandOperand
	 * @param {Iterable} rightHandOperand
	 * @param {Object} [options] (Optional)
	 * @return {Boolean} result
	 */

	function iterableEqual(leftHandOperand, rightHandOperand, options) {
	  var length = leftHandOperand.length;
	  if (length !== rightHandOperand.length) {
	    return false;
	  }
	  if (length === 0) {
	    return true;
	  }
	  var index = -1;
	  while (++index < length) {
	    if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
	      return false;
	    }
	  }
	  return true;
	}

	/*!
	 * Simple equality for generator objects such as those returned by generator functions.
	 *
	 * @param {Iterable} leftHandOperand
	 * @param {Iterable} rightHandOperand
	 * @param {Object} [options] (Optional)
	 * @return {Boolean} result
	 */

	function generatorEqual(leftHandOperand, rightHandOperand, options) {
	  return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
	}

	/*!
	 * Determine if the given object has an @@iterator function.
	 *
	 * @param {Object} target
	 * @return {Boolean} `true` if the object has an @@iterator function.
	 */
	function hasIteratorFunction(target) {
	  return typeof Symbol !== 'undefined' &&
	    typeof target === 'object' &&
	    typeof Symbol.iterator !== 'undefined' &&
	    typeof target[Symbol.iterator] === 'function';
	}

	/*!
	 * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
	 * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
	 *
	 * @param {Object} target
	 * @returns {Array} an array of entries from the @@iterator function
	 */
	function getIteratorEntries(target) {
	  if (hasIteratorFunction(target)) {
	    try {
	      return getGeneratorEntries(target[Symbol.iterator]());
	    } catch (iteratorError) {
	      return [];
	    }
	  }
	  return [];
	}

	/*!
	 * Gets all entries from a Generator. This will consume the generator - which could have side effects.
	 *
	 * @param {Generator} target
	 * @returns {Array} an array of entries from the Generator.
	 */
	function getGeneratorEntries(generator) {
	  var generatorResult = generator.next();
	  var accumulator = [ generatorResult.value ];
	  while (generatorResult.done === false) {
	    generatorResult = generator.next();
	    accumulator.push(generatorResult.value);
	  }
	  return accumulator;
	}

	/*!
	 * Gets all own and inherited enumerable keys from a target.
	 *
	 * @param {Object} target
	 * @returns {Array} an array of own and inherited enumerable keys from the target.
	 */
	function getEnumerableKeys(target) {
	  var keys = [];
	  for (var key in target) {
	    keys.push(key);
	  }
	  return keys;
	}

	/*!
	 * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
	 * each key. If any value of the given key is not equal, the function will return false (early).
	 *
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
	 * @param {Object} [options] (Optional)
	 * @return {Boolean} result
	 */
	function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
	  var length = keys.length;
	  if (length === 0) {
	    return true;
	  }
	  for (var i = 0; i < length; i += 1) {
	    if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
	      return false;
	    }
	  }
	  return true;
	}

	/*!
	 * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
	 * for each enumerable key in the object.
	 *
	 * @param {Mixed} leftHandOperand
	 * @param {Mixed} rightHandOperand
	 * @param {Object} [options] (Optional)
	 * @return {Boolean} result
	 */

	function objectEqual(leftHandOperand, rightHandOperand, options) {
	  var leftHandKeys = getEnumerableKeys(leftHandOperand);
	  var rightHandKeys = getEnumerableKeys(rightHandOperand);
	  if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
	    leftHandKeys.sort();
	    rightHandKeys.sort();
	    if (iterableEqual(leftHandKeys, rightHandKeys) === false) {
	      return false;
	    }
	    return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
	  }

	  var leftHandEntries = getIteratorEntries(leftHandOperand);
	  var rightHandEntries = getIteratorEntries(rightHandOperand);
	  if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
	    leftHandEntries.sort();
	    rightHandEntries.sort();
	    return iterableEqual(leftHandEntries, rightHandEntries, options);
	  }

	  if (leftHandKeys.length === 0 &&
	      leftHandEntries.length === 0 &&
	      rightHandKeys.length === 0 &&
	      rightHandEntries.length === 0) {
	    return true;
	  }

	  return false;
	}

	/*!
	 * Returns true if the argument is a primitive.
	 *
	 * This intentionally returns true for all objects that can be compared by reference,
	 * including functions and symbols.
	 *
	 * @param {Mixed} value
	 * @return {Boolean} result
	 */
	function isPrimitive(value) {
	  return value === null || typeof value !== 'object';
	}
	deepEql.MemoizeMap = MemoizeMap_1;

	/*!
	 * Chai - isProxyEnabled helper
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .isProxyEnabled()
	 *
	 * Helper function to check if Chai's proxy protection feature is enabled. If
	 * proxies are unsupported or disabled via the user's Chai config, then return
	 * false. Otherwise, return true.
	 *
	 * @namespace Utils
	 * @name isProxyEnabled
	 */

	var isProxyEnabled = function isProxyEnabled() {
	  return config.useProxy &&
	    typeof Proxy !== 'undefined' &&
	    typeof Reflect !== 'undefined';
	};

	/*!
	 * Chai - addProperty utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .addProperty(ctx, name, getter)
	 *
	 * Adds a property to the prototype of an object.
	 *
	 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
	 *       var obj = utils.flag(this, 'object');
	 *       new chai.Assertion(obj).to.be.instanceof(Foo);
	 *     });
	 *
	 * Can also be accessed directly from `chai.Assertion`.
	 *
	 *     chai.Assertion.addProperty('foo', fn);
	 *
	 * Then can be used as any other assertion.
	 *
	 *     expect(myFoo).to.be.foo;
	 *
	 * @param {Object} ctx object to which the property is added
	 * @param {String} name of property to add
	 * @param {Function} getter function to be used for name
	 * @namespace Utils
	 * @name addProperty
	 * @api public
	 */

	var addProperty = function addProperty(ctx, name, getter) {
	  getter = getter === undefined ? function () {} : getter;

	  Object.defineProperty(ctx, name,
	    { get: function propertyGetter() {
	        // Setting the `ssfi` flag to `propertyGetter` causes this function to
	        // be the starting point for removing implementation frames from the
	        // stack trace of a failed assertion.
	        //
	        // However, we only want to use this function as the starting point if
	        // the `lockSsfi` flag isn't set and proxy protection is disabled.
	        //
	        // If the `lockSsfi` flag is set, then either this assertion has been
	        // overwritten by another assertion, or this assertion is being invoked
	        // from inside of another assertion. In the first case, the `ssfi` flag
	        // has already been set by the overwriting assertion. In the second
	        // case, the `ssfi` flag has already been set by the outer assertion.
	        //
	        // If proxy protection is enabled, then the `ssfi` flag has already been
	        // set by the proxy getter.
	        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
	          flag(this, 'ssfi', propertyGetter);
	        }

	        var result = getter.call(this);
	        if (result !== undefined)
	          return result;

	        var newAssertion = new chai.Assertion();
	        transferFlags(this, newAssertion);
	        return newAssertion;
	      }
	    , configurable: true
	  });
	};

	var fnLengthDesc = Object.getOwnPropertyDescriptor(function () {}, 'length');

	/*!
	 * Chai - addLengthGuard utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .addLengthGuard(fn, assertionName, isChainable)
	 *
	 * Define `length` as a getter on the given uninvoked method assertion. The
	 * getter acts as a guard against chaining `length` directly off of an uninvoked
	 * method assertion, which is a problem because it references `function`'s
	 * built-in `length` property instead of Chai's `length` assertion. When the
	 * getter catches the user making this mistake, it throws an error with a
	 * helpful message.
	 *
	 * There are two ways in which this mistake can be made. The first way is by
	 * chaining the `length` assertion directly off of an uninvoked chainable
	 * method. In this case, Chai suggests that the user use `lengthOf` instead. The
	 * second way is by chaining the `length` assertion directly off of an uninvoked
	 * non-chainable method. Non-chainable methods must be invoked prior to
	 * chaining. In this case, Chai suggests that the user consult the docs for the
	 * given assertion.
	 *
	 * If the `length` property of functions is unconfigurable, then return `fn`
	 * without modification.
	 *
	 * Note that in ES6, the function's `length` property is configurable, so once
	 * support for legacy environments is dropped, Chai's `length` property can
	 * replace the built-in function's `length` property, and this length guard will
	 * no longer be necessary. In the mean time, maintaining consistency across all
	 * environments is the priority.
	 *
	 * @param {Function} fn
	 * @param {String} assertionName
	 * @param {Boolean} isChainable
	 * @namespace Utils
	 * @name addLengthGuard
	 */

	var addLengthGuard = function addLengthGuard (fn, assertionName, isChainable) {
	  if (!fnLengthDesc.configurable) return fn;

	  Object.defineProperty(fn, 'length', {
	    get: function () {
	      if (isChainable) {
	        throw Error('Invalid Chai property: ' + assertionName + '.length. Due' +
	          ' to a compatibility issue, "length" cannot directly follow "' +
	          assertionName + '". Use "' + assertionName + '.lengthOf" instead.');
	      }

	      throw Error('Invalid Chai property: ' + assertionName + '.length. See' +
	        ' docs for proper usage of "' + assertionName + '".');
	    }
	  });

	  return fn;
	};

	/*!
	 * Chai - proxify utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .proxify(object)
	 *
	 * Return a proxy of given object that throws an error when a non-existent
	 * property is read. By default, the root cause is assumed to be a misspelled
	 * property, and thus an attempt is made to offer a reasonable suggestion from
	 * the list of existing properties. However, if a nonChainableMethodName is
	 * provided, then the root cause is instead a failure to invoke a non-chainable
	 * method prior to reading the non-existent property.
	 *
	 * If proxies are unsupported or disabled via the user's Chai config, then
	 * return object without modification.
	 *
	 * @param {Object} obj
	 * @param {String} nonChainableMethodName
	 * @namespace Utils
	 * @name proxify
	 */

	var builtins = ['__flags', '__methods', '_obj', 'assert'];

	var proxify = function proxify(obj, nonChainableMethodName) {
	  if (!isProxyEnabled()) return obj;

	  return new Proxy(obj, {
	    get: function proxyGetter(target, property) {
	      // This check is here because we should not throw errors on Symbol properties
	      // such as `Symbol.toStringTag`.
	      // The values for which an error should be thrown can be configured using
	      // the `config.proxyExcludedKeys` setting.
	      if (typeof property === 'string' &&
	          config.proxyExcludedKeys.indexOf(property) === -1 &&
	          !Reflect.has(target, property)) {
	        // Special message for invalid property access of non-chainable methods.
	        if (nonChainableMethodName) {
	          throw Error('Invalid Chai property: ' + nonChainableMethodName + '.' +
	            property + '. See docs for proper usage of "' +
	            nonChainableMethodName + '".');
	        }

	        // If the property is reasonably close to an existing Chai property,
	        // suggest that property to the user. Only suggest properties with a
	        // distance less than 4.
	        var suggestion = null;
	        var suggestionDistance = 4;
	        getProperties(target).forEach(function(prop) {
	          if (
	            !Object.prototype.hasOwnProperty(prop) &&
	            builtins.indexOf(prop) === -1
	          ) {
	            var dist = stringDistanceCapped(
	              property,
	              prop,
	              suggestionDistance
	            );
	            if (dist < suggestionDistance) {
	              suggestion = prop;
	              suggestionDistance = dist;
	            }
	          }
	        });

	        if (suggestion !== null) {
	          throw Error('Invalid Chai property: ' + property +
	            '. Did you mean "' + suggestion + '"?');
	        } else {
	          throw Error('Invalid Chai property: ' + property);
	        }
	      }

	      // Use this proxy getter as the starting point for removing implementation
	      // frames from the stack trace of a failed assertion. For property
	      // assertions, this prevents the proxy getter from showing up in the stack
	      // trace since it's invoked before the property getter. For method and
	      // chainable method assertions, this flag will end up getting changed to
	      // the method wrapper, which is good since this frame will no longer be in
	      // the stack once the method is invoked. Note that Chai builtin assertion
	      // properties such as `__flags` are skipped since this is only meant to
	      // capture the starting point of an assertion. This step is also skipped
	      // if the `lockSsfi` flag is set, thus indicating that this assertion is
	      // being called from within another assertion. In that case, the `ssfi`
	      // flag is already set to the outer assertion's starting point.
	      if (builtins.indexOf(property) === -1 && !flag(target, 'lockSsfi')) {
	        flag(target, 'ssfi', proxyGetter);
	      }

	      return Reflect.get(target, property);
	    }
	  });
	};

	/**
	 * # stringDistanceCapped(strA, strB, cap)
	 * Return the Levenshtein distance between two strings, but no more than cap.
	 * @param {string} strA
	 * @param {string} strB
	 * @param {number} number
	 * @return {number} min(string distance between strA and strB, cap)
	 * @api private
	 */

	function stringDistanceCapped(strA, strB, cap) {
	  if (Math.abs(strA.length - strB.length) >= cap) {
	    return cap;
	  }

	  var memo = [];
	  // `memo` is a two-dimensional array containing distances.
	  // memo[i][j] is the distance between strA.slice(0, i) and
	  // strB.slice(0, j).
	  for (var i = 0; i <= strA.length; i++) {
	    memo[i] = Array(strB.length + 1).fill(0);
	    memo[i][0] = i;
	  }
	  for (var j = 0; j < strB.length; j++) {
	    memo[0][j] = j;
	  }

	  for (var i = 1; i <= strA.length; i++) {
	    var ch = strA.charCodeAt(i - 1);
	    for (var j = 1; j <= strB.length; j++) {
	      if (Math.abs(i - j) >= cap) {
	        memo[i][j] = cap;
	        continue;
	      }
	      memo[i][j] = Math.min(
	        memo[i - 1][j] + 1,
	        memo[i][j - 1] + 1,
	        memo[i - 1][j - 1] +
	          (ch === strB.charCodeAt(j - 1) ? 0 : 1)
	      );
	    }
	  }

	  return memo[strA.length][strB.length];
	}

	/*!
	 * Chai - addMethod utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .addMethod(ctx, name, method)
	 *
	 * Adds a method to the prototype of an object.
	 *
	 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
	 *       var obj = utils.flag(this, 'object');
	 *       new chai.Assertion(obj).to.be.equal(str);
	 *     });
	 *
	 * Can also be accessed directly from `chai.Assertion`.
	 *
	 *     chai.Assertion.addMethod('foo', fn);
	 *
	 * Then can be used as any other assertion.
	 *
	 *     expect(fooStr).to.be.foo('bar');
	 *
	 * @param {Object} ctx object to which the method is added
	 * @param {String} name of method to add
	 * @param {Function} method function to be used for name
	 * @namespace Utils
	 * @name addMethod
	 * @api public
	 */

	var addMethod = function addMethod(ctx, name, method) {
	  var methodWrapper = function () {
	    // Setting the `ssfi` flag to `methodWrapper` causes this function to be the
	    // starting point for removing implementation frames from the stack trace of
	    // a failed assertion.
	    //
	    // However, we only want to use this function as the starting point if the
	    // `lockSsfi` flag isn't set.
	    //
	    // If the `lockSsfi` flag is set, then either this assertion has been
	    // overwritten by another assertion, or this assertion is being invoked from
	    // inside of another assertion. In the first case, the `ssfi` flag has
	    // already been set by the overwriting assertion. In the second case, the
	    // `ssfi` flag has already been set by the outer assertion.
	    if (!flag(this, 'lockSsfi')) {
	      flag(this, 'ssfi', methodWrapper);
	    }

	    var result = method.apply(this, arguments);
	    if (result !== undefined)
	      return result;

	    var newAssertion = new chai.Assertion();
	    transferFlags(this, newAssertion);
	    return newAssertion;
	  };

	  addLengthGuard(methodWrapper, name, false);
	  ctx[name] = proxify(methodWrapper, name);
	};

	/*!
	 * Chai - overwriteProperty utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .overwriteProperty(ctx, name, fn)
	 *
	 * Overwrites an already existing property getter and provides
	 * access to previous value. Must return function to use as getter.
	 *
	 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
	 *       return function () {
	 *         var obj = utils.flag(this, 'object');
	 *         if (obj instanceof Foo) {
	 *           new chai.Assertion(obj.name).to.equal('bar');
	 *         } else {
	 *           _super.call(this);
	 *         }
	 *       }
	 *     });
	 *
	 *
	 * Can also be accessed directly from `chai.Assertion`.
	 *
	 *     chai.Assertion.overwriteProperty('foo', fn);
	 *
	 * Then can be used as any other assertion.
	 *
	 *     expect(myFoo).to.be.ok;
	 *
	 * @param {Object} ctx object whose property is to be overwritten
	 * @param {String} name of property to overwrite
	 * @param {Function} getter function that returns a getter function to be used for name
	 * @namespace Utils
	 * @name overwriteProperty
	 * @api public
	 */

	var overwriteProperty = function overwriteProperty(ctx, name, getter) {
	  var _get = Object.getOwnPropertyDescriptor(ctx, name)
	    , _super = function () {};

	  if (_get && 'function' === typeof _get.get)
	    _super = _get.get;

	  Object.defineProperty(ctx, name,
	    { get: function overwritingPropertyGetter() {
	        // Setting the `ssfi` flag to `overwritingPropertyGetter` causes this
	        // function to be the starting point for removing implementation frames
	        // from the stack trace of a failed assertion.
	        //
	        // However, we only want to use this function as the starting point if
	        // the `lockSsfi` flag isn't set and proxy protection is disabled.
	        //
	        // If the `lockSsfi` flag is set, then either this assertion has been
	        // overwritten by another assertion, or this assertion is being invoked
	        // from inside of another assertion. In the first case, the `ssfi` flag
	        // has already been set by the overwriting assertion. In the second
	        // case, the `ssfi` flag has already been set by the outer assertion.
	        //
	        // If proxy protection is enabled, then the `ssfi` flag has already been
	        // set by the proxy getter.
	        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
	          flag(this, 'ssfi', overwritingPropertyGetter);
	        }

	        // Setting the `lockSsfi` flag to `true` prevents the overwritten
	        // assertion from changing the `ssfi` flag. By this point, the `ssfi`
	        // flag is already set to the correct starting point for this assertion.
	        var origLockSsfi = flag(this, 'lockSsfi');
	        flag(this, 'lockSsfi', true);
	        var result = getter(_super).call(this);
	        flag(this, 'lockSsfi', origLockSsfi);

	        if (result !== undefined) {
	          return result;
	        }

	        var newAssertion = new chai.Assertion();
	        transferFlags(this, newAssertion);
	        return newAssertion;
	      }
	    , configurable: true
	  });
	};

	/*!
	 * Chai - overwriteMethod utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .overwriteMethod(ctx, name, fn)
	 *
	 * Overwrites an already existing method and provides
	 * access to previous function. Must return function
	 * to be used for name.
	 *
	 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
	 *       return function (str) {
	 *         var obj = utils.flag(this, 'object');
	 *         if (obj instanceof Foo) {
	 *           new chai.Assertion(obj.value).to.equal(str);
	 *         } else {
	 *           _super.apply(this, arguments);
	 *         }
	 *       }
	 *     });
	 *
	 * Can also be accessed directly from `chai.Assertion`.
	 *
	 *     chai.Assertion.overwriteMethod('foo', fn);
	 *
	 * Then can be used as any other assertion.
	 *
	 *     expect(myFoo).to.equal('bar');
	 *
	 * @param {Object} ctx object whose method is to be overwritten
	 * @param {String} name of method to overwrite
	 * @param {Function} method function that returns a function to be used for name
	 * @namespace Utils
	 * @name overwriteMethod
	 * @api public
	 */

	var overwriteMethod = function overwriteMethod(ctx, name, method) {
	  var _method = ctx[name]
	    , _super = function () {
	      throw new Error(name + ' is not a function');
	    };

	  if (_method && 'function' === typeof _method)
	    _super = _method;

	  var overwritingMethodWrapper = function () {
	    // Setting the `ssfi` flag to `overwritingMethodWrapper` causes this
	    // function to be the starting point for removing implementation frames from
	    // the stack trace of a failed assertion.
	    //
	    // However, we only want to use this function as the starting point if the
	    // `lockSsfi` flag isn't set.
	    //
	    // If the `lockSsfi` flag is set, then either this assertion has been
	    // overwritten by another assertion, or this assertion is being invoked from
	    // inside of another assertion. In the first case, the `ssfi` flag has
	    // already been set by the overwriting assertion. In the second case, the
	    // `ssfi` flag has already been set by the outer assertion.
	    if (!flag(this, 'lockSsfi')) {
	      flag(this, 'ssfi', overwritingMethodWrapper);
	    }

	    // Setting the `lockSsfi` flag to `true` prevents the overwritten assertion
	    // from changing the `ssfi` flag. By this point, the `ssfi` flag is already
	    // set to the correct starting point for this assertion.
	    var origLockSsfi = flag(this, 'lockSsfi');
	    flag(this, 'lockSsfi', true);
	    var result = method(_super).apply(this, arguments);
	    flag(this, 'lockSsfi', origLockSsfi);

	    if (result !== undefined) {
	      return result;
	    }

	    var newAssertion = new chai.Assertion();
	    transferFlags(this, newAssertion);
	    return newAssertion;
	  };

	  addLengthGuard(overwritingMethodWrapper, name, false);
	  ctx[name] = proxify(overwritingMethodWrapper, name);
	};

	/*!
	 * Chai - addChainingMethod utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Module dependencies
	 */







	/*!
	 * Module variables
	 */

	// Check whether `Object.setPrototypeOf` is supported
	var canSetPrototype = typeof Object.setPrototypeOf === 'function';

	// Without `Object.setPrototypeOf` support, this module will need to add properties to a function.
	// However, some of functions' own props are not configurable and should be skipped.
	var testFn = function() {};
	var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
	  var propDesc = Object.getOwnPropertyDescriptor(testFn, name);

	  // Note: PhantomJS 1.x includes `callee` as one of `testFn`'s own properties,
	  // but then returns `undefined` as the property descriptor for `callee`. As a
	  // workaround, we perform an otherwise unnecessary type-check for `propDesc`,
	  // and then filter it out if it's not an object as it should be.
	  if (typeof propDesc !== 'object')
	    return true;

	  return !propDesc.configurable;
	});

	// Cache `Function` properties
	var call  = Function.prototype.call,
	    apply = Function.prototype.apply;

	/**
	 * ### .addChainableMethod(ctx, name, method, chainingBehavior)
	 *
	 * Adds a method to an object, such that the method can also be chained.
	 *
	 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
	 *       var obj = utils.flag(this, 'object');
	 *       new chai.Assertion(obj).to.be.equal(str);
	 *     });
	 *
	 * Can also be accessed directly from `chai.Assertion`.
	 *
	 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
	 *
	 * The result can then be used as both a method assertion, executing both `method` and
	 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
	 *
	 *     expect(fooStr).to.be.foo('bar');
	 *     expect(fooStr).to.be.foo.equal('foo');
	 *
	 * @param {Object} ctx object to which the method is added
	 * @param {String} name of method to add
	 * @param {Function} method function to be used for `name`, when called
	 * @param {Function} chainingBehavior function to be called every time the property is accessed
	 * @namespace Utils
	 * @name addChainableMethod
	 * @api public
	 */

	var addChainableMethod = function addChainableMethod(ctx, name, method, chainingBehavior) {
	  if (typeof chainingBehavior !== 'function') {
	    chainingBehavior = function () { };
	  }

	  var chainableBehavior = {
	      method: method
	    , chainingBehavior: chainingBehavior
	  };

	  // save the methods so we can overwrite them later, if we need to.
	  if (!ctx.__methods) {
	    ctx.__methods = {};
	  }
	  ctx.__methods[name] = chainableBehavior;

	  Object.defineProperty(ctx, name,
	    { get: function chainableMethodGetter() {
	        chainableBehavior.chainingBehavior.call(this);

	        var chainableMethodWrapper = function () {
	          // Setting the `ssfi` flag to `chainableMethodWrapper` causes this
	          // function to be the starting point for removing implementation
	          // frames from the stack trace of a failed assertion.
	          //
	          // However, we only want to use this function as the starting point if
	          // the `lockSsfi` flag isn't set.
	          //
	          // If the `lockSsfi` flag is set, then this assertion is being
	          // invoked from inside of another assertion. In this case, the `ssfi`
	          // flag has already been set by the outer assertion.
	          //
	          // Note that overwriting a chainable method merely replaces the saved
	          // methods in `ctx.__methods` instead of completely replacing the
	          // overwritten assertion. Therefore, an overwriting assertion won't
	          // set the `ssfi` or `lockSsfi` flags.
	          if (!flag(this, 'lockSsfi')) {
	            flag(this, 'ssfi', chainableMethodWrapper);
	          }

	          var result = chainableBehavior.method.apply(this, arguments);
	          if (result !== undefined) {
	            return result;
	          }

	          var newAssertion = new chai.Assertion();
	          transferFlags(this, newAssertion);
	          return newAssertion;
	        };

	        addLengthGuard(chainableMethodWrapper, name, true);

	        // Use `Object.setPrototypeOf` if available
	        if (canSetPrototype) {
	          // Inherit all properties from the object by replacing the `Function` prototype
	          var prototype = Object.create(this);
	          // Restore the `call` and `apply` methods from `Function`
	          prototype.call = call;
	          prototype.apply = apply;
	          Object.setPrototypeOf(chainableMethodWrapper, prototype);
	        }
	        // Otherwise, redefine all properties (slow!)
	        else {
	          var asserterNames = Object.getOwnPropertyNames(ctx);
	          asserterNames.forEach(function (asserterName) {
	            if (excludeNames.indexOf(asserterName) !== -1) {
	              return;
	            }

	            var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
	            Object.defineProperty(chainableMethodWrapper, asserterName, pd);
	          });
	        }

	        transferFlags(this, chainableMethodWrapper);
	        return proxify(chainableMethodWrapper);
	      }
	    , configurable: true
	  });
	};

	/*!
	 * Chai - overwriteChainableMethod utility
	 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .overwriteChainableMethod(ctx, name, method, chainingBehavior)
	 *
	 * Overwrites an already existing chainable method
	 * and provides access to the previous function or
	 * property.  Must return functions to be used for
	 * name.
	 *
	 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'lengthOf',
	 *       function (_super) {
	 *       }
	 *     , function (_super) {
	 *       }
	 *     );
	 *
	 * Can also be accessed directly from `chai.Assertion`.
	 *
	 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
	 *
	 * Then can be used as any other assertion.
	 *
	 *     expect(myFoo).to.have.lengthOf(3);
	 *     expect(myFoo).to.have.lengthOf.above(3);
	 *
	 * @param {Object} ctx object whose method / property is to be overwritten
	 * @param {String} name of method / property to overwrite
	 * @param {Function} method function that returns a function to be used for name
	 * @param {Function} chainingBehavior function that returns a function to be used for property
	 * @namespace Utils
	 * @name overwriteChainableMethod
	 * @api public
	 */

	var overwriteChainableMethod = function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
	  var chainableBehavior = ctx.__methods[name];

	  var _chainingBehavior = chainableBehavior.chainingBehavior;
	  chainableBehavior.chainingBehavior = function overwritingChainableMethodGetter() {
	    var result = chainingBehavior(_chainingBehavior).call(this);
	    if (result !== undefined) {
	      return result;
	    }

	    var newAssertion = new chai.Assertion();
	    transferFlags(this, newAssertion);
	    return newAssertion;
	  };

	  var _method = chainableBehavior.method;
	  chainableBehavior.method = function overwritingChainableMethodWrapper() {
	    var result = method(_method).apply(this, arguments);
	    if (result !== undefined) {
	      return result;
	    }

	    var newAssertion = new chai.Assertion();
	    transferFlags(this, newAssertion);
	    return newAssertion;
	  };
	};

	/*!
	 * Chai - compareByInspect utility
	 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Module dependencies
	 */



	/**
	 * ### .compareByInspect(mixed, mixed)
	 *
	 * To be used as a compareFunction with Array.prototype.sort. Compares elements
	 * using inspect instead of default behavior of using toString so that Symbols
	 * and objects with irregular/missing toString can still be sorted without a
	 * TypeError.
	 *
	 * @param {Mixed} first element to compare
	 * @param {Mixed} second element to compare
	 * @returns {Number} -1 if 'a' should come before 'b'; otherwise 1
	 * @name compareByInspect
	 * @namespace Utils
	 * @api public
	 */

	var compareByInspect = function compareByInspect(a, b) {
	  return inspect_1(a) < inspect_1(b) ? -1 : 1;
	};

	/*!
	 * Chai - getOwnEnumerablePropertySymbols utility
	 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	/**
	 * ### .getOwnEnumerablePropertySymbols(object)
	 *
	 * This allows the retrieval of directly-owned enumerable property symbols of an
	 * object. This function is necessary because Object.getOwnPropertySymbols
	 * returns both enumerable and non-enumerable property symbols.
	 *
	 * @param {Object} object
	 * @returns {Array}
	 * @namespace Utils
	 * @name getOwnEnumerablePropertySymbols
	 * @api public
	 */

	var getOwnEnumerablePropertySymbols = function getOwnEnumerablePropertySymbols(obj) {
	  if (typeof Object.getOwnPropertySymbols !== 'function') return [];

	  return Object.getOwnPropertySymbols(obj).filter(function (sym) {
	    return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
	  });
	};

	/*!
	 * Chai - getOwnEnumerableProperties utility
	 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Module dependencies
	 */



	/**
	 * ### .getOwnEnumerableProperties(object)
	 *
	 * This allows the retrieval of directly-owned enumerable property names and
	 * symbols of an object. This function is necessary because Object.keys only
	 * returns enumerable property names, not enumerable property symbols.
	 *
	 * @param {Object} object
	 * @returns {Array}
	 * @namespace Utils
	 * @name getOwnEnumerableProperties
	 * @api public
	 */

	var getOwnEnumerableProperties = function getOwnEnumerableProperties(obj) {
	  return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
	};

	/* !
	 * Chai - checkError utility
	 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .checkError
	 *
	 * Checks that an error conforms to a given set of criteria and/or retrieves information about it.
	 *
	 * @api public
	 */

	/**
	 * ### .compatibleInstance(thrown, errorLike)
	 *
	 * Checks if two instances are compatible (strict equal).
	 * Returns false if errorLike is not an instance of Error, because instances
	 * can only be compatible if they're both error instances.
	 *
	 * @name compatibleInstance
	 * @param {Error} thrown error
	 * @param {Error|ErrorConstructor} errorLike object to compare against
	 * @namespace Utils
	 * @api public
	 */

	function compatibleInstance(thrown, errorLike) {
	  return errorLike instanceof Error && thrown === errorLike;
	}

	/**
	 * ### .compatibleConstructor(thrown, errorLike)
	 *
	 * Checks if two constructors are compatible.
	 * This function can receive either an error constructor or
	 * an error instance as the `errorLike` argument.
	 * Constructors are compatible if they're the same or if one is
	 * an instance of another.
	 *
	 * @name compatibleConstructor
	 * @param {Error} thrown error
	 * @param {Error|ErrorConstructor} errorLike object to compare against
	 * @namespace Utils
	 * @api public
	 */

	function compatibleConstructor(thrown, errorLike) {
	  if (errorLike instanceof Error) {
	    // If `errorLike` is an instance of any error we compare their constructors
	    return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
	  } else if (errorLike.prototype instanceof Error || errorLike === Error) {
	    // If `errorLike` is a constructor that inherits from Error, we compare `thrown` to `errorLike` directly
	    return thrown.constructor === errorLike || thrown instanceof errorLike;
	  }

	  return false;
	}

	/**
	 * ### .compatibleMessage(thrown, errMatcher)
	 *
	 * Checks if an error's message is compatible with a matcher (String or RegExp).
	 * If the message contains the String or passes the RegExp test,
	 * it is considered compatible.
	 *
	 * @name compatibleMessage
	 * @param {Error} thrown error
	 * @param {String|RegExp} errMatcher to look for into the message
	 * @namespace Utils
	 * @api public
	 */

	function compatibleMessage(thrown, errMatcher) {
	  var comparisonString = typeof thrown === 'string' ? thrown : thrown.message;
	  if (errMatcher instanceof RegExp) {
	    return errMatcher.test(comparisonString);
	  } else if (typeof errMatcher === 'string') {
	    return comparisonString.indexOf(errMatcher) !== -1; // eslint-disable-line no-magic-numbers
	  }

	  return false;
	}

	/**
	 * ### .getFunctionName(constructorFn)
	 *
	 * Returns the name of a function.
	 * This also includes a polyfill function if `constructorFn.name` is not defined.
	 *
	 * @name getFunctionName
	 * @param {Function} constructorFn
	 * @namespace Utils
	 * @api private
	 */

	var functionNameMatch$1 = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\(\/]+)/;
	function getFunctionName(constructorFn) {
	  var name = '';
	  if (typeof constructorFn.name === 'undefined') {
	    // Here we run a polyfill if constructorFn.name is not defined
	    var match = String(constructorFn).match(functionNameMatch$1);
	    if (match) {
	      name = match[1];
	    }
	  } else {
	    name = constructorFn.name;
	  }

	  return name;
	}

	/**
	 * ### .getConstructorName(errorLike)
	 *
	 * Gets the constructor name for an Error instance or constructor itself.
	 *
	 * @name getConstructorName
	 * @param {Error|ErrorConstructor} errorLike
	 * @namespace Utils
	 * @api public
	 */

	function getConstructorName(errorLike) {
	  var constructorName = errorLike;
	  if (errorLike instanceof Error) {
	    constructorName = getFunctionName(errorLike.constructor);
	  } else if (typeof errorLike === 'function') {
	    // If `err` is not an instance of Error it is an error constructor itself or another function.
	    // If we've got a common function we get its name, otherwise we may need to create a new instance
	    // of the error just in case it's a poorly-constructed error. Please see chaijs/chai/issues/45 to know more.
	    constructorName = getFunctionName(errorLike).trim() ||
	        getFunctionName(new errorLike()); // eslint-disable-line new-cap
	  }

	  return constructorName;
	}

	/**
	 * ### .getMessage(errorLike)
	 *
	 * Gets the error message from an error.
	 * If `err` is a String itself, we return it.
	 * If the error has no message, we return an empty string.
	 *
	 * @name getMessage
	 * @param {Error|String} errorLike
	 * @namespace Utils
	 * @api public
	 */

	function getMessage$1(errorLike) {
	  var msg = '';
	  if (errorLike && errorLike.message) {
	    msg = errorLike.message;
	  } else if (typeof errorLike === 'string') {
	    msg = errorLike;
	  }

	  return msg;
	}

	var checkError = {
	  compatibleInstance: compatibleInstance,
	  compatibleConstructor: compatibleConstructor,
	  compatibleMessage: compatibleMessage,
	  getMessage: getMessage$1,
	  getConstructorName: getConstructorName,
	};

	/*!
	 * Chai - isNaN utility
	 * Copyright(c) 2012-2015 Sakthipriyan Vairamani <thechargingvolcano@gmail.com>
	 * MIT Licensed
	 */
	/**
	 * ### .isNaN(value)
	 *
	 * Checks if the given value is NaN or not.
	 *
	 *     utils.isNaN(NaN); // true
	 *
	 * @param {Value} The value which has to be checked if it is NaN
	 * @name isNaN
	 * @api private
	 */

	function isNaN(value) {
	  // Refer http://www.ecma-international.org/ecma-262/6.0/#sec-isnan-number
	  // section's NOTE.
	  return value !== value;
	}

	// If ECMAScript 6's Number.isNaN is present, prefer that.
	var _isNaN = Number.isNaN || isNaN;

	/*!
	 * chai
	 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/*!
	 * Dependencies that are used for multiple exports are required here only once
	 */



	/*!
	 * test utility
	 */

	var test$1 = test;

	/*!
	 * type utility
	 */

	var type = typeDetect;

	/*!
	 * expectTypes utility
	 */
	var expectTypes$1 = expectTypes;

	/*!
	 * message utility
	 */

	var getMessage$2 = getMessage;

	/*!
	 * actual utility
	 */

	var getActual$1 = getActual;

	/*!
	 * Inspect util
	 */

	var inspect = inspect_1;

	/*!
	 * Object Display util
	 */

	var objDisplay$1 = objDisplay;

	/*!
	 * Flag utility
	 */

	var flag$1 = flag;

	/*!
	 * Flag transferring utility
	 */

	var transferFlags$1 = transferFlags;

	/*!
	 * Deep equal utility
	 */

	var eql = deepEql;

	/*!
	 * Deep path info
	 */

	var getPathInfo$1 = pathval.getPathInfo;

	/*!
	 * Check if a property exists
	 */

	var hasProperty$1 = pathval.hasProperty;

	/*!
	 * Function name
	 */

	var getName = getFuncName_1;

	/*!
	 * add Property
	 */

	var addProperty$1 = addProperty;

	/*!
	 * add Method
	 */

	var addMethod$1 = addMethod;

	/*!
	 * overwrite Property
	 */

	var overwriteProperty$1 = overwriteProperty;

	/*!
	 * overwrite Method
	 */

	var overwriteMethod$1 = overwriteMethod;

	/*!
	 * Add a chainable method
	 */

	var addChainableMethod$1 = addChainableMethod;

	/*!
	 * Overwrite chainable method
	 */

	var overwriteChainableMethod$1 = overwriteChainableMethod;

	/*!
	 * Compare by inspect method
	 */

	var compareByInspect$1 = compareByInspect;

	/*!
	 * Get own enumerable property symbols method
	 */

	var getOwnEnumerablePropertySymbols$1 = getOwnEnumerablePropertySymbols;

	/*!
	 * Get own enumerable properties method
	 */

	var getOwnEnumerableProperties$1 = getOwnEnumerableProperties;

	/*!
	 * Checks error against a given set of criteria
	 */

	var checkError$1 = checkError;

	/*!
	 * Proxify util
	 */

	var proxify$1 = proxify;

	/*!
	 * addLengthGuard util
	 */

	var addLengthGuard$1 = addLengthGuard;

	/*!
	 * isProxyEnabled helper
	 */

	var isProxyEnabled$1 = isProxyEnabled;

	/*!
	 * isNaN method
	 */

	var _isNaN$1 = _isNaN;

	var utils = {
		test: test$1,
		type: type,
		expectTypes: expectTypes$1,
		getMessage: getMessage$2,
		getActual: getActual$1,
		inspect: inspect,
		objDisplay: objDisplay$1,
		flag: flag$1,
		transferFlags: transferFlags$1,
		eql: eql,
		getPathInfo: getPathInfo$1,
		hasProperty: hasProperty$1,
		getName: getName,
		addProperty: addProperty$1,
		addMethod: addMethod$1,
		overwriteProperty: overwriteProperty$1,
		overwriteMethod: overwriteMethod$1,
		addChainableMethod: addChainableMethod$1,
		overwriteChainableMethod: overwriteChainableMethod$1,
		compareByInspect: compareByInspect$1,
		getOwnEnumerablePropertySymbols: getOwnEnumerablePropertySymbols$1,
		getOwnEnumerableProperties: getOwnEnumerableProperties$1,
		checkError: checkError$1,
		proxify: proxify$1,
		addLengthGuard: addLengthGuard$1,
		isProxyEnabled: isProxyEnabled$1,
		isNaN: _isNaN$1
	};

	/*!
	 * chai
	 * http://chaijs.com
	 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	var assertion = function (_chai, util) {
	  /*!
	   * Module dependencies.
	   */

	  var AssertionError = _chai.AssertionError
	    , flag = util.flag;

	  /*!
	   * Module export.
	   */

	  _chai.Assertion = Assertion;

	  /*!
	   * Assertion Constructor
	   *
	   * Creates object for chaining.
	   *
	   * `Assertion` objects contain metadata in the form of flags. Three flags can
	   * be assigned during instantiation by passing arguments to this constructor:
	   *
	   * - `object`: This flag contains the target of the assertion. For example, in
	   *   the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
	   *   contain `numKittens` so that the `equal` assertion can reference it when
	   *   needed.
	   *
	   * - `message`: This flag contains an optional custom error message to be
	   *   prepended to the error message that's generated by the assertion when it
	   *   fails.
	   *
	   * - `ssfi`: This flag stands for "start stack function indicator". It
	   *   contains a function reference that serves as the starting point for
	   *   removing frames from the stack trace of the error that's created by the
	   *   assertion when it fails. The goal is to provide a cleaner stack trace to
	   *   end users by removing Chai's internal functions. Note that it only works
	   *   in environments that support `Error.captureStackTrace`, and only when
	   *   `Chai.config.includeStack` hasn't been set to `false`.
	   *
	   * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
	   *   should retain its current value, even as assertions are chained off of
	   *   this object. This is usually set to `true` when creating a new assertion
	   *   from within another assertion. It's also temporarily set to `true` before
	   *   an overwritten assertion gets called by the overwriting assertion.
	   *
	   * @param {Mixed} obj target of the assertion
	   * @param {String} msg (optional) custom error message
	   * @param {Function} ssfi (optional) starting point for removing stack frames
	   * @param {Boolean} lockSsfi (optional) whether or not the ssfi flag is locked
	   * @api private
	   */

	  function Assertion (obj, msg, ssfi, lockSsfi) {
	    flag(this, 'ssfi', ssfi || Assertion);
	    flag(this, 'lockSsfi', lockSsfi);
	    flag(this, 'object', obj);
	    flag(this, 'message', msg);

	    return util.proxify(this);
	  }

	  Object.defineProperty(Assertion, 'includeStack', {
	    get: function() {
	      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
	      return config.includeStack;
	    },
	    set: function(value) {
	      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
	      config.includeStack = value;
	    }
	  });

	  Object.defineProperty(Assertion, 'showDiff', {
	    get: function() {
	      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
	      return config.showDiff;
	    },
	    set: function(value) {
	      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
	      config.showDiff = value;
	    }
	  });

	  Assertion.addProperty = function (name, fn) {
	    util.addProperty(this.prototype, name, fn);
	  };

	  Assertion.addMethod = function (name, fn) {
	    util.addMethod(this.prototype, name, fn);
	  };

	  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
	    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
	  };

	  Assertion.overwriteProperty = function (name, fn) {
	    util.overwriteProperty(this.prototype, name, fn);
	  };

	  Assertion.overwriteMethod = function (name, fn) {
	    util.overwriteMethod(this.prototype, name, fn);
	  };

	  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
	    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
	  };

	  /**
	   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
	   *
	   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
	   *
	   * @name assert
	   * @param {Philosophical} expression to be tested
	   * @param {String|Function} message or function that returns message to display if expression fails
	   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
	   * @param {Mixed} expected value (remember to check for negation)
	   * @param {Mixed} actual (optional) will default to `this.obj`
	   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
	   * @api private
	   */

	  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
	    var ok = util.test(this, arguments);
	    if (false !== showDiff) showDiff = true;
	    if (undefined === expected && undefined === _actual) showDiff = false;
	    if (true !== config.showDiff) showDiff = false;

	    if (!ok) {
	      msg = util.getMessage(this, arguments);
	      var actual = util.getActual(this, arguments);
	      throw new AssertionError(msg, {
	          actual: actual
	        , expected: expected
	        , showDiff: showDiff
	      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
	    }
	  };

	  /*!
	   * ### ._obj
	   *
	   * Quick reference to stored `actual` value for plugin developers.
	   *
	   * @api private
	   */

	  Object.defineProperty(Assertion.prototype, '_obj',
	    { get: function () {
	        return flag(this, 'object');
	      }
	    , set: function (val) {
	        flag(this, 'object', val);
	      }
	  });
	};

	/*!
	 * chai
	 * http://chaijs.com
	 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var assertions = function (chai, _) {
	  var Assertion = chai.Assertion
	    , AssertionError = chai.AssertionError
	    , flag = _.flag;

	  /**
	   * ### Language Chains
	   *
	   * The following are provided as chainable getters to improve the readability
	   * of your assertions.
	   *
	   * **Chains**
	   *
	   * - to
	   * - be
	   * - been
	   * - is
	   * - that
	   * - which
	   * - and
	   * - has
	   * - have
	   * - with
	   * - at
	   * - of
	   * - same
	   * - but
	   * - does
	   * - still
	   *
	   * @name language chains
	   * @namespace BDD
	   * @api public
	   */

	  [ 'to', 'be', 'been', 'is'
	  , 'and', 'has', 'have', 'with'
	  , 'that', 'which', 'at', 'of'
	  , 'same', 'but', 'does', 'still' ].forEach(function (chain) {
	    Assertion.addProperty(chain);
	  });

	  /**
	   * ### .not
	   *
	   * Negates all assertions that follow in the chain.
	   *
	   *     expect(function () {}).to.not.throw();
	   *     expect({a: 1}).to.not.have.property('b');
	   *     expect([1, 2]).to.be.an('array').that.does.not.include(3);
	   *
	   * Just because you can negate any assertion with `.not` doesn't mean you
	   * should. With great power comes great responsibility. It's often best to
	   * assert that the one expected output was produced, rather than asserting
	   * that one of countless unexpected outputs wasn't produced. See individual
	   * assertions for specific guidance.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(2).to.not.equal(1); // Not recommended
	   *
	   * @name not
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('not', function () {
	    flag(this, 'negate', true);
	  });

	  /**
	   * ### .deep
	   *
	   * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property`
	   * assertions that follow in the chain to use deep equality instead of strict
	   * (`===`) equality. See the `deep-eql` project page for info on the deep
	   * equality algorithm: https://github.com/chaijs/deep-eql.
	   *
	   *     // Target object deeply (but not strictly) equals `{a: 1}`
	   *     expect({a: 1}).to.deep.equal({a: 1});
	   *     expect({a: 1}).to.not.equal({a: 1});
	   *
	   *     // Target array deeply (but not strictly) includes `{a: 1}`
	   *     expect([{a: 1}]).to.deep.include({a: 1});
	   *     expect([{a: 1}]).to.not.include({a: 1});
	   *
	   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
	   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
	   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
	   *
	   *     // Target array deeply (but not strictly) has member `{a: 1}`
	   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
	   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
	   *
	   *     // Target set deeply (but not strictly) has key `{a: 1}`
	   *     expect(new Set([{a: 1}])).to.have.deep.keys([{a: 1}]);
	   *     expect(new Set([{a: 1}])).to.not.have.keys([{a: 1}]);
	   *
	   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
	   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
	   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
	   *
	   * @name deep
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('deep', function () {
	    flag(this, 'deep', true);
	  });

	  /**
	   * ### .nested
	   *
	   * Enables dot- and bracket-notation in all `.property` and `.include`
	   * assertions that follow in the chain.
	   *
	   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
	   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
	   *
	   * If `.` or `[]` are part of an actual property name, they can be escaped by
	   * adding two backslashes before them.
	   *
	   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
	   *     expect({'.a': {'[b]': 'x'}}).to.nested.include({'\\.a.\\[b\\]': 'x'});
	   *
	   * `.nested` cannot be combined with `.own`.
	   *
	   * @name nested
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('nested', function () {
	    flag(this, 'nested', true);
	  });

	  /**
	   * ### .own
	   *
	   * Causes all `.property` and `.include` assertions that follow in the chain
	   * to ignore inherited properties.
	   *
	   *     Object.prototype.b = 2;
	   *
	   *     expect({a: 1}).to.have.own.property('a');
	   *     expect({a: 1}).to.have.property('b');
	   *     expect({a: 1}).to.not.have.own.property('b');
	   *
	   *     expect({a: 1}).to.own.include({a: 1});
	   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
	   *
	   * `.own` cannot be combined with `.nested`.
	   *
	   * @name own
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('own', function () {
	    flag(this, 'own', true);
	  });

	  /**
	   * ### .ordered
	   *
	   * Causes all `.members` assertions that follow in the chain to require that
	   * members be in the same order.
	   *
	   *     expect([1, 2]).to.have.ordered.members([1, 2])
	   *       .but.not.have.ordered.members([2, 1]);
	   *
	   * When `.include` and `.ordered` are combined, the ordering begins at the
	   * start of both arrays.
	   *
	   *     expect([1, 2, 3]).to.include.ordered.members([1, 2])
	   *       .but.not.include.ordered.members([2, 3]);
	   *
	   * @name ordered
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('ordered', function () {
	    flag(this, 'ordered', true);
	  });

	  /**
	   * ### .any
	   *
	   * Causes all `.keys` assertions that follow in the chain to only require that
	   * the target have at least one of the given keys. This is the opposite of
	   * `.all`, which requires that the target have all of the given keys.
	   *
	   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
	   *
	   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
	   *
	   * @name any
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('any', function () {
	    flag(this, 'any', true);
	    flag(this, 'all', false);
	  });

	  /**
	   * ### .all
	   *
	   * Causes all `.keys` assertions that follow in the chain to require that the
	   * target have all of the given keys. This is the opposite of `.any`, which
	   * only requires that the target have at least one of the given keys.
	   *
	   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
	   *
	   * Note that `.all` is used by default when neither `.all` nor `.any` are
	   * added earlier in the chain. However, it's often best to add `.all` anyway
	   * because it improves readability.
	   *
	   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
	   *
	   * @name all
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('all', function () {
	    flag(this, 'all', true);
	    flag(this, 'any', false);
	  });

	  /**
	   * ### .a(type[, msg])
	   *
	   * Asserts that the target's type is equal to the given string `type`. Types
	   * are case insensitive. See the `type-detect` project page for info on the
	   * type detection algorithm: https://github.com/chaijs/type-detect.
	   *
	   *     expect('foo').to.be.a('string');
	   *     expect({a: 1}).to.be.an('object');
	   *     expect(null).to.be.a('null');
	   *     expect(undefined).to.be.an('undefined');
	   *     expect(new Error).to.be.an('error');
	   *     expect(Promise.resolve()).to.be.a('promise');
	   *     expect(new Float32Array).to.be.a('float32array');
	   *     expect(Symbol()).to.be.a('symbol');
	   *
	   * `.a` supports objects that have a custom type set via `Symbol.toStringTag`.
	   *
	   *     var myObj = {
	   *       [Symbol.toStringTag]: 'myCustomType'
	   *     };
	   *
	   *     expect(myObj).to.be.a('myCustomType').but.not.an('object');
	   *
	   * It's often best to use `.a` to check a target's type before making more
	   * assertions on the same target. That way, you avoid unexpected behavior from
	   * any assertion that does different things based on the target's type.
	   *
	   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
	   *     expect([]).to.be.an('array').that.is.empty;
	   *
	   * Add `.not` earlier in the chain to negate `.a`. However, it's often best to
	   * assert that the target is the expected type, rather than asserting that it
	   * isn't one of many unexpected types.
	   *
	   *     expect('foo').to.be.a('string'); // Recommended
	   *     expect('foo').to.not.be.an('array'); // Not recommended
	   *
	   * `.a` accepts an optional `msg` argument which is a custom error message to
	   * show when the assertion fails. The message can also be given as the second
	   * argument to `expect`.
	   *
	   *     expect(1).to.be.a('string', 'nooo why fail??');
	   *     expect(1, 'nooo why fail??').to.be.a('string');
	   *
	   * `.a` can also be used as a language chain to improve the readability of
	   * your assertions.
	   *
	   *     expect({b: 2}).to.have.a.property('b');
	   *
	   * The alias `.an` can be used interchangeably with `.a`.
	   *
	   * @name a
	   * @alias an
	   * @param {String} type
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function an (type, msg) {
	    if (msg) flag(this, 'message', msg);
	    type = type.toLowerCase();
	    var obj = flag(this, 'object')
	      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

	    this.assert(
	        type === _.type(obj).toLowerCase()
	      , 'expected #{this} to be ' + article + type
	      , 'expected #{this} not to be ' + article + type
	    );
	  }

	  Assertion.addChainableMethod('an', an);
	  Assertion.addChainableMethod('a', an);

	  /**
	   * ### .include(val[, msg])
	   *
	   * When the target is a string, `.include` asserts that the given string `val`
	   * is a substring of the target.
	   *
	   *     expect('foobar').to.include('foo');
	   *
	   * When the target is an array, `.include` asserts that the given `val` is a
	   * member of the target.
	   *
	   *     expect([1, 2, 3]).to.include(2);
	   *
	   * When the target is an object, `.include` asserts that the given object
	   * `val`'s properties are a subset of the target's properties.
	   *
	   *     expect({a: 1, b: 2, c: 3}).to.include({a: 1, b: 2});
	   *
	   * When the target is a Set or WeakSet, `.include` asserts that the given `val` is a
	   * member of the target. SameValueZero equality algorithm is used.
	   *
	   *     expect(new Set([1, 2])).to.include(2);
	   *
	   * When the target is a Map, `.include` asserts that the given `val` is one of
	   * the values of the target. SameValueZero equality algorithm is used.
	   *
	   *     expect(new Map([['a', 1], ['b', 2]])).to.include(2);
	   *
	   * Because `.include` does different things based on the target's type, it's
	   * important to check the target's type before using `.include`. See the `.a`
	   * doc for info on testing a target's type.
	   *
	   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
	   *
	   * By default, strict (`===`) equality is used to compare array members and
	   * object properties. Add `.deep` earlier in the chain to use deep equality
	   * instead (WeakSet targets are not supported). See the `deep-eql` project
	   * page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
	   *
	   *     // Target array deeply (but not strictly) includes `{a: 1}`
	   *     expect([{a: 1}]).to.deep.include({a: 1});
	   *     expect([{a: 1}]).to.not.include({a: 1});
	   *
	   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
	   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
	   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
	   *
	   * By default, all of the target's properties are searched when working with
	   * objects. This includes properties that are inherited and/or non-enumerable.
	   * Add `.own` earlier in the chain to exclude the target's inherited
	   * properties from the search.
	   *
	   *     Object.prototype.b = 2;
	   *
	   *     expect({a: 1}).to.own.include({a: 1});
	   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
	   *
	   * Note that a target object is always only searched for `val`'s own
	   * enumerable properties.
	   *
	   * `.deep` and `.own` can be combined.
	   *
	   *     expect({a: {b: 2}}).to.deep.own.include({a: {b: 2}});
	   *
	   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
	   * referencing nested properties.
	   *
	   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
	   *
	   * If `.` or `[]` are part of an actual property name, they can be escaped by
	   * adding two backslashes before them.
	   *
	   *     expect({'.a': {'[b]': 2}}).to.nested.include({'\\.a.\\[b\\]': 2});
	   *
	   * `.deep` and `.nested` can be combined.
	   *
	   *     expect({a: {b: [{c: 3}]}}).to.deep.nested.include({'a.b[0]': {c: 3}});
	   *
	   * `.own` and `.nested` cannot be combined.
	   *
	   * Add `.not` earlier in the chain to negate `.include`.
	   *
	   *     expect('foobar').to.not.include('taco');
	   *     expect([1, 2, 3]).to.not.include(4);
	   *
	   * However, it's dangerous to negate `.include` when the target is an object.
	   * The problem is that it creates uncertain expectations by asserting that the
	   * target object doesn't have all of `val`'s key/value pairs but may or may
	   * not have some of them. It's often best to identify the exact output that's
	   * expected, and then write an assertion that only accepts that exact output.
	   *
	   * When the target object isn't even expected to have `val`'s keys, it's
	   * often best to assert exactly that.
	   *
	   *     expect({c: 3}).to.not.have.any.keys('a', 'b'); // Recommended
	   *     expect({c: 3}).to.not.include({a: 1, b: 2}); // Not recommended
	   *
	   * When the target object is expected to have `val`'s keys, it's often best to
	   * assert that each of the properties has its expected value, rather than
	   * asserting that each property doesn't have one of many unexpected values.
	   *
	   *     expect({a: 3, b: 4}).to.include({a: 3, b: 4}); // Recommended
	   *     expect({a: 3, b: 4}).to.not.include({a: 1, b: 2}); // Not recommended
	   *
	   * `.include` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect([1, 2, 3]).to.include(4, 'nooo why fail??');
	   *     expect([1, 2, 3], 'nooo why fail??').to.include(4);
	   *
	   * `.include` can also be used as a language chain, causing all `.members` and
	   * `.keys` assertions that follow in the chain to require the target to be a
	   * superset of the expected set, rather than an identical set. Note that
	   * `.members` ignores duplicates in the subset when `.include` is added.
	   *
	   *     // Target object's keys are a superset of ['a', 'b'] but not identical
	   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
	   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
	   *
	   *     // Target array is a superset of [1, 2] but not identical
	   *     expect([1, 2, 3]).to.include.members([1, 2]);
	   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
	   *
	   *     // Duplicates in the subset are ignored
	   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
	   *
	   * Note that adding `.any` earlier in the chain causes the `.keys` assertion
	   * to ignore `.include`.
	   *
	   *     // Both assertions are identical
	   *     expect({a: 1}).to.include.any.keys('a', 'b');
	   *     expect({a: 1}).to.have.any.keys('a', 'b');
	   *
	   * The aliases `.includes`, `.contain`, and `.contains` can be used
	   * interchangeably with `.include`.
	   *
	   * @name include
	   * @alias contain
	   * @alias includes
	   * @alias contains
	   * @param {Mixed} val
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function SameValueZero(a, b) {
	    return (_.isNaN(a) && _.isNaN(b)) || a === b;
	  }

	  function includeChainingBehavior () {
	    flag(this, 'contains', true);
	  }

	  function include (val, msg) {
	    if (msg) flag(this, 'message', msg);

	    var obj = flag(this, 'object')
	      , objType = _.type(obj).toLowerCase()
	      , flagMsg = flag(this, 'message')
	      , negate = flag(this, 'negate')
	      , ssfi = flag(this, 'ssfi')
	      , isDeep = flag(this, 'deep')
	      , descriptor = isDeep ? 'deep ' : '';

	    flagMsg = flagMsg ? flagMsg + ': ' : '';

	    var included = false;

	    switch (objType) {
	      case 'string':
	        included = obj.indexOf(val) !== -1;
	        break;

	      case 'weakset':
	        if (isDeep) {
	          throw new AssertionError(
	            flagMsg + 'unable to use .deep.include with WeakSet',
	            undefined,
	            ssfi
	          );
	        }

	        included = obj.has(val);
	        break;

	      case 'map':
	        var isEql = isDeep ? _.eql : SameValueZero;
	        obj.forEach(function (item) {
	          included = included || isEql(item, val);
	        });
	        break;

	      case 'set':
	        if (isDeep) {
	          obj.forEach(function (item) {
	            included = included || _.eql(item, val);
	          });
	        } else {
	          included = obj.has(val);
	        }
	        break;

	      case 'array':
	        if (isDeep) {
	          included = obj.some(function (item) {
	            return _.eql(item, val);
	          });
	        } else {
	          included = obj.indexOf(val) !== -1;
	        }
	        break;

	      default:
	        // This block is for asserting a subset of properties in an object.
	        // `_.expectTypes` isn't used here because `.include` should work with
	        // objects with a custom `@@toStringTag`.
	        if (val !== Object(val)) {
	          throw new AssertionError(
	            flagMsg + 'object tested must be an array, a map, an object,'
	              + ' a set, a string, or a weakset, but ' + objType + ' given',
	            undefined,
	            ssfi
	          );
	        }

	        var props = Object.keys(val)
	          , firstErr = null
	          , numErrs = 0;

	        props.forEach(function (prop) {
	          var propAssertion = new Assertion(obj);
	          _.transferFlags(this, propAssertion, true);
	          flag(propAssertion, 'lockSsfi', true);

	          if (!negate || props.length === 1) {
	            propAssertion.property(prop, val[prop]);
	            return;
	          }

	          try {
	            propAssertion.property(prop, val[prop]);
	          } catch (err) {
	            if (!_.checkError.compatibleConstructor(err, AssertionError)) {
	              throw err;
	            }
	            if (firstErr === null) firstErr = err;
	            numErrs++;
	          }
	        }, this);

	        // When validating .not.include with multiple properties, we only want
	        // to throw an assertion error if all of the properties are included,
	        // in which case we throw the first property assertion error that we
	        // encountered.
	        if (negate && props.length > 1 && numErrs === props.length) {
	          throw firstErr;
	        }
	        return;
	    }

	    // Assert inclusion in collection or substring in a string.
	    this.assert(
	      included
	      , 'expected #{this} to ' + descriptor + 'include ' + _.inspect(val)
	      , 'expected #{this} to not ' + descriptor + 'include ' + _.inspect(val));
	  }

	  Assertion.addChainableMethod('include', include, includeChainingBehavior);
	  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
	  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
	  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

	  /**
	   * ### .ok
	   *
	   * Asserts that the target is a truthy value (considered `true` in boolean context).
	   * However, it's often best to assert that the target is strictly (`===`) or
	   * deeply equal to its expected value.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.be.ok; // Not recommended
	   *
	   *     expect(true).to.be.true; // Recommended
	   *     expect(true).to.be.ok; // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.ok`.
	   *
	   *     expect(0).to.equal(0); // Recommended
	   *     expect(0).to.not.be.ok; // Not recommended
	   *
	   *     expect(false).to.be.false; // Recommended
	   *     expect(false).to.not.be.ok; // Not recommended
	   *
	   *     expect(null).to.be.null; // Recommended
	   *     expect(null).to.not.be.ok; // Not recommended
	   *
	   *     expect(undefined).to.be.undefined; // Recommended
	   *     expect(undefined).to.not.be.ok; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(false, 'nooo why fail??').to.be.ok;
	   *
	   * @name ok
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('ok', function () {
	    this.assert(
	        flag(this, 'object')
	      , 'expected #{this} to be truthy'
	      , 'expected #{this} to be falsy');
	  });

	  /**
	   * ### .true
	   *
	   * Asserts that the target is strictly (`===`) equal to `true`.
	   *
	   *     expect(true).to.be.true;
	   *
	   * Add `.not` earlier in the chain to negate `.true`. However, it's often best
	   * to assert that the target is equal to its expected value, rather than not
	   * equal to `true`.
	   *
	   *     expect(false).to.be.false; // Recommended
	   *     expect(false).to.not.be.true; // Not recommended
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.true; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(false, 'nooo why fail??').to.be.true;
	   *
	   * @name true
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('true', function () {
	    this.assert(
	        true === flag(this, 'object')
	      , 'expected #{this} to be true'
	      , 'expected #{this} to be false'
	      , flag(this, 'negate') ? false : true
	    );
	  });

	  /**
	   * ### .false
	   *
	   * Asserts that the target is strictly (`===`) equal to `false`.
	   *
	   *     expect(false).to.be.false;
	   *
	   * Add `.not` earlier in the chain to negate `.false`. However, it's often
	   * best to assert that the target is equal to its expected value, rather than
	   * not equal to `false`.
	   *
	   *     expect(true).to.be.true; // Recommended
	   *     expect(true).to.not.be.false; // Not recommended
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.false; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(true, 'nooo why fail??').to.be.false;
	   *
	   * @name false
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('false', function () {
	    this.assert(
	        false === flag(this, 'object')
	      , 'expected #{this} to be false'
	      , 'expected #{this} to be true'
	      , flag(this, 'negate') ? true : false
	    );
	  });

	  /**
	   * ### .null
	   *
	   * Asserts that the target is strictly (`===`) equal to `null`.
	   *
	   *     expect(null).to.be.null;
	   *
	   * Add `.not` earlier in the chain to negate `.null`. However, it's often best
	   * to assert that the target is equal to its expected value, rather than not
	   * equal to `null`.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.null; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(42, 'nooo why fail??').to.be.null;
	   *
	   * @name null
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('null', function () {
	    this.assert(
	        null === flag(this, 'object')
	      , 'expected #{this} to be null'
	      , 'expected #{this} not to be null'
	    );
	  });

	  /**
	   * ### .undefined
	   *
	   * Asserts that the target is strictly (`===`) equal to `undefined`.
	   *
	   *     expect(undefined).to.be.undefined;
	   *
	   * Add `.not` earlier in the chain to negate `.undefined`. However, it's often
	   * best to assert that the target is equal to its expected value, rather than
	   * not equal to `undefined`.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.undefined; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(42, 'nooo why fail??').to.be.undefined;
	   *
	   * @name undefined
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('undefined', function () {
	    this.assert(
	        undefined === flag(this, 'object')
	      , 'expected #{this} to be undefined'
	      , 'expected #{this} not to be undefined'
	    );
	  });

	  /**
	   * ### .NaN
	   *
	   * Asserts that the target is exactly `NaN`.
	   *
	   *     expect(NaN).to.be.NaN;
	   *
	   * Add `.not` earlier in the chain to negate `.NaN`. However, it's often best
	   * to assert that the target is equal to its expected value, rather than not
	   * equal to `NaN`.
	   *
	   *     expect('foo').to.equal('foo'); // Recommended
	   *     expect('foo').to.not.be.NaN; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(42, 'nooo why fail??').to.be.NaN;
	   *
	   * @name NaN
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('NaN', function () {
	    this.assert(
	        _.isNaN(flag(this, 'object'))
	        , 'expected #{this} to be NaN'
	        , 'expected #{this} not to be NaN'
	    );
	  });

	  /**
	   * ### .exist
	   *
	   * Asserts that the target is not strictly (`===`) equal to either `null` or
	   * `undefined`. However, it's often best to assert that the target is equal to
	   * its expected value.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.exist; // Not recommended
	   *
	   *     expect(0).to.equal(0); // Recommended
	   *     expect(0).to.exist; // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.exist`.
	   *
	   *     expect(null).to.be.null; // Recommended
	   *     expect(null).to.not.exist; // Not recommended
	   *
	   *     expect(undefined).to.be.undefined; // Recommended
	   *     expect(undefined).to.not.exist; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(null, 'nooo why fail??').to.exist;
	   *
	   * @name exist
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('exist', function () {
	    var val = flag(this, 'object');
	    this.assert(
	        val !== null && val !== undefined
	      , 'expected #{this} to exist'
	      , 'expected #{this} to not exist'
	    );
	  });

	  /**
	   * ### .empty
	   *
	   * When the target is a string or array, `.empty` asserts that the target's
	   * `length` property is strictly (`===`) equal to `0`.
	   *
	   *     expect([]).to.be.empty;
	   *     expect('').to.be.empty;
	   *
	   * When the target is a map or set, `.empty` asserts that the target's `size`
	   * property is strictly equal to `0`.
	   *
	   *     expect(new Set()).to.be.empty;
	   *     expect(new Map()).to.be.empty;
	   *
	   * When the target is a non-function object, `.empty` asserts that the target
	   * doesn't have any own enumerable properties. Properties with Symbol-based
	   * keys are excluded from the count.
	   *
	   *     expect({}).to.be.empty;
	   *
	   * Because `.empty` does different things based on the target's type, it's
	   * important to check the target's type before using `.empty`. See the `.a`
	   * doc for info on testing a target's type.
	   *
	   *     expect([]).to.be.an('array').that.is.empty;
	   *
	   * Add `.not` earlier in the chain to negate `.empty`. However, it's often
	   * best to assert that the target contains its expected number of values,
	   * rather than asserting that it's not empty.
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
	   *     expect([1, 2, 3]).to.not.be.empty; // Not recommended
	   *
	   *     expect(new Set([1, 2, 3])).to.have.property('size', 3); // Recommended
	   *     expect(new Set([1, 2, 3])).to.not.be.empty; // Not recommended
	   *
	   *     expect(Object.keys({a: 1})).to.have.lengthOf(1); // Recommended
	   *     expect({a: 1}).to.not.be.empty; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect([1, 2, 3], 'nooo why fail??').to.be.empty;
	   *
	   * @name empty
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('empty', function () {
	    var val = flag(this, 'object')
	      , ssfi = flag(this, 'ssfi')
	      , flagMsg = flag(this, 'message')
	      , itemsCount;

	    flagMsg = flagMsg ? flagMsg + ': ' : '';

	    switch (_.type(val).toLowerCase()) {
	      case 'array':
	      case 'string':
	        itemsCount = val.length;
	        break;
	      case 'map':
	      case 'set':
	        itemsCount = val.size;
	        break;
	      case 'weakmap':
	      case 'weakset':
	        throw new AssertionError(
	          flagMsg + '.empty was passed a weak collection',
	          undefined,
	          ssfi
	        );
	      case 'function':
	        var msg = flagMsg + '.empty was passed a function ' + _.getName(val);
	        throw new AssertionError(msg.trim(), undefined, ssfi);
	      default:
	        if (val !== Object(val)) {
	          throw new AssertionError(
	            flagMsg + '.empty was passed non-string primitive ' + _.inspect(val),
	            undefined,
	            ssfi
	          );
	        }
	        itemsCount = Object.keys(val).length;
	    }

	    this.assert(
	        0 === itemsCount
	      , 'expected #{this} to be empty'
	      , 'expected #{this} not to be empty'
	    );
	  });

	  /**
	   * ### .arguments
	   *
	   * Asserts that the target is an `arguments` object.
	   *
	   *     function test () {
	   *       expect(arguments).to.be.arguments;
	   *     }
	   *
	   *     test();
	   *
	   * Add `.not` earlier in the chain to negate `.arguments`. However, it's often
	   * best to assert which type the target is expected to be, rather than
	   * asserting that its not an `arguments` object.
	   *
	   *     expect('foo').to.be.a('string'); // Recommended
	   *     expect('foo').to.not.be.arguments; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect({}, 'nooo why fail??').to.be.arguments;
	   *
	   * The alias `.Arguments` can be used interchangeably with `.arguments`.
	   *
	   * @name arguments
	   * @alias Arguments
	   * @namespace BDD
	   * @api public
	   */

	  function checkArguments () {
	    var obj = flag(this, 'object')
	      , type = _.type(obj);
	    this.assert(
	        'Arguments' === type
	      , 'expected #{this} to be arguments but got ' + type
	      , 'expected #{this} to not be arguments'
	    );
	  }

	  Assertion.addProperty('arguments', checkArguments);
	  Assertion.addProperty('Arguments', checkArguments);

	  /**
	   * ### .equal(val[, msg])
	   *
	   * Asserts that the target is strictly (`===`) equal to the given `val`.
	   *
	   *     expect(1).to.equal(1);
	   *     expect('foo').to.equal('foo');
	   *
	   * Add `.deep` earlier in the chain to use deep equality instead. See the
	   * `deep-eql` project page for info on the deep equality algorithm:
	   * https://github.com/chaijs/deep-eql.
	   *
	   *     // Target object deeply (but not strictly) equals `{a: 1}`
	   *     expect({a: 1}).to.deep.equal({a: 1});
	   *     expect({a: 1}).to.not.equal({a: 1});
	   *
	   *     // Target array deeply (but not strictly) equals `[1, 2]`
	   *     expect([1, 2]).to.deep.equal([1, 2]);
	   *     expect([1, 2]).to.not.equal([1, 2]);
	   *
	   * Add `.not` earlier in the chain to negate `.equal`. However, it's often
	   * best to assert that the target is equal to its expected value, rather than
	   * not equal to one of countless unexpected values.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.equal(2); // Not recommended
	   *
	   * `.equal` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect(1).to.equal(2, 'nooo why fail??');
	   *     expect(1, 'nooo why fail??').to.equal(2);
	   *
	   * The aliases `.equals` and `eq` can be used interchangeably with `.equal`.
	   *
	   * @name equal
	   * @alias equals
	   * @alias eq
	   * @param {Mixed} val
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertEqual (val, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object');
	    if (flag(this, 'deep')) {
	      var prevLockSsfi = flag(this, 'lockSsfi');
	      flag(this, 'lockSsfi', true);
	      this.eql(val);
	      flag(this, 'lockSsfi', prevLockSsfi);
	    } else {
	      this.assert(
	          val === obj
	        , 'expected #{this} to equal #{exp}'
	        , 'expected #{this} to not equal #{exp}'
	        , val
	        , this._obj
	        , true
	      );
	    }
	  }

	  Assertion.addMethod('equal', assertEqual);
	  Assertion.addMethod('equals', assertEqual);
	  Assertion.addMethod('eq', assertEqual);

	  /**
	   * ### .eql(obj[, msg])
	   *
	   * Asserts that the target is deeply equal to the given `obj`. See the
	   * `deep-eql` project page for info on the deep equality algorithm:
	   * https://github.com/chaijs/deep-eql.
	   *
	   *     // Target object is deeply (but not strictly) equal to {a: 1}
	   *     expect({a: 1}).to.eql({a: 1}).but.not.equal({a: 1});
	   *
	   *     // Target array is deeply (but not strictly) equal to [1, 2]
	   *     expect([1, 2]).to.eql([1, 2]).but.not.equal([1, 2]);
	   *
	   * Add `.not` earlier in the chain to negate `.eql`. However, it's often best
	   * to assert that the target is deeply equal to its expected value, rather
	   * than not deeply equal to one of countless unexpected values.
	   *
	   *     expect({a: 1}).to.eql({a: 1}); // Recommended
	   *     expect({a: 1}).to.not.eql({b: 2}); // Not recommended
	   *
	   * `.eql` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect({a: 1}).to.eql({b: 2}, 'nooo why fail??');
	   *     expect({a: 1}, 'nooo why fail??').to.eql({b: 2});
	   *
	   * The alias `.eqls` can be used interchangeably with `.eql`.
	   *
	   * The `.deep.equal` assertion is almost identical to `.eql` but with one
	   * difference: `.deep.equal` causes deep equality comparisons to also be used
	   * for any other assertions that follow in the chain.
	   *
	   * @name eql
	   * @alias eqls
	   * @param {Mixed} obj
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertEql(obj, msg) {
	    if (msg) flag(this, 'message', msg);
	    this.assert(
	        _.eql(obj, flag(this, 'object'))
	      , 'expected #{this} to deeply equal #{exp}'
	      , 'expected #{this} to not deeply equal #{exp}'
	      , obj
	      , this._obj
	      , true
	    );
	  }

	  Assertion.addMethod('eql', assertEql);
	  Assertion.addMethod('eqls', assertEql);

	  /**
	   * ### .above(n[, msg])
	   *
	   * Asserts that the target is a number or a date greater than the given number or date `n` respectively.
	   * However, it's often best to assert that the target is equal to its expected
	   * value.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(2).to.be.above(1); // Not recommended
	   *
	   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
	   * or `size` is greater than the given number `n`.
	   *
	   *     expect('foo').to.have.lengthOf(3); // Recommended
	   *     expect('foo').to.have.lengthOf.above(2); // Not recommended
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
	   *     expect([1, 2, 3]).to.have.lengthOf.above(2); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.above`.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(1).to.not.be.above(2); // Not recommended
	   *
	   * `.above` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect(1).to.be.above(2, 'nooo why fail??');
	   *     expect(1, 'nooo why fail??').to.be.above(2);
	   *
	   * The aliases `.gt` and `.greaterThan` can be used interchangeably with
	   * `.above`.
	   *
	   * @name above
	   * @alias gt
	   * @alias greaterThan
	   * @param {Number} n
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertAbove (n, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , doLength = flag(this, 'doLength')
	      , flagMsg = flag(this, 'message')
	      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
	      , ssfi = flag(this, 'ssfi')
	      , objType = _.type(obj).toLowerCase()
	      , nType = _.type(n).toLowerCase()
	      , errorMessage
	      , shouldThrow = true;

	    if (doLength && objType !== 'map' && objType !== 'set') {
	      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
	    }

	    if (!doLength && (objType === 'date' && nType !== 'date')) {
	      errorMessage = msgPrefix + 'the argument to above must be a date';
	    } else if (nType !== 'number' && (doLength || objType === 'number')) {
	      errorMessage = msgPrefix + 'the argument to above must be a number';
	    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
	      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
	      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
	    } else {
	      shouldThrow = false;
	    }

	    if (shouldThrow) {
	      throw new AssertionError(errorMessage, undefined, ssfi);
	    }

	    if (doLength) {
	      var descriptor = 'length'
	        , itemsCount;
	      if (objType === 'map' || objType === 'set') {
	        descriptor = 'size';
	        itemsCount = obj.size;
	      } else {
	        itemsCount = obj.length;
	      }
	      this.assert(
	          itemsCount > n
	        , 'expected #{this} to have a ' + descriptor + ' above #{exp} but got #{act}'
	        , 'expected #{this} to not have a ' + descriptor + ' above #{exp}'
	        , n
	        , itemsCount
	      );
	    } else {
	      this.assert(
	          obj > n
	        , 'expected #{this} to be above #{exp}'
	        , 'expected #{this} to be at most #{exp}'
	        , n
	      );
	    }
	  }

	  Assertion.addMethod('above', assertAbove);
	  Assertion.addMethod('gt', assertAbove);
	  Assertion.addMethod('greaterThan', assertAbove);

	  /**
	   * ### .least(n[, msg])
	   *
	   * Asserts that the target is a number or a date greater than or equal to the given
	   * number or date `n` respectively. However, it's often best to assert that the target is equal to
	   * its expected value.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(2).to.be.at.least(1); // Not recommended
	   *     expect(2).to.be.at.least(2); // Not recommended
	   *
	   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
	   * or `size` is greater than or equal to the given number `n`.
	   *
	   *     expect('foo').to.have.lengthOf(3); // Recommended
	   *     expect('foo').to.have.lengthOf.at.least(2); // Not recommended
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
	   *     expect([1, 2, 3]).to.have.lengthOf.at.least(2); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.least`.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.at.least(2); // Not recommended
	   *
	   * `.least` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect(1).to.be.at.least(2, 'nooo why fail??');
	   *     expect(1, 'nooo why fail??').to.be.at.least(2);
	   *
	   * The alias `.gte` can be used interchangeably with `.least`.
	   *
	   * @name least
	   * @alias gte
	   * @param {Number} n
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertLeast (n, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , doLength = flag(this, 'doLength')
	      , flagMsg = flag(this, 'message')
	      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
	      , ssfi = flag(this, 'ssfi')
	      , objType = _.type(obj).toLowerCase()
	      , nType = _.type(n).toLowerCase()
	      , errorMessage
	      , shouldThrow = true;

	    if (doLength && objType !== 'map' && objType !== 'set') {
	      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
	    }

	    if (!doLength && (objType === 'date' && nType !== 'date')) {
	      errorMessage = msgPrefix + 'the argument to least must be a date';
	    } else if (nType !== 'number' && (doLength || objType === 'number')) {
	      errorMessage = msgPrefix + 'the argument to least must be a number';
	    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
	      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
	      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
	    } else {
	      shouldThrow = false;
	    }

	    if (shouldThrow) {
	      throw new AssertionError(errorMessage, undefined, ssfi);
	    }

	    if (doLength) {
	      var descriptor = 'length'
	        , itemsCount;
	      if (objType === 'map' || objType === 'set') {
	        descriptor = 'size';
	        itemsCount = obj.size;
	      } else {
	        itemsCount = obj.length;
	      }
	      this.assert(
	          itemsCount >= n
	        , 'expected #{this} to have a ' + descriptor + ' at least #{exp} but got #{act}'
	        , 'expected #{this} to have a ' + descriptor + ' below #{exp}'
	        , n
	        , itemsCount
	      );
	    } else {
	      this.assert(
	          obj >= n
	        , 'expected #{this} to be at least #{exp}'
	        , 'expected #{this} to be below #{exp}'
	        , n
	      );
	    }
	  }

	  Assertion.addMethod('least', assertLeast);
	  Assertion.addMethod('gte', assertLeast);

	  /**
	   * ### .below(n[, msg])
	   *
	   * Asserts that the target is a number or a date less than the given number or date `n` respectively.
	   * However, it's often best to assert that the target is equal to its expected
	   * value.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.be.below(2); // Not recommended
	   *
	   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
	   * or `size` is less than the given number `n`.
	   *
	   *     expect('foo').to.have.lengthOf(3); // Recommended
	   *     expect('foo').to.have.lengthOf.below(4); // Not recommended
	   *
	   *     expect([1, 2, 3]).to.have.length(3); // Recommended
	   *     expect([1, 2, 3]).to.have.lengthOf.below(4); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.below`.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(2).to.not.be.below(1); // Not recommended
	   *
	   * `.below` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect(2).to.be.below(1, 'nooo why fail??');
	   *     expect(2, 'nooo why fail??').to.be.below(1);
	   *
	   * The aliases `.lt` and `.lessThan` can be used interchangeably with
	   * `.below`.
	   *
	   * @name below
	   * @alias lt
	   * @alias lessThan
	   * @param {Number} n
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertBelow (n, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , doLength = flag(this, 'doLength')
	      , flagMsg = flag(this, 'message')
	      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
	      , ssfi = flag(this, 'ssfi')
	      , objType = _.type(obj).toLowerCase()
	      , nType = _.type(n).toLowerCase()
	      , errorMessage
	      , shouldThrow = true;

	    if (doLength && objType !== 'map' && objType !== 'set') {
	      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
	    }

	    if (!doLength && (objType === 'date' && nType !== 'date')) {
	      errorMessage = msgPrefix + 'the argument to below must be a date';
	    } else if (nType !== 'number' && (doLength || objType === 'number')) {
	      errorMessage = msgPrefix + 'the argument to below must be a number';
	    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
	      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
	      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
	    } else {
	      shouldThrow = false;
	    }

	    if (shouldThrow) {
	      throw new AssertionError(errorMessage, undefined, ssfi);
	    }

	    if (doLength) {
	      var descriptor = 'length'
	        , itemsCount;
	      if (objType === 'map' || objType === 'set') {
	        descriptor = 'size';
	        itemsCount = obj.size;
	      } else {
	        itemsCount = obj.length;
	      }
	      this.assert(
	          itemsCount < n
	        , 'expected #{this} to have a ' + descriptor + ' below #{exp} but got #{act}'
	        , 'expected #{this} to not have a ' + descriptor + ' below #{exp}'
	        , n
	        , itemsCount
	      );
	    } else {
	      this.assert(
	          obj < n
	        , 'expected #{this} to be below #{exp}'
	        , 'expected #{this} to be at least #{exp}'
	        , n
	      );
	    }
	  }

	  Assertion.addMethod('below', assertBelow);
	  Assertion.addMethod('lt', assertBelow);
	  Assertion.addMethod('lessThan', assertBelow);

	  /**
	   * ### .most(n[, msg])
	   *
	   * Asserts that the target is a number or a date less than or equal to the given number
	   * or date `n` respectively. However, it's often best to assert that the target is equal to its
	   * expected value.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.be.at.most(2); // Not recommended
	   *     expect(1).to.be.at.most(1); // Not recommended
	   *
	   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
	   * or `size` is less than or equal to the given number `n`.
	   *
	   *     expect('foo').to.have.lengthOf(3); // Recommended
	   *     expect('foo').to.have.lengthOf.at.most(4); // Not recommended
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
	   *     expect([1, 2, 3]).to.have.lengthOf.at.most(4); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.most`.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(2).to.not.be.at.most(1); // Not recommended
	   *
	   * `.most` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect(2).to.be.at.most(1, 'nooo why fail??');
	   *     expect(2, 'nooo why fail??').to.be.at.most(1);
	   *
	   * The alias `.lte` can be used interchangeably with `.most`.
	   *
	   * @name most
	   * @alias lte
	   * @param {Number} n
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertMost (n, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , doLength = flag(this, 'doLength')
	      , flagMsg = flag(this, 'message')
	      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
	      , ssfi = flag(this, 'ssfi')
	      , objType = _.type(obj).toLowerCase()
	      , nType = _.type(n).toLowerCase()
	      , errorMessage
	      , shouldThrow = true;

	    if (doLength && objType !== 'map' && objType !== 'set') {
	      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
	    }

	    if (!doLength && (objType === 'date' && nType !== 'date')) {
	      errorMessage = msgPrefix + 'the argument to most must be a date';
	    } else if (nType !== 'number' && (doLength || objType === 'number')) {
	      errorMessage = msgPrefix + 'the argument to most must be a number';
	    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
	      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
	      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
	    } else {
	      shouldThrow = false;
	    }

	    if (shouldThrow) {
	      throw new AssertionError(errorMessage, undefined, ssfi);
	    }

	    if (doLength) {
	      var descriptor = 'length'
	        , itemsCount;
	      if (objType === 'map' || objType === 'set') {
	        descriptor = 'size';
	        itemsCount = obj.size;
	      } else {
	        itemsCount = obj.length;
	      }
	      this.assert(
	          itemsCount <= n
	        , 'expected #{this} to have a ' + descriptor + ' at most #{exp} but got #{act}'
	        , 'expected #{this} to have a ' + descriptor + ' above #{exp}'
	        , n
	        , itemsCount
	      );
	    } else {
	      this.assert(
	          obj <= n
	        , 'expected #{this} to be at most #{exp}'
	        , 'expected #{this} to be above #{exp}'
	        , n
	      );
	    }
	  }

	  Assertion.addMethod('most', assertMost);
	  Assertion.addMethod('lte', assertMost);

	  /**
	   * ### .within(start, finish[, msg])
	   *
	   * Asserts that the target is a number or a date greater than or equal to the given
	   * number or date `start`, and less than or equal to the given number or date `finish` respectively.
	   * However, it's often best to assert that the target is equal to its expected
	   * value.
	   *
	   *     expect(2).to.equal(2); // Recommended
	   *     expect(2).to.be.within(1, 3); // Not recommended
	   *     expect(2).to.be.within(2, 3); // Not recommended
	   *     expect(2).to.be.within(1, 2); // Not recommended
	   *
	   * Add `.lengthOf` earlier in the chain to assert that the target's `length`
	   * or `size` is greater than or equal to the given number `start`, and less
	   * than or equal to the given number `finish`.
	   *
	   *     expect('foo').to.have.lengthOf(3); // Recommended
	   *     expect('foo').to.have.lengthOf.within(2, 4); // Not recommended
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
	   *     expect([1, 2, 3]).to.have.lengthOf.within(2, 4); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.within`.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.within(2, 4); // Not recommended
	   *
	   * `.within` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect(4).to.be.within(1, 3, 'nooo why fail??');
	   *     expect(4, 'nooo why fail??').to.be.within(1, 3);
	   *
	   * @name within
	   * @param {Number} start lower bound inclusive
	   * @param {Number} finish upper bound inclusive
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addMethod('within', function (start, finish, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , doLength = flag(this, 'doLength')
	      , flagMsg = flag(this, 'message')
	      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
	      , ssfi = flag(this, 'ssfi')
	      , objType = _.type(obj).toLowerCase()
	      , startType = _.type(start).toLowerCase()
	      , finishType = _.type(finish).toLowerCase()
	      , errorMessage
	      , shouldThrow = true
	      , range = (startType === 'date' && finishType === 'date')
	          ? start.toUTCString() + '..' + finish.toUTCString()
	          : start + '..' + finish;

	    if (doLength && objType !== 'map' && objType !== 'set') {
	      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
	    }

	    if (!doLength && (objType === 'date' && (startType !== 'date' || finishType !== 'date'))) {
	      errorMessage = msgPrefix + 'the arguments to within must be dates';
	    } else if ((startType !== 'number' || finishType !== 'number') && (doLength || objType === 'number')) {
	      errorMessage = msgPrefix + 'the arguments to within must be numbers';
	    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
	      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
	      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
	    } else {
	      shouldThrow = false;
	    }

	    if (shouldThrow) {
	      throw new AssertionError(errorMessage, undefined, ssfi);
	    }

	    if (doLength) {
	      var descriptor = 'length'
	        , itemsCount;
	      if (objType === 'map' || objType === 'set') {
	        descriptor = 'size';
	        itemsCount = obj.size;
	      } else {
	        itemsCount = obj.length;
	      }
	      this.assert(
	          itemsCount >= start && itemsCount <= finish
	        , 'expected #{this} to have a ' + descriptor + ' within ' + range
	        , 'expected #{this} to not have a ' + descriptor + ' within ' + range
	      );
	    } else {
	      this.assert(
	          obj >= start && obj <= finish
	        , 'expected #{this} to be within ' + range
	        , 'expected #{this} to not be within ' + range
	      );
	    }
	  });

	  /**
	   * ### .instanceof(constructor[, msg])
	   *
	   * Asserts that the target is an instance of the given `constructor`.
	   *
	   *     function Cat () { }
	   *
	   *     expect(new Cat()).to.be.an.instanceof(Cat);
	   *     expect([1, 2]).to.be.an.instanceof(Array);
	   *
	   * Add `.not` earlier in the chain to negate `.instanceof`.
	   *
	   *     expect({a: 1}).to.not.be.an.instanceof(Array);
	   *
	   * `.instanceof` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect(1).to.be.an.instanceof(Array, 'nooo why fail??');
	   *     expect(1, 'nooo why fail??').to.be.an.instanceof(Array);
	   *
	   * Due to limitations in ES5, `.instanceof` may not always work as expected
	   * when using a transpiler such as Babel or TypeScript. In particular, it may
	   * produce unexpected results when subclassing built-in object such as
	   * `Array`, `Error`, and `Map`. See your transpiler's docs for details:
	   *
	   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
	   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
	   *
	   * The alias `.instanceOf` can be used interchangeably with `.instanceof`.
	   *
	   * @name instanceof
	   * @param {Constructor} constructor
	   * @param {String} msg _optional_
	   * @alias instanceOf
	   * @namespace BDD
	   * @api public
	   */

	  function assertInstanceOf (constructor, msg) {
	    if (msg) flag(this, 'message', msg);

	    var target = flag(this, 'object');
	    var ssfi = flag(this, 'ssfi');
	    var flagMsg = flag(this, 'message');

	    try {
	      var isInstanceOf = target instanceof constructor;
	    } catch (err) {
	      if (err instanceof TypeError) {
	        flagMsg = flagMsg ? flagMsg + ': ' : '';
	        throw new AssertionError(
	          flagMsg + 'The instanceof assertion needs a constructor but '
	            + _.type(constructor) + ' was given.',
	          undefined,
	          ssfi
	        );
	      }
	      throw err;
	    }

	    var name = _.getName(constructor);
	    if (name === null) {
	      name = 'an unnamed constructor';
	    }

	    this.assert(
	        isInstanceOf
	      , 'expected #{this} to be an instance of ' + name
	      , 'expected #{this} to not be an instance of ' + name
	    );
	  }
	  Assertion.addMethod('instanceof', assertInstanceOf);
	  Assertion.addMethod('instanceOf', assertInstanceOf);

	  /**
	   * ### .property(name[, val[, msg]])
	   *
	   * Asserts that the target has a property with the given key `name`.
	   *
	   *     expect({a: 1}).to.have.property('a');
	   *
	   * When `val` is provided, `.property` also asserts that the property's value
	   * is equal to the given `val`.
	   *
	   *     expect({a: 1}).to.have.property('a', 1);
	   *
	   * By default, strict (`===`) equality is used. Add `.deep` earlier in the
	   * chain to use deep equality instead. See the `deep-eql` project page for
	   * info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
	   *
	   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
	   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
	   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
	   *
	   * The target's enumerable and non-enumerable properties are always included
	   * in the search. By default, both own and inherited properties are included.
	   * Add `.own` earlier in the chain to exclude inherited properties from the
	   * search.
	   *
	   *     Object.prototype.b = 2;
	   *
	   *     expect({a: 1}).to.have.own.property('a');
	   *     expect({a: 1}).to.have.own.property('a', 1);
	   *     expect({a: 1}).to.have.property('b');
	   *     expect({a: 1}).to.not.have.own.property('b');
	   *
	   * `.deep` and `.own` can be combined.
	   *
	   *     expect({x: {a: 1}}).to.have.deep.own.property('x', {a: 1});
	   *
	   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
	   * referencing nested properties.
	   *
	   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
	   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]', 'y');
	   *
	   * If `.` or `[]` are part of an actual property name, they can be escaped by
	   * adding two backslashes before them.
	   *
	   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
	   *
	   * `.deep` and `.nested` can be combined.
	   *
	   *     expect({a: {b: [{c: 3}]}})
	   *       .to.have.deep.nested.property('a.b[0]', {c: 3});
	   *
	   * `.own` and `.nested` cannot be combined.
	   *
	   * Add `.not` earlier in the chain to negate `.property`.
	   *
	   *     expect({a: 1}).to.not.have.property('b');
	   *
	   * However, it's dangerous to negate `.property` when providing `val`. The
	   * problem is that it creates uncertain expectations by asserting that the
	   * target either doesn't have a property with the given key `name`, or that it
	   * does have a property with the given key `name` but its value isn't equal to
	   * the given `val`. It's often best to identify the exact output that's
	   * expected, and then write an assertion that only accepts that exact output.
	   *
	   * When the target isn't expected to have a property with the given key
	   * `name`, it's often best to assert exactly that.
	   *
	   *     expect({b: 2}).to.not.have.property('a'); // Recommended
	   *     expect({b: 2}).to.not.have.property('a', 1); // Not recommended
	   *
	   * When the target is expected to have a property with the given key `name`,
	   * it's often best to assert that the property has its expected value, rather
	   * than asserting that it doesn't have one of many unexpected values.
	   *
	   *     expect({a: 3}).to.have.property('a', 3); // Recommended
	   *     expect({a: 3}).to.not.have.property('a', 1); // Not recommended
	   *
	   * `.property` changes the target of any assertions that follow in the chain
	   * to be the value of the property from the original target object.
	   *
	   *     expect({a: 1}).to.have.property('a').that.is.a('number');
	   *
	   * `.property` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`. When not providing `val`, only use the
	   * second form.
	   *
	   *     // Recommended
	   *     expect({a: 1}).to.have.property('a', 2, 'nooo why fail??');
	   *     expect({a: 1}, 'nooo why fail??').to.have.property('a', 2);
	   *     expect({a: 1}, 'nooo why fail??').to.have.property('b');
	   *
	   *     // Not recommended
	   *     expect({a: 1}).to.have.property('b', undefined, 'nooo why fail??');
	   *
	   * The above assertion isn't the same thing as not providing `val`. Instead,
	   * it's asserting that the target object has a `b` property that's equal to
	   * `undefined`.
	   *
	   * The assertions `.ownProperty` and `.haveOwnProperty` can be used
	   * interchangeably with `.own.property`.
	   *
	   * @name property
	   * @param {String} name
	   * @param {Mixed} val (optional)
	   * @param {String} msg _optional_
	   * @returns value of property for chaining
	   * @namespace BDD
	   * @api public
	   */

	  function assertProperty (name, val, msg) {
	    if (msg) flag(this, 'message', msg);

	    var isNested = flag(this, 'nested')
	      , isOwn = flag(this, 'own')
	      , flagMsg = flag(this, 'message')
	      , obj = flag(this, 'object')
	      , ssfi = flag(this, 'ssfi')
	      , nameType = typeof name;

	    flagMsg = flagMsg ? flagMsg + ': ' : '';

	    if (isNested) {
	      if (nameType !== 'string') {
	        throw new AssertionError(
	          flagMsg + 'the argument to property must be a string when using nested syntax',
	          undefined,
	          ssfi
	        );
	      }
	    } else {
	      if (nameType !== 'string' && nameType !== 'number' && nameType !== 'symbol') {
	        throw new AssertionError(
	          flagMsg + 'the argument to property must be a string, number, or symbol',
	          undefined,
	          ssfi
	        );
	      }
	    }

	    if (isNested && isOwn) {
	      throw new AssertionError(
	        flagMsg + 'The "nested" and "own" flags cannot be combined.',
	        undefined,
	        ssfi
	      );
	    }

	    if (obj === null || obj === undefined) {
	      throw new AssertionError(
	        flagMsg + 'Target cannot be null or undefined.',
	        undefined,
	        ssfi
	      );
	    }

	    var isDeep = flag(this, 'deep')
	      , negate = flag(this, 'negate')
	      , pathInfo = isNested ? _.getPathInfo(obj, name) : null
	      , value = isNested ? pathInfo.value : obj[name];

	    var descriptor = '';
	    if (isDeep) descriptor += 'deep ';
	    if (isOwn) descriptor += 'own ';
	    if (isNested) descriptor += 'nested ';
	    descriptor += 'property ';

	    var hasProperty;
	    if (isOwn) hasProperty = Object.prototype.hasOwnProperty.call(obj, name);
	    else if (isNested) hasProperty = pathInfo.exists;
	    else hasProperty = _.hasProperty(obj, name);

	    // When performing a negated assertion for both name and val, merely having
	    // a property with the given name isn't enough to cause the assertion to
	    // fail. It must both have a property with the given name, and the value of
	    // that property must equal the given val. Therefore, skip this assertion in
	    // favor of the next.
	    if (!negate || arguments.length === 1) {
	      this.assert(
	          hasProperty
	        , 'expected #{this} to have ' + descriptor + _.inspect(name)
	        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
	    }

	    if (arguments.length > 1) {
	      this.assert(
	          hasProperty && (isDeep ? _.eql(val, value) : val === value)
	        , 'expected #{this} to have ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
	        , 'expected #{this} to not have ' + descriptor + _.inspect(name) + ' of #{act}'
	        , val
	        , value
	      );
	    }

	    flag(this, 'object', value);
	  }

	  Assertion.addMethod('property', assertProperty);

	  function assertOwnProperty (name, value, msg) {
	    flag(this, 'own', true);
	    assertProperty.apply(this, arguments);
	  }

	  Assertion.addMethod('ownProperty', assertOwnProperty);
	  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

	  /**
	   * ### .ownPropertyDescriptor(name[, descriptor[, msg]])
	   *
	   * Asserts that the target has its own property descriptor with the given key
	   * `name`. Enumerable and non-enumerable properties are included in the
	   * search.
	   *
	   *     expect({a: 1}).to.have.ownPropertyDescriptor('a');
	   *
	   * When `descriptor` is provided, `.ownPropertyDescriptor` also asserts that
	   * the property's descriptor is deeply equal to the given `descriptor`. See
	   * the `deep-eql` project page for info on the deep equality algorithm:
	   * https://github.com/chaijs/deep-eql.
	   *
	   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
	   *       configurable: true,
	   *       enumerable: true,
	   *       writable: true,
	   *       value: 1,
	   *     });
	   *
	   * Add `.not` earlier in the chain to negate `.ownPropertyDescriptor`.
	   *
	   *     expect({a: 1}).to.not.have.ownPropertyDescriptor('b');
	   *
	   * However, it's dangerous to negate `.ownPropertyDescriptor` when providing
	   * a `descriptor`. The problem is that it creates uncertain expectations by
	   * asserting that the target either doesn't have a property descriptor with
	   * the given key `name`, or that it does have a property descriptor with the
	   * given key `name` but its not deeply equal to the given `descriptor`. It's
	   * often best to identify the exact output that's expected, and then write an
	   * assertion that only accepts that exact output.
	   *
	   * When the target isn't expected to have a property descriptor with the given
	   * key `name`, it's often best to assert exactly that.
	   *
	   *     // Recommended
	   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a');
	   *
	   *     // Not recommended
	   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a', {
	   *       configurable: true,
	   *       enumerable: true,
	   *       writable: true,
	   *       value: 1,
	   *     });
	   *
	   * When the target is expected to have a property descriptor with the given
	   * key `name`, it's often best to assert that the property has its expected
	   * descriptor, rather than asserting that it doesn't have one of many
	   * unexpected descriptors.
	   *
	   *     // Recommended
	   *     expect({a: 3}).to.have.ownPropertyDescriptor('a', {
	   *       configurable: true,
	   *       enumerable: true,
	   *       writable: true,
	   *       value: 3,
	   *     });
	   *
	   *     // Not recommended
	   *     expect({a: 3}).to.not.have.ownPropertyDescriptor('a', {
	   *       configurable: true,
	   *       enumerable: true,
	   *       writable: true,
	   *       value: 1,
	   *     });
	   *
	   * `.ownPropertyDescriptor` changes the target of any assertions that follow
	   * in the chain to be the value of the property descriptor from the original
	   * target object.
	   *
	   *     expect({a: 1}).to.have.ownPropertyDescriptor('a')
	   *       .that.has.property('enumerable', true);
	   *
	   * `.ownPropertyDescriptor` accepts an optional `msg` argument which is a
	   * custom error message to show when the assertion fails. The message can also
	   * be given as the second argument to `expect`. When not providing
	   * `descriptor`, only use the second form.
	   *
	   *     // Recommended
	   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
	   *       configurable: true,
	   *       enumerable: true,
	   *       writable: true,
	   *       value: 2,
	   *     }, 'nooo why fail??');
	   *
	   *     // Recommended
	   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('a', {
	   *       configurable: true,
	   *       enumerable: true,
	   *       writable: true,
	   *       value: 2,
	   *     });
	   *
	   *     // Recommended
	   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('b');
	   *
	   *     // Not recommended
	   *     expect({a: 1})
	   *       .to.have.ownPropertyDescriptor('b', undefined, 'nooo why fail??');
	   *
	   * The above assertion isn't the same thing as not providing `descriptor`.
	   * Instead, it's asserting that the target object has a `b` property
	   * descriptor that's deeply equal to `undefined`.
	   *
	   * The alias `.haveOwnPropertyDescriptor` can be used interchangeably with
	   * `.ownPropertyDescriptor`.
	   *
	   * @name ownPropertyDescriptor
	   * @alias haveOwnPropertyDescriptor
	   * @param {String} name
	   * @param {Object} descriptor _optional_
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertOwnPropertyDescriptor (name, descriptor, msg) {
	    if (typeof descriptor === 'string') {
	      msg = descriptor;
	      descriptor = null;
	    }
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object');
	    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
	    if (actualDescriptor && descriptor) {
	      this.assert(
	          _.eql(descriptor, actualDescriptor)
	        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
	        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
	        , descriptor
	        , actualDescriptor
	        , true
	      );
	    } else {
	      this.assert(
	          actualDescriptor
	        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
	        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
	      );
	    }
	    flag(this, 'object', actualDescriptor);
	  }

	  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
	  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

	  /**
	   * ### .lengthOf(n[, msg])
	   *
	   * Asserts that the target's `length` or `size` is equal to the given number
	   * `n`.
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(3);
	   *     expect('foo').to.have.lengthOf(3);
	   *     expect(new Set([1, 2, 3])).to.have.lengthOf(3);
	   *     expect(new Map([['a', 1], ['b', 2], ['c', 3]])).to.have.lengthOf(3);
	   *
	   * Add `.not` earlier in the chain to negate `.lengthOf`. However, it's often
	   * best to assert that the target's `length` property is equal to its expected
	   * value, rather than not equal to one of many unexpected values.
	   *
	   *     expect('foo').to.have.lengthOf(3); // Recommended
	   *     expect('foo').to.not.have.lengthOf(4); // Not recommended
	   *
	   * `.lengthOf` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect([1, 2, 3]).to.have.lengthOf(2, 'nooo why fail??');
	   *     expect([1, 2, 3], 'nooo why fail??').to.have.lengthOf(2);
	   *
	   * `.lengthOf` can also be used as a language chain, causing all `.above`,
	   * `.below`, `.least`, `.most`, and `.within` assertions that follow in the
	   * chain to use the target's `length` property as the target. However, it's
	   * often best to assert that the target's `length` property is equal to its
	   * expected length, rather than asserting that its `length` property falls
	   * within some range of values.
	   *
	   *     // Recommended
	   *     expect([1, 2, 3]).to.have.lengthOf(3);
	   *
	   *     // Not recommended
	   *     expect([1, 2, 3]).to.have.lengthOf.above(2);
	   *     expect([1, 2, 3]).to.have.lengthOf.below(4);
	   *     expect([1, 2, 3]).to.have.lengthOf.at.least(3);
	   *     expect([1, 2, 3]).to.have.lengthOf.at.most(3);
	   *     expect([1, 2, 3]).to.have.lengthOf.within(2,4);
	   *
	   * Due to a compatibility issue, the alias `.length` can't be chained directly
	   * off of an uninvoked method such as `.a`. Therefore, `.length` can't be used
	   * interchangeably with `.lengthOf` in every situation. It's recommended to
	   * always use `.lengthOf` instead of `.length`.
	   *
	   *     expect([1, 2, 3]).to.have.a.length(3); // incompatible; throws error
	   *     expect([1, 2, 3]).to.have.a.lengthOf(3);  // passes as expected
	   *
	   * @name lengthOf
	   * @alias length
	   * @param {Number} n
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertLengthChain () {
	    flag(this, 'doLength', true);
	  }

	  function assertLength (n, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , objType = _.type(obj).toLowerCase()
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi')
	      , descriptor = 'length'
	      , itemsCount;

	    switch (objType) {
	      case 'map':
	      case 'set':
	        descriptor = 'size';
	        itemsCount = obj.size;
	        break;
	      default:
	        new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
	        itemsCount = obj.length;
	    }

	    this.assert(
	        itemsCount == n
	      , 'expected #{this} to have a ' + descriptor + ' of #{exp} but got #{act}'
	      , 'expected #{this} to not have a ' + descriptor + ' of #{act}'
	      , n
	      , itemsCount
	    );
	  }

	  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
	  Assertion.addChainableMethod('lengthOf', assertLength, assertLengthChain);

	  /**
	   * ### .match(re[, msg])
	   *
	   * Asserts that the target matches the given regular expression `re`.
	   *
	   *     expect('foobar').to.match(/^foo/);
	   *
	   * Add `.not` earlier in the chain to negate `.match`.
	   *
	   *     expect('foobar').to.not.match(/taco/);
	   *
	   * `.match` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect('foobar').to.match(/taco/, 'nooo why fail??');
	   *     expect('foobar', 'nooo why fail??').to.match(/taco/);
	   *
	   * The alias `.matches` can be used interchangeably with `.match`.
	   *
	   * @name match
	   * @alias matches
	   * @param {RegExp} re
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */
	  function assertMatch(re, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object');
	    this.assert(
	        re.exec(obj)
	      , 'expected #{this} to match ' + re
	      , 'expected #{this} not to match ' + re
	    );
	  }

	  Assertion.addMethod('match', assertMatch);
	  Assertion.addMethod('matches', assertMatch);

	  /**
	   * ### .string(str[, msg])
	   *
	   * Asserts that the target string contains the given substring `str`.
	   *
	   *     expect('foobar').to.have.string('bar');
	   *
	   * Add `.not` earlier in the chain to negate `.string`.
	   *
	   *     expect('foobar').to.not.have.string('taco');
	   *
	   * `.string` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect('foobar').to.have.string('taco', 'nooo why fail??');
	   *     expect('foobar', 'nooo why fail??').to.have.string('taco');
	   *
	   * @name string
	   * @param {String} str
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addMethod('string', function (str, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');
	    new Assertion(obj, flagMsg, ssfi, true).is.a('string');

	    this.assert(
	        ~obj.indexOf(str)
	      , 'expected #{this} to contain ' + _.inspect(str)
	      , 'expected #{this} to not contain ' + _.inspect(str)
	    );
	  });

	  /**
	   * ### .keys(key1[, key2[, ...]])
	   *
	   * Asserts that the target object, array, map, or set has the given keys. Only
	   * the target's own inherited properties are included in the search.
	   *
	   * When the target is an object or array, keys can be provided as one or more
	   * string arguments, a single array argument, or a single object argument. In
	   * the latter case, only the keys in the given object matter; the values are
	   * ignored.
	   *
	   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
	   *     expect(['x', 'y']).to.have.all.keys(0, 1);
	   *
	   *     expect({a: 1, b: 2}).to.have.all.keys(['a', 'b']);
	   *     expect(['x', 'y']).to.have.all.keys([0, 1]);
	   *
	   *     expect({a: 1, b: 2}).to.have.all.keys({a: 4, b: 5}); // ignore 4 and 5
	   *     expect(['x', 'y']).to.have.all.keys({0: 4, 1: 5}); // ignore 4 and 5
	   *
	   * When the target is a map or set, each key must be provided as a separate
	   * argument.
	   *
	   *     expect(new Map([['a', 1], ['b', 2]])).to.have.all.keys('a', 'b');
	   *     expect(new Set(['a', 'b'])).to.have.all.keys('a', 'b');
	   *
	   * Because `.keys` does different things based on the target's type, it's
	   * important to check the target's type before using `.keys`. See the `.a` doc
	   * for info on testing a target's type.
	   *
	   *     expect({a: 1, b: 2}).to.be.an('object').that.has.all.keys('a', 'b');
	   *
	   * By default, strict (`===`) equality is used to compare keys of maps and
	   * sets. Add `.deep` earlier in the chain to use deep equality instead. See
	   * the `deep-eql` project page for info on the deep equality algorithm:
	   * https://github.com/chaijs/deep-eql.
	   *
	   *     // Target set deeply (but not strictly) has key `{a: 1}`
	   *     expect(new Set([{a: 1}])).to.have.all.deep.keys([{a: 1}]);
	   *     expect(new Set([{a: 1}])).to.not.have.all.keys([{a: 1}]);
	   *
	   * By default, the target must have all of the given keys and no more. Add
	   * `.any` earlier in the chain to only require that the target have at least
	   * one of the given keys. Also, add `.not` earlier in the chain to negate
	   * `.keys`. It's often best to add `.any` when negating `.keys`, and to use
	   * `.all` when asserting `.keys` without negation.
	   *
	   * When negating `.keys`, `.any` is preferred because `.not.any.keys` asserts
	   * exactly what's expected of the output, whereas `.not.all.keys` creates
	   * uncertain expectations.
	   *
	   *     // Recommended; asserts that target doesn't have any of the given keys
	   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
	   *
	   *     // Not recommended; asserts that target doesn't have all of the given
	   *     // keys but may or may not have some of them
	   *     expect({a: 1, b: 2}).to.not.have.all.keys('c', 'd');
	   *
	   * When asserting `.keys` without negation, `.all` is preferred because
	   * `.all.keys` asserts exactly what's expected of the output, whereas
	   * `.any.keys` creates uncertain expectations.
	   *
	   *     // Recommended; asserts that target has all the given keys
	   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
	   *
	   *     // Not recommended; asserts that target has at least one of the given
	   *     // keys but may or may not have more of them
	   *     expect({a: 1, b: 2}).to.have.any.keys('a', 'b');
	   *
	   * Note that `.all` is used by default when neither `.all` nor `.any` appear
	   * earlier in the chain. However, it's often best to add `.all` anyway because
	   * it improves readability.
	   *
	   *     // Both assertions are identical
	   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b'); // Recommended
	   *     expect({a: 1, b: 2}).to.have.keys('a', 'b'); // Not recommended
	   *
	   * Add `.include` earlier in the chain to require that the target's keys be a
	   * superset of the expected keys, rather than identical sets.
	   *
	   *     // Target object's keys are a superset of ['a', 'b'] but not identical
	   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
	   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
	   *
	   * However, if `.any` and `.include` are combined, only the `.any` takes
	   * effect. The `.include` is ignored in this case.
	   *
	   *     // Both assertions are identical
	   *     expect({a: 1}).to.have.any.keys('a', 'b');
	   *     expect({a: 1}).to.include.any.keys('a', 'b');
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect({a: 1}, 'nooo why fail??').to.have.key('b');
	   *
	   * The alias `.key` can be used interchangeably with `.keys`.
	   *
	   * @name keys
	   * @alias key
	   * @param {...String|Array|Object} keys
	   * @namespace BDD
	   * @api public
	   */

	  function assertKeys (keys) {
	    var obj = flag(this, 'object')
	      , objType = _.type(obj)
	      , keysType = _.type(keys)
	      , ssfi = flag(this, 'ssfi')
	      , isDeep = flag(this, 'deep')
	      , str
	      , deepStr = ''
	      , actual
	      , ok = true
	      , flagMsg = flag(this, 'message');

	    flagMsg = flagMsg ? flagMsg + ': ' : '';
	    var mixedArgsMsg = flagMsg + 'when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments';

	    if (objType === 'Map' || objType === 'Set') {
	      deepStr = isDeep ? 'deeply ' : '';
	      actual = [];

	      // Map and Set '.keys' aren't supported in IE 11. Therefore, use .forEach.
	      obj.forEach(function (val, key) { actual.push(key); });

	      if (keysType !== 'Array') {
	        keys = Array.prototype.slice.call(arguments);
	      }
	    } else {
	      actual = _.getOwnEnumerableProperties(obj);

	      switch (keysType) {
	        case 'Array':
	          if (arguments.length > 1) {
	            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
	          }
	          break;
	        case 'Object':
	          if (arguments.length > 1) {
	            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
	          }
	          keys = Object.keys(keys);
	          break;
	        default:
	          keys = Array.prototype.slice.call(arguments);
	      }

	      // Only stringify non-Symbols because Symbols would become "Symbol()"
	      keys = keys.map(function (val) {
	        return typeof val === 'symbol' ? val : String(val);
	      });
	    }

	    if (!keys.length) {
	      throw new AssertionError(flagMsg + 'keys required', undefined, ssfi);
	    }

	    var len = keys.length
	      , any = flag(this, 'any')
	      , all = flag(this, 'all')
	      , expected = keys;

	    if (!any && !all) {
	      all = true;
	    }

	    // Has any
	    if (any) {
	      ok = expected.some(function(expectedKey) {
	        return actual.some(function(actualKey) {
	          if (isDeep) {
	            return _.eql(expectedKey, actualKey);
	          } else {
	            return expectedKey === actualKey;
	          }
	        });
	      });
	    }

	    // Has all
	    if (all) {
	      ok = expected.every(function(expectedKey) {
	        return actual.some(function(actualKey) {
	          if (isDeep) {
	            return _.eql(expectedKey, actualKey);
	          } else {
	            return expectedKey === actualKey;
	          }
	        });
	      });

	      if (!flag(this, 'contains')) {
	        ok = ok && keys.length == actual.length;
	      }
	    }

	    // Key string
	    if (len > 1) {
	      keys = keys.map(function(key) {
	        return _.inspect(key);
	      });
	      var last = keys.pop();
	      if (all) {
	        str = keys.join(', ') + ', and ' + last;
	      }
	      if (any) {
	        str = keys.join(', ') + ', or ' + last;
	      }
	    } else {
	      str = _.inspect(keys[0]);
	    }

	    // Form
	    str = (len > 1 ? 'keys ' : 'key ') + str;

	    // Have / include
	    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

	    // Assertion
	    this.assert(
	        ok
	      , 'expected #{this} to ' + deepStr + str
	      , 'expected #{this} to not ' + deepStr + str
	      , expected.slice(0).sort(_.compareByInspect)
	      , actual.sort(_.compareByInspect)
	      , true
	    );
	  }

	  Assertion.addMethod('keys', assertKeys);
	  Assertion.addMethod('key', assertKeys);

	  /**
	   * ### .throw([errorLike], [errMsgMatcher], [msg])
	   *
	   * When no arguments are provided, `.throw` invokes the target function and
	   * asserts that an error is thrown.
	   *
	   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
	   *
	   *     expect(badFn).to.throw();
	   *
	   * When one argument is provided, and it's an error constructor, `.throw`
	   * invokes the target function and asserts that an error is thrown that's an
	   * instance of that error constructor.
	   *
	   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
	   *
	   *     expect(badFn).to.throw(TypeError);
	   *
	   * When one argument is provided, and it's an error instance, `.throw` invokes
	   * the target function and asserts that an error is thrown that's strictly
	   * (`===`) equal to that error instance.
	   *
	   *     var err = new TypeError('Illegal salmon!');
	   *     var badFn = function () { throw err; };
	   *
	   *     expect(badFn).to.throw(err);
	   *
	   * When one argument is provided, and it's a string, `.throw` invokes the
	   * target function and asserts that an error is thrown with a message that
	   * contains that string.
	   *
	   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
	   *
	   *     expect(badFn).to.throw('salmon');
	   *
	   * When one argument is provided, and it's a regular expression, `.throw`
	   * invokes the target function and asserts that an error is thrown with a
	   * message that matches that regular expression.
	   *
	   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
	   *
	   *     expect(badFn).to.throw(/salmon/);
	   *
	   * When two arguments are provided, and the first is an error instance or
	   * constructor, and the second is a string or regular expression, `.throw`
	   * invokes the function and asserts that an error is thrown that fulfills both
	   * conditions as described above.
	   *
	   *     var err = new TypeError('Illegal salmon!');
	   *     var badFn = function () { throw err; };
	   *
	   *     expect(badFn).to.throw(TypeError, 'salmon');
	   *     expect(badFn).to.throw(TypeError, /salmon/);
	   *     expect(badFn).to.throw(err, 'salmon');
	   *     expect(badFn).to.throw(err, /salmon/);
	   *
	   * Add `.not` earlier in the chain to negate `.throw`.
	   *
	   *     var goodFn = function () {};
	   *
	   *     expect(goodFn).to.not.throw();
	   *
	   * However, it's dangerous to negate `.throw` when providing any arguments.
	   * The problem is that it creates uncertain expectations by asserting that the
	   * target either doesn't throw an error, or that it throws an error but of a
	   * different type than the given type, or that it throws an error of the given
	   * type but with a message that doesn't include the given string. It's often
	   * best to identify the exact output that's expected, and then write an
	   * assertion that only accepts that exact output.
	   *
	   * When the target isn't expected to throw an error, it's often best to assert
	   * exactly that.
	   *
	   *     var goodFn = function () {};
	   *
	   *     expect(goodFn).to.not.throw(); // Recommended
	   *     expect(goodFn).to.not.throw(ReferenceError, 'x'); // Not recommended
	   *
	   * When the target is expected to throw an error, it's often best to assert
	   * that the error is of its expected type, and has a message that includes an
	   * expected string, rather than asserting that it doesn't have one of many
	   * unexpected types, and doesn't have a message that includes some string.
	   *
	   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
	   *
	   *     expect(badFn).to.throw(TypeError, 'salmon'); // Recommended
	   *     expect(badFn).to.not.throw(ReferenceError, 'x'); // Not recommended
	   *
	   * `.throw` changes the target of any assertions that follow in the chain to
	   * be the error object that's thrown.
	   *
	   *     var err = new TypeError('Illegal salmon!');
	   *     err.code = 42;
	   *     var badFn = function () { throw err; };
	   *
	   *     expect(badFn).to.throw(TypeError).with.property('code', 42);
	   *
	   * `.throw` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`. When not providing two arguments, always use
	   * the second form.
	   *
	   *     var goodFn = function () {};
	   *
	   *     expect(goodFn).to.throw(TypeError, 'x', 'nooo why fail??');
	   *     expect(goodFn, 'nooo why fail??').to.throw();
	   *
	   * Due to limitations in ES5, `.throw` may not always work as expected when
	   * using a transpiler such as Babel or TypeScript. In particular, it may
	   * produce unexpected results when subclassing the built-in `Error` object and
	   * then passing the subclassed constructor to `.throw`. See your transpiler's
	   * docs for details:
	   *
	   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
	   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
	   *
	   * Beware of some common mistakes when using the `throw` assertion. One common
	   * mistake is to accidentally invoke the function yourself instead of letting
	   * the `throw` assertion invoke the function for you. For example, when
	   * testing if a function named `fn` throws, provide `fn` instead of `fn()` as
	   * the target for the assertion.
	   *
	   *     expect(fn).to.throw();     // Good! Tests `fn` as desired
	   *     expect(fn()).to.throw();   // Bad! Tests result of `fn()`, not `fn`
	   *
	   * If you need to assert that your function `fn` throws when passed certain
	   * arguments, then wrap a call to `fn` inside of another function.
	   *
	   *     expect(function () { fn(42); }).to.throw();  // Function expression
	   *     expect(() => fn(42)).to.throw();             // ES6 arrow function
	   *
	   * Another common mistake is to provide an object method (or any stand-alone
	   * function that relies on `this`) as the target of the assertion. Doing so is
	   * problematic because the `this` context will be lost when the function is
	   * invoked by `.throw`; there's no way for it to know what `this` is supposed
	   * to be. There are two ways around this problem. One solution is to wrap the
	   * method or function call inside of another function. Another solution is to
	   * use `bind`.
	   *
	   *     expect(function () { cat.meow(); }).to.throw();  // Function expression
	   *     expect(() => cat.meow()).to.throw();             // ES6 arrow function
	   *     expect(cat.meow.bind(cat)).to.throw();           // Bind
	   *
	   * Finally, it's worth mentioning that it's a best practice in JavaScript to
	   * only throw `Error` and derivatives of `Error` such as `ReferenceError`,
	   * `TypeError`, and user-defined objects that extend `Error`. No other type of
	   * value will generate a stack trace when initialized. With that said, the
	   * `throw` assertion does technically support any type of value being thrown,
	   * not just `Error` and its derivatives.
	   *
	   * The aliases `.throws` and `.Throw` can be used interchangeably with
	   * `.throw`.
	   *
	   * @name throw
	   * @alias throws
	   * @alias Throw
	   * @param {Error|ErrorConstructor} errorLike
	   * @param {String|RegExp} errMsgMatcher error message
	   * @param {String} msg _optional_
	   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
	   * @returns error for chaining (null if no error)
	   * @namespace BDD
	   * @api public
	   */

	  function assertThrows (errorLike, errMsgMatcher, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , ssfi = flag(this, 'ssfi')
	      , flagMsg = flag(this, 'message')
	      , negate = flag(this, 'negate') || false;
	    new Assertion(obj, flagMsg, ssfi, true).is.a('function');

	    if (errorLike instanceof RegExp || typeof errorLike === 'string') {
	      errMsgMatcher = errorLike;
	      errorLike = null;
	    }

	    var caughtErr;
	    try {
	      obj();
	    } catch (err) {
	      caughtErr = err;
	    }

	    // If we have the negate flag enabled and at least one valid argument it means we do expect an error
	    // but we want it to match a given set of criteria
	    var everyArgIsUndefined = errorLike === undefined && errMsgMatcher === undefined;

	    // If we've got the negate flag enabled and both args, we should only fail if both aren't compatible
	    // See Issue #551 and PR #683@GitHub
	    var everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
	    var errorLikeFail = false;
	    var errMsgMatcherFail = false;

	    // Checking if error was thrown
	    if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
	      // We need this to display results correctly according to their types
	      var errorLikeString = 'an error';
	      if (errorLike instanceof Error) {
	        errorLikeString = '#{exp}';
	      } else if (errorLike) {
	        errorLikeString = _.checkError.getConstructorName(errorLike);
	      }

	      this.assert(
	          caughtErr
	        , 'expected #{this} to throw ' + errorLikeString
	        , 'expected #{this} to not throw an error but #{act} was thrown'
	        , errorLike && errorLike.toString()
	        , (caughtErr instanceof Error ?
	            caughtErr.toString() : (typeof caughtErr === 'string' ? caughtErr : caughtErr &&
	                                    _.checkError.getConstructorName(caughtErr)))
	      );
	    }

	    if (errorLike && caughtErr) {
	      // We should compare instances only if `errorLike` is an instance of `Error`
	      if (errorLike instanceof Error) {
	        var isCompatibleInstance = _.checkError.compatibleInstance(caughtErr, errorLike);

	        if (isCompatibleInstance === negate) {
	          // These checks were created to ensure we won't fail too soon when we've got both args and a negate
	          // See Issue #551 and PR #683@GitHub
	          if (everyArgIsDefined && negate) {
	            errorLikeFail = true;
	          } else {
	            this.assert(
	                negate
	              , 'expected #{this} to throw #{exp} but #{act} was thrown'
	              , 'expected #{this} to not throw #{exp}' + (caughtErr && !negate ? ' but #{act} was thrown' : '')
	              , errorLike.toString()
	              , caughtErr.toString()
	            );
	          }
	        }
	      }

	      var isCompatibleConstructor = _.checkError.compatibleConstructor(caughtErr, errorLike);
	      if (isCompatibleConstructor === negate) {
	        if (everyArgIsDefined && negate) {
	            errorLikeFail = true;
	        } else {
	          this.assert(
	              negate
	            , 'expected #{this} to throw #{exp} but #{act} was thrown'
	            , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
	            , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
	            , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
	          );
	        }
	      }
	    }

	    if (caughtErr && errMsgMatcher !== undefined && errMsgMatcher !== null) {
	      // Here we check compatible messages
	      var placeholder = 'including';
	      if (errMsgMatcher instanceof RegExp) {
	        placeholder = 'matching';
	      }

	      var isCompatibleMessage = _.checkError.compatibleMessage(caughtErr, errMsgMatcher);
	      if (isCompatibleMessage === negate) {
	        if (everyArgIsDefined && negate) {
	            errMsgMatcherFail = true;
	        } else {
	          this.assert(
	            negate
	            , 'expected #{this} to throw error ' + placeholder + ' #{exp} but got #{act}'
	            , 'expected #{this} to throw error not ' + placeholder + ' #{exp}'
	            ,  errMsgMatcher
	            ,  _.checkError.getMessage(caughtErr)
	          );
	        }
	      }
	    }

	    // If both assertions failed and both should've matched we throw an error
	    if (errorLikeFail && errMsgMatcherFail) {
	      this.assert(
	        negate
	        , 'expected #{this} to throw #{exp} but #{act} was thrown'
	        , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
	        , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
	        , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
	      );
	    }

	    flag(this, 'object', caughtErr);
	  }
	  Assertion.addMethod('throw', assertThrows);
	  Assertion.addMethod('throws', assertThrows);
	  Assertion.addMethod('Throw', assertThrows);

	  /**
	   * ### .respondTo(method[, msg])
	   *
	   * When the target is a non-function object, `.respondTo` asserts that the
	   * target has a method with the given name `method`. The method can be own or
	   * inherited, and it can be enumerable or non-enumerable.
	   *
	   *     function Cat () {}
	   *     Cat.prototype.meow = function () {};
	   *
	   *     expect(new Cat()).to.respondTo('meow');
	   *
	   * When the target is a function, `.respondTo` asserts that the target's
	   * `prototype` property has a method with the given name `method`. Again, the
	   * method can be own or inherited, and it can be enumerable or non-enumerable.
	   *
	   *     function Cat () {}
	   *     Cat.prototype.meow = function () {};
	   *
	   *     expect(Cat).to.respondTo('meow');
	   *
	   * Add `.itself` earlier in the chain to force `.respondTo` to treat the
	   * target as a non-function object, even if it's a function. Thus, it asserts
	   * that the target has a method with the given name `method`, rather than
	   * asserting that the target's `prototype` property has a method with the
	   * given name `method`.
	   *
	   *     function Cat () {}
	   *     Cat.prototype.meow = function () {};
	   *     Cat.hiss = function () {};
	   *
	   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
	   *
	   * When not adding `.itself`, it's important to check the target's type before
	   * using `.respondTo`. See the `.a` doc for info on checking a target's type.
	   *
	   *     function Cat () {}
	   *     Cat.prototype.meow = function () {};
	   *
	   *     expect(new Cat()).to.be.an('object').that.respondsTo('meow');
	   *
	   * Add `.not` earlier in the chain to negate `.respondTo`.
	   *
	   *     function Dog () {}
	   *     Dog.prototype.bark = function () {};
	   *
	   *     expect(new Dog()).to.not.respondTo('meow');
	   *
	   * `.respondTo` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect({}).to.respondTo('meow', 'nooo why fail??');
	   *     expect({}, 'nooo why fail??').to.respondTo('meow');
	   *
	   * The alias `.respondsTo` can be used interchangeably with `.respondTo`.
	   *
	   * @name respondTo
	   * @alias respondsTo
	   * @param {String} method
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function respondTo (method, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , itself = flag(this, 'itself')
	      , context = ('function' === typeof obj && !itself)
	        ? obj.prototype[method]
	        : obj[method];

	    this.assert(
	        'function' === typeof context
	      , 'expected #{this} to respond to ' + _.inspect(method)
	      , 'expected #{this} to not respond to ' + _.inspect(method)
	    );
	  }

	  Assertion.addMethod('respondTo', respondTo);
	  Assertion.addMethod('respondsTo', respondTo);

	  /**
	   * ### .itself
	   *
	   * Forces all `.respondTo` assertions that follow in the chain to behave as if
	   * the target is a non-function object, even if it's a function. Thus, it
	   * causes `.respondTo` to assert that the target has a method with the given
	   * name, rather than asserting that the target's `prototype` property has a
	   * method with the given name.
	   *
	   *     function Cat () {}
	   *     Cat.prototype.meow = function () {};
	   *     Cat.hiss = function () {};
	   *
	   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
	   *
	   * @name itself
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('itself', function () {
	    flag(this, 'itself', true);
	  });

	  /**
	   * ### .satisfy(matcher[, msg])
	   *
	   * Invokes the given `matcher` function with the target being passed as the
	   * first argument, and asserts that the value returned is truthy.
	   *
	   *     expect(1).to.satisfy(function(num) {
	   *       return num > 0;
	   *     });
	   *
	   * Add `.not` earlier in the chain to negate `.satisfy`.
	   *
	   *     expect(1).to.not.satisfy(function(num) {
	   *       return num > 2;
	   *     });
	   *
	   * `.satisfy` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect(1).to.satisfy(function(num) {
	   *       return num > 2;
	   *     }, 'nooo why fail??');
	   *
	   *     expect(1, 'nooo why fail??').to.satisfy(function(num) {
	   *       return num > 2;
	   *     });
	   *
	   * The alias `.satisfies` can be used interchangeably with `.satisfy`.
	   *
	   * @name satisfy
	   * @alias satisfies
	   * @param {Function} matcher
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function satisfy (matcher, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object');
	    var result = matcher(obj);
	    this.assert(
	        result
	      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
	      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
	      , flag(this, 'negate') ? false : true
	      , result
	    );
	  }

	  Assertion.addMethod('satisfy', satisfy);
	  Assertion.addMethod('satisfies', satisfy);

	  /**
	   * ### .closeTo(expected, delta[, msg])
	   *
	   * Asserts that the target is a number that's within a given +/- `delta` range
	   * of the given number `expected`. However, it's often best to assert that the
	   * target is equal to its expected value.
	   *
	   *     // Recommended
	   *     expect(1.5).to.equal(1.5);
	   *
	   *     // Not recommended
	   *     expect(1.5).to.be.closeTo(1, 0.5);
	   *     expect(1.5).to.be.closeTo(2, 0.5);
	   *     expect(1.5).to.be.closeTo(1, 1);
	   *
	   * Add `.not` earlier in the chain to negate `.closeTo`.
	   *
	   *     expect(1.5).to.equal(1.5); // Recommended
	   *     expect(1.5).to.not.be.closeTo(3, 1); // Not recommended
	   *
	   * `.closeTo` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect(1.5).to.be.closeTo(3, 1, 'nooo why fail??');
	   *     expect(1.5, 'nooo why fail??').to.be.closeTo(3, 1);
	   *
	   * The alias `.approximately` can be used interchangeably with `.closeTo`.
	   *
	   * @name closeTo
	   * @alias approximately
	   * @param {Number} expected
	   * @param {Number} delta
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function closeTo(expected, delta, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');

	    new Assertion(obj, flagMsg, ssfi, true).is.a('number');
	    if (typeof expected !== 'number' || typeof delta !== 'number') {
	      flagMsg = flagMsg ? flagMsg + ': ' : '';
	      throw new AssertionError(
	          flagMsg + 'the arguments to closeTo or approximately must be numbers',
	          undefined,
	          ssfi
	      );
	    }

	    this.assert(
	        Math.abs(obj - expected) <= delta
	      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
	      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
	    );
	  }

	  Assertion.addMethod('closeTo', closeTo);
	  Assertion.addMethod('approximately', closeTo);

	  // Note: Duplicates are ignored if testing for inclusion instead of sameness.
	  function isSubsetOf(subset, superset, cmp, contains, ordered) {
	    if (!contains) {
	      if (subset.length !== superset.length) return false;
	      superset = superset.slice();
	    }

	    return subset.every(function(elem, idx) {
	      if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];

	      if (!cmp) {
	        var matchIdx = superset.indexOf(elem);
	        if (matchIdx === -1) return false;

	        // Remove match from superset so not counted twice if duplicate in subset.
	        if (!contains) superset.splice(matchIdx, 1);
	        return true;
	      }

	      return superset.some(function(elem2, matchIdx) {
	        if (!cmp(elem, elem2)) return false;

	        // Remove match from superset so not counted twice if duplicate in subset.
	        if (!contains) superset.splice(matchIdx, 1);
	        return true;
	      });
	    });
	  }

	  /**
	   * ### .members(set[, msg])
	   *
	   * Asserts that the target array has the same members as the given array
	   * `set`.
	   *
	   *     expect([1, 2, 3]).to.have.members([2, 1, 3]);
	   *     expect([1, 2, 2]).to.have.members([2, 1, 2]);
	   *
	   * By default, members are compared using strict (`===`) equality. Add `.deep`
	   * earlier in the chain to use deep equality instead. See the `deep-eql`
	   * project page for info on the deep equality algorithm:
	   * https://github.com/chaijs/deep-eql.
	   *
	   *     // Target array deeply (but not strictly) has member `{a: 1}`
	   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
	   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
	   *
	   * By default, order doesn't matter. Add `.ordered` earlier in the chain to
	   * require that members appear in the same order.
	   *
	   *     expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
	   *     expect([1, 2, 3]).to.have.members([2, 1, 3])
	   *       .but.not.ordered.members([2, 1, 3]);
	   *
	   * By default, both arrays must be the same size. Add `.include` earlier in
	   * the chain to require that the target's members be a superset of the
	   * expected members. Note that duplicates are ignored in the subset when
	   * `.include` is added.
	   *
	   *     // Target array is a superset of [1, 2] but not identical
	   *     expect([1, 2, 3]).to.include.members([1, 2]);
	   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
	   *
	   *     // Duplicates in the subset are ignored
	   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
	   *
	   * `.deep`, `.ordered`, and `.include` can all be combined. However, if
	   * `.include` and `.ordered` are combined, the ordering begins at the start of
	   * both arrays.
	   *
	   *     expect([{a: 1}, {b: 2}, {c: 3}])
	   *       .to.include.deep.ordered.members([{a: 1}, {b: 2}])
	   *       .but.not.include.deep.ordered.members([{b: 2}, {c: 3}]);
	   *
	   * Add `.not` earlier in the chain to negate `.members`. However, it's
	   * dangerous to do so. The problem is that it creates uncertain expectations
	   * by asserting that the target array doesn't have all of the same members as
	   * the given array `set` but may or may not have some of them. It's often best
	   * to identify the exact output that's expected, and then write an assertion
	   * that only accepts that exact output.
	   *
	   *     expect([1, 2]).to.not.include(3).and.not.include(4); // Recommended
	   *     expect([1, 2]).to.not.have.members([3, 4]); // Not recommended
	   *
	   * `.members` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`.
	   *
	   *     expect([1, 2]).to.have.members([1, 2, 3], 'nooo why fail??');
	   *     expect([1, 2], 'nooo why fail??').to.have.members([1, 2, 3]);
	   *
	   * @name members
	   * @param {Array} set
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addMethod('members', function (subset, msg) {
	    if (msg) flag(this, 'message', msg);
	    var obj = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');

	    new Assertion(obj, flagMsg, ssfi, true).to.be.an('array');
	    new Assertion(subset, flagMsg, ssfi, true).to.be.an('array');

	    var contains = flag(this, 'contains');
	    var ordered = flag(this, 'ordered');

	    var subject, failMsg, failNegateMsg;

	    if (contains) {
	      subject = ordered ? 'an ordered superset' : 'a superset';
	      failMsg = 'expected #{this} to be ' + subject + ' of #{exp}';
	      failNegateMsg = 'expected #{this} to not be ' + subject + ' of #{exp}';
	    } else {
	      subject = ordered ? 'ordered members' : 'members';
	      failMsg = 'expected #{this} to have the same ' + subject + ' as #{exp}';
	      failNegateMsg = 'expected #{this} to not have the same ' + subject + ' as #{exp}';
	    }

	    var cmp = flag(this, 'deep') ? _.eql : undefined;

	    this.assert(
	        isSubsetOf(subset, obj, cmp, contains, ordered)
	      , failMsg
	      , failNegateMsg
	      , subset
	      , obj
	      , true
	    );
	  });

	  /**
	   * ### .oneOf(list[, msg])
	   *
	   * Asserts that the target is a member of the given array `list`. However,
	   * it's often best to assert that the target is equal to its expected value.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.be.oneOf([1, 2, 3]); // Not recommended
	   *
	   * Comparisons are performed using strict (`===`) equality.
	   *
	   * Add `.not` earlier in the chain to negate `.oneOf`.
	   *
	   *     expect(1).to.equal(1); // Recommended
	   *     expect(1).to.not.be.oneOf([2, 3, 4]); // Not recommended
	   *
	   * `.oneOf` accepts an optional `msg` argument which is a custom error message
	   * to show when the assertion fails. The message can also be given as the
	   * second argument to `expect`.
	   *
	   *     expect(1).to.be.oneOf([2, 3, 4], 'nooo why fail??');
	   *     expect(1, 'nooo why fail??').to.be.oneOf([2, 3, 4]);
	   *
	   * @name oneOf
	   * @param {Array<*>} list
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function oneOf (list, msg) {
	    if (msg) flag(this, 'message', msg);
	    var expected = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');
	    new Assertion(list, flagMsg, ssfi, true).to.be.an('array');

	    this.assert(
	        list.indexOf(expected) > -1
	      , 'expected #{this} to be one of #{exp}'
	      , 'expected #{this} to not be one of #{exp}'
	      , list
	      , expected
	    );
	  }

	  Assertion.addMethod('oneOf', oneOf);

	  /**
	   * ### .change(subject[, prop[, msg]])
	   *
	   * When one argument is provided, `.change` asserts that the given function
	   * `subject` returns a different value when it's invoked before the target
	   * function compared to when it's invoked afterward. However, it's often best
	   * to assert that `subject` is equal to its expected value.
	   *
	   *     var dots = ''
	   *       , addDot = function () { dots += '.'; }
	   *       , getDots = function () { return dots; };
	   *
	   *     // Recommended
	   *     expect(getDots()).to.equal('');
	   *     addDot();
	   *     expect(getDots()).to.equal('.');
	   *
	   *     // Not recommended
	   *     expect(addDot).to.change(getDots);
	   *
	   * When two arguments are provided, `.change` asserts that the value of the
	   * given object `subject`'s `prop` property is different before invoking the
	   * target function compared to afterward.
	   *
	   *     var myObj = {dots: ''}
	   *       , addDot = function () { myObj.dots += '.'; };
	   *
	   *     // Recommended
	   *     expect(myObj).to.have.property('dots', '');
	   *     addDot();
	   *     expect(myObj).to.have.property('dots', '.');
	   *
	   *     // Not recommended
	   *     expect(addDot).to.change(myObj, 'dots');
	   *
	   * Strict (`===`) equality is used to compare before and after values.
	   *
	   * Add `.not` earlier in the chain to negate `.change`.
	   *
	   *     var dots = ''
	   *       , noop = function () {}
	   *       , getDots = function () { return dots; };
	   *
	   *     expect(noop).to.not.change(getDots);
	   *
	   *     var myObj = {dots: ''}
	   *       , noop = function () {};
	   *
	   *     expect(noop).to.not.change(myObj, 'dots');
	   *
	   * `.change` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`. When not providing two arguments, always
	   * use the second form.
	   *
	   *     var myObj = {dots: ''}
	   *       , addDot = function () { myObj.dots += '.'; };
	   *
	   *     expect(addDot).to.not.change(myObj, 'dots', 'nooo why fail??');
	   *
	   *     var dots = ''
	   *       , addDot = function () { dots += '.'; }
	   *       , getDots = function () { return dots; };
	   *
	   *     expect(addDot, 'nooo why fail??').to.not.change(getDots);
	   *
	   * `.change` also causes all `.by` assertions that follow in the chain to
	   * assert how much a numeric subject was increased or decreased by. However,
	   * it's dangerous to use `.change.by`. The problem is that it creates
	   * uncertain expectations by asserting that the subject either increases by
	   * the given delta, or that it decreases by the given delta. It's often best
	   * to identify the exact output that's expected, and then write an assertion
	   * that only accepts that exact output.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; }
	   *       , subtractTwo = function () { myObj.val -= 2; };
	   *
	   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
	   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
	   *
	   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
	   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
	   *
	   * The alias `.changes` can be used interchangeably with `.change`.
	   *
	   * @name change
	   * @alias changes
	   * @param {String} subject
	   * @param {String} prop name _optional_
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertChanges (subject, prop, msg) {
	    if (msg) flag(this, 'message', msg);
	    var fn = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');
	    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

	    var initial;
	    if (!prop) {
	      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
	      initial = subject();
	    } else {
	      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
	      initial = subject[prop];
	    }

	    fn();

	    var final = prop === undefined || prop === null ? subject() : subject[prop];
	    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

	    // This gets flagged because of the .by(delta) assertion
	    flag(this, 'deltaMsgObj', msgObj);
	    flag(this, 'initialDeltaValue', initial);
	    flag(this, 'finalDeltaValue', final);
	    flag(this, 'deltaBehavior', 'change');
	    flag(this, 'realDelta', final !== initial);

	    this.assert(
	      initial !== final
	      , 'expected ' + msgObj + ' to change'
	      , 'expected ' + msgObj + ' to not change'
	    );
	  }

	  Assertion.addMethod('change', assertChanges);
	  Assertion.addMethod('changes', assertChanges);

	  /**
	   * ### .increase(subject[, prop[, msg]])
	   *
	   * When one argument is provided, `.increase` asserts that the given function
	   * `subject` returns a greater number when it's invoked after invoking the
	   * target function compared to when it's invoked beforehand. `.increase` also
	   * causes all `.by` assertions that follow in the chain to assert how much
	   * greater of a number is returned. It's often best to assert that the return
	   * value increased by the expected amount, rather than asserting it increased
	   * by any amount.
	   *
	   *     var val = 1
	   *       , addTwo = function () { val += 2; }
	   *       , getVal = function () { return val; };
	   *
	   *     expect(addTwo).to.increase(getVal).by(2); // Recommended
	   *     expect(addTwo).to.increase(getVal); // Not recommended
	   *
	   * When two arguments are provided, `.increase` asserts that the value of the
	   * given object `subject`'s `prop` property is greater after invoking the
	   * target function compared to beforehand.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; };
	   *
	   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
	   *     expect(addTwo).to.increase(myObj, 'val'); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.increase`. However, it's
	   * dangerous to do so. The problem is that it creates uncertain expectations
	   * by asserting that the subject either decreases, or that it stays the same.
	   * It's often best to identify the exact output that's expected, and then
	   * write an assertion that only accepts that exact output.
	   *
	   * When the subject is expected to decrease, it's often best to assert that it
	   * decreased by the expected amount.
	   *
	   *     var myObj = {val: 1}
	   *       , subtractTwo = function () { myObj.val -= 2; };
	   *
	   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
	   *     expect(subtractTwo).to.not.increase(myObj, 'val'); // Not recommended
	   *
	   * When the subject is expected to stay the same, it's often best to assert
	   * exactly that.
	   *
	   *     var myObj = {val: 1}
	   *       , noop = function () {};
	   *
	   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
	   *     expect(noop).to.not.increase(myObj, 'val'); // Not recommended
	   *
	   * `.increase` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`. When not providing two arguments, always
	   * use the second form.
	   *
	   *     var myObj = {val: 1}
	   *       , noop = function () {};
	   *
	   *     expect(noop).to.increase(myObj, 'val', 'nooo why fail??');
	   *
	   *     var val = 1
	   *       , noop = function () {}
	   *       , getVal = function () { return val; };
	   *
	   *     expect(noop, 'nooo why fail??').to.increase(getVal);
	   *
	   * The alias `.increases` can be used interchangeably with `.increase`.
	   *
	   * @name increase
	   * @alias increases
	   * @param {String|Function} subject
	   * @param {String} prop name _optional_
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertIncreases (subject, prop, msg) {
	    if (msg) flag(this, 'message', msg);
	    var fn = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');
	    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

	    var initial;
	    if (!prop) {
	      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
	      initial = subject();
	    } else {
	      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
	      initial = subject[prop];
	    }

	    // Make sure that the target is a number
	    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

	    fn();

	    var final = prop === undefined || prop === null ? subject() : subject[prop];
	    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

	    flag(this, 'deltaMsgObj', msgObj);
	    flag(this, 'initialDeltaValue', initial);
	    flag(this, 'finalDeltaValue', final);
	    flag(this, 'deltaBehavior', 'increase');
	    flag(this, 'realDelta', final - initial);

	    this.assert(
	      final - initial > 0
	      , 'expected ' + msgObj + ' to increase'
	      , 'expected ' + msgObj + ' to not increase'
	    );
	  }

	  Assertion.addMethod('increase', assertIncreases);
	  Assertion.addMethod('increases', assertIncreases);

	  /**
	   * ### .decrease(subject[, prop[, msg]])
	   *
	   * When one argument is provided, `.decrease` asserts that the given function
	   * `subject` returns a lesser number when it's invoked after invoking the
	   * target function compared to when it's invoked beforehand. `.decrease` also
	   * causes all `.by` assertions that follow in the chain to assert how much
	   * lesser of a number is returned. It's often best to assert that the return
	   * value decreased by the expected amount, rather than asserting it decreased
	   * by any amount.
	   *
	   *     var val = 1
	   *       , subtractTwo = function () { val -= 2; }
	   *       , getVal = function () { return val; };
	   *
	   *     expect(subtractTwo).to.decrease(getVal).by(2); // Recommended
	   *     expect(subtractTwo).to.decrease(getVal); // Not recommended
	   *
	   * When two arguments are provided, `.decrease` asserts that the value of the
	   * given object `subject`'s `prop` property is lesser after invoking the
	   * target function compared to beforehand.
	   *
	   *     var myObj = {val: 1}
	   *       , subtractTwo = function () { myObj.val -= 2; };
	   *
	   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
	   *     expect(subtractTwo).to.decrease(myObj, 'val'); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.decrease`. However, it's
	   * dangerous to do so. The problem is that it creates uncertain expectations
	   * by asserting that the subject either increases, or that it stays the same.
	   * It's often best to identify the exact output that's expected, and then
	   * write an assertion that only accepts that exact output.
	   *
	   * When the subject is expected to increase, it's often best to assert that it
	   * increased by the expected amount.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; };
	   *
	   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
	   *     expect(addTwo).to.not.decrease(myObj, 'val'); // Not recommended
	   *
	   * When the subject is expected to stay the same, it's often best to assert
	   * exactly that.
	   *
	   *     var myObj = {val: 1}
	   *       , noop = function () {};
	   *
	   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
	   *     expect(noop).to.not.decrease(myObj, 'val'); // Not recommended
	   *
	   * `.decrease` accepts an optional `msg` argument which is a custom error
	   * message to show when the assertion fails. The message can also be given as
	   * the second argument to `expect`. When not providing two arguments, always
	   * use the second form.
	   *
	   *     var myObj = {val: 1}
	   *       , noop = function () {};
	   *
	   *     expect(noop).to.decrease(myObj, 'val', 'nooo why fail??');
	   *
	   *     var val = 1
	   *       , noop = function () {}
	   *       , getVal = function () { return val; };
	   *
	   *     expect(noop, 'nooo why fail??').to.decrease(getVal);
	   *
	   * The alias `.decreases` can be used interchangeably with `.decrease`.
	   *
	   * @name decrease
	   * @alias decreases
	   * @param {String|Function} subject
	   * @param {String} prop name _optional_
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertDecreases (subject, prop, msg) {
	    if (msg) flag(this, 'message', msg);
	    var fn = flag(this, 'object')
	      , flagMsg = flag(this, 'message')
	      , ssfi = flag(this, 'ssfi');
	    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

	    var initial;
	    if (!prop) {
	      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
	      initial = subject();
	    } else {
	      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
	      initial = subject[prop];
	    }

	    // Make sure that the target is a number
	    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

	    fn();

	    var final = prop === undefined || prop === null ? subject() : subject[prop];
	    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

	    flag(this, 'deltaMsgObj', msgObj);
	    flag(this, 'initialDeltaValue', initial);
	    flag(this, 'finalDeltaValue', final);
	    flag(this, 'deltaBehavior', 'decrease');
	    flag(this, 'realDelta', initial - final);

	    this.assert(
	      final - initial < 0
	      , 'expected ' + msgObj + ' to decrease'
	      , 'expected ' + msgObj + ' to not decrease'
	    );
	  }

	  Assertion.addMethod('decrease', assertDecreases);
	  Assertion.addMethod('decreases', assertDecreases);

	  /**
	   * ### .by(delta[, msg])
	   *
	   * When following an `.increase` assertion in the chain, `.by` asserts that
	   * the subject of the `.increase` assertion increased by the given `delta`.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; };
	   *
	   *     expect(addTwo).to.increase(myObj, 'val').by(2);
	   *
	   * When following a `.decrease` assertion in the chain, `.by` asserts that the
	   * subject of the `.decrease` assertion decreased by the given `delta`.
	   *
	   *     var myObj = {val: 1}
	   *       , subtractTwo = function () { myObj.val -= 2; };
	   *
	   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2);
	   *
	   * When following a `.change` assertion in the chain, `.by` asserts that the
	   * subject of the `.change` assertion either increased or decreased by the
	   * given `delta`. However, it's dangerous to use `.change.by`. The problem is
	   * that it creates uncertain expectations. It's often best to identify the
	   * exact output that's expected, and then write an assertion that only accepts
	   * that exact output.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; }
	   *       , subtractTwo = function () { myObj.val -= 2; };
	   *
	   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
	   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
	   *
	   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
	   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
	   *
	   * Add `.not` earlier in the chain to negate `.by`. However, it's often best
	   * to assert that the subject changed by its expected delta, rather than
	   * asserting that it didn't change by one of countless unexpected deltas.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; };
	   *
	   *     // Recommended
	   *     expect(addTwo).to.increase(myObj, 'val').by(2);
	   *
	   *     // Not recommended
	   *     expect(addTwo).to.increase(myObj, 'val').but.not.by(3);
	   *
	   * `.by` accepts an optional `msg` argument which is a custom error message to
	   * show when the assertion fails. The message can also be given as the second
	   * argument to `expect`.
	   *
	   *     var myObj = {val: 1}
	   *       , addTwo = function () { myObj.val += 2; };
	   *
	   *     expect(addTwo).to.increase(myObj, 'val').by(3, 'nooo why fail??');
	   *     expect(addTwo, 'nooo why fail??').to.increase(myObj, 'val').by(3);
	   *
	   * @name by
	   * @param {Number} delta
	   * @param {String} msg _optional_
	   * @namespace BDD
	   * @api public
	   */

	  function assertDelta(delta, msg) {
	    if (msg) flag(this, 'message', msg);

	    var msgObj = flag(this, 'deltaMsgObj');
	    var initial = flag(this, 'initialDeltaValue');
	    var final = flag(this, 'finalDeltaValue');
	    var behavior = flag(this, 'deltaBehavior');
	    var realDelta = flag(this, 'realDelta');

	    var expression;
	    if (behavior === 'change') {
	      expression = Math.abs(final - initial) === Math.abs(delta);
	    } else {
	      expression = realDelta === Math.abs(delta);
	    }

	    this.assert(
	      expression
	      , 'expected ' + msgObj + ' to ' + behavior + ' by ' + delta
	      , 'expected ' + msgObj + ' to not ' + behavior + ' by ' + delta
	    );
	  }

	  Assertion.addMethod('by', assertDelta);

	  /**
	   * ### .extensible
	   *
	   * Asserts that the target is extensible, which means that new properties can
	   * be added to it. Primitives are never extensible.
	   *
	   *     expect({a: 1}).to.be.extensible;
	   *
	   * Add `.not` earlier in the chain to negate `.extensible`.
	   *
	   *     var nonExtensibleObject = Object.preventExtensions({})
	   *       , sealedObject = Object.seal({})
	   *       , frozenObject = Object.freeze({});
	   *
	   *     expect(nonExtensibleObject).to.not.be.extensible;
	   *     expect(sealedObject).to.not.be.extensible;
	   *     expect(frozenObject).to.not.be.extensible;
	   *     expect(1).to.not.be.extensible;
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect(1, 'nooo why fail??').to.be.extensible;
	   *
	   * @name extensible
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('extensible', function() {
	    var obj = flag(this, 'object');

	    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
	    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
	    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
	    // The following provides ES6 behavior for ES5 environments.

	    var isExtensible = obj === Object(obj) && Object.isExtensible(obj);

	    this.assert(
	      isExtensible
	      , 'expected #{this} to be extensible'
	      , 'expected #{this} to not be extensible'
	    );
	  });

	  /**
	   * ### .sealed
	   *
	   * Asserts that the target is sealed, which means that new properties can't be
	   * added to it, and its existing properties can't be reconfigured or deleted.
	   * However, it's possible that its existing properties can still be reassigned
	   * to different values. Primitives are always sealed.
	   *
	   *     var sealedObject = Object.seal({});
	   *     var frozenObject = Object.freeze({});
	   *
	   *     expect(sealedObject).to.be.sealed;
	   *     expect(frozenObject).to.be.sealed;
	   *     expect(1).to.be.sealed;
	   *
	   * Add `.not` earlier in the chain to negate `.sealed`.
	   *
	   *     expect({a: 1}).to.not.be.sealed;
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect({a: 1}, 'nooo why fail??').to.be.sealed;
	   *
	   * @name sealed
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('sealed', function() {
	    var obj = flag(this, 'object');

	    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
	    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
	    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
	    // The following provides ES6 behavior for ES5 environments.

	    var isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;

	    this.assert(
	      isSealed
	      , 'expected #{this} to be sealed'
	      , 'expected #{this} to not be sealed'
	    );
	  });

	  /**
	   * ### .frozen
	   *
	   * Asserts that the target is frozen, which means that new properties can't be
	   * added to it, and its existing properties can't be reassigned to different
	   * values, reconfigured, or deleted. Primitives are always frozen.
	   *
	   *     var frozenObject = Object.freeze({});
	   *
	   *     expect(frozenObject).to.be.frozen;
	   *     expect(1).to.be.frozen;
	   *
	   * Add `.not` earlier in the chain to negate `.frozen`.
	   *
	   *     expect({a: 1}).to.not.be.frozen;
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect({a: 1}, 'nooo why fail??').to.be.frozen;
	   *
	   * @name frozen
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('frozen', function() {
	    var obj = flag(this, 'object');

	    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
	    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
	    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
	    // The following provides ES6 behavior for ES5 environments.

	    var isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;

	    this.assert(
	      isFrozen
	      , 'expected #{this} to be frozen'
	      , 'expected #{this} to not be frozen'
	    );
	  });

	  /**
	   * ### .finite
	   *
	   * Asserts that the target is a number, and isn't `NaN` or positive/negative
	   * `Infinity`.
	   *
	   *     expect(1).to.be.finite;
	   *
	   * Add `.not` earlier in the chain to negate `.finite`. However, it's
	   * dangerous to do so. The problem is that it creates uncertain expectations
	   * by asserting that the subject either isn't a number, or that it's `NaN`, or
	   * that it's positive `Infinity`, or that it's negative `Infinity`. It's often
	   * best to identify the exact output that's expected, and then write an
	   * assertion that only accepts that exact output.
	   *
	   * When the target isn't expected to be a number, it's often best to assert
	   * that it's the expected type, rather than asserting that it isn't one of
	   * many unexpected types.
	   *
	   *     expect('foo').to.be.a('string'); // Recommended
	   *     expect('foo').to.not.be.finite; // Not recommended
	   *
	   * When the target is expected to be `NaN`, it's often best to assert exactly
	   * that.
	   *
	   *     expect(NaN).to.be.NaN; // Recommended
	   *     expect(NaN).to.not.be.finite; // Not recommended
	   *
	   * When the target is expected to be positive infinity, it's often best to
	   * assert exactly that.
	   *
	   *     expect(Infinity).to.equal(Infinity); // Recommended
	   *     expect(Infinity).to.not.be.finite; // Not recommended
	   *
	   * When the target is expected to be negative infinity, it's often best to
	   * assert exactly that.
	   *
	   *     expect(-Infinity).to.equal(-Infinity); // Recommended
	   *     expect(-Infinity).to.not.be.finite; // Not recommended
	   *
	   * A custom error message can be given as the second argument to `expect`.
	   *
	   *     expect('foo', 'nooo why fail??').to.be.finite;
	   *
	   * @name finite
	   * @namespace BDD
	   * @api public
	   */

	  Assertion.addProperty('finite', function(msg) {
	    var obj = flag(this, 'object');

	    this.assert(
	        typeof obj === 'number' && isFinite(obj)
	      , 'expected #{this} to be a finite number'
	      , 'expected #{this} to not be a finite number'
	    );
	  });
	};

	/*!
	 * chai
	 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var expect = function (chai, util) {
	  chai.expect = function (val, message) {
	    return new chai.Assertion(val, message);
	  };

	  /**
	   * ### .fail([message])
	   * ### .fail(actual, expected, [message], [operator])
	   *
	   * Throw a failure.
	   *
	   *     expect.fail();
	   *     expect.fail("custom error message");
	   *     expect.fail(1, 2);
	   *     expect.fail(1, 2, "custom error message");
	   *     expect.fail(1, 2, "custom error message", ">");
	   *     expect.fail(1, 2, undefined, ">");
	   *
	   * @name fail
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @param {String} operator
	   * @namespace BDD
	   * @api public
	   */

	  chai.expect.fail = function (actual, expected, message, operator) {
	    if (arguments.length < 2) {
	        message = actual;
	        actual = undefined;
	    }

	    message = message || 'expect.fail()';
	    throw new chai.AssertionError(message, {
	        actual: actual
	      , expected: expected
	      , operator: operator
	    }, chai.expect.fail);
	  };
	};

	/*!
	 * chai
	 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var should = function (chai, util) {
	  var Assertion = chai.Assertion;

	  function loadShould () {
	    // explicitly define this method as function as to have it's name to include as `ssfi`
	    function shouldGetter() {
	      if (this instanceof String
	          || this instanceof Number
	          || this instanceof Boolean
	          || typeof Symbol === 'function' && this instanceof Symbol) {
	        return new Assertion(this.valueOf(), null, shouldGetter);
	      }
	      return new Assertion(this, null, shouldGetter);
	    }
	    function shouldSetter(value) {
	      // See https://github.com/chaijs/chai/issues/86: this makes
	      // `whatever.should = someValue` actually set `someValue`, which is
	      // especially useful for `global.should = require('chai').should()`.
	      //
	      // Note that we have to use [[DefineProperty]] instead of [[Put]]
	      // since otherwise we would trigger this very setter!
	      Object.defineProperty(this, 'should', {
	        value: value,
	        enumerable: true,
	        configurable: true,
	        writable: true
	      });
	    }
	    // modify Object.prototype to have `should`
	    Object.defineProperty(Object.prototype, 'should', {
	      set: shouldSetter
	      , get: shouldGetter
	      , configurable: true
	    });

	    var should = {};

	    /**
	     * ### .fail([message])
	     * ### .fail(actual, expected, [message], [operator])
	     *
	     * Throw a failure.
	     *
	     *     should.fail();
	     *     should.fail("custom error message");
	     *     should.fail(1, 2);
	     *     should.fail(1, 2, "custom error message");
	     *     should.fail(1, 2, "custom error message", ">");
	     *     should.fail(1, 2, undefined, ">");
	     *
	     *
	     * @name fail
	     * @param {Mixed} actual
	     * @param {Mixed} expected
	     * @param {String} message
	     * @param {String} operator
	     * @namespace BDD
	     * @api public
	     */

	    should.fail = function (actual, expected, message, operator) {
	      if (arguments.length < 2) {
	          message = actual;
	          actual = undefined;
	      }

	      message = message || 'should.fail()';
	      throw new chai.AssertionError(message, {
	          actual: actual
	        , expected: expected
	        , operator: operator
	      }, should.fail);
	    };

	    /**
	     * ### .equal(actual, expected, [message])
	     *
	     * Asserts non-strict equality (`==`) of `actual` and `expected`.
	     *
	     *     should.equal(3, '3', '== coerces values to strings');
	     *
	     * @name equal
	     * @param {Mixed} actual
	     * @param {Mixed} expected
	     * @param {String} message
	     * @namespace Should
	     * @api public
	     */

	    should.equal = function (val1, val2, msg) {
	      new Assertion(val1, msg).to.equal(val2);
	    };

	    /**
	     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
	     *
	     * Asserts that `function` will throw an error that is an instance of
	     * `constructor`, or alternately that it will throw an error with message
	     * matching `regexp`.
	     *
	     *     should.throw(fn, 'function throws a reference error');
	     *     should.throw(fn, /function throws a reference error/);
	     *     should.throw(fn, ReferenceError);
	     *     should.throw(fn, ReferenceError, 'function throws a reference error');
	     *     should.throw(fn, ReferenceError, /function throws a reference error/);
	     *
	     * @name throw
	     * @alias Throw
	     * @param {Function} function
	     * @param {ErrorConstructor} constructor
	     * @param {RegExp} regexp
	     * @param {String} message
	     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
	     * @namespace Should
	     * @api public
	     */

	    should.Throw = function (fn, errt, errs, msg) {
	      new Assertion(fn, msg).to.Throw(errt, errs);
	    };

	    /**
	     * ### .exist
	     *
	     * Asserts that the target is neither `null` nor `undefined`.
	     *
	     *     var foo = 'hi';
	     *
	     *     should.exist(foo, 'foo exists');
	     *
	     * @name exist
	     * @namespace Should
	     * @api public
	     */

	    should.exist = function (val, msg) {
	      new Assertion(val, msg).to.exist;
	    };

	    // negation
	    should.not = {};

	    /**
	     * ### .not.equal(actual, expected, [message])
	     *
	     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
	     *
	     *     should.not.equal(3, 4, 'these numbers are not equal');
	     *
	     * @name not.equal
	     * @param {Mixed} actual
	     * @param {Mixed} expected
	     * @param {String} message
	     * @namespace Should
	     * @api public
	     */

	    should.not.equal = function (val1, val2, msg) {
	      new Assertion(val1, msg).to.not.equal(val2);
	    };

	    /**
	     * ### .throw(function, [constructor/regexp], [message])
	     *
	     * Asserts that `function` will _not_ throw an error that is an instance of
	     * `constructor`, or alternately that it will not throw an error with message
	     * matching `regexp`.
	     *
	     *     should.not.throw(fn, Error, 'function does not throw');
	     *
	     * @name not.throw
	     * @alias not.Throw
	     * @param {Function} function
	     * @param {ErrorConstructor} constructor
	     * @param {RegExp} regexp
	     * @param {String} message
	     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
	     * @namespace Should
	     * @api public
	     */

	    should.not.Throw = function (fn, errt, errs, msg) {
	      new Assertion(fn, msg).to.not.Throw(errt, errs);
	    };

	    /**
	     * ### .not.exist
	     *
	     * Asserts that the target is neither `null` nor `undefined`.
	     *
	     *     var bar = null;
	     *
	     *     should.not.exist(bar, 'bar does not exist');
	     *
	     * @name not.exist
	     * @namespace Should
	     * @api public
	     */

	    should.not.exist = function (val, msg) {
	      new Assertion(val, msg).to.not.exist;
	    };

	    should['throw'] = should['Throw'];
	    should.not['throw'] = should.not['Throw'];

	    return should;
	  }
	  chai.should = loadShould;
	  chai.Should = loadShould;
	};

	/*!
	 * chai
	 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var assert = function (chai, util) {
	  /*!
	   * Chai dependencies.
	   */

	  var Assertion = chai.Assertion
	    , flag = util.flag;

	  /*!
	   * Module export.
	   */

	  /**
	   * ### assert(expression, message)
	   *
	   * Write your own test expressions.
	   *
	   *     assert('foo' !== 'bar', 'foo is not bar');
	   *     assert(Array.isArray([]), 'empty arrays are arrays');
	   *
	   * @param {Mixed} expression to test for truthiness
	   * @param {String} message to display on error
	   * @name assert
	   * @namespace Assert
	   * @api public
	   */

	  var assert = chai.assert = function (express, errmsg) {
	    var test = new Assertion(null, null, chai.assert, true);
	    test.assert(
	        express
	      , errmsg
	      , '[ negation message unavailable ]'
	    );
	  };

	  /**
	   * ### .fail([message])
	   * ### .fail(actual, expected, [message], [operator])
	   *
	   * Throw a failure. Node.js `assert` module-compatible.
	   *
	   *     assert.fail();
	   *     assert.fail("custom error message");
	   *     assert.fail(1, 2);
	   *     assert.fail(1, 2, "custom error message");
	   *     assert.fail(1, 2, "custom error message", ">");
	   *     assert.fail(1, 2, undefined, ">");
	   *
	   * @name fail
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @param {String} operator
	   * @namespace Assert
	   * @api public
	   */

	  assert.fail = function (actual, expected, message, operator) {
	    if (arguments.length < 2) {
	        // Comply with Node's fail([message]) interface

	        message = actual;
	        actual = undefined;
	    }

	    message = message || 'assert.fail()';
	    throw new chai.AssertionError(message, {
	        actual: actual
	      , expected: expected
	      , operator: operator
	    }, assert.fail);
	  };

	  /**
	   * ### .isOk(object, [message])
	   *
	   * Asserts that `object` is truthy.
	   *
	   *     assert.isOk('everything', 'everything is ok');
	   *     assert.isOk(false, 'this will fail');
	   *
	   * @name isOk
	   * @alias ok
	   * @param {Mixed} object to test
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isOk = function (val, msg) {
	    new Assertion(val, msg, assert.isOk, true).is.ok;
	  };

	  /**
	   * ### .isNotOk(object, [message])
	   *
	   * Asserts that `object` is falsy.
	   *
	   *     assert.isNotOk('everything', 'this will fail');
	   *     assert.isNotOk(false, 'this will pass');
	   *
	   * @name isNotOk
	   * @alias notOk
	   * @param {Mixed} object to test
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotOk = function (val, msg) {
	    new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
	  };

	  /**
	   * ### .equal(actual, expected, [message])
	   *
	   * Asserts non-strict equality (`==`) of `actual` and `expected`.
	   *
	   *     assert.equal(3, '3', '== coerces values to strings');
	   *
	   * @name equal
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.equal = function (act, exp, msg) {
	    var test = new Assertion(act, msg, assert.equal, true);

	    test.assert(
	        exp == flag(test, 'object')
	      , 'expected #{this} to equal #{exp}'
	      , 'expected #{this} to not equal #{act}'
	      , exp
	      , act
	      , true
	    );
	  };

	  /**
	   * ### .notEqual(actual, expected, [message])
	   *
	   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
	   *
	   *     assert.notEqual(3, 4, 'these numbers are not equal');
	   *
	   * @name notEqual
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notEqual = function (act, exp, msg) {
	    var test = new Assertion(act, msg, assert.notEqual, true);

	    test.assert(
	        exp != flag(test, 'object')
	      , 'expected #{this} to not equal #{exp}'
	      , 'expected #{this} to equal #{act}'
	      , exp
	      , act
	      , true
	    );
	  };

	  /**
	   * ### .strictEqual(actual, expected, [message])
	   *
	   * Asserts strict equality (`===`) of `actual` and `expected`.
	   *
	   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
	   *
	   * @name strictEqual
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.strictEqual = function (act, exp, msg) {
	    new Assertion(act, msg, assert.strictEqual, true).to.equal(exp);
	  };

	  /**
	   * ### .notStrictEqual(actual, expected, [message])
	   *
	   * Asserts strict inequality (`!==`) of `actual` and `expected`.
	   *
	   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
	   *
	   * @name notStrictEqual
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notStrictEqual = function (act, exp, msg) {
	    new Assertion(act, msg, assert.notStrictEqual, true).to.not.equal(exp);
	  };

	  /**
	   * ### .deepEqual(actual, expected, [message])
	   *
	   * Asserts that `actual` is deeply equal to `expected`.
	   *
	   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
	   *
	   * @name deepEqual
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @alias deepStrictEqual
	   * @namespace Assert
	   * @api public
	   */

	  assert.deepEqual = assert.deepStrictEqual = function (act, exp, msg) {
	    new Assertion(act, msg, assert.deepEqual, true).to.eql(exp);
	  };

	  /**
	   * ### .notDeepEqual(actual, expected, [message])
	   *
	   * Assert that `actual` is not deeply equal to `expected`.
	   *
	   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
	   *
	   * @name notDeepEqual
	   * @param {Mixed} actual
	   * @param {Mixed} expected
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notDeepEqual = function (act, exp, msg) {
	    new Assertion(act, msg, assert.notDeepEqual, true).to.not.eql(exp);
	  };

	   /**
	   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
	   *
	   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`.
	   *
	   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
	   *
	   * @name isAbove
	   * @param {Mixed} valueToCheck
	   * @param {Mixed} valueToBeAbove
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isAbove = function (val, abv, msg) {
	    new Assertion(val, msg, assert.isAbove, true).to.be.above(abv);
	  };

	   /**
	   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
	   *
	   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`.
	   *
	   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
	   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
	   *
	   * @name isAtLeast
	   * @param {Mixed} valueToCheck
	   * @param {Mixed} valueToBeAtLeast
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isAtLeast = function (val, atlst, msg) {
	    new Assertion(val, msg, assert.isAtLeast, true).to.be.least(atlst);
	  };

	   /**
	   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
	   *
	   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`.
	   *
	   *     assert.isBelow(3, 6, '3 is strictly less than 6');
	   *
	   * @name isBelow
	   * @param {Mixed} valueToCheck
	   * @param {Mixed} valueToBeBelow
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isBelow = function (val, blw, msg) {
	    new Assertion(val, msg, assert.isBelow, true).to.be.below(blw);
	  };

	   /**
	   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
	   *
	   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`.
	   *
	   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
	   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
	   *
	   * @name isAtMost
	   * @param {Mixed} valueToCheck
	   * @param {Mixed} valueToBeAtMost
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isAtMost = function (val, atmst, msg) {
	    new Assertion(val, msg, assert.isAtMost, true).to.be.most(atmst);
	  };

	  /**
	   * ### .isTrue(value, [message])
	   *
	   * Asserts that `value` is true.
	   *
	   *     var teaServed = true;
	   *     assert.isTrue(teaServed, 'the tea has been served');
	   *
	   * @name isTrue
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isTrue = function (val, msg) {
	    new Assertion(val, msg, assert.isTrue, true).is['true'];
	  };

	  /**
	   * ### .isNotTrue(value, [message])
	   *
	   * Asserts that `value` is not true.
	   *
	   *     var tea = 'tasty chai';
	   *     assert.isNotTrue(tea, 'great, time for tea!');
	   *
	   * @name isNotTrue
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotTrue = function (val, msg) {
	    new Assertion(val, msg, assert.isNotTrue, true).to.not.equal(true);
	  };

	  /**
	   * ### .isFalse(value, [message])
	   *
	   * Asserts that `value` is false.
	   *
	   *     var teaServed = false;
	   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
	   *
	   * @name isFalse
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isFalse = function (val, msg) {
	    new Assertion(val, msg, assert.isFalse, true).is['false'];
	  };

	  /**
	   * ### .isNotFalse(value, [message])
	   *
	   * Asserts that `value` is not false.
	   *
	   *     var tea = 'tasty chai';
	   *     assert.isNotFalse(tea, 'great, time for tea!');
	   *
	   * @name isNotFalse
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotFalse = function (val, msg) {
	    new Assertion(val, msg, assert.isNotFalse, true).to.not.equal(false);
	  };

	  /**
	   * ### .isNull(value, [message])
	   *
	   * Asserts that `value` is null.
	   *
	   *     assert.isNull(err, 'there was no error');
	   *
	   * @name isNull
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNull = function (val, msg) {
	    new Assertion(val, msg, assert.isNull, true).to.equal(null);
	  };

	  /**
	   * ### .isNotNull(value, [message])
	   *
	   * Asserts that `value` is not null.
	   *
	   *     var tea = 'tasty chai';
	   *     assert.isNotNull(tea, 'great, time for tea!');
	   *
	   * @name isNotNull
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotNull = function (val, msg) {
	    new Assertion(val, msg, assert.isNotNull, true).to.not.equal(null);
	  };

	  /**
	   * ### .isNaN
	   *
	   * Asserts that value is NaN.
	   *
	   *     assert.isNaN(NaN, 'NaN is NaN');
	   *
	   * @name isNaN
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNaN = function (val, msg) {
	    new Assertion(val, msg, assert.isNaN, true).to.be.NaN;
	  };

	  /**
	   * ### .isNotNaN
	   *
	   * Asserts that value is not NaN.
	   *
	   *     assert.isNotNaN(4, '4 is not NaN');
	   *
	   * @name isNotNaN
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */
	  assert.isNotNaN = function (val, msg) {
	    new Assertion(val, msg, assert.isNotNaN, true).not.to.be.NaN;
	  };

	  /**
	   * ### .exists
	   *
	   * Asserts that the target is neither `null` nor `undefined`.
	   *
	   *     var foo = 'hi';
	   *
	   *     assert.exists(foo, 'foo is neither `null` nor `undefined`');
	   *
	   * @name exists
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.exists = function (val, msg) {
	    new Assertion(val, msg, assert.exists, true).to.exist;
	  };

	  /**
	   * ### .notExists
	   *
	   * Asserts that the target is either `null` or `undefined`.
	   *
	   *     var bar = null
	   *       , baz;
	   *
	   *     assert.notExists(bar);
	   *     assert.notExists(baz, 'baz is either null or undefined');
	   *
	   * @name notExists
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notExists = function (val, msg) {
	    new Assertion(val, msg, assert.notExists, true).to.not.exist;
	  };

	  /**
	   * ### .isUndefined(value, [message])
	   *
	   * Asserts that `value` is `undefined`.
	   *
	   *     var tea;
	   *     assert.isUndefined(tea, 'no tea defined');
	   *
	   * @name isUndefined
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isUndefined = function (val, msg) {
	    new Assertion(val, msg, assert.isUndefined, true).to.equal(undefined);
	  };

	  /**
	   * ### .isDefined(value, [message])
	   *
	   * Asserts that `value` is not `undefined`.
	   *
	   *     var tea = 'cup of chai';
	   *     assert.isDefined(tea, 'tea has been defined');
	   *
	   * @name isDefined
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isDefined = function (val, msg) {
	    new Assertion(val, msg, assert.isDefined, true).to.not.equal(undefined);
	  };

	  /**
	   * ### .isFunction(value, [message])
	   *
	   * Asserts that `value` is a function.
	   *
	   *     function serveTea() { return 'cup of tea'; };
	   *     assert.isFunction(serveTea, 'great, we can have tea now');
	   *
	   * @name isFunction
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isFunction = function (val, msg) {
	    new Assertion(val, msg, assert.isFunction, true).to.be.a('function');
	  };

	  /**
	   * ### .isNotFunction(value, [message])
	   *
	   * Asserts that `value` is _not_ a function.
	   *
	   *     var serveTea = [ 'heat', 'pour', 'sip' ];
	   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
	   *
	   * @name isNotFunction
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotFunction = function (val, msg) {
	    new Assertion(val, msg, assert.isNotFunction, true).to.not.be.a('function');
	  };

	  /**
	   * ### .isObject(value, [message])
	   *
	   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
	   * _The assertion does not match subclassed objects._
	   *
	   *     var selection = { name: 'Chai', serve: 'with spices' };
	   *     assert.isObject(selection, 'tea selection is an object');
	   *
	   * @name isObject
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isObject = function (val, msg) {
	    new Assertion(val, msg, assert.isObject, true).to.be.a('object');
	  };

	  /**
	   * ### .isNotObject(value, [message])
	   *
	   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
	   *
	   *     var selection = 'chai'
	   *     assert.isNotObject(selection, 'tea selection is not an object');
	   *     assert.isNotObject(null, 'null is not an object');
	   *
	   * @name isNotObject
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotObject = function (val, msg) {
	    new Assertion(val, msg, assert.isNotObject, true).to.not.be.a('object');
	  };

	  /**
	   * ### .isArray(value, [message])
	   *
	   * Asserts that `value` is an array.
	   *
	   *     var menu = [ 'green', 'chai', 'oolong' ];
	   *     assert.isArray(menu, 'what kind of tea do we want?');
	   *
	   * @name isArray
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isArray = function (val, msg) {
	    new Assertion(val, msg, assert.isArray, true).to.be.an('array');
	  };

	  /**
	   * ### .isNotArray(value, [message])
	   *
	   * Asserts that `value` is _not_ an array.
	   *
	   *     var menu = 'green|chai|oolong';
	   *     assert.isNotArray(menu, 'what kind of tea do we want?');
	   *
	   * @name isNotArray
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotArray = function (val, msg) {
	    new Assertion(val, msg, assert.isNotArray, true).to.not.be.an('array');
	  };

	  /**
	   * ### .isString(value, [message])
	   *
	   * Asserts that `value` is a string.
	   *
	   *     var teaOrder = 'chai';
	   *     assert.isString(teaOrder, 'order placed');
	   *
	   * @name isString
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isString = function (val, msg) {
	    new Assertion(val, msg, assert.isString, true).to.be.a('string');
	  };

	  /**
	   * ### .isNotString(value, [message])
	   *
	   * Asserts that `value` is _not_ a string.
	   *
	   *     var teaOrder = 4;
	   *     assert.isNotString(teaOrder, 'order placed');
	   *
	   * @name isNotString
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotString = function (val, msg) {
	    new Assertion(val, msg, assert.isNotString, true).to.not.be.a('string');
	  };

	  /**
	   * ### .isNumber(value, [message])
	   *
	   * Asserts that `value` is a number.
	   *
	   *     var cups = 2;
	   *     assert.isNumber(cups, 'how many cups');
	   *
	   * @name isNumber
	   * @param {Number} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNumber = function (val, msg) {
	    new Assertion(val, msg, assert.isNumber, true).to.be.a('number');
	  };

	  /**
	   * ### .isNotNumber(value, [message])
	   *
	   * Asserts that `value` is _not_ a number.
	   *
	   *     var cups = '2 cups please';
	   *     assert.isNotNumber(cups, 'how many cups');
	   *
	   * @name isNotNumber
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotNumber = function (val, msg) {
	    new Assertion(val, msg, assert.isNotNumber, true).to.not.be.a('number');
	  };

	   /**
	   * ### .isFinite(value, [message])
	   *
	   * Asserts that `value` is a finite number. Unlike `.isNumber`, this will fail for `NaN` and `Infinity`.
	   *
	   *     var cups = 2;
	   *     assert.isFinite(cups, 'how many cups');
	   *
	   *     assert.isFinite(NaN); // throws
	   *
	   * @name isFinite
	   * @param {Number} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isFinite = function (val, msg) {
	    new Assertion(val, msg, assert.isFinite, true).to.be.finite;
	  };

	  /**
	   * ### .isBoolean(value, [message])
	   *
	   * Asserts that `value` is a boolean.
	   *
	   *     var teaReady = true
	   *       , teaServed = false;
	   *
	   *     assert.isBoolean(teaReady, 'is the tea ready');
	   *     assert.isBoolean(teaServed, 'has tea been served');
	   *
	   * @name isBoolean
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isBoolean = function (val, msg) {
	    new Assertion(val, msg, assert.isBoolean, true).to.be.a('boolean');
	  };

	  /**
	   * ### .isNotBoolean(value, [message])
	   *
	   * Asserts that `value` is _not_ a boolean.
	   *
	   *     var teaReady = 'yep'
	   *       , teaServed = 'nope';
	   *
	   *     assert.isNotBoolean(teaReady, 'is the tea ready');
	   *     assert.isNotBoolean(teaServed, 'has tea been served');
	   *
	   * @name isNotBoolean
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotBoolean = function (val, msg) {
	    new Assertion(val, msg, assert.isNotBoolean, true).to.not.be.a('boolean');
	  };

	  /**
	   * ### .typeOf(value, name, [message])
	   *
	   * Asserts that `value`'s type is `name`, as determined by
	   * `Object.prototype.toString`.
	   *
	   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
	   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
	   *     assert.typeOf('tea', 'string', 'we have a string');
	   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
	   *     assert.typeOf(null, 'null', 'we have a null');
	   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
	   *
	   * @name typeOf
	   * @param {Mixed} value
	   * @param {String} name
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.typeOf = function (val, type, msg) {
	    new Assertion(val, msg, assert.typeOf, true).to.be.a(type);
	  };

	  /**
	   * ### .notTypeOf(value, name, [message])
	   *
	   * Asserts that `value`'s type is _not_ `name`, as determined by
	   * `Object.prototype.toString`.
	   *
	   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
	   *
	   * @name notTypeOf
	   * @param {Mixed} value
	   * @param {String} typeof name
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notTypeOf = function (val, type, msg) {
	    new Assertion(val, msg, assert.notTypeOf, true).to.not.be.a(type);
	  };

	  /**
	   * ### .instanceOf(object, constructor, [message])
	   *
	   * Asserts that `value` is an instance of `constructor`.
	   *
	   *     var Tea = function (name) { this.name = name; }
	   *       , chai = new Tea('chai');
	   *
	   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
	   *
	   * @name instanceOf
	   * @param {Object} object
	   * @param {Constructor} constructor
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.instanceOf = function (val, type, msg) {
	    new Assertion(val, msg, assert.instanceOf, true).to.be.instanceOf(type);
	  };

	  /**
	   * ### .notInstanceOf(object, constructor, [message])
	   *
	   * Asserts `value` is not an instance of `constructor`.
	   *
	   *     var Tea = function (name) { this.name = name; }
	   *       , chai = new String('chai');
	   *
	   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
	   *
	   * @name notInstanceOf
	   * @param {Object} object
	   * @param {Constructor} constructor
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notInstanceOf = function (val, type, msg) {
	    new Assertion(val, msg, assert.notInstanceOf, true)
	      .to.not.be.instanceOf(type);
	  };

	  /**
	   * ### .include(haystack, needle, [message])
	   *
	   * Asserts that `haystack` includes `needle`. Can be used to assert the
	   * inclusion of a value in an array, a substring in a string, or a subset of
	   * properties in an object.
	   *
	   *     assert.include([1,2,3], 2, 'array contains value');
	   *     assert.include('foobar', 'foo', 'string contains substring');
	   *     assert.include({ foo: 'bar', hello: 'universe' }, { foo: 'bar' }, 'object contains property');
	   *
	   * Strict equality (===) is used. When asserting the inclusion of a value in
	   * an array, the array is searched for an element that's strictly equal to the
	   * given value. When asserting a subset of properties in an object, the object
	   * is searched for the given property keys, checking that each one is present
	   * and strictly equal to the given property value. For instance:
	   *
	   *     var obj1 = {a: 1}
	   *       , obj2 = {b: 2};
	   *     assert.include([obj1, obj2], obj1);
	   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1});
	   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1, bar: obj2});
	   *
	   * @name include
	   * @param {Array|String} haystack
	   * @param {Mixed} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.include = function (exp, inc, msg) {
	    new Assertion(exp, msg, assert.include, true).include(inc);
	  };

	  /**
	   * ### .notInclude(haystack, needle, [message])
	   *
	   * Asserts that `haystack` does not include `needle`. Can be used to assert
	   * the absence of a value in an array, a substring in a string, or a subset of
	   * properties in an object.
	   *
	   *     assert.notInclude([1,2,3], 4, "array doesn't contain value");
	   *     assert.notInclude('foobar', 'baz', "string doesn't contain substring");
	   *     assert.notInclude({ foo: 'bar', hello: 'universe' }, { foo: 'baz' }, 'object doesn't contain property');
	   *
	   * Strict equality (===) is used. When asserting the absence of a value in an
	   * array, the array is searched to confirm the absence of an element that's
	   * strictly equal to the given value. When asserting a subset of properties in
	   * an object, the object is searched to confirm that at least one of the given
	   * property keys is either not present or not strictly equal to the given
	   * property value. For instance:
	   *
	   *     var obj1 = {a: 1}
	   *       , obj2 = {b: 2};
	   *     assert.notInclude([obj1, obj2], {a: 1});
	   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
	   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: obj1, bar: {b: 2}});
	   *
	   * @name notInclude
	   * @param {Array|String} haystack
	   * @param {Mixed} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notInclude = function (exp, inc, msg) {
	    new Assertion(exp, msg, assert.notInclude, true).not.include(inc);
	  };

	  /**
	   * ### .deepInclude(haystack, needle, [message])
	   *
	   * Asserts that `haystack` includes `needle`. Can be used to assert the
	   * inclusion of a value in an array or a subset of properties in an object.
	   * Deep equality is used.
	   *
	   *     var obj1 = {a: 1}
	   *       , obj2 = {b: 2};
	   *     assert.deepInclude([obj1, obj2], {a: 1});
	   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
	   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 2}});
	   *
	   * @name deepInclude
	   * @param {Array|String} haystack
	   * @param {Mixed} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.deepInclude = function (exp, inc, msg) {
	    new Assertion(exp, msg, assert.deepInclude, true).deep.include(inc);
	  };

	  /**
	   * ### .notDeepInclude(haystack, needle, [message])
	   *
	   * Asserts that `haystack` does not include `needle`. Can be used to assert
	   * the absence of a value in an array or a subset of properties in an object.
	   * Deep equality is used.
	   *
	   *     var obj1 = {a: 1}
	   *       , obj2 = {b: 2};
	   *     assert.notDeepInclude([obj1, obj2], {a: 9});
	   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 9}});
	   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 9}});
	   *
	   * @name notDeepInclude
	   * @param {Array|String} haystack
	   * @param {Mixed} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notDeepInclude = function (exp, inc, msg) {
	    new Assertion(exp, msg, assert.notDeepInclude, true).not.deep.include(inc);
	  };

	  /**
	   * ### .nestedInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' includes 'needle'.
	   * Can be used to assert the inclusion of a subset of properties in an
	   * object.
	   * Enables the use of dot- and bracket-notation for referencing nested
	   * properties.
	   * '[]' and '.' in property names can be escaped using double backslashes.
	   *
	   *     assert.nestedInclude({'.a': {'b': 'x'}}, {'\\.a.[b]': 'x'});
	   *     assert.nestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'x'});
	   *
	   * @name nestedInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.nestedInclude = function (exp, inc, msg) {
	    new Assertion(exp, msg, assert.nestedInclude, true).nested.include(inc);
	  };

	  /**
	   * ### .notNestedInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' does not include 'needle'.
	   * Can be used to assert the absence of a subset of properties in an
	   * object.
	   * Enables the use of dot- and bracket-notation for referencing nested
	   * properties.
	   * '[]' and '.' in property names can be escaped using double backslashes.
	   *
	   *     assert.notNestedInclude({'.a': {'b': 'x'}}, {'\\.a.b': 'y'});
	   *     assert.notNestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'y'});
	   *
	   * @name notNestedInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notNestedInclude = function (exp, inc, msg) {
	    new Assertion(exp, msg, assert.notNestedInclude, true)
	      .not.nested.include(inc);
	  };

	  /**
	   * ### .deepNestedInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' includes 'needle'.
	   * Can be used to assert the inclusion of a subset of properties in an
	   * object while checking for deep equality.
	   * Enables the use of dot- and bracket-notation for referencing nested
	   * properties.
	   * '[]' and '.' in property names can be escaped using double backslashes.
	   *
	   *     assert.deepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {x: 1}});
	   *     assert.deepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {x: 1}});
	   *
	   * @name deepNestedInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.deepNestedInclude = function(exp, inc, msg) {
	    new Assertion(exp, msg, assert.deepNestedInclude, true)
	      .deep.nested.include(inc);
	  };

	  /**
	   * ### .notDeepNestedInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' does not include 'needle'.
	   * Can be used to assert the absence of a subset of properties in an
	   * object while checking for deep equality.
	   * Enables the use of dot- and bracket-notation for referencing nested
	   * properties.
	   * '[]' and '.' in property names can be escaped using double backslashes.
	   *
	   *     assert.notDeepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {y: 1}})
	   *     assert.notDeepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {y: 2}});
	   *
	   * @name notDeepNestedInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notDeepNestedInclude = function(exp, inc, msg) {
	    new Assertion(exp, msg, assert.notDeepNestedInclude, true)
	      .not.deep.nested.include(inc);
	  };

	  /**
	   * ### .ownInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' includes 'needle'.
	   * Can be used to assert the inclusion of a subset of properties in an
	   * object while ignoring inherited properties.
	   *
	   *     assert.ownInclude({ a: 1 }, { a: 1 });
	   *
	   * @name ownInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.ownInclude = function(exp, inc, msg) {
	    new Assertion(exp, msg, assert.ownInclude, true).own.include(inc);
	  };

	  /**
	   * ### .notOwnInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' includes 'needle'.
	   * Can be used to assert the absence of a subset of properties in an
	   * object while ignoring inherited properties.
	   *
	   *     Object.prototype.b = 2;
	   *
	   *     assert.notOwnInclude({ a: 1 }, { b: 2 });
	   *
	   * @name notOwnInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notOwnInclude = function(exp, inc, msg) {
	    new Assertion(exp, msg, assert.notOwnInclude, true).not.own.include(inc);
	  };

	  /**
	   * ### .deepOwnInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' includes 'needle'.
	   * Can be used to assert the inclusion of a subset of properties in an
	   * object while ignoring inherited properties and checking for deep equality.
	   *
	   *      assert.deepOwnInclude({a: {b: 2}}, {a: {b: 2}});
	   *
	   * @name deepOwnInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.deepOwnInclude = function(exp, inc, msg) {
	    new Assertion(exp, msg, assert.deepOwnInclude, true)
	      .deep.own.include(inc);
	  };

	   /**
	   * ### .notDeepOwnInclude(haystack, needle, [message])
	   *
	   * Asserts that 'haystack' includes 'needle'.
	   * Can be used to assert the absence of a subset of properties in an
	   * object while ignoring inherited properties and checking for deep equality.
	   *
	   *      assert.notDeepOwnInclude({a: {b: 2}}, {a: {c: 3}});
	   *
	   * @name notDeepOwnInclude
	   * @param {Object} haystack
	   * @param {Object} needle
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notDeepOwnInclude = function(exp, inc, msg) {
	    new Assertion(exp, msg, assert.notDeepOwnInclude, true)
	      .not.deep.own.include(inc);
	  };

	  /**
	   * ### .match(value, regexp, [message])
	   *
	   * Asserts that `value` matches the regular expression `regexp`.
	   *
	   *     assert.match('foobar', /^foo/, 'regexp matches');
	   *
	   * @name match
	   * @param {Mixed} value
	   * @param {RegExp} regexp
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.match = function (exp, re, msg) {
	    new Assertion(exp, msg, assert.match, true).to.match(re);
	  };

	  /**
	   * ### .notMatch(value, regexp, [message])
	   *
	   * Asserts that `value` does not match the regular expression `regexp`.
	   *
	   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
	   *
	   * @name notMatch
	   * @param {Mixed} value
	   * @param {RegExp} regexp
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notMatch = function (exp, re, msg) {
	    new Assertion(exp, msg, assert.notMatch, true).to.not.match(re);
	  };

	  /**
	   * ### .property(object, property, [message])
	   *
	   * Asserts that `object` has a direct or inherited property named by
	   * `property`.
	   *
	   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
	   *     assert.property({ tea: { green: 'matcha' }}, 'toString');
	   *
	   * @name property
	   * @param {Object} object
	   * @param {String} property
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.property = function (obj, prop, msg) {
	    new Assertion(obj, msg, assert.property, true).to.have.property(prop);
	  };

	  /**
	   * ### .notProperty(object, property, [message])
	   *
	   * Asserts that `object` does _not_ have a direct or inherited property named
	   * by `property`.
	   *
	   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
	   *
	   * @name notProperty
	   * @param {Object} object
	   * @param {String} property
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notProperty = function (obj, prop, msg) {
	    new Assertion(obj, msg, assert.notProperty, true)
	      .to.not.have.property(prop);
	  };

	  /**
	   * ### .propertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` has a direct or inherited property named by
	   * `property` with a value given by `value`. Uses a strict equality check
	   * (===).
	   *
	   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
	   *
	   * @name propertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.propertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.propertyVal, true)
	      .to.have.property(prop, val);
	  };

	  /**
	   * ### .notPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` does _not_ have a direct or inherited property named
	   * by `property` with value given by `value`. Uses a strict equality check
	   * (===).
	   *
	   *     assert.notPropertyVal({ tea: 'is good' }, 'tea', 'is bad');
	   *     assert.notPropertyVal({ tea: 'is good' }, 'coffee', 'is good');
	   *
	   * @name notPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.notPropertyVal, true)
	      .to.not.have.property(prop, val);
	  };

	  /**
	   * ### .deepPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` has a direct or inherited property named by
	   * `property` with a value given by `value`. Uses a deep equality check.
	   *
	   *     assert.deepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
	   *
	   * @name deepPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.deepPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.deepPropertyVal, true)
	      .to.have.deep.property(prop, val);
	  };

	  /**
	   * ### .notDeepPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` does _not_ have a direct or inherited property named
	   * by `property` with value given by `value`. Uses a deep equality check.
	   *
	   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
	   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
	   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
	   *
	   * @name notDeepPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notDeepPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.notDeepPropertyVal, true)
	      .to.not.have.deep.property(prop, val);
	  };

	  /**
	   * ### .ownProperty(object, property, [message])
	   *
	   * Asserts that `object` has a direct property named by `property`. Inherited
	   * properties aren't checked.
	   *
	   *     assert.ownProperty({ tea: { green: 'matcha' }}, 'tea');
	   *
	   * @name ownProperty
	   * @param {Object} object
	   * @param {String} property
	   * @param {String} message
	   * @api public
	   */

	  assert.ownProperty = function (obj, prop, msg) {
	    new Assertion(obj, msg, assert.ownProperty, true)
	      .to.have.own.property(prop);
	  };

	  /**
	   * ### .notOwnProperty(object, property, [message])
	   *
	   * Asserts that `object` does _not_ have a direct property named by
	   * `property`. Inherited properties aren't checked.
	   *
	   *     assert.notOwnProperty({ tea: { green: 'matcha' }}, 'coffee');
	   *     assert.notOwnProperty({}, 'toString');
	   *
	   * @name notOwnProperty
	   * @param {Object} object
	   * @param {String} property
	   * @param {String} message
	   * @api public
	   */

	  assert.notOwnProperty = function (obj, prop, msg) {
	    new Assertion(obj, msg, assert.notOwnProperty, true)
	      .to.not.have.own.property(prop);
	  };

	  /**
	   * ### .ownPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` has a direct property named by `property` and a value
	   * equal to the provided `value`. Uses a strict equality check (===).
	   * Inherited properties aren't checked.
	   *
	   *     assert.ownPropertyVal({ coffee: 'is good'}, 'coffee', 'is good');
	   *
	   * @name ownPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @api public
	   */

	  assert.ownPropertyVal = function (obj, prop, value, msg) {
	    new Assertion(obj, msg, assert.ownPropertyVal, true)
	      .to.have.own.property(prop, value);
	  };

	  /**
	   * ### .notOwnPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` does _not_ have a direct property named by `property`
	   * with a value equal to the provided `value`. Uses a strict equality check
	   * (===). Inherited properties aren't checked.
	   *
	   *     assert.notOwnPropertyVal({ tea: 'is better'}, 'tea', 'is worse');
	   *     assert.notOwnPropertyVal({}, 'toString', Object.prototype.toString);
	   *
	   * @name notOwnPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @api public
	   */

	  assert.notOwnPropertyVal = function (obj, prop, value, msg) {
	    new Assertion(obj, msg, assert.notOwnPropertyVal, true)
	      .to.not.have.own.property(prop, value);
	  };

	  /**
	   * ### .deepOwnPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` has a direct property named by `property` and a value
	   * equal to the provided `value`. Uses a deep equality check. Inherited
	   * properties aren't checked.
	   *
	   *     assert.deepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
	   *
	   * @name deepOwnPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @api public
	   */

	  assert.deepOwnPropertyVal = function (obj, prop, value, msg) {
	    new Assertion(obj, msg, assert.deepOwnPropertyVal, true)
	      .to.have.deep.own.property(prop, value);
	  };

	  /**
	   * ### .notDeepOwnPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` does _not_ have a direct property named by `property`
	   * with a value equal to the provided `value`. Uses a deep equality check.
	   * Inherited properties aren't checked.
	   *
	   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
	   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
	   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
	   *     assert.notDeepOwnPropertyVal({}, 'toString', Object.prototype.toString);
	   *
	   * @name notDeepOwnPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @api public
	   */

	  assert.notDeepOwnPropertyVal = function (obj, prop, value, msg) {
	    new Assertion(obj, msg, assert.notDeepOwnPropertyVal, true)
	      .to.not.have.deep.own.property(prop, value);
	  };

	  /**
	   * ### .nestedProperty(object, property, [message])
	   *
	   * Asserts that `object` has a direct or inherited property named by
	   * `property`, which can be a string using dot- and bracket-notation for
	   * nested reference.
	   *
	   *     assert.nestedProperty({ tea: { green: 'matcha' }}, 'tea.green');
	   *
	   * @name nestedProperty
	   * @param {Object} object
	   * @param {String} property
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.nestedProperty = function (obj, prop, msg) {
	    new Assertion(obj, msg, assert.nestedProperty, true)
	      .to.have.nested.property(prop);
	  };

	  /**
	   * ### .notNestedProperty(object, property, [message])
	   *
	   * Asserts that `object` does _not_ have a property named by `property`, which
	   * can be a string using dot- and bracket-notation for nested reference. The
	   * property cannot exist on the object nor anywhere in its prototype chain.
	   *
	   *     assert.notNestedProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
	   *
	   * @name notNestedProperty
	   * @param {Object} object
	   * @param {String} property
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notNestedProperty = function (obj, prop, msg) {
	    new Assertion(obj, msg, assert.notNestedProperty, true)
	      .to.not.have.nested.property(prop);
	  };

	  /**
	   * ### .nestedPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` has a property named by `property` with value given
	   * by `value`. `property` can use dot- and bracket-notation for nested
	   * reference. Uses a strict equality check (===).
	   *
	   *     assert.nestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
	   *
	   * @name nestedPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.nestedPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.nestedPropertyVal, true)
	      .to.have.nested.property(prop, val);
	  };

	  /**
	   * ### .notNestedPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` does _not_ have a property named by `property` with
	   * value given by `value`. `property` can use dot- and bracket-notation for
	   * nested reference. Uses a strict equality check (===).
	   *
	   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
	   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'coffee.green', 'matcha');
	   *
	   * @name notNestedPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notNestedPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.notNestedPropertyVal, true)
	      .to.not.have.nested.property(prop, val);
	  };

	  /**
	   * ### .deepNestedPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` has a property named by `property` with a value given
	   * by `value`. `property` can use dot- and bracket-notation for nested
	   * reference. Uses a deep equality check.
	   *
	   *     assert.deepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yum' });
	   *
	   * @name deepNestedPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.deepNestedPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.deepNestedPropertyVal, true)
	      .to.have.deep.nested.property(prop, val);
	  };

	  /**
	   * ### .notDeepNestedPropertyVal(object, property, value, [message])
	   *
	   * Asserts that `object` does _not_ have a property named by `property` with
	   * value given by `value`. `property` can use dot- and bracket-notation for
	   * nested reference. Uses a deep equality check.
	   *
	   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { oolong: 'yum' });
	   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yuck' });
	   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.black', { matcha: 'yum' });
	   *
	   * @name notDeepNestedPropertyVal
	   * @param {Object} object
	   * @param {String} property
	   * @param {Mixed} value
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notDeepNestedPropertyVal = function (obj, prop, val, msg) {
	    new Assertion(obj, msg, assert.notDeepNestedPropertyVal, true)
	      .to.not.have.deep.nested.property(prop, val);
	  };

	  /**
	   * ### .lengthOf(object, length, [message])
	   *
	   * Asserts that `object` has a `length` or `size` with the expected value.
	   *
	   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
	   *     assert.lengthOf('foobar', 6, 'string has length of 6');
	   *     assert.lengthOf(new Set([1,2,3]), 3, 'set has size of 3');
	   *     assert.lengthOf(new Map([['a',1],['b',2],['c',3]]), 3, 'map has size of 3');
	   *
	   * @name lengthOf
	   * @param {Mixed} object
	   * @param {Number} length
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.lengthOf = function (exp, len, msg) {
	    new Assertion(exp, msg, assert.lengthOf, true).to.have.lengthOf(len);
	  };

	  /**
	   * ### .hasAnyKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has at least one of the `keys` provided.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'iDontExist', 'baz']);
	   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, iDontExist: 99, baz: 1337});
	   *     assert.hasAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
	   *     assert.hasAnyKeys(new Set([{foo: 'bar'}, 'anotherKey']), [{foo: 'bar'}, 'anotherKey']);
	   *
	   * @name hasAnyKeys
	   * @param {Mixed} object
	   * @param {Array|Object} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.hasAnyKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.hasAnyKeys, true).to.have.any.keys(keys);
	  };

	  /**
	   * ### .hasAllKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has all and only all of the `keys` provided.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
	   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337]);
	   *     assert.hasAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
	   *     assert.hasAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
	   *
	   * @name hasAllKeys
	   * @param {Mixed} object
	   * @param {String[]} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.hasAllKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.hasAllKeys, true).to.have.all.keys(keys);
	  };

	  /**
	   * ### .containsAllKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has all of the `keys` provided but may have more keys not listed.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'baz']);
	   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
	   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, baz: 1337});
	   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337});
	   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}]);
	   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
	   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}]);
	   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
	   *
	   * @name containsAllKeys
	   * @param {Mixed} object
	   * @param {String[]} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.containsAllKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.containsAllKeys, true)
	      .to.contain.all.keys(keys);
	  };

	  /**
	   * ### .doesNotHaveAnyKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has none of the `keys` provided.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
	   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
	   *     assert.doesNotHaveAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
	   *     assert.doesNotHaveAnyKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
	   *
	   * @name doesNotHaveAnyKeys
	   * @param {Mixed} object
	   * @param {String[]} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotHaveAnyKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.doesNotHaveAnyKeys, true)
	      .to.not.have.any.keys(keys);
	  };

	  /**
	   * ### .doesNotHaveAllKeys(object, [keys], [message])
	   *
	   * Asserts that `object` does not have at least one of the `keys` provided.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
	   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
	   *     assert.doesNotHaveAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
	   *     assert.doesNotHaveAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
	   *
	   * @name doesNotHaveAllKeys
	   * @param {Mixed} object
	   * @param {String[]} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotHaveAllKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.doesNotHaveAllKeys, true)
	      .to.not.have.all.keys(keys);
	  };

	  /**
	   * ### .hasAnyDeepKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has at least one of the `keys` provided.
	   * Since Sets and Maps can have objects as keys you can use this assertion to perform
	   * a deep comparison.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
	   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), [{one: 'one'}, {two: 'two'}]);
	   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
	   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
	   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {three: 'three'}]);
	   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
	   *
	   * @name doesNotHaveAllKeys
	   * @param {Mixed} object
	   * @param {Array|Object} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.hasAnyDeepKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.hasAnyDeepKeys, true)
	      .to.have.any.deep.keys(keys);
	  };

	 /**
	   * ### .hasAllDeepKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has all and only all of the `keys` provided.
	   * Since Sets and Maps can have objects as keys you can use this assertion to perform
	   * a deep comparison.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne']]), {one: 'one'});
	   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
	   *     assert.hasAllDeepKeys(new Set([{one: 'one'}]), {one: 'one'});
	   *     assert.hasAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
	   *
	   * @name hasAllDeepKeys
	   * @param {Mixed} object
	   * @param {Array|Object} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.hasAllDeepKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.hasAllDeepKeys, true)
	      .to.have.all.deep.keys(keys);
	  };

	 /**
	   * ### .containsAllDeepKeys(object, [keys], [message])
	   *
	   * Asserts that `object` contains all of the `keys` provided.
	   * Since Sets and Maps can have objects as keys you can use this assertion to perform
	   * a deep comparison.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
	   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
	   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
	   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
	   *
	   * @name containsAllDeepKeys
	   * @param {Mixed} object
	   * @param {Array|Object} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.containsAllDeepKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.containsAllDeepKeys, true)
	      .to.contain.all.deep.keys(keys);
	  };

	 /**
	   * ### .doesNotHaveAnyDeepKeys(object, [keys], [message])
	   *
	   * Asserts that `object` has none of the `keys` provided.
	   * Since Sets and Maps can have objects as keys you can use this assertion to perform
	   * a deep comparison.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
	   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
	   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
	   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
	   *
	   * @name doesNotHaveAnyDeepKeys
	   * @param {Mixed} object
	   * @param {Array|Object} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotHaveAnyDeepKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.doesNotHaveAnyDeepKeys, true)
	      .to.not.have.any.deep.keys(keys);
	  };

	 /**
	   * ### .doesNotHaveAllDeepKeys(object, [keys], [message])
	   *
	   * Asserts that `object` does not have at least one of the `keys` provided.
	   * Since Sets and Maps can have objects as keys you can use this assertion to perform
	   * a deep comparison.
	   * You can also provide a single object instead of a `keys` array and its keys
	   * will be used as the expected set of keys.
	   *
	   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
	   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {one: 'one'}]);
	   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
	   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {fifty: 'fifty'}]);
	   *
	   * @name doesNotHaveAllDeepKeys
	   * @param {Mixed} object
	   * @param {Array|Object} keys
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotHaveAllDeepKeys = function (obj, keys, msg) {
	    new Assertion(obj, msg, assert.doesNotHaveAllDeepKeys, true)
	      .to.not.have.all.deep.keys(keys);
	  };

	 /**
	   * ### .throws(fn, [errorLike/string/regexp], [string/regexp], [message])
	   *
	   * If `errorLike` is an `Error` constructor, asserts that `fn` will throw an error that is an
	   * instance of `errorLike`.
	   * If `errorLike` is an `Error` instance, asserts that the error thrown is the same
	   * instance as `errorLike`.
	   * If `errMsgMatcher` is provided, it also asserts that the error thrown will have a
	   * message matching `errMsgMatcher`.
	   *
	   *     assert.throws(fn, 'Error thrown must have this msg');
	   *     assert.throws(fn, /Error thrown must have a msg that matches this/);
	   *     assert.throws(fn, ReferenceError);
	   *     assert.throws(fn, errorInstance);
	   *     assert.throws(fn, ReferenceError, 'Error thrown must be a ReferenceError and have this msg');
	   *     assert.throws(fn, errorInstance, 'Error thrown must be the same errorInstance and have this msg');
	   *     assert.throws(fn, ReferenceError, /Error thrown must be a ReferenceError and match this/);
	   *     assert.throws(fn, errorInstance, /Error thrown must be the same errorInstance and match this/);
	   *
	   * @name throws
	   * @alias throw
	   * @alias Throw
	   * @param {Function} fn
	   * @param {ErrorConstructor|Error} errorLike
	   * @param {RegExp|String} errMsgMatcher
	   * @param {String} message
	   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
	   * @namespace Assert
	   * @api public
	   */

	  assert.throws = function (fn, errorLike, errMsgMatcher, msg) {
	    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
	      errMsgMatcher = errorLike;
	      errorLike = null;
	    }

	    var assertErr = new Assertion(fn, msg, assert.throws, true)
	      .to.throw(errorLike, errMsgMatcher);
	    return flag(assertErr, 'object');
	  };

	  /**
	   * ### .doesNotThrow(fn, [errorLike/string/regexp], [string/regexp], [message])
	   *
	   * If `errorLike` is an `Error` constructor, asserts that `fn` will _not_ throw an error that is an
	   * instance of `errorLike`.
	   * If `errorLike` is an `Error` instance, asserts that the error thrown is _not_ the same
	   * instance as `errorLike`.
	   * If `errMsgMatcher` is provided, it also asserts that the error thrown will _not_ have a
	   * message matching `errMsgMatcher`.
	   *
	   *     assert.doesNotThrow(fn, 'Any Error thrown must not have this message');
	   *     assert.doesNotThrow(fn, /Any Error thrown must not match this/);
	   *     assert.doesNotThrow(fn, Error);
	   *     assert.doesNotThrow(fn, errorInstance);
	   *     assert.doesNotThrow(fn, Error, 'Error must not have this message');
	   *     assert.doesNotThrow(fn, errorInstance, 'Error must not have this message');
	   *     assert.doesNotThrow(fn, Error, /Error must not match this/);
	   *     assert.doesNotThrow(fn, errorInstance, /Error must not match this/);
	   *
	   * @name doesNotThrow
	   * @param {Function} fn
	   * @param {ErrorConstructor} errorLike
	   * @param {RegExp|String} errMsgMatcher
	   * @param {String} message
	   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotThrow = function (fn, errorLike, errMsgMatcher, msg) {
	    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
	      errMsgMatcher = errorLike;
	      errorLike = null;
	    }

	    new Assertion(fn, msg, assert.doesNotThrow, true)
	      .to.not.throw(errorLike, errMsgMatcher);
	  };

	  /**
	   * ### .operator(val1, operator, val2, [message])
	   *
	   * Compares two values using `operator`.
	   *
	   *     assert.operator(1, '<', 2, 'everything is ok');
	   *     assert.operator(1, '>', 2, 'this will fail');
	   *
	   * @name operator
	   * @param {Mixed} val1
	   * @param {String} operator
	   * @param {Mixed} val2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.operator = function (val, operator, val2, msg) {
	    var ok;
	    switch(operator) {
	      case '==':
	        ok = val == val2;
	        break;
	      case '===':
	        ok = val === val2;
	        break;
	      case '>':
	        ok = val > val2;
	        break;
	      case '>=':
	        ok = val >= val2;
	        break;
	      case '<':
	        ok = val < val2;
	        break;
	      case '<=':
	        ok = val <= val2;
	        break;
	      case '!=':
	        ok = val != val2;
	        break;
	      case '!==':
	        ok = val !== val2;
	        break;
	      default:
	        msg = msg ? msg + ': ' : msg;
	        throw new chai.AssertionError(
	          msg + 'Invalid operator "' + operator + '"',
	          undefined,
	          assert.operator
	        );
	    }
	    var test = new Assertion(ok, msg, assert.operator, true);
	    test.assert(
	        true === flag(test, 'object')
	      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
	      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
	  };

	  /**
	   * ### .closeTo(actual, expected, delta, [message])
	   *
	   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
	   *
	   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
	   *
	   * @name closeTo
	   * @param {Number} actual
	   * @param {Number} expected
	   * @param {Number} delta
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.closeTo = function (act, exp, delta, msg) {
	    new Assertion(act, msg, assert.closeTo, true).to.be.closeTo(exp, delta);
	  };

	  /**
	   * ### .approximately(actual, expected, delta, [message])
	   *
	   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
	   *
	   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
	   *
	   * @name approximately
	   * @param {Number} actual
	   * @param {Number} expected
	   * @param {Number} delta
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.approximately = function (act, exp, delta, msg) {
	    new Assertion(act, msg, assert.approximately, true)
	      .to.be.approximately(exp, delta);
	  };

	  /**
	   * ### .sameMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` have the same members in any order. Uses a
	   * strict equality check (===).
	   *
	   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
	   *
	   * @name sameMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.sameMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.sameMembers, true)
	      .to.have.same.members(set2);
	  };

	  /**
	   * ### .notSameMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` don't have the same members in any order.
	   * Uses a strict equality check (===).
	   *
	   *     assert.notSameMembers([ 1, 2, 3 ], [ 5, 1, 3 ], 'not same members');
	   *
	   * @name notSameMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notSameMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.notSameMembers, true)
	      .to.not.have.same.members(set2);
	  };

	  /**
	   * ### .sameDeepMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` have the same members in any order. Uses a
	   * deep equality check.
	   *
	   *     assert.sameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { c: 3 }], 'same deep members');
	   *
	   * @name sameDeepMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.sameDeepMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.sameDeepMembers, true)
	      .to.have.same.deep.members(set2);
	  };

	  /**
	   * ### .notSameDeepMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` don't have the same members in any order.
	   * Uses a deep equality check.
	   *
	   *     assert.notSameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { f: 5 }], 'not same deep members');
	   *
	   * @name notSameDeepMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notSameDeepMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.notSameDeepMembers, true)
	      .to.not.have.same.deep.members(set2);
	  };

	  /**
	   * ### .sameOrderedMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` have the same members in the same order.
	   * Uses a strict equality check (===).
	   *
	   *     assert.sameOrderedMembers([ 1, 2, 3 ], [ 1, 2, 3 ], 'same ordered members');
	   *
	   * @name sameOrderedMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.sameOrderedMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.sameOrderedMembers, true)
	      .to.have.same.ordered.members(set2);
	  };

	  /**
	   * ### .notSameOrderedMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` don't have the same members in the same
	   * order. Uses a strict equality check (===).
	   *
	   *     assert.notSameOrderedMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'not same ordered members');
	   *
	   * @name notSameOrderedMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notSameOrderedMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.notSameOrderedMembers, true)
	      .to.not.have.same.ordered.members(set2);
	  };

	  /**
	   * ### .sameDeepOrderedMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` have the same members in the same order.
	   * Uses a deep equality check.
	   *
	   * assert.sameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { c: 3 } ], 'same deep ordered members');
	   *
	   * @name sameDeepOrderedMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.sameDeepOrderedMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.sameDeepOrderedMembers, true)
	      .to.have.same.deep.ordered.members(set2);
	  };

	  /**
	   * ### .notSameDeepOrderedMembers(set1, set2, [message])
	   *
	   * Asserts that `set1` and `set2` don't have the same members in the same
	   * order. Uses a deep equality check.
	   *
	   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { z: 5 } ], 'not same deep ordered members');
	   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { c: 3 } ], 'not same deep ordered members');
	   *
	   * @name notSameDeepOrderedMembers
	   * @param {Array} set1
	   * @param {Array} set2
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notSameDeepOrderedMembers = function (set1, set2, msg) {
	    new Assertion(set1, msg, assert.notSameDeepOrderedMembers, true)
	      .to.not.have.same.deep.ordered.members(set2);
	  };

	  /**
	   * ### .includeMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` is included in `superset` in any order. Uses a
	   * strict equality check (===). Duplicates are ignored.
	   *
	   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1, 2 ], 'include members');
	   *
	   * @name includeMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.includeMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.includeMembers, true)
	      .to.include.members(subset);
	  };

	  /**
	   * ### .notIncludeMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` isn't included in `superset` in any order. Uses a
	   * strict equality check (===). Duplicates are ignored.
	   *
	   *     assert.notIncludeMembers([ 1, 2, 3 ], [ 5, 1 ], 'not include members');
	   *
	   * @name notIncludeMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notIncludeMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.notIncludeMembers, true)
	      .to.not.include.members(subset);
	  };

	  /**
	   * ### .includeDeepMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` is included in `superset` in any order. Uses a deep
	   * equality check. Duplicates are ignored.
	   *
	   *     assert.includeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { b: 2 } ], 'include deep members');
	   *
	   * @name includeDeepMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.includeDeepMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.includeDeepMembers, true)
	      .to.include.deep.members(subset);
	  };

	  /**
	   * ### .notIncludeDeepMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` isn't included in `superset` in any order. Uses a
	   * deep equality check. Duplicates are ignored.
	   *
	   *     assert.notIncludeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { f: 5 } ], 'not include deep members');
	   *
	   * @name notIncludeDeepMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notIncludeDeepMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.notIncludeDeepMembers, true)
	      .to.not.include.deep.members(subset);
	  };

	  /**
	   * ### .includeOrderedMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` is included in `superset` in the same order
	   * beginning with the first element in `superset`. Uses a strict equality
	   * check (===).
	   *
	   *     assert.includeOrderedMembers([ 1, 2, 3 ], [ 1, 2 ], 'include ordered members');
	   *
	   * @name includeOrderedMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.includeOrderedMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.includeOrderedMembers, true)
	      .to.include.ordered.members(subset);
	  };

	  /**
	   * ### .notIncludeOrderedMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` isn't included in `superset` in the same order
	   * beginning with the first element in `superset`. Uses a strict equality
	   * check (===).
	   *
	   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 1 ], 'not include ordered members');
	   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 3 ], 'not include ordered members');
	   *
	   * @name notIncludeOrderedMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notIncludeOrderedMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.notIncludeOrderedMembers, true)
	      .to.not.include.ordered.members(subset);
	  };

	  /**
	   * ### .includeDeepOrderedMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` is included in `superset` in the same order
	   * beginning with the first element in `superset`. Uses a deep equality
	   * check.
	   *
	   *     assert.includeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 } ], 'include deep ordered members');
	   *
	   * @name includeDeepOrderedMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.includeDeepOrderedMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.includeDeepOrderedMembers, true)
	      .to.include.deep.ordered.members(subset);
	  };

	  /**
	   * ### .notIncludeDeepOrderedMembers(superset, subset, [message])
	   *
	   * Asserts that `subset` isn't included in `superset` in the same order
	   * beginning with the first element in `superset`. Uses a deep equality
	   * check.
	   *
	   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { f: 5 } ], 'not include deep ordered members');
	   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 } ], 'not include deep ordered members');
	   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { c: 3 } ], 'not include deep ordered members');
	   *
	   * @name notIncludeDeepOrderedMembers
	   * @param {Array} superset
	   * @param {Array} subset
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.notIncludeDeepOrderedMembers = function (superset, subset, msg) {
	    new Assertion(superset, msg, assert.notIncludeDeepOrderedMembers, true)
	      .to.not.include.deep.ordered.members(subset);
	  };

	  /**
	   * ### .oneOf(inList, list, [message])
	   *
	   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
	   *
	   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
	   *
	   * @name oneOf
	   * @param {*} inList
	   * @param {Array<*>} list
	   * @param {String} message
	   * @namespace Assert
	   * @api public
	   */

	  assert.oneOf = function (inList, list, msg) {
	    new Assertion(inList, msg, assert.oneOf, true).to.be.oneOf(list);
	  };

	  /**
	   * ### .changes(function, object, property, [message])
	   *
	   * Asserts that a function changes the value of a property.
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 22 };
	   *     assert.changes(fn, obj, 'val');
	   *
	   * @name changes
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.changes = function (fn, obj, prop, msg) {
	    if (arguments.length === 3 && typeof obj === 'function') {
	      msg = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.changes, true).to.change(obj, prop);
	  };

	   /**
	   * ### .changesBy(function, object, property, delta, [message])
	   *
	   * Asserts that a function changes the value of a property by an amount (delta).
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val += 2 };
	   *     assert.changesBy(fn, obj, 'val', 2);
	   *
	   * @name changesBy
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.changesBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.changesBy, true)
	      .to.change(obj, prop).by(delta);
	  };

	   /**
	   * ### .doesNotChange(function, object, property, [message])
	   *
	   * Asserts that a function does not change the value of a property.
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { console.log('foo'); };
	   *     assert.doesNotChange(fn, obj, 'val');
	   *
	   * @name doesNotChange
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotChange = function (fn, obj, prop, msg) {
	    if (arguments.length === 3 && typeof obj === 'function') {
	      msg = prop;
	      prop = null;
	    }

	    return new Assertion(fn, msg, assert.doesNotChange, true)
	      .to.not.change(obj, prop);
	  };

	  /**
	   * ### .changesButNotBy(function, object, property, delta, [message])
	   *
	   * Asserts that a function does not change the value of a property or of a function's return value by an amount (delta)
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val += 10 };
	   *     assert.changesButNotBy(fn, obj, 'val', 5);
	   *
	   * @name changesButNotBy
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.changesButNotBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.changesButNotBy, true)
	      .to.change(obj, prop).but.not.by(delta);
	  };

	  /**
	   * ### .increases(function, object, property, [message])
	   *
	   * Asserts that a function increases a numeric object property.
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 13 };
	   *     assert.increases(fn, obj, 'val');
	   *
	   * @name increases
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.increases = function (fn, obj, prop, msg) {
	    if (arguments.length === 3 && typeof obj === 'function') {
	      msg = prop;
	      prop = null;
	    }

	    return new Assertion(fn, msg, assert.increases, true)
	      .to.increase(obj, prop);
	  };

	  /**
	   * ### .increasesBy(function, object, property, delta, [message])
	   *
	   * Asserts that a function increases a numeric object property or a function's return value by an amount (delta).
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val += 10 };
	   *     assert.increasesBy(fn, obj, 'val', 10);
	   *
	   * @name increasesBy
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.increasesBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.increasesBy, true)
	      .to.increase(obj, prop).by(delta);
	  };

	  /**
	   * ### .doesNotIncrease(function, object, property, [message])
	   *
	   * Asserts that a function does not increase a numeric object property.
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 8 };
	   *     assert.doesNotIncrease(fn, obj, 'val');
	   *
	   * @name doesNotIncrease
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotIncrease = function (fn, obj, prop, msg) {
	    if (arguments.length === 3 && typeof obj === 'function') {
	      msg = prop;
	      prop = null;
	    }

	    return new Assertion(fn, msg, assert.doesNotIncrease, true)
	      .to.not.increase(obj, prop);
	  };

	  /**
	   * ### .increasesButNotBy(function, object, property, [message])
	   *
	   * Asserts that a function does not increase a numeric object property or function's return value by an amount (delta).
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 15 };
	   *     assert.increasesButNotBy(fn, obj, 'val', 10);
	   *
	   * @name increasesButNotBy
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.increasesButNotBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.increasesButNotBy, true)
	      .to.increase(obj, prop).but.not.by(delta);
	  };

	  /**
	   * ### .decreases(function, object, property, [message])
	   *
	   * Asserts that a function decreases a numeric object property.
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 5 };
	   *     assert.decreases(fn, obj, 'val');
	   *
	   * @name decreases
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.decreases = function (fn, obj, prop, msg) {
	    if (arguments.length === 3 && typeof obj === 'function') {
	      msg = prop;
	      prop = null;
	    }

	    return new Assertion(fn, msg, assert.decreases, true)
	      .to.decrease(obj, prop);
	  };

	  /**
	   * ### .decreasesBy(function, object, property, delta, [message])
	   *
	   * Asserts that a function decreases a numeric object property or a function's return value by an amount (delta)
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val -= 5 };
	   *     assert.decreasesBy(fn, obj, 'val', 5);
	   *
	   * @name decreasesBy
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.decreasesBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.decreasesBy, true)
	      .to.decrease(obj, prop).by(delta);
	  };

	  /**
	   * ### .doesNotDecrease(function, object, property, [message])
	   *
	   * Asserts that a function does not decreases a numeric object property.
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 15 };
	   *     assert.doesNotDecrease(fn, obj, 'val');
	   *
	   * @name doesNotDecrease
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotDecrease = function (fn, obj, prop, msg) {
	    if (arguments.length === 3 && typeof obj === 'function') {
	      msg = prop;
	      prop = null;
	    }

	    return new Assertion(fn, msg, assert.doesNotDecrease, true)
	      .to.not.decrease(obj, prop);
	  };

	  /**
	   * ### .doesNotDecreaseBy(function, object, property, delta, [message])
	   *
	   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 5 };
	   *     assert.doesNotDecreaseBy(fn, obj, 'val', 1);
	   *
	   * @name doesNotDecrease
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.doesNotDecreaseBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    return new Assertion(fn, msg, assert.doesNotDecreaseBy, true)
	      .to.not.decrease(obj, prop).by(delta);
	  };

	  /**
	   * ### .decreasesButNotBy(function, object, property, delta, [message])
	   *
	   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
	   *
	   *     var obj = { val: 10 };
	   *     var fn = function() { obj.val = 5 };
	   *     assert.decreasesButNotBy(fn, obj, 'val', 1);
	   *
	   * @name decreasesButNotBy
	   * @param {Function} modifier function
	   * @param {Object} object or getter function
	   * @param {String} property name _optional_
	   * @param {Number} change amount (delta)
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.decreasesButNotBy = function (fn, obj, prop, delta, msg) {
	    if (arguments.length === 4 && typeof obj === 'function') {
	      var tmpMsg = delta;
	      delta = prop;
	      msg = tmpMsg;
	    } else if (arguments.length === 3) {
	      delta = prop;
	      prop = null;
	    }

	    new Assertion(fn, msg, assert.decreasesButNotBy, true)
	      .to.decrease(obj, prop).but.not.by(delta);
	  };

	  /*!
	   * ### .ifError(object)
	   *
	   * Asserts if value is not a false value, and throws if it is a true value.
	   * This is added to allow for chai to be a drop-in replacement for Node's
	   * assert class.
	   *
	   *     var err = new Error('I am a custom error');
	   *     assert.ifError(err); // Rethrows err!
	   *
	   * @name ifError
	   * @param {Object} object
	   * @namespace Assert
	   * @api public
	   */

	  assert.ifError = function (val) {
	    if (val) {
	      throw(val);
	    }
	  };

	  /**
	   * ### .isExtensible(object)
	   *
	   * Asserts that `object` is extensible (can have new properties added to it).
	   *
	   *     assert.isExtensible({});
	   *
	   * @name isExtensible
	   * @alias extensible
	   * @param {Object} object
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isExtensible = function (obj, msg) {
	    new Assertion(obj, msg, assert.isExtensible, true).to.be.extensible;
	  };

	  /**
	   * ### .isNotExtensible(object)
	   *
	   * Asserts that `object` is _not_ extensible.
	   *
	   *     var nonExtensibleObject = Object.preventExtensions({});
	   *     var sealedObject = Object.seal({});
	   *     var frozenObject = Object.freeze({});
	   *
	   *     assert.isNotExtensible(nonExtensibleObject);
	   *     assert.isNotExtensible(sealedObject);
	   *     assert.isNotExtensible(frozenObject);
	   *
	   * @name isNotExtensible
	   * @alias notExtensible
	   * @param {Object} object
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotExtensible = function (obj, msg) {
	    new Assertion(obj, msg, assert.isNotExtensible, true).to.not.be.extensible;
	  };

	  /**
	   * ### .isSealed(object)
	   *
	   * Asserts that `object` is sealed (cannot have new properties added to it
	   * and its existing properties cannot be removed).
	   *
	   *     var sealedObject = Object.seal({});
	   *     var frozenObject = Object.seal({});
	   *
	   *     assert.isSealed(sealedObject);
	   *     assert.isSealed(frozenObject);
	   *
	   * @name isSealed
	   * @alias sealed
	   * @param {Object} object
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isSealed = function (obj, msg) {
	    new Assertion(obj, msg, assert.isSealed, true).to.be.sealed;
	  };

	  /**
	   * ### .isNotSealed(object)
	   *
	   * Asserts that `object` is _not_ sealed.
	   *
	   *     assert.isNotSealed({});
	   *
	   * @name isNotSealed
	   * @alias notSealed
	   * @param {Object} object
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotSealed = function (obj, msg) {
	    new Assertion(obj, msg, assert.isNotSealed, true).to.not.be.sealed;
	  };

	  /**
	   * ### .isFrozen(object)
	   *
	   * Asserts that `object` is frozen (cannot have new properties added to it
	   * and its existing properties cannot be modified).
	   *
	   *     var frozenObject = Object.freeze({});
	   *     assert.frozen(frozenObject);
	   *
	   * @name isFrozen
	   * @alias frozen
	   * @param {Object} object
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isFrozen = function (obj, msg) {
	    new Assertion(obj, msg, assert.isFrozen, true).to.be.frozen;
	  };

	  /**
	   * ### .isNotFrozen(object)
	   *
	   * Asserts that `object` is _not_ frozen.
	   *
	   *     assert.isNotFrozen({});
	   *
	   * @name isNotFrozen
	   * @alias notFrozen
	   * @param {Object} object
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotFrozen = function (obj, msg) {
	    new Assertion(obj, msg, assert.isNotFrozen, true).to.not.be.frozen;
	  };

	  /**
	   * ### .isEmpty(target)
	   *
	   * Asserts that the target does not contain any values.
	   * For arrays and strings, it checks the `length` property.
	   * For `Map` and `Set` instances, it checks the `size` property.
	   * For non-function objects, it gets the count of own
	   * enumerable string keys.
	   *
	   *     assert.isEmpty([]);
	   *     assert.isEmpty('');
	   *     assert.isEmpty(new Map);
	   *     assert.isEmpty({});
	   *
	   * @name isEmpty
	   * @alias empty
	   * @param {Object|Array|String|Map|Set} target
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isEmpty = function(val, msg) {
	    new Assertion(val, msg, assert.isEmpty, true).to.be.empty;
	  };

	  /**
	   * ### .isNotEmpty(target)
	   *
	   * Asserts that the target contains values.
	   * For arrays and strings, it checks the `length` property.
	   * For `Map` and `Set` instances, it checks the `size` property.
	   * For non-function objects, it gets the count of own
	   * enumerable string keys.
	   *
	   *     assert.isNotEmpty([1, 2]);
	   *     assert.isNotEmpty('34');
	   *     assert.isNotEmpty(new Set([5, 6]));
	   *     assert.isNotEmpty({ key: 7 });
	   *
	   * @name isNotEmpty
	   * @alias notEmpty
	   * @param {Object|Array|String|Map|Set} target
	   * @param {String} message _optional_
	   * @namespace Assert
	   * @api public
	   */

	  assert.isNotEmpty = function(val, msg) {
	    new Assertion(val, msg, assert.isNotEmpty, true).to.not.be.empty;
	  };

	  /*!
	   * Aliases.
	   */

	  (function alias(name, as){
	    assert[as] = assert[name];
	    return alias;
	  })
	  ('isOk', 'ok')
	  ('isNotOk', 'notOk')
	  ('throws', 'throw')
	  ('throws', 'Throw')
	  ('isExtensible', 'extensible')
	  ('isNotExtensible', 'notExtensible')
	  ('isSealed', 'sealed')
	  ('isNotSealed', 'notSealed')
	  ('isFrozen', 'frozen')
	  ('isNotFrozen', 'notFrozen')
	  ('isEmpty', 'empty')
	  ('isNotEmpty', 'notEmpty');
	};

	/*!
	 * chai
	 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	var chai = createCommonjsModule(function (module, exports) {
	var used = [];

	/*!
	 * Chai version
	 */

	exports.version = '4.2.0';

	/*!
	 * Assertion Error
	 */

	exports.AssertionError = assertionError;

	/*!
	 * Utils for plugins (not exported)
	 */



	/**
	 * # .use(function)
	 *
	 * Provides a way to extend the internals of Chai.
	 *
	 * @param {Function}
	 * @returns {this} for chaining
	 * @api public
	 */

	exports.use = function (fn) {
	  if (!~used.indexOf(fn)) {
	    fn(exports, utils);
	    used.push(fn);
	  }

	  return exports;
	};

	/*!
	 * Utility Functions
	 */

	exports.util = utils;

	/*!
	 * Configuration
	 */


	exports.config = config;

	/*!
	 * Primary `Assertion` prototype
	 */


	exports.use(assertion);

	/*!
	 * Core Assertions
	 */


	exports.use(assertions);

	/*!
	 * Expect interface
	 */


	exports.use(expect);

	/*!
	 * Should interface
	 */


	exports.use(should);

	/*!
	 * Assert interface
	 */


	exports.use(assert);
	});

	var chai$1 = chai;

	var expatlib = createCommonjsModule(function (module, exports) {
	var cpp = (function() {
	  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
	  
	  return (
	function(cpp) {
	  cpp = cpp || {};

	var Module=typeof cpp!=="undefined"?cpp:{};var readyPromiseResolve,readyPromiseReject;Module["ready"]=new Promise(function(resolve,reject){readyPromiseResolve=resolve;readyPromiseReject=reject;});var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key];}}var thisProgram="./this.program";var ENVIRONMENT_IS_WEB=true;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readBinary;{if(typeof document!=="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src;}if(_scriptDir){scriptDirectory=_scriptDir;}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1);}else {scriptDirectory="";}{read_=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};}}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key];}}moduleOverrides=null;if(Module["arguments"])Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])Module["quit"];var STACK_ALIGN=16;function alignMemory(size,factor){if(!factor)factor=STACK_ALIGN;return Math.ceil(size/factor)*factor}var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];if(Module["noExitRuntime"])Module["noExitRuntime"];if(typeof WebAssembly!=="object"){abort("no native wasm support detected");}var wasmMemory;var ABORT=false;function assert(condition,text){if(!condition){abort("Assertion failed: "+text);}}var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heap,idx,maxBytesToRead){var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heap[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heap.subarray&&UTF8Decoder){return UTF8Decoder.decode(heap.subarray(idx,endPtr))}else {var str="";while(idx<endPtr){var u0=heap[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heap[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heap[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else {u0=(u0&7)<<18|u1<<12|u2<<6|heap[idx++]&63;}if(u0<65536){str+=String.fromCharCode(u0);}else {var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}}return str}function UTF8ToString(ptr,maxBytesToRead){return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function stringToUTF8Array(str,heap,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023;}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}else {if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}}heap[outIdx]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127)++len;else if(u<=2047)len+=2;else if(u<=65535)len+=3;else len+=4;}return len}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i);}if(!dontAddNull)HEAP8[buffer>>0]=0;}function alignUp(x,multiple){if(x%multiple>0){x+=multiple-x%multiple;}return x}var buffer,HEAP8,HEAPU8,HEAP32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=new Uint16Array(buf);Module["HEAPU32"]=new Uint32Array(buf);Module["HEAPF32"]=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf);}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[];function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function initRuntime(){if(!Module["noFSInit"]&&!FS.init.initialized)FS.init();TTY.init();callRuntimeCallbacks(__ATINIT__);}function preMain(){FS.ignorePermissions=false;callRuntimeCallbacks(__ATMAIN__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}var runDependencies=0;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what);}what+="";err(what);ABORT=true;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}function hasPrefix(str,prefix){return String.prototype.startsWith?str.startsWith(prefix):str.indexOf(prefix)===0}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return hasPrefix(filename,dataURIPrefix)}var wasmBinaryFile="expatlib.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile);}function getBinary(file){try{if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary);else {throw "both async and sync fetching of the wasm failed"}}catch(err){abort(err);}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw "failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["l"];updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["m"];removeRunDependency();}addRunDependency();function receiveInstantiatedSource(output){receiveInstance(output["instance"]);}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason);})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiatedSource,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiatedSource)})})}else {return instantiateArrayBuffer(receiveInstantiatedSource)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync().catch(readyPromiseReject);return {}}var tempDouble;var tempI64;var ASM_CONSTS={1284:function($0){var self=Module["getCache"](Module["CExpatJS"])[$0];if(!self.hasOwnProperty("startElement"))throw "a JSImplementation must implement all functions, you forgot CExpatJS::startElement.";self["startElement"]();},1504:function($0){var self=Module["getCache"](Module["CExpatJS"])[$0];if(!self.hasOwnProperty("endElement"))throw "a JSImplementation must implement all functions, you forgot CExpatJS::endElement.";self["endElement"]();},1716:function($0){var self=Module["getCache"](Module["CExpatJS"])[$0];if(!self.hasOwnProperty("characterData"))throw "a JSImplementation must implement all functions, you forgot CExpatJS::characterData.";self["characterData"]();}};function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){wasmTable.get(func)();}else {wasmTable.get(func)(callback.arg);}}else {func(callback.arg===undefined?null:callback.arg);}}}var PATH={splitPath:function(filename){var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:function(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1);}else if(last===".."){parts.splice(i,1);up++;}else if(up){parts.splice(i,1);up--;}}if(allowAboveRoot){for(;up;up--){parts.unshift("..");}}return parts},normalize:function(path){var isAbsolute=path.charAt(0)==="/",trailingSlash=path.substr(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(function(p){return !!p}),!isAbsolute).join("/");if(!path&&!isAbsolute){path=".";}if(path&&trailingSlash){path+="/";}return (isAbsolute?"/":"")+path},dirname:function(path){var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return "."}if(dir){dir=dir.substr(0,dir.length-1);}return root+dir},basename:function(path){if(path==="/")return "/";path=PATH.normalize(path);path=path.replace(/\/$/,"");var lastSlash=path.lastIndexOf("/");if(lastSlash===-1)return path;return path.substr(lastSlash+1)},extname:function(path){return PATH.splitPath(path)[3]},join:function(){var paths=Array.prototype.slice.call(arguments,0);return PATH.normalize(paths.join("/"))},join2:function(l,r){return PATH.normalize(l+"/"+r)}};function getRandomDevice(){if(typeof crypto==="object"&&typeof crypto["getRandomValues"]==="function"){var randomBuffer=new Uint8Array(1);return function(){crypto.getRandomValues(randomBuffer);return randomBuffer[0]}}else return function(){abort("randomDevice");}}var PATH_FS={resolve:function(){var resolvedPath="",resolvedAbsolute=false;for(var i=arguments.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?arguments[i]:FS.cwd();if(typeof path!=="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return ""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=path.charAt(0)==="/";}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter(function(p){return !!p}),!resolvedAbsolute).join("/");return (resolvedAbsolute?"/":"")+resolvedPath||"."},relative:function(from,to){from=PATH_FS.resolve(from).substr(1);to=PATH_FS.resolve(to).substr(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return [];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..");}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")}};var TTY={ttys:[],init:function(){},shutdown:function(){},register:function(dev,ops){TTY.ttys[dev]={input:[],output:[],ops:ops};FS.registerDevice(dev,TTY.stream_ops);},stream_ops:{open:function(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(43)}stream.tty=tty;stream.seekable=false;},close:function(stream){stream.tty.ops.flush(stream.tty);},flush:function(stream){stream.tty.ops.flush(stream.tty);},read:function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(60)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty);}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead},write:function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(60)}try{for(var i=0;i<length;i++){stream.tty.ops.put_char(stream.tty,buffer[offset+i]);}}catch(e){throw new FS.ErrnoError(29)}if(length){stream.node.timestamp=Date.now();}return i}},default_tty_ops:{get_char:function(tty){if(!tty.input.length){var result=null;if(typeof window!="undefined"&&typeof window.prompt=="function"){result=window.prompt("Input: ");if(result!==null){result+="\n";}}else if(typeof readline=="function"){result=readline();if(result!==null){result+="\n";}}if(!result){return null}tty.input=intArrayFromString(result,true);}return tty.input.shift()},put_char:function(tty,val){if(val===null||val===10){out(UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}},flush:function(tty){if(tty.output&&tty.output.length>0){out(UTF8ArrayToString(tty.output,0));tty.output=[];}}},default_tty1_ops:{put_char:function(tty,val){if(val===null||val===10){err(UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}},flush:function(tty){if(tty.output&&tty.output.length>0){err(UTF8ArrayToString(tty.output,0));tty.output=[];}}}};function mmapAlloc(size){var alignedSize=alignMemory(size,16384);var ptr=_malloc(alignedSize);while(size<alignedSize)HEAP8[ptr+size++]=0;return ptr}var MEMFS={ops_table:null,mount:function(mount){return MEMFS.createNode(null,"/",16384|511,0)},createNode:function(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(63)}if(!MEMFS.ops_table){MEMFS.ops_table={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,allocate:MEMFS.stream_ops.allocate,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};}var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={};}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=null;}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream;}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream;}node.timestamp=Date.now();if(parent){parent.contents[name]=node;}return node},getFileDataAsRegularArray:function(node){if(node.contents&&node.contents.subarray){var arr=[];for(var i=0;i<node.usedBytes;++i)arr.push(node.contents[i]);return arr}return node.contents},getFileDataAsTypedArray:function(node){if(!node.contents)return new Uint8Array(0);if(node.contents.subarray)return node.contents.subarray(0,node.usedBytes);return new Uint8Array(node.contents)},expandFileStorage:function(node,newCapacity){var prevCapacity=node.contents?node.contents.length:0;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)>>>0);if(prevCapacity!=0)newCapacity=Math.max(newCapacity,256);var oldContents=node.contents;node.contents=new Uint8Array(newCapacity);if(node.usedBytes>0)node.contents.set(oldContents.subarray(0,node.usedBytes),0);return},resizeFileStorage:function(node,newSize){if(node.usedBytes==newSize)return;if(newSize==0){node.contents=null;node.usedBytes=0;return}if(!node.contents||node.contents.subarray){var oldContents=node.contents;node.contents=new Uint8Array(newSize);if(oldContents){node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)));}node.usedBytes=newSize;return}if(!node.contents)node.contents=[];if(node.contents.length>newSize)node.contents.length=newSize;else while(node.contents.length<newSize)node.contents.push(0);node.usedBytes=newSize;},node_ops:{getattr:function(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096;}else if(FS.isFile(node.mode)){attr.size=node.usedBytes;}else if(FS.isLink(node.mode)){attr.size=node.link.length;}else {attr.size=0;}attr.atime=new Date(node.timestamp);attr.mtime=new Date(node.timestamp);attr.ctime=new Date(node.timestamp);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr},setattr:function(node,attr){if(attr.mode!==undefined){node.mode=attr.mode;}if(attr.timestamp!==undefined){node.timestamp=attr.timestamp;}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size);}},lookup:function(parent,name){throw FS.genericErrors[44]},mknod:function(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)},rename:function(old_node,new_dir,new_name){if(FS.isDir(old_node.mode)){var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(new_node){for(var i in new_node.contents){throw new FS.ErrnoError(55)}}}delete old_node.parent.contents[old_node.name];old_node.name=new_name;new_dir.contents[new_name]=old_node;old_node.parent=new_dir;},unlink:function(parent,name){delete parent.contents[name];},rmdir:function(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(55)}delete parent.contents[name];},readdir:function(node){var entries=[".",".."];for(var key in node.contents){if(!node.contents.hasOwnProperty(key)){continue}entries.push(key);}return entries},symlink:function(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node},readlink:function(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(28)}return node.link}},stream_ops:{read:function(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);if(size>8&&contents.subarray){buffer.set(contents.subarray(position,position+size),offset);}else {for(var i=0;i<size;i++)buffer[offset+i]=contents[position+i];}return size},write:function(stream,buffer,offset,length,position,canOwn){if(buffer.buffer===HEAP8.buffer){canOwn=false;}if(!length)return 0;var node=stream.node;node.timestamp=Date.now();if(buffer.subarray&&(!node.contents||node.contents.subarray)){if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length;return length}else if(node.usedBytes===0&&position===0){node.contents=buffer.slice(offset,offset+length);node.usedBytes=length;return length}else if(position+length<=node.usedBytes){node.contents.set(buffer.subarray(offset,offset+length),position);return length}}MEMFS.expandFileStorage(node,position+length);if(node.contents.subarray&&buffer.subarray){node.contents.set(buffer.subarray(offset,offset+length),position);}else {for(var i=0;i<length;i++){node.contents[position+i]=buffer[offset+i];}}node.usedBytes=Math.max(node.usedBytes,position+length);return length},llseek:function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes;}}if(position<0){throw new FS.ErrnoError(28)}return position},allocate:function(stream,offset,length){MEMFS.expandFileStorage(stream.node,offset+length);stream.node.usedBytes=Math.max(stream.node.usedBytes,offset+length);},mmap:function(stream,address,length,position,prot,flags){assert(address===0);if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&contents.buffer===buffer){allocated=false;ptr=contents.byteOffset;}else {if(position>0||position+length<contents.length){if(contents.subarray){contents=contents.subarray(position,position+length);}else {contents=Array.prototype.slice.call(contents,position,position+length);}}allocated=true;ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}HEAP8.set(contents,ptr);}return {ptr:ptr,allocated:allocated}},msync:function(stream,buffer,offset,length,mmapFlags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}if(mmapFlags&2){return 0}var bytesWritten=MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0}}};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:function(path,opts){path=PATH_FS.resolve(FS.cwd(),path);opts=opts||{};if(!path)return {path:"",node:null};var defaults={follow_mount:true,recurse_count:0};for(var key in defaults){if(opts[key]===undefined){opts[key]=defaults[key];}}if(opts.recurse_count>8){throw new FS.ErrnoError(32)}var parts=PATH.normalizeArray(path.split("/").filter(function(p){return !!p}),false);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}current=FS.lookupNode(current,parts[i]);current_path=PATH.join2(current_path,parts[i]);if(FS.isMountpoint(current)){if(!islast||islast&&opts.follow_mount){current=current.mounted.root;}}if(!islast||opts.follow){var count=0;while(FS.isLink(current.mode)){var link=FS.readlink(current_path);current_path=PATH_FS.resolve(PATH.dirname(current_path),link);var lookup=FS.lookupPath(current_path,{recurse_count:opts.recurse_count});current=lookup.node;if(count++>40){throw new FS.ErrnoError(32)}}}}return {path:current_path,node:current}},getPath:function(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?mount+"/"+path:mount+path}path=path?node.name+"/"+path:node.name;node=node.parent;}},hashName:function(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0;}return (parentid+hash>>>0)%FS.nameTable.length},hashAddNode:function(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node;},hashRemoveNode:function(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next;}else {var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next;}}},lookupNode:function(parent,name){var errCode=FS.mayLookup(parent);if(errCode){throw new FS.ErrnoError(errCode,parent)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)},createNode:function(parent,name,mode,rdev){var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node},destroyNode:function(node){FS.hashRemoveNode(node);},isRoot:function(node){return node===node.parent},isMountpoint:function(node){return !!node.mounted},isFile:function(mode){return (mode&61440)===32768},isDir:function(mode){return (mode&61440)===16384},isLink:function(mode){return (mode&61440)===40960},isChrdev:function(mode){return (mode&61440)===8192},isBlkdev:function(mode){return (mode&61440)===24576},isFIFO:function(mode){return (mode&61440)===4096},isSocket:function(mode){return (mode&49152)===49152},flagModes:{"r":0,"r+":2,"w":577,"w+":578,"a":1089,"a+":1090},modeStringToFlags:function(str){var flags=FS.flagModes[str];if(typeof flags==="undefined"){throw new Error("Unknown file open mode: "+str)}return flags},flagsToPermissionString:function(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w";}return perms},nodePermissions:function(node,perms){if(FS.ignorePermissions){return 0}if(perms.indexOf("r")!==-1&&!(node.mode&292)){return 2}else if(perms.indexOf("w")!==-1&&!(node.mode&146)){return 2}else if(perms.indexOf("x")!==-1&&!(node.mode&73)){return 2}return 0},mayLookup:function(dir){var errCode=FS.nodePermissions(dir,"x");if(errCode)return errCode;if(!dir.node_ops.lookup)return 2;return 0},mayCreate:function(dir,name){try{var node=FS.lookupNode(dir,name);return 20}catch(e){}return FS.nodePermissions(dir,"wx")},mayDelete:function(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name);}catch(e){return e.errno}var errCode=FS.nodePermissions(dir,"wx");if(errCode){return errCode}if(isdir){if(!FS.isDir(node.mode)){return 54}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return 10}}else {if(FS.isDir(node.mode)){return 31}}return 0},mayOpen:function(node,flags){if(!node){return 44}if(FS.isLink(node.mode)){return 32}else if(FS.isDir(node.mode)){if(FS.flagsToPermissionString(flags)!=="r"||flags&512){return 31}}return FS.nodePermissions(node,FS.flagsToPermissionString(flags))},MAX_OPEN_FDS:4096,nextfd:function(fd_start,fd_end){fd_start=fd_start||0;fd_end=fd_end||FS.MAX_OPEN_FDS;for(var fd=fd_start;fd<=fd_end;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(33)},getStream:function(fd){return FS.streams[fd]},createStream:function(stream,fd_start,fd_end){if(!FS.FSStream){FS.FSStream=function(){};FS.FSStream.prototype={object:{get:function(){return this.node},set:function(val){this.node=val;}},isRead:{get:function(){return (this.flags&2097155)!==1}},isWrite:{get:function(){return (this.flags&2097155)!==0}},isAppend:{get:function(){return this.flags&1024}}};}var newStream=new FS.FSStream;for(var p in stream){newStream[p]=stream[p];}stream=newStream;var fd=FS.nextfd(fd_start,fd_end);stream.fd=fd;FS.streams[fd]=stream;return stream},closeStream:function(fd){FS.streams[fd]=null;},chrdev_stream_ops:{open:function(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;if(stream.stream_ops.open){stream.stream_ops.open(stream);}},llseek:function(){throw new FS.ErrnoError(70)}},major:function(dev){return dev>>8},minor:function(dev){return dev&255},makedev:function(ma,mi){return ma<<8|mi},registerDevice:function(dev,ops){FS.devices[dev]={stream_ops:ops};},getDevice:function(dev){return FS.devices[dev]},getMounts:function(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push.apply(check,m.mounts);}return mounts},syncfs:function(populate,callback){if(typeof populate==="function"){callback=populate;populate=false;}FS.syncFSRequests++;if(FS.syncFSRequests>1){err("warning: "+FS.syncFSRequests+" FS.syncfs operations in flight at once, probably just doing extra work");}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(errCode){FS.syncFSRequests--;return callback(errCode)}function done(errCode){if(errCode){if(!done.errored){done.errored=true;return doCallback(errCode)}return}if(++completed>=mounts.length){doCallback(null);}}mounts.forEach(function(mount){if(!mount.type.syncfs){return done(null)}mount.type.syncfs(mount,populate,done);});},mount:function(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(10)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}}var mount={type:type,opts:opts,mountpoint:mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot;}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount);}}return mountRoot},unmount:function(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(28)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);Object.keys(FS.nameTable).forEach(function(hash){var current=FS.nameTable[hash];while(current){var next=current.name_next;if(mounts.indexOf(current.mount)!==-1){FS.destroyNode(current);}current=next;}});node.mounted=null;var idx=node.mount.mounts.indexOf(mount);node.mount.mounts.splice(idx,1);},lookup:function(parent,name){return parent.node_ops.lookup(parent,name)},mknod:function(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name||name==="."||name===".."){throw new FS.ErrnoError(28)}var errCode=FS.mayCreate(parent,name);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(63)}return parent.node_ops.mknod(parent,name,mode,dev)},create:function(path,mode){mode=mode!==undefined?mode:438;mode&=4095;mode|=32768;return FS.mknod(path,mode,0)},mkdir:function(path,mode){mode=mode!==undefined?mode:511;mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)},mkdirTree:function(path,mode){var dirs=path.split("/");var d="";for(var i=0;i<dirs.length;++i){if(!dirs[i])continue;d+="/"+dirs[i];try{FS.mkdir(d,mode);}catch(e){if(e.errno!=20)throw e}}},mkdev:function(path,mode,dev){if(typeof dev==="undefined"){dev=mode;mode=438;}mode|=8192;return FS.mknod(path,mode,dev)},symlink:function(oldpath,newpath){if(!PATH_FS.resolve(oldpath)){throw new FS.ErrnoError(44)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(63)}return parent.node_ops.symlink(parent,newname,oldpath)},rename:function(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;if(!old_dir||!new_dir)throw new FS.ErrnoError(44);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(75)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH_FS.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(28)}relative=PATH_FS.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(55)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var errCode=FS.mayDelete(old_dir,old_name,isdir);if(errCode){throw new FS.ErrnoError(errCode)}errCode=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(errCode){throw new FS.ErrnoError(errCode)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(63)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(10)}if(new_dir!==old_dir){errCode=FS.nodePermissions(old_dir,"w");if(errCode){throw new FS.ErrnoError(errCode)}}try{if(FS.trackingDelegate["willMovePath"]){FS.trackingDelegate["willMovePath"](old_path,new_path);}}catch(e){err("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);}catch(e){throw e}finally{FS.hashAddNode(old_node);}try{if(FS.trackingDelegate["onMovePath"])FS.trackingDelegate["onMovePath"](old_path,new_path);}catch(e){err("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}},rmdir:function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,true);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.rmdir(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}},readdir:function(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;if(!node.node_ops.readdir){throw new FS.ErrnoError(54)}return node.node_ops.readdir(node)},unlink:function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,false);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.unlink(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}},readlink:function(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(44)}if(!link.node_ops.readlink){throw new FS.ErrnoError(28)}return PATH_FS.resolve(FS.getPath(link.parent),link.node_ops.readlink(link))},stat:function(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;if(!node){throw new FS.ErrnoError(44)}if(!node.node_ops.getattr){throw new FS.ErrnoError(63)}return node.node_ops.getattr(node)},lstat:function(path){return FS.stat(path,true)},chmod:function(path,mode,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(63)}node.node_ops.setattr(node,{mode:mode&4095|node.mode&~4095,timestamp:Date.now()});},lchmod:function(path,mode){FS.chmod(path,mode,true);},fchmod:function(fd,mode){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}FS.chmod(stream.node,mode);},chown:function(path,uid,gid,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(63)}node.node_ops.setattr(node,{timestamp:Date.now()});},lchown:function(path,uid,gid){FS.chown(path,uid,gid,true);},fchown:function(fd,uid,gid){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}FS.chown(stream.node,uid,gid);},truncate:function(path,len){if(len<0){throw new FS.ErrnoError(28)}var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(63)}if(FS.isDir(node.mode)){throw new FS.ErrnoError(31)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(28)}var errCode=FS.nodePermissions(node,"w");if(errCode){throw new FS.ErrnoError(errCode)}node.node_ops.setattr(node,{size:len,timestamp:Date.now()});},ftruncate:function(fd,len){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(28)}FS.truncate(stream.node,len);},utime:function(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;node.node_ops.setattr(node,{timestamp:Math.max(atime,mtime)});},open:function(path,flags,mode,fd_start,fd_end){if(path===""){throw new FS.ErrnoError(44)}flags=typeof flags==="string"?FS.modeStringToFlags(flags):flags;mode=typeof mode==="undefined"?438:mode;if(flags&64){mode=mode&4095|32768;}else {mode=0;}var node;if(typeof path==="object"){node=path;}else {path=PATH.normalize(path);try{var lookup=FS.lookupPath(path,{follow:!(flags&131072)});node=lookup.node;}catch(e){}}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(20)}}else {node=FS.mknod(path,mode,0);created=true;}}if(!node){throw new FS.ErrnoError(44)}if(FS.isChrdev(node.mode)){flags&=~512;}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}if(!created){var errCode=FS.mayOpen(node,flags);if(errCode){throw new FS.ErrnoError(errCode)}}if(flags&512){FS.truncate(node,0);}flags&=~(128|512|131072);var stream=FS.createStream({node:node,path:FS.getPath(node),flags:flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false},fd_start,fd_end);if(stream.stream_ops.open){stream.stream_ops.open(stream);}if(Module["logReadFiles"]&&!(flags&1)){if(!FS.readFiles)FS.readFiles={};if(!(path in FS.readFiles)){FS.readFiles[path]=1;err("FS.trackingDelegate error on read file: "+path);}}try{if(FS.trackingDelegate["onOpenFile"]){var trackingFlags=0;if((flags&2097155)!==1){trackingFlags|=FS.tracking.openFlags.READ;}if((flags&2097155)!==0){trackingFlags|=FS.tracking.openFlags.WRITE;}FS.trackingDelegate["onOpenFile"](path,trackingFlags);}}catch(e){err("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: "+e.message);}return stream},close:function(stream){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream);}}catch(e){throw e}finally{FS.closeStream(stream.fd);}stream.fd=null;},isClosed:function(stream){return stream.fd===null},llseek:function(stream,offset,whence){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(70)}if(whence!=0&&whence!=1&&whence!=2){throw new FS.ErrnoError(28)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position},read:function(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.read){throw new FS.ErrnoError(28)}var seeking=typeof position!=="undefined";if(!seeking){position=stream.position;}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead},write:function(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.write){throw new FS.ErrnoError(28)}if(stream.seekable&&stream.flags&1024){FS.llseek(stream,0,2);}var seeking=typeof position!=="undefined";if(!seeking){position=stream.position;}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;try{if(stream.path&&FS.trackingDelegate["onWriteToFile"])FS.trackingDelegate["onWriteToFile"](stream.path);}catch(e){err("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: "+e.message);}return bytesWritten},allocate:function(stream,offset,length){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(offset<0||length<=0){throw new FS.ErrnoError(28)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(!FS.isFile(stream.node.mode)&&!FS.isDir(stream.node.mode)){throw new FS.ErrnoError(43)}if(!stream.stream_ops.allocate){throw new FS.ErrnoError(138)}stream.stream_ops.allocate(stream,offset,length);},mmap:function(stream,address,length,position,prot,flags){if((prot&2)!==0&&(flags&2)===0&&(stream.flags&2097155)!==2){throw new FS.ErrnoError(2)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(2)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(43)}return stream.stream_ops.mmap(stream,address,length,position,prot,flags)},msync:function(stream,buffer,offset,length,mmapFlags){if(!stream||!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)},munmap:function(stream){return 0},ioctl:function(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(59)}return stream.stream_ops.ioctl(stream,cmd,arg)},readFile:function(path,opts){opts=opts||{};opts.flags=opts.flags||0;opts.encoding=opts.encoding||"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){throw new Error('Invalid encoding type "'+opts.encoding+'"')}var ret;var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){ret=UTF8ArrayToString(buf,0);}else if(opts.encoding==="binary"){ret=buf;}FS.close(stream);return ret},writeFile:function(path,data,opts){opts=opts||{};opts.flags=opts.flags||577;var stream=FS.open(path,opts.flags,opts.mode);if(typeof data==="string"){var buf=new Uint8Array(lengthBytesUTF8(data)+1);var actualNumBytes=stringToUTF8Array(data,buf,0,buf.length);FS.write(stream,buf,0,actualNumBytes,undefined,opts.canOwn);}else if(ArrayBuffer.isView(data)){FS.write(stream,data,0,data.byteLength,undefined,opts.canOwn);}else {throw new Error("Unsupported data type")}FS.close(stream);},cwd:function(){return FS.currentPath},chdir:function(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(44)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(54)}var errCode=FS.nodePermissions(lookup.node,"x");if(errCode){throw new FS.ErrnoError(errCode)}FS.currentPath=lookup.path;},createDefaultDirectories:function(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user");},createDefaultDevices:function(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:function(){return 0},write:function(stream,buffer,offset,length,pos){return length}});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var random_device=getRandomDevice();FS.createDevice("/dev","random",random_device);FS.createDevice("/dev","urandom",random_device);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp");},createSpecialDirectories:function(){FS.mkdir("/proc");FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount:function(){var node=FS.createNode("/proc/self","fd",16384|511,73);node.node_ops={lookup:function(parent,name){var fd=+name;var stream=FS.getStream(fd);if(!stream)throw new FS.ErrnoError(8);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:function(){return stream.path}}};ret.parent=ret;return ret}};return node}},{},"/proc/self/fd");},createStandardStreams:function(){if(Module["stdin"]){FS.createDevice("/dev","stdin",Module["stdin"]);}else {FS.symlink("/dev/tty","/dev/stdin");}if(Module["stdout"]){FS.createDevice("/dev","stdout",null,Module["stdout"]);}else {FS.symlink("/dev/tty","/dev/stdout");}if(Module["stderr"]){FS.createDevice("/dev","stderr",null,Module["stderr"]);}else {FS.symlink("/dev/tty1","/dev/stderr");}var stdin=FS.open("/dev/stdin",0);var stdout=FS.open("/dev/stdout",1);var stderr=FS.open("/dev/stderr",1);},ensureErrnoError:function(){if(FS.ErrnoError)return;FS.ErrnoError=function ErrnoError(errno,node){this.node=node;this.setErrno=function(errno){this.errno=errno;};this.setErrno(errno);this.message="FS error";};FS.ErrnoError.prototype=new Error;FS.ErrnoError.prototype.constructor=FS.ErrnoError;[44].forEach(function(code){FS.genericErrors[code]=new FS.ErrnoError(code);FS.genericErrors[code].stack="<generic error, no stack>";});},staticInit:function(){FS.ensureErrnoError();FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={"MEMFS":MEMFS};},init:function(input,output,error){FS.init.initialized=true;FS.ensureErrnoError();Module["stdin"]=input||Module["stdin"];Module["stdout"]=output||Module["stdout"];Module["stderr"]=error||Module["stderr"];FS.createStandardStreams();},quit:function(){FS.init.initialized=false;var fflush=Module["_fflush"];if(fflush)fflush(0);for(var i=0;i<FS.streams.length;i++){var stream=FS.streams[i];if(!stream){continue}FS.close(stream);}},getMode:function(canRead,canWrite){var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode},findObject:function(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(ret.exists){return ret.object}else {return null}},analyzePath:function(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path;}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/";}catch(e){ret.error=e.errno;}return ret},createPath:function(parent,path,canRead,canWrite){parent=typeof parent==="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current);}catch(e){}parent=current;}return current},createFile:function(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(canRead,canWrite);return FS.create(path,mode)},createDataFile:function(parent,name,data,canRead,canWrite,canOwn){var path=name?PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name):parent;var mode=FS.getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){if(typeof data==="string"){var arr=new Array(data.length);for(var i=0,len=data.length;i<len;++i)arr[i]=data.charCodeAt(i);data=arr;}FS.chmod(node,mode|146);var stream=FS.open(node,577);FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode);}return node},createDevice:function(parent,name,input,output){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(!!input,!!output);if(!FS.createDevice.major)FS.createDevice.major=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open:function(stream){stream.seekable=false;},close:function(stream){if(output&&output.buffer&&output.buffer.length){output(10);}},read:function(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input();}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead},write:function(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i]);}catch(e){throw new FS.ErrnoError(29)}}if(length){stream.node.timestamp=Date.now();}return i}});return FS.mkdev(path,mode,dev)},forceLoadFile:function(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;if(typeof XMLHttpRequest!=="undefined"){throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else if(read_){try{obj.contents=intArrayFromString(read_(obj.url),true);obj.usedBytes=obj.contents.length;}catch(e){throw new FS.ErrnoError(29)}}else {throw new Error("Cannot load without read() or XMLHttpRequest.")}},createLazyFile:function(parent,name,url,canRead,canWrite){function LazyUint8Array(){this.lengthKnown=false;this.chunks=[];}LazyUint8Array.prototype.get=function LazyUint8Array_get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]};LazyUint8Array.prototype.setDataGetter=function LazyUint8Array_setDataGetter(getter){this.getter=getter;};LazyUint8Array.prototype.cacheLength=function LazyUint8Array_cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=function(from,to){if(from>to)throw new Error("invalid range ("+from+", "+to+") or no bytes requested!");if(to>datalength-1)throw new Error("only "+datalength+" bytes available! programmer error!");var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);if(typeof Uint8Array!="undefined")xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined");}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}else {return intArrayFromString(xhr.responseText||"",true)}};var lazyArray=this;lazyArray.setDataGetter(function(chunkNum){var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]==="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end);}if(typeof lazyArray.chunks[chunkNum]==="undefined")throw new Error("doXHR failed!");return lazyArray.chunks[chunkNum]});if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;out("LazyFiles on gzip forces download of the whole file when length is accessed");}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true;};if(typeof XMLHttpRequest!=="undefined"){throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var lazyArray=new LazyUint8Array;var properties={isDevice:false,contents:lazyArray};}else {var properties={isDevice:false,url:url};}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents;}else if(properties.url){node.contents=null;node.url=properties.url;}Object.defineProperties(node,{usedBytes:{get:function(){return this.contents.length}}});var stream_ops={};var keys=Object.keys(node.stream_ops);keys.forEach(function(key){var fn=node.stream_ops[key];stream_ops[key]=function forceLoadLazyFile(){FS.forceLoadFile(node);return fn.apply(null,arguments)};});stream_ops.read=function stream_ops_read(stream,buffer,offset,length,position){FS.forceLoadFile(node);var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i];}}else {for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i);}}return size};node.stream_ops=stream_ops;return node},createPreloadedFile:function(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish){Browser.init();var fullname=name?PATH_FS.resolve(PATH.join2(parent,name)):parent;function processData(byteArray){function finish(byteArray){if(preFinish)preFinish();if(!dontCreateFile){FS.createDataFile(parent,name,byteArray,canRead,canWrite,canOwn);}if(onload)onload();removeRunDependency();}var handled=false;Module["preloadPlugins"].forEach(function(plugin){if(handled)return;if(plugin["canHandle"](fullname)){plugin["handle"](byteArray,fullname,finish,function(){if(onerror)onerror();removeRunDependency();});handled=true;}});if(!handled)finish(byteArray);}addRunDependency();if(typeof url=="string"){Browser.asyncLoad(url,function(byteArray){processData(byteArray);},onerror);}else {processData(url);}},indexedDB:function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB},DB_NAME:function(){return "EM_FS_"+window.location.pathname},DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths,onload,onerror){onload=onload||function(){};onerror=onerror||function(){};var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=function openRequest_onupgradeneeded(){out("creating db");var db=openRequest.result;db.createObjectStore(FS.DB_STORE_NAME);};openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;var transaction=db.transaction([FS.DB_STORE_NAME],"readwrite");var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach(function(path){var putRequest=files.put(FS.analyzePath(path).object.contents,path);putRequest.onsuccess=function putRequest_onsuccess(){ok++;if(ok+fail==total)finish();};putRequest.onerror=function putRequest_onerror(){fail++;if(ok+fail==total)finish();};});transaction.onerror=onerror;};openRequest.onerror=onerror;},loadFilesFromDB:function(paths,onload,onerror){onload=onload||function(){};onerror=onerror||function(){};var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=onerror;openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;try{var transaction=db.transaction([FS.DB_STORE_NAME],"readonly");}catch(e){onerror(e);return}var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach(function(path){var getRequest=files.get(path);getRequest.onsuccess=function getRequest_onsuccess(){if(FS.analyzePath(path).exists){FS.unlink(path);}FS.createDataFile(PATH.dirname(path),PATH.basename(path),getRequest.result,true,true,true);ok++;if(ok+fail==total)finish();};getRequest.onerror=function getRequest_onerror(){fail++;if(ok+fail==total)finish();};});transaction.onerror=onerror;};openRequest.onerror=onerror;}};var SYSCALLS={mappings:{},DEFAULT_POLLMASK:5,umask:511,calculateAt:function(dirfd,path){if(path[0]!=="/"){var dir;if(dirfd===-100){dir=FS.cwd();}else {var dirstream=FS.getStream(dirfd);if(!dirstream)throw new FS.ErrnoError(8);dir=dirstream.path;}path=PATH.join2(dir,path);}return path},doStat:function(func,path,buf){try{var stat=func(path);}catch(e){if(e&&e.node&&PATH.normalize(path)!==PATH.normalize(FS.getPath(e.node))){return -54}throw e}HEAP32[buf>>2]=stat.dev;HEAP32[buf+4>>2]=0;HEAP32[buf+8>>2]=stat.ino;HEAP32[buf+12>>2]=stat.mode;HEAP32[buf+16>>2]=stat.nlink;HEAP32[buf+20>>2]=stat.uid;HEAP32[buf+24>>2]=stat.gid;HEAP32[buf+28>>2]=stat.rdev;HEAP32[buf+32>>2]=0;tempI64=[stat.size>>>0,(tempDouble=stat.size,+Math.abs(tempDouble)>=1?tempDouble>0?(Math.min(+Math.floor(tempDouble/4294967296),4294967295)|0)>>>0:~~+Math.ceil((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)],HEAP32[buf+40>>2]=tempI64[0],HEAP32[buf+44>>2]=tempI64[1];HEAP32[buf+48>>2]=4096;HEAP32[buf+52>>2]=stat.blocks;HEAP32[buf+56>>2]=stat.atime.getTime()/1e3|0;HEAP32[buf+60>>2]=0;HEAP32[buf+64>>2]=stat.mtime.getTime()/1e3|0;HEAP32[buf+68>>2]=0;HEAP32[buf+72>>2]=stat.ctime.getTime()/1e3|0;HEAP32[buf+76>>2]=0;tempI64=[stat.ino>>>0,(tempDouble=stat.ino,+Math.abs(tempDouble)>=1?tempDouble>0?(Math.min(+Math.floor(tempDouble/4294967296),4294967295)|0)>>>0:~~+Math.ceil((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)],HEAP32[buf+80>>2]=tempI64[0],HEAP32[buf+84>>2]=tempI64[1];return 0},doMsync:function(addr,stream,len,flags,offset){var buffer=HEAPU8.slice(addr,addr+len);FS.msync(stream,buffer,offset,len,flags);},doMkdir:function(path,mode){path=PATH.normalize(path);if(path[path.length-1]==="/")path=path.substr(0,path.length-1);FS.mkdir(path,mode,0);return 0},doMknod:function(path,mode,dev){switch(mode&61440){case 32768:case 8192:case 24576:case 4096:case 49152:break;default:return -28}FS.mknod(path,mode,dev);return 0},doReadlink:function(path,buf,bufsize){if(bufsize<=0)return -28;var ret=FS.readlink(path);var len=Math.min(bufsize,lengthBytesUTF8(ret));var endChar=HEAP8[buf+len];stringToUTF8(ret,buf,bufsize+1);HEAP8[buf+len]=endChar;return len},doAccess:function(path,amode){if(amode&~7){return -28}var node;var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;if(!node){return -44}var perms="";if(amode&4)perms+="r";if(amode&2)perms+="w";if(amode&1)perms+="x";if(perms&&FS.nodePermissions(node,perms)){return -2}return 0},doDup:function(path,flags,suggestFD){var suggest=FS.getStream(suggestFD);if(suggest)FS.close(suggest);return FS.open(path,flags,0,suggestFD,suggestFD).fd},doReadv:function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.read(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;if(curr<len)break}return ret},doWritev:function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.write(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;}return ret},varargs:undefined,get:function(){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret},getStr:function(ptr){var ret=UTF8ToString(ptr);return ret},getStreamFromFD:function(fd){var stream=FS.getStream(fd);if(!stream)throw new FS.ErrnoError(8);return stream},get64:function(low,high){return low}};function ___sys_getpid(){return 42}function _abort(){abort();}function _emscripten_asm_const_int(code,sigPtr,argbuf){var args=readAsmConstArgs(sigPtr,argbuf);return ASM_CONSTS[code].apply(null,args)}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest,src,src+num);}function _emscripten_get_heap_size(){return HEAPU8.length}function emscripten_realloc_buffer(size){try{wasmMemory.grow(size-buffer.byteLength+65535>>>16);updateGlobalBufferAndViews(wasmMemory.buffer);return 1}catch(e){}}function _emscripten_resize_heap(requestedSize){requestedSize=requestedSize>>>0;var oldSize=_emscripten_get_heap_size();var maxHeapSize=2147483648;if(requestedSize>maxHeapSize){return false}var minHeapSize=16777216;for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(minHeapSize,requestedSize,overGrownHeapSize),65536));var replacement=emscripten_realloc_buffer(newSize);if(replacement){return true}}return false}var ENV={};function getExecutableName(){return thisProgram||"./this.program"}function getEnvStrings(){if(!getEnvStrings.strings){var lang=(typeof navigator==="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){env[x]=ENV[x];}var strings=[];for(var x in env){strings.push(x+"="+env[x]);}getEnvStrings.strings=strings;}return getEnvStrings.strings}function _environ_get(__environ,environ_buf){try{var bufSize=0;getEnvStrings().forEach(function(string,i){var ptr=environ_buf+bufSize;HEAP32[__environ+i*4>>2]=ptr;writeAsciiToMemory(string,ptr);bufSize+=string.length+1;});return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _environ_sizes_get(penviron_count,penviron_buf_size){try{var strings=getEnvStrings();HEAP32[penviron_count>>2]=strings.length;var bufSize=0;strings.forEach(function(string){bufSize+=string.length+1;});HEAP32[penviron_buf_size>>2]=bufSize;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_close(fd){try{var stream=SYSCALLS.getStreamFromFD(fd);FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_seek(fd,offset_low,offset_high,whence,newOffset){try{var stream=SYSCALLS.getStreamFromFD(fd);var HIGH_OFFSET=4294967296;var offset=offset_high*HIGH_OFFSET+(offset_low>>>0);var DOUBLE_LIMIT=9007199254740992;if(offset<=-DOUBLE_LIMIT||offset>=DOUBLE_LIMIT){return -61}FS.llseek(stream,offset,whence);tempI64=[stream.position>>>0,(tempDouble=stream.position,+Math.abs(tempDouble)>=1?tempDouble>0?(Math.min(+Math.floor(tempDouble/4294967296),4294967295)|0)>>>0:~~+Math.ceil((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)],HEAP32[newOffset>>2]=tempI64[0],HEAP32[newOffset+4>>2]=tempI64[1];if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_write(fd,iov,iovcnt,pnum){try{var stream=SYSCALLS.getStreamFromFD(fd);var num=SYSCALLS.doWritev(stream,iov,iovcnt);HEAP32[pnum>>2]=num;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _gettimeofday(ptr){var now=Date.now();HEAP32[ptr>>2]=now/1e3|0;HEAP32[ptr+4>>2]=now%1e3*1e3|0;return 0}var readAsmConstArgsArray=[];function readAsmConstArgs(sigPtr,buf){readAsmConstArgsArray.length=0;var ch;buf>>=2;while(ch=HEAPU8[sigPtr++]){var double=ch<105;if(double&&buf&1)buf++;readAsmConstArgsArray.push(double?HEAPF64[buf++>>1]:HEAP32[buf]);++buf;}return readAsmConstArgsArray}var FSNode=function(parent,name,mode,rdev){if(!parent){parent=this;}this.parent=parent;this.mount=parent.mount;this.mounted=null;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.node_ops={};this.stream_ops={};this.rdev=rdev;};var readMode=292|73;var writeMode=146;Object.defineProperties(FSNode.prototype,{read:{get:function(){return (this.mode&readMode)===readMode},set:function(val){val?this.mode|=readMode:this.mode&=~readMode;}},write:{get:function(){return (this.mode&writeMode)===writeMode},set:function(val){val?this.mode|=writeMode:this.mode&=~writeMode;}},isFolder:{get:function(){return FS.isDir(this.mode)}},isDevice:{get:function(){return FS.isChrdev(this.mode)}}});FS.FSNode=FSNode;FS.staticInit();function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}__ATINIT__.push({func:function(){___wasm_call_ctors();}});var asmLibraryArg={"i":___sys_getpid,"b":_abort,"a":_emscripten_asm_const_int,"d":_emscripten_memcpy_big,"e":_emscripten_resize_heap,"f":_environ_get,"g":_environ_sizes_get,"h":_fd_close,"j":_fd_seek,"c":_fd_write,"k":_gettimeofday};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return (___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["n"]).apply(null,arguments)};var ___em_js__array_bounds_check_error=Module["___em_js__array_bounds_check_error"]=function(){return (___em_js__array_bounds_check_error=Module["___em_js__array_bounds_check_error"]=Module["asm"]["o"]).apply(null,arguments)};var _emscripten_bind_CExpat_CExpat_0=Module["_emscripten_bind_CExpat_CExpat_0"]=function(){return (_emscripten_bind_CExpat_CExpat_0=Module["_emscripten_bind_CExpat_CExpat_0"]=Module["asm"]["p"]).apply(null,arguments)};var _emscripten_bind_CExpat_create_0=Module["_emscripten_bind_CExpat_create_0"]=function(){return (_emscripten_bind_CExpat_create_0=Module["_emscripten_bind_CExpat_create_0"]=Module["asm"]["q"]).apply(null,arguments)};var _emscripten_bind_CExpat_destroy_0=Module["_emscripten_bind_CExpat_destroy_0"]=function(){return (_emscripten_bind_CExpat_destroy_0=Module["_emscripten_bind_CExpat_destroy_0"]=Module["asm"]["r"]).apply(null,arguments)};var _emscripten_bind_CExpat_parse_1=Module["_emscripten_bind_CExpat_parse_1"]=function(){return (_emscripten_bind_CExpat_parse_1=Module["_emscripten_bind_CExpat_parse_1"]=Module["asm"]["s"]).apply(null,arguments)};var _emscripten_bind_CExpat_tag_0=Module["_emscripten_bind_CExpat_tag_0"]=function(){return (_emscripten_bind_CExpat_tag_0=Module["_emscripten_bind_CExpat_tag_0"]=Module["asm"]["t"]).apply(null,arguments)};var _emscripten_bind_CExpat_attrs_0=Module["_emscripten_bind_CExpat_attrs_0"]=function(){return (_emscripten_bind_CExpat_attrs_0=Module["_emscripten_bind_CExpat_attrs_0"]=Module["asm"]["u"]).apply(null,arguments)};var _emscripten_bind_CExpat_content_0=Module["_emscripten_bind_CExpat_content_0"]=function(){return (_emscripten_bind_CExpat_content_0=Module["_emscripten_bind_CExpat_content_0"]=Module["asm"]["v"]).apply(null,arguments)};var _emscripten_bind_CExpat_startElement_0=Module["_emscripten_bind_CExpat_startElement_0"]=function(){return (_emscripten_bind_CExpat_startElement_0=Module["_emscripten_bind_CExpat_startElement_0"]=Module["asm"]["w"]).apply(null,arguments)};var _emscripten_bind_CExpat_endElement_0=Module["_emscripten_bind_CExpat_endElement_0"]=function(){return (_emscripten_bind_CExpat_endElement_0=Module["_emscripten_bind_CExpat_endElement_0"]=Module["asm"]["x"]).apply(null,arguments)};var _emscripten_bind_CExpat_characterData_0=Module["_emscripten_bind_CExpat_characterData_0"]=function(){return (_emscripten_bind_CExpat_characterData_0=Module["_emscripten_bind_CExpat_characterData_0"]=Module["asm"]["y"]).apply(null,arguments)};var _emscripten_bind_CExpat___destroy___0=Module["_emscripten_bind_CExpat___destroy___0"]=function(){return (_emscripten_bind_CExpat___destroy___0=Module["_emscripten_bind_CExpat___destroy___0"]=Module["asm"]["z"]).apply(null,arguments)};var _emscripten_bind_VoidPtr___destroy___0=Module["_emscripten_bind_VoidPtr___destroy___0"]=function(){return (_emscripten_bind_VoidPtr___destroy___0=Module["_emscripten_bind_VoidPtr___destroy___0"]=Module["asm"]["A"]).apply(null,arguments)};var _emscripten_bind_CExpatJS_CExpatJS_0=Module["_emscripten_bind_CExpatJS_CExpatJS_0"]=function(){return (_emscripten_bind_CExpatJS_CExpatJS_0=Module["_emscripten_bind_CExpatJS_CExpatJS_0"]=Module["asm"]["B"]).apply(null,arguments)};var _emscripten_bind_CExpatJS_startElement_0=Module["_emscripten_bind_CExpatJS_startElement_0"]=function(){return (_emscripten_bind_CExpatJS_startElement_0=Module["_emscripten_bind_CExpatJS_startElement_0"]=Module["asm"]["C"]).apply(null,arguments)};var _emscripten_bind_CExpatJS_endElement_0=Module["_emscripten_bind_CExpatJS_endElement_0"]=function(){return (_emscripten_bind_CExpatJS_endElement_0=Module["_emscripten_bind_CExpatJS_endElement_0"]=Module["asm"]["D"]).apply(null,arguments)};var _emscripten_bind_CExpatJS_characterData_0=Module["_emscripten_bind_CExpatJS_characterData_0"]=function(){return (_emscripten_bind_CExpatJS_characterData_0=Module["_emscripten_bind_CExpatJS_characterData_0"]=Module["asm"]["E"]).apply(null,arguments)};var _emscripten_bind_CExpatJS___destroy___0=Module["_emscripten_bind_CExpatJS___destroy___0"]=function(){return (_emscripten_bind_CExpatJS___destroy___0=Module["_emscripten_bind_CExpatJS___destroy___0"]=Module["asm"]["F"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return (_malloc=Module["_malloc"]=Module["asm"]["G"]).apply(null,arguments)};var _free=Module["_free"]=function(){return (_free=Module["_free"]=Module["asm"]["H"]).apply(null,arguments)};var calledRun;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller;};function run(args){if(runDependencies>0){return}preRun();if(runDependencies>0)return;function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();readyPromiseResolve(Module);if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("");},1);doRun();},1);}else {doRun();}}Module["run"]=run;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}run();function WrapperObject(){}WrapperObject.prototype=Object.create(WrapperObject.prototype);WrapperObject.prototype.constructor=WrapperObject;WrapperObject.prototype.__class__=WrapperObject;WrapperObject.__cache__={};Module["WrapperObject"]=WrapperObject;function getCache(__class__){return (__class__||WrapperObject).__cache__}Module["getCache"]=getCache;function wrapPointer(ptr,__class__){var cache=getCache(__class__);var ret=cache[ptr];if(ret)return ret;ret=Object.create((__class__||WrapperObject).prototype);ret.ptr=ptr;return cache[ptr]=ret}Module["wrapPointer"]=wrapPointer;function castObject(obj,__class__){return wrapPointer(obj.ptr,__class__)}Module["castObject"]=castObject;Module["NULL"]=wrapPointer(0);function destroy(obj){if(!obj["__destroy__"])throw "Error: Cannot destroy object. (Did you create it yourself?)";obj["__destroy__"]();delete getCache(obj.__class__)[obj.ptr];}Module["destroy"]=destroy;function compare(obj1,obj2){return obj1.ptr===obj2.ptr}Module["compare"]=compare;function getPointer(obj){return obj.ptr}Module["getPointer"]=getPointer;function getClass(obj){return obj.__class__}Module["getClass"]=getClass;var ensureCache={buffer:0,size:0,pos:0,temps:[],needed:0,prepare:function(){if(ensureCache.needed){for(var i=0;i<ensureCache.temps.length;i++){Module["_free"](ensureCache.temps[i]);}ensureCache.temps.length=0;Module["_free"](ensureCache.buffer);ensureCache.buffer=0;ensureCache.size+=ensureCache.needed;ensureCache.needed=0;}if(!ensureCache.buffer){ensureCache.size+=128;ensureCache.buffer=Module["_malloc"](ensureCache.size);assert(ensureCache.buffer);}ensureCache.pos=0;},alloc:function(array,view){assert(ensureCache.buffer);var bytes=view.BYTES_PER_ELEMENT;var len=array.length*bytes;len=len+7&-8;var ret;if(ensureCache.pos+len>=ensureCache.size){assert(len>0);ensureCache.needed+=len;ret=Module["_malloc"](len);ensureCache.temps.push(ret);}else {ret=ensureCache.buffer+ensureCache.pos;ensureCache.pos+=len;}return ret},copy:function(array,view,offset){offset>>>=0;var bytes=view.BYTES_PER_ELEMENT;switch(bytes){case 2:offset>>>=1;break;case 4:offset>>>=2;break;case 8:offset>>>=3;break}for(var i=0;i<array.length;i++){view[offset+i]=array[i];}}};function ensureString(value){if(typeof value==="string"){var intArray=intArrayFromString(value);var offset=ensureCache.alloc(intArray,HEAP8);ensureCache.copy(intArray,HEAP8,offset);return offset}return value}function CExpat(){this.ptr=_emscripten_bind_CExpat_CExpat_0();getCache(CExpat)[this.ptr]=this;}CExpat.prototype=Object.create(WrapperObject.prototype);CExpat.prototype.constructor=CExpat;CExpat.prototype.__class__=CExpat;CExpat.__cache__={};Module["CExpat"]=CExpat;CExpat.prototype["create"]=CExpat.prototype.create=function(){var self=this.ptr;return !!_emscripten_bind_CExpat_create_0(self)};CExpat.prototype["destroy"]=CExpat.prototype.destroy=function(){var self=this.ptr;_emscripten_bind_CExpat_destroy_0(self);};CExpat.prototype["parse"]=CExpat.prototype.parse=function(xml){var self=this.ptr;ensureCache.prepare();if(xml&&typeof xml==="object")xml=xml.ptr;else xml=ensureString(xml);return !!_emscripten_bind_CExpat_parse_1(self,xml)};CExpat.prototype["tag"]=CExpat.prototype.tag=function(){var self=this.ptr;return UTF8ToString(_emscripten_bind_CExpat_tag_0(self))};CExpat.prototype["attrs"]=CExpat.prototype.attrs=function(){var self=this.ptr;return UTF8ToString(_emscripten_bind_CExpat_attrs_0(self))};CExpat.prototype["content"]=CExpat.prototype.content=function(){var self=this.ptr;return UTF8ToString(_emscripten_bind_CExpat_content_0(self))};CExpat.prototype["startElement"]=CExpat.prototype.startElement=function(){var self=this.ptr;_emscripten_bind_CExpat_startElement_0(self);};CExpat.prototype["endElement"]=CExpat.prototype.endElement=function(){var self=this.ptr;_emscripten_bind_CExpat_endElement_0(self);};CExpat.prototype["characterData"]=CExpat.prototype.characterData=function(){var self=this.ptr;_emscripten_bind_CExpat_characterData_0(self);};CExpat.prototype["__destroy__"]=CExpat.prototype.__destroy__=function(){var self=this.ptr;_emscripten_bind_CExpat___destroy___0(self);};function VoidPtr(){throw "cannot construct a VoidPtr, no constructor in IDL"}VoidPtr.prototype=Object.create(WrapperObject.prototype);VoidPtr.prototype.constructor=VoidPtr;VoidPtr.prototype.__class__=VoidPtr;VoidPtr.__cache__={};Module["VoidPtr"]=VoidPtr;VoidPtr.prototype["__destroy__"]=VoidPtr.prototype.__destroy__=function(){var self=this.ptr;_emscripten_bind_VoidPtr___destroy___0(self);};function CExpatJS(){this.ptr=_emscripten_bind_CExpatJS_CExpatJS_0();getCache(CExpatJS)[this.ptr]=this;}CExpatJS.prototype=Object.create(CExpat.prototype);CExpatJS.prototype.constructor=CExpatJS;CExpatJS.prototype.__class__=CExpatJS;CExpatJS.__cache__={};Module["CExpatJS"]=CExpatJS;CExpatJS.prototype["startElement"]=CExpatJS.prototype.startElement=function(){var self=this.ptr;_emscripten_bind_CExpatJS_startElement_0(self);};CExpatJS.prototype["endElement"]=CExpatJS.prototype.endElement=function(){var self=this.ptr;_emscripten_bind_CExpatJS_endElement_0(self);};CExpatJS.prototype["characterData"]=CExpatJS.prototype.characterData=function(){var self=this.ptr;_emscripten_bind_CExpatJS_characterData_0(self);};CExpatJS.prototype["__destroy__"]=CExpatJS.prototype.__destroy__=function(){var self=this.ptr;_emscripten_bind_CExpatJS___destroy___0(self);};


	  return cpp.ready
	}
	);
	})();
	module.exports = cpp;
	});

	var expatlib$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), expatlib, {
		'default': expatlib
	}));

	function getGlobal() {
	    if (typeof self !== "undefined") {
	        return self;
	    }
	    if (typeof window !== "undefined") {
	        return window;
	    }
	    if (typeof global !== "undefined") {
	        return global;
	    }
	    throw new Error("unable to locate global object");
	}
	var globalNS = getGlobal();
	var _wasmFolder = globalNS.__hpcc_wasmFolder || undefined;
	function wasmFolder(_) {
	    if (!arguments.length)
	        return _wasmFolder;
	    var retVal = _wasmFolder;
	    _wasmFolder = _;
	    return retVal;
	}
	function trimEnd(str, charToRemove) {
	    while (str.charAt(str.length - 1) === charToRemove) {
	        str = str.substring(0, str.length - 1);
	    }
	    return str;
	}
	function trimStart(str, charToRemove) {
	    while (str.charAt(0) === charToRemove) {
	        str = str.substring(1);
	    }
	    return str;
	}
	function loadWasm(_wasmLib, wf, wasmBinary) {
	    var wasmLib = _wasmLib.default || _wasmLib;
	    //  Prevent double load ---
	    if (!wasmLib.__hpcc_promise) {
	        wasmLib.__hpcc_promise = new Promise(function (resolve) {
	            wasmLib({
	                wasmBinary: wasmBinary,
	                locateFile: function (path, prefix) {
	                    return trimEnd(wf || wasmFolder() || prefix || ".", "/") + "/" + trimStart(path, "/");
	                }
	            }).then(function (instance) {
	                //  Not a real promise, remove "then" to prevent infinite loop  ---
	                delete instance.then;
	                resolve(instance);
	            });
	        });
	    }
	    return wasmLib.__hpcc_promise;
	}

	// @ts-ignore
	var StackElement = /** @class */ (function () {
	    function StackElement(tag, attrs) {
	        this.tag = tag;
	        this.attrs = attrs;
	        this._content = "";
	    }
	    Object.defineProperty(StackElement.prototype, "content", {
	        get: function () {
	            return this._content;
	        },
	        enumerable: false,
	        configurable: true
	    });
	    StackElement.prototype.appendContent = function (content) {
	        this._content += content;
	    };
	    return StackElement;
	}());
	var StackParser = /** @class */ (function () {
	    function StackParser() {
	        this._stack = [];
	    }
	    StackParser.prototype.parse = function (xml) {
	        return parse(xml, this);
	    };
	    StackParser.prototype.top = function () {
	        return this._stack[this._stack.length - 1];
	    };
	    StackParser.prototype.startElement = function (tag, attrs) {
	        var retVal = new StackElement(tag, attrs);
	        this._stack.push(retVal);
	        return retVal;
	    };
	    StackParser.prototype.endElement = function (tag) {
	        return this._stack.pop();
	    };
	    StackParser.prototype.characterData = function (content) {
	        this.top().appendContent(content);
	    };
	    return StackParser;
	}());
	function parseAttrs(attrs) {
	    var retVal = {};
	    var keys = attrs;
	    var sep = "" + String.fromCharCode(1);
	    var sep2 = "" + sep + sep;
	    keys.split(sep2).filter(function (key) { return !!key; }).forEach(function (key) {
	        var parts = key.split(sep);
	        retVal[parts[0]] = parts[1];
	    });
	    return retVal;
	}
	function parse(xml, callback, wasmFolder, wasmBinary) {
	    return loadWasm(expatlib$1, wasmFolder, wasmBinary).then(function (module) {
	        var parser = new module.CExpatJS();
	        parser.startElement = function () {
	            callback.startElement(this.tag(), parseAttrs(this.attrs()));
	        };
	        parser.endElement = function () {
	            callback.endElement(this.tag());
	        };
	        parser.characterData = function () {
	            callback.characterData(this.content());
	        };
	        parser.create();
	        var retVal = parser.parse(xml);
	        parser.destroy();
	        module.destroy(parser);
	        return retVal;
	    });
	}

	var __extends = (undefined && undefined.__extends) || (function () {
	    var extendStatics = function (d, b) {
	        extendStatics = Object.setPrototypeOf ||
	            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	        return extendStatics(d, b);
	    };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var KeywordParser = /** @class */ (function (_super) {
	    __extends(KeywordParser, _super);
	    function KeywordParser() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this._json = {};
	        return _this;
	    }
	    KeywordParser.prototype.startElement = function (tag, attrs) {
	        var retVal = _super.prototype.startElement.call(this, tag, attrs);
	        switch (tag) {
	            case "cat":
	                this.currCat = "keyword_" + attrs["group"];
	                this._json[this.currCat] = [];
	                break;
	            case "keyword":
	                this._json[this.currCat].push(attrs["name"]);
	                break;
	        }
	        return retVal;
	    };
	    return KeywordParser;
	}(StackParser));
	describe("expat", function () {
	    it("simple", function () {
	        var xml = "<root><child xxx=\"yyy\">content</child></root>";
	        var callback = {
	            startElement: function (tag, attrs) { console.log("start", tag, attrs); },
	            endElement: function (tag) { console.log("end", tag); },
	            characterData: function (content) { console.log("characterData", content); }
	        };
	        return parse(xml, callback).then(function (response) {
	            chai$1.expect(response).to.be.true;
	        });
	    });
	    it("parse", function () {
	        var callback = new KeywordParser();
	        return parse(encodedXml(), callback).then(function (response) {
	            chai$1.expect(response).to.be.true;
	        });
	    });
	});
	function encodedXml() {
	    return xml()
	        .split("&").join("&amp;")
	        .split("\"<").join("\"&lt;")
	        .split("<\"").join("&lt;\"")
	        // .split("\">").join("\"&gt;")
	        .split(">\"").join("&gt;\"")
	        .split("<<").join("&lt;&lt;")
	        .split(">>").join("&gt;&gt;");
	}
	function xml() {
	    return "\n<xml>\n    <cat group=\"1\">\n        <keyword name=\"beginc++\" />\n        <keyword name=\"elif\" />\n        <keyword name=\"else\" />\n        <keyword name=\"elseif\" />\n        <keyword name=\"elsif\" />\n        <keyword name=\"embed\" />\n        <keyword name=\"endembed\" />\n        <keyword name=\"end\" />\n        <keyword name=\"endc++\" />\n        <keyword name=\"endmacro\" />\n        <keyword name=\"function\" />\n        <keyword name=\"functionmacro\" />\n        <keyword name=\"if\" />\n        <keyword name=\"ifblock\" />\n        <keyword name=\"iff\" />\n        <keyword name=\"interface\" />\n        <keyword name=\"macro\" />\n        <keyword name=\"module\" />\n        <keyword name=\"record\" />\n        <keyword name=\"service\" />\n        <keyword name=\"then\" />\n        <keyword name=\"transform\" />\n        <keyword name=\"type\" />\n    </cat>\n    <cat group=\"2\">\n        <keyword name=\"__debug__\" />\n        <keyword name=\"__ecl_legacy_mode__\" />\n        <keyword name=\"__ecl_version__\" />\n        <keyword name=\"__ecl_version_major__\" />\n        <keyword name=\"__ecl_version_minor__\" />\n        <keyword name=\"__ecl_version_subminor__\" />\n        <keyword name=\"__line__\" />\n        <keyword name=\"__os__\" />\n        <keyword name=\"__platform__\" />\n        <keyword name=\"__set_debug_option__\" />\n        <keyword name=\"__stand_alone__\" />\n        <keyword name=\"__target_platform__\" />\n        <keyword name=\"clustersize\" />\n        <keyword name=\"getenv\" />\n    </cat>\n    <cat group=\"3\">\n        <keyword name=\"#append\" />\n        <keyword name=\"#apply\" />\n        <keyword name=\"#break\" />\n        <keyword name=\"#constant\" />\n        <keyword name=\"#debug\" />\n        <keyword name=\"#declare\" />\n        <keyword name=\"#demangle\" />\n        <keyword name=\"#else\" />\n        <keyword name=\"#elseif\" />\n        <keyword name=\"#end\" />\n        <keyword name=\"#endregion\" />\n        <keyword name=\"#error\" />\n        <keyword name=\"#expand\" />\n        <keyword name=\"#export\" />\n        <keyword name=\"#exportxml\" />\n        <keyword name=\"#for\" />\n        <keyword name=\"#forall\" />\n        <keyword name=\"#getdatatype\" />\n        <keyword name=\"#if\" />\n        <keyword name=\"#ifdefined\" />\n        <keyword name=\"#inmodule\" />\n        <keyword name=\"#isdefined\" />\n        <keyword name=\"#isvalid\" />\n        <keyword name=\"#line\" />\n        <keyword name=\"#link\" />\n        <keyword name=\"#loop\" />\n        <keyword name=\"#mangle\" />\n        <keyword name=\"#onwarning\" />\n        <keyword name=\"#option\" />\n        <keyword name=\"#region\" />\n        <keyword name=\"#set\" />\n        <keyword name=\"#stored\" />\n        <keyword name=\"#text\" />\n        <keyword name=\"#trace\" />\n        <keyword name=\"#uniquename\" />\n        <keyword name=\"#warning\" />\n        <keyword name=\"#webservice\" />\n        <keyword name=\"#workunit\" />\n        <keyword name=\"#$\" />\n        <keyword name=\"loadxml\" />\n    </cat>\n    <cat group=\"4\">\n        <keyword name=\"asstring\" />\n        <keyword name=\"encoding\" />\n        <keyword name=\"fromunicode\" />\n        <keyword name=\"intformat\" />\n        <keyword name=\"keyunicode\" />\n        <keyword name=\"length\" />\n        <keyword name=\"realformat\" />\n        <keyword name=\"regexfind\" />\n        <keyword name=\"regexfindset\" />\n        <keyword name=\"regexreplace\" />\n        <keyword name=\"tojson\" />\n        <keyword name=\"tounicode\" />\n        <keyword name=\"toxml\" />\n        <keyword name=\"trim\" />\n        <keyword name=\"unicodeorder\" />\n    </cat>\n    <cat group=\"5\">\n        <keyword name=\"abs\" />\n        <keyword name=\"acos\" />\n        <keyword name=\"asin\" />\n        <keyword name=\"atan\" />\n        <keyword name=\"atan2\" />\n        <keyword name=\"ave\" />\n        <keyword name=\"cos\" />\n        <keyword name=\"cosh\" />\n        <keyword name=\"count\" />\n        <keyword name=\"correlation\" />\n        <keyword name=\"covariance\" />\n        <keyword name=\"div\" />\n        <keyword name=\"exists\" />\n        <keyword name=\"exp\" />\n        <keyword name=\"log\" />\n        <keyword name=\"ln\" />\n        <keyword name=\"max\" />\n        <keyword name=\"min\" />\n        <keyword name=\"power\" />\n        <keyword name=\"random\" />\n        <keyword name=\"round\" />\n        <keyword name=\"roundup\" />\n        <keyword name=\"sin\" />\n        <keyword name=\"sinh\" />\n        <keyword name=\"sqrt\" />\n        <keyword name=\"sum\" />\n        <keyword name=\"tan\" />\n        <keyword name=\"tanh\" />\n        <keyword name=\"truncate\" />\n        <keyword name=\"variance\" />\n    </cat>\n    <cat group=\"6\">\n        <keyword name=\"&\" />\n        <keyword name=\"|\" />\n        <keyword name=\"bnot\" />\n        <keyword name=\"<<\" />\n        <keyword name=\">>\" />\n        <keyword name=\"(>\" />\n        <keyword name=\"<)\" />\n    </cat>\n    <cat group=\"7\">\n        <keyword name=\"=\" />\n        <keyword name=\"<\" />\n        <keyword name=\"<=\" />\n        <keyword name=\">\" />\n        <keyword name=\"!=\" />\n        <keyword name=\"<>\" />\n        <keyword name=\"between\" />\n        <keyword name=\"in\" />\n        <keyword name=\"isnull\" />\n    </cat>\n    <cat group=\"8\">\n        <keyword name=\"false\" />\n        <keyword name=\"true\" />\n        <keyword name=\"and\" />\n        <keyword name=\"not\" />\n        <keyword name=\"or\" />\n    </cat>\n    <cat group=\"9\">\n        <keyword name=\"ascii\" />\n        <keyword name=\"big_endian\" />\n        <keyword name=\"bitfield\" />\n        <keyword name=\"boolean\" />\n        <keyword name=\"data\" />\n        <keyword name=\"decimal\" />\n        <keyword name=\"enum\" />\n        <keyword name=\"integer\" />\n        <keyword name=\"little_endian\" />\n        <keyword name=\"qstring\" />\n        <keyword name=\"real\" />\n        <keyword name=\"recordof\" />\n        <keyword name=\"recordset\" />\n        <keyword name=\"set\" />\n        <keyword name=\"set of\" />\n        <keyword name=\"size_t\" />\n        <keyword name=\"string\" />\n        <keyword name=\"typeof\" />\n        <keyword name=\"udecimal\" />\n        <keyword name=\"unsigned\" />\n        <keyword name=\"utf8\" />\n        <keyword name=\"varstring\" />\n        <keyword name=\"varunicode\" />\n    </cat>\n    <cat group=\"10\">\n        <keyword name=\"backup\" />\n        <keyword name=\"cluster\" />\n        <keyword name=\"encrypt\" />\n        <keyword name=\"expire\" />\n        <keyword name=\"heading\" />\n        <keyword name=\"multiple\" />\n        <keyword name=\"label\" />\n        <keyword name=\"nooverwrite\" />\n        <keyword name=\"overwrite\" />\n        <keyword name=\"preload\" />\n        <keyword name=\"single\" />\n        <keyword name=\"csv\" />\n        <keyword name=\"quote\" />\n        <keyword name=\"separator\" />\n        <keyword name=\"terminator\" />\n        <keyword name=\"noxpath\" />\n    </cat>\n    <cat group=\"11\">\n        <keyword name=\"aggregate\" />\n        <keyword name=\"allnodes\" />\n        <keyword name=\"case\" />\n        <keyword name=\"choose\" />\n        <keyword name=\"choosen\" />\n        <keyword name=\"choosesets\" />\n        <keyword name=\"combine\" />\n        <keyword name=\"dataset\" />\n        <keyword name=\"dedup\" />\n        <keyword name=\"denormalize\" />\n        <keyword name=\"dictionary\" />\n        <keyword name=\"distribute\" />\n        <keyword name=\"distribution\" />\n        <keyword name=\"_empty_\" />\n        <keyword name=\"enth\" />\n        <keyword name=\"fetch\" />\n        <keyword name=\"fromxml\" />\n        <keyword name=\"fromjson\" />\n        <keyword name=\"graph\" />\n        <keyword name=\"group\" />\n        <keyword name=\"having\" />\n        <keyword name=\"httpcall\" />\n        <keyword name=\"index\" />\n        <keyword name=\"iterate\" />\n        <keyword name=\"join\" />\n        <keyword name=\"loop\" />\n        <keyword name=\"map\" />\n        <keyword name=\"merge\" />\n        <keyword name=\"mergejoin\" />\n        <keyword name=\"nocombine\" />\n        <keyword name=\"nonempty\" />\n        <keyword name=\"normalize\" />\n        <keyword name=\"parse\" />\n        <keyword name=\"pattern\" />\n        <keyword name=\"process\" />\n        <keyword name=\"project\" />\n        <keyword name=\"quantile\" />\n        <keyword name=\"range\" />\n        <keyword name=\"rank\" />\n        <keyword name=\"ranked\" />\n        <keyword name=\"regroup\" />\n        <keyword name=\"rejected\" />\n        <keyword name=\"rollup\" />\n        <keyword name=\"row\" />\n        <keyword name=\"sample\" />\n        <keyword name=\"score\" />\n        <keyword name=\"sort\" />\n        <keyword name=\"stepped\" />\n        <keyword name=\"subsort\" />\n        <keyword name=\"table\" />\n        <keyword name=\"topn\" />\n        <keyword name=\"trace\" />\n        <keyword name=\"ungroup\" />\n        <keyword name=\"which\" />\n        <keyword name=\"within\" />\n        <keyword name=\"workunit\" />\n        <keyword name=\"xmldecode\" />\n        <keyword name=\"xmlencode\" />\n    </cat>\n    <cat group=\"12\">\n        <keyword name=\"__alias__\" />\n        <keyword name=\"_array_\" />\n        <keyword name=\"cardinality\" />\n        <keyword name=\"__compound__\" />\n        <keyword name=\"__compressed__\" />\n        <keyword name=\"__grouped__\" />\n        <keyword name=\"_linkcounted_\" />\n        <keyword name=\"__nameof__\" />\n        <keyword name=\"__nostreaming__\" />\n        <keyword name=\"__owned__\" />\n        <keyword name=\"after\" />\n        <keyword name=\"algorithm\" />\n        <keyword name=\"all\" />\n        <keyword name=\"any\" />\n        <keyword name=\"best\" />\n        <keyword name=\"bitmap\" />\n        <keyword name=\"bloom\" />\n        <keyword name=\"blob\" />\n        <keyword name=\"c++\" />\n        <keyword name=\"choosen:all\" />\n        <keyword name=\"const\" />\n        <keyword name=\"counter\" />\n        <keyword name=\"descend\" />\n        <keyword name=\"desc\" />\n        <keyword name=\"ebcdic\" />\n        <keyword name=\"embedded\" />\n        <keyword name=\"except\" />\n        <keyword name=\"exclusive\" />\n        <keyword name=\"extend\" />\n        <keyword name=\"few\" />\n        <keyword name=\"fileposition\" />\n        <keyword name=\"filtered\" />\n        <keyword name=\"first\" />\n        <keyword name=\"fixed\" />\n        <keyword name=\"flat\" />\n        <keyword name=\"full\" />\n        <keyword name=\"grouped\" />\n        <keyword name=\"inner\" />\n        <keyword name=\"last\" />\n        <keyword name=\"left\" />\n        <keyword name=\"linkcounted\" />\n        <keyword name=\"literal\" />\n        <keyword name=\"local\" />\n        <keyword name=\"locale\" />\n        <keyword name=\"localfileposition\" />\n        <keyword name=\"logicalfilename\" />\n        <keyword name=\"lookup\" />\n        <keyword name=\"lzw\" />\n        <keyword name=\"many\" />\n        <keyword name=\"noconst\" />\n        <keyword name=\"noroot\" />\n        <keyword name=\"noscan\" />\n        <keyword name=\"notrim\" />\n        <keyword name=\"only\" />\n        <keyword name=\"opt\" />\n        <keyword name=\"__option__\" />\n        <keyword name=\"out\" />\n        <keyword name=\"outer\" />\n        <keyword name=\"packed\" />\n        <keyword name=\"probability\" />\n        <keyword name=\"pulled\" />\n        <keyword name=\"remote\" />\n        <keyword name=\"restricted\" />\n        <keyword name=\"return\" />\n        <keyword name=\"right\" />\n        <keyword name=\"rows\" />\n        <keyword name=\"rule\" />\n        <keyword name=\"scan\" />\n        <keyword name=\"self\" />\n        <keyword name=\"smart\" />\n        <keyword name=\"sql\" />\n        <keyword name=\"streamed\" />\n        <keyword name=\"thor\" />\n        <keyword name=\"unordered\" />\n        <keyword name=\"unsorted\" />\n        <keyword name=\"volatile\" />\n        <keyword name=\"whole\" />\n    </cat>\n    <cat group=\"13\">\n        <keyword name=\"eclcrc\" />\n        <keyword name=\"hash\" />\n        <keyword name=\"hash32\" />\n        <keyword name=\"hash64\" />\n        <keyword name=\"hashcrc\" />\n        <keyword name=\"hashmd5\" />\n        <keyword name=\"matchlength\" />\n        <keyword name=\"matchposition\" />\n        <keyword name=\"matchrow\" />\n        <keyword name=\"rowdiff\" />\n        <keyword name=\"sizeof\" />\n        <keyword name=\"transfer\" />\n    </cat>\n    <cat group=\"14\">\n        <keyword name=\"atmost\" />\n        <keyword name=\"before\" />\n        <keyword name=\"cogroup\" />\n        <keyword name=\"compressed\" />\n        <keyword name=\"default\" />\n        <keyword name=\"escape\" />\n        <keyword name=\"format\" />\n        <keyword name=\"global\" />\n        <keyword name=\"groupby\" />\n        <keyword name=\"guard\" />\n        <keyword name=\"httpheader\" />\n        <keyword name=\"internal\" />\n        <keyword name=\"joined\" />\n        <keyword name=\"json\" />\n        <keyword name=\"keep\" />\n        <keyword name=\"keyed\" />\n        <keyword name=\"limit\" />\n        <keyword name=\"matched\" />\n        <keyword name=\"matchtext\" />\n        <keyword name=\"matchunicode\" />\n        <keyword name=\"matchutf8\" />\n        <keyword name=\"mofn\" />\n        <keyword name=\"maxcount\" />\n        <keyword name=\"maxlength\" />\n        <keyword name=\"maxsize\" />\n        <keyword name=\"named\" />\n        <keyword name=\"namespace\" />\n        <keyword name=\"nocase\" />\n        <keyword name=\"nolocal\" />\n        <keyword name=\"nosort\" />\n        <keyword name=\"onfail\" />\n        <keyword name=\"partition\" />\n        <keyword name=\"penalty\" />\n        <keyword name=\"prefetch\" />\n        <keyword name=\"proxyaddress\" />\n        <keyword name=\"refresh\" />\n        <keyword name=\"repeat\" />\n        <keyword name=\"response\" />\n        <keyword name=\"retry\" />\n        <keyword name=\"rowset\" />\n        <keyword name=\"skew\" />\n        <keyword name=\"skip\" />\n        <keyword name=\"soapaction\" />\n        <keyword name=\"stable\" />\n        <keyword name=\"thisnode\" />\n        <keyword name=\"threshold\" />\n        <keyword name=\"timelimit\" />\n        <keyword name=\"timeout\" />\n        <keyword name=\"token\" />\n        <keyword name=\"unstable\" />\n        <keyword name=\"update\" />\n        <keyword name=\"use\" />\n        <keyword name=\"validate\" />\n        <keyword name=\"virtual\" />\n        <keyword name=\"whitespace\" />\n        <keyword name=\"width\" />\n        <keyword name=\"wild\" />\n        <keyword name=\"xml\" />\n        <keyword name=\"xmlns\" />\n        <keyword name=\"xmldefault\" />\n        <keyword name=\"xpath\" />\n        <keyword name=\"xmlproject\" />\n        <keyword name=\"xmltext\" />\n        <keyword name=\"xmlunicode\" />\n    </cat>\n    <cat group=\"15\">\n        <keyword name=\"action\" />\n        <keyword name=\"apply\" />\n        <keyword name=\"as\" />\n        <keyword name=\"build\" />\n        <keyword name=\"buildindex\" />\n        <keyword name=\"checkpoint\" />\n        <keyword name=\"critical\" />\n        <keyword name=\"cron\" />\n        <keyword name=\"define\" />\n        <keyword name=\"deprecated\" />\n        <keyword name=\"dynamic\" />\n        <keyword name=\"event\" />\n        <keyword name=\"eventextra\" />\n        <keyword name=\"eventname\" />\n        <keyword name=\"export\" />\n        <keyword name=\"from\" />\n        <keyword name=\"import\" />\n        <keyword name=\"independent\" />\n        <keyword name=\"keydiff\" />\n        <keyword name=\"keypatch\" />\n        <keyword name=\"labeled\" />\n        <keyword name=\"labelled\" />\n        <keyword name=\"library\" />\n        <keyword name=\"notify\" />\n        <keyword name=\"once\" />\n        <keyword name=\"onwarning\" />\n        <keyword name=\"ordered\" />\n        <keyword name=\"output\" />\n        <keyword name=\"parallel\" />\n        <keyword name=\"persist\" />\n        <keyword name=\"pipe\" />\n        <keyword name=\"priority\" />\n        <keyword name=\"private\" />\n        <keyword name=\"section\" />\n        <keyword name=\"sequential\" />\n        <keyword name=\"shared\" />\n        <keyword name=\"soapcall\" />\n        <keyword name=\"stored\" />\n        <keyword name=\"wait\" />\n        <keyword name=\"when\" />\n    </cat>\n    <cat group=\"16\">\n        <keyword name=\"__common__\" />\n        <keyword name=\"distributed\" />\n        <keyword name=\"evaluate\" />\n        <keyword name=\"forward\" />\n        <keyword name=\"hint\" />\n        <keyword name=\"noboundcheck\" />\n        <keyword name=\"nofold\" />\n        <keyword name=\"nohoist\" />\n        <keyword name=\"nothor\" />\n        <keyword name=\"pull\" />\n        <keyword name=\"sorted\" />\n        <keyword name=\"likely\" />\n        <keyword name=\"unlikely\" />\n    </cat>\n    <cat group=\"17\">\n        <keyword name=\"assert\" />\n        <keyword name=\"catch\" />\n        <keyword name=\"encrypted\" />\n        <keyword name=\"error\" />\n        <keyword name=\"fail\" />\n        <keyword name=\"failcode\" />\n        <keyword name=\"failmessage\" />\n        <keyword name=\"failure\" />\n        <keyword name=\"ignore\" />\n        <keyword name=\"isvalid\" />\n        <keyword name=\"onfail\" />\n        <keyword name=\"success\" />\n        <keyword name=\"recovery\" />\n        <keyword name=\"warning\" />\n    </cat>\n    <cat group=\"18\">\n        <keyword name=\"__sequence__\" />\n        <keyword name=\"feature\" />\n        <keyword name=\"omitted\" />\n    </cat>\n    <cat group=\"19\">\n        <keyword name=\":=\" />\n        <keyword name=\"<?>\" />\n        <keyword name=\"<??>\" />\n        <keyword name=\"..\" />\n        <keyword name=\"=>\" />\n    </cat>\n</xml> ";
	}

	var graphvizlib = createCommonjsModule(function (module, exports) {
	var cpp = (function() {
	  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
	  
	  return (
	function(cpp) {
	  cpp = cpp || {};

	var Module=typeof cpp!=="undefined"?cpp:{};var readyPromiseResolve,readyPromiseReject;Module["ready"]=new Promise(function(resolve,reject){readyPromiseResolve=resolve;readyPromiseReject=reject;});var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key];}}var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=true;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readBinary;{if(typeof document!=="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src;}if(_scriptDir){scriptDirectory=_scriptDir;}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1);}else {scriptDirectory="";}{read_=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};}}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key];}}moduleOverrides=null;if(Module["arguments"])Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var STACK_ALIGN=16;function alignMemory(size,factor){if(!factor)factor=STACK_ALIGN;return Math.ceil(size/factor)*factor}var tempRet0=0;var setTempRet0=function(value){tempRet0=value;};var getTempRet0=function(){return tempRet0};var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime;if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(typeof WebAssembly!=="object"){abort("no native wasm support detected");}var wasmMemory;var ABORT=false;function assert(condition,text){if(!condition){abort("Assertion failed: "+text);}}var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heap,idx,maxBytesToRead){var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heap[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heap.subarray&&UTF8Decoder){return UTF8Decoder.decode(heap.subarray(idx,endPtr))}else {var str="";while(idx<endPtr){var u0=heap[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heap[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heap[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else {u0=(u0&7)<<18|u1<<12|u2<<6|heap[idx++]&63;}if(u0<65536){str+=String.fromCharCode(u0);}else {var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}}return str}function UTF8ToString(ptr,maxBytesToRead){return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function stringToUTF8Array(str,heap,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023;}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}else {if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}}heap[outIdx]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127)++len;else if(u<=2047)len+=2;else if(u<=65535)len+=3;else len+=4;}return len}function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer);}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i);}if(!dontAddNull)HEAP8[buffer>>0]=0;}function alignUp(x,multiple){if(x%multiple>0){x+=multiple-x%multiple;}return x}var buffer,HEAP8,HEAPU8,HEAP16,HEAP32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=new Uint16Array(buf);Module["HEAPU32"]=new Uint32Array(buf);Module["HEAPF32"]=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf);}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[];function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function initRuntime(){if(!Module["noFSInit"]&&!FS.init.initialized)FS.init();TTY.init();callRuntimeCallbacks(__ATINIT__);}function preMain(){FS.ignorePermissions=false;callRuntimeCallbacks(__ATMAIN__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}var runDependencies=0;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}if(runDependencies==0){if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what);}what+="";err(what);ABORT=true;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}function hasPrefix(str,prefix){return String.prototype.startsWith?str.startsWith(prefix):str.indexOf(prefix)===0}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return hasPrefix(filename,dataURIPrefix)}var wasmBinaryFile="graphvizlib.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile);}function getBinary(file){try{if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary);else {throw "both async and sync fetching of the wasm failed"}}catch(err){abort(err);}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw "failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["R"];updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["S"];removeRunDependency();}addRunDependency();function receiveInstantiatedSource(output){receiveInstance(output["instance"]);}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason);})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiatedSource,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiatedSource)})})}else {return instantiateArrayBuffer(receiveInstantiatedSource)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync().catch(readyPromiseReject);return {}}var tempDouble;var tempI64;var ASM_CONSTS={1186:function($0,$1){var path=UTF8ToString($0);var data=UTF8ToString($1);FS.createPath("/",PATH.dirname(path));FS.writeFile(PATH.join("/",path),data);}};function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){wasmTable.get(func)();}else {wasmTable.get(func)(callback.arg);}}else {func(callback.arg===undefined?null:callback.arg);}}}var _emscripten_get_now;_emscripten_get_now=function(){return performance.now()};var _emscripten_get_now_is_monotonic=true;function setErrNo(value){HEAP32[___errno_location()>>2]=value;return value}function _clock_gettime(clk_id,tp){var now;if(clk_id===0){now=Date.now();}else if((clk_id===1||clk_id===4)&&_emscripten_get_now_is_monotonic){now=_emscripten_get_now();}else {setErrNo(28);return -1}HEAP32[tp>>2]=now/1e3|0;HEAP32[tp+4>>2]=now%1e3*1e3*1e3|0;return 0}function ___clock_gettime(a0,a1){return _clock_gettime(a0,a1)}var ExceptionInfoAttrs={DESTRUCTOR_OFFSET:0,REFCOUNT_OFFSET:4,TYPE_OFFSET:8,CAUGHT_OFFSET:12,RETHROWN_OFFSET:13,SIZE:16};function ___cxa_allocate_exception(size){return _malloc(size+ExceptionInfoAttrs.SIZE)+ExceptionInfoAttrs.SIZE}function ExceptionInfo(excPtr){this.excPtr=excPtr;this.ptr=excPtr-ExceptionInfoAttrs.SIZE;this.set_type=function(type){HEAP32[this.ptr+ExceptionInfoAttrs.TYPE_OFFSET>>2]=type;};this.get_type=function(){return HEAP32[this.ptr+ExceptionInfoAttrs.TYPE_OFFSET>>2]};this.set_destructor=function(destructor){HEAP32[this.ptr+ExceptionInfoAttrs.DESTRUCTOR_OFFSET>>2]=destructor;};this.get_destructor=function(){return HEAP32[this.ptr+ExceptionInfoAttrs.DESTRUCTOR_OFFSET>>2]};this.set_refcount=function(refcount){HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>2]=refcount;};this.set_caught=function(caught){caught=caught?1:0;HEAP8[this.ptr+ExceptionInfoAttrs.CAUGHT_OFFSET>>0]=caught;};this.get_caught=function(){return HEAP8[this.ptr+ExceptionInfoAttrs.CAUGHT_OFFSET>>0]!=0};this.set_rethrown=function(rethrown){rethrown=rethrown?1:0;HEAP8[this.ptr+ExceptionInfoAttrs.RETHROWN_OFFSET>>0]=rethrown;};this.get_rethrown=function(){return HEAP8[this.ptr+ExceptionInfoAttrs.RETHROWN_OFFSET>>0]!=0};this.init=function(type,destructor){this.set_type(type);this.set_destructor(destructor);this.set_refcount(0);this.set_caught(false);this.set_rethrown(false);};this.add_ref=function(){var value=HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>2];HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>2]=value+1;};this.release_ref=function(){var prev=HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>2];HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>2]=prev-1;return prev===1};}function ___cxa_throw(ptr,type,destructor){var info=new ExceptionInfo(ptr);info.init(type,destructor);throw ptr}var PATH={splitPath:function(filename){var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:function(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1);}else if(last===".."){parts.splice(i,1);up++;}else if(up){parts.splice(i,1);up--;}}if(allowAboveRoot){for(;up;up--){parts.unshift("..");}}return parts},normalize:function(path){var isAbsolute=path.charAt(0)==="/",trailingSlash=path.substr(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(function(p){return !!p}),!isAbsolute).join("/");if(!path&&!isAbsolute){path=".";}if(path&&trailingSlash){path+="/";}return (isAbsolute?"/":"")+path},dirname:function(path){var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return "."}if(dir){dir=dir.substr(0,dir.length-1);}return root+dir},basename:function(path){if(path==="/")return "/";path=PATH.normalize(path);path=path.replace(/\/$/,"");var lastSlash=path.lastIndexOf("/");if(lastSlash===-1)return path;return path.substr(lastSlash+1)},extname:function(path){return PATH.splitPath(path)[3]},join:function(){var paths=Array.prototype.slice.call(arguments,0);return PATH.normalize(paths.join("/"))},join2:function(l,r){return PATH.normalize(l+"/"+r)}};function getRandomDevice(){if(typeof crypto==="object"&&typeof crypto["getRandomValues"]==="function"){var randomBuffer=new Uint8Array(1);return function(){crypto.getRandomValues(randomBuffer);return randomBuffer[0]}}else return function(){abort("randomDevice");}}var PATH_FS={resolve:function(){var resolvedPath="",resolvedAbsolute=false;for(var i=arguments.length-1;i>=-1&&!resolvedAbsolute;i--){var path=i>=0?arguments[i]:FS.cwd();if(typeof path!=="string"){throw new TypeError("Arguments to path.resolve must be strings")}else if(!path){return ""}resolvedPath=path+"/"+resolvedPath;resolvedAbsolute=path.charAt(0)==="/";}resolvedPath=PATH.normalizeArray(resolvedPath.split("/").filter(function(p){return !!p}),!resolvedAbsolute).join("/");return (resolvedAbsolute?"/":"")+resolvedPath||"."},relative:function(from,to){from=PATH_FS.resolve(from).substr(1);to=PATH_FS.resolve(to).substr(1);function trim(arr){var start=0;for(;start<arr.length;start++){if(arr[start]!=="")break}var end=arr.length-1;for(;end>=0;end--){if(arr[end]!=="")break}if(start>end)return [];return arr.slice(start,end-start+1)}var fromParts=trim(from.split("/"));var toParts=trim(to.split("/"));var length=Math.min(fromParts.length,toParts.length);var samePartsLength=length;for(var i=0;i<length;i++){if(fromParts[i]!==toParts[i]){samePartsLength=i;break}}var outputParts=[];for(var i=samePartsLength;i<fromParts.length;i++){outputParts.push("..");}outputParts=outputParts.concat(toParts.slice(samePartsLength));return outputParts.join("/")}};var TTY={ttys:[],init:function(){},shutdown:function(){},register:function(dev,ops){TTY.ttys[dev]={input:[],output:[],ops:ops};FS.registerDevice(dev,TTY.stream_ops);},stream_ops:{open:function(stream){var tty=TTY.ttys[stream.node.rdev];if(!tty){throw new FS.ErrnoError(43)}stream.tty=tty;stream.seekable=false;},close:function(stream){stream.tty.ops.flush(stream.tty);},flush:function(stream){stream.tty.ops.flush(stream.tty);},read:function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.get_char){throw new FS.ErrnoError(60)}var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=stream.tty.ops.get_char(stream.tty);}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead},write:function(stream,buffer,offset,length,pos){if(!stream.tty||!stream.tty.ops.put_char){throw new FS.ErrnoError(60)}try{for(var i=0;i<length;i++){stream.tty.ops.put_char(stream.tty,buffer[offset+i]);}}catch(e){throw new FS.ErrnoError(29)}if(length){stream.node.timestamp=Date.now();}return i}},default_tty_ops:{get_char:function(tty){if(!tty.input.length){var result=null;if(typeof window!="undefined"&&typeof window.prompt=="function"){result=window.prompt("Input: ");if(result!==null){result+="\n";}}else if(typeof readline=="function"){result=readline();if(result!==null){result+="\n";}}if(!result){return null}tty.input=intArrayFromString(result,true);}return tty.input.shift()},put_char:function(tty,val){if(val===null||val===10){out(UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}},flush:function(tty){if(tty.output&&tty.output.length>0){out(UTF8ArrayToString(tty.output,0));tty.output=[];}}},default_tty1_ops:{put_char:function(tty,val){if(val===null||val===10){err(UTF8ArrayToString(tty.output,0));tty.output=[];}else {if(val!=0)tty.output.push(val);}},flush:function(tty){if(tty.output&&tty.output.length>0){err(UTF8ArrayToString(tty.output,0));tty.output=[];}}}};function mmapAlloc(size){var alignedSize=alignMemory(size,16384);var ptr=_malloc(alignedSize);while(size<alignedSize)HEAP8[ptr+size++]=0;return ptr}var MEMFS={ops_table:null,mount:function(mount){return MEMFS.createNode(null,"/",16384|511,0)},createNode:function(parent,name,mode,dev){if(FS.isBlkdev(mode)||FS.isFIFO(mode)){throw new FS.ErrnoError(63)}if(!MEMFS.ops_table){MEMFS.ops_table={dir:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,lookup:MEMFS.node_ops.lookup,mknod:MEMFS.node_ops.mknod,rename:MEMFS.node_ops.rename,unlink:MEMFS.node_ops.unlink,rmdir:MEMFS.node_ops.rmdir,readdir:MEMFS.node_ops.readdir,symlink:MEMFS.node_ops.symlink},stream:{llseek:MEMFS.stream_ops.llseek}},file:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:{llseek:MEMFS.stream_ops.llseek,read:MEMFS.stream_ops.read,write:MEMFS.stream_ops.write,allocate:MEMFS.stream_ops.allocate,mmap:MEMFS.stream_ops.mmap,msync:MEMFS.stream_ops.msync}},link:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr,readlink:MEMFS.node_ops.readlink},stream:{}},chrdev:{node:{getattr:MEMFS.node_ops.getattr,setattr:MEMFS.node_ops.setattr},stream:FS.chrdev_stream_ops}};}var node=FS.createNode(parent,name,mode,dev);if(FS.isDir(node.mode)){node.node_ops=MEMFS.ops_table.dir.node;node.stream_ops=MEMFS.ops_table.dir.stream;node.contents={};}else if(FS.isFile(node.mode)){node.node_ops=MEMFS.ops_table.file.node;node.stream_ops=MEMFS.ops_table.file.stream;node.usedBytes=0;node.contents=null;}else if(FS.isLink(node.mode)){node.node_ops=MEMFS.ops_table.link.node;node.stream_ops=MEMFS.ops_table.link.stream;}else if(FS.isChrdev(node.mode)){node.node_ops=MEMFS.ops_table.chrdev.node;node.stream_ops=MEMFS.ops_table.chrdev.stream;}node.timestamp=Date.now();if(parent){parent.contents[name]=node;}return node},getFileDataAsRegularArray:function(node){if(node.contents&&node.contents.subarray){var arr=[];for(var i=0;i<node.usedBytes;++i)arr.push(node.contents[i]);return arr}return node.contents},getFileDataAsTypedArray:function(node){if(!node.contents)return new Uint8Array(0);if(node.contents.subarray)return node.contents.subarray(0,node.usedBytes);return new Uint8Array(node.contents)},expandFileStorage:function(node,newCapacity){var prevCapacity=node.contents?node.contents.length:0;if(prevCapacity>=newCapacity)return;var CAPACITY_DOUBLING_MAX=1024*1024;newCapacity=Math.max(newCapacity,prevCapacity*(prevCapacity<CAPACITY_DOUBLING_MAX?2:1.125)>>>0);if(prevCapacity!=0)newCapacity=Math.max(newCapacity,256);var oldContents=node.contents;node.contents=new Uint8Array(newCapacity);if(node.usedBytes>0)node.contents.set(oldContents.subarray(0,node.usedBytes),0);return},resizeFileStorage:function(node,newSize){if(node.usedBytes==newSize)return;if(newSize==0){node.contents=null;node.usedBytes=0;return}if(!node.contents||node.contents.subarray){var oldContents=node.contents;node.contents=new Uint8Array(newSize);if(oldContents){node.contents.set(oldContents.subarray(0,Math.min(newSize,node.usedBytes)));}node.usedBytes=newSize;return}if(!node.contents)node.contents=[];if(node.contents.length>newSize)node.contents.length=newSize;else while(node.contents.length<newSize)node.contents.push(0);node.usedBytes=newSize;},node_ops:{getattr:function(node){var attr={};attr.dev=FS.isChrdev(node.mode)?node.id:1;attr.ino=node.id;attr.mode=node.mode;attr.nlink=1;attr.uid=0;attr.gid=0;attr.rdev=node.rdev;if(FS.isDir(node.mode)){attr.size=4096;}else if(FS.isFile(node.mode)){attr.size=node.usedBytes;}else if(FS.isLink(node.mode)){attr.size=node.link.length;}else {attr.size=0;}attr.atime=new Date(node.timestamp);attr.mtime=new Date(node.timestamp);attr.ctime=new Date(node.timestamp);attr.blksize=4096;attr.blocks=Math.ceil(attr.size/attr.blksize);return attr},setattr:function(node,attr){if(attr.mode!==undefined){node.mode=attr.mode;}if(attr.timestamp!==undefined){node.timestamp=attr.timestamp;}if(attr.size!==undefined){MEMFS.resizeFileStorage(node,attr.size);}},lookup:function(parent,name){throw FS.genericErrors[44]},mknod:function(parent,name,mode,dev){return MEMFS.createNode(parent,name,mode,dev)},rename:function(old_node,new_dir,new_name){if(FS.isDir(old_node.mode)){var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(new_node){for(var i in new_node.contents){throw new FS.ErrnoError(55)}}}delete old_node.parent.contents[old_node.name];old_node.name=new_name;new_dir.contents[new_name]=old_node;old_node.parent=new_dir;},unlink:function(parent,name){delete parent.contents[name];},rmdir:function(parent,name){var node=FS.lookupNode(parent,name);for(var i in node.contents){throw new FS.ErrnoError(55)}delete parent.contents[name];},readdir:function(node){var entries=[".",".."];for(var key in node.contents){if(!node.contents.hasOwnProperty(key)){continue}entries.push(key);}return entries},symlink:function(parent,newname,oldpath){var node=MEMFS.createNode(parent,newname,511|40960,0);node.link=oldpath;return node},readlink:function(node){if(!FS.isLink(node.mode)){throw new FS.ErrnoError(28)}return node.link}},stream_ops:{read:function(stream,buffer,offset,length,position){var contents=stream.node.contents;if(position>=stream.node.usedBytes)return 0;var size=Math.min(stream.node.usedBytes-position,length);if(size>8&&contents.subarray){buffer.set(contents.subarray(position,position+size),offset);}else {for(var i=0;i<size;i++)buffer[offset+i]=contents[position+i];}return size},write:function(stream,buffer,offset,length,position,canOwn){if(buffer.buffer===HEAP8.buffer){canOwn=false;}if(!length)return 0;var node=stream.node;node.timestamp=Date.now();if(buffer.subarray&&(!node.contents||node.contents.subarray)){if(canOwn){node.contents=buffer.subarray(offset,offset+length);node.usedBytes=length;return length}else if(node.usedBytes===0&&position===0){node.contents=buffer.slice(offset,offset+length);node.usedBytes=length;return length}else if(position+length<=node.usedBytes){node.contents.set(buffer.subarray(offset,offset+length),position);return length}}MEMFS.expandFileStorage(node,position+length);if(node.contents.subarray&&buffer.subarray){node.contents.set(buffer.subarray(offset,offset+length),position);}else {for(var i=0;i<length;i++){node.contents[position+i]=buffer[offset+i];}}node.usedBytes=Math.max(node.usedBytes,position+length);return length},llseek:function(stream,offset,whence){var position=offset;if(whence===1){position+=stream.position;}else if(whence===2){if(FS.isFile(stream.node.mode)){position+=stream.node.usedBytes;}}if(position<0){throw new FS.ErrnoError(28)}return position},allocate:function(stream,offset,length){MEMFS.expandFileStorage(stream.node,offset+length);stream.node.usedBytes=Math.max(stream.node.usedBytes,offset+length);},mmap:function(stream,address,length,position,prot,flags){assert(address===0);if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}var ptr;var allocated;var contents=stream.node.contents;if(!(flags&2)&&contents.buffer===buffer){allocated=false;ptr=contents.byteOffset;}else {if(position>0||position+length<contents.length){if(contents.subarray){contents=contents.subarray(position,position+length);}else {contents=Array.prototype.slice.call(contents,position,position+length);}}allocated=true;ptr=mmapAlloc(length);if(!ptr){throw new FS.ErrnoError(48)}HEAP8.set(contents,ptr);}return {ptr:ptr,allocated:allocated}},msync:function(stream,buffer,offset,length,mmapFlags){if(!FS.isFile(stream.node.mode)){throw new FS.ErrnoError(43)}if(mmapFlags&2){return 0}var bytesWritten=MEMFS.stream_ops.write(stream,buffer,0,length,offset,false);return 0}}};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:function(path,opts){path=PATH_FS.resolve(FS.cwd(),path);opts=opts||{};if(!path)return {path:"",node:null};var defaults={follow_mount:true,recurse_count:0};for(var key in defaults){if(opts[key]===undefined){opts[key]=defaults[key];}}if(opts.recurse_count>8){throw new FS.ErrnoError(32)}var parts=PATH.normalizeArray(path.split("/").filter(function(p){return !!p}),false);var current=FS.root;var current_path="/";for(var i=0;i<parts.length;i++){var islast=i===parts.length-1;if(islast&&opts.parent){break}current=FS.lookupNode(current,parts[i]);current_path=PATH.join2(current_path,parts[i]);if(FS.isMountpoint(current)){if(!islast||islast&&opts.follow_mount){current=current.mounted.root;}}if(!islast||opts.follow){var count=0;while(FS.isLink(current.mode)){var link=FS.readlink(current_path);current_path=PATH_FS.resolve(PATH.dirname(current_path),link);var lookup=FS.lookupPath(current_path,{recurse_count:opts.recurse_count});current=lookup.node;if(count++>40){throw new FS.ErrnoError(32)}}}}return {path:current_path,node:current}},getPath:function(node){var path;while(true){if(FS.isRoot(node)){var mount=node.mount.mountpoint;if(!path)return mount;return mount[mount.length-1]!=="/"?mount+"/"+path:mount+path}path=path?node.name+"/"+path:node.name;node=node.parent;}},hashName:function(parentid,name){var hash=0;for(var i=0;i<name.length;i++){hash=(hash<<5)-hash+name.charCodeAt(i)|0;}return (parentid+hash>>>0)%FS.nameTable.length},hashAddNode:function(node){var hash=FS.hashName(node.parent.id,node.name);node.name_next=FS.nameTable[hash];FS.nameTable[hash]=node;},hashRemoveNode:function(node){var hash=FS.hashName(node.parent.id,node.name);if(FS.nameTable[hash]===node){FS.nameTable[hash]=node.name_next;}else {var current=FS.nameTable[hash];while(current){if(current.name_next===node){current.name_next=node.name_next;break}current=current.name_next;}}},lookupNode:function(parent,name){var errCode=FS.mayLookup(parent);if(errCode){throw new FS.ErrnoError(errCode,parent)}var hash=FS.hashName(parent.id,name);for(var node=FS.nameTable[hash];node;node=node.name_next){var nodeName=node.name;if(node.parent.id===parent.id&&nodeName===name){return node}}return FS.lookup(parent,name)},createNode:function(parent,name,mode,rdev){var node=new FS.FSNode(parent,name,mode,rdev);FS.hashAddNode(node);return node},destroyNode:function(node){FS.hashRemoveNode(node);},isRoot:function(node){return node===node.parent},isMountpoint:function(node){return !!node.mounted},isFile:function(mode){return (mode&61440)===32768},isDir:function(mode){return (mode&61440)===16384},isLink:function(mode){return (mode&61440)===40960},isChrdev:function(mode){return (mode&61440)===8192},isBlkdev:function(mode){return (mode&61440)===24576},isFIFO:function(mode){return (mode&61440)===4096},isSocket:function(mode){return (mode&49152)===49152},flagModes:{"r":0,"r+":2,"w":577,"w+":578,"a":1089,"a+":1090},modeStringToFlags:function(str){var flags=FS.flagModes[str];if(typeof flags==="undefined"){throw new Error("Unknown file open mode: "+str)}return flags},flagsToPermissionString:function(flag){var perms=["r","w","rw"][flag&3];if(flag&512){perms+="w";}return perms},nodePermissions:function(node,perms){if(FS.ignorePermissions){return 0}if(perms.indexOf("r")!==-1&&!(node.mode&292)){return 2}else if(perms.indexOf("w")!==-1&&!(node.mode&146)){return 2}else if(perms.indexOf("x")!==-1&&!(node.mode&73)){return 2}return 0},mayLookup:function(dir){var errCode=FS.nodePermissions(dir,"x");if(errCode)return errCode;if(!dir.node_ops.lookup)return 2;return 0},mayCreate:function(dir,name){try{var node=FS.lookupNode(dir,name);return 20}catch(e){}return FS.nodePermissions(dir,"wx")},mayDelete:function(dir,name,isdir){var node;try{node=FS.lookupNode(dir,name);}catch(e){return e.errno}var errCode=FS.nodePermissions(dir,"wx");if(errCode){return errCode}if(isdir){if(!FS.isDir(node.mode)){return 54}if(FS.isRoot(node)||FS.getPath(node)===FS.cwd()){return 10}}else {if(FS.isDir(node.mode)){return 31}}return 0},mayOpen:function(node,flags){if(!node){return 44}if(FS.isLink(node.mode)){return 32}else if(FS.isDir(node.mode)){if(FS.flagsToPermissionString(flags)!=="r"||flags&512){return 31}}return FS.nodePermissions(node,FS.flagsToPermissionString(flags))},MAX_OPEN_FDS:4096,nextfd:function(fd_start,fd_end){fd_start=fd_start||0;fd_end=fd_end||FS.MAX_OPEN_FDS;for(var fd=fd_start;fd<=fd_end;fd++){if(!FS.streams[fd]){return fd}}throw new FS.ErrnoError(33)},getStream:function(fd){return FS.streams[fd]},createStream:function(stream,fd_start,fd_end){if(!FS.FSStream){FS.FSStream=function(){};FS.FSStream.prototype={object:{get:function(){return this.node},set:function(val){this.node=val;}},isRead:{get:function(){return (this.flags&2097155)!==1}},isWrite:{get:function(){return (this.flags&2097155)!==0}},isAppend:{get:function(){return this.flags&1024}}};}var newStream=new FS.FSStream;for(var p in stream){newStream[p]=stream[p];}stream=newStream;var fd=FS.nextfd(fd_start,fd_end);stream.fd=fd;FS.streams[fd]=stream;return stream},closeStream:function(fd){FS.streams[fd]=null;},chrdev_stream_ops:{open:function(stream){var device=FS.getDevice(stream.node.rdev);stream.stream_ops=device.stream_ops;if(stream.stream_ops.open){stream.stream_ops.open(stream);}},llseek:function(){throw new FS.ErrnoError(70)}},major:function(dev){return dev>>8},minor:function(dev){return dev&255},makedev:function(ma,mi){return ma<<8|mi},registerDevice:function(dev,ops){FS.devices[dev]={stream_ops:ops};},getDevice:function(dev){return FS.devices[dev]},getMounts:function(mount){var mounts=[];var check=[mount];while(check.length){var m=check.pop();mounts.push(m);check.push.apply(check,m.mounts);}return mounts},syncfs:function(populate,callback){if(typeof populate==="function"){callback=populate;populate=false;}FS.syncFSRequests++;if(FS.syncFSRequests>1){err("warning: "+FS.syncFSRequests+" FS.syncfs operations in flight at once, probably just doing extra work");}var mounts=FS.getMounts(FS.root.mount);var completed=0;function doCallback(errCode){FS.syncFSRequests--;return callback(errCode)}function done(errCode){if(errCode){if(!done.errored){done.errored=true;return doCallback(errCode)}return}if(++completed>=mounts.length){doCallback(null);}}mounts.forEach(function(mount){if(!mount.type.syncfs){return done(null)}mount.type.syncfs(mount,populate,done);});},mount:function(type,opts,mountpoint){var root=mountpoint==="/";var pseudo=!mountpoint;var node;if(root&&FS.root){throw new FS.ErrnoError(10)}else if(!root&&!pseudo){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});mountpoint=lookup.path;node=lookup.node;if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}if(!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}}var mount={type:type,opts:opts,mountpoint:mountpoint,mounts:[]};var mountRoot=type.mount(mount);mountRoot.mount=mount;mount.root=mountRoot;if(root){FS.root=mountRoot;}else if(node){node.mounted=mount;if(node.mount){node.mount.mounts.push(mount);}}return mountRoot},unmount:function(mountpoint){var lookup=FS.lookupPath(mountpoint,{follow_mount:false});if(!FS.isMountpoint(lookup.node)){throw new FS.ErrnoError(28)}var node=lookup.node;var mount=node.mounted;var mounts=FS.getMounts(mount);Object.keys(FS.nameTable).forEach(function(hash){var current=FS.nameTable[hash];while(current){var next=current.name_next;if(mounts.indexOf(current.mount)!==-1){FS.destroyNode(current);}current=next;}});node.mounted=null;var idx=node.mount.mounts.indexOf(mount);node.mount.mounts.splice(idx,1);},lookup:function(parent,name){return parent.node_ops.lookup(parent,name)},mknod:function(path,mode,dev){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);if(!name||name==="."||name===".."){throw new FS.ErrnoError(28)}var errCode=FS.mayCreate(parent,name);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.mknod){throw new FS.ErrnoError(63)}return parent.node_ops.mknod(parent,name,mode,dev)},create:function(path,mode){mode=mode!==undefined?mode:438;mode&=4095;mode|=32768;return FS.mknod(path,mode,0)},mkdir:function(path,mode){mode=mode!==undefined?mode:511;mode&=511|512;mode|=16384;return FS.mknod(path,mode,0)},mkdirTree:function(path,mode){var dirs=path.split("/");var d="";for(var i=0;i<dirs.length;++i){if(!dirs[i])continue;d+="/"+dirs[i];try{FS.mkdir(d,mode);}catch(e){if(e.errno!=20)throw e}}},mkdev:function(path,mode,dev){if(typeof dev==="undefined"){dev=mode;mode=438;}mode|=8192;return FS.mknod(path,mode,dev)},symlink:function(oldpath,newpath){if(!PATH_FS.resolve(oldpath)){throw new FS.ErrnoError(44)}var lookup=FS.lookupPath(newpath,{parent:true});var parent=lookup.node;if(!parent){throw new FS.ErrnoError(44)}var newname=PATH.basename(newpath);var errCode=FS.mayCreate(parent,newname);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.symlink){throw new FS.ErrnoError(63)}return parent.node_ops.symlink(parent,newname,oldpath)},rename:function(old_path,new_path){var old_dirname=PATH.dirname(old_path);var new_dirname=PATH.dirname(new_path);var old_name=PATH.basename(old_path);var new_name=PATH.basename(new_path);var lookup,old_dir,new_dir;lookup=FS.lookupPath(old_path,{parent:true});old_dir=lookup.node;lookup=FS.lookupPath(new_path,{parent:true});new_dir=lookup.node;if(!old_dir||!new_dir)throw new FS.ErrnoError(44);if(old_dir.mount!==new_dir.mount){throw new FS.ErrnoError(75)}var old_node=FS.lookupNode(old_dir,old_name);var relative=PATH_FS.relative(old_path,new_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(28)}relative=PATH_FS.relative(new_path,old_dirname);if(relative.charAt(0)!=="."){throw new FS.ErrnoError(55)}var new_node;try{new_node=FS.lookupNode(new_dir,new_name);}catch(e){}if(old_node===new_node){return}var isdir=FS.isDir(old_node.mode);var errCode=FS.mayDelete(old_dir,old_name,isdir);if(errCode){throw new FS.ErrnoError(errCode)}errCode=new_node?FS.mayDelete(new_dir,new_name,isdir):FS.mayCreate(new_dir,new_name);if(errCode){throw new FS.ErrnoError(errCode)}if(!old_dir.node_ops.rename){throw new FS.ErrnoError(63)}if(FS.isMountpoint(old_node)||new_node&&FS.isMountpoint(new_node)){throw new FS.ErrnoError(10)}if(new_dir!==old_dir){errCode=FS.nodePermissions(old_dir,"w");if(errCode){throw new FS.ErrnoError(errCode)}}try{if(FS.trackingDelegate["willMovePath"]){FS.trackingDelegate["willMovePath"](old_path,new_path);}}catch(e){err("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}FS.hashRemoveNode(old_node);try{old_dir.node_ops.rename(old_node,new_dir,new_name);}catch(e){throw e}finally{FS.hashAddNode(old_node);}try{if(FS.trackingDelegate["onMovePath"])FS.trackingDelegate["onMovePath"](old_path,new_path);}catch(e){err("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: "+e.message);}},rmdir:function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,true);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.rmdir){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.rmdir(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}},readdir:function(path){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;if(!node.node_ops.readdir){throw new FS.ErrnoError(54)}return node.node_ops.readdir(node)},unlink:function(path){var lookup=FS.lookupPath(path,{parent:true});var parent=lookup.node;var name=PATH.basename(path);var node=FS.lookupNode(parent,name);var errCode=FS.mayDelete(parent,name,false);if(errCode){throw new FS.ErrnoError(errCode)}if(!parent.node_ops.unlink){throw new FS.ErrnoError(63)}if(FS.isMountpoint(node)){throw new FS.ErrnoError(10)}try{if(FS.trackingDelegate["willDeletePath"]){FS.trackingDelegate["willDeletePath"](path);}}catch(e){err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: "+e.message);}parent.node_ops.unlink(parent,name);FS.destroyNode(node);try{if(FS.trackingDelegate["onDeletePath"])FS.trackingDelegate["onDeletePath"](path);}catch(e){err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: "+e.message);}},readlink:function(path){var lookup=FS.lookupPath(path);var link=lookup.node;if(!link){throw new FS.ErrnoError(44)}if(!link.node_ops.readlink){throw new FS.ErrnoError(28)}return PATH_FS.resolve(FS.getPath(link.parent),link.node_ops.readlink(link))},stat:function(path,dontFollow){var lookup=FS.lookupPath(path,{follow:!dontFollow});var node=lookup.node;if(!node){throw new FS.ErrnoError(44)}if(!node.node_ops.getattr){throw new FS.ErrnoError(63)}return node.node_ops.getattr(node)},lstat:function(path){return FS.stat(path,true)},chmod:function(path,mode,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(63)}node.node_ops.setattr(node,{mode:mode&4095|node.mode&~4095,timestamp:Date.now()});},lchmod:function(path,mode){FS.chmod(path,mode,true);},fchmod:function(fd,mode){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}FS.chmod(stream.node,mode);},chown:function(path,uid,gid,dontFollow){var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:!dontFollow});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(63)}node.node_ops.setattr(node,{timestamp:Date.now()});},lchown:function(path,uid,gid){FS.chown(path,uid,gid,true);},fchown:function(fd,uid,gid){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}FS.chown(stream.node,uid,gid);},truncate:function(path,len){if(len<0){throw new FS.ErrnoError(28)}var node;if(typeof path==="string"){var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;}else {node=path;}if(!node.node_ops.setattr){throw new FS.ErrnoError(63)}if(FS.isDir(node.mode)){throw new FS.ErrnoError(31)}if(!FS.isFile(node.mode)){throw new FS.ErrnoError(28)}var errCode=FS.nodePermissions(node,"w");if(errCode){throw new FS.ErrnoError(errCode)}node.node_ops.setattr(node,{size:len,timestamp:Date.now()});},ftruncate:function(fd,len){var stream=FS.getStream(fd);if(!stream){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(28)}FS.truncate(stream.node,len);},utime:function(path,atime,mtime){var lookup=FS.lookupPath(path,{follow:true});var node=lookup.node;node.node_ops.setattr(node,{timestamp:Math.max(atime,mtime)});},open:function(path,flags,mode,fd_start,fd_end){if(path===""){throw new FS.ErrnoError(44)}flags=typeof flags==="string"?FS.modeStringToFlags(flags):flags;mode=typeof mode==="undefined"?438:mode;if(flags&64){mode=mode&4095|32768;}else {mode=0;}var node;if(typeof path==="object"){node=path;}else {path=PATH.normalize(path);try{var lookup=FS.lookupPath(path,{follow:!(flags&131072)});node=lookup.node;}catch(e){}}var created=false;if(flags&64){if(node){if(flags&128){throw new FS.ErrnoError(20)}}else {node=FS.mknod(path,mode,0);created=true;}}if(!node){throw new FS.ErrnoError(44)}if(FS.isChrdev(node.mode)){flags&=~512;}if(flags&65536&&!FS.isDir(node.mode)){throw new FS.ErrnoError(54)}if(!created){var errCode=FS.mayOpen(node,flags);if(errCode){throw new FS.ErrnoError(errCode)}}if(flags&512){FS.truncate(node,0);}flags&=~(128|512|131072);var stream=FS.createStream({node:node,path:FS.getPath(node),flags:flags,seekable:true,position:0,stream_ops:node.stream_ops,ungotten:[],error:false},fd_start,fd_end);if(stream.stream_ops.open){stream.stream_ops.open(stream);}if(Module["logReadFiles"]&&!(flags&1)){if(!FS.readFiles)FS.readFiles={};if(!(path in FS.readFiles)){FS.readFiles[path]=1;err("FS.trackingDelegate error on read file: "+path);}}try{if(FS.trackingDelegate["onOpenFile"]){var trackingFlags=0;if((flags&2097155)!==1){trackingFlags|=FS.tracking.openFlags.READ;}if((flags&2097155)!==0){trackingFlags|=FS.tracking.openFlags.WRITE;}FS.trackingDelegate["onOpenFile"](path,trackingFlags);}}catch(e){err("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: "+e.message);}return stream},close:function(stream){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(stream.getdents)stream.getdents=null;try{if(stream.stream_ops.close){stream.stream_ops.close(stream);}}catch(e){throw e}finally{FS.closeStream(stream.fd);}stream.fd=null;},isClosed:function(stream){return stream.fd===null},llseek:function(stream,offset,whence){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(!stream.seekable||!stream.stream_ops.llseek){throw new FS.ErrnoError(70)}if(whence!=0&&whence!=1&&whence!=2){throw new FS.ErrnoError(28)}stream.position=stream.stream_ops.llseek(stream,offset,whence);stream.ungotten=[];return stream.position},read:function(stream,buffer,offset,length,position){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.read){throw new FS.ErrnoError(28)}var seeking=typeof position!=="undefined";if(!seeking){position=stream.position;}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesRead=stream.stream_ops.read(stream,buffer,offset,length,position);if(!seeking)stream.position+=bytesRead;return bytesRead},write:function(stream,buffer,offset,length,position,canOwn){if(length<0||position<0){throw new FS.ErrnoError(28)}if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(FS.isDir(stream.node.mode)){throw new FS.ErrnoError(31)}if(!stream.stream_ops.write){throw new FS.ErrnoError(28)}if(stream.seekable&&stream.flags&1024){FS.llseek(stream,0,2);}var seeking=typeof position!=="undefined";if(!seeking){position=stream.position;}else if(!stream.seekable){throw new FS.ErrnoError(70)}var bytesWritten=stream.stream_ops.write(stream,buffer,offset,length,position,canOwn);if(!seeking)stream.position+=bytesWritten;try{if(stream.path&&FS.trackingDelegate["onWriteToFile"])FS.trackingDelegate["onWriteToFile"](stream.path);}catch(e){err("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: "+e.message);}return bytesWritten},allocate:function(stream,offset,length){if(FS.isClosed(stream)){throw new FS.ErrnoError(8)}if(offset<0||length<=0){throw new FS.ErrnoError(28)}if((stream.flags&2097155)===0){throw new FS.ErrnoError(8)}if(!FS.isFile(stream.node.mode)&&!FS.isDir(stream.node.mode)){throw new FS.ErrnoError(43)}if(!stream.stream_ops.allocate){throw new FS.ErrnoError(138)}stream.stream_ops.allocate(stream,offset,length);},mmap:function(stream,address,length,position,prot,flags){if((prot&2)!==0&&(flags&2)===0&&(stream.flags&2097155)!==2){throw new FS.ErrnoError(2)}if((stream.flags&2097155)===1){throw new FS.ErrnoError(2)}if(!stream.stream_ops.mmap){throw new FS.ErrnoError(43)}return stream.stream_ops.mmap(stream,address,length,position,prot,flags)},msync:function(stream,buffer,offset,length,mmapFlags){if(!stream||!stream.stream_ops.msync){return 0}return stream.stream_ops.msync(stream,buffer,offset,length,mmapFlags)},munmap:function(stream){return 0},ioctl:function(stream,cmd,arg){if(!stream.stream_ops.ioctl){throw new FS.ErrnoError(59)}return stream.stream_ops.ioctl(stream,cmd,arg)},readFile:function(path,opts){opts=opts||{};opts.flags=opts.flags||0;opts.encoding=opts.encoding||"binary";if(opts.encoding!=="utf8"&&opts.encoding!=="binary"){throw new Error('Invalid encoding type "'+opts.encoding+'"')}var ret;var stream=FS.open(path,opts.flags);var stat=FS.stat(path);var length=stat.size;var buf=new Uint8Array(length);FS.read(stream,buf,0,length,0);if(opts.encoding==="utf8"){ret=UTF8ArrayToString(buf,0);}else if(opts.encoding==="binary"){ret=buf;}FS.close(stream);return ret},writeFile:function(path,data,opts){opts=opts||{};opts.flags=opts.flags||577;var stream=FS.open(path,opts.flags,opts.mode);if(typeof data==="string"){var buf=new Uint8Array(lengthBytesUTF8(data)+1);var actualNumBytes=stringToUTF8Array(data,buf,0,buf.length);FS.write(stream,buf,0,actualNumBytes,undefined,opts.canOwn);}else if(ArrayBuffer.isView(data)){FS.write(stream,data,0,data.byteLength,undefined,opts.canOwn);}else {throw new Error("Unsupported data type")}FS.close(stream);},cwd:function(){return FS.currentPath},chdir:function(path){var lookup=FS.lookupPath(path,{follow:true});if(lookup.node===null){throw new FS.ErrnoError(44)}if(!FS.isDir(lookup.node.mode)){throw new FS.ErrnoError(54)}var errCode=FS.nodePermissions(lookup.node,"x");if(errCode){throw new FS.ErrnoError(errCode)}FS.currentPath=lookup.path;},createDefaultDirectories:function(){FS.mkdir("/tmp");FS.mkdir("/home");FS.mkdir("/home/web_user");},createDefaultDevices:function(){FS.mkdir("/dev");FS.registerDevice(FS.makedev(1,3),{read:function(){return 0},write:function(stream,buffer,offset,length,pos){return length}});FS.mkdev("/dev/null",FS.makedev(1,3));TTY.register(FS.makedev(5,0),TTY.default_tty_ops);TTY.register(FS.makedev(6,0),TTY.default_tty1_ops);FS.mkdev("/dev/tty",FS.makedev(5,0));FS.mkdev("/dev/tty1",FS.makedev(6,0));var random_device=getRandomDevice();FS.createDevice("/dev","random",random_device);FS.createDevice("/dev","urandom",random_device);FS.mkdir("/dev/shm");FS.mkdir("/dev/shm/tmp");},createSpecialDirectories:function(){FS.mkdir("/proc");FS.mkdir("/proc/self");FS.mkdir("/proc/self/fd");FS.mount({mount:function(){var node=FS.createNode("/proc/self","fd",16384|511,73);node.node_ops={lookup:function(parent,name){var fd=+name;var stream=FS.getStream(fd);if(!stream)throw new FS.ErrnoError(8);var ret={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:function(){return stream.path}}};ret.parent=ret;return ret}};return node}},{},"/proc/self/fd");},createStandardStreams:function(){if(Module["stdin"]){FS.createDevice("/dev","stdin",Module["stdin"]);}else {FS.symlink("/dev/tty","/dev/stdin");}if(Module["stdout"]){FS.createDevice("/dev","stdout",null,Module["stdout"]);}else {FS.symlink("/dev/tty","/dev/stdout");}if(Module["stderr"]){FS.createDevice("/dev","stderr",null,Module["stderr"]);}else {FS.symlink("/dev/tty1","/dev/stderr");}var stdin=FS.open("/dev/stdin",0);var stdout=FS.open("/dev/stdout",1);var stderr=FS.open("/dev/stderr",1);},ensureErrnoError:function(){if(FS.ErrnoError)return;FS.ErrnoError=function ErrnoError(errno,node){this.node=node;this.setErrno=function(errno){this.errno=errno;};this.setErrno(errno);this.message="FS error";};FS.ErrnoError.prototype=new Error;FS.ErrnoError.prototype.constructor=FS.ErrnoError;[44].forEach(function(code){FS.genericErrors[code]=new FS.ErrnoError(code);FS.genericErrors[code].stack="<generic error, no stack>";});},staticInit:function(){FS.ensureErrnoError();FS.nameTable=new Array(4096);FS.mount(MEMFS,{},"/");FS.createDefaultDirectories();FS.createDefaultDevices();FS.createSpecialDirectories();FS.filesystems={"MEMFS":MEMFS};},init:function(input,output,error){FS.init.initialized=true;FS.ensureErrnoError();Module["stdin"]=input||Module["stdin"];Module["stdout"]=output||Module["stdout"];Module["stderr"]=error||Module["stderr"];FS.createStandardStreams();},quit:function(){FS.init.initialized=false;var fflush=Module["_fflush"];if(fflush)fflush(0);for(var i=0;i<FS.streams.length;i++){var stream=FS.streams[i];if(!stream){continue}FS.close(stream);}},getMode:function(canRead,canWrite){var mode=0;if(canRead)mode|=292|73;if(canWrite)mode|=146;return mode},findObject:function(path,dontResolveLastLink){var ret=FS.analyzePath(path,dontResolveLastLink);if(ret.exists){return ret.object}else {return null}},analyzePath:function(path,dontResolveLastLink){try{var lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});path=lookup.path;}catch(e){}var ret={isRoot:false,exists:false,error:0,name:null,path:null,object:null,parentExists:false,parentPath:null,parentObject:null};try{var lookup=FS.lookupPath(path,{parent:true});ret.parentExists=true;ret.parentPath=lookup.path;ret.parentObject=lookup.node;ret.name=PATH.basename(path);lookup=FS.lookupPath(path,{follow:!dontResolveLastLink});ret.exists=true;ret.path=lookup.path;ret.object=lookup.node;ret.name=lookup.node.name;ret.isRoot=lookup.path==="/";}catch(e){ret.error=e.errno;}return ret},createPath:function(parent,path,canRead,canWrite){parent=typeof parent==="string"?parent:FS.getPath(parent);var parts=path.split("/").reverse();while(parts.length){var part=parts.pop();if(!part)continue;var current=PATH.join2(parent,part);try{FS.mkdir(current);}catch(e){}parent=current;}return current},createFile:function(parent,name,properties,canRead,canWrite){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(canRead,canWrite);return FS.create(path,mode)},createDataFile:function(parent,name,data,canRead,canWrite,canOwn){var path=name?PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name):parent;var mode=FS.getMode(canRead,canWrite);var node=FS.create(path,mode);if(data){if(typeof data==="string"){var arr=new Array(data.length);for(var i=0,len=data.length;i<len;++i)arr[i]=data.charCodeAt(i);data=arr;}FS.chmod(node,mode|146);var stream=FS.open(node,577);FS.write(stream,data,0,data.length,0,canOwn);FS.close(stream);FS.chmod(node,mode);}return node},createDevice:function(parent,name,input,output){var path=PATH.join2(typeof parent==="string"?parent:FS.getPath(parent),name);var mode=FS.getMode(!!input,!!output);if(!FS.createDevice.major)FS.createDevice.major=64;var dev=FS.makedev(FS.createDevice.major++,0);FS.registerDevice(dev,{open:function(stream){stream.seekable=false;},close:function(stream){if(output&&output.buffer&&output.buffer.length){output(10);}},read:function(stream,buffer,offset,length,pos){var bytesRead=0;for(var i=0;i<length;i++){var result;try{result=input();}catch(e){throw new FS.ErrnoError(29)}if(result===undefined&&bytesRead===0){throw new FS.ErrnoError(6)}if(result===null||result===undefined)break;bytesRead++;buffer[offset+i]=result;}if(bytesRead){stream.node.timestamp=Date.now();}return bytesRead},write:function(stream,buffer,offset,length,pos){for(var i=0;i<length;i++){try{output(buffer[offset+i]);}catch(e){throw new FS.ErrnoError(29)}}if(length){stream.node.timestamp=Date.now();}return i}});return FS.mkdev(path,mode,dev)},forceLoadFile:function(obj){if(obj.isDevice||obj.isFolder||obj.link||obj.contents)return true;if(typeof XMLHttpRequest!=="undefined"){throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")}else if(read_){try{obj.contents=intArrayFromString(read_(obj.url),true);obj.usedBytes=obj.contents.length;}catch(e){throw new FS.ErrnoError(29)}}else {throw new Error("Cannot load without read() or XMLHttpRequest.")}},createLazyFile:function(parent,name,url,canRead,canWrite){function LazyUint8Array(){this.lengthKnown=false;this.chunks=[];}LazyUint8Array.prototype.get=function LazyUint8Array_get(idx){if(idx>this.length-1||idx<0){return undefined}var chunkOffset=idx%this.chunkSize;var chunkNum=idx/this.chunkSize|0;return this.getter(chunkNum)[chunkOffset]};LazyUint8Array.prototype.setDataGetter=function LazyUint8Array_setDataGetter(getter){this.getter=getter;};LazyUint8Array.prototype.cacheLength=function LazyUint8Array_cacheLength(){var xhr=new XMLHttpRequest;xhr.open("HEAD",url,false);xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);var datalength=Number(xhr.getResponseHeader("Content-length"));var header;var hasByteServing=(header=xhr.getResponseHeader("Accept-Ranges"))&&header==="bytes";var usesGzip=(header=xhr.getResponseHeader("Content-Encoding"))&&header==="gzip";var chunkSize=1024*1024;if(!hasByteServing)chunkSize=datalength;var doXHR=function(from,to){if(from>to)throw new Error("invalid range ("+from+", "+to+") or no bytes requested!");if(to>datalength-1)throw new Error("only "+datalength+" bytes available! programmer error!");var xhr=new XMLHttpRequest;xhr.open("GET",url,false);if(datalength!==chunkSize)xhr.setRequestHeader("Range","bytes="+from+"-"+to);if(typeof Uint8Array!="undefined")xhr.responseType="arraybuffer";if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined");}xhr.send(null);if(!(xhr.status>=200&&xhr.status<300||xhr.status===304))throw new Error("Couldn't load "+url+". Status: "+xhr.status);if(xhr.response!==undefined){return new Uint8Array(xhr.response||[])}else {return intArrayFromString(xhr.responseText||"",true)}};var lazyArray=this;lazyArray.setDataGetter(function(chunkNum){var start=chunkNum*chunkSize;var end=(chunkNum+1)*chunkSize-1;end=Math.min(end,datalength-1);if(typeof lazyArray.chunks[chunkNum]==="undefined"){lazyArray.chunks[chunkNum]=doXHR(start,end);}if(typeof lazyArray.chunks[chunkNum]==="undefined")throw new Error("doXHR failed!");return lazyArray.chunks[chunkNum]});if(usesGzip||!datalength){chunkSize=datalength=1;datalength=this.getter(0).length;chunkSize=datalength;out("LazyFiles on gzip forces download of the whole file when length is accessed");}this._length=datalength;this._chunkSize=chunkSize;this.lengthKnown=true;};if(typeof XMLHttpRequest!=="undefined"){throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var lazyArray=new LazyUint8Array;var properties={isDevice:false,contents:lazyArray};}else {var properties={isDevice:false,url:url};}var node=FS.createFile(parent,name,properties,canRead,canWrite);if(properties.contents){node.contents=properties.contents;}else if(properties.url){node.contents=null;node.url=properties.url;}Object.defineProperties(node,{usedBytes:{get:function(){return this.contents.length}}});var stream_ops={};var keys=Object.keys(node.stream_ops);keys.forEach(function(key){var fn=node.stream_ops[key];stream_ops[key]=function forceLoadLazyFile(){FS.forceLoadFile(node);return fn.apply(null,arguments)};});stream_ops.read=function stream_ops_read(stream,buffer,offset,length,position){FS.forceLoadFile(node);var contents=stream.node.contents;if(position>=contents.length)return 0;var size=Math.min(contents.length-position,length);if(contents.slice){for(var i=0;i<size;i++){buffer[offset+i]=contents[position+i];}}else {for(var i=0;i<size;i++){buffer[offset+i]=contents.get(position+i);}}return size};node.stream_ops=stream_ops;return node},createPreloadedFile:function(parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish){Browser.init();var fullname=name?PATH_FS.resolve(PATH.join2(parent,name)):parent;function processData(byteArray){function finish(byteArray){if(preFinish)preFinish();if(!dontCreateFile){FS.createDataFile(parent,name,byteArray,canRead,canWrite,canOwn);}if(onload)onload();removeRunDependency();}var handled=false;Module["preloadPlugins"].forEach(function(plugin){if(handled)return;if(plugin["canHandle"](fullname)){plugin["handle"](byteArray,fullname,finish,function(){if(onerror)onerror();removeRunDependency();});handled=true;}});if(!handled)finish(byteArray);}addRunDependency();if(typeof url=="string"){Browser.asyncLoad(url,function(byteArray){processData(byteArray);},onerror);}else {processData(url);}},indexedDB:function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB},DB_NAME:function(){return "EM_FS_"+window.location.pathname},DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths,onload,onerror){onload=onload||function(){};onerror=onerror||function(){};var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=function openRequest_onupgradeneeded(){out("creating db");var db=openRequest.result;db.createObjectStore(FS.DB_STORE_NAME);};openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;var transaction=db.transaction([FS.DB_STORE_NAME],"readwrite");var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach(function(path){var putRequest=files.put(FS.analyzePath(path).object.contents,path);putRequest.onsuccess=function putRequest_onsuccess(){ok++;if(ok+fail==total)finish();};putRequest.onerror=function putRequest_onerror(){fail++;if(ok+fail==total)finish();};});transaction.onerror=onerror;};openRequest.onerror=onerror;},loadFilesFromDB:function(paths,onload,onerror){onload=onload||function(){};onerror=onerror||function(){};var indexedDB=FS.indexedDB();try{var openRequest=indexedDB.open(FS.DB_NAME(),FS.DB_VERSION);}catch(e){return onerror(e)}openRequest.onupgradeneeded=onerror;openRequest.onsuccess=function openRequest_onsuccess(){var db=openRequest.result;try{var transaction=db.transaction([FS.DB_STORE_NAME],"readonly");}catch(e){onerror(e);return}var files=transaction.objectStore(FS.DB_STORE_NAME);var ok=0,fail=0,total=paths.length;function finish(){if(fail==0)onload();else onerror();}paths.forEach(function(path){var getRequest=files.get(path);getRequest.onsuccess=function getRequest_onsuccess(){if(FS.analyzePath(path).exists){FS.unlink(path);}FS.createDataFile(PATH.dirname(path),PATH.basename(path),getRequest.result,true,true,true);ok++;if(ok+fail==total)finish();};getRequest.onerror=function getRequest_onerror(){fail++;if(ok+fail==total)finish();};});transaction.onerror=onerror;};openRequest.onerror=onerror;}};var SYSCALLS={mappings:{},DEFAULT_POLLMASK:5,umask:511,calculateAt:function(dirfd,path){if(path[0]!=="/"){var dir;if(dirfd===-100){dir=FS.cwd();}else {var dirstream=FS.getStream(dirfd);if(!dirstream)throw new FS.ErrnoError(8);dir=dirstream.path;}path=PATH.join2(dir,path);}return path},doStat:function(func,path,buf){try{var stat=func(path);}catch(e){if(e&&e.node&&PATH.normalize(path)!==PATH.normalize(FS.getPath(e.node))){return -54}throw e}HEAP32[buf>>2]=stat.dev;HEAP32[buf+4>>2]=0;HEAP32[buf+8>>2]=stat.ino;HEAP32[buf+12>>2]=stat.mode;HEAP32[buf+16>>2]=stat.nlink;HEAP32[buf+20>>2]=stat.uid;HEAP32[buf+24>>2]=stat.gid;HEAP32[buf+28>>2]=stat.rdev;HEAP32[buf+32>>2]=0;tempI64=[stat.size>>>0,(tempDouble=stat.size,+Math.abs(tempDouble)>=1?tempDouble>0?(Math.min(+Math.floor(tempDouble/4294967296),4294967295)|0)>>>0:~~+Math.ceil((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)],HEAP32[buf+40>>2]=tempI64[0],HEAP32[buf+44>>2]=tempI64[1];HEAP32[buf+48>>2]=4096;HEAP32[buf+52>>2]=stat.blocks;HEAP32[buf+56>>2]=stat.atime.getTime()/1e3|0;HEAP32[buf+60>>2]=0;HEAP32[buf+64>>2]=stat.mtime.getTime()/1e3|0;HEAP32[buf+68>>2]=0;HEAP32[buf+72>>2]=stat.ctime.getTime()/1e3|0;HEAP32[buf+76>>2]=0;tempI64=[stat.ino>>>0,(tempDouble=stat.ino,+Math.abs(tempDouble)>=1?tempDouble>0?(Math.min(+Math.floor(tempDouble/4294967296),4294967295)|0)>>>0:~~+Math.ceil((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)],HEAP32[buf+80>>2]=tempI64[0],HEAP32[buf+84>>2]=tempI64[1];return 0},doMsync:function(addr,stream,len,flags,offset){var buffer=HEAPU8.slice(addr,addr+len);FS.msync(stream,buffer,offset,len,flags);},doMkdir:function(path,mode){path=PATH.normalize(path);if(path[path.length-1]==="/")path=path.substr(0,path.length-1);FS.mkdir(path,mode,0);return 0},doMknod:function(path,mode,dev){switch(mode&61440){case 32768:case 8192:case 24576:case 4096:case 49152:break;default:return -28}FS.mknod(path,mode,dev);return 0},doReadlink:function(path,buf,bufsize){if(bufsize<=0)return -28;var ret=FS.readlink(path);var len=Math.min(bufsize,lengthBytesUTF8(ret));var endChar=HEAP8[buf+len];stringToUTF8(ret,buf,bufsize+1);HEAP8[buf+len]=endChar;return len},doAccess:function(path,amode){if(amode&~7){return -28}var node;var lookup=FS.lookupPath(path,{follow:true});node=lookup.node;if(!node){return -44}var perms="";if(amode&4)perms+="r";if(amode&2)perms+="w";if(amode&1)perms+="x";if(perms&&FS.nodePermissions(node,perms)){return -2}return 0},doDup:function(path,flags,suggestFD){var suggest=FS.getStream(suggestFD);if(suggest)FS.close(suggest);return FS.open(path,flags,0,suggestFD,suggestFD).fd},doReadv:function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.read(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;if(curr<len)break}return ret},doWritev:function(stream,iov,iovcnt,offset){var ret=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];var curr=FS.write(stream,HEAP8,ptr,len,offset);if(curr<0)return -1;ret+=curr;}return ret},varargs:undefined,get:function(){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret},getStr:function(ptr){var ret=UTF8ToString(ptr);return ret},getStreamFromFD:function(fd){var stream=FS.getStream(fd);if(!stream)throw new FS.ErrnoError(8);return stream},get64:function(low,high){return low}};function ___sys_access(path,amode){try{path=SYSCALLS.getStr(path);return SYSCALLS.doAccess(path,amode)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___sys_fcntl64(fd,cmd,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(cmd){case 0:{var arg=SYSCALLS.get();if(arg<0){return -28}var newStream;newStream=FS.open(stream.path,stream.flags,0,arg);return newStream.fd}case 1:case 2:return 0;case 3:return stream.flags;case 4:{var arg=SYSCALLS.get();stream.flags|=arg;return 0}case 12:{var arg=SYSCALLS.get();var offset=0;HEAP16[arg+offset>>1]=2;return 0}case 13:case 14:return 0;case 16:case 8:return -28;case 9:setErrNo(28);return -1;default:{return -28}}}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___sys_fstat64(fd,buf){try{var stream=SYSCALLS.getStreamFromFD(fd);return SYSCALLS.doStat(FS.stat,stream.path,buf)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___sys_getpid(){return 42}function ___sys_ioctl(fd,op,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(fd);switch(op){case 21509:case 21505:{if(!stream.tty)return -59;return 0}case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:{if(!stream.tty)return -59;return 0}case 21519:{if(!stream.tty)return -59;var argp=SYSCALLS.get();HEAP32[argp>>2]=0;return 0}case 21520:{if(!stream.tty)return -59;return -28}case 21531:{var argp=SYSCALLS.get();return FS.ioctl(stream,op,argp)}case 21523:{if(!stream.tty)return -59;return 0}case 21524:{if(!stream.tty)return -59;return 0}default:abort("bad ioctl syscall "+op);}}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function syscallMmap2(addr,len,prot,flags,fd,off){off<<=12;var ptr;var allocated=false;if((flags&16)!==0&&addr%16384!==0){return -28}if((flags&32)!==0){ptr=_memalign(16384,len);if(!ptr)return -48;_memset(ptr,0,len);allocated=true;}else {var info=FS.getStream(fd);if(!info)return -8;var res=FS.mmap(info,addr,len,off,prot,flags);ptr=res.ptr;allocated=res.allocated;}SYSCALLS.mappings[ptr]={malloc:ptr,len:len,allocated:allocated,fd:fd,prot:prot,flags:flags,offset:off};return ptr}function ___sys_mmap2(addr,len,prot,flags,fd,off){try{return syscallMmap2(addr,len,prot,flags,fd,off)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function syscallMunmap(addr,len){if((addr|0)===-1||len===0){return -28}var info=SYSCALLS.mappings[addr];if(!info)return 0;if(len===info.len){var stream=FS.getStream(info.fd);if(info.prot&2){SYSCALLS.doMsync(addr,stream,len,info.flags,info.offset);}FS.munmap(stream);SYSCALLS.mappings[addr]=null;if(info.allocated){_free(info.malloc);}}return 0}function ___sys_munmap(addr,len){try{return syscallMunmap(addr,len)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___sys_open(path,flags,varargs){SYSCALLS.varargs=varargs;try{var pathname=SYSCALLS.getStr(path);var mode=varargs?SYSCALLS.get():0;var stream=FS.open(pathname,flags,mode);return stream.fd}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___sys_stat64(path,buf){try{path=SYSCALLS.getStr(path);return SYSCALLS.doStat(FS.stat,path,buf)}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function ___sys_unlink(path){try{path=SYSCALLS.getStr(path);FS.unlink(path);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return -e.errno}}function _abort(){abort();}function _emscripten_asm_const_int(code,sigPtr,argbuf){var args=readAsmConstArgs(sigPtr,argbuf);return ASM_CONSTS[code].apply(null,args)}function _longjmp(env,value){_setThrew(env,value||1);throw "longjmp"}function _emscripten_longjmp(a0,a1){return _longjmp(a0,a1)}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest,src,src+num);}function _emscripten_get_heap_size(){return HEAPU8.length}function emscripten_realloc_buffer(size){try{wasmMemory.grow(size-buffer.byteLength+65535>>>16);updateGlobalBufferAndViews(wasmMemory.buffer);return 1}catch(e){}}function _emscripten_resize_heap(requestedSize){requestedSize=requestedSize>>>0;var oldSize=_emscripten_get_heap_size();var maxHeapSize=2147483648;if(requestedSize>maxHeapSize){return false}var minHeapSize=16777216;for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(minHeapSize,requestedSize,overGrownHeapSize),65536));var replacement=emscripten_realloc_buffer(newSize);if(replacement){return true}}return false}var ENV={};function getExecutableName(){return thisProgram||"./this.program"}function getEnvStrings(){if(!getEnvStrings.strings){var lang=(typeof navigator==="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){env[x]=ENV[x];}var strings=[];for(var x in env){strings.push(x+"="+env[x]);}getEnvStrings.strings=strings;}return getEnvStrings.strings}function _environ_get(__environ,environ_buf){try{var bufSize=0;getEnvStrings().forEach(function(string,i){var ptr=environ_buf+bufSize;HEAP32[__environ+i*4>>2]=ptr;writeAsciiToMemory(string,ptr);bufSize+=string.length+1;});return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _environ_sizes_get(penviron_count,penviron_buf_size){try{var strings=getEnvStrings();HEAP32[penviron_count>>2]=strings.length;var bufSize=0;strings.forEach(function(string){bufSize+=string.length+1;});HEAP32[penviron_buf_size>>2]=bufSize;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _exit(status){exit(status);}function _fd_close(fd){try{var stream=SYSCALLS.getStreamFromFD(fd);FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_fdstat_get(fd,pbuf){try{var stream=SYSCALLS.getStreamFromFD(fd);var type=stream.tty?2:FS.isDir(stream.mode)?3:FS.isLink(stream.mode)?7:4;HEAP8[pbuf>>0]=type;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_read(fd,iov,iovcnt,pnum){try{var stream=SYSCALLS.getStreamFromFD(fd);var num=SYSCALLS.doReadv(stream,iov,iovcnt);HEAP32[pnum>>2]=num;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_seek(fd,offset_low,offset_high,whence,newOffset){try{var stream=SYSCALLS.getStreamFromFD(fd);var HIGH_OFFSET=4294967296;var offset=offset_high*HIGH_OFFSET+(offset_low>>>0);var DOUBLE_LIMIT=9007199254740992;if(offset<=-DOUBLE_LIMIT||offset>=DOUBLE_LIMIT){return -61}FS.llseek(stream,offset,whence);tempI64=[stream.position>>>0,(tempDouble=stream.position,+Math.abs(tempDouble)>=1?tempDouble>0?(Math.min(+Math.floor(tempDouble/4294967296),4294967295)|0)>>>0:~~+Math.ceil((tempDouble-+(~~tempDouble>>>0))/4294967296)>>>0:0)],HEAP32[newOffset>>2]=tempI64[0],HEAP32[newOffset+4>>2]=tempI64[1];if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _fd_write(fd,iov,iovcnt,pnum){try{var stream=SYSCALLS.getStreamFromFD(fd);var num=SYSCALLS.doWritev(stream,iov,iovcnt);HEAP32[pnum>>2]=num;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return e.errno}}function _getTempRet0(){return getTempRet0()|0}function _gettimeofday(ptr){var now=Date.now();HEAP32[ptr>>2]=now/1e3|0;HEAP32[ptr+4>>2]=now%1e3*1e3|0;return 0}function _setTempRet0($i){setTempRet0($i|0);}function __isLeapYear(year){return year%4===0&&(year%100!==0||year%400===0)}function __arraySum(array,index){var sum=0;for(var i=0;i<=index;sum+=array[i++]){}return sum}var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date,days){var newDate=new Date(date.getTime());while(days>0){var leap=__isLeapYear(newDate.getFullYear());var currentMonth=newDate.getMonth();var daysInCurrentMonth=(leap?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR)[currentMonth];if(days>daysInCurrentMonth-newDate.getDate()){days-=daysInCurrentMonth-newDate.getDate()+1;newDate.setDate(1);if(currentMonth<11){newDate.setMonth(currentMonth+1);}else {newDate.setMonth(0);newDate.setFullYear(newDate.getFullYear()+1);}}else {newDate.setDate(newDate.getDate()+days);return newDate}}return newDate}function _strftime(s,maxsize,format,tm){var tm_zone=HEAP32[tm+40>>2];var date={tm_sec:HEAP32[tm>>2],tm_min:HEAP32[tm+4>>2],tm_hour:HEAP32[tm+8>>2],tm_mday:HEAP32[tm+12>>2],tm_mon:HEAP32[tm+16>>2],tm_year:HEAP32[tm+20>>2],tm_wday:HEAP32[tm+24>>2],tm_yday:HEAP32[tm+28>>2],tm_isdst:HEAP32[tm+32>>2],tm_gmtoff:HEAP32[tm+36>>2],tm_zone:tm_zone?UTF8ToString(tm_zone):""};var pattern=UTF8ToString(format);var EXPANSION_RULES_1={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var rule in EXPANSION_RULES_1){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_1[rule]);}var WEEKDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];function leadingSomething(value,digits,character){var str=typeof value==="number"?value.toString():value||"";while(str.length<digits){str=character[0]+str;}return str}function leadingNulls(value,digits){return leadingSomething(value,digits,"0")}function compareByDay(date1,date2){function sgn(value){return value<0?-1:value>0?1:0}var compare;if((compare=sgn(date1.getFullYear()-date2.getFullYear()))===0){if((compare=sgn(date1.getMonth()-date2.getMonth()))===0){compare=sgn(date1.getDate()-date2.getDate());}}return compare}function getFirstWeekStartDate(janFourth){switch(janFourth.getDay()){case 0:return new Date(janFourth.getFullYear()-1,11,29);case 1:return janFourth;case 2:return new Date(janFourth.getFullYear(),0,3);case 3:return new Date(janFourth.getFullYear(),0,2);case 4:return new Date(janFourth.getFullYear(),0,1);case 5:return new Date(janFourth.getFullYear()-1,11,31);case 6:return new Date(janFourth.getFullYear()-1,11,30)}}function getWeekBasedYear(date){var thisDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);var janFourthThisYear=new Date(thisDate.getFullYear(),0,4);var janFourthNextYear=new Date(thisDate.getFullYear()+1,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);if(compareByDay(firstWeekStartThisYear,thisDate)<=0){if(compareByDay(firstWeekStartNextYear,thisDate)<=0){return thisDate.getFullYear()+1}else {return thisDate.getFullYear()}}else {return thisDate.getFullYear()-1}}var EXPANSION_RULES_2={"%a":function(date){return WEEKDAYS[date.tm_wday].substring(0,3)},"%A":function(date){return WEEKDAYS[date.tm_wday]},"%b":function(date){return MONTHS[date.tm_mon].substring(0,3)},"%B":function(date){return MONTHS[date.tm_mon]},"%C":function(date){var year=date.tm_year+1900;return leadingNulls(year/100|0,2)},"%d":function(date){return leadingNulls(date.tm_mday,2)},"%e":function(date){return leadingSomething(date.tm_mday,2," ")},"%g":function(date){return getWeekBasedYear(date).toString().substring(2)},"%G":function(date){return getWeekBasedYear(date)},"%H":function(date){return leadingNulls(date.tm_hour,2)},"%I":function(date){var twelveHour=date.tm_hour;if(twelveHour==0)twelveHour=12;else if(twelveHour>12)twelveHour-=12;return leadingNulls(twelveHour,2)},"%j":function(date){return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900)?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,date.tm_mon-1),3)},"%m":function(date){return leadingNulls(date.tm_mon+1,2)},"%M":function(date){return leadingNulls(date.tm_min,2)},"%n":function(){return "\n"},"%p":function(date){if(date.tm_hour>=0&&date.tm_hour<12){return "AM"}else {return "PM"}},"%S":function(date){return leadingNulls(date.tm_sec,2)},"%t":function(){return "\t"},"%u":function(date){return date.tm_wday||7},"%U":function(date){var janFirst=new Date(date.tm_year+1900,0,1);var firstSunday=janFirst.getDay()===0?janFirst:__addDays(janFirst,7-janFirst.getDay());var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstSunday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstSundayUntilEndJanuary=31-firstSunday.getDate();var days=firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstSunday,janFirst)===0?"01":"00"},"%V":function(date){var janFourthThisYear=new Date(date.tm_year+1900,0,4);var janFourthNextYear=new Date(date.tm_year+1901,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);var endDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);if(compareByDay(endDate,firstWeekStartThisYear)<0){return "53"}if(compareByDay(firstWeekStartNextYear,endDate)<=0){return "01"}var daysDifference;if(firstWeekStartThisYear.getFullYear()<date.tm_year+1900){daysDifference=date.tm_yday+32-firstWeekStartThisYear.getDate();}else {daysDifference=date.tm_yday+1-firstWeekStartThisYear.getDate();}return leadingNulls(Math.ceil(daysDifference/7),2)},"%w":function(date){return date.tm_wday},"%W":function(date){var janFirst=new Date(date.tm_year,0,1);var firstMonday=janFirst.getDay()===1?janFirst:__addDays(janFirst,janFirst.getDay()===0?1:7-janFirst.getDay()+1);var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstMonday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstMondayUntilEndJanuary=31-firstMonday.getDate();var days=firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstMonday,janFirst)===0?"01":"00"},"%y":function(date){return (date.tm_year+1900).toString().substring(2)},"%Y":function(date){return date.tm_year+1900},"%z":function(date){var off=date.tm_gmtoff;var ahead=off>=0;off=Math.abs(off)/60;off=off/60*100+off%60;return (ahead?"+":"-")+String("0000"+off).slice(-4)},"%Z":function(date){return date.tm_zone},"%%":function(){return "%"}};for(var rule in EXPANSION_RULES_2){if(pattern.indexOf(rule)>=0){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_2[rule](date));}}var bytes=intArrayFromString(pattern,false);if(bytes.length>maxsize){return 0}writeArrayToMemory(bytes,s);return bytes.length-1}function _strftime_l(s,maxsize,format,tm){return _strftime(s,maxsize,format,tm)}function _time(ptr){var ret=Date.now()/1e3|0;if(ptr){HEAP32[ptr>>2]=ret;}return ret}function _times(buffer){if(buffer!==0){_memset(buffer,0,16);}return 0}var readAsmConstArgsArray=[];function readAsmConstArgs(sigPtr,buf){readAsmConstArgsArray.length=0;var ch;buf>>=2;while(ch=HEAPU8[sigPtr++]){var double=ch<105;if(double&&buf&1)buf++;readAsmConstArgsArray.push(double?HEAPF64[buf++>>1]:HEAP32[buf]);++buf;}return readAsmConstArgsArray}var FSNode=function(parent,name,mode,rdev){if(!parent){parent=this;}this.parent=parent;this.mount=parent.mount;this.mounted=null;this.id=FS.nextInode++;this.name=name;this.mode=mode;this.node_ops={};this.stream_ops={};this.rdev=rdev;};var readMode=292|73;var writeMode=146;Object.defineProperties(FSNode.prototype,{read:{get:function(){return (this.mode&readMode)===readMode},set:function(val){val?this.mode|=readMode:this.mode&=~readMode;}},write:{get:function(){return (this.mode&writeMode)===writeMode},set:function(val){val?this.mode|=writeMode:this.mode&=~writeMode;}},isFolder:{get:function(){return FS.isDir(this.mode)}},isDevice:{get:function(){return FS.isChrdev(this.mode)}}});FS.FSNode=FSNode;FS.staticInit();function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}__ATINIT__.push({func:function(){___wasm_call_ctors();}});var asmLibraryArg={"F":___clock_gettime,"h":___cxa_allocate_exception,"g":___cxa_throw,"K":___sys_access,"s":___sys_fcntl64,"M":___sys_fstat64,"l":___sys_getpid,"H":___sys_ioctl,"I":___sys_mmap2,"J":___sys_munmap,"t":___sys_open,"L":___sys_stat64,"E":___sys_unlink,"q":_abort,"Q":_emscripten_asm_const_int,"c":_emscripten_longjmp,"y":_emscripten_memcpy_big,"z":_emscripten_resize_heap,"C":_environ_get,"D":_environ_sizes_get,"e":_exit,"k":_fd_close,"B":_fd_fdstat_get,"G":_fd_read,"x":_fd_seek,"r":_fd_write,"a":_getTempRet0,"P":_gettimeofday,"N":invoke_di,"w":invoke_i,"j":invoke_ii,"d":invoke_iii,"i":invoke_iiii,"O":invoke_iiiiiii,"f":invoke_vi,"p":invoke_vii,"o":invoke_viii,"n":invoke_viiii,"m":invoke_viiiii,"b":_setTempRet0,"A":_strftime_l,"v":_time,"u":_times};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return (___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["T"]).apply(null,arguments)};var ___em_js__array_bounds_check_error=Module["___em_js__array_bounds_check_error"]=function(){return (___em_js__array_bounds_check_error=Module["___em_js__array_bounds_check_error"]=Module["asm"]["U"]).apply(null,arguments)};var _emscripten_bind_VoidPtr___destroy___0=Module["_emscripten_bind_VoidPtr___destroy___0"]=function(){return (_emscripten_bind_VoidPtr___destroy___0=Module["_emscripten_bind_VoidPtr___destroy___0"]=Module["asm"]["V"]).apply(null,arguments)};var _emscripten_bind_Main_layout_3=Module["_emscripten_bind_Main_layout_3"]=function(){return (_emscripten_bind_Main_layout_3=Module["_emscripten_bind_Main_layout_3"]=Module["asm"]["W"]).apply(null,arguments)};var _emscripten_bind_Main_lastError_0=Module["_emscripten_bind_Main_lastError_0"]=function(){return (_emscripten_bind_Main_lastError_0=Module["_emscripten_bind_Main_lastError_0"]=Module["asm"]["X"]).apply(null,arguments)};var _emscripten_bind_Main_createFile_2=Module["_emscripten_bind_Main_createFile_2"]=function(){return (_emscripten_bind_Main_createFile_2=Module["_emscripten_bind_Main_createFile_2"]=Module["asm"]["Y"]).apply(null,arguments)};var _emscripten_bind_Main_setYInvert_1=Module["_emscripten_bind_Main_setYInvert_1"]=function(){return (_emscripten_bind_Main_setYInvert_1=Module["_emscripten_bind_Main_setYInvert_1"]=Module["asm"]["Z"]).apply(null,arguments)};var _emscripten_bind_Main_setNop_1=Module["_emscripten_bind_Main_setNop_1"]=function(){return (_emscripten_bind_Main_setNop_1=Module["_emscripten_bind_Main_setNop_1"]=Module["asm"]["_"]).apply(null,arguments)};var _emscripten_bind_Main___destroy___0=Module["_emscripten_bind_Main___destroy___0"]=function(){return (_emscripten_bind_Main___destroy___0=Module["_emscripten_bind_Main___destroy___0"]=Module["asm"]["$"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return (_malloc=Module["_malloc"]=Module["asm"]["aa"]).apply(null,arguments)};var _free=Module["_free"]=function(){return (_free=Module["_free"]=Module["asm"]["ba"]).apply(null,arguments)};var ___errno_location=Module["___errno_location"]=function(){return (___errno_location=Module["___errno_location"]=Module["asm"]["ca"]).apply(null,arguments)};var _memset=Module["_memset"]=function(){return (_memset=Module["_memset"]=Module["asm"]["da"]).apply(null,arguments)};var stackSave=Module["stackSave"]=function(){return (stackSave=Module["stackSave"]=Module["asm"]["ea"]).apply(null,arguments)};var stackRestore=Module["stackRestore"]=function(){return (stackRestore=Module["stackRestore"]=Module["asm"]["fa"]).apply(null,arguments)};var _setThrew=Module["_setThrew"]=function(){return (_setThrew=Module["_setThrew"]=Module["asm"]["ga"]).apply(null,arguments)};var _memalign=Module["_memalign"]=function(){return (_memalign=Module["_memalign"]=Module["asm"]["ha"]).apply(null,arguments)};function invoke_ii(index,a1){var sp=stackSave();try{return wasmTable.get(index)(a1)}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_iii(index,a1,a2){var sp=stackSave();try{return wasmTable.get(index)(a1,a2)}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_i(index){var sp=stackSave();try{return wasmTable.get(index)()}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_iiii(index,a1,a2,a3){var sp=stackSave();try{return wasmTable.get(index)(a1,a2,a3)}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_vii(index,a1,a2){var sp=stackSave();try{wasmTable.get(index)(a1,a2);}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_viii(index,a1,a2,a3){var sp=stackSave();try{wasmTable.get(index)(a1,a2,a3);}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_viiii(index,a1,a2,a3,a4){var sp=stackSave();try{wasmTable.get(index)(a1,a2,a3,a4);}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_vi(index,a1){var sp=stackSave();try{wasmTable.get(index)(a1);}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_viiiii(index,a1,a2,a3,a4,a5){var sp=stackSave();try{wasmTable.get(index)(a1,a2,a3,a4,a5);}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6){var sp=stackSave();try{return wasmTable.get(index)(a1,a2,a3,a4,a5,a6)}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}function invoke_di(index,a1){var sp=stackSave();try{return wasmTable.get(index)(a1)}catch(e){stackRestore(sp);if(e!==e+0&&e!=="longjmp")throw e;_setThrew(1,0);}}var calledRun;function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status;}dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller;};function run(args){if(runDependencies>0){return}preRun();if(runDependencies>0)return;function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();readyPromiseResolve(Module);if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("");},1);doRun();},1);}else {doRun();}}Module["run"]=run;function exit(status,implicit){if(implicit&&noExitRuntime&&status===0){return}if(noExitRuntime);else {if(Module["onExit"])Module["onExit"](status);ABORT=true;}quit_(status,new ExitStatus(status));}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}noExitRuntime=true;run();function WrapperObject(){}WrapperObject.prototype=Object.create(WrapperObject.prototype);WrapperObject.prototype.constructor=WrapperObject;WrapperObject.prototype.__class__=WrapperObject;WrapperObject.__cache__={};Module["WrapperObject"]=WrapperObject;function getCache(__class__){return (__class__||WrapperObject).__cache__}Module["getCache"]=getCache;function wrapPointer(ptr,__class__){var cache=getCache(__class__);var ret=cache[ptr];if(ret)return ret;ret=Object.create((__class__||WrapperObject).prototype);ret.ptr=ptr;return cache[ptr]=ret}Module["wrapPointer"]=wrapPointer;function castObject(obj,__class__){return wrapPointer(obj.ptr,__class__)}Module["castObject"]=castObject;Module["NULL"]=wrapPointer(0);function destroy(obj){if(!obj["__destroy__"])throw "Error: Cannot destroy object. (Did you create it yourself?)";obj["__destroy__"]();delete getCache(obj.__class__)[obj.ptr];}Module["destroy"]=destroy;function compare(obj1,obj2){return obj1.ptr===obj2.ptr}Module["compare"]=compare;function getPointer(obj){return obj.ptr}Module["getPointer"]=getPointer;function getClass(obj){return obj.__class__}Module["getClass"]=getClass;var ensureCache={buffer:0,size:0,pos:0,temps:[],needed:0,prepare:function(){if(ensureCache.needed){for(var i=0;i<ensureCache.temps.length;i++){Module["_free"](ensureCache.temps[i]);}ensureCache.temps.length=0;Module["_free"](ensureCache.buffer);ensureCache.buffer=0;ensureCache.size+=ensureCache.needed;ensureCache.needed=0;}if(!ensureCache.buffer){ensureCache.size+=128;ensureCache.buffer=Module["_malloc"](ensureCache.size);assert(ensureCache.buffer);}ensureCache.pos=0;},alloc:function(array,view){assert(ensureCache.buffer);var bytes=view.BYTES_PER_ELEMENT;var len=array.length*bytes;len=len+7&-8;var ret;if(ensureCache.pos+len>=ensureCache.size){assert(len>0);ensureCache.needed+=len;ret=Module["_malloc"](len);ensureCache.temps.push(ret);}else {ret=ensureCache.buffer+ensureCache.pos;ensureCache.pos+=len;}return ret},copy:function(array,view,offset){offset>>>=0;var bytes=view.BYTES_PER_ELEMENT;switch(bytes){case 2:offset>>>=1;break;case 4:offset>>>=2;break;case 8:offset>>>=3;break}for(var i=0;i<array.length;i++){view[offset+i]=array[i];}}};function ensureString(value){if(typeof value==="string"){var intArray=intArrayFromString(value);var offset=ensureCache.alloc(intArray,HEAP8);ensureCache.copy(intArray,HEAP8,offset);return offset}return value}function VoidPtr(){throw "cannot construct a VoidPtr, no constructor in IDL"}VoidPtr.prototype=Object.create(WrapperObject.prototype);VoidPtr.prototype.constructor=VoidPtr;VoidPtr.prototype.__class__=VoidPtr;VoidPtr.__cache__={};Module["VoidPtr"]=VoidPtr;VoidPtr.prototype["__destroy__"]=VoidPtr.prototype.__destroy__=function(){var self=this.ptr;_emscripten_bind_VoidPtr___destroy___0(self);};function Main(){throw "cannot construct a Main, no constructor in IDL"}Main.prototype=Object.create(WrapperObject.prototype);Main.prototype.constructor=Main;Main.prototype.__class__=Main;Main.__cache__={};Module["Main"]=Main;Main.prototype["layout"]=Main.prototype.layout=function(dot,format,engine){var self=this.ptr;ensureCache.prepare();if(dot&&typeof dot==="object")dot=dot.ptr;else dot=ensureString(dot);if(format&&typeof format==="object")format=format.ptr;else format=ensureString(format);if(engine&&typeof engine==="object")engine=engine.ptr;else engine=ensureString(engine);return UTF8ToString(_emscripten_bind_Main_layout_3(self,dot,format,engine))};Main.prototype["lastError"]=Main.prototype.lastError=function(){var self=this.ptr;return UTF8ToString(_emscripten_bind_Main_lastError_0(self))};Main.prototype["createFile"]=Main.prototype.createFile=function(file,data){var self=this.ptr;ensureCache.prepare();if(file&&typeof file==="object")file=file.ptr;else file=ensureString(file);if(data&&typeof data==="object")data=data.ptr;else data=ensureString(data);_emscripten_bind_Main_createFile_2(self,file,data);};Main.prototype["setYInvert"]=Main.prototype.setYInvert=function(yInvert){var self=this.ptr;if(yInvert&&typeof yInvert==="object")yInvert=yInvert.ptr;_emscripten_bind_Main_setYInvert_1(self,yInvert);};Main.prototype["setNop"]=Main.prototype.setNop=function(nop){var self=this.ptr;if(nop&&typeof nop==="object")nop=nop.ptr;_emscripten_bind_Main_setNop_1(self,nop);};Main.prototype["__destroy__"]=Main.prototype.__destroy__=function(){var self=this.ptr;_emscripten_bind_Main___destroy___0(self);};


	  return cpp.ready
	}
	);
	})();
	module.exports = cpp;
	});

	var graphvizlib$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), graphvizlib, {
		'default': graphvizlib
	}));

	var __assign = (undefined && undefined.__assign) || function () {
	    __assign = Object.assign || function(t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	                t[p] = s[p];
	        }
	        return t;
	    };
	    return __assign.apply(this, arguments);
	};
	var __spreadArrays = (undefined && undefined.__spreadArrays) || function () {
	    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
	    for (var r = Array(s), k = 0, i = 0; i < il; i++)
	        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
	            r[k] = a[j];
	    return r;
	};
	function imageToFile(image) {
	    return {
	        path: image.path,
	        data: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg width=\"" + image.width + "\" height=\"" + image.height + "\"></svg>"
	    };
	}
	function imagesToFiles(images) {
	    return images.map(imageToFile);
	}
	function createFiles(wasm, _ext) {
	    var ext = __assign({ images: [], files: [] }, _ext);
	    __spreadArrays(ext.files, imagesToFiles(ext.images)).forEach(function (file) { return wasm.Main.prototype.createFile(file.path, file.data); });
	}
	var graphviz = {
	    layout: function (dotSource, outputFormat, layoutEngine, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        if (layoutEngine === void 0) { layoutEngine = "dot"; }
	        if (!dotSource)
	            return Promise.resolve("");
	        return loadWasm(graphvizlib$1, ext === null || ext === void 0 ? void 0 : ext.wasmFolder, ext === null || ext === void 0 ? void 0 : ext.wasmBinary).then(function (wasm) {
	            createFiles(wasm, ext);
	            wasm.Main.prototype.setYInvert((ext === null || ext === void 0 ? void 0 : ext.yInvert) ? 1 : 0);
	            wasm.Main.prototype.setNop((ext === null || ext === void 0 ? void 0 : ext.nop) ? ext === null || ext === void 0 ? void 0 : ext.nop : 0);
	            var retVal = wasm.Main.prototype.layout(dotSource, outputFormat, layoutEngine);
	            if (!retVal) {
	                throw new Error(wasm.Main.prototype.lastError());
	            }
	            return retVal;
	        });
	    },
	    circo: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "circo", ext);
	    },
	    dot: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "dot", ext);
	    },
	    fdp: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "fdp", ext);
	    },
	    sfdp: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "sfdp", ext);
	    },
	    neato: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "neato", ext);
	    },
	    osage: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "osage", ext);
	    },
	    patchwork: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "patchwork", ext);
	    },
	    twopi: function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "twopi", ext);
	    }
	};
	var GraphvizSync = /** @class */ (function () {
	    function GraphvizSync(_wasm) {
	        this._wasm = _wasm;
	    }
	    GraphvizSync.prototype.layout = function (dotSource, outputFormat, layoutEngine, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        if (layoutEngine === void 0) { layoutEngine = "dot"; }
	        if (!dotSource)
	            return "";
	        createFiles(this._wasm, ext);
	        this._wasm.Main.prototype.setYInvert((ext === null || ext === void 0 ? void 0 : ext.yInvert) ? 1 : 0);
	        this._wasm.Main.prototype.setNop((ext === null || ext === void 0 ? void 0 : ext.nop) ? ext === null || ext === void 0 ? void 0 : ext.nop : 0);
	        var retVal = this._wasm.Main.prototype.layout(dotSource, outputFormat, layoutEngine);
	        if (!retVal) {
	            throw new Error(this._wasm.Main.prototype.lastError());
	        }
	        return retVal;
	    };
	    GraphvizSync.prototype.circo = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "circo", ext);
	    };
	    GraphvizSync.prototype.dot = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "dot", ext);
	    };
	    GraphvizSync.prototype.fdp = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "fdp", ext);
	    };
	    GraphvizSync.prototype.sfdp = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "sfdp", ext);
	    };
	    GraphvizSync.prototype.neato = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "neato", ext);
	    };
	    GraphvizSync.prototype.osage = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "osage", ext);
	    };
	    GraphvizSync.prototype.patchwork = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "patchwork", ext);
	    };
	    GraphvizSync.prototype.twopi = function (dotSource, outputFormat, ext) {
	        if (outputFormat === void 0) { outputFormat = "svg"; }
	        return this.layout(dotSource, outputFormat, "twopi", ext);
	    };
	    return GraphvizSync;
	}());
	function graphvizSync(wasmFolder, wasmBinary) {
	    return loadWasm(graphvizlib$1, wasmFolder, wasmBinary).then(function (wasm) { return new GraphvizSync(wasm); });
	}

	var dot = "\ndigraph G {\n    node [shape=rect];\n\n    subgraph cluster_0 {\n        style=filled;\n        color=lightgrey;\n        node [style=filled,color=white];\n        a0 -> a1 -> a2 -> a3;\n        label = \"process #1\";\n    }\n\n    subgraph cluster_1 {\n        node [style=filled];\n        b0 -> b1 -> b2 -> b3;\n        label = \"process #2\";\n        color=blue\n    }\n\n    start -> a0;\n    start -> b0;\n    a1 -> b3;\n    b2 -> a3;\n    a3 -> a0;\n    a3 -> end;\n    b3 -> end;\n\n    start [shape=Mdiamond];\n    end [shape=Msquare];\n}\n";
	var badDot = "\ndigraph G {\n    node [shape=rect];\n\n    subgraph cluster_0 {\n        style=filled;\n        color=lightgrey;\n        node [style=filled,color=white];\n        a0 -> a1 -> a2 -> a3;\n        label = \"process #1\";\n    ]\n\n    subgraph cluster_1 {\n        node [style=filled];\n        b0 -> b1 -> b2 -> b3;\n        label = \"process #2\";\n        color=blue\n    }\n\n    start -> a0;\n    start -> b0;\n    a1 -> b3;\n    b2 -> a3;\n    a3 -> a0;\n    a3 -> end;\n    b3 -> end;\n\n    start [shape=Mdiamond];\n    end [shape=Msquare];\n}\n";
	describe("graphviz", function () {
	    it("circo", function () {
	        return graphviz.circo(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("dot", function () {
	        return graphviz.dot(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("blank-dot", function () {
	        return graphviz.dot("", "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("fdp", function () {
	        return graphviz.fdp(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("sfdp", function () {
	        return graphviz.sfdp(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("neato", function () {
	        return graphviz.neato(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("osage", function () {
	        return graphviz.osage(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("patchwork", function () {
	        return graphviz.patchwork(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	    it("twopi", function () {
	        return graphviz.twopi(dot, "svg").then(function (svg) {
	            chai$1.expect(svg).to.be.a("string");
	            chai$1.expect(svg).to.not.be.empty;
	        }).catch(function (e) {
	            chai$1.expect(true).to.be.false;
	        });
	    });
	});
	describe("graphvizSync", function () {
	    var gvSync;
	    it("create", function () {
	        return graphvizSync().then(function (gv) {
	            gvSync = gv;
	            chai$1.expect(gvSync).to.exist;
	        });
	    });
	    it("circo", function () {
	        var svg = gvSync.circo(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	    it("dot", function () {
	        var svg = gvSync.dot(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	    it("dot-blank", function () {
	        var svg = gvSync.dot("", "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.be.empty;
	    });
	    it("fdp", function () {
	        var svg = gvSync.fdp(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	    it("sfdp", function () {
	        var svg = gvSync.sfdp(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	        var svg2 = gvSync.fdp(dot, "svg");
	        chai$1.expect(svg).to.not.equal(svg2);
	    });
	    it("neato", function () {
	        var svg = gvSync.neato(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	    it("osage", function () {
	        var svg = gvSync.osage(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	    it("patchwork", function () {
	        var svg = gvSync.patchwork(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	    it("twopi", function () {
	        var svg = gvSync.twopi(dot, "svg");
	        chai$1.expect(svg).to.be.a("string");
	        chai$1.expect(svg).to.not.be.empty;
	    });
	});
	describe("bad dot", function () {
	    it("dot", function () {
	        return graphviz.dot(badDot, "svg").then(function (svg) {
	            chai$1.expect(true).to.be.false;
	        }).catch(function (e) {
	            chai$1.expect(typeof e.message).to.equal("string");
	            chai$1.expect(e.message).to.equal("syntax error in line 11 near ']'\n");
	        });
	    });
	    var gvSync;
	    it("create", function () {
	        return graphvizSync().then(function (gv) {
	            gvSync = gv;
	            chai$1.expect(gvSync).to.exist;
	        });
	    });
	    it("dotSync", function () {
	        var success;
	        try {
	            var svg = gvSync.dot(badDot, "svg");
	            success = true;
	        }
	        catch (e) {
	            success = false;
	            chai$1.expect(typeof e.message).to.equal("string");
	            chai$1.expect(e.message).to.not.be.empty;
	        }
	        chai$1.expect(success).to.be.false;
	    });
	});
	describe("yInvert", function () {
	    var gvSync;
	    it("create", function () {
	        return graphvizSync().then(function (gv) {
	            gvSync = gv;
	            chai$1.expect(gvSync).to.exist;
	        });
	    });
	    it("compare", function () {
	        var plain1 = gvSync.dot(dot, "plain");
	        var plain2 = gvSync.dot(dot, "plain", { yInvert: false });
	        var plain3 = gvSync.dot(dot, "plain", { yInvert: true });
	        chai$1.expect(plain1).to.equal(plain2);
	        chai$1.expect(plain1).to.not.equal(plain3);
	    });
	});
	describe("wasmFolder", function () {
	    it("default", function () {
	        chai$1.expect(globalThis.__hpcc_wasmFolder).to.be.undefined;
	        chai$1.expect(wasmFolder()).to.be.undefined;
	    });
	    it("wasmFolder", function () {
	        var mol = "42";
	        chai$1.expect(globalThis.__hpcc_wasmFolder).to.be.undefined;
	        chai$1.expect(wasmFolder(mol)).to.be.undefined;
	        chai$1.expect(wasmFolder()).to.equal(mol);
	        chai$1.expect(globalThis.__hpcc_wasmFolder).to.be.undefined;
	        chai$1.expect(wasmFolder(undefined)).to.equal(mol);
	        chai$1.expect(wasmFolder()).to.be.undefined;
	        chai$1.expect(globalThis.__hpcc_wasmFolder).to.be.undefined;
	    });
	});

})));
//# sourceMappingURL=test.js.map
