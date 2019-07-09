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

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var quizEditorContent = null;
    var designerAns = null;
    var designerQue = null;
    var mcqR = null;
    var mcqNumberOfChoices = 0;
    var automatonR = null;
    var regexR = null;
    var quiz = null;

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
        static open(code) {
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
            cleanDesigners();
            var jsonQuiz = JSON.stringify(quiz);
            var blob = new Blob([jsonQuiz], { type: "application/json" });
            var date = quiz.date;
            var author = quiz.author;
            date = date.replace(" ", "");
            author = author.replace(" ", "-");
            var fileName = "Quiz_" + date + "_" + quiz.author + ".json";

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
                var freader = new FileReader()
                freader.onload = function () {
                    QuizEditor.open(freader.result); // freader.result contains stringify(quiz object)
                };
                freader.readAsText(file.files[0], "utf-8");
            }
        }

        static currentQuizEditor: QuizEditor = undefined;
        static currentQuiz: Quiz = undefined;
        static currentQuestion: Question = undefined;

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
                    showSavePane();
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
            var refs = {
                content: <HTMLElement>null,
                currentA: <HTMLButtonElement>null
            };
            var newQuestionPane = libD.jso2dom(["div#quiz-editor-NewQuestion-pane.quiz-editor-pane d-flex flex-column align-items-center", [
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
                    this.refreshQuestionPreview(quiz.questions.length - 1);
                    break;

                case "shift":
                    if (this.currentQuiz.questions) {
                        this.refreshQuestionPreview();
                    }
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
                        ["button#quiz-editor-modifQuestion" + index, { "#": "modifButton", "title": _("edit") }, [
                            ["img", { "src": libD.getIcon("actions/document-edit"), "alt": "Edit" }]
                        ]],
                        ["button#quiz-editor-removeQuestion" + index, { "#": "removeButton", "title": _("remove") }, [
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
                this.emptyPreviewTable();
                this.removeQuestion(index);
                this.showOverview("shift");
            };

            refs.addPoint.onclick = () => {
                this.addPoint(index);
            };

            refs.removeButton.onclick = () => {
                this.removePoint(index);
            };

            refs.modifButton.onclick = () => {
                alert("OwO");
            }

            q.displayQuestionWording(refs.quesDiv);
        }

        emptyPreviewTable() {

        }

        removeQuestion(index) {

        }

        addPoint(index) {

        }

        removePoint(index) {

        }

        /**
         * Shows the question editor for the given question category.
         * @param qCat 
         */
        showPaneForCategory(qCat: QuestionCategory) {
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

            let questionEditor = new QuestionEditor(refs.editorDiv, qCat);

            this.content.appendChild(qEditPane);

            refs.validationButton.onclick = (e) => {
                this.currentQuiz.questions.push(questionEditor.getCurrentQuestion());
                console.log(questionEditor.getCurrentQuestion());
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
    }

    AudeGUI.QuizEditor = QuizEditor;

    function saveQuiz() {
        var tableMonth = [
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

        var quizTitleInput = <HTMLInputElement>document.getElementById("quiz-editor-titleInput");
        var authorInput = <HTMLInputElement>document.getElementById("quiz-editor-authorInput");
        var descriptionTextarea = <HTMLInputElement>document.getElementById("quiz-editor-descriptionTextarea");

        var date = new Date();
        quiz.title = quizTitleInput.value;
        quiz.author = authorInput.value;
        quiz.date = "" + (date.getDate() + " " + tableMonth[date.getMonth()] + " " + date.getFullYear());
        quiz.description = descriptionTextarea.value;
    }

    function showSavePane() {
        var refs: any = {};
        var savePane = libD.jso2dom(["div#quiz-editor-save", [
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

        refs.quizTitleInput.value = quiz.title || "";
        refs.authorInput.value = quiz.author || "";
        refs.descriptionTextarea.value = quiz.description || "";

        quizEditorContent.appendChild(savePane);
        //setCurrentState("save")
    }

    /*
     * Remove a question from the quiz object and the overview table
     */
    function removeQuestion(index) {
        quiz.questions.splice(index, 1);
    }

    function addPoint(index, point?) {
        if (quiz.questions[index].point < 100) {
            quiz.questions[index].point++;
        }
        document.getElementById("quiz-editor-divPoint" + index).textContent = "" + quiz.questions[index].point;
    }

    function removePoint(index, point?) {
        if (quiz.questions[index].point > 0) {
            quiz.questions[index].point--;
        }
        document.getElementById("quiz-editor-divPoint" + index).textContent = "" + quiz.questions[index].point;
    }

    // --- FOR MULTIPLES CHOICE QUESTIONS

    function showMcqPane(mode, index?) {
        var mcqPane = document.getElementById("quiz-editor-QuestionEdit-pane");
        if (mcqPane) {
            mcqPane.parentNode.removeChild(mcqPane);
        }

        mcqR = {};
        mcqNumberOfChoices = 2;

        var refs: any = {};

        mcqPane = libD.jso2dom(["div#quiz-editor-mcq-pane.quiz-editor-pane", [
            ["h1", _("Multiple Choice Question")],
            ["p", ["input#quiz-editor-questionArea", {
                "type": "text",
                "placeholder": _("Write your question…"),
                "#": "questionArea"
            }]],
            ["p", _("Write the different possible answers and check the correct ones.")],
            ["div#quiz-editor-choiceArea", { "#": "choiceArea" }],
            ["p", ["button", { "#": "addButton", "title": _("Add") }, [
                ["img", { "src": libD.getIcon("actions/list-add") }],
                ["#", _("Add an answer")]
            ]]],
            ["p.big-center", ["button", { "#": "validationButton" }, _("Validate")]]
        ]], refs);

        let choice_list = [];

        for (var i = 0; i < mcqNumberOfChoices; i++) {
            var q = libD.jso2dom([
                ["div#quiz-editor-choice" + i, [
                    ["input", { "type": "checkbox" }],
                    ["input", { "type": "text", "name": "questionArea", "placeholder": libD.format(_("Choice {0}…"), i + 1) }],
                    ["button", { "#": "removeButton", "title": _("remove") }, [
                        ["img", { "src": libD.getIcon("actions/list-remove"), "alt": _("Remove") }]
                    ]]
                ]]
            ], refs);

            refs.choiceArea.appendChild(q);
            refs.removeButton.onclick = removeChoice.bind(null, q);
        }

        refs.addButton.onclick = addChoice;
        refs.validationButton.onclick = function () {
            //mcqValidation(mode, index);
            //showQuizOverview((mode == "") ? "" : "shift");
        }

        quizEditorContent.appendChild(mcqPane);

        setTimeout(
            function () {
                refs.questionArea.focus();
            },
            0
        );

        //setCurrentState("mcq");
    }

    /*
     * Push the current question in the quiz object.
     */
    function mcqValidation(mode, index) {
        mcqR = {
            type: "mcq",
            instruction: (<HTMLInputElement>document.getElementById("quiz-editor-questionArea")).value,
            answers: [],
            possibilities: [],
            point: 0,
            overviewAutomatonQue: null,
            overviewAutomatonAns: null
        };

        var choiceArray = document.getElementById("quiz-editor-choiceArea").childNodes;
        for (var i = 0, a_acsiiCode = 97; i < choiceArray.length; i++) {
            var choice = choiceArray[i].childNodes;
            var value = (<HTMLInputElement>choice[1]).value.trim();

            if (!value) {
                continue; // if the answer is empty, skip it
            }

            // push the id of the correct possibility in mcqR
            if ((<HTMLInputElement>choice[0]).checked) {
                mcqR.answers.push(String.fromCharCode(a_acsiiCode));
            }

            // push the id and text of the possibility in mcqR
            var possibility = {
                id: String.fromCharCode(a_acsiiCode),
                text: value
            };

            mcqR.possibilities.push(possibility);
            a_acsiiCode++;
        }

        if (mode === "") {
            quiz.questions.push(mcqR);
        } else {
            emptyPreviewTable();
            quiz.questions[index] = mcqR;
        }

        designerQue = null;
        designerAns = null;
    }

    /*
     * Edit a m.c.question indexed by index
     */
    function modifyMcQuestion(index) {
        var q = quiz.questions[index];
        var possibilities = q.possibilities;
        var answers = q.answers;

        showMcqPane("shift", index);
        (<HTMLInputElement>document.getElementById("quiz-editor-questionArea")).value = q.instruction;
        for (var i = 0, choiceDiv; i < possibilities.length; i++) {
            if (i > 1) {
                addChoice();
            }
            choiceDiv = document.getElementById("quiz-editor-choice" + i).childNodes;
            choiceDiv[1].value = possibilities[i].text;
        }

        for (var i = 0, choiceDiv, id; i < answers.length; i++) {
            id = answers[i].charCodeAt(0) - "a".charCodeAt(0);
            choiceDiv = document.getElementById("quiz-editor-choice" + id).childNodes;
            choiceDiv[0].checked = "checked";
        }
    }

    /*
     * Add a possibility to the question
     */
    function addChoice() {
        var choiceArea = document.getElementById("quiz-editor-choiceArea");
        var refs: any = {};
        var q = libD.jso2dom(["div#quiz-editor-choice" + (mcqNumberOfChoices), [
            ["input", { "type": "checkbox" }],
            ["input", { "#": "addedInput", "type": "text", "placeholder": libD.format(_("Choice {0}…"), mcqNumberOfChoices + 1) }],
            ["button", { "#": "removeButton", "title": _("remove") }, [
                ["img", { "src": libD.getIcon("actions/list-remove"), "alt": _("Remove") }]
            ]]
        ]
        ], refs);

        choiceArea.appendChild(q);
        refs.removeButton.onclick = removeChoice.bind(null, q);

        setTimeout(
            function () {
                refs.addedInput.focus();
            },
            0
        );

        mcqNumberOfChoices++;
    }

    /*
     * Remove a possibility from the questions
     */
    function removeChoice(elementToRemove) {
        var parent = document.getElementById("quiz-editor-choiceArea");
        parent.removeChild(elementToRemove);

        var children = parent.childNodes as NodeListOf<HTMLInputElement>;
        for (var i = 0; i < children.length; i++) {
            children[i].id = "quiz-editor-choice" + i;
            (<HTMLInputElement>children[i].childNodes[1]).placeholder = libD.format(_("Choice {0}…"), (i + 1));
        }
        mcqNumberOfChoices--;
    }

    function showAutomatonRPane(mode, index?) {
        automatonR = {};
        designerAns = null;
        designerQue = null;
        var refs: any = {};
        var automatonRPane = document.getElementById("quiz-editor-automatonR-pane");

        if (automatonRPane) {
            automatonRPane.parentNode.removeChild(automatonRPane);
        }

        automatonRPane = libD.jso2dom(["div#quiz-editor-automatonR-pane.quiz-editor-pane", [
            ["h1", _("Find an automaton")],
            ["div#quiz-editor-automatonR-panes", [
                ["div.quiz-editor-disp-flex", [
                    ["h2", _("Question")],
                    ["div.quiz-editor-flex quiz-editor-disp-flex", [
                        ["textarea#quiz-editor-automatonRTextarea", {
                            "rows": 10,
                            "spellcheck": "false",
                            "placeholder": _("Type the question here…")
                        }],
                        ["p", ["label", [
                            ["input#quiz-editor-drawAutomaton", {
                                "#": "drawAutomaton",
                                "type": "checkbox"
                            }],
                            ["#", " " + _("Draw an automaton")]
                        ]]],
                        ["div.quiz-editor-flex", { "#": "automatonQueDiv" }, [
                            ["div.automaton-draw-area"]
                        ]]
                    ]]
                ]],
                ["div.quiz-editor-disp-flex", [
                    ["h2", _("Answer")],
                    ["div.quiz-editor-flex", { "#": "automatonAnsDiv" }, [
                        ["div.automaton-draw-area"]
                    ]]
                ]]
            ]],
            ["div", { "style": "display:flex;" }, [
                ["textarea#quiz-editor-audescriptCode", {
                    "#": "audescriptCode",
                    "rows": 4,
                    "style": "flex:1",
                    "spellcheck": "false",
                    "placeholder": _("Write your audescript code here…")
                }],
                ["div.help", [
                    ["p", _("If you want the automaton answer to be:") + " "],
                    ["ul", [
                        ["li", _("determinized, write isDeterminized(autoAnsw)")],
                        ["li", _("minimized, write isMinimized(autoAnsw)")],
                        ["li", _("completed, write isCompleted(autoAnsw)")]
                    ]]
                ]]
            ]],
            ["button", { "#": "validationButton" }, _("Validate")]
        ]], refs);

        quizEditorContent.appendChild(automatonRPane);

        designerAns = new AudeDesigner(refs.automatonAnsDiv);

        setTimeout(function () {
            designerAns.redraw();
        }, 0);

        refs.drawAutomaton.checked = false;
        (refs.drawAutomaton.onchange = function () {
            if (refs.drawAutomaton.checked) {
                refs.automatonQueDiv.style.display = "";

                if (!designerQue) {
                    designerQue = new AudeDesigner(refs.automatonQueDiv);
                }

                setTimeout(function () {
                    designerQue.redraw();
                }, 0);
            } else {
                refs.automatonQueDiv.style.display = "none";
            }
        })();

        refs.validationButton.onclick = function () {
            if (refs.audescriptCode.value) {
                // TODO : Fix Audescript evaluation here.
                //AudeGUI.Quiz._ajsEval(script, autoAnsw, A);
            }

            automatonRValidation(mode, index);
            //showQuizOverview((mode == "") ? "" : "shift");
        };

        //setCurrentState("automatonR");
    }

    /*
     * Push the current question in the quiz object.
     */
    function automatonRValidation(mode, index) {
        automatonR = {
            type: "automatonEquiv",
            instructionHTML: (<HTMLInputElement>document.getElementById("quiz-editor-automatonRTextarea")).value,
            automatonQuestion: null,
            automatonAnswer: designerAns.getAutomatonCode(designerAns.currentIndex, false),
            audescriptCode: (<HTMLInputElement>document.getElementById("quiz-editor-audescriptCode")).value,
            point: 0,
            overviewAutomatonQue: null,
            overviewAutomatonAns: null
        }

        if (designerQue) {
            automatonR.automatonQuestion =
                designerQue.getAutomatonCode(designerQue.currentIndex, false)
        }

        if (mode === "") {
            quiz.questions.push(automatonR);
        } else {
            emptyPreviewTable();
            quiz.questions[index] = automatonR;
        }

        designerQue = null;
        designerAns = null;
    }

    function modifyAutomatonR(index) {
        var q = quiz.questions[index];

        showAutomatonRPane("shift", index);
        AudeGUI.Quiz.textFormat(q.instructionHTML, document.getElementById("quiz-editor-automatonRTextarea"), true);

        if (q.automatonQuestion) {
            document.getElementById("quiz-editor-drawAutomaton").click();
            designerQue.setAutomatonCode(
                q.automatonQuestion,
                designerQue.currentIndex
            );
            designerQue.autoCenterZoom();
        }

        if (q.audescriptCode) {
            document.getElementById("quiz-editor-audescriptCodeButton").click();
            (<HTMLInputElement>document.getElementById("quiz-editor-audescriptCode")).value = q.audescriptCode;
        }

        designerAns.setAutomatonCode(
            q.automatonAnswer,
            designerAns.currentIndex
        );
        designerAns.autoCenterZoom();
    }

    // --- FOR REGULAR EXPRESSIONS RESEARCHER

    function showRegexRPane(mode, index?) {
        regexR = {};
        var refs: any = {};

        var regexRPane = document.getElementById("quiz-editor-regexR-pane");

        if (regexRPane) {
            regexRPane.parentNode.removeChild(regexRPane);
        }

        regexRPane = libD.jso2dom(["div#quiz-editor-regexR-pane.quiz-editor-pane", [
            ["h1", _("Find a regular expression")],
            ["section#quiz-editor-regexR-pane-content", [
                ["div", [
                    ["h1", _("Question")],
                    ["div", [
                        ["textarea#quiz-editor-regexRTextarea", {
                            "rows": 10,
                            "spellcheck": "false",
                            "placeholder": _("Write your question…")
                        }],
                        ["p",
                            ["button#quiz-editor-drawAutomaton", {
                                "#": "drawAutomaton",
                            },
                                _("Draw an automaton")
                            ]
                        ],
                        ["div.automaton-draw-area", { "#": "automatonQueDiv", "style": "display: none" }]
                    ]]
                ]],
                ["div", [
                    ["h1", _("Answer")],
                    ["div", [
                        ["textarea#quiz-editor-regex", {
                            "rows": 10,
                            "spellcheck": "false",
                            "placeholder": _("Write a regular expression…")
                        }]
                    ]]
                ]]
            ]],
            ["p.big-center", ["button", { "#": "validationButton" }, _("Validate")]]
        ]], refs);

        refs.drawAutomaton.onclick = function () {
            refs.drawAutomaton.parentNode.style.display = "none";
            refs.automatonQueDiv.style.display = "";
            designerQue = new AudeDesigner(refs.automatonQueDiv);
            setTimeout(function () {
                designerQue.redraw();
            }, 0);
        };

        refs.validationButton.onclick = function () {
            var regexToAutomaton = null;

            AudeGUI.Runtime.loadIncludes(["equivalence", "regex2automaton", "automaton2json"],
                function () {
                    AudeGUI.notifier.close(); // loading notification

                    regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;

                    try {
                        regexToAutomaton((<HTMLInputElement>document.getElementById("quiz-editor-regex")).value);
                    } catch (e) {
                        AudeGUI.notify(
                            _("This regular expresion does not seem valid."),
                            _("Recognized operations: “.”, “*”, “+”."),
                            "error"
                        );
                        return;
                    }

                    regexRValidation(mode, index);
                    //showQuizOverview((mode == "") ? "" : "shift");
                }
            );

            if (!regexToAutomaton) {
                AudeGUI.notify(
                    _("Loading…"),
                    _("Your regular expression is going to be checked."),
                    "info"
                );
            }
        };

        quizEditorContent.appendChild(regexRPane);
        //setCurrentState("regexR");
    }

    /*
     * Push the current question in the quiz object.
     */
    function regexRValidation(mode, index) {
        regexR = {
            type: "regexEquiv",
            instructionHTML: (<HTMLInputElement>document.getElementById("quiz-editor-regexRTextarea")).value,
            automatonQuestion: null,
            regex: (<HTMLInputElement>document.getElementById("quiz-editor-regex")).value,
            point: 0,
            overviewAutomatonQue: null,
            overviewAutomatonAns: null
        }

        if (designerQue !== null) {
            regexR.automatonQuestion =
                designerQue.getAutomatonCode(designerQue.currentIndex, false)
        }

        if (mode === "") {
            quiz.questions.push(regexR);
        } else {
            emptyPreviewTable();
            quiz.questions[index] = regexR;
        }

        designerQue = null;
        designerAns = null;
    }

    function modifyRegexR(buttonClicked) {
        var index = questionIndex(buttonClicked);
        var q = quiz.questions[index];

        showRegexRPane("shift", index);
        AudeGUI.Quiz.textFormat(q.instructionHTML, document.getElementById("quiz-editor-regexRTextarea"), true);
        (<HTMLInputElement>document.getElementById("quiz-editor-regex")).value = q.regex;

        if (q.automatonQuestion) {
            document.getElementById("quiz-editor-drawAutomaton").click();
            designerQue.setAutomatonCode(
                q.automatonQuestion,
                designerQue.currentIndex
            );
            designerQue.autoCenterZoom();
        }
    }

    // Tools

    /*
     * Remove all questions from the overview pane
     */
    function emptyPreviewTable() {
        var overviewTable = <HTMLTableElement>document.getElementById("quiz-editor-overview-table");
        for (var i = quiz.questions.length; i > 0; i--) {
            overviewTable.deleteRow(i);
        }
    }

    /*
     * Return question index starting from the edit th
     */
    function questionIndex(element) {
        var td = element.parentNode.parentNode;
        return parseInt(td.parentNode.firstChild.firstChild.textContent, 10) - 1;
    }

    /*
     * Redraw all automatons of the overview table
     */
    function redrawAutomata() {
        for (var i = 0, leng = quiz.questions.length, q; i < leng; i++) {
            q = quiz.questions[i];
            if (q.overviewAutomatonQue) {
                q.overviewAutomatonQue.redraw();
                q.overviewAutomatonQue.autoCenterZoom();
            }
            if (q.overviewAutomatonAns) {
                q.overviewAutomatonAns.redraw();
                q.overviewAutomatonAns.autoCenterZoom();
            }
        }
    }

    /*
     * Delete all designers from the quiz object
     */
    function cleanDesigners() {
        for (var i = 0, leng = quiz.questions.length; i < leng; i++) {
            delete quiz.questions[i].overviewAutomatonQue;
            delete quiz.questions[i].overviewAutomatonAns;
        }
    }

    function isAutomatonNull(A) {
        var designer = new AudeDesigner(document.createElement("div"), true);
        designer.setAutomatonCode(A);
        A = designer.getAutomaton(designer.currentIndex);
        return (A.getStates().card() === 1) && (A.getAlphabet().card() === 0) && (A.getInitialState() === "") && (A.getTransitions().card() === 0) && (A.getFinalStates().card() === 0);
    }
}(window));
