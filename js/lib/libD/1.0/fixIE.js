/*@cc_on
// DEPRECATED. use /share/js/fixIE.js instead.
// You don't need that file if you are using modernjs.js
// We fix setTimeout and setInterval in IE. Thx http://webreflection.blogspot.com/2007/06/simple-settimeout-setinterval-extra.html
(function(f)
{
	window.setTimeout =f(window.setTimeout);
	window.setInterval =f(window.setInterval);
})(
	function(f)
	{
		return function(c,t)
		{
			var a=[].slice.call(arguments,2);
			return f(
				function()
				{
					c.apply(this,a)
				},
				t
			)
		}
	}
);
@*/
