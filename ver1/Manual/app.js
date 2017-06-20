QUnit.config.reorder = false;
QUnit.config.autostart = false;

var UnitTestsApplication = function() {
	this._modules = UnitTestsApplication.modules;
	this._storage = new UnitTestsApplication.Storage();
	this._ui = null;
	this._init();
};

UnitTestsApplication.prototype = {
	_init: function() {
		if (this._isSingleTestMode()) {
			this.run(this._storage.getModuleIndexesForSingleMode());
		} else {
			this._ui = new UnitTestsApplication.Ui(this);
		}
	},

	run: function(moduleIndexes) {
		QUnit.init();
		QUnit.start();
		this._attachModules(moduleIndexes);
	},

	getModules: function() {
		return this._modules;
	},

	getStorage: function() {
		return this._storage;
	},

	_attachModules: function(moduleIndexes) {
		for (var i = 0; i < this._modules.length; i++) {
			for (var j = 0; j < moduleIndexes.length; j++) {
				if (moduleIndexes[j] == i) {
					this._executeModule(this._modules[i]);
				}
			}
		}
	},

	_executeModule: function(module) {
		module.execute();
	},

	_isSingleTestMode: function() {
		return window.location.search.toString().toLowerCase().indexOf('testnumber=') > -1;
	}
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
	_START_PANEL_POS_KEY: 'UTApp_StartPanelPos'
};

UnitTestsApplication.Ui = function(app) {
	this._app = app;
	this._moduleCheckboxes = [];
	this._startPanel = null;
	this._modulesContainer = null;
	this._runButton = null;
	this._selectAllCheckbox = null;
	this._init();
};
UnitTestsApplication.Ui.prototype = {
	_init: function() {
		this._renderStartPanel();
		this._bind();
	},

	_renderStartPanel: function() {
		var modules = this._app.getModules();
		var html = '<div id="startPanel" class="app-start-panel" style="display: none;">'
			+ '<div class="app-start-panel-header">'
			+ '<input id="selectAllCheckbox" type="checkbox" /> Modules:'
			+ '</div>'
			+ '<ul id="modulesContainer" class="app-modules">';
		for (var i = 0; i < modules.length; i++) {
			html += '<li><input id="cb_' + i + '" type="checkbox" /> ' + modules[i].label + '</li>';
		}
		html += '</ul>'
			+ '<div class="app-buttons">'
			+ '<input id="runButton" type="button" value="Run" class="app-run-button" />'
			+ '</div>'
			+ '</div>';

		jQuery('body').append(html);
		this._startPanel = jQuery('#startPanel');
		this._modulesContainer = jQuery('#modulesContainer');
		this._runButton = jQuery('#runButton');
		this._selectAllCheckbox = jQuery('#selectAllCheckbox');
		this._moduleCheckboxes = jQuery('input', this._modulesContainer).toArray();

		this._initModuleCheckboxes(this._app.getStorage().getModuleIndexesForBulkMode(), this._moduleCheckboxes);
		this._initStartPanel();
	},

	_bind: function() {
		var self = this;
		this._runButton.click(function() {
			var moduleIndexes = self._getSelectedModuleIndexes();
			QUnit.config.resetTestNumber();
			self._app.run(moduleIndexes);
			self._app.getStorage().setModuleIndexesForSingleMode(moduleIndexes);
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

	_initStartPanel: function() {
		var lsPos = this._app.getStorage().getStartPanelPos();
		var lsTop = lsPos == null ? 10 : lsPos.top;
		var lsLeft = lsPos == null ? 10 : lsPos.left;

		var top = Math.max(0, lsTop);
		top = Math.min(top, (jQuery(window).height() - this._startPanel.height()));

		var left = Math.max(0, lsLeft);
		left = Math.min(left, (jQuery(window).width() - this._startPanel.width()));

		this._startPanel.show();
		this._startPanel.css({ left: left + 'px', top: top + 'px' });
		this._startPanel.draggable();
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

UnitTestsApplication.modules = [];
UnitTestsApplication.registerModule = function(module) {
	UnitTestsApplication.modules.push(module);
};

$(document).ready(function() {
	var app = new UnitTestsApplication();
});