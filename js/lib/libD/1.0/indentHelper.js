/**
	@fileOverview Used to be indent.js. written in 2009. You don't need anything unless you use it with something different from TEXTAREAs. In that case, you'll need libD's dom.js.
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

if(!libD.t)
{
	/** see libD/core.js ; textContent abstraction. Instead of writing o.textContent = "text", always write libD.t(o, "text"), it's shorter and supports IE via its innerText property. Thanks to IE for that one.
	*/
	libD.t = function(o,t)
	{
		if(t === undefined)
			return o.textContent || o.innerText || '';
		if(o.textContent !== undefined)
			o.textContent = t;
		else if(o.innerText !== undefined)
			o.innerText = t;
		else
			o.nodeValue = t;

		return t;
	};
}

if(!libD.addEvent)
{
	libD.addEvent = function (o,evt,fn)
	{ // Embeded addEvent, to allow using the script without libD's utils.js.
		try{o.addEventListener(evt, fn, false);}
		catch(e){o.attachEvent('on'+evt,fn);}
	}
}

/** Will (des)indent the given textarea.
	@param o The textarea to manage
	@param Indent if true, indent the selection. Otherwize, indent the current line (when e.g. a new line was created). The currentLine is where the caret is.
	@param desindent If true, desindent instead of indenting.
*/
libD.indentTextareaAction = function (o, Indent, desindent, afterEnterPress)
{
	var IE = false;/*@cc_on var IE = true; @*/
	var NL = IE?"\r\n":"\n", nlLen = NL.length;

	var value = o.value;

	if(document.selection)
	{
		if(typeof substr_count !== 'function')
		{
			substr_count = function (haystack, needle, offset, length)
			{
				// Returns the number of times a substring occurs in the string  
				// 
				// version: 1009.2513
				// discuss at: http://phpjs.org/functions/substr_count	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
				// +   bugfixed by: Onno Marsman
				// *	 example 1: substr_count('Kevin van Zonneveld', 'e');
				// *	 returns 1: 3
				// *	 example 2: substr_count('Kevin van Zonneveld', 'K', 1);	// *	 returns 2: 0
				// *	 example 3: substr_count('Kevin van Zonneveld', 'Z', 0, 10);
				// *	 returns 3: false

				var pos = 0, cnt = 0;
				if (isNaN(offset)) {offset = 0;}
				if (isNaN(length)) {length = 0;}
				offset--; 
				while ((offset = haystack.indexOf(needle, offset+1)) != -1)
				{
					if (length > 0 && (offset+needle.length) > length)
						return false;
					else cnt++;
				}
				return cnt;
			};
		}

	/* thx :
		- http://the-stickman.com/web-development/javascript/finding-selection-cursor-position-in-a-textarea-in-internet-explorer/
		- https://mootools.lighthouseapp.com/projects/24057/tickets/99-elementinsertatcursor-ie7-and-newlines#ticket-99-2
	*/
		// The current selection
		var range = document.selection.createRange();
		// We'll use this as a 'dummy'
		var dup = range.duplicate();
		var value = o.value;
		var offset = value.length;
		dup.moveToElementText(o);
		dup.setEndPoint('StartToEnd', range);
		o.selectionEnd = offset - dup.text.length;
		dup.setEndPoint('StartToStart', range);
		o.selectionStart = offset - dup.text.length;

		if(typeof o.setSelectionRange !== 'function')
		{
			o.setSelectionRange = function (start, end)
			{
// thx CSTruter post #2 at http://www.codingforums.com/archive/index.php/t-90176.html
				var toStrip =substr_count(o.value.substring(0, start), '\r\n');
				start -= toStrip;
				end -= toStrip + substr_count(o.value.substring(start,end), '\r\n');
				var range = o.createTextRange();
				range.collapse(true);
				range.moveEnd('character', end);
				range.moveStart('character', start);
				range.select();
			}
		}
	}
	else if(typeof o.setSelectionRange !== 'function')
		o.setSelectionRange = function (start, end) {return;};

	var SCROLLTOP = o.scrollTop;

	if(Indent)
	{
		if(o.selectionStart === o.selectionEnd && !desindent)
		{
			var debut = value.substring(0, o.selectionStart);
			var debutLen = debut.length + 1;
			o.value = debut + '\t' + value.substring(o.selectionEnd);
			o.setSelectionRange(debutLen,debutLen);
		}
		else
		{
			var I = o.selectionStart, selEnd = o.selectionEnd, end=false;

			if(desindent && (value.charAt(I-1) === '\n' || value.charAt(I-1) === '\r') && (value.charAt(I) == ' ' || value.charAt(I) === '	'))
			{
				I++;
				selEnd = Math.max(selEnd, I);
				o.setSelectionRange(I, selEnd); // désindenter aussi la première ligne
			}

			var debut = value.substring(0, I);
			debutLen = debut.length;

			var i = I, c;
			while(i>=0 && !end)
			{
				if(nlLen === 2 && debut.charAt(i) === '\n')
					--i; //should never happen
				if(debut.charAt(i)===NL.charAt(0))
				{
					i+=nlLen;
					if(desindent)
					{
						c = debut.charAt(i);
						if(c === '\t' || c === ' ')
						{
							debut = debut.substring(0, i) + debut.substring(i+1, debutLen);
							debutLen--;
						}
					}
					else
					{
						debut = debut.substring(0, i) + '\t' + debut.substring(i, debutLen);
						debutLen++;
					}
					end=true;
				}
				else --i;
			}

			if(desindent)
			{
				c = value.charAt(0)
				if(i === -1 && (c === '\t' || c === ' '))
				{
					if(debutLen)
					{
						debut = debut.substring(1, debutLen);
						debutLen--;
					}
					else I++;
				}

				var entre = value.substring(I, selEnd).replace(
					new RegExp(NL + '(?:\t| {1,4})','g'), NL);
			}
			else
			{
				if(!end)
				{
					debut +='\t';
					debutLen++;
				}
				var entre = value.substring(I, selEnd).replace(
					new RegExp(NL + '([^' + NL + '])', 'g'), NL + "	$1");
			}

			var fin = value.substring(selEnd);
			o.value = debut + entre + fin;
			var debutLen = debut.length;
			o.setSelectionRange(debutLen , debutLen + entre.length);
		}
		o.scrollTop = SCROLLTOP;
	}	
	else
	{
		var SCROLLHEIGHT = o.scrollHeight,
			i = o.selectionStart - 1 - (afterEnterPress ? nlLen : 0),
			indenting ='',
			c;
		while(i>=0)
		{
			c = value.charAt(i);
			if(c === ' ' || c === '\t')
				indenting = c + indenting;
			else if(c === '\n' || c === '\r')
				break;
			else
				indenting = '';
			--i;
		}

		var debut = value.substring(0, o.selectionStart - (afterEnterPress ? nlLen : 0));
		var fin = value.substring(o.selectionEnd);
		o.value = debut + NL + indenting + fin;
		var select = debut.length + indenting.length + nlLen;
		o.setSelectionRange(select,select);
		o.scrollTop = SCROLLTOP + (o.scrollHeight - SCROLLHEIGHT);

	}

	if(typeof o.value === "undefined")
		o.innerHTML = o.innerHTML.replace(/\r?\n/g, '<br />');
};

