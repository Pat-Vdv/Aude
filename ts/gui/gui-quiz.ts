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

/**
 * Handles storage and execution of quizzes.
 */
class AudeQuiz {
    private readonly _ = window.AudeGUI.l10n;

    /** DOM input element to load a quiz */
    static fileInput: HTMLInputElement;
    /** The DOM element that will contaion quizzes when and if they are executed. */
    private static divQuiz: HTMLElement;
    /**
     * Quiz instance that is being executed.
     * Only one quiz can be executed at a time.
     */
    static currentQuiz: AudeQuiz;

    /**  Initialize the quiz */
    static load() {
        AutomatonPrograms.loadPrograms();
        AudeQuiz.divQuiz = document.getElementById("div-quiz");
        AudeQuiz.fileInput = document.getElementById("filequiz") as HTMLInputElement;
        AudeQuiz.fileInput.onchange = AudeQuiz.openQuiz;
    }

    /** Start a quiz from string (JSON). */
    static open(code: string) {
        try {
            AudeQuiz.currentQuiz = new AudeQuiz();
            AudeQuiz.currentQuiz.fromJSON(code);
            AudeQuiz.currentQuiz.start();
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

    /**
    * Opens a quiz from the file input.
    */
    static openQuiz() {
        const freader = new FileReader();

        freader.onload = () => {
            AudeQuiz.open(freader.result as string);
        };

        freader.readAsText(AudeQuiz.fileInput.files[0], "utf-8");
    }

    /** This quizz's questions. */
    questions: Array<Question> = [];
    /** During execution, the index of the question currently shown to the user. */
    currentQuestionIndex: number;
    /** During execution, the validation results for the user's answers. */
    answers: Array<{ isCorrect: boolean, reasons: string }> = [];

    title: string = "";
    author: string = "";
    date: string = "";
    description: string = "";

    /** Storage of HTML DOM references for this quiz. */
    refs: any;
    currentAnswersRefs: any;

    /**
     * Initializes this quiz using the given JSON string.
     * @param jsonCode - The JSON code to intialize from.
     * @returns true if the quiz has been initialized correctly
     */
    fromJSON(jsonCode: string): boolean {
        const obj = JSON.parse(jsonCode);

        // Load misc. info.
        this.title = obj.title || "";
        this.author = obj.author || "";
        this.date = obj.date || "";
        this.description = obj.description || "";
        this.questions = [];

        if (!(obj.questions && obj.questions instanceof Array)) {
            throw new Error(window.AudeGUI.l10n("The quiz doesn't have its list of question."));
        }

        // Load questions.
        for (const questionObj of obj.questions) {
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
            }
            this.questions.push(newQuestion);
        }

        return false;
    }

    /**
     * Returns an object ready for serialization using JSON.stringify
     * that represents this quiz.
     */
    toJSON(): any {
        const o: any = {};

        o.title = this.title;
        o.author = this.author;
        o.date = this.date;
        o.description = this.description;

        o.questions = [];

        for (const q of this.questions) {
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

        window.AudeGUI.addAutomaton();

        if (!(this.questions && this.questions instanceof Array)) {
            throw new Error(window.AudeGUI.l10n("The quiz doesn't have its list of question."));
        }

        // If a quiz was previously executing, close it.
        AudeQuiz.currentQuiz.close();
        AudeQuiz.currentQuiz = this;
        this.currentQuestionIndex = -1;

        // Fill the answers with dummy incorrect statuses.
        this.answers = [];
        for (const q of this.questions) {
            this.answers.push({
                isCorrect: false,
                reasons: this._("No answer given.")
            });
        }

        AudeQuiz.divQuiz.classList.add("intro");
        AudeQuiz.divQuiz.classList.remove("started");
        AudeQuiz.divQuiz.textContent = "";
        AudeQuiz.divQuiz.classList.add("enabled");

        const refs: any = {};
        AudeQuiz.divQuiz.appendChild(libD.jso2dom([
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
        };
    }

    /**
     * Makes the current quiz go to the previous or next question. 
     * @param goToPrevious - If true, will go to the previous question, otherwise goes to the next.s
     * @param validateCurrent - If true, the user's answer to the current question will be checked before leaving.
     */
    prevNextQuestion(goToPrevious: boolean = false, validateCurrent: boolean = true) {
        try {
            AudeQuiz.divQuiz.classList.remove("intro");
            AudeQuiz.divQuiz.classList.add("started");

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

    /**
     * Checks the user's answer for the current question and 
     * sets its validation status in the "answers" array.
     */
    validateCurrentQuestion() {
        this.questions[this.currentQuestionIndex].parseUsersAnswer();
        const result = this.questions[this.currentQuestionIndex].checkUsersAnswer();

        this.answers[this.currentQuestionIndex] = {
            isCorrect: result.correct,
            reasons: result.details
        };
    }

    /**
     * Shows the correction at the end of a quiz.
     */
    showCorrection() {
        this.refs.content.textContent = "";
        this.refs.content.appendChild(libD.jso2dom(["p", this._("The Quiz is finished! Here are the details of the correction.")]));

        const answers = libD.jso2dom(["table#correction-table",
            ["tr", [
                ["th", this._("Instruction")],
                ["th", this._("Correct answer?")],
                ["th", this._("Comments")]
            ]]]
        );

        const refs: any = {};

        for (let i = 0, len = this.answers.length; i < len; ++i) {
            const question_i = this.questions[i];

            answers.appendChild(libD.jso2dom(["tr", [
                ["td.qinst", { "#": "answerInstr" }, [
                    ["span.qid", (i + 1) + ". "],
                    ["div.qinstr-content"]
                ]],
                ["td.qstate", this.answers[i].isCorrect ? this._("Yes") : this._("No")],
                ["td.qcmt", { "#": "answerCmt" }]
            ]], refs));

            const reasons = this.answers[i].reasons;

            FormatUtils.textFormat(reasons, refs.answerCmt);

            FormatUtils.textFormat(question_i.wordingText, refs.answerInstr.lastChild, question_i.isWordingHtml);
            refs.answerInstr.appendChild(document.createElement("div"));

            if (question_i instanceof MCQQuestion) {
                question_i.showWordingChoicesCheckboxes(refs.answerInstr.lastChild, true, true);
            }
        }

        this.refs.content.appendChild(answers);
        this.refs.content.appendChild(libD.jso2dom([
            ["p", this._("We don't want to give you any mark. Your progress is the most important thing, above any arbitrary, absolutely meaningless mark. Keep up your efforts ;-)")],
            ["div.button-container", ["button", { "#": "prev" }, this._("Previous page")]]
        ], refs));
        refs.prev.onclick = () => this.prevNextQuestion(true, false);
    }

    /**
     * Displays the curent question and its inputs.
     */
    askCurrentQuestion() {
        const q = this.questions[this.currentQuestionIndex];

        const refs: any = {};

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
        };

        if (this.currentQuestionIndex !== 0) {
            refs.prev.onclick = () => {
                this.prevNextQuestion(true);
            };
        } else {
            refs.prev.style.display = "none";
        }
    }

    /**
     * Closes this quiz object.
     */
    close() {
        AudeQuiz.currentQuiz = undefined;
        window.AudeGUI.removeCurrentAutomaton();
        AudeQuiz.divQuiz.textContent = "";
        AudeQuiz.divQuiz.classList.remove("enabled");
        window.AudeGUI.mainDesigner.redraw();
        window.AudeGUI.Results.redraw();
    }
}

// convert a JS Object representing an automaton to an actual automaton.
// This JS object may come from a JSON representation of the automaton.
function automatonFromObj(o) {
    return Convert.obj2automaton(o);
}
window.automatonFromObj = automatonFromObj;

// Exported here for legacy support. Use Convert.svg2automaton instead.
window.svg2automaton = Convert.svg2automaton;
