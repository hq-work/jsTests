if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Events', execute: executeEventServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof eventConfig == "undefined")
	eventConfig = { };

function executeEventServiceTests() {
	module("Event Service", {
		setup: function() {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			this.accessUserName = eventConfig.accessUserName || this.accessUserName;
			this.noAccessUserName = eventConfig.noAccessUserName || "jstestsNotAccessUser";
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (eventConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.password = eventConfig.password || "1111";

			this.eventIdsToClear = [];

			this.anyGuid = "B0968441-CFEC-4FBA-BDE6-47CBA09DEF33";
			this.eventLogPath = "/UDF_division/UDF_facility/UDF_event log manual";
			this.eventLogTag = "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789v";
			this.autoEventLogId = "FF7831F9-EA4B-4825-81A3-A404EC6CDEB4";
			this.otherManualEventLogId = "E75CD2C4-B84D-436C-80C2-70FF56C0CA31";
			this.eventInstanceTag = "Unique Tag-  yes";
			this.autoEventInstanceTag = "Auto Event Instance Tag 1";
			this.requirementPath = "/UDF_division/UDF_facility/UDF_parameter";
			this.requirementId = "AF068B0E-B744-48A9-AB02-36BAEDE0A63E";
			this.documentPath = "/250/99999.xls";
			this.name = "Js Test Event Instance";
			
			var date = new Date();
			this.beginDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30, 0);
			this.endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 31, 0);

			this.cfTextLarge = "XLS2_Text Box_Large (7900 char max)";
			this.cfTextMedium = "XLS2_Text Box_Medium (50 char max)";
			this.cfTextSmall = "XLS2_Text Box_Small (20 char max)";
			this.cfTextDDL = "XLS2_Text Box_Dropdown List";
			this.cfTextDDLLinked = "XLS2_Text Box_Dropdown List_linked";
			this.cfTextDDLWithTB = "XLS2_Text Box_Dropdown List with Text Box";
			this.cfMultiLB = "XLS2_Multi- Selection List Box";
			this.cfNum = "XLS_kio_num_txtbox";
			this.cfNumDDL = "XLS_kio_num_ddl1";
			this.cfNumDDLLinked = "XLS_kio_num_ddl2_linklist";
			this.cfNumDDLWithTB = "n_ddl_w_tb";
			this.cfNumLookup = "XLS_kio_num_numlookup1";
			this.cfNumLookopLinked = "XLS_kio_num_numlookup2_linklist";
			this.cfDate = "XLS_UDF_date";
			this.cfTime = "XLS_UDF_time";
			this.cfDateTime = "XLS_UDF_date time";
			this.cfBoolDDL = "XLS_kio_true-false_ddl";
			this.cfBoolCB = "XLS2_true/false_Check Box";
			this.cfHyperlink = "MAS Hyperlink";

			this.buildEventInfo = function(state, complianceType) {
				return new envianceSdk.events.EventInfo(
					this.name, this.beginDate, this.endDate,
					state || "Open", complianceType || "Regulatory",
					false, this.requirementPath)
					.addDocument(this.documentPath)
					.addScalarFieldValue(this.cfTextLarge, "XLS2_Text Box_Large (7900 char max)")
					.addScalarFieldValue(this.cfTextMedium, "XLS2_Text Box_Medium (50 char max)")
					.addScalarFieldValue(this.cfTextSmall, "Small (20 char max)")
					.addScalarFieldValue(this.cfTextDDL, "1234567890")
					.addLinkedFieldValues(this.cfTextDDLLinked, ["23:59", "simple text"])
					.addScalarFieldValue(this.cfTextDDLWithTB, "Hello World!")
					.addMultiFieldValues(this.cfMultiLB, ["True", "Select", "31.12.2011", "11:59 AM"])
					.addScalarFieldValue(this.cfNum, "456")
					.addScalarFieldValue(this.cfNumDDL, "0.01")
					.addLinkedFieldValues(this.cfNumDDLLinked, ["200.02", "20.05"])
					.addScalarFieldValue(this.cfNumDDLWithTB, "5.5")
					.addScalarFieldValue(this.cfNumLookup, "12:00")
					.addLinkedFieldValues(this.cfNumLookopLinked, ["8/8/88", "9/9/99"])
					.addDateFieldValue(this.cfDate, "2012-07-17")
					.addTimeFieldValue(this.cfTime, "10:30 PM")
					.addDateFieldValue(this.cfDateTime, "2012-10-11T19:40")
					.addScalarFieldValue(this.cfBoolDDL, "Yes")
					.addScalarFieldValue(this.cfBoolCB, "False")
					.addUrlFieldValue(this.cfHyperlink, "HyperLink label", "http://moto.kiev.ua");
			};

			this.compareEventInfo = function(actual, expected, tzOffset) {
				equal(actual.name, expected.name, "Names are equal");
				deepEqual(actual.beginDate, expected.beginDate, "BeginDates are equal");
				deepEqual(actual.endDate, expected.endDate, "EndDates are equal");
				equal(actual.state, expected.state, "States are equal");
				equal(actual.complianceType, expected.complianceType, "ComplianceTypes are equal");
				equal(actual.acceptAsDeviation, expected.acceptAsDeviation, "AcceptAsDeviations are equal");
				equal(actual.requirementIdOrPath, expected.requirementIdOrPath, "Requirements are equal");
				deepEqual(actual.documents, expected.documents, "Documents are equal");

				this.compareEventInfoUdfs(actual, expected, tzOffset);
			};
			
			this.compareEventInfoUdfs = function (actual, expected, tzOffset) {
				// Fields
				var actualFields = toMap(actual.fields, function (field) { return field.name; });
				var expectedFields = toMap(expected.fields, function (field) { return field.name; });

				deepEqual(actualFields[this.cfTextLarge], expectedFields[this.cfTextLarge], "Large texts are equal");
				deepEqual(actualFields[this.cfTextMedium], expectedFields[this.cfTextMedium], "Medium texts are equal");
				deepEqual(actualFields[this.cfTextSmall], expectedFields[this.cfTextSmall], "Small texts are equal");
				deepEqual(actualFields[this.cfTextDDL], expectedFields[this.cfTextDDL], "Text DDLs are equal");
				deepEqual(actualFields[this.cfTextDDLLinked], expectedFields[this.cfTextDDLLinked], "Test Linked DDLs are equal");
				deepEqual(actualFields[this.cfTextDDLWithTB], expectedFields[this.cfTextDDLWithTB], "Test DDLs with TB are equal");
				deepEqual(actualFields[this.cfMultiLB], expectedFields[this.cfMultiLB], "MultiSelects are equal");
				deepEqual(actualFields[this.cfNum], expectedFields[this.cfNum], "Numerics are equal");
				deepEqual(actualFields[this.cfNumDDL], expectedFields[this.cfNumDDL], "Numeric DDLs are equal");
				deepEqual(actualFields[this.cfNumDDLLinked], expectedFields[this.cfNumDDLLinked], "Numeric Linked DDLs are equal");
				deepEqual(actualFields[this.cfNumDDLWithTB], expectedFields[this.cfNumDDLWithTB], "Numeric DDLs with TB are equal");
				deepEqual(actualFields[this.cfNumLookup], expectedFields[this.cfNumLookup], "Numeric Lookups are equal");
				deepEqual(actualFields[this.cfNumLookopLinked], expectedFields[this.cfNumLookopLinked], "Numeric Linked Lookups are equal");

				var actDate = actualFields[this.cfDate];
				actDate = new envianceSdk.customFields.DateFieldValue(actDate.name, actDate.values[0]);
				deepEqual(actDate, expectedFields[this.cfDate], "Dates are equal");

				var actTime = actualFields[this.cfTime];
				actTime = new envianceSdk.customFields.TimeFieldValue(actTime.name, actTime.values[0]);
				deepEqual(actTime, expectedFields[this.cfTime], "Times are equal");

				var expectedDatetime = new Date(Date.parse(expectedFields[this.cfDateTime].values[0]) - tzOffset * 60000);
				deepEqual(new Date(actualFields[this.cfDateTime].values[0]), expectedDatetime, "DateTimes are equal");

				deepEqual(actualFields[this.cfBoolDDL], expectedFields[this.cfBoolDDL], "Bool DDLs are equal");
				deepEqual(actualFields[this.cfBoolCB], expectedFields[this.cfBoolCB], "Bool CBs are equal");
				if (this.cfHyperlink in expectedFields) {
					deepEqual(actualFields[this.cfHyperlink], expectedFields[this.cfHyperlink], "Hyperlinks are equal");
				}
			};
		},

		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var i = 0; i < this.eventIdsToClear.length;i++){
				stop();
				envianceSdk.events.deleteEvent(this.eventLogTag, this.eventIdsToClear[i],
					function() {
						start();
					},
					function() {
						start();
					});
			}
		}
	});

	asyncTest("Create Event - Happy path - All Properties", 30, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tzOffset;
		queue.enqueue(function(context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tzOffset = response.result.userTimeZone.currentOffset;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareEventInfo(response.result, eventInfo, tzOffset);

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Event - Fault if Name is empty", 2, function() {
		var eventInfo = this.buildEventInfo();
		delete eventInfo['name'];

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if BeginDate is empty", 2, function() {
		var eventInfo = this.buildEventInfo();
		delete eventInfo['beginDate'];

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if BeginDate value has invalid format", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.beginDate = 'invalid date';

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 500, "Status code OK");
				equal(response.error.errorNumber, 0, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if EndDate value has invalid format", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.endDate = 'invalid date';

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 500, "Status code OK");
				equal(response.error.errorNumber, 0, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if EndDate is empty", 2, function() {
		var eventInfo = this.buildEventInfo();
		delete eventInfo['endDate'];

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if Name length more than 255", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.name = "Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255;";

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});
	
	asyncTest("Create Event - Happy path - Check warnings", 4, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.id = this.anyGuid;
		eventInfo.taskId = this.anyGuid;

		var context = this;

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code OK");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
				ok(response.metadata.warnings.indexOf("\'taskId\'") > 0, "Warning for 'taskId' OK");
				context.eventIdsToClear.push(response.result);
				start();
			}, this.errorHandler);
	});

	asyncTest("Create Event - Fault if Event Log Id is invalid", 2, function() {
		var eventInfo = this.buildEventInfo();

		envianceSdk.events.createEvent(this.anyGuid, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if Event Log Tag is invalid", 2, function() {
		var eventInfo = this.buildEventInfo();

		envianceSdk.events.createEvent("This is any tag he-he-he", eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if Event Log is not Manual", 2, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.autoEventLogId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 7001, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Event - Fault if Requirement Path is invalid", 2, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		eventInfo.requirementIdOrPath = "/Invalid/requirement/Path";
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 7003, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create Event - Fault if Requirement ID is not a requirement ID", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.requirementIdOrPath = this.anyGuid;

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 7003, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if Requirement is not tracked by the Event Log", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.requirementIdOrPath = "/UDF_division/UDF_facility/XLS_par. Req. empty_fields";

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 7003, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if one of the Fields breaks validation rules", 2, function() {
		var eventInfo = this.buildEventInfo();
		var fields = toMap(eventInfo.fields, function(field) { return field.name; });
		fields[this.cfBoolDDL].values[0] = "Should be numeric";

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if has invalid Field name", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.fields[0].name = "This is a name of non-existent UDF";

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if has invalid Document path", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.addDocument("/Invalid Document Path/And Document.xls");

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Event - Fault if has invalid Document GUID", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.addDocument(this.anyGuid);

		envianceSdk.events.createEvent(this.eventLogTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});
	
	asyncTest("Get Event - Happy path - All Properties", 30, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tzOffset;
		queue.enqueue(function(context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tzOffset = response.result.userTimeZone.currentOffset;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareEventInfo(response.result, eventInfo, tzOffset);

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Event - Fault if Event Log Id is invalid", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.anyGuid, context.eventInstanceTag,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Event - Fault if Event Log Tag is invalid", 2, function() {
		envianceSdk.events.getEvent("This is any tag he-he-he", this.eventInstanceTag,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Get Event - Fault if Event is not belongs to Event Log", 2, function() {
		envianceSdk.events.getEvent(this.otherManualEventLogId, this.eventInstanceTag,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 7002, "Error number OK");
				start();
			});
	});

	asyncTest("Get Event - Happy path - Id and TaskId populated", 5, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					var result = response.result;
					equal(result.id, eventId, "Ids are equal");
					ok(result.hasOwnProperty("taskId"), "TaskId is present");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Delete Event - Happy path", 3, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.deleteEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Delete Event - Fault if Event Instance Id is invalid", 2, function() {
		envianceSdk.events.deleteEvent(this.eventLogTag, this.anyGuid,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Delete Event - Fault if Event Log Tag is invalid", 4, function() {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.deleteEvent("This is any tag he-he-he", eventId,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Event - Fault if Event Log is not Manual", 2, function() {
		envianceSdk.events.deleteEvent(this.autoEventLogId, this.eventInstanceTag,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 7001, "Error number OK");
				start();
			});
	});

	asyncTest("Delete Event - Fault if Event is not belongs to Event Log", 2, function() {
		envianceSdk.events.deleteEvent(this.otherManualEventLogId, this.eventInstanceTag,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 7002, "Error number OK");
				start();
			});
	});

	asyncTest("Update Event - Happy path - All Properties", 31, function() {
		var queue = new ActionQueue(this);

		var eventInfo = new envianceSdk.events.EventInfo(
			"A name", this.beginDate, this.endDate, "Closed", "Internal",
			true, this.requirementPath);
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo = context.buildEventInfo();
			delete eventInfo['requirementIdOrPath'];
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tzOffset;
		queue.enqueue(function(context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tzOffset = response.result.userTimeZone.currentOffset;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					var expected = eventInfo;
					expected.requirementIdOrPath = context.requirementPath;
					context.compareEventInfo(response.result, expected, tzOffset);

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Happy path - Without Properties", 13, function() {
		var queue = new ActionQueue(this);

		var eventInfo = new envianceSdk.events.EventInfo(
			"A name", this.beginDate, this.endDate, "Closed", "Internal",
			true, this.requirementPath);
		var eventId;

		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo = context.buildEventInfo();
			delete eventInfo['requirementIdOrPath'];
			delete eventInfo['fields'];
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");

					var expected = eventInfo;
					expected.requirementIdOrPath = context.requirementPath;

					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					deepEqual(actual.beginDate, expected.beginDate, "BeginDates are equal");
					deepEqual(actual.endDate, expected.endDate, "EndDates are equal");
					equal(actual.state, expected.state, "States are equal");
					equal(actual.complianceType, expected.complianceType, "ComplianceTypes are equal");
					equal(actual.acceptAsDeviation, expected.acceptAsDeviation, "AcceptAsDeviations are equal");
					equal(actual.requirementIdOrPath, expected.requirementIdOrPath, "Requirements are equal");
					deepEqual(actual.documents, expected.documents, "Documents are equal");
					ok(actual.fields.length == 0, 'Fields collection is empty - OK');
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Happy path - Without Documents", 12, function() {
		var queue = new ActionQueue(this);

		var eventInfo = new envianceSdk.events.EventInfo(
			"A name", this.beginDate, this.endDate, "Closed", "Internal",
			true, this.requirementPath);
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo = context.buildEventInfo();
			delete eventInfo['requirementIdOrPath'];
			delete eventInfo['fields'];
			delete eventInfo['documents'];
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					var expected = eventInfo;
					expected.requirementIdOrPath = context.requirementPath;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					deepEqual(actual.beginDate, expected.beginDate, "BeginDates are equal");
					deepEqual(actual.endDate, expected.endDate, "EndDates are equal");
					equal(actual.state, expected.state, "States are equal");
					equal(actual.complianceType, expected.complianceType, "ComplianceTypes are equal");
					equal(actual.acceptAsDeviation, expected.acceptAsDeviation, "AcceptAsDeviations are equal");
					equal(actual.requirementIdOrPath, expected.requirementIdOrPath, "Requirements are equal");
					ok(!actual.hasOwnProperty('documents'), "Documents is missing - OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Happy path - Check warnings (Manual)", 8, function() {
		var queue = new ActionQueue(this);

		var eventInfo = new envianceSdk.events.EventInfo(
			"A name", this.beginDate, this.endDate, "Closed", "Internal",
			true, this.requirementPath);
		var eventId;
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo = context.buildEventInfo();
			eventInfo.id = context.anyGuid;
			eventInfo.taskId = context.anyGuid;
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'taskId\'") > 0, "Warning for 'taskId' OK");
					ok(response.metadata.warnings.indexOf("\'beginDate\'") < 0, "Warning for 'beginDate' OK");
					ok(response.metadata.warnings.indexOf("\'endDate\'") < 0, "Warning for 'endDate' OK");
					ok(response.metadata.warnings.indexOf("\'requirementIdOrPath\'") < 0, "Warning for 'requirementIdOrPath' OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Happy path - Check warnings (Automatic)", 6, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.id = this.anyGuid;
		eventInfo.taskId = this.anyGuid;
		delete eventInfo['fields'];

		envianceSdk.events.updateEvent(this.autoEventLogId, this.autoEventInstanceTag, eventInfo,
			function(response) {
				equal(response.metadata.statusCode, 204, "Status code OK");
				ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
				ok(response.metadata.warnings.indexOf("\'taskId\'") > 0, "Warning for 'taskId' OK");
				ok(response.metadata.warnings.indexOf("\'beginDate\'") > 0, "Warning for 'beginDate' OK");
				ok(response.metadata.warnings.indexOf("\'endDate\'") > 0, "Warning for 'endDate' OK");
				ok(response.metadata.warnings.indexOf("\'requirementIdOrPath\'") > 0, "Warning for 'requirementIdOrPath' OK");
				start();
			}, this.errorHandler);
	});
	
	asyncTest("Update Event - Happy path - Clear all UDF values", 5, function () {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();

		var eventId;
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

		var updateEventInfo = new envianceSdk.events.EventInfo();
		updateEventInfo.fields = [];
		updateEventInfo.fields.push({ name: this.cfTextLarge, values: [null] });
		updateEventInfo.fields.push({ name: this.cfTextMedium, values: [null] });
		updateEventInfo.fields.push({ name: this.cfTextSmall, values: [null] });
		updateEventInfo.fields.push({ name: this.cfTextDDL, values: [null] });
		updateEventInfo.fields.push({ name: this.cfTextDDLLinked, values: [null] });
		updateEventInfo.fields.push({ name: this.cfTextDDLWithTB, values: [null] });
		updateEventInfo.fields.push({ name: this.cfMultiLB, values: [null] });
		updateEventInfo.fields.push({ name: this.cfNum, values: [null] });
		updateEventInfo.fields.push({ name: this.cfNumDDL, values: [null] });
		updateEventInfo.fields.push({ name: this.cfNumDDLLinked, values: [null] });
		updateEventInfo.fields.push({ name: this.cfNumDDLWithTB, values: [null] });
		updateEventInfo.fields.push({ name: this.cfNumLookup, values: [null] });
		updateEventInfo.fields.push({ name: this.cfNumLookopLinked, values: [null] });
		updateEventInfo.fields.push({ name: this.cfDate, values: [null] });
		updateEventInfo.fields.push({ name: this.cfTime, values: [null] });
		updateEventInfo.fields.push({ name: this.cfDateTime, values: [null] });
		updateEventInfo.fields.push({ name: this.cfBoolDDL, values: [null] });
		updateEventInfo.fields.push({ name: this.cfBoolCB, values: [null] });
		updateEventInfo.fields.push({ name: this.cfHyperlink, urlItems: [null] });
		
		queue.enqueue(function (context) {
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, updateEventInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					var actual = response.result;
					equal(actual.fields.length, 0, "Field values are absent");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update Event - Happy path - Clear single UDF value", 23, function () {
		var queue = new ActionQueue(this);

		var eventInfo = this.buildEventInfo();

		var eventId;
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

		var updateEventInfo = new envianceSdk.events.EventInfo();
		updateEventInfo.fields = [];
		updateEventInfo.fields.push({ name: this.cfHyperlink, urlItems: [null] });

		queue.enqueue(function (context) {
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, updateEventInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});
		
		var tzOffset;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function (response) {
					tzOffset = response.result.userTimeZone.currentOffset;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.events.getEvent(context.eventLogTag, eventId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					var expected = eventInfo;
					expected.fields.splice(-1, 1);
					var actual = response.result;
					equal(actual.fields.length, 18, "18 UDF Values left");
					context.compareEventInfoUdfs(actual, expected, tzOffset);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if Event Log Id is invalid", 2, function() {
		envianceSdk.events.updateEvent(this.anyGuid, this.eventInstanceTag, this.buildEventInfo(),
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Update Event - Fault if Event Log Tag is invalid", 2, function() {
		envianceSdk.events.updateEvent("This is any tag he-he-he", this.eventInstanceTag, this.buildEventInfo(),
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Update Event - Fault if Event Instance Id is invalid", 2, function() {
		envianceSdk.events.updateEvent(this.eventLogTag, this.anyGuid, this.buildEventInfo(),
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Update Event - Fault if Event is not belongs to Event Log", 2, function() {
		envianceSdk.events.updateEvent(this.otherManualEventLogId, this.eventInstanceTag, this.buildEventInfo(),
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 7002, "Error number OK");
				start();
			});
	});

	asyncTest("Update Event - Fault if Name length more than 255", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.name = "Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255; Length of this name is more than 255;";
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if Name length more than 255 - Automatic", 2, function() {
		var eventInfo = this.buildEventInfo();
		eventInfo.name = new Array(257).join("s");
		envianceSdk.events.updateEvent(this.autoEventLogId, this.autoEventInstanceTag, eventInfo,
			this.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Update Event - Fault if BeginDate value has invalid format", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
		eventInfo.beginDate = 'invalid date';
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					equal(response.error.errorNumber, 0, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if EndDate value has invalid format", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.endDate = 'invalid date';
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					equal(response.error.errorNumber, 0, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if Requirement Path is invalid", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.requirementIdOrPath = "/Invalid/requirement/Path";
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 7003, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if Requirement ID is not a requirement ID", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.requirementIdOrPath = context.anyGuid;
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 7003, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if has invalid Field name", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.fields[0].name = "This is a name of non-existent UDF";
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if has invalid Document path", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.addDocument("/Invalid Document Path/And Document.xls");
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Event - Fault if has invalid Document GUID", 4, function() {
		var queue = new ActionQueue(this);

		var eventId;
		var eventInfo = this.buildEventInfo();
		queue.enqueue(function(context) {
			envianceSdk.events.createEvent(context.eventLogTag, eventInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					eventId = response.result;
					context.eventIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			eventInfo.addDocument(context.anyGuid);
			envianceSdk.events.updateEvent(context.eventLogTag, eventId, eventInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
}

if (typeof (UnitTestsApplication) == "undefined") {
	executeEventServiceTests();
}