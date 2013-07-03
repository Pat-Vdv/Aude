/** You'll have to convince me for supporting this peace of code. */

if(!window.libD)libD = {};

libD._objConcat = function (o1,o2,key)
{
	for(i in o2[key])
	{
		if(typeof o1[key][i] === object && typeof o1[key][i] === object)
		{
			libD._objConcat(o1[key],o2[key],i);
		}
		else
		{
			o1[key][i] = o2[key][i];
		}
	}
};

/** Concatenate two objects. the two params are the two objects to concatenate. */
libD.objConcat = function (o1,o2)
{
	if(typeof o1 === 'undefined' || o1 === null)
	{
		if(typeof o2 === 'undefined')
		{
			o1=[];
		}
		else if(typeof o2 === 'object')
		{
			o1=o2;
		}
		else
		{
			o1=[o2];
		}
	}
	else if(typeof o1.concat === 'function')
	{
		o1=o1.concat(o2);
	}
	else if(typeof o1 === 'string' || typeof o1 === 'number' || typeof o1 === 'boolean' || typeof o1 === 'function')
	{
		if(typeof o2 === 'undefined' || o2 === null)
		{
			o1=[o1];
		}
		else
		{
			o1=[o1,o2];
		}
	}
	else if(typeof o1 === 'object')
	{
		if(typeof o2 === 'string' || typeof o2 === 'number' || typeof o2 === 'boolean' || typeof o2 === 'function')
		{
			o1=[o1,o2];
		}
		else if(typeof o2 === 'object')
		{
			for(i in o2)
			{
				if(typeof o1[i] === 'object' && o2[i] === 'object')
				{
					libD._objConcat(o1,o2,i);
				}
				else
				{
					o1[i]=o2[i];
				}
			}
		}
		else
		{
			return o1;
		}
	}
//may be useless :
	else if(typeof o2 === 'object')
	{
		return o2;
	}
	else
	{
		return [];
	}
};


/** Download url and call callback. Has to disappear*/
libD.get = function (url, callback)
{
	var bubble = null, to=null;

	if(typeof arguments[4] !== 'undefined' && arguments[4])
	{
		to = setTimeout(function () {
			try
			{
				var bubble = new Notify();
				bubble.setTitle("Téléchargement");
				bubble.setDescription(url);
				bubble.progress(0);
				bubble.setProgressInfo("Attente");
				bubble.show(system.area);
			}
			catch(e)
			{

			}
		}, 5000);
	}

	var xhr;
	try
	{
		xhr = new XMLHttpRequest();
	}
	catch(e)
	{
		try
		{
			xhr = new ActiveXObject('Microsoft.XMLHTTP');
		}
		catch(e)
		{
			return false;
		}
	}
	if(url.match(/(?:http|ftp)s?:\/\//) && libD.crossSiteGate)
	{
		url=libD.crossSiteGate + '?url=' + encodeURIComponent(url);
	}
	xhr.open('GET',url,true);

	var xml=true, context=window;
	if(typeof arguments[2] === 'undefined' || !arguments[2])
	{
		xml=false;
	}
	if(typeof arguments[3] !== 'undefined' && arguments[3])
	{
		context=arguments[3];
	}
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState === 4)
		{
			if(bubble)
			{
				bubble.progress(100);
				bubble.autoClose(5000);
				if(xhr.status === 200 || status === 302 || !status)
				{
					bubble.setProgressInfo("Terminé.");
					bubble.setType("ok");

				}
				else
				{
					bubble.setType("error");
					bubble.progress(-1);
					bubble.setProgressInfo("Erreur : " + xhr.status + " " + xhr.statusText);
				}
			}
			else if(to)
			{
				clearInterval(to);
			}

			try
			{
				callback.call(context, xml?xhr.responseXML:xhr.responseText, xhr.status, xhr.statusText);
			}
			catch(e)
			{

			}
		}

		else if(xhr.readyState === 3 && bubble)
		{
			try
			{
				if(typeof xhr.taille === "undefined")
				{
					xhr.taille = xhr.getResponseHeader('Content-Length');
				}
				var Taille = xhr.responseText.length;
				pourcent = Taille / xhr.taille * 100;
				bubble.progress(pourcent);
				bubble.setProgressInfo((Math.round(Taille / 10.24) / 100) + " Kio - " + Math.round(pourcent) + "% de " + (Math.round(xhr.taille / 10.24) / 100) + " Kio");
			}
			catch(e)
			{
				alert(e);
			}
		}
		else if(xhr.readyState === 2 && bubble)
		{
			bubble.setProgressInfo("Attente de la réponse...");
		}
		else if(xhr.readyState === 1 && bubble)
		{
			bubble.setProgressInfo("Connexion faite...");
		}
	};
	try
	{
		xhr.send(null);
	}
	catch(e)
	{
		if(bubble)
		{
			xhr.abbort();
			bubble.setType("error");
			bubble.progress(-1);
			bubble.setProgressInfo("Domaine refusé par le navigateur");
			callback.call(context, null, -1, "URL denied");
		}
	}
};
