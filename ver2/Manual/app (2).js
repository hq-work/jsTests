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

UnitTestsApplication.Ui = function(app, useStartPanel) {
	this._app = app;

	//OptionsPanel
	this._sdkOptions = ['baseAddress', 'webAppVirtualPath', 'sessionId', 'systemId', 'userId', 'packageId', 'variables', 'crossDomainWorkaround', 'resubmitConfirmationOnError', 'refreshPageOnUnauthorized'];
	this._txtJson = null;
	this._btnRunWithOptions = null;
	this._optionsPanel = null;
	this._optionsPanelTab = null;
	this._btnOptionsClean = null;

	//StartPanel
	this._moduleCheckboxes = [];
	this._startPanel = null;
	this._modulesContainer = null;
	this._runButton = null;
	this._selectAllCheckbox = null;

	this._selectedModuleIndex = -1;
	this._isRequiredCallback = false;

	this._init(useStartPanel);
};

UnitTestsApplication.Ui.prototype = {
	_init: function (useStartPanel) {
		this._renderOptionsPanel();
		if (useStartPanel) {
			this._renderStartPanel();
		}
	},

	_renderOptionsPanel: function() {
		var html = '<div class="app-options-panel-tab" id="optionsPanelTab" > &#x25BC;</div>'
			+ '<div class="app-options-panel" style="display: none;" id="optionsPanel">'
			+ '<table class="app-options-panel-body" cellpadding="0" cellspacing="0">'
			+ '<tr><td colspan="2" style="font-size: 14px; font-weight: bold">Options:</td></tr>'
			+ '<tr><td>Base Address</td><td><input id="baseAddressOption" type="text" /></td></tr>'
			+ '<tr><td>Web App Virtual Path</td><td><input id="webAppVirtualPathOption" type="text" /></td></tr>'
			+ '<tr><td>Session Id</td><td><input id="sessionIdOption" type="text" maxlength="36"/></td></tr>'
			+ '<tr><td>System Id</td><td><input id="systemIdOption" type="text" maxlength="36"/></td></tr>'
			+ '<tr><td>User Id</td><td><input id="userIdOption" type="text" maxlength="36"/></td></tr>'
			+ '<tr><td>Package Id</td><td><input id="packageIdOption" type="text" maxlength="36"/></td></tr>'
			+ '<tr><td>Variables</td><td><select id="variablesOption"><option value=""></option><option value="simple">simple</option><option value="cookies">cookies</option></select></td></tr>'
			+ '<tr><td>Cross Domain Workaround</td><td><select id="crossDomainWorkaroundOption"><option value=""></option><option value="ifneeded">ifneeded</option><option value="always">always</option><option value="off">off</option></select></td></tr>'
			+ '<tr><td>Resubmit Confirmation on Error</td><td><select id="resubmitConfirmationOnErrorOption"><option value=""></option><option value="true">true</option><option value="false">false</option></select></td></tr>'
			+ '<tr><td>Refresh Page on Unauthorized</td><td><select id="refreshPageOnUnauthorizedOption"><option value=""></option><option value="true">true</option><option value="false">false</option></select></td></tr>'
			+ '<tr><td colspan="2"><b>Json:</b><br/><textarea id="txtJson" cols="30" rows="8" style="width: 100%;"></textarea></td></tr>'
			+ '<tr><td colspan="2"><input id="btnOptionsClean" type="button" value="Clear" class="app-options-panel-btn" style="float: left" /><input id="btnRunWithOptions" type="button" value="Restart with options" class="app-options-panel-btn" style="float: right" /></td></tr>'
			+ '</table>'
			+ '</div>';
		jQuery('body').append(html);

		this._txtJson = jQuery('#txtJson');
		this._btnRunWithOptions = jQuery('#btnRunWithOptions');
		this._btnOptionsClean = jQuery('#btnOptionsClean');
		this._optionsPanel = jQuery('#optionsPanel');
		this._optionsPanelTab = jQuery('#optionsPanelTab');

		var pos = jQuery('#punit').position();
		this._optionsPanelTab.css({ left: pos.left + 5, top: pos.top + 17 });

		var options = null;
		var stingOptions = this._app.getStorage().getSdkOptions();

		if (stingOptions != null && stingOptions != '') {
			options = JSON.parse(stingOptions);
		}
		for (var i = 0; i < this._sdkOptions.length; i++) {
			this._initOptionsPanel(options, this._sdkOptions[i]);
		}

		this._setOptionsJsonValue();
		this._bindOptionsPanel();
	},

	_initOptionsPanel: function(options, option) {
		var self = this;
		var input = jQuery('#' + option + 'Option');

		if (options != null) {
			var value = options[option];
			if (value === true) {
				value = 'true';
			}
			if (value === false) {
				value = 'false';
			}
			input.val(value);
		}

		input.change(function() { self._setOptionsJsonValue(); });
	},

	_getOptionsJsonValue: function() {
		var result = { };
		for (var i = 0; i < this._sdkOptions.length; i++) {
			var option = this._sdkOptions[i];
			var value = jQuery('#' + option + 'Option').val();

			if (value != null && value != '') {
				if (value === 'true') {
					value = true;
				}
				if (value === 'false') {
					value = false;
				}
				result[option] = value;
			}
		}
		result = JSON.stringify(result);
		return result == '{}' ? '' : result;
	},

	_setOptionsJsonValue: function() {
		this._txtJson.val(this._getOptionsJsonValue());
	},

	_clearOptions: function() {
		for (var i = 0; i < this._sdkOptions.length; i++) {
			jQuery('#' + this._sdkOptions[i] + 'Option').val('');
		}
		this._txtJson.val('');
	},

	_renderStartPanel: function() {
		var modules = this._app.getModules();
		var html = '<div id="startPanel" class="app-start-panel" style="display: none;">'
			+ '<div class="app-start-panel-header">'
			+ '<input id="selectAllCheckbox" type="checkbox" /> Modules:'
			+ '</div><div id="modules-wrapper">'
			+ '<ul id="modulesContainer" class="app-modules">';
		for (var i = 0; i < modules.length; i++) {
			html += '<li><span><input id="cb_' + i + '" type="checkbox" /><span class="caption">' + modules[i].label;
			
			if (modules[i].warning) {
				html += '<img src="warning16.png" title="' + this._app._html.htmlEncode(modules[i].warning) + '" />';
			}

			html += '</span></span><span id="timer_' + i + '" class="runtimer"></span></li>';
		}
		html += '</ul>'
			+ '</div><div class="app-start-panel-header">';
		
		var allowedDbPooling = this._app._systemManager._isPrimeUser() && this._app._systemManager.systemList.length > 1;

		html += 'Pool Size: <input id="modulesPoolSize" type="text" value="5" ' + (allowedDbPooling ? 'disabled' : '') + '/> <br>';
		
		if (allowedDbPooling) {
			html += 'Run on DB pool (size: <span id="dbsAvailable">' + this._app._systemManager.systemList.length + '</span>): <input id="modulesRunOnDBpool" type="checkbox" checked  />';
		}
		html += '</div>';

		if (this._app._systemManager._isUserCanRunDBTests()) {
			html += '<div class="app-buttons">'
				+ '<input id="runButton" type="button" value="Run" class="app-run-button" />'
				+ '<input id="parallelButton" type="button" value="Run Parallel" class="app-run-button" />'
				+ '</div>';
		} else {
			html += '<p>* You can not run tests because suitable system is not found</p>';
		}
		html += '</div>';

		jQuery('body').append(html);
		this._startPanel = jQuery('#startPanel');
		this._modulesContainer = jQuery('#modulesContainer');
		this._runButton = jQuery('#runButton');
		this._selectAllCheckbox = jQuery('#selectAllCheckbox');
		this._moduleCheckboxes = jQuery('input', this._modulesContainer).toArray();

		this._parallelButton = jQuery('#parallelButton');
		this._poolSizeInput = jQuery('#modulesPoolSize');
		this._poolUseDBPool = jQuery('#modulesRunOnDBpool');
		this._dbsAvailable = jQuery('#dbsAvailable');

		this._initModuleCheckboxes(this._app.getStorage().getModuleIndexesForBulkMode(), this._moduleCheckboxes);
		this._initStartPanel();
		this._bindStartPanel();
	},

	_bindOptionsPanel: function() {
		var self = this;

		this._btnRunWithOptions.click(function() {
			var value = self._txtJson.val();
			try {
				if (value != null && value != '') {
					JSON.parse(value);
				}
				self._app.getStorage().setSdkOptions(value);
				window.location.reload(false);
			} catch(e) {
				alert(e);
			}
		});
		this._btnOptionsClean.click(function() {
			self._clearOptions();
		});

		this._optionsPanelTab.click(function(event) {
			self._optionsPanel.show();
			event.stopPropagation();
		});

		this._optionsPanel.click(function(event) {
			event.stopPropagation();
		});

		jQuery(document).click(function() {
			self._optionsPanel.hide();
		});
	},

	_bindStartPanel: function() {
		var self = this;

		this._runButton.click(function() {
			var moduleIndexes = self._getSelectedModuleIndexes();
			QUnitTest.count = 0;
			self._app.run(moduleIndexes);
			self._app.getStorage().setModuleIndexesForSingleMode(moduleIndexes);
		});

		this._parallelButton.click(function () {
			var moduleIndexes = self._getSelectedModuleIndexes();
			var poolSize = self._poolSizeInput.val() * 1 || moduleIndexes.length;
			
			self._useDbPooling = self._app._systemManager._isPrimeUser() && self._app._systemManager.systemList.length > 1 && self._poolUseDBPool.prop("checked");

			if (self._useDbPooling) poolSize = self._app._systemManager.systemList.length;

			if (moduleIndexes.length < 2 || poolSize == 1) {
				self._runButton[0].click.call(self._runButton[0], arguments);
				return;
			}
			
			QUnitTest.count = 0;
			QUnit.init();

			self._app.getStorage().setModuleIndexesForSingleMode(moduleIndexes);

			self._globalResult = { failed: 0, passed: 0, total: 0, runtime: 0, moduleCount: 0 };
			
			self._moduleTimers = {};
			self._selectedModuleIndex = -1;
			
			var qUnit = jQuery('#punit');

			var html = '<ul id="moduleTabs"></ul><div id="moduleIFrames">';
			for (var i = 0; i < moduleIndexes.length; i++) {
				var moduleIndex = moduleIndexes[i];
				html += '<iframe id="iModule_' + moduleIndex + '" frameBorder="0" style="display:none;width: 99.9%;height:800px" ></iframe>';
			}
			html += '</div>';
			qUnit.append(html);

			self._startTime = +new Date();
			
			var moduleTabs = jQuery('#moduleTabs');
			var moduleIFrames = jQuery('#moduleIFrames');
			self._moduleTabs = {};

			moduleTabs.on('click', 'span', function () {
				var modIndex = this.id.substr(7) * 1;
				self._switchModuleTab(modIndex);
			});

			for (i = 0; i < Math.min(poolSize, moduleIndexes.length) ; i++) {
				moduleIndex = moduleIndexes[i];
				self._poolNewModule(moduleIndex, moduleIFrames, moduleTabs);
			}
			self._nextPoolingIndex = i;
			self._switchModuleTab(moduleIndexes[0]);
		});

		this._selectAllCheckbox.click(function() {
			for (var i = 0; i < self._moduleCheckboxes.length; i++) {
				self._moduleCheckboxes[i].checked = this.checked;
			}
		});

		jQuery(window).unload(function() {
			self._app.getStorage().saveAppState(self._getStartPanelPosition(), self._getSelectedModuleIndexes());
		});
	},
	
	_poolNewModule: function (moduleIndex, parent, parentTab) {
		var module = this._app.getModules()[moduleIndex];
		var tabId = 'tabMod_' + moduleIndex;
		parentTab.append('<li><span id="' + tabId + '" class="app-run-button" >' + module.label + '</span></li>');

		this._moduleTabs[moduleIndex] = $('#' + tabId);

		this._assignModuleIFrame(moduleIndex, parent);
	},
	
	_assignModuleIFrame: function (moduleIndex, parent) {
		var modName = this._app.getModuleName(moduleIndex);
		var self = this;
		setTimeout(function () {
			var ifr = jQuery('#iModule_' + moduleIndex, parent);
			
			if (self._useDbPooling) {
				var sm = self._app._systemManager.attachDb(modName);
				if (sm) {
					var urlParams = { module: modName, childstart: 1, dbsystemId: sm.id };
					if (sm.suffix) urlParams.dbsuffix = sm.suffix;
					ifr[0].src = QUnit.url(urlParams);
				}
				else {
					console.log("No room: Can't get free DB");
				}
			} else {
				ifr[0].src = QUnit.url({ module: modName, childstart: 1 });
			}
		}, 0);
	},

	_switchModuleTab: function (moduleIndex) {
		if (this._selectedModuleIndex == moduleIndex) return;
		
		if (this._selectedModuleIndex >= 0)
		{
			this._moduleTabs[this._selectedModuleIndex].css({ "background-color": "#546F9C" });
			jQuery('#iModule_' + this._selectedModuleIndex).toggle(false);
		}
		this._selectedModuleIndex = moduleIndex;
		this._moduleTabs[moduleIndex].css({ "background-color": "#849FCC" });
		jQuery('#iModule_' + moduleIndex).toggle(true);
	},

	_childCallback: function (type, details, module) {
		var modIndex, modTab, text, modName, modTests;
		var self = this;
		
		switch(type) {
			case 'moduleStart':
				modIndex = this._app.getModuleIndexByName(module);

				this._moduleTimers[modIndex] = { started: details.start };
				
				if (!this._moduleTimer) {
					this._moduleTimer = setInterval(function () {
						var key, runtime, jqText, count = 0;

						var finished = [];

						for (var idx in self._moduleTimers) {
							jqText = jQuery('#timer_' + idx, self._modulesContainer);
							
							if ("runtime" in self._moduleTimers[idx]) {
								runtime = self._moduleTimers[idx].runtime;
								finished.push(idx);
								jqText.attr('class', self._moduleTimers[idx].isFailed ? 'failtimer' : 'fintimer');
								count--;
							}
							else {
								runtime = +new Date() - self._moduleTimers[idx].started;
							}
							
							jqText.text(self._app.formatRuntime(runtime));

							count++;
						}
						for (var i = 0; i < finished.length; i++) {
							key = finished[i];
							delete self._moduleTimers[key];
						}						

						
						if (!count) setTimeout(function () {
							clearInterval(self._moduleTimer);
							self._moduleTimer = null; }, 0);
					}, 333);
				}
				break;
			case 'testStart':
				break;
			case 'log':
				break;
			case 'testDone':
				// Update (x/y) near tabName
				modIndex = this._app.getModuleIndexByName(module);
				modTab = self._moduleTabs[modIndex];
				modName = this._app.getModules()[modIndex].label;
				modTests = this._app.getModuleTests(modIndex);
				text = modName + ' (' + details.testIndex + '/' + modTests.length + ')';
				modTab.text(text);
				break;
			case 'moduleDone':
				var r = this._globalResult;

				r.failed += details.failed;
				r.passed += details.passed;
				r.total += details.total;
				r.runtime = +new Date() - this._startTime;
				r.moduleCount++;
				this._app._html.UpdateTestResult(r);
				// Update icon near tabName
				modIndex = this._app.getModuleIndexByName(module);
				modTab = self._moduleTabs[modIndex];
				modTab.text((details.failed ? "\u2716" : "\u2714") + " " + modTab.text());

				if (modIndex in this._moduleTimers) {
					this._moduleTimers[modIndex].runtime = details.runtime;
					this._moduleTimers[modIndex].isFailed = !!details.failed;
				}

				this._app._systemManager.relaseDb(module);
				
				var moduleIndexes = this._getSelectedModuleIndexes();
				if (this._nextPoolingIndex < moduleIndexes.length) {
					var moduleTabs = jQuery('#moduleTabs');
					var moduleIFrames = jQuery('#moduleIFrames');
					var moduleIndex = moduleIndexes[this._nextPoolingIndex++];

					this._poolNewModule(moduleIndex, moduleIFrames, moduleTabs);
				}
				break;
			case 'done':
				break;
			default:
				break;
		}
	},

	_initStartPanel: function() {
		var lsPos = this._app.getStorage().getStartPanelPos();
		var lsTop = lsPos && lsPos.top || 10;
		var lsLeft = lsPos && lsPos.left || 10;

		var top = Math.max(0, lsTop);

		var winHeight = jQuery(window).height() || $(document.body).height() || 0;
		var winWidth = jQuery(window).width() || $(document.body).width() || 0;

		top = Math.min(top, (winHeight - this._startPanel.height()));

		var left = Math.max(0, lsLeft);
		left = Math.min(left, (winWidth - this._startPanel.width()));

		this._startPanel.show();
		this._startPanel.css({ left: left + 'px', top: top + 'px' });
		this._startPanel.draggable({ cancel: '#modules-wrapper, #modulesPoolSize' });

		var self = this;
		this._poolUseDBPool.click(function (evt) {
			self._poolSizeInput[0].disabled = self._poolUseDBPool.prop("checked");
		});
	},

	_initModuleCheckboxes: function(moduleIndexes, checkboxes) {
		for (var i = 0; i < moduleIndexes.length; i++) {
			for (var j = 0; j < checkboxes.length; j++) {
				if (j == moduleIndexes[i]) {
					checkboxes[j].checked = true;
				}
			}
		}
	},

	_getSelectedModuleIndexes: function() {
		var selectedModules = [];
		for (var j = 0; j < this._moduleCheckboxes.length; j++) {
			var cb = this._moduleCheckboxes[j];
			if (cb != null && cb.checked) {
				selectedModules.push(j);
			}
		}
		return selectedModules;
	},

	_getStartPanelPosition: function() {
		var top = parseInt(this._startPanel.css("top"));
		var left = parseInt(this._startPanel.css("left"));
		return { 'top': top, 'left': left };
	}
};

