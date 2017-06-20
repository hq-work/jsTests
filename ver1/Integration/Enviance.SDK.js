//ReSharper disable UseOfImplicitGlobalInFunctionScope

//
//References check
//

if (typeof jQuery == "undefined") {
	var message = "jQuery library is required to run Enviance.SDK javascript library";
	alert(message); throw new Error(message);
}

if (window.JSON == null || window.JSON.stringify == null || window.JSON.parse == null) {
	var message = "json2.js  library is required to run Enviance.SDK javascript library";
	alert(message); throw new Error(message);
}

envianceRegisterNamespace = function(ns) {
	var nsParts = ns.split(".");
	var root = window;

	for (var i = 0; i < nsParts.length; i++) {
		if (typeof root[nsParts[i]] == "undefined")
			root[nsParts[i]] = new Object();

		root = root[nsParts[i]];
	}
};

//
//Private declarations
//

envianceRegisterNamespace("envianceSdk");

envianceSdk._RequestContext = function(type, url, data, headers, onsuccess, onerror) {
	this.type = type;
	this.url = url;
	this.data = data;
	this.headers = headers;
	this.onsuccess = onsuccess;
	this.onerror = onerror;
};

envianceSdk._CrossDomainSupport = function() {
	this.rpcSocket = null;
};
envianceSdk._CrossDomainSupport.prototype = {
	rpcSocket: null,
	isRequired: function(url) {
		return this.isAllowed() && this.isCrossDomainUrl(url);
	},
	isAllowed: function() {
		if (envianceSdk._crossDomainWorkaround == "always") {
			return true;
		} else if (envianceSdk._crossDomainWorkaround == "off") {
			return false;
		} else if (envianceSdk._crossDomainWorkaround == "ifneeded") {
			return !jQuery.support.cors || jQuery.browser.mozilla || jQuery.browser.opera ||
				(jQuery.browser.webkit && navigator.userAgent.indexOf("Chrome") == -1);
		} else {
			throw new Error("Illegal settings: unknown envianceSdk._crossDomainWorkaround value.");
		}
	},
	isCrossDomainUrl: function(url) {
		if (url[0] == "/" || url[0] == ".") {
			return false;
		}
		var reUri = /^((http.?:)\/\/([^:\/\s]+)(:\d+)*)/; // returns groups for protocol (2), domain (3) and port (4)

		var m = url.toLowerCase().match(reUri);
		var proto = m[2], domain = m[3], port = m[4] || "";
		if ((proto == "http:" && port == ":80") || (proto == "https:" && port == ":443")) {
			port = "";
		}
		var location = proto + "//" + domain + port + "/";
		return document.location.href.indexOf(location) == -1;
	},
	ajax: function(options, callback, onerror) {
		this._createOrGetSocket(function(socket) {
			socket.xhrRequest(options,
				function(response) {
					callback({ xhr: response.jqXhr, status: response.textStatus, result: response.data });
				},
				function(response) {
					onerror({
						message: {
							response: response.message.jqXhr,
							status: response.message.textStatus,
							message: response.message.errorThrown
						}
					});
				});
		}, onerror);
	},
	_createOrGetSocket: function(callback, onerror) {
		if (this.rpcSocket != null) {
			callback(this.rpcSocket);
			return;
		}

		var self = this;

		//load easyXDM.js
		if (typeof easyXDM == "undefined") {
			jQuery.ajax({
				url: envianceSdk._buildUrl("crossdomain/easyXDM.js"),
				dataType: "script",
				cache: true,
				success: function(data, textStatus) {
					if (typeof easyXDM == "undefined") {
						var msg = "Failed to setup crossdomain support. Failed to execute easyXDM.js. Status=" + textStatus;
						envianceSdk._processError(msg, 1250, msg, onerror);
					}
					self._createSocket(callback, onerror);
				},
				error: function(jqXhr, textStatus) {
					var msg = "Failed to setup crossdomain support. Failed to load easyXDM.js. Status=" + textStatus;
					envianceSdk._processError(msg, textStatus, msg, onerror);
				}
			});
		} else {
			this._createSocket(callback, onerror);
		}
	},
	_createSocket: function(callback) {
		//setup easyXDM socket
		envianceSdk.rpcSocket = new easyXDM.Rpc({
			swf: envianceSdk._buildUrl("crossdomain/easyxdm.swf"),
			remote: envianceSdk._buildUrl("crossdomain/cors.htm")
		}, {
			remote: {
				xhrRequest: {} //interface
			},
			serializer: {
				stringify: function(object) {
					return JSON.stringify(object);
				},
				parse: function(json) {
					return JSON.parse(json);
				}
			}
		});
		callback(envianceSdk.rpcSocket);
	}
};

//used by default
envianceSdk._SimpleVariablesManager = function() {
	this.SESSION_KEY = "envianceSdk.sessionId";
	this.SYSTEM_KEY = "envianceSdk.systemId";
	this.vars = new Object();
};

envianceSdk._SimpleVariablesManager.prototype = {
	readSessionId: function() {
		return this.vars[this.SESSION_KEY];
	},
	writeSessionId: function(sessionId) {
		this.vars[this.SESSION_KEY] = sessionId;
	},
	readSystemId: function() {
		return this.vars[this.SYSTEM_KEY];
	},
	writeSystemId: function(systemId) {
		this.vars[this.SYSTEM_KEY] = systemId;
	}
};

//useful in standalone mode
envianceSdk._CookieVariablesManager = function() {
	this.SESSION_KEY = "envianceSdk.sessionId";
	this.SYSTEM_KEY = "envianceSdk.systemId";
};

