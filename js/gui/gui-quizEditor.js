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
    var AudeGUI         = pkg.AudeGUI;
    var quizeditor      = null;                      // quizeditor element in the HTML DOM
    var win             = null;                      // Quiz editor's window
    var refs            = {};
    var designerAns     = null;
    var designerQue     = null;
    var mcqR            = {};                        // Multiple choice questions' object
    var mcqNumberOfChoices = 0;
    var automatonR      = {};                        // Automaton research questions' object
    var languageR       = {};                        // language research questions' object
    var expregR         = {};                        // regular expr research questions' object
    var quiz = {
        title:  "",
        author: "",
        date:   "",
        description: [],
        questions: []
    };

    AudeGUI.QuizEditor = {

        load: function () {
            quizeditor = document.getElementById("quizEditor");
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
                languageR  = {};
                expregR    = {};
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
            AudeGUI    = pkg.AudeGUI;
            quizeditor = null;
            refs       = {};
            mcqR       = {};
            mcqNumberOfChoices = 0;
            automatonR = {};
            languageR  = {};
            expregR    = {};
            quiz       = {
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
                hideEverybody();
                var fileinput = document.getElementById("quizeditor-file");
                fileinput.onclick = openQuiz;
                fileinput.click();
            };  

            // New question pane
            document.getElementById("quizeditor-newquestion").onclick = function () {
                hideEverybody();
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
                    hideEverybody();
                    showSavePane();
                }
            };                 
        }
    };

    
    function drawQuizeditorPane () {
        if (win && win.ws) {
            win.close();
        }

        let quizeditorPaneContent = ["div#quizeditor-Pane.libD-ws-colors-auto libD-ws-size-auto" ,
            {id:"quizeditor-mainPane"},[
            ["div#quizeditor-toolbar", [
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

                ["span",[
                    ["input",{type: "text", name:"searchArea", placeholder: _("Search ...") ,style:"position: absolute; top : 2.5%; right : 2%"}]
                ]]                
            ]],

            ["div#quizeditor-content",{"#":"root"}]
            
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

        var quizeditorPane = document.createElement("div");
        quizeditorPane.id  = "quizeditorPane";
        var previewTable   = document.createElement("table");
        previewTable.id    = "quizeditor-preview";
        previewTable.style     = "display:none; position: relative; width:90%; top:25px";

        quizeditorPane.appendChild(previewTable);
        refs.root.appendChild(quizeditorPane);

        var tr         = document.createElement("tr");
        var th         = document.createElement("th");

        th.textContent = _("N°");
        th.style       = "width:4%";
        tr.appendChild(th);
        th             = document.createElement("th");
        th.textContent = _("Questions");
        tr.appendChild(th);
        th             = document.createElement("th");
        th.textContent = _("Answers");
        tr.appendChild(th);
        th             = document.createElement("th");
        th.style       = "width:4%";
        th.textContent = _("Modifications");
        tr.appendChild(th);
        previewTable.appendChild(tr);
    }

    /*
     * Add the last edit question to the preview table if (mode = "") 
     * else show the preview table from alll the object quiz if (mode = shift) 
     */
    function showQuizeditorPane (mode) {

        switch (mode) {
            case "":
                questionPreview(quiz.questions.length-1);
                break;

            case "shift":
                if (quiz.questions != []) {
                    for (var i = 0; i < quiz.questions.length; i++) {
                        questionPreview(i); 
                    }
                }
        }

        var quizeditorPane = document.getElementById("quizeditorPane");
        quizeditorPane.style.display = "initial";
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

                removeButton.onclick = function () {
                    grainPreviewTable();
                    removeQuestion(this);
                    showQuizeditorPane("shift");
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

            case "word":
                
            break;

            case "automatonEquiv":
                modifButton.onclick = function () {
                    modifyAutomatonR(this);
                }

                removeButton.onclick = function () {
                    grainPreviewTable();
                    removeQuestion(this);
                    showQuizeditorPane("shift");
                }
                var contentQue = document.createElement("p");
                contentQue.textContent = newQuestion.instructionHTML;
                quesDiv.appendChild(contentQue);
                var quesAutomatonDiv = document.createElement("div");
                var answAutomatonDiv = document.createElement("div");
                quesDiv.appendChild(quesAutomatonDiv);
                answDiv.appendChild(answAutomatonDiv);
                answAutomatonDiv.style = "min-height: 100px; position:relative";
                quesAutomatonDiv.style = "min-height: 100px; position:relative";
                
                if (newQuestion.automatonQuestion !== null) {
                    designerQue = new AudeDesigner(quesAutomatonDiv, true);
                    designerQue.setAutomatonCode( 
                        newQuestion.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
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
        let newQuestionCategory = document.createElement("ul");
        let li_list = [];
        let li_listContent = [
            "Multiple Choice Question",
            "Find an automaton",
            "Find a language",
            "Find a regular expression"
        ];

        for (var i = 0; i < li_listContent.length; i++) {
            li_list[i] = document.createElement("li");
            li_list[i].id = "quizeditor-category" + i;
            li_list[i].textContent = li_listContent[i];
            li_list[i].onclick = function () {
                showNewQuestionCategory(this.id);
            }
            newQuestionCategory.appendChild(li_list[i]);
        }

        newQuestionPane.appendChild(title);
        newQuestionPane.appendChild(newQuestionCategory);

        refs.root.appendChild(newQuestionPane);
    }

    function showNewQuestionPane () {
        var newQuestionPane   = document.getElementById("quizeditor-newquestionPane");
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

    function showSavePane (mode) {

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

        refs.root.appendChild(savePane);
        AudeGUI.QuizEditor.standby();
    }

    function showNewQuestionCategory (elementId) {
        var index = elementId.substr(-1);
        designerQue = null;
        designerAns = null;
        index = parseInt(index);
        switch (index) {
            case 0 :
                hideEverybody();
                showMcqPane("");
                break;
            case 1 :
                hideEverybody();
                showAutomatonRPane("");
                break;
            case 2 :
                hideEverybody();

                break;
            case 3 :
                hideEverybody();

                break;
        }

        AudeGUI.QuizEditor.standby();
    }

    function removeQuestion (buttonClicked) {
        var index = indexOf(buttonClicked);
        quiz.questions.splice(index, 1);
        AudeGUI.QuizEditor.standby();
    }

    // For Multiples Choice Questions

    function showMcqPane (mode,index) {
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
            hideEverybody();
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
            possibilities: possibilities
        };
        if (mode === "") {
            quiz.questions.push(mcqR);
        } else {
            grainPreviewTable();
            quiz.questions[index] = mcqR;
        }

        refs.root.removeChild(document.getElementById("quizeditor-mcqPane"));
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

        hideEverybody();
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
        automatonR = {};

        var automatonRPane = document.createElement("div");
        automatonRPane.id  = "quizeditor-automatonRPane";
        automatonRPane.style.display = "initial";

        let title         = document.createElement("h1");
        title.textContent = _("Find an automaton");

        automatonRPane.appendChild(title);

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
        var automatonAnsDiv = document.createElement("div");
        leftSubTitle.textContent  = _("Question");
        rightSubTitle.textContent = _("Answer");
        automatonAnsDiv.style     = "position:absolute; height:95.5%; width:100%; background-color: gainsboro;";
        automatonQueDiv.style     = "position:absolute; height:57%; width:100%; background-color: gainsboro; display: none";

        var questionWording   = document.createElement("textarea");
        questionWording.id    = "quizeditor-automatonRTextarea";
        questionWording.style = "position : relative; display: block; width: 98.9%";
        questionWording.rows  = 10;
        var drawAutomaton     = document.createElement("button");
        drawAutomaton.id      = "quizeditor-drawAutomaton";
        drawAutomaton.style   = "position: relative; display: block; left: 59%; top: 115%";
        drawAutomaton.textContent = _("Draw an automaton");

        leftSubContent.appendChild(questionWording);
        leftSubContent.appendChild(drawAutomaton);
        leftSubContent.appendChild(automatonQueDiv);
        rightSubContent.appendChild(automatonAnsDiv);

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
            AutomatonRValidation(mode,index);
            hideEverybody();
            (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
        }

        content.appendChild(validationButton);

        automatonRPane.appendChild(content);
        refs.root.appendChild(automatonRPane);
        left.style.backgroundColor  = "white";
        right.style.backgroundColor = "white";
        designerAns = new AudeDesigner(automatonAnsDiv);
    }

    function AutomatonRValidation (mode,index) {
        automatonR = {
            type:"automatonEquiv",
            instructionHTML:   document.getElementById("quizeditor-automatonRTextarea").value,
            automatonQuestion: null,
            automatonAnswer:   designerAns.getAutomatonCode(designerAns.currentIndex,false),
        }

        if (designerQue !== null) {
            automatonR.automatonQuestion =
                designerQue.getAutomatonCode(designerQue.currentIndex,false)
        }

        if (mode === "") {
            quiz.questions.push(automatonR);
        } else {
            grainPreviewTable();
            quiz.questions[index] = automatonR;
        }

        refs.root.removeChild(document.getElementById("quizeditor-automatonRPane"));
        designerQue = null;
        designerAns = null;
    }

    function modifyAutomatonR (buttonClicked) {
        var index = indexOf(buttonClicked);
        var question  = quiz.questions[index];

        hideEverybody();
        showAutomatonRPane("shift",index);
        document.getElementById("quizeditor-automatonRTextarea").value = question.instructionHTML;
        
        if (question.automatonQuestion !== null) { 
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

    // Tools
    function hideEverybody () {
        document.getElementById("quizeditorPane").style.display  = "none";
        document.getElementById("quizeditor-newquestionPane").style.display  = "none";
        if (document.getElementById("quizeditor-savePane") !== null) {
            document.getElementById("quizeditor-savePane").style.display  = "none";
        }
        if (document.getElementById("quizeditor-mcqPane") !== null ) {
            document.getElementById("quizeditor-mcqPane").style.display  = "none";
        }
        if (document.getElementById("quizeditor-automatonRPane") !== null ) {
            document.getElementById("quizeditor-automatonRPane").style.display  = "none";
        }
    }

    function grainPreviewTable () {
        var previewTable   = document.getElementById("quizeditor-preview");
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

}(window));
