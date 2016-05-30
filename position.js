var position = {
	highlight: /div\.area\.item|\.i-headTopRow|\.i-headMenu/,
	contentSelector: 'div, p, h1, h2, h3, h4, li, dt, dd, img',
	uiScale: 0.1,
	ui: {
		screen: 'pos-screen',
		avail: 'pos-avail',
		window: 'pos-window',
		inner: 'pos-inner',
		scrollX: 'pos-scrollX',
		scrollY: 'pos-scrollY',
		html: 'pos-html',
		body: 'pos-body',
		content: 'pos-content',
		mouseClient: 'pos-mouseClient',
		mouseInner: 'pos-mouseInner',
		mouse: 'pos-mouse',
	},
	deltaScrollX: 0,
	deltaScrollY: 0,
	innerScreenX: 0,
	innerScreenY: 0,
	init: function() {
		var self = this;
		function update() {
			self.render(self.getSizes());

			self.ui.screen.style.left = (window.scrollX || window.pageXOffset || 0) + (window.innerWidth - self.ui.screen.offsetWidth) / 2 + 'px';
			self.ui.screen.style.top = (window.scrollY || window.pageYOffset || 0) + (window.innerHeight - self.ui.screen.offsetHeight) / 2 + 'px';
		}

		function scroll(e) {
			update();
			self.renderContent(self.getContent());
		}

		function resize(e) {
			update();
			self.renderContent(self.getContent());
		}

		function mousemove(e) {
			var screenScale = self.getScreenScale();
			var innerScale = self.getInnerScale();

			self.deltaScrollX = e.pageX - e.clientX - window.scrollX;
			self.deltaScrollY = e.pageY - e.clientY - window.scrollY;
			self.innerScreenX = e.screenX / window.devicePixelRatio - e.clientX;
			self.innerScreenY = e.screenY / window.devicePixelRatio - e.clientY;

			self.render(self.getSizes());

			self.render({
				mouseClient: {
					left: e.pageX * innerScale,
					top: e.pageY * innerScale
				},
				mouseInner: {
					left: e.clientX * innerScale,
					top: e.clientY * innerScale
				},
				mouse: {
					left: e.screenX,
					top: e.screenY
				}
			});
		}

		this.createDivs(this.ui);

		this.ui.screen.appendChild(this.ui.avail);

		this.ui.screen.appendChild(this.ui.window);
		this.ui.window.appendChild(this.ui.inner);
		this.ui.inner.appendChild(this.ui.html);
		this.ui.inner.appendChild(this.ui.scrollX);
		this.ui.inner.appendChild(this.ui.scrollY);
		this.ui.html.appendChild(this.ui.body);
		this.ui.html.appendChild(this.ui.content);

		this.ui.html.appendChild(this.ui.mouseClient);
		this.ui.inner.appendChild(this.ui.mouseInner);
		this.ui.screen.appendChild(this.ui.mouse);

		this.ui.screen.style.position = 'absolute';
		this.ui.screen.style.zIndex = 9001;
		document.body.appendChild(this.ui.screen);

		this.ui.inner.addEventListener('click', function(){
			self.ui.inner.classList.toggle('pos-overflow');
		}, false);

		window.addEventListener('scroll', scroll, false);
		window.addEventListener('resize', resize, false);
		window.addEventListener('mousemove', mousemove, false);

		update();
		this.renderContent(self.getContent());
	},
	createDivs: function(elements) {
		for (var element in elements) {
			var className = elements[element];

			elements[element] = document.createElement('div');
			elements[element].className = className;
		}

		return elements;
	},
	render: function(sizes) {
		for (var el in sizes) {
			for (var prop in sizes[el]) {
				this.ui[el].style[prop] = Math.round(sizes[el][prop] * this.uiScale) + 'px';
			}

			if (sizes[el].width || sizes[el].height) {
				this.ui[el].setAttribute('data-size', Math.round(sizes[el].width) + 'x' + Math.round(sizes[el].height));
			}
		}
	},
	renderContent: function(content) {
		var self = this;
		var contentHtml = content.map(function(el){
			var selector = el.tagName + (el.id ? '#' + el.id : '') + (el.className ? el.className.replace(/^|\s/g, '.') : '');

			var className = 'pos-tag pos-tag_' + el.tagName;

			if (self.highlight && self.highlight.test(selector)) {
				className += ' pos-tag_highlight';
			}

			var style = self.makeStyle({
				left: Math.round(el.left * self.uiScale) + 'px',
				top: Math.round(el.top * self.uiScale) + 'px',
				width: Math.round(el.width * self.uiScale) + 'px',
				height: Math.round(el.height * self.uiScale) + 'px'
			});

			return self.makeTag('div', {
				'class': className,
				style: style,
				title: selector
			});
		}).join('');

		if (this.prevContentHtml !== contentHtml) {
			this.ui.content.innerHTML = this.prevContentHtml = contentHtml;
		}
	},
	makeStyle: function(styles) {
		var style = [];
		for (var name in styles) {
			style.push(name + ':' + styles[name]);
		}
		return style.join(';');
	},
	makeTag: function(tagName, attributes, content) {
		var tagAttributes = '';
		for (var key in attributes) {
			tagAttributes += ' ' + key + '="' + attributes[key] + '"';
		}
		return '<' + tagName + tagAttributes + '>' + (content || '') + '</' + tagName + '>';
	},
	getContentElements: function() {
		return [].filter.call(document.body.querySelectorAll(this.contentSelector), function(el){
			return !/\bpos-/.test(el.className);
		});
	},
	getContent: function() {
		var innerScale = this.getInnerScale();
		var htmlOffsets = document.documentElement.getBoundingClientRect();

		return this.getContentElements().map(function(el){
			var offsets = el.getBoundingClientRect();

			return {
				left: (offsets.left - htmlOffsets.left) * innerScale,
				top: (offsets.top - htmlOffsets.top) * innerScale,
				width: offsets.width * innerScale,
				height: offsets.height * innerScale,
				id: el.id,
				className: el.className,
				tagName: el.tagName.toLowerCase()
			};
		});
	},
	getContentFallback: function() {
		var self = this;
		var innerScale = this.getInnerScale();

		return this.getContentElements().map(function(el){
			var position = self.getPosition(el);

			if (el.style.position === 'fixed') {
				position.left += window.scrollX;
				position.top += window.scrollY;
			}

			return {
				left: position.left * innerScale,
				top: position.top * innerScale,
				width: el.offsetWidth * innerScale,
				height: el.offsetHeight * innerScale,
				id: el.id,
				className: el.className,
				tagName: el.tagName.toLowerCase()
			};
		});
	},
	getPosition: function(el) {
		var position = {
			left: 0,
			top: 0,
		};

		do {
			position.left += el.offsetLeft;
			position.top += el.offsetTop;
		} while (el = el.offsetParent);

		return position;
	},
	getZoom: function() {
		return document.documentElement.clientWidth / window.innerWidth;
	},
	getScale: function() {
		return window.innerWidth / (window.outerWidth || screen.width);
	},
	getScreenScale: function() {
		return window.devicePixelRatio;
	},
	getInnerScale: function() {
		return this.getScreenScale() / this.getScale();
	},
	getSizes: function() {
		var sizes = {};

		var screenScale = this.getScreenScale();
		var innerScale = this.getInnerScale();

		sizes.screen = {
			width: screen.width * screenScale,
			height: screen.height * screenScale
		};

		sizes.avail = {
			left: screen.availLeft * screenScale,
			top: screen.availTop * screenScale,
			width: screen.availWidth * screenScale,
			height: screen.availHeight * screenScale
		};

		var screenX = window.screenX || window.screenLeft || 0;
		var screenY = window.screenY || window.screenTop || 0;
		sizes.window = {
			left: screenX * screenScale,
			top: screenY * screenScale,
			width: window.outerWidth * screenScale,
			height: window.outerHeight * screenScale
		};

		//var innerScreenX = window.mozInnerScreenX || this.innerScreenX - this.deltaScrollX;
		//var innerScreenY = window.mozInnerScreenY || this.innerScreenY - this.deltaScrollY;

		var innerLeft = window.mozInnerScreenX ? window.mozInnerScreenX - screenX : 0;
		var innerTop = window.mozInnerScreenY ? window.mozInnerScreenY - screenY : 0;

		if (!innerLeft || !innerTop) {
			//innerLeft = this.innerScreenX - screenX;
			//innerTop = this.innerScreenY - screenY;

			//innerLeft = (window.outerWidth - window.innerWidth) * innerScale;
			//innerTop = (window.outerHeight - window.innerHeight) * innerScale;
		}

		sizes.inner = {
			left: innerLeft * innerScale,
			top: innerTop * innerScale,
			width: window.innerWidth * innerScale,
			height: window.innerHeight * innerScale
		};

		sizes.html = {
			left: -window.scrollX * innerScale,
			top: -window.scrollY * innerScale,
			width: document.documentElement.scrollWidth * innerScale,
			height: document.documentElement.scrollHeight * innerScale
		};

		/*
		var scrollXPercent = Math.min(1, document.documentElement.clientWidth / document.documentElement.scrollWidth);
		sizes.scrollX = {
			left: window.scrollX * scrollXPercent * innerScale,
			width: window.innerWidth * scrollXPercent * innerScale,
			//height: window.innerHeight - document.documentElement.clientHeight
			height: 10,
		};

		var scrollYPercent = Math.min(1, document.documentElement.clientHeight / document.documentElement.scrollHeight);
		sizes.scrollY = {
			top: window.scrollY * scrollYPercent * innerScale,
			height: window.innerHeight * scrollYPercent * innerScale,
			//width: window.innerWidth - document.documentElement.clientWidth
			width: 10,
		};
		*/

		var htmlOffsets = document.documentElement.getBoundingClientRect();
		var bodyOffsets = document.body.getBoundingClientRect();
		sizes.body = {
			left: (bodyOffsets.left - htmlOffsets.left) * innerScale,
			top: (bodyOffsets.top - htmlOffsets.top) * innerScale,
			width: document.body.clientWidth * innerScale,
			height: document.body.clientHeight * innerScale
		};

		return sizes;
	}
}

position.init();