if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'MAC Requirements (standard/single)', execute: executeMacRequirementServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof macRequirementsConfig == "undefined")
	macRequirementsConfig = {};

function executeMacRequirementServiceTests() {
	module("Mac Requirement Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (macRequirementsConfig.noManageRightsUserName || "userWPermissionsMacReq") + qUnitDbSuffix;
			this.password = macRequirementsConfig.password || "1111";
			
			this.type = "MACRequirement";
			this.generatedDivisionName = "Division For Mac Test";
			this.generatedDivisionPath = "/" + this.generatedDivisionName;			
			this.generatedFacilityName = "Facility For Mac Test";
			this.generatedFacilityPath = this.generatedDivisionPath + "/" + this.generatedFacilityName;

			this.createName = "Crt MAC Name";			
			this.createDescription = "Crt Mac Description";
			this.parentIdOrPath = "Crt Mac Description";
			this.macType = "Standard";
			var xdateAct = envianceSdk.IsoDate.parse("2015-01-01T00:00");
			var xdateInact = envianceSdk.IsoDate.parse("2015-02-01T00:00");
			this.activateDate = new Date(xdateAct.getFullYear(), xdateAct.getMonth(), xdateAct.getDate(), 0, 0, 0);
			this.inactiveDate = new Date(xdateInact.getFullYear(), xdateInact.getMonth(), xdateInact.getDate(), 0, 0, 0);
			
			this.accessUser = this.accessUserName;
			this.accessGroup = "jstestsAccessGroup";

			this.responsibleUserIdOrName = "jstestsWPermissions" + qUnitDbSuffix;
			this.activityId = "Activity for Mac";
			this.templateName = "Requirement Template 1 for MAC";
			this.template2Name = "Requirement Template 2 for MAC";
			
			this.specificCitation = "specificCitation";
			this.periodFrequency = 2;
			this.periodTime = "Day";
			
			this.uom = "1";
			this.precision = "1";
			
			this.documentsPath = "/250/99999.xls";

			this.fieldTemplateName = "Custom Field Template 1 for MAC";
			this.customFieldTextBox = "XLS2_Text Box_Small (20 char max)";
			this.customFieldDDL = "XLS2_Text Box_Dropdown List";
			this.customFieldHyperlink = "MAS Hyperlink";			
			this.calcDescription = "Crt MAC calc description";
			this.fieldTemplate2Name = "Custom Field Template 2 for MAC";
			
			this.regTasktemplateId = "task-template-m-1";
			this.intTasktemplateId = "task-template-m-2";

			this.chemical1Name = "CfM2Mac";
			this.chemicalList1Name = "ChemicalListForMAC1";
			this.chemicalList2Name = "ChemicalListforMAC2";
			
			this.material1Name = "Material 1 for MAC";
			this.material1GroupName = "Material Group 1 for MAC";
			this.material2Name = "Material 2 for MAC";									
			this.material2GroupName = "Material Group 2 for MAC";
			this.activity2Name = "Activity 2 for Mac";
						
			this.aggregationOp = "SUM";
			this.macPathToClear = [];
		
			this.GeneratedMacID1 = "62e29301-c0cc-41be-a9bb-8013267e9355";
			this.maxDate = envianceSdk.IsoDate.parse("9999-12-31T00:00:00");

			this.limitStartDate = new Date(xdateAct.getFullYear(), xdateAct.getMonth(), xdateAct.getDate(), 0, 0, 0);
			this.limitEndDate = new Date(xdateInact.getFullYear(), xdateInact.getMonth(), xdateInact.getDate(), 0, 0, 0);
			
			this.createName2 = "Upd MAC Name";
			this.createDescription2 = "Upd Mac Description";
			this.generatedName = "MAC for Update 1";
			this.generatedPathName = this.generatedDivisionPath + "/" + this.generatedName;
			
			this.existedMacPathName = this.generatedFacilityPath + "/" + "MAC for Get 1";

			this.occureStartDate = envianceSdk.IsoDate.parse("2014-01-01T00:00:00");
			this.occureEndDate = envianceSdk.IsoDate.parse("2014-02-02T00:00:00");
			this.limitStartDate = envianceSdk.IsoDate.parse("2015-01-01T00:00:00");
			this.limitEndDate = envianceSdk.IsoDate.parse("2015-02-01T00:00:00");

			this.formulaStartDate = envianceSdk.IsoDate.parse("2014-12-01T00:00:00");
			this.formulaEndDate = envianceSdk.IsoDate.parse("2014-12-03T00:00:00");
			this.noninterStartDate = envianceSdk.IsoDate.parse("2015-03-06T00:00:00");
			this.noninterEndDate = envianceSdk.IsoDate.parse("2015-03-08T00:00:00");
			this.interStartDate = envianceSdk.IsoDate.parse("2014-12-02T00:00:00");
			this.interEndDate = envianceSdk.IsoDate.parse("2014-12-04T00:00:00");

			this.deleteName1 = "MAC for Delete 1";
			this.deleteName2 = "MAC for Delete 2";
			
			this.buildCreateFullMacRequirementInfo = function (nameStr) {
				return new envianceSdk.requirements.MacRequirementInfo(
					this.type, nameStr, this.generatedFacilityPath, this.activateDate, this.inactiveDate, this.responsibleUserIdOrName,
					this.templateName, this.specificCitation, this.periodFrequency, this.periodTime, this.createDescription,
					this.uom, this.precision, this.calcDescription, this.macType, this.activityId, this.aggregationOp
				)
					.addMaterial(this.material1Name)
					.addMaterialGroup(this.material1GroupName)
					.addFrequency(this.occureStartDate, this.occureEndDate, 1)
					.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "1+1", 1, 2, 3)
					.setFieldTemplate(this.fieldTemplateName)
					.addScalarFieldValue(this.customFieldTextBox, "cstm Field Text Box")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://jstest.kiev.ua")
					.addMacLimitHistory(this.limitStartDate, this.limitEndDate, ">= LOW, <= HIGH", 1, 2, this.chemical1Name, this.chemicalList1Name, 3, 4, this.chemicalList2Name)
					.addDocument(this.documentsPath)
					.setRegLimitTaskTemplateAndAsgn(this.regTasktemplateId, this.accessUser)
					.addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup)
					.setIntLimitTaskTemplateAndAsgn(this.intTasktemplateId, this.accessUser)
					.addIntLimitTaskUser(this.accessUser).addIntLimitTaskGroup(this.accessGroup)
					.setNotifyUserOrMail(true, true)
					.addNotifyUser(this.accessUser)
					.addNotifyGroup(this.accessGroup);
			};
			
			this.buildMacForFullUpdateInfo = function () {
				return new envianceSdk.requirements.MacRequirementInfo(
					this.type, this.createName2, this.generatedFacilityPath, this.activateDate, this.inactiveDate, this.responsibleUserIdOrName,
					this.templateName, this.specificCitation, this.periodFrequency, this.periodTime, this.createDescription2,
					this.uom, this.precision, this.calcDescription, this.macType, this.activityId, this.aggregationOp
				)
					.addFrequency(this.occureStartDate, this.occureEndDate, 55)
					.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "43+34", 12, 22, 32)
					.setFieldTemplate(this.fieldTemplateName)
					.addScalarFieldValue(this.customFieldTextBox, "cstm Field Text Box")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://jstest.kiev.ua")
					.addMacLimitHistory(this.limitStartDate, this.limitEndDate, ">= LOW, <= HIGH", 1, 2, this.chemical1Name, this.chemicalList1Name, 3, 4, this.chemicalList2Name)
					.addDocument(this.documentsPath)
					.setRegLimitTaskTemplateAndAsgn(this.regTasktemplateId, this.accessUser)
					.addRegLimitTaskUser(this.accessUser).addRegLimitTaskGroup(this.accessGroup)
					.setIntLimitTaskTemplateAndAsgn(this.intTasktemplateId, this.accessUser)
					.addIntLimitTaskUser(this.accessUser).addIntLimitTaskGroup(this.accessGroup)
					.setNotifyUserOrMail(true, true)
					.addNotifyUser(this.accessUser).addNotifyGroup(this.accessGroup);
				
			};
			
			this.buildMacForUpdateInfo = function () {
				return new envianceSdk.requirements.MacRequirementInfo(
					this.type, this.createName2, this.generatedFacilityPath, this.activateDate, this.inactiveDate, this.responsibleUserIdOrName,
					this.templateName, this.specificCitation, this.periodFrequency, this.periodTime, this.createDescription2,
					this.uom, this.precision, this.calcDescription, this.macType, this.activityId, this.aggregationOp
				);
			};
		
			this.buildMacLightInfo = function (nameStr) {
				return new envianceSdk.requirements.MacRequirementInfo(
					this.type, nameStr, this.generatedFacilityPath, this.activateDate, this.inactiveDate, this.responsibleUserIdOrName,
					this.templateName, this.specificCitation, this.periodFrequency, this.periodTime, this.createDescription,
					this.uom, this.precision, this.calcDescription, this.macType, this.activityId, this.aggregationOp
				)
					.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "1+1", 1, 2, 3)
					.addMaterial(this.material1Name);
			};
			
			this.buildMicroInfo = function() {
				return new envianceSdk.requirements.MacRequirementInfo(null, null, null, "only desc");
			};
			
			this.fullCompareMacRequirementInfo = function (actual, expected) {
				this.compareMacRequirementInfo(actual, expected);
				// TODO : !
				//this.compareFrequencies(actual.frequencies, expected.frequencies);
				this.compareFormulaHistory(actual.formulaHistory, expected.formulaHistory);
				this.compareLimitHistory(actual.macLimitHistory, expected.macLimitHistory);
				deepEqual(actual.documents, expected.documents, "Documents are equal");
				deepEqual(actual.materials, expected.materials, "Materials are equal");
				if (expected.fieldValues.length > 0) // ?
					this.compareUdfFields(actual.fieldValues, expected.fieldValues);
				// TODO : !
				//deepEqual(actual.notifyRecipients, expected.notifyRecipients, "Notify Recipients are equal");
			};
			
			this.compareMacRequirementInfo = function (actual, expected) {				
				equal(actual.description, expected.description, "Desctiptions are equal");
				deepEqual(actual.activeDate, expected.activeDate, "ActivateDate are equal");
				deepEqual(actual.inactiveDate, expected.inactiveDate, "DeactivateDate are equal");
				equal(actual.responsibleUserIdOrName, expected.responsibleUserIdOrName, "Responsible User are equal");
				equal(actual.templateId, expected.templateId, "Template are equal");
				equal(actual.activity, expected.activity, "Аctivity are equal");
				equal(actual.periodFrequency, expected.periodFrequency, "Period Frequency are equal");
				equal(actual.periodTime, expected.periodTime, "Period Time are equal");
				equal(actual.uom, expected.uom, "UOM are equal");
				equal(actual.precision, expected.precision, "precision are equal");
				equal(actual.calcDescription, expected.calcDescription, "Calc Description are equal");
				equal(actual.aggregationOp, expected.aggregationOp, "Aggregation Operation are equal");
				equal(actual.requirementTemplate, expected.requirementTemplate, "Requirement Template Operation are equal");
				equal(actual.fieldTemplate, expected.fieldTemplate, "Requirement Template Operation are equal");
				equal(actual.regulatoryLimitTemplate, expected.regulatoryLimitTemplate, "Regulatory Limit Template Template Operation are equal");
				equal(actual.regulatoryLimitAssignor, expected.regulatoryLimitAssignor, "Regulatory Limit Assignor are equal");
				deepEqual(actual.regulatoryLimitAssignees, expected.regulatoryLimitAssignees, "Regulatory Limit Assignees are equal");
				equal(actual.internalLimitTemplate, expected.internalLimitTemplate, "Regulatory Limit Template Template Operation are equal");
				equal(actual.internalLimitAssignor, expected.internalLimitAssignor, "Internal Limit Assignor are equal");
				deepEqual(actual.internalLimitAssignees, expected.internalLimitAssignees, "Internal Limit Assignees are equal");
				equal(actual.notifyInbox, expected.notifyInbox, "Notify Inbox are equal");
				equal(actual.notifyEmail, expected.notifyEmail, "Notify Email are equal");
			};
			this.compareFrequencies = function(actual, expected) {
				if (actual.length != expected.length) {
					throw new Error("Actual length " + actual.length + " doesn't match expected length " + expected.length);
				} else {
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].beginDate, expected[i].beginDate, "beginDate " + i + " are equal");
						deepEqual(actual[i].endDate, expected[i].endDate, "endDate " + i + " are equal");
						deepEqual(actual[i].occurences, expected[i].occurences, "occurences " + i + " are equal");
					}
				}
			};
			this.compareFormulaHistory = function (actual, expected) {
				equal(actual.length, expected.length, "Length of formula history are equal");
				if (actual.length == expected.length) {
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].beginDate, expected[i].beginDate, "beginDate " + i + " are equal");
						deepEqual(actual[i].endDate, expected[i].endDate, "endDate " + i + " are equal");
						deepEqual(actual[i].script, expected[i].script, "script " + i + " are equal");
						deepEqual(actual[i].exceptionDivideByZero, expected[i].exceptionDivideByZero, "exceptionDivideByZero " + i + " are equal");
						deepEqual(actual[i].exceptionOverflow, expected[i].exceptionOverflow, "exceptionOverflow " + i + " are equal");
						deepEqual(actual[i].exceptionOther, expected[i].exceptionOther, "exceptionOther " + i + " are equal");
					}
				}
			};
			this.compareLimitHistory = function (actual, expected) {
				equal(actual.length, expected.length, "Length of limit history are equal");
				if (actual.length == expected.length) {				
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].beginDate, expected[i].beginDate, "beginDate " + i + " are equal");
						deepEqual(actual[i].endDate, expected[i].endDate, "endDate " + i + " are equal");
						deepEqual(actual[i].comparisonOperation, expected[i].comparisonOperation, "comparisonOperation " + i + " are equal");
						deepEqual(actual[i].regLowLimit, expected[i].regLowLimit, "lowLimit " + i + " are equal");
						deepEqual(actual[i].regHighLimit, expected[i].regHighLimit, "highLimit " + i + " are equal");
						deepEqual(actual[i].chemicalIdOrAlias, expected[i].chemicalIdOrAlias, "chemicalIdOrAlias " + i + " are equal");
						deepEqual(actual[i].regChemListIdOrName, expected[i].regChemListIdOrName, "regChemicalListIdOrName " + i + " are equal");
						deepEqual(actual[i].intLowLimit, expected[i].intLowLimit, "intLowLimit " + i + " are equal");
						deepEqual(actual[i].intHighLimit, expected[i].intHighLimit, "intHighLimit " + i + " are equal");
						deepEqual(actual[i].intChemListIdOrName, expected[i].intChemListIdOrName, "intChemicalListIdOrName " + i + " are equal");
					}
				}
			};
			this.formatDateTime = function (dtStr) {
				var dt = envianceSdk.IsoDate.parse(dtStr);
				return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0);
			};
			this.compareUdfFields = function (actual, expected) {
				// Fields
				var actualFields = toMap(actual, function (field) { return field.name; });
				var expectedFields = toMap(expected, function (field) { return field.name; });

				deepEqual(actualFields[this.customFieldTextBox], expectedFields[this.customFieldTextBox], "Text field are equal");
				deepEqual(actualFields[this.customFieldDDL], expectedFields[this.customFieldDDL], "DDL field are equal");
				deepEqual(actualFields[this.customFieldHyperlink], expectedFields[this.customFieldHyperlink], "Hlink field are equal");
			};
		},

		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			for (var i = 0 ; i < this.macPathToClear.length ; i++){
				stop();
				envianceSdk.requirements.deleteRequirement(this.macPathToClear[i], true,
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
					context._errorHandler);
			});
		},

		_errorHandler: function (response) {
			envianceSdk.configure({ sessionId: this.originalSessionId });
			var message = response.error ? response.error.message : "Unexpected result";			
			ok(false, message);
			start();
		},

		_start: function(queue) {
			queue.enqueue(function() {
				start();
			});
			queue.executeNext();
		}
		
	});


	asyncTest("Create MAC - full properties - Happy path", 46, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildCreateFullMacRequirementInfo("Create MAC - full properties");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - full properties";
		
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function () {
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.fullCompareMacRequirementInfo(response.result, macInfo);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - Set Template, Activity, Material Formula - Happy path", 31, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - Set Template, Activity, Material Formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - Set Template, Activity, Material Formula"; 
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function () {								
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMacRequirementInfo(response.result, macInfo);
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create MAC - without template", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - without template");
		macInfo.requirementTemplateIdOrName = "";
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create MAC - add Single Material - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add Single Material");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add Single Material";
		macInfo.macType = "SingleStandard";
		macInfo.materials = [];
		macInfo.addMaterial(this.material1Name);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function () {										
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create MAC - add several Material - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add several Material");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add several Material";
		macInfo.macType = "Standard";
		macInfo.materials = [];
		macInfo.addMaterial(this.material1Name).addMaterial(this.material2Name);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function () {
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - add several Material and Group - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add several Material and Group");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add several Material and Group";
		macInfo.macType = "Standard";
		macInfo.materials = [];
		macInfo.addMaterial(this.material1Name).addMaterial(this.material2Name).addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function () {					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - add Group - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add Group");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add Group";
		macInfo.macType = "Standard";
		macInfo.materials = [];
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function () {								
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create MAC - Fault when MAC without name", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("");		
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when MAC without activity", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - without activity");
		macInfo.activityIdOrName = null;
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when MAC without materials", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - without materials");
		macInfo.materials = [];
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when name with '/' symbol", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("bad / name");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when name with '\\' symbol", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("bad \\ name");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when name with '[' symbol", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("bad [ name");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create MAC - Fault when name with ']' symbol", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("bad ] name");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when no dates in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - no dates in formula ");
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(null, null, "43+34", "12", "22", "32");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create MAC - Fault when only EndDate in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - only EndDate in formula ");
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(null, new Date(2010, 11, 8), "43+34", "12", "22", "32");
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create MAC - Fault when overlapped dates in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - overlapped dates in formula ");
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(new Date(2010, 11, 8), new Date(2010, 11, 11), "43+34", 12, 22, 32);
		macInfo.addFormulaHistory(new Date(2010, 11, 9), new Date(2010, 11, 12), "43+22", 122, 223, 324);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
		
	asyncTest("Create MAC - add SUV to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add SUV to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add SUV to formula"; 
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+[Prop_SUV 1 for MAC]", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - add AVBP to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add AVBP to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add AVBP to formula"; 
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+[Prop_AVBP 1 for MAC]", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - add all Chemicals to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add all Chemicals to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add all Chemicals to formula";
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+SUM([Chem_MW])", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - add MVBP to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add MVBP to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add MVBP to formula";
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+[Prop_MVBP 1 for MAC]", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});	

	asyncTest("Create MAC - add PFBP to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add PFBP to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add PFBP to formula";
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+[Prop_PFBP 1 for MAC]", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create MAC - add SFBP to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add SFBP to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add SFBP to formula";
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+[Prop_SFBP 1 for MAC]", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create MAC - add TFBP to formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - add TFBP to formula");
		var macPath = this.generatedFacilityPath + "/" + "Create MAC - add TFBP to formula";
		macInfo.macType = "Standard";
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "123+[Prop_TFBP 1 for MAC]", 12, 22, 32);
		macInfo.addMaterialGroup(this.material1GroupName);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.macPathToClear.push(macPath);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(macPath,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.macType, macInfo.macType, "Mac type are equal");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create MAC - Fault when invalid property in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - invalid property in formula");
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(new Date(2010, 11, 8), new Date(2011, 11, 8), "43+[Prop_NonExist]", 12, 22, 32);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create MAC - Fault when invalid chemical in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacLightInfo("Create MAC - invalid chemical in formula ");
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(new Date(2010, 11, 8), new Date(2011, 11, 8), "43+[ChemNonExist]", 12, 22, 32);
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update MAC - Full update - Happy path", 47, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForFullUpdateInfo().addMaterial(this.material1Name).addMaterial(this.material2Name);
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.fullCompareMacRequirementInfo(response.result, macInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update MAC - change activity - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo().addMaterial(this.material1Name).addMaterial(this.material2Name);
		macInfo.activityIdOrName = this.activity2Name;
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");					
					equal(response.result.activityIdOrName, macInfo.activityIdOrName, "Activity changed");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update MAC - add material - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo().addMaterial(this.material1Name).addMaterial(this.material2Name);
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update MAC - add material group - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo().addMaterial(this.material1Name).addMaterial(this.material2Name).addMaterialGroup(this.material2GroupName);
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update MAC - delete material - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo().addMaterial(this.material1Name).addMaterialGroup(this.material2GroupName);

		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update MAC - delete material group - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo().addMaterial(this.material1Name);

		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.materials, macInfo.materials, "Materials are equal");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update MAC - change date in formula history - Happy path", 6, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo();
		macInfo.formulaHistory = [];
		var script = "2 + 2";
		var newEndDate = envianceSdk.IsoDate.parse("2014-12-03T00:00");
		macInfo.addFormulaHistory(this.formulaStartDate, newEndDate, script);		
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					equal(response.result.formulaHistory.length, macInfo.formulaHistory.length, "Length of formula history are equal");
					deepEqual(response.result.formulaHistory[0].beginDate, macInfo.formulaHistory[0].beginDate, "beginDate are equal");
					deepEqual(response.result.formulaHistory[0].endDate, newEndDate, "endDate are equal");
					deepEqual(response.result.formulaHistory[0].script, script, "script are equal");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update MAC - Fault when remove BeginDate in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo();
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(null, this.formulaEndDate, "2+2");
		var id = this.GeneratedMacID1;
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update MAC - change formula in formula history - Happy path", 9, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo();
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "125 + 123", 12, 22, 32);
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareFormulaHistory(response.result.formulaHistory, macInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update MAC - Fault intersected periods in formula history", 2, function () {
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo();
		macInfo.formulaHistory = [];
		macInfo.addFormulaHistory(this.formulaStartDate, this.formulaEndDate, "2+2");
		macInfo.addFormulaHistory(this.interStartDate, this.interEndDate, "2 + 2");
		var id = this.GeneratedMacID1;
		queue.enqueue(function (context) {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Update MAC - change requirement template - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo();
		macInfo.requirementTemplateIdOrName = this.template2Name;
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.requiredTemplate, macInfo.requiredTemplate, "requiredTemplate are equal");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update MAC - change custom field template - Happy path", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		var macInfo = this.buildMacForUpdateInfo();
		macInfo.fieldTemplateIdOrName = this.fieldTemplate2Name;
		macInfo.fieldValues = [];
		var id = this.GeneratedMacID1;
		queue.enqueue(function () {
			envianceSdk.requirements.updateRequirement(id, macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, self._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					deepEqual(response.result.fieldTemplate, macInfo.fieldTemplate, "fieldTemplate are equal");					
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Get Mac - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(context.GeneratedMacID1,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get Mac - Happy path - By Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(context.existedMacPathName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get Mac - Fault if invalid ID", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement(envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Get Mac - Fault if invalid Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.getRequirement("wrong name",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete MAC - Happy Path", 4, function () {
		var queue = new ActionQueue(this);

		var name = "Create MAC - MAC for delete";
		var macInfo = this.buildMacLightInfo(name);
		var macPath = this.generatedFacilityPath + "/" + name;
		macInfo.macType = "SingleStandard";
		queue.enqueue(function (context) {
			envianceSdk.requirements.createRequirement(macInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});
	
		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement(macPath, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(macPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});


		queue.executeNext();
	});
	
	asyncTest("Delete MAC - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement(envianceSdk.getSessionId(), true,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Delete MAC - Fault when Name doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.requirements.deleteRequirement("wrong name", true,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

}

if (typeof (UnitTestsApplication) == "undefined") {
	executeMacRequirementServiceTests();
}