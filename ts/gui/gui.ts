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


// This file initializes Aude's user interface.

// AudeGUI stores everything related to the graphical user interface of Aude.
namespace AudeGUI {
    export let mainDesigner : AudeDesigner = null;

    // This function saves the current program with file name fn
    function saveProgram(filename: string) {
        window.saveAs(
            new Blob(
                [AudeGUI.ProgramEditor.getText()],
                {type: "text/plain;charset=utf-8"}
            ),
            filename
        );
    }

    // This function saves the current automaton with file name fn
    function saveAutomaton(filename: string) {
        const designer = AudeGUI.mainDesigner;
        if (filename) {
            const EXTENSION_SIZE = 4;


            if (filename.length > EXTENSION_SIZE) {
                const ext = filename.substr(filename.length - EXTENSION_SIZE);

                // saving in SVG
                if (ext === ".svg") {

                    // Let's ensure we can get the up-to-date SVG code of the
                    // current automaton
                    if (AudeGUI.getCurrentMode() !== "design") {
                        designer.setAutomatonCode(
                            AudeGUI.AutomatonCodeEditor.getText(),
                            designer.currentIndex
                        );
                    }

                    window.saveAs(
                        new Blob(
                            [designer.getSVG(designer.currentIndex, true)],
                            {type: "text/plain;charset=utf-8"}
                        ),
                        filename
                    );
                    return;
                }

                // saving in the DOT Graphviz format
                if (ext === ".dot") {

                    // Let's ensure we can get the up-to-date automaton
                    if (AudeGUI.getCurrentMode() === "design") {
                        AudeGUI.AutomatonCodeEditor.setText(
                            designer.getAutomatonCode(designer.currentIndex, false)
                        );
                    } else {
                        designer.setAutomatonCode(
                            AudeGUI.AutomatonCodeEditor.getText(),
                            designer.currentIndex
                        );
                    }

                    const A = designer.getAutomaton(designer.currentIndex);

                    if (A) {
                        window.saveAs(
                            new Blob(
                                [automaton2dot(A)],
                                {type: "text/plain;charset=utf-8"}
                            ),
                            filename
                        );
                    } else {
                        AudeGUI.notify(_("Saving a file"), _("There is no automaton to save."));
                    }

                    return;
                }
            }
        }

        // Fall back to plain text format
        window.saveAs(
            new Blob(
                [designer.getAutomatonCode(designer.currentIndex, false)],
                {type: "text/plain"}
            ),
            filename
        );
    }

    // Try to update the automaton code from the designer.
    // But the automaton may be invalid. In this case, the function displays an
    // error and returns false.
    function refreshAutomatonCode() {
        try {
            AudeGUI.AutomatonCodeEditor.setText(
                AudeGUI.mainDesigner.getAutomatonCode()
            );
        } catch (e) {
            AudeGUI.setCurrentMode("design");
            switchMode.onchange();
            libD.notify({
                type:    "error",
                title:   libD.format(_("Unable to access the code of automaton n°{0}"), AudeGUI.mainDesigner.currentIndex),
                content: _("You need to fix the automaton in design mode before accessing its code.")
            });
            console.error(e);
            return false;
        }

        return true;
    }

    // Look for translatable strings in the DOM and translate them.
    function applyTranslation() {
        for (const node of (document.querySelectorAll("[data-translated-content]"))) {
            node.textContent = _(node.textContent);
        }

        for (const node of (document.querySelectorAll("[data-translated-content]"))) {
            const htmlNode = node as HTMLElement;
            if (htmlNode.title) {
                htmlNode.title = _(htmlNode.title);
            }

            if (htmlNode.hasAttribute("alt")) {
                htmlNode.setAttribute("alt", _(htmlNode.getAttribute("alt")));
            }

            if (htmlNode.hasAttribute("placeholder")) {
                htmlNode.setAttribute("placeholder", _(htmlNode.getAttribute("placeholder")));
            }
        }
    }

    // The DOM input that controls the current mode (design, code, program)
    let switchMode     = null;

    // The DOM textarea to input automaton as code
    let automatonCode  = null;

    // The DOM div containing the automata designer / automaton code editor + results
    let automataEdit   = null;

