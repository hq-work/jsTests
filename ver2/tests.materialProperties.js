if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'MaterialProperties', execute: executeMaterialPropertiesServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof materialPropertiesConfig == "undefined")
	materialPropertiesConfig = {};

function executeMaterialPropertiesServiceTests() {
	module("Material Properties Service", {
		setup: function () {

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (materialPropertiesConfig.noManageRightsUserName || "userWPermissionsMatProp") + qUnitDbSuffix;
			this.password = materialPropertiesConfig.password || "1111";
			this.propertiesIdsToClear = [];

			this.DataTypeNum = "Numeric";
			this.DataTypeBool = "Boolean";
			this.AVBP = "Value Based Activity";
			this.MVBP = "Value Based Material";
			this.SUV = "Specific Use Variable";			
			this.PFBP = "Formula Based Primary";
			this.SFBP = "Formula Based Secondary";
			this.TFBP = "Formula Based Tertiary";
			this.CLPFBP = "Chemical Formula Based Primary";
			this.CLSFBP = "Chemical Formula Based Secondary";
			this.CLTFBP = "Chemical Formula Based Tertiary";
			
			this.anyGuid = "074265D2-94FF-41EE-BF64-EAB31C54CB1D";
			this.anyGuid2 = "074265D2-94FF-41EE-BF64-EAB31C54CB1C";
			this.anyGuid3 = "074265D2-94FF-41EE-BF64-EAB31C54CB1E";

			this.GeneratedAVBP1Name = "AVBP - 1";
			this.GeneratedAVBP1ID = "08916b56-e4b7-4e71-8993-92951e7a6688";
			this.GeneratedMVBP1Name = "MVBP - 1";
			this.GeneratedSUV1Name = "SUV - 1";
			this.GeneratedPFBP1Name = "PFBP - 1";
			this.GeneratedSFBP1Name = "SFBP - 1";
			this.GeneratedTFBP1Name = "TFBP - 1";
			this.GeneratedCLPFBP1Name = "CLPFBP - 1";
			this.GeneratedCLSFBP1Name = "CLSFBP - 1";
			this.GeneratedCLTFBP1Name = "CLTFBP - 1";
			
			this.GeneratedAVBP2ID = "718c46f8-72ca-4b61-9f77-95c6e4a824dd";
			this.GeneratedMVBP2ID = "6803f79d-df22-4c56-9408-d8f9bdf2c2d5";
			this.GeneratedSUV2ID = "80a70d84-43cb-42bb-82e0-2f36b1435c8e";
			this.GeneratedPFBP2ID = "52f9ce02-0568-47b4-ad5c-51ad8b41420c";
			this.GeneratedSFBP2ID = "69800517-3528-4cfe-a64d-f1d2a0a8c21c";
			this.GeneratedTFBP2ID = "61391a6c-19f4-4edc-b0fc-1c0ff424d061";
			this.GeneratedCLPFBP2ID = "09f576ed-ef2f-4001-8c89-696def531403";
			this.GeneratedCLSFBP2ID = "cbca7ce9-f331-49bf-b8a7-c58d7977ec01";
			this.GeneratedCLTFBP2ID = "47654b0d-583a-46ac-a0e1-a3bd7e5a94c0";
			
			this.buildVBPPropertyInfo = function (name, propTtype, dataType) {
				return new envianceSdk.materialProperties.MaterialPropertyInfo(
						name, propTtype, "VBP Description", dataType);
			};
			
			var startDate1 = envianceSdk.IsoDate.parse("2015-03-06T00:00");
			this.StartDate1 = new Date(startDate1.getFullYear(), startDate1.getMonth(), startDate1.getDate(), 0, 0, 0);			
			var startDate2 = envianceSdk.IsoDate.parse("2015-05-06T00:00");
			this.StartDate2 = new Date(startDate2.getFullYear(), startDate2.getMonth(), startDate2.getDate(), 0, 0, 0);
			

			this.buildFBPPropertyInfo = function (name, propType) {
				return new envianceSdk.materialProperties.MaterialPropertyInfo(
						name, propType, "FBP Description", "Numeric")
					.addFormulaHistory(null, this.StartDate1, "1+1");
			};
					
			this.buildSUVInfo = function (name, type) {
				return new envianceSdk.materialProperties.MaterialPropertyInfo(
						name, type, "SUV Description", "Numeric", "");
			};	

			this.comparePropertyInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Desctiptions are equal");
				equal(actual.propertyType, expected.propertyType, "propertyType are equal");
				equal(actual.dataType, expected.dataType, "dataType are equal");				
			};
			
			this.compareFormulaHistory = function (actual, expected) {
				if (actual.length != expected.length) {
					throw new Error("Actual length " + actual.length + " doesn't match expected length " + expected.length);
				} else {
					for (var i = 0; i < actual.length; i++) {
						deepEqual(actual[i].beginDate, expected[i].beginDate, "beginDate " + i + " are equal");						
						deepEqual(actual[i].script, expected[i].script, "script " + i + " are equal");
					}
				}
			};
		},



		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var d = this.propertiesIdsToClear.length - 1 ; d >= 0;d-- ){
				envianceSdk.materialProperties.deleteMaterialProperty(this.propertiesIdsToClear[d],
					function () {
						start();
					}, this._errorHandler);
				stop();
			}
		},
		
		_errorHandler: function(response) {
			envianceSdk.configure({ sessionId: this.originalSessionId });
			var message = response.error ? response.error.message : "Error";
			ok(false, message);
			start();
		},

		_authenticate: function(queue, user) {
			queue.enqueue(function(context) {
				envianceSdk.authentication.authenticate(user, context.password,
					function() {
						queue.executeNext();
					},
					context._errorHandler);
			});
		}
	});

	asyncTest("Create Material Property AVBP - Numeric - Happy path", 6, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildVBPPropertyInfo("Create AVBP Property - Numeric - Happy path", this.AVBP, this.DataTypeNum);		
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property AVBP - Boolean - Happy path", 6, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildVBPPropertyInfo("Create AVBP Property - Boolean - Happy path", this.AVBP, this.DataTypeBool);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property AVBP - Numeric - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("Create AVBP Property - Numeric - Happy path", this.AVBP, this.DataTypeNum);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property AVBP - Boolean - Happy path", 6, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildVBPPropertyInfo("Create AVBP Property - Boolean - Happy path", this.AVBP, this.DataTypeBool);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property AVBP - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("", this.AVBP, this.DataTypeNum);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property AVBP - Fault when name already exist", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo(this.GeneratedAVBP1Name, this.AVBP, this.DataTypeNum);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Property MVBP - Numeric - Happy path ", 6, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildVBPPropertyInfo("Create MVBP Property - numeric- Happy path", this.MVBP, this.DataTypeNum);		
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");										
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);					
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property (MVBP) - Fault when create by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("Create MVBP Property - numeric- Fault when create by user without right", this.MVBP, this.DataTypeNum);
		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property MVBP - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("", this.MVBP, this.DataTypeNum);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property MVBP - Fault when name already exist", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo(this.GeneratedMVBP1Name, this.MVBP, this.DataTypeNum);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SUV - Happy path - Check warnings", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildSUVInfo("Create SUV Property - Happy path - Check warnings", this.SUV);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property SUV - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildSUVInfo("", this.SUV);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SUV - Fault when name already exist", 2, function () {
		var queue = new ActionQueue(this);		
		var propertyInfo = this.buildSUVInfo(this.GeneratedSUV1Name, this.SUV);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SUV - Fault uniqueTag already exist", 3, function () {
		var queue = new ActionQueue(this);
		
		var propertyInfo = this.buildSUVInfo("TEMP SUV Property - (Fault uniqueTag already exist)", this.SUV);
		var propertyInfo2 = this.buildSUVInfo("Create SUV Property - Fault uniqueTag already exist", this.SUV);		
		var propertyId = this.anyGuid3;
		propertyInfo.ID = propertyId;
		propertyInfo.uniqueTag = "uTag";
		propertyInfo2.uniqueTag = "uTag";
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);													  
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo2,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Property PFBP - Happy path - Check warnings", 8, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create PFBP Property - Happy path - Check warnings", this.PFBP);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property PFBP - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("", this.PFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property PFBP - Fault when name already exist", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo(this.GeneratedPFBP1Name, this.PFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property PFBP - Fault when without history record", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create PFBP Property - Fault when without history", this.PFBP);
		propertyInfo.formulaHistory = [];
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Property PFBP - Fault when history record without date", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create PFBP Property - Fault when history without date", this.PFBP);
		propertyInfo.formulaHistory = [];
		propertyInfo.addFormulaHistory(null, null, "1+1");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Create Material Property PFBP - Fault when wrong property name in script", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create PFBP Property - Fault when wrong property name in script", this.PFBP);
		propertyInfo.formulaHistory[0].Script="1+[WrongPropertyName]";
		
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Happy path - Check warnings", 8, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP Property - Happy path - Check warnings", this.SFBP);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("", this.SFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when name already exist", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo(this.GeneratedSFBP1Name, this.SFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when without history record", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP Property - Fault when without history", this.SFBP);
		propertyInfo.formulaHistory = [];
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when history record without date", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP Property - Fault when history without date", this.SFBP);
		propertyInfo.formulaHistory = [];
		propertyInfo.addFormulaHistory(null, null, "1+1");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when wrong property name in script", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP Property - Fault when wrong property name in script", this.SFBP);
		propertyInfo.formulaHistory[0].Script = "1+[WrongPropertyName]";

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - with PFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP Property - Happy path - Check warnings", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_PFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - with SFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP Property - SFBP in formula", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_SFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - with explicit chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP - chem in formula", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_AliasMProp1_MW]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property SFBP - with all chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP - all chem in formula", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + SUM([Chem_MW])");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - with UDF in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP - UDF in formula", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Udf_XLS_kio_num_txtbox]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when wrong chem in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP - wrong chem in formula", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_WRONGNAME_MW]");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property SFBP - Fault when wrong udf in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create SFBP - wrong udf in formula", this.SFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Udf_WRONGNAME]");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Happy path - Check warnings", 8, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - Happy path - Check warnings", this.TFBP);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
	});

	queue.enqueue(function (context) {
		envianceSdk.materialProperties.getMaterialProperty(propertyId,
			function (response) {
				equal(response.metadata.statusCode, 200, "Status code OK");
				context.comparePropertyInfo(response.result, propertyInfo);
				context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
				start();
			}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("", this.TFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when name already exist", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo(this.GeneratedSFBP1Name, this.TFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when without history record", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - Fault when without history", this.TFBP);
		propertyInfo.formulaHistory = [];
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when history record without date", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - Fault when history without date", this.TFBP);
		propertyInfo.formulaHistory = [];
		propertyInfo.addFormulaHistory(null, null, "1+1");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when wrong property name in script", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - Fault when wrong property name in script", this.TFBP);
		propertyInfo.formulaHistory[0].Script = "1+[WrongPropertyName]";

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when non exist Property in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - Fault when non exist prop", this.TFBP);
		propertyInfo.formulaHistory[0].Script = "1+[Prop_WRONGNAME]";

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
		
	asyncTest("Create Material Property TFBP - with PFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - Happy path - Check warnings", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_PFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - with TFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP Property - TFBP in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_TFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Material Property TFBP - with explicit chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP - chem in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_AliasMProp1_MW]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - with all chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP - all chem in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + SUM([Chem_MW])");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - with UDF in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP - UDF in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Udf_XLS_kio_num_txtbox]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when wrong chem in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP - wrong chem in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_WRONGNAME_MW]");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property TFBP - Fault when wrong udf in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create TFBP - wrong udf in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Udf_WRONGNAME]");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	


	asyncTest("Create Material Property CLPFBP - Happy path - Check warnings", 8, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLPFBP Property - Happy path - Check warnings", this.CLPFBP);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLPFBP - Fault when without name", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("", this.CLPFBP);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property CLSFBP - Happy path - Check warnings", 8, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLSFBP Property - Happy path - Check warnings", this.CLSFBP);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLSFBP - with PFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLSFBP Property - Happy path - Check warnings", this.CLSFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_PFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLSFBP - with SFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLSFBP Property - SFBP in formula", this.CLSFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_SFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLSFBP - with explicit chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLSFBP - chem in formula", this.CLSFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_AliasMProp1_MW]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLSFBP - with all chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLSFBP - all chem in formula", this.CLSFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + SUM([Chem_MW])");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLSFBP - Fault when wrong chem in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create CLSFBP - wrong chem in formula", this.CLSFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_WRONGNAME_MW]");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - Happy path - Check warnings", 8, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP Property - Happy path - Check warnings", this.CLTFBP);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - Fault when without history record", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP Property - Fault when without history", this.CLTFBP);
		propertyInfo.formulaHistory = [];
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - Fault when non exist Property in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP Property - Fault when non exist prop", this.CLTFBP);
		propertyInfo.formulaHistory[0].Script = "1+[Prop_WRONGNAME]";

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - with PFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP Property - Happy path - Check warnings", this.CLTFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_PFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - with TFBP in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP Property - TFBP in formula", this.CLTFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [Prop_TFBP - 1]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - with explicit chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP - chem in formula", this.CLTFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_AliasMProp1_MW]");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - with all chemical in formula - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP - all chem in formula", this.TFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + SUM([Chem_MW])");
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.propertiesIdsToClear.push(propertyId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(propertyId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.comparePropertyInfo(response.result, propertyInfo);
					context.compareFormulaHistory(response.result.formulaHistory, propertyInfo.formulaHistory);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Material Property CLTFBP - Fault when wrong chem in formula", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Create CLTFBP - wrong chem in formula", this.CLTFBP);
		propertyInfo.addFormulaHistory(null, this.StartDate2, "1 + [ChemExp_WRONGNAME_MW]");
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(propertyInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});
	

	asyncTest("Create Material Property Async - (AVBP, Numeric) - Happy path", 1, function () {
		var queue = new ActionQueue(this);

		var propertyInfo = this.buildVBPPropertyInfo("Create AVBP Property Async - Numeric - Happy path", this.AVBP, this.DataTypeNum);
		var propertyId = this.anyGuid;
		propertyInfo.ID = propertyId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialPropertyAsync(propertyInfo,
				function (response) {
					equal(response.result.length, 36, "Material property created");
					context.propertiesIdsToClear.push(propertyId);
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	
	asyncTest("Get Material Property - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(context.GeneratedAVBP1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get Material Property - Happy path - By Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(context.GeneratedAVBP1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Material Property - Fault user has no rights", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(context.GeneratedAVBP1Name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Material Property - Fault if invalid Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty("wrong name",
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Material Property AVBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("Update AVBP Property - Happy path", this.AVBP, this.DataTypeNum);
		var id = this.GeneratedAVBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");					
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material Property MVBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("Update MVBP Property - Happy path", this.MVBP, this.DataTypeNum);
		var id = this.GeneratedMVBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Material Property SUV - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildSUVInfo("Update SUV - Happy path", this.SUV);
		var id = this.GeneratedSUV2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material Property PFBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update PFBP - Happy path", this.PFBP);
		var id = this.GeneratedPFBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material Property SFBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update SFBP - Happy path", this.SFBP);
		var id = this.GeneratedSFBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material Property TFBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update TFBP - Happy path", this.TFBP);
		var id = this.GeneratedTFBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Update Material Property Async (AVBP) - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildVBPPropertyInfo("Update AVBP Property Async - Happy path", this.AVBP, this.DataTypeNum);
		var id = this.GeneratedAVBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialPropertyAsync(id, propertyInfo,
				function (response) {
					equal(response.result.length, 36, "Material property updated");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Material Property CLPFBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update CLPFBP - Happy path", this.CLPFBP);
		var id = this.GeneratedCLPFBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Material Property CLSFBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update CLSFBP - Happy path", this.CLSFBP);
		var id = this.GeneratedCLSFBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Material Property CLTFBP - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update CLTFBP - Happy path", this.CLTFBP);
		var id = this.GeneratedCLTFBP2ID;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.comparePropertyInfo(response.result, propertyInfo);
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	
	asyncTest("Update Material Property - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		var propertyInfo = this.buildFBPPropertyInfo("Update TFBP - Happy path", this.TFBP);
		var id = this.GeneratedTFBP2ID;
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.updateMaterialProperty(id, propertyInfo,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Material Property - by ID - Happy Path", 2, function () {
		var queue = new ActionQueue(this);		
		var existedInfo = this.buildVBPPropertyInfo("Material Property For Copy by Name", this.AVBP, this.DataTypeNum);
		var existedId = this.anyGuid;
		existedInfo.ID = existedId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.deleteMaterialProperty(existedId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Delete Material Property - by Name - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var existedName = "Material Property For Copy by Name";
		var existedInfo = this.buildVBPPropertyInfo(existedName, this.AVBP, this.DataTypeNum);
		var existedId = this.anyGuid;
		existedInfo.ID = existedId;
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.deleteMaterialProperty(existedName,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					start();
				}, context._errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Delete Material Property - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.deleteMaterialProperty(envianceSdk.getSessionId(),
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Material Property - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.deleteMaterialProperty(envianceSdk.getSessionId(),
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Delete Material Property - Fault when Name is wrong", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.deleteMaterialProperty("WRONG NAME",
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Copy Material Property (AVBP) - by ID - Happy path", 7, function () {
		var queue = new ActionQueue(this);		
		var existedInfo = this.buildVBPPropertyInfo("Material Property For Copy by Name", this.AVBP, this.DataTypeNum);
		var existedId = this.anyGuid;
		existedInfo.ID = existedId;
		var copyInfo = this.buildVBPPropertyInfo("New Name for Copy", this.AVBP, this.DataTypeNum);
		delete copyInfo.description;
		var createdId = this.anyGuid2;
		copyInfo.ID = createdId;

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.copyMaterialProperty(copyInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.propertiesIdsToClear.push(createdId);
					context.propertiesIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, copyInfo.name, "Names are equal");
					equal(response.result.description, existedInfo.description, "Description are equal");
					equal(response.result.propertyType, existedInfo.propertyType, "Property Type are equal");
					equal(response.result.dataType, existedInfo.dataType, "Data Type are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Material Property (AVBP) - by Name - Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var existedName = "Material Property For Copy by Name";		
		var existedInfo = this.buildVBPPropertyInfo(existedName, this.AVBP, this.DataTypeNum);
		var existedId = this.anyGuid;
		existedInfo.ID = existedId;
		var copyInfo = this.buildVBPPropertyInfo("New Name for Copy", this.AVBP, this.DataTypeNum);
		delete copyInfo.description;
		var createdId = this.anyGuid2;
		copyInfo.ID = createdId;

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.copyMaterialProperty(copyInfo, existedName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.propertiesIdsToClear.push(createdId);
					context.propertiesIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, copyInfo.name, "Names are equal");
					equal(response.result.description, existedInfo.description, "Description are equal");
					equal(response.result.propertyType, existedInfo.propertyType, "Property Type are equal");
					equal(response.result.dataType, existedInfo.dataType, "Data Type are equal");					
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Material Property (SUV) - by ID - Happy path", 7, function () {
		var queue = new ActionQueue(this);		
		var existedInfo = this.buildSUVInfo("Material Property For Copy by Name", this.SUV);
		var existedId = this.anyGuid;
		existedInfo.ID = existedId;
		var copyInfo = this.buildSUVInfo("New Name for Copy", this.SUV);
		delete copyInfo.description;
		var createdId = this.anyGuid2;
		copyInfo.ID = createdId;

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.copyMaterialProperty(copyInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.propertiesIdsToClear.push(createdId);
					context.propertiesIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.getMaterialProperty(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, copyInfo.name, "Names are equal");
					equal(response.result.description, existedInfo.description, "Description are equal");
					equal(response.result.propertyType, existedInfo.propertyType, "Property Type are equal");
					equal(response.result.dataType, existedInfo.dataType, "Data Type are equal");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Copy Material Property Async (SUV) - by ID - Happy path", 2, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildSUVInfo("Material Property For Copy Async", this.SUV);
		var existedId = this.anyGuid;
		existedInfo.ID = existedId;
		var copyInfo = this.buildSUVInfo("New Name for Copy", this.SUV);
		delete copyInfo.description;
		var createdId = this.anyGuid2;
		copyInfo.ID = createdId;

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.createMaterialProperty(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialProperties.copyMaterialPropertyAsync(copyInfo, existedId,
				function (response) {
					equal(response.result.length, 36, "Material property copied");
					context.propertiesIdsToClear.push(createdId);
					context.propertiesIdsToClear.push(existedId);
					start();
				}, context._errorHandler);
		});
		
		queue.executeNext();
	});
	
	asyncTest("Copy Material Property - by ID - Fault when ID not exist", 2, function () {
		var queue = new ActionQueue(this);
		var copyInfo = this.buildVBPPropertyInfo("Copy Material Property - Fault by ID", this.AVBP, this.DataTypeNum);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.copyMaterialProperty(copyInfo, envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Copy Material Property - by Name - Fault when Name not exist", 2, function () {
		var queue = new ActionQueue(this);
		var copyInfo = this.buildVBPPropertyInfo("Copy Material Property - Fault by Name", this.AVBP, this.DataTypeNum);
		queue.enqueue(function (context) {
			envianceSdk.materialProperties.copyMaterialProperty(copyInfo, "WRONG NAME",
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
	executeMaterialPropertiesServiceTests();
}