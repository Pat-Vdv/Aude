libD.need(['domEssential'], function(){
libD.getCSS('', 'w');
libD.w = {
	widget : function()
	{
		this.shown = this.hidden = false;
		this.parent = null;
		this.refWidget = this;
		this.title = '';
		this.win = null;
	}
};

libD.w.widget.prototype = {
	setTitle : function(t)
	{
		this.title = t;
		if(this.win)
			this.win.setTitle(t);
	},

	setIcon : function(icon)
	{
		this.icon = libD.getIcon(icon);
		if(this.win)
			this.win.setIcon(this.icon);
	},

	width : function(n)
	{
		if(this.dom)
		{
			if(typeof n === 'number')
				n = n + 'px';

			this.dom.style.width = n;
		}
	},

	height : function(n)
	{
		if(this.dom)
		{
			if(typeof n === 'number')
				n = n + 'px';

			this.dom.style.height = n;
		}
	},

	show : function(auto)
	{
		if(auto && this.hidden) return;

		if(this.parent)
		{
			this.dom.style.display = this.dom.style.visibility = null;
			this.hidden = false;
			this.shown = true;
		}
		else
		{
			var that = this;
			libD.need(['ws'], function()
			{
				var div = document.createElement('div');
				div.className = 'libDW-win';
				div.appendChild(that.dom);

				that.win = libD.newWin({
					title:that.title || that.text,
					content:div,
					show:true,
					icon:that.icon
				}, libD);

				libD.addClass(div, 'libD-ws-colors-auto');

				if(that.isLayout && that.win.ws.wm && that.win.ws.wm.handleSurface)
				{
					that.win.ws.wm.handleSurface(that.win, that.dom);
					that.win.ws.wm.handleSurface(that.win, div);
				}
//				that.ready();
			});
		}

		if(this.refWidget && this.refWidget.win && this.refWidget.win.ws.wm && this.refWidget.win.ws.wm.handleSurface)
		{
			if(this.dom._handlable)
				this.refWidget.win.ws.wm.handleSurface(this.win, this.dom);
			var children = this.dom.childNodes;
			for(var i in children)
			{
				if(children[i]._handlable)
					this.refWidget.win.ws.wm.handleSurface(this.refWidget.win, children[i]);
			}
		}
		
		if(this.layout)
			this.layout.show(true);
	},

	hide : function(keepSpace)
	{
		this.shown = false;
		this.hidden = true;

		if(keepSpace)
			this.dom.style.visibility = 'hidden';
		else
			this.dom.style.display = 'none';
	},

	setWidget : function()
	{
		libD.error('setWidget not implemented on this widget', this);
		return false;
	},

	setLayout : function()
	{
		libD.error('setLayout not implemented on this widget', this);
		return false;
	},

	addWidget : function()
	{
		libD.error('addWidget not implemented on this widget', this);
		return false;
	},

	listen : function(evt, callback, that)
	{
		if(!that || that === this.dom)
			libD.addEvent(this.dom, evt, callback);
		else
		{
			var c = function(e){callback.call(that, e)};

			if(!this.events)
				this.events = [];

			if(!this.events[callback]);
				this.events[callback] = [];

			this.events[callback][that] = c;

			libD.addEvent(this.dom, evt, c);
		}
	},

	release : function(evt, callback, that)
	{
		if(!that || that === this.dom)
			libD.removeEvent(this.dom, evt, callback);
		else
		{
			try
			{
				libD.removeEvent(this.dom, evt, this.events[callback][that]);

				delete this.events[callback][that];
				if(!this.events[callback].length)
					delete this.events[callback];
			}
			catch(e)
			{
				libD.error('Could not release event: does not belong to this widget');
			}
		}
	},

	tooltip : function(t)
	{
		this.dom.title = t;
	},

	isWidget : true,

	setParent : function(w)
	{
		if(this.parent)
			this.parent.releaseWidget(this);

		this.parent = w;
		this.setRefWidget(w.refWidget || w);
		
	},
	setRefWidget : function(ref)
	{
		this.refWidget = ref;
		if(this.layout)
			this.layout.setRefWidget(ref);
		else if(this.widgets)
		{
			for(var i in this.widgets)
			{
				this.widgets[i].setRefWidget(ref);
			}
		}
	}
};

libD.w.surface = libD.inherit(libD.w.widget, function ()
	{
		libD.w.widget.call(this);

		this.shown = false;
		this.hidden = false;
	},
	{
		isSurface : true,

		addWidget : function(w)
		{
			if(!this.dom)
				this.dom = document.createElement('div');
			if(!this.layout)
				this.setLayout('hbox');

			this.layout.addWidget(w);
		},

		setWidget : function(w)
		{
			if(this.layout)
			{
				libD.error("Could not setWidget : already set", this, w);
				return false;
			}

			w.width('100%');
			w.height('100%');
			w.dom.style.padding = w.dom.style.margin = '0';

			this.layout = w;
			this.dom.appendChild(w);
			return true;
		},

		setLayout : function(w)
		{
			if(this.layout)
			{
				libD.error("Could not set widget's layout : already set", this, w);
				return false;
			}

			if(typeof w === 'string' && typeof libD.w[w] === 'function')
				w = new libD.w[w];

			else if(typeof w === 'function')
				w = new w;

			if(w && w.isLayout)
			{
				if(!this.area)
				{
					this.dom.appendChild(this.area = document.createElement('div'));
					this.area.className = 'libD-w-area';
				}

				this.area.appendChild(w.dom);
				this.layout = w;
				w.setParent(this);

				return true;
			}

			libD.error("Could not set widget's layout : bad layout", this, w);
			return false;
		},

		releaseWidget : function(w)
		{
			if(w === this.layout)
			{
				this.layout = null;
				return true;
			}
			else if(this.layout)
			{
				this.layout.releaseWidget(w);
				return false;
			}
		}
	}
);

libD.w.layout = libD.inherit(libD.w.widget, {
	isLayout : true,

	addWidget : function(w)
	{
		w.setParent(w, this);
		if(!this.widgets) this.widgets = [];
		this.widgets.push(w);
	},

	releaseWidget: function(w)
	{
		libD.freeIndex(this.widgets, libD.getIndex(this.widgets, w));
	},
	
	setWidget : function()
	{
		libD.error("setWidget not implemented on layouts");
		return false;
	}
});

libD.w.box = libD.inherit(libD.w.layout, function()
	{
		this.dom = document.createElement('div');
		libD.addClass(this.dom, 'resize-disabled');
	},
	{
		addWidget : function(w)
		{
			var div = document.createElement('div');
			div.className = 'box-child';
			div._handlable = true;
			div.appendChild(w.dom);

			if(this.dom.firstChild)
			{
				var resizeHandle = document.createElement('div');
				resizeHandle.className = 'resize-handle';
				this.dom.appendChild(resizeHandle);
			}
			this.dom.appendChild(div);

			if(this.refWidget && this.refWidget.win && this.refWidget.win.ws.handleSurface)
				this.refWidget.win.ws.handleSurface(this.refWidget.win, div);

			libD.w.layout.prototype.addWidget.apply(this, arguments);
		},
		releaseWidget : function(w)
		{
			if(w.dom.parentNode && w.dom.parentNode.parentNode === this.dom)
			{
//				w.dom.parentNode.removeChild(w.dom);
				this.dom.removeChild(w.dom.parentNode);
			}
			libD.w.layout.prototype.releaseWidget.apply(this, arguments);
		},

		allowResize : function(b)
		{
			if(typeof b === 'undefined' || b)
			{
				libD.removeClass(this.dom, 'resize-disabled');
				libD.addClass(this.dom, 'resize-enabled');
			}
			else
			{
				libD.removeClass(this.dom, 'resize-enabled');
				libD.addClass(this.dom, 'resize-disabled');
			}
		}
	}
);

libD.w.vbox = libD.inherit(libD.w.box, function() {libD.addClass(this.dom,'libDW-vbox');});
libD.w.hbox = libD.inherit(libD.w.box, function() {libD.addClass(this.dom,'libDW-hbox');});

libD.w.grid = libD.inherit(libD.w.layout, function()
	{
		this.dom = document.createElement('div');
		this.dom.className = 'libDW-grid';
		this.curLine = null;
	},
	{
		addWidget : function(w, beforeThisWidget)
		{
			if(beforeThisWidget)
			{
				try
				{
					this.curLine = beforeThisWidget.dom.parentNode.parentNode;
					if(this.curLine.parentNode !== this.dom)
						this.curLine = null;
				}
				catch(e)
				{
					libD.error('Warning: widget (argument 2) does not belong to this grid');
					this.curLine = null;
				}
			}

			if(!this.curLine)
			{
				this.curLine = document.createElement('div');
				this.curLine.className = 'libDW-gridLine';
				this.dom.appendChild(curLine);
			}

			var div = document.createElement('div'); //cell
			div.appendChild(w.dom);

			if(beforeThisWidget)
				this.curLine.insertBefore(div, beforeThisWidget.parentNode)
			else
				this.curLine.appendChild(div);
			libD.w.layout.apply(this, arguments);
		},
		releaseWidget : function(w)
		{
			if(w.dom.parentNode && w.dom.parentNode.parentNode && w.dom.parentNode.parentNode.parentNode === this.dom)
			{
//				w.dom.parentNode.removeChild(w.dom);
				w.parentNode.parentNode.removeChild(w.dom.parentNode);
			}
			libD.w.layout.prototype.releaseWidget.apply(this, arguments);
		},
		newLine : function()
		{
			this.curLine = null;
		},
		selectLine : function(n)
		{
			this.curLine = this.dom.childNodes[n] || null;
		}
	}
);

libD.w.button = libD.inherit(libD.w.surface, function(text, icon)
	{
		this.dom = this.area = document.createElement('button');
		this.dom.className = 'libDW-button';

		this.setIcon(icon);
		this.setText(text);
	},
	{
		setIcon : function(s)
		{
			if(this.iconW)
				this.iconW.setIcon(s);
			else
			{
				this.iconW = new libD.w.icon(s, this.iconSize);
				this.addWidget(this.iconW);
			}
			libD.w.widget.prototype.setIcon.apply(this, arguments);
		},

		setIconSize : function(n)
		{
			if(this.icon)
				this.icon.setIconSize(n);
			else
				this.iconSize = n;
		},

		setText : function(t)
		{
			this.text = t;
			if(this.label)
			{
				this.label.setText(t);
			}
			else
			{
				this.label = new libD.w.text(t);
				this.addWidget(this.label);
			}
			if(!this.title && this.win)
				this.win.setTitle(t);
		}
	}
);

libD.w.text = libD.inherit(libD.w.widget, function(t)
	{
		this.dom = document.createTextNode(t);
	},
	{
		setText : function(t)
		{
			libD.t(this.dom, t);
		}
	}
);

libD.w.checkbox = libD.inherit(libD.w.widget, function(t)
	{
		this.checkbox = document.createElement('input');
		this.checkbox.type = 'checkbox';
		this.checkbox.className = 'libDW-checkbox';

		if(t)
		{
			this.dom = document.createElement('label');
			this.dom.className = 'libDW-checkbox-label';
			this.dom.appendChild(checkbox);
			this.text = document.createTextNode(t);
			this.dom.appendChild(text);
		}
		else
		{
			this.dom = this.checkbox;
		}
	},
	{
		setText : function(t)
		{
			if(typeof this.text === 'undefined')
			{
				this.dom = document.createElement('label');
				this.dom.className = 'libDW-checkbox-label';
				var parent = this.checkbox.parentNode;
				this.dom.appendChild(this.checkbox);
				if(parent)
					parent.appendChild(this.dom);
				this.text = document.createTextNode(t);
				this.dom.appendChild(this.text);
			}
			else
				libD.t(this.text, t);
		},

		checked : function()
		{
			return this.checkbox.checked;
		},

		check : function(Check)
		{
			if(typeof Check !== undefined)
				this.checkbox.checked = Check;
			else
				this.checkbox.checked = true;
		}
	}
);

libD.w.list = libD.inherit(libD.w.vbox, function()
{
	libD.addClass(this.dom, 'libDW-list');
});

libD.w.listItem = libD.inherit(libD.w.widget, function(title, description, icon, iconSize)
	{
		this.wrap = document.createElement('div');
		this.wrap.className = 'libDW-title-descr-wrap';

		this.title = document.createElement('div');
		this.title.className = 'libDW-li-title';
		this.wrap.appendChild(this.title);

		libD.t(this.title, title);
		this.description = document.createElement('div');
		this.description.className = 'libDW-li-descr';
		this.wrap.appendChild(this.description);

		libD.t(this.description, description);

		this.dom = document.createElement('a');
		this.dom.className = 'libDW-li';

		this.dom.href = '#';
		this.dom.onclick = libD.False;
		
		if(icon)
			this.setIcon(icon);

		this.dom.appendChild(this.wrap);
	},
	{
		setIcon : function(s)
		{
			if(!this.iconW)
			{
				this.iconW = document.createElement('img');
				this.iconW.className = 'libDW-icon';
				this.dom.insertBefore(this.iconW, this.dom.firstChild);
			}

			this.iconW.src = libD.getIcon(s, this.iconSize);
			libD.w.widget.prototype.setIcon.apply(this, arguments);
		},

		setIconSize : function(n)
		{
			this.iconSize = n + 'x' + n;
		},

		setText : function(t)
		{
			libD.t(this.title, t);
		},

		setDescription : function(t)
		{
			libD.t(this.descrition, t);
		}
	}
);

libD.w.form = libD.inherit(libD.w.surface, function()
	{
		this.dom = document.createElement('div');
		this.dom.className = 'libDW-form';
	},
	{
		addWidget: function (w, t)
		{
			var curLine = document.createElement('div');
			curLine.className = 'libD-formLine';
			this.dom.appendChild(curLine);
			var label = document.createElement('label');
			curLine.appendChild(label);
			var text = document.createElement('span');
			text.className = 'libD-form-text';
			libD.t(text, t);
			label.appendChild(text);

			text = document.createElement('span');
			text.className = 'libD-form-widget';
			text.appendChild(w.dom);
			label.appendChild(text);

			this.dom.appendChild(label);
			
			libD.w.layout.apply(this, arguments);
		},

		releaseWidget: function(w)
		{
			if(w.dom.parentNode && w.dom.parentNode.parentNode === this.dom)
				this.dom.removeChild(w.dom.parentNode);
			libD.w.layout.prototype.releaseWidget.apply(this, arguments);
		}
	}
);

libD.w.textbox = libD.inherit(libD.w.widget, function()
{
	this.dom = document.createElement('input');
	this.dom.type = 'text';
	this.dom.className='libDW-textbox';
	this.dom._step = 1;
	this.type = false;
},
{
	setType: function (type)
	{
		if(this.type)
		{
			libD.removeEvent(this.dom, 'blur', libD.w.textbox.prototype[this.dom._fnType]);
			libD.removeEvent(this.dom, 'keydown', libD.w.textbox.prototype._keyPress);
		}

		if(type === 'int' || type === 'float')
		{
			this.dom._fnType = 'to_' + type;
			libD.addEvent(this.dom, 'blur', libD.w.textbox.prototype[this.dom._fnType]);
			libD.addEvent(this.dom, 'keypress', libD.w.textbox.prototype._keyPress);
			this.type = 'int';
			this[this.dom._fnType]();
		}
		else
		{
			this.type = false;
		}
	},

	getValue: function ()
	{
		return this['to_' + type]();
	},

	setValue : function(v)
	{
		if(this.type)
			this.dom.value = this['to_' + type](v);
		else
			this.dom.value = v;
	},

	to_int: function(v)
	{
		if(this.nodeName)
			var input = this;
		else if(typeof v === 'undefined')
			var input = this.dom;
		else
			return parseInt(v);

		var val = parseInt(input.value) || 0;
		input.value = val;
		return val;
	},

	to_float: function(v)
	{
		if(this.nodeName)
			var input = this;
		else if(typeof v === 'undefined')
			var input = this.dom;
		else
			return parseFloat(v.replace(/,/g, '.').replace(/\s/g, ''));

		var val = parseFloat(input.value.replace(/,/g, '.').replace(/\s/g, '')) || 0;
		input.value = val;
		return val;
	},

	setStep: function(n)
	{
		this.dom._step = n;
	},

	setBigStep:function(n)
	{
		this.dom._bstep = n;
	},
	_keyPress : function(e)
	{
		if(!this._fnType) return;

		if(e.keyCode === 38)
			this.value = libD.w.textbox.prototype[this._fnType](this.value) + this._step;
		else if(e.keyCode === 40)
			this.value = libD.w.textbox.prototype[this._fnType](this.value) - this._step;
	}
});

libD.w.icon = libD.inherit(libD.w.widget, function(image, iconSize)
{
	this.dom = document.createElement('img');
	this.dom.className = 'libDW-icon';
	this.setIconSize(iconSize);
	this.setIcon(image);
	if(!image)
		this.style.display = 'none';
},
{
	setIcon:function(s)
	{
		this.dom.src = libD.getIcon(s, this.iconSize);
		this.iconSize = '22x22';
		this.dom.style.display = '';
		libD.w.widget.prototype.setIcon.apply(this, arguments);
	},

	setIconSize : function(n)
	{
		this.iconSize = (n || (n='22')) + 'x' + n;
	}
});

libD.w.hrule = libD.inherit(libD.w.widget, function(){this.dom = document.createElement('hr');this.dom.className = 'libDW-hrule';});
	libD.moduleLoaded('w');
});