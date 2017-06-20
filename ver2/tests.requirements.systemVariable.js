if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'SystemVariable Requirements', execute: executeSystemVariableReqServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof systemVariableRequirementsConfig == "undefined")
	systemVariableRequirementsConfig = {};


function executeSystemVariableReqServiceTests() {
	module("SystemVariable Requirement Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			this.noManageRightsUserName = systemVariableRequirementsConfig.noManageRightsUserName || "userWPermissionsSysVar";
			this.password = systemVariableRequirementsConfig.password || "1111";

			this.accessUser = this.accessUserName || "jstestsAccessUser";
			this.accessGroup = "jstestsAccessGroup";
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (systemVariableRequirementsConfig.noManageRightsUserName || "userWPermissionsSysVar") + qUnitDbSuffix;
			this.responsibleUserIdOrName = "jstestsWPermissions" + qUnitDbSuffix;

			this.type = "SystemVariable";
			this.newCalcReqGuid = "";
			this.createName = "Create SystemVariable";
			this.requirementTemplateIdOrName = "Common Requirement Template";
			this.description = "Create SysVar Description";
			this.generatedDivisionName = "Division For Requirements Test";
			this.generatedDivisionPath = "/" + this.generatedDivisionName;
			this.generatedFacilityName = "Facility For Requirements Test";
			this.generatedFacilityPath = this.generatedDivisionPath + "/" + this.generatedFacilityName;
			this.generatedPOIName = "POI for Req";
			this.generatedPOIPath = this.generatedFacilityPath + "/" + this.generatedPOIName;
			this.generatedUnitName = "Unit for Req";
			this.generatedUnitPath = this.generatedFacilityPath + "/" + this.generatedUnitName;			
			this.existCalcReqName = "SystemVariable Requirement";
			this.generatedCalcReqPath = this.generatedFacilityPath + "/" + this.existCalcReqName;

			this.activateDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");
			this.inactiveDate = envianceSdk.IsoDate.parse("2015-02-01T00:00");
			this.specificCitation = "specificCitation";
			this.periodFrequency = 2;
			this.periodTime = "Day";
			this.occureStartDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");
			this.occureEndDate = envianceSdk.IsoDate.parse("2015-01-02T00:00");

			// customUdfTemplate
			this.customTemplateIdOrName = "commonReq Custom Field Template";
			this.customFieldTextBox = "XLS2_Text Box_Small (20 char max)";
			this.customFieldDDL = "XLS2_Text Box_Dropdown List";
			this.customFieldHyperlink = "MAS Hyperlink";			

			this.uom = "uom test";
			this.documentsPath = "/250/99999.xls";

			this.reqIdsToClear = [];

			// fields for Update
			this.descriptionUpd = "Upd description";
			this.activateDateUpd = envianceSdk.IsoDate.parse("2015-02-01T00:00");
			this.inactiveDateUpd = envianceSdk.IsoDate.parse("2015-05-01T00:00");
			this.responsibleUserUpd = this.accessUserName;
			this.requirementTemplateIdOrNameUpd = "Common Requirement Upd Template";
			this.uomUpd = "uom upd";			
			this.specificCitationUpd = "specificCitationUpd";
			this.customTemplateIdOrNameUpd = "commonReqUpd Custom Field Template";
			// wrong date period			
			this.startDate = envianceSdk.IsoDate.parse("2014-01-01T00:00");
			this.endDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");

			// build info
			this.buildFullInfo = function (nameStr) {
				return new envianceSdk.requirements.SysVariableRequirementInfo(this.type, nameStr, this.generatedFacilityPath, this.activateDate,
					this.inactiveDate, this.responsibleUserIdOrName, this.requirementTemplateIdOrName, this.specificCitation,
					this.description, this.uom
				)
					.addValueHistory(this.startDate, this.endDate, 1)
					.addDocument(this.documentsPath)
					.setFieldTemplate(this.customTemplateIdOrName)
					.addScalarFieldValue(this.customFieldTextBox, "cstm Field Text Box")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://jstest.kiev.ua");
			};

			this.buildEmptyInfo = function (nameStr) {
				return new envianceSdk.requirements.SysVariableRequirementInfo(this.type, nameStr, this.generatedFacilityPath,
					null, null, null, this.requirementTemplateIdOrName, null, null, null);
			};

			this.buildLightInfo = function (nameStr) {
				return this.buildEmptyInfo(nameStr)
					.addValueHistory(this.occureStartDate, this.occureEndDate, 20);
			};
			this.buildFullUpdateRequirementInfo = function () {
				return new envianceSdk.requirements.SysVariableRequirementInfo(this.type, this.existCalcReqName, this.generatedFacilityPath, this.activateDateUpd,
					this.inactiveDateUpd, this.responsibleUserIdOrName, this.requirementTemplateIdOrName, this.specificCitationUpd,
					this.descriptionUpd, this.uomUpd
				)
					.addValueHistory(envianceSdk.IsoDate.parse("2012-01-01T00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00"), 2)
					.addDocument(this.documentsPath)
					.setFieldTemplate(this.customTemplateIdOrName)
					.addScalarFieldValue(this.customFieldTextBox, "cstm Field Text Box Upd")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://jstest.kiev.ua");
			};
			// compare
			this.fullCompareRequirementInfo = function (actual, expected) {
				this.compareRequirementInfo(actual, expected);
				this.compareUdfFieldsValues(actual.fieldValues, expected.fieldValues);
				deepEqual(actual.valuesHistory, expected.valuesHistory, "Value history are equal");
			};
			this.compareRequirementInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Name are equal");
				deepEqual(actual.activeDate, expected.activeDate, "ActivateDate are equal");
				deepEqual(actual.inactiveDate, expected.inactiveDate, "InActivaDate are equal");
				equal(actual.responsibleUserIdOrName, expected.responsibleUserIdOrName, "Responsible User are equal");
				equal(actual.requirementTemplateIdOrName, expected.requirementTemplateIdOrName, "Requirement Template are equal");
				equal(actual.fieldTemplateIdOrName, expected.fieldTemplateIdOrName, "Custom UDF Template are equal");
				equal(actual.description, expected.description, "Descriptions are equal");
				equal(actual.uom, expected.uom, "UOM are equal");
				equal(actual.precision, expected.precision, "Precision are equal");
			};
			this.compareUdfFieldsValues = function (actual, expected) {
				equal(actual.length, expected.length, "Length of UdfFieldsValues are equal");

				var actualFields = toMap(actual, function (field) { return field.name; });
				var expectedFields = toMap(expected, function (field) { return field.name; });

				deepEqual(actualFields[this.customFieldTextBox], expectedFields[this.customFieldTextBox], "Text field are equal");
				deepEqual(actualFields[this.customFieldDDL], expectedFields[this.customFieldDDL], "DDL field are equal");
				deepEqual(actualFields[this.customFieldHyperlink], expectedFields[this.customFieldHyperlink], "Hlink field are equal");
			};
		},

		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var i = 0; i < this.reqIdsToClear.length; i++){
				stop();
				envianceSdk.requirements.deleteRequirement(this.reqIdsToClear[i], true,
					function () {
						start();
					},
					function () {
						start();
					});
			}
		},

		_authenticate: function (queue, user) {
			queue.enqueue(function (context) {
				envianceSdk.authentication.authenticate(user, context.password,
					function () {
						queue.executeNext();
					},
					context.errorHandler)
					.fail(function () {
						envianceSdk.configure({ sessionId: this.originalSessionId });
					});
			});
		},

		_start: function (queue) {
			queue.enqueue(function () {
				start();
			});
			queue.executeNext();
		}

	});

	asyncTest("Create System Variable - full properties - Happy path", 16, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create System Variable - full properties");
		var pathName = reqInfo.parentIdOrPath + '/' + reqInfo.name;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(reqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(pathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.fullCompareRequirementInfo(response.result, reqInfo);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create System Variable - Set Requirement Template, Name - Happy path", 4, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create SysVar - Set Requirement Template, Name");
		var pathName = calcReqInfo.parentIdOrPath + '/' + calcReqInfo.name;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(pathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, calcReqInfo.name, "Name are equal");
					equal(response.result.requirementTemplateIdOrName, calcReqInfo.requirementTemplateIdOrName, "Requirement Template are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable under POI ", 4, function () {
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildLightInfo("Create System Variable under POI");
		caclReqInfo.parentIdOrPath = this.generatedPOIPath;
		var pathName = caclReqInfo.parentIdOrPath + '/' + caclReqInfo.name;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(caclReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(pathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, caclReqInfo.name, "Name are equal");
					equal(response.result.requirementTemplateIdOrName, caclReqInfo.requirementTemplateIdOrName, "Requirement Template are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable under Unit", 4, function () {
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildLightInfo("Create System Variable under Unit");
		caclReqInfo.parentIdOrPath = this.generatedUnitPath;
		var pathName = caclReqInfo.parentIdOrPath + '/' + caclReqInfo.name;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(caclReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(pathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, caclReqInfo.name, "Name are equal");
					equal(response.result.requirementTemplateIdOrName, caclReqInfo.requirementTemplateIdOrName, "Requirement Template are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});


	asyncTest("Create System Variable - with 3 valid Values - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create System Variable - full properties add three values");
		var pathName = reqInfo.parentIdOrPath + '/' + reqInfo.name;
		reqInfo.valueHistory = [];
		reqInfo.addValueHistory(envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2011-01-01T00:00:00"), 100);
		reqInfo.addValueHistory(envianceSdk.IsoDate.parse("2012-01-01T00:00:00"), envianceSdk.IsoDate.parse("2013-01-01T00:00:00"), 200);
		reqInfo.addValueHistory(envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"), 300);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(reqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(pathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					deepEqual(response.result.valueHistory, reqInfo.valueHistory, "Value History are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - with CD: valid Begin and empty End Date - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create System Variable - full properties");
		var pathName = reqInfo.parentIdOrPath + '/' + reqInfo.name;
		reqInfo.valueHistory = [];
		reqInfo.addValueHistory(envianceSdk.IsoDate.parse("2015-12-01T00:00:00"), null, 200);

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(reqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(pathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.valueHistory.length, 1, "history item length is 1 OK");
					if (response.result.valueHistory.length == 1) {
						deepEqual(response.result.valueHistory[0].beginDate, reqInfo.valueHistory[0].beginDate, "beginDate are equal");
						equal(response.result.valueHistory[0].value, reqInfo.valueHistory[0].value, "value are equal");
					}
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});


	// Get tests
	asyncTest("Get System Variable - Happy path - By Path", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(context.generatedCalcReqPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get System Variable - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		var reqId;
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(context.generatedCalcReqPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					reqId = response.result.id;
					start();
				}, context.errorHandler);
		});

		queue.enqueue(function () {
			envianceSdk.requirements.getRequirement(reqId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	// Update
	asyncTest("Update System Variable - Full update - Happy path", 16, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildFullUpdateRequirementInfo();

		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, caclReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(self.generatedCalcReqPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.fullCompareRequirementInfo(response.result, caclReqInfo);
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update System Variable - change Custom Fields Template - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();

		calcReqInfo.fieldTemplateIdOrName = this.customTemplateIdOrNameUpd;
		calcReqInfo.fieldValues = [];
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(self.generatedCalcReqPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.fieldTemplateIdOrName, calcReqInfo.fieldTemplateIdOrName, "fieldTemplate are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update System Variable - change Requirement Template - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		// TODO : ?
		calcReqInfo.requirementTemplateIdOrName = this.requirementTemplateIdOrNameUpd;

		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(self.generatedCalcReqPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.requirementTemplateIdOrName, calcReqInfo.requirementTemplateIdOrName, "requirementTemplate are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	// Delete tests
	asyncTest("Delete System Variable with all existing properties - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Create max SysVar for delete");
		var pathName = calcReqInfo.parentIdOrPath + '/' + calcReqInfo.name;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement(pathName, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(pathName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete System Variable with min properties - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create min SysVar for delete");
		var pathName = calcReqInfo.parentIdOrPath + '/' + calcReqInfo.name;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement(pathName, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					start();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(pathName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete System Variable by path - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqName = "Create SysVar for delete by name";
		var calcReqInfo = this.buildLightInfo(calcReqName);
		var calcPath = calcReqInfo.parentIdOrPath + '/' + calcReqName;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement(calcPath, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					start();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(calcPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});
	// Fault tests
	asyncTest("Create System Variable - without requirement template", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create System Variable - without requirement template");
		calcReqInfo.requirementTemplateIdOrName = "";
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - under Division", 1, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create System Variable - under Division");
		calcReqInfo.parentIdOrPath = this.generatedDivisionPath;
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - with invalid Requirement Template ID", 1, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create System Variable - invalid ReqTemplateID");
		calcReqInfo.requirementTemplateIdOrName = "a36358e5-4043-48eb-866a-0d6d4661bac0";
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable -  with invalid Custom Field Template ID", 1, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create System Variable - invalid ReqTemplateID");
		calcReqInfo.setFieldTemplate("a36358e5-4043-48eb-866a-0d6d4661bac0");

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable -  with already exisiting name", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo(this.existCalcReqName);

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - with empty name", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create System Variable - with empty name");
		calcReqInfo.name = "";

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - Inactive Date is less than Active Date", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Inactive Date is less than Active Date");
		calcReqInfo.activeDate = envianceSdk.IsoDate.parse("2015-03-03T00:00");
		calcReqInfo.inactiveDate = envianceSdk.IsoDate.parse("2015-02-02T00:00");

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - Responsible User (non -existing user)", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Responsible User (non -existing user)");
		calcReqInfo.responsibleUserIdOrName = "non -existing user";

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - Value History End Date is less or equal to Begin Date", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildEmptyInfo("Value History End Date is less or equal to Begin Date");
		calcReqInfo.addValueHistory(envianceSdk.IsoDate.parse("2015-04-04T00:00"), envianceSdk.IsoDate.parse("2015-03-03T00:00"), 2);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create System Variable - add Value History Scripts with time periods that overlap ", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Value History Script is empty")
			.addValueHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), 1)
			.addValueHistory(envianceSdk.IsoDate.parse("2015-02-02T00:00"), envianceSdk.IsoDate.parse("2015-05-05T00:00"), 2);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update System Variable - with empty name", 1, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update System Variable - Inactive Date is less than Active Date", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.activeDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");
		calcReqInfo.inactiveDate = envianceSdk.IsoDate.parse("2014-01-01T00:00");
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update System Variable  -  Responsible User (non -existing user)", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.responsibleUserIdOrName = 'unexisted';
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create System Variable without appropriate permissions", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		var calcReqInfo = this.buildLightInfo("Create System Variable - without appropriate permissions");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update System Variable under CO without appropriate permissions", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Get System Variable under CO without appropriate permissions", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(context.generatedCalcReqPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete System Variable  under CO without appropriate permissions", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement(context.generatedCalcReqPath, true,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});


}

if (typeof (UnitTestsApplication) == "undefined") {
	executeSystemVariableReqServiceTests();
}