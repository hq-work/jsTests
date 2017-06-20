if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Packages stored EQL query', execute: executeWebEqlServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeWebEqlServiceTests() {
	module("EQL Service - HTTP handler", {
		setup: function () {
			this.queryParameters = { TimeZone: 5, Name: "X%" };
			this.eqlQueryItemPath = "/Manual/EqlQuery/SelectFacility.eql";
			this.eqlQueryUnrestrictedItemPath = "/Manual/EqlQuery/SelectFacility.eqlx";

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			//testSystemId is key in web.config used for CI
			if (typeof testSystemId != "undefined") {
				envianceSdk.configure({ systemId: testSystemId });
			}
		},
		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
		}
	});

	asyncTest("Execute EQL item - Happy path", 2, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "json", 1, 50);
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			self.errorHandler);
	});

	asyncTest("Execute EQL item - Happy path - Unrestricted query", 2, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryUnrestrictedItemPath, "json", 1, 50);
		var self = this;
		
		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			self.errorHandler);
	});

	asyncTest("Execute EQL item - Happy path - XML format", 2, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "xml", 1, 50);
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(jQuery.isXMLDoc(response.result), "The response is XML");
				start();
			},
			self.errorHandler);
	});

	asyncTest("Execute EQL item - Happy path - CSV format", 2, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "csv", 1, 50);
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				equal(response.result.substring(0, 36), "Name,FacilityName,CreatedOn,TimeZone", "The response is CSV");
				start();
			},
			self.errorHandler);
	});

	asyncTest("Execute EQL item - Happy path - 'format' is omitted", 2, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, null, 1, 50);
		delete executeParameters.format;
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			self.errorHandler);
	});

	asyncTest("Execute EQL item - Happy path - 'page' and 'pageSize' are omitted", 2, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "json");
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code matches");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			self.errorHandler);
	});

	test("Execute EQL item - Fault if 'executeParameters' argument is null", 1, function() {
		throws(function() {
			envianceSdk.packages.eql.executeEqlItem(null, this.queryParameters,
				function() {
					ok(false, "failed");
				},
				function() {
					ok(false, "failed");
				});
		}, "Exception thrown");
	});

	test("Execute EQL item - Fault if 'executeParameters' argument is not an object", 1, function() {
		throws(function() {
			envianceSdk.packages.eql.executeEqlItem(this.eqlQueryItemPath, this.queryParameters,
				function() {
					ok(false, "failed");
				},
				function() {
					ok(false, "failed");
				});
		}, "Exception thrown");
	});

	test("Execute EQL item - Fault if 'executeParameters.path' argument is null", 1, function() {
		throws(function() {
			envianceSdk.packages.eql.executeEqlItem({ path: null }, this.queryParameters,
				function() {
					ok(false, "failed");
				},
				function() {
					ok(false, "failed");
				});
		}, "Exception thrown");
	});

	asyncTest("Execute EQL item - Fault if 'format' has invalid value", 1, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "jsn", 1, 50);
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				start();
			});
	});

	asyncTest("Execute EQL item - Fault if 'pageSize' is omitted", 1, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "json", 1);
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				start();
			});
	});


	asyncTest("Execute EQL item - Fault if 'pageSize' > 1000", 1, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo(this.eqlQueryItemPath, "json", 1, 1001);
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				start();
			});
	});

	asyncTest("Execute EQL item - Fault if item content is invalid", 1, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo("/Manual/EqlQuery/JsonBroken.eql");
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				start();
			});
	});

	asyncTest("Execute EQL item - Fault if EQL is invalid", 1, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo("/Manual/EqlQuery/EqlBroken.eql");
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				start();
			});
	});

	asyncTest("Execute EQL item - Fault if item not found", 1, function() {
		var executeParameters = new envianceSdk.packages.eql.ExecuteParametersInfo("/Manual/EqlQuery/NotExisted.eql");
		var self = this;

		envianceSdk.packages.eql.executeEqlItem(executeParameters, this.queryParameters,
		self.errorHandler,
		function(response) {
			equal(response.metadata.statusCode, 404, "Status code is correct");
			start();
		});
	});

	asyncTest("Execute EQL item - Fault if HTTP verb is not supported", 1, function() {
		var url = envianceSdk._private._buildWebAppUrl("/CustomApp/" + envianceSdk._private._packageId + this.eqlQueryItemPath);
		var self = this;
		
		jQuery.ajax({
			type: "DELETE",
			url: url,
			async: true,
			cache: false,
			success: self.errorHandlerAjax,
			error: function(response) {
				equal(response.status, 405, "Status code is correct");
				start();
			}
		});
	});

	asyncTest("Execute EQL item - Happy path - GET request", 1, function() {
		var url = envianceSdk._private._buildWebAppUrl("/CustomApp/" + envianceSdk._private._packageId + this.eqlQueryItemPath) +
			"?TimeZone=5&Name=X%25";
		var self = this;
		
		jQuery.ajax({
			type: "GET",
			url: url,
			async: true,
			cache: false,
			success: function(response) {
				ok(response[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			error: self.errorHandlerAjax
		});
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeWebEqlServiceTests();
}