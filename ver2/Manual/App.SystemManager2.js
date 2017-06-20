UnitTestsApplication.SystemManager = function (app) {
	this.app = app;
	this.helper = app.helper;
};

UnitTestsApplication.SystemManager.prototype = {
	//_systemUser: "jstestsAccessUser", // jstestsNotAccessUser
	//_userPassword: "1111",
	//_originalSystemName: "System for Tool (Home)",
	
	systemList: [],
	homeSystem: null,
	currentSystem: null,
	user: {
		login: null,
		id: "",
		suffix: ""
	},
	_initDefered: null,
	
	initSystems: function(){
		this._initDefered = jQuery.Deferred();
		
		var self = this;
		
		var sysManager = this._getParentManager();
		var i, s, homeSysId, curSysId, n;
		
		if (sysManager) {
			for (i = 0; i < sysManager.systemList.length; i++) {
				this.systemList.push(jQuery.extend(true, { }, sysManager.systemList[i]));
			}
			this.homeSystem = jQuery.extend(true, {}, sysManager.homeSystem);
			this.currentSystem = this.getSystemById(sysManager.currentSystem.id);
		}
		else {
			var envSystem = this._getEnvianceSystem();

			if (envSystem) {
				homeSysId = envSystem.get_Home().get_ID();
				curSysId = envSystem.get_Current().get_ID();

				for (i = 0; i < envSystem._systems.length; i++) {
					var sys = envSystem._systems[i];
					n = sys.get_Name();
					s = { id: sys.get_ID(), name: n, suffix: n.substr(this._originalSystemName.length) };

					if (s.id == homeSysId) {
						this.homeSystem = s;
					} else {
						this.systemList.push(s);
					}
					if (s.id == curSysId)
						this.currentSystem = s;
				}
			}
		}
		
		if (!this.systemList.length) {
			var errMsg = "";
			envianceSdk.authentication.getCurrentSession()
				.done(function (response) {
					try{
						var homeSystemName = self.app.config.defaults.homeSystemName;
						
						var sysList = response.result.systems;
						curSysId = response.result.currentSystemId;

						for (var id in sysList) {
							n = sysList[id];
							s = { id: id, name: n, suffix: n.substr(homeSystemName.length) };
							
							if (!self.homeSystem && n.slice(0, homeSystemName.length) != homeSystemName) {
								s.suffix = "";
								self.homeSystem = s;
							} else {
								self.systemList.push(s);
							}

							if (id == curSysId) {
								self.currentSystem = s;
							} 
						}
					}catch(e){
						errMsg = "SystemManager.initSystems[envianceSdk.authentication.getCurrentSession] Success processing error: [" + e.name + "]: " + e.message;
					}
				})
				.fail(function () {
					errMsg = "SystemManager.initSystems[envianceSdk.authentication.getCurrentSession] is Failed: " + self.helper.formatErrorResponse(jqxhr, settings, exception);
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
		
		var sysManager = this._getParentManager();
		if (sysManager) {
			this.user = jQuery.extend(true, {}, sysManager.user);
		}

		if (!this.user.login && this.homeSystem) {
			if (this.homeSystem != this.currentSystem) {
				envianceSdk.setSystemId(this.homeSystem.id);
			}			

			var errMsg = "";
			envianceSdk.eql.execute("select u.Login, u.id from user u where u.id=GetCurrentUser()", 1, 10)
				.done(function(response) {
					try{
						self.user.login = response.result[0].rows[0].values[0];
						self.user.id = response.result[0].rows[0].values[1] || envianceSdk.getUserId();
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
						self.user.suffix = self.user.login.slice(self.app.config.defaults.accessUserName.length);
					}catch(e){
						if(!errMsg) errMsg = "SystemManager._detectUser[envianceSdk.eql.execute] Always processing error: [" + e.name + "]: " + e.message;
					}
					
					if(!errMsg)self._initDefered.resolve();
					else self._initDefered.reject(errMsg);
				});
		}
		else self._initDefered.resolve(); //if (callback && typeof callback === "function") callback();
		
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
			if (this._isUserCanRunDBTests()) {
				var suffix = this.user.suffix || QUnit.urlParams.dbsuffix;
				if (suffix && !this._isPrimeUser()) {
					this.setSystem(null, suffix);
				}
			}
		}

		if (callback) callback();
	},*/
	
	_isPrimeUser: function () {
		return this._systemUser.toLowerCase() == this.user.login.toLowerCase();
	},
	_isUserCanRunDBTests: function () {
		return this._isPrimeUser() || this.user.suffix && this.getSystemBySuffix(this.user.suffix);
	},
	_getParentManager: function () {
		var parentWin = window.parent !== window && window.parent;
		var topWin = window.top !== window && window.top !== window.parent && window.top;

		return parentWin && parentWin.App && parentWin.App.systemManager || topWin && topWin.App && topWin.App.systemManager;
	},
	_getEnvianceSystem: function () {
		var parentWin = window.parent !== window && window.parent;
		var topWin = window.top !== window && window.top !== window.parent && window.top;
		return parentWin && parentWin.Enviance && parentWin.Enviance.Session && parentWin.Enviance.Session.System || topWin && topWin.Enviance && topWin.Enviance.Session && topWin.Enviance.Session.System;
	},
	getSystemById: function (id) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].id == id) return this.systemList[i];
		}
		return null;
	},
	getSystemBySuffix: function (suffix) {
		for (var i = 0; i < this.systemList.length; i++) {
			if (this.systemList[i].suffix == suffix) return this.systemList[i];
		}
		return null;
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
			}
			if(!this._isPrimeUser())
				QUnit.urlParams.dbsuffix = suffix;
		}
	},
	attachDb: function (modName) {
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
	}
};