var position = {
	contentSelector: 'div, p, h1, h2, h3, h4, li, dt, dd, img',
	elementsScale: 0.2,
	elements: {
		screen: 'pos-screen',
		avail: 'pos-avail',
		window: 'pos-window',
		document: 'pos-document pos-overflow',
		html: 'pos-html',
		body: 'pos-body',
		content: 'pos-content'
	},
	init: function() {
		var self = this;
		function update() {
			self.render(self.getSizes());

			self.elements.screen.style.left = window.scrollX + (window.innerWidth - self.elements.screen.offsetWidth) / 2 + 'px';
			self.elements.screen.style.top = window.scrollY + (window.innerHeight - self.elements.screen.offsetHeight) / 2 + 'px';
		}

		this.createElements(this.elements);

		this.elements.screen.appendChild(this.elements.avail);

		this.elements.screen.appendChild(this.elements.window);
		this.elements.window.appendChild(this.elements.document);
		this.elements.document.appendChild(this.elements.html);
		this.elements.html.appendChild(this.elements.body);
		this.elements.html.appendChild(this.elements.content);

		this.elements.screen.style.position = 'absolute';
		this.elements.screen.style.zIndex = 9001;
		document.body.appendChild(this.elements.screen);

		this.elements.document.addEventListener('click', function(){
			self.elements.document.classList.toggle('pos-overflow');
		}, false);
		
		window.addEventListener('scroll', update, false);
		window.addEventListener('resize', update, false);
		update();

		this.renderContent();
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

		this.renderContent();
	},
	renderContent: function() {
		var self = this;
		var content = this.getContent();		
		var tags = [].map.call(content, function(el){
			var styles = {
				left: Math.round(el.left * self.elementsScale) + 'px',
				top: Math.round(el.top * self.elementsScale) + 'px',
				width: Math.round(el.width * self.elementsScale) + 'px',
				height: Math.round(el.height * self.elementsScale) + 'px'
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
		return window.innerWidth / window.outerWidth;
	},
	getSizes: function() {
		var sizes = {};

		sizes.screen = {
			width: screen.width,
			height: screen.height
		};

		sizes.avail = {
			left: screen.availLeft,
			top: screen.availTop,
			width: screen.availWidth,
			height: screen.availHeight
		};

		sizes.window = {
			left: window.screenX || window.screenLeft || 0,
			top: window.screenY || window.screenTop || 0,
			width: window.outerWidth,
			height: window.outerHeight
		};

		sizes.document = {
			left: window.mozInnerScreenX - window.screenX,
			top: window.mozInnerScreenY - window.screenY,
			width: window.innerWidth,
			height: window.innerHeight
		};

		sizes.html = {
			//left: -document.documentElement.scrollLeft,
			//top: -document.documentElement.scrollTop,
			left: -window.scrollX,
			top: -window.scrollY,
			width: document.documentElement.scrollWidth,
			height: document.documentElement.scrollHeight
		};

		var bodyOffsets = document.body.getBoundingClientRect();
		//console.log(bodyOffsets);
		sizes.body = {
			left: bodyOffsets.left + window.scrollX,
			top: bodyOffsets.top + window.scrollY,
			width: document.body.clientWidth,
			height: document.body.clientHeight
		};

		return sizes;
	}
}

position.init();