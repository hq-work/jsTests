if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Documents', execute: executeDocumentServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof documentConfig == "undefined")
	documentConfig = {};

function executeDocumentServiceTests() {
	module("Document Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.accessUserName = documentConfig.accessUserName || this.accessUserName;
			this.noAccessUserName = documentConfig.noAccessUserName || "jstestsNotAccessUser";
			this.noManageRightsUserName = (documentConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.userWithPermission = (documentConfig.userWithPermission || "jstestsUserWithDocumentPermission") + qUnitDbSuffix;
			this.password = documentConfig.password || "1111";

			this.generatedObjectId = "045d36bc-ab1e-4155-bc18-86b257068bea";
			this.generatedObjectName = "jsTestsDivision document association 1";
			this.generatedSecondObjectId = "ae3a951b-a557-4b70-bdb2-6779937a1533";
			this.generatedSecondObjectName = "jsTestsDivision document association 2";
			this.generatedTaskId = "185fd881-3658-4500-8dda-0ebbb7288c4a";
			this.generatedWorkflowId = "6e339be4-d35a-412e-8caa-d116eed32802";
			this.generatedDocumentContentId = "04d13a5b-f86f-493f-9d69-f7273de11ecf";
			this.generatedDocumentContentName = "JsTestsDocument content";
			this.generatedDocumentContentUrlId = "ae8c4455-9032-457b-b774-9ce151f3639d";
			this.generatedDocumentContentUrlName = "JsTestsDocument contentUri";
			this.generatedRootFolderId = "9a06b15f-efcf-43eb-9b6b-fe6c3aed1fe9";
			this.generatedRootFolderName = "JsTestsRootDocumentFolder Generated";
			this.generatedRootFolderPath = "/" + this.generatedRootFolderName;
			this.generatedFolderId = "9d01fb8a-46cc-407f-9984-47497a28e023";
			this.generatedFolderName = "JsTestsDocumentFolder Generated";
			this.generatedFolderPath = this.generatedRootFolderPath + "/" + this.generatedFolderName;

			this.documentIdsToClear = [];
			this.documentFolderIdsToClear = [];

			this.documentName = "jstestsDocument";
			this.documentContentUrl = "https://go.enviance.com/Documents/DocumentDownload.aspx";
			this.documentContent = "77u/IkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNpY2luZyBlbGl0LCBzZWQgZG8gZWl1c21vZCB0ZW1wb3IgaW5jaWRpZHVudCB1dCBsYWJvcmUgZXQgZG9sb3JlIG1hZ25hIGFsaXF1YS4gVXQgZW5pbSBhZCBtaW5pbSB2ZW5pYW0sIHF1aXMgbm9zdHJ1ZCBleGVyY2l0YXRpb24gdWxsYW1jbyBsYWJvcmlzIG5pc2kgdXQgYWxpcXVpcCBleCBlYSBjb21tb2RvIGNvbnNlcXVhdC4gRHVpcyBhdXRlIGlydXJlIGRvbG9yIGluIHJlcHJlaGVuZGVyaXQgaW4gdm9sdXB0YXRlIHZlbGl0IGVzc2UgY2lsbHVtIGRvbG9yZSBldSBmdWdpYXQgbnVsbGEgcGFyaWF0dXIuIEV4Y2VwdGV1ciBzaW50IG9jY2FlY2F0IGN1cGlkYXRhdCBub24gcHJvaWRlbnQsIHN1bnQgaW4gY3VscGEgcXVpIG9mZmljaWEgZGVzZXJ1bnQgbW9sbGl0IGFuaW0gaWQgZXN0IGxhYm9ydW0uIg==";
			this.documentFileName = "jstests.txt";
			this.rootFolderName = "jstestsRootDocumentFolder";
			this.folderName = "jstestsDocumentFolder";

			this.addCreateDocumentWithContentAction = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.documents.deleteDocument("/" + context.documentName,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
				queue.enqueue(function (context) {
					context.documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description",
						"/", context.documentContent, context.documentFileName);
					envianceSdk.documents.createDocument(context.documentInfo,
						function (response) {
							context.documentId = response.result;
							context.documentIdsToClear.push(response.result);
							queue.executeNext();
						}, context.errorHandler);
				});
			};

			this.addCreateDocumentWithContentUrlAction = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.documents.deleteDocument("/" + context.documentName,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
				queue.enqueue(function (context) {
					context.documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
						.setContentUrl(context.documentContentUrl);
					envianceSdk.documents.createDocument(context.documentInfo,
						function (response) {
							context.documentId = response.result;
							context.documentIdsToClear.push(response.result);
							queue.executeNext();
						}, context.errorHandler);
				});
			};

			this.buildDocumentFolderInfo = function (name, parentFolder) {
				return new envianceSdk.documents.DocumentFolderInfo(name, name + " description", parentFolder);
			};

			this.addCreateDocumentFolderAction = function (queue, name, parentFolder) {
				queue.enqueue(function (context) {
					envianceSdk.documents.deleteDocumentFolder(parentFolder + "/" + name,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
				queue.enqueue(function (context) {
					context.documentFolderInfo = context.buildDocumentFolderInfo(name, parentFolder);
					envianceSdk.documents.createDocumentFolder(context.documentFolderInfo,
						function (response) {
							context.documentFolderId = response.result;
							context.documentFolderIdsToClear.push(response.result);
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

			this.authenticateUserWithPermission = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.authentication.authenticate(context.userWithPermission, context.password,
						function () {
							queue.executeNext();
						},
						context.errorHandler);
				});
			};

			this.clearDocument = function (queue, documentPath) {
				queue.enqueue(function (context) {
					envianceSdk.documents.deleteDocument(documentPath,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
			};
			this.clearFolder = function (queue, folderPath) {
				queue.enqueue(function (context) {
					envianceSdk.documents.deleteDocumentFolder(folderPath,
						function () { queue.executeNext(); },
						function () { queue.executeNext(); }
					);
				});
			};
		},

		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});


			for (var d = this.documentIdsToClear.length - 1; d >= 0; d--) {
				envianceSdk.documents.deleteDocument(this.documentIdsToClear[d],
					function () {
						start();
					}, this.errorHandler);
				stop();
			}
			
			for (var d = this.documentFolderIdsToClear.length - 1; d >= 0; d--) {
				envianceSdk.documents.deleteDocumentFolder(this.documentFolderIdsToClear[d],
					function () {
						start();
					}, this.errorHandler);
				stop();
			}
		}
	});

	asyncTest("Create Document - Happy path - Upload file", 10, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		this.clearDocument(queue, "/" + this.documentName);
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + " description", "/", context.documentContent, context.documentFileName)
				.addPathAssociatedObject(context.generatedObjectId)
				.addAssociatedTask(context.generatedTaskId)
				.addAssociatedWorkflow(context.generatedWorkflowId);
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					documentId = response.result;
					documentInfo.objects[0] = "/" + context.generatedObjectName;
					context.documentIdsToClear.push(documentId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
				function (response) {
					var actual = response.result;
					var expected = documentInfo;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.mimeType, "text/plain", "MimeType are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					var contentUrl = envianceSdk.utilities.uri.toDocumentDownload(documentId);
					equal(actual.contentUrl, contentUrl, "ContentUrl are equal");

					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.tasks, expected.tasks, "Tasks are equal");
					deepEqual(actual.workflows, expected.workflows, "Workflows are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Happy path - Link to a file", 7, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		this.clearDocument(queue, "/" + this.documentName);
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					documentId = response.result;
					context.documentIdsToClear.push(documentId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
				function (response) {
					var actual = response.result;
					var expected = documentInfo;
					equal(actual.name, expected.name, "Name are equal");
					ok(!actual.hasOwnProperty("mimeType"), "MimeType is missing");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");
					equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Happy path - Set mimeType", 1, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		var mimeType = "jstestsMimeType";
		this.clearDocument(queue, "/" + this.documentName);
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName,
																  context.documentName + " description", "/",
																  context.documentContent,
																  context.documentFileName,
																  mimeType);
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					documentId = response.result;
					context.documentIdsToClear.push(documentId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
				function (response) {
					var actual = response.result;
					equal(actual.mimeType, mimeType, "MimeType are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Happy path - Extension is not case sensitive", 1, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		var documentFileName = "testFile.TxT";
		this.clearDocument(queue, "/" + this.documentName);
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName,
																  context.documentName + " description", "/",
																  context.documentContent,
																  documentFileName);
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					documentId = response.result;
					context.documentIdsToClear.push(documentId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
				function (response) {
					var actual = response.result;
					equal(actual.mimeType, "text/plain", "MimeType are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Happy path - Parent folder is Id", 6, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		this.clearDocument(queue, "/" + this.documentName);
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName,
																  context.documentName + "Description",
																  context.generatedFolderId)
					.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
					function (response) {
						equal(response.metadata.statusCode, 201, "Status code is correct");
						ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
						documentId = response.result;
						context.documentIdsToClear.push(documentId);
						queue.executeNext();
					}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
					function (response) {
						var actual = response.result;
						var expected = documentInfo;
						equal(actual.name, expected.name, "Name are equal");
						equal(actual.description, expected.description, "Description are equal");
						equal(actual.folder, context.generatedFolderPath, "Folder are equal");
						equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
						start();
					}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Happy path - Parent folder is missing", 6, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName,
																  context.documentName + "Description")
					.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
					function (response) {
						equal(response.metadata.statusCode, 201, "Status code is correct");
						ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
						documentId = response.result;
						context.documentIdsToClear.push(documentId);
						queue.executeNext();
					}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
					function (response) {
						var actual = response.result;
						var expected = documentInfo;
						equal(actual.name, expected.name, "Name are equal");
						equal(actual.description, expected.description, "Description are equal");
						equal(actual.folder, "/", "Folder are equal");
						equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
						start();
					}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Happy path - User doesn't have 'Manage Documents' rights but have permission on one folder", 4, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithPermission(queue);

		var documentInfo;
		var documentId;
		this.clearDocument(queue, this.generatedRootFolderPath + "/" + this.documentName);
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName,
																  context.documentName + "Description",
																  context.generatedRootFolderPath)
					.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
					function (response) {
						documentId = response.result;
						context.documentIdsToClear.push(documentId);
						queue.executeNext();
					}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
					function (response) {
						var actual = response.result;
						var expected = documentInfo;
						equal(actual.name, expected.name, "Name are equal");
						equal(actual.description, expected.description, "Description are equal");
						equal(actual.folder, context.generatedRootFolderPath, "Folder are equal");
						equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
						start();
					}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Fault if associated \"object\" does not exist", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName,
																  this.documentName + "Description", "/")
													.setContentUrl(this.documentContentUrl)
													.addIdAssociatedObject(createUUID());
		envianceSdk.documents.createDocument(documentInfo,
			this.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if associated \"task\" does not exist", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName,
																  this.documentName + "Description", "/")
													.setContentUrl(this.documentContentUrl)
													.addAssociatedTask(createUUID());
		envianceSdk.documents.createDocument(documentInfo,
			this.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if associated \"workflow\" does not exist", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName,
																  this.documentName + "Description", "/")
													.setContentUrl(this.documentContentUrl)
													.addAssociatedWorkflow(createUUID());
		envianceSdk.documents.createDocument(documentInfo,
			this.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if ContentUrl is invalid", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/", this.documentContent)
			.setContentUrl("http://aaaaa#.@.com");
		envianceSdk.documents.createDocument(documentInfo,
			this.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if \"name\" is missing", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo("", this.documentName + "Description", "/")
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.createDocument(documentInfo,
			this.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if Content and ContentUrl have value", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/", this.documentContent)
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.createDocument(documentInfo,
			this.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if Name is empty", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo("", this.documentName + "Description", "/")
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if Name is too long", 2, function () {
		var documentInfo;
		var documentName = new Array(257).join("s");
		documentInfo = new envianceSdk.documents.DocumentInfo(documentName, this.documentName + "Description", "/")
												.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault when \"description\" is too long", 2, function () {
		var description = new Array(3002).join("s");
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, description, "/");
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if Name contains disallowed chars", 6, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName + ":", context.documentName + "Description", "/")
													.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - ':')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "|", context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '|')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "/", context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '/')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Document - Fault if Content has value and FileName is empty", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/", this.documentContent);
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if FileName has value and Content is empty", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/", "", this.documentFileName);
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault when document already exist", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentUrlName.toLowerCase(),
																  this.generatedDocumentContentUrlName + "Description", "/")
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 409, "Status code is correct");
				equal(response.error.errorNumber, 101, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault if folder does not exist - Path", 2, function () {
		var notExistentFolder = "/Not existent folder";
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", notExistentFolder)
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.createDocument(documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		var documentInfo;
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
													.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
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

	asyncTest("Create Document - Check warnings", 3, function () {
		var queue = new ActionQueue(this);
		var documentId;
		this.clearDocument(queue, "/" + this.documentName);
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/")
													.setContentUrl(this.documentContentUrl);
		documentInfo.id = createUUID();
		documentInfo.version = 1;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'version\'") > 0, "Warning for 'version' OK");
					documentId = response.result;
					context.documentIdsToClear.push(documentId);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Document - Happy path - Upload file", 6, function () {
		var queue = new ActionQueue(this);
		this.clearDocument(queue, "/" + this.documentName + "_Copy");
		// Leave creating because generated document does not have file, if use it throwed not found exception
		this.addCreateDocumentWithContentAction(queue);

		var documentInfoCopy;
		var copiedDocumentId;
		queue.enqueue(function (context) {
			documentInfoCopy = new envianceSdk.documents.DocumentInfo(context.documentName + "_Copy", context.documentName + " description", "/");
			envianceSdk.documents.copyDocument(documentInfoCopy, "/" + context.documentInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					copiedDocumentId = response.result;
					context.documentIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(copiedDocumentId,
				function (response) {
					var actual = response.result;
					var expected = documentInfoCopy;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					var contentUrl = envianceSdk.utilities.uri.toDocumentDownload(copiedDocumentId);
					equal(actual.contentUrl, contentUrl, "ContentUrl are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Copy Document - Happy path - Link to file", 6, function () {
		var queue = new ActionQueue(this);
		this.clearDocument(queue, "/" + this.generatedDocumentContentUrlName + "_Copy");
		var documentInfoCopy;
		var copiedDocumentId;
		queue.enqueue(function (context) {
			documentInfoCopy = new envianceSdk.documents.DocumentInfo(context.generatedDocumentContentUrlName + "_Copy",
																	  context.generatedDocumentContentUrlName + " description", "/");
			envianceSdk.documents.copyDocument(documentInfoCopy, "/" + context.generatedDocumentContentUrlName,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					copiedDocumentId = response.result;
					context.documentIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(copiedDocumentId,
				function (response) {
					var actual = response.result;
					var expected = documentInfoCopy;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");
					equal(actual.contentUrl, context.documentContentUrl, "ContentUrl are equal");
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Document - Fault when document already exist", 2, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentUrlName, this.generatedDocumentContentUrlName + " description", "/");
		envianceSdk.documents.copyDocument(documentInfo, this.generatedDocumentContentUrlId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 409, "Status code is correct");
				equal(response.error.errorNumber, 101, "Error number is correct");
				start();
			});
	});

	asyncTest("Copy Document - Fault if document does not exist", 2, function () {
		var invalidDocument = "/notExistedFile";
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentUrlName + "_Copy", this.generatedDocumentContentUrlName + "Description", "/");
		envianceSdk.documents.copyDocument(documentInfo, invalidDocument,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Copy Document - Fault if destination folder does not exist", 2, function () {
		var notExistentDestinationFolder = "/Not existent folder";
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentUrlName + "_Copy",
																  this.generatedDocumentContentUrlName + "Description",
																  notExistentDestinationFolder);
		envianceSdk.documents.copyDocument(documentInfo, this.generatedDocumentContentUrlId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get Document - Happy path - Get document by ID", 8, function () {
		var queue = new ActionQueue(this);
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentName, this.generatedDocumentContentName + " description", "/")
													.addPathAssociatedObject("/" + this.generatedObjectName)
													.addAssociatedTask(this.generatedTaskId)
													.addAssociatedWorkflow(this.generatedWorkflowId);
		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.generatedDocumentContentId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var expected = documentInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					var contentUrl = envianceSdk.utilities.uri.toDocumentDownload(context.generatedDocumentContentId);
					equal(actual.contentUrl, contentUrl, "ContentUrl are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					deepEqual(actual.tasks, expected.tasks, "Tasks are equal");
					deepEqual(actual.workflows, expected.workflows, "Workflows are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Get Document - Happy path - Get document by path", 5, function () {
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentUrlName, this.generatedDocumentContentUrlName + " description", "/")
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.getDocument("/" + this.generatedDocumentContentUrlName,
			function (response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				var expected = documentInfo;
				var actual = response.result;
				equal(actual.name, expected.name, "Name are equal");
				equal(actual.description, expected.description, "Description are equal");
				equal(actual.folder, expected.folder, "Folder are equal");
				equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
				start();
			}, this.errorHandler);
	});

	asyncTest("Get Document - Happy path - Assign two locations(by Id and Path)", 6, function () {
		var queue = new ActionQueue(this);

		this.clearDocument(queue, "/" + this.documentName);
		var documentInfo;
		var documentId;
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl)
				.addIdAssociatedObject(context.generatedObjectId)
				.addPathAssociatedObject("/" + context.generatedSecondObjectName);
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					documentId = response.result;
					documentInfo.objects[0] = "/" + context.generatedObjectName;
					context.documentIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var expected = documentInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");
					equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
					deepEqual(actual.objects, expected.objects, "Objects are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Get Document - Fault when document does not exist - Id", 2, function () {
		var notExistentDocumentId = createUUID();
		envianceSdk.documents.getDocument(notExistentDocumentId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get Document - Fault when document does not exist - Path", 2, function () {
		var notExistentDocumentPath = "/Not existent document path";
		envianceSdk.documents.getDocument(notExistentDocumentPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get Document - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.generatedDocumentContentUrlId,
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

	asyncTest("Download Document - Fault document does not exist - Id", 2, function () {
		var notExistentDocument = createUUID();
		var url = envianceSdk.utilities.uri.toDocumentDownload(notExistentDocument);
		envianceSdk.ajax({
			type: "GET",
			url: url,
			cache: false,
			success: this.successHandler,
			error: function (response) {
				equal(response.status, 404, "Status code is correct");
				var responseObject = JSON.parse(response.responseText);
				equal(responseObject.errorNumber, 102, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Download Document - Fault document does not exist - Path", 2, function () {
		var notExistentDocument = "/Not existent document path";
		var url = envianceSdk.utilities.uri.toDocumentDownload(notExistentDocument);
		envianceSdk.ajax({
			type: "GET",
			url: url,
			cache: false,
			success: this.successHandler,
			error: function (response) {
				equal(response.status, 404, "Status code is correct");
				var responseObject = JSON.parse(response.responseText);
				equal(responseObject.errorNumber, 102, "Error number is correct");
				start();
			}
		});
	});

	asyncTest("Download Document - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		var url = envianceSdk.utilities.uri.toDocumentDownload(this.generatedDocumentContentId);
		queue.enqueue(function (context) {
			envianceSdk.ajax({
				type: "GET",
				url: url,
				cache: false,
				success: context.successHandler,
				error: function (response) {
					equal(response.status, 403, "Status code is correct");
					var responseObject = JSON.parse(response.responseText);
					equal(responseObject.errorNumber, 103, "Error number is correct");

					envianceSdk.configure({ sessionId: context.originalSessionId });
					start();
				}
			});
		});

		queue.executeNext();
	});

	asyncTest("Update Document - Happy path - Upload file - Id", 6, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentWithContentAction(queue);

		var documentUpdateInfo;
		queue.enqueue(function (context) {
			documentUpdateInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "_updated",
				context.documentName + "_updated" + " description", "/",
				context.documentContent,
				context.documentFileName + "_updated");
			envianceSdk.documents.updateDocument(context.documentId, documentUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				function (response) {
					var actual = response.result;
					var expected = documentUpdateInfo;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					var contentUrl = envianceSdk.utilities.uri.toDocumentDownload(context.documentId);
					equal(actual.contentUrl, contentUrl, "ContentUrl are equal");
					equal(actual.version, 2, "Version are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document - Happy path - Link to a file - Path", 7, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentWithContentUrlAction(queue);

		var documentUpdateInfo;
		queue.enqueue(function (context) {
			documentUpdateInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "_updated", context.documentName + "_updated" + " description", "/")
				.setContentUrl(context.documentContentUrl + "_updated")
				.addAssociatedWorkflow(context.generatedWorkflowId);
			envianceSdk.documents.updateDocument("/" + context.documentName, documentUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				function (response) {
					var actual = response.result;
					var expected = documentUpdateInfo;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
					equal(actual.version, 2, "Version are equal");

					deepEqual(actual.workflows, expected.workflows, "Workflows are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document - Happy path - Update document with \"content\" to document with \"contentUrl\"", 6, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentWithContentAction(queue);

		var documentUpdateInfo;
		queue.enqueue(function (context) {
			documentUpdateInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "_updated", context.documentName + "_updated" + " description", "/")
														  .setContentUrl(context.documentContentUrl + "_updated");
			envianceSdk.documents.updateDocument("/" + context.documentName, documentUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				function (response) {
					var actual = response.result;
					var expected = documentUpdateInfo;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
					equal(actual.version, 2, "Version are equal");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document - Happy path - Update \'Name\' only", 7, function () {
		var queue = new ActionQueue(this);

		this.clearDocument(queue, "/" + this.documentName);
		var documentInfo;
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
													.setContentUrl(context.documentContentUrl)
													.addAssociatedWorkflow(context.generatedWorkflowId);
			envianceSdk.documents.createDocument(documentInfo,
						function (response) {
							context.documentId = response.result;
							context.documentIdsToClear.push(response.result);
							queue.executeNext();
						}, context.errorHandler);
		});

		var documentUpdateInfo;
		queue.enqueue(function (context) {
			documentUpdateInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "_updated", null, "/");
			envianceSdk.documents.updateDocument(context.documentId, documentUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				function (response) {
					var actual = response.result;
					var expected = documentInfo;
					equal(actual.name, documentUpdateInfo.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					equal(actual.contentUrl, expected.contentUrl, "ContentUrl are equal");
					equal(actual.version, 2, "Version are equal");

					deepEqual(actual.workflows, expected.workflows, "Workflows are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document - Happy path - User doesn't have 'Manage Documents' rights but have permission on one folder", 1, function () {
		var queue = new ActionQueue(this);

		var documentInfo;
		var documentId;
		queue.enqueue(function (context) {
			documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName,
																  context.documentName + "Description",
																  context.generatedRootFolderPath)
					.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.createDocument(documentInfo,
					function (response) {
						documentId = response.result;
						context.documentIdsToClear.push(documentId);
						queue.executeNext();
					}, context.errorHandler);
		});

		this.authenticateUserWithPermission(queue);

		var documentUpdateInfo;
		queue.enqueue(function (context) {
			documentUpdateInfo = new envianceSdk.documents.DocumentInfo(context.documentName);
			envianceSdk.documents.updateDocument(documentId, documentUpdateInfo,
				function (response) {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
					function (response) {
						var actual = response.result;
						var expected = documentInfo;
						equal(actual.name, expected.name, "Name are equal");
						start();
					}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document - Fault if Name is too long", 2, function () {
		var documentName = new Array(257).join("s");
		var updateDocumentInfo = new envianceSdk.documents.DocumentInfo(documentName, this.documentName + "Description", "/")
														  .setContentUrl(this.documentContentUrl);
		envianceSdk.documents.updateDocument(this.generatedDocumentContentId, updateDocumentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document - Fault when \"description\" is too long", 2, function () {
		var description = new Array(3002).join("s");
		var updateDocumentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, description, "/");
		envianceSdk.documents.updateDocument(this.generatedDocumentContentIdu, updateDocumentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document - Fault if Name contains disallowed chars", 6, function () {
		var queue = new ActionQueue(this);

		var updateDocumentInfo;
		queue.enqueue(function (context) {
			updateDocumentInfo = new envianceSdk.documents.DocumentInfo(context.documentName + ":", context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.updateDocument(context.generatedDocumentContentId, updateDocumentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - ':')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			updateDocumentInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "|", context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.updateDocument(context.generatedDocumentContentId, updateDocumentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '|')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			updateDocumentInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "/", context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.updateDocument(context.generatedDocumentContentId, updateDocumentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '/')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update Document - Fault when document does not exist - Id", 2, function () {
		var notExistentDocumentId = createUUID();
		var updateDocumentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/")
														  .setContentUrl(this.documentContentUrl);
		envianceSdk.documents.updateDocument(notExistentDocumentId, updateDocumentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document - Fault when document does not exist - Path", 2, function () {
		var notExistentDocumenPath = "/Not existent document path";
		var updateDocumentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", "/")
														  .setContentUrl(this.documentContentUrl);
		envianceSdk.documents.updateDocument(notExistentDocumenPath, updateDocumentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			var updateDocumentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl);
			envianceSdk.documents.updateDocument(context.generatedDocumentContentId, updateDocumentInfo,
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

	asyncTest("Update Document - Check warnings", 3, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentWithContentAction(queue);

		var documentUpdateInfo;
		queue.enqueue(function (context) {
			documentUpdateInfo = new envianceSdk.documents.DocumentInfo(context.documentName)
				.setContentUrl(context.documentContentUrl);
			documentUpdateInfo.id = createUUID();
			documentUpdateInfo.version = 1;
			envianceSdk.documents.updateDocument(context.documentId, documentUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'version\'") > 0, "Warning for 'version' OK");
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Move Document - Happy path - Move document to root", 6, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentWithContentAction(queue);

		var documentMoveInfo;
		queue.enqueue(function (context) {
			documentMoveInfo = new envianceSdk.documents.DocumentInfo(context.documentName + "_moved",
																	  context.documentName + "_moved" + " description", "/",
																	  context.documentContent,
																	  context.documentFileName + "_moved");
			envianceSdk.documents.updateDocument(context.documentId, documentMoveInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				function (response) {
					var actual = response.result;
					var expected = documentMoveInfo;
					equal(actual.name, expected.name, "Name are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.folder, expected.folder, "Folder are equal");

					var contentUrl = envianceSdk.utilities.uri.toDocumentDownload(context.documentId);
					equal(actual.contentUrl, contentUrl, "ContentUrl are equal");
					equal(actual.version, 2, "Version are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Move Document - Fault when parent folder does not exist", 2, function () {
		var invalidDocumentFolderId = createUUID();
		var documentInfo = new envianceSdk.documents.DocumentInfo(this.documentName, this.documentName + "Description", invalidDocumentFolderId)
													.setContentUrl(this.documentContentUrl);
		envianceSdk.documents.updateDocument(this.generatedDocumentContentUrlId, documentInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Move Document - Fault when document with same name already exists", 2, function () {
		var queue = new ActionQueue(this);

		var copiedDocumentId;
		queue.enqueue(function (context) {
			var documentInfoCopy = new envianceSdk.documents.DocumentInfo(context.generatedDocumentContentUrlName,
																		  context.generatedDocumentContentUrlName + " description",
																		  context.generatedRootFolderPath);
			envianceSdk.documents.copyDocument(documentInfoCopy, "/" + context.generatedDocumentContentUrlName,
					function (response) {
						copiedDocumentId = response.result;
						context.documentIdsToClear.push(response.result);
						queue.executeNext();
					}, context.errorHandler);
		});

		var updateDocumentInfo = new envianceSdk.documents.DocumentInfo(this.generatedDocumentContentUrlName, this.generatedDocumentContentUrlName + "Description", "/")
														  .setContentUrl(this.documentContentUrl);
		queue.enqueue(function (context) {
			envianceSdk.documents.updateDocument(copiedDocumentId, updateDocumentInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 409, "Status code is correct");
					equal(response.error.errorNumber, 101, "Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Document - Happy path - Document without association - Id", 3, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentWithContentUrlAction(queue);

		queue.enqueue(function (context) {
			envianceSdk.documents.deleteDocument(context.documentId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Delete. Status code is correct");
					context.documentIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted document. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted document. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Document - Happy path - Document without association - Path", 3, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentWithContentUrlAction(queue);

		queue.enqueue(function (context) {
			envianceSdk.documents.deleteDocument("/" + context.documentName,
				function (response) {
					equal(response.metadata.statusCode, 204, "Delete. Status code is correct");
					context.documentIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(context.documentId,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted document. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted document. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Document - Happy path - Document with association", 3, function () {
		var queue = new ActionQueue(this);
		this.clearDocument(queue, "/" + this.documentName);
		var documentId;
		queue.enqueue(function (context) {
			var documentInfo = new envianceSdk.documents.DocumentInfo(context.documentName, context.documentName + "Description", "/")
				.setContentUrl(context.documentContentUrl)
				.addIdAssociatedObject(context.generatedObjectId)
				.addAssociatedTask(context.generatedTaskId)
				.addAssociatedWorkflow(context.generatedWorkflowId);
			envianceSdk.documents.createDocument(documentInfo,
				function (response) {
					documentId = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.deleteDocument(documentId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Delete. Status code is correct");
					context.documentIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocument(documentId,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted document. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted document. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Document - Fault when document does not exist - Id", 2, function () {
		var notExistentDocumentId = createUUID();
		envianceSdk.documents.deleteDocumentFolder(notExistentDocumentId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete Document - Fault when document does not exist - Path", 2, function () {
		var notExistentDocumentPath = "/Not existent document path";
		envianceSdk.documents.deleteDocumentFolder(notExistentDocumentPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete Document - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.documents.deleteDocument(context.generatedDocumentContentUrlId,
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

	asyncTest("Create Document Folder - Happy path - Parent folder is '/'", 3, function () {
		var queue = new ActionQueue(this);
		this.clearFolder(queue, "/" + this.rootFolderName);
		var documentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName, "/");
		var documentFolderId;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					documentFolderId = response.result;
					context.documentFolderIdsToClear.push(documentFolderId);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderId,
				function (response) {
					var actual = response.result;
					var expected = documentFolderInfo;
					ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document Folder - Happy path - Parent folder is system ID", 5, function () {
		var queue = new ActionQueue(this);

		this.clearFolder(queue, "/" + this.rootFolderName);
		var documentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName, envianceSdk.getSystemId());
		var documentFolderId;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					documentFolderId = response.result;
					context.documentFolderIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderId,
				function (response) {
					var expected = documentFolderInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.parentFolderIdOrPath, "/", "Parent folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document Folder - Happy path - Parent folder is empty", 5, function () {
		var queue = new ActionQueue(this);

		this.clearFolder(queue, "/" + this.rootFolderName);
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(this.rootFolderName, this.rootFolderName + " description");
		var documentFolderId;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					documentFolderId = response.result;
					context.documentFolderIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderId,
				function (response) {
					var expected = documentFolderInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.parentFolderIdOrPath, "/", "Parent folder are Root");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document Folder - Happy path - Parent folder is path", 3, function () {
		var queue = new ActionQueue(this);

		this.clearFolder(queue, this.generatedRootFolderPath + "/" + this.folderName);
		var documentFolderInfo = this.buildDocumentFolderInfo(this.folderName, this.generatedRootFolderPath);
		var documentFolderId;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					documentFolderId = response.result;
					context.documentFolderIdsToClear.push(response.result);
					queue.executeNext();
				}, function () {
					ok(false, "failed");
					start();
				});
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderId,
				function (response) {
					var expected = documentFolderInfo;
					var actual = response.result;
					ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document Folder - Happy path - User doesn't have 'Manage Documents' rights but have permission on one folder", 1, function () {
		var queue = new ActionQueue(this);
		this.clearFolder(queue, this.generatedRootFolderPath + "/" + this.folderName);
		this.authenticateUserWithPermission(queue);

		var documentFolderInfo = this.buildDocumentFolderInfo(this.folderName, this.generatedRootFolderPath);
		var documentFolderId;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				function (response) {
					documentFolderId = response.result;
					context.documentFolderIdsToClear.push(response.result);
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderId,
				function (response) {
					var expected = documentFolderInfo;
					var actual = response.result;
					ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Create Document Folder - Fault if Name contains disallowed chars", 6, function () {
		var queue = new ActionQueue(this);

		var documentFolderInfo;
		queue.enqueue(function (context) {
			documentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "\"", context.generatedRootFolderPath);
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '\"')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			documentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "<", context.generatedRootFolderPath);
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '<')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			documentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "/", context.generatedRootFolderPath);
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '/')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Create Document Folder - Fault when document folder already exist", 2, function () {
		var documentFolderInfo = this.buildDocumentFolderInfo(this.generatedRootFolderName, "/");
		envianceSdk.documents.createDocumentFolder(documentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 409, "Status code is correct");
				equal(response.error.errorNumber, 101, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document Folder - Fault when parent document folder does not exist", 2, function () {
		var invalidDocumentFolderId = createUUID();
		var documentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName, invalidDocumentFolderId);
		envianceSdk.documents.createDocumentFolder(documentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document Folder - Fault when Name is too long", 2, function () {
		var folderName = new Array(52).join("s");
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(folderName, this.rootFolderName + " description", "/");
		envianceSdk.documents.createDocumentFolder(documentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document Folder - Fault when Name is empty", 2, function () {
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo("", this.rootFolderName + " description", "/");
		envianceSdk.documents.createDocumentFolder(documentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document Folder - Fault when \"description\" is too long", 2, function () {
		var description = new Array(3002).join("s");
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(this.rootFolderName, description, "/");
		envianceSdk.documents.createDocumentFolder(documentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			});
	});

	asyncTest("Create Document Folder - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			var documentFolderInfo = context.buildDocumentFolderInfo(context.rootFolderName, "/");
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
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

	asyncTest("Create Document Folder - Check warnings", 2, function () {
		var queue = new ActionQueue(this);
		this.clearFolder(queue, "/" + this.folderName);
		var documentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName, "/");
		documentFolderInfo.id = createUUID();
		var documentFolderId;
		queue.enqueue(function (context) {
			envianceSdk.documents.createDocumentFolder(documentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					documentFolderId = response.result;
					context.documentFolderIdsToClear.push(documentFolderId);
					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Document Folder - Happy path - To a root - Id", 5, function () {
		var queue = new ActionQueue(this);

		var originalFolderInfo;
		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.generatedFolderId,
				function (response) {
					originalFolderInfo = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var copyFolderInfo;
		var copiedFolderId;
		this.clearFolder(queue, "/" + this.folderName + "_Copy");
		queue.enqueue(function (context) {
			copyFolderInfo = context.buildDocumentFolderInfo(context.folderName + "_Copy", "/");
			envianceSdk.documents.copyDocumentFolder(copyFolderInfo, context.generatedFolderId,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					copiedFolderId = response.result;
					context.documentFolderIdsToClear.push(copiedFolderId);
					queue.executeNext();
				}, function () {
					ok(false, "failed");
					start();
				});
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(copiedFolderId,
				function (response) {
					var expected = copyFolderInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, originalFolderInfo.description, "Description are equal");
					equal(actual.parentFolderIdOrPath, expected.parentFolderIdOrPath, "Parent folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Copy Document Folder - Happy path - To a root - Path", 5, function () {
		var queue = new ActionQueue(this);

		var originalFolderInfo;
		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.generatedFolderId,
				function (response) {
					originalFolderInfo = response.result;
					queue.executeNext();
				}, context.errorHandler);
		});

		var copyFolderInfo;
		var copiedFolderId;
		this.clearFolder(queue, "/" + this.folderName + "_Copy");
		queue.enqueue(function (context) {
			copyFolderInfo = context.buildDocumentFolderInfo(context.folderName + "_Copy", "/");
			envianceSdk.documents.copyDocumentFolder(copyFolderInfo, context.generatedFolderPath,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					copiedFolderId = response.result;
					context.documentFolderIdsToClear.push(copiedFolderId);
					queue.executeNext();
				}, function () {
					ok(false, "failed");
					start();
				});
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(copiedFolderId,
				function (response) {
					var expected = copyFolderInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, originalFolderInfo.description, "Description are equal");
					equal(actual.parentFolderIdOrPath, expected.parentFolderIdOrPath, "Parent folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Copy Document Folder - Happy path - Copied folder has child", 6, function () {
		var queue = new ActionQueue(this);

		var copyFolderInfo;
		var copiedFolderId;
		this.clearFolder(queue, "/" + this.folderName + "_Copy");
		queue.enqueue(function (context) {
			copyFolderInfo = context.buildDocumentFolderInfo(context.folderName + "_Copy", "/");
			envianceSdk.documents.copyDocumentFolder(copyFolderInfo, context.generatedRootFolderPath,
				function (response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
					copiedFolderId = response.result;
					context.documentFolderIdsToClear.push(copiedFolderId);
					queue.executeNext();
				}, function () {
					ok(false, "failed");
					start();
				});
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(copiedFolderId,
				function (response) {
					var expected = copyFolderInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.parentFolderIdOrPath, expected.parentFolderIdOrPath, "Parent folder are equal");

					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder("/" + copyFolderInfo.name + "/" + context.generatedFolderName,
				function (response) {
					var actual = response.result;
					equal(actual.name, context.generatedFolderName, "Names are equal");
					equal(actual.parentFolderIdOrPath, "/" + copyFolderInfo.name, "Parent folder are equal");

					start();
				}, context.errorHandler);
		});

		queue.executeNext();
	});

	asyncTest("Copy Document Folder - Fault when copy from does not exist - Id", 2, function () {
		var notExistentFolderId = createUUID();
		var documentFolderInfo = this.buildDocumentFolderInfo(this.generatedRootFolderName, "/");
		envianceSdk.documents.copyDocumentFolder(documentFolderInfo, notExistentFolderId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Copy Document Folder - Fault when copy from does not exist - Path", 2, function () {
		var notExistentFolderPath = "/Not existent folder path";
		var documentFolderInfo = this.buildDocumentFolderInfo(this.generatedRootFolderName, "/");
		envianceSdk.documents.copyDocumentFolder(documentFolderInfo, notExistentFolderPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Copy Document Folder - Fault when folder already exist", 2, function () {
		var documentFolderInfo = this.buildDocumentFolderInfo(this.generatedRootFolderName, "/");
		envianceSdk.documents.copyDocumentFolder(documentFolderInfo, this.generatedRootFolderPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 409, "Status code is correct");
				equal(response.error.errorNumber, 101, "Error number is correct");
				start();
			});
	});

	asyncTest("Get Document Folder - Happy path - Get folder by ID", 2, function () {
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(this.generatedFolderName,
																			  this.generatedFolderName + " description",
																			  this.generatedRootFolderPath);
		documentFolderInfo.id = this.generatedFolderId;
		envianceSdk.documents.getDocumentFolder(this.generatedFolderId,
			function (response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				var expected = documentFolderInfo;
				var actual = response.result;
				ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");
				start();
			}, this.errorHandler);
	});

	asyncTest("Get Document Folder - Happy path - Get document folder by path", 2, function () {
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(this.generatedFolderName,
																			  this.generatedFolderName + " description",
																			  this.generatedRootFolderPath);
		documentFolderInfo.id = this.generatedFolderId;
		envianceSdk.documents.getDocumentFolder(this.generatedFolderPath,
			function (response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				var expected = documentFolderInfo;
				var actual = response.result;
				ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

				start();
			}, this.errorHandler);
	});

	asyncTest("Get Document Folder - Happy path - Get root document folder by path", 2, function () {
		var documentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(this.generatedRootFolderName,
																			  this.generatedRootFolderName + " description",
																			  "/");
		documentFolderInfo.id = this.generatedRootFolderId;
		envianceSdk.documents.getDocumentFolder(this.generatedRootFolderPath,
			function (response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");
				var expected = documentFolderInfo;
				var actual = response.result;
				ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

				start();
			}, this.errorHandler);
	});

	asyncTest("Get Document Folder - Fault when document folder does not exist - Id", 2, function () {
		var notExistentFolderId = createUUID();
		envianceSdk.documents.getDocumentFolder(notExistentFolderId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get Document Folder - Fault when document folder does not exist - Path", 2, function () {
		var notExistentFolderPath = "/Not existent folder path";
		envianceSdk.documents.getDocumentFolder(notExistentFolderPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Get Document Folder - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.generatedRootFolderId,
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

	asyncTest("Update Document Folder - Happy path - Update folder by ID", 5, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "_updated", "/" + context.rootFolderName);
			envianceSdk.documents.updateDocumentFolder(context.documentFolderId, updateDocumentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					context.documentFolderIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var notExpected = context.documentFolderInfo;
					var expected = updateDocumentFolderInfo;
					var actual = response.result;

					notEqual(actual.name, notExpected.name, "Names are not equal");
					notEqual(actual.description, notExpected.description, "Description are not equal");
					ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document Folder - Happy path - Update by path", 5, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.rootFolderName + "_updated", "/" + context.rootFolderName);
			envianceSdk.documents.updateDocumentFolder("/" + context.rootFolderName + "/" + context.folderName, updateDocumentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					context.documentFolderIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var notExpected = context.documentFolderInfo;
					var expected = updateDocumentFolderInfo;
					var actual = response.result;

					notEqual(actual.name, notExpected.name, "Names are not equal");
					notEqual(actual.description, notExpected.description, "Description are not equal");
					ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document Folder - Happy path - Update \'Name\' only", 4, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = new envianceSdk.documents.DocumentFolderInfo(context.rootFolderName + "_updated", null, "/" + context.rootFolderName);
			envianceSdk.documents.updateDocumentFolder("/" + context.rootFolderName + "/" + context.folderName, updateDocumentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					context.documentFolderIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var expected = updateDocumentFolderInfo;
					var actual = response.result;

					equal(actual.name, expected.name, "Description are not equal");
					equal(actual.description, context.documentFolderInfo.description, "Description are not equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document Folder - Happy path - User doesn't have 'Manage Documents' rights but have permission on one folder", 2, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, this.generatedRootFolderPath);
		this.authenticateUserWithPermission(queue);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.folderName);
			envianceSdk.documents.updateDocumentFolder(context.documentFolderId, updateDocumentFolderInfo,
				function (response) {
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var expected = updateDocumentFolderInfo;
					var actual = response.result;
					equal(actual.name, expected.name, "Names are not equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Update Document Folder - Fault if Name contains disallowed chars", 6, function () {
		var queue = new ActionQueue(this);

		var documentFolderInfo;
		queue.enqueue(function (context) {
			documentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "*", context.generatedRootFolderPath);
			envianceSdk.documents.updateDocumentFolder(context.generatedRootFolderId, documentFolderInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '*')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			documentFolderInfo = context.buildDocumentFolderInfo(context.folderName + ">", context.generatedRootFolderPath);
			envianceSdk.documents.updateDocumentFolder(context.generatedRootFolderId, documentFolderInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '>')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					queue.executeNext();
				});
		});

		queue.enqueue(function (context) {
			documentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "\\", context.generatedRootFolderPath);
			envianceSdk.documents.updateDocumentFolder(context.generatedRootFolderId, documentFolderInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code is correct(dissalowed char - '\\')");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Update Document Folder - Fault when document folder does not exist - Id", 2, function () {
		var notExistentFolderId = createUUID();
		var updateDocumentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName + "_updated", "/");
		envianceSdk.documents.updateDocumentFolder(notExistentFolderId, updateDocumentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document Folder - Fault when document folder does not exist - Path", 2, function () {
		var notExistentFolderPath = "/Not existent folder path";
		var updateDocumentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName + "_updated", "/");
		envianceSdk.documents.updateDocumentFolder(notExistentFolderPath, updateDocumentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document Folder - Fault when document folder with same name already exists", 2, function () {
		var updateDocumentFolderInfo = this.buildDocumentFolderInfo(this.generatedRootFolderName.toLowerCase(), "/");
		envianceSdk.documents.updateDocumentFolder(this.generatedRootFolderId, updateDocumentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 409, "Status code is correct");
				equal(response.error.errorNumber, 101, "Error number is correct");
				start();
			});
	});

	asyncTest("Update Document Folder - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.rootFolderName, "/");
			envianceSdk.documents.updateDocumentFolder(context.generatedRootFolderId, updateDocumentFolderInfo,
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

	asyncTest("Update Document Folder - Check warnings", 2, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.folderName + "_updated", "/" + context.rootFolderName);
			updateDocumentFolderInfo.id = createUUID();
			envianceSdk.documents.updateDocumentFolder(context.documentFolderId, updateDocumentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					context.documentFolderIdsToClear.pop();
					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Move Document Folder - Happy path - Move folder to root by ID", 6, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.rootFolderName + "_moved_to_root", context.originalSystemId);
			envianceSdk.documents.updateDocumentFolder(context.documentFolderId, updateDocumentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var notExpected = context.documentFolderInfo;
					var expected = updateDocumentFolderInfo;
					var actual = response.result;

					notEqual(actual.parentFolderIdOrPath, notExpected.parentFolderIdOrPath, "Parent folder are not equal");

					equal(actual.name, expected.name, "Names are equal");
					equal(actual.description, expected.description, "Description are equal");
					equal(actual.parentFolderIdOrPath, "/", "Parent folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Move Document Folder - Happy path - Move folder to root by path", 4, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var updateDocumentFolderInfo;
		queue.enqueue(function (context) {
			updateDocumentFolderInfo = context.buildDocumentFolderInfo(context.rootFolderName + "_moved_to_root", "/");
			envianceSdk.documents.updateDocumentFolder(context.documentFolderId, updateDocumentFolderInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 200, "Status code is correct");
					var notExpected = context.documentFolderInfo;
					var expected = updateDocumentFolderInfo;
					var actual = response.result;

					notEqual(actual.parentFolderIdOrPath, notExpected.parentFolderIdOrPath, "Parent folder are not equal");
					ok(isDocumentFolderEqual(expected, actual), "Document folder are equal");

					start();
				}, context.errorHandler);
		});
		queue.executeNext();
	});

	asyncTest("Move Document Folder - Fault when parent folder does not exist (by ID)", 2, function () {
		var invalidDocumentFolderId = createUUID();
		var updateDocumentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName + "_updated", invalidDocumentFolderId);
		envianceSdk.documents.updateDocumentFolder(this.generatedFolderId, updateDocumentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Move Document Folder - Fault when parent folder does not exist (by path)", 2, function () {
		var updateDocumentFolderInfo = this.buildDocumentFolderInfo(this.rootFolderName + "_updated", "/nonexistent document folder");
		envianceSdk.documents.updateDocumentFolder(this.generatedFolderId, updateDocumentFolderInfo,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete Document Folder - Happy path - Use folder ID", 3, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");

		var documentFolderId;
		queue.enqueue(function (context) {
			documentFolderId = context.documentFolderId;
			envianceSdk.documents.deleteDocumentFolder(documentFolderId,
				function (response) {
					equal(response.metadata.statusCode, 204, "Delete. Status code is correct");
					context.documentFolderIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderId,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Document Folder - Happy path - Use folder path", 3, function () {
		var queue = new ActionQueue(this);
		this.addCreateDocumentFolderAction(queue, this.rootFolderName, "/");
		this.addCreateDocumentFolderAction(queue, this.folderName, "/" + this.rootFolderName);

		var documentFolderPath;
		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(context.documentFolderId,
				function (response) {
					documentFolderPath = response.result.parentFolderIdOrPath + "/" + response.result.name;
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.deleteDocumentFolder(documentFolderPath,
				function (response) {
					equal(response.metadata.statusCode, 204, "Delete. Status code is correct");
					context.documentFolderIdsToClear.pop();
					queue.executeNext();
				}, context.errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.documents.getDocumentFolder(documentFolderPath,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Get deleted folder. Status code is correct");
					equal(response.error.errorNumber, 102, "Get deleted folder. Error number is correct");
					start();
				});
		});

		queue.executeNext();
	});

	asyncTest("Delete Document Folder - Fault when document folder does not exist - Id", 2, function () {
		var notExistentFolderId = createUUID();
		envianceSdk.documents.deleteDocumentFolder(notExistentFolderId,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete Document Folder - Fault when document folder does not exist - Path", 2, function () {
		var notExistentFolderPath = "/Not existent folder path";
		envianceSdk.documents.deleteDocumentFolder(notExistentFolderPath,
			this.successHandler,
			function (response) {
				equal(response.metadata.statusCode, 404, "Status code is correct");
				equal(response.error.errorNumber, 102, "Error number is correct");
				start();
			});
	});

	asyncTest("Delete Document Folder - Fault when user does not have right", 2, function () {
		var queue = new ActionQueue(this);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.documents.deleteDocumentFolder(context.generatedRootFolderId,
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
	
	asyncTest("Download Document - Happy Path - Ensure Cache Control", 2, function () {
		var queue = new ActionQueue(this);
		// Leave creating because generated document does not have file, if use it throwed not found exception
		this.addCreateDocumentWithContentAction(queue);

		queue.enqueue(function (context) {
			var url = envianceSdk.utilities.uri.toDocumentDownload(context.documentId);
			envianceSdk.ajax({
				type: "GET",
				url: url,
				cache: false,
				success: function (data, textStatus, response) {
					if (response.hasOwnProperty("headers")) {
						ok(response.headers["Cache-Control"] == null || response.headers["Cache-Control"] != "no-cache", "Cache-Control header is correct");
						ok(response.headers["Pragma"] == null || response.headers["Pragma"] != "no-cache", "Pragma header is correct");
					}
					else {
						// we have original jQuery XMLHttpRequest (jqXHR) object
						ok(response.getResponseHeader("Cache-Control") == null || response.getResponseHeader("Cache-Control") != "no-cache", "Cache-Control header is correct");
						ok(response.getResponseHeader("Pragma") == null || response.getResponseHeader("Pragma") != "no-cache", "Pragma header is correct");
					}
					start();
				},
				error: function (response) {
					this.errorHandler(response);
				}
			});
		});

		queue.executeNext();

	});

	var isDocumentFolderEqual = function (expected, actual) {
		for (var p in expected) {
			if (expected[p] !== actual[p]) {
				return false;
			}
		}
		return true;
	};
}

if (typeof (UnitTestsApplication) == "undefined") {
	executeDocumentServiceTests();
}