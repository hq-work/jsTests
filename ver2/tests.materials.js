if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Materials', execute: executeMaterialsServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof materialsConfig == "undefined")
	materialsConfig = {};

function executeMaterialsServiceTests() {
	module("Materials Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (materialsConfig.noManageRightsUserName || "userWPermissionsMaterial") + qUnitDbSuffix;
			this.password = materialsConfig.password || "1111";
			this.materialsIdsToClear = [];

			this.chemical1ID = "e9a57b59-677a-4faa-bcff-00e5931058b2";
			this.chemical2Alias = "CfM2";
			
			this.material1ID = "fc95106b-e643-4d10-a59d-d3e55bd8f809";
			this.material1Name = "Material 1";
			this.material2ID = "ceb46418-3be8-470d-9f75-04ca3d516ebc";
			this.material2Name = "Material 2";
			this.materialUpdate1ID = "84497561-3628-4bea-b98a-a693de9573dc";
			this.materialUpdate2ID = "76cf0056-1b49-4bce-a216-8ded7f5fc7be";
			
			this.anyGuid = "074265D2-94FF-41EE-BF64-EAB31C54CB1B";
			this.template2Name = "Material Template 2";
			this.template2ID = "EC739C75-4F7C-437B-A8AC-9955AF9CCAAD";			
			this.template3Name = "Material Template 3";
			this.template3ID = "81a0ca34-3c48-4015-a72f-76e0c4ccc465";			
			this.materialPropertyName = "Material Property 1";
			this.materialPropertyID = "B19C37C4-FB19-4E0D-8554-E703147D206E";
			this.materialDelete1ID = "cc34ed2d-6185-480d-ac6d-311816bc4d50";
			this.materialDelete2ID = "a33a4237-76c6-491e-84c3-b2b1794d99e8";
			this.materialDelete3Name = "Material to delete-3";
			this.wrongID = "3038c548-4d65-4cae-b473-00484217d669";

			this.MvbpID = "3186f7ca-216f-4e7d-8d00-cc3c9b7456a0";
			this.PfbpID = "93087317-b45d-4aa9-be56-82852a9a1ad4";
			this.SfbpID = "6466e9fb-296d-4c11-adbf-6ecd6ec8c1d7";
			this.TfbpID = "9e6ad015-7707-4899-b4c3-4684dc092231";
			
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
//			this.cfDateTime = "XLS_UDF_date time";
			this.cfBoolDDL = "XLS_kio_true-false_ddl";
			this.cfBoolCB = "XLS2_true/false_Check Box";
			
			this.buildMaterialLightInfo = function (name) {
				return new envianceSdk.materials.MaterialInfo(
					name, "Description", null, true,
					[this.buildChemicalInfo(this.chemical1ID, [
						{ beginDate: new Date(2010, 11, 8) },
						{ beginDate: new Date(2010, 11, 10) }])]
				);
			};
			
			this.buildMaterialInfo = function (name, template) {
				var date = new Date();
				var beginDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30, 0);				
				return new envianceSdk.materials.MaterialInfo(
						name, "Description", template, true,
						[this.buildChemicalInfo(this.chemical1ID,
							[{ beginDate: new Date(2010, 11, 8) },
							 { beginDate: new Date(2010, 11, 10) }])])
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
//					.addDateFieldValue(this.cfDateTime, "2012-10-11T19:40")
					.addScalarFieldValue(this.cfBoolDDL, "Yes")
					.addScalarFieldValue(this.cfBoolCB, "False")
					.addProperty(this.TfbpID)					
					.addProperty(this.SfbpID)
					.addProperty(this.PfbpID)
					.addProperty(this.MvbpID, [new envianceSdk.materials.MaterialPropertyValueHistoryInfo(null, beginDate, 5)])
				;
			};

			this.buildChemicalInfo = function(chemicalIdOrAlias, chemicalConcentrationItems) {
				var date = new Date();
				var result = new envianceSdk.materials.MaterialChemicalMapInfo(chemicalIdOrAlias);
				if (chemicalConcentrationItems) {
					for (var i = 0; i < chemicalConcentrationItems.length; i++) {
						beginDate = chemicalConcentrationItems[i].beginDate || new Date(date.getFullYear(), date.getMonth(), date.getDate());						
						result.addChemicalConcentration(
							chemicalConcentrationItems[i].id || createUUID(),
							chemicalConcentrationItems[i].beginDate,							
							chemicalConcentrationItems[i].present || i == chemicalConcentrationItems.length - 1,
							chemicalConcentrationItems[i].minConc || 0,
							chemicalConcentrationItems[i].avgConc || 50,
							chemicalConcentrationItems[i].maxConc || 100,
							chemicalConcentrationItems[i].created || date);
					}
				}
				return result;
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
			
			this.compareMaterialFields = function(actual, expected) {
				// Fields
				var actualFields = toMap(actual, function(field) { return field.name; });
				var expectedFields = toMap(expected, function(field) { return field.name; });

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

				//TODO Time value returned is reduced by 3 hours, ask if there are any means to handle such behaviour
//				var expectedFieldsDatetime = new Date(Date.parse(expectedFields[this.cfDateTime].values[0]));
//				var intermDate = new Date(expectedFieldsDatetime);
//				var expectedDatetime = new Date(intermDate.setHours(expectedFieldsDatetime.getHours() + 3));
//				deepEqual(new Date(actualFields[this.cfDateTime].values[0]), expectedDatetime, "DateTimes are equal");
//				deepEqual(new Date(actualFields[this.cfDateTime].values[0]), expectedFields[this.cfDateTime], "DateTimes are equal");

				deepEqual(actualFields[this.cfBoolDDL], expectedFields[this.cfBoolDDL], "Bool DDLs are equal");
				deepEqual(actualFields[this.cfBoolCB], expectedFields[this.cfBoolCB], "Bool CBs are equal");
			};

			this.compareMaterialInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Desctiptions are equal");
				equal(actual.materialAvailabilityFlag, expected.materialAvailabilityFlag, "MaterialAvailabilityFlag are equal");				
			};
		},

		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			

			for (var d = this.materialsIdsToClear.length - 1; d >= 0;d-- ){
				envianceSdk.materials.deleteMaterial(this.materialsIdsToClear[d],
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
	
	asyncTest("Get Material - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(context.material1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get Material - Happy path - By Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(context.material1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Material - Fault if non existing ID", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Material - Fault if invalid Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial("Invalid material name",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Material - Fault user has no rights", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(context.material1ID,
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
	
	asyncTest("Create Material - Happy path - Check warnings", 29, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Happy path - Check warnings", this.template2ID);
		
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				function (response) {
					context.materialsIdsToClear.push(materialInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(materialInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMaterialInfo(response.result, materialInfo);
					context.comparePropertiesFull(response.result.properties, materialInfo.properties);
					context.compareMaterialFields(response.result.fields, materialInfo.fields);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material - Fault if material without name", 2, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Fault if material without name", this.template2ID);
		materialInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material - Fault if material with existing name", 1, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Fault, existing name", this.template2ID);
		materialInfo.name = "Material 1";
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material - Fault if material with properties but no chemicals", 1, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Fault if no chemicals", this.template2ID);
		materialInfo.chemicals = [];
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material - Fault if no properties no chemicals", 1, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Fault if no chemicals", this.template2ID);
		materialInfo.properties = [];
		materialInfo.chemicals = [];
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material - Fault if chemical without history", 2, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Fault if chemicals wout history", this.template2ID);		
		materialInfo.chemicals = [];
		materialInfo.addChemical(this.chemical1ID);
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material - Fault if wrong property", 1, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - Fault if wrong property", this.template2ID);
		materialInfo.addProperty(this.wrongID);
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Async - Happy path - Check warnings", 1, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material Async - Happy path - Check warnings", this.template2ID);

		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterialAsync(materialInfo,
				function (response) {
					context.materialsIdsToClear.push(materialInfo.name);
					equal(response.result.length, 36, "Material created");
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});


	asyncTest("Copy Material - Happy path", 29, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildMaterialInfo("Old Material", this.template2ID);
		var existedId;
		var createInfo = this.buildMaterialLightInfo("New Copy Material");
		var createdId;
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(existedInfo,
				function (response) {
					existedId = response.result;
					context.materialsIdsToClear.push(existedInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.copyMaterial(createInfo, existedInfo.name,
				function (response) {
					createdId = response.result;
					context.materialsIdsToClear.push(createInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(createInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMaterialInfo(response.result, createInfo);
					context.comparePropertiesFull(response.result.properties, existedInfo.properties);
					context.compareMaterialFields(response.result.fields, existedInfo.fields);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Material Async - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildMaterialInfo("Old Material", this.template2ID);
		var existedId;
		var createInfo = this.buildMaterialLightInfo("New Copy Material Async");
		var createdId;
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(existedInfo,
				function (response) {
					existedId = response.result;
					context.materialsIdsToClear.push(existedInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.copyMaterialAsync(createInfo, existedInfo.name,
				function (response) {
					createdId = response.result;
					equal(response.result.length, 36, "Material copied");
					context.materialsIdsToClear.push(createInfo.name);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Delete Material - by ID - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Create Material - for delete material by ID", this.template2ID);
		var materialId = this.anyGuid;
		materialInfo.ID = materialId;
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.deleteMaterial(materialId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(materialId,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Material - by Name - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var materialName = "Create Material - for delete material by ID";
		var materialInfo = this.buildMaterialInfo(materialName, this.template2ID);
		queue.enqueue(function (context) {
			envianceSdk.materials.createMaterial(materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.deleteMaterial(materialName,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(materialName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Material - Fault when Name doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materials.deleteMaterial("Wrong Name",
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Material - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materials.deleteMaterial(context.wrongGuid,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Material - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materials.deleteMaterial(context.materialDelete2ID,
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
	
	asyncTest("Update Material - Happy path", 26, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Name_Updated", this.template2Name);
		var id = this.material2ID;
		materialInfo.properties[3].valueHistory[0].value = 123;
		materialInfo.description = "Description_Updated";		
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(id, materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareMaterialInfo(response.result, materialInfo);
					context.comparePropertiesValues(response.result.properties, materialInfo.properties);
					context.compareMaterialFields(response.result.fields, materialInfo.fields);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update Material - add VBP, FBP, SFBP, TFBP - Happy path", 9, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialLightInfo("Name_Updated_properties");
		materialInfo.addProperty(this.TfbpID).addProperty(this.SfbpID).addProperty(this.PfbpID)
			.addProperty(this.MvbpID, [new envianceSdk.materials.MaterialPropertyValueHistoryInfo(null, beginDate, 5)]);
		var id = this.materialUpdate1ID;		
		materialInfo.description = "Description_Updated";
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(id, materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareMaterialInfo(response.result, materialInfo);
					context.comparePropertiesValues(response.result.properties, materialInfo.properties);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Material - remove all properties - Happy path", 23, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Name_Updated_3", this.template2Name);
		var id = this.materialUpdate2ID;
		materialInfo.properties = [];
		materialInfo.description = "Description_Updated";
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(id, materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareMaterialInfo(response.result, materialInfo);
					equal(response.result.properties === undefined, true, "properties is empty.");
					context.compareMaterialFields(response.result.fields, materialInfo.fields);
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material - set another template - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialLightInfo("Name_Updated_3", this.template3Name);
		var id = this.materialUpdate2ID;
		materialInfo.description = "Description_Updated";
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(id, materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareMaterialInfo(response.result, materialInfo);						
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material - remove template - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialLightInfo("Name_Updated_3");
		var id = this.materialUpdate2ID;
		materialInfo.description = "Description_Updated";
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(id, materialInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materials.getMaterial(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareMaterialInfo(response.result, materialInfo);
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Material - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialLightInfo("Name_Updated_properties");
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(context.wrongGuid, materialInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update Material - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialLightInfo("Name_Updated_properties");
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterial(context.materialDelete2ID, materialInfo,
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

	asyncTest("Update Material Async - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		var materialInfo = this.buildMaterialInfo("Name_Updated", this.template2Name);
		var id = this.material2ID;
		materialInfo.properties[3].valueHistory[0].value = 123;
		materialInfo.description = "Description_Updated";
		queue.enqueue(function (context) {
			envianceSdk.materials.updateMaterialAsync(id, materialInfo,
				function (response) {
					equal(response.result.length, 36, "Material updated");
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});


}

if (typeof (UnitTestsApplication) == "undefined") {
	executeMaterialsServiceTests();
}