if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Activities', execute: executeActivitiesServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof activitiesConfig == "undefined")
	activitiesConfig = {};

function executeActivitiesServiceTests() {
	module("Activities Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (activitiesConfig.noManageRightsUserName || "userWPermissionsActivities") + qUnitDbSuffix;
			this.password = activitiesConfig.password || "1111";

			this.activityIdsToClear = [];

			this.activity1ID = "EC4E6D1E-0932-4E47-91AD-87F26ECC6143";
			this.activity2ID = "81BFF172-1E70-4886-80D4-6FE641A11047";
			this.activity3ID = "81FBD172-1E70-4886-80D4-6FE641A11047";
			this.activity1Name = "Activity 1";
			this.anyGuid = "074265D2-94FF-41EE-BF64-EAB31C54CB1B";
			this.template2Name = "Material Template 2";
			this.template2ID = "EC739C75-4F7C-437B-A8AC-9955AF9CCAAD";			
			this.materialProperty2Name = "Material Property 2";
			this.materialPropertyID = "b19c37c4-fb19-4e0d-8554-e703147d206e";
			this.materialProperty3ID = "e455e2e1-8189-4c5f-a5b0-a6f948e7d603";
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
			this.someVhGuid = "3eb69859-8ab7-412f-9f4a-5bef6df3c68e";
			this.someVhGuid2 = "9ub69859-8ab7-312q-9q3a-5buq6dq9c68u";
			this.deleteId1 = "8e0d785d-07f9-4ebe-845e-9e325908dd5c";
			this.wrongGuid = "074265D2-07f9-41EE-845e-EAB31C54TU1B";
			
			this.buildActivityInfo = function (name, template) {
				var date = new Date();
				var beginDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30, 0);				
				return new envianceSdk.activities.ActivityInfo(
					name, "Description", template)
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
					.addProperty(this.materialProperty3ID, [new envianceSdk.activities.MaterialValueHistoryInfo(beginDate, 0)])
					.addProperty(this.materialPropertyID);
			};
			
			this.initUserTimeZoneOffSet = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.authentication.getCurrentSession(
						function (response) {
							this.tzOffset = response.result.userTimeZone.currentOffset;
							queue.executeNext();
						}, context.errorHandler);
				});
			};

			//This fn compares properties values and propertyIdOrName, reason - expected has fn addValue, actual - doesn't.
			this.comparePropertiesFull = function (actual, expected) {
				if (actual.length != expected.length) {
					throw new Error("Actual length " + actual.length + " doesn't match expected legth " + expected.length);
				}
				else {
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].propertyIdOrName, expected[i].propertyIdOrName, "Property " + i + " Ids or Names are equal");
						deepEqual(actual[i].value, expected[i].value, "Property " + i + " Values are equal");
					}
				}
			};
			
			//This fn compares only properties values, reason - FromBusinessEntityConverter.cs sets
			//Id in propertyIdOrName, while expected value has name in corresponding field
			this.comparePropertiesValues = function (actual, expected) {
				if (actual.length != expected.length) {
					throw new Error("Actual length " + actual.length + " doesn't match expected legth " + expected.length);
				}
				else {
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].value, expected[i].value, "Property " + i + " Values are equal");
					}
				}
			};
			
			this.compareActivityInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Desctiptions are equal");

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
				var expectedFieldsDatetime = new Date(Date.parse(expectedFields[this.cfDateTime].values[0]));							
				var expectedDatetime = new Date(expectedFieldsDatetime - tzOffset * 60000);
				deepEqual(new Date(actualFields[this.cfDateTime].values[0]), expectedDatetime, "DateTimes are equal");
				deepEqual(actualFields[this.cfBoolDDL], expectedFields[this.cfBoolDDL], "Bool DDLs are equal");
				deepEqual(actualFields[this.cfBoolCB], expectedFields[this.cfBoolCB], "Bool CBs are equal");
			};
		},

		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			for (var d = this.activityIdsToClear.length - 1; d >= 0; d--) {
				envianceSdk.activities.deleteActivity(this.activityIdsToClear[d],
					function () {
						start();
					}, this.errorHandler);
				stop();
			}
		},
		
		_authenticate: function(queue, user) {
			queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(user, context.password,
				function() {
					queue.executeNext();
				},
				context.errorHandler);
			});
		}
		
	});
	
	asyncTest("Get Activity - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(context.activity1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get Activity - Happy path - By Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(context.activity1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Activity - Fault if invalid ID", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Get Activity - Fault if invalid Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity("Invalid activity name",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Get Activity - Fault user has no rights", 2, function () {
		var queue = new ActionQueue(this);
		
		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(context.activity1ID,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create Activity - Happy path - Check warnings", 26, function () {
		var queue = new ActionQueue(this);
		this.initUserTimeZoneOffSet(queue);
		var activityInfo = this.buildActivityInfo("Create Activity - Happy path - Check warnings", this.template2ID);
		activityInfo.id = this.anyGuid;

		var activityId;
		queue.enqueue(function(context) {
			envianceSdk.activities.createActivity(activityInfo,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");										
					context.activityIdsToClear.push(response.result);
					activityId = response.result;
					queue.executeNext();
				}, this.errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(activityId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareActivityInfo(response.result, activityInfo);
					context.comparePropertiesFull(response.result.properties, activityInfo.properties);
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});
	
	asyncTest("Create Activity - Fault if no properties", 1, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("Create Activity - Fault if no properties", this.template2ID);
		activityInfo.properties = [];
		queue.enqueue(function (context) {
			envianceSdk.activities.createActivity(activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Activity - Fault if duplicate properties", 1, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("Create Activity - Fault if duplicate properties", this.template2ID);
		activityInfo.addProperty(this.materialPropertyID);
		queue.enqueue(function (context) {
			envianceSdk.activities.createActivity(activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Activity - Fault if property has overlapped period of history value", 1, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("Create Activity - Fault if property has overlapped period of history value", this.template2ID);
		var date = new Date();
		var beginDate1 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 31, 0);		
		activityInfo.addProperty(this.materialProperty3ID, [new envianceSdk.activities.MaterialValueHistoryInfo(beginDate1, 6)]);
		queue.enqueue(function (context) {
			envianceSdk.activities.createActivity(activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Activity - Fault if add SUV rpoperty with values", 1, function () {
		var queue = new ActionQueue(this);
		
		var date = new Date();
		var beginDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30, 0);		

		var activityInfo = this.buildActivityInfo("Create Activity - Happy path - Resolve Names", this.template2Name);
		activityInfo.id = this.anyGuid;
		activityInfo.properties = [];
		activityInfo.addProperty(this.materialProperty2Name, [new envianceSdk.activities.MaterialValueHistoryInfo(beginDate, 5)]);
		queue.enqueue(function (context) {
			envianceSdk.activities.createActivity(activityInfo,
				context.errorHandler,
				function (response) {					
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		
		queue.executeNext();
	});
	
	asyncTest("Delete Activity - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		
		var activityInfo = this.buildActivityInfo("Create Activity - for delete activity", this.template2ID);
		activityInfo.id = this.anyGuid;

		var activityId;
		queue.enqueue(function () {
			envianceSdk.activities.createActivity(activityInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					activityId = response.result;
					queue.executeNext();
				}, this.errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.activities.deleteActivity(activityId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(activityId,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Activity - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.activities.deleteActivity(context.wrongGuid,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Activity - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.activities.deleteActivity(context.activity1ID,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Update Activity - Happy path", 24, function () {
		var queue = new ActionQueue(this);
		this.initUserTimeZoneOffSet(queue);
		var activityInfo = this.buildActivityInfo("Name_Updated", this.template2Name);
		var id = this.activity2ID;		
		activityInfo.properties[0].valueHistory[0].value = 3;
		activityInfo.properties[0].addValue(envianceSdk.IsoDate.parse("2015-01-01T12:00:00"), 5);
		queue.enqueue(function (context) {
			envianceSdk.activities.updateActivity(id, activityInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.activities.getActivity(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareActivityInfo(response.result, activityInfo);
					context.comparePropertiesValues(response.result.properties, activityInfo.properties);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Activity - Fault when update by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("New_Name", null);
		this._authenticate(queue, this.noManageRightsUserName);
		var id = this.activity3ID;
		queue.enqueue(function (context) {
			envianceSdk.activities.updateActivity(id, activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update Activity - Fault when set empty name", 1, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("", null);
		var id = this.activity3ID;
		queue.enqueue(function (context) {
			envianceSdk.activities.updateActivity(id, activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update Activity - Fault when no property", 1, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("Fault when no property", null);
		activityInfo.properties = [];
		var id = this.activity3ID;
		queue.enqueue(function (context) {
			envianceSdk.activities.updateActivity(id, activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update Activity - Fault when duplicate property", 1, function () {
		var queue = new ActionQueue(this);
		var activityInfo = this.buildActivityInfo("Fault when duplicate property", null);
		activityInfo.addProperty(this.materialPropertyID);
		var id = this.activity3ID;
		queue.enqueue(function (context) {
			envianceSdk.activities.updateActivity(id, activityInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct.");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Update Activity Async - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		this.initUserTimeZoneOffSet(queue);
		var activityInfo = this.buildActivityInfo("Name_Updated", this.template2Name);
		var id = this.activity2ID;
		activityInfo.properties[0].valueHistory[0].value = 3;
		activityInfo.properties[0].addValue(envianceSdk.IsoDate.parse("2015-01-01T12:00:00"), 5);
		queue.enqueue(function (context) {
			envianceSdk.activities.updateActivityAsync(id, activityInfo,
				function (response) {
					equal(response.result.length, 36, "Activity updated");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
}

if (typeof (UnitTestsApplication) == "undefined") {
	executeActivitiesServiceTests();
}