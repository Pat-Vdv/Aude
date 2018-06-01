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

    var quizEditor         = null;
    var quizEditorContent  = null;
    var win                = null;
    var designerAns        = null;
    var designerQue        = null;
    var currentState       = null;
    var mcqR               = null;
    var mcqNumberOfChoices = 0;
    var automatonR         = null;
    var regexR             = null;
    var quiz               = null;

    AudeGUI.QuizEditor = {
        load: function () {},

        run: openQuizEditor,
        /*
         * Open an old quiz.
         * @param. code: old "quiz object"
         */
        open: function (code) {
            try {
                mcqR       = {};
                mcqNumberOfChoices = 0;
                automatonR = {};
                regexR    = {};
                emptyPreviewTable();
                quiz = JSON.parse(code);
                showQuizOverview("shift");
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
        },

        /*
         * Save the current quiz in a file in the local storage of the user computer.
         */
        save: function () {
            cleanDesigners();
            var jsonQuiz = JSON.stringify(quiz);
            var blob     = new Blob([jsonQuiz], {type: "application/json"});
            var date     = quiz.date;
            var author   = quiz.author;
            date         = date.replace(" ","");
            author       = author.replace(" ","-");
            var fileName = "Quiz_" + date + "_" + quiz.author + ".json";

            saveAs(blob, fileName);
        },

        close: function () {
            if (!quizEditor) {
                return;
            }

            win.minimize();
        }
    };

    function openQuizEditor() {
        if (win) {
            win.show();
            return;
        }

        drawQuizEditor();
    }

    /*
     * Create the toobar and the overview pane of questions.
     * Add events on that elements.
     * It's call once at quiz editor opening
     */
    function drawQuizEditor() {
        if (win && win.ws) {
            win.close();
            quizEditor.parentNode.removeChild(quizEditor);
        }

        designerAns  = null;
        designerQue  = null;
        currentState = null;
        mcqR         = {};
        mcqNumberOfChoices = 0;
        automatonR   = {};
        regexR       = {};
        quiz         = {
            title:  "",
            author: "",
            date:   "",
            description: [],
            questions: []
        };


        let refs = {};

        let quizEditorWindowContent = ["div#quiz-editor.libD-ws-colors-auto libD-ws-size-auto", {"#":"root"}, [
            ["div", [
                ["div#quiz-editor-open-save-buttons", {"style": "text-align:left"}, [
                    ["input#quiz-editor-open", {"#": "open", "type": "button", "value": _("Open")}],
                    ["input#quiz-editor-file", {"#": "file", "type": "file", "style": "display: none"}],
                    ["input#quiz-editor-save", {"#": "save", "type": "button", "value": _("Save")}],
                    ["input#quiz-editor-save", {"#": "destroy", "type": "button", "value": _("New quiz")}],
                ]],

                ["input#quiz-editor-overview-btn", {"#":"overview", "type": "button", "value": _("Show the quiz overview")}],

                ["a#close-quiz-editor", {"#": "close", "href": "#"}, _("Close the Quiz Editor")],
            ]],

            ["section#quiz-editor-content", {"#":"content"}, [
                ["div#quiz-editor-overview-pane.quiz-editor-pane", [
                    ["h1", _("Quiz Overview")],
                    ["table#quiz-editor-overview-table", {"style": "display:none"}, [
                        ["tr", [
                            ["th", _("Nb")],
                            ["th", {"style":"width:100%"}, _("Questions")],
                            ["th", {"style":"width:100%"}, _("Answers")],
                            ["th", _("Edit")],
                            ["th", _("Points")]
                        ]]
                    ]],

                    ["p#quiz-editor-nothing-yet", {"#":"nothingYet"}, _("There is no question in this quiz yet. Click on the button bellow to add a new question.")],

                    ["p", ["button#quiz-editor-new-question-btn", {"#": "newQuestion"}, [
                        ["img", {"src": libD.getIcon("actions/list-add"), "alt":" + "}],
                        ["#", " " + _("Add a question")]
                    ]]]
                ]]
            ]]
        ]];

        win = libD.newWin({
            title:      _("Quiz Editor"),
            show:       true,
            fullscreen: true,
            content: libD.jso2dom(quizEditorWindowContent, refs)
        });

        quizEditor = refs.root;
        quizEditorContent = refs.content;

        refs.overview.onclick = showQuizOverview.bind(null, "show");

        // Close the quiz editor
        refs.close.onclick = AudeGUI.QuizEditor.close;

        //  Open a old quiz
        refs.open.onclick = function () {
            var fileinput = document.getElementById("quiz-editor-file");
            fileinput.onclick = openQuiz;
            fileinput.click();
        };

        // New question pane
        refs.newQuestion.onclick = setCurrentState.bind(null, "new-question");

        // Save the quiz
        refs.save.onclick = function () {
            let correctState = (
                document.getElementById("quiz-editor-new-question-pane").style.display != "none"
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

        refs.destroy.onclick = function () {
            if (window.confirm(_("Do you really want to start a new quiz from scratch?"))) {
                drawQuizEditor();
            }
        }

        drawNewQuestionPane();
        setCurrentState("overview");
    }

    /*
     * Add  if (mode = "") the last edit question to the overview table
     * else (mode = shift) show the overview table from all the quiz object
     */
    function showQuizOverview(mode) {
        switch (mode) {
            case "":
                questionPreview(quiz.questions.length - 1);
                break;

            case "shift":
                if (quiz.questions) {
                    for (var i = 0; i < quiz.questions.length; i++) {
                        questionPreview(i);
                    }
                }
                break;

            case "show":
                // Do nothing specific, we just want to show the stuff actually
                break;
        }

        console.log("Questions", quiz.questions);
        if (quiz.questions.length) {
            document.getElementById("quiz-editor-overview-table").style.display = "table";
            document.getElementById("quiz-editor-nothing-yet").style.display = "none";
        } else {
            document.getElementById("quiz-editor-overview-table").style.display = "none";
            document.getElementById("quiz-editor-nothing-yet").style.display = "";
        }

        redrawAutomata();

        setCurrentState("overview");
    }

    /*
     * Add the questions[index] to the overview table
     */
    function questionPreview(index) {
        var q = quiz.questions[index];
        var overviewTable = document.getElementById("quiz-editor-overview-table");
        overviewTable.style.display = "table";

        var refs = {};
        overviewTable.appendChild(libD.jso2dom(["tr", [
            ["td", [
                ["div", {"style": "text-align: center"}, "" + (index + 1)]
            ]],
            ["td", [
                ["div", {"#": "quesDiv"}]
            ]],
            ["td", [
                ["div", {"#": "answDiv"}]
            ]],
            ["td", [
                ["div", {"style": "text-align: center"}, [
                    ["button#quiz-editor-modifQuestion" + index, {"#": "modifButton", "title": _("edit")}, [
                        ["img", {"src": libD.getIcon("actions/document-edit"), "alt": "Edit"}]
                    ]],
                    ["button#quiz-editor-removeQuestion" + index, {"#": "removeButton", "title": _("remove")}, [
                        ["img", {"src": libD.getIcon("actions/list-remove"), "alt": "Remove"}]
                    ]]
                ]]
            ]],
            ["td", {"style": "text-align: center;"}, [
                ["button#quiz-editor-addPoint" + index, {"#": "addPoint", "title": _("+1")}, [
                    ["img", {"src": libD.getIcon("actions/arrow-up"), "alt": _("+1")}]
                ]],
                ["div#quiz-editor-divPoint" + index, {"#": "divPoint"}, "" + q.point],
                ["button#quiz-editor-removePoint" + index, {"#": "removePoint", "title": _("-1")}, [
                    ["img", {"src": libD.getIcon("actions/arrow-down"), "alt": "-1"}]
                ]]
            ]]
        ]], refs));

        refs.removeButton.onclick = function () {
            emptyPreviewTable();
            removeQuestion(index);
            showQuizOverview("shift");
        }

        refs.addPoint.onclick = function () {
            addPoint(index);
        };

        refs.removePoint.onclick = function () {
            removePoint(index);
        };

        switch (q.type) {
            case "mcq":
                refs.modifButton.onclick = function () {
                    modifyMcQuestion(index);
                }

                refs.quesDiv.appendChild(libD.jso2dom([
                    ["p", {"#": "instruction"}],
                    ["div", [
                        ["ul", {"#":"list", "style": "list-style-type: none;"}]
                    ]]
                ], refs));
                AudeGUI.Quiz.textFormat(q.instruction, refs.instruction, true);

                for (var i = 0; i < q.possibilities.length; i++) {
                    refs.list.appendChild(libD.jso2dom(["li", [
                        ["span", {"class": "quiz-answer-id"}, q.possibilities[i].id + ". "],
                        ["span", q.possibilities[i].text]
                    ]]));
                }

                refs.answDiv.appendChild(libD.jso2dom(["p", q.answers.toString()]));
                break;

            case "automatonEquiv":
                refs.modifButton.onclick = function () {
                    modifyAutomatonR(index);
                }

                refs.quesDiv.appendChild(libD.jso2dom([
                    ["p", {"#": "instruction"}],
                    ["div", {
                        "#": "quesAutomatonDiv",
                        "style": "min-height: 100px; position:relative;"
                    }]
                ], refs));
                AudeGUI.Quiz.textFormat(q.instructionHTML, refs.instruction, true);
                refs.answDiv.appendChild(libD.jso2dom(["div", {
                    "#": "answAutomatonDiv",
                    "style": "min-height: 100px; position:relative;"
                }], refs));

                if (q.automatonQuestion) {
                    designerQue = new AudeDesigner(refs.quesAutomatonDiv, true);
                    designerQue.setAutomatonCode(
                        q.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {                                // Necessary to show the automaton
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
                } else {
                    refs.quesAutomatonDiv.style.display = "none";
                }

                if (!isAutomatonNull(q.automatonAnswer)) {
                    designerAns = new AudeDesigner(refs.answAutomatonDiv, true);
                    designerAns.setAutomatonCode(
                        q.automatonAnswer,
                        designerAns.currentIndex
                    );
                    setTimeout(function () {
                        designerAns.redraw();
                        designerAns.autoCenterZoom();
                    }, 0);
                } else {
                    refs.answAutomatonDiv.style.display = "none";
                    refs.answDiv.style.textAlign = "center";
                    refs.answDiv.textContent = "null";
                }

                q.overviewAutomatonQue = designerQue;
                q.overviewAutomatonAns = designerAns;
                break;

            case "regexEquiv":
                refs.modifButton.onclick = function () {
                    modifyRegexR(this);
                }

                refs.quesDiv.appendChild(libD.jso2dom([
                    ["p", {"#": "instruction"}],
                    ["div", {
                        "#": "quesAutomatonDiv",
                        "style": "min-height: 100px; position:relative;"
                    }]
                ], refs));

                AudeGUI.Quiz.textFormat(q.instructionHTML, refs.instruction, true);
                refs.answDiv.appendChild(libD.jso2dom(["p", q.regex]));

                if (q.automatonQuestion) {
                    designerQue = new AudeDesigner(refs.quesAutomatonDiv, true);
                    designerQue.setAutomatonCode(
                        q.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
                } else {
                    refs.quesAutomatonDiv.style.display = "none";
                }

                q.overviewAutomatonQue = designerQue;
                break;

            case "word":
                break;
        }
    }

    /*
     * Create the new question pane.
     * Add events on that elements.
     * It's called once at quiz editor opening
     */
    function drawNewQuestionPane() {
        var refs = {};
        var newQuestionPane = libD.jso2dom(["div#quiz-editor-new-question-pane.quiz-editor-pane", [
            ["h1", _("New Question")],
            ["div", {"#": "content", "style": "display: inline-grid; width: 90%; margin: 1%;"}]
        ]], refs);

        let contentList = [
            _("Multiple Choice Question"),
            _("Find an automaton"),
            _("Find a regular expression")
        ];

        let exampleList = [
            _("Example: Which of the following assertions are correct? (check the correct answers)"),
            _("Example: For the following languages, give an automaton that recognizes it (if such an automaton exists)."),
            _("Example: For the following minimal automaton, give a regular expression that is equivalent.")
        ];

        for (var i = 0; i < contentList.length; i++) {
            refs.content.appendChild(
                libD.jso2dom(
                    ["button#quiz-editor-category" + i, {"#": "currentA"}, [
                            ["strong", contentList[i]],
                            ["br"],
                            ["i", exampleList[i]]
                    ]],
                    refs
                )
            );

            refs.currentA.onclick = function () {
                newQuestionCategory(this.id);
            }
        }
        quizEditorContent.appendChild(newQuestionPane);
    }

    /*
     * Call the function which correspond to the element clicked from the new quesiton pane
     */
    function newQuestionCategory(elementId) {
        // 0 for mcq, 1 for automatonR, 2 for regexR
        var index = parseInt(elementId.substr(-1), 10);

        designerQue = null;
        designerAns = null;

        switch (index) {
            case 0 :
                showMcqPane("");
                break;
            case 1 :
                showAutomatonRPane("");
                break;
            case 2 :
                showRegexRPane("");
                break;
        }
    }

    /*
     * Open a olo quiz from user local storage.
     */
    function openQuiz() {
        var file = document.getElementById("quiz-editor-file"); // input file
        file.onchange = function () {
            var freader = new FileReader()
            freader.onload = function () {
                AudeGUI.QuizEditor.open(freader.result); // freader.result containt stringify(quiz object)
            };
            freader.readAsText(file.files[0], "utf-8");
        }
    }

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

        var quizTitleInput      = document.getElementById("quiz-editor-titleInput");
        var authorInput         = document.getElementById("quiz-editor-authorInput");
        var descriptionTextarea = document.getElementById("quiz-editor-descriptionTextarea");

        var date         = new Date();
        quiz.title       = quizTitleInput.value;
        quiz.author      = authorInput.value;
        quiz.date        = "" + (date.getDate() + " " + tableMonth[date.getMonth()] + " " + date.getFullYear());
        quiz.description = descriptionTextarea.value;
    }

    function showSavePane() {
        var refs = {};
        var savePane  = libD.jso2dom(["div#quiz-editor-save", [
            ["div", {"style": "position: relative"}, [
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
                            "spellcheck":"false",
                            "placeholder": _("Description…")
                        }
                    ]
                ]]]]
            ]],
            ["button#quizEditor_saveValidation", {"#": "validationButton"}, _("Validate")]
        ]], refs);

        refs.validationButton.onclick = function () {
            saveQuiz();
            AudeGUI.QuizEditor.save();
            AudeGUI.QuizEditor.close();
        }

        refs.quizTitleInput.value      = quiz.title       || "";
        refs.authorInput.value         = quiz.author      || "";
        refs.descriptionTextarea.value = quiz.description || "";

        quizEditorContent.appendChild(savePane);
        setCurrentState("save")
    }

    /*
     * Remove a question from the quiz object and the overview table
     */
    function removeQuestion(index) {
        quiz.questions.splice(index, 1);
    }

    function addPoint(index, point) {
        if (quiz.questions[index].point < 100) {
            quiz.questions[index].point++;
        }
        document.getElementById("quiz-editor-divPoint" + index).textContent = "" + quiz.questions[index].point;
    }

    function removePoint(index, point) {
        if (quiz.questions[index].point > 0) {
            quiz.questions[index].point--;
        }
        document.getElementById("quiz-editor-divPoint" + index).textContent = "" + quiz.questions[index].point;
    }

    // --- FOR MULTIPLES CHOICE QUESTIONS

    function showMcqPane(mode, index) {
        var mcqPane = document.getElementById("quiz-editor-mcq-pane");
        if (mcqPane) {
            mcqPane.parentNode.removeChild(mcqPane);
        }

        mcqR = {};
        mcqNumberOfChoices = 2;

        var refs = {};

        mcqPane = libD.jso2dom(["div#quiz-editor-mcq-pane.quiz-editor-pane", [
            ["h1", _("Multiple Choice Question")],
            ["p", ["input#quiz-editor-questionArea", {
                "type": "text",
                "placeholder": _("Write your question…"),
                "#": "questionArea"
            }]],
            ["p", _("Write the different possible answers and check the correct ones.")],
            ["div#quiz-editor-choiceArea", {"#": "choiceArea"}],
            ["p", ["button", {"#": "addButton", "title": _("Add")}, [
                ["img", {"src": libD.getIcon("actions/list-add")}],
                ["#", _("Add an answer")]
            ]]],
            ["p.big-center", ["button", {"#": "validationButton"}, _("Validate")]]
        ]], refs);

        let choice_list = [];

        for (var i = 0; i < mcqNumberOfChoices; i++) {
            var q = libD.jso2dom([
                ["div#quiz-editor-choice" + i, [
                    ["input", {"type": "checkbox"}],
                    ["input", {"type": "text", "name":"questionArea", "placeholder": libD.format(_("Choice {0}…"), i + 1)}],
                    ["button", {"#": "removeButton", "title": _("remove")}, [
                        ["img", {"src": libD.getIcon("actions/list-remove"), "alt": _("Remove")}]
                    ]]
                ]]
            ], refs);

            refs.choiceArea.appendChild(q);
            refs.removeButton.onclick = removeChoice.bind(null, q);
        }

        refs.addButton.onclick = addChoice;
        refs.validationButton.onclick = function () {
            mcqValidation(mode, index);
            showQuizOverview((mode == "") ? "" : "shift");
        }

        quizEditorContent.appendChild(mcqPane);

        setTimeout(
            function () {
                refs.questionArea.focus();
            },
            0
        );

        setCurrentState("mcq");
    }

    /*
     * Push the current question in the quiz object.
     */
    function mcqValidation(mode, index) {
        mcqR = {
            type:          "mcq",
            instruction:   document.getElementById("quiz-editor-questionArea").value,
            answers:       [],
            possibilities: [],
            point:         0,
            overviewAutomatonQue: null,
            overviewAutomatonAns: null
        };

        var choiceArray = document.getElementById("quiz-editor-choiceArea").childNodes;
        for (var i = 0, a_acsiiCode  = 97; i < choiceArray.length; i++) {
            var choice = choiceArray[i].childNodes;
            var value = choice[1].value.trim();

            if (!value) {
                continue; // if the answer is empty, skip it
            }

            // push the id of the correct possibility in mcqR
            if (choice[0].checked) {
                mcqR.answers.push(String.fromCharCode(a_acsiiCode));
            }

            // push the id and text of the possibility in mcqR
            var possibility = {
                id:   String.fromCharCode(a_acsiiCode),
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
        var q      = quiz.questions[index];
        var possibilities = q.possibilities;
        var answers       = q.answers;

        showMcqPane("shift", index);
        document.getElementById("quiz-editor-questionArea").value = q.instruction;
        for (var i = 0, choiceDiv; i < possibilities.length; i++) {
            if (i > 1) {
                addChoice();
            }
            choiceDiv    = document.getElementById("quiz-editor-choice" + i).childNodes;
            choiceDiv[1].value = possibilities[i].text;
        }

        for (var i = 0, choiceDiv, id; i < answers.length; i++) {
            id = answers[i].charCodeAt(0) - "a".charCodeAt(0);
            choiceDiv    = document.getElementById("quiz-editor-choice" + id).childNodes;
            choiceDiv[0].checked = "checked";
        }
    }

    /*
     * Add a possibility to the question
     */
    function addChoice() {
        var choiceArea = document.getElementById("quiz-editor-choiceArea");
        var refs  = {};
        var q = libD.jso2dom(["div#quiz-editor-choice" + (mcqNumberOfChoices), [
                ["input", {"type": "checkbox"}],
                ["input", {"#": "addedInput", "type": "text", "placeholder": libD.format(_("Choice {0}…"), mcqNumberOfChoices + 1)}],
                ["button", {"#": "removeButton", "title": _("remove")}, [
                    ["img", {"src": libD.getIcon("actions/geany-close-all"), "alt": _("Remove")}]
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

        var children = parent.childNodes;
        for (var i = 0; i < children.length; i++) {
            children[i].id = "quiz-editor-choice" + i;
            children[i].childNodes[1].placeholder = libD.format(_("Choice {0}…", (i+1)));
        }
        mcqNumberOfChoices--;
    }

    function showAutomatonRPane(mode, index) {
        automatonR = {};
        designerAns = null;
        designerQue = null;
        var refs = {};
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
                            "spellcheck":"false",
                            "placeholder": _("Type the question here…")
                        }],
                        ["p", ["label", [
                            ["input#quiz-editor-drawAutomaton", {
                                "#": "drawAutomaton",
                                "type": "checkbox"
                            }],
                            ["#", " " + _("Draw an automaton")]
                        ]]],
                        ["div.quiz-editor-flex", {"#": "automatonQueDiv"}, [
                            ["div.automaton-draw-area"]
                        ]]
                    ]]
                ]],
                ["div.quiz-editor-disp-flex", [
                    ["h2", _("Answer")],
                    ["div.quiz-editor-flex", {"#": "automatonAnsDiv"}, [
                        ["div.automaton-draw-area"]
                    ]]
                ]]
            ]],
            ["div", {"style":"display:flex;"}, [
                ["textarea#quiz-editor-audescriptCode", {
                    "#": "audescriptCode",
                    "rows":4,
                    "style":"flex:1",
                    "spellcheck":"false",
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
            ["button", {"#": "validationButton"}, _("Validate")]
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
                AudeGUI.Quiz._ajsEval(script, autoAnsw, A);
            }

            automatonRValidation(mode, index);
            showQuizOverview((mode == "") ? "" : "shift");
        };

        setCurrentState("automatonR");
    }

    /*
     * Push the current question in the quiz object.
     */
    function automatonRValidation(mode, index) {
        automatonR = {
            type:"automatonEquiv",
            instructionHTML:   document.getElementById("quiz-editor-automatonRTextarea").value,
            automatonQuestion: null,
            automatonAnswer:   designerAns.getAutomatonCode(designerAns.currentIndex, false),
            audescriptCode :   document.getElementById("quiz-editor-audescriptCode").value,
            point:             0,
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
        var q  = quiz.questions[index];

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
            document.getElementById("quiz-editor-audescriptCode").value = q.audescriptCode;
        }

        designerAns.setAutomatonCode(
            q.automatonAnswer,
            designerAns.currentIndex
        );
        designerAns.autoCenterZoom();
    }

    // --- FOR REGULAR EXPRESSIONS RESEARCHER

    function showRegexRPane(mode, index) {
        regexR = {};
        var refs  = {};

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
                            "spellcheck":"false",
                            "placeholder": _("Write your question…")
                        }],
                        ["p",
                            ["button#quiz-editor-drawAutomaton", {
                                    "#" : "drawAutomaton",
                                },
                                _("Draw an automaton")
                            ]
                        ],
                        ["div.automaton-draw-area", {"#": "automatonQueDiv", "style": "display: none"}]
                    ]]
                ]],
                ["div", [
                    ["h1", _("Answer")],
                    ["div", [
                        ["textarea#quiz-editor-regex", {
                            "rows": 10,
                            "spellcheck":"false",
                            "placeholder": _("Write a regular expression…")
                        }]
                    ]]
                ]]
            ]],
            ["p.big-center", ["button", {"#": "validationButton"}, _("Validate")]]
        ]], refs);

        refs.drawAutomaton.onclick = function () {
            refs.drawAutomaton.parentNode.style.display   = "none";
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
                        regexToAutomaton(document.getElementById("quiz-editor-regex").value);
                    } catch (e) {
                        AudeGUI.notify(
                            _("This regular expresion does not seem valid."),
                            _("Recognized operations: “.”, “*”, “+”."),
                            "error"
                        );
                        return;
                    }

                    regexRValidation(mode, index);
                    showQuizOverview((mode == "") ? "" : "shift");
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
        setCurrentState("regexR");
    }

    /*
     * Push the current question in the quiz object.
     */
    function regexRValidation(mode, index) {
        regexR = {
            type:"regexEquiv",
            instructionHTML:   document.getElementById("quiz-editor-regexRTextarea").value,
            automatonQuestion: null,
            regex: document.getElementById("quiz-editor-regex").value,
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
        var q  = quiz.questions[index];

        showRegexRPane("shift", index);
        AudeGUI.Quiz.textFormat(q.instructionHTML, document.getElementById("quiz-editor-regexRTextarea"), true);
        document.getElementById("quiz-editor-regex").value          = q.regex;

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
        var overviewTable = document.getElementById("quiz-editor-overview-table");
        for (var i = quiz.questions.length; i > 0 ; i--) {
            overviewTable.deleteRow(i);
        }
    }

    /*
     * Return question index starting from the edit th
     */
    function questionIndex(element) {
        var td    = element.parentNode.parentNode;
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

    /*
     * Possible states:
     *  - overview
     *  - new-question
     *  - save
     *  - mcq
     *  - automatonR
     *  - regexR
     */

    function setCurrentState(newState) {
        if (newState === currentState) {
            return true;
        }

        if (currentState !== "overview" && newState === "save") {
            if (!window.confirm(_("Do you really want to cancel your quiz edition?"))) {
                return;
            }
        }

        if (currentState) {
            quizEditor.classList.remove(currentState + "-mode");
        }

        let currentPane = document.getElementsByClassName("quiz-editor-current-pane")[0];
        if (currentPane) {
            currentPane.classList.remove("quiz-editor-current-pane");
        }

        quizEditor.classList.add(newState + "-mode");
        document.getElementById("quiz-editor-" + newState + "-pane").classList.add("quiz-editor-current-pane");

        currentState = newState;
    }

    function isAutomatonNull(A) {
        var designer = new AudeDesigner(document.createElement("div"), true);
        designer.setAutomatonCode(A);
        A = designer.getAutomaton(designer.currentIndex);
        return (A.getStates().card() === 1) && (A.getAlphabet().card() === 0) && (A.getInitialState() === "") && (A.getTransitions().card() === 0) && (A.getFinalStates().card() === 0);
    }

}(window));
