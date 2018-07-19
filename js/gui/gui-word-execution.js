/*
    Copyright (c) Raphaël Jakse (Université Grenoble-Alpes), 2013-2016

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

/* globals libD,  aude, epsilon, automataMap */

(function (pkg) {
    var localStorage = window.localStorage || {};

    var CURRENT_FINAL_STATE_COLOR            = localStorage.CURRENT_FINAL_STATE_COLOR || "rgba(90, 160, 0, 0.5)";
    var CURRENT_TRANSITION_COLOR             = localStorage.CURRENT_TRANSITION_COLOR  || "#BD5504";
    var CURRENT_STATE_COLOR                  = localStorage.CURRENT_STATE_COLOR       || "#FFFF7B";
    var STATE_REFUSED                        = localStorage.STATE_REFUSED             || "rgba(255, 50, 50, 0.5)";
    var CURRENT_TRANSITION_PULSE_TIME_FACTOR = parseFloat(localStorage.CURRENT_TRANSITION_PULSE_TIME_FACTOR) || 0.6;
    var EXECUTION_STEP_TIME                  = parseInt(localStorage.EXECUTION_STEP_TIME, 10);
    var CURRENT_TRANSITION_PULSE_TIME_STEP   = 600;
    var HAND_STEP_TIME                       = 250;

    if (isNaN(EXECUTION_STEP_TIME)) {
        EXECUTION_STEP_TIME = 1200;
    }

    var wordDiv = null;
    var localStorage      = window.localStorage || {};
    var executionTimeout    = 0;

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var executeWin = null;
    var stackWin = null;
    var determinize = false;

    AudeGUI.WordExecution = {
        load: function () {
            wordDiv = document.getElementById("word");
        },

        stop: function (index) {
            if (executionTimeout) {
                clearTimeout(executionTimeout);
                executionTimeout = 0;
                wordDiv.textContent = "";
                AudeGUI.mainDesigner.cleanSVG(index);
            }
        },

        run: function () {
            AudeGUI.Results.enable();
            if (!executeWin || !executeWin.ws) {
                var refs = {};
                var typeAutomaton = "automaton";
                executeWin = libD.newWin({
                    minimizable: false,
                    show: true,
                    title:       _("Execute the current automaton with a word"),
                    right:       document.getElementById("results").offsetWidth  + 10, // FIXME
                    top:         document.getElementById("toolbar").offsetHeight + 5,
                    content:     libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                        ["div", {"#": "root"}, [
                            ["input.run-word-type-automaton",{"type":"radio","name":"mode","value":"automaton","checked":"true"}],
                            ["span",_("Automaton")],
                            ["input.run-word-type-automaton",{"type":"radio","name":"mode","value":"pushdown"}],
                            ["span",_("Pushdown automaton")],["br"],
                            ["label", {"for":"execute-word-input"}, _("Word: ")],
                            ["input#execute-word-input", {type: "text", "#": "word"}],
                            ["input", {type: "button", value: _("Run"),  "#": "run"}],
                            ["input", {type: "button", value: _("Step"), "#": "step"}]
                        ]],
                        ["div", [
                            ["label", {"for":"execute-delay-input"}, _("Delay between steps (ms): ")],
                            ["input#execute-delay-input", {type: "text", "#": "delay", value: EXECUTION_STEP_TIME}],
                            ["br"],
                        ]],
                        ["div#run-word-pushdown-parameters",{"style":"display:none"},[
                            ["label", _("Initial stack symbol : ")],
                            ["input#run-word-initial-stack-symbol", {type: "text", "#": "stackSymbol", value: "Z"}], ["br"],
                            ["span",_("Determinized pushdown automaton: ")],
                            ["input#run-word-determinize", {type:"checkbox","#": "determinize"}],
                        ]]
                    ]], refs)
                });
                executeWin.__refs = refs;
                executeWin.addListener("close", function () {
                    wordDiv.textContent = "";
                    AudeGUI.mainDesigner.cleanSVG(AudeGUI.mainDesigner.currentIndex);
                    if (stackWin)
                        stackWin.close();
                });
                libD.wm.handleSurface(executeWin, refs.root);
                refs.run.onclick = function () {
                    if(typeAutomaton==="pushdown" && refs.determinize.checked)
                        determinize = true;
                    else
                        determinize = false;

                    refs.run.focus(); // make the virtual keyboard disappear on tablets
                    AudeGUI.WordExecution.stop();
                    AudeGUI.mainDesigner.cleanSVG(AudeGUI.mainDesigner.currentIndex);
                    refs.delay.onchange();
                    execute(false, typeAutomaton, refs.stackSymbol.value, refs.word.value, AudeGUI.mainDesigner.currentIndex);
                };

                refs.step.onclick = function () {
                    if(typeAutomaton==="pushdown" && refs.determinize.checked)
                        determinize = true;
                    else
                        determinize = false;

                    if (executionTimeout) {
                        clearTimeout(executionTimeout);
                        execute(true, typeAutomaton, refs.stackSymbol.value);
                    } else {
                        execute(true, typeAutomaton, refs.stackSymbol.value, refs.word.value, AudeGUI.mainDesigner.currentIndex);
                    }
                };

                refs.delay.onchange = function () {
                    EXECUTION_STEP_TIME = parseInt(refs.delay.value, 10);
                    if (isNaN(EXECUTION_STEP_TIME)) {
                        EXECUTION_STEP_TIME = localStorage.EXECUTION_STEP_TIMEv;
                    }
                    localStorage.EXECUTION_STEP_TIME = EXECUTION_STEP_TIME;
                };

                refs.word.onkeypress = function (e) {
                    if (e.keyCode === 13) {
                        refs.run.onclick();
                    }
                };

                //Chose between automaton and pushown automaton
                var type = document.getElementsByClassName("run-word-type-automaton");
                type[0].oninput = function() {
                    executeWin.resize();
                    document.getElementById("run-word-pushdown-parameters").style.display = "none";
                    typeAutomaton = "automaton";
                };
                type[1].oninput = function() {
                    executeWin.resize();
                    document.getElementById("run-word-pushdown-parameters").style.display = "inherit";
                    typeAutomaton = "pushdown";
                };

            }
            executeWin.show();
            executeWin.__refs.word.focus();
        }
    };

    var accepting, word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep, typeAutomaton;

    function execute(byStep, typeAuto, initStackSymbol, w, ind) {
        if (typeof w === "string") {
            word  = w;
            index = ind;
            currentSymbolNumber = 0;
            stepNumber = 0;
            executionByStep = byStep;
            typeAutomaton = typeAuto;
        }

        if (byStep) {
            executionByStep = byStep;
        }

        var currentTransitions, i, len, accepted;

        if (stepNumber) {
            if (EXECUTION_STEP_TIME || executionByStep || !word[0]) {
                if (stepNumber % 2) {
                    if (currentStates) {
                        for (i = 0, len = currentStates.length; i < len; ++i) {
                            AudeGUI.mainDesigner.stateRemoveBackgroundColor(index, currentStates[i].toString());
                        }
                    }

                    currentStates = aude.toArray(currentAutomaton.getCurrentStates());
                    accepting = false;
                    for (i = 0, len = currentStates.length; i < len; ++i) {
                        accepted = currentAutomaton.isAcceptingState(currentStates[i]);
                        if (!accepting && accepted) {
                            accepting = true;
                        }

                        AudeGUI.mainDesigner.stateSetBackgroundColor(
                            index,
                            currentStates[i],
                            accepted
                                ? CURRENT_FINAL_STATE_COLOR
                                : CURRENT_STATE_COLOR
                        );
                    }
                } else {
                    currentStates = aude.toArray(currentAutomaton.getCurrentStates());
                    currentAutomaton.runSymbol(word[0]);
                    wordDiv.firstChild.childNodes[currentSymbolNumber++].className = "eaten";
                    word = word.substr(1);
                    currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());

                    //Work only on determinized pushdown automaton
                    if (typeAutomaton === "pushdown") {
                        redrawStack(currentTransitions);
                    }

                    for (i = 0, len = currentTransitions.length; i < len; ++i) {
                        AudeGUI.mainDesigner.transitionPulseColor(index, currentTransitions[i].startState, currentTransitions[i].symbol, currentTransitions[i].endState, CURRENT_TRANSITION_COLOR, CURRENT_TRANSITION_PULSE_TIME_FACTOR * (byStep ? CURRENT_TRANSITION_PULSE_TIME_STEP : EXECUTION_STEP_TIME));
                    }
                }
            } else {
                currentAutomaton.runSymbol(word[0]);
                word = word.substr(1);
                if (typeAutomaton === "pushdown") {
                    redrawStack(currentTransitions);
                }
                currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());
            }
        } else {
            stepNumber = 0; // we start everything.

            if (index === undefined) {
                index = AudeGUI.mainDesigner.currentIndex;
            }

            wordDiv.textContent = "";

            var layer1 = document.createElement("div");
            layer1.id = "word-layer1";

            var span;

            for (i = 0, len = word.length; i < len; ++i) {
                span = document.createElement("span");
                span.textContent = word[i];
                layer1.appendChild(span);
            }

            wordDiv.appendChild(layer1);

            var layer2 = layer1.cloneNode(true);
            layer2.id = "word-layer2";
            wordDiv.appendChild(layer2);


            if (typeAutomaton === "automaton")
                currentAutomaton = AudeGUI.mainDesigner.getAutomaton(index, true);
            else if (typeAutomaton === "pushdown") {
                currentAutomaton = AudeGUI.Runtime.get_pushdown_automaton(index);
                currentAutomaton.setInitialStackSymbol(initStackSymbol);
                displayStack(initStackSymbol);
            }

            var q_init = currentAutomaton.getInitialState();
            listOfExecutions = [[[q_init, epsilon]]];
            if (typeAutomaton === "automaton")
                currentAutomaton.setCurrentState(q_init);
            else if (typeAutomaton === "pushdown")
                currentAutomaton.setCurrentState({"state":q_init, "stack":currentAutomaton.getStack()});
            currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());

            //If the automaton start with epsilon transition, we draw the stack with the modifications of the epsilon transition
            if (typeAutomaton === "pushdown")
                redrawStack(currentTransitions);

            accepting = false;
            currentStates = aude.toArray(currentAutomaton.getCurrentStates());



            for (i = 0, len = currentStates.length; i < len; ++i) {
                accepted = currentAutomaton.isAcceptingState(currentStates[i]);

                if (!accepting && accepted) {
                    accepting = true;
                }

                if (EXECUTION_STEP_TIME || executionByStep) {
                    AudeGUI.mainDesigner.stateSetBackgroundColor(
                        index,
                        currentStates[i],
                        accepted
                            ? CURRENT_FINAL_STATE_COLOR
                            : CURRENT_STATE_COLOR
                    );
                }
            }
        }

        var j, leng;

        if (currentTransitions) {
            var t, l, transitionsByStartState = {};

            for (i = 0, len = currentTransitions.length; i < len; ++i) {
                t = currentTransitions[i];

                if (!transitionsByStartState[t.startState]) {
                    transitionsByStartState[t.startState] = [];
                }

                transitionsByStartState[t.startState].push([t.endState, t.symbol]);
            }

            var newListOfExecutions = [], startState, newL;

            for (i = 0, len = listOfExecutions.length; i < len; ++i) {
                l = listOfExecutions[i];
                startState = l[l.length - 1][0];
                if (transitionsByStartState[startState]) {
                    for (j = 0, leng = transitionsByStartState[startState].length; j < leng; ++j) {
                        newL = l.slice();
                        newL.push(transitionsByStartState[startState][j]);
                        newListOfExecutions.push(newL);
                    }
                }
            }

            listOfExecutions = newListOfExecutions;
        }

        if (stepNumber && !currentStates.length) {
            stepNumber = -1;
        }

        if ((currentTransitions && EXECUTION_STEP_TIME) || stepNumber === -1) {
            var resultDiv = document.createElement("div");

            AudeGUI.Results.setDOM(resultDiv);

            var res, s;

            for (i = 0, len = listOfExecutions.length; i < len; ++i) {
                var div = document.createElement("div");
                div.className = "execution";
                res = "";

                for (j = 0, leng = listOfExecutions[i].length; j < leng; ++j) {
                    s = listOfExecutions[i][j][1];
                    res += j ? ": " + (s === epsilon ? "ε" : aude.elementToString(s, automataMap)) + " → " + aude.elementToString(listOfExecutions[i][j][0]) : aude.elementToString(listOfExecutions[i][j][0]);
                }

                div.textContent = res;
                resultDiv.appendChild(div);
            }
        }

        if (stepNumber === -1) {
            executionTimeout = 0;
            var color = accepting ? CURRENT_FINAL_STATE_COLOR : STATE_REFUSED;
            wordDiv.firstChild.style.color = color;
            wordDiv.childNodes[1].style.color = color;
        } else {
            if (!word[0]) { // the word is completely eaten
                stepNumber = -1;
            } else {
                ++stepNumber;
            }

            if (!executionByStep) {
                if (stepNumber && EXECUTION_STEP_TIME) {
                    executionTimeout = setTimeout(execute, EXECUTION_STEP_TIME - ((stepNumber % 2) ? 0 : 1) * EXECUTION_STEP_TIME / 2);
                } else {
                    execute();
                }
            } else if (stepNumber % 2) {
                executionTimeout = setTimeout(execute, HAND_STEP_TIME);
            }
        }
    }

    //Display the window stack and initialise the stack with the initial stack symbol
    function displayStack (initialSymbol) {

        //If the automaton is not determinized or has epsilon transition
        if (!determinize) {
            var cont = libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                ["table#table-tables-stack",[ //The table which contains all the table
                    ["tr",[
                        ["th",_("State: ")+ currentAutomaton.getInitialState()],
                    ]],
                    ["td",[
                    ]]
                ]],
            ]]);

            if (!stackWin || !stackWin.ws) {
                stackWin = libD.newWin({
                    minimizable: false,
                    show: true,
                    title:       _("Stacks"),
                    right:       document.getElementById("results").offsetWidth  + 10, // FIXME
                    top:         document.getElementById("toolbar").offsetHeight + 5,
                    content:     cont,
                })
            }
            else { //Reset the display of the stack
                stackWin.content.replaceChild(cont,stackWin.content.children[0])
            }

            var table = libD.jso2dom([
                ["table",[
                    ["tr",[
                        ["th",_("Index")],
                        ["th",_("Value")],
                    ]],
                ]]
            ]);
            document.getElementById("table-tables-stack").children[1].appendChild(table);
            var i=0;
            for (var c of initialSymbol.split("").reverse().join("")) {
                var tr = libD.jso2dom([
                ["tr",[
                    ["td",(String(i))],
                    ["td",(c)],
                ]]
                ]);
                if(i===0)
                    table.appendChild(tr);
                else
                    table.insertBefore(tr,table.firstChild.nextSibling);
                i++;
            }
        }

        //If the automaton is determinized
        else {
            var cont = libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                ["table#table-stack",[
                    ["tr",[
                        ["th",_("Index")],
                        ["th",_("Value")],
                    ]],
                ]],
            ]]);

            if (!stackWin || !stackWin.ws) {
                stackWin = libD.newWin({
                    minimizable: false,
                    show: true,
                    title:       _("Stack"),
                    right:       document.getElementById("results").offsetWidth  + 10, // FIXME
                    top:         document.getElementById("toolbar").offsetHeight + 5,
                    content:     cont,
                })
            }
            else { //Reset the display of the stack
                stackWin.content.replaceChild(cont,stackWin.content.children[0])
            }
            var i=0;
            for (var c of initialSymbol.split("").reverse().join("")) {
                var tr = libD.jso2dom(["tr",[
                    ["td",(String(i))],
                    ["td",(c)],
                ]]);
                if(i===0)
                    document.getElementById("table-stack").appendChild(tr);
                else
                    document.getElementById("table-stack").insertBefore(tr,document.getElementById("table-stack").firstChild.nextSibling);
                i++;
            }
        }
    }


    //After each taken transition, remove the stackSymbol and add the new stack symbol
    function redrawStack(transitions) {

        //If the automaton is not determinized or has epsilon transition
        if (!determinize) {
            var cont = libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                ["table#table-tables-stack",[ //The table which contains all the table
                    ["tr",[
                    ]],
                    ["tr",[
                    ]]
                ]],
            ]]);



            stackWin.content.replaceChild(cont,stackWin.content.children[0]); //Recreate all the tables
            var table = document.getElementById("table-tables-stack");

            //For each stack
            var tabState = [];
            for (cs of currentAutomaton.getCurrentStatesStacks()) {

                if (tabState.indexOf(cs.state)<0) {
                    tabState.push(cs.state);
                    table.children[0].appendChild(libD.jso2dom([
                        ["th",_("State: ")+cs.state]
                    ]));
                    table.children[1].appendChild(libD.jso2dom([
                        ["td",[
                    ]],
                ]));
                }

                var newTable = libD.jso2dom([
                    ["span",{"style":"display:inline-block; margin-right:5px"},[
                        ["table",[
                            ["tr",[
                                ["th",_("Index")],
                                ["th",_("Value")],
                            ]],
                        ]],
                    ]]
                ]);
                table.children[1].children[tabState.indexOf(cs.state)].appendChild(newTable);
                var i=0;
                for (var c of cs.stack) {
                    var tr = libD.jso2dom([
                    ["tr",[
                        ["td",(String(i))],
                        ["td",(c)],
                    ]]
                    ]);
                    if(i===0)
                        newTable.firstChild.appendChild(tr);
                    else
                        newTable.firstChild.insertBefore(tr,newTable.firstChild.firstChild.nextSibling);
                    i++;
                }
            }
            stackWin.resize();
        }

        //If the automaton is determinized
        else {
            if (executionByStep) //If the execution is by step we inmpose a time to show the modification of the stack
                timeExec = 500/transitions.length;
            else
                timeExec = EXECUTION_STEP_TIME/transitions.length;

            var stack = document.getElementById("table-stack");

            var compt=0;
            //For each transition
            for (trans of transitions) {

                setTimeout(redLines.bind(null,trans.stackSymbol),(timeExec)*(compt)); //Add in red the lines to remove
                setTimeout(removeSym.bind(null,trans.stackSymbol),(timeExec/2)+(timeExec*compt)); //Remove the lines in red
                setTimeout(addSym.bind(null,trans.newStackSymbol),(timeExec/2)+(timeExec*compt)); //Add the new lines and color them in green
                setTimeout(removeGreen.bind(null,trans.newStackSymbol),(timeExec)+(timeExec*compt)); //Remove the green color of the new lines


                function redLines(stackSymbol) {
                    var i=1;
                    for (var c of stackSymbol) { //Draw in red the line to remove
                        stack.children[i].style.backgroundColor = "red";
                        i++;
                    }
                }

                function removeSym(stackSym) {
                    for (var c of stackSym)
                        stack.removeChild(stack.children[1]);
                }

                function addSym(newStackSymbol) {
                    //Add the new stack symbol
                    for (var c of newStackSymbol.split("").reverse().join("")) {
                        if(c!==pkg.epsilon && c!=="ε") {
                            var line = libD.jso2dom([
                                ["tr",{"style":"background-color:#5cd65c"},[ //Draw in green the line added
                                    ["td",(String(stack.childElementCount-1))],
                                    ["td",(c)],
                                ]],
                            ]);
                            if (stack.childElementCount==1) //If there nothing in the stack
                                stack.appendChild(line)
                            else
                                stack.insertBefore(line,stack.children[1]);
                        }
                    }
                    stackWin.resize();
                }

                function removeGreen(newStackSymbol) {
                    var j = 1;
                    for (var c of newStackSymbol) {
                        if(c!==pkg.epsilon && c!=="ε") {
                            stack.children[j].style.backgroundColor = "inherit";
                            j++;
                        }
                    }
                }
                compt++;
            }
        }

    }

}(window));
