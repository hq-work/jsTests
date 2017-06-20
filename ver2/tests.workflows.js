if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Workflows', execute: executeWorkflowServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeWorkflowServiceTests() {
	module("Workflow Service", {
		setup: function () {
			this.noManageRightsUserName += qUnitDbSuffix;
			this.deletedUserName += qUnitDbSuffix;
			this.expiredUserName += qUnitDbSuffix;
			this.noManageRightsUserNameWithOverrides += qUnitDbSuffix;
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

			envianceSdk.eql.execute(selectWorkflowInstancesByTypeQuery(workflowTypesToClear), 1, 100,
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

	var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";

	// local constants
	var workflowTypesToClear = ["XLS_kio_WF_type1", "!Workflow Type 1", "UDF_Workflow Type", "XLS_kio_WF_type2", "WF_permissions_rename", "WF_permissions_uniqueId"];
	
	var workflowTypeName		= "UDF_Workflow Type";
	var objectsPath				= "/UDF_division/UDF_facility";
	var documentsPath			= "/250/99999.xls";

	var workflowStepName1		= "S1";
	var workflowStepName2		= "S2";
	var workflowStepActionName	= "go to next step";

	var cfBooleanCheckBox		= "XLS2_true/false_Check Box";
	var cfBooleanDDL			= "XLS_kio_true-false_ddl_tvh";
	var cfBooleanDDL2			= "XLS2_true/false_Dropdown List";
	var cfNumericLookup			= "XLS_kio_num_numlookup1";
	var cfNumericLookupValue	= -0.0025;
	var cfDate					= "XLS_UDF_date";
	var cfTime					= "XLS_UDF_time";
	var cfDateTime				= "XLS_UDF_date time";
	var cfHyperlinkMAS			= "MAS Hyperlink";
	var cfHyperlink				= "XLS2_Default URL (HTTP,SMTP,FTP)";
	var cfDDL					= "XLS2_Text Box_Dropdown List";
	var cfDDLLinked				= "XLS2_Text Box_Dropdown List_linked";
	var cfMultiSelect			= "XLS2_Multi- Selection List Box";
	var cfDDLWithTB				= "XLS2_Text Box_Dropdown List with Text Box";
	var cfTextLarge				= "XLS2_Text Box_Large (7900 char max)";
	var cfTextMedium			= "XLS2_Text Box_Medium (50 char max)";
	var cfTextSmall				= "XLS2_Text Box_Small (20 char max)";
	
	var objectsWithSystemColumn	= "('/' + wi.Object.Path + '/' + wi.Object.Name) AS Objects ";
	var objectsColumn			= "('/' + wi.Object.Path + '/' + wi.Object.Name) AS Objects ";	
	
	var selectWorkflowInstanceQuery = function(workflowId, columns, joins, conditions) {
		columns = (typeof columns == "undefined") ? "" : ", " + columns + " ";
		joins = (typeof joins == "undefined") ? "" : " " + joins + " ";
		conditions = (typeof conditions == "undefined") ? "" : " " + conditions + " ";
		return "SELECT wt.Name AS WorkflowTypeName, wi.Name, wi.UniqueId" + columns +
			"FROM WorkflowInstance wi " +
			"JOIN WorkflowType wt ON wi " + joins +
			"WHERE wi.ID = '" + workflowId + "'" + conditions;
	};

	var selectWorkflowInstanceQueryByIds = function(workflowIds, columns, joins, conditions) {
		columns = (typeof columns == "undefined") ? "" : ", " + columns + " ";
		joins = (typeof joins == "undefined") ? "" : " " + joins + " ";
		conditions = (typeof conditions == "undefined") ? "" : " " + conditions + " ";
		return "SELECT wt.Name AS WorkflowTypeName, wi.Name, wi.UniqueId" + columns +
			"FROM WorkflowInstance wi " +
			"JOIN WorkflowType wt ON wi " + joins +
			"WHERE wi.ID IN ('" + workflowIds.join("', '") + "')" + conditions;
	};

	var selectWorkflowInstancesByTypeQuery = function(workflowTypes) {
		return "SELECT wi.ID FROM WorkflowInstance wi " +
			"JOIN WorkflowType wt ON wi " +
			"WHERE wt.Name IN ('" + workflowTypes.join("', '") + "')";
	};

	var selectWorkflowInstaceScalarUdfsQuery = function(workflowId) {
		return "SELECT ws.\"" + cfBooleanCheckBox + "\", " +
			"ws.\"" + cfBooleanDDL + "\", ws.\"" + cfNumericLookup + "\", " +
			"ws.\"" + cfDate + "\", ws.\"" + cfTime + "\", ws.\"" + cfDateTime + "\", " +
			"ws.\"" + cfHyperlinkMAS + "\", ws.\"" + cfDDL + "\", ws.Name " +
			"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
			"WHERE wi.ID = '" + workflowId + "'";
	};
	
	var selectWorkflowInstaceScalarUdfsQuery2 = function(workflowId) {
		return "SELECT ws.\"" + cfBooleanCheckBox + "\", " +
			"ws.\"" + cfBooleanDDL2 + "\", ws.\"" + cfDDLWithTB + "\", " +
			"ws.\"" + cfTextLarge + "\", ws.\"" + cfTextMedium + "\", ws.\"" + cfTextSmall + "\", " +
			"ws.\"" + cfHyperlink + "\", ws.\"" + cfDDL + "\" " +
			"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
			"WHERE wi.ID = '" + workflowId + "'";
	};

	var selectWorkflowInstaceLinkedValueUdfsQuery = function(workflowId) {
		return "SELECT ws.\"" + cfDDLLinked + "\", ws.Name " +
			"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
			"WHERE wi.ID = '" + workflowId + "'";
	};
	
	var selectWorkflowInstaceMultiValueUdfsQuery = function(workflowId) {
		return "SELECT ws.\"" + cfMultiSelect + "\", ws.Name " +
			"FROM WorkflowInstance wi JOIN WorkflowStep ws on ws.ID = wi.CurrentStepID " +
			"WHERE wi.ID = '" + workflowId + "'";
	};

	var buildWorkflowCreationInfo = function(typeName, name, uniqueId, objects) {
		var result = new envianceSdk.workflows.WorkflowInfo(typeName, name, uniqueId);
		result.addPathAssociatedObject(objects);
		return result;
	};
	
	var buildWorkflowUpdateInfo = function() {
		var updateInfo = new envianceSdk.workflows.WorkflowInfo()
			.addDocument(documentsPath)
			.addPathAssociatedObject(objectsPath);

		updateInfo.dueDate = envianceSdk.IsoDate.parse("2012-09-19T18:00:00");
		updateInfo.uniqueId = "Updated_unique_ID";
		updateInfo.name = "WF name Updated";
		updateInfo.calendars = ["My", "System"];
		updateInfo.comment = "Update workflow comment";
		return updateInfo;
	};
	
	var buildWorkflowStepInfo = function() {
		return new envianceSdk.workflows.WorkflowStepInfo("A comment")
			.addScalarFieldValue(cfBooleanCheckBox, "True")
			.addScalarFieldValue(cfBooleanDDL, "True :)")
			.addScalarFieldValue(cfNumericLookup, "<br>")
			.addDateFieldValue(cfDate, "2012-09-10")
			.addTimeFieldValue(cfTime, "10:30 PM")
			.addDateFieldValue(cfDateTime, "2012-10-11T19:40")
			.addUrlFieldValue(cfHyperlinkMAS, "HyperLink label", "http://moto.kiev.ua")
			.addLinkedFieldValues(cfDDL, ['Select'])
			.addLinkedFieldValues(cfDDLLinked, ['1234567890', '10234567.89'])
			.addMultiFieldValues(cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);
	};

	var addBuildWorkflowBlankAction = function(queue, dueDate, customWorkflowTypeName) {
		queue.enqueue(function(context) {
			var wfTypeName = customWorkflowTypeName || workflowTypeName; 
			
			envianceSdk.workflows.generateUniqueIds(wfTypeName, 1,
				function(response) {
					context.workflowBlank = new envianceSdk.workflows.WorkflowInfo(
						wfTypeName, "WF name", response.result[0]);

					if (dueDate) {
						context.workflowBlank.dueDate = dueDate;
					}

					queue.executeNext();
				},
				context.errorHandler);
		});
	};

	var addCreateWorkflowFromBlankAction = function(queue) {
		queue.enqueue(function(context) {
			envianceSdk.workflows.createWorkflow(context.workflowBlank, null,
				function(response) {
					context.workflowId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});
	};
	
	var InitiateChildWorkflowContext = function() {
		this.childWorkflowInitiationInfo = null;
		this.originalWorkflow = null;
		this.workflowId = null;
	};

	InitiateChildWorkflowContext.prototype = {
		addDefaultActions: function(queue) {
			var self = this;
			queue.enqueue(function(context) {
				var xlsWorkflowTypeName = "XLS_kio_WF_type1";
				envianceSdk.workflows.generateUniqueIds(xlsWorkflowTypeName, 2,
					function(response) {
						var updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("A comment")
							.addMultiFieldValues(cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);

						var workflowStepName = "<br> step 1";
						var workflowInitiatorName = "<!-- initiator 1";
						self.childWorkflowInitiationInfo = new envianceSdk.workflows.ChildWorkflowInitiationInfo(
							workflowStepName, workflowInitiatorName,
							buildWorkflowCreationInfo(
								xlsWorkflowTypeName, "WF name child", response.result[0], objectsPath),
							updateStepInfo);

						self.originalWorkflow = buildWorkflowCreationInfo(
							xlsWorkflowTypeName, "WF name parent", response.result[1], objectsPath);

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
				var xlsWorkflowTypeName = "XLS_kio_WF_type1";
				envianceSdk.workflows.generateUniqueIds(xlsWorkflowTypeName, 2,
					function(response) {
						var updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("A comment")
							.addMultiFieldValues(cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);

						var workflowStepName = "<br> step 1";
						var workflowInitiatorName = "<!-- initiator 1";
						self.childWorkflowInitiationInfo = new envianceSdk.workflows.ChildWorkflowInitiationInfo(
							workflowStepName, workflowInitiatorName,
							buildWorkflowCreationInfo(
								xlsWorkflowTypeName, "WF name child", response.result[0], objectsPath),
							updateStepInfo);

						self.originalWorkflow = buildWorkflowCreationInfo(
							xlsWorkflowTypeName, "WF name parent", response.result[1], objectsPath);

						queue.executeNext();
					}, context.errorHandler);
			});
		},
		fillAllProperties: function(queue) {
			var self = this;
			queue.enqueue(function(context) {
				var updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("WF name")
					.addUrlFieldValue(cfHyperlink, "label", "http://www.ua.fm")
					.addMultiFieldValues(cfMultiSelect, ["31/12/2011", "31-12-2011", "Select"])
					.addLinkedFieldValues(cfDDL, ["simple text"])
					.addLinkedFieldValues(cfDDLWithTB, ["New Value"])
					.addLinkedFieldValues(cfDDLLinked, ["1234567890", "simple text"])
					.addScalarFieldValue(cfTextLarge, "Large text value")
					.addScalarFieldValue(cfTextMedium, "Medium text value")
					.addScalarFieldValue(cfTextSmall, "Small text value")
					.addScalarFieldValue(cfBooleanCheckBox, "True")
					.addScalarFieldValue(cfBooleanDDL2, "False");
				self.childWorkflowInitiationInfo.childInitStepInfo = updateStepInfo;
				queue.executeNext();
			});
		}
	};

	asyncTest("Workflow Batch - Create 2 workflows (same name) - Happy path", 9, function () {
		var self = this;

		var errorHandled = 0;
		var errorHandler = function (errorResponse, status, message) {
			self.errorHandler(errorResponse, status, message, null, errorHandled++);
		};
		
		var queue = new ActionQueue(this);

		var workflowIds = [];
		var originalWorkflows = {};
		var doneCallbacks = 0;
		var operCount = 0;

		queue.doNext = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) this.executeNext();
		};

		queue.enqueue(function (context) {
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 2,
				function (response) {
					originalWorkflows[response.result[0]] = buildWorkflowCreationInfo(workflowTypeName, "WF name", response.result[0], objectsPath);
					originalWorkflows[response.result[1]] = buildWorkflowCreationInfo(workflowTypeName, "WF name", response.result[1], objectsPath);
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
			var eql = selectWorkflowInstanceQueryByIds(workflowIds, objectsColumn);
			envianceSdk.eql.execute(eql, 1, 2,
				function (response) {
					var row1 = response.result[0].rows[0];
					var createdWorkflow1 = buildWorkflowCreationInfo(row1.values[0], row1.values[1], row1.values[2], row1.values[3]);
					var row2 = response.result[0].rows[1];
					var createdWorkflow2 = buildWorkflowCreationInfo(row2.values[0], row2.values[1], row2.values[2], row2.values[3]);

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
		envianceSdk.workflows.generateUniqueIds(workflowTypeName, 5,
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
		var workflowTypeName256 = '';
		for (var i = 0; i < 256; i++) {
			workflowTypeName256 += 's';
		}
		envianceSdk.workflows.generateUniqueIds(workflowTypeName256, 1,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4001, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if count is too small", 2, function() {
		var self = this;
		envianceSdk.workflows.generateUniqueIds(workflowTypeName, 0,
			self.successHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4002, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if count is too large", 2, function() {
		var self = this;
		envianceSdk.workflows.generateUniqueIds(workflowTypeName, 2001,
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
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
			var eql = selectWorkflowInstanceQuery(workflowId, objectsColumn);
			envianceSdk.eql.execute(eql, 1, 1,
				function(response) {
					var row = response.result[0].rows[0];
					var createdWorkflow = buildWorkflowCreationInfo(row.values[0], row.values[1], row.values[2], row.values[3]);

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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = buildWorkflowCreationInfo(workflowTypeName, "WF name", uniqueId, objectsPath);
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = buildWorkflowCreationInfo(workflowTypeName, "WF name", uniqueId, objectsPath);
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
		addBuildWorkflowBlankAction(queue, dueDate);
		addCreateWorkflowFromBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);

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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		var workflowStep = buildWorkflowStepInfo();
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
			var eql = selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], true, "Boolean DDL values equal");
					strictEqual(row.values[2], cfNumericLookupValue, "Numeric Lookup values equal");
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
			var eql = selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			workflowStep.setTransition(workflowStepActionName, new Date())
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			workflowStep.setTransition(workflowStepActionName, new Date())
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			workflowStep.setTransition(workflowStepActionName, new Date())
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			var userName = context.noManageRightsUserName;
			workflowStep.setTransition(workflowStepActionName, new Date())
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			var notExistentGroupName = "notExistentGroupName";
			workflowStep.setTransition(workflowStepActionName, new Date())
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			var groupName = "Administrators";
			workflowStep.setTransition(workflowStepActionName, new Date())
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					originalWorkflow.id = createUUID();
					originalWorkflow.parentUniqueId = createUUID();
					originalWorkflow.status = "Status";
					originalWorkflow.creator = context.accessUserName;
					originalWorkflow.created = "2012-09-19T18:00:00";
					originalWorkflow.lastRun = "2012-09-19T18:00:00";
					originalWorkflow.assignedBy = context.accessUserName;

					updateStepInfo = new envianceSdk.workflows.WorkflowStepInfo("A comment");
					updateStepInfo.id = createUUID();
					updateStepInfo.name = workflowStepName1;
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					originalWorkflow.addDocument(documentsPath);
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
			var columns = objectsWithSystemColumn + ", wi.Document.FullPath, wi.StatusName, wi.Created, wi.LastRun, wi.DueDate";
			var joinSystem = "JOIN System s ON s.ID = '" + context.originalSystemId + "' ";
			var eql = selectWorkflowInstanceQuery(workflowId, columns, joinSystem);

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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowUpdateInfo = buildWorkflowUpdateInfo();
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
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
		var noManageRightsUserId;
		
		queue.enqueue(function (context) {
			envianceSdk.eql.execute("select u.id from user u where u.login ='" + context.noManageRightsUserName + "'",1,10,
						function (response) {
							noManageRightsUserId = response.result[0].rows[0].values[0];
							queue.executeNext();
						}, context.errorHandler);
		});

		var workflowInfo;
		queue.enqueue(function(context) {
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
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
			workflowInfo.addUserAssignee(noManageRightsUserId);
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

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
		var workflowInfo = buildWorkflowUpdateInfo();

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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowUpdateInfo = buildWorkflowUpdateInfo();
		workflowUpdateInfo.id = createUUID();
		workflowUpdateInfo.workflowTypeName = workflowTypeName;
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
		addBuildWorkflowBlankAction(queue, null, "WF_permissions_rename");
		addCreateWorkflowFromBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue, null, "WF_permissions_uniqueId");
		addCreateWorkflowFromBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue, null, "WF_permissions_rename");
		addCreateWorkflowFromBlankAction(queue);

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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = buildWorkflowCreationInfo(workflowTypeName, "WF name", uniqueId, objectsPath);
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = buildWorkflowStepInfo();
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
			var eql = selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], true, "Boolean DDL values equal");
					strictEqual(row.values[2], cfNumericLookupValue, "Numeric Lookup values equal");
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
			var eql = selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		var originalWorkflowStep = buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, originalWorkflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		// When
		var modifiedWorkflowStep = buildWorkflowStepInfo();
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
			var eql = selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
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
					strictEqual(row.values[2], cfNumericLookupValue, "Numeric Lookup value unchanged");

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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		var workflowStep;
		queue.enqueue(function(context) {
			workflowStep = new envianceSdk.workflows.WorkflowStepInfo("Transition to second step");
			workflowStep.setTransition(workflowStepActionName, new Date());
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		var originalWorkflowStep = buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName1, originalWorkflowStep,
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
			envianceSdk.workflows.getWorkflowStep(context.workflowId, workflowStepName1,
				function(response) {
					var updatedStep = response.result;

					equal(updatedStep.comment, originalWorkflowStep.comment, "Step comment equal");
					equal(updatedStep.name, workflowStepName1, "Step name equal");

					var actualFields = toMap(updatedStep.fields, function(field) { return field.name; });
					var originalFields = toMap(originalWorkflowStep.fields, function(field) { return field.name; });

					deepEqual(actualFields[cfNumericLookup].values, originalFields[cfNumericLookup].values, "XLS_kio_num_numlookup1 values equal");
					deepEqual(actualFields[cfDDLLinked].values, originalFields[cfDDLLinked].values, "XLS2_Text Box_Dropdown List_linked values equal");
					deepEqual(actualFields[cfHyperlinkMAS].urlItems, originalFields[cfHyperlinkMAS].urlItems, "MAS Hyperlink values equal");
					deepEqual(actualFields[cfMultiSelect].values, originalFields[cfMultiSelect].values, "XLS2_Multi- Selection List Box values equal");
					deepEqual(actualFields[cfBooleanCheckBox].values, originalFields[cfBooleanCheckBox].values, "XLS2_true/false_Check Box values equal");
					deepEqual(actualFields[cfBooleanDDL].values, originalFields[cfBooleanDDL].values, "XLS_kio_true-false_ddl_tvh values equal");
					deepEqual(actualFields[cfDDL].values, originalFields[cfDDL].values, "XLS2_Text Box_Dropdown List values equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update passed workflow step - Happy path with AssignedTo ids", 1, function() {
		// Given
		var queue = new ActionQueue(this);
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		var workflowStep;
		queue.enqueue(function(context) {
			workflowStep = new envianceSdk.workflows.WorkflowStepInfo("Transition to second step");
			workflowStep.setTransition(workflowStepActionName, new Date());
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function (response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowStep = buildWorkflowStepInfo();
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
		workflowStepInfoNull.fields.push({ name: cfBooleanCheckBox, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfBooleanDDL, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfNumericLookup, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfDate, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfTime, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfDateTime, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfDDL, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfDDLLinked, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfMultiSelect, values: [null] });
		workflowStepInfoNull.fields.push({ name: cfHyperlinkMAS, urlItems: [null]});		

		queue.enqueue(function (context) {
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStepInfoNull,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
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
			var eql = selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");
					strictEqual(response.result[0].rows[0].values[0], null, "Linked DDL value cleared");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function (response) {
					originalWorkflow = buildWorkflowCreationInfo(
						workflowTypeName, "WF name", response.result[0], objectsPath);
					queue.executeNext();
				}, context.errorHandler);
		});

		var workflowStep = buildWorkflowStepInfo();
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
		workflowStepInfoNull.fields.push({ name: cfDDL, values: [null] });

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
			var eql = selectWorkflowInstaceScalarUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var row = response.result[0].rows[0];
					strictEqual(row.values[0], true, "Boolean CheckBox values equal");
					strictEqual(row.values[1], true, "Boolean DDL values equal");
					strictEqual(row.values[2], cfNumericLookupValue, "Numeric Lookup values equal");
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
			var eql = selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function (response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = selectWorkflowInstaceMultiValueUdfsQuery(context.workflowId);
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			workflowStep.setTransition(workflowStepActionName, new Date())
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			workflowStep.setTransition(workflowStepActionName, new Date())
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			workflowStep.setTransition(workflowStepActionName, new Date())
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			var userName = context.noManageRightsUserName;
			workflowStep.setTransition(workflowStepActionName, new Date())
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			var notExistentGroupName = "notExistentGroupName";
			workflowStep.setTransition(workflowStepActionName, new Date())
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			var groupName = "Administrators";
			workflowStep.setTransition(workflowStepActionName, new Date())
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		var originalWorkflowStep = buildWorkflowStepInfo();
		originalWorkflowStep.id = createUUID();
		originalWorkflowStep.name = workflowStepName1;
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
			stepInfo.setTransition(workflowStepActionName, now);
			stepInfo.transition.addUserAssignee(context.accessUserName);

			var date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), ~~(now.getUTCMinutes() / 15) * 15 /*business works in this way*/, 0);
			date.setHours(date.getHours() + (task.timeZone.currentOffset / 60));

			originalTaskOccurrence = new envianceSdk.tasks.TaskOccurrenceInfo(taskObject, false, 90, 5.5, 25, "Comment for object " + taskObject, date);
			stepInfo.taskCompletion = [originalTaskOccurrence];

			envianceSdk.workflows.updateWorkflowStep(workflowId, workflowStepName1, stepInfo,
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function (context) {
			var workflowStep = buildWorkflowStepInfo();
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
			var eql = selectWorkflowInstaceScalarUdfsQuery2(icwContext.workflowId);
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
			var eql = selectWorkflowInstaceLinkedValueUdfsQuery(icwContext.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"1234567890","simple text"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			var eql = selectWorkflowInstaceMultiValueUdfsQuery(icwContext.workflowId);
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
			icwContext.childWorkflowInitiationInfo.childInitStepInfo = buildWorkflowStepInfo();
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
			icwContext.childWorkflowInitiationInfo.childInitStepInfo.name = workflowStepName1;

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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName1, workflowStep,
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
					equal(actualStep.name, workflowStepName1, "Workflow step name value equal");

					// Fields
					var actualFields = toMap(actualStep.fields, function(field) { return field.name; });
					var originalFields = toMap(workflowStep.fields, function(field) { return field.name; });

					deepEqual(actualFields[cfNumericLookup].values, originalFields[cfNumericLookup].values, "XLS_kio_num_numlookup1 values equal");

					var today = new Date();
					var actualTime = new Date(today.getMonth() + 1 + '/' + today.getDate() + '/' + today.getFullYear() + ' ' +
						actualFields[cfTime].values[0]);

					deepEqual(actualTime, originalFields[cfTime].values[0], "XLS_UDF_time values equal");
					deepEqual(actualFields[cfDDLLinked].values, originalFields[cfDDLLinked].values, "XLS2_Text Box_Dropdown List_linked values equal");
					deepEqual(actualFields[cfHyperlinkMAS].urlItems, originalFields[cfHyperlinkMAS].urlItems, "MAS Hyperlink values equal");
					deepEqual(actualFields[cfMultiSelect].values, originalFields[cfMultiSelect].values, "XLS2_Multi- Selection List Box values equal");
					deepEqual(actualFields[cfBooleanCheckBox].values, originalFields[cfBooleanCheckBox].values, "XLS2_true/false_Check Box values equal");
					deepEqual(actualFields[cfBooleanDDL].values, originalFields[cfBooleanDDL].values, "XLS_kio_true-false_ddl_tvh values equal");
					deepEqual(actualFields[cfDDL].values, originalFields[cfDDL].values, "XLS2_Text Box_Dropdown List values equal");

					var expectedDatetime = new Date(Date.parse(originalFields[cfDateTime].values[0]) - tzOffset * 60000);
					deepEqual(new Date(actualFields[cfDateTime].values[0]), expectedDatetime, "XLS_UDF_date time values (converted to Date) equal");
					deepEqual(new Date(actualFields[cfDate].values[0]), originalFields[cfDate].values[0], "XLS_UDF_date values (converted to Date) equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get current step by workflow unique ID", 2, function() {
		// Given
		var queue = new ActionQueue(this);
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName1, workflowStep,
				function() {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflows.getWorkflowCurrentStep(context.workflowBlank.uniqueId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, workflowStepName1, "Workflow step name equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get previous step by workflow ID and step name", 3, function() {
		// Given
		var queue = new ActionQueue(this);
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = buildWorkflowStepInfo();
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName1, workflowStep,
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
			workflowStep.setTransition(workflowStepActionName, new Date());

			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName1, workflowStep,
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
			envianceSdk.workflows.generateUniqueIds(workflowTypeName, 1,
				function (response) {
					var uniqueId = response.result[0];
					workflow = buildWorkflowCreationInfo(workflowTypeName, "WF name", uniqueId, objectsPath);
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
			workflowStep.setTransition(workflowStepActionName, new Date());
			// Add user with no rights to assignee  
			workflowStep.transition.addUserAssignee(context.noManageRightsUserName);
			envianceSdk.workflows.updateWorkflowCurrentStep(context.workflowId, workflowStep,
				function () {
					queue.executeNext();
				}, context.errorHandler);
		});
		
	
		queue.enqueue(function (context) {
			var workflowStep2 = buildWorkflowStepInfo();
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName2, workflowStep2,
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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

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
		addBuildWorkflowBlankAction(queue);
		addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function (context) {
			var workflowStep = buildWorkflowStepInfo();
			envianceSdk.workflows.updateWorkflowStep(context.workflowId, workflowStepName1, workflowStep,
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

//# sourceURL=tests.workflows.js