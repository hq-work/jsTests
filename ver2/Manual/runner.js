QUnit.config.reorder = false;
QUnit.config.autostart = false;

// TO DO:
/* some internal hack for custom options for comparer
	QUnit.extend(QUnit.config, {
		ignoreArrayElementOrder: true,
		ignoreObjectPrototype: true
	});
	
	first item w/o number
	ol li:first-child { list-style:none }
*/

(function( global ) {

	function id( name ) {
		return document.getElementById( name );
	}
	
	function getNameHtml( name, module ) {
		var nameHtml = "";

		if ( module ) {
			nameHtml = "<span class='module-name'>" + escapeText( module ) + "</span>: ";
		}

		nameHtml += "<span class='test-name'>" + escapeText( name ) + "</span>";

		return nameHtml;
	}
	
	function escapeText( s ) {
		if ( !s ) {
			return "";
		}
		s = s + "";

		// Both single quotes and double quotes (for attributes)
		return s.replace( /['"<>&]/g, function( s ) {
			switch ( s ) {
			case "'":
				return "&#039;";
			case "\"":
				return "&quot;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			}
		} );
	}
	
	function qutRunnerApp() {
		var self = this;
		
		this.helper = UnitTestsApplication.Helper;
		this.storage = this.helper.getStorage();
		
		envianceSdk.configure({ resubmitConfirmationOnError: false });
		
		if(!this._init()) return;
		
		this.configureEnvironment()
			.fail(function(){
				self.messageToParent("Warning", { message: "Can't configure runner environment!" }, system.id );
			})
			.always(function(){
				self.registerQUnitEvents();
				// TO DO:
				// this.ExtendQUnitEvents(); 
				// or another etic way to not change original QUnit code
				//
				// (v) detach some qUnit HTML helper events: deleted useless divs in onBegin event
				// for example QUnit.begin to prevent call of appendInterface
				// redefine QUnit.init if it is called somewhere to prevent call of appendInterface
				
				
				self.loadTestModules()
					.always(function(){
						// TO DO: 
						// (v) switch system: inside moduleBegin
						
						// continue run
						
						// TO DO: when ready
						//QUnitTest.count = 0; <-- not required
						//QUnit.init(); <-- deprecated, do not use that shit!!!
						self.attachModules();
						
						//var c = QUnit.config;
						QUnit.start();
					});
			});
	};

	qutRunnerApp.prototype = {
		parentWindow: window.parent !== window && window.parent,
		system: null,
		urlParams: null,
		
		_init: function () {
			if(!this.parentWindow || !this.getApp()){
				jQuery('.err-req-parent').show();
				return false;
			}
			
			this.urlParams = this.getUrlParams();
			this.system = this.getApp().systemManager.getSystemById(this.urlParams.sid);
			
			if(!this.system){
				this.messageToParent("Error", { message: "System not found!" }, this.urlParams.sid );
				return false;
			}
			
			$('.system-info').html("Running on system '" + this.system.name + "' with user '" + this.system.user.login + "'"); 
			
			if(!this.system.moduleIds || !this.system.moduleIds.length){
				this.messageToParent("Error", { message: "There are no modules associated with System" }, this.system.id );
				return false;
			}
			
			for(var i=0; i<this.system.moduleIds.length; i++){
				var id = this.system.moduleIds[i];
				var m = this.getApp().getModuleById(id);
				if(!m){
					self.messageToParent("Warning", { message: "Can't find test module linked to system: " + id }, this.system.id );
				}
				qutRunnerApp.modules.push(m);
			}

			return true;
		},
		
		getUrlParams: function(){
			var i,
			location = window.location || { search: "", protocol: "file:" },
			params = location.search.slice( 1 ).split( "&" ),
			length = params.length,
			urlParams = {},
			current;

			if ( params[ 0 ] ) {
				for ( i = 0; i < length; i++ ) {
					current = params[ i ].split( "=" );
					current[ 0 ] = decodeURIComponent( current[ 0 ] );
					current[ 1 ] = current[ 1 ] ? decodeURIComponent( current[ 1 ] ) : true;
					urlParams[ current[ 0 ] ] = current[ 1 ];
				}
			}
			return urlParams;
		},
		
		getApp: function(){
			return this.parentWindow.App;
		},
		
		getAppOptions: function(){
			var app = this.getApp();
			return { sdk: app.sdkOptions, config: app.configOptions };
		},
		
		configureEnvironment: function(){
			var options = this.getAppOptions();
			
			return envianceSdk.packages.init(options.sdk, function () {	envianceSdk.configure(options.config); });
		},
		
		/* msgType, params, obj */
		messageToParent: function(){
			var self = this;
			var args = arguments;
			this.parentWindow.setTimeout(function () {
				self.getApp().ui.runnerCallback.apply(self.getApp().ui, args);
			}, 0);
		},
		
		requestToApp: function(func, params, meta){
			var dfdParent = $.Deferred();
			var self = this;
			
			this.parentWindow.setTimeout(function () {
				var res = func.apply(self.getApp(), params);
				dfdParent.resolve(res, meta);
			}, 0);
			
			return dfdParent.promise();
		}
		
		loadTestModules: function(){
			var dfdMLoad = $.Deferred();
			
			var promises = [];
			for(var i=0; i<qutRunnerApp.modules.length; i++){
				var m = qutRunnerApp.modules[i];
				promises.push($.getScript( m.path));
			}
			
			$.when.apply($, promises).done(function () {
				dfdMLoad.resolve(arguments);
			}, function(){
				// TO DO:
				//	report some module is not loaded
			});
			
			return dfdMLoad.promise();
		},

		registerQUnitEvents: function(){
			var self = this;
			
			// !!! just test QUnit overriding: replace QUnit reporters
				var cbs = QUnit.config.callbacks;
				var qUnitReporterTestStart = cbs.testStart.pop();
				
				QUnit.testStart(function( details ) {
					var running, testBlock, bad;

					testBlock = id( "qunit-test-output-" + details.testId );
					if ( testBlock ) {
						testBlock.className = "running";
					} else {

						// Report later registered tests
						appendTest( details.name, details.testId, details.module );
					}

					running = id( "qunit-testresult" );
					if ( running ) {
						bad = QUnit.config.reorder && defined.sessionStorage &&
							+self.storage.getItem( "qunit-test-" + details.module + "-" + details.name );

						running.innerHTML = ( bad ?
							"Rerunning previously failed test: <br />" :
							"Running: <br />" ) +
							getNameHtml( details.name, details.module );
					}

				});
			
			// TO DO: register messaging of progress
			QUnit.begin(function (details) {
				$('#qunit-header,#qunit-testrunner-toolbar,#qunit-userAgent').remove();
				details.qUnitVersion = QUnit.version;
				
				//self.onQUnitBegin(this, details);
				
				
				
				
				self.messageToParent('begin', details, self.system.id);
			});

			QUnit.moduleStart(function (details) {
				self.setSystem(self.system.id)
				
				var usefulDefs = UnitTestsApplication.Helper.getDefault(self.getApp());
				var testEnvironment = QUnit.config.currentModule.testEnvironment;
				jQuery.extend(testEnvironment, usefulDefs);
				
				//self._modTestIndex = 0;
				//details.start =	self._modStart = +new Date();

				self.messageToParent('moduleStart', details, self.system.id);
			});
			
			QUnit.testStart(function (details) {
				//var moduleIndex = self._app.getModuleIndexByName(details.module);
				//var testIndex = self._app.getModuleTestIndexByName(moduleIndex, details.name);

				/*var total = -1;
				if (testIndex > -1) {
					total = self._app.getModules()[moduleIndex].tests[testIndex].asserts;
				}
				self._modTestStart = +new Date();
				self._modTestAsserts = { total: total, failed: 0, passed: 0, runtime: 0 };
				self._modTestAssert = { index: 0, start: self._modTestStart };*/
				
				self.messageToParent('testStart', details, self.system.id);
			});
			

			// On Assertion complete
			QUnit.log(function (details) {
				/*self._modTestAssert.index++;

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

				self._modTestAssert.start = +new Date();*/
				self.messageToParent('log', details, self.system.id);
			});

			QUnit.testDone(function (details) {
				/*self._modTestIndex++;
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
				}*/
				self.messageToParent('testDone', details, self.system.id);
			});
			
			QUnit.moduleDone(function (details) {
				/*details.runtime = +new Date() - self._modStart;
				details.index = self._modIndex++;
				
				if (self._isRequiredCallback) {
					self._parentWin.setTimeout(function () {
						self._parentApp._ui._childCallback('moduleDone', details, QUnit.urlParams.module);
					}, 0);
				}*/
				self.messageToParent('moduleDone', details, self.system.id);
			});

			QUnit.done(function (details) {
				/*details.moduleCount = self._modIndex;
				QUnit.stop(); // Force stop QUnit to stop spamming Done and moduleDone events

				self.UpdateTestResult(details);*/
				self.messageToParent('done', details, self.system.id);
			});
		},
	
		/*requestToParent: function(func){
			var dfdParent = $.Deferred();
			var self = this;
			
			this.parentWindow.setTimeout(function () {
				var res = func();
				dfdParent.resolve(res);
			}, 0);
			
			return dfdParent.promise();
		},*/
	
		attachModules: function(moduleIndexes) {
			var j;
			if(!moduleIndexes){
				moduleIndexes = [];
				for (j = 0; j < qutRunnerApp.modules.length; j++){
					moduleIndexes.push(j);
				}
			}
			var theApp = this.getApp();
			
			var appConfig = theApp.config.defaults || {};
		
			for (j = 0; j < moduleIndexes.length; j++) {
				var mIdx = moduleIndexes[j];
				var m = qutRunnerApp.modules[mIdx];
				m.execute();
				
				var qm = QUnit.config.currentModule;
				var testEnvironment = QUnit.config.currentModule.testEnvironment;
				
				jQuery.extend(testEnvironment, appConfig, m.config || {} );
				
				var moduleInfo = {
					label: m.label,
					caption: m.caption,
					name: qm.name,
					id: m.id,
					moduleId: qm.moduleId,
					testCount: qm.tests.length
				};
				this.messageToParent('moduleInfo', moduleInfo, this.system.id);
			}
		},
	
		setSystem: function (id) {
			var sysId = envianceSdk.getSystemId();
			if (sysId != id) {
				envianceSdk.setSystemId(id);
				return true;
			}
			return false;
		}
	};

	if(typeof UnitTestsApplication == 'undefined'){
		global['UnitTestsApplication'] = {};
	}

	qutRunnerApp.modules = [];
	qutRunnerApp.loadedModuleCounter = 0;

	// f*ng backward compatibility
	UnitTestsApplication.registerModule = function(module) {
		var m = qutRunnerApp.modules[qutRunnerApp.loadedModuleCounter++];
		$.extend(m, module);
	};

	$(document).ready(function() {
		new qutRunnerApp();
	});

}( (function() {return this;})() ));