envianceSdk._CookieVariablesManager.prototype = {
	readSessionId: function() {
		return this.getCookieValue(this.SESSION_KEY);
	},
	writeSessionId: function(sessionId) {
		this.saveCookieValue(this.SESSION_KEY, sessionId, false);
	},
	readSystemId: function() {
		return this.getCookieValue(this.SYSTEM_KEY);
	},
	writeSystemId: function(systemId) {
		this.saveCookieValue(this.SYSTEM_KEY, systemId, false);
	},
	saveCookieValue: function(key, value, persistent) {
		if (value != null) {
			var cookieVal = key + "=" + escape(value);
			if (persistent == true) {
				var time = new Date();
				time.setFullYear(time.getFullYear() + 10);
				cookieVal += ";expires=" + time.toUTCString();

			}
			document.cookie = cookieVal + ";path=/;";
		} else {
			document.cookie = key + "=;path=/;expires=Fri, 31 Dec 1950 23:59:59 GMT;";
		}
	},
	getCookieValue: function(name) {
		var search = name + "=";
		if (document.cookie.length > 0) { // if there are any cookies
			var offset = document.cookie.indexOf(search);
			while (offset != -1) {
				if (offset > 0) {
					var ch = document.cookie.charAt(offset - 1);
					if (ch != ";" && ch != " ") {
						offset = document.cookie.indexOf(search, offset + 1);
						continue;
					}
				}
				offset += search.length;
				// set index of beginning of value
				var end = document.cookie.indexOf(";", offset);
				// set index of end of cookie value
				if (end == -1)
					end = document.cookie.length;
				return unescape(document.cookie.substring(offset, end));
			}
		}
		return null;
	}
};

//Detect additional error status: "heavyload", "requestlimit", "unauthorized"
envianceSdk._GenericErrorHandler = function() { };
envianceSdk._GenericErrorHandler.prototype = {
	detectStatus: function(xhr, status, message) {
		var isDisconnected = false;
		var text = "";
		if (xhr != null) {
			try {
				if (xhr.status == 12029 || xhr.status == 12007) {
					isDisconnected = true;
				}
				if (xhr.responseText != null) {
					text = xhr.responseText;
				}
			} catch (communicationError) {
				isDisconnected = true;
			}
		}
		if (isDisconnected) {
			return "timeout";
		}
		if (text.indexOf("heavy load") != -1 || text.indexOf("Timeout expired") != -1) {
			return "heavyload";
		}
		if (xhr.status == 401) {
			return "unauthorized";
		}
		if (xhr.status == 503) {
			return "requestlimit";
		}
		return status;
	},
	handle: function(xhr, status, message, onsuccess, onerror, context) {
		if (envianceSdk._resubmitConfirmationOnError) {
			if (status == "timeout") {
				if (confirm("An error occurred attempting to connect to the Enviance servers. This may be due to a scheduled period of downtime. " +
					"Would you like to try your operation again?")) {
					this._resubmitAfterError(context, onsuccess, onerror);
					return true;
				}
			} if (status == "requestlimit") {
				var error = JSON.parse(xhr.responseText);
				//response.getResponseHeader("Retry-After") will not work here becouse of CORS. Need direct server-side support to ahve it inside error json.
				if (confirm("You have reached the request limits for this system. Would you like to try your operation again?")) {
					this._resubmitAfterError(context, onsuccess, onerror);
					return true;
				}
			} else if (status == "heavyload") {
				if (confirm("Our servers are experiencing an unusually heavy load. Would you like to try your operation again?")) {
					this._resubmitAfterError(context, onsuccess, onerror);
					return true;
				}
			}
		}
		if (envianceSdk._refreshPageOnUnauthorized) {
			if (status == "unauthorized") {
				location.reload(true);
				return true;
			}
		}
		return false;
	},
	_resubmitAfterError: function(context, onsuccess, onerror) {
		jQuery.ajax
		({
			type: "POST",
			url: context.url,
			data: context.data,
			contentType: "application/json; charset=UTF-8",
			crossdomain: false,
			async: true,
			dataType: "json",
			beforeSend: function(xhr, form, options) {
				context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
				return envianceSdk._beforeSend(xhr, context);
			},
			success: function(response) {
				if (onsuccess != null) {
					onsuccess(response);
				}
			},
			error: function(xhr, status, message) {
				envianceSdk._processError(xhr, status, message, onsuccess, onerror, context);
			}
		});
	}
};

envianceSdk._buildUrl = function(url) {
	if (envianceSdk._baseAddress == null) {
		throw new Error("_baseAddress is not set. Can not build URL.");
	}
	if (url.charAt(0) != "/") {
		url = "/" + url;
	}
	var base = envianceSdk._baseAddress;
	if (base.charAt(base.length - 1) == "/") {
		base = base.substr(0, base.length - 1);
	}
	return base + url;
};

envianceSdk._buildWebAppUrl = function(url) {
	if (envianceSdk._webAppVirtualPath == null) {
		throw new Error("_webAppVirtualPath is not set. Can not build URL.");
	}
	if (url.charAt(0) != "/") {
		url = "/" + url;
	}
	var base = envianceSdk._webAppVirtualPath;
	if (base.charAt(base.length - 1) == "/") {
		base = base.substr(0, base.length - 1);
	}
	return base + url;
};

envianceSdk._createContext = function(xhr, form, options, onsuccess, onerror) {
	return new envianceSdk._RequestContext(form.type, form.url, form.data, {}, onsuccess, onerror);
};

