/*

Scrollex.js
by Alex Lea

Requires Zepto.js or JQuery

Target requirements: Parent must have set width/height.  Must only be one child element.

Usage: 
var scroller = new Scrollex(<element>, {<settings>});
*/

var Scrollex = function(selector, options) {

	/*------- Globals -------*/

	var animating = false,
		orientation = 0;

	// Swiping
	var swipe = {
		startX : 0,
		startY : 0,
		endX : 0,
		endY : 0,
		goTo : 0,
		at : 0,
		delta : 0,
		lastTouch : 0,
		lastTime : 0,
		limitEnd : 0
	};

	// Settings
	var settings = {
		width : 0,
		ease : 1.5,
		scrollScale : 500,
		vertical : true,
		scrollThreshold : 7,
		scrollScale : 500,  // pixels per second
		allowMomentum : true,
		swipeThreshold : 15
	};

	/*------- Handles -------*/
	
	var el = selector,
		$element = $(selector);
	
	/*------- Methods -------*/

	var init = function(options) {
		// Exit if element doesn't exist
		if ( $element.length == 0 ) return;

		// Merge settings
		settings = $.extend(settings, options || {});

		// Initialize width if set
		if ( settings.width > 0 ) {
			$element.width(settings.width);
		}

		// Initialize limit end
		swipe.limitEnd = settings.vertical ? $element[0].parentNode.clientHeight-$element[0].clientHeight : $element[0].parentNode.clientWidth-$element[0].clientWidth;
		
		// Don't continue if element doesn't exceed viewport.
		if ( swipe.limitEnd > 0 ) return;

		// Prepare for Animation
		$element[0].style.webkitTransition = 'none';
		$element[0].style.webkitTransform = 'translate3d(0,0,0)';

		// Listeners
		$element[0].addEventListener('touchstart', function(e) { touchStart(e); }, false);
		$element[0].addEventListener('touchmove', function(e) { touchMove(e); }, false);
		$element[0].addEventListener('touchend', function(e) { touchEnd(e); }, false);
		// Desktop
		$element[0].addEventListener('mousedown', function(e) { touchStart(e); }, false);
		$element[0].addEventListener('mousemove', function(e) { if (e.which==1) { touchMove(e); } }, false);
		$element[0].addEventListener('mouseup', function(e) { touchEnd(e); }, false);

		// Prevent anchor tags from getting in the way
		$('a', el).on('touchstart click', function(){
			return animating ? false : true;
		});

		// Prevent image dragging on getting in the way
		$('img', el).on('dragstart', function(){
			return false;
		});

		// Check if Android
		var ua = navigator.userAgent.toLowerCase(),
			isAndroid = ua.indexOf("android") > -1;

		// Orientation Change
		var supportsOrientationChange = "onorientationchange" in window,
			orientationEvent = (supportsOrientationChange && !isAndroid) ? "orientationchange" : "resize";

		// Listener for orientation changes
		window.addEventListener(orientationEvent, function(){
			// Prevent 'fake' orientation calls
			if ( orientation != window.orientation ) {
				orientation = window.orientation;
				redefineParent();
			}
		}, false);
	},

	touchStart = function(e) {
		swipe.startX = e.touches ? e.touches[0].pageX : e.pageX;
		swipe.startY = e.touches ? e.touches[0].pageY : e.pageY;
		swipe.lastTouch = swipe.startY;  // prevents reverse momentum for quick touches

		if ( animating ) {
			// Prevent links from activating
			e.preventDefault();
			
			// Stay at current point
			swipe.goTo = getPosition();
			animate(swipe.goTo,'none');
			swipe.delta = 0;  // reset so doesn't continue scroll motion.

			// Allow scrolling again
			animating = false;
		}
		
		swipe.at = getPosition();  // for touch move
	},

	touchMove = function(e){
		if ( !animating ) {

			var pageX = e.touches ? e.touches[0].pageX : e.pageX,
				pageY = e.touches ? e.touches[0].pageY : e.pageY;

			// Ensure Vertical Motion
			var dX = pageX - swipe.startX,
				dY = pageY - swipe.startY,
				moved = swipe.at + (settings.vertical ? dY : dX);

			// For detecting swipe
			var touch = settings.vertical ? pageY : pageX,
				ratio = settings.vertical ? dY/dX : dX/dY;

			swipe.delta = touch - swipe.lastTouch;
			swipe.lastTouch = touch;
			swipe.lastTime = e.timeStamp;

		  	// Only move when vertical motion exceeds horizontal
			if ( (Math.abs(swipe.delta) > 2 || Math.abs(ratio) > 3) && moved > swipe.limitEnd ) {
		  		// Always run this so that hit the ends
				swipe.goTo = keepInBounds(moved);
		  		animate(swipe.goTo, 'none');
			}
		}

		e.preventDefault();
	},

	touchEnd = function(e) {
		// Detect if is Swipe
		var mag = Math.abs(swipe.delta);
		if ( mag > settings.scrollThreshold && settings.allowMomentum ) {
			// Animate to either end
			var velocity = swipe.delta / (e.timeStamp-swipe.lastTime),
				travel = velocity * settings.scrollScale,
				move = keepInBounds(swipe.at+travel, true);

			swipe.goTo = move[0];

			var factor = (move[1] != 0) ? move[1]/travel : 1;
			
			// Add transition ease
			animate(swipe.goTo, factor*settings.ease);
		}
	},

	animate = function(scrollTo, ease) {
		// Momentum Effect or Not
		var transition = ( ease != 'none' ) ? '-webkit-transform '+ease+'s cubic-bezier(0, 0, 0.45, 1)' : 'none';
		$element[0].style.webkitTransition = transition;

		// Move the element
		var moveTo = settings.vertical ? '0,'+scrollTo+'px' : scrollTo+'px,0';
		$element[0].style.webkitTransform = 'translate3d('+moveTo+',0)';
	},

	redefineParent = function() {  // Won't work unless self.element is reattached since may be overwritten by new modal contents
		swipe.limitEnd = settings.vertical ? $element[0].parentNode.clientHeight-$element[0].clientHeight : $element[0].parentNode.clientWidth-$element[0].clientWidth;
		animate(0, 'none');
	},

	getPosition = function() {
		// Get current point and Stay there
		var style = document.defaultView.getComputedStyle($element[0], null),
			transform = new WebKitCSSMatrix(style.webkitTransform);

		// Return position based on direction
		return settings.vertical ? transform.m42 : transform.m41;
	},

	keepInBounds = function(dest, needDiff) {		
		// This is actually when it goes out of bounds
		if (dest > 0 ) {
			dest = 0;
		} else if ( dest < swipe.limitEnd ) {
			dest = swipe.limitEnd;
		}

		return (typeof needDiff != 'undefined') ? [dest, dest-swipe.at] : dest;
	};

	// Run initialization
	init(options);

	// Public methods/properties
	return {
		element : $element,

		animate : animate,

		animating : function() {
			return animating;
		},
	};

}