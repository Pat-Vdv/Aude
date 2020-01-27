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

((pkg) => {
    const AudeGUI = window.AudeGUI;
    const _ = AudeGUI.l10n;

    // Try to load dirlist.txt.
    FileIO.getFile(
        "dirlist.txt",
        openDirlist,

        (message, status) => {
            let msg: string;

            if (message === "status") {
                msg = libD.format(_("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"), status);
            }

            if (message === "send") {
                msg = _("This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information");
            }

            AudeGUI.notify(_("Unable to get the list of needed files"), msg);
        }
    );

    /** Handles the successful opening of the dirlist.txt file. */
    function openDirlist(dirlist: string) {
        const dirs = dirlist.split("\n");

        const files = {
            a: [] as Array<string>,
            q: [] as Array<string>,
            e: [] as Array<string>
        };

        let win: libD.WSwin;
        let langFound = false;

        // We "sort" the file paths into the files object
        // according to their names and directory structure.
        for (let filePath of dirs) {
            filePath = filePath.trim();
            // Skip empty lines;
            if (!filePath) {
                continue;
            }
            const filePathComponents = filePath.split("/").map((v: string) => { return v.trim(); });

            if (filePathComponents[0] === "l10n") {
                if (libD.lang === filePathComponents[2].split(".")[0]) {
                    langFound = true;
                }
            } else {
                files[filePathComponents[0][0]].push(filePath);
            }
        }

        // If a lang file has been found, load it.
        if (langFound) {
            libD.jsLoad(
                "l10n/js/" + libD.lang + ".js",
                () => {
                    libD.moduleLoaded("*langPack");
                }
            );
        } else {
            libD.moduleLoaded("*langPack");
        }

        if (AudeGUI.audeExam) {
            return;
        }

        /**
         * Creates a file loading window that allows loading of
         * both pre-made files and local files on the user's machine.
         * @param title - Title of the window to create.
         * @param textList - Title for the list of pre-made files.
         * @param funList - The function that associates a link's <a> element to its
         * @param btnText - The text for the local files button.
         * @param letter - The letter identifying the type 
         * of files ("q" for Quizzes, "a" for algorithms, "e" for example automata)
         * @param folder - The name of the folder containing the files,
         * used to remove it from display name of file.
         * @param ext - The extension of the files,
         * used to remove them from display name of files.
         * @param fileelem - The HTML File Input to be used for local file browsing.
         */
        function makeWindow(
            title: string,
            textList: string,
            funList: (link: HTMLAnchorElement) => void,
            btnText: string,
            letter: string,
            folder: string,
            ext: string,
            fileelem: HTMLInputElement
        ) {
            const refs: any = {};

            if (win && win.ws) {
                win.close();
            }

            win = libD.newWin({
                title: title,
                height: "80%",
                width: "75%",
                left: "12.5%",
                top: "12.5%",
                show: true,
                content: libD.jso2dom(["div#loaddistantfile.libD-ws-colors-auto libD-ws-size-auto", [
                    ["div#pane-localfile", [
                        ["p.title", _("From your computer")],
                        ["p", ["button", { "#": "btn" }, btnText]]
                    ]],
                    ["div#pane-distantfile", [
                        ["p.title", textList],
                        ["ul", { "#": "list" }]
                    ]]
                ]], refs)
            });

            for (let j = 0, leng = files[letter].length; j < leng; ++j) {
                const li = document.createElement("li");
                const a = document.createElement("a");

                a.href = "#";
                a.onclick = () => {
                    console.log("Loading file " + (a as any)._file);
                    funList(a);
                };
                (a as any)._file = files[letter][j];
                a.textContent = files[letter][j].replace(folder, "").replace(new RegExp("\\." + ext + "$"), "");

                li.appendChild(a);
                refs.list.appendChild(li);
            }

            refs.btn.onclick = () => {
                win.close();
                fileelem.click();
            };
        }

        /**
         * Function that returns a function which takes a link (<a> element),
         * and tries to load the file associated with said link.
         * If loading fails, shows error notification with the give fail message.
         * If loading succeeds, calls the given function with the string content of the file.
         */
        function lfile(
            fun: (s: string) => void,
            fail: string
        ) {
            return (link: HTMLAnchorElement) => {
                win.close();

                FileIO.getFile(
                    (link as any)._file,
                    fun,
                    () => {
                        AudeGUI.notify("Failure to load a file", fail); // FIXME l10n string
                    },
                    true
                );

                return false;
            };
        }

        libD.need(["ready", "ws", "wm", "*langPack"], () => {
            FileIO.getFile("algos/list.txt",
                (algoFile) => {
                    const algos = algoFile.split("\n");

                    for (const algo of algos) {
                        if (algo.trim()) {
                            AudeGUI.Runtime.addAlgo(algo);
                        }
                    }
                }
            );

            if (files.q.length !== 0) {
                document.getElementById("quiz").onclick = () => {
                    makeWindow(
                        _("Load a Quiz"),
                        _("Ready to use quizzes"),
                        lfile(AudeGUI.Quiz.open, _("Loading quiz failed.")),
                        _("Load a quiz"),
                        "q",
                        "quiz/",
                        "json",
                        AudeGUI.Quiz.fileInput
                    );
                };
            }

            if (files.e.length || files.a.length) {
                document.getElementById("open").onclick = () => {
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
                                AudeGUI.Programs.fileInput
                            );
                        } else {
                            AudeGUI.Programs.fileInput.click();
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
                        AudeGUI.Programs.fileInput.click();
                    }
                };
            }
        });
    }
})(globalThis);
