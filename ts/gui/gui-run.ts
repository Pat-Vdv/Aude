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

namespace AudeGUI.Runtime {
    const _ = AudeGUI.l10n;

    let loadingProgNot = null;

    //.name contains the name of the current
    const curAlgo: any = {};

    let algoAutomatonL = null;
    let algoAutomatonR = null;
    let algoRE = null;
    let algoGrammar = null;
    let algoOther = null;
    let algoName = null;

    const modules = [];
    const loadedModule = {};

    function audescript2js(code, moduleName, fileName, data) {
        const res = audescript.toJS(code, moduleName, fileName);
        data.includes = res.neededModules;
        return (
            "(function (run, get_automaton, get_automata, get_mealy, get_moore, get_pushdown_automaton, currentAutomaton) {" +
            res.code + "})"
        );
    }

    export function load(): void {
        curAlgo.name = "id";
        algoName = document.getElementById("predef-algos-name");
        algoAutomatonL = document.getElementById("container-algo-automata-left");
        algoAutomatonR = document.getElementById("container-algo-automata-right");
        algoRE = document.getElementById("container-algo-re");
        algoGrammar = document.getElementById("container-algo-gammar");
        algoOther = document.getElementById("container-algo-other");
    }

    export function run(fun: any, g: any, f: any): void {
        if (fun === Runtime.get_automata) {
            Runtime.get_automata(g, function () {
                AudeGUI.Results.set(f.apply(this, arguments));
            });
        } else {
            AudeGUI.Results.set(fun.apply(window, [].slice.call(arguments, 1)));
        }
    }

