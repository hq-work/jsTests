(function( window ) {
	if(typeof(jsLog) != 'undefined') return;
	
	function jsDebugConsole(){
		$('body').append(this._html);
		this.$header = $('.console-header');
		this.$console = $('.console-body');
		this.$main = $('.console-wrapper');
		
		var self = this;
		this._coords = null;
		
		this.$main.resizable({
			handles: {'n': '.console-header'},
			alsoResize: '.console-body',
			start: function( event, ui ) {
				if (event.which != 1){
					$(document).off( "mousemove" );
				}
				self._startCoords =
				self._coords = { X: event.pageX, Y: event.pageY };

				$(document).mousemove(function( event ){
					var difY = self._coords.Y - event.pageY;
					
					if(!self.changeHeight(self.$main.height(), difY))return;
					self._coords = { X: event.pageX, Y: event.pageY };
				});
			},
			stop: function(event, ui) {
				$(document).off( "mousemove" );
			}
		});
	}

	jsDebugConsole.prototype = {
		_maxHeight:700,
		_minHeight:50,
		$header: null,
		$console: null,
		errorCount: 0,
		warningCount: 0,
		Write: function(text, newLine){
				this.$console.html(this.$console.html() + '<span>' + text + '</span>' + (newLine ? '<br />' : ''));
		},
		WriteLn: function(text){
				this.Write(text, true);
		},
		WriteFormat: function(text, iconType, color, newLine){
			var iconTxt = '';
			if(iconType == 'warning'){
				iconTxt = '<b>[W]</b> ';
				if(!color)color = 'Brown';
			}
			else if(iconType == 'error'){
				iconTxt = '<b>[E]</b> ' ;
				if(!color)color = 'Red';
			}
			var str = '<span' + (color ? ' style="color:' + color + '"' : '')  + '>' + iconTxt + text + '</span>';
			
			this.Write(str, newLine);
		}, 
		Warn: function(text){
			this.WriteFormat(text,'warning',null,true);
			this.warningCount++;
		},
		Error: function(text){
			this.WriteFormat(text,'error',null,true);
			this.errorCount++;
		},
		Show: function(){
			this.$main.toggle(true);
		},
		Hide: function(){
			this.$main.toggle(false);
		},
		Toggle: function(flag){
			this.$main.toggle(flag);
		},
		setHeight: function(height){
			var curHeight = this.$main.height();
			return this.changeHeight(curHeight, height - curHeight);
		},
		changeHeight: function(height, difY){
			if(!difY) return;
			
			var newHeight = height + difY;
			if(newHeight < this._minHeight || newHeight > this._maxHeight) return false;
			
			var consoleHeight = this.$console.height() + difY;
			var consoleMaxHeight = this.$console.css('max-height');
			
			consoleMaxHeight = consoleMaxHeight.substr(0,consoleMaxHeight.length-2) * 1 + difY;
			
			this.$main.css({'height': newHeight + 'px'});
			this.$console.css({'height': consoleHeight + 'px', 'max-height': consoleMaxHeight + 'px'});
			
			return true;
		},
		
		
		_html: '<style>'
			+ '	.console-wrapper { position: fixed !important; border: solid 1px #AAA; height:150px; top: auto !important; bottom:0 !important; left: 0; right: 0; background-color:#EEE; font-family: Consolas, Courier New; }'
			+ '	.console-header { position: relative !important; border-bottom: solid 1px #CCC; height:20px; top:0; left: 0; right: 0; background-color:#EEE; }'
			+ '	.console-body { position: relative !important; top:0; bottom:0; left: 0; right: 0; background-color:#F0F0F0; height:128px; max-height:129px; overflow: auto; padding: 2px 1px 2px 5px; font-size: 13px;  }'
			+ '	.console-header > i { font-weight:600; }'
			+ '</style>'
			
			+ '<div class="console-wrapper" >'
			+ '	<div class="console-header">'
			+ '		<i>&nbsp;</i> <b>Log</b>'
			+ '	</div>'
			+ '	<div class="console-body"></div>'
			+ '</div>'
	};

	window['jsLog'] = new jsDebugConsole();

}(window));