/**
	@fileOverview The core of libD and some convenience functions. Covers listenerSystem, l10n,domEssential packages too.
	@author Raphaël JAKSE
	@verion 1.0-dev 

    Copyright (C) 2010,2011  JAKSE Raphaël

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

/*
   Class: libD
   A lightweight and (hopefully) handful library.
*/

if(!this.libD)
{
	/** @namespace */
	libD={};
}

/*
Function: False

	This function lets you cancel a javascript event given in argument. If exists, it will also cancel 'window.event'.

	Parameter:
		e (optional) - a JS Event object

	Returns:
		false

	Usage:
		> button.onclick = function(e)
		> {
		> 	// ...
		> 	return libD.False(e);
		> }

		or

		> button.onclick = libD.False;

	Notes:
		"Canceling an event" here means stopping the event propagation (stopPropagation and cancelBubble). It will also prevent default action assiociated with the event (preventDefault).

		If nothing is given in arguments, libD.False will simply return false.

	See Also:
		<libD.cancelDefault>
*/

libD.False = function(e)
{
	if(!e && libD.IE)e=window.event;
	if(e)
	{
		libD.cancelDefault(e);

		if(e.stopPropagation)
			e.stopPropagation();
		else
			e.cancelBubble = true;
	}
	return false;
}

/*
Function: cancelDefault

	Cross browser preventDefault() - will prevent the default action associated to the event from happening.
	Thanks to Internet Explorer for this one.

	Parameter:
		e - the event to handle
	Returns:
		False
	See Also:
		<libD.False>
*/

libD.cancelDefault = function(e)
{
	if(e.preventDefault)
		e.preventDefault();
	else if(libD.IE)
		e.returnValue = false;

	return false;
}

libD.Void = function() {};

libD.error = function()
{
	var argv = Array.prototype.slice.call(arguments); // dark-magic obscure code to make an array with arguments
	argv.unshift('libD:');
	if(typeof console !== "undefined" && console.error && console.error.apply)
	{
		console.error.apply(console, argv);
      for(var i = 0, len = argv.length; i < len; ++i)
      {
         if(argv[i].description)
            console.error('-- Error is:', argv[i].name, ':', argv[i].description);
		}
	}
	else if(libD.dbg)
		libD.dbg.apply(libD, arguments);
//TODO: else...
}

/*
Function: addEvent
addEventListener abstraction, shorter to write. If addEventListener is used, useCapture (its third argument) will be set to false.
 
 Parameters:
	obj - The DOM object to listen
	event - The event to listen, like addEventListener
	fct - The function to call when the event is fired
	useCapture (optional) - addEventListener's useCapture

 Returns:
	addEventListener's or attachEvent's return value. 
 See Also:
	<libD.removeEvent>
	<libD.ready>
	<libD.load>
*/

libD.addEvent = function (obj, evt, fct, useCapture)
{
	if(evt === 'scroll')
	{ //FIXME : not supported yet
		if(!libD.scrollEvt)
			libD.scrollEvt = [];
	}
	else
	{
		if (obj.addEventListener)
			return obj.addEventListener(evt, fct, useCapture);
		else
		{
			if(!libD._IEeventWrappers[evt])
				libD._IEeventWrappers[evt] = [];
			if(!libD._IEeventWrappers[evt][fct])
				libD._IEeventWrappers[evt][fct] = [];
			var len = libD._IEeventWrappers[evt][fct].length;
			libD._IEeventWrappers[evt][fct][len] = (function(){fct.call(obj,window.event);});
			return obj.attachEvent("on" + evt, libD._IEeventWrappers[evt][fct][len]);
		}
	}
};

/*
Function: removeEvent
 removeEventListener abstraction, shorter to write. If removeEventListener is used, useCapture (its third argument) will be set to false.

 Parameters:
	obj - The DOM object listened
	event - The event to remove, like removeEventListener
	ftc - The function to call when the event is fired
 Returns:
	removeEventListener's or dettachEvent's return value.
 See Also:
	<libD.addEvent>
*/

libD.removeEvent = function (obj, evt, fct)
{
	if (obj.removeEventListener)
	{
		return obj.removeEventListener(evt, fct, false);
	}
	else if(libD._IEeventWrappers[evt] !== undefined && libD._IEeventWrappers[evt][fct] !== undefined) 
	{
		obj.detachEvent("on" + evt, libD._IEeventWrappers[evt][fct].pop());
		if(!libD._IEeventWrappers[evt][fct].length)
			delete libD._IEeventWrappers[evt][fct];
	}
};

/*
 Function: ready
 Call callback when the dom is ready as soon as possible (even if all images are not loaded) or if the dom is ready (you are sure your callback will be called)
 Parameter:
	callback - The function to call
 See Also:
	<libD.load>
	<libD.addEvent>
*/
libD.ready = function(callback)
{
	if(libD.domReady)
		callback();
	else
	{
		if(!libD.waitingDomReady)
		{
			libD.waitingDomReady = [callback];

			if(document.addEventListener)
			{ // if this event is not supported, onload event will fire _domIsReady
				document.addEventListener('DOMContentLoaded', libD._domIsReady, false);
			}
			else if(libD.IE)
			{// IE way, thx http://code.jquery.com/jquery-1.4.4.js (under MIT or GPL Version 2)

				// If IE and not a frame
				// continually check to see if the document is ready
				var toplevel = false;

				try {
					toplevel = window.frameElement == null;
				} catch(e) {}

				if ( document.documentElement.doScroll && toplevel ) {
					var doScrollCheck = function()
					{
					// The DOM ready check for Internet Explorer
						if ( libD.domReady)
							return;

						try {
							// If IE is used, use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							document.documentElement.doScroll("left");
						} catch(e) {
							setTimeout( doScrollCheck, 1 );
							return;
						}

						// and execute any waiting functions
						libD._domIsReady();
					}
					doScrollCheck();
				}
				else
					document.attachEvent("onreadystatechange", libD._domIsReady); //iframes

			}
		}
		else
			libD.waitingDomReady.push(callback);
	}
};

