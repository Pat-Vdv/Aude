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
namespace AudeGUI {
    export function initEvents(): void {
        const exportResult = document.getElementById("export-result");
        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.keyCode === 83) {
                    AudeGUI.save();
                    e.preventDefault();
                    return false;
                }

                if (e.keyCode === 69) {
                    if (e.shiftKey) {
                        if (!AudeGUI.audeExam) {
                            AudeGUI.Results.exportResult();
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

        (() => {
            const switchMode = document.getElementById("switchmode") as HTMLSelectElement;

            switchMode.onchange = () => {
                AudeGUI.setCurrentMode(switchMode.value);
            };
        })();

        window.addEventListener("resize", AudeGUI.onResize, false);

        if (!AudeGUI.audeExam) {
            document.getElementById("execute").onclick = AudeGUI.WordExecution.run;
        }

        document.getElementById("redraw").onclick = () => {
            AudeGUI.viz(
                AudeGUI.mainDesigner.getDot(),
                (res) => {
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
            exportResult.onclick = AudeGUI.Results.exportResult;
            AudeGUI.Programs.fileInput.onchange = AudeGUI.Programs.open;
        }

        AudeGUI.automatonFileInput.onchange = AudeGUI.openAutomaton;

        (() => {
            const open = document.getElementById("open");
            if (!open.onclick) {
                open.onclick = () => {
                    if (AudeGUI.getCurrentMode() === "program") {
                        AudeGUI.Programs.fileInput.click();
                    } else {
                        AudeGUI.automatonFileInput.click();
                    }
                };
            }
        })();


        document.getElementById("undo").onclick = AudeGUI.mainDesigner.undo.bind(AudeGUI.mainDesigner);
        document.getElementById("redo").onclick = AudeGUI.mainDesigner.redo.bind(AudeGUI.mainDesigner);

        AudeGUI.mainDesigner.onUndoRedoEvent = (canUndo: boolean, canRedo: boolean) => {
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
        };

        const userAccountButton = document.getElementById("toolbarUserButton");
        if (userAccountButton) {
            // Checking whether the content server is available.
            AudeServer.isServerAvailable().then(
                (available) => {
                    if (available) {
                        userAccountButton.onclick = (e) => {
                            UserAccountGUI.UserAccountWidget.toggleShown();
                        };
                    } else {
                        console.warn("Content server unavailable, hiding user features...");
                        userAccountButton.classList.add("user-hidden");
                    }
                }
            );
        }

        (() => {
            const hamburger = document.getElementById("hamburger");

            if (hamburger) {
                const menu = document.getElementById("menu");

                hamburger.onclick = () => {
                    window.setTimeout(
                        () => {
                            menu.classList.toggle("disabled");
                        }, 0
                    );
                };

                window.addEventListener("click", () => {
                    menu.classList.add("disabled");
                });
            }
        })();

        function hasParent(dom: Node, parent: Node) {
            do {
                if (dom === parent) {
                    return true;
                }

                dom = dom.parentNode;
            } while (dom);

            return false;
        }

        if (!AudeGUI.audeExam) {
            document.getElementById("automata-list").onclick = () => {
                AudeGUI.AutomataList.show();
            };

            document.getElementById("automata-list-chooser-close").onclick = () => {
                AudeGUI.AutomataList.hide();
            };

            (() => {
                let selected = null;
                let listAlgosShown = false;
                const listAlgos = document.getElementById("container-algos");
                const arrowPredefinedAlgos = document.getElementById("arrow-select-algo");
                const listAlgosSearch = document.getElementById("container-algos-search") as HTMLInputElement;
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
                document.getElementById("predef-algos").onclick = (e: MouseEvent) => {
                    if (listAlgosShown) {
                        hideListAlgos();
                    } else {
                        if (!algoButtons) {
                            algoButtons = [].slice.call(document.getElementById("container-algos-content").getElementsByTagName("button"));
                        }

                        window.addEventListener("click", hideListAlgosClick);
                        listAlgos.style.display = "";
                        arrowPredefinedAlgos.textContent = "▴";
                        listAlgosShown = true;
                        AudeGUI.onResize();
                        listAlgosSearch.focus();
                        listAlgosSearchInput();
                    }

                    e.stopPropagation();
                };

                function hideListAlgos() {
                    listAlgos.style.display = "none";
                    arrowPredefinedAlgos.textContent = "▾";
                    listAlgosShown = false;
                    AudeGUI.onResize();
                    window.removeEventListener("click", hideListAlgosClick);
                }

                listAlgosSearch.onkeyup = (e: KeyboardEvent) => {
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

                function listAlgosSearchInput() {
                    const v = listAlgosSearch.value;

                    if (selected && v) {
                        select(null);
                    }

                    for (const button of algoButtons) {
                        if (button.textContent.toLowerCase().startsWith(v.toLowerCase())) {
                            button.classList.remove("algo-hidden");
                            if (!selected && v) {
                                select(button);
                            }
                        } else {
                            button.classList.add("algo-hidden");
                        }
                    }
                }

                listAlgosSearch.oninput = listAlgosSearchInput;

                document.getElementById("container-algos-search-clear").onclick = () => {
                    listAlgosSearch.value = "";
                    listAlgosSearch.focus();
                    listAlgosSearchInput();
                };
            })();


            // R the selected algo
            document.getElementById("algorun").onclick = AudeGUI.Runtime.launchPredefAlgo;

            document.getElementById("algo-exec").onclick = () => {
                // Store the program in the local storage

                localStorage.setItem(
                    "ProgramText",
                    AudeGUI.ProgramEditor.getText()
                );

                AudeGUI.Runtime.loadAS(AudeGUI.ProgramEditor.getText());
            };

            // For the help
            document.getElementById("help").onclick = AudeGUI.Help.run;

            document.getElementById("quiz").onclick = () => {
                AudeQuiz.fileInput.click();
            };

            document.getElementById("quizEditor").onclick = AudeGUI.QuizEditor.run;
            document.getElementById("exercice").onclick = AudeGUI.QuestionList.run;
        }
    }
}
