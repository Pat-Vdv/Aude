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

(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var loadingProgNot = null;
    var curAlgo = null;

    var modules = [];
    var loadedModule = {};

    function audescript2js(code, moduleName, fileName, data) {
        var res = audescript.toJS(code, moduleName, fileName);
        data.includes = res.neededModules;
        return (
            "(function (run, get_automaton, get_automata, currentAutomaton) {" +
            res.code + "})"
        );
    }

    AudeGUI.Runtime = {
        load: function () {
            curAlgo = document.getElementById("predef-algos");
        },

        run: function (fun, g, f) {
            if (fun === AudeGUI.Runtime.get_automata) {
                AudeGUI.Runtime.get_automata(g, function () {
                    AudeGUI.Results.set(f.apply(this, arguments));
                });
            } else {
                AudeGUI.Results.set(fun.apply(window, [].slice.call(arguments, 1)));
            }
        },

        addAlgo: function (algo) {
            var line = algo.split("/");
            var fname = line[0].trim();
            var descr = line[1].trim();
            var option = document.createElement("option");
            option.value = fname.replace(/\.ajs$/, "");
            option.textContent = _(descr);
            curAlgo.appendChild(option);
        },

        callWithList: function (count, callback) {
            var automata = [];

            for (var k = 0; k < count; ++k) {
                automata.push(AudeGUI.Runtime.get_automaton(AudeGUI.AutomataList.getIndex(k)));
            }

            /*jshint validthis: true */
            callback.apply(this, automata);
        },

        get_automaton: function (i) {
            if (isNaN(i)) {
                return null;
            }

            var A = null;

            try {
                A = AudeGUI.mainDesigner.getAutomaton(i);
            } catch (e) {
                console.error(e);
                throw new Error(libD.format(_("get_automaton: automaton n°{0} could not be understood."), JSON.stringify(i)));
            }

            if (!A) {
                throw new Error(libD.format(_("get_automaton: automaton n°{0} doesn’t exist or doesn’t have an initial state."), JSON.stringify(i)));
            }

            return A;
        },

        get_automata: function (count, callback) {
            if (AudeGUI.AutomataList.length() < count) {
                AudeGUI.AutomataList.show(count, callback);
            } else {
                AudeGUI.Runtime.callWithList(count, callback);
            }
        },

        runProgram: function (code, moduleName) {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            AudeGUI.Runtime.runProgramCode(
                code,
                moduleName || "<program>",
                AudeGUI.Runtime.run,
                AudeGUI.Runtime.get_automaton,
                AudeGUI.Runtime.get_automata
            );
        },

        launchPredefAlgo: function () {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            if (curAlgo.value === "id") {
                AudeGUI.Results.set(AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex));
                return;
            }

            if (modules[curAlgo.value]) {
                AudeGUI.Runtime.runProgram(modules[curAlgo.value], curAlgo.value);
            } else {
                loadingProgNot = libD.notify({
                    type: "info",
                    content: (_("Loading program, please wait...")),
                    closable: false,
                    delay: 500
                });

                AudeGUI.Runtime.loadModule(curAlgo.value, AudeGUI.Runtime.launchPredefAlgo);
            }
        },

        loadIncludes: function (includes, callback) {
            for (var i = 0; i < includes.length; i++) {
                if (!modules[includes[i]]) {
                    AudeGUI.Runtime.loadModule(
                        includes[i],
                        AudeGUI.Runtime.loadIncludes.bind(null, includes, callback)
                    );
                    return;
                }

                if (!audescript.m(includes[i])) {
                    AudeGUI.Runtime.loadLibrary(modules[includes[i]], includes[i]);
                }
            }

            if (callback) {
                callback();
            }
        },

        loadLibrary: function (code, moduleName) {
            AudeGUI.Runtime.runProgramCode(
                code,
                moduleName || "<program>",
                libD.none,
                libD.none,
                libD.none
            );
        },

        replaceStackLine: function (stackLine) {
            return stackLine.replace(/eval at .*\(.*\),[\s]+/, "").replace(/@(file|https?|ftps?|sftp):\/\/.+> eval:/, " ");
        },

        cleanStack: function (stack) {
            var stackLines = stack.split("\n");
            var res = "";
    //         var oldRes = "";
            for (var i = 0; i < stackLines.length; i++) {
                if (i === 0 && stackLines[0].match(/^[a-zA-Z]*Error:/)) {
                    continue;
                }

                if (stackLines[i].match(/^[\s]*at run/) || stackLines[i].match(/^run(ProgramCode)?@/)) {
                    break;
                }

                var line = AudeGUI.Runtime.replaceStackLine(stackLines[i]);
                if (line.match(/^\s*\d+:\d+\s*$/)) {
                    break;
                }
    //             oldRes = res;
                res += (res ? "\n" : "") + line;
            }

    //         return oldRes;
            return res;
        },

        runProgramCode: function (f, moduleName, run, get_automaton, get_automata) {
            if (loadingProgNot) {
                loadingProgNot.close(true);
                loadingProgNot = null;
            }

            try {
                var res = f(
                    run,
                    get_automaton,
                    get_automata,
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
                            e.toString() + "\n" + AudeGUI.Runtime.cleanStack(e.stack)
                        ]
                    )
                });
                throw e;
            }
        },

        loadAudescriptCode: function (moduleName, audescriptCode, callback) {
            var data = {};
            var includes = null;
            var code = null;

            try {
                code = eval(audescript2js(audescriptCode, moduleName, moduleName + ".ajs", data));

                includes = data.includes;
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

            AudeGUI.Runtime.loadIncludes(
                includes,
                function () {
                    if (moduleName) {
                        modules[moduleName] = code;
                    }

                    callback(code);
                }
            );
        },

        loadModule: function (moduleName, callback) {
            if (modules[curAlgo.value]) {
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

            getFile(
                "algos/" + moduleName + ".ajs?" + Date.now(),
                function (f) {
                    AudeGUI.Runtime.loadAudescriptCode(moduleName, f, function () {
                        var m = loadedModule[moduleName];
                        while (m.length) {
                            (m.pop())();
                        }
                    });
                },
                function (message, status) {
                    var msg = null;

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
        },

        loadAS: function (code) {
            if (loadingProgNot) {
                loadingProgNot.close(true);
            }

            loadingProgNot = libD.notify({
                type: "info",
                content: (_("Loading program, please wait...")),
                closable: false,
                delay: 1000
            });

            AudeGUI.Runtime.loadAudescriptCode(null, code, AudeGUI.Runtime.runProgram);
        }
    };

    //FIXME
    pkg.heap = function (a) {
        Object.defineProperty(a, "top", {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function () {
                return a[a.length - 1];
            }
        });

        return a;
    };
}(window));
