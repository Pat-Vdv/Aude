// The libD dbg tiny tools ;). Doesn't need extra libs.

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

if(!this.libD) libD = {};

if(!libD.rmElem) libD.rmElem=function(o){o.parentNode.removeChild(o);}
libD.dbg = function ()
{
	if(!libD.dbgElem)
	{
		libD.dbgElem = document.createElement('div');
		libD.dbgElem.id = "libD_dbg";
		var style = document.createElement('style');
		style.setAttribute('type', 'text/css');

		var cssText ='#libD_dbg{font-size:small;position:absolute;position:fixed;bottom:0;right:0;color:black;font-weight:bold}#libD_dbg p{background-color:rgba(200,255,200,0.5) !important;background-color:rgb(200,255,200);border:1px solid green;margin:0;margin-bottom:1px} #libD_dbg .date {color:silver;font-size:small}';

		if(style.styleSheet)
			style.styleSheet.cssText = cssText;
		else
			style.textContent = cssText;

		document.body.appendChild(style);
		document.body.appendChild(libD.dbgElem);
	}

	var p = document.createElement('p'), d = new Date;
	p.innerHTML = '<span class="date">' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '</span> ';

	for(var i=0, len=arguments.length; i < len; ++i)
	{
		p.appendChild(document.createTextNode((arguments[i].message ? arguments[i].message : arguments[i]) + (i+1 < len ? ' ':'')));
	}

	libD.dbgElem.appendChild(p);
	setTimeout(libD.rmElem, 7000, p);
};

libD.dbgPos = function(o,x,y)
{
	if(libD.dbgPosHideTo)
	{
		clearTimeout(libD.dbgPosHideTo);
		libD.dbgPosHideTo = 0;
	}

	if(!libD.dbgPosElem)
	{
		libD.dbgPosElem = document.createElement('div');
		with(libD.dbgPosElem.style)
		{
			height   =  "4px";
			width    =  "4px";
			position =  "absolute";
			zIndex = 2000;
			backgroundColor="red";
		}
	}
	with(libD.dbgPosElem.style)
	{
		display='block';
		left=libD.left(o) + x - 5 + 'px';
		top=libD.top(o) + y - 5 + 'px';
		document.body.appendChild(libD.dbgPosElem);
	}
	libD.dbgPosHideTo = setTimeout(libD.dbgPosHide, 3000);
};

libD.dbgDivPos = function (o)
{
	if(!libD.dbgPosDivElem)
	{
		libD.dbgPosDivElem = document.createElement('div');
		with(libD.dbgPosDivElem.style)
		{
			border = '2px solid green';
			position =  "absolute";
		}
	}

	with(libD.dbgPosDivElem.style)
	{
		width =  o.clientWidth - 4 + 'px';
		height =  o.clientHeight - 4 + 'px';
		left = o.offsetLeft + 'px';
		top = o.offsetTop + 'px';
	}

	o.parentNode.insertBefore(libD.dbgPosDivElem, o);
};

libD.dbgPosHide = function()
{
	libD.dbgPosElem.style.display='none';
};

if(libD.moduleLoaded)
	libD.moduleLoaded('dbg');