UnitTestsApplication.HtmlHelper = function(app) {
	this._app = app;

	this._parentWin = window.parent;
	this._isRequiredCallback = QUnit.urlParams.childstart > 0 && !(this._parentWin === window || !window.frameElement || !this._parentWin.App);
	this._parentApp = this._isRequiredCallback && this._parentWin.App;

	this.ExtendQUnitEvents();
	this.RegisterQUnitEvents();
	
	this.defined = {
		setTimeout: typeof window.setTimeout !== "undefined",
		sessionStorage: (function () {
			var x = "qunit-test-string";
			try {
				sessionStorage.setItem(x, x);
				sessionStorage.removeItem(x);
				return true;
			} catch (e) {
				return false;
			}
		}())
	};
};

UnitTestsApplication.HtmlHelper.prototype = {
	ExtendQUnitEvents: function () {
		var self = this;
		
		this._modIndex = 0;
		this._modStart = null;
		this._modTestStart = null;
		this._modTestIndex = 0;
		this._modTestAsserts = { total: 0, failed: 0, passed: 0, runtime: 0 };
		this._modTestAssert = { index: 0, start: null };

		this._orgQUnitInit = QUnit.init;
		QUnit.init = function () {
			self._initHelperFired = true;
			self._orgQUnitInit.apply(this);
			self.QUnitInit(this);
			self._modIndex = 0;
			if (!!QUnit.config) {
				QUnit.config.previousModule = null; // fix for bug if restarting QUnit
			}
		};

		QUnitTest.prototype.init = function () {
			self.TestInit(this);
		};

		this._orgTestRun = QUnitTest.prototype.run;
		QUnitTest.prototype.run = function () {
			self.TestRun(this);
			self._orgTestRun.apply(this);
		};

		this._orgPushFailure = QUnit.pushFailure;
		QUnit.pushFailure = function (message, source, actual) {
			self._qUnitPushFailureParams = [message, source, actual];
			self._orgPushFailure.apply(this, arguments);
			self._qUnitPushFailureParams = null;
		};
		
		var orgQUnitModule = QUnit.module;
		QUnit.module = function (name, testEnvironment) {
			orgQUnitModule.apply(QUnit, arguments);
			var t = typeof QUnit.config.modules[name];
			if (t == "undefined" || t === "boolean") {
				jQuery.extend(testEnvironment, UnitTestsApplication.TestContext.getDefault(self._app));

				QUnit.config.modules[name] = testEnvironment;
			}
		};
		if (typeof window["module"] === "function") {
			window["module"] = QUnit.module;
		}
	},

	RegisterQUnitEvents: function () {
		var self = this;
		
		QUnit.begin(function (details) {
			self.onQUnitBegin(this, details);
		});

		QUnit.moduleStart(function (details) {
			self._modTestIndex = 0;
			details.start =
				self._modStart = +new Date();

			if (self._isRequiredCallback) {
				self._parentWin.setTimeout(function () {
					self._parentApp._ui._childCallback('moduleStart', details, QUnit.urlParams.module);
				}, 0);
			}
		});

		QUnit.testStart(function (details) {
			var moduleIndex = self._app.getModuleIndexByName(details.module);
			var testIndex = self._app.getModuleTestIndexByName(moduleIndex, details.name);

			var total = -1;
			if (testIndex > -1) {
				total = self._app.getModules()[moduleIndex].tests[testIndex].asserts;
			}
			self._modTestStart = +new Date();
			self._modTestAsserts = { total: total, failed: 0, passed: 0, runtime: 0 };
			self._modTestAssert = { index: 0, start: self._modTestStart };
		});

		// On Assertion complete
		QUnit.log(function (details) {
			self._modTestAssert.index++;

			var runtime = +new Date() - self._modTestAssert.start;

			if (!!details.result) {
				self._modTestAsserts.passed++;
			}
			else {
				self._modTestAsserts.failed++;
			}

			self._modTestAsserts.runtime += runtime;

			details.runtime = runtime;

			self.UpdateAssertState(details);

			self.UpdateTestState({
				module: details.module, test: details.name,
				failed: self._modTestAsserts.failed, passed: self._modTestAsserts.passed, total: self._modTestAsserts.total,
				runtime: self._modTestAsserts.runtime
			});

			self._modTestAssert.start = +new Date();

		});

		QUnit.testDone(function (details) {
			self._modTestIndex++;
			details.testIndex = self._modTestIndex;
			var curtime = +new Date();
			details.runtime = curtime - self._modTestStart;
			
			var fintime = curtime - self._modTestAssert.start;
			if (fintime) {
				details.fintime = fintime;
				details.setuptime = details.runtime - fintime - self._modTestAsserts.runtime;
			}

			self.onTestDone(details);

			if (self._isRequiredCallback) {
				self._parentWin.setTimeout(function () {
					self._parentApp._ui._childCallback('testDone', details, QUnit.urlParams.module);
				}, 0);
			}
		});
		
		QUnit.moduleDone(function (details) {
			details.runtime = +new Date() - self._modStart;
			details.index = self._modIndex++;
			
			if (self._isRequiredCallback) {
				self._parentWin.setTimeout(function () {
					self._parentApp._ui._childCallback('moduleDone', details, QUnit.urlParams.module);
				}, 0);
			}
		});

		QUnit.done(function (details) {
			details.moduleCount = self._modIndex;
			QUnit.stop(); // Force stop QUnit to stop spamming Done and moduleDone events

			self.UpdateTestResult(details);
		});
		
	},
	
	QUnitInit: function (self) {
		var tests, banner, result,
			qunit = jQuery("#punit");

		document.title = document.title.replace(/^[\u2714\u2716] /i, "");

		if (qunit.length) {
			var html = (this._isRequiredCallback ? '' : '<h1 id="punit-header">' + this.htmlEncode(document.title) + '</h1>') +
				"<h2 id='punit-banner'></h2>" +
				(this._isRequiredCallback ? '' : '<div id="punit-testrunner-toolbar"></div>') +
				"<ol id='punit-tests'></ol>";

			qunit.html(html);
			
			tests = jQuery("#punit-tests");
			banner = jQuery("#punit-banner");
			result = jQuery("#punit-testresult");

			if (tests.length) {
				tests.html("");
			}

			if (banner.length) {
				banner.removeClass();
			}

			if (result.length) {
				result.remove();
			}

			if (tests.length) {
				result = '<p id="punit-testresult" class="result">Running...<br/>&nbsp;</p>';
				tests.before(result);
			}
			
			if (this._isRequiredCallback) {
				jQuery('#optionsPanelTab').toggle(false);
			}
		}
		
		if (this._qUnitBeginParams) {
			this.onQUnitBegin(this._qUnitBeginParams[0], this._qUnitBeginParams[1]);
		}
	},
	
	TestInit: function (self) {
		var a, b, li,
			tests = jQuery('#punit-tests');

		if (tests.length) {
			self.id = "punit-test-output" + (self.testNumber - 1);
			
			b = '<strong>' + self.name + ' <b class=counts>(<b class=failed>0</b>, <b class=passed>0</b>, ' + self.expected + ')</b></strong>';

			a = '<a href="'
				+ QUnit.url({ testNumber: self.testNumber })
				+ '">Rerun</a>';
			
			li = '<li id="' + self.id + '" class="running">' + b + a + '</li>';

			tests.append(li);
		}
	},
	
	TestRun: function (self) {
		var running = jQuery('#punit-testresult');

		if (running.length) {
			running.html("Running: <br/>" + self.name);
		}
	},
	
	onQUnitBegin: function (pself, details) {
		var i, val, moduleFilter,
			urlConfigHtml = "",
		    numModules = 0,
			self = this;
		
		if (!this._qUnitBeginParams) { // wrong time callback, wait for Init
			this._qUnitBeginParams = [pself, details]; 
			return;
		}

		this._qUnitBeginParams = null;

		var len = QUnit.config.urlConfig.length;

		for (i = 0; i < len; i++) {
			val = QUnit.config.urlConfig[i];
			if (typeof val === "string") {
				val = {
					id: val,
					label: val,
					tooltip: "[no tooltip available]"
				};
			}
			QUnit.config[val.id] = QUnit.urlParams[val.id];
			urlConfigHtml += "<input id='qunit-urlconfig-" + val.id + "' name='" + val.id + "' type='checkbox'" + (QUnit.config[val.id] ? " checked='checked'" : "") + " title='" + val.tooltip + "'><label for='qunit-urlconfig-" + val.id + "' title='" + val.tooltip + "'>" + val.label + "</label>";
		}
		
		var banner = jQuery("#punit-header");
		if (banner.length) {
			banner.html("<a href='" + QUnit.url({ filter: "undefined", module: "undefined", testNumber: "undefined" }) + "'>" + banner.html() + "</a> ");
		}

		var toolbar = jQuery("#punit-testrunner-toolbar");
		if (toolbar.length) {
			
			var moduleFilterHtml = "<label for='punit-modulefilter'>Module: </label><select id='punit-modulefilter' name='modulefilter'><option value='' " + (QUnit.config.module === "undefined" ? "selected" : "") + ">< All Modules ></option>";
			for (i in QUnit.config.modules) {
				if (QUnit.config.modules.hasOwnProperty(i)) {
					numModules += 1;
					moduleFilterHtml += "<option value='" + encodeURIComponent(i) + "' " + (QUnit.config.module === i ? "selected" : "") + ">" + i + "</option>";
				}
			}
			moduleFilterHtml += "</select>";
		
			filter = document.createElement("input");
			filter.type = "checkbox";
			filter.id = "punit-filter-pass";

			QUnit.addEvent(filter, "click", function () {
				var tmp,
				ol = document.getElementById("punit-tests");

				if (filter.checked) {
					ol.className = ol.className + " hidepass";
				} else {
					tmp = " " + ol.className.replace(/[\n\t\r]/g, " ") + " ";
					ol.className = tmp.replace(/ hidepass /, " ");
				}
				if (self.defined.sessionStorage) {
					if (filter.checked) {
						sessionStorage.setItem("punit-filter-passed-tests", "true");
					} else {
						sessionStorage.removeItem("punit-filter-passed-tests");
					}
				}
			});
			
			if (QUnit.config.hidepassed || this.defined.sessionStorage && sessionStorage.getItem("punit-filter-passed-tests")) {
				filter.checked = true;
				jQuery('#punit-tests').addClass('hidepass');
			}
			toolbar.append(filter);
			
			toolbar.append('<label for="punit-filter-pass" title="Only show tests and assertons that fail. Stored in sessionStorage.">Hide passed tests</label>');

			var urlConfigCheckboxes = document.createElement('span');
			urlConfigCheckboxes.innerHTML = urlConfigHtml;
			QUnit.addEvent(urlConfigCheckboxes, "change", function (event) {
				var params = {};
				params[event.target.name] = event.target.checked ? true : undefined;
				window.location = QUnit.url(params);
			});
			toolbar.append(urlConfigCheckboxes);
			
			if (numModules > 1) {
				moduleFilter = document.createElement('span');
				moduleFilter.setAttribute('id', 'punit-modulefilter-container');
				moduleFilter.innerHTML = moduleFilterHtml;
				QUnit.addEvent(moduleFilter, "change", function () {
					var selectBox = moduleFilter.getElementsByTagName("select")[0],
				    selectedModule = decodeURIComponent(selectBox.options[selectBox.selectedIndex].value);

					window.location = QUnit.url({ module: (selectedModule === "") ? undefined : selectedModule });
				});
				toolbar.append(moduleFilter);
			}
		}
	},
	
	/* info: { module, name, result, message, runtime[, actual[, expected]] } */
	UpdateAssertState: function (info) {
		var $li, ol, $ol,
		    tests = document.getElementById("punit-tests");

		if (tests) {
			$li = jQuery('#' + QUnit.config.current.id);

			$ol = $li.children('ol');

			if (!$ol.length) {
				ol = document.createElement("ol");
				ol.className = 'punit-assert-list';
				ol.style.display = "none";
				$li[0].appendChild(ol);

				$ol = jQuery(ol);
				
				jQuery($li[0].firstChild).bind("click", function () {
					$ol.toggle();
				});
			}

			if (this._qUnitPushFailureParams) {
				info.isError = true;
				if (this._qUnitPushFailureParams.length > 2 && this._qUnitPushFailureParams[2]) {
					info.actual = this._qUnitPushFailureParams[2];
				}
			}

			var message = this.markupMessage(info);

			$ol.append('<li class="' + (info.result ? "pass" : "fail") + '">' + message + '<span class="runtime">' + this._app.formatRuntime(info.runtime) + '</span></li>');
		}
	},

	/* info: { module, test, failed, passed, total, runtime } */
	UpdateTestState: function (info) {
		var tests = document.getElementById("punit-tests");

		if (tests) {
			var $test = jQuery('#' + QUnit.config.current.id);

			var $strong = $test.children('strong');
			var $b = $strong.children('b.counts').children('b');

			if (!$b.length) {
				$strong.append('<b class=counts>(<b class=failed>' + info.failed + '</b>, <b class=passed>' + info.passed + '</b>, ' + info.total + ')</b>');
			}
			else {
				$b[0].innerHTML = info.failed;
				$b[1].innerHTML = info.passed;
			}

			var $spanrun = $test.children('span.runtime');
			var truntime = this._app.formatRuntime(info.runtime);
			if (!$spanrun.length) {
				$test.children('a').after('<span class="runtime">' + truntime + '</span>');
			} else {
				$spanrun.text(truntime);
			}
		}
	},

	onTestDone: function (info) {
		if (!QUnit.config.current) return;
		
		var $li, tests = document.getElementById("punit-tests");

		if (tests) {
			$li = jQuery('#' + QUnit.config.current.id);
			
			$li.attr('class', info.failed ? 'fail' : 'pass');
			
			var $ol = $li.children('ol');
			if ($ol.length) {
				if (info.fintime) {
					var oli = '<li class="maintenance"><span class="test-message">Maintenance script: teardown and finish</span>'
						+ '<span class="runtime">' + this._app.formatRuntime(info.fintime) + '</span>';
					$ol.append(oli);
					if (info.setuptime) {
						oli = '<li class="maintenance"><span class="test-message">Maintenance script: setup</span>'
							+ '<span class="runtime">' + this._app.formatRuntime(info.setuptime) + '</span>';
						$ol.prepend(oli);
					}
					
					var $spanrun = $li.children('span.runtime');
					if ($spanrun.length) {
						$spanrun.text(this._app.formatRuntime(info.runtime));
					} 
				}

				/*jQuery($li[0].firstChild).bind("click", function () {
					$ol.toggle();
				});*/
				if (info.failed) {
					$ol.toggle(true);
				}
			}
		}
	},
	
	UpdateTestResult: function (info) {
		var selectedCount = this._app.getSelectedModuleCount();
		var tests = jQuery("#punit-tests");

		if (tests.length) {
			var html = [
				"Module(s) (",
				info.moduleCount,
				"/",
				selectedCount,
				") completed in ",
				this._app.formatRuntime(info.runtime, " minute(s) "),
				" second(s).<br/>",
				"<span class='passed'>",
				info.passed,
				"</span> assertion(s) of <span class='total'>",
				info.total,
				"</span> passed, <span class='failed'>",
				info.failed,
				"</span> failed."
			].join("");


			document.getElementById("punit-testresult").innerHTML = html;
		}

		var banner = jQuery("#punit-banner");
		
		if (banner.length) {
			banner.attr('class', info.failed ? 'punit-fail' : 'punit-pass');
		}
		
		if (QUnit.config.altertitle && typeof document !== "undefined" && document.title) {
			// show ✖ for good, ✔ for bad suite result in title
			// use escape sequences in case file gets loaded with non-utf-8-charset
			document.title = [
				(info.failed ? "\u2716" : "\u2714"),
				document.title.replace(/^[\u2714\u2716] /i, "")
			].join(" ");
		}
		
		var header = jQuery("#punit-header");
		if (header.length) {
			header.html(this.htmlEncode(document.title));
		}
	},

	markupMessage: function (info) {
		var message = this.htmlEncode(info.message) || (info.isError ? "error" : info.result ? "okay" : "failed");
		message = "<span class='test-message'>" + message + "</span>";

		if (!info.result) {
			if (typeof info.expected == "undefined") {
				if (info.actual || info.source) {
					message += "<table>";

					if (info.actual) {
						message += "<tr class='test-actual'><th>Result: </th><td><pre>" + this.htmlEncode(info.actual) + "</pre></td></tr>";
					}

					if (info.source) {
						message += "<tr class='test-source'><th>Source: </th><td><pre>" + this.htmlEncode(info.source) + "</pre></td></tr>";
					}
					message += "</table>";
				}
			} else {

				var expected = this.htmlEncode(QUnit.jsDump.parse(info.expected));
				var actual = this.htmlEncode(QUnit.jsDump.parse(info.actual));
				message += "<table><tr class='test-expected'><th>Expected: </th><td><pre>" + expected + "</pre></td></tr>";

				if (actual != expected) {
					message += "<tr class='test-actual'><th>Result: </th><td><pre>" + actual + "</pre></td></tr>";
					message += "<tr class='test-diff'><th>Diff: </th><td><pre>" + QUnit.diff(expected, actual) + "</pre></td></tr>";
				}

				if (info.source) {
					message += "<tr class='test-source'><th>Source: </th><td><pre>" + this.htmlEncode(info.source) + "</pre></td></tr>";
				}

				message += "</table>";
			}
		}
		return message;
	},

	htmlEncode: function (html) {
		return document.createElement('a').appendChild(document.createTextNode(html)).parentNode.innerHTML;
	},
	
	_qUnitBeginParams: null,
	_qUnitPushFailureParams: null
};

