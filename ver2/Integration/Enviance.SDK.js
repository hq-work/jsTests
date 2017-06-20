//ReSharper disable UseOfImplicitGlobalInFunctionScope

/*
The Enviance.SDK requires jQuery 1.8.3 (/Packages/Libs/jquery.1.8.3.min.js) and JSON2 (/Packages/Libs/json2.js).
To resolve a conflict with jQuery versions use <noConflict> instruction (http://api.jquery.com/jQuery.noConflict/).
*/

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

envianceRegisterNamespace("envianceSdk");
envianceSdk = (function(envianceSdk) {
	// ReSharper disable InconsistentNaming
	var _private = envianceSdk._private = envianceSdk._private || {};
	// ReSharper restore InconsistentNaming
	envianceSdk.JSON = {
		parse: function (json) {
			var isDateString = function (value) {
				return value != null && typeof value === 'string' && envianceSdk.IsoDate.exactMatch(value);
			};
			return JSON.parse(json, function (key, value) {
				if (isDateString(value)) {
					return envianceSdk.IsoDate.parse(value);
				}

				return value;
			});
		},
		stringify: function (value) {
			value = this._preProcess(value);
			return JSON.stringify(value);
		},
		_preProcess: function(obj, copyObj) {
			var c = copyObj || ((obj.constructor === Array) ? [] : {});
			for (var i in obj) {
				if (typeof obj[i] === 'function') {
					continue;
				}
				if (obj[i] != null && typeof obj[i] === 'object') {
					if (obj[i] instanceof Date) {
						c[i] = envianceSdk.IsoDate.toLocalString(obj[i]);
					} else {
						c[i] = (obj[i].constructor === Array) ? [] : {};
						this._preProcess(obj[i], c[i]);
					}
				} else {
					c[i] = obj[i];
				}
			}
			return c;
		},
		_postprocess: function (data) {
			var isDateString = function (value) {
				return value != null && typeof value === "string" && envianceSdk.IsoDate.exactMatch(value);
			};
			
			if (typeof data !== "object") {
				if (isDateString(data)) {
					return envianceSdk.IsoDate.parse(data);
				} else {
					return data;
				}
			} else {
				var traverse = function (obj, callback) {
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

				traverse(data, function (obj, propName) {
					var value = obj[propName];
					if (isDateString(value)) {
						obj[propName] = envianceSdk.IsoDate.parse(value);
					}
				});
				return data;
			}
		}
	};
	/*
	Private declarations
	*/

	_private._ajax = function(ajaxSettings, onsuccess, onerror) {
		var settings = {};
		var headers = _private._buildRequestHeaders();

		if (_private._ajax._batchMode.on) {
			jQuery.extend(settings, { method:"GET", url:"/" }, ajaxSettings);

			var headArray = [];

			for (var p in headers) {
				headArray.push({ name: p, value: headers[p] });
			}

			var body = settings.data ?
				(jQuery.type(settings.data) === "string" ? settings.data : JSON.stringify(settings.data))
				: settings.data;

			var deferred = jQuery.Deferred();

			var relUrl = settings.url.substr(_private._baseAddress.length + (_private._baseAddress.charAt(_private._baseAddress.length - 1) == "/" ? -1 : 0));
			_private._ajax._batchMode.operations.push(
				{
					request:{
						headers: headArray,
						method: settings.type,
						url: relUrl,
						body: body
					},
					onsuccess: function (data, textStatus, jqXhr) {
						if (settings.success) {
							settings.success(data, textStatus, jqXhr);
						}
						else onsuccess(_private._processResult(data, jqXhr));
						
						deferred.resolve(arguments);
					}, 
					onerror: function (jqXhr, textStatus, errorThrown) {
						if (settings.error) {
							settings.error(_private._processError(jqXhr), textStatus, errorThrown);
						}
						else onerror(_private._processError(jqXhr), textStatus, errorThrown);
						deferred.reject(arguments);
					}
				}
			);
			return deferred.promise();
		}

		var commonSettings = {
			contentType: "application/json; charset=UTF-8",
			headers: headers,
			success: function(data, textStatus, jqXhr) {
				if (onsuccess) {
					onsuccess(_private._processResult(data, jqXhr));
				}
			},
			error: function(jqXhr, textStatus, errorThrown) {
				var resubmitCallback = function() {
					_private._ajax(ajaxSettings, onsuccess, onerror);
				};

				if (_private._errorHandler.handle(jqXhr, textStatus, resubmitCallback)) {
					return;
				}

				if (onerror) {
					onerror(_private._processError(jqXhr), textStatus, errorThrown);
				}
			}
		};

		jQuery.extend(settings, commonSettings, ajaxSettings);

		if (_private._crossDomain.isRequired(settings.url)) {
			return _private._crossDomain.ajax(settings);
		} else {
			jQuery.extend(settings, {
				async: true,
				crossdomain: false,
				cache: false,
				xhrFields: {
					withCredentials: true
				},
				beforeSend: function(xhr) {
					xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				}
			});

			return jQuery.ajax(settings);
		}
	};

	_private._ajax._batchMode = { on: false, operations: [] };

	/*
	Cross Domain Support
	*/

	_private._CrossDomainSupport = function() {
		this.rpcSocket = null;
	};

	_private._CrossDomainSupport.prototype = {
		rpcSocket: null,
		isRequired: function(url) {
			return this.isAllowed() && this.isCrossDomainUrl(url);
		},
		isAllowed: function() {
			if (_private._crossDomainWorkaround == "always") {
				return true;
			} else if (_private._crossDomainWorkaround == "off") {
				return false;
			} else if (_private._crossDomainWorkaround == "ifneeded") {
				return !('withCredentials' in new XMLHttpRequest());//returns true for browsers that do not support CORS (IE9 and older)
			} else {
				throw new Error("Illegal settings: unknown _crossDomainWorkaround value");
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
		ajax: function(options) {
			var deferred = jQuery.Deferred();
			this._createOrGetSocket(
				function(socket) {
					socket.xhrRequest(options,
						function(response) {
							try {
								if (options.success != null) {
									options.success(response.data, response.textStatus, response.jqXhr);
								}
							} finally {
								deferred.resolve(response);
								socket.destroy();
							}
						},
						function(response) {
							try {
								// Object passed from provider is in 'message' property of the response
								if (options.error != null) {
									options.error(response.message.jqXhr, response.message.textStatus, response.message.errorThrown);
								}
							} finally {
								deferred.reject(response);
								socket.destroy();
							}
						});
				},
				function(jqXhr, textStatus, errorThrown) {
					try {
						if (options.error != null) {
							options.error(jqXhr, textStatus, errorThrown);
						}
					} finally {
						deferred.reject(jqXhr);
					}
				});
			return deferred.promise();
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
					url: _private._buildUrl("crossdomain/easyXDM.js"),
					dataType: "script",
					cache: true,
					success: function(data, textStatus, jqXhr) {
						if (typeof easyXDM == "undefined") {
							onerror(jqXhr, "Failed to setup crossdomain support. Failed to load easyXDM.js.", null);
							return;
						}
						self._createSocket(callback);
					},
					error: function(jqXhr, textStatus, errorThrown) {
						onerror(jqXhr, "Failed to setup crossdomain support. Failed to load easyXDM.js.", errorThrown);
					}
				});
			} else {
				this._createSocket(callback);
			}
		},
		_createSocket: function(callback) {
			//setup easyXDM socket
			envianceSdk.rpcSocket = new easyXDM.Rpc(
				{
					swf: _private._buildUrl("crossdomain/easyxdm.swf"),
					remote: _private._buildUrl("crossdomain/cors.htm")
				},
				{
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
	_private._SimpleVariablesManager = function() {
		this.SESSION_KEY = "envianceSdk.sessionId";
		this.SYSTEM_KEY = "envianceSdk.systemId";
		this.USER_KEY = "envianceSdk.userId";
		this.vars = new Object();
	};

	_private._SimpleVariablesManager.prototype = {
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
		},
		readUserId: function() {
			return this.vars[this.USER_KEY];
		},
		writeUserId: function(userId) {
			this.vars[this.USER_KEY] = userId;
		}
	};

	//useful in standalone mode
	_private._CookieVariablesManager = function() {
		this.SESSION_KEY = "envianceSdk.sessionId";
		this.SYSTEM_KEY = "envianceSdk.systemId";
		this.USER_KEY = "envianceSdk.userId";
	};

	_private._CookieVariablesManager.prototype = {
		readSessionId: function() {
			return this.getCookieValue(this.SESSION_KEY);
		},
		writeSessionId: function(sessionId) {
			this.saveCookieValue(this.SESSION_KEY, sessionId, false, true);
		},
		readSystemId: function() {
			return this.getCookieValue(this.SYSTEM_KEY);
		},
		writeSystemId: function(systemId) {
			this.saveCookieValue(this.SYSTEM_KEY, systemId, false);
		},
		readUserId: function() {
			return this.getCookieValue(this.USER_KEY);
		},
		writeUserId: function(userId) {
			this.saveCookieValue(this.USER_KEY, userId, false);
		},
		saveCookieValue: function(key, value, persistent, secure) {
			if (value != null) {
				var cookieVal = key + "=" + escape(value);
				if (persistent == true) {
					var time = new Date();
					time.setFullYear(time.getFullYear() + 10);
					cookieVal += ";expires=" + time.toUTCString();

				}
				document.cookie = cookieVal + ";path=/;" + ((secure == true) ? "secure;" : "");
			} else {
				document.cookie = key + "=;path=/;expires=Fri, 31 Dec 1950 23:59:59 GMT;" + ((secure == true) ? "secure;" : "");
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
	_private._GenericErrorHandler = function() {
	};
	_private._GenericErrorHandler.prototype = {
		handle: function(jqXhr, textStatus, resubmitCallback) {
			var status = this._detectStatus(jqXhr, textStatus);
			if (_private._resubmitConfirmationOnError) {
				if (status == "timeout") {
					if (confirm("An error occurred attempting to connect to the Enviance servers. This may be due to a scheduled period of downtime. " +
						"Would you like to try your operation again?")) {
						resubmitCallback();
						return true;
					}
				}
				if (status == "requestlimit") {
					var error = envianceSdk.JSON.parse(jqXhr.responseText);
					//response.getResponseHeader("Retry-After") will not work here becouse of CORS. Need direct server-side support to have it inside error json.
					if (confirm("You have reached the request limits for this system. Would you like to try your operation again?")) {
						resubmitCallback();
						return true;
					}
				} else if (status == "heavyload") {
					if (confirm("Our servers are experiencing an unusually heavy load. Would you like to try your operation again?")) {
						resubmitCallback();
						return true;
					}
				}
			}
			if (_private._refreshPageOnUnauthorized) {
				if (status == "unauthorized") {
					location.reload(true);
					return true;
				}
			}
			return false;
		},
		_detectStatus: function(jqXhr, textStatus) {
			var isDisconnected = false;
			var text = "";
			if (jqXhr != null) {
				try {
					if (jqXhr.status == 12029 || jqXhr.status == 12007) {
						isDisconnected = true;
					}
					if (jqXhr.responseText != null) {
						text = jqXhr.responseText;
					}
				} catch (communicationError) {
					isDisconnected = true;
				}
			}
			if (isDisconnected) {
				return "timeout";
			}
			
			var isStreamingTimeout = (jqXhr.status == 500 && text == "\"The underlying connection was closed: A connection that was expected to be kept alive was closed by the server.\"");
			if (text.indexOf("heavy load") != -1 || text.indexOf("Timeout expired") != -1 || isStreamingTimeout) {
				return "heavyload";
			}
			if (jqXhr.status == 401) {
				return "unauthorized";
			}
			if (jqXhr.status == 503) {
				return "requestlimit";
			}
			return textStatus;
		}
	};

	_private._buildUrl = function(url) {
		if (_private._baseAddress == null) {
			throw new Error("_baseAddress is not set. Can not build URL.");
		}
		if (url.charAt(0) != "/") {
			url = "/" + url;
		}
		var base = _private._baseAddress;
		if (base.charAt(base.length - 1) == "/") {
			base = base.substr(0, base.length - 1);
		}
		return base + url;
	};

	_private._buildWebAppUrl = function(url) {
		if (_private._webAppVirtualPath == null) {
			throw new Error("_webAppVirtualPath is not set. Can not build URL.");
		}
		if (url.charAt(0) != "/") {
			url = "/" + url;
		}
		var base = _private._webAppVirtualPath;
		if (base.charAt(base.length - 1) == "/") {
			base = base.substr(0, base.length - 1);
		}
		return base + url;
	};

	_private._buildRequestHeaders = function(denySystemId) {
		var headers = new Object();

		var sessionId = envianceSdk.getSessionId();
		if (sessionId != null) {
			headers["Authorization"] = "Enviance " + sessionId;
		}

		var systemId = envianceSdk.getSystemId();
		if (systemId != null && denySystemId !== true) {
			headers["EnvApi-SystemId"] = systemId;
		}

		var packageId = _private._packageId;
		if (packageId != null) {
			headers["EnvApi-PackageId"] = packageId;
		}

		return headers;
	};

	_private._processResult = function(response, xhr) {
		var resultResponse = { metadata: _private._buildMetadata(xhr), result: response };

		// No additional handling required if response is not a JSON
		var contentType = (typeof xhr.getResponseHeader == "undefined") ? xhr.headers['Content-Type'] : xhr.getResponseHeader('Content-Type');
		if (contentType == null || contentType.toLowerCase().indexOf('application/json') == -1) {
			resultResponse.result = response;
			return resultResponse;
		}
		resultResponse.result = envianceSdk.JSON._postprocess(response);
		return resultResponse;
	};

	_private._processDataset = function(tables) {
		//TODO: Does this needed?
		var isInvalidTablesData = false;
		var isDateString = function(value) {
			return value != null && typeof value === "string" && envianceSdk.IsoDate.exactMatch(value);
		};

		for (var i = 0; i < tables.length; i++) {
			var table = tables[i];
			var rows = table.rows;
			var columns = table.columns;

			if ((typeof (columns) == "undefined") || (typeof (rows) == "undefined") || (columns.length == 0) || (rows.length == 0)) {
				continue;
			}

			for (var j = 0; j < columns.length; j++) {
				var column = columns[j];
				if (typeof column.dataType != "undefined" && column.dataType.toLowerCase() == "datetime") {
					for (var k = 0; k < rows.length; k++) {
						var row = rows[k];
						var val = row.values[j];
						if (isDateString(val)) {
							row.values[j] = envianceSdk.IsoDate.parse(val);
						} else {
							isInvalidTablesData = true;
						}
					}
				}
			}
		}

		if (isInvalidTablesData && (typeof (console) != "undefined")) {
			console.log('The dataset does not contain datetime values for "DateTime" columns.');
		}
		return tables;
	};

	_private._processDatasetResult = function(tables, xhr) {
		var resultResponse = {
			metadata: _private._buildMetadata(xhr),
			result: _private._processDataset(tables)
		};
		return resultResponse;
	},

	_private._processError = function(xhr) {
		var errorResponse = { metadata: _private._buildMetadata(xhr) };
		try {
				errorResponse.error = envianceSdk.JSON.parse(xhr.responseText);
		} catch (e) {
			errorResponse.error = xhr.responseText;
		}
		return errorResponse;
	};

	_private._buildMetadata = function(xhr) {
		var metadata = { statusCode: xhr.status };

		var setMetadataProperty = function(propName, value) {
			if (value) {
				metadata[propName] = value;
			}
		};

				var setMetadataPropertyRaw = function (propName, value) {
			if (!isNaN(value)) {
				metadata[propName] = value;
			}
		};

		var propVal;
		if (xhr.getResponseHeader != null) {
			setMetadataProperty('version', xhr.getResponseHeader('EnvApi-Version'));
			setMetadataProperty('remainingCalls', parseInt(xhr.getResponseHeader('EnvApi-Remaining-Calls')));
			setMetadataProperty('remainingInterval', parseInt(xhr.getResponseHeader('EnvApi-Remaining-Interval')));
			propVal = xhr.getResponseHeader('EnvApi-Warnings');
			setMetadataProperty('warnings', propVal ? decodeURIComponent(propVal) : null);
			setMetadataProperty('location', xhr.getResponseHeader('Location'));
			setMetadataPropertyRaw('ecuCall', parseFloat(xhr.getResponseHeader('EnvApi-Eql-ECUCall')));
			setMetadataPropertyRaw('ecuPeriod', parseFloat(xhr.getResponseHeader('EnvApi-Eql-ECUPeriod')));
		} else {
			setMetadataProperty('version', xhr.headers['EnvApi-Version']);
			setMetadataProperty('remainingCalls', parseInt(xhr.headers['EnvApi-Remaining-Calls']));
			setMetadataProperty('remainingInterval', parseInt(xhr.headers['EnvApi-Remaining-Interval']));
			propVal = xhr.headers['EnvApi-Warnings'];
			setMetadataProperty('warnings', propVal ? decodeURIComponent(propVal) : null);
			setMetadataProperty('location', xhr.headers['Location']);
			setMetadataPropertyRaw('ecuCall', parseFloat(xhr.headers['EnvApi-Eql-ECUCall']));
			setMetadataPropertyRaw('ecuPeriod', parseFloat(xhr.headers['EnvApi-Eql-ECUPeriod']));
		}
		return metadata;
	};

	// Compact arrays with null entries; delete keys from objects with null value
	_private.removeNulls = function(obj) {
		var isArray = obj instanceof Array;
		for (var k in obj) {
			if (obj[k] === null) isArray ? obj.splice(k, 1) : delete obj[k];
			else if (typeof obj[k] == "object") _private.removeNulls(obj[k]);
		}
		return obj;
	};
	
	//
	// Form Data Submit - AJAX alternative, it call REST service via standard HTML FORM. 
	// Apart from AJAX, it allows handle file Upload and Download.
	//
	_private._formDataSubmit = function (settings, onsuccess, onerror) {
		var fileinputs = settings.fileinputs;
		var method = settings.type;
		var url = settings.url;
		var data = _private.removeNulls(settings.data ? settings.data : {});
		var useGet = false;
		if (method) {
			method = method.toUpperCase();
			if (method != "POST") {
				if (method == "GET") {
					useGet = true;
				}else {
					url = url + (url.indexOf("?") == -1 ? '?' : '&') + 'HTTP-Method-Override=' + method;
				}
			}
		}
		var operationId = new Date().getTime().toString();

		var buildForm = function(operationId) {
		var container = document.getElementById('cross_form_container');

		if (container == null) {
			container = document.createElement('DIV');
			container.id = 'cross_form_container';
			container.style.display = 'none';
			document.body.appendChild(container);
		}

			var divId = 'restdata_' + operationId;
			var iframeId = 'restdataiframe_' + operationId;
			var formId = 'restdataform_' + operationId;

			if (!useGet) {
				url = url + (url.indexOf("?") == -1 ? '?' : '&') + 'EnvApi-OperationId=' + operationId;
				url = url + '&EnvApi-IFrameResult=true';
			}

			var div = $('<div id="' + divId + '" >' +
				'<iframe src="#" id="' + iframeId + '" name="' + iframeId + '" ></iframe>' +
				'<form id="' + formId + '" name="' + formId + '" action = "' + url + '"' +
				(useGet ? ' method="GET"'  : ' method="POST" enctype="multipart/form-data"') +
				' target="' + iframeId + '" /></div>');

			var form = jQuery('form', div);
			if (useGet) {
				form.append(jQuery("<input />", { name: "EnvApi-OperationId", value: operationId }));
				form.append(jQuery("<input />", { name: "EnvApi-IFrameResult", value: "true" }));
			}
			if (envianceSdk.getSessionId()) {
				form.append(jQuery("<input />", { name: "Authorization", value: 'Enviance ' + envianceSdk.getSessionId() }));
				form.append(jQuery("<input />", { name: "EnvApi-SystemId", value: envianceSdk.getSystemId() }));
				}

			//jQuery.param(data) - convert even complex object into flat key=value query string based on its own rules, server-side FormDataToJsonConverter know those rules.
			var all = jQuery.param(data).split("&");
			for (var i = 0; i < all.length; i++) {
				var pair = all[i].split("=");
				if (pair.length >= 2) {
					form.append(jQuery("<input />", { type:"hidden", name: decodeURIComponent(pair[0].replace(/\+/g, " ")), value: decodeURIComponent(pair[1].replace(/\+/g, " ")) }));
				}
			}

			if (fileinputs != null) {
				for (var i = 0, l = fileinputs.length; i < l; i++) {
					var fileinput = fileinputs[i];
					fileinput.parentNode.replaceChild(fileinput.cloneNode(false), fileinput);
					form.append(fileinput);
				}
			}
			jQuery(container).append(div);
			return div;
		};
			
		var callback = function (event) {
			if (isCallbackReceived) { return; }
		
			var prefix = 'FORMDATA_RESULT_IDENTITY_KEY_' + operationId + " ";
			if (event.data.indexOf(prefix) != 0) {
				return;
			}

			if (typeof (event.data) == 'undefined') {
				isCallbackReceived = false;
				return;
			}
			isCallbackReceived = true;
			callbackCleanup();

			var result = JSON.parse(event.data.substring(prefix.length));

			if (result.metadata.statusCode >= 200 && result.metadata.statusCode < 300) {
				if (onsuccess != null) {
					onsuccess(result);
				}
			} else {
				if (onerror != null) {
					onerror(result);
				}
			}
			
		};

		
		
		var getCookieValue = function(name) {
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
		};
		
		var div = buildForm(operationId);
		var isCallbackReceived = false;
		//var isFormReady = false;
		var isIFrameReady = false;

		jQuery('iframe', div).load(function () {
			if (isIFrameReady) {
				setTimeout(callbackCleanup, 500);
				// await for message callback from iFrame
				// TO DO: need more accuracy method to detect if required call of 'iframeLoaded' function if no response (500 Error)
			}
			isIFrameReady = true;
		});

		if (window.addEventListener) {
			window.addEventListener("message", callback, false);
		} else {
			window.attachEvent("onmessage", callback);
		}
		jQuery('form', div)[0].submit();
		
		var cookieCallback = function () {
			if (getCookieValue("EnvApiOperationId_" + operationId) != null) {
				if (isCallbackReceived) { return; }
				isCallbackReceived = true;
				callbackCleanup();
				var result = getCookieValue("EnvApiOperationId_" + operationId);
				if (result == "true") {
					onsuccess({ metadata: { statusCode: 202 }, result: "" });
				} else {
					if (result >= 500) {
						onerror({ metadata: { statusCode: result }, error: { errorNumber: 0, message: "Unexpected error." } });
					} else {
						var statusCodeValue = result;
						var errorMessageValue = "";
						var errorNumberValue = 0;
						if (result == "404.13") {
							errorMessageValue = "The request has been denied because it exceeds the maximum allowed content length.";
							errorNumberValue = 102;
							statusCodeValue = "404";
						}
						onerror({ metadata: { statusCode: statusCodeValue }, error: { errorNumber: errorNumberValue, message: errorMessageValue } });
					}
				}
			}
		};
		
		var cookieReadySemafor = setInterval(function () {
			if (getCookieValue("EnvApiOperationId_" + operationId) !=null) {
				clearInterval(cookieReadySemafor);
				if (isCallbackReceived) { return; }
				//Wait, in order to fire callback before cookieCallback
				setTimeout(cookieCallback, 1000);
			}
		}, 500);
		
		var callbackCleanup = function () {
			clearInterval(cookieReadySemafor);
			if (window.removeEventListener) {
				window.removeEventListener("message", callback);
			} else {
				window.detachEvent("onmessage", callback);
			}
			if (isCallbackReceived) {
				return;
			}
			if (onerror != null) {
				onerror({ metadata: { statusCode: 400 }, error: { errorNumber: 0, message: "Unexpected error." } });
			}
		};
		
	};

	_private.uriPathEncode = function(path) {
		return encodeURIComponent(path).replace(/%2F/g, "/");
	};

	/*
	Main properties
	*/
	_private._baseAddress = null;
	_private._webAppVirtualPath = null;
	_private._variables = new _private._SimpleVariablesManager();
	_private._crossDomain = new _private._CrossDomainSupport();
	_private._crossDomainWorkaround = "ifneeded"; //Values: "always","ifneeded","off"
	_private._resubmitConfirmationOnError = true;
	_private._refreshPageOnUnauthorized = false;
	_private._errorHandler = new _private._GenericErrorHandler();
	_private._packageId = null;

	/*
	Public declarations
	*/

	envianceSdk.ajax = _private._ajax;
	envianceSdk.formDataSubmit = _private._formDataSubmit;
	envianceSdk.errorHandler = _private._errorHandler;
	envianceSdk.processDataset = _private._processDataset;

	/*
	ISO Date formatting/parsing implementation
	*/
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
			if (date == null || isNaN(date)) {
				return null;
			}
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
			if (date == null || isNaN(date)) {
				return null;
			}
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

	envianceSdk.configure = function(options) {
		if (options.baseAddress != null) {
			_private._baseAddress = options.baseAddress;
		}
		if (options.webAppVirtualPath != null) {
			_private._webAppVirtualPath = options.webAppVirtualPath;
		}
		if (options.variables != null) {
			if (options.variables == "simple") {
				_private._variables = new _private._SimpleVariablesManager();
			}
			if (options.variables == "cookies") {
				_private._variables = new _private._CookieVariablesManager();
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
		if (options.userId !== undefined) {
			envianceSdk.setUserId(options.userId);
		}
		if (options.crossDomainWorkaround != null) {
			_private._crossDomainWorkaround = options.crossDomainWorkaround;
		}
		if (options.packageId !== undefined) {
			_private._packageId = options.packageId;
		}
		if (options.resubmitConfirmationOnError != null) {
			_private._resubmitConfirmationOnError = options.resubmitConfirmationOnError;
		}
		if (options.refreshPageOnUnauthorized != null) {
			_private._refreshPageOnUnauthorized = options.refreshPageOnUnauthorized;
		}
	};

	envianceSdk.setCrossDomainWorkaround = function(value) {
		_private._crossDomainWorkaround = value;
	};

	envianceSdk.getSessionId = function() {
		return _private._variables.readSessionId();
	};

	envianceSdk.setSessionId = function(sessionId) {
		_private._variables.writeSessionId(sessionId);
	};

	envianceSdk.getSystemId = function() {
		return _private._variables.readSystemId();
	};

	envianceSdk.setSystemId = function(systemId) {
		_private._variables.writeSystemId(systemId);
	};

	envianceSdk.getUserId = function() {
		return _private._variables.readUserId();
	};

	envianceSdk.setUserId = function(userId) {
		_private._variables.writeUserId(userId);
	};

	envianceSdk.getBaseAddress = function() {
		return _private._baseAddress;
	};


	return envianceSdk;
} (envianceSdk || {}));
﻿// <autogenerated>
//	This file is auto-generated.
// </autogenerated>

//Enviance.RestServices.Async.ICommandService
if (typeof envianceSdk == "undefined") {
	envianceSdk = { };
}

envianceSdk = (function(envianceSdk) {
	// ReSharper disable InconsistentNaming
	var _private = envianceSdk._private = envianceSdk._private || {};
	// ReSharper restore InconsistentNaming

	envianceRegisterNamespace("envianceSdk.commands");
	envianceSdk.commands.deleteCommand = function(commandId, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/CommandService.svc/commands/' + encodeURIComponent(commandId) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.commands.getCommand = function(commandId, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/CommandService.svc/commands/' + encodeURIComponent(commandId) + '')
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Compliance.IComplianceService
	envianceRegisterNamespace("envianceSdk.compliance");

	envianceSdk.compliance.createLocation = function(locationInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations'),
			data: envianceSdk.JSON.stringify({ "locationInfo": locationInfo }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.createLocationAsync = function (locationInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations'),
			data: envianceSdk.JSON.stringify({ "locationInfo": locationInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.copyLocation = function(locationInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations'),
			data: envianceSdk.JSON.stringify({ "locationInfo": locationInfo, "copyFrom": copyFrom }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.copyLocationAsync = function (locationInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations'),
			data: envianceSdk.JSON.stringify({ "locationInfo": locationInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.deleteLocation = function(locationIdOrPath, waitForCompletion, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations/' + _private.uriPathEncode(locationIdOrPath) + ''),
			data: {},
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					if (waitForCompletion) {
						_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
					} else {
						onsuccess(response);
					}
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.deleteLocationAsync = function (locationIdOrPath, waitForCompletion, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations/' + _private.uriPathEncode(locationIdOrPath) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.getLocation = function(locationIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations/' + _private.uriPathEncode(locationIdOrPath) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.updateLocation = function(locationIdOrPath, locationInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations/' + _private.uriPathEncode(locationIdOrPath) + ''),
			data: envianceSdk.JSON.stringify({ "locationInfo": locationInfo }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.compliance.updateLocationAsync = function (locationIdOrPath, locationInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ComplianceService.svc/locations/' + _private.uriPathEncode(locationIdOrPath) + ''),
			data:  envianceSdk.JSON.stringify({ "locationInfo": locationInfo })
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Data.IDataService
	envianceRegisterNamespace("envianceSdk.data");

	envianceSdk.data.getCalculationPeriods = function (options, onsuccess, onerror) {
		//start, end, intervalType, factor, batchSize, timezones
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/calculations/calculationperiods'),
			data:  envianceSdk.JSON.stringify(options)
		}, onsuccess, onerror);
	};
	envianceSdk.data.getCalculationRanges = function (options, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/calculations/calculationranges'),
			data: envianceSdk.JSON.stringify(options)
		}, onsuccess, onerror);
	};
	envianceSdk.data.deleteNumericData = function(numericDataRanges, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/numericdata/deletedatacommands'),
			data: envianceSdk.JSON.stringify({ "numericDataRanges": numericDataRanges }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.data.deleteNumericDataAsync = function (numericDataRanges, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/numericdata/deletedatacommands'),
			data:  envianceSdk.JSON.stringify({ "numericDataRanges": numericDataRanges })
		}, onsuccess, onerror);
	};

	envianceSdk.data.enterNumericData = function (numericDataPoints, collector, onsuccess, onerror) {
		//Check for old version
		if (arguments.length < 4 && typeof (collector) == "function") {
			onerror = onsuccess;
			onsuccess = collector;
			collector = null;
		}

		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/numericdata/enterdatacommands'),
			data: envianceSdk.JSON.stringify({ "numericDataPoints": numericDataPoints, "collector" : collector }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.data.enterNumericDataAsync = function (numericDataPoints, collector, onsuccess, onerror) {
		//Check for old version
		if (arguments.length < 4 && typeof (collector) == "function") {
			onerror = onsuccess;
			onsuccess = collector;
			collector = null;
		}
		
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/numericdata/enterdatacommands'),
			data: envianceSdk.JSON.stringify({ "numericDataPoints": numericDataPoints, "collector": collector })
		}, onsuccess, onerror);
	};

	envianceSdk.data.downloadExcelData = function (options, onsuccess, onerror) {
		if (!options) {
			onerror(null, "Options validation", "No options");
			return null;
		}
		
		return _private._formDataSubmit({
			type: "POST",
			url: _private._buildUrl('ver2/DataService.svc/numericdata/exceldata'),
			data: envianceSdk.JSON._preProcess(options)
		}, onsuccess, onerror);
	};

	envianceSdk.data.uploadExcelDataBinary = function (fileinput, containerIdOrPath, onsuccess, onerror) {
		var validationResults = envianceSdk.common.validateUploadFiles([fileinput]);
		if (validationResults.length > 0) {
			var errorMessage = '';
			for (var i = 0; i < validationResults.length; i++) {
				errorMessage += validationResults[i].inputId + ':' + validationResults[i].message + '\n';
			}
			onerror(null, "Upload validation", errorMessage);
			return null;
		}

		return _private._formDataSubmit({
				fileinputs: [fileinput],
				type: "POST",
				url: _private._buildUrl('ver2/DataService.svc/numericdata/uploadexcelcommands'),
				data: envianceSdk.JSON._preProcess({ "containerIdOrPath": containerIdOrPath })
			}, onsuccess, onerror);
	};
	
	envianceSdk.data.uploadExcelData = function (fileinputOrContent, containerIdOrPath, onsuccess, onerror) {
		var isReadyContent = fileinputOrContent && $(fileinputOrContent)[0] && (!('tagName' in $(fileinputOrContent)[0]) || $(fileinputOrContent)[0].tagName != 'INPUT');

		if (!isReadyContent) {
			var validationResults = envianceSdk.common.validateUploadFiles([fileinputOrContent]);
			if (validationResults.length > 0) {
				var errorMessage = '';
				for (var i = 0; i < validationResults.length; i++) {
					errorMessage += validationResults[i].inputId + ':' + validationResults[i].message + '\n';
				}
				onerror(null, "Upload validation", errorMessage);
				return null;
			}
		}

		var sendFile = function (fileInputId, filename, content) {
			return _private._ajax({
				type: "POST",
				url: _private._buildUrl('ver2/DataService.svc/numericdata/uploadexcelcommands'),
				data: envianceSdk.JSON.stringify({ "content": content, "containerIdOrPath": containerIdOrPath })
			}, onsuccess, onerror);
		};

		if (isReadyContent) {
			return sendFile(null, null, fileinputOrContent);
		}
		else {
			return envianceSdk.common.configureFileInput($(fileinputOrContent).attr('id'), sendFile);
		}
	};

	//Enviance.RestServices.Documents.IDocumentService 
	envianceRegisterNamespace("envianceSdk.documents");

	envianceSdk.documents.createDocument = function(documentInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DocumentService.svc/documents'),
			data: envianceSdk.JSON.stringify({ "documentInfo": documentInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.documents.createDocumentBinary = function (fileInput, documentInfo, onsuccess, onerror) {
		return _private._formDataSubmit({
			fileinputs: [fileInput],
			type: "POST",
			url: _private._buildUrl('ver2/DocumentService.svc/documents'),
			data: envianceSdk.JSON._preProcess({ "documentInfo": documentInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.documents.copyDocument = function(documentInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DocumentService.svc/documents'),
			data: envianceSdk.JSON.stringify({
				"documentInfo": documentInfo,
				"copyFrom": copyFrom
			})
		}, onsuccess, onerror);
	};
	envianceSdk.documents.getDocument = function(documentIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/DocumentService.svc/documents/' + _private.uriPathEncode(documentIdOrPath) + '')
		}, onsuccess, onerror);
	};
	
	envianceSdk.documents.getDocumentContentBinary = function (documentIdOrPath, onsuccess, onerror) {
		return _private._formDataSubmit({
			type: "GET",
			url: _private._buildUrl("/ver2/DocumentService.svc/documents/" + _private.uriPathEncode(documentIdOrPath)),
			data: {"content":null}
			},
			onsuccess, onerror);
	};
	
	envianceSdk.documents.updateDocument = function(documentIdOrPath, documentInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/DocumentService.svc/documents/' + _private.uriPathEncode(documentIdOrPath) + ''),
			data: envianceSdk.JSON.stringify({ "documentInfo": documentInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.documents.updateDocumentBinary = function (fileInput, documentIdOrPath, documentInfo, updateExistingVersion, onsuccess, onerror) {
		var updateExistingVersionValue = false;
		if (updateExistingVersion) {
			updateExistingVersionValue = updateExistingVersion;
		}
		return _private._formDataSubmit({
			fileinputs: [fileInput],
			type: "PATCH",
			url: _private._buildUrl('ver2/DocumentService.svc/documents/' + _private.uriPathEncode(documentIdOrPath) + '?UpdateExistingVersion=' + updateExistingVersionValue),
			data: envianceSdk.JSON._preProcess({ "documentInfo": documentInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.documents.deleteDocument = function(documentIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/DocumentService.svc/documents/' + _private.uriPathEncode(documentIdOrPath) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.documents.createDocumentFolder = function(documentFolderInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DocumentService.svc/folders'),
			data: envianceSdk.JSON.stringify({ "documentFolderInfo": documentFolderInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.documents.copyDocumentFolder = function(documentFolderInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/DocumentService.svc/folders'),
			data: envianceSdk.JSON.stringify({
				"documentFolderInfo": documentFolderInfo,
				"copyFrom": copyFrom
			})
		}, onsuccess, onerror);
	};
	envianceSdk.documents.getDocumentFolder = function(documentFolderIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/DocumentService.svc/folders/' + _private.uriPathEncode(documentFolderIdOrPath) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.documents.updateDocumentFolder = function(documentFolderIdOrPath, documentFolderInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/DocumentService.svc/folders/' + _private.uriPathEncode(documentFolderIdOrPath) + ''),
			data: envianceSdk.JSON.stringify({ "documentFolderInfo": documentFolderInfo })
		}, onsuccess, onerror);
	};

	envianceSdk.documents.deleteDocumentFolder = function(documentFolderIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/DocumentService.svc/folders/' + _private.uriPathEncode(documentFolderIdOrPath) + ''),
			data: {}
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Eql.IEqlService 
	envianceRegisterNamespace("envianceSdk.eql");

	envianceSdk.eql.execute = function(eql, page, pageSize, onsuccess, onerror) {
		return envianceSdk.eql.executeWithFormat(eql, page, pageSize, "json", onsuccess, onerror);
	};
	envianceSdk.eql.executeWithFormat = function(eql, page, pageSize, format, onsuccess, onerror) {
		function isSpecifiedFormat(srcFormat, dstFormat) {
			return typeof srcFormat == "string" && srcFormat.toLowerCase() == dstFormat;
		}
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/EqlService.svc/query'),
			data: envianceSdk.JSON.stringify({ eql: eql, page: page, pageSize: pageSize, format: format }),
			dataType: isSpecifiedFormat(format, "xml") ? "xml" : null,
			success: function(response, textStatus, xhr) {
				if (onsuccess != null) {
					if (isSpecifiedFormat(format, "json")) {
						onsuccess(_private._processDatasetResult(response, xhr));
					} else {
						var processedResponse = _private._processResult(response, xhr);

						// This will occur when calling via easyXDM.
						if (isSpecifiedFormat(format, "xml") && !jQuery.isXMLDoc(processedResponse.result)) {
							try {
								processedResponse.result = jQuery.parseXML(xhr.responseText);
							} catch (e) {
								onerror({ metadata: { statusCode: 0 }, error: e });
							}
						}
						onsuccess(processedResponse);
					}
				}
			}
		}, onsuccess, onerror);
		};
	envianceSdk.eql.executeWithFormatBinary = function (eql, page, pageSize, format, filename, cachecontrol, onsuccess, onerror) {
		
		function isSpecifiedFormat(srcFormat, dstFormat) {
			return typeof srcFormat == "string" && srcFormat.toLowerCase() == dstFormat;
		}
		
		if (filename == null) {
			filename = "result." + format;
		}

		return _private._formDataSubmit({
			type: "POST",
			url: _private._buildUrl('ver2/EqlService.svc/query'),
			data: envianceSdk.JSON._preProcess({ eql: eql, page: page, pageSize: pageSize, format: format, filename: filename, cachecontrol: cachecontrol }),
			dataType: isSpecifiedFormat(format, "xml") ? "xml" : null,
			success: function (response, textStatus, xhr) {
				if (onsuccess != null) {
					if (isSpecifiedFormat(format, "json")) {
						onsuccess(_private._processDatasetResult(response, xhr));
					} else {
						var processedResponse = _private._processResult(response, xhr);

						// This will occur when calling via easyXDM.
						if (isSpecifiedFormat(format, "xml") && !jQuery.isXMLDoc(processedResponse.result)) {
							try {
								processedResponse.result = jQuery.parseXML(xhr.responseText);
							} catch (e) {
								onerror({ metadata: { statusCode: 0 }, error: e });
							}
						}
						onsuccess(processedResponse);
					}
				}
			}
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Events.IEventService 
	envianceRegisterNamespace("envianceSdk.events");

	envianceSdk.events.createEvent = function(eventLogIdOrTag, eventInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/EventService.svc/eventlogs/' + encodeURIComponent(eventLogIdOrTag) + '/events'),
			data: envianceSdk.JSON.stringify({ "eventInfo": eventInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.events.deleteEvent = function(eventLogIdOrTag, eventIdOrTag, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/EventService.svc/eventlogs/' + encodeURIComponent(eventLogIdOrTag) + '/events/' + encodeURIComponent(eventIdOrTag) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.events.getEvent = function(eventLogIdOrTag, eventIdOrTag, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/EventService.svc/eventlogs/' + encodeURIComponent(eventLogIdOrTag) + '/events/' + encodeURIComponent(eventIdOrTag) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.events.updateEvent = function(eventLogIdOrTag, eventIdOrTag, eventInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/EventService.svc/eventlogs/' + encodeURIComponent(eventLogIdOrTag) + '/events/' + encodeURIComponent(eventIdOrTag) + ''),
			data: envianceSdk.JSON.stringify({ "eventInfo": eventInfo })
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Packages.IPackageService 
	envianceRegisterNamespace("envianceSdk.packages");

	envianceSdk.packages.createPackage = function(packageInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PackageService.svc/packages'),
			data: envianceSdk.JSON.stringify({ "packageInfo": packageInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.createPackageItem = function(packageIdOrName, packageItemInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) + '/items'),
			data: envianceSdk.JSON.stringify({ "packageItemInfo": packageItemInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.copyPackage = function(packageInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PackageService.svc/packages'),
			data: envianceSdk.JSON.stringify({ "packageInfo": packageInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.copyPackageItem = function(packageIdOrName, packageItemInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) + '/items'),
			data: envianceSdk.JSON.stringify({ "packageItemInfo": packageItemInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.deletePackage = function(packageIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.packages.deletePackageItem = function(packageIdOrName, packageItemIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) +
									'/items/' + _private.uriPathEncode(packageItemIdOrPath) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.packages.getPackage = function(packageIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.packages.getPackageItem = function(packageIdOrName, packageItemIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) +
				'/items/' + _private.uriPathEncode(packageItemIdOrPath) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.packages.updatePackage = function(packageIdOrName, packageInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "packageInfo": packageInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.updatePackageItem = function(packageIdOrName, packageItemIdOrPath, packageItemInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + encodeURIComponent(packageIdOrName) +
									'/items/' + _private.uriPathEncode(packageItemIdOrPath) + ''),
			data: envianceSdk.JSON.stringify({ "packageItemInfo": packageItemInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.getPackageAppData = function(packageIdOrName, key, onsuccess, onerror) {
		_private._checkPackageAppDataKey(key);
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + _private.uriPathEncode(packageIdOrName) + '/data/' + _private.uriPathEncode(key))
		}, onsuccess, onerror);
	};
	envianceSdk.packages.savePackageAppData = function(packageIdOrName, key, value, onsuccess, onerror) {
		_private._checkPackageAppDataKey(key);
		if (typeof (value) != "string") {
			throw new Error("The argument <value> is not a string.");
		}
		return _private._ajax({
			type: "PUT",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + _private.uriPathEncode(packageIdOrName) + '/data/' + _private.uriPathEncode(key)),
			data: envianceSdk.JSON.stringify({ "value": value })
		}, onsuccess, onerror);
	};
	envianceSdk.packages.deletePackageAppData = function(packageIdOrName, key, onsuccess, onerror) {
		_private._checkPackageAppDataKey(key);
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PackageService.svc/packages/' + _private.uriPathEncode(packageIdOrName) + '/data/' + _private.uriPathEncode(key)),
			data: {}
		}, onsuccess, onerror);
	};
	_private._checkPackageAppDataKey = function(key) {
		if (typeof (key) != "string" || key == "") {
			throw new Error("The key <" + key + "> argument is not a string or is empty.");
		}
		if (key.length > 100) {
			throw new Error("The key <" + key + "> argument cannot be greater than 100 characters.");
		}
		if (key.charAt(0) == "/") {
			throw new Error("The key <" + key + "> argument cannot start with a character '/'");
		}
		// Special symbols detect for IIS6
		if (key.indexOf("#") >= 0 || key.indexOf("%") >= 0 ||
			key.indexOf("*") >= 0 || key.indexOf("&") >= 0 ||
			key.indexOf("?") >= 0 || key.indexOf("\\") >= 0 ||
			key.indexOf("|") >= 0) {
			throw new Error("The key <" + key + "> argument contains illegal characters '/'");
		}
	};

	//Enviance.RestServices.Security.IAuthenticationService 
	envianceRegisterNamespace("envianceSdk.authentication");

	envianceSdk.authentication.authenticate = function(userName, password, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/AuthenticationService.svc/sessions'),
			data: envianceSdk.JSON.stringify({ userName: userName, password: password }),
			success: function(response, textStatus, xhr) {
				envianceSdk.setSessionId(response);
				envianceSdk.setSystemId(null);
				if (onsuccess != null) {
					onsuccess(_private._processResult(response, xhr));
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.authentication.authenticateByCert = function(encryptedUserName, certUniqueId, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/AuthenticationService.svc/sessions/cert'),
			data: envianceSdk.JSON.stringify({ encryptedUserName: encryptedUserName, certUniqueId: certUniqueId }),
			success: function(response, textStatus, xhr) {
				envianceSdk.setSessionId(response);
				envianceSdk.setSystemId(null);
				if (onsuccess != null) {
					onsuccess(_private._processResult(response, xhr));
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.authentication.endCurrentSession = function(onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/AuthenticationService.svc/currentsession'),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.authentication.getCurrentSession = function(onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/AuthenticationService.svc/currentsession')
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Tasks.ITaskService 
	envianceRegisterNamespace("envianceSdk.tasks");

	envianceSdk.tasks.createTask = function(taskInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/TaskService.svc/tasks'),
			data: envianceSdk.JSON.stringify({ "taskInfo": taskInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.copyTask = function(taskInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/TaskService.svc/tasks'),
			data: envianceSdk.JSON.stringify({ "taskInfo": taskInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.deleteTask = function(taskId, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/TaskService.svc/tasks/' + encodeURIComponent(taskId) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.getTask = function(taskId, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/TaskService.svc/tasks/' + encodeURIComponent(taskId) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.exportTaskAsICal = function (taskId, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/TaskService.svc/tasks/' + encodeURIComponent(taskId) + '/ical')
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.updateTask = function(taskId, taskInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/TaskService.svc/tasks/' + encodeURIComponent(taskId) + ''),
			data: envianceSdk.JSON.stringify({ "taskInfo": taskInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.getTaskOccurrence = function(taskId, dueDate, objectIdOrPath, onsuccess, onerror) {
		if (dueDate instanceof Date) {
			dueDate = envianceSdk.IsoDate.toLocalString(dueDate);
		}
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/TaskService.svc/tasks/' + encodeURIComponent(taskId) + '/occurrences/' + encodeURIComponent(dueDate) +
									'/' + (objectIdOrPath == null ? '' : _private.uriPathEncode(objectIdOrPath)))
		}, onsuccess, onerror);
	};
	envianceSdk.tasks.completeTaskOccurrence = function(taskId, dueDate, objectIdOrPath, taskOccurrenceInfos, onsuccess, onerror) {
		if (dueDate instanceof Date) {
			dueDate = envianceSdk.IsoDate.toLocalString(dueDate);
		}
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/TaskService.svc/tasks/' + encodeURIComponent(taskId) + '/occurrences/' + encodeURIComponent(dueDate) +
									'/' + (objectIdOrPath == null ? '' : _private.uriPathEncode(objectIdOrPath))),
			data: envianceSdk.JSON.stringify({ "taskOccurrenceInfos": taskOccurrenceInfos })
		}, onsuccess, onerror);
	};
	//Enviance.RestServices.Workflows.IWorkflowService 
	envianceRegisterNamespace("envianceSdk.workflows");

	envianceSdk.workflows.createWorkflow = function(workflowInfo, initStepInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows'),
			data: envianceSdk.JSON.stringify({ "workflowInfo": workflowInfo, "initStepInfo": initStepInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.getWorkflow = function(workflowIdOrUniqueId, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.updateWorkflow = function(workflowIdOrUniqueId, workflowInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + ''),
			data: envianceSdk.JSON.stringify({ "workflowInfo": workflowInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.deleteWorkflow = function(workflowIdOrUniqueId, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.generateUniqueIds = function(workflowTypeIdOrName, count, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflowtypes/' + encodeURIComponent(workflowTypeIdOrName) + '/uniqueIds?count=' + encodeURIComponent(count) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.initiateChildWorkflow = function(workflowIdOrUniqueId, childWorkflowInitiationInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + '/children'),
			data: envianceSdk.JSON.stringify({ "childWorkflowInitiationInfo": childWorkflowInitiationInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.getWorkflowStep = function(workflowIdOrUniqueId, stepIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + '/steps') + '/' + encodeURIComponent(stepIdOrName) + ''
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.getWorkflowCurrentStep = function(workflowIdOrUniqueId, onsuccess, onerror) {
		return envianceSdk.workflows.getWorkflowStep(workflowIdOrUniqueId, "currentstep", onsuccess, onerror);
	};
	envianceSdk.workflows.updateWorkflowStep = function(workflowIdOrUniqueId, stepIdOrName, stepInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + '/steps') + '/' + encodeURIComponent(stepIdOrName) + '',
			data: envianceSdk.JSON.stringify({ "stepInfo": stepInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.updateWorkflowCurrentStep = function(workflowIdOrUniqueId, stepInfo, onsuccess, onerror) {
		return envianceSdk.workflows.updateWorkflowStep(workflowIdOrUniqueId, "currentstep", stepInfo, onsuccess, onerror);
	};
	envianceSdk.workflows.endWorkflow = function(workflowIdOrUniqueId, comment, onsuccess, onerror) {
		var stepInfo = new envianceSdk.workflows.WorkflowStepInfo(comment);
		stepInfo.setTransition("End Workflow");
		return envianceSdk.workflows.updateWorkflowCurrentStep(workflowIdOrUniqueId, stepInfo, onsuccess, onerror);
	};
	envianceSdk.workflows.resolvePermissions = function (workflowIdOrUniqueId, stepIdOrName, userId, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflows/' + encodeURIComponent(workflowIdOrUniqueId) + '/steps') + '/' + encodeURIComponent(stepIdOrName) + '/users/' + encodeURIComponent(userId) + ''
		}, onsuccess, onerror);
	};
	envianceSdk.workflows.guessPermissions = function (workflowTypeIdOrName, options, onsuccess, onerror) {
		var ajaxObj = {
			type: "POST",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflowtypes/' + encodeURIComponent(workflowTypeIdOrName) + '/guessPermissions'),
			data: envianceSdk.JSON.stringify({ "options": options })
		};
		return _private._ajax(ajaxObj, onsuccess, onerror);
	};
	envianceSdk.workflows.guessPermissionsByUser = function (workflowTypeIdOrName, userId, options, onsuccess, onerror) {
		var ajaxObj = {
			type: "POST",
			url: _private._buildUrl('ver2/WorkflowService.svc/workflowtypes/' + encodeURIComponent(workflowTypeIdOrName) + '/users/' + encodeURIComponent(userId) + '/guessPermissions'),
			data: envianceSdk.JSON.stringify({ "options": options })
		};
		return _private._ajax(ajaxObj, onsuccess, onerror);
	};

	//Enviance.RestServices.Ver2.Reports.IReportService 
	envianceRegisterNamespace("envianceSdk.reports");

	envianceSdk.reports.execute = function(reportExecutionInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ReportService.svc/reports/executereportcommands'),
			data: envianceSdk.JSON.stringify({ "reportExecutionInfo": reportExecutionInfo }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.reports.executeAsync = function (reportExecutionInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ReportService.svc/reports/executereportcommands'),
			data: envianceSdk.JSON.stringify({ "reportExecutionInfo": reportExecutionInfo })
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.Messages.IMessageService
	envianceRegisterNamespace("envianceSdk.messages");

	envianceSdk.messages.createMessage = function(messageInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MessageService.svc/messages'),
			data: envianceSdk.JSON.stringify({ "messageInfo": messageInfo })
		}, onsuccess, onerror);
	};

	envianceSdk.messages.getMessage = function(messageId, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MessageService.svc/messages/' + encodeURIComponent(messageId))
		}, onsuccess, onerror);
	};

	envianceSdk.messages.deleteMessage = function(messageId, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/MessageService.svc/messages/' + encodeURIComponent(messageId))
		}, onsuccess, onerror);
	};


	//Enviance.RestServices.Messages.ISecurityService
	envianceRegisterNamespace("envianceSdk.groups");

	envianceSdk.groups.getGroup = function(groupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.groups.createGroup = function(groupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/SecurityService.svc/groups'),
			data: envianceSdk.JSON.stringify({ "groupInfo": groupInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.groups.updateGroup = function(groupIdOrName, groupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupIdOrName)),
			data: envianceSdk.JSON.stringify({ "groupInfo": groupInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.groups.deleteGroup = function(groupdNameOrId, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupdNameOrId))
		}, onsuccess, onerror);
	};
	envianceSdk.groups.getGroupMembers = function(groupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupIdOrName) + '/members')
		}, onsuccess, onerror);
	};
	envianceSdk.groups.setGroupMembers = function(groupIdOrName, members, onsuccess, onerror) {
		return _private._ajax({
			type: "PUT",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupIdOrName) + '/members'),
			data: envianceSdk.JSON.stringify({ "members": members })
		}, onsuccess, onerror);
	};
	envianceSdk.groups.addGroupMembers = function(groupIdOrName, members, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupIdOrName) + '/members'),
			data: envianceSdk.JSON.stringify({ "members": members })
		}, onsuccess, onerror);
	};
	envianceSdk.groups.removeGroupMember = function(groupIdOrName, userIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/SecurityService.svc/groups/' + encodeURIComponent(groupIdOrName) + '/members/' + encodeURIComponent(userIdOrName))
		}, onsuccess, onerror);
	};
	
	//Enviance.RestServices.Chemicals.IChemicalService 
	envianceRegisterNamespace("envianceSdk.chemicals");

	envianceSdk.chemicals.createChemical = function (chemicalInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ChemicalService.svc/chemicals'),			
			data: envianceSdk.JSON.stringify({ "chemicalInfo": chemicalInfo })
		}, onsuccess, onerror);
	};
	
	envianceSdk.chemicals.copyChemical = function (chemicalInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ChemicalService.svc/chemicals'),
			data: envianceSdk.JSON.stringify({ "chemicalInfo": chemicalInfo, "copyFrom": copyFrom  })			
		}, onsuccess, onerror);
	};

	envianceSdk.chemicals.getChemical = function (chemicalIdOrAlias, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/ChemicalService.svc/chemicals/' + encodeURIComponent(chemicalIdOrAlias) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.chemicals.updateChemical = function (chemicalIdOrAlias, chemicalInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ChemicalService.svc/chemicals/' + encodeURIComponent(chemicalIdOrAlias) + ''),
			data: envianceSdk.JSON.stringify({ "chemicalInfo": chemicalInfo }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.chemicals.updateChemicalAsync = function (chemicalIdOrAlias, chemicalInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ChemicalService.svc/chemicals/' + encodeURIComponent(chemicalIdOrAlias) + ''),
			data: envianceSdk.JSON.stringify({ "chemicalInfo": chemicalInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.chemicals.deleteChemical = function (chemicalIdOrAlias, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/ChemicalService.svc/chemicals/' + encodeURIComponent(chemicalIdOrAlias) + '')
		}, onsuccess, onerror);
	};

	
	//Enviance.RestServices.ChemicalGroups.IChemicalGroupService 
	envianceRegisterNamespace("envianceSdk.chemicalgroups");

	envianceSdk.chemicalgroups.createChemicalGroup = function (chemicalGroupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ChemicalGroupService.svc/chemicalgroups'),			
			data: envianceSdk.JSON.stringify({ "chemicalGroupInfo": chemicalGroupInfo })
		}, onsuccess, onerror);
	};
	
	envianceSdk.chemicalgroups.copyChemicalGroup = function (chemicalGroupInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ChemicalGroupService.svc/chemicalgroups'),
			data: envianceSdk.JSON.stringify({ "chemicalGroupInfo": chemicalGroupInfo, "copyFrom": copyFrom  })			
		}, onsuccess, onerror);
	};

	envianceSdk.chemicalgroups.getChemicalGroup = function (chemicalGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/ChemicalGroupService.svc/chemicalgroups/' + encodeURIComponent(chemicalGroupIdOrName) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.chemicalgroups.updateChemicalGroup = function (chemicalGroupIdOrName, chemicalGroupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ChemicalGroupService.svc/chemicalgroups/' + encodeURIComponent(chemicalGroupIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "chemicalGroupInfo": chemicalGroupInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.chemicalgroups.deleteChemicalGroup = function (chemicalGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/ChemicalGroupService.svc/chemicalgroups/' + encodeURIComponent(chemicalGroupIdOrName) + '')
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.ChemicalLists.IChemicalListService
	envianceRegisterNamespace("envianceSdk.chemicallists");
	
	envianceSdk.chemicallists.createChemicalList = function (chemicalListInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ChemicalListService.svc/chemicallists'),
			data: envianceSdk.JSON.stringify({ "chemicalListInfo": chemicalListInfo })
		}, onsuccess, onerror);
	};
	
	envianceSdk.chemicallists.copyChemicalList = function (chemicalListInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ChemicalListService.svc/chemicallists'),
			data: envianceSdk.JSON.stringify({ "chemicalListInfo": chemicalListInfo, "copyFrom": copyFrom })			
		}, onsuccess, onerror);
	};

	envianceSdk.chemicallists.getChemicalList = function (chemicalListIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/ChemicalListService.svc/chemicallists/' + encodeURIComponent(chemicalListIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.chemicallists.updateChemicalList = function (chemicalListIdOrName, chemicalListInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ChemicalListService.svc/chemicallists/' + encodeURIComponent(chemicalListIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "chemicalListInfo": chemicalListInfo }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.chemicallists.updateChemicalListAsync = function (chemicalListIdOrName, chemicalListInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/ChemicalListService.svc/chemicallists/' + encodeURIComponent(chemicalListIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "chemicalListInfo": chemicalListInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.chemicallists.deleteChemicalList = function (chemicalListIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/ChemicalListService.svc/chemicallists/' + encodeURIComponent(chemicalListIdOrName) + '')
		}, onsuccess, onerror);
	};
	
	
	//Enviance.RestServices.Activities.IActivityService 
	envianceRegisterNamespace("envianceSdk.activities");

	envianceSdk.activities.createActivity = function (activityInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ActivityService.svc/activities'),
			data: envianceSdk.JSON.stringify({ "activityInfo": activityInfo })			
		}, onsuccess, onerror);
	};
	envianceSdk.activities.copyActivity = function (activityInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/ActivityService.svc/activities'),
			data: envianceSdk.JSON.stringify({ "activityInfo": activityInfo, "copyFrom": copyFrom  })			
		}, onsuccess, onerror);
	};
	envianceSdk.activities.getActivity = function (activityIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/ActivityService.svc/activities/' + encodeURIComponent(activityIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.activities.updateActivity = function (activityIdOrName, activityInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PUT",
			url: _private._buildUrl('ver2/ActivityService.svc/activities/' + encodeURIComponent(activityIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "activityInfo": activityInfo }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.activities.updateActivityAsync = function (activityIdOrName, activityInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PUT",
			url: _private._buildUrl('ver2/ActivityService.svc/activities/' + encodeURIComponent(activityIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "activityInfo": activityInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.activities.deleteActivity = function (activityIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/ActivityService.svc/activities/' + encodeURIComponent(activityIdOrName) + '')
		}, onsuccess, onerror);
	};
	 
	//Enviance.RestServices.Materials.IMaterialService 
	envianceRegisterNamespace("envianceSdk.materials");

	envianceSdk.materials.createMaterial = function (materialInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialService.svc/materials'),			
			data: envianceSdk.JSON.stringify({ "materialInfo": materialInfo }),
			success: function (response, textStatus, xhr) {				
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materials.createMaterialAsync = function (materialInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialService.svc/materials'),
			data: envianceSdk.JSON.stringify({ "materialInfo": materialInfo })
		}, onsuccess, onerror);
	};

	envianceSdk.materials.copyMaterial = function (materialInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialService.svc/materials'),
			data: envianceSdk.JSON.stringify({ "materialInfo": materialInfo, "copyFrom": copyFrom }),			
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materials.copyMaterialAsync = function (materialInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialService.svc/materials'),
			data: envianceSdk.JSON.stringify({ "materialInfo": materialInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.materials.getMaterial = function (materialIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MaterialService.svc/materials/' + encodeURIComponent(materialIdOrName) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.materials.updateMaterial = function (materialIdOrName, materialInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/MaterialService.svc/materials/' + encodeURIComponent(materialIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "materialInfo": materialInfo}),
			success: function (response, textStatus, xhr) {				
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materials.updateMaterialAsync = function (materialIdOrName, materialInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/MaterialService.svc/materials/' + encodeURIComponent(materialIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "materialInfo": materialInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.materials.deleteMaterial = function (materialIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/MaterialService.svc/materials/' + encodeURIComponent(materialIdOrName) + '')
		}, onsuccess, onerror);
	};

	//Enviance.RestServices.MaterialGroups.IMaterialGroupService 
	envianceRegisterNamespace("envianceSdk.materialGroups");

	envianceSdk.materialGroups.createMaterialGroup = function (materialGroupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups'),
			data: envianceSdk.JSON.stringify({ "materialGroupInfo": materialGroupInfo })			
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.copyMaterialGroup = function (materialGroupInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups'),
			data: envianceSdk.JSON.stringify({ "materialGroupInfo": materialGroupInfo, "copyFrom": copyFrom  })			
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.getMaterialGroup = function (materialGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups/' + encodeURIComponent(materialGroupIdOrName) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.updateMaterialGroup = function (materialGroupIdOrName, materialGroupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups/' + encodeURIComponent(materialGroupIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "materialGroupInfo": materialGroupInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.deleteMaterialGroup = function (materialGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups/' + encodeURIComponent(materialGroupIdOrName) + '')
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.getDependentMacs = function (materialGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups/trackingMac/' + encodeURIComponent(materialGroupIdOrName) + '')			
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.updateDependentMacs = function (materialGroupIdOrName, macIds, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups/trackingMac/' + encodeURIComponent(materialGroupIdOrName) + ''),			
			data: envianceSdk.JSON.stringify({ "macIds": macIds }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materialGroups.updateDependentMacsAsync = function (materialGroupIdOrName, macIds, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialGroupService.svc/materialGroups/trackingMac/' + encodeURIComponent(materialGroupIdOrName) + ''),			
			data: envianceSdk.JSON.stringify({ "macIds": macIds })
		}, onsuccess, onerror);
	};

	
	//Enviance.RestServices.Ver2.TaggingObjects.Tag.ITagService
	envianceRegisterNamespace("envianceSdk.tags");
	
	envianceSdk.tags.createTag = function (tagInfo, onsuccess, onerror) {
			return _private._ajax({
					type: "POST",
					url: _private._buildUrl('ver2/TagService.svc/tags'),					
					data: envianceSdk.JSON.stringify({ "tagInfo": tagInfo })
				}, onsuccess, onerror);
		};
	envianceSdk.tags.getTag = function (tagIdOrSchemeIdAndTagName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/TagService.svc/tags/' + _private.uriPathEncode(tagIdOrSchemeIdAndTagName) + '')
			}, onsuccess, onerror);
	};
	envianceSdk.tags.updateTag = function (tagIdOrSchemeIdAndTagName, tagInfo, onsuccess, onerror) {
			return _private._ajax({
					type: "PATCH",
					url: _private._buildUrl('ver2/TagService.svc/tags/' + _private.uriPathEncode(tagIdOrSchemeIdAndTagName) + ''),					
					data: envianceSdk.JSON.stringify({ "tagInfo": tagInfo })
				}, onsuccess, onerror);
	};
	envianceSdk.tags.deleteTag = function (tagIdOrSchemeIdAndTagName, onsuccess, onerror) {
			return _private._ajax({
					type: "DELETE",
					url: _private._buildUrl('ver2/TagService.svc/tags/' + _private.uriPathEncode(tagIdOrSchemeIdAndTagName) + '')
				}, onsuccess, onerror);
	};

	//Enviance.RestServices.Ver2.TaggingObjects.TagScheme.ITagSchemeService
	envianceRegisterNamespace("envianceSdk.tagSchemes");

	envianceSdk.tagSchemes.createTagScheme = function (tagSchemeInfo, onsuccess, onerror) {
			return _private._ajax({
					type: "POST",
					url: _private._buildUrl('ver2/TagSchemeService.svc/tagschemes'),
					data: envianceSdk.JSON.stringify({ "tagSchemeInfo": tagSchemeInfo })					
				}, onsuccess, onerror);
	};
	envianceSdk.tagSchemes.copyTagScheme = function(tagSchemeInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/TagSchemeService.svc/tagschemes'),
			data: envianceSdk.JSON.stringify({ "tagSchemeInfo": tagSchemeInfo, "copyFrom": copyFrom })			
		}, onsuccess, onerror);
	};
	envianceSdk.tagSchemes.getTagScheme = function (tagSchemeIdOrName, onsuccess, onerror) {
			return _private._ajax({
					type: "GET",
					url: _private._buildUrl('ver2/TagSchemeService.svc/tagschemes/' + encodeURIComponent(tagSchemeIdOrName) + '')
				}, onsuccess, onerror);
	};
	envianceSdk.tagSchemes.updateTagScheme = function (tagSchemeIdOrName, tagSchemeInfo, onsuccess, onerror) {
			return _private._ajax({
					type: "PATCH",
					url: _private._buildUrl('ver2/TagSchemeService.svc/tagschemes/' + encodeURIComponent(tagSchemeIdOrName) + ''),					
					data: envianceSdk.JSON.stringify({ "tagSchemeInfo": tagSchemeInfo})
				}, onsuccess, onerror);
	};
	envianceSdk.tagSchemes.deleteTagScheme = function (tagSchemeIdOrName, onsuccess, onerror) {
			return _private._ajax({
					type: "DELETE",
					url: _private._buildUrl('ver2/TagSchemeService.svc/tagschemes/' + encodeURIComponent(tagSchemeIdOrName) + '')
				}, onsuccess, onerror);
	};
	
	//Enviance.RestServices.Ver2.MaterialActivity.Data.IMaterialDataService 
	envianceRegisterNamespace("envianceSdk.materialData");
	
	envianceSdk.materialData.enterMaterialData = function (mdlGroupsInfo, partialProcess, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/enterdatacommands/'),			
			data: envianceSdk.JSON.stringify({ "mdlGroupsInfo": mdlGroupsInfo, "partialProcess": partialProcess}),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materialData.enterMaterialDataAsync = function (mdlGroupsInfo, partialProcess, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/enterdatacommands/'),			
			data: envianceSdk.JSON.stringify({ "mdlGroupsInfo": mdlGroupsInfo, "partialProcess": partialProcess})
		}, onsuccess, onerror);
	};
	envianceSdk.materialData.deleteMaterialData = function (locationIdOrPath, mdlGroupIds, waitForCompletion, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/deletedatacommands/' + _private.uriPathEncode(locationIdOrPath) + ''),			
			data: envianceSdk.JSON.stringify({ "mdlGroupIds": mdlGroupIds}),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					if (waitForCompletion) {
						_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
					} else {
						onsuccess(response);
						}
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materialData.deleteMaterialDataAsync = function (locationIdOrPath, mdlGroupIds, waitForCompletion, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/deletedatacommands/' + _private.uriPathEncode(locationIdOrPath) + ''),			
			data: envianceSdk.JSON.stringify({ "mdlGroupIds": mdlGroupIds})
		}, onsuccess, onerror);
	};
	envianceSdk.materialData.getMaterialData = function (activityIdOrName, completeBegin, completeEnd, locationIdOrPath, onsuccess, onerror) {
		if (completeBegin instanceof Date) {
			completeBegin = envianceSdk.IsoDate.toLocalString(completeBegin);
		}
		if (completeEnd instanceof Date) {
			completeEnd = envianceSdk.IsoDate.toLocalString(completeEnd);
		}
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/' + encodeURIComponent(activityIdOrName) +
				'/begin/' + encodeURIComponent(completeBegin) + '/end/' + encodeURIComponent(completeEnd) + '/' + _private.uriPathEncode(locationIdOrPath))
		}, onsuccess, onerror);
	};

	envianceSdk.materialData.downloadMaterialData = function (options, onsuccess, onerror) {
		if (!options) {
			onerror(null, "Options validation", "No options");
			return null;
		}

		return _private._formDataSubmit({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/download'),
			data: envianceSdk.JSON._preProcess(options)
		}, onsuccess, onerror);
	};

	envianceSdk.materialData.uploadMaterialData = function (fileinput, objectIdOrPath, onsuccess, onerror) {
		var validationResults = envianceSdk.common.validateUploadFiles([fileinput]);
		if (validationResults.length > 0) {
			var errorMessage = '';
			for (var i = 0; i < validationResults.length; i++) {
				errorMessage += validationResults[i].inputId + ':' + validationResults[i].message + '\n';
			}
			onerror(null, "Upload validation", errorMessage);
			return null;
		}

		return _private._formDataSubmit({
			fileinputs: [fileinput],
			type: "POST",
			url: _private._buildUrl('ver2/MaterialDataService.svc/materialdata/upload'),
			data: envianceSdk.JSON._preProcess({ "objectIdOrPath": objectIdOrPath })
		}, onsuccess, onerror);
	};
	


	//Enviance.RestServices.MaterialProperties.IMaterialPropertyService 
	envianceRegisterNamespace("envianceSdk.materialProperties");

	envianceSdk.materialProperties.createMaterialProperty = function (materialPropertyInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties'),			
			data: envianceSdk.JSON.stringify({ "materialPropertyInfo": materialPropertyInfo }),			
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.createMaterialPropertyAsync = function (materialPropertyInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties'),			
			data: envianceSdk.JSON.stringify({ "materialPropertyInfo": materialPropertyInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.copyMaterialProperty = function (materialPropertyInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties'),			
			data: envianceSdk.JSON.stringify({ "materialPropertyInfo": materialPropertyInfo, "copyFrom": copyFrom }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.copyMaterialPropertyAsync = function (materialPropertyInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties'),
			data: envianceSdk.JSON.stringify({ "materialPropertyInfo": materialPropertyInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.getMaterialProperty = function (materialPropertyIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties/' + encodeURIComponent(materialPropertyIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.updateMaterialProperty = function (materialPropertyIdOrName, materialPropertyInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties/' + encodeURIComponent(materialPropertyIdOrName) + ''),			
			data: envianceSdk.JSON.stringify({ "materialPropertyInfo": materialPropertyInfo}),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.updateMaterialPropertyAsync = function (materialPropertyIdOrName, materialPropertyInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties/' + encodeURIComponent(materialPropertyIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "materialPropertyInfo": materialPropertyInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.materialProperties.deleteMaterialProperty = function (materialPropertyIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/MaterialPropertyService.svc/materialProperties/' + encodeURIComponent(materialPropertyIdOrName) + '')
		}, onsuccess, onerror);
	};

	envianceRegisterNamespace("envianceSdk.materialTemplates");

	envianceSdk.materialTemplates.createMaterialTemplate = function (materialTemplateInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialTemplateService.svc/materialTemplates'),
			data: envianceSdk.JSON.stringify({ "materialTemplateInfo": materialTemplateInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.materialTemplates.copyMaterialTemplate = function (materialTemplateInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/MaterialTemplateService.svc/materialTemplates'),			
			data: envianceSdk.JSON.stringify({ "materialTemplateInfo": materialTemplateInfo, "copyFrom": copyFrom })
		}, onsuccess, onerror);
	};
	envianceSdk.materialTemplates.getMaterialTemplate = function (materialTemplateIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/MaterialTemplateService.svc/materialTemplates/' + encodeURIComponent(materialTemplateIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.materialTemplates.updateMaterialTemplate = function (materialTemplateIdOrName, materialTemplateInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/MaterialTemplateService.svc/materialTemplates/' + encodeURIComponent(materialTemplateIdOrName) + ''),
			data: envianceSdk.JSON.stringify({ "materialTemplateInfo": materialTemplateInfo })			
		}, onsuccess, onerror);
	};
	envianceSdk.materialTemplates.deleteMaterialTemplate = function (materialTemplateIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/MaterialTemplateService.svc/materialTemplates/' + encodeURIComponent(materialTemplateIdOrName) + '')
		}, onsuccess, onerror);
	};
	
	//Enviance.RestServices.Requirements.IRequirementService 
	envianceRegisterNamespace("envianceSdk.requirements");

	envianceSdk.requirements.createRequirement = function (reqInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements'),
			data: envianceSdk.JSON.stringify({ "reqInfo": reqInfo }),
			success: function(response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.createRequirementAsync = function (reqInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements'),
			data: envianceSdk.JSON.stringify({ "reqInfo": reqInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.copyRequirement = function (reqInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements'),			
			data: envianceSdk.JSON.stringify({ "reqInfo": reqInfo, "copyFrom": copyFrom }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.copyRequirementAsync = function (reqInfo, copyFrom, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements'),
			data: envianceSdk.JSON.stringify({ "reqInfo": reqInfo, "copyFrom": copyFrom })			
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.getRequirement = function (requirementIdOrPath, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements/' + _private.uriPathEncode(requirementIdOrPath))
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.updateRequirement = function (requirementIdOrPath, reqInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements/' + _private.uriPathEncode(requirementIdOrPath) + ''),			
			data: envianceSdk.JSON.stringify({ "reqInfo": reqInfo }),
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.updateRequirementAsync = function (requirementIdOrPath, reqInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements/' + _private.uriPathEncode(requirementIdOrPath) + ''),			
			data: envianceSdk.JSON.stringify({ "reqInfo": reqInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.deleteRequirement = function (requirementIdOrPath, waitForCompletion, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements/' + _private.uriPathEncode(requirementIdOrPath) + ''),
			data: {},
			success: function (response, textStatus, xhr) {
				if (onsuccess) {
					if (waitForCompletion) {
						_private._runCommandPolling(_private._processResult(response, xhr), onsuccess, onerror);
					} else {
						onsuccess(response);
					}
				}
			}
		}, onsuccess, onerror);
	};
	envianceSdk.requirements.deleteRequirementAsync = function (requirementIdOrPath, waitForCompletion, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/RequirementService.svc/requirements/' + _private.uriPathEncode(requirementIdOrPath) + ''),
			data: {}
		}, onsuccess, onerror);
	};
	
	//Enviance.RestServices.Ver2.Portal.IPortalService 
	envianceRegisterNamespace("envianceSdk.portal");
	
	envianceSdk.portal.getPageGroups = function (onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups')
		}, onsuccess, onerror);
	};
	envianceSdk.portal.getPageGroup = function (pageGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.portal.createPageGroup = function (pageGroupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups'),
			data: envianceSdk.JSON.stringify({ "pageGroupInfo": pageGroupInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.updatePageGroup = function (pageGroupIdOrName, pageGroupInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)),
			data: envianceSdk.JSON.stringify({ "pageGroupInfo": pageGroupInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.deletePageGroup = function (pageGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName))
		}, onsuccess, onerror);
	};
	
	envianceSdk.portal.getPages = function (pageGroupIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)+'/pages')
		}, onsuccess, onerror);
	};
	envianceSdk.portal.getPage = function (pageGroupIdOrName, pageIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.portal.createPage = function (pageGroupIdOrName, pageInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName) + '/pages'),
			data: envianceSdk.JSON.stringify({ "pageInfo": pageInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.updatePage = function (pageGroupIdOrName, pageIdOrName, pageInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName)),
			data: envianceSdk.JSON.stringify({ "pageInfo": pageInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.deletePage = function (pageGroupIdOrName,pageIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.portal.getPageSettings = function (pageGroupIdOrName, pageIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/settings')
		}, onsuccess, onerror);
	};
	envianceSdk.portal.savePageSettings = function (pageGroupIdOrName, pageIdOrName, pageSettings, onsuccess, onerror) {
		return _private._ajax({
			type: "PUT",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/settings'),
			data: envianceSdk.JSON.stringify({ "pageSettings": pageSettings })
		}, onsuccess, onerror);
	};
	
	envianceSdk.portal.getPanels = function (pageGroupIdOrName, pageIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels')
		}, onsuccess, onerror);
	};
	envianceSdk.portal.getPanel = function (pageGroupIdOrName, pageIdOrName, panelIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels/' + encodeURIComponent(panelIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.portal.createPanel = function (pageGroupIdOrName, pageIdOrName, panelInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels'),
			data: envianceSdk.JSON.stringify({ "panelInfo": panelInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.updatePanel = function (pageGroupIdOrName, pageIdOrName, panelIdOrName, panelInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels/' + encodeURIComponent(panelIdOrName)),
			data: envianceSdk.JSON.stringify({ "panelInfo": panelInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.deletePanel = function (pageGroupIdOrName, pageIdOrName, panelIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels/' + encodeURIComponent(panelIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.portal.getPanelSettings = function (pageGroupIdOrName, pageIdOrName, panelIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels/' + encodeURIComponent(panelIdOrName) + '/settings')
		}, onsuccess, onerror);
	};
	envianceSdk.portal.savePanelSettings = function (pageGroupIdOrName, pageIdOrName, panelIdOrName, panelSettings, onsuccess, onerror) {
		return _private._ajax({
			type: "PUT",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/pagegroups/' + encodeURIComponent(pageGroupIdOrName)
				+ '/pages/' + encodeURIComponent(pageIdOrName) + '/panels/' + encodeURIComponent(panelIdOrName) + '/settings'),
			data: envianceSdk.JSON.stringify({ "panelSettings": panelSettings })
		}, onsuccess, onerror);
	};
	
	envianceSdk.portal.getPanelTemplates = function (onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/paneltemplates')
		}, onsuccess, onerror);
	};
	envianceSdk.portal.getPanelTemplate = function (panelTemplateIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/paneltemplates/' + encodeURIComponent(panelTemplateIdOrName))
		}, onsuccess, onerror);
	};
	envianceSdk.portal.createPanelTemplate = function (panelTemplateInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/paneltemplates'),
			data: envianceSdk.JSON.stringify({ "panelTemplateInfo": panelTemplateInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.updatePanelTemplate = function (panelTemplateIdOrName, panelTemplateInfo, onsuccess, onerror) {
		return _private._ajax({
			type: "PATCH",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/paneltemplates/' + encodeURIComponent(panelTemplateIdOrName)),
			data: envianceSdk.JSON.stringify({ "panelTemplateInfo": panelTemplateInfo })
		}, onsuccess, onerror);
	};
	envianceSdk.portal.deletePanelTemplate = function (panelTemplateIdOrName, onsuccess, onerror) {
		return _private._ajax({
			type: "DELETE",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard/paneltemplates/' + encodeURIComponent(panelTemplateIdOrName))
		}, onsuccess, onerror);
	};
	
	envianceSdk.portal.getDashboard = function (onsuccess, onerror) {
		return _private._ajax({
			type: "GET",
			url: _private._buildUrl('ver2/PortalService.svc/portal/dashboard')
		}, onsuccess, onerror);
	};
	
	//Enviance.RestServices.Ver2.BatchRequest.IBatchRequestService 
	envianceRegisterNamespace("envianceSdk.batch");

	envianceSdk.batch.execute = function (params, onsuccess, onerror) {
		if (typeof params === "function") {
			onerror = onsuccess;
			onsuccess = params;
			params = null;
		}
		
		params = params || {};
		params.continueOnError = !!params.continueOnError;

		if (typeof params['operations'] === "function") {
			this.clear();
			this.setOn();
			params.operations();
		}

		this.setOff();

		var opers = _private._ajax._batchMode.operations;
		var requests = [];
		
		for (var i = 0; i < opers.length; i++) {
			requests.push(opers[i].request);
		}

		return _private._ajax({
			type: "POST",
			url: _private._buildUrl('ver2/BatchRequestService.svc/batchRequest/execute'),
			data: envianceSdk.JSON.stringify({ "batch": requests, "continueOnError": params.continueOnError })
		},
		function (response) {
			if (response && response.result) {
				for(var i=0; i<response.result.length; i++) {
					var opResponse = response.result[i];
					var opSuccess = opers[i].onsuccess; 
					var opError = opers[i].onerror;

					var opResult = { status: opResponse.code, headers: opResponse.headers || [], responseText: opResponse.body };

					opResult.getResponseHeader = function (name) {
						var header = this.headers.filter(function (h) {
							return h && h.name == name;
						});

						return header.length < 1  ? null : header[0].value;
					};

					if (opResponse.code > 199 && opResponse.code < 400) {
						var body = opResponse.body ? envianceSdk.JSON.parse(opResponse.body) : "";
						opResponse.body = body;

						opSuccess(body, opResponse.status, opResult);
					} else {
						opError(opResult, 'error', opResponse.status);
					}
				}
			}

			if (onsuccess) onsuccess(response);
		},
		onerror);
	};

	envianceSdk.batch.start =
	envianceSdk.batch.setOn = function () {
		_private._ajax._batchMode.on = true;
	};

	envianceSdk.batch.setOff = function () {
		_private._ajax._batchMode.on = false;
	};
	
	envianceSdk.batch.isOn = function () {
		return _private._ajax._batchMode.on;
	};
	
	envianceSdk.batch.clear = function () {
		_private._ajax._batchMode.operations = [];
	};
	
	envianceSdk.batch.getOperations = function () {
		return _private._ajax._batchMode.operations;
	};
	
	return envianceSdk;
} (envianceSdk || {}));

/*
 Helper objects
*/

envianceSdk = (function(envianceSdk) {
	// ReSharper disable InconsistentNaming
	var _private = envianceSdk._private = envianceSdk._private || {};
	// ReSharper restore InconsistentNaming

	envianceRegisterNamespace("envianceSdk.common");
	envianceRegisterNamespace("envianceSdk.customFields");

	/* for envianceSdk.workflows.createWorkflow function */
	envianceSdk.workflows.WorkflowInfo = function(workflowTypeName, name, uniqueId, dueDate, objects, documents, comment, calendars) {
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

		this.addPathAssociatedObject = function(objectPath) {
			this.objects = this.objects || [];
			this.objects.push(objectPath);
			return this;
		};

		this.addIdAssociatedObject = function(objectId) {
			this.objects = this.objects || [];
			this.objects.push(objectId);
			return this;
		};

		this.addUserAssignee = function(userIdOrName) {
			this.assignedTo = this.assignedTo || [];
			this.assignedTo.push(new envianceSdk.common.UserAssignee(userIdOrName));
			return this;
		};

		this.addGroupAssignee = function(groupIdOrName) {
			this.assignedTo = this.assignedTo || [];
			this.assignedTo.push(new envianceSdk.common.GroupAssignee(groupIdOrName));
			return this;
		};
	};

	/* for envianceSdk.workflows.updateWorkflowStep function */
	envianceSdk.workflows.WorkflowStepInfo = function(comment, fields, transition, taskCompletion) {
		if (comment) {
			this.comment = comment;
		}
		if (fields) {
			this.fields = fields;
		}
		if (transition) {
			this.transition = transition;
		}
		if (taskCompletion) {
			this.taskCompletion = taskCompletion;
		}

		this.setTransition = function(stepActionName, dueDate, assignTo) {
			this.transition = new envianceSdk.workflows.WorkflowTransitionInfo(stepActionName, dueDate, assignTo);
			return this.transition;
		};

		this.addScalarFieldValue = function(fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
			return this;
		};

		this.addDateFieldValue = function(fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.DateFieldValue(fieldName, value));
			return this;
		};

		this.addTimeFieldValue = function(fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.TimeFieldValue(fieldName, value));
			return this;
		};

		this.addUrlFieldValue = function(fieldName, label, url) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.UrlFieldValue(fieldName, label, url));
			return this;
		};

		this.addLinkedFieldValues = function(fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
			return this;
		};

		this.addMultiFieldValues = function(fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.MultiFieldValues(fieldName, values));
			return this;
		};
	};

	/* for envianceSdk.workflows.initiateChildWorkflow function */
	envianceSdk.workflows.ChildWorkflowInitiationInfo = function(parentStepIdOrName, initiatorIdOrName, childWorkflowInfo, childInitStepInfo) {
		if (parentStepIdOrName) {
			this.parentStepIdOrName = parentStepIdOrName;
		}
		if (initiatorIdOrName) {
			this.initiatorIdOrName = initiatorIdOrName;
		}
		if (childWorkflowInfo) {
			this.childWorkflowInfo = childWorkflowInfo;
		}
		if (childInitStepInfo) {
			this.childInitStepInfo = childInitStepInfo;
		}
	};

	envianceSdk.workflows.WorkflowTransitionInfo = function(stepActionName, dueDate, assignTo) {
		if (stepActionName) {
			this.stepActionName = stepActionName;
		}
		if (dueDate) {
			this.dueDate = dueDate;
		}
		if (assignTo) {
			this.assignTo = assignTo;
		}

		this.addUserAssignee = function(userIdOrName) {
			this.assignTo = this.assignTo || [];
			this.assignTo.push(new envianceSdk.common.UserAssignee(userIdOrName));
			return this;
		};

		this.addGroupAssignee = function(groupIdOrName) {
			this.assignTo = this.assignTo || [];
			this.assignTo.push(new envianceSdk.common.GroupAssignee(groupIdOrName));
			return this;
		};
	};

	/* for envianceSdk.compliance.createLocation function */
	envianceSdk.compliance.LocationInfo = function (name, type, parentPath, description, activeDate, inactiveDate, responsibleUser, fieldTemplate, fieldValues, calcFieldTemplate, calcFieldValues, documents, timeZone, address, geoLocation) {
		if (name) {
			this.name = name;
		}
		if (type) {
			this.type = type;
		}
		if (parentPath || parentPath == "") {
			this.parentPath = parentPath;
		}
		if (description) {
			this.description = description;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUser) {
			this.responsibleUser = responsibleUser;
		}
		if (fieldTemplate) {
			this.fieldTemplate = fieldTemplate;
		}
		if (fieldValues) {
			this.fieldValues = fieldValues;
		}
		if (calcFieldTemplate) {
			this.calcFieldTemplate = calcFieldTemplate;
		}
		if (calcFieldValues) {
			this.calcFieldValues = calcFieldValues;
		}
		if (documents) {
			this.documents = documents;
		}
		if (timeZone) {
			this.timeZone = new envianceSdk.common.TimeZone(timeZone);
		}
		if (address) {
			this.address = address;
		}
		if (geoLocation) {
			this.geoLocation = geoLocation;
		}

		this.setActiveDate = function(activeDate) {
			this.activeDate = activeDate;
			return this;
		};
		this.setInactiveDate = function(inactiveDate) {
			this.inactiveDate = inactiveDate;
			return this;
		};
		this.setResponsibleUser = function(userName) {
			this.responsibleUser = userName;
			return this;
		};
		this.setFieldTemplate = function(fieldTemplateName) {
			this.fieldTemplate = fieldTemplateName;
			return this;
		};
		this.setCalcFieldTemplate = function (calcFieldTemplateName) {
			this.calcFieldTemplate = calcFieldTemplateName;
			return this;
		};
	
		this.addScalarFieldValue = function (fieldName, value) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
			return this;
		};
		
		this.addScalarFieldHistValue = function (fieldName, value, beginDate, endDate) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.ScalarFieldHistValue(fieldName, value, beginDate, endDate));
			return this;
		};

		
		this.addScalarCalcFieldValue = function (fieldName, value) {
			this.calcFieldValues = this.calcFieldValues || [];
			this.calcFieldValues.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
			return this;
		};
		
		this.addScalarCalcFieldHistValue = function (fieldName, value, beginDate, endDate) {
			this.calcFieldValues = this.calcFieldValues || [];
			this.calcFieldValues.push(new envianceSdk.customFields.ScalarFieldHistValue(fieldName, value, beginDate, endDate));
			return this;
		};

		this.addDateFieldValue = function(fieldName, value) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.DateFieldValue(fieldName, value));
			return this;
		};
		
		this.addDateFieldHistValue = function (fieldName, value, beginDate, endDate) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.DateFieldHistValue(fieldName, value, beginDate, endDate));
			return this;
		};

		this.addTimeFieldValue = function(fieldName, value) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.TimeFieldValue(fieldName, value));
			return this;
		};
		
		this.addTimeFieldHistValue = function (fieldName, value, beginDate, endDate) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.TimeFieldHistValue(fieldName, value, beginDate, endDate));
			return this;
		};

		this.addUrlFieldValue = function(fieldName, label, url) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.UrlFieldValue(fieldName, label, url));
			return this;
		};

		this.addLinkedFieldValues = function(fieldName, values) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
			return this;
		};

		this.addMultiFieldValues = function(fieldName, values) {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.MultiFieldValues(fieldName, values));
			return this;
		};

		this.setAddress = function(address) {
			this.address = address;
			return this;
		};
		this.setGeoLocation = function(geoLocation) {
			this.geoLocation = geoLocation;
			return this;
		};
	};

	envianceSdk.compliance.Address = function(street1, city, stateOrProvince, country, postalCode) {
		if (street1) {
			this.street1 = street1;
		}
		if (city) {
			this.city = city;
		}
		if (stateOrProvince) {
			this.stateOrProvince = stateOrProvince;
		}
		if (country) {
			this.country = country;
		}
		if (postalCode) {
			this.postalCode = postalCode;
		}

		this.setStreet2 = function(street2) {
			this.street2 = street2;
			return this;
		};

		this.setStreet3 = function(street3) {
			this.street3 = street3;
			return this;
		};

		this.setCountyOrRegion = function(countyOrRegion) {
			this.countyOrRegion = countyOrRegion;
			return this;
		};
	};

	envianceSdk.compliance.GeoLocation = function(latitude, longitude) {
		if (latitude) {
			this.latitude = latitude;
		}
		if (longitude) {
			this.longitude = longitude;
		}
	};

	// common functions
	envianceSdk.common.setTimeZone = function(timeZoneName) {
		this.timeZone = new envianceSdk.common.TimeZone(timeZoneName);
		return this;
	};

	envianceSdk.common.addDocument = function(path) {
		this.documents = this.documents || [];
		this.documents.push(path);
		return this;
	};
	
	envianceSdk.common.setFieldTemplate = function (fieldTemplateNameIdOrName) {
		this.fieldTemplateIdOrName = fieldTemplateNameIdOrName;
		return this;
	};

	envianceSdk.common.UserAssignee = function (userIdOrName) {
		if (userIdOrName) {
			this.userIdOrName = userIdOrName;
		} else {
			throw new Error("Argument value is not valid: UserIdOrName.");
		}
	};
	envianceSdk.common.GroupAssignee = function(groupIdOrName) {
		if (groupIdOrName) {
			this.groupIdOrName = groupIdOrName;
		} else {
			throw new Error("Argument value is not valid: GroupIdOrName.");
		}
	};
	
	envianceSdk.common.TimeZone = function(name) {
		if (name) {
			this.name = name;
		} else {
			throw new Error("Argument value is not valid: name.");
		}
	};
	
	envianceSdk.common.addTag = function (tagScheme, tag) {
		this.tags = this.tags || [];
		this.tags.push(new envianceSdk.common.Tag(tagScheme, tag));
		return this;
	};

	envianceSdk.common.Tag = function (tagScheme, tag) {
		this.tagScheme = tagScheme;
		this.tag = tag;
		return this;
	};

	// UdfFieldValues functions (for calc and custom templates)
	envianceSdk.common.addScalarFieldValue = function (fieldName, value, isCalcTempl) {
		if (isCalcTempl) {
			this.calcFieldValues = this.calcFieldValues || [];
			this.calcFieldValues.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
		} else {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
		}
		return this;
	};
	envianceSdk.common.addScalarFieldHistValue = function (fieldName, value, beginDate, endDate, isCalcTempl) {
		if (isCalcTempl) {
			this.calcFieldValues = this.calcFieldValues || [];
			this.calcFieldValues.push(new envianceSdk.customFields.ScalarFieldHistValue(fieldName, value, beginDate, endDate));
		} else {
			this.fieldValues = this.fieldValues || [];
			this.fieldValues.push(new envianceSdk.customFields.ScalarFieldHistValue(fieldName, value, beginDate, endDate));
		}
		return this;
	};
	envianceSdk.common.addDateFieldValue = function (fieldName, value) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.DateFieldValue(fieldName, value));
		return this;
	};
	envianceSdk.common.addDateFieldHistValue = function (fieldName, value, beginDate, endDate) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.DateFieldHistValue(fieldName, value, beginDate, endDate));
		return this;
	};
	envianceSdk.common.addTimeFieldValue = function (fieldName, value) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.TimeFieldValue(fieldName, value));
		return this;
	};
	envianceSdk.common.addTimeFieldHistValue = function (fieldName, value, beginDate, endDate) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.TimeFieldHistValue(fieldName, value, beginDate, endDate));
		return this;
	};
	envianceSdk.common.addUrlFieldValue = function (fieldName, label, url) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.UrlFieldValue(fieldName, label, url));
		return this;
	};
	envianceSdk.common.addLinkedFieldValues = function (fieldName, values) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
		return this;
	};
	envianceSdk.common.addMultiFieldValues = function (fieldName, values) {
		this.fieldValues = this.fieldValues || [];
		this.fieldValues.push(new envianceSdk.customFields.MultiFieldValues(fieldName, values));
		return this;
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
	envianceSdk.customFields.DateFieldHistValue = function (name, value, beginDate, endDate) {
		if (value != null && !(value instanceof Date)) {
			if (envianceSdk.IsoDate.match(value)) {
				value = envianceSdk.IsoDate.parse(value);
			} else {
				value = new Date(value);
			}
		}
		this.name = name;
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.values = [value];
	};
	envianceSdk.customFields.TimeFieldValue = function(name, value) {
		var today = new Date(),
		    dd = today.getDate(),
		    mm = today.getMonth() + 1,
		    yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd;
		}
		if (mm < 10) {
			mm = '0' + mm;
		}

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
	envianceSdk.customFields.TimeFieldHistValue = function (name, value, beginDate, endDate) {
		var today = new Date(),
		    dd = today.getDate(),
		    mm = today.getMonth() + 1,
		    yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd;
		}
		if (mm < 10) {
			mm = '0' + mm;
		}

		if (value instanceof Date) {
			value = value.getHours() + ':' + value.getMinutes();
		}
		var date = new Date(mm + '/' + dd + '/' + yyyy + ' ' + value);
		if (isNaN(date)) {
			throw Error("Invalid date");
		}

		this.name = name;
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.values = [date];
	};
	envianceSdk.customFields.ScalarFieldValue = function(name, value) {
		this.name = name;
		this.values = [value];
	};
	envianceSdk.customFields.ScalarFieldHistValue = function (name, value, beginDate, endDate) {		
		if (name) {
			this.name = name;
		}
		if (value) {
			this.values = [value];
		}
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}
	};
	envianceSdk.customFields.UrlFieldValue = function(name, label, url) {
		this.name = name;
		if (!label || $.trim(label) == "") {
			throw new Error("Argument value is not valid: Label.");
		}
		if (!url || $.trim(url) == "") {
			throw new Error("Argument value is not valid: Url.");
		}
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

	envianceRegisterNamespace("envianceSdk.utilities");
	envianceRegisterNamespace("envianceSdk.utilities.uri");

	/*Returns a query string to execute the QuickLink*/
	envianceSdk.utilities.uri.toQuickLink = function(id) {
		var systemId = envianceSdk.getSystemId();
		return _private._buildWebAppUrl("/goto/home/ql/" + id + (systemId != null
			? ("?systemId=" + systemId)
			: ""));
	};

	/*Returns a query string to download a document from document manager, given its ID or path.*/
	envianceSdk.utilities.uri.toDocumentDownload = function(documentIdOrPath) {
		return _private._buildUrl("/ver2/DocumentService.svc/documents/" + _private.uriPathEncode(documentIdOrPath) + "?content");
	};

	/*Returns a query string to download a package from package manager, given its ID or name.*/
	envianceSdk.utilities.uri.toPackageDownload = function(packageIdOrName) {
		return _private._buildUrl("/ver2/PackageService.svc/packages/" + _private.uriPathEncode(packageIdOrName) + "?content");
	};

	/*Switches a page*/
	envianceSdk.utilities.uri.gotoUrl = function(pagePath) {
		window.location.assign(pagePath);
	};


	/* requirements */
	envianceRegisterNamespace("envianceSdk.requirements");
	
	envianceSdk.requirements.SetResponsibleUser = function (userName) {
		this.responsibleUserIdOrName = userName;
		return this;
	};

	envianceSdk.requirements.AddFrequency = function (dateBegin, dateEnd, occurences) {
		this.frequencies = this.frequencies || [];
		this.frequencies.push(new envianceSdk.requirements.FrequencyHistory(dateBegin, dateEnd, occurences));
		return this;
	};
	envianceSdk.requirements.FrequencyHistory = function (beginDate, endDate, occurences) {
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.occurences = occurences;
	};

	envianceSdk.requirements.AddLimitHistory = function (beginDate, endDate, regLowLimit, regHighLimit, comparisonOperation, intLowLimit, intHighLimit) {
		this.limitHistory = this.limitHistory || [];
		this.limitHistory.push(new envianceSdk.requirements.LimitHistory(beginDate, endDate, regLowLimit, regHighLimit, comparisonOperation, intLowLimit, intHighLimit));
		return this;
	};
	envianceSdk.requirements.LimitHistory = function (beginDate, endDate, regLowLimit, regHighLimit, comparisonOperation, intLowLimit, intHighLimit) {
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.comparisonOperation = comparisonOperation;
		this.regLowLimit = regLowLimit;
		this.regHighLimit = regHighLimit;
		this.intLowLimit = intLowLimit;
		this.intHighLimit = intHighLimit;
	};

	envianceSdk.requirements.AddFormulaHistory = function (beginDate, endDate, script, exceptionDivideByZero, exceptionOverflow, exceptionOther) {
		this.formulaHistory = this.formulaHistory || [];
		this.formulaHistory.push(new envianceSdk.requirements.FormulaHistory(beginDate, endDate, script, exceptionDivideByZero, exceptionOverflow, exceptionOther));
		return this;
	};
	envianceSdk.requirements.FormulaHistory = function (beginDate, endDate, script, exceptionDivideByZero, exceptionOverflow, exceptionOther) {		
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.script = script;
		this.exceptionDivideByZero = exceptionDivideByZero;
		this.exceptionOverflow = exceptionOverflow;
		this.exceptionOther = exceptionOther;
	};

	envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn = function (templateIdOrName, assignor) {
		this.regulatoryLimit = this.regulatoryLimit || {};
		if (templateIdOrName) {
			this.regulatoryLimit.templateIdOrName = templateIdOrName;
		}
		if (assignor) {
			this.regulatoryLimit.assignor = assignor;
		}
		return this;
	};
	envianceSdk.requirements.AddRegLimitTaskUser = function (userIdOrName) {
		this.regulatoryLimit.assignees = this.regulatoryLimit.assignees || [];
		this.regulatoryLimit.assignees.push(new envianceSdk.common.UserAssignee(userIdOrName));
		return this;
	};
	envianceSdk.requirements.AddRegLimitTaskGroup = function (groupIdOrName) {
		this.regulatoryLimit.assignees = this.regulatoryLimit.assignees || [];
		this.regulatoryLimit.assignees.push(new envianceSdk.common.GroupAssignee(groupIdOrName));
		return this;
	};

	envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn = function (templateIdOrName, assignor) {
		this.internalLimit = this.internalLimit || {};
		if (templateIdOrName) {
			this.internalLimit.templateIdOrName = templateIdOrName;
		}
		if (assignor) {
			this.internalLimit.assignor = assignor;
		}
		return this;
	};
	envianceSdk.requirements.AddIntLimitTaskUser = function (userIdOrName) {
		this.internalLimit.assignees = this.internalLimit.assignees || [];
		this.internalLimit.assignees.push(new envianceSdk.common.UserAssignee(userIdOrName));
		return this;
	};
	envianceSdk.requirements.AddIntLimitTaskGroup = function (groupIdOrName) {
		this.internalLimit.assignees = this.internalLimit.assignees || [];
		this.internalLimit.assignees.push(new envianceSdk.common.GroupAssignee(groupIdOrName));
		return this;
	};

	envianceSdk.requirements.SetNotifyUserOrMail = function (inbox, email) {
		this.notifyRecipients = this.notifyRecipients || {};
		if (inbox) {
			this.notifyRecipients.inbox = inbox;
		}
		if (email) {
			this.notifyRecipients.email = email;
		}
		return this;
	};
	envianceSdk.requirements.AddNotifyUser = function (userIdOrName) {
		this.notifyRecipients.recipients = this.notifyRecipients.recipients || [];
		this.notifyRecipients.recipients.push(new envianceSdk.common.UserAssignee(userIdOrName));
		return this;
	};
	envianceSdk.requirements.AddNotifyGroup = function (groupIdOrName) {
		this.notifyRecipients.recipients = this.notifyRecipients.recipients || [];
		this.notifyRecipients.recipients.push(new envianceSdk.common.GroupAssignee(groupIdOrName));
		return this;
	};
	
	envianceSdk.requirements.AddRequirementsAliasMap = function (alias, requirementPath) {
		this.calcRequirements = this.calcRequirements || [];
		this.calcRequirements.push(new envianceSdk.requirements.RequirementsAliasMap(alias, requirementPath));
		return this;
	};
	
	envianceSdk.requirements.RequirementsAliasMap = function (alias, requirementPath) {
		this.alias = alias;
		this.requirementPath = requirementPath;
	};


	envianceRegisterNamespace("envianceSdk.documents");

	envianceSdk.documents.DocumentInfo = function(name, description, folderIdOrPath, content, fileName, mimeType) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (folderIdOrPath) {
			this.folder = folderIdOrPath;
		}
		if (content) {
			this.content = content;
		}
		if (fileName) {
			this.fileName = fileName;
		}
		if (mimeType) {
			this.mimeType = mimeType;
		}

		this.addPathAssociatedObject = function(objectPath) {
			this.objects = this.objects || [];
			this.objects.push(objectPath);
			return this;
		};

		this.addIdAssociatedObject = function(objectId) {
			this.objects = this.objects || [];
			this.objects.push(objectId);
			return this;
		};

		this.addAssociatedTask = function(taskId) {
			this.tasks = this.tasks || [];
			this.tasks.push(taskId);
			return this;
		};

		this.addAssociatedWorkflow = function(workflowIdOrUniqueId) {
			this.workflows = this.workflows || [];
			this.workflows.push(workflowIdOrUniqueId);
			return this;
		};

		this.setContentUrl = function(contentUrl) {
			this.contentUrl = contentUrl;
			return this;
		};
	};

	envianceSdk.documents.DocumentFolderInfo = function(name, description, parentFolderIdOrPath) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (parentFolderIdOrPath) {
			this.parentFolderIdOrPath = parentFolderIdOrPath;
		}
	};

	envianceSdk.common.configureFileInput = function(fileObjectId, onchanged) {
		var embedSwf = function() {
			swfobject.embedSWF(_private._buildUrl("FileUpload/FileToDataURI.swf"), fileObjectId, "80px", "23px", "10", "FileUpload/expressInstall.swf", {}, { allowScriptAccess: "always" }, {});

			envianceSdk.common.getFileInputResult = function(filename, content) {
				if (onchanged) {
					onchanged(fileObjectId, filename, content);
				}
			};
		};

		if (typeof swfobject == "object") {
			embedSwf();
			return;
		}
		if (typeof FileReader !== "function" && typeof FileReader !== "object" && typeof swfobject == "undefined") {
			jQuery.ajax({
				url: _private._buildUrl("FileUpload/swfobject.js"),
				dataType: "script",
				async: true,
				cache: true,
				success: function(response) {
					if (typeof swfobject == "undefined") {
						var msg = "Failed to setup file upload control. Failed to load swfobject.js." + status;
						_private._processError(msg, 1250, msg, onerror);
					}
					embedSwf();
				},
				error: function(response, status, message) {
					var msg = "Failed to setup file upload control. Failed to load swfobject.js. Status=" + status;
					_private._processError(msg, status, msg, onerror);
				}
			});
		} else {
			var jqFileInput = $('#' + fileObjectId);

			var raiseOnChange = function(e) {
				var files = e.target.files, file;

				if (!files || files.length == 0) {
					if (onchanged) {
						onchanged(fileObjectId, null, null);
					}
				}
				file = files[0];

				var fileReader = new FileReader();
				fileReader.onload = function(e) {
					if (onchanged) {
						onchanged(fileObjectId, file.name, e.target.result == null ? '' : e.target.result.split(",")[1]);
					}
				};
				fileReader.readAsDataURL(file);
			};
			if (jqFileInput[0].files && jqFileInput[0].files.length) {
				raiseOnChange({ "target": jqFileInput[0] });
			}
			else {
				var fi = $('<input type="file" id="' + fileObjectId + '" value="Load a file" />');
				jqFileInput.replaceWith(fi);
				fi.change(raiseOnChange);
			}
		}
	};

	envianceSdk.common.validateUploadFiles = function (fileinputs) {
		var result = [];
		var messages = {
			MSG_NOT_SELECTED: "* File is not specified.",
			MSG_NO_INPUTS: "No one input control specified."
		};

		if (!fileinputs || fileinputs.length == 0 || !fileinputs[0]) {
			result.push({ inputId: messages.MSG_NO_INPUTS, message: messages.MSG_NOT_SELECTED });
		}
		else
			for (var i = 0; i < fileinputs.length; i++) {
				if (fileinputs[i].value == '') {
					result.push({ inputId: fileinputs[i].id, message: messages.MSG_NOT_SELECTED });
				}
			}

		return result;
	};
	
	envianceSdk.common.findInputsForTest = function () {
		var htitle = $('div[data-ng-env-app-header]');
		if (htitle.length > 0 && htitle.attr('data-ng-env-app-header').substr(0, 13) == "REST API Test") {

			var selected = $("form input:file").filter(function (idx) {
				return $(this).val();
			});

			return selected;
		}

		return [];
	};

	envianceRegisterNamespace("envianceSdk.tasks");

	envianceSdk.tasks.TaskInfo = function (name, description, dueDate, timeZone, assignor, assignees, calendars, objects, documents, schedules, notifications, templateIdOrName) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (dueDate) {
			this.dueDate = dueDate;
		}
		if (timeZone) {
			this.timeZone = new envianceSdk.common.TimeZone(timeZone);
		}
		if (assignor) {
			this.assignor = assignor;
		}
		if (assignees) {
			this.assignees = assignees;
		}
		if (calendars) {
			this.calendars = calendars;
		}
		if (objects) {
			this.objects = objects;
		}
		if (documents) {
			this.documents = documents;
		}
		if (schedules) {
			this.schedules = schedules;
		}
		if (notifications) {
			this.notifications = notifications;
		}
		if (templateIdOrName) {
			this.templateIdOrName = templateIdOrName;
		}
		
		this.addUserAssignee = function(userIdOrName) {
			this.assignees = this.assignees || [];
			this.assignees.push(new envianceSdk.common.UserAssignee(userIdOrName));
			return this;
		};

		this.addGroupAssignee = function(groupIdOrName) {
			this.assignees = this.assignees || [];
			this.assignees.push(new envianceSdk.common.GroupAssignee(groupIdOrName));
			return this;
		};

		this.addPathAssociatedObject = function(objectPath) {
			this.objects = this.objects || [];
			this.objects.push(objectPath);
			return this;
		};

		this.addIdAssociatedObject = function(objectId) {
			this.objects = this.objects || [];
			this.objects.push(objectId);
			return this;
		};
		
		this.addSchedule = function (schedule) {
			this.schedules = this.schedules || [];
			this.schedules.push(schedule);
			return this;
		};

		this.addNotification = function (notification) {
			this.notifications = this.notifications || [];
			this.notifications.push(notification);
			return this;
		};
	};

	envianceSdk.tasks.TaskScheduleInfo = function (startDate, endDate) {
		if (startDate) {
			this.startDate = startDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}

		this.BuildHourlySchedule = function (startTime, endTime, daysOfWeek) {
			this.recurrenceType = "Hourly";
			if (startTime) {
				this.startTime = startTime;
			}
			if (endTime) {
				this.endTime = endTime;
			}
			if (daysOfWeek) {
				this.daysOfWeek = daysOfWeek;
			}
			return this;
		};

		this.BuildDailyScheduleByInterval = function (startTime, recurrenceInterval) {
			this.recurrenceType = "Daily";
			if (startTime) {
				this.startTime = startTime;
			}
			if (recurrenceInterval) {
				this.recurrenceInterval = recurrenceInterval;
			}
			return this;
		};

		this.BuildDailyScheduleByWeekdays = function (startTime) {
			this.recurrenceType = "Daily";
			if (startTime) {
				this.startTime = startTime;
			}
			this.daysOfWeek = ["Weekdays"];
			return this;
		};

		this.BuildWeeklySchedule = function (startTime, recurrenceInterval, daysOfWeek) {
			this.recurrenceType = "Weekly";
			if (startTime) {
				this.startTime = startTime;
			}
			if (recurrenceInterval) {
				this.recurrenceInterval = recurrenceInterval;
			}
			if (daysOfWeek) {
				this.daysOfWeek = daysOfWeek;
			}
			return this;
		};

		this.BuildMonthlySchedule = function (startTime, recurrenceInterval, dayOfMonthNumber) {
			this.recurrenceType = "Monthly";
			if (startTime) {
				this.startTime = startTime;
			}
			if (recurrenceInterval) {
				this.recurrenceInterval = recurrenceInterval;
			}
			if (dayOfMonthNumber) {
				this.dayOfMonth = dayOfMonthNumber;
			}
			return this;
		};

		this.BuildMonthlyScheduleExt = function (startTime, recurrenceInterval, dayOccurrence, dayOfWeek) {
			this.recurrenceType = "Monthly";
			if (startTime) {
				this.startTime = startTime;
			}
			if (recurrenceInterval) {
				this.recurrenceInterval = recurrenceInterval;
			}
			this.dayOfMonth = new envianceSdk.tasks.TaskScheduleInfo.DayOfMonth(dayOccurrence, dayOfWeek);
			return this;
		};

		this.BuildYearlySchedule = function (startTime, recurrenceInterval, monthOfYear, dayOfMonthNumber) {
			this.recurrenceType = "Yearly";
			if (startTime) {
				this.startTime = startTime;
			}
			if (recurrenceInterval) {
				this.recurrenceInterval = recurrenceInterval;
			}
			if (monthOfYear) {
				this.monthOfYear = monthOfYear;
			}
			if (dayOfMonthNumber) {
				this.dayOfMonth = dayOfMonthNumber;
			}
			return this;
		};

		this.BuildYearlyScheduleExt = function (startTime, recurrenceInterval, monthOfYear, dayOccurrence, dayOfWeek) {
			this.recurrenceType = "Yearly";
			if (startTime) {
				this.startTime = startTime;
			}
			if (recurrenceInterval) {
				this.recurrenceInterval = recurrenceInterval;
			}
			if (monthOfYear) {
				this.monthOfYear = monthOfYear;
			}
			this.dayOfMonth = new envianceSdk.tasks.TaskScheduleInfo.DayOfMonth(dayOccurrence, dayOfWeek);
			return this;
		};

		this.BuildAfterLastCompletionSchedule = function (startTime, hours, days, weeks, months) {
			this.recurrenceType = "AfterLastCompletion";
			if (startTime) {
				this.startTime = startTime;
			}

			this.recurrenceInterval = new envianceSdk.tasks.TaskScheduleInfo.RecurrenceInterval(hours, days, weeks, months);
			return this;
		};
	};

	envianceSdk.tasks.TaskScheduleInfo.RecurrenceInterval = function (hours, days, weeks, months) {
		if (hours) {
			this.hours = hours;
		}
		if (days) {
			this.days = days;
		}
		if (weeks) {
			this.weeks = weeks;
		}
		if (months) {
			this.months = months;
		}
	};

	envianceSdk.tasks.TaskScheduleInfo.DayOfMonth = function (dayOccurrence, dayOfWeek) {
		if (dayOccurrence) {
			this.dayOccurrence = dayOccurrence;
		}
		if (dayOfWeek) {
			this.dayOfWeek = dayOfWeek;
		}
	};

	envianceSdk.tasks.TaskNotificationInfo = function (conditions, recipients, deliveryMethod, comments, templateIdOrName) {
		if (conditions) {
			this.conditions = conditions;
		}
		if (recipients) {
			this.recipients = recipients;
		}
		if (deliveryMethod) {
			this.deliveryMethod = deliveryMethod;
		}
		if (comments) {
			this.comments = comments;
		}
		if (templateIdOrName) {
			this.templateIdOrName = templateIdOrName;
		}
	};

	envianceSdk.tasks.TaskNotificationInfo.NotificationConditions = function (immediately, whenDismissed, byDueDate, byCompletionStatus) {
		if (immediately) {
			this.immediately = immediately;
		}
		if (whenDismissed) {
			this.whenDismissed = whenDismissed;
		}
		if (byDueDate) {
			this.byDueDate = byDueDate;
		}
		if (byCompletionStatus) {
			this.byCompletionStatus = byCompletionStatus;
		}
	};

	envianceSdk.tasks.TaskNotificationInfo.DueDateCondition = function (conditionType, intervalValue, intervalType) {
		if (conditionType) {
			this.conditionType = conditionType;
		}
		if (intervalValue) {
			this.intervalValue = intervalValue;
		}
		if (intervalType) {
			this.intervalType = intervalType;
		}
	};

	envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition = function (comparisonLogic, completionPercent, onlyWhenPastDue) {
		if (comparisonLogic) {
			this.comparisonLogic = comparisonLogic;
		}
		// Specify zero value because it's a valid completion percent
		if (completionPercent || completionPercent === 0) {
			this.completionPercent = completionPercent;
		}
		if (onlyWhenPastDue) {
			this.onlyWhenPastDue = onlyWhenPastDue;
		}
	};

	envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients = function (toAssignees, toAssignor, users, groups) {
		if (toAssignees) {
			this.toAssignees = toAssignees;
		}
		if (toAssignor) {
			this.toAssignor = toAssignor;
		}
		if (users) {
			this.users = users;
		}
		if (groups) {
			this.groups = groups;
		}
	};

	envianceSdk.tasks.TaskOccurrenceInfo = function (objectIdOrPath, dismissed, percentComplete, hoursToComplete, costToComplete, comment, statusChangeDate) {
		if (objectIdOrPath) {
			this.objectIdOrPath = objectIdOrPath;
		}
		if (dismissed != null) {
			this.dismissed = dismissed;
		}
		if (percentComplete != null) {
			this.percentComplete = percentComplete;
		}
		if (hoursToComplete != null) {
			this.hoursToComplete = hoursToComplete;
		}
		if (costToComplete != null) {
			this.costToComplete = costToComplete;
		}
		if (comment) {
			this.comment = comment;
		}
		if (statusChangeDate) {
			this.statusChangeDate = statusChangeDate;
		}
	};

	envianceRegisterNamespace("envianceSdk.events");

	envianceSdk.events.EventInfo = function(name, beginDate, endDate, state, complianceType, acceptAsDeviation, requirementIdOrPath, fields, documents) {
		if (name) {
			this.name = name;
		}
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}
		if (state) {
			this.state = state;
		}
		if (complianceType) {
			this.complianceType = complianceType;
		}
		if (acceptAsDeviation != null) {
			this.acceptAsDeviation = acceptAsDeviation;
		}
		if (requirementIdOrPath) {
			this.requirementIdOrPath = requirementIdOrPath;
		}
		if (fields) {
			this.fields = fields;
		}
		if (documents) {
			this.documents = documents;
		}

		this.addScalarFieldValue = function(fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
			return this;
		};

		this.addDateFieldValue = function(fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.DateFieldValue(fieldName, value));
			return this;
		};

		this.addTimeFieldValue = function(fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.TimeFieldValue(fieldName, value));
			return this;
		};

		this.addUrlFieldValue = function(fieldName, label, url) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.UrlFieldValue(fieldName, label, url));
			return this;
		};

		this.addLinkedFieldValues = function(fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
			return this;
		};

		this.addMultiFieldValues = function(fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.MultiFieldValues(fieldName, values));
			return this;
		};
	};

	envianceSdk.data.NumericDataPointInfo = function(parameterIdOrTag, completeDate, value, qualityData, collector) {
		if (parameterIdOrTag) {
			this.parameterIdOrTag = parameterIdOrTag;
		}
		if (completeDate) {
			this.completeDate = completeDate;
		}
		if (value) {
			this.value = value;
		}
		if (qualityData) {
			this.qualityData = qualityData;
		}
		if (collector) {
			this.collector = collector;
		}

		this.addScalarFieldValue = function(fieldName, val) {
			this.qualityData = this.qualityData || [];
			this.qualityData.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, val));
			return this;
		};

		this.addLinkedFieldValues = function(fieldName, values) {
			this.qualityData = this.qualityData || [];
			this.qualityData.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
			return this;
		};

	};
	
	envianceSdk.data.NumericDataPointForAcronymInfo = function (parameterIdOrTag, completeDate, acronymValue, qualityData, collector) {
		var dpInfo = new envianceSdk.data.NumericDataPointInfo(parameterIdOrTag, completeDate, null, qualityData, collector);

		if (acronymValue) {
			dpInfo.value = 0;
			dpInfo.acronym = acronymValue;
		}
		return dpInfo;
	};

	envianceSdk.data.NumericDataRangeInfo = function(parameterIdOrTag, beginDate, endDate) {
		if (parameterIdOrTag) {
			this.parameterIdOrTag = parameterIdOrTag;
		}
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}
	};

	_private._runCommandPolling = function(result, onsuccess, onerror) {
		var timeout = 1000 * 60 * 5;
		var startTime = new Date();
		var interval = 1000;

		var commandFunc = function() {
			envianceSdk.commands.getCommand(result.result,
				function(commandInfo) {
					if (commandInfo.result.status == "Succeeded") {
						if (result.metadata.warnings) {
							commandInfo.metadata.warnings = result.metadata.warnings;
						}
						onsuccess(commandInfo);
						return;
					}
					if (commandInfo.result.status == "Failed") {
						onerror({ metadata: { statusCode: 500 }, error: { errorNumber: 0, message: commandInfo.result.errorInfo.error, commandInfo: commandInfo.result} });
						return;
					}
					if ((new Date() - startTime) > timeout) {
						onerror({ metadata: { statusCode: 400 }, error: { errorNumber: 0, message: "The Command Polling timeout is exceeded."} });
						return;
					}
					interval += (interval * 0.1);
					window.setTimeout(commandFunc, interval);
				},
				function(errorResponse) {
					onerror(errorResponse);
				});
		};

		window.setTimeout(commandFunc, interval);
	};

	envianceRegisterNamespace("envianceSdk.reports");

	envianceSdk.reports.ReportExecutionInfo = function(reportIdOrPath, format, from, to) {
		if (reportIdOrPath) {
			this.reportIdOrPath = reportIdOrPath;
		}
		if (format) {
			this.format = format;
		}
		if (from) {
			this.from = from;
		}
		if (to) {
			this.to = to;
		}

		this.addObjectPathFilter = function(objectPath) {
			this.parameters = this.parameters || {};
			this.parameters.objects = this.parameters.objects || [];
			this.parameters.objects.push(objectPath);
			return this;
		};

		this.addObjectIdFilter = function(objectId) {
			this.parameters = this.parameters || {};
			this.parameters.objects = this.parameters.objects || [];
			this.parameters.objects.push(objectId);
			return this;
		};

		this.setWorkflowDateFilterBy = function(dateType) {
			this.parameters = this.parameters || {};
			this.parameters.filterBy = dateType;
			return this;
		};
	};

	envianceSdk.messages.MessageInfo = function(recipientIdOrUserName, subject, body, sendByEmail) {
		if (recipientIdOrUserName) {
			this.recipientIdOrUserName = recipientIdOrUserName;
		}
		if (subject) {
			this.subject = subject;
		}
		if (body) {
			this.body = body;
		}
		if (sendByEmail) {
			this.sendByEmail = sendByEmail;
		} else {
			this.sendByEmail = false;
		}
	};

	envianceSdk.groups.GroupInfo = function(name, rights, members) {
		if (name) {
			this.name = name;
		}
		if (rights) {
			this.rights = rights;
		}
		if (members) {
			this.members = members;
		}
	};

	envianceRegisterNamespace("envianceSdk.packages");

	envianceSdk.packages.PackageInfo = function (name, description, content, displayPage, iconSrc, isLocked, isRoutingEnabled) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (content) {
			this.content = content;
		}
		if (displayPage) {
			this.displayPage = displayPage;
		}
		if (iconSrc) {
			this.iconSrc = iconSrc;
		}
		if (isLocked != null) {
			this.isLocked = isLocked;
		}
		if (isRoutingEnabled) {
			this.isRoutingEnabled = isRoutingEnabled;
		}
	};

	envianceSdk.packages.PackageItemInfo = function(path, content) {
		if (path) {
			this.path = path;
		}
		if (content) {
			this.content = content;
		}
	};
	
	envianceRegisterNamespace("envianceSdk.activities");
	
	envianceSdk.activities.ActivityInfo = function (name, description, templateIdOrName, fields, properties) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (templateIdOrName) {
			this.templateIdOrName = templateIdOrName;
		}
		if (fields) {
			this.fields = fields;
		}
		if (properties) {
			this.properties = properties;
		}
		
		this.addScalarFieldValue = function (fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
			return this;
		};

		this.addDateFieldValue = function (fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.DateFieldValue(fieldName, value));
			return this;
		};

		this.addTimeFieldValue = function (fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.TimeFieldValue(fieldName, value));
			return this;
		};

		this.addUrlFieldValue = function (fieldName, label, url) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.UrlFieldValue(fieldName, label, url));
			return this;
		};

		this.addLinkedFieldValues = function (fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
			return this;
		};

		this.addMultiFieldValues = function (fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.MultiFieldValues(fieldName, values));
			return this;
		};

		this.addProperty = function (propertyIdOrName, valueHistory) {
			this.properties = this.properties || [];
			this.properties.push(new envianceSdk.activities.ActivityPropertyMapInfo(propertyIdOrName, valueHistory));
			return this;
		};
	};

	envianceSdk.activities.ActivityPropertyMapInfo = function (propertyIdOrName, valueHistory) {
		if (propertyIdOrName) {
			this.propertyIdOrName = propertyIdOrName;
		}
		if (valueHistory) {
			this.valueHistory = valueHistory;
		}

		this.addValue = function (beginDate, value) {
			this.valueHistory = this.valueHistory || [];
			this.valueHistory.push(new envianceSdk.activities.MaterialValueHistoryInfo(beginDate, value));
		};
	};
	

	envianceSdk.activities.MaterialValueHistoryInfo = function (beginDate, value) {
		
		if (beginDate) {
			this.beginDate = beginDate;
		}		
		if (value) {
			this.value = value;
		}
	};
	
	envianceRegisterNamespace("envianceSdk.chemicals");

	envianceSdk.chemicals.ChemicalInfo = function (name, casNum, alias, description, historyItems) {
		if (name) {
			this.name = name;
		}
		if (casNum) {
			this.casNum = casNum;
		}
		if (alias) {
			this.alias = alias;
		}
		if (description) {
			this.description = description;
		}
		if (historyItems) {
			this.historyItems = historyItems;
		}

		this.addHistoryItem = function (historyItem) {
			this.historyItems = this.historyItems || [];
			this.historyItems.push(historyItem);
			return this;
		};
	};
	
	envianceSdk.chemicals.ChemicalHistoryItemInfo = function (beginDate, mw, antA, antB, antC, antAk,
															  antBk, vp60, density, dipprA, dipprB, dipprC,
															  dipprD, dipprE, dipprF, dipprG, rcraHaz, hap,
															  tri, ehs, pbt, dioxin, caa112R, pac, diisocyan,
															  cerclaHaz, airToxicEmissionInventory, solid,
		                                                      nonEvaporative, rcraVoc, rcraSvoc, caaVoc) {
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (mw != null) {
			this.mw = mw;
		}
		if (antA != null) {
			this.antA = antA;
		}		
		if (antB != null) {
			this.antB = antB;
		}
		if (antC != null) {
			this.antC = antC;
		}
		if (antAk != null) {
			this.antAk = antAk;
		}
		if (antBk != null) {
			this.antBk = antBk;
		}
		if (vp60 != null) {
			this.vp60 = vp60;
		}
		if (density != null) {
			this.density = density;
		}
		if (dipprA != null) {
			this.dipprA = dipprA;
		}
		if (dipprB != null) {
			this.dipprB = dipprB;
		}
		if (dipprC != null) {
			this.dipprC = dipprC;
		}
		if (dipprD != null) {
			this.dipprD = dipprD;
		}
		if (dipprE != null) {
			this.dipprE = dipprE;
		}
		if (dipprF != null) {
			this.dipprF = dipprF;
		}
		if (dipprG != null) {
			this.dipprG = dipprG;
		}
		if (rcraHaz != null) {
			this.rcraHaz = rcraHaz;
		}
		if (hap != null) {
			this.hap = hap;
		}
		if (tri != null) {
			this.tri = tri;
		}
		if (ehs != null) {
			this.ehs = ehs;
		}
		if (pbt != null) {
			this.pbt = pbt;
		}
		if (dioxin != null) {
			this.dioxin = dioxin;
		}
		if (caa112R != null) {
			this.caa112R = caa112R;
		}
		if (pac != null) {
			this.pac = pac;
		}
		if (diisocyan != null) {
			this.diisocyan = diisocyan;
		}
		if (cerclaHaz != null) {
			this.cerclaHaz = cerclaHaz;
		}
		if (airToxicEmissionInventory != null) {
			this.airToxicEmissionInventory = airToxicEmissionInventory;
		}
		if (solid != null) {
			this.solid = solid;
		}
		if (nonEvaporative != null) {
			this.nonEvaporative = nonEvaporative;
		}
		if (rcraVoc != null) {
			this.rcraVoc = rcraVoc;
		}
		if (rcraSvoc != null) {
			this.rcraSvoc = rcraSvoc;
		}
		if (caaVoc != null) {
			this.caaVoc = caaVoc;
		}
	};

	envianceRegisterNamespace("envianceSdk.chemicalgroups");

	envianceSdk.chemicalgroups.ChemicalGroupInfo = function (name, description, chemicals) {
		if (name) {
			this.name = name;
		}		
		if (description) {
			this.description = description;
		}
		if (chemicals) {
			this.chemicals = chemicals;
		}
		
		this.addChemical = function (chemicalIdOrAlias) {
			this.chemicals = this.chemicals || [];
			this.chemicals.push(chemicalIdOrAlias);
			return this;
		};
	};	

	envianceRegisterNamespace("envianceSdk.chemicallists");

	envianceSdk.chemicallists.ChemicalListInfo = function (name, description, chemicalListHistoryItems) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		
		if (chemicalListHistoryItems) {
			this.chemicalListHistoryItems = chemicalListHistoryItems;
		}

		this.addHistoryItem = function (histItem) {
			this.chemicalListHistoryItems = this.chemicalListHistoryItems || [];
			this.chemicalListHistoryItems.push(histItem);
			return this;
		};
	};
	
	envianceSdk.chemicallists.ChemicalHistoryItemInfo = function (beginDate, limits) {
		if (beginDate) {
			this.beginDate = beginDate;
		}

		if (limits) {
			this.limits = limits;
		}

		this.addLimit = function (idOrAlias, limit) {
			this.limits = this.limits || [];
			this.limits.push(new envianceSdk.chemicallists.ChemicalHistoryLimitInfo(idOrAlias, limit) );
			return this;
		};
	};

	envianceSdk.chemicallists.ChemicalHistoryLimitInfo = function(chemicalIdOrAlias, limit) {
		if (chemicalIdOrAlias) {
			this.chemicalIdOrAlias = chemicalIdOrAlias;
		}
		
		if (limit) {
			this.limit = limit;
		}
	};

	envianceRegisterNamespace("envianceSdk.materials");

	envianceSdk.materials.MaterialInfo = function (name, description, templateIdOrName, materialAvailabilityFlag, chemicals, fields, properties) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (templateIdOrName) {
			this.templateIdOrName = templateIdOrName;
		}
		if (materialAvailabilityFlag != null) {
			this.materialAvailabilityFlag = materialAvailabilityFlag;
		}
		if (chemicals) {
			this.chemicals = chemicals;
		}
		if (fields) {
			this.fields = fields;
		}
		
		if (properties) {
			this.properties = properties;
		}

		this.addChemical = function (chemicalIdOrAlias, chemicalConcentrationHistory) {
			this.chemicals = this.chemicals || [];
			this.chemicals.push(new envianceSdk.materials.MaterialChemicalMapInfo(chemicalIdOrAlias, chemicalConcentrationHistory));
			return this;
		};

		this.addScalarFieldValue = function (fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.ScalarFieldValue(fieldName, value));
			return this;
		};

		this.addDateFieldValue = function (fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.DateFieldValue(fieldName, value));
			return this;
		};

		this.addTimeFieldValue = function (fieldName, value) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.TimeFieldValue(fieldName, value));
			return this;
		};

		this.addUrlFieldValue = function (fieldName, label, url) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.UrlFieldValue(fieldName, label, url));
			return this;
		};

		this.addLinkedFieldValues = function (fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.LinkedFieldValues(fieldName, values));
			return this;
		};

		this.addMultiFieldValues = function (fieldName, values) {
			this.fields = this.fields || [];
			this.fields.push(new envianceSdk.customFields.MultiFieldValues(fieldName, values));
			return this;
		};

		this.addProperty = function (propertyIdOrName, valueHistory) {
			this.properties = this.properties || [];
			this.properties.push(new envianceSdk.materials.MaterialPropertyMapInfo(propertyIdOrName, valueHistory));
			return this;
		};
	};
	
	envianceSdk.materials.MaterialPropertyMapInfo = function (propertyIdOrName, valueHistory) {
		if (propertyIdOrName) {
			this.propertyIdOrName = propertyIdOrName;
		}
		if (valueHistory) {
			this.valueHistory = valueHistory;
		}

		this.addValue = function (id, beginDate, value) {
			this.valueHistory = this.valueHistory || [];
			this.valueHistory.push(new envianceSdk.materials.MaterialPropertyValueHistoryInfo(id, beginDate, value));
			return this;
		};
	};
	
	envianceSdk.materials.MaterialPropertyValueHistoryInfo = function (id, beginDate, value) {
		if (id) {
			this.id = id;
		}
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (value) {
			this.value = value;
		}
	};

	envianceSdk.materials.MaterialChemicalMapInfo = function (chemicalIdOrAlias, chemicalConcentrationHistory) {
		if (chemicalIdOrAlias) {
			this.chemicalIdOrAlias = chemicalIdOrAlias;
		}
		if (chemicalConcentrationHistory) {
			this.chemicalConcentrationHistory = chemicalConcentrationHistory;
		}

		this.addChemicalConcentration = function (id, beginDate, present, minConc, avgConc, maxConc, created) {
			this.chemicalConcentrationHistory = this.chemicalConcentrationHistory || [];
			this.chemicalConcentrationHistory.push(new envianceSdk.materials.ChemicalConcentrationHistoryInfo(id, beginDate, present, minConc, avgConc, maxConc, created));
			return this;
		};
	};

	envianceSdk.materials.ChemicalConcentrationHistoryInfo = function(id, beginDate, present, minConc, avgConc, maxConc, created) {
		if (id) {
			this.id = id;
		}

		if (beginDate) {
			this.beginDate = beginDate;
		}

		if (present) {
			this.present = present;
		}

		if (minConc) {
			this.minConc = minConc;
		}

		if (avgConc) {
			this.avgConc = avgConc;
		}

		if (maxConc) {
			this.maxConc = maxConc;
		}

		if (created) {
			this.created = created;
		}
	};

	envianceRegisterNamespace("envianceSdk.materialGroups");

	envianceSdk.materialGroups.MaterialGroupInfo = function (name, description, materialIdOrNames) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (materialIdOrNames) {
			this.materialIdOrNames = materialIdOrNames;
		}

		this.addMaterial = function (materialIdOrName) {
			this.materialIdOrNames = this.materialIdOrNames || [];
			this.materialIdOrNames.push(materialIdOrName);
			return this;
		};
	};
	
	envianceRegisterNamespace("envianceSdk.materialData");

	envianceSdk.materialData.MdlGroupInfo = function (parentIdOrPath, activityIdOrName, complete, collector, dataLines) {
		if (parentIdOrPath) {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activityIdOrName) {
			this.activityIdOrName = activityIdOrName;
		}
		if (complete) {
			this.complete = complete;
		}
		if (collector) {
			this.collector = collector;
		}
		if (dataLines) {
			this.dataLines = dataLines;
		}

		this.addDataLine = function (dtId, materialIdOrName, mdlGroupId, startTime, endTime, data) {
			this.dataLines = this.dataLines || [];
			this.dataLines.push(new envianceSdk.materialData.MaterialDataLinesInfo(dtId, materialIdOrName, mdlGroupId, startTime, endTime, data));
			return this;
		};
	};

	envianceSdk.materialData.MaterialDataLinesInfo = function (dtId, materialIdOrName, mdlGroupId, startTime, endTime, data) {
		if (dtId) {
			this.dtId = dtId;
		}
		if (materialIdOrName) {
			this.materialIdOrName = materialIdOrName;
		}
		if (mdlGroupId) {
			this.mdlGroupId = mdlGroupId;
		}
		if (startTime) {
			this.startTime = startTime;
		}
		if (endTime) {
			this.endTime = endTime;
		}
		if (data) {
			this.data = data;
		}

		this.addData = function (dataLineId, propertyIdOrName, value) {
			this.data = this.data || [];
			this.data.push(new envianceSdk.materialData.MaterialDataInfo(dataLineId, propertyIdOrName, value));
		};
	};

	envianceSdk.materialData.MaterialDataInfo = function (dataLineId, propertyIdOrName, value) {
		if (dataLineId) {
			this.id = dataLineId;
		}
		if (propertyIdOrName) {
			this.propertyIdOrName = propertyIdOrName;
		}
		if (value) {
			this.value = value;
		}
	};
	
	envianceSdk.materialData.MdlGroupUploadInfo = function (name, description, content, fileName, mimeType, objectIdOrPath) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (content) {
			this.content = content;
		}
		if (fileName) {
			this.fileName = fileName;
		}
		if (mimeType) {
			this.mimeType = mimeType;
		}
		if (objectIdOrPath) {
			this.objectIdOrPath = objectIdOrPath;
		}
	};
	
	envianceRegisterNamespace("envianceSdk.tags");

	envianceSdk.tags.TagInfo = function (name, tagSchemeId, description) {
		if (name) {
			this.name = name;
		}
		if (tagSchemeId) {
			this.tagSchemeIdOrName = tagSchemeId;
		}
		if (description) {
			this.description = description;
		}
	};

	envianceRegisterNamespace("envianceSdk.tagSchemes");

	envianceSdk.tagSchemes.TagSchemeInfo = function (name, enforceUniqueness, description) {
		if (name) {
			this.name = name;
		}
		if (enforceUniqueness) {
			this.enforceUniqueness = enforceUniqueness;
		}
		if (description) {
			this.description = description;
		}
	};
	
	envianceSdk.requirements.ParameterRequirementInfo = function (requirementType, name, parentIdOrPath, activeDate, inactiveDate,
		responsibleUserIdOrName, description, requirementTemplateIdOrName, specificCitation, periodFrequency, periodTime, qualityTemplateIdOrName,
		uom, dataColMethod, dataColPeriod, dataColFrequency, precision, dataRangeMin, dataRangeMax
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (qualityTemplateIdOrName) {
			this.qualityTemplateIdOrName = qualityTemplateIdOrName;
		}
		if (uom) {
			this.uom = uom;
		}
		if (dataColMethod) {
			this.dataColMethod = dataColMethod;
		}
		if (dataColPeriod) {
			this.dataColPeriod = dataColPeriod;
		}
		if (dataColFrequency) {
			this.dataColFrequency = dataColFrequency;
		}
		if (precision) {
			this.precision = precision;
		}
		if (dataRangeMin) {
			this.dataRangeMin = dataRangeMin;
		}
		if (dataRangeMax) {
			this.dataRangeMax = dataRangeMax;
		}
		this.addQualitySubstitutionHistory = function (beginDate, endDate, script) {
			this.qualitySubstitutionHistory = this.qualitySubstitutionHistory || [];
			this.qualitySubstitutionHistory.push(new envianceSdk.requirements.QualitySubstitutionHistoryInfo(beginDate, endDate, script));
			return this;
		};

		this.addAcronymSubstitution = function (acronym, value) {
			this.acronyms = this.acronyms || [];
			this.acronyms.push(new envianceSdk.requirements.AcronymHistoryInfo(acronym, value));
			return this;
		};
		this.setActiveDate = function (actDate) {
			this.activeDate = actDate;
			return this;
		};
		this.setInactiveDate = function (inActDate) {
			this.inActiveDate = inActDate;
			return this;
		};
	};
	envianceSdk.requirements.QualitySubstitutionHistoryInfo = function (beginDate, endDate, script) {
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}
		if (script) {
			this.script = script;
		}
	};
	envianceSdk.requirements.AcronymHistoryInfo = function (acronym, value) {
		if (acronym) {
			this.acronym = acronym;
		}
		if (value) {
			this.value = value;
		}
	};

	envianceSdk.requirements.CalcRequirementInfo = function (
		requirementType, name, parentIdOrPath, activeDate, inactiveDate, responsibleUserIdOrName,
		requirementTemplateIdOrName, specificCitation, periodFrequency, periodTime,		
		description, uom, precision, calcDescription									
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (uom) {
			this.uom = uom;
		}
		if (precision) {
			this.precision = precision;
		}
		if (calcDescription) {
			this.calcDescription = calcDescription;
		}
	};
	
	envianceSdk.requirements.CbCalcRequirementInfo = function (
		requirementType, name, parentIdOrPath, activeDate, inactiveDate, responsibleUserIdOrName,
		requirementTemplateIdOrName, specificCitation, periodFrequency, periodTime,		
		description, uom, precision, calcDescription									
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (uom) {
			this.uom = uom;
		}
		if (precision) {
			this.precision = precision;
		}
		if (calcDescription) {
			this.calcDescription = calcDescription;
		}
		this.addCbIntervalHistory = function (beginDate, endDate, requiredDataCount, aggregationType, baseRequirementIdOrPath) {
			this.countBaseInterval = this.countBaseInterval || [];
			this.countBaseInterval.push(new envianceSdk.requirements.CbIntervalHistory(beginDate, endDate, requiredDataCount, aggregationType, baseRequirementIdOrPath));
			return this;
		};
	};
	envianceSdk.requirements.CbIntervalHistory = function (beginDate, endDate, requiredDataCount, aggregationType, baseRequirementIdOrPath) {
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.requiredDataCount = requiredDataCount;
		this.aggregationType = aggregationType;
		this.baseRequirementIdOrPath = baseRequirementIdOrPath;
	};
	
	envianceSdk.requirements.TbCalcRequirementInfo = function (
		requirementType, isRolling, name, parentIdOrPath, activeDate, inactiveDate, responsibleUserIdOrName,
		requirementTemplateIdOrName, specificCitation, periodFrequency, periodTime,		
		description, uom, precision, calcDescription, missingDataPercent
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (uom) {
			this.uom = uom;
		}
		if (precision) {
			this.precision = precision;
		}
		if (calcDescription) {
			this.calcDescription = calcDescription;
		}		
		
		this.isRolling = isRolling;
		
		if (missingDataPercent) {
			this.missingDataPercent = missingDataPercent;
		}
		
		this.addTbFormulaHistory = function (beginDate, endDate, script, periodDuration, periodType, intermediatePeriodType, exceptionDivideByZero, exceptionOverflow, exceptionOther) {
			this.tbFormulaHistory = this.tbFormulaHistory || [];
			this.tbFormulaHistory.push(new envianceSdk.requirements.TbFormulaHistory(beginDate, endDate, script, periodDuration, periodType, intermediatePeriodType, exceptionDivideByZero, exceptionOverflow, exceptionOther));
			return this;
		};
	};
	envianceSdk.requirements.TbFormulaHistory = function (beginDate, endDate, script, periodDuration, periodType, intermediatePeriodType, exceptionDivideByZero, exceptionOverflow, exceptionOther) {
		
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.script = script;
		this.periodDuration = periodDuration;
		this.periodType = periodType;
		this.intermediatePeriodType = intermediatePeriodType;
		this.exceptionDivideByZero = exceptionDivideByZero;
		this.exceptionOverflow = exceptionOverflow;
		this.exceptionOther = exceptionOther;		
	};
	
	envianceSdk.requirements.TbAggRequirementInfo = function (
		requirementType, name, parentIdOrPath, activeDate, inactiveDate, responsibleUserIdOrName,
		requirementTemplateIdOrName, specificCitation, periodFrequency, periodTime,		
		description, uom, precision, calcDescription, baseParameterIdOrPath, generateResult, aggregateOperation
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (uom) {
			this.uom = uom;
		}
		if (precision) {
			this.precision = precision;
		}
		if (calcDescription) {
			this.calcDescription = calcDescription;
		}
		if (baseParameterIdOrPath) {
			this.baseParameterIdOrPath = baseParameterIdOrPath;
		}
		if (generateResult) {
			this.generateResult = generateResult;
		}
		if (aggregateOperation) {
			this.aggregateOperation = aggregateOperation;
		}
		this.addTimeIntervalsHistory = function (beginDate, endDate) {
			this.activeTimeHistory = this.activeTimeHistory || [];
			this.activeTimeHistory.push(new envianceSdk.requirements.ActiveTimeHistory(beginDate, endDate));
			return this;
		};
	};
	envianceSdk.requirements.ActiveTimeHistory = function (beginDate, endDate) {
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}
	};
	
	envianceSdk.requirements.TbSubRequirementInfo = function (
		requirementType, name, parentIdOrPath, activeDate, inactiveDate, responsibleUserIdOrName,
		requirementTemplateIdOrName, specificCitation, periodFrequency, periodTime,
		description, uom, precision, calcDescription, baseParameterIdOrPath, isAscending
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (uom) {
			this.uom = uom;
		}
		if (precision) {
			this.precision = precision;
		}
		if (calcDescription) {
			this.calcDescription = calcDescription;
		}
		if (baseParameterIdOrPath) {
			this.baseParameterIdOrPath = baseParameterIdOrPath;
		}
		if (isAscending) {
			this.isAscending = isAscending;
		}
		this.setActiveDate = function (activeDate) {
			this.activeDate = activeDate;
			return this;
		};
	};
	
	envianceSdk.requirements.MacRequirementInfo = function (requirementType, name, parentIdOrPath,
		activeDate, inactiveDate, responsibleUserIdOrName, requirementTemplateIdOrName, specificCitation, periodFrequency,
		periodTime, description, uom, precision, calcDescription, macType, activityIdOrName, aggregateOperation
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (periodFrequency) {
			this.periodFrequency = periodFrequency;
		}
		if (periodTime) {
			this.periodTime = periodTime;
		}
		if (description) {
			this.description = description;
		}
		if (uom) {
			this.uom = uom;
		}
		if (precision) {
			this.precision = precision;
		}
		if (calcDescription) {
			this.calcDescription = calcDescription;
		}
		if (macType) {
			this.macType = macType;
		}
		if (activityIdOrName) {
			this.activityIdOrName = activityIdOrName;
		}
		if (aggregateOperation) {
			this.aggregateOperation = aggregateOperation;
		}

		this.setActiveDate = function (actDate) {
			this.activeDate = actDate;
			return this;
		};
		this.setInactiveDate = function (inActDate) {
			this.inActiveDate = inActDate;
			return this;
		};
		
		this.addMaterial = function (materialIdOrName) {
			this.materials = this.materials || [];
			this.materials.push(new envianceSdk.requirements.Material(materialIdOrName));
			return this;
		};
		this.addMaterialGroup = function (materialGroupIdOrName) {
			this.materials = this.materials || [];
			this.materials.push(new envianceSdk.requirements.MaterialGroup(materialGroupIdOrName));
			return this;
		};
		this.addMacLimitHistory = function (beginDate, endDate, comparisonOperation, regLowLimit, regHighLimit, chemicalIdOrAlias, regChemListIdOrName, intLowLimit, intHighLimit, intChemListIdOrName) {
			this.macLimitHistory = this.macLimitHistory || [];
			this.macLimitHistory.push(new envianceSdk.requirements.MacLimitHistory(beginDate, endDate, comparisonOperation, regLowLimit, regHighLimit, chemicalIdOrAlias, regChemListIdOrName, intLowLimit, intHighLimit, intChemListIdOrName));
			return this;
		};
		this.addFormulaHistory = function (beginDate, endDate, script, exceptionDivideByZero, exceptionOverflow, exceptionOther) {
			this.formulaHistory = this.formulaHistory || [];
			this.formulaHistory.push(new envianceSdk.requirements.FormulaHistory(beginDate, endDate, script, exceptionDivideByZero, exceptionOverflow, exceptionOther));
			return this;
		};

	};
	envianceSdk.requirements.Material = function (materialIdOrName) {
		if (materialIdOrName) {
			this.materialIdOrName = materialIdOrName;
		}
	};
	envianceSdk.requirements.MaterialGroup = function (materialGroupIdOrName) {
		if (materialGroupIdOrName) {
			this.materialGroupIdOrName = materialGroupIdOrName;
		}
	};
	
	envianceSdk.requirements.MacLimitHistory = function (beginDate, endDate, comparisonOperation, regLowLimit, regHighLimit, chemicalIdOrAlias, regChemListIdOrName, intLowLimit, intHighLimit, intChemListIdOrName) {
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (endDate) {
			this.endDate = endDate;
		}
		if (comparisonOperation) {
			this.comparisonOperation = comparisonOperation;
		}
		if (regLowLimit) {
			this.regLowLimit = regLowLimit;
		}
		if (regHighLimit) {
			this.regHighLimit = regHighLimit;
		}
		if (chemicalIdOrAlias) {
			this.chemicalIdOrAlias = chemicalIdOrAlias;
		}
		if (regChemListIdOrName) {
			this.regChemListIdOrName = regChemListIdOrName;
		}
		if (intLowLimit) {
			this.intLowLimit = intLowLimit;
		}
		if (intHighLimit) {
			this.intHighLimit = intHighLimit;
		}
		if (intChemListIdOrName) {
			this.intChemListIdOrName = intChemListIdOrName;
		}
	};
	
	envianceSdk.requirements.SysVariableRequirementInfo = function (
		requirementType, name, parentIdOrPath, activeDate, inactiveDate, responsibleUserIdOrName,
		requirementTemplateIdOrName, specificCitation, description, uom
	) {
		if (requirementType) {
			this.requirementType = requirementType;
		}
		if (name) {
			this.name = name;
		}
		if (parentIdOrPath || parentIdOrPath == "") {
			this.parentIdOrPath = parentIdOrPath;
		}
		if (activeDate) {
			this.activeDate = activeDate;
		}
		if (inactiveDate) {
			this.inactiveDate = inactiveDate;
		}
		if (responsibleUserIdOrName) {
			this.responsibleUserIdOrName = responsibleUserIdOrName;
		}
		if (description) {
			this.description = description;
		}
		if (requirementTemplateIdOrName) {
			this.requirementTemplateIdOrName = requirementTemplateIdOrName;
		}
		if (specificCitation) {
			this.specificCitation = specificCitation;
		}
		if (uom) {
			this.uom = uom;
		}
		
		this.addValueHistory = function (beginDate, endDate, value) {
			this.valueHistory = this.valueHistory || [];
			this.valueHistory.push(new envianceSdk.requirements.ValueHistory(beginDate, endDate, value));
			return this;
		};
	};
	envianceSdk.requirements.ValueHistory = function (beginDate, endDate, value) {
		this.beginDate = beginDate;
		this.endDate = endDate;
		this.value = value;		
	};

	envianceRegisterNamespace("envianceSdk.materialProperties");
	envianceSdk.materialProperties.MaterialPropertyInfo = function (name, propertyType, description, dataType, uniqueTag, formulaHistory) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}
		if (propertyType) {
			this.propertyType = propertyType;
		}
		if (dataType) {
			this.dataType = dataType;
		}
		if (uniqueTag) {
			this.uniqueTag = uniqueTag;
		}
		if (formulaHistory) {
			this.formulaHistory = formulaHistory;
		}
		this.addFormulaHistory = function (id, beginDate, script) {
			this.formulaHistory = this.formulaHistory || [];
			this.formulaHistory.push(new envianceSdk.materialProperties.FormulaHistory(id, beginDate, script));
			return this;
		};				
	};

	envianceSdk.materialProperties.FormulaHistory = function (id, beginDate, script) {
		if (id) {
			this.id = id;
		}
		if (beginDate) {
			this.beginDate = beginDate;
		}
		if (script) {
			this.script = script;
		}
	};
	
	envianceRegisterNamespace("envianceSdk.materialTemplates");
	envianceSdk.materialTemplates.MaterialTemplateInfo = function (name, description, fields) {
		if (name) {
			this.name = name;
		}
		if (description) {
			this.description = description;
		}		
		if (fields) {
			this.fields = fields;
		}
		this.addField = function (fieldIdOrAlias) {
			this.fields = this.fields || [];
			this.fields.push(fieldIdOrAlias);
			return this;
		};
	};
	
	envianceSdk.workflows.WorkflowInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.compliance.LocationInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.compliance.LocationInfo.prototype.addTag = envianceSdk.common.addTag;
	envianceSdk.tasks.TaskInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.events.EventInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.compliance.LocationInfo.prototype.setTimeZone = envianceSdk.common.setTimeZone;
	envianceSdk.tasks.TaskInfo.prototype.setTimeZone = envianceSdk.common.setTimeZone;	

	// all Requirements
	// ParameterRequirementInfo
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addLimitHistory = envianceSdk.requirements.AddLimitHistory;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.ParameterRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	
	// MacRequirementInfo
	envianceSdk.requirements.MacRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.MacRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.MacRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.MacRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.MacRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.MacRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.MacRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.MacRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.MacRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.MacRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.MacRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.MacRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.MacRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.MacRequirementInfo.prototype.addFormulaHistory = envianceSdk.requirements.AddFormulaHistory;
	envianceSdk.requirements.MacRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.MacRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.MacRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.MacRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	// CalcRequirementInfo
	envianceSdk.requirements.CalcRequirementInfo.prototype.addFormulaHistory = envianceSdk.requirements.AddFormulaHistory;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.CalcRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addLimitHistory = envianceSdk.requirements.AddLimitHistory;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addRequirementsAliasMap = envianceSdk.requirements.AddRequirementsAliasMap;
	envianceSdk.requirements.CalcRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.CalcRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.CalcRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.CalcRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.CalcRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	// CbCalculatedRequirementInfo
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addLimitHistory = envianceSdk.requirements.AddLimitHistory;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.CbCalcRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	// TbCalculatedRequirementInfo
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addLimitHistory = envianceSdk.requirements.AddLimitHistory;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addRequirementsAliasMap = envianceSdk.requirements.AddRequirementsAliasMap;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.TbCalcRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	// TbAggRequirementInfo
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addLimitHistory = envianceSdk.requirements.AddLimitHistory;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.TbAggRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	// TbSubRequirementInfo
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addFrequency = envianceSdk.requirements.AddFrequency;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addLimitHistory = envianceSdk.requirements.AddLimitHistory;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.setRegLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetRegLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addRegLimitTaskUser = envianceSdk.requirements.AddRegLimitTaskUser;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addRegLimitTaskGroup = envianceSdk.requirements.AddRegLimitTaskGroup;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.setIntLimitTaskTemplateAndAsgn = envianceSdk.requirements.SetIntLimitTaskTemplateAndAsgn;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addIntLimitTaskUser = envianceSdk.requirements.AddIntLimitTaskUser;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addIntLimitTaskGroup = envianceSdk.requirements.AddIntLimitTaskGroup;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.setNotifyUserOrMail = envianceSdk.requirements.SetNotifyUserOrMail;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addNotifyUser = envianceSdk.requirements.AddNotifyUser;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addNotifyGroup = envianceSdk.requirements.AddNotifyGroup;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.TbSubRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	// SysVariableRequirementInfo
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addDocument = envianceSdk.common.addDocument;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.setResponsibleUser = envianceSdk.requirements.SetResponsibleUser;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.setFieldTemplate = envianceSdk.common.setFieldTemplate;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addScalarFieldValue = envianceSdk.common.addScalarFieldValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addScalarFieldHistValue = envianceSdk.common.addScalarFieldHistValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addDateFieldValue = envianceSdk.common.addDateFieldValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addDateFieldHistValue = envianceSdk.common.addDateFieldHistValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addTimeFieldValue = envianceSdk.common.addTimeFieldValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addTimeFieldHistValue = envianceSdk.common.addTimeFieldHistValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addUrlFieldValue = envianceSdk.common.addUrlFieldValue;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addLinkedFieldValues = envianceSdk.common.addLinkedFieldValues;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addMultiFieldValues = envianceSdk.common.addMultiFieldValues;
	envianceSdk.requirements.SysVariableRequirementInfo.prototype.addTag = envianceSdk.common.addTag;
	
	
	envianceRegisterNamespace("envianceSdk.portal");
	
	envianceSdk.portal.PageGroupInfo = function (name) {
		if (name) {
			this.name = name;
		}
		
		this.addProperty = function (propName, propValue) {
			this.properties = this.properties || new Object();
			this.properties[propName] = propValue;
			return this;
		};
	};
	
	envianceSdk.portal.PageInfo = function (name, visibleToAll) {
		this.accessLevels = new Object();
		
		if (name) {
			this.name = name;
		}
		
		if (visibleToAll) {
			this.accessLevels.visibleToAll = visibleToAll;
		}
		this.accessLevels.addExceptUser = function (userName, accLevel) {
			this.exceptUsers = this.exceptUsers || [];
			this.exceptUsers.push({ name: userName, accesslevel: accLevel });
			return this;
		};
		this.accessLevels.addExceptUserId = function (userId, accLevel) {
			this.exceptUsers = this.exceptUsers || [];
			this.exceptUsers.push({ id: userId, accesslevel: accLevel });
			return this;
		};

		this.accessLevels.addExceptGroup = function (groupName, accLevel) {
			this.exceptGroups = this.exceptGroups || [];
			this.exceptGroups.push({ name: groupName, accesslevel: accLevel });
			return this;
		};
		
		this.accessLevels.addExceptGroupId = function (groupId, accLevel) {
			this.exceptGroups = this.exceptGroups || [];
			this.exceptGroups.push({ id: groupId, accesslevel: accLevel });
			return this;
		};

		this.addProperty = function (propName, propValue) {
			this.properties = this.properties || new Object();
			this.properties[propName] = propValue;
			return this;
		};
	};


	envianceSdk.portal.PanelInfo = function (name) {
		this.accessLevels = new Object();
		if (name) {
			this.name = name;
		}

		this.addProperty = function (propName, propValue) {
			this.properties = this.properties || new Object();
			this.properties[propName] = propValue;
			return this;
		};

		this.accessLevels.addUser = function (userName, accLevel) {
			this.users = this.users || [];
			this.users.push({ name: userName, accesslevel: accLevel });
			return this;
		};
		this.accessLevels.addUserId = function (userId, accLevel) {
			this.users = this.users || [];
			this.users.push({ id: userId, accesslevel: accLevel });
			return this;
		};

		this.accessLevels.addGroup = function (groupName, accLevel) {
			this.groups = this.groups || [];
			this.groups.push({ name: groupName, accesslevel: accLevel });
			return this;
		};
		this.accessLevels.addGroupId = function (groupId, groupName, accLevel) {
			this.groups = this.groups || [];
			this.groups.push({ id: groupId, accesslevel: accLevel });
			return this;
		};
	};


	envianceSdk.portal.PanelTemplateInfo = envianceSdk.portal.PageGroupInfo; // since the same structure used
	
	

	return envianceSdk;
} (envianceSdk || {}));