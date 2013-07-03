// A not developped anymore useless lib for creating rich js apps that look like GTK apps. Might be interresting if not so time-wasting, complicated, fat. You could be interested by libD.jso2dom, though.

/* needs some libD stuffs :
    - addEvent, checkNum from utils.js
    - outerWidth from sizepos.Js
    - objClone, that used to be a constructor cloning the object in argument and doesn't exist anymore. Easy to re-write.
    	It was used like this : var clone = new libD.objClone(obj);
*/

/*
    Copyright (C) 2010  JAKSE Raphaël

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.
*/

libD.tk =
{ // FIXME : supporter fullscreen correctement (actuellement support correct si on ne demande pas à changer, mais techniquement incorrect quand utilisé avec un wm libD
	error : function (s)
	{
		if(typeof s !== 'undefined')
		{
			if(typeof s.lineNumber === 'undefined')
			{
				libD.tk.error_out('error :' + s);
			}
			else
			{
				libD.tk.error_out('Javascript error : ' + s.name + ', ' + s.message + ' on line ' + s.lineNumber);
			}
		}
		return;
	},

	icon_theme : 'jswtk/icons',
	defaultButtonStyle : 'text-under',

	error_out : (typeof Nuage !=='undefined' && typeof Nuage.stderr !=='undefined')?Nuage.stderr:(typeof console !=='undefined' && typeof console.log !== 'unedfined')?function()
	{
		console.log.apply(console, arguments);
	}:Void,

	Warning : function (s)
	{
		libD.tk.error_out('warning : ' + s);
		return;
	},

	window : function (system)
	{
		libD.tk.widget.Container.call(this);

		this.type = 'window';
		this.height = 200;
		this.title = null;
		this.system = system;
		this.left = null;
		this.width = 200;
		this.right = null;
		this.bottom = null;
		this.context = null;
		this.dom = document.createElement('div');
		this.dom.className = 'jswtk-window';
		this.widgetIds = [];
		this.icon = '';
		if(typeof arguments[1] !== 'undefined')
		{
			this.title = arguments[1];
			if(typeof arguments[2] !== 'undefined')
			{
				this.width = libD.checkNumber(arguments[2]);

				if(typeof arguments[3] !== 'undefined')
				{
					this.height = libD.checkNumber(arguments[3]);

					if(typeof arguments[4] !== 'undefined')
					{
						this.left = libD.checkNumber(arguments[4]);

						if(typeof arguments[5] !== 'undefined')
						{
							this.top = libD.checkNumber(arguments[5]);
		
						}
					}
				}
			}
		}
	},

	window_get : function (system, url, context, winProperties)
	{
		this.system = system;
		this.url = url;
		this.context = context;
		this.onready = null;
		this.onerror = null;
		this.wProperties = winProperties?winProperties:{};
	},

	widget :
	{
		Menu : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'menu';
			this.title = '';
			this.predef = null;
		},

		Toolbar : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'toolbar';
			this.detachable = true;
			this.dir = 'h';
		},

		Menubar : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'menubar';
		},

		Statusbar : function ()
		{
			libD.tk.widget.Container.call(this);

			this.type = 'statusbar';
		},

		Separator : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'separator';
		},

		Tabgroup : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'tabgroup';
			this.tabClosable = false;
			this.tabDraggable = false;
			this.tabMovable = false;
		},

		Tab : function ()
		{
			libD.tk.widget.Container.call(this);

			this.type = 'tab';
		},

		Group : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'group';
			this.maxLineNumber = null;
		},

		Split : function ()
		{
			libD.tk.widget.Container.call(this);

			this.type = 'split';
		},

		Button : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'button';
			this.size = null;
			this.icon = null;
			this.predef = null;
			this.title = '';
		},

		ToggleButton : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'togglebutton';
			this.size = null;
			this.icon = null;
			this.predef = null;
			this.toggled = false;
			this.title = '';
		},
		Checkbox : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'checkbox';
			this.predef = null;
			this.checked = false;
			this.title = '';
		},
		Textbox : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'textbox';
			this.Input = null;
			this.value = '';
		},

		Input : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'input';
			this.value = '';
		},

		Img : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'img';
			this.url = null;
		},

		ImageButton : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'imagebutton';
			this.url = null;
		},

		VSpace : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'vspace';
			this.size = null;
		},

		HSpace : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'hspace';
			this.size = null;
		},

		Label : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'label';
			this.text = '';
			this.align = null;
			this.For = '';
		},

		Table : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'table';
		},

		Entry : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'entry';
		},

		Head : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'head';
		},

		Cell : function ()
		{
			libD.tk.widget.Container.call(this);
			this.type = 'cell';
		},

		EmbedHtml : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'embedhtml';
			this.src = '';
		},

		richTextEditor : function ()
		{
			libD.tk.Widget.call(this);
			this.type = 'richtexteditor';
			this.childNodes = null;
			this.iframe = '';
			this.styles = [];
			
		},
		
		Container : function ()
		{
			libD.tk.Widget.call(this);
			this.isContainer = true;
			this.children = [];
			this.taller_children = [];
			this.maxChildrenHeight = 0;
			this.buttonStyle='';
		}
	},

	Widget : function ()
	{
		this.is_jswtk_widget = true;
		this.isContainer = false;
		this.tip = '';
		this.type = null;
		this.parent = null;
		this.shown = false;
		this.marginBottom = 0;
		this.marginTop = 0;
		this.marginRight = 0;
		this.marginLeft = 0;
		this.maxHeight = 0;libD.tk.widget.Button.prototype = libD.tk.Widget.prototype;
		this.maxWidth = 0;
		this.minHeight = 0;
		this.minWidth = 0;
		this.width = 0;
		this.height = 0;
		this.dom = null;
		this.window = null;
		this.id = '';
		this.domID = '';
	},

	icons :
	{
		New : 'actions/document-new.png',
		save : 'actions/document-save.png',
		quit : 'actions/application-exit.png',
		previous : 'actions/go-previous.png',
		next : 'actions/go-next.png',
		refresh : 'actions/view-refresh.png',
		stop : 'actions/process-stop.png',
		home : 'actions/go-home.png',
		search : 'actions/system-search.png',
		bold : 'actions/format-text-bold.png',
		italic : 'actions/format-text-italic.png',
		underline : 'actions/format-text-underline.png',
		strikethrough : 'actions/format-text-strikethrough.png',
		justify_left : 'actions/format-justify-left.png',
		justify_center : 'actions/format-justify-center.png',
		justify_right : 'actions/format-justify-right.png',
		justify_fill : 'actions/format-justify-fill.png'
	},

	getPredefValue : function (n, type)
	{
		if(typeof arguments[2] === 'undefined')
		{
			var iconsize = '32x32';
		}
		else
		{
			switch(arguments[2])
			{
				case 'large':
					var iconsize = '48x48';
					break;
				case 'extra-small':
					var iconsize = '16x16';
					break;
				case 'small':
					var iconsize = '22x22';
					break;
				default :
					var iconsize = '32x32';
			}
		}
		if(typeof libD.tk.predefs[n] !== 'undefined' && typeof libD.tk.predefs[n][type] !== 'undefined')
		{
			return libD.tk.predefs[n][type];
		}
		else if(type === 'title')
		{
			n[0] = n.charAt(0).toUpperCase();
			return n;
		}
		else if(type === 'icon')
		{
			if(typeof libD.tk.icons[n] !== 'undefined')
			{
				return libD.tk.icon_theme + '/' + iconsize + '/' + libD.tk.icons[n];
			}
		}
		return null;
	},

	DomToUI : function (d, W, url)
	{
		var i = 0, len = d.childNodes.length;
		while(i<len)
		{
			libD.tk.DomNodeToUI(d.childNodes[i], W, url);
			++i;
		}
	},

	DomNodeToUI : function (d, W, url)
	{
		var widget = null;
		switch(d.nodeName)
		{
		case 'menu':
			widget = new libD.tk.widget.Menu();
			widget.predef = d.getAttribute('predef');
			widget.title = d.getAttribute('title');
			break;
		case 'toolbar':
			widget = new libD.tk.widget.Toolbar();
			widget.detachable = d.getAttribute('detachable');
			widget.dir = d.getAttribute('dir');
			widget.buttonStyle = d.getAttribute('button-style');
			break;
		case 'menubar':
			widget = new libD.tk.widget.Menubar();
			break;
		case 'statusbar':
			widget = new libD.tk.widget.Statusbar();
			break;
		case 'separator':
			widget = new libD.tk.widget.Separator();
			break;
		case 'line':
			widget = new libD.tk.widget.Line();
			break;
		case 'tabgroup':
			widget = new libD.tk.widget.Tabgroup();
			widget.tabClosable = d.getAttribute('tabClosable');
			widget.tabDraggable = d.getAttribute('tabDraggable');
			widget.tabMovable = d.getAttribute('tabMovable');
			break;
		case 'tab':
			widget = new libD.tk.widget.Tab();
			widget.title = d.getAttribute('title');
			break;
		case 'group':
			widget = new libD.tk.widget.Group();
			widget.maxLineNumber = d.getAttribute('maxLineNumber');
			break;
		case "centralContainer":
			widget = new libD.tk.widget.CentralContainer();
			break;
		case 'split':
			widget = new libD.tk.widget.Split();
			widget.dir = d.getAttribute('dir');
			break;
		case 'button':
			widget = new libD.tk.widget.Button();
			widget.size = d.getAttribute('size');
			widget.icon = d.getAttribute('icon');
			widget.predef = d.getAttribute('predef');
			widget.title = d.getAttribute('title');
			break;
		case 'toggleButton':
			widget = new libD.tk.widget.ToggleButton();
			widget.size = d.getAttribute('size');
			widget.icon = d.getAttribute('icon');
			widget.predef = d.getAttribute('predef');
			widget.title = d.getAttribute('title');
			widget.toggled = d.getAttribute('toggled') === "1" ? true:false;
			break;
		case 'textbox':
			widget = new libD.tk.widget.Textbox();
			widget.value = d.getAttribute('value');
			break;
		case 'input':
			widget = new libD.tk.widget.Input();
			widget.value = d.getAttribute('value');
			break;
		case 'checkbox':
			widget = new libD.tk.widget.Checkbox();
			widget.checked = d.getAttribute('checked') === "1"?true:false;
			break;
		case 'img':
			widget = new libD.tk.widget.Img();
			widget.url = libD.relativeUrl(d.getAttribute('url'), url, true);
			break;
		case 'imagebutton':
			widget = new libD.tk.widget.ImageButton();
			widget.url = libD.relativeUrl(d.getAttribute('url'), url, true);
			break;
		case 'vspace':
			widget = new libD.tk.widget.VSpace();
			break;
		case 'hspace':
			widget = new libD.tk.widget.HSpace();
			widget.size = d.getAttribute('size');
			break;
		case 'label':
			widget = new libD.tk.widget.Label();
			widget.text = d.textContent;
			widget.align = d.getAttribute('align');
			widget.For = d.getAttribute('for');
			break;
		case 'table':
			widget = new libD.tk.widget.Table();
			break;
		case 'entry':
			widget = new libD.tk.widget.Entry();
			break;
		case 'head':
			widget = new libD.tk.widget.Head();
			break;
		case 'cell':
			widget = new libD.tk.widget.Cell();
			break;
		case 'embedHtml':
			widget = new libD.tk.widget.EmbedHtml();
			widget.url = libD.relativeUrl(d.getAttribute('url'), url, true);
			break;
		case 'richTextEditor' :
			widget = new libD.tk.widget.richTextEditor();
			widget.childNodes = d.childNodes;
			break;
		case '#text':break;
		default :
			libD.tk.Warning('widget "' + d.nodeName + '" not known');
		}
		if(widget)
		{
			widget.tip = d.getAttribute('tip');
			widget.height = d.getAttribute('height');
			widget.width = d.getAttribute('width');
			widget.maxHeight = d.getAttribute('maxHeight');
			widget.maxWidth = d.getAttribute('maxWidth');
			widget.minHeight = d.getAttribute('minHeight');
			widget.minWidth = d.getAttribute('minWidth');
			widget.marginLeft = d.getAttribute('marginLeft');
			widget.marginWidth = d.getAttribute('marginRight');
			widget.marginTop = d.getAttribute('marginTop');
			widget.marginBottom = d.getAttribute('marginBottom');
			if(typeof W.appendChild !== 'undefined')
			{
				W.appendChild(widget);
			}
			if(d.getAttribute('setCentralWidget'))
			{
				widget.setCentralWidget();
			}
			var id;
			if(id = d.getAttribute('id'))
			{
				widget.setId(id);
			}

			libD.tk.DomToUI(d, widget, url);
		}
	},

	Engine :
	{
		show : function (W)
		{
			if(typeof W.predef !== 'undefined' && W.predef)
			{
				if(!W.title)
				{
					W.title = libD.tk.getPredefValue(W.predef, 'title');
				}
				if(!W.icon)
				{
					W.icon = libD.tk.getPredefValue(W.predef, 'icon');
				}
			}

			switch(W.type)
			{
			case 'menubar' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-menubar';
				break;
			case 'statusbar' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-statusbar';
				break;
			case 'separator' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-separator';
				break;
			case 'toolbar' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-toolbar';
				if(W.detachable)
				{
					var toolbarmove = document.createElement('div');
					toolbarmove.className = ' jswtk-toolbar-drag';

					W.dom.appendChild(toolbarmove);
				}
				switch(W.buttonStyle)
				{
				case 'text-only':
					W.dom.className += ' jswtk-toolbar-button-text-only';
					break;
				case 'icon-only':
					W.dom.className += ' jswtk-toolbar-button-icon-only';
					break;
				case 'icon-text':
					W.dom.className += ' jswtk-toolbar-button-side-by-side';
					break;
				case 'text-under':
					W.dom.className += ' jswtk-toolbar-button-side-by-side';
					break;
				default:
					W.dom.className += ' jswtk-toolbar-button-' + libD.tk.defaultButtonStyle;
				}
				break;
			case 'img' :
				W.dom = document.createElement('img');
				W.dom.className = 'jswtk-img';
				W.dom.src = this.url;
				W.dom.alt = '';
				W.dom.className = 'jswtk-img';
				break;
			case 'imagebutton' :
				W.dom = document.createElement('div');
				if(this.url)
				{
					var img = document.createElement(img);
					img.src = this.url;
					img.alt = '';
					img.className = 'jswtk-img';
					W.dom.appendChild(img);
				}
				W.dom.className = 'jswtk-imagebutton';
				break;
			case 'menu' :
				W.dom = document.createElement('span');
				if(W.title)
				{
					W.dom.textContent = W.title.replace(/_/g, '') + ' ';
				}
				W.dom.className = 'jswtk-menu';
				break;
			case 'tabgroup' :
				W.dom = document.createElement('div');
				var tabs = document.createElement('div');
				tabs.className = 'jswtk-tabgroup-tabs';
				var content = document.createElement('div');
				content.className = 'jswtk-tabgroup-content';
				W.dom.className = 'jswtk-tabgroup';
				W.dom.appendChild(tabs);
				W.dom.appendChild(content);
				break;
			case 'tab' :
				W.tabdom = document.createElement('div');
				var icon = document.createElement('img');
				icon.src = W.icon;
				icon.alt = '';
				W.tabdom.appendChild(icon);
				W.tabdom.appendChild(document.createTextNode(W.title));
				W.tabdom.className = 'jswtk-tab';
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-tabcontent';
				break;
			case 'group' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-group';
				break;
			case 'split' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-split';
				break;
			case 'checkbox' :
				W.dom = document.createElement('input');
				W.dom.type = 'checkbox';
				W.dom.className = 'jswtk-checkbox';
				W.dom._jswtk_widget = W;
				W.dom.onclick = W.toggle;
				break;
			case 'button' :
				W.dom = document.createElement('div');
				var a = document.createElement('a');
				if(W.icon)
				{
					var img = document.createElement('img');
					img.src = W.icon;
					img.alt = '';
					img.className = 'jswtk-button-icon';
					a.appendChild(img);
				}
				if(W.title)
				{
					var span = document.createElement('span');
					span.textContent = W.title;
					a.appendChild(span);
				}
				a.className = 'jswtk-button-text';
				W.dom.appendChild(a);
				W.dom.className = 'jswtk-button';
				break;
			case 'togglebutton' :
				W.dom = document.createElement('div');
				var a = document.createElement('a');
				if(W.icon)
				{
					var img = document.createElement('img');
					img.src = W.icon;
					img.alt = '';
					img.className = 'jswtk-button-icon';
					a.appendChild(img);
				}
				if(W.title)
				{
					var span = document.createElement('span');
					span.textContent = W.title;
					a.appendChild(span);
				}
				a.className = 'jswtk-button-text';
				W.dom.appendChild(a);
				W.dom.className = 'jswtk-togglebutton';
				if(W.toggled)
				{
					W.dom.className += ' toggled';
				}
				W.dom._jswtk_widget = W;
				W.dom.onclick = W.toggle;
				break;
			case 'label' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-label';
				if(W.For)
				{
					W.dom.appendChild(document.createElement('label'));
					W.dom.firstChild.textContent = W.text;
					var Wx = W.window.getId(W.For);
					if(Wx)
					{
						if(!Wx.domID)
						{
							Wx.domID = W.For + (new Date()).getTime();
						}
						if(Wx.dom)
						{
							Wx.dom.id = Wx.domID;
						}

						W.dom.firstChild.setAttribute('for', Wx.domID);
					}
				}
				else
				{
					W.dom.textContent = W.text;
				}

				if(W.align !== null)
				{
					W.dom.style.textAlign = W.align;
				}
				break;
			case 'textbox' :
				W.dom = document.createElement('div');
				W.dom.className = 'jswtk-textbox';
				if(!W.children || !W.children.length)
				{
					var Input = new libD.tk.widget.Input();
					W.appendChild(Input);
					W.Input = Input;
				}
				break;
			case 'input' :
				W.dom = document.createElement('input');
				W.dom.value = W.value;
				W.dom.className = 'jswtk-input';
				break;
			case 'table' :
				W.dom = document.createElement('table');
				W.dom.className='jswtk-table';
				break;
			case 'entry' :
				W.dom = document.createElement('tr');
				W.dom.className = 'jswtk-entry';
				break;
			case 'head' :
				W.dom = document.createElement('tr');
				W.dom.className = 'jswtk-head';
				break;
			case 'cell' :
				if(W.parent.type === 'entry')
				{
					W.dom = document.createElement('td');
				}
				else
				{
					W.dom = document.createElement('th');
				}
				W.dom.className = 'jswtk-cell';
				break;
			case 'embedhtml' :
				var iframe = document.createElement('iframe');
				iframe.src = W.url;
				iframe.className = 'jswtk-embedhtml';
				iframe.style.width = '100%';
				iframe.style.height = '100%';
				W.dom = document.createElement('div');
				W.dom.appendChild(iframe);
				break;
			case 'richtexteditor' : 
				W.iframe = document.createElement('iframe');
				W.iframe.className = 'jswtk-richtexteditor';
				W.iframe.style.width = '100%';
				W.iframe.style.height = '100%';

				W.dom = document.createElement('div');
				W.dom.appendChild(W.iframe);
/*				var doc = document.createElement('html');
					var head = document.createElement('head');
						var title = document.createElement('title');
						head.appendChild(title);
					doc.appendChild(head);
					var body = document.createElement('body');
					doc.appendChild(body);
*/
				W._DOM = null;
			}

			if(W.domID)
			{
				W.dom.id = W.domID;
			}

			if(W.type === 'tab')
			{
				if(W.tip)
				{
					W.tabdom.title = W.tip;
				}
			}
			else
			{
				if(W.tip)
				{
					W.dom.title = W.tip;
				}
			}
			if(W.children)
			{
				var i = 0, len = W.children.length; 
				if(W.type === 'tabgroup')
				{
					while(i < len)
					{
						if(W.children[i].type === 'tab')
						{
							W.dom.childNodes[0].appendChild(W.children[i].tabdom);
							W.dom.childNodes[1].appendChild(W.children[i].dom);
						}
						else
						{
							if(W.children[i].dom)
							{
								W.dom.childNodes[0].appendChild(W.children[i].dom);
							}
							else
							{
								libD.tk.Warning('Widget ' + W.children[i].type + ' non initialisé');
							}
						}
						++i;
					}
				}
				else
				{
					while(i < len)
					{
						if(W.children[i].dom)
						{
							try 
							{
								W.dom.appendChild(W.children[i].dom);
							}
							catch(e)
							{
								libD.tk.error(e);
								libD.tk.error('Widget type was ' + W.type);
							}
						}
						++i;
					}
				}
			}

/*			if(W.parent.type === 'toolbar' || W.parent.type === 'statusbar' || W.parent.type === 'menubar')
			{
//				libD.addEvent(W.dom, 'load', );
			}
*/
			if(W.type === 'window')
			{
				setTimeout(this.Draw, 0, W);
			}
		},
		_HSpace_handle : function(listOfWidgets, i, len)
		{
//			console.log('handle ', listOfWidgets[i].type);
			var parent = listOfWidgets[i].parent;
			var parentLastChild = parent.children[parent.children.length-1];
			if(parentLastChild.dom)
			{
				var availableHSpace = parent.dom.offsetWidth - parentLastChild.dom.offsetLeft - parentLastChild.dom.offsetWidth - libD.outerWidth(parentLastChild.dom, 'right') - 1;

				if(listOfWidgets[i].width)
				{
					listOfWidgets[i].dom.style.width = ((availableHSpace - libD.outerWidth(listOfWidgets[i].dom)) * parseFloat(listOfWidgets[i].width)) / 100 + 'px'; //FIXME
				}
				else
				{
					listOfWidgets[i].dom.style.width = availableHSpace  - libD.outerWidth(listOfWidgets[i].dom ) + 'px';
				}
//				listOfWidgets[i].dom.style.left = (listOfWidgets[i].dom.previousSibling?listOfWidgets[i].dom.previousSibling.offsetLeft + listOfWidgets[i].dom.previousSibling.offsetWidth:0)  + 'px';

//				console.log(availableHSpace, listOfWidgets[i].dom.style.width, listOfWidgets[i].width, listOfWidgets[i].type);
//				console.log('availableSpace : ', availableHSpace, parent.dom.offsetWidth, parentLastChild.dom.offsetLeft, parentLastChild.dom.offsetWidth,  libD.outerWidth(parentLastChild.dom, 'right'));
//				console.log(libD.outerWidth(listOfWidgets[i].dom));
			}
			if(i + 1<len)
			{
				setTimeout(libD.tk.Engine._HSpace_handle, 0, listOfWidgets, i+1,len);
			}
		},

		Draw : function (W, redraw)
		{
			var i = 0, len = W.children?W.children.length:0, topHeight = 0, bottomHeight = 0, centralFound=false;
			W.jswtkEngine_maxHeight = 0, needHSpace=[];

			W._hasChildrenNeedingHSpace = [];

			if(typeof redraw !== 'undefined' && redraw && W.type==='richtexteditor')
			{
				setTimeout(function()
				{
					if(typeof W.dom.firstChild.contentDocument !== 'undefined')
					{
						W._DOM = W.dom.firstChild.contentDocument;
					}
					else
					{
						W._DOM = W.dom.firstChild.document;
					}
					W._DOM.designMode = "on";

					if(W.childNodes)
					{
						W._DOM.body.appendChild(stringToDOM(DOMtoString(W.childNodes[0].parentNode)));
					}
				}, 50);
			}
			else if(len !== 0)
			{
				while(i < len)
				{
					libD.tk.Engine.Draw(W.children[i], redraw);
					if(W.centralWidget === W.children[i])
					{
						centralFound = true;
						W.children[i].dom.style.top = topHeight + 'px';
						var bottom = document.createElement('div');
						bottom.style.position='absolute';
						bottom.style.width='100%';
						bottom.style.bottom='0';
						W.dom.appendChild(bottom);
					}
					else if(centralFound)
					{
						bottomHeight+=W.children[i]._jswtkEngine_height;
						bottom.appendChild(W.children[i].dom);
					}
					else
					{
						topHeight+=W.children[i]._jswtkEngine_height;
					}
					if(W.children[i].type === 'split' || (W.children[i].type === 'input' && W.type !=='cell'))
					{
						W.children[i].dom.style.width = 0;
						W._hasChildrenNeedingHSpace.push(W.children[i]);
					}
					if(W.children[i].width || W.children[i].parent.type === 'split')
					{
//						W.children[i].dom.style.width = W.children[i].width + (typeof W.children[i].width === 'string'?'':'px');
						W.children[i].dom.style.width = 0;
						W._hasChildrenNeedingHSpace.push(W.children[i]);
					}

					if(W.children[i].height)
					{
						W.children[i].dom.style.height = W.children[i].height + (typeof W.children[i].height === 'string'?'':'px');
					}

					if(typeof W.children[i]._hasChildrenNeedingHSpace[0] !== 'undefined')
					{
						W._hasChildrenNeedingHSpace = W._hasChildrenNeedingHSpace.concat(W.children[i]._hasChildrenNeedingHSpace);
					}

					++i;
				}

				if(centralFound)
				{
					
					W.centralWidget.dom.style.bottom = bottomHeight + 'px';
					W.centralWidget.dom.style.position='absolute';
					W.centralWidget.dom.style.width = '100%';
				}
			}

			if(W.dom)
			{
				W.jswtkEngine_height = W.dom.offsetHeight;
				if(W.type === 'tab')
				{
					var tabHeight = W.tabdom.offsetHeight;
					W.dom.style.bottom='0';
					W.dom.style.top = tabHeight + 'px';
					W.dom.style.position = 'absolute';
					W.dom.style.width='100%';
					W.jswtkEngine_height += tabHeight;
				}
			}
			else
			{
				W.jswtkEngine_height = 0;
			}

			if(W.parent && W.parent.centralWidget !== W && W.jswtkEngine_height < W.jswtkEngine_maxHeight)
			{
				W.jswtkEngine_height = _W.jswtkEngine_maxHeight;
				W.dom.style.height = W.jswtkEngine_height + 'px';
			}

			if(W.parent && W.jswtkEngine_height < W.parent.jswtkEngine_maxHeight)
			{
				W.parent.jswtkEngine_maxHeight = W.jswtkEngine_height;
			}
			if(W.type === 'window')
			{
				var len = W._hasChildrenNeedingHSpace.length;
				if(len > 0)
				{
					setTimeout(libD.tk.Engine._HSpace_handle, 0, W._hasChildrenNeedingHSpace, 0, len);
				}
			}
		},

		Redraw : function(W)
		{
			libD.tk.Engine.Draw(W, true);
		},

		bind : function (widget, fct, evt)
		{
			if(evt === 'default')
			{
				libD.addEvent(widget.dom, 'click', function(e){fct.call(widget.window.context, widget);});
			}
			else if(evt === 'validate')
			{
				libD.addEvent(widget.dom, 'keyup', function(e)
				{
					if(!e)
					{
						e=window.event;
					}
					if(e.keyCode === 13)
					{
						fct.call(widget.window.context, widget);
					}
				});

/*				libD.addEvent(widget.dom, 'blur', function(e)
				{
				fct.call(widget.window.context, widget);
				});
*/			}
			else
			{
				libD.addEvent(widget.dom, evt, function(e){fct.call(widget.window.context, widget);});
			}
		}
	},

	_fixWindow : function(W, win)
	{
		W.window = win;
		if(W.isContainer)
		{
			var i=0, len=W.children.length;
			while(i < len)
			{
				libD.tk._fixWindow(W.children[i], win);
				++i;
			}
		}
	}
};

