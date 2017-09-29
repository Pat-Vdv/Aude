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
    var exportBtn = document.getElementById("export");

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
                } else {
                    exportBtn.onclick();
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

    document.getElementById("export").onclick = AudeGUI.export;

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
        AudeGUI.Programs.fileInput.onchange   = AudeGUI.Programs.open;
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

    if (!AudeGUI.audeExam) {
        document.getElementById("automata-list").onclick = function () {
            AudeGUI.AutomataList.show();
        };

        document.getElementById("automata-list-chooser-close").onclick = function () {
            AudeGUI.AutomataList.hide();
        };

        document.getElementById("algorun").onclick = AudeGUI.Runtime.launchPredefAlgo;

        document.getElementById("algo-exec").onclick = function () {
            AudeGUI.Runtime.loadAS(AudeGUI.ProgramEditor.getText());
        };

        document.getElementById("quiz").onclick = function () {
            AudeGUI.Quiz.fileInput.click();
        };
    }

    document.getElementById("automaton_plus").onchange = function () {
        AudeGUI.setCurrentAutomatonIndex(parseInt(document.getElementById("automaton_plus").value, 10));
    };
};
