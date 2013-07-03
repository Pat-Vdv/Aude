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

// FIXME: addWindowEvent, removeWindowEvent !!!

/*
 Class: libD.wm
 A window system to use with a libD-compliant window manager like libD.wm.
 
 Usage:
	You need to create an object that will allow you to open new windows. A good idea is to create the object at libD.winSys, which is a common place. After that, you have to specify the window manager (usually <libD.wm>) and the "area" (usually document.body).
	
	> var WS = libD.winSys = new libD.ws();
	> WS.setArea(document.body);
	> WS.setWM(libD.wm); // if libD's wm module is loaded

	After that, you can create a new window by calling WS.newWin.
	e.g:
	> var win = WS.newWin({
	> 	width:200,
	> 	height:'75%',
	> 	show:true, // automatically show the windows after its creation
	> 	title:'My awesome window',
	> 	content:myDomElementBeingTheWindowContent_usuallyADiv
	> });

	That's the flexible way, but there is much simpler for basic usage : you simply call *libD.newWin* as shown just above directly, it will do all these things for you (including the setWM(libD.wm) call). It's less flexible and you don't have the control on the WS object, but it's okay in most cases. A <libD.ws> object will be automatically created when first calling <libD.newWin>. You can access it with <libD.defaultWS>.
	
	Needs:
		Package sizepos
		Package numbers
*/