libD.tk.engine = libD.tk.Engine;

libD.tk.Widget.prototype.setCentralWidget = function ()
{
	if(this.parent && this.parent.isContainer && this.parent.type !== 'imagebutton' && this.parent.type !== 'textbox' && this.type !== 'window')
	{
		this.parent.centralWidget = this;
		this.Redraw();
	}
	else
	{
		libD.tk.Warning('a '+ this.type + ' cannot be a central widget');
	}
};

libD.tk.Widget.prototype.show = function ()
{
	if(!this.shown)
	{
		libD.tk.engine.show(this);
	}
};

libD.tk.Widget.prototype.show_all = function ()
{
	if(this.children)
	{
		var i = 0, len = this.children.length;
		while(i < len)
		{
			this.children[i].show_all();
			++i;
		}
	}
	if(!this.shown)
	{
		this.show(this);
	}
};

libD.tk.Widget.prototype.Redraw = function ()
{
	if(this.shown)
	{
		libD.tk.engine.Redraw(this);
	}
};

libD.tk.Widget.prototype.setId = function(s)
{
	if(this.id !== '' && this.window !== null)
	{
		delete this.window.widgetIds[this.id];
	}

	if(s !== '' && typeof s === 'string')
	{
		this.id = s;
		if(this.window !== null)
		{
			this.window.widgetIds[s] = this;
		}
	}
}

