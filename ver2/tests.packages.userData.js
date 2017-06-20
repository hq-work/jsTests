if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Packages User Data', execute: executeUserDataTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeUserDataTests() {
	module("User Data", {
		setup: function() {
		},

		teardown: function() {
		}
	});

	asyncTest("Delete, Set and Get all user data - Happy path", 6, function() {
		var queue = new ActionQueue(this);
		var dictionary1 = {
			"a u d i t superkley 1": "value 1",
			key2: "[1, \"200\", { innerKey1: 1000, innerKey2: 'inner value 1'}]",
			key3: "{innerKey1: 1007, innerKey2: [1, 3, \"inner value 2\"]}"
		};
		var dictionary2 = {
			key2: "value 1",
			"a u d i t superkley 1": "[1, \"2\", { innerKey1: 100, innerKey2: 'inner value 1'}]",
			key4: "{innerKey1: 100, innerKey2: [1, 3, \"inner value 2\"]}"
		};

		queue.enqueue(function(context) {
			envianceSdk.packages.userData.del(
				["a u d i t superkley 1", "key2", "key3", "key4"],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code matches");
					queue.executeNext();
				}, context.errorHandler);
		});

		//Create a new user data
		queue.enqueue(function(context) {
			envianceSdk.packages.userData.set(dictionary1,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code matches");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.userData.get(
				["key3", "a u d i t superkley 1", "key2", "keynotexist"],
				function(response) {
					deepEqual(response, dictionary1, "Actual and expected values are equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		//Overwite existing user data
		queue.enqueue(function(context) {
			envianceSdk.packages.userData.set(dictionary2,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code matches");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.userData.get(
				[],
				function(response) {
					dictionary2.key3 = "{innerKey1: 1007, innerKey2: [1, 3, \"inner value 2\"]}";
					deepEqual(response, dictionary2, "Actual and expected values are equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.userData.del(
				["a u d i t superkley 1", "key2", "key3", "key4"],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code matches");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Set, Get and Delete huge user data value- Happy path", 3, function () {
		var queue = new ActionQueue(this);

		var dictionary1 = {
			"key-huge-value": new Array(6000000).join('a')
		};

		//Create a new User Data
		queue.enqueue(function (context) {
			envianceSdk.packages.userData.set(dictionary1,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code matches");
					queue.executeNext();
				}, context.errorHandler);
		});

		// get user data
		queue.enqueue(function (context) {
			envianceSdk.packages.userData.get(
				["key-huge-value"],
				function (response) {
					deepEqual(response, dictionary1, "Actual and expected values are equal");
					queue.executeNext();
				}, context.errorHandler);
		});

		// delete user data
		queue.enqueue(function (context) {
			envianceSdk.packages.userData.del(
				["key-huge-value"],
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code matches");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	test("Set user data set - Fault if dictionary argument contain key with length > 100 characters", 1, function() {
		var dictionary = { };
		dictionary[new Array(102).join('a')] = 'aaaaa';
		throws(function() {
			envianceSdk.packages.userData.set(dictionary, null, null);
		}, "Exception thrown");
	});

	test("Set user data set - Fault if key start with '/' character", 1, function() {
		var dictionary = { "/illegal/Key": '/key1/ss' };
		throws(function() {
			envianceSdk.packages.userData.set(dictionary, null, null);
		}, "Exception thrown");
	});

	test("Set user data set - Fault if dictionary argument contain not a string value.", 1, function() {
		var dictionary = { notStringValue: { field: 100 } };
		throws(function() {
			envianceSdk.packages.userData.set(dictionary, null, null);
		}, "Exception thrown");
	});

	test("Set user data set - Fault if dictionary argument is an array.", 1, function() {
		var dictionary = [{ field: 100 }];
		throws(function() {
			envianceSdk.packages.userData.set(dictionary, null, null);
		}, "Exception thrown");
	});

	test("Set user data set - Fault if dictionary argument contains a duplicate keys.", 1, function() {
		var dictionary = { duplicate1: "zx", Duplicate1: "zs" };
		throws(function() {
			envianceSdk.packages.userData.set(dictionary, null, null);
		}, "Exception thrown");
	});

	test("Get user data set - Fault if array argument contains a duplicate keys.", 1, function() {
		var keys = ["key1", "KEY1", "Key2"];
		throws(function() {
			envianceSdk.packages.userData.get(keys, null, null);
		}, "Exception thrown");
	});

	test("Delete user data set - Fault if <keys> argument is not an array.", 1, function() {
			var keys = "key1, key2";
			throws(function() {
				envianceSdk.packages.userData.del(keys, null, null);
			}, "Exception thrown");
		});

	test("Delete user data set - Fault if <keys> argument is an empty array.", 1, function() {
		var keys = [];
		throws(function() {
			envianceSdk.packages.userData.del(keys, null, null);
		}, "Exception thrown");
	});

	test("Get app data - Fault if <keys> array contain key with length > 100 characters", 1, function() {
		var keys = [new Array(102).join('a')];
		throws(function() {
			envianceSdk.packages.userData.get(keys, null, null);
		}, "Exception thrown");
	});

	test("Get app data - Fault if <keys> array  contain key which start with '/' character", 1, function() {
		var keys = ["/illegalKey"];
		throws(function() {
			envianceSdk.packages.userData.get(keys, null, null);
		}, "Exception thrown");
	});

}

if (typeof (UnitTestsApplication) == "undefined") {
	executeUserDataTests();
}