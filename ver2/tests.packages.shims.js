if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Packages Shims', execute: executeShimsTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof shimsConfig == "undefined")
	shimsConfig = { };

function executeShimsTests() {
	var _userLocalShim = new envianceSdk.packages.userLocalShim('jsonRolesShim.json');

	module("Shims", {
		setup: function() {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();

			this._shimUserName = shimsConfig.noAccessUserName || "jstestsNotAccessUser";
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this._shimUserNameNotInJsonFile = (shimsConfig.noManageRightsUserName || "noManageRightsUserName") + qUnitDbSuffix;
			this._shimUserPassword = shimsConfig.password || "1111";

			this._localStorage = (function() {
				if (typeof window.localStorage == "object") {
					return function() { return localStorage; };
				} else if (typeof window.globalStorage == "object") {
					return function() { return window.globalStorage[location.host]; };
				} else {
					return function() { throw new Error("Local storage not available."); };
				}
			})();

			this._dictionary1 = {
				"Audit_Key_1": "Audit_Value_11",
				"Audit_Key_2": "Audit_Value_12",
				"Audit_Key_3": "Audit_Value_13"
			};
			this._dictionary2 = {
				"Audit_Key_2": "Audit_Value_22",
				"Audit_Key_3": "Audit_Value_23",
				"Audit_Key_4": "Audit_Value_24"
			};
			this._keys = ["Audit_Key_1", "Audit_Key_2", "Audit_Key_3", "Audit_Key_4"];
		},
		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			_userLocalShim._userName = null;

			//Remove all keys
			var keysToRemove = ["Audit_Key_1", "Audit_Key_2", "Audit_Key_3", "Audit_Key_4", "key2", "key1", "KEY1", "Key2", "/illegalKey", new Array(102).join('a'), "zAudit_Key_2", "zAudit_Key_3", "zAudit_Key_4", "duplicate1", "Duplicate1"];
			try {
				envianceSdk.packages.localAppDataShim.del(keysToRemove);
				envianceSdk.packages.localUserDataShim.del(keysToRemove);
			} catch(e) {
			}
		}
	});


	//localAppDataShim tests

	test("localAppDataShim: Save, Get, Delete Data - Happy path", 3, function() {
		envianceSdk.packages.localAppDataShim.set(this._dictionary1);

		var testedDictionary1 = envianceSdk.packages.localAppDataShim.get(this._keys);
		deepEqual(testedDictionary1, this._dictionary1, "Actual and expected values are equal");

		envianceSdk.packages.localAppDataShim.del(["Audit_Key_1"]);
		envianceSdk.packages.localAppDataShim.set(this._dictionary2);

		var testedDictionary2 = envianceSdk.packages.localAppDataShim.get(this._keys);
		deepEqual(testedDictionary2, this._dictionary2, "Actual and expected values are equal");

		envianceSdk.packages.localAppDataShim.del(this._keys);

		var testedDictionary3 = envianceSdk.packages.localAppDataShim.get(this._keys);
		deepEqual(testedDictionary3, { }, "Actual and expected values are equal");
	});

	test("localAppDataShim: get All Data - Happy path", 1, function() {
		var dictionary = { "zAudit_Key_2": "zAudit_Value_22", "zAudit_Key_3": "Audit_Value_23", "zAudit_Key_4": "zAudit_Value_24" };

		envianceSdk.packages.localAppDataShim.set(dictionary);
		var testedDictionary = envianceSdk.packages.localAppDataShim.get([]);
		deepEqual(testedDictionary, dictionary, "Actual and expected values are equal");
	});

	test("localAppDataShim: Save app data set - Fault if dictionary argument contain key with length > 100 characters", 1, function() {
		var dictionary = { };
		dictionary[new Array(102).join('a')] = 'aaaaa';
		throws(function() {
			envianceSdk.packages.localAppDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localAppDataShim: Save app data set - Fault if dictionary argument contain key which start with '/' character", 1, function() {
		var dictionary = { "/illegalKey": '/key1/ss' };
		throws(function() {
			envianceSdk.packages.localAppDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localAppDataShim: Save app data set - Fault if dictionary argument contain not string value.", 1, function() {
		var dictionary = { notStringValue: { field: 100 } };
		throws(function() {
			envianceSdk.packages.localAppDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localAppDataShim: Save app data set - Fault if dictionary argument is array.", 1, function() {
		var dictionary = [{ field: 100 }];
		throws(function() {
			envianceSdk.packages.localAppDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localAppDataShim: Save app data set - Fault if dictionary argument contains a duplicate keys.", 1, function() {
		var dictionary = { duplicate1: "zx", Duplicate1: "zc" };
		throws(function() {
			envianceSdk.packages.localAppDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localAppDataShim: Get app data set - Fault if array argument contains a duplicate keys.", 1, function() {
		var keys = ["key1", "KEY1", "Key2"];
		throws(function() {
			envianceSdk.packages.localAppDataShim.get(keys);
		}, "Exception thrown");
	});

	test("localAppDataShim: Delete app data set - Fault if <keys> argument is not an array.", 1, function() {
		var keys = "key1, key2";
		throws(function() {
			envianceSdk.packages.localAppDataShim.del(keys);
		}, "Exception thrown");
	});

	test("localAppDataShim: Delete app data set - Fault if <keys> argument is an empty array.", 1, function() {
		var keys = [];
		throws(function() {
			envianceSdk.packages.localAppDataShim.del(keys);
		}, "Exception thrown");
	});

	// localUserDataShim tests

	test("localUserDataShim: Save, Get, Delete Data - Happy path", 3, function() {
		envianceSdk.packages.localUserDataShim.set(this._dictionary1);

		var testedDictionary1 = envianceSdk.packages.localUserDataShim.get(this._keys);
		deepEqual(testedDictionary1, this._dictionary1, "Actual and expected values are equal");

		envianceSdk.packages.localUserDataShim.del(["Audit_Key_1"]);
		envianceSdk.packages.localUserDataShim.set(this._dictionary2);

		var testedDictionary2 = envianceSdk.packages.localUserDataShim.get(this._keys);
		deepEqual(testedDictionary2, this._dictionary2, "Actual and expected values are equal");

		envianceSdk.packages.localUserDataShim.del(this._keys);

		var testedDictionary3 = envianceSdk.packages.localUserDataShim.get(this._keys);
		deepEqual(testedDictionary3, { }, "Actual and expected values are equal");
	});

	test("localUserDataShim: get All Data - Happy path", 1, function() {
		var dictionary = { "zAudit_Key_2": "zAudit_Value_22", "zAudit_Key_3": "Audit_Value_23", "zAudit_Key_4": "zAudit_Value_24" };

		envianceSdk.packages.localUserDataShim.set(dictionary);
		var testedDictionary = envianceSdk.packages.localUserDataShim.get([]);
		deepEqual(testedDictionary, dictionary, "Actual and expected values are equal");
	});

	test("localUserDataShim: Save app data set - Fault if dictionary argument contain key with length > 100 characters", 1, function() {
		var dictionary = { };
		dictionary[new Array(102).join('a')] = 'aaaaa';
		throws(function() {
			envianceSdk.packages.localUserDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localUserDataShim: Save app data set - Fault if dictionary argument contain key which start with '/' character", 1, function() {
		var dictionary = { "/illegalKey": '/key1/ss' };
		throws(function() {
			envianceSdk.packages.localUserDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localUserDataShim: Save app data set - Fault if dictionary argument contain not a string value.", 1, function() {
		var dictionary = { notStringValue: { field: 100 } };
		throws(function() {
			envianceSdk.packages.localUserDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localUserDataShim: Save app data set - Fault if dictionary argument is an array.", 1, function() {
		var dictionary = [{ field: 100 }];
		throws(function() {
			envianceSdk.packages.localUserDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localUserDataShim: Save app data set - Fault if dictionary argument contains a duplicate keys.", 1, function() {
		var dictionary = { duplicate1: "zx", Duplicate1: "zc" };
		throws(function() {
			envianceSdk.packages.localUserDataShim.set(dictionary);
		}, "Exception thrown");
	});

	test("localUserDataShim: Get app data set - Fault if array argument contains a duplicate keys.", 1, function() {
		var keys = ["key1", "KEY1", "Key2"];
		throws(function() {
			envianceSdk.packages.localUserDataShim.get(keys);
		}, "Exception thrown");
	});

	test("localUserDataShim: Delete app data set - Fault if <keys> argument is not an array.", 1, function() {
		var keys = "key1, key2";
		throws(function() {
			envianceSdk.packages.localUserDataShim.del(keys);
		}, "Exception thrown");
	});

	test("localUserDataShim: Delete app data set - Fault if <keys> argument is an empty array.", 1, function() {
		var keys = [];
		throws(function() {
			envianceSdk.packages.localUserDataShim.del(keys);
		}, "Exception thrown");
	});


	test("userLocalShim: hasAccessTo - Happy path", 1, function() {
		var hasAcces = _userLocalShim.hasAccessTo();
		equal(hasAcces, true, "Actual and expected values are equal");
	});

	asyncTest("userLocalShim: authenticate - Happy path", 1, function() {
		var self = this;
		_userLocalShim.authenticate(this._shimUserName, this._shimUserPassword,
			function() {
				equal(_userLocalShim._userName, self._shimUserName, "Actual and expected values are equal");
				start();
			},
			function() { start(); });

	});

	asyncTest("userLocalShim: isInRole - Happy path", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			_userLocalShim.authenticate(context._shimUserName, context._shimUserPassword, function() { queue.executeNext(); }, function() { queue.executeNext(); });
		});

		queue.enqueue(function() {
			var isInRole = _userLocalShim.isInRole('ROLE1_1');
			equal(isInRole, true, "Actual and expected values are equal");
			start();
		});

		queue.executeNext();
	});

	asyncTest("userLocalShim: isInRole - Should not found user", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			_userLocalShim.authenticate(context._shimUserNameNotInJsonFile, context._shimUserPassword, function() { queue.executeNext(); }, function() { queue.executeNext(); });
		});

		queue.enqueue(function() {
			var isInRole = _userLocalShim.isInRole('ROLE1_1');
			equal(isInRole, false, "Actual and expected values are equal");
			start();
		});

		queue.executeNext();
	});


	asyncTest("userLocalShim: isInRole - Should not found role", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			_userLocalShim.authenticate(context._shimUserName, context._shimUserPassword, function() { queue.executeNext(); }, function() { queue.executeNext(); });
		});

		queue.enqueue(function() {
			var isInRole = _userLocalShim.isInRole('ROLE_NOT_EXISTS');
			equal(isInRole, false, "Actual and expected values are equal");
			start();
		});

		queue.executeNext();
	});


	test("userLocalShim: isInRole - Fault if userName is not  defined.", 1, function() {
		throws(function() {
			_userLocalShim.isInRole('ROLE1_1');
		}, "Exception thrown");
	});


	test("userLocalShim: isInRole - Fault if roleName argument is not a string value.", 1, function() {
		throws(function() {
			_userLocalShim._userName = 'user';
			_userLocalShim.isInRole({ role: 'ROLE1_1' });
		}, "Exception thrown");
	});


	asyncTest("userLocalShim: availableRoles - Happy path", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			_userLocalShim.authenticate(context._shimUserName, context._shimUserPassword, function() { queue.executeNext(); }, function() { queue.executeNext(); });
		});

		queue.enqueue(function() {
			var roles = _userLocalShim.availableRoles();
			deepEqual(roles, ["role1_1", "role1_2"], "Actual and expected values are equal");
			start();
		});

		queue.executeNext();
	});


	asyncTest("userLocalShim: availableRoles - Should return empty array", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			_userLocalShim.authenticate(context._shimUserNameNotInJsonFile, context._shimUserPassword, function() { queue.executeNext(); }, function() { queue.executeNext(); });
		});

		queue.enqueue(function() {
			var roles = _userLocalShim.availableRoles();
			deepEqual(roles, [], "Actual and expected values are equal");
			start();
		});

		queue.executeNext();
	});

	test("userLocalShim: availableRoles - Fault if userName is not  defined.", 1, function() {
		throws(function() {
			_userLocalShim.availableRoles();
		}, "Exception thrown");
	});

}

if (typeof(UnitTestsApplication) == "undefined") {
	executeShimsTests();
}