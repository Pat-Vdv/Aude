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

/* globals automaton2svg, Automaton, saveAs, automaton2dot */


namespace AudeGUI.Results {
    const _ = AudeGUI.l10n;

    let exportResultFN     = _("automaton.txt");
    let exportResultTextFN = _("result.txt");

    let automatonResult = null;

    let results        = null;
    let resultsContent = null;
    let resultToLeft   = null;
    let splitter       = null;
    let leftPane       = null;

    let resultsContentDesigner = null;

    let resultDesigner = null;

    function clean() {
        resultToLeft.style.display = "none";
        resultsContent.textContent = "";
    }

    function toString(a) {
        return (typeof a === "string" || typeof a === "number")
            ? a
            : aude.elementToString(a, automataMap);
    }


    export let deferredResultShow: boolean = false;

    export function enable(): void {
        if (results.classList.contains("disabled")) {
            if (AudeGUI.getCurrentMode() === "program") {
                AudeGUI.Results.deferredResultShow = true;
                return;
            }

            results.classList.remove("disabled");
            splitter.classList.remove("disabled");
            AudeGUI.Results.splitterMove({clientX: splitter.offsetLeft} as MouseEvent);
            resultDesigner.enable();
            AudeGUI.onResize();
        }
    }

    export function splitterMove(e: MouseEvent): void {
        const width = document.body.offsetWidth;
        splitter.style.left = (e.clientX * 100 / width) + "%";
        leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
        results.style.left =  ((e.clientX + splitter.offsetWidth) * 100 / width) + "%";
        AudeGUI.mainDesigner.redraw();
        if (resultDesigner) {
            resultDesigner.redraw();
        }
    }

    export function redraw(): void {
        if (splitter.offsetWidth) {
            results.style.left = (
                (splitter.offsetLeft + splitter.offsetWidth) * 100 / document.body.offsetWidth
            ) + "%";
        }

        resultDesigner.redraw();
    }

    export function setText(t: string, dontNotify?: boolean): void {
        automatonResult = null;
        AudeGUI.Results.enable();
        const res = document.createElement("pre");
        res.textContent = t;
        clean();
        resultsContent.appendChild(res);
        AudeGUI.programResultUpdated(dontNotify, res);
    }

    export function setDOM(n: HTMLElement, dontNotify?: boolean): void {
        automatonResult = null;
        AudeGUI.Results.enable();
        clean();
        resultsContent.appendChild(n);
        AudeGUI.programResultUpdated(dontNotify, resultsContent);
    }

    export function setAutomaton(A: Automaton): void {
        AudeGUI.Results.enable();
        automatonResult = A;
        automaton2svg(
            A,
            (svgCode) => {
                resultsContent.textContent = "";
                resultsContent.appendChild(resultsContentDesigner);
                resultToLeft.style.display = "";
                resultDesigner.setSVG(svgCode);
                if (
                    (AudeGUI.notifier && AudeGUI.notifier.displayed) ||
                    !document.getElementById("codeedit").classList.contains("disabled") //FIXME
                ) {
                    const div = document.createElement("div");
                    div.innerHTML = svgCode;
                    AudeGUI.notify(_("Program Result"), div);
                }
            }
        );
    }

    export function set(res: Automaton | Mealy | Moore | Pushdown | HTMLElement | string | number): void {
        if (res instanceof Automaton) {
            AudeGUI.Results.setAutomaton(res);
            results.style.overflow = "hidden";
        } else if (res instanceof Mealy) {
            AudeGUI.Results.setMealy(res);
        } else if (res instanceof Moore) {
            AudeGUI.Results.setMoore(res);
        } else if (res instanceof Pushdown) {
            AudeGUI.Results.setPushdownAutomaton(res);
        } else {
            if (HTMLElement && res instanceof HTMLElement) {
                AudeGUI.Results.setDOM(res);
            } else {
                AudeGUI.Results.setText("" + res);
            }

            results.style.overflow = "";
            resultDesigner.disable();
        }
    }

