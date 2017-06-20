if (typeof(UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Package', execute: executePackageServiceTests });
}

if (typeof envianceSdk == "undefined")
	envianceSdk = { };

function executePackageServiceTests() {
	module("Package Service", {
		setup: function() {
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
			
			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.noManageRightsUserName = "jstestsWPermissions" + qUnitDbSuffix;
			this.accessUserName = "jstestsPackageAccessUser" + qUnitDbSuffix;
			this.noAccessUserName = "jstestsPackageNotAccessUser" + qUnitDbSuffix;
			this.accessUserFullname = "jstestsPackageAccessUser, jstestsPackageAccessUser";
			
			this.password = "1111";
			this.basePackageName = "JS Tests Package - base";
			this.basePackageCreated = new Date(2013, 0, 1, 18, 0);
			this.lockedPackageName = "JS Tests Package - locked";

			this.htmlPackageContent = "UEsDBBQAAgAIADBuOUPwX7uFIAAAADQAAAAJAAAAaW5kZXguaHRte797v01GSW6OHS+XTUZqYgqI1ocxkvJTKsECcAZYKQBQSwECFAAUAAIACAAwbjlD8F+7hSAAAAA0AAAACQAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtUEsFBgAAAAABAAEANwAAAEcAAAAAAA==";
			this.htmlTextPackageContent = "UEsDBBQAAAAIAJqQOUO0/VW0BwAAAAUAAAAMAAAAZG9jdW1lbnQudHh0SyxOSUsHAFBLAwQUAAAACACakDlD8F+7hSAAAAA0AAAACQAAAGluZGV4Lmh0bXu/e79NRklujh0vl01GamIKiNaHMZLyUyrBAnAGWCkAUEsBAjMAFAAAAAgAmpA5Q7T9VbQHAAAABQAAAAwAAAAAAAAAAAAAAAAAAAAAAGRvY3VtZW50LnR4dFBLAQIzABQAAAAIAJqQOUPwX7uFIAAAADQAAAAJAAAAAAAAAAAAAAAAADEAAABpbmRleC5odG1QSwUGAAAAAAIAAgBxAAAAeAAAAAAA";

			this.workPackageId = null;
			
			this.idTest1PackageId = "b5504a09-a380-445a-bc31-08d1494b1d95";
			this.idTest1PackageName = "b5504a09a380445abc3108d1494b1d95";
			this.idTest1PackageContent = "UEsDBBQAAgAIAMFRkkMOdAC5XQAAAJAAAAAKAAAAaW5kZXguaHRtbAtJLS5RCEhMzk5MT1Uw5OXi5SrJyCzWy0wJAUoYQiU8UxRsFZSSTE0NTBINLHUTjS0MdE1MTBN1k5KNDXUNLFIMTSxNkgxTLE2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACACoUZJD5DbfPXcAAACXAAAADAAAAG1hbmlmZXN0LnhtbFXNQQrCMBBA0b3gHcLsUyd0Ag007RW8wqQJGkzSYqW0t9eAIB7gv9+Pe05iC881zsWCahDG4XzqF54efAuicA4WnNZIjIbbDok0u6lV2HlFhpzyRoPwcV0SH9dPYyEWH/bm/soJRPS/XNZeVkBWQf4R9Xr5boc3UEsBAhQAFAACAAgAwVGSQw50ALldAAAAkAAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACACoUZJD5DbfPXcAAACXAAAADAAAAAAAAAABACAAAACFAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAACYBAAAAAA==";
			this.idTest2PackageId = "c93b6889-aae9-4e3b-aad3-6cef50918a03";
			this.idTest2PackageName = "c93b6889aae94e3baad36cef50918a03";
			this.idTest2PackageContent = "UEsDBBQAAgAIAIJTkkMTISpdXAAAAJAAAAAKAAAAaW5kZXguaHRtbAtJLS5RCEhMzk5MT1Uw4uXi5SrJyCzWy0wJAUoYQSU8UxRsFZSSLY2TzCwsLHUTE1MtdU1SjZOArBRjXbPk1DRTA0tDi0QDYyVrrAb4JeamIhsBMgFkAEg/qnYAUEsDBBQAAgAIAJFTkkMimYGXdwAAAJcAAAAMAAAAbWFuaWZlc3QueG1sVc1hCsIgGIfx70F3kPe7y2ENhbldoSv8p28lqY0WsW5fQhAd4Pk9/bjmJJ58X+KtOGobReOw3fQz/BVnFgWZHXmrp84YC7Dds56AoDvPp4OyrYHSJEJc5oTX8dM4iiXw2lweOZGI4ZfL2ssKyCrIP6Jed9/t8AZQSwECFAAUAAIACACCU5JDEyEqXVwAAACQAAAACgAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtbFBLAQIUABQAAgAIAJFTkkMimYGXdwAAAJcAAAAMAAAAAAAAAAEAIAAAAIQAAABtYW5pZmVzdC54bWxQSwUGAAAAAAIAAgByAAAAJQEAAAAA";
			this.idTest3PackageId = "dd99f92b-9d57-41f4-aac0-7b80cccfa706";
			this.idTest3PackageName = "dd99f92b9d5741f4aac07b80cccfa706";
			this.idTest3PackageContent = "UEsDBBQAAgAIAFNqkkNFvmMdXQAAAJAAAAAKAAAAaW5kZXguaHRtbAtJLS5RCEhMzk5MT1Uw5uXi5SrJyCzWy0wJAUoYQyU8UxRsFZRSUiwt0yyNknQtU0zNdU0M00x0ExOTDXTNkywMkpOT0xLNDcyUrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACABbapJDftwhKHgAAACXAAAADAAAAG1hbmlmZXN0LnhtbLOxr8jNUShLLSrOzM+zVTLUM1Cyt+PlsilITM5OTE9VyEvMTbVVSkmxtEyzNEqyTDE1NzFMM0lMTDYwT7IwSE5OTks0NzBTUkjJLC7ISawMAOqxVcrMS0mt0Msoyc1RUshMQWjXBenXBRmgCzJBF8UIkK36UGvtAFBLAQIUABQAAgAIAFNqkkNFvmMdXQAAAJAAAAAKAAAAAAAAAAEAIAAAAAAAAABpbmRleC5odG1sUEsBAhQAFAACAAgAW2qSQ37cISh4AAAAlwAAAAwAAAAAAAAAAQAgAAAAhQAAAG1hbmlmZXN0LnhtbFBLBQYAAAAAAgACAHIAAAAnAQAAAAA=";

            this.routesEnabledPackage1Id = "a4c5e42b-bb7c-456a-bdb2-78a9be0b6379";
            this.routesEnabledPackage2Id = "ee1f599a-3a14-41e4-882e-a8cd30426083";
            this.routesEnabledPackage3Id = "c647338d-43d5-4a05-8cf8-e80a30be1a8f";
            this.routesEnabledPackage4Id = "df031999-ef90-42ee-b01d-dc41921c877b";
            this.routesEnabledPackage5Id = "e7d21821-9258-4429-aefb-9d23de9d4837";


			this.newPackageId = null;
			this.pageId = null;
			this.iconId = null;
			this.packageCreationInfo =
				{
					name: "JS Tests Package - new created",
					description: "JS Tests Package new created description",
					isLocked: "false"
				};

			this.displayPageCreationInfo =
				{
					path: "/index.html",
					type: "Page",
					content: "UEsDBBQABgAIAAAAIQCMGvGG3QEAAFMIAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAA"
				};

			this.pageCreationInfo =
				{
					path: "/page.html",
					type: "Page",
					content: "UEsDBBQABgAIAAAAIQCMGvGG3QEAAFMIAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAA"
				};

			this.newPageCreationInfo =
				{
					id: createUUID(),
					path: "/newPage.html",
					type: "Page",
					content: "UEsDBBQABgAIAAAAIQCMGvGG3QEAAFMIAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAA"
				};

			this.iconCreationInfo =
				{
					path: "/icon.ico",
					type: "Image",
					content: "icon"
				};

			this._deleteWorkPackage(this.packageCreationInfo.name);
			this._deleteWorkPackage("NewName");
			this._deleteWorkPackage(this._prepareWorkPackageName());
			this._deleteWorkPackage(this._prepareWorkPackageName() + " (Modified)");
			this._deleteWorkPackage(this._prepareWorkPackageName(this.lockedPackageName));
			this._deleteWorkPackage(this._prepareWorkPackageName(this.lockedPackageName) + " (Modified)");
			this._deleteWorkPackage(this.idTest1PackageId);
			this._deleteWorkPackage(this.idTest2PackageId);
			this._deleteWorkPackage(this.idTest3PackageId);
			this._deleteWorkPackage(this.routesEnabledPackage1Id);
			this._deleteWorkPackage(this.routesEnabledPackage2Id);
			this._deleteWorkPackage(this.routesEnabledPackage3Id);
			this._deleteWorkPackage(this.routesEnabledPackage4Id);
			this._deleteWorkPackage(this.routesEnabledPackage5Id);
			
			var self = this;
			this._errorHandler = function(response, status, message) {
				envianceSdk.configure({ sessionId: self.originalSessionId });
				self.errorHandler(response, status, message);
			};
			
		},
		teardown: function() {
			stop();
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
			start();
		},

		_authenticate: function (queue, user) {
			queue.enqueue(function(context) {
				envianceSdk.authentication.authenticate(user, context.password,
					function() {
						queue.executeNext();
					},
					context._errorHandler);
			});
		},

		_start: function(queue) {
			queue.enqueue(function() {
				start();
			});
			queue.executeNext();
		},

		_prepareWorkPackageName: function(sourceName) {
			var sourcePackageName = sourceName != null ? sourceName : this.basePackageName;
			return sourcePackageName + " (Copy)";
		},

		_prepareWorkPackage: function(queue, sourceName) {
			queue.enqueue(function(context) {
				envianceSdk.packages.copyPackage(
					{ name: context._prepareWorkPackageName(sourceName) },
					sourceName != null ? sourceName : context.basePackageName,
					function(response) {
						context.workPackageId = response.result;
						queue.executeNext();
					},
					context._errorHandler);
			});
		},

		_deleteWorkPackage: function(packageName) {
			stop();
			envianceSdk.packages.updatePackage(packageName, { name: packageName, isLocked: false },
				function() {
					envianceSdk.packages.deletePackage(packageName,
						function() { start(); },
						function() { start(); });
				},
				function() {
					start();
				});
		},

		_initUserTimeZone: function(queue) {
			queue.enqueue(function(context) {
				envianceSdk.authentication.getCurrentSession(
						function(response) {
							context.tz = response.result.userTimeZone;
							queue.executeNext();
						}, context.errorHandler);
			});
		}
	});
	
	asyncTest("Create package - Happy path - use manifest.package.ID", 7, function () {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function (context) {
			var packageCreationInfo = {
				name: context.idTest1PackageName,
				description: context.idTest1PackageName + " description",
				isLocked: "false",
				content: context.idTest1PackageContent
			};
			envianceSdk.packages.createPackage(packageCreationInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Package created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.packages.getPackage(context.idTest1PackageName,
				function (response) {
					var packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded by Name");
					equal(packageGetInfo.name, context.idTest1PackageName, "= Name matches");
					equal(packageGetInfo.id, context.idTest1PackageId, "= ID matches");

					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.packages.getPackage(context.idTest1PackageId,
				function (response) {
					var packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded by ID");
					equal(packageGetInfo.name, context.idTest1PackageName, "= Name matches");
					equal(packageGetInfo.id, context.idTest1PackageId, "= ID matches");

					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);

	});


	asyncTest("Create package - Fault if manifest.package.ID is not Guid", 1, function () {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		queue.enqueue(function (context) {
			envianceSdk.packages.createPackage({ name: context.idTest1PackageName, content: 'UEsDBBQAAgAIAMFRkkMOdAC5XQAAAJAAAAAKAAAAaW5kZXguaHRtbAtJLS5RCEhMzk5MT1Uw5OXi5SrJyCzWy0wJAUoYQiU8UxRsFZSSTE0NTBINLHUTjS0MdE1MTBN1k5KNDXUNLFIMTSxNkgxTLE2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACADAZZJD8yuMs28AAACAAAAADAAAAG1hbmlmZXN0LnhtbEXM0QmDMBAA0P+CO4T7117wAgaMrtAVLl6woUmUWordvhUKDvBeP+45qXd4bnEpDnSDMA7VpV95evAcVOEcHHhjkBgttx0SGfZTq7ETTZa8FmtASdzWxJ/bzziIRcLe3F85gYpy8vrwcPTX/z98AVBLAQIUABQAAgAIAMFRkkMOdAC5XQAAAJAAAAAKAAAAAAAAAAEAIAAAAAAAAABpbmRleC5odG1sUEsBAhQAFAACAAgAwGWSQ/MrjLNvAAAAgAAAAAwAAAAAAAAAAQAgAAAAhQAAAG1hbmlmZXN0LnhtbFBLBQYAAAAAAgACAHIAAAAeAQAAAAA=' },
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Create package - Fault if package with ID exists same as specified  for manifest.package.ID", 2, function () {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function (context) {
			var packageCreationInfo = {
				name: context.idTest2PackageName,
				description: context.idTest2PackageName + " description",
				isLocked: "false",
				content: context.idTest2PackageContent
			};
			envianceSdk.packages.createPackage(packageCreationInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Initial package created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.packages.createPackage({ name: context.idTest2PackageName, content: context.idTest2PackageContent },
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 500, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

    asyncTest("Create/Update package - Happy path - test default IsRoutingEnabled, Update to opposite", 12, function () {
        var queue = new ActionQueue(this);

        this._authenticate(queue, this.accessUserName);

        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'a4c5e42bbb7c456abdb278a9be0b6379',
                content: 'UEsDBBQAAgAIAFBSMUQa9RwocgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUDHm5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZQSTZJNU02MknSTksyTdU1MzRJ1k1KSjHTNLRItk1INksyMzS2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACABWUjFEpYn0e3gAAACXAAAADAAAAG1hbmlmZXN0LnhtbLOxr8jNUShLLSrOzM+zVTLUM1Cyt+PlsilITM5OTE9VyEvMTbVVSjRJNk01MUpKSjJPNjE1S0xKSTIyt0i0TEo1SDIzNrdUUkjJLC7ISawMAOqxVcrMS0mt0Msoyc1RUshMQWjXBenXBRmgCzJBF8UIkK36UGvtAFBLAQIUABQAAgAIAFBSMUQa9RwocgAAAKIAAAAKAAAAAAAAAAEAIAAAAAAAAABpbmRleC5odG1sUEsBAhQAFAACAAgAVlIxRKWJ9Ht4AAAAlwAAAAwAAAAAAAAAAQAgAAAAmgAAAG1hbmlmZXN0LnhtbFBLBQYAAAAAAgACAHIAAAA8AQAAAAA='
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                function (response) {
                    equal(response.metadata.statusCode, 201, "Package created with no <routes/> in manifest");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage1Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, false, "= IsRoutingEnabled is False");
                    queue.executeNext();
                },
                context._errorHandler);
        });

        queue.enqueue(function (context) {
            var packageUpdateInfo = {
                content: 'UEsDBBQAAgAIAFBSMUQa9RwocgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUDHm5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZQSTZJNU02MknSTksyTdU1MzRJ1k1KSjHTNLRItk1INksyMzS2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACACLUzFElBg+g4kAAACyAAAADAAAAG1hbmlmZXN0LnhtbFXOWwrCMBCF4XfBPYR5T1trr9DLFtzCTDNoMElLk0rdvQ0I4vPw/We6cbdGvHj1enY9XJIMxuF86hacnnhn4dByD1hMJRc5EdVTUVZIivK6wZY4o+patyCU9ovB9+0wPWineE8ewRoQWv24jF7GgIwF+ZeIq+u8BfaCHZLhA4Z1YxBpPKXfj4YPUEsBAhQAFAACAAgAUFIxRBr1HChyAAAAogAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACACLUzFElBg+g4kAAACyAAAADAAAAAAAAAABACAAAACaAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAAE0BAAAAAA=='
            };
            envianceSdk.packages.updatePackage(context.routesEnabledPackage1Id, packageUpdateInfo,
                function (response) {
                    equal(response.metadata.statusCode, 204, "Package modified using <routes enabled=\"true\" ");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage1Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, true, "= Changed to True");
                    queue.executeNext();
                },
                context._errorHandler);
        });

        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'ee1f599a3a1441e4882ea8cd30426083',
                content: 'UEsDBBQAAgAIAGxSMUQJbgqscgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZRSUw3TTC0tE3WNEw1NdE0MU010LSyMUnUTLZJTjA1MjMwMLIyVrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACABxUjFES3cnnnoAAACnAAAADAAAAG1hbmlmZXN0LnhtbLOxr8jNUShLLSrOzM+zVTLUM1Cyt+PlsilITM5OTE9VyEvMTbVVSk01TDO1tEzUNU40NNE1MUw10bWwMErVTbRITjE2MDEyM7AwVlJIySwuyEmsDADqs1XKzEtJrdDLKMnNUVLITCHSCJDNRfmlJanFCvogtj7UGXYAUEsBAhQAFAACAAgAbFIxRAluCqxyAAAAogAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACABxUjFES3cnnnoAAACnAAAADAAAAAAAAAABACAAAACaAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAAD4BAAAAAA=='
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                function (response) {
                    equal(response.metadata.statusCode, 201, "Package created with <routes/> in manifest");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage2Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, true, "= IsRoutingEnabled is True");

                    queue.executeNext();
                },
                context._errorHandler);
        });

        queue.enqueue(function (context) {
            var packageUpdateInfo = {
                content: 'UEsDBBQAAgAIAGxSMUQJbgqscgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZRSUw3TTC0tE3WNEw1NdE0MU010LSyMUnUTLZJTjA1MjMwMLIyVrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACABXaDFEhHPeZIIAAAC2AAAADAAAAG1hbmlmZXN0LnhtbI2OQQ6CMBBF9ybeoZl9oaXVlITCFbzCSAdtbAuhYPD2QuIBXL+893/TbTGwN83Zj8mCLAR07fnUTNi/8EEsYSQLRHK41DVyhVJzLUlzYyriaHqnhK6uwihgzucp4Oe2exZ8crQVzyUGYN79mTiW53FdKDNKeA+0iwOGTFAeqPy9ar9QSwECFAAUAAIACABsUjFECW4KrHIAAACiAAAACgAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtbFBLAQIUABQAAgAIAFdoMUSEc95kggAAALYAAAAMAAAAAAAAAAEAIAAAAJoAAABtYW5pZmVzdC54bWxQSwUGAAAAAAIAAgByAAAARgEAAAAA'
            };
            envianceSdk.packages.updatePackage(context.routesEnabledPackage2Id, packageUpdateInfo,
                function (response) {
                    equal(response.metadata.statusCode, 204, "Package modified using <routes enabled=\"False\" ");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage2Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, false, "= Changed to False");

                    queue.executeNext();
                },
                context._errorHandler);
        });


        this._start(queue);

    });

    asyncTest("Create/Update package - Happy path - test default IsRoutingEnabled, on Update not changed", 18, function () {
        var queue = new ActionQueue(this);

        this._authenticate(queue, this.accessUserName);

        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'c647338d43d54a058cf8e80a30be1a8f',
                content: 'UEsDBBQAAgAIAIVSMUSHKxFzcgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZSSzUzMjY0tUnRNjFNMdU0SDUx1LZLTLHRTLQwSjQ2SUg0TLdKUrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACACOUjFEqi5uNIYAAACtAAAADAAAAG1hbmlmZXN0LnhtbFXOQQ6CMBCF4b2Jd2hmXygpaBcUruAVhnbQxrYQCgZvL01MjNtJvv9N2+/BsxctyU1RQ1UI6LvzqZ3RPPFOLGIgDeZSX6VUtpa2qVE0yoyKlEApBqpQjcCsS7PH9+0wGly0tBePNXhgzv44z57nAM8F/pfIq8u0rZQYRRw8HRDKfC2/z3QfUEsBAhQAFAACAAgAhVIxRIcrEXNyAAAAogAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACACOUjFEqi5uNIYAAACtAAAADAAAAAAAAAABACAAAACaAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAAEoBAAAAAA=='
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                function (response) {
                    equal(response.metadata.statusCode, 201, "Package created with <routes enabled=\"\"/> in manifest");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage3Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, true, "= IsRoutingEnabled is True");
                    queue.executeNext();
                },
                context._errorHandler);
        });

        queue.enqueue(function (context) {
            var packageUpdateInfo = {
                content: 'UEsDBBQAAgAIAIVSMUSHKxFzcgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZSSzUzMjY0tUnRNjFNMdU0SDUx1LZLTLHRTLQwSjQ2SUg0TLdKUrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACACwUzFEI3VFnIAAAACjAAAADAAAAG1hbmlmZXN0LnhtbFWOQQ7CIBBF9ybegcyelgaqLEp7Ba8wwlSJQJvSmnp7JTEx7v7mvfe7YY+BPWnJfkoGmkrA0B8P3Yz2gTdiCSMZsCd1llI7JV2rULTajpq0QCmu1KAegTmf54Cvy4cx4JOjvbqvMQDz7ofzwvMi4MXA/xSlukzbSpnVZdffC/0bUEsBAhQAFAACAAgAhVIxRIcrEXNyAAAAogAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACACwUzFEI3VFnIAAAACjAAAADAAAAAAAAAABACAAAACaAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAAEQBAAAAAA=='
            };
            envianceSdk.packages.updatePackage(context.routesEnabledPackage3Id, packageUpdateInfo,
                function (response) {
                    equal(response.metadata.statusCode, 204, "Package modified using <routes /> ");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage3Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, true, "= IsRoutingEnabled Not changed");
                    queue.executeNext();
                },
                context._errorHandler);
        });


        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'df031999ef9042eeb01ddc41921c877b',
                content: 'UEsDBBQAAgAIAKNSMURAt1aocgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZRS0gyMDS0tLXVT0ywNdE2MUlN1kwwMU3RTkk0MLY0Mky3MzZOUrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACACuUjFEgPk7WYoAAACyAAAADAAAAG1hbmlmZXN0LnhtbFXOQQqDMBCF4X2hdwizjyZWsAGju657hcQZ29AkirHF3r4GCqXr4fvftP0WPHvRktwUNchCQN8dD+1shoe5EYsmkAYcxUkqpWhUoq6IrJCIQy1VJYdz01hg6NLszfu6Gw0uIm3FfQ0emMMf59nzHOC5wP8SeXWZnislRtFYTzu8GJ8Iynwqvx91H1BLAQIUABQAAgAIAKNSMURAt1aocgAAAKIAAAAKAAAAAAAAAAEAIAAAAAAAAABpbmRleC5odG1sUEsBAhQAFAACAAgArlIxRID5O1mKAAAAsgAAAAwAAAAAAAAAAQAgAAAAmgAAAG1hbmlmZXN0LnhtbFBLBQYAAAAAAgACAHIAAABOAQAAAAA='
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                function (response) {
                    equal(response.metadata.statusCode, 201, "Package created with <routes enabled=\"False\"/> in manifest");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage4Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, false, "= IsRoutingEnabled is False");
                    queue.executeNext();
                },
                context._errorHandler);
        });

        queue.enqueue(function (context) {
            var packageUpdateInfo = {
                content: 'UEsDBBQAAgAIAKNSMURAt1aocgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZRS0gyMDS0tLXVT0ywNdE2MUlN1kwwMU3RTkk0MLY0Mky3MzZOUrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACAC7UzFEjP2MIHkAAACZAAAADAAAAG1hbmlmZXN0LnhtbFXNQQrCMBBA0b3gHcLsU5NaqANNewWvkGamGkxisSL19iYglB7gv98Nawziw6/FP5MBXSkY+uOhm6172BuLZCMboEmdNSLyhKqpmUeliVyjsdbu0rYjCPLLHOz3mhsDPhGv1f0dAwhPWy5LLwsgiyB3RL7m7+k/7n9QSwECFAAUAAIACACjUjFEQLdWqHIAAACiAAAACgAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtbFBLAQIUABQAAgAIALtTMUSM/YwgeQAAAJkAAAAMAAAAAAAAAAEAIAAAAJoAAABtYW5pZmVzdC54bWxQSwUGAAAAAAIAAgByAAAAPQEAAAAA'
            };
            envianceSdk.packages.updatePackage(context.routesEnabledPackage4Id, packageUpdateInfo,
                function (response) {
                    equal(response.metadata.statusCode, 204, "Package modified without <routes /> ");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage4Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, false, "= IsRoutingEnabled Not changed");
                    queue.executeNext();
                },
                context._errorHandler);
        });


        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'e7d2182192584429aefb9d23de9d4837',
                content: 'UEsDBBQAAgAIANVSMUQX5/jFcgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZRSzVOMDC2MDHUtjUwtdE1MjCx1E1PTknQtU4yMU1ItU0wsjM2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACADbUjFEhO03w4kAAACxAAAADAAAAG1hbmlmZXN0LnhtbFXOTQrCMBCG4b3gHcLs05q00gb6cwWvMHVGDSZpSVupt7cBQVwPz/tN02/eiRfH2Y6hBZWdoO+Oh2bC6xPvLAJ6boEr0qrWyuhzXZbaIN8GQ7ogNlTWRQWC7Dw5fF9204INxFv2WLwDYenHZfIyBWQqyL9EWo3juvAsOODgeIdLXBnydMm/D3UfUEsBAhQAFAACAAgA1VIxRBfn+MVyAAAAogAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACADbUjFEhO03w4kAAACxAAAADAAAAAAAAAABACAAAACaAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAAE0BAAAAAA=='
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                function (response) {
                    equal(response.metadata.statusCode, 201, "Package created with <routes enabled=\"true\"/> in manifest");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage5Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, true, "= IsRoutingEnabled is True");
                    queue.executeNext();
                },
                context._errorHandler);
        });

        queue.enqueue(function (context) {
            var packageUpdateInfo = {
                content: 'UEsDBBQAAgAIANVSMUQX5/jFcgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZRSzVOMDC2MDHUtjUwtdE1MjCx1E1PTknQtU4yMU1ItU0wsjM2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACADKUzFECwBFlXkAAACZAAAADAAAAG1hbmlmZXN0LnhtbFXNQQrCMBBA0b3gHcLsU8000gSa9gpeITqjBpO0WJF6exMQxAP89/txTVG8+LGEKTtQzR7GYbvpZ3+++yuL7BM74I5QGVQWD0ZrtJ4vJ0vYElvSpu1AUFjm6N/H0jgImXhtbs8UQQT65bL2sgKyCvKPKNfy3X3HwwdQSwECFAAUAAIACADVUjFEF+f4xXIAAACiAAAACgAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtbFBLAQIUABQAAgAIAMpTMUQLAEWVeQAAAJkAAAAMAAAAAAAAAAEAIAAAAJoAAABtYW5pZmVzdC54bWxQSwUGAAAAAAIAAgByAAAAPQEAAAAA'
            };
            envianceSdk.packages.updatePackage(context.routesEnabledPackage5Id, packageUpdateInfo,
                function (response) {
                    equal(response.metadata.statusCode, 204, "Package modified with no <routes /> ");
                    queue.executeNext();
                },
                context._errorHandler);
        });
        queue.enqueue(function (context) {
            envianceSdk.packages.getPackage(context.routesEnabledPackage5Id,
                function (response) {
                    var packageGetInfo = response.result;
                    equal(response.metadata.statusCode, 200, "Package loaded by ID");
                    equal(packageGetInfo.isRoutingEnabled, true, "= IsRoutingEnabled Not changed");
                    queue.executeNext();
                },
                context._errorHandler);
        });

        this._start(queue);

    });

    asyncTest("Create package - Fault if incorrect IsRoutingEnabled specified.", 2, function() {
        var queue = new ActionQueue(this);

        this._authenticate(queue, this.accessUserName);

        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'shouldnotexist1',
                content: 'UEsDBBQAAgAIAO5SMURiu5ClcgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZSSjM0TzVNN0nQNTJIMdE1MDFN1Ey1TzHXNjVOTzSzMLE1Sk5KVrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACAD0UjFEn6d4hokAAACwAAAADAAAAG1hbmlmZXN0LnhtbFXOywrCMBCF4b3gO4TZpxcaGgu9vIJLt5Nk1GCSlqZKfHsbEMT18P1n+il5x160RjuHAeqigmk8HvoF9QNvxAJ6GkA1EiWJayVUJURN2BkpG9Ltqe0EKQ3M2Lg4fJ93M4ANhlJx37wDZs2P8+x5DvBc4H+JvLrOz40io4DK0Q4vKUGZD+X3n/EDUEsBAhQAFAACAAgA7lIxRGK7kKVyAAAAogAAAAoAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bWxQSwECFAAUAAIACAD0UjFEn6d4hokAAACwAAAADAAAAAAAAAABACAAAACaAAAAbWFuaWZlc3QueG1sUEsFBgAAAAACAAIAcgAAAE0BAAAAAA=='
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                context._errorHandler,
                function(response) {
                    equal(response.metadata.statusCode, 400, "Status code matches");
                    queue.executeNext();
                });
        });

        queue.enqueue(function (context) {
            var packageCreationInfo = {
                name: 'shouldnotexist1',
                content: 'UEsDBBQAAgAIABNTMUT1KITicgAAAKIAAAAKAAAAaW5kZXguaHRtbAtJLS5R8E3My0wDMTyLg/JLSzLz0l3zEpNyUlMUjHi5eLlKMjKL9TJTQoAqDAMSk7MT01M9UxRsFZSSUo0sEpONTXXNzM3SdE1M05J1Ew3SDHQNUy0sjZMMLRItDFOVrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACAAXUzFE3e3OyIgAAACuAAAADAAAAG1hbmlmZXN0LnhtbFXOQQ6CMBCF4b2Jd2hmX2hFsCYUruAVpjBoQ1sIRYO3lyYmxu0k3/+mbjfv2IuWaKegQWYC2uZ4qGfsRrwTC+hJg6GTwq4oq0s1nMuhQzEISepaGKlQSQLW2zg7fN92o8GGnrbssXoHzPY/zpPnKcBTgf8l0uoyPVeKjAIaRzuUkKdz/v2m+QBQSwECFAAUAAIACAATUzFE9SiE4nIAAACiAAAACgAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtbFBLAQIUABQAAgAIABdTMUTd7c7IiAAAAK4AAAAMAAAAAAAAAAEAIAAAAJoAAABtYW5pZmVzdC54bWxQSwUGAAAAAAIAAgByAAAATAEAAAAA'
            };
            envianceSdk.packages.createPackage(packageCreationInfo,
                context._errorHandler,
                function(response) {
                    equal(response.metadata.statusCode, 400, "Status code matches");
                    queue.executeNext();
                });
        });


        this._start(queue);
    });
	
	asyncTest("Create package - Happy path - User has 'Manage Enviance Apps' rights", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackage(context.packageCreationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Package created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create package - Fault if user has no 'Manage Enviance Apps' rights.", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.noAccessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackage(context.packageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Status code matches");
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Create package - Happy path - Use all properties", 12, function() {
		var queue = new ActionQueue(this);
		var packageId;
		var packageGetInfo;
		var displayPageId;

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackage(context.packageCreationInfo,
				function(response) {
					packageId = response.result;
					equal(response.metadata.statusCode, 201, "Package created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackageItem(packageId, context.displayPageCreationInfo,
				function(response) {
					displayPageId = response.result;
					equal(response.metadata.statusCode, 201, "Display page created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackageItem(packageId, context.iconCreationInfo,
				function(response) {
					context.iconId = response.result;
					equal(response.metadata.statusCode, 201, "Icon created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			var packageUpdateInfo = {
				name: context.packageCreationInfo.name,
				description: context.packageCreationInfo.description,
				displayPage: context.displayPageCreationInfo.path,
				iconSrc: context.iconCreationInfo.path,
				isLocked: context.packageCreationInfo.isLocked
			};

			envianceSdk.packages.updatePackage(packageId, packageUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package modified");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.packageCreationInfo.name,
				function(response) {
					packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.id, packageId, "= Id matches");
					equal(packageGetInfo.name, context.packageCreationInfo.name, "= Name matches");
					equal(packageGetInfo.description, context.packageCreationInfo.description, "= Description matches");
					equal(packageGetInfo.displayPage, context.displayPageCreationInfo.path, "= DisplayPage matches");
					equal(packageGetInfo.iconSrc, context.iconCreationInfo.path, "= Icon matches");
					equal(packageGetInfo.isLocked, false, "= IsLocked matches");
					equal(packageGetInfo.createdBy, context.accessUserFullname, "= Creator matches");

					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create package - Check warnings", 5, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			var packageCreationInfo = jQuery.extend({}, context.packageCreationInfo);
			packageCreationInfo.id = createUUID();
			packageCreationInfo.created = new Date();
			packageCreationInfo.createdBy = createUUID();
			packageCreationInfo.lastModified = new Date();
			envianceSdk.packages.createPackage(packageCreationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Package created");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'created\'") > 0, "Warning for 'created' OK");
					ok(response.metadata.warnings.indexOf("\'createdBy\'") > 0, "Warning for 'createdBy' OK");
					ok(response.metadata.warnings.indexOf("\'lastModified\'") > 0, "Warning for 'lastModified' OK");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create package - Fault if name already exists", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		queue.enqueue(function(context) {
			envianceSdk.packages.createPackage({ name: context.basePackageName },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Create package - Fault if name is invalid", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			var packageCreationInfo = jQuery.extend({ }, context.packageCreationInfo);
			packageCreationInfo.name = new Array(260).join('a');
			envianceSdk.packages.createPackage(packageCreationInfo,
				function(response) {
					context._errorHandler(response);
				},
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			var packageCreationInfo = jQuery.extend({ }, context.packageCreationInfo);
			packageCreationInfo.name = "";
			envianceSdk.packages.createPackage(packageCreationInfo,
				function(response) {
					context.newPackageId = response.result;
					context._errorHandler(response);
				},
				function(response) {
					equal(response.metadata.statusCode, 400, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			var packageCreationInfo = jQuery.extend({ }, context.packageCreationInfo);
			packageCreationInfo.name = "\\/[]";
			envianceSdk.packages.createPackage(packageCreationInfo,
				function(response) {
					context.newPackageId = response.result;
					context._errorHandler(response);
				},
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});
		this._start(queue);
	});

	asyncTest("Create package - Fault if description too long", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			var packageCreationInfo = jQuery.extend({ }, context.packageCreationInfo);
			packageCreationInfo.description = "0123456789";
			for (var i = 0; i < 210; i++) {
				packageCreationInfo.description += "0123456789";
			}
			envianceSdk.packages.createPackage(packageCreationInfo,
				function(response) {
					context.newPackageId = response.result;
					context._errorHandler(response);
				},
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Create package - Fault if 'isLocked' is true", 3, function() {
		var queue = new ActionQueue(this);
		var packageGetInfo;

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			var packageCreationInfo = jQuery.extend({ }, context.packageCreationInfo);
			packageCreationInfo.isLocked = true;
			envianceSdk.packages.createPackage(packageCreationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Package created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.packageCreationInfo.name,
				function(response) {
					packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.isLocked, true, "= IsLocked matches");

					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create package - Happy path - Copy content from another package", 2, function() {
		var queue = new ActionQueue(this);
		var packageId;

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.copyPackage({ name: context._prepareWorkPackageName() },
				context.basePackageName,
				function(response) {
					packageId = response.result;
					equal(response.metadata.statusCode, 201, "Package created");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackage(packageId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package deleted");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Create package - Fault if package to copy from does not exist", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.copyPackage({ name: context._prepareWorkPackageName() }, envianceSdk.getSessionId(),
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});
	
	asyncTest("Get package - Happy path - User has 'Manage Enviance Apps' right", 16, function() {
		var queue = new ActionQueue(this);
		var packageGetInfo;
		var packageId;

		this._authenticate(queue, this.accessUserName);
		this._initUserTimeZone(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.basePackageName,
				function(response) {
					packageGetInfo = response.result;
					packageId = packageGetInfo.id;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.name, context.basePackageName, "= Name matches");
					equal(packageGetInfo.description, context.basePackageName + " - description", "= Description matches");
					equal(packageGetInfo.displayPage, "/index.html", "= DisplayPage matches");
					equal(packageGetInfo.iconSrc, "/icon.ico", "= Icon matches");
					equal(packageGetInfo.isLocked, false, "= IsLocked matches");
					notEqual(packageGetInfo.createdBy, "", "= Creator not empty");

					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(packageId,
				function(response) {
					packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.id, packageId, "= Id matches");
					equal(packageGetInfo.name, context.basePackageName, "= Name matches");
					equal(packageGetInfo.description, context.basePackageName + " - description", "= Description matches");
					equal(packageGetInfo.displayPage, "/index.html", "= DisplayPage matches");
					equal(packageGetInfo.iconSrc, "/icon.ico", "= Icon matches");
					equal(packageGetInfo.isLocked, false, "= IsLocked matches");
					deepEqual(packageGetInfo.created, toLocalTime(context.basePackageCreated, context.tz), "= Created matches");
					notEqual(packageGetInfo.createdBy, "", "= Creator not empty");

					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Get/Update/Delete package - Fault if user does not have 'Manage Enviance Apps' right", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		this._authenticate(queue, this.noAccessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.workPackageId,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			var packageUpdateInfo = {
				name: context._prepareWorkPackageName() + " (Modified)"
			};

			envianceSdk.packages.updatePackage(context.workPackageId, packageUpdateInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackage(context.workPackageId,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get package - Fault if use bad ID or name", 2, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(envianceSdk.getSessionId(),
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage("[Incorrect Name]",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package - Happy path - Use ID", 8, function() {
		var queue = new ActionQueue(this);
		var packageGetInfo;
		var packageUpdateInfo = {
			name: this._prepareWorkPackageName() + " (Modified)",
			description: this._prepareWorkPackageName() + " - description (Modified)",
			displayPage: "/index.html",
			iconSrc: "/icon.ico",
			isLocked: false
		};

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, packageUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package modified. ");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.workPackageId,
				function(response) {
					packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.id, context.workPackageId, "= Id matches");
					equal(packageGetInfo.name, packageUpdateInfo.name, "= Name matches");
					equal(packageGetInfo.description, packageUpdateInfo.description, "= Description matches");
					equal(packageGetInfo.displayPage, packageUpdateInfo.displayPage, "= DisplayPage matches");
					equal(packageGetInfo.iconSrc, packageUpdateInfo.iconSrc, "= Icon matches");
					equal(packageGetInfo.isLocked, false, "= IsLocked matches");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Update package - Check warnings", 5, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			var packageUpdateInfo =
				{
					id: createUUID(),
					name: context._prepareWorkPackageName() + " (Modified)",
					description: context._prepareWorkPackageName() + " - description (Modified)",
					displayPage: "index.html",
					iconSrc: "icon.ico",
					isLocked: false,
					created: new Date(),
					createdBy: createUUID(),
					lastModified: new Date()
				};
			envianceSdk.packages.updatePackage(context.workPackageId, packageUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package modified. ");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'created\'") > 0, "Warning for 'created' OK");
					ok(response.metadata.warnings.indexOf("\'createdBy\'") > 0, "Warning for 'createdBy' OK");
					ok(response.metadata.warnings.indexOf("\'lastModified\'") > 0, "Warning for 'lastModified' OK");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update package - Happy path - Name is valid", 9, function() {
		var queue = new ActionQueue(this);
		var packageGetInfo;
		var packageUpdateInfo = {
			name: this._prepareWorkPackageName() + " (Modified)",
			description: this._prepareWorkPackageName() + " (Modified) - description",
			displayPage: "/page.html",
			iconSrc: "/icon.ico",
			isLocked: false
		};

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context._prepareWorkPackageName(), packageUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package modified. ");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(packageUpdateInfo.name,
				function(response) {
					packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.id, context.workPackageId, "= Id matches");
					equal(packageGetInfo.name, packageUpdateInfo.name, "= Name matches");
					equal(packageGetInfo.description, packageUpdateInfo.description, "= Description matches");
					equal(packageGetInfo.displayPage, packageUpdateInfo.displayPage, "= DisplayPage matches");
					equal(packageGetInfo.iconSrc, packageUpdateInfo.iconSrc, "= Icon matches");
					equal(packageGetInfo.isLocked, false, "= IsLocked matches");
					queue.executeNext();
				},
				context._errorHandler);
		});
		

		queue.enqueue(function (context) {
			packageUpdateInfo = packageGetInfo;
			packageUpdateInfo.name = null;
			envianceSdk.packages.updatePackage(packageUpdateInfo.id, packageUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Package modified ignoring null Name. ");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Update package - Happy path - Use packageInfo.manifest.ID", 8, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		var packageUpdateInfo;
		queue.enqueue(function (context) {
			packageUpdateInfo = {
				name: context.idTest3PackageName,
				description: context.idTest3PackageName + " description",
				isLocked: "false",
				content: context.idTest3PackageContent
			};
			envianceSdk.packages.createPackage(packageUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 201, "Initial Package created");
					queue.executeNext();
				},
				context._errorHandler);
		});


		queue.enqueue(function (context) {
			packageUpdateInfo = {
				description: context.idTest3PackageName + " description (Modified)"
			};
			envianceSdk.packages.updatePackage(context.idTest3PackageId, packageUpdateInfo,
				function (response) {
					equal(response.metadata.statusCode, 204, "Package modified. ");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function (context) {
			envianceSdk.packages.getPackage(context.idTest3PackageId,
				function (response) {
					var packageGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(packageGetInfo.id, context.idTest3PackageId, "= Id matches");
					equal(packageGetInfo.name, context.idTest3PackageName, "= Name matches");
					equal(packageGetInfo.description, packageUpdateInfo.description, "= Description matches");
					equal(packageGetInfo.iconSrc, packageUpdateInfo.iconSrc, "= Icon matches");
					equal(packageGetInfo.isLocked, false, "= IsLocked matches");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update package - Fault if manifest.package.ID is not Guid value", 1, function () {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function (context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { name: context.idTest1PackageName, content: 'UEsDBBQAAgAIAMFRkkMOdAC5XQAAAJAAAAAKAAAAaW5kZXguaHRtbAtJLS5RCEhMzk5MT1Uw5OXi5SrJyCzWy0wJAUoYQiU8UxRsFZSSTE0NTBINLHUTjS0MdE1MTBN1k5KNDXUNLFIMTSxNkgxTLE2VrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACADAZZJD8yuMs28AAACAAAAADAAAAG1hbmlmZXN0LnhtbEXM0QmDMBAA0P+CO4T7117wAgaMrtAVLl6woUmUWordvhUKDvBeP+45qXd4bnEpDnSDMA7VpV95evAcVOEcHHhjkBgttx0SGfZTq7ETTZa8FmtASdzWxJ/bzziIRcLe3F85gYpy8vrwcPTX/z98AVBLAQIUABQAAgAIAMFRkkMOdAC5XQAAAJAAAAAKAAAAAAAAAAEAIAAAAAAAAABpbmRleC5odG1sUEsBAhQAFAACAAgAwGWSQ/MrjLNvAAAAgAAAAAwAAAAAAAAAAQAgAAAAhQAAAG1hbmlmZXN0LnhtbFBLBQYAAAAAAgACAHIAAAAeAQAAAAA=' },
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});


	asyncTest("Update package - Fault if specified manifest.package.ID differs", 1, function () {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function (context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { description: "Update package - Fault if package ID differs or Not Existent)", content: "UEsDBBQAAgAIAIZrkkNMnyq3XQAAAJAAAAAKAAAAaW5kZXguaHRtbAtJLS5RCEhMzk5MT1Uw5uXi5SrJyCzWy0wJAUoYQyU8UxRsFZRSUywt0yyNknQtU0zNdU0M00x0ExOTDXTNkywMkpOT0xLNDcyUrLEa4JeYm4psBMgEkAEg/ajaAVBLAwQUAAIACACDa5JDghBHGngAAACXAAAADAAAAG1hbmlmZXN0LnhtbLOxr8jNUShLLSrOzM+zVTLUM1Cyt+PlsilITM5OTE9VyEvMTbVVSk2xtEyzNEqyTDE1NzFMM0lMTDYwT7IwSE5OTks0NzBTUkjJLC7ISawMAOqxVcrMS0mt0Msoyc1RUshMQWjXBenXBRmgCzJBF8UIkK36UGvtAFBLAQIUABQAAgAIAIZrkkNMnyq3XQAAAJAAAAAKAAAAAAAAAAEAIAAAAAAAAABpbmRleC5odG1sUEsBAhQAFAACAAgAg2uSQ4IQRxp4AAAAlwAAAAwAAAAAAAAAAQAgAAAAhQAAAG1hbmlmZXN0LnhtbFBLBQYAAAAAAgACAHIAAAAnAQAAAAA=" },
				context._errorHandler,
				function (response) {
					equal(response.metadata.statusCode, 400, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package - 'displayPage' in packageInfo differs from manifest", 4, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		var packageUpdateInfo = new envianceSdk.packages.PackageInfo(
			"NewName", null,
			"UEsDBBQAAgAIADBuOUPwX7uFIAAAADQAAAAJAAAAaW5kZXguaHRte797v01GSW6OHS+XTUZqYgqI1ocxkvJTKsECcAZYKQBQSwMEFAACAAgAuZg+Q4HQhDJeAAAAagAAAAwAAABtYW5pZmVzdC54bWx7v3u/jX1Fbo5CWWpRcWZ+nq2SoZ6Bkr0dL5dNQWJydmJ6qkJeYm6qrZJLZnFBTmKlQgFIKK0oP1chNzEvMy21uERJIQUiFwCUslXKzEtJrTDUyyjJVQKZog81xg4AUEsDBBQAAgAIADBuOUPwX7uFIAAAADQAAAAKAAAAaW5kZXgxLmh0bXu/e79NRklujh0vl01GamIKiNaHMZLyUyrBAnAGWCkAUEsBAhQAFAACAAgAMG45Q/Bfu4UgAAAANAAAAAkAAAAAAAAAAQAgAAAAAAAAAGluZGV4Lmh0bVBLAQIUABQAAgAIALmYPkOB0IQyXgAAAGoAAAAMAAAAAAAAAAEAIAAAAEcAAABtYW5pZmVzdC54bWxQSwECFAAUAAIACAAwbjlD8F+7hSAAAAA0AAAACgAAAAAAAAABACAAAADPAAAAaW5kZXgxLmh0bVBLBQYAAAAAAwADAKkAAAAXAQAAAAA=",
			"/index.htm");

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, packageUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package updated.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(packageUpdateInfo.name,
				function(response) {
					var expected = packageUpdateInfo;
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(actual.name, expected.name, "= Name matches");
					equal(actual.displayPage, "/index1.htm", "= DisplayPage matches");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update package - 'iconSrc' in packageInfo differs from manifest", 4, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		var packageUpdateInfo = new envianceSdk.packages.PackageInfo(
			"NewName", null,
			"UEsDBBQAAgAIADBuOUPwX7uFIAAAADQAAAAJAAAAaW5kZXguaHRte797v01GSW6OHS+XTUZqYgqI1ocxkvJTKsECcAZYKQBQSwMEFAACAAgAOlZBQxBKh/JwAAAAfQAAAAwAAABtYW5pZmVzdC54bWx7v3u/jX1Fbo5CWWpRcWZ+nq2SoZ6Bkr0dL5dNQWJydmJ6qkJeYm6qrZJLZnFBTmKlQgFIKK0oP1chNzEvMy21uERJIQUiFwCUslXKzEtJrdDLKMlVUshMzs8LLkq2VUrKAZqlV5CXrgQyWB9qsh0AUEsDBBQAAgAIABlWQUNC04vFbwAAAHoAAAAJAAAAYmxhY2sucG5n6wzwc+flkuJiYGDg9fRwCQLSfEDMw8EEJO8+ku4FUozFQe5ODOvOybwEcljSHX0dGRg29nP/SWQF8jkLPCKLgZoOgzDj8fwVKUBBfk8XxxCN4GQJVmUZAwMGBiYWBsbPrez1QCkGT1c/l3VOCU0AUEsDBBQAAgAIABNWQUPu6ByGdAAAAH4AAAAJAAAAd2hpdGUucG5n6wzwc+flkuJiYGDg9fRwCQLSfEDMw8EEJO8+ku4FUozFQe5ODOvOybwEcljSHX0dGRg29nP/SWQF8jkLPCKLgZoOgzDj8fwVKUBBYU8XxxCN4OQf/iYSoVY6U//952cQ3vVNQuGA0megNIOnq5/LOqeEJgBQSwECFAAUAAIACAAwbjlD8F+7hSAAAAA0AAAACQAAAAAAAAABACAAAAAAAAAAaW5kZXguaHRtUEsBAhQAFAACAAgAOlZBQxBKh/JwAAAAfQAAAAwAAAAAAAAAAQAgAAAARwAAAG1hbmlmZXN0LnhtbFBLAQIUABQAAgAIABlWQUNC04vFbwAAAHoAAAAJAAAAAAAAAAAAIAAAAOEAAABibGFjay5wbmdQSwECFAAUAAIACAATVkFD7ugchnQAAAB+AAAACQAAAAAAAAAAACAAAAB3AQAAd2hpdGUucG5nUEsFBgAAAAAEAAQA3wAAABICAAAAAA==",
			null, "/white.png");

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, packageUpdateInfo,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package updated.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(packageUpdateInfo.name,
				function(response) {
					var expected = packageUpdateInfo;
					var actual = response.result;
					equal(response.metadata.statusCode, 200, "Package loaded");
					equal(actual.name, expected.name, "= 'name' matches");
					equal(actual.iconSrc, "/black.png", "= 'iconSrc' matches");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update package - Fault if 'name' is invalid", 1, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { name: "\\/[]" },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package - Fault if 'displayPage' is invalid", 2, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { name: context.basePackageName, displayPage: "InvalidPage" },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { name: context.basePackageName, displayPage: "icon.ico" },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package - Fault if locked", 1, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.lockedPackageName, { name: "NewName" },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package - Fault if content contains not allowed Base64 chars", 1, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { name: "NewName", content: "UEsDBBQABgAIAAAA-" },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package - Fault if content is not ZIP file", 1, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackage(context.workPackageId, { name: "NewName", content: "YXNkZmc=" },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Package NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Delete package - Happy path - Use ID", 1, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackage(context.workPackageId,
				function(response) {
					equal(response.metadata.statusCode, 204, "Package deleted.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Delete package - Happy path - Use valid name", 1, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackage(context._prepareWorkPackageName(),
				function(response) {
					equal(response.metadata.statusCode, 204, "Package deleted.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Delete package - Fault if using invalid ID or name", 2, function() {
		var queue = new ActionQueue(this);
		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackage(envianceSdk.getSessionId(),
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackage("Invalid Name",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package NOT deleted." + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Create/Copy package item - Fault if user does not have 'Manage Enviance Apps' rights.", 2, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		this._authenticate(queue, this.noAccessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackageItem(context.workPackageId, context.newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.copyPackageItem(context.workPackageId, context.newPageCreationInfo, "page.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});
	
	asyncTest("Create/Copy package item - Check warnings", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			
			envianceSdk.packages.createPackageItem(context.workPackageId, context.newPageCreationInfo,
				function(response) {
					equal(response.metadata.statusCode, 201, "Package Item created.");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'type\'") > 0, "Warning for 'type' OK");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});
	
	asyncTest("Create/Copy package item - Fault if path is invalid", 8, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		var newPageCreationInfo = jQuery.extend({ }, this.newPageCreationInfo);

		queue.enqueue(function(context) {
			newPageCreationInfo.path = "%+#";
			envianceSdk.packages.createPackageItem(context.workPackageId, newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = null;
			envianceSdk.packages.createPackageItem(context.workPackageId, newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = "";
			envianceSdk.packages.createPackageItem(context.workPackageId, newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = " invalid.path ";
			envianceSdk.packages.createPackageItem(context.workPackageId, newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = "%+#";
			envianceSdk.packages.copyPackageItem(context.workPackageId, newPageCreationInfo, "page.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = null;
			envianceSdk.packages.copyPackageItem(context.workPackageId, newPageCreationInfo, "page.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = "";
			envianceSdk.packages.copyPackageItem(context.workPackageId, newPageCreationInfo, "page.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			newPageCreationInfo.path = " invalid.path ";
			envianceSdk.packages.copyPackageItem(context.workPackageId, newPageCreationInfo, "page.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Copy package item - Fault if 'copyFrom' is invalid", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.copyPackageItem(context.workPackageId, context.newPageCreationInfo, envianceSdk.getSessionId(),
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Create package item - Fault if 'packageId' is invalid", 2, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackageItem(envianceSdk.getSessionId(), context.newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.createPackageItem("[InvalidPackage]", context.newPageCreationInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT created. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get/Update/Delete package item - Fault if user does not have 'Manage Enviance Apps' right", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		this._authenticate(queue, this.noAccessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageItem(context.workPackageId, "index.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			var packageItemUpdateInfo = jQuery.extend({ }, context.displayPageCreationInfo);
			packageItemUpdateInfo.path = "modified/" + packageItemUpdateInfo.path;

			envianceSdk.packages.updatePackageItem(context.workPackageId, "index.html", packageItemUpdateInfo,
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT modified. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageItem(context.workPackageId, "index.html",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get package item - Fault if ID or path are invalid", 2, function() {
		var queue = new ActionQueue(this);
		var packageId;

		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.basePackageName,
				function(response) {
					packageId = response.result.id;
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageItem(packageId, envianceSdk.getSessionId(),
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageItem(packageId, "invalidpath",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get package item - Use valid ID or path", 9, function() {
		var queue = new ActionQueue(this);
		var packageId;
		var displayPageId;
		this._authenticate(queue, this.accessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackage(context.basePackageName,
				function(response) {
					packageId = response.result.id;
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageItem(context.basePackageName, "index.html",
				function(response) {
					var packageItemGetInfo = response.result;
					displayPageId = packageItemGetInfo.id;
					equal(response.metadata.statusCode, 200, "Package Item loaded by path");
					equal(packageItemGetInfo.path, "/index.html", "= Path matches");
					equal(packageItemGetInfo.type, context.displayPageCreationInfo.type, "= Type matches");
					notEqual(packageItemGetInfo.content, null, "= Content not empty");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageItem(packageId, displayPageId,
				function(response) {
					var packageItemGetInfo = response.result;
					equal(response.metadata.statusCode, 200, "Package Item loaded by Id");
					equal(packageItemGetInfo.id, displayPageId, "= Id matches");
					equal(packageItemGetInfo.path, "/index.html", "= Path matches");
					equal(packageItemGetInfo.type, context.displayPageCreationInfo.type, "= Type matches");
					notEqual(packageItemGetInfo.content, null, "= Content not empty");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Delete package item - Fault if ID or path are invalid", 2, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageItem(context.workPackageId, envianceSdk.getSessionId(),
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageItem(context.workPackageId, "invalidpath",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Update package item - Happy path", 2, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackageItem(context.workPackageId, "index.html",
				{ path: "modified/index.html", content: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" },
				function(response) {
					equal(response.metadata.statusCode, 204, "Package Item modified");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackageItem(context._prepareWorkPackageName(), "modified/index.html",
				{ path: "index.html", content: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" },
				function(response) {
					equal(response.metadata.statusCode, 204, "Package Item modified");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update package item - Check warnings", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackageItem(context.workPackageId, "index.html",
				{
					id: createUUID(),
					path: "modified/index.html", 
					type: "Page",
					content: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
				},
				function(response) {
					equal(response.metadata.statusCode, 204, "Package Item modified");
					ok(response.metadata.warnings.indexOf("\'id\'") > 0, "Warning for 'id' OK");
					ok(response.metadata.warnings.indexOf("\'type\'") > 0, "Warning for 'type' OK");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Update package item - Fault if information is invalid", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.updatePackageItem(context.workPackageId, "index.html",
				{ path: "#+%modified/index.html", content: null },
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Package Item NOT modified: " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get/Set/Delete package data - Fault if no system right 'Manage Enviance Apps'", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		this._authenticate(queue, this.noAccessUserName);

		queue.enqueue(function(context) {
			envianceSdk.packages.savePackageAppData(context.workPackageId, "Data/Key", "Modified",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Data NOT saved. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageAppData(context.workPackageId, "Data/Key",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Data NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageAppData(context.workPackageId, "Data/Key",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Data NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get/Set/Delete package data - Happy path", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.savePackageAppData(context.workPackageId, "Data/KeyNew", "New Data",
				function(response) {
					equal(response.metadata.statusCode, 204, "Data saved.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageAppData(context.workPackageId, "Data/KeyNew",
				function(response) {
					equal(response.metadata.statusCode, 200, "Data loaded.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageAppData(context.workPackageId, "Data/KeyNew",
				function(response) {
					equal(response.metadata.statusCode, 204, "Data deleted.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		this._start(queue);
	});

	asyncTest("Get/Set/Delete package data - Happy path - Case sensitive Keys", 7, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageAppData(context.workPackageId, "data/key-1",
				function(response) {
					equal(response.metadata.statusCode, 200, "Data loaded.");
					equal(response.result, "Value 1", "= Value matches.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.savePackageAppData(context.workPackageId, "data/key-1", "New Data",
				function(response) {
					equal(response.metadata.statusCode, 204, "Data saved.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageAppData(context.workPackageId, "data/keY-1",
				function(response) {
					equal(response.metadata.statusCode, 200, "Data loaded.");
					equal(response.result, "New Data", "= Value matches.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageAppData(context.workPackageId, "Data/Key-1",
				function(response) {
					equal(response.metadata.statusCode, 204, "Data deleted.");
					queue.executeNext();
				},
				context._errorHandler);
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageAppData(context.workPackageId, "DATA/KEY-1",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 500, "Data NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get/Set/Delete package data - Fault if empty Key values", 6, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		throws(function() {
			envianceSdk.packages.getPackageAppData(this.workPackageId, "",
				this._errorHandler,
				this._errorHandler);
		}, "The key <> argument is not a string or is empty.");

		throws(function() {
			envianceSdk.packages.savePackageAppData(this.workPackageId, "", "New Data",
				this._errorHandler,
				this._errorHandler);
		}, "The key <> argument is not a string or is empty.");

		throws(function() {
			envianceSdk.packages.deletePackageAppData(this.workPackageId, "",
				this._errorHandler,
				this._errorHandler);
		}, "The key <> argument is not a string or is empty.");

		queue.enqueue(function(context) {
			envianceSdk.packages.getPackageAppData(context.workPackageId, " ",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Data NOT loaded. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.savePackageAppData(context.workPackageId, " ", "New Data",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Data NOT saved. " + response.error.message);
					queue.executeNext();
				});
		});

		queue.enqueue(function(context) {
			envianceSdk.packages.deletePackageAppData(context.workPackageId, " ",
				context._errorHandler,
				function(response) {
					equal(response.metadata.statusCode, 400, "Data NOT deleted. " + response.error.message);
					queue.executeNext();
				});
		});

		this._start(queue);
	});

	asyncTest("Get/Set/Delete package data - Fault if special characters in Key", 3, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		throws(function() {
			envianceSdk.packages.savePackageAppData(this.workPackageId, "#%*&?\\|", "New Data",
				this._errorHandler,
				this._errorHandler);
		}, "The key argument contains illegal characters.");

		throws(function() {
			envianceSdk.packages.getPackageAppData(this.workPackageId, "#%*&?\\|",
				this._errorHandler,
				this._errorHandler);
		}, "The key argument contains illegal characters.");

		throws(function() {
			envianceSdk.packages.deletePackageAppData(this.workPackageId, "#%*&?\\|",
				this._errorHandler,
				this._errorHandler);
		}, "The key argument contains illegal characters.");

		this._start(queue);
	});

	asyncTest("Set package data - Fault if long key", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		throws(function() {
			envianceSdk.packages.savePackageAppData(this.workPackageId, new Array(102).join('a'), "New Data",
				this._errorHandler,
				this._errorHandler);
		}, "The key length > 100 characters.");

		this._start(queue);
	});

	asyncTest("Set package data - Fault if key starts with '/' character", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		throws(function() {
			envianceSdk.packages.savePackageAppData(this.workPackageId, "/Manual/Key11", "New Data",
				this._errorHandler,
				this._errorHandler);
		}, "The key starts with '/' character");

		this._start(queue);
	});

	asyncTest("Set package data - Fault if key is not string", 1, function() {
		var queue = new ActionQueue(this);

		this._authenticate(queue, this.accessUserName);
		this._prepareWorkPackage(queue);

		throws(function() {
			envianceSdk.packages.savePackageAppData(this.workPackageId, 100, "New Data",
				this._errorHandler,
				this._errorHandler);
		}, "The key is NOT a string");

		this._start(queue);
	});
}

if (typeof (UnitTestsApplication) == "undefined") {
	executePackageServiceTests();
}