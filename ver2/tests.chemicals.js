if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Chemical', execute: executeChemicalServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof chemicalsConfig == "undefined")
	chemicalsConfig = {};

function executeChemicalServiceTests() {
	module("Chemical Service", {
		setup: function() {						
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (chemicalsConfig.noManageRightsUserName || "userWPermissionsChemical") + qUnitDbSuffix;
			this.password = chemicalsConfig.password || "1111";

			this.name = "Chemical Name";
			this.casNum = "0";
			this.alias = "Alias3";
			this.description = "Chemical Description";

			this.anyGuid = "bab4e72f-dfc5-4a0a-90dc-f551b58664ba";
			
			this.chemical1ID = "f31f7d89-bfe1-4b86-b025-351d23a6fea7";
			this.existed1Name = "Chemical";
			this.existed1CasNum = "0";
			this.existed1Alias = "Alias";
			this.existed1Description = "Chemical Description";

			this.chemical2ID = "f5c8d2ae-f8ee-445b-858d-81e2a5a5d480";
			this.existed2Name = "Chemical2";
			this.existed2CasNum = "111111-11-1";
			this.existed2Alias = "Alias2";
		
			this.createName = "Crt Name";
			this.createCasNum = "222222-22-2";
			this.createAlias = "Crt Alias";
			this.createDescription = "Crt Description";
			
			this.updateName = "Upd Name";
			this.updateCasNum = "333333-33-3";
			this.updateAlias = "Upd Alias";
			this.updateDescription = "Upd Description";
			
			this.copyName = "Copy Name";
			this.copyCasNum = "444444-44-4";
			this.copyAlias = "Copy Alias";
			this.copyDescription = "Copy Description";

			this.deleteID = "1af35864-b39f-4d98-a0b7-02c717cce61b";
			this.standardChemName = "ChemicalForDelete3";
			
			this.histItemID1  = "ed61c6a0-6b4a-481f-bf79-7e70bb5f0dd8";
			this.histItemID12 = "339fb690-5941-491b-8934-9c65cccdd8f3";
			this.histItemID2 = "0c6b73d9-db7d-40b7-b510-6b1264215885";
			this.histItemID21 = "e85456a6-d8ff-4ff8-8d0e-1d9db7cd3720";
			this.histItemID3  = "6df13d64-f549-4038-a199-418f83bb0cee";

			this.chemicalInMaterialId = "6D1B7D6E-F939-45C3-9E3A-C4C74456F2D8";
			this.chemicalInMaterialDescription = "Chemical FMWCH Description";
			this.chemicalInMaterialName = "Chemical for MaterialWithChemical";
			this.chemicalInMaterialAlias = "CfMwch";
			this.chemicalInMaterialCasNum = "0";
			
			this.chemicalIdsToClear = [];
			
			this.buildHistoryItemInfo1 = function () {
				return new envianceSdk.chemicals.ChemicalHistoryItemInfo(envianceSdk.IsoDate.parse("2010-12-08T00:00:00"),
					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
					false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false);
			};
			
			this.buildHistoryItemInfo12 = function () {
				return new envianceSdk.chemicals.ChemicalHistoryItemInfo(envianceSdk.IsoDate.parse("2012-12-08T00:00:00"),
					0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
					false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false);
			};			
			this.buildHistoryItemInfo2 = function () {
				return new envianceSdk.chemicals.ChemicalHistoryItemInfo(envianceSdk.IsoDate.parse("2011-12-08T00:00:00"),
					1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
					true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true);
			};
			this.buildHistoryItemInfo21 = function () {
				return new envianceSdk.chemicals.ChemicalHistoryItemInfo(envianceSdk.IsoDate.parse("2012-12-08T00:00:00"),
					1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
					true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true);
			};
			this.buildHistoryItemInfo3 = function () {
				return new envianceSdk.chemicals.ChemicalHistoryItemInfo(envianceSdk.IsoDate.parse("2013-12-08T00:00:00"),
					1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
					true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true);
			};

			this.hist1 = this.buildHistoryItemInfo1();
			this.hist12 = this.buildHistoryItemInfo12();
			this.hist2 = this.buildHistoryItemInfo2();
			this.hist21 = this.buildHistoryItemInfo21();
			this.hist3 = this.buildHistoryItemInfo3();
			
			this.buildChemicalInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.name, this.casNum, this.alias, this.description).addHistoryItem(this.hist1);
			};			
			this.buildEmptyChemicalInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.name, this.casNum, this.alias, this.description).addHistoryItem(this.hist2);
			};			
			this.buildCreateChemicalInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.createName, this.createCasNum, this.createAlias, this.createDescription).addHistoryItem(this.hist3);
			};
			this.buildUpdateChemicalInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.updateName, this.updateCasNum, this.updateAlias, this.updateDescription);
			};
			this.buildUpdateChemicalInMaterialInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.chemicalInMaterialName, this.chemicalInMaterialCasNum, this.chemicalInMaterialAlias, this.chemicalInMaterialDescription).addHistoryItem(this.hist1);
			};
			this.buildCopyChemicalInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.copyName, this.copyCasNum, this.copyAlias, this.copyDescription);
			};
			
			this.buildExisted1ChemicalInfo = function () {
				return new envianceSdk.chemicals.ChemicalInfo(
					this.existed1Name, this.existed1CasNum, this.existed1Alias, this.existed1Description).addHistoryItem(this.hist1).addHistoryItem(this.hist12);
			};

			this.compareChemicalInfo = function(actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Description are equal");
				equal(actual.casNum, expected.casNum, "Cas Number are equal");
				equal(actual.alias, expected.alias, "Alias are equal");				
				deepEqual(actual.historyItems, expected.historyItems, "HistoryItems are equal");
			};			
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var i = 0; i < this.chemicalIdsToClear.length;i++){
				stop();
				envianceSdk.chemicals.deleteChemical(this.chemicalIdsToClear[i],
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
	

	asyncTest("Create Chemical - Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		var chemicalId;
		queue.enqueue(function(context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalId = response.result;
					context.chemicalIdsToClear.push(chemicalId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(chemicalId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					context.compareChemicalInfo(response.result, chemicalInfo);
					start();
				}, context._errorHandler);
		});
		
		this._start(queue);

	});

	asyncTest("Create Chemical without description - Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		var chemicalId;
		chemicalInfo.description = "";		
		queue.enqueue(function(context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalId = response.result;
					context.chemicalIdsToClear.push(chemicalId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(chemicalId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalInfo(response.result, chemicalInfo);
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when empty name", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.name = "";
		queue.enqueue(function (context) {			
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});		
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when empty CAS number", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.casNum = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when empty alias", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.alias = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when name with \/ symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.name = "part1\/part2";
		queue.enqueue(function (context) {			
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when name with \\ symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.name = "part1\\part2";
		queue.enqueue(function (context) {			
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when name with [ symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.name = "part1[part2";
		queue.enqueue(function (context) {			
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when name with ] symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.name = "part1]part2";
		queue.enqueue(function (context) {			
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when Name and CasNum already exists", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.name = this.existed1Name;
		chemicalInfo.casNum = this.existed1CasNum;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when CasNum is incorrect", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.casNum = "123456789012";
		queue.enqueue(function (context) {						
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when Mathematical alias already exists", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildCreateChemicalInfo();
		chemicalInfo.alias = this.existed1Alias;		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					context.chemicalIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when invalid Begin Date", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.beginDate = "date string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when duplicate Begin Date", 2, function () {
		var queue = new ActionQueue(this);		
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(this.hist1).addHistoryItem(this.hist1);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when invalid Mol Wt value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.mw = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});	

	asyncTest("Create Chemical - Fault when invalid Antoine A value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antA = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when invalid Antoine B value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antB = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when invalid Antoine C value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antC = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when invalid Antoine A (K) value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antAk = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical - Fault when invalid Antoine B (K) value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antBk = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when invalid VP @ 60F value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.vp60 = "bad string";
		var chemicalInfo = this.buildEmptyChemicalInfo().addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical - Fault when create by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildChemicalInfo();
		
		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.chemicalIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Copy Chemical - Happy path", 8, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildCreateChemicalInfo();
		var existedId;
		var createInfo = this.buildCopyChemicalInfo();
		delete createInfo.description;
		delete createInfo.historyItems;
		var createdId;

		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					existedId = response.result;
					context.chemicalIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicals.copyChemical(createInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					createdId = response.result;
					context.chemicalIdsToClear.push(createdId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");

					equal(response.result.description, existedInfo.description, "Description are equal");
					equal(response.result.historyItems.length, existedInfo.historyItems.length, "HistoryItems count are equal");
					equal(response.result.name, createInfo.name, "Names are equal");
					equal(response.result.casNum, createInfo.casNum, "Cas Number are equal");
					equal(response.result.alias, createInfo.alias, "Alias are equal");
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Get Chemical - by ID - Happy path", 6, function () {

		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildExisted1ChemicalInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(context.chemical1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalInfo(response.result, chemicalInfo);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});

	asyncTest("Get Chemical - by Alias - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildExisted1ChemicalInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(context.existed1Alias,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalInfo(response.result, chemicalInfo);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});

	asyncTest("Get Chemical - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Get Chemical - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(idOrAlias,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					equal(response.result.name, chemicalInfo.name, "Names are equal");
					equal(response.result.description, chemicalInfo.description, "Description are equal");
					equal(response.result.casNum, chemicalInfo.casNum, "Cas Number are equal");
					equal(response.result.alias, chemicalInfo.alias, "Alias are equal");					
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Update Chemical - set name of already existing Chemical - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = this.existed2Name;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});
		
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Fault when change chemical history and chemical used in material", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInMaterialInfo();
		var idOrAlias = this.chemicalInMaterialId;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");					
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when set name of already existing Chemical and CAS number", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = this.existed1Name;
		chemicalInfo.casNum = this.existed1CasNum;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when set empty name", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Fault when set name with / symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = "part1/part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Fault when set name with \\ symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = "part1\\part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when set name with [ symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = "part1[part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Fault when set name with ] symbol", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.name = "part1]part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Fault when set name of already existing Mathematical Alias", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		chemicalInfo.alias = this.existed1Alias;		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Begin Date", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.beginDate = "date string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Mol Wt value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.mw = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Antoine A value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antA = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Antoine B value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antB = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Antoine C value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antC = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Antoine A (K) value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antAk = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when invalid Antoine B (K) value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.antBk = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - Fault when invalid VP @ 60F value", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.hist1;
		histItem.vp60 = "bad string";
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(histItem);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical - update history items - Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo().addHistoryItem(this.hist1);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicals.getChemical(idOrAlias,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, chemicalInfo.name, "Names are equal");
					equal(response.result.description, chemicalInfo.description, "Description are equal");
					equal(response.result.casNum, chemicalInfo.casNum, "Cas Number are equal");
					equal(response.result.alias, chemicalInfo.alias, "Alias are equal");
					deepEqual(response.result.historyItems, chemicalInfo.historyItems, "HistoryItems are equal");
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update Chemical - Fault when update by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		this._authenticate(queue, this.noManageRightsUserName);
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemical(idOrAlias, chemicalInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.chemicalIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical Async - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalInfo = this.buildUpdateChemicalInfo();
		var idOrAlias = this.chemical2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.updateChemicalAsync(idOrAlias, chemicalInfo,
				function (response) {
					equal(response.result.length, 36, "Chemical updated");
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Delete Chemical - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		
		var chemicalInfo = this.buildCreateChemicalInfo();
		var chemicalId;
		queue.enqueue(function (context) {
			envianceSdk.chemicals.createChemical(chemicalInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalId = response.result;					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicals.deleteChemical(chemicalId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					context.chemicalIdsToClear.push(chemicalId);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Delete Chemical - Fault when chemical is standard", 1, function () {
		var queue = new ActionQueue(this);		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.deleteChemical(context.standardChemName,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");					
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Delete Chemical - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);		
		queue.enqueue(function (context) {
			envianceSdk.chemicals.deleteChemical(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Delete Chemical - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicals.deleteChemical(context.deleteID,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});

}

if (typeof (UnitTestsApplication) == "undefined") {
	executeChemicalServiceTests();
}