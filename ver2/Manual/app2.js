// Jalapeño edition
//(v) TO DO: call envianceSdk.packages.init
// TO DO: GUI options
//	* Display maintanence checkbox - before start
//	* Hide passed tests (Display failed only) - after start
// TO DO: Checkboxes for tests to select 
// TO DO: $('#selectAllCheckbox')[0].indeterminate = true for non full selection

/*
<ul>
  <li>
    <input type="checkbox" name="tall" id="tall">
    <label for="tall">Tall Things</label>

    <ul>
      <li>
        <input type="checkbox" name="tall-1" id="tall-1">
        <label for="tall-1">Buildings</label>
      </li>
      <li>
        <input type="checkbox" name="tall-2" id="tall-2">
        <label for="tall-2">Giants</label>

        <ul>
          <li>
            <input type="checkbox" name="tall-2-1" id="tall-2-1">
            <label for="tall-2-1">Andre</label>
          </li>
          <li>
            <input type="checkbox" name="tall-2-2" id="tall-2-2">
            <label for="tall-2-2">Paul Bunyan</label>
          </li>
        </ul>
      </li>
      <li>
        <input type="checkbox" name="tall-3" id="tall-3">
        <label for="tall-3">Two sandwiches</label>
      </li>
    </ul>
  </li>
  <li>
    <input type="checkbox" name="short" id="short">
    <label for="short">Short Things</label>

    <ul>
      <li>
        <input type="checkbox" name="short-1" id="short-1">
        <label for="short-1">Smurfs</label>
      </li>
      <li>
        <input type="checkbox" name="short-2" id="short-2">
        <label for="short-2">Mushrooms</label>
      </li>
      <li>
        <input type="checkbox" name="short-3" id="short-3">
        <label for="short-3">One Sandwich</label>
      </li>
    </ul>
  </li>
</ul>


$('input[type="checkbox"]').change(function(e) {

  var checked = $(this).prop("checked"),
      container = $(this).parent(),
      siblings = container.siblings();

  container.find('input[type="checkbox"]').prop({
    indeterminate: false,
    checked: checked
  });

  function checkSiblings(el) {

    var parent = el.parent().parent(),
        all = true;

    el.siblings().each(function() {
      return all = ($(this).children('input[type="checkbox"]').prop("checked") === checked);
    });

    if (all && checked) {

      parent.children('input[type="checkbox"]').prop({
        indeterminate: false,
        checked: checked
      });

      checkSiblings(parent);

    } else if (all && !checked) {

      parent.children('input[type="checkbox"]').prop("checked", checked);
      parent.children('input[type="checkbox"]').prop("indeterminate", (parent.find('input[type="checkbox"]:checked').length > 0));
      checkSiblings(parent);

    } else {

      el.parents("li").children('input[type="checkbox"]').prop({
        indeterminate: true,
        checked: false
      });

    }

  }

  checkSiblings(container);
});

*/

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
			self.systemManager = new UnitTestsApplication.SystemManager(self);
			
			self.configureEnvironment()
				.fail(function(){
					jsLog.Warn("Can't configure environment!");
				})
				.always(function(){
					jsLog.WriteLn( "UnitTestsApplication: initialization is finished" );
					jsLog.WriteLn( "SystemManager: initialization ..." );
					
					self.systemManager.loadSystemInfos()
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
	}
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
	_modules: [],
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
	_init: function () {
		var self = this;
		var dfdInit = jQuery.Deferred();
		
		this.GetBuildNumber();
		this.$userAgent.html(navigator.userAgent);
		
		var opts = this._restoreSdkOptions();
		if (opts) {
			try {
				this.sdkOptions = JSON.parse(opts);
			} catch (e) {} 
		}
		
		$.getScript( "appConfig.js" )
		.fail(function( jqxhr, settings, exception ) {
			var errorMessage = self.helper.formatErrorResponse(jqxhr, settings, exception);
			jsLog.Error( "Can't load appConfig.js: " + errorMessage );
			
			dfdInit.reject();
		})
		.done(function( obj ) {
			//jsLog.WriteLn( "Script loaded: appConfig.js" );
			self.config = getAppConfig();
			self.sdkOptions = $.extend(self.config.options.init, self.sdkOptions);
			
			var id = 1;
			for(var caption in self.config.moduleDefs){
				var m = self.config.moduleDefs[caption];
				m.caption = caption;
				m.id = id++;
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
	sdkOptions: {},
	configOptions: {},
	
	configureEnvironment: function(){
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
		var self = this;
		this.configOptions = $.extend( { refreshPageOnUnauthorized: false }, this.config.options.config );
		
		//envianceSdk.packages.packageWebPath = "/CustomApp/8ebdc552-bf1b-4744-8ac7-a8e7c571095c/";
		return envianceSdk.packages.init(this.sdkOptions, function () {	envianceSdk.configure(self.configOptions); });
	},
	
	getModules: function() {
		return this._modules;
	},
	
	getModuleById: function(id) {
		for (var i = 0; i < this._modules.length; i++) {
			var m = this._modules[i];
			if (m.id == id) return m;
		}
		return null;
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

var App = null;
$(document).ready(function() {
	App = new UnitTestsApplication();
});
