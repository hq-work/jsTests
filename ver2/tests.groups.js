if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Groups', execute: executeSecurityGroupsServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

if (typeof groupsConfig == "undefined")
	groupsConfig = { };

function executeSecurityGroupsServiceTests() {
	module("Security Groups Service", {
		setup: function () {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = (groupsConfig.noManageRightsUserName || "jstestsWPermissions") + qUnitDbSuffix;
			this.jstestsExpiredUser = "jstestsExpiredUser" + qUnitDbSuffix;
			this.jstestsWPermissions = this.noManageRightsUserName;
			this.jstestsUserToRemoveFromAdminGroup = "jstestsUserToRemoveFromAdminGroup" + qUnitDbSuffix;
			this.password = groupsConfig.password || "1111";

			this.getGroupName = function() {
				return 'TEST Group - ' + Math.random().toString().replace('.', '');
			};

			this._groupsToDelete = [];
			this.addGroupToDelete = function(group) {
				this._groupsToDelete.push(group);
			};

			this._allRights = ["Manage Users", "Manage Groups", "Manage Access", "Manage Security Policy", "Manage Command Log", "Manage System Messages", "Manage Quick Links", "Manage Task Templates and Notifications", "Manage Event Templates", "Manage Workflows", "Manage Calculation Templates", "Manage Data Quality Templates", "Manage Materials and Activities", "Manage Requirement Templates", "Manage Custom Fields", "Manage Material Templates", "Manage Citations", "Manage Dashboards", "Manage Main Menu", "Manage Documents", "Manage Reports", "Manage Enviance Apps"];

			this.addCreateGroupToQueue = function(queue, groupNameToDelete, groupInfo) {
				queue.enqueue(function(context) {
					envianceSdk.groups.createGroup(groupInfo,
						function(response) {
							equal(response.metadata.statusCode, 201, "Status code OK.");
							if (groupNameToDelete != null) {
								context.addGroupToDelete(groupNameToDelete);
							}
							queue.executeNext();
						},
						context.errorHandler
					);
				});
			};

			this.addAuthenticateToQueue = function(queue) {
				queue.enqueue(function(context) {
					envianceSdk.authentication.authenticate(context.noManageRightsUserName, context.password,
						function() {
							queue.executeNext();
						},
						context.errorHandler);
				});
			};
		},
		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});

			var self = this;
			for (var i = 0; i < this._groupsToDelete.length; i++) {
				var group = this._groupsToDelete[i];
				envianceSdk.groups.deleteGroup(group, function() {
				}, self.errorHandler);
			}
		}
	});

	asyncTest("Create and Get Group - Happy Path", 15, function() {
		var queue = new ActionQueue(this);

		function testCreateAndGetGroup(name, rights, members, isLast) {
			var groupInfo = new envianceSdk.groups.GroupInfo(name, rights, members);
			queue.enqueue(function(context) {
				envianceSdk.groups.createGroup(groupInfo,
					function(response) {
						equal(response.metadata.statusCode, 201, "Status code OK.");
						ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
						context.addGroupToDelete(name);
						queue.executeNext();
					},
					context.errorHandler
				);
			});

			queue.enqueue(function(context) {
				envianceSdk.groups.getGroup(name,
					function(response) {
						equal(response.metadata.statusCode, 200, "Status code OK.");
						equal(response.result.members.length, members.length, "Actual and expected group members count are equal");
						deepEqual(response.result.rights, rights, "Actual and expected group rights are equal");
						if (isLast) {
							start();
						} else {
							queue.executeNext();
						}
					},
					context.errorHandler
				);

			});
		}

		testCreateAndGetGroup(this.getGroupName(), this._allRights, [this.accessUserName, this.jstestsExpiredUser], false);
		testCreateAndGetGroup(this.getGroupName(), ["Manage Users", "Manage Command Log"], [this.accessUserName, this.jstestsWPermissions], false);
		testCreateAndGetGroup(this.getGroupName(), [], [], true);

		queue.executeNext();
	});

	asyncTest("Get Group - Success if group is an Administrators.", 3, function() {
		var self = this;
		var groupName = 'Administrators';

		envianceSdk.groups.getGroup(groupName,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code OK.");
				equal(response.result.name, groupName, "Actual and expected group name are equal");
				ok(response.result.members.length > 0, 'Actual and expected group members count are equal');
				start();
			},
			self.errorHandler
		);
	});

	asyncTest("Get Group - Fault if group name is empty.", 1, function() {
		var self = this;
		var groupName = '';

		envianceSdk.groups.getGroup(groupName,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				start();
			}
		);
	});

	asyncTest("Get Group - Fault if group does not exists.", 2, function() {
		var self = this;
		var groupName = 'Test Not Existing Group';

		envianceSdk.groups.getGroup(groupName,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Get Group - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.getGroup(groupName,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Create Group - Fault if the group name is Administrators.", 2, function() {
		var self = this;
		var groupName = 'Administrators';
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		envianceSdk.groups.createGroup(groupInfo,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if the group name does not match the naming rules.", 2, function() {
		var self = this;
		var groupName = this.getGroupName() + ' - []';
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		envianceSdk.groups.createGroup(groupInfo,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if the group name excess 255 length", 2, function() {
		var self = this;
		var groupName = this.getGroupName() + new Array(250).join('a');
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		envianceSdk.groups.createGroup(groupInfo,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if the group name already exists.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.createGroup(groupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Create Group - Fault if group member does not exists.", 2, function() {
		var self = this;
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], ['NotExistingGroupMember']);

		envianceSdk.groups.createGroup(groupInfo,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if group member is deleted user.", 2, function() {
		var self = this;
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], ['jstestsDeletedUser']);

		envianceSdk.groups.createGroup(groupInfo,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if group Right Type is not a valid.", 2, function() {
		var self = this;
		var groupName = this.getGroupName();

		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, ['Invalid Right'], []);
		envianceSdk.groups.createGroup(groupInfo,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 12001, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if user does't have 'Manage Groups' rights.", 2, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.createGroup(groupInfo,
				function() {
					context.addGroupToDelete(groupName);
					context.errorHandler("Failed");
				},
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Create Group - Fault if group name is null.", 2, function() {
		var queue = new ActionQueue(this);
		var groupInfo = new envianceSdk.groups.GroupInfo(null, [], []);

		queue.enqueue(function(context) {
			envianceSdk.groups.createGroup(groupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code is correct");
					equal(response.error.errorNumber, 100, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});


	asyncTest("Create Group - Fault if members is null.", 2, function() {
		var self = this;
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], null);

		envianceSdk.groups.createGroup(groupInfo,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Create Group - Fault if rights is null.", 2, function() {
		var self = this;
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, null, []);

		envianceSdk.groups.createGroup(groupInfo,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				start();
			}
		);
	});

	asyncTest("Create Group - Success if rights has a duplicates.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, ["Manage Documents", "Manage Documents", "Manage Users", "Manage Users"], []);

		queue.enqueue(function(context) {
			envianceSdk.groups.createGroup(groupInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK.");
					context.addGroupToDelete(groupName);
					queue.executeNext();
				},
				context.errorHandler
			);
		});
		queue.enqueue(function(context) {
			envianceSdk.groups.getGroup(groupName,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					deepEqual(response.result.rights.length, 2, "Actual and expected group rights are equal");
					start();
				},
				context.errorHandler
			);

		});

		queue.executeNext();
	});


	asyncTest("Create Group - Success if members has a duplicates.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], [this.accessUserName, this.accessUserName]);

		queue.enqueue(function(context) {
			envianceSdk.groups.createGroup(groupInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code OK.");
					context.addGroupToDelete(groupName);
					queue.executeNext();
				},
				context.errorHandler
			);
		});
		queue.enqueue(function(context) {
			envianceSdk.groups.getGroup(groupName,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					deepEqual(response.result.members.length, 1, "Actual and expected count of members are equal");
					start();
				},
				context.errorHandler
			);

		});

		queue.executeNext();
	});

	asyncTest("Create Group - Check warnings", 2, function() {
		var self = this;
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		groupInfo.id = 'AE8C397B-5D34-4EDE-B6FD-8E24510A290F';

		envianceSdk.groups.createGroup(groupInfo,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code OK.");
				self.addGroupToDelete(groupName);
				ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
				start();
			},
			self.errorHandler
		);
	});

	asyncTest("Update Group - Happy Path", 16, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		this.addCreateGroupToQueue(queue, null, groupInfo);

		function testUpdateGroup(currentGroupName, newGroupName, newRights, newMembers, isLast) {
			var updateGroupInfo = new envianceSdk.groups.GroupInfo(newGroupName, newRights, newMembers);
			queue.enqueue(function(context) {
				envianceSdk.groups.updateGroup(currentGroupName, updateGroupInfo,
					function(response) {
						equal(response.metadata.statusCode, 204, "Status code OK.");
						queue.executeNext();
					},
					context.errorHandler
				);

			});

			queue.enqueue(function(context) {
				envianceSdk.groups.getGroup(newGroupName,
					function(response) {
						equal(response.metadata.statusCode, 200, "Status code OK.");
						equal(response.result.name, newGroupName, "Actual and expected group names are equal.");
						deepEqual(response.result.members.length, newMembers.length, "Actual and expected group members count are equal");
						deepEqual(response.result.rights, newRights, "Actual and expected group rights are equal");
						if (isLast) {
							start();
						} else {
							queue.executeNext();
						}

					},
					context.errorHandler
				);

			});
		}

		var newGroupName1 = this.getGroupName();
		testUpdateGroup(groupName, newGroupName1, ["Manage Users", "Manage Groups"], [this.accessUserName, this.jstestsExpiredUser], false);

		var newGroupName2 = this.getGroupName();
		testUpdateGroup(newGroupName1, newGroupName2, this._allRights, [this.jstestsWPermissions, this.accessUserName], false);

		var newGroupName3 = this.getGroupName();
		testUpdateGroup(newGroupName2, newGroupName3, [], [], true);

		this.addGroupToDelete(newGroupName3);
		queue.executeNext();
	});

	asyncTest("Update Group - Fault if the group name is Administrators.", 2, function() {
		var self = this;
		var groupName = 'Administrators';
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Update Group - Fault if group name is null.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(null, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});


	asyncTest("Update Group - Fault if members and rights are null.", 5, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, ["Manage Users", "Manage Groups"], [this.accessUserName, this.jstestsWPermissions]);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, null, null);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					queue.executeNext();
				},
				context.errorHandler
			);
		});

		queue.enqueue(function(context) {
			envianceSdk.groups.getGroup(groupName,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					deepEqual(response.result.rights.length, 2, "Actual and expected group rights count are equal");
					deepEqual(response.result.members.length, 2, "Actual and expected group members count are equal");
					start();
				},
				context.errorHandler
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Group - Fault if group does not exists.", 2, function() {
		var self = this;
		var groupName = this.getGroupName();
		var notExistingGroupId = '1DF8345A-D7A8-46F8-9D8C-22C393B2175A';
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		envianceSdk.groups.updateGroup(notExistingGroupId, updateGroupInfo,
			function (response) {
				self.addGroupToDelete(groupName);
				self.errorHandler(response);
			},
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Update Group - Fault if the group name does not match the naming rules.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var invalidGroupName = '/' + this.getGroupName() + '/';

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(invalidGroupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				function() {
					context.addGroupToDelete(invalidGroupName);
					context.errorHandler("Failed");
				},
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Group - Fault if the group name excess 255 length.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var invalidGroupName = this.getGroupName() + new Array(250).join('a');

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(invalidGroupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				function() {
					context.addGroupToDelete(invalidGroupName);
					context.errorHandler("Failed");
				},
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Group - Fault if the group name already exists.", 4, function() {
		var queue = new ActionQueue(this);
		var groupName1 = this.getGroupName();
		var groupName2 = this.getGroupName();
		var createGroupInfo1 = new envianceSdk.groups.GroupInfo(groupName1, [], []);
		var createGroupInfo2 = new envianceSdk.groups.GroupInfo(groupName2, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName1, [], []);

		this.addCreateGroupToQueue(queue, groupName1, createGroupInfo1);
		this.addCreateGroupToQueue(queue, groupName2, createGroupInfo2);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName2, updateGroupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 409, "Status code OK");
					equal(response.error.errorNumber, 101, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Group - Fault if group member does not exists.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], ['NotExistingGroupMember']);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});


	asyncTest("Update Group - Fault if group member is deleted user.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], ['jstestsDeletedUser']);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Group - Success if group rights contains duplicates.", 4, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, ['Manage Command Log', 'Manage Command Log', 'Manage Users'], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					queue.executeNext();
				},
				context.errorHandler
			);
		});

		queue.enqueue(function(context) {
			envianceSdk.groups.getGroup(groupName,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.rights.length, 2, "Actual and expected group rights are equal");
					start();

				},
				context.errorHandler
			);

		});

		queue.executeNext();
	});


	asyncTest("Update Group - Success if group members contains duplicates.", 4, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], [this.accessUserName, this.accessUserName]);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					queue.executeNext();
				},
				context.errorHandler
			);
		});

		queue.enqueue(function(context) {
			envianceSdk.groups.getGroup(groupName,
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK.");
					equal(response.result.members.length, 1, "Actual and expected group members are equal");
					start();

				},
				context.errorHandler
			);

		});

		queue.executeNext();
	});

	asyncTest("Update Group - Fault if group Right Type is not a valid.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, ['Invalid Right Type Name'], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 12001, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});


	asyncTest("Update Group - Check warnings.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		var updateGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		updateGroupInfo.id = 'AE8C397B-5D34-4EDE-B6FD-8E24510A290F';
		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, updateGroupInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					start();
				},
				context.errorHandler
			);
		});

		queue.executeNext();
	});

	asyncTest("Update Group - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.updateGroup(groupName, groupInfo,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Delete Group - Happy Path", 2, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, ["Manage Workflows"], [this.accessUserName, this.jstestsExpiredUser]);

		this.addCreateGroupToQueue(queue, null, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.deleteGroup(groupName,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					start();
				},
				context.errorHandler
			);

		});

		queue.executeNext();
	});

	asyncTest("Delete Group - Fault if the group name is Administrators.", 2, function() {
		var self = this;
		var groupName = 'Administrators';

		envianceSdk.groups.deleteGroup(groupName,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				equal(response.error.errorNumber, 100, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Delete Group - Fault if group does not exists.", 2, function() {
		var self = this;
		var notExistingGroupId = '1111345A-D7A8-46F8-9D8C-22C393B2175A';

		envianceSdk.groups.deleteGroup(notExistingGroupId,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Delete Group - Fault if group id (name) is not defined.", 1, function() {
		var self = this;
		envianceSdk.groups.deleteGroup('',
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				start();
			}
		);
	});

	asyncTest("Delete Group - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.deleteGroup(groupName,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Get and Set Group Members - Happy Path", 13, function() {
		var groupName = this.getGroupName();
		var queue = new ActionQueue(this);

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], [this.accessUserName]);
		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		function testGetAndSetGroupMembers(members, isLast) {
			queue.enqueue(function(context) {
				envianceSdk.groups.setGroupMembers(groupName, members,
					function(response) {
						equal(response.metadata.statusCode, 204, "Status code OK.");
						queue.executeNext();
					},
					context.errorHandler
				);

			});

			queue.enqueue(function(context) {
				envianceSdk.groups.getGroupMembers(groupName,
					function(response) {
						equal(response.metadata.statusCode, 200, "Status code OK.");
						equal(response.result.length, members.length, "Actual and expected group members count are equal");
						if (isLast) {
							start();
						} else {
							queue.executeNext();
						}
					},
					context.errorHandler
				);
			});
		}

		testGetAndSetGroupMembers([this.accessUserName, this.jstestsWPermissions], false);
		testGetAndSetGroupMembers([this.accessUserName, this.jstestsExpiredUser], false);
		testGetAndSetGroupMembers([this.jstestsWPermissions], false);
		testGetAndSetGroupMembers([], true);

		queue.executeNext();
	});

	asyncTest("Get Group Members - Success if group is Administrators.", 2, function() {
		var self = this;
		var groupName = 'Administrators';

		envianceSdk.groups.getGroupMembers(groupName,
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code OK");
				ok(response.result.length > 0, 'Actual and expected group members count are equal');
				start();
			},
			self.errorHandler
		);
	});

	asyncTest("Get Group Members - Fault if group does not exists.", 2, function() {
		var self = this;
		var groupName = 'Test Not Existing Group';

		envianceSdk.groups.getGroupMembers(groupName,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});


	asyncTest("Get Group Members - Fault if group id (name) is not defined.", 1, function() {
		var self = this;
		envianceSdk.groups.getGroupMembers('',
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				start();
			}
		);
	});

	asyncTest("Get Group Members - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.getGroupMembers(groupName,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Set Group Members - Fault if group does not exists.", 2, function() {
		var self = this;
		var groupName = 'Test Not Existing Group';

		envianceSdk.groups.setGroupMembers(groupName, [this.accessUserName],
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Set Group Members - Fault if group id (name) is not defined.", 1, function() {
		var self = this;
		var groupName = '';

		envianceSdk.groups.setGroupMembers(groupName, [this.accessUserName],
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 405, "Status code OK");
				start();
			}
		);
	});


	asyncTest("Set Group Members - Fault if group is Administrators.", 3, function() {
		var queue = new ActionQueue(this);
		var administratorsGroupId = '';

		queue.enqueue(function(context) {
			var eql = "select g.id from group g where g.name = 'Administrators'";
			envianceSdk.eql.execute(eql, 1, 10,
				function(response) {
					administratorsGroupId = response.result[0].rows[0].values[0];
					equal(response.metadata.statusCode, 200, "Status code OK");
					queue.executeNext();
				},
				context.errorHandler);

		});

		queue.enqueue(function(context) {
			envianceSdk.groups.setGroupMembers(administratorsGroupId, [],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Status code OK");
					equal(response.error.errorNumber, 100, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Set Group Members - Fault if group member does not exists.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.setGroupMembers(groupName, ['NotExistingGroupMember'],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Set Group Members - Fault if group member is deleted user.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.setGroupMembers(groupName, ['jstestsDeletedUser'],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Set Group Members - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.setGroupMembers(groupName, [context.accessUserName],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Add Group Members - Happy Path", 10, function() {
		var groupName = this.getGroupName();
		var queue = new ActionQueue(this);

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);
		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		function testAddGroupMembers(members, testCountMembers, isLast) {
			queue.enqueue(function(context) {
				envianceSdk.groups.addGroupMembers(groupName, members,
					function(response) {
						equal(response.metadata.statusCode, 204, "Status code OK.");
						queue.executeNext();
					},
					context.errorHandler
				);

			});

			queue.enqueue(function(context) {
				envianceSdk.groups.getGroupMembers(groupName,
					function(response) {
						equal(response.metadata.statusCode, 200, "Status code OK.");
						equal(response.result.length, testCountMembers, "Actual and expected group members count are equal");
						if (isLast) {
							start();
						} else {
							queue.executeNext();
						}
					},
					context.errorHandler
				);

			});
		}

		testAddGroupMembers([], 0, false);
		testAddGroupMembers([this.jstestsWPermissions, this.jstestsExpiredUser], 2, false);
		testAddGroupMembers([this.accessUserName, this.jstestsWPermissions], 3, true);


		queue.executeNext();
	});

	asyncTest("Add Group Members - Fault if group does not exists.", 2, function() {
		var self = this;
		var groupName = 'Test Not Existing Group';

		envianceSdk.groups.addGroupMembers(groupName, [this.accessUserName],
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Add Group Members - Fault if group id (name) is not defined.", 1, function() {
		var self = this;
		var groupName = '';

		envianceSdk.groups.addGroupMembers(groupName, [this.accessUserName],
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code OK");
				start();
			}
		);
	});

	asyncTest("Add Group Members - Fault if group member does not exists.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.addGroupMembers(groupName, ['NotExistingGroupMember'],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});


	asyncTest("Add Group Members - Fault if group member is deleted user.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.addGroupMembers(groupName, ['jstestsDeletedUser'],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Add Group Members - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.addGroupMembers(groupName, [context.accessUserName],
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Add and Remove Group Member - Success if group is an Administrators.", 2, function() {
		var queue = new ActionQueue(this);
		var groupName = 'Administrators';

		queue.enqueue(function(context) {
			envianceSdk.groups.addGroupMembers(groupName, [context.jstestsUserToRemoveFromAdminGroup],
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					queue.executeNext();
				},
				context.errorHandler
			);
		});

		queue.enqueue(function(context) {
			envianceSdk.groups.removeGroupMember(groupName, context.jstestsUserToRemoveFromAdminGroup,
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK.");
					start();
				},
				context.errorHandler
			);
		});

		queue.executeNext();
	});

	asyncTest("Remove Group Member - Happy Path", 10, function() {
		var groupName = this.getGroupName();
		var queue = new ActionQueue(this);

		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], [this.accessUserName, this.jstestsExpiredUser]);
		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		function testRemoveGroupMembers(member, testCount, isLast) {
			queue.enqueue(function(context) {
				envianceSdk.groups.removeGroupMember(groupName, member,
					function(response) {
						equal(response.metadata.statusCode, 204, "Status code OK.");
						queue.executeNext();
					},
					context.errorHandler
				);
			});

			queue.enqueue(function(context) {
				envianceSdk.groups.getGroupMembers(groupName,
					function(response) {
						equal(response.metadata.statusCode, 200, "Status code OK.");
						equal(response.result.length, testCount, "Actual and expected group members count are equal");
						if (isLast) {
							start();
						} else {
							queue.executeNext();
						}
					},
					context.errorHandler
				);

			});
		}

		testRemoveGroupMembers(this.jstestsWPermissions, 2, false);
		testRemoveGroupMembers(this.jstestsExpiredUser, 1, false);
		testRemoveGroupMembers(this.accessUserName, 0, true);
		queue.executeNext();
	});

	asyncTest("Remove Group Member - Fault if group does not exists.", 2, function() {
		var self = this;
		var groupName = 'Test Not Existing Group';

		envianceSdk.groups.removeGroupMember(groupName, this.accessUserName,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});


	asyncTest("Remove Group Member - Fault if group id(name) is  not defined.", 1, function() {
		var self = this;

		envianceSdk.groups.removeGroupMember('', this.accessUserName,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				start();
			}
		);
	});

	asyncTest("Remove Group Member - Fault if group member does not exists.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.removeGroupMember(groupName, 'NotExistingGroupMember',
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Remove Group Member - Fault if group member is deleted user.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var createGroupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, createGroupInfo);

		queue.enqueue(function(context) {
			envianceSdk.groups.removeGroupMember(groupName, 'jstestsDeletedUser',
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 404, "Status code OK");
					equal(response.error.errorNumber, 102, "Error number OK");
					start();
				}
			);
		});

		queue.executeNext();
	});

	asyncTest("Remove Group Member - Fault if user does't have 'Manage Groups' rights.", 3, function() {
		var queue = new ActionQueue(this);
		var groupName = this.getGroupName();
		var groupInfo = new envianceSdk.groups.GroupInfo(groupName, [], []);

		this.addCreateGroupToQueue(queue, groupName, groupInfo);
		this.addAuthenticateToQueue(queue);

		queue.enqueue(function(context) {
			envianceSdk.groups.removeGroupMember(groupName, context.accessUserName,
				context.errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 403, "Status code is correct");
					equal(response.error.errorNumber, 103, "Error number is correct");
					start();
				}
			);
		});

		queue.executeNext();
	});

}

if (typeof(UnitTestsApplication) == "undefined") {
	executeSecurityGroupsServiceTests();
}