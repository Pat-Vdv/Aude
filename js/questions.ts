
/** Enumeration of all existing question subtypes. */
enum QuestionSubType {
    Complement,
    Complete,
    Product,
    Minimize,
    EquivalentStates,
    EquivalentAutomata,
    Reachable,
    Coreachable,
    Word,
    WordNonDet,
    WordEpsilon,
    WordGrammar,
    WordRegexp,
    Determinize,
    Determinize_Minimize,
    EliminateEpsilon,
    Determinize_EliminateEpsilon,
    Automaton2Regexp,
    Regexp2Automaton,
    Grammar2Automaton,
    Automaton2Grammar,
    LeftGrammar2RightGrammar,
    MCQ,
    MCQ_C1,
    MCQ_C2,
    MCQ_C3,
    MCQ_C4,
    MCQ_C5,
    MCQ_C6,
    RecognizeLanguageAutomaton,
    RecognizeLanguageRE,
    // Subtypes to handle quiz questions.
    CustomAutomatonEquiv,
    CustomTextInput
}

/** Enumeration of all categories of questions. 
*  Each category should correspond to a subclass of Question.
*/
enum QuestionCategory {
    TextInput,
    AutomatonEquivQuestion,
    MCQ
}

/**
 * @abstract
 * Abstract Question type from which all question variants must inherit.
 * Specifies the basic methods a question needs to have.
 */
abstract class Question {
    _ = window.AudeGUI.l10n;

    static deduceQuestionCategory(qst: QuestionSubType): QuestionCategory {
        if (QuestionSubType[qst].startsWith("MCQ")) {
            return QuestionCategory.MCQ;
        }
        switch (qst) {
            case QuestionSubType.EquivalentAutomata:
                return QuestionCategory.MCQ;

            case QuestionSubType.Complement:
            case QuestionSubType.Complete:
            case QuestionSubType.Product:
            case QuestionSubType.Minimize:
            case QuestionSubType.Determinize:
            case QuestionSubType.Determinize_Minimize:
            case QuestionSubType.EliminateEpsilon:
            case QuestionSubType.Determinize_EliminateEpsilon:
            case QuestionSubType.Automaton2Regexp:
            case QuestionSubType.Regexp2Automaton:
            case QuestionSubType.Automaton2Grammar:
            case QuestionSubType.Grammar2Automaton:
            case QuestionSubType.LeftGrammar2RightGrammar:
            case QuestionSubType.RecognizeLanguageAutomaton:
            case QuestionSubType.RecognizeLanguageRE:
                return QuestionCategory.AutomatonEquivQuestion;

            case QuestionSubType.EquivalentStates:
            case QuestionSubType.Reachable:
            case QuestionSubType.Coreachable:
            case QuestionSubType.Word:
            case QuestionSubType.WordNonDet:
            case QuestionSubType.WordEpsilon:
            case QuestionSubType.WordGrammar:
            case QuestionSubType.WordRegexp:
                return QuestionCategory.TextInput;
        }
    }

    createNewStateButton(divDesigner: HTMLElement) {
        divDesigner.appendChild(libD.jso2dom(["a#new-state-btn"]));

        (<HTMLElement>divDesigner.lastChild).onmousedown = function (e) {
            (<HTMLElement>e.target).classList.add("mouse-down");
        };

        (<HTMLElement>divDesigner.lastChild).onmouseup = function (e) {
            (<HTMLElement>e.target).classList.remove("mouse-down");
        };

        (<HTMLElement>divDesigner.lastChild).onclick = AudeDesigner.initiateNewState;
        divDesigner.parentNode.lastChild.lastChild.textContent = this._("New state");
    }

    createRedrawButton(divDesigner: HTMLElement, designer: AudeDesigner) {
        let redrawButton = libD.jso2dom(["button", this._("Redraw")]) as HTMLButtonElement;
        redrawButton.onclick = (e) => {
            window.AudeGUI.viz(
                designer.getDot(),
                function (res) {
                    designer.setSVG(res, designer.currentIndex);
                }
            );
            designer.autoCenterZoom();
        };
        divDesigner.parentElement.appendChild(redrawButton);
    }

    /** The broad question category for this object (text input, mcq, automaton, ...). */
    category: QuestionCategory;
    /** Precise subtype of the question. */
    subtype: QuestionSubType;
    /** The general textual description of the question. */
    wordingText: string;
    isWordingHtml: boolean = false;

    constructor(subtype: QuestionSubType, wordingText?: string, isWordingHtml?) {
        this.subtype = subtype;
        this.category = Question.deduceQuestionCategory(this.subtype);
        if (wordingText) {
            this.wordingText = wordingText;
            this.isWordingHtml = isWordingHtml;
        } else {
            this.wordingText = this.createWording();
        }

        AutomatonPrograms.loadPrograms();
    }

    /*
     * Displays the full question wording : textual wording, additional info and inputs.
    */
    displayQuestion(questionDisplayDiv: HTMLElement): void {

        // Clearing the given div.
        questionDisplayDiv.innerHTML = "";

        // Populating the div.
        let refs = {
            divWordingText: HTMLElement = null,
            divWordingDetails: HTMLElement = null,
            divUserInput: HTMLElement = null
        };

        questionDisplayDiv.appendChild(libD.jso2dom([
            ["div#question-wording-text", { "#": "divWordingText" }, this._("Question :")],

            ["div#question-wording-details", { "#": "divWordingDetails" }],

            ["div#answer-user-input", { "#": "divUserInput" }]
        ], refs));

        // We display the wording text.
        FormatUtils.textFormat(this.wordingText, refs.divWordingText, this.isWordingHtml);

        // We display the additionnal info.
        this.displayWordingDetails(refs.divWordingDetails);

        // We show the answer input UI.
        this.displayAnswerInputs(refs.divUserInput);
    }

