(function() {
    // Kudos to Erik Möller from Opera for this rAF shim
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0, l=vendors.length; x < l && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame &&
    	!window.mozRequestAnimationFrame &&
    	!window.webkitRequestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
(function(window, document, undefined) {

	var body = document.body; // shorthand reference

	// Everybody needs an each-Function. Now I know, why 
	// every single library offers one. It's indeed really
	// useful
	var each = function (list, iterator, context, r) {
		if (list && list.length) {
			for (var i=0, l=list.length; i<l; i++) {
				if ((r = iterator.call(context, i, list[i])) && typeof r === "boolean") {
					return list[i];
				}
			}
		} else if (typeof list === "object") {
			for (var i in list) {
				if (list.hasOwnProperty(i)) {
					if ((r = iterator.call(context, i, list[i])) && typeof r === "boolean") {
						return list[i];
					}
				}
			}
		}
	};

	// This will look through your list and search for obj.
	// It gives back the index or -1, if it couldn't find
	// anything.
	var find = function (list, obj) {
		var index = -1;
		if (list.indexOf) {
			index = list.indexOf(obj);
		} else {
			each(list, function (i,o) {
				if (o === obj) {
					index = i;
					return true;
				}
			}, this);
		}
		return index;
	};

	// Binds a function to a context. Like jQuery.proxy.
	// Uses the native bind if available
	var bind = function (fn, context) {
		if (Function.prototype.bind && fn instanceof Function && fn.bind === Function.prototype.bind) {
			return fn.bind(context);
		}
		var slice = Array.prototype.slice;
		args && args.splice || (args = []);
		return function() {return fn.apply(context, args.concat(slice.call(arguments)));};
	}

	/**
	 * Borrowed from h5utils.js and altered.
	 */
	var listOfAttachedEvents = {}; // This is for old IE's. Just keep on reading.
	var addEvent = (function () {
	  if (document.addEventListener) {
	    return function (el, type, fn, captures) {
	      if (el && el.nodeName || el === window) {
	        el.addEventListener(type, fn, !!captures);
	      } else if (el && el.length) {
	      	each(el, function (i, e) {
	      		addEvent(e,type,fn);
	      	}, this);
	      }
	    };
	  } else {
	    return function (el, type, fn, captures) {
	      if (el && el.nodeName || el === window) {
	      	// Now, here we go. Instead of adding fn as the listener,
	      	// we're creating our own function which eventually calls
	      	// fn. However, We can't call detachEvent('on'+type, fn),
	      	// because fn is not the listener we attached.
	      	// That's why we're storing our listener-Functions. Later, 
	      	// when we want to detach a function, we filter it out of
	      	// the listOfAttachedEvents and can detach it then.
	      	var listener = function () { return fn.call(el, window.event); };
	      	if (!listOfAttachedEvents[type]) {
	      		listOfAttachedEvents[type] = [];
	      	}
	      	listOfAttachedEvents[type].push({
	      		index: listOfAttachedEvents[type].length,
	      		element: el,
	      		fn: fn,
	      		listener: listener
	      	})
	        el.attachEvent('on' + type, listener);
	      } else if (el && el.length) {
	      	each(el, function (i, e) {
	      		addEvent(e, type, fn);
	      	}, this);
	      }
	    };
	  }
	})();

	var removeEvent = (function () {
		if (document.removeEventListener) {
			return function (el, type, fn) {
				if (el && el.nodeName || el === window) {
					el.removeEventListener(type, fn, false);
				} else if (el && el.length) {
					each(el, function (i, e) {
						removeEvent(e, type, fn);
					}, this);
				}
			}
		} else {
			return function (el, type, fn) {
				if (el && el.nodeName || el === window) {
					if (listOfAttachedEvents[type]) {
						var listener = each(listOfAttachedEvents[type], function (i,e) {
							if (e) {
								return e.element === el && e.fn === fn;
							}
						}, this);
						if (!listener) return;
						delete listOfAttachedEvents[type][listener.index];
						el.detachEvent('on' + type, listener.listener);
					}
				}
			}
		}
	})();

	var triggerEvent = (function () {
		var delay = 0;
		if (document.createEvent) {
			return function (el, event) {
				event.target = el;
				// When this function is called, the event is still bubbling
				// up the DOM tree. The browser is probably throwing an error,
				// because you can't trigger an event while it's still in the
				// DOM Tree, this could cause recursions. That's why we defer
				// the dispatching of this event until after the current call
				// stack has cleared.
				setTimeout(function () {
					try {
						el.dispatchEvent(event);
					} catch (e) {
						// Not good. Probably a DISPATCH_REQUEST_ERR.
						// Try fixing it by increasing the delay. But
						// let the current event go to waste, until
						// we fixed this with a better practice.
						delay++;
					}
				}, delay);
			}
		} else {
			return function (el, event) {
				event.target = el;
				setTimeout(function () {
					try {
						el.fireEvent("on" + event.type, event);
					} catch (e) {
						delay++;
					}
				}, delay)
			}
		}
	})();

	var requestAnimationFrame = (function() {
		return window.requestAnimationFrame ||
		// Should be available because of the 
		// polyfill above, but for dependencies
		// sake we implement fallbacks
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			function (callback) {
				return setTimeout(function() {
					callback();
				}, 1000/60);
			}
	})();

	var currentStyle = function (node) {
		if (node && node.nodeType === 1) {
			return window.getComputedStyle ? window.getComputedStyle(node,null) : node.currentStyle ? node.currentStyle : {};
		}
		return {};
	}

	/**
	 * Calculates the position of an element relative to one of it's parents.
	 * @param node (DOMNode) The node you want to retrieve the position of.
	 * @param relativeTo (DOMNode) The parent node the position is relative to.
	 */
	var relativePosition = function (node, relativeTo) {
		var top, left;
		if (node && node.nodeType === 1 && node.offsetParent) {
			relativeTo || (relativeTo = body);
			top = node.offsetTop, left = node.offsetLeft;
			var curNode = node, offsetParent = node.offsetParent;
			while (curNode && curNode !== body) {
				if (curNode === offsetParent) {
					top += curNode.offsetTop;
					left += curNode.offsetLeft;
					offsetParent = curNode.offsetParent;
				}
				if (curNode === relativeTo) {
					top -= relativeTo.offsetTop;
					left -= relativeTo.offsetLeft;
					break;
				}
				curNode = curNode.parentNode;
			}
		}
		return {
			"top": top,
			"left": left
		}
	};

	var measures = function (node) {
		var res = {
			relativeTop: 0, // referring to the document
			relativeLeft: 0,
			relativeBottom: 0,
			relativeRight: 0,
			absoluteTop: 0, // referring to the viewport
			absoluteLeft: 0,
			absoluteBottom: 0,
			absoluteRight: 0,
			width: 0,
			height: 0,
			children: [],
			node: node
		};
		if (node && node.nodeType === 1 && node.offsetParent) {
			res.width = node.offsetWidth;
			res.height = node.offsetHeight;

			var position = relativePosition(node);
			res.relativeTop = position.top;
			res.relativeLeft = position.left;

			var pageYOffset = window.pageYOffset, pageXOffset = window.pageXOffset;
			res.absoluteTop = res.relativeTop - pageYOffset;
			res.absoluteLeft = res.relativeLeft - pageXOffset;

			res.relativeRight = res.relativeLeft + res.width;
			res.relativeBottom = res.relativeTop + res.height;
			res.absoluteRight = res.absoluteLeft + res.width;
			res.absoluteBottom = res.absoluteTop + res.height;

			if (node.childNodes.length) {
				for (var i = 0, children = node.childNodes, l=children.length, child, m; i<l; i++) {
					if ((child = children[i]) && child.nodeType === 1) {
						m = relativePosition(child, node);
						m.width = child.offsetWidth;
						m.height = child.offsetHeight;
						m.right = m.left + m.width;
						m.bottom = m.top + m.height;
						res.children.push(m);
					}
				}
			}
		}
		return res;
	}

	function testForCursorImageSupport() {
		var element = document.createElement("div"), styles, cursor;
		body.appendChild(element);
		element.style.cursor = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MkZCM0Q3MkQ1Njk0MTFFMkEzRUNENDk1OUE5QkRDNTQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MkZCM0Q3MkU1Njk0MTFFMkEzRUNENDk1OUE5QkRDNTQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyRkIzRDcyQjU2OTQxMUUyQTNFQ0Q0OTU5QTlCREM1NCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyRkIzRDcyQzU2OTQxMUUyQTNFQ0Q0OTU5QTlCREM1NCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PoFc8z4AAAAQSURBVHjaYvj//z8DQIABAAj8Av7bok0WAAAAAElFTkSuQmCC'), default";
		styles = currentStyle(node);
		cursor = styles.cursor;
		body.removeChild(element);
		return cursor && cursor !== "default";
	}

	var cursorImageSupport = testForCursorImageSupport(), prefix = "custom-cursor-";

	function CursorRegistry() {
		this.listOfNodes = [];
		this.listOfCursors = [];
	}
	CursorRegistry.prototype = {
		isCursor: function (cursor) {
			return cursor && cursor instanceof Cursor;
		},
		attachCursor: function (node, cursor) {
			if (node && node.nodeType === 1 && this.isCursor(cursor)) {
				var i = find(this.listOfNodes, node);
				if (i !== -1) {
					// This node already has a cursor attached to it
					var cursor = this.listOfCursors[i];
					cursor.removeElement(node);
				}
				this.listOfNodes.push(node);
				this.listOfCursors.push(cursor);
			}
		},
		detachCursor: function (node) {
			if (node && node.nodeType === 1) {
				var i = find(this.listOfNodes, node);
				if (i !== -1) {
					this.listOfNodes.splice(i, 1);
					this.listOfCursors.splice(i, 1);
				}
			}
		},
		destroy: function (cursor) {
			if (this.isCursor(cursor)) {
				cursor.removeElements(cursor.elements);
				delete cursor;
			}
		}
	};

	var cursorRegistry = new CursorRegistry();

	function Cursor(source, x, y) {
		this.cache = {
			regexp: {
				"html": /<?\w+\s+[^>]*>/,
				"filename": /[/]{0,1}([^/]+[/])*([^/]*)/
			}
		};
		this.setPosition(x,y);

		this.elements = []; // These are the elements that should have this cursor, when hovering over them

		this.type;
		this.source;
		this.setSource(source);

		this.scrollHappened = false;

		this.previousCursor = "default"; // Save the cursor, we're overwriting

		this._registerScroll = bind(this._registerScroll, this);
		this._showCursor = bind(this._showCursor, this);
		this._mousemove = bind(this._mousemove, this);
		this._followCursor = bind(this._followCursor, this);
		this._hideCursor = bind(this._hideCursor, this);
	}
	Cursor.prototype = {
		setPosition: function(x,y) {
			var previous = this.position || {};
			this.position = {
				x: typeof x === "number" ? x : (previous.x || 0),
				y: typeof y === "number" ? y : (previous.y || 0)
			}
			if (this.type === "html") {
				var style = this.source.style;
				style.marginTop = "-" + this.position.y + "px";
				style.marginLeft = "-" + this.position.x + "px";
			}
		},
		setSource: function (source, setOriginal) {
			if (source) {
				var type = this.type;
				if (setOriginal || !this.originalSource) {
					this.originalSource = source;
				}
				if (source.nodeType === 1) {
					// DOM Node
					if (cursorImageSupport && source.nodeName === "CANVAS") {
						// Canvas
						this.type = "img";
						this.source = source.toDataURL("image/png");
					} else if (cursorImageSupport && source.nodeName === "IMG") {
						// Img element
						this.type = "img";
						this.source = source.getAttribute("src");
					} else {
							this.type = "html";
						this.source = source;
					}
				} else if (typeof source === "string") {
					if (this.cache.regexp.html.test(source)) {
						// HTML Code. Turn it into a DOM Node
						var node = document.createElement("div");
						node.innerHTML = source;
						if (node.childNodes.length === 1) {
							// It was just one element we created
							// Maybe it's an Image or Canvas-Element
							return this.setSource(node.firstChild, false);
						} else {
							node.setAttribute("class", prefix + "wrapper");
							this.type = "html";
							this.source = node;
						}
					} else if (this.cache.regexp.filename.test(source)) {
						// A filename. We assume, it's the path to an image file
						if (cursorImageSupport) {
							this.type = "img";
							this.source = source;
						} else {
							this.type = "html";
							this.source = new Image();
							this.source.src = source;
						}
					}
				}

				if (this.type === "html") {
					var style = this.source.style;
					style.display = "none";
					style.cursor = "none";
					style.position = "fixed";
					style.marginTop = "-" + this.position.y + "px";
					style.marginLeft = "-" + this.position.x + "px";
					style.width = style.width || "auto";
					style.height = style.height || "auto";
					body.appendChild(this.source);

					// Our cursor is just a fake one. Clicks get caught on our
					// cursor instead of the target they were intended for. That's
					// why we're catching these events and forward them
					each("mousedown mousemove mouseup click".split(" "), function (i, type) {
						addEvent(this.source, type, bind(function (e) {
							if (this.currentTarget) {
								triggerEvent(this.currentTarget.node, e);
							}
						}, this));
					}, this);
				}

				if (this.elements.length && type !== this.type) {
					// There have already been elements associated with this cursor
					var elements = this.elements;
					this.elements = [];
					this.setElements(elements);
				}
			}
		},
		update: function () {
			if (this.originalSource) {
				this.setSource(this.originalSource);
			}
		},
		_isInRange: function (val, min, max) {
			return val >= min && val <= max;
		},
		_isPointInTarget: function(x,y, measures) {
			if (typeof x === "number" && typeof y === "number" && this.currentTarget) {
				var m = this.currentTarget;
				var isPointInBoundingBox = this._isInRange(x, m.absoluteLeft, m.absoluteRight) && this._isInRange(y, m.absoluteTop, m.absoluteBottom);
				if (isPointInBoundingBox && m.children && m.children.length) {
					for (var i=0, c=m.children, l=m.children.length; i<l; i++) {
						if (this._isInRange(x, m.absoluteLeft + c[i].left, m.absoluteLeft + c[i].right)
							&& this._isInRange(y, m.absoluteTop + c[i].top, m.absoluteTop + c[i].bottom)) {
							return false; // Point is in child element
						}
					}
				}
				return isPointInBoundingBox;
			}
		},
		_registerScroll: function() {
			this.scrollHappened = true;
		},
		_showCursor: function (e) {
			if (this.source && this.type === "html" && find(this.elements, e.target) !== -1) {
				this.currentTarget = measures(e.target);
				if (this._isPointInTarget(e.clientX, e.clientY)) {
					removeEvent(e.target, "mousemove", this._showCursor);

					this.previousCursor = currentStyle(e.target).cursor;
					e.target.style.cursor = "none";

					var style = this.source.style;
					style.display = "block";
					style.cursor = "none";
					style.left = e.clientX + "px";
					style.top = e.clientY + "px";

					addEvent(body, "mousemove", this._mousemove);
					addEvent(window, "scroll", this._registerScroll);
				}
			}
		},
		_mousemove: function(e) {
			this.e = e;
			requestAnimationFrame(this._followCursor);
		},
		_followCursor: function () {
			if (!this.currentTarget) return;
			if (this.scrollHappened) {
				// The user has scrolled
				// We assume that the target's dimensions haven't changed.
				// However, the absolute position of the target has changed.
				this.scrollHappened = false; // reset
				var pageYOffset = window.pageYOffset,
					pageXOffset = window.pageXOffset,
					currentTarget = this.currentTarget;
				currentTarget.absoluteTop = currentTarget.relativeTop - pageYOffset;
				currentTarget.absoluteBottom = currentTarget.absoluteTop + currentTarget.height;
				currentTarget.absoluteLeft = currentTarget.relativeLeft - pageXOffset;
				currentTarget.absoluteRight = currentTarget.absoluteLeft + currentTarget.width;
			}
			var e = this.e, style;
			if (this._isPointInTarget(e.clientX, e.clientY)) {
				style = this.source.style;
				style.left = e.clientX + "px";
				style.top = e.clientY + "px";
			} else {
				// The cursor has left the element
				// Maybe the element's position or dimensions have changed, let's check again. Just in case.
				var currentMeasures = this.currentTarget, different = false;
				this.currentTarget = measures(this.currentTarget.node);
				each(this.currentMeasures, function(i,a) {
					if (a !== currentMeasures[i]) {
						// Indeed! Something has changed
						return (different = true);
					}
				});
				if (different) {
					this._followCursor();
				} else {
					// The cursor has really left the element
					this._hideCursor();
				}
			}
		},
		_hideCursor: function (dontReattach) {
			removeEvent(body, "mousemove", this._mousemove);
			removeEvent(window, "scroll", this._registerScroll);

			var target = this.currentTarget.node,
				style = this.source.style,
				e = this.e;
			target.style.cursor = this.previousCursor;
			style.display = "none";
			style.left = "-" + this.currentTarget.width + "px";
			style.top = "-" + this.currentTarget.height + "px";

			e.type = "mouseout";
			triggerEvent(target, e);

			this.currentTarget = this.e = undefined; // reset this to undefined

			// We cleaned everything up.
			// Now, let's set up the initializer for the next time:
			if (!dontReattach) {
				addEvent(target, "mousemove", this._showCursor);
			}
		},
		setElement: function (node) {
			if (node && node.nodeType === 1 && find(this.elements, node) === -1) {
				// It's not among the elements we're working with
				this.elements.push(node); // add it to those elements
				cursorRegistry.attachCursor(node, this);

				if (cursorImageSupport && this.type === "img") {
					node.style.cursor = "url(" + this.source + ") " + this.position.x + " " + this.position.y + ", default";
				} else {
					addEvent(node, "mousemove", this._showCursor);
				}
			}
		},
		setElements: function (nodeList) {
			if (nodeList && nodeList.length) {
				each(nodeList, function (i,n) {
					this.setElement(n);
				}, this);
			}
		},
		removeElement: function (node) {
			if (node && node.nodeType === 1) {
				var i = find(this.elements, node);
				if (i !== -1) {
					// This cursor is indeed attached to this node 
					if (this.currentTarget && this.currentTarget.node === node) {
						// It's currently in use on this element
						try {
							this._hideCursor(true);
						} catch (e) {
							// Propably the event listeners being removed were the wrong ones?!
						}
					} else {
						// currently idle
						removeEvent(node, "mousemove", this._showCursor);
					}
					this.elements.splice(i,1);
					cursorRegistry.detachCursor(node);
				}
			}
		},
		removeElements: function (nodeList) {
			if (nodeList && nodeList.length) {
				each(nodeList, function (i,n) {
					this.removeElement(n);
				}, this);
			}
		},
		destroy: function () {
			cursorRegistry.destroy(this);
		}
	}

	window.CustomCursor = Cursor;
})(window, window.document);
