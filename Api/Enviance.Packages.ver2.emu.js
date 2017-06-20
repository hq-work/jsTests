function __getPromise__(onsuccess, onerror, resultParams, isFailed){
	var deferred = jQuery.Deferred();
	
	if(!isFailed){
		if(onsuccess)onsuccess.call(window, resultParams);
		deferred.resolve(resultParams);
	} else {
		if(onerror)onerror.call(window, resultParams);
		deferred.reject(resultParams);
	}
	
	return deferred.promise();
}


var __sessionSuccess = {
	currentSystemId:	"22012760-3fd9-4e34-892e-a5e02a184985",
	homeSystemId:		"f7550ed1-0af7-41d1-be86-7207cd4aff7b",
	id:					"ddc0e2e7-61ab-4e31-8a7f-1f7b9a742337",
	sessionTimeout:		180,
	systems: {
		"22012760-3fd9-4e34-892e-a5e02a184985":"System for Tool (Home)",
		"f7550ed1-0af7-41d1-be86-7207cd4aff7b":"System for Tool (Access)"
	},
	userTimeZone: {
		currentOffset:	-240,
		dstOffset:		-240,
		name:			"USA Atlantic",
		stdOffset:		-240
	}
};

/*

envSystem
{
	getSystemById: function(id) {
		if(this._systems ==null){return null;}
		for (var i = 0; i < this._systems.length; i++) {
			if (this._systems[i].get_ID() == id) {
				return this._systems[i];
			}
		}
		return null;
	},
	get_Home: function() {
		return this._home;
	},
	get_Current: function() {
		return this._current;
	},
	set_Current: function(system) {
		this._current= system;
	},

	_current: {
		get_ID: function() {
			return this._instance.ID;
		},
		get_FullID: function() {
			return this.get_ID() + '_' + this.get_ID();
		},
		get_Name: function() {
			return this._instance.Name != null ? this._instance.Name : '';
		},
		get_Rights: function() {
			return this._instance.Rights != null ? parseInt(this._instance.Rights, 10) : 0;
		},
		set_Rights: function(rights) {
			return this._instance.Rights = rights;
		},
		get_IsActive: function() {
			return this._instance.IsActive != null ? this._instance.IsActive : false;
		},
		get_IsHomeSystem: function() {
			return this._instance.HomeSystem != null ? this._instance.HomeSystem : false;
		},
		get_SystemLogoPath: function() {
			return this._instance.LogoPath != null ? this._instance.LogoPath : '';
		},
		get_TreeLevelNames: function() {
			return this._instance.TreeLevelNames != null ? this._instance.TreeLevelNames : '';
		},
		get_UserCultureID: function() {
			return this._instance.UserCultureID != null ? this._instance.UserCultureID : 0;
		},
		_instance: {
			 Access: 16777215,
			 Children: [ ],
			 HasChild: true,
			 HomeSystem: false,
			 IconCss: "tree-icon-system",
			 ID: "22012760-3fd9-4e34-892e-a5e02a184985",
			 IsActive: true,
			 IsDrag: true,
			 IsMultiSel: false,
			 IsSel: true,
			 IsSystemAdmin: true,
			 LogoPath: "/images/logos/default-logo.gif",
			 Name: "System for Tool (Home)",
			 Rights: 461110015,
			 TextCss: "tree-text-node-normal",
			 TreeLevelNames: [ ],
			 Type: 1,
			 UserCultureID: 1033
		}
	},
   _home: {
      [functions]: ,
      __proto__: { },
      _instance: {
         [functions]: ,
         __proto__: { },
         Access: 16777215,
         Children: [ ],
         HasChild: true,
         HomeSystem: true,
         IconCss: "tree-icon-system",
         ID: "f7550ed1-0af7-41d1-be86-7207cd4aff7b",
         IsActive: true,
         IsDrag: true,
         IsMultiSel: false,
         IsSel: true,
         IsSystemAdmin: true,
         LogoPath: "/images/logos/f7550ed1-0af7-41d1-be86-7207cd4aff7b_6.jpg",
         Name: "System for Tool (Access) (Home)",
         Rights: "461111295",
         TextCss: "tree-text-node-normal",
         TreeLevelNames: [ ],
         Type: 1,
         UserCultureID: 1033
      }
   },
   _systems: [
      0: {
         [functions]: ,
         __proto__: { },
         _instance: {
            [functions]: ,
            __proto__: { },
            Access: 16777215,
            Children: [ ],
            HasChild: true,
            HomeSystem: true,
            IconCss: "tree-icon-system",
            ID: "f7550ed1-0af7-41d1-be86-7207cd4aff7b",
            IsActive: true,
            IsDrag: true,
            IsMultiSel: false,
            IsSel: true,
            IsSystemAdmin: true,
            LogoPath: "/images/logos/f7550ed1-0af7-41d1-be86-7207cd4aff7b_6.jpg",
            Name: "System for Tool (Access) (Home)",
            Rights: "461111295",
            TextCss: "tree-text-node-normal",
            TreeLevelNames: [ ],
            Type: 1,
            UserCultureID: 1033
         }
      },
      1: {
         [functions]: ,
         __proto__: { },
         _instance: {
            [functions]: ,
            __proto__: { },
            Access: 16777215,
            Children: [ ],
            HasChild: true,
            HomeSystem: false,
            IconCss: "tree-icon-system",
            ID: "22012760-3fd9-4e34-892e-a5e02a184985",
            IsActive: true,
            IsDrag: true,
            IsMultiSel: false,
            IsSel: true,
            IsSystemAdmin: true,
            LogoPath: "/images/logos/default-logo.gif",
            Name: "System for Tool (Home)",
            Rights: 461110015,
            TextCss: "tree-text-node-normal",
            TreeLevelNames: [ ],
            Type: 1,
            UserCultureID: 1033
         }
      },
      length: 2
   ]
}

*/


/*
{
	systems: {
		'<GUID1>':'Name1', 
		'<GUID2>':'Name2', 
		'<GUID3>':'Name3'
	},
	currentSystemId : '<GUID1>'
};
*/

var __userListSuccess =  [
	{
		columns: [
			{
				dataType:	"String",
				name:		"Login",
				size:		100
			},
			{
				dataType:	"Guid",
				name:		"id",
				size:		-1
			}
		],
		rows:[
			{ values:["jstestsAccessUser", '79e0049f-624c-4664-bcff-3cec7fad0c7b'] }
		]
	}
];

envianceSdk = {
	__config: {},
	configure: function(jsonParams){},
	authentication: { 
		getCurrentSession: function(onsuccess, onerror) {
			return __getPromise__(onsuccess, onerror, { result: __sessionSuccess } );
		} 
	},
	eql: {
		execute: function(eql, page, pageSize, onsuccess, onerror) {
			return __getPromise__(onsuccess, onerror, { result: __userListSuccess } );
		}
	},
	setSystemId: function (id){
		envianceSdk.__config.SystemId = id;
	},
	getSystemId: function (){
		return envianceSdk.__config.SystemId;
	}
	
};

