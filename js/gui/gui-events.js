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

window.AudeGUI.initEvents = function () {
    "use strict";

    var AudeGUI = window.AudeGUI;

    var exportResult = document.getElementById("export-result");

    window.addEventListener("keydown", function (e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.keyCode === 83) {
                AudeGUI.save();
                e.preventDefault();
                return false;
            }

            if (e.keyCode === 69) {
                if (e.shiftKey) {
                    if (!AudeGUI.audeExam) {
                        exportResult.onclick();
                    }
                }
                e.preventDefault();
                return false;
            }

            if (e.keyCode === 90) {
                if (e.shiftKey) {
                    AudeGUI.mainDesigner.redo();
                } else {
                    AudeGUI.mainDesigner.undo();
                }
            }
        }

        return true;
    });

    (function () {
        var switchmode = document.getElementById("switchmode");

        switchmode.onchange = function () {
            AudeGUI.setCurrentMode(switchmode.value);
        };
    }());

    window.addEventListener("resize", AudeGUI.onResize, false);

    if (!AudeGUI.audeExam) {
        document.getElementById("execute").onclick = AudeGUI.WordExecution.run;
    }

    document.getElementById("redraw").onclick = function () {
        AudeGUI.viz(
            AudeGUI.mainDesigner.getDot(),
            function (res) {
                AudeGUI.mainDesigner.setSVG(res, AudeGUI.mainDesigner.currentIndex);
            }
        );
    };

    document.getElementById("zoom_best").onclick = AudeGUI.mainDesigner.autoCenterZoom.bind(AudeGUI.mainDesigner);
    document.getElementById("save").onclick = AudeGUI.save;
    document.getElementById("saveas").onclick = AudeGUI.saveAs;
    document.getElementById("automaton_minus").onclick = AudeGUI.removeCurrentAutomaton;
    document.getElementById("automaton_plus").onclick = AudeGUI.addAutomaton;

    if (!AudeGUI.audeExam) {
        exportResult.onclick = AudeGUI.Results.export;
        AudeGUI.Programs.fileInput.onchange = AudeGUI.Programs.open;
    }

    AudeGUI.automatonFileInput.onchange = AudeGUI.openAutomaton;

    (function () {
        var open = document.getElementById("open")
        if (!open.onclick) {
            open.onclick = function () {
                if (AudeGUI.getCurrentMode() === "program") {
                    AudeGUI.Programs.fileInput.click();
                } else {
                    AudeGUI.automatonFileInput.click();
                }
            };
        }
    }());


    (function (undo, redo) {
        undo.onclick = AudeGUI.mainDesigner.undo.bind(AudeGUI.mainDesigner);
        redo.onclick = AudeGUI.mainDesigner.redo.bind(AudeGUI.mainDesigner);

        AudeGUI.mainDesigner.onUndoRedoEvent = (
            function (canUndo, canRedo) {
                if (canUndo) {
                    document.getElementById("undo").classList.remove("greyed");
                } else {
                    document.getElementById("undo").classList.add("greyed");
                }

                if (canRedo) {
                    document.getElementById("redo").classList.remove("greyed");
                } else {
                    document.getElementById("redo").classList.add("greyed");
                }
            }
        );
    }(document.getElementById("undo"), document.getElementById("redo")));

    (function (undo, redo) {
        undo.onclick = AudeGUI.mainDesigner.undo.bind(AudeGUI.mainDesigner);
        redo.onclick = AudeGUI.mainDesigner.redo.bind(AudeGUI.mainDesigner);

        AudeGUI.mainDesigner.onUndoRedoEvent = (
            function (canUndo, canRedo) {
                if (canUndo) {
                    document.getElementById("undo").classList.remove("greyed");
                } else {
                    document.getElementById("undo").classList.add("greyed");
                }

                if (canRedo) {
                    document.getElementById("redo").classList.remove("greyed");
                } else {
                    document.getElementById("redo").classList.add("greyed");
                }
            }
        );
    }(document.getElementById("undo"), document.getElementById("redo")));

    const userAccountButton = document.getElementById("toolbarUserButton");
    if (userAccountButton) {
        // Checking whether the content server is available.
        AudeServer.isServerAvailable().then(
            (available) => {
                if (available) {
                    userAccountButton.onclick = (e) => {
                        UserAccountGUI.UserAccountWidget.toggleShown();
                    }
                } else {
                    console.warn("Content server unavailable, hiding user features...");
                    userAccountButton.classList.add("user-hidden");
                }
            }
        );
    }

    (function () {
        var hamburger = document.getElementById("hamburger");

        if (hamburger) {
            var menu = document.getElementById("menu");

            hamburger.onclick = function () {
                window.setTimeout(
                    function () {
                        menu.classList.toggle("disabled");
                    }, 0
                );
            }

            window.addEventListener("click", function () {
                menu.classList.add("disabled");
            });
        }
    })();

    function hasParent(dom, parent) {
        do {
            if (dom === parent) {
                return true;
            }

            dom = dom.parentNode;
        } while (dom);

        return false;
    }

    if (!AudeGUI.audeExam) {
        document.getElementById("automata-list").onclick = function () {
            AudeGUI.AutomataList.show();
        };

        document.getElementById("automata-list-chooser-close").onclick = function () {
            AudeGUI.AutomataList.hide();
        };

        (function () {
            let selected = null;
            let listAlgosShown = false;
            const listAlgos = document.getElementById("container-algos");
            const arrowPredefAlgos = document.getElementById("arrow-select-algo");
            const listAlgosSearch = document.getElementById("container-algos-search");
            let algoButtons = null;

            function select(button) {
                console.log("select", button);
                if (selected) {
                    selected.classList.remove("algo-selected");
                }

                selected = button;

                if (button) {
                    selected.classList.add("algo-selected");
                }
            }

            function hideListAlgosClick(e) {
                if (e.target.classList.contains("cell-algo")) {
                    select(e.target);
                    hideListAlgos();
                } else if (!hasParent(e.target, listAlgos)) {
                    hideListAlgos();
                }
            }

            // Show the list of predefined algo
            document.getElementById("predef-algos").onclick = function (e) {
                if (listAlgosShown) {
                    hideListAlgos();
                } else {
                    if (!algoButtons) {
                        algoButtons = [].slice.call(document.getElementById("container-algos-content").getElementsByTagName("button"));
                    }

                    window.addEventListener("click", hideListAlgosClick);
                    listAlgos.style.display = "";
                    arrowPredefAlgos.textContent = "▴";
                    listAlgosShown = true;
                    AudeGUI.onResize();
                    listAlgosSearch.focus();
                    listAlgosSearch.oninput();
                }

                e.stopPropagation();
            };

            function hideListAlgos() {
                listAlgos.style.display = "none";
                arrowPredefAlgos.textContent = "▾";
                listAlgosShown = false;
                AudeGUI.onResize();
                window.removeEventListener("click", hideListAlgosClick);
            }

            listAlgosSearch.onkeyup = function (e) {
                if (e.keyCode === 13 && selected) {
                    selected.click();
                    hideListAlgos();
                } else if (e.keyCode === 27) {
                    listAlgosSearch.value = "";
                    hideListAlgos();
                } else if (e.keyCode === 40) { // down
                    let cur = selected ? algoButtons.indexOf(selected) + 1 : 0;
                    while (cur < algoButtons.length) {
                        if (!algoButtons[cur].classList.contains("algo-hidden")) {
                            select(algoButtons[cur]);
                            break;
                        }
                        cur++;
                    }
                } else if (e.keyCode === 38) { // up
                    let cur = selected ? algoButtons.indexOf(selected) - 1 : 0;
                    while (cur >= 0) {
                        if (!algoButtons[cur].classList.contains("algo-hidden")) {
                            select(algoButtons[cur]);
                            break;
                        }
                        cur--;
                    }
                }
            };

            listAlgosSearch.oninput = function () {
                var v = listAlgosSearch.value;

                if (selected && v) {
                    select(null);
                }

                for (let button of algoButtons) {
                    if (button.textContent.toLowerCase().startsWith(v.toLowerCase())) {
                        button.classList.remove("algo-hidden");
                        if (!selected && v) {
                            select(button);
                        }
                    } else {
                        button.classList.add("algo-hidden");
                    }
                }
            };

            document.getElementById("container-algos-search-clear").onclick = function () {
                listAlgosSearch.value = "";
                listAlgosSearch.focus();
                listAlgosSearch.oninput();
            };
        }());


        // R the selected algo
        document.getElementById("algorun").onclick = AudeGUI.Runtime.launchPredefAlgo;

        document.getElementById("algo-exec").onclick = function () {
            // Store the program in the local storage

            localStorage.setItem(
                "ProgramText",
                AudeGUI.ProgramEditor.getText()
            );

            AudeGUI.Runtime.loadAS(AudeGUI.ProgramEditor.getText());
        };

        // For the help
        document.getElementById("help").onclick = function () {
            AudeGUI.Help.run();
        };

        document.getElementById("quiz").onclick = function () {
            AudeGUI.Quiz.fileInput.click();
        };

        document.getElementById("quizEditor").onclick = function () {
            AudeGUI.QuizEditor.run();
        };

        document.getElementById("exercice").onclick = function () {
            AudeGUI.QuestionList.run();
        };
    }

    document.getElementById("automaton_plus").onchange = function () {
        AudeGUI.setCurrentAutomatonIndex(
            parseInt(
                document.getElementById("automaton_plus").value,
                10)
        );
    };
};
