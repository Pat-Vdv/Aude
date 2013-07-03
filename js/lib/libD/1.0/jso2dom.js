/*
	a JS Object to DOM converter. Useful to get a DOM structure quickly without innerHTML.
	Moreover, it let you get references to newly created DOM object. No need to use the HTML id attribute.
	This allow you to create completely safely isolated rich apps with less pain than using DOM directly.
	It saves you bytes and time :)
	Needs nothing to work
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

if(!this.libD) libD = {};
if(!libD.need)libD.need = function(o,f,that,arg){f.apply(that || window, arg);};
if(!libD.t)
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

libD.jso2dom = function (o, refs, parent, childrenListing) // JSON (Javascript) Object to DOM
{
/*
	This function turn o into DOM elems and creates references to these elements asked in o.
	If parent is a DOM elem, o DOMized is added to parent.

	The function returns o DOMized.
	
	 - Only o is a required argument
	 - Pass parent (DOM element) if you want o DOMized to be added to it
	 - Pass refs if you want to keep references asked in o.
	 - set childrenListing if you want the DOM children to be listed in refs under the key <childrenListing> */

	if(!refs)
	{
		refs = []; // Warning : refs will not be accessible from the outside
	}
//libD.dbg('refs1:' + typeof refs);
	if(!parent)
		parent = document.createDocumentFragment();

	if(typeof o[0] === 'string')
	{ // not a list of elems, just an elem
		if(o[0] === '#') // just a text node
			var DOM = document.createTextNode(typeof o[1] === 'string' ? o[1] : '');
		else if(o[0] === '#g')
			var DOM = parent;
		else
		{
			var tag = o[0].split('.'),
			    nameId = tag[0].split('#'),
			    DOM = document.createElement(nameId[0]),
			    classId;

			if(tag[1])
				classId = tag[1].split('#');
			else
				classId = [];

			if(nameId[1])
				DOM.id = nameId[1];
			if(classId[0])
			{
				DOM.className = classId[0];
				if(classId[1])
					DOM.id = classId[1];
			}
		}
		if(childrenListing)
		{
			if(refs[childrenListing])
				refs[childrenListing].push(DOM);
			else
				refs[childrenListing] = [DOM];

		}

		var o2 = o[1], o3 = o[2];
		if(o2)
		{
			var t2 = typeof o2;
			if(t2 === 'object')
			{
				var childHaveChildrenListing = false;
				if(o2.length === undefined)
				{ // o2 is a list of attributes
					for(i in o2)
					{
						if( i.charAt(0) === '#')
						{// special jsui2dom command
							if(i === '#cloop') // children of this elem will be listed as o2[i] refs' key.
								childHaveChildrenListing = o2[i];
							else if(i === '#') // DOM is registered in refs as o2[i].
								refs[o2[i]] = DOM;
							else if (i === "#loop") // DOM is registered in refs[o2[i] array.
							{
								if(refs[o2[i]])
									refs[o2[i]].push(DOM);
								else
									refs[o2[i]] = [DOM];
							}
							// Unknown commands are ignored
						}
						else
						{
							DOM.setAttribute(i, o2[i]);
						}
					}
				}
				else // o2 is a (list of) child(ren)
					o3 = o2;
			}
			else if(t2 === 'string')
			{ // o2 is a textContent
				if(o[0] === '#')
					libD.t(DOM, o2);
				else
					DOM.appendChild(document.createTextNode(o2));
			}
		}

		if(o3)
		{
			if(typeof o3 === 'string')
			{
				try {
					DOM.appendChild(document.createTextNode(o3));
				}
				catch(e) { DOM.textContent = o3; }
			}
			else // Here we assume that o3 is an array (a child or array of children). We don't do tests because it's useless if you use the function correctly.
				libD.jso2dom(o3, refs, DOM, childHaveChildrenListing); // DOMized o3 is added to DOM. we keep the refs the user asked for.
		}
		if(parent !== DOM)
		parent.appendChild(DOM);
	}
	else
	{
		var i = 0, len = o.length;
		while(i < len)
		{
			libD.jso2dom(o[i], refs, parent, childrenListing);
			++i;
		}
	}
//libD.dbg ('refs:' + refs.childNodes);
	if(parent.nodeType === 11 && parent.childNodes.length === 1)
		return parent.firstChild; //FIXME: What happens to the documentFragment Element ?
	return parent;
};

if(libD.moduleLoaded)
	libD.moduleLoaded('jso2dom');
