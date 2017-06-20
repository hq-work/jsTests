if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Utilities', execute: executeUtilitiesTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeUtilitiesTests() {
	module("Utilities", {
		setup: function() {
			this.toWebAbsolutePath = function(relativePath) {
				var base = envianceSdk._private._webAppVirtualPath;
				if (base.charAt(base.length - 1) != "/") {
					base = base + "/";
				}
				return base + relativePath;
			};
			this.toRestAbsolutePath = function(relativePath) {
				var base = envianceSdk._private._baseAddress;
				if (base.charAt(base.length - 1) != "/") {
					base = base + "/";
				}
				return base + relativePath;
			};
		}
	});

	test("GroupAssignee constructor - Fault if argument missing", 1, function() {
		throws(function() {
			// ReSharper disable UnusedLocals
			var assignee = new envianceSdk.common.GroupAssignee();
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("GroupAssignee constructor - Fault if argument is empty", 1, function() {
		throws(function() {
			// ReSharper disable UnusedLocals
			var assignee = new envianceSdk.common.GroupAssignee("");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("UserAssignee constructor - Fault if argument missing", 1, function() {
		throws(function() {
			// ReSharper disable UnusedLocals
			var assignee = new envianceSdk.common.UserAssignee();
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("UserAssignee constructor - Fault if argument is empty", 1, function() {
		throws(function() {
			// ReSharper disable UnusedLocals
			var assignee = new envianceSdk.common.UserAssignee("");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("Custom fields - Scalar field constructor", 2, function() {
		var field = new envianceSdk.customFields.ScalarFieldValue("ScalarUDF", 5);

		equal(field.name, "ScalarUDF", "Field name is equal");
		deepEqual(field.values, [5], "Values are equal");
	});

	test("Custom fields - URL field constructor", 2, function() {
		var field = new envianceSdk.customFields.UrlFieldValue("UrlUDF", "Bing", "http://bing.com");

		equal(field.name, "UrlUDF", "Field name is equal");
		deepEqual(field.urlItems, [{ label: "Bing", url: "http://bing.com" }], "URL items are equal");
	});

	test("Custom fields - Date field constructor - Typed Date value", 2, function() {
		var dateValue = new Date(2012, 10, 5);
		var field = new envianceSdk.customFields.DateFieldValue("DateUDF", dateValue);

		equal(field.name, "DateUDF", "Field name is equal");
		deepEqual(field.values, [dateValue], "Values are equal");
	});

	test("Custom fields - Date field constructor - ISO string value", 2, function() {
		var field = new envianceSdk.customFields.DateFieldValue("DateUDF", "2012-11-05T17:50");

		equal(field.name, "DateUDF", "Field name is equal");
		deepEqual(field.values, [new Date(2012, 10, 5, 17, 50)], "Values are equal");
	});

	test("Custom fields - Time field constructor - US format", 2, function() {
		var field = new envianceSdk.customFields.TimeFieldValue("TimeUDF", "10:20 PM");

		var today = new Date();
		equal(field.name, "TimeUDF", "Field name is equal");
		deepEqual(field.values, [new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 20)], "Values are equal");
	});

	test("Custom fields - Time field constructor - GB format", 2, function() {
		var field = new envianceSdk.customFields.TimeFieldValue("TimeUDF", "12:30");

		var today = new Date();
		equal(field.name, "TimeUDF", "Field name is equal");
		deepEqual(field.values, [new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30)], "Values are equal");
	});

	test("Custom fields - Time field constructor - Date argument", 2, function() {
		var today = new Date();
		var field = new envianceSdk.customFields.TimeFieldValue("TimeUDF", today);

		equal(field.name, "TimeUDF", "Field name is equal");
		deepEqual(field.values, [new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes())], "Values are equal");
	});

	test("Custom fields - Time field constructor - Fault if argument is not valid time string", 1, function() {
		throws(function() {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.customFields.TimeFieldValue("TimeUDF", "2009-06-15T13:45");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("Custom fields - Linked field constructor", 2, function() {
		var field = new envianceSdk.customFields.LinkedFieldValues("LinkedUDF", ["aa", "bb"]);

		equal(field.name, "LinkedUDF", "Field name is equal");
		deepEqual(field.values, ["aa", "bb"], "Values are equal");
	});

	test("Custom fields - Multivalued field constructor", 2, function() {
		var field = new envianceSdk.customFields.MultiFieldValues("MultiUDF", [5, "abc", true]);

		equal(field.name, "MultiUDF", "Field name is equal");
		deepEqual(field.values, [5, "abc", true], "Values are equal");
	});
	
	test("Custom fields - Url field constructor - Fault if label is not assigned", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.customFields.UrlFieldValue("Name", null, "http://test.com");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});
	
	test("Custom fields - Url field constructor - Fault if label is empty string", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.customFields.UrlFieldValue("Name", "", "http://test.com");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});
	
	test("Custom fields - Url field constructor - Fault if url is not assigned", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.customFields.UrlFieldValue("Name", "Label");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("Custom fields - Url field constructor - Fault if url is empty string", 1, function () {
		throws(function () {
			// ReSharper disable UnusedLocals
			var field = new envianceSdk.customFields.UrlFieldValue("Name", "Label", "");
			// ReSharper restore UnusedLocals
		}, "Exception thrown");
	});

	test("Build web application URL - Address does not start with '/'", 1, function() {
		// Given
		var url = "NewService.svc";

		// When
		var actualUrl = envianceSdk._private._buildWebAppUrl(url);

		// Then
		var expectedUrl = this.toWebAbsolutePath(url);
		equal(actualUrl, expectedUrl, "Urls are equal");
	});

	test("Build web application URL - Address starts with '/'", 1, function() {
		// Given
		var url = "NewService.svc";

		// When
		var actualUrl = envianceSdk._private._buildWebAppUrl("/" + url);

		// Then
		var expectedUrl = this.toWebAbsolutePath(url);
		equal(actualUrl, expectedUrl, "Urls are equal");
	});

	test("Build quick link - System ID is null", 1, function() {
		// Given
		var id = createUUID();

		// When
		var oldSystemId = envianceSdk.getSystemId();
		envianceSdk.setSystemId(); // Reset system ID
		try {
			var actualLink = envianceSdk.utilities.uri.toQuickLink(id);

			// Then
			var expectedLink = this.toWebAbsolutePath("goto/home/ql/" + id);
			equal(actualLink, expectedLink, "Links are equal");
		} finally {
			envianceSdk.setSystemId(oldSystemId);
		}
	});

	test("Build quick link - System ID is not null", 1, function() {
		// Given
		var id = createUUID();
		var testSystemId = createUUID();

		// When
		var oldSystemId = envianceSdk.getSystemId();
		envianceSdk.setSystemId(testSystemId);
		try {
			var actualLink = envianceSdk.utilities.uri.toQuickLink(id);

			// Then
			var expectedLink = this.toWebAbsolutePath("goto/home/ql/" + id + "?systemId=" + testSystemId);
			equal(actualLink, expectedLink, "Link are equal");
		} finally {
			envianceSdk.setSystemId(oldSystemId);
		}
	});

	test("Build document download link by ID", 1, function() {
		// Given
		var id = createUUID();

		// When
		var actualLink = envianceSdk.utilities.uri.toDocumentDownload(id);

		// Then
		var expectedLink = this.toRestAbsolutePath("ver2/DocumentService.svc/documents/" + id + "?content");
		equal(actualLink, expectedLink, "Links are equal.");
	});

	test("Build document download link by Path", 1, function() {
		// Given
		var path = "/root folder/folder with space/file name.doc";
		var encodedPath = "/root%20folder/folder%20with%20space/file%20name.doc";

		// When
		var actualLink = envianceSdk.utilities.uri.toDocumentDownload(path);

		// Then
		var expectedLink = this.toRestAbsolutePath("ver2/DocumentService.svc/documents/" + encodedPath + "?content");
		equal(actualLink, expectedLink, "Links are equal.");
	});

	test("ISO date - Does not match if TZ specified when Z presents", 1, function() {
		ok(!envianceSdk.IsoDate.match("2012-10-20T22:10:00Z+5:00"), "Should not match value");
	});

	test("ISO date - Parse local string", 1, function() {
		var date = envianceSdk.IsoDate.parse("2012-09-10T20:37");
		deepEqual(date, new Date(2012, 8, 10, 20, 37), "Dates are equal");
	});

	test("ISO date - Parse UTC string", 1, function() {
		var date = envianceSdk.IsoDate.parse("2012-09-10T17:30Z");

		var utcDateExpected = new Date();
		utcDateExpected.setUTCFullYear(2012);
		utcDateExpected.setUTCMonth(8, 10);
		utcDateExpected.setUTCHours(17, 30, 0, 0);

		deepEqual(date, utcDateExpected, "Dates are equal");
	});

	test("ISO date - Parse - Fault if TZ hours > 23", 1, function() {
		ok(isNaN(envianceSdk.IsoDate.parse("2012-10-20T22:10:00+24:00")), "Should not parse");
	});

	test("ISO date - Parse - Fault TZ seconds > 59", 1, function() {
		ok(isNaN(envianceSdk.IsoDate.parse("2012-10-20T22:10:00+12:60")), "Should not parse");
	});

	test("ISO date - Match - Happy path", 2, function() {
		ok(envianceSdk.IsoDate.match("2012-10-20"), "Should match");
		ok(envianceSdk.IsoDate.match("2012-10-20T17:30"), "Should match");
	});

	test("ISO date - Match - Negative cases", 6, function() {
		ok(!envianceSdk.IsoDate.match(""), "Should not match");
		ok(!envianceSdk.IsoDate.match("2012"), "Should not match");
		ok(!envianceSdk.IsoDate.match("2012-10"), "Should not match");
		ok(!envianceSdk.IsoDate.match("2012-10-20T"), "Should not match");
		ok(!envianceSdk.IsoDate.match("2012-10-20T17"), "Should not match");
		ok(!envianceSdk.IsoDate.match("2012-10-20T17:"), "Should not match");
	});

	test("ISO date - Exact match - Happy path", 1, function() {
		ok(envianceSdk.IsoDate.exactMatch("2012-10-20T17:30"), "Should match");
	});

	test("ISO date - Exact match - Negative cases", 7, function() {
		ok(!envianceSdk.IsoDate.exactMatch(""), "Should not match");
		ok(!envianceSdk.IsoDate.exactMatch("2012"), "Should not match");
		ok(!envianceSdk.IsoDate.exactMatch("2012-10"), "Should not match");
		ok(!envianceSdk.IsoDate.exactMatch("2012-10-20"), "Should not match");
		ok(!envianceSdk.IsoDate.exactMatch("2012-10-20T"), "Should not match");
		ok(!envianceSdk.IsoDate.exactMatch("2012-10-20T17"), "Should not match");
		ok(!envianceSdk.IsoDate.exactMatch("2012-10-20T17:"), "Should not match");
	});

	test("ISO date - To local string", 1, function() {
		var date = new Date(2012, 8, 10, 20, 37);
		var localString = envianceSdk.IsoDate.toLocalString(date);

		equal(localString, "2012-09-10T20:37:00", "String representation matches");
	});

	test("ISO date - To UTC string", 1, function() {
		var utcDate = new Date();
		utcDate.setUTCFullYear(2012);
		utcDate.setUTCMonth(8, 10);
		utcDate.setUTCHours(17, 30, 0, 0);

		var utcString = envianceSdk.IsoDate.toUTCString(utcDate);

		equal(utcString, "2012-09-10T17:30:00Z", "String representation matches");
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeUtilitiesTests();
}