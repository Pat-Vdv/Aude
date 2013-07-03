/**
	@fileOverview Let show and hide stuffs smoothly :).
	@requires (optional) libD's sizepos.js to have the "shrink" fonctionnality 
	@author Raphaël JAKSE
	@verion 1.0-dev

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

if(!this.libD) libD = {};
if(!libD.need)libD.need = function(o,f,that,arg){f.apply(that || window, arg);};

if(!libD.getStyle)
{
	libD.getStyle = function (o, property)
	{
		if(document.defaultView)
		{
			try { return document.defaultView.getComputedStyle(o, null)[property];}
			catch(e) { return document.defaultView.getComputedStyle(o, null).getPropertyValue(property);}
		}
		else return o.currentStyle[property];
	};
}

/*
 Function: showSmoothly
	Show the element with a smooth transition, not to disturb the user.
	Parameters:
		e - The dom element to show. It e is undefined, will throw an error
		t - (optional) The duration in ms of the effect. Default : 500
		d - (optional) The delay in ms before begining the effect. Default : 0.
		s - (optional) The number of steps used to make the effect. Less for higher performences. Default : t * 0.03 in order to get a 30 FPS effect.
*/
libD.showSmoothly = libD.showQuietly = function (e,t,d,s)
{
	if(!e)
		throw("libD.showQuietly has been called with argument e undefined");

	if(e._libD_appearing) // opération en cours
		return;

	e._libD_disappearing = false;
	e._libD_appearing = true;
	
	if(libD.IE)
		return setTimeout(function(e)
		{
			try
			{
				if(!e || !e._libD_appearing || e._libD_disapearing)
					return;
				e._libD_appearing = false;
				e.style.display = '';
				if(e.currentStyle.display === 'none')
					e.style.display = 'block';
			}catch(e){alert(e)}
		}, d+t,e);

	
	if(!t)
		t=350;

	if(!d)
		d=0;

	if(!s)
		s= t * 0.03 ; // 30 fps

	var i = t / s;

	s=1/s;

	if(libD.getStyle(e,'display') === 'none' || !e.parentNode)
	{
		var o=0;
		e.style.opacity = '0';
	}
	else
	{
		var opac = e.style.opacity;
		if(e.style.opac === "0")
		{
			var o = 0;
			e.style.opacity = '0';
		}
		else if(opac === undefined || opac == null || opac === '1' || !opac)
		{
			e._libD_disappearing = false;
			return;
		}
		else
			var o = parseFloat(opac.replace(/,/g, '.'));
	}

	function f()
	{
		if(!e || !e._libD_appearing || e._libD_disapearing)
			return;	

		o+=s;
		if(o>1)
			o=1;
		else if(o === s && libD.getStyle(e,'display') === 'none')
			e.style.display='block';

		e.style.opacity = Math.round(o*100) / 100;

		if(o<1)
			setTimeout(f,i);
		else
			e._libD_appearing = false;
	}
	setTimeout(f,i + d);
};

/*
 Function: hideSmoothly
 Hide the element quietly.
 Parameters:
	e - The dom element to show. It e is undefined, will throw an error
	settings (optional)- An object with the following possible values that enables you to define hideQuietly's behavior :
	- time   : The duration in ms of the effect. Default : 500
	- delay  : The delay in ms before begining the effect. Default : 0.
	- steps  : The number of steps used to make the effect. Less for higher performences. Default : t * 0.03 in order to get a 30 FPS effect or 10 if t < 800
	- deleteNode : If true, will delete the dom element after the effect. Default : false
	- fade   : If true, will make the object fade. Default : true
	- shrink : If true and libD.height is defined, will make the object shrink. Default : false
	fade and shrink can be set to true at the same time.

	@returns Nothing
*/
libD.hideQuietly = function (e,settings)
{
	if(!e)
		throw("libD.hideQuietly has been called with argument e undefined");

	var deleteNode = false,
	    fade = true,
	    shrink = false,
	    eHeight = 1,
	    o = 1,
	    t = 500,
	    d = 0,
	    s;

	if(e._libD_disappearing) // opération en cours
		return;

	e._libD_appearing = false;
	e._libD_disappearing = true;

	if(libD.IE)
		return setTimeout(function(e)
		{
			try {
				if(!e || !e._libD_disappearing || e._libD_appearing)
					return;
				e._libD_disapearing = false;
				if(deleteNode)
					e.parentNode.removeChild(e);
				else
					e.style.display = 'none';
			}
			catch(e){alert(e);}
		}, d+t,e);
	
	if(typeof settings === 'object')
	{// r is not a dom not, it's a setting object
		if(settings.time)
			t = settings.time;
		if(settings.delay)
			d = settings.delay;
		if(settings.steps)
			s = settings.steps;
		if(settings.deleteNode)
			deleteNode = true;
		if(settings.fade !== undefined)
			fade = settings.fade;
		if(settings.shrink && libD.height)
		{
			eHeight = libD.height(e);
			shrink = true;
		}
	}

	if(s)
		s = 1/s;
	else
		s = 1 / (t < 800 ? 10 : t * 0.03);

	var i = t * s;

	if(libD.getStyle(e,'display') === 'none')
	{
		e.style.opacity = '';
		return;
	}
	else
	{
		var opac = libD.getStyle(e,'opacity');
		if(opac === '0' || opac === undefined)
		{
			if(deleteNode)
				return e.parentNode.removeChild(e);

			e.style.display = 'none';
			e.style.opacity = '';
			return;	
		}
		else if(opac === "" || opac === "1")
		{
			var o = 1;
			e.style.opacity = '';
		}
		else
		{
			try
			{
				var o = parseFloat(opac.replace(/,/g, '.'));
			}
			catch(err)
			{
				var o = 0;
			}
		}
	}

	if(shrink)
		var heightStep = Math.ceil(eHeight * s);

	function f()
	{
		if(!e || !e._libD_disappearing || e._libD_appearing)
			return;	

		if(fade)
		{
			o-=s;
			if(o<0){o=0;}

			e.style.opacity = Math.round(o * 100) / 100;
		}

		if(shrink)
		{
			eHeight -= heightStep;
			if(eHeight<0){eHeight=0;}

			e.style.height = eHeight + 'px';
		}

		if(o && eHeight)
		{
			setTimeout(f,i);
		}
		else
		{
			if(deleteNode)
				return e.parentNode.removeChild(e);

			e.style.display = 'none';
			e.style.opacity = '';
			e._libD_disappearing = false;
		}
	}
	setTimeout(f,i + d);
}
/** Will hide the element quietly. Just makes a call to libD.hideQuietly for compatibility with old projects
	DEPRECATED. Use hideQuietly instead.
	Parameters:
		e - The dom element to show. It e is undefined, will throw an error
		r (optional) - If true, e will be removed after the effect. Default : false
		t (optional) - The duration in ms of the effect. Default : 500
		d (optional) - The delay in ms before begining the effect. Default : 0.
		s (optional) - The number of steps used to make the effect. Less for higher performences. Default : t * 0.03 in order to get a 30 FPS effect or 10 if t < 800
	Returns:
		Nothing
*/
libD.disappearQuietly = function (e,r,t,d,s)
{
	libD.hideQuietly(e,{deleteNode:r, time:t,delay:d,steps:s});
};

if(libD.moduleLoaded)
	libD.moduleLoaded('fx');
