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

    var zoom = {svgZoom: 1};

    function clean() {
        resultToLeft.style.display = "none";
        resultsContent.textContent = "";
    }

    function splitterMove(e) {
        var width = document.body.offsetWidth;
        splitter.style.left = (e.clientX * 100 / width) + "%";
        leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
        results.style.left =  ((e.clientX + splitter.offsetWidth) * 100 / width) + "%";
        AudeGUI.Designer.redraw();

        if (zoom.fixViewBox) {
            zoom.fixViewBox();
        }
    }

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
                AudeGUI.Designer.userZoom(zoom);
                zoom.enable();
                AudeGUI.onResize();
            }
        },

        splitterMove: function (e) {
            var width = document.body.offsetWidth;
            splitter.style.left = (e.clientX * 100 / width) + "%";
            leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
            results.style.left =  ((e.clientX + splitter.offsetWidth) * 100 / width) + "%";
            AudeGUI.Designer.redraw();
            if (zoom.fixViewBox) {
                zoom.fixViewBox();
            }
        },

        redraw: function () {
            if (splitter.offsetWidth) {
                results.style.left = (
                    (splitter.offsetLeft + splitter.offsetWidth) * 100 / document.body.offsetWidth
                ) + "%";
            }

            if (zoom.fixViewBox) {
                zoom.fixViewBox();
            }
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
                    resultsContent.innerHTML = svgCode;
                    resultToLeft.style.display = "";

                    if (
                        (AudeGUI.notifier && AudeGUI.notifier.displayed) ||
                        !document.getElementById("codeedit").classList.contains("disabled") //FIXME
                    ) {
                        AudeGUI.notify(_("Program Result"), resultsContent.cloneNode(true), "normal");
                    }

                    zoom.svgNode = resultsContent.querySelector("svg");

                    if (zoom.fixViewBox) {
                        zoom.fixViewBox();
                    }
                }
            );
        },

        set: function (res) {
            if (res instanceof Automaton) {
                AudeGUI.Results.setAutomaton(res);
            } else if (HTMLElement && res instanceof HTMLElement) {
                AudeGUI.Results.setDOM(res);
            } else {
                AudeGUI.Results.setText(aude.elementToString(res));
            }

            var svg = resultsContent.getElementsByTagName("svg")[0];

            if (svg) {
                zoom.svgNode = svg;
                results.style.overflow = "hidden";

                if (zoom.fixViewBox) {
                    zoom.fixViewBox();
                }
            } else {
                zoom.svgNode = null;

                if (zoom.disable) {
                    zoom.disable();
                }

                results.style.overflow = "";
            }
        },

        load: function () {
            results        = document.getElementById("results");
            resultToLeft   = document.createElement("button");
            splitter       = document.getElementById("splitter");
            leftPane       = document.getElementById("left-pane");
            resultsContent = document.getElementById("results-content");

            zoom.svgContainer = results;

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
                    AudeGUI.Designer.setSVG(resultsContent.querySelector("svg"), AudeGUI.Designer.currentIndex);
                    AudeGUI.AutomatonCodeEditor.setText(Automaton.toString(automatonResult));
                }
            };

            var img = new Image();
            img.src = libD.getIcon("actions/arrow-left");
            var span = document.createElement("span");
            span.textContent = _("Edit this automaton");
            resultToLeft.appendChild(img);
            resultToLeft.appendChild(span);
        },

        exportResult: function () {
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
                        saveAs(new Blob([AudeGUI.Designer.outerHTML(resultsContent.querySelector("svg"))], {type: "text/plain;charset=utf-8"}), fn);
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

        fixViewBox: function () {
            if (zoom.fixViewBox) {
                zoom.fixViewBox();
            }
        }
    };
}(window));