envianceSdk._beforeSend = function(xhr, context, denySystemId) {
	if (xhr == null || context == null) {
		throw new Error("Argument Exception");
	}
	var headers = envianceSdk._buildRequestHeaders(denySystemId);
	if (envianceSdk._crossDomain.isRequired(context.url)) {
		//crossdomain request host - try to use EasyXDM lib
		envianceSdk._crossDomain.ajax({
			type: context.type,
			url: context.url,
			data: context.data,
			headers: headers
		}, function(response) {
			if (context.onsuccess != null) {
				context.onsuccess(response.result, response.status, response.xhr);
			}
		}, function(response) {
			if (context.onerror != null) {
				context.onerror(response.message.response, response.message.status, response.message.message);
			}
		});
		xhr.success = function() { };
		xhr.error = function() { };
		return false; //stops native ajax request
	} else {
		for (var header in headers) {
			xhr.setRequestHeader(header, headers[header]);
		}
		return true;
	}
};

envianceSdk._buildRequestHeaders = function(denySystemId) {
	var headers = new Object();

	var sessionId = envianceSdk.getSessionId();
	if (sessionId != null) {
		headers["Authorization"] = "Enviance " + sessionId;
	}

	var systemId = envianceSdk.getSystemId();
	if (systemId != null && denySystemId !== true) {
		headers["EnvApi-SystemId"] = systemId;
	}

	var _packageId = envianceSdk._packageId;
	if (_packageId != null) {
		headers["EnvApi-PackageId"] = _packageId;
	}

	return headers;
};

envianceSdk._cleanupForSerialization = function(obj) {
	return envianceSdk._preProcess(obj);
};

envianceSdk._preProcess = function(obj, copyObj) {
	var c = copyObj || {};
	for (var i in obj) {
		if (typeof obj[i] === 'function') {
			continue;
		}
		if (obj[i] != null && typeof obj[i] === 'object') {
			if (obj[i] instanceof Date) {
				c[i] = envianceSdk.IsoDate.toLocalString(obj[i]);
			} else {
				c[i] = (obj[i].constructor === Array) ? [] : {};
				envianceSdk._preProcess(obj[i], c[i]);
			}
		} else {
			c[i] = obj[i];
		}
	}
	return c;
};

envianceSdk._processResult = function(response, xhr) {
	var resultResponse = { metadata: envianceSdk._buildMetadata(xhr) };

	var isDateString = function(value) {
		return value != null && typeof value === "string" && envianceSdk.IsoDate.exactMatch(value);
	};

	// Check for primitive value in the response
	if (typeof response !== "object") {
		if (isDateString(response)) {
			resultResponse.result = envianceSdk.IsoDate.parse(response);
		} else {
			resultResponse.result = response;
		}
	} else {
		var traverse = function(obj, callback) {
			if (obj == null) {
				return;
			}

			for (var propName in obj) {
				callback(obj, propName);

				var propValue = obj[propName];
				if (typeof propValue === "object") {
					traverse(propValue, callback);
				}
			}
		};

		traverse(response, function(obj, propName) {
			var value = obj[propName];
			if (isDateString(value)) {
				obj[propName] = envianceSdk.IsoDate.parse(value);
			}
		});

		resultResponse.result = response;
	}

	return resultResponse;
};

envianceSdk._processError = function(xhr, status, message, onsuccess, onerror, context) {
	status = envianceSdk._errorHandler.detectStatus(xhr, status, message);
	if (envianceSdk._errorHandler.handle(xhr, status, message, onsuccess, onerror, context)) {
		return;
	}

	if (onerror != null) {
		var errorResponse = { metadata: envianceSdk._buildMetadata(xhr) };
		try {
			errorResponse.error = JSON.parse(xhr.responseText);
		} catch (e) {
			errorResponse.error = xhr.responseText;
		}
		onerror(errorResponse, status, message, context);
	}
};

envianceSdk._buildMetadata = function(xhr) {
	var metadata = { statusCode: xhr.status };

	var setMetadataProperty = function(propName, value) {
		if (value) {
			metadata[propName] = value;
		}
	};

	if (xhr.getResponseHeader != null) {
		setMetadataProperty('version', xhr.getResponseHeader('EnvApi-Version'));
		setMetadataProperty('remainingCalls', parseInt(xhr.getResponseHeader('EnvApi-Remaining-Calls')));
		setMetadataProperty('remainingInterval', parseInt(xhr.getResponseHeader('EnvApi-Remaining-Interval')));
		setMetadataProperty('warnings', decodeURIComponent(xhr.getResponseHeader('EnvApi-Warnings')));
		setMetadataProperty('location', xhr.getResponseHeader('Location'));
	} else {
		setMetadataProperty('version', xhr.headers['EnvApi-Version']);
		setMetadataProperty('remainingCalls', parseInt(xhr.headers['EnvApi-Remaining-Calls']));
		setMetadataProperty('remainingInterval', parseInt(xhr.headers['EnvApi-Remaining-Interval']));
		setMetadataProperty('warnings', decodeURIComponent(xhr.headers['EnvApi-Warnings']));
		setMetadataProperty('location', xhr.headers['Location']);
	}

	return metadata;
};