    /**
     * Extract the user's answer from the inputs previously created, 
     * and saves the answer to the object's internal state.
     * The inputs must have previously been populated 
     * using ```displayAnswerInputs```.
     * @see Question#displayAnswerInputs
     * @returns A boolean that is true if the given HTML element couldn't be parsed.
     */
    abstract parseUsersAnswer(): boolean;

    /**
     * Checks whether the user's answer is correct. 
     * The user's answer must be read from somewhere beforehand, using, for example, ```parseUsersAnswerFromHTML``` to get it from an HTML element.
     * @see Question#parseUsersAnswerFromHTML
     * @returns An promise for an object containing a boolean ```correct``` 
     * that is true if the answer was right, and a string ```details``` 
     * detailing the mistake if ```correct``` is false.
     */
    abstract checkUsersAnswer(): { correct: boolean, details: string };

    /**audescript.m("regex2automaton").regexToAutomaton
     * Displays this question's wording details and additional information (automata, grammars, regexps, etc...)
     * in an HTML element.
     * @param wordingDetailsDiv - The HTML element to insert the wording details into (its content will be cleared !).
     */
    abstract displayWordingDetails(wordingDetailsDiv: HTMLElement): void;

    /**
     * Displays this question's input interface (checkboxes, radio, ...) for the answer in an HTML element.
     * @param answerInputDiv - The HTML element in which to insert the input controls. (its contents will be cleared !).
     */
    abstract displayAnswerInputs(answerInputDiv: HTMLElement): void;

    /**
     * Displays the correct answer of this question into an HTML Element.
     * @param correctAnswerDiv - The HTML Element in which the correct answer is to be displayed.
     */
    abstract displayCorrectAnswer(correctAnswerDiv: HTMLElement): void;

    /**
     * Converts the question to a object for JSON conversion.
     */
    abstract toJSON(): any;

    /**
     * Initializes this question from a JSON object.
     * @param qObj - The object to extract the question info from. 
     */
    abstract fromJSON(qObj: any): boolean;

    /**
     * Generates wording for this question automatically, based on its subtype.
     */
    createWording(): string {
        if (QuestionSubType[this.subtype].startsWith("MCQ")) {
            return this._("Which of the following assertions are true ?");
        }

        switch (this.subtype) {
            case QuestionSubType.Complement:
                return this._("Give an automaton that recognizes the complement of the language recognized by the following :");

            case QuestionSubType.Complete:
                return this._("Give a complete automaton that recognizes the same language as the following :");

            case QuestionSubType.Product:
                return this._("Compute the product of the following automata :");

            case QuestionSubType.Minimize:
                return this._("Minimize the following automaton :");

            case QuestionSubType.EquivalentStates:
                return this._("Give the equivalent states of the following automaton :");

            case QuestionSubType.EquivalentAutomata:
                return this._("Are the following automata equivalent ?");

            case QuestionSubType.Reachable:
                return this._("List all the reachable states of the following automaton :");

            case QuestionSubType.Coreachable:
                return this._("List all the co-reachable states of the following automaton :");

            case QuestionSubType.Word:
            case QuestionSubType.WordNonDet:
            case QuestionSubType.WordEpsilon:
                return this._("Give any word that is recognized by the following automaton :");

            case QuestionSubType.WordGrammar:
                return this._("Give any word that the following linear grammar recognizes.");

            case QuestionSubType.WordRegexp:
                return this._("Give any word that the following regular expression recognizes.");

            case QuestionSubType.Determinize:
                return this._("Give a deterministic automaton that recognizes the same language as the following :");

            case QuestionSubType.Determinize_Minimize:
                return this._("Give a minimal and deterministic automaton that recognizes the same language as the following :");

            case QuestionSubType.EliminateEpsilon:
                return this._("Give an automaton without ε-transitions that is equivalent to the following :");

            case QuestionSubType.Determinize_EliminateEpsilon:
                return this._("Give a deterministic automaton without ε-transitions that is equivalent to the following :");

            case QuestionSubType.Automaton2Regexp:
                return this._("Give a regular expression that recognizes the same language as the following automaton :");

            case QuestionSubType.Regexp2Automaton:
                return this._("Give an automaton that recognizes the same language as the following regular expression :");

            case QuestionSubType.Grammar2Automaton:
                return this._("Give an automaton that recognizes the same language as the following right linear grammar :");

            case QuestionSubType.Automaton2Grammar:
                return this._("Give a linear grammar that recognizes the same language as the following automaton : ");

            case QuestionSubType.LeftGrammar2RightGrammar:
                return this._("Convert the following left linear grammar to an equivalent right liear grammar.");

            default:
                return "";
        }
    }
}

/**
* Enumeration of possible types of input/output formats for a "regular language specification".
* That is, a structure that describes a regular language.
* Used as a parameter for some question categories that allow
* for multiple wording/answer types.
*/
enum AutomatonDataType {
    Regexp,
    Automaton,
    LinearGrammar
}