libD.tk.widget.Container.prototype = libD.objClone(libD.tk.Widget.prototype);

libD.tk.widget.Container.prototype.appendChild = function(W)
{
	if(this.type === 'menu' && W.type !== 'menu')
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in a menu widget');
		return false;
	}

	else if(W.type === 'toolbar' || W.type === 'statusbar' || W.type === 'menubar' || W.type === 'tabgroup')
	{
		if(this.type !== 'window' && this.type !== 'group' && this.type !== 'tab')
		{
			libD.tk.Warning('ignoring ' + W.type + ' inclusion in ' + this.type + ' widget');
			return false;
		}
	}

	else if(W.type === 'tab' && this.type !== 'tabgroup')
	{
		libD.tk.Warning('ignoring Tab inclusion in a non Tabgroup widget');
		return false;
	}

	else if(this.type === 'imagebutton' && W.type !== 'img')
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in a ImageButton widget');
		return false;
	}

	else if(W.type === 'input')
	{
		if(this.type !== 'cell' && (this.type !== 'textbox' || this.Input !== null))
		{
			libD.tk.Warning('ignoring input inclusion');
			return false;
		}
	}

	else if(this.type === 'split' && W.type !== 'group')
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in a Split widget');
		return false;
	}

	else if(this.type === 'table' && W.type !== 'entry' && W.type !== 'head')
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in a Table widget');
		return false;
	}

	else if((this.type === 'entry' || this.type === 'head') && W.type !== 'cell')
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in a Entry/Head widget');
		return false;
	}

	else if(this.type === 'cell' && this.children.length)
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in an already full Cell widget');
		return false;
	}

	else if(this.type === 'cell' && W.type !== 'togglebutton' && W.type !== 'img' && W.type !== 'imgbutton' && W.type !== 'button' && W.type !== 'input' && W.type !== 'checkbox' && W.type !== 'option' && W.type !== 'label')
	{
		libD.tk.Warning('ignoring ' + W.type + ' inclusion in a Cell widget');
		return false;
	}

	if(W.parent === null)
	{
		W.parent = this;
		if(this.type === 'window')
		{
			libD.tk._fixWindow(W, this);
		}
		else if(this.window !== null)
		{
			libD.tk._fixWindow(W, this.window);
		}

		this.children[this.children.length] = W;
	}
	else
	{
		//FIXME
	}
};