//
// Cross Form processing
//
envianceSdk._crossFormSubmit = function(fileinputs, url, data, onsuccess, onerror) {
	var container = document.getElementById('cross_form_container');

	if (container == null) {
		container = document.createElement('DIV');
		container.id = 'cross_form_container';
		container.style.display = 'none';
		document.body.appendChild(container);
	}
	container.innerHTML = '<iframe src="#" id="cross_form_iframe" name="cross_form_iframe" ></iframe>'
		+ '<form id="cross_form" name="cross_form" action = "' + url + '" method="post" enctype="multipart/form-data" target="cross_form_iframe">'
			+ '<input id="cross_form_data" name="cross_form_data" value="" type="hidden" />'
			+ '<input id="Authorization" name="Authorization" type="hidden" />'
			+ '<input id="EnvApi-SystemId" name="EnvApi-SystemId" type="hidden" />'
		+ '</form>';

	var isSuccess = false;

	jQuery('#cross_form_iframe').load(function() {
		setTimeout(iframeLoaded, 500);
	});

	function iframeLoaded() {
		if (isSuccess == false) {
			if (window.removeEventListener) {
				window.removeEventListener("message", callback);
			} else {
				window.detachEvent("onmessage", callback);
			}

			if (onerror != null) {
				onerror({ metadata: { statusCode: 400 }, error: { errorNumber: 0, message: "Unexpected error on uploading."} });
			}
		}
	}

	var form = container.getElementsByTagName('form')[0];

	container.getElementsByTagName('input')[0].value = JSON.stringify(data);

	var sessionId = envianceSdk.getSessionId();
	if (sessionId) {
		container.getElementsByTagName('input')[1].value = 'Enviance ' + sessionId;
	}
	var systemId = envianceSdk.getSystemId();
	if (systemId) {
		container.getElementsByTagName('input')[2].value = systemId;
	}

	if (fileinputs != null) {
		for (var i = 0, l = fileinputs.length; i < l; i++) {
			var fileinput = fileinputs[i];
			fileinput.parentNode.replaceChild(fileinput.cloneNode(false), fileinput);
			form.appendChild(fileinput);
		}
	}

	function callback(event) {
		var identityKey = 'CROSSFORM_RESULT_IDENTITY_KEY';
		if (event.data.indexOf(identityKey) != 0) {
			return;
		}

		if (window.removeEventListener) {
			window.removeEventListener("message", callback);
		} else {
			window.detachEvent("onmessage", callback);
		}

		if (typeof (event.data) == 'undefined') {
			isSuccess = false;
			return;
		}

		var result = JSON.parse(event.data.substring(identityKey.length));
		isSuccess = true;

		if (result.metadata.statusCode == 200) {
			if (onsuccess != null) {
				onsuccess(result);
			}
		} else {
			if (onerror != null) {
				onerror(result);
			}
		}
	}

	if (window.addEventListener) {
		window.addEventListener("message", callback, false);
	} else {
		window.attachEvent("onmessage", callback);
	}

	form.submit();
};

//
//ISO Date formatting/parsing implementation
//
envianceSdk.IsoDate = {
	_expression: new RegExp("^" +
		"(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign + 6-digit extended year
		"-(\\d{2})" + // month capture
		"-(\\d{2})" + // day capture
		"(?:" + // capture hours:minutes:seconds.milliseconds
			"T(\\d{2})" + // hours capture
			":(\\d{2})" + // minutes capture
			"(?:" + // optional :seconds.milliseconds
				":(\\d{2})" + // seconds capture
				"(?:\\.(\\d{3}))?" + // milliseconds capture
			")?" +
		"(?:" + // capture UTC offset component
			"Z|" + // UTC capture
			"(?:" + // offset specifier +/-hours:minutes
				"([-+])" + // sign capture
				"(\\d{2})" + // hours offset capture
				":?(\\d{2})" + // minutes offset capture
			")" +
		")?)?" +
	"$"),
	match: function(string) {
		// accept minimum: "2012-01-01"
		return string != null && string.length > 9 && this._expression.exec(string) != null;
	},
	exactMatch: function(string) {
		// accept minimum: "2012-01-01T10:01"
		return string != null && string.length > 15 && this._expression.exec(string) != null;
	},
	parse: function(string) {
		var match = this._expression.exec(string);
		if (match) {
			match.shift(); // kill match[0], the full match
			// parse months, days, hours, minutes, seconds, and milliseconds
			for (var i = 1; i < 7; i++) {
				// provide default values if necessary
				match[i] = +(match[i] || (i < 3 ? 1 : 0));
				// match[1] is the month. Months are 0-11 in JavaScript
				// `Date` objects, but 1-12 in ISO notation, so we
				// decrement.
				if (i == 1) {
					match[i]--;
				}
			}

			// parse the UTC offset component
			var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();

			// compute the explicit time zone offset if specified
			var isUtc = string.indexOf("Z") > 0;
			var isTzSpecified = sign || isUtc;
			var offset = 0;
			if (sign) {
				// detect invalid offsets and return early
				if (hourOffset > 23 || minuteOffset > 59) {
					return NaN;
				}

				// express the provided time zone offset in minutes. The offset is
				// negative for time zones west of UTC; positive otherwise.
				offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == "+" ? -1 : 1);
			}

			if (isTzSpecified) {
				var utc = new Date();
				utc.setUTCFullYear(match[0]);
				utc.setUTCMonth(match[1], match[2]);
				utc.setUTCHours(match[3], match[4], match[5], 0);
				return new Date(utc.getTime() + offset);
			} else {
				var date = new Date();
				date.setFullYear(match[0]);
				date.setMonth(match[1], match[2]);
				date.setHours(match[3], match[4], match[5], 0);
				return date;
			}
		}
		return NaN;
	},
	toLocalString: function(date) {
		if (date == null || isNaN(date)) { return null; }
		var month = date.getMonth() + 1,
			day = date.getDate(),
			year = date.getFullYear(),
			hours = date.getHours(),
			minutes = date.getMinutes(),
			seconds = date.getSeconds();

		if (year < 1000) {
			year = ('0000' + year);
			year = year.substr(year.length - 4, 4);
		}
		if (month < 10) {
			month = '0' + month;
		}
		if (day < 10) {
			day = '0' + day;
		}
		if (hours < 10) {
			hours = '0' + hours;
		}
		if (minutes < 10) {
			minutes = '0' + minutes;
		}
		if (seconds < 10) {
			seconds = '0' + seconds;
		}
		return '' + year + '-' + month + '-' + day + 'T' +
			hours + ':' + minutes + ':' + seconds;
	},
	toUTCString: function(date) {
		if (date == null || isNaN(date)) { return null; }
		var month = date.getUTCMonth() + 1,
			day = date.getUTCDate(),
			year = date.getUTCFullYear(),
			hours = date.getUTCHours(),
			minutes = date.getUTCMinutes(),
			seconds = date.getUTCSeconds();

		if (year < 1000) {
			year = ('0000' + year);
			year = year.substr(year.length - 4, 4);
		}
		if (month < 10) {
			month = '0' + month;
		}
		if (day < 10) {
			day = '0' + day;
		}
		if (hours < 10) {
			hours = '0' + hours;
		}
		if (minutes < 10) {
			minutes = '0' + minutes;
		}
		if (seconds < 10) {
			seconds = '0' + seconds;
		}
		return '' + year + '-' + month + '-' + day + 'T' +
			hours + ':' + minutes + ':' + seconds + "Z";
	}
};

