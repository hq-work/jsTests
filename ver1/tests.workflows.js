if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Workflows', execute: executeWorkflowServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof workflowConfig == "undefined")
	workflowConfig = { };

function executeWorkflowServiceTests() {
	module("Workflow Service", {
		setup: function() {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			this.noManageRightsUserName = workflowConfig.noManageRightsUserName || "jstestsWPermissions";
			this.noAccessUserName = workflowConfig.noAccessUserName || "jstestsNotAccessUser";
			this.deletedUserName = workflowConfig.deletedUserName || "jstestsDeletedUser";
			this.expiredUserName = workflowConfig.expiredUserName || "jstestsExpiredUser";
			this.noManageRightsUserNameWithOverrides = workflowConfig.noManageRightsUserNameWithOverrides || "jstestsWPermissionsWithOverrides";
			this.password = workflowConfig.password || "1111";

			this.workflowTypesToClear = ["XLS_kio_WF_type1", "!Workflow Type 1", "UDF_Workflow Type"];
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
				var result = new envianceSdk.workflow.CreationInformation(typeName, name, uniqueId);
				result.addPathAssociatedObject(objects);
				return result;
			};

			this.buildWorkflowUpdateInfo = function() {
				var updateInfo = new envianceSdk.workflow.CreationInformation()
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
				return new envianceSdk.workflow.StepInformation("A comment")
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

			this.addBuildWorkflowBlankAction = function(queue, dueDate) {
				queue.enqueue(function(context) {
					envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
						function(response) {
							context.workflowBlank = new envianceSdk.workflow.CreationInformation(
								context.workflowTypeName, "WF name", response.result[0]);

							if (dueDate) {
								context.workflowBlank.dueDate = dueDate;
							}

							queue.executeNext();
						},
						function() {
							ok(false, "failed");
							start();
						});
				});
			};

			this.addCreateWorkflowFromBlankAction = function(queue) {
				queue.enqueue(function(context) {
					envianceSdk.workflow.createWorkflow(context.workflowBlank,
						function(response) {
							context.workflowId = response.result;
							queue.executeNext();
						}, function() {
							ok(false, "failed");
							start();
						});
				});
			};
		},

		teardown: function() {
			stop();
			var errorHandler = function() {
				start();
			};
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			envianceSdk.eql.execute(this.selectWorkflowInstancesByTypeQuery(this.workflowTypesToClear), 1, 100,
				function(response) {
					var rows = response.result[0].rows;

					for (var i = 0; i < rows.length; i++) {
						stop();

						var workflowId = rows[i].values[0];
						envianceSdk.workflow.deleteWorkflow(workflowId,
							function() {
								start();
							}, errorHandler);
					}

					start();
				}, errorHandler);
		}
	});

	InitiateChildWorkflowContext = function() {
		this.childWorkflowInitiationInfo = null;
		this.originalWorkflow = null;
		this.workflowId = null;
		this.cfHyperlink = "XLS2_Default URL (HTTP,SMTP,FTP)";
		this.cfDDL = "XLS2_Text Box_Dropdown List";
		this.cfDDLWithTB = "XLS2_Text Box_Dropdown List with Text Box";
		this.cfDDLLinked = "XLS2_Text Box_Dropdown List_linked";
		this.customFieldTextLarge = "XLS2_Text Box_Large (7900 char max)";
		this.customFieldTextMedium = "XLS2_Text Box_Medium (50 char max)";
		this.customFieldTextSmall = "XLS2_Text Box_Small (20 char max)";
		this.cfBooleanCheckBox = "XLS2_true/false_Check Box";
		this.cfBooleanDDL = "XLS2_true/false_Dropdown List";
		this.cfMultiSelect = "XLS2_Multi- Selection List Box";
	};

	InitiateChildWorkflowContext.prototype = {
		errorHandler: function(errorResponse, status, message, ctx) {
			var result;
			if (errorResponse.error != null && typeof errorResponse.error === 'object')
				result = errorResponse.error.message;
			else
				result = errorResponse.error;
			ok(false, result);
			start();
		},
		successHandler: function() {
			ok(false, "failed");
			start();
		},
		addDefaultActions: function(queue) {
			var self = this;
			queue.enqueue(function(context) {
				var workflowTypeName = "XLS_kio_WF_type1";
				envianceSdk.workflow.generateUniqueIDs(workflowTypeName, 2,
					function(response) {
						var updateStepInfo = new envianceSdk.workflow.StepInformation("A comment")
							.addMultiFieldValues(context.cfMultiSelect, ['31/12/2011', '31-12-2011', 'Select']);

						var workflowStepName = "<br> step 1";
						var workflowInitiatorName = "<!-- initiator 1";
						self.childWorkflowInitiationInfo = new envianceSdk.workflow.ChildWorkflowInitiationInformation(
							workflowStepName, workflowInitiatorName,
							context.buildWorkflowCreationInfo(
								workflowTypeName, "WF name child", response.result[0], context.objectsPath),
							updateStepInfo);

						self.originalWorkflow = context.buildWorkflowCreationInfo(
							workflowTypeName, "WF name parent", response.result[1], context.objectsPath);

						queue.executeNext();
					}, self.errorHandler);
			});

			queue.enqueue(function() {
				envianceSdk.workflow.createWorkflow(self.originalWorkflow,
					function(response) {
						self.workflowId = response.result;
						queue.executeNext();
					}, self.errorHandler);
			});
		},
		fillAllProperties: function(queue) {
			var self = this;
			queue.enqueue(function() {
				var updateStepInfo = new envianceSdk.workflow.StepInformation("WF name")
					.addUrlFieldValue(self.cfHyperlink, "label", "http://www.ua.fm")
					.addMultiFieldValues(self.cfMultiSelect, ["31/12/2011", "31-12-2011", "Select"])
					.addLinkedFieldValues(self.cfDDL, ["simple text"])
					.addLinkedFieldValues(self.cfDDLWithTB, ["New Value"])
					.addLinkedFieldValues(self.cfDDLLinked, ["1234567890", "simple text"])
					.addScalarFieldValue(self.customFieldTextLarge, "Large text value")
					.addScalarFieldValue(self.customFieldTextMedium, "Medium text value")
					.addScalarFieldValue(self.customFieldTextSmall, "Small text value")
					.addScalarFieldValue(self.cfBooleanCheckBox, "True")
					.addScalarFieldValue(self.cfBooleanDDL, "False");
				self.childWorkflowInitiationInfo.workflowStepUpdateInformation = updateStepInfo;
				queue.executeNext();
			});
		},
		selectWorkflowInstaceScalarUdfsQuery: function(workflowId) {
			return "SELECT ws.\"" + this.cfBooleanCheckBox + "\", " +
				"ws.\"" + this.cfBooleanDDL + "\", ws.\"" + this.cfDDLWithTB + "\", " +
				"ws.\"" + this.customFieldTextLarge + "\", ws.\"" + this.customFieldTextMedium + "\", ws.\"" + this.customFieldTextSmall + "\", " +
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

	asyncTest("Generate unique ID - Happy path", 2, function() {
		envianceSdk.workflow.generateUniqueIDs(this.workflowTypeName, 5,
			function(response) {
				var uniqueIds = response.result;

				equal(response.metadata.statusCode, 200, "Status code is correct");
				equal(uniqueIds.length, 5, "Number of unique IDs matched.");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if Workflow Type ID is invalid", 2, function() {
		envianceSdk.workflow.generateUniqueIDs("CD03E393-3869-4DCC-9116-9FC606B842C3", 1,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if Workflow Type Name is invalid", 2, function() {
		envianceSdk.workflow.generateUniqueIDs("Invalid Workflow Type Name", 1,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if workflow Type Name is too long", 2, function() {
		var workflowTypeName = '';
		for (var i = 0; i < 256; i++) {
			workflowTypeName += 's';
		}
		envianceSdk.workflow.generateUniqueIDs(workflowTypeName, 1,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4001, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if count is too small", 2, function() {
		envianceSdk.workflow.generateUniqueIDs(this.workflowTypeName, 0,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4002, "Error number is correct");
				start();
			});
	});

	asyncTest("Generate unique ID - Fault if count is too large", 2, function() {
		envianceSdk.workflow.generateUniqueIDs(this.workflowTypeName, 2001,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 4002, "Error number is correct");
				start();
			});
	});

	asyncTest("Create workflow - Happy path", 3, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, errorHandler);
		});

		// When
		var workflowId;
		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(originalWorkflow,
				function(response) {
					workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, errorHandler);
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
				},
				errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Fault if workflow instance already exists", 2, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		// Given
		var workflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(workflow,
				function() {
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(workflow,
				errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					equal(response.error.errorNumber, 101, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Fault if no AssosiateObject permissions", 2, function() {
		var originalSessionId = envianceSdk.getSessionId();
		var errorHandler = function() {
			envianceSdk.configure({ sessionId: originalSessionId });
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		// Given
		var workflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				errorHandler);
		});

		// Then
		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(workflow,
				errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.errorNumber, 0, "Error number is correct");
					// TODO: error number assert
					envianceSdk.configure({ sessionId: originalSessionId });

					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Ensure TZ offset is correct", 1, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

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
				}, errorHandler);
		});

		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					var actualOffset = (dueDate - utcDueDate) / 60000;
					equal(actualOffset, response.result.userTimeZone.currentOffset, "dueDate offset OK");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create workflow - Due Date - Fault if value in default JS format", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.dueDate = "Mon Oct 1 17:54:50 UTC+0300 2012";

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
				function() {
					ok(false, "failed");
					start();
				},
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

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
				function() {
					ok(false, "failed");
					start();
				},
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

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
				function() {
					ok(false, "failed");
					start();
				},
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

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
				function() {
					ok(false, "failed");
					start();
				},
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

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					start();
				},
				function() {
					ok(false, "failed");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create workflow - Calendars - Fault when Calendar Type is empty", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.calendars = [""];

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
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
		queue.executeNext();
	});

	asyncTest("Create workflow - Calendars - Fault when Calendar Type doest not exist", 2, function() {
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);

		queue.enqueue(function(context) {
			context.workflowBlank.calendars = ["UnknownTestCalendarType"];

			envianceSdk.workflow.createWorkflow(context.workflowBlank,
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
		queue.executeNext();
	});

	asyncTest("Get workflow - Happy path - Get workflow by ID - All properties", 10, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					originalWorkflow.addDocument(context.documentsPath);
					queue.executeNext();
				}, errorHandler);
		});

		// When
		var workflowId;
		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(originalWorkflow,
				function(response) {
					workflowId = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		var createdWorkflow;
		queue.enqueue(function() {
			envianceSdk.workflow.getWorkflow(workflowId,
				function(response) {
					createdWorkflow = response.result;
					queue.executeNext();
				}, errorHandler);
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
					deepEqual(row.values[3], createdWorkflow.objects[0].path, "Workflow objects paths are equal");
					deepEqual('/' + row.values[4].split('/').slice(2).join('/'), createdWorkflow.documents[0], "Workflow documents paths are equal");
					equal(row.values[5], createdWorkflow.status, "Workflow statuses are equal");
					deepEqual(row.values[6], createdWorkflow.created, "Workflow created dates are equal");
					deepEqual(row.values[7], createdWorkflow.lastRun, "Workflow last run dates are equal");
					deepEqual(row.values[8], createdWorkflow.dueDate, "Workflow due dates are equal");
					start();
				},
				errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow - Happy path - Get workflow by unique ID - Basic properties", 4, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		// Given
		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
				function(response) {
					originalWorkflow = context.buildWorkflowCreationInfo(
						context.workflowTypeName, "WF name", response.result[0], context.objectsPath);
					queue.executeNext();
				}, errorHandler);
		});

		// When
		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(originalWorkflow,
				function() {
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		queue.enqueue(function() {
			envianceSdk.workflow.getWorkflow(originalWorkflow.uniqueId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");

					var createdWorkflow = response.result;
					equal(createdWorkflow.workflowTypeName, originalWorkflow.workflowTypeName, "Workflow type names are equal");
					equal(createdWorkflow.name, originalWorkflow.name, "Workflow instance names are equal");
					equal(createdWorkflow.uniqueId, originalWorkflow.uniqueId, "Workflow unique IDs are equal");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow - Fault if workflow instance does not exist", 2, function() {
		var invalidWorkflowId = createUUID();
		envianceSdk.workflow.getWorkflow(invalidWorkflowId,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update workflow by ID - Happy path - All properties", 9, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		var workflowUpdateInfo = this.buildWorkflowUpdateInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflow(workflowUpdateInfo, context.workflowId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		var tzOffset;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					tzOffset = response.result.userTimeZone.currentOffset;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflow(context.workflowId,
				function(response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.name, workflowUpdateInfo.name, "Workflow names are equal");
					equal(updatedWorkflow.uniqueId, workflowUpdateInfo.uniqueId, "Workflow unique IDs are equal");
					equal(updatedWorkflow.comment, workflowUpdateInfo.comment, "Workflow comments are equal");

					var originalDueDate = new Date(workflowUpdateInfo.dueDate - tzOffset * 60000);
					deepEqual(updatedWorkflow.dueDate, originalDueDate, "Workflow due date are equal");

					deepEqual(updatedWorkflow.calendars, workflowUpdateInfo.calendars, "Workflow calendars are equal");

					deepEqual(updatedWorkflow.documents, workflowUpdateInfo.documents, "Workflow documents are equal");

					equal(updatedWorkflow.objects.length, workflowUpdateInfo.objects.length, "Workflow objects count is equal");
					deepEqual(updatedWorkflow.objects[0].path, workflowUpdateInfo.objects[0].path, "Workflow objects are equal");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow by unique ID - Happy path - Some properties", 8, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflow(context.workflowId,
				function(response) {
					originalWorkflow = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function() {
			var workflowInfo = { comment: "Updated comment" };
			envianceSdk.workflow.updateWorkflow(workflowInfo, originalWorkflow.uniqueId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflow(context.workflowId,
				function(response) {
					var updatedWorkflow = response.result;

					equal(updatedWorkflow.name, originalWorkflow.name, "Workflow names are equal");
					equal(updatedWorkflow.uniqueId, originalWorkflow.uniqueId, "Workflow unique IDs are equal");
					equal(updatedWorkflow.comment, "Updated comment", "Workflow comments are equal");

					deepEqual(updatedWorkflow.dueDate, originalWorkflow.dueDate, "Workflow due date are equal");
					deepEqual(updatedWorkflow.calendars, originalWorkflow.calendars, "Workflow calendars are equal");
					deepEqual(updatedWorkflow.documents, originalWorkflow.documents, "Workflow documents are equal");
					deepEqual(updatedWorkflow.objects, originalWorkflow.objects, "Workflow objects are equal");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow - Fault if workflow instance does not exist", 2, function() {
		var invalidWorkflowId = createUUID();
		var workflowInfo = this.buildWorkflowUpdateInfo();

		envianceSdk.workflow.updateWorkflow(workflowInfo, invalidWorkflowId,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete workflow - Happy path", 1, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		// Given
		var workflow;
		queue.enqueue(function(context) {
			envianceSdk.workflow.generateUniqueIDs(context.workflowTypeName, 1,
				function(response) {
					var uniqueId = response.result[0];
					workflow = context.buildWorkflowCreationInfo(context.workflowTypeName, "WF name", uniqueId, context.objectsPath);
					queue.executeNext();
				}, errorHandler);
		});

		var workflowId;
		queue.enqueue(function() {
			envianceSdk.workflow.createWorkflow(workflow,
				function(response) {
					workflowId = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		// When
		queue.enqueue(function() {
			envianceSdk.workflow.deleteWorkflow(workflowId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Delete workflow - Fault when workflow instance doest not exist", 2, function() {
		var invalidWorkflowId = createUUID();
		envianceSdk.workflow.deleteWorkflow(invalidWorkflowId,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update workflow current step - Happy path - All properties", 14, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, errorHandler);
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
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = context.selectWorkflowInstaceLinkedValueUdfsQuery(context.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"' + workflowStep.fields[8].values[0] + '","' + workflowStep.fields[8].values[1] + '"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, errorHandler);
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
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Happy path - Missing properties are preserved", 10, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var originalWorkflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflowCurrentStep(originalWorkflowStep, context.workflowId,
				function() {
					queue.executeNext();
				}, errorHandler);
		});

		// When
		var modifiedWorkflowStep = this.buildWorkflowStepInfo();
		modifiedWorkflowStep.fields[3].values[0] =
			new Date(originalWorkflowStep.fields[3].values[0].getTime() + 24 * 60 * 60 * 1000); // add 1 day
		modifiedWorkflowStep.fields[4].values[0] =
			new Date(originalWorkflowStep.fields[4].values[0].getTime() + 60 * 1000); // add 1 minute

		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflowCurrentStep(modifiedWorkflowStep, context.workflowId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, errorHandler);
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
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update passed workflow step - Happy path - Missing properties are preserved", 10, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		var workflowStep;
		queue.enqueue(function(context) {
			workflowStep = new envianceSdk.workflow.StepInformation("Transition to second step");
			workflowStep.transition(context.workflowStepActionName, new Date());
			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				function() {
					queue.executeNext();
				}, errorHandler);
		});

		var originalWorkflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflowStep(originalWorkflowStep, context.workflowId, context.workflowStepName1,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		var tz;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					tz = response.result.userTimeZone;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowStep(context.workflowId, context.workflowStepName1,
				function(response) {
					var updatedStep = response.result;

					equal(updatedStep.comment, originalWorkflowStep.comment, "Step comment equal");
					equal(updatedStep.name, context.workflowStepName1, "Step name equal");

					var actualFields = toMap(updatedStep.fields, function(field) { return field.name; });
					var originalFields = toMap(originalWorkflowStep.fields, function(field) { return field.name; });

					deepEqual(actualFields[context.cfNumericLookup].values[0], originalFields[context.cfNumericLookup].values[0], "Numeric Lookup value changed");
					deepEqual(actualFields[context.cfDDLLinked].values, originalFields[context.cfDDLLinked].values, "DDL linked value changed");
					deepEqual(actualFields[context.cfHyperlink].urlItems[0].url, originalFields[context.cfHyperlink].urlItems[0].url, "Hyperlink changed");
					deepEqual(actualFields[context.cfMultiSelect].values, originalFields[context.cfMultiSelect].values, "DDL multi selection changed");
					equal(actualFields[context.cfBooleanCheckBox].values[0], originalFields[context.cfBooleanCheckBox].values[0], "Boolean CheckBox value changed");
					deepEqual(actualFields[context.cfBooleanDDL].values[0], originalFields[context.cfBooleanDDL].values[0], "Boolean DDL value changed");
					deepEqual(actualFields[context.cfDDL].values[0], originalFields[context.cfDDL].values[0], "DDL value changed");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if user does not have access", 2, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.transition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.noAccessUserName);

			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4003, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if deleted user is assigned", 2, function() {
		var successHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.transition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.deletedUserName);

			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4004, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if expired user is assigned", 2, function() {
		var successHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			workflowStep.transition(context.workflowStepActionName, new Date())
				.addUserAssignee(context.expiredUserName);

			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4005, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if user already specified", 2, function() {
		var successHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var userName = context.noManageRightsUserName;
			workflowStep.transition(context.workflowStepActionName, new Date())
				.addUserAssignee(userName)
				.addUserAssignee(userName);

			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4006, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if group does not exist", 2, function() {
		var successHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var notExistentGroupName = "notExistentGroupName";
			workflowStep.transition(context.workflowStepActionName, new Date())
				.addGroupAssignee(notExistentGroupName);

			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4007, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update workflow current step - Fault if group already specified", 2, function() {
		var successHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			var groupName = "Administrators";
			workflowStep.transition(context.workflowStepActionName, new Date())
				.addGroupAssignee(groupName)
				.addGroupAssignee(groupName);

			envianceSdk.workflow.updateWorkflowCurrentStep(workflowStep, context.workflowId,
				successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4008, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Happy path", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function() {
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					start();
				}, icwContext.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Happy path - Without workflowStepUpdateInformation", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function() {
			var info = icwContext.childWorkflowInitiationInfo;
			delete info.workflowStepUpdateInformation;
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					start();
				}, icwContext.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if step is not current", 2, function() {
		var queue = new ActionQueue(this);

		// Given
		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.stepIdOrName = context.workflowStepName2;
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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

		queue.enqueue(function() {
			icwContext.childWorkflowInitiationInfo.initiatorIdOrName = "";
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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

		queue.enqueue(function() {
			icwContext.childWorkflowInitiationInfo.workflowCreationInformation.uniqueId = icwContext.originalWorkflow.uniqueId;
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					equal(response.error.errorNumber, 101, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Fault if no AssociateObject permissions", 2, function() {
		var originalSessionId = envianceSdk.getSessionId();
		var errorHandler = function() {
			envianceSdk.configure({ sessionId: originalSessionId });
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
				function() {
					queue.executeNext();
				},
				errorHandler);
		});

		// Then
		queue.enqueue(function() {
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4010, "Error number is correct");
					// TODO: error number assert
					envianceSdk.configure({ sessionId: originalSessionId });

					start();
				});
	});

	queue.executeNext();
});

asyncTest("Initiate Child workflow - Ok if has Workflow Role overrides", 2, function() {
	var originalSessionId = envianceSdk.getSessionId();
	var errorHandler = function() {
		envianceSdk.configure({ sessionId: originalSessionId });
		ok(false, "failed");
		start();
	};

	var queue = new ActionQueue(this);

	var icwContext = new InitiateChildWorkflowContext();
	icwContext.addDefaultActions(queue);

	queue.enqueue(function(context) {
		envianceSdk.authentication.authenticate(context.noManageRightsUserNameWithOverrides, context.password,
			function() {
				queue.executeNext();
			},
			errorHandler);
	});

	// Then
	queue.enqueue(function() {
		var info = icwContext.childWorkflowInitiationInfo;
		info.workflowStepUpdateInformation.comment = null;
		info.workflowStepUpdateInformation.transition = null;
		envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, info,
			function(response) {
				icwContext.workflowId = response.result;

				equal(response.metadata.statusCode, 201, "Status code is correct");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				envianceSdk.configure({ sessionId: originalSessionId });

				start();
			},
			errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate Child workflow - Ok if has Workflow Role overrides", 2, function() {
		var originalSessionId = envianceSdk.getSessionId();
		var errorHandler = function() {
			envianceSdk.configure({ sessionId: originalSessionId });
			ok(false, "failed");
			start();
		};

		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.noManageRightsUserNameWithOverrides, context.password,
				function() {
					queue.executeNext();
				},
				errorHandler);
		});

		// Then
		queue.enqueue(function() {
			var info = icwContext.childWorkflowInitiationInfo;
			info.workflowStepUpdateInformation.comment = null;
			info.workflowStepUpdateInformation.transition = null;
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, info,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					envianceSdk.configure({ sessionId: originalSessionId });

					start();
				},
				errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Due Date - Ensure TZ offset is correct", 3, function() {
		var dueDate = new Date(2013, 10, 5, 6, 30);

		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function() {
			icwContext.childWorkflowInitiationInfo.workflowCreationInformation.dueDate = dueDate;
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, icwContext.errorHandler);
		});

		var utcDueDate;
		queue.enqueue(function(context) {
			var eql = "SELECT wi.DueDate AS DueDate FROM WorkflowInstance wi WHERE wi.ID = '" + icwContext.workflowId + "'";
			envianceSdk.eql.execute(eql, 1, 1,
				function(response) {
					utcDueDate = response.result[0].rows[0].values[0];
					queue.executeNext();
				}, icwContext.errorHandler);
		});

		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					equal(utcDueDate.valueOf(), toUTC(dueDate, response.result.userTimeZone).valueOf(), "dueDate offset OK");
					start();
				}, icwContext.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Calendars - Happy path", 1, function() {
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function() {
			icwContext.childWorkflowInitiationInfo.workflowCreationInformation.calendars = ["My", "System"];
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					start();
				}, icwContext.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Initiate child workflow - Calendars - Fault when Calendar Type is empty", 2, function() {
		var queue = new ActionQueue(this);

		var icwContext = new InitiateChildWorkflowContext();
		icwContext.addDefaultActions(queue);

		queue.enqueue(function() {
			icwContext.childWorkflowInitiationInfo.workflowCreationInformation.calendars = [""];
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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

		queue.enqueue(function() {
			icwContext.childWorkflowInitiationInfo.workflowCreationInformation.calendars = ["UnknownTestCalendarType"];
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
		queue.enqueue(function() {
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				function(response) {
					icwContext.workflowId = response.result;

					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					queue.executeNext();
				}, icwContext.errorHandler);
		});

		// Then
		queue.enqueue(function(context) {
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
				}, icwContext.errorHandler);
		});

		queue.enqueue(function(context) {
			var eql = icwContext.selectWorkflowInstaceLinkedValueUdfsQuery(icwContext.workflowId);
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					equal(response.result[0].rows.length, 1, "Row number matches");

					var linkedValue = '"1234567890","simple text"';
					equal(response.result[0].rows[0].values[0], linkedValue, "Linked DDL values equal");
					queue.executeNext();
				}, icwContext.errorHandler);
		});

		queue.enqueue(function(context) {
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
				}, icwContext.errorHandler);
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
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation = context.buildWorkflowStepInfo();
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation.transition("S2", new Date())
				.addUserAssignee(context.noAccessUserName);
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation.transition("S2", new Date())
				.addUserAssignee(context.deletedUserName);
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation.transition("S2", new Date())
				.addUserAssignee(context.expiredUserName);
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation.transition("S2", new Date())
				.addUserAssignee(context.noManageRightsUserName)
				.addUserAssignee(context.noManageRightsUserName);
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation.transition("S2", new Date())
				.addGroupAssignee("notExistentGroupName");
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
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
		queue.enqueue(function(context) {
			icwContext.childWorkflowInitiationInfo.workflowStepUpdateInformation.transition("S2", new Date())
				.addGroupAssignee("Administrators")
				.addGroupAssignee("Administrators");
			envianceSdk.workflow.initiateChildWorkflow(icwContext.workflowId, icwContext.childWorkflowInitiationInfo,
				icwContext.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 4008, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});
	asyncTest("Get workflow step - Happy path - Get current step by workflow ID", 12, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflowStep(workflowStep, context.workflowId, context.workflowStepName1,
				function() {
					queue.executeNext();
				}, errorHandler);
		});

		// Then
		var tzOffset;
		queue.enqueue(function() {
			envianceSdk.authentication.getCurrentSessionInfo(
				function(response) {
					tzOffset = response.result.userTimeZone.currentOffset;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowCurrentStep(context.workflowId,
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
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get current step by workflow unique ID", 2, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// When
		var workflowStep = this.buildWorkflowStepInfo();
		queue.enqueue(function(context) {
			envianceSdk.workflow.updateWorkflowStep(workflowStep, context.workflowId, context.workflowStepName1,
				function() {
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowCurrentStep(context.workflowBlank.uniqueId,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					equal(response.result.name, context.workflowStepName1, "Workflow step name equal");
					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Happy path - Get previous step by workflow ID and step name", 3, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		// Then
		queue.enqueue(function(context) {
			var workflowStep = context.buildWorkflowStepInfo();
			envianceSdk.workflow.updateWorkflowStep(workflowStep, context.workflowId, context.workflowStepName1,
				function() {
					queue.executeNext();
				},
				errorHandler);
		});

		var firstStep;
		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowCurrentStep(context.workflowId,
				function(response) {
					firstStep = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			var workflowStep = new envianceSdk.workflow.StepInformation("A second comment");
			workflowStep.transition(context.workflowStepActionName, new Date());

			envianceSdk.workflow.updateWorkflowStep(workflowStep, context.workflowId, context.workflowStepName1,
				function() {
					queue.executeNext();
				},
				errorHandler);
		});

		var secondStep;
		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowCurrentStep(context.workflowId,
				function(response) {
					secondStep = response.result;
					queue.executeNext();
				}, errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowStep(context.workflowId, firstStep.name,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					notEqual(response.result.name, secondStep.name, "Specified step name and current step name are not equal");
					deepEqual(response.result, firstStep, "Specified step and first step are equal");

					start();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get workflow step - Fault if workflow instance does not exist", 2, function() {
		var invalidWorkflowId = createUUID();

		envianceSdk.workflow.getWorkflowCurrentStep(invalidWorkflowId,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get workflow step - Fault if workflow step name does not exist", 2, function() {
		var errorHandler = function() {
			ok(false, "failed");
			start();
		};

		// Given
		var queue = new ActionQueue(this);
		this.addBuildWorkflowBlankAction(queue);
		this.addCreateWorkflowFromBlankAction(queue);

		queue.enqueue(function(context) {
			envianceSdk.workflow.getWorkflowStep(context.workflowId, "NotExistStepName",
				errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeWorkflowServiceTests();
}