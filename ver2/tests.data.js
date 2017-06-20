if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Data', execute: executeDataServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeDataServiceTests() {
	module("Data Service", {
		setup: function () {
			stop();
			this._storage = dataServiceModuleStorage.init(function () { start(); });
		},
		
		teardown: function() {
			stop();
			var self = this;
			this._storage.clearDatapoints(
				function() { start(); },
				function (response) {
					self.errorHandler(response, "error", "The Data Points cleaning is failed.");
				});
		}
	});
	
	asyncTest("Enter Numeric Data - Happy path", 29, function() {
		var completeDate1 = envianceSdk.IsoDate.parse("2012-01-01T00:00");
		var completeDate2 = envianceSdk.IsoDate.parse("2012-10-02T22:00");
		var completeDate3 = envianceSdk.IsoDate.parse("2012-10-02T22:00");
		var completeDate4 = envianceSdk.IsoDate.parse("2012-10-02T22:00");
		var dpValue1 = 23;
		var dpValue2 = 0.633999;
		var dpValue3 = 36.6;
		var dpAcronym = "reqId4testAcronym";
		var dpValue4 = 55.67;
		var locCollector = "Internal Collector";
		var globCollector = "External Collector";

		var dqt = this._storage.DQT;
		var dp1 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementTag1, completeDate1, dpValue1, null, locCollector);
		var dp2 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId1, completeDate2, dpValue2, null);
		var dp3 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId2, completeDate3, dpValue3, null);
		var dp4 = new envianceSdk.data.NumericDataPointForAcronymInfo(this._storage.requirementId4, completeDate4, dpAcronym, null);

		for (var udf in dqt) {
			this._storage.addField(dp1, dqt[udf]);
			this._storage.addField(dp2, dqt[udf]);
		}

		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			context._storage.clearDatapoints(
				function() { queue.executeNext(); },
				function (response) {
					context.errorHandler(response, "error", "The Data Points cleaning is failed.", null, true);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.data.enterNumericData([dp1, dp2, dp3, dp4], globCollector, function (response) {
				equal(response.result.status, "Succeeded", "Data Points with Quality Data created successfuly");
				queue.executeNext();
			}, context.errorHandler);

		});

		queue.enqueue(function(context) {
			context._storage.loadDataPoints(
				[context._storage.requirementId1, context._storage.requirementId2, context._storage.requirementId4],
				function(response) {
					var datapoints = context._storage._convertEqlResponse(response, 0);
					equal(datapoints.length, 4, "Data Points count equal");

					function testResultData(requirementId, completeDate, dpValue, collector) {
						var actualDp = context._storage.findDatapoint(datapoints, requirementId, completeDate, context.errorHandler);
						equal(actualDp.value, dpValue, "Data Point Value equal");
						deepEqual(actualDp.completeDate, completeDate, "Complete Date are equal.");
						equal(actualDp.collector, collector, "Data Point Collector equal");
						return actualDp;
					}

					var actualDp1 = testResultData(context._storage.requirementId1, completeDate1, dpValue1, locCollector);
					testResultData(context._storage.requirementId1, completeDate2, dpValue2, globCollector);
					testResultData(context._storage.requirementId2, completeDate3, dpValue3, globCollector);
					var actualDp4 = testResultData(context._storage.requirementId4, completeDate4, dpValue4, globCollector);

					equal(actualDp4.value, dpValue4, "Acronym Value equal");

					//This is a mock
					//TODO: redesign to eql data quality usage when will support
					for (var udfName in dqt) {
						actualDp1[udfName] = dqt[udfName];
					}
					var todoMsg = " (TODO: this test should be changed to eql value usage when will support!)";
					//---------------------------------------------------

					for (var cf in dqt) {
						if (dqt[cf].type == 'scalar') {
							equal(actualDp1[cf].value, dqt[cf].value, "DQT: " + dqt[cf].name + " value equal." + todoMsg);
						}
						if (dqt[cf].type == 'linked') {
							deepEqual(actualDp1[cf].value, dqt[cf].value, "DQT: " + dqt[cf].name + " value equal." + todoMsg);
						}
					}
					start();
				},
				context.errorHandler
			);

		});

		queue.executeNext();
	});
	
	asyncTest("Enter Numeric Data Async - Happy path", 1, function () {
		var completeDate1 = envianceSdk.IsoDate.parse("2012-01-01T00:00");
		var completeDate2 = envianceSdk.IsoDate.parse("2012-10-02T22:00");
		var completeDate3 = envianceSdk.IsoDate.parse("2012-10-02T22:00");
		var dpValue1 = 23;
		var dpValue2 = 0.633999;
		var dpValue3 = 36.6;

		var dqt = this._storage.DQT;
		var dp1 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementTag1, completeDate1, dpValue1, null);
		var dp2 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId1, completeDate2, dpValue2, null);
		var dp3 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId2, completeDate3, dpValue3, null);

		for (var udf in dqt) {
			this._storage.addField(dp1, dqt[udf]);
			this._storage.addField(dp2, dqt[udf]);
		}

		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			context._storage.clearDatapoints(
				function () { queue.executeNext(); },
				function (response) {
					context.errorHandler(response, "error", "The Data Points cleaning is failed.", null, true);
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			envianceSdk.data.enterNumericDataAsync([dp1, dp2, dp3], function (response) {
				equal(response.result.length, 36, "Enter Numeric Data Async is called successfuly");
				start();
			}, context.errorHandler);

		});

		queue.executeNext();
	});

	asyncTest("Enter Numeric Data - Save duplicate (by Complete Date) datapoints", 2, function() {
		var queue = new ActionQueue(this);
		var completeDate = envianceSdk.IsoDate.parse("2012-10-01T00:00");
		var datapoints = [new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, completeDate, 100, null),
			new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, completeDate, 10, null)];

		queue.enqueue(function(context) {
			envianceSdk.data.enterNumericData(datapoints, function(response) {
				equal(response.result.status, "Succeeded", "Duplicate Data Points created successfuly");
				queue.executeNext();
			}, context.errorHandler);

		});

		queue.enqueue(function(context) {
			envianceSdk.data.enterNumericData([datapoints[0]], function(response) {
				equal(response.result.status, "Succeeded", "Duplicate Data Points created successfuly");
				start();
			}, context.errorHandler);

		});
		queue.executeNext();
	});
	
	asyncTest("Enter Numeric Data - Save multiple datapoints by single tag", 1, function () {
		var completeDate1 = envianceSdk.IsoDate.parse("2013-10-10T00:01");
		var completeDate2 = envianceSdk.IsoDate.parse("2013-10-10T00:02");
		var completeDate3 = envianceSdk.IsoDate.parse("2013-10-10T00:03");
		var dp1 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementTag1, completeDate1, 10.01, null);
		var dp2 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementTag1, completeDate2, 10.02, null);
		var dp3 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementTag1, completeDate3, 10.03, null);
		
		var datapoints = [dp1,dp2,dp3];

		envianceSdk.data.enterNumericData(datapoints, function (response) {
			equal(response.result.status, "Succeeded", "Duplicate Data Points created successfuly");
			start();
		}, this.errorHandler);
		
	});

	asyncTest("Enter Numeric Data - Fault if data point value is null", 2, function() {
		var dp = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, envianceSdk.IsoDate.parse("1989-02-01T00:00"), null, null);

		envianceSdk.data.enterNumericData([dp], this.successHandler, function(response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 6005, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Enter Numeric Data - Fault if data point complete date < 1753-01-01", 2, function() {
		var dp1 = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, envianceSdk.IsoDate.parse("1752-12-31T23:00"), 10, null);

		envianceSdk.data.enterNumericData([dp1], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Enter Numeric Data - Fault if data point complete date is null", 2, function() {
		var dp = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, null, 10, null);

		envianceSdk.data.enterNumericData([dp], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 500, "Status code OK.");
			equal(response.error.errorNumber, 0, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Enter Numeric Data - Fault on Properties Validate: Custom Field cannot be found in DQT", 2, function() {
		var completeDate = envianceSdk.IsoDate.parse("2000-01-01T00:00");
		var dp = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, completeDate, 100, null)
			.addScalarFieldValue('invalid_udf_name', 100);

		envianceSdk.data.enterNumericData([dp], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});


	asyncTest("Enter Numeric Data - Fault on Properties Validate: Custom Field already specified", 2, function() {
		var completeDate = envianceSdk.IsoDate.parse("2000-01-01T00:00");
		var dp = new envianceSdk.data.NumericDataPointInfo(this._storage.requirementId3, completeDate, 100, null)
			.addScalarFieldValue(this._storage.DQT.udf_num_txtbox.name, 10.1)
			.addScalarFieldValue(this._storage.DQT.udf_num_txtbox.name, 100.1);

		envianceSdk.data.enterNumericData([dp], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Enter Numeric Data - Fault if Parameter Requirement Tag not exists", 2, function() {
		var dp = new envianceSdk.data.NumericDataPointInfo('inavlid_parameter_requirement_tag', envianceSdk.IsoDate.parse("2001-01-01T00:00"), 0.02, null);

		envianceSdk.data.enterNumericData([dp], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 404, "Status code OK.");
			equal(response.error.errorNumber, 102, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Enter Numeric Data - Fault if Parameter Requirement not exists", 2, function() {
		var dp = new envianceSdk.data.NumericDataPointInfo('B95DC235-2465-40DA-AA23-D042A02CFA01', envianceSdk.IsoDate.parse("2001-01-01T00:00"), 0.102, null);

		envianceSdk.data.enterNumericData([dp], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 404, "Status code OK.");
			equal(response.error.errorNumber, 102, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Enter Numeric Data - Fault if datapoints conatiner is an empty", 2, function() {
		envianceSdk.data.enterNumericData([], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Happy path", 6, function() {
		var queue = new ActionQueue(this);
		var startCompleteDate = envianceSdk.IsoDate.parse("2014-01-01T00:00");
		var endCompleteDate = envianceSdk.IsoDate.parse("2014-01-31T00:00");

		//Clear datapoints. 
		queue.enqueue(function(context) {
			context._storage.clearDatapoints(
				function() { queue.executeNext(); },
				function (response) {
					context.errorHandler(response, "error", "The Data Points cleaning is failed.", null, true);
					queue.executeNext();
				});
		});

		//Prepare Data
		var datapoints1 = this._storage.getNumericDataPointRange(this._storage.requirementId1, startCompleteDate, endCompleteDate, 72);
		var datapoints2 = this._storage.getNumericDataPointRange(this._storage.requirementId2, startCompleteDate, endCompleteDate, 80);
		var datapoints3 = this._storage.getNumericDataPointRange(this._storage.requirementId3, startCompleteDate, endCompleteDate, 120);

		queue.enqueue(function(context) {
			envianceSdk.data.enterNumericData(datapoints1.concat(datapoints2, datapoints3),
				function(response) {
					equal(response.result.status, "Succeeded", "Data Points created successfuly");
					queue.executeNext();
				},
				context.errorHandler);
		});

		//Delete datapoint ranges
		var ranges = [
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementTag1, startCompleteDate, endCompleteDate),
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementTag1, envianceSdk.IsoDate.parse("2013-10-10T00:00"), envianceSdk.IsoDate.parse("2013-10-10T00:04")),
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId2, startCompleteDate, datapoints1[1].completeDate),
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, datapoints3[datapoints3.length - 2].completeDate, new Date(endCompleteDate.getTime() + 1000 * 60))];

		queue.enqueue(function(context) {
			envianceSdk.data.deleteNumericData(ranges,
				function(response) {
					equal(response.result.status, "Succeeded", "Data Points deleted successfuly");
					queue.executeNext();
				},
				context.errorHandler);
		});

		//Check data points count after deleting
		queue.enqueue(function(context) {
			context._storage.loadDataPoints(
				[context._storage.requirementId1, context._storage.requirementId2, context._storage.requirementId3],
				function(response) {
					var datapoints = context._storage._convertEqlResponse(response, 0);
					equal(datapoints.length, 15, "Total Data Points count equal");
					equal(context._storage.countDatapoints(datapoints, context._storage.requirementId1), 1, "Data Points of range 1 count equal");
					equal(context._storage.countDatapoints(datapoints, context._storage.requirementId2), 9, "Data Points of range 2 count equal");
					equal(context._storage.countDatapoints(datapoints, context._storage.requirementId3), 5, "Data Points of range 2 count equal");
					start();
				},
				context.errorHandler
			);
		});

		queue.executeNext();
	});

	asyncTest("Delete Numeric Data Async - Happy path", 2, function () {
		var queue = new ActionQueue(this);
		var startCompleteDate = envianceSdk.IsoDate.parse("2014-01-01T00:00");
		var endCompleteDate = envianceSdk.IsoDate.parse("2014-01-31T00:00");

		//Clear datapoints. 
		queue.enqueue(function (context) {
			context._storage.clearDatapoints(
				function () { queue.executeNext(); },
				function (response) {
					context.errorHandler(response, "error", "The Data Points cleaning is failed.", null, true);
					queue.executeNext();
				});
		});

		//Prepare Data
		var datapoints1 = this._storage.getNumericDataPointRange(this._storage.requirementId1, startCompleteDate, endCompleteDate, 72);
		var datapoints2 = this._storage.getNumericDataPointRange(this._storage.requirementId2, startCompleteDate, endCompleteDate, 80);
		var datapoints3 = this._storage.getNumericDataPointRange(this._storage.requirementId3, startCompleteDate, endCompleteDate, 120);

		queue.enqueue(function (context) {
			envianceSdk.data.enterNumericData(datapoints1.concat(datapoints2, datapoints3),
				function (response) {
					equal(response.result.status, "Succeeded", "Data Points created successfuly");
					queue.executeNext();
				},
				context.errorHandler);
		});

		//Delete datapoint ranges
		var ranges = [
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementTag1, startCompleteDate, endCompleteDate),
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementTag1, envianceSdk.IsoDate.parse("2013-10-10T00:00"), envianceSdk.IsoDate.parse("2013-10-10T00:04")),
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId2, startCompleteDate, datapoints1[1].completeDate),
			new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, datapoints3[datapoints3.length - 2].completeDate, new Date(endCompleteDate.getTime() + 1000 * 60))];

		queue.enqueue(function (context) {
			envianceSdk.data.deleteNumericDataAsync(ranges,
				function (response) {
					equal(response.result.length, 36, "Delete Numeric Data Async is called successfuly");
					start();
				},
				context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Delete Numeric Data - Fault if Start Date > End Date of range", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, new Date(2012, 1, 1), new Date(2012, 1, 1))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function(response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 6002, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});


	asyncTest("Delete Numeric Data - Fault if Start Date is null", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, null, new Date(2012, 1, 1))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function (response) {
			equal(response.metadata.statusCode, 500, "Status code OK.");
			equal(response.error.errorNumber, 0, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Fault if Start Date < 1753-01-01", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, envianceSdk.IsoDate.parse("1752-12-31T23:00"), new Date(2012, 1, 1))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Fault if End Date is null", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, null, new Date(2012, 1, 1))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function (response) {
			equal(response.metadata.statusCode, 500, "Status code OK.");
			equal(response.error.errorNumber, 0, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Fault if End Date > 9999-12-31", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo(this._storage.requirementId3, new Date(2012, 1, 1), envianceSdk.IsoDate.parse("9999-12-31T23:59"))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Fault if Parameter Requirement not exists", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo('B95DC235-2465-40DA-AA23-D042A02CFA02', new Date(1999, 1, 1), new Date(1999, 1, 10))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function (response) {
			equal(response.metadata.statusCode, 404, "Status code OK.");
			equal(response.error.errorNumber, 102, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Fault if Parameter Requirement Tag not exists", 2, function() {
		var ranges = [new envianceSdk.data.NumericDataRangeInfo('inavlid_parameter_requirement_tag', new Date(1999, 1, 1), new Date(1999, 1, 10))];

		envianceSdk.data.deleteNumericData(ranges, this.successHandler, function (response) {
			equal(response.metadata.statusCode, 404, "Status code OK.");
			equal(response.error.errorNumber, 102, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	asyncTest("Delete Numeric Data - Fault if data range container is an empty", 2, function() {
		envianceSdk.data.deleteNumericData([], this.successHandler, function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Error number OK. The error message: " + response.error.message);
			start();
		});
	});

	var DataServiceModuleStorage = function() {
		this._initialized = false;

		this.requirementTag1 = null; //Parameter Requirement with Data Quality Template with all UDFs - 1
		this.requirementId1 = null; //Parameter Requirement with Data Quality Template with all UDFs - 1
		this.requirementId2 = null; //Parameter Requirement with Data Quality Template with all UDFs - 2
		this.requirementId3 = null; //Parameter Requirement with Data Quality Template with all UDFs - 3
		this._requirementNamePattern = 'Parameter Requirement with Data Quality Template with all UDFs';

		this.DQT = {
			//udf_calc: "XLS_kio_calc",
			udf_num_ddl_tvh: { name: "XLS_kio_num_ddl_tvh", value: "0.01", type: 'scalar' },
			udf_num_ddl: { name: "XLS_kio_num_ddl1", value: "0.01", type: 'scalar' },
			udf_num_ddl_linklist: { name: "XLS_kio_num_ddl2_linklist", value: ["200.02", "20.05"], type: 'linked' },
			udf_num_numlookup_tvh: { name: "XLS_kio_num_numlookup_tvh", value: "0.01", type: 'scalar' },
			udf_num_numlookup: { name: "XLS_kio_num_numlookup1", value: "12:00", type: 'scalar' },
			udf_num_numlookup_linklist: { name: "XLS_kio_num_numlookup2_linklist", value: ["8/8/88", "9/9/99"], type: 'linked' },
			udf_num_txtbox: { name: "XLS_kio_num_txtbox", value: "36.6", type: 'scalar' },
			udf_num_txtbox_tvh: { name: "XLS_kio_num_txtbox_tvh", value: "0.1000999", type: 'scalar' },
			udf_bool_cb: { name: "XLS_kio_true-false_checkbox", value: "True", type: 'scalar' },
			udf_bool_cb_tvh: { name: "XLS_kio_true-false_checkbox_tvh", value: "False", type: 'scalar' },
			udf_bool_ddl: { name: "XLS_kio_true-false_ddl", value: "Yes", type: 'scalar' },
			udf_bool_ddl_tvh: { name: "XLS_kio_true-false_ddl_tvh", value: "True :)", type: 'scalar' },
			udf_txt_box_small: { name: "XLS_kio_txt_txt_box_small", value: "text val 1", type: 'scalar' },
			udf_txt_box_small_tvh: { name: "XLS_kio_txt_txt_box_small_tvh", value: "text tvh val 1", type: 'scalar' }
		};
	};

	DataServiceModuleStorage.prototype = {
		init: function(onReadyState) {
			if (this._initialized) {
				onReadyState();
				return this;
			}

			var self = this;
			var queue = new ActionQueue(this);

			queue.enqueue(function(context) {
				self.loadRequirements(
					function(response) {
						var reqs = self._convertEqlResponse(response, 0);
						if (reqs.length < 4) {
							throw new Error('Error: no test parameter requirements (' + this._requirementNamePattern + ')');
						}
						self.requirementTag1 = reqs[0].tag;
						self.requirementId1 = reqs[0].id;
						self.requirementId2 = reqs[1].id;
						self.requirementId3 = reqs[2].id;
						self.requirementId4 = reqs[3].id;
						queue.executeNext();
					},
					function(response, status, message) {
						ok(false, "Parameter Requirements loading is failed.");
						context.errorHandler(response, status, message, null, true);
						queue.executeNext();
					});
			});

			queue.enqueue(function (context) {
				self._initialized = true;
				onReadyState();
			});

			queue.executeNext();
			return this;
		},

		addField: function(numericDataPoint, udf) {
			if (udf.type == 'scalar') {
				numericDataPoint.addScalarFieldValue(udf.name, udf.value);
				return;
			}
			if (udf.type == 'linked') {
				numericDataPoint.addLinkedFieldValues(udf.name, udf.value);
				return;
			}
			throw new Error("The invalid udf type " + type);
		},

		findDatapoint: function(datapoints, requirementId, completeDate, onnotfound) {
			for (var i = 0; i < datapoints.length; i++) {
				var dp = datapoints[i];
				if (dp.requirementId == requirementId && dp.completeDate.toString() == completeDate.toString()) {
					return dp;
				}
			}
			if (onnotfound) onnotfound();
			return null;
		},

		countDatapoints: function(datapoints, requirementId) {
			var result = 0;
			for (var i = 0; i < datapoints.length; i++) {
				var dp = datapoints[i];
				if (dp.requirementId == requirementId) {
					result++;
				}
			}
			return result;
		},

		clearDatapoints: function(onsuccess, onerror) {
			var startDate = envianceSdk.IsoDate.parse("1753-01-01T00:00:00");
			var endDate = envianceSdk.IsoDate.parse("9999-12-31T00:00:00");
			var ranges = [new envianceSdk.data.NumericDataRangeInfo(this.requirementId1, startDate, endDate),
				new envianceSdk.data.NumericDataRangeInfo(this.requirementId2, startDate, endDate),
				new envianceSdk.data.NumericDataRangeInfo(this.requirementId3, startDate, endDate),
				new envianceSdk.data.NumericDataRangeInfo(this.requirementId4, startDate, endDate)];

			envianceSdk.data.deleteNumericData(ranges, onsuccess, onerror);
		},

		loadRequirements: function(onsuccess, onerror) {
			var eql = "select top 4 co.id, co.\"Unique Tag\" as tag from ComplianceObject co where co.Name like '%" + this._requirementNamePattern + "%' and co.Type = 'R' order by co.Name";
			envianceSdk.eql.execute(eql, 1, 10, onsuccess, onerror);
		},

		loadDataPoints: function(requirementIds, onsuccess, onerror) {
			var strRequirementIds = "'" + requirementIds.join("' ,'") + "'";
			var eql = "select dp.id, dp.value, localtime(dp.Collected, tz) as completeDate, r.id as requirementId, dp.collector from Facility f "
				+ "join TimeZone tz on f "
				+ "join Requirement r on r is under f "
				+ "join DataPoint dp on r "
				+ "where r.id in (" + strRequirementIds + ") "
				+ "order by r.Name ";

			envianceSdk.eql.execute(eql, 1, 100, onsuccess, onerror);
		},

		getNumericDataPointRange: function(requirement, startDate, endDate, stepInHours) {
			var step = 1000 * 60 * 60 * stepInHours;
			var range = [];
			var date = startDate;
			while (date <= endDate) {
				range.push(new envianceSdk.data.NumericDataPointInfo(requirement, date, Math.random(), null));
				date = new Date(date.getTime() + step);
			}
			return range;
		},

		//FYI: this method convert eql response to [{column_1: rowValue_1_1, ... {column_N: rowValue_1_N}, ...] object.
		_convertEqlResponse: function(response, batchIndex) {
			var result = [];
			var batch = response.result[batchIndex];

			for (var i = 0; i < batch.rows.length; i++) {
				var row = batch.rows[i];
				var obj = { };
				for (var j = 0; j < row.values.length; j++) {
					obj[batch.columns[j].name] = row.values[j];
				}
				result.push(obj);
			}
			return result;
		}
	};

	var dataServiceModuleStorage = new DataServiceModuleStorage();
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeDataServiceTests();
}