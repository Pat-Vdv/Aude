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

/* globals libD,  aude, automataMap */

// FIXME: remove casts "as any" to access style

(
function () {
const CURRENT_FINAL_STATE_COLOR = localStorage.CURRENT_FINAL_STATE_COLOR || "rgba(90, 160, 0, 0.5)";
const CURRENT_TRANSITION_COLOR = localStorage.CURRENT_TRANSITION_COLOR || "#BD5504";
const CURRENT_STATE_COLOR = localStorage.CURRENT_STATE_COLOR || "#FFFF7B";
const STATE_REFUSED = localStorage.STATE_REFUSED || "rgba(255, 50, 50, 0.5)";
const CURRENT_TRANSITION_PULSE_TIME_FACTOR = parseFloat(localStorage.CURRENT_TRANSITION_PULSE_TIME_FACTOR) || 0.6;
const CURRENT_TRANSITION_PULSE_TIME_STEP = 600;
const HAND_STEP_TIME = 250;

let EXECUTION_STEP_TIME = parseInt(localStorage.EXECUTION_STEP_TIME, 10);
if (isNaN(EXECUTION_STEP_TIME)) {
    EXECUTION_STEP_TIME = 1200;
}

let wordDiv = null;
let executionTimeout = 0;

let AudeGUI = window.AudeGUI;
let _ = AudeGUI.l10n;

let executeWin = null;
let stackWin = null;
let determinize = false;

let tapeWin = null;

class WordExecution {
    static load() {
        wordDiv = document.getElementById("word");
    }

    static stop(index) {
        if (executionTimeout) {
            clearTimeout(executionTimeout);
            executionTimeout = 0;
            wordDiv.textContent = "";
            AudeGUI.mainDesigner.cleanSVG(index);
        }
    }

    static run() {
        AudeGUI.Results.enable();
        if (!executeWin || !executeWin.ws) {
            let refs: any = {};
            let typeAutomaton = "automaton";
            executeWin = libD.newWin({
                minimizable: false,
                show: true,
                title: _("Execute the current automaton with a word"),
                right: document.getElementById("results").offsetWidth + 10, // FIXME
                top: document.getElementById("toolbar").offsetHeight + 5,
                content: libD.jso2dom(
                    ["div.libD-ws-colors-auto", { "style": "height:100%" }, [
                        ["div", { "#": "root" }, [
                            ["label", [
                                ["input.run-word-type-automaton", {
                                    "type": "radio",
                                    "name": "mode",
                                    "value": "automaton",
                                    "checked": "true"
                                }],
                                ["#", " " + _("Automaton")]
                            ]],

                            ["label", [
                                ["input.run-word-type-automaton", {
                                    "type": "radio",
                                    "name": "mode",
                                    "value": "pushdown"
                                }],
                                ["#", " " + _("Pushdown automaton")]
                            ]],

                            ["label", [
                                ["input.run-word-type-automaton", {
                                    "type": "radio",
                                    "name": "mode",
                                    "value": "turing"
                                }],
                                ["#", " " + _("Turing machine")]
                            ]], ["br"],

                            ["label", { "for": "execute-word-input" }, _("Word: ")],
                            ["input#execute-word-input", { type: "text", "#": "word" }],
                            ["input", { type: "button", value: _("Run"), "#": "run" }],
                            ["input", { type: "button", value: _("Step"), "#": "step" }]
                        ]],

                        ["div", [
                            ["label", { "for": "execute-delay-input" }, _("Delay between steps (ms): ")],
                            ["input#execute-delay-input", { type: "text", "#": "delay", value: EXECUTION_STEP_TIME }],
                            ["br"],
                        ]],

                        ["div#run-word-pushdown-parameters", { "style": "display:none" }, [
                            ["label", _("Initial stack symbol : ")],
                            ["input#run-word-initial-stack-symbol", { type: "text", "#": "stackSymbol", value: "Z" }], ["br"],
                            ["span", _("Determinized pushdown automaton: ")],
                            ["input#run-word-determinize", { type: "checkbox", "#": "determinize" }],
                        ]]
                    ]],
                    refs
                )
            });

            executeWin.__refs = refs;

            executeWin.addListener("close", function () {
                wordDiv.textContent = "";
                AudeGUI.mainDesigner.cleanSVG(AudeGUI.mainDesigner.currentIndex);
                if (stackWin) {
                    stackWin.close();
                }
            });

            libD.wm.handleSurface(executeWin, refs.root);
            refs.run.onclick = function () {
                determinize = (
                    typeAutomaton === "pushdown" &&
                    refs.determinize.checked
                );

                // Make the virtual keyboard disappear on tablets
                refs.run.focus();

                AudeGUI.WordExecution.stop();
                AudeGUI.mainDesigner.cleanSVG(AudeGUI.mainDesigner.currentIndex);
                refs.delay.onchange();

                execute(
                    false,
                    typeAutomaton,
                    refs.stackSymbol.value,
                    refs.word.value,
                    AudeGUI.mainDesigner.currentIndex
                );
            };

            refs.step.onclick = function () {
                determinize = (
                    typeAutomaton === "pushdown" &&
                    refs.determinize.checked
                );

                if (executionTimeout) {
                    clearTimeout(executionTimeout);
                    execute(
                        true,
                        typeAutomaton,
                        refs.stackSymbol.value
                    );
                } else {
                    execute(
                        true,
                        typeAutomaton,
                        refs.stackSymbol.value,
                        refs.word.value,
                        AudeGUI.mainDesigner.currentIndex
                    );
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

            // Chose between automaton and pushown automaton
            let automatonTypeInput = document.getElementsByClassName("run-word-type-automaton");

            (automatonTypeInput[0] as any).oninput = function () {
                executeWin.resize();
                document.getElementById("run-word-pushdown-parameters").style.display = "none";
                typeAutomaton = "automaton";
            };

            (automatonTypeInput[1] as any).oninput = function () {
                executeWin.resize();
                document.getElementById("run-word-pushdown-parameters").style.display = "inherit";
                typeAutomaton = "pushdown";
            };

            (automatonTypeInput[2] as any).oninput = function () {
                executeWin.resize();
                document.getElementById("run-word-pushdown-parameters").style.display = "none";
                typeAutomaton = "turing";
            };

        }
        executeWin.show();
        executeWin.__refs.word.focus();
    }
};

let accepting, word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep, typeAutomaton;

function execute(byStep?: boolean, typeAuto?: string, initStackSymbol?: string, w?: string, ind?: number) {
    if (typeof w === "string") {
        word = w;
        index = ind;
        currentSymbolNumber = 0;
        stepNumber = 0;
        executionByStep = byStep;
        typeAutomaton = typeAuto;
    }

    if (byStep) {
        executionByStep = byStep;
    }

    let currentTransitions, i, len, accepted;

    if (stepNumber) {
        if (EXECUTION_STEP_TIME || executionByStep || !word[0]) {
            if (stepNumber % 2) {
                if (currentStates) {
                    for (i = 0, len = currentStates.length; i < len; ++i) {
                        AudeGUI.mainDesigner.stateRemoveBackgroundColor(
                            index,
                            currentStates[i].toString()
                        );
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

                // If we have a turing machine, we use step() instead of runSymbol() and update the tape graphics.
                if (typeAuto === "turing" || typeAutomaton === "turing") {
                    if (currentAutomaton.step()) {
                        word = "";
                    }
                    updateTape();
                } else {
                    currentAutomaton.runSymbol(word[0]);
                    wordDiv.firstChild.children[currentSymbolNumber++].className = "eaten";
                    word = word.substr(1);
                }
                currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());

                // Work only on determinized pushdown automaton
                if (typeAutomaton === "pushdown") {
                    redrawStack(currentTransitions);
                }

                for (i = 0, len = currentTransitions.length; i < len; ++i) {
                    AudeGUI.mainDesigner.transitionPulseColor(
                        index,
                        currentTransitions[i].startState,
                        currentTransitions[i].symbol,
                        currentTransitions[i].endState,
                        CURRENT_TRANSITION_COLOR,
                        CURRENT_TRANSITION_PULSE_TIME_FACTOR * (
                            byStep
                                ? CURRENT_TRANSITION_PULSE_TIME_STEP
                                : EXECUTION_STEP_TIME
                        )
                    );
                }
            }
        } else {
            currentAutomaton.runSymbol(word[0]);
            word = word.substr(1);

            if (typeAutomaton === "pushdown") {
                redrawStack(currentTransitions);
            }

            currentTransitions = aude.toArray(
                currentAutomaton.getLastTakenTransitions()
            );
        }
    } else {
        stepNumber = 0; // We start everything.

        if (index === undefined) {
            index = AudeGUI.mainDesigner.currentIndex;
        }

        wordDiv.textContent = "";

        let layer1 = document.createElement("div");
        layer1.id = "word-layer1";

        let span;

        for (i = 0, len = word.length; i < len; ++i) {
            span = document.createElement("span");
            span.textContent = word[i];
            layer1.appendChild(span);
        }

        wordDiv.appendChild(layer1);

        let layer2 = layer1.cloneNode(true) as Element;
        layer2.id = "word-layer2";
        wordDiv.appendChild(layer2);

        if (typeAutomaton === "automaton") {
            currentAutomaton = AudeGUI.mainDesigner.getAutomaton(index, true);
        } else if (typeAutomaton === "pushdown") {
            currentAutomaton = AudeGUI.Runtime.get_pushdown_automaton(index);
            displayStack(initStackSymbol);
        } else if(typeAutomaton === "turing") {
            // Turing Machine : We parse the automaton, place the word on the tape and display the tape graphics.
            currentAutomaton = AudeGUI.Runtime.get_turing_machine(index);
            currentAutomaton.placeWordOnTape(w);
            displayTape();
        }

        let q_init = currentAutomaton.getInitialState();
        listOfExecutions = [[[q_init, epsilon]]];

        if (typeAutomaton === "automaton" || typeAutomaton === "turing") {
            currentAutomaton.setCurrentState(q_init);
        } else if (typeAutomaton === "pushdown") {
            let nStack = [];
            window.pushSymbol(initStackSymbol, nStack);
            currentAutomaton.setInitialStackSymbol(initStackSymbol);
            currentAutomaton.setCurrentState({
                "state": q_init,
                "stack": nStack,
                "transitions": []
            });
        }

        currentTransitions = aude.toArray(
            currentAutomaton.getLastTakenTransitions()
        );

        // If the automaton start with epsilon transition, we draw the stack
        // with the modifications of the epsilon transition
        if (typeAutomaton === "pushdown") {
            redrawStack(currentTransitions);
        }

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

    if (currentTransitions) {
        let t, l, transitionsByStartState = {};

        for (i = 0, len = currentTransitions.length; i < len; ++i) {
            t = currentTransitions[i];

            if (!transitionsByStartState[t.startState]) {
                transitionsByStartState[t.startState] = [];
            }

            transitionsByStartState[t.startState].push([
                t.endState,
                t.symbol
            ]);
        }

        let newListOfExecutions = [], startState, newL;

        for (i = 0, len = listOfExecutions.length; i < len; ++i) {
            l = listOfExecutions[i];
            startState = l[l.length - 1][0];
            if (transitionsByStartState[startState]) {
                let leng = transitionsByStartState[startState].length;
                for (let j = 0; j < leng; ++j) {
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
        let resultDiv = document.createElement("div");

        AudeGUI.Results.setDOM(resultDiv);

        for (let i = 0, len = listOfExecutions.length; i < len; ++i) {
            let div = document.createElement("div");
            div.className = "execution";
            let res = "";

            for (let j = 0, leng = listOfExecutions[i].length; j < leng; ++j) {
                let s = listOfExecutions[i][j][1];

                if (j > 0) {
                    res += (
                        ": " + (
                            s === epsilon
                                ? "ε"
                                : aude.elementToString(s, automataMap)
                        ) + " → "
                    )
                }

                res += aude.elementToString(listOfExecutions[i][j][0]);
            }

            div.textContent = res;
            resultDiv.appendChild(div);
        }
    }

    if (stepNumber === -1) {
        executionTimeout = 0;
        let color = accepting ? CURRENT_FINAL_STATE_COLOR : STATE_REFUSED;
        wordDiv.firstChild.style.color = color;
        wordDiv.children[1].style.color = color;
    } else {
        if (!word[0]) { // the word is completely eaten
            stepNumber = -1;
        } else {
            ++stepNumber;
        }

        if (!executionByStep) {
            if (stepNumber && EXECUTION_STEP_TIME) {
                executionTimeout = setTimeout(
                    execute,
                    EXECUTION_STEP_TIME - (
                        (stepNumber % 2) ? 0 : 1
                    ) * EXECUTION_STEP_TIME / 2
                );
            } else {
                execute();
            }
        } else if (stepNumber % 2) {
            executionTimeout = setTimeout(execute, HAND_STEP_TIME);
        }
    }
}

function displayTape() {
    let contentPane = libD.jso2dom(
        ["div.libD-ws-colors-auto", {"style": "height: 100%"}, [
            ["table#table-tape"],
            ["p", ["hello"]]
        ]]
    );

    if (!tapeWin || !tapeWin.ws) {
        tapeWin = libD.newWin({
            show: true,
            title: _("Tape"),
            minimizable: false,
            content: contentPane,
            right: document.getElementById("results").offsetWidth + 10, // FIXME
            top: document.getElementById("toolbar").offsetHeight + 5,

        });
        tapeWin.centerX();
        tapeWin.centerY();

        updateTape();
    }
}

function updateTape() {
    if (!tapeWin || !tapeWin.ws) {
        displayTape();
        return;
    }

    // If it exists, we remove the old table content.
    if (document.getElementById("table-tape").firstChild) {
        document.getElementById("table-tape").firstChild.remove();
        document.getElementById("table-tape").firstChild.remove();
    }

    let indicesLine = [];
    let dataLine = [];
    let tape = currentAutomaton.getTape();
    let currentPos = currentAutomaton.getTapePosition();

    let tapeViewDistance = 10;
    for (let i = -tapeViewDistance; i <= tapeViewDistance; i++) {
        if (i === 0) {
            dataLine.push(["td", {"style": "background-color: green"}, tape[currentPos]])
            indicesLine.push(["td", "⇩"]);
        } else if (currentPos + i >= -1 && currentPos + i <= tape.length) {
            dataLine.push(["td", currentAutomaton.readTapeAt(currentPos + i)]);
            indicesLine.push(["td", String(currentPos + i)]);
        }
    }

    let trIndices = libD.jso2dom(["tr", indicesLine])
    let trData = libD.jso2dom(["tr", dataLine]);
    document.getElementById("table-tape").insertBefore(
        trIndices,
        null
    );
    document.getElementById("table-tape").insertBefore(
        trData,
        null
    );
}

// Display the window stack and initialise the stack with the initial stack symbol
function displayStack(initialSymbol) {
    if (determinize) {
        // If the automaton is determinized
        let cont = libD.jso2dom(
            ["div.libD-ws-colors-auto", { "style": "height:100%" }, [
                ["table#table-stack", [
                    ["tr", [
                        ["th", _("Index")],
                        ["th", _("Value")],
                    ]],
                ]],
            ]]
        );

        if (!stackWin || !stackWin.ws) {
            stackWin = libD.newWin({
                minimizable: false,
                show: true,
                title: _("Stack"),
                right: document.getElementById("results").offsetWidth + 10, // FIXME
                top: document.getElementById("toolbar").offsetHeight + 5,
                content: cont,
            })
        } else {
            // Reset the display of the stack
            stackWin.content.replaceChild(
                cont,
                stackWin.content.children[0]
            );
        }

        let i = 0;
        for (let c of initialSymbol.split("").reverse().join("")) {
            let tr = libD.jso2dom(["tr", [
                ["td", i],
                ["td", c],
            ]]);

            if (i === 0) {
                document.getElementById("table-stack").appendChild(tr);
            } else {
                document.getElementById("table-stack").insertBefore(
                    tr,
                    document.getElementById("table-stack").firstChild.nextSibling
                );
            }

            i++;
        }
    } else {
        // If the automaton is not determinized or has epsilon transition
        let cont = libD.jso2dom(
            ["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                // The table which contains all the tables
                ["table#table-tables-stack", [
                    ["tr", ["th",
                        _("State: ") + currentAutomaton.getInitialState()
                    ]],
                    ["td"]
                ]],
            ]]
        );

        if (!stackWin || !stackWin.ws) {
            stackWin = libD.newWin({
                minimizable: false,
                show: true,
                title: _("Stacks"),
                right: document.getElementById("results").offsetWidth + 10, // FIXME
                top:   document.getElementById("toolbar").offsetHeight + 5,
                content: cont,
            })
        }
        else {
            // Reset the display of the stack
            stackWin.content.replaceChild(
                cont,
                stackWin.content.children[0]
            );
        }

        let table = libD.jso2dom([
            ["table", [
                ["tr", [
                    ["th", _("Index")],
                    ["th", _("Value")],
                ]]
            ]]
        ]);

        document.getElementById("table-tables-stack").children[1].appendChild(table);

        let i = 0;
        for (let c of initialSymbol.split("").reverse().join("")) {
            let tr = libD.jso2dom(
                ["tr", [
                    ["td", (String(i))],
                    ["td", (c)],
                ]]
            );

            if (i === 0) {
                table.appendChild(tr);
            } else {
                table.insertBefore(tr, table.firstChild.nextSibling);
            }

            i++;
        }
    }
}

// After each taken transition, remove the stackSymbol and add the new stack symbol
function redrawStack(transitions) {
    if (determinize) {
        // If the automaton is determinized
        let timeExec = (
            // If the execution is by step we have a defined time to show
            // the modifications of the stack
            executionByStep
                ? 500 / transitions.length
                : EXECUTION_STEP_TIME / transitions.length
        );

        let stack = document.getElementById("table-stack");

        let compt = 0;

        // For each transition
        for (let trans of transitions) {
            // Add the lines to remove in red
            setTimeout(
                redLines.bind(null, trans.stackSymbol),
                timeExec * compt
            );

            // Remove the lines in red
            setTimeout(
                removeSym.bind(null, trans.stackSymbol),
                (timeExec / 2) + (timeExec * compt)
            );

            // Add the new lines and color them in green
            setTimeout(
                addSym.bind(null, trans.newStackSymbol),
                (timeExec / 2) + (timeExec * compt)
            );

            // Remove the green color of the new lines
            setTimeout(
                removeGreen.bind(null, trans.newStackSymbol),
                (timeExec) + (timeExec * compt)
            );

            function redLines(stackSymbol) {
                let i = 1;
                if (stackSymbol !== epsilon && stackSymbol !== "ε") {
                    for (let c of stackSymbol) {
                        // Draw the line to remove in red
                        (stack.children[i] as any).style.backgroundColor = "red";
                        i++;
                    }
                }
            }

            function removeSym(stackSym) {
                if (stackSym !== epsilon && stackSym !== "ε") {
                    for (let c of stackSym) {
                        stack.removeChild(stack.children[1]);
                    }
                }
            }

            function addSym(newStackSymbol) {
                // Add the new stack symbol
                for (let c of newStackSymbol.split("").reverse().join("")) {
                    if (c !== epsilon && c !== "ε") {
                        let line = libD.jso2dom([
                            ["tr", {"style": "background-color:#5cd65c" }, [
                                // Draw the added line in green
                                ["td", stack.childElementCount - 1],
                                ["td", c],
                            ]],
                        ]);

                        if (stack.childElementCount === 1) {
                            // If there nothing in the stack
                            stack.appendChild(line)
                        } else {
                            stack.insertBefore(line, stack.children[1]);
                        }
                    }
                }

                stackWin.resize();
            }

            function removeGreen(newStackSymbol) {
                let j = 1;
                for (let c of newStackSymbol) {
                    if (c !== epsilon && c !== "ε") {
                        (stack.children[j] as any).style.backgroundColor = "inherit";
                        j++;
                    }
                }
            }

            compt++;
        }
    } else {
        // If the automaton is not determinized or has epsilon transition
        let cont = libD.jso2dom(
            ["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                ["table#table-tables-stack", [
                    // The table which contains all the tables
                    ["tr"],
                    ["tr"]
                ]],
            ]]
        );

        // Recreate all the tables
        stackWin.content.replaceChild(cont, stackWin.content.children[0]);

        let table = document.getElementById("table-tables-stack");

        // For each stack
        let tabState = [];

        for (let cs of currentAutomaton.getCurrentStatesStacks()) {
            if (tabState.indexOf(cs.state) < 0) {
                // If it's the first time we encounter the state

                // Array of all the current state
                tabState.push(cs.state);

                let thState = libD.jso2dom([
                    ["th", _("State: ") + cs.state]
                ]);

                table.children[0].appendChild(thState);
                table.children[1].appendChild(document.createElement("td"));
            }

            let newTable = libD.jso2dom([
                ["span", {"style": "display:inline-block; margin-right:5px"}, [
                    ["table", [
                        ["tr", [
                            ["th", _("Index")],
                            ["th", _("Value")],
                        ]],
                    ]],
                ]]
            ]);

            if (cs.stack.length === currentAutomaton.getInitialStackSymbol().length) {
                newTable.style.backgroundColor = "#47d147";
            }

            // When we click on a table it shows the list of transitions
            newTable.addEventListener(
                "click",
                showTransitions.bind(null, cs.transitions)
            );

            function showTransitions(transi) {
                let str = document.createElement("div");

                for (let t of transi) {
                    let valueT = document.createElement("div");

                    valueT.addEventListener(
                        "click",
                        transitionColor.bind(null, t)
                    );

                    valueT.textContent = t.toString()
                    str.appendChild(valueT);
                }

                AudeGUI.Results.set(str);
            }

            function transitionColor(t) {
                AudeGUI.mainDesigner.transitionPulseColor(
                    index,
                    t.startState,
                    t.symbol,
                    t.endState,
                    "red",
                    3000
                );
            }

            table.children[1].children[tabState.indexOf(cs.state)].appendChild(newTable);

            let i = 0;

            for (let c of cs.stack) {
                let tr = libD.jso2dom([
                    ["tr", [
                        ["td", i],
                        ["td", c],
                    ]]
                ]);

                if (i === 0) {
                    newTable.firstChild.appendChild(tr);
                } else {
                    newTable.firstChild.insertBefore(
                        tr,
                        newTable.firstChild.firstChild.nextSibling
                    );
                }

                i++;
            }
        }

        // Hide the table when clicking on the th
        let j = 0;
        for (let th of table.children[0].children) {
            // The list of th
            th.addEventListener("click", hideTab.bind(null, table, j));
            j++;
        }

        function hideTab(table, j) {
            for (let span of table.children[1].children[j].children) {
                span.style.display = (
                    getComputedStyle(span).display == "none"
                        ? "inline-block"
                        : "none"
                );
            }
        }

        stackWin.resize();
    }
}

window.AudeGUI.WordExecution = WordExecution;
})();