UnitTestsApplication.SystemManager = function (app, callback) {
	this._app = app;
	app._systemManager = this;
	
	var self = this;
	
	var sysManager = this._getParentManager();
	var i, s, homeSysId, curSysId, n;
	
	if (sysManager) {
		for (i = 0; i < sysManager.systemList.length; i++) {
			this.systemList.push(jQuery.extend(true, { }, sysManager.systemList[i]));
		}
		this.homeSystem = jQuery.extend(true, {}, sysManager.homeSystem);
		this.currentSystem = this.getSystemById(sysManager.currentSystem.id);
	}
	else {
		var envSystem = this._getEnvianceSystem();

		if (envSystem) {
			homeSysId = envSystem.get_Home().get_ID();
			curSysId = envSystem.get_Current().get_ID();

			for (i = 0; i < envSystem._systems.length; i++) {
				var sys = envSystem._systems[i];
				n = sys.get_Name();
				s = { id: sys.get_ID(), name: n, suffix: n.substr(this._originalSystemName.length) };

				if (s.id == homeSysId) {
					this.homeSystem = s;
				} else {
					this.systemList.push(s);
				}
				if (s.id == curSysId)
					this.currentSystem = s;
			}
		}
	}
	
	if (!this.systemList.length) {
		envianceSdk.authentication.getCurrentSession(function (response) {
			var sysList = response.result.systems;
			curSysId = response.result.currentSystemId;

			for (var id in sysList) {
				n = sysList[id];
				s = { id: id, name: n, suffix: n.substr(self._originalSystemName.length) };
				
				if (!self.homeSystem && n.slice(0, self._originalSystemName.length) != self._originalSystemName) {
					s.suffix = "";
					self.homeSystem = s;
				} else {
					self.systemList.push(s);
				}

				if (id == curSysId) {
					self.currentSystem = s;
				} 
			}
		}).always(function () {
			self._detectUser(callback);
		});
	}
	else self._detectUser(callback);
};

