if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Packages Infrastructure', execute: executeWebInfrastructureTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeWebInfrastructureTests() {
	module("Web.Infrastructure", {
		setup: function () {
		},
		teardown: function() {
		}
	});


	test("Load Package Configuration File - Happy path", 1, function() {
		var packageConfig = {
			"key1": { "value": "value1", "description": "Description 1." },
			"key2": { "value": "value2", "description": "Description 2." }
		};
		deepEqual(envianceSdk.packages.packageConfig, packageConfig, "Actual and expected values are equal");
	});
	

	test("Get package item file - Ensure HTML Package Item caching", 1, function () {
		var url = envianceSdk._private._buildWebAppUrl("/CustomApp/" + envianceSdk._private._packageId + "/Manual/index.htm");
		var self = this;
		var status304Count = 0;
		for (var i = 0; i < 10 && status304Count == 0; i++) {
			jQuery.ajax({
				type: "GET",
				url: url,
				async: false,
				ifModified: true,
				success: function (data, textStatus, jqXhr) {
					if (jqXhr.status == 304) {
						status304Count++;
					}
				},
				error: function (jqXhr, textStatus, errorThrown) {
					self.errorHandlerAjax(jqXhr, textStatus, errorThrown, true);
					i = 10;
				}
			});
		}

		ok(status304Count > 0 , "304 HTTP Status received.");
	});
	
	test("Get package item file - Ensure EQL Package Item Not cached", 1, function () {
		var url = envianceSdk._private._buildWebAppUrl("/CustomApp/" + envianceSdk._private._packageId + "/Manual/EqlQuery/SelectFacility.eql") + "?TimeZone=5&Name=X%25";
		var self = this;
		var status304Count = 0;
		for (var i = 0; i < 10 && status304Count == 0; i++) {
			jQuery.ajax({
				type: "GET",
				url: url,
				async: false,
				ifModified: true,
				success: function (data, textStatus, jqXhr) {
					if (jqXhr.status == 304) {
						status304Count++;
					}
				},
				error: function (jqXhr, textStatus, errorThrown) {
					self.errorHandlerAjax(jqXhr, textStatus, errorThrown, true);
					i = 10;
				}
			});
		}

		ok(status304Count == 0, "EQL Package Item Not cached");
	});

	test("Get package item file - Ensure EQLX Package Item Not cached", 1, function () {
		var url = envianceSdk._private._buildWebAppUrl("/CustomApp/" + envianceSdk._private._packageId + "/Manual/EqlQuery/SelectFacility.eqlx") + "?TimeZone=5&Name=X%25";
		var self = this;
		var status304Count = 0;
		for (var i = 0; i < 10 && status304Count == 0; i++) {
			jQuery.ajax({
				type: "GET",
				url: url,
				async: false,
				ifModified: true,
				success: function (data, textStatus, jqXhr) {
					if (jqXhr.status == 304) {
						status304Count++;
					}
				},
				error: function (jqXhr, textStatus, errorThrown) {
					self.errorHandlerAjax(jqXhr, textStatus, errorThrown, true);
					i = 10;
				}
			});
		}

		ok(status304Count == 0, "EQLX Package Item Not cached");
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeWebInfrastructureTests();
}
