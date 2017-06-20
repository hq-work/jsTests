if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Data Calc Periods', execute: executeDataCalcPeriodsTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

function executeDataCalcPeriodsTests() {
	module("Data Calc Periods", {
		setup: function () {
			this.initUserTimeZone = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.authentication.getCurrentSession(
						function (response) {
							context.tz = response.result.userTimeZone;
							window.userTimeZone = response.result.userTimeZone;
							queue.executeNext();
						}, context.errorHandler);
				});
			};
			
			this._ajaxNoPostprocess = function (envianceSdk, ajaxSettings, onsuccess, onerror) {
					var settings = {};
					var headers = envianceSdk._private._buildRequestHeaders();

					var commonSettings = {
						contentType: "application/json; charset=UTF-8",
						headers: headers,
						success: function(data, textStatus, jqXhr) {
							if (onsuccess) {
								onsuccess(data, textStatus, jqXhr);
							}
						},
						error: function(jqXhr, textStatus, errorThrown) {
							var resubmitCallback = function() {
								_ajaxNoPostprocess(envianceSdk, ajaxSettings, onsuccess, onerror);
							};

							if (envianceSdk._private._errorHandler.handle(jqXhr, textStatus, resubmitCallback)) {
								return;
							}

							if (onerror) {
								onerror(envianceSdk._private._processError(jqXhr), textStatus, errorThrown);
							}
						}
					};

					jQuery.extend(settings, commonSettings, ajaxSettings);

					if (envianceSdk._private._crossDomain.isRequired(settings.url)) {
						return envianceSdk._private._crossDomain.ajax(settings);
					} else {
						jQuery.extend(settings, {
							async: true,
							crossdomain: false,
							cache: false,
							xhrFields: {
								withCredentials: true
							},
							beforeSend: function(xhr) {
								xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
							}
						});

						return jQuery.ajax(settings);
					}
				};

			this.getUTCDateTime = function () {
				var date = new Date();
				return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
			};

		
			this.FindDstOnSwitchDateString = function (year) {

				var month = 0;
				var lastOffset = 99;

				// Loop through every month of the current year
				for (var i = 0; i < 12; i++) {
					// Fetch the timezone value for the month
					var newDateThisYear = new Date(Date.UTC(year, i, 0, 0, 0, 0, 0));
					var tz = -1 * newDateThisYear.getTimezoneOffset() / 60;
					if (tz > lastOffset) {
						month = i - 1;
					}
					lastOffset = tz;
				}

				// Set the starting date
				var baseDate = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0));
				var changeDay = 0;
				var changeMinute = -1;
				var baseOffset = -1 * baseDate.getTimezoneOffset() / 60;
				var dstDate;

				// Loop to find the exact day a timezone adjust occurs
				for (var day = 0; day < 50; day++) {
					var tmpDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
					var tmpOffset = -1 * tmpDate.getTimezoneOffset() / 60;

					// Check if the timezone changed from one day to the next
					if (tmpOffset != baseOffset) {
						var minutes = 0;
						changeDay = day;

						// Back-up one day and grap the offset
						tmpDate = new Date(Date.UTC(year, month, day - 1, 0, 0, 0, 0));
						tmpOffset = -1 * tmpDate.getTimezoneOffset() / 60;

						// Count the minutes until a timezone chnage occurs
						while (changeMinute == -1) {
							tmpDate = new Date(Date.UTC(year, month, day - 1, 0, minutes, 0, 0));
							tmpOffset = -1 * tmpDate.getTimezoneOffset() / 60;

							// Determine the exact minute a timezone change
							// occurs
							if (tmpOffset != baseOffset) {
								// Back-up a minute to get the date/time just
								// before a timezone change occurs
								tmpOffset = new Date(Date.UTC(year, month, day - 1, 0, minutes - 1, 0, 0));
								changeMinute = minutes;
								break;
							}
							else
								minutes++;
						}

						// Capture the time stamp
						tmpDate = new Date(Date.UTC(year, month, day - 1, 0, minutes - 1, 0, 0));
						var tmpMinutes = tmpDate.getMinutes();
						var tmpHours = tmpDate.getHours();

						if (tmpMinutes == 59) {
							tmpMinutes = 0;
							tmpHours += 1;
						}

						if (tmpHours > 23) {
							tmpHours = 0;
							tmpOffset = new Date(tmpOffset.getFullYear(), tmpOffset.getMonth(), tmpOffset.getDate() + 1);
						}

						dstDate = year + "-" + ("0" + (tmpOffset.getMonth() + 1)).slice(-2) + "-" + ("0" + tmpOffset.getDate()).slice(-2) + "T" + ("0" + tmpHours).slice(-2) + ":" + ("0" + tmpMinutes).slice(-2) + ":00";
						return dstDate;
					}
				}
				return null;

			};

			this.ThisYearDstSwitchOnDate =  "2015-03-29T03:00:00"; // Kyiv TZ	
			this.NextYearDstSwitchOnDate = "2016-03-27T03:00:00"; // Kyiv TZ
			
		},
		teardown: function () {
		}
	});

	asyncTest("Calc Numeric Date Range - Begin Current CalendarMonth End Current CalendarMonth. Should Exclude End Date", 3, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);
		
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Current",
					"periodType": "CalendarMonth"
				},
				end: {
					"relativity": "Current",
					"periodType": "CalendarMonth"
				}
			}
			, function (response) {
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				
				var currentMonthBegin = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), 1);
				var currentMonthEnd = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth() + 1, 1);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				deepEqual(response.result.beginDate, currentMonthBegin, "Begin Dates are equal.");
				deepEqual(response.result.endDate, currentMonthEnd, "End Dates are equal.");
				start();
			}, context.errorHandler);
		});
		queue.executeNext();

	});

	asyncTest("Calc Numeric Date Range - Begin Current CalendarMonth and End Current CalendarYear. Should Exclude Last Year Date", 3, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Current",
					"periodType": "CalendarMonth"
				},
				end: {
					"relativity": "Current",
					"periodType": "CalendarYear"
				}
			}
			, function (response) {
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var currentMonthBegin = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), 1);
				var endYearDate = new Date(currentUserTimeZoneDate.getFullYear() + 1, 0, 1);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				deepEqual(response.result.beginDate, currentMonthBegin, "Begin Dates are equal.");
				deepEqual(response.result.endDate, endYearDate, "End Dates are equal.");
				start();
			}, context.errorHandler);
		});
		queue.executeNext();

	});
	
	asyncTest("Calc Numeric Date Range -  Begin Absolute Date DST Switch on This Year and End Absolute End Date DST Switch on Next Year. No DST correction on Server Side.", 3, function () {
		var queue = new ActionQueue(this);
		var self = this;
		
		var thisYear = (new Date()).getFullYear();
		var thisYearDstSwitchOnDate = this.FindDstOnSwitchDateString(thisYear);
		if (thisYearDstSwitchOnDate != null) {
			this.ThisYearDstSwitchOnDate = thisYearDstSwitchOnDate;
		}
		var nextYearDstSwitchOnDate = this.FindDstOnSwitchDateString(thisYear + 1);
		if (nextYearDstSwitchOnDate != null) {
			this.NextYearDstSwitchOnDate = nextYearDstSwitchOnDate;
		}

		var inputData = {
			start: {
				"relativity": "Absolute",
				"absoluteDate": this.ThisYearDstSwitchOnDate
			},
			end: {
				"relativity": "Absolute",
				"absoluteDate": this.NextYearDstSwitchOnDate
			}
		};

		queue.enqueue(function(context) {
			self._ajaxNoPostprocess(
				envianceSdk,
				{
					type: "POST",
					url: envianceSdk._private._buildUrl('ver2/DataService.svc/calculations/calculationranges'),
					data: envianceSdk.JSON.stringify(inputData)
				},
				function(data, textStatus, jqXhr) {
					equal(jqXhr.status, 200, "Status code OK.");
					deepEqual(data.beginDate, self.ThisYearDstSwitchOnDate, "Begin Dates are equal.");
					deepEqual(data.endDate, self.NextYearDstSwitchOnDate, "End Dates are equal.");
					start();
				},
				context.errorHandler
			);
		});
		
		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Range - Begin Previous CalendarMonth and End Current CalendarMonth.", 3, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Previous",
					"periodType": "CalendarMonth"
				},
				end: {
					"relativity": "Current",
					"periodType": "CalendarMonth"
				}
			}
			, function (response) {
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var previousMonthBegin = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth()-1, 1);
				var currentMonthEnd = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth() + 1, 1);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				deepEqual(response.result.beginDate, previousMonthBegin, "Begin Dates are equal.");
				deepEqual(response.result.endDate, currentMonthEnd, "End Dates are equal.");
				start();
			}, context.errorHandler);
		});
		queue.executeNext();

	});
	
	asyncTest("Calc Numeric Date Range - Begin Previous 15 Year and End AfterStart Year 8300. DateTimeOutOfRangeException Should be thrown.", 2, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Previous",
				"periodType": "Year",
				"periodCount": "15"
			},
			end: {
				"relativity": "AfterStart",
				"periodType": "Year",
				"periodCount": "8300"
			}
		}, self.errorHandler,
		function (response) {
			equal(response.metadata.statusCode, 500, "Status code OK.");
			equal(response.error.message, "The added or subtracted value results have unsupported DateTime range. Valid range: from 1753-01-01T00:00:00 to 9999-12-31T00:00:00", "Expected error message");
			start();
		});
	});

	asyncTest("Calc Numeric Date Range - Correct Begin Absolute Date and Wrong End Absolute Date. Validate Invalid End Date.", 3, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Absolute",
				"absoluteDate": "1753-01-01T00:00:00"
			},
			end: {
				"relativity": "Absolute",
				"absoluteDate": "9999-12-31T23:59:59"
			}
		}, self.errorHandler,
		function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Expected error number"); 
			equal(response.error.message, "The absoluteDate must be between 1753-01-01T00:00:00 and 9999-12-31T00:00:00", "Expected error message");
			start();
		});
	});
	
	asyncTest("Calc Numeric Date Range - Wrong Begin Absolute Date and Correct End Absolute Date. Validate Invalid Begin Date.", 3, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Absolute",
				"absoluteDate": "1000-01-01T00:00:00"
			},
			end: {
				"relativity": "Absolute",
				"absoluteDate": "9999-12-31T00:00:00"
			}
		}, self.errorHandler,
		function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 100, "Expected error number"); 
			equal(response.error.message, "The absoluteDate must be between 1753-01-01T00:00:00 and 9999-12-31T00:00:00", "Expected error message");
			start();
		});
	});
	
	asyncTest("Calc Numeric Date Range - Begin Absolute Date is later then End Absolute Date. Validate Invalid Date Range.", 3, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Absolute",
				"absoluteDate": "2035-01-01T00:00:00"
			},
			end: {
				"relativity": "Absolute",
				"absoluteDate": "2012-01-01T00:00:00"
			}
		}, self.errorHandler,
		function (response) {
			equal(response.metadata.statusCode, 400, "Status code OK.");
			equal(response.error.errorNumber, 6003, "Expected error number");
			equal(response.error.message, "Range end 2012-01-01T00:00:00 cannot be less than start 2035-01-01T00:00:00.", "Expected error message");
			start();
		});
	});
	
	asyncTest("Calc Numeric Date Range - Begin Current CalendarDay and End Absolute Date with redundant properties set. Validate Warnings.", 5, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Current",
				"periodType": "CalendarDay",
				"periodCount": "1",
				"absoluteDate": "2010-01-01T00:00:00"
			},
			end: {
				"relativity": "Absolute",
				"absoluteDate": "2056-01-01T00:00:00",
				"periodType": "Day",
				"periodCount": 1
			}
		}, function (response) {
			equal(response.metadata.statusCode, 200, "Status code OK.");
			var warnings = response.metadata.warnings;
			ok(warnings && warnings.indexOf("start.absoluteDate was ignored") > -1, "start.absoluteDate validation is present");
			ok(warnings && warnings.indexOf("start.periodCount was ignored") > -1, "start.periodCount validation is present");
			ok(warnings && warnings.indexOf("end.periodType was ignored") > -1, "end.periodType validation is present");
			ok(warnings && warnings.indexOf("end.PeriodCount was ignored") > -1, "end.PeriodCount validation is present");
			start();
		}, self.errorHandler);
	});
	
	asyncTest("Calc Numeric Date Range - Begin Absolute Date 2012-01-01, End Absolute Date 2012-01-02", 3, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Absolute",
				"absoluteDate": envianceSdk.IsoDate.parse("2012-01-02T00:00:00")
			},
			end: {
				"relativity": "Absolute",
				"absoluteDate": envianceSdk.IsoDate.parse("2012-01-03T00:00:00")
			}
		}
		, function (response) {
			equal(response.metadata.statusCode, 200, "Status code OK.");
			equal(envianceSdk.IsoDate.toLocalString(response.result.beginDate), "2012-01-02T00:00:00");
			equal(envianceSdk.IsoDate.toLocalString(response.result.endDate), "2012-01-03T00:00:00");
			start();
		}, self.errorHandler);
	});
	
	asyncTest("Calc Numeric Date Range - Begin Current Day, End Current Day. Error Should be Thrown.", 2, function () {
		var self = this;
		
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Current",
				"periodType": "Day"
			},
			end: {
				"relativity": "Current",
				"periodType": "Day",
				"periodCount": 1
			}
		}, self.errorHandler,
		function (response) {
			equal(response.metadata.statusCode, 500, "Status code OK.");
			equal(response.error.message, "Cannot calculate start date of current period for non-calendar period type");
			start();
		});
	});
	
	asyncTest("Calc Numeric Date Range - Begin Absolute Date 2012-01-01 and End AfterStart CalendarDay", 3, function () {
		var self = this;
		envianceSdk.data.getCalculationRanges({
			start: {
				"relativity": "Absolute",
				"absoluteDate": envianceSdk.IsoDate.parse("2012-01-02T00:00:00")
			},
			end: {
				"relativity": "AfterStart",
				"periodType": "CalendarDay",
				"periodCount": 1
			}
		}, function (response) {
			equal(response.metadata.statusCode, 200, "Status code OK.");
			equal(envianceSdk.IsoDate.toLocalString(response.result.beginDate), "2012-01-02T00:00:00");
			equal(envianceSdk.IsoDate.toLocalString(response.result.endDate), "2012-01-03T00:00:00");
			start();
		}, self.errorHandler);
	});
	
	asyncTest("Calc Numeric Date Range - Begin Absolute Date and End Current CalendarDay. With Ignore Warning.", 4, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);
		
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Absolute",
					"absoluteDate": envianceSdk.IsoDate.parse("2012-01-02T00:00:00")
				},
				end: {
					"relativity": "Current",
					"periodType": "CalendarDay",
					"periodCount": 1
				}
			}, function (response) {
				
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var currentCalendarDayEnd = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate()+1);
				
				equal(response.metadata.statusCode, 200, "Status code OK.");
				equal(envianceSdk.IsoDate.toLocalString(response.result.beginDate), "2012-01-02T00:00:00");
				deepEqual(response.result.endDate, currentCalendarDayEnd);
				ok(response.metadata.warnings && response.metadata.warnings.indexOf("end.PeriodCount was ignored") > -1, "end.PeriodCount validation is present");
				start();
			}, self.errorHandler);
		});
		
		queue.executeNext();
	});

	asyncTest("Calc Numeric Date Range - Begin Absolute Date and End AfterStart CalendarDay. CalendarDay Should be treated same as Day Period Type.", 3, function () {
		var self = this;
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Absolute",
					"absoluteDate": envianceSdk.IsoDate.parse("2012-01-02T00:00:00")
				},
				end: {
					"relativity": "AfterStart",
					"periodType": "CalendarDay",
					"periodCount": 5
				}
			}, function (response) {
				equal(response.metadata.statusCode, 200, "Status code OK.");
				equal(envianceSdk.IsoDate.toLocalString(response.result.beginDate), "2012-01-02T00:00:00");
				equal(envianceSdk.IsoDate.toLocalString(response.result.endDate), "2012-01-07T00:00:00");
				start();
			}, self.errorHandler);
	});

	asyncTest("Calc Numeric Date Range - Begin Following Day and End AfterStart Day.", 3, function () {
		
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);
		
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Following",
					"periodType": "Day",
					"periodCount": 1
				},
				end: {
					"relativity": "AfterStart",
					"periodType": "Day",
					"periodCount": 1
				}
			}, function (response) {
				
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var currentFollowingDayBegin = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate() + 1);
				var currentAfterStartDayEnd = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate() + 2);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				deepEqual(response.result.beginDate, currentFollowingDayBegin);
				deepEqual(response.result.endDate, currentAfterStartDayEnd);
				start();
			}, context.errorHandler);
		});
		
		queue.executeNext();

	});
	
	asyncTest("Calc Numeric Date Range - Begin Following Month and End AfterStart Day.", 3, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Following",
					"periodType": "Month",
					"periodCount": 1
				},
				end: {
					"relativity": "AfterStart",
					"periodType": "Day",
					"periodCount": 1
				}
			}, function (response) {
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var currentFollowingMonthBegin = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth()+1, currentUserTimeZoneDate.getDate());
				var currentAfterStartDayEnd = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth() + 1, currentUserTimeZoneDate.getDate() + 1);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				deepEqual(response.result.beginDate, currentFollowingMonthBegin);
				deepEqual(response.result.endDate, currentAfterStartDayEnd);
				start();
			}, context.errorHandler);
		});
		
		queue.executeNext();

	});
	
	asyncTest("Calc Numeric Date Range - Begin Following CalendarMonth and End AfterStart Day.", 3, function () {
		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);
		
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationRanges({
				start: {
					"relativity": "Following",
					"periodType": "CalendarMonth",
					"periodCount": 1
				}, end: {
					"relativity": "AfterStart",
					"periodType": "Day",
					"periodCount": 1
				}
			}, function (response) {
				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var currentFollowingMonthBegin = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth() + 1, 1);
				var currentAfterStartDayEnd = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth() + 1, 2);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				deepEqual(response.result.beginDate, currentFollowingMonthBegin);
				deepEqual(response.result.endDate, currentAfterStartDayEnd);
				start();
			}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Calc Numeric Date Periods - Begin Absolute Date and End Absolute Day. Limited by DateEnd", 5, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T00:01:00"
				},
				"end": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T01:01:00"
				},
				"intervalType": "Hourly",
				"factor": 1,
				"limit": 1000
			}
				, function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.length, 1, "Limited by DateEnd");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].beginDate), "2015-03-01T00:01:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].saveDate), "2015-03-01T00:01:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].endDate), "2015-03-01T01:01:00");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Periods - Begin Absolute Date and End Absolute Day. Limited by Limit", 5, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T00:01:00"
				},
				"end": {
					"relativity": "Absolute",
					"absoluteDate": "2020-01-01T00:01:00"
				},
				"intervalType": "Hourly",
				"factor": 1,
				"limit": 1
			}
				, function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.length, 1, "Limited by Limit=1");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].beginDate), "2015-03-01T00:01:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].saveDate), "2015-03-01T00:01:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].endDate), "2015-03-01T01:01:00");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Periods -  Time-Based Intervals. Begin Absolute Date and End Absolute Day. Limited by DateEnd", 5, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T00:01:00"
				},
				"end": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T01:01:00"
				},
				"intervalType": "HourlyTimeBased",
				"factor": 1,
				"limit": 1000
			}
				, function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.length, 1, "Limited by DateEnd");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].beginDate), "2015-03-01T00:01:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].saveDate), "2015-03-01T01:00:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].endDate), "2015-03-01T01:01:00");
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Periods -  Time-Based Intervals. Begin Absolute Date and End Absolute Day. Limited by Limit", 5, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T00:01:00"
				},
				"end": {
					"relativity": "Absolute",
					"absoluteDate": "2020-01-01T00:01:00"
				},
				"intervalType": "HourlyTimeBased",
				"factor": 1,
				"limit": 1
			}
				, function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.length, 1, "Limited by Limit=1");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].beginDate), "2015-03-01T00:01:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].saveDate), "2015-03-01T01:00:00");
					equal(envianceSdk.IsoDate.toLocalString(response.result[0].endDate), "2015-03-01T01:01:00");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Periods - TimeZones", 4, function () {
		var self = this;
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": envianceSdk.IsoDate.parse("2015-03-08T00:00:00")
				},
				"end": {
					"relativity": "AfterStart",
					"periodType": "Day"
				},
				"intervalType": "Hourly",
				"limit": 100,
				"timezones": [2] //TZ 2 = EST timezone
			}
				, function (response) {
					var strExpectedLocalDate = envianceSdk.IsoDate.toLocalString(envianceSdk.IsoDate.parse("2015-03-08T02:00:00"));
					equal(response.metadata.statusCode, 200, "Status code OK.");
					//during the second Sunday in March, at 2:00 a.m. EST, clocks are advanced to 3:00 a.m. EDT leaving a one-hour "gap"
					equal(envianceSdk.IsoDate.toLocalString(response.result[2].saveDate), strExpectedLocalDate, "Expected Date");
					var nonExistInTZ = response.result[2].dontExistInTimeZone;
					equal(nonExistInTZ != null, true, "Does not exist in EST timezone");
					equal(nonExistInTZ && nonExistInTZ.length > 0 && nonExistInTZ[0], 2, "EST timezone index");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Calc Numeric Date Periods - Wrong TimeZone ID. Error should be thrown.", 3, function () {
		var self = this;
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T00:01:00"
				},
				"end": {
					"relativity": "Absolute",
					"absoluteDate": "2015-03-01T01:01:00"
				},
				"intervalType": "Hourly",
				"factor": 1,
				"limit": 1000,
				"timezones": [32000]
			}, context.errorHandler,
			function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK.");
					equal(response.error.errorNumber, 6004, "Expected error number");
					equal(response.error.message, "Invalid timezones with LCID(s) '32000'", "Correct Error Message received.");
					start();
				});
		});
		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Periods - Begin Absolute Date and no End Date. Interval Hourly. Limit by 100 count.", 2, function () {
		var queue = new ActionQueue(this);
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Absolute",
					"absoluteDate": envianceSdk.IsoDate.parse("2015-03-08T00:00:00")
				},
				"intervalType": "Hourly",
				"limit": 100
			},
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.length, 100, "Limited by Limit=100");
					start();
				}, context.errorHandler);
		});
		
		queue.executeNext();
	});

	asyncTest("Calc Numeric Date Periods -  Begin Current CalendarDay Date and no End Date. Interval Hourly. Limit by Current Calendar Day.", 2, function () {
		var queue = new ActionQueue(this);
		
		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				"start": {
					"relativity": "Current",
					"periodType": "CalendarDay"
				},
				"intervalType": "Hourly"
			}, function (response) {
				equal(response.metadata.statusCode, 200, "Status code OK.");
				equal(response.result.length, 24, "Limited by Current Calendar Day");
				start();
			}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Calc Numeric Date Periods - Begin Current CalendarDay Interval Type Minutes.", 11, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				start: {
					"relativity": "Current",
					"periodType": "CalendarDay"
				},
				intervalType: "Minutes",
				factor: 1,
				limit: 3,
				timezones: null
			}, function (response) {

				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);
				var currentCalendarDay = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate());
				var currentCalendarDay1Minute = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate(), 0, 1);
				var currentCalendarDay2Minute = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate(), 0, 2);
				var currentCalendarDay3Minute = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), currentUserTimeZoneDate.getDate(), 0, 3);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				equal(response.result.length, 3, "3 Periods returned.");
				deepEqual(response.result[0].beginDate, currentCalendarDay, "Period 1 beginDate OK.");
				deepEqual(response.result[0].endDate, currentCalendarDay1Minute, "Period 1 endDate OK.");
				deepEqual(response.result[0].saveDate, currentCalendarDay, "Period 1 saveDate OK.");
				deepEqual(response.result[1].beginDate, currentCalendarDay1Minute, "Period 2 beginDate OK.");
				deepEqual(response.result[1].endDate, currentCalendarDay2Minute, "Period 2 endDate OK.");
				deepEqual(response.result[1].saveDate, currentCalendarDay1Minute, "Period 2 saveDate OK.");
				deepEqual(response.result[2].beginDate, currentCalendarDay2Minute, "Period 3 beginDate OK.");
				deepEqual(response.result[2].endDate, currentCalendarDay3Minute, "Period 3 endDate OK.");
				deepEqual(response.result[2].saveDate, currentCalendarDay2Minute, "Period 3 saveDate OK.");
				start();
			}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Calc Numeric Date Periods - Begin Current CalendarMonth Interval Type Weekly.", 8, function () {

		var queue = new ActionQueue(this);
		this.initUserTimeZone(queue);

		queue.enqueue(function (context) {
			envianceSdk.data.getCalculationPeriods({
				start: {
					"relativity": "Current",
					"periodType": "CalendarMonth"
				},
				intervalType: "Weekly",
				factor: 1,
				limit: 2,
				timezones: null
			}, function (response) {

				var currentUserTimeZoneDate = toLocalTime(context.getUTCDateTime(), context.tz);

				var currentCalendarMonth = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), 1);
				var currentCalendarMonthWeek1End = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), 1 + 7);
				var currentCalendarMonthWeek2End = new Date(currentUserTimeZoneDate.getFullYear(), currentUserTimeZoneDate.getMonth(), 1 + 14);

				equal(response.metadata.statusCode, 200, "Status code OK.");
				equal(response.result.length, 2, "2 Periods returned.");
				deepEqual(response.result[0].beginDate, currentCalendarMonth, "Period 1 beginDate OK.");
				deepEqual(response.result[0].endDate, currentCalendarMonthWeek1End, "Period 1 endDate OK.");
				deepEqual(response.result[0].saveDate, currentCalendarMonth, "Period 1 saveDate OK.");
				deepEqual(response.result[1].beginDate, currentCalendarMonthWeek1End, "Period 2 beginDate OK.");
				deepEqual(response.result[1].endDate, currentCalendarMonthWeek2End, "Period 2 endDate OK.");
				deepEqual(response.result[1].saveDate, currentCalendarMonthWeek1End, "Period 2 saveDate OK.");
				start();
			}, context.errorHandler);
		});

		queue.executeNext();
	});

}

if (typeof (UnitTestsApplication) == "undefined") {
	executeDataCalcPeriodsTests();
}