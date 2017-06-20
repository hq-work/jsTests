UnitTestsApplication.SystemManager = function (app) {
	this.app = app;
	this.helper = app.helper;
};

UnitTestsApplication.SystemManager.prototype = {
	systemList: [],
	homeSystem: null,
	currentSystem: null,
	userList: [],
	user: {
		login: null,
		id: "",
		suffix: ""
	},
	_initDefered: null,
	
	loadSystemInfos: function(){
		this._initDefered = jQuery.Deferred();
		
		var self = this;
		
		/*var sysManager = this._getParentManager();
		var i, s, homeSysId, curSysId, n;
		
		if (sysManager) {
			for (i = 0; i < sysManager.systemList.length; i++) {
				this.systemList.push(jQuery.extend(true, { }, sysManager.systemList[i]));
			}
			this.homeSystem = jQuery.extend(true, {}, sysManager.homeSystem);
			this.currentSystem = this.getSystemById(sysManager.currentSystem.id);
		}
		else {*/
			var envSystem = this._getEnvianceSystem();

			if (envSystem) {
				homeSysId = envSystem.get_Home().get_ID();
				curSysId = envSystem.get_Current().get_ID();

				for (i = 0; i < envSystem._systems.length; i++) {
					var sys = envSystem._systems[i];
					n = sys.get_Name();
					s = { id: sys.get_ID(), name: n /*,  suffix: "" , suffix: n.substr(this._originalSystemName.length)*/ };

					if (s.id == homeSysId) {
						this.homeSystem = s;
					} else {
						this.systemList.push(s);
					}
					if (s.id == curSysId)
						this.currentSystem = s;
				}
			}
		//}
		
		if (!this.systemList.length) {
			var errMsg = "";
			envianceSdk.authentication.getCurrentSession()
				.done(function (response) {
					try{
						var homeSystemName = self.app.config.defaults.homeSystemName;
						
						var sysList = response.systems;
						curSysId = response.currentSystemId;
						homeSysId = response.homeSystemId;
						
						for (var id in sysList) {
							n = sysList[id];
							s = { id: id, name: n /*, suffix: "" , suffix: n.substr(self._originalSystemName.length)*/ };
							
							if (id == homeSysId /* !self.homeSystem && n.slice(0, self._originalSystemName.length) != self._originalSystemName */) {
								// s.suffix = "";
								self.homeSystem = s;
							} else {
								self.systemList.push(s);
							}

							if (id == curSysId) {
								self.currentSystem = s;
							} 
						}
					}catch(e){
						errMsg = "SystemManager.loadSystemInfos[envianceSdk.authentication.getCurrentSession] Success processing error: [" + e.name + "]: " + e.message;
					}
				})
				.fail(function (jqxhr, settings, exception) {
					errMsg = "SystemManager.loadSystemInfos[envianceSdk.authentication.getCurrentSession] is Failed: " + self.helper.formatErrorResponse(jqxhr, settings, exception);
				})
				.always(function(){
					if(!errMsg) self._detectUser();
					else self._initDefered.reject(errMsg);
				});
		}
		else self._detectUser();
		
		return this._initDefered;
	},
	_detectUser: function () {
		var self = this;
		
		/*var sysManager = this._getParentManager();
		if (sysManager) {
			this.user = jQuery.extend(true, {}, sysManager.user);
		}
		
		if (!this.user.login && this.homeSystem) {*/
			if (this.homeSystem != this.currentSystem) {
				envianceSdk.setSystemId(this.homeSystem.id);
			}			

			var errMsg = "";
			var accessUserName = self.app.config.defaults.accessUserName;
			
			envianceSdk.eql.execute("select u.Login, u.id from user u where u.id=GetCurrentUser()"
				+ "select u.Login, u.id from user u where u.Login like '" + accessUserName + "%'", 1, 10)
				.done(function(response) {
					try{
						for (var i = 0; i < response[1].rows.length; i++) {
							var r = response[1].rows[i];

							self.userList.push({ login: r.values[0], id: r.values[1], suffix: r.values[0].slice(accessUserName.length) });
						}
					
						self.user.login = response[0].rows[0].values[0];
						self.user.id = response[0].rows[0].values[1] || envianceSdk.getUserId();
					} catch(e){
						errMsg = "SystemManager._detectUser[envianceSdk.eql.execute] Success processing error: [" + e.name + "]: " + e.message;
					}
				})
				.fail(function(jqxhr, settings, exception) {
					errMsg = "SystemManager._detectUser[envianceSdk.eql.execute] is Failed: " + self.helper.formatErrorResponse(jqxhr, settings, exception);
				})
				.always(function () {
					try{
						envianceSdk.setSystemId(self.currentSystem.id);
						self.user.login = self.user.login || "";
						self.user.suffix = self.user.login.slice(accessUserName.length);
					}catch(e){
						if(!errMsg) errMsg = "SystemManager._detectUser[envianceSdk.eql.execute] Always processing error: [" + e.name + "]: " + e.message;
					}
					
					if(!errMsg) __finally(); //self._initDefered.resolve();
					else self._initDefered.reject(errMsg);
				});
		/*}
		else __finally(); //self._initDefered.resolve(); */
		
		function __finally() {
			// map suffixes
			for (var i = 0; i < self.userList.length; i++) {
				var u = self.userList[i];
				
				if (u.suffix) {
					var sList = self.filterSystemBySuffix(u.suffix);
					
					if (sList.length) {
						var foundIdx = 0;
						
						if (sList.length > 1) {
							for (var j = 1; j < sList.length; j++) {
								if (sList[j].name.length < sList[j - 1].name.length) foundIdx = j;
							}
						}
						sList[foundIdx].user = u;
					}
					else {
						jsLog.Warn("No system found for user: {" + u.login + "|" + u.id + "}");
					}
				}
			}
			
			for (i = 0; i < self.systemList.length; i++) {
				var s = self.systemList[i];
				if(!s.user){
					s.user = self.user;
				}
			}

			self._initDefered.resolve();
		}
		
		return this._initDefered;
	},
	/*_init: function (callback) {
		var self = this;
		if (this.app._isDbParallel()) {
			QUnit.moduleStart(function (info) {
				self.setSystem(QUnit.urlParams.dbsystemId);
			});
		}
		else {
			if (this.isUserCanRunDBTests()) {
				var suffix = this.user.suffix || QUnit.urlParams.dbsuffix;
				if (suffix && !this.isPrimeUser()) {
					this.setSystem(null, suffix);
				}
			}
		}

		if (callback) callback();
	},*/
	
	isPrimeUser: function () {
		return this.app.config.defaults.accessUserName.toLowerCase() == this.user.login.toLowerCase();
	},
	isUserCanRunDBTests: function () {
		return this.isPrimeUser() || this.user.suffix && this.getSystemBySuffix(this.user.suffix);
	},
	_getEnvianceSystem: function () {
		var parentWin = window.parent !== window && window.parent;
		var topWin = window.top !== window && window.top !== window.parent && window.top;
		return parentWin && parentWin.Enviance && parentWin.Enviance.Session && parentWin.Enviance.Session.System || topWin && topWin.Enviance && topWin.Enviance.Session && topWin.Enviance.Session.System;
	},
	getSystemBySuffix: function (suffix) {
		for (var i = 0; i < this.systemList.length; i++) {
			var user = systemList[i].user;
			if (user && user.suffix == suffix) return this.systemList[i];
		}
		return null;
	},
	filterSystemBySuffix: function (suffix) {
		var resList = [];
		
		for (var i = 0; i < this.systemList.length; i++) {
			var s = this.systemList[i];
			
			if(s.name.endsWith(suffix)) {
				resList.push(s);
			}
		}
		return resList;
	},

	getSystemById: function (id) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].id == id) return this.systemList[i];
		}
		return null;
	},
	
	getFreeSystem: function(){
		for (var i = 0; i < this.systemList.length; i++) {
			var s = this.systemList[i];
			if (!s.moduleIds) {
				return s;
			}
		}
		return null;
	},
	
	moduleAdvance: function(s){
		if(s.moduleIds.length > ++s.curModIdx){
			return true;
		}
		s.moduleIds = null;
		return false;
	},
	
	initSystem: function(s, modSet, seqIdx){
		s.moduleIds = modSet;
		s.curModIdx = 0;
		s.curSeqIdx = seqIdx || 0;
	},
	
	
	/*attachDb: function (modName) {
		for (var i = 0; i < this.systemList.length; i++) {
			var s = this.systemList[i];
			if (!s.modName) {
				s.modName = modName;
				return s;
			}
		}
		return null;
	},
	relaseDb: function (modName) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].modName == modName) {
				this.systemList[i].modName = null;
			}
		}
	},
	relaseAllDb: function () {
		for (var i = 0; i < this.systemList.length; i++) {
			this.systemList[i].modName = null;
		}
	},
	
	setSystem: function (id, suffix) {
		var sys = null;
		if (id) {
			sys = this.getSystemById(id);
		}
		if (!sys && suffix) {
			sys = this.getSystemBySuffix(suffix);
		}
		if(sys) {
			if (sys != this.currentSystem) {
				this.currentSystem = sys;
				envianceSdk.setSystemId(sys.id);

				/*var envSys = this._getEnvianceSystem();
				if (envSys) {
					envSys.set_Current(envSys.getSystemById(sys.id));
				}*/ 
				/*
			}
			if(!this.isPrimeUser())
				QUnit.urlParams.dbsuffix = suffix;
		}
	},*/
	_getParentManager: function () {
		var parentWin = window.parent !== window && window.parent;
		var topWin = window.top !== window && window.top !== window.parent && window.top;

		return parentWin && parentWin.App && parentWin.App.systemManager || topWin && topWin.App && topWin.App.systemManager;
	},
};