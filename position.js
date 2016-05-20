var position = {
	contentSelector: 'div, p, h1, h2, h3, h4, li, dt, dd, img',
	elementsScale: 0.2,
	elements: {
		screen: 'pos-screen',
		mouse: 'pos-mouse',
		avail: 'pos-avail',
		window: 'pos-window',
		inner: 'pos-inner',
		scrollX: 'pos-scrollX',
		scrollY: 'pos-scrollY',
		html: 'pos-html',
		body: 'pos-body',
		content: 'pos-content'
	},
	deltaScrollX: 0,
	deltaScrollY: 0,
	innerScreenX: 0,
	innerScreenY: 0,
	init: function() {
		var self = this;
		function update() {
			self.render(self.getSizes());

			self.elements.screen.style.left = window.scrollX + (window.innerWidth - self.elements.screen.offsetWidth) / 2 + 'px';
			self.elements.screen.style.top = window.scrollY + (window.innerHeight - self.elements.screen.offsetHeight) / 2 + 'px';
		}

		function scroll(e) {
			update();
		}

		function resize(e) {
			update();
			self.renderContent(self.getContent());
		}

		function mousemove(e) {
			self.deltaScrollX = e.pageX - e.clientX - window.scrollX;
			self.deltaScrollY = e.pageY - e.clientY - window.scrollY;
			self.innerScreenX = e.screenX / window.devicePixelRatio - e.clientX;
			self.innerScreenY = e.screenY / window.devicePixelRatio - e.clientY;
			self.render(self.getSizes());

			self.elements.mouse.style.left = e.screenX / window.devicePixelRatio * self.elementsScale + 'px';
			self.elements.mouse.style.top = e.screenY / window.devicePixelRatio * self.elementsScale + 'px';
		}

		this.createElements(this.elements);

		this.elements.screen.appendChild(this.elements.avail);

		this.elements.screen.appendChild(this.elements.window);
		this.elements.window.appendChild(this.elements.inner);
		this.elements.inner.appendChild(this.elements.html);
		this.elements.inner.appendChild(this.elements.scrollX);
		this.elements.inner.appendChild(this.elements.scrollY);
		this.elements.html.appendChild(this.elements.body);
		this.elements.html.appendChild(this.elements.content);

		this.elements.screen.appendChild(this.elements.mouse);

		this.elements.screen.style.position = 'absolute';
		this.elements.screen.style.zIndex = 9001;
		document.body.appendChild(this.elements.screen);

		this.elements.inner.addEventListener('click', function(){
			self.elements.inner.classList.toggle('pos-overflow');
		}, false);
		
		window.addEventListener('scroll', scroll, false);
		window.addEventListener('resize', resize, false);
		window.addEventListener('mousemove', mousemove, false);
		update();

		this.renderContent(self.getContent());
	},
	createElements: function(elements) {
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
				this.elements[el].style[prop] = sizes[el][prop] * this.elementsScale + 'px';
			}
		}
	},
	renderContent: function(content) {
		var self = this;
		var scale = self.elementsScale / (window.devicePixelRatio * this.getZoom());
		var tags = [].map.call(content, function(el){
			var styles = {
				left: Math.round(el.left * scale) + 'px',
				top: Math.round(el.top * scale) + 'px',
				width: Math.round(el.width * scale) + 'px',
				height: Math.round(el.height * scale) + 'px'
			};
			var title = el.tagName + (el.id ? '#' + el.id : '') + (el.className ? el.className.replace(/^|\s/g, '.') : '');
			return '<div class="pos-tag pos-tag_' + el.tagName + '" style="' + self.makeStyle(styles) + '" title="' + title + '"></div>';
		});
		//console.log(tags);
		this.elements.content.innerHTML = tags.join('');
	},
	makeStyle: function(styles) {
		var style = [];
		for (var name in styles) {
			style.push(name + ':' + styles[name]);
		}
		return style.join(';');
	},
	getContent: function() {
		var self = this;
		var elements = document.body.querySelectorAll(this.contentSelector);
		//console.log(elements.length);
		var content = [].map.call(elements, function(el){
			if (/\bpos-/.test(el.className))
				return;

			var position = self.getPosition(el);
			if (el.style.position === 'fixed') {
				position.left += window.scrollX;
				position.top += window.scrollY;
			}
			position.width = el.offsetWidth;
			position.height = el.offsetHeight;
			position.id = el.id;
			position.className = el.className;
			position.tagName = el.tagName.toLowerCase();
			return position;
		});
		return content.filter(function(el){ return !!el; });
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
	getScale: function() {
		var scale = document.documentElement.clientWidth / window.innerWidth;
		var delta = document.documentElement.clientWidth - window.innerWidth;

		if (1 - scale < 0.04 && delta < 30) {
			scale = 1;
		}

		//console.log(scale);

		return scale;
	},
	getZoom: function() {
		//return 1;
		return window.innerWidth / window.outerWidth;
	},
	getSizes: function() {
		var sizes = {};
		//var scale = this.getScale();
		//document.documentElement.clientWidth;
		//window.innerWidth;
		var zoom = this.getZoom();
		var screenScale = window.devicePixelRatio;
		var innerScale = screenScale * zoom;

		sizes.screen = {
			width: screen.width / screenScale,
			height: screen.height / screenScale
		};

		sizes.avail = {
			left: screen.availLeft / screenScale,
			top: screen.availTop / screenScale,
			width: screen.availWidth / screenScale,
			height: screen.availHeight / screenScale
		};

		var screenX = window.screenX || window.screenLeft || 0;
		var screenY = window.screenY || window.screenTop || 0;
		sizes.window = {
			left: screenX / screenScale,
			top: screenY / screenScale,
			width: window.outerWidth / screenScale,
			height: window.outerHeight / screenScale
		};

		var innerScreenX = window.mozInnerScreenX || this.innerScreenX - this.deltaScrollX;
		var innerScreenY = window.mozInnerScreenY || this.innerScreenY - this.deltaScrollY;
		sizes.inner = {
			//left: innerScreenX ? innerScreenX - screenX : 0,
			//top: innerScreenY ? innerScreenY - screenY : 0,
			width: window.innerWidth / innerScale,
			height: window.innerHeight / innerScale
		};

		sizes.html = {
			left: -window.scrollX / innerScale,
			top: -window.scrollY / innerScale,
			width: document.documentElement.scrollWidth / innerScale,
			height: document.documentElement.scrollHeight / innerScale
		};

		/*
		sizes.scrollX = {
			left: window.scrollX * document.documentElement.clientWidth / document.documentElement.scrollWidth,
			width: window.innerWidth * document.documentElement.clientWidth / document.documentElement.scrollWidth,
			height: window.innerHeight - document.documentElement.clientHeight
		};
		
		sizes.scrollY = {
			top: window.scrollY * document.documentElement.clientHeight / document.documentElement.scrollHeight,
			height: window.innerHeight * document.documentElement.clientHeight / document.documentElement.scrollHeight,
			width: window.innerWidth - document.documentElement.clientWidth
		};

		/*
		var bodyOffsets = document.body.getBoundingClientRect();
		sizes.body = {
			left: bodyOffsets.left + window.scrollX,
			top: bodyOffsets.top + window.scrollY,
			width: document.body.clientWidth,
			height: document.body.clientHeight
		};
		*/

		return sizes;
	}
}

position.init();