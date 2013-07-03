/*
   Copyright (c) Raphaël Jakse (Université Joseph Fourier), 2013

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

// NEEDS : automatadesigner.js, automata.js, saveAs, automaton2dot.js

(function() {
   "use strict";
   window.onselectstart = window.ondragstart = function(e) {
      e.preventDefault();
      return false;
   };

   if(!window.AutomataDesignerGlue) {
      window.AutomataDesignerGlue = {}
   };

   var enableAutoHandlingError = false;

   window.addEventListener('load', function() {
      AutomataDesigner.load();

      var splitter          = document.getElementById('splitter'),
          toolbar           = document.getElementById('toolbar'),
          results           = document.getElementById('results'),
          codeedit          = document.getElementById('codeedit'),
          automataedit      = document.getElementById('automataedit'),
          leftedit          = document.getElementById('leftedit'),
          automatoncode     = document.getElementById('automatoncode'),
          automatoncodeedit = document.getElementById('automatoncodeedit'),
          leftPane          = document.getElementById('left-pane'),
          fileautomaton     = document.getElementById('fileautomaton'),
          open              = document.getElementById('open'),
          save              = document.getElementById('save'),
          saveas            = document.getElementById('saveas'),
          exportBtn         = document.getElementById('export'),
          exportResult      = document.getElementById('export_result'),
          fileprogram       = document.getElementById('fileprogram'),
          exportFN          = '';

      window.addEventListener('keydown', function(e) {
         if(e.ctrlKey) {
            if(e.keyCode === 83) {
               save.onclick();
               e.preventDefault();
               return false;
            }
            if(e.keyCode === 69) {
               if(e.shiftKey) {
                  exportResult.onclick();
               }
               else {
                  exportBtn.onclick();
               }
               e.preventDefault();
               return false;
            }
         }
      });

      exportBtn.onclick = function() {
         var fn = prompt("Which name do you want to give to the exported image ? (give a .dot extension to save as dot format, .svg to save as svg)", exportFN);

         if(fn) {
            exportFN = fn;

            if(switchmode.value === 'design') {
               automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex);
            }
            else {
               AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
            }

            if(fn.length > 4 && fn.substr(fn.length-4) === '.svg') {
               saveAs(new Blob([AutomataDesigner.getSVG(AutomataDesigner.currentIndex)], {type:'text/plain;charset=utf-8'}), fn);
            }
            else {
               saveAs(new Blob([automaton2dot(get_automaton(AutomataDesigner.currentIndex))], {type:'text/plain;charset=utf-8'}), fn);
            }
         }
      };
      
      document.getElementById('redraw').onclick = function() {
         automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, true);
         AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
      };

      var automatonResult    = null,
          exportResultFN     = 'automaton.txt',
          exportResultTextFN = 'result.txt';

      exportResult.onclick = function() {
         if(automatonResult) {
            var fn = prompt("Which name do you want to give to the exported file ? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)", exportResultFN);

            if(fn) {
               exportResultFN = fn;
               var format = '.txt';
               if(fn.length > 4) {
                  format = fn.substr(fn.length-4);
               }

               switch(format) {
               case '.svg':
                  saveAs(new Blob([AutomataDesigner.outerHTML(results.querySelector('svg'))], {type:'text/plain;charset=utf-8'}), fn);
                  break;
               case '.dot':
                  saveAs(new Blob([automaton2dot(automatonResult)], {type:'text/plain;charset=utf-8'}), fn);
                  break;
               default:
                  saveAs(new Blob([automaton_code(automatonResult)], {type:'text/plain;charset=utf-8'}), fn);
               }
            }
         }
         else {
            var fn = prompt("Which name do you want to give to the exported text file ?", exportResultTextFN);
            if(fn) {
               exportResultTextFN = fn;
               saveAs(new Blob([results.textContent], {type:'text/plain;charset=utf-8'}), fn);
            }
         }
      };

      var sw = splitter.offsetWidth;
      var cm; // code mirror object

      function splitterMove (e) {
         var width = document.body.offsetWidth;
         splitter.style.left = (e.clientX*100 / width) + '%';
         leftPane.style.right = ((width - e.clientX)*100 / width) + '%';
         results.style.left =  ((e.clientX + sw)*100/width) + '%';
         AutomataDesigner.redraw();
      }

      splitter.onmousedown = function(e) {
         window.onmousemove = splitterMove;
         window.onmouseup = function() {
            window.onmousemove = null;
         };
      };
      
      function onResize () {
         var width = document.body.offsetWidth;
         results.style.left =  ((splitter.offsetLeft + sw)*100/width) + '%';
      }

      window.addEventListener('resize', onResize, false);
      splitterMove({clientX:splitter.offsetLeft});
      
      function automatonSetNumber(index) {
         AutomataDesigner.setCurrentIndex(index);
         automatoncodeedit.value = AutomataDesigner.getAutomatonCode(index);
      }

      var switchmode = document.getElementById("switchmode");
      switchmode.onchange = function() {
         switch(this.value) {
         case "program":
            toolbar.className = 'algomode';
            AutomataDesigner.disable();
            codeedit.classList.remove('disabled');
            automataedit.classList.add('disabled');
            if(!cm) {
               cm = CodeMirror(codeedit, {lineNumbers:true});
               var codemirrorNode = cm.getWrapperElement();
               listenMouseWheel(function(e, delta) {
                  if(e.ctrlKey) {
                     var fs = parseFloat(window.getComputedStyle(codemirrorNode, null).fontSize);
                     codemirrorNode.style.fontSize = (fs + 2*delta) + 'px';
                     cm.refresh();
                     e.preventDefault();
                     return false;
                  }
               });
            }
            break;
         case "design":
            toolbar.className = 'designmode';
            codeedit.classList.add('disabled');
            automataedit.classList.remove('disabled');
            automatoncode.classList.add('disabled');
            AutomataDesigner.svgContainer.classList.remove('disabled');
            AutomataDesigner.enable();
            onResize();
            break;
         case "automatoncode":
            AutomataDesigner.disable();
            automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex);
            toolbar.className = 'automatoncode';
            codeedit.classList.add('disabled');
            automataedit.classList.remove('disabled');
            automatoncode.classList.remove('disabled');
            AutomataDesigner.svgContainer.classList.add('disabled');
            onResize();
         }
      };

      automatoncodeedit.onchange = function() {
         if(this.value) {
            AutomataDesigner.setAutomatonCode(this.value, AutomataDesigner.currentIndex);
         }
      };

      var automataNumber = document.getElementById('n_automaton'),
          automatonCount = 0;

      document.getElementById('automaton_plus').onclick = function() {
         var o = document.createElement('option');
         o.textContent = automatonCount;
         o.id = "automaton_n" + automatonCount;
         automataNumber.appendChild(o);
         automataNumber.value = automatonCount;
         AutomataDesigner.newAutomaton(automatonCount);
         automatonSetNumber(automatonCount++);
      };

      document.getElementById('automaton_minus').onclick = function() {
         if(automatonCount > 1) {
            var curAutomaton = parseInt(automataNumber.value);
            automataNumber.removeChild(document.getElementById('automaton_n' + (automatonCount-1)));
            AutomataDesigner.removeAutomaton(curAutomaton);
            if(curAutomaton === automatonCount-1) {
               automatonSetNumber(automataNumber.value = automatonCount-2);
            }
            else {
               automatonSetNumber(curAutomaton);
            }
            --automatonCount;
         }
      };

      automataNumber.onchange = function() {
         automatonSetNumber(parseInt(automataNumber.value));
      };

      document.getElementById('automaton_plus').onclick();

      var offsetError = -1;
      window.onerror = function(message, url, lineNumber) {
         if(enableAutoHandlingError) {
            if(offsetError > -1) {
               handleError(message, lineNumber - offsetError);
            }
            else {
               offsetError = lineNumber-1;
            }
            return true;
         }
      };
      loadProgram(':');
      document.getElementById('algo-exec').onclick = function() {
         if(cm) {
            execProgram(cm.getValue());
         }
      };

      window.execProgram = function(code) {
         if(code) {
            loadProgram(code);
         }

         if(window.userProgram) {
            var res;
            try {
               res = userProgram();
            }
            catch(e) {
               if(e instanceof Error && 'stack' in e) {
                  var stack = e.stack.split("\n");
                  for(var i in stack) {
                     if(stack[i].match(location.href)) {
                        var details = stack[i].match(/:([0-9]+)(?::([0-9]+))?/);
                        if(details) {
                           handleError(e.message, parseInt(details[1]) - offsetError, e.stack, details[2]);
                        }
                        else {
                           handleError(e.message, e.lineNumber- offsetError, e.stack);
                        }
                        return;
                     }
                  }
                  handleError(e.message || e, e.lineNumber);
               }
               else {
                  handleError(e.message || e, e.ineNumber);
               }
               return;
            }
            
            if(res instanceof Automaton) {
               setAutomatonResult(res);
            }
            else if(res) {
               setTextResult(res.toString());
            }
            else {
               if(res === undefined) {
                  setTextResult("undefined");
               }
               else if(res === null) {
                  setTextResult("null");
               }
               else {
                  setTextResult(res);
               }
            }
         }
      };

      window.setTextResult = function (t, dontNotify) {
         automatonResult = null;
         var res = document.createElement('pre');
         res.textContent = t;
         results.textContent = '';
         results.appendChild(res);
         if(!dontNotify) {
            if((not && not.displayed) || !codeedit.classList.contains('disabled')) {
               notify("Program Result",res.cloneNode(true), 'normal');
            }
         }
      };

      window.setAutomatonResult = function (A) {
         automatonResult = A;
         var svgCode = Viz(automaton2dot(A), 'svg').replace(/<\?.*\?>/g, '').replace(/<![^>]*>/g, '');
         results.innerHTML = svgCode;
         if((not && not.displayed) || !codeedit.classList.contains('disabled')) {
            notify("Program Result", svgCode, 'normal');
         }
      };

      window.get_automaton = function(i) {
         if(automataNumber <= i) {
            error("get_automaton", "The automaton n°" + JSON.stringify(i) + " doesn't exist");
         }
         return read_automaton(AutomataDesigner.getAutomatonCode(i));
      };

      var not;
      window.notify = function(title, content, type) {
         if(!not || !not.displayed) {
            not = new libD.Notify({closeOnClick:true});
         }
         not.setTitle(title);
         not.setDescription(content);
         not.setType(type);
      };

      AutomataDesignerGlue.requestSVG = function(index) {
         try {
            AutomataDesigner.setSVG(Viz(automaton2dot(read_automaton(automatoncodeedit.value)), 'svg'), index);
         }
         catch(e) {
            console.log(e.message);
         }
      };

      var freader = new FileReader(), automatonFileName, programFileName;

      function openAutomaton() {
         freader.onload = function() {
            automatoncodeedit.value = freader.result;
            AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
         };
         freader.readAsText(fileautomaton.files[0], 'utf-8');
         automatonFileName = fileautomaton.value;
      }

      function openProgram() {
         freader.onload = function() {
            cm.setValue(freader.result);
         };
         freader.readAsText(fileprogram.files[0], 'utf-8');
         programFileName = fileprogram.value;
      }

      open.onclick = function() {
         if(switchmode.value === "program") {
            fileprogram.onchange = openProgram;
            fileprogram.click();
         }
         else {
            fileautomaton.onchange = openAutomaton;
            fileautomaton.click();
         }
      };

      var saveLink = document.createElement('a');
      
      function saveProgram(fname) {
         saveAs(new Blob([cm.getValue()], {type:'text/plain;charset=utf-8'}), fname);
      }

      function saveAutomaton(fname) {
         saveAs(new Blob([AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex)], {type:'text/plain'}), fname);
      }
      
      saveas.onclick = function() {
         var prog = switchmode.value === "program";
         var n = prompt("Please enter a name for the file in which the " + (prog ? "program" : "automaton") + " will be saved.", (prog ? "algo.ajs":"automaton.txt"));
         if(n) {
            if(prog) {
               saveProgram(programFileName = n);
            }
            else {
               saveAutomaton(automatonFileName = n);
            }
         }
      };
      
      save.onclick = function() {
         if(switchmode.value === "program") {
            if(!programFileName) {
               saveas.onclick();
            }
            else {
               saveProgram(programFileName);
            }
         }
         else {
            if(switchmode.value === 'automatoncode') {
               AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
            }

            if(!automatonFileName) {
               saveas.onclick();
            }
            else {
               saveAutomaton(automatonFileName);
            }
         }
      };

      switchmode.onchange();
   }, false);


   function handleError(message, line, stack, char) {
      var errorTitle = "Error on line " + line + (
            char === undefined ? ''
                               : ', character ' + char
            ),
          errorText  = message + (
             stack ? '\nStack trace : \n' + stack
                   : ''
          );

      notify(errorTitle, errorText.replace(/\n/g, '<br />').replace(/  /g, '  '), "error");
      setTextResult(errorTitle + "\n" + errorText, true);
   }

   window.loadProgram = function (code) {
      var script, head = document.querySelector('head');
      if(script = document.getElementById('useralgo')) {
         head.removeChild(script);
      }
      window.userProgram = null;
      script = document.createElement('script');
      script.id = 'useralgo';
      script.textContent = 'function userProgram() {"use strict";\n' + AutomatonJS.toPureJS(code) + '\n}';
      enableAutoHandlingError = true;
      head.appendChild(script);
      enableAutoHandlingError = false;
   };
})();