# Scrollex.js

**Requires jQuery/Zepto**

Momentum scroller for touch enabled devices.  Currently supports WebKit devices only.  [Check out the demo](http://dezignhero.github.io/scrollex.js/).

## Introduction

Scrollex.js is a scroller for webkit browsers and PhoneGap applications to simulate the scrolling momentum of an iPhone.  It also supposed drag-scrolling.  The goal is a quick and smooth swiping experience on modern browsers.  I took advantage of -webkit-transition and -webkit-transform: translate3d(x,0,0) to achieve this.  Translate3d is graphically accelerated, which is why it is smoother than using absolute positioning and left/right properties.

## Features

* Smooth scrolling momentum.
* Swipe detection on mobile devices
* Moderate Size
* Configurable animating settings