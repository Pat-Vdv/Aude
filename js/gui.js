/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */
/*
    Copyright (c) Raphaël Jakse (Université Joseph Fourier), 2013

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


/*jslint browser: true, ass: true, indent: 4, nomen:true, vars:true, newcap:true, plusplus:true, regexp: true */
/*jshint multistr:true*/
/*eslint-env browser*/
/*eslint no-underscore-dangle:0, no-alert:0*/
/*global Set:false, FileReader:false, libD:false, AutomataDesigner:false, Automaton:false, automataMap:false, MathJax:false, Viz:false, automaton2dot:false, HTMLElement:false, js18Supported: false, Audescript:false, getFile:false, automaton2dot_standardizedString:false, saveAs:false, Blob:false, automaton_code, listenMouseWheel:false, CodeMirror:false, AutomataDesignerGlue:false, read_automaton:false, automataAreEquivalent:false, regexToAutomaton:false, object2automaton:false, epsilon*/

// NEEDS : automatadesigner.js, automata.js, saveAs, automaton2dot.js, automataJS.js

(function () {
    "use strict";

    var enableAutoHandlingError = false,
        automatonResult         = null,
        blockResult             = false,
        waitingFor              = new Set(),
        launchAfterImport       = false,
        deferedResultShow       = false,
        freader                 = new FileReader(),
        resultToLeft            = document.createElement("button"),
        zoom                    = {svgZoom: 1},
        automatoncodeedit,
        automatonFileName,
        programFileName,
        fileautomaton,
        fileprogram,
        offsetError,
        switchmode,
        startQuiz,
        filequiz,
        leftPane,
        splitter,
        codeedit,
        curAlgo,
        results,
        content,
        toolbar,
        open,
        quiz,
        head,
        not,
        sw,
        cm;

    var _ = window.AutomataGuil10n = libD.l10n();

    AutomataDesigner.getValueFunction = function (s) {
        try {
            var v = Set.prototype.getValue(s, automataMap);
            return v;
        } catch (e) {
            return s;
        }
    };

    AutomataDesigner.getStringValueFunction = function (s) {
        try {
            Set.prototype.getValue(s, automataMap); // s is a legal value
            return s;
        } catch (e) {
            return JSON.stringify(s); // turn into string
        }
    };

    function notify(title, content, type) {
        if (!not || !not.displayed) {
            not = new libD.Notify({closeOnClick: true});
        }
        not.setTitle(title);
        not.setDescription(content);
        not.setType(type);
    }

    function splitterMove(e) {
        var width = document.body.offsetWidth;
        splitter.style.left = (e.clientX * 100 / width) + "%";
        leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
        results.style.left =  ((e.clientX + sw) * 100 / width) + "%";
        AutomataDesigner.redraw();
        if (zoom.redraw) {
            zoom.redraw();
        }
    }

    function onResize() {
        var width = document.body.offsetWidth;

        if (sw) {
            results.style.left =  ((splitter.offsetLeft + sw) * 100 / width) + "%";
        }

        content.style.top  = toolbar.offsetHeight + "px";
        AutomataDesigner.redraw();

        if (zoom.redraw) {
            zoom.redraw();
        }
    }

    function enableResults() {
        if (!sw) {
            if (switchmode.value === "program") {
                deferedResultShow = true;
                return;
            }
            results.classList.remove("disabled");
            splitter.classList.remove("disabled");
            sw = splitter.offsetWidth;
            splitterMove({clientX: splitter.offsetLeft});
            AutomataDesigner.userZoom(zoom);
            onResize();
        }
    }

    function textFormat(text, node, html) {
        if (!node) {
            node = document.createElement("span");
        }
        node[html ? "innerHTML" : "textContent"] = text instanceof Array ? text.join("") : text;
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, node]);
        return node;
    }

    function setTextResult(t, dontNotify) {
        automatonResult = null;
        enableResults();
        var res = document.createElement("pre");
        res.textContent = t;
        results.textContent = "";
        results.appendChild(res);
        if (!dontNotify) {
            if ((not && not.displayed) || !codeedit.classList.contains("disabled")) {
                notify(_("Program Result"), res.cloneNode(true), "normal");
            }
        }
    }

    function setNodeResult(n, dontNotify) {
        automatonResult = null;
        enableResults();
        results.textContent = "";
        results.appendChild(n);
        if (!dontNotify) {
            if ((not && not.displayed) || !codeedit.classList.contains("disabled")) {
                notify(_("Program Result"), n.cloneNode(true), "normal");
            }
        }
    }

    function automaton2svg(A) {
        return Viz(automaton2dot(A), "svg").replace(/<\?[\s\S]*?\?>/g, "").replace(/<![\s\S]*?>/g, "");
    }

    function setAutomatonResult(A) {
        enableResults();
        automatonResult = A;
        var svgCode = automaton2svg(A);

        results.innerHTML = "<div id='results-tb'></div>" + svgCode;
        results.firstChild.appendChild(resultToLeft);
        if ((not && not.displayed) || !codeedit.classList.contains("disabled")) {
            notify(_("Program Result"), svgCode, "normal");
        }
        zoom.svgNode = results.querySelector("svg");
        if (zoom.redraw) {
            zoom.redraw();
        }
    }

    function setResult(res) {
        if (res instanceof Automaton) {
            setAutomatonResult(res);
        } else if (HTMLElement && res instanceof HTMLElement) {
            setNodeResult(res);
        } else if (res) {
            setTextResult(res.toString());
        } else {
            if (res === undefined) {
                setTextResult("undefined");
            } else if (res === null) {
                setTextResult("null");
            } else {
                setTextResult(res);
            }
        }

        var svg = results.querySelector("svg");
        if (svg) {
            zoom.svgNode = svg;
            results.style.overflow = "hidden";
            if (zoom.redraw) {
                zoom.redraw();
            }
        } else {
            zoom.svgNode = null;
            results.style.overflow = "";
        }
    }

    function openAutomaton(code) {
        if (typeof code === "string") {
            automatoncodeedit.value = code;
            AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
            return;
        }

        freader.onload = function () {
            openAutomaton(freader.result);
        };

        freader.readAsText(fileautomaton.files[0], "utf-8");
        automatonFileName = fileautomaton.value;
    }

    function loadQuiz(code) {
        try {
            startQuiz(JSON.parse(code));
        } catch (e) {
            notify(_("Loading the quiz failed"), (libD.format(_("The quiz seems to be malformed: {0}"), e.message, "error")));
            throw e;
        }
    }

    function openProgram(code) {
        if (typeof code === "string") {
            cm.setValue(code);
            return;
        }

        freader.onload = function () {
            openProgram(freader.result);
        };
        freader.readAsText(fileprogram.files[0], "utf-8");
        programFileName = fileprogram.value;
    }

    function handleError(message, line, stack, char) {
        var errorText  = message + (
                stack ? _("\nStack trace: \n") + stack
                      : ""
            ),
            errorTitle;

        if (char) {
            errorTitle = libD.format(_("Error on line {0}, character {1}"), line, char);
        } else {
            errorTitle = libD.format(_("Error on line {0}"), line);
        }

        notify(errorTitle, errorText.replace(/\n/g, "<br />").replace(/ {2}/g, "  "), "error");
        setTextResult(errorTitle + "\n" + errorText, true);
    }


    function launchUserProgram(userProgram) {
        blockResult = false;
        window.currentAutomaton = AutomataDesigner.currentIndex;

        var res;

        try {
            res = userProgram(window.reallyRun);
        } catch (e) {
            if (e instanceof Error && e.stack) {
                var details, i, len, stack = e.stack.split("\n");
                for (i = 0, len = stack.length; i < len; ++i) {
                    if (stack[i].match(location.href + ":")) {
                        details = stack[i].match(/:([0-9]+)(?::([0-9]+))?/);
                        if (details) {
                            handleError(e.message, parseInt(details[1], 10) - offsetError, e.stack, details[2]);
                        } else {
                            handleError(e.message, e.lineNumber - offsetError, e.stack);
                        }
                        return;
                    }
                }
                handleError(e.message || e, e.lineNumber);
            } else {
                handleError(e.message || e, e.ineNumber);
            }
            return;
        }

        if (blockResult) {
            blockResult = false;
        } else {
            setResult(res);
        }
    }

    window.getScriptFailed = function (includeName, includer, reason) {
        handleError(libD.format(_("Error: import of {0} in {2} failed: '{1}'."), includeName, reason, includer));
    };

    window.AutomatonGlue = {
        getScript: function (includeName, includer) {
            if (includeName.match(/^(?:[a-z]+:(?:\\|\/\/?)|\/)/)) { // absolute path
                handleError(libD.format(_("Error: import: absolute paths are not supported in this version (in '{0}')'"), includer));
            } else {
                window.getFile(
                    "algos/" + includeName,
                    function (data) {
                        window.gotScript(includeName, data);
                    },
                    function (message, status) {
                        if (message === "status") {
                            message = libD.format(_("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"), status);
                        }

                        window.getScriptFailed(includeName, includer, message);
                    },
                    true
                );
            }
        }
    };

    function getScript(includeName, includer) {
        if (waitingFor.contains(includeName)) {
            return;
        }

        if (includeName[0] === "'") {
            includeName = includeName.replace(/"/g, "\\\"");
            includeName = includeName.substr(1, includeName.length - 1);
        }
        if (includeName[0] === "\"") {
            try {
                includeName = JSON.parse(includeName); // should not happen
            } catch (e) {
                handleError(libD.format(_("Syntax error: bad import parameter in {0}"), includer));
                return;
            }
        }
        if (includeName.length < 4 || includeName.substr(includeName.length - 4) !== ".ajs") {
            includeName += ".ajs";
        }
        waitingFor.add(includeName);
        window.AutomatonGlue.getScript(includeName, includer);
    }

    function handleImports(includes, includer) {
        var i, len;
        for (i = 0, len = includes.length; i < len; ++i) {
            getScript(includes[i], includer);
        }
    }

    function loadProgram(code) {
        var script   = document.getElementById("useralgo"),
            includes = [];

        if (script) {
            head.removeChild(script);
        }

        waitingFor.empty();
        window.userProgram = null;
        script = document.createElement("script");
        script.id = "useralgo";

        if (js18Supported) {
            script.type = "text/javascript;version=1.8";
        }

        script.textContent = "function userProgram(run) {'use strict';\n" + Audescript.toPureJS(code, includes) + "\n}";
        enableAutoHandlingError = "user's program";
        head.appendChild(script);
        enableAutoHandlingError = false;
        handleImports(includes, "user's program");
    }

    function execProgram(code) {
        if (code) {
            loadProgram(code);
        }

        if (window.userProgram && waitingFor.isEmpty()) {
            launchUserProgram(window.userProgram);
        } else {
            launchAfterImport = true;
        }
    }

    window.onselectstart = window.ondragstart = function (e) {
        e.preventDefault();
        return false;
    };

    if (!window.Viz && window.Module) { // Viz glue
        var gv = window.Module.cwrap("graphvizjs", "string", ["string", "string", "string"]);
        window.Viz = function (inputDot, outputFormat) {
            return gv(inputDot, "dot", outputFormat);
        };
    }

    if (!window.AutomataDesignerGlue) {
        window.AutomataDesignerGlue = {};
    }

    function automatonJSLoaded() {
        window.onerror = function (message, url, lineNumber) {
            /*jslint unparam:true*/
            if (enableAutoHandlingError) {
                if (offsetError > -1) {
                    handleError(message + (typeof enableAutoHandlingError === "string" ? "(in " + enableAutoHandlingError + ")" : ""), lineNumber - offsetError);
                } else {
                    offsetError = lineNumber - 1;
                }
                return true;
            }
        };
        offsetError = -1;
        loadProgram(":");
    }

    getFile("algos/list.txt",
        function (algoFile) {
            getFile(
                "dirlist.txt",
                function (dirlist) {

                    dirlist = dirlist.split("\n");

                    var files = {
                        a: [],
                        q: [],
                        e: []
                    };

                    var win, langFound, i, len = false;

                    for (i = 0, len = dirlist.length; i < len; ++i) {
                        if (dirlist[i]) {
                            if (dirlist[i][0] === "l") { // l10n
                                if (libD.lang === dirlist[i].split("/")[2].split(".")[0]) {
                                    langFound = true;
                                    break;
                                }
                            } else {
                                files[dirlist[i][0]].push(dirlist[i]);
                            }
                        }
                    }

                    dirlist = null;

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
                        var refs = {}, a, li, j, leng;

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
                            content: libD.jso2dom(["div#loaddistantfile.libD-ws-colors-auto", [
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

                        for (j = 0, leng = files[letter].length; j < leng; ++j) {
                            li = document.createElement("li");
                            a  = document.createElement("a");

                            a.href        = "#";
                            a.onclick     = funList;
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
                        return function () {
                            win.close();

                            getFile(
                                this._file,
                                fun,
                                function () {
                                    notify(fail);
                                },
                                true
                            );

                            return false;
                        };
                    }

                    libD.need(["ready", "ws", "wm", "*langPack"], function () {
                        curAlgo  = document.getElementById("predef-algos");
                        open     = document.getElementById("open");
                        quiz     = document.getElementById("quiz");
                        filequiz = document.getElementById("filequiz");

                        var j, line, fname, descr, algos = algoFile.split("\n");

                        for (j = 0; j < algos.length; ++j) {
                            if (algos[j]) {
                                line = algos[j].split("/");
                                fname = line[0].trim();
                                descr = line[1].trim();
                                line = document.createElement("option");
                                line.value = fname;
                                line.textContent = _(descr);
                                curAlgo.appendChild(line);
                            }
                        }

                        algos = null;

                        if (files.q.length) {
                            quiz.onclick = function () {
                                makeWindow(
                                    _("Load a Quiz"),
                                    _("Ready to use quizzes"),
                                    lfile(loadQuiz, _("Loading quiz failed.")),
                                    _("Load a quiz"),
                                    "q",
                                    "quiz/",
                                    "json",
                                    filequiz
                                );
                            };
                        }

                        if (files.e.length || files.a.length) {
                            open.onclick = function () {
                                if (switchmode.value === "program") {
                                    if (files.a.length) {
                                        makeWindow(
                                            _("Load a program"),
                                            _("Built-in algorithms"),
                                            lfile(openProgram, _("Loading program failed.")),
                                            _("Load a program"),
                                            "a",
                                            "algos/",
                                            "ajs",
                                            fileprogram
                                        );
                                    } else {
                                        fileprogram.click();
                                    }
                                } else if (files.e.length) {
                                    makeWindow(
                                        _("Load an automaton"),
                                        _("Examples of automaton"),
                                        lfile(openAutomaton, _("Loading automaton failed.")),
                                        _("Load an automaton"),
                                        "e",
                                        "examples-automata/",
                                        "txt",
                                        fileautomaton
                                    );
                                } else {
                                    fileprogram.click();
                                }
                            };
                        }
                    });
                }
            );
        },
        function (message, status) {
            if (message === "status") {
                message = libD.format(_("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"), status);
            }
            notify(_("Unable to get the list of predefined algorithms"), message);
        });

    libD.need(["ready", "notify", "wm", "ws", "jso2dom", "*langPack"], function () {
        AutomataDesigner.standardizeStringValueFunction = automaton2dot_standardizedString;
        AutomataDesigner.prompt = (function () {
            var refs = {},
                win,
                func,
                winContent = libD.jso2dom(
                    ["div.libD-ws-colors-auto",
                        [
                            ["div", ["label", {"#": "descr", "for": "window.prompt-input", "style": "white-space:pre-wrap"}]],
                            ["div", {style: "display:table;width:100%"},
                                ["div", {style: "display:table-row"},
                                    [
                                        ["div", {style: "display:table-cell;width:100%"}, ["input#window.prompt-input", {"#": "input", type: "text", style: "width:100%"}]],
                                        ["div",  {style: "display:table-cell"},
                                            [
                                                ["input", {"#": "ok", type: "button", value: _("OK")}]
                                            ]]]]]]],
                    refs
                );

            function close() {
                if (func) {
                    func(null);
                }
            }
            refs.ok.onclick = function () {
                func(refs.input.value);
                func = null;
                win.close();
            };
            refs.input.onkeydown = function (e) {
                if (e.keyCode === 13) {
                    refs.ok.onclick();
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }

                if (e.keyCode === 27) {
                    win.close();
                    return false;
                }
            };

            return function (title, descr, def, fun) {
                func = fun;

                if (!win || !win.ws) {
                    win = libD.newWin({
                        content:     winContent,
                        minimizable: false,
                        center:      true
                    });

                    win.addEvent("close", close);
                    win.ws.wm.handleSurface(win, winContent);
                }

                win.show();
                win.setTitle(title);
                refs.descr.textContent = descr;
                refs.input.value = def;
                refs.input.select();
            };
        }());

        head = document.querySelector("head");

        if (window.js18Supported) {
            libD.jsLoad("js/setIterators.js", automatonJSLoaded, "application/javascript;version=1.8");
        } else {
            automatonJSLoaded();
        }

        AutomataDesigner.load();
        var automataListClose = document.getElementById("automata-list-chooser-close"),
            automataListIntro = document.getElementById("automata-list-chooser-intro"),
            automataListDiv   = document.getElementById("automata-list-chooser"),
            automataListBtn   = document.getElementById("automata-list-chooser-btn"),
            automataListUL    = document.getElementById("automata-list-chooser-content"),
            automataContainer = document.getElementById("automata-container"),
            automatonMinus    = document.getElementById("automaton_minus"),
            automataNumber    = document.getElementById("n_automaton"),
            automatoncode     = document.getElementById("automatoncode"),
            automatonPlus     = document.getElementById("automaton_plus"),
            automataedit      = document.getElementById("automataedit"),
            exportResult      = document.getElementById("export_result"),
            drawToolbar       = document.getElementById("draw-toolbar"),
            executeBtn        = document.getElementById("execute"),
            exportBtn         = document.getElementById("export"),
            wordDiv           = document.getElementById("word"),
            divQuiz           = document.getElementById("div-quiz"),
            saveas            = document.getElementById("saveas"),
            save              = document.getElementById("save"),
            localStorage      = window.localStorage || {},
            salc_cur_automaton  = -1,
            executionTimeout    = 0,
            automatonCount      = 0,
            automataList        = [],
            exportFN            = "",
            predefAlgoFunctions = [],
            nextLoadIsPrefefAlgo,
            loadPredefAlgoAfterImport = null,
            CURRENT_FINAL_STATE_COLOR            = localStorage.CURRENT_FINAL_STATE_COLOR || "rgba(90, 160, 0, 0.5)",
            CURRENT_TRANSITION_COLOR             = localStorage.CURRENT_TRANSITION_COLOR  || "#BD5504",
            CURRENT_STATE_COLOR                  = localStorage.CURRENT_STATE_COLOR       || "#FFFF7B",
            STATE_REFUSED                        = localStorage.STATE_REFUSED             || "rgba(255, 50, 50, 0.5)",
            CURRENT_TRANSITION_PULSE_TIME_FACTOR = parseFloat(localStorage.CURRENT_TRANSITION_PULSE_TIME_FACTOR) || 0.6,
            EXECUTION_STEP_TIME                  = parseInt(localStorage.EXECUTION_STEP_TIME, 10),
            CURRENT_TRANSITION_PULSE_TIME_STEP   = 600,
            HAND_STEP_TIME                       = 250,
            executeWin,
            execute;

        if (isNaN(EXECUTION_STEP_TIME)) {
            EXECUTION_STEP_TIME = 1200;
        }

        automatoncodeedit = document.getElementById("automatoncodeedit");
        results           = zoom.svgContainer = document.getElementById("results");
        splitter          = document.getElementById("splitter");
        leftPane          = document.getElementById("left-pane");
        content           = document.getElementById("content");
        toolbar           = document.getElementById("toolbar");
        switchmode        = document.getElementById("switchmode");
        codeedit          = document.getElementById("codeedit");
        fileautomaton     = document.getElementById("fileautomaton");
        fileprogram       = document.getElementById("fileprogram");

        var exportResultFN     = _("automaton.txt"),
            exportResultTextFN = _("result.txt");

        resultToLeft.appendChild(libD.jso2dom([
            ["img", {alt: "", src: "icons/oxygen/16x16/actions/arrow-left.png"}],
            ["span", _("This automaton into the editor")]
        ]));

        (function () {
            var divWelcome = document.createElement("div");
            divWelcome.id = "welcome";
            divWelcome.innerHTML = libD.format(_(
                "<h2>Welcome to {0}.</h2>" +
                    "<p>Here is the area where you can <strong>draw automata</strong>.</p>" +
                    "<ul>" +
                    "    <li>To add a <strong>new state</strong>, double-click at the place where you want the state to be.</li>" +
                    "    <li>To add a <strong>new transition</strong>, Shift+click on the start state then click on the destination state.</li>" +
                    "    <li>To <strong>rename</strong> a state, to <strong>modify symbols</strong> of a transition, double-click on it.</li>" +
                    "    <li>To set a state as the <strong>initial</strong> state, ctrl+right click on the state.</li>" +
                    "    <li>To set a state as <strong>(non-)accepting</strong>, right-click on it.</li>" +
                    "    <li>To <strong>remove</strong> a state or a transition, ctrl-click on it.</li>" +
                    "</ul>" +
                    "<p>You can <strong>access to these instructions</strong> at any time by clicking the <img alt=\"\" src=\"icons/oxygen/16x16/actions/draw-brush.png\" /><b style=\"color:black;font-size:small\">?</b> toolbar icon.</p>" +
                    "<p>When running a program or an algorithm, the <strong>result</strong> will appear <strong>at the right side</strong> of the screen.</p>" +
                    "<p>To load a quiz, click on the \"Load a Quiz\" toolbar button. You can keep on using all the features of the program, like running algorithms, during the quiz whenever it is possible to draw an automaton.</p>" +
                    "<p>To hide this text, click on it.</p>" +
                    "<p> Enjoy yourself!</p>"
            ), "Aude");

            AutomataDesigner.svgContainer.parentNode.appendChild(divWelcome);
            function hideWelcome() {
                AutomataDesigner.svgContainer.parentNode.removeChild(divWelcome);
                document.body.removeEventListener("click", hideWelcome, false);
            }
            document.body.addEventListener("click", hideWelcome, false);
        }());

        function stopExecution(index) {
            if (executionTimeout) {
                clearTimeout(executionTimeout);
                executionTimeout = 0;
                wordDiv.textContent = "";
                AutomataDesigner.cleanSVG(index);
            }
        }

        window.addEventListener("keydown", function (e) {
            if (e.ctrlKey || e.metaKey) {
                if (e.keyCode === 83) {
                    save.onclick();
                    e.preventDefault();
                    return false;
                }
                if (e.keyCode === 69) {
                    if (e.shiftKey) {
                        exportResult.onclick();
                    } else {
                        exportBtn.onclick();
                    }
                    e.preventDefault();
                    return false;
                }
            }
        });

        executeBtn.onclick = function () {
            enableResults();
            if (!executeWin || !executeWin.ws) {
                var refs = {};
                executeWin = libD.newWin({
                    minimizable: false,
                    title:       _("Execute the current automaton with a word"),
                    right:       results.offsetWidth  + 10,
                    top:         toolbar.offsetHeight + 5,
                    content:     libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                        ["div", {"#": "root"}, ["label", [
                            ["#", _("Word: ")],
                            ["input", {type: "text", "#": "word"}],
                            ["input", {type: "button", value: _("Run"),  "#": "run"}],
                            ["input", {type: "button", value: _("Step"), "#": "step"}]
                        ]]],
                        ["div", ["label", [
                            ["#", _("Delay between steps (ms): ")],
                            ["input", {type: "text", "#": "delay", value: EXECUTION_STEP_TIME}]
                        ]]]
                    ]], refs)
                });
                executeWin.__refs = refs;
                executeWin.addEvent("close", function () {
                    wordDiv.textContent = "";
                    AutomataDesigner.cleanSVG(AutomataDesigner.currentIndex);
                });
                libD.wm.handleSurface(executeWin, refs.root);
                refs.run.onclick = function () {
                    stopExecution();
                    AutomataDesigner.cleanSVG(AutomataDesigner.currentIndex);
                    refs.delay.onchange();
                    execute(false, refs.word.value, AutomataDesigner.currentIndex);
                };

                refs.step.onclick = function () {
                    if (executionTimeout) {
                        clearTimeout(executionTimeout);
                        execute(true);
                    } else {
                        execute(true, refs.word.value, AutomataDesigner.currentIndex);
                    }
                };

                refs.delay.onchange = function () {
                    EXECUTION_STEP_TIME = parseInt(refs.delay.value, 10);
                    if (isNaN(EXECUTION_STEP_TIME)) {
                        EXECUTION_STEP_TIME = localStorage.EXECUTION_STEP_TIMEv;
                    }
                    localStorage.EXECUTION_STEP_TIME = EXECUTION_STEP_TIME;
                };

                refs.word.onkeypress = function (e) {
                    if (e.keyCode === 13) {
                        refs.run.onclick();
                    }
                };
            }
            executeWin.show();
            executeWin.__refs.word.focus();
        };

        exportBtn.onclick = function () {
            var fn = window.prompt(_("Which name do you want to give to the exported image? (give a .dot extension to save as dot format, .svg to save as svg)"), exportFN);

            if (fn) {
                exportFN = fn;

                if (switchmode.value === "design") {
                    automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, false);
                } else {
                    AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
                }

                if (fn.length > 4 && fn.substr(fn.length - 4) === ".svg") {
                    saveAs(new Blob([AutomataDesigner.getSVG(AutomataDesigner.currentIndex)], {type: "text/plain;charset=utf-8"}), fn);
                } else {
                    var A = AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex);
                    if (A) {
                        saveAs(new Blob([automaton2dot(A)], {type: "text/plain;charset=utf-8"}), fn);
                    } else {
                        notify(_("There is no automaton to save."));
                    }
                }
            }
        };

        document.getElementById("draw-toolbar-btn").onclick = function () {
            drawToolbar.classList.toggle("disabled");
            onResize();
        };


        (function () {
            function buttonClick(e) {
                notify(e.currentTarget.textContent, _(e.currentTarget.value), "info");
            }

            var i, len, drawToolbarButtons = drawToolbar.querySelectorAll("button");

            for (i = 0, len = drawToolbarButtons.length; i < len; ++i) {
                drawToolbarButtons[i].onclick = buttonClick;
            }
        }());

        document.getElementById("redraw").onclick = function () {
            automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, true);
            if (automatoncodeedit.value) {
                AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
            }
        };

        exportResult.onclick = function () {
            var fn;
            if (automatonResult) {
                fn = window.prompt(_("Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)"), exportResultFN);

                if (fn) {
                    exportResultFN = fn;
                    var format = ".txt";
                    if (fn.length > 4) {
                        format = fn.substr(fn.length - 4);
                    }

                    switch (format) {
                    case ".svg":
                        saveAs(new Blob([AutomataDesigner.outerHTML(results.querySelector("svg"))], {type: "text/plain;charset=utf-8"}), fn);
                        break;
                    case ".dot":
                        saveAs(new Blob([automaton2dot(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                        break;
                    default:
                        saveAs(new Blob([automaton_code(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                    }
                }
            } else {
                fn = window.prompt(_("Which name do you want to give to the exported text file?"), exportResultTextFN);

                if (fn) {
                    exportResultTextFN = fn;
                    saveAs(new Blob([results.textContent], {type: "text/plain;charset=utf-8"}), fn);
                }
            }
        };

        splitter.onmousedown = function () {
            window.onmousemove = splitterMove;
            window.onmouseup = function () {
                window.onmousemove = null;
            };
        };

        window.addEventListener("resize", onResize, false);

        function callWithList(count, callback) {
            var k, automata = [];

            for (k = 0; k < count; ++k) {
                automata.push(window.get_automaton(automataList[k]));
            }

            /*jshint validthis: true */
            callback.apply(this, automata);
        }

        automataListUL.onmouseover = function () {
            if (salc_cur_automaton === -1) {
                salc_cur_automaton = AutomataDesigner.currentIndex;
            }
        };

        function automataListClick(e) {
            if (e.currentTarget.lastChild.textContent) {
                var j = parseInt(e.currentTarget.lastChild.textContent, 10);
                e.currentTarget.lastChild.textContent = "";
                automataList.splice(j, 1);

                var k, lastChild, l;

                for (l = 0; l < automatonCount; ++l) {
                    lastChild = automataListUL.childNodes[l].firstChild.lastChild;
                    k = parseInt(lastChild.textContent, 10);

                    if (k >= j) {
                        lastChild.textContent = k - 1;
                    }
                }
            } else {
                e.currentTarget.lastChild.textContent = automataList.length;
                automataList.push(e.currentTarget._index);
            }
        }

        function automataListMouseOver(e) {
            if (salc_cur_automaton !== -1) {
                AutomataDesigner.setCurrentIndex(e.currentTarget._index);
            }
        }

        function showAutomataListChooser(count, callback) {
            if (callback || automataListBtn.onclick) {
                automataListBtn.classList.remove("disabled");
                if (callback) {
                    automataListIntro.innerHTML = libD.format(_("The algorithm you want to use needs {0} automata. Please select these automata in the order you want and click \"Continue execution\" when you are ready."), count);
                    automataListBtn.onclick = function () {
                        if (automataList.length < count) {
                            window.alert(libD.format(_("You didn’t select enough automata. Please select {0} automata."), count));
                            return;
                        }
                        automataListClose.onclick();
                        automataListBtn.onclick = null;
                        callWithList(count, callback);
                    };
                }
            } else {
                automataListBtn.classList.add("disabled");
                automataListIntro.textContent = _("You can choose the order in which automata will be used in algorithms.");
                count = 0;
            }

            automataListUL.textContent = "";
            var k, li, a, number, indexInList;

            for (k = 0; k < automatonCount; ++k) {
                li = document.createElement("li");
                a  = document.createElement("a");
                a.href = "#";
                a._index = k;
                indexInList = automataList.indexOf(k);
                number = document.createElement("span");
                number.className = "automaton-number";

                if (indexInList !== -1) {
                    number.textContent = indexInList;
                }

                a.onclick = automataListClick;

                a.onmouseover = automataListMouseOver;

                a.appendChild(document.createElement("span"));
                a.lastChild.textContent = libD.format(_("Automaton #{0}"), k);
                a.appendChild(number);
                li.appendChild(a);
                automataListUL.appendChild(li);
            }

            automataListDiv.classList.remove("disabled");
        }

        window.get_automaton = function (i) {
            if (isNaN(i)) {
                return undefined;
            }

            var A = AutomataDesigner.getAutomaton(i);

            if (automataNumber <= i || !A) {
                throw new Error(libD.format(_("get_automaton: Automaton n°{0} doesn’t exist or doesn’t have an initial state."), JSON.stringify(i)));
            }

            return A;
        };

        window.get_automatons = function (count, callback) {
            if (automataList.length < count) {
                showAutomataListChooser(count, callback);
            } else {
                callWithList(count, callback);
            }
        };

        function automatonSetNumber(index) {
            AutomataDesigner.setCurrentIndex(index);
            automatoncodeedit.value = AutomataDesigner.getAutomatonCode(index, false);
        }

        switchmode.onchange = function () {
            switch (this.value) {
            case "program":
                toolbar.className = "algomode";
                codeedit.classList.remove("disabled");
                automataedit.classList.add("disabled");

                if (!cm) {
                    cm = CodeMirror(codeedit, {
                        lineNumbers:   true,
                        electricChars: true,
                        indentUnit:    3,
                        tabMode:       "spaces",
                        tabSize:       3
                    });

                    var codemirrorNode = cm.getWrapperElement();

                    listenMouseWheel(function (e, delta) {
                        if (e.ctrlKey || e.metaKey) {
                            var fs = parseFloat(window.getComputedStyle(codemirrorNode, null).fontSize);
                            codemirrorNode.style.fontSize = (fs + 2 * delta) + "px";
                            cm.refresh();
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                    });
                }

                onResize();
                break;
            case "design":
                if (deferedResultShow) {
                    setTimeout(enableResults, 0);
                    deferedResultShow = false;
                }

                if (cm && cm.getValue()) {
                    toolbar.className = "designmode";
                } else {
                    toolbar.className = "designmode launch-disabled";
                }

                codeedit.classList.add("disabled");
                automataedit.classList.remove("disabled");
                automatoncode.classList.add("disabled");
                AutomataDesigner.svgContainer.classList.remove("disabled");
                onResize();
                break;
            case "automatoncode":
                if (deferedResultShow) {
                    setTimeout(enableResults, 0);
                    deferedResultShow = false;
                }

                automatoncodeedit.value = AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, false);

                if (cm && cm.getValue()) {
                    toolbar.className = "designmode codemode";
                } else {
                    toolbar.className = "designmode codemode launch-disabled";
                }

                codeedit.classList.add("disabled");
                automataedit.classList.remove("disabled");
                automatoncode.classList.remove("disabled");
                AutomataDesigner.svgContainer.classList.add("disabled");
                onResize();
                break;
            }
        };

        automatoncodeedit.onchange = function () {
            if (this.value) {
                AutomataDesigner.setAutomatonCode(this.value, AutomataDesigner.currentIndex);
            }
        };

        automatonPlus.onclick = function () {
            var o = document.createElement("option");
            o.textContent = automatonCount;
            o.id = "automaton_n" + automatonCount;
            automataNumber.appendChild(o);
            automataNumber.value = automatonCount;
            AutomataDesigner.newAutomaton(automatonCount);
            automatonSetNumber(automatonCount++);

            if (!automataListDiv.classList.contains("disabled")) {
                showAutomataListChooser();
            }
        };

        automatonMinus.onclick = function () {
            if (automatonCount > 1) {
                var curAutomaton = parseInt(automataNumber.value, 10);
                automataNumber.removeChild(document.getElementById("automaton_n" + (automatonCount - 1)));
                AutomataDesigner.removeAutomaton(curAutomaton);

                if (curAutomaton === automatonCount - 1) {
                    automatonSetNumber(automataNumber.value = automatonCount - 2);
                } else {
                    automatonSetNumber(curAutomaton);
                }

                --automatonCount;
                var j, len, i = automataList.indexOf(curAutomaton);

                if (i !== -1) {
                    automataList.splice(i, 1);
                    for (j = 0, len = automataList.length; j < len; ++j) {
                        if (automataList[j] > i) {
                            --automataList[j];
                        }
                    }
                }

                if (!automataListDiv.classList.contains("disabled")) {
                    showAutomataListChooser();
                }
            }
        };

        resultToLeft.onclick = function () {
            if (automatonResult) {
                automatonPlus.onclick();
                AutomataDesigner.setSVG(results.querySelector("svg"), AutomataDesigner.currentIndex);
                automatoncodeedit.value = automaton_code(automatonResult);
            }
        };

        automataNumber.onchange = function () {
            automatonSetNumber(parseInt(automataNumber.value, 10));
        };

        document.getElementById("automaton_plus").onclick();

        document.getElementById("algo-exec").onclick = function () {
            if (cm) {
                execProgram(cm.getValue());
            }
        };

        window.run = function (f) {
            if (loadPredefAlgoAfterImport === true) {
                loadPredefAlgoAfterImport = null;
                launchUserProgram(predefAlgoFunctions[curAlgo.value] = f);
            }
        };

        window.reallyRun = function (fun, g, f) {
            blockResult = true;
            if (fun === window.get_automatons) {
                window.get_automatons(g, function () {
                    setResult(f.apply(this, arguments));
                });
            } else {
                setResult(fun.apply(window, [].slice.call(arguments, 1)));
            }
        };

        automataListDiv.querySelector("p:last-child").innerHTML = libD.format(_("This order will be used for future algorithm executions. If you want to change this order, you can call this list using the <img src=\"{0}\" /> toolbar icon.<br />Notice: Algorithms taking only one automaton work with the current automaton, they don’t use this ordering."), "icons/oxygen/16x16/actions/format-list-ordered.png");

        automataListUL.onmouseout = function (e) {
            e = e.toElement || e.relatedTarget;
            if ((e === automataListUL || e === automataListUL.parentNode) && salc_cur_automaton !== -1) {
                AutomataDesigner.setCurrentIndex(salc_cur_automaton);
                salc_cur_automaton = -1;
            }
        };

        document.getElementById("automata-list").onclick = function () { showAutomataListChooser(); };

        document.getElementById("automata-list-chooser-close").onclick = function () {
            automataListDiv.classList.add("disabled");
        };

        AutomataDesignerGlue.requestSVG = function (index) {
            AutomataDesigner.setSVG(Viz(automaton2dot(read_automaton(automatoncodeedit.value)), "svg"), index);
        };

        function automatonFromObj(o) {
            var k, A = new Automaton();

            A.setInitialState(o.states[0]);

            for (k = 1; k < o.states.length; ++k) {
                A.addState(o.states[k]);
            }

            for (k = 0; k < o.finalStates.length; ++k) {
                A.addFinalState(o.states[k]);
            }

            for (k = 0; k < o.transitions.length; ++k) {
                A.addTransition(o.transition[k][0], o.transition[k][1], o.transition[k][2]);
            }

            return A;
        }

        function openQuiz() {
            freader.onload = function () {
                loadQuiz(freader.result);
            };
            freader.readAsText(filequiz.files[0], "utf-8");
        }

        fileprogram.onchange   = openProgram;
        fileautomaton.onchange = openAutomaton;
        filequiz.onchange      = openQuiz;

        function closeQuiz() {
            automatonMinus.onclick();
            automataContainer.style.display = "";
            automataContainer.style.top     = "";
            divQuiz.textContent = "";
            divQuiz.classList.remove("enabled");
            AutomataDesigner.redraw();
            zoom.redraw();
        }

        var nextQuizQuestion;

        function nextQuestion(quiz, previous, delta) {
            return function () {
                if (delta) {
                    quiz.currentQuestion -= 2;
                }

                try {
                    nextQuizQuestion(quiz, previous);
                } catch (e) {
                    if (typeof e === "string") {
                        notify(_("Error in the Quiz"), libD.format(_("There is an error in the Quiz: {0}"), e), "error");
                    } else {
                        throw e;
                    }
                }
                return false;
            };
        }

        nextQuizQuestion = function (quiz, previousQuestion) {
            divQuiz.classList.remove("intro");
            divQuiz.classList.add("started");
            automataContainer.style.display = "none";

            var q, refs, answers, respA, i, len, possibilities, j, leng;

            if (typeof previousQuestion === "number" && previousQuestion >= 0) {
                q = quiz.questions[previousQuestion];
                var r = quiz.answers[previousQuestion];


                quiz.answers[previousQuestion].reasons = [];

                switch (q.type) {
                case "mcq":
                    answers = r.userResponse = new Set();

                    possibilities = q.possibilities;

                    for (j = 0, leng = possibilities.length; j < leng; ++j) {
                        if (quiz.currentAnswersRefs["answer-" + j].checked) {
                            answers.add(possibilities[j].hasOwnProperty("id") ? possibilities[j].id : parseInt(j, 10) + 1);
                        }
                    }

                    var diff = answers.symDiff(q.answers);

                    r.isCorrect = diff.isEmpty();
                    if (!r.isCorrect) {
                        r.reasons.push(libD.format(_("Wrong answer for {0}."), diff.getSortedList().toString()));
                    }

                    break;
                case "word":
                    respA = AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex);
                    var words = q.words,
                        regex = "";

                    r.userResponse = AutomataDesigner.getSVG(AutomataDesigner.currentIndex);

                    if (respA) {
                        for (i = 0, len = words.length; i < len; ++i) {
                            if (!respA.acceptedWord(words[i])) {
                                r.isCorrect = false;
                                r.reasons.push(
                                    words[i] ? libD.format(_("Word <i>{0}</i> is not accepted while it should be."), words[i])
                                             : _("The empty word is not accepted while it should be.")
                                );
                            }

                            if (regex) {
                                regex += "+";
                            }

                            regex += words[i].replace(/([^0-9a-zA-Z])/g, "\\$1");
                        }

                        if (!r.reasons[0]) {
                            r.isCorrect = automataAreEquivalent(regexToAutomaton(regex), respA);
                            if (!r.isCorrect) {
                                r.reasons.push(_("The given automaton accepts too many words."));
                            }
                        }
                    } else {
                        r.isCorrect = false;
                        r.reasons.push(_("Question was not answered."));
                    }
                    break;
                case "automatonEquiv":
                    respA = AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex);

                    r.userResponse = AutomataDesigner.getSVG(AutomataDesigner.currentIndex);

                    if (respA) {
                        var A;

                        if (q.automaton) {
                            try {
                                A = object2automaton(q.automaton);
                            } catch (e) {
                                throw _("Automaton given in the quiz is not correct.");
                            }
                        } else if (q.regex) {
                            try {
                                A = regexToAutomaton(q.regex);
                            } catch (e) {
                                throw _("The regex given in the quiz is not valid.");
                            }
                        } else {
                            throw _("No regular expression or automaton was given in the quiz.");
                        }

                        r.isCorrect = automataAreEquivalent(A, respA);
                        if (!r.isCorrect) {
                            if (q.examples instanceof Array) {
                                for (i = 0, len = q.examples.length; i < len; ++i) {
                                    if (!respA.acceptedWord(q.examples[i])) {
                                        r.reasons.push(
                                            q.examples[i]
                                                ? libD.format(_("Word <i>{0}</i> is not accepted while it should be."), q.examples[i])
                                                : _("The empty word is not accepted while it should be.")
                                        );
                                    }
                                }
                            }

                            if (q.counterExamples instanceof Array) {
                                for (i = 0, len = q.counterExamples.length; i < len; ++i) {
                                    if (respA.acceptedWord(q.counterExamples[i])) {
                                        r.reasons.push(
                                            q.counterExamples[i]
                                                ? libD.format(_("Word <i>{0}</i> is accepted while it shouldn’t be."), q.counterExamples[i])
                                                : _("The empty word is accepted while it shouldn’t be.")
                                        );
                                    }
                                }
                            }

                            if (!r.reasons[0]) {
                                r.reasons.push(_("The given automaton isn’t equivalent to the expected one."));
                            }
                        }
                    } else {
                        r.isCorrect = false;
                        r.reasons.push(_("Question was not answered."));
                    }
                    break;
                }
            }

            ++quiz.currentQuestion;

            if (quiz.currentQuestion >= quiz.questions.length) {
                quiz.refs.content.textContent = "";
                quiz.refs.content.appendChild(libD.jso2dom(["p", _("The Quiz is finished! Here are the details of the correction.")]));

                var question_i, reasons, li, ul;

                refs = {};

                answers = libD.jso2dom(["table#correction-table",
                    ["tr", [
                        ["th", _("Instruction")],
                        ["th", _("Correct answer?")],
                        ["th", _("Comments")]
                    ]]]);

                for (i = 0, len = quiz.answers.length; i < len; ++i) {
                    question_i = quiz.questions[i];

                    answers.appendChild(libD.jso2dom(["tr", [
                        ["td.qinst", {"#": "answerInstr"}, [
                            ["span.qid", (question_i.hasOwnProperty("id") ? question_i.id : (parseInt(i, 10) + 1)) + ". "],
                            ["div.qinstr-content"]
                        ]],
                        ["td.qstate", quiz.answers[i].isCorrect ? _("Yes") : _("No")],
                        ["td.qcmt", {"#": "answerCmt"}]
                    ]], refs));

                    reasons = quiz.answers[i].reasons;

                    if (reasons[1]) {
                        ul = document.createElement("ul");

                        for (j = 0, leng = reasons.length; j < leng; ++j) {
                            li = document.createElement("li");
                            li.innerHTML = reasons[j];
                            ul.appendChild(li);
                        }

                        refs.answerCmt.appendChild(ul);
                    } else {
                        refs.answerCmt.innerHTML = reasons[0] || "";
                    }

                    if (question_i.instructionHTML) {
                        textFormat(question_i.instructionHTML, refs.answerInstr.lastChild, true);
                    } else {
                        textFormat(question_i.instruction, refs.answerInstr.lastChild);
                    }

                    refs.answerInstr.appendChild(document.createElement("ul"));
                    refs.answerInstr.lastChild.className = "possibilities";

                    possibilities = question_i.possibilities;

                    if (possibilities) {
                        for (j = 0, leng = possibilities.length; j < leng; ++j) {
                            refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                                ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (parseInt(i, 10) + 1)) + ". "],
                                ["span", {"#": i + "content"}]
                            ]], refs));

                            if (possibilities[j].automaton) {
                                refs[i + "content"].innerHTML = automaton2svg(automatonFromObj(possibilities[j].automaton));
                            } else if (possibilities[j].html) {
                                refs[i + "content"].innerHTML = possibilities[j].html;
                            } else if (possibilities[j].text) {
                                textFormat(possibilities[j].text, refs[i + "content"]);
                            } else if (possibilities[j].html) {
                                textFormat(possibilities[j].html, refs[i + "content"], true);
                            }
                        }
                    }
                }

                quiz.refs.content.appendChild(answers);
                quiz.refs.content.appendChild(libD.jso2dom([
                    ["p", _("We are willing to don’t give you any mark. Your progress is the most important thing, above any arbitrary absolute meaningless mark. Keep your efforts ;-)")],
                    ["div.button-container", ["button", {"#": "prev"}, _("Previous page")]]
                ], refs));
                refs.prev.onclick = nextQuestion(quiz, null, true);
                return;
            }

            q = quiz.questions[quiz.currentQuestion];

            var qid = q.hasOwnProperty("id") ? q.id : (quiz.currentQuestion + 1);

            refs = {};

            quiz.currentAnswersRefs = refs;
            quiz.refs.content.textContent = "";

            quiz.refs.content.appendChild(
                libD.jso2dom([
                    ["div#quiz-question", [
                        ["span.quiz-question-id", libD.format(
                            _("Question {0}: "),
                            qid
                        )],
                        ["span", {"#": "questionContent"}]
                    ]],
                    ["div#quiz-answers", {"#": "answers"}],
                    ["div.button-container", [
                        ["button", {"#": "prev"}, _("Previous question")],
                        ["button", {"#": "ok"}, _("Next question")]
                    ]]
                ], refs)
            );

            if (q.instructionHTML) {
                textFormat(q.instructionHTML, refs.questionContent, true);
            } else {
                textFormat(q.instruction, refs.questionContent);
            }

            switch (q.type) {
            case "mcq":
                possibilities = q.possibilities;

                if (!possibilities) {
                    throw libD.format(_("Question {0} has no answers."), qid);
                }

                refs.answers.appendChild(document.createElement("ul"));

                for (j = 0, leng = possibilities.length; j < leng; ++j) {
                    qid = possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (parseInt(i, 10) + 1);
                    refs.answers.firstChild.appendChild(libD.jso2dom(["li", ["label", [
                        ["input", {"type": "checkbox", "#": "answer-" + j}],
                        ["span.quiz-answer-id", qid + ". "],
                        ["span", {"#": j + "content"}]
                    ]]], refs));

                    if (possibilities[j].automaton) {
                        refs[j + "content"].innerHTML = automaton2svg(automatonFromObj(possibilities[j].automaton));
                    } else if (possibilities[j].html) {
                        refs[j + "content"].innerHTML = possibilities[j].html;
                    } else if (possibilities[j].text) {
                        textFormat(possibilities[j].text, refs[j + "content"]);
                    } else if (possibilities[j].html) {
                        textFormat(possibilities[j].html, refs[j + "content"], true);
                    }

                    if (quiz.answers[quiz.currentQuestion].userResponse instanceof Set && quiz.answers[quiz.currentQuestion].userResponse.contains(qid)) {
                        refs["answer-" + j].checked = true;
                    }
                }
                break;
            case "word":
                refs.answers.innerHTML = "<p>" +  _("You can draw the automaton bellow.") + "</p>";
                AutomataDesigner.setSVG(quiz.answers[quiz.currentQuestion].userResponse, AutomataDesigner.currentIndex);

                setTimeout(function () {
                    automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + "px";
                    automataContainer.style.display = "";
                    AutomataDesigner.redraw();
                    zoom.redraw();
                }, 0);

                break;
            case "automatonEquiv":
                refs.answers.innerHTML = "<p>" +  _("You can draw the automaton bellow.") + "</p>";
                AutomataDesigner.setSVG(quiz.answers[quiz.currentQuestion].userResponse, AutomataDesigner.currentIndex);

                setTimeout(function () {
                    automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + "px";
                    automataContainer.style.display = "";
                    AutomataDesigner.redraw();
                    zoom.redraw();
                }, 0);

                break;
            case "program":
                break;
            case "algo":
                break;
            default:
                notify(_("Question type not known"), libD.format(_("Type of question {0} is not known. Known types are: <ul><li>\"mcq\" for multiple choices question,</li><li>\"word\" (to draw an automaton which accepts a given list of words).</li></ul>")), "error");
            }

            refs.ok.onclick = nextQuestion(quiz, quiz.currentQuestion);

            if (quiz.currentQuestion) {
                refs.prev.onclick = nextQuestion(quiz, quiz.currentQuestion, true);
            } else {
                refs.prev.style.display = "none";
            }
        };

        startQuiz = function (quiz) {
            if (switchmode.value === "program") {
                switchmode.value = "design";
                switchmode.onchange();
            }

            automataContainer.style.display = "none";
            handleImports(["equivalence", "regex2automaton", "automaton2json"], "Quiz");
            automatonPlus.onclick();

            if (!(quiz.questions && quiz.questions instanceof Array)) {
                throw new Error(_("The quiz doesn't have its list of question."));
            }

            quiz.currentQuestion = -1;

            var i, len = quiz.questions.length, a = quiz.answers = [];
            quiz.answers.length = len;

            for (i = 0, len; i < len; ++i) {
                a[i] = {
                    userResponse: null,
                    isCorrect:    false,
                    reasons:      []
                };
            }

            divQuiz.classList.add("intro");
            divQuiz.classList.remove("started");
            divQuiz.textContent = "";
            divQuiz.classList.add("enabled");

            var refs = {};
            divQuiz.appendChild(libD.jso2dom([
                ["h1#quiz-title", [
                    ["#", quiz.title ? _("Quiz: ") : _("Quiz")],
                    ["span", {"#": "quizTitleContent"}]
                ]],
                ["h2#quiz-author", {"#": "author"}],
                ["div#quiz-descr", {"#": "descr"}],
                ["a#close-quiz", {"#": "closeQuiz", "href": "#"}, _("Close the Quiz")],
                ["div#quiz-content", {"#": "content"},
                    ["div.button-container",
                        ["button", {"#": "startQuiz"}, _("Start the Quiz")]]]
            ], refs));

            textFormat(quiz.title || "", refs.quizTitleContent);
            textFormat((quiz.author || "") + (quiz.date ? " - " + quiz.date : ""), refs.author);
            textFormat(quiz.description || "", refs.descr);

            quiz.refs = refs;
            refs.closeQuiz.onclick = closeQuiz;
            refs.startQuiz.onclick = nextQuestion(quiz);
        };

        if (!quiz.onclick) {
            quiz.onclick = function () {
                filequiz.click();
            };
        }

        if (!open.onclick) {
            open.onclick = function () {
                if (switchmode.value === "program") {
                    fileprogram.click();
                } else {
                    fileautomaton.click();
                }
            };
        }

        function saveProgram(fname) {
            saveAs(new Blob([cm.getValue()], {type: "text/plain;charset=utf-8"}), fname);
        }

        function saveAutomaton(fname) {
            saveAs(new Blob([AutomataDesigner.getAutomatonCode(AutomataDesigner.currentIndex, false)], {type: "text/plain"}), fname);
        }

        saveas.onclick = function () {
            var prog = switchmode.value === "program";
            var n = window.prompt(
                    (
                        prog ? _("Please enter a name for the file in which the program will be saved.")
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
        };

        save.onclick = function () {
            if (switchmode.value === "program") {
                if (!programFileName) {
                    saveas.onclick();
                } else {
                    saveProgram(programFileName);
                }
            } else {
                if (switchmode.value === "automatoncode") {
                    AutomataDesigner.setAutomatonCode(automatoncodeedit.value, AutomataDesigner.currentIndex);
                }

                if (!automatonFileName) {
                    saveas.onclick();
                } else {
                    saveAutomaton(automatonFileName);
                }
            }
        };

        (function () {
            var accepting, word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep;

            execute = function (byStep, w, ind) {
                if (typeof w === "string") {
                    word  = w;
                    index = ind;
                    currentSymbolNumber = 0;
                    stepNumber = 0;
                    executionByStep = byStep;
                }

                if (byStep) {
                    executionByStep = byStep;
                }

                var currentTransitions, i, len, accepted;

                if (stepNumber) {
                    if (EXECUTION_STEP_TIME || executionByStep || !word[0]) {
                        if (stepNumber % 2) {
                            if (currentStates) {
                                for (i = 0, len = currentStates.length; i < len; ++i) {
                                    AutomataDesigner.stateRemoveBackgroundColor(index, currentStates[i].toString());
                                }
                            }

                            currentStates = currentAutomaton.getCurrentStates().getList();
                            accepting = false;
                            for (i = 0, len = currentStates.length; i < len; ++i) {
                                accepted = currentAutomaton.isAcceptingState(currentStates[i]);
                                if (!accepting && accepted) {
                                    accepting = true;
                                }

                                AutomataDesigner.stateSetBackgroundColor(
                                    index,
                                    currentStates[i],
                                    accepted
                                        ? CURRENT_FINAL_STATE_COLOR
                                        : CURRENT_STATE_COLOR
                                );
                            }
                        } else {
                            currentStates = currentAutomaton.getCurrentStates().getList();
                            currentAutomaton.runSymbol(word[0]);
                            wordDiv.firstChild.childNodes[currentSymbolNumber++].className = "eaten";
                            word = word.substr(1);
                            currentTransitions = currentAutomaton.getLastTakenTransitions().getList();

                            for (i = 0, len = currentTransitions.length; i < len; ++i) {
                                AutomataDesigner.transitionPulseColor(index, currentTransitions[i].startState, currentTransitions[i].symbol, currentTransitions[i].endState, CURRENT_TRANSITION_COLOR, CURRENT_TRANSITION_PULSE_TIME_FACTOR * (byStep ? CURRENT_TRANSITION_PULSE_TIME_STEP : EXECUTION_STEP_TIME));
                            }
                        }
                    } else {
                        currentAutomaton.runSymbol(word[0]);
                        word = word.substr(1);
                        currentTransitions = currentAutomaton.getLastTakenTransitions().getList();
                    }
                } else {
                    stepNumber = 0; // we start everything.

                    if (index === undefined) {
                        index = AutomataDesigner.currentIndex;
                    }

                    wordDiv.textContent = "";

                    var layer1 = document.createElement("div");
                    layer1.id = "word-layer1";

                    var span;

                    for (i = 0, len = word.length; i < len; ++i) {
                        span = document.createElement("span");
                        span.textContent = word[i];
                        layer1.appendChild(span);
                    }

                    wordDiv.appendChild(layer1);

                    var layer2 = layer1.cloneNode(true);
                    layer2.id = "word-layer2";
                    wordDiv.appendChild(layer2);

                    currentAutomaton = AutomataDesigner.getAutomaton(index, true);
                    var q_init = currentAutomaton.getInitialState();
                    listOfExecutions = [[[q_init, epsilon]]];
                    currentAutomaton.setCurrentState(q_init);
                    currentTransitions = currentAutomaton.getLastTakenTransitions().getList();

                    accepting = false;
                    currentStates = currentAutomaton.getCurrentStates().getList();

                    for (i = 0, len = currentStates.length; i < len; ++i) {
                        accepted = currentAutomaton.isAcceptingState(currentStates[i]);

                        if (!accepting && accepted) {
                            accepting = true;
                        }

                        if (EXECUTION_STEP_TIME || executionByStep) {
                            AutomataDesigner.stateSetBackgroundColor(
                                index,
                                currentStates[i],
                                accepted
                                    ? CURRENT_FINAL_STATE_COLOR
                                    : CURRENT_STATE_COLOR
                            );
                        }
                    }
                }

                var j, leng;

                if (currentTransitions) {
                    var t, l, transitionsByStartState = {};

                    for (i = 0, len = currentTransitions.length; i < len; ++i) {
                        t = currentTransitions[i];

                        if (!transitionsByStartState[t.startState]) {
                            transitionsByStartState[t.startState] = [];
                        }

                        transitionsByStartState[t.startState].push([t.endState, t.symbol]);
                    }

                    var newListOfExecutions = [], startState, newL;

                    for (i = 0, len = listOfExecutions.length; i < len; ++i) {
                        l = listOfExecutions[i];
                        startState = l[l.length - 1][0];
                        if (transitionsByStartState[startState]) {
                            for (j = 0, leng = transitionsByStartState[startState].length; j < leng; ++j) {
                                newL = l.slice();
                                newL.push(transitionsByStartState[startState][j]);
                                newListOfExecutions.push(newL);
                            }
                        }
                    }

                    listOfExecutions = newListOfExecutions;
                }

                if (stepNumber && !currentStates.length) {
                    stepNumber = -1;
                }

                if ((currentTransitions && EXECUTION_STEP_TIME) || stepNumber === -1) {
                    results.textContent = "";
                    var res, s;

                    for (i = 0, len = listOfExecutions.length; i < len; ++i) {
                        results.appendChild(document.createElement("div"));
                        results.lastChild.className = "execution";
                        res = "";

                        for (j = 0, leng = listOfExecutions[i].length; j < leng; ++j) {
                            s = listOfExecutions[i][j][1];
                            res += j ? ": " + (s === epsilon ? "ε" : Set.prototype.elementToString(s, automataMap)) + " → " + Set.prototype.elementToString(listOfExecutions[i][j][0]) : Set.prototype.elementToString(listOfExecutions[i][j][0]);
                        }

                        results.lastChild.textContent = res;
                    }
                }

                if (stepNumber === -1) {
                    executionTimeout = 0;
                    var color = accepting ? CURRENT_FINAL_STATE_COLOR : STATE_REFUSED;
                    wordDiv.firstChild.style.color = color;
                    wordDiv.childNodes[1].style.color = color;
                } else {
                    if (!word[0]) { // the word is completely eaten
                        stepNumber = -1;
                    } else {
                        ++stepNumber;
                    }

                    if (!executionByStep) {
                        if (stepNumber && EXECUTION_STEP_TIME) {
                            executionTimeout = setTimeout(execute, EXECUTION_STEP_TIME - ((stepNumber % 2) ? 0 : 1) * EXECUTION_STEP_TIME / 2);
                        } else {
                            execute();
                        }
                    } else if (stepNumber % 2) {
                        executionTimeout = setTimeout(execute, HAND_STEP_TIME);
                    }
                }
            };
        }());

        function launchPredefAlgo() {
            if (curAlgo.value === "id") {
                setAutomatonResult(AutomataDesigner.getAutomaton(AutomataDesigner.currentIndex));
                return;
            }

            if (predefAlgoFunctions[curAlgo.value]) {
                window.currentAutomaton = AutomataDesigner.currentIndex;
                if (typeof predefAlgoFunctions[curAlgo.value] === "string") {
                    var id      = "predef-algo-" + curAlgo.value,
                        script  = document.getElementById(id);

                    if (script) {
                        head.removeChild(script);
                    }

                    script = document.createElement("script");

                    if (js18Supported) {
                        script.type = "text/javascript;version=1.8";
                    }

                    script.textContent = "window.run(function (run){'use strict';\n" + predefAlgoFunctions[curAlgo.value] + "\n});";
                    predefAlgoFunctions[curAlgo.value] = null;
                    script.id = id;
                    loadPredefAlgoAfterImport = true;
                    enableAutoHandlingError = curAlgo.value;
                    head.appendChild(script);
                    enableAutoHandlingError = false;
                } else {
                    launchUserProgram(predefAlgoFunctions[curAlgo.value]);
                }
            } else {
                nextLoadIsPrefefAlgo = true;
                window.AutomatonGlue.getScript(curAlgo.value, "?");
            }
        }

        document.getElementById("algorun").onclick = launchPredefAlgo;


        window.gotScript = function (includeName, code) {
            waitingFor.remove(includeName);

            var includes = [];
            code = Audescript.toPureJS(code, includes);

            if (nextLoadIsPrefefAlgo) {
                predefAlgoFunctions[includeName] = code;
                loadPredefAlgoAfterImport = 1;
                nextLoadIsPrefefAlgo = false;
            } else {
                var id      = "useralgo-include-" + includeName,
                    script  = document.getElementById(id);

                if (script) {
                    head.removeChild(script);
                }

                script = document.createElement("script");
                script.id = id;

                if (js18Supported) {
                    script.type = "text/javascript;version=1.8";
                }

                script.textContent = code;
                window.currentAutomaton = NaN;
                enableAutoHandlingError = "module " + includeName;
                head.appendChild(script);
                enableAutoHandlingError = false;
            }

            handleImports(includes, "module " + includeName);

            if (waitingFor.isEmpty()) {
                setTimeout(
                    function () {
                        if (launchAfterImport && window.userProgram) {
                            launchAfterImport = false;
                            execProgram();
                        } else if (loadPredefAlgoAfterImport) {
                            launchPredefAlgo();
                        }
                    },
                    0
                );
            }
        };

        window.helpSymbols = function (e) {
            if (e === "show") {
                notify(_("Howto: input symbols"), "<div style='max-width:80ex'>" + _("<p>In the window which will invit you to input symbols, simply enter the symbol you want to attach to the transition.</p><p>If you want to attach more than one symbol, separate them with commas.</p><p>If you want to input symbols containing spaces or commas, surrond them with double quotes.</p><p>If you need to input a symbol containing double-quotes or slashes, put a slash behind them and surround the symbol with double-quuotes.</p><p>to insert an epsilon (ε-transition), you can input it directly or use <code>\\e</code></p>") + "</div>", "info");
            } else {
                setTimeout(window.helpSymbols, 0, "show");
            }
        };

        switchmode.onchange();

        var i, len, translatedNodes = document.querySelectorAll("[data-translated-content]");

        for (i = 0, len = translatedNodes.length; i < len; ++i) {
            translatedNodes[i].textContent = _(translatedNodes[i].textContent);
        }

        translatedNodes = document.querySelectorAll("[data-translated-title]");

        for (i = 0, len = translatedNodes.length; i < len; ++i) {
            if (translatedNodes[i].title) {
                translatedNodes[i].title = _(translatedNodes[i].title);
            }

            if (translatedNodes[i].alt) {
                translatedNodes[i].alt = _(translatedNodes[i].alt);
            }
        }

        onResize();
    }, false);
}());