/**
 * Class that handles questions that take an automaton,
 * regular expression or linear grammar for an answer.
 */
class AutomatonEquivQuestion extends Question {
    static readonly AnswerAutomatonConstraints = {
        Minimal: (a: Automaton) => {
            if (!AutomatonPrograms.isMinimized(a)) {
                return { correct: false, details: window.AudeGUI.l10n("The given automaton isn't minimal !") };
            }
            return { correct: true, details: "" };
        },

        Complete: (a: Automaton) => {
            if (!AutomatonPrograms.isCompleted(a)) {
                return { correct: false, details: window.AudeGUI.l10n("The given automaton isn't complete !") };
            }
            return { correct: true, details: "" };
        },

        Deterministic: (a: Automaton) => {
            if (!AutomatonPrograms.isDeterminized(a)) {
                return { correct: false, details: window.AudeGUI.l10n("The given automaton isn't deterministic !") };
            }
            return { correct: true, details: "" };
        },

        NoEpsilon: (a: Automaton) => {
            if (AutomatonPrograms.hasEpsilonTransitions(a)) {
                return { correct: false, details: window.AudeGUI.l10n("The given automaton still has ε-transitions !") };
            }
            return { correct: true, details: "" };
        }
    }

    /** The objects for this question's wording. */
    wordingDetails: Array<Automaton | string | linearGrammar> = [];

    usersAnswerType: AutomatonDataType = AutomatonDataType.Automaton;
    usersAnswerAutomaton: Automaton = undefined;
    usersAnswerRaw: Automaton | string | linearGrammar;

    /** Correct answer against which the user's answer will be checked. */
    correctAnswerAutomaton: Automaton;

    // Constraint functions to add additional constraints to user's answer
    // (minimal, complete, grammar is left linear, ...)
    automatonAnswerConstraints: Array<(a: Automaton) => { correct: boolean, details: string }> = [];
    regexpAnswerConstraints: Array<(re: string) => { correct: boolean, details: string }> = [];
    grammarAnswerConstraints: Array<(g: linearGrammar) => { correct: boolean, details: string }> = [];

    answerInput: AudeDesigner | HTMLInputElement | GrammarDesigner = undefined;

    constructor(qSubtype: QuestionSubType) {
        super(qSubtype);

        /** We set constraints for the answer if the subtype needs it. */
        switch (this.subtype) {
            case QuestionSubType.Minimize:
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.Minimal);
                break;

            case QuestionSubType.Complete:
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.Complete);
                break;

