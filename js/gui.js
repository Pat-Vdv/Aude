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

// NEEDS : automatadesigner.js, automata.js, saveAs, automaton2dot.js, automataJS.js

(function() {
   "use strict";
   
   var automatonResult   = null,
       blockResult       = false,
       waitingFor        = new Set(),
       launchAfterImport = false,
       resultToLeft      = document.createElement('button'),
       zoom              = {svgZoom:1},
       map               = {
          '\\e':epsilon,
          'ε':epsilon
       },
       _                 = window.AutomataGuil10n = libD.l10n(),
       offsetError,
       results,
       splitter,
       leftPane,
       content,
       toolbar,
       head,
       not,
       sw;

   AutomataDesigner.getValueFunction = function(s) {
      try {
         var v = Set.prototype.getValue(s, map);
         return v;
      }
      catch(e) {
         return s;
      }
   };

   AutomataDesigner.getStringValueFunction = function(s) {
      try {
         Set.prototype.getValue(s, map); // s is a legal value
         return s;
      }
      catch(e) {
         return JSON.stringify(s); // turn into string
      }
   };

   function notify (title, content, type) {
      if(!not || !not.displayed) {
         not = new libD.Notify({closeOnClick:true});
      }
      not.setTitle(title);
      not.setDescription(content);
      not.setType(type);
   }

   function enableResults() {
      if(!sw) {
         results.classList.remove('disabled');
         splitter.classList.remove('disabled');
         sw = splitter.offsetWidth;
         splitterMove({clientX:splitter.offsetLeft});
         AutomataDesigner.userZoom(zoom);
         onResize();
      }
   }

   function textFormat(text, node, html) {
      if(!node) {
         node = document.createElement('span');
      }
      node[html ? 'innerHTML' : 'textContent'] = text instanceof Array ? text.join("") : text;
      MathJax.Hub.Queue(["Typeset",MathJax.Hub,node]);
      return node;
   }

   function setTextResult(t, dontNotify) {
      automatonResult = null;
      enableResults();
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

   function automaton2svg(A) {
      return Viz(automaton2dot(A), 'svg').replace(/<\?.*\?>/g, '').replace(/<![^>]*>/g, '');
   }

   function setAutomatonResult(A) {
      enableResults();
      automatonResult = A;
      var svgCode = automaton2svg(A);

      results.innerHTML = '<div id="results-tb"></div>' + svgCode;
      results.firstChild.appendChild(resultToLeft);
      if((not && not.displayed) || !codeedit.classList.contains('disabled')) {
         notify(_("Program Result"), svgCode, 'normal');
      }
      zoom.svgNode = results.querySelector('svg');
      if(zoom.redraw) {
         zoom.redraw();
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
      var svg = results.querySelector('svg');
      if(svg) {
         zoom.svgNode = svg;
         results.style.overflow = 'hidden';
         if(zoom.redraw) {
            zoom.redraw();
         }
      }
      else {
         zoom.svgNode = null;
         results.style.overflow = '';
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

   
   function launchUserProgram(userProgram) {
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
               if(stack[i].match(location.href + ':')) {
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

   function execProgram(code) {
      if(code) {
         loadProgram(code);
      }

      if(window.userProgram && waitingFor.isEmpty()) {
         launchUserProgram(userProgram);
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

   function getScript(includeName, includer) {
      if(waitingFor.contains(includeName)) {
         return;
      }

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

   function handleImports(includes, includer) {
      for(var i in includes) {
         getScript(includes[i], includer);
      }
   }

   function loadProgram(code) {
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
      script.textContent = 'function userProgram(run) {"use strict";\n' + AutomataJS.toPureJS(code, includes) + '\n}';
      enableAutoHandlingError = "user's program";
      head.appendChild(script);
      enableAutoHandlingError = false;
      handleImports(includes, "user's program");
   };

   function splitterMove (e) {
      var width = document.body.offsetWidth;
      splitter.style.left = (e.clientX*100 / width) + '%';
      leftPane.style.right = ((width - e.clientX)*100 / width) + '%';
      results.style.left =  ((e.clientX + sw)*100/width) + '%';
      AutomataDesigner.redraw();
      if(zoom.redraw) {
         zoom.redraw();
      }
   }

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
      loadProgram(':');
   };

   function onResize () {
      var width = document.body.offsetWidth;
      if(sw) {
         results.style.left =  ((splitter.offsetLeft + sw)*100/width) + '%';
      }
      content.style.top  = toolbar.offsetHeight + 'px';
      AutomataDesigner.redraw();
      if(zoom.redraw) {
         zoom.redraw();
      }
   }

   libD.need(['ready', 'notify', 'wm', 'ws', 'jso2dom'], function() {
      AutomataDesigner.standardizeStringValueFunction = automaton2dot_standardizedString;
      AutomataDesigner.prompt = (function() {
         var refs = {},
             win,
             func,
             winContent = libD.jso2dom(['div.libD-ws-colors-auto', [
               ['div', ['label', {"#":"descr","for":"prompt-input","style":"white-space:pre-wrap"}]],
               ['div', {style:"display:table;width:100%"},
                  ['div', {style:"display:table-row"}, [
                     ['div', {style:"display:table-cell;width:100%"}, ['input#prompt-input', {"#":"input", type:"text",style:"width:100%"}]],
                     ['div',  {style:"display:table-cell"}, [
                        ['input', {"#":"ok", type:"button", value:_("OK")}]
                     ]]
                  ]]
               ]
            ]], refs);

         function close() {
            if(func) {
               func(null);
            }
         }
         refs.ok.onclick = function() {
            func(refs.input.value);
            func = null;
            win.close();
         };
         refs.input.onkeydown = function(e) {
            if(e.keyCode === 13) {
               refs.ok.onclick();
               e.preventDefault();
               e.stopPropagation();
               return false;
            }
            else if(e.keyCode === 27) {
               win.close();
               return false;
            }
         };

         return function(title, descr, def, fun) {
            func = fun;
            if(!win || !win.ws) {
               win = libD.newWin({
                  content:winContent,
                  center:true,
                  minimizable:false
               });
               win.addEvent('close', close);
               win.ws.wm.handleSurface(win, winContent);
            }
            win.show();
            win.setTitle(title);
            refs.descr.textContent = descr;
            refs.input.value = def;
            refs.input.select();
         };
      })();

      head = document.querySelector('head');

      if(window.js18Supported) {
         libD.jsLoad('js/setIterators.js', automatonJSLoaded, "application/javascript;version=1.8");
      }
      else {
         automatonJSLoaded();
      }

      AutomataDesigner.load();
      var codeedit          = document.getElementById('codeedit'),
          automataedit      = document.getElementById('automataedit'),
          automatoncode     = document.getElementById('automatoncode'),
          automatoncodeedit = document.getElementById('automatoncodeedit'),
          fileautomaton     = document.getElementById('fileautomaton'),
          filequiz          = document.getElementById('filequiz'),
          drawToolbar       = document.getElementById('draw-toolbar'),
          open              = document.getElementById('open'),
          save              = document.getElementById('save'),
          saveas            = document.getElementById('saveas'),
          exportBtn         = document.getElementById('export'),
          exportResult      = document.getElementById('export_result'),
          fileprogram       = document.getElementById('fileprogram'),
          automatonPlus     = document.getElementById('automaton_plus'),
          automatonMinus    = document.getElementById('automaton_minus'),
          executeBtn        = document.getElementById('execute'),
          wordDiv           = document.getElementById('word'),
          curAlgo           = document.getElementById('predef-algos'),
          quiz              = document.getElementById('quiz'),
          divQuiz           = document.getElementById('div-quiz'),
          automataContainer = document.getElementById('automata-container'),
          exportFN          = '',
          executionTimeout  = 0,
          localStorage      = window.localStorage || {},
          automataList      = [],
          automataListDiv   = document.getElementById('automata-list-chooser'),
          automataListClose = document.getElementById('automata-list-chooser-close'),
          automataListUL    = document.getElementById('automata-list-chooser-content'),
          automataListBtn   = document.getElementById('automata-list-chooser-btn'),
          automataListIntro = document.getElementById('automata-list-chooser-intro'),
          executeWin,
          CURRENT_FINAL_STATE_COLOR     = localStorage.CURRENT_FINAL_STATE_COLOR     || 'rgba(90, 160, 0, 0.5)',
          CURRENT_TRANSITION_COLOR      = localStorage.CURRENT_TRANSITION_COLOR      || '#BD5504',
          CURRENT_STATE_COLOR           = localStorage.CURRENT_STATE_COLOR           || '#FFFF7B',
          STATE_REFUSED                 = localStorage.STATE_REFUSED                 || 'rgba(255, 50, 50, 0.5)',
          CURRENT_TRANSITION_PULSE_TIME_FACTOR = parseFloat(localStorage.CURRENT_TRANSITION_PULSE_TIME_FACTOR) || 0.6,
          CURRENT_TRANSITION_PULSE_TIME_STEP   = 600,
          HAND_STEP_TIME                       = 250,
          EXECUTION_STEP_TIME                  = parseInt(localStorage.EXECUTION_STEP_TIME);

       if(isNaN(EXECUTION_STEP_TIME)) {
          EXECUTION_STEP_TIME = 1200;
       }

      results  = zoom.svgContainer = document.getElementById('results');
      splitter = document.getElementById('splitter');
      leftPane = document.getElementById('left-pane');
      content  = document.getElementById('content'),
      toolbar  = document.getElementById('toolbar');

      resultToLeft.appendChild(libD.jso2dom([
         ['img', {alt:'', src:'icons/oxygen/16x16/actions/arrow-left.png'}],
         ['span', _('This automaton into the editor')]
      ]));

      (function() {
         var divWelcome = document.createElement('div');
         divWelcome.id = "welcome";
         divWelcome.innerHTML = libD.format(_('<h2>Welcome to {0}.</h2>\
<p>Here is the area where you can <strong>draw automata</strong>.</p>\
<ul>\
   <li>To create a <strong>new state</strong>, double-click at the place where you want the state to be.</li>\
   <li>To create a <strong>new transition</strong>, ctrl+click on the start state and then click on the end state of the transition.</li>\
   <li>To <strong>rename</strong> a state or a transition, double-click on it.</li>\
   <li>To set a state as <strong>initial</strong>, ctrl+right click on the state.</li>\
   <li>To set a state as <strong>accepting</strong>, right-click on it.</li>\
   <li>To <strong>remove</strong> a state or a transition, ctrl-click on it.</li>\
</ul>\
<p>You can <strong>access to these instructions</strong> at any time by clicking the <img alt="" src="icons/oxygen/16x16/actions/draw-brush.png" /><b style="color:black;font-size:small">?</b> toolbar icon.</p>\
<p>When running a program or an algorithm, the <strong>result</strong> will appear <strong>at the right side</strong> of the screen.</p>\
<p>To load a quiz, click on the "Load a Quiz" toolbar button. You can keep on using all the features of the program, like running algorithms, during the quiz whenever it is possible to draw an automaton.</p>\
<p>To hide this text, cliquez-dessus.</p>\
<p> Enjoy yourself!</p>'), "Aude");

         AutomataDesigner.svgContainer.parentNode.appendChild(divWelcome);
         function hideWelcome() {
            AutomataDesigner.svgContainer.parentNode.removeChild(divWelcome);
            document.body.removeEventListener("click", hideWelcome, false);
         }
         document.body.addEventListener("click", hideWelcome, false);
      })();

      window.addEventListener('keydown', function(e) {
         if(e.ctrlKey || e.metaKey) {
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
         enableResults();
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
               minimizable:false,
               right:results.offsetWidth+10
            });
            executeWin.__refs = refs;
            executeWin.addEvent('close', function() {
               wordDiv.textContent = '';
               AutomataDesigner.cleanSVG(AutomataDesigner.currentIndex);
            });
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
               automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, false);
            }
            else {
               AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
            }

            if(fn.length > 4 && fn.substr(fn.length-4) === '.svg') {
               saveAs(new Blob([AutomataDesigner.getSVG(AutomataDesigner.currentIndex)], {type:'text/plain;charset=utf-8'}), fn);
            }
            else {
               var A = AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex);
               if(A) {
                  saveAs(new Blob([automaton2dot(A)], {type:'text/plain;charset=utf-8'}), fn);
               }
               else {
                  notify(_("There is no automaton to save."));
               }
            }
         }
      };

      document.getElementById('draw-toolbar-btn').onclick = function() {
         drawToolbar.classList.toggle('disabled');
         onResize();
      };

      var drawToolbarButtons = drawToolbar.querySelectorAll('button');
      for(var i=0,len = drawToolbarButtons.length; i < len; ++i) {
         drawToolbarButtons[i].onclick = function() {
            notify(this.textContent, _(this.value), 'info');
         };
      }
      document.getElementById('redraw').onclick = function() {
         automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, true);
         if(automatoncodeedit.value) {
            AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
         }
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

      var cm; // code mirror object

      splitter.onmousedown = function(e) {
         window.onmousemove = splitterMove;
         window.onmouseup = function() {
            window.onmousemove = null;
         };
      };

      window.addEventListener('resize', onResize, false);

      function automatonSetNumber(index) {
         AutomataDesigner.setCurrentIndex(index);
         automatoncodeedit.value = AutomataDesigner.getAutomatonCode(index, false);
      }

      var switchmode = document.getElementById("switchmode");
      switchmode.onchange = function() {
         switch(this.value) {
         case "program":
            toolbar.className = 'algomode';
            codeedit.classList.remove('disabled');
            automataedit.classList.add('disabled');
            if(!cm) {
               
               cm = CodeMirror(codeedit, {lineNumbers:true});
               var codemirrorNode = cm.getWrapperElement();
               listenMouseWheel(function(e, delta) {
                  if(e.ctrlKey || e.metaKey) {
                     var fs = parseFloat(window.getComputedStyle(codemirrorNode, null).fontSize);
                     codemirrorNode.style.fontSize = (fs + 2*delta) + 'px';
                     cm.refresh();
                     e.preventDefault();
                     e.stopPropagation();
                     return false;
                  }
               });
            }
            onResize();
            break;
         case "design":
            if(cm && cm.getValue()) {
               toolbar.className = 'designmode';
            }
            else {
               toolbar.className = 'designmode launch-disabled';
            }
            codeedit.classList.add('disabled');
            automataedit.classList.remove('disabled');
            automatoncode.classList.add('disabled');
            AutomataDesigner.svgContainer.classList.remove('disabled');
            onResize();
            break;
         case "automatoncode":
            automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, false);
            if(cm && cm.getValue()) {
               toolbar.className = 'designmode codemode';
            }
            else {
               toolbar.className = 'designmode codemode launch-disabled';
            }
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
         if(!automataListDiv.classList.contains('disabled')) {
            showAutomataListChooser();
         }
      };

      automatonMinus.onclick = function() {
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
            var i = automataList.indexOf(curAutomaton);
            if(i !== -1) {
               automataList.splice(i, 1);
               for(var j = 0, len = automataList.length; j < len; ++j) {
                  if(automataList[j] > i) {
                     --automataList[j];
                  }
               }
            }
            if(!automataListDiv.classList.contains('disabled')) {
               showAutomataListChooser();
            }
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

      window.run = function(f) {
         if(loadPredefAlgoAfterImport === true) {
            loadPredefAlgoAfterImport = null;
            (predefAlgoFunctions[curAlgo.value] = f)(window.reallyRun);
         }
      };

      window.reallyRun = function() {
         blockResult = true;
         if(arguments[0] === get_automatons) {
            var f = arguments[2];
            get_automatons(arguments[1], function() {
               console.log(arguments);
               setResult(f.apply(this, arguments));
            });
         }
         else {
            setResult(arguments[0].apply(window, [].slice.call(arguments, 1)));
         }
      };

      window.get_automaton = function(i) {
         if(isNaN(i)) {
            return;
         }

         var A;
         if(automataNumber <= i ||  !(A = AutomataDesigner.getAutomaton(i))) {
            throw(new Error(libD.format(_("get_automaton: Automaton n°{0} doesn’t exist or doesn’t have an initial state."), JSON.stringify(i))));
         }
         return A;
      };

      automataListDiv.querySelector('p:last-child').innerHTML = libD.format(_('This order will be used for future algorithm executions. If you want to change this order, you can call this list using the <img src="{0}" /> toolbar icon.<br />Notice: Algorithms taking only one automaton work with the current automaton, they don’t use this ordering.'), "icons/oxygen/16x16/actions/format-list-ordered.png");

      var salc_cur_automaton = -1;
      automataListUL.onmouseover = function(e) {
         if(salc_cur_automaton === -1) {
            salc_cur_automaton = AutomataDesigner.currentIndex;
         }
      };

      automataListUL.onmouseout = function(e) {
         var e = e.toElement || e.relatedTarget;
         if((e === automataListUL || e === automataListUL.parentNode) && salc_cur_automaton !== -1) {
            AutomataDesigner.setCurrentIndex(salc_cur_automaton);
            salc_cur_automaton = -1;
         }
      };

      function showAutomataListChooser(count, callback) {
         if(callback || automataListBtn.onclick) {
            automataListBtn.classList.remove('disabled');
            automataListIntro.innerHTML = libD.format(_('The algorithm you want to use needs {0} automata. Please select these automata in the order you want and click "Continue execution" when you are ready.'), count);
            if(callback) {
               automataListBtn.onclick = function() {
                  if(automataList.length < count) {
                     alert(libD.format(_("You didn’t select enough automata. Please select {0} automata."), count));
                     return;
                  }
                  automataListClose.onclick();
                  automataListBtn.onclick = null;
                  callWithList(count, callback);
               };
            }
         }
         else {
            automataListBtn.classList.add('disabled');
            automataListIntro.textContent = _("You can choose the order in which automata will be used in algorithms.");
            count = 0;
         }

         automataListUL.textContent = '';
         for(var i=0, li, a,number,indexInList; i < automatonCount; ++i) {
            li = document.createElement('li');
            a  = document.createElement('a');
            a.href = '#';
            a._index = i;
            indexInList = automataList.indexOf(i);
            number = document.createElement('span');
            number.className = 'automaton-number';

            if(indexInList !== -1) {
               number.textContent = indexInList;
            }

            a.onclick = function() {
               if(this.lastChild.textContent) {
                  var j = parseInt(this.lastChild.textContent);
                  this.lastChild.textContent = '';
                  automataList.splice(j, 1);
                  for(var k,lastChild, i=0; i < automatonCount; ++i) {
                     lastChild = automataListUL.childNodes[i].firstChild.lastChild;
                     k = parseInt(lastChild.textContent);
                     if(k >= j) {
                        lastChild.textContent = k-1;
                     }
                  }
               }
               else {
                  this.lastChild.textContent = automataList.length;
                  automataList.push(this._index);
               }
            }
            a.onmouseover = function() {
               if(salc_cur_automaton !== -1) {
                  AutomataDesigner.setCurrentIndex(this._index);
               }
            }
            a.appendChild(document.createElement('span'));
            a.lastChild.textContent = libD.format(_("Automaton #{0}"), i);
            a.appendChild(number);
            li.appendChild(a);
            automataListUL.appendChild(li);
         }
         automataListDiv.classList.remove('disabled');
      }

      document.getElementById('automata-list').onclick = function(){showAutomataListChooser();};

      function callWithList(count, callback) {
         var automata = [];
         for(var i=0; i < count; ++i) {
            automata.push(get_automaton(automataList[i]));
         }
         callback.apply(this, automata);
      }

      window.get_automatons = function(count, callback) {
         if(automataList.length < count) {
            showAutomataListChooser(count, callback);
         }
         else {
            callWithList(count, callback);
         }
      };

      document.getElementById('automata-list-chooser-close').onclick = function() {
         automataListDiv.classList.add('disabled');
      };
      
      AutomataDesignerGlue.requestSVG = function(index) {
         AutomataDesigner.setSVG(Viz(automaton2dot(read_automaton(automatoncodeedit.value)), 'svg'), index);
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
      
      
      function automatonFromObj(o) {
         var A = new Automaton();
         A.setInitialState(o.states[0]);
         for(var i = 1; i < o.states.length; ++i) {
            A.addState(o.states[i]);
         }
         for(var i = 0; i < o.finalStates.length; ++i) {
            A.addFinalState(o.states[i]);
         }
         for(var i = 0; i < o.transitions.length; ++i) {
            A.addTransition(o.transition[i][0], o.transition[i][1], o.transition[i][2]);
         }
         return A;
      }

      function openProgram() {
         freader.onload = function() {
            cm.setValue(freader.result);
         };
         freader.readAsText(fileprogram.files[0], 'utf-8');
         programFileName = fileprogram.value;
      }

      function openQuiz() {
         freader.onload = function() {
            try {
               startQuiz(JSON.parse(freader.result));
            }
            catch(e) {
               notify(_("Loading the quiz failed"), (libD.format(_("The quiz seems to be malformed: {0}"), e.message, "error")));
            }
         };
         freader.readAsText(filequiz.files[0], 'utf-8');
      }

      fileprogram.onchange   = openProgram;
      fileautomaton.onchange = openAutomaton;
      filequiz.onchange      = openQuiz;

      function startQuiz(quiz) {
         automataContainer.style.display = 'none';
         handleImports(['equivalence', 'regex2automaton', "automaton2json"], 'Quiz');
         automatonPlus.onclick();
         if(!(quiz.questions && quiz.questions instanceof Array)) {
            throw new Error(_("The quiz doesn't have its list of question."));
         }
         quiz.currentQuestion = -1;

         for(var i=0, len = quiz.questions.length, a = quiz.answers = new Array(len); i < len; ++i) {
            a[i] = {
               isCorrect:false,
               userResponse:null,
               reasons:[]
            };
         }
         divQuiz.classList.add('intro');
         divQuiz.classList.remove('started');
         divQuiz.textContent = '';
         var refs = {};
         divQuiz.classList.add('enabled');
         divQuiz.appendChild(libD.jso2dom([
            ['h1#quiz-title', [
               ["#", quiz.title ? _("Quiz: ") : _('Quiz')],
               ["span", {'#':"quizTitleContent"}, ]
            ]],
            ['h2#quiz-author', {"#":'author'}],
            ['div#quiz-descr', {"#":"descr"}],
            ['a#close-quiz', {"#":'closeQuiz', "href":"#"}, _("Close the Quiz")],
            ['div#quiz-content', {"#":"content"},
               ["div.button-container",
                  ["button", {'#':"startQuiz"}, _("Start the Quiz")]
               ]
            ]
         ], refs));
         textFormat(quiz.title || '', refs.quizTitleContent);
         textFormat((quiz.author || '') + (quiz.date ? ' - ' + quiz.date : ''), refs.author);
         textFormat(quiz.description || '', refs.descr);
         
         quiz.refs = refs;
         refs.closeQuiz.onclick = closeQuiz;
         refs.startQuiz.onclick = nextQuestion(quiz);
      }

      function nextQuestion(quiz, previous, delta) {
         return function() {
            if(delta) {
               quiz.currentQuestion -= 2;
            }
            try {
               nextQuizQuestion(quiz, previous);
            }
            catch(e) {
               if(typeof e === 'string') {
                  notify(_("Error in the Quiz"), libD.format(_("There is an error in the Quiz: {0}"), e), "error");
               }
               else {
                  throw(e);
               }
            }
            return false;
         };
      }
      function closeQuiz() {
         automatonMinus.onclick();
         automataContainer.style.display = '';
         automataContainer.style.top     = '';
         divQuiz.textContent = '';
         divQuiz.classList.remove('enabled');
         AutomataDesigner.redraw();
         zoom.redraw();
      }

      function nextQuizQuestion(quiz, previousQuestion) {
         divQuiz.classList.remove('intro');
         divQuiz.classList.add('started');
         automataContainer.style.display = 'none';
         if(typeof previousQuestion === 'number' && previousQuestion >= 0) {
            var q = quiz.questions[previousQuestion],
                r = quiz.answers[previousQuestion];
            quiz.answers[previousQuestion].reasons = [];
            switch(q.type) {
               case "mcq":
                  var answers       = r.userResponse = new Set(),
                      possibilities = q.possibilities;

                  for(var i in possibilities) {
                     if(quiz.currentAnswersRefs['answer-' + i].checked) {
                        answers.add('id' in possibilities[i] ? possibilities[i].id : parseInt(i)+1);
                     }
                  }
                  var diff = sym_diff(answers, q.answers);
                  if(!(r.isCorrect = diff.isEmpty())) {
                     r.reasons.push(libD.format(_("Wrong answer for {0}."), diff.getSortedList().toString()));
                  }
                  break;
               case "word":
                  var respA = AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex),
                      words = q.words,
                      regex = '';

                  r.userResponse = AutomataDesigner.getSVG(AutomataDesigner.currentIndex);

                  if(respA) {
                     for(var i in words) {
                        if(!respA.acceptedWord(words[i])) {
                           r.isCorrect = false;
                           r.reasons.push(
                              words[i]
                                ? libD.format(_("Word <i>{0}</i> is not accepted while it should be."), words[i])
                                : _("The empty word is not accepted while it should be.")
                           );
                        }
                        if(regex) {
                           regex += '+';
                        }
                        regex+= words[i].replace(/([^0-9a-zA-Z])/g, "\\$1");
                     }
                     if(!r.reasons[0]) {
                        if(!(r.isCorrect = automataAreEquivalent(regexToAutomaton(regex), respA))) {
                           r.reasons.push(_("The given automaton accepts too many words."));
                        }
                     }
                  }
                  else {
                     r.isCorrect = false;
                     r.reasons.push(_("Question was not answered."));
                  }
                  break;
               case "automatonEquiv":
                  var respA = AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex);

                  r.userResponse = AutomataDesigner.getSVG(AutomataDesigner.currentIndex);

                  if(respA) {
                     if(q.automaton) {
                        try {
                           var A = object2automaton(q.automaton);
                        }
                        catch(e) {
                           throw _("Automaton given in the quiz is not correct.");
                        }
                     }
                     else if(q.regex) {
                        try {
                           var A = regexToAutomaton(q.regex);
                        }
                        catch(e) {
                           throw _("The regex given in the quiz is not valid.");
                        }
                     }
                     else {
                        throw _("No regular expression or automaton was given in the quiz.");
                     }
                     if(!(r.isCorrect = automataAreEquivalent(A, respA))) {
                        
                        if(q.examples instanceof Array) {
                           for(var i in t.examples) {
                              if(!respA.acceptedWord(t.examples[i])) {
                                 r.reasons.push(
                                    t.examples[i]
                                      ? libD.format(_("Word <i>{0}</i> is not accepted while it should be."), t.examples[i])
                                      : _("The empty word is not accepted while it should be.")
                                 );
                              }
                           }
                        }
                        if(q.counterExamples instanceof Array) {
                           for(var i in t.counterExamples) {
                              if(respA.acceptedWord(t.counterExamples[i])) {
                                 r.reasons.push(
                                    t.counterExamples[i]
                                      ? libD.format(_("Word <i>{0}</i> is accepted while it shouldn’t be."), t.counterExamples[i])
                                      : _("The empty word is accepted while it shouldn’t be.")
                                 );
                              }
                           }
                        }

                        if(!r.reasons[0]) {
                           r.reasons.push(_("The given automaton isn’t equivalent to the expected one."));
                        }
                     }
                  }
                  else {
                     r.isCorrect = false;
                     r.reasons.push(_("Question was not answered."));
                  }
                  break;
            }
         }

         ++quiz.currentQuestion;
         if(quiz.currentQuestion >= quiz.questions.length) {
            quiz.refs.content.textContent = '';
            quiz.refs.content.appendChild(libD.jso2dom(['p', _("The Quiz is finished! Here are the details of the correction.")]));
            var refs = {};
            var answers = libD.jso2dom(['table#correction-table',
               ["tr", [
                  ["th", _("Instruction")],
                  ["th", _("Correct answer?")],
                  ["th", _("Comments")]
               ]]
            ]);

            for(var i in quiz.answers) {
               answers.appendChild(libD.jso2dom(['tr', [
                  ['td.qinst', {'#':'answerInstr'}, [
                     ['span.qid', ('id' in quiz.questions[i] ? quiz.questions[i].id : (parseInt(i)+1)) + '. '],
                     ['div.qinstr-content']
                  ]],
                  ['td.qstate', quiz.answers[i].isCorrect ? _("Yes") : _("No")],
                  ['td.qcmt', {'#':'answerCmt'}]
               ]], refs));
               
               if(quiz.answers[i].reasons[1]) {
                  var li, ul = document.createElement('ul');
                  for(var j in quiz.answers[i].reasons) {
                     li = document.createElement('li');
                     li.innerHTML = quiz.answers[i].reasons[j];
                     ul.appendChild(li);
                  }
                  refs.answerCmt.appendChild(ul);
               }
               else {
                  refs.answerCmt.innerHTML = quiz.answers[i].reasons[0] || '';
               }

               if(quiz.questions[i].instructionHTML) {
                  textFormat(quiz.questions[i].instructionHTML, refs.answerInstr.lastChild, true);
               }
               else {
                  textFormat(quiz.questions[i].instruction, refs.answerInstr.lastChild);
               }
               refs.answerInstr.appendChild(document.createElement('ul'));
               refs.answerInstr.lastChild.className = 'possibilities';
               var possibilities = quiz.questions[i].possibilities;
               if(possibilities) {
                  for(var i in possibilities) {
                     refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                        ["span.quiz-answer-id", ('id' in possibilities[i] ? possibilities[i].id : (parseInt(i)+1)) + '. '],
                        ["span", {"#": i + 'content'}]
                     ]], refs));
                     if(possibilities[i].automaton) {
                        refs[i + 'content'].innerHTML = automaton2svg(automatonFromObj(possibilities[i].automaton));
                     }
                     else if(possibilities[i].html) {
                        refs[i + 'content'].innerHTML = possibilities[i].html;
                     }
                     else if(possibilities[i].text) {
                        textFormat(possibilities[i].text, refs[i + 'content']);
                     }
                     else if(possibilities[i].html) {
                        textFormat(possibilities[i].html, refs[i + 'content'], true);
                     }
                  }
               }
            }
            
            quiz.refs.content.appendChild(answers);
            quiz.refs.content.appendChild(libD.jso2dom([
               ['p', _("We are willing to don’t give you any mark. Your progress is the most important thing, above any arbitrary absolute meaningless mark. Keep your efforts ;-)")],
               ['div.button-container', ['button', {"#":"prev"}, _("Previous page")]]
            ], refs));
            refs.prev.onclick = nextQuestion(quiz, null, true);
            return;
         }

         var q = quiz.questions[quiz.currentQuestion],
             qid = 'id' in q ? q.id : (quiz.currentQuestion + 1),
             refs = {};
 
         quiz.currentAnswersRefs = refs;
         quiz.refs.content.textContent = '';
         quiz.refs.content.appendChild(
               libD.jso2dom([
                  ["div#quiz-question", [
                     ["span.quiz-question-id",libD.format(
                        _("Question {0}: "),
                        qid)],
                     ['span', {'#':'questionContent'}]
                  ]],
                  ["div#quiz-answers", {"#":"answers"}],
                  ["div.button-container", [
                     ["button", {"#": "prev"}, _("Previous question")],
                     ["button", {"#": "ok"}, _("Next question")]
                  ]]
               ], refs)
         );
         if(q.instructionHTML) {
            textFormat(q.instructionHTML, refs.questionContent, true);
         }
         else {
            textFormat(q.instruction, refs.questionContent);
         }
         switch(q.type) {
            case "mcq":
               var possibilities = q.possibilities,
                   anwserRefs    = {},
                   qid;
               if(!(q.possibilities)) {
                  throw libD.format(_("Question {0} has no answers."), qid);
               }
               refs.answers.appendChild(document.createElement('ul'));
               for(var i in possibilities) {
                  qid = 'id' in possibilities[i] ? possibilities[i].id : (parseInt(i)+1);
                  refs.answers.firstChild.appendChild(libD.jso2dom(["li", ["label", [
                     ["input", {"type":"checkbox", "#":"answer-" + i}],
                     ["span.quiz-answer-id", qid + '. '],
                     ["span", {"#": i + 'content'}]
                  ]]], refs));
                  if(possibilities[i].automaton) {
                     refs[i + 'content'].innerHTML = automaton2svg(automatonFromObj(possibilities[i].automaton));
                  }
                  else if(possibilities[i].html) {
                     refs[i + 'content'].innerHTML = possibilities[i].html;
                  }
                  else if(possibilities[i].text) {
                     textFormat(possibilities[i].text, refs[i + 'content']);
                  }
                  else if(possibilities[i].html) {
                     textFormat(possibilities[i].html, refs[i + 'content'], true);
                  }
                  if(quiz.answers[quiz.currentQuestion].userResponse instanceof Set && quiz.answers[quiz.currentQuestion].userResponse.contains(qid)) {
                     refs["answer-" + i].checked = true;
                  }
               }
               break;
            case "word":
               refs.answers.innerHTML = '<p>' +  _("You can draw the automaton bellow.") + '</p>';
               AutomataDesigner.setSVG(quiz.answers[quiz.currentQuestion].userResponse, AutomataDesigner.currentIndex);
               setTimeout(function() {
                  automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + 'px';
                  automataContainer.style.display = '';
                  AutomataDesigner.redraw();
                  zoom.redraw();
               }, 0);
               break;
            case "automatonEquiv":
               refs.answers.innerHTML = '<p>' +  _("You can draw the automaton bellow.") + '</p>';
               AutomataDesigner.setSVG(quiz.answers[quiz.currentQuestion].userResponse, AutomataDesigner.currentIndex);
               setTimeout(function() {
                  automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + 'px';
                  automataContainer.style.display = '';
                  AutomataDesigner.redraw();
                  zoom.redraw();
               }, 0);
               break;
            case "program":
               
               break;
            case "algo":
               
               break;
            default:
               notify(_("Question type not known"), libD.format(_('Type of question {0} is not known. Known types are: <ul><li>"mcq" for multiple choices question,</li><li>"word" (to draw an automaton which accepts a given list of words).</li></ul>')),"error");
         }

         refs.ok.onclick = nextQuestion(quiz, quiz.currentQuestion);

         if(quiz.currentQuestion) {
            refs.prev.onclick = nextQuestion(quiz, quiz.currentQuestion, true);
         }
         else {
            refs.prev.style.display = 'none';
         }
      };

      quiz.onclick = function() {
         filequiz.click();
      };

      open.onclick = function() {
         if(switchmode.value === "program") {
            fileprogram.click();
         }
         else {
            fileautomaton.click();
         }
      };

      function saveProgram(fname) {
         saveAs(new Blob([cm.getValue()], {type:'text/plain;charset=utf-8'}), fname);
      }

      function saveAutomaton(fname) {
         saveAs(new Blob([AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, false)], {type:'text/plain'}), fname);
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

      var execute;
      (function() {
         var accepting, word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep;
         execute = function(byStep, w, ind) {
            if(typeof w === 'string') {
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
                     accepting = false;
                     var accepted;
                     for(var i in currentStates) {
                        accepted = currentAutomaton.isAcceptingState(currentStates[i]);
                        if(!accepting && accepted) {
                           accepting = true;
                        }

                        AutomataDesigner.stateSetBackgroundColor(
                           index,
                           currentStates[i],
                           accepted
                              ? CURRENT_FINAL_STATE_COLOR
                              : CURRENT_STATE_COLOR
                        );
                     }
                  }
                  else {
                     currentStates = currentAutomaton.getCurrentStates().getList();
                     currentAutomaton.runSymbol(word[0]);
                     wordDiv.firstChild.childNodes[currentSymbolNumber++].className = 'eaten';
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
               var layer1 = document.createElement('div');
               layer1.id = "word-layer1";
               for(var span, i=0, len = word.length; i < len; ++i) {
                  span = document.createElement('span');
                  span.textContent = word[i];
                  layer1.appendChild(span);
               }
               wordDiv.appendChild(layer1);
               var layer2 = layer1.cloneNode(true);
               layer2.id = "word-layer2";
               wordDiv.appendChild(layer2);
               
               currentAutomaton = AutomataDesigner.getAutomaton(index, true);
               var q_init = currentAutomaton.getInitialState();
               listOfExecutions = [[[q_init, epsilon]]];
               currentAutomaton.setCurrentState(q_init);
               currentTransitions = currentAutomaton.getLastTakenTransitions().getList();

               accepting = false;
               var accepted;
               currentStates = currentAutomaton.getCurrentStates().getList();
               for(var i in currentStates) {
                  accepted = currentAutomaton.isAcceptingState(currentStates[i]);
                  if(!accepting && accepted) {
                     accepting = true;
                  }
                  if(EXECUTION_STEP_TIME || executionByStep) {
                     AutomataDesigner.stateSetBackgroundColor(
                        index,
                        currentStates[i],
                        accepted
                           ? CURRENT_FINAL_STATE_COLOR
                           : CURRENT_STATE_COLOR
                     );
                  }
               };
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

            if(stepNumber && !currentStates.length) {
               stepNumber = -1;
            }

            if((currentTransitions && EXECUTION_STEP_TIME) || stepNumber === -1) {
               results.textContent = '';
               var res;
               for(var i in listOfExecutions) {
                  results.appendChild(document.createElement('div'));
                  results.lastChild.className = 'execution';
                  res = '';
                  var s;
                  for(var k in listOfExecutions[i]) {
                     if(k) {
                        s = listOfExecutions[i][k][1];
                        res += k == 0 ? Set.prototype.elementToString(listOfExecutions[i][k][0]) : ': ' + (s === epsilon ? 'ε' : Set.prototype.elementToString(s, {"\\e":epsilon,"ε":epsilon})) + ' → ' + Set.prototype.elementToString(listOfExecutions[i][k][0]);
                     }
                  }
                  results.lastChild.textContent = res;
               }
            }

            if(stepNumber === -1) {
               executionTimeout = 0;
               var color = accepting ? CURRENT_FINAL_STATE_COLOR : STATE_REFUSED;
               wordDiv.firstChild.style.color = color;
               wordDiv.childNodes[1].style.color = color;

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

      var nextLoadIsPrefefAlgo, predefAlgoFunctions = [], loadPredefAlgoAfterImport = null;

      function launchPredefAlgo() {
         if(curAlgo.value === 'id') {
            setAutomatonResult(AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex));
            return;
         }
         if(predefAlgoFunctions[curAlgo.value]) {
            window.currentAutomaton = AutomataDesigner.currentIndex;
            if(typeof predefAlgoFunctions[curAlgo.value] === 'string') {
               var id      = 'predef-algo-' + curAlgo.value,
                   script  = document.getElementById(id);

               if(script) {
                  head.removeChild(script);
               }
               var script = document.createElement('script');
               if(js18Supported) {
                  script.type = 'text/javascript;version=1.8';
               }
               script.textContent = 'window.run(function(run){"use strict";\n' + predefAlgoFunctions[curAlgo.value] + '\n});';
               predefAlgoFunctions[curAlgo.value] = null;
               script.id = id;
               loadPredefAlgoAfterImport = true;
               enableAutoHandlingError = curAlgo.value;
               head.appendChild(script);
               enableAutoHandlingError = false;
            }
            else {
               launchUserProgram(predefAlgoFunctions[curAlgo.value]);
            }
         }
         else {
            nextLoadIsPrefefAlgo = true;
            AutomatonGlue.getScript(curAlgo.value, '?');
         }
      }

      document.getElementById('algorun').onclick = launchPredefAlgo;


      window.gotScript = function(includeName, code) {
         waitingFor.remove(includeName);

         var includes = [];
         code = AutomataJS.toPureJS(code, includes);

         if(nextLoadIsPrefefAlgo) {
            predefAlgoFunctions[includeName] = code;
            loadPredefAlgoAfterImport = 1;
            nextLoadIsPrefefAlgo = false;
         }
         else {
            var id      = 'useralgo-include-' + includeName,
                script  = document.getElementById(id);

            if(script) {
               head.removeChild(script);
            }

            script = document.createElement('script');
            script.id = id;

            if(js18Supported) {
               script.type = 'text/javascript;version=1.8';
            }

            script.textContent = code;
            window.currentAutomaton = NaN;
            enableAutoHandlingError = "module " + includeName;
            head.appendChild(script);
            enableAutoHandlingError = false;
         }

         handleImports(includes, "module " + includeName);
         if(waitingFor.isEmpty()) {
            setTimeout(function() {
               if(launchAfterImport && window.userProgram) {
                  launchAfterImport = false;
                  execProgram();
               }
               else if(loadPredefAlgoAfterImport) {
                  launchPredefAlgo();
               }
            }, 0);
         }
      };

      window.getScriptFailed = function(includeName, includer, reason) {
         handleError(libD.format(_("Error: import failed: '{0}' (in '{1}')."), reason, includer), '(?)');
      };

      window.AutomatonGlue = {
         getScript: function(includeName, includer) {
            if(includeName.match(/^(?:[a-z]+:(?:\\|\/\/?)|\/)/)) { // absolute path
               handleError(libD.format(_("Error: import: absolute paths are not supported in this version (in '{0}')'"), includer));
            }
            else {
               try {
                  var xhr = new XMLHttpRequest();
                  //workaround chromium issue #45702
                  xhr.open('get', 'algos/' + includeName + (location.protocol === 'file:' ? '?' + (new Date().toString()) : ''), false);
                  xhr.onreadystatechange = function() {
                     if(xhr.readyState === 4) {
                        if(!xhr.status || xhr.status === 200) {
                           window.gotScript(includeName, xhr.responseText);
                        }
                        else {
                           window.getScriptFailed(includeName, includer, libD.format(_('The file was not found or you don\'t have enough permissions to read it. (HTTP status: {0})'), xhr.status));
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

      window.helpSymbols = function(e) {
         if(e === "show") {
            notify(_("Howto: input symbols"), '<div style="max-width:80ex">' + _( "<p>In the window which will invit you to input symbols, simply enter the symbol you want to attach to the transition.</p><p>If you want to attach more than one symbol, separate them with commas.</p><p>If you want to input symbols containing spaces or commas, surrond them with double quotes.</p><p>If you need to input a symbol containing double-quotes or slashes, put a slash behind them and surround the symbol with double-quuotes.</p><p>to insert an epsilon (ε-transition), you can input it directly or use <code>\\e</code></p>") + '</div>', "info");
         }
         else {
            setTimeout(window.helpSymbols, 0, "show");
         }
      };

      var xhr = new XMLHttpRequest();
      //workaround chromium issue #45702
      xhr.open('get', 'algos/list.txt' + (location.protocol === 'file:' ? '?' + (new Date().toString()) : ''), false);
      xhr.onreadystatechange = function() {
         if(xhr.readyState === 4) {
            if(!xhr.status || xhr.status === 200) {
               var line,fname, descr, algos = xhr.responseText.split("\n");
               for(var i=0; i < algos.length;++i) {
                  line = algos[i].split("/");
                  fname = line[0].trim();
                  descr = line[1].trim();
                  line = document.createElement('option');
                  line.value = fname;
                  line.textContent = _(descr);
                  curAlgo.appendChild(line);
               }
            }
            else {
               notify(_("Getting list of predefined algorithms"), libD.format(_("Unable to get the list of predefined algorithms. Status:{0}"), xhr.status));
            }
         }
      };
      xhr.overrideMimeType('text/plain');
      xhr.send();

      switchmode.onchange();
      
      var translatedNodes = document.querySelectorAll('[data-translated-content]');
      for(var i=0, len = translatedNodes.length; i < len; ++i) {
         translatedNodes[i].textContent = _(translatedNodes[i].textContent);
      }
      translatedNodes = document.querySelectorAll('[data-translated-title]');
      for(var i=0, len = translatedNodes.length; i < len; ++i) {
         if(translatedNodes[i].title) {
            translatedNodes[i].title = _(translatedNodes[i].title);
         }
         if(translatedNodes[i].alt) {
            translatedNodes[i].alt= _(translatedNodes[i].alt);
         }
      }

      onResize();

   }, false);
   _("fr", "Program Result", "Résultat");
   _("fr", '\nStack trace: \n', "\nPile de l\'erreur : \n");
   _("fr", "Error on line {0}, character {1}", "Erreur ligne {0}, caractère {1}");
   _("fr", "Error on line {0}", "Erreur à la ligne {0}");
   _("fr", "Execute the current automaton with a word", "Exécuter l'automate actuel sur un mot");
   _("fr", "Which name do you want to give to the exported image? (give a .dot extension to save as dot format, .svg to save as svg)", "Quel nom voulez-vous donner à l'image exportée ? (donnez l'extension .dot pour enregistrer au format dot, .svg pour une image svg)");
   _("fr", "Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)", "Quel nom voulez-vous donner au fichier exporté ? (donnez l'extension .dot pour enregistrer au format dot, .svg pour une image svg, .txt pour le format texte)");
   _("fr", "Which name do you want to give to the exported text file?", "Quel nom voulez-vous donner au fichier texte exporté ?");
   _("fr",  "get_automaton: Automaton n°{0} doesn’t exist or doesn’t have an initial state.", "get_automaton: L’automate n°{0} n'existe pas ou n’a pas d’état initial.");
   _("fr", "Please enter a name for the file in which the program will be saved.", "Veuillez saisir un nom pour le fichier dans lequel le programme sera enregistré.");
   _("fr", "Please enter a name for the file in which the automaton will be saved.", "Veuillez saisir un nom pour le fichier dans lequel l'automate sera enregistré.");
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
   _("fr", "Program:", "Programme :");
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
   _("fr", "This automaton into the editor", "Cet automate dans l'éditeur");
   _("fr", "To create a new state, double-click on the drawing area where you want it to be.", "Pour créer un nouvel état, double-cliquez sur la surface de dessin à l'endroit où vous le voulez.");
   _("fr", "To add a new transition, Shift+click on the start state then click on the destination state.<br /><a href='#' onclick='return helpSymbols()'>Show how to input symbols</a>.", "Pour ajouter une nouvelle transition, cliquez sur l'état de départ en appuyant sur Maj puis cliquez sur l'état de destination.<br /><a href='#' onclick='return helpSymbols()'>Montrer l'aide sur comment saisir les symboles</a>.");
   _("fr", "To modify the name of a state, double-click on it.", "Pour changer le nom d'un état, double-cliquez sur celui-ci.");
   _("fr", "To modify symbols of a transition, double-click on its label.<br /><a href='#' onclick='return helpSymbols()'>Show how to input symbols</a>.", "Pour modifier les symboles d'une transition, double-cliquez sur son étiquette.<br /><a href='#' onclick='return helpSymbols()'>Montrer l'aide sur comment saisir les symboles</a>.");
   _("fr", "To remove a state, Ctrl+click on it.", "Pour supprimer un état, cliquez dessus en maintenant Ctrl enfoncé.");
   _("fr", "To remove a transition, Ctrl+click on its arrow.", "Pour supprimer une transition, cliquez sur sa flèche en maintenant Ctrl enfoncé.");
   _("fr", "To set a non-accepting state as accepting (and conversely), right-click on it.", "Pour rendre un état non-accepteur accepteur (et inversement), cliquez droit sur celui-ci.");
   _("fr", "To set a state as the initial state, Ctrl+right-click on it.", "Pour faire d'un état l'état initial, cliquez dessus avec le bouton droit en appuyant sur la touche Ctrl.");
   _("fr", "To make a transition straight, Shift+click on its arrow or its label.", "Pour rendre une transition droite, cliquez sur sa flèche ou son étiquette avec la touche Shift enfoncée.");
   _("fr", "New state", "Nouvel état");
   _("fr", "New transition", "Nouvelle transition");
   _("fr", "Modify state's name", "Modifier le nom d'un état");
   _("fr", "Modify transitions' symbols", "Modifier les symboles d'une transition");
   _("fr", "Remove a state", "Supprimer un état");
   _("fr", "Remove a transition", "Supprimer une transition");
   _("fr", "Toggle accepting/non accepting", "Changer accepteur/non accepteur");
   _("fr", "Set a state as initial", "Rendre un état initial");
   _("fr", "Make a transition straight", "Rendre une transition droite");
   _("fr", "Toggle the design toolbar", "Afficher/Masquer la barre d'outils de dessin");
   _("fr", "Howto: input symbols", "Comment saisir des symboles");
   _("fr", "<p>In the window which will invit you to input symbols, simply enter the symbol you want to attach to the transition.</p><p>If you want to attach more than one symbol, separate them with commas.</p><p>If you want to input symbols containing spaces or commas, surrond them with double quotes.</p><p>If you need to input a symbol containing double-quotes or slashes, put a slash behind them and surround the symbol with double-quuotes.</p><p>to insert an epsilon (ε-transition), you can input it directly or use <code>\\e</code></p>",
     "<p>Dans la fenêtre qui vous proposera de saisir des symboles, entrez simplement le symbole que vous voulez associer à la transition.</p><p>Si vous voulez saisir plusieurs symboles, séparez-les par des virgules.</p><p>Si vous voulez saisir des symboles contenant des espaces ou des virgules, encadrez-les par des guillemets doubles.</p><p>Si vous avez besoin de saisir un symbole contenant des guillemets ou des slashs, précédez ces deux caractères par un slash et encadrez le symbole par des guillemets.</p><p>Pour insérer un epsilon (ε-transition), vous pouvez le saisir directement ou utiliser <code>\\e</code>.</p>");
   _("fr", "Create a new automaton", "Créer un nouvel automate");
   _("fr", "Remove current automaton", "Supprimer cet automate");
   _("fr", "There is no automaton to save.", "Il n'y a pas d'automate à enregistrer.");
   _("fr", "Automaton", "Automate");
   _("fr", "Action:", "Action :");
   _("fr", "Determinize", "Déterminiser");
   _("fr", "ε-eliminate", "ε-éliminer");
   _("fr", "Minimize", "Minimiser");
   _("fr", "Determinize & Minimize", "Déterminiser & Minimiser");
   _("fr", "Test empty language", "Tester language vide");
   _("fr", "Test infinite language", "Tester language infini");
   _("fr", "JSON representation", "Représentation JSON");
   _("fr", "Load a Quiz", "Charger un Quiz");
   _("fr", "Loading the quiz failed", "Erreur lors du chargement du Quiz");
   _("fr", "The quiz seems to be malformed: {0}", "Le quiz semble mal formé : {0}");
   _("fr", "Start the Quiz", "Démarrer le quiz");
   _("fr", "Close the Quiz", "Fermer le quiz");
   _("fr", "Close", "Fermer");
   _("fr", "Quiz: ", "Quiz : ");
   _("fr", "Quiz", "Quiz");
   _("fr", "Question {0}: ", "Question {0} : ");
   _("fr", "Next question", "Question suivante");
   _("fr", "Previous question", "Question précédente");
   _("fr", "The Quiz is finished! Here are the details of the correction.", "Le quiz est terminé ! Voici les détails de la correction.");
   _("fr", "Error in the Quiz", "Erreur dans le quiz");
   _("fr", "There is an error in the Quiz: {0}", "Il y a une erreur dans le quiz : {0}");
   _("fr", "Question {0} has no answers.", "La question {0} n’a pas de réponse.");
   _("fr", "You can draw the automaton bellow.", "Vous pouvez dessiner l'automate ci-dessous.");
   _("fr", "Equiv. between 2 automata", "Équiv. entre 2 automates");
   _("fr", "Reg. Exp. → automaton", "Exp. Reg. → automate");
   _("fr", "Reg. Exp. → minimized automaton", "Exp. Reg. → automate minimisé");
   _("fr", "Complete", "Compléter");
   _("fr", "Complement", "Complémenter");
   _("fr", "Product", "Produit");
   _("fr", "Mirror", "Miroir");
   _("fr", "Wrong answer for {0}.", "Réponse incorrecte pour {0}.");
   _("fr", "The given automaton accepts too many words.", "L’automate donné accepte trop de mots.");
   _("fr", "The empty word is accepted while it shouldn’t be.", "Le mot vide est accepté alors qu’il ne devrait pas l’être.");
   _("fr", "The empty word is not accepted while it should be.", "Le mot vide n’est pas accepté alors qu’il devrait l’être.");
   _("fr", "Word <i>{0}</i> is accepted while it shouldn’t be.", "Le mot <i>{0}</i> est accepté alors qu’il ne devrait pas l’être.");
   _("fr", "Word <i>{0}</i> is not accepted while it should be.", "Le mot <i>{0}</i> n’est pas accepté alors qu’il devrait l‘être.");
   _("fr", "The given automaton isn’t equivalent to the expected one.", "L’automate donné n’est pas équivalent à l’automate attendu.");
   _("fr", "Question type not known", "Type de question inconnu")
   _("fr", 'Type of question {0} is not known. Known types are: <ul><li>"mcq" for multiple choices question,</li><li>"word" (to draw an automaton which accepts a given list of words).</li></ul>', 'Le type de la question {0} est inconnu. Les types reconnus sont : <ul><li>"mcq" pour question à choix multiples,</li><li>"word" (pour dessiner un automate qui accepte une liste donnée de mots).</li></ul>');
   _("fr", "Question was not answered.", "Vous n’avez pas répondu à la question.");
   _("fr", "We are willing to don’t give you any mark. Your progress is the most important thing, above any arbitrary absolute meaningless mark. Keep your efforts ;-)", "Nous souhaitons ne pas vous donner de note. Votre progression est la chose la plus importante, au delà de toute note arbitraire, absolue et dénuée de sens. Continuez vos efforts ;-)");
   _("fr", "Correct answer?", "Réponse correcte ?");
   _("fr", "Comments", "Commentaires");
   _("fr", "Instruction", "Énoncé");
   _("fr", "Yes", "Oui");
   _("fr", "No", "Non");
   _("fr", "Previous page", "Page précédente");
   _("fr", "Automaton given in the quiz is not correct.", "L’automate donné dans le quiz n’est pas correct.");
   _("fr", "No regular expression or automaton was given in the quiz.", "Aucun automate ou aucune expression régulière n’a été donné dans le quiz.");
   _("fr", "Automaton given in the quiz is not correct.", "L’automate donné dans le quiz n’est pas correct.");
   _("fr", "Select an algorithm", "Choisir un algorithme");
   _("fr", "You didn’t select enough automata. Please select {0} automata.", "Vous n’avez pas sélectionné assez d’automates. Veuillez en sélectionner {0}.");
   _("fr", "Automaton #{0}", "Automate n°{0}");
   _("fr", "You can choose the order in which automata will be used in algorithms.", 'Vous pouvez choisir l’ordre dans lequel les automates seront utilisés dans les algorithmes.');
   _("fr", "Continue execution", "Continuer l’exécution");
   _("fr", '<h2>Welcome to {0}.</h2>\
<p>Here is the area where you can <strong>draw automata</strong>.</p>\
<ul>\
   <li>To create a <strong>new state</strong>, double-click at the place where you want the state to be.</li>\
   <li>To create a <strong>new transition</strong>, ctrl+click on the start state and then click on the end state of the transition.</li>\
   <li>To <strong>rename</strong> a state or a transition, double-click on it.</li>\
   <li>To set a state as <strong>initial</strong>, ctrl+right click on the state.</li>\
   <li>To set a state as <strong>accepting</strong>, right-click on it.</li>\
   <li>To <strong>remove</strong> a state or a transition, ctrl-click on it.</li>\
</ul>\
<p>You can <strong>access to these instructions</strong> at any time by clicking the <img alt="" src="icons/oxygen/16x16/actions/draw-brush.png" /><b style="color:black;font-size:small">?</b> toolbar icon.</p>\
<p>When running a program or an algorithm, the <strong>result</strong> will appear <strong>at the right side</strong> of the screen.</p>\
<p>To load a quiz, click on the "Load a Quiz" toolbar button. You can keep on using all the features of the program, like running algorithms, during the quiz whenever it is possible to draw an automaton.</p>\
<p>To hide this text, cliquez-dessus.</p>\
<p> Enjoy yourself!</p>',
          '<h2>Bienvenue sur {0}.</h2>\
<p>Ceci est l’endroit où vous pouvez <strong>dessiner des automates</strong>.</p>\
<ul>\
   <li>Pour créer un <strong>nouvel état</strong>, double-cliquez à l’endroit où vous voulez que l’état soit placé.</li>\
   <li>Pour créer une <strong>nouvelle transition</strong>, ctrl+cliquez sur l’état de départ puis cliquez sur l’état de fin de la transition.</li>\
   <li>Pour <strong>renomer</strong> un état ou une transition, double-cliquez dessus.</li>\
   <li>Pour rendre un état <strong>initial</strong>, ctrl-cliquez dessus avec le bouton droit de votre souris.</li>\
   <li>Pour rendre un état <strong>accepteur</strong>, cliquez dessus avec le bouton droit de votre souris.</li>\
   <li>Pour <strong>supprimer</strong> un état ou une transition, ctrl-cliquez dessus.</li>\
</ul>\
<p>Vous pouvez <strong>accéder à ces instructions</strong> à tout moment en cliquant sur l’icône <img alt="" src="icons/oxygen/16x16/actions/draw-brush.png" /><b style="color:black;font-size:small">?</b> de la barre d’outils.</p>\
<p>Quand vous exécuterez un programme ou un algorithme, le <strong>résultat</strong> apparaîtra <strong>à la droite</strong> de l’écran.</p>\
<p>Pour ouvrir un quiz, cliquez sur le bouton "Charger un Quiz" de la barre d’outils. Vous pouvez continuer à utiliser toutes les fonctionnalités du programme, comme lancer des algorithmes, pendant le quiz à tout moment lorsqu’il est possible de dessiner un automate.</p>\
<p>Pour faire disparaître ce texte, cliquez dessus.</p>\
<p> Amusez vous bien !</p>');
_("fr", 'The algorithm you want to use needs {0} automata. Please select these automata in the order you want and click "Continue execution" when you are ready.', 'L’algorithme que vous voulez utiliser requiert {0} automates. Veuillez sélectionner ces automates dans l’ordre que vous voulez et cliquez sur « Continuer l’exécution » quand vous avez fait votre choix.');
_("fr", 'This order will be used for future algorithm executions. If you want to change this order, you can call this list using the <img src="{0}" /> toolbar icon.<br />Notice: Algorithms taking only one automaton work with the current automaton, they don’t use this ordering.', 'Cet ordre sera utilisé pour les exécutions d’algorithme futures. Si vous voulez changer cet ordre, vous pouvez rappeler cette liste en utilisant l’icône <img src="{0}" /> de la barre d’outils.<br />Note : Les algorithmes qui ne prennent qu’un automate travaillent sur l’automate courant, ils n’utilisent pas cet ordre.');
})();