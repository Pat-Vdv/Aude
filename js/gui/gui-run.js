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

/* globals libD, audescript, getFile, babel */

(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var loadingProgNot = null;
    var curAlgo = new Object; //.name contains the name of the current
    var algoAutomatonL = null;
    var algoAutomatonR = null;
    var algoRE = null;
    var algoGrammar = null;
    var algoOther = null;
    var algoName = null;

    var modules = [];
    var loadedModule = {};

    function audescript2js(code, moduleName, fileName, data) {
        var res = audescript.toJS(code, moduleName, fileName);
        data.includes = res.neededModules;
        return (
            "(function (run, get_automaton, get_automata, get_mealy, get_moore, get_pushdown_automaton, currentAutomaton) {" +
            res.code + "})"
        );
    }

    AudeGUI.Runtime = {
        load: function () {
            curAlgo.name="id";
            algoName = document.getElementById("predef-algos-name");
            algoAutomatonL = document.getElementById("container-algo-automata-left");
            algoAutomatonR = document.getElementById("container-algo-automata-right");
            algoRE = document.getElementById("container-algo-re");
            algoGrammar = document.getElementById("container-algo-gammar");
            algoOther = document.getElementById("container-algo-other");
        },

        run: function (fun, g, f) {
            if (fun === AudeGUI.Runtime.get_automata) {
                AudeGUI.Runtime.get_automata(g, function () {
                    AudeGUI.Results.set(f.apply(this, arguments));
                });
            } else {
                AudeGUI.Results.set(fun.apply(window, [].slice.call(arguments, 1)));
            }
        },

        addAlgo: function (algo) {
            var line = algo.split("/");
            var fname = line[0].trim();
            var descr = line[1].trim();
            var type = line[2].trim();
            var button = document.createElement("button");
            button.className = "cell-algo";
            button.value = fname.replace(/\.ajs$/, "");
            button.textContent = _(descr);
            button.onclick = function (e) {
                curAlgo.name = e.target.value;
                algoName.innerHTML = _(descr); //Change the name of the selected algo
                document.getElementById("container-algos").style.display="none"; //Hide the list of algos
                document.getElementById("up-select-algo").style.display = "none";
                document.getElementById("down-select-algo").style.display = "inline";
            }
            if (type ==="automaton") {
                curAlgo.type='automaton';
                if (algoAutomatonL.childElementCount <= algoAutomatonR.childElementCount)
                    algoAutomatonL.appendChild(button);
                else
                    algoAutomatonR.appendChild(button);
            }
            else if (type ==="re") {
                curAlgo.type = "re";
                algoRE.appendChild(button);
            }
            else if (type ==="grammar") {
                curAlgo.type = "grammar";
                algoGrammar.appendChild(button);
            }
            else if (type ==="other") {
                curAlgo.type = "automaton";
                algoOther.appendChild(button);
            }
            else {
                console.log  ("Type algo not recognized")
            }

        },

        callWithList: function (count, callback) {
            var automata = [];

            for (var k = 0; k < count; ++k) {
                automata.push(AudeGUI.Runtime.get_automaton(AudeGUI.AutomataList.getIndex(k)));
            }

            /*jshint validthis: true */
            callback.apply(this, automata);
        },

        get_mealy: function (i) {
            // Automaton → Moore
            let A = AudeGUI.Runtime.get_automaton(i, true);

            if (isNaN(i)) {
                return null;
            }

            var M = new Mealy;

            // defining the initial state for M
            M.setInitialState(aude.getValue(A.getInitialState(), automataMap));

            var f = A.getTransitionFunction();

            f().forEach(function (startState) {
                f(startState).forEach(function (symbol) {
                    f(startState, symbol).forEach(function (endState) {
                        // we split the symbol (ex. "2/a")
                        // into the input and the output (ex. input = "2", output="a")

                        let nStartState = aude.getValue(startState, automataMap);
                        let nEndState = aude.getValue(endState, automataMap);

                        var trans  = symbol.split("/");

                        if (trans.length !== 2) {
                            throw new Error(_(libD.format("Transition {0} is missing an output symbol or has too many '/'.", symbol)))
                        }

                        var input  = aude.getValue(trans[0], automataMap);
                        var output = aude.getValue(trans[1], automataMap);

                       M.addTransition(nStartState, input, nEndState);
                       M.setOutput(nStartState, input, output);
                    });
                });
            });

            return M;
        },

        get_moore: function (i) {
            // Automaton → Moore
            let A = AudeGUI.Runtime.get_automaton(i, true);

            if (isNaN(i)) {
                return null;
            }

            var M = new Moore();

            M.setInitialState(aude.getValue(A.getInitialState().split("/")[0], automataMap));

            var trans = A.getTransitionFunction();

            A.getStates().forEach(
                function (s) {
                    // separating the actual state from its output
                    var sp = s.split("/");
                    if (sp.length !== 2) {
                        throw new Error(_(libD.format("State {0} is missing an output symbol or has too many '/'.", s)))
                    }

                    var state  = aude.getValue(sp[0], automataMap);
                    var output = aude.getValue(sp[1], automataMap);
                    M.setOutput(state, output);

                    trans(s).forEach(
                        function (symbol) {
                            trans(s, symbol).forEach(
                                function (endState) {
                                    M.addTransition(state, symbol, aude.getValue(endState.split("/")[0], automataMap));
                                }
                            )
                        }
                    );
                }
            );

            return M;
        },

        get_automaton: function (i, statesAsString) {
            if (isNaN(i)) {
                return null;
            }

            var A = null;

            try {
                A = AudeGUI.mainDesigner.getAutomaton(i, statesAsString);
            } catch (e) {
                console.error(e);
                throw new Error(libD.format(_("get_automaton: automaton n°{0} could not be understood."), JSON.stringify(i)));
            }

            if (!A) {
                throw new Error(libD.format(_("get_automaton: automaton n°{0} doesn’t exist or doesn’t have an initial state."), JSON.stringify(i)));
            }

            return A;
        },
            // Automaton → Pushdown automaton
        get_pushdown_automaton: function (i,statesAsString) {
            if (isNaN(i)) {
                return null;
            }

            var A = null;

            if (isNaN(i)) {
                return null;
            }
            var A = AudeGUI.Runtime.get_automaton(i, true);

            var P = new Pushdown();

            P.setInitialState(A.getInitialState()); //Initialise the initial state

            P.setInitialStackSymbol("Z"); //Initialise the stack symbol

            for (var s of A.getFinalStates()) //Initialise the final states
                P.setFinalState(s);

            //Initialise transitions
            var trans = A.getTransitions();
            var tabTransition = [];
            var c = "";
            var i=0;
            //For each transition
            try {
                for (var t of trans) {
                    while(t.symbol[i]!=";" && i<t.symbol.length) {
                        c += t.symbol[i];
                        i++;
                    }
                    i++;
                    tabTransition.push(c.trim()); //Symbol of transition
                    c = "";
                    while(t.symbol[i]!="/" && i<t.symbol.length) {
                        c += t.symbol[i];
                        i++;
                    }
                    i++;
                    tabTransition.push(c.trim()); //Symbol of stack to replace
                    c = "";
                    while(String(t.symbol[i])!="\0" && i<t.symbol.length) {
                        c += t.symbol[i];
                        i++;
                    }
                    tabTransition.push(c.trim()); //The symbols to push to the stack


                    
                    P.addTransition(t.startState,tabTransition[0],tabTransition[1],t.endState,tabTransition[2]);
                    tabTransition = [];
                    c = "";
                    i = 0;

                }
            } catch(e) {
                console.error(e);
                throw new Error(libD.format(_("get_pushdown_automaton: automaton not understood.")));
            }
            return P;

        },

        get_automata: function (count, callback) {
            if (AudeGUI.AutomataList.length() < count) {
                AudeGUI.AutomataList.show(count, callback);
            } else {
                AudeGUI.Runtime.callWithList(count, callback);
            }
        },

        runProgram: function (code, moduleName) {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            AudeGUI.Runtime.runProgramCode(
                code,
                moduleName || "<program>",
                AudeGUI.Runtime.run,
                AudeGUI.Runtime.get_automaton,
                AudeGUI.Runtime.get_automata,
                AudeGUI.Runtime.get_mealy,
                AudeGUI.Runtime.get_moore,
                AudeGUI.Runtime.get_pushdown_automaton
            );
        },

        launchPredefAlgo: function () {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            if (curAlgo.name === "id") {
                AudeGUI.Results.set(AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex));
                return;
            }

            if (modules[curAlgo.name]) {
                AudeGUI.Runtime.runProgram(modules[curAlgo.name], curAlgo.name);
            } else {
                loadingProgNot = libD.notify({
                    type: "info",
                    content: (_("Loading program, please wait...")),
                    closable: false,
                    delay: 500
                });

                AudeGUI.Runtime.loadModule(curAlgo.name, AudeGUI.Runtime.launchPredefAlgo);
            }
        },

        loadIncludes: function (includes, callback) {
            for (var i = 0; i < includes.length; i++) {
                if (!modules[includes[i]]) {
                    AudeGUI.Runtime.loadModule(
                        includes[i],
                        AudeGUI.Runtime.loadIncludes.bind(null, includes, callback)
                    );
                    return;
                }

                if (!audescript.m(includes[i])) {
                    AudeGUI.Runtime.loadLibrary(modules[includes[i]], includes[i]);
                }
            }

            if (callback) {
                callback();
            }
        },

        loadLibrary: function (code, moduleName) {
            AudeGUI.Runtime.runProgramCode(
                code,
                moduleName || "<program>",
                libD.none,
                libD.none,
                libD.none,
                libD.none,
                libD.none
            );
        },

        replaceStackLine: function (stackLine) {
            return stackLine.replace(/eval at .*\(.*\),[\s]+/, "").replace(/@(file|https?|ftps?|sftp):\/\/.+> eval:/, " ");
        },

        cleanStack: function (stack) {
            var stackLines = stack.split("\n");
            var res = "";
    //         var oldRes = "";
            for (var i = 0; i < stackLines.length; i++) {
                if (i === 0 && stackLines[0].match(/^[a-zA-Z]*Error:/)) {
                    continue;
                }

                if (stackLines[i].match(/^[\s]*at run/) || stackLines[i].match(/^run(ProgramCode)?@/)) {
                    break;
                }

                var line = AudeGUI.Runtime.replaceStackLine(stackLines[i]);
                if (line.match(/^\s*\d+:\d+\s*$/)) {
                    break;
                }
    //             oldRes = res;
                res += (res ? "\n" : "") + line;
            }

    //         return oldRes;
            return res;
        },

        runProgramCode: function (f, moduleName, run, get_automaton, get_automata, get_mealy, get_moore,get_pushdown_automaton) {
            if (loadingProgNot) {
                loadingProgNot.close(true);
                loadingProgNot = null;
            }

            try {
                var res = f(
                    run,
                    get_automaton,
                    get_automata,
                    get_mealy,
                    get_moore,
                    get_pushdown_automaton,
                    AudeGUI.mainDesigner.currentIndex,
                );

                if (typeof res !== "undefined") {
                    AudeGUI.Results.set(res);
                }
            } catch (e) {
                libD.notify({
                    type: "error",
                    title: libD.format(_("Error executing {0}"), moduleName),
                    content: libD.jso2dom(
                        ["div", {style:"white-space:pre-wrap"},
                            e.toString() + "\n" + AudeGUI.Runtime.cleanStack(e.stack)
                        ]
                    )
                });
                throw e;
            }
        },

        loadAudescriptCode: function (moduleName, audescriptCode, callback) {
            var data = {};
            var includes = null;
            var code = null;

            try {
                code = eval(audescript2js(audescriptCode, moduleName, moduleName + ".ajs", data));

                includes = data.includes;
            } catch (e) {
                AudeGUI.notify(
                    libD.format(
                        _("Parse error (module {0})"),
                        moduleName
                    ),
                    e.toString(),
                    "error"
                );

                if (loadingProgNot) {
                    loadingProgNot.close(true);
                    loadingProgNot = null;
                }

                throw e;
            }

            AudeGUI.Runtime.loadIncludes(
                includes,
                function () {
                    if (moduleName) {
                        modules[moduleName] = code;
                    }

                    callback(code);
                }
            );
        },

        loadModule: function (moduleName, callback) {
            if (modules[curAlgo.name]) {
                if (callback) {
                    callback();
                }
                return;
            }

            if (loadedModule[moduleName]) {
                loadedModule[moduleName].push(callback);
                return;
            }

            loadedModule[moduleName] = [callback];

            getFile(
                "algos/" + moduleName + ".ajs?" + Date.now(),
                function (f) {
                    AudeGUI.Runtime.loadAudescriptCode(moduleName, f, function () {
                        var m = loadedModule[moduleName];
                        while (m.length) {
                            (m.pop())();
                        }
                    });
                },
                function (message, status) {
                    var msg = null;

                    if (message === "status") {
                        msg = libD.format(
                            _("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"),
                            status
                        );
                    }

                    if (message === "send") {
                        msg = _(
                            "This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information"
                        );
                    }

                    AudeGUI.notify(
                        libD.format(
                            _("Unable to load module {0}"),
                            moduleName
                        ),
                        msg,
                        "error"
                    );
                }
            );
        },

        loadAS: function (code) {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            loadingProgNot = libD.notify({
                type: "info",
                content: (_("Loading program, please wait...")),
                closable: false,
                delay: 1000
            });

            AudeGUI.Runtime.loadAudescriptCode(null, code, AudeGUI.Runtime.runProgram);
        }
    };

    //FIXME
    pkg.heap = function (a) {
        Object.defineProperty(a, "top", {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function () {
                return a[a.length - 1];
            }
        });

        return a;
    };
}(window));
