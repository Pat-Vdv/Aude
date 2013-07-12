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
   
   var automatonResult   = null,
       blockResult       = false,
       waitingFor        = new Set(),
       launchAfterImport = false,
       _                 = libD.l10n(),
       offsetError,
       not;

   function notify (title, content, type) {
      if(!not || !not.displayed) {
         not = new libD.Notify({closeOnClick:true});
      }
      not.setTitle(title);
      not.setDescription(content);
      not.setType(type);
   }

   function setTextResult(t, dontNotify) {
      automatonResult = null;
      var res = document.createElement('pre');
      res.textContent = t;
      results.textContent = '';
      results.appendChild(res);
      if(!dontNotify) {
         if((not && not.displayed) || !codeedit.classList.contains('disabled')) {
            notify(_("Program Result"),res.cloneNode(true), 'normal');
         }
      }
   }

   function setAutomatonResult(A) {
      automatonResult = A;
      var svgCode = Viz(automaton2dot(A), 'svg').replace(/<\?.*\?>/g, '').replace(/<![^>]*>/g, '');
      results.innerHTML = svgCode;
      if((not && not.displayed) || !codeedit.classList.contains('disabled')) {
         notify(_("Program Result"), svgCode, 'normal');
      }
   }

   function setResult(res) {
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

   function handleError(message, line, stack, char) {
      var errorText  = message + (
                         stack ? _('\nStack trace: \n') + stack
                               : ''
                       ),
          errorTitle;
      if(char) {
         errorTitle = libD.format(_("Error on line {0}, character {1}"), line, char);
      }
      else {
         errorTitle = libD.format(_("Error on line {0}"), line);
      }

      notify(errorTitle, errorText.replace(/\n/g, '<br />').replace(/  /g, '  '), "error");
      setTextResult(errorTitle + "\n" + errorText, true);
   }

   function execProgram(code) {
      if(code) {
         window.loadProgram(code);
      }

      if(window.userProgram && waitingFor.isEmpty()) {
         blockResult = false;
         window.currentAutomaton = AutomataDesigner.currentIndex;
         var res;
         try {
            res = userProgram(window.reallyRun);
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
         if(blockResult) {
            blockResult = false;
         }
         else {
            setResult(res);
         }
      }
      else {
         launchAfterImport = true;
      }
   }

   window.onselectstart = window.ondragstart = function(e) {
      e.preventDefault();
      return false;
   };

   if(!window.Viz && window.Module) { // Viz glue
      var gv = Module.cwrap('graphvizjs','string',['string','string','string']);
      window.Viz = function(inputDot, outputFormat) {
         return gv(inputDot, 'dot', outputFormat);
      }
   }

   if(!window.AutomataDesignerGlue) {
      window.AutomataDesignerGlue = {};
   }

   var enableAutoHandlingError = false;

   function automatonJSLoaded() {
      window.onerror = function(message, url, lineNumber) {
         if(enableAutoHandlingError) {
            if(offsetError > -1) {
               handleError(message + (typeof enableAutoHandlingError === 'string' ?'(in ' + enableAutoHandlingError + ')' : ''), lineNumber - offsetError);
            }
            else {
               offsetError = lineNumber-1;
            }
            return true;
         }
      };
      offsetError = -1;
      window.loadProgram(':');
   };

   libD.need(['ready', 'notify', 'wm', 'ws', 'jso2dom'], function() {
      if(window.js18Supported) {
         libD.jsLoad('js/automatonjs.js', automatonJSLoaded, "application/javascript;version=1.8");
         libD.jsLoad('js/setIterators.js', automatonJSLoaded, "application/javascript;version=1.8");
      }
      else {
         libD.jsLoad('js/automatonjs.js', automatonJSLoaded);
      }

      AutomataDesigner.load();
   
      var splitter          = document.getElementById('splitter'),
          toolbar           = document.getElementById('toolbar'),
          content           = document.getElementById('content'),
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
          automatonPlus     = document.getElementById('automaton_plus'),
          resultToLeft      = document.getElementById('automaton_from_result'),
          executeBtn        = document.getElementById('execute'),
          wordDiv           = document.getElementById('word'),
          head              = document.querySelector('head'),
          exportFN          = '',
          executionTimeout  = 0,
          executeWin,
          localStorage      = window.localStorage || {},
          CURRENT_FINAL_STATE_COLOR     = localStorage.CURRENT_FINAL_STATE_COLOR     || 'rgba(90, 160, 0, 0.5)',
          CURRENT_TRANSITION_COLOR      = localStorage.CURRENT_TRANSITION_COLOR      || '#BD5504',
          CURRENT_STATE_COLOR           = localStorage.CURRENT_STATE_COLOR           || '#FFFF7B',
          CURRENT_TRANSITION_PULSE_TIME_FACTOR = parseFloat(localStorage.CURRENT_TRANSITION_PULSE_TIME_FACTOR) || 0.6,
          CURRENT_TRANSITION_PULSE_TIME_STEP   = 600,
          HAND_STEP_TIME                       = 250,
          EXECUTION_STEP_TIME                  = parseInt(localStorage.EXECUTION_STEP_TIME);

       if(isNaN(EXECUTION_STEP_TIME)) {
          EXECUTION_STEP_TIME = 1200;
       }

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

      executeBtn.onclick = function() {
         if(!executeWin || !executeWin.ws) {
            var refs = {};
            executeWin = libD.newWin({
               content:libD.jso2dom(['div.libD-ws-colors-auto', {'style':'height:100%'}, [
                  ['div', {'#':'root'}, ['label', [
                     ['#', _('Word: ')],
                     ['input', {type:'text', '#':'word'}],
                     ['input', {type:'button', value:_('Run'), '#':'run'}],
                     ['input', {type:'button', value:_('Step'), '#':'step'}]
                  ]]],
                  ['div', ['label', [
                     ['#', _('Delay between steps (ms): ')],
                     ['input', {type:'text', '#':'delay', value:EXECUTION_STEP_TIME}]
                  ]]]
               ]], refs),
               title:_("Execute the current automaton with a word"),
               top:toolbar.offsetHeight+5,
               right:results.offsetWidth+10
            });
            executeWin.__refs = refs;
            libD.wm.handleSurface(executeWin, refs.root);
            refs.run.onclick = function() {
               stopExecution();
               AutomataDesigner.cleanSVG(AutomataDesigner.currentIndex);
               refs.delay.onchange();
               execute(false, refs.word.value, AutomataDesigner.currentIndex);
            };

            refs.step.onclick = function() {
               if(executionTimeout) {
                  clearTimeout(executionTimeout);
                  execute(true);
               }
               else {
                  execute(true, refs.word.value, AutomataDesigner.currentIndex);
               }
            };

            refs.delay.onchange = function() {
               EXECUTION_STEP_TIME = parseInt(refs.delay.value);
               if(isNaN(EXECUTION_STEP_TIME)) {
                  EXECUTION_STEP_TIME = localStorage.EXECUTION_STEP_TIMEv;
               }
               localStorage.EXECUTION_STEP_TIME = EXECUTION_STEP_TIME;
            };

            refs.word.onkeypress = function(e) {
               if(e.keyCode === 13) {
                  refs.run.onclick();
               }
            };
         }
         executeWin.show();
         executeWin.__refs.word.focus();
      };

      exportBtn.onclick = function() {
         var fn = prompt(_("Which name do you want to give to the exported image? (give a .dot extension to save as dot format, .svg to save as svg)"), exportFN);

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

      var exportResultFN     = _('automaton.txt'),
          exportResultTextFN = _('result.txt');

      exportResult.onclick = function() {
         if(automatonResult) {
            var fn = prompt(_("Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)"), exportResultFN);

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
            var fn = prompt(_("Which name do you want to give to the exported text file?"), exportResultTextFN);
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
         content.style.top  = toolbar.offsetHeight + 'px';
         AutomataDesigner.redraw();
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
            onResize();
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

      automatonPlus.onclick = function() {
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

      resultToLeft.onclick = function() {
         if(automatonResult) {
            automatonPlus.onclick();
            AutomataDesigner.setSVG(results.querySelector('svg'), AutomataDesigner.currentIndex);
            automatoncodeedit.value = automaton_code(automatonResult);
         }
      };

      automataNumber.onchange = function() {
         automatonSetNumber(parseInt(automataNumber.value));
      };

      document.getElementById('automaton_plus').onclick();

      document.getElementById('algo-exec').onclick = function() {
         if(cm) {
            execProgram(cm.getValue());
         }
      };

      window.run = function(){};
      window.reallyRun = function() {
         blockResult = true;
         setResult(arguments[0].apply(window, [].slice.call(arguments, 1)));
      };

      window.get_automaton = function(i) {
         if(automataNumber <= i) {
            throw(new Error(libD.format(_("get_automaton: Automaton n°{0} doesn't exist.")), JSON.stringify(i)));
         }
         return read_automaton(AutomataDesigner.getAutomatonCode(i));
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

      fileprogram.onchange = openProgram;
      fileautomaton.onchange = openAutomaton;
      open.onclick = function() {
         if(switchmode.value === "program") {
            fileprogram.click();
         }
         else {
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
         var n = prompt(
            prog ?
               _("Please enter a name for the file in which the program will be saved.") :
               _("Please enter a name for the file in which the automaton will be saved."), (prog ? _("algo.ajs"):_("automaton.txt"))
         );
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

      function handleImports(includes, includer) {
         for(var i in includes) {
            getScript(includes[i], includer);
         }
      }

      var execute;
      (function() {
         var word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep;
         execute = function(byStep, w, ind) {
            if(w) {
               word  = w;
               index = ind;
               currentSymbolNumber = 0;
               stepNumber = 0;
               executionByStep = byStep;
            }

            if(byStep) {
               executionByStep = byStep;
            }

            var currentTransitions;
            if(stepNumber) {
               if(EXECUTION_STEP_TIME || executionByStep || !word[0]) {
                  if(stepNumber % 2) {
                     if(currentStates) {
                        for(var i in currentStates) {
                           AutomataDesigner.stateRemoveBackgroundColor(index, currentStates[i].toString());
                        }
                     }

                     currentStates = currentAutomaton.getCurrentStates().getList();
                     for(var i in currentStates) {
                        AutomataDesigner.stateSetBackgroundColor(
                           index,
                           currentStates[i].toString(),
                           currentAutomaton.isAcceptingState(currentStates[i])
                              ? CURRENT_FINAL_STATE_COLOR
                              : CURRENT_STATE_COLOR
                        );
                     }
                  }
                  else {
                     currentStates = currentAutomaton.getCurrentStates().getList();
                     currentAutomaton.runSymbol(word[0]);
                     wordDiv.childNodes[currentSymbolNumber++].className = 'eaten';
                     word = word.substr(1);
                     currentTransitions = currentAutomaton.getLastTakenTransitions().getList();
                     for(var i in currentTransitions) {
                        AutomataDesigner.transitionPulseColor(index, currentTransitions[i].startState, currentTransitions[i].symbol, currentTransitions[i].endState, CURRENT_TRANSITION_COLOR, CURRENT_TRANSITION_PULSE_TIME_FACTOR*(byStep ? CURRENT_TRANSITION_PULSE_TIME_STEP : EXECUTION_STEP_TIME));
                     }
                  }
               }
               else {
                  currentAutomaton.runSymbol(word[0]);
                  word = word.substr(1);
                  currentTransitions = currentAutomaton.getLastTakenTransitions().getList();
               }
            }
            else {
               stepNumber = 0; // we start everything.
               if(index === undefined) {
                  index = AutomataDesigner.currentIndex;
               }
               wordDiv.textContent = '';
               for(var span, i=0, len = word.length; i < len; ++i) {
                  span = document.createElement('span');
                  span.textContent = word[i];
                  wordDiv.appendChild(span);
               }
               currentAutomaton = read_automaton(AutomataDesigner.getAutomatonCode(index));
               var q_init = currentAutomaton.getInitialState();
               listOfExecutions = [[[q_init, epsilon]]];
               currentAutomaton.setCurrentState(q_init);
               currentTransitions = currentAutomaton.getLastTakenTransitions().getList();

               if(EXECUTION_STEP_TIME || executionByStep) {
                  AutomataDesigner.stateSetBackgroundColor(
                     index,
                     q_init.toString(),
                     currentAutomaton.isAcceptingState(q_init)
                     ? CURRENT_FINAL_STATE_COLOR
                     : CURRENT_STATE_COLOR
                  );
               }
            }

            if(currentTransitions) {
               var t,l;
               var transitionsByStartState = {};
               for(var i in currentTransitions) {
                  t = currentTransitions[i];
                  if(!transitionsByStartState[t.startState]) {
                     transitionsByStartState[t.startState] = [];
                  }
                  transitionsByStartState[t.startState].push([t.endState, t.symbol]);
               }
               var newListOfExecutions = [], startState, newL;
               for(var i in listOfExecutions) {
                  l = listOfExecutions[i];
                  startState = l[l.length-1][0];
                  for(var j in transitionsByStartState[startState]) {
                     newL = l.slice();
                     newL.push(transitionsByStartState[startState][j]);
                     newListOfExecutions.push(newL);
                  }
               }
               listOfExecutions = newListOfExecutions;
            }

            if((currentTransitions && EXECUTION_STEP_TIME) || stepNumber === -1) {
               results.textContent = '';
               var res;
               for(var i in listOfExecutions) {
                  results.appendChild(document.createElement('div'));
                  results.lastChild.className = 'execution';
                  res = '';
                  for(var k in listOfExecutions[i]) {
                     if(k) {
                        res += k == 0 ? listOfExecutions[i][k][0] : ': ' + listOfExecutions[i][k][1] + ' → ' + listOfExecutions[i][k][0];
                     }
                  }
                  results.lastChild.textContent = res;
               }
            }

            if(stepNumber === -1) {
               wordDiv.textContent = '';
               executionTimeout = 0;
            }
            else {
               if(!word[0]) { // the word is completely eaten
                  stepNumber = -1;
               }
               else {
                  ++stepNumber;
               }

               if(!executionByStep) {
                  if(stepNumber && EXECUTION_STEP_TIME) {
                     executionTimeout = setTimeout(execute, EXECUTION_STEP_TIME-(!(stepNumber % 2))*EXECUTION_STEP_TIME/2);
                  }
                  else {
                     execute();
                  }
               }
               else if(stepNumber % 2) {
                  executionTimeout = setTimeout(execute, HAND_STEP_TIME);
               }
            }
         };
      })();

      function stopExecution(index) {
         if(executionTimeout) {
            clearTimeout(executionTimeout);
            executionTimeout = 0;
            wordDiv.textContent = '';
            AutomataDesigner.cleanSVG(index);
         }
         
      }

      window.loadProgram = function (code) {
         var script   = document.getElementById('useralgo'),
             includes = [];
         if(script) {
            head.removeChild(script);
         }
         waitingFor.empty();
         window.userProgram = null;
         script = document.createElement('script');
         script.id = 'useralgo';
         if(js18Supported) {
            script.type = 'text/javascript;version=1.8';
         }
         script.textContent = 'function userProgram(run) {"use strict";\n' + AutomatonJS.toPureJS(code, includes) + '\n}';
         enableAutoHandlingError = "user's program";
         head.appendChild(script);
         enableAutoHandlingError = false;
         handleImports(includes, "user's program");
      };

      window.gotScript = function(includeName, code) {
         waitingFor.remove(includeName);

         var id      = 'useralgo-include-' + includeName,
             script  = document.getElementById(id),
             includes = [];

         if(script) {
            head.removeChild(script);
         }
         script = document.createElement('script');
         script.id = id;
         if(js18Supported) {
            script.type = 'text/javascript;version=1.8';
         }
         script.textContent = AutomatonJS.toPureJS(code, includes);
         enableAutoHandlingError = "module " + includeName;
         head.appendChild(script);
         enableAutoHandlingError = false;
         handleImports(includes, "module " + includeName);
         if(launchAfterImport && waitingFor.isEmpty() && window.userProgram) {
            launchAfterImport = false;
            execProgram();
         }
      };

      function getScript(includeName, includer) {
         if(includeName[0] === "'") {
            includeName = includeName.replace(/"/g, '\\"');
            includeName = includeName.substr(1, includeName.length-1);
         }
         if(includeName[0] === '"') {
            try {
               includeName = JSON.parse(includeName); // should not happen
            }
            catch(e) {
               handleError(libD.format(_("Syntax error: bad import parameter in {0}"), includer));
               return;
            }
         }
         if(includeName.length < 4 || includeName.substr(includeName.length-4) !== '.ajs') {
            includeName += '.ajs';
         }
         waitingFor.add(includeName);
         AutomatonGlue.getScript(includeName, includer);
      }

      window.getScriptFailed = function(includeName, includer, reason) {
         handleError(libD.format(_("Error: import failed: '{0}' (in '{1}').")), reason, includer);
      };

      window.AutomatonGlue = {
         getScript: function(includeName, includer) {
            if(includeName.match(/^(?:[a-z]+:(?:\\|\/\/?)|\/)/)) { // absolute path
               handleError(libD.format(_("Error: import: absolute paths are not supported in this version (in '{0}')'"), includer));
            }
            else {
               try {
                  var xhr = new XMLHttpRequest();
                  xhr.open('get', 'algos/' + includeName, false);
                  xhr.onreadystatechange = function() {
                     if(xhr.readyState === 4) {
                        if(!xhr.status || xhr.status === 200) {
                           window.gotScript(includeName, xhr.responseText);
                        }
                        else {
                           window.getScriptFailed(includeName, includer, libD.format(_('The file was not found or you don\'t have enough permissions to read it. (HTTP status: {0})', xhr.status)));
                        }
                     }
                  };
                  xhr.overrideMimeType('text/plain');
                  xhr.send();
               }
               catch(e) {
                  window.getScriptFailed(includeName, includer, e.message);
               }
            }
         }
      };

      switchmode.onchange();
      onResize();
      
      var translatedNodes = document.querySelectorAll('[data-translated-content]');
      for(var i=0, len = translatedNodes.length; i < len; ++i) {
         translatedNodes[i].textContent = _(translatedNodes[i].textContent);
      }
   }, false);
   _("fr", "Program Result", "Résultat");
   _("fr", '\nStack trace: \n', "\nPile de l\'erreur : \n");
   _("fr", "Error on line {0}, character {1}", "Erreur ligne {0}, caractère {1}");
   _("fr", "Error on line {0}", "Erreur à la ligne {0}");
   _("fr", "Execute the current automaton with a word", "Exécuter l'automate actuel sur un mot");
   _("fr", "Which name do you want to give to the exported image? (give a .dot extension to save as dot format, .svg to save as svg)", "Quel nom voulez-vous donner à l'image exportée ? (donnez l'extension .dot pour enregistrer au format dot, .svg pour une image svg)");
   _("fr", "Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)", "Quel nom voulez-vous donner au fichier exporté ? (donnez l'extension .dot pour enregistrer au format dot, .svg pour une image svg, .txt pour le format texte)");
   _("fr", "Which name do you want to give to the exported text file?", "Quel nom voulez-vous donner au fichier texte exporté ?");
   _("fr",  "get_automaton: Automaton n°{0} doesn't exist.", "get_automaton: L'automate n°{0} n'existe pas.");
   _("fr", "Please enter a name for the file in which the program will be saved.", "Veuillez entrer un nom pour le fichier dans lequel le programme sera enregistré.");
   _("fr", "Please enter a name for the file in which the automaton will be saved.", "Veuillez entrer un nom pour le fichier dans lequel l'automate sera enregistré.");
   _("fr", "Syntax error: bad import parameter in {0}", "Erreur de syntaxe : mauvais paramètre pour 'import' dans {0}");
   _("fr", "Error: import failed: '{0}' (in '{1}').", "Erreur : l'import a échoué: '{0}' (depuis '{1}').");
   _("fr", "Error: import: absolute paths are not supported in this version (in '{0}')'", "Erreur : import : les chemins absolus ne sont pas pris en charge dans cette version (depuis '{0}').");
   _("fr", "Mode:", "Mode :");
   _("fr", "Execute Program", "Lancer le programme");
   _("fr", "Design", "Dessin");
   _("fr", "Program", "Programme");
   _("fr", "Automaton code", "Code de l'automate");
   _("fr", "Open", "Ouvrir");
   _("fr", "Save", "Enregistrer");
   _("fr", "Save As", "Enregistrer sous");
   _("fr", "Automaton:", "Automate :");
   _("fr", "Export", "Exporter");
   _("fr", "Redraw", "Redessiner");
   _("fr", "Run a word", "Exécuter un mot");
   _("fr", "Export result", "Exporter le résultat");
   _("fr", "Automaton n°", "Automate n°");
   _("fr", "result.txt", "resultat.txt");
   _("fr", "automaton.txt", "automate.txt");
   _("fr", "Word: ", "Mot : ");
   _("fr", "Run", "Exécuter");
   _("fr", "Step", "Un pas");
   _("fr", "Delay between steps (ms): ", "Pause entre les étapes (ms) : ");
})();