/*

Scrollex.js
by Alex Lea

Requires Zepto.js or JQuery

Target requirements: Parent must have set width/height.  Must only be one child element.

Usage: 
var scroller = new Scrollex(<element>);   // Vertical Scrolling
var slider = new Scrollex(<element>, { Slider : true });  // Horizontal Sliding

*/

var Scrollex = function(selector, options) {

	/*------- Globals -------*/

	var viewportWidth = 0,
		animating = false,
		numSlides = 0,
		goTo = 0,
		currentSlide = 0,
		orientation = 0;

	// Swiping
	var swipe = {
		started : false,
		startX : 0,
		endX : 0,
		startY : 0,
		endY : 0,
		scrollTo : 0,
		animating : 0,
		at : 0,
		delta : 0,
		lastTouch : 0,
		lastTime : 0,
		limitStart : 0,
		limitEnd : 0,
		// from swiper.js
		strength : 0
	};

	// Settings
	var settings = {
		ease : 1.5,
		scrollScale : 500,
		Slider : false,
		ScrollThreshold : 7,
		ScrollScale : 500,  // pixels per second
		AllowMomentum : true,
		SwipeThreshold : 15,
		isIOS5 : true  // IOS5 has different listeners for touches
	};

	// Events
	var pointerEvents = {
		CanTouch : false,
		StartEvent : "mousedown",
		EndEvent : "mouseup",
		MoveEvent : "mousemove"
	}

	/*------- Handles -------*/
	
	var el = selector,
		$parent = $(el);
	
	/*------- Methods -------*/

	var init = function(options) {
		// Merge settings
		settings = $.extend(settings, options || {});

		// Initialize limit end
		swipe.limitEnd = (!settings.Slider) ? $parent[0].parentNode.clientHeight - $parent[0].clientHeight : $parent[0].parentNode.clientWidth - $parent[0].clientWidth;
		
		// Don't continue if element doesn't exceed viewport.
		if ( swipe.limitEnd > 0 ) return;

		try { 
			document.createEvent("TouchEvent");
			// update events to use touch events, they are available
			pointerEvents.CanTouch = true;
			pointerEvents.StartEvent = "touchstart";
			pointerEvents.EndEvent = "touchend";
			pointerEvents.MoveEvent = "touchmove";
		} catch (e) { 
			// look for exception to feature-detection touch events.
		}

		// Prepare for Animation
		$parent[0].style.webkitTransition = 'none';
		$parent[0].style.webkitTransform = 'translate3d(0,0,0)';

		// Listeners
		$parent[0].addEventListener(pointerEvents.StartEvent, function(e) { self.touchStart(e) }, false);
		$parent[0].addEventListener(pointerEvents.MoveEvent, function(e) { self.touchMove(e); }, false);
		$parent[0].addEventListener(pointerEvents.EndEvent, function(e) { self.touchEnd(e); }, false);
	},

	touchStart = function(e) {
		swipe.startX = settings.isIOS5 ? e.pageX : e.touches[0].pageX;
		swipe.startY = settings.isIOS5 ? e.pageY : e.touches[0].pageY;
		swipe.lastTouch = swipe.startY;  // prevents reverse momentum for quick touches

		if(swipe.animating==true) {
			// Prevent links from activating
			e.preventDefault();
			
			// Stay at current point
			swipe.scrollTo = getPosition();
			animate(swipe.scrollTo,'none');
			swipe.delta = 0;  // reset so doesn't continue scroll motion.

			// Allow scrolling again
			swipe.animating = false;
		}
		
		swipe.at = getPosition();  // for touch move
	},

	touchEnd = function(e) {
		// Detect if is Swipe
		var mag = Math.abs(swipe.delta); 
		if (mag > swipe.ScrollThreshold && settings.AllowMomentum) {
			// Animate to either end
			var velocity = swipe.delta / (e.timeStamp-swipe.lastTime),
				travel = velocity * swipe.ScrollScale,
				move = keepInBounds(swipe.at+travel, true);

			swipe.scrollTo = move[0];

			var factor = (move[1] != 0) ? move[1]/travel : 1;
			
			// Add transition ease
			animate(swipe.scrollTo, factor*settings.ease);
			swipe.animating = true;
		}
	},

	touchMove = function(e){
		if(!swipe.animating) {
			var pageX = swipe.isIOS5 ? e.pageX : e.touches[0].pageX,
				pageY = swipe.isIOS5 ? e.pageY : e.touches[0].pageY;

			// Ensure Vertical Motion
			var dX = pageX-swipe.startX,
				dY = pageY-swipe.startY;
			// For detecting swipe
			var touch = (!swipe.Slider) ? pageY : pageX,
				ratio = (!swipe.Slider) ? dY/dX : dX/dY;

			swipe.delta = touch - swipe.lastTouch;
			swipe.lastTouch = touch;
			swipe.lastTime = e.timeStamp;
		  
		  	// Only move when vertical motion exceeds horizontal
			if((Math.abs(swipe.delta) > 2 || Math.abs(ratio) > 3) && ((swipe.At + dY) > swipe.limitEnd)) {
		  		// Always run this so that hit the ends
				swipe.scrollTo = keepInBounds(swipe.At + dY);
		  		animate(swipe.scrollTo,'none');
			}
		}
		e.preventDefault();
	},

	animate = function(scrollTo, ease) {
		// Momentum Effect or Not
		var transition = (ease!='none') ? '-webkit-transform '+ease+'s cubic-bezier(0, 0, 0.45, 1)' : 'none';
		$parent[0].style.webkitTransition = transition;

		// Move the element
		var target = (!swipe.Slider) ? '0,'+scrollTo+'px' : scrollTo+'px,0';
		$parent[0].style.webkitTransform = 'translate3d('+target+',0)';
	},

	redefineParent = function() {  // Won't work unless self.element is reattached since may be overwritten by new modal contents
		swipe.limitEnd = (!settings.Slider) ? $parent[0].parentNode.clientHeight - $parent[0].clientHeight : $parent[0].parentNode.clientWidth - $parent[0].clientWidth;
		animate(0, 'none');
	},

	getPosition = function() {
		// Get current point and Stay there
		var style = document.defaultView.getComputedStyle($parent[0], null),
			transform = new WebKitCSSMatrix(style.webkitTransform);

		// Return position based on direction
		if ( !settings.Slider ) {
			return transform.m42;
		} else {
			return transform.m41;
		}
	},

	keepInBounds = function(dest, needDiff) {
		var diff = 0;
		if (dest > 0 || dest < swipe.limitEnd ) {
			if ( dest < 0 ) {
				dest = swipe.limitEnd;
			} else {
				dest = 0;
			}
			diff = dest - swipe.at;
		}
		if ( typeof needDiff != 'undefined' ) {
			return [dest, diff];
		}
		return dest;
	};

	// Run initialization
	init(options);

	// Public methods/properties
	return {

	};
  
}
