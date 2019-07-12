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


(function (pkg) {
    "use strict";

    let AudeGUI = pkg.AudeGUI;
    let _ = AudeGUI.l10n;

    let quizEditorContent = null;

    enum QuizEditorState {
        Overview,
        NewQuestion,
        Save,
        QuestionEdit
    }

    class QuizEditor {
        /** Map linking a question category to its title and subtitle in the category selection menu. */
        static readonly QUESTION_CATEGORY_TITLES: Map<QuestionCategory, Array<string>> = new Map([
            [QuestionCategory.AutomatonEquivQuestion, [
                _("Find an automaton, regular expression or linear grammar"),
                _("Example: For the following languages, give an automaton that recognizes it (if such an automaton exists).")
            ]],
            [QuestionCategory.MCQ, [
                _("Multiple Choice Question"),
                _("Example: Which of the following assertions are correct? (check the correct answers)")
            ]],
            [QuestionCategory.TextInput, [
                _("Give a textual answer"),
                _("Example : Give a word recognized by the following automaton.")
            ]]
        ]);

        static readonly WINDOW_CONTENT = ["div#quiz-editor.libD-ws-colors-auto libD-ws-size-auto container-fluid", { "#": "root" }, [
            ["nav", { "class": "navbar navbar-expand navbar-light" }, [
                ["a.navbar-brand", { "href": "#" }, AudeGUI.l10n("Quiz Editor")],

                ["div", { "class": "navbar-nav mr-auto" }, [
                    ["a.nav-link", { "#": "open", "href": "#" }, AudeGUI.l10n("Open")],
                    ["input#quiz-editor-file", { "#": "file", "type": "file", "style": "display: none" }],
                    ["a.nav-link", { "#": "save", "href": "#" }, AudeGUI.l10n("Save")],
                    ["a.nav-link", { "#": "destroy", "href": "#" }, AudeGUI.l10n("New Quiz")],
                ]],

                ["div", { "class": "navbar-nav ml-auto" }, [
                    ["a.nav-link", { "#": "overview", "href": "#" }, AudeGUI.l10n("Show the quiz overview")],

                    ["a.nav-link", { "#": "close", "href": "#" }, AudeGUI.l10n("Close the quiz editor")]
                ]]
            ]],

            ["section#quiz-editor-content", { "#": "content" }, [
                ["div#quiz-editor-Overview-pane.quiz-editor-pane", [
                    ["h1", _("Quiz Overview")],
                    ["table#quiz-editor-overview-table", { "style": "display:none" }, [
                        ["tr", [
                            ["th", _("Nb")],
                            ["th", { "style": "width:100%" }, _("Questions")],
                            ["th", { "style": "width:100%" }, _("Answers")],
                            ["th", _("Edit")],
                            ["th", _("Points")]
                        ]],
                        ["tbody#quiz-editor-overview-table-body", { "#": "overviewTableBody" }, [

                        ]]
                    ]],

                    ["p#quiz-editor-nothing-yet", { "#": "nothingYet" }, AudeGUI.l10n("There is no question in this quiz yet. Click on the button below to add a new question.")],

                    ["p", ["button#quiz-editor-new-question-btn", { "#": "newQuestion", "class": "btn btn-primary" }, [
                        ["img", { "src": libD.getIcon("actions/list-add"), "alt": " + " }],
                        ["#", " " + AudeGUI.l10n("Add a question")]
                    ]]]
                ]]
            ]]
        ]];

        static load() { }
        static run = QuizEditor.openQuizEditor
        /*
         * Open an old quiz.
         * @param. code: old "quiz object"
         */
        static open(code: string) {
            try {
                if (QuizEditor.currentQuizEditor === undefined) {
                    QuizEditor.currentQuizEditor = new QuizEditor();
                }
                QuizEditor.currentQuizEditor.emptyPreviewTable();
                QuizEditor.currentQuizEditor.currentQuiz.fromJSON(code);
                QuizEditor.currentQuizEditor.showOverview("shift");
            } catch (e) {
                AudeGUI.notify(
                    _("Loading the quiz failed"),
                    libD.format(
                        _("The quiz seems to be malformed: {0}"),
                        e.message,
                        "error"
                    )
                );
                throw e;
            }
        }

        /*
         * Save the current quiz in a file in the local storage of the user computer.
         */
        static save() {
            let jsonQuiz = JSON.stringify(QuizEditor.currentQuizEditor.currentQuiz.toJSON());
            let blob = new Blob([jsonQuiz], { type: "application/json" });
            let date = QuizEditor.currentQuizEditor.currentQuiz.date;
            let author = QuizEditor.currentQuizEditor.currentQuiz.author;
            date = date.replace(" ", "");
            author = author.replace(" ", "-");
            let fileName = "Quiz_" + date + "_" + QuizEditor.currentQuizEditor.currentQuiz.author + ".json";

            saveAs(blob, fileName);
        }
        static close() {
            if (!QuizEditor.currentQuizEditor) {
                return;
            }

            QuizEditor.currentQuizEditor.win.minimize();
            QuizEditor.currentQuizEditor.currentState = undefined;
        }

        static openQuizEditor() {
            if (QuizEditor.currentQuizEditor === undefined) {
                QuizEditor.currentQuizEditor = new QuizEditor();
            }

            QuizEditor.currentQuizEditor.open();
        }

        static openQuiz() {
            let file = <HTMLInputElement>document.getElementById("quiz-editor-file"); // input file
            file.onchange = function () {
                let freader = new FileReader()
                freader.onload = function () {
                    QuizEditor.open(<string>freader.result); // freader.result contains stringify(quiz object)
                };
                freader.readAsText(file.files[0], "utf-8");
            }
        }

        static currentQuizEditor: QuizEditor = undefined;

        win: libD.WSwin;

        container: HTMLElement;
        content: HTMLElement;
        currentQuestionEditor: QuestionEditor;
        currentQuiz: Quiz;
        currentState: QuizEditorState;

        constructor() {
            this.currentQuiz = new Quiz();
            this.currentQuiz.title = ""
            this.currentQuiz.author = ""
            this.currentQuiz.date = ""
            this.currentQuiz.description = ""
            this.currentQuiz.questions = []
        }

        open() {
            this.draw();
            this.refreshQuestionPreview();
            this.setCurrentState(QuizEditorState.Overview);
        }

        draw() {
            if (this.win) {
                this.win.close();
                this.container.parentNode.removeChild(this.container);
            }

            let refs = {
                root: <HTMLElement>undefined,
                open: <HTMLInputElement>undefined,
                file: <HTMLInputElement>undefined,
                save: <HTMLInputElement>undefined,
                destroy: <HTMLInputElement>undefined,
                overview: <HTMLInputElement>undefined,
                close: <HTMLInputElement>undefined,
                content: <HTMLElement>undefined,
                nothingYet: <HTMLElement>undefined,
                newQuestion: <HTMLButtonElement>undefined,
                overviewTableBody: <HTMLTableSectionElement>undefined
            };

            this.win = libD.newWin({
                title: _("Quiz Editor"),
                show: true,
                fullscreen: true,
                content: libD.jso2dom(QuizEditor.WINDOW_CONTENT, refs)
            });

            this.container = refs.root;
            this.content = refs.content;

            refs.overview.onclick = (e) => { this.showOverview("show"); };

            // Close the quiz editor.
            refs.close.onclick = QuizEditor.close;

            // Open an old quiz.
            refs.open.onclick = () => {
                let fileinput = document.getElementById("quiz-editor-file");
                fileinput.onclick = QuizEditor.openQuiz;
                fileinput.click();
            };

            // Show the new question pane.
            refs.newQuestion.onclick = () => { this.setCurrentState(QuizEditorState.NewQuestion); };

            // Save the quiz.
            refs.save.onclick = () => {
                let correctState = (
                    document.getElementById("quiz-editor-NewQuestion-pane").style.display != "none"
                    || document.getElementById("quiz-editor-mcq-pane")
                );

                let confirm = true;

                if (correctState) {
                    confirm = window.confirm(_("Do you really want to abandon your modifications to the quiz?"));
                }

                if (confirm) {
                    this.showSavePane();
                }
            };

            refs.destroy.onclick = () => {
                if (window.confirm(_("Do you really want to start a new quiz from scratch?"))) {
                    this.draw();
                }
            };

            this.drawNewQuestionPane();
            this.setCurrentState(QuizEditorState.Overview);
        }

        /**
         * Populates the "new question" pane (that's the pane in which the user selects
         * the question category).
         * The pane isn't actually displayed until the editor is in NewQuestion state.
         */
        drawNewQuestionPane() {
            let refs = {
                content: <HTMLElement>null,
                currentA: <HTMLButtonElement>null
            };
            let newQuestionPane = libD.jso2dom(["div#quiz-editor-NewQuestion-pane.quiz-editor-pane d-flex flex-column align-items-center", [
                ["h1", _("New Question")],
                ["div.list-group", { "#": "content", "style": "width: 90%; text-align:center;" }]
            ]], refs);

            for (let [category, desc] of QuizEditor.QUESTION_CATEGORY_TITLES) {
                refs.content.appendChild(
                    libD.jso2dom(
                        ["button", { "#": "currentA", "value": QuestionCategory[category], "class": "list-group-item list-group-action" }, [
                            ["strong", desc[0]],
                            ["br"],
                            ["i", desc[1]]
                        ]],
                        refs
                    )
                );

                refs.currentA.onclick = (e) => {
                    this.showPaneForCategory(QuestionCategory[(e.currentTarget as HTMLButtonElement).value]);
                }
            }
            this.content.appendChild(newQuestionPane);
        }

        /*
        * Add  if (mode = "") the last edit question to the overview table
        * else (mode = shift) show the overview table from all the quiz object
        */
        showOverview(mode: string) {
            switch (mode) {
                case "":
                    this.refreshQuestionPreview(QuizEditor.currentQuizEditor.currentQuiz.questions.length - 1);
                    break;

                case "shift":
                    this.refreshQuestionPreview();
                    break;

                case "show":
                    // Do nothing specific, we just want to show the stuff actually
                    break;
            }

            if (this.currentQuiz.questions.length > 0) {
                document.getElementById("quiz-editor-overview-table").style.display = "table";
                document.getElementById("quiz-editor-nothing-yet").style.display = "none";
            } else {
                document.getElementById("quiz-editor-overview-table").style.display = "none";
                document.getElementById("quiz-editor-nothing-yet").style.display = "";
            }

            //redrawAutomata();

            this.setCurrentState(QuizEditorState.Overview);
        }

        /**
        * Add the questions[index] to the overview table.
        * If index not specified, will empty and redraw the whole table.
        */
        refreshQuestionPreview(index?: number) {
            let overviewTableBody = document.getElementById("quiz-editor-overview-table-body");
            if (index === undefined) {
                overviewTableBody.innerHTML = "";
                for (let i = 0; i < this.currentQuiz.questions.length; i++) {
                    this.refreshQuestionPreview(i);
                }
                return;
            }
            if (index < 0 && index >= this.currentQuiz.questions.length) {
                return;
            }

            let q = this.currentQuiz.questions[index];
            let overviewTable = document.getElementById("quiz-editor-overview-table");

            overviewTable.style.display = "table";

            let refs = {
                quesDiv: <HTMLElement>undefined,
                answDiv: <HTMLElement>undefined,
                modifButton: <HTMLButtonElement>undefined,
                removeButton: <HTMLButtonElement>undefined,
                addPoint: <HTMLButtonElement>undefined,
                removePoint: <HTMLButtonElement>undefined
            };

            overviewTableBody.appendChild(libD.jso2dom(["tr", [
                ["td", [
                    ["div", { "style": "text-align: center" }, "" + (index + 1)]
                ]],
                ["td", [
                    ["div", { "#": "quesDiv" }]
                ]],
                ["td", [
                    ["div", { "#": "answDiv" }]
                ]],
                ["td", [
                    ["div", { "style": "text-align: center" }, [
                        ["button#quiz-editor-modifQuestion" + index, { "#": "modifButton", "title": _("edit"), "value": index }, [
                            ["img", { "src": libD.getIcon("actions/document-edit"), "alt": "Edit" }]
                        ]],
                        ["button#quiz-editor-removeQuestion" + index, { "#": "removeButton", "title": _("remove"), "value": index }, [
                            ["img", { "src": libD.getIcon("actions/list-remove"), "alt": "Remove" }]
                        ]]
                    ]]
                ]],
                ["td", { "style": "text-align: center;" }, [
                    ["button#quiz-editor-addPoint" + index, { "#": "addPoint", "title": _("+1") }, [
                        ["img", { "src": libD.getIcon("actions/arrow-up"), "alt": _("+1") }]
                    ]],
                    ["div#quiz-editor-divPoint" + index, { "#": "divPoint" }, "" + q.point],
                    ["button#quiz-editor-removePoint" + index, { "#": "removePoint", "title": _("-1") }, [
                        ["img", { "src": libD.getIcon("actions/arrow-down"), "alt": "-1" }]
                    ]]
                ]]
            ]], refs));

            refs.removeButton.onclick = (e) => {
                let btn = <HTMLButtonElement>e.currentTarget;
                this.emptyPreviewTable();
                this.removeQuestion(parseInt(btn.value));
                this.showOverview("shift");
            };

            refs.modifButton.onclick = (e) => {
                let btn = <HTMLButtonElement>e.currentTarget;
                this.editOrCreateQuestion(parseInt(btn.value));
            }

            refs.addPoint.onclick = () => {
                this.addPoint(index);
            };

            refs.removePoint.onclick = () => {
                this.removePoint(index);
            };

            q.displayQuestionWording(refs.quesDiv);
        }

        emptyPreviewTable() {
            let overviewTableBody = document.getElementById("quiz-editor-overview-table-body");
            overviewTableBody.innerHTML = "";
        }

        removeQuestion(index: number) {
            if (0 <= index && index < this.currentQuiz.questions.length) {
                this.currentQuiz.questions.splice(index, 1);
            }
        }

        addPoint(index) {

        }

        removePoint(index) {

        }

        /**
         * Shows the question editor for creation in the given question category.
         * @param qCat 
         */
        showPaneForCategory(qCat: QuestionCategory) {
            this.editOrCreateQuestion(this.currentQuiz.questions.length, qCat);
        }

        /**
         * Creates or modifies the question at the given index.
         * If the index is greater or equal to the question list length, it will be 
         * created at the end of the question list, otherwise it will be edited.
         * @param index 
         * @param qCat 
         */
        editOrCreateQuestion(index: number, qCat?: QuestionCategory) {
            let create = index >= this.currentQuiz.questions.length;
            // Cannot create if the question category isn't set.
            if (create && qCat === undefined) {
                return;
            }

            let qEditPane = document.getElementById("quiz-editor-QuestionEdit-pane");
            if (qEditPane) {
                qEditPane.parentElement.removeChild(qEditPane);
            }

            let refs = {
                editorDiv: <HTMLElement>undefined,
                validationButton: <HTMLButtonElement>undefined,
            };
            qEditPane = libD.jso2dom(["div#quiz-editor-QuestionEdit-pane.quiz-editor-pane", [
                ["div", { "#": "editorDiv" }],
                ["p.big-center", ["button", { "#": "validationButton" }, _("Validate")]]
            ]], refs);

            let questionEditor = new QuestionEditor(refs.editorDiv, (create ? qCat : this.currentQuiz.questions[index].category));
            if (!create) {
                questionEditor.setCurrentQuestion(this.currentQuiz.questions[index]);
            }

            this.content.appendChild(qEditPane);

            refs.validationButton.onclick = (e) => {
                this.currentQuiz.questions[(create ? this.currentQuiz.questions.length : index)] = questionEditor.getCurrentQuestion();
                this.showOverview("shift");
                this.setCurrentState(QuizEditorState.Overview);
            };
            this.setCurrentState(QuizEditorState.QuestionEdit);
        }

        setCurrentState(newState: QuizEditorState) {
            if (newState === this.currentState) {
                return true;
            }

            if (this.currentState !== QuizEditorState.Overview && newState === QuizEditorState.Save) {
                if (!window.confirm(_("Do you really want to cancel your quiz edition?"))) {
                    return;
                }
            }

            if (this.currentState !== undefined) {
                this.container.classList.remove(QuizEditorState[this.currentState] + "-mode");
            }

            let currentPane = document.getElementsByClassName("quiz-editor-current-pane")[0];
            if (currentPane) {
                currentPane.classList.remove("quiz-editor-current-pane");
            }

            this.container.classList.add(QuizEditorState[newState] + "-mode");
            document.getElementById("quiz-editor-" + QuizEditorState[newState] + "-pane").classList.add("quiz-editor-current-pane");

            this.currentState = newState;
        }

        showSavePane() {
            let refs: any = {};
            let savePane = libD.jso2dom(["div#quiz-editor-Save-pane.quiz-editor-pane", [
                ["div", { "style": "position: relative" }, [
                    ["div", ["p", ["label", [
                        ["#", _("Quiz title:") + " "],
                        ["input#quiz-editor-titleInput", {
                            "#": "quizTitleInput",
                            "type": "text",
                            "placeholder": _("Title…")
                        }
                        ]
                    ]]]],
                    ["div", ["p", ["label", [
                        ["#", _("Your name:") + " "],
                        ["input#quiz-editor-authorInput", {
                            "#": "authorInput",
                            "type": "text",
                            "placeholder": _("Enter your name…")
                        }
                        ]
                    ]]]],
                    ["div", ["p", ["label", [
                        ["#", _("Description:") + " "],
                        ["textarea#quiz-editor-descriptionTextarea", {
                            "#": "descriptionTextarea",
                            "rows": "4",
                            "cols": "40",
                            "spellcheck": "false",
                            "placeholder": _("Description…")
                        }
                        ]
                    ]]]]
                ]],
                ["button#quizEditor_saveValidation", { "#": "validationButton" }, _("Validate")]
            ]], refs);

            refs.validationButton.onclick = function () {
                saveQuiz();
                AudeGUI.QuizEditor.save();
                AudeGUI.QuizEditor.close();
            }

            refs.quizTitleInput.value = QuizEditor.currentQuizEditor.currentQuiz.title || "";
            refs.authorInput.value = QuizEditor.currentQuizEditor.currentQuiz.author || "";
            refs.descriptionTextarea.value = QuizEditor.currentQuizEditor.currentQuiz.description || "";

            this.content.appendChild(savePane);
            this.setCurrentState(QuizEditorState.Save)
        }
    }

    AudeGUI.QuizEditor = QuizEditor;

    function saveQuiz() {
        let tableMonth = [
            _("January"),
            _("February"),
            _("March"),
            _("April"),
            _("May"),
            _("June"),
            _("July"),
            _("August"),
            _("September"),
            _("October"),
            _("November"),
            _("December")
        ];

        let quizTitleInput = <HTMLInputElement>document.getElementById("quiz-editor-titleInput");
        let authorInput = <HTMLInputElement>document.getElementById("quiz-editor-authorInput");
        let descriptionTextarea = <HTMLInputElement>document.getElementById("quiz-editor-descriptionTextarea");

        let date = new Date();
        QuizEditor.currentQuizEditor.currentQuiz.title = quizTitleInput.value;
        QuizEditor.currentQuizEditor.currentQuiz.author = authorInput.value;
        QuizEditor.currentQuizEditor.currentQuiz.date = "" + (date.getDate() + " " + tableMonth[date.getMonth()] + " " + date.getFullYear());
        QuizEditor.currentQuizEditor.currentQuiz.description = descriptionTextarea.value;
    }

    /*
     * Remove a question from the quiz object and the overview table
     */
    function removeQuestion(index) {
        QuizEditor.currentQuizEditor.currentQuiz.questions.splice(index, 1);
    }

    function addPoint(index: number) {
        if (QuizEditor.currentQuizEditor.currentQuiz.questions[index].point < 100) {
            QuizEditor.currentQuizEditor.currentQuiz.questions[index].point++;
        }
        document.getElementById("quiz-editor-divPoint" + index).textContent = "" + QuizEditor.currentQuizEditor.currentQuiz.questions[index].point;
    }

    function removePoint(index: number) {
        if (QuizEditor.currentQuizEditor.currentQuiz.questions[index].point > 0) {
            QuizEditor.currentQuizEditor.currentQuiz.questions[index].point--;
        }
        document.getElementById("quiz-editor-divPoint" + index).textContent = "" + QuizEditor.currentQuizEditor.currentQuiz.questions[index].point;
    }

    // Tools
    /*
     * Remove all questions from the overview pane
     */
    function emptyPreviewTable() {
        let overviewTable = <HTMLTableElement>document.getElementById("quiz-editor-overview-table");
        for (let i = QuizEditor.currentQuizEditor.currentQuiz.questions.length; i > 0; i--) {
            overviewTable.deleteRow(i);
        }
    }

    /*
     * Return question index starting from the edit th
     */
    function questionIndex(element) {
        let td = element.parentNode.parentNode;
        return parseInt(td.parentNode.firstChild.firstChild.textContent, 10) - 1;
    }

    function isAutomatonNull(A) {
        let designer = new AudeDesigner(document.createElement("div"), true);
        designer.setAutomatonCode(A);
        A = designer.getAutomaton(designer.currentIndex);
        return (A.getStates().card() === 1) && (A.getAlphabet().card() === 0) && (A.getInitialState() === "") && (A.getTransitions().card() === 0) && (A.getFinalStates().card() === 0);
    }
}(window));
