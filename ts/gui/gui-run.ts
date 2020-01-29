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

(function () {
    "use strict";

    let AudeGUI = window.AudeGUI;
    let _ = AudeGUI.l10n;

    let loadingProgNot = null;

    //.name contains the name of the current
    let curAlgo: any = {};

    let algoAutomatonL = null;
    let algoAutomatonR = null;
    let algoRE = null;
    let algoGrammar = null;
    let algoOther = null;
    let algoName = null;

    let modules = [];
    let loadedModule = {};

    function audescript2js(code, moduleName, fileName, data) {
        let res = audescript.toJS(code, moduleName, fileName);
        data.includes = res.neededModules;
        return (
            "(function (run, get_automaton, get_automata, get_mealy, get_moore, get_pushdown_automaton, currentAutomaton) {" +
            res.code + "})"
        );
    }

    class Runtime {
        static load(): void {
            curAlgo.name = "id";
            algoName = document.getElementById("predef-algos-name");
            algoAutomatonL = document.getElementById("container-algo-automata-left");
            algoAutomatonR = document.getElementById("container-algo-automata-right");
            algoRE = document.getElementById("container-algo-re");
            algoGrammar = document.getElementById("container-algo-gammar");
            algoOther = document.getElementById("container-algo-other");
        }

        static run(fun: any, g: any, f: any): void {
            if (fun === Runtime.get_automata) {
                Runtime.get_automata(g, function () {
                    AudeGUI.Results.set(f.apply(this, arguments));
                });
            } else {
                AudeGUI.Results.set(fun.apply(window, [].slice.call(arguments, 1)));
            }
        }

        static addAlgo(algo: string): void {
            let line = algo.split("/");
            let fname = line[0].trim();
            let descr = line[1].trim();
            let resultType = line[2].trim();
            let button = document.createElement("button");
            button.className = "cell-algo";
            button.value = fname.replace(/\.ajs$/, "");
            button.textContent = _(descr);

            button.onclick = function (e) {
                curAlgo.name = (e.target as HTMLButtonElement).value;

                //Change the name of the selected algo
                algoName.textContent = _(descr);
                Runtime.launchPredefAlgo();
            }

            switch (resultType) {
                case "automaton":
                    curAlgo.type='automaton';
                    if (algoAutomatonL.childElementCount <= algoAutomatonR.childElementCount) {
                        algoAutomatonL.appendChild(button);
                    } else {
                        algoAutomatonR.appendChild(button);
                    }
                    break;

                case "re":
                    curAlgo.type = "re";
                    algoRE.appendChild(button);
                    break;

                case "grammar":
                    curAlgo.type = "grammar";
                    algoGrammar.appendChild(button);
                    break;

                case "other":
                    curAlgo.type = "automaton";
                    algoOther.appendChild(button);
                    break;

                default:
                    console.log("Algo type not recognized");
            }
        }

        static callWithList(count: number, callback: (automata : Automaton[]) => any): void {
            let automata : Automaton[] = [];

            for (let k = 0; k < count; ++k) {
                automata.push(Runtime.get_automaton(AudeGUI.AutomataList.getIndex(k)));
            }

            /*jshint validthis: true */
            callback.apply(this, automata);
        }

        static get_mealy(i: number): Mealy {
            // Automaton → Moore
            let A = Runtime.get_automaton(i, true);

            if (isNaN(i)) {
                return null;
            }

            let M = new Mealy();

            // defining the initial state for M
            M.setInitialState(aude.getValue(A.getInitialState(), automataMap));

            let f = A.getTransitionFunction();

            f().forEach(function (startState) {
                f(startState).forEach(function (symbol) {
                    f(startState, symbol).forEach(function (endState) {
                        // we split the symbol (ex. "2/a")
                        // into the input and the output (ex. input = "2", output="a")

                        let nStartState = aude.getValue(startState, automataMap);
                        let nEndState = aude.getValue(endState, automataMap);

                        let trans  = symbol.split("/");

                        if (trans.length !== 2) {
                            throw new Error(_(libD.format("Transition {0} is missing an output symbol or has too many '/'.", symbol)))
                        }

                        let input  = aude.getValue(trans[0], automataMap);
                        let output = aude.getValue(trans[1], automataMap);

                       M.addTransition(nStartState, input, nEndState);
                       M.setOutput(nStartState, input, output);
                    });
                });
            });

            return M;
        }

        static get_moore(i: number): Moore {
            // Automaton → Moore
            let A = Runtime.get_automaton(i, true);

            if (isNaN(i)) {
                return null;
            }

            let M = new Moore();

            M.setInitialState(aude.getValue(A.getInitialState().split("/")[0], automataMap));

            let trans = A.getTransitionFunction();

            A.getStates().forEach(
                function (s) {
                    // separating the actual state from its output
                    let sp = s.split("/");
                    if (sp.length !== 2) {
                        throw new Error(_(libD.format("State {0} is missing an output symbol or has too many '/'.", s)))
                    }

                    let state  = aude.getValue(sp[0], automataMap);
                    let output = aude.getValue(sp[1], automataMap);
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
        }

        static get_automaton(i: number, statesAsString?: boolean): Automaton {
            if (isNaN(i)) {
                return null;
            }

            let A = null;

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
        }

        // Automaton → Pushdown automaton
        // FIXME underscores
        static get_pushdown_automaton(i: number, statesAsString: boolean): Pushdown {
            if (isNaN(i)) {
                return null;
            }

            let A = Runtime.get_automaton(i, true);

            let P = new Pushdown();

            P.setInitialState(A.getInitialState());

            for (let s of A.getFinalStates()) {
                P.setFinalState(s);
            }

            let trans = A.getTransitions();
            let tabTransition = [];
            let c = "";

            let j = 0;

            // For each transition
            try {
                for (let t of trans) {
                    while(t.symbol[j] != ";" && j < t.symbol.length) {
                        c += t.symbol[j];
                        j++;
                    }

                    j++;

                    if (c.trim() === "ε") {
                        tabTransition.push(epsilon);
                    } else {
                        // Transition symbol
                        tabTransition.push(c.trim());
                    }

                    c = "";

                    while (t.symbol[j] !== "/" && j < t.symbol.length) {
                        c += t.symbol[j];
                        j++;
                    }

                    j++;

                    tabTransition.push(
                        (c.trim()==="ε")
                            ? epsilon
                            : c.trim() // Symbol of stack to replace
                    );

                    c = "";
                    while (String(t.symbol[j]) !== "\0" && j < t.symbol.length) {
                        c += t.symbol[j];
                        j++;
                    }

                    //The symbols to push to the stack
                    tabTransition.push(c.trim());

                    //If the transition is composed of only ε
                    if (t.symbol === epsilon) {
                        P.addTransition(
                            t.startState,
                            epsilon,
                            tabTransition[1],
                            t.endState,
                            tabTransition[2]
                        );
                    } else {
                        P.addTransition(
                            t.startState,
                            tabTransition[0],
                            tabTransition[1],
                            t.endState,
                            tabTransition[2]
                        );
                    }

                    tabTransition = [];
                    c = "";
                    j = 0;
                }
            } catch(e) {
                console.error(e);
                throw new Error(
                    libD.format(
                        _("get_pushdown_automaton: automaton not understood.")
                    )
                );
            }

            return P;
        }

        static get_turing_machine(i: number, statesAsString: boolean): TuringMachine {
            if (isNaN(i)) {
                return null;
            }

            let A = Runtime.get_automaton(i, true);

            let T = new TuringMachine();

            T.setInitialState(A.getInitialState());

            // Adding final and non-final states.
            A.getStates().forEach(function (st) {
                T.addState(st, false);
            });
            A.getFinalStates().forEach(function (st) {
                T.addState(st, true);
            });

            // Parsing and adding transitions.
            A.getTransitions().forEach(function (tr) {
                let splitSlash = tr.symbol.split("/");

                if (splitSlash.length != 2) {
                    throw new Error(
                        libD.format(
                            _("get_turing_machine: turing machine not recognized.")
                        )
                    );
                }
                let startSymb = splitSlash[0].trim();
                let splitSemicolon = splitSlash[1].split(";");

                if (splitSemicolon.length != 2) {
                    throw new Error(
                        libD.format(
                            _("get_turing_machine: turing machine not recognized.")
                        )
                    );
                }

                let endSymb = splitSemicolon[0].trim();
                let endMove = splitSemicolon[1].trim();

                if (tr.symbol === epsilon) {
                    throw new Error(
                        libD.format(
                            _("get_turing_machine: epsilon not allowed in turing machine.")
                        )
                    );
                }

                T.addTransition(
                    tr.startState,
                    startSymb,
                    tr.endState,
                    endSymb,
                    endMove
                );
            });

            return T;
        }

        static get_automata(count: number, callback: any): void {
            if (AudeGUI.AutomataList.length() < count) {
                AudeGUI.AutomataList.show(count, callback);
            } else {
                Runtime.callWithList(count, callback);
            }
        }

        static runProgram(code: any, moduleName?: string): void {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            Runtime.runProgramCode(
                code,
                moduleName || "<program>",
                Runtime.run,
                Runtime.get_automaton,
                Runtime.get_automata,
                Runtime.get_mealy,
                Runtime.get_moore,
                Runtime.get_pushdown_automaton
            );
        }

        static launchPredefAlgo(): void {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            if (curAlgo.name === "id") {
                AudeGUI.Results.set(AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex));
                return;
            }

            if (modules[curAlgo.name]) {
                Runtime.runProgram(modules[curAlgo.name], curAlgo.name);
            } else {
                loadingProgNot = libD.notify({
                    type: "info",
                    content: (_("Loading program, please wait...")),
                    closable: false,
                    delay: 500
                });

                Runtime.loadModule(curAlgo.name, Runtime.launchPredefAlgo);
            }
        }

        static loadIncludes(includes: string[], callback: () => any):void {
            for (let i = 0; i < includes.length; i++) {
                if (!modules[includes[i]]) {
                    Runtime.loadModule(
                        includes[i],
                        Runtime.loadIncludes.bind(null, includes, callback)
                    );
                    return;
                }

                if (!audescript.m(includes[i])) {
                    Runtime.loadLibrary(modules[includes[i]], includes[i]);
                }
            }

            if (callback) {
                callback();
            }
        }

        static loadLibrary(code: any, moduleName: string):void {
            Runtime.runProgramCode(
                code,
                moduleName || "<program>",
                libD.none,
                libD.none,
                libD.none,
                libD.none,
                libD.none,
                libD.none
            );
        }

        static replaceStackLine(stackLine: string):string {
            return stackLine.replace(/eval at .*\(.*\),[\s]+/, "").replace(/@(file|https?|ftps?|sftp):\/\/.+> eval:/, " ");
        }

        static cleanStack(stack: string):string {
            let stackLines = stack.split("\n");
            let res = "";
    //         let oldRes = "";
            for (let i = 0; i < stackLines.length; i++) {
                if (i === 0 && stackLines[0].match(/^[a-zA-Z]*Error:/)) {
                    continue;
                }

                if (stackLines[i].match(/^[\s]*at run/) || stackLines[i].match(/^run(ProgramCode)?@/)) {
                    break;
                }

                let line = Runtime.replaceStackLine(stackLines[i]);
                if (line.match(/^\s*\d+:\d+\s*$/)) {
                    break;
                }
    //             oldRes = res;
                res += (res ? "\n" : "") + line;
            }

    //         return oldRes;
            return res;
        }

        static runProgramCode(
                f: (runFun: any, getAutomatonFun: any, getAutomataFun: any, getMealyFun: any, getMooreFun: any, getPushdownFun: any, index: number) => any,
                moduleName: string,
                run: any,
                get_automaton: any,
                get_automata: any,
                get_mealy: any,
                get_moore: any,
                get_pushdown_automaton: any
        ): void {
            if (loadingProgNot) {
                loadingProgNot.close(true);
                loadingProgNot = null;
            }

            try {
                let res = f(
                    run,
                    get_automaton,
                    get_automata,
                    get_mealy,
                    get_moore,
                    get_pushdown_automaton,
                    AudeGUI.mainDesigner.currentIndex
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
                            e.toString() + "\n" + Runtime.cleanStack(e.stack)
                        ]
                    )
                });
                throw e;
            }
        }

        static loadAudescriptCode(moduleName: string, audescriptCode: string, callback: (code: string) => any): void {
            let data = {};
            let includes = null;
            let code = null;

            try {
                code = eval(audescript2js(audescriptCode, moduleName, moduleName + ".ajs", data));

                includes = (data as any).includes;
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

            Runtime.loadIncludes(
                includes,
                function () {
                    if (moduleName) {
                        modules[moduleName] = code;
                    }

                    callback(code);
                }
            );
        }

        static loadModule(moduleName: string, callback: () => any) {
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

            FileIO.getFile(
                "algos/" + moduleName + ".ajs?" + Date.now(),
                function (f) {
                    Runtime.loadAudescriptCode(moduleName, f, function () {
                        let m = loadedModule[moduleName];
                        while (m.length) {
                            (m.pop())();
                        }
                    });
                },
                function (message, status) {
                    let msg = null;

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
        }

        static loadAS(code: string): void {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            loadingProgNot = libD.notify({
                type: "info",
                content: (_("Loading program, please wait...")),
                closable: false,
                delay: 1000
            });

            Runtime.loadAudescriptCode(null, code, Runtime.runProgram);
        }
    };

    AudeGUI.Runtime = Runtime;
})();
