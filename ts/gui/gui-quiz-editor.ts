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

namespace AudeGUI.QuizEditor {
    enum QuizEditorState {
        Overview,
        NewQuestion,
        Save,
        QuestionEdit,
    }

    /**
     * Needed for Aude module system. Doesn't do anything.
     */
    export function load() { return; }

    /**
     * Opens an quiz.
     * Resets the current quiz editor's quiz.
     * @param code : The JSON string for the old quiz.
     */
    function open(code: string) {
        try {
            currentQuiz = new AudeQuiz();
            currentQuiz.title = "";
            currentQuiz.author = "";
            currentQuiz.date = "";
            currentQuiz.description = "";
            currentQuiz.questions = [];

            emptyPreviewTable();
            currentQuiz.fromJSON(code);
            showOverview();
        } catch (e) {
            window.AudeGUI.notify(
                window.AudeGUI.l10n("Loading the quiz failed"),
                libD.format(
                    window.AudeGUI.l10n("The quiz seems to be malformed: {0}"),
                    e.message,
                    "error"
                )
            );
            throw e;
        }
    }

    /**
     * Gets the info such as the author, title, description and
     * date for the current quiz and assigns them to said quiz.
     */
    function parseQuizInfo() {
        const tableMonth = [
            window.AudeGUI.l10n("January"),
            window.AudeGUI.l10n("February"),
            window.AudeGUI.l10n("March"),
            window.AudeGUI.l10n("April"),
            window.AudeGUI.l10n("May"),
            window.AudeGUI.l10n("June"),
            window.AudeGUI.l10n("July"),
            window.AudeGUI.l10n("August"),
            window.AudeGUI.l10n("September"),
            window.AudeGUI.l10n("October"),
            window.AudeGUI.l10n("November"),
            window.AudeGUI.l10n("December")
        ];

        const quizTitleInput = document.getElementById("quiz-editor-titleInput") as HTMLInputElement;
        const authorInput = document.getElementById("quiz-editor-authorInput") as HTMLInputElement;
        const descriptionTextarea = document.getElementById("quiz-editor-descriptionTextarea") as HTMLInputElement;

        const date = new Date();
        currentQuiz.title = quizTitleInput.value;
        currentQuiz.author = authorInput.value;
        currentQuiz.date = "" + (date.getDate() + " " + tableMonth[date.getMonth()] + " " + date.getFullYear());
        currentQuiz.description = descriptionTextarea.value;
    }

    /**
     * Saves the current quiz in a file in the local storage of the user's computer.
     */
    function save() {
        const jsonQuiz = JSON.stringify(currentQuiz.toJSON());
        const blob = new Blob([jsonQuiz], { type: "application/json" });
        const date = currentQuiz.date.replace(" ", "");
        const author = currentQuiz.author.replace(" ", "-");
        const fileName = "Quiz_" + date + "_" + author + ".json";

        window.saveAs(blob, fileName);
    }
    /**
     * Minimizes the current quiz editor window.
     * @remarks
     * The same quiz editor can still be reopened afterwards.
     */
    function close() {
        if (win) {
            win.minimize();
            currentState = undefined;
        }
    }

    /**
     * Quiz Editor "entry point".
     * This is the function that will be called
     * when the "Edit Quiz" button is pressed.
     *
     * If no quiz editor is open already, opens a new one.
     * Otherwise, reopens the previous quiz editor.
     */
    export function run() {
        currentQuiz = new AudeQuiz();
        currentQuiz.title = "";
        currentQuiz.author = "";
        currentQuiz.date = "";
        currentQuiz.description = "";
        currentQuiz.questions = [];
        currentState = null;
        draw();
        refreshQuestionPreview();
        setCurrentState(QuizEditorState.Overview);
    }

    /**
     * Opens a file browser and loads a quiz from the file if
     * any was selected.
     */
    function openQuizFromFile() {
        const file = document.getElementById("quiz-editor-file") as HTMLInputElement; // input file
        file.onchange = () => {
            const freader = new FileReader();
            freader.onload = () => {
                open(freader.result as string); // freader.result contains stringify(quiz object)
            };
            freader.readAsText(file.files[0], "utf-8");
        };
    }

