function getAppConfig(){
	return { 
		defaults: {
			accessUserName: "jstestsAccessUser", // jstestsNotAccessUser
			password: "1111",
			homeSystemName: "System for Tool (Home)"
		},
		moduleDefs: {
			"SDK Infrastructure":	{ path: "../tests.infrastructure.js" },
			"Utilities":			{ path: "../tests.utilities.js" },
			"Eql":					{ path: "../tests.eql.js" },
			"Authentication":		{ path: "../tests.authentication.js", baseSystemOnly: true,
				warning : "This module may conflict with each of other modules\nin parallel mode. It is better to run it standalone.",
				config : {
					accessUserName: "jstestsAccessUser",
					mustChangePasswordUser: "jstestsMustChangePasswordUser",
					tempPasswordUser: "jstestsTempPasswordUser",
					password: "1111"
				}
			},
			"Workflows":			{ path: "../tests.workflows.js" },
			"Tasks":				{ path: "../tests.tasks.js" },
			"Locations":			{ path: "../tests.locations.js" },
			"Data Calc Periods":	{ path: "../tests.data.calcperiods.js" },
			"Data":				{ path: "../tests.data.js" },
			"Events": 				{ path: "../tests.events.js" },
			"Commands":			{ path: "../tests.commands.js" },
			"Documents":			{ path: "../tests.documents.js" },
			"Reports":				{ path: "../tests.reports.js" },
			"Package":				{ path: "../tests.package.js" },
			"Messages":			{ path: "../tests.messages.js" },
			"Groups":				{ path: "../tests.groups.js" },
			"Activities":			{ path: "../tests.activities.js" },
			"Materials":			{ path: "../tests.materials.js" },
			"Material Groups":		{ path: "../tests.materialGroups.js" },
			"Material Properties":	{ path: "../tests.materialProperties.js" },
			"Material Templates":	{ path: "../tests.materialTemplates.js" },
			"Chemicals":			{ path: "../tests.chemicals.js" },
			"ChemicalGroups":		{ path: "../tests.chemicalGroups.js" },
			"ChemicalLists":		{ path: "../tests.chemicalLists.js" },
			"Tags":				{ path: "../tests.tags.js" },
			"Tag Schemes":			{ path: "../tests.tagSchemes.js" },
			"Portal Dashboard":	{ path: "../tests.portal.dashboard.js" },
			"Parameter Requirements":	{ path: "../tests.requirements.parameter.js" },
			"Calculated Requirements":	{ path: "../tests.requirements.calculated.js" },
			"CBC Requirements":		{ path: "../tests.requirements.cbCalculated.js", descr: "Count-Based Calculated Requirements" },
			"TBC Requirements":		{ path: "../tests.requirements.tbCalculated.js", descr: "Time-Based Calculated Requirements (Fixed/Rolling)" },
			"TBA Requirements":		{ path: "../tests.requirements.tbAggCalculated.js", descr: "Time-Based Aggregation Calculated Requirements" },
			"TBS Requirements":		{ path: "../tests.requirements.tbSubCalculated.js", descr: "Time-Based Subtraction Calculated Requirements" },
			"MAC Requirements":		{ path: "../tests.requirements.mac.js", descr: "Material Activity Calculated Requirements (standard/single)" },
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
			// "<30 character max len name>" : { 
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
			
						/*envianceSdk.packages.init(options, function() {
				envianceSdk.configure({
					refreshPageOnUnauthorized: false
				});
			});*/

			/*

			workflowConfig = {
				accessUserId: null,
				//accessUserName: "jstestsAccessUser",
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				deletedUserName: "jstestsDeletedUser",
				expiredUserName: "jstestsExpiredUser",
				noManageRightsUserNameWithOverrides: "jstestsWPermissionsWithOverrides",
				password: "1111"
			};

			taskConfig = {
				//accessUserName: "jstestsAccessUser",
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				password: "1111"
			};

			eventConfig = {
				//accessUserName: "jstestsAccessUser",
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				password: "1111"
			};

			documentConfig = {
				//accessUserName: "jstestsAccessUser",
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				password: "1111"
			};

			locationConfig = {
				//accessUserName: "jstestsAccessUser",
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				userWithPermission: "jstestsUserWithDocumentPermission",
				password: "1111"
			};

			commandConfig = {
				//accessUserName: "jstestsAccessUser",
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				password: "1111"
			};

			shimsConfig = {
				noManageRightsUserName: "jstestsWPermissions",
				noAccessUserName: "jstestsNotAccessUser",
				password: "1111"
			};

			groupsConfig = {
				noManageRightsUserName: "jstestsWPermissions",
				password: "1111"
			};

			reportConfig = {
				noManageRightsUserName: "jstestsWPermissions",
				password: "1111"
			};
			
			activitiesConfig = {
				noManageRightsUserName: "userWPermissionsActivities",
				password: "1111"
			};
			
			chemicalsConfig = {
				noManageRightsUserName: "userWPermissionsChemical",
				password: "1111"
			};
			
			chemicalGroupsConfig = {
				noManageRightsUserName: "userWPermissionsChemGroup",
				password: "1111"
			};
			
			chemicalListsConfig = {
				noManageRightsUserName: "userWPermissionsChemList",
				password: "1111"
			};

			tagsConfig = {
				noManageRightsUserName: "userWPermissionsTags",
				password: "1111"
			};

			tagSchemesConfig = {
				noManageRightsUserName: "userWPermissionsTagSchemes",
				password: "1111"
			};
			
			macRequirementsConfig = {
				noManageRightsUserName: "userWPermissionsMacReq",
				password: "1111"
			};
			
			mdlGroupConfig = {
				noManageRightsUserName: "jstestsWPermissions",
				password: "1111"
			};
			
			materialPropertiesConfig = {
				noManageRightsUserName: "userWPermissionsMatProp",
				password: "1111"
			};
			
			materialTemplatesConfig = {
				noManageRightsUserName: "userWPermissionsMatTemplate",
				password: "1111"
			};
			
			mdlGroupUploadConfig = {
				noManageRightsUserName: "jstestsWPermissions",
				password: "1111"
			};
			
			parameterRequirementsConfig = {
				noManageRightsUserName: "jstestsWPermissions",
				password: "1111"
			};
			*/