            case QuestionSubType.Determinize:
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.Deterministic);
                break;

            case QuestionSubType.Determinize_Minimize:
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.Deterministic);
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.Minimal);
                break;

            case QuestionSubType.EliminateEpsilon:
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.NoEpsilon);
                break;

            case QuestionSubType.Determinize_EliminateEpsilon:
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.Deterministic);
                this.automatonAnswerConstraints.push(AutomatonEquivQuestion.AnswerAutomatonConstraints.NoEpsilon);
                break;
        }
    }

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        // We cannot handle more than two objects in the wording (yet.)
        if (this.wordingDetails.length === 0 || this.wordingDetails.length > 2) {
            return;
        }

        let showDetailObject = (wd: Automaton | string | linearGrammar, element: HTMLElement, single?: boolean) => {
            if (wd instanceof Automaton) {
                let refs = {
                    divDesigner: <HTMLElement>null,
                    divInfo: <HTMLElement>null
                };

                element.appendChild(
                    libD.jso2dom(
                        [
                            ["div.question-other-info", [["span", this._("Alphabet : ")], ["div", { "#": "divInfo" }]]],
                            ["br"],
                            ["div" + (single ? "#question-automaton-designer" : ""), { "#": "divDesigner" }]
                        ],
                        refs
                    )
                );

                let designer = new AudeDesigner(refs.divDesigner, true);
                designer.setAutomatonCode(automaton_code(wd));
                designer.autoCenterZoom();

                window.AudeGUI.Quiz.textFormat(
                    FormatUtils.set2Latex(wd.getAlphabet()),
                    refs.divInfo
                );
            } else if (typeof wd === "string") {
                FormatUtils.textFormat(FormatUtils.regexp2Latex(wd), element, true);
            } else if (wd instanceof linearGrammar) {
                let wdGramDesigner = new GrammarDesigner(element, false);
                wdGramDesigner.setGrammar(wd);
            } else {
                window.AudeGUI.notify(this._("Error !"), this._("This question contains an error !"), "error");
            }
        }

        if (this.wordingDetails.length === 2) {
            let refs = {
                wdLeft: <HTMLElement>undefined,
                wdRight: <HTMLElement>undefined
            };
            wordingDetailsDiv.appendChild(libD.jso2dom(
                ["div#question-automaton-designer",
                    [
                        ["div#question-wording-details-left", { "#": "wdLeft" }],
                        ["div#question-wording-details-right", { "#": "wdRight" }]
                    ]
                ],
                refs
            ));

            for (let i = 0; i < 2; i++) {
                let wd = this.wordingDetails[i];
                let element = (i === 0 ? refs.wdLeft : refs.wdRight);

                showDetailObject(wd, element);
            }
        } else if (this.wordingDetails.length === 1) {
            showDetailObject(this.wordingDetails[0], wordingDetailsDiv, true);
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        switch (this.usersAnswerType) {
            case AutomatonDataType.Automaton: {
                // If it exists, we retrieve the old designer's SVG.
                let oldSvg = undefined;
                if (this.answerInput !== undefined && this.answerInput instanceof AudeDesigner) {
                    oldSvg = this.answerInput.getSVG(0);
                }

                let designerDiv = libD.jso2dom(["div#question-answers-automaton"]);
                answerInputDiv.appendChild(designerDiv);
                this.answerInput = new AudeDesigner(designerDiv, false);
                this.createNewStateButton(designerDiv);
                this.createRedrawButton(designerDiv, this.answerInput);

                // We set the old designer's SVG, if it has been set.
                if (oldSvg !== undefined) {
                    this.answerInput.setSVG(oldSvg);
                }
                break;
            }

            case AutomatonDataType.Regexp: {
                this.answerInput = <HTMLInputElement>libD.jso2dom(
                    ["input#question-answers-input", { "placeholder": this._("Give your regular expression here.") }]
                );
                answerInputDiv.appendChild(this.answerInput);

                if (this.usersAnswerRaw !== undefined && typeof this.usersAnswerRaw === "string") {
                    this.answerInput.value = this.usersAnswerRaw;
                }
                break;
            }

            case AutomatonDataType.LinearGrammar: {
                this.answerInput = new GrammarDesigner(answerInputDiv, true);
                if (this.usersAnswerRaw !== undefined && this.usersAnswerRaw instanceof linearGrammar) {
                    this.answerInput.setGrammar(this.usersAnswerRaw);
                }
                break;
            }
        }
    }

    parseUsersAnswer(): boolean {
        if (this.answerInput === undefined) {
            return true;
        }

        if (this.answerInput instanceof AudeDesigner) {
            this.usersAnswerRaw = this.answerInput.getAutomaton(0);
            this.usersAnswerAutomaton = this.usersAnswerRaw;
        } else if (this.answerInput instanceof HTMLInputElement) {
            this.usersAnswerRaw = this.answerInput.value;
            this.usersAnswerAutomaton = AutomatonPrograms.regexToAutomaton(this.usersAnswerRaw);
        } else if (this.answerInput instanceof GrammarDesigner) {
            this.usersAnswerRaw = this.answerInput.getGrammar();
            this.usersAnswerAutomaton = AutomatonPrograms.linearGrammar2Automaton(this.usersAnswerRaw);
        }
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        if (!this.usersAnswerAutomaton) {
            return {
                correct: false,
                details: this._("No answer was given !")
            }
        }

        if (this.correctAnswerAutomaton === undefined) {
            return {
                correct: false,
                details: this._("This question wasn't created properly !")
            }
        }

        if (!AutomatonPrograms.automataAreEquivalent(this.usersAnswerAutomaton, this.correctAnswerAutomaton)) {
            return {
                correct: false,
                details: this._("Your answer doesn't recognize the right language !")
            };
        }

        if (this.usersAnswerRaw instanceof Automaton) {
            for (let checkFun of this.automatonAnswerConstraints) {
                let checkResult = checkFun(this.usersAnswerRaw);
                if (!checkResult.correct) {
                    return checkResult;
                }
            }
        } else if (typeof this.usersAnswerRaw === "string") {
            for (let checkFun of this.regexpAnswerConstraints) {
                let checkResult = checkFun(this.usersAnswerRaw);
                if (!checkResult.correct) {
                    return checkResult;
                }
            }
        } else if (this.usersAnswerRaw instanceof linearGrammar) {
            for (let checkFun of this.grammarAnswerConstraints) {
                let checkResult = checkFun(this.usersAnswerRaw);
                if (!checkResult.correct) {
                    return checkResult;
                }
            }
        }

        return { correct: true, details: "" };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    toJSON(): any {
        let obj: any = {};

        // We set the question type.
        switch (this.usersAnswerType) {
            case AutomatonDataType.Automaton:
                obj.type = "automatonEquiv";
                break;
            case AutomatonDataType.Regexp:
                obj.type = "regexEquiv";
                break;
            case AutomatonDataType.LinearGrammar:
                obj.type = "grammarEquiv";
                break;
        }

        obj.instruction = this.wordingText;

        // New format, with array for wording details.
        if (obj.wordingDetails) {

        }

        return obj;
    }

    fromJSON(qObj: any): boolean {
        // Load type.
        switch (qObj.type) {
            case "automatonEquiv":
                this.usersAnswerType = AutomatonDataType.Automaton;
                break;

            case "regexEquiv":
                this.usersAnswerType = AutomatonDataType.Regexp;
                break;

            case "grammarEquiv":
                this.usersAnswerType = AutomatonDataType.LinearGrammar;
                break;
        }

        // Load instructions.
        if (qObj.instruction) {
            this.wordingText = qObj.instruction;
            this.isWordingHtml = false;
        } else if (qObj.instructionHTML) {
            this.wordingText = qObj.instructionHTML;
            this.isWordingHtml = true;
        }

        // "Legacy" support for automaton wording detail.
        if (qObj.automatonQuestion) {
            this.wordingDetails.push(window.svg2automaton(qObj.automatonQuestion));
        }

        // Load wording details.
        // Takes {aType, content} object for detail and returns converted object of it.
        function getDetailFromObj(obj: any) {
            let newDetail: (Automaton | string | linearGrammar);

            if (!obj.aType) {
                return undefined;
            }

            let detType = AutomatonDataType[obj.aType as string];
            if (detType === undefined) {
                return undefined;
            }
            switch (detType) {
                case AutomatonDataType.Automaton:
                    if (typeof obj.content === "string") {
                        newDetail = window.svg2automaton(obj.content);
                    } else {
                        newDetail = window.automatonFromObj(obj.content);
                    }
                    break;

                case AutomatonDataType.Regexp:
                    newDetail = obj.content as string;
                    break;

                case AutomatonDataType.LinearGrammar:
                    newDetail = string2LinearGrammar(obj.content);
                    break;
            }

            return newDetail;
        }
        if (qObj.wordingDetails) {
            // There are two details.
            if (qObj.wordingDetails instanceof Array) {
                for (let det of qObj.wordingDetails) {
                    let newDetail = getDetailFromObj(det);
                    if (newDetail === undefined) {
                        return false;
                    }

                    if (this.wordingDetails.length < 2) {
                        this.wordingDetails.push(newDetail);
                    }
                }
            } else {
                let newDetail = getDetailFromObj(qObj.wordingDetails);
                if (newDetail === undefined) {
                    return false;
                }

                this.wordingDetails.push(newDetail);
            }
        }

        if (qObj.automatonAnswer) {
            if (typeof qObj.automatonAnswer === "string") {
                this.correctAnswerAutomaton = window.svg2automaton(qObj.automatonAnswer);
            } else {
                this.correctAnswerAutomaton = window.automatonFromObj(qObj.automatonAnswer);
            }
        } else if (qObj.regex) {
            this.correctAnswerAutomaton = AutomatonPrograms.regexToAutomaton(qObj.regex);
        } else if (qObj.grammar) {
            this.correctAnswerAutomaton = AutomatonPrograms.linearGrammar2Automaton(<linearGrammar>qObj.grammar);
        }

        // TODO : Load audescript code.

        return true;
    }
}

