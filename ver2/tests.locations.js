if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Locations', execute: executeComplianceServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof locationConfig == "undefined")
	locationConfig = {};

function executeComplianceServiceTests() {
	module("Compliance Service", {
		setup: function () {
			this.generatedDivisionName = "Division Generated (Locations module)";
			this.generatedDivisionPath = "/" + this.generatedDivisionName;
			this.generatedDivisionForMoveName = "Division for move Generated (Locations module)";
			this.generatedDivisionForMovePath = "/" + this.generatedDivisionForMoveName;
			this.generatedFacilityAGLName = "Facility with Address and Geolocation Generated (Locations module)";
			this.generatedFacilityAGLPath = this.generatedDivisionPath + "/" + this.generatedFacilityAGLName;
			this.generatedFacilityWAGLName = "Facility without Address and Geolocation Generated (Locations module)";
			this.generatedUnitName = "Unit Generated (Locations module)";
			this.generatedUnitPath = this.generatedFacilityAGLPath + "/" + this.generatedUnitName;
			
			this.accessUserName = locationConfig.accessUserName || this.accessUserName;
			this.noAccessUserName = locationConfig.noAccessUserName || "jstestsNotAccessUser";
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";

			this.noManageRightsUserName = (locationConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.password = locationConfig.password || "1111";

			this.divisionName = "JsTestsLocDivision";
			this.divisionName2 = "JsTestsDivision2";
			this.facilityName = "JsTestsFacility";
			this.facilityName2 = "JsTestsFacility2";
			this.unitName = "JsTestsUnit";
			this.poiName = "JsTestsPoi";

			this.facilityTimeZone = "USA Atlantic";
			this.documentsPath = "/250/99999.xls";

			this.fieldTemplateName = "MAS Custom Field Template";
			this.customFieldTextBox = "XLS2_Text Box_Small (20 char max)";
			this.customFieldDDL = "XLS2_Text Box_Dropdown List";
			this.customFieldHyperlink = "MAS Hyperlink";
			
			this.calcFieldTemplateName = "Calc Udf Template";
			this.calcUdfFieldNumTb = "calc-udf-num-tb";
			this.calcUdfFieldNumTbTvh = "calc-udf-num-tb-tvh";
			this.calcUdfFieldNumDdl = "calc-udf-num-ddl";
			this.calcUdfFieldNumDdlTvh = "calc-udf-num-ddl-tvh";
			this.calcUdfFieldNumLookUp = "calc-udf-num-lookup";
			this.calcUdfFieldNumLookUpTvh = "calc-udf-num-lookup-tvh";
			this.calcUdfFieldBoolCb = "calc-udf-bool-cb";
			this.calcUdfFieldBoolCbTvh = "calc-udf-bool-cb-tvh";
			this.calcUdfFieldBoolDdl = "calc-udf-bool-ddl";
			this.calcUdfFieldBoolDdlTvh = "calc-udf-bool-ddl-tvh";
			this.calcUdfFieldCalcNum = "calc-udf-calc-num-3";

			this.generatedHstrFieldsDivisionName = "Division with historizable UDF";
			this.generatedHstrFieldsDivisionPath = "/" + this.generatedHstrFieldsDivisionName;
			
			this.generatedForUpdateHstrFieldsDivisionName = "Division For Update with historizable UDF";
			this.generatedForUpdateHstrFieldsDivisionPath = "/" + this.generatedForUpdateHstrFieldsDivisionName;
						
			this.histFieldTemplateName = "HSTR_Custom Field Template";
			this.customHistFieldText = "XLS_kio_txt_txt_box_small_tvh";
			this.customHistFieldTextDDL = "UDF_text_ddl_ll_tvh";
			this.customHistFieldNumber = "XLS_kio_num_txtbox_tvh";
			this.customHistFieldNumberDDL = "n_ddl_w_tb_tvh";
			this.customHistFieldDate = "XLS_UDF_date time_tvh";
			this.customHistFieldBool = "XLS_kio_true-false_checkbox_tvh";
			
			this.street1 = "1028 Arch Ave";
			this.city = "San Diego";
			this.stateOrProvince = "CA";
			this.country = "US";
			this.postalCode = "92024";
			this.street2 = "1029 Arch Ave";
			this.countyOrRegion = "San Diego";

			this.latitude = 38.889722;
			this.longitude = -77.008889;
			
			this.locationPathsToClear = [];
			this.taskIDsToClear = [];
			this.buildAddress = function (street1, city, stateOrProvince, country, postalCode) {
				return new envianceSdk.compliance.Address(street1, city, stateOrProvince, country, postalCode);
			};

			this.buildGeoLocation = function (latitude, longitude) {
				return new envianceSdk.compliance.GeoLocation(latitude, longitude);
			};

			this.buildFacilityCreationInfo = function () {
				var facilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName, "Facility", this.generatedDivisionPath)
					.setTimeZone(this.facilityTimeZone)
					.setFieldTemplate(this.fieldTemplateName)
					.addScalarFieldValue(this.customFieldTextBox, "new Facility")				
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://moto.kiev.ua")
					.setCalcFieldTemplate(this.calcFieldTemplateName)
					.addScalarCalcFieldValue(this.calcUdfFieldNumTb, "10")
					.addScalarCalcFieldValue(this.calcUdfFieldNumDdl, "100")
					.addScalarCalcFieldValue(this.calcUdfFieldNumLookUp, "calc-udf-num-lookup 2")
					.addScalarCalcFieldValue(this.calcUdfFieldBoolCb, "False")
					.addScalarCalcFieldValue(this.calcUdfFieldBoolDdl, "ddlFalse")
					.addDocument(this.documentsPath)
					.addTag("Location Tag Scheme", "Location Tag 1")
					.addTag("Location Tag Scheme", "Location Tag 2");
				
				var address = this.buildAddress(this.street1, this.city, this.stateOrProvince, this.country, this.postalCode)
					.setStreet2(this.street2)
					.setCountyOrRegion(this.countyOrRegion);
				facilityInfo.setAddress(address);
				facilityInfo.setGeoLocation(this.buildGeoLocation(this.latitude, this.longitude));
				return facilityInfo;
			};
			
			this.buildGeneratedFacilityCreationInfo = function () {
				var facilityInfo = new envianceSdk.compliance.LocationInfo(this.generatedFacilityAGLName, "Facility", this.generatedDivisionPath)
					.setTimeZone(this.facilityTimeZone)
					.setFieldTemplate(this.fieldTemplateName)
					.addScalarFieldValue(this.customFieldTextBox, "new Facility")
					.addScalarFieldValue(this.customFieldDDL, "simple text")
					.addUrlFieldValue(this.customFieldHyperlink, "HyperLink label", "http://moto.kiev.ua")
					.setCalcFieldTemplate(this.calcFieldTemplateName)
					.addScalarCalcFieldValue(this.calcUdfFieldNumTb, "10")
					.addScalarCalcFieldValue(this.calcUdfFieldNumDdl, "100")
					.addScalarCalcFieldValue(this.calcUdfFieldNumLookUp, "calc-udf-num-lookup 2")
					.addScalarCalcFieldValue(this.calcUdfFieldBoolCb, "false")
					.addDocument(this.documentsPath);
				var address = this.buildAddress(this.street1, this.city, this.stateOrProvince, this.country, this.postalCode)
					.setStreet2(this.street2)
					.setCountyOrRegion(this.countyOrRegion);
				facilityInfo.setAddress(address);
				facilityInfo.setGeoLocation(this.buildGeoLocation(this.latitude, this.longitude));
				return facilityInfo;
			};
			     
			this.buildGeneratedHstrFieldDivisionCreationInfo = function () {
				var divisionInfo = new envianceSdk.compliance.LocationInfo(this.generatedHstrFieldsDivisionName, "Division", this.generatedHstrFieldsDivisionPath)
					.setTimeZone(this.facilityTimeZone)
					.setFieldTemplate(this.histFieldTemplateName)
					.addScalarFieldHistValue(this.customHistFieldText, "UDF Text Value", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2011-01-01T00:00:00"))
					.addScalarFieldHistValue(this.customHistFieldNumber, "555", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2011-01-01T00:00:00"))
					.addScalarFieldHistValue(this.customHistFieldBool, "False", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2011-01-01T00:00:00"))
				return divisionInfo;
			};
			
			this.buildGeneratedDivisionInfo = function () {
				var divisionInfo = new envianceSdk.compliance.LocationInfo(this.generatedHstrFieldsDivisionName, "DivisionForUpdate", this.generatedHstrFieldsDivisionPath)
					.setTimeZone(this.facilityTimeZone);
				return divisionInfo;
			};
			
			this.buildForUpdateDivisionInfo = function () {
				var divisionInfo = new envianceSdk.compliance.LocationInfo(this.generatedForUpdateHstrFieldsDivisionName, "DivisionForUpdate", this.generatedForUpdateHstrFieldsDivisionPath)
					.setTimeZone(this.facilityTimeZone);
				return divisionInfo;
			};
						
			this.clearLocation = function (queue, locationPath) {
				queue.enqueue(function (context) {
					envianceSdk.compliance.deleteLocation(locationPath, true,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
			};

			this.addFacilityLocation = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.compliance.deleteLocation(context.generatedDivisionPath + "/" + context.facilityName, true,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
				queue.enqueue(function (context) {
					context.facilityInfo = context.buildFacilityCreationInfo();
					envianceSdk.compliance.createLocation(context.facilityInfo,
						function (response) {
							context.facilityPath = response.result.objects[0];
							context.locationPathsToClear.push(response.result.objects[0]);
							queue.executeNext();
						}, context.errorHandler);
				});
			};
			
			this.initUserTimeZoneOffSet = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.authentication.getCurrentSession(
						function (response) {
							this.tzOffset = response.result.userTimeZone.currentOffset;
							queue.executeNext();
						}, context.errorHandler);
				});
			};

			this.authenticateUserWithoutRights = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
					function () {
						queue.executeNext();
					},
					context.errorHandler);
				});
			};

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
		},
		teardown: function () {
			stop();
			var errorHandler = function () {
				start();
			};
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			for (var path = 0; path < this.locationPathsToClear.length; path ++) {
				envianceSdk.compliance.deleteLocation(this.locationPathsToClear[path], true,
					function () {
						start();
					}, errorHandler);
				stop();
			}
			for (var i = 0 ; i < this.taskIDsToClear.length; i++){
				stop();
				envianceSdk.tasks.deleteTask(this.taskIDsToClear[i],
					function () {
						start();
					},
					function () {
						start();
					});
			}
			start();
		}
	});

	asyncTest("Create Location (Division) - Happy path", 4, function () {		
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

	//	 Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var location = response.result;					
					equal(location.name, divisionInfo.name, "Name value is equal");
					equal(location.type, divisionInfo.type, "Type value is equal");
					equal(location.parentPath, divisionInfo.parentPath, "Parent path is equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Location Async (Division) - Happy path", 4, function () {
		var queue = new ActionQueue(this);
		var locationPath;
		var divisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			envianceSdk.compliance.createLocationAsync(divisionInfo,
				function (response) {
					envianceSdk._private._runCommandPolling(response,
						function (commandInfo) {
							locationPath = commandInfo.result.objects[0];
							context.locationPathsToClear.push(locationPath);
							equal(commandInfo.result.status, "Succeeded", "Division created asynchronously successfuly");
							queue.executeNext();
						},
						context.errorHandler
					);
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var location = response.result;

					equal(location.name, divisionInfo.name, "Name value is equal");
					equal(location.type, divisionInfo.type, "Type value is equal");
					equal(location.parentPath, divisionInfo.parentPath, "Parent path is equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Location Batch - Create (2 Divisions - Duplicates) - Fail path", 6, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo, divisionInfo2;

		this.clearLocation(queue, "/" + this.divisionName);

		var doneCallbacks = 0;
		var operCount = 0;
		var secondFired = false;
		var self = this;

		queue.doStart = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) start();
		};

		var errorHandler = function (response, status, message) {
			self.errorHandler(response, status, message, this, true);
			queue.doStart();
		};

		var doneCallback = function(response, status, message, index) {
			var idxName = index > 1 ? "2nd" : "1st";

			locationPath = response.result.objects[0];
			self.locationPathsToClear.push(locationPath);
			equal(response.result.status, "Succeeded", idxName + " Division '" + self.divisionName + "' is created successfuly");

			queue.doStart();
		};

		var failCallback = function(response, status, message, index) {
			var idxName = index > 1 ? "2nd" : "1st";
			secondFired = !secondFired && (index > 1);
			var respMsg, expectedRespMsg, msg;

			var statusCode = response.metadata && response.metadata.statusCode || 0;

			respMsg = self.formatErrorResponse(response, status, message);
			if (statusCode == 409 || statusCode == 500) {
				ok(true, "Status code is correct");
			}
			else {
				equal(statusCode, 409, respMsg);
			}

			expectedRespMsg = statusCode == 409 ? "Compliance Object with name " + self.divisionName + " already exist."
				: "The name [" + self.divisionName + "] already exists in the system";

			msg = expectedRespMsg != respMsg ? respMsg : idxName + " Division '" + self.divisionName + "' is NOT created";
			equal(respMsg, expectedRespMsg, msg);

			queue.doStart();
		};

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			divisionInfo2 = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");

			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.compliance.createLocation(divisionInfo,
						function (r, s, m) { doneCallback(r, s, m, 1); }, function (r, s, m) { failCallback(r, s, m, 1); });
					envianceSdk.compliance.createLocation(divisionInfo2,
						function (r, s, m) { doneCallback(r, s, m, 2); }, function (r, s, m) { failCallback(r, s, m, 2); });

					operCount = envianceSdk.batch.getOperations().length;
				}
			},
				function (response) {
					equal(response.result && response.result.length, operCount, "Get " + operCount + " rresults");
					equal(response.result[0].status, "OK", "1st Division '" + context.divisionName + "' is pushed on queue");
					equal(response.result[1].status, secondFired ? "Conflict" : "OK", "2nd Division '" + context.divisionName + "' is " + (secondFired ? "not" : "") + " pushed on queue");

					queue.doStart();
				}, errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Location Batch - Create Async (2 Divisions) - Happy path", 5, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo, divisionInfo2;

		this.clearLocation(queue, "/" + this.divisionName);
		this.clearLocation(queue, "/" + this.divisionName2);

		var doneCallbacks = 0;
		var operCount = 0;
		var self = this;

		queue.doStart = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) start();
		};
		var errorHandler = function (response, status, message) {
			self.errorHandler(response, status, message, this, true);
			queue.doStart();
		};


		var awaitCallback = function (response) {
			envianceSdk._private._runCommandPolling(response,
				function(commandInfo) {
					locationPath = commandInfo.result.objects[0];
					self.locationPathsToClear.push(locationPath);
					equal(commandInfo.result.status, "Succeeded", "Division '" + locationPath + "' created successfuly");

					queue.doStart();
				},
				errorHandler
			);
		};

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			divisionInfo2 = new envianceSdk.compliance.LocationInfo(context.divisionName2, "Division", "/");

			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.compliance.createLocationAsync(divisionInfo,
						awaitCallback, context.errorHandler);
					envianceSdk.compliance.createLocationAsync(divisionInfo2,
						awaitCallback, context.errorHandler);
					
					operCount = envianceSdk.batch.getOperations().length;
					}
				},
				function (response) { 
					equal(response.result && response.result.length, operCount, "Get " + operCount + " results");
					equal(response.result[0].status, "OK", "1st Division '" + context.divisionName + "' is pushed on queue");
					equal(response.result[1].status, "OK", "2nd Division '" + context.divisionName2 + "' is pushed on queue");

					queue.doStart();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Location Batch - Create Async (2 Divisions - Duplicates) - Fail path", 6, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo, divisionInfo2;

		this.clearLocation(queue, "/" + this.divisionName);

		var doneCallbacks = 0;
		var operCount = 0;
		var divisionIndex = 1;
		var pushedCount = 0;
		var self = this;
		
		queue.doStart = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) start();
		};

		var errorHandler = function (response, status, message) {
			self.errorHandler(response, status, message, this, true);
			queue.doStart();
		};

		var awaitCallback = function (response, status, message) {
			var idxName = divisionIndex++ > 1 ? "2nd" : "1st";
			var respMsg, expectedRespMsg, msg;

			var statusCode = response.metadata && response.metadata.statusCode || 0;
			var hasErrors = (status == "error") || (statusCode != 200);
			if (hasErrors) {
				if (pushedCount) { // Only second callback
					respMsg = self.formatErrorResponse(response, status, message);
					msg = statusCode != 409 ? respMsg : "Status code is correct";
					equal(statusCode, 409, msg);

					expectedRespMsg = "Compliance Object with name " + self.divisionName + " already exist.";
					msg = expectedRespMsg != respMsg ? respMsg : idxName + " Division '" + self.divisionName + "' is NOT created";
					equal(respMsg, expectedRespMsg, msg);
					
					queue.doStart();
				}
				else errorHandler(response, status, message);
				
				return;
			}
			pushedCount++;
			
			envianceSdk._private._runCommandPolling(response,
				function (commandInfo) {
					locationPath = commandInfo.result.objects[0];
					self.locationPathsToClear.push(locationPath);
					equal(commandInfo.result.status, "Succeeded", idxName + " Division '" + self.divisionName + "' is created successfuly");
					
					queue.doStart();
				},
				function (commandInfo) {
					respMsg = self.formatErrorResponse(commandInfo);
					msg = commandInfo.metadata.statusCode != 500 ? respMsg : "Status code is correct";
					equal(commandInfo.metadata.statusCode, 500, msg);

					expectedRespMsg = "The name [" + self.divisionName + "] already exists in the system";
					msg = expectedRespMsg != respMsg ? respMsg : idxName + " Division '" + self.divisionName + "' is NOT created";
					equal(respMsg, expectedRespMsg, msg);

					queue.doStart();
				}
			);
		};
		
		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			divisionInfo2 = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");

			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					envianceSdk.compliance.createLocationAsync(divisionInfo,
						awaitCallback, awaitCallback);
					envianceSdk.compliance.createLocationAsync(divisionInfo2,
						awaitCallback, awaitCallback);
					
					operCount = envianceSdk.batch.getOperations().length;
				}
			},
				function (response) {
					equal(response.result && response.result.length, operCount, "Get " + operCount + " rresults");
					equal(response.result[0].status, "OK", "1st Division '" + context.divisionName + "' is pushed on queue");
					equal(response.result[1].status, pushedCount < 2 ? "Conflict" : "OK", "2nd Division '" + context.divisionName + "' is " + (pushedCount < 2 ? "not" : "") + " pushed on queue");

					queue.doStart();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Location (Division) - Task has template - Happy path", 12, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo;
		var divisionName = "TestDivision";

		this.clearLocation(queue, "/" + divisionName);
		this.clearLocation(queue, "/" + divisionName + "_Copy");
		this.clearLocation(queue, "/" + divisionName + "_CopyAsync");

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(divisionName, "Division", "/");
			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});
		var date = new Date();
		var taskInfo = new envianceSdk.tasks.TaskInfo(
					"Test Task With Division",
					"Test description",
					new Date(date.getFullYear(), date.getMonth()+1, date.getDate(), 10, 30, 0), 
					"Pacific Time (US & Canada) (UTC-08:00) (Without DST)",
					"jstestsAccessUser",
					null,
					null,
					null,
					null,
					null,
					null,
					"task-template-with-trigger-1").addUserAssignee(this.accessUserName).addPathAssociatedObject("/" + divisionName);
		var taskId;
		queue.enqueue(function (context) {
			envianceSdk.tasks.createTask(taskInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					taskId = response.result;
					context.taskIDsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		var copyLocationPath;
		var copyLocationPathAsync;
		var copyDivisionInfo;
		var copyDivisionInfoAsync;
		this.clearLocation(queue, "/" + divisionName + "_CopyAsync");

		queue.enqueue(function (context) {
			copyDivisionInfo = new envianceSdk.compliance.LocationInfo(divisionName + "_Copy", "Division", "/");
			envianceSdk.compliance.copyLocation(copyDivisionInfo, divisionName,
				function (response) {
					copyLocationPath = response.result.objects[0];
					context.locationPathsToClear.push(copyLocationPath);
					equal(response.result.status, "Succeeded", "Division copied successfully");
					queue.executeNext();
				}, context.errorHandler);
		});
		
		queue.enqueue(function (context) {
			copyDivisionInfoAsync = new envianceSdk.compliance.LocationInfo(divisionName + "_CopyAsync", "Division", "/");
			envianceSdk.compliance.copyLocationAsync(copyDivisionInfoAsync, divisionName,
				function (response) {
					envianceSdk._private._runCommandPolling(response,
					function (commandInfo) {
						copyLocationPathAsync = commandInfo.result.objects[0];
						context.locationPathsToClear.push(copyLocationPathAsync);
						equal(commandInfo.result.status, "Succeeded", "Division async copy process called successfully");
						queue.executeNext();
					},
					context.errorHandler);
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(copyLocationPath,
				function (response) {
					var location = response.result;
					equal(location.name, copyDivisionInfo.name, "Name value is equal");
					equal(location.type, copyDivisionInfo.type, "Type value is equal");
					equal(location.parentPath, copyDivisionInfo.parentPath, "Parent path is equal");
					queue.executeNext();
				}, context.errorHandler);
		});
		
		var copiedTaskId;
		
		queue.enqueue(function (context) {
			envianceSdk.eql.execute(
				"select t.ID AS ID " +
				"from Task t where t.Name = 'Test Task With Division' AND t.id <> '" + taskId + "'", 1, 10,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var isResultSetPresent = response.result.length == 1 && response.result[0].rows.length == 2;
					ok(isResultSetPresent, "Two resultset present");
					if(isResultSetPresent){
						copiedTaskId = response.result[0].rows[0].values[0];
						queue.executeNext();
					}
					else {
						start();
					}
				},
				context.errorHandler);
		});
		queue.enqueue(function (context) {
			envianceSdk.tasks.getTask(copiedTaskId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var actual = response.result;
					var expected = taskInfo;
					equal(actual.templateIdOrName, expected.templateIdOrName, "Templates are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Location (Facility) - Happy path", 25, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var facilityInfo;

		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = context.buildFacilityCreationInfo();
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Facility created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var expected = response.result;
					var actual = facilityInfo;

					equal(expected.name, actual.name, "Name value is equal");
					equal(expected.type, actual.type, "Type value is equal");
					equal(expected.parentPath, actual.parentPath, "Parent path is equal");
					equal(expected.timeZone.name, actual.timeZone.name, "TimeZone is equal");
					//udfTemplate fields
					equal(expected.fieldTemplate, actual.fieldTemplate, "Field template is equal");
					deepEqual(expected.fieldValues[0].values, actual.fieldValues[0].values, "XLS2_Text Box_Small (20 char max) is equal");
					deepEqual(expected.fieldValues[1].values, actual.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(expected.fieldValues[2].urlItems, actual.fieldValues[2].urlItems, "MAS Hyperlink is equal");
					//calcTemplate fields
					equal(expected.calcFieldTemplate, actual.calcFieldTemplate, "CalcField template is equal");
					deepEqual(expected.calcFieldValues[0].values, actual.calcFieldValues[0].values, "calc-udf-num-tb is equal");
					deepEqual(expected.calcFieldValues[1].values, actual.calcFieldValues[1].values, "calc-udf-num-ddl is equal");
					deepEqual(expected.calcFieldValues[2].values, actual.calcFieldValues[2].values, "calc-udf-num-lookup is equal");
					deepEqual(expected.calcFieldValues[3].values, actual.calcFieldValues[3].values, "calc-udf-bool-cb is equal");
					deepEqual(expected.calcFieldValues[4].values, actual.calcFieldValues[4].values, "calc-udf-bool-ddl is equal");
					
					equal(expected.address.street1, actual.address.street1, "Street1 values equal");
					equal(expected.address.street2, actual.address.street2, "Street2 values equal");
					equal(expected.address.city, actual.address.city, "City values equal");
					equal(expected.address.countyOrRegion, actual.address.countyOrRegion, "CountyOrRegion values equal");
					equal(expected.address.stateOrProvince, actual.address.stateOrProvince, "StateOrProvince values equal");
					equal(expected.address.country, actual.address.country, "Country values equal");
					equal(expected.address.postalCode, actual.address.postalCode, "Postal code values equal");

					equal(expected.geoLocation.longitude, actual.geoLocation.longitude, "Longitude values equal");
					equal(expected.geoLocation.latitude, actual.geoLocation.latitude, "Latitude values equal");
					
					deepEqual(expected.tags, actual.tags, "Tags equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Facility) - Happy path - Under root", 5, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var facilityInfo;

		this.clearLocation(queue, "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = new envianceSdk.compliance.LocationInfo(context.facilityName, "Facility", "/")
													 .setTimeZone(context.facilityTimeZone);
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Facility created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var expected = response.result;
					var actual = facilityInfo;

					equal(expected.name, actual.name, "Name value is equal");
					equal(expected.type, actual.type, "Type value is equal");
					equal(expected.parentPath, actual.parentPath, "Parent path is equal");
					equal(expected.timeZone.name, actual.timeZone.name, "TimeZone is equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});
	
	asyncTest("Create Location (Facility) - Fault if Calc UDF template does not exist", 2, function () {
		var invalidFieldTemplateName = "jstetstCalcFieldTemplate";
		var facilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName, "Facility", "/")
			.setTimeZone(this.facilityTimeZone)
			.setCalcFieldTemplate(invalidFieldTemplateName);

		envianceSdk.compliance.createLocation(facilityInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});
	
	asyncTest("Create Location (Facility) - Fault if UDF or calcUDF does not exist", 2, function () {
		var invalidUdfName = "jstetstCalcUdf";
		var facilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName, "Facility", "/")
			.setTimeZone(this.facilityTimeZone)
			.setCalcFieldTemplate(this.calcFieldTemplateName)
		    .addScalarCalcFieldValue(invalidUdfName, "Invalid calc UDF");
		
		envianceSdk.compliance.createLocation(facilityInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Unit) - Happy path - Under Facility", 4, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var unitInfo;

		this.clearLocation(queue, this.generatedFacilityAGLPath + "/" + this.unitName);

		queue.enqueue(function (context) {
			unitInfo = new envianceSdk.compliance.LocationInfo(context.unitName, "Unit", context.generatedFacilityAGLPath);
			envianceSdk.compliance.createLocation(unitInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Unit created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var expected = response.result;
					var actual = unitInfo;

					equal(expected.name, actual.name, "Name value is equal");
					equal(expected.type, actual.type, "Type value is equal");
					equal(expected.parentPath, actual.parentPath, "Parent path is equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Location (POI) - Happy path - Under Facility", 4, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var poiInfo;

		this.clearLocation(queue, this.generatedFacilityAGLPath + "/" + this.poiName);

		queue.enqueue(function (context) {
			poiInfo = new envianceSdk.compliance.LocationInfo(context.poiName, "POI", context.generatedFacilityAGLPath);
			envianceSdk.compliance.createLocation(poiInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "POI created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var expected = response.result;
					var actual = poiInfo;

					equal(expected.name, actual.name, "Name value is equal");
					equal(expected.type, actual.type, "Type value is equal");
					equal(expected.parentPath, actual.parentPath, "Parent path is equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Location (POI) - Happy path - Under Unit", 4, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var poiInfo;

		this.clearLocation(queue, this.generatedUnitPath + "/" + this.poiName);

		queue.enqueue(function (context) {
			poiInfo = new envianceSdk.compliance.LocationInfo(context.poiName, "POI", context.generatedUnitPath);
			envianceSdk.compliance.createLocation(poiInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "POI created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var expected = response.result;
					var actual = poiInfo;

					equal(expected.name, actual.name, "Name value is equal");
					equal(expected.type, actual.type, "Type value is equal");
					equal(expected.parentPath, actual.parentPath, "Parent path is equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - Fault if create Division under Division", 2, function () {
		var queue = new ActionQueue(this);

		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", this.generatedDivisionPath);
		queue.enqueue(function (context) {
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					equal(response.error.errorNumber, 0, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - Fault if location already exist", 2, function () {
		var queue = new ActionQueue(this);

		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.generatedDivisionName, "Division", "/");
		queue.enqueue(function (context) {
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - Fault if UDF template does not exist", 2, function () {
		var invalidFieldTemplateName = "jstetstFieldTemplate";
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
			.setFieldTemplate(invalidFieldTemplateName);

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});
	
	asyncTest("Create Location (Division) - Fault if UDF does not exist", 2, function () {
		var invalidUdfName = "jstetstUdf";
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
			.setFieldTemplate(this.fieldTemplateName)
			.addScalarFieldValue(invalidUdfName, "Invalid UDF");

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Division) - Fault if attached document does not exist", 2, function () {
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
													 .addDocument("/Not existed document");

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Division) - Fault if responsible user does not exist", 2, function () {
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
													 .setResponsibleUser("not_Existed_User");

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Division) - Fault if \"name\" length more then 255", 2, function () {
		var divisionName = '';
		for (var i = 0; i < 256; i++) {
			divisionName += 's';
		}
		var divisionInfo = new envianceSdk.compliance.LocationInfo(divisionName, "Division", "/");

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Division) - Fault if \"type\" is invalid", 2, function () {
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "InvalidType", "/");

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Division) - Fault if \"activeDate\" later than \"inactiveDate\"", 2, function () {
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
													 .setActiveDate(envianceSdk.IsoDate.parse("2012-09-19T18:00:00"))
													 .setInactiveDate(envianceSdk.IsoDate.parse("2012-09-18T18:00:00"));

		envianceSdk.compliance.createLocation(divisionInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
	});

	asyncTest("Create Location (Division) - Check warnings", 5, function () {
		var queue = new ActionQueue(this);

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
														 .setTimeZone(context.facilityTimeZone);
			divisionInfo.id = createUUID();
			var address = context.buildAddress(context.street1, context.city, context.stateOrProvince, context.country, context.postalCode)
					.setStreet2(context.street2)
					.setCountyOrRegion(context.countyOrRegion);
			divisionInfo.setAddress(address);
			divisionInfo.setGeoLocation(context.buildGeoLocation(context.latitude, context.longitude));

			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'timeZone\'") > 0, "Warning for 'timeZone' OK");
					ok(response.metadata.warnings.indexOf("\'address\'") > 0, "Warning for 'address' OK");
					ok(response.metadata.warnings.indexOf("\'geoLocation\'") > 0, "Warning for 'geoLocation' OK");
					context.locationPathsToClear.push(response.result.objects[0]);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Location (Facility) - Check warnings", 5, function () {
		var queue = new ActionQueue(this);

		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.divisionName);

		queue.enqueue(function (context) {
			var facilityInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Facility", context.generatedDivisionPath)
														 .setTimeZone(context.facilityTimeZone);
			facilityInfo.id = createUUID();
			var address = context.buildAddress(context.street1, context.city, context.stateOrProvince, context.country, context.postalCode)
					.setStreet2(context.street2)
					.setCountyOrRegion(context.countyOrRegion);
			facilityInfo.setAddress(address);
			facilityInfo.setGeoLocation(context.buildGeoLocation(context.latitude, context.longitude));

			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					equal(response.metadata.warnings.indexOf("\'timeZone\'"), -1, "Warning for 'timeZone' is missing");
					equal(response.metadata.warnings.indexOf("\'address\'"), -1, "Warning for 'address' is missing");
					equal(response.metadata.warnings.indexOf("\'geoLocation\'"), -1, "Warning for 'geoLocation' is missing");
					context.locationPathsToClear.push(response.result.objects[0]);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Location (Division) - Happy path - Under root node", 4, function () {
		var queue = new ActionQueue(this);

		var copyLocationPath;
		var copyDivisionInfo;
		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			copyDivisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName + "_Copy", "Division", "/");
			envianceSdk.compliance.copyLocation(copyDivisionInfo, context.generatedDivisionForMovePath,
				function (response) {
					copyLocationPath = response.result.objects[0];
					context.locationPathsToClear.push(copyLocationPath);
					equal(response.result.status, "Succeeded", "Division copied successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});
		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(copyLocationPath,
				function (response) {
					var actual = response.result;
					var expected = copyDivisionInfo;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, expected.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Copy Location (Facility) - Happy path", 19, function () {
		var queue = new ActionQueue(this);

		var copyLocationPath;
		var copyFacilityInfo;

		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName + "_Copy");

		queue.enqueue(function (context) {
			copyFacilityInfo = context.buildFacilityCreationInfo();
			copyFacilityInfo.name = copyFacilityInfo.name + "_Copy";

			envianceSdk.compliance.copyLocation(copyFacilityInfo, context.generatedFacilityWAGLPath,
				function (response) {
					copyLocationPath = response.result.objects[0];
					context.locationPathsToClear.push(copyLocationPath);
					equal(response.result.status, "Succeeded", "Facility copied successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(copyLocationPath,
				function (response) {
					var actual = response.result;
					var expected = copyFacilityInfo;

					notEqual(actual.name, context.generatedFacilityWAGLName, "Name value is not equal");
					equal(actual.type, expected.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "XLS2_Text Box_Small (20 char max) is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(actual.fieldValues[2].urlItems, expected.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.CountyOrRegion, expected.address.CountyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");

					deepEqual(actual.tags, expected.tags, "Tags equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Copy Location (Facility) - Happy path - Under root node", 5, function () {
		var queue = new ActionQueue(this);

		var copyLocationPath;
		var copyFacilityInfo;

		this.clearLocation(queue, "/" + this.facilityName + "_Copy");

		queue.enqueue(function (context) {
			copyFacilityInfo = new envianceSdk.compliance.LocationInfo(context.facilityName + "_Copy", "Facility", "/")
													 .setTimeZone(context.facilityTimeZone);

			envianceSdk.compliance.copyLocation(copyFacilityInfo, context.generatedFacilityWAGLPath,
				function (response) {
					copyLocationPath = response.result.objects[0];
					context.locationPathsToClear.push(copyLocationPath);
					equal(response.result.status, "Succeeded", "Facility copied successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(copyLocationPath,
				function (response) {
					var actual = response.result;
					var expected = copyFacilityInfo;

					notEqual(actual.name, context.generatedFacilityWAGLName, "Name value is not equal");
					equal(actual.type, expected.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZone is equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Copy Location (Division) - Fault if source location does not exist", 2, function () {
		var divisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/");

		var invalidLocationPath = "/jstetstNotExistsDivision";
		envianceSdk.compliance.copyLocation(divisionInfo, invalidLocationPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Copy Location (Facility) - Fault if new time zone STD and DST offsets are not equal.", 2, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var facilityInfo;

		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = context.buildFacilityCreationInfo();
			delete facilityInfo.address;
			delete facilityInfo.geoLocation;

			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);

					queue.executeNext();
				}, context.errorHandler);
		});

		var copyFacilityInfo;
		queue.enqueue(function (context) {
			copyFacilityInfo = context.buildFacilityCreationInfo();
			copyFacilityInfo.name = copyFacilityInfo.name + "_Copy";
			copyFacilityInfo.setTimeZone("Pacific Time (US & Canada) (UTC-08:00) (With DST)");

			envianceSdk.compliance.copyLocation(copyFacilityInfo, locationPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code is correct");
					equal(response.error.message, "Facility\'s Time Zone cannot be changed because STD and DST offsets are not equal.",
						"Time zone change error message is equal");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Copy Location (Division) - Fault if location already exist", 2, function () {
		var queue = new ActionQueue(this);

		var copyDivisionInfo = new envianceSdk.compliance.LocationInfo(this.generatedDivisionName, "Division", "/");
		queue.enqueue(function (context) {
			envianceSdk.compliance.copyLocation(copyDivisionInfo, context.generatedDivisionPath,
				this.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Get location - Happy path - Get location by Path", 17, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedFacilityAGLPath,
				function (response) {
					var expected = context.buildGeneratedFacilityCreationInfo();
					var actual = response.result;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, expected.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "MAS Text Text Box Small is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "MAS Text DDL is equal");
					deepEqual(actual.fieldValues[2].urlItems, expected.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.countyOrRegion, expected.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Get location - Fault if location does not exist by Path", 2, function () {
		var notExistedLocation = "/not existed location";
		envianceSdk.compliance.getLocation(notExistedLocation,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
	});

	asyncTest("Update location - Happy path - Update facility", 19, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName, null, this.generatedDivisionPath)
			.setFieldTemplate("XLS_Custom Field Template (all)")
			.addScalarFieldValue("XLS2_Text Box_Medium (50 char max)", "updated Facility")
			.addScalarFieldValue("XLS2_Text Box_Dropdown List", "Select")
			.addDocument("/Folder for Location Generated/Document for Location Generated")
			.addTag("Location Tag Scheme", "Location Tag 1");
		var address = this.buildAddress(this.street1, "New York City", "NY", this.country, "92025")
			.setStreet2(this.street2)
			.setCountyOrRegion("New York State");
		updateFacilityInfo.setAddress(address);
		updateFacilityInfo.setGeoLocation(this.buildGeoLocation(40.67, -73.94));

		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					facilityInfo = context.facilityInfo;
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath,
				function (response) {
					var actual = response.result;
					var expected = updateFacilityInfo;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, facilityInfo.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, facilityInfo.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "XLS2_Text Box_Medium (50 char max) is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(actual.fieldValues[2].urlItems, facilityInfo.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.countyOrRegion, expected.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");
					
					deepEqual(actual.tags, expected.tags, "Tags equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update location Async - Happy path - Update facility", 19, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName, null, this.generatedDivisionPath)
			.setFieldTemplate("XLS_Custom Field Template (all)")
			.addScalarFieldValue("XLS2_Text Box_Medium (50 char max)", "updated Facility")
			.addScalarFieldValue("XLS2_Text Box_Dropdown List", "Select")
			.addDocument("/Folder for Location Generated/Document for Location Generated")
			.addTag("Location Tag Scheme", "Location Tag 1")
			.addTag("Location Tag Scheme", "Location Tag 2");
		var address = this.buildAddress(this.street1, "New York City", "NY", this.country, "92025")
			.setStreet2(this.street2)
			.setCountyOrRegion("New York State");
		updateFacilityInfo.setAddress(address);
		updateFacilityInfo.setGeoLocation(this.buildGeoLocation(40.67, -73.94));

		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocationAsync(context.facilityPath, updateFacilityInfo,
				function (response) {
					envianceSdk._private._runCommandPolling(response,
						function (commandInfo) {
							facilityInfo = context.facilityInfo;
							equal(commandInfo.result.status, "Succeeded", "Facility updated asynchronously successfuly");
							queue.executeNext();
						},
						context.errorHandler
					);
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath,
				function (response) {
					var actual = response.result;
					var expected = updateFacilityInfo;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, facilityInfo.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, facilityInfo.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "XLS2_Text Box_Medium (50 char max) is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(actual.fieldValues[2].urlItems, facilityInfo.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.countyOrRegion, expected.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");
					
					deepEqual(actual.tags, expected.tags, "Tags equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location - Happy path - Update empty facility", 18, function () {
		var queue = new ActionQueue(this);

		var facilityInfo;

		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = new envianceSdk.compliance.LocationInfo(context.facilityName, "Facility", context.generatedDivisionPath)
				.setTimeZone(context.facilityTimeZone);
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					context.facilityPath = response.result.objects[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateFacilityInfo = this.buildFacilityCreationInfo();
		delete updateFacilityInfo.type;
		delete updateFacilityInfo.timeZone;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath,
				function (response) {
					var actual = response.result;
					var expected = updateFacilityInfo;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, facilityInfo.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, facilityInfo.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "XLS2_Text Box_Small (20 char max) is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(actual.fieldValues[2].urlItems, expected.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.countyOrRegion, expected.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location - Happy path - Clear UDF template, Calc template and UDF values", 18, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName + "_renamed", null, this.generatedDivisionPath);
		updateFacilityInfo.fieldTemplate = null;
		updateFacilityInfo.calcFieldTemplate = null;
		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					facilityInfo = context.facilityInfo;
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath + "_renamed",
				function (response) {
					var actual = response.result;
					var expected = updateFacilityInfo;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, facilityInfo.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, facilityInfo.timeZone.name, "TimeZone is equal");

					ok(!actual.hasOwnProperty("fieldTemplate"), "Field template is absent");
					ok(!actual.hasOwnProperty("calcFieldTemplate"), "CalcField template is absent");
					ok(!actual.hasOwnProperty("fieldValues"), "Field values is absent");
					ok(!actual.hasOwnProperty("calcFieldValues"), "CalcField values is absent");

					equal(actual.address.street1, facilityInfo.address.street1, "Street1 values equal");
					equal(actual.address.street2, facilityInfo.address.street2, "Street2 values equal");
					equal(actual.address.city, facilityInfo.address.city, "City values equal");
					equal(actual.address.countyOrRegion, facilityInfo.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, facilityInfo.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, facilityInfo.address.country, "Country values equal");
					equal(actual.address.postalCode, facilityInfo.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, facilityInfo.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, facilityInfo.geoLocation.latitude, "Latitude values equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});


	asyncTest("Update location - Happy path - Clear all UDF values", 3, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);
		var facilityCreationInfo = this.buildFacilityCreationInfo();

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName + "_renamed", null, this.generatedDivisionPath);

		updateFacilityInfo.fieldValues = [];
		updateFacilityInfo.fieldValues.push({ name: this.customFieldTextBox, values: [null] });
		updateFacilityInfo.fieldValues.push({ name: this.customFieldDDL, values: [null] });
		updateFacilityInfo.fieldValues.push({ name: this.customFieldHyperlink, urlItems: [null] });

		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					facilityInfo = context.facilityInfo;
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath + "_renamed",
				function (response) {
					var actual = response.result;
					equal(actual.fieldTemplate, facilityCreationInfo.fieldTemplate, "Field template is equal");
					equal(actual.fieldValues.length, 0, "Field values are absent");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update location - Happy path - Clear all UDF values for CalcTemplate", 3, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);
		var facilityCreationInfo = this.buildFacilityCreationInfo();

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName + "_renamed", null, this.generatedDivisionPath);

		updateFacilityInfo.calcFieldValues = [];
		updateFacilityInfo.calcFieldValues.push({ name: this.calcUdfFieldNumTb, values: [null] });
		updateFacilityInfo.calcFieldValues.push({ name: this.calcUdfFieldNumDdl, values: [null] });
		updateFacilityInfo.calcFieldValues.push({ name: this.calcUdfFieldNumLookUp, values: [null] });
		updateFacilityInfo.calcFieldValues.push({ name: this.calcUdfFieldBoolCb, values: [null] });
		updateFacilityInfo.calcFieldValues.push({ name: this.calcUdfFieldBoolDdl, values: [null] });

		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					facilityInfo = context.facilityInfo;
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath + "_renamed",
				function (response) {
					var actual = response.result;
					equal(actual.calcFieldTemplate, facilityCreationInfo.calcFieldTemplate, "Field template is equal");
					equal(actual.calcFieldValues.length, 0, "Field values are absent");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location - Happy path - Clear single UDF value", 5, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);
		var facilityCreationInfo = this.buildFacilityCreationInfo();

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName + "_renamed", null, this.generatedDivisionPath);

		updateFacilityInfo.fieldValues = [];
		updateFacilityInfo.fieldValues.push({ name: this.customFieldTextBox, values: [null] });

		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					facilityInfo = context.facilityInfo;
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath + "_renamed",
				function (response) {
					var actual = response.result;
					equal(actual.fieldTemplate, facilityCreationInfo.fieldTemplate, "Field template is equal");
					equal(actual.fieldValues.length, 2, "2 UDF Values left unchanged");
					deepEqual(actual.fieldValues[0].values, facilityCreationInfo.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(actual.fieldValues[1].urlItems, facilityCreationInfo.fieldValues[2].urlItems, "MAS Hyperlink is equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update location - Happy path - Clear single UDF value for calc template", 7, function () {
		var queue = new ActionQueue(this);

		this.addFacilityLocation(queue);
		var facilityCreationInfo = this.buildFacilityCreationInfo();

		var updateFacilityInfo = new envianceSdk.compliance.LocationInfo(this.facilityName + "_renamed", null, this.generatedDivisionPath);

		updateFacilityInfo.calcFieldValues = [];
		updateFacilityInfo.calcFieldValues.push({ name: this.calcUdfFieldNumTb, values: [null] });

		var facilityInfo;
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					facilityInfo = context.facilityInfo;
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.facilityPath + "_renamed",
				function (response) {
					var actual = response.result;
					equal(actual.calcFieldTemplate, facilityCreationInfo.calcFieldTemplate, "Field template is equal");
					equal(actual.calcFieldValues.length, 4, "4 CalcUDF Values left unchanged");
					deepEqual(actual.calcFieldValues[0].values, facilityCreationInfo.calcFieldValues[1].values, "calc-udf-num-ddl is equal");
					deepEqual(actual.calcFieldValues[1].values, facilityCreationInfo.calcFieldValues[2].values, "calc-udf-num-lookup is equal");
					deepEqual(actual.calcFieldValues[2].values, facilityCreationInfo.calcFieldValues[3].values, "calc-udf-bool-cb is equal");
					deepEqual(actual.calcFieldValues[3].values, facilityCreationInfo.calcFieldValues[4].values, "calc-udf-bool-ddl is equal");
					
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location - Fault when location does not exist", 2, function () {
		var queue = new ActionQueue(this);
		var invalidLocationPath = "/jstests nonexistent location";

		var updateFacilityInfo = this.buildFacilityCreationInfo();
		queue.enqueue(function (context) {
			envianceSdk.compliance.updateLocation(invalidLocationPath, updateFacilityInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location - Fault when location with same name already exists", 2, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var updateDivisionInfo = new envianceSdk.compliance.LocationInfo(context.generatedDivisionName, "Division", "/");
			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		var updateDivisionInfo;
		queue.enqueue(function (context) {
			updateDivisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			envianceSdk.compliance.updateLocation(context.generatedDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");

					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Location - Fault if \"activeDate\" later than \"inactiveDate\"", 2, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var updateDivisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
															   .setActiveDate(envianceSdk.IsoDate.parse("2012-09-19T18:00:00"))
															   .setInactiveDate(envianceSdk.IsoDate.parse("2012-09-18T18:00:00"));
			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath, updateDivisionInfo,
			context.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
		});

		queue.executeNext();
	});

	asyncTest("Update Location - Fault if attached document does not exist", 2, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var updateDivisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
															   .addDocument("/Not existed document");
			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Location - Fault if responsible user does not exist", 2, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var updateDivisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
															   .setResponsibleUser("not_Existed_User");
			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath, updateDivisionInfo,
			context.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			});
		});

		queue.executeNext();
	});

	asyncTest("Update Location - Fault if UDF template does not exist", 2, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var invalidFieldTemplateName = "jstetstFieldTemplate";

			var updateDivisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
															   .setFieldTemplate(invalidFieldTemplateName);
			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update Location - Fault if UDF does not exist", 2, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			var invalidUdfName = "jstetstUdf";

			var updateDivisionInfo = new envianceSdk.compliance.LocationInfo(this.divisionName, "Division", "/")
															   .setFieldTemplate(this.fieldTemplateName)
															   .addScalarFieldValue(invalidUdfName, "Invalid UDF");

			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath, updateDivisionInfo,
			context.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			});
		});

		queue.executeNext();
	});

	asyncTest("Update Location (Division) - Check warnings", 6, function () {
		var queue = new ActionQueue(this);

		var divisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/");
			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					context.divisionPath = response.result.objects[0];
					context.locationPathsToClear.push(response.result.objects[0]);
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateDivisionInfo;
		queue.enqueue(function (context) {
			updateDivisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
														   .setTimeZone(context.facilityTimeZone);
			updateDivisionInfo.id = createUUID();
			var address = context.buildAddress(context.street1, context.city, context.stateOrProvince, context.country, context.postalCode)
						.setStreet2(context.street2)
						.setCountyOrRegion(context.countyOrRegion);
			updateDivisionInfo.setAddress(address);
			updateDivisionInfo.setGeoLocation(context.buildGeoLocation(context.latitude, context.longitude));
			envianceSdk.compliance.updateLocation(context.divisionPath, updateDivisionInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'type\'") > 0, "Warning for 'type' OK");
					ok(response.metadata.warnings.indexOf("\'timeZone\'") > 0, "Warning for 'timeZone' OK");
					ok(response.metadata.warnings.indexOf("\'address\'") > 0, "Warning for 'address' OK");
					ok(response.metadata.warnings.indexOf("\'geoLocation\'") > 0, "Warning for 'geoLocation' OK");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update Location (Facility) - Check warnings", 6, function () {
		var queue = new ActionQueue(this);

		var facilityInfo;

		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = new envianceSdk.compliance.LocationInfo(context.facilityName, "Facility", context.generatedDivisionPath)
													 .setTimeZone(context.facilityTimeZone);
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					context.facilityPath = response.result.objects[0];
					context.locationPathsToClear.push(response.result.objects[0]);
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateFacilityInfo;
		queue.enqueue(function (context) {
			updateFacilityInfo = new envianceSdk.compliance.LocationInfo(context.facilityName, "Facility", context.generatedDivisionPath)
														   .setTimeZone(context.facilityTimeZone);
			updateFacilityInfo.id = createUUID();
			var address = context.buildAddress(context.street1, context.city, context.stateOrProvince, context.country, context.postalCode)
						.setStreet2(context.street2)
						.setCountyOrRegion(context.countyOrRegion);
			updateFacilityInfo.setAddress(address);
			updateFacilityInfo.setGeoLocation(context.buildGeoLocation(context.latitude, context.longitude));
			envianceSdk.compliance.updateLocation(context.facilityPath, updateFacilityInfo,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'type\'") > 0, "Warning for 'type' OK");
					ok(response.metadata.warnings.indexOf("\'timeZone\'") > 0, "Warning for 'timeZone' OK");
					equal(response.metadata.warnings.indexOf("\'address\'"), -1, "Warning for 'address' is missing");
					equal(response.metadata.warnings.indexOf("\'geoLocation\'"), -1, "Warning for 'geoLocation' is missing");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Move location - Happy path - Move facility without update", 19, function () {
		var queue = new ActionQueue(this);

		var facilityInfo;
		var facilityInfoForMovePath;

		this.clearLocation(queue, this.generatedDivisionForMovePath + "/" + this.facilityName);
		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = context.buildFacilityCreationInfo();
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					facilityInfoForMovePath = response.result.objects[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateFacilityInfo;
		queue.enqueue(function (context) {
			updateFacilityInfo = new envianceSdk.compliance.LocationInfo(null, null, context.generatedDivisionForMovePath)
				.setFieldTemplate(context.fieldTemplateName);
			envianceSdk.compliance.updateLocation(facilityInfoForMovePath, updateFacilityInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + facilityInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedDivisionForMovePath + "/" + facilityInfo.name,
				function (response) {
					var actual = response.result;
					var expected = context.buildFacilityCreationInfo();

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, expected.type, "Type value is equal");
					equal(actual.parentPath, updateFacilityInfo.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, expected.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "MAS Text Text Box Small is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "MAS Text DDL is equal");
					deepEqual(actual.fieldValues[2].urlItems, expected.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.countyOrRegion, expected.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");
					
					deepEqual(actual.tags, expected.tags, "Tags equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Move location - Happy path - Move empty facility and update", 19, function () {
		var queue = new ActionQueue(this);

		var facilityInfo;
		var facilityPath;

		this.clearLocation(queue, this.generatedDivisionForMovePath + "/" + this.facilityName);
		this.clearLocation(queue, this.generatedDivisionPath + "/" + this.facilityName);

		queue.enqueue(function (context) {
			facilityInfo = new envianceSdk.compliance.LocationInfo(context.facilityName, "Facility", context.generatedDivisionPath)
													 .setTimeZone(context.facilityTimeZone);
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					facilityPath = response.result.objects[0];
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateFacilityInfo;
		queue.enqueue(function (context) {
			updateFacilityInfo = context.buildFacilityCreationInfo();
			updateFacilityInfo.parentPath = context.generatedDivisionForMovePath;
			delete updateFacilityInfo.type;
			delete updateFacilityInfo.timeZone;
			envianceSdk.compliance.updateLocation(facilityPath, updateFacilityInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					context.locationPathsToClear.push(updateFacilityInfo.parentPath + "/" + updateFacilityInfo.name);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedDivisionForMovePath + "/" + updateFacilityInfo.name,
				function (response) {
					var actual = response.result;
					var expected = updateFacilityInfo;

					equal(actual.name, expected.name, "Name value is equal");
					equal(actual.type, facilityInfo.type, "Type value is equal");
					equal(actual.parentPath, expected.parentPath, "Parent path is equal");
					equal(actual.timeZone.name, facilityInfo.timeZone.name, "TimeZone is equal");
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					deepEqual(actual.fieldValues[0].values, expected.fieldValues[0].values, "XLS2_Text Box_Small (20 char max) is equal");
					deepEqual(actual.fieldValues[1].values, expected.fieldValues[1].values, "XLS2_Text Box_Dropdown List is equal");
					deepEqual(actual.fieldValues[2].urlItems, expected.fieldValues[2].urlItems, "MAS Hyperlink is equal");

					equal(actual.address.street1, expected.address.street1, "Street1 values equal");
					equal(actual.address.street2, expected.address.street2, "Street2 values equal");
					equal(actual.address.city, expected.address.city, "City values equal");
					equal(actual.address.countyOrRegion, expected.address.countyOrRegion, "CountyOrRegion values equal");
					equal(actual.address.stateOrProvince, expected.address.stateOrProvince, "StateOrProvince values equal");
					equal(actual.address.country, expected.address.country, "Country values equal");
					equal(actual.address.postalCode, expected.address.postalCode, "Postal code values equal");

					equal(actual.geoLocation.longitude, expected.geoLocation.longitude, "Longitude values equal");
					equal(actual.geoLocation.latitude, expected.geoLocation.latitude, "Latitude values equal");

					deepEqual(actual.tags, expected.tags, "Tags equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Move location - Fault when location with same name already exists", 2, function () {
		var queue = new ActionQueue(this);

		var movedFacilityInfo;
		var movedFacilityPath;

		this.clearLocation(queue, this.generatedDivisionForMovePath + "/" + this.generatedFacilityWAGLName);

		queue.enqueue(function (context) {
			movedFacilityInfo = new envianceSdk.compliance.LocationInfo(context.generatedFacilityWAGLName, "Facility", context.generatedDivisionForMovePath)
				.setTimeZone(context.facilityTimeZone);
			envianceSdk.compliance.createLocation(movedFacilityInfo,
				function (response) {
					movedFacilityPath = response.result.objects[0];
					context.locationPathsToClear.push(response.result.objects[0]);
					queue.executeNext();
				}, context.errorHandler);
		});

		var updateFacilityInfo;
		queue.enqueue(function (context) {
			updateFacilityInfo = new envianceSdk.compliance.LocationInfo(null, null, context.generatedDivisionPath)
				.setTimeZone(context.facilityTimeZone);
			envianceSdk.compliance.updateLocation(context.generatedDivisionForMovePath + "/" + context.generatedFacilityWAGLName, updateFacilityInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete location - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		this.addFacilityLocation(queue);

		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocation(context.facilityPath, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Delete. Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.divisionPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Delete location Async - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		this.addFacilityLocation(queue);

		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocationAsync(context.facilityPath, true,
				function (response) {
					envianceSdk._private._runCommandPolling(response,
					function (commandInfo) {
						equal(commandInfo.metadata.statusCode, 200, "Delete. Status code is correct");
						queue.executeNext();
					},
					context.errorHandler);
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.divisionPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Delete location Async - Happy path", 3, function () {
		var queue = new ActionQueue(this);
		this.addFacilityLocation(queue);

		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocationAsync(context.facilityPath, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Delete. Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.divisionPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete location - Fault when location does not exist", 2, function () {
		var queue = new ActionQueue(this);
		var notExistedId = createUUID();

		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocation(notExistedId, true,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete location - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocation(context.generatedDivisionPath, true,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");

					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				});
		});

		queue.executeNext();
	});

	////////////////////  New Test Block

	asyncTest("Create Location (Division) - add UDF's Value Histories (all types) - Happy path", 10, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo;
		this.initUserTimeZoneOffSet(queue);
		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldTextDDL, "text1", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldNumber, "8", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldNumberDDL, "376", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addDateFieldHistValue(context.customHistFieldDate, "2010-01-01T12:00:00", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldBool, "True", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});
	
		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var location = response.result;
					equal(location.name, divisionInfo.name, "Name value is equal");
					equal(location.type, divisionInfo.type, "Type value is equal");
					equal(location.parentPath, divisionInfo.parentPath, "Parent path is equal");

					var actualFields = toMap(location.fieldValues, function (field) { return field.name; });
					var expectedFields = toMap(divisionInfo.fieldValues, function (field) { return field.name; });

					deepEqual(actualFields[context.customHistFieldText].values, expectedFields[context.customHistFieldText].values, "text historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldTextDDL].values, expectedFields[context.customHistFieldTextDDL].values, "DDL text historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldNumber].values, expectedFields[context.customHistFieldNumber].values, "number historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldNumberDDL].values, expectedFields[context.customHistFieldNumberDDL].values, "DDL number historizable value texts are equal");
					var expectedDatetime = new Date(Date.parse(expectedFields[context.customHistFieldDate].values) - tzOffset * 60000);
					deepEqual(new Date(actualFields[context.customHistFieldDate].values), expectedDatetime, "date historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldBool].values, expectedFields[context.customHistFieldBool].values, "checkbox historizable value texts are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Location (Facility) - add UDF's Value Histories (all types for calc template) - Happy path", 9, function () {
		var self = this;
		var queue = new ActionQueue(this);

		var locationPath;
		var facilityInfo;

		this.clearLocation(queue, "/" + this.facilityName);
		
		queue.enqueue(function (context) {
			facilityInfo = new envianceSdk.compliance.LocationInfo(self.facilityName, "Facility", "/")
				.setTimeZone(self.facilityTimeZone)
				.setCalcFieldTemplate(self.calcFieldTemplateName)
				.addScalarCalcFieldHistValue(self.calcUdfFieldNumTbTvh, "1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"))
				.addScalarCalcFieldHistValue(self.calcUdfFieldNumDdlTvh, "1000", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"))
				.addScalarCalcFieldHistValue(self.calcUdfFieldNumLookUpTvh, "calc-udf-num-lookup-tvh 1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"))
				.addScalarCalcFieldHistValue(self.calcUdfFieldBoolCbTvh, "True", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"))
				.addScalarCalcFieldHistValue(self.calcUdfFieldBoolDdlTvh, "ddlTrue1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"));
			
			envianceSdk.compliance.createLocation(facilityInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Facility created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {					
					var location = response.result;
					equal(location.name, facilityInfo.name, "Name value is equal");
					equal(location.type, facilityInfo.type, "Type value is equal");
					equal(location.parentPath, facilityInfo.parentPath, "Parent path is equal");

					var actualFields = toMap(location.calcFieldValues, function (field) { return field.name; });
					var expectedFields = toMap(facilityInfo.calcFieldValues, function (field) { return field.name; });

					deepEqual(actualFields[context.calcUdfFieldNumTbTvh].values, expectedFields[context.calcUdfFieldNumTbTvh].values, "Number historizable value texts are equal");
					deepEqual(actualFields[context.calcUdfFieldNumDdlTvh].values, expectedFields[context.calcUdfFieldNumDdlTvh].values, "DDL number historizable value texts are equal");
					deepEqual(actualFields[context.calcUdfFieldNumLookUpTvh].values, expectedFields[context.calcUdfFieldNumLookUpTvh].values, "Lookup historizable value texts are equal");
					deepEqual(actualFields[context.calcUdfFieldBoolCbTvh].values, expectedFields[context.calcUdfFieldBoolCbTvh].values, "Checkbox historizable value texts are equal");
					deepEqual(actualFields[context.calcUdfFieldBoolDdlTvh].values, expectedFields[context.calcUdfFieldBoolDdlTvh].values, "DDL checkbox historizable value texts are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories, several correct periods  - Happy path", 6, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 2", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var location = response.result;
					equal(location.name, divisionInfo.name, "Name value is equal");
					equal(location.type, divisionInfo.type, "Type value is equal");
					equal(location.parentPath, divisionInfo.parentPath, "Parent path is equal");

					deepEqual(location.fieldValues[0].values, divisionInfo.fieldValues[0].values, "UDF text historizable value 1");
					deepEqual(location.fieldValues[1].values, divisionInfo.fieldValues[1].values, "UDF text historizable value 2");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Location (Division) - set Template with Histories UDF, values not specify  - Happy path", 5, function () {
		var queue = new ActionQueue(this);

		var locationPath;
		var divisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName);
			envianceSdk.compliance.createLocation(divisionInfo,
				function (response) {
					locationPath = response.result.objects[0];
					context.locationPathsToClear.push(locationPath);
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(locationPath,
				function (response) {
					var location = response.result;
					equal(location.name, divisionInfo.name, "Name value is equal");
					equal(location.type, divisionInfo.type, "Type value is equal");
					equal(location.parentPath, divisionInfo.parentPath, "Parent path is equal");
					equal(location.fieldValues.length, location.fieldValues.length, "fields count is equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if value is overlap", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", envianceSdk.IsoDate.parse("2012-01-02T00:00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text", envianceSdk.IsoDate.parse("2013-01-02T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault Custom field Template is invalid (non historizable)", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.fieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", envianceSdk.IsoDate.parse("2012-01-02T00:00:00"), envianceSdk.IsoDate.parse("2013-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					equal(response.error.errorNumber, 0, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if End Date less than Begin Date", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", envianceSdk.IsoDate.parse("2015-01-02T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if Begin Date is not set", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", null, envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if Begin Date is invalid", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", "invalid text", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					equal(response.error.errorNumber, 0, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if UDF name is no existing", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue("Invalid UDF name", "text", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");

					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault text value is empty", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");

					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault number value is empty", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldNumber, "", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if incorrect value - text value to num field", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldNumber, "text", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"), null);
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault date value is empty", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldDate, "", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");

					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if incorrect value - text value to date field", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldDate, "text", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"), null);
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault bool value is empty", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldBool, "", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");

					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Location (Division) - add UDF's Value Histories - Fault if incorrect value - non boolean value to bool field", 2, function () {
		var queue = new ActionQueue(this);
		this.clearLocation(queue, "/" + this.divisionName);
		queue.enqueue(function (context) {
			var divisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldBool, "text", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"), null);
			envianceSdk.compliance.createLocation(divisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Get Division - Happy path - Get location with historizable UDF's values", 4, function () {
		var queue = new ActionQueue(this);

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedHstrFieldsDivisionPath,
				function (response) {
					var expected = context.buildGeneratedHstrFieldDivisionCreationInfo();
					var actual = response.result;
					equal(actual.fieldTemplate, expected.fieldTemplate, "Field template is equal");
					var actualFields = toMap(actual.fieldValues, function (field) { return field.name; });
					var expectedFields = toMap(expected.fieldValues, function (field) { return field.name; });
					deepEqual(actualFields[context.customHistFieldText].values, expectedFields[context.customHistFieldText].values, "text historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldNumber].values, expectedFields[context.customHistFieldNumber].values, "number historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldBool].values, expectedFields[context.customHistFieldBool].values, "checkbox historizable value texts are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - Happy path - Set UDF template with histories fields without values", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName);

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {
					deepEqual(response.result.fieldTemplate, updateDivisionInfo.fieldTemplate, "fieldTemplate are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - Happy path - Set UDF template with histories and nonhistory UDF values", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;

		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 66", envianceSdk.IsoDate.parse("2013-01-01T00:00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 77", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldValue(context.customFieldTextBox, "nonhistvalue");

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {

					var location = response.result;
					var actualFields = toMap(location.fieldValues, function (field) { return field.name; });
					var expectedFields = toMap(updateDivisionInfo.fieldValues, function (field) { return field.name; });
					deepEqual(actualFields[context.customHistFieldText].values, expectedFields[context.customHistFieldText].values, "text historizable value texts are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Update location (Division) - Happy path - template with histories fields - delete UDF values", 3, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		var oldCountValues;

		// add values
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 66", envianceSdk.IsoDate.parse("2013-01-01T00:00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 77", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldValue(context.customFieldTextBox, "nonhistvalue");

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {					
					oldCountValues = response.result.fieldValues.length;
					queue.executeNext();
				}, context.errorHandler);
		});

		// delete
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo();
			updateDivisionInfo.fieldValues = [];
			updateDivisionInfo.fieldValues.push({ name: context.customHistFieldText, values: [null] });
			updateDivisionInfo.fieldValues.push({ name: context.customFieldTextBox, values: [null] });

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {
					equal(response.result.fieldValues.length, oldCountValues - 3, "Field values list is empty");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - Happy path - Set UDF template and histories UDF values", 7, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		this.initUserTimeZoneOffSet(queue);
		
		queue.enqueue(function (context) {
			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldTextDDL, "text1", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldNumber, "8", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"), envianceSdk.IsoDate.parse("2016-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldNumberDDL, "376", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addDateFieldHistValue(context.customHistFieldDate, "2010-01-01T12:00:00", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldBool, "True", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {

					var location = response.result;
					var actualFields = toMap(location.fieldValues, function (field) { return field.name; });
					var expectedFields = toMap(updateDivisionInfo.fieldValues, function (field) { return field.name; });
					deepEqual(actualFields[context.customHistFieldText].values, expectedFields[context.customHistFieldText].values, "text historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldTextDDL].values, expectedFields[context.customHistFieldTextDDL].values, "DDL text historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldNumber].values, expectedFields[context.customHistFieldNumber].values, "number historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldNumberDDL].values, expectedFields[context.customHistFieldNumberDDL].values, "DDL number historizable value texts are equal");
					var expectedDatetime = new Date(Date.parse(expectedFields[context.customHistFieldDate].values) - tzOffset * 60000);
					deepEqual(new Date(actualFields[context.customHistFieldDate].values), expectedDatetime, "date historizable value texts are equal");
					deepEqual(actualFields[context.customHistFieldBool].values, expectedFields[context.customHistFieldBool].values, "checkbox historizable value texts are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - Happy path - Set UDF template with histories and nonhistory UDF values", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 66", envianceSdk.IsoDate.parse("2013-01-01T00:00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 77", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldValue(context.customFieldTextBox, "non history value");

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {

					var location = response.result;
					var actualFields = toMap(location.fieldValues, function (field) { return field.name; });
					var expectedFields = toMap(updateDivisionInfo.fieldValues, function (field) { return field.name; });
					deepEqual(actualFields[context.customHistFieldText].values, expectedFields[context.customHistFieldText].values, "text historizable value texts are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - Happy path - Add histories UDF values with not overlap periods", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2014-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 2", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				function (response) {
					equal(response.result.status, "Succeeded", "Facility updated successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(context.generatedForUpdateHstrFieldsDivisionPath,
				function (response) {

					var location = response.result;
					var actualFields = toMap(location.fieldValues, function (field) { return field.name; });
					var expectedFields = toMap(updateDivisionInfo.fieldValues, function (field) { return field.name; });
					deepEqual(actualFields[context.customHistFieldText].values, expectedFields[context.customHistFieldText].values, "text historizable value texts are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if add histories UDF values with overlap periods", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 2", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if period with empty Begin Date", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", "", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if End Date less than Begin Date", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2010-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault add non existing UDF", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue("Non exist UDF", "text 1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault add non existing UDF", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue("Non exist UDF", "text 1", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if invalid Begin Date in value period", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", "Bad date", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Status code OK");
					equal(response.error.errorNumber, 0, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if text value is empty", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if text value is invalid", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if number value is empty", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldNumber, "", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if number value is invalid", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldNumber, "bad value", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if date value is empty", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldDate, "", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if date value is invalid", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldDate, "bad value", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if boolean value is empty", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldBool, "", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Update location (Division) - add UDF's Value Histories - Fault if boolean value is invalid", 2, function () {
		var queue = new ActionQueue(this);
		var updateDivisionInfo;
		queue.enqueue(function (context) {

			updateDivisionInfo = new envianceSdk.compliance.LocationInfo()
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldBool, "bad value", envianceSdk.IsoDate.parse("2010-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));

			envianceSdk.compliance.updateLocation(context.generatedForUpdateHstrFieldsDivisionPath, updateDivisionInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete location (Division) - add UDF's Value Histories - Happy path ", 4, function () {
		var queue = new ActionQueue(this);

		var divisionPath;
		var deleteDivisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			deleteDivisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName)
				.addScalarFieldHistValue(context.customHistFieldText, "text 1", envianceSdk.IsoDate.parse("2014-01-01T00:00:00"), envianceSdk.IsoDate.parse("2015-01-01T00:00:00"))
				.addScalarFieldHistValue(context.customHistFieldText, "text 2", envianceSdk.IsoDate.parse("2015-01-01T00:00:00"));
			envianceSdk.compliance.createLocation(deleteDivisionInfo,
				function (response) {
					divisionPath = response.result.objects[0];
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocation(divisionPath, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Delete. Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(divisionPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
	
	asyncTest("Delete location (Division) - Set template with Histories UDF without values - Happy path ", 4, function () {
		var queue = new ActionQueue(this);

		var divisionPath;
		var deleteDivisionInfo;

		this.clearLocation(queue, "/" + this.divisionName);

		queue.enqueue(function (context) {
			deleteDivisionInfo = new envianceSdk.compliance.LocationInfo(context.divisionName, "Division", "/")
				.setFieldTemplate(context.histFieldTemplateName);
			
			envianceSdk.compliance.createLocation(deleteDivisionInfo,
				function (response) {
					divisionPath = response.result.objects[0];
					equal(response.result.status, "Succeeded", "Division created successfuly");
					queue.executeNext();
				}, context.errorHandler);
		});

		// Then
		queue.enqueue(function (context) {
			envianceSdk.compliance.deleteLocation(divisionPath, true,
				function (response) {
					equal(response.metadata.statusCode, 200, "Delete. Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.compliance.getLocation(divisionPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});
}

if (typeof (UnitTestsApplication) == "undefined") {
	executeComplianceServiceTests();
}