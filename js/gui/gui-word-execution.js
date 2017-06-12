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
                executeWin = libD.newWin({
                    minimizable: false,
                    title:       _("Execute the current automaton with a word"),
                    right:       document.getElementById("results").offsetWidth  + 10, // FIXME
                    top:         document.getElementById("toolbar").offsetHeight + 5,
                    content:     libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                        ["div", {"#": "root"}, [
                            ["label", {"for":"execute-word-input"}, _("Word: ")],
                            ["input#execute-word-input", {type: "text", "#": "word"}],
                            ["input", {type: "button", value: _("Run"),  "#": "run"}],
                            ["input", {type: "button", value: _("Step"), "#": "step"}]
                        ]],
                        ["div", [
                            ["label", {"for":"execute-delay-input"}, _("Delay between steps (ms): ")],
                            ["input#execute-delay-input", {type: "text", "#": "delay", value: EXECUTION_STEP_TIME}]
                        ]]
                    ]], refs)
                });
                executeWin.__refs = refs;
                executeWin.addListener("close", function () {
                    wordDiv.textContent = "";
                    AudeGUI.mainDesigner.cleanSVG(AudeGUI.mainDesigner.currentIndex);
                });
                libD.wm.handleSurface(executeWin, refs.root);
                refs.run.onclick = function () {
                    refs.run.focus(); // make the virtual keyboard disappear on tablets
                    AudeGUI.WordExecution.stop();
                    AudeGUI.mainDesigner.cleanSVG(AudeGUI.mainDesigner.currentIndex);
                    refs.delay.onchange();
                    execute(false, refs.word.value, AudeGUI.mainDesigner.currentIndex);
                };

                refs.step.onclick = function () {
                    if (executionTimeout) {
                        clearTimeout(executionTimeout);
                        execute(true);
                    } else {
                        execute(true, refs.word.value, AudeGUI.mainDesigner.currentIndex);
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
            }
            executeWin.show();
            executeWin.__refs.word.focus();
        }
    };

    var accepting, word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep;

    function execute(byStep, w, ind) {
        if (typeof w === "string") {
            word  = w;
            index = ind;
            currentSymbolNumber = 0;
            stepNumber = 0;
            executionByStep = byStep;
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

                    for (i = 0, len = currentTransitions.length; i < len; ++i) {
                        AudeGUI.mainDesigner.transitionPulseColor(index, currentTransitions[i].startState, currentTransitions[i].symbol, currentTransitions[i].endState, CURRENT_TRANSITION_COLOR, CURRENT_TRANSITION_PULSE_TIME_FACTOR * (byStep ? CURRENT_TRANSITION_PULSE_TIME_STEP : EXECUTION_STEP_TIME));
                    }
                }
            } else {
                currentAutomaton.runSymbol(word[0]);
                word = word.substr(1);
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

            currentAutomaton = AudeGUI.mainDesigner.getAutomaton(index, true);
            var q_init = currentAutomaton.getInitialState();
            listOfExecutions = [[[q_init, epsilon]]];
            currentAutomaton.setCurrentState(q_init);
            currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());

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
}(window));