libD.tk.widget.Menu.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Toolbar.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Menubar.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Statusbar.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Separator.prototype = libD.tk.Widget.prototype;
libD.tk.widget.Tabgroup.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Tab.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Group.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Split.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Textbox.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Input.prototype = libD.objClone(libD.tk.Widget.prototype);
libD.tk.widget.Img.prototype = libD.tk.Widget.prototype;
libD.tk.widget.ImageButton.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.VSpace.prototype = libD.tk.Widget.prototype;
libD.tk.widget.HSpace.prototype = libD.tk.Widget.prototype;
libD.tk.widget.Label.prototype = libD.tk.Widget.prototype;
libD.tk.widget.EmbedHtml.prototype = libD.objClone(libD.tk.Widget.prototype);
libD.tk.widget.Button.prototype = libD.tk.Widget.prototype;
libD.tk.widget.ToggleButton.prototype = libD.objClone(libD.tk.Widget.prototype);
libD.tk.widget.Checkbox.prototype = libD.objClone(libD.tk.Widget.prototype);

libD.tk.widget.richTextEditor.prototype = libD.objClone(libD.tk.Widget.prototype);

libD.tk.widget.Table.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Entry.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Head.prototype = libD.tk.widget.Container.prototype;
libD.tk.widget.Cell.prototype = libD.tk.widget.Container.prototype;

