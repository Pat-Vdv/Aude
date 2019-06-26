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

// This file contains the quiz engine.
(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var automataContainer = null;
    var divQuiz = null;

    var automataAreEquivalent = null;
    var object2automaton = null;
    var regexToAutomaton = null;

    /** Forwards to ```FormatUtils.textFormat``` */
    function textFormat(text: string, node?: HTMLElement, html?: boolean) {
        return FormatUtils.textFormat(text, node, html);
    }

    // evaluates an audescript expression, ensuring determinization,
    // minimization, completion and complementation can be used.
    // autoAnsw and A are two variables that can be accessed from the audescript
    // expression.
    function ajsEval(script, autoAnsw, A?) {
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

    class Quiz {
        /** DOM input element to load a quiz */
        static fileInput: HTMLInputElement;
        /** export textFormat */
        static textFormat = textFormat;

        static _ajsEval = ajsEval;

        /**  Initialize the quiz */
        static load() {
            AutomatonPrograms.loadPrograms();
            automataContainer = document.getElementById("automata-container");
            divQuiz = document.getElementById("div-quiz");
            AudeGUI.Quiz.fileInput = document.getElementById("filequiz");
            AudeGUI.Quiz.fileInput.onchange = openQuiz;
        }

        /** Start a quiz from string (JSON). */
        static open(code: string) {
            try {
                Quiz.currentQuiz = new Quiz();
                Quiz.currentQuiz.fromJSON(code);
                Quiz.currentQuiz.start();
                //startQuiz(JSON.parse(code));
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

        static currentQuiz: Quiz;

        questions: Array<Question> = [];
        currentQuestionIndex: number;
        lastQuestionIndex: number;
        answers: Array<{ isCorrect: boolean, reasons: string }> = [];

        title: string = "";
        author: string = "";
        date: string = "";
        description: string = "";

        // Storage of HTML DOM references for this quiz.
        refs: any;
        currentAnswersRefs: any;

        constructor() {
            // We load the programs for questions in advance, 
            // since we need the a bit later.
            AutomatonPrograms.loadPrograms();
        }

        /**
         * Initializes this quiz using the given object.
         * @param jsonCode - The JSON code to intialize from.
         * @returns true if the quiz has been initialized correctly
         */
        fromJSON(jsonCode: string): boolean {
            let obj = JSON.parse(jsonCode);

            this.title = obj.title || "";
            this.author = obj.author || "";
            this.date = obj.date || "";
            this.description = obj.description || "";

            if (!(obj.questions && obj.questions instanceof Array)) {
                throw new Error(_("The quiz doesn't have its list of question."));
            }

            for (let questionObj of obj.questions) {
                if (!questionObj.type) {
                    throw new Error(_("A question in the quiz doesn't have a type specified !"));
                }

                let newQuestion: Question;
                switch (questionObj.type) {
                    case "automatonEquiv":
                    case "regexEquiv":
                        newQuestion = new AutomatonEquivQuestion(QuestionSubType.CustomAutomatonEquiv);
                        break;

                    case "mcq":
                        newQuestion = new MCQQuestion(QuestionSubType.MCQ);
                        break;

                    default:
                        throw new Error(libD.format(_("Unknown question type : {0}"), questionObj.type));
                }

                if (!newQuestion.fromJSON(questionObj)) {
                    throw new Error(_("Formatting error in a question !"));
                };
                this.questions.push(newQuestion);
            }

            return false;
        }

        /**
         * Starts the execution of this quiz.
         */
        start() {
            if (AudeGUI.getCurrentMode() !== "design") {
                AudeGUI.setCurrentMode("design");
            }

            automataContainer.style.display = "none";

            AudeGUI.Runtime.loadIncludes(["equivalence", "regex2automaton", "automaton2json"],
                () => {
                    automataAreEquivalent = audescript.m("equivalence").automataAreEquivalent;
                    object2automaton = audescript.m("automaton2json").object2automaton;
                    regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
                }
            );
            AudeGUI.addAutomaton();

            if (!(this.questions && this.questions instanceof Array)) {
                throw new Error(_("The quiz doesn't have its list of question."));
            }

            this.currentQuestionIndex = -1;

            this.answers = [];
            for (let i = 0; i < this.questions.length; i++) {
                this.answers.push({
                    isCorrect: false,
                    reasons: ""
                });
            }

            divQuiz.classList.add("intro");
            divQuiz.classList.remove("started");
            divQuiz.textContent = "";
            divQuiz.classList.add("enabled");

            var refs: any = {};
            divQuiz.appendChild(libD.jso2dom([
                ["h1#quiz-title", [
                    ["#", this.title ? _("Quiz:") + " " : _("Quiz")],
                    ["span", { "#": "quizTitleContent" }]
                ]],
                ["h2#quiz-author", { "#": "author" }],
                ["div#quiz-descr", { "#": "descr" }],
                ["a#close-quiz", { "#": "closeQuiz", "href": "#" }, _("Close the Quiz")],
                ["div#quiz-content", { "#": "content" },
                    ["div.button-container",
                        ["button", { "#": "startQuiz" }, _("Start the Quiz")]]]
            ], refs));

            FormatUtils.textFormat(this.title || "", refs.quizTitleContent);
            FormatUtils.textFormat((this.author || "") + (this.date ? " - " + this.date : ""), refs.author);
            FormatUtils.textFormat(this.description || "", refs.descr);

            this.refs = refs;
            refs.closeQuiz.onclick = this.close;
            refs.startQuiz.onclick = (e) => {
                this.prevNextQuestion(false);
            }
        }

        prevNextQuestion(goToPrevious: boolean = false, validateCurrent: boolean = true) {
            try {
                divQuiz.classList.remove("intro");
                divQuiz.classList.add("started");
                automataContainer.style.display = "none";

                if (this.currentQuestionIndex >= 0 && validateCurrent) {
                    this.validateCurrentQuestion();
                }

                this.currentQuestionIndex += goToPrevious ? -1 : 1;

                if (this.currentQuestionIndex >= this.questions.length) {
                    this.showCorrection();
                } else {
                    this.askCurrentQuestion();
                }
            } catch (e) {
                if (typeof e === "string") {
                    AudeGUI.notify(
                        _("Error in the Quiz"),
                        libD.format(_("There is an error in the Quiz: {0}"), e),
                        "error"
                    );
                } else {
                    throw e;
                }
            }
        }

        validateCurrentQuestion() {
            this.questions[this.currentQuestionIndex].parseUsersAnswer();
            let result = this.questions[this.currentQuestionIndex].checkUsersAnswer();

            this.answers[this.currentQuestionIndex] = {
                isCorrect: result.correct,
                reasons: result.details
            };
        }

        showCorrection() {
            this.refs.content.textContent = "";
            this.refs.content.appendChild(libD.jso2dom(["p", _("The Quiz is finished! Here are the details of the correction.")]));

            var refs: any = {};

            var answers = libD.jso2dom(["table#correction-table",
                ["tr", [
                    ["th", _("Instruction")],
                    ["th", _("Correct answer?")],
                    ["th", _("Comments")]
                ]]]);

            for (var i = 0, len = this.answers.length; i < len; ++i) {
                var question_i = this.questions[i];

                answers.appendChild(libD.jso2dom(["tr", [
                    ["td.qinst", { "#": "answerInstr" }, [
                        ["span.qid",  (i + 1) + ". "],
                        ["div.qinstr-content"]
                    ]],
                    ["td.qstate", this.answers[i].isCorrect ? _("Yes") : _("No")],
                    ["td.qcmt", { "#": "answerCmt" }]
                ]], refs));

                var reasons = this.answers[i].reasons;

                /*if (reasons[1]) {
                    var ul = document.createElement("ul");

                    for (var j = 0, leng = reasons.length; j < leng; ++j) {
                        var li = document.createElement("li");
                        li.innerHTML = reasons[j];
                        ul.appendChild(li);
                    }

                    refs.answerCmt.appendChild(ul);
                } else {
                    refs.answerCmt.innerHTML = reasons[0] || "";
                }*/
                FormatUtils.textFormat(reasons, refs.answerCmt);

                FormatUtils.textFormat(question_i.wordingText, refs.answerInstr.lastChild, question_i.isWordingHtml);
                refs.answerInstr.appendChild(document.createElement("ul"));
                refs.answerInstr.lastChild.className = "possibilities";

                // For mcq
                if (question_i.category === QuestionCategory.MCQ) {
                    let mcq = <MCQQuestion> question_i;
                    var possibilities = mcq.wordingChoices;
                    for (var j = 0, leng = possibilities.length; j < leng; ++j) {
                        refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                            ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (i + 1)) + ". "],
                            ["span", { "#": i + "content" }]
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

            this.refs.content.appendChild(answers);
            this.refs.content.appendChild(libD.jso2dom([
                ["p", _("We are willing to don’t give you any mark. Your progress is the most important thing, above any arbitrary absolute meaningless mark. Keep your efforts ;-)")],
                ["div.button-container", ["button", { "#": "prev" }, _("Previous page")]]
            ], refs));
            refs.prev.onclick = () => this.prevNextQuestion(true, false); 
        }

        askCurrentQuestion() {
            let q = this.questions[this.currentQuestionIndex];

            var qid = this.currentQuestionIndex + 1;

            var refs: any = {};

            this.currentAnswersRefs = refs;
            this.refs.content.textContent = "";

            q.displayQuestion(this.refs.content);

            this.refs.content.appendChild(
                libD.jso2dom([
                    ["div.button-container", [
                        ["button", { "#": "prev" }, _("Previous question")],
                        ["button", { "#": "ok" }, _("Next question")]
                    ]]
                ], refs)
            );

            refs.ok.onclick = () => {
                this.prevNextQuestion(false);
            }

            if (this.currentQuestionIndex !== 0) {
                refs.prev.onclick = () => {
                    this.prevNextQuestion(true);
                }
            } else {
                refs.prev.style.display = "none";
            }
        }

        close() {
            Quiz.currentQuiz = undefined;
            AudeGUI.removeCurrentAutomaton();
            automataContainer.style.display = "";
            automataContainer.style.top = "";
            divQuiz.textContent = "";
            divQuiz.classList.remove("enabled");
            AudeGUI.mainDesigner.redraw();
            AudeGUI.Results.redraw();
        }
    }

    AudeGUI.Quiz = Quiz;

    // convert a JS Object representing an automaton to an actual automaton.
    // This JS object may come from a JSON representation of the automaton.
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
            A.addTransition(o.transitions[k][0], o.transitions[k][1], o.transitions[k][2]);
        }

        return A;
    }

    /**
     * Opens a quiz from the file input.
     */
    function openQuiz() {
        var freader = new FileReader();

        freader.onload = () => {
            AudeGUI.Quiz.open(freader.result);
        };

        freader.readAsText(AudeGUI.Quiz.fileInput.files[0], "utf-8");
    }

    // Get the automaton from the question
    function getQuestionAutomaton(q) {
        if (q.automatonAnswer) {
            try {
                return svg2automaton(q.automatonAnswer);
            } catch (e) {
                console.error(e);
                throw _("Automaton given in the quiz is not correct.");
            }
        } else if (q.regex) {
            try {
                return regexToAutomaton(q.regex);
            } catch (e) {
                console.error(e);
                throw _("Regular expression given in the quiz is not valid.");
            }
        }
    }

    // Before leaving a question in a quiz, we validate the answers to this
    // question.
    function validateQuestionBeingLeft(quiz, questionBeingLeft) {
        if (typeof questionBeingLeft === "number" && questionBeingLeft >= 0) {
            var q = quiz.questions[questionBeingLeft];
            var r = quiz.answers[questionBeingLeft];

            quiz.answers[questionBeingLeft].reasons = [];

            switch (q.type) {
                case "mcq":
                    var answers = r.userResponse = new libD.Set();

                    var possibilities = q.possibilities;

                    for (var j = 0, leng = possibilities.length; j < leng; ++j) {
                        if (quiz.currentAnswersRefs["answer-" + j].checked) {
                            answers.add(possibilities[j].hasOwnProperty("id") ? possibilities[j].id : j + 1);
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

                case "word": {
                    let autoAnsw = AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex);

                    var words = q.words;
                    var regex = "";

                    r.userResponse = AudeGUI.mainDesigner.getSVG(AudeGUI.mainDesigner.currentIndex);

                    if (autoAnsw) {
                        for (var i = 0, len = words.length; i < len; ++i) {
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
                }

                case "regexEquiv":
                case "automatonEquiv": {
                    let autoAnsw;

                    if (q.automatonAnswer) {
                        autoAnsw = AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex);
                        r.userResponse = AudeGUI.mainDesigner.getSVG(AudeGUI.mainDesigner.currentIndex);
                    } else if (q.regex) {
                        r.userResponse = autoAnsw = (document.getElementById("regexUserResponse") as HTMLInputElement).value;
                        try {
                            autoAnsw = regexToAutomaton(autoAnsw);
                        } catch (e) {
                            throw _("Regular expression given in the quiz is not valid.");
                        }
                    } else {
                        throw _("No automaton or regular expression was given in the quiz.");
                    }

                    if (autoAnsw) {
                        var A = getQuestionAutomaton(q);

                        if (q.audescriptCode) {
                            r.isCorrect = automataAreEquivalent(A, autoAnsw) && ajsEval(q.audescriptCode, autoAnsw, A);
                            if (!r.isCorrect) {
                                var atomicScript = q.audescriptCode.split(" and ");

                                if (!automataAreEquivalent(A, autoAnsw)) {
                                    r.reasons.push(
                                        q.automatonAnswer
                                            ? _("The given automaton isn’t equivalent to the expected one.")
                                            : _("The given regular expression isn’t equivalent to the expected one.")
                                    );
                                }

                                var cond = ["determinized", "minimized", "complete"];

                                for (var i = 0; i < atomicScript.length; i++) {
                                    if (!ajsEval(atomicScript[i], autoAnsw)) {
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
                                    for (var i = 0, len = q.examples.length; i < len; ++i) {
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
                                    for (var i = 0, len = q.counterExamples.length; i < len; ++i) {
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
                                    r.reasons.push(
                                        q.automatonAnswer
                                            ? _("The given automaton isn’t equivalent to the expected one.")
                                            : _("The given regular expression isn’t equivalent to the expected one.")
                                    );
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
        }
    }

    // Show the correction of a quiz (when all questions have been answered)
    function showCorrection(quiz) {
        quiz.refs.content.textContent = "";
        quiz.refs.content.appendChild(libD.jso2dom(["p", _("The Quiz is finished! Here are the details of the correction.")]));

        var refs: any = {};

        var answers = libD.jso2dom(["table#correction-table",
            ["tr", [
                ["th", _("Instruction")],
                ["th", _("Correct answer?")],
                ["th", _("Comments")]
            ]]]);

        for (var i = 0, len = quiz.answers.length; i < len; ++i) {
            var question_i = quiz.questions[i];

            answers.appendChild(libD.jso2dom(["tr", [
                ["td.qinst", { "#": "answerInstr" }, [
                    ["span.qid", (question_i.hasOwnProperty("id") ? question_i.id : (i + 1)) + ". "],
                    ["div.qinstr-content"]
                ]],
                ["td.qstate", quiz.answers[i].isCorrect ? _("Yes") : _("No")],
                ["td.qcmt", { "#": "answerCmt" }]
            ]], refs));

            var reasons = quiz.answers[i].reasons;

            if (reasons[1]) {
                var ul = document.createElement("ul");

                for (var j = 0, leng = reasons.length; j < leng; ++j) {
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

            var possibilities = question_i.possibilities;
            // For mcq
            if (possibilities) {
                for (var j = 0, leng = possibilities.length; j < leng; ++j) {
                    refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                        ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (i + 1)) + ". "],
                        ["span", { "#": i + "content" }]
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
            ["div.button-container", ["button", { "#": "prev" }, _("Previous page")]]
        ], refs));
        refs.prev.onclick = () => { }
    }

    // Convert an SVG code to an automaton.
    // Used to validate a quiz.
    function svg2automaton(svg: string): Automaton {
        var div = document.createElement("div");
        var designer = new AudeDesigner(div, true);
        document.getElementById("div-quiz").appendChild(div);
        div.style.display = "none";
        designer.setAutomatonCode(svg);
        var A = designer.getAutomaton(designer.currentIndex);
        document.getElementById("div-quiz").removeChild(div);
        return A;
    }
    pkg.svg2automaton = svg2automaton;
}(window));
