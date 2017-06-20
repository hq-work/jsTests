if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Tags', execute: executeTagServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof tagsConfig == "undefined")
	tagsConfig = {};

function executeTagServiceTests() {
	module("Tag Service", {
		setup: function() {						
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (tagsConfig.noManageRightsUserName || "userWPermissionsTags") + qUnitDbSuffix;
			this.password = tagsConfig.password || "1111";
		
			this.createName = "Crt Tag Name";
			this.createTagSchemeId = "22e1d121-e67b-42ba-b4e3-8d2333658c1d";
			this.createDescription = "Crt Tag Description";
			this.tag1ID = "ec4e6d1e-0932-4e47-91ad-87f26ecc6143";
			this.tag1Name = this.createTagSchemeId + "/" + "Tag 1";			
			this.tag2ID = "cfdf04d1-b04e-402a-be05-11bf6914c929";
			this.updateName = "Upd Name";
			this.updateTagSchemeId = "23e1d121-e67b-48ba-b4e3-8d2333659c1d";
			this.updateDescription = "Upd Tag Description";
			this.deleteID = "cfdf04d1-b04e-402a-be05-11bf6914c929";
			this.deleteID2 = "0297c2c8-ccf6-44ec-8b6b-90eb28f2d504";
			this.anyGuid = "d4bf84a8-9f48-4b93-8b18-9bb982f6e117";
			this.existingName = "Tag 2";
			
			this.tagsIdsToClear = [];
			
			this.buildCreateTagInfo = function () {
				return new envianceSdk.tags.TagInfo(
					this.createName, this.createTagSchemeId, this.createDescription);
			};
			this.buildUpdateTagInfo = function () {
				return new envianceSdk.tags.TagInfo(
					this.updateName, this.updateTagSchemeId, this.updateDescription);
			};

			this.compareTagInfo = function(actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Descriptions are equal");
				equal(actual.tagSchemeId, expected.tagSchemeId, "Tag Scheme IDs are equal");
			};			
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			for (var i = 0 ; i < this.tagsIdsToClear.length;i++ ){
				stop();
				envianceSdk.tags.deleteTag(this.tagsIdsToClear[i],
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
	
	asyncTest("Create Tag - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var tagInfo = this.buildCreateTagInfo();
		var tagId;
		queue.enqueue(function(context) {
			envianceSdk.tags.createTag(tagInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct.");
					tagId = response.result;
					context.tagsIdsToClear.push(tagId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.tags.getTag(tagId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareTagInfo(response.result, tagInfo);
					start();
				}, context._errorHandler);
		});
		
		this._start(queue);

	});
	
	asyncTest("Create Tag - Fault when empty name", 2, function () {
		var queue = new ActionQueue(this);
		var tagInfo = this.buildCreateTagInfo();
		tagInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.tags.createTag(tagInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Get Tag - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tags.getTag(context.tag1ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Tag - Happy path - By Tag Scheme Id and Tag Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tags.getTag(context.tag1Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Tag - Fault if invalid ID", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tags.getTag(envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Tag - Fault if invalid Tag Scheme Id and Tag Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tags.getTag("58959/InvalidName",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Tag - Fault user has no rights", 2, function () {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.noManageRightsUserName);

		queue.enqueue(function (context) {
			envianceSdk.tags.getTag(context.tag1ID,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Tag - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var tagInfo = this.buildUpdateTagInfo();
		var id = this.tag2ID;
		queue.enqueue(function (context) {
			envianceSdk.tags.updateTag(id, tagInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tags.getTag(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareTagInfo(response.result, tagInfo);
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Update Tag - Fault when update by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var tagInfo = this.buildUpdateTagInfo();
		this._authenticate(queue, this.noManageRightsUserName);
		var id = this.tag2ID;
		queue.enqueue(function (context) {
			envianceSdk.tags.updateTag(id, tagInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.tagsIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Update Tag - Fault when set empty name", 1, function () {
		var queue = new ActionQueue(this);
		var tagInfo = this.buildUpdateTagInfo();
		var id = this.tag2ID;
		tagInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.tags.updateTag(id, tagInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Delete Tag - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		
		var tagInfo = this.buildCreateTagInfo();
		var tagId;
		queue.enqueue(function (context) {
			envianceSdk.tags.createTag(tagInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct.");
					tagId = response.result;					
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tags.deleteTag(tagId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					context.tagsIdsToClear.push(tagId);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});

	asyncTest("Delete Tag - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tags.deleteTag(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Delete Tag - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.tags.deleteTag(context.deleteID2,
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
	executeTagServiceTests();
}