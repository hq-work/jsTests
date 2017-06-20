var ActionQueue = function(context) {
	this._data = [];
	this._context = context;
};

ActionQueue.prototype = {
	enqueue: function(func) {
		if (typeof (func) !== "function") {
			throw new Error("Invalid argument: func should be a function.");
		}
		this._data.push(func);
		return this;
	},
	dequeue: function() {
		return this._data.shift();
	},
	executeNext: function() {
		var func = this.dequeue();
		func(this._context);
	},
	isEmpty: function() {
		return this._data.length == 0;
	}
};

function createUUID() {
	var s = [];
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	s[8] = s[13] = s[18] = s[23] = "-";

	var uuid = s.join("");
	return uuid;
}

function toLocalTime(date, timeZone) {
	var stdOffset = timeZone.stdOffset;
	var dstOffset = timeZone.dstOffset;
	var minute = 60000;
	var offset = stdOffset;
	if (date >= new Date('9999-12-31T00:00:00') || date == new Date('1753-01-01T00:00:00'))
		return date;
	if (stdOffset != dstOffset) {
		if (date.getFullYear() >= 2007) {
			var start = new Date(date.getFullYear(), 2, 8, 2);
			var finish = new Date(date.getFullYear(), 10, 1, 2);
			if ((date.valueOf() >= start.valueOf() + ((7 - start.getDay()) % 7) * 24 * 60 * minute - stdOffset * minute) &&
					(date.valueOf() < finish.valueOf() + ((7 - finish.getDay()) % 7) * 24 * 60 * minute - dstOffset * minute)) {
				offset = dstOffset;
			}
		}
		else {
			var start = new Date(date.getFullYear(), 3, 1, 2);
			var finish = new Date(date.getFullYear(), 9, 31, 2);
			if ((date.valueOf() >= start.valueOf() + ((7 - start.getDay()) % 7) * 24 * 60 * minute - stdOffset * minute) &&
					(date.valueOf() < finish.valueOf() + (0 - finish.getDay()) * 24 * 60 * minute - dstOffset * minute)) {
				offset = dstOffset;
			}
		}
	}
	return new Date(date.valueOf() + offset * minute);
}

function toUTC(date, timeZone) {
	var stdOffset = timeZone.stdOffset;
	var dstOffset = timeZone.dstOffset;
	var minute = 60000;
	var offset = -stdOffset;
	if (date >= new Date('9999-12-31T00:00:00') || date == new Date('1753-01-01T00:00:00'))
		return date;
	if (stdOffset != dstOffset) {
		if (date.getFullYear() >= 2007) {
			var start = new Date(date.getFullYear(), 2, 8, 2);
			var finish = new Date(date.getFullYear(), 10, 1, 2);
			if ((date.valueOf() >= start.valueOf() + ((7 - start.getDay()) % 7) * 24 * 60 * minute) &&
					(date.valueOf() < finish.valueOf() + ((7 - finish.getDay()) % 7) * 24 * 60 * minute)) {
				offset = -dstOffset;
			}
		}
		else {
			start = new Date(date.getFullYear(), 3, 1, 2);
			finish = new Date(date.getFullYear(), 9, 31, 2);
			if ((date.valueOf() >= start.valueOf() + ((7 - start.getDay()) % 7) * 24 * 60 * minute) &&
					(date.valueOf() < finish.valueOf() + (0 - finish.getDay()) * 24 * 60 * minute)) {
				offset = -dstOffset;
			}
		}
	}
	return new Date(date.valueOf() + offset * minute);
}

function toMap(arr, callback) {
	var obj = { };

	for (var i = 0; i < arr.length; i++) {
		var propertyName = callback(arr[i]);
		obj[propertyName] = arr[i];
	}

	return obj;
}