    // The DOM toolbar
    let toolbar        = null;

    // The DOM div used to host the program editor (ACE)
    let codeEdit       = null;

    // The DOM div used as the container for the automata designer
    let svgContainer   = null;

    // The DOM input to select the current automaton
    let automatonSelect = null;

    // Function used for localization
    const _ = libD.l10n();

    // The current file name used to save the program
    let programFileName = "";

    // The current file name used to save the automaton
    let automatonFileName = "";

    // The DOM hidden file input to open an automaton from the user's computer
    export let automatonFileInput: HTMLInputElement = null;

    // Function used for localization
    export let l10n = _;

    // True if aude is in exam mode (no algorithms, no word execution)
    export const audeExam: boolean = window.hasOwnProperty("audeExam") && !!window.audeExam;

    export let notifier = null;

    // Function show a notification.
    // parameters are the title and the content of the notification as plain
    // strings.
    // kind can be "info", "ok", "error".
    // Time in ms until the notification disappears
    export function notify(title: string, content: string | HTMLElement, kind?:string, time?: number) {

        // We lazily load the underlying library used for notification
        if (!libD.Notify) {
            AudeGUI.notifier = {
                close: () => {
                    AudeGUI.notifier = null;
                },

                title: title,
                content: content,
                type: kind
            };

            // FIXME: notifications may hide other notifications

            libD.need(["notify"], () => {
                AudeGUI.notify(AudeGUI.notifier.title, AudeGUI.notifier.content, AudeGUI.notifier.type);
            });

            return;
        }

        if (!AudeGUI.notifier || !AudeGUI.notifier.displayed) {
            AudeGUI.notifier = new libD.Notify({closeOnClick: true}, time);
        }

        AudeGUI.notifier.setTitle(title);
        AudeGUI.notifier.setDescription(content);
        AudeGUI.notifier.setType(kind);
    }

    // Save the thing edited in the current mode. Explicitely ask for the
    // file name.
    export function saveAs(): void {
        const prog = AudeGUI.getCurrentMode() === "program";

        const n = window.prompt(
            (
                prog
                    ? _("Please enter a name for the file in which the program will be saved.")
                    : _("Please enter a name for the file in which the automaton will be saved (give a .dot extension to save as dot format, .svg to save as svg, .txt to save in Aude format).")
            ),
            (prog ? _("algo.ajs") : _("automaton.svg"))
        );

        if (n) {
            if (prog) {
                saveProgram(programFileName = n);
            } else {
                saveAutomaton(automatonFileName = n);
            }
        }
    }

    // Save the thing edited in the current mode. Use the last used file
    // name, if available.
    export function save(): void {
        if (AudeGUI.getCurrentMode() === "program") {
            if (!programFileName) {
                AudeGUI.saveAs();
            } else {
                saveProgram(programFileName);
            }
        } else {
            if (AudeGUI.getCurrentMode() === "automatoncode") {
                AudeGUI.mainDesigner.setAutomatonCode(AudeGUI.AutomatonCodeEditor.getText(), AudeGUI.mainDesigner.currentIndex);
            }

            if (!automatonFileName) {
                AudeGUI.saveAs();
            } else {
                saveAutomaton(automatonFileName);
            }
        }
    }

    // Open an automaton.
    // If designer is defined put the automaton on the designer else
    // put it on the mainDesigner
    // If code is a string:
    //   - if it starts by an xml preamble, we guess that this is an
    //     automaton in SVG format;
    //   - otherwise, it is an automaton in Aude format.
    // Otherwise, get the automaton from the DOM hidden file input to
    // open automata.
    export function openAutomaton(code?: string | Event, designer?: AudeDesigner): void {
        if (typeof code === "string") {
            if (code.trim().startsWith("<?xml") || code.startsWith("<svg") && (!automatonFileName || !automatonFileName.endsWith(".txt"))) {
                if (!designer) {
                    AudeGUI.mainDesigner.setSVG(
                        code,
                        AudeGUI.mainDesigner.currentIndex
                    );
                } else {
                    designer.setSVG(code);
                }
            } else {
                AudeGUI.AutomatonCodeEditor.setText(code);
                if (!designer) {
                    AudeGUI.mainDesigner.setAutomatonCode(
                        code,
                        AudeGUI.mainDesigner.currentIndex
                    );
                } else {
                    designer.setAutomatonCode(code);
                }
            }
            return;
        }

        const fReader = new FileReader();

        fReader.onload = () => {
            AudeGUI.openAutomaton(fReader.result as string);
        };

        fReader.readAsText(AudeGUI.automatonFileInput.files[0], "utf-8");
        automatonFileName = AudeGUI.automatonFileInput.value;
    }