/** 
* A class to handle MCQ-type questions.
*/
class MCQQuestion extends Question {
    /**
     * Array of objects each representing a choice.
     * Choices can contain text (plain or HTML) with LaTeX,
     * and a single figure (automaton, regexp or grammar).
     */
    wordingChoices: Array<{
        id: string,
        text?: string,
        html?: string,
        automaton?: Automaton,
        regex?: string,
        grammar?: linearGrammar
    }> = [];

    /** Array of the IDs of the correct choices. */
    correctChoices: Array<string> = [];
    /** Array of the figures (automaton, regexp, grammar) to be displayed in the instructions. */
    wordingDetails: Array<Automaton | string | linearGrammar> = [];
    /** If true, only one answer will be selectable (radio buttons will be shown) */
    singleChoice: boolean = false;

    /** Array of the IDs of the choices the user has selected. */
    usersChoices: Array<string> = undefined;
    /** 
     * Array of the DOM Checkboxes/Radio buttons for the questions.
     * The ID corresponding to a checkbox will be in their ```value``` attribute. 
     */
    choicesCheckboxes: Array<HTMLInputElement> = [];

    /**
     * Sets the choices presented for this question.
     * @param wordingChoices - An array of all the choices for this question.
     * @param singleChoice - If true, only one answer will be selectable. Ensure only one is correct.
     */
    setWordingChoices(wordingChoices: Array<{
        id?: string,
        text?: string,
        html?: string,
        automaton?: Automaton,
        regex?: string,
        grammar?: linearGrammar,
        correct?: boolean
    }>,
        singleChoice: boolean = this.singleChoice) {
        for (let wc of wordingChoices) {
            let id = (wc.id === undefined ? String(this.wordingChoices.length) : wc.id);
            this.wordingChoices.push({
                id: id,
                text: wc.text,
                html: wc.html,
                automaton: wc.automaton,
                regex: wc.regex,
                grammar: wc.grammar
            });

            if (wc.correct) {
                this.correctChoices.push(id);
            }
        }

        this.singleChoice = singleChoice;
    }

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        if (this.wordingDetails.length === 0) {
            return;
        }

        let showDetailObject = (wd: Automaton | string | linearGrammar, element: HTMLElement, single?: boolean) => {
            if (wd instanceof Automaton) {
                let refs = {
                    divDesigner: <HTMLElement>null,
                    divInfo: <HTMLElement>null
                };

                element.appendChild(
                    libD.jso2dom(
                        [
                            ["div.question-other-info", [["span", this._("Alphabet : ")], ["div", { "#": "divInfo" }]]],
                            ["br"],
                            ["div" + (single ? "#question-automaton-designer" : ""), { "#": "divDesigner" }]
                        ],
                        refs
                    )
                );

                let designer = new AudeDesigner(refs.divDesigner, true);
                designer.setAutomatonCode(automaton_code(wd));
                designer.autoCenterZoom();

                window.AudeGUI.Quiz.textFormat(
                    FormatUtils.set2Latex(wd.getAlphabet()),
                    refs.divInfo
                );
            } else if (typeof wd === "string") {
                FormatUtils.textFormat(FormatUtils.regexp2Latex(wd), element, true);
            } else if (wd instanceof linearGrammar) {
                let wdGramDesigner = new GrammarDesigner(element, false);
                wdGramDesigner.setGrammar(wd);
            } else {
                window.AudeGUI.notify(this._("Error !"), this._("This question contains an error !"), "error");
            }
        }