libD.getIndentation = function(range, body)
{
	var reader = new libD.DomStreamReader(range.startContainer, range.startOffset, body);

	var c, ind = '';

	while(c = reader.back())
	{//libD.dbg('...' + c);
		if(c === '\t' || c === ' ')
		{//libD.dbg('++');
			ind = c + ind;
		}
		else if(c === '\n' || c === null)
		{//libD.dbg('stop');
			break;
		}
		else
		{
			ind = '';
		}
	}
	return ind;
}

libD.addIndentation = function (node)
{
	if(node.nodeName === '#text')
		libD.t(node, libD.t(node).replace(/\n/g, '\n\t'));
	else
		node.parentNode.repalceChild(node, document.createTextNode('\n\t'));

}

libD.desindentWithReader = function (reader)
{
	c = reader.current();
	while(c && c !== '\n')
	{
		c = reader.back();
	}

	c = reader.next();

	if(c === '\t')
	{
		reader.deleteFrom();
		reader.deleteTo(true);
	}
	else if(c === ' ')
	{
		reader.deleteFrom();
		var count = 0;
		do
		{
			++count;
			c = reader.next();
		}
		while(c === ' ');
		if(count < 8 && c === '\t')
			reader.deleteTo(true);
		else
			reader.deleteTo();
	}
}

