﻿if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Time-BasedCalculated Req(Fixed/Rolling period)', execute: executeTbcRequirementServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof tbcRequirementsConfig == "undefined")
	tbcRequirementsConfig = {};

function executeTbcRequirementServiceTests() {
	module("Time-Based Calculated Requirement Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			this.password = tbcRequirementsConfig.password || "1111";
			
			this.accessUser = this.accessUserName || "jstestsAccessUser";
			this.accessGroup = "jstestsAccessGroup";
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (paramRequirementsConfig.noManageRightsUserName || "userWPermissionsTbCalcReq") + qUnitDbSuffix;
			this.responsibleUserIdOrName = "jstestsWPermissions" + qUnitDbSuffix;
		
			this.type = "TBRequirement";
			this.newCalcReqGuid = "";
			this.createName = "Create TbCalcReq";
			this.requirementTemplateIdOrName = "Common Requirement Template";
			this.createDescription = "Create TbCalcReq Description";
			this.generatedDivisionName = "Division For Requirements Test";
			this.generatedDivisionPath = "/" + this.generatedDivisionName;
			this.generatedFacilityName = "Facility For Requirements Test";
			this.generatedFacilityPath = this.generatedDivisionPath + "/" + this.generatedFacilityName;
			this.generatedPOIName = "POI for Req";
			this.generatedPOIPath = this.generatedFacilityPath + "/" + this.generatedPOIName;
			this.generatedUnitName = "Unit for Req";
			this.generatedUnitPath = this.generatedFacilityPath + "/" + this.generatedUnitName;			
			this.existCalcReqName = "Time-Based Calculated Req IsRolling";
			this.generatedCalcReqPath = this.generatedFacilityPath + "/" + this.existCalcReqName;			
			
			this.activateDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");
			this.inactiveDate = envianceSdk.IsoDate.parse("2015-02-01T00:00");
			this.specificCitation = "specificCitation";
			this.description = "description";
			this.periodFrequency = 2;
			this.periodTime = "Day";
					
			this.tbPeriodStartDate = envianceSdk.IsoDate.parse("2012-01-01T00:00");
			this.tbPeriodEndDate = envianceSdk.IsoDate.parse("2013-01-01T00:00");
			this.occureStartDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");
			this.occureEndDate = envianceSdk.IsoDate.parse("2015-01-02T00:00");
			this.limitStartDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");
			this.limitEndDate = envianceSdk.IsoDate.parse("2015-02-01T00:00");
			this.qualityTemplateIdOrName = "Quality Template for Req";
			this.qshDateBegin = envianceSdk.IsoDate.parse("2014-01-01T00:00:00");
			this.qshDateEnd = envianceSdk.IsoDate.parse("2015-02-01T00:00:00");
			// customUdfTemplate
			this.customTemplateIdOrName = "commonReq Custom Field Template";
			this.customFieldTextBox = "XLS2_Text Box_Small (20 char max)";
			this.customFieldDDL = "XLS2_Text Box_Dropdown List";
			this.customFieldHyperlink = "MAS Hyperlink";
			this.calcDescription = "calcUdf-calc-1";
			// task templates
			this.taskTemplateIdOrName1 = "task-template-r-1";
			this.taskTemplateIdOrName2 = "task-template-r-2";
			// tbCalc properties
			this.missingDataPercent = 10;			
			this.isTbCalcRolling = true;
			this.isTbCalcFixed = false;

			// section - Quality Substitution Script
			this.uom = "uom test";
			this.precision = 3;
			this.dataRangeMin = 1;
			this.dataRangeMax = 5;
			// section - Data Warning Notifications
			this.notifyInbox = true;
			this.notifyEmail = true;
			// section - Relations
			this.documentsPath = "/250/99999.xls";
			this.reqIdsToClear = [];
			// fields for Update
			this.descriptionUpd = "Upd description";
			this.activateDateUpd = envianceSdk.IsoDate.parse("2015-02-01T00:00");
			this.inactiveDateUpd = envianceSdk.IsoDate.parse("2015-05-01T00:00");
			this.responsibleUserUpd = this.accessUserName;
			this.requirementTemplateIdOrNameUpd = "Common Requirement Upd Template";
			this.uomUpd = "uom upd";
			this.calcDescriptionUpd = "calcUdf-calc-1 upd";
			this.specificCitationUpd = "specificCitationUpd";
			this.periodTimeUpd = "Hour";
			this.periodFrequencyUpd = 2;
			this.precisionUpd = "2";
			this.dataRangeMinUpd = "0";
			this.dataRangeMaxUpd = "10";
			this.missingDataPercentUpd = 20;
			// task templates
			this.taskTemplateIdOrName1Upd = "task-template-upd-r-1";
			this.taskTemplateIdOrName2Upd = "task-template-upd-r-2";
			this.occureStartDateUpd = envianceSdk.IsoDate.parse("2015-01-02T00:00");
			this.occureEndDateUpd = envianceSdk.IsoDate.parse("2015-01-03T00:00");
			this.limitStartDateUpd = envianceSdk.IsoDate.parse("2015-01-02T00:00");
			this.limitEndDateUpd = envianceSdk.IsoDate.parse("2015-02-03T00:00");
			this.qualityTemplateIdOrNameUpd = "QualityTemplate for Req Upd";
			this.qshDateBeginUpd = envianceSdk.IsoDate.parse("2014-01-02T00:00:00");
			this.qshDateEndUpd = envianceSdk.IsoDate.parse("2015-02-03T00:00:00");
			this.notifyInboxUpd = false;
			this.notifyEmailUpd = false;
			this.customTemplateIdOrNameUpd = "commonReqUpd Custom Field Template";
			// wrong date period			
			this.startDate = envianceSdk.IsoDate.parse("2015-02-02T00:00");
			this.endDate = envianceSdk.IsoDate.parse("2015-01-01T00:00");

			// build info
			this.buildFullInfo = function (nameStr, isRolling) {
				return new envianceSdk.requirements.TbCalcRequirementInfo(this.type, isRolling, nameStr, this.generatedFacilityPath, this.activateDate,
					this.inactiveDate, this.responsibleUserIdOrName, this.requirementTemplateIdOrName, this.specificCitation,
					this.periodFrequency, this.periodTime, this.description, this.uom, this.precision, this.calcDescription, this.missingDataPercent
				)
					.addTbFormulaHistory(this.tbPeriodStartDate, this.tbPeriodEndDate, "AVG([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3)
					.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc")
					.addRequirementsAliasMap("[System Variable for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\System Variable for Calc")
					.addRequirementsAliasMap("[Autoparameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Autoparameter Requirement for Calc")
					.addFrequency(this.occureStartDate, this.occureEndDate, 1)
					.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, 2, ">= LOW, <= HIGH", 3, 4)
					.setRegLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser)
					.addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup)
					.setIntLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName2, this.accessUser)
					.addIntLimitTaskUser(this.accessUser).addIntLimitTaskGroup(this.accessGroup)
					.setNotifyUserOrMail(this.notifyInbox, this.notifyEmail)
					.addNotifyUser(this.accessUser)
					.addNotifyGroup(this.accessGroup)
					.addDocument(this.documentsPath)
					.setFieldTemplate(this.customTemplateIdOrName)
					.addScalarFieldValue(this.customFieldTextBox, "cstm Field Text Box")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://jstest.kiev.ua");
			};


			this.buildEmptyInfo = function (nameStr, isRolling) {
				return new envianceSdk.requirements.TbCalcRequirementInfo(this.type, isRolling, nameStr, this.generatedFacilityPath, null,
					null, null, this.requirementTemplateIdOrName, null, null, null, null, null, null, null, null);
			};
			this.buildLightInfo = function (nameStr, isRolling) {
				return this.buildEmptyInfo(nameStr, isRolling)
					.addTbFormulaHistory(this.tbPeriodStartDate, this.tbPeriodEndDate, "AVG([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3)
					.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");;
			};
			
			this.buildFullUpdateRequirementInfo = function () {
				return new envianceSdk.requirements.TbCalcRequirementInfo(this.type, null, this.existCalcReqName, this.generatedFacilityPath, this.activateDateUpd,
					null, this.responsibleUserIdOrNameUpd, this.requirementTemplateIdOrName, this.specificCitationUpd, this.periodFrequencyUpd,
					this.periodTimeUpd, this.descriptionUpd, this.uomUpd, this.precisionUpd, this.calcDescriptionUpd
				)
					.addTbFormulaHistory(this.tbPeriodStartDate, this.tbPeriodEndDate, "AVG([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3)
					.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc")
					.addRequirementsAliasMap("[System Variable for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\System Variable for Calc")
					.addRequirementsAliasMap("[Autoparameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Autoparameter Requirement for Calc")
					.addFrequency(this.occureStartDate, this.occureEndDate, 1)
					.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, 2, ">= LOW, <= HIGH", 3, 4)
					.setRegLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser)
					.addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup)
					.setIntLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName2, this.accessUser)
					.addIntLimitTaskUser(this.accessUser).addIntLimitTaskGroup(this.accessGroup)
					.setNotifyUserOrMail(this.notifyInbox, this.notifyEmail)
					.addNotifyUser(this.accessUser)
					.addNotifyGroup(this.accessGroup)
					.addDocument(this.documentsPath)
					.setFieldTemplate(this.customTemplateIdOrName)
					.addScalarFieldValue(this.customFieldTextBox, "cstm Field Text Box")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://jstest.kiev.ua");
			};
			
			this.fullCompareRequirementInfo = function (actual, expected) {
				this.compareRequirementInfo(actual, expected);
				if (expected.fieldValues.length > 0) // ?
					this.compareUdfFieldsValues(actual.fieldValues, expected.fieldValues);
				deepEqual(actual.frequencies, expected.frequencies, "Frequencies history are equal");
				this.compareRegulatoryLimit(actual.regulatoryLimit, expected.regulatoryLimit);
				this.compareInternalLimit(actual.internalLimit, expected.internalLimit);
				deepEqual(actual.limitHistory, expected.limitHistory, "Limit history are equal");
				if (expected.notifyRecipients) {
					deepEqual(actual.notifyRecipients.inbox, expected.notifyRecipients.inbox, "Notify Recipients inbox are equal");
					deepEqual(actual.notifyRecipients.inbox, expected.notifyRecipients.inbox, "Notify Recipients email are equal");
					this.compareAssignees(actual.notifyRecipients.recipients, expected.notifyRecipients.recipients);
				}
				deepEqual(actual.tbFormulaHistory, expected.tbFormulaHistory, "Formula history are equal");
			};
			this.compareRequirementInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Name are equal");
				deepEqual(actual.activeDate, expected.activeDate, "ActivateDate are equal");
				deepEqual(actual.inactiveDate, expected.inactiveDate, "InActivaDate are equal");
				equal(actual.responsibleUserIdOrName, expected.responsibleUserIdOrName, "Responsible User are equal");
				equal(actual.requirementTemplateIdOrName, expected.requirementTemplateIdOrName, "Requirement Template are equal");
				equal(actual.fieldTemplateIdOrName, expected.fieldTemplateIdOrName, "Custom UDF Template are equal");
				equal(actual.description, expected.description, "Description are equal");
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
			
			this.compareRegulatoryLimit = function (actual, expected) {
				equal(actual.templateIdOrName, expected.templateIdOrName, "Task Template for Regulatory Limit are equal");
				equal(actual.assignor, expected.assignor, "Assignor for Regulatory Limit are equal");
				this.compareAssignees(actual.assignees, expected.assignees);
			};
			this.compareInternalLimit = function (actual, expected) {
				equal(actual.templateIdOrName, expected.templateIdOrName, "Task Template for Internal Limit are equal");
				equal(actual.assignor, expected.assignor, "Assignor for Internal Limit are equal");
				this.compareAssignees(actual.assignees, expected.assignees);
			};
			this.compareAssignees = function (actual, expected) {
				equal(actual.length, expected.length, "Length of assignees are equal");
				if (actual.length == expected.length) {
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].userIdOrName, expected[i].userIdOrName, "userIdOrName " + i + " are equal");
						deepEqual(actual[i].groupIdOrName, expected[i].groupIdOrName, "groupIdOrName " + i + " are equal");
					}
				}
			};			
		},

		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var i = 0 ; i < this.reqIdsToClear.length ; i++ ){
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

		_authenticate: function(queue, user) {
			queue.enqueue(function(context) {
				envianceSdk.authentication.authenticate(user, context.password,
					function() {
						queue.executeNext();
					},
					context.errorHandler)
					.fail(function () {
						envianceSdk.configure({ sessionId: this.originalSessionId });
					});
			});
		},

		_start: function(queue) {
			queue.enqueue(function() {
				start();
			});
			queue.executeNext();
		}
		
	});


	asyncTest("Create TbCalculated Requirement (rolling) - full properties - Happy path", 39, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create TbCalculated Requirement (rolling) - full properties", this.isTbCalcRolling);
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
	
	asyncTest("Create TbCalculated Requirement (fixed) - full properties - Happy path", 39, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create TbCalculated Requirement (fixed) - full properties", this.isTbCalcFixed);
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

	asyncTest("Create TbCalculated Requirement (rolling) - Set Requirement Template, Name - Happy path", 4, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create TbCalculatedReq - Set Requirement Template, Name", this.isTbCalcRolling);
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
	
	asyncTest("Create TbCalculated Requirement (rolling) under POI ", 4, function () {
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) under POI", this.isTbCalcRolling);
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
	
	asyncTest("Create TbCalculated Requirement (fixed) under POI ", 4, function () {
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildLightInfo("Create TbCalculated Requirement (fixed) under POI", this.isTbCalcFixed);
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


	asyncTest("Create TbCalculated Requirement (rolling) under Unit", 4, function () {
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) under Unit", this.isTbCalcRolling);
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
	
	asyncTest("Create TbCalculated Requirement (fixed) under Unit", 4, function () {
		var queue = new ActionQueue(this);
		var caclReqInfo = this.buildLightInfo("Create TbCalculated Requirement (fixed) under Unit", this.isTbCalcFixed);
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


	asyncTest("Create TbCalculated Requirement (rolling) - with 3 valid Calculation Definitions - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create TbCalculated Requirement (rolling) - full properties", this.isTbCalcRolling);
		var pathName = reqInfo.parentIdOrPath + '/' + reqInfo.name;
		reqInfo.tbFormulaHistory = [];
		reqInfo.addTbFormulaHistory(envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2011-01-01T00:00:00"), "1+SUM([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3);
		reqInfo.addTbFormulaHistory(envianceSdk.IsoDate.parse("2012-01-01T00:00:00"), envianceSdk.IsoDate.parse("2013-01-01T00:00:00"), "2+SUM([System Variable for Calc])", 2, "Day", "Hour", 1, 2, 3);
		reqInfo.addTbFormulaHistory(envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"), "3+SUM([Autoparameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3);
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
					deepEqual(response.result.tbFormulaHistory, reqInfo.tbFormulaHistory, "Formula History are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create TbCalculated Requirement (rolling) - with CD: valid Begin and empty End Date - Happy path", 11, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create TbCalculated Requirement (rolling) - full properties", this.isTbCalcRolling);
		var pathName = reqInfo.parentIdOrPath + '/' + reqInfo.name;
		reqInfo.tbFormulaHistory = [];
		reqInfo.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-12-01T00:00:00"), null, "AVG([Parameter Requirement for Calc])+212", 2, "Day", "Hour", 1, 2, 3);

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
					equal(response.result.tbFormulaHistory.length, 1, "history item length is 1 OK");
					if (response.result.tbFormulaHistory.length == 1) {
						deepEqual(response.result.tbFormulaHistory[0].beginDate, reqInfo.tbFormulaHistory[0].beginDate, "beginDate are equal");
						equal(response.result.tbFormulaHistory[0].script, reqInfo.tbFormulaHistory[0].script, "script are equal");
						equal(response.result.tbFormulaHistory[0].periodType, reqInfo.tbFormulaHistory[0].periodType, "period type are equal");
						equal(response.result.tbFormulaHistory[0].intermediatePeriodType, reqInfo.tbFormulaHistory[0].intermediatePeriodType, "intermediate period type are equal");
						equal(response.result.tbFormulaHistory[0].periodDuration, reqInfo.tbFormulaHistory[0].periodDuration, "period duration are equal");
						equal(response.result.tbFormulaHistory[0].exceptionOther, reqInfo.tbFormulaHistory[0].exceptionOther, "ex other are equal");
						equal(response.result.tbFormulaHistory[0].exceptionOverflow, reqInfo.tbFormulaHistory[0].exceptionOverflow, "ex overflow are equal");
						equal(response.result.tbFormulaHistory[0].exceptionDivideByZero, reqInfo.tbFormulaHistory[0].exceptionDivideByZero, "ex divideByZero are equal");
					}

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Create TbCalculated Requirement (fixed) - with CD: valid Begin and empty End Date - Happy path", 11, function () {
		var queue = new ActionQueue(this);
		var reqInfo = this.buildFullInfo("Create TbCalculated Requirement (fixed) - full properties", this.isTbCalcFixed);
		var pathName = reqInfo.parentIdOrPath + '/' + reqInfo.name;
		reqInfo.tbFormulaHistory = [];
		reqInfo.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-12-01T00:00:00"), null, "AVG([Parameter Requirement for Calc])+212", 2, "Day", "Hour", 1, 2, 3);

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
					equal(response.result.tbFormulaHistory.length, 1, "history item length is 1 OK");
					if (response.result.tbFormulaHistory.length == 1) {
						deepEqual(response.result.tbFormulaHistory[0].beginDate, reqInfo.tbFormulaHistory[0].beginDate, "beginDate are equal");
						equal(response.result.tbFormulaHistory[0].script, reqInfo.tbFormulaHistory[0].script, "script are equal");
						equal(response.result.tbFormulaHistory[0].periodType, reqInfo.tbFormulaHistory[0].periodType, "period type are equal");
						equal(response.result.tbFormulaHistory[0].intermediatePeriodType, reqInfo.tbFormulaHistory[0].intermediatePeriodType, "intermediate period type are equal");
						equal(response.result.tbFormulaHistory[0].periodDuration, reqInfo.tbFormulaHistory[0].periodDuration, "period duration are equal");
						equal(response.result.tbFormulaHistory[0].exceptionOther, reqInfo.tbFormulaHistory[0].exceptionOther, "ex other are equal");
						equal(response.result.tbFormulaHistory[0].exceptionOverflow, reqInfo.tbFormulaHistory[0].exceptionOverflow, "ex overflow are equal");
						equal(response.result.tbFormulaHistory[0].exceptionDivideByZero, reqInfo.tbFormulaHistory[0].exceptionDivideByZero, "ex divideByZero are equal");
					}

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});


	// Get tests
	asyncTest("Get Calculated Requirement - Happy path - By Path", 1, function () {
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

	asyncTest("Get Calculated Requirement - Happy path - By ID", 1, function () {
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
	asyncTest("Update TbCalculated Requirement - Full update - Happy path", 39, function () {
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

	asyncTest("Update TbCalculated Requirement - change Custom Fields Template - Happy path", 3, function () {
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

	asyncTest("Update TbCalculated Requirement - change Requirement Template - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();		
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
	asyncTest("Delete Calculated Requirement with all existing properties - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Create max TbCalcReg for delete", this.isTbCalcRolling);
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

	asyncTest("Delete Calculated Requirement with min properties - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create min TbCalc for delete", this.isTbCalcRolling);
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

	asyncTest("Delete Calculated Requirement by path - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqName = "Create TbCalc for delete by name";
		var calcReqInfo = this.buildLightInfo(calcReqName, this.isTbCalcRolling);
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
	asyncTest("Create TbCalculated Requirement (rolling) - without requirement template", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) - without requirement template", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) - under Division", 1, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) - under Division", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) - with invalid Requirement Template ID", 1, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) - invalid ReqTemplateID", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) -  with invalid Custom Field Template ID", 1, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) - invalid ReqTemplateID", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) -  with already exisiting name", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo(this.existCalcReqName, this.isTbCalcRolling);

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

	asyncTest("Create TbCalculated Requirement (rolling) - with empty name", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) - with empty name", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) - Inactive Date is less than Active Date", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Inactive Date is less than Active Date", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) - Responsible User (non -existing user)", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("Responsible User (non -existing user)", this.isTbCalcRolling);
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

	asyncTest("Create TbCalculated Requirement (rolling) - Formula History End Date is less or equal to Begin Date", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildEmptyInfo("Formula History End Date is less or equal to Begin Date", this.isTbCalcRolling);
		calcReqInfo.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-04-04T00:00"), envianceSdk.IsoDate.parse("2015-03-03T00:00"), "AVG([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3);
		calcReqInfo.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (rolling) - Formula History Script is empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcRolling)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-04-04T00:00"), "", 2, "Day", "Hour", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (rolling) - Formula History Invalid Script ", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcRolling)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-04-04T00:00"), "1+", 2, "Day", "Hour", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (rolling) - add Formula History Scripts with time periods that overlap ", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcRolling)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), "AVG([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-02-02T00:00"), envianceSdk.IsoDate.parse("2015-05-05T00:00"), "AVG([Parameter Requirement for Calc])", 2, "Day", "Hour", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (rolling) - add Formula History period frequency less than intermediate period", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcRolling)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), "AVG([Parameter Requirement for Calc])", 2, "Hour", "Day", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (fixing) - add Formula History period frequency less than intermediate period", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcFixed)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), "AVG([Parameter Requirement for Calc])", 2, "Hour", "Day", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (rolling) - add Formula History period frequency value is invalid", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcRolling)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), "AVG([Parameter Requirement for Calc])", 120001, "Week", "Day", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (fixing) - add Formula History period frequency value is invalid", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Formula History Script is empty", this.isTbCalcFixed)
			.addTbFormulaHistory(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), "AVG([Parameter Requirement for Calc])", 120001, "Week", "Day", 1, 2, 3)
			.addRequirementsAliasMap("[Parameter Requirement for Calc]", "Division For Requirements Test\\Facility For Requirements Test\\Parameter Requirement for Calc");
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

	asyncTest("Create TbCalculated Requirement (rolling)-add Expected Frequency History-fill wrong data(endDate > startDate)", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Frequency History-End Date is less or equal to Begin Date", this.isTbCalcRolling);
		calcReqInfo.addFrequency(this.startDate, this.endDate, 1); // End Date is less or equal to Begin Date

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Expected Frequency History-fill wrong data(overlap period)", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Frequency History-overlap period", this.isTbCalcRolling);
		calcReqInfo.frequencies = [];
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2015-03-03T00:00"), envianceSdk.IsoDate.parse("2015-06-06T00:00"), 1);
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2015-02-02T00:00"), envianceSdk.IsoDate.parse("2015-05-05T00:00"), 1);

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History History-End Date is less or equal to Begin Date", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History History-End Date is less or equal to Begin Date", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2015-01-01T00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00"), 1, 2, ">= LOW, <= HIGH", 3, 4);
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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-add Limits Histories with time periods that overlap", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-add Limits Histories with time periods that overlap", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2012-01-01T00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00"), 1, 2, ">= LOW, <= HIGH", 3, 4);
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2014-01-01T00:00"), envianceSdk.IsoDate.parse("2016-01-01T00:00"), 1, 2, ">= LOW, <= HIGH", 3, 4);
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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-Comparison '> LOW', leave both Lows empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-leave both Lows empty", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, "", 2, "> LOW", "", 4);

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-Comparison '>= LOW', leave both Lows empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-leave both Lows empty 2", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, "", 2, ">= LOW", "", 4);

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-Comparison '< HIGH', leave both Lows empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-leave both Lows empty 2", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", "< HIGH", 4, "");

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-Comparison '<= HIGH', leave both Lows empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-leave both Lows empty 2", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", "<= HIGH", 4, "");

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-Comparison '> LOW < HIGH', leave both Lows empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-leave both Lows empty 2", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", "> LOW < HIGH", 4, "");

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

	asyncTest("Create TbCalculated Requirement (rolling)-add Limits History-Comparison '> LOW < HIGH', leave both Highs empty", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullInfo("Limits History-leave both Highs empty 2", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, "", 1, "> LOW < HIGH", "", 4);

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

	asyncTest("Create TbCalculated Requirement (rolling)-Task for Regulatory Limit-not add Limits History then add Regulatory Task Template", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("not add Limits History then add Regulatory Task Template", this.isTbCalcRolling);
		calcReqInfo.setRegLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser).addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup);
		delete calcReqInfo.limitHistory;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK"); // ?
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create TbCalculated Requirement (rolling)-Task for Internal Limit-add Limits History without Internal Limit then add Internal Task Template", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add Limits History wout InternalLimit add InternalTaskTemplate", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 4, 2, ">= LOW", "", "");
		calcReqInfo.setIntLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser).addIntLimitTaskUser(this.accessUser).addIntLimitTaskGroup(this.accessGroup);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK"); // ?
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create TbCalculated Requirement (rolling) -  Task for Regulatory Limit - add Limits History without Regulatory Limit then add Regulatory Task Template", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add Limits History wout RegulatoryLimit add RegulatoryTaskTemplate", this.isTbCalcRolling);
		calcReqInfo.setRegLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser).addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK"); // ?
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create TbCalculated Requirement (rolling) -  Task for Regulatory Limit - add Limits History, add Internal Task Template, not add Assignor", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add RegulatoryTaskTemplate wout Assignor", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", ">= LOW", 1, "");
		calcReqInfo.setRegLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, null).addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup);
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

	asyncTest("Create TbCalculated Requirement (rolling) -  Task for Regulatory Limit - add Limits History, add Internal Task Template, not add Assignee", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add RegulatoryTaskTemplate wout Assignor", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", ">= LOW", 1, "");
		calcReqInfo.setRegLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser);
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

	asyncTest("Create TbCalculated Requirement (rolling) -  Task for Internal Limit - add Limits History, add Internal Task Template, not add Assignor", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add InternalTaskTemplate wout Assignor", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", ">= LOW", 1, "");
		calcReqInfo.setIntLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, null).addIntLimitTaskUser(this.accessUser).addIntLimitTaskGroup(this.accessGroup);
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

	asyncTest("Create TbCalculated Requirement (rolling) -  Task for Internal Limit - add Limits History, add Internal Task Template, not add Assignee", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add InternalTaskTemplate wout Assignor", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", ">= LOW", 1, "");
		calcReqInfo.setIntLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser);
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

	asyncTest("Create TbCalculated Requirement (rolling) -  Task for Internal Limit - add Limits History, add Internal Task Template, not add Assignee", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add InternalTaskTemplate wout Assignor", this.isTbCalcRolling);
		calcReqInfo.addLimitHistory(this.limitStartDate, this.limitEndDate, 1, "", ">= LOW", 1, "");
		calcReqInfo.setIntLimitTaskTemplateAndAsgn(this.taskTemplateIdOrName1, this.accessUser);
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

	asyncTest("Create TbCalculated Requirement (rolling) - Send data warnings to user and NOT specify 'Email', 'Inbox'", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add data warning to user wout email and inbox", this.isTbCalcRolling);
		calcReqInfo.setNotifyUserOrMail(null, null);
		calcReqInfo.addNotifyUser(this.accessUser);
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

	asyncTest("Create TbCalculated Requirement (rolling) - Send data warnings to group and NOT specify 'Email', 'Inbox'", 2, function () {
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildLightInfo("add data warning to group wout email and inbox", this.isTbCalcRolling);
		calcReqInfo.setNotifyUserOrMail(null, null);
		calcReqInfo.addNotifyGroup(this.accessGroup);
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

	asyncTest("Update TbCalculated Requirement - with empty name", 1, function () {
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

	asyncTest("Update TbCalculated Requirement - Inactive Date is less than Active Date", 2, function () {
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

	asyncTest("Update TbCalculated Requirement  -  Responsible User (non -existing user)", 2, function () {
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

	asyncTest("Update TbCalculated Requirement - add Expected Frequency History - End Date is less or equal to Begin Date", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2015-02-02T00:00"), envianceSdk.IsoDate.parse("2014-02-02T00:00"), 1);
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

	asyncTest("Update TbCalculated Requirement - add Expected Frequency History - enter Occurrences ('0')", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2011-02-02T00:00"), envianceSdk.IsoDate.parse("2012-02-02T00:00"), 0);
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

	asyncTest("Update TbCalculated Requirement - add Expected Frequency History - enter Occurrences ('1441')", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2011-02-02T00:00"), envianceSdk.IsoDate.parse("2012-02-02T00:00"), 1441);
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

	asyncTest("Update TbCalculated Requirement - add Expected Frequency Histories with time periods that overlap", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.frequencies = [];
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2010-02-02T00:00"), envianceSdk.IsoDate.parse("2012-02-02T00:00"), 1);
		calcReqInfo.addFrequency(envianceSdk.IsoDate.parse("2011-02-02T00:00"), envianceSdk.IsoDate.parse("2013-02-02T00:00"), 1);
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update TbCalculated Requirement - add Limits History  - End Date is less or equal to Begin Date", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2012-01-01T00:00"), envianceSdk.IsoDate.parse("2011-01-01T00:00"), 1, 2, ">= LOW, <= HIGH", 3, 4);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories with time periods that overlap", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-02-02T00:00"), envianceSdk.IsoDate.parse("2012-02-02T00:00"), 1, 2, ">= LOW, <= HIGH", 3, 4);
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2011-02-02T00:00"), envianceSdk.IsoDate.parse("2013-02-02T00:00"), 1, 2, ">= LOW, <= HIGH", 3, 4);
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(self.generatedCalcReqPath, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '> LOW', leave both Lows empty", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-02-02T00:00"), envianceSdk.IsoDate.parse("2010-01-02T00:00"), "", 2, "> LOW", "", 4);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '>= LOW', leave both Lows empty", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-02-02T00:00"), envianceSdk.IsoDate.parse("2010-01-02T00:00"), "", 2, "> LOW", "", 4);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '< HIGH', leave both Highs empty", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-02-02T00:00"), envianceSdk.IsoDate.parse("2010-01-02T00:00"), 1, "", "< HIGH", 2, "");
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '<= HIGH', leave both Lows empty", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-02-02T00:00"), envianceSdk.IsoDate.parse("2010-01-02T00:00"), 1, "", "<= HIGH", 2, "");
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '> LOW, < HIGH', leave Lows and Highs empty", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), "", "", "> LOW, < HIGH", 1, 1);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '> LOW, < HIGH',  Internal High is less or equal than Internal Low", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), 1, 2, "> LOW, < HIGH", 2, 1);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '> LOW, < HIGH',  Internal High is less or equal than Internal Low", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), 1, 2, "> LOW, < HIGH", 2, 1);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '> LOW, < HIGH',  Regulatory High is less or equal than Regulatory Low", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), 2, 1, "> LOW, < HIGH", 1, 2);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '>= LOW, <= HIGH', leave Lows and Highs empty", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), "", "", ">= LOW, <= HIGH", 1, 1);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '>= LOW, <= HIGH',  Internal High is less or equal than Internal Low", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), 1, 2, ">= LOW, <= HIGH", 2, 1);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '>= LOW, <= HIGH',  Internal High is less or equal than Internal Low", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), 1, 2, ">= LOW, <= HIGH", 2, 1);
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

	asyncTest("Update TbCalculated Requirement - add Limits Histories - Comparison '>= LOW, <= HIGH',  Regulatory High is less or equal than Regulatory Low", 2, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.addLimitHistory(envianceSdk.IsoDate.parse("2010-01-02T00:00"), envianceSdk.IsoDate.parse("2011-01-02T00:00"), 2, 1, ">= LOW, <= HIGH", 1, 2);
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

	asyncTest("Update TbCalculated Requirement -  Task for Internal Limit - Limits History NOT added then add Internal Task Template", 3, function () {
		var queue = new ActionQueue(this);

		var createcalcReqInfo = this.buildFullInfo("Update TbCalculated Requirement -  Task for Internal Limit", this.isTbCalcRolling);
		delete createcalcReqInfo.limitHistory;
		delete createcalcReqInfo.internalLimit;
		delete createcalcReqInfo.regulatoryLimit;
		var pathName = createcalcReqInfo.parentIdOrPath + '/' + createcalcReqInfo.name;

		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.limitHistory = [];
		delete calcReqInfo.name;
		delete calcReqInfo.parentIdOrPath;
		delete calcReqInfo.regulatoryLimit;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(createcalcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(pathName, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update TbCalculated Requirement -  Task for Regulatory Limit - add Limits History without Regulatory Limit then add Regulatory Task Template", 3, function () {
		var queue = new ActionQueue(this);

		var createcalcReqInfo = this.buildFullInfo("Update TbCalculated Requirement -  Task for Internal Limit", this.isTbCalcRolling);
		delete createcalcReqInfo.limitHistory;
		delete createcalcReqInfo.internalLimit;
		delete createcalcReqInfo.regulatoryLimit;
		var pathName = createcalcReqInfo.parentIdOrPath + '/' + createcalcReqInfo.name;

		var calcReqInfo = this.buildFullUpdateRequirementInfo();
		calcReqInfo.limitHistory = [];
		delete calcReqInfo.name;
		delete calcReqInfo.parentIdOrPath;
		delete calcReqInfo.internalLimit;

		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(createcalcReqInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.reqIdsToClear.push(pathName);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(pathName, calcReqInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create TbCalculated Requirement (rolling) without appropriate permissions", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		var calcReqInfo = this.buildLightInfo("Create TbCalculated Requirement (rolling) - without appropriate permissions", this.isTbCalcRolling);
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

	asyncTest("Update TbCalculated Requirement under CO without appropriate permissions", 2, function () {
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

	asyncTest("Get TbCalculated Requirement under CO without appropriate permissions", 2, function () {
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

	asyncTest("Delete TbCalculated Requirement  under CO without appropriate permissions", 2, function () {
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
	executeTbcRequirementServiceTests();
}