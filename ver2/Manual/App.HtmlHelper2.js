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
			// show ? for good, ? for bad suite result in title
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

	
	
	_qUnitBeginParams: null,
	_qUnitPushFailureParams: null
};