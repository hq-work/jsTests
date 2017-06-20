if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'EQL', execute: executeEqlServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeEqlServiceTests() {
	module("EQL Service", {
		setup: function() {
			this.complianceObjectName = "UDF_facility";

			this.selectComplianceObjectsQuery = function(name) {
				return "SELECT " +
					" co.ID, co.Name, co.Type, co.Path, co.WarningNotificationInbox, co.WarningNotificationEmail," +
					" co.TemplateName, co.CreatedOn, co.ActiveDate, co.InactiveDate, co.ResponsibleUser" +
					" FROM ComplianceObject co " +
					"WHERE co.Name LIKE '%" + name + "%'";
			};

			this.selectFormTemplatesQuery = "SELECT ft.ID, ft.Name, ft.Description FROM FormTemplate ft";

			//testSystemId is key in web.config used for CI
			if (typeof testSystemId != "undefined") {
				envianceSdk.configure({ systemId: testSystemId });
			}
		},

		teardown: function() {
		}
	});

	asyncTest("Execute - Happy path", 1, function() {
		envianceSdk.eql.execute(this.selectFormTemplatesQuery, 1, 10,
			function(response) {
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Execute - Fault if query is incorrect", 3, function() {
		envianceSdk.eql.execute("SELECT t.ID", 1, 10,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 2001, "Error number is correct");
				ok(response.error.hasOwnProperty("detailXml"), "Error has detailXml property");
				start();
			});
	});

	asyncTest("Helpers - Select compliance objects by name", 1, function() {
		var eql = this.selectComplianceObjectsQuery(this.complianceObjectName);
		envianceSdk.eql.execute(eql, 1, 10,
			function(response) {
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Switch systems - Happy path", 2, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		var currentSystemRows;
		queue.enqueue(function(context) {
			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					currentSystemRows = response.result[0].rows;
					queue.executeNext();
				}, errorHandler);
		});

		var currentSystemId, otherSystemId;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					currentSystemId = response.result.currentSystemId;

					var systems = response.result.systems;
					for (var systemId in systems) {
						if (systemId != response.result.currentSystemId) {
							otherSystemId = systemId;
							break;
						}
					}

					if (typeof otherSystemId != "undefined") {
						queue.executeNext();
					} else {
						start();
					}
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: otherSystemId });

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					notDeepEqual(response.result[0].rows, currentSystemRows, "Resultsets are not same for different systems");
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: currentSystemId });

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					deepEqual(response.result[0].rows, currentSystemRows, "Resultsets are same after switching back");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Switch systems - Fault if wrong system ID", 3, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		var currentSystemRows;
		queue.enqueue(function(context) {
			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					currentSystemRows = response.result[0].rows;
					queue.executeNext();
				}, errorHandler);
		});

		var currentSystemId;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					currentSystemId = response.result.currentSystemId;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: createUUID() }); // Switch to non-existent system

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: currentSystemId });

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					deepEqual(response.result[0].rows, currentSystemRows, "Resultsets are same after switching back");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

}

if (typeof(UnitTestsApplication) == "undefined") {
	executeEqlServiceTests();
}