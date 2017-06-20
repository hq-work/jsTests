(function( global ) {

function qutRunnerApp() {
	var self = this;
	//jsLog.WriteLn( "Initialization ..." );
	
	//this.$title = $('#app-header a');
	//this.$userAgent = $('#app-userAgent');
	//this.$banner = $('#app-banner');
	
	this.helper = UnitTestsApplication.Helper;
	this.storage = this.helper.getStorage();
	
	//this._modules = [];
	
	if(!this._init()) return;
	
	this.configureEnvironment()
		.fail(function(){
			self.messageToParent("Warning", { message: "Can't configure runner environment!" }, system.id );
		})
		.always(function(){
		
		});
	
	/*this._init()
		.done(function(){
			self.ui = new UnitTestsApplication.UI(self);
			self.systemManager = new UnitTestsApplication.SystemManager(self);
			
			self.configureEnvironment()
				.fail(function(){
					jsLog.Warn("Can't configure environment!");
				})
				.always(function(){
					jsLog.WriteLn( "UnitTestsApplication: initialization is finished" );
					jsLog.WriteLn( "SystemManager: initialization ..." );
					
					self.systemManager.initSystems()
						.done(function(){
							__logSystems();
							self.ui.activateControls();
							jsLog.WriteLn( "SystemManager: initialization is finished" );
						})
						.fail(function(msg){
							if(msg)jsLog.Warn( msg );
							jsLog.Error( "SystemManager: initialization is failed!" );
						});
				});
		})
	
	
	function __logSystems(){
		var txt = "Found " + self.systemManager.systemList.length +" system(s) ";
		
		if(self.systemManager.systemList.length)
			jsLog.WriteLn(txt);
		else
			jsLog.Error(txt);
			
		for(var i=0; i < self.systemManager.systemList.length; i++){
			var s = self.systemManager.systemList[i];
			jsLog.WriteLn("System/user: {" + s.name+"|"+ s.user.login + "}");
		}
		jsLog.WriteLn("Active system/user: {" + self.systemManager.currentSystem.name+"|"+ self.systemManager.user.login + "}");
	}*/
	/*
	// this._registerQUnitBegin();
	//? this._modules = UnitTestsApplication.modules;
	
	this._html = null;
	//this._ui = null;
	
	//envianceSdk.configure({ resubmitConfirmationOnError: false });
	
	this._systemManager = new UnitTestsApplication.SystemManager(this, function () {
	

	
	});*/
};

qutRunnerApp.prototype = {
	parentWindow: window.parent !== window && window.parent,
	system: null,
	
	_init: function () {
		if(!this.parentWindow || !this.getApp()){
			jQuery('.err-req-parent').show();
			return false;
		}
		
		// TO DO:
		// get System data
		
		
		
		return true;
	},
	
	
	configureEnvironment: function(){
		var options = this.getAppOptions();
		
		return envianceSdk.packages.init(options.sdk, function () {	envianceSdk.configure(options.config); });
	},
	
	
	
	getApp: function(){
		return parentWindow.App;
	},
	
	getAppOptions: function(){
		var app = this.getApp();
		return { sdk: app.sdkOptions, config: app.configOptions };
	},
	
	/* msgType, params, obj */
	messageToParent: function(){
		var self = this;
		var args = arguments;
		this.parentWindow.setTimeout(function () {
			self.parentWindow.ui.childCallback.apply(self.parentWindow.ui, args);
		}, 0);
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

if(typeof UnitTestsApplication == 'undefined'){
	global['UnitTestsApplication'] = {};
}

qutRunnerApp.modules = [];
UnitTestsApplication.registerModule = function(module) {
	qutRunnerApp.modules.push(module);
};

$(document).ready(function() {
	new qutRunnerApp();
});


}( (function() {return this;})() ));