libD.indentAction = function (o, Indent, desindent, afterEnterPress)
{
	if(o.value)
		return libD.indentTextareaAction(o, Indent, desindent, afterEnterPress);

	//This is a plain DOM object. STILL BUGGY ! (desindenting ; indenting multi lines)

	if(o.getSelection)
	{ // W3C

		//Hacky fix for chromium
		var lastChild = o.document.body.lastChild;
		if(lastChild.nodeName !== 'BR' && (tC=lastChild.textContent).charAt(tC.length-1) !== '\n')
			o.document.body.appendChild(document.createTextNode('\n'));
		/* chromium doesn't seem to take in account the last \n (it is event overwritten when you type), so we create one if there isn't any.
		   This forces files to end with a \n... but the behavior of gecko keeps almost perfectly unchanged. 
		   The almost only thing that changes is that you see a \n at the and of the source code.
		   The three lines make Gecko and chromium behave exactly the same way.
		*/


		var lastChild = o.document.body.lastChild,
		    tC;

		selObj = o.getSelection();
		
		var selI = 0,
		    selLen = selObj.rangeCount,
		    range,
		    rangeFragment,
		    rangeFragLen,
		    t, // a textNode
		    reader, // abstraction for reading the dom
		    ind,
		    c; // buffer char

		if(Indent)
		{
			if(desindent)
			{
				while(selI < selLen)
				{
					range = selObj.getRangeAt(selI);

					libD.desindentWithReader(
						new libD.DomStreamReader(range.startContainer, range.startOffset, o.document.body));

					if(!range.collapsed)
					{
						var div = document.createElement('div');
						div.appendChild(range.extractContents());

						reader = new libD.DomStreamReader(div, 0, div);

						c = reader.current();

						while(c)
						{
							do
							{
								if(c === '\n')
									break;
							}
							while(c = reader.next());

							if(c === '\n')
							{
								libD.desindentWithReader(reader);
								c = reader.next();
							}
						}

						while(div.lastChild)
							range.insertNode(div.lastChild);
						div = null;

					}
					++selI;
				}
				return;
			}
			else
			{
				while(selI < selLen)
				{// manage all the ranges
					range = selObj.getRangeAt(selI);
					
					if(range.collapsed)
					{
						t = o.document.createTextNode("\t");
						range.insertNode(t);

						range.setEndAfter(t);
						range.setStartAfter(t);
					}
					else
					{
						reader = new libD.DomStreamReader(range.startContainer, range.startOffset, o.document.body);
						do
						{
							c = reader.back();
						}
						while(c && c !== '\n');

						if(reader.currentNode.nodeName === '#text')
						{
							libD.t(reader.currentNode, reader.currentNodeString.substr(0, reader.offset + 1) + '\t' + reader.currentNodeString.substr(reader.offset + 1));
						}
						else
							reader.currentNode.parentNode.insertBefore(reader.currentNode.nextSibling, document.createTextNode('\t'));

						range.insertNode(libD.applyToDeepestNodes(range.extractContents(), libD.addIndentation));
					}
					++selI;
				}
			}
		}
		else
		{ // new line
			while(selI < selLen)
			{// manage all the ranges
				range = selObj.getRangeAt(selI);

				t = o.document.createTextNode("\n" + libD.getIndentation(range, o.document.body));

				range.deleteContents();

				range.insertNode(t);

				range.setEndAfter(t);
				range.setStartAfter(t);

				++selI;
			}
		}

		// set the selection
		if(t)
		{
			selObj.removeAllRanges();
			selObj.addRange(range);
		}
//		o.scrollTo(libD.left(t), libD.top(t));
//		console.log(libD.left(t), libD.top(t));
	}
}

/** Will manage the given textarea / DOM element : helps the user typing indented code listening to the keydown event of the element (enter = new indented line, tab = indent, shift+tab = desindent). Enter doesn't do anything special on IE.
	@param o The textarea or other DOM element to manage
*/
libD.indentHelper = function(o)
{
	if(o.nodeName === 'TEXTAREA')
		O = o;
	else
	{
		o = o.contentWindow;
		o.document.body.style.whiteSpace='pre'; //FIXME : support pre-wrap

		libD.addEvent(o.document, 'keypress',
			function(e)
			{
				if(e.keyCode === 13 || e.keyCode === 9)
				{
					e.preventDefault();
     					e.stopPropagation();
					return false;
				}
			}
		);
		libD.addEvent(o.document, 'keyup',
			function(e)
			{
				if(e.keyCode === 13 || e.keyCode === 9)
				{
					e.preventDefault();
				  	e.stopPropagation();
					return false;
				}
			}
		);
		O = o.document;
	}

	libD.addEvent(O, 'keydown',
		function (e)
		{
			if(!e){e = window.event};

			if(e.keyCode === 9) // TAB
			{
				libD.indentAction(o, true, e.shiftKey);

				try { e.preventDefault(); }
				catch(e){ e.returnValue = false; }
				return false;
			}
			if(e.keyCode === 13)
			{
				libD.indentAction(o, false, false);
				try { e.preventDefault(); }
				catch(e){ e.returnValue = false; }
				return false;
			}
		}
	);

	O._libD_indentHelper = true;
};

if(libD.moduleLoaded)
	libD.moduleLoaded('indentHelper');