    /** Map linking a question category to its title and subtitle in the category selection menu. */
    const QUESTION_CATEGORY_TITLES: Map<QuestionCategory, Array<string>> = new Map([
        [QuestionCategory.AutomatonEquivQuestion, [
            window.AudeGUI.l10n("Find an automaton, regular expression or linear grammar"),
            window.AudeGUI.l10n("Example: For the following languages, give an automaton that recognizes it (if such an automaton exists).")
        ]],
        [QuestionCategory.MCQ, [
            window.AudeGUI.l10n("Multiple Choice Question"),
            window.AudeGUI.l10n("Example: Which of the following assertions are correct? (check the correct answers)")
        ]],
        [QuestionCategory.TextInput, [
            window.AudeGUI.l10n("Give a textual answer"),
            window.AudeGUI.l10n("Example : Give a word recognized by the following automaton.")
        ]]
    ]);

    const WINDOW_CONTENT = ["div#quiz-editor.libD-ws-colors-auto libD-ws-size-auto container-fluid", { "#": "root" }, [
        ["nav", { "class": "navbar navbar-expand navbar-light" }, [
            ["div", { "class": "navbar-nav mr-auto" }, [
                ["a.nav-link", { "#": "open", "href": "#" }, window.AudeGUI.l10n("Open")],
                ["input#quiz-editor-file", { "#": "file", "type": "file", "style": "display: none" }],
                ["a.nav-link", { "#": "save", "href": "#" }, window.AudeGUI.l10n("Save")],
                ["a.nav-link", { "#": "destroy", "href": "#" }, window.AudeGUI.l10n("New Quiz")],
            ]],

            ["div.navbar-title", window.AudeGUI.l10n("Quiz Editor")],

            ["div", { "class": "navbar-nav ml-auto" }, [
                ["a.nav-link", { "#": "overview", "href": "#" }, window.AudeGUI.l10n("Show the quiz overview")],

                ["a.nav-link", { "#": "close", "href": "#" }, window.AudeGUI.l10n("Close the quiz editor")]
            ]]
        ]],

        ["section#quiz-editor-content", { "#": "content" }, [
            ["div#quiz-editor-Overview-pane.quiz-editor-pane", [
                ["h1", window.AudeGUI.l10n("Quiz Overview")],
                ["table#quiz-editor-overview-table.table quiz-editor-hidden", [
                    ["tr", [
                        ["th", window.AudeGUI.l10n("Nb")],
                        ["th", window.AudeGUI.l10n("Questions")],
                        ["th", window.AudeGUI.l10n("Answers")],
                        ["th", window.AudeGUI.l10n("Edit")],
                        ["th", window.AudeGUI.l10n("Point value")]
                    ]],
                    ["tbody#quiz-editor-overview-table-body", { "#": "overviewTableBody" }, [

                    ]]
                ]],

                ["p#quiz-editor-nothing-yet", { "#": "nothingYet" }, window.AudeGUI.l10n("There is no question in this quiz yet. Click on the button below to add a new question.")],

                ["p", ["button#quiz-editor-new-question-btn", { "#": "newQuestion", "class": "btn btn-primary" }, [
                    ["img", { "src": libD.getIcon("actions/list-add"), "alt": " + " }],
                    ["#", " " + window.AudeGUI.l10n("Add a question")]
                ]]]
            ]]
        ]]
    ]];

    //// FIELDS ////
    /** Forwards to AudeGUI.l10n. @see AudeGUI.l10n */
    const _ = window.AudeGUI.l10n;

    /** The libD window used for this editor. */
    let win: libD.WSwin;

    /** HTML DOM Element that contains this quiz editor. */
    let container: HTMLElement;
    /** HTML DOM Element that contains this quiz editor's content (without navbar). */
    let content: HTMLElement;
    /** The quiz this editor is currently working on. */
    let currentQuiz: AudeQuiz;
    /** The current state of this quiz editor. */
    let currentState: QuizEditorState;

