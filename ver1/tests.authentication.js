if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Authentication', execute: executeAuthenticationServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof authConfig == "undefined")
	authConfig = { };

function executeAuthenticationServiceTests() {
	module("Authentication Service", {
		setup: function() {
			this.accessUserName = authConfig.accessUserName || "jstestsAccessUser";
			this.password = authConfig.password || "1111";

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
		},
		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
		}
	});

	asyncTest("Authenticate - Happy path", 4, function() {
		envianceSdk.authentication.authenticate(this.accessUserName, this.password,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code is correct");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				notEqual(envianceSdk.getSessionId(), this.originalSessionId, "Session ID has changed");
				equal(envianceSdk.getSystemId(), null, "System ID is null");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Authenticate - Fault if no user name specified", 3, function() {
		envianceSdk.authentication.authenticate("", this.password,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				equal(response.error.details[0].key, "UserName", "userName parameter validation failed");
				start();
			});
	});

	asyncTest("Authenticate - Fault if no password specified", 3, function() {
		envianceSdk.authentication.authenticate(this.accessUserName, "",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				equal(response.error.details[0].key, "Password", "password parameter validation failed");
				start();
			});
	});

	asyncTest("Get session info - Happy path", 12, function() {
		envianceSdk.authentication.getCurrentSessionInfo(
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");

				ok(response.result.hasOwnProperty("id"), "id property presents");
				ok(response.result.hasOwnProperty("homeSystemId"), "homeSystemId property presents");
				ok(response.result.hasOwnProperty("currentSystemId"), "currentSystemId property presents");
				ok(response.result.hasOwnProperty("systems"), "systems property presents");
				ok(response.result.hasOwnProperty("sessionTimeout"), "sessionTimeout property presents");
				ok(response.result.hasOwnProperty("userTimeZone"), "userTimeZone property presents");

				ok(response.result.userTimeZone.hasOwnProperty("name"), "userTimeZone.name property presents");
				ok(response.result.userTimeZone.hasOwnProperty("stdOffset"), "userTimeZone.stdOffset property presents");
				ok(response.result.userTimeZone.hasOwnProperty("dstOffset"), "userTimeZone.dstOffset property presents");
				ok(response.result.userTimeZone.hasOwnProperty("currentOffset"), "userTimeZone.currentOffset property presents");

				equal(response.result.id, envianceSdk.getSessionId(), "Session ID OK");

				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeAuthenticationServiceTests();
}