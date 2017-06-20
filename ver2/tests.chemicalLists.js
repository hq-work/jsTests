if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'ChemicalList', execute: executeChemicalListServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof chemicalListsConfig == "undefined")
	chemicalListsConfig = {};

function executeChemicalListServiceTests() {
	module("Chemical List Service", {
		setup: function() {						
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (chemicalListsConfig.noManageRightsUserName || "userWPermissionsChemList") + qUnitDbSuffix;
			this.password = chemicalListsConfig.password || "1111";

			this.name = "Chemical List Name";
			this.description = "Chemical List Description";

			this.anyGuid = "1ee6c790-ea0c-4d14-806a-8caa79c3f0b5";


			this.chemicalList1ID = "182b9153-8b9f-4c7c-8601-2eccab2a8a32";
			this.chemicalList1Name = "ChemicalList1";
			
			this.chemicalList2ID = "32933379-2136-4a94-b400-8212e6d18607";
			this.chemicalList2Name = "ChemicalList2";
			
			this.chemical1ID = "f31f7d89-bfe1-4b86-b025-351d23a6fea7";
			this.chemical2ID = "f5c8d2ae-f8ee-445b-858d-81e2a5a5d480";
			this.chemical3ID = "1af35864-b39f-4d98-a0b7-02c717cce61b";			
			
			this.existedName = "ChemicalList1";
			this.existedDescription = "Chemical List 1 Description";
		
			this.createName = "Crt Name";
			this.createDescription = "Crt Description";
			
			this.updateName = "Upd Name";
			this.updateDescription = "Upd Description";
			
			this.copyName = "Copy Name";
			this.copyDescription = "Copy Description";

			this.deleteID2 = "9bdd3523-623d-4da4-ac1f-378ead25f5ba";
						
			this.listIdsToClear = [];
				
			var xdate2010 = envianceSdk.IsoDate.parse("2010-12-08T00:00:00");
			this.beginDate10 = new Date(xdate2010.getFullYear(), xdate2010.getMonth(), xdate2010.getDate(), 0, 0, 0);
			
			var xdate2011 = envianceSdk.IsoDate.parse("2011-12-08T00:00:00");
			this.beginDate11 = new Date(xdate2011.getFullYear(), xdate2011.getMonth(), xdate2011.getDate(), 10, 30, 0);

			this.buildChemicalListInfo = function (name) {
				var histItems = [];
				var histItem = new envianceSdk.chemicallists.ChemicalHistoryItemInfo(this.beginDate11).addLimit(this.chemical1ID, 1);
				histItems.push(histItem);
				return new envianceSdk.chemicallists.ChemicalListInfo(name, this.description, histItems);
			};

			this.buildHistoryItemLimit = function (idOrAlias, limit) {
				return new envianceSdk.chemicallists.ChemicalHistoryLimitInfo(idOrAlias, limit);
			};

			this.buildHistoryItem = function (beginDate, limits) {
				return new envianceSdk.chemicallists.ChemicalHistoryItemInfo(beginDate, limits);
			};

			this.buildEmptyChemicalListInfo = function() {
				return new envianceSdk.chemicallists.ChemicalListInfo(this.name, this.description);
			};
			
			this.buildUpdateChemicalListInfo = function () {
				return new envianceSdk.chemicallists.ChemicalListInfo(this.updateName, this.updateDescription);
			};
			
			this.buildCopyChemicalListInfo = function () {
				return new envianceSdk.chemicallists.ChemicalListInfo(this.copyName, this.copyDescription);
			};
			
			this.buildExistedChemicalListInfo = function () {
				var histItems = [];
				var histItem = new envianceSdk.chemicallists.ChemicalHistoryItemInfo(this.beginDate10).addLimit(this.chemical1ID, 3);
				histItems.push(histItem);
				return new envianceSdk.chemicallists.ChemicalListInfo(this.existedName, this.existedDescription, histItems);
			};
		
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var i = 0; i < this.listIdsToClear.length;i++ ) {
				stop();
				envianceSdk.chemicallists.deleteChemicalList(this.listIdsToClear[i],
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
	
	asyncTest("Create Chemical List - Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List");
		var chemicalListId;
		queue.enqueue(function(context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalListId = response.result;
					context.listIdsToClear.push(chemicalListId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(chemicalListId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, chemicalListInfo.name, "Names are equal");
					equal(response.result.description, chemicalListInfo.description, "Description are equal");
					equal(response.result.chemicalListHistoryItems.length, 1, "HistoryItems count are equal 1");
					deepEqual(response.result.chemicalListHistoryItems[0].beginDate, chemicalListInfo.chemicalListHistoryItems[0].beginDate, "HistoryItem BeginDate are equal");
					deepEqual(response.result.chemicalListHistoryItems[0].limits, chemicalListInfo.chemicalListHistoryItems[0].limits, "HistoryItem Limit are equal");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Create Chemical List - without description - Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List wout desc");
		var chemicalListId;
		chemicalListInfo.description = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalListId = response.result;
					context.listIdsToClear.push(chemicalListId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(chemicalListId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, chemicalListInfo.name, "Names are equal");
					equal(response.result.description, chemicalListInfo.description, "Description are equal");					
					equal(response.result.chemicalListHistoryItems.length, 1, "HistoryItems count are equal 1");
					deepEqual(response.result.chemicalListHistoryItems[0].beginDate, chemicalListInfo.chemicalListHistoryItems[0].beginDate, "HistoryItem BeginDate are equal");
					deepEqual(response.result.chemicalListHistoryItems[0].limits, chemicalListInfo.chemicalListHistoryItems[0].limits, "HistoryItem Limit are equal");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when empty name", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List empty name");
		chemicalListInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical List - Fault when name with \/ symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List bad symbol");
		chemicalListInfo.name = "part1\/part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct" + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when name with \\ symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List bad symbol");
		chemicalListInfo.name = "part1\\part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct" + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when name with [ symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List bad symbol");
		chemicalListInfo.name = "part1[part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct" + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when name with ] symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List bad symbol");
		chemicalListInfo.name = "part1]part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct" + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when invalid date in History Item", 1, function () {
		var queue = new ActionQueue(this);		
		var histItem = this.buildHistoryItem(this.beginDate11).addLimit(this.chemical1ID, 1);
		histItem.beginDate = "badstring";
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List invalid history").addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct" + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when invalid limit in History Item Limit", 1, function () {
		var queue = new ActionQueue(this);
		var histItem = this.buildHistoryItem(this.beginDate11).addLimit(this.chemical3ID, "badnumber");
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List invalid limit").addHistoryItem(histItem);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct" + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when create with empty History", 2, function () {
		var queue = new ActionQueue(this);		
		var chemicalListInfo = this.buildEmptyChemicalListInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct" + response.error.message);
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when create with empty Item Limit", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildEmptyChemicalListInfo();
		var emptyhistory = new envianceSdk.chemicallists.ChemicalHistoryItemInfo(this.beginDate11);
		chemicalListInfo.addHistoryItem(emptyhistory);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct" + response.error.message);
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical List - Fault when create by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildChemicalListInfo("Create Chemical List wout right");
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.listIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Copy Chemical List - Happy path", 8, function () {
		var queue = new ActionQueue(this);
		
		var existedInfo = this.buildChemicalListInfo("Copy Chemical List");
		var existedId;
		var createInfo = this.buildCopyChemicalListInfo();
		var createdId;

		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					existedId = response.result;
					context.listIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicallists.copyChemicalList(createInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					createdId = response.result;
					context.listIdsToClear.push(createdId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, createInfo.name, "Names are equal");
					equal(response.result.description, createInfo.description, "Description are equal");
					equal(response.result.chemicalListHistoryItems.length, 1, "HistoryItems count are equal 1");
					deepEqual(response.result.chemicalListHistoryItems[0].beginDate, existedInfo.chemicalListHistoryItems[0].beginDate, "HistoryItem BeginDate are equal");
					deepEqual(response.result.chemicalListHistoryItems[0].limits, existedInfo.chemicalListHistoryItems[0].limits, "HistoryItem Limit are equal");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Get Chemical List - by ID - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildExistedChemicalListInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(context.chemicalList1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");

					equal(response.result.name, chemicalListInfo.name, "Names are equal");
					equal(response.result.description, chemicalListInfo.description, "Description are equal");
					equal(response.result.chemicalListHistoryItems.length, 1, "HistoryItems count are equal 1");
					deepEqual(response.result.chemicalListHistoryItems[0].beginDate, chemicalListInfo.chemicalListHistoryItems[0].beginDate, "HistoryItem BeginDate are equal");
					deepEqual(response.result.chemicalListHistoryItems[0].limits, chemicalListInfo.chemicalListHistoryItems[0].limits, "HistoryItem Limit are equal");

					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Get Chemical List - by Name - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildExistedChemicalListInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(context.chemicalList1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");

					equal(response.result.name, chemicalListInfo.name, "Names are equal");
					equal(response.result.description, chemicalListInfo.description, "Description are equal");
					equal(response.result.chemicalListHistoryItems.length, 1, "HistoryItems count are equal 1");
					deepEqual(response.result.chemicalListHistoryItems[0].beginDate, chemicalListInfo.chemicalListHistoryItems[0].beginDate, "HistoryItem BeginDate are equal");
					deepEqual(response.result.chemicalListHistoryItems[0].limits, chemicalListInfo.chemicalListHistoryItems[0].limits, "HistoryItem Limit are equal");

					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Get Chemical List - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Get Chemical List - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical List - (add historyItem) Happy path", 9, function () {
		var queue = new ActionQueue(this);
		var listIdOrName = this.chemicalList2ID;
		var histItem = this.buildHistoryItem(this.beginDate10).addLimit(this.chemical1ID, 10);
		var histItem2 = this.buildHistoryItem(this.beginDate11).addLimit(this.chemical2ID, 12);
		var chemicalListInfo = this.buildUpdateChemicalListInfo().addHistoryItem(histItem).addHistoryItem(histItem2);
		
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.updateChemicalList(listIdOrName, chemicalListInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(listIdOrName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Get Status code OK");
					equal(response.result.name, chemicalListInfo.name, "Names are equal");
					equal(response.result.description, chemicalListInfo.description, "Descriptions are equal");
					equal(response.result.chemicalListHistoryItems.length, 2, "HistoryItems count are equal");
					if (response.result.chemicalListHistoryItems.length == 2) {
						deepEqual(response.result.chemicalListHistoryItems[0].beginDate, chemicalListInfo.chemicalListHistoryItems[0].beginDate, "HistoryItem 0 BeginDate are equal");
						deepEqual(response.result.chemicalListHistoryItems[0].limits, chemicalListInfo.chemicalListHistoryItems[0].limits, "HistoryItem Limit 0 are equal");
						deepEqual(response.result.chemicalListHistoryItems[1].beginDate, chemicalListInfo.chemicalListHistoryItems[1].beginDate, "HistoryItem 1 BeginDate are equal");
						deepEqual(response.result.chemicalListHistoryItems[1].limits, chemicalListInfo.chemicalListHistoryItems[1].limits, "HistoryItem Limit 1 are equal");
					} 					
					start();
				}, context.errorHandler);
		});
		this._start(queue);
	});
	

	asyncTest("Update Chemical List - Change description - Happy path", 4, function () {
		var queue = new ActionQueue(this);
		var listIdOrName = this.chemicalList2ID;
		var chemicalListInfo = this.buildUpdateChemicalListInfo();		
		chemicalListInfo.description = this.updateDescription;
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.updateChemicalList(listIdOrName, chemicalListInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicallists.getChemicalList(listIdOrName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Get Status code OK");
					equal(response.result.name, chemicalListInfo.name, "Names are equal");
					equal(response.result.description, chemicalListInfo.description, "Names are equal");
					start();
				}, context.errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical List - Fault when update by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalListInfo = this.buildUpdateChemicalListInfo();
		var listIdOrName = this.chemicalList2ID;
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.updateChemicalList(listIdOrName, chemicalListInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.listIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical List Async - Happy path", 1, function () {
		var queue = new ActionQueue(this);
		var listIdOrName = this.chemicalList2ID;
		var chemicalListInfo = this.buildUpdateChemicalListInfo();
		chemicalListInfo.description = this.updateDescription;
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.updateChemicalListAsync(listIdOrName, chemicalListInfo,
				function (response) {
					equal(response.result.length, 36, "Chemical list updated");
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Delete Chemical List - Happy Path", 2, function () {
		var queue = new ActionQueue(this);

		var chemicalListInfo = this.buildChemicalListInfo("Delete Chemical List");
		chemicalListInfo.name = "Chemical List for Delete";
		var chemicalListId;
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.createChemicalList(chemicalListInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalListId = response.result;					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicallists.deleteChemicalList(chemicalListId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					context.listIdsToClear.push(chemicalListId);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});

	asyncTest("Delete Chemical List - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);		
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.deleteChemicalList(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Delete Chemical List - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicallists.deleteChemicalList(context.deleteID2,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

}

if (typeof (UnitTestsApplication) == "undefined") {
	executeChemicalListServiceTests();
}