    export function setMealy(M: Mealy): void {
        // Mealy → Automaton
        const A = new Automaton;

        // defining the initial state of A
        A.setInitialState(M.getInitialState());

        for (const s of M.getStates()) {
            for (const a of M.getInputAlphabet()) {
                const n = M.next(s, a);
                A.addTransition(
                    s,
                    toString(a) + '/' + toString(n[1]),
                    n[0]
                );
            }
        }

        AudeGUI.Results.set(A);
    }

    export function setMoore(M: Moore): void {
        // Moore → Automaton
        const A = new Automaton;

        // defining the initial state of A
        A.setInitialState(
            toString(M.getInitialState()) + '/' +  toString(M.getOutput(M.getInitialState()))
        );

        // defining the states of A
        for (const s of M.getStates()) {
            const newst = toString(s) + '/' + toString(M.getOutput(s));
            A.addState(newst);
        }

        // defining the transitions for A
        for (const s of M.getStates()) {
            for (const a of M.getInputAlphabet()) {
                const n = M.next(s, a);
                A.addTransition(
                    toString(s) + '/' +  toString(M.getOutput(s)),
                    a,
                    toString(n[0]) + '/' + toString(n[1])
                );
            }
        }

        AudeGUI.Results.set(A);
    }

    // Pushdown automaton → Automaton
    export function setPushdownAutomaton(P: Pushdown): void {
        const A = new Automaton;

        //Set the initial state
        A.setInitialState(P.getInitialState());

        //Set the final states
        for (const s of P.getFinalStates()) {
            A.setFinalState(s);
        }

        //Set the transition
        for (const t of P.getTransitions()) {
            A.addTransition(
                t.startState,
                t.symbol + ";" + t.stackSymbol + "/" + t.newStackSymbol,
                t.endState
            );
        }

        AudeGUI.Results.set(A);
    }

    export function load(): void {
        results        = document.getElementById("results");
        resultToLeft   = document.createElement("button");
        splitter       = document.getElementById("splitter");
        leftPane       = document.getElementById("left-pane");
        resultsContent = document.getElementById("results-content");

        resultsContentDesigner = document.createElement("div");
        resultDesigner = new AudeDesigner(resultsContentDesigner, true);

        splitter.onmousedown = () => {
            window.onmousemove = splitterMove;
            window.onmouseup = () => {
                window.onmousemove = null;
            };
        };

        document.getElementById("results-tb").insertBefore(resultToLeft, document.getElementById("export-result")); // FIXME

        resultToLeft.onclick = () => {
            if (automatonResult) {
                AudeGUI.addAutomaton();
                AudeGUI.mainDesigner.setSVG(resultsContent.querySelector("svg"), AudeGUI.mainDesigner.currentIndex);
                AudeGUI.AutomatonCodeEditor.setText(toString(automatonResult));
            }
        };

        const span = document.createElement("span");
        span.textContent = "◄ " + _("Edit this automaton");
        resultToLeft.appendChild(span);
    }

    export function exportResult(): void {
        let fn = null;
        if (automatonResult) {
            fn = window.prompt(_("Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)"), exportResultFN);

            if (fn) {
                exportResultFN = fn;
                let format = ".txt";
                if (fn.length > format.length) {
                    format = fn.substr(fn.length - format.length);
                }

                switch (format) {
                case ".svg":
                    window.saveAs(new Blob([AudeDesigner.outerHTML(resultsContent.querySelector("svg"))], {type: "text/plain;charset=utf-8"}), fn);
                    break;
                case ".dot":
                    window.saveAs(new Blob([automaton2dot(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                    break;
                default:
                    window.saveAs(new Blob([toString(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                }
            }
        } else {
            fn = window.prompt(_("Which name do you want to give to the exported text file?"), exportResultTextFN);

            if (fn) {
                exportResultTextFN = fn;
                window.saveAs(new Blob([resultsContent.textContent], {type: "text/plain;charset=utf-8"}), fn);
            }
        }
    }
}