libD.tk.window.prototype = libD.objClone(libD.tk.widget.Container.prototype);

libD.tk.widget.Input.prototype.Value = function (s)
{
	if(s)
	{
		this.dom.value = s;
	}
	else
	{
		return this.dom.value;
	}
}

libD.tk.widget.ToggleButton.prototype.toggle = function (e)
{
	if(!e)
	{
		e = window.event;
	}
	if(this.is_jswtk_widget)
	{
		if(this.toggled)
		{
			this.dom.className = 'jswtk-togglebutton';
			this.toggled = false;
		}
		else
		{
			this.dom.className = 'jswtk-togglebutton toggled';
			this.toggled = true;
		}
	}
	else
	{
		if(this._jswtk_widget.toggled)
		{
			this.className = 'jswtk-togglebutton';
			this._jswtk_widget.toggled = false;
		}
		else
		{
			this.className = 'jswtk-togglebutton toggled';
			this._jswtk_widget.toggled = true;
		}
	}
}

libD.tk.widget.Checkbox.prototype.toggle = function (e)
{
	if(!e)
	{
		e = window.event;
	}
	if(this.is_jswtk_widget)
	{
		if(this.checked)
		{
			this.dom.className = 'jswtk-checkbox';
			this.checked = false;
		}
		else
		{
			this.dom.className = 'jswtk-checkbox checked';
			this.checked = true;
		}
	}
	else
	{
		if(this._jswtk_widget.checked)
		{
			this.className = 'jswtk-checkbox';
			this._jswtk_widget.checked = false;
		}
		else
		{
			this.className = 'jswtk-checkbox checked';
			this._jswtk_widget.checked = true;
		}
	}
}

