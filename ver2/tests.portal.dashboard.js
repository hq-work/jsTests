if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Portal Dashboard', execute: executePortalDashboardTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executePortalDashboardTests() {
	module("Portal Dashboard", {
		setup: function() {
			this.countProps = function(obj) {
				var result = 0, key;
				for (key in obj) {
					if (obj.hasOwnProperty(key)) result++;
				}
				return result;
			};

			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			this.userId = null; // jstestsPortalUser
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.userLogin = "jstestsPortalUser" + qUnitDbSuffix;
			this.userName = this.userLogin;
			this.groupId = "45659a03-136c-4f2e-82ed-5bf6360fda43";// jstestsAccessGroup
			this.groupName = "jstestsAccessGroup";
			
			this.authenticateUserWithoutRights = function (queue) {
				queue.enqueue(function (context) {
					envianceSdk.authentication.authenticate(context.userLogin, "1111",
					function () {
						queue.executeNext();
					},
					context.errorHandler);
				});
			};
			
			this.pageGroupsToClear = [];
			this.panelTemplatesToClear = [];
			this.defaultPageGroupName = "Group (Набір сторінок)";
			this.defaultPageName = "Page(Сторінка)";
			this.defaultPanelName = "Panel(Панeль)";
			this.defaultPanelTemplateName = "Template(Шаблон)";
			
			this.createPageGroup = function (q, pgInfo) {
				q.enqueue(function (context) {
					envianceSdk.portal.createPageGroup(pgInfo,
						function (response) {
							pgInfo.id = response.result;
							equal(response.metadata.statusCode, 201, "Created Page Group. Status code OK.");
							context.pageGroupsToClear.push(pgInfo.name);
							q.executeNext();
						},
						function () {
							context.errorHandler.apply(context, arguments);
							context.pageGroupsToClear.push(pgInfo.name);
						}
					);
				});
			};
			
			this.createPage = function (q, pInfo, skipParents) {
				if (!skipParents) {
					this.createPageGroup(q, new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName));
				}
				q.enqueue(function (context) {
					envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
						function (response) {
							pInfo.id = response.result;
							equal(response.metadata.statusCode, 201, "Created Page. Status code OK.");
							q.executeNext();
						}, context.errorHandler
					);
				});
			};
			
			this.createPageByGroup = function (q, pInfo, pageGroupName) {
				q.enqueue(function (context) {
					envianceSdk.portal.createPage(pageGroupName, pInfo,
						function (response) {
							pInfo.id = response.result;
							equal(response.metadata.statusCode, 201, "Created Page. Status code OK.");
							q.executeNext();
						}, context.errorHandler
					);
				});
			};
			
			this.createPanel = function (q, pInfo, skipParents) {
				if (!skipParents) {
					this.createPage(q, new envianceSdk.portal.PageInfo(this.defaultPageName));
				}
				q.enqueue(function (context) {
					envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
						function (response) {
							equal(response.metadata.statusCode, 201, "Created Panel. Status code OK.");
							q.executeNext();
						}, context.errorHandler
					);
				});
			};
			
			this.createPanelByPageAndGroup = function (q, groupName, pageName, pInfo) {
				q.enqueue(function (context) {
					envianceSdk.portal.createPanel(groupName, pageName, pInfo,
						function (response) {
							equal(response.metadata.statusCode, 201, "Created Panel. Status code OK.");
							q.executeNext();
						}, context.errorHandler
					);
				});
			};
			
			
			this.createPanelTemplate = function (q, ptInfo) {
				q.enqueue(function (context) {
					
					envianceSdk.portal.createPanelTemplate(ptInfo,
						function (response) {
							equal(response.metadata.statusCode, 201, "Created Panel Template. Status code OK.");
							context.panelTemplatesToClear.push(ptInfo.name);
							q.executeNext();
						},
						function () {
							context.errorHandler("Failed");
						}
					);
				});
			};

			this.getUserId = function (q) {
				q.enqueue(function (context) {
					envianceSdk.eql.execute("select u.id from user u where u.login = '"+context.userLogin+"'", 1, 10,
						function (response) {
							if (response.result.length && response.result[0].rows && response.result[0].rows.length) {
								context.userId = response.result[0].rows[0].values[0];
								q.executeNext();
							}
							else context.errorHandler(response, "error", "User with login '" + context.userLogin + "' is not found!");
						}, context.errorHandler
					);
				});
			};
		},
		teardown: function () {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			
			stop();
			
			var responseHandler = function () {
				start();
			};
			
			for (var i=0; i<this.pageGroupsToClear.length;i++) {
				var pgName = this.pageGroupsToClear[i];
				
				envianceSdk.portal.deletePageGroup(pgName, responseHandler, responseHandler);
				stop();
			}
			
			for (i = 0; i < this.panelTemplatesToClear.length; i++) {
				var ptName = this.panelTemplatesToClear[i];
				
				envianceSdk.portal.deletePanelTemplate(ptName, responseHandler, responseHandler);
				stop();
			}
			start();
		}
	});
	
	asyncTest("Portal Batch - Create 5 Page Groups - Happy path", 6, function () {
		var errorHandled = 0;
		var self = this;
		var errorHandler = function (response, error, msg) {
			self.errorHandler(response, error, msg, null, errorHandled++);
		};

		var queue = new ActionQueue(this);
		var pgname = this.defaultPageGroupName;
		var pgInfos = [];

		for (var i = 10; i < 15; i++) {
			pgInfos.push(new envianceSdk.portal.PageGroupInfo(pgname + i));
		}		
		
		var doneCallbacks = 0;
		var operCount = 0;

		queue.doNext = function () {
			doneCallbacks++;
			if (doneCallbacks > operCount) start();
		};

		queue.enqueue(function (context) {
			envianceSdk.batch.execute({
				continueOnError: true,
				operations: function () {
					for (var i = 0; i < 5; i++) {
						(function (name) {
							envianceSdk.portal.createPageGroup(pgInfos[i],
								function (response) {
									equal(response.metadata.statusCode, 201, "Created Page Group. Status code OK.");
									queue.doNext();
								}, errorHandler
							).always(function () {
								context.pageGroupsToClear.push(name);
							});
						}) (pgInfos[i].name);
					}

					operCount = envianceSdk.batch.getOperations().length;
				}
			},
			function (response) {
				equal(response.result && response.result.length, operCount, "Get " + operCount + " results");

				queue.doNext();
			}, errorHandler);
		});

		queue.executeNext();
	});
	
	asyncTest("Create Page Group - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pgInfo;
					equal(actual.name, expected.name, "Names are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page Group with Properties - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty("Category", "Main");
		pgInfo.addProperty("Position", "1");

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pgInfo;
					equal(actual.name, expected.name, "Names are equal");
					deepEqual(actual.properties, expected.properties, "Properties are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page Group - Fault if not admin", 2, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo('TTT');

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPageGroup(pgInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page Group - Fault if Name with invalid chars", 2, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo('zz/zxz\zxc');

		queue.enqueue(function (context) {
			envianceSdk.portal.createPageGroup(pgInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page Group - Fault if Name is empty", 2, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo('');

		queue.enqueue(function (context) {
			envianceSdk.portal.createPageGroup(pgInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page Group - Fault if Properties duplicated", 2, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty('prop', '1');
		pgInfo.addProperty('PrOp', '1');

		queue.enqueue(function (context) {
			envianceSdk.portal.createPageGroup(pgInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Page Group - Fault if not admin", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty("Category", "Main");
		pgInfo.addProperty("Position", "1");

		this.createPageGroup(queue, pgInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group Name - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			var originalName = pgInfo.name;
			pgInfo.name = "pg mod";
			envianceSdk.portal.updatePageGroup(originalName, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					context.pageGroupsToClear.push(pgInfo.name);
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pgInfo;
					equal(actual.name, expected.name, "Names are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group - Fault if not admin", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.updatePageGroup(context.defaultPageGroupName, pgInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group With Empty Name - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			var originalName = pgInfo.name;
			pgInfo.name = '';
			envianceSdk.portal.updatePageGroup(originalName, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(context.defaultPageGroupName,
				function (response) {
					var actual = response.result;
					equal(actual.name, context.defaultPageGroupName, "Empty name ignored");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group With Missing Name - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			var originalName = pgInfo.name;
			delete pgInfo.name;
			envianceSdk.portal.updatePageGroup(originalName, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(context.defaultPageGroupName,
				function (response) {
					var actual = response.result;
					equal(actual.name, context.defaultPageGroupName, "Empty name ignored");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group Properties - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty("Position", "1");

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			delete pgInfo.properties;
			pgInfo.addProperty("Position", "2");
			envianceSdk.portal.updatePageGroup(pgInfo.name, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					equal(actual.properties.Position, "2", "Property updated");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group Properties - Happy Path - Remove properties", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty("Position", "1");

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			delete pgInfo.properties.Position;
			envianceSdk.portal.updatePageGroup(pgInfo.name, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					equal(actual.properties.Position, undefined, "Old property removed");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group - Happy Path - Properties not changed on null", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty("Position", "1");

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			delete pgInfo.properties;
			envianceSdk.portal.updatePageGroup(pgInfo.name, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					equal(actual.properties.Position, "1", "Old property not changed");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group - Happy Path - Properties updated", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		pgInfo.addProperty("Position", "1");
		pgInfo.addProperty("Color", "black");

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			pgInfo.properties.Color = "white";
			envianceSdk.portal.updatePageGroup(pgInfo.name, pgInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				function (response) {
					var actual = response.result;
					equal(actual.properties.Position, "1", "Old property not changed");
					equal(actual.properties.Color, "white", "New property added");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Delete Page Group - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePageGroup(pgInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 204, "Deleted. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroup(pgInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Page Group - Fault if not admin", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);

		this.createPageGroup(queue, pgInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePageGroup(context.defaultPageGroupName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page with Properties - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "1");
		pInfo.addProperty("Top", "20");

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					deepEqual(actual.properties, expected.properties, "Properties are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page with User Permission - Happy Path", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, "view");
			queue.executeNext();
		});
		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.accessLevels.exceptUsers.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.exceptUsers[0].id.toLowerCase(), expected.accessLevels.exceptUsers[0].id.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.exceptUsers[0].accesslevel, expected.accessLevels.exceptUsers[0].accesslevel, "User.AccessLevel is as expected");
					//equal(actual.accessLevels.exceptUsers[0].id, context.userName, "User Name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page with Group Permission - Happy Path", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.accessLevels.exceptGroups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.exceptGroups[0].name.toLowerCase(), expected.accessLevels.exceptGroups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.exceptGroups[0].accesslevel, expected.accessLevels.exceptGroups[0].accesslevel, "Group.AccessLevel is as expected");
					equal(actual.accessLevels.exceptGroups[0].name, context.groupName, "Group name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if not admin", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		this.createPageGroup(queue, pgInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if Name with invalid chars", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo('zz/zxz\zxc');
		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if Name is empty", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo('');
		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if Properties duplicated", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageGroupName);
		pInfo.addProperty('prop', '1');
		pInfo.addProperty('PrOp', '1');
		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if User Permissions duplicated", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageGroupName);
		
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			pInfo.accessLevels.addExceptUserId(context.userId, 'edit');
			queue.executeNext();
		});
		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if GroupPermissions duplicated", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageGroupName);
		pInfo.accessLevels.addExceptGroup(this.groupName.toLowerCase(), "view");
		pInfo.accessLevels.addExceptGroup(this.groupName.toUpperCase(), "edit");
		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Page - Fault if invalid permission", 3, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageGroupInfo(this.defaultPageGroupName);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageGroupName);


		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, '25');
			queue.executeNext();
		});
		
		pInfo.accessLevels.addExceptGroup(this.groupName.toUpperCase(), '-23');
		this.createPageGroup(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPage(context.defaultPageGroupName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Page - Happy path if View permission", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		
		
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});
		
		
		this.createPage(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, context.defaultPageName,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.accessLevels, undefined, "No User accessLevels returned for View User");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});
	
	asyncTest("Load Page - Happy path if visibleToAll ", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.accessLevels.visibleToAll = true;

		this.createPage(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, context.defaultPageName,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.accessLevels, undefined, "No User accessLevels returned for View User");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Page - Happy path if Edit permission", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'edit');
			queue.executeNext();
		});
		

		this.createPage(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, context.defaultPageName,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.accessLevels, undefined, "No User accessLevels returned for View User");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Page - Fault if No Access", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'noaccess');
			queue.executeNext();
		});
		this.createPage(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, context.defaultPageName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Page - Fault if no permissions specified", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		this.createPage(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, context.defaultPageName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Name - Happy Path", 11, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Page. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					
					equal(actual.properties.Order, expected.properties.Order, "Properties not modified");
					equal(actual.accessLevels.exceptUsers.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.exceptUsers[0].id.toLowerCase(), expected.accessLevels.exceptUsers[0].id.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.exceptUsers[0].accesslevel, expected.accessLevels.exceptUsers[0].accesslevel, "User.AccessLevel is as expected");
					equal(actual.accessLevels.exceptGroups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.exceptGroups[0].name.toLowerCase(), expected.accessLevels.exceptGroups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.exceptGroups[0].accesslevel, expected.accessLevels.exceptGroups[0].accesslevel, "Group.AccessLevel is as expected");
					
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Properties - Happy Path", 13, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		pInfo.addProperty("Color", "white");
		
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});
		
		
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.addProperty("Position", "1");
			pInfo.Color = "black";
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Page. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Old properties not modified");
					equal(actual.properties.Color, expected.properties.Color, "Updated property changed");
					equal(actual.properties.Position, expected.properties.Position, "New property added");

					equal(actual.accessLevels.exceptUsers.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.exceptUsers[0].id.toLowerCase(), expected.accessLevels.exceptUsers[0].id.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.exceptUsers[0].accesslevel, expected.accessLevels.exceptUsers[0].accesslevel, "User.AccessLevel is as expected");
					
					equal(actual.accessLevels.exceptGroups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.exceptGroups[0].name.toLowerCase(), expected.accessLevels.exceptGroups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.exceptGroups[0].accesslevel, expected.accessLevels.exceptGroups[0].accesslevel, "Group.AccessLevel is as expected");
					
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page User Permissions - Happy Path", 11, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.accessLevels.exceptUsers[0].accesslevel = "edit";
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Page. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Properties not modified");
					equal(actual.accessLevels.exceptUsers.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.exceptUsers[0].id.toLowerCase(), expected.accessLevels.exceptUsers[0].id.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.exceptUsers[0].accesslevel, expected.accessLevels.exceptUsers[0].accesslevel, "User.AccessLevel is as expected");
					
					equal(actual.accessLevels.exceptGroups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.exceptGroups[0].name.toLowerCase(), expected.accessLevels.exceptGroups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.exceptGroups[0].accesslevel, expected.accessLevels.exceptGroups[0].accesslevel, "Group.AccessLevel is as expected");
					
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page Group Permissions - Happy Path", 11, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.accessLevels.exceptGroups[0].accesslevel = "edit";
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Page. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Properties not modified");
					equal(actual.accessLevels.exceptUsers.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.exceptUsers[0].id.toLowerCase(), expected.accessLevels.exceptUsers[0].id.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.exceptUsers[0].accesslevel, expected.accessLevels.exceptUsers[0].accesslevel, "User.AccessLevel is as expected");
					
					equal(actual.accessLevels.exceptGroups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.exceptGroups[0].name.toLowerCase(), expected.accessLevels.exceptGroups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.exceptGroups[0].accesslevel, expected.accessLevels.exceptGroups[0].accesslevel, "Group.AccessLevel is as expected");
					
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Page User Permissions - Fault if not admin", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Page Group Permissions - Fault if not admin", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'edit');
			queue.executeNext();
		});
		
		pInfo.accessLevels.addExceptGroup(this.groupName, "edit");

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			delete pInfo.accessLevels.users;
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Page Name - Fault if No Access", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'noaccess');
			queue.executeNext();
		});
		
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			delete pInfo.accessLevels;
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Page Name - Fault if no permissions", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			delete pInfo.accessLevels;
			pInfo.name += "(modified)";
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Page Name - Fault if View Permission", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'view');
			queue.executeNext();
		});
		
		pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			delete pInfo.accessLevels;
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Page Properties - Happy Path - If Edit Permissions", 8, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		pInfo.addProperty("Order", "0");
		pInfo.addProperty("Color", "white");

		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, 'edit');
			queue.executeNext();
		});
		
		
		//pInfo.accessLevels.addExceptGroup(this.groupName, "view");

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.addProperty("Position", "1");
			pInfo.Color = "black";
			delete pInfo.accessLevels;
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Page. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Old properties not modified");
					equal(actual.properties.Color, expected.properties.Color, "Updated property changed");
					equal(actual.properties.Position, expected.properties.Position, "New property added");

					equal(actual.accessLevels, undefined, "Permissions are hidded for non admin");
					//equal(actual.accessLevels.groups, undefined, "Groups permission are hidden for non admin");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Delete Page - Happy Path", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);

		this.createPage(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePage(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 204, "Deleted. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(context.defaultPageGroupName, pInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Page - Fault if not admin", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);

		this.createPage(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePage(context.defaultPageGroupName, pInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Save Page Settings - Happy Path", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);

		this.createPage(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageSettings(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.savePageSettings(context.defaultPageGroupName, pInfo.name, settingsText,
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Page Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageSettings(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.result, settingsText, "Settings as expected.");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Save Page Settings - Happy Path - View Permission on Page", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		this.getUserId(queue);
		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, "view");
			queue.executeNext();
		});
		

		this.createPage(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageSettings(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePageSettings(context.defaultPageGroupName, pInfo.name, settingsText,
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Page Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageSettings(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.result, settingsText, "Settings as expected.");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Save Page Settings - Fault - No Access on Page", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addExceptUserId(context.userId, "noaccess");
			queue.executeNext();
		});
		

		this.createPage(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageSettings(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePageSettings(context.defaultPageGroupName, pInfo.name, settingsText,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Save Page Settings - Fault - Permissions not specified on Page", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);

		this.createPage(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageSettings(context.defaultPageGroupName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePageSettings(context.defaultPageGroupName, pInfo.name, settingsText,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Create Panel - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel with Properties - Happy Path", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "1");
		pInfo.addProperty("Top", "20");

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					deepEqual(actual.properties, expected.properties, "Properties are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel with User Permission - Happy Path", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		
		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});

		

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.accessLevels.users.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.users[0].id.toLowerCase(), context.userId.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.users[0].accesslevel, expected.accessLevels.users[0].accesslevel, "User.AccessLevel is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel with Group Permission - Happy Path", 7, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.accessLevels.groups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.groups[0].name.toLowerCase(), expected.accessLevels.groups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.groups[0].accesslevel, expected.accessLevels.groups[0].accesslevel, "Group.AccessLevel is as expected");
					equal(actual.accessLevels.groups[0].name, context.groupName, "Group name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if not admin", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		this.createPage(queue, pgInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if Name with invalid chars", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo('zz/zxz\zxc');
		this.createPage(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if Name is empty", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo('');
		this.createPage(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if Properties duplicated", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty('prop', '1');
		pInfo.addProperty('PrOp', '1');
		this.createPage(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if User Permissions duplicated", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		
		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId.toLowerCase(), '1');
			pInfo.accessLevels.addUserId(context.userId.toUpperCase(), '2');
			queue.executeNext();
		});


		
		this.createPage(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if GroupPermissions duplicated", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.accessLevels.addGroup(this.groupName.toLowerCase(), '1');
		pInfo.accessLevels.addGroup(this.groupName.toUpperCase(), '2');
		this.createPage(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel - Fault if invalid permission", 4, function () {
		var queue = new ActionQueue(this);
		var pgInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);


		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, '25');
			queue.executeNext();
		});

		
		
		pInfo.accessLevels.addGroup(this.groupName.toUpperCase(), '-23');
		this.createPage(queue, pgInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanel(context.defaultPageGroupName, context.defaultPageName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Panel - Happy path if View permission", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		
		
		this.createPanel(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.accessLevels, undefined, "No User Permissions returned for View User");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});



	asyncTest("Load Panel - Happy path if VisibleToAll",12, function () {
		var queue = new ActionQueue(this);
		
		var pageInfo = new envianceSdk.portal.PanelInfo(this.defaultPageName);
		pageInfo.accessLevels.visibleToAll = true;
		this.createPage(queue, pageInfo);
		

		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		this.createPanel(queue, pInfo, true);
		

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.accessLevels, undefined, "No User Permissions returned for View User");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getDashboard(
				function (response) {
					var actual = response.result;
					equal(actual[0].name, context.defaultPageGroupName, "Group Names are equal");
					equal(actual[0].pages.length, 1, "Page length are equal");
					equal(actual[0].pages[0].name, context.defaultPageName, "Page Names are equal");
					equal(actual[0].pages[0].panels.length, 1, "Panels length are equal");
					equal(actual[0].pages[0].panels[0].name, context.defaultPanelName, "Panel Names are equal");
					queue.executeNext(); 
				}, context.errorHandler
			);
		});


		queue.enqueue(function (context) {
			envianceSdk.portal.getPanels(context.defaultPageGroupName, context.defaultPageName,
				function (response) {
					var actual = response.result;
					equal(actual.length, 1, "length are equal");
					equal(actual[0].name, context.defaultPanelName, "Panel Names are equal");
					start();
				}, context.errorHandler
			);
		});

		queue.executeNext();
	});



	asyncTest("Load Panel - Happy path if Edit permission", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		
		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});
		

		
		this.createPanel(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Names are equal");
					equal(actual.accessLevels, undefined, "No User Permissions returned for View User");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Panel - Fault if No Access", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "noaccess");
			queue.executeNext();
		});
		
		this.createPanel(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Panel - Fault if no permissions specified", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		this.createPanel(queue, pInfo);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});
	



	asyncTest("Update Panel Name - Happy Path", 14, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		
		
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Panel. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");

					equal(actual.properties.Order, expected.properties.Order, "Properties not modified");
					equal(actual.accessLevels.users.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.users[0].id.toLowerCase(), context.userId.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.users[0].accesslevel, expected.accessLevels.users[0].accesslevel, "User.AccessLevel is as expected");
					ok(actual.accessLevels.users[0].name.indexOf("jstestsportaluser"), "User Name is as expected");
					equal(actual.accessLevels.groups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.groups[0].name.toLowerCase(), expected.accessLevels.groups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.groups[0].accesslevel, expected.accessLevels.groups[0].accesslevel, "Group.AccessLevel is as expected");
					equal(actual.accessLevels.groups[0].name, context.groupName, "Group name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Properties - Happy Path", 16, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");
		pInfo.addProperty("Color", "white");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.addProperty("Position", "1");
			pInfo.Color = "black";
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Panel. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Old properties not modified");
					equal(actual.properties.Color, expected.properties.Color, "Updated property changed");
					equal(actual.properties.Position, expected.properties.Position, "New property added");

					equal(actual.accessLevels.users.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.users[0].id.toLowerCase(), context.userId.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.users[0].accesslevel, expected.accessLevels.users[0].accesslevel, "User.AccessLevel is as expected");
					ok(actual.accessLevels.users[0].name.indexOf("jstestsportaluser"), "User Name is as expected");
					equal(actual.accessLevels.groups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.groups[0].name.toLowerCase(), expected.accessLevels.groups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.groups[0].accesslevel, expected.accessLevels.groups[0].accesslevel, "Group.AccessLevel is as expected");
					equal(actual.accessLevels.groups[0].name, context.groupName, "Group name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel User Permissions - Happy Path", 14, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.accessLevels.users[0].accesslevel = "edit";
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Panel. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Properties not modified");
					equal(actual.accessLevels.users.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.users[0].id.toLowerCase(), context.userId.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.users[0].accesslevel, expected.accessLevels.users[0].accesslevel, "User.AccessLevel is as expected");
					ok(actual.accessLevels.users[0].name.indexOf("jstestsportaluser"), "User Name is as expected");
					equal(actual.accessLevels.groups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.groups[0].name.toLowerCase(), expected.accessLevels.groups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.groups[0].accesslevel, expected.accessLevels.groups[0].accesslevel, "Group.AccessLevel is as expected");
					equal(actual.accessLevels.groups[0].name, context.groupName, "Group name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Group Permissions - Happy Path", 14, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			pInfo.accessLevels.groups[0].accesslevel = "edit";
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Panel. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Properties not modified");
					equal(actual.accessLevels.users.length, 1, "Single User Permission exists");
					equal(actual.accessLevels.users[0].id.toLowerCase(), context.userId.toLowerCase(), "User.Id is as expected");
					equal(actual.accessLevels.users[0].accesslevel, expected.accessLevels.users[0].accesslevel, "User.AccessLevel is as expected");
					ok(actual.accessLevels.users[0].name.indexOf("jstestsportaluser"), "User Name is as expected");
					equal(actual.accessLevels.groups.length, 1, "Single Group Permission exists");
					equal(actual.accessLevels.groups[0].name.toLowerCase(), expected.accessLevels.groups[0].name.toLowerCase(), "Group.Id is as expected");
					equal(actual.accessLevels.groups[0].accesslevel, expected.accessLevels.groups[0].accesslevel, "Group.AccessLevel is as expected");
					equal(actual.accessLevels.groups[0].name, context.groupName, "Group name is as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel User Permissions - Fault if not admin", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});
		

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Panel Group Permissions - Fault if not admin", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});
		
		pInfo.accessLevels.addGroup(this.groupName, "edit");

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			delete pInfo.accessLevels.users;
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Panel Name - Fault if No Access", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "noaccess");
			queue.executeNext();
		});
		
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			delete pInfo.accessLevels.users;
			delete pInfo.accessLevels.groups;
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Panel Name - Fault if no permissions", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Panel Name - Fault if View Permission", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		
		pInfo.accessLevels.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.name += "(modified)";
			delete pInfo.accessLevels.users;
			delete pInfo.accessLevels.groups;
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Panel Properties - Happy Path - If Edit Permissions", 9, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);
		pInfo.addProperty("Order", "0");
		pInfo.addProperty("Color", "white");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});
		
		//pInfo.addGroup(this.groupName, "view");

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			pInfo.addProperty("Position", "1");
			pInfo.Color = "black";
			delete pInfo.accessLevels.users;
			delete pInfo.accessLevels.groups;
			envianceSdk.portal.updatePanel(
				context.defaultPageGroupName, context.defaultPageName, context.defaultPanelName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated Panel. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.name, expected.name, "Name changed");
					equal(actual.properties.Order, expected.properties.Order, "Old properties not modified");
					equal(actual.properties.Color, expected.properties.Color, "Updated property changed");
					equal(actual.properties.Position, expected.properties.Position, "New property added");

					equal(actual.accessLevels, undefined, "Users permissions are hidded for non admin");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Delete Panel - Happy Path", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.createPanel(queue, pInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 204, "Deleted. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Panel - Fault if not admin", 5, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.createPanel(queue, pInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePanel(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Save Panel Settings - Happy Path", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.createPanel(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.savePanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name, settingsText,
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Panel Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.result, settingsText, "Settings as expected.");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Save Panel Settings - Happy Path - View Permission on Panel", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "view");
			queue.executeNext();
		});
		

		this.createPanel(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name, settingsText,
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Panel Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.result, settingsText, "Settings as expected.");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Save Panel Settings - Fault - No Access on Panel", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo.accessLevels.addUserId(context.userId, "noaccess");
			queue.executeNext();
		});
		

		this.createPanel(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name, settingsText,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Save Panel Settings - Fault - Permissions not specified on Panel", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PanelInfo(this.defaultPanelName);

		this.createPanel(queue, pInfo);
		var settingsText = "Some non latin значення";

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name,
				function (response) {
					equal(response.result, "", "Settings Empty OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePanelSettings(context.defaultPageGroupName, context.defaultPageName, pInfo.name, settingsText,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Create Panel Template - Happy Path", 2, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(ptInfo.name,
				function (response) {
					var actual = response.result;
					var expected = ptInfo;
					equal(actual.name, expected.name, "Names are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel Template with Properties - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);
		ptInfo.addProperty("Category", "Main");
		ptInfo.addProperty("Position", "1");

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(ptInfo.name,
				function (response) {
					var actual = response.result;
					var expected = ptInfo;
					equal(actual.name, expected.name, "Names are equal");
					deepEqual(actual.properties, expected.properties, "Properties are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel Template - Fault if not admin", 2, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo('TTT');

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanelTemplate(ptInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel Template - Fault if Name with invalid chars", 2, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo('zz/zxz\zxc');

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanelTemplate(ptInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel Template - Fault if Name is empty", 2, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo('');

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanelTemplate(ptInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Create Panel Template - Fault if Properties duplicated", 2, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);
		ptInfo.addProperty('prop', '1');
		ptInfo.addProperty('PrOp', '1');

		queue.enqueue(function (context) {
			envianceSdk.portal.createPanelTemplate(ptInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Load Panel Template - Happy Path if not admin", 4, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);
		ptInfo.addProperty("Category", "Main");
		ptInfo.addProperty("Position", "1");

		this.createPanelTemplate(queue, ptInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(ptInfo.name,
				function (response) {
					equal(response.result.name, context.defaultPanelTemplateName,"name ok");
					equal(response.result.properties.Category, "Main", "Property Category OK");
					equal(response.result.properties.Position, "1", "Property Position OK");
					
					start();
				},
				context.successHandler
			
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Template Name - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			var originalName = ptInfo.name;
			ptInfo.name = "pg mod";
			envianceSdk.portal.updatePanelTemplate(originalName, ptInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					context.panelTemplatesToClear.push(ptInfo.name);
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(ptInfo.name,
				function (response) {
					var actual = response.result;
					var expected = ptInfo;
					equal(actual.name, expected.name, "Names are equal");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Template - Fault if not admin", 3, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.updatePanelTemplate(context.defaultPanelTemplateName, ptInfo,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Template With Empty Name - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			var originalName = ptInfo.name;
			ptInfo.name = '';
			envianceSdk.portal.updatePanelTemplate(originalName, ptInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(context.defaultPanelTemplateName,
				function (response) {
					var actual = response.result;
					equal(actual.name, context.defaultPanelTemplateName, "Empty name ignored");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Template With Missing Name - Happy Path", 3, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			var originalName = ptInfo.name;
			delete ptInfo.name;
			envianceSdk.portal.updatePanelTemplate(originalName, ptInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(context.defaultPanelTemplateName,
				function (response) {
					var actual = response.result;
					equal(actual.name, context.defaultPanelTemplateName, "Empty name ignored");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Update Panel Template Properties - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);
		ptInfo.addProperty("Position", "1");

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			ptInfo.addProperty("Cat", "black");
			envianceSdk.portal.updatePanelTemplate(ptInfo.name, ptInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Updated. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(ptInfo.name,
				function (response) {
					var actual = response.result;
					equal(actual.properties.Position, "1", "Old property exists");
					equal(actual.properties.Cat, "black", "New property added ");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Delete Panel Template - Happy Path", 4, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePanelTemplate(ptInfo.name,
				function (response) {
					equal(response.metadata.statusCode, 204, "Deleted. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplate(ptInfo.name,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 404, "Status code is correct");
					equal(response.error.errorNumber, 102, "Error number is correct");
					start();
				});
		});
		queue.executeNext();
	});

	asyncTest("Delete Panel Template - Fault if not admin", 3, function () {
		var queue = new ActionQueue(this);
		var ptInfo = new envianceSdk.portal.PanelTemplateInfo(this.defaultPanelTemplateName);

		this.createPanelTemplate(queue, ptInfo);
		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.deletePanelTemplate(context.defaultPanelTemplateName,
				context.successHandler,
				function (response) {
					equal(response.metadata.statusCode, 403, "Status code OK");
					equal(response.error.errorNumber, 103, "Error number OK");
					start();
				}
			);
		});
		queue.executeNext();
	});
	
	asyncTest("Bulk Load Panel Templates - Happy Path", 12, function () {
		var queue = new ActionQueue(this);
		var ptInfo1 = new envianceSdk.portal.PanelTemplateInfo('pt 1Ї');
		var ptInfo2 = new envianceSdk.portal.PanelTemplateInfo('pt 2Ё');
		var ptInfo3 = new envianceSdk.portal.PanelTemplateInfo('pt 3І');
		ptInfo2.addProperty("Lockёd", "false");
		ptInfo3.addProperty("Lockёd", "так");
		ptInfo3.addProperty("Sharёd", "ні");

		this.createPanelTemplate(queue, ptInfo1);
		this.createPanelTemplate(queue, ptInfo2);
		this.createPanelTemplate(queue, ptInfo3);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplates(
				function (response) {
					var actualArr = response.result;
					var expected0 = ptInfo1;
					var expected1 = ptInfo2;
					var expected2 = ptInfo3;
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(actualArr[2].name, expected2.name, "3rd Names are equal");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[2].properties), 2, "3rd  - 2 properties");
					equal(actualArr[1].properties["Lockёd"], "false", "2nd properties as expected");
					equal(actualArr[2].properties["Lockёd"], "так", "3rd properties as expected");
					equal(actualArr[2].properties["Sharёd"], "ні", "3rd properties as expected");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk Load Panel Templates - Happy Path if not admin", 12, function () {
		var queue = new ActionQueue(this);
		var ptInfo1 = new envianceSdk.portal.PanelTemplateInfo('pt 1Ї');
		var ptInfo2 = new envianceSdk.portal.PanelTemplateInfo('pt 2Ё');
		var ptInfo3 = new envianceSdk.portal.PanelTemplateInfo('pt 3І');
		ptInfo2.addProperty("Lockёd", "false");
		ptInfo3.addProperty("Lockёd", "так");
		ptInfo3.addProperty("Sharёd", "ні");

		this.createPanelTemplate(queue, ptInfo1);
		this.createPanelTemplate(queue, ptInfo2);
		this.createPanelTemplate(queue, ptInfo3);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanelTemplates(
				function (response) {
					var actualArr = response.result;
					var expected0 = ptInfo1;
					var expected1 = ptInfo2;
					var expected2 = ptInfo3;
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(actualArr[2].name, expected2.name, "3rd Names are equal");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[2].properties), 2, "3rd  - 2 properties");
					equal(actualArr[1].properties["Lockёd"], "false", "2nd properties as expected");
					equal(actualArr[2].properties["Lockёd"], "так", "3rd properties as expected");
					equal(actualArr[2].properties["Sharёd"], "ні", "3rd properties as expected");
					start();
				},
				context.successHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Panels - Happy Path - by Admin", 17, function () {
		var queue = new ActionQueue(this);

		var pnInfo1 = new envianceSdk.portal.PanelInfo('pn 1Ї');
		var pnInfo2 = new envianceSdk.portal.PanelInfo('pn 2Ё');
		var pnInfo3 = new envianceSdk.portal.PanelInfo('pn 3І');
		pnInfo2.addProperty("L0ckёd", "false");
		pnInfo3.addProperty("L0ckёd", "так");
		pnInfo3.addProperty("ShArёd", "ні");


		this.getUserId(queue);

		queue.enqueue(function (context) {
			pnInfo1.accessLevels.addUserId(context.userId, "view");
			pnInfo3.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});


		
		pnInfo2.accessLevels.addGroup(this.groupName, "edit");

		pnInfo3.accessLevels.addGroup(this.groupName, "noaccess");

		this.createPanel(queue, pnInfo1);
		this.createPanel(queue, pnInfo2, true);
		this.createPanel(queue, pnInfo3, true);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanels(context.defaultPageGroupName, context.defaultPageName,
				function (response) {
					var actualArr = response.result;
					var expected0 = pnInfo1;
					var expected1 = pnInfo2;
					var expected2 = pnInfo3;
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(actualArr[2].name, expected2.name, "3rd Names are equal");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[2].properties), 2, "3rd  - 2 properties");
					equal(actualArr[1].properties["L0ckёd"], "false", "2nd properties as expected");
					equal(actualArr[2].properties["L0ckёd"], "так", "3rd properties as expected");
					equal(actualArr[2].properties["ShArёd"], "ні", "3rd properties as expected");
					equal(actualArr[0].accessLevels, undefined, "1st - no users for Bulk");
					equal(actualArr[1].accessLevels, undefined, "2nd - no users for Bulk");
					equal(actualArr[2].accessLevels, undefined, "3rd - no users for Bulk");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Panels - Happy Path - by User", 13, function () {
		var queue = new ActionQueue(this);

		var pnInfo1 = new envianceSdk.portal.PanelInfo('pn 1Ї');
		var pnInfo2 = new envianceSdk.portal.PanelInfo('pn 2Ё');
		var pnInfo3 = new envianceSdk.portal.PanelInfo('pn 3І');
		pnInfo2.addProperty("L0ckёd", "false");
		pnInfo3.addProperty("L0ckёd", "так");
		pnInfo3.addProperty("ShArёd", "ні");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pnInfo1.accessLevels.addUserId(context.userId, "view");
			pnInfo3.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});
		
		
		pnInfo2.accessLevels.addGroup(this.groupName, "edit");
		
		pnInfo3.accessLevels.addGroup(this.groupName, "noaccess");

		this.createPanel(queue, pnInfo1);
		this.createPanel(queue, pnInfo2, true);
		this.createPanel(queue, pnInfo3, true);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPanels(context.defaultPageGroupName, context.defaultPageName,
				function (response) {
					var actualArr = response.result;
					var expected0 = pnInfo1;
					var expected1 = pnInfo2;
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(actualArr.length, 2, "only 2 Panels available for User");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(actualArr[1].properties["L0ckёd"], "false", "2nd properties as expected");
					equal(actualArr[0].accessLevels, undefined, "1st - no users for Bulk");
					equal(actualArr[1].accessLevels, undefined, "2nd - no users for Bulk");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Pages - Happy Path - by Admin", 16, function () {
		var queue = new ActionQueue(this);

		var pInfo1 = new envianceSdk.portal.PageInfo('p 1Ї');
		var pInfo2 = new envianceSdk.portal.PageInfo('p 2Ё');
		var pInfo3 = new envianceSdk.portal.PageInfo('p 3І');
		pInfo2.addProperty("L0ckёd", "false");
		pInfo3.addProperty("L0ckёd", "так");
		pInfo3.addProperty("ShArёd", "ні");
		
		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo1.accessLevels.addExceptUserId(context.userId, "view");
			pInfo3.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});
		
		
		pInfo2.accessLevels.addExceptGroup(this.groupName, "edit");
		
		pInfo3.accessLevels.addExceptGroup(this.groupName, "noaccess");

		this.createPage(queue, pInfo1);
		this.createPage(queue, pInfo2, true);
		this.createPage(queue, pInfo3, true);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPages(context.defaultPageGroupName,
				function (response) {
					var actualArr = response.result;
					var expected0 = pInfo1;
					var expected1 = pInfo2;
					var expected2 = pInfo3;
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(actualArr[2].name, expected2.name, "3rd Names are equal");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[2].properties), 2, "3rd  - 2 properties");
					equal(actualArr[1].properties["L0ckёd"], "false", "2nd properties as expected");
					equal(actualArr[2].properties["L0ckёd"], "так", "3rd properties as expected");
					equal(actualArr[2].properties["ShArёd"], "ні", "3rd properties as expected");
					equal(actualArr[0].accessLevels, undefined, "1st - no users for Bulk");
					equal(actualArr[1].accessLevels, undefined, "2nd - no users for Bulk");
					equal(actualArr[2].accessLevels, undefined, "3rd - no users for Bulk");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Pages - Happy Path - by User", 14, function () {
		var queue = new ActionQueue(this);

		var pInfo1 = new envianceSdk.portal.PageInfo('p 1Ї');
		var pInfo2 = new envianceSdk.portal.PageInfo('p 2Ё');
		var pInfo3 = new envianceSdk.portal.PageInfo('p 3І');
		pInfo2.addProperty("L0ckёd", "false");
		pInfo3.addProperty("L0ckёd", "так");
		pInfo3.addProperty("ShArёd", "ні");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo1.accessLevels.addExceptUserId(context.userId, "view");
			pInfo3.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});
		
		pInfo2.accessLevels.addExceptGroup(this.groupName, "edit");
		
		pInfo3.accessLevels.addExceptGroup(this.groupName, "noaccess");

		this.createPage(queue, pInfo1);
		this.createPage(queue, pInfo2, true);
		this.createPage(queue, pInfo3, true);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPages(context.defaultPageGroupName,
				function (response) {
					var actualArr = response.result;
					var expected0 = pInfo1;
					var expected1 = pInfo2;
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(actualArr.length, 2, "only 2 Panels available for User");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(actualArr[1].properties["L0ckёd"], "false", "2nd properties as expected");
					equal(actualArr[0].accessLevels, undefined, "1st - no users for Bulk");
					equal(actualArr[0].accessLevels, undefined, "1st - no groups for Bulk");
					equal(actualArr[1].accessLevels, undefined, "2nd - no users for Bulk");
					equal(actualArr[1].accessLevels, undefined, "2nd - no groups for Bulk1");
					start();
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Pages - Happy Path - by User with Access to Panels", 13, function () {
		var queue = new ActionQueue(this);

		var pInfo1 = new envianceSdk.portal.PageInfo('p 1Ї');// NoAccess		- notSpecified	=> NO
		var pInfo2 = new envianceSdk.portal.PageInfo('p 2Ё');// not specified	- View			=> YES
		var pInfo3 = new envianceSdk.portal.PageInfo('p 3І');// NoAccess		- noaccess/edit	=> YES
		pInfo2.addProperty("L0ckёd", "false");
		pInfo3.addProperty("L0ckёd", "так");
		pInfo3.addProperty("ShArёd", "ні");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo1.accessLevels.addExceptUserId(context.userId, "noaccess");
			pInfo3.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});
		


		pInfo3.accessLevels.addExceptGroup(this.groupName, "noaccess");

		var pnInfo11 = new envianceSdk.portal.PanelInfo('pn 11');
		var pnInfo21 = new envianceSdk.portal.PanelInfo('pn 21');
		var pnInfo31 = new envianceSdk.portal.PanelInfo('pn 31');
		var pnInfo32 = new envianceSdk.portal.PanelInfo('pn 32');

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pnInfo21.accessLevels.addUserId(context.userId, "view");
			pnInfo31.accessLevels.addUserId(context.userId, "noaccess");
			pnInfo32.accessLevels.addUserId(context.userId, "edit");
			queue.executeNext();
		});
		



		this.createPage(queue, pInfo1);
		this.createPage(queue, pInfo2, true);
		this.createPage(queue, pInfo3, true);

		this.createPanelByPageAndGroup(queue, this.defaultPageGroupName, pInfo1.name, pnInfo11);
		this.createPanelByPageAndGroup(queue, this.defaultPageGroupName, pInfo2.name, pnInfo21);
		this.createPanelByPageAndGroup(queue, this.defaultPageGroupName, pInfo3.name, pnInfo31);
		this.createPanelByPageAndGroup(queue, this.defaultPageGroupName, pInfo3.name, pnInfo32);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPages(context.defaultPageGroupName,
				function (response) {
					queue.checkAndStart(function() {
					var actualArr = response.result;
					var expected0 = pInfo2;
					var expected1 = pInfo3;
						equal(actualArr.length, 1, "1 pages returned");
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					//equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(context.countProps(actualArr[0].properties), 1, "2nd  - 1 property");
					//equal(context.countProps(actualArr[1].properties), 2, "3rd  - 2 properties");
					equal(actualArr[0].properties["L0ckёd"], "false", "2nd properties as expected");
					//equal(actualArr[1].properties["L0ckёd"], "так", "3rd properties as expected");
					//equal(actualArr[1].properties["ShArёd"], "ні", "3rd properties as expected");
						equal(actualArr[0].accessLevels, undefined, "1st - no users for Bulk");
//						equal(actualArr[1].accessLevels, undefined, "2nd - no users for Bulk");
					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	

	asyncTest("Bulk load Page Groups - Happy Path - by Admin", 22, function () {
		var queue = new ActionQueue(this);
		var pgInfo1 = new envianceSdk.portal.PageGroupInfo('pg 1Ї');
		var pgInfo2 = new envianceSdk.portal.PageGroupInfo('pg 2Ё');
		var pgInfo3 = new envianceSdk.portal.PageGroupInfo('pg 3І');
		pgInfo2.addProperty("L0ckёd", "false");
		pgInfo3.addProperty("L0ckёd", "так");
		pgInfo3.addProperty("ShArёd", "ні");

		var pInfo21 = new envianceSdk.portal.PageInfo('p2.1 1Ї');
		var pInfo22 = new envianceSdk.portal.PageInfo('p2.2 2Ё');
		var pInfo31 = new envianceSdk.portal.PageInfo('p3.1 3І');

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo21.accessLevels.addExceptUserId(context.userId, "view");
			pInfo31.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});

		
		pInfo22.accessLevels.addExceptGroup(this.groupName, "edit");
		
		pInfo31.accessLevels.addExceptGroup(this.groupName, "noaccess");

		this.createPageGroup(queue, pgInfo1);
		this.createPageGroup(queue, pgInfo2);
		this.createPageGroup(queue, pgInfo3);

		this.createPageByGroup(queue, pInfo21, pgInfo2.name);
		this.createPageByGroup(queue, pInfo22, pgInfo2.name);
		this.createPageByGroup(queue, pInfo31, pgInfo3.name);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroups(
				function (response) {
					queue.checkAndStart(function() {
					var actualArr = response.result;
					var expected0 = pgInfo1;
					var expected1 = pgInfo2;
					var expected2 = pgInfo3;
						equal(actualArr.length, 3, "3 page groups returned");
						equal(actualArr[0].id, expected0.id, "1st Names are equal");
						equal(actualArr[1].id, expected1.id, "2nd Names are equal");
						equal(actualArr[2].id, expected2.id, "3rd Names are equal");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[2].properties), 2, "3rd  - 2 properties");
					equal(actualArr[1].properties["L0ckёd"], "false", "2nd properties as expected");
					equal(actualArr[2].properties["L0ckёd"], "так", "3rd properties as expected");
					equal(actualArr[2].properties["ShArёd"], "ні", "3rd properties as expected");

					equal(context.countProps(actualArr[0].pages), 0, "1st no pages");
					equal(context.countProps(actualArr[1].pages), 2, "2nd - 2 pages");
					equal(context.countProps(actualArr[2].pages), 1, "3rd - 1 page");

					equal(actualArr[1].pages[0].name, pInfo21.name, "2nd page0 name as expected");
					equal(actualArr[1].pages[1].name, pInfo22.name, "2nd page1 name as expected");
					equal(actualArr[2].pages[0].name, pInfo31.name, "3rd page0 name as expected");
					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Page Groups - Happy Path - by User with permission on Page", 13, function () {
		var queue = new ActionQueue(this);
		var pgInfo1 = new envianceSdk.portal.PageGroupInfo('pg 1Ї'); // No childs			=> NO
		var pgInfo2 = new envianceSdk.portal.PageGroupInfo('pg 2Ё'); // 2 pages(have View)	=> YES
		var pgInfo3 = new envianceSdk.portal.PageGroupInfo('pg 3І'); // 1 page (no access)	=> NO
		pgInfo2.addProperty("L0ckёd", "false");
		pgInfo3.addProperty("L0ckёd", "так");
		pgInfo3.addProperty("ShArёd", "ні");

		var pInfo21 = new envianceSdk.portal.PageInfo('p2.1 1Ї');
		var pInfo22 = new envianceSdk.portal.PageInfo('p2.2 2Ё');
		var pInfo31 = new envianceSdk.portal.PageInfo('p3.1 3І');
		
		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo21.accessLevels.addExceptUserId(context.userId, "view");
			pInfo31.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});


		
		pInfo22.accessLevels.addExceptGroup(this.groupName, "edit");
		
		pInfo31.accessLevels.addExceptGroup(this.groupName, "noaccess");

		this.createPageGroup(queue, pgInfo1);
		this.createPageGroup(queue, pgInfo2);
		this.createPageGroup(queue, pgInfo3);

		this.createPageByGroup(queue, pInfo21, pgInfo2.name);
		this.createPageByGroup(queue, pInfo22, pgInfo2.name);
		this.createPageByGroup(queue, pInfo31, pgInfo3.name);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroups(
				function (response) {
					queue.checkAndStart(function() {
					var actualArr = response.result;
					var expected0 = pgInfo2;
						equal(actualArr.length, 1, "Only 1 group returned");
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					equal(context.countProps(actualArr[0].properties), 1, "2nd  - 1 property");
					equal(actualArr[0].properties["L0ckёd"], "false", "2nd properties as expected");
					equal(context.countProps(actualArr[0].pages), 2, "2nd - 2 pages");
					equal(actualArr[0].pages[0].name, pInfo21.name, "2nd page0 name as expected");
					equal(actualArr[0].pages[1].name, pInfo22.name, "2nd page1 name as expected");

					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});

	asyncTest("Bulk load Page Groups - Happy Path - by User with permission on Page AND Panels", 16, function () {
		var queue = new ActionQueue(this);
		var pgInfo1 = new envianceSdk.portal.PageGroupInfo('pg 1Ї'); // No childs								=> NO
		var pgInfo2 = new envianceSdk.portal.PageGroupInfo('pg 2Ё'); // 2 pages(have View)						=> YES
		var pgInfo3 = new envianceSdk.portal.PageGroupInfo('pg 3І'); // 1 page (no access) - 2 Panels with View	=> YES
		pgInfo2.addProperty("L0ckёd", "false");
		pgInfo3.addProperty("L0ckёd", "так");
		pgInfo3.addProperty("ShArёd", "ні");

		var pInfo21 = new envianceSdk.portal.PageInfo('p2.1 1Ї');
		var pInfo22 = new envianceSdk.portal.PageInfo('p2.2 2Ё');
		var pInfo31 = new envianceSdk.portal.PageInfo('p3.1 3І');


		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo21.accessLevels.addExceptUserId(context.userId, "view");
			//pInfo31.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});

		
		pInfo22.accessLevels.addExceptGroup(this.groupName, "edit");
		pInfo31.accessLevels.addExceptGroup(this.groupName, "noaccess");

		var pnInfo211 = new envianceSdk.portal.PanelInfo('pn 211');
		var pnInfo311 = new envianceSdk.portal.PanelInfo('pn 311');
		var pnInfo312 = new envianceSdk.portal.PanelInfo('pn 312');

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pnInfo211.accessLevels.addUserId(context.userId, "noaccess");
			pnInfo311.accessLevels.addUserId(context.userId, "view");
			pnInfo312.accessLevels.addUserId(context.userId, "noaccess");
			queue.executeNext();
		});

		


		this.createPageGroup(queue, pgInfo1);
		this.createPageGroup(queue, pgInfo2);
		this.createPageGroup(queue, pgInfo3);

		this.createPageByGroup(queue, pInfo21, pgInfo2.name);
		this.createPageByGroup(queue, pInfo22, pgInfo2.name);
		this.createPageByGroup(queue, pInfo31, pgInfo3.name);

		this.createPanelByPageAndGroup(queue, pgInfo2.name, pInfo21.name, pnInfo211);
		this.createPanelByPageAndGroup(queue, pgInfo3.name, pInfo31.name, pnInfo311);
		this.createPanelByPageAndGroup(queue, pgInfo3.name, pInfo31.name, pnInfo312);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.getPageGroups(
				function (response) {
					queue.checkAndStart(function() {
					var actualArr = response.result;
					var expected0 = pgInfo2;
					var expected1 = pgInfo3;
						equal(actualArr.length, 1, "Only 2 groups returned");
					equal(actualArr[0].name, expected0.name, "1st Names are equal");
					//equal(actualArr[1].name, expected1.name, "2nd Names are equal");
					equal(context.countProps(actualArr[0].properties), 1, "2nd  - 1 property");
					//equal(context.countProps(actualArr[1].properties), 2, "3rd  - 2 properies");
					equal(actualArr[0].properties["L0ckёd"], "false", "2nd properties as expected");
					//equal(actualArr[1].properties["ShArёd"], "ні", "3rd properties as expected");
					equal(context.countProps(actualArr[0].pages), 2, "2nd - 2 pages");
					//equal(context.countProps(actualArr[1].pages), 1, "3rd - 1 page");
					equal(actualArr[0].pages[0].name, pInfo21.name, "2nd page0 name as expected");
					equal(actualArr[0].pages[1].name, pInfo22.name, "2nd page1 name as expected");
					//equal(actualArr[1].pages[0].name, pInfo31.name, "3rd page0 name as expected");
					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});
	
	asyncTest("Bulk load DashBoard - Happy Path - by Admin", 72, function () {
		var queue = new ActionQueue(this);
		var pgInfo1 = new envianceSdk.portal.PageGroupInfo('pg1');
		var pgInfo2 = new envianceSdk.portal.PageGroupInfo('pg2');
		var pgInfo3 = new envianceSdk.portal.PageGroupInfo('pg3');
		pgInfo2.addProperty("P1", "21");
		pgInfo3.addProperty("P1", "31");
		pgInfo3.addProperty("P2", "32");

		var pInfo21 = new envianceSdk.portal.PageInfo('p2.1');
		var pInfo22 = new envianceSdk.portal.PageInfo('p2.2');
		var pInfo31 = new envianceSdk.portal.PageInfo('p3.1');
		pInfo21.addProperty("P", "21");
		
		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo21.accessLevels.addExceptUserId(context.userId, "view");
			pInfo31.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});
		

		pInfo22.accessLevels.addExceptGroup(this.groupName, "edit");
		pInfo31.accessLevels.addExceptGroup(this.groupName, "noaccess");

		var pnInfo211 = new envianceSdk.portal.PanelInfo('pn 211');
		var pnInfo311 = new envianceSdk.portal.PanelInfo('pn 311');
		var pnInfo312 = new envianceSdk.portal.PanelInfo('pn 312');
		
		pnInfo211.addProperty("P", "211");
		pnInfo311.addProperty("P", "311");

		this.getUserId(queue);

		queue.enqueue(function (context) {
			pnInfo211.accessLevels.addUserId(context.userId, "noaccess");
			pnInfo311.accessLevels.addUserId(context.userId, "view");
			pnInfo312.accessLevels.addUserId(context.userId, "noaccess");
			queue.executeNext();
		});

		

		this.createPageGroup(queue, pgInfo1);
		this.createPageGroup(queue, pgInfo2);
		this.createPageGroup(queue, pgInfo3);

		this.createPageByGroup(queue, pInfo21, pgInfo2.name);
		this.createPageByGroup(queue, pInfo22, pgInfo2.name);
		this.createPageByGroup(queue, pInfo31, pgInfo3.name);

		this.createPanelByPageAndGroup(queue, pgInfo2.name, pInfo21.name, pnInfo211);
		this.createPanelByPageAndGroup(queue, pgInfo3.name, pInfo31.name, pnInfo311);
		this.createPanelByPageAndGroup(queue, pgInfo3.name, pInfo31.name, pnInfo312);
		
		queue.enqueue(function (context) {
			envianceSdk.portal.savePanelSettings(pgInfo2.name, pInfo21.name, pnInfo211.name, "set211",
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Panel Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});
		
		queue.enqueue(function (context) {
			envianceSdk.portal.savePageSettings(pgInfo3.name, pInfo31.name, "set31",
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Page Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});
		//asserts:11

		queue.enqueue(function (context) {
			envianceSdk.portal.getDashboard(
				function (response) {
					queue.checkAndStart(function() {
					var actualArr = response.result;
					var exp0 = pgInfo1;
					var exp1 = pgInfo2;
					var exp2 = pgInfo3;
					//PageGroups, asserts: 10
					equal(actualArr.length,3, "3 Page Groups returned");
					equal(actualArr[0].name, exp0.name, "1st Names are equal");
					equal(actualArr[1].name, exp1.name, "2nd Names are equal");
					equal(actualArr[2].name, exp2.name, "3rd Names are equal");
					equal(context.countProps(actualArr[0].properties), 0, "1st no properties");
					equal(context.countProps(actualArr[1].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[2].properties), 2, "3rd  - 2 properties");
					equal(actualArr[1].properties.P1, "21", "2nd properties as expected");
					equal(actualArr[2].properties.P1, "31", "3rd properties as expected");
					equal(actualArr[2].properties.P2, "32", "3rd properties as expected");

					//Pages, asserts: 25
					equal(context.countProps(actualArr[0].pages), 0, "1st no pages");
					equal(context.countProps(actualArr[1].pages), 2, "2nd - 2 pages");
					equal(context.countProps(actualArr[2].pages), 1, "3rd - 1 page");

					equal(actualArr[1].pages[0].name, pInfo21.name, "2nd page0 name as expected");
					equal(actualArr[1].pages[1].name, pInfo22.name, "2nd page1 name as expected");
					equal(actualArr[2].pages[0].name, pInfo31.name, "3rd page0 name as expected");
					equal(actualArr[1].pages[0].pagegroupid, actualArr[1].id, "2nd page0 PageGroupId match");
					equal(actualArr[1].pages[1].pagegroupid, actualArr[1].id, "2nd page1 PageGroupId match");
					equal(actualArr[2].pages[0].pagegroupid, actualArr[2].id, "3rd page0 PageGroupId match");

					equal(context.countProps(actualArr[1].pages[0].properties), 1, "1st - 1 property");
					equal(context.countProps(actualArr[1].pages[1].properties), 0, "2nd no properties");
					equal(context.countProps(actualArr[2].pages[0].properties), 0, "3rd no properties");
					
					equal(actualArr[1].pages[0].properties.P1, pInfo21.P1, "P21 property value matched");

					equal(actualArr[1].pages[0].permissions.length, 2, "2nd page0 permissions 2 levels");
					equal(actualArr[1].pages[1].permissions.length, 2, "2nd page1 permissions 2 levels");
					equal(actualArr[2].pages[0].permissions.length, 2, "3rd page0 permissions 2 levels");
					
					equal(actualArr[1].pages[0].permissions[0], "view", "2nd page0 permissions[0] is view");
					equal(actualArr[1].pages[0].permissions[1], "edit", "2nd page0 permissions[1] is edit");
					equal(actualArr[1].pages[1].permissions[0], "view", "2nd page1 permissions[0] is view");
					equal(actualArr[1].pages[1].permissions[1], "edit", "2nd page1 permissions[1] is edit");
					equal(actualArr[2].pages[0].permissions[0], "view", "3rd page0 permissions[0] is view");
					equal(actualArr[2].pages[0].permissions[1], "edit", "3rd page0 permissions[1] is edit");
					
					equal(actualArr[1].pages[0].settings, "", "2nd page0 settings empty for Current User");
					equal(actualArr[1].pages[1].settings, "", "2nd page1 settings empty for Current User");
					equal(actualArr[2].pages[0].settings, "set31", "3rd page0 settings matched for Current User");

					//Panels, asserts:26
					equal(context.countProps(actualArr[1].pages[0].panels), 1, "1 Panel per page 21");
					equal(context.countProps(actualArr[1].pages[1].panels), 0, "0 Panels for page 22");
					equal(context.countProps(actualArr[2].pages[0].panels), 2, "2 Panels for page 31");

					equal(actualArr[1].pages[0].panels[0].name, pnInfo211.name, "1st panel 211 name as expected");
					equal(actualArr[2].pages[0].panels[0].name, pnInfo311.name, "2nd panel 311 name as expected");
					equal(actualArr[2].pages[0].panels[1].name, pnInfo312.name, "3rd panel 312 name as expected");
					equal(actualArr[1].pages[0].panels[0].pageid, actualArr[1].pages[0].id, "1st panel 211 PageId match");
					equal(actualArr[2].pages[0].panels[0].pageid, actualArr[2].pages[0].id, "2nd panel 311 PageId match");
					equal(actualArr[2].pages[0].panels[1].pageid, actualArr[2].pages[0].id, "3rd panel 312 PageId match");
					
					equal(context.countProps(actualArr[1].pages[0].panels[0].properties), 1, "1st - 1 property");
					equal(context.countProps(actualArr[2].pages[0].panels[0].properties), 1, "2nd - 1 property");
					equal(context.countProps(actualArr[2].pages[0].panels[1].properties), 0, "3rd no properties");
					
					equal(actualArr[1].pages[0].panels[0].properties.P, pnInfo211.properties.P, "pn211 property value matched");
					equal(actualArr[2].pages[0].panels[0].properties.P, pnInfo311.properties.P, "pn311 property value matched");
					
					equal(actualArr[1].pages[0].panels[0].permissions.length, 2, "1st panel 211 permissions 2 levels");
					equal(actualArr[2].pages[0].panels[0].permissions.length, 2, "2nd panel 311 permissions 2 levels");
					equal(actualArr[2].pages[0].panels[1].permissions.length, 2, "3rd panel 312 permissions 2 levels");
					
					equal(actualArr[1].pages[0].panels[0].permissions[0], "view", "1st panel 211 permissions[0] is view");
					equal(actualArr[2].pages[0].panels[0].permissions[0], "view", "2nd panel 311 permissions[0] is view");
					equal(actualArr[2].pages[0].panels[1].permissions[0], "view", "3rd panel 312 permissions[0] is view");
					
					equal(actualArr[1].pages[0].panels[0].permissions[1], "edit", "1st panel 211 permissions[1] is edit");
					equal(actualArr[2].pages[0].panels[0].permissions[1], "edit", "2nd panel 311 permissions[1] is edit");
					equal(actualArr[2].pages[0].panels[1].permissions[1], "edit", "3rd panel 312 permissions[1] is edit");
					
					equal(actualArr[1].pages[0].panels[0].settings, "set211", "1st panel 211 settings match");
					equal(actualArr[2].pages[0].panels[0].settings, "", "2nd panel 311 settings empty");
					equal(actualArr[2].pages[0].panels[1].settings, "", "3rd panel 312 settings empty");
					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});
	
	asyncTest("Bulk load DashBoard - Happy Path - by User", 52, function () {
		var queue = new ActionQueue(this);
		var pgInfo1 = new envianceSdk.portal.PageGroupInfo('pg1');
		var pgInfo2 = new envianceSdk.portal.PageGroupInfo('pg2');
		var pgInfo3 = new envianceSdk.portal.PageGroupInfo('pg3');
		pgInfo2.addProperty("P1", "21");
		pgInfo3.addProperty("P1", "31");
		pgInfo3.addProperty("P2", "32");

		var pInfo21 = new envianceSdk.portal.PageInfo('p2.1');
		var pInfo22 = new envianceSdk.portal.PageInfo('p2.2');
		var pInfo31 = new envianceSdk.portal.PageInfo('p3.1');
		pInfo21.addProperty("P", "21");
		


		this.getUserId(queue);

		queue.enqueue(function (context) {
			pInfo21.accessLevels.addExceptUserId(context.userId, "view");
			pInfo31.accessLevels.addExceptUserId(context.userId, "edit");
			queue.executeNext();
		});

		
		
		
		pInfo22.accessLevels.addExceptGroup(this.groupName, "edit");
		//pInfo31.accessLevels.addExceptGroup(this.groupName, "noaccess");
				
		var pnInfo211 = new envianceSdk.portal.PanelInfo('pn 211');
		var pnInfo311 = new envianceSdk.portal.PanelInfo('pn 311');
		var pnInfo312 = new envianceSdk.portal.PanelInfo('pn 312');

		pnInfo211.addProperty("P", "211");
		pnInfo311.addProperty("P", "311");

		queue.enqueue(function (context) {
			pnInfo211.accessLevels.addUserId(context.userId, "noaccess");
			pnInfo311.accessLevels.addUserId(context.userId, "view");
		
			queue.executeNext();
		});
		
		pnInfo312.accessLevels.addGroup(this.groupName, "noaccess");

		this.createPageGroup(queue, pgInfo1);
		this.createPageGroup(queue, pgInfo2);
		this.createPageGroup(queue, pgInfo3);

		this.createPageByGroup(queue, pInfo21, pgInfo2.name);
		this.createPageByGroup(queue, pInfo22, pgInfo2.name);
		this.createPageByGroup(queue, pInfo31, pgInfo3.name);

		this.createPanelByPageAndGroup(queue, pgInfo2.name, pInfo21.name, pnInfo211);
		this.createPanelByPageAndGroup(queue, pgInfo3.name, pInfo31.name, pnInfo311);
		this.createPanelByPageAndGroup(queue, pgInfo3.name, pInfo31.name, pnInfo312);

		this.authenticateUserWithoutRights(queue);

		queue.enqueue(function (context) {
			envianceSdk.portal.savePanelSettings(pgInfo3.name, pInfo31.name, pnInfo311.name, "set311",
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Panel Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.savePageSettings(pgInfo3.name, pInfo31.name, "set31",
				function (response) {
					equal(response.metadata.statusCode, 204, "Saved Panel Settings. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});
		//asserts:11

		/*
			PG1				=>NO		(No childs)
			PG2				=>YES		(childs)
				p21			=>View		(View Permission)
					pn211	=>NO		(No Access)
				p22			=>View,Edit	(edit Permission)
			PG3				=>YES
				p31			=>View		(child, even NOAccess have)
					pn311	=>View		(View permission)
					pn312	=>NO		(No access)
		*/

		queue.enqueue(function (context) {
			envianceSdk.portal.getDashboard(
				function (response) {
					queue.checkAndStart(function() {
					var actualArr = response.result;
					var exp0 = pgInfo2;
					var exp1 = pgInfo3;
					//PageGroups, asserts: 8
					equal(actualArr.length, 2, "2 Page Groups accessed by User");
					equal(actualArr[0].name, exp0.name, "1st Names are equal");
					equal(actualArr[1].name, exp1.name, "2nd Names are equal");

					equal(context.countProps(actualArr[0].properties), 1, "2nd  - 1 property");
					equal(context.countProps(actualArr[1].properties), 2, "3rd  - 2 properties");
					equal(actualArr[0].properties.P1, "21", "2nd properties as expected");
					equal(actualArr[1].properties.P1, "31", "3rd properties as expected");
					equal(actualArr[1].properties.P2, "32", "3rd properties as expected");

					//Pages, asserts: 22
					equal(context.countProps(actualArr[0].pages), 2, "2nd - 2 pages");
					equal(context.countProps(actualArr[1].pages), 1, "3rd - 1 page");

					equal(actualArr[0].pages[0].name, pInfo21.name, "2nd page0 name as expected");
					equal(actualArr[0].pages[1].name, pInfo22.name, "2nd page1 name as expected");
					equal(actualArr[1].pages[0].name, pInfo31.name, "3rd page0 name as expected");
					equal(actualArr[0].pages[0].pagegroupid, actualArr[0].id, "2nd page0 PageGroupId match");
					equal(actualArr[0].pages[1].pagegroupid, actualArr[0].id, "2nd page1 PageGroupId match");
					equal(actualArr[1].pages[0].pagegroupid, actualArr[1].id, "3rd page0 PageGroupId match");

					equal(context.countProps(actualArr[0].pages[0].properties), 1, "1st - 1 property");
					equal(context.countProps(actualArr[0].pages[1].properties), 0, "2nd no properties");
					equal(context.countProps(actualArr[1].pages[0].properties), 0, "3rd no properties");

					equal(actualArr[0].pages[0].properties.P1, pInfo21.P1, "P21 property value matched");

					equal(actualArr[0].pages[0].permissions.length, 1, "2nd page0 permissions 1 level");
					equal(actualArr[0].pages[1].permissions.length, 2, "2nd page1 permissions 2 levels");
					equal(actualArr[1].pages[0].permissions.length, 2, "3rd page0 permissions 2 level");

					equal(actualArr[0].pages[0].permissions[0], "view", "2nd page0 permissions[0] is view");
					equal(actualArr[0].pages[1].permissions[0], "view", "2nd page1 permissions[0] is view");
					equal(actualArr[0].pages[1].permissions[1], "edit", "2nd page1 permissions[1] is edit");
					equal(actualArr[0].pages[0].permissions[0], "view", "3rd page0 permissions[0] is view");

					equal(actualArr[0].pages[0].settings, "", "2nd page0 settings empty for Current User");
					equal(actualArr[0].pages[1].settings, "", "2nd page1 settings empty for Current User");
					equal(actualArr[1].pages[0].settings, "set31", "3rd page0 settings empty for Current User");

					//Panels, asserts:10
					equal(context.countProps(actualArr[0].pages[0].panels), 0, "0 Panels per page 21");
					equal(context.countProps(actualArr[0].pages[1].panels), 0, "0 Panels for page 22");
					equal(context.countProps(actualArr[1].pages[0].panels), 2, "2 Panels for page 31");

					equal(actualArr[1].pages[0].panels[0].name, pnInfo311.name, "2nd panel 311 name as expected");
					equal(actualArr[1].pages[0].panels[0].pageid, actualArr[1].pages[0].id, "2nd panel 311 PageId match");

					equal(context.countProps(actualArr[1].pages[0].panels[0].properties), 1, "2nd - 1 property");

					equal(actualArr[1].pages[0].panels[0].properties.P, pnInfo311.properties.P, "pn311 property value matched");

					equal(actualArr[1].pages[0].panels[0].permissions.length, 2, "2nd panel 311 permissions 2 levels");

					equal(actualArr[1].pages[0].panels[0].permissions[0], "view", "2nd panel 311 permissions[0] is view");
					equal(actualArr[1].pages[0].panels[0].permissions[1], "edit", "2nd panel 311 permissions[0] is view");

					equal(actualArr[1].pages[0].panels[0].settings, "set311", "2nd panel 311 settings matched");
					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});
	
	asyncTest("Move Page - Happy Path", 6, function () {
		var queue = new ActionQueue(this);
		var pInfo = new envianceSdk.portal.PageInfo(this.defaultPageName);
		var pgInfo = new envianceSdk.portal.PageGroupInfo("Other Group");

		this.createPage(queue, pInfo);
		this.createPageGroup(queue, pgInfo);
		
		queue.enqueue(function (context) {
			pInfo.pagegroupid = pgInfo.id;
			envianceSdk.portal.updatePage(
				context.defaultPageGroupName, context.defaultPageName, pInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Moved Page. Status code OK.");
					queue.executeNext();
				}, context.errorHandler
			);
		});

		queue.enqueue(function (context) {
			envianceSdk.portal.getPage(pgInfo.name, pInfo.name,
				function (response) {
					queue.checkAndStart(function() {
					var actual = response.result;
					var expected = pInfo;
					equal(actual.id, expected.id, "Page ID not changed");
					equal(actual.pagegroupid, pgInfo.id, "PageGroup ID changed(Page moved)");
					});
				}, context.errorHandler
			);
		});
		queue.executeNext();
	});
}

if (typeof(UnitTestsApplication) == "undefined") {
	executePortalDashboardTests();
}