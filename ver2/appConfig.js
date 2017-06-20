function getAppConfig(){
	return {
		options: {
			// redefine for local virtual folder or custom domain name:
			// packageWebPath, packageId, baseAddress [, webAppVirtualPath]
			init : { // configure with sdk options on init
				webAppVirtualPath: "http://jalapeno-sr1.dev.enviance.kiev.ua",   /* for custom domain name, for ex.: http://jstests.com.ua
					also add next section to App web.config
					<configuration>
						...
						<system.webServer>
							...
							<httpProtocol>
								<customHeaders>
									<add name="Access-Control-Allow-Origin" value="http://jstests.com.ua" />
								</customHeaders>
							</httpProtocol>
						</system.webServer>
					</configuration>
				*/
				packageWebPath: "/CustomApp/8ebdc552-bf1b-4744-8ac7-a8e7c571095c/" 
			},
			config: { // configure when init is completed
				packageId: "8ebdc552-bf1b-4744-8ac7-a8e7c571095c",
				baseAddress: "http://jalapeno-sr1-rest.dev.enviance.kiev.ua"
			}
		},
		defaults: {
			accessUserName: "jstestsAccessUser", // jstestsNotAccessUser
			password: "1111",
			noManageRightsUserName: "jstestsWPermissions",
			noAccessUserName: "jstestsNotAccessUser",
			homeSystemName: "System for Tool (Home)"
		},
		moduleDefs: {
			"SDK Infrastructure":	{ path: "../tests.infrastructure.js" },
			"Utilities":			{ path: "../tests.utilities.js" },
			"Eql":					{ path: "../tests.eql.js" },
			"Authentication":		{ path: "../tests.authentication.js", baseSystemOnly: true,
				warning : "This module may conflict with each of other modules\nin parallel mode. It is better to run it standalone.",
				config : {
					mustChangePasswordUser: "jstestsMustChangePasswordUser",
					tempPasswordUser: "jstestsTempPasswordUser",
				}
			},
			"Workflows":			{ path: "../tests.workflows.js",
				config : {
					accessUserId: null,
					deletedUserName: "jstestsDeletedUser",
					expiredUserName: "jstestsExpiredUser",
					noManageRightsUserNameWithOverrides: "jstestsWPermissionsWithOverrides"
				}},
			"Tasks":				{ path: "../tests.tasks.js" },
			"Locations":			{ path: "../tests.locations.js",
				config : {
					userWithPermission: "jstestsUserWithDocumentPermission"
				}},
			"Data Calc Periods":	{ path: "../tests.data.calcperiods.js" },
			"Data":				{ path: "../tests.data.js" },
			"Events": 				{ path: "../tests.events.js" },
			"Commands":			{ path: "../tests.commands.js" },
			"Documents":			{ path: "../tests.documents.js" },
			"Reports":				{ path: "../tests.reports.js" },
			"Package":				{ path: "../tests.package.js" },
			"Messages":			{ path: "../tests.messages.js" },
			"Groups":				{ path: "../tests.groups.js" },
			"Activities":			{ path: "../tests.activities.js",
				config : {
					noManageRightsUserName: "userWPermissionsActivities"
				}},
			"Materials":			{ path: "../tests.materials.js" },
			"Material Groups":		{ path: "../tests.materialGroups.js" },
			"Material Properties":	{ path: "../tests.materialProperties.js",
				config : {
					noManageRightsUserName: "userWPermissionsMatProp"
				}},
			"Material Templates":	{ path: "../tests.materialTemplates.js",
				config : {
					noManageRightsUserName: "userWPermissionsMatTemplate"
				}},
			"Chemicals":			{ path: "../tests.chemicals.js",
				config : {
					noManageRightsUserName: "userWPermissionsChemical"
				}},
			"ChemicalGroups":		{ path: "../tests.chemicalGroups.js",
				config : {
					noManageRightsUserName: "userWPermissionsChemGroup"
				}},
			"ChemicalLists":		{ path: "../tests.chemicalLists.js",
				config : {
					noManageRightsUserName: "userWPermissionsChemGroup"
				}},
			"Tags":				{ path: "../tests.tags.js",
				config : {
					noManageRightsUserName: "userWPermissionsTags"
				}},
			"Tag Schemes":			{ path: "../tests.tagSchemes.js",
				config : {
					noManageRightsUserName: "userWPermissionsTagSchemes"
				}},
			"Portal Dashboard":	{ path: "../tests.portal.dashboard.js" },
			"Parameter Requirements":	{ path: "../tests.requirements.parameter.js" },
			"Calculated Requirements":	{ path: "../tests.requirements.calculated.js" },
			"CBC Requirements":		{ path: "../tests.requirements.cbCalculated.js", descr: "Count-Based Calculated Requirements" },
			"TBC Requirements":		{ path: "../tests.requirements.tbCalculated.js", descr: "Time-Based Calculated Requirements (Fixed/Rolling)" },
			"TBA Requirements":		{ path: "../tests.requirements.tbAggCalculated.js", descr: "Time-Based Aggregation Calculated Requirements" },
			"TBS Requirements":		{ path: "../tests.requirements.tbSubCalculated.js", descr: "Time-Based Subtraction Calculated Requirements" },
			"MAC Requirements":		{ path: "../tests.requirements.mac.js", descr: "Material Activity Calculated Requirements (standard/single)",
				config : {
					noManageRightsUserName: "userWPermissionsMacReq"
				}},
			"System Variable Requirements" :	{ path: "../tests.requirements.systemVariable.js" },
			
			// Tests for an Enviance App Runtime
			"Material Data":		{ path: "../tests.materialData.js", isEnvAppRuntime: true },
			"Packages Infrastructure" : { path: "../tests.packages.infrastructure.js", isEnvAppRuntime: true },
			"Packages Shims":		{ path: "../tests.packages.shims.js", isEnvAppRuntime: true },
			"Packages App Data":	{ path: "../tests.packages.appData.js", isEnvAppRuntime: true },
			"Packages User Data":	{ path: "../tests.packages.userData.js", isEnvAppRuntime: true },
			"Packages stored EQL query":	{ path: "../tests.packages.eql.js", isEnvAppRuntime: true }
			
			// Template:
			// ---------
			// "<25 character max length name>" : { 
			//		path: "<path to test javascript>", 
			//		descr: "<description if name is too short>", 
			//		warning: "warning message if test use some critical features", 
			//		isEnvAppRuntime : <just a flag: true if it is>,
			// 		baseSystemOnly : <just a flag: true - this module use specific parameters and can be running on base System only (not system copy for parallel mode)>,
			//		config: <object: specific options for this module>
			//	}
		}
	};
}