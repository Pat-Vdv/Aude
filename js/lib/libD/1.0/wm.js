// The first libD-compliant window manager.
/* needs core.js

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

libD.need(['fx', 'sizepos', 'ws', 'selection', 'domEssential'], function() {
	libD.getCSS('', 'wm');
	/* Object: libD.wm
		the libD's default window manager */
	libD.wm =
	{
		/* Function: libD.setTitle
			set the title of the window
			Parameters:
				W - the libD.win object
				s - the new title
		*/
		setTitle : function(W, s)
		{
			if(W._libD_WM_title)
			{
				libD.t(W._libD_WM_title,s);
			}
		},

		/* Function: setIcon
			set the icon of the window
		Parameters:
			W - the libD.win object
			p - the path to the icon (as string)
		*/
		setIcon : function(W, p)
		{
			if(W._libD_WM_icon)
			{
				W._libD_WM_icon.src = p;
			}
		},
		/* set the height of the window
			W - the libD.win object
			N - the new size, in pixels or percentage */
		height : function (W, N)
		{
			W.content.className = 'ddwm-content fixed-size';
			W.win.style.height = typeof N === 'string'? N : N + libD.height(W.win) - libD.height(W.content) + 'px';
		},
		/* set the height of the window
			W - the libD.win object
			N - the new size, in pixels or percentage */
		width : function(W, N)
		{
			W.win.style.width = typeof N === 'string'? N : N + libD.width(W.win) - libD.width(W.content) + 'px';
		},
		/* the window will be shown in fullscreen */
		fullscreen : function (w, b)
		{
			if(b)
			{
				libD.replaceClass(w.win, 'decoration', 'no-decoration');
				with(w.win.style)
				{
					left = 0;
					right = 0;
					bottom = 0;
					top = 0;
					width = 'auto';
					height = 'auto';
				}
				w._keepAreaOverflow = w.ws.area.style.overflow;
				w.ws.area.style.overflow = 'hidden';
			}
			else
			{
				libD.replaceClass(w.win, 'no-decoration', 'decoration');
				var mW = w.maximizedWidth,
				    mH = w.maximizedHeight;
				w.setPosFromDOM();
				if(mW)
				{
					w.win.style.left = '0';
					w.win.style.right = 'auto';
					w.win.style.width = '100%';
				}
				if(mH)
				{
					w.win.style.top = '0';
					w.win.style.bottom = 'auto';
					w.win.style.height = '100%';
				}
				w.ws.area.style.overflow = w._keepAreaOverflow;
			}
		},

		createWindow : function(W)
		{
			var Window = document.createElement('div');

			if(W.focused)
			{
				Window.className="ddwm-window shadows active";
			}
			else
			{
				Window.className="ddwm-window shadows inactive";
			}

			if(W.minimized)
			{
				Window.style.display='none'; //permet une apparission douce
			}

			var titlebar = W._libD_WM_tb = document.createElement('div');
			titlebar.className = 'ddwm-titlebar';
			if(W.decoration)
			{
				Window.className += ' decoration';
			}
			else
			{
				Window.className += ' no-decoration';
			}

			var icon = document.createElement('img');

			if(W.icon)
				icon.src = W.icon;

			icon.alt = '';
			icon.className = 'ddwm-icon';

			var titlebarSpace = W._libD_WM_tbarea = document.createElement('div');
			titlebarSpace.className = 'ddwm-titlebar-space';

			var title = W._libD_WM_title = document.createElement('div');
			title.className = 'ddwm-title';

			titlebarSpace.appendChild(title);

			libD.allowSelection(title, false);

			W._libD_WM_title = title;
			W._libD_WM_icon = icon;

			var Min = document.createElement('a');
			Min.className = 'ddwm-min';
			Min.onmousedown = this._cancelEvt;
			Min.onclick = this._min_click;
			if(!W.minimizable)
			{
				Min.style.display = 'none';
			}
			var res = document.createElement('a');
			if(!W.maximizable)
			{
				res.style.display = 'none';
			}
			if(W.maximizedHeight && W.maximizedWidth)
			{
				res.className = 'ddwm-restore';
				res.onclick = this._res_click;
				title.ondblclick = this._res_click;
			}
			else
			{
				res.className = 'ddwm-max';
				res.onclick = this._max_click;
				title.ondblclick = this._max_click;
			}
			res.onmousedown = libD.wm._cancelEvt;
			if(!W.resizable)
			{
				res.style.display = 'none';
			}
			W._libD_WMRes = res;
			var close = document.createElement('a');
			close.className = 'ddwm-close';

			if(!W.closable)
			{
				close.style.display = 'none';
			}
			close.onmousedown = libD.wm._cancelEvt;
			close.onclick = libD.wm._close_click;

			libD.t(Min, '_');
			libD.t(title, W.title);
			libD.t(res, '+');
			libD.t(close, '×');

			libD.allowSelection(titlebar,false);

			titlebar.appendChild(icon);
			titlebar.appendChild(titlebarSpace);
			titlebar.appendChild(Min);
			titlebar.appendChild(res);
			titlebar.appendChild(close);

			var resizeleft = document.createElement('div');
			var resizeright = document.createElement('div');
			var resizebottom = document.createElement('div');
			resizeleft.className = 'ddwm-resize ddwm-resize-left';
			resizeright.className = 'ddwm-resize ddwm-resize-right';
			resizebottom.className = 'ddwm-resize ddwm-resize-bottom';

			if(W.height === null || W.width === null)
			{
				W.content.className = "ddwm-content auto-size";
			}
			else
			{
				W.content.className = "ddwm-content fixed-size";
			}

			libD.allowSelection(resizeleft, false);
			libD.allowSelection(resizeright, false);
			libD.allowSelection(resizebottom, false);

			if(W.height !== null)
			{
				Window.style.height = (typeof W.height === 'string')?W.height:W.height + 'px';
			}
			if(W.width !== null)
			{
				Window.style.width = (typeof W.width === 'string')?W.width:W.width + 'px';
			}

			Window.appendChild(titlebar);
			Window.appendChild(resizeleft);
			Window.appendChild(resizeright);
			Window.appendChild(resizebottom);
			Window.appendChild(W.content);

			if(W.top === null)
			{
				if(W.bottom !== null)
					Window.style.bottom = typeof W.bottom === 'string' ? W.bottom : W.bottom + 'px';
			}
			else
				Window.style.top = typeof W.top === 'string' ? W.top : W.top + 'px';

			if(W.left === null)
			{
				if(W.right !== null)
					Window.style.right = typeof W.right === 'string' ? W.right : W.right + 'px';
			}
			else
				Window.style.left = typeof W.left === 'string' ? W.left : W.left + 'px';

			W._libD_WM_state = 0;
			W.content.onmouseover = libD.wm._content_mouseover;
			W.content.onmouseout = libD.wm._content_mouseout;
			Window.onmousemove = libD.wm._mousemove;
			Window.onmousedown = libD.wm._mousedown;
			setTimeout(function(){W.setPosFromDOM();},0);
			return Window;
		},

		show : function (W)
		{
			W.win.style.display="block";
			libD.showQuietly(W.win, 200);
		},

		icon : function (W)
		{
			W.win.firstChild.firstChild.src = W.icon;
		},

		title : function (W)
		{
			libD.t(W._libD_WM_title,W.title);
		},

		close : function (W)
		{
			libD.wm._removeShadows(W.ws.wl);

			libD.disappearQuietly(W.win, false, 250);

			setTimeout(this._restoreShadows, 300, W.ws.wl);
			return 300;
		},

		maximize : function (W, o)
		{
			W._libD_WMblockMaxRes = true;
			var t = this.Effects.maximize(W, o);

			W._libD_WMRes.onclick = this._res_click;
			W._libD_WM_title.ondblclick = this._res_click;

			W._libD_WMRes.className = 'ddwm-restore';
			libD.addClass(W.win, 'ddwm-maximized');
			setTimeout(function(){W._libD_WMblockMaxRes = false;}, t);
			return t;
		},

		minimize : function (W,o)
		{
			libD.disappearQuietly(W.win, false, 150);
		},

		restore : function (W)
		{
			W._libD_WMblockMaxRes = true;
			var t = this.Effects.restore(W);

			W._libD_WMRes.onclick = this._max_click;
			W._libD_WM_title.ondblclick = this._max_click;

			W._libD_WMRes.className = 'ddwm-max';
			libD.removeClass(W.win, 'ddwm-maximized');

			setTimeout(function(){W._libD_WMblockMaxRes = false;}, t);

			return t;
		},

		focus : function(W)
		{
			W.win.className=W.win.className.replace('inactive', 'active');
		},

		blur : function(W)
		{
			W.win.className=W.win.className.replace('active', 'inactive');
		},

		getDecorationArea : function (W)
		{
         if(!W.win) {
            W.init();
         }

			try {
				W._libD_WM_tbarea.removeChild(W._libD_WM_title);
			}
			catch(e){}

			if(W._libD_WM_title)
            libD.addClass(W._libD_WM_title, 'ddwm-title-embeded');

			return W._libD_WM_tbarea;
		},

		releaseDecorationArea : function(W)
		{
			libD.emptyNode(W._libD_WM_tbarea);
			libD.removeClass(W._libD_WM_title, 'ddwm-title-embeded');
			W._libD_WM_tbarea.appendChild(W._libD_WM_title);
		},

		setDecorationAreaHeight : function(W, h, keepIfLower)
		{
			if(typeof h !== 'number')
			{
				if(libD.strToPx)
					h = libD.strToPx(h, W.content, 'height');
				else
				{
					libD.error("libD.wm needs libD's numbers module if you use numbers with units");
					return false;
				}
			}
			var tbH = libD.height(W._libD_WM_tbarea);

			if(keepIfLower === undefined)
				keepIfLower = true;

			if(keepIfLower && h < tbH)
				return true;

			var newTitlebarHeight = h + libD.height(W._libD_WM_tb) - libD.height(W._libD_WM_tbarea);
			W._libD_WM_tb.style.height = newTitlebarHeight + 'px';
			W.content.style.top = newTitlebarHeight + libD.outerHeight(W._libD_WM_tb) + 'px';
			return true;
		},

		getTitleElement : function(W, h)
		{
			return W._libD_WM_title;
		},

		titleDisplayBlock : function(W, b)
		{
			b = b === undefined ? true : b;
			if(b)
				libD.addClass(W._libD_WM_title, 'ddwm-title-block');
			else
				libD.removeClass(W._libD_WM_title, 'ddwm-title-block');
		},

		handleSurface : function(W, s, action)
		{// action is one of: auto, move, n-resize, w-resize, n-resize, s-resize, sw-resize, se-resize, nw-resize, ne-resize.
		 // not supported by libD.wm.
			libD.addClass(s, 'ddwm-handle');
			libD.addEvent(s, 'mousemove', libD.wm._mousemove);
			s.libD_WSWin = W;
		},

		releaseSurface : function(W, s, action)
		{// specifying action in the API might be inconsistant.
			libD.removeClass(s, 'ddwm-handle');
			libD.removeEvent(s, 'mousemove', libD.wm._mousemove);
			delete s.libD_WSWin;

		},

		hideIcon : function (W)
		{
			libD.addClass(W.win, 'icon-hide');
		},

		showIcon : function (W)
		{
			libD.removeClass(W.win, 'icon-hide');
		},

		setDecoration : function (win)
		{
			if(win.decoration)
			{
				libD.removeClass(win.win, 'no-decoration');
				libD.addClass(win.win, 'decoration');
			}
			else
			{
				libD.removeClass(win.win, 'decoration');
				libD.addClass(win.win, 'no-decoration');
			}
		},
	// Internal Functions

		_wmElem : function (o)
		{
			if(o.className === undefined)
				o = o.parentNode;
			return o.className.match(/(?:ddwm-[\S]+|ddWindow-[\S]+)/);
		},
	
		_opacity : function (W,o)
		{
			W.win.style.opacity = o;
		},

		_content_mouseover : function ()
		{
			this.parentNode.onmousemove = null;
			this.parentNode.onmousemove = null;
			if(this.parentNode.libD_WSWin._libD_WM_state !== 0)
			{
				this.parentNode.style.cursor = 'default';
				this.parentNode.libD_WSWin._libD_WM_state = 0;
			}
		},

		_content_mouseout : function()
		{
			this.parentNode.onmousemove = libD.wm._mousemove;
		},

		_win_Move : function (W, offsetX, offsetY, x, y)
		{
			var win = W.libD_WSWin, pos = win._libD_WM_pos;

			if(win._libD_WMblockMaxRes && win.maximizedHeight)
				return;

			if(win._libD_WM_moveMaximized && !win._libD_WMblockMaxRes)
			{
				if(win.maximizedHeight)
				{
					win.restore();
					pos[0] = x - offsetX - (typeof win.width === 'number'?
						win.width / 2:
						parseFloat(win.width) * libD.width(win.ws.area)/200);
					pos[1] = y - offsetY - 7;
					return;
				}
				else if(offsetY < 10)
				{
					win.maximize();
					return;
				}
			}

			libD.wm._pos(W, pos[0] + offsetX, pos[1] + offsetY, null, null);
		},

		_win_SEresize : function (W, offsetX, offsetY)
		{
			var win = W.libD_WSWin;
			libD.wm._pos(W, null, null, win._libD_WM_size[0] + offsetX, win._libD_WM_size[1] + offsetY);
		},

		_win_SWresize : function (W, offsetX, offsetY)
		{
			var win = W.libD_WSWin;
			libD.wm._pos(W,win._libD_WM_pos + offsetX, null,  win._libD_WM_size[0] - offsetX, win._libD_WM_size[1] + offsetY);
		},
		_win_NWresize : function (W, offsetX, offsetY)
		{
			var win = W.libD_WSWin, pos = win._libD_WM_pos, size = win._libD_WM_size;
			libD.wm._pos(W, pos[0] + offsetX, pos[1] + offsetY, size[0] - offsetX, size[1] - offsetY);
		},

		_win_NEresize : function (W, offsetX, offsetY)
		{
			var win = W.libD_WSWin, size = win._libD_WM_size;
			libD.wm._pos(W, null, win._libD_WM_pos + offsetY, win._libD_WM_size[0] + offsetX, size[1] - offsetY);
		},

		_win_Nresize : function (W, offsetX, offsetY)
		{
			var win = W.libD_WSWin;
			libD.wm._pos(W, null, win._libD_WM_pos + offsetY, null, win._libD_WM_size - offsetY);
		},
		_win_Eresize : function (W, offsetX, offsetY)
		{
			libD.wm._pos(W, null, null, W.libD_WSWin._libD_WM_size + offsetX, null);
		},

		_win_Sresize : function (W, offsetX, offsetY)
		{
			libD.wm._pos(W, null, null, null, W.libD_WSWin._libD_WM_size + offsetY);
		},
		_win_Wresize : function (W, offsetX, offsetY)
		{
			var win = W.libD_WSWin;
			libD.wm._pos(W, win._libD_WM_pos + offsetX, null, win._libD_WM_size - offsetX, null);
		},
		_create_body_events : function (Win)
		{
			var w = Win.libD_WSWin,
			    m = w._libD_WM_mouse,
			    ws = w.ws,
			    wm=libD.wm,
			    area = ws.area,
			    wmState = w._libD_WM_state;

			w._libD_WM_BodyMoveCancel = false;

			var BodyUp = function ()
			{
				libD.removeEvent(area, 'mousemove', BodyMove);
				libD.removeEvent(area, 'mouseup', BodyUp);
				libD.allowSelection(area, true);
			},

			BodyMove = function (e)
			{
				if(w._libD_WM_BodyMoveCancel)
					return;

				Win.onmousemove = null;

				if(!e) e = window.event;

				e = {clientX : e.clientX + libD.scrollLeft(null, w.fixed()), clientY : e.clientY + libD.scrollTop(null, w.fixed())};

				var deltaMin = w.maximizedHeight ? 10 : 0;
				if(Math.abs(m.clientX - e.clientX) < deltaMin && Math.abs(m.clientY - e.clientY) < deltaMin)
					return;

				with(Win.style)
				{
					width = libD.width(Win) + 'px';
					height = libD.height(Win) + 'px';
					left = Win.offsetLeft + 'px';
					top = Win.offsetTop + 'px';
					right = 'auto';
					bottom = 'auto';
				}

				m.lastClientX = e.clientX;
				m.lastClientY = e.clientY;

				var L = ws.areaLimit,
				    moveAction,
				    pos,
				    size;

				w._libD_WM_maxSize = [libD.width(area) - L.left - L.right, libD.height(area) - L.top - L.bottom];


				libD.allowSelection(area, false);
				libD.allowSelection(Win, false);

				Win.onmousedown = null;
				w.content.onmouseover = null;
				w.content.onmouseout = null;
				Win.firstChild.childNodes[1].ondblckick = null;

				area.appendChild(wm.divProtect);

				switch(wmState)
				{
					case 6:
					//move:
						moveAction = wm._win_Move;
						w._libD_WM_pos = [Win.offsetLeft, Win.offsetTop];
						w._libD_WM_moveMaximized = w.maximizedHeight;
						break;
					case 5:
					//redimensionner Sud Est
						moveAction = wm._win_SEresize;
						w._libD_WM_size = [libD.width(Win), libD.height(Win)];
						break;
					case 9:
					//redimensionner Est
						moveAction = wm._win_Eresize;
						w._libD_WM_size = libD.width(Win);
						break;
					case 7:
					//redimensionner Sud
						moveAction = wm._win_Sresize;
						w._libD_WM_size = libD.height(Win);
						break;
					case 1:
					//redimensionner Nord Ouest
						moveAction = wm._win_NWresize;
						w._libD_WM_pos = [Win.offsetLeft, Win.offsetTop];
						w._libD_WM_size = [libD.width(Win), libD.height(Win)];
						break;
					case 3:
					//redimensionner Nord
						moveAction = wm._win_Nresize;
						w._libD_WM_pos = Win.offsetTop;
						w._libD_WM_size = libD.height(Win);
						break;
					case 8:
					//redimensionner Nord Ouest
						moveAction = wm._win_Wresize;
						w._libD_WM_pos = Win.offsetLeft;
						w._libD_WM_size = libD.width(Win);
						break;
					case 2:
					//redimensionner Nord Est
						moveAction = wm._win_NEresize;
						w._libD_WM_pos = Win.offsetTop;
						w._libD_WM_size = [libD.width(Win), libD.height(Win)];
						break;
					case 4:
					//redimensionner Sud Ouest
						moveAction = wm._win_SWresize;
						w._libD_WM_pos = Win.offsetLeft;
						w._libD_WM_size = [libD.width(Win), libD.height(Win)];
				}

				BodyMove_continue = function (e)
				{
					if(wm._dndBusy) return;
					wm._dndBusy = true;

					if(!e) e = window.event;

					var x = e.clientX + libD.scrollLeft(null, w.fixed()), y = e.clientY + libD.scrollTop(null, w.fixed());

					if(!( x === m.lastClientX
					   && y === m.lastClientY))
					{
						m.lastClientX = x;
						m.lastClientY = y;

//						try
//						{
							moveAction(Win, x - m.clientX, y - m.clientY, x,y);
							if(moveAction !== wm._win_Move && w._libD_WM_evtWhileResize)
								w.dispatchEvent('resize');
//						}
//						catch(e)
//						{
							// Sometimes this fails and leave windows unusable.
							// Don't know why, so we are cleaning things.
//							BodyUp_continue();
//						}
					}
					setTimeout(wm._dndBusyFree, 0);
					if(e.preventDefault)
						e.preventDefault();
				},

				BodyUp_continue = function ()
				{
					libD.allowSelection(area, true);
					Win.onmousemove = libD.wm._mousemove;
					Win.onmousedown = wm._mousedown;
					w._libD_WM_moveMaximized = false;
					w.content.onmouseover = wm._content_mouseover;
					w.content.onmouseout = wm._content_mouseout;
					libD.allowSelection(Win, true);
					libD.removeEvent(area, 'mouseup', BodyUp_continue);
					libD.removeEvent(area, 'mousemove', BodyMove_continue);
					libD.removeEvent(area, 'touchmove', BodyMove_continue);
					libD.removeEvent(area, 'touchend', BodyUp_continue);

					if(!w.maximizedHeight && !w.maximizedWidth)
					{
						w.content.className = 'ddwm-content fixed-size';
						w.updateCoords();
					}
					w._libD_WMRes.onclick = ws.wm._max_click;
					w._libD_WMRes.className = 'ddwm-max';
					w._libD_WM_title.ondblclick = ws.wm._max_click;
					wm._restoreShadows(ws.wl);
					area.removeChild(wm.divProtect);
				};

				wm._removeShadows(ws.wl);
				libD.removeEvent(area, 'mousemove', BodyMove);
				libD.removeEvent(area, 'mouseup', BodyUp);

				libD.removeEvent(area, 'touchmove', BodyMove);
				libD.removeEvent(area, 'touchend', BodyUp);

				w._libD_WM_BodyMoveCancel = true;
				libD.addEvent(area, 'mousemove', BodyMove_continue);
				libD.addEvent(area, 'mouseup', BodyUp_continue);

				libD.addEvent(area, 'touchmove', BodyMove_continue);
				libD.addEvent(area, 'touchend', BodyUp_continue);

				if(e.preventDefault)
					e.preventDefault();

			}
			libD.addEvent(area, 'mousemove', BodyMove);
			libD.addEvent(area, 'mouseup', BodyUp);

			libD.addEvent(area, 'touchmove', BodyMove);
			libD.addEvent(area, 'touchend', BodyUp);
			return true;
		},

		_dndBusyFree : function()
		{
			libD.wm._dndBusy = false;
		},

		_mousedown : function(e)
		{
			if(!e) e=window.event;

			if(e.altKey || e.metaKey)
			{
				this.libD_WSWin._libD_WM_state = 6; // move
				var clickedOnWM = true;
			}
			else
				var clickedOnWM = libD.wm._wmElem(e.target || e.srcElement);

			if((!libD.wm.clickAnywhereToFocus && !clickedOnWM) || (!this.libD_WSWin.movable && this.libD_WSWin._libD_WM_state === 6))
				return;
			if(e.button === 0 || (e.button === 1 && libD.IE))
			{
				var w = this.libD_WSWin;
				w.show();
				if(w._libD_WM_state && clickedOnWM)
				{
					w._libD_WM_mouse = {clientX : e.clientX + libD.scrollLeft(null, w.fixed()), clientY : e.clientY + libD.scrollTop(null, w.fixed()) };
					libD.wm._create_body_events(this);
				}
			}
			else if((e.button === 1  || e.button === 4) && clickedOnWM)
				this.libD_WSWin.toBeneath();

		},
		_mousemove : function (e)
		{

			if(!e)e=window.event;

			var W = this.libD_WSWin,
			    w = libD.width(W.win),
			    h = libD.height(W.win),
			    x = e.clientX - libD.left(W.win),
			    y = e.clientY - libD.top(W.win);

			W._libD_WM_tb.style.cursor = '';

			if(y < 18)
			{
				if(x < 18)
				{
					this.style.cursor = 'nw-resize';
					W._libD_WM_state = 1;
				}
				else if(w-x < 18)
				{
					this.style.cursor = 'ne-resize';
					W._libD_WM_state = 2;
				}
				else if (y < 5)
				{
					W._libD_WM_tb.style.cursor = W.win.style.cursor = 'n-resize';
					W._libD_WM_state = 3;
				}
				else
				{
					W._libD_WM_state = 6; //deplacer fenetre
					W.win.style.cursor = 'auto';
				}
			}
			else if (h-y < 18)
			{
				if( x < 18)
				{
					W.win.style.cursor = 'sw-resize';
					W._libD_WM_state = 4;
				}
				else if(w-x < 18)
				{
					W.win.style.cursor = 'se-resize';
					W._libD_WM_state = 5;
				}
				else if(h-y < 5)
				{
					W.win.style.cursor = 's-resize';
					W._libD_WM_state = 7;
				}
			}
			else if (x < 5)
			{
				W.win.style.cursor = 'w-resize';
				W._libD_WM_state = 8;
			}
			else if (w-x < 5)
			{
				W.win.style.cursor = 'e-resize';
				W._libD_WM_state = 9;
			}
			else
			{
				W.win.style.cursor = 'auto';
				W._libD_WM_state = 6;
			}
		},
		_cancelEvt : function(e)
		{
			if(!e) e=window.event;
			if(typeof e.stopPropagation !=='undefined')
			{
				e.stopPropagation();
			}
			else
			{
				window.event.cancelBubble = true;
			}
			libD.allowSelection(this.parentNode.parentNode.libD_WSWin.ws.area, false);
		},	
		_close_click : function()
		{
			this.parentNode.parentNode.libD_WSWin.close();
			libD.allowSelection(this.parentNode.parentNode.libD_WSWin.ws.area, true);
		},

		_max_click : function()
		{
			if(this.nodeName.toUpperCase() === 'A')
				var win = this.parentNode.parentNode.libD_WSWin;
			else
				var win = this.parentNode.parentNode.parentNode.libD_WSWin;

			win.maximize();
			libD.allowSelection(win.ws.area, true);
		},

		_min_click : function()
		{
			this.parentNode.parentNode.libD_WSWin.minimize();
			libD.allowSelection(this.parentNode.parentNode.libD_WSWin.ws.area, true);
		},

		_res_click : function()
		{
			if(this.nodeName.toUpperCase() === 'A')
				var win = this.parentNode.parentNode.libD_WSWin;
			else
				var win = this.parentNode.parentNode.parentNode.libD_WSWin;

			win.restore();
			libD.allowSelection(win.ws.area, true);
		},

		_pos : function (Win, l, t, w, h)
		{
			var win = Win.libD_WSWin,
			    L = win.ws.areaLimit,
			    mS = win._libD_WM_maxSize,
			    W = mS[0],
			    H = mS[1],
			    res = win.resizable,
			    s = Win.style;

			if(w !== null && res)
				w = Math.max(win.minWidth, 75, w);

			if (h !== null && res)
				h = Math.max(win.minHeight, 25, h);

	/* FIXME : optimize this ?? */
			if(l !== null)
			{
				if(L.left !== null && l < L.left)
				{
					if(w)
					{
						s.width = w - (L.left - l) + 'px';
						w = null;
					}
					s.left = L.left + 'px';
				}
				else if(w)
				{
					if(L.right !== null && l + w > W + L.left)
					{
						if(w > W)
						{
							if(res)
								s.width = W + 'px';
							s.left = L.left + 'px';
						}
						else
						{
							if(res)
								s.width = w + 'px';
							s.left = W + L.left - w + 'px';
						}
						w = null;
					}
					else
					{
						s.left = l + 'px';
						if(res)
							s.width = w + 'px';
						w = null;
					}
				}
				else
				{
					var _w = libD.width(Win);

					if(L.right !== null && l + _w > W + L.left && _w <= W)
						s.left = W + L.left - _w + 'px';
					else
						s.left = l + 'px';
				}
			}

			if (w !== null && res)
			{
				var _l = Win.offsetLeft;
				if(L.right !== null && _l + w > W && _w <= W)
					s.width = W-_l + 'px';
				else
					s.width = w + 'px';
			}

			if(t !== null)
			{
				if(L.top !== null && t < L.top)
				{
					if(h && res)
						s.height = h - (L.top - t) + 'px';

					s.top = L.top + 'px';
					return;
				}
				else if(h)
				{
					if(L.bottom !== null && t + h > H + L.top)
					{
						if(h > H)
						{
							if(res)
								s.height = H + 'px';
							s.top = L.top + 'px';
						}
						else
						{
							if(res)
								s.height = h + 'px';
							s.top = H + L.top - h + 'px';
						}
					}
					else
					{
						if(res)
							s.height = h + 'px';
						s.top = t + 'px';
					}
					return;
				}
				else
				{
					var _h = (win._libD_WM_tb.clientHeight || win._libD_WM_tb.offsetHeight) + win._libD_WM_tb.offsetTop;

					if(L.bottom !== null && t + _h > H + L.top && _h <= H)
						s.top = H + L.top - _h + 'px';
					else
						s.top = t + 'px';
				}
			}

			if(h !== null && res)
			{
				var _t = Win.offsetTop;
				if(L.bottom !== null && _t + h > H && h <= H)
					s.height = H - _t + 'px';
				else
					s.height = h + 'px';
			}
		},

		_w : function (W,s)
		{
			var m = W.minWidth, M = W.maxWidth;
			if(m > s || s < 75)
				return m < 75?75:m;
			else if(M && M < s)
				return M;
			else
				return s;
		},

		_h  : function (W,s)
		{
			var m = W.minHeight, M = W.maxHeight;
			if(m > s || s < 75)
				return m < 75?75:m;
			else if(M && M < s)
				return M;
			else
				return s;
		},

		_removeShadows : function (wl)
		{
			for(var i=0, len = wl.length; i< len; ++i)
			{
				libD.removeClass(wl[i].win, 'shadows');
			}
		},

		_restoreShadows : function (wl)
		{
			for(var i=0, len = wl.length; i< len; ++i)
			{
				libD.addClass(wl[i].win, 'shadows');
			}
		},

		Effects : {},

		clickAnywhereToFocus : true // will focus and a window is clicked. false = same behavior but jus on specialized elems (e.g title bar)
	}

	libD.wmMaximize_ = function (W,o,t,l, sT, sL)
	{
		var s = W.win.style;
		s.MozTransitionProperty = "top,bottom,right,left,width,height";
		s.KhtmlTransitionProperty = "top bottom right left width height";
		s.OTransitionProperty = "top,bottom,right,left,width,height";
		s.transitionProperty = "top bottom right left width height";

		s.MozTransitionDuration = "300ms";
		s.webkitTransitionDuration = "300ms";
		s.OTransitionDuration = "300ms";
		s.transitionDuration = "300ms";

		s.MozTransitionTimingFunction = "ease-out";
		s.webkitTransitionTimingFunction = "ease-out";
		s.OTransitionTimingFunction = "ease-out";
		s.transitionTimingFunction = "ease-out";


		var aL = W.ws.areaLimit, r = aL.right, b = aL.bottom;
		l = aL.left;
		t = aL.top;

		if(!l) l=0;
		if(!r) r=0;
		if(!t) t=0;
		if(!b) b=0;

		if(o !== 'height')
		{
			s.left = l + sL + 'px';
			s.right = - + sL + 'px';
		}
		if( o !== 'width')
		{
			s.top = t + sT + 'px';
			s.bottom = b - sT + 'px';
		}

	//	W.win.addEventListener("webkitTransitionEnd", F, false);
	//	W.win.addEventListener("MozTransitionEnd", F, false); //don't work
		setTimeout(
			function(){
				s.transitionDuration = "0s";
				s.OTransitionDuration = "0s";
				s.webkitTransitionDuration = "0s";
				s.MozTransitionDuration = "0s";
			},350);
	}

	libD.wmOldRestore = function (W)
	{
		if(W._libD_WM_moveMaximized)
		{
			return true;
		}
		libD.wm._removeShadows(W.ws.wl);
		libD.wm._opacity(W,0.75); 
		setTimeout(libD.wm._opacity,50, W,0.5); 
		setTimeout(libD.wm._opacity,100, W,0.25);
		setTimeout(libD.wm._opacity,150, W,0);
		setTimeout(libD.wm._opacity,250, W,0.25);
		setTimeout(libD.wm._opacity,300, W,0.50);
		setTimeout(libD.wm._opacity,300, W,0.75);
		setTimeout(libD.wm._opacity,300, W,1);
		setTimeout(libD.wm._restoreShadows, 350, W.ws.wl);

		return 200;
	}

	libD.wmRestore = function (W)
	{
		var w = W.win,s = w.style, area = W.ws.area, wArea = libD.width(area), hArea = libD.height(area);
		if(typeof W.width === 'number')
			s.width = libD.width(w) + "px";
		else
			s.width = libD.width(w) / wArea* 100 + "%";

		if(typeof W.height === 'number')
			s.height = libD.height(w) + "px";
		else
			s.height = libD.height(w) / hArea* 100 + "%";

		if(W.right === null)
			s.right = "auto";
		else if(typeof W.right === 'number')
			s.right = wArea - w.offsetLeft - w.offsetWidth + "px";
		else
			s.right =  (wArea - w.offsetLeft - w.offsetWidth) / wArea * 100 + "%";

		if(W.left === null)
			s.left = "auto";
		else if(typeof W.left === 'number')
			s.left = w.offsetLeft + "px";
		else
			s.left = w.offsetLeft / wArea * 100 + "%";

		if(W.top === null)
			s.top = "auto";
		else if(typeof W.top === 'number')
			s.top = w.offsetTop + "px";
		else
			s.top = w.offsetTop / hArea * 100 + "%";

		if(W.bottom === null)
			s.bottom = "auto";
		else if(typeof W.bottom === 'number')
			s.bottom = hArea - w.offsetTop - w.offsetHeight + "px";
		else
			s.bottom =  hArea - w.offsetLeft - w.offsetHeight / hArea * 100 + "%";

		libD.wm._removeShadows(W.ws.wl);

		setTimeout(function()
		{
			s.MozTransitionProperty = "top,bottom,right,left,width,height";
			s.webkitTransitionProperty = "top bottom right left width height";
			s.OTransitionProperty = "top,bottom,right,left,width,height";
			s.transitionProperty = "top bottom right left width height";
	
			s.MozTransitionDuration = "300ms";
			s.webkitTransitionDuration = "300ms";
			s.OTransitionDuration = "300ms";
			s.transitionDuration = "300ms";

			s.MozTransitionTimingFunction = "ease-out";
			s.webkitTransitionTimingFunction = "ease-out";
			s.OTransitionTimingFunction = "ease-out";
			s.transitionTimingFunction = "ease-out";
		},0);

		setTimeout(function()
		{
			s.webkitTransitionDuration = "0s";
			s.MozTransitionDuration = "0s";
			s.OTransitionDuration = "0s";
			s.transitionDuration = "0s";
			libD.wm._restoreShadows(W.ws.wl);
		},350);

		return 1;
	}

	libD.wmMaximize = function (W, o)
	{
			var w = W.win,
			    l = w.offsetLeft,
			    t = w.offsetTop,
			    s = w.style,
			    f =  W.fixed(),
			    sT = libD.scrollTop(W.ws.area, f),
			    sL = libD.scrollLeft(W.ws.area, f);

			s.left = l + 'px';
			s.top = t + 'px';

			s.right = (libD.width(W.ws.area) - l - w.offsetWidth) + 'px';
			s.bottom = (libD.height(W.ws.area) - t - w.offsetHeight) + 'px';

			s.width = 'auto';
			s.height = 'auto';

			libD.wm._removeShadows(W.ws.wl);

			setTimeout(libD.wmMaximize_, 0,W,o,l,t,sT,sL);
		
			return 350;
	}
	with(libD)
	{
		wm.Effects.maximize = wmMaximize;
		wm.Effects.restore = wmRestore;

	// divProtect will protect the wm : the wm keep working even when we are out of windows' parent or over an iframe
		wm.divProtect = document.createElement('div');
		with(wm.divProtect.style)
		{
			width='100%';
			zIndex='10000';
			height='100%';
			top='0';
			left='0';
			position='absolute';
			try{position='fixed';}
			catch(e){position = 'absolute';}
		}
	}

	if(!libD.defaultWM)
		libD.defaultWM = libD.wm;

	libD.moduleLoaded('wm');
});