        if (this.wordingDetails.length === 2) {
            let refs = {
                wdLeft: <HTMLElement>undefined,
                wdRight: <HTMLElement>undefined
            };
            wordingDetailsDiv.appendChild(libD.jso2dom(
                ["div#question-automaton-designer",
                    [
                        ["div#question-wording-details-left", { "#": "wdLeft" }],
                        ["div#question-wording-details-right", { "#": "wdRight" }]
                    ]
                ],
                refs
            ));

            for (let i = 0; i < 2; i++) {
                let wd = this.wordingDetails[i];
                let element = (i === 0 ? refs.wdLeft : refs.wdRight);

                showDetailObject(wd, element);
            }
        } else if (this.wordingDetails.length === 1) {
            showDetailObject(this.wordingDetails[0], wordingDetailsDiv, true);
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        let choiceList = libD.jso2dom(["ul#question-answers-checkbox-list"]);

        for (let choice of this.wordingChoices) {
            let refs = { choiceLabel: <HTMLElement>undefined };
            choiceList.appendChild(libD.jso2dom(
                ["li",
                    ["label", { "#": "choiceLabel" }]
                ],
                refs
            ));

            let choiceInput = <HTMLInputElement>libD.jso2dom(
                [
                    "input",
                    {
                        "type": (this.singleChoice ? "radio" : "checkbox"),
                        "name": "audeQuizRadio",
                        "value": choice.id
                    }
                ]
            );
            refs.choiceLabel.appendChild(choiceInput);
            this.choicesCheckboxes.push(choiceInput);

            refs.choiceLabel.appendChild(libD.jso2dom([
                "span.quiz-answer-id", choice.id + ". "
            ]));

            let contentRefs = {
                textSpan: <HTMLElement>undefined,
                figureDiv: <HTMLElement>undefined
            }
            refs.choiceLabel.appendChild(libD.jso2dom(
                [
                    "span", [
                        ["span", { "#": "textSpan" }],
                        ["div", { "#": "figureDiv" }]
                    ]
                ],
                contentRefs
            ));

            if (choice.html !== undefined) {
                FormatUtils.textFormat(choice.html, contentRefs.textSpan, true);
            } else {
                FormatUtils.textFormat(choice.text, contentRefs.textSpan, false);
            }

            if (choice.automaton !== undefined) {
                contentRefs.figureDiv.id = "question-automaton-designer";
                let choiceAutoDesigner = new AudeDesigner(contentRefs.figureDiv);
                choiceAutoDesigner.setAutomatonCode(automaton_code(choice.automaton));
                choiceAutoDesigner.autoCenterZoom();
            } else if (choice.regex !== undefined) {
                FormatUtils.textFormat(
                    FormatUtils.regexp2Latex(choice.regex),
                    contentRefs.figureDiv,
                    false
                );
            } else if (choice.grammar !== undefined) {
                let choiceGramDesigner = new GrammarDesigner(contentRefs.figureDiv, false);
                choiceGramDesigner.setGrammar(choice.grammar);
            }

            if (this.usersChoices !== undefined) {
                if (this.usersChoices.includes(choice.id)) {
                    choiceInput.checked = true;
                }
            }
        }
        answerInputDiv.appendChild(choiceList);
    }

    parseUsersAnswer(): boolean {
        if (this.choicesCheckboxes === undefined ||
            this.choicesCheckboxes.length === 0) {
            return true;
        }

        this.usersChoices = [];

        for (let cb of this.choicesCheckboxes) {
            if (cb.checked) {
                this.usersChoices.push(cb.value);
            }
        }
        return false;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        let symDiff = (new libD.Set(this.usersChoices)).symDiff(this.correctChoices);

        for (let e of symDiff) {
            if (!this.usersChoices.includes(e)) {
                return {
                    correct: false,
                    details: libD.format(
                        this._("You haven't selected correct answer {0}."),
                        e
                    )
                };
            } else if (!this.correctChoices.includes(e)) {
                return {
                    correct: false,
                    details: libD.format(
                        this._("Answer {0} isn't correct."),
                        e
                    )
                };
            }
        }
        return { correct: true, details: "" };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    toJSON(): any {

    }

    fromJSON(qObj: any): boolean {
        // Load instructions.
        if (qObj.instruction) {
            this.wordingText = qObj.instruction;
            this.isWordingHtml = false;
        } else if (qObj.instructionHTML) {
            this.wordingText = qObj.instructionHTML;
            this.isWordingHtml = true;
        }

        if (qObj.automatonQuestion) {
            this.wordingDetails.push(window.svg2automaton(qObj.automatonQuestion));
        }

        if (qObj.answers) {
            this.correctChoices = qObj.answers.slice();
        }

        if (qObj.possibilities) {
            let i = 1;
            for (let pObj of qObj.possibilities) {
                let newPoss: any = {
                    id: pObj.id || String(i),
                }

                if (pObj.text) {
                    newPoss.text = pObj.text;
                }

                if (pObj.html) {
                    newPoss.html = pObj.html;
                }

                if (pObj.automaton) {
                    newPoss.automaton = window.svg2automaton(pObj.automaton);
                }

                if (pObj.regex) {
                    newPoss.regex = pObj.regex;
                }

                if (pObj.grammar) {
                    newPoss.grammar = pObj.grammar;
                }

                this.wordingChoices.push(newPoss);
                i++;
            }
        }

        return true;
    }
}

/**
 * Class that handles any question that takes text (from an input field) for
 * an answer.
 */
class TextInputQuestion extends Question {
    /** Figures to be displayed in the wording. */
    wordingDetails: Array<Automaton | string | linearGrammar> = [];