libD.need(['sizepos', 'numbers'], function(){

/* 
 Constructor:
*/
	libD.ws = function () //libD win System. Constructor.
	{ // FIXME : prendre en charge le redimentionement
		this.wm = null; // window manager à utiliser
		this.wl = [];
		this.nextPos = [0,0]; // proposition pour la prochaine position par défaut à utiliser
		this.workplaces = [{activeWindow : null, wl : []}]; // wle des fenêtres par bureau
		this.currentWorkplace = 0; // bureau actuel
		this.libD_ws=true;
		this.area = null;
		this.areaHeight = 0;
		this.areaWidth = 0;

		this.areaLimit = { left : null, right : null, top : null, bottom : null };

		this.limits = { left : [], right : [], top : [], bottom : [] };

		this.errno = -1;
		this.registeredEvents = [];
		this.winEvents = [];

		this.autoFocus = true; // auto focus new windows

		this.onBack = null; //win en arrière;
		this.jsError = function (win){return;};
	/*
		0 : unknown
		1 : bad wm
	*/
		this.preventClosingTimeout = 5000; // l'attente maximale avant proposition de la fermeture forcé de la fenêtre à l'utilisateur

		this.zIndexMin = 0; // le z-index minimal des fenêtres

		this.defaultIcon =''; // icon to use if not supplied

		// when handling a window pos, prefer percentages over absolute numbers.
		this.XpreferRelative = this.YpreferRelative = false;

		var that = this;

		this.newWin = function(o)
		{
			return new libD.WSwin(that,o);
		}
	}

	libD.ws.prototype =
	{
		/*
		 Method: setArea
		 Set the area of the window system. The area is the DOM object windows will leave ; they will be its children in terms of DOM. usually, it's document.body.
		 Parameters:
			n - the node that will be the area.
		*/
		setArea : function (n) 
		{
			if(this.area !== null)
			{// on refuse de changer d'area
				return false;
			}
			else
			{
				this.area = n;
				this.areaWidth = libD.width(n);
				this.areaHeight = libD.height(n);
				var that = this;
				libD.addEvent(window,'resize', function(){that.redraw();});
			}
		},
		/*
		 Method: getWindowList
		 get the list of loaded windows in this system.
		 Returns:
			an Array of objects corresponding to the currently loaded windows
		*/
		getWindowList : function()
		{
			return this.wl;
		},

	/*
		Method: redraw
		This function must be called each time the area is resized (e.g. via CSS), or things will go wrong. If the area is resized because the window of the browser is resized, redraw is automatically done provided the browser supports window's resize event. 
	*/
		redraw : function ()
		{
			var W = libD.width(this.area), H = libD.height(this.area);
			if(this.areaWidth !== W || this.areaHeight !== H)
			{
				this.areaWidth = W;
				this.areaHeight = H;
				var i = 0, len = this.wl.length;
				while(i < len)
				{
					if(typeof this.wl[i].left === 'string' || typeof this.wl[i].bottom === 'string' || typeof this.wl[i].top === 'string' || typeof this.wl[i].right === 'string')
					{
						this.wl[i].dispatchEvent('move');
					}

					if(typeof this.wl[i].width === 'string' || typeof this.wl[i].height === 'string')
					{
						this.wl[i].dispatchEvent('resize');
					}
					if(this.wl[i].centeredX)
						this.wl[i].centerX();
					if(this.wl[i].centeredY)
						this.wl[i].centerY();
					++i;
				}
			}
		},
	/*
		Method: isWindowable
		Returns true if the given node can be used as the content of a window, false otherwise.
		Parameter:
			n - the node to test
		Returns:
			A boolean
	*/
		isWindowable : function (n)
		{
			if(n === 1 || n === 9 || n === 11 || n === 3)
				return true;
			else
				return false;
		},
	/*
		Method: setWM
		use the libD-compliant window manager given in argument for this system. TODO: Calling this method when wibdows are loaded is BUGGY and still not supported.
		Parameter:
			wm - the libD-compatible wm to load
		Returns:
			true if it succeded, false otherwise. (example: because wm is buggy)
	*/
		setWM : function (wm)
		{
			if(typeof wm !== 'object')
				return false;

			var i=0, len = this.wl.length;

			if(this.wm)
			{
				while(i < len)
				{//FIXME:check this code, never tested
					var win = content = null;

					if(wm.createWindow)
						win = wm.createWindow(this.wl[i]);

					content = document.createElement('div');

					if(win)
					{
						for(var j=0,children=this.wl[i].content.childNodes,jlen=children.length ; j < jlen ; ++j)
						{
							if(!content.appendChild(children[j]))
								this.wl[i].errno = 4; //FIXME
						}

						if(this.wm.unload)
							this.wm.unload(this.wl[i]);

						this.wl[i].win = win;
						this.wl[i].content = content;
					}
					else
					{
						this.errno = 1;

						for(; i; --i)
						{
							if(this.wm.unload)
								this.wm.unload(this.wl[i]);
						}

						if (this.wm.unloadCompletely)
							this.wm.unloadCompletely();

						return false;
					}
					++i;
				}
				if (this.wm.unloadCompletely !== undefined)
					this.wm.unloadCompletely();

			}

			while(i < len)
			{
				if(typeof wm.createWindow === 'function')
					var win = wm.createWindow(this.wl[i]);

				if(win)
				{
					try
					{
						this.area.replaceChild(win, this.wl[i].win);
					}
					catch(e)
					{
						libD.error('loading WM failed : replaceChild method failded.', this, wm, e);
						this.wl[i].errno = 4; //FIXME
					}

					this.wl[i].win = win;
					win.libD_WSWin = this.wl[i];
				}
				else
					this.wl[i].errno = 4; //FIXME

				++i;
			}

			this.wm = wm;
			this.fix_zIndexes();
			return true;
		},
	/*
		Method: addWindowEvent
		binds the function f to the given event for the given window of the system. The recommanded way of doing this is to call the addEvent method of win, you are not supposed to call this directly. It's not supported and any change to this method will be done without pity if necessary.
		Parameters:
			e - the name of the event
			f - the function to bind
			win - the object of the concerned window
		See Also:
			<libD.WSWin.addEvent>
		Notes:
			Supported Events:
			  - show: the window is shown
			  - close: the window is closed
			  - decoration: the window is decorted
			  - preventClosing: Meta event allowing you to prevent a window from closing. When a window is about to close, and before the close event is dispatched, the preventClosing is dispached. If a function returns false to this event, the window won't be closed.
			   - 'focus'
			   - 'blur'
			   - 'ring'
			   - 'back'
			   - 'minimize'
			   - 'maximize'
			   - 'fullscreen'
			   - 'move'
			   - 'resize'
			   - 'restore'
			   - 'sticky'
			   - 'changeIcon'
			   - 'changeTitle'
			   - 'changeWorkplace'
			   - 'changeType'
			   - 'iconifiable'
			   - 'all'
	*/ 
		addWindowEvent : function (e, f, win)
		{
			if( e === undefined || f === undefined)
				return false;

			if( e === 'show'
			 || e === 'close'
			 || e === 'decoration'
			 || e === 'preventClosing'
			 || e === 'focus'
			 || e === 'blur'
			 || e === 'ring'
			 || e === 'back'
			 || e === 'minimize'
			 || e === 'maximize'
			 || e === 'fullscreen'
			 || e === 'move'
			 || e === 'resize'
			 || e === 'restore'
			 || e === 'sticky'
			 || e === 'changeIcon'
			 || e === 'changeTitle'
			 || e === 'changeWorkplace'
			 || e === 'changeType'
			 || e === 'iconifiable'
			 || e === 'all'
			)
			{
				if(!win.registeredEvents[e])
					win.registeredEvents[e] = [];

				win.registeredEvents[e][win.registeredEvents[e].length] = f;

			}
			return true;
		},
		
		_removeEvent : function (e, f, self, o)
		{
			if(e === undefined || f === undefined || o[e] === undefined)
				return false;

			for(var i=0, len = o[e].length; i < len; ++i)
			{
				if(o[e][i].f === f && o[e][i].self === self)
				{
					for( ; i + 1 < len; ++i)
					{
						o[e][i] = o[e][i + 1];
					}
					delete o[e][i];
					return true;
				}
			}
			return false;
		},

	/*
		Method: removeWindowEvent
		Removes an event atached to a window. Not supported, use removeEvent method of the window instead
		See Also:
			<libD.WSWin.removeEvent>
	*/
		removeWindowEvent : function (e, f, self)
		{
			return this._removeEvent(e, f, self, this.winEvents);
		},
	/*
		Method: addEvent
		Binds an event of the window system to the function f in the context context (on which the function is called)
		Parameters:
			e - the name of the event to bind
			f - the function to call when the event is fired
			context (optional) - the context in which to call the function. Default : window.
		Notes:
		  Supported events:
		   - closeWin: a window is closed
		   - newWin: a window is created
		   - focusChange: a window is focused
		   - changeWorkplace: the current workplace ("desktop") has changed
		   - all: the function will be called whenever something happens
		See Also:
			<libD.ws.removeEvent>
			<libD.ws.dispatchEvent>
	*/
		addEvent : function (e, f, context)
		{
			if( e === undefined || f === undefined)
				return false;

			if( e === 'closeWin'
			 || e === 'newWin'
			 || e === 'focusChange'
			 || e === 'changeWorkplace'
			 || e === 'all'
			)
			{
				if(this.registeredEvents[e] === undefined)
					this.registeredEvents[e] = [];

				this.registeredEvents[e].push({f:f,self:context});
			}
			return true;
		},
	/*
		Method: removeEvent
		Unbinds an event. Give exactly the same parameters as you gave to addEvent
		Parameters:
			e - the name of the event to bind
			f - the function to call when the event is fired
			context (optional) - the context in which to call the function. Default : window.
		See Also:
			<libD.ws.addEvent>
			<libD.ws.dispatchEvent>
	*/
		removeEvent : function (e, f, context)
		{
			return this._removeEvent(e, f, context, this.registeredEvents);
		},

	/*
	 Method: dispatchEvent
		Called when a event occurs. Should not be called by foreign scripts.
		Parameter:
			e - the name of the event that happened
	*/
		dispatchEvent : function (e)
		{
			if(this.registeredEvents.all)
			{
				for(var i=0, len=this.registeredEvents.all.length; i < len; ++i)
				{
					try
					{
						this.registeredEvents.all[i].f.apply(this.registeredEvents.all[i].self || window, arguments);
					}
					catch(err)
					{
						libD.error('ws callback dispatchEvent failed', err, this.registeredEvents.all[i], arguments);
					}
				}
			}

			if(this.registeredEvents[e])
			{
				for(var i=0, len=this.registeredEvents[e].length; i < len; ++i)
				{
					try
					{
						this.registeredEvents[e][i].f.apply(this.registeredEvents[e][i].self || window, arguments);
					}
					catch(err)
					{
						libD.error('ws callback dispatchEvent failed', err, this.registeredEvents.all[i], arguments);
					}
				}
			}
		},
	/*
		Method: setCurrentWorkplace
		Set the current workplace.
		Parameter:
			n - the number of the workplace to set. Minimum: 0, maximum: N-1 where N is the number of workplaces available
		See Also:
			<libD.ws.setWorkplaceNumber>
			<libD.ws.sendToWorkplace>
	*/
		setCurrentWorkplace : function (n)
		{
			var N = parseInt(n, 10);
			if(isNaN(N) || this.workplace.wl[N] === undefined)
			{
				return false;
			}
			this.currentWorkplace = N;
			this.dispatchEvent('changeWorkplace');
		},
	/*
		Method: setWorkplaceNumber
		Set the number of workplaces available. If the current number of workplaces is greter than the number being set, windows of workplaces  of greatest number will be moved to other workplaces
		
		Parameter:
			n - the numberof workplaces to set
		See Also:
			<libD.ws.setCurrentWorkplace>
			<libD.ws.sendToWorkplace>
	*/

		setWorkplaceNumber : function (n)
		{

			if(isNaN(n = parseInt(n, 10)) || n < 1)
				return false;			

			var wps = this.workplaces, i = wps.length;

			while(i < n)
			{
				wps[i++] = {activeWindow : null, wl : []};
			}

			var wp=wps[n - 1],
	                    len = wp.length;

			while(i > n)
			{
				for(var j = 0, formerWP = wps[i-1], win; j < len ; ++j)
				{
					win = wp.wl[wp.wl.length] = formerWP.wl[j];
					win.workplace = n - 1;
					if(win.focused)
					{
						win.focused = false;
						win.dispatchEvent('blur');
						if(this.ws.wm && this.ws.wm.blur)
							this.ws.wm.blur(J);
					}

					win.dispatchEvent('changeWorkplace');
				}
				--i;
				this.workplace.pop();
			}

			return true;
		},
	/*
		Method: sendToWorkplace
		Send a window to the workplace number n
		Parameters:
			win - the window to move
			n - the number of the workplace of destination
		See Also:
			<libD.ws.setWorkplaceNumber>
			<libD.ws.setCurrentWorkplace>
	*/
		sendToWorkplace : function (win, n)
		{
			var winWorkplace = this.workplaces[win.workplace],
			    len = winWorkplace.length;
			    i = libD.getIndex(winWorkplace, win, -1, 0, len);

			if(i === -1)
			{
				if(libD.getIndex(this.wl, win, false) === false)
				{
					libD.error('bug detected in libD.ws.sendToWorkplace');
					return false;
				}
			}
			else
				libD.removeEntry(winWorkplace, win, i);

			this.workplaces[n][this.workplaces[n].length] = win;

			return false;
		},
	/*
		Method: minimizeAll
		Minimize all windows of the system
		See Also:
			<libD.ws.showAll>
	*/
		minimizeAll : function ()
		{
			var i = 0;
			while(i < this.wl.length)
			{
				this.wl[i].minimize();
				this.wl[i].restored = true;
			}
		},
	/*
		Method: showAll
		Show all windows of the system
		Parameter:
			alsoShowRestoredWindows (optional) - if true, restaured windows will also be shown, to e.g. send an event to all windows. Default: false
		See Also:
			<libD.ws.minimizeAll>
	*/
		showAll : function (alsoShowRestoredWindows)
		{
			var i = 0;
			while(i < this.wl.length)
			{
				if(alsoShowRestoredWindows || this.wl[i].restored)
				{
					this.wl[i].show();
					this.wl[i].restored = false;
				}
			}
		},
	/*
		Method: focus
		focus a window. You should use the focus method of the window instead.
		Parameter:
			win - the window to focus
		See Also:
			<libD.WSWin.focus>
	*/
		focus : function (win)
		{
			var wp = this.workplaces[win.workplace];
			if(wp.activeWindow)
			{
				wp.activeWindow.focused = false;

				if(this.wm && this.wm.blur)
					this.wm.blur(wp.activeWindow);

				wp.activeWindow.dispatchEvent('blur');
			}

			win.focused = true;

			if(this.wm && this.wm.focus)
				this.wm.focus(win);

			win.dispatchEvent('focus');
			this.dispatchEvent('focusChange', win, wp.activeWindow);
			wp.activeWindow = win;
		},
	/*
		Method: blur
		Blurs ("unfocus") a window. You should use the blur method of the window instead.
		Parameter:
			win - the window to focus
		See Also:
			<libD.WSWin.focus>
	*/
		blur : function (win)
		{
			win.focused = false;

			if(this.wm && this.wm.blur)
				this.wm.blur(win);

			win.dispatchEvent('blur');
			this.dispatchEvent('focusChange', null, win);

			this.workplaces[win.workplace].activeWindow = null;
		},

		_wmFailed : function (win)
		{
			var i=0;
			var formerWM = this.wm;

			this.wm = null;

			for(var i=0, wl = this.wl, len = wl.length; i < len; ++i)
			{
				if(formerWM.unload)
					formerWM.unload(wl[i]);

				wl[i].init();
			}

			if(formerWM.unload)
				formerWM.unload(win);

			this.win.init(); // NOTE: infinite loop if libD.ws is really buggy

			if(formerWM.unloadCompleted)
				formerWM.unloadCompleted();
		},
		/*
		 Method: addWin
		 Appends a window to a system. Doesn't handle the "desafectation" of the previous system of the window if any.
		 Parameter:
			win - the window to add
		*/
		addWin : function (win)
		{
			if(!win.workplace)
				win.workplace = this.currentWorkplace;

			this.area.appendChild(win.win);
			this.wl[this.wl.length] = win;

			var wp = this.workplaces[win.workplace];
			if(!wp)
				wp = this.workplaces[win.workplace] = [];

			wp[wp.length] = win;
			this.dispatchEvent('newWin', win);
		},
		/*
		 Method: closeWin
		 Close a window. Use the close method of the window instead
		 Parameter:
			win - the window to close
		See Also:
			<libD.WSWin.close>
		*/
		closeWin : function (win)
		{
			var wp = this.workplaces[win.workplace];
			if(win === wp.activeWindow)
				wp.activeWindow = null;

			this.area.removeChild(win.win);

			libD.removeEntry(this.wl, win);
			libD.removeEntry(wp.wl, win);

			this.dispatchEvent('closeWin', win);
		},
		/*
		 Method: fix_zIndexes
		 Will order the windows as they should be. Used internally.
		*/
		fix_zIndexes : function()
		{
			for(var i=0, len = this.wl.length; i < len; ++i)
			{
				this.wl[i].win.style.zIndex = this.zIndexMin + (this.wl[i].alwaysOnTop ? 2000 : (this.wl[i].alwaysBeneath ? 0 : 1000))  + i;
				// FIXME : hard coded limit 1000
			}
		},
	/*
		Method: addLimit
		Set a limit that windows should not exceed.
		Parameters:
			limit - the limit in pixels from the side of the screen
			side - string representing the side affected ("left", "right", "top", "bottom")
		Returns:
			The number associated to the limit; this is the number you will give to removeLimit if you want to cancel the limit.
		Note:
			There can be several limits for each side. The greatest will be applied and then if it is removed, the second greatest limit will be applied.

		See Also:
			<libD.ws.removeLimit>
	*/
		addLimit : function (limit, side)
		{
			if(!this.limits[side] || typeof limit !== 'number')
				return false;

			var index = this.limits[side].length;
			this.limits[side][index] = limit;

			if(limit > this.areaLimit[side])
				this.areaLimit[side] = limit;

			return index;
		},
	/*
		Method: removeLimit
		Removes a limit previously set with addLimit.
		Parameter:
			index - the index of the limit to unset, as returned by addLimit
			side - the side of the limit
		See Also:
			<libD.ws.addLimit>
	*/
		removeLimit : function (index, side)
		{
			var sideLimits = this.limits[side];

			if(sideLimits === undefined)
				return false;

			var len = sideLimits.length;

			if(len <= index)
				return false;

			var limit = sideLimits[index];

			libD.freeIndex(sideLimits, index);

			// we determine the new limit
			if (limit === this.areaLimit[side])
			{
				for(var newLimit = null, i=0; i < len; ++i)
				{
					if(sideLimits[i] > newLimit || !newLimit) // !newLimit <=> newLimit is null
						newLimit =  sideLimits[i];
				}
				this.areaLimit[side] = newLimit;
			}

			return true;
		},

	/*
	 	Method: preferRelative
		Determine if windows should be relatively positionned (position:relative) and sized, rather than absolute. That allows the system to adapt the size and the position of a window if the area is resized. The configuration is done for each axis independently.
		
		Parameters:
			x - true if relative is prefered for the x axis, false if absolute is prefered. if null is given, the current configuration won't be modified
			y - true if relative is prefered for the y axis, false if absolute is prefered. if null is given, the current configuration won't be modified
		
		Notes :
			preferRelative() is equivalent to preferRelative(null, null)
			preferRelative(x) is equivalent to preferRelative(x, null)
	*/
		preferRelative : function(x,y)
		{
			if(x === undefined)
				this.XpreferRelative = this.YpreferRelative = true;
			else
			{
				if(x !== null)
					this.XpreferRelative = x;
				if(y !== null && y !== 'undefined')
					this.YpreferRelative = y;
			}
		}
	};
	/*
	 Class: libD.WSWin
		This is the class of windows objects.
	*/
	libD.WSwin = function (ws, o)
	{
		if(!o) o = {};

		this.registeredEvents = []; // event handling

		this.win = null; // root DOM element corresponding to the window (incuding border)

		this.content = document.createElement('div');  // content of the window
		if(o.content)
			this.content.appendChild(o.content);

		this.state = -1; // not created
	/*
		0 : OK
	*/

		this.minimized = libD.ch(o.minimize,true);
		this.focused = false;

		this.askingForFocus = (ws.autoFocus && o.focus === undefined) || o.focus  || false;
		this.ringing = false;

		this.restored = false;

		this.jsError = null;
		this.errno = -1;
		/*
			-1 : no error
			0 : unknown
			1 : bad child
			2 : bad window
			3 : bad system
			4 : bad WM
		*/

		this.top = libD.ch(o.top,null);
		this.left = libD.ch(o.left,null);
		this.right = libD.ch(o.right, null);
		this.bottom = libD.ch(o.bottom, null);

		this.XpreferRelative = o.preferRelative || o.XpreferRelative || typeof this.left === 'string' || typeof this.right === 'string' || ws.XpreferRelative;
		this.YpreferRelative = o.preferRelative || o.YpreferRelative || typeof this.top === 'string' || typeof this.bottom === 'string' || ws.YpreferRelative;

		this.width = libD.ch(o.width, null);
		this.height = libD.ch(o.height, null);
		this.minHeight = o.minHeight || 0;
		this.minWidth = o.minWidth || 0;
		this.maxHeight = libD.ch(o.maxHeight, null);
		this.maxWidth = libD.ch(o.maxWidth, null);

		this.closable = libD.ch(o.closeable, true);
		this.resizable = libD.ch(o.resizable, true);
		this.minimizable = libD.ch(o.minimizable, true);
		this.maximizable = libD.ch(o.maximizable, true);
		this.decoration =  libD.ch(o.decoration, true); // activer les décorations
		this.sticky = o.sticky || false; // sur tous les bureaux
		this.iconifiable = libD.ch(o.iconifiable, true); // apparait dans la taskbar
		this.fullscreen = o.fullscreen || false;
		this.type = o.type || 'normal';

		/*
			normal
			panel
			dialog
			tooltip
			popup-menu
			dropdown-menu
			splash
		*/

		this.centeredX = o.center || o.centerX || false;
		this.centeredY = o.center || o.centerY || false;

		this.iconifier = null;

		this.workplace = libD.ch(o.workplace, ws.currentWorkplace);

		this.title = o.title || '';
		this.icon = o.icon || ws.defaultIcon;

		this.alwaysOnTop = o.alwaysOnTop || false;
		this.alwaysBeneath = o.alwaysBeneath || false;

		//FIXME:bad name
		this.preventClosing = o.preventClosing || null; // empêche la fermeture de la fenêtre, fonction à apeller avant de fermer la fenêtre, fonction qui donne son feux vert.
		this.preventClosingTimer = null; // le timer qui fixe une limite à cette fonction en cas de non-réponse de l'appli

		this.movable = libD.ch(o.movable, true);
		this.ws = ws;
		if(o.show) this.show();
	};

	libD.WSwin.prototype =
	{
		/* Method: setPosFromDOM
			Guess windows properties from it's actual position and size in the browser.
		
		Note:
			Useful for windows managers that want to allow the user to resize or move the window graphically. Once resizing or positioning is done, this method can be called to set width, height,top, bottom, left, right properties of the window in the best maneer possible. Will take in account what properties were set before the movement and if they values were relative or absolute to set these properties accordingly. E.g. if the position of the window on the x-axis was set with the "right" property with a relative value, the new position will be described the same maneer.
		*/
		setPosFromDOM : function ()
		{
			if(this.width !== null)
			{
				if(this.ws && this.ws.wm && this.ws.wm.width)
					this.ws.wm.width(this, this.width);

				else if(typeof this.width === 'string')
				{
					this.win.style.width=this.width;
				}
				else
				{
					this.win.style.width=this.width + 'px';
				}
			}

			if(this.height !== null)
			{
				if(this.ws && this.ws.wm && this.ws.wm.height)
					this.ws.wm.height(this, this.height);

				else if(typeof this.height === 'string')
				{
					this.win.style.height=this.height;
				}
				else
				{
					this.win.style.height=this.height + 'px';
				}
			}

			if(this.centeredX)
			{
				if(this.left === null)
					this.left = libD.width(this.ws.area) / 2 - libD.width(this.win) / 2 + libD.scrollLeft(this.ws.area, this.fixed());

				this.win.style.left = this.left + 'px';
			}
			else
			{
				if(this.left === null && this.right === null)
				{
					this.win.style.left = this.ws.nextPos[0] + 'px';
				}
				else if (this.right === null)
				{
					if(typeof this.left === 'string')
					{
						this.win.style.left=this.left;
					}
					else
					{
						this.win.style.left=this.left + 'px';
					}
					this.win.style.right = 'auto';
				}

				if (this.bottom !== null)
				{
					if(typeof this.bottom === 'string')
					{
						this.win.style.bottom=this.bottom;
					}
					else
					{
						this.win.style.bottom=this.bottom + 'px';
					}
					this.win.style.top = 'auto';
				}
			}

			if(this.centeredY)
			{
				if(this.top === null)
					this.top = libD.height(this.ws.area) / 2 - libD.height(this.win) / 2 + libD.scrollTop(this.ws.area, this.fixed());
				this.win.style.top = this.top + 'px';
			}
			else
			{
				if(this.top === null && this.bottom === null)
				{
					this.win.style.top = this.ws.nextPos[1] + 'px';
				}
				else if (this.bottom === null)
				{
					if(typeof this.top === 'string')
					{
						this.win.style.top=this.top;
					}
					else
					{
						this.win.style.top=this.top + 'px';
					}
					this.win.style.bottom = 'auto';
				}

				if(this.right !== null)
				{
					if(typeof this.right === 'string')
					{
						this.win.style.right=this.right;
					}
					else
					{
						this.win.style.right=this.right + 'px';
					}
					this.win.style.left = 'auto';
				}
			}
		},
		/*
			Method: init
			inits the window object.
		*/
		init : function ()
		{
			if(this.ws.wm === null)
			{
				if(this.win !== null)
				{
					try
					{
						this.ws.area.removeChild(win);
					}
					catch(e){}
				}

				this.win = document.createElement('div');
				this.win.style.display = this.minimized?'none':'block';
				this.win.style.position = 'absolute';

				if(this.fullscreen)
				{
					this.win.style.left = 0;
					this.win.style.top = 0;
					this.win.style.right = 0;
					this.win.style.bottom = 0;
				
				}
				else if(this.maximizeWidth && his.maximizeHeight)
				{
					this.win.style.left = this.ws.offsetLeft + 'px';
					this.win.style.top = this.ws.offsetTop + 'px';
					this.win.style.right = this.ws.offsetRight + 'px';
					this.win.style.bottom = this.ws.offsetBottom + 'px';
				}
				else
				{
					this.setPosFromDOM();
				}

				this.win.appendChild(this.content);
			}
			else
			{
				if(typeof this.ws.wm.createWindow === 'function')
					this.win = this.ws.wm.createWindow(this);

				if(!this.win)
					this.ws._wmFailed(this);

				if(this.ws.wm.redraw)
					setTimeout(this.ws.wm.redraw, 0, this);
			}
			this.win.libD_WSWin = this;
			this.ws.addWin(this);

			if(this.ws.workplaces[this.workplace].activeWindow === null)
			{
				this.ws.focus(this);
			}

			this.state=0;

			if(this.askingForFocus)
				this.focus();

			if(!this.minimized)
				this.dispatchEvent('show');
			return true;
		},

		/*
		 Method: addEvent
			binds the function passed in arguments to the event passed in arguments
			Parameters:
				e - the name of the event, as string
				f - the function to call when the event is fired.
			Note:
				To see what events are supported, please see <libD.ws.addWindowEvent>
			See Also:
				<libD.WSWin.removeEvent>
				<libD.WSWin.dispatchEvent>
		*/
		addEvent : function (e, f)
		{
			if(this.ws === undefined)
				return false;
			return this.ws.addWindowEvent(e, f, this);
		},

		/*
		 Method: removeEvent
		*/
		removeEvent : function (e, f, self)
		{
			return this.ws._removeEvent(e, f, self, this.registeredEvents);
		},

		/*
		 Method: dispatchEvent
		 fires an event. Third party scripts should never call this function and forward-compatibity is not yet decided.
		 Parameter:
			e - the name of the event to fire.
		See Also:
			<libD.WSWin.addEvent>
			<libD.WSWin.removeEvent>
			<libD.ws.addWindowEvent>
		*/
			
		dispatchEvent : function (e)
		{
			var i = 0;
			if(this.registeredEvents.all)
			{
				while(i <  this.registeredEvents.all.length)
				{
					if(arguments[1] === undefined)
					{
						setTimeout(this.registeredEvents.all[i], 0, e);
					}
					else
					{
						setTimeout(this.registeredEvents.all[i], 0, e, arguments[1]);
					}
					++i;
				}
				i=0;
			}
			if(this.registeredEvents[e])
			{
				while(i < this.registeredEvents[e].length)
				{
					if(arguments[1] === undefined)
					{
						setTimeout(this.registeredEvents[e][i], 0, e, this);
					}
					else
					{
						setTimeout(this.registeredEvents[e][i], 0, e, this, arguments[1]);
					}
					++i;
				}
			}

		},

	  /*
	   Method: show
	   Display the window.
	   Parameter:
		focus - if true, set the focus on this window.
	*/
		show : function (focus)
		{
			var len = this.ws.wl.length;
			if(this.state===-1) // window not created
			{
				this.askingForFocus = true
				this.init();
				++len;
			}
			else
			{
				if(this.ws.wl[len - 1] !== this && (arguments[1] === undefined || arguments[1]))
				{
					for(var i = libD.getIndex(this.ws.wl, this),
					    wl = this.ws.wl,
					    win; i < len - 1; ++i)
					{
						win = wl[i] = this.ws.wl[i+1];
						win.win.style.zIndex = this.ws.zIndexMin + (win.alwaysOnTop ? 2000 : (win.alwaysBeneath ? 0 : 1000)) + i - 1;
						//FIXME : 1000 is an hard coded limit
					}

					wl[i] = this;

					if(this.ws.onBack === this)
						this.ws.onBack = null;
				}

				if(this.focused || this.askingForFocus || focus)
					this.focus();
			}

			this.dispatchEvent('show');

			this.win.style.zIndex = this.ws.zIndexMin + (this.alwaysOnTop ? 2000 : (this.alwaysBeneath ? 0 : 1000)) + len - 1;
				//FIXME : 1000 is an hard coded limit
			if(this.minimized)
			{
				if(this.ws.wm === null || this.ws.wm.show === undefined)
				{
					this.win.style.display = 'block';
				}
				else
				{
					this.ws.wm.show(this);
				}

				this.minimized = false;
			}
		},
		/*
			Method: reallyClose
			Close the window (like killing it) without bothering with the preventClosing mechanism. Please consider using the <libD.WSWin.close> method instead.
		*/
		reallyClose : function ()
		{
			this.ws.closeWin(this);
			this.dispatchEvent('close');
			this.ws = null;
			setTimeout(libD.destroy, 50, this, false);
		},

		close : function (closeStage)
		{
		/*
		   closeStage Values :
		   0 : like SIGTERM on POSIX-compliant systems: will send a signal asking to close andlet the application behind the window to do its stuffs before closing the window.
		   1 : same but a timeout is set: the window will be forced to close (with the reallyClose method) after 
		   arg 1 = 2 : PrdispatchEventClosing + immediatly close : SIGKILL
		*/
			var close = true;
			if(!closeStage)
				closeStage = 0;

			if(this.preventClosing && !this.preventClosing.call(this.preventClosingContext || window)) // we call preventClosing if exists, check the return value.
				close = false;

			if(close) // preventClosing is ok to close, so we actually close the window
			{
				if(this.ws.wm && this.ws.wm.close)
				{
					var T = this.ws.wm.close(this);
					if(typeof T === 'number')
					{
						var that = this;
						setTimeout(function(){that.reallyClose();}, T);
						return;
					}
					else
					{
						this.reallyClose();
					}
				}
				else
				{
					this.reallyClose();
				}

			}
			else // preventClosing want us to wait.
			{
				if(closeStage === 1)
				{ // the user wants to quit the window anyway,so we ask the window manager 
					if(this.ws.wm && this.ws.wm.forceClosing !== null && this.preventClosingTimer === null)
					{
						this.preventClosingTimer = setTimeout(libD.ws.wm.forceClosing, this.ws.preventClosingTimeout, this);
					}	
					this.dispatchEvent('preventClosing');
				}
				else if(closeStage === 2)
				{
					var T = this.ws.wm.close(this);
					if(typeof T === 'number')
					{
						var that = this;
						setTimeout(function(){that.reallyClose();}, T);
						return;
					}

					this.reallyClose();
				}
			}
		},

		/*
			Method: setCloseClosing
			Set the function that will be called when the user wants to quit the window
			Parameter:
				f - the function
			Note:
				FIXME
		*/
		setCloseClosing : function (f)
		{
			this.preventClosing = f;
		},

		setFullscreen : function(b)
		{
			if(b === undefined)
			{
				var b = true;
			}
			if(b)
			{
				if(this.state === 0)
				{
					if(this.ws.wm === null || this.ws.wm.fullscreen === undefined)
					{
						this.win.style.left = 0;
						this.win.style.right = 0;
						this.win.style.bottom = 0;
						this.win.style.top = 0;
						this.win.style.width = 'auto';
						this.win.style.height = 'auto';
					}
					else
					{
						this.ws.wm.fullscreen(this, true);
					}
					this.dispatchEvent('fullscreen', true);
				}
				this.fullscreen = true;
			}
			else
			{
				if(this.ws.wm === null || this.ws.wm.fullscreen === undefined)
				{
					this.setPosFromDOM();
				}
				else
				{
					this.ws.wm.fullscreen(this,false);
				}
				this.dispatchEvent('fullscreen', false);
				this.fullscreen = false;
			}
		},

		ring : function ()
		{ //FIXME 
			if(this.ws.wm === null || this.ws.wm.ring === undefined)
			{
				if(!this.focused)
				{
					this.show(); // FIXME handle events
					this.focus();
				}
			}
			else
			{
				this.ws.wm.ring(this);
			}
			this.ringing = true;
			this.dispatchEvent('ring');
		},

		stopRinging : function ()
		{
			if(this.ws.wm && this.ws.wm.stopRinging)
			{
				this.ws.wm.stopRinging(this);
			}
			this.ringing = false;
			this.dispatchEvent('ring');
		},

		focus : function ()
		{
			this.ws.focus(this);
		},

		_back_moveup : function (i)
		{
			if(!i) return;

			var wl = this.ws.wl, curW =  wl[i];

			if(wl[i-1] && (curW === this || curW === null))
			{
				wl[i] = wl[i-1];
				wl[i-1] = null;
			}

			this._back_moveup(i-1);
		},

		_back : function ()
		{
			this.dispatchEvent('back');
			this.ws.fix_zIndexes();
		},

		toBeneath : function ()
		{
			if(!this.alwaysOnTop && this.ws.onBack !== this)
			{
				if(this.ws.wm && this.ws.wm.onBack)
				{
					var Ta = this.ws.wm.onBack(this);
				}
				var len = this.ws.wl.length;

				this._back_moveup(len-1);
				this.ws.wl[0] = this;

				this.ws.onBack = this;
				if(typeof Ta === 'number' && Ta)
				{
					var that = this;
					setTimeout(that._back, Ta);
				} 
				else
				{
					this._back();
				}
			}

		},

		minimize : function ()
		{
			if(this.minimizable)
			{
				if(this.ws.wm === null || this.ws.wm.minimize === undefined)
				{
					this.win.style.display='none';
				}
				else
				{
					this.ws.wm.minimize(this);
				}
				this.dispatchEvent('minimize');
				this.minimized = true;
				this.ws.blur(this);
			}
		},

		_maximize : function (W, width, height)
		{ // FIXME
			if(height && width)
			{
				W.dispatchEvent('maximize', 'both');
			}
			else
			{
				W.dispatchEvent('maximize', height?'height':'width');
			}

			if(height)
			{
				var limitBottom = W.ws.areaLimit.bottom - libD.scrollTop(W.ws.area, W.fixed());
				var limitTop = Math.max(libD.scrollTop(W.ws.area, W.fixed()), W.ws.areaLimit.top);

				W.win.style.top = limitTop + 'px';
				W.win.style.bottom = limitBottom + 'px';
				W.win.style.height = 'auto';
			}

			if(width)
			{
				var limitRight = W.ws.areaLimit.right - libD.scrollLeft(W.ws.area, W.fixed());
				var limitLeft = Math.max(libD.scrollLeft(W.ws.area, W.fixed()), W.ws.areaLimit.left);

				W.win.style.left = limitLeft + 'px';
				W.win.style.right = limitRight + 'px';
				W.win.style.width = 'auto';
			}
		},

		maximize : function (side) //optional
		{
			var height = false,
			    width = false,
			    ownMax = true;

			if(side !== 'width')
				height = this.maximizedHeight = true;

			if(side !== 'height')
				width = this.maximizedWidth = true;

			if(this.ws.wm && this.ws.wm.maximize)
				ownMax=this.ws.wm.maximize(this, width && height ?'both':side);

			if(ownMax)
				setTimeout(this._maximize, ownMax, this, width, height);
		},

		_restored : function(that)
		{
			that.dispatchEvent('restore' , 'both');
		},

		_Restore : function (that)
		{
			if(!that)
				that = this;
			that.setPosFromDOM();
			setTimeout(that._restored,500,that); //FIXME hack
		},

		restore : function ()
		{
			this.maximizedHeight = this.maximizedWidth = false;

			var ret;

			if(this.ws.wm && this.ws.wm.restore && (ret = this.ws.wm.restore(this)))
			{
				if(typeof ret === 'number')
					setTimeout(this._Restore, ret, this);
				else
					this._Restore();
			}
			else
				this._Restore();
		},

		setDecoration : function (b)
		{
			if(b !== this.decoration)
			{
				this.decoration = b;
				if(this.ws.wm && this.ws.wm.setDecoration)
					this.ws.wm.setDecoration(this);

				this.dispatchEvent('decoration');
			}
		},

		setTop : function (n)
		{
			var N = libD.checkNumber(n);
			if(N === null)
				return false;

			if(this.state === 0)
			{
				this.win.style.bottom = 'auto';
				this.win.style.top = N + (typeof N === 'string'?'':'px');
			}

			this.top = N;
			this.bottom = null;
			this.dispatchEvent('move');
			this.centeredY = false;
			return true;
		},

		setLeft : function (n)
		{

			var N=libD.checkNumber(n);

			if(N===null)
				return false;

			if(this.state === 0)
			{
				this.win.style.right = 'auto';
				this.win.style.left = N + (typeof N === 'string'?'':'px');
			}

			this.left = N;
			this.right = null;
			this.dispatchEvent('move');
			this.centeredX = false;

			return true;
		},

		setRight : function (n)
		{
			var N=libD.checkNumber(n);

			if(N===null)
				return false;

			if(this.state === 0)
			{
				this.win.style.left='auto';
				this.win.style.right = N + (typeof N === 'string'?'':'px');
			}
			this.left = null;
			this.right = N;
			this.dispatchEvent('move');
			this.centeredX = false;
			return true;
		},

		setBottom : function (n)
		{
			N = libD.checkNumber(n);

			if(N === null)
				return false;

			if(this.state === 0)
			{
				this.win.style.top='auto';
				this.win.style.bottom = N + (typeof N === 'string'?'':'px');
			}

			this.bottom = N;
			this.top = null;
			this.dispatchEvent('move');
			this.centeredY = false;

			return true;
		},

		setHeight : function (n)
		{
			var N = libD.checkNumber(n);

			if(N === null)
				return false;

			if(this.state === 0)
			{
				if(this.ws && this.ws.wm && this.ws.wm.height)
					this.ws.wm.height(this, N);
				else
					this.win.style.height = N + (typeof N === 'string'?'':'px');
			}

			this.height = N;

			if(this.centeredX)
				this.centerY();

			this.dispatchEvent('resize');

		},

		setWidth : function (n)
		{

			var N = libD.checkNumber(n);

			if(N === null)
				return false;

			if(!this.state)
			{
				if(this.ws && this.ws.wm && this.ws.wm.width)
					this.ws.wm.width(this, N);
				else
					this.win.style.width = N + (typeof N === 'string'?'':'px');
			}

			this.width = N;

			if(this.centeredX)
				this.centerX();

			this.dispatchEvent('resize');
		},

		setType : function (s)
		{
			if(!s)
				return false;

			if(this.ws.wm && this.ws.wm.type)
				this.ws.wm.type(s);

			this.type = s;
			this.dispatchEvent('typeChange');
			return true;
		},

		getTop : function ()
		{
			if(this.win.offsetTop !== undefined)
			{
				if(arguments[0] !== undefined && arguments[0])
					return this.win.offseTop / libD.height(this.ws);
				else
					return this.win.offsetTop;
			}

			this.errno =2;
			this.ws.error(this);

			return false;
		},

		getLeft : function (relativeToArea)
		{
			if(this.win.offsetLeft !== undefined)
			{
				if(relativeToArea)
					return this.win.offsetLeft / libD.width(this.ws.area);
				else
					return this.win.offsetLeft;
			}

			this.errno = 2;
			this.ws.error(this);

			return false;
		},

		getBottom : function (relativeToArea)
		{
			if(this.win.offsetTop !== undefined)
			{
				areaH = libD.height(this.ws.area);

				if(areaH !== false)
				{
					if(relativeToArea)
						return  (areaH - this.win.offsetTop - libD.height(this.win)) /  areaH;
					else
						return areaH - this.win.offsetTop -  libD.height(this.win);
				}

				this.errno = 3;
				return false;
			}

			this.errno = 2;
			this.ws.error(this);

			return false;
		},

		updateCoords : function()
		{ //FIXME : aucune gestion des margins des fenetres
			this.centeredX = this.centeredY = false;
			var posUpdated = false;
			var sizeUpdated = false;
			this.maximizedWidth = false;
			this.maximizedHeight = false;
			var newWidth = libD.width(this.win);

			if(typeof this.width === 'string')
			{
				var newWidth = libD.width(this.win) / libD.width(this.ws.area) * 100 + '%';
				if(newWidth !== this.width)
				{
					this.width = newWidth;
					sizeUpdated = true;
					this.win.style.width = this.width;
				}
			}
			else if(newWidth !== this.width)
			{
					this.width = newWidth;
					sizeUpdated = true;
					this.win.style.width = this.width + 'px';
			}

			var newHeight = libD.height(this.win);
			if(typeof this.height === 'string')
			{
				var newHeight = libD.height(this.win) / libD.height(this.ws.area) * 100 + '%';
				if(newHeight !== this.height)
				{
					this.height = newHeight;
					sizeUpdated = true;
					this.win.style.height = this.height;
				}
			}
			else if(newHeight !== this.height)
			{
					this.height = newHeight;
					sizeUpdated = true;
					this.win.style.height = this.height + 'px';
			}

			if(sizeUpdated)
			{
				this.dispatchEvent('resize');
			}

			if(this.right === null)
			{
				if(this.XpreferRelative)
				{
					var newLeft = this.win.offsetLeft / libD.width(this.ws.area) * 100 + '%';
					if(newLeft !== this.left)
					{
						this.left = newLeft;
						posUpdated = true;
					}
					this.win.style.left = this.left;
				}
				else if(this.win.offsetLeft !== this.left)
				{
					this.left = this.win.offsetLeft;
					posUpdated = true;
					this.win.style.left = this.left + 'px';
				}
				this.win.style.right = 'auto';
			}
			else
			{
				var widthArea = libD.width(this.ws.area);
				if(this.XpreferRelative)
				{
					var newRight = ((widthArea - (this.win.offsetLeft + this.win.offsetWidth)) / widthArea) * 100 + '%';
					if(newRight !== this.right)
					{
						this.right = newRight;
						posUpdated = true;
					}
					this.win.style.right = this.right;
				}
				else
				{
					var newRight = widthArea - (this.win.offsetLeft + this.win.offsetWidth);
	//				alert(newRight);
					if(newRight !== this.right)
					{
						this.right = newRight;
						posUpdated = true;
					}
					this.win.style.right = this.right + 'px';
				}
				this.win.style.left = 'auto';
			}

			if(this.bottom === null)
			{
				if(this.YpreferRelative)
				{
					var newTop = this.win.offsetTop / libD.height(this.ws.area) * 100 + '%';
					if(newTop !== this.top)
					{
						this.top = newTop;
						posUpdated = true;
					}
					this.win.style.top = this.top;
				}
				else
				{
					if(this.win.offsetTop !== this.top)
					{
						this.top = this.win.offsetTop;
						posUpdated = true;
					}
					this.win.style.top = this.top + 'px';
				}
				this.win.style.bottom = 'auto';
			}
			else
			{
				var heightArea = libD.height(this.ws.area);
				if(this.YpreferRelative)
				{
					var newBottom = ( heightArea - (this.win.offsetTop +this.win.offsetHeight)) / heightArea * 100 + '%';
					if(newBottom !== this.bottom)
					{
						this.bottom = newBottom;
						posUpdated = true;
					}
					this.win.style.bottom = this.bottom;
				}
				else
				{
					var newBottom = heightArea - (this.win.offsetTop +this.win.offsetHeight);
					if(newBottom !== this.bottom)
					{
						this.bottom = newBottom;
						posUpdated = true;
					}
					this.win.style.bottom = this.bottom + 'px';
				}
				this.win.style.top = 'auto';
			}

			if(posUpdated)
			{
				this.dispatchEvent('move');
			}
		},

		getRight : function (relativeToArea)
		{
			if(this.win.offsetLeft !== undefined)
			{
				areaW = libD.width(this.ws.area);
				if(areaW !== false)
				{
					if(relativeToArea)
						return  (areaW - this.win.offsetLeft - libD.width(this.win)) /  areaW;

					return areaW - this.win.offsetLeft -  libD.width(this.win);
				}

				this.errno = 3;
				this.ws.error(this);
				return false;
			}

			this.errno = 2;
			this.ws.error(this);
			return false;
		},

		getContentTop : function (relativeToArea)
		{
			if(relativeToArea)
			{
				areaH = libD.height(this.ws.area);

				if(areaH !== false)
					return (libD.top(this.content) - libD.top(this.ws.area)) / areaH;

				this.errno = 3;
				this.ws.error(this);
				return false;
			}

			return libD.top(this.content) - libD.top(this.ws.area);
		},

		getContentLeft : function (relativeToArea)
		{
			if(relativeToArea)
			{
				areaW = libD.width(this.ws.area);

				if(areaW !== false)
					return (libD.left(this.content) - libD.left(this.ws.area)) / libD.width(this.ws.area);

				this.errno = 3;
				this.ws.error(this);
				return false;
			}

			return libD.left(this.content) - libD.left(this.ws.area);
		},
		getContentBottom : function (relativeToArea)
		{
			areaH = libD.height(this.ws.area);

			if(areaH !== false)
			{
				if(relativeToArea)
					return ( areaH - libD.top(this.content) - libD.top(this.ws.area) - libD.height(this.content) ) / areaH;
				return areaH - libD.top(this.content) - libD.top(this.ws.area) - libD.height(this.content);
			}

			this.errno = 3;
			this.ws.error(this);
			return false;
		},

		getContentRight : function (relativeToArea)
		{
			areaW = libD.width(this.ws.area);
			if(areaW !== false)
			{
				if(relativeToArea)
					return ( areaW - libD.left(this.content) - libD.left(this.ws.area) - libD.width(this.content) ) / areaW;

				return areaW - libD.left(this.content) - libD.left(this.ws.area) - libD.width(this.content);
			}
			this.errno = 3;
			this.ws.error(this);
			return false;
		},

		getWidth : function ()
		{
			return libD.width(this.win);
		},

		getHeight : function ()
		{
			return libD.height(this.win);
		},

		getContentWidth : function ()
		{
			return libD.width(this.content || this.win);
		},

		getContentHeight : function ()
		{
			return libD.height(this.content || this.win);
		},

		setSticky : function (b)
		{
			if(this.sticky !== (this.sticky = libD.ch(!!b, true)))
			{
				if(this.ws.wm && this.ws.wm.sticky)
					this.ws.wm.sticky(this);

				this.dispatchEvent('sticky');
			}
		},

		isSticky : function()
		{
			return this.sticky;
		},
	  
		setIconifiable : function(b)
		{
			if(this.iconifiable !== (this.iconifiable = libD.ch(!!b, true)))
			{
				if(this.ws.wm && this.ws.wm.iconifiable !== undefined)
					this.ws.wm.iconifiable(this);

				this.dispatchEvent('iconifiable');
			}
		},

		isIconifiable : function()
		{
			return this.iconifiable;
		},

		setIcon : function (p)
		{
			if(this.icon !== p)
			{
				if(typeof p !== 'string')
					return false;

				if(this.ws.wm && this.ws.wm.setIcon)
					this.ws.wm.setIcon(this, p = libD.getIcon(p));

				this.icon = p;
				this.dispatchEvent('changeIcon');
			}
			return true;
		},

		setTitle : function (s)
		{
			if(this.title !== s)
			{
				if(typeof s !== 'string')
					return false;

				if(this.ws.wm && this.ws.wm.setTitle)
					this.ws.wm.setTitle(this, s);

				this.title = s;

				this.dispatchEvent('changeTitle');
			}
			return true;
		},

		getTitle : function()
		{
			return this.title;
		},

		setAlwaysOnTop : function (b)
		{
			if(this.win)
			{
				// We restablish zIndex stuff
				if(this.alwaysOnTop && !b)
					this.win.style.zIndex -=1000;
				else if(!this.alwaysOnTop && b)
					this.win.style.zIndex +=1000;
				//FIXME 1000 is an hard coded limit
			}
			this.alwaysOnTop = b;
			if(b)
				this.alwaysBeneath = false;
		},

		setAlwaysBeneath : function(b)
		{
			if(this.win)
			{
				// We restablish zIndex stuff
				if(this.alwaysBeneath && !b)
					this.win.style.zIndex +=1000;
				else if(!this.alwaysBeneath && b)
					this.win.style.zIndex -=1000;
				//FIXME 1000 is an hard coded limit
			}
			this.alwaysBeneath = b;
		},
	  
		appendChild : function (o)
		{
			if(this.content.appendChild === undefined)
			{
				this.errno = 2;
				this.ws.error(this);
			}
			else
			{
				if(this.content.appendChild(o))
					return true;

				this.errno = 1;
				this.ws.error(this);
			}
			return false;
		},
	
		setWorkplace : function (N)
		{
			if(isNaN(N))
				N=parseInt(N, 10);

			if(!this.ws.workplaces[N])
				return false;

			this.workplaces[win.workplace].activeWindow = win;

			if(this.ws.wm && this.ws.wm.setWorkplace)
				this.ws.setWorkplace(this, N);

			this.ws.setWindowWorkplace(this, N);
			this.workplace = N;
			this.dispatchEvent('changeWorkplace');
		},

		setWS : function (o)
		{
			if(o.ws !== undefined && o.ws === true)
			{
				if(this.ws === null || this.state === -1)
					this.ws = o;
				else
				{ // FIXME: BROKEN
					if(o.wm === null)
					{
						var win = null, content = null;
						if(o.wm !== null && typeof o.wm.createWindow === 'function')
							win = o.wm.createWindow(this);

						if(win)
						{
							var j=0;
							while(this.content.childNodes[j] !== undefined)
							{ // completely broken...
								try
								{
									this.content.appendChild(this.content.childNodes[j]);
								}
								catch(e)
								{
									this.errno = 4;
									this.jsError = e;
									this.ws.error(this);
								}
								++j;
							}
							delete j;
							if(this.wm && this.ws.wm.unload !== undefined)
							{
								this.ws.wm.unload(this);
							}
							this.win = win;
						}
						else
						{
							if(o.wm !== null && o.wm.unload !== undefined)
								o.wm.unload(win);

							if(win.parentNode !== undefined)
								win.parentNode.removeChild(win);

							delete win;

							o._wmFailed(this);
						}

						this.ws.closeWin(this);
						this.ws = o;
						++i;
					}
				}
			}
			else
			{
				this.errno = 3;
				this.ws.error(this);
				return false;
			}
			return true;
		},

		centerX : function()
		{
			if(this.state === 0)
				this.win.style.left = libD.width(this.ws.area) / 2 - libD.width(this.win) / 2 + libD.scrollLeft(this.ws.area, this.fixed()) + 'px';

			this.centeredX = true;
		},

		centerY : function()
		{
			if(this.state === 0)
				this.win.style.top = libD.height(this.ws.area) / 2 - libD.height(this.win) / 2 + libD.scrollTop(this.ws.area, this.fixed()) + 'px';

			this.centeredY = true;
		},

		center : function()
		{
			this.centerX();
			this.centerY();
			//FIXME : two events
		},

		fixed : function()
		{
			return this.win ? libD.getStyle(this.win, 'position') === 'fixed':false;
		},

		setMovable : function(b)
		{
			this.movable = b;
		},

		isMovable : function(b)
		{
			this.movable = b;
		}
	};

	libD.defaultWS = function()
	{
		if(libD.libD_ws)
			return libD.libD_ws;

		libD.libD_ws = new libD.ws();
		libD.libD_ws.setArea(document.body);
		if(libD.defaultWM)
			libD.libD_ws.setWM(libD.defaultWM)
		return libD.libD_ws;
	};
	
	// Will create a new window with the default window system. If it doesn't exists, it create it.
	// winSettings is the object to pass to ws.newWin()
	// that (optional but recommended) is the object using libD.newWin. Default to libD
	// The last argument allow the user of your class to define the ws it should use.
	libD.newWin = function(winSettings, that)
	{
		if(that && that.libD_ws)
			return that.libD_ws.newWin(winSettings);
		else 
			return libD.defaultWS().newWin(winSettings);
	};

	libD.setDefaultWS = function(ws, self)
	{
		var w = (typeof self === 'object') ? self : libD;

		if(ws)
			w.libD_ws = ws;
		else
			delete w.libD_ws;
		return ws;
	};

	libD.getDefaultWS = function(o)
	{
		return o.libD_ws || libD.defaultWS();
	}

	libD.moduleLoaded('ws');
});