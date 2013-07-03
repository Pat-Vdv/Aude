/*
    Copyright (C) 2011  JAKSE Raphaël

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
	libD.t = function(o,t)
	{ // see core.js
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
}

libD.superPreviousSibling = function (node, root)
{
	var nS = null;
	do
	{
		nS = node.previousSibling;
	}
	while(!nS && (node = node.parentNode) && node !== root);
	return nS || null;
};

libD.superNextSibling = function (node, root)
{
	var pS = null;
	do
	{
		pS = node.nextSibling;
	}
	while(!pS && (node = node.parentNode) && node !== root);
	return pS || null;
};

libD.applyToDeepestNodes = function(node, callback)
{
	var cN = node.childNodes,i=0, len = cN.length;
	while(i < len)
	{
		if(cN[i].firstChild)
			libD.applyToDeepestNode(cN[i], callback);
		else
			callback(cN[i]);
		++i;
	}
	return node;
};


// Will provide a conveniant API for reading the DOM as a flow of chars
libD.DomStreamReader = function(node, offset, rootElement, o)
{
	if(!o) o = {};

	if(o.brAsNL === undefined)
		this.brAsNL = true;
	else
		this.brAsNL = o.brAsNL;

	if(o.handleImgAlt === undefined)
		this.handleImgAlt = true;
	else
		this.handleImgAlt = o.handleImgAlt;

	this.root = rootElement;

	this.deleteOffset = -1;

	this.enterNode(node, 'firstChild', offset);
}

libD.DomStreamReader.prototype =
{
// Will enter the node at the deepest level possible.
	enterNode : function(node, method, offset)
	{
		/* Method :
		    - firstChild : will take the node from its begining
		    - lastChild : will take the node from its end

//FIXME : offset when node === rootElement
		*/

		if(this.deleteOffset !== -1 && this.currentNode)
		{
			this.deleteTo(true, true);
			var setDelete = true;
		}
		else
			var setDelete = false;

		while(node[method])
		{//the deepest we can
			node = node[method];
		}

		if(node.nodeName === 'IMG' && this.handleImgAlt)
		{// img.alt ?
			this.currentNodeString = node.alt;
		}
		else if(node.nodeName === 'BR' && this.brAsNL)
		{
			this.currentNodeString = '\n';
		}
		else if(node.nodeName === '#text')
		{
			this.currentNodeString = libD.t(node);
		}
		else
		{
			this.currentNodeString = '';
		}

		this.currentNode = node;
		this.nodeLength = this.currentNodeString.length;

		if(method === 'firstChild')
			this.offset = Math.min(offset || 0, this.nodeLength);
		else
			this.offset = Math.max(0, this.nodeLength - (offset || 0));

		if(setDelete)
			this.deleteFrom();
	},

// We should not go at a upper level than node. 
	setRootElement : function(node)
	{
		this.root = node;
	},


// Called by back and next : handles cases where we are at the edge of the node
	_read: function(side)
	{
		if(side === 'back')
		{
			var sibling = 'superPreviousSibling',
			    child = 'lastChild';
		}
		else
		{
			var sibling = 'superNextSibling',
			    child = 'firstChild';
		}

		var ss = libD[sibling](this.currentNode, this.root);

		if(ss)
		{
			this.enterNode(ss, child, 0);
			if(side === 'next')
				--this.offset; // otherwise we skip a char
			return this[side]();
		}
		else
			return null;
	},

// Will move the cursor 1 char back and return the previous char or return null if no more char to read
	back: function()
	{
		if(this.offset)
			return this.currentNodeString[--this.offset];

		return this._read('back');
	},

// Will return the current char;
	current: function()
	{
		if(this.offset >= this.nodeLength) // nothing current (undefined) so behave like next
			return this.next();
		return this.currentNodeString[this.offset];
	},

// Will move the cursor 1 char after and return the next char or return null if no more char to read
	next: function()
	{
		if(this.offset + 1 < this.nodeLength)
			return this.currentNodeString[++this.offset];
		return this._read('next');
	},

	deleteFrom : function()
	{
		this.deleteOffset = this.offset;
	},

//FIXME : seems to be buggy
	deleteTo : function(includingCurrent, dontEnterNode)
	{
		if(this.deleteOffset === -1)
			return;

		if(includingCurrent)
		{
			var from = Math.min(this.deleteOffset, this.offset),
			    to   = Math.max(this.deleteOffset, this.offset) + 1;
		}
		else if(this.deleteOffset < this.offset)
		{
			var from = this.deleteOffset,
			    to   = this.offset;
		}
		else if(this.deleteOffset > this.offset)
		{
			var from = this.offset,
			    to   = this.deleteOffset;
		}
		else
		{
			this.deleteOffset = -1;
			return;
		}

		if(this.nodeLength <= to - from)
		{
			var oldNode = this.currentNode;

			if(!dontEnterNode)
			{
				var ss = libD.superNextSibling(oldNode, this.root);
				if(ss)
					this.enterNode(ss, 'firstChild', 0);
				else if(ss = libD.superPreviousSibling(oldNode, this.root))
					this.enterNode(ss, 'lastChild', 0);
			}

			if(oldNode.parentNode)
				oldNode.parentNode.removeChild(oldNode);
		}
		else
		{
			libD.t(this.currentNode,
				this.currentNodeString.substring(0, from) +
				this.currentNodeString.substring(to)
			);
		}
	}
};

if(libD.moduleLoaded)
	libD.moduleLoaded('dom');
