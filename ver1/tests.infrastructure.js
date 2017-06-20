if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'SDK Infrastructure', execute: executeSDKInfrastructureTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeSDKInfrastructureTests() {
	module("SDK Infrastructure");

	asyncTest("Metadata structure", 5, function() {
		envianceSdk.eql.execute("SELECT ft.ID FROM FormTemplate ft", 1, 10,
			function(response) {
				ok(response.hasOwnProperty("metadata"), "Request has metadata property");
				ok(response.metadata.hasOwnProperty("statusCode"), "Request StatusCode handled");
				ok(response.metadata.hasOwnProperty("version"), "EnvApi-Version header handled");
				ok(response.metadata.hasOwnProperty("remainingCalls"), "EnvApi-Remaining-Calls header handled");
				ok(response.metadata.hasOwnProperty("remainingInterval"), "EnvApi-Remaining-Interval header handled");
				//ok(response.metadata.hasOwnProperty("warnings"), "EnvApi-Warnings header handled");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Unauthenticated REST API call", 1, function() {
		var originalSessionId = envianceSdk.getSessionId();
		var originalSystemId = envianceSdk.getSystemId();

		var queue = new ActionQueue(this);
		queue.enqueue(function() {
			envianceSdk.configure({ sessionId: createUUID() });

			envianceSdk.eql.execute("This query does not matter as it will be never executed", 1, 10,
				function() {
					ok(false, "failed");
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
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeSDKInfrastructureTests();
}