/** @license WTFPL <http://www.wtfpl.net/txt/copying/> */

// thx http://www.adomas.org/javascript-mouse-wheel/ for explanations

var listenMouseWheel;

(function() {
   var scrollFunctions = [];
   function handleWheel(e) { 
      var delta = (e.wheelDelta ? e.wheelDelta/120 : (e.detail ? -e.detail/3 : 0));

      if(delta) {
         for(var i in scrollFunctions) {
            scrollFunctions[i](e, delta);
         }
      }
   }

   if('onmouseweel' in window)
      window.onmousewheel = handleWheel;
   else if('onmousewheel' in document)
      document.onmousewheel = handleWheel;
   else
      window.addEventListener('DOMMouseScroll', handleWheel, false);
      
   listenMouseWheel = function(f) {
      scrollFunctions.push(f);
   }
})();