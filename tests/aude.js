var fs;
try {
   fs = require('fs');
}
catch(e) {
   if(typeof readFile !== 'undefined') {
      fs = {
         readFileSync: function(f) {
            return readFile(f);
         }
      };
   }
}

if(typeof console === 'undefined') {
   console = {
      log:function(l) {
         java.lang.System.out.println(l);
      }
   };
}

if(typeof process === 'undefined') {
   process = {
      argv: ['', ''].concat(arguments)
   }
}

if(typeof Packages === "object" && String(Packages) === "[JavaPackage ]") {
   // for Rhino
   global = this;
   require = function(js) {
      eval.call(global, readFile(js));
   }

}

var packages = ['set', 'automata', 'mappingfunction', 'audescript'];
for(var i in packages) {
   var p = require('../js/' + packages[i] + '.js');
   for(var j in p) {
      if(p.hasOwnProperty(j)) {
         global[j] = p[j];
      }
   }
}

// ignore run lines
global.run = global.get_automaton = global.get_automatons = function(){};
global.currentAutomaton = 0;

var gots = new Set();

function loadAJS(f) {
   var needs = [];
   var code = fs.readFileSync(f, {encoding:'utf8'});
   var jscode = Audescript.toPureJS(code, needs);
   getNeeds(needs);
   global.require = require;
   global.process = process;
   global.fs      = fs;
   global.arguments = process.argv.slice(2);
   eval.call(global, jscode);
}

global.getNeeds = function (needs, keepArgument) {
   if(keepArgument) {
      needs = need.slice();
   }

   while(needs[0]) {
      var algo = needs.shift();
      if(!gots.contains(algo)) {
         gots.add(algo);
         loadAJS('../algos/' + algo + '.ajs');
      }
   }
};
if(process.argv[2]) {
   loadAJS(process.argv[2]);
}
else {
   console.log('Usage:', process.argv[0],  process.argv[1], 'script.ajs');
}