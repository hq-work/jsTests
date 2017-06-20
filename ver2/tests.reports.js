if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Reports', execute: executeReportServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof reportConfig == "undefined")
	reportConfig = { };

function executeReportServiceTests() {
	module("Report Service", {
		setup: function () {
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (reportConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.reportViewUserName = (reportConfig.reportViewUserName || "jstestsReportsView") + qUnitDbSuffix;
			this.password = reportConfig.password || "1111";

			this.report = "/Task Status Summary Report Generated (Reports module)";
			this.customReport = "/Custom report Generated (Reports module)";
			this.reportFolder = "/Report folder Generated (Reports module)";

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
		},
		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
		}
	});

	asyncTest("Execute Report - Happy path", 3, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "Excel", null, null);

		envianceSdk.reports.execute(reportInfo,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				equal(response.result.status, "Succeeded", "Command status matches");
				ok(response.result.hasOwnProperty("result"), "'result' property presents");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			}
		);
	});
	
	asyncTest("Execute Report Async - Happy path", 2, function () {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "Excel", null, null);

		envianceSdk.reports.executeAsync(reportInfo,
			function (response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				equal(response.result.length, 36, "Execute Report Async is called successfuly");
				start();
			},
			function () {
				ok(false, "failed");
				start();
			}
		);
	});

	asyncTest("Execute Report - Happy path - \"format\" is case INsensitive", 3, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "EXCEL TEMPLATE", null, null);

		envianceSdk.reports.execute(reportInfo,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				equal(response.result.status, "Succeeded", "Command status matches");
				ok(response.result.hasOwnProperty("result"), "'result' property presents");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			}
		);
	});

	asyncTest("Execute Report - Happy path - Passed \"from\" without \"to\"", 3, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "EXCEL TEMPLATE", "2000-02-01T00:00:00", null);

		envianceSdk.reports.execute(reportInfo,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				equal(response.result.status, "Succeeded", "Command status matches");
				ok(response.result.hasOwnProperty("result"), "'result' property presents");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			}
		);
		});

	asyncTest("Execute Report - Happy path - Passed \"to\" without \"from\"", 3, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "EXCEL TEMPLATE", null, "2013-02-01T00:00:00");

		envianceSdk.reports.execute(reportInfo,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				equal(response.result.status, "Succeeded", "Command status matches");
				ok(response.result.hasOwnProperty("result"), "'result' property presents");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			}
		);
	});

	asyncTest("Execute Report - Happy path - Passed \"filterBy\" for non Workflow report", 3, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "HTML", null, null)
												.setWorkflowDateFilterBy("due date");

		envianceSdk.reports.execute(reportInfo,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				equal(response.result.status, "Succeeded", "Command status matches");
				ok(response.result.hasOwnProperty("result"), "'result' property presents");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			}
		);
	});
	
	asyncTest("Execute Report - Happy path - User has View permission on report", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.authentication.authenticate(context.reportViewUserName, context.password,
				function () {
					queue.executeNext();
				},
				function () {
					ok(false, "failed");
					start();
				});
		});

		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "Excel", null, null);
		queue.enqueue(function () {
			envianceSdk.reports.execute(reportInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				},
				function () {
					ok(false, "failed");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Execute Report - Fault if \"from\" is greater than \"to\"", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "Excel", "2013-02-01T00:00:00", "2013-01-01T00:00:00");

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault if execute Custom Reports", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.customReport, "Excel", null, null);

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 10001, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault when user does not have rights or permissions", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				function() {
					ok(false, "failed");
					start();
				});
		});

		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "Excel", null, null);
		queue.enqueue(function() {
			envianceSdk.reports.execute(reportInfo,
				function() {
					ok(false, "failed");
					start();
				},
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
			});
		});

		queue.executeNext();
	});

	asyncTest("Execute Report - Fault if report does not exist", 2, function() {
		var invalidReportName = "/Not existed report";
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(invalidReportName, "Excel", null, null);

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Execute Report - Fault if \"path\" is missing", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(null, "Excel");

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault if report folder path passed instead of report path", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.reportFolder, "HTML");

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 10002, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault if \"format\" is missing", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report);

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault if \"format\" is invalid", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "NewFormat");

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault if \"objects\" does not exist", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "html")
												.addObjectPathFilter("/not existed object path");

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Execute Report - Fault if \"filterBy\" is invalid", 2, function() {
		var reportInfo = new envianceSdk.reports.ReportExecutionInfo(this.report, "html")
												.setWorkflowDateFilterBy("active date");

		envianceSdk.reports.execute(reportInfo,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});
	
	asyncTest("Execute Report - Fault if \"filterBy\" Udf is Not Selected in Workflow Report", 2, function () {

		var reportInfo = new envianceSdk.reports.ReportExecutionInfo("/Workflow Report", "html").setWorkflowDateFilterBy("XLS_UDF_date");

		envianceSdk.reports.execute(reportInfo,
			function () {
				ok(false, "failed");
				start();
			},
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeReportServiceTests();
}