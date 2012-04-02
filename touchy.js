/*

Touchy.js
by Alex Lea | alex@ifxstudios.com

Requires Zepto.js or JQuery

Usage: 
var scroller = new Touchy(<element>);   // Vertical Scrolling
var slider = new Touchy(<element>, { Slider : true });  // Horizontal Sliding

*/

var Touchy = (function(){

	var Tchx = function(element, options) {
		var self = this;
		this.tag = element;
		this.element = $(element)[0];

		// Default Settings (can override with options)
		this.Slider = false;  // vertical | horizontal
		this.ScrollThreshold = 7;
		this.ScrollSpeed = 1000;  // pixels per second
		this.AllowMomentum = true;
		this.SwipeThreshold = 35;

		// Set Options (may override)
		if(typeof options!='undefined') {
			for(var v in options) {
				this[v] = options[v];
			}
		}

		// Global Variables
		this.At = 0;  // current location
		this.startX = 0;
		this.startY = 0;
		this.startTouch = 0;
		this.scrollTo = 0;
		this.animating = false;  // Is scroller animating
		this.lastTouch = 0;
		this.delta = 0;
		this.limitStart = 0;
		this.limitEnd = (!this.Slider) ? this.element.parentNode.clientHeight-this.element.clientHeight : this.element.parentNode.clientWidth-this.element.clientWidth;

		// Don't continue if element doesn't exceed viewport.
		if(this.limitEnd>0) return; 

		// Handlers
		this.element.addEventListener("touchstart", function(e){ self.touchStart(e) }, false);
		this.element.addEventListener("touchmove", function(e){ self.touchMove(e); }, false);
		this.element.addEventListener("touchend", function(e){ self.touchEnd(e); }, false);
	}

	// Methods
	Tchx.prototype = {
		touchStart: function(e){
			this.startX = e.pageX;
			this.startY = e.pageY;
			this.startTouch = (!this.Slider) ? this.startY : this.startX;
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
		touchEnd: function(e){
			// Detect if is Swipe
			var mag = Math.abs(this.delta); 
			if(mag>this.ScrollThreshold && this.AllowMomentum) {
				// Animate to either end
				this.scrollTo = (this.delta<0) ? this.limitEnd : 0;

				// Calculate ease rate
				var time = Math.abs( (this.getPosition()-this.scrollTo) / this.ScrollSpeed );
				var factor = (mag>this.SwipeThreshold) ? 1 : 3;
				var easeRate = Math.round(time*100)*factor / 100;

				// Log Movement
				// console.log('Slider : '+this.Slider+' | Delta: '+this.delta+' | Ease: '+easeRate);
				
				// Add transition ease
				this.animate(this.scrollTo, easeRate);
				this.animating = true;
			}
		},
		touchMove: function(e){
			if(!this.animating) {
				// Ensure Vertical Motion
				var dX = e.pageX-this.startX;
				var dY = e.pageY-this.startY;
				// For detecting swipe
				var touch = (!this.Slider) ? e.pageY : e.pageX;
				var ratio = (!this.Slider) ? dY/dX : dX/dY;
				this.delta = touch-this.lastTouch;
				this.lastTouch = touch;

				// Only move when vertical motion exceeds horizontal
				if(Math.abs(ratio)>3) {
					// Always run this so that hit the ends
					this.scrollTo = this.keepInBounds(touch-this.startTouch+this.At);
					this.animate(this.scrollTo,'none');
				}
			}
			e.preventDefault();
		},
		animate: function(scrollTo, ease) {
			// Momentum Effect or Not
			var transition = (ease!='none') ? 'all '+ease+'s ease-out' : 'none';
			this.element.style.webkitTransition = transition;

			// Move the element
			var target = (!this.Slider) ? '0,'+scrollTo+'px' : scrollTo+'px,0';
			this.element.style.webkitTransform = 'translate3d('+target+',0)';
		},
		getPosition: function(){
			// Get current point and Stay there
			var style = document.defaultView.getComputedStyle(this.element, null);
			var transform = new WebKitCSSMatrix(style.webkitTransform);

			// Return position based on direction
			if(!this.Slider) {
				return transform.m42;
			} else {
				return transform.m41;
			}
		},
		keepInBounds: function(dest) {
			if(dest>0 || dest<this.limitEnd) {
				if(dest<0) {
					dest = this.limitEnd;
				} else {
					dest = 0;
				}
			}
			return dest;
		}
	};

	return Tchx;
  
})();