if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Tasks', execute: executeTaskServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof taskConfig == "undefined")
	taskConfig = { };

function executeTaskServiceTests() {
	module("Task Service", {
		setup: function () {
			this.addCreateTaskAction = function(queue, taskInfo) {
				queue.enqueue(function(context) {
					envianceSdk.tasks.createTask(taskInfo,
						function(response) {
							context.taskId = response.result;
							context.taskIDsToClear.push(response.result);
							queue.executeNext();
						}, context.errorHandler);
				});
			};

			if (!Date.now) {
				Date.now = function now() {
					return new Date().getTime();
				};
			}
			
			this.checkTaskOccurrenceInfo = function(actual, expected, checkObjects) {
				if (expected.hasOwnProperty("statusChangeDate")) {
					deepEqual(actual.statusChangeDate, expected.statusChangeDate, 'StatusChangeDate are equal');
				} else {
					var taskTimeZone = {dstOffset: -480, stdOffset: -480};
					var diffDate = Math.abs(Date.now() - toUTC(new Date(actual.statusChangeDate.valueOf() - actual.statusChangeDate.getTimezoneOffset() * 60000), taskTimeZone).valueOf());
					ok(diffDate < 120000, 'StatusChangeDate are equal');
				}
				equal(actual.dismissed, expected.dismissed, 'Dismissed are equal');
				equal(actual.percentComplete == null ? 0 : actual.percentComplete, expected.percentComplete == null ? 0 : expected.percentComplete, 'PercentCompletes are equal');
				equal(actual.hoursToComplete == null ? 0 : actual.hoursToComplete, expected.hoursToComplete == null ? 0 : expected.hoursToComplete, 'HoursToCompletes are equal');
				equal(actual.costToComplete == null ? 0 : actual.costToComplete, expected.costToComplete == null ? 0 : expected.costToComplete, 'CostToCompletes are equal');
				equal(actual.comment, expected.comment, 'Comments are equal');
				if (checkObjects) {
					equal(actual.objectIdOrPath, expected.objectIdOrPath, 'Objects are equal');
				}
			};

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			this.accessUserName = taskConfig.accessUserName || this.accessUserName;
			this.noAccessUserName = taskConfig.noAccessUserName || "jstestsNotAccessUser";

			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (taskConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.noPermissionsForObjectUserName = (taskConfig.noPermissionsForObjectUserName || "jstestsUserWithNoPermissionsToObject") + qUnitDbSuffix;
			
			this.password = taskConfig.password || "1111";

			this.taskIDsToClear = [];
			this.workflowIDsToClear = [];
			this.taskId = null;

			this.objectPath = "/UDF_division/UDF_facility";
			this.alternateObjectPath = "/XLS_Division_date/XLS_facility_date";
			this.anyGuid = "B0968441-CFEC-4FBA-BDE6-47CBA09DEF32";

			this.noPermissionsForObjectUserId = "jstestsUserWithNoPermissionsToObject";
			this.documentPath = "/250/99999.xls";
			this.name = "JS Test Task";
			this.description = "JS Test Task Description";
			var date = new Date();
			this.dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30, 0);
			this.timeZone = "Pacific Time (US & Canada) (UTC-08:00) (Without DST)";
			this.assignor = this.accessUserName;
			this.calendars = ["System", "Object", "My"];
			this.taskTemplateName = 'task-template-1';
			this.taskTemplateWithTriggerName = 'task-template-with-trigger-1';

			this.buildTaskInfo = function() {
				return new envianceSdk.tasks.TaskInfo(
					this.name, this.description, this.dueDate, this.timeZone, this.assignor, null, this.calendars)
					.addUserAssignee(this.accessUserName)
					.addGroupAssignee("Administrators")
					.addDocument(this.documentPath)
					.addPathAssociatedObject(this.objectPath);
			};

			this.buildTaskInfoWithTemplate = function (assignor) {
				return new envianceSdk.tasks.TaskInfo(
					this.name, this.description, this.dueDate, this.timeZone, assignor || this.assignor, null, null, null, null, null, null, this.taskTemplateName)
					.addUserAssignee(this.accessUserName)
					.addGroupAssignee("Administrators")
					.addPathAssociatedObject(this.objectPath);
			};

			this.buildTaskInfoWithWarnings = function() {
				var taskInfo = new envianceSdk.tasks.TaskInfo(
					this.name, this.description, this.dueDate, this.timeZone, this.assignor, null)
					.addUserAssignee(this.accessUserName)
					.addPathAssociatedObject(this.objectPath);
				taskInfo.id = createUUID();
				taskInfo.createdBy = this.dueDate;
				taskInfo.createdOn = this.dueDate;
				return taskInfo;
			};

			this.eventIdsToClear = [];
			this.eventLogTag = "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789v";
			
			this.beginDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30, 0);
			this.endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 31, 0);

			this.buildEventInfo = function() {
				return new envianceSdk.events.EventInfo(
					this.name, this.beginDate, this.endDate,
					"Open", "Regulatory",
					false, "/UDF_division/UDF_facility/UDF_parameter");
			};
		},

		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			for (var i = 0 ; i < this.taskIDsToClear.length ; i++) {
				stop();
				envianceSdk.tasks.deleteTask(this.taskIDsToClear[i],
					function() {
						start();
					},
					function() {
						start();
					});
			}
			
			for (var j = 0 ; j < this.eventIdsToClear.length ; j++) {
				stop();
				envianceSdk.events.deleteEvent(this.eventLogTag, this.eventIdsToClear[j],
					function () {
						start();
					},
					function () {
						start();
					});
			}

			for (var w = 0; w < this.workflowIDsToClear.length ; w++) {
				stop();
				envianceSdk.workflows.deleteWorkflow(this.taskIDsToClear[w],
					function () {
						start();
					},
					function () {
						start();
					});
			}
		}
	});

	asyncTest("Task Batch - Create 2 tasks (same name) - Happy path", 27, function () {
		var errorHandled = 0;
		var self = this;
		var errorHandler = function (response, status, message) {
			self.errorHandler(response, status, message, null, errorHandled++);
		};

		var queue = new ActionQueue(this);

		var doneCallbacks = 0;
		var operCount = 0;

		queue.doNext = function (doStart) {
			doneCallbacks++;
			if (doneCallbacks + (doStart || 0) > operCount) {
				if (doStart) start();
				else this.executeNext();
			}
		};

		var taskInfo1 = this.buildTaskInfo();
		var taskInfo2 = this.buildTaskInfo();
		
		var tasks = {};
		var taskIds = [];

		var callContext = null;
		var awaitCallback = function (response) {
			equal(response.metadata.statusCode, 201, "Status code is correct");
			ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
			taskIds.push(response.result);
			callContext.taskIDsToClear.push(response.result);

			queue.doNext();
		};

		var validationCallback = function (response) {
			equal(response.metadata.statusCode, 200, "Status code is correct");
			var actual = response.result;
			var expected = tasks[actual.id];
			equal(actual.name, expected.name, "Names are equal");
			equal(actual.description, expected.description, "Descriptions are equal");
			deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
			equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
			equal(actual.assignor, expected.assignor, "Assignors are equal");
			deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
			deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
			deepEqual(actual.objects, expected.objects, "Objects are equal");
			deepEqual(actual.documents, expected.documents, "Documents are equal");

			queue.doNext(true);
		};

		queue.enqueue(function (context) {
			callContext = context;
			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.tasks.createTask(taskInfo1, function (response) {
						if (response.result) tasks[response.result] = taskInfo1;
						awaitCallback(response);
					}, errorHandler);
					envianceSdk.tasks.createTask(taskInfo2, function (response) {
						if (response.result) tasks[response.result] = taskInfo2;
						awaitCallback(response);
					}, errorHandler);

					operCount = envianceSdk.batch.getOperations().length;
				}
			},
				function (response) {
					equal(response.result && response.result.length, operCount, "Get " + operCount + " results");
					equal(response.result[0].status, "Created", "1st Task is Created");
					equal(response.result[1].status, "Created", "2nd Task is Created");

					queue.doNext();
				}, errorHandler);
		});

		queue.enqueue(function (context) {
			doneCallbacks = 0;
			envianceSdk.tasks.getTask(taskIds[0], validationCallback, context.errorHandler);
			envianceSdk.tasks.getTask(taskIds[1], validationCallback, context.errorHandler);
		});
		
		queue.executeNext();
	});
	
	asyncTest("Create Task - Happy path", 12, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		var taskId;
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					taskId = response.result;
					context.taskIDsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(taskId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result;
					var expected = taskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.documents, expected.documents, "Documents are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task - Happy path with Assignees ids", 12, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.assignees = [];
		taskInfo.addUserAssignee(this.accessUserId);
		taskInfo.addGroupAssignee(this.originalSystemId);
		var taskId;
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					taskId = response.result;
					context.taskIDsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(taskId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result;
					var expected = taskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees.length, 2, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.documents, expected.documents, "Documents are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when Assignor User has no permission on object", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.assignees = [];
		taskInfo.addUserAssignee(this.noPermissionsForObjectUserName);
		taskInfo.assignor = this.noPermissionsForObjectUserName;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task - Fault when User added as Assignee more than once", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.assignees = [];
		taskInfo.addUserAssignee(this.accessUserId);
		taskInfo.addUserAssignee(this.accessUserName);
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when Group added as Assignee more than once", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.assignees = [];
		taskInfo.addUserAssignee(this.originalSystemId);
		taskInfo.addUserAssignee("Administrators");
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when empty name", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.name = "";
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when empty time zone", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			delete taskInfo.timeZone;
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when empty assignor", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.assignor = "";
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when empty assignees", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.assignees = [];
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when empty one of assignees name", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.assignees = [];
			var userAssignee = new envianceSdk.common.UserAssignee("AnyUserName");
			userAssignee.userIdOrName = "";
			taskInfo.assignees.push(userAssignee);
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when invalid due date granularity", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			var d = taskInfo.dueDate;
			taskInfo.dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 35, 0);
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when invalid path associated object", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.addPathAssociatedObject("");
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when invalid document path associated", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.addDocument("");
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when user has no rights", 2, function() {
		var queue = new ActionQueue(this);

		var self = this;
		var restoreSession = function() {
			envianceSdk.configure({ sessionId: self.originalSessionId });
		};

		// Given
		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler)
				.fail(restoreSession);
		});

		// Then
		queue.enqueue(function(context) {
			var taskInfo = context.buildTaskInfo();
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");

					start();
				}).always(restoreSession);
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault when invalid time zone", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			taskInfo.setTimeZone("Invalid Time Zone");
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5001, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Copy Task - Fault when 'copyPropertiesFrom' task does not exist", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			envianceSdk.tasks.copyTask(taskInfo, context.anyGuid,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Fault if \'objects\' is missing", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithWarnings();
		delete taskInfo.objects;
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5007, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Hourly Schedule - Happy path", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.endTime, expected.endTime, "EndTimes are equal");
					deepEqual(actual.daysOfWeek.sort(), expected.daysOfWeek.sort(), "DaysOfWeek are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Hourly Schedule - Happy path when EndTime is equal to StartTime", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "13:45:00", ["Sunday", "Monday"]));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.endTime, expected.endTime, "EndTimes are equal");
					deepEqual(actual.daysOfWeek.sort(), expected.daysOfWeek.sort(), "DaysOfWeek are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Hourly Schedule - Fault when StartTime is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule(null, "12:15:00", ["Sunday", "Monday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Hourly Schedule - Fault when EndTime is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", null, ["Sunday", "Monday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Hourly Schedule - Fault when DaysOfWeek is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "23:45:00"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Hourly Schedule - Fault when EndTime is smaller then StartTime", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "12:15:00", ["Sunday", "Monday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Hourly Schedule - Fault when EndTime is not aligned by 15 minutes", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "23:20:00", ["Sunday", "Monday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Daily Schedule (by interval) - Happy path", 8, function () {
		var queue = new ActionQueue(this);
		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByInterval("13:45:00", 10));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					ok(!(actual.daysOfWeek), "DaysOfWeek is not specified");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Daily Schedule (by interval) - Happy path with EndDate", 9, function () {
		var queue = new ActionQueue(this);
		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"),
				envianceSdk.IsoDate.parse("2014-04-03T00:00:00"))
			.BuildDailyScheduleByInterval("13:45:00", 10));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					deepEqual(actual.endDate, expected.endDate, "EndDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					ok(!(actual.daysOfWeek), "DaysOfWeek is not specified");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Daily Schedule (by interval) - Happy path when start time is 00:00", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByInterval("00:00:00", 10));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					ok(!(actual.daysOfWeek), "DaysOfWeek is not specified");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Daily Schedule (by interval) - Fault when EndDate is less than StartDate", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"),
				envianceSdk.IsoDate.parse("2014-01-09T00:00:00"))
			.BuildDailyScheduleByInterval("13:45:00", 10));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Daily Schedule (by interval) - Fault when StartTime is not aligned by 15 minutes", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByInterval("13:50:00", 10));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Daily Schedule (by interval) - Fault when StartTime is out of the range", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByInterval("24:00:00", 10));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Daily Schedule (by interval) - Fault when RecurrenceInterval is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByInterval("14:30:00"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Daily Schedule (by weekdays) - Happy path", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByWeekdays("10:45:00"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					deepEqual(actual.daysOfWeek, expected.daysOfWeek, "DaysOfWeek are equal");
					ok(!(actual.recurrenceInterval), "RecurrenceIntervals is not specified");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Daily Schedule (by weekdays) - Fault when DaysOfWeek is something except 'Weekdays'", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		var schedule = new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildDailyScheduleByWeekdays("10:45:00");
		schedule.daysOfWeek = ["Sunday", "Monday"];
		taskInfo.addSchedule(schedule);

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Weekly Schedule - Happy path with specific DaysOfWeek", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 4, ["Tuesday", "Thursday", "Friday", "Wednesday", "Saturday"]));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					deepEqual(actual.daysOfWeek.sort(), expected.daysOfWeek.sort(), "DaysOfWeek are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Weekly Schedule - Happy path with DaysOfWeek shortcuts", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 15, ["Weekdays", "Weekends"]));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					ok(actual.daysOfWeek.length == 1 && actual.daysOfWeek[0] === "All", "Shortcut value for DaysOfWeek is used");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Weekly Schedule - Fault when DaysOfWeek is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 6));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Weekly Schedule - Fault when DaysOfWeek contains unknown value", 1, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 0, ["Shmonday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					// In the current implementation status code is 500 because the error is raised upon deserialization
					ok(response.metadata.statusCode == 400 || response.metadata.statusCode == 500, "Status code is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Weekly Schedule - Fault when RecurrenceInterval is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 0, ["Saturday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (simple) - Happy path", 9, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-02-22T00:00:00"))
			.BuildMonthlySchedule("00:00:00", 1, 31));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					equal(actual.dayOfMonth, expected.dayOfMonth, "DayOfMonths are equal");
					equal(typeof (actual.dayOfMonth), "number", "DayOfMonth is number");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (simple) - Fault when RecurrenceInterval is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-02-22T00:00:00"))
			.BuildMonthlySchedule("01:00:00", 0, 14));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (simple) - Fault when DayOfMonth is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-02-22T00:00:00"))
			.BuildMonthlySchedule("01:00:00", 1, 0));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (simple) - Fault when DayOfMonth is invalid", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-02-22T00:00:00"))
			.BuildMonthlySchedule("01:00:00", 1, 32));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (extended) - Happy path", 9, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-31T00:00:00"))
			.BuildMonthlyScheduleExt("23:30:00", 1, "Last", "WeekendDay"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					deepEqual(actual.dayOfMonth, expected.dayOfMonth, "DayOfMonth structures are equal");
					equal(typeof (actual.dayOfMonth), "object", "DayOfMonth is a structure");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (extended) - Fault when RecurrenceInterval is negative", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-31T00:00:00"))
			.BuildMonthlyScheduleExt("23:30:00", -23, "Last", "WeekendDay"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (extended) - Fault when DayOccurrence is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-31T00:00:00"))
			.BuildMonthlyScheduleExt("23:30:00", 4, null, "WeekendDay"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Monthly Schedule (extended) - Fault when DayOfWeek is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-31T00:00:00"))
			.BuildMonthlyScheduleExt("23:30:00", 4, "Last"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (simple) - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildYearlySchedule("23:45:00", 2, 11, 27));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					equal(actual.monthOfYear, expected.monthOfYear, "MonthOfYears are equal");
					equal(actual.dayOfMonth, expected.dayOfMonth, "DayOfMonths are equal");
					equal(typeof (actual.dayOfMonth), "number", "DayOfMonth is number");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Yearly Schedule (simple) - Fault when RecurrenceInterval is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildYearlySchedule("23:45:00", 0, 11, 27));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (simple) - Fault when MonthOfYear is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildYearlySchedule("23:45:00", 3, 0, 27));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (simple) - Fault when MonthOfYear is invalid", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildYearlySchedule("23:45:00", 3, 13, 27));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (simple) - Fault when DayOfMonth is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildYearlySchedule("23:45:00", 3, 11, 0));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (extended) - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-30T00:00:00"))
			.BuildYearlyScheduleExt("23:30:00", 5, 10, "First", "Friday"));

		var taskId;
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(taskId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceIntervals are equal");
					equal(actual.monthOfYear, expected.monthOfYear, "MonthOfYears are equal");
					deepEqual(actual.dayOfMonth, expected.dayOfMonth, "DayOfMonth structures are equal");
					equal(typeof (actual.dayOfMonth), "object", "DayOfMonth is a structure");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (extended)  - Fault when RecurrenceInterval is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-30T00:00:00"))
			.BuildYearlyScheduleExt("23:30:00", 0, 10, "First", "Friday"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (extended)  - Fault when MonthOfYear is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-30T00:00:00"))
			.BuildYearlyScheduleExt("23:30:00", 2, 0, "First", "Friday"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (extended)  - Fault when DayOccurence is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-30T00:00:00"))
			.BuildYearlyScheduleExt("23:30:00", 2, 3, null, "Friday"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Yearly Schedule (extended)  - Fault when DayOfWeek is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2011-12-30T00:00:00"))
			.BuildYearlyScheduleExt("23:30:00", 2, 3, "Last"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with AfterLastOccurrence Schedule - Happy path", 8, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildAfterLastCompletionSchedule("13:30:00", 0, 3, 2));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					deepEqual(actual.recurrenceInterval, expected.recurrenceInterval, "RecurrenceInterval structures are equal");
					equal(typeof (actual.recurrenceInterval), "object", "RecurrenceInterval is a structure");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with AfterLastOccurrence Schedule - Fault when all intervals are zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildAfterLastCompletionSchedule("13:30:00", 0, 0, 0, 0));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with two Schedules - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"),
				envianceSdk.IsoDate.parse("2014-04-03T00:00:00"))
			.BuildDailyScheduleByInterval("13:45:00", 10));
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-04T00:00:00"))
			.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.schedules.length, 2, "Two schedules are created");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with two Schedules - Fault when schedules overlap", 2, function () {
		var queue = new ActionQueue(this);
		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"),
				envianceSdk.IsoDate.parse("2014-04-03T00:00:00"))
			.BuildDailyScheduleByInterval("13:45:00", 10));
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2013-03-10T00:00:00"))
			.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with all conditions", 7, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true, 
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("IntervalBefore", 5, "Hour"),
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">=", 30)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true, [this.accessUserId], [this.originalSystemId]),
			"InboxAndEmail",
			"Notification comment 1"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Only one notification");
					var actual = response.result.notifications[0];
					var expected = taskInfo.notifications[0];
					deepEqual(actual.conditions, expected.conditions, "Conditions are equal");
					deepEqual(actual.recipients, expected.recipients, "Recipients are equal");
					equal(actual.deliveryMethod, expected.deliveryMethod, "DeliveryMethods are equal");
					equal(actual.comments, expected.comments, "Comments are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with OnlyWhenPastDue = 'true' and zero completion percent", 6, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true,
				null,
				// If onlyWhenPastDue flag is "true" it corresponds to the "PastDue AND CompletionStatus" condition in UI
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition("=", 0, true)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Only one notification");
					var actual = response.result.notifications[0];
					var expected = taskInfo.notifications[0];
					deepEqual(actual.conditions, expected.conditions, "Conditions are equal");
					deepEqual(actual.recipients, expected.recipients, "Recipients are equal");
					equal(actual.deliveryMethod, expected.deliveryMethod, "DeliveryMethods are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with one condition and one recipient", 6, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, null, [this.accessUserId]),
			"Inbox"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Only one notification");
					var actual = response.result.notifications[0];
					var expected = taskInfo.notifications[0];
					deepEqual(actual.conditions, expected.conditions, "Conditions are equal");
					deepEqual(actual.recipients, expected.recipients, "Recipients are equal");
					equal(actual.deliveryMethod, expected.deliveryMethod, "DeliveryMethods are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with Immediate condition", 3, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					ok(!response.result.notifications || response.result.notifications.length == 0, "Immediate notification is not stored - it's sent upon task creation.");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with PastDue condition", 6, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Only one notification");
					var actual = response.result.notifications[0];
					var expected = taskInfo.notifications[0];
					deepEqual(actual.conditions, expected.conditions, "Conditions are equal");
					deepEqual(actual.recipients, expected.recipients, "Recipients are equal");
					equal(actual.deliveryMethod, expected.deliveryMethod, "DeliveryMethods are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with Template By Name", 3, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, "task-notification-template-1"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result.notifications[0];
					var expected = taskInfo.notifications[0];
					equal(actual.templateIdOrName, expected.templateIdOrName, "Notification Template names are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Happy path with Template By Id", 3, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, "2DABED31-7866-49DF-A599-BD24AA96020A"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result.notifications[0];
					equal(actual.templateIdOrName, "task-notification-template-1", "Notification Template Names are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Notification - Fault when none of the conditions are specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when none of the recipients are specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, false),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when delivery options aren't specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true)));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when OnlyWhenPastDue = 'true' and DueDateCondition is specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("IntervalBefore", 5, "Hour"),
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">=", 30, true)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when interval value is zero", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("IntervalBefore", 0, "Hour")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when interval type is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("IntervalAfter", 3)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when completion percent is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, false,
				null,
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when completion percent is invalid", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, false,
				null,
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">", 110)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when completion percent is not divisble by 10", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, false,
				null,
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">", 45)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when comparison logic is missing", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, false,
				null,
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(null, 90)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true),
			"InboxAndEmail"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with two Notifications - Happy path", 3, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox"));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 2, "Two notifications are added");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with two Notifications - Fault when notifications are identical", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Notification - Fault when Notification Template Name is invalid", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, "non-existing-notification-template"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Task with Template - Happy path with Task Template name specified", 6, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Notification added from template");
					equal(response.result.documents.length, 1, "Document added from template");
					ok(typeof response.result.schedules === "undefined", "Schedules are not present");
					equal(response.result.templateIdOrName, taskInfo.templateIdOrName, "Template names are equal");
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});

	asyncTest("Create Task with Template - Happy path with Task Template ID specified", 6, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		taskInfo.templateIdOrName = '5D27C1C6-CFFF-4393-83C6-2297FD6A5E8E';
		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Notification added from template");
					equal(response.result.documents.length, 1, "Document added from template");
					ok(typeof response.result.schedules === "undefined", "Schedules are not present");
					equal(response.result.templateIdOrName, context.taskTemplateName, "Template name returned");
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});

	asyncTest("Create Task with Template - Fault when Task Template with specified name does not exists", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.templateIdOrName = 'fake-task-template-name';

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Template - Fault when Task Template with specified ID does not exists", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.templateIdOrName = '00000000-0000-0000-0000-000000000001';

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Template - All template properties are filled from template", 7, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate()
			.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-04T00:00:00"))
				.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					var actual = response.result;
					var expected = taskInfo;
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(actual.calendars.length, 3, "Calendars added");
					equal(actual.documents.length, 1, "Document added");
					equal(actual.notifications.length, 1, "Notification added");
					equal(actual.schedules.length, 1, "Own schedule present");
					equal(actual.templateIdOrName, expected.templateIdOrName, "Template names are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Template - Happy path - Task Assignor is 'Creator' of triggered Workflow", 6, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate("jstestsAccessUser");
		taskInfo.templateIdOrName = 'task-template-with-trigger-2';

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			setTimeout(function () { queue.executeNext();}, 10000);
		});
		
		var taskAssignor;
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is correct");
					taskAssignor = actual.assignor;
					queue.executeNext();
				}, context.errorHandler);
		});

		var triggeredWorkflowId;
		queue.enqueue(function (context) {
			envianceSdk.eql.execute(
				"select top 1 w.ID AS ID " +
				"from WorkflowInstance w where w.Name = 'Triggered Workflow From Template 2'", 1, 1,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var isResultSetPresent = response.result.length == 1 && response.result[0].rows.length == 1;
					ok(isResultSetPresent, "One resultset present");
					if(isResultSetPresent)
					{
						triggeredWorkflowId = response.result[0].rows[0].values[0];
						queue.executeNext();
					}
					else {
						start();
					}
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(triggeredWorkflowId,
				function (response) {
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(actual.creator, taskAssignor, "Task Assignor is 'Creator' of triggered Workflow");
					context.workflowIDsToClear.push(triggeredWorkflowId);
					start();
				}, context.errorHandler);
		});


		queue.executeNext();
	});

	asyncTest("Copy Task with Template - Happy path with 'copyPropertiesFrom' - All values are copied", 13, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var parentTaskInfo;
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					parentTaskInfo = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var taskId;
		queue.enqueue(function (context) {
			var taskInfo = new envianceSdk.tasks.TaskInfo();
			envianceSdk.tasks.copyTask(taskInfo, context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					context.taskIDsToClear.push(response.result);
					taskId = response.result;
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					var actual = response.result;
					var expected = parentTaskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.templateIdOrName, expected.templateIdOrName, "Templates are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.documents, expected.documents, "Documents are equal");
					equal(actual.notifications.length, 1, "Notifications are created");
					deepEqual(actual.notifications, expected.notifications, "Notifications are equal");
					deepEqual(actual.schedules, expected.schedules, "Schedules are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Task - Happy path with 'copyPropertiesFrom' - All values are copied", 18, function() {
		var queue = new ActionQueue(this);

		var parentTaskInfo = this.buildTaskInfo();
		parentTaskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 4, ["Tuesday", "Thursday"]));
		parentTaskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("IntervalBefore", 5, "Hour"),
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">=", 30)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true, [this.accessUserId], [this.originalSystemId]),
			"InboxAndEmail",
			"Notification comment 1",
			"task-notification-template-1"
		));		
		this.addCreateTaskAction(queue, parentTaskInfo);

		var taskId;
		queue.enqueue(function(context) {
			var taskInfo = new envianceSdk.tasks.TaskInfo();
			envianceSdk.tasks.copyTask(taskInfo, context.taskId,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					context.taskIDsToClear.push(response.result);
					taskId = response.result;
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(taskId,
				function(response) {
					var actual = response.result;
					var expected = parentTaskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					// dueDate is not equal because it's updated for a task with schedules
					// deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.documents, expected.documents, "Documents are equal");
					
					equal(actual.notifications.length, 1, "Notifications are created");
					deepEqual(actual.notifications, expected.notifications, "Notifications are equal");
					
					equal(actual.schedules.length, 1, "Schedules are created");
					var actualSchedule = actual.schedules[0];
					var expectedSchedule = expected.schedules[0];
					equal(actualSchedule.recurrenceType, expectedSchedule.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actualSchedule.startDate, expectedSchedule.startDate, "StartDates are equal");
					equal(actualSchedule.startTime, expectedSchedule.startTime, "StartTimes are equal");
					equal(actualSchedule.recurrenceInterval, expectedSchedule.recurrenceInterval, "RecurrenceIntervals are equal");
					deepEqual(actualSchedule.daysOfWeek.sort(), expectedSchedule.daysOfWeek.sort(), "DaysOfWeek are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Task - Happy path with 'copyPropertiesFrom' - All values are own", 15, function() {
		var queue = new ActionQueue(this);

		var parentTaskInfo = this.buildTaskInfo();
		parentTaskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"), envianceSdk.IsoDate.parse("2014-03-08T00:00:00"))
			.BuildWeeklySchedule("13:45:00", 4, ["Tuesday", "Thursday"]));
		parentTaskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"))
			.BuildYearlySchedule("23:45:00", 2, 11, 27));
		parentTaskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, "task-notification-template-1"));
		parentTaskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));
		this.addCreateTaskAction(queue, parentTaskInfo);

		var taskId;
		var taskInfo;
		queue.enqueue(function(context) {
			taskInfo = new envianceSdk.tasks.TaskInfo(
				"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000), "Ukraine",
				null, null, ["My"], null, [])
				.addPathAssociatedObject(context.alternateObjectPath)
				.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-11T00:00:00"))
					.BuildDailyScheduleByInterval("13:15:00", 10))
				.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
					new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
					new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, null, [context.accessUserId]),
					"InboxAndEmail",
					"Comment 2",
					"task-notification-template-2"));
			envianceSdk.tasks.copyTask(taskInfo, context.taskId,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					taskId = response.result;
					context.taskIDsToClear.push(response.result);
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(taskId,
				function(response) {
					var actual = response.result;
					var expected = taskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					// dueDate is not equal because it's updated for a task with schedules
					// deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					ok(typeof actual.documents === "undefined", "Documents are not present");

					equal(actual.notifications.length, 1, "Own notifications are created");
					deepEqual(actual.notifications, expected.notifications, "Notifications are equal");
					
					equal(actual.schedules.length, 1, "Own schedules are created");
					var actualSchedule = actual.schedules[0];
					var expectedSchedule = expected.schedules[0];
					equal(actualSchedule.recurrenceType, expectedSchedule.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actualSchedule.startDate, expectedSchedule.startDate, "StartDates are equal");
					equal(actualSchedule.startTime, expectedSchedule.startTime, "StartTimes are equal");
					equal(actualSchedule.recurrenceInterval, expectedSchedule.recurrenceInterval, "RecurrenceIntervals are equal");
					
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Task - Happy path with Task that has Workflow Triggers - Task copied without errors", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var taskInfo = new envianceSdk.tasks.TaskInfo("JS Tests Copied Task With Trigger");
			taskInfo.dueDate = context.dueDate;
			envianceSdk.tasks.copyTask(taskInfo, 'A1EEB06A-77BB-4056-92B2-63A38DA7099C',
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					context.taskIDsToClear.push(response.result);
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task - Check warnings", 4, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithWarnings();
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'createdBy\'") > 0, "Warning for 'createdBy' OK");
					ok(response.metadata.warnings.indexOf("\'createdOn\'") > 0, "Warning for 'createdOn' OK");
					context.taskIDsToClear.push(response.result);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Template - Success when Task Template and notifications are specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
			"Email"));

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					equal(response.result.length, 36, "Result is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Template - Success when Task Template and calendar settings are specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		taskInfo.calendars = ["My"];

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					equal(response.result.length, 36, "Result is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Task with Template - Success when Task Template and documents are specified", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		taskInfo.addDocument(this.documentPath);

		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					equal(response.result.length, 36, "Result is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Task with Template - Success when copying task with template and notifications are specified", 2, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var taskInfo = new envianceSdk.tasks.TaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
								new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, false,
									new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("PastDue")),
								new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, true),
								"Email"));

		queue.enqueue(function(context) {
			envianceSdk.tasks.copyTask(taskInfo, context.taskId,
					function (response) {
						equal(response.metadata.statusCode, 201, "Status code is correct");
						equal(response.result.length, 36, "Result is correct");
						start();
					}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Task with Template - Success when copying task with template and calendar settings are specified", 2, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var taskInfo = new envianceSdk.tasks.TaskInfo();
		taskInfo.calendars = ["My"];

		queue.enqueue(function (context) {
			envianceSdk.tasks.copyTask(taskInfo, context.taskId,
					function (response) {
						equal(response.metadata.statusCode, 201, "Status code is correct");
						equal(response.result.length, 36, "Result is correct");
						start();
					}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Task with Template - Success when copying task with template and documents are specified", 2, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var taskInfo = new envianceSdk.tasks.TaskInfo();
		taskInfo.addDocument(this.documentPath);

		queue.enqueue(function (context) {
			envianceSdk.tasks.copyTask(taskInfo, context.taskId,
						function (response) {
							equal(response.metadata.statusCode, 201, "Status code is correct");
							equal(response.result.length, 36, "Result is correct");
							start();
						}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Task - Happy path", 9, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(context.taskId,
				function(response) {
					var actual = response.result;
					var expected = taskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.documents, expected.documents, "Documents are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Task - Fault when task does not exist", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask("EBA4F9E3-F98C-4FD3-96CE-F5A96CAFAD8B",
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Task - Fault when task ID is invalid guid", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask("EBA4F9E3-F98C-4FD3-96CE-F5A96CAFAD8T",
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Task - Happy path", 3, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		var taskId;
		queue.enqueue(function(context) {
			envianceSdk.tasks.createTask(taskInfo,
				function(response) {
					taskId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.deleteTask(taskId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(taskId,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Task - Fault when task does not exist", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.tasks.deleteTask("EBA4F9E3-F98C-4FD3-96CE-F5A96CAFAD8B",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Happy path", 10, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function(context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
				"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
				"Ukraine", context.accessUserName, null, ["My"], null, [])
				.addUserAssignee(context.accessUserName)
				.addPathAssociatedObject(context.alternateObjectPath);
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(context.taskId,
				function(response) {
					var actual = response.result;
					var expected = updateTaskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					ok(typeof actual.documents === "undefined", "Documents are not present");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Happy path with Assignees by ids", 10, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function(context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
				"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
				"Ukraine", context.accessUserId, null, ["My"], null, [])
				.addUserAssignee(context.accessUserId)
				.addPathAssociatedObject(context.alternateObjectPath);
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(context.taskId,
				function(response) {
					var actual = response.result;
					var expected = updateTaskInfo;
					expected.assignor = context.accessUserName;
					expected.assignees = [];
					expected.addUserAssignee(context.accessUserName);
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					ok(typeof actual.documents === "undefined", "Documents are not present");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task - Fault when Assignor User has no permission on object", 2, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfo());

		var updateTaskInfo = new envianceSdk.tasks.TaskInfo();
		updateTaskInfo.assignor = this.noPermissionsForObjectUserName;
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Fault when User added as Assignee more than once", 2, function() {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfo());
		
		var taskInfo = this.buildTaskInfo();
		taskInfo.assignees = [];
		taskInfo.addUserAssignee(this.accessUserId);
		taskInfo.addUserAssignee(this.accessUserName);
		queue.enqueue(function(context) {
			envianceSdk.tasks.updateTask(context.taskId, taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Fault when Group added as Assignee more than once", 2, function() {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfo());

		var taskInfo = this.buildTaskInfo();
		taskInfo.assignees = [];
		taskInfo.addUserAssignee(this.originalSystemId);
		taskInfo.addUserAssignee("Administrators");
		queue.enqueue(function(context) {
			envianceSdk.tasks.updateTask(context.taskId, taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Fault when user has no rights", 2, function() {
		var queue = new ActionQueue(this);
		var self = this;
		var restoreSession = function () {
			envianceSdk.configure({ sessionId: self.originalSessionId });
		};

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler)
				.fail(restoreSession);
		});

		var updateTaskInfo;
		queue.enqueue(function(context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
				"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
				"Ukraine", context.noManageRightsUserName, null, ["My"], null, [])
				.addUserAssignee(context.noManageRightsUserName)
				.addPathAssociatedObject(context.alternateObjectPath);
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");

					start();
				}).always(restoreSession);
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Fault when task does not exist", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		queue.enqueue(function(context) {
			envianceSdk.tasks.updateTask(context.anyGuid, taskInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Happy path - Modify all except DueDate, TimeZone and Objects for a completed task", 11, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, null, 100);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateTaskInfo;
		queue.enqueue(function(context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
				"JS Tests Other Name", "Other description", null, null, context.accessUserName, null, ["My"], null, [])
				.addUserAssignee(context.accessUserName)
				.addPathAssociatedObject(context.alternateObjectPath);
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(context.taskId,
				function(response) {
					var actual = response.result;
					var expected = updateTaskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					deepEqual(actual.dueDate, taskInfo.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, taskInfo.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, taskInfo.objects, "Objects are equal");
					ok(typeof actual.documents === "undefined", "Documents are not present");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Fault when modify DueDate and TimeZone for a completed task", 5, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, null, 100);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.updateTask(context.taskId, { "dueDate": new Date(context.dueDate.valueOf() + 60 * 60000) },
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5002, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.updateTask(context.taskId, { "timeZone": { "name": "Ukraine" } },
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5002, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task - Fault when replace (delete) schedule with completed statuses", 4, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"))
			.BuildDailyScheduleByInterval("00:00:00", 1));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = taskInfo.schedules[0].startDate;
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, null, 100);
			envianceSdk.tasks.completeTaskOccurrence(taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(taskId, {
				"schedules": [new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-02T00:00:00"))
				.BuildDailyScheduleByInterval("00:00:00", 1)]
			},
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5008, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task - Fault when modify schedule with completed statuses", 4, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"))
			.BuildDailyScheduleByInterval("00:00:00", 1));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = taskInfo.schedules[0].startDate;
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, null, 100);
			envianceSdk.tasks.completeTaskOccurrence(taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(taskId, {
				"schedules": [new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"))
				.BuildDailyScheduleByInterval("00:00:00", 2)]
			},
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5009, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task - Fault when new PeriodEndTime less than completed status duedate", 4, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"))
			.BuildDailyScheduleByInterval("00:00:00", 1));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = envianceSdk.IsoDate.parse("2014-04-04T00:00:00");
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, null, 100);
			envianceSdk.tasks.completeTaskOccurrence(taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var schedule = new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"),
			envianceSdk.IsoDate.parse("2014-04-03T00:00:00"))
				.BuildDailyScheduleByInterval("00:00:00", 1);

			envianceSdk.tasks.updateTask(taskId, {
				"schedules": [schedule]
			},
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5009, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task - Happy path - when modify PeriodEndTime with completed statuses", 3, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"))
			.BuildDailyScheduleByInterval("00:00:00", 1));

		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					taskId = response.result;
					context.taskIDsToClear.push(taskId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = envianceSdk.IsoDate.parse("2014-04-04T00:00:00");
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, null, 100);
			envianceSdk.tasks.completeTaskOccurrence(taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var schedule = new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"),
			envianceSdk.IsoDate.parse("2014-04-05T00:00:00"))
				.BuildDailyScheduleByInterval("00:00:00", 1);
			
			envianceSdk.tasks.updateTask(taskId, {
				"schedules": [schedule]
			},
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Check warnings", 4, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithWarnings();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function(context) {
			updateTaskInfo = context.buildTaskInfoWithWarnings();
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'createdBy\'") > 0, "Warning for 'createdBy' OK");
					ok(response.metadata.warnings.indexOf("\'createdOn\'") > 0, "Warning for 'createdOn' OK");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task with Schedules - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"),
			envianceSdk.IsoDate.parse("2014-04-03T00:00:00"))
			.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-10-11T00:00:00"))
			.BuildDailyScheduleByInterval("11:15:00", 10));
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo = new envianceSdk.tasks.TaskInfo("JS Tests Other Name");
		updateTaskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"),
			envianceSdk.IsoDate.parse("2015-04-03T00:00:00"))
			.BuildHourlySchedule("14:15:00", "18:45:00", ["Weekends"]));
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, updateTaskInfo.name, "Task names are equal");
					
					equal(response.result.schedules.length, 1, "Only one schedule left out of two");
					var actual = response.result.schedules[0];
					var expected = updateTaskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					deepEqual(actual.endDate, expected.endDate, "EndDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.endTime, expected.endTime, "EndTimes are equal");
					deepEqual(actual.daysOfWeek.sort(), expected.daysOfWeek.sort(), "DaysOfWeek are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task with Notifications - Happy path", 9, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, "task-notification-template-1"));
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(false, null, [this.accessUserId]),
			"Email"));
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo = new envianceSdk.tasks.TaskInfo("JS Tests Other Name");
		updateTaskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(true, true,
				new envianceSdk.tasks.TaskNotificationInfo.DueDateCondition("IntervalBefore", 5, "Hour"),
				new envianceSdk.tasks.TaskNotificationInfo.CompletionStatusCondition(">=", 30)),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true, true, [this.accessUserId], [this.originalSystemId]),
			"InboxAndEmail",
			"Notification comment",
			"task-notification-template-2"));
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, updateTaskInfo.name, "Task names are equal");

					equal(response.result.notifications.length, 1, "Only one notification left out of two");
					var actual = response.result.notifications[0];
					var expected = updateTaskInfo.notifications[0];
					deepEqual(actual.conditions, expected.conditions, "Conditions are equal");
					deepEqual(actual.recipients, expected.recipients, "Recipients are equal");
					equal(actual.deliveryMethod, expected.deliveryMethod, "DeliveryMethods are equal");
					equal(actual.comments, expected.comments, "Comments are equal");
					equal(actual.templateIdOrName, expected.templateIdOrName, "Notification Template names are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task with Schedule and Notification - Happy path when arrays aren't passed", 13, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox"));
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo = new envianceSdk.tasks.TaskInfo("JS Tests Other Name");
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, updateTaskInfo.name, "Task names are equal");
					
					equal(response.result.schedules.length, 1, "Only one schedule");
					var actual = response.result.schedules[0];
					var expected = taskInfo.schedules[0];
					equal(actual.recurrenceType, expected.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actual.startDate, expected.startDate, "StartDates are equal");
					equal(actual.startTime, expected.startTime, "StartTimes are equal");
					equal(actual.endTime, expected.endTime, "EndTimes are equal");
					deepEqual(actual.daysOfWeek.sort(), expected.daysOfWeek.sort(), "DaysOfWeek are equal");
					
					equal(response.result.notifications.length, 1, "Only one notification");
					actual = response.result.notifications[0];
					expected = taskInfo.notifications[0];
					deepEqual(actual.conditions, expected.conditions, "Conditions are equal");
					deepEqual(actual.recipients, expected.recipients, "Recipients are equal");
					equal(actual.deliveryMethod, expected.deliveryMethod, "DeliveryMethods are equal");
					
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task with Schedule and Notification - Happy path when empty arrays are passed", 5, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00"))
			.BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox"));
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo = new envianceSdk.tasks.TaskInfo("JS Tests Other Name");
		updateTaskInfo.schedules = [];
		updateTaskInfo.notifications = [];
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, updateTaskInfo.name, "Task names are equal");
					ok(!response.result.schedules || response.result.schedules.length == 0, "Existing schedules are deleted");
					ok(!response.result.notifications || response.result.notifications.length == 0, "Existing notifications are deleted");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task with Schedule and Notification - Happy path when Notification Template is set to null", 4, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		
		taskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, "task-notification-template-1"));
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo = new envianceSdk.tasks.TaskInfo();
		updateTaskInfo.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
			new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
			new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
			"Inbox", null, null));
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.notifications.length, 1, "Only one notification");
					equal(response.result.notifications[0].templateIdOrName, response.result.notifications[0].templateIdOrName, "Notification Template set to null");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Fault then trying to change schedule in Event Task", 7, function () {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		var eventId;
		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					var result = response.result;
					equal(result.id, eventId, "Ids are equal");
					ok(result.hasOwnProperty("taskId"), "TaskId is present");
					taskId = result.taskId;
					queue.executeNext();
				}, context.errorHandler);
		});
		
		queue.enqueue(function (context) {
			var schedule = new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-04-01T00:00:00"),
			envianceSdk.IsoDate.parse("2014-04-03T00:00:00"))
				.BuildDailyScheduleByInterval("00:00:00", 1);

			envianceSdk.tasks.updateTask(taskId, {
				"schedules": [schedule]
			},
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5010, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Change template - Happy path with Specified template", 16, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function (context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
					"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
					"Ukraine", context.accessUserName)
				.addUserAssignee(context.accessUserName)
				.addPathAssociatedObject(context.alternateObjectPath)
				.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00")).BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]));
			updateTaskInfo.templateIdOrName = context.taskTemplateName;
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					var actual = response.result;
					var expected = updateTaskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					// dueDate is not equal because it's updated for a task with schedules
					// deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					equal(actual.calendars.length, 3, "Calendars copied");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					equal(actual.documents.length, 1, "Document copied");
					equal(actual.notifications.length, 1, "Notification copied");
					equal(actual.templateIdOrName, expected.templateIdOrName, "TaskTemplateNames are equal");

					equal(actual.schedules.length, 1, "Own schedules are created");
					var actualSchedule = actual.schedules[0];
					var expectedSchedule = expected.schedules[0];
					equal(actualSchedule.recurrenceType, expectedSchedule.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actualSchedule.startDate, expectedSchedule.startDate, "StartDates are equal");
					equal(actualSchedule.startTime, expectedSchedule.startTime, "StartTimes are equal");
					equal(actualSchedule.recurrenceInterval, expectedSchedule.recurrenceInterval, "RecurrenceIntervals are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});


	asyncTest("Update Task - Change template - Happy path with Remove template", 16, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function (context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
					"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
					"Ukraine", context.accessUserName, null, ["My"], null, [])
				.addUserAssignee(context.accessUserName)
				.addPathAssociatedObject(context.alternateObjectPath)
				.addSchedule(new envianceSdk.tasks.TaskScheduleInfo(envianceSdk.IsoDate.parse("2014-01-22T00:00:00")).BuildHourlySchedule("13:45:00", "17:30:00", ["Sunday", "Monday"]))
				.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
					new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
					new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
					"Inbox", "Test Comment"));
			updateTaskInfo.templateIdOrName = '00000000-0000-0000-0000-000000000000';
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				},
				context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTask(context.taskId,
				function(response) {
					var actual = response.result;
					var expected = updateTaskInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Descriptions are equal");
					// dueDate is not equal because it's updated for a task with schedules
					// deepEqual(actual.dueDate, expected.dueDate, "DueDates are equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZones are equal");
					equal(actual.assignor, expected.assignor, "Assignors are equal");
					deepEqual(actual.calendars, expected.calendars, "Calendars are equal");
					deepEqual(actual.assignees, expected.assignees, "Assignees are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					ok(typeof actual.documents === "undefined", "Documents are not present");
					deepEqual(actual.notifications, expected.notifications, "Notifications are equal");
					ok(typeof actual.templateIdOrName === "undefined", "Task Template is not specified");

					equal(actual.schedules.length, 1, "Own schedules are created");
					var actualSchedule = actual.schedules[0];
					var expectedSchedule = expected.schedules[0];
					equal(actualSchedule.recurrenceType, expectedSchedule.recurrenceType, "RecurrenceTypes are equal");
					deepEqual(actualSchedule.startDate, expectedSchedule.startDate, "StartDates are equal");
					equal(actualSchedule.startTime, expectedSchedule.startTime, "StartTimes are equal");
					equal(actualSchedule.recurrenceInterval, expectedSchedule.recurrenceInterval, "RecurrenceIntervals are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task - Change template - Fault when Task Template with specified name does not exist", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function (context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
					"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
					"Ukraine", context.accessUserName, null, ["My"], null, [])
				.addUserAssignee(context.accessUserName)
				.addPathAssociatedObject(context.alternateObjectPath);
			updateTaskInfo.templateIdOrName = 'fake-task-template';
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Task - Change template - Fault when Task Template with specified ID does not exist", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithTemplate();
		this.addCreateTaskAction(queue, taskInfo);

		var updateTaskInfo;
		queue.enqueue(function (context) {
			updateTaskInfo = new envianceSdk.tasks.TaskInfo(
					"JS Tests Other Name", "Other description", new Date(context.dueDate.valueOf() + 60 * 60000),
					"Ukraine", context.accessUserName, null, ["My"], null, [])
				.addUserAssignee(context.accessUserName)
				.addPathAssociatedObject(context.alternateObjectPath);
			updateTaskInfo.templateIdOrName = '00000000-0000-0000-0000-000000000001';
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Task with template - Success when updating notifications of task that has template specified", 1, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var updateTaskInfo = new envianceSdk.tasks.TaskInfo()
				.addNotification(new envianceSdk.tasks.TaskNotificationInfo(
					new envianceSdk.tasks.TaskNotificationInfo.NotificationConditions(false, true),
					new envianceSdk.tasks.TaskNotificationInfo.NotificationRecipients(true),
					"Inbox", "Test Comment"));
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task with template - Success when updating documents of task that has template specified", 1, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var updateTaskInfo = new envianceSdk.tasks.TaskInfo().addDocument(this.documentPath);
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Task with template - Success when updating calendar settings of task that has template specified", 1, function () {
		var queue = new ActionQueue(this);

		this.addCreateTaskAction(queue, this.buildTaskInfoWithTemplate());
		var updateTaskInfo = new envianceSdk.tasks.TaskInfo();
		updateTaskInfo.calendars = ["My"];
		queue.enqueue(function (context) {
			envianceSdk.tasks.updateTask(context.taskId, updateTaskInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Task Occurrence - Happy path", 8, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 30, 10.5, 250, 'Comment');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, taskInfo.objects[0],
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result[0];
					var expected = occurrence;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Task Occurrence - Happy path - Multiple object task - Select both statuses", 16, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addPathAssociatedObject(this.alternateObjectPath);
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence1;
		var occurrence2;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence1 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1');
			occurrence2 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[1], true, null, 10.5, 250, 'Comment 2');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence1, occurrence2],
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.length, 2, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					actual = response.result[1];
					expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Task Occurrence - Happy path - Multiple object task - Select one status", 9, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addPathAssociatedObject(this.alternateObjectPath);
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence1;
		var occurrence2;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence1 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1');
			occurrence2 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[1], true, null, 10.5, 250, 'Comment 2');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence1, occurrence2],
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, context.alternateObjectPath,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.length, 1, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					equal(actual.objectIdOrPath, context.alternateObjectPath, 'Objects are equal');
					context.checkTaskOccurrenceInfo(actual, expected, false);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Task Occurrence - Fault when task does not exist", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.tasks.getTaskOccurrence(context.anyGuid, context.dueDate, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Task Occurrence - Check objects paths with '&' and ':'", 4, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addPathAssociatedObject(this.alternateObjectPath);
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, "Path with ':' should pass",
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, "Path with '&' should pass",
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Happy path", 16, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addPathAssociatedObject(this.alternateObjectPath);
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence1;
		var occurrence2;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			var date = new Date();
			date = new Date(date.getFullYear(), date.getMonth(), date.getDate()-1, date.getHours(), date.getMinutes(), 0);
			occurrence1 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1', date);
			occurrence2 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[1], true, null, 10.5, 250, 'Comment 2', date);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence1, occurrence2],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function(response) {
					equal(response.result.length, 2, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					actual = response.result[1];
					expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Happy path with dueDate in string format", 16, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addPathAssociatedObject(this.alternateObjectPath);
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence1;
		var occurrence2;
		queue.enqueue(function (context) {
			var dueDate = envianceSdk.IsoDate.toLocalString(taskInfo.dueDate);
			var date = new Date();
			date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes(), 0);
			occurrence1 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1', date);
			occurrence2 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[1], true, null, 10.5, 250, 'Comment 2', date);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence1, occurrence2],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = envianceSdk.IsoDate.toLocalString(taskInfo.dueDate);
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function (response) {
					equal(response.result.length, 2, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					actual = response.result[1];
					expected = occurrence1.objectIdOrPath == actual.objectIdOrPath ? occurrence1 : occurrence2;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});


	asyncTest("Complete Task Occurrence - Happy path - Without StatusDate", 9, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], true, 0, 0, 0, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function (response) {
					equal(response.result.length, 1, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Complete Task Occurrence - Happy path - PercentComplete, HoursToComplete and CostToComplete are equal to zero", 13, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var taskTimeZoneInfo;
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(context.taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for getTask is correct");
					taskTimeZoneInfo = response.result.timeZone;
					queue.executeNext();
				}, context.errorHandler);
		});
		
		var occurrence;
		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			var now = new Date();
			var date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), ~~(now.getUTCMinutes() / 15) * 15 /*business works in this way*/, 0);
			date.setHours(date.getHours() + (taskTimeZoneInfo.currentOffset / 60));
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 0, 0, 0, 'Comment 1', date);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for completeTaskOccurrence is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function (response) {
					equal(response.result.length, 1, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence;
					context.checkTaskOccurrenceInfo(actual, expected, true);
					equal(actual.percentComplete, 0, "percentComplete is equal to zero");
					equal(actual.hoursToComplete, 0, "hoursToComplete is equal to zero");
					equal(actual.costToComplete, 0, "costToComplete is equal to zero");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Happy path - Complete group", 14, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		taskInfo.addPathAssociatedObject(this.alternateObjectPath);
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, false, 50, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function(response) {
					equal(response.result.length, 2, "Response result infos count OK");
					var actual = response.result[0];
					var expected = occurrence;
					context.checkTaskOccurrenceInfo(actual, expected, false);
					actual = response.result[1];
					context.checkTaskOccurrenceInfo(actual, expected, false);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Happy path - Activate dimissed task", 7, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			var statusChangeDate = new Date();
			statusChangeDate = new Date(statusChangeDate.getFullYear(), statusChangeDate.getMonth(), statusChangeDate.getDate()-1,
				statusChangeDate.getHours(), statusChangeDate.getMinutes(), 0);
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], true, null, 3, 10, "Dismissed task", statusChangeDate);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			occurrence.dismissed = false;
			occurrence.comment = "Activated task";
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, taskInfo.dueDate, null, [occurrence],
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTaskOccurrence(context.taskId, taskInfo.dueDate, null,
				function (response) {
					equal(response.result.length, 1, "Response result info count OK");
					context.checkTaskOccurrenceInfo(response.result[0], occurrence, false);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when task does not exist", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, false, 50, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.anyGuid, context.dueDate, null, [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when percent complete greater than 100", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, false, 150, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.anyGuid, context.dueDate, null, [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Complete Task Occurrence - Fault when Status Change Date set in future", 2, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);
		
		var futureStatusChangeDate = new Date();
		futureStatusChangeDate = new Date(futureStatusChangeDate.getFullYear() + 1, futureStatusChangeDate.getMonth(), futureStatusChangeDate.getDate(),
			futureStatusChangeDate.getHours(), futureStatusChangeDate.getMinutes(), 0);
		
		queue.enqueue(function (context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, false, 10, 0, 0, '', futureStatusChangeDate);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, taskInfo.dueDate, null, [occurrence],
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Complete Task Occurrence - Fault when invalid percent complete granularity", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(null, false, 13, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.anyGuid, context.dueDate, null, [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when empty object info duplicated", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			var occurrence1 = new envianceSdk.tasks.TaskOccurrenceInfo(null, false, 50, 5.8, 10, 'Comment 1');
			var occurrence2 = new envianceSdk.tasks.TaskOccurrenceInfo(null, true, null, 10.5, 250, 'Comment 2');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence1, occurrence2],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5003, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when object is not included to task", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(context.alternateObjectPath, false, 50, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5004, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when objectIdOrPath specified in URL and complete more than one TaskOccurrenceInfo", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence1;
		var occurrence2;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence1 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1');
			occurrence2 = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[1], true, null, 10.5, 250, 'Comment 2');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, taskInfo.objects[0], [occurrence1, occurrence2],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5005, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when objectPath in URL and objectPath in TaskOccurrenceInfo not equal", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(context.objectPath, false, 50, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, context.alternateObjectPath, [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 5006, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when objectPath in URL does not exist", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, taskInfo.objects[0] + "_wrong", [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Fault when objectId in URL does not exist", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(createUUID(), false, 50, 5.8, 10, 'Comment 1');
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, createUUID(), [occurrence],
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Occurence not updated when it is dissmissed already", 9, function () {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfo();
		this.addCreateTaskAction(queue, taskInfo);

		var clearingOccurrence;
		queue.enqueue(function (context) {
			clearingOccurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], true, 0, 0, 0, '', new Date(1));
			clearingOccurrence.comment = '';
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, taskInfo.dueDate, taskInfo.objects[0], [clearingOccurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Task Occurrence clearing is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var occurrence;
		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			var date = new Date();
			date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes(), 0);
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], true, 50, 5.8, 10, 'Comment 1', date);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, null, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var dueDate = taskInfo.dueDate;
			envianceSdk.tasks.getTaskOccurrence(context.taskId, dueDate, null,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for saved Task Occurrence is correct");
					var taskOccurrence = response.result;
					equal(taskOccurrence[0].objectIdOrPath, clearingOccurrence.objectIdOrPath, "Task status object equal");
					equal(taskOccurrence[0].statusChangeDate.toUTCString(), clearingOccurrence.statusChangeDate.toUTCString(), "Task status status change dates are not equal");
					equal(taskOccurrence[0].percentComplete, clearingOccurrence.percentComplete, "Task status percent complete not equal");
					equal(taskOccurrence[0].hoursToComplete, clearingOccurrence.hoursToComplete, "Task status hours to complete not equal");
					equal(taskOccurrence[0].costToComplete, clearingOccurrence.costToComplete, "Task status cost to complete not equal");
					equal(taskOccurrence[0].comment, clearingOccurrence.comment, "Task status comment not equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Complete Task Occurrence - Check warnings", 2, function() {
		var queue = new ActionQueue(this);

		var taskInfo = this.buildTaskInfoWithWarnings();
		this.addCreateTaskAction(queue, taskInfo);

		var occurrence;
		queue.enqueue(function(context) {
			var dueDate = taskInfo.dueDate;
			var statusChangeDate = new Date();
			statusChangeDate = new Date(statusChangeDate.getFullYear(), statusChangeDate.getMonth(), statusChangeDate.getDate() - 1, statusChangeDate.getHours(), statusChangeDate.getMinutes(), 0);
			occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskInfo.objects[0], false, 50, 5.8, 10, 'Comment 1', statusChangeDate);
			envianceSdk.tasks.completeTaskOccurrence(context.taskId, dueDate, taskInfo.objects[0], [occurrence],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'objectIdOrPath\'") > 0, "Warning for 'objectIdOrPath' OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
}


if (typeof (UnitTestsApplication) == "undefined") {
	executeTaskServiceTests();
}