    /** Array of correct answers, if the default answer checking is used. */
    correctAnswers: Array<string> = [];
    /** 
     * Function used to validate the user's answer.
     * By default, only checks if the user's answer is in ```correctAnswers```,
     * but can be overridden to create more complex questions.
     */

    usersAnswer: string;
    answerValidator: (q: TextInputQuestion) => { correct: boolean, details: string } =
        (q) => {
            if (!q.correctAnswers.includes(q.usersAnswer)) {
                return { correct: false, details: this._("Your answer isn't correct !") };
            }
            return { correct: true, details: "" };
        };

    /** Validator functions used for built-in question subtypes (list all reachable states, ...) */
    static readonly defaultValidators = {
        ReachableStates: (q: TextInputQuestion): { correct: boolean, details: string } => {
            let usersStateList = q.usersAnswer.split(",");
            let A = (q.wordingDetails[0] as Automaton);

            // We cast every state to string to allow comparison.
            let reachableStates = new libD.Set();
            for (let rs of AutomatonPrograms.reachableStates(A)) {
                reachableStates.add(String(rs));
            }

            let allStates = new libD.Set();
            for (let s of A.getStates()) {
                allStates.add(String(s));
            }

            let symDiff = reachableStates.symDiff(usersStateList);

            console.log(usersStateList);
            console.log(reachableStates);
            console.log(symDiff);

            for (let diff of symDiff) {
                if (!allStates.has(diff)) {
                    return {
                        correct: false,
                        details: libD.format(window.AudeGUI.l10n("The automaton doesn't have state {0}"), diff)
                    };
                }

                if (!usersStateList.includes(diff)) {
                    return {
                        correct: false,
                        details: libD.format(window.AudeGUI.l10n("State {0} is reachable."), diff)
                    }
                }

                if (!reachableStates.has(diff)) {
                    return {
                        correct: false,
                        details: libD.format(window.AudeGUI.l10n("State {0} isn't reachable."), diff)
                    }
                }
            }
            return { correct: true, details: "" };
        },
        CoreachableStates: (q: TextInputQuestion): { correct: boolean, details: string } => {
            let usersStateList = q.usersAnswer.split(",");
            let A = (q.wordingDetails[0] as Automaton);

            // We cast every state to string to allow comparison.
            let coreachableStates = new libD.Set();
            for (let rs of AutomatonPrograms.coreachableStates(A)) {
                coreachableStates.add(String(rs));
            }

            let allStates = new libD.Set();
            for (let s of A.getStates()) {
                allStates.add(String(s));
            }

            let symDiff = coreachableStates.symDiff(usersStateList);

            for (let diff of symDiff) {
                if (!allStates.has(diff)) {
                    return {
                        correct: false,
                        details: libD.format(window.AudeGUI.l10n("The automaton doesn't have state {0}"), diff)
                    };
                }

                if (!usersStateList.includes(diff)) {
                    return {
                        correct: false,
                        details: libD.format(window.AudeGUI.l10n("State {0} is coreachable."), diff)
                    }
                }

                if (!coreachableStates.has(diff)) {
                    return {
                        correct: false,
                        details: libD.format(window.AudeGUI.l10n("State {0} isn't coreachable."), diff)
                    }
                }
            }
            return { correct: true, details: "" };
        },
        EquivalentStateCouples: (q: TextInputQuestion): { correct: boolean, details: string } => {
            let couples = q.usersAnswer.split(",");
            let stateCouples = [];

            for (let couple of couples as Iterable<string>) {
                if (couple.length === 0) {
                    continue;
                }

                let coupleRegexp = /^[(]([^;]+)[;]([^;]+)[)]$/g;
                let match = coupleRegexp.exec(couple.trim());
                if (!match || match.length === 0) {
                    return {
                        correct: false,
                        details: libD.format(
                            window.AudeGUI.l10n("Formatting error : {0} isn't a valid couple."), couple
                        )
                    };
                }

                stateCouples.push([match[1].trim(), match[2].trim()]);
            }

            let equivalentStates = [];
            for (let couple of AutomatonPrograms.notDistinguableStates(q.wordingDetails[0] as Automaton) as Iterable<libD.Tuple>) {
                let coupleArray = couple.asCouple();
                // For comparison with user input, we have to cast the states to strings.
                equivalentStates.push([String(coupleArray[0]), String(coupleArray[1])]);
            }

            function areCouplesEqual(c1: Array<any>, c2: Array<any>) {
                return ((c1[0] === c2[0] && c1[1] === c2[1]) || (c1[0] === c2[1] && c1[1] === c2[0]));
            }

            for (let answerCouple of stateCouples) {
                let foundInEquiv = false;
                for (let equivCouple of equivalentStates) {
                    if (areCouplesEqual(answerCouple, equivCouple)) {
                        foundInEquiv = true;
                        break;
                    }
                }

                if (!foundInEquiv) {
                    return {
                        correct: false,
                        details: libD.format(
                            window.AudeGUI.l10n("States {0} and {1} aren't equivalent."),
                            answerCouple[0],
                            answerCouple[1]
                        )
                    }
                }
            }

            for (let equivCouple of equivalentStates) {
                let foundInAnswer = false;
                for (let answerCouple of stateCouples) {
                    if (areCouplesEqual(equivCouple, answerCouple)) {
                        foundInAnswer = true;
                        break;
                    }
                }

                if (!foundInAnswer) {
                    return {
                        correct: false,
                        details: libD.format(
                            window.AudeGUI.l10n("States {0} and {1} are equivalent, but you didn't list them as such."),
                            equivCouple[0],
                            equivCouple[1]
                        )
                    }
                }
            }

            return { correct: true, details: "" };
        },
        RecognizedWordAutomaton: (q: TextInputQuestion): { correct: boolean, details: string } => {
            let A = (q.wordingDetails[0] as Automaton);
            if (!A.acceptedWord(q.usersAnswer)) {
                return {
                    correct: false,
                    details: libD.format(
                        window.AudeGUI.l10n("Word '{0}' isn't recognized by the automaton."),
                        q.usersAnswer
                    )
                };
            }
            return { correct: true, details: "" };
        },
        RecognizedWordRegexp: (q: TextInputQuestion) => {
            let A = AutomatonPrograms.regexToAutomaton(q.wordingDetails[0] as string);
            if (!A.acceptedWord(q.usersAnswer)) {
                return {
                    correct: false,
                    details: libD.format(
                        window.AudeGUI.l10n("Word '{0}' isn't recognized by the regular expression."),
                        q.usersAnswer
                    )
                };
            }
            return { correct: true, details: "" };
        },
        RecognizedWordGrammar: (q: TextInputQuestion) => {
            let A = AutomatonPrograms.linearGrammar2Automaton(q.wordingDetails[0] as linearGrammar);
            if (!A.acceptedWord(q.usersAnswer)) {
                return {
                    correct: false,
                    details: libD.format(
                        window.AudeGUI.l10n("Word '{0}' isn't recognized by the linear grammar."),
                        q.usersAnswer
                    )
                };
            }
            return { correct: true, details: "" };
        }
    }

