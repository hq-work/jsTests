// Crutches for IE8
if (Array && typeof Array.prototype["filter"] == "undefined") {
	Array.prototype.filter = function (fun) {
		'use strict';

		if (this === void 0 || this === null) {
			throw new TypeError();
		}

		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun !== 'function') {
			throw new TypeError();
		}

		var res = [];
		var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
		for (var i = 0; i < len; i++) {
			if (i in t) {
				var val = t[i];

				if (fun.call(thisArg, val, i, t)) {
					res.push(val);
				}
			}
		}

		return res;
	};
}

if (!String.prototype.endsWith) {
  Object.defineProperty(String.prototype, 'endsWith', {
    value: function(searchString, position) {
      var subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    }
  });
}

if(typeof UnitTestsApplication == 'undefined') window['UnitTestsApplication'] = {};

UnitTestsApplication.Storage = function() {
	this.ls = this._getLocalStorage();
};

UnitTestsApplication.Storage.prototype = {
	
	/*getModuleIndexesForSingleMode: function() {
		return this._getArray(this._SINGLE_MODE_MODULES_KEY);
	},
	setModuleIndexesForSingleMode: function(indexes) {
		this._setArray(this._SINGLE_MODE_MODULES_KEY, indexes);
	},
	*/
	
	_getArray: function(key) {
		var items = this.ls.getItem(key);
		return items == null ? [] : items.split(',');
	},
	_setArray: function(key, items) {
		if (items.length > 0) {
			this.ls.setItem(key, items.join(','));
		} else {
			this.ls.removeItem(key);
		}
	},
	_getLocalStorage: function() {
		if (typeof window.localStorage == "object") {
			return window.localStorage;
		} else if (typeof window.globalStorage == "object") {
			return window.globalStorage[location.host];
		} else {
			return { getItem: function() { return null; }, setItem: function() { return; }, removeItem: function() { return; } };
		}
	}
};

UnitTestsApplication.Helper =
{	// required UnitTestsApplication.Storage

	_storage : new UnitTestsApplication.Storage(),
	getStorage: function() {
		return UnitTestsApplication.Helper._storage;
	},
	formatErrorResponse: function (response, status, message) {
		var msg;
		if (response.error) {
			if (typeof response.error === 'object'){
				msg = response.error.message;
			}
			else if (typeof response.error !== 'function'){
				var err = response.error;

				if (err.charAt && err.charAt(0) == '<') {
					var tags = ["<META ", "<!DOCTYPE ", "<HTML"];

					for (var a = 0; a < tags.length; a++) {
						if (err.slice(0, tags[a].length).toUpperCase() == tags[a]) break;
					}
					if (a < tags.length) {
						err = /<title>\s*([\d\.]+[\s\-]+)?([\.\w\d\t\f ]*)\s*<\//i.exec(err);
						err = err ? ": " + err[2] : "";

						if (err)
							err = "HTTP Error " + response.metadata.statusCode + err;
						else
							err = response.error;
					}
				}

				msg = err;
			}
		}

		msg = msg || message || "Failed!";

		if (response.error){
			if(response.error.details) {
				for (var i = 0; i < response.error.details.length; i++) {
					var d = response.error.details[i];
					msg += "\n" + d.tag + ": " + d.message;
				}
			}
			if(response.error.detailXml){
				var regex = /<error\s[.\s\=\w\"]*Message="([^"]*)/ig;
				var matches = [];
				var match;
				while (match = regex.exec(response.error.detailXml)) {
					matches.push(match[1]);
				}
				if(matches.length)
					msg += "\n" + matches.join("\n");
			}
		}
		return msg;
	},
	htmlEncode: function (html) {
		return document.createElement('a').appendChild(document.createTextNode(html)).parentNode.innerHTML;
	},
	
	milisecToMinSecs: function (msec) {
		var mins = msec / 60000;
		var intMins = Math.floor(mins);
		var secs = (mins - intMins) * 60;
		var intSecs = Math.floor(secs);

		return { minutes: intMins, seconds: intSecs, msecs: Math.round((secs - intSecs) * 1000) };
	},

	formatMinSecs: function (minsec, m) {
		var str = '';
		if (minsec.minutes) {
			str = minsec.minutes + (m || ':');
			if (minsec.seconds < 10)
				str += "0";
		}

		str += minsec.seconds + ".";
		if (minsec.msecs < 100)
			str += "0";
		if (minsec.msecs < 10)
			str += "0";

		return str + minsec.msecs;
	},
	
	formatRuntime: function (msec, m) {
		return this.formatMinSecs(this.milisecToMinSecs(msec), m);
	},
	errorHandler: function (response, status, message, context, donotStart) {
		var msg = UnitTestsApplication.Helper.formatErrorResponse(response, status, message);

		ok(false, msg);
		if (!donotStart) start();
	},
	errorHandlerAjax: function (result, status, errorThrown, donotStart) {
		//check for success params
		if (!errorThrown || jQuery.type(errorThrown) == "string" || typeof errorThrown["status"] == "undefined") {
			result = envianceSdk._private._processError(result);
		}
		UnitTestsApplication.Helper.errorHandler(result, status, errorThrown || result.status, null, donotStart);
	},
	getDefault : function (app) {
		return {
			formatErrorResponse: this.formatErrorResponse,
			errorHandler: this.errorHandler,
			errorHandlerAjax: this.errorHandlerAjax,
			successHandler: this.successHandler,
			accessUserName: app && app.systemManager.user.login,
			accessUserId: app && app.systemManager.user.id,
			originalSessionId : envianceSdk.getSessionId(),
			originalSystemId : envianceSdk.getSystemId()
		};
	},
		// Based on Java's String.hashCode, a simple but not
	// rigorously collision resistant hashing function
	generateHash: function( module, testName ) {
		var hex,
			i = 0,
			hash = 0,
			str = module + "\x1C" + testName,
			len = str.length;

		for ( ; i < len; i++ ) {
			hash  = ( ( hash << 5 ) - hash ) + str.charCodeAt( i );
			hash |= 0;
		}

		// Convert the possibly negative integer hash code into an 8 character hex string, which isn't
		// strictly necessary but increases user understanding that the id is a SHA-like hash
		hex = ( 0x100000000 + hash ).toString( 16 );
		if ( hex.length < 8 ) {
			hex = "0000000" + hex;
		}

		return hex.slice( -8 );
	}
};
	