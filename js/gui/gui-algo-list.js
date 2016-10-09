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

/* globals getFile, libD */


(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    getFile("algos/list.txt",
        function (algoFile) {
            getFile(
                "dirlist.txt",
                function (dirlist) {
                    var dirs = dirlist.split("\n");

                    var files = {
                        a: [],
                        q: [],
                        e: []
                    };

                    var win = null;
                    var langFound = false;

                    for (var i = 0, len = dirs.length; i < len; ++i) {
                        if (dirs[i]) {
                            if (dirs[i][0] === "l") { // l10n
                                if (libD.lang === dirs[i].split("/")[2].split(".")[0]) {
                                    langFound = true;
                                    break;
                                }
                            } else {
                                files[dirs[i][0]].push(dirs[i]);
                            }
                        }
                    }

                    dirs = null;

                    if (langFound) {
                        libD.jsLoad(
                            "l10n/js/" + libD.lang + ".js",
                            function () {
                                libD.moduleLoaded("*langPack");
                            }
                        );
                    } else {
                        libD.moduleLoaded("*langPack");
                    }

                    function makeWindow(title, textList, funList, btnText, letter, folder, ext, fileelem) {
                        var refs = {};

                        if (win && win.ws) {
                            win.close();
                        }

                        win = libD.newWin({
                            title:   title,
                            height:  "80%",
                            width:   "75%",
                            left:    "12.5%",
                            top:     "12.5%",
                            show:    true,
                            content: libD.jso2dom(["div#loaddistantfile.libD-ws-colors-auto libD-ws-size-auto", [
                                ["div#pane-localfile", [
                                    ["p.title", _("From your computer")],
                                    ["p", ["button", {"#": "btn"}, btnText]]
                                ]],
                                ["div#pane-distantfile", [
                                    ["p.title", textList],
                                    ["ul", {"#": "list"}]
                                ]]
                            ]], refs)
                        });

                        for (var j = 0, leng = files[letter].length; j < leng; ++j) {
                            var li = document.createElement("li");
                            var a  = document.createElement("a");

                            a.href        = "#";
                            a.onclick     = funList.bind(null, a);
                            a._file       = files[letter][j];
                            a.textContent = files[letter][j].replace(folder, "").replace(new RegExp("\\." + ext + "$"), "");

                            li.appendChild(a);
                            refs.list.appendChild(li);
                        }

                        refs.btn.onclick = function () {
                            win.close();
                            fileelem.click();
                        };
                    }

                    function lfile(fun, fail) {
                        return function (link) {
                            win.close();

                            getFile(
                                link._file,
                                fun,
                                function () {
                                    AudeGUI.notify(fail);
                                },
                                true
                            );

                            return false;
                        };
                    }

                    libD.need(["ready", "ws", "wm", "*langPack"], function () {
                        var algos = algoFile.split("\n");

                        for (var j = 0; j < algos.length; ++j) {
                            if (algos[j]) {
                                AudeGUI.Runtime.addAlgo(algos[j]);
                            }
                        }

                        algos = null;

                        if (files.q.length) {
                            document.getElementById("quiz").onclick = function () {
                                makeWindow(
                                    _("Load a Quiz"),
                                    _("Ready to use quizzes"),
                                    lfile(AudeGUI.Quiz.load, _("Loading quiz failed.")),
                                    _("Load a quiz"),
                                    "q",
                                    "quiz/",
                                    "json",
                                    AudeGUI.Quiz.fileInput
                                );
                            };
                        }

                        if (files.e.length || files.a.length) {
                            open.onclick = function () {
                                if (AudeGUI.getCurrentMode() === "program") {
                                    if (files.a.length) {
                                        makeWindow(
                                            _("Load a program"),
                                            _("Built-in algorithms"),
                                            lfile(AudeGUI.Programs.open, _("Loading program failed.")),
                                            _("Load a program"),
                                            "a",
                                            "algos/",
                                            "ajs",
                                            AudeGUI.programs.fileInput
                                        );
                                    } else {
                                        AudeGUI.programs.fileInput.click();
                                    }
                                } else if (files.e.length) {
                                    makeWindow(
                                        _("Load an automaton"),
                                        _("Examples of automaton"),
                                        lfile(AudeGUI.openAutomaton, _("Loading automaton failed.")),
                                            _("Load an automaton"),
                                        "e",
                                        "examples-automata/",
                                        "txt",
                                        AudeGUI.automatonFileInput
                                    );
                                } else {
                                    AudeGUI.programs.fileInput.click();
                                }
                            };
                        }
                    });
                }
            );
        },
        function (message, status) {
            var msg = null;

            if (message === "status") {
                msg = libD.format(_("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"), status);
            }

            if (message === "send") {
                msg = _("This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information");
            }

            AudeGUI.notify(_("Unable to get the list of predefined algorithms"), msg);
        }
    );
}(window));
