UnitTestsApplication.UI = function(app) {
	this.app = app;

	//StartPanel
	this._moduleCheckboxes = [];
	this.$startPanel = $('#startPanel');
	this.$modulesContainer = $('#modulesContainer');
	this.$runButton = $('#runButton');
	this.$selectAllCheckbox = $('#selectAllCheckbox');
	
	this.$parallelButton = $('#parallelButton');
	this.$poolSizeInput = $('#modulesPoolSize');
	this.$poolUseDBPool = $('#modulesRunOnDBpool');
	this.$dbsAvailable = $('#dbsAvailable');
	
	this.$bodyToCollapse = $('#modules-wrapper, .app-start-panel-footer');
	
	/*
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
*/
	//this._storage = UnitTestsApplication.Helper.getStorage();
	this._init();
};

UnitTestsApplication.UI.prototype = {
	_init: function (useStartPanel) {
		this._populateStartPanel();
		this._initStartPanel();
		this._bindStartPanel();
	},
	
	_populateStartPanel: function() {
		var modules = this.app.getModules();
		var html = '';
		for (var i = 0; i < modules.length; i++) {
			var cb_id = 'cb_' + i;
			
			html += '<li for="' + cb_id + '"' + 
			(modules[i].descr ? ' title="' + this.app.helper.htmlEncode(modules[i].descr) + '"' : '') + 
			'><span><input id="' + cb_id + '" name="' + cb_id + '" type="checkbox" /><label class="caption" for="' + cb_id + '"><b class="ok hide">\u2714</b><b class="nok hide">\u2716</b><b class="prog hide">(<b class="count">567</b>/<b class="max-count">999</b>)</b> ' + modules[i].caption;
			
			if (modules[i].warning) {
				html += '<img src="warning16.png" title="' + this.app.helper.htmlEncode(modules[i].warning) + '" />';
			}

			html += '</label></span><span id="timer_' + i + '" class="runtimer"></span></li>';
		}
		this.$modulesContainer.html(this.$modulesContainer.html() + html);
		
		this._moduleCheckboxes = $('input', this.$modulesContainer).toArray();
	},
	
	_initStartPanel: function() {
		var storedCbs = this._restoreModuleIndexes();
		this._initModuleCheckboxes(storedCbs, this._moduleCheckboxes);
		this.$selectAllCheckbox[0].checked = storedCbs.length && (storedCbs.length == this._moduleCheckboxes.length);
		
		this._isExpanded = true; // read from storage
		this._isLogVisible = false; // read from storage
		
		var lsPos = this._restoreStartPanelPos();
		var lsTop = lsPos && lsPos.top || 10;
		var lsLeft = lsPos && lsPos.left || 10;

		var top; //= Math.max(0, lsTop);

		var winHeight = jQuery(window).height() || $(document.body).height() || 0;
		var winWidth = jQuery(window).width() || $(document.body).width() || 0;

		if(winHeight - lsTop < 10 ){
			lsTop = winHeight - this.$startPanel.height() - 20;
			
		}
		if(lsTop < -10) lsTop = 10;
		
		if(winWidth - lsLeft < 10 ){
			lsLeft = winWidth - this.$startPanel.width() - 20;
		}
		if(lsLeft < -10) lsLeft = 10;
		
		//top = Math.min(top, (winHeight - this.$startPanel.height()));
		
		top = lsTop;
		var left = lsLeft; //Math.max(0, lsLeft);
		//left = Math.min(left, (winWidth - this.$startPanel.width()));

		this.$startPanel.show();
		this.$startPanel.css({ left: left + 'px', top: top + 'px', right: 'auto', bottom: 'auto' });
		this.$startPanel.draggable({ cancel: '#modules-wrapper, #modulesPoolSize, .head-buttons' });
	},
	
	_bindStartPanel: function() {
		var self = this;

		this.$poolUseDBPool.click(function (evt) {
			self.$poolSizeInput[0].disabled = self.$poolUseDBPool.prop("checked");
		});
		
		this.$selectAllCheckbox.click(function() {
			for (var i = 0; i < self._moduleCheckboxes.length; i++) {
				self._moduleCheckboxes[i].checked = this.checked;
			}
		});
		
		$('li', this.$modulesContainer).hover(
			function() {
				$( this ).addClass( "mhover" );
			}, function() {
				$( this ).removeClass( "mhover" );
			}
		);
		
		var $buts = $('.head-buttons b', this.$startPanel);
		
		if(window['jsLog']){
			var $btnShowLog = $buts.filter('.con');
			var funcShowLog = function (){
				jsLog.Toggle(self._isLogVisible);
				$btnShowLog.toggleClass('on', self._isLogVisible);
			}
		
			$btnShowLog.click(function(){
				self._isLogVisible = !self._isLogVisible;
				funcShowLog();
			});
			funcShowLog();
		}
		
		var $btnCollapse = $buts.filter('.collapse');
		var funcCollapse = function (){
			self.$bodyToCollapse.toggle(self._isExpanded);
			$btnCollapse.toggleClass('on', self._isExpanded);
		}
		$btnCollapse.click(function(){
			self._isExpanded = !self._isExpanded;
			funcCollapse();
		});
		funcCollapse();
		
		$(window).unload(function() {
			self._saveStartPanelState(self._getStartPanelPosition(), self._getSelectedModuleIndexes());
		});
	},
	
	activateControls: function(){
		var allowedDbPooling = false; //this.app.systemManager.isPrimeUser() && this.app.systemManager.systemList.length > 1;

		if (allowedDbPooling) {
			this.$dbsAvailable.text(3 /*this.app.systemManager.systemList.length*/); 
			$('.poolSize', this.$startPanel).filter('.DB').removeClass('hide');
		}
		else { 
			this.$poolSizeInput.removeAttr('disabled'); 
		}
		 
		this._isUserCanRunDBTests = false; /*this.app.systemManager.isUserCanRunDBTests()*/
		
		if (this._isUserCanRunDBTests) {
			$('.app-buttons', this.$startPanel).removeClass('hide');
		} else {
			$('.error', this.$startPanel).removeClass('hide');
		}
		
		// buttons
		if(!this._isUserCanRunDBTests)return;
		
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
	
	_getSelectedModuleCount: function () {
		return /* this._isSingleTestMode() ? this.getModuleIndexesForSingleMode().length :*/ this._getSelectedModuleIndexes().length;
	},
	
	_restoreModuleIndexes: function() {
		return this.app.storage._getArray(this._BULK_MODE_MODULES_KEY);
	},
	
	_getStartPanelPosition: function() {
		var top = parseInt(this.$startPanel.css("top"));
		var left = parseInt(this.$startPanel.css("left"));
		return { 'top': top, 'left': left };
	},
	
	_saveStartPanelState: function(pos, indexes) {
		this.app.storage.ls.setItem(this._START_PANEL_POS_KEY, pos.top + ',' + pos.left);
		this.app.storage._setArray(this._BULK_MODE_MODULES_KEY, indexes);
	},
	_restoreStartPanelPos: function() {
		var pos = this.app.storage.ls.getItem(this._START_PANEL_POS_KEY);
		if (pos == null) {
			return null;
		}
		pos = pos.split(',');
		return { 'top': pos[0], 'left': pos[1] };
	},
	
	

/*	_renderOptionsPanel: function() {
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
	},*/

/*	_initOptionsPanel: function(options, option) {
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
*/
/*	_getOptionsJsonValue: function() {
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
*/
/*	_setOptionsJsonValue: function() {
		this._txtJson.val(this._getOptionsJsonValue());
	},
*/
/*	_clearOptions: function() {
		for (var i = 0; i < this._sdkOptions.length; i++) {
			jQuery('#' + this._sdkOptions[i] + 'Option').val('');
		}
		this._txtJson.val('');
	},
*/	
/*	_bindOptionsPanel: function() {
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
*/
/*	
	*/
	
/*	_poolNewModule: function (moduleIndex, parent, parentTab) {
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
*/
	
	_SINGLE_MODE_MODULES_KEY: 'UTApp_SM_Modules',
	_BULK_MODE_MODULES_KEY: 'UTApp_BM_Modules',
	_START_PANEL_POS_KEY: 'UTApp_StartPanelPos'
};
