/*

Touchy.js
by Alex Lea | alex@ifxstudios.com

Requires Zepto.js or JQuery

Target requirements: Parent must have set width/height.  Must only be one child element.

Usage: 
var scroller = new Touchy(<element>);   // Vertical Scrolling
var slider = new Touchy(<element>, { Slider : true });  // Horizontal Sliding

*/

var Touchy = (function() {

	var Tchx = function(element, options) {
		var self = this;
		this.tag = element;
		this.element = $(element)[0];

		// Default Settings (can override with options)
		this.Slider = false;  // vertical | horizontal
		this.ScrollThreshold = 7;
		this.ScrollScale = 500;  // pixels per second
		this.AllowMomentum = true;
		this.SwipeThreshold = 15;
		this.Ease = 1.5;
		this.isIOS5 = true;  // IOS5 has different listeners for touches

		// Set Options (may override)
		if(typeof options != 'undefined') {
			for(var v in options) {
				this[v] = options[v];
			}
		}

		// set defaults for mouse
		this.StartEvent = "mousedown";
		this.EndEvent = "mouseup";
		this.MoveEvent = "mousemove";

		try 
		{ 
			document.createEvent("TouchEvent"); 
			this.CanTouch = true; 
			// update events to use touch events, they are available
			this.StartEvent = "touchstart";
			this.EndEvent = "touchend";
			this.MoveEvent = "touchmove";
		} 
		catch (e) //look for exception to feature-detection touch events.
		{ 
			this.CanTouch = false; 
		}

		// Global Variables
		this.At = 0;  // current location
		this.startX = 0;
		this.startY = 0;
		this.scrollTo = 0;
		this.animating = false;  // Is scroller animating
		this.lastTouch = 0;
		this.lastTime = 0;
		this.delta = 0;
		this.limitStart = 0;
		this.limitEnd = (!this.Slider) ? this.element.parentNode.clientHeight - this.element.clientHeight : this.element.parentNode.clientWidth - this.element.clientWidth;

		// Don't continue if element doesn't exceed viewport.
		if(this.limitEnd>0) return;

		// Switch to 3d
		this.element.style.webkitTransition = 'none';
		this.element.style.webkitTransform = 'translate3d(0,0,0)';

		// Handlers
		this.element.addEventListener(this.StartEvent, function(e) { self.touchStart(e) }, false);
		this.element.addEventListener(this.MoveEvent, function(e) { self.touchMove(e); }, false);
		this.element.addEventListener(this.EndEvent, function(e) { self.touchEnd(e); }, false);
	}

	// Methods
	Tchx.prototype = {
		touchStart: function(e) {
			this.startX = this.isIOS5 ? e.pageX : e.touches[0].pageX;
			this.startY = this.isIOS5 ? e.pageY : e.touches[0].pageY;
			this.lastTouch = this.startY;  // prevents reverse momentum for quick touches

			if(this.animating==true) {
				// Prevent links from activating
				e.preventDefault();
				
				// Stay at current point
				this.scrollTo = this.getPosition();
				this.animate(this.scrollTo,'none');
				this.delta = 0;  // reset so doesn't continue scroll motion.

				// Allow scrolling again
				this.animating = false;
			}
			
			this.At = this.getPosition();  // for touch move
		},
		touchEnd: function(e) {
			// Detect if is Swipe
			var mag = Math.abs(this.delta); 
			if (mag > this.ScrollThreshold && this.AllowMomentum) {
				// Animate to either end
				var velocity = this.delta/(e.timeStamp-this.lastTime);
				var travel = velocity*this.ScrollScale;

				// Destination point
				var move = this.keepInBounds(this.At+travel, true);
				this.scrollTo = move[0];

				var factor = (move[1]!=0) ? move[1]/travel : 1;
				
				// Add transition ease
				this.animate(this.scrollTo, factor*this.Ease);
				this.animating = true;
			}
		},
		touchMove: function(e){
			if(!this.animating) {
				var pageX = this.isIOS5 ? e.pageX : e.touches[0].pageX;
				var pageY = this.isIOS5 ? e.pageY : e.touches[0].pageY;

				// Ensure Vertical Motion
				var dX = pageX-this.startX;
				var dY = pageY-this.startY;
				// For detecting swipe
				var touch = (!this.Slider) ? pageY : pageX;
				var ratio = (!this.Slider) ? dY/dX : dX/dY;

				this.delta = touch-this.lastTouch;
				this.lastTouch = touch;
				this.lastTime = e.timeStamp;
			  
			  	// Only move when vertical motion exceeds horizontal
				if((Math.abs(this.delta) > 2 || Math.abs(ratio) > 3) && ((this.At + dY) > this.limitEnd)) {
			  		// Always run this so that hit the ends
					this.scrollTo = this.keepInBounds(this.At + dY);
			  		this.animate(this.scrollTo,'none');
				}
			}
			e.preventDefault();
		},
		animate: function(scrollTo, ease) {
			// Momentum Effect or Not
			// var transition = (ease!='none') ? 'all '+ease+'s ease-out' : 'none';
			var transition = (ease!='none') ? '-webkit-transform '+ease+'s cubic-bezier(0, 0, 0.45, 1)' : 'none';
			this.element.style.webkitTransition = transition;

			// Move the element
			var target = (!this.Slider) ? '0,'+scrollTo+'px' : scrollTo+'px,0';
			this.element.style.webkitTransform = 'translate3d('+target+',0)';
		},
		redefineParent: function() {  // Won't work unless self.element is reattached since may be overwritten by new modal contents
			var self = this;
			self.limitEnd = (!self.Slider) ? self.element.parentNode.clientHeight-self.element.clientHeight : self.element.parentNode.clientWidth-self.element.clientWidth;
			self.animate(0, 'none');
		},
		getPosition: function() {
			// Get current point and Stay there
			var style = document.defaultView.getComputedStyle(this.element, null);
			var transform = new WebKitCSSMatrix(style.webkitTransform);

			// Return position based on direction
			if (!this.Slider) {
				return transform.m42;
			} else {
				return transform.m41;
			}
		},
		keepInBounds: function(dest, needDiff) {
			var diff = 0;
			if(dest > 0 || dest < this.limitEnd) {
				if(dest < 0) {
					dest = this.limitEnd;
				} else {
					dest = 0;
				}
				diff = dest-this.At;
			}
			if(typeof needDiff!='undefined') {
				return [dest, diff];
			}
			return dest;
		}
	};

	return Tchx;
  
})();