// Some numbers related functions.

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

libD.need(['sizepos'], function()
{
	libD.checkNumber = function (n)
	{
		// check wether the string N is a number. If so : check if % (and return a string) or not (and return a Number).
		// If not, return null.

		var N=null;

		if(typeof n === 'string' && n.charAt(n.length-1) === '%')
		{
			N = parseFloat(n);

			if(isNaN(N))
			{
				N=null;
			}
			else
			{
				N += '%';
			}

		}
		else if( typeof n !== 'undefined')
		{
			N = parseFloat(n);
			if(isNaN(N))
			{
				N=null;
			}
		}

		return N;
	};

	libD.getUnit = function (s)
	{
		/* Assume s to have a correct unit.
		   Works for %, deg, rad an all the 2-characters units that
		   doesn't end with a '%', a 'g' or a 'd'.
		   Some CSS units works, but grams, derivated and > 2 chars
		   units don't.
		FIXME : check all the units of CSS !*/
		var len = s.length, lC = s.charAt(len-1);
		if(lC === '%')
			return lC;
		else if(lC === 'g')
			return 'deg';
		else if(lC === 'd')
			return 'rad';
		else
			return s.charAt(len-2) + s.charAt(len-1);
	};

	libD.toPx = function(n, unit, fontSizeInPx, sizeInPx)
	{
		// Will convert px, in, cm, mm, pt and pc to px.

		if(!n) return 0;

		if(typeof fontSizeInPx === 'object' && fontSizeInPx.nodeName) //fontSizeInPx is a DOM node
			fontSizeInPx = libD.fontSizeInPx(fontSizeInPx);

		var ftIP = typeof fontSizeInPx === 'number';
		var sIP = typeof sizeInPx === 'number';

		if(unit === 'px')
			 return n;
		else if(unit === 'em' && ftIP)
			return n * fontSizeInPx;
		else if(unit === 'ex' && ftIP)
			return n * fontSizeInPx / 2; // buggy, but I don't care about ex. Never use them and you'll always be happy.
		else if(unit === '%' && sIP)
			return n * sizeInPx / 100;
		else if(!libD._1cm)
			throw('You have for sizepos module to be ready before calling toPx');

		if(unit === 'in')
			 return n * libD._1in;
		else if(unit === 'cm')
			return n * libD._1cm;
		else if(unit === 'mm')
			return n * libD._1cm / 10;
		else if(unit === 'pt')
			return n * libD._1in / 72;
		else if(unit === 'pc')
			return n * libD._1in / 6;
		else
			libD.error('unit given to libD.toPx :' + unit + " isn't supported");
		return false;
	};

	libD.strToPx = function(n, o, side)
	{ // side is 'width' or 'height'
	  // n is a string containing a number and a unit
	  // o is the dom object
		if(typeof n === 'number')
			return n;

		var u = libD.getUnit(n);
		if(u === '%')
			var r = libD[side](o);
		else
			var r = null;

		return libD.toPx(parseFloat(n), u, o, r)
	};

	libD.fontSizeInPx = function(o)
	{ // returns the font-size of the object in px.
		var s   = (o.currentStyle || document.defaultView.getComputedStyle(o,null)).fontSize.replace(/\,/,'.'),
		    S   = parseFloat(s),
		    u   = libD.getUnit(s);

		if(u === 'px')
			return S;
		else
		{
			if(u.charAt(0) === 'e' || u === '%')
				var fs = libD.fontSizeInPx(o.parentNode);
			else
				var fs = 0; // useless, but set anyway.

			return  libD.toPx(S,u,fs,fs); // fontSize = size in toPx because size of a font is relative to the parent's fontSize.
		}
	};

	libD.ready(function()
	{ // for using fontSizeInPx with cm, inches or derivated.
		var tmp_div1 = document.createElement('div'),
		    tmp_div2 = document.createElement('div');
		tmp_div1.style.height = '1in';
		tmp_div2.style.height = '1cm';
		document.body.appendChild(tmp_div1);
		document.body.appendChild(tmp_div2);
		setTimeout(function()
		{
			libD._1in = libD.height(tmp_div1);
			libD._1cm = libD.height(tmp_div2);
			document.body.removeChild(tmp_div1);
			document.body.removeChild(tmp_div2);
		}, 0);
		if(libD.moduleLoaded)
			libD.moduleLoaded('numbers');
	});
});
