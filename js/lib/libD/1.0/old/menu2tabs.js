//needs libD's utils.js in order to work.

libD.menu2tabs = function(o)
{
	var li  = o.getElementsByTagName('li'),
	    i   = 0,
	    len = li.length,
	    currentA,
	    currentID,
	    currentTabContent,
	    openedTab = null,
	    activeLi = null;
	while(i < len)
	{
		if(currentA = li[i].getElementsByTagName('a')[0])
		{
			if(
			    (currentId = currentA.getAttribute('href').substring(1))
			&&  (currentTabContent = document.getElementById(currentID))
			)
			{
				if(openedTab === null)
				{
					openedTab = currentTabContent;

					libD.classRem(openedTab, 'libD-tabcontent-inactive');
					libD.classAdd(openedTab, 'libD-tabcontent-active');

					activeLi = li[i];

					libD.classRem(activeLi, 'libD-tab-inactive');
					libD.classAdd(activeLi, 'libD-tab-active');
				}
				else
				{
					libD.classRem(currentTabContent, 'libD-tabcontent-active');
					libD.classAdd(currentTabContent, 'libD-tabcontent-inactive');

					libD.classRem(li[i], 'libD-tab-active');
					libD.classAdd(li[i], 'libD-tab-inactive')
				}

				currentA._libD_tabContent = currentTabContent;
				currentA.onclick = function()
				{
					alert(1);
					try
					{
					if(this._libD_tabContent !== openedTab)
					{
						libD.classRem(openedTab, 'libD-tabcontent-active');
						libD.classAdd(openedTab, 'libD-tabcontent-inactive');

						openedTab = this._libD_tabContent;
						
						libD.classRem(openedTab, 'libD-tabcontent-inactive');
						libD.classAdd(openedTab, 'libD-tabcontent-active');


						libD.classRem(activeLi, 'libD-tab-active');
						libD.classAdd(activeLi, 'libD-tab-inactive');

						activeLi = this.parentNode;

						libD.classRem(activeLi, 'libD-tab-inactive');
						libD.classAdd(activeLi, 'libD-tab-active');
					}
					}
					catch(e){alert(e);}
					return false;
				}
			}
		}
		++i;
	}
}