    // Set the current automaton by its index.
    export function setCurrentAutomatonIndex(index: number): void {
        const designer = AudeGUI.mainDesigner;

        designer.setCurrentIndex(index);

        automatonSelect.value = index;

        if (AudeGUI.getCurrentMode() === "automatoncode") {
            refreshAutomatonCode();
        }
    }

    // Create a new automaton in the UI
    export function addAutomaton(): void {
        const o = document.createElement("option");
        o.value = AudeGUI.AutomataList.automatonCount.toString();
        o.textContent = _("n°") + AudeGUI.AutomataList.automatonCount;
        o.id = "automaton_n" + AudeGUI.AutomataList.automatonCount;
        automatonSelect.appendChild(o);
        automatonSelect.value = AudeGUI.AutomataList.automatonCount;
        AudeGUI.mainDesigner.newAutomaton(AudeGUI.AutomataList.automatonCount);
        AudeGUI.setCurrentAutomatonIndex(AudeGUI.AutomataList.automatonCount++);
    }

    // Remove the current automaton in the UI
    export function removeCurrentAutomaton(): void {
        const curAutomaton = parseInt(automatonSelect.value, 10);
        automatonSelect.removeChild(document.getElementById("automaton_n" + (AudeGUI.AutomataList.automatonCount - 1)));
        AudeGUI.mainDesigner.removeAutomaton(curAutomaton);

        if (curAutomaton === AudeGUI.AutomataList.automatonCount - 1) {
            AudeGUI.setCurrentAutomatonIndex(automatonSelect.value = AudeGUI.AutomataList.automatonCount - 2);
        } else {
            AudeGUI.setCurrentAutomatonIndex(curAutomaton);
        }

        --AudeGUI.AutomataList.automatonCount;

        if (AudeGUI.AutomataList.automatonCount < 1) {
            AudeGUI.addAutomaton();
        }
    }

    // Returns the current mode of the UI
    export function getCurrentMode(): string {
        return switchMode.value;
    }

    // Set the current mode of the UI
    export function setCurrentMode(newMode: string): void {
        switchMode.value = newMode;

        switch (newMode) {
            case "program":
                toolbar.className = "algomode";

                codeEdit.classList.remove("disabled");
                automataEdit.classList.add("disabled");

                AudeGUI.ProgramEditor.enable();

                // Load the program from the local storage
                if (AudeGUI.ProgramEditor.getText() === "") {
                    AudeGUI.Programs.open(
                        localStorage.getItem("ProgramText")
                    );
                }

                AudeGUI.onResize();
                break;

            case "design":
                if (!AudeGUI.audeExam && AudeGUI.Results.deferredResultShow) {
                    setTimeout(AudeGUI.Results.enable, 0);
                    AudeGUI.Results.deferredResultShow = false;
                }

                if (AudeGUI.ProgramEditor.getText()) {
                    toolbar.className = "designmode";
                } else {
                    toolbar.className = "designmode launch-disabled";
                }

                codeEdit.classList.add("disabled");

                automataEdit.classList.remove("disabled");
                automatonCode.classList.add("disabled");
                svgContainer.classList.remove("disabled");

                AudeGUI.onResize();
                break;

            case "automatoncode":
                if (!refreshAutomatonCode()) {
                    return;
                }

                if (!AudeGUI.audeExam && AudeGUI.Results.deferredResultShow) {
                    setTimeout(AudeGUI.Results.enable, 0);
                    AudeGUI.Results.deferredResultShow = false;
                }


                if (!AudeGUI.audeExam && AudeGUI.ProgramEditor.getText()) {
                    toolbar.className = "designmode codemode";
                } else {
                    toolbar.className = "designmode codemode launch-disabled";
                }

                codeEdit.classList.add("disabled");

                automataEdit.classList.remove("disabled");
                automatonCode.classList.remove("disabled");
                svgContainer.classList.add("disabled");
                AudeGUI.onResize();
                break;

            default:
                throw new Error("BUG");
        }
    }

