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

/* globals renderMathInElement, libD, Automaton, Set, aude, automaton2svg, audescript */

(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var automataContainer = null;
    var divQuiz           = null;

    var automataAreEquivalent = null;
    var object2automaton      = null;
    var regexToAutomaton      = null;


    var katexAutorenderOpts = {
        delimiters: [
            {left: "$$",  right: "$$",  display: true},
            {left: "$",   right: "$",   display: false},
            {left: "\\[", right: "\\]", display: true},
            {left: "\\(", right: "\\)", display: false}
        ]
    };

    function textFormat(text, node, html) {
        if (!node) {
            node = document.createElement("span");
        }

        node[html ? "innerHTML" : "textContent"] = text instanceof Array ? text.join("") : text;

        renderMathInElement(node, katexAutorenderOpts);
        return node;
    }

    function ajsEval(script, autoAnsw, A) {
        var res = null;
        AudeGUI.Runtime.loadIncludes(
            ["determinization", "minimization", "completion", "complementation"],
            function () {
                try {
                    res = eval(
                        "(function() {" +
                            audescript.toJS(`
                                from determinization import isDeterminized
                                from minimization    import isMinimized
                                from completion      import isCompleted
                                from complementation import automataAreComplement

                                return ` + script
                            ).code +
                        "}());"
                    );
                } catch (e) {
                    AudeGUI.notify(
                            _("Loading the quiz failed"),
                            libD.format(
                                _("The audescript Code isn't correct: {0}"),
                                e.message,
                                "error"
                            )
                        );
                    throw e;
                }
            }
        );
        return res;
    }

    AudeGUI.Quiz = {
        fileInput: null,

        load: function () {
            automataContainer = document.getElementById("automata-container");
            divQuiz           = document.getElementById("div-quiz");
            AudeGUI.Quiz.fileInput = document.getElementById("filequiz");
            AudeGUI.Quiz.fileInput.onchange = openQuiz;
        },

        open: function (code) {
            try {
                startQuiz(JSON.parse(code));
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

        _ajsEval: ajsEval
    };

    //FIXME
    function automatonFromObj(o) {
        var k = 0;
        var A = new Automaton();

        A.setInitialState(o.states[0]);

        for (k = 1; k < o.states.length; ++k) {
            A.addState(o.states[k]);
        }

        for (k = 0; k < o.finalStates.length; ++k) {
            A.addFinalState(o.finalStates[k]);
        }

        for (k = 0; k < o.transitions.length; ++k) {
            A.addTransition(o.transition[k][0], o.transition[k][1], o.transition[k][2]);
        }

        return A;
    }

    function openQuiz() {
        var freader = new FileReader();

        freader.onload = function () {
            AudeGUI.Quiz.open(freader.result);
        };

        freader.readAsText(AudeGUI.Quiz.fileInput.files[0], "utf-8");
    }

    function closeQuiz() {
        AudeGUI.removeCurrentAutomaton();
        automataContainer.style.display = "";
        automataContainer.style.top     = "";
        divQuiz.textContent = "";
        divQuiz.classList.remove("enabled");
        AudeGUI.mainDesigner.redraw();
        AudeGUI.Results.redraw();
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
                    AudeGUI.notify(_("Error in the Quiz"), libD.format(_("There is an error in the Quiz: {0}"), e), "error");
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

        var refs    = null;
        var answers = null;
        var autoAnsw   = null;
        var i = 0;
        var len = 0;
        var possibilities = null;
        var j = 0;
        var leng = 0;
        var q = null;

    // Validation
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

                r.isCorrect = diff.card() === 0;
                if (!r.isCorrect) {
                    var diffL = aude.toArray(diff);
                    diffL.sort();
                    r.reasons.push(libD.format(_("Wrong answer for {0}."), diffL.toString()));
                }

                break;
            case "word":
                autoAnsw = AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex);

                var words = q.words;
                var regex = "";

                r.userResponse = AudeGUI.mainDesigner.getSVG(AudeGUI.mainDesigner.currentIndex);

                if (autoAnsw) {
                    for (i = 0, len = words.length; i < len; ++i) {
                        if (!autoAnsw.acceptedWord(words[i])) {
                            r.isCorrect = false;
                            r.reasons.push(
                                words[i]
                                    ? libD.format(
                                        _("Word <i>{0}</i> is not accepted while it should be."),
                                        words[i]
                                    )
                                    : _("The empty word is not accepted while it should be.")
                            );
                        }

                        if (regex) {
                            regex += "+";
                        }

                        regex += words[i].replace(/([^0-9a-zA-Z])/g, "\\$1");
                    }

                    if (!r.reasons[0]) {
                        r.isCorrect = automataAreEquivalent(regexToAutomaton(regex), autoAnsw);
                        if (!r.isCorrect) {
                            r.reasons.push(_("The given automaton accepts too many words."));
                        }
                    }
                } else {
                    r.isCorrect = false;
                    r.reasons.push(_("Question was not answered."));
                }
                break;
            case "regexEquiv":
            case "automatonEquiv":
                if (q.automatonAnswer) {
                    autoAnsw = AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex);
                    r.userResponse = AudeGUI.mainDesigner.getSVG(AudeGUI.mainDesigner.currentIndex);
                } else if (q.regex) {
                    r.userResponse = autoAnsw = document.getElementById("regexUserResponse").value;
                    try {
                        autoAnsw = regexToAutomaton(autoAnsw);
                    } catch (e) {
                        throw _("Regular expression given in the quiz is not valid.");
                    }
                } else {
                    throw _("No automaton or regular expression was given in the quiz.");
                }

                if (autoAnsw) {
                    var A;

                    if (q.automatonAnswer) {
                        try {
                            A = svg2automaton(q.automatonAnswer);
                        } catch (e) {
                            console.error(e);
                            throw _("Automaton given in the quiz is not correct.");
                        }
                    } else if (q.regex) {
                        try {
                            A = regexToAutomaton(q.regex);
                        } catch (e) {
                            console.error(e);
                            throw _("Regular expression given in the quiz is not valid.");
                        }
                    }

                    if (q.audescriptCode){
                        r.isCorrect = automataAreEquivalent(A, autoAnsw) && ajsEval(q.audescriptCode, autoAnsw, A);
                        if (!r.isCorrect) {
                            var atomicScript = q.audescriptCode.split(" and ");
                            if (!automataAreEquivalent(A, autoAnsw)) {
                                q.automatonAnswer
                                ? r.reasons.push(_("The given automaton isn’t equivalent to the expected one."))
                                : r.reasons.push(_("The given regular expression isn’t equivalent to the expected one."));
                            }
                            var cond = ["determinized", "minimized", "complete"]
                            for (var i = 0; i < atomicScript.length; i++) {
                                if (!ajsEval(atomicScript[i], autoAnsw) ) {
                                    for (var j = 0, res = 0; j < cond.length; j++) {
                                        res = atomicScript[i].toLowerCase().search(cond[j]);
                                        (res !== -1)
                                            ? r.reasons.push(_("The given automaton isn’t " + cond[j] + "."))
                                            : "";
                                    }
                                }
                            }
                        }
                    } else {
                        r.isCorrect = automataAreEquivalent(A, autoAnsw);
                        if (!r.isCorrect) {
                            if (q.examples instanceof Array) {
                                for (i = 0, len = q.examples.length; i < len; ++i) {
                                    if (!autoAnsw.acceptedWord(q.examples[i])) {
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
                                    if (autoAnsw.acceptedWord(q.counterExamples[i])) {
                                        r.reasons.push(
                                            q.counterExamples[i]
                                                ? libD.format(_("Word <i>{0}</i> is accepted while it shouldn’t be."), q.counterExamples[i])
                                                : _("The empty word is accepted while it shouldn’t be.")
                                        );
                                    }
                                }
                            }

                            if (!r.reasons[0]) {
                                q.automatonAnswer
                                    ? r.reasons.push(_("The given automaton isn’t equivalent to the expected one."))
                                    : r.reasons.push(_("The given regular expression isn’t equivalent to the expected one."));
                            }
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

    // Correction
        if (quiz.currentQuestion >= quiz.questions.length) {
            quiz.refs.content.textContent = "";
            quiz.refs.content.appendChild(libD.jso2dom(["p", _("The Quiz is finished! Here are the details of the correction.")]));

            refs = {};

            answers = libD.jso2dom(["table#correction-table",
                ["tr", [
                    ["th", _("Instruction")],
                    ["th", _("Correct answer?")],
                    ["th", _("Comments")]
                ]]]);

            for (i = 0, len = quiz.answers.length; i < len; ++i) {
                var question_i = quiz.questions[i];

                answers.appendChild(libD.jso2dom(["tr", [
                    ["td.qinst", {"#": "answerInstr"}, [
                        ["span.qid", (question_i.hasOwnProperty("id") ? question_i.id : (parseInt(i, 10) + 1)) + ". "],
                        ["div.qinstr-content"]
                    ]],
                    ["td.qstate", quiz.answers[i].isCorrect ? _("Yes") : _("No")],
                    ["td.qcmt", {"#": "answerCmt"}]
                ]], refs));

                var reasons = quiz.answers[i].reasons;

                if (reasons[1]) {
                    var ul = document.createElement("ul");

                    for (j = 0, leng = reasons.length; j < leng; ++j) {
                        var li = document.createElement("li");
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
                // For mcq
                if (possibilities) {
                    for (j = 0, leng = possibilities.length; j < leng; ++j) {
                        refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                            ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (parseInt(i, 10) + 1)) + ". "],
                            ["span", {"#": i + "content"}]
                        ]], refs));

                        if (possibilities[j].automaton) {
                            automaton2svg(
                                automatonFromObj(possibilities[j].automaton),
                                function (res) {
                                    refs[i + "content"].innerHTML = res;
                                }
                            );
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

    // Asking
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
                    ["span", {"#": "questionContent"}],
                    ["div", {"#": "questionAutomata"}]
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

        if (q.automatonQuestion) {
            refs.questionAutomata.style = "position: relative; width: 50%; height: 200px; background-color: #d9e0ee;";
            var designer = new AudeDesigner(refs.questionAutomata, true);
            designer.setAutomatonCode(q.automatonQuestion);
            designer.autoCenterZoom();
        } else {
            refs.questionAutomata.style.display = "none";
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
                    automaton2svg(
                        automatonFromObj(possibilities[j].automaton),
                        function (res) {
                            refs[j + "content"].innerHTML = res;
                        }
                    );
                } else if (possibilities[j].html) {
                    refs[j + "content"].innerHTML = possibilities[j].html;
                } else if (possibilities[j].text) {
                    textFormat(possibilities[j].text, refs[j + "content"]);
                } else if (possibilities[j].html) {
                    textFormat(possibilities[j].html, refs[j + "content"], true);
                }

                if (quiz.answers[quiz.currentQuestion].userResponse instanceof Set && quiz.answers[quiz.currentQuestion].userResponse.has(qid)) {
                    refs["answer-" + j].checked = true;
                }
            }
            break;
        case "word":
            break;
        case "regexEquiv":
            refs.answers.innerHTML = "<input type=\"text\" id=\"regexUserResponse\" style=\"width:30%;\"></input>";
            (quiz.answers[quiz.currentQuestion].userResponse)
                ? document.getElementById("regexUserResponse").value = quiz.answers[quiz.currentQuestion].userResponse
                : document.getElementById("regexUserResponse").placeholder = _("Write a regular expression ...");

            break;
        case "automatonEquiv":
            refs.answers.innerHTML = "<p>" +  _("You can draw the automaton bellow.") + "</p>";

            AudeGUI.mainDesigner.setSVG(
                quiz.answers[quiz.currentQuestion].userResponse,
                AudeGUI.mainDesigner.currentIndex
            );

            setTimeout(function () {
                automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + "px";
                automataContainer.style.display = "";
                AudeGUI.mainDesigner.redraw();
                AudeGUI.Results.redraw();
            }, 0);

            break;
        case "program":
            break;
        case "algo":
            break;
        default:
            AudeGUI.notify  (_("Question type not known"), libD.format(_("Type of question {0} is not known. Known types are: <ul><li>\"mcq\" for multiple choices question,</li><li>\"word\" (to draw an automaton which accepts a given list of words).</li></ul>")), "error");
        }

        refs.ok.onclick = nextQuestion(quiz, quiz.currentQuestion);

        if (quiz.currentQuestion) {
            refs.prev.onclick = nextQuestion(quiz, quiz.currentQuestion, true);
        } else {
            refs.prev.style.display = "none";
        }
    };

    function startQuiz(quiz) {
        if (AudeGUI.getCurrentMode() === "program") {
            AudeGUI.setCurrentMode("design");
        }

        automataContainer.style.display = "none";

        AudeGUI.Runtime.loadIncludes(["equivalence", "regex2automaton", "automaton2json"],
            function () {
                automataAreEquivalent = audescript.m("equivalence").automataAreEquivalent;
                object2automaton = audescript.m("automaton2json").object2automaton;
                regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
            }
        );
        AudeGUI.addAutomaton();

        if (!(quiz.questions && quiz.questions instanceof Array)) {
            throw new Error(_("The quiz doesn't have its list of question."));
        }

        quiz.currentQuestion = -1;

        var a = quiz.answers = [];
        a.length = quiz.questions.length;

        for (var i = 0, len = a.length; i < len; ++i) {
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
                ["#", quiz.title ? _("Quiz:") + " " : _("Quiz")],
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
    }

    var designerDraft = null;
    function svg2automaton(svg) {
        var div  = document.createElement("div");
        designerDraft = new AudeDesigner(div, true);
        document.getElementById("div-quiz").appendChild(div);
        div.display = "none";
        designerDraft.setAutomatonCode(svg);
        var A = designerDraft.getAutomaton(designerDraft.currentIndex);
        document.getElementById("div-quiz").removeChild(div);
        return A;
    }
}(window));
