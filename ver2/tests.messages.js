if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Messages', execute: executeMessageServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executeMessageServiceTests() {
	module("Message Service", {
		setup: function() {
			this._recipientIdOrUserName = this.accessUserName;
		},
		teardown: function () {
		}
	});

	asyncTest("Create Message - Happy Path", 1, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(
			this._recipientIdOrUserName,
			'<a href="#">test subject</a> - ' + envianceSdk.IsoDate.toUTCString(new Date()),
			'<a href="#">test body</a> - ' + Math.random(),
			true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
				function(response) {
					equal(response.metadata.statusCode, 202, "Status code OK.");
					start();
				},
				context.errorHandler
			);

		});
		queue.executeNext();
	});

	asyncTest("Create Message - Fault if recipient length > 100", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(new Array(102).join('a'), 'subject', 'body', true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message - Fault if subject length > 255", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(this._recipientIdOrUserName, new Array(257).join('a'), 'body', true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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


	asyncTest("Create Message - Fault if body length > 4096", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(this._recipientIdOrUserName, 'subject', new Array(4098).join('a'), true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message - Fault if recipientId is not defined", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(
			null,
			'<!--("!@#$%^&*({\' - ' + envianceSdk.IsoDate.toUTCString(new Date()),
			'<!--("!@#$%^&*({\' - ' + Math.random(),
			true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message - Fault if subject is not defined", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(
			this._recipientIdOrUserName,
			null,
			'test body',
			true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message - Fault if body is not defined", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(
			this._recipientIdOrUserName,
			'test subject',
			null,
			true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message - Success if sendByEmail is not defined", 1, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(
			this._recipientIdOrUserName,
			'test subject',
			'test body',
			null);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
				function(response) {
					equal(response.metadata.statusCode, 202, "Status code OK.");
					start();
				},
				context.errorHandler
			);

		});
		queue.executeNext();
	});

	asyncTest("Create Message - Fault if recipient is deleted user", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo('jstestsDeletedUser', 'subject', 'body', true);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message -Check warnings", 7, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(
			this._recipientIdOrUserName,
			'test subject - ' + envianceSdk.IsoDate.toUTCString(new Date()),
			'test body - ' + Math.random(),
			true);

		msg.id = 'd8ac14f5-c4b1-4db2-b0fc-15452f71737d';
		msg.sentByIdOrUserName = '21e1f9b6-fc7c-4257-85f1-01d097762d09';
		msg.sentOn = '2013-06-14T14:07:52';
		msg.type = 'EmailNotification';
		msg.archived = true;
		msg.read = true;

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
				function(response) {
					equal(response.metadata.statusCode, 202, "Status code OK.");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'sentByIdOrUserName\'") > 0, "Warning for 'sentByIdOrUserName' OK");
					ok(response.metadata.warnings.indexOf("\'sentOn\'") > 0, "Warning for 'sentOn' OK");
					ok(response.metadata.warnings.indexOf("\'type\'") > 0, "Warning for 'type' OK");
					ok(response.metadata.warnings.indexOf("\'archived\'") > 0, "Warning for 'archived' OK");
					ok(response.metadata.warnings.indexOf("\'read\'") > 0, "Warning for 'read' OK");
					start();
				},
				context.errorHandler
			);

		});
		queue.executeNext();
	});

	asyncTest("Create Message by user login - Fault if user does not exists.", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo('userDoesNotExists', 'test subject', 'test body', false);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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


	asyncTest("Create Message by user id - Fault if user does not exists.", 2, function() {
		var msg = new envianceSdk.messages.MessageInfo('88888345A-D7A8-46F8-9D8C-22C393B2175A', 'test subject', 'test body', false);
		envianceSdk.messages.createMessage(msg,
			this.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});


	asyncTest("Get Message - Fault if  message does not exists.", 2, function() {
		envianceSdk.messages.getMessage('DDDD5337-3C29-4C71-894E-000E805975A3',
			this.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});

	asyncTest("Delete Message - Fault if  message does not exists.", 2, function() {
		envianceSdk.messages.deleteMessage('DDDD5337-3C29-4C71-894E-000E805975A3',
			this.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 404, "Status code OK");
				equal(response.error.errorNumber, 102, "Error number OK");
				start();
			}
		);
	});


	asyncTest("Create Message - Fault if recipient is not defined.", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(null, 'test subject', 'test body', false);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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

	asyncTest("Create Message - Fault if subject is not defined.", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(this._recipientIdOrUserName, null, 'test body', false);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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


	asyncTest("Create Message - Fault if body is not defined.", 2, function() {
		var queue = new ActionQueue(this);
		var msg = new envianceSdk.messages.MessageInfo(this._recipientIdOrUserName, 'subject', '', false);

		queue.enqueue(function(context) {
			envianceSdk.messages.createMessage(msg,
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


	asyncTest("Delete Message - Fail if message id is invalid.", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.messages.deleteMessage('7B-5D34-4EDE-B6FD-8E24510A290F',
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
	
	//FYI: Redesign and activate these tests when there will be support for EQL <Message> table.
/*
	asyncTest("Delete Message - Happy Path.", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.messages.deleteMessage('1BFC2DBC-0AE0-4530-AD6F-6E8D4B813FD3',
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code OK");
					start();
				},
				context.errorHandler
			);

		});
		queue.executeNext();
	});

	asyncTest("Delete Message - Fail if message not from user Inbox.", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.messages.deleteMessage('AE8C397B-5D34-4EDE-B6FD-8E24510A290F',
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


	asyncTest("Get Message - Happy Path.", 1, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.messages.getMessage('FE9C9708-A7B4-44BA-8AB1-4A3FA7FB3F63',
				function(response) {
					equal(response.metadata.statusCode, 200, "Status code OK");
					start();
				},
				context.errorHandler
			);

		});
		queue.executeNext();
	});

	asyncTest("Get Message - Fail if message not from user Inbox.", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.messages.getMessage('AE8C397B-5D34-4EDE-B6FD-8E24510A290F',
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
*/
}

if (typeof(UnitTestsApplication) == "undefined") {
	executeMessageServiceTests();
}