    // Display a notification containing the result that has just been
    // computed, if a notification is already displayed or if the code
    // editor is not disabled.
    // res is a DOM element.
    export function programResultUpdated(dontNotify: boolean, res: HTMLElement): void {
        if (!dontNotify) {
            if (
                (AudeGUI.notifier && AudeGUI.notifier.displayed) ||
                !codeEdit.classList.contains("disabled")
            ) {
                AudeGUI.notify(
                    _("Program Result"),
                    res.cloneNode(true) as HTMLElement,
                    "normal"
                );
            }
        }
    }

    // Redraw / keep the UI clean. This function must be called whenever
    // something messed around the UI in a way the size of the result pane
    // and / or the designer has changed. This includes browser resize.
    export function onResize(): void {
        if (!AudeGUI.audeExam) {
            AudeGUI.Results.redraw();
        }
        AudeGUI.mainDesigner.redraw();
    }

    let vizLoadingNotification = null;

    let privateViz: Viz = null;
    // Produces an SVG code for the dot code passed in parameter using
    // Graphviz and passes it as the parameter of the provided callback.
    export function viz(code: string, callback: (result: string) => any) {
        if (window.Viz) {
            if (!privateViz) {
                privateViz = new Viz();
                if (vizLoadingNotification) {
                    vizLoadingNotification.close(true);
                    vizLoadingNotification = null;
                }
            }

            privateViz.renderString(code).then(res => callback(res));
        } else {
            if (!vizLoadingNotification) {
                vizLoadingNotification = libD.notify({
                    type: "info",
                    content: _("Loading Graphviz, the code that draws automata"),
                    title: _("Wait a second..."),
                    delay: 1000,
                    closable:false
                });
            }

            const args = arguments;
            setTimeout(
                () => {
                    AudeGUI.viz.apply(window, args);
                },
                500
            );
        }
    }

    // Handle program edition.
    export namespace Programs {
        export let fileInput: HTMLInputElement = null;

        export function open(code: string | Event): void {
            if (typeof code === "string") {
                AudeGUI.ProgramEditor.setText(code);
                return;
            }

            const fReader = new FileReader();

            fReader.onload = () => {
                AudeGUI.Programs.open(fReader.result as string);
            };

            fReader.readAsText(AudeGUI.Programs.fileInput.files[0], "utf-8");
            programFileName = AudeGUI.Programs.fileInput.value;
        }

        export function load(): void {
            AudeGUI.Programs.fileInput = document.getElementById("fileprogram") as HTMLInputElement;
        }
    }

    // Create the new state button in the UI
    function createNewStateButton(svgContainer) {
        svgContainer.parentNode.appendChild(document.createElement("div"));
        svgContainer.parentNode.lastChild.id = "new-state-btn-wrap";
        svgContainer.parentNode.lastChild.appendChild(document.createElement("a"));
        svgContainer.parentNode.lastChild.lastChild.id = "new-state-btn";

        svgContainer.parentNode.lastChild.lastChild.onmousedown = (e: MouseEvent) => {
            (e.target as HTMLElement).classList.add("mouse-down");
        };

        svgContainer.parentNode.lastChild.lastChild.onmouseup = (e: MouseEvent) => {
            (e.target as HTMLElement).classList.remove("mouse-down");
        };

        svgContainer.parentNode.lastChild.lastChild.onclick = AudeDesigner.initiateNewState;
        svgContainer.parentNode.lastChild.lastChild.textContent = _("New state");
    }