    inputPlaceholder: string = this._("Input your answer here");
    inputField: HTMLInputElement;


    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        if (this.wordingDetails.length === 0) {
            return;
        }

        let showDetailObject = (wd: Automaton | string | linearGrammar, element: HTMLElement, single?: boolean) => {
            if (wd instanceof Automaton) {
                let refs = {
                    divDesigner: <HTMLElement>null,
                    divInfo: <HTMLElement>null
                };

                element.appendChild(
                    libD.jso2dom(
                        [
                            ["div.question-other-info", [["span", this._("Alphabet : ")], ["div", { "#": "divInfo" }]]],
                            ["br"],
                            ["div" + (single ? "#question-automaton-designer" : ""), { "#": "divDesigner" }]
                        ],
                        refs
                    )
                );

                let designer = new AudeDesigner(refs.divDesigner, true);
                designer.setAutomatonCode(automaton_code(wd));
                designer.autoCenterZoom();

                window.AudeGUI.Quiz.textFormat(
                    FormatUtils.set2Latex(wd.getAlphabet()),
                    refs.divInfo
                );
            } else if (typeof wd === "string") {
                FormatUtils.textFormat(FormatUtils.regexp2Latex(wd), element, true);
            } else if (wd instanceof linearGrammar) {
                let wdGramDesigner = new GrammarDesigner(element, false);
                wdGramDesigner.setGrammar(wd);
            } else {
                window.AudeGUI.notify(this._("Error !"), this._("This question contains an error !"), "error");
            }
        }

        if (this.wordingDetails.length === 2) {
            let refs = {
                wdLeft: <HTMLElement>undefined,
                wdRight: <HTMLElement>undefined
            };
            wordingDetailsDiv.appendChild(libD.jso2dom(
                ["div#question-automaton-designer",
                    [
                        ["div#question-wording-details-left", { "#": "wdLeft" }],
                        ["div#question-wording-details-right", { "#": "wdRight" }]
                    ]
                ],
                refs
            ));

            for (let i = 0; i < 2; i++) {
                let wd = this.wordingDetails[i];
                let element = (i === 0 ? refs.wdLeft : refs.wdRight);

                showDetailObject(wd, element);
            }
        } else if (this.wordingDetails.length === 1) {
            showDetailObject(this.wordingDetails[0], wordingDetailsDiv, true);
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        this.inputField = <HTMLInputElement>libD.jso2dom(
            [
                "input#question-answers-input",
                {
                    "placeholder": this.inputPlaceholder,
                    "type": "text"
                }
            ]
        );
        answerInputDiv.appendChild(this.inputField);

        if (this.usersAnswer !== undefined) {
            this.inputField.value = this.usersAnswer;
        }
    }

    parseUsersAnswer(): boolean {
        if (this.inputField === undefined) {
            return true;
        }
        this.usersAnswer = this.inputField.value;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        if (this.usersAnswer === undefined) {
            return { correct: false, details: this._("No answer was given.") }
        }
        return this.answerValidator(this);
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    toJSON(): any {

    }

    fromJSON(qObj: any): boolean {
        return true;
    }
}