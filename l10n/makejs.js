#!/usr/bin/env node

/*Makes translations available to Aude.*/

var fs = require('fs');

var langs = fs.readdirSync("po");
var po, i, len;

function skipLine() {
   while(i < len && po[i] !== '\n') {
      ++i;
   }
   ++i; 
}

function skipSpaces() {
   while(i < len && !po[i].trim()) {
      ++i;
   }
}

function parseString() {
   skipSpaces();
   if(po[i] !== '"') {
      return "";
   }
   ++i;
   var deb = i, end;
   while(i < len) {
      if(po[i] === "\\") {
         ++i;
      }
      else if(po[i] === '"') {
         var str1 = po.substring(deb, i++);
         var end = i;
         skipSpaces();
         var ndeb = i;
         var str2 = parseString();
         if(i === ndeb) { // we did not parse anything
            i = end;
            return str1;
         }
         else {
            return str1 + str2;
         }
      }
      ++i;
   }
   throw new Error("not ended string at character " + deb);
}

for(var l in langs) {
   var lang = langs[l];
   var jsFile = fs.openSync("js/" + lang + ".js", "w");
   fs.writeSync(jsFile, "(function(){var ");
   var poFiles = fs.readdirSync("po/" + lang);
   for(var p in poFiles) {
      var poFile = poFiles[p];

      var transitionFunction = fs.readFileSync("pot/" + poFile + 't', {encoding:'utf-8'})
                               .match(/\#TranslationFunction[\s]+([\S]+)/)[1];

      fs.writeSync(jsFile, "_=" + transitionFunction + "||v;");

      po = fs.readFileSync("po/" + lang + '/' + poFile, {encoding:'utf-8'});

      i = 0; len = po.length;
      while(i < len) {
         skipSpaces();

         if(po[i] === '#') {
            skipLine();
            continue;
         }
         if(po.substr(i, 5) === "msgid") {
            if(po[i+5].trim() && po[i+5] !== '"') {
               skipLine(); // don't understand this line
               continue;
            }
            i+=5;
            skipSpaces();
            msgid = parseString();
         }
         else if(po.substr(i, 6) === "msgstr") {
            if(po[i+6].trim() && po[i+6] !== '"') {
               skipLine(); // don't understand this line
               continue;
            }
            i+=6;
            msgstr = parseString();
            fs.writeSync(jsFile, '_("' + lang + '","' + msgid.replace(/\n/g,"") + '","' + msgstr.replace(/\n/g,"") + '");');
         }
         skipLine();
      }
   }
   fs.writeSync(jsFile, '})();');
   fs.close(jsFile);
}
