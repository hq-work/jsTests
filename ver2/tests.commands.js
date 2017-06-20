if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Commands', execute: executeCommandServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof commandConfig == "undefined")
	commandConfig = { };

function executeCommandServiceTests() {
	module("Command Service", {
		setup: function () {
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.accessUserName = locationConfig.accessUserName || this.accessUserName;
			this.noManageRightsUserName = (locationConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.password = locationConfig.password || "1111";

			this.succeededCommandId = "ec4f2da0-5c01-4d03-9922-b27c49610341";
			this.failedCommandId = "e4a99724-367c-4c14-8a48-1e906dee14b7";
			this.ownerCommandId = "200D28C0-2807-41D7-A08C-2C9F0E4B4552";
			
			this.succeededWorkerCommandId = "07672a79-83ff-4d61-a640-8df464e46304";
			this.queuedWorkerCommandId = "b8e7886e-3ce6-4bb2-83de-5fd5ca2887cf";
			this.failedWorkerCommandId = "f5cf424d-eb40-4b32-b439-e6e67970c7f4";
			this.ownerWorkerCommandId = "4B44F1BE-920A-4BC1-9C64-DE6A31A45C36";
			
			this.issued = new Date("01 Jan 2013 00:00");
			this.startedProcessing = new Date("01 Feb 2013 00:00");
			this.finishedProcessing = new Date("01 Mar 2013 00:00");

			var webUrl = window.location.protocol + "//" + window.location.host;
			this.reportResultLink = webUrl + "/Report/RunReport.aspx?workerCommandLogId=07672a79-83ff-4d61-a640-8df464e46304&reportFormat=0";

			this.reportPath = "/report folder/report";

			this.divisionName = "JsTestsDivision";
			this.objects = ["/UDF_division/UDF_facility"];

			this.commandIdsToClear = [];
			this.locationPathsToClear = [];

			this.addRootLocation = function(queue) {
				//clear if any
				queue.enqueue(function(context) {
					envianceSdk.compliance.deleteLocation("/" + context.divisionName, true,
						function () {
							queue.executeNext();
						},
						function () {
							queue.executeNext();
						}
					);
				});
				queue.enqueue(function (context) {
					context.divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
					envianceSdk.compliance.createLocation(context.divisionInfo,
						function(response) {
							context.commandId = response.result.id;
							context.commandIdsToClear.push(response.result.id);

							context.locationPath = response.result.objects[0];
							context.locationPathsToClear.push(response.result.objects[0]);

							queue.executeNext();
						}, context.errorHandler);
				});
			};

			this.initUserTimeZone = function(queue) {
				queue.enqueue(function(context) {
					envianceSdk.authentication.getCurrentSession(
						function(response) {
							context.tz = response.result.userTimeZone;
							queue.executeNext();
						}, context.errorHandler);
				});
			};
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
		},
		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			for (var j = this.commandIdsToClear.length - 1; j >= 0; j--) {
				stop();
				envianceSdk.commands.deleteCommand(this.commandIdsToClear[i],
					function () {
						start();
					},
					this.errorHandler);
			}
			
			for (var j = this.locationPathsToClear.length - 1; j >= 0; j--) {
				stop();
				envianceSdk.compliance.deleteLocation(this.locationPathsToClear[j], true,
					function () {
						start();
					},
					this.errorHandler);
			}
		}
	});

	asyncTest("Get command - Happy path", 12, function() {
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.succeededCommandId,
				function(response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is equal");

					equal(actual.id, context.succeededCommandId, "Id is equal.");
					equal(actual.description, "Location created.", "Description is equal.");
					equal(actual.status, "Succeeded", "Status is equal.");
					equal(actual.objects[0], "/" + context.divisionName, "Objects are equal.");
					equal(actual.user, "jstestsAccessUser", "User is equal.");

					deepEqual(actual.issued, toLocalTime(context.issued, context.tz), "\"issued\" is correct");

					deepEqual(actual.startedProcessing, toLocalTime(context.startedProcessing, context.tz), "\"startedProcessing\" is correct");
					deepEqual(actual.finishedProcessing, toLocalTime(context.finishedProcessing, context.tz), "\"finishedProcessing\" is correct");

					ok(!actual.hasOwnProperty("reports"), "\"reports\" property is absent");
					ok(!actual.hasOwnProperty("result"), "\"result\" property is absent");
					ok(!actual.hasOwnProperty("errorInfo"), "\"errorInfo\" property is absent");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get command - Happy path - Status is Failed", 12, function() {
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.failedCommandId,
				function(response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is equal");

					equal(actual.description, "Location copied.", "Description is equal.");
					equal(actual.status, "Failed", "Status is equal.");
					equal(actual.objects[0], "/" + context.divisionName, "Objects are equal.");
					equal(actual.user, "jstestsAccessUser", "User is equal.");

					deepEqual(actual.issued, toLocalTime(context.issued, context.tz), "\"issued\" is correct");

					deepEqual(actual.startedProcessing, toLocalTime(context.startedProcessing, context.tz), "\"startedProcessing\" is correct");
					deepEqual(actual.finishedProcessing, toLocalTime(context.finishedProcessing, context.tz), "\"finishedProcessing\" is correct");

					equal(actual.errorInfo.error, "Facility's Time Zone cannot be changed because STD and DST offsets are not equal.", "Error message is equal");

					ok(!actual.hasOwnProperty("reports"), "\"reports\" property is absent");
					ok(!actual.hasOwnProperty("result"), "\"result\" property is absent");
					ok(!actual.errorInfo.hasOwnProperty("details"), "\"errorInfo.details\" property is absent");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get command - Fault when commandId is invalid", 2, function() {
		var invalidCommandId = "This_is_text_not_GUID";
		envianceSdk.commands.getCommand(invalidCommandId,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Get command - Fault when command does not exist", 2, function() {
		var notExistCommandId = createUUID();
		envianceSdk.commands.getCommand(notExistCommandId,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get command - Happy path - when have rights and he isn't owner", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.ownerCommandId, //owned by noManageRightsUserName
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get command - Happy path - when does not have rights but he is owner", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.ownerCommandId, //owned by noManageRightsUserName
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get command - Fault when user does not have rights and he isn't owner", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.succeededCommandId, //owned by accessUserName
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");

					start();
				});
		});
		
		queue.executeNext();
	});
	
	asyncTest("Delete command - Happy path", 3, function() {
		var queue = new ActionQueue(this);
		this.addRootLocation(queue);

		queue.enqueue(function(context) {
			envianceSdk.commands.deleteCommand(context.commandId,
				function(response) {
					context.commandIdsToClear = [];
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.commandId,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Get deleted command: status code is correct.");
					equal(response.error.errorNumber, 102, "Get deleted command: error number is correct.");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete command - Fault when commandId is invalid", 2, function() {
		var invalidCommandId = "This_is_text_not_GUID";
		envianceSdk.commands.deleteCommand(invalidCommandId,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete command - Fault when command does not exist", 2, function() {
		var notExistCommandId = createUUID();
		envianceSdk.commands.deleteCommand(notExistCommandId,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete command - Fault when user does not have rights", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.commands.deleteCommand(context.succeededCommandId,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");

					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get worker command - Happy path - Succeded", 13, function() {
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.succeededWorkerCommandId,
				function(response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is equal");

					equal(actual.id, context.succeededWorkerCommandId, "Id is equal.");
					equal(actual.description, "Report Execution", "Description is equal.");
					equal(actual.user, "jstestsAccessUser", "User is equal.");
					equal(actual.reports[0], context.reportPath, "\"reports\" property is equal");

					equal(actual.status, "Succeeded", "\"status\" is equal");
					deepEqual(actual.issued, toLocalTime(context.issued, context.tz), "\"issued\" property is equal");

					ok(!actual.hasOwnProperty("objects"), "\"objects\" property is absent");

					deepEqual(actual.startedProcessing, toLocalTime(context.startedProcessing, context.tz), "\"startedProcessing\" property is equal");
					deepEqual(actual.finishedProcessing, toLocalTime(context.finishedProcessing, context.tz), "\"finishedProcessing\" property is equal");
					ok(actual.issued <= actual.startedProcessing && actual.startedProcessing <= actual.finishedProcessing, "Time order is right");

					equal(actual.result.toLowerCase(), context.reportResultLink.toLowerCase(), "\"result\" property is equal");
					ok(!actual.hasOwnProperty("errorInfo"), "\"errorInfo\" property is absent");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get worker command - Happy path - Queued", 12, function() {
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.queuedWorkerCommandId,
				function(response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is equal");

					equal(actual.id, context.queuedWorkerCommandId, "Id is equal.");
					equal(actual.description, "Report Execution", "Description is equal.");
					equal(actual.user, "jstestsAccessUser", "User is equal.");
					equal(actual.reports[0], context.reportPath, "\"reports\" property is equal");

					equal(actual.status, "Queued", "\"status\" is equal");
					deepEqual(actual.issued, toLocalTime(context.issued, context.tz), "\"issued\" property is equal");

					ok(!actual.hasOwnProperty("objects"), "\"objects\" property is absent");

					ok(!actual.hasOwnProperty("startedProcessing"), "\"startedProcessing\" property is absent");
					ok(!actual.hasOwnProperty("finishedProcessing"), "\"finishedProcessing\" property is absent");
					ok(!actual.hasOwnProperty("result"), "\"result\" property is absent");
					ok(!actual.hasOwnProperty("errorInfo"), "\"errorInfo\" property is absent");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get worker command - Happy path - Failed", 12, function() {
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.failedWorkerCommandId,
				function(response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is equal");

					equal(actual.id, context.failedWorkerCommandId, "Id is equal.");
					equal(actual.description, "Report Execution", "Description is equal.");
					equal(actual.user, "jstestsAccessUser", "User is equal.");
					equal(actual.reports[0], context.reportPath, "\"reports\" property is equal");

					equal(actual.status, "Failed", "\"status\" is equal");
					deepEqual(actual.issued, toLocalTime(context.issued, context.tz), "\"issued\" property is equal");

					ok(!actual.hasOwnProperty("objects"), "\"objects\" property is absent");

					deepEqual(actual.startedProcessing, toLocalTime(context.startedProcessing, context.tz), "\"startedProcessing\" property is equal");
					deepEqual(actual.finishedProcessing, toLocalTime(context.finishedProcessing, context.tz), "\"finishedProcessing\" property is equal");
					ok(!actual.hasOwnProperty("result"), "\"result\" property is absent");
					ok(!actual.hasOwnProperty("errorInfo"), "\"errorInfo\" property is absent");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get worker command - Happy path - when user does not have rights and he isn't owner", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.ownerWorkerCommandId, //owned by noManageRightsUserName
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});
		
	asyncTest("Get worker command - Happy path - when user does not have rights and he is owner", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.ownerWorkerCommandId, //owned by noManageRightsUserName
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});
		
		
	asyncTest("Get worker command - Fault when user does not have rights and he isn't owner", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.commands.getCommand(context.succeededWorkerCommandId, //owned by accessUserName
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");

					start();
				});
		});
		
		queue.executeNext();
	});

	asyncTest("Delete worker command - Fault if object cannot be deleted", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.commands.deleteCommand(context.queuedWorkerCommandId,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 8001, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeCommandServiceTests();
}