libD.tk.widget.EmbedHtml.prototype.setURL = function (url)
{
	this.url = url;
	this.dom.firstChild.src = url;
}

libD.tk.window.prototype.show = function()
{
	if(this.system === null)
	{
		libD.tk.error('system has not been declared');
		return false;
	}

	var that = this;
	var redraw = function()
	{
		try
		{
			that.Redraw();
		}
		catch(e)
		{
			libD.tk.error(e);
		}
	}

	libD.tk.Widget.prototype.show.call(this);

	if(typeof this.system.WS === 'undefined')
	{
		this.system.appendChild(this.dom); // FIXME : gestion correcte des redraws on resize
		if(this.system === document.body)
		{
			libD.addEvent(window, 'resize', redraw);
		}
	}
	else
	{
		this.win = new this.system.Window(this.system);
		this.win.setWidth(this.width);
		this.win.setHeight(this.height);
		this.win.setTitle(this.title);
		this.win.setRight(this.right);
		this.win.setBottom(this.bottom);
		this.win.setLeft(this.left);
		this.win.setTop(this.top);
		this.win.setIcon(this.icon);
		this.win.child = this.dom;
		if(Nuage)
		{
			Nuage.setAppStyle(this.dom)
		}

		this.win.addEvent('resize', redraw);
		this.win.addEvent('maximize', redraw);
		this.win.addEvent('restore', redraw);
		this.win.show();
	}
	this.shown = true;
};

