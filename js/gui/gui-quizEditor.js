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
        }
    };


    function drawQuizeditorPane () {
        setCurrentState("previewPane");

        if (win && win.ws) {
            win.close();
        }

        let quizeditorPaneContent = ["div#quizeditor-Pane.libD-ws-colors-auto libD-ws-size-auto" ,
            {"id":"quizeditor-mainPane"}, [
            ["div", [
                ["input#quizeditor-open", {"type": "button", "value": _("Open")}],

                ["input#quizeditor-file", {"type": "file", "style": "display: none"}],

                ["button#quizeditor-undo", {"title": _("Undo")}, [
                    ["img", {"src": libD.getIcon("actions/edit-undo"), "alt": "Undo"}]
                ]],

                ["button#quizeditor-redo", {"title":_("Redo")}, [
                    ["img", {"src": libD.getIcon("actions/edit-redo"), "alt": "Redo"}]
                ]],

                ["input#quizeditor-newquestion", {"type": "button", "value": _("New question")}],

                ["input#quizeditor-save", {"type": "button", "value": _("Save")}],

                ["a#close-quiz", {"id": "close-quiz", "href": "#"}, _("Close the Quiz Editor")],

                ["div",[
                    ["input#quizeditor-research",{
                        "type": "search",
                        "name":"searchArea",
                        "placeholder": _("Search ..."),
                        "style":"position: absolute; top: 2.5%; right: 2%; width: 23%;"
                    }],
                    ["ul#quizeditor-researchPane", {
                        "style":"display: none; z-index:1; position: absolute; top: 3.1%; right: 2%; border: 1px solid darkgrey; padding-left: 0px; width: 23%; background-color: white;"
                        }, [
                            ["li#quizeditor-searchCategory0",{"style": "display: none"}, [
                                ["a", _("Multiple Choice Question")]
                            ]],
                            ["li#quizeditor-searchCategory1",{"style": "display: none"}, [
                                ["a", _("Find an automaton")]
                            ]],
                            ["li#quizeditor-searchCategory2",{"style": "display: none"}, [
                                ["a", _("Find a regular expression")]
                            ]]
                        ]
                    ]
                ]]
            ]],
            ["div#quizeditor-content", {"#":"root"}, [
                ["div#quizeditorPane", [
                    ["table#quizeditor-preview", {
                        "style": "display: none; position: absolute; width: 90%; top: 7%; left: 5%"
                    }, [
                        ["tr", [
                            ["th", {"style": "width: 4%; text-align: center;"}, _("N°")],
                            ["th", {"style": "text-align: center;"}, _("Questions")],
                            ["th", {"style": "text-align: center; width: 35%"}, _("Answers")],
                            ["th", {"style": "width: 4%; text-align: center;"}, _("Modifications")],
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

        // Close a quiz
        document.getElementById("close-quiz").onclick = function () {
            AudeGUI.QuizEditor.close();
        };

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

        // Research events
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
    }

    function questionPreview (index) {
        var previewTable = document.getElementById("quizeditor-preview");
        var refsLocal = {};
        previewTable.appendChild(libD.jso2dom(["tr", [
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
                ["div", [
                    ["button#quizeditor-modifQuestion" + index, {"#": "modifButton", "title": _("modify")}, [
                        ["img", {"src": libD.getIcon("actions/draw-brush"), "alt": "Modify"}]
                    ]],
                    ["button#quizeditor-removeQuestion" + index, {"#": "removeButton", "title": _("remove")}, [
                        ["img", {"src": libD.getIcon("actions/list-remove"), "alt": "Remove"}]
                    ]]
                ]]
            ]]
        ]], refsLocal));

        refsLocal.removeButton.onclick = function () {
            grainPreviewTable();
            removeQuestion(this);
            showQuizeditorPane("shift");
        }

        var q = quiz.questions[index];
        switch (q.type) {
            case "mcq":
                refsLocal.modifButton.onclick = function () {
                    modifyMcQuestion(this);
                }

                refsLocal.quesDiv.appendChild(libD.jso2dom([
                    ["p", q.instruction],
                    ["div", [
                        ["ul", {"#":"list", "style": "list-style-type: none;"}]
                    ]]
                ], refsLocal));

                for (var i = 0; i < q.possibilities.length; i++) {
                    refsLocal.list.appendChild(libD.jso2dom(["li", [
                        ["span", {"class": "quiz-answer-id"}, q.possibilities[i].id + ". "],
                        ["span", q.possibilities[i].text]
                    ]]));
                }

                refsLocal.answDiv.appendChild(libD.jso2dom(["p", q.answers.toString()]));
                break;

            case "automatonEquiv":
                refsLocal.modifButton.onclick = function () {
                    modifyAutomatonR(this);
                }

                refsLocal.quesDiv.appendChild(libD.jso2dom([
                    ["p", q.instructionHTML],
                    ["div", {
                        "#": "quesAutomatonDiv",
                        "style": "min-height: 100px; position:relative; background-color: #a4c9d1;"
                    }]
                ], refsLocal));
                refsLocal.answDiv.appendChild(libD.jso2dom(["div", {
                    "#": "answAutomatonDiv",
                    "style": "min-height: 100px; position:relative; background-color: #a4c9d1;"
                }], refsLocal));

                if (q.automatonQuestion) {
                    designerQue = new AudeDesigner(refsLocal.quesAutomatonDiv, true);
                    designerQue.setAutomatonCode(
                        q.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
                } else {
                    refsLocal.quesAutomatonDiv.style.display = "none";
                }

                designerAns = new AudeDesigner(refsLocal.answAutomatonDiv, true);
                designerAns.setAutomatonCode(
                    q.automatonAnswer,
                    designerAns.currentIndex
                );
                setTimeout(function () {
                    designerAns.redraw();
                    designerAns.autoCenterZoom();
                }, 0);
                q.previewAutomatonQue = designerQue;
                q.previewAutomatonAns = designerAns;
                break;
            case "regexEquiv":
                refsLocal.modifButton.onclick = function () {
                    modifyRegexR(this);
                }

                refsLocal.quesDiv.appendChild(libD.jso2dom([
                    ["p", q.instructionHTML],
                    ["div", {
                        "#": "quesAutomatonDiv",
                        "style": "min-height: 100px; position:relative; background-color: #a4c9d1;"
                    }]
                ], refsLocal));
                refsLocal.answDiv.appendChild(libD.jso2dom(["p", q.regex]));

                if (q.automatonQuestion) {
                    designerQue = new AudeDesigner(refsLocal.quesAutomatonDiv, true);
                    designerQue.setAutomatonCode(
                        q.automatonQuestion,
                        designerQue.currentIndex
                    );
                    setTimeout(function () {
                        designerQue.redraw();
                        designerQue.autoCenterZoom();
                    }, 0);
                } else {
                    refsLocal.quesAutomatonDiv.style.display = "none";
                }

                q.previewAutomatonQue = designerQue;
                break;
            case "word":

                break;
        }

        previewTable.style.display = "initial";
    }

    function loadNewQuestionPane () {
        var refsLocal = {};
        var newQuestionPane = libD.jso2dom(["div#quizeditor-newquestionPane", [
            ["h1", _("Category")],
            ["ul", {"#": "newQuesCategory"}]
        ]], refsLocal);

        newQuestionPane.style.display = "none";

        let li_contentList = [
            "Multiple Choice Question",
            "Find an automaton",
            "Find a regular expression"
        ];

        for (var i = 0; i < li_contentList.length; i++) {
            refsLocal.newQuesCategory.appendChild(libD.jso2dom(["li#quizeditor-category" + i,
                {"#": "currentLi"},
                li_contentList[i]

            ], refsLocal));

            refsLocal.currentLi.onclick = function () {
                newQuestionCategory(this.id);
            }
        }

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
    }

    function showNewQuestionPane () {
        if (!setCurrentState("newQuestionPane")) {
            return;
        }
        var newQuestionPane = document.getElementById("quizeditor-newquestionPane");
        newQuestionPane.style.display = "initial";
    }

    function openQuiz () {
        var file = document.getElementById("quizeditor-file");
        file.onchange = function () {
            var freader = new FileReader();

            freader.onload = function () {
                AudeGUI.QuizEditor.open(freader.result);
            };

            freader.readAsText(file.files[0], "utf-8");
        }
    }

    function saveQuiz () {
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
        var refsLocal = {};
        var savePane  = libD.jso2dom(["div#quizeditor-savePane", [
            ["div", {"style": "position: relative"}, [
                ["div", [
                    ["p", _("Quiz's title")],
                    ["input#quizeditor-titleInput", {
                            "#": "quizTitleInput",
                            "type": "text",
                            "placeholder": _("Title ...")
                        }
                    ]
                ]],
                ["div", [
                    ["p", _("Your name")],
                    ["input#quizeditor-authorInput", {
                            "#": "authorInput",
                            "type": "text",
                            "placeholder": _("Enter your name ...")
                        }
                    ]
                ]],
                ["div", [
                    ["p", _("Description")],
                    ["textarea#quizeditor-descriptionTextarea", {
                            "#": "descriptionTextarea",
                            "rows": "4",
                            "cols": "40",
                            "placeholder": _("Description ...")
                        }
                    ]
                ]]
            ]],
            ["button#quizeditor_saveValidation", {
                    "#": "validationButton",
                    "style": "position: relative; left: 80%; top: 80%"
                },
                _("Validate")
            ]
        ]], refsLocal);

        refsLocal.validationButton.onclick     = function () {
            saveQuiz();
            AudeGUI.QuizEditor.save();
            AudeGUI.QuizEditor.close();
        }

        quiz.title       ? refsLocal.quizTitleInput.value      = quiz.title       : "";
        quiz.author      ? refsLocal.authorInput.value         = quiz.author      : "";
        quiz.description ? refsLocal.descriptionTextarea.value = quiz.description : "";

        refs.root.appendChild(savePane);
    }

    function removeQuestion (buttonClicked) {
        var index = questionIndex(buttonClicked);
        quiz.questions.splice(index, 1);
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

        var refsLocal = {};
        var mcqPane = libD.jso2dom(["div#quizeditor-mcqPane", {"style": "display: initial"}, [
            ["h1", _("MCQ")],
            ["input#quizeditor-questionArea", {
                "type": "text",
                "name": "questionArea",
                "placeholder": _("write your question ...")
            }],
            ["div", {"style": "position: relative; left: 2.5%;"}, [
                ["p", _("Write the different choices and check the correct one. ")],
                ["div#quizeditor-choiceArea", {"#": "choiceArea"}],
                ["button", {"#": "addButton", "title": _("add"), "style": "position: relative; left: 2.5%;"}, [
                    ["img", {"scr": libD.getIcon("actions/list-add"), "alt": _("Add")}]
                ]]
            ]],
            ["button", {"#": "validationButton", "style": "position: relative; left: 80%; top: 80%"}, _("Validate")]
        ]], refsLocal);

        let choice_list = [];

        for (var i = 0; i < mcqNumberOfChoices; i++) {
            refsLocal.choiceArea.appendChild(libD.jso2dom([
                ["div#quizeditor-choice" + i, {"style": "position: relative; left: 2.5%;"}, [
                    ["input", {"type": "checkbox"}],
                    ["input", {"type": "text", "name":"questionArea", "placeholder": _("choice") + " " + (i+1) + " ..."}],
                    ["button", {"#": "removeButton", "title": _("remove")}, [
                        ["img", {"src": libD.getIcon("actions/list-remove"), "alt": _("Remove")}]
                    ]]
                ]]
            ], refsLocal));

            refsLocal.removeButton.onclick = function () {
                removeChoice(this.parentNode);
            };
        }

        refsLocal.addButton.onclick = addChoice;
        refsLocal.validationButton.onclick = function () {
            mcqValidation(mode,index);
            (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
        }
        refs.root.appendChild(mcqPane);
    }

    function mcqValidation (mode,index) {
        mcqR = {
            type:          "mcq",
            instruction:   document.getElementById("quizeditor-questionArea").value,
            answers:       [],
            possibilities: [],
            previewAutomatonQue: null,
            previewAutomatonAns: null
        };

        var choiceArray = document.getElementById("quizeditor-choiceArea").childNodes;
        for (var i = 0, possibility  = null, choice = null, a_acsiiCode  = 97; i < choiceArray.length; i++) {
            choice = choiceArray[i].childNodes;
            if (choice[0].checked) {
                mcqR.answers.push(String.fromCharCode(a_acsiiCode));
            }
            possibility = {
                id:   String.fromCharCode(a_acsiiCode),
                text: choice[1].value
            };
            mcqR.possibilities.push(possibility);
            a_acsiiCode++;;
        }

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

        var choiceArea = document.getElementById("quizeditor-choiceArea");
        var refsLocal  = {};
        choiceArea.appendChild(libD.jso2dom(["div#quizeditor-choice" + (mcqNumberOfChoices), {
                "style": "position: relative; left: 2.5%;"
            }, [
                ["input", {"type": "checkbox"}],
                ["input", {"type": "text", "name":"questionArea", "placeholder": _("choice") + " " + (mcqNumberOfChoices+1) + " ..."}],
                ["button", {"#": "removeButton", "title": _("remove")}, [
                    ["img", {"src": libD.getIcon("actions/list-remove"), "alt": _("Remove")}]
                ]]
            ]
        ], refsLocal));

        refsLocal.removeButton.onclick = function () {
            removeChoice(this.parentNode);
        };
        mcqNumberOfChoices++;
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
    }

    function modifyMcQuestion (buttonClicked) {
        var index = questionIndex(buttonClicked);

        var q      = quiz.questions[index];
        var possibilities = q.possibilities;
        var answers       = q.answers;

        showMcqPane("shift",index);
        document.getElementById("quizeditor-questionArea").value = q.instruction;
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
    }

    // For Automatons researcher

    function showAutomatonRPane (mode,index) {
        if (!setCurrentState("automatonRPane")) {
            return;
        }
        automatonR = {};
        designerAns = null;
        designerQue = null;
        var refsLocal = {};
        var automatonRPane = libD.jso2dom(["div#quizeditor-automatonRPane", [
            ["div", [
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
            ]]
        ]], refsLocal);

        automatonRPane.style.display = "initial";

        refs.root.appendChild(automatonRPane);

        refsLocal.drawAutomaton.onclick = function () {
            this.style.display   = "none";
            refsLocal.automatonQueDiv.style.display = "initial";
            designerQue = new AudeDesigner(refsLocal.automatonQueDiv);
            setTimeout(function () {
                designerQue.redraw();
            }, 0);
        }

        refsLocal.validationButton.onclick = function () {
            automatonRValidation(mode,index);
            (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
        }

        refsLocal.audescriptCodeButton.onclick = function () {
            this.style.display = "none";
            refsLocal.audescriptCode.style.display = "initial";
            validationButton.style.top = "75%";
        }

        designerAns = new AudeDesigner(refsLocal.automatonAnsDiv);
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
        var index = questionIndex(buttonClicked);
        var q  = quiz.questions[index];

        showAutomatonRPane("shift",index);
        document.getElementById("quizeditor-automatonRTextarea").value = q.instructionHTML;

        if (q.automatonQuestion) {
            document.getElementById("quizeditor-drawAutomaton").click();
            designerQue.setAutomatonCode(
                q.automatonQuestion,
                designerQue.currentIndex
            );
            designerQue.autoCenterZoom();
        }

        designerAns.setAutomatonCode(
            q.automatonAnswer,
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
        var refsLocal  = {};
        var regexRPane = libD.jso2dom(["div#quizeditor-regexRPane", [
            ["h1", _("Find a regular expression")],
            ["div", [
                ["div", {"style": "position : absolute; left :  0%; height: 50%; width: 49%; border: 1px solid; background-color: white"}, [
                    ["div", {"style": "text-align: center"}, _("Question")],
                    ["div", [
                        ["textarea#quizeditor-regexRTextarea", {
                            "style": "position : relative; display: block; width: 98.9%",
                            "rows": 10,
                            "placeholder": _("Question wording ...")
                        }],
                        ["button#quizeditor-drawAutomaton", {
                                "#" : "drawAutomaton",
                                "style": "position: absolute; display: block; right: 1%; bottom: 1%"
                            },
                            _("Draw an automaton")
                        ],
                        ["div", {"#": "automatonQueDiv", "style": "position:absolute; height:57%; width:100%; background-color: #a4c9d1; display: none"}]
                    ]]
                ]],
                ["div", {"style": "position : absolute; left : 50%; height: 50%; width: 49%; border: 1px solid; background-color: white"}, [
                    ["div", {"style": "text-align: center"}, _("Answer")],
                    ["div", [
                        ["textarea#quizeditor-regex", {
                            "style": "position : relative; display: block; width: 98.9%",
                            "rows": 10,
                            "placeholder": _("Write a regular expression ...")
                        }]
                    ]]
                ]],
                ["button", {"#": "validationButton", "style": "position: absolute; left: 88%; top: 65%"}, _("Validate")]
            ]]
        ]], refsLocal);
        regexRPane.style.display = "initial";

        refsLocal.drawAutomaton.onclick = function () {
            refsLocal.drawAutomaton.style.display   = "none";
            refsLocal.automatonQueDiv.style.display = "initial";
            designerQue = new AudeDesigner(refsLocal.automatonQueDiv);
            setTimeout(function () {
                designerQue.redraw();
            }, 0);
        }

        refsLocal.validationButton.onclick = function () {
            if ( isRegex(document.getElementById("quizeditor-regex").value) ) {
                regexRValidation(mode,index);
                (mode == "") ? showQuizeditorPane("") : showQuizeditorPane("shift");
            }
        }

        refs.root.appendChild(regexRPane);
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
        var index = questionIndex(buttonClicked);
        var q  = quiz.questions[index];

        showRegexRPane("shift",index);
        document.getElementById("quizeditor-regexRTextarea").value = q.instructionHTML;
        document.getElementById("quizeditor-regex").value          = q.regex;

        if (q.automatonQuestion ) {
            document.getElementById("quizeditor-drawAutomaton").click();
            designerQue.setAutomatonCode(
                q.automatonQuestion,
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

    function questionIndex (element) {
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
    function setCurrentState (newState) {
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
