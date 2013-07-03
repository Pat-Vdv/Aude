/* DEPRECATED. see tree.js
	Enables you to create a highly customisable extremely light treeview.
	This uses UNIX like path representation.
	That is to say, path will, for the programmer, look like :
	 - /var/www
	 - /home
	But nothing prevent you from using crappy paths such as :
	 - /C:
	 - /C:/Windows/system

	This will create a wonderful tree with folders with name like "C:". That's no a problem.

	But some things to say :
	 - '/' cannot currently be used in a folder name
	 - '\' is a valid character in a folder name, like every printable unicode character but '/'
	 - to be able to use every printable unicode character, be sure to encode your html page in unicode.
	 - a path like C:\Windows\system will appear as a unique folder. Write C:/Window/system instead.

	Anyway, you should be using a unix like system, don't you ? Okay ===> [].
*/

function tree(div)
{
	this.tree = {c : [], d : document.createElement('ul'), path:''};
	/*
		c = children javascript representation;
		d = DOM object where children are drown (ul)
		e = folder's element (li)
		t = folder's name

		root only has c and d : root doesn't had name nether a DOM li because it is child of nothing.
		If you want to represent the root, which I find useless, you can do something like this :

--- HTML
		<div> <span onclick="show_hide_tree()"> + </span> Root : </div>
		<div id="tree" style="margin:2em"></div>
--- JS
		var Tree = new tree(document.getElementById('tree'));
	*/

	this.workingPath = this.tree;
	this.parentWorkingPath = null;

	div.appendChild(this.tree.d);

	var that = this;

	this.label_onclick  = function()
	{
		if(that.onclick)
		{
			try
			{
				that.onclick();
			}
			catch(e)
			{
				if(window.console && console.error)
					console.error(e);
			}
		}
		return false;
	}
}

