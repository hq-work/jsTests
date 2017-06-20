if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Workflows', execute: executeWorkflowServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof workflowConfig == "undefined")
	workflowConfig = { };

function executeWorkflowServiceTests() {
	module("Workflow Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.accessUserName = workflowConfig.accessUserName || this.accessUserName;
			this.noAccessUserName = workflowConfig.noAccessUserName || "jstestsNotAccessUser";

			this.noManageRightsUserName = (workflowConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.deletedUserName = (workflowConfig.deletedUserName || "jstestsDeletedUser") + qUnitDbSuffix;
			this.expiredUserName = (workflowConfig.expiredUserName || "jstestsExpiredUser") + qUnitDbSuffix;
			this.noManageRightsUserNameWithOverrides = (workflowConfig.noManageRightsUserNameWithOverrides || "jstestsWPermissionsWithOverrides") + qUnitDbSuffix;
			this.password = workflowConfig.password || "1111";

			this.noManageRightsUserId = null;

			this.workflowTypesToClear = ["XLS_kio_WF_type1", "!Workflow Type 1", "UDF_Workflow Type", "XLS_kio_WF_type2", "WF_permissions_rename", "WF_permissions_uniqueId"];
			this.workflowTypeName = "UDF_Workflow Type";
			this.objectsPath = "/UDF_division/UDF_facility";
			this.documentsPath = "/250/99999.xls";

			this.workflowStepName1 = "S1";
			this.workflowStepName2 = "S2";
			this.workflowStepActionName = "go to next step";

			this.cfBooleanCheckBox = "XLS2_true/false_Check Box";
			this.cfBooleanDDL = "XLS_kio_true-false_ddl_tvh";
			this.cfNumericLookup = "XLS_kio_num_numlookup1";
			this.cfNumericLookupValue = -0.0025;
			this.cfDate = "XLS_UDF_date";
			this.cfTime = "XLS_UDF_time";
			this.cfDateTime = "XLS_UDF_date time";
			this.cfHyperlink = "MAS Hyperlink";
			this.cfDDL = "XLS2_Text Box_Dropdown List";
			this.cfDDLLinked = "XLS2_Text Box_Dropdown List_linked";
			this.cfMultiSelect = "XLS2_Multi- Selection List Box";

			this.objectsWithSystemColumn = "('/' + wi.Object.Path + '/' + wi.Object.Name) AS Objects ";
			this.objectsColumn = "('/' + wi.Object.Path + '/' + wi.Object.Name) AS Objects ";
			this.joinSystem = "JOIN System s ON s.ID = '" + this.originalSystemId + "' ";
			
			this.selectWorkflowInstanceQuery = function(workflowId, columns, joins, conditions) {
				columns = (typeof columns == "undefined") ? "" : ", " + columns + " ";
				joins = (typeof joins == "undefined") ? "" : " " + joins + " ";
				conditions = (typeof conditions == "undefined") ? "" : " " + conditions + " ";
				return "SELECT wt.Name AS WorkflowTypeName, wi.Name, wi.UniqueId" + columns +
					"FROM WorkflowInstance wi " +
					"JOIN WorkflowType wt ON wi " + joins +
					"WHERE wi.ID = '" + workflowId + "'" + conditions;
			};

			this.selectWorkflowInstanceQueryByIds = function(workflowIds, columns, joins, conditions) {
				columns = (typeof columns == "undefined") ? "" : ", " + columns + " ";
				joins = (typeof joins == "undefined") ? "" : " " + joins + " ";
				conditions = (typeof conditions == "undefined") ? "" : " " + conditions + " ";
				return "SELECT wt.Name AS WorkflowTypeName, wi.Name, wi.UniqueId" + columns +
					"FROM WorkflowInstance wi " +
					"JOIN WorkflowType wt ON wi " + joins +
					"WHERE wi.ID IN ('" + workflowIds.join("', '") + "')" + conditions;
			};

			this.selectWorkflowInstancesByTypeQuery = function(workflowTypes) {
				return "SELECT wi.ID FROM WorkflowInstance wi " +
					"JOIN WorkflowType wt ON wi " +
					"WHERE wt.Name IN ('" + workflowTypes.join("', '") + "')";
			};

			this.selectWorkflowInstaceScalarUdfsQuery = function(workflowId) {
				return "SELECT ws.\"" + this.cfBooleanCheckBox + "\", " +
					"ws.\"" + this.cfBooleanDDL + "\", ws.\"" + this.cfNumericLookup + "\", " +
					"ws.\"" + this.cfDate + "\", ws.\"" + this.cfTime + "\", ws.\"" + this.cfDateTime + "\", " +
					"ws.\"" + this.cfHyperlink + "\", ws.\"" + this.cfDDL + "\", ws.Name " +
					"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
					"WHERE wi.ID = '" + workflowId + "'";
			};

			this.selectWorkflowInstaceLinkedValueUdfsQuery = function(workflowId) {
				return "SELECT ws.\"" + this.cfDDLLinked + "\", ws.Name " +
					"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
					"WHERE wi.ID = '" + workflowId + "'";
			};

			this.selectWorkflowInstaceMultiValueUdfsQuery = function(workflowId) {
				return "SELECT ws.\"" + this.cfMultiSelect + "\", ws.Name " +
					"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
					"WHERE wi.ID = '" + workflowId + "'";
			};

			this.buildWorkflowCreationInfo = function(typeName, name, uniqueId, objects) {
				var result = new envianceSdk.workflows.WorkflowInfo(typeName, name, uniqueId);
				result.addPathAssociatedObject(objects);
				return result;
			};

			this.buildWorkflowUpdateInfo = function() {
				var updateInfo = new envianceSdk.workflows.WorkflowInfo()
					.addDocument(this.documentsPath)
					.addPathAssociatedObject(this.objectsPath);

				updateInfo.dueDate = envianceSdk.IsoDate.parse("2012-09-19T18:00:00");
				updateInfo.uniqueId = "Updated_unique_ID";
				updateInfo.name = "WF name Updated";
				updateInfo.calendars = ["My", "System"];
				updateInfo.comment = "Update workflow comment";
				return updateInfo;
			};

			this.buildWorkflowStepInfo = function() {
				return new envianceSdk.workflows.WorkflowStepInfo("A comment")
					.addScalarFieldValue(this.cfBooleanCheckBox, "True")
					.addScalarFieldValue(this.cfBooleanDDL, "True :)")
					.addScalarFieldValue(this.cfNumericLookup, "<br>")
					.addDateFieldValue(this.cfDate, "2012-09-10")
					.addTimeFieldValue(this.cfTime, "10:30 PM")
					.addDateFieldValue(this.cfDateTime, "2012-10-11T19:40")
					.addUrlFieldValue(this.cfHyperlink, "HyperLink label", "http://moto.kiev.ua")
					.addLinkedFieldValues(this.cfDDL, ['Select'])
					.addLinkedFieldValues(this.cfDDLLinked, ['1234567890', '10234567.89'])
					.addMultiFieldValues(this.cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);
			};

			this.addBuildWorkflowBlankAction = function(queue, dueDate, customWorkflowTypeName) {
				queue.enqueue(function(context) {
					if (customWorkflowTypeName) {
						context.workflowTypeName = customWorkflowTypeName;
					}
					envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
						function(response) {
							context.workflowBlank = new envianceSdk.workflows.WorkflowInfo(
								context.workflowTypeName, "WF name", response.result[0]);

							if (dueDate) {
								context.workflowBlank.dueDate = dueDate;
							}

							queue.executeNext();
						},
						context.errorHandler);
				});
			};

			this.addCreateWorkflowFromBlankAction = function(queue) {
				queue.enqueue(function(context) {
					envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
						function(response) {
							context.workflowId = response.result;
							queue.executeNext();
						}, context.errorHandler);
				});
			};
		},

		teardown: function () {
			stop();
			var errorHandler = function () {
				start();
			};
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			envianceSdk.eql.execute(this.selectWorkflowInstancesByTypeQuery(this.workflowTypesToClear), 1, 100,
				function (response) {
					var rows = response.result[0].rows;

					for (var i = 0; i < rows.length; i++) {
						stop();

						var workflowId = rows[i].values[0];
						envianceSdk.workflows.deleteWorkflow(workflowId,
							function () {
								start();
							}, errorHandler);
					}

					start();
				}, errorHandler);
		}
	});

	window['InitiateChildWorkflowContext'] = function() {
		this.childWorkflowInitiationInfo = null;
		this.originalWorkflow = null;
		this.workflowId = null;
		this.cfHyperlink = "XLS2_Default URL (HTTP,SMTP,FTP)";
		this.cfDDL = "XLS2_Text Box_Dropdown List";
		this.cfDDLWithTB = "XLS2_Text Box_Dropdown List with Text Box";
		this.cfDDLLinked = "XLS2_Text Box_Dropdown List_linked";
		this.cfTextLarge = "XLS2_Text Box_Large (7900 char max)";
		this.cfTextMedium = "XLS2_Text Box_Medium (50 char max)";
		this.cfTextSmall = "XLS2_Text Box_Small (20 char max)";
		this.cfBooleanCheckBox = "XLS2_true/false_Check Box";
		this.cfBooleanDDL = "XLS2_true/false_Dropdown List";
		this.cfMultiSelect = "XLS2_Multi- Selection List Box";
	};

	InitiateChildWorkflowContext.prototype = {
		addDefaultActions: function(queue) {
			var self = this;
			queue.enqueue(function(context) {
				var workflowTypeName = "XLS_kio_WF_type1";
				envianceSdk.workflows.generateUniqueIds(workflowTypeName, 2,
					function(response) {
						var updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("A comment")
							.addMultiFieldValues(context.cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);

						var workflowStepName = "<br> step 1";
						var workflowInitiatorName = "<!-- initiator 1";
						self.childWorkflowInitiationInfo = new envianceSdk.workflows.ChildWorkflowInitiationInfo(
							workflowStepName, workflowInitiatorName,
							context.buildWorkflowCreationInfo(
								workflowTypeName, "WF name child", response.result[0], context.objectsPath),
							updateStepInfo);

						self.originalWorkflow = context.buildWorkflowCreationInfo(
							workflowTypeName, "WF name parent", response.result[1], context.objectsPath);

						queue.executeNext();
					}, context.errorHandler);
			});

			queue.enqueue(function(context) {
				envianceSdk.workflows.createWorkflow(self.originalWorkflow, null,
					function(response) {
						self.workflowId = response.result;
						queue.executeNext();
					}, context.errorHandler);
			});
		},
		addUniqueIDsAction: function(queue) {
			var self = this;
			queue.enqueue(function(context) {
				var workflowTypeName = "XLS_kio_WF_type1";
				envianceSdk.workflows.generateUniqueIds(workflowTypeName, 2,
					function(response) {
						var updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("A comment")
							.addMultiFieldValues(context.cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);

						var workflowStepName = "<br> step 1";
						var workflowInitiatorName = "<!-- initiator 1";
						self.childWorkflowInitiationInfo = new envianceSdk.workflows.ChildWorkflowInitiationInfo(
							workflowStepName, workflowInitiatorName,
							context.buildWorkflowCreationInfo(
								workflowTypeName, "WF name child", response.result[0], context.objectsPath),
							updateStepInfo);

						self.originalWorkflow = context.buildWorkflowCreationInfo(
							workflowTypeName, "WF name parent", response.result[1], context.objectsPath);

						queue.executeNext();
					}, context.errorHandler);
			});
		},
		fillAllProperties: function(queue) {
			var self = this;
			queue.enqueue(function(context) {
				var updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("WF name")
					.addUrlFieldValue(self.cfHyperlink, "label", "http://www.ua.fm")
					.addMultiFieldValues(self.cfMultiSelect, ["31/12/2011", "31-12-2011", "Select"])
					.addLinkedFieldValues(self.cfDDL, ["simple text"])
					.addLinkedFieldValues(self.cfDDLWithTB, ["New Value"])
					.addLinkedFieldValues(self.cfDDLLinked, ["1234567890", "simple text"])
					.addScalarFieldValue(self.cfTextLarge, "Large text value")
					.addScalarFieldValue(self.cfTextMedium, "Medium text value")
					.addScalarFieldValue(self.cfTextSmall, "Small text value")
					.addScalarFieldValue(self.cfBooleanCheckBox, "True")
					.addScalarFieldValue(self.cfBooleanDDL, "False");
				self.childWorkflowInitiationInfo.childInitStepInfo = updateStepInfo;
				queue.executeNext();
			});
		},
		selectWorkflowInstaceScalarUdfsQuery: function(workflowId) {
			return "SELECT ws.\"" + this.cfBooleanCheckBox + "\", " +
				"ws.\"" + this.cfBooleanDDL + "\", ws.\"" + this.cfDDLWithTB + "\", " +
				"ws.\"" + this.cfTextLarge + "\", ws.\"" + this.cfTextMedium + "\", ws.\"" + this.cfTextSmall + "\", " +
				"ws.\"" + this.cfHyperlink + "\", ws.\"" + this.cfDDL + "\" " +
				"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
				"WHERE wi.ID = '" + workflowId + "'";
		},
		selectWorkflowInstaceLinkedValueUdfsQuery: function(workflowId) {
			return "SELECT ws.\"" + this.cfDDLLinked + "\" " +
				"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
				"WHERE wi.ID = '" + workflowId + "'";
		},
		selectWorkflowInstaceMultiValueUdfsQuery: function(workflowId) {
			return "SELECT ws.\"" + this.cfMultiSelect + "\" " +
				"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
				"WHERE wi.ID = '" + workflowId + "'";
		}
	};

	asyncTest("Workflow Batch - Create 2 workflows (same name) - Happy path", 9, function () {
		var errorHandled = 0;
		var errorHandler = function (errorResponse, status, message) {
			self.errorHandler(errorResponse, status, message, null, errorHandled++);
		};
		
		var queue = new ActionQueue(this);
		var self = this;

		var workflowIds = [];
		var originalWorkflows = {};
		var doneCallbacks = 0;
		var operCount = 0;

		queue.doNext = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) this.executeNext();
		};

		queue.enqueue(function (context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 2,
				function (response) {
					originalWorkflows[response.result[0]] = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					originalWorkflows[response.result[1]] = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", response.result[1], context.objectsPath);
					originalWorkflows.UniqueIDs = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		var awaitCallback = function (response) {
			workflowIds.push(response.result);

			equal(response.metadata.statusCode, 201, "Status code is correct");
			ok(response.metadata.hasOwnProperty("location"), "Location is not empty");

			queue.doNext();
		};

		// When
		queue.enqueue(function (context) {
			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.workflows.createWorkflow(originalWorkflows[originalWorkflows.UniqueIDs[0]], null, awaitCallback, errorHandler);
					envianceSdk.workflows.createWorkflow(originalWorkflows[originalWorkflows.UniqueIDs[1]], null, awaitCallback, errorHandler);
					
					operCount = envianceSdk.batch.getOperations().length;
				}
			},
				function (response) {
					equal(response.result && response.result.length, operCount, "Get " + operCount + " results");
					equal(response.result[0].status, "Created", "1st Workflow is Created");
					equal(response.result[1].status, "Created", "2nd Workflow is Created");
					queue.doNext();
				}, errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstanceQueryByIds(workflowIds, context.objectsColumn);
			envianceSdk.eql.execute(eql, 1, 2,
				function (response) {
					var row1 = response.result[0].rows[0];
					var createdWorkflow1 = context.buildWorkflowCreationInfo(row1.values[0], row1.values[1], row1.values[2], row1.values[3]);
					var row2 = response.result[0].rows[1];
					var createdWorkflow2 = context.buildWorkflowCreationInfo(row2.values[0], row2.values[1], row2.values[2], row2.values[3]);

					deepEqual(createdWorkflow1, originalWorkflows[row1.values[2]], "1st WF instances are equal");
					deepEqual(createdWorkflow2, originalWorkflows[row2.values[2]], "2nd WF instances are equal");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Workflow Batch - Create WF and child WF, Complete Child WF - Happy path", 9, function () {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addUniqueIDsAction(queue);

		var doneCallbacks = 0;
		var operCount = 0;
		
		queue.doStart = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) start();
		};

		var awaitCallback = function (response) {
			equal(response.metadata.statusCode, 201, "Status code is correct");
			ok(response.metadata.hasOwnProperty("location"), "Location is not empty");

			queue.doStart();
		}; 

		// When
		queue.enqueue(function (context) {
			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.workflows.createWorkflow(icwContext.originalWorkflow, null,
						awaitCallback, context.errorHandler);
					envianceSdk.workflows.initiateChildWorkflow(icwContext.originalWorkflow.uniqueId, icwContext.childWorkflowInitiationInfo,
						awaitCallback, context.errorHandler);
					envianceSdk.workflows.endWorkflow(icwContext.childWorkflowInitiationInfo.childWorkflowInfo.uniqueId, "End workflow js test",
						function (response) {
							equal(response.metadata.statusCode, 204, "Status code is correct");
							queue.doStart();
						}, context.errorHandler);
					operCount = envianceSdk.batch.getOperations().length;
				}
			},
			function (response) {
				equal(response.result && response.result.length, operCount, "Get " + operCount + " results");
				equal(response.result[0].status, "Created", "Original Workflow is Created");
				equal(response.result[1].status, "Created", "Child Workflow is Initiated");
				equal(response.result[2].status, "No Content", "Child Workflow is Closed");

				queue.doStart();
			}, context.errorHandler);
		});

		queue.executeNext();
	});
	

	asyncTest("Workflow Batch - Create WF and child, Complete Child WF by JsonPath - Happy path", 9, function () {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addUniqueIDsAction(queue);

		var doneCallbacks = 0;
		var operCount = 0;

		queue.doStart = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) start();
		};

		var awaitCallback = function (response) {
			equal(response.metadata.statusCode, 201, "Status code is correct");
			ok(response.metadata.hasOwnProperty("location"), "Location is not empty");

			queue.doStart();
		};

		// When
		queue.enqueue(function (context) {
			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.workflows.createWorkflow(icwContext.originalWorkflow, null,
						awaitCallback, context.errorHandler);
					envianceSdk.workflows.initiateChildWorkflow("##[0]##", icwContext.childWorkflowInitiationInfo, //JsonPath
						awaitCallback, context.errorHandler);
					envianceSdk.workflows.endWorkflow("##[1]##", "End workflow js test", //JsonPath
						function (response) {
							equal(response.metadata.statusCode, 204, "Status code is correct");
							queue.doStart();
						}, context.errorHandler);
					
					operCount = envianceSdk.batch.getOperations().length;
				}
			},
			function (response) {
				equal(response.result && response.result.length, operCount, "Get " + operCount + " results");
				equal(response.result[0].status, "Created", "Original Workflow is Created");
				equal(response.result[1].status, "Created", "Child Workflow is Initiated");
				equal(response.result[2].status, "No Content", "Child Workflow is Closed");

				queue.doStart();
			}, context.errorHandler);
		});

		queue.executeNext();
	});

	test("WorkflowStepInfo - Url field constructor - Fault if label is not assigned", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.workflows.WorkflowStepInfo("A comment").addUrlFieldValue("Name", null, "http://moto.kiev.ua");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("WorkflowStepInfo - Url field constructor - Fault if label is empty string", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.workflows.WorkflowStepInfo("A comment").addUrlFieldValue("Name", "", "http://test.com");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("WorkflowStepInfo - Url field constructor - Fault if url is not assigned", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.workflows.WorkflowStepInfo("A comment").addUrlFieldValue("Name", "Label");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("WorkflowStepInfo - Url field constructor - Fault if url is empty string", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.workflows.WorkflowStepInfo("A comment").addUrlFieldValue("Name", "Label", "");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	asyncTest("Generate unique ID - Happy path", 2, function () {
		var self = this;
		envianceSdk.workflows.generateUniqueIds(this.workflowTypeName, 5,
			function(response) {
				var uniqueIds = response.result;

				equal(response.metadata.statusCode, 200, "Status code is correct");
				equal(uniqueIds.length, 5, "Number of unique IDs matched.");
				start();
			}, self.errorHandler);
	});

	asyncTest("Generate unique ID - Fault if Workflow Type ID is invalid", 2, function() {
		var self = this;
		envianceSdk.workflows.generateUniqueIds("CD03E393-3869-4DCC-9116-9FC606B842C3", 1,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if Workflow Type Name is invalid", 2, function() {
		var self = this;
		envianceSdk.workflows.generateUniqueIds("Invalid Workflow Type Name", 1,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if workflow Type Name is too long", 2, function() {
		var self = this;
		var workflowTypeName = '';
		for (var i = 0; i < 256; i++) {
			workflowTypeName += 's';
		}
		envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4001, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if count is too small", 2, function() {
		var self = this;
		envianceSdk.workflows.generateUniqueIds(this.workflowTypeName, 0,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4002, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if count is too large", 2, function() {
		var self = this;
		envianceSdk.workflows.generateUniqueIds(this.workflowTypeName, 2001,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4002, "Error number is correct");
				start();
			});
	});

	asyncTest("Create workflow - Happy path", 3, function() {
		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		var workflowId;
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, null,
				function(response) {
					workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstanceQuery(workflowId, context.objectsColumn);
			envianceSdk.eql.execute(eql, 1, 1,
				function(response) {
					var row = response.result[0].rows[0];
					var createdWorkflow = context.buildWorkflowCreationInfo(row.values[0], row.values[1], row.values[2], row.values[3]);

					deepEqual(createdWorkflow, originalWorkflow, "WF instances are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Fault if workflow instance already exists", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var workflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(workflow, null,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function(context) {
			envianceSdk.workflows.createWorkflow(workflow, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					equal(response.error.errorNumber, 101, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Fault if no AssosiateObject permissions", 2, function() {
		var self = this;
		var restoreSession = function () {
			envianceSdk.configure({ sessionId: self.originalSessionId });
		};

		var queue = new ActionQueue(this);

		// Given
		var workflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, context.errorHandler)
				.fail(restoreSession);
		});

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				}, context.errorHandler)
				.fail(restoreSession);
		});

		// Then
		queue.enqueue(function(context) {
			envianceSdk.workflows.createWorkflow(workflow, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					// TODO: error number assert

					start();
				}).always(restoreSession);
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Ensure TZ offset is correct", 1, function() {
		var dueDate = new Date();
		dueDate.setMilliseconds(0);

		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue, dueDate);
		this.addCreateWorkflowFromBlankAction(queue);

		var utcDueDate;
		queue.enqueue(function(context) {
			var eql = "SELECT wi.DueDate AS DueDate FROM WorkflowInstance wi WHERE wi.ID = '" + context.workflowId + "'";
			envianceSdk.eql.execute(eql, 1, 1,
				function(response) {
					utcDueDate = response.result[0].rows[0].values[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					var actualOffset = (dueDate - utcDueDate) / 60000;
					equal(actualOffset, response.result.userTimeZone.currentOffset, "dueDate offset OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Fault if value in default JS format", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.dueDate = "Mon Oct 1 17:54:50 UTC+0300 2012";

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Fault if value with Z at the end", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.dueDate = "2009-06-15T13:45:30Z";

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Fault if value with '+' at the end", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.dueDate = "2009-06-15T13:45:30+3000";

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Fault if value with milliseconds at the end", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.dueDate = "2009-06-15T13:45:30.54";

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Calendars - Happy path", 1, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.calendars = ["My", "System"];

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create workflow - Calendars - Fault when Calendar Type is empty", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.calendars = [""];

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create workflow - Calendars - Fault when Calendar Type doest not exist", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.calendars = ["UnknownTestCalendarType"];

			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create workflow with update current step - Happy path", 15, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				function(response) {
					context.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], true, "Boolean DDL values equal");
					strictEqual(row.values[2], context.cfNumericLookupValue, "Numeric Lookup values equal");
					deepEqual(row.values[3], workflowStep.fields[3].values[0], "Date values equal");
					deepEqual(row.values[4], workflowStep.fields[4].values[0], "Time values equal");

					var expectedDatetime = toUTC(new Date(Date.parse(workflowStep.fields[5].values[0])), tz);
					deepEqual(row.values[5], expectedDatetime, "DateTime values equal");

					equal(row.values[6], workflowStep.fields[6].urlItems[0].url, "Hyperlinks are equal");
					equal(row.values[7], workflowStep.fields[7].values[0], "DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 3, "Row number matches");
					var actualValue = [
						response.result[0].rows[0].values[0],
						response.result[0].rows[1].values[0],
						response.result[0].rows[2].values[0]];
					deepEqual(actualValue, workflowStep.fields[9].values, "Multiselect values are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create workflow with update current step - Fault if user does not have access", 2, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.noAccessUserName);
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4003, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow with update current step - Fault if deleted user is assigned", 2, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.deletedUserName);
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4004, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow with update current step - Fault if expired user is assigned", 2, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.expiredUserName);
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4005, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow with update current step - Fault if user already specified", 2, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var userName = context.noManageRightsUserName;
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(userName)
				.addUserAssignee(userName);
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4006, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow with update current step - Fault if group does not exist", 2, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var notExistentGroupName = "notExistentGroupName";
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addGroupAssignee(notExistentGroupName);
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4007, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow with update current step - Fault if group already specified", 2, function() {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var groupName = "Administrators";
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addGroupAssignee(groupName)
				.addGroupAssignee(groupName);
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4008, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Create workflow - Check warnings", 9, function() {
		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		var updateStepInfo;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					originalWorkflow.id = createUUID();
					originalWorkflow.parentUniqueId = createUUID();
					originalWorkflow.status = "Status";
					originalWorkflow.creator = context.accessUserName;
					originalWorkflow.created = "2012-09-19T18:00:00";
					originalWorkflow.lastRun = "2012-09-19T18:00:00";
					originalWorkflow.assignedBy = context.accessUserName;

					updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("A comment");
					updateStepInfo.id = createUUID();
					updateStepInfo.name = context.workflowStepName1;
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, updateStepInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					equal(response.metadata.warnings.match(/'id'/g).length, 2, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'parentUniqueId\'") > 0, "Warning for 'parentUniqueId' OK");
					ok(response.metadata.warnings.indexOf("\'status\'") > 0, "Warning for 'status' OK");
					ok(response.metadata.warnings.indexOf("\'creator\'") > 0, "Warning for 'creator' OK");
					ok(response.metadata.warnings.indexOf("\'created\'") > 0, "Warning for 'created' OK");
					ok(response.metadata.warnings.indexOf("\'lastRun\'") > 0, "Warning for 'lastRun' OK");
					ok(response.metadata.warnings.indexOf("\'assignedBy\'") > 0, "Warning for 'assignedBy' OK");
					ok(response.metadata.warnings.indexOf("\'name\'") > 0, "Warning for 'name' OK");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get workflow - Happy path - Get workflow by ID - All properties", 10, function() {
		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					originalWorkflow.addDocument(context.documentsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		var workflowId;
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, null,
				function(response) {
					workflowId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var createdWorkflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(workflowId,
				function(response) {
					createdWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var tz;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function(context) {
			var columns = context.objectsWithSystemColumn + ", wi.Document.FullPath, wi.StatusName, wi.Created, wi.LastRun, wi.DueDate";
			var eql = context.selectWorkflowInstanceQuery(workflowId, columns, context.joinSystem);

			envianceSdk.eql.execute(eql, 1, 1,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");

					var row = response.result[0].rows[0];
					equal(row.values[0], createdWorkflow.workflowTypeName, "Workflow type names are equal");
					equal(row.values[1], createdWorkflow.name, "Workflow instance names are equal");
					equal(row.values[2], createdWorkflow.uniqueId, "Workflow unique IDs are equal");
					deepEqual(row.values[3], createdWorkflow.objects[0], "Workflow objects paths are equal");
					deepEqual('/' + row.values[4].split('/').slice(2).join('/'), createdWorkflow.documents[0], "Workflow documents paths are equal");
					equal(row.values[5], createdWorkflow.status, "Workflow statuses are equal");

					var actualCreated = toLocalTime(row.values[6], tz);
					deepEqual(actualCreated, createdWorkflow.created, "Workflow created dates are equal");

					// TZ conversion is redundant as value is MinDate.
					deepEqual(row.values[7], createdWorkflow.lastRun, "Workflow last run dates are equal");

					// TZ conversion is redundant as value is MaxDate.
					deepEqual(row.values[8], createdWorkflow.dueDate, "Workflow due dates are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow - Happy path - Get workflow by unique ID - Basic properties", 4, function() {
		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, null,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(originalWorkflow.uniqueId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");

					var createdWorkflow = response.result;
					equal(createdWorkflow.workflowTypeName, originalWorkflow.workflowTypeName, "Workflow type names are equal");
					equal(createdWorkflow.name, originalWorkflow.name, "Workflow instance names are equal");
					equal(createdWorkflow.uniqueId, originalWorkflow.uniqueId, "Workflow unique IDs are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get workflow - Fault if workflow instance does not exist", 2, function() {
		var invalidWorkflowId = createUUID();
		var self = this;
		
		envianceSdk.workflows.getWorkflow(invalidWorkflowId,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update workflow by ID - Happy path - All properties", 9, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowUpdateInfo = this.buildWorkflowUpdateInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflow(context.workflowId, workflowUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.name, workflowUpdateInfo.name, "Workflow names are equal");
					equal(updatedWorkflow.uniqueId, workflowUpdateInfo.uniqueId, "Workflow unique IDs are equal");
					equal(updatedWorkflow.comment, workflowUpdateInfo.comment, "Workflow comments are equal");

					deepEqual(updatedWorkflow.dueDate, workflowUpdateInfo.dueDate, "Workflow due date are equal");

					deepEqual(updatedWorkflow.calendars, workflowUpdateInfo.calendars, "Workflow calendars are equal");
					deepEqual(updatedWorkflow.documents, workflowUpdateInfo.documents, "Workflow documents are equal");
					equal(updatedWorkflow.objects.length, workflowUpdateInfo.objects.length, "Workflow objects count is equal");
					deepEqual(updatedWorkflow.objects, workflowUpdateInfo.objects, "Workflow objects are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update workflow by unique ID - Happy path - Some properties", 5, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var workflowInfo = { comment: "Updated comment" };
			envianceSdk.workflows.updateWorkflow(originalWorkflow.uniqueId, workflowInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.name, originalWorkflow.name, "Workflow names are equal");
					equal(updatedWorkflow.uniqueId, originalWorkflow.uniqueId, "Workflow unique IDs are equal");
					equal(updatedWorkflow.comment, "Updated comment", "Workflow comments are equal");

					deepEqual(updatedWorkflow.dueDate, originalWorkflow.dueDate, "Workflow due date are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow - Happy path - Check AssignedTo overriding", 7, function() {
		function compare(a, b) {
			var aUser = a.userIdOrName.toString().toLowerCase();
			var bUser = b.userIdOrName.toString().toLowerCase();
			if (aUser < bUser)
				return -1;
			if (aUser > bUser)
				return 1;
			return 0;
		}

		var queue = new ActionQueue(this);

		var workflowInfo;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
						function(response) {
							workflowInfo = new envianceSdk.workflows.WorkflowInfo(
								"XLS_kio_WF_type2", "WF name", response.result[0]);
							var dueDate = new Date();
							dueDate.setMilliseconds(0);
							workflowInfo.dueDate = dueDate;
							queue.executeNext();
						}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.createWorkflow(workflowInfo, null,
						function(response) {
							context.workflowId = response.result;
							queue.executeNext();
						}, context.errorHandler);
		});

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			workflowInfo.assignedTo = [];
			workflowInfo.addUserAssignee(context.noManageRightsUserName);
			envianceSdk.workflows.updateWorkflow(workflowInfo.uniqueId, workflowInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					var mistakenWorkflow = response.result;
					notDeepEqual(mistakenWorkflow.assignedTo.sort(compare), originalWorkflow.assignedTo.sort(compare), "Workflow AssignedTo are not equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			workflowInfo.assignedTo = originalWorkflow.assignedTo;
			envianceSdk.workflows.updateWorkflow(workflowInfo.uniqueId, workflowInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.name, originalWorkflow.name, "Workflow names are equal");
					equal(updatedWorkflow.uniqueId, originalWorkflow.uniqueId, "Workflow unique IDs are equal");

					deepEqual(updatedWorkflow.dueDate, originalWorkflow.dueDate, "Workflow due date are equal");
					deepEqual(updatedWorkflow.assignedTo.sort(compare), originalWorkflow.assignedTo.sort(compare), "Workflow AssignedTo are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow - Happy path with AssignedTo ids", 2, function() {
		function compare(a, b) {
			var aAssignee = a.userIdOrName.toString().toLowerCase() + a.groupIdOrName.toString().toLowerCase();
			var bAssignee = b.userIdOrName.toString().toLowerCase() + b.groupIdOrName.toString().toLowerCase();
			if (aAssignee < bAssignee)
				return -1;
			if (aAssignee > bAssignee)
				return 1;
			return 0;
		}

		var queue = new ActionQueue(this);
		
		
		queue.enqueue(function (context) {
			envianceSdk.eql.execute("select u.id from user u where u.login ='" + context.noManageRightsUserName + "'",1,10,
						function (response) {
							context.noManageRightsUserId = response.result[0].rows[0].values[0];
							queue.executeNext();
						}, context.errorHandler);
		});

		var workflowInfo;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
						function(response) {
							workflowInfo = new envianceSdk.workflows.WorkflowInfo(
								"XLS_kio_WF_type2", "WF name", response.result[0]);
							var dueDate = new Date();
							dueDate.setMilliseconds(0);
							workflowInfo.dueDate = dueDate;
							queue.executeNext();
						}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.createWorkflow(workflowInfo, null,
						function(response) {
							context.workflowId = response.result;
							queue.executeNext();
						}, context.errorHandler);
		});

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			workflowInfo.assignedTo = [];
			workflowInfo.addUserAssignee(context.noManageRightsUserId);
			workflowInfo.addGroupAssignee(context.originalSystemId);
			envianceSdk.workflows.updateWorkflow(workflowInfo.uniqueId, workflowInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					var updatedWorkflow = response.result;
					updatedWorkflow.assignedTo = [];
					workflowInfo.addUserAssignee(context.noManageRightsUserName);
					workflowInfo.addGroupAssignee("Administrators");
					deepEqual(updatedWorkflow.assignedTo.sort(compare), updatedWorkflow.assignedTo.sort(compare), "Workflow AssignedTo are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow - Fault if assigned on step whith Creator role", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowInfo;
		queue.enqueue(function(context) {
			workflowInfo = { assignedTo: [{ userIdOrName: context.noManageRightsUserName}] };
			envianceSdk.workflows.updateWorkflow(originalWorkflow.uniqueId, workflowInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4012, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update workflow - Fault if workflow instance does not exist", 2, function() {
		var self = this;
		var invalidWorkflowId = createUUID();
		var workflowInfo = this.buildWorkflowUpdateInfo();

		envianceSdk.workflows.updateWorkflow(invalidWorkflowId, workflowInfo,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update workflow - Check warnings", 9, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowUpdateInfo = this.buildWorkflowUpdateInfo();
		workflowUpdateInfo.id = createUUID();
		workflowUpdateInfo.workflowTypeName = this.workflowTypeName;
		workflowUpdateInfo.parentUniqueId = createUUID();
		workflowUpdateInfo.status = "Status";
		workflowUpdateInfo.creator = this.accessUserName;
		workflowUpdateInfo.created = "2012-09-19T18:00:00";
		workflowUpdateInfo.lastRun = "2012-09-19T18:00:00";
		workflowUpdateInfo.assignedBy = this.accessUserName;
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflow(context.workflowId, workflowUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'workflowTypeName\'") > 0, "Warning for 'workflowTypeName' OK");
					ok(response.metadata.warnings.indexOf("\'parentUniqueId\'") > 0, "Warning for 'parentUniqueId' OK");
					ok(response.metadata.warnings.indexOf("\'status\'") > 0, "Warning for 'status' OK");
					ok(response.metadata.warnings.indexOf("\'creator\'") > 0, "Warning for 'creator' OK");
					ok(response.metadata.warnings.indexOf("\'created\'") > 0, "Warning for 'created' OK");
					ok(response.metadata.warnings.indexOf("\'lastRun\'") > 0, "Warning for 'lastRun' OK");
					ok(response.metadata.warnings.indexOf("\'assignedBy\'") > 0, "Warning for 'assignedBy' OK");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update workflow with permissions - Happy path - Name only", 2, function () {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue, null, "WF_permissions_rename");
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function (response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var workflowInfo = { name: "Updated name" };
			envianceSdk.workflows.updateWorkflow(context.workflowId, workflowInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function (response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.name, "Updated name", "Workflow name has been updated");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow with permissions - Happy path - UniqueId only", 2, function () {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue, null, "WF_permissions_uniqueId");
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function (response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		var updatedUniqueId = "444-111-defefefdfd-43";
		queue.enqueue(function (context) {
			var workflowInfo = { uniqueId: updatedUniqueId };
			envianceSdk.workflows.updateWorkflow(context.workflowId, workflowInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function (response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.uniqueId, updatedUniqueId, "Workflow uniqueId has been updated");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow with permissions - Fault when updating both Name and UniqueId", 1, function () {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue, null, "WF_permissions_rename");
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function (response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var workflowInfo = { name: "Updated name", uniqueId: "189067686dvdfvdvvg34" };
			envianceSdk.workflows.updateWorkflow(context.workflowId, workflowInfo,
				context.successHandler,
				function (response) {
					ok(response.metadata.statusCode == 400 || response.metadata.statusCode == 500, "Status code is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete workflow - Happy path", 1, function() {
		var queue = new ActionQueue(this);

		// Given
		var workflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowId;
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(workflow, null,
				function(response) {
					workflowId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		queue.enqueue(function (context) {
			envianceSdk.workflows.deleteWorkflow(workflowId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Delete workflow - Fault when workflow instance doest not exist", 2, function() {
		var invalidWorkflowId = createUUID();
		var self = this;
		envianceSdk.workflows.deleteWorkflow(invalidWorkflowId,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("End workflow - Happy path", 6, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		queue.enqueue(function(context) {
			envianceSdk.workflows.endWorkflow(context.workflowId, "End workflow js test",
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result;
					var expected = context.workflowBlank;
					
					equal(actual.name, expected.name, "Workflow names are equal");
					equal(actual.uniqueId, expected.uniqueId, "Workflow unique ids are equal");
					equal(actual.workflowTypeName, expected.workflowTypeName, "Workflow type names are equal");
					equal(actual.status, "Closed (start)", "Workflow status are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Happy path - All properties", 14, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], true, "Boolean DDL values equal");
					strictEqual(row.values[2], context.cfNumericLookupValue, "Numeric Lookup values equal");
					deepEqual(row.values[3], workflowStep.fields[3].values[0], "Date values equal");
					deepEqual(row.values[4], workflowStep.fields[4].values[0], "Time values equal");

					var expectedDatetime = toUTC(new Date(Date.parse(workflowStep.fields[5].values[0])), tz);
					deepEqual(row.values[5], expectedDatetime, "DateTime values equal");

					equal(row.values[6], workflowStep.fields[6].urlItems[0].url, "Hyperlinks are equal");
					equal(row.values[7], workflowStep.fields[7].values[0], "DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 3, "Row number matches");
					var actualValue = [
						response.result[0].rows[0].values[0],
						response.result[0].rows[1].values[0],
						response.result[0].rows[2].values[0]];
					deepEqual(actualValue, workflowStep.fields[9].values, "Multiselect values are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Happy path - Missing properties are preserved", 10, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, originalWorkflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		var modifiedWorkflowStep = this.buildWorkflowStepInfo();
		modifiedWorkflowStep.fields[3].values[0] =
			new Date(originalWorkflowStep.fields[3].values[0].getTime() + 24 * 60 * 60 * 1000); // add 1 day
		modifiedWorkflowStep.fields[4].values[0] =
			new Date(originalWorkflowStep.fields[4].values[0].getTime() + 60 * 1000); // add 1 minute

		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, modifiedWorkflowStep,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					// Changed values
					deepEqual(row.values[3], modifiedWorkflowStep.fields[3].values[0], "Date values changed");
					deepEqual(row.values[4], modifiedWorkflowStep.fields[4].values[0], "Time values changed");

					// Missed properties should remain with old values
					strictEqual(row.values[0], true, "Boolean CheckBox value unchanged");
					strictEqual(row.values[1], true, "Boolean DDL value unchanged");
					strictEqual(row.values[2], context.cfNumericLookupValue, "Numeric Lookup value unchanged");

					var expectedDatetime = toUTC(new Date(Date.parse(originalWorkflowStep.fields[5].values[0])), tz);
					deepEqual(row.values[5], expectedDatetime, "DateTime value unchanged");

					equal(row.values[6], originalWorkflowStep.fields[6].urlItems[0].url, "Hyperlink unchanged");
					equal(row.values[7], originalWorkflowStep.fields[7].values[0], "DDL value unchanged");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update passed workflow step - Happy path - Missing properties are preserved", 10, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var workflowStep;
		queue.enqueue(function(context) {
			workflowStep = new envianceSdk.workflows.WorkflowStepInfo("Transition to second step");
			workflowStep.setTransition(context.workflowStepActionName, new Date());
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		var originalWorkflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName1, originalWorkflowStep,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowStep(context.workflowId, context.workflowStepName1,
				function(response) {
					var updatedStep = response.result;

					equal(updatedStep.comment, originalWorkflowStep.comment, "Step comment equal");
					equal(updatedStep.name, context.workflowStepName1, "Step name equal");

					var actualFields = toMap(updatedStep.fields, function(field) { return field.name; });
					var originalFields = toMap(originalWorkflowStep.fields, function(field) { return field.name; });

					deepEqual(actualFields[context.cfNumericLookup].values, originalFields[context.cfNumericLookup].values, "XLS_kio_num_numlookup1 values equal");
					deepEqual(actualFields[context.cfDDLLinked].values, originalFields[context.cfDDLLinked].values, "XLS2_Text Box_Dropdown List_linked values equal");
					deepEqual(actualFields[context.cfHyperlink].urlItems, originalFields[context.cfHyperlink].urlItems, "MAS Hyperlink values equal");
					deepEqual(actualFields[context.cfMultiSelect].values, originalFields[context.cfMultiSelect].values, "XLS2_Multi- Selection List Box values equal");
					deepEqual(actualFields[context.cfBooleanCheckBox].values, originalFields[context.cfBooleanCheckBox].values, "XLS2_true/false_Check Box values equal");
					deepEqual(actualFields[context.cfBooleanDDL].values, originalFields[context.cfBooleanDDL].values, "XLS_kio_true-false_ddl_tvh values equal");
					deepEqual(actualFields[context.cfDDL].values, originalFields[context.cfDDL].values, "XLS2_Text Box_Dropdown List values equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update passed workflow step - Happy path with AssignedTo ids", 1, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var workflowStep;
		queue.enqueue(function(context) {
			workflowStep = new envianceSdk.workflows.WorkflowStepInfo("Transition to second step");
			workflowStep.setTransition(context.workflowStepActionName, new Date());
			workflowStep.transition.addUserAssignee(context.accessUserId);
			workflowStep.transition.addGroupAssignee(context.originalSystemId);
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update workflow current step - Happy path - Clear all UDF values", 15, function () {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function (response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				function (response) {
					context.workflowId = response.result;
					equal(response.metadata.statusCode, 201, "Status code is correct"); 
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowStepInfoNull = new envianceSdk.workflows.WorkflowStepInfo();
		workflowStepInfoNull.fields = [];
		workflowStepInfoNull.fields.push({ name: this.cfBooleanCheckBox, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfBooleanDDL, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfNumericLookup, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfDate, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfTime, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfDateTime, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfDDL, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfDDLLinked, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfMultiSelect, values: [null] });
		workflowStepInfoNull.fields.push({ name: this.cfHyperlink, urlItems: [null]});		

		queue.enqueue(function (context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStepInfoNull,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");
					var row = response.result[0].rows[0];
					strictEqual(row.values[0], null, "Boolean CheckBox value cleared");
					strictEqual(row.values[1], null, "Boolean DDL value cleared");
					strictEqual(row.values[2], null, "Numeric Lookup value cleared");
					strictEqual(row.values[3], null, "Date value cleared");
					strictEqual(row.values[4], null, "Time value cleared");
					strictEqual(row.values[5], null, "DateTime value cleared");
					strictEqual(row.values[6], null, "Hyperlink value cleared");
					strictEqual(row.values[7], null, "DDL value cleared");

					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");
					strictEqual(response.result[0].rows[0].values[0], null, "Linked DDL value cleared");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");
					strictEqual(response.result[0].rows[0].values[0], null, "Multiselect values cleared");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update workflow current step - Happy path - Clear single UDF value", 15, function () {
		var queue = new ActionQueue(this);

		var originalWorkflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function (response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(originalWorkflow, workflowStep,
				function (response) {
					context.workflowId = response.result;
					equal(response.metadata.statusCode, 201, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowStepInfoNull = new envianceSdk.workflows.WorkflowStepInfo();
		workflowStepInfoNull.fields = [];
		workflowStepInfoNull.fields.push({ name: this.cfDDL, values: [null] });

		queue.enqueue(function (context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStepInfoNull,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var tz;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function (response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], true, "Boolean DDL values equal");
					strictEqual(row.values[2], context.cfNumericLookupValue, "Numeric Lookup values equal");
					deepEqual(row.values[3], workflowStep.fields[3].values[0], "Date values equal");
					deepEqual(row.values[4], workflowStep.fields[4].values[0], "Time values equal");

					var expectedDatetime = toUTC(new Date(Date.parse(workflowStep.fields[5].values[0])), tz);
					deepEqual(row.values[5], expectedDatetime, "DateTime values equal");

					equal(row.values[6], workflowStep.fields[6].urlItems[0].url, "Hyperlinks are equal");
					strictEqual(row.values[7], null, "DDL value cleared");

					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = context.selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 3, "Row number matches");
					var actualValue = [
						response.result[0].rows[0].values[0],
						response.result[0].rows[1].values[0],
						response.result[0].rows[2].values[0]];
					deepEqual(actualValue, workflowStep.fields[9].values, "Multiselect values are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if user does not have access", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.noAccessUserName);

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4003, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if deleted user is assigned", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.deletedUserName);

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4004, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if expired user is assigned", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.expiredUserName);

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4005, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if user already specified", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var userName = context.noManageRightsUserName;
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addUserAssignee(userName)
				.addUserAssignee(userName);

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4006, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if group does not exist", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var notExistentGroupName = "notExistentGroupName";
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addGroupAssignee(notExistentGroupName);

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4007, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if group already specified", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var groupName = "Administrators";
			workflowStep.setTransition(context.workflowStepActionName, new Date())
				.addGroupAssignee(groupName)
				.addGroupAssignee(groupName);

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4008, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow step - Check warnings", 3, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflowStep = this.buildWorkflowStepInfo();
		originalWorkflowStep.id = createUUID();
		originalWorkflowStep.name = this.workflowStepName1;
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, originalWorkflowStep,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");

					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'name\'") > 0, "Warning for 'name' OK");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow step - Update related Task's Completion Status", 11, function () {
		// Given
		var queue = new ActionQueue(this);

		// These two instances are generated automatically
		var workflowId = "5EDA5F04-2E43-4368-ADBB-54EADAC55785";
		var taskId = "82F1D726-77DF-434A-9345-D0E0EF42A3D6";

		var task;
		var taskObject;
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for Task is correct");
					task = response.result;
					taskObject = task.objects[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, false, 0, 0, 0, '', new Date(1));
			envianceSdk.tasks.completeTaskOccurrence(taskId, task.dueDate, taskObject, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Task Occurrence clearing is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var originalTaskOccurrence;
		queue.enqueue(function (context) {
			var now = new Date();
			var stepInfo = new envianceSdk.workflows.WorkflowStepInfo("Updating Task Occurance");
			stepInfo.setTransition(context.workflowStepActionName, now);
			stepInfo.transition.addUserAssignee(context.accessUserName);

			var date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), ~~(now.getUTCMinutes() / 15) * 15 /*business works in this way*/, 0);
			date.setHours(date.getHours() + (task.timeZone.currentOffset / 60));

			originalTaskOccurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, false, 90, 5.5, 25, "Comment for object " + taskObject, date);
			stepInfo.taskCompletion = [originalTaskOccurrence];

			envianceSdk.workflows.updateWorkflowStep(workflowId, context.workflowStepName1, stepInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Update Workflow Step is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTaskOccurrence(taskId, task.dueDate, taskObject,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for saved Task Occurrence is correct");
					var taskOccurrence = response.result;
					equal(taskOccurrence[0].statusChangeDate.toUTCString(), originalTaskOccurrence.statusChangeDate.toUTCString(), "Task status status change date equal");
					equal(taskOccurrence[0].objectIdOrPath, originalTaskOccurrence.objectIdOrPath, "Task status object equal");
					equal(taskOccurrence[0].dismissed, originalTaskOccurrence.dismissed, "Task status dismissed status equal");
					equal(taskOccurrence[0].percentComplete, originalTaskOccurrence.percentComplete, "Task status percent complete equal");
					equal(taskOccurrence[0].hoursToComplete, originalTaskOccurrence.hoursToComplete, "Task status hours to complete equal");
					equal(taskOccurrence[0].costToComplete, originalTaskOccurrence.costToComplete, "Task status cost to complete equal");
					equal(taskOccurrence[0].comment, originalTaskOccurrence.comment, "Task status comment equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Update Task statuses - Happy path", 11, function () {
		// Given
		var queue = new ActionQueue(this);

		// These two instances are generated automatically
		var workflowId = "4802A696-EDB3-42D0-80A3-F72047DEDBEF"; // "workflow-instance-triggered-2"
		var taskId = "1252ED77-8AAD-471B-9E59-A442A4BDC155"; // "task-with-triggered-workflow-2"

		var task;
		var taskObject;
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for Task is correct");
					task = response.result;
					taskObject = task.objects[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, false, 0, 0, 0, '', new Date(1));
			envianceSdk.tasks.completeTaskOccurrence(taskId, task.dueDate, taskObject, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Task Occurrence clearing is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var originalTaskOccurrence;
		queue.enqueue(function (context) {
			var now = new Date();
			var stepInfo = new envianceSdk.workflows.WorkflowStepInfo("Updating Task Occurance for current step");

			var date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), ~~(now.getUTCMinutes() / 15) * 15 /*business works in this way*/, 0);
			date.setHours(date.getHours() + (task.timeZone.currentOffset / 60));

			originalTaskOccurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, false, 90, 5.5, 25, "Comment for object " + taskObject, date);
			stepInfo.taskCompletion = [originalTaskOccurrence];

			envianceSdk.workflows.updateWorkflowCurrentStep(workflowId, stepInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Update Workflow Step is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTaskOccurrence(taskId, task.dueDate, taskObject,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for saved Task Occurrence is correct");
					var taskOccurrence = response.result;
					equal(taskOccurrence[0].statusChangeDate.toUTCString(), originalTaskOccurrence.statusChangeDate.toUTCString(), "Task status status change date equal");
					equal(taskOccurrence[0].objectIdOrPath, originalTaskOccurrence.objectIdOrPath, "Task status object equal");
					equal(taskOccurrence[0].dismissed, originalTaskOccurrence.dismissed, "Task status dismissed status equal");
					equal(taskOccurrence[0].percentComplete, originalTaskOccurrence.percentComplete, "Task status percent complete equal");
					equal(taskOccurrence[0].hoursToComplete, originalTaskOccurrence.hoursToComplete, "Task status hours to complete equal");
					equal(taskOccurrence[0].costToComplete, originalTaskOccurrence.costToComplete, "Task status cost to complete equal");
					equal(taskOccurrence[0].comment, originalTaskOccurrence.comment, "Task status comment equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Update task statuses - Fault if Workflow has no parent Task", 2, function () {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function (context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var taskOccurrence = new envianceSdk.tasks.TaskOccurrenceInfo("/UDF_division/UDF_facility", false, 90, 5.5, 25, "Comment for object TestObject", new Date());
			workflowStep.taskCompletion = [taskOccurrence];

			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Update task statuses - Task status is not updated if it is dismissed", 10, function () {
		// Given
		var queue = new ActionQueue(this);

		// These two instances are generated automatically
		var workflowId = "AA680AC8-59C5-44C0-9F21-9852A29C847F"; // "workflow-instance-triggered-3"
		var taskId = "9F68EBC5-09F1-49A4-8E8A-13CCE2F15085"; // "task-with-triggered-workflow-3"

		var task;
		var taskObject;
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(taskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for Task is correct");
					task = response.result;
					taskObject = task.objects[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var occurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, true, 0, 0, 0, '', new Date(1));
			envianceSdk.tasks.completeTaskOccurrence(taskId, task.dueDate, taskObject, [occurrence],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Task Occurrence clearing is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		var originalTaskOccurrence;
		queue.enqueue(function (context) {
			var now = new Date();
			var stepInfo = new envianceSdk.workflows.WorkflowStepInfo("Updating Task Occurance for current step");

			var date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), ~~(now.getUTCMinutes() / 15) * 15 /*business works in this way*/, 0);
			date.setHours(date.getHours() + (task.timeZone.currentOffset / 60));

			originalTaskOccurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, true, 90, 5.5, 25, "Comment for object " + taskObject, date);
			stepInfo.taskCompletion = [originalTaskOccurrence];

			envianceSdk.workflows.updateWorkflowCurrentStep(workflowId, stepInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code for Update Workflow Step is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tasks.getTaskOccurrence(taskId, task.dueDate, taskObject,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code for saved Task Occurrence is correct");
					var taskOccurrence = response.result;
					equal(taskOccurrence[0].objectIdOrPath, originalTaskOccurrence.objectIdOrPath, "Task status object equal");
					notEqual(taskOccurrence[0].statusChangeDate.toUTCString(), originalTaskOccurrence.statusChangeDate.toUTCString(), "Task status status change dates are not equal");
					notEqual(taskOccurrence[0].percentComplete, originalTaskOccurrence.percentComplete, "Task status percent complete not equal");
					notEqual(taskOccurrence[0].hoursToComplete, originalTaskOccurrence.hoursToComplete, "Task status hours to complete not equal");
					notEqual(taskOccurrence[0].costToComplete, originalTaskOccurrence.costToComplete, "Task status cost to complete not equal");
					notEqual(taskOccurrence[0].comment, originalTaskOccurrence.comment, "Task status comment not equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Happy path", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Initiate child workflow - Happy path - Without workflowStepUpdateInformation", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			var info = icwContext.childWorkflowInitiationInfo;
			delete info.childInitStepInfo;
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if step is not current", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.parentStepIdOrName = context.workflowStepName2;
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4009, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if initiator is missing", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.initiatorIdOrName = "";
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4010, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if workflow instance already exists", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.uniqueId = icwContext.originalWorkflow.uniqueId;
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					equal(response.error.errorNumber, 101, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if no AssociateObject permissions", 2, function() {
		var self = this;
		var restoreSession = function () {
			envianceSdk.configure({ sessionId: self.originalSessionId });
		};

		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				}, context.errorHandler)
				.fail(restoreSession);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4010, "Error number is correct");
					// TODO: error number assert

					start();
				}).always(restoreSession);
		});

		queue.executeNext();
	});

	asyncTest("Initiate Child workflow - Ok if has Workflow Role overrides", 2, function() {
		var self = this;
		var restoreSession = function () {
			envianceSdk.configure({ sessionId: self.originalSessionId });
		};

		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserNameWithOverrides, context.password,
				function() {
					queue.executeNext();
				}, context.errorHandler).fail(restoreSession);
		});

		// Then
		queue.enqueue(function (context) {
			var info = icwContext.childWorkflowInitiationInfo;
			info.childInitStepInfo.comment = null;
			info.childInitStepInfo.transition = null;
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, info,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");

					start();
				}, context.errorHandler).always(restoreSession);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Due Date - Ensure TZ offset is correct", 3, function() {
		var dueDate = new Date(2013, 10, 5, 6, 30);

		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.dueDate = dueDate;
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, context.errorHandler);
		});

		var utcDueDate;
		queue.enqueue(function (context) {
			var eql = "SELECT wi.DueDate AS DueDate FROM WorkflowInstance wi WHERE wi.ID = '" + icwContext.workflowId + "'";
			envianceSdk.eql.execute(eql, 1, 1,
				function(response) {
					utcDueDate = response.result[0].rows[0].values[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					equal(utcDueDate.valueOf(), toUTC(dueDate, response.result.userTimeZone).valueOf(), "dueDate offset OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Calendars - Happy path", 1, function() {
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.calendars = ["My", "System"];
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Calendars - Fault when Calendar Type is empty", 2, function() {
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.calendars = [""];
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Calendars - Fault when Calendar Type doest not exist", 2, function() {
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.calendars = ["UnknownTestCalendarType"];
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Happy path - All properties", 15, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function (context) {
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			var eql = icwContext.selectWorkflowInstaceScalarUdfsQuery(icwContext.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], false, "Boolean DDL values equal");
					equal(row.values[2], "New Value", "DDL values equal");
					equal(row.values[3], "Large text value", "Large text values equal");
					equal(row.values[4], "Medium text value", "Medium text values equal");
					equal(row.values[5], "Small text value", "Small text values equal");

					equal(row.values[6], "http://www.ua.fm", "Hyperlinks are equal");
					equal(row.values[7], "simple text", "DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = icwContext.selectWorkflowInstaceLinkedValueUdfsQuery(icwContext.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"1234567890","simple text"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = icwContext.selectWorkflowInstaceMultiValueUdfsQuery(icwContext.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 3, "Row number matches");
					var actualValue = [
						response.result[0].rows[0].values[0],
						response.result[0].rows[1].values[0],
						response.result[0].rows[2].values[0]];
					deepEqual(actualValue, ["31/12/2011", "31-12-2011", "Select"], "Multiselect values are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault when missing Udf value updated", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo = context.buildWorkflowStepInfo();
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4011, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if user does not have access", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.setTransition("S2", new Date())
				.addUserAssignee(context.noAccessUserName);
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4003, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if deleted user is assigned", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.setTransition("S2", new Date())
				.addUserAssignee(context.deletedUserName);
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4004, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if expired user is assigned", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.setTransition("S2", new Date())
				.addUserAssignee(context.expiredUserName);
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4005, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if user already specified", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.setTransition("S2", new Date())
				.addUserAssignee(context.noManageRightsUserName)
				.addUserAssignee(context.noManageRightsUserName);
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4006, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if group does not exist", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.setTransition("S2", new Date())
				.addGroupAssignee("notExistentGroupName");
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4007, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if group already specified", 2, function() {
		// Given
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);
		icwContext.fillAllProperties(queue);

		// When
		queue.enqueue(function (context) {
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.setTransition("S2", new Date())
				.addGroupAssignee("Administrators")
				.addGroupAssignee("Administrators");
			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4008, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Check warnings", 9, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.id = createUUID();
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.parentUniqueId = createUUID();
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.status = "Status";
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.creator = context.accessUserName;
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.created = "2012-09-19T18:00:00";
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.lastRun = "2012-09-19T18:00:00";
			icwContext.childWorkflowInitiationInfo.childWorkflowInfo.assignedBy = context.accessUserName;

			icwContext.childWorkflowInitiationInfo.childInitStepInfo.id = createUUID();
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.name = context.workflowStepName1;

			envianceSdk.workflows.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					equal(response.metadata.warnings.match(/'id'/g).length, 2, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'parentUniqueId\'") > 0, "Warning for 'parentUniqueId' OK");
					ok(response.metadata.warnings.indexOf("\'status\'") > 0, "Warning for 'status' OK");
					ok(response.metadata.warnings.indexOf("\'creator\'") > 0, "Warning for 'creator' OK");
					ok(response.metadata.warnings.indexOf("\'created\'") > 0, "Warning for 'created' OK");
					ok(response.metadata.warnings.indexOf("\'lastRun\'") > 0, "Warning for 'lastRun' OK");
					ok(response.metadata.warnings.indexOf("\'assignedBy\'") > 0, "Warning for 'assignedBy' OK");
					ok(response.metadata.warnings.indexOf("\'name\'") > 0, "Warning for 'name' OK");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get current step by workflow ID", 12, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName1, workflowStep,
				function() {
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
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");

					var actualStep = response.result;
					equal(actualStep.name, context.workflowStepName1, "Workflow step name value equal");

					// Fields
					var actualFields = toMap(actualStep.fields, function(field) { return field.name; });
					var originalFields = toMap(workflowStep.fields, function(field) { return field.name; });

					deepEqual(actualFields[context.cfNumericLookup].values, originalFields[context.cfNumericLookup].values, "XLS_kio_num_numlookup1 values equal");

					var today = new Date();
					var actualTime = new Date(today.getMonth() + 1 + '/' + today.getDate() + '/' + today.getFullYear() + ' ' +
						actualFields[context.cfTime].values[0]);

					deepEqual(actualTime, originalFields[context.cfTime].values[0], "XLS_UDF_time values equal");
					deepEqual(actualFields[context.cfDDLLinked].values, originalFields[context.cfDDLLinked].values, "XLS2_Text Box_Dropdown List_linked values equal");
					deepEqual(actualFields[context.cfHyperlink].urlItems, originalFields[context.cfHyperlink].urlItems, "MAS Hyperlink values equal");
					deepEqual(actualFields[context.cfMultiSelect].values, originalFields[context.cfMultiSelect].values, "XLS2_Multi- Selection List Box values equal");
					deepEqual(actualFields[context.cfBooleanCheckBox].values, originalFields[context.cfBooleanCheckBox].values, "XLS2_true/false_Check Box values equal");
					deepEqual(actualFields[context.cfBooleanDDL].values, originalFields[context.cfBooleanDDL].values, "XLS_kio_true-false_ddl_tvh values equal");
					deepEqual(actualFields[context.cfDDL].values, originalFields[context.cfDDL].values, "XLS2_Text Box_Dropdown List values equal");

					var expectedDatetime = new Date(Date.parse(originalFields[context.cfDateTime].values[0]) - tzOffset * 60000);
					deepEqual(new Date(actualFields[context.cfDateTime].values[0]), expectedDatetime, "XLS_UDF_date time values (converted to Date) equal");
					deepEqual(new Date(actualFields[context.cfDate].values[0]), originalFields[context.cfDate].values[0], "XLS_UDF_date values (converted to Date) equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get current step by workflow unique ID", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName1, workflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowBlank.uniqueId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, context.workflowStepName1, "Workflow step name equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get previous step by workflow ID and step name", 3, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName1, workflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		var firstStep;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowId,
				function(response) {
					firstStep = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = new envianceSdk.workflows.WorkflowStepInfo("A second comment");
			workflowStep.setTransition(context.workflowStepActionName, new Date());

			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName1, workflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		var secondStep;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowId,
				function(response) {
					secondStep = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowStep(context.workflowId, firstStep.name,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					notEqual(response.result.name, secondStep.name, "Specified step name and current step name are not equal");
					deepEqual(response.result, firstStep, "Specified step and first step are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get step by User with no rights", 2, function () {
		var queue = new ActionQueue(this);
		var workflow;
		queue.enqueue(function (context) {
			envianceSdk.workflows.generateUniqueIds(context.workflowTypeName, 1,
				function (response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.workflows.createWorkflow(workflow, null,
				function (response) {
					context.workflowId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});
		
		var workflowStep;
		queue.enqueue(function (context) {
			workflowStep = new envianceSdk.workflows.WorkflowStepInfo("Transition to second step");
			workflowStep.setTransition(context.workflowStepActionName, new Date());
			// Add user with no rights to assignee  
			workflowStep.transition.addUserAssignee(context.noManageRightsUserName);
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});
		
	
		queue.enqueue(function (context) {
			var workflowStep2 = context.buildWorkflowStepInfo();
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName2, workflowStep2,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});
		
		//authenticate as user with no rights
		queue.enqueue(function (context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					ok(response.result.fields.length > 0,"Fields selected.");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Fault if workflow instance does not exist", 2, function() {
		var invalidWorkflowId = createUUID();
		var self = this;
		
		envianceSdk.workflows.getWorkflowCurrentStep(invalidWorkflowId,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get workflow step - Fault if workflow step name does not exist", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowStep(context.workflowId, "NotExistStepName",
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Get workflow permissions - Get workflow/step permissions by workflow ID, step ID, user ID", 2, function () {
		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function (context) {
			var workflowStep = context.buildWorkflowStepInfo();
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, context.workflowStepName1, workflowStep,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});

		var firstStep;
		queue.enqueue(function (context) {
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowId,
				function (response) {
					firstStep = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.workflows.resolvePermissions(context.workflowId, firstStep.name, context.accessUserId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					notStrictEqual(response.result['stepActions'], null, "Unexpected result");
				
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeWorkflowServiceTests();
}