//
//Public declarations
//
//
envianceSdk.configure = function(options) {
	if (options.baseAddress != null) {
		envianceSdk._baseAddress = options.baseAddress;
	}
	if (options.webAppVirtualPath != null) {
		envianceSdk._webAppVirtualPath = options.webAppVirtualPath;
	}
	if (options.variables != null) {
		if (options.variables == "simple") {
			envianceSdk._variables = new envianceSdk._SimpleVariablesManager();
		}
		if (options.variables == "cookies") {
			envianceSdk._variables = new envianceSdk._CookieVariablesManager();
		}
	}
	if (options.sessionId !== undefined) {
		envianceSdk.setSessionId(options.sessionId);
		if (options.sessionId == null) {
			envianceSdk.setSystemId(null);
		}
	}
	if (options.systemId !== undefined) {
		envianceSdk.setSystemId(options.systemId);
	}
	if (options.crossDomainWorkaround != null) {
		envianceSdk._crossDomainWorkaround = options.crossDomainWorkaround;
	}
	if (options.packageId !== undefined) {
		envianceSdk._packageId = options.packageId;
	}
	if (options.resubmitConfirmationOnError != null) {
		envianceSdk._resubmitConfirmationOnError = options.resubmitConfirmationOnError;
	}
	if (options.refreshPageOnUnauthorized != null) {
		envianceSdk._refreshPageOnUnauthorized = options.refreshPageOnUnauthorized;
	}

};

envianceSdk.getSessionId = function() {
	return envianceSdk._variables.readSessionId();
};

envianceSdk.setSessionId = function(sessionId) {
	envianceSdk._variables.writeSessionId(sessionId);
};

envianceSdk.getSystemId = function() {
	return envianceSdk._variables.readSystemId();
};

envianceSdk.setSystemId = function(systemId) {
	envianceSdk._variables.writeSystemId(systemId);
};

//
// Main properties
//
envianceSdk._baseAddress = null;
envianceSdk._webAppVirtualPath = null;
envianceSdk._version = 1;
envianceSdk._variables = new envianceSdk._SimpleVariablesManager();
envianceSdk._crossDomain = new envianceSdk._CrossDomainSupport();
envianceSdk._crossDomainWorkaround = "ifneeded"; //Values: "always","ifneeded","off"
envianceSdk._resubmitConfirmationOnError = true;
envianceSdk._refreshPageOnUnauthorized = false;
envianceSdk._errorHandler = new envianceSdk._GenericErrorHandler();
envianceSdk._packageId = null;

// <autogenerated>
//	This file is auto-generated.
// </autogenerated>

//Enviance.RestServices.Eql.IEqlService 
envianceRegisterNamespace("envianceSdk.eql");
	 