    /**
     * Initializes all of this quiz editor's components.
     * Shows overview afterwards.
     */
    function draw() {
        if (win) {
            win.close();
            container.parentNode.removeChild(container);
        }

        const refs = {
            root: undefined as HTMLElement,
            open: undefined as HTMLInputElement,
            file: undefined as HTMLInputElement,
            save: undefined as HTMLInputElement,
            destroy: undefined as HTMLInputElement,
            overview: undefined as HTMLInputElement,
            close: undefined as HTMLInputElement,
            content: undefined as HTMLElement,
            nothingYet: undefined as HTMLElement,
            newQuestion: undefined as HTMLButtonElement,
            overviewTableBody: undefined as HTMLTableSectionElement
        };

        win = libD.newWin({
            title: window.AudeGUI.l10n("Quiz Editor"),
            show: true,
            fullscreen: true,
            content: libD.jso2dom(WINDOW_CONTENT, refs)
        });

        container = refs.root;
        content = refs.content;

        refs.overview.onclick = (e) => { showOverview(false); };

        // Close the quiz editor.
        refs.close.onclick = close;

        // Open an old quiz.
        refs.open.onclick = () => {
            const fileinput = document.getElementById("quiz-editor-file");
            fileinput.onclick = openQuizFromFile;
            fileinput.click();
        };

        // Show the new question pane.
        refs.newQuestion.onclick = () => { setCurrentState(QuizEditorState.NewQuestion); };

        // Save the quiz.
        refs.save.onclick = () => {
            const correctState = (
                currentState === QuizEditorState.NewQuestion ||
                currentState === QuizEditorState.QuestionEdit
            );

            let confirm = true;

            if (correctState) {
                confirm = window.confirm(window.AudeGUI.l10n("Do you want to cancel the current modification ?"));
            }

            if (confirm) {
                showSavePane();
            }
        };

        refs.destroy.onclick = () => {
            if (window.confirm(window.AudeGUI.l10n("Do you really want to start a new quiz from scratch?"))) {
                run();
            }
        };

        drawNewQuestionPane();
        setCurrentState(QuizEditorState.Overview);
    }

