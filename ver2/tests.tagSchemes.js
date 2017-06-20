if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Tag Schemes', execute: executeTagSchemesServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof tagSchemesConfig == "undefined")
	tagSchemesConfig = {};

function executeTagSchemesServiceTests() {
	module("Tag Schemes Service", {
		setup: function() {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (tagSchemesConfig.noManageRightsUserName || "userWPermissionsTagSchemes") + qUnitDbSuffix;
			this.password = tagSchemesConfig.password || "1111";
		
			this.createName = "Crt Tag Scheme Name";
			this.createEnforceUniqueness = "1";
			this.createDescription = "Crt Tag Scheme Description";
			this.deleteID = "b0185b0b-b784-4f57-a995-5b5d67fb87cf";
			this.deleteID2 = "a8bdaf73-1c67-4652-9e5e-7139437cb436";
			this.tagScheme1ID = "d88ec887-93bf-4cc4-9c3e-e5b3f7e034c3";
			this.tagScheme2ID = "22e1d121-e67b-42ba-b4e3-8d2333658c1d";
			this.tagScheme2Name = "d88ec887-93bf-4cc4-9c3e-e5b3f7e034c3";
			this.updateName = "Upd Tag Scheme Name";

			this.updateEnforceUniqueness = "2";
			this.updateDescription = "Upd Tag Scheme Description";
			this.anyGuid = "d4ck84a7-5f48-4b93-8b18-9bb982f6e117";

			this.copyName = "Copy Tag Scheme Name";
			this.copyEnforceUniqueness = "2";
			this.copyDescription = "Upd Tag Scheme Description";
			
			this.tagSchemesIdsToClear = [];
			
			this.buildCreateTagSchemeInfo = function () {
				return new envianceSdk.tagSchemes.TagSchemeInfo(
					this.createName, this.createEnforceUniqueness, this.createDescription);
			};
			this.buildUpdateTagSchemeInfo = function () {
				return new envianceSdk.tagSchemes.TagSchemeInfo(
					this.updateName, this.updateEnforceUniqueness, this.updateDescription);
			};			
			this.buildCopyTagSchemeInfo = function () {
				return new envianceSdk.tagSchemes.TagSchemeInfo(
					this.copyName, this.copyEnforceUniqueness, this.copyDescription);
			};

			this.compareTagSchemeInfo = function(actual, expected) {
				equal(actual.name, expected.name, "Names are equal");
				equal(actual.description, expected.description, "Descriptions are equal");
				equal(actual.enforceUniqueness, expected.enforceUniqueness, "Enforce Uniqueness flags are equal");
			};			
		},
		
		teardown: function() {			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			for (var i = 0 ; i < this.tagSchemesIdsToClear.length ; i++ ){
				stop();
				envianceSdk.tagSchemes.deleteTagScheme(this.tagSchemesIdsToClear[i],
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
	
	asyncTest("Create Tag Scheme - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var tagSchemeInfo = this.buildCreateTagSchemeInfo();
		var tagSchemeId;
		queue.enqueue(function(context) {
			envianceSdk.tagSchemes.createTagScheme(tagSchemeInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct.");
					tagSchemeId = response.result;
					context.tagSchemesIdsToClear.push(tagSchemeId);
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(tagSchemeId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareTagSchemeInfo(response.result, tagSchemeInfo);
					start();
				}, context.errorHandler);
		});
		
		this._start(queue);
	});
	
	asyncTest("Create Tag Scheme - Fault when empty name", 2, function () {
		var queue = new ActionQueue(this);
		var tagSchemeInfo = this.buildCreateTagSchemeInfo();
		tagSchemeInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.createTagScheme(tagSchemeInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Copy Tag Scheme - Happy path", 6, function () {
		var queue = new ActionQueue(this);
		var existedInfo = this.buildCreateTagSchemeInfo();
		var existedId;
		var createInfo = this.buildCopyTagSchemeInfo();
		delete createInfo.description;
		var createdId;

		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.createTagScheme(existedInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					existedId = response.result;
					context.tagSchemesIdsToClear.push(existedId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.copyTagScheme(createInfo, existedId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code OK");
					createdId = response.result;
					context.tagSchemesIdsToClear.push(createdId);
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(createdId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					equal(response.result.description, existedInfo.description, "Descriptions are equal");
					equal(response.result.name, createInfo.name, "Names are equal");
					equal(response.result.enforceUniqueness, createInfo.enforceUniqueness, "Enforce uniqueness are equal");
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Delete Tag Scheme - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		
		var tagSchemeInfo = this.buildCreateTagSchemeInfo();
		var tagSchemeId;
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.createTagScheme(tagSchemeInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct.");
					tagSchemeId = response.result;					
					queue.executeNext();
				}, context._errorHandler);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.deleteTagScheme(tagSchemeId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					context.tagSchemesIdsToClear.push(tagSchemeId);
					queue.executeNext();
				}, context._errorHandler);
		});
		this._start(queue);
	});
	
	asyncTest("Delete Tag Scheme - Fault when ID doesn't exist", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.deleteTagScheme(context.anyGuid,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Delete Tag Scheme - Fault when user without right", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.deleteTagScheme(context.deleteID2,
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
	
	asyncTest("Update Tag Scheme - Happy path", 5, function () {
		var queue = new ActionQueue(this);
		var tagSchemeInfo = this.buildUpdateTagSchemeInfo();
		var id = this.tagScheme1ID;
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.updateTagScheme(id, tagSchemeInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct.");
					queue.executeNext();
				}, context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(id,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					context.compareTagSchemeInfo(response.result, tagSchemeInfo);
					start();
				}, context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Update Tag Scheme - Fault when update by user without right", 2, function () {
		var queue = new ActionQueue(this);
		var tagSchemeInfo = this.buildUpdateTagSchemeInfo();
		this._authenticate(queue, this.noManageRightsUserName);
		var id = this.tagScheme1ID;
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.updateTagScheme(id, tagSchemeInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct.");
					equal(response.error.errorNumber, 103, "Error number is correct.");
					context.tagSchemesIdsToClear.push(response.result);
					envianceSdk.configure({ sessionId: context.originalSessionId });
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Update Tag Scheme - Fault when set empty name", 1, function () {
		var queue = new ActionQueue(this);
		var tagSchemeInfo = this.buildUpdateTagSchemeInfo();
		var id = this.tagScheme1ID;
		tagSchemeInfo.name = "";
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.updateTagScheme(id, tagSchemeInfo,
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					queue.executeNext();
				});
		});
		this._start(queue);
	});
	
	asyncTest("Get Tag Scheme - Happy path - By ID", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(context.tagScheme2ID,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get Tag Scheme - Happy path - By Name", 1, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(context.tagScheme2Name,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct.");
					start();
				}, context._errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Get Tag Scheme- Fault if invalid ID", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(envianceSdk.getSessionId(),
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Tag Scheme- Fault if invalid Name", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme("InvalidSchemeName",
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct.");
					equal(response.error.errorNumber, 102, "Error number is correct.");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Get Tag Scheme - Fault user has no rights", 2, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.noManageRightsUserName);
		queue.enqueue(function (context) {
			envianceSdk.tagSchemes.getTagScheme(context.tagScheme1ID,
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
}

if (typeof (UnitTestsApplication) == "undefined") {
	executeTagSchemesServiceTests();
}