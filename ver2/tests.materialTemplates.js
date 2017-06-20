if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'MaterialTemplate', execute: executeMaterialTemplateServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof materialTemplatesConfig == "undefined")
	materialTemplatesConfig = {};

function executeMaterialTemplateServiceTests() {
	module("Material Template Service", {
		setup: function() {						
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (materialTemplatesConfig.noManageRightsUserName || "userWPermissionsMatTemplate") + qUnitDbSuffix;
			this.password = materialTemplatesConfig.password || "1111";

			this.anyGuid = "bab4e72f-dfc5-4a0a-90dc-f551b58664ba";
			this.GeneratedTemplate1ID = "b45fb1ea-95ed-4153-9b8c-16df043ccca3";
			this.GeneratedTemplate1Name = "Material Template - 1";
			this.GeneratedTemplate2ID = "02df3b64-922a-4336-9833-ec9f77187816";
			this.GeneratedTemplate2Name = "Material Template - 2";

			this.cfText = "XLS2_Text Box_Large (7900 char max)";
			this.cfTextDDL = "XLS2_Text Box_Dropdown List";
			this.cfMultiLB = "XLS2_Multi- Selection List Box";					
			this.cfNum = "XLS_kio_num_txtbox";
			this.cfNumDDL = "XLS_kio_num_ddl1";
			this.cfNumLookup = "XLS_kio_num_numlookup1";
			this.cfDate = "XLS_UDF_date";
			this.cfTime = "XLS_UDF_time";
			this.cfDateTime = "XLS_UDF_date time";
			this.cfBoolDDL = "XLS_kio_true-false_ddl";
			this.cfBoolCB = "XLS2_true/false_Check Box";

			this.cfTxtDDLwTB = "XLS2_Text Box_Dropdown List with Text Box";
			this.cfNumDDLwTB = "n_ddl_w_tb";
			this.cfNumIdCtrl = "n_idctrl";
			this.cfNumCalc = "XLS_kio_calc";
			this.cfHyper = "MAS Hyperlink";
			this.cfCitHyper = "XLS_cithl";

			this.templateIdsToClear = [];
		
			this.buildMaterialTemplateAllFieldInfo = function (name) {
				return new envianceSdk.materialTemplates.MaterialTemplateInfo(name, name + " Description")
					.addField(this.cfText).addField(this.cfTextDDL).addField(this.cfMultiLB).addField(this.cfNum)
					.addField(this.cfNumDDL).addField(this.cfNumLookup).addField(this.cfDate).addField(this.cfTime).addField(this.cfDateTime)
					.addField(this.cfBoolDDL).addField(this.cfBoolCB);
			};

			this.buildMaterialTemplateInfo = function (name, fields) {
				return new envianceSdk.materialTemplates.MaterialTemplateInfo(name, name + " Description", fields);
			};			
			
			this.compareMaterialTemplateInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Description are equal");
				deepEqual(actual.fields, expected.fields, "Fields are equal");
			};
		
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			for (var i = this.templateIdsToClear.length - 1; i >= 0 ;i -- ){
				stop();
				envianceSdk.materialTemplates.deleteMaterialTemplate(this.templateIdsToClear[i],
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

		_errorHandler: function(response) {
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
	
	asyncTest("Create Material Template - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateAllFieldInfo("Create Material Template - Happy path");
		var materialTemplateId;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialTemplateId = response.result;
					context.templateIdsToClear.push(materialTemplateId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(materialTemplateId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMaterialTemplateInfo(response.result, materialTemplateInfo);
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create Material Template - Fault when create by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateAllFieldInfo("Create Material Template - Fault when create by user without right");
		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.templateIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Material Template - Fault when template without fields", 2, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template without fields");
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Template - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo(null).addField(this.cfText);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Template - Fault when name already exist", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo(this.GeneratedTemplate1Name).addField(this.cfText);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Template - Fault when use TxtDDlwTB", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template - use TxtDDlwTB").addField(this.cfTxtDDLwTB);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Template - Fault when use NumDDlwTB", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template - use NumDDlwTB").addField(this.cfNumDDLwTB);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Template - Fault when use NumIDCtrl", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template - use NumIDCtrl").addField(this.cfNumIdCtrl);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Template - Fault when use Calc", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template - use Calc").addField(this.cfNumCalc);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Template - Fault when use Hyperlink", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template - use Hyperlink").addField(this.cfHyper);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Template - Fault when use Citation Hyperlink", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Create Material Template - use Citation Hyperlink").addField(this.cfCitHyper);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});

	
	asyncTest("Update Material Template - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateAllFieldInfo("Update Material Template - Happy path");
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareMaterialTemplateInfo(response.result, materialTemplateInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Material Template - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateAllFieldInfo("Update Material Template - Fault when user without right");
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(context.materialDelete2ID, materialTemplateInfo,
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

	asyncTest("Update Material Template - Fault when empty fields", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - Fault when empty fields");
		materialTemplateInfo.fields = [];
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function(context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,			
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");					
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Material Template - Fault when name is empty", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo().addField(this.cfText);
		materialTemplateInfo.name = "";
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");					
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Material Template - Fault when name already exist", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Material Template - 1").addField(this.cfText);		
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");					
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Material Template - Fault when use TxtDDlwTB", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - use TxtDDlwTB").addField(this.cfTxtDDLwTB);
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Material Template - Fault when use NumDDlwTB", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - use NumDDlwTB").addField(this.cfNumDDLwTB);
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Material Template - Fault when use NumIdCtrl", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - use NumIdCtrl").addField(this.cfNumIdCtrl);
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Material Template - Fault when use Calc", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - use Calc").addField(this.cfNumCalc);
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Material Template - Fault when use Hyperlink", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - use Hyperlink").addField(this.cfHyper);
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update Material Template - Fault when use Citation Hyperlink", 1, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Update Material Template - use Citation Hyperlink").addField(this.cfCitHyper);
		var id = this.GeneratedTemplate2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.updateMaterialTemplate(id, materialTemplateInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Get MaterialTemplate - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(context.GeneratedTemplate1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get MaterialTemplate - Happy path - By Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(context.GeneratedTemplate1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get MaterialTemplate - Fault user has no rights", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(context.GeneratedTemplate1Name,
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

	asyncTest("Get MaterialTemplate - Fault if non existing ID", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get MaterialTemplate - Fault if non existing Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate("WRONG NAME",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
	

	asyncTest("Delete Material Template by ID - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var materialTemplateInfo = this.buildMaterialTemplateInfo("Material Template For delete by ID").addField(this.cfNum);
		var materialTemplateId;
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialTemplateId = response.result;					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(materialTemplateId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.deleteMaterialTemplate(materialTemplateId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					start();
				}, context._errorHandler);
		});
		
		queue.executeNext();
	});

	asyncTest("Delete Material Template by Name - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var materialTemplateName = "Material Template For delete by Name";
		var materialTemplateInfo = this.buildMaterialTemplateInfo(materialTemplateName).addField(this.cfNum);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(materialTemplateInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(materialTemplateName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.deleteMaterialTemplate(materialTemplateName,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Delete Material Template - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.deleteMaterialTemplate(envianceSdk.getSessionId(),
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

	asyncTest("Delete Material Template - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.deleteMaterialTemplate(envianceSdk.getSessionId(),
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Material Template - Fault when Name is wrong", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.deleteMaterialTemplate("WRONG NAME",
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});
	

	asyncTest("Copy Material Template - by ID - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildMaterialTemplateInfo("Material Template For Copy by ID").addField(this.cfNum);
		var existedId;
		
		var copyInfo = this.buildMaterialTemplateInfo("New Name for Copy").addField(this.cfNum);
		delete copyInfo.description;
		var createdId;
		
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					existedId = response.result;
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.copyMaterialTemplate(copyInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					createdId = response.result;
					context.templateIdsToClear.push(createdId);
					context.templateIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, copyInfo.name, "Names are equal");
					equal(response.result.description, existedInfo.description, "Description are equal");
					deepEqual(response.result.fields, existedInfo.fields, "Fields are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});


	asyncTest("Copy Material Template - by Name - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var existedName = "Material Template For Copy by Name";
		var existedInfo = this.buildMaterialTemplateInfo(existedName).addField(this.cfNum);
		var existedId;

		var copyInfo = this.buildMaterialTemplateInfo("New Name for Copy").addField(this.cfNum);
		delete copyInfo.description;
		var createdId;

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.createMaterialTemplate(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					existedId = response.result;
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.copyMaterialTemplate(copyInfo, existedName,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					createdId = response.result;
					context.templateIdsToClear.push(createdId);
					context.templateIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.getMaterialTemplate(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, copyInfo.name, "Names are equal");
					equal(response.result.description, existedInfo.description, "Description are equal");
					deepEqual(response.result.fields, existedInfo.fields, "Fields are equal");					
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Copy Material Template - by ID - Fault when ID not exist", 2, function () {
		var queue = new ActionQueue(this);		
		var copyInfo = this.buildMaterialTemplateInfo("New Name for Copy").addField(this.cfNum);				
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.copyMaterialTemplate(copyInfo, envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		
		queue.executeNext();
	});

	asyncTest("Copy Material Template - by Name - Fault when Name not exist", 2, function () {
		var queue = new ActionQueue(this);
		var copyInfo = this.buildMaterialTemplateInfo("New Name for Copy").addField(this.cfNum);		
		queue.enqueue(function (context) {
			envianceSdk.materialTemplates.copyMaterialTemplate(copyInfo, "WRONG NAME",
				context.successHandler,
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
	executeMaterialTemplateServiceTests();
}