    export function addAlgo(algo: string): void {
        const line = algo.split("/");
        const fname = line[0].trim();
        const descr = line[1].trim();
        const resultType = line[2].trim();
        const button = document.createElement("button");
        button.className = "cell-algo";
        button.value = fname.replace(/\.ajs$/, "");
        button.textContent = _(descr);

        button.onclick = (e: MouseEvent) => {
            curAlgo.name = (e.target as HTMLButtonElement).value;

            //Change the name of the selected algo
            algoName.textContent = _(descr);
            Runtime.launchPredefAlgo();
        };

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

    export function callWithList(count: number, callback: (automata : Automaton[]) => any): void {
        const automata : Automaton[] = [];

        for (let k = 0; k < count; ++k) {
            automata.push(AudeGUI.AutomataList.getIndex(k));
        }

        callback.apply(this, automata);
    }

    export function get_mealy(i: number): Mealy {
        // Automaton → Moore
        const A = Runtime.get_automaton(i, true);

        if (isNaN(i)) {
            return null;
        }

        const M = new Mealy();

        // defining the initial state for M
        M.setInitialState(aude.getValue(A.getInitialState(), automataMap));

        const f = A.getTransitionFunction();

        for (const startState of f()) {
            for (const symbol of f(startState)) {
                for (const endState of f(startState, symbol)) {
                    // we split the symbol (ex. "2/a")
                    // into the input and the output (ex. input = "2", output="a")

                    const nStartState = aude.getValue(startState, automataMap);
                    const nEndState = aude.getValue(endState, automataMap);

                    const trans  = symbol.split("/");

                    if (trans.length !== 2) {
                        throw new Error(_(libD.format("Transition {0} is missing an output symbol or has too many '/'.", symbol)));
                    }

                    const input  = aude.getValue(trans[0], automataMap);
                    const output = aude.getValue(trans[1], automataMap);

                    M.addTransition(nStartState, input, nEndState);
                    M.setOutput(nStartState, input, output);
                }
            }
        }

        return M;
    }

    export function get_moore(i: number): Moore {
        // Automaton → Moore
        const A = Runtime.get_automaton(i, true);

        if (isNaN(i)) {
            return null;
        }

        const M = new Moore();

        M.setInitialState(aude.getValue(A.getInitialState().split("/")[0], automataMap));

        const trans = A.getTransitionFunction();

        for (const s of A.getStates()) {
            // separating the actual state from its output
            const sp = s.split("/");
            if (sp.length !== 2) {
                throw new Error(_(libD.format("State {0} is missing an output symbol or has too many '/'.", s)));
            }

            const state  = aude.getValue(sp[0], automataMap);
            const output = aude.getValue(sp[1], automataMap);
            M.setOutput(state, output);

            for (const symbol of trans(s)) {
                for (const endState of trans(s, symbol)) {
                    M.addTransition(state, symbol, aude.getValue(endState.split("/")[0], automataMap));
                }
            }
        }

        return M;
    }

    export function get_automaton(i: number, statesAsString?: boolean): Automaton {
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
    export function get_pushdown_automaton(i: number, statesAsString?: boolean): Pushdown {
        if (isNaN(i)) {
            return null;
        }

        const A = Runtime.get_automaton(i, true);

        const P = new Pushdown();

        P.setInitialState(A.getInitialState());

        for (const s of A.getFinalStates()) {
            P.setFinalState(s);
        }

        const trans = A.getTransitions();
        let tabTransition = [];
        let c = "";

        let j = 0;

        // For each transition
        try {
            for (const t of trans) {
                while(t.symbol[j] !== ";" && j < t.symbol.length) {
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

    export function get_turing_machine(i: number, statesAsString?: boolean): TuringMachine {
        if (isNaN(i)) {
            return null;
        }

        const A = Runtime.get_automaton(i, true);

        const T = new TuringMachine();

        T.setInitialState(A.getInitialState());

        // Adding final and non-final states.
        for (const state of A.getStates()) {
            T.addState(state, false);
        }

        for (const state of A.getFinalStates()) {
            T.addState(state, true);
        }

        // Parsing and adding transitions.
        for (const transition of A.getTransitions()) {
            const splitSlash = transition.symbol.split("/");

            if (splitSlash.length !== 2) {
                throw new Error(
                    libD.format(
                        _("get_turing_machine: turing machine not recognized.")
                    )
                );
            }
            const startSymbol = splitSlash[0].trim();
            const splitSemicolon = splitSlash[1].split(";");

            if (splitSemicolon.length !== 2) {
                throw new Error(
                    libD.format(
                        _("get_turing_machine: turing machine not recognized.")
                    )
                );
            }

            const endSymbol = splitSemicolon[0].trim();
            const endMove = splitSemicolon[1].trim();

            if (transition.symbol === epsilon) {
                throw new Error(
                    libD.format(
                        _("get_turing_machine: epsilon not allowed in turing machine.")
                    )
                );
            }

            T.addTransition(
                transition.startState,
                startSymbol,
                transition.endState,
                endSymbol,
                endMove
            );
        }

        return T;
    }

    export function get_automata(count: number, callback: any): void {
        if (AudeGUI.AutomataList.length() < count) {
            AudeGUI.AutomataList.show(count, callback);
        } else {
            Runtime.callWithList(count, callback);
        }
    }

    export function runProgram(code: any, moduleName?: string): void {
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

    export function launchPredefAlgo(): void {
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

    export function loadIncludes(includes: string[], callback: () => any):void {
        for (const include of includes) {
            if (!modules[include]) {
                Runtime.loadModule(
                    include,
                    Runtime.loadIncludes.bind(null, includes, callback)
                );
                return;
            }

            if (!audescript.m(include)) {
                Runtime.loadLibrary(modules[include], include);
            }
        }

        if (callback) {
            callback();
        }
    }

    export function loadLibrary(code: any, moduleName: string):void {
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

    export function replaceStackLine(stackLine: string):string {
        return stackLine.replace(/eval at .*\(.*\),[\s]+/, "").replace(/@(file|https?|ftps?|sftp):\/\/.+> eval:/, " ");
    }

    export function cleanStack(stack: string):string {
        const stackLines = stack.split("\n");
        let res = "";
//         let oldRes = "";
        for (let i = 0; i < stackLines.length; i++) {
            if (i === 0 && stackLines[0].match(/^[a-zA-Z]*Error:/)) {
                continue;
            }

            if (stackLines[i].match(/^[\s]*at run/) || stackLines[i].match(/^run(ProgramCode)?@/)) {
                break;
            }

            const line = Runtime.replaceStackLine(stackLines[i]);
            if (line.match(/^\s*\d+:\d+\s*$/)) {
                break;
            }
//             oldRes = res;
            res += (res ? "\n" : "") + line;
        }

//         return oldRes;
        return res;
    }

    export function runProgramCode(
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
            const res = f(
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

    export function loadAudescriptCode(moduleName: string, audescriptCode: string, callback: (code: string) => any): void {
        const data = {};
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
            () => {
                if (moduleName) {
                    modules[moduleName] = code;
                }

                callback(code);
            }
        );
    }

    export function loadModule(moduleName: string, callback: () => any) {
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
            (f) => {
                Runtime.loadAudescriptCode(moduleName, f, () => {
                    const m = loadedModule[moduleName];
                    while (m.length) {
                        (m.pop())();
                    }
                });
            },
            (message, status) => {
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

    export function loadAS(code: string): void {
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
}
