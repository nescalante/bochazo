(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

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

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
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

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
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

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],6:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":4,"./encode":5}],7:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jade=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return (Array.isArray(val) ? val.map(joinClasses) :
    (val && typeof val === 'object') ? Object.keys(val).filter(function (key) { return val[key]; }) :
    [val]).filter(nulls).join(' ');
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};


exports.style = function (val) {
  if (val && typeof val === 'object') {
    return Object.keys(val).map(function (style) {
      return style + ':' + val[style];
    }).join(';');
  } else {
    return val;
  }
};
/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if (key === 'style') {
    val = exports.style(val);
  }
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    if (JSON.stringify(val).indexOf('&') !== -1) {
      console.warn('Since Jade 2.0.0, ampersands (`&`) in data attributes ' +
                   'will be escaped to `&amp;`');
    };
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will eliminate the double quotes around dates in ' +
                   'ISO form after 2.0.0');
    }
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  var result = String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":2}],2:[function(require,module,exports){

},{}]},{},[1])(1)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"fs":1}],8:[function(require,module,exports){
(function (global){
'use strict';

var raf = require('raf');
var clone = require('./clone');
var emitter = require('./emitter');
var fetcher = require('./fetcher');
var prefetcher = require('./prefetcher');
var view = require('./view');
var router = require('./router');
var state = require('./state');
var document = require('./global/document');
var location = require('./global/location');
var history = require('./global/history');
var versioning = require('../versioning');

function modern () { // `history.modern = false` used in tests
  return history && history.modern !== false;
}

function go (url, options) {
  var o = options || {};
  var direction = o.replaceState ? 'replaceState' : 'pushState';
  var context = o.context || null;
  var route = router(url);
  if (!route) {
    if (o.strict !== true) {
      global.DEBUG && global.DEBUG('[activator] redirecting to %s', url);
      location.href = url;
    }
    return;
  }

  global.DEBUG && global.DEBUG('[activator] route matches %s', route.route);

  var same = router.equals(route, state.route);
  if (same && o.force !== true) {
    if (route.parts.hash) {
      global.DEBUG && global.DEBUG('[activator] same route and hash, updating scroll position');
      scrollInto(id(route.parts.hash), o.scroll);
      navigation(route, state.model, direction);
      return; // anchor hash-navigation on same page ignores router
    }
    global.DEBUG && global.DEBUG('[activator] same route, resolving');
    resolved(state.model);
    return;
  }

  global.DEBUG && global.DEBUG('[activator] not same route as before');

  if (!modern()) {
    global.DEBUG && global.DEBUG('[activator] not modern, redirecting to %s', url);
    location.href = url;
    return;
  }

  global.DEBUG && global.DEBUG('[activator] fetching %s', route.url);
  prefetcher.abortIntent();
  fetcher.abortPending();
  fetcher(route, { element: context, source: 'intent' }, maybeResolved);

  function maybeResolved (err, data) {
    if (err) {
      return;
    }
    if (data.version !== state.version) {
      global.DEBUG && global.DEBUG('[activator] version change (is "%s", was "%s"), redirecting to %s', data.version, state.version, url);
      location.href = url; // version change demands fallback to strict navigation
      return;
    }
    resolved(data.model);
  }

  function resolved (model) {
    navigation(route, model, direction);
    view(state.container, null, model, route);
    scrollInto(id(route.parts.hash), o.scroll);
  }
}

function start (data) {
  if (data.version !== state.version) {
    global.DEBUG && global.DEBUG('[activator] version change, reloading browser');
    location.reload(); // version may change between Taunus loading and a model becoming available
    return;
  }
  var model = data.model;
  var route = getRouteAndReplaceHistory(model);
  emitter.emit('start', state.container, model, route);
  global.DEBUG && global.DEBUG('[activator] started, executing client-side controller');
  view(state.container, null, model, route, { render: false });
  global.onpopstate = back;
}

function back (e) {
  var empty = !(e && e.state && e.state.model);
  if (empty) {
    return;
  }
  global.DEBUG && global.DEBUG('[activator] backwards history navigation with state', e.state);
  var model = e.state.model;
  var route = getRouteAndReplaceHistory(model);
  view(state.container, null, model, route);
  scrollInto(id(route.parts.hash));
}

function scrollInto (id, enabled) {
  if (enabled === false) {
    return;
  }
  global.DEBUG && global.DEBUG('[activator] scrolling into "%s"', id || '#document');

  var elem = id && document.getElementById(id) || document.documentElement;
  if (elem && elem.scrollIntoView) {
    raf(scrollSoon);
  }

  function scrollSoon () {
    elem.scrollIntoView();
  }
}

function id (hash) {
  return orEmpty(hash).substr(1);
}

function getRouteAndReplaceHistory (model) {
  var url = location.pathname;
  var query = orEmpty(location.search) + orEmpty(location.hash);
  var route = router(url + query);
  navigation(route, model, 'replaceState');
  return route;
}

function orEmpty (value) {
  return value || '';
}

function navigation (route, model, direction) {
  global.DEBUG && global.DEBUG('[activator] pushing %s into history', route.url);
  state.route = route;
  state.model = clone(model);
  if (model.title) {
    document.title = model.title;
  }
  if (modern() && history[direction]) {
    history[direction]({ model: model }, model.title, route.url);
  }
}

module.exports = {
  start: start,
  go: go
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../versioning":55,"./clone":11,"./emitter":14,"./fetcher":16,"./global/document":17,"./global/history":18,"./global/location":19,"./prefetcher":27,"./router":28,"./state":29,"./view":37,"raf":44}],9:[function(require,module,exports){
'use strict';

var clone = require('./clone');
var once = require('./once');
var state = require('./state');
var raw = require('./stores/raw');
var idb = require('./stores/idb');
var versioning = require('../versioning');
var stores = [raw, idb];

function get (type, key, done) {
  var i = 0;

  function next () {
    var gotOnce = once(got);
    var store = stores[i++];
    if (store) {
      store.get(type, key, gotOnce);
      setTimeout(gotOnce, store === idb ? 35 : 5); // at worst, spend 40ms on caching layers
    } else {
      done(true);
    }

    function got (err, item) {
      if (err) {
        next();
      } else if (valid(item)) {
        done(false, blob(item)); // always return a unique copy
      } else {
        next();
      }
    }

    function valid (item) {
      if (!item) {
        return false; // cache must have item
      }
      var mismatch = typeof item.version !== 'string' || item.version !== state.version;
      if (mismatch) {
        return false; // cache must match current version
      }
      var stale = typeof item.expires !== 'number' || Date.now() >= item.expires;
      if (stale) {
        return false; // cache must be fresh
      }
      return true;
    }

    function blob (item) {
      var singular = type.substr(0, type.length - 1);
      var data = clone(item.data);
      var response = {
        version: item.version
      };
      response[singular] = data;
      return response;
    }
  }

  next();
}

function set (type, key, data, duration) {
  if (duration < 1) { // sanity
    return;
  }
  var cloned = clone(data); // freeze a copy for our records
  stores.forEach(store);
  function store (s) {
    s.set(type, key, {
      data: cloned,
      version: state.version,
      expires: Date.now() + duration
    });
  }
}

module.exports = {
  get: get,
  set: set
};

},{"../versioning":55,"./clone":11,"./once":26,"./state":29,"./stores/idb":31,"./stores/raw":32}],10:[function(require,module,exports){
(function (global){
'use strict';

var cache = require('./cache');
var idb = require('./stores/idb');
var state = require('./state');
var emitter = require('./emitter');
var interceptor = require('./interceptor');
var defaults = 15;
var baseline;

function e (value) {
  return value || '';
}

function setup (duration, route) {
  baseline = parseDuration(duration);
  if (baseline < 1) {
    state.cache = false;
    return;
  }
  interceptor.add(intercept);
  emitter.on('fetch.done', persist);
  state.cache = true;
}

function intercept (e) {
  global.DEBUG && global.DEBUG('[cache] attempting to intercept %s', e.route.url);
  cache.get('models', e.route.parts.path, result);

  function result (err, data) {
    global.DEBUG && global.DEBUG('[cache] interception for %s %s', e.route.url, err || !data ? 'failed' : 'succeeded');
    if (!err && data) {
      e.preventDefault(data);
    }
  }
}

function parseDuration (value) {
  if (value === true) {
    return baseline || defaults;
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
}

function persist (route, context, data) {
  if (!state.cache) {
    return;
  }
  if (route.cache === false) {
    return;
  }
  var d = baseline;
  if (typeof route.cache === 'number') {
    d = route.cache;
  }
  var target = context.hijacker || route.action;
  var freshness = parseDuration(d) * 1000;
  if ('model' in data) {
    global.DEBUG && global.DEBUG('[cache] saving model for %s', route.parts.path);
    cache.set('models', route.parts.path, data.model, freshness);
  }
  if ('template' in data) {
    global.DEBUG && global.DEBUG('[cache] saving template for %s', target);
    cache.set('templates', target, data.template, Infinity);
  }
  if ('controller' in data) {
    global.DEBUG && global.DEBUG('[cache] saving controller for %s', target);
    cache.set('controllers', target, data.controller, Infinity);
  }
}

function ready (fn) {
  if (state.cache) {
    idb.tested(fn); // wait on idb compatibility tests
  } else {
    fn(false); // caching is a no-op
  }
}

module.exports = {
  setup: setup,
  persist: persist,
  ready: ready
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cache":9,"./emitter":14,"./interceptor":22,"./state":29,"./stores/idb":31}],11:[function(require,module,exports){
'use strict';

function clone (value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = clone;

},{}],12:[function(require,module,exports){
(function (global){
'use strict';

var state = require('./state');
var caching = require('./caching');
var unstrictEval = require('./unstrictEval');
var idb = require('./stores/idb');
var deferred = require('../lib/deferred');

function set (action, data) {
  store('template');
  store('controller');

  function store (key) {
    var type = key + 's';

    if (key in data) {
      push(type, action, data[key], data.version);
    }
  }
}

function refill () {
  caching.ready(pullComponents);
}

function pullComponents (enabled) {
  if (!enabled) { // bail if caching is turned off
    return;
  }
  idb.get('controllers', pull.bind(null, 'controllers'));
  idb.get('templates', pull.bind(null, 'templates'));
}

function pull (type, err, items) {
  if (err) {
    return;
  }
  items.forEach(pullItem);

  function pullItem (item) {
    push(type, item.key, item.data, item.version);
  }
}

function push (type, action, value, version) {
  var singular = type.substr(0, type.length - 1);
  var is = deferred(action, state.deferrals);
  if (is === false) {
    global.DEBUG && global.DEBUG('[componentCache] action "%s" is not deferred, not storing %s', action, singular);
    return;
  }
  if (version === state.version) {
    global.DEBUG && global.DEBUG('[componentCache] storing %s for %s in state', singular, action);
    state[type][action] = {
      fn: parse(singular, value),
      version: version
    };
  } else {
    global.DEBUG && global.DEBUG('[componentCache] bad version: %s !== %s', version, state.version);
  }
}

function parse (type, value) {
  if (value) {
    try {
      return unstrictEval(value);
    } catch (e) {
      global.DEBUG && global.DEBUG('[componentCache] %s eval failed', type, e);
    }
  }
}

module.exports = {
  set: set,
  refill: refill
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/deferred":39,"./caching":10,"./state":29,"./stores/idb":31,"./unstrictEval":36}],13:[function(require,module,exports){
(function (global){
'use strict';

var state = require('./state');
var deferred = require('../lib/deferred');

function needs (action) {
  var demands = [];
  var is = deferred(action, state.deferrals);
  if (is) {
    if (invalid('templates')) {
      demands.push('template');
    }
    if (invalid('controllers')) {
      demands.push('controller');
    }
  }

  function invalid (type) {
    var store = state[type];
    var fail = !store[action] || store[action].version !== state.version;
    if (fail) {
      global.DEBUG && global.DEBUG('[deferral] deferred %s %s not found', action, type.substr(0, type.length - 1));
      return true;
    }
    return false;
  }

  return demands;
}

module.exports = {
  needs: needs
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/deferred":39,"./state":29}],14:[function(require,module,exports){
'use strict';

var emitter = require('contra.emitter');

module.exports = emitter({}, { throws: false });

},{"contra.emitter":41}],15:[function(require,module,exports){
(function (global){
'use strict';

function add (element, type, fn) {
  if (element.addEventListener) {
    element.addEventListener(type, fn);
  } else if (element.attachEvent) {
    element.attachEvent('on' + type, wrapperFactory(element, fn));
  } else {
    element['on' + type] = fn;
  }
}

function wrapperFactory (element, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault  = e.preventDefault  || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    fn.call(element, e);
  };
}

module.exports = {
  add: add
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
(function (global){
'use strict';

var xhr = require('./xhr');
var state = require('./state');
var router = require('./router');
var emitter = require('./emitter');
var deferral = require('./deferral');
var interceptor = require('./interceptor');
var componentCache = require('./componentCache');
var lastXhr = {};

function e (value) {
  return value || '';
}

function negotiate (route, context) {
  var parts = route.parts;
  var qs = e(parts.search);
  var p = qs ? '&' : '?';
  var target = context.hijacker || route.action;
  var demands = ['json'].concat(deferral.needs(target));
  if (context.hijacker && context.hijacker !== route.action) {
    demands.push('hijacker=' + context.hijacker);
  }
  return parts.pathname + qs + p + demands.join('&');
}

function abort (source) {
  if (lastXhr[source]) {
    lastXhr[source].abort();
  }
}

function abortPending () {
  Object.keys(lastXhr).forEach(abort);
  lastXhr = {};
}

function fetcher (route, context, done) {
  var url = route.url;
  if (lastXhr[context.source]) {
    lastXhr[context.source].abort();
    lastXhr[context.source] = null;
  }

  global.DEBUG && global.DEBUG('[fetcher] requested %s', route.url);

  interceptor.execute(route, afterInterceptors);

  function afterInterceptors (err, result) {
    if (!err && result.defaultPrevented && !context.hijacker) {
      global.DEBUG && global.DEBUG('[fetcher] prevented %s with data', route.url, result.data);
      done(null, result.data);
    } else {
      emitter.emit('fetch.start', route, context);
      lastXhr[context.source] = xhr(negotiate(route, context), notify);
    }
  }

  function notify (err, data, res) {
    if (err) {
      global.DEBUG && global.DEBUG('[fetcher] failed for %s', route.url);
      if (err.message === 'aborted') {
        emitter.emit('fetch.abort', route, context);
      } else {
        emitter.emit('fetch.error', route, context, err);
      }
    } else {
      global.DEBUG && global.DEBUG('[fetcher] succeeded for %s', route.url);
      if (data && data.version) {
        state.version = data.version; // sync version expectation with server-side
        componentCache.set(router(res.url).parts.query.hijacker || route.action, data);
      }
      emitter.emit('fetch.done', route, context, data);
    }
    done(err, data);
  }
}

fetcher.abortPending = abortPending;

module.exports = fetcher;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./componentCache":12,"./deferral":13,"./emitter":14,"./interceptor":22,"./router":28,"./state":29,"./xhr":38}],17:[function(require,module,exports){
(function (global){
'use strict';

module.exports = global.document;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
(function (global){
'use strict';

var modern = 'history' in global && 'pushState' in global.history;
var api = modern && global.history;

// Google Chrome 38 on iOS makes weird changes to history.replaceState, breaking it
var nativeFn = require('../nativeFn');
var nativeReplaceBroken = modern && !nativeFn(api.replaceState);
if (nativeReplaceBroken) {
  api = {
    pushState: api.pushState.bind(api)
  };
}

module.exports = api;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../nativeFn":25}],19:[function(require,module,exports){
(function (global){
'use strict';

module.exports = global.location;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
'use strict';

var emitter = require('./emitter');
var links = require('./links');

function attach () {
  emitter.on('start', links);
}

module.exports = {
  attach: attach
};

},{"./emitter":14,"./links":23}],21:[function(require,module,exports){
(function (global){
'use strict';

global.DEBUG && global.DEBUG('[index] loading taunus');

if (global.taunus !== void 0) {
  throw new Error('Use require(\'taunus/global\') after the initial require(\'taunus\') statement!');
}

var state = require('./state');
var stateClear = require('./stateClear');
var interceptor = require('./interceptor');
var activator = require('./activator');
var emitter = require('./emitter');
var hooks = require('./hooks');
var view = require('./view');
var mount = require('./mount');
var router = require('./router');
var xhr = require('./xhr');
var prefetcher = require('./prefetcher');
var resolve = require('../lib/resolve');

state.clear = stateClear;
hooks.attach();

function bind (method) {
  return function () {
    return emitter[method].apply(emitter, arguments);
  };
}

module.exports = global.taunus = {
  mount: mount,
  partial: view.partial,
  on: bind('on'),
  once: bind('once'),
  off: bind('off'),
  intercept: interceptor.add,
  navigate: activator.go,
  prefetch: prefetcher.start,
  state: state,
  route: router,
  resolve: resolve,
  xhr: xhr
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/resolve":40,"./activator":8,"./emitter":14,"./hooks":20,"./interceptor":22,"./mount":24,"./prefetcher":27,"./router":28,"./state":29,"./stateClear":30,"./view":37,"./xhr":38}],22:[function(require,module,exports){
(function (global){
'use strict';

var emitter = require('contra.emitter');
var once = require('./once');
var router = require('./router');
var interceptors = emitter({ count: 0 }, { async: true });

function getInterceptorEvent (route) {
  var e = {
    url: route.url,
    route: route,
    parts: route.parts,
    data: null,
    canPreventDefault: true,
    defaultPrevented: false,
    preventDefault: once(preventDefault)
  };

  function preventDefault (data) {
    if (!e.canPreventDefault) {
      return;
    }
    e.canPreventDefault = false;
    e.defaultPrevented = true;
    e.data = data;
  }

  return e;
}

function add (action, fn) {
  if (arguments.length === 1) {
    fn = action;
    action = '*';
  }
  interceptors.count++;
  interceptors.on(action, fn);
}

function execute (route, done) {
  var e = getInterceptorEvent(route);
  if (interceptors.count === 0) { // fail fast
    end(); return;
  }
  var fn = once(end);
  var preventDefaultBase = e.preventDefault;

  e.preventDefault = once(preventDefaultEnds);

  global.DEBUG && global.DEBUG('[interceptor] executing for %s', route.url);

  interceptors.emit('*', e);
  interceptors.emit(route.action, e);

  setTimeout(fn, 50); // at worst, spend 50ms waiting on interceptors

  function preventDefaultEnds () {
    preventDefaultBase.apply(null, arguments);
    fn();
  }

  function end () {
    global.DEBUG && global.DEBUG('[interceptor] %s for %s', interceptors.count === 0 && 'skipped' || e.defaultPrevented && 'prevented' || 'timed out', route.url);
    e.canPreventDefault = false;
    done(null, e);
  }
}

module.exports = {
  add: add,
  execute: execute
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./once":26,"./router":28,"contra.emitter":41}],23:[function(require,module,exports){
(function (global){
'use strict';

var state = require('./state');
var router = require('./router');
var events = require('./events');
var prefetcher = require('./prefetcher');
var activator = require('./activator');
var document = require('./global/document');
var origin = document.location.origin;
var leftClick = 1;
var prefetching = [];
var clicksOnHold = [];

function links () {
  if (state.prefetch && state.cache) { // prefetch without cache makes no sense
    global.DEBUG && global.DEBUG('[links] listening for prefetching opportunities');
    events.add(document.body, 'mouseover', maybePrefetch);
    events.add(document.body, 'touchstart', maybePrefetch);
  }
  global.DEBUG && global.DEBUG('[links] listening for rerouting opportunities');
  events.add(document.body, 'click', maybeReroute);
}

function so (anchor) {
  return anchor.origin === origin;
}

function leftClickOnAnchor (e, anchor) {
  return anchor.pathname && e.which === leftClick && !e.metaKey && !e.ctrlKey;
}

function targetOrAnchor (e) {
  var anchor = e.target;
  while (anchor) {
    if (anchor.tagName === 'A') {
      return anchor;
    }
    anchor = anchor.parentElement;
  }
}

function maybeReroute (e) {
  var anchor = targetOrAnchor(e);
  if (anchor && so(anchor) && leftClickOnAnchor(e, anchor)) {
    reroute(e, anchor);
  }
}

function maybePrefetch (e) {
  var anchor = targetOrAnchor(e);
  if (anchor && so(anchor)) {
    prefetch(e, anchor);
  }
}

function noop () {}

function parse (anchor) {
  return anchor.pathname + anchor.search + anchor.hash;
}

function reroute (e, anchor) {
  var url = parse(anchor);
  var route = router(url);
  if (!route) {
    return;
  }

  prevent();

  if (prefetcher.busy(url)) {
    global.DEBUG && global.DEBUG('[links] navigation to %s blocked by prefetcher', route.url);
    prefetcher.registerIntent(url);
    return;
  }

  global.DEBUG && global.DEBUG('[links] navigating to %s', route.url);
  activator.go(route.url, { context: anchor });

  function prevent () { e.preventDefault(); }
}

function prefetch (e, anchor) {
  prefetcher.start(parse(anchor), anchor);
}

module.exports = links;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./activator":8,"./events":15,"./global/document":17,"./prefetcher":27,"./router":28,"./state":29}],24:[function(require,module,exports){
(function (global){
'use strict';

var unescape = require('./unescape');
var state = require('./state');
var router = require('./router');
var activator = require('./activator');
var caching = require('./caching');
var componentCache = require('./componentCache');
var fetcher = require('./fetcher');
var versioning = require('../versioning');
var document = require('./global/document');
var location = require('./global/location');
var resolve = require('../lib/resolve');
var g = global;
var mounted;
var booted;

function orEmpty (value) {
  return value || '';
}

function mount (container, wiring, options) {
  var o = options || {};
  if (mounted) {
    throw new Error('Taunus already mounted!');
  }
  if (!container || !container.tagName) { // naïve is enough
    throw new Error('You must define an application root container!');
  }
  if (!o.bootstrap) { o.bootstrap = 'auto'; }

  mounted = true;

  global.DEBUG && global.DEBUG('[mount] mountpoint invoked using "%s" strategy', o.bootstrap);

  state.container = container;
  state.controllers = wiring.controllers;
  state.templates = wiring.templates;
  state.routes = wiring.routes;
  state.deferrals = wiring.deferrals || [];
  state.prefetch = !!o.prefetch;
  state.version = versioning.get(o.version || '1');

  resolve.set(state.routes);
  router.setup(state.routes);

  var url = location.pathname;
  var query = orEmpty(location.search) + orEmpty(location.hash);
  var route = router(url + query);

  caching.setup(o.cache, route);
  caching.ready(kickstart);
  componentCache.refill();

  function kickstart () {
    if (o.bootstrap === 'auto') {
      autoboot();
    } else if (o.bootstrap === 'inline') {
      inlineboot();
    } else if (o.bootstrap === 'manual') {
      manualboot();
    } else {
      throw new Error(o.bootstrap + ' is not a valid bootstrap mode!');
    }
  }

  function autoboot () {
    fetcher(route, { element: container, source: 'boot' }, fetched);
  }

  function fetched (err, data) {
    if (err) {
      throw new Error('Fetching JSON data model failed at mountpoint.');
    }
    boot(data);
  }

  function inlineboot () {
    var id = container.getAttribute('data-taunus');
    var script = document.getElementById(id);
    var data = JSON.parse(unescape(script.innerText || script.textContent));
    boot(data);
  }

  function manualboot () {
    if (typeof g.taunusReady === 'function') {
      g.taunusReady = boot; // not yet an object? turn it into the boot method
    } else if (g.taunusReady && typeof g.taunusReady === 'object') {
      boot(g.taunusReady); // already an object? boot with that as the data object
    } else {
      throw new Error('Did you forget to add the taunusReady global?');
    }
  }

  function boot (data) {
    if (booted) { // sanity
      return;
    }

    global.DEBUG && global.DEBUG('[mount] mountpoint booted with data', data);

    if (!data) {
      throw new Error('Taunus data is required! Boot failed');
    }
    if (!data.version) {
      throw new Error('Version data is missing! Boot failed');
    }
    if (!data.model || typeof data.model !== 'object') {
      throw new Error('Taunus model must be an object! Boot failed');
    }
    booted = true;
    caching.persist(route, state.container, data);
    activator.start(data);
  }
}

module.exports = mount;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lib/resolve":40,"../versioning":55,"./activator":8,"./caching":10,"./componentCache":12,"./fetcher":16,"./global/document":17,"./global/location":19,"./router":28,"./state":29,"./unescape":35}],25:[function(require,module,exports){
'use strict';

// source: https://gist.github.com/jdalton/5e34d890105aca44399f
// thanks @jdalton!

var toString = Object.prototype.toString; // used to resolve the internal `[[Class]]` of values
var fnToString = Function.prototype.toString; // used to resolve the decompiled source of functions
var host = /^\[object .+?Constructor\]$/; // used to detect host constructors (Safari > 4; really typed array specific)

// Escape any special regexp characters.
var specials = /[.*+?^${}()|[\]\/\\]/g;

// Replace mentions of `toString` with `.*?` to keep the template generic.
// Replace thing like `for ...` to support environments, like Rhino, which add extra
// info such as method arity.
var extras = /toString|(function).*?(?=\\\()| for .+?(?=\\\])/g;

// Compile a regexp using a common native method as a template.
// We chose `Object#toString` because there's a good chance it is not being mucked with.
var fnString = String(toString).replace(specials, '\\$&').replace(extras, '$1.*?');
var reNative = new RegExp('^' + fnString + '$');

function nativeFn (value) {
  var type = typeof value;
  if (type === 'function') {
    // Use `Function#toString` to bypass the value's own `toString` method
    // and avoid being faked out.
    return reNative.test(fnToString.call(value));
  }

  // Fallback to a host object check because some environments will represent
  // things like typed arrays as DOM methods which may not conform to the
  // normal native pattern.
  return (value && type === 'object' && host.test(toString.call(value))) || false;
}

module.exports = nativeFn;

},{}],26:[function(require,module,exports){
'use strict';

module.exports = function disposable (fn) {
  var used;
  var result;
  return function once () {
    if (used) { return result; } used = true;
    return (result = fn.apply(this, arguments));
  };
};

},{}],27:[function(require,module,exports){
(function (global){
'use strict';

var state = require('./state');
var router = require('./router');
var fetcher = require('./fetcher');
var activator = require('./activator');
var jobs = [];
var intent;

function busy (url) {
  return jobs.indexOf(url) !== -1;
}

function registerIntent (url) {
  intent = url;
}

function abortIntent (url) {
  intent = null;
}

function start (url, element) {
  if (state.cache !== true) { // can't prefetch if caching is disabled
    return;
  }
  if (intent) { // don't prefetch if the human wants to navigate: it'd abort the previous attempt
    return;
  }
  var route = router(url);
  if (route === null) { // only prefetch taunus view routes
    return;
  }
  if (busy(url)) { // already prefetching this url
    return;
  }

  global.DEBUG && global.DEBUG('[prefetcher] prefetching %s', route.url);
  jobs.push(url);
  fetcher(route, { element: element, source: 'prefetch' }, fetched);

  function fetched () {
    jobs.splice(jobs.indexOf(url), 1);
    if (intent === url) {
      intent = null;

      global.DEBUG && global.DEBUG('[prefetcher] resumed navigation for %s', route.url);
      activator.go(route.url, { context: element });
    }
  }
}

module.exports = {
  busy: busy,
  start: start,
  registerIntent: registerIntent,
  abortIntent: abortIntent
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./activator":8,"./fetcher":16,"./router":28,"./state":29}],28:[function(require,module,exports){
(function (global){
'use strict';

var url = require('fast-url-parser');
var routes = require('routes');
var location = require('./global/location');
var matcher = routes();
var protocol = /^[a-z]+?:\/\//i;

function getFullUrl (raw) {
  var base = location.href.substr(location.origin.length);
  var hashless;
  if (!raw) {
    return base;
  }
  if (raw[0] === '#') {
    hashless = base.substr(0, base.length - location.hash.length);
    return hashless + raw;
  }
  if (protocol.test(raw)) {
    if (raw.indexOf(location.origin) === 0) {
      return raw.substr(location.origin.length);
    }
    return null;
  }
  return raw;
}

function router (raw) {
  var full = getFullUrl(raw);
  if (full === null) {
    return full;
  }
  var parts = url.parse(full, true);
  var result = matcher.match(parts.pathname);
  var route = result ? result.fn(result) : null;
  if (route === null || route.ignore) {
    return null;
  }

  route.url = full;
  route.parts = parts;

  global.DEBUG && global.DEBUG('[router] %s yields %s', raw, route.route);

  return route;
}

function setup (definitions) {
  definitions.forEach(define);
}

function define (definition) {
  matcher.addRoute(definition.route, function build (match) {
    var params = match.params;
    params.args = match.splats;
    return {
      route: definition.route,
      params: params,
      action: definition.action || null,
      ignore: definition.ignore,
      cache: definition.cache
    };
  });
}

function equals (left, right) {
  return left && right && left.route === right.route && JSON.stringify(left.params) === JSON.stringify(right.params);
}

router.setup = setup;
router.equals = equals;

module.exports = router;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./global/location":19,"fast-url-parser":43,"routes":46}],29:[function(require,module,exports){
'use strict';

module.exports = {
  container: null
};

},{}],30:[function(require,module,exports){
'use strict';

var state = require('./state');
var raw = require('./stores/raw');
var idb = require('./stores/idb');

function clear () {
  raw.clear();
  idb.clear('models');
  idb.clear('controllers');
  idb.clear('templates');
  clearStore('controllers');
  clearStore('templates');
}

function clearStore (type) {
  var store = state[type];
  Object.keys(store).filter(o).forEach(rm);

  function o (action) {
    return store[action] && typeof store[action] === 'object';
  }
  function rm (action) {
    delete store[action];
  }
}


module.exports = clear;

},{"./state":29,"./stores/idb":31,"./stores/raw":32}],31:[function(require,module,exports){
(function (global){
'use strict';

var api = {};
var idb = require('./underlying_idb');
var supports;
var db;
var dbVersion = 3;
var dbName = 'taunus';
var keyPath = 'key';
var setQueue = [];
var testedQueue = [];

function noop () {}

function test () {
  var key = 'indexed-db-feature-detection';
  var req;
  var db;

  if (!idb || !('deleteDatabase' in idb)) {
    support(false); return;
  }

  try {
    idb.deleteDatabase(key).onsuccess = transactionalTest;
  } catch (e) {
    support(false);
  }

  function transactionalTest () {
    req = idb.open(key, 1);
    req.onupgradeneeded = upgneeded;
    req.onerror = error;
    req.onsuccess = success;

    function upgneeded () {
      req.result.createObjectStore('store');
    }

    function success () {
      db = req.result;
      try {
        db.transaction('store', 'readwrite').objectStore('store').add(new global.Blob(), 'key');
      } catch (e) {
        support(false);
      } finally {
        db.close();
        idb.deleteDatabase(key);
        if (supports !== false) {
          open();
        }
      }
    }

    function error () {
      support(false);
    }
  }
}

function open () {
  var req = idb.open(dbName, dbVersion);
  req.onerror = error;
  req.onupgradeneeded = upgneeded;
  req.onsuccess = success;

  function upgneeded (e) {
    var db = req.result;
    var v = e.oldVersion;
    if (v === 1) {
      db.deleteObjectStore('wildstore');
    }
    if (v < 2) {
      db.createObjectStore('models', { keyPath: keyPath });
      db.createObjectStore('templates', { keyPath: keyPath });
      db.createObjectStore('controllers', { keyPath: keyPath });
    }
  }

  function success () {
    db = req.result;
    api.name = 'IndexedDB';
    api.get = get;
    api.set = set;
    api.clear = clear;
    support(true);
  }

  function error () {
    support(false);
  }
}

function fallback () {
  api.name = 'IndexedDB-fallbackStore';
  api.get = undefinedGet;
  api.set = enqueueSet;
  api.clear = noop;
}

function undefinedGet (store, key, done) {
  (done || key)(null, done ? null : []);
}

function enqueueSet (store, key,  value, done) {
  if (supports === false) {
    done(null); return;
  }
  if (setQueue.length > 10) { // let's not waste any more memory
    done(new Error('EFULLQUEUE')); return;
  }
  setQueue.push({ store: store, key: key, value: value, done: done });
}

function drainSet () {
  if (supports === false) {
    setQueue = [];
    return;
  }
  global.DEBUG && global.DEBUG('[idb] draining setQueue (%s items)', setQueue.length);
  while (setQueue.length) {
    var item = setQueue.shift();
    set(item.store, item.key, item.value, item.done);
  }
}

function query (op, store, value, done) {
  var req = db.transaction(store, 'readwrite').objectStore(store)[op](value);

  req.onsuccess = success;
  req.onerror = error;

  function success () {
    (done || noop)(null, req.result);
  }

  function error () {
    (done || noop)(new Error('Taunus cache query failed at IndexedDB!'));
  }
}

function all (store, done) {
  var tx = db.transaction(store, 'readonly');
  var s = tx.objectStore(store);
  var req = s.openCursor();
  var items = [];

  req.onsuccess = success;
  req.onerror = error;
  tx.oncomplete = complete;

  function complete () {
    (done || noop)(null, items);
  }

  function success (e) {
    var cursor = e.target.result;
    if (cursor) {
      items.push(cursor.value);
      cursor.continue();
    }
  }

  function error () {
    (done || noop)(new Error('Taunus cache query-all failed at IndexedDB!'));
  }
}

function clear (store, done) {
  var tx = db.transaction(store, 'readwrite');
  var s = tx.objectStore(store);
  var req = s.clear();
  var items = [];

  req.onerror = error;
  tx.oncomplete = complete;

  function complete () {
    (done || noop)(null, items);
  }

  function error () {
    (done || noop)(new Error('Taunus cache clear failed at IndexedDB!'));
  }
}

function get (store, key, done) {
  if (done === void 0) {
    all(store, key);
  } else {
    query('get', store, key, done);
  }
}

function set (store, key, value, done) {
  global.DEBUG && global.DEBUG('[idb] storing %s, in %s db', key, store, value);
  value[keyPath] = key;
  query('add', store, value, done); // attempt to insert
  query('put', store, value, done); // attempt to update
}

function drainTested () {
  while (testedQueue.length) {
    testedQueue.shift()(supports);
  }
}

function tested (fn) {
  if (supports !== void 0) {
    fn(supports);
  } else {
    testedQueue.push(fn);
  }
}

function support (value) {
  if (supports !== void 0) {
    return; // sanity
  }
  global.DEBUG && global.DEBUG('[idb] test result %s, db %s', value, value ? 'ready' : 'unavailable');
  supports = value;
  drainTested();
  drainSet();
}

function failed () {
  support(false);
}

fallback();
test();
setTimeout(failed, 600); // the test can take somewhere near 300ms to complete

module.exports = api;

api.tested = tested;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./underlying_idb":33}],32:[function(require,module,exports){
'use strict';

var raw = {};

function noop () {}

function ensure (store) {
  if (!raw[store]) { raw[store] = {}; }
}

function get (store, key, done) {
  ensure(store);
  done(null, raw[store][key]);
}

function set (store, key, value, done) {
  ensure(store);
  raw[store][key] = value;
  (done || noop)(null);
}

function clear () {
  raw = {};
}

module.exports = {
  name: 'memoryStore',
  get: get,
  set: set,
  clear: clear
};

},{}],33:[function(require,module,exports){
(function (global){
'use strict';

var g = global;

// fallback to empty object because tests
module.exports = g.indexedDB || g.mozIndexedDB || g.webkitIndexedDB || g.msIndexedDB || {};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(require,module,exports){
'use strict';

var resolve = require('../lib/resolve');

module.exports = {
  resolve: resolve
};

},{"../lib/resolve":40}],35:[function(require,module,exports){
'use strict';

var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g;
var htmlUnescapes = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': '\'',
  '&#96;': '`'
};

function unescapeHtmlChar (c) {
  return htmlUnescapes[c];
}

function unescape (input) {
  var data = input == null ? '' : String(input);
  if (data && (reEscapedHtml.lastIndex = 0, reEscapedHtml.test(data))) {
    return data.replace(reEscapedHtml, unescapeHtmlChar);
  }
  return data;
}

module.exports = unescape;

},{}],36:[function(require,module,exports){
/* jshint strict:false */
// this module doesn't use strict, so eval is unstrict.

module.exports = function (code) {
  /* jshint evil:true */
  return eval(code);
};

},{}],37:[function(require,module,exports){
(function (global){
'use strict';

var state = require('./state');
var emitter = require('./emitter');
var fetcher = require('./fetcher');
var deferral = require('./deferral');
var templatingAPI = require('./templatingAPI');

function view (container, enforcedAction, model, route, options) {
  var action = enforcedAction || model && model.action || route && route.action;
  var demands = deferral.needs(action);

  global.DEBUG && global.DEBUG('[view] rendering view %s with [%s] demands', action, demands.join(','));

  if (demands.length) {
    pull();
  } else {
    ready();
  }

  function pull () {
    var victim = route || state.route;
    var context = {
      source: 'hijacking',
      hijacker: action,
      element: container
    };
    global.DEBUG && global.DEBUG('[view] hijacking %s for action %s', victim.url, action);
    fetcher(victim, context, ready);
  }

  function ready () {
    var controller = getComponent('controllers', action);
    var internals = options || {};
    if (internals.render !== false) {
      container.innerHTML = render(action, model);
    } else {
      global.DEBUG && global.DEBUG('[view] not rendering %s', action);
    }
    if (container === state.container) {
      emitter.emit('change', route, model);
    }
    emitter.emit('render', container, model, route || null);
    global.DEBUG && global.DEBUG('[view] %s client-side controller for %s', controller ? 'executing' : 'no', action);
    if (controller) {
      controller(model, container, route || null);
    }
  }
}

function render (action, model) {
  global.DEBUG && global.DEBUG('[view] rendering %s with model', action, model);
  var template = getComponent('templates', action);
  if (typeof template !== 'function') {
    throw new Error('Client-side "' + action + '" template not found');
  }
  model.taunus = templatingAPI;
  try {
    return template(model);
  } catch (e) {
    throw new Error('Error rendering "' + action + '" view template\n' + e.stack);
  }
}

function getComponent (type, action) {
  var component = state[type][action];
  var transport = typeof component;
  if (transport === 'object' && component) {
    return component.fn; // deferreds are stored as {fn,version}
  }
  if (transport === 'function') {
    return component;
  }
}

function partial (container, action, model) {
  global.DEBUG && global.DEBUG('[view] rendering partial %s', action);
  return view(container, action, model, null, { partial: true });
}

view.partial = partial;

module.exports = view;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./deferral":13,"./emitter":14,"./fetcher":16,"./state":29,"./templatingAPI":34}],38:[function(require,module,exports){
(function (global){
'use strict';

var xhr = require('xhr');

function request (url, o, done) {
  var options = {
    url: url,
    json: true,
    headers: { Accept: 'application/json' }
  };
  if (done) {
    Object.keys(o).forEach(overwrite);
  } else {
    done = o;
  }

  global.DEBUG && global.DEBUG('[xhr] %s %s', options.method || 'GET', options.url);

  var req = xhr(options, handle);

  return req;

  function overwrite (prop) {
    options[prop] = o[prop];
  }

  function handle (err, res, body) {
    if (err && !req.getAllResponseHeaders()) {
      global.DEBUG && global.DEBUG('[xhr] %s %s aborted', options.method || 'GET', options.url);
      done(new Error('aborted'), null, res);
    } else {
      global.DEBUG && global.DEBUG('[xhr] %s %s done', options.method || 'GET', options.url);
      done(err, body, res);
    }
  }
}

module.exports = request;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"xhr":47}],39:[function(require,module,exports){
'use strict';

module.exports = function deferred (action, rules) {
  return rules.some(failed);
  function failed (challenge) {
    var left = challenge.split('/');
    var right = action.split('/');
    var lpart, rpart;
    while (left.length) {
      lpart = left.shift();
      rpart = right.shift();
      if (lpart !== '?' && lpart !== rpart) {
        return false;
      }
    }
    return true;
  }
};

},{}],40:[function(require,module,exports){
'use strict';

var defaultMatcher = /:([a-z]+)(\?)?/ig;
var routes;
var matcher;

function find (action) {
  var i;
  for (i = 0; i < routes.length; i++) {
    if (routes[i].action === action) {
      return routes[i].route;
    }
  }
  return null;
}

function use (m) {
  matcher = m || defaultMatcher;
}

function set (r) {
  routes = r || [];
}

function resolve (action, data) {
  var props = data || {};
  var route = find(action);
  if (route === null) {
    return null;
  }
  return route.replace(matcher, replacer) + queryString(props.args);

  function replacer (match, key, optional) {
    var value = props[key];
    if (value !== void 0 && value !== null) {
      return props[key];
    }
    if (key in props || optional) {
      return '';
    }
    throw new Error('Route ' + route + ' expected "' + key + '" parameter.');
  }

  function queryString (args) {
    var parts = args || {};
    var query = Object.keys(parts).map(keyValuePair).join('&');
    if (query) {
      return '?' + query;
    }
    return '';

    function keyValuePair (prop) {
      var value = parts[prop];
      if (value === void 0 || value === null || value === '') {
        return prop;
      }
      return prop + '=' + value;
    }
  }
}

use();
set();

resolve.use = use;
resolve.set = set;

module.exports = resolve;

},{}],41:[function(require,module,exports){
module.exports = require('./src/contra.emitter.js');

},{"./src/contra.emitter.js":42}],42:[function(require,module,exports){
(function (process){
(function (root, undefined) {
  'use strict';

  var undef = '' + undefined;
  function atoa (a, n) { return Array.prototype.slice.call(a, n); }
  function debounce (fn, args, ctx) { if (!fn) { return; } tick(function run () { fn.apply(ctx || null, args || []); }); }

  // cross-platform ticker
  var si = typeof setImmediate === 'function', tick;
  if (si) {
    tick = function (fn) { setImmediate(fn); };
  } else if (typeof process !== undef && process.nextTick) {
    tick = process.nextTick;
  } else {
    tick = function (fn) { setTimeout(fn, 0); };
  }

  function _emitter (thing, options) {
    var opts = options || {};
    var evt = {};
    if (thing === undefined) { thing = {}; }
    thing.on = function (type, fn) {
      if (!evt[type]) {
        evt[type] = [fn];
      } else {
        evt[type].push(fn);
      }
      return thing;
    };
    thing.once = function (type, fn) {
      fn._once = true; // thing.off(fn) still works!
      thing.on(type, fn);
      return thing;
    };
    thing.off = function (type, fn) {
      var c = arguments.length;
      if (c === 1) {
        delete evt[type];
      } else if (c === 0) {
        evt = {};
      } else {
        var et = evt[type];
        if (!et) { return thing; }
        et.splice(et.indexOf(fn), 1);
      }
      return thing;
    };
    thing.emit = function () {
      var ctx = this;
      var args = atoa(arguments);
      var type = args.shift();
      var et = evt[type];
      if (type === 'error' && opts.throws !== false && !et) { throw args.length === 1 ? args[0] : args; }
      if (!et) { return thing; }
      evt[type] = et.filter(function emitter (listen) {
        if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
        return !listen._once;
      });
      return thing;
    };
    return thing;
  }

  // cross-platform export
  if (typeof module !== undef && module.exports) {
    module.exports = _emitter;
  } else {
    root.contra = root.contra || {};
    root.contra.emitter = _emitter;
  }
})(this);

}).call(this,require('_process'))
},{"_process":2}],43:[function(require,module,exports){
"use strict";
/*
Copyright (c) 2014 Petka Antonov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
function Url() {
    //For more efficient internal representation and laziness.
    //The non-underscore versions of these properties are accessor functions
    //defined on the prototype.
    this._protocol = null;
    this._href = "";
    this._port = -1;
    this._query = null;

    this.auth = null;
    this.slashes = null;
    this.host = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.pathname = null;

    this._prependSlash = false;
}

var querystring = require("querystring");
Url.prototype.parse =
function Url$parse(str, parseQueryString, hostDenotesSlash) {
    if (typeof str !== "string") {
        throw new TypeError("Parameter 'url' must be a string, not " +
            typeof str);
    }
    var start = 0;
    var end = str.length - 1;

    //Trim leading and trailing ws
    while (str.charCodeAt(start) <= 0x20 /*' '*/) start++;
    while (str.charCodeAt(end) <= 0x20 /*' '*/) end--;

    start = this._parseProtocol(str, start, end);

    //Javascript doesn't have host
    if (this._protocol !== "javascript") {
        start = this._parseHost(str, start, end, hostDenotesSlash);
        var proto = this._protocol;
        if (!this.hostname &&
            (this.slashes || (proto && !slashProtocols[proto]))) {
            this.hostname = this.host = "";
        }
    }

    if (start <= end) {
        var ch = str.charCodeAt(start);

        if (ch === 0x2F /*'/'*/) {
            this._parsePath(str, start, end);
        }
        else if (ch === 0x3F /*'?'*/) {
            this._parseQuery(str, start, end);
        }
        else if (ch === 0x23 /*'#'*/) {
            this._parseHash(str, start, end);
        }
        else if (this._protocol !== "javascript") {
            this._parsePath(str, start, end);
        }
        else { //For javascript the pathname is just the rest of it
            this.pathname = str.slice(start, end + 1 );
        }

    }

    if (!this.pathname && this.hostname &&
        this._slashProtocols[this._protocol]) {
        this.pathname = "/";
    }

    if (parseQueryString) {
        var search = this.search;
        if (search == null) {
            search = this.search = "";
        }
        if (search.charCodeAt(0) === 0x3F /*'?'*/) {
            search = search.slice(1);
        }
        //This calls a setter function, there is no .query data property
        this.query = querystring.parse(search);
    }
};

Url.prototype.resolve = function Url$resolve(relative) {
    return this.resolveObject(Url.parse(relative, false, true)).format();
};

Url.prototype.format = function Url$format() {
    var auth = this.auth || "";

    if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ":");
        auth += "@";
    }

    var protocol = this.protocol || "";
    var pathname = this.pathname || "";
    var hash = this.hash || "";
    var search = this.search || "";
    var query = "";
    var hostname = this.hostname || "";
    var port = this.port || "";
    var host = false;
    var scheme = "";

    //Cache the result of the getter function
    var q = this.query;
    if (q && typeof q === "object") {
        query = querystring.stringify(q);
    }

    if (!search) {
        search = query ? "?" + query : "";
    }

    if (protocol && protocol.charCodeAt(protocol.length - 1) !== 0x3A /*':'*/)
        protocol += ":";

    if (this.host) {
        host = auth + this.host;
    }
    else if (hostname) {
        var ip6 = hostname.indexOf(":") > -1;
        if (ip6) hostname = "[" + hostname + "]";
        host = auth + hostname + (port ? ":" + port : "");
    }

    var slashes = this.slashes ||
        ((!protocol ||
        slashProtocols[protocol]) && host !== false);


    if (protocol) scheme = protocol + (slashes ? "//" : "");
    else if (slashes) scheme = "//";

    if (slashes && pathname && pathname.charCodeAt(0) !== 0x2F /*'/'*/) {
        pathname = "/" + pathname;
    }
    else if (!slashes && pathname === "/") {
        pathname = "";
    }
    if (search && search.charCodeAt(0) !== 0x3F /*'?'*/)
        search = "?" + search;
    if (hash && hash.charCodeAt(0) !== 0x23 /*'#'*/)
        hash = "#" + hash;

    pathname = escapePathName(pathname);
    search = escapeSearch(search);

    return scheme + (host === false ? "" : host) + pathname + search + hash;
};

Url.prototype.resolveObject = function Url$resolveObject(relative) {
    if (typeof relative === "string")
        relative = Url.parse(relative, false, true);

    var result = this._clone();

    // hash is always overridden, no matter what.
    // even href="" will remove it.
    result.hash = relative.hash;

    // if the relative url is empty, then there"s nothing left to do here.
    if (!relative.href) {
        result._href = "";
        return result;
    }

    // hrefs like //foo/bar always cut to the protocol.
    if (relative.slashes && !relative._protocol) {
        relative._copyPropsTo(result, true);

        if (slashProtocols[result._protocol] &&
            result.hostname && !result.pathname) {
            result.pathname = "/";
        }
        result._href = "";
        return result;
    }

    if (relative._protocol && relative._protocol !== result._protocol) {
        // if it"s a known url protocol, then changing
        // the protocol does weird things
        // first, if it"s not file:, then we MUST have a host,
        // and if there was a path
        // to begin with, then we MUST have a path.
        // if it is file:, then the host is dropped,
        // because that"s known to be hostless.
        // anything else is assumed to be absolute.
        if (!slashProtocols[relative._protocol]) {
            relative._copyPropsTo(result, false);
            result._href = "";
            return result;
        }

        result._protocol = relative._protocol;
        if (!relative.host && relative._protocol !== "javascript") {
            var relPath = (relative.pathname || "").split("/");
            while (relPath.length && !(relative.host = relPath.shift()));
            if (!relative.host) relative.host = "";
            if (!relative.hostname) relative.hostname = "";
            if (relPath[0] !== "") relPath.unshift("");
            if (relPath.length < 2) relPath.unshift("");
            result.pathname = relPath.join("/");
        } else {
            result.pathname = relative.pathname;
        }

        result.search = relative.search;
        result.host = relative.host || "";
        result.auth = relative.auth;
        result.hostname = relative.hostname || relative.host;
        result._port = relative._port;
        result.slashes = result.slashes || relative.slashes;
        result._href = "";
        return result;
    }

    var isSourceAbs =
        (result.pathname && result.pathname.charCodeAt(0) === 0x2F /*'/'*/);
    var isRelAbs = (
            relative.host ||
            (relative.pathname &&
            relative.pathname.charCodeAt(0) === 0x2F /*'/'*/)
        );
    var mustEndAbs = (isRelAbs || isSourceAbs ||
                        (result.host && relative.pathname));

    var removeAllDots = mustEndAbs;

    var srcPath = result.pathname && result.pathname.split("/") || [];
    var relPath = relative.pathname && relative.pathname.split("/") || [];
    var psychotic = result._protocol && !slashProtocols[result._protocol];

    // if the url is a non-slashed url, then relative
    // links like ../.. should be able
    // to crawl up to the hostname, as well.  This is strange.
    // result.protocol has already been set by now.
    // Later on, put the first path part into the host field.
    if (psychotic) {
        result.hostname = "";
        result._port = -1;
        if (result.host) {
            if (srcPath[0] === "") srcPath[0] = result.host;
            else srcPath.unshift(result.host);
        }
        result.host = "";
        if (relative._protocol) {
            relative.hostname = "";
            relative._port = -1;
            if (relative.host) {
                if (relPath[0] === "") relPath[0] = relative.host;
                else relPath.unshift(relative.host);
            }
            relative.host = "";
        }
        mustEndAbs = mustEndAbs && (relPath[0] === "" || srcPath[0] === "");
    }

    if (isRelAbs) {
        // it"s absolute.
        result.host = relative.host ?
            relative.host : result.host;
        result.hostname = relative.hostname ?
            relative.hostname : result.hostname;
        result.search = relative.search;
        srcPath = relPath;
        // fall through to the dot-handling below.
    } else if (relPath.length) {
        // it"s relative
        // throw away the existing file, and take the new path instead.
        if (!srcPath) srcPath = [];
        srcPath.pop();
        srcPath = srcPath.concat(relPath);
        result.search = relative.search;
    } else if (relative.search) {
        // just pull out the search.
        // like href="?foo".
        // Put this after the other two cases because it simplifies the booleans
        if (psychotic) {
            result.hostname = result.host = srcPath.shift();
            //occationaly the auth can get stuck only in host
            //this especialy happens in cases like
            //url.resolveObject("mailto:local1@domain1", "local2@domain2")
            var authInHost = result.host && result.host.indexOf("@") > 0 ?
                result.host.split("@") : false;
            if (authInHost) {
                result.auth = authInHost.shift();
                result.host = result.hostname = authInHost.shift();
            }
        }
        result.search = relative.search;
        result._href = "";
        return result;
    }

    if (!srcPath.length) {
        // no path at all.  easy.
        // we"ve already handled the other stuff above.
        result.pathname = null;
        result._href = "";
        return result;
    }

    // if a url ENDs in . or .., then it must get a trailing slash.
    // however, if it ends in anything else non-slashy,
    // then it must NOT get a trailing slash.
    var last = srcPath.slice(-1)[0];
    var hasTrailingSlash = (
        (result.host || relative.host) && (last === "." || last === "..") ||
        last === "");

    // strip single dots, resolve double dots to parent dir
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = srcPath.length; i >= 0; i--) {
        last = srcPath[i];
        if (last == ".") {
            srcPath.splice(i, 1);
        } else if (last === "..") {
            srcPath.splice(i, 1);
            up++;
        } else if (up) {
            srcPath.splice(i, 1);
            up--;
        }
    }

    // if the path is allowed to go above the root, restore leading ..s
    if (!mustEndAbs && !removeAllDots) {
        for (; up--; up) {
            srcPath.unshift("..");
        }
    }

    if (mustEndAbs && srcPath[0] !== "" &&
        (!srcPath[0] || srcPath[0].charCodeAt(0) !== 0x2F /*'/'*/)) {
        srcPath.unshift("");
    }

    if (hasTrailingSlash && (srcPath.join("/").substr(-1) !== "/")) {
        srcPath.push("");
    }

    var isAbsolute = srcPath[0] === "" ||
        (srcPath[0] && srcPath[0].charCodeAt(0) === 0x2F /*'/'*/);

    // put the host back
    if (psychotic) {
        result.hostname = result.host = isAbsolute ? "" :
            srcPath.length ? srcPath.shift() : "";
        //occationaly the auth can get stuck only in host
        //this especialy happens in cases like
        //url.resolveObject("mailto:local1@domain1", "local2@domain2")
        var authInHost = result.host && result.host.indexOf("@") > 0 ?
            result.host.split("@") : false;
        if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
        }
    }

    mustEndAbs = mustEndAbs || (result.host && srcPath.length);

    if (mustEndAbs && !isAbsolute) {
        srcPath.unshift("");
    }

    result.pathname = srcPath.length === 0 ? null : srcPath.join("/");
    result.auth = relative.auth || result.auth;
    result.slashes = result.slashes || relative.slashes;
    result._href = "";
    return result;
};

var punycode = require("punycode");
Url.prototype._hostIdna = function Url$_hostIdna(hostname) {
    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    var domainArray = hostname.split(".");
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            "xn--" + punycode.encode(s) : s);
    }
    return newOut.join(".");
};

var escapePathName = Url.prototype._escapePathName =
function Url$_escapePathName(pathname) {
    if (!containsCharacter2(pathname, 0x23 /*'#'*/, 0x3F /*'?'*/)) {
        return pathname;
    }
    //Avoid closure creation to keep this inlinable
    return _escapePath(pathname);
};

var escapeSearch = Url.prototype._escapeSearch =
function Url$_escapeSearch(search) {
    if (!containsCharacter2(search, 0x23 /*'#'*/, -1)) return search;
    //Avoid closure creation to keep this inlinable
    return _escapeSearch(search);
};

Url.prototype._parseProtocol = function Url$_parseProtocol(str, start, end) {
    var doLowerCase = false;
    var protocolCharacters = this._protocolCharacters;

    for (var i = start; i <= end; ++i) {
        var ch = str.charCodeAt(i);

        if (ch === 0x3A /*':'*/) {
            var protocol = str.slice(start, i);
            if (doLowerCase) protocol = protocol.toLowerCase();
            this._protocol = protocol;
            return i + 1;
        }
        else if (protocolCharacters[ch] === 1) {
            if (ch < 0x61 /*'a'*/)
                doLowerCase = true;
        }
        else {
            return start;
        }

    }
    return start;
};

Url.prototype._parseAuth = function Url$_parseAuth(str, start, end, decode) {
    var auth = str.slice(start, end + 1);
    if (decode) {
        auth = decodeURIComponent(auth);
    }
    this.auth = auth;
};

Url.prototype._parsePort = function Url$_parsePort(str, start, end) {
    //Internal format is integer for more efficient parsing
    //and for efficient trimming of leading zeros
    var port = 0;
    //Distinguish between :0 and : (no port number at all)
    var hadChars = false;

    for (var i = start; i <= end; ++i) {
        var ch = str.charCodeAt(i);

        if (0x30 /*'0'*/ <= ch && ch <= 0x39 /*'9'*/) {
            port = (10 * port) + (ch - 0x30 /*'0'*/);
            hadChars = true;
        }
        else break;

    }
    if (port === 0 && !hadChars) {
        return 0;
    }

    this._port = port;
    return i - start;
};

Url.prototype._parseHost =
function Url$_parseHost(str, start, end, slashesDenoteHost) {
    var hostEndingCharacters = this._hostEndingCharacters;
    if (str.charCodeAt(start) === 0x2F /*'/'*/ &&
        str.charCodeAt(start + 1) === 0x2F /*'/'*/) {
        this.slashes = true;

        //The string starts with //
        if (start === 0) {
            //The string is just "//"
            if (end < 2) return start;
            //If slashes do not denote host and there is no auth,
            //there is no host when the string starts with //
            var hasAuth =
                containsCharacter(str, 0x40 /*'@'*/, 2, hostEndingCharacters);
            if (!hasAuth && !slashesDenoteHost) {
                this.slashes = null;
                return start;
            }
        }
        //There is a host that starts after the //
        start += 2;
    }
    //If there is no slashes, there is no hostname if
    //1. there was no protocol at all
    else if (!this._protocol ||
        //2. there was a protocol that requires slashes
        //e.g. in 'http:asd' 'asd' is not a hostname
        slashProtocols[this._protocol]
    ) {
        return start;
    }

    var doLowerCase = false;
    var idna = false;
    var hostNameStart = start;
    var hostNameEnd = end;
    var lastCh = -1;
    var portLength = 0;
    var charsAfterDot = 0;
    var authNeedsDecoding = false;

    var j = -1;

    //Find the last occurrence of an @-sign until hostending character is met
    //also mark if decoding is needed for the auth portion
    for (var i = start; i <= end; ++i) {
        var ch = str.charCodeAt(i);

        if (ch === 0x40 /*'@'*/) {
            j = i;
        }
        //This check is very, very cheap. Unneeded decodeURIComponent is very
        //very expensive
        else if (ch === 0x25 /*'%'*/) {
            authNeedsDecoding = true;
        }
        else if (hostEndingCharacters[ch] === 1) {
            break;
        }
    }

    //@-sign was found at index j, everything to the left from it
    //is auth part
    if (j > -1) {
        this._parseAuth(str, start, j - 1, authNeedsDecoding);
        //hostname starts after the last @-sign
        start = hostNameStart = j + 1;
    }

    //Host name is starting with a [
    if (str.charCodeAt(start) === 0x5B /*'['*/) {
        for (var i = start + 1; i <= end; ++i) {
            var ch = str.charCodeAt(i);

            //Assume valid IP6 is between the brackets
            if (ch === 0x5D /*']'*/) {
                if (str.charCodeAt(i + 1) === 0x3A /*':'*/) {
                    portLength = this._parsePort(str, i + 2, end) + 1;
                }
                var hostname = str.slice(start + 1, i).toLowerCase();
                this.hostname = hostname;
                this.host = this._port > 0
                    ? "[" + hostname + "]:" + this._port
                    : "[" + hostname + "]";
                this.pathname = "/";
                return i + portLength + 1;
            }
        }
        //Empty hostname, [ starts a path
        return start;
    }

    for (var i = start; i <= end; ++i) {
        if (charsAfterDot > 62) {
            this.hostname = this.host = str.slice(start, i);
            return i;
        }
        var ch = str.charCodeAt(i);

        if (ch === 0x3A /*':'*/) {
            portLength = this._parsePort(str, i + 1, end) + 1;
            hostNameEnd = i - 1;
            break;
        }
        else if (ch < 0x61 /*'a'*/) {
            if (ch === 0x2E /*'.'*/) {
                //Node.js ignores this error
                /*
                if (lastCh === DOT || lastCh === -1) {
                    this.hostname = this.host = "";
                    return start;
                }
                */
                charsAfterDot = -1;
            }
            else if (0x41 /*'A'*/ <= ch && ch <= 0x5A /*'Z'*/) {
                doLowerCase = true;
            }
            else if (!(ch === 0x2D /*'-'*/ || ch === 0x5F /*'_'*/ ||
                (0x30 /*'0'*/ <= ch && ch <= 0x39 /*'9'*/))) {
                if (hostEndingCharacters[ch] === 0 &&
                    this._noPrependSlashHostEnders[ch] === 0) {
                    this._prependSlash = true;
                }
                hostNameEnd = i - 1;
                break;
            }
        }
        else if (ch >= 0x7B /*'{'*/) {
            if (ch <= 0x7E /*'~'*/) {
                if (this._noPrependSlashHostEnders[ch] === 0) {
                    this._prependSlash = true;
                }
                hostNameEnd = i - 1;
                break;
            }
            idna = true;
        }
        lastCh = ch;
        charsAfterDot++;
    }

    //Node.js ignores this error
    /*
    if (lastCh === DOT) {
        hostNameEnd--;
    }
    */

    if (hostNameEnd + 1 !== start &&
        hostNameEnd - hostNameStart <= 256) {
        var hostname = str.slice(hostNameStart, hostNameEnd + 1);
        if (doLowerCase) hostname = hostname.toLowerCase();
        if (idna) hostname = this._hostIdna(hostname);
        this.hostname = hostname;
        this.host = this._port > 0 ? hostname + ":" + this._port : hostname;
    }

    return hostNameEnd + 1 + portLength;

};

Url.prototype._copyPropsTo = function Url$_copyPropsTo(input, noProtocol) {
    if (!noProtocol) {
        input._protocol = this._protocol;
    }
    input._href = this._href;
    input._port = this._port;
    input._prependSlash = this._prependSlash;
    input.auth = this.auth;
    input.slashes = this.slashes;
    input.host = this.host;
    input.hostname = this.hostname;
    input.hash = this.hash;
    input.search = this.search;
    input.pathname = this.pathname;
};

Url.prototype._clone = function Url$_clone() {
    var ret = new Url();
    ret._protocol = this._protocol;
    ret._href = this._href;
    ret._port = this._port;
    ret._prependSlash = this._prependSlash;
    ret.auth = this.auth;
    ret.slashes = this.slashes;
    ret.host = this.host;
    ret.hostname = this.hostname;
    ret.hash = this.hash;
    ret.search = this.search;
    ret.pathname = this.pathname;
    return ret;
};

Url.prototype._getComponentEscaped =
function Url$_getComponentEscaped(str, start, end) {
    var cur = start;
    var i = start;
    var ret = "";
    var autoEscapeMap = this._autoEscapeMap;
    for (; i <= end; ++i) {
        var ch = str.charCodeAt(i);
        var escaped = autoEscapeMap[ch];

        if (escaped !== "") {
            if (cur < i) ret += str.slice(cur, i);
            ret += escaped;
            cur = i + 1;
        }
    }
    if (cur < i + 1) ret += str.slice(cur, i);
    return ret;
};

Url.prototype._parsePath =
function Url$_parsePath(str, start, end) {
    var pathStart = start;
    var pathEnd = end;
    var escape = false;
    var autoEscapeCharacters = this._autoEscapeCharacters;

    for (var i = start; i <= end; ++i) {
        var ch = str.charCodeAt(i);
        if (ch === 0x23 /*'#'*/) {
            this._parseHash(str, i, end);
            pathEnd = i - 1;
            break;
        }
        else if (ch === 0x3F /*'?'*/) {
            this._parseQuery(str, i, end);
            pathEnd = i - 1;
            break;
        }
        else if (!escape && autoEscapeCharacters[ch] === 1) {
            escape = true;
        }
    }

    if (pathStart > pathEnd) {
        this.pathname = "/";
        return;
    }

    var path;
    if (escape) {
        path = this._getComponentEscaped(str, pathStart, pathEnd);
    }
    else {
        path = str.slice(pathStart, pathEnd + 1);
    }
    this.pathname = this._prependSlash ? "/" + path : path;
};

Url.prototype._parseQuery = function Url$_parseQuery(str, start, end) {
    var queryStart = start;
    var queryEnd = end;
    var escape = false;
    var autoEscapeCharacters = this._autoEscapeCharacters;

    for (var i = start; i <= end; ++i) {
        var ch = str.charCodeAt(i);

        if (ch === 0x23 /*'#'*/) {
            this._parseHash(str, i, end);
            queryEnd = i - 1;
            break;
        }
        else if (!escape && autoEscapeCharacters[ch] === 1) {
            escape = true;
        }
    }

    if (queryStart > queryEnd) {
        this.search = "";
        return;
    }

    var query;
    if (escape) {
        query = this._getComponentEscaped(str, queryStart, queryEnd);
    }
    else {
        query = str.slice(queryStart, queryEnd + 1);
    }
    this.search = query;
};

Url.prototype._parseHash = function Url$_parseHash(str, start, end) {
    if (start > end) {
        this.hash = "";
        return;
    }
    this.hash = this._getComponentEscaped(str, start, end);
};

Object.defineProperty(Url.prototype, "port", {
    get: function() {
        if (this._port >= 0) {
            return ("" + this._port);
        }
        return null;
    },
    set: function(v) {
        if (v == null) {
            this._port = -1;
        }
        else {
            this._port = parseInt(v, 10);
        }
    }
});

Object.defineProperty(Url.prototype, "query", {
    get: function() {
        var query = this._query;
        if (query != null) {
            return query;
        }
        var search = this.search;

        if (search) {
            if (search.charCodeAt(0) === 0x3F /*'?'*/) {
                search = search.slice(1);
            }
            if (search !== "") {
                this._query = search;
                return search;
            }
        }
        return search;
    },
    set: function(v) {
        this._query = v;
    }
});

Object.defineProperty(Url.prototype, "path", {
    get: function() {
        var p = this.pathname || "";
        var s = this.search || "";
        if (p || s) {
            return p + s;
        }
        return (p == null && s) ? ("/" + s) : null;
    },
    set: function() {}
});

Object.defineProperty(Url.prototype, "protocol", {
    get: function() {
        var proto = this._protocol;
        return proto ? proto + ":" : proto;
    },
    set: function(v) {
        if (typeof v === "string") {
            var end = v.length - 1;
            if (v.charCodeAt(end) === 0x3A /*':'*/) {
                this._protocol = v.slice(0, end);
            }
            else {
                this._protocol = v;
            }
        }
        else if (v == null) {
            this._protocol = null;
        }
    }
});

Object.defineProperty(Url.prototype, "href", {
    get: function() {
        var href = this._href;
        if (!href) {
            href = this._href = this.format();
        }
        return href;
    },
    set: function(v) {
        this._href = v;
    }
});

Url.parse = function Url$Parse(str, parseQueryString, hostDenotesSlash) {
    if (str instanceof Url) return str;
    var ret = new Url();
    ret.parse(str, !!parseQueryString, !!hostDenotesSlash);
    return ret;
};

Url.format = function Url$Format(obj) {
    if (typeof obj === "string") {
        obj = Url.parse(obj);
    }
    if (!(obj instanceof Url)) {
        return Url.prototype.format.call(obj);
    }
    return obj.format();
};

Url.resolve = function Url$Resolve(source, relative) {
    return Url.parse(source, false, true).resolve(relative);
};

Url.resolveObject = function Url$ResolveObject(source, relative) {
    if (!source) return relative;
    return Url.parse(source, false, true).resolveObject(relative);
};

function _escapePath(pathname) {
    return pathname.replace(/[?#]/g, function(match) {
        return encodeURIComponent(match);
    });
}

function _escapeSearch(search) {
    return search.replace(/#/g, function(match) {
        return encodeURIComponent(match);
    });
}

//Search `char1` (integer code for a character) in `string`
//starting from `fromIndex` and ending at `string.length - 1`
//or when a stop character is found
function containsCharacter(string, char1, fromIndex, stopCharacterTable) {
    var len = string.length;
    for (var i = fromIndex; i < len; ++i) {
        var ch = string.charCodeAt(i);

        if (ch === char1) {
            return true;
        }
        else if (stopCharacterTable[ch] === 1) {
            return false;
        }
    }
    return false;
}

//See if `char1` or `char2` (integer codes for characters)
//is contained in `string`
function containsCharacter2(string, char1, char2) {
    for (var i = 0, len = string.length; i < len; ++i) {
        var ch = string.charCodeAt(i);
        if (ch === char1 || ch === char2) return true;
    }
    return false;
}

//Makes an array of 128 uint8's which represent boolean values.
//Spec is an array of ascii code points or ascii code point ranges
//ranges are expressed as [start, end]

//Create a table with the characters 0x30-0x39 (decimals '0' - '9') and
//0x7A (lowercaseletter 'z') as `true`:
//
//var a = makeAsciiTable([[0x30, 0x39], 0x7A]);
//a[0x30]; //1
//a[0x15]; //0
//a[0x35]; //1
function makeAsciiTable(spec) {
    var ret = new Uint8Array(128);
    spec.forEach(function(item){
        if (typeof item === "number") {
            ret[item] = 1;
        }
        else {
            var start = item[0];
            var end = item[1];
            for (var j = start; j <= end; ++j) {
                ret[j] = 1;
            }
        }
    });

    return ret;
}


var autoEscape = ["<", ">", "\"", "`", " ", "\r", "\n",
    "\t", "{", "}", "|", "\\", "^", "`", "'"];

var autoEscapeMap = new Array(128);



for (var i = 0, len = autoEscapeMap.length; i < len; ++i) {
    autoEscapeMap[i] = "";
}

for (var i = 0, len = autoEscape.length; i < len; ++i) {
    var c = autoEscape[i];
    var esc = encodeURIComponent(c);
    if (esc === c) {
        esc = escape(c);
    }
    autoEscapeMap[c.charCodeAt(0)] = esc;
}


var slashProtocols = Url.prototype._slashProtocols = {
    http: true,
    https: true,
    gopher: true,
    file: true,
    ftp: true,

    "http:": true,
    "https:": true,
    "gopher:": true,
    "file:": true,
    "ftp:": true
};

//Optimize back from normalized object caused by non-identifier keys
function f(){}
f.prototype = slashProtocols;

Url.prototype._protocolCharacters = makeAsciiTable([
    [0x61 /*'a'*/, 0x7A /*'z'*/],
    [0x41 /*'A'*/, 0x5A /*'Z'*/],
    0x2E /*'.'*/, 0x2B /*'+'*/, 0x2D /*'-'*/
]);

Url.prototype._hostEndingCharacters = makeAsciiTable([
    0x23 /*'#'*/, 0x3F /*'?'*/, 0x2F /*'/'*/
]);

Url.prototype._autoEscapeCharacters = makeAsciiTable(
    autoEscape.map(function(v) {
        return v.charCodeAt(0);
    })
);

//If these characters end a host name, the path will not be prepended a /
Url.prototype._noPrependSlashHostEnders = makeAsciiTable(
    [
        "<", ">", "'", "`", " ", "\r",
        "\n", "\t", "{", "}", "|", "\\",
        "^", "`", "\"", "%", ";"
    ].map(function(v) {
        return v.charCodeAt(0);
    })
);

Url.prototype._autoEscapeMap = autoEscapeMap;

module.exports = Url;

Url.replace = function Url$Replace() {
    require.cache["url"] = {
        exports: Url
    };
};

},{"punycode":3,"querystring":6}],44:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , isNative = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  isNative = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!isNative) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":45}],45:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,require('_process'))
},{"_process":2}],46:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.routes=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

var localRoutes = [];


/**
 * Convert path to route object
 *
 * A string or RegExp should be passed,
 * will return { re, src, keys} obj
 *
 * @param  {String / RegExp} path
 * @return {Object}
 */

var Route = function(path){
  //using 'new' is optional

  var src, re, keys = [];

  if(path instanceof RegExp){
    re = path;
    src = path.toString();
  }else{
    re = pathToRegExp(path, keys);
    src = path;
  }

  return {
  	 re: re,
  	 src: path.toString(),
  	 keys: keys
  }
};

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String} path
 * @param  {Array} keys
 * @return {RegExp}
 */
var pathToRegExp = function (path, keys) {
	path = path
		.concat('/?')
		.replace(/\/\(/g, '(?:/')
		.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function(_, slash, format, key, capture, optional){
			if (_ === "*"){
				keys.push(undefined);
				return _;
			}

			keys.push(key);
			slash = slash || '';
			return ''
				+ (optional ? '' : slash)
				+ '(?:'
				+ (optional ? slash : '')
				+ (format || '') + (capture || '([^/]+?)') + ')'
				+ (optional || '');
		})
		.replace(/([\/.])/g, '\\$1')
		.replace(/\*/g, '(.*)');
	return new RegExp('^' + path + '$', 'i');
};

/**
 * Attempt to match the given request to
 * one of the routes. When successful
 * a  {fn, params, splats} obj is returned
 *
 * @param  {Array} routes
 * @param  {String} uri
 * @return {Object}
 */
var match = function (routes, uri, startAt) {
	var captures, i = startAt || 0;

	for (var len = routes.length; i < len; ++i) {
		var route = routes[i],
		    re = route.re,
		    keys = route.keys,
		    splats = [],
		    params = {};

		if (captures = uri.match(re)) {
			for (var j = 1, len = captures.length; j < len; ++j) {
				var key = keys[j-1],
					val = typeof captures[j] === 'string'
						? unescape(captures[j])
						: captures[j];
				if (key) {
					params[key] = val;
				} else {
					splats.push(val);
				}
			}
			return {
				params: params,
				splats: splats,
				route: route.src,
				next: i + 1
			};
		}
	}
};

/**
 * Default "normal" router constructor.
 * accepts path, fn tuples via addRoute
 * returns {fn, params, splats, route}
 *  via match
 *
 * @return {Object}
 */

var Router = function(){
  //using 'new' is optional
  return {
    routes: [],
    routeMap : {},
    addRoute: function(path, fn){
      if (!path) throw new Error(' route requires a path');
      if (!fn) throw new Error(' route ' + path.toString() + ' requires a callback');

      var route = Route(path);
      route.fn = fn;

      this.routes.push(route);
      this.routeMap[path] = fn;
    },

    match: function(pathname, startAt){
      var route = match(this.routes, pathname, startAt);
      if(route){
        route.fn = this.routeMap[route.route];
        route.next = this.match.bind(this, pathname, route.next)
      }
      return route;
    }
  }
};

Router.Route = Route
Router.pathToRegExp = pathToRegExp
Router.match = match
// back compat
Router.Router = Router

module.exports = Router

},{}]},{},[1])
(1)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],47:[function(require,module,exports){
var window = require("global/window")
var once = require("once")
var parseHeaders = require('parse-headers')

var messages = {
    "0": "Internal XMLHttpRequest Error",
    "4": "4xx Client Error",
    "5": "5xx Server Error"
}

var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ? XHR : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    callback = once(callback)

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new XDR()
        }else{
            xhr = new XHR()
        }
    }

    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var key
    var load = options.response ? loadResponse : loadXhr

    if ("json" in options) {
        isJson = true
        headers["Accept"] = "application/json"
        if (method !== "GET" && method !== "HEAD") {
            headers["Content-Type"] = "application/json"
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = load
    xhr.onerror = error
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    // hate IE
    xhr.ontimeout = noop
    xhr.open(method, uri, !sync)
                                    //backward compatibility
    if (options.withCredentials || (options.cors && options.withCredentials !== false)) {
        xhr.withCredentials = true
    }

    // Cannot set timeout with sync request
    if (!sync) {
        xhr.timeout = "timeout" in options ? options.timeout : 5000
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }
    
    if ("beforeSend" in options && 
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr

    function readystatechange() {
        if (xhr.readyState === 4) {
            load()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = null

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === 'text' || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    function getStatusCode() {
        return xhr.status === 1223 ? 204 : xhr.status
    }

    // if we're getting a none-ok statusCode, build & return an error
    function errorFromStatusCode(status) {
        var error = null
        if (status === 0 || (status >= 400 && status < 600)) {
            var message = (typeof body === "string" ? body : false) ||
                messages[String(status).charAt(0)]
            error = new Error(message)
            error.statusCode = status
        }

        return error
    }

    // will load the data & process the response in a special response object
    function loadResponse() {
        var status = getStatusCode()
        var error = errorFromStatusCode(status)
        var response = {
            body: getBody(),
            statusCode: status,
            statusText: xhr.statusText,
            raw: xhr
        }
        if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
            response.headers = parseHeaders(xhr.getAllResponseHeaders())
        } else {
            response.headers = {}
        }

        callback(error, response, response.body)
    }

    // will load the data and add some response properties to the source xhr
    // and then respond with that
    function loadXhr() {
        var status = getStatusCode()
        var error = errorFromStatusCode(status)

        xhr.status = xhr.statusCode = status
        xhr.body = getBody()
        xhr.headers = parseHeaders(xhr.getAllResponseHeaders())

        callback(error, xhr, xhr.body)
    }

    function error(evt) {
        callback(evt, xhr)
    }
}


function noop() {}

},{"global/window":48,"once":49,"parse-headers":53}],48:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],49:[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],50:[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":51}],51:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],52:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],53:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":50,"trim":52}],54:[function(require,module,exports){
module.exports="3.2.1"

},{}],55:[function(require,module,exports){
'use strict';

var t = require('./version.json');

function get (v) {
  return 't' + t + ';v' + v;
}

module.exports = {
  get: get
};

},{"./version.json":54}],56:[function(require,module,exports){
'use strict';

var taunus = require('taunus');
var main = document.getElementsByTagName('main')[0];

taunus.mount(main, {
  controllers: require('./controllers/client'),
  templates: require('./views'),
  routes: require('./routes.js')
});

},{"./controllers/client":58,"./routes.js":59,"./views":61,"taunus":21}],57:[function(require,module,exports){
'use strict';

module.exports = function (model, container, route) {
  console.log('Rendered view %s using model:\n%s', route.action, JSON.stringify(model, null, 2));
};

},{}],58:[function(require,module,exports){
module.exports = {
  'home/index': require('./home/index.js')
};
},{"./home/index.js":57}],59:[function(require,module,exports){
'use strict';

module.exports = [
  { route: '/', action: 'home/index' },
  { route: '/canchas/listado/:sport', action: 'place/list' },
  { route: '/canchas/:id', action: 'place/detail' },
  { route: '/canchas', action: 'place/list' },
  { route: '/busqueda', action: 'place/search' }
];

},{}],60:[function(require,module,exports){
var jade = require("jade/runtime");

module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (sports, undefined) {
buf.push("<h2>¿Qué querés jugar?</h2><div class=\"row full-height\"><div class=\"col-md-8 map-select\"><div class=\"select-fix\"><select id=\"sport\" name=\"sport\" ng-model=\"sport\" ng-options=\"t.name for t in sports\" ng-change=\"reloadMap()\" class=\"form-control\"><option value=\"\">[Seleccioná un deporte]");
// iterate sports
;(function(){
  var $$obj = sports;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var sport = $$obj[$index];

buf.push("<option" + (jade.attr("value", sport.id, true, false)) + ">" + (jade.escape(null == (jade_interp = sport.name) ? "" : jade_interp)) + "</option>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var sport = $$obj[$index];

buf.push("<option" + (jade.attr("value", sport.id, true, false)) + ">" + (jade.escape(null == (jade_interp = sport.name) ? "" : jade_interp)) + "</option>");
    }

  }
}).call(this);

buf.push("</option><div id=\"map-home\" class=\"map-canvas\">map</div></select></div></div><div class=\"col-md-4 visible-md visible-lg\"><div class=\"alert alert-success\"><p ng-show=\"count != null\"><strong>{{count}}</strong>&nbsp;complejo{{count == 1 ? '' : 's'}} {{sport ? 'con canchas de ' + sport.name + ' ' : ''}}encontrado{{count == 1 ? '' : 's'}} en nuestra base de datos.</p><p ng-hide=\"count != null\"></p>Buscando ...</div><div class=\"alert alert-info\">Si aún no encontraste tu complejo podés usar el<a href=\"\" ng-click=\"focusSearch()\" class=\"alert-link\">buscador</a>&nbsp;que aparece arriba en la barra de navegación, o bien hacer una<a href=\"/busqueda\" class=\"alert-link\">búsqueda avanzada</a>.</div></div></div><div class=\"row\"><div class=\"col-md-8\"><h3>Canchas por deporte<ul>");
// iterate sports
;(function(){
  var $$obj = sports;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var sport = $$obj[$index];

buf.push("<li><a" + (jade.attr("href", '/canchas/listado/' + sport.url, true, false)) + "><h4>" + (jade.escape(null == (jade_interp = sport.name) ? "" : jade_interp)) + "</h4></a></li><h5>Superficie<ul><li ng-repeat=\"surface in s.surfaces\"><a href=\"/canchas/listado/{{s.url}}?surfaces={{surface}}\">{{surface}}</a><h5 ng-show=\"s.allowPlayers\">Jugadores</h5></li></ul><ul><li ng-repeat=\"players in s.allowedPlayers\"><a href=\"/canchas/listado/{{s.url}}?players={{players}}\">{{players}} jugadores</a></li></ul></h5>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var sport = $$obj[$index];

buf.push("<li><a" + (jade.attr("href", '/canchas/listado/' + sport.url, true, false)) + "><h4>" + (jade.escape(null == (jade_interp = sport.name) ? "" : jade_interp)) + "</h4></a></li><h5>Superficie<ul><li ng-repeat=\"surface in s.surfaces\"><a href=\"/canchas/listado/{{s.url}}?surfaces={{surface}}\">{{surface}}</a><h5 ng-show=\"s.allowPlayers\">Jugadores</h5></li></ul><ul><li ng-repeat=\"players in s.allowedPlayers\"><a href=\"/canchas/listado/{{s.url}}?players={{players}}\">{{players}} jugadores</a></li></ul></h5>");
    }

  }
}).call(this);

buf.push("</ul></h3></div><div class=\"col-md-4\"></div></div>");}.call(this,"sports" in locals_for_with?locals_for_with.sports:typeof sports!=="undefined"?sports:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};
},{"jade/runtime":7}],61:[function(require,module,exports){
module.exports = {
  'layout': require('./layout.jade'),
  'home/index': require('./home/index.jade'),
  'place/detail': require('./place/detail.jade'),
  'place/list': require('./place/list.jade')
};
},{"./home/index.jade":60,"./layout.jade":62,"./place/detail.jade":63,"./place/list.jade":64}],62:[function(require,module,exports){
var jade = require("jade/runtime");

module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (env, partial, sports, title, undefined, year) {
buf.push("<!DOCTYPE html><html ng-app=\"bchz\" ng-class=\"{ &quot;full-screen&quot;: fullScreen }\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=no\"><meta name=\"DESCRIPTION\" content=\"Bochazo\"><title>" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</title>");
if ( env == 'development')
{
buf.push("<link rel=\"stylesheet\" href=\"/styles/hint.css\"><link rel=\"stylesheet\" href=\"/styles/site.css\">");
}
else
{
buf.push("<link rel=\"stylesheet\" href=\"/site.css\">");
}
buf.push("<link rel=\"search\" type=\"application/opensearchdescription+xml\"" + (jade.attr("title", title, true, true)) + " href=\"/opensearch.xml\"></head><body><div role=\"navigation\" ng-controller=\"LayoutCtrl\" class=\"navbar navbar-default navbar-fixed-top\"><div class=\"container\"><div class=\"navbar-header\"><button type=\"button\" data-toggle=\"collapse\" data-target=\".navbar-collapse\" class=\"navbar-toggle\"><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a href=\"/\" class=\"navbar-brand\">" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)) + "</a></div><div class=\"navbar-collapse collapse\"><ul class=\"nav navbar-nav\"><li class=\"dropdown\"><a data-toggle=\"dropdown\" class=\"dropdown-toggle\">Canchas&nbsp;<b class=\"caret\"></b></a><ul role=\"menu\" class=\"dropdown-menu\">");
// iterate sports
;(function(){
  var $$obj = sports;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var sport = $$obj[$index];

buf.push("<li><a" + (jade.attr("href", '/canchas/listado/' + sport.url, true, true)) + ">" + (jade.escape(null == (jade_interp = sport.name) ? "" : jade_interp)) + "</a></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var sport = $$obj[$index];

buf.push("<li><a" + (jade.attr("href", '/canchas/listado/' + sport.url, true, true)) + ">" + (jade.escape(null == (jade_interp = sport.name) ? "" : jade_interp)) + "</a></li>");
    }

  }
}).call(this);

buf.push("</ul></li><li><a href=\"/busqueda\">Búsqueda</a></li><li><a href=\"/mapa\">Mapa</a></li><li class=\"hidden-sm\"><a href=\"/canchas/agregar\">¡Agregar complejo!</a></li></ul><form role=\"search\" class=\"navbar-form navbar-left\"><div class=\"form-group\"><input type=\"search\" ng-model=\"query\" ng-enter=\"search()\" placeholder=\"Buscar\" class=\"form-control\"></div><button type=\"submit\" ng-click=\"search()\" class=\"btn btn-default\"><span class=\"glyphicon glyphicon-search\"></span></button></form><ul class=\"nav navbar-nav navbar-right\"><li><a href=\"/ingresar\">Ingresar</a></li></ul></div></div></div><div class=\"container body-content\"><main>" + (null == (jade_interp = partial) ? "" : jade_interp) + "</main><div class=\"clearfix\"></div><div ng-hide=\"hideFooter\"><hr class=\"visible-md visible-lg\"><footer class=\"visible-md visible-lg\">&copy;" + (jade.escape(null == (jade_interp = year) ? "" : jade_interp)) + "-" + (jade.escape(null == (jade_interp = title) ? "" : jade_interp)));
if ( env == 'development')
{
buf.push(" DEBUG MODE");
}
buf.push("</footer></div></div><script src=\"http://maps.google.com/maps/api/js?sensor=true&amp;language=es\"></script>");
if ( env == 'development')
{
buf.push("<!-- libraries--><script src=\"/components/jquery/dist/jquery.js\"></script><script src=\"/components/bootstrap/js/collapse.js\"></script><script src=\"/components/bootstrap/js/dropdown.js\"></script><script src=\"/components/angular/angular.js\"></script><script src=\"/components/angular-animate/angular-animate.js\"></script><script src=\"/components/angular-route/angular-route.js\"></script><script src=\"/components/angular-resource/angular-resource.js\"></script><script src=\"/components/very-array/src/very-array.js\"></script><!-- extensions--><script src=\"/scripts/extensions/maps.js\"></script><!-- angular js components--><script src=\"/scripts/app/config.js\"></script><!-- services--><script src=\"/scripts/modules/services/fullscreen.js\"></script><script src=\"/scripts/modules/services/geolocation.js\"></script><script src=\"/scripts/modules/services/infowindow.js\"></script><script src=\"/scripts/modules/services/place.js\"></script><script src=\"/scripts/modules/services/sport.js\"></script><!-- mvw--><script src=\"/scripts/whatever/run.js\"></script><script src=\"/scripts/whatever/site/layout.js\"></script><script src=\"/scripts/whatever/site/home.js\"></script><script src=\"/scripts/whatever/site/search.js\"></script><script src=\"/scripts/whatever/site/map.js\"></script><script src=\"/scripts/whatever/place/list.js\"></script><script src=\"/scripts/whatever/place/add.js\"></script><script src=\"/scripts/whatever/place/detail.js\"></script><!-- directives--><script src=\"/scripts/directives/ngEnter.js\"></script><script src=\"/scripts/directives/ngFocusInput.js\"></script><script src=\"/scripts/directives/tagCollection.js\"></script><script src=\"/scripts/directives/tagRemove.js\"></script>");
}
else
{
buf.push("<script src=\"/bchz.js\"></script>");
}
buf.push("</body></html>");}.call(this,"env" in locals_for_with?locals_for_with.env:typeof env!=="undefined"?env:undefined,"partial" in locals_for_with?locals_for_with.partial:typeof partial!=="undefined"?partial:undefined,"sports" in locals_for_with?locals_for_with.sports:typeof sports!=="undefined"?sports:undefined,"title" in locals_for_with?locals_for_with.title:typeof title!=="undefined"?title:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined,"year" in locals_for_with?locals_for_with.year:typeof year!=="undefined"?year:undefined));;return buf.join("");
};
},{"jade/runtime":7}],63:[function(require,module,exports){
var jade = require("jade/runtime");

module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (address, description, detailedSummary, howToArrive, info, phones, tags, undefined) {
buf.push("<div class=\"row place-detail\"><div class=\"col-md-8\"><h2>" + (jade.escape(null == (jade_interp = description) ? "" : jade_interp)) + "</h2>");
if ( (info))
{
buf.push("<p><span class=\"glyphicon glyphicon-info-sign\"></span>" + (jade.escape(null == (jade_interp = info) ? "" : jade_interp)) + "</p>");
}
if ( (address))
{
buf.push("<p><span class=\"glyphicon glyphicon-map-marker\"></span>" + (jade.escape(null == (jade_interp = address) ? "" : jade_interp)) + "</p>");
}
if ( (phones))
{
buf.push("<p class=\"comma-list\"><span class=\"glyphicon glyphicon-phone-alt\"></span>");
// iterate phones
;(function(){
  var $$obj = phones;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var phone = $$obj[$index];

buf.push("<div class=\"comma-list\"><a" + (jade.attr("href", 'tel:' + phone, true, false)) + ">" + (jade.escape(null == (jade_interp = phone) ? "" : jade_interp)) + "</a>" + (jade.escape(null == (jade_interp = phones.indexOf(phone) === phones.length - 1 ? '' : ', ') ? "" : jade_interp)) + "</div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var phone = $$obj[$index];

buf.push("<div class=\"comma-list\"><a" + (jade.attr("href", 'tel:' + phone, true, false)) + ">" + (jade.escape(null == (jade_interp = phone) ? "" : jade_interp)) + "</a>" + (jade.escape(null == (jade_interp = phones.indexOf(phone) === phones.length - 1 ? '' : ', ') ? "" : jade_interp)) + "</div>");
    }

  }
}).call(this);

buf.push("</p>");
}
if ( (howToArrive))
{
buf.push("<p><span class=\"glyphicon glyphicon-road\"></span>" + (jade.escape(null == (jade_interp = howToArrive) ? "" : jade_interp)) + "</p>");
}
buf.push("<div class=\"tags\">");
// iterate tags
;(function(){
  var $$obj = tags;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var tag = $$obj[$index];

buf.push("<label class=\"label label-primary\">" + (jade.escape(null == (jade_interp = tag) ? "" : jade_interp)) + "</label>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var tag = $$obj[$index];

buf.push("<label class=\"label label-primary\">" + (jade.escape(null == (jade_interp = tag) ? "" : jade_interp)) + "</label>");
    }

  }
}).call(this);

buf.push("</div>");
// iterate detailedSummary
;(function(){
  var $$obj = detailedSummary;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var group = $$obj[$index];

buf.push("<div><h3>" + (jade.escape(null == (jade_interp = group.key + ' - ' + group.length + ' cancha' + (group.length > 1 ? 's' : '')) ? "" : jade_interp)) + "</h3><ul>");
// iterate group
;(function(){
  var $$obj = group;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var court = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = court.length + ' cancha' + (court.length > 1 ? 's' : '') + ' de ' + court.key.surface) ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.isIndoor ? ', techada' + (court.length > 1 ? 's' : '') : '') ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.players ? ', para ' + court.key.players + ' jugadores' : '') ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var court = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = court.length + ' cancha' + (court.length > 1 ? 's' : '') + ' de ' + court.key.surface) ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.isIndoor ? ', techada' + (court.length > 1 ? 's' : '') : '') ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.players ? ', para ' + court.key.players + ' jugadores' : '') ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

buf.push("</ul></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var group = $$obj[$index];

buf.push("<div><h3>" + (jade.escape(null == (jade_interp = group.key + ' - ' + group.length + ' cancha' + (group.length > 1 ? 's' : '')) ? "" : jade_interp)) + "</h3><ul>");
// iterate group
;(function(){
  var $$obj = group;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var court = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = court.length + ' cancha' + (court.length > 1 ? 's' : '') + ' de ' + court.key.surface) ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.isIndoor ? ', techada' + (court.length > 1 ? 's' : '') : '') ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.players ? ', para ' + court.key.players + ' jugadores' : '') ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var court = $$obj[$index];

buf.push("<li>" + (jade.escape(null == (jade_interp = court.length + ' cancha' + (court.length > 1 ? 's' : '') + ' de ' + court.key.surface) ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.isIndoor ? ', techada' + (court.length > 1 ? 's' : '') : '') ? "" : jade_interp)) + (jade.escape(null == (jade_interp = court.key.players ? ', para ' + court.key.players + ' jugadores' : '') ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

buf.push("</ul></div>");
    }

  }
}).call(this);

buf.push("</div><div class=\"col-md-4\"><div id=\"map-detail\" ng-show=\"showMap\" class=\"map-canvas\"></div></div></div><a href=\"/canchas\" class=\"btn btn-default\">Volver</a>");}.call(this,"address" in locals_for_with?locals_for_with.address:typeof address!=="undefined"?address:undefined,"description" in locals_for_with?locals_for_with.description:typeof description!=="undefined"?description:undefined,"detailedSummary" in locals_for_with?locals_for_with.detailedSummary:typeof detailedSummary!=="undefined"?detailedSummary:undefined,"howToArrive" in locals_for_with?locals_for_with.howToArrive:typeof howToArrive!=="undefined"?howToArrive:undefined,"info" in locals_for_with?locals_for_with.info:typeof info!=="undefined"?info:undefined,"phones" in locals_for_with?locals_for_with.phones:typeof phones!=="undefined"?phones:undefined,"tags" in locals_for_with?locals_for_with.tags:typeof tags!=="undefined"?tags:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};
},{"jade/runtime":7}],64:[function(require,module,exports){
var jade = require("jade/runtime");

module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (count, hasParams, list, params, sports, undefined) {
var sport = sports.filter(function (s) { return s.url == params.sport }).map(function (s) { return s.name })[0] || params.sport
buf.push("<h2>" + (jade.escape(null == (jade_interp = params && sport ? 'Canchas de ' + sport : params ? 'Búsqueda de canchas' : 'Listado de canchas') ? "" : jade_interp)) + "</h2><div class=\"row\"><div class=\"col-md-8\"><div" + (jade.cls([(count > 0 ? 'alert alert-success' : 'alert alert-danger')], [true])) + "><p><strong>" + (jade.escape(null == (jade_interp = count) ? "" : jade_interp)) + "</strong>" + (jade.escape(null == (jade_interp = ' complejo' + (count == 1 ? '' : 's') + ' encontrado' + (count == 1 ? '' : 's') + '.') ? "" : jade_interp)) + "</p>");
if ( (hasParams))
{
buf.push("<p>" + (jade.escape(null == (jade_interp = (count === 0 ? 'Parámetros utilizados para la búsqueda' : 'Mostrando') + ':') ? "" : jade_interp)) + "</p><ul>");
if ( (params.query))
{
buf.push("<li>Que contengan la palabra&nbsp;<strong>" + (jade.escape(null == (jade_interp = params.query) ? "" : jade_interp)) + "</strong></li>");
}
if ( (sport))
{
buf.push("<li>Canchas de&nbsp;" + (jade.escape(null == (jade_interp = sport) ? "" : jade_interp)) + "</li>");
}
if ( (params.locations && params.locations.length))
{
buf.push("<li>En&nbsp;");
// iterate params.locations
;(function(){
  var $$obj = params.locations;
  if ('number' == typeof $$obj.length) {

    for (var index = 0, $$l = $$obj.length; index < $$l; index++) {
      var location = $$obj[index];

buf.push("<span class=\"capitalize\">" + (jade.escape(null == (jade_interp = location) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = index === params.locations.length - 1 ? '' : index === params.locations.length - 2 ? ' o ' : ', ') ? "" : jade_interp)) + "</span>");
    }

  } else {
    var $$l = 0;
    for (var index in $$obj) {
      $$l++;      var location = $$obj[index];

buf.push("<span class=\"capitalize\">" + (jade.escape(null == (jade_interp = location) ? "" : jade_interp)) + "</span><span>" + (jade.escape(null == (jade_interp = index === params.locations.length - 1 ? '' : index === params.locations.length - 2 ? ' o ' : ', ') ? "" : jade_interp)) + "</span>");
    }

  }
}).call(this);

buf.push("</li>");
}
if ( (params.players && params.players.length))
{
buf.push("<li>Para&nbsp;");
// iterate params.players
;(function(){
  var $$obj = params.players;
  if ('number' == typeof $$obj.length) {

    for (var index = 0, $$l = $$obj.length; index < $$l; index++) {
      var player = $$obj[index];

buf.push("<span>" + (jade.escape(null == (jade_interp = player + (index == params.players.length - 1 ? '' : index === params.players.length - 2 ? (params.players[index + 1] == 8 ? ' u ' : ' o ') : ', ')) ? "" : jade_interp)) + "</span>");
    }

  } else {
    var $$l = 0;
    for (var index in $$obj) {
      $$l++;      var player = $$obj[index];

buf.push("<span>" + (jade.escape(null == (jade_interp = player + (index == params.players.length - 1 ? '' : index === params.players.length - 2 ? (params.players[index + 1] == 8 ? ' u ' : ' o ') : ', ')) ? "" : jade_interp)) + "</span>");
    }

  }
}).call(this);

buf.push("&nbsp;jugadores</li>");
}
buf.push("<li ng-show=\"params.surfaces.length\">Superficie de<span ng-repeat=\"surface in params.surfaces\" class=\"lowercase\">{{surface}}{{$last ? '' : $index == (params.surfaces.length - 2) ? ' o ' : ', '}}</span></li><li ng-show=\"params.tags.length\">Con<label ng-class=\"{ &quot;label-success&quot;: count &gt; 0, &quot;label-danger&quot;: count == 0 }\" ng-repeat-start=\"tag in params.tags\" class=\"label\">{{tag}}</label><span ng-repeat-end=\"\">{{$last ? '' : $index == (params.tags.length - 2) ? ' o ' : ', '}}</span></li></ul>");
}
buf.push("<p class=\"new-search\">Hacé click&nbsp;<a" + (jade.attr("href", ('/busqueda' + (params.url ? '?' + params.url : '')), true, false)) + " class=\"alert-link\">acá</a>&nbsp;para realizar una" + (jade.escape(null == (jade_interp = hasParams ? ' nueva búsqueda.' : ' búsqueda avanzada.') ? "" : jade_interp)) + "</p></div><div class=\"alert alert-info\"><p ng-show=\"userAddress &amp;&amp; count &gt; 0\">Los complejos se listarán mostrando primero los más cercanos a<a href=\"\" data-hint=\"{{userAddress}}\" class=\"alert-link hint--top hint--rounded\">tú posición</a>.</p><p>Acordate que también podés buscar tu complejo en el<a href=\"\" ng-click=\"redirectTo(&quot;/mapa&quot;)\" class=\"alert-link hint--top hint--rounded\">mapa de canchas</a>.</p></div>");
// iterate list
;(function(){
  var $$obj = list;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var place = $$obj[$index];

buf.push("<article class=\"place\"><div class=\"content\"><a" + (jade.attr("href", '/canchas/' + place._id, true, false)) + "><h3>" + (jade.escape(null == (jade_interp = place.description) ? "" : jade_interp)) + "</h3></a><ul>");
if ( place.address)
{
buf.push("<li><span class=\"glyphicon glyphicon-map-marker\"></span>" + (jade.escape(null == (jade_interp = place.address) ? "" : jade_interp)) + "</li>");
}
if ( place.phones)
{
buf.push("<li><span class=\"glyphicon glyphicon-phone-alt\"></span>");
// iterate place.phones
;(function(){
  var $$obj = place.phones;
  if ('number' == typeof $$obj.length) {

    for (var index = 0, $$l = $$obj.length; index < $$l; index++) {
      var phone = $$obj[index];

buf.push("<div class=\"comma-list\"><a" + (jade.attr("href", 'tel:' + phone, true, false)) + ">" + (jade.escape(null == (jade_interp = phone) ? "" : jade_interp)) + "</a>" + (jade.escape(null == (jade_interp = index === place.phones.length - 1 ? '' : ', ') ? "" : jade_interp)) + "</div>");
    }

  } else {
    var $$l = 0;
    for (var index in $$obj) {
      $$l++;      var phone = $$obj[index];

buf.push("<div class=\"comma-list\"><a" + (jade.attr("href", 'tel:' + phone, true, false)) + ">" + (jade.escape(null == (jade_interp = phone) ? "" : jade_interp)) + "</a>" + (jade.escape(null == (jade_interp = index === place.phones.length - 1 ? '' : ', ') ? "" : jade_interp)) + "</div>");
    }

  }
}).call(this);

buf.push("</li>");
}
// iterate place.summary
;(function(){
  var $$obj = place.summary;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var summary = $$obj[$index];

buf.push("<li><span class=\"glyphicon glyphicon-asterisk\"></span>" + (jade.escape(null == (jade_interp = summary.length + ' cancha' + (summary.length > 1 ? 's' : '') + ' de ' + summary.key) ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var summary = $$obj[$index];

buf.push("<li><span class=\"glyphicon glyphicon-asterisk\"></span>" + (jade.escape(null == (jade_interp = summary.length + ' cancha' + (summary.length > 1 ? 's' : '') + ' de ' + summary.key) ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

if ( (place.tags.length))
{
buf.push("<li class=\"tags\">");
// iterate place.tags
;(function(){
  var $$obj = place.tags;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var tag = $$obj[$index];

buf.push("<label class=\"label label-primary\">" + (jade.escape(null == (jade_interp = tag) ? "" : jade_interp)) + "</label>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var tag = $$obj[$index];

buf.push("<label class=\"label label-primary\">" + (jade.escape(null == (jade_interp = tag) ? "" : jade_interp)) + "</label>");
    }

  }
}).call(this);

buf.push("</li>");
}
buf.push("</ul></div></article>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var place = $$obj[$index];

buf.push("<article class=\"place\"><div class=\"content\"><a" + (jade.attr("href", '/canchas/' + place._id, true, false)) + "><h3>" + (jade.escape(null == (jade_interp = place.description) ? "" : jade_interp)) + "</h3></a><ul>");
if ( place.address)
{
buf.push("<li><span class=\"glyphicon glyphicon-map-marker\"></span>" + (jade.escape(null == (jade_interp = place.address) ? "" : jade_interp)) + "</li>");
}
if ( place.phones)
{
buf.push("<li><span class=\"glyphicon glyphicon-phone-alt\"></span>");
// iterate place.phones
;(function(){
  var $$obj = place.phones;
  if ('number' == typeof $$obj.length) {

    for (var index = 0, $$l = $$obj.length; index < $$l; index++) {
      var phone = $$obj[index];

buf.push("<div class=\"comma-list\"><a" + (jade.attr("href", 'tel:' + phone, true, false)) + ">" + (jade.escape(null == (jade_interp = phone) ? "" : jade_interp)) + "</a>" + (jade.escape(null == (jade_interp = index === place.phones.length - 1 ? '' : ', ') ? "" : jade_interp)) + "</div>");
    }

  } else {
    var $$l = 0;
    for (var index in $$obj) {
      $$l++;      var phone = $$obj[index];

buf.push("<div class=\"comma-list\"><a" + (jade.attr("href", 'tel:' + phone, true, false)) + ">" + (jade.escape(null == (jade_interp = phone) ? "" : jade_interp)) + "</a>" + (jade.escape(null == (jade_interp = index === place.phones.length - 1 ? '' : ', ') ? "" : jade_interp)) + "</div>");
    }

  }
}).call(this);

buf.push("</li>");
}
// iterate place.summary
;(function(){
  var $$obj = place.summary;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var summary = $$obj[$index];

buf.push("<li><span class=\"glyphicon glyphicon-asterisk\"></span>" + (jade.escape(null == (jade_interp = summary.length + ' cancha' + (summary.length > 1 ? 's' : '') + ' de ' + summary.key) ? "" : jade_interp)) + "</li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var summary = $$obj[$index];

buf.push("<li><span class=\"glyphicon glyphicon-asterisk\"></span>" + (jade.escape(null == (jade_interp = summary.length + ' cancha' + (summary.length > 1 ? 's' : '') + ' de ' + summary.key) ? "" : jade_interp)) + "</li>");
    }

  }
}).call(this);

if ( (place.tags.length))
{
buf.push("<li class=\"tags\">");
// iterate place.tags
;(function(){
  var $$obj = place.tags;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var tag = $$obj[$index];

buf.push("<label class=\"label label-primary\">" + (jade.escape(null == (jade_interp = tag) ? "" : jade_interp)) + "</label>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var tag = $$obj[$index];

buf.push("<label class=\"label label-primary\">" + (jade.escape(null == (jade_interp = tag) ? "" : jade_interp)) + "</label>");
    }

  }
}).call(this);

buf.push("</li>");
}
buf.push("</ul></div></article>");
    }

  }
}).call(this);

if ( (count > list.length))
{
buf.push("<a style=\"width: 200px;\" ng-click=\"showMore()\" ng-class=\"{ disabled: loading }\"" + (jade.attr("href", ('/canchas?' + params.next), true, false)) + " class=\"center-block btn btn-primary btn-show-more\">Mostrar más</a>");
}
buf.push("</div><div class=\"col-md-4\"><div class=\"alert alert-info\">¿Querés agregar un complejo a nuestra base de datos? Agregalo haciendo click<a href=\"/canchas/agregar\" class=\"alert-link\">acá</a>.</div></div></div>");}.call(this,"count" in locals_for_with?locals_for_with.count:typeof count!=="undefined"?count:undefined,"hasParams" in locals_for_with?locals_for_with.hasParams:typeof hasParams!=="undefined"?hasParams:undefined,"list" in locals_for_with?locals_for_with.list:typeof list!=="undefined"?list:undefined,"params" in locals_for_with?locals_for_with.params:typeof params!=="undefined"?params:undefined,"sports" in locals_for_with?locals_for_with.sports:typeof sports!=="undefined"?sports:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
};
},{"jade/runtime":7}]},{},[56]);