    // When everything is ready, let's populate and initialize things.
    libD.need(["ready", "dom", "notify", "wm", "ws", "jso2dom", "*langPack"], () => {
        automatonCode     = document.getElementById("automatoncode");
        automataEdit      = document.getElementById("automataedit");
        toolbar           = document.getElementById("toolbar");
        switchMode        = document.getElementById("switchmode");
        codeEdit          = document.getElementById("codeedit");
        automatonSelect   = document.getElementById("n-automaton");
        svgContainer      = document.getElementById("svg-container");

        automatonSelect.onchange = () => {
            AudeGUI.setCurrentAutomatonIndex(
                parseInt(automatonSelect.value, 10)
            );
        };

        AudeGUI.automatonFileInput = document.getElementById("fileautomaton") as HTMLInputElement;

        // Disable selection, it messes with the UI.
        // FIXME: this unfortunately has undesirable behavior such as preventing
        // copy paste of results.
        window.onselectstart = window.ondragstart = (e) => {
            e.preventDefault();
            return false;
        };

        AudeGUI.mainDesigner = new AudeDesigner(svgContainer);
        createNewStateButton(svgContainer);

        // Let's initialize each module of the UI.
        // Some modules are not present in exam mode.

        if (!AudeGUI.audeExam) {
            AudeQuiz.load();
            AudeGUI.Programs.load();
            AudeGUI.Results.load();
            AudeGUI.WordExecution.load();
            AudeGUI.ProgramEditor.load();
        }

        AudeGUI.AutomatonCodeEditor.load();
        AudeGUI.AutomataList.load();

        if (!AudeGUI.audeExam) {
            AudeGUI.Runtime.load();
            AudeGUI.QuizEditor.load();
        }

        // Bind events (see gui-events.js)
        AudeGUI.initEvents();

        // Fix the UI a first time
        AudeGUI.onResize();
        AudeGUI.addAutomaton();

        // Let's l10n everything in the DOM
        applyTranslation();

        // The browser might have saved the last mode used in Aude, let's
        // switch to this saved mode (default mode is "design").
        AudeGUI.setCurrentMode(switchMode.value);

        // Hello, user!
        (function drawDivWelcome() {
            const divWelcome = document.createElement("div");
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
                "</ul>"
            ), "Aude") + (AudeGUI.audeExam ? "" : _(
                "<h3> Quizzes </h3>" +
                "<p>To load a quiz, click on the \"Load a Quiz\" toolbar button. You can keep on using all the features of the program, like running algorithms, during the quiz whenever it is possible to draw an automaton.</p>" +
                "<p> Now it’s your turn!</p>"
            ));

            AudeGUI.mainDesigner.svgContainer.parentNode.appendChild(divWelcome);
            function hideWelcome() {
                AudeGUI.mainDesigner.svgContainer.parentNode.removeChild(divWelcome);
                document.getElementById("new-state-btn-wrap").classList.add("welcome-hidden");
                document.body.removeEventListener("click", hideWelcome, false);
                AudeGUI.mainDesigner.setViewBoxSize();
            }
            document.body.addEventListener("click", hideWelcome, false);
        }());

        // Let's load graphiz ahead of time, when everything else is loaded.
        // Loading graphiz is slow, so doing it at this time improves Aude
        // loading time dramatically, but we do want graphiz ready when needed.
        (function loadViz() {
            window.automaton2svg = function automaton2svg(A, callback) {
                AudeGUI.viz(
                    automaton2dot(A),
                    (result) => {
                        callback(
                            result
                                .replace(/<\?[\s\S]*?\?>/g, "")
                                .replace(/<![\s\S]*?>/g, "")
                        );
                    }
                );
            };
        }());

        // In the designer, if a string can be converted to a value like a
        // number or a set, let us do that. Otherwise, keep it unchanged.
        // This looks sloppy, eh? Yes it is!
        AudeDesigner.getValueFunction = (s: string) => {
            try {
                return aude.getValue(s, automataMap);
            } catch (e) {
                return s;
            }
        };

        // If some string represents a value, keep it unchanged. Otherwise, let
        // us get a string representation of this string.
        // see designer.js for exact usage of these functions.
        AudeDesigner.getStringValueFunction = (s) => {
            try {
                aude.getValue(s, automataMap); // s is a legal value
                return s;
            } catch (e) {
                return JSON.stringify(s); // turn into string
            }
        };
    }, false);
}
