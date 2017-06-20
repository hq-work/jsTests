// TO DO: call envianceSdk.packages.init
// TO DO: GUI options
//	* Display maintanence checkbox - before start
//	* Hide passed tests (Display failed only) - after start
// TO DO: Checkboxes for tests to select 

function UnitTestsApplication() {
	var self = this;
	jsLog.WriteLn( "Initialization ..." );
	
	this.$title = $('#app-header a');
	this.$userAgent = $('#app-userAgent');
	this.$banner = $('#app-banner');
	
	this.helper = UnitTestsApplication.Helper;
	this.storage = this.helper.getStorage();
	
	this._modules = [];
	
	this._init()
		.done(function(){
			self.ui = new UnitTestsApplication.UI(self);
			this.systemManager = new UnitTestsApplication.SystemManager(self);
			
			/*
		// call it for every separated testframe
		envianceSdk.packages.init(SdkOptions, function() {
				envianceSdk.configure({
					refreshPageOnUnauthorized: false
				})
				.fail(function( jqxhr, settings, exception ) {
					var errorMessage = this.helper.formatErrorResponse(jqxhr, settings, exception);
					jsLog.Error( "envianceSdk.packages.init Error: " + errorMessage );
				})
				.done(function( script, textStatus ) {
					// continue
				});
			});*/
			
			jsLog.WriteLn( "UnitTestsApplication: initialization is finished" );
			jsLog.WriteLn( "SystemManager: initialization ..." );
			
			self.systemManager.initSystems()
				.done(function(){
					self.ui.activateControls();
					jsLog.WriteLn( "SystemManager: initialization is finished" );
				})
				.fail(function(msg){
					if(msg)jsLog.Warn( msg );
					jsLog.Error( "SystemManager: initialization is failed!" );
				});
		})
	
	/*
	// this._registerQUnitBegin();
	//? this._modules = UnitTestsApplication.modules;
	
	this._html = null;
	//this._ui = null;
	
	//envianceSdk.configure({ resubmitConfirmationOnError: false });
	
	this._systemManager = new UnitTestsApplication.SystemManager(this, function () {
	

	
	});*/
};

UnitTestsApplication.prototype = {
	GetBuildNumber: function() {
		var self = this;
		
		return $.ajax({
			url: 'buildnumber.txt',
			dataType: "text",
			async: true,
			success: function (response) {
				document.title = document.title + " (" + response + ")";
				
				self.$title.html(self.helper.htmlEncode(document.title));
			},
			error: function (xhr, status, msg) {
				jsLog.Warn('The buildnumber.txt loading error. ' + msg + '. Status: ' + status);
			}
		});
	},
	_init: function (callback) {
		var self = this;
		var dfdInit = jQuery.Deferred();
		
		this.GetBuildNumber();
		this.$userAgent.html(navigator.userAgent);
		
		var item = self._restoreSdkOptions();
		if (item) {
			try {
				self.SdkOptions = JSON.parse(item);
			} catch (e) {} 
		}
		
		$.getScript( "appConfig.js" )
		.fail(function( jqxhr, settings, exception ) {
			var errorMessage = self.helper.formatErrorResponse(jqxhr, settings, exception);
			jsLog.Error( "Can't load appConfig.json: " + errorMessage );
			
			dfdInit.reject();
		})
		.done(function( obj ) {
			//jsLog.WriteLn( "Script loaded: appConfig.js" );
			self.config = getAppConfig();
			
			for(var caption in self.config.moduleDefs){
				var m = self.config.moduleDefs[caption];
				m.caption = caption;
				
				self._modules.push(m);
			}
			
			dfdInit.resolve(); // if(callback) callback();
		});
		
		
		/*this._html = new UnitTestsApplication.HtmlHelper(this);
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
		*/
		return dfdInit;
	},
	SdkOptions: {},
	
	getModules: function() {
		return this._modules;
	},
	
	
	/*_registerQUnitBegin: function () {
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

	*/
	_saveSdkOptions: function(value) {
		if (value == null || value == '') {
			this.storage.ls.removeItem(this._OPTIONS_PANEL_KEY);
		} else {
			this.storage.ls.setItem(this._OPTIONS_PANEL_KEY, value);
		}
	},
	_restoreSdkOptions: function() {
		return this.storage.ls.getItem(this._OPTIONS_PANEL_KEY);
	},
	_OPTIONS_PANEL_KEY: 'UTApp_SdkOptions'
};

UnitTestsApplication.modules = [];
UnitTestsApplication.registerModule = function(module) {
	UnitTestsApplication.modules.push(module);
};
var App = null;
$(document).ready(function() {
	App = new UnitTestsApplication();
});
