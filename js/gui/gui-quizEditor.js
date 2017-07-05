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

    var _ = function (textToTranslate) {        // var _ != AudeGUI.l10n; before add the quizEditor's translate
        return textToTranslate;
    };
    var AudeGUI          = pkg.AudeGUI;
    var quizeditor       = null;                      // quizeditor element in the HTML DOM
    var win              = null;                      // Quiz editor's window
    var refs             = {};
    var designerAns      = null;
    var designerQue      = null;
    var currentState     = null;
    var mcqR             = {};                        // Multiple choice questions' object
    var mcqNumberOfChoices = 0;
    var automatonR       = {};                        // Automaton research questions' object
    var regexR           = {};                        // regular expr research questions' object
    var quiz = {
        title:  "",
        author: "",
        date:   "",
        description: [],
        questions: []
    };

    AudeGUI.QuizEditor = {

        load: function () {
            quizeditor   = document.getElementById("quizEditor");
        },

        run: function () {
            drawQuizeditorPane();
            loadNewQuestionPane();
            AudeGUI.QuizEditor.standby();
        },

        open: function (code) {
            try {
                mcqR       = {};
                mcqNumberOfChoices = 0;
                automatonR = {};
                regexR    = {};
                grainPreviewTable();
                quiz = JSON.parse(code);
                showQuizeditorPane("shift");
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
            document.getElementById("quizeditor-mainPane").textContent = "";
            AudeGUI      = pkg.AudeGUI;
            quizeditor   = null;
            refs         = {};
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
            win.close();


        },

        standby: function () {

            //  Open a old quiz
            document.getElementById("quizeditor-open").onclick = function () {
                var fileinput = document.getElementById("quizeditor-file");
                fileinput.onclick = openQuiz;
                fileinput.click();
            };

            // New question pane
            document.getElementById("quizeditor-newquestion").onclick = function () {
                showNewQuestionPane();
            };

            // Save the quiz
            document.getElementById("quizeditor-save").onclick = function () {
                let correctState =
                    document.getElementById("quizeditor-newquestionPane").style.display != "none"
                    || document.getElementById("quizeditor-mcqPane");
                let confirm = true;
                if (correctState) {
                    confirm = window.confirm(_("Do you really want to cancel your quiz modification ? "));
                }
                if (confirm) {
                    showSavePane();
                }
            };
        }
    };


    function drawQuizeditorPane () {
        setCurrentState("previewPane");

        if (win && win.ws) {
            win.close();
        }

        let quizeditorPaneContent = ["div#quizeditor-Pane.libD-ws-colors-auto libD-ws-size-auto" ,
            {id:"quizeditor-mainPane"},[
            ["div", [
                ["input#quizeditor-open", {type: "button", value: _("Open")}],

                ["input#quizeditor-file", {type: "file", style: "display:none"}],

                ["button#quizeditor-undo", {title:_("Undo")}, [
                    ["img", {src:libD.getIcon("actions/edit-undo"), alt:"Undo"}]
                ]],

                ["button#quizeditor-redo", {title:_("Redo")}, [
                    ["img", {src:libD.getIcon("actions/edit-redo"), alt:"Redo"}]
                ]],

                ["input#quizeditor-newquestion", {type: "button", value: _("New question")}],

                ["input#quizeditor-save", {type: "button", value: _("Save")}],

                ["a#close-quiz", {id: "close-quiz", "href": "#"}, _("Close the Quiz Editor")],

                ["div",[
                    ["input#quizeditor-research",{
                        type: "search",
                        name:"searchArea",
                        placeholder: _("Search ..."),
                        style:"position: absolute; top: 2.5%; right: 2%; width: 23%;"
                    }],
                    ["ul#quizeditor-researchPane", {
                        style:"display: none; z-index:1; position: absolute; top: 3.1%; right: 2%; border: 1px solid darkgrey; padding-left: 0px; width: 23%; background-color: white;"
                        }, [
                            ["li#quizeditor-searchCategory0",{style: "display: none"}, [
                                ["a", _("Multiple Choice Question")]
                            ]],
                            ["li#quizeditor-searchCategory1",{style: "display: none"}, [
                                ["a", _("Find an automaton")]
                            ]],
                            ["li#quizeditor-searchCategory2",{style: "display: none"}, [
                                ["a", _("Find a regular expression")]
                            ]]
                        ]
                    ]
                ]]
            ]],
            ["div#quizeditor-content", {"#":"root"}, [
                ["div#quizeditorPane", [
                    ["table#quizeditor-preview", {
                        "style": "display:none; position: absolute; width:90%; top:7%; left: 5%"
                    }, [
                        ["tr", [
                            ["th", {"style": "width:4%; text-align: center;"}, _("N°")],
                            ["th", {"style": "text-align: center;"}, _("Questions")],
                            ["th", {"style": "text-align: center; width: 35%"}, _("Answers")],
                            ["th", {"style": "width:4%; text-align: center;"}, _("Modifications")]
                        ]]
                    ]]
                ]]
            ]]
        ]];

        win = libD.newWin({
            title:      _("Quiz editor"),
            show:       true,
            fullscreen: true,
            content: libD.jso2dom(quizeditorPaneContent, refs)
        });

        document.getElementById("close-quiz").onclick = function () {
            AudeGUI.QuizEditor.close();
        };

        // Events
        var tabref = [
            "true, vraies, false, faux, fausses, choice, choix, multiples",
            "automaton, automate, find, trouver, determiniser, elemination, epsilon, transitions, minimisations, complementaires, produits, complete",
            "regular, regulière, expressions"
        ];
        var search = document.getElementById("quizeditor-research");

        search.onkeyup = function () {
            researchBar(tabref, this);
        };

        var ul = document.getElementById("quizeditor-researchPane");
        for (var i = 0, li = null, id = ""; i < ul.childNodes.length; i++) {
            li = ul.childNodes[i];
            li.onmouseover = function () {
                this.style.backgroundColor = "aliceblue";
            };

            li.onmouseout = function () {
                this.style.backgroundColor = "white";
            };

            li.onclick = function () {
                search.value = "";
                search.placeholder = _("Search ...");
                ul.style.display = "none";
                id = "quizeditor-category" + this.id.substr(-1);
                document.getElementById(id).click();
            }
        }

        search.onblur = setTimeout(0, function () {
            this.value = "";
            this.placeholder = _("Search ...");
            ul.style.display = "none";
        });
    }

    /*
     * Add the last edit question to the preview table if (mode = "")
     * else show the preview table from alll the object quiz if (mode = shift)
     */
    function showQuizeditorPane (mode) {
        if (!setCurrentState("previewPane")) {
            return;
        }
        switch (mode) {
            case "":
                questionPreview(quiz.questions.length - 1);
                break;

            case "shift":
                if (quiz.questions != []) {
                    for (var i = 0; i < quiz.questions.length; i++) {
                        questionPreview(i);
                    }
                }
        }
        document.getElementById("quizeditorPane").style.display = "initial";
        redrawAutomatons();
        AudeGUI.QuizEditor.standby();
    }

    function questionPreview (index) {
        var previewTable = document.getElementById("quizeditor-preview");

        var tr           = document.createElement("tr");
        var td           = document.createElement("td");
        var quesNumber   = document.createElement("div");
        var quesDiv      = document.createElement("div");
        var answDiv      = document.createElement("div");
        var modification = document.createElement("div");
        var modifButton  = document.createElement("button");
        var removeButton = document.createElement("button");

        quesNumber.textContent = index + 1;

        modifButton.id    = "quizeditor-modifQuestion" + index;
        modifButton.title = _("remove");
        var modifImg = document.createElement("img");
        modifImg.src = libD.getIcon("actions/draw-brush");
        modifImg.alt = "Remove";
        modifButton.appendChild(modifImg);

        removeButton.id    = "quizeditor-removeQuestion" + index;
        removeButton.title = _("remove");
        var removeImg = document.createElement("img");
        removeImg.src = libD.getIcon("actions/list-remove");
        removeImg.alt = "Remove";
        removeButton.appendChild(removeImg);
        removeButton.onclick = function () {
            grainPreviewTable();
            removeQuestion(this);
            showQuizeditorPane("shift");
        }

        modification.appendChild(modifButton);
        modification.appendChild(removeButton);

        td.appendChild(quesNumber);
        tr.appendChild(td);
        td = document.createElement("td");
        td.appendChild(quesDiv);
        tr.appendChild(td);
        td = document.createElement("td");
        td.appendChild(answDiv);
        tr.appendChild(td);
        td = document.createElement("td");
        td.appendChild(modification);
        tr.appendChild(td);
        previewTable.appendChild(tr);

        var newQuestion = quiz.questions[index];
        switch (newQuestion.type) {
            case "mcq":
                modifButton.onclick = function () {
                    modifyMcQuestion(this);
                }

                var contentQue   = document.createElement("p");
                var contentAns   = document.createElement("p");
                var quesSubDiv   = document.createElement("div");
                var list         = document.createElement("ul");
                list.style       = "list-style-type: none;"

                contentQue.textContent = newQuestion.instruction;
                for (var i = 0, li, span; i < newQuestion.possibilities.length; i++) {
                    li = document.createElement("li");
                    span = document.createElement("span");
                    span.textContent = newQuestion.possibilities[i].id + ". ";
                    span.class = "quiz-answer-id";
                    li.appendChild(span);
                    span = document.createElement("span");
                    span.textContent = newQuestion.possibilities[i].text;
                    li.appendChild(span);
                    list.appendChild(li);
                }
                quesSubDiv.appendChild(list);
                quesDiv.appendChild(contentQue);
                quesDiv.appendChild(quesSubDiv);

                contentAns.textContent = newQuestion.answers.toString();
                answDiv.appendChild(contentAns);

                break;

            case "automatonEquiv":
                modifButton.onclick = function () {
                    modifyAutomatonR(this);
                }

                var contentQue = document.createElement("p");
                contentQue.textContent = newQuestion.instructionHTML;
                quesDiv.appendChild(contentQue);
                var quesAutomatonDiv = document.createElement("div");
                var answAutomatonDiv = document.createElement("div");
                quesDiv.appendChild(quesAutomatonDiv);
                answDiv.appendChild(answAutomatonDiv);
                answAutomatonDiv.style = "min-height: 100px; position:relative; background-color: #a4c9d1;";
                quesAutomatonDiv.style = "min-height: 100px; position:relative; background-color: #a4c9d1;";

                if (newQuestion.automatonQuestion) {
                    designerQue = new AudeDesigner(quesAutomatonDiv, true);
                    designerQue.setAutomatonCode(
                        newQuestion.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
                } else {
                    quesAutomatonDiv.style.display = "none";
                }

                designerAns = new AudeDesigner(answAutomatonDiv, true);
                designerAns.setAutomatonCode(
                    newQuestion.automatonAnswer,
                    designerAns.currentIndex
                );
                setTimeout(function () {
                    designerAns.redraw();
                    designerAns.autoCenterZoom();
                }, 0);
                newQuestion.previewAutomatonQue = designerQue;
                newQuestion.previewAutomatonAns = designerAns;
                break;
            case "regexEquiv":
                modifButton.onclick = function () {
                    modifyRegexR(this);
                }

                var contentQue = document.createElement("p");
                contentQue.textContent = newQuestion.instructionHTML;
                quesDiv.appendChild(contentQue);
                var quesAutomatonDiv = document.createElement("div");
                quesAutomatonDiv.style = "min-height: 100px; position:relative; background-color: #a4c9d1;";
                quesDiv.appendChild(quesAutomatonDiv);

                if (newQuestion.automatonQuestion) {
                    designerQue = new AudeDesigner(quesAutomatonDiv, true);
                    designerQue.setAutomatonCode(
                        newQuestion.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
                } else {
                    quesAutomatonDiv.style.display = "none";
                }

                var contentAns = document.createElement("p");
                contentAns.textContent = newQuestion.regex;
                answDiv.appendChild(contentAns);
                newQuestion.previewAutomatonQue = designerQue;
                break;
            case "word":

                break;
        }

        previewTable.style.display = "initial";
    }

    function loadNewQuestionPane () {
        var newQuestionPane = document.createElement("div");
        newQuestionPane.id  = "quizeditor-newquestionPane";
        newQuestionPane.style.display = "none";

        let title = document.createElement("h1");
        title.textContent = "Category";
        let newQuesCategory = document.createElement("ul");
        let li_list = [];
        let li_listContent = [
            "Multiple Choice Question",
            "Find an automaton",
            "Find a regular expression"
        ];

        for (var i = 0; i < li_listContent.length; i++) {
            li_list[i] = document.createElement("li");
            li_list[i].id = "quizeditor-category" + i;
            li_list[i].textContent = li_listContent[i];
            li_list[i].onclick = function () {
                newQuestionCategory(this.id);
            }
            newQuesCategory.appendChild(li_list[i]);
        }

        newQuestionPane.appendChild(title);
        newQuestionPane.appendChild(newQuesCategory);

        refs.root.appendChild(newQuestionPane);
    }

    function newQuestionCategory (elementId) {
        var index = elementId.substr(-1);
        designerQue = null;
        designerAns = null;
        index = parseInt(index);
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

        AudeGUI.QuizEditor.standby();
    }

    function showNewQuestionPane () {
        if (!setCurrentState("newQuestionPane")) {
            return;
        }
        var newQuestionPane = document.getElementById("quizeditor-newquestionPane");
        newQuestionPane.style.display = "initial";
        AudeGUI.QuizEditor.standby();
    }

    function openQuiz() {
        var file = document.getElementById("quizeditor-file");
        file.onchange = function () {
            var freader = new FileReader();

            freader.onload = function () {
                AudeGUI.QuizEditor.open(freader.result);
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
        var quizTitleInput      = document.getElementById("quizeditor-titleInput");
        var authorInput         = document.getElementById("quizeditor-authorInput");
        var descriptionTextarea = document.getElementById("quizeditor-descriptionTextarea");
        var date         = new Date();
        quiz.title       = quizTitleInput.value;
        quiz.author      = authorInput.value;
        quiz.date        = "" + (date.getDate() + " " + tableMonth[date.getMonth()] + " " + date.getFullYear());
        quiz.description = descriptionTextarea.value;
    }

    function showSavePane () {
        if (!setCurrentState("savePane")) {
            return;
        }
        var savePane    = document.createElement("div");
        savePane.id     = "quizeditor-savePane";
        var information = document.createElement("div");
        var quizTitle   = document.createElement("div");
        var author      = document.createElement("div");
        var description = document.createElement("div");

        var quizTitleParag   = document.createElement("p");
        var authorParag      = document.createElement("p");
        var descriptionParag = document.createElement("p");
        quizTitleParag.textContent   = _("Quiz's title");
        authorParag.textContent      = _("Your name");
        descriptionParag.textContent = _("Description");

        var quizTitleInput      = document.createElement("input");
        var authorInput         = document.createElement("input");
        var descriptionTextarea = document.createElement("textarea");
        quizTitleInput.type        = "text";
        quizTitleInput.placeholder = _("title ...");
        quizTitleInput.id          = "quizeditor-titleInput";
        authorInput.type           = "text";
        authorInput.placeholder    = _("Enter your name ...");
        authorInput.id             = "quizeditor-authorInput";
        descriptionTextarea.rows   = 4;
        descriptionTextarea.cols   = 40;
        descriptionTextarea.placeholder  = _("Description ...");
        descriptionTextarea.id     = "quizeditor-descriptionTextarea";

        var validationButton         = document.createElement("button");
        validationButton.id          = "quizeditor_saveValidation"
        validationButton.textContent = _("Validate");
        validationButton.style       = "position: relative; left: 80%; top: 80%";
        validationButton.onclick     = function () {
            saveQuiz();
            AudeGUI.QuizEditor.save();
            AudeGUI.QuizEditor.close();
        }

        quizTitle.appendChild(quizTitleParag);
        quizTitle.appendChild(quizTitleInput);
        author.appendChild(authorParag);
        author.appendChild(authorInput);
        description.appendChild(descriptionParag);
        description.appendChild(descriptionTextarea);

        information.appendChild(quizTitle);
        information.appendChild(author);
        information.appendChild(description);
        information.style = "position: relative";

        savePane.appendChild(information);
        savePane.appendChild(validationButton);

        quiz.title       ? quizTitleInput.value      = quiz.title       : "";
        quiz.author      ? authorInput.value         = quiz.author      : "";
        quiz.description ? descriptionTextarea.value = quiz.description : "";

        refs.root.appendChild(savePane);
        AudeGUI.QuizEditor.standby();
    }

    function removeQuestion (buttonClicked) {
        var index = indexOf(buttonClicked);
        quiz.questions.splice(index, 1);
        AudeGUI.QuizEditor.standby();
    }

    function researchBar (tabref, search) {
        var ul = document.getElementById("quizeditor-researchPane");
        ul.style.display = "initial";
        var regex = new RegExp(search.value);

        for (var i = 0; i < tabref.length; i++) {
            if (regex.test(tabref[i])) {
                ul.childNodes[i].style.display = "block";
            } else {
                ul.childNodes[i].style.display = "none";
            }
        }
    }

    // For Multiples Choice Questions

    function showMcqPane (mode,index) {
        if (!setCurrentState("mcqPane")) {
            return;
        }
        mcqR = {};
        mcqNumberOfChoices = 2;

        var mcqPane = document.createElement("div");
        mcqPane.id  = "quizeditor-mcqPane";
        mcqPane.style.display = "initial";

        let title         = document.createElement("h1");
        title.textContent = _("MCQ");

        mcqPane.appendChild(title);

        let questionWordingInput         = document.createElement("input");
        questionWordingInput.id          = "quizeditor-questionArea";
        questionWordingInput.type        = "text";
        questionWordingInput.name        = "questionArea";
        questionWordingInput.placeholder = _("write your question ...");

        mcqPane.appendChild(questionWordingInput);

        let content         = document.createElement("div");;
        content.style       = "position: relative; left: 2.5%;";

        var p = document.createElement("p");
        p.textContent = _("Write the different choices and check the correct one. ");

        let choiceArea = document.createElement("div");
        choiceArea.id  = "quizeditor-choiceArea";

        let choice_list = [];

        for (var i = 0, divArea, checkbox, removeButton, removeImg; i < mcqNumberOfChoices; i++) {
            choice_list[i]             = document.createElement("input");
            choice_list[i].type        = "text";
            choice_list[i].name        = "questionArea";
            choice_list[i].placeholder = _("choice " + (i+1) + " ...");

            removeButton       = document.createElement("button");
            removeButton.title = _("remove");

            removeImg     = document.createElement("img");
            removeImg.src = libD.getIcon("actions/list-remove");
            removeImg.alt = "Remove";

            removeButton.appendChild(removeImg);

            checkbox       = document.createElement("input");
            checkbox.type  = "checkbox";

            divArea       = document.createElement("div");
            divArea.style = "position: relative; left: 2.5%;";
            divArea.id    = "quizeditor-choice" + i;
            divArea.appendChild(checkbox);
            divArea.appendChild(choice_list[i]);
            divArea.appendChild(removeButton);
            choiceArea.appendChild(divArea);

            removeButton.onclick = function () {
                removeChoice(this.parentNode);
            };
        }

        let addButton     = document.createElement("button");
        addButton.title   = _("add");
        addButton.style   = "position: relative; left: 2.5%;";
        addButton.onclick = addChoice;

        let addImg = document.createElement("img");
        addImg.src = libD.getIcon("actions/list-add");
        addImg.alt = "Add";
        addButton.appendChild(addImg);

        content.appendChild(p);
        content.appendChild(choiceArea);
        content.appendChild(addButton);

        mcqPane.appendChild(content);

        let validationButton         = document.createElement("button");
        validationButton.id          = "quizeditor-validate";
        validationButton.textContent = _("Validate");
        validationButton.style       = "position: relative; left: 80%; top: 80%";
        validationButton.onclick = function () {
            mcqValidation(mode,index);
            (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
        }

        mcqPane.appendChild(validationButton);
        refs.root.appendChild(mcqPane);
        AudeGUI.QuizEditor.standby();
    }

    function mcqValidation (mode,index) {
        var instruction   = document.getElementById("quizeditor-questionArea").value;
        var answers       = [];
        var possibilities = [];
        var possibility   = null;
        var acsiiCode     = 97;

        var parent = document.getElementById("quizeditor-choiceArea");
        var choiceArray = parent.childNodes;
        for (var i = 0, choice; i < choiceArray.length; i++) {
            choice = choiceArray[i].childNodes;
            if (choice[0].checked) {
                answers.push(String.fromCharCode(acsiiCode));
            }
            possibility = {
                id:   String.fromCharCode(acsiiCode),
                text: choice[1].value
            };

            possibilities.push(possibility);

            acsiiCode++;;
        }

        mcqR = {
            type:          "mcq",
            instruction:   instruction,
            answers:       answers,
            possibilities: possibilities,
            previewAutomatonQue: null,
            previewAutomatonAns: null
        };
        if (mode === "") {
            quiz.questions.push(mcqR);
        } else {
            grainPreviewTable();
            quiz.questions[index] = mcqR;
        }

        designerQue = null;
        designerAns = null;
    }

    function addChoice () {
        let newChoice, divArea, checkbox, removeButton, removeImg;
        newChoice             = document.createElement("input");
        newChoice.type        = "text";
        newChoice.name        = "questionArea";
        newChoice.placeholder = _("choice " + (mcqNumberOfChoices+1) + " ...");

        removeButton       = document.createElement("button");
        removeButton.title = _("remove");

        removeImg     = document.createElement("img");
        removeImg.src = libD.getIcon("actions/list-remove");
        removeImg.alt = "Remove";

        removeButton.appendChild(removeImg);

        checkbox       = document.createElement("input");
        checkbox.type  = "checkbox";

        divArea       = document.createElement("div");
        divArea.style = "position: relative; left: 2.5%;";
        divArea.id    = "quizeditor-choice" + (mcqNumberOfChoices);
        divArea.appendChild(checkbox);
        divArea.appendChild(newChoice);
        divArea.appendChild(removeButton);
        document.getElementById("quizeditor-choiceArea").appendChild(
            divArea
        );

        removeButton.onclick = function () {
            removeChoice(this.parentNode);
        };

        mcqNumberOfChoices++;
        AudeGUI.QuizEditor.standby();
    }

    function removeChoice (elementToRemove) {
        var parent = document.getElementById("quizeditor-choiceArea");
        parent.removeChild(elementToRemove);

        var childs = parent.childNodes;
        for (var i = 0; i < childs.length; i++) {
            childs[i].id = "quizeditor-choice" + i;
            childs[i].childNodes[1].placeholder = "choice " + (i+1) + " ...";
        }
        mcqNumberOfChoices--;
        AudeGUI.QuizEditor.standby();
    }

    function modifyMcQuestion (buttonClicked) {
        var index = indexOf(buttonClicked);

        var question      = quiz.questions[index];
        var possibilities = question.possibilities;
        var answers       = question.answers;

        showMcqPane("shift",index);
        document.getElementById("quizeditor-questionArea").value = question.instruction;
        for (var i = 0, choiceDiv; i < possibilities.length; i++) {
            if (i > 1) {
                addChoice();
            }
            choiceDiv    = document.getElementById("quizeditor-choice" + i).childNodes;
            choiceDiv[1].value = possibilities[i].text;
        }

        for (var i = 0, choiceDiv, id; i < answers.length; i++) {
            id = answers[i].charCodeAt(0) - "a".charCodeAt(0);
            choiceDiv    = document.getElementById("quizeditor-choice" + id).childNodes;
            choiceDiv[0].checked = "checked";
        }
        AudeGUI.QuizEditor.standby();
    }

    // For Automatons researcher

    function showAutomatonRPane (mode,index) {
        if (!setCurrentState("automatonRPane")) {
            return;
        }
        automatonR = {};
        designerAns = null;
        designerQue = null;
        var refs2 = {};
        var automatonRPane = document.createElement("div");
        automatonRPane.id  = "quizeditor-automatonRPane";
        automatonRPane.style.display = "initial";

        automatonRPane.appendChild(libD.jso2dom(["div", [
            ["h1", _("Find an automaton")],
            ["div", {"style": "position : absolute; left :  0%; height: 50%; width: 49%; border: 1px solid; background-color: white;"}, [
                ["div", {"style": "text-align: center"}, _("Question")],
                ["div", [
                    ["textarea#quizeditor-automatonRTextarea", {
                        "style": "position : relative; display: block; width: 98.9%",
                        "rows": 10,
                        "placeholder": _("Question wording ...")
                    }],
                    ["button#quizeditor-drawAutomaton", {
                        "#": "drawAutomaton",
                        "style": "position: absolute; display: block; right: 1%; bottom: 1%"
                        },
                        _("Draw an automaton")
                    ],
                    ["button#quizeditor-audescriptCodeButton", {
                        "#": "audescriptCodeButton",
                        "style": "position: absolute; display: block; right: 1%; bottom: -8%"
                        },
                        _("Add audescript conditions")
                    ],
                    ["div", {
                        "#": "automatonQueDiv",
                        "style": "position:absolute; height:57%; width:100%; background-color: #a4c9d1; display: none"
                    }]
                ]]
            ]],
            ["div", {"style": "position : absolute; left : 50%; height: 50%; width: 49%; border: 1px solid; background-color: white;"}, [
                ["div", {"style": "text-align: center"}, _("Answer")],
                ["div", {"#": "automatonAnsDiv"}, [
                    ["div", {"style": "position:absolute; height:95.5%; width:100%; background-color: #a4c9d1;"}]
                ]]
            ]],
            ["textarea#quizeditor-audescriptCode", {
                "#": "audescriptCode",
                "style": "display:none; position: absolute; top: 64%; left:30%; width:40%;",
                "rows":4,
                "placeholder": _("Write your audescript code here ...")
            }],
            ["button", {
                "#": "validationButton",
                "style": "position: absolute; left: 88%; top: 65%;"
                },
                _("Validate")
            ]
        ]], refs2));

        refs.root.appendChild(automatonRPane);

        refs2.drawAutomaton.onclick = function () {
            this.style.display   = "none";
            refs2.automatonQueDiv.style.display = "initial";
            designerQue = new AudeDesigner(refs2.automatonQueDiv);
            setTimeout(function () {
                designerQue.redraw();
            }, 0);
        }

        refs2.validationButton.onclick = function () {
            automatonRValidation(mode,index);
            (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
        }

        refs2.audescriptCodeButton.onclick = function () {
            this.style.display = "none";
            refs2.audescriptCode.style.display = "initial";
            validationButton.style.top = "75%";

        }

        designerAns = new AudeDesigner(refs2.automatonAnsDiv);
    }

    function automatonRValidation (mode,index) {
        automatonR = {
            type:"automatonEquiv",
            instructionHTML:   document.getElementById("quizeditor-automatonRTextarea").value,
            automatonQuestion: null,
            automatonAnswer:   designerAns.getAutomatonCode(designerAns.currentIndex,false),
            audescriptCode :   document.getElementById("quizeditor-audescriptCode").value,
            previewAutomatonQue: null,
            previewAutomatonAns: null
        }

        if (designerQue) {
            automatonR.automatonQuestion =
                designerQue.getAutomatonCode(designerQue.currentIndex,false)
        }

        if (mode === "") {
            quiz.questions.push(automatonR);
        } else {
            grainPreviewTable();
            quiz.questions[index] = automatonR;
        }

        designerQue = null;
        designerAns = null;
    }

    function modifyAutomatonR (buttonClicked) {
        var index = indexOf(buttonClicked);
        var question  = quiz.questions[index];

        showAutomatonRPane("shift",index);
        document.getElementById("quizeditor-automatonRTextarea").value = question.instructionHTML;

        if (question.automatonQuestion) {
            document.getElementById("quizeditor-drawAutomaton").click();
            designerQue.setAutomatonCode(
                question.automatonQuestion,
                designerQue.currentIndex
            );
            designerQue.autoCenterZoom();
        }

        designerAns.setAutomatonCode(
            question.automatonAnswer,
            designerAns.currentIndex
        );
        designerAns.autoCenterZoom();
    }

    // For Regular expressions researcher

    function showRegexRPane (mode,index) {
        if (!setCurrentState("regexRPane")) {
            return;
        }
        regexR = {};

        var regexRPane = document.createElement("div");
        regexRPane.id  = "quizeditor-regexRPane";
        regexRPane.style.display = "initial";

        let title         = document.createElement("h1");
        title.textContent = _("Find a regular expression");

        regexRPane.appendChild(title);

        var content = document.createElement("div");
        var left    = document.createElement("div");
        var right   = document.createElement("div");
        left.style  = "position : absolute; left :  0%; height: 50%; width: 49%; border: 1px solid";
        right.style = "position : absolute; left : 50%; height: 50%; width: 49%; border: 1px solid";

        var leftSubTitle    = document.createElement("div");
        var rightSubTitle   = document.createElement("div");
        var leftSubContent  = document.createElement("div");
        var rightSubContent = document.createElement("div");
        var automatonQueDiv = document.createElement("div");
        leftSubTitle.textContent  = _("Question");
        rightSubTitle.textContent = _("Answer");
        leftSubTitle.style        = "text-align: center";
        rightSubTitle.style       = "text-align: center";
        automatonQueDiv.style     = "position:absolute; height:57%; width:100%; background-color: #a4c9d1; display: none";

        var questionWording   = document.createElement("textarea");
        questionWording.id    = "quizeditor-regexRTextarea";
        questionWording.style = "position : relative; display: block; width: 98.9%";
        questionWording.rows  = 10;
        questionWording.placeholder = _("Question wording ...");
        var drawAutomaton     = document.createElement("button");
        drawAutomaton.id      = "quizeditor-drawAutomaton";
        drawAutomaton.style   = "position: absolute; display: block; right: 1%; bottom: 1%";
        drawAutomaton.textContent = _("Draw an automaton");

        var regex   = document.createElement("textarea");
        regex.id    = "quizeditor-regex";
        regex.style = "position : relative; display: block; width: 98.9%";
        regex.rows  = 10;
        regex.placeholder = _("Write a regular expression ...");

        leftSubContent.appendChild(questionWording);
        leftSubContent.appendChild(drawAutomaton);
        leftSubContent.appendChild(automatonQueDiv);
        rightSubContent.appendChild(regex);

        left.appendChild(leftSubTitle);
        left.appendChild(leftSubContent);
        right.appendChild(rightSubTitle);
        right.appendChild(rightSubContent);

        content.appendChild(left);
        content.appendChild(right);

        drawAutomaton.onclick = function () {
            drawAutomaton.style.display   = "none";
            automatonQueDiv.style.display = "initial";
            designerQue = new AudeDesigner(automatonQueDiv);
            setTimeout(function () {
                designerQue.redraw();
            }, 0);

        }

        let validationButton         = document.createElement("button");
        validationButton.textContent = _("Validate");
        validationButton.style       = "position: absolute; left: 88%; top: 65%";
        validationButton.onclick = function () {
            if ( isRegex(document.getElementById("quizeditor-regex").value) ) {
                regexRValidation(mode,index);
                (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
            }
        }

        content.appendChild(validationButton);

        regexRPane.appendChild(content);
        refs.root.appendChild(regexRPane);
        left.style.backgroundColor  = "white";
        right.style.backgroundColor = "white";
    }

    function regexRValidation (mode,index) {

        regexR = {
            type:"regexEquiv",
            instructionHTML:   document.getElementById("quizeditor-regexRTextarea").value,
            automatonQuestion: null,
            regex: document.getElementById("quizeditor-regex").value,
            previewAutomatonQue: null,
            previewAutomatonAns: null
        }

        if (designerQue !== null) {
            regexR.automatonQuestion =
                designerQue.getAutomatonCode(designerQue.currentIndex,false)
        }

        if (mode === "") {
            quiz.questions.push(regexR);
        } else {
            grainPreviewTable();
            quiz.questions[index] = regexR;
        }

        designerQue = null;
        designerAns = null;
    }

    function modifyRegexR (buttonClicked) {
        var index = indexOf(buttonClicked);
        var question  = quiz.questions[index];

        showRegexRPane("shift",index);
        document.getElementById("quizeditor-regexRTextarea").value = question.instructionHTML;
        document.getElementById("quizeditor-regex").value          = question.regex;

        if (question.automatonQuestion !== null) {
            document.getElementById("quizeditor-drawAutomaton").click();
            designerQue.setAutomatonCode(
                question.automatonQuestion,
                designerQue.currentIndex
            );
            designerQue.autoCenterZoom();
        }
    }

    // Tools

    function grainPreviewTable () {
        var previewTable = document.getElementById("quizeditor-preview");
        for (var i = quiz.questions.length; i > 0 ; i--) {
            previewTable.deleteRow(i);
        }
    }

    function automatonReformat (automaton) {
        var array = null;
        var res   = {
            states:      [],
            finalStates: [],
            transitions: []
        }

        array = automaton.getStates().getList();
        for (var i = 0; i < array.length; i++) {
            res.states.push("" + array[i]);
        }

        array = automaton.getFinalStates().getList();
        for (var i = 0; i < array.length; i++) {
            res.finalStates.push("" + array[i]);
        }

        array = automaton.getTransitions().getList();
        for (var i = 0, trans; i < array.length; i++) {
            trans = [
                "" + array[i].startState,
                array[i].symbol,
                "" + array[i].endState
            ];
            res.transitions.push(trans);
        }

        return res;
    }

    function indexOf (element) {
        var td    = element.parentNode.parentNode;
        var index = td.parentNode.firstChild.firstChild.textContent;
        index = parseInt(index);
        index -= 1;
        return index;
    }

    function isRegex (regex) {
        var regexToAutomaton = null;
        AudeGUI.Runtime.loadIncludes(["equivalence", "regex2automaton", "automaton2json"],
            function () {
                regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
            }
        );
        var res = false;
        try {
            var fake = regexToAutomaton(regex);
            res = true;
        } catch (e) {
            AudeGUI.notify  (_("The regex given in the quiz is not valid."), libD.format(_("Know operation: \".\", \"*\", \"+\".")), "error");
        }
        return res;
    }

    function redrawAutomatons () {
        for (var i = 0, leng = quiz.questions.length, q; i < leng; i++) {
            q = quiz.questions[i];
            if (q.previewAutomatonQue) {
                q.previewAutomatonQue.redraw();
                q.previewAutomatonQue.autoCenterZoom();
            }
            if (q.previewAutomatonAns) {
                q.previewAutomatonAns.redraw();
                q.previewAutomatonAns.autoCenterZoom();
            }
        }
    }

    function cleanDesigners () {
        for (var i = 0, leng = quiz.questions.length; i < leng; i++) {
            delete quiz.questions[i].previewAutomatonQue;
            delete quiz.questions[i].previewAutomatonAns;
        }
    }

    /*
     * Different states :
     *  -previewPane
     *  -newQuestionPane
     *  -savePane
     *  -mcqPane
     *  -automatonRPane
     *  -regexRPane
     */
    function setCurrentState(newState) {
        let confirm = true;
        if (currentState !== "previewPane" && newState === "savePane") {
            confirm = window.confirm(_("Do you really want to cancel your quiz edition ? "));
        }

        switch (currentState) {
            case "previewPane" :
                document.getElementById("quizeditorPane").style.display  = "none";
                break;
            case "newQuestionPane" :
                document.getElementById("quizeditor-newquestionPane").style.display = "none";
                break;
            case "savePane" :
                document.getElementById("quizeditor-savePane").style.display = "none";
                break;
            case "mcqPane" :
                document.getElementById("quizeditor-mcqPane").style.display = "none";
                refs.root.removeChild(document.getElementById("quizeditor-mcqPane"));
                break;
            case "automatonRPane" :
                document.getElementById("quizeditor-automatonRPane").style.display = "none";
                refs.root.removeChild(document.getElementById("quizeditor-automatonRPane"));
                break;
            case "regexRPane" :
                document.getElementById("quizeditor-regexRPane").style.display = "none";
                refs.root.removeChild(document.getElementById("quizeditor-regexRPane"));
                break;
        }

        currentState = newState;
        return confirm;
    }
}(window));