libD.tree.prototype =
{
	append : function (p, folded)
	{
		/*
			Append the path to the working path.
			path can be a name as well as a path. If parents do not exist, they are created.
			if path begins by a '/', tree.append will work as if workingPath === '/'.
			Otherwise, tree.append will work inside workingPath.
		*/
		folded = !!folded;

		var path = p.split('/'), len = path.length, i=0;

		if(path[i] === '') ++i;
		if(path[len-1] === '') --len;

		if(p.charAt(0) === '/')
			var pathToAppend = this.tree;
		else
			var pathToAppend = this.workingPath;

		var b,a;

		while(i < len)
		{
			if(path[i] !== '')
			{
				if(!pathToAppend.c[path[i]])
				{
					pathToAppend.c[path[i]] = {
						c : [],
						d : document.createElement('ul'),
						e : document.createElement('li'),
						t : path[i],
						path : pathToAppend.path + '/' + p
					};

					pathToAppend.d.appendChild(pathToAppend.c[path[i]].e);

					if(pathToAppend.e)
					{
						var p = pathToAppend.e.firstChild.firstChild;
						p.className = p.className.replace(' empty', '');
					}

					this._path = pathToAppend; // for setWPath
					pathToAppend = pathToAppend.c[path[i]];

					b = this.element.cloneNode(true);
					b.firstChild._ul = pathToAppend.d;
					b.firstChild.onclick = this.a_fold;

					a = b.lastChild.lastChild;

					a.appendChild(document.createTextNode(' ' + path[i]));
					a.onclick = this.label_onclick;
					a._path = pathToAppend.path + '/' + p;

					pathToAppend.e.appendChild(b);
					pathToAppend.e.appendChild(pathToAppend.d);

					this._path.d.appendChild(pathToAppend.e);
				}
				else
				{
					this._path = pathToAppend; // for setWPath
					pathToAppend = pathToAppend.c[path[i]];
				}
			}
			++i;
		}
		return pathToAppend;
	},

	remove : function (p, children)
	{
		/*
			Works like append, but will destroy the last folder of path, if found.
			If the last folder of path has children, they will be destroyed too.

			if path begins by '/', tree.remove will work as if workingPath === '/'.
			Otherwise, tree.remove will work inside workingPath.

			tree.remove('/') will destroy anything
			tree.remove('') will remove the working path.

			if children is true, remove children of path instead of path.
		*/

		children = !!children;

		var path = p.split('/'), len = path.length, i=0;

		if(path[i] === '') ++i;
		if(path[len-1] === '') --len;

		if(p[0] === '/')
		{
			var parentWPath = null,
			    pathToRemove = this.tree;
		}
		else
		{
			var parentWPath = this.parentWorkingPath,
			    pathToRemove = this.workingPath;
		}

		var i=0;

		while(i < len)
		{
			if(path[i] !== '')
			{
				if(!pathToRemove.c[path[i]])
				{
					return; // path not found
				}
				else
				{
					parentWPath = pathToRemove;
					pathToRemove = pathToRemove.c[path[i]];
				}
			}
			++i;
		}
		if(children || pathToRemove === this.tree)
		{
			var ch = pathToRemove.c;

			for(i in ch)
			{
				if(this.workingPath === ch[i])
				{
					this.workingPath = this.tree;
					this.parentWorkingPath = null;
				}

				pathToRemove.d.removeChild(ch[i].e);
				delete pathToRemove.c[ch[i].t];
			}
			parentWPath = pathToRemove;
		}
		else
		{
			pathToRemove.e.parentNode.removeChild(pathToRemove.e);
			if(this.workingPath === pathToRemove)
			{
				this.workingPath = this.tree;
				this.parentWorkingPath = null;
			}
		}

		if(parentWPath !== null)
		{ // removing path's object from its parent
			delete parentWPath.c[pathToRemove.t];
			if(!parentWPath.d.firstChild) // if no more child in parent, .tree-fold -> .empty
				parentWPath.e.firstChild.firstChild.className += ' empty';
		}
	},

	setWPath : function(path)
	{
		/*
			Chroot actions in order to save CPU time (avoid useless loops).
			The idea is when appending a lot of folder to one in e.g. a loop,
			set the working path to their parent and call tree.append(folder).
			here, folder path[i]can of course be a path as well as only a name.
			WARNING : don't forget to come back to root ('/') if necessary.
			The default working path is '/'.

			If path begins with '/', the working path will be set from the root.
			Otherwise, working path will be set from inside current working path.

			eg. : workingPath === '/var/www'.
			 - tree.setWPath('home') will set workingPath as /var/www/home
			 - tree.setWPath('/home') will set workingPath as /home

			setWPath will call tree.append, so you don't need to call it.
			If the path doesn't exist, it will be created.
			calling tree.append(path) before or after setWSPath is therefore
			completely useless though it's not harmful for the tree. For user's CPU, maybe :P
		*/

		if(path === '/')
		{
			this.workingPath = this.tree;
			this.parentWorkingPath = null;
			return;
		}

		this.workingPath = this.append(path);
		this.parentWorkingPath = this._path; // append sets __path as the working path's parent.

		delete this._path; // becomes useless
	},

	a_fold : function ()
	{
		this.className = 'tree-unfold';
		this.onclick = libD.tree.prototype.a_unfold;
		this._ul.className = 'tree-ul folded';
		this.firstChild.textContent = 'unfold';
		this.firstChild.innerText = 'unfold';
		return false;
	},

	a_unfold : function ()
	{
		this.className = 'tree-fold';
		this.onclick = libD.tree.prototype.a_fold;
		this._ul.className = 'tree-ul not-folded';
		this.firstChild.textContent = 'fold';
		this.firstChild.innerText = 'fold';
		return false;
	},

	element : document.createElement('div')
};

libD.tree.prototype.element.className = 'tree-element';

(function()
{
	var eFold = document.createElement('a'),
	    t = document.createElement('span'),
	    e = libD.tree.prototype.element,
	    icon = document.createElement('span'),
	    txt = document.createElement('span');

	t.textContent = 'fold';
	t.innerText = 'fold';
	eFold.className = 'tree-fold empty';
	eFold.appendChild(t);
	eFold.href='#';

	icon.className = 'tree-icon';

	txt.className='tree-name';

	var labtxt = document.createElement('a');
	labtxt.className = 'tree-icon-label';
	labtxt.appendChild(icon);
	labtxt.appendChild(txt);
	labeltxt.href = '#';

	e.appendChild(eFold);
	e.appendChild(labtxt);
})();
