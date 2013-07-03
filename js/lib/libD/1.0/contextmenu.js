// A tiny context Menu.
/* interacts well with libD.tooltip but it's not needed.

	An action actions Array has entries like this :
	 - [String label, Function callback, Array arguments, String icon, Object context]
	 - [String label]
	 - [String label, Array actions]

	To omit....
	 - arguments : []
	 - icon : null

	- if actions and callback not supplied, you get an entry without any action
	- if context not supplied, context = window
	- arguments, icon, context are optionnal.
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

libD.need(['sizepos', 'fx'], function() {

	if(libD.getCSS)
		libD.getCSS('', 'contextmenu');

	libD.checkContextSubmenuOverflow = function (ul)
	{
		if(libD.left(ul) + libD.width(ul) > libD.width(document.body))
			ul.className = 'submenu active contextmenu-left';
		if(libD.top(ul) + libD.height(ul) > libD.height(document.body))
			ul.className = 'submenu active contextmenu-bottom';

	}

	libD.checkContextMenuOverflow = function (ul)
	{
		if(libD.left(ul) + libD.width(ul) > libD.width(document.body) + libD.scrollLeft())
			ul.style.left = ul.offsetLeft -libD.scrollLeft() - libD.width(ul) + 'px';
		if(libD.top(ul) + libD.height(ul) > libD.height(document.body) + libD.scrollTop())
		{
			ul.style.bottom = (-libD.scrollTop()) + 'px';
			ul.style.top = 'auto';
		}

	}

	libD._contextMenu_showUL = function(e)
	{
		if(this.nodeName === 'LI')
		{
			var ul = this._ul;
			this.firstChild.focus();
		}
		else
		{
			var ul = this.parentNode._ul;
			if(libD.getStyle(ul, 'display') !== 'none')
				return libD._contextMenu_hideUL.call(this.parentNode, e);
			try{e.preventDefault();}
			catch(err){e.returnValue = false;}
		}

		ul.className = ul.className.replace(/inactive/, 'active');
		libD.showQuietly(ul,200);
		setTimeout(libD.checkContextSubmenuOverflow,0, ul);

		return false;
	};

	libD._contextMenu_hideUL = function(e)
	{
		libD.hideQuietly(this._ul, {time:200});
		this._ul.className = this._ul.className.replace(/ active/, ' inactive');
		return false;
	}

	libD.populateMenu = function(ul, actions)
	{
		var i=0,len = actions.length,li,a,img;

		while(i < len)
		{
			li = document.createElement('li');

			if(typeof actions[i] === 'string')
			{ // An entry without action, just here to inform
				if(actions[i] === '-')
					li.className = 'separator';
				else
				{
					li.textContent = actions[i];
					li.className = 'textInfo';
				}
			}
			else if(typeof actions[i] !== 'undefined')
			{
				a = document.createElement('a');
				a.href="#";

				if(typeof actions[i][3] === 'string')
				{ // icon
					img = document.createElement('img');
					img.alt = '';
					img.src = actions[i][3];
					a.appendChild(img);
				}

				a.appendChild(document.createTextNode(actions[i][0]));
				li.appendChild(a);

				li._f = actions[i], li._context = li._f[4] ? li._f[4] : window;

				if(li._f[1])
				{
					if(li._f[1].apply)
					{
						a.onclick = function(e)
						{
							if(!e)e=window.event
							if(this === window) var o = e.srcElement;
							else o = this;
							o.parentNode._f[1].apply(o.parentNode._context, o.parentNode._f[2] || []);
							libD.contextMenuHide();
							return false;
						};
						li.onmouseover = function(e)
						{
							if(!e)e=window.event
							if(this === window) var o = e.srcElement;
							else o = this;
							if(!libD._contextMenuElem.hiding)
								o.firstChild.focus();
						};
					}
					else
					{
						a.onclick = libD._contextMenu_showUL;
						li.className='lisubmenu';
						var Ul = document.createElement('ul');
						Ul.className = 'submenu inactive';
						li.appendChild(Ul);
						libD.populateMenu(Ul, li._f[1]);

						li._ul = Ul;

						li.onmouseover = libD._contextMenu_showUL;
						li.onmouseout = libD._contextMenu_hideUL;
					}
				}
			}
			ul.appendChild(li);

			++i;
		}
	};
	/** Will show a context menu based on the cursor position and the actions defined in the second argument.
		@param e (Object) an Event from a event fonction (onclick, ...) or an object width members clientX and clientY defining the menu position.
		@param actions (Array) an Array of entries in the form [label, callback, [context]] where label is the text shown in the menu entry, callback a function and context (optional) an Array containing arguments to pass to the callback. The first element of context will be used to set this for the callback function. You can also set callback as an Array that looks like an Array like actions, this will make a submenu. In this case, context is not used.
		@param dontFocus if true, won't make the first menu element have the focus. Default : false
		@example
	libD.contextMenu(evt, [
		["Cut", window.alert, [window, "Hello world !"]],
		["Paste", window.alert, [window, "Hello world !"]],
		["Hello", window.alert, [window, "Hello world !"]],
		["submenu", [
			["Sub-entry 1", callback1],
			["Sub-entry 2", callback1]
		]]
	]

	*/
	libD.contextMenu = function(e, actions, dontFocus)
	{
		if(!e)e=window.event;
		libD._contextMenufocusElem = document.activeElement;

		if(!libD._contextMenuElem)
		{
			libD._contextMenuElem = document.createElement('ul');
			libD._contextMenuElem.id = 'LibDContextMenu';
			libD.addEvent(libD._contextMenuElem,'click', libD.False);
			libD.addEvent(libD._contextMenuElem,'mouseup', libD.False);
			libD.addEvent(libD._contextMenuElem,'mousedown', libD.False);
			libD._contextMenuElem.style.opacity = 0;
			document.body.appendChild(libD._contextMenuElem);
			libD.addEvent(document.body, 'click', function(e)
			{
				if(!e)e=window.event;
				if(e.clientX || e.clentY)
					return libD.contextMenuHide(e);
			});
			libD.addEvent(document.body, 'keydown', function(e)
			{
				if(!e)e=window.event;
				if(e.keyCode === 27)
					return libD.contextMenuHide(e);
			});
		}
		libD._contextMenuElem.className='';

		libD.emptyNode(libD._contextMenuElem);

		libD._contextMenuElem.hiding = false;

		libD._contextMenuElem.style.left = e.clientX + libD.scrollLeft() + 5 + 'px';
		libD._contextMenuElem.style.top = e.clientY  + libD.scrollTop() +  5 + 'px';
		libD._contextMenuElem.style.bottom = 'auto';
		libD.populateMenu(libD._contextMenuElem, actions);

		if(!dontFocus)
			setTimeout(
				function()
				{
					libD._contextMenuElem.getElementsByTagName('a')[0].focus();
				}, 200);

		libD.showQuietly(libD._contextMenuElem, 200);
		setTimeout(libD.checkContextMenuOverflow,0,libD._contextMenuElem);
		libD.blockToolTip = true;
	};

	/** Will bind a context menu to the DOM object o (please, for accessibility reasons, try to use <a href> elements as much as possible...
		@param o (Object) the DOM object that shall get a context menu
		@param a (Array) libD.contextMenu actions Array (see libD.contextMenu for more details)
	*/
	libD.bindContextMenu = function(o, actions, dontFocus)
	{
		libD.addEvent(o, 'mousedown', function(e)
		{
			o.focus();
			if(!e)e=window.event;

			if(e.button === 2 || (e.touches && e.touches.length === 2))
			{
				libD.contextMenu(e, actions, dontFocus);
				return libD.False(e);
			}
		});

		libD.addEvent(o, 'keyup', function(e)
		{
			if(!e)e=window.event;

			if(e.keyCode === 93)
			{
				e.clientX = libD.left(document.activeElement) + libD.width(document.activeElement) / 2;
				e.clientY = libD.top(document.activeElement) + libD.height(document.activeElement) / 2;
				libD.contextMenu(e, actions, dontFocus);
				return libD.False(e);
			}
		});
		libD.addEvent(o, 'contextmenu', libD.False);
	};

	libD.contextMenuHide = function(e)
	{
		if(libD._contextMenufocusElem)
		{
			try{
				libD._contextMenufocusElem.focus();
			} catch (e){}
			libD._contextMenufocusElem = null;
		}

		if(libD._contextMenuElem)
		{
			libD._contextMenuElem.hiding = true;
			libD.hideQuietly(libD._contextMenuElem, {time:200});
		}
		libD.blockToolTip = false;
	}

	libD.contextMenuDelete = function()
	{
		try {document.body.removeChild(libD._contextMenuElem);delete libD._contextMenuElem;}
		catch(e){}
	}
	libD.moduleLoaded('contextmenu');
});
