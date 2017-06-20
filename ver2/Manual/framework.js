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
	},
	checkAndStart: function (f) {
		try {
			f();
		} catch (ex) {
			equal(false,true, "Js error " + ex);
		}
		start();
	},
	checkAndExecuteNext: function (f) {
		try {
			f();
		} catch (ex) {
			equal(false,true, "Js error " + ex);
		}
		this.executeNext();
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
			var start = new Date(date.getFullYear(), 3, 1, 2);
			var finish = new Date(date.getFullYear(), 9, 31, 2);
			if ((date.valueOf() >= start.valueOf() + ((7 - start.getDay()) % 7) * 24 * 60 * minute) &&
					(date.valueOf() < finish.valueOf() + (0 - finish.getDay()) * 24 * 60 * minute)) {
				offset = -dstOffset;
			}
		}
	}
	return new Date(date.valueOf() + offset * minute);
}

function getUTCDate(date) {
	if (date == null) {
		date = new Date();
	}
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
		  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
}

function toMap(arr, callback) {
	var obj = {};

	for (var i = 0; i < arr.length; i++) {
		var propertyName = callback(arr[i]);
		obj[propertyName] = arr[i];
	}

	return obj;
}

var Base64 = {
	// private property
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode: function(input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
				Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) +
				Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode: function(input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = Base64._keyStr.indexOf(input.charAt(i++));
			enc2 = Base64._keyStr.indexOf(input.charAt(i++));
			enc3 = Base64._keyStr.indexOf(input.charAt(i++));
			enc4 = Base64._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode: function(string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode: function(utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while (i < utftext.length) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			} else if ((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i + 1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i + 1);
				c3 = utftext.charCodeAt(i + 2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}
		return string;
	}
};
