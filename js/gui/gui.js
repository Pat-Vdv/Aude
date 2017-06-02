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

/* globals saveAs, libD, automaton2dot, aude, automataMap */

(function (pkg) {
    "use strict";

    var AudeGUI = null;
    var exportFN = "";

    function saveProgram(fname) {
        saveAs(new Blob([AudeGUI.ProgramEditor.getValue()], {type: "text/plain;charset=utf-8"}), fname);
    }

    function saveAutomaton(fname) {
        saveAs(new Blob([AudeGUI.Designer.getAutomatonCode(AudeGUI.Designer.currentIndex, false)], {type: "text/plain"}), fname);
    }


    var switchmode     = null;
    var automatoncode  = null;
    var automataedit   = null;
    var toolbar        = null;
    var codeedit       = null;
    var svgContainer   = null;
    var automatonSelect = null;

    var _ = libD.l10n();

    var programFileName = "";
    var automatonFileName = "";

    var loadingViz = null; // FIXME

    AudeGUI = pkg.AudeGUI = {
        automatonFileInput: null,
        l10n: _,

        notify: function (title, content, type) {
            if (!libD.Notify) {
                libD.need(["notify"], function () {
                    AudeGUI.notify(title, content, type);
                });
                return;
            }

            if (!AudeGUI.notifier || !AudeGUI.notifier.displayed) {
                AudeGUI.notifier = new libD.Notify({closeOnClick: true});
            }

            AudeGUI.notifier.setTitle(title);
            AudeGUI.notifier.setDescription(content);
            AudeGUI.notifier.setType(type);
        },

        saveAs: function () {
            var prog = AudeGUI.getCurrentMode() === "program";

            var n = window.prompt(
                (
                    prog
                        ? _("Please enter a name for the file in which the program will be saved.")
                        : _("Please enter a name for the file in which the automaton will be saved.")
                ),
                (prog ? _("algo.ajs") : _("automaton.txt"))
            );

            if (n) {
                if (prog) {
                    saveProgram(programFileName = n);
                } else {
                    saveAutomaton(automatonFileName = n);
                }
            }
        },

        save: function () {
            if (AudeGUI.getCurrentMode() === "program") {
                if (!programFileName) {
                    AudeGUI.saveAs();
                } else {
                    saveProgram(programFileName);
                }
            } else {
                if (AudeGUI.getCurrentMode() === "automatoncode") {
                    AudeGUI.Designer.setAutomatonCode(AudeGUI.AutomatonCodeEditor.getText(), AudeGUI.Designer.currentIndex);
                }

                if (!automatonFileName) {
                    AudeGUI.saveAs();
                } else {
                    saveAutomaton(automatonFileName);
                }
            }
        },

        export: function () {
            var fn = window.prompt(_("Which name do you want to give to the exported image? (give a .dot extension to save as dot format, .svg to save as svg)"), exportFN);

            if (fn) {
                exportFN = fn;

                var EXTENSION_SIZE = 4;

                if (fn.length > EXTENSION_SIZE && fn.substr(fn.length - EXTENSION_SIZE) === ".svg") {
                    if (AudeGUI.getCurrentMode() !== "design") {
                        AudeGUI.Designer.setAutomatonCode(AudeGUI.AutomatonCodeEditor.getText(), AudeGUI.Designer.currentIndex);
                    }

                    saveAs(new Blob([AudeGUI.Designer.getSVG(AudeGUI.Designer.currentIndex)], {type: "text/plain;charset=utf-8"}), fn);
                } else {
                    if (AudeGUI.getCurrentMode() === "design") {
                        AudeGUI.AutomatonCodeEditor.setText(AudeGUI.Designer.getAutomatonCode(AudeGUI.Designer.currentIndex, false));
                    } else {
                        AudeGUI.Designer.setAutomatonCode(AudeGUI.AutomatonCodeEditor.getText(), AudeGUI.Designer.currentIndex);
                    }

                    var A = AudeGUI.Designer.getAutomaton(AudeGUI.Designer.currentIndex);

                    if (A) {
                        saveAs(new Blob([automaton2dot(A)], {type: "text/plain;charset=utf-8"}), fn);
                    } else {
                        AudeGUI.notify(_("There is no automaton to save."));
                    }
                }
            }
        },

        openAutomaton: function (code) {
            if (typeof code === "string") {
                AudeGUI.AutomatonCodeEditor.setText(code);
                AudeGUI.Designer.setAutomatonCode(code, AudeGUI.Designer.currentIndex);
                return;
            }

            var freader = new FileReader();

            freader.onload = function () {
                AudeGUI.openAutomaton(freader.result);
            };

            freader.readAsText(AudeGUI.automatonFileInput.files[0], "utf-8");
            automatonFileName = AudeGUI.automatonFileInput.value;
        },

        setCurrentAutomatonIndex: function (index) {
            AudeGUI.Designer.setCurrentIndex(index); // FIXME

            automatonSelect.value = index;

            if (AudeGUI.getCurrentMode() === "automatoncode") {
                try {
                    AudeGUI.AutomatonCodeEditor.setText(AudeGUI.Designer.getAutomatonCode(index, false));
                } catch (e) {
                    AudeGUI.setCurrentMode("design");
                    switchmode.onchange();
                    libD.notify({
                        type:    "error",
                        title:   libD.format(_("Unable to access the code of automaton n°{0}"), AudeGUI.Designer.currentIndex),
                        content: _("You need to fix the automaton in design mode before accessing its code.")
                    });
                }
            }
        },

        addAutomaton: function () {
            var o = document.createElement("option");
            o.value = AudeGUI.AutomataList.automatonCount;
            o.textContent = _("n°") + AudeGUI.AutomataList.automatonCount;
            o.id = "automaton_n" + AudeGUI.AutomataList.automatonCount;
            automatonSelect.appendChild(o);
            automatonSelect.value = AudeGUI.AutomataList.automatonCount;
            AudeGUI.Designer.newAutomaton(AudeGUI.AutomataList.automatonCount);
            AudeGUI.setCurrentAutomatonIndex(AudeGUI.AutomataList.automatonCount++);
        },

        removeCurrentAutomaton: function () {
            var curAutomaton = parseInt(automatonSelect.value, 10);
            automatonSelect.removeChild(document.getElementById("automaton_n" + (AudeGUI.AutomataList.automatonCount - 1)));
            AudeGUI.Designer.removeAutomaton(curAutomaton);

            if (curAutomaton === AudeGUI.AutomataList.automatonCount - 1) {
                AudeGUI.setCurrentAutomatonIndex(automatonSelect.value = AudeGUI.AutomataList.automatonCount - 2);
            } else {
                AudeGUI.setCurrentAutomatonIndex(curAutomaton);
            }

            --AudeGUI.AutomataList.automatonCount;

            if (AudeGUI.AutomataList.automatonCount < 1) {
                AudeGUI.addAutomaton();
            }

            AudeGUI.AutomataList.removeAutomaton(curAutomaton);
            AudeGUI.AutomataList.show();
        },

        applyTranslation: function () {
            var translatedNodes = document.querySelectorAll("[data-translated-content]");

            var len = translatedNodes.length;

            var i = 0;

            for (i = 0; i < len; ++i) {
                translatedNodes[i].textContent = _(translatedNodes[i].textContent);
            }

            translatedNodes = document.querySelectorAll("[data-translated-title]");
            len = translatedNodes.length;

            for (i = 0; i < len; ++i) {
                if (translatedNodes[i].title) {
                    translatedNodes[i].title = _(translatedNodes[i].title);
                }

                if (translatedNodes[i].alt) {
                    translatedNodes[i].alt = _(translatedNodes[i].alt);
                }
            }
        },

        getCurrentMode: function () {
            return switchmode.value;
        },

        programResultUpdated: function (dontNotify, res) {
            if (!dontNotify) {
                if ((AudeGUI.notifier && AudeGUI.notifier.displayed) || !codeedit.classList.contains("disabled")) {
                    AudeGUI.notify(_("Program Result"), res.cloneNode(true), "normal");
                }
            }
        },

        setCurrentMode: function (newMode) {
            switchmode.value = newMode;

            switch (newMode) {
                case "program":
                    toolbar.className = "algomode";

                    codeedit.classList.remove("disabled");
                    automataedit.classList.add("disabled");

                    AudeGUI.ProgramEditor.enable();

                    AudeGUI.onResize();
                    break;

                case "design":
                    if (AudeGUI.Results.deferedResultShow) {
                        setTimeout(AudeGUI.Results.enable, 0);
                        AudeGUI.Results.deferedResultShow = false;
                    }

                    if (AudeGUI.ProgramEditor.getText()) {
                        toolbar.className = "designmode";
                    } else {
                        toolbar.className = "designmode launch-disabled";
                    }

                    codeedit.classList.add("disabled");

                    automataedit.classList.remove("disabled");
                    automatoncode.classList.add("disabled");
                    svgContainer.classList.remove("disabled");

                    AudeGUI.onResize();
                    break;

                case "automatoncode":
                    try {
                        AudeGUI.AutomatonCodeEditor.setText(AudeGUI.Designer.getAutomatonCode(AudeGUI.Designer.currentIndex, false));
                    } catch (e) {
                        libD.notify({
                            type:    "error",
                            title:   libD.format(_("Unable to access the code of automaton n°{0}"), AudeGUI.Designer.currentIndex),
                            content: _("You need to fix the automaton in design mode before accessing its code."),
                        });
                        this.value = "design";
                        switchmode.onchange();
                        return;
                    }

                    if (AudeGUI.Results.deferedResultShow) {
                        setTimeout(AudeGUI.Results.enable, 0);
                        AudeGUI.Results.deferedResultShow = false;
                    }


                    if (AudeGUI.ProgramEditor.getText()) {
                        toolbar.className = "designmode codemode";
                    } else {
                        toolbar.className = "designmode codemode launch-disabled";
                    }

                    codeedit.classList.add("disabled");

                    automataedit.classList.remove("disabled");
                    automatoncode.classList.remove("disabled");
                    svgContainer.classList.add("disabled");
                    AudeGUI.onResize();
                    break;

                default:
                    throw new Error("BUG");
            }
        },

        onResize: function () {
            AudeGUI.Results.redraw();
            AudeGUI.Designer.redraw();
        },

        viz: function viz(code, callback) {
            if (window.Viz) {
                if (loadingViz) {
                    loadingViz.close(true);
                    loadingViz = null;
                }
                callback(window.Viz(code, "svg"));
            } else {
                if (!loadingViz) {
                    loadingViz = libD.notify({
                        type: "info",
                        content: _("Loading Graphviz, the code that draws automata"),
                        title: _("Wait a second..."),
                        delay: 1000,
                        closable:false
                    });
                }

                var args = arguments;
                setTimeout(
                    function () {
                        AudeGUI.viz.apply(window, args);
                    },
                    500
                );
            }
        }
    };

    AudeGUI.Programs = {
        fileInput: null,

        open: function (code) {
            if (typeof code === "string") {
                AudeGUI.ProgramEditor.setText(code);
                return;
            }

            var freader = new FileReader();

            freader.onload = function () {
                AudeGUI.Programs.open(freader.result);
            };

            freader.readAsText(AudeGUI.Programs.fileInput.files[0], "utf-8");
            programFileName = AudeGUI.Programs.fileInput.value;
        },

        load: function () {
            AudeGUI.Programs.fileInput = document.getElementById("fileprogram");
        }
    };

    libD.need(["ready", "dom", "notify", "wm", "ws", "jso2dom", "*langPack"], function () {
        automatoncode     = document.getElementById("automatoncode");
        automataedit      = document.getElementById("automataedit");
        toolbar           = document.getElementById("toolbar");
        switchmode        = document.getElementById("switchmode");
        codeedit          = document.getElementById("codeedit");
        automatonSelect   = document.getElementById("n-automaton");
        svgContainer      = document.getElementById("svg-container");

        automatonSelect.onchange = function () {
            AudeGUI.setCurrentAutomatonIndex(parseInt(automatonSelect.value, 10));
        };

        AudeGUI.automatonFileInput = document.getElementById("fileautomaton");

        window.onselectstart = window.ondragstart = function (e) {
            e.preventDefault();
            return false;
        };

        AudeGUI.Quiz.load();
        AudeGUI.Designer.load();
        AudeGUI.Programs.load();
        AudeGUI.Results.load();
        AudeGUI.WordExecution.load();
        AudeGUI.ProgramEditor.load();
        AudeGUI.AutomatonCodeEditor.load();
        AudeGUI.AutomataList.load();
        AudeGUI.Runtime.load();
        AudeGUI.initEvents();
        AudeGUI.onResize();
        AudeGUI.addAutomaton();
        AudeGUI.applyTranslation();

        AudeGUI.setCurrentMode(switchmode.value);

        (function drawDivWelcome() {
            var divWelcome = document.createElement("div");
            divWelcome.id = "welcome";
            divWelcome.innerHTML = libD.format(_(
                "<h2>Welcome to {0}!</h2>" +
                "<h3> Never used {0} before? </h3>" +
                "<ul>" +
                "    <li>Create your first automaton by clicking on the <strong>New state</strong> button at the bottom left of the screen.</li>" +
                "    <li>You can apply an algorithm on your automaton with the <strong>Select an algo</strong> toolbar button.</li>" +
                "</ul>" +
                "<h3> Using a keyboard and a mouse? You can be faster. </h3>" +
                "<ul>" +
                "    <li>To add a <strong>new state</strong>, double-click where you want the state to be.</li>" +
                "    <li>To add a <strong>new transition</strong>, Shift+click on the start state then click on the destination state.</li>" +
                "    <li>To <strong>rename</strong> a state, to <strong>modify symbols</strong> of a transition, double-click on it.</li>" +
                "    <li>To set a state as the <strong>initial</strong> state, ctrl+right click on the state.</li>" +
                "    <li>To set a state as <strong>(non-)accepting</strong>, right-click on it.</li>" +
                "    <li>To <strong>remove</strong> a state or a transition, ctrl-click on it.</li>" +
                "</ul>" +
                "<h3> Quizzes </h3>" +
                "<p>To load a quiz, click on the \"Load a Quiz\" toolbar button. You can keep on using all the features of the program, like running algorithms, during the quiz whenever it is possible to draw an automaton.</p>" +
                "<p> Now it’s your turn!</p>"
            ), "Aude");

            AudeGUI.Designer.svgContainer.parentNode.appendChild(divWelcome);
            function hideWelcome() {
                AudeGUI.Designer.svgContainer.parentNode.removeChild(divWelcome);
                document.getElementById("new-state-btn-wrap").classList.add("welcome-hidden");
                document.body.removeEventListener("click", hideWelcome, false);
                AudeGUI.Designer.setViewBoxSize();
            }
            document.body.addEventListener("click", hideWelcome, false);
        }());

        (function loadViz() {
            if (!window.Viz && window.Module) { // Viz glue
                var gv = window.Module.cwrap("graphvizjs", "string", ["string", "string", "string"]);
                window.Viz = function (inputDot, outputFormat) {
                    return gv(inputDot, "dot", outputFormat);
                };
            }

            pkg.automaton2svg = function automaton2svg(A, callback) {
                AudeGUI.viz(
                    automaton2dot(A),
                    function (result) {
                        callback(result.replace(/<\?[\s\S]*?\?>/g, "").replace(/<![\s\S]*?>/g, ""));
                    }
                );
            };
        }());

        AudeGUI.Designer.getValueFunction = function (s) {
            try {
                var v = aude.getValue(s, automataMap);
                return v;
            } catch (e) {
                return s;
            }
        };

        AudeGUI.Designer.getStringValueFunction = function (s) {
            try {
                aude.getValue(s, automataMap); // s is a legal value
                return s;
            } catch (e) {
                return JSON.stringify(s); // turn into string
            }
        };
    }, false);
}(window));
