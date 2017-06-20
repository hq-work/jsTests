if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'ChemicalGroup', execute: executeChemicalGroupServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof chemicalGroupsConfig == "undefined")
	chemicalGroupsConfig = {};

function executeChemicalGroupServiceTests() {
	module("Chemical Group Service", {
		setup: function() {						
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (chemicalGroupsConfig.noManageRightsUserName || "userWPermissionsChemGroup") + qUnitDbSuffix;
			this.password = chemicalGroupsConfig.password || "1111";

			this.name = "Chemical Group Name";
			this.description = "Chemical Group Description";

			this.anyGuid = "bab4e72f-dfc5-4a0a-90dc-f551b58664ba";

			this.chemicalGroup1ID = "bc4b2997-f4b7-4641-8193-c9d766d091a8";
			this.chemicalGroup1Name = "ChemicalGroup1";
			this.chemicalGroup2ID = "19de17b9-f595-4c04-b64e-b52618fd8cbe";
			this.chemicalGroup2Name = "ChemicalGroup2";
			this.chemical1ID = "f31f7d89-bfe1-4b86-b025-351d23a6fea7";
			this.chemical2ID = "f5c8d2ae-f8ee-445b-858d-81e2a5a5d480";
			this.chemicalAlias = "Alias";
			
			this.existedName = "ChemicalGroup1";
			this.existedDescription = "Chemical Group 1 Description";
		
			this.createName = "Create Name";
			this.createName2 = "Create Name2";
			this.createName3 = "Create Name2";
			this.createDescription = "Create Description";
			
			this.updateName = "Update Name";
			this.updateDescription = "Update Description";
			this.copyName = "Copy Name";
			this.copyDescription = "Copy Description";

			this.deleteID2 = "2aa8edd3-73a9-411e-9f35-523e4ce76d5d";
						
			this.groupIdsToClear = [];
		
			this.buildChemicalGroupInfo = function () {				
				return new envianceSdk.chemicalgroups.ChemicalGroupInfo(this.name, this.description).addChemical(this.chemical1ID);
			};
				
			this.buildEmptyChemicalGroupInfo = function () {
				return new envianceSdk.chemicalgroups.ChemicalGroupInfo(this.name, this.description);
			};
			
			this.buildUpdateChemicalGroupInfo = function () {
				return new envianceSdk.chemicalgroups.ChemicalGroupInfo(this.updateName, this.updateDescription);
			};
			
			this.buildUpdateCopyGroupInfo = function () {
				return new envianceSdk.chemicalgroups.ChemicalGroupInfo(this.copyName, this.copyDescription);
			};
			
			this.buildExistedGroupInfo = function () {
				return new envianceSdk.chemicalgroups.ChemicalGroupInfo(this.existedName, this.existedDescription).addChemical(this.chemical1ID).addChemical(this.chemical2ID);
			};
			
			this.compareChemicalGroupInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Description are equal");
				deepEqual(actual.chemicals, expected.chemicals, "Chemicals are equal");
			};		
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var i =0;i<this.groupIdsToClear.length;i++){
				stop();
				envianceSdk.chemicalgroups.deleteChemicalGroup(this.groupIdsToClear[i],
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
	
		
	asyncTest("Create Chemical Group - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		var chemicalGroupId;
		queue.enqueue(function(context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalGroupId = response.result;
					context.groupIdsToClear.push(chemicalGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(chemicalGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalGroupInfo(response.result, chemicalGroupInfo);
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Create Chemical Group - no description - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		var chemicalGroupId;
		chemicalGroupInfo.name = this.createName2;
		chemicalGroupInfo.description = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalGroupId = response.result;
					context.groupIdsToClear.push(chemicalGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(chemicalGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalGroupInfo(response.result, chemicalGroupInfo);
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create Chemical Group - set chemical by alias - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildEmptyChemicalGroupInfo().addChemical(this.chemicalAlias);
		chemicalGroupInfo.name = this.createName2;
		var chemicalGroupId;
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalGroupId = response.result;
					context.groupIdsToClear.push(chemicalGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(chemicalGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, chemicalGroupInfo.name, "Names are equal");
					equal(response.result.description, chemicalGroupInfo.description, "Description are equal");
					equal(response.result.chemicals.length, 1, "Chemicals count are equal");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create Chemical Group - Fault when empty name", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical Group - Fault when name existed", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = this.existedName;
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");					
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical Group - Fault when create without chemicals", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = this.createName3;
		chemicalGroupInfo.chemicals = [];
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical Group - Fault when name with \/ symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = "part1\/part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");					
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical Group - Fault when name with \\ symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = "part1\\part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");					
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical Group - Fault when name with [ symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = "part1[part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Chemical Group - Fault when name with ] symbol", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = "part1]part2";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Chemical Group - Fault when create by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		chemicalGroupInfo.name = this.createName3;
		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.groupIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Copy Chemical Group - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildChemicalGroupInfo();
		var existedId;
		var copyInfo = this.buildUpdateCopyGroupInfo();
		delete copyInfo.description;
		var createdId;
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					existedId = response.result;
					context.groupIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.copyChemicalGroup(copyInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					createdId = response.result;
					context.groupIdsToClear.push(createdId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					equal(response.result.name, copyInfo.name, "Names are equal");
					equal(response.result.description, existedInfo.description, "Description are equal");										
					deepEqual(response.result.chemicals, existedInfo.chemicals, "Chemicals are equal");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update Chemical Group - (add chemical) Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var groupIdOrName = this.chemicalGroup2ID;
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo().addChemical(this.chemical1ID).addChemical(this.chemical2ID);
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(groupIdOrName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalGroupInfo(response.result, chemicalGroupInfo);					
					start();
				}, context.errorHandler);
		});
		this._start(queue);
	});

	asyncTest("Update Chemical Group - (remove chemical) Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo().addChemical(this.chemical1ID);
		var groupIdOrName = this.chemicalGroup2ID;
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(groupIdOrName,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalGroupInfo(response.result, chemicalGroupInfo);
					start();
				}, context.errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical Group - Fault when remove all chemical", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo();
		chemicalGroupInfo.chemicals = [];
		var groupIdOrName = this.chemicalGroup2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					context.groupIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Chemical Group - Fault when set no name", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo().addChemical(this.chemical1ID);
		var groupIdOrName = this.chemicalGroup2ID;
		chemicalGroupInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					context.groupIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical Group - Fault when set existed name", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo().addChemical(this.chemical1ID);
		chemicalGroupInfo.name = this.chemicalGroup1Name;
		var groupIdOrName = this.chemicalGroup2ID;
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					context.groupIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical Group - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo().addChemical(this.chemical1ID);
		var groupIdOrName = this.anyGuid;
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					context.groupIdsToClear.push(response.result);
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Chemical Group - Fault when update by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildUpdateChemicalGroupInfo().addChemical(this.chemical1ID);
		var groupIdOrName = this.chemicalGroup2ID;
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.updateChemicalGroup(groupIdOrName, chemicalGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.groupIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Get Chemical Group - by ID - Happy path", 4, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildExistedGroupInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(context.chemicalGroup1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalGroupInfo(response.result, chemicalGroupInfo);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Get Chemical Group - by Name - Happy path", 4, function () {
		var queue = new ActionQueue(this);
		var chemicalGroupInfo = this.buildExistedGroupInfo();
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(context.chemicalGroup1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareChemicalGroupInfo(response.result, chemicalGroupInfo);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});

	asyncTest("Get Chemical Group - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Get Chemical Group - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.getChemicalGroup(context.anyGuid,
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

	asyncTest("Delete Chemical Group - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		
		var chemicalGroupInfo = this.buildChemicalGroupInfo();
		var chemicalGroupId;
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.createChemicalGroup(chemicalGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					chemicalGroupId = response.result;
					context.groupIdsToClear.push(chemicalGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.deleteChemicalGroup(chemicalGroupId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					queue.executeNext();
				}, context._errorHandler);
		});
		
		this._start(queue);
	});

	asyncTest("Delete Chemical Group - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);		
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.deleteChemicalGroup(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Delete Chemical Group - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.chemicalgroups.deleteChemicalGroup(context.deleteID2,
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
	executeChemicalGroupServiceTests();
}