if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Eql', execute: executeEqlServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeEqlServiceTests() {
	module("EQL Service", {
		setup: function() {
			this.complianceObjectName = "UDF_facility";
			this.parameters = { TimeZone: 5, Name: "X%" };
			this.eqlQueryItemPath = "/Manual/EqlQuery/SelectFacility.eql";
			this.eqlQueryUnrestrictedItemPath = "/Manual/EqlQuery/SelectFacility.eqlx";

			this.selectComplianceObjectsQuery = function(name) {
				return "SELECT " +
					" co.ID, co.Name, co.Type, co.Path, co.WarningNotificationInbox, co.WarningNotificationEmail," +
					" co.TemplateName, co.CreatedOn, co.ActiveDate, co.InactiveDate, co.ResponsibleUser" +
					" FROM ComplianceObject co " +
					"WHERE co.Name LIKE '%" + name + "%'";
			};

			this.selectFormTemplatesQuery = "SELECT ft.ID, ft.Name, ft.Description FROM FormTemplate ft";

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			//testSystemId is key in web.config used for CI
			if (typeof testSystemId != "undefined") {
				envianceSdk.configure({ systemId: testSystemId });
			}

			this._processSuccessResult = function(response, xhr, format) {
				var processedResponse = envianceSdk._private._processResult(response, xhr);
				if (format.toString().toUpperCase() === "XML") {
					processedResponse.result = jQuery.isXMLDoc(response) ? response : jQuery.parseXML(xhr.responseText);
				}
				if (format.toString().toUpperCase() === "CSV") {
					processedResponse.result = xhr.responseText;
				}
				return processedResponse;
			};

			this._processErrorResult = function(xhr) {
				return envianceSdk._private._processError(xhr);
			};
		},
		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
		}
	});

	asyncTest("Execute - Happy path", 2, function() {
		envianceSdk.eql.execute(this.selectFormTemplatesQuery, 1, 10,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Execute - Happy path if page is more than a response results", 2, function() {
		envianceSdk.eql.execute(this.selectFormTemplatesQuery, 999, 10,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length == 0, "Row count is 0");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Execute - Happy path - Multiple resultsets - Buffered mode", 2, function() {
		envianceSdk.eql.execute("SELECT f.Name FROM Facility f\nSELECT d.Name FROM Division d", 1, 10,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				equal(response.result.length, 2, "Two resultsets present");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Execute - Happy path - Multiple resultsets - Streamed mode", 2, function() {
		envianceSdk.eql.execute("SELECT f.Name FROM Facility f\nSELECT d.Name FROM Division d", null, null,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				equal(response.result.length, 2, "Two resultsets present");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Execute - Fault if query is incorrect", 3, function() {
		envianceSdk.eql.execute("SELECT t.ID", 1, 10,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 2001, "Error number is correct");
				ok(response.error.hasOwnProperty("detailXml"), "Error has detailXml property");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Happy path - XML format", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 10, "xml",
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(jQuery.isXMLDoc(response.result), "The response is XML");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Happy path - CSV format", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 10, "csv",
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result.substring(0, 19) == "ID,Name,Description", "The response is CSV");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Happy path - Format in an arbitrary case", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 10, "jsON",
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if format argument is  not defined", 2, function() {
		var format;
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 10, format,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if format argument has invalid value", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 10, "abc",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if page argument has invalid value", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, "one", 10, "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if pageSize argument has invalid value", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, "ten", "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if page argument < 1", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 0, 10, "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if pageSize argument < 1", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 0, "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if pageSize argument > 1000", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, 1001, "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if pageSize argument is not defined", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, 1, null, "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if page argument is not defined", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, null, 1, "json",
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("ExecuteWithFormat - Fault if all arguments are not defined", 2, function() {
		envianceSdk.eql.executeWithFormat(this.selectFormTemplatesQuery, null, null, null,
			function() {
				ok(false, "failed");
				start();
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Execute - GET request - Happy path with json format", 2, function() {
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=10&format=json"),
			cache: false,
			success: function(response, textStatus, xhr) {
				equal(xhr.status, 200, "Status code is correct");
				ok(response[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			error: function() {
				ok(false, "failed");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Happy path with xml format", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=10&format=XML"),
			cache: false,
			dataType: 'xml',
			success: function(response, textStatus, xhr) {
				response = self._processSuccessResult(response, xhr, 'xml');
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(jQuery.isXMLDoc(response.result), "The response is XML");
				start();
			},
			error: function() {
				ok(false, "failed");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Happy path with csv format", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=10&format=csv"),
			cache: false,
			success: function(response, textStatus, xhr) {
				response = self._processSuccessResult(response, xhr, 'csv');
				equal(response.metadata.statusCode, 200, "Status code is correct");
				ok(response.result.substring(0, 19) == "ID,Name,Description", "The response is CSV");
				start();
			},
			error: function() {
				ok(false, "failed");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Happy page is more than a response results", 2, function() {
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=999&pagesize=10&format=json"),
			cache: false,
			success: function(response, textStatus, xhr) {
				equal(xhr.status, 200, "Status code is correct");
				ok(response[0].rows.length == 0, "Row count is 0");
				start();
			},
			error: function() {
				ok(false, "failed");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if query is incorrect", 3, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent("SELECT t.ID") + "&page=1&pagesize=10&format=json"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 2001, "Error number is correct");
				ok(response.error.hasOwnProperty("detailXml"), "Error has detailXml property");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if page argument has invalid value", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=one&pagesize=10&format=json"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if pageSize argument has invalid value", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=ten&format=json"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if format argument has invalid value", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=10&format=invalid"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Happy path if format is omitted", 2, function() {
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=10"),
			cache: false,
			success: function(response, textStatus, xhr) {
				equal(xhr.status, 200, "Status code is correct");
				ok(response[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			error: function() {
				ok(false, "failed");
				start();
			}
		});
	});


	asyncTest("Execute - GET request - Fault if page argument < 1", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=0&pagesize=10&format=json"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if pageSize argument < 1", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=0&format=json"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if pageSize argument > 1000", 2, function() {
		var self = this;
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1&pagesize=1001&format=json"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(xhr) {
				var response = self._processErrorResult(xhr);
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		});
	});


	asyncTest("Execute - GET request - Fault if page parameter is missed", 1, function() {
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&pagesize=10"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(response) {
				equal(response.status, 400, "Status code is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Fault if pageSize parameter is missed", 1, function() {
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery) + "&page=1"),
			cache: false,
			success: function() {
				ok(false, "failed");
				start();
			},
			error: function(response) {
				equal(response.status, 400, "Status code is correct");
				start();
			}
		});
	});

	asyncTest("Execute - GET request - Success if page and pageSize are missed", 2, function() {
		envianceSdk.ajax({
			type: "GET",
			url: envianceSdk._private._buildUrl('ver2/EqlService.svc/query/?eql=' + encodeURIComponent(this.selectFormTemplatesQuery)),
			cache: false,
			success: function(response, textStatus, xhr) {
				equal(xhr.status, 200, "Status code is correct");
				ok(response[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			error: function() {
				ok(false, "failed");
				start();
			}
		});
	});

	asyncTest("Helpers - Select compliance objects by name", 1, function() {
		var eql = this.selectComplianceObjectsQuery(this.complianceObjectName);
		envianceSdk.eql.execute(eql, 1, 10,
			function(response) {
				ok(response.result[0].rows.length > 0, "Row count is greater than 0");
				start();
			},
			function() {
				ok(false, "failed");
				start();
			});
	});

	asyncTest("Switch systems - Happy path", 2, function() {
		var queue = new ActionQueue(this);

		var currentSystemRows;
		queue.enqueue(function(context) {
			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					currentSystemRows = response.result[0].rows;
					queue.executeNext();
				}, context.errorHandler);
		});

		var currentSystemId, otherSystemId;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					currentSystemId = response.result.currentSystemId;

					var systems = response.result.systems;
					for (var systemId in systems) {
						if (systemId != response.result.currentSystemId) {
							otherSystemId = systemId;
							break;
						}
					}

					if (typeof otherSystemId != "undefined") {
						queue.executeNext();
					} else {
						start();
					}
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: otherSystemId });

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					notDeepEqual(response.result[0].rows, currentSystemRows, "Resultsets are not same for different systems");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: currentSystemId });

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					deepEqual(response.result[0].rows, currentSystemRows, "Resultsets are same after switching back");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Switch systems - Fault if wrong system ID", 3, function() {
		var queue = new ActionQueue(this);

		var currentSystemRows;
		queue.enqueue(function(context) {
			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					currentSystemRows = response.result[0].rows;
					queue.executeNext();
				}, context.errorHandler);
		});

		var currentSystemId;
		queue.enqueue(function (context) {
			envianceSdk.authentication.getCurrentSession(
				function(response) {
					currentSystemId = response.result.currentSystemId;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: createUUID() }); // Switch to non-existent system

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				context.successHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.configure({ systemId: currentSystemId });

			envianceSdk.eql.execute(context.selectFormTemplatesQuery, 1, 10,
				function(response) {
					deepEqual(response.result[0].rows, currentSystemRows, "Resultsets are same after switching back");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Execute - Test DateTime", 8, function() {
		var queue = new ActionQueue(this);
		var divisionName2 = envianceSdk.IsoDate.toUTCString(new Date());
		var eql = "select d.ID, d.Name, d.CreatedOn from division d "
			+ " select dd.ID, dd.Name, dd.CreatedOn from division dd where dd.name = '" + divisionName2 + "'";
		var divisionInfo = new envianceSdk.compliance.LocationInfo(divisionName2, "Division", "/");

		queue.enqueue(function (context) {
			envianceSdk.compliance.createLocation(divisionInfo,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					queue.executeNext();
				},
				function() {
					ok(false, "failed");
					queue.executeNext();
				});
		});

		var divisionIdToRemove = '';
		queue.enqueue(function (context) {
			envianceSdk.eql.execute(eql, 1, 5,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var values1 = response.result[0].rows[0].values;
					var values2 = response.result[1].rows[0].values;
					divisionIdToRemove = values2[0];

					ok(Object.prototype.toString.call(values1[1]) == "[object String]", "The String value type is correct");
					ok(Object.prototype.toString.call(values1[2]) == "[object Date]", "The DateTime value type is correct");

					equal(values2[1], divisionName2, "String value is correct");
					ok(Object.prototype.toString.call(values2[1]) == "[object String]", "The String value type is correct");
					ok(Object.prototype.toString.call(values2[2]) == "[object Date]", "The DateTime value type is correct");

					queue.executeNext();
				},
				function() {
					ok(false, "failed");
					queue.executeNext();
				});
		});

		queue.enqueue(function() {
			envianceSdk.compliance.deleteLocation(divisionIdToRemove, true,
				function(response) {
					equal(response.metadata.statusCode, 200, "Delete. Status code is correct");
					start();
				}, function() {
					ok(false, "failed");
					start();
				});
		});

		queue.executeNext();
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeEqlServiceTests();
}