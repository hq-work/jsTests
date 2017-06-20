if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'MaterialGroup', execute: executeMaterialGroupServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof materialGroupsConfig == "undefined")
	materialGroupsConfig = {};

function executeMaterialGroupServiceTests() {
	module("Material Group Service", {
		setup: function() {						
			
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (materialGroupsConfig.noManageRightsUserName || "userWPermissionsMatGroup") + qUnitDbSuffix;
			this.password = materialGroupsConfig.password || "1111";

			this.anyGuid = "bab4e72f-dfc5-4a0a-90dc-f551b58664ba";
			
			this.materialGroup1ID = "0bebb6c8-2a6d-449a-8e31-0b1c71b261c3";
			this.materialGroup1Name = "Material Group 1";
			this.materialGroup2ID = "429d7d94-7de6-4e12-ae73-021d267b5f71";
			this.materialGroup3ID = "0bebb6c8-2a6d-449a-8e31-0b1c71b261c8";

			this.material1ID = "07ae24ff-b739-4736-8b81-a8e18196dbef";
			this.material1Name = "Material for group 1";
			this.material2ID = "34fd7bb6-8a4c-4de8-96a8-900f85eedfbf";
			this.material2Name = "Material for group 2";

			this.groupIdsToClear = [];
		
			this.buildMaterialGroupInfo = function (name, materials) {
				return new envianceSdk.materialGroups.MaterialGroupInfo(name, name + " Description", materials);
			};			
			
			this.compareMaterialGroupInfo = function (actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Description are equal");
				deepEqual(actual.materialIdOrNames, expected.materialIdOrNames, "Materials are equal");
			};
			
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			for (var i = this.groupIdsToClear.length - 1; i >= 0; i -- ){
				stop();
				envianceSdk.materialGroups.deleteMaterialGroup(this.groupIdsToClear[i],
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
	
	asyncTest("Create Material Group - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Create Material Group - Happy path", [this.material1ID, this.material2ID]);
		var materialGroupId;
		queue.enqueue(function(context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(materialGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMaterialGroupInfo(response.result, materialGroupInfo);
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Create Material Group - set material by name - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Create Material Group - set material by name - Happy path", [this.material1Name, this.material2Name]);
		var materialGroupId;
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(materialGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.name, materialGroupInfo.name, "Names are equal");
					equal(response.result.description, materialGroupInfo.description, "Description are equal");
					equal(response.result.materialIdOrNames.length, 2, "Materials count are equal");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create Material Group - Fault when empty name", 2, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("", [this.material1ID]);
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Material Group - Fault when name existed", 1, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Material Group 1", [this.material1ID]);
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Material Group - Fault when create without materials", 2, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Create Material Group - Fault when create without materials");
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Create Material Group - Fault when name with \/,\\,[,] symbol", 1, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Create Material Group - Fault when name with \/,\\,[,] symbol", [this.material1ID]);
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");					
					start();
				});
		});
		this._start(queue);
	});

	asyncTest("Create Material Group - Fault when create by user without right", 1, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Create Material Group - Fault when create by user without right", [this.material1ID]);
		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					context.groupIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Material Group - (add material) Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup2ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Update Material Group - (add material) Happy path";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.addMaterial(context.material2ID);
			envianceSdk.materialGroups.updateMaterialGroup(materialGroupId, materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(materialGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMaterialGroupInfo(response.result, materialGroupInfo);
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update Material Group - (remove material) Happy path", 7, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Update Material Group - (remove material) Happy path";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.materialIdOrNames.pop();
			envianceSdk.materialGroups.updateMaterialGroup(materialGroupId, materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(materialGroupId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					context.compareMaterialGroupInfo(response.result, materialGroupInfo);
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update Material Group - Fault when remove all materials", 4, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Update Material Group - Fault when remove all chemical";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.materialIdOrNames = [];
			envianceSdk.materialGroups.updateMaterialGroup(materialGroupId, materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});

		this._start(queue);
	});

	asyncTest("Update Material Group - Fault when set existed name", 3, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Update Material Group - Fault when set existed name";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = context.materialGroup1Name;
			envianceSdk.materialGroups.updateMaterialGroup(materialGroupId, materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					start();
				});
		});

		this._start(queue);
	});

	asyncTest("Update Material Group - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo = this.buildMaterialGroupInfo("Update Material Group - Fault when ID doesn't exist", [this.material1ID, this.material2ID]);
		var materialGroupId = this.anyGuid;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.updateMaterialGroup(materialGroupId, materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					start();
				});
		});

		this._start(queue);
	});

	asyncTest("Update Material Group - Fault when update by user without right", 4, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Update Material Group - Fault when remove all chemical";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);					
					queue.executeNext();
				}, context._errorHandler);
		});

		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Update Material Group - Fault when update by user without right";
			envianceSdk.materialGroups.updateMaterialGroup(materialGroupId, materialGroupInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		this._start(queue);
	});
	
	asyncTest("Get Material Group - by ID - Happy path", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Get Material Group - by Name - Happy path", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Get Material Group - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.anyGuid,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					start();
				});
		});

		this._start(queue);
	});

	asyncTest("Get Material Group - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.anyGuid,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		this._start(queue);
	});

	asyncTest("Delete Material Group - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup2ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Delete Material Group - Happy path";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.deleteMaterialGroup(materialGroupId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					start();
				}, context.errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Delete Material Group - Fault when ID doesn't exist", 1, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.deleteMaterialGroup(context.anyGuid,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					start();
				});
		});

		this._start(queue);
	});

	asyncTest("Delete Material Group - Fault when user without right", 4, function () {
		var queue = new ActionQueue(this);
		var materialGroupInfo;
		var materialGroupId;

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getMaterialGroup(context.materialGroup2ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					materialGroupInfo = new envianceSdk.materialGroups.MaterialGroupInfo(response.result.name, response.result.description, response.result.materialIdOrNames);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			materialGroupInfo.name = "Delete Material Group - Fault when user without right";
			envianceSdk.materialGroups.createMaterialGroup(materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					materialGroupId = response.result;
					context.groupIdsToClear.push(materialGroupId);
					queue.executeNext();
				}, context._errorHandler);
		});

		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.deleteMaterialGroup(materialGroupId,
				context.errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		this._start(queue);
	});
	
	
	asyncTest("Material Group - Update Dependent MACs - Happy path", 8, function () {
		var queue = new ActionQueue(this);
		var macIds;
		var materialGroupInfo = this.buildMaterialGroupInfo(null, [this.material2ID]);
		var materialGroupRollbackInfo = this.buildMaterialGroupInfo(null, [this.material1ID, this.material2ID]);
		queue.enqueue(function (context) {			
			envianceSdk.materialGroups.updateMaterialGroup(context.materialGroup3ID, materialGroupInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getDependentMacs(context.materialGroup3ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					macIds = response.result;
					equal(macIds.length, 1, "Mac Ids array length = 1, Ok");
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.updateDependentMacs(context.materialGroup3ID, macIds,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.materialGroups.getDependentMacs(context.materialGroup3ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					macIds = response.result;
					equal(macIds.length, 0, "Mac Ids array length = 0, Ok");
					queue.executeNext(); 
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {			
			envianceSdk.materialGroups.updateMaterialGroup(context.materialGroup3ID, materialGroupRollbackInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.materialGroups.updateDependentMacs(context.materialGroup3ID, macIds,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start(); 
				}, context._errorHandler);
		});

		this._start(queue);
	});

}

if (typeof (UnitTestsApplication) == "undefined") {
	executeChemicalGroupServiceTests();
}