/** PRIVATE - Fired when the dom is ready (as soon as possible), you should not use this function. */
libD._domIsReady = function()
{
	if(libD.domReady) return;
	libD.domReady = true;
	var i;
	for(var i in libD.waitingDomReady)
	{
		try {libD.waitingDomReady[i]();}
		catch(e){libD.error('ready event failed', e);}
	}
	delete libD.waitingDomReady;

	libD.moduleLoaded('ready');
}

/* Function: load
 Call callback when the window's 'load' event is fired or if the load event already happened (you are sure your callback will be called)
 Parameter:
	callback - The function to call
 See Also:
	<libD.ready>
	<libD.addEvent>
*/

libD.load = function(callback)
{
	if(libD.loadFired)
		setTimeout(libD.catchErrors, 0, callback);
	else
		libD.addEvent(window, 'load', callback);
}

/*
 Function: destroy  
 Recursively destroy an object ; returns nothing.
 Parameters:
	obj - The object to destruct
	recursive (optional) - If true, destroy recursively. default: true
*/
libD.destroy = function(obj, recursive)
{
	for (var i in obj)
	{
		if((typeof recursive === undefined || recursive) && ( typeof obj[i] === 'array' || typeof obj[i] === 'object' ) && obj[i] !== obj)
		{
			libD.destruct(obj[i]);
		}
		else
		{
			delete obj[i];
		}
	}
	delete obj;
};

