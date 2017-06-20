(function () {
	var getTimestamp = function () {
		var now = new Date();
		return envianceSdk.IsoDate.toLocalString(now) + ".000";
	};

	var id = Math.floor((Math.random() * 10000) + 1);

	function escape(str) {
		if (!(str = "" + str)) {
			return "";
		}

		return str.replace(/\|/g, "||")
			.replace(/\'/g, "|'")
			.replace(/\n/g, "|n")
			.replace(/\r/g, "|r")
			.replace(/\u0085/g, "|x")
			.replace(/\u2028/g, "|l")
			.replace(/\u2029/g, "|p")
			.replace(/\[/g, "|[")
			.replace(/]/g, "|]");
	}

	QUnit.moduleStart(function (details) {
		log("##teamcity[testSuiteStarted name='" + escape(details.name) + "' flowId='" + id + "' timestamp='" + getTimestamp() + "']");
	});
	QUnit.testStart(function (details) {
		log("##teamcity[testStarted name='" + escape(details.name) + "' flowId='" + id + "' timestamp='" + getTimestamp() + "']");
	});
	QUnit.testDone(function (details) {
		log("##teamcity[testFinished name='" + escape(details.name) + "' flowId='" + id + "' timestamp='" + getTimestamp() + "']");
	});

	QUnit.log(function (details) {
		if (!details.result) {
			var tcMessage = details.message;
			if (details.expected !== "undefined") {
				tcMessage += " Expected: " + details.expected;
				tcMessage += " Actual: " + details.actual;
			}
			log("##teamcity[testFailed name='" + escape(details.name) + "' message='" + tcMessage + "' details='" + escape(details.source) + "'  flowId='" + id + "' timestamp='" + getTimestamp() + "']");
		}
	});

	QUnit.moduleDone(function (details) {
		log("##teamcity[testSuiteFinished name='" + escape(details.name) + "' flowId='" + id + "' timestamp='" + getTimestamp() + "']");
	});

	QUnit.done(function (details) {
		if (details.failed > 0) {
			log("##teamcity[All suites finished  flowId='" + id + "' timestamp='" + getTimestamp() + "']");
		}
	});
	

	function log(message) {
		//console.log(message);
		
		if (window.top == window) {
			logToInput(message);
		} else {
			if(window.top.log != null) {
				window.top.log(message);
			}else {
				logToInput(message);
			}
		}
	}
	
	function logToInput(message) {
		var input = document.getElementById("qunit-teamcity-log");
		input.value = input.value + '\n' + message;
	}

	window.log = log;
}());