envianceSdk.eql.execute = function(eql, page, pageSize, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "POST",
		url: envianceSdk._buildUrl('ver1/EqlService.svc/eql'),
		data: JSON.stringify(envianceSdk._preProcess({eql: eql, page: page, pageSize: pageSize})),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		}, 
		error: function(response, status, message) {
				envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
//Enviance.RestServices.Security.IAuthenticationService 
envianceRegisterNamespace("envianceSdk.authentication");
	 
envianceSdk.authentication.authenticate = function(userName, password, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "POST",
		url: envianceSdk._buildUrl('ver1/AuthenticationService.svc/sessions'),
		data: JSON.stringify(envianceSdk._preProcess({userName: userName, password: password})),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context, true);
		},
		success: function(response, textStatus, xhr) {
			envianceSdk.setSessionId(response);
			envianceSdk.setSystemId(null);
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		}, 
		error: function(response, status, message) {
				envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.authentication.endCurrentSession = function( onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "DELETE",
		url: envianceSdk._buildUrl('ver1/AuthenticationService.svc/currentsession'),
		data: {},
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context, true);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		}, 
		error: function(response, status, message) {
				envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.authentication.getCurrentSessionInfo = function( onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "GET",
		url: envianceSdk._buildUrl('ver1/AuthenticationService.svc/currentsession'),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context, true);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		}, 
		error: function(response, status, message) {
				envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
//Enviance.RestServices.Workflows.IWorkflowService 
envianceRegisterNamespace("envianceSdk.workflow");

envianceSdk.workflow.createWorkflow = function(workflowCreationInformation, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "POST",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows'),
		data: JSON.stringify(envianceSdk._preProcess({ "workflowCreationInformation": workflowCreationInformation })),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.initiateChildWorkflow = function(idOrUniqueId, childWorkflowInitiationInformation, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "POST",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows/' + idOrUniqueId + '/children'),
		data: JSON.stringify(envianceSdk._preProcess(childWorkflowInitiationInformation)),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.getWorkflow = function(idOrUniqueId, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "GET",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows/' + encodeURIComponent(idOrUniqueId) + ''),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.updateWorkflow = function(workflowUpdateInformation, idOrUniqueId, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "PATCH",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows/' + encodeURIComponent(idOrUniqueId) + ''),
		data: JSON.stringify(envianceSdk._preProcess({ "workflowUpdateInformation": workflowUpdateInformation })),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.deleteWorkflow = function(idOrUniqueId, onsuccess, onerror) {
	var context = null;
	jQuery.ajax({
		type: "DELETE",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows/' + encodeURIComponent(idOrUniqueId)),
		data: { },
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.generateUniqueIDs = function(workflowTypeIdOrName, count, onsuccess, onerror) {
	var context = null;
	jQuery.ajax({
		type: "GET",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflowtypes/' + encodeURIComponent(workflowTypeIdOrName) + '/uniqueIds?count=' + encodeURIComponent(count) + ''),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.getWorkflowStep = function(idOrUniqueId, idOrName, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "GET",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows/' + encodeURIComponent(idOrUniqueId) + '/steps') + '/' + encodeURIComponent(idOrName) + '',
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.getWorkflowCurrentStep = function(idOrUniqueId, onsuccess, onerror) {
	envianceSdk.workflow.getWorkflowStep(idOrUniqueId, "currentstep", onsuccess, onerror);
};
envianceSdk.workflow.updateWorkflowStep = function(workflowStepInformation, idOrUniqueId, idOrName, onsuccess, onerror) {
	var context = null;
	jQuery.ajax
	({
		type: "PATCH",
		url: envianceSdk._buildUrl('ver1/WorkflowService.svc/workflows/' + encodeURIComponent(idOrUniqueId) + '/steps') + '/' + encodeURIComponent(idOrName) + '',
		data: JSON.stringify(envianceSdk._preProcess(workflowStepInformation)),
		contentType: "application/json; charset=UTF-8",
		crossdomain: false,
		async: true,
		cache: false,
		dataType: "json",
		beforeSend: function(xhr, form, options) {
			context = envianceSdk._createContext(xhr, form, options, form.success, form.error);
			return envianceSdk._beforeSend(xhr, context);
		},
		success: function(response, textStatus, xhr) {
			if (onsuccess != null) {
				onsuccess(envianceSdk._processResult(response, xhr));
			}
		},
		error: function(response, status, message) {
			envianceSdk._processError(response, status, message, onsuccess, onerror, context);
		}
	});
};
envianceSdk.workflow.updateWorkflowCurrentStep = function(workflowStepInformation, idOrUniqueId, onsuccess, onerror) {
	envianceSdk.workflow.updateWorkflowStep(workflowStepInformation, idOrUniqueId, "currentstep", onsuccess, onerror);
};
//
// Helper objects
//

envianceRegisterNamespace("envianceSdk.common");
envianceRegisterNamespace("envianceSdk.customFields");

/* for envianceSdk.workflow.createWorkflow function */
envianceSdk.workflow.CreationInformation = function(workflowTypeName, name, uniqueId, dueDate, objects, documents, comment, calendars) {
	if (workflowTypeName) {
		this.workflowTypeName = workflowTypeName;
	}
	if (name) {
		this.name = name;
	}
	if (uniqueId) {
		this.uniqueId = uniqueId;
	}
	if (dueDate) {
		this.dueDate = dueDate;
	}
	if (objects) {
		this.objects = objects;
	}
	if (documents) {
		this.documents = documents;
	}
	if (comment) {
		this.comment = comment;
	}

	if (calendars) {
		this.calendars = calendars;
	}

	this.addTagAssociatedObject = function(tag) {
		this.objects = this.objects || [];
		this.objects.push(new envianceSdk.common.TagAssociatedObject(tag));
		return this;
	};

	this.addPathAssociatedObject = function(path) {
		this.objects = this.objects || [];
		this.objects.push(new envianceSdk.common.PathAssociatedObject(path));
		return this;
	};

	this.addDocument = function(path) {
		this.documents = this.documents || [];
		this.documents.push(path);
		return this;
	};
};

envianceSdk.common.TagAssociatedObject = function(tag) {
	if (tag) {
		this.tag = tag;
	}
};

envianceSdk.common.PathAssociatedObject = function(path) {
	if (path) {
		this.path = path;
	}
};

/* for envianceSdk.workflow.updateWorkflowStep function */
envianceSdk.workflow.StepInformation = function(comment, fields, transition) {
	if (comment) {
		this.comment = comment;
	}
	if (fields) {
		this.fields = fields;
	}
	if (transition) {
		this.transition = transition;
	}

	this.transition = function(stepActionName, dueDate, assignTo) {
		this.transition = new envianceSdk.workflow.Transition(stepActionName, dueDate, assignTo);
		return this.transition;
	};

	this.addScalarFieldValue = function(name, value) {
		this.fields = this.fields || [];
		this.fields.push(new envianceSdk.customFields.ScalarFieldValue(name, value));
		return this;
	};

	this.addDateFieldValue = function(name, value) {
		this.fields = this.fields || [];
		this.fields.push(new envianceSdk.customFields.DateFieldValue(name, value));
		return this;
	};

	this.addTimeFieldValue = function(name, value) {
		this.fields = this.fields || [];
		this.fields.push(new envianceSdk.customFields.TimeFieldValue(name, value));
		return this;
	};
	
	this.addUrlFieldValue = function(name, label, url) {
		this.fields = this.fields || [];
		this.fields.push(new envianceSdk.customFields.UrlFieldValue(name, label, url));
		return this;
	};

	this.addLinkedFieldValues = function(name, values) {
		this.fields = this.fields || [];
		this.fields.push(new envianceSdk.customFields.LinkedFieldValues(name, values));
		return this;
	};

	this.addMultiFieldValues = function(name, values) {
		this.fields = this.fields || [];
		this.fields.push(new envianceSdk.customFields.MultiFieldValues(name, values));
		return this;
	};
};

/* for envianceSdk.workflow.initiateChildWorkflow function */
envianceSdk.workflow.ChildWorkflowInitiationInformation = function(stepIdOrName, initiatorIdOrName, workflowCreationInformation, workflowStepUpdateInformation) {
	if (stepIdOrName) {
		this.stepIdOrName = stepIdOrName;
	}
	if (initiatorIdOrName) {
		this.initiatorIdOrName = initiatorIdOrName;
	}
	if (workflowCreationInformation) {
		this.workflowCreationInformation = workflowCreationInformation;
	}
	if (workflowStepUpdateInformation) {
		this.workflowStepUpdateInformation = workflowStepUpdateInformation;
	}
};

envianceSdk.workflow.Transition = function(stepActionName, dueDate, assignTo) {
	if (stepActionName) {
		this.stepActionName = stepActionName;
	}
	if (dueDate) {
		this.dueDate = dueDate;
	}
	if (assignTo) {
		this.assignTo = assignTo;
	}

	this.addUserAssignee = function(userName) {
		this.assignTo = this.assignTo || [];
		this.assignTo.push(new envianceSdk.common.UserAssignee(userName));
		return this;
	};

	this.addGroupAssignee = function(groupName) {
		this.assignTo = this.assignTo || [];
		this.assignTo.push(new envianceSdk.common.GroupAssignee(groupName));
		return this;
	};
};

envianceSdk.common.GroupAssignee = function(groupName) {
	if (groupName) {
		this.groupName = groupName;
	} else {
		throw new Error("Argument value is not valid: groupName.");
	}
};

envianceSdk.common.UserAssignee = function(userName) {
	if (userName) {
		this.userName = userName;
	} else {
		throw new Error("Argument value is not valid: userName.");
	}
};

envianceSdk.customFields.DateFieldValue = function(name, value) {
	if (value != null && !(value instanceof Date)) {
		if (envianceSdk.IsoDate.match(value)) {
			value = envianceSdk.IsoDate.parse(value);
		} else {
			value = new Date(value);
		}
	}
	this.name = name;
	this.values = [value];
};

envianceSdk.customFields.TimeFieldValue = function(name, value) {
	var today = new Date(),
		dd = today.getDate(),
		mm = today.getMonth() + 1,
		yyyy = today.getFullYear();
	if (dd < 10) { dd = '0' + dd; }
	if (mm < 10) { mm = '0' + mm; }

	if (value instanceof Date) {
		value = value.getHours() + ':' + value.getMinutes();
	}
	var date = new Date(mm + '/' + dd + '/' + yyyy + ' ' + value);
	if (isNaN(date)) {
		throw Error("Invalid date");
	}

	this.name = name;
	this.values = [date];
};

envianceSdk.customFields.ScalarFieldValue = function(name, value) {
	this.name = name;
	this.values = [value];
};

envianceSdk.customFields.UrlFieldValue = function(name, label, url) {
	this.name = name;
	this.urlItems = [{ label: label, url: url}];
};

envianceSdk.customFields.LinkedFieldValues = function(name, values) {
	this.name = name;
	this.values = values;
};

envianceSdk.customFields.MultiFieldValues = function(name, values) {
	this.name = name;
	this.values = values;
};

envianceRegisterNamespace("envianceSdk.compliance");

envianceSdk.compliance.selectComplianceObjects = function(page, pageSize, onsuccess, onerror, nameFilter) {
	var eql = "SELECT " +
		"co.ID, co.Name, co.Type, co.Path, co.WarningNotificationInbox, co.WarningNotificationEmail, " +
		"co.TemplateName, co.CreatedOn, co.ActiveDate, co.InactiveDate, co.ResponsibleUser " +
		"FROM ComplianceObject co";
	if (nameFilter != null) {
		eql = eql + " WHERE co.Name LIKE '%" + nameFilter + "%'" +
			" ORDER BY co.Name"; // TODO: Encode this somehow!
	}
	return envianceSdk.eql.execute(eql, page, pageSize, onsuccess, onerror);
};

envianceRegisterNamespace("envianceSdk.utilities");
envianceRegisterNamespace("envianceSdk.utilities.uri");

/*Returns a query string to execute the QuickLink*/
envianceSdk.utilities.uri.toQuickLink = function(id) {
	var systemId = envianceSdk.getSystemId();
	return envianceSdk._buildWebAppUrl("/goto/home/ql/" + id + (systemId != null
			? ("?systemId=" + systemId)
			: ""));
};

/*Returns a query string to download a document from document manager, given its ID.*/
envianceSdk.utilities.uri.toDocumentDownload = function(docId) {
	return envianceSdk._buildWebAppUrl("/Documents/DocumentDownload.aspx?docID=" + docId);
};

/*Switches a page*/
envianceSdk.utilities.uri.gotoUrl = function(pagePath) {
	window.location.assign(pagePath);
};

envianceRegisterNamespace("envianceSdk.documents");

envianceSdk.documents.DocumentUploadInfo = function(inputId, folderIdOrPath, fileName, documentName, comment, description) {
	this.inputId = inputId;
	this.folderIdOrPath = folderIdOrPath;
	this.fileName = fileName;
	this.documentName = documentName;
	this.comment = comment;
	this.description = description;
};

envianceSdk.documents.uploadDocument = function(fileinput, folderId, onsuccess, onerror) {
	envianceSdk.documents.uploadDocuments([fileinput], folderId, onsuccess, onerror);
};

envianceSdk.documents.uploadDocuments = function(fileinputs, folderId, onsuccess, onerror) {

	var validationResults = envianceSdk.documents.validateUploadDocuments(fileinputs, folderId);
	if (validationResults.length > 0) {
		var errorMessage = '';
		for (var i = 0; i < validationResults.length; i++) {
			errorMessage += validationResults[i].inputId + ':' + validationResults[i].message + '\n';
		}
		throw new Error(errorMessage);
	}
	
	var url = envianceSdk._buildUrl('ver1/DocumentService.svc/documents');

	var data = envianceSdk.documents._getUploadData(fileinputs, folderId);

	envianceSdk._crossFormSubmit(fileinputs, url, data, onsuccess, onerror);
};

envianceSdk.documents.validateUploadDocuments = function(fileinputs, folderId) {
	var result = [];
	var messages = {
		MSG_NOT_SELECTED: "* File is not specified.",
		MSG_LONG_VALUE: "* Document name cannot be greater than 50 characters.",
		MSG_NOT_EMPTY_VALUE: "* Document name cannot be empty.",
		MSG_ILLEGAL_CHARACTERS: "* Document name must not contain the following characters: \\\/:*?'<>|\"",
		MSG_UNIQUE_VALUE: "* A document with the same name already exists in this directory."
	};

	for (var i = 0; i < fileinputs.length; i++) {
		if (fileinputs[i].value == '') {
			result.push({ inputId: fileinputs[i].id, message: messages.MSG_NOT_SELECTED });
		}
	}

	var serviceData = envianceSdk.documents._getUploadData(fileinputs, folderId);

	function isUniqueValue(arr, inputId, documentName, folderIdOrPath) {
		for (var j = 0, k = arr.length; j < k; j++) {
			var obj = arr[j];
			if (obj.inputId.toLowerCase() != inputId.toLowerCase()
				&& obj.documentName.toLowerCase() == documentName.toLowerCase()
					&& obj.folderIdOrPath.toLowerCase() == folderIdOrPath.toLowerCase()) {
				return false;
			}
		}
		return true;
	}

	for (var i = 0, l = serviceData.length; i < l; i++) {
		var data = serviceData[i];
		var name = data.documentName;
		if (name.toString().length > 50) {
			result.push({ inputId: data.inputId, message: messages.MSG_LONG_VALUE });
			continue;
		}
		if (name == null || name == '' || name.match( /^\s+$/ )) {
			result.push({ inputId: data.inputId, message: messages.MSG_NOT_EMPTY_VALUE });
			continue;
		}
		if (name.search( /[\*\<\>\|\?\:\\\/\'\"]/ ) > -1) {
			result.push({ inputId: data.inputId, message: messages.MSG_ILLEGAL_CHARACTERS });
			continue;
		}
		if (!isUniqueValue(serviceData, data.inputId, name, data.folderIdOrPath)) {
			result.push({ inputId: data.inputId, message: messages.MSG_UNIQUE_VALUE });
			continue;
		}
	}
	return result;
};

envianceSdk.documents._getUploadData = function(inputs, folderId) {
	var result = [];
	for (var i = 0, l = inputs.length; i < l; i++) {
		var fileinput = inputs[i];
		var fullName = fileinput.value;

		var defaultName = fullName.substr(fullName.lastIndexOf('\\') + 1, fullName.length);
		result.push(
			new envianceSdk.documents.DocumentUploadInfo(
				fileinput.id,
				this._getAttrValue(fileinput, 'data-document-folderid', folderId),
				fullName,
				this._getAttrValue(fileinput, 'data-document-name', defaultName),
				this._getAttrValue(fileinput, 'data-document-comment', ''),
				this._getAttrValue(fileinput, 'data-document-description', '')
			)
		);
	}
	return result;
};

envianceSdk.documents._getAttrValue = function(fileinput, attr, defaultValue) {
	var value = fileinput.getAttribute(attr);
	if (value != null) {
		var input = document.getElementById(value);
		return input == null ? value : input.value;
	}
	return defaultValue;
};