    /**
     * Populates the "new question" pane (that's the pane in which the user selects
     * the question category).
     * The pane isn't actually displayed until the editor is in NewQuestion state.
     */
    function drawNewQuestionPane() {
        const refs = {
            content: undefined as HTMLElement,
            currentA: undefined as HTMLButtonElement
        };
        const newQuestionPane = libD.jso2dom(["div#quiz-editor-NewQuestion-pane.quiz-editor-pane d-flex flex-column align-items-center", [
            ["h1", window.AudeGUI.l10n("New Question")],
            ["div.list-group", { "#": "content", "style": "width: 90%; text-align:center;" }]
        ]], refs);

        for (const [category, desc] of QUESTION_CATEGORY_TITLES) {
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
                showPaneForCategory(QuestionCategory[(e.currentTarget as HTMLButtonElement).value]);
            };
        }
        content.appendChild(newQuestionPane);
    }

    /**
     * Shows/update this quiz editor's overview.
     * Sets the current state to Overview.
     * @param refreshPreview - If true, all the question's previews will be updated.
     */
    function showOverview(refreshPreview = true) {
        if (refreshPreview) {
            refreshQuestionPreview();
        }

        if (currentQuiz.questions.length > 0) {
            document.getElementById("quiz-editor-overview-table").classList.remove("quiz-editor-hidden");
            document.getElementById("quiz-editor-nothing-yet").classList.add("quiz-editor-hidden");
        } else {
            document.getElementById("quiz-editor-overview-table").classList.add("quiz-editor-hidden");
            document.getElementById("quiz-editor-nothing-yet").classList.remove("quiz-editor-hidden");
        }

        setCurrentState(QuizEditorState.Overview);
    }

    /**
    * Add the questions[index] to the overview table.
    * If index not specified, will empty and redraw the whole table.
    * @param index - Index of the question to add to the preview table.
    */
   function refreshQuestionPreview(index?: number) {
        const overviewTableBody = document.getElementById("quiz-editor-overview-table-body");
        if (index === undefined) {
            overviewTableBody.innerHTML = "";
            for (let i = 0; i < currentQuiz.questions.length; i++) {
                refreshQuestionPreview(i);
            }
            return;
        }

        if (index < 0 && index >= currentQuiz.questions.length) {
            return;
        }

        const q = currentQuiz.questions[index];
        const overviewTable = document.getElementById("quiz-editor-overview-table");

        overviewTable.classList.remove("quiz-editor-hidden");

        const refs = {
            answerDiv: undefined as HTMLElement,
            answerCollapseButton: undefined as HTMLButtonElement,
            editButton: undefined as HTMLButtonElement,
            pointInput: undefined as HTMLInputElement,
            quesDiv: undefined as HTMLElement,
            removeButton: undefined as HTMLButtonElement,
        };

        overviewTableBody.appendChild(libD.jso2dom(["tr", [
            ["td", [
                ["div", { style: "text-align: center" }, "" + (index + 1)]
            ]],
            ["td", [
                ["div", { "#": "quesDiv" }]
            ]],
            ["td", [
                ["button.btn btn-outline-primary btn-sm", { "#": "answerCollapseButton" }, _("Show")],
                ["div.quiz-editor-hidden", { "#": "answerDiv" }]
            ]],
            ["td", [
                ["div", { style: "text-align: center" }, [
                    ["button#quiz-editor-modifQuestion.btn btn-outline-secondary btn-sm" + index, { "#": "editButton", "title": window.AudeGUI.l10n("edit"), "value": index }, [
                        ["img", { src: libD.getIcon("actions/document-edit"), alt: "Edit" }]
                    ]],
                    ["br"],
                    ["button#quiz-editor-removeQuestion.btn btn-outline-danger btn-sm" + index, { "#": "removeButton", "title": window.AudeGUI.l10n("remove"), "value": index }, [
                        ["img", { src: libD.getIcon("actions/list-remove"), alt: "Remove" }]
                    ]]
                ]]
            ]],
            ["td", { style: "text-align: center;" }, [
                ["input#quiz-editor-point-input.form-control", { "#": "pointInput", "type": "number", "min": "0", "max": "100", "cols": "3", "value": String(q.point) }]
            ]]
        ]], refs));

        refs.removeButton.onclick = (e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            removeQuestion(parseInt(btn.value, 10));
            showOverview();
        };

        refs.editButton.onclick = (e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            editOrCreateQuestion(parseInt(btn.value, 10));
        };

        refs.answerCollapseButton.onclick = (e) => {
            // Toggle hide/show of the answer div.
            if (refs.answerDiv.classList.contains("quiz-editor-hidden")) {
                refs.answerDiv.classList.remove("quiz-editor-hidden");
                refs.answerCollapseButton.innerText = _("Hide");
            } else {
                refs.answerDiv.classList.add("quiz-editor-hidden");
                refs.answerCollapseButton.innerText = _("Show");
            }
        };

        refs.pointInput.onchange = () => {
            q.point = parseFloat(refs.pointInput.value);
        };

        q.displayQuestionWording(refs.quesDiv);
        q.displayCorrectAnswer(refs.answerDiv);
    }

    /**
     * Clears the whole preview table.
     */
    function emptyPreviewTable() {
        document.getElementById("quiz-editor-overview-table-body").innerHTML = "";
    }

    /**
     * Removes a question from the current quiz.
     * @param index - The index of the question to remove from the quiz.
     */
    function removeQuestion(index: number) {
        if (0 <= index && index < currentQuiz.questions.length) {
            currentQuiz.questions.splice(index, 1);
        }
    }

    /**
     * Shows the question editor for creating a question
     * of the given question category.
     * @param qCat - Category of the question to create.
     * @see QuestionCategory
     */
    function showPaneForCategory(qCat: QuestionCategory) {
        editOrCreateQuestion(currentQuiz.questions.length, qCat);
    }

    /**
     * Creates or modifies the question at the given index.
     * If the index is greater or equal to the question list length, it will be
     * created at the end of the question list, otherwise it will be edited.
     * @param index
     * @param qCat
     */
    function editOrCreateQuestion(index: number, qCat?: QuestionCategory) {
        const create = index >= currentQuiz.questions.length;
        // Cannot create if the question category isn't set.
        if (create && qCat === undefined) {
            return;
        }

        // Remove previous question edit pane.
        let qEditPane = document.getElementById("quiz-editor-QuestionEdit-pane");
        if (qEditPane) {
            qEditPane.parentElement.removeChild(qEditPane);
        }

        const refs = {
            editorDiv: undefined as HTMLElement,
            validationButton: undefined as HTMLButtonElement,
        };
        qEditPane = libD.jso2dom(["div#quiz-editor-QuestionEdit-pane.quiz-editor-pane", [
            ["div", { "#": "editorDiv" }],
            ["p.big-center", ["button.btn btn-primary", { "#": "validationButton" }, window.AudeGUI.l10n("Validate")]]
        ]], refs);

        const questionEditor = new QuestionEditor(refs.editorDiv, (create ? qCat : currentQuiz.questions[index].category));
        if (!create) {
            questionEditor.setCurrentQuestion(currentQuiz.questions[index]);
        }

        content.appendChild(qEditPane);

        refs.validationButton.onclick = (e) => {
            currentQuiz.questions[(create ? currentQuiz.questions.length : index)] = questionEditor.getCurrentQuestion();
            showOverview();
            setCurrentState(QuizEditorState.Overview);
        };

        setCurrentState(QuizEditorState.QuestionEdit);
    }

    /**
     * Sets the current state of this editor.
     * Additionally, shows the pane corresponding to the new state and hides
     * the pane corresponding to the previous state.
     */
    function setCurrentState(newState: QuizEditorState) {
        if (newState === currentState) {
            return true;
        }

        if (currentState !== QuizEditorState.Overview && newState === QuizEditorState.Save) {
            if (!window.confirm(window.AudeGUI.l10n("Do you really want to cancel your quiz edition?"))) {
                return;
            }
        }

        if (currentState !== undefined) {
            container.classList.remove(QuizEditorState[currentState] + "-mode");
        }

        const currentPane = document.getElementsByClassName("quiz-editor-current-pane")[0];
        if (currentPane) {
            currentPane.classList.remove("quiz-editor-current-pane");
        }

        container.classList.add(QuizEditorState[newState] + "-mode");
        document.getElementById("quiz-editor-" + QuizEditorState[newState] + "-pane").classList.add("quiz-editor-current-pane");

        currentState = newState;
    }

    /** Initializes and shows the pane allowing to save the quiz to file. */
    function showSavePane() {
        const refs: any = {};
        const savePane = libD.jso2dom(["div#quiz-editor-Save-pane.quiz-editor-pane", [
            ["div", { "style": "position: relative" }, [
                ["div", ["p", ["label", [
                    ["#", window.AudeGUI.l10n("Quiz title:") + " "],
                    ["input#quiz-editor-titleInput", {
                        "#": "quizTitleInput",
                        "type": "text",
                        "placeholder": window.AudeGUI.l10n("Title…")
                    }
                    ]
                ]]]],
                ["div", ["p", ["label", [
                    ["#", window.AudeGUI.l10n("Your name:") + " "],
                    ["input#quiz-editor-authorInput", {
                        "#": "authorInput",
                        "type": "text",
                        "placeholder": window.AudeGUI.l10n("Enter your name…")
                    }
                    ]
                ]]]],
                ["div", ["p", ["label", [
                    ["#", window.AudeGUI.l10n("Description:") + " "],
                    ["textarea#quiz-editor-descriptionTextarea", {
                        "#": "descriptionTextarea",
                        "rows": "4",
                        "cols": "40",
                        "spellcheck": "false",
                        "placeholder": window.AudeGUI.l10n("Description…")
                    }
                    ]
                ]]]]
            ]],
            ["button#quizEditor_saveValidation", { "#": "validationButton" }, window.AudeGUI.l10n("Validate")]
        ]], refs);

        refs.validationButton.onclick = () => {
            parseQuizInfo();
            save();
            close();
        };

        refs.quizTitleInput.value = currentQuiz.title || "";
        refs.authorInput.value = currentQuiz.author || "";
        refs.descriptionTextarea.value = currentQuiz.description || "";

        content.appendChild(savePane);
        setCurrentState(QuizEditorState.Save);
    }
}