UnitTestsApplication.SystemManager.prototype = {
	_systemUser: "jstestsAccessUser", // jstestsNotAccessUser
	_userPassword: "1111",
	_originalSystemName: "System for Tool (Home)",
	systemList: [],
	homeSystem: null,
	currentSystem: null,
	user: {
		login: null,
		id: "",
		suffix: ""
	},
	_detectUser: function (callback) {
		var self = this;

		var sysManager = this._getParentManager();
		if (sysManager) {
			this.user = jQuery.extend(true, {}, sysManager.user);
		}

		if (!this.user.login && this.homeSystem) {
			if (this.homeSystem != this.currentSystem) {
				envianceSdk.setSystemId(this.homeSystem.id);
			}			

			envianceSdk.eql.execute("select u.Login, u.id from user u where u.id=GetCurrentUser()", 1, 10,
				function(response) {
					self.user.login = response.result[0].rows[0].values[0];
					self.user.id = response.result[0].rows[0].values[1] || envianceSdk.getUserId();
				}).always(function () {
					envianceSdk.setSystemId(self.currentSystem.id);
					self.user.login = self.user.login || "";
					self.user.suffix = self.user.login.slice(self._systemUser.length);

					if (callback && typeof callback === "function") callback();
				});
		}
		else if (callback && typeof callback === "function") callback();
	},
	_init: function (callback) {
		var self = this;
		if (this._app._isDbParallel()) {
			QUnit.moduleStart(function (info) {
				self.setSystem(QUnit.urlParams.dbsystemId);
			});
		}
		else {
			if (this._isUserCanRunDBTests()) {
				var suffix = this.user.suffix || QUnit.urlParams.dbsuffix;
				if (suffix && !this._isPrimeUser()) {
					this.setSystem(null, suffix);
				}
			}
		}

		if (callback) callback();
	},
	
	_isPrimeUser: function () {
		return this._systemUser.toLowerCase() == this.user.login.toLowerCase();
	},
	_isUserCanRunDBTests: function () {
		return this._isPrimeUser() || this.user.suffix && this.getSystemBySuffix(this.user.suffix);
	},
	_getParentManager: function () {
		var parentWin = window.parent !== window && window.parent;
		var topWin = window.top !== window && window.top !== window.parent && window.top;

		return parentWin && parentWin.App && parentWin.App._systemManager || topWin && topWin.App && topWin.App._systemManager;
	},
	_getEnvianceSystem: function () {
		var parentWin = window.parent !== window && window.parent;
		var topWin = window.top !== window && window.top !== window.parent && window.top;
		return parentWin && parentWin.Enviance && parentWin.Enviance.Session && parentWin.Enviance.Session.System || topWin && topWin.Enviance && topWin.Enviance.Session && topWin.Enviance.Session.System;
	},
	getSystemById: function (id) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].id == id) return this.systemList[i];
		}
		return null;
	},
	getSystemBySuffix: function (suffix) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].suffix == suffix) return this.systemList[i];
		}
		return null;
	},
	setSystem: function (id, suffix) {
		var sys = null;
		if (id) {
			sys = this.getSystemById(id);
		}
		if (!sys && suffix) {
			sys = this.getSystemBySuffix(suffix);
		}
		if(sys) {
			if (sys != this.currentSystem) {
				this.currentSystem = sys;
				envianceSdk.setSystemId(sys.id);

				/*var envSys = this._getEnvianceSystem();
				if (envSys) {
					envSys.set_Current(envSys.getSystemById(sys.id));
				}*/
			}
			if(!this._isPrimeUser())
				QUnit.urlParams.dbsuffix = suffix;
		}
	},
	attachDb: function (modName) {
		for (var i = 0; i < this.systemList.length; i++) {
			var s = this.systemList[i];
			if (!s.modName) {
				s.modName = modName;
				return s;
			}
		}
		return null;
	},
	relaseDb: function (modName) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].modName == modName) {
				this.systemList[i].modName = null;
			}
		}
	},
	relaseAllDb: function () {
		for (var i = 0; i < this.systemList.length; i++) {
			this.systemList[i].modName = null;
		}
	}
};

UnitTestsApplication.modules = [];
UnitTestsApplication.registerModule = function(module) {
	UnitTestsApplication.modules.push(module);
};
var App = null;
$(document).ready(function() {
	App = new UnitTestsApplication();
});
