QUnit.config.reorder = false;
QUnit.config.autostart = false;

// Add configuration settings for compare functions
QUnit.extend(QUnit.config, {
	ignoreArrayElementOrder: true,
	ignoreObjectPrototype: true
});

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

			function GetBuildNumber() {
				return jQuery.ajax({
					url: 'buildnumber.txt',
					dataType: "text",
					async: false,
					success: function (response) {
						document.title = document.title + " (" + response + ")";
					},
					error: function (xhr, status, msg) {
						if (console)
							console.log('The buildnumber.txt loading error. ' + msg + '. Status: ' + status);
					}
				});
			}




function UnitTestsApplication() {
	var self = this;

	this._registerQUnitBegin();
	this._modules = UnitTestsApplication.modules;
	this._storage = new UnitTestsApplication.Storage();
	this._html = null;
	this._ui = null;
	
	envianceSdk.configure({ resubmitConfirmationOnError: false });
	
	this._systemManager = new UnitTestsApplication.SystemManager(this, function () {
		self._init();
	});
};

UnitTestsApplication.prototype = {
	_init: function () {
		this._html = new UnitTestsApplication.HtmlHelper(this);
		var isSingleMode = this._isSingleTestMode();
		var isDbParallel = this._isDbParallel();
		
		var self = this;
		this._systemManager._init(function () {
			self._ui = new UnitTestsApplication.Ui(self, !isSingleMode);

			self._ensureQUnitInitFired();
			
			if (isSingleMode || isDbParallel) {
				self.run(self.getModuleIndexesForSingleMode());
			}
		});
	},

	_registerQUnitBegin: function () {
		var self = this;
		
		QUnit.begin(function (details) {
			self._isQUnitBeginFired = true;
		});
	},

	_ensureQUnitInitFired: function () {
		if (this._isQUnitBeginFired && !this._html._initHelperFired) {
			QUnit.load();
		}
	},

	run: function (moduleIndexes) {
		QUnit.init();
		this._attachModules(moduleIndexes);
		QUnit.start();
	},

	getModules: function() {
		return this._modules;
	},

	getModuleName: function(index) {
		var module = this._modules[index];
		if (!module.name) {
			this.getModuleMetaData(module);
		}
		return module.name;
	},

	getModuleTests: function(index) {
		var module = this._modules[index];
		if (!module.tests) {
			this.getModuleMetaData(module);
		}
		return module.tests;
	},

	getModuleMetaData: function(module) {
		var modExec = new String(module.execute);

		modExec = this._jsCodeRemoveComments(modExec);
		modExec = modExec.replace(/\\"/g, '#q#');

		var res = /module\(\s*\"([^"]+)/.exec(modExec);
		module.name = res[1];
		module.tests = [];

		var regex = new RegExp(/(?:\\r|\\n|\\t|\s)+(?:test|asyncTest)\(\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*function/g);
		while ((res = regex.exec(modExec)) != null) {
			module.tests.push({ name: res[1].replace(/#q#/g, '"'), asserts: res[2] * 1 });
		}

		return module;
	},

	getModuleIndexByName: function(name) {
		if (!this._modules || !this._modules.length) return -1;

		for (var i = 0; i < this._modules.length; i++) {
			var m = this._modules[i];
			if (!m.name) this.getModuleMetaData(m);

			if (m.name == name) return i;
		}

		return -1;
	},

	getModuleTestIndexByName: function(moduleIndex, name) {
		var m = this._modules[moduleIndex];

		if (!m.name) this.getModuleMetaData(module);

		if (!m.tests.length) return -1;

		for (var i = 0; i < m.tests.length; i++) {
			if (m.tests[i].name == name) return i;
		}
		return -1;
	},

	getModuleIndexesForSingleMode: function () {
		if (!this._urlModulesMap) {
			var moduleNames = !!QUnit.urlParams.module && QUnit.urlParams.module.split(',');
			
			this._urlModulesMap = { indexes: [], names: [] };
			for (var i = 0; i < moduleNames.length; i++) {
				var index = this.getModuleIndexByName(moduleNames[i]);
				if (index >= 0) {
					this._urlModulesMap.indexes.push(index);
					this._urlModulesMap.names.push(moduleNames[i]);
				}
			}
		}

		return this._urlModulesMap.indexes.length ? this._urlModulesMap.indexes : this._storage.getModuleIndexesForSingleMode();
	},
	
	getSelectedModuleCount: function () {
		return this._isSingleTestMode() ? this.getModuleIndexesForSingleMode().length : this._ui._getSelectedModuleIndexes().length;
	},

	getStorage: function() {
		return this._storage;
	},

	_attachModules: function(moduleIndexes) {
		for (var j = 0; j < moduleIndexes.length; j++) {
			var mIdx = moduleIndexes[j];
			this._executeModule(this._modules[mIdx]);
		}
	},

	_executeModule: function(module) {
		module.execute();
	},

	_isSingleTestMode: function() {
		return QUnit.urlParams.testNumber > -1 || !!QUnit.urlParams.module;
	},
	
	_isDbParallel: function () {
		return !!QUnit.urlParams.dbsystemId;
	},

	_jsCodeRemoveComments: function(str) {
		var pos = 0;
		var q = null, lc = false, gc = false;
		var stPos = 0;
		var text = '';

		while (pos < str.length) {
			var c = str.charAt(pos++);

			if (lc) {
				if (c == '\r' && pos < str.length && str.charAt(pos) == '\n') {
					pos++;
					lc = false;
				} else if (c == '\n') lc = false;
				if (!lc) stPos = pos;
			} else if (gc) {
				if (c == '*' && pos < str.length && str.charAt(pos) == '/') {
					pos++;
					gc = false;
					stPos = pos;
				}
			} else if (q) {
				if (c == '\\') {
					c = str.charAt(pos++);
					if (c == '\r' && pos < str.length && str.charAt(pos) == '\n') pos++;
				} else if (c == q) {
					q = null;
				}
			} else if (c == '"' || c == "'") {
				q = c;
			} else if (c == '/' && pos < str.length) {
				c = str.charAt(pos++);
				if (c == '/') {
					lc = true;
					text += str.substring(stPos, pos - 2);
				} else if (c == '*') {
					gc = true;
					text += str.substring(stPos, pos - 2);
				}
			}
		}
		if (!lc && !gc) text += str.substring(stPos, pos - 1);
		return text;
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
	}
};

UnitTestsApplication.TestContext =
{
	getDefault : function (app) {
		return {
			formatErrorResponse: this.formatErrorResponse,
			errorHandler: this.errorHandler,
			errorHandlerAjax: this.errorHandlerAjax,
			successHandler: this.successHandler,
			accessUserName: app && app._systemManager.user.login,
			accessUserId: app && app._systemManager.user.id,
			originalSessionId : envianceSdk.getSessionId(),
			originalSystemId : envianceSdk.getSystemId()
		};
	},
	formatErrorResponse: function (response, status, message) {
		var msg;
		if (response.error) {
			if (typeof response.error === 'object')
				msg = response.error.message;
			else {
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

		if (response.error && response.error.details) {
			for (var i = 0; i < response.error.details.length; i++) {
				msg += "\n" + response.error.details[i].message;
			}
		}

		return msg;
	},
	errorHandler: function (response, status, message, context, donotStart) {
		var msg = UnitTestsApplication.TestContext.formatErrorResponse(response, status, message);

		ok(false, msg);
		if (!donotStart) start();
	},
	errorHandlerAjax: function (result, status, errorThrown, donotStart) {
		//check for success params
		if (!errorThrown || jQuery.type(errorThrown) == "string" || typeof errorThrown["status"] == "undefined") {
			result = envianceSdk._private._processError(result);
		}
		UnitTestsApplication.TestContext.errorHandler(result, status, errorThrown || result.status, null, donotStart);
	},
	successHandler: function () {
		ok(false, "failed");
		start();
	}
};

UnitTestsApplication.getDBSuffix = function () {
	return QUnit.urlParams.dbsuffix || "";
};

UnitTestsApplication.Storage = function() {
	this._ls = this._getLocalStorage();
};

UnitTestsApplication.Storage.prototype = {
	getModuleIndexesForBulkMode: function() {
		return this._getArray(this._BULK_MODE_MODULES_KEY);
	},
	getModuleIndexesForSingleMode: function() {
		return this._getArray(this._SINGLE_MODE_MODULES_KEY);
	},
	setModuleIndexesForSingleMode: function(indexes) {
		this._setArray(this._SINGLE_MODE_MODULES_KEY, indexes);
	},
	saveAppState: function(pos, indexes) {
		this._ls.setItem(this._START_PANEL_POS_KEY, pos.top + ',' + pos.left);
		this._setArray(this._BULK_MODE_MODULES_KEY, indexes);
	},
	getStartPanelPos: function() {
		var pos = this._ls.getItem(this._START_PANEL_POS_KEY);
		if (pos == null) {
			return null;
		}
		pos = pos.split(',');
		return { 'top': pos[0], 'left': pos[1] };
	},
	_getArray: function(key) {
		var items = this._ls.getItem(key);
		return items == null ? [] : items.split(',');
	},
	_setArray: function(key, items) {
		if (items.length > 0) {
			this._ls.setItem(key, items.join(','));
		} else {
			this._ls.removeItem(key);
		}
	},
	getSdkOptions: function() {
		return this._ls.getItem(this._OPTIONS_PANEL_KEY);
	},
	setSdkOptions: function(value) {
		if (value == null || value == '') {
			this._ls.removeItem(this._OPTIONS_PANEL_KEY);
		} else {
			this._ls.setItem(this._OPTIONS_PANEL_KEY, value);
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
	},
	_SINGLE_MODE_MODULES_KEY: 'UTApp_SM_Modules',
	_BULK_MODE_MODULES_KEY: 'UTApp_BM_Modules',
	_START_PANEL_POS_KEY: 'UTApp_StartPanelPos',
	_OPTIONS_PANEL_KEY: 'UTApp_SdkOptions'
};

			var options = { };
			
				var key = 'UTApp_SdkOptions';
				var item = new UnitTestsApplication.Storage()._ls.getItem(key);
				if (item) {
					try {
						options = JSON.parse(item);
					} catch (e) {} 
				}







UnitTestsApplication.modules = [];
UnitTestsApplication.registerModule = function(module) {
	UnitTestsApplication.modules.push(module);
};
var App = null;
$(document).ready(function() {
	App = new UnitTestsApplication();
});
