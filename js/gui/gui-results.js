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

(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;

    var _ = AudeGUI.l10n;

    var exportResultFN     = _("automaton.txt");
    var exportResultTextFN = _("result.txt");

    var automatonResult = null;

    var results        = null;
    var resultsContent = null;
    var resultToLeft   = null;
    var splitter       = null;
    var leftPane       = null;

    var resultsContentDesigner = null;

    var resultDesigner = null;

    function clean() {
        resultToLeft.style.display = "none";
        resultsContent.textContent = "";
    }

    function splitterMove(e) {
        var width = document.body.offsetWidth;
        splitter.style.left = (e.clientX * 100 / width) + "%";
        leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
        results.style.left =  ((e.clientX + splitter.offsetWidth) * 100 / width) + "%";
        AudeGUI.mainDesigner.redraw();

        if (resultDesigner) {
            resultDesigner.redraw();
        }
    }

    function toString(a) {
        return (typeof a === "string" || typeof a === "number")
            ? a
            : aude.elementToString(a, automataMap)
    };


    AudeGUI.Results = {
        deferedResultShow: false,

        enable: function () {
            if (results.classList.contains("disabled")) {
                if (AudeGUI.getCurrentMode() === "program") {
                    AudeGUI.Results.deferedResultShow = true;
                    return;
                }

                results.classList.remove("disabled");
                splitter.classList.remove("disabled");
                AudeGUI.Results.splitterMove({clientX: splitter.offsetLeft});
                resultDesigner.enable();
                AudeGUI.onResize();
            }
        },

        splitterMove: function (e) {
            var width = document.body.offsetWidth;
            splitter.style.left = (e.clientX * 100 / width) + "%";
            leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
            results.style.left =  ((e.clientX + splitter.offsetWidth) * 100 / width) + "%";
            AudeGUI.mainDesigner.redraw();
            resultDesigner.redraw();
        },

        redraw: function () {
            if (splitter.offsetWidth) {
                results.style.left = (
                    (splitter.offsetLeft + splitter.offsetWidth) * 100 / document.body.offsetWidth
                ) + "%";
            }

            resultDesigner.redraw();
        },

        setText: function (t, dontNotify) {
            automatonResult = null;
            AudeGUI.Results.enable();
            var res = document.createElement("pre");
            res.textContent = t;
            clean();
            resultsContent.appendChild(res);
            AudeGUI.programResultUpdated(dontNotify, res);
        },

        setDOM: function (n, dontNotify) {
            automatonResult = null;
            AudeGUI.Results.enable();
            clean();
            resultsContent.appendChild(n);
            AudeGUI.programResultUpdated(dontNotify, resultsContent);
        },

        setAutomaton: function (A) {
            AudeGUI.Results.enable();
            automatonResult = A;
            automaton2svg(
                A,
                function (svgCode) {
                    resultsContent.textContent = "";
                    resultsContent.appendChild(resultsContentDesigner);
                    resultToLeft.style.display = "";
                    resultDesigner.setSVG(svgCode);
                    if (
                        (AudeGUI.notifier && AudeGUI.notifier.displayed) ||
                        !document.getElementById("codeedit").classList.contains("disabled") //FIXME
                    ) {
                        let div = document.createElement("div");
                        div.innerHTML = svgCode;
                        AudeGUI.notify(_("Program Result"), div, "normal");
                    }
                }
            );
        },

        set: function (res) {
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
                    AudeGUI.Results.setText(aude.elementToString(res));
                }

                results.style.overflow = "";
                resultDesigner.disable();
            }
        },

        setMealy: function (M) {
            // Mealy → Automaton
            var A = new Automaton;

            // defining the initial state of A
            A.setInitialState(M.getInitialState());

            M.states.forEach(function (s) {
                M.getInputAlphabet().forEach(function (a) {
                    var n = M.next(s, a);
                    A.addTransition(
                        s,
                        toString(a) + '/' + toString(n[1]),
                        n[0]
                    );
                });
            });

            AudeGUI.Results.set(A);
        },

        setMoore : function (M) {
            // Moore → Automaton
            var A = new Automaton;

            // defining the initial state of A
            A.setInitialState(
                toString(M.getInitialState()) + '/' +  toString(M.getOutput(M.getInitialState()))
            );

            // defining the states of A
            M.states.forEach(function (s) {
                var newst = toString(s) + '/' + toString(M.getOutput(s));
                A.addState(newst);
            });

            // defining the transitions for A
            M.states.forEach(function (s) {
                M.getInputAlphabet().forEach(function (a) {
                    var n = M.next(s, a);
                        A.addTransition(
                            toString(s) + '/' +  toString(M.getOutput(s)),
                            a,
                            toString(n[0]) + '/' + toString(n[1])
                        );
                });
            });

            AudeGUI.Results.set(A);
        },

        // Pushdown automaton → Automaton
        setPushdownAutomaton : function (P) {
            var A = new Automaton;

            //Set the initial state
            A.setInitialState(P.getInitialState());

            //Set the final states
            for(var s of P.getFinalStates()) {
                A.setFinalState(s);
            }

            //Set the transition
            for(var t of P.getTransitions()) {
                A.addTransition(
                    t.startState,
                    t.symbol + ";" + t.stackSymbol + "/" + t.newStackSymbol,
                    t.endState
                );
            }

            AudeGUI.Results.set(A);
        },

        load: function () {
            results        = document.getElementById("results");
            resultToLeft   = document.createElement("button");
            splitter       = document.getElementById("splitter");
            leftPane       = document.getElementById("left-pane");
            resultsContent = document.getElementById("results-content");

            resultsContentDesigner = document.createElement("div");
            resultDesigner = new AudeDesigner(resultsContentDesigner, true);

            splitter.onmousedown = function () {
                window.onmousemove = splitterMove;
                window.onmouseup = function () {
                    window.onmousemove = null;
                };
            };

            document.getElementById("results-tb").insertBefore(resultToLeft, document.getElementById("export-result")); // FIXME

            resultToLeft.onclick = function () {
                if (automatonResult) {
                    AudeGUI.addAutomaton();
                    AudeGUI.mainDesigner.setSVG(resultsContent.querySelector("svg"), AudeGUI.mainDesigner.currentIndex);
                    AudeGUI.AutomatonCodeEditor.setText(Automaton.toString(automatonResult));
                }
            };

            var span = document.createElement("span");
            span.textContent = "◄ " + _("Edit this automaton");
            resultToLeft.appendChild(span);
        },

        export: function () {
            var fn = null;
            if (automatonResult) {
                fn = window.prompt(_("Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)"), exportResultFN);

                if (fn) {
                    exportResultFN = fn;
                    var format = ".txt";
                    if (fn.length > format.length) {
                        format = fn.substr(fn.length - format.length);
                    }

                    switch (format) {
                    case ".svg":
                        saveAs(new Blob([AudeDesigner.outerHTML(resultsContent.querySelector("svg"))], {type: "text/plain;charset=utf-8"}), fn);
                        break;
                    case ".dot":
                        saveAs(new Blob([automaton2dot(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                        break;
                    default:
                        saveAs(new Blob([Automaton.toString(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                    }
                }
            } else {
                fn = window.prompt(_("Which name do you want to give to the exported text file?"), exportResultTextFN);

                if (fn) {
                    exportResultTextFN = fn;
                    saveAs(new Blob([resultsContent.textContent], {type: "text/plain;charset=utf-8"}), fn);
                }
            }
        },

        redraw: function () {
            resultDesigner.redraw();
        }
    };
}(window));