/*
 Function: htmlspecialchars
 Returns s with "&" replaced by "&amp;", "<" by "&lt;" and ">" by "&gt;"
 Parameter:
	s - the String to escape
 Returns:
	a String
*/
libD.htmlspecialchars = function(s)
{
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 Function: trim
	remove spaces at the begining and the end of the string. DEPRECATED (standard javascript is going to do this natively).
	Parameter:
		s - the String to trim
	Returns:
		a String
*/
libD.trim = function(s)
{
	return s.replace(/^[\s]+/, '').replace(/[\s]+$/, '');
}

/*
 Function: getIndex
 Searches *child* in *array*, and return the corresponding index.
 Parameters:
	array - The Array in which we search
	child - the element to search in the array
	notFoundValue (optional) - The Number to return if child is not found in array. if not a number, array.length we be used instead.
	indexMin (optional) - exclude values that have an index < indexMin. TIP: can be used for optimisation matters.
	indexMax (optional) - can be used to excude values that have an index > len. TIP: If you already know array.length's value, you can set this argument to that value so getIndex doesn't have to get it itself - useful for optimisation matters.
	
 Returns:
	a Number
 See Also:
	<libD.freeIndex>
	<libD.removeEntry>
*/
libD.getIndex = function(array, child, notFoundValue, indexMin, indexMax)
{
	for(var len=indexMax || array.length, i = i || 0; i < len; ++i)
	{
		if(array[i] == child)
			return i;
	}
	return (typeof notFoundValue === 'number') ? notFoundValue : i;
}

/*
 Function: freeIndex
  Will delete array[index] properly (modifies array.length)
  Parameters:
	array - the array to work in. *This argument wil be modified !*
	index - the index of the object to remove from array
	len (optional) - if you already have array.length, you can give it as this argument for optimisation reasons. Defaults to array.length
 Note:
	if len >= index, freeIndex will do nothing
 Usage:
	The code :
		> a = [1, 2, 42, 3];
		> console.log(array.length);
		> libD.freeIndex(a,2, 4); // equivalent to freeIndex(a, 2) in term of results
		> console.log(a);
		> console.log(array.length);
	Prints:
	 > 4
	 > [1, 2, 3]
	 > 3
 See Also:
	<libD.getIndex>
	<libD.removeEntry>
*/
libD.freeIndex = function (array, index, len)
{
	var len= (len-1) || array.length - 1;

	if(index > len) return;

	for( ; index < len;++index)
	{
		array[index] = array[index+1];
	}
	array.pop();
}

/*
 Function: removeEntry
 Will remove entry from array properly.
 Shortend for and equivalent to :
 > libD.freeIndex(array, libD.getIndex(array, entry, null, indexMin, indexMax));

 Parameters:
  array - the array to work with. *This argument will be modified !*
  entry - the element to remove from array
  indexMin (optional) - entry should not be searched in indexes < indexMin (for performance purpose or other reasons)
  indexMax (optional) - entry should not be searched in indexes > indexMax. TIP: you can improve performance by specifying array.length here if you already know it
 Notes:
  if entry is not found, nothing will happen.
 Returns:
	libD.freeIndex's return value
*/
libD.removeEntry = function(array, entry, indexMin, indexMax)
{
	return libD.freeIndex(array, libD.getIndex(array, entry, null, indexMin, indexMax));
}

/*
 Function: ch
 "ch" as in "choice" - if defined, returns a. Otherwise, returns b.
 Parameters:
	a - user's variable
	b - default value
 Usage:
	> function createWindow(w, h)
	> {
	> 	win = newWin();
	> 	win.Width = libD.ch(w, 420); // Width will be set to w is defined, 420 otherwise
	> 	win.Height = libD.ch(h, 130); // Height will be set to h is defined, 130 otherwise
	> 	// ...
	> 	return win; // win's default size is 420×130.
	> }
*/
libD.ch = function(a,b)
{
	if(a === undefined)
		return b;
	return a;
};


/*
 Function: getExtStart
 Returns the position of the extension of the file, including the dot. If no extension is found, returns f.length
 Parameters;
  f - the filename, as String
  negativeIfNot (optional) - boolean. if True, and if no extension is found, return -1 instead of f.length
 Returns:
	a Number
 Usage:
 > function rename(file)
 > { // allow renaming a file forbiding extension changes
 > 	var extPos = libD.getExtStart(file),
 > 	    basename = file.name.substr(0, extPos),
 > 	    extension = file.name.substr(extPos); // if file doesn't have extension, will be an empty string. But take care, in this case user CAN set an extension...
 > 	    newName = window.prompt('Please give a new name to the file, or press cancel to abort', basename);
 >
 > 	if(newName)
 > 		file.name = basename + extension;
 > }
*/
libD.getExtStart = function(f, negativeIfNot)
{
	var len = f.length, i = Math.max(0,len-1), lastPos = len;
	while(i)
	{
		if(f.charAt(i) === '.')
		{
			if(lastPos === len || f.substr(i+1, 3) === 'tar')
				lastPos = i;
			else
				return lastPos;
		}
		--i;
	}
	if(negativeIfNot && lastPos === len)
		return -1;
	return lastPos;
};
/*
 Function: callWithArgv
 Returns a function that will apply arguments passed in the argv array within the context that, when called.
 Equivalent to function(){f.apply(that || this, argv);};
 Returns:
	a function
 Parameters:
	f - the function to call
	argv (optional) - arguments to pass to the function
	that (optional) - context in which f must be run. Defaults to this (the current context, often window)
*/
libD.callWithArgv = function(f, argv, that)
{
	return function(){f.apply(that || this, argv);};
};

/*
 Function: isJsLoaded
 Verifies whether the given javascript file is already loaded
 Parameter:
  fname - filename as String. Must match EXACTLY the src argument of the srcipt tag
 Returns:
	true if the js file is loaded, false otherwise.
 Usage:
	> if(!libD.isLoaded('/scripts/libEndTheWorld.js'))
	> 	libD.jsLoad('/scripts/libEndTheWorld.js');
 See Also:
	<libD.jsLoad>
	<libD.getJS>
	<libD.isCssLoaded>
	<libD.cssLoad>
	<libD.getCSS>
*/
libD.isJsLoaded = function(fname)
{
	for(var j=0, scripts = document.getElementsByTagName('script'), slen = scripts.length; j < slen; ++j)
	{
		if(scripts[j].src === fname)
			return true;
	}
	return false;
};

/*
 Function: jsLoad
 loads the javascript file given as argument
 Parameter
	fname - The path to the javascript file to load
 See Also:
	<libD.isJsLoaded>
	<libD.getJS>
	<libD.isCssLoaded>
	<libD.cssLoad>
	<libD.getCSS>
*/
libD.jsLoad = function(fname, callback, type, defer, async)
{
	var script = document.createElement('script');
	script.src = fname;
	script.type = type || 'text/javascript';
   script.onload = callback;
   if(defer) {
      script.defer = "defer";
   }
   if(async) {
      script.async = "async";
   }
	document.getElementsByTagName('head')[0].appendChild(script);
};

/*
 Function: getJS
 Loads the given javascript file. Won't load already loaded files.
 If the path giver is not absolute, will use the current javascript working directory (See <libD.jsPath>)
 If module is given, handle file like a libD module (module must start with '*')
 Parameters:
	fname - the name of the file to load
	force - load the file even if it is already loaded
	module - will treat this file as a libD module, thus allowing you benefit from libD's module loading infrastructure (See <libD.need>, <libD.getModule>, <libD.moduleLoaded>, <libD.unloadModule>, <libD.modulesLoaded>
 Note:
	Don't use it to load "official" libD modules. Use <libD.need> or <libD.getModule> instead.
 Usage:
	Load a simple script
	> libD.getJS('ControlTheWorld/2.0.js');

	Load a module - a good pratice is using a personnal prefix for your modules, in addition to the "*".
	> libD.need(['*god.shutDownEarth', 'matrix', 'sizepos'], function()
	> { // this function will be called when your module and libD's matrix and sizepos modules will be available
	>	shutDownEarth.init();
	> 	//...
	> 	var Earth = God.getElement('Earth'),
	> 	    dEarth = Earth.toDOMFormat(), // turn Earth into Javascript compliant format for easier manipulation
	> 	    width = libD.width(dEarth),
	> 	    height = libD.width(dEarth); 
	> 	// ...
	> 	var topLeftPosOfTheEarth = libD.getRealPos( // We need the position of the top left corner of the Earth
	> 		libD.getTransformMatrix(dEarth, null, width, height),
	> 		libD.left(dEarth),
	> 		libD.top(dEarth),
	> 		libD.getTransformMatrixCenter(dEarth, null, width, height)
	> 	);
	> 	shutDownEarth.byExplodingIt({method:'vogon', topLeftPosition:topLeftPosOfTheEarth});
	> });
	>
	> libD.getJS('/scripts/god/earthTools/shutdown.js', false, '*.god.shutDownEarth');
 Note:
	When loading a third-party module, this module must call libD.moduleLoaded at its end to register itself. Otherwise, functions which need it will never be called by the libD's module infrastructure.
	e.g. here, /scripts/god/earthTools/shutdown.js must have this piece of code *at its end* :

	> if(this.libD && libD.moduleLoaded) // this allows usage of the script without libD's core module
	> 	libD.moduleLoaded('*god.shutDownEarth');

See Also:
	<libD.need>
	<libD.getModule>
	<libD.unloadModule>
	<libD.moduleLoaded>
*/
libD.getJS = function(fname, force, module)
{
	if(module && libD.modulesLoaded[module] !== undefined)
		return;

	if(!fname.match(/^(?:(?:(?:ftp|http)s?|file):\/)?\//))
		fname = libD.jsPath + fname;

	if(!force && libD.isJsLoaded(fname))
		return;

	libD.jsLoad(fname);

	if(module)
		libD.modulesLoaded[module] = false;
};

/*
 Function: isCssLoaded
 Check whether the stylesheet given in argument is loaded.
 Parameter:
	fname - the path to the stylesheet EXACTLY as in the href attribute of the link tag
 Returns:
	true if the stylesheet is loaded, false otherwise
*/
libD.isCssLoaded = function (fname)
{
	for(var j=0, links = document.getElementsByTagName('link'), slen = links.length; j < slen; ++j)
	{
		if(links[j].href === fname)
			return true;
	}
	return false;
};

/*
 Function: cssLoad
 Loads the CSS given in argument
 Parameter:
  fname - the path of the stylesheet to load
*/
libD.cssLoad = function (fname)
{
	var link = document.createElement('link');
	link.href = fname;
	link.rel = 'stylesheet';
	link.type = 'text/css'; // useless for HTML 5, useful for XHTML.
	document.getElementsByTagName('head')[0].appendChild(link);
};

/*
 Function: getCSS
 You could have different themes for a single thing, and want to load the default theme of the thing only if another theme was not loaded yet for this thing.
 You could also want to use libD's default theme for everything, excepted for one of it's specific feature, like it's window manager or it's notifier.
 This function loads :
  - the stylesheet corresponding to the whatFor libD's feature in the chosen theme if fname is not given
  - the stylesheet of which you give the filename otherwise
 and register the stylesheet for the whatFor feature if given, so any getCSS call for this feature will be ignored

 Parameters:
  fname (optional) - the path to the stylesheet to load. If not given, will be calculated from whatFor an theme values
  whatFor (optional) - the feature corresponding to the stylesheet to load. If it is not a libD native feature, prefix it with a "*"
  theme (optional) - libD's theme to use. Defaults to the current theme used (see <libD.theme)
  
*/
libD.getCSS = function(fname, whatFor, theme)
{
	if(!fname)
		fname = libD.path + 'css/' + (theme || libD.theme) + '/' + whatFor + '.css';

	if(typeof whatFor === 'string' && libD.cssLoaded[whatFor])
		return;

	if(libD.isCssLoaded(fname))
		return;

	libD.cssLoad(fname);

	if(typeof whatFor === 'string')
		libD.cssLoaded[whatFor] = fname;
};

/*
 Function: getModule
 Loads the libD module given in argument.
 Note:
	Should not be needed by a normal script, used by libD internally.

	You can use this function for debugging purpose in a interractive javascript shell, though.

	If "firebug" is given as a module, Firebug Lite will be loaded, but as i'ts not a real libD module, you cannot use e.g libD.need with it. "firebug-beta" will load Firebug Lite Beta.
 Parameters:
	module - the libD module to load.
	forceReload - if true, will reload the module, if already loaded. Otherwise, if the module is already loaded, getModule will do nothing
 See Also:
	<libD.need>
	<libD.getJS>
	<libD.unloadModule>
	<libD.moduleLoaded>
*/
libD.getModule = function(module, forceReload)
{
	if(libD.modulesLoaded[module] === undefined)
	{
		libD.modulesLoaded[module] = false;

		if(module === 'json')
			module = '3rd/json2-custom';
		if(module === 'matrix')
			module = 'css3';
		else if(module === 'firebug')
			return libD.getJS('https://getfirebug.com/firebug-lite.js', forceReload);
		else if(module === 'firebug-beta')
			return libD.getJS('https://getfirebug.com/firebug-lite-beta.js', forceReload);

		//console.log('getJS ', module);

		libD.getJS(libD.path + module + '.js', forceReload);
	}
};

/*
 Function: getIcon
	returns the path of the icon asked.
 Parameters:
	icon - the name of the icon needed
	iconSize (optional) - string representating the size needed. Defaults to <libD.iconSize>.
	iconPack (optional) - path to the icon theme to use. Should follow the freedesktop naming convension, see <http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html>. Defaults to <libD.iconPack>. *Do not forget the trailing slash*.
 Usage:
	> var redo = libD.getIcon('actions/edit-redo');
	> // redo is : "/share/icons/oxigen/22x22/actions/edit-redo.png"

	> var paste = libD.getIcon('action/edit-paste', '32x32', '/MyFreakinGreatIconTheme/');
	> // paste is : "/MyFreakinGreatIconTheme/32x32/actions/edit-paste.png"

	> var newdoc = libD.getIcon('action/document-new', null, '/MyFreakinGreatIconTheme/');
	> // newdoc is : "/MyFreakinGreatIconTheme/22x22/actions/document-new.png"
 Returns:
	a path (String)
 See Also:
	<libD.iconIMG>
*/
libD.getIcon = function(icon, iconSize, iconPack)
{
	if(libD.getExtStart(icon, true) === -1)
	{
		if(!iconPack)
			iconPack = libD.iconPack;
		if(!iconSize)
			iconSize = libD.iconSize;
		return iconPack + iconSize + '/' + icon + '.png';
	}
	return icon;
};

/*
 Function:iconIMG
	Returns a DOM Img element having alt and title attribute set to alt and src attribute set according to the icon wanted.

	Parameters:
		icon - the name of the icon
		alt (optional) - the alt / title text to set. Default: ""
		iconSize (optional) - the size of the icon wanted. Default: <libD.iconSize>
		iconPack (optional) - path to the icon theme to use. Defaults to <libD.iconPack>.

	Notes:
		- For iconPack, *Do not forget the trailing slash*. The icon pack should follow the freedesktop naming convention, see <http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html>.
		- the argument alt is optional but highly recommanded for usability.

	See Also:
		<libD.getIcon>
*/
libD.iconIMG = function(icon, alt, iconSize, iconPack)
{
	var img = document.createElement('img');
	img.alt = img.title = alt || '';
	img.src = libD.getIcon(icon, iconSize, iconPack);
	return img;
}

/*
	Function:need
		Make modules given in argument available and then call the callback.

	Parameters:
		modules  - Array containing names of the modules you need. e.g. : ['wm', 'fx']
		callback - the function to call when modules are loaded
		context  (optional) - "this" for your function. Default : this (often window)
		argv (optional) - array of arguments which should be given to your function when called

	See Also:
		<libD.getModule>
		<libD.getJS>
		<libD.unloadModule>
		<libD.moduleLoaded>
	Note:
		There are some fake modules that can be used:
		 - 'ready': this module is "loaded" when/if the page is ready for DOM manipulations (when DOMContentLoaded is fired)
		 - 'load': this module is "loaded" when/if the page is completely loaded (window's load event)

		 These modules are guaranteed to be loaded even if the browser doesn't support the DOMContentLoaded event / libD is loaded after the page is ready/loaded.
*/

libD.need = function (modules, callback, context, argv)
{
	if(!context) context = this;
	if(!argv) argv = [];

	var needs = {}, nDependencies = 0;

	for(var i = 0, len = modules.length; i < len; ++i)
	{
		if(!libD.modulesLoaded[modules[i]])
		{

			if(!needs[modules[i]]) // small check for persons who don't know how to code well
			{
				needs[modules[i]] = true;
				++nDependencies;
			}

			if(libD.modulesLoaded[modules[i]] !== false && modules[i].charAt(0) !== '*')
			{
				// modules starting with '*' are third party script.
				// libD can handle them but not load them automatically.
				libD.ready(libD.callWithArgv(libD.getModule, [modules[i]]));
			}
		}
	}
	if(nDependencies)
	{
		//console.log('nDependencies:', nDependencies);
		libD.waitingForModules.push({needs:needs,context:context,callback:callback,argv:argv,nDependencies:nDependencies});
		//console.log('new waiting module : ', libD.waitingForModules.length -1);
	}
	else
		callback.apply(context, argv);
};

/*
	Function: moduleLoaded
		modules using the libD's Modules Infrastructure must call this function when they are ready.
	Parameter:
		module - the name of the module

	Note:
		Modules that are not part of libD should begin their name with a star (*).
		libD Apps should begin their name with "*app.". (like: '*app.imageViewer)
*/
libD.moduleLoaded = function (module)
{
	libD.modulesLoaded[module] = true;
	for(var W, i = 0, w = libD.waitingForModules, len = w.length,tmpLen; i < len; ++i)
	{
		W = w[i];
		if(W.needs[module])
		{
			delete W.needs[module];
			//console.log('module ', i, ': deps ', W.nDependencies);
			if(! --W.nDependencies)
			{
				libD.freeIndex(w, i);
            W.callback.apply(W.context, W.argv);

				tmpLen = w.length;
				if(tmpLen < len - 1)
					i=-1; // callback resolved dependencies ; recheck all waiting functions.
				else
					--i;
				len = tmpLen;
			}
		}
	}
};

/*
	Function: unloadModule
		Make libD forget about a module. Useful to force a module reload.
	Parameter:
		module - the name of the module

	Note:
		This function is still not supported
*/
libD.unloadModule = function (module)
{
	delete libD.modulesLoaded[module];
};

/*
	Value: waitingForModules
		Array of functions that are waiting for some modules to load.
*/
libD.waitingForModules = [];

/*
	Value: cssLoaded
		Array of style that were loaded with <libD.cssLoad>.
*/
libD.cssLoaded = [];

if(!libD.modulesLoaded)
{
	if(typeof JSON === 'undefined') // libD's json package useless, native JSON integrated. Behave like if libD's json package were loaded.
		libD.modulesLoaded = {json:true,ready:false,load:false,l10n:true,listenerSystem:true,domEssential:true};
	else
		libD.modulesLoaded = {l10n:true,ready:false,load:false,listenerSystem:true,domEssential:true};
}

//ready and load are metapackages. They are present when the page is ready / loaded.
//You can depend on them to have your function executed when the page is ready/loaded

libD.styles = {};

/*
 Value: IE
	True is the browser is IE. If the version of IE could be evaluated, libD.IE is set to the exact version of IE (float). False on any other browser.
	Note:
		If a brower is aware of conditional comments, it is detected as being IE.  navigator.appVersion is used to determine the version of IE (the number right after the "MSIE" part of the string)
*/

libD.IE = false;
/*@cc_on
	if (navigator.appVersion.indexOf("MSIE") === -1)
		libD.IE = true;
	else
		libD.IE=parseFloat(navigator.appVersion.split("MSIE")[1]);

	libD._IEeventWrappers = {};
@*/

/*
 Value: domReady
	if the document is ready, true, false otherise. In case libD is run outside a browser, this value is set to true by <libD._domIsReady>.
*/

libD.domReady = false;

if(!this.document)
/*
 Value: loadFired
	if the page is loaded, true, false otherise. If libD is run outside a browser, this value is set to true.
*/
	libD.loadFired = true; // not in a navigator
else
	libD.loadFired = document.readyState === 'complete';

if(libD.loadFired)
{
	libD._domIsReady();
	libD.moduleLoaded('load');
}
else
{
	libD.addEvent(window, 'load', function()
	{
		if(!libD.domReady)
			libD._domIsReady();

		libD.loadFired = true;
		libD.moduleLoaded('load');
	});
}
/*
	Value: jsPath
		Defines the place libD has to hit to load javascript files (see <libD.jsLoad>.
		Default: '/share/js/'.
*/
if(!libD.jsPath) {
   libD.jsPath = '/share/js/'; // default js path. Mind the '/' at the end.
}
/*
 Contant: majorVersion
	libD's major version, as string. For the version of libD you are exploring, it is set to "1.0".
*/
libD.majorVersion = '1.0';

/*
	Value: path
		Defines the place where libD is located.
		Default:
			- the actual path from where libD was loaded if libD succeeds in determining it
			- <libD.jsPath> + 'libD/' + <libD.majorVersion> + '/' otherwise
*/
if(!libD.path) {
   libD.path = libD.jsPath + 'libD/1.0/'; // if libD doesn't manage to determine where it is stored, default value.
}
/*
	Value: appPath
		Defines the place where libD Apps are located. Default: <libD.jsPath> + 'apps/'.
*/
if(!libD.appPath) {
   libD.appPath = libD.jsPath + 'apps/'; // default libD.app path. Mind the '/' at the end.
}
/*
	Value: theme
		The default theme used by concerned libD's various modules. Default: 'default'.
		themes are usually located in <libD.path> + 'css/'
*/
if(!libD.theme) {
   libD.theme = 'default';
}

/*
	Value: iconPack
		The default icon pack to use, when needed. Third party scripts / apps using libD are encouraged to use this value for integration matters.
*/
if(!libD.iconPack) {
   libD.iconPack = '/share/icons/oxygen/';
}

/*
	Value: iconSize
		The default icon size to use, when needed. Third party scripts / apps are encouraged to use this value as a fallback.
*/
if(!libD.iconSize) {
   libD.iconSize = '22x22';
}
/*
 Contant: pathWasGuessed
 If libD actually succeeded in finding it's location, this value is set to true. False otherwise.
*/
libD.pathWasGuessed = false;

(function()
{ // Here we try to determine where the libD is stored (sets libD.path).
  // if it fails, set it manually after loading libD's core.js. (not in libD.ready or window.onload)
	if(!this.document) return;
	var scripts = document.getElementsByTagName('script');
	var len = scripts.length, i = len-1;
	while(i>-1)
	{
		if(scripts[i].src.match("libD/" + libD.majorVersion.replace(/\./g, "\\.") + "/core\\.js"))
			break;
		--i;
	}
	if(i === -1) return;

	libD.path = scripts[i].src.replace(/core\.js$/, '');
	libD.pathWasGuessed = true;

})();

/*
 Function: objCat
	Concatenate the two objects passed in argument.

	Parameters:
		o1 - first object
		o2 - second object
*/

libD.objCat = function (o1,o2)
{
	var o = [];
	if(o1 && typeof o1 === 'object')
	{
		for(var i in o1)
			o[i]=o1[i];
	}

	if(o2 && typeof o2 === 'object')
	{
		for(var i in o2)
			o[i]=o2[i];
	}

	return o;
};

/*
	Function: inherit
		Makes a class inherit from a parent class. This is an OO emulation, might introduce a little overhead.

	Parameters:
		parent - The parent class
		Constructor (optional) - the constructor of your class
		Prototype - an object containing methods to add to the prototype of the class.

	Notes:
		- Constructor argument can be omited. In this case, Prototype becomes the second argument.
		  However, if you do not like this behavior and like to have a consistant/predictible argument ordering, you can set the Constructor argument to null and thus Prototype remains the third argument.

		- if a method is present is parent's prototype and child's prototype, the child version is used

		- When the class gets instanciated, the parent constructor is called and then, if given, the child constructor is called.

	Usage:
		> var childConstructor = libD.inherit(parentConstructor, function()
		> {
		> 	//the constructor of your class
		> }, {
		> 	// prototype of your class, can override methods or properties of parent's prototype.
		> 	// Optional.
		> });

		or :

		> var childConstructor = libD.inherit(parentConstructor,
		> {
		> 	// prototype of your class, can override methods or properties of parent's prototype.
		> 	// Optional.
		> });

		In this case, the constructor of the child class is the same as the parent classe's one

		This last code is equivalent to:
		> var childConstructor = libD.inherit(parentConstructor, null,
		> {
		> 	// prototype of your class, can override methods or properties of parent's prototype.
		> 	// Optional.
		> });

		After this, you can access to the prototype via childConstructor.prototype and instance objects of your class by doing:
		> var myInstance = new childConstructor([your arguments]);
*/

libD.inherit = function (parent, Constructor, Prototype)
{
	if(typeof Constructor === 'function')
	{
		var constr = function()
		{
			parent.call(this);
			return Constructor.apply(this, arguments);
		};
	}
	else
	{
		if(!Prototype)
			Prototype = Constructor;
		var constr = function()
		{
			return parent.apply(this, arguments);
		};
	}

	constr.prototype = libD.objCat(parent.prototype, Prototype);

	return constr;
};

// PACKAGE : domEssential

/*
	Function: t
		textContent abstraction, in order to support IE and standard browsers with the same line of code.
	
	Parameters:
		o - The DOM element to set/get the text
		t - (optional) the text to set.

	Returns:
		the text (or more precisely: t || textContent || innerText || nodeValue || '')

	Usage:
		Setting a text:
		 > o.textContent = "text"; // standard
		 > if(o.innerText !== undefined)
		 > 	o.innerText = "text" // IE on regular nodes
		 > else
		 > 	o.nodeValue = "text" // IE on XML nodes
		Becomes:
		 > libD.t(o, "text");

		Getting a text
		 > o.textContent || o.innerText || o.nodeValue || ''
		Becomes
		 > libD.t(o)
*/
libD.t = function(o,t)
{
	if(t === undefined)
		return o.textContent || o.innerText || o.nodeValue || '';
	if(o.textContent !== undefined)
		o.textContent = t;
	else if(o.innerText !== undefined)
		o.innerText = t;
	else
		o.nodeValue = t;

	return t;
};

/*
Function: removeNode
	Equivalent to o.parentNode.removeChild(o) where o can be a complex expression of a DOM object
	
	Parameter:
		o - the DOM object to remove
	Returns:
		removeChild's return value. 
	Note:
		rmElem is there for compatibility issues. Don't use it.
*/

libD.removeNode = libD.rmElem = function(o)
{
	if(o && o.parentNode)
		return o.parentNode.removeChild(o);
};

/*
 Function: emptyNode
	Remove all children of a node.
	Parameter:
		n - The node to empty
*/
libD.emptyNode = function (n)
{
	while (n.firstChild)
		n.removeChild(n.firstChild);
};

/*
 Function: previousElementSibling
	n.previousElementSibling in all browsers
	Parameter:
		n - the node to get the previousElementSibling.
 Note:
	libD.previousSibling is deprecated.
*/
libD.previousElementSibling  = libD.previousSibling = function(n)
{
	if(n.previousElementSibling)
		return n.previousElementSibling
	var pS = n.previousSibling;
	while(pS !== null && pS.nodeType !== 1)
		pS = pS.previousSibling;
	return pS;
}

/*
 Function: nextElementSibling
	n.nextElementSibling in all browsers
	Parameter:
		n - the node to get the nextElementSibling.
 Note:
	libD.nextSibling is deprecated.
*/
libD.nextElementSibling = libD.nextSibling = function(n)
{
	var nS = n.nextSibling;
	while(nS !== null && nS.nodeType !== 1)
		nS = nS.nextSibling;
	return nS;
}

/*
 Function: firstElementChild
	n.firstElementChild in all browsers
	Parameter:
		n - the node to get the firstElementChild.
 Note:
	libD.firstChild is deprecated.
*/
libD.firstElementChild = libD.firstChild = function(n)
{
	var fC = n.firstChild;
	while(fC !== null && fC.nodeType !== 1)
		fC = fC.nextSibling;
	return fC;
}


/*
	Function: hasClass
	Tests whether ele has the class cls or not.
	Parameters:
		ele - The DOM element to test
		cls - The class to test
	Returns:
		true if ele has cls, false otherwise.
	Source:
		Thanks to http://www.openjs.com/scripts/dom/class_manipulation.php

	FIXME: Using Regexp here could be harmful.
*/
libD.hasClass = function (ele,cls) {
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
};

/*
 Function: addClass
	Adds the class cls to ele.

	Parameters:
		ele - The DOM element to modify
		cls - The class to add

	Source:
		http://www.openjs.com/scripts/dom/class_manipulation.php
*/
libD.addClass = function(ele,cls) {
	if (!libD.hasClass(ele,cls)) ele.className += " "+cls;
};

/*
 Function: removeClass
	Removes the class cls from ele.

	Parameters:
		ele - The DOM element to modify
		cls - The class to add

	Source:
		http://www.openjs.com/scripts/dom/class_manipulation.php
*/
libD.removeClass = function (ele,cls) {
	if (libD.hasClass(ele,cls)) {
		var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
};

/*
 Function: classToggle
	Toogles the class n on o : if o has the class n, cls will be removed from o. Otherwise, it will be added.
	
	Parameters:
		o - The DOM element to modify
		n - The class to toggle
*/
libD.classToggle = function(o,n)
{ // !! not tested
	if(libD.hasClass(o,n))
		libD.removeClass(o,n);
	else
		libD.addClass(o,n);
};

/*
	Function: replaceClass
		Replace the class f to n from o : if o has the class f, it will be replaced by n.

	Parameters:
		o - The DOM element to modify
		n - The class to replace

	FIXME: Using Regexp here could be harmful.
*/
libD.replaceClass = function(o,f,n)
{
	o.className = o.className.replace(new RegExp(f, 'g'), n);
}

/*
	Function: getStyle
		Get the actual (currently used) value of a CSS property for the given element.

	Parameters:
		o - the DOM element
		property - (optional) the CSS property as string, writen as in a CSS file.

	Notes:
		for the 'float' property, both 'float' and 'cssFloat' work.
		If property is not given, the entire style collection is returned.

	Returns:
		The value of the property if property was given, or what getComputedStyle returns otherwise.

		In browsers that don't support o.currentStyle (The IE way), the style object returned by getComputedStyle is "cached" in o.currentStyle. However, this is not a behavior you should rely on if you want your script to be forward-compatible.
	
*/
libD.getStyle = function(o, property)
{
	if(property) // getPropertyValue ?
		if(property === 'float')
			return (o.currentStyle || (o.currentStyle = document.defaultView.getComputedStyle(o, null))).cssFloat || o.currentStyle.styleFloat;
		else
			return (o.currentStyle || (o.currentStyle = document.defaultView.getComputedStyle(o, null)))[property];
	try
	{
		return (o.currentStyle || (o.currentStyle = document.defaultView.getComputedStyle(o, null)));
	}
	catch(e)
	{
		libD.error('getStyle Failed', e);
	}
};

/* Function: titleBlink
 Makes the titlebar blink. Will alternatively set window.title to m and to the current title. The current window.title will be restored on user's attention and the title stops blinking.

	Parameters:
		m  - (optional) the message to show (default: '')
		tm - (optional) the message is displayed during tm ms (default:1500)
		tc - (optional) the current title is displayed during tc ms (default:2000)
*/

libD.titleBlink = function(m, tm, tc)
{
	if(!m) m = '';
	if(!tm) tm = 1500;
	if(!tc) tc = 2000;

	var msgShown = false, currentTitle = document.title, to;

	var changeTitle = function()
	{
		if(msgShown)
		{
			msgShown = false;
			document.title = currentTitle;
			to = setTimeout(changeTitle, tc);
		}
		else
		{
			msgShown = true;
			document.title = m;
			to = setTimeout(changeTitle, tm);
		}
	};

	changeTitle();

	var stopBlinking = function()
	{
		libD.removeEvent(window, 'mousemove', stopBlinking);
		libD.removeEvent(window, 'keypress', stopBlinking);
		libD.removeEvent(window, 'focus', stopBlinking);
		if(to)
			clearTimeout(to);
		document.title = currentTitle;
	};
	libD.addEvent(window, 'mousemove', stopBlinking);
	libD.addEvent(window, 'keypress', stopBlinking);
	libD.addEvent(window, 'focus', stopBlinking);
};

// PACKAGE : listenerSystem

/*
 Function: setListenerSystem
	Make an object able to trigger events. This sets addListener and removeListener method on the object to allow monitoring events of the object.

	Parameter:
		o - the object to "eventize".

	Returns:
		a function that will allow triggering events.

	Usage:
		You want to make instances of your class myClass event-enabled :
		> var myClass = function()
		> {
		> 	// ...
		> };
		
		> myClass.prototype = 
		> {
		> 	// ...
		> };

		All you have to do is calling libD.setListenerSystem on your instance and storing the result somewhere. A conveniant way to do this is to call setListenerSystem in the constructor of your class :

		> var myClass = function()
		> {
		> 	// ...
		>
		> 	this._trigger = libD.setListenerSystem(myClass); // name it as you which but you should inform your users that they should not call this function.
		> };

		In the methods of your class, you can call this._trigger('myEvent') to trigger an event.
		Now, let's create an instance of your class.
		
		> var myInstance = new myClass;

		The script that created the instance needs to monitor your event 'myEvent'. addListener is available on your instance and ready to be used:

		> myInstance.addListener('myEvent', callback);

		Callback we be called whenever you fire 'myEvent'.
		If the script that created myInstance needs the callback to be called within a certain context (let's say the instance belong to an instance of another class we will call Host), this is also possible:

		> myInstance.addListener('myEvent', callback, Host);

		Here, the "this" object will refer to Host for the callback function.

		Now, you want to share data relative to the event with the callback function when it is fired. It is possible by passing an array of arguments that will be applied to the callback function when you fire the event:

		> this._trigger('myEvent', array_of_arguments_to_pass_to_the_callback_function);

		The callback function will receveive elements of array_of_arguments_to_pass_to_the_callback_function as arguments when it is called.

		Now, the script doesn't need to monitor the event anymore. A call to the removeListener method of the instance with the exact same arguments as those of addEventListener will do the job:

		> myInstance.removeListener('myEvent', callback, Host);

		
		= Example:
		Let's say we have a Despertador class that is used to conceive alarm clocks.
		It has:
		 - a setAlam method to set the "ringing time"
		 - a snooze  method to stop the alarm temporarly and make the alarm ring again in ten minutes.
		 - a stopAlarm method to stop the alarm definitively

		Users of the Despertador class can access to these events:
		 - "snooze" : The sleeper called the snooze method
		 - "alarmStop" : the sleeper definitively stopped the alarm. The user of the class has to know how many time the sleeper used the snooze function.
		 - "alarmSet" : The sleeper set the alarm time
		 - "alarmStart" : the alarm starts ringing.

		> function Despertador()
		> {
		> 	this.nbSnooze = 0; // the number of time the user pressed the snooze button. Private.
		> 	this.ringing = false; // the alarm clock is not ringing
		> 	this._trigger = libD.setListenerSystem(this); // you would initialize the event system here.
		> 	// [code to make the alarm clock work]
		> }
		>
		> Despertador.prototype = {
		> 	setAlam : function(hours, minutes)
		> 	{
		> 		this.hours = hours;
		> 		this.minutes = minutes;
		> 		this._tiggrer('alarmSet'); // the event is triggered without any data
		>	},
		> 
		> 	snooze : function()
		> 	{
		> 		if(this.ringing)
		> 		{
		> 			this.ringing = false;
		> 			this.nbSnooze++;
		> 			this._tiggrer('snooze', [nbSnooze]); // the event snooze is fired with the number of snoozes the user did, this one included
		> 			// [code to make the alarm clock ring in ten minutes]
		> 		}
		> 	},
		> 
		> 	stopAlarm : function()
		> 	{
		> 		if(this.ringing || this.nbSnooze)
		> 		{
		> 			this.ringing = false;
		> 			this._tiggrer('alarmStop', [nbSnooze]); // the event alarmStop is fired with the number of snoozes it took to the user to stop the alarm.
		> 			this.nbSnooze = 0;
		> 		}
		> 	}
		> };

		Now we need to know if our child is lazy.
		
		> var despertador_of_my_child = new Despertador; // instance of Despertador
		> // [we bind the instance of Despertador to a real alarm clock and give it to the child]
		> 
		> despertador_of_my_child.addListener('alarmStop', function(nb_snooze)
		> {
		> 	if(nb_snooze > 3)
		> 		alert('My child is lazy');
		> 	else
		> 		alert('The early bird catches the worm');
		> }); // we monitor the alarmStop event and use the data given
		> 
		> despertador_of_my_child.setAlam(6, 30); // alarm should ring at 6:30am. Here the alarmSet event is fired but not caught.
	Notes:
		addListener and removeListener are specific to each instance of the class, the prototype is not affected. Unless you call setListenerSystem on the prototype of your class. In that case, any event triggered by an instance of the class will be fired for all instances.

*/
libD.setListenerSystem = function(o)
{
	var listeners = {};

	o.addListener = function(event, callback, self)
	{
		if(!listeners[event])
			listeners[event] = [];

		listeners[event].push([callback, self || this]);
	}

	o.removeListener = function(event, callback, self)
	{
		var lt = listeners[event];
		if(!lt) return;

		if(!self) self = this;

		for(var i=0, len = lt.length; i < len ; ++i)
		{
			if(lt[i][0] === callback && lt[i][1] === self)
			{
				while(i + 1 < len)
				{
					lt[i] = lt[++i];
				}

				delete lt[i];
			}
		}
	}

	return function (event, argv)
	{
		var lt = listeners[event];

		if(!lt) return;

		for(var i=0,len = lt.length; i < len ; ++i)
		{
			try
			{
				lt[i][0].apply(lt[i][1], argv || []);
			}
			catch(e)
			{
				libD.error('callback of a listenerSystem failed', lt[i], e);
			}
		}
	};
};

// PACKAGE : l10n
/*
Function: l10n
	LibD's little localization tool. Returns a function (named here the localization function) that can be called is two ways.

Notes:
	libD.l10n uses the global value libD.lang. Changing it will make libD.l10n use the new language on the fly.
	libD.l10n is NOT a constructor. Don't call it will "new".

Usage:
	> var _ = libD.l10n();

	> _("lang", "hard-coded string", "translation in the lang 'lang'")
		Will register a new translation for the given string in the given language

	> _("Hard coded string")
		Will return the localized string or the hard-coded string itself

	In fact, "hard-coded string" can be anything that can be used as a Javascript Array index.
	Strings are good for that ; you should never use anything other that strings containing real sentences because it will be used as fallback if no translation is found.
	Ideally, use (one of) the most usual language(s) of your world that is Unicode compliant.
	e.g Earthmen/women, in 2012, you can use English.

	Obviously you can also choose your native language especially if the majority
	of the people who will use your app speak this language, if you don't speak any major language of your world or if you're anti-{put the name of the most usual language of your world}.
*/
libD.l10n = function()
{
	var t = [];

	var f = function (lang, orig, translated)
	{
		if(!orig)
			return libD.lang && t[libD.lang]  && t[libD.lang][lang] ? t[libD.lang][lang] : lang; // lang is the default string

		if(!t[lang])
			t[lang] = [];
		t[lang][orig] = translated;
	};
   return f;
};

/*
Function: format
   Format arguments into a string. This function is there to ease translations.

Usage:
   > var actualString = libD.format("My name is {0} and I'm {1}", Roger, 42); // returns "My name is Roger and I'm 42";

Notes:
   thx http://stackoverflow.com/questions/1353408/messageformat-in-javascript-parameters-in-localized-ui-strings
Returns:
   The formatted string.
*/

libD.format = function(s) {
    var args = arguments;

    return s.replace(/\{(\d+)\}/g, function() {
        return args[(parseInt(arguments[1]) || 0)+1];
    });
};

/*
 Value: lang
 Defines the language to use in scripts using libD and supporting localization. See <libD.l10n> for a convenient way to support localization in your app. Default: the navigator's language, or "en" otherwise.
*/
libD.lang = (this.navigator && (navigator.language || navigator.userLanguage) ? ((navigator.language || navigator.userLanguage).split('-'))[0].toLowerCase() : 'en') || 'en';