libD.tk.window.prototype.getScreenWidth = function()
{
	if (typeof this.system.ddWS === 'undefined')
	{
		return system.offsetWidth;
	}
	else
	{
		return system.offsetWidth(system.area);
	}
};

libD.tk.window.prototype.getScreenHeight = function()
{
	if (typeof this.system.ddWS === 'undefined')
	{
		return system.offsetHeight(system);
	}
	else
	{
		return system.offsetHeight(system.area);
	}
};

/*libD.tk.window.prototype.centerX = function ()
{
	if(typeof this.width === 'string')
	{
		var W = parseFloat(this.width);
		this.left = (100 - W) / 2 + '%';
	}
	else if (typeof system.ddWS === 'undefined')
	{
		(system.offsetWidth - this.width ) / 2
	}
	else
	{
		(system.offsetWidth(system.area) - this.width ) / 2;
	}
};

libD.tk.window.prototype.centerY = function ()
{
	if(typeof this.height === 'string')
	{
		var W = parseFloat(this.height);
		this.top = (100 - W) / 2 + '%';
	}
	else if (typeof this.system.ddWS === 'undefined')
	{
		this.top = (system.offsetHeight(system) - this.height ) / 2
	}
	else
	{
		this.top = (system.offsetHeight(system.area) - this.height ) / 2;
	}
};
*/

libD.tk.window.prototype.close = function()
{
	this.win.close();
}

libD.tk.predefs =
{
	saveas : { title : 'Save As ...', icon : libD.tk.icons.save },
	about : { title : 'About ...', icon : libD.tk.icons.info }
};

libD.tk.widget.richTextEditor.prototype.setStyle = function(objects, styles)
{
	if(typeof objects === "string")
	{
		objects = objects.replace(/^\s+/,'').replace(/\s+$/,'').split(/\s*,\s*/g);
	}

	if(typeof styles === "string")
	{
		styles = styles.replace(/^\s+/,'').replace(/\s+$/,'').split(/\s*;\s*/g);
		
	}

	var slen=styles.length, olen=objects.length, i=0,j=0;

	while(i < slen)
	{
		if(typeof styles[i] === 'string')
		{
			styles[i] = styles[i].split(/\s*:\s*/g);
		}
		++i;
	}
	i=0;
	if(objects && styles)
	{
		var bStyle = this._DOM.getElementsByTagName('style')[0]; //FIXME
		if(!bStyle)
		{
			bStyle = document.createElement('style');
			bStyle.setAttribute('type', 'text/css');
			this._DOM.getElementsByTagName('head')[0].appendChild(bStyle); // iframe/document/html/head
		}

		while(i < olen)
		{
			if(objects[i] !=='')
			{
				if(typeof this.styles[objects[i]] === 'undefined')
				{
					this.styles[objects[i]] = [];
				}

				j=0;
				while(j < slen)
				{
					if(styles[j][0] !== '')
					{
						if(styles[j][1] === '')
						{
							delete this.styles[objects[i]][styles[j][0]];
						}
						else
						{
							this.styles[objects[i]][styles[j][0]] = styles[j][1];
						}
					}
					++j;
				}
//				if(this.styles[objects[i]].length === 0)
//				{
//					delete this.styles[objects[i]]; //FIXME
//				}
			}
			++i;
		}
		var sStyle = '';
		i=0;
		for (i in this.styles)
		{
			sStyle += i + '{';
			j=0;
			for (j in this.styles[i])
			{
				sStyle+=j + ':' + this.styles[i][j] + ';';
			}
			sStyle = sStyle.replace(/;$/, '}');
		}
		if(bStyle.firstChild)
		{
			bStyle.removeChild(bStyle.firstChild);
		}
		bStyle.appendChild(document.createTextNode(sStyle));
	}
}

libD.tk.window_get.prototype.get = function ()
{
	if(typeof this.system !== "undefined" && this.system && typeof this.url === 'string')
	{
		libD.get(this.url, this._window_get, true, this);
		return true;
	}
	else
	{
		if(this.onerror)
		{
			this.onerror.call(this.context, 'bad arguments');
		}
		return false;
	}
}

libD.tk.window_get.prototype._window_get = function (xml)
{
	if(xml === null)
	{
		if(this.onerror)
		{
			this.onerror('xml is null');
		}
		return false;
	}
	if(xml.firstChild.nodeName === 'window' && xml.firstChild.getAttribute('type') === 'jswtk')
	{
		var W = new libD.tk.window(this.system), i=0, len=xml.firstChild.attributes.length, value;

		while(i<len)
		{
			value = xml.firstChild.attributes[i].value;
			switch(xml.firstChild.attributes[i].name)
			{
			case 'left':
				W.left = value;break;
			case 'right':
				W.right = value;break;
			case 'top':
				W.top = value;break;
			case 'bottom':
				W.bottom = value;break;
			case 'height':
				W.height = value;break;
			case 'width':
				W.width = value;break;
			case 'title':
				W.title = value;break;
			case 'icon':
				W.icon = libD.dirname(this.url) + '/' + value;break;
			}
			++i;
		}
		
		if(this.wProperties.fullscreen)
		{
			W.right = 0;
			W.left = 0;
			W.width = '100%';
			W.height = '100%';
			W.top = 0;
			W.bottom = 0;
		}
		else
		{
			if(typeof this.wProperties.left !== 'undefined')
			{
				W.left = this.wProperties.left;
			}
			else if(typeof this.wProperties.right !== 'undefined')
			{
				W.right = this.wProperties.right;
			}

			if(typeof this.wProperties.top !== 'undefined')
			{
				W.top = this.wProperties.top;
			}
			else if(typeof this.wProperties.bottom !== 'undefined')
			{
				W.bottom = this.wProperties.bottom;
			}

			if(typeof this.wProperties.width !== 'undefined')
			{
				W.width = this.wProperties.width;
			}
			else if(typeof this.wProperties.height !== 'undefined')
			{
				W.height = this.wProperties.height;
			}
		}

		try
		{
			libD.tk.DomToUI(xml.firstChild, W, this.url);
			W.context = this.context;
			W.show_all();
		}
		catch(e)
		{
			this.onerror.call(this.context, e);
		}
	}
	else
	{
		if(this.onerror)
		{
			this.onerror.call(this.context, 'unkown window format');
		}
		return false;
	}

	if(this.onready)
	{
		this.onready.call(this.context, W);
	}
}

libD.tk.window.prototype.bind = function (widget, fct, event)
{
	if(typeof widget === 'string' && typeof this.widgetIds[widget] === 'object')
	{
		widget = this.widgetIds[widget];
	}
	else if(!(typeof widget === 'object' && widget.is_jswtk_widget))
	{
		return false;
	}
	if(typeof fct !== 'function' || fct === null)
	{
		return false;
	}
	if(typeof event !== 'string')
	{
		event = 'default';
	}

	libD.tk.engine.bind(widget, fct, event);
}

libD.tk.window.prototype.getId = function (s)
{
	if(this.widgetIds[s])
	{
		return this.widgetIds[s];
	}
	return false;
}
if(typeof Nuage === 'object')
{
	libD.tk.icon_theme = Nuage.icon_theme;
}
