if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'SDK Infrastructure', execute: executeSdkInfrastructureTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeSdkInfrastructureTests() {
	module("SDK Infrastructure", {
		setup: function() {
		}
	});

	asyncTest("Metadata structure", 7, function () {
		var self = this;
		envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", 1, 10,
			function(response) {
				ok(response.hasOwnProperty("metadata"), "Request has metadata property");
				ok(response.metadata.hasOwnProperty("statusCode"), "Request StatusCode handled");
				ok(response.metadata.hasOwnProperty("version"), "EnvApi-Version header handled");
				ok(response.metadata.hasOwnProperty("remainingCalls"), "EnvApi-Remaining-Calls header handled");
				ok(response.metadata.hasOwnProperty("remainingInterval"), "EnvApi-Remaining-Interval header handled");
				ok(response.metadata.hasOwnProperty("ecuCall"), "EnvApi-Eql-ECUCall header handled");
				ok(response.metadata.hasOwnProperty("ecuPeriod"), "EnvApi-Eql-ECUPeriod header handled");
				//ok(response.metadata.hasOwnProperty("warnings"), "EnvApi-Warnings header handled");
				start();
			},
			self.errorHandler);
	});
	

	asyncTest("Metadata structure streamed", 7, function () {
		var self = this;
		envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", null, null,
			function (response) {
				ok(response.hasOwnProperty("metadata"), "Request has metadata property");
				ok(response.metadata.hasOwnProperty("statusCode"), "Request StatusCode handled");
				ok(response.metadata.hasOwnProperty("version"), "EnvApi-Version header handled");
				ok(response.metadata.hasOwnProperty("remainingCalls"), "EnvApi-Remaining-Calls header handled");
				ok(response.metadata.hasOwnProperty("remainingInterval"), "EnvApi-Remaining-Interval header handled");
				ok(!response.metadata.hasOwnProperty("ecuCall"), "EnvApi-Eql-ECUCall header handled");
				ok(response.metadata.hasOwnProperty("ecuPeriod"), "EnvApi-Eql-ECUPeriod header handled");
				//ok(response.metadata.hasOwnProperty("warnings"), "EnvApi-Warnings header handled");
				start();
			},
			self.errorHandler);
	});
	
	asyncTest("Forms authentication - Happy path", 1, function () {
		var originalSessionId = envianceSdk.getSessionId();
		var originalSystemId = envianceSdk.getSystemId();

		var queue = new ActionQueue(this);
		queue.enqueue(function(context) {
			envianceSdk.configure({ sessionId: null });

			envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", 1, 10,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					queue.executeNext();
				},
				function (resp, status, msg) {
					context.errorHandler(resp, status, msg, null, true);
					queue.executeNext();
				});
		});

		queue.enqueue(function() {
			envianceSdk.configure({
				sessionId: originalSessionId,
				systemId: originalSystemId
			});
			start();
		});

		queue.executeNext();
	});

	asyncTest("Enviance authentication - Fault if session ID is invalid", 1, function() {
		var originalSessionId = envianceSdk.getSessionId();
		var originalSystemId = envianceSdk.getSystemId();

		var queue = new ActionQueue(this);
		queue.enqueue(function(context) {
			envianceSdk.configure({ sessionId: createUUID() });

			envianceSdk.eql.execute("This query does not matter as it will be never executed", 1, 10,
				function(resp) {
					context.errorHandler(resp, "error", null, null, true);
					queue.executeNext();
				},
				function(response) {
					equal(response.metadata.statusCode, 401, "Status code is correct");
					// Error number is not verified because IIS replaces response by its own HTML page for this status code.
					queue.executeNext();
				});
		});

		queue.enqueue(function() {
			envianceSdk.configure({
				sessionId: originalSessionId,
				systemId: originalSystemId
			});
			start();
		});

		queue.executeNext();
	});

	asyncTest("Basic authentication - Happy path", 2, function() {
		var oldBuildRequestHeaders = envianceSdk._private._buildRequestHeaders;
		var self = this;
		
		envianceSdk._private._buildRequestHeaders = function(denySystemId) {
			var headers = oldBuildRequestHeaders(denySystemId);
			headers["Authorization"] = "Basic " + Base64.encode(self.accessUserName + ":" + authConfig.password);
			return headers;
		};

		envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", 1, 10,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			this.errorHandler
		).always(function() {
			envianceSdk._private._buildRequestHeaders = oldBuildRequestHeaders;
		});
	});

	asyncTest("Basic authentication - Fault if credentials are not base64-encoded", 1, function() {
		var oldBuildRequestHeaders = envianceSdk._private._buildRequestHeaders;
		var self = this;

		envianceSdk._private._buildRequestHeaders = function(denySystemId) {
			var headers = oldBuildRequestHeaders(denySystemId);
			headers["Authorization"] = "Basic " + self.accessUserName + ":" + authConfig.password;
			return headers;
		};

		envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", 1, 10,
			this.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				start();
			}).always(function () {
				envianceSdk._private._buildRequestHeaders = oldBuildRequestHeaders;
			});
	});

	asyncTest("Basic authentication - Fault if credentials are not formatted correctly", 1, function() {
		var oldBuildRequestHeaders = envianceSdk._private._buildRequestHeaders;
		var self = this;

		envianceSdk._private._buildRequestHeaders = function(denySystemId) {
			var headers = oldBuildRequestHeaders(denySystemId);
			headers["Authorization"] = "Basic " + Base64.encode(self.accessUserName + "-" + authConfig.password);
			return headers;
		};

		envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", 1, 10,
			this.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				start();
			}).always(function () {
				envianceSdk._private._buildRequestHeaders = oldBuildRequestHeaders;
			});
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeSdkInfrastructureTests();
}