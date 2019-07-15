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

let automataContainer = null;
let divQuiz = null;

class Quiz {
    _ = window.AudeGUI.l10n;

    /** DOM input element to load a quiz */
    static fileInput: HTMLInputElement;

    /**  Initialize the quiz */
    static load() {
        AutomatonPrograms.loadPrograms();
        automataContainer = document.getElementById("automata-container");
        divQuiz = document.getElementById("div-quiz");
        window.AudeGUI.Quiz.fileInput = document.getElementById("filequiz");
        window.AudeGUI.Quiz.fileInput.onchange = openQuiz;
    }

    /** Start a quiz from string (JSON). */
    static open(code: string) {
        try {
            Quiz.currentQuiz = new Quiz();
            Quiz.currentQuiz.fromJSON(code);
            Quiz.currentQuiz.start();
            //startQuiz(JSON.parse(code));
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

    static currentQuiz: Quiz;

    questions: Array<Question> = [];
    currentQuestionIndex: number;
    answers: Array<{ isCorrect: boolean, reasons: string }> = [];

    title: string = "";
    author: string = "";
    date: string = "";
    description: string = "";

    /** Storage of HTML DOM references for this quiz. */
    refs: any;
    currentAnswersRefs: any;

    constructor() {
        // We load the programs for questions in advance, 
        // since we need them a bit later.
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
        this.questions = [];

        if (!(obj.questions && obj.questions instanceof Array)) {
            throw new Error(window.AudeGUI.l10n("The quiz doesn't have its list of question."));
        }

        for (let questionObj of obj.questions) {
            if (!questionObj.type) {
                throw new Error(window.AudeGUI.l10n("A question in the quiz doesn't have a type specified !"));
            }

            let newQuestion: Question;
            switch (questionObj.type) {
                case "automatonEquiv":
                case "regexEquiv":
                case "grammarEquiv":
                    newQuestion = new AutomatonEquivQuestion(QuestionSubType.CustomAutomatonEquiv);
                    break;

                case "mcq":
                    newQuestion = new MCQQuestion(QuestionSubType.MCQ);
                    break;

                case "textInput":
                    newQuestion = new TextInputQuestion(QuestionSubType.CustomTextInput);
                    break;

                default:
                    throw new Error(libD.format(window.AudeGUI.l10n("Unknown question type : {0}"), questionObj.type));
            }

            if (!newQuestion.fromJSON(questionObj)) {
                throw new Error(window.AudeGUI.l10n("Formatting error in a question !"));
            };
            this.questions.push(newQuestion);
        }

        return false;
    }

    toJSON(): any {
        let o: any = {};

        o.title = this.title;
        o.author = this.author;
        o.date = this.date;
        o.description = this.description;

        o.questions = [];

        for (let q of this.questions) {
            o.questions.push(q.toJSON());
        }

        return o;
    }

    /**
     * Starts the execution of this quiz.
     */
    start() {
        if (window.AudeGUI.getCurrentMode() !== "design") {
            window.AudeGUI.setCurrentMode("design");
        }

        automataContainer.style.display = "none";

        window.AudeGUI.addAutomaton();

        if (!(this.questions && this.questions instanceof Array)) {
            throw new Error(window.AudeGUI.l10n("The quiz doesn't have its list of question."));
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

        let refs: any = {};
        divQuiz.appendChild(libD.jso2dom([
            ["h1#quiz-title", [
                ["#", this.title ? window.AudeGUI.l10n("Quiz:") + " " : window.AudeGUI.l10n("Quiz")],
                ["span", { "#": "quizTitleContent" }]
            ]],
            ["h2#quiz-author", { "#": "author" }],
            ["div#quiz-descr", { "#": "descr" }],
            ["a#close-quiz", { "#": "closeQuiz", "href": "#" }, window.AudeGUI.l10n("Close the Quiz")],
            ["div#quiz-content", { "#": "content" },
                ["div.button-container",
                    ["button", { "#": "startQuiz" }, window.AudeGUI.l10n("Start the Quiz")]]]
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
                window.AudeGUI.notify(
                    window.AudeGUI.l10n("Error in the Quiz"),
                    libD.format(window.AudeGUI.l10n("There is an error in the Quiz: {0}"), e),
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
        this.refs.content.appendChild(libD.jso2dom(["p", this._("The Quiz is finished! Here are the details of the correction.")]));

        let refs: any = {};

        let answers = libD.jso2dom(["table#correction-table",
            ["tr", [
                ["th", this._("Instruction")],
                ["th", this._("Correct answer?")],
                ["th", this._("Comments")]
            ]]]);

        for (let i = 0, len = this.answers.length; i < len; ++i) {
            let question_i = this.questions[i];

            answers.appendChild(libD.jso2dom(["tr", [
                ["td.qinst", { "#": "answerInstr" }, [
                    ["span.qid", (i + 1) + ". "],
                    ["div.qinstr-content"]
                ]],
                ["td.qstate", this.answers[i].isCorrect ? this._("Yes") : this._("No")],
                ["td.qcmt", { "#": "answerCmt" }]
            ]], refs));

            let reasons = this.answers[i].reasons;

            FormatUtils.textFormat(reasons, refs.answerCmt);

            FormatUtils.textFormat(question_i.wordingText, refs.answerInstr.lastChild, question_i.isWordingHtml);
            refs.answerInstr.appendChild(document.createElement("ul"));
            refs.answerInstr.lastChild.className = "possibilities";

            // For mcq
            if (question_i.category === QuestionCategory.MCQ) {
                let mcq = <MCQQuestion>question_i;
                let possibilities = mcq.wordingChoices;
                for (let j = 0, leng = possibilities.length; j < leng; ++j) {
                    refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                        ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (i + 1)) + ". "],
                        ["span", { "#": i + "content" }]
                    ]], refs));

                    if (possibilities[j].automaton) {
                        automaton2svg(
                            possibilities[j].automaton,
                            function (res) {
                                refs[i + "content"].innerHTML = res;
                            }
                        );
                    } else if (possibilities[j].html) {
                        refs[i + "content"].innerHTML = possibilities[j].html;
                    } else if (possibilities[j].text) {
                        FormatUtils.textFormat(possibilities[j].text, refs[i + "content"]);
                    } else if (possibilities[j].html) {
                        FormatUtils.textFormat(possibilities[j].html, refs[i + "content"], true);
                    }
                }
            }
        }

        this.refs.content.appendChild(answers);
        this.refs.content.appendChild(libD.jso2dom([
            ["p", this._("We are willing to don’t give you any mark. Your progress is the most important thing, above any arbitrary absolute meaningless mark. Keep your efforts ;-)")],
            ["div.button-container", ["button", { "#": "prev" }, this._("Previous page")]]
        ], refs));
        refs.prev.onclick = () => this.prevNextQuestion(true, false);
    }

    askCurrentQuestion() {
        let q = this.questions[this.currentQuestionIndex];

        let qid = this.currentQuestionIndex + 1;

        let refs: any = {};

        this.currentAnswersRefs = refs;
        this.refs.content.textContent = "";

        q.displayQuestion(this.refs.content);

        this.refs.content.appendChild(
            libD.jso2dom([
                ["div.button-container", [
                    ["button", { "#": "prev" }, this._("Previous question")],
                    ["button", { "#": "ok" }, this._("Next question")]
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
        window.AudeGUI.removeCurrentAutomaton();
        automataContainer.style.display = "";
        automataContainer.style.top = "";
        divQuiz.textContent = "";
        divQuiz.classList.remove("enabled");
        window.AudeGUI.mainDesigner.redraw();
        window.AudeGUI.Results.redraw();
    }
}

window.AudeGUI.Quiz = Quiz;

// convert a JS Object representing an automaton to an actual automaton.
// This JS object may come from a JSON representation of the automaton.
function automatonFromObj(o) {
    let k = 0;
    let A = new Automaton();

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
window.automatonFromObj = automatonFromObj;

/**
 * Opens a quiz from the file input.
 */
function openQuiz() {
    let freader = new FileReader();

    freader.onload = () => {
        window.AudeGUI.Quiz.open(freader.result);
    };

    freader.readAsText(window.AudeGUI.Quiz.fileInput.files[0], "utf-8");
}

// Show the correction of a quiz (when all questions have been answered)
function showCorrection(quiz) {
    quiz.refs.content.textContent = "";
    quiz.refs.content.appendChild(libD.jso2dom(["p", this._("The Quiz is finished! Here are the details of the correction.")]));

    let refs: any = {};

    let answers = libD.jso2dom(["table#correction-table",
        ["tr", [
            ["th", this._("Instruction")],
            ["th", this._("Correct answer?")],
            ["th", this._("Comments")]
        ]]]);

    for (let i = 0, len = quiz.answers.length; i < len; ++i) {
        let question_i = quiz.questions[i];

        answers.appendChild(libD.jso2dom(["tr", [
            ["td.qinst", { "#": "answerInstr" }, [
                ["span.qid", (question_i.hasOwnProperty("id") ? question_i.id : (i + 1)) + ". "],
                ["div.qinstr-content"]
            ]],
            ["td.qstate", quiz.answers[i].isCorrect ? this._("Yes") : this._("No")],
            ["td.qcmt", { "#": "answerCmt" }]
        ]], refs));

        let reasons = quiz.answers[i].reasons;

        if (reasons[1]) {
            let ul = document.createElement("ul");

            for (let j = 0, leng = reasons.length; j < leng; ++j) {
                let li = document.createElement("li");
                li.innerHTML = reasons[j];
                ul.appendChild(li);
            }

            refs.answerCmt.appendChild(ul);
        } else {
            refs.answerCmt.innerHTML = reasons[0] || "";
        }

        if (question_i.instructionHTML) {
            FormatUtils.textFormat(question_i.instructionHTML, refs.answerInstr.lastChild, true);
        } else {
            FormatUtils.textFormat(question_i.instruction, refs.answerInstr.lastChild);
        }

        refs.answerInstr.appendChild(document.createElement("ul"));
        refs.answerInstr.lastChild.className = "possibilities";

        let possibilities = question_i.possibilities;
        // For mcq
        if (possibilities) {
            for (let j = 0, leng = possibilities.length; j < leng; ++j) {
                refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                    ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (i + 1)) + ". "],
                    ["span", { "#": i + "content" }]
                ]], refs));

                if (possibilities[j].automaton) {
                    automaton2svg(
                        possibilities[j].automaton,
                        function (res) {
                            refs[i + "content"].innerHTML = res;
                        }
                    );
                } else if (possibilities[j].html) {
                    refs[i + "content"].innerHTML = possibilities[j].html;
                } else if (possibilities[j].text) {
                    FormatUtils.textFormat(possibilities[j].text, refs[i + "content"]);
                } else if (possibilities[j].html) {
                    FormatUtils.textFormat(possibilities[j].html, refs[i + "content"], true);
                }
            }
        }
    }

    quiz.refs.content.appendChild(answers);
    quiz.refs.content.appendChild(libD.jso2dom([
        ["p", this._("We don't want to give you a mark. Your progress is the most important thing, above any arbitrary, absolutely meaningless mark. Keep your efforts ;-)")],
        ["div.button-container", ["button", { "#": "prev" }, this._("Previous page")]]
    ], refs));
    refs.prev.onclick = () => { }
}

// Convert an SVG code to an automaton.
// Used to validate a quiz.
function svg2automaton(svg: string): Automaton {
    let div = document.createElement("div");
    let designer = new AudeDesigner(div, false);
    designer.setAutomatonCode(svg, 0);
    console.log(designer.getAutomaton(0));
    return designer.getAutomaton(0).copy();
}
window.svg2automaton = svg2automaton;