
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
    /** The objects for this question's wording. */
    wordingDetails: Array<Automaton | string | linearGrammar> = [];
    /** Point count for this question, for use in quizzes, mostly. */
    point: number = 0;

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

    /**
     * Displays formatted wording text and details in the given element.
     * @param questionDisplayDiv 
     */
    displayQuestionWording(questionDisplayDiv: HTMLElement): void {
        let refs = {
            divWordingText: <HTMLElement>undefined,
            divWordingDetails: <HTMLElement>undefined,
        }

        questionDisplayDiv.appendChild(libD.jso2dom([
            ["div#question-wording-text", { "#": "divWordingText" }, this._("Question :")],

            ["div#question-wording-details", { "#": "divWordingDetails" }]
        ], refs));

        // We display the wording text.
        FormatUtils.textFormat(this.wordingText, refs.divWordingText, this.isWordingHtml);

        // We display the additionnal info.
        this.displayWordingDetails(refs.divWordingDetails);
    }

    /*
     * Displays the full question wording : textual wording, additional info and inputs.
    */
    displayQuestion(questionDisplayDiv: HTMLElement): void {

        // Clearing the given div.
        questionDisplayDiv.innerHTML = "";

        console.log(questionDisplayDiv);

        // Populating the div.
        this.displayQuestionWording(questionDisplayDiv);

        let refs = {
            divUserInput: HTMLElement = null
        };

        let divUserInput = libD.jso2dom(
            ["div#answer-user-input", { "#": "divUserInput" }],
            refs
        );

        // We show the answer input UI.
        this.displayAnswerInputs(refs.divUserInput);
        questionDisplayDiv.appendChild(divUserInput);
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

    /**
     * Displays this question's wording details and additional information (automata, grammars, regexps, etc...)
     * in an HTML element.
     * @param wordingDetailsDiv - The HTML element to insert the wording details into (its content will be cleared !).
     */
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
            } else if (wd === undefined) {
                return;
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

    abstract specificToJSON(obj: any): void;

    /**
     * Converts the question to a object for JSON conversion.
     */
    toJSON(): any {
        let obj: any = {};

        // Serializing common elements.

        // "type" field
        switch (this.category) {
            case QuestionCategory.MCQ:
                obj.type = "mcq";
                break;

            case QuestionCategory.TextInput:
                obj.type = "textInput";
                break;

            case QuestionCategory.AutomatonEquivQuestion:
                obj.type = "automatonEquiv";
                break;
        }

        // "instruction" and "isInstructionHTML" fields
        obj.instruction = this.wordingText;
        obj.isInstructionHTML = this.isWordingHtml;

        // "wordingDetails" field
        obj.wordingDetails = [];
        for (let detail of this.wordingDetails) {
            // Skip empty details.
            if (detail === undefined || detail === null) {
                continue;
            }

            let detailObj = { aType: <string>undefined, content: <any>undefined };

            if (detail instanceof Automaton) {
                detailObj.aType = AutomatonDataType[AutomatonDataType.Automaton];
                detailObj.content = automaton2svg(detail, (svg) => { detailObj.content = svg; });
            } else if (typeof detail === "string") {
                detailObj.aType = AutomatonDataType[AutomatonDataType.Regexp];
                detailObj.content = detail;
            } else if (detail instanceof linearGrammar) {
                detailObj.aType = AutomatonDataType[AutomatonDataType.LinearGrammar];
                detailObj.content = detail.toString();
            }

            obj.wordingDetails.push(detailObj);
        }

        // Serializing specific elements.
        this.specificToJSON(obj);

        return obj;
    }

    abstract specificFromJSON(obj: any): void;

    /**
     * Initializes this question from a JSON object.
     * @param qObj - The object to extract the question info from. 
     */
    fromJSON(qObj: any): boolean {
        // Deserialize common elements.
        if (!qObj.type) {
            throw new Error(this._("Malformed question has no type."));
        }

        // "instruction", "isInstructionHTML" and "instructionHTML" (legacy)
        if (qObj.instruction) {
            this.wordingText = qObj.instruction;
            if (qObj.isInstructionHTML) {
                this.isWordingHtml = qObj.isInstructionHTML;
            }
        } else if (qObj.instructionHTML) {
            this.wordingText = qObj.instructionHTML;
            this.isWordingHtml = true;
        }

        // "wordingDetails"

        let getDetailFromObj = (detailObj: any): (Automaton | string | linearGrammar) => {
            if (!detailObj.aType) {
                throw new Error(this._("Malformed question. Wording detail has no type !"))
            }

            if (!detailObj.content) {
                throw new Error(this._("Malformed question. Wording detail has no content !"))
            }

            let type = AutomatonDataType[detailObj.aType as string];
            if (type === undefined) {
                throw new Error(this._("Malformed question. Unknown wording detail type !"))
            }

            switch (type) {
                case AutomatonDataType.Automaton: {
                    if (typeof detailObj.content === "string") {
                        return svg2automaton(detailObj.content);
                    } else {
                        return automatonFromObj(detailObj.content);
                    }
                    break;
                }

                case AutomatonDataType.Regexp: {
                    if (typeof detailObj.content === "string") {
                        return detailObj.content;
                    }
                    break;
                }

                case AutomatonDataType.LinearGrammar: {
                    if (typeof detailObj.content === "string") {
                        return string2LinearGrammar(detailObj.content);
                    }
                    break;
                }
            }
        };

        if (qObj.wordingDetails) {
            if (qObj.wordingDetails instanceof Array) {
                for (let detailObj of qObj.wordingDetails) {
                    this.wordingDetails.push(getDetailFromObj(detailObj));
                }
            } else {
                this.wordingDetails.push(getDetailFromObj(qObj.wordingDetails));
            }
        }



        // "Legacy" support for automaton wording detail.
        if (qObj.automatonQuestion) {
            this.wordingDetails.push(window.svg2automaton(qObj.automatonQuestion));
        }

        // Deserialize specific elements. 
        this.specificFromJSON(qObj);

        return true;
    }

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
                return this._("Convert the following left linear grammar to an equivalent right linear grammar.");

            default:
                return "";
        }
    }
}

/**
* Enumeration of possible types of input/output formats for a "regular language specification".
* That is, a structure that describes a regular language.
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

    usersAnswerType: AutomatonDataType = AutomatonDataType.Automaton;
    usersAnswerAutomaton: Automaton = undefined;
    /** The "raw" version of the user's input, that is, it is not converted to an automaton. */
    usersAnswerRaw: Automaton | string | linearGrammar = undefined;

    /** Correct answer against which the user's answer will be checked. */
    correctAnswerAutomaton: Automaton = undefined;
    correctAnswerRegexp: string = undefined;
    correctAnswerGrammar: linearGrammar = undefined;

    // Constraint functions to add additional constraints to user's answer
    // (minimal, complete, grammar is left linear, ...)
    automatonAnswerConstraintsAudescript: Array<string> = [];
    automatonAnswerConstraints: Array<(a: Automaton, q: AutomatonEquivQuestion) => { correct: boolean, details: string }> = [];
    regexpAnswerConstraintsAudescript: Array<string> = [];
    regexpAnswerConstraints: Array<(re: string, q: AutomatonEquivQuestion) => { correct: boolean, details: string }> = [];
    grammarAnswerConstraintsAudescript: Array<string> = [];
    grammarAnswerConstraints: Array<(g: linearGrammar, q: AutomatonEquivQuestion) => { correct: boolean, details: string }> = [];

    answerInput: AudeDesigner | HTMLInputElement | GrammarDesigner = undefined;

    constructor(qSubtype?: QuestionSubType) {
        super((qSubtype === undefined) ? QuestionSubType.CustomAutomatonEquiv : qSubtype);
        this.category = QuestionCategory.AutomatonEquivQuestion;

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

        if (this.correctAnswerAutomaton !== undefined) {
            if (!AutomatonPrograms.automataAreEquivalent(this.usersAnswerAutomaton, this.correctAnswerAutomaton)) {
                return {
                    correct: false,
                    details: this._("Your answer doesn't recognize the right language !")
                };
            }
        }

        switch (this.usersAnswerType) {
            case AutomatonDataType.Automaton: {
                if (this.usersAnswerRaw instanceof Automaton) {
                    for (let checkFun of this.automatonAnswerConstraints) {
                        let checkResult = checkFun(this.usersAnswerRaw, this);
                        if (!checkResult.correct) {
                            return checkResult;
                        }
                    }
                }
                break;
            }

            case AutomatonDataType.Regexp: {
                if (typeof this.usersAnswerRaw === "string") {
                    for (let checkFun of this.regexpAnswerConstraints) {
                        let checkResult = checkFun(this.usersAnswerRaw, this);
                        if (!checkResult.correct) {
                            return checkResult;
                        }
                    }
                }
                break;
            }

            case AutomatonDataType.LinearGrammar: {
                if (this.usersAnswerRaw instanceof linearGrammar) {
                    for (let checkFun of this.grammarAnswerConstraints) {
                        let checkResult = checkFun(this.usersAnswerRaw, this);
                        if (!checkResult.correct) {
                            return checkResult;
                        }
                    }
                }
            }
        }

        return { correct: true, details: "" };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    setReferenceAnswer(answer: Automaton | string | linearGrammar) {
        if (answer instanceof Automaton) {
            this.correctAnswerAutomaton = answer.copy();
        } else if (answer instanceof linearGrammar) {
            this.correctAnswerGrammar = answer;
            this.correctAnswerAutomaton = AutomatonPrograms.linearGrammar2Automaton(this.correctAnswerGrammar);
        } else if (typeof answer === "string") {
            this.correctAnswerRegexp = answer;
            this.correctAnswerAutomaton = AutomatonPrograms.regexToAutomaton(this.correctAnswerRegexp);
        }
    }

    specificToJSON(obj: any): void {
        obj.usersAnswerType = AutomatonDataType[this.usersAnswerType];

        if (this.correctAnswerGrammar !== undefined) {
            obj.correctAnswerGrammar = this.correctAnswerGrammar.toString();
        } else if (this.correctAnswerRegexp !== undefined) {
            obj.correctAnswerRegexp = this.correctAnswerRegexp;
        } else if (this.correctAnswerAutomaton !== undefined) {
            automaton2svg(this.correctAnswerAutomaton, (svg) => { obj.automatonAnswer = svg; });
        }

        if (this.automatonAnswerConstraintsAudescript.length !== 0) {
            obj.automatonAnswerConstraintsAudescript = this.automatonAnswerConstraintsAudescript.slice();
        }

        if (this.regexpAnswerConstraintsAudescript.length !== 0) {
            obj.regexpAnswerConstraintsAudescript = this.regexpAnswerConstraintsAudescript.slice();
        }

        if (this.grammarAnswerConstraintsAudescript.length !== 0) {
            obj.grammarAnswerConstraintsAudescript = this.grammarAnswerConstraintsAudescript.slice();
        }
    }

    specificFromJSON(qObj: any): boolean {
        // usersAnswerType
        if (qObj.usersAnswerType) {
            this.usersAnswerType = AutomatonDataType[qObj.usersAnswerType as string];
        } else {
            // LEGACY Set user's answer type according to type.
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
        }

        // LEGACY Automaton answer
        if (qObj.automatonAnswer) {
            if (typeof qObj.automatonAnswer === "string") {
                this.correctAnswerAutomaton = window.svg2automaton(qObj.automatonAnswer);
            } else {
                this.correctAnswerAutomaton = window.automatonFromObj(qObj.automatonAnswer);
            }
        } else if (qObj.correctAnswerAutomaton) {
            if (typeof qObj.correctAnswerAutomaton === "string") {
                this.correctAnswerAutomaton = window.svg2automaton(qObj.correctAnswerAutomaton);
            } else {
                this.correctAnswerAutomaton = window.automatonFromObj(qObj.correctAnswerAutomaton);
            }
        } else if (qObj.correctAnswerRegexp) {
            this.correctAnswerAutomaton = AutomatonPrograms.regexToAutomaton(qObj.correctAnswerRegexp);
            this.correctAnswerRegexp = qObj.correctAnswerRegexp;
        } else if (qObj.correctAnswerGrammar) {
            this.correctAnswerAutomaton = AutomatonPrograms.linearGrammar2Automaton(string2LinearGrammar(qObj.correctAnswerGrammar));
            this.correctAnswerGrammar = string2LinearGrammar(qObj.correctAnswerGrammar);
        }

        // Load audescript code.
        if (qObj.automatonAnswerConstraintsAudescript && qObj.automatonAnswerConstraintsAudescript instanceof Array) {
            for (let cnstr of qObj.automatonAnswerConstraintsAudescript) {
                this.automatonAnswerConstraints.push(
                    eval(
                        "(a, q) => { " + audescript.toJS(cnstr).code + "}"
                    )
                );
                this.automatonAnswerConstraintsAudescript.push(cnstr);
            }
        }

        if (qObj.regexpAnswerConstraintsAudescript && qObj.regexpAnswerConstraintsAudescript instanceof Array) {
            for (let cnstr of qObj.regexpAnswerConstraintsAudescript) {
                this.regexpAnswerConstraints.push(
                    eval(
                        "(re, q) => {" + audescript.toJS(cnstr).code + "}"
                    )
                );
                this.regexpAnswerConstraintsAudescript.push(cnstr);
            }
        }

        if (qObj.grammarAnswerConstraintsAudescript && qObj.grammarAnswerConstraintsAudescript instanceof Array) {
            for (let cnstr of qObj.grammarAnswerConstraintsAudescript) {
                this.grammarAnswerConstraints.push(
                    eval(
                        "(g, q) => {" + audescript.toJS(cnstr).code + "}"
                    )
                );
                this.grammarAnswerConstraintsAudescript.push(cnstr);
            }
        }

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
    /** If true, only one answer will be selectable (radio buttons will be shown) */
    singleChoice: boolean = false;

    /** Array of the IDs of the choices the user has selected. */
    usersChoices: Array<string> = undefined;
    /** 
     * Array of the DOM Checkboxes/Radio buttons for the questions.
     * The ID corresponding to a checkbox will be in their ```value``` attribute. 
     */
    choicesCheckboxes: Array<HTMLInputElement> = [];

    constructor(qSubtype?: QuestionSubType) {
        super((qSubtype === undefined) ? QuestionSubType.MCQ : qSubtype);
        this.category = QuestionCategory.MCQ;
    }

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
        this.wordingChoices = [];
        this.correctChoices = [];
        for (let wc of wordingChoices) {
            this.addWordingChoice(wc);
        }

        this.singleChoice = singleChoice;
    }

    addWordingChoice(wordingChoice: {
        id?: string,
        text?: string,
        html?: string,
        automaton?: Automaton,
        regex?: string,
        grammar?: linearGrammar,
        correct?: boolean
    }) {
        let id = (wordingChoice.id === undefined ? String(this.wordingChoices.length) : wordingChoice.id);
        this.wordingChoices.push({
            id: id,
            text: wordingChoice.text,
            html: wordingChoice.html,
            automaton: wordingChoice.automaton,
            regex: wordingChoice.regex,
            grammar: wordingChoice.grammar
        });

        if (wordingChoice.correct) {
            this.correctChoices.push(id);
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

    specificToJSON(obj: any): void {
        obj.possibilities = [];
        for (let choice of this.wordingChoices) {
            let objChoice: any = {};
            objChoice.id = choice.id;
            objChoice.text = choice.text;
            objChoice.html = choice.html;

            if (choice.automaton) {
                automaton2svg(choice.automaton, (svg) => objChoice.automaton = svg);
            }

            if (choice.regex) {
                objChoice.regex = choice.regex;
            }

            if (choice.grammar) {
                objChoice.grammar = choice.grammar.toString();
            }

            obj.possibilities.push(objChoice);
        }

        obj.answers = this.correctChoices.slice();
        obj.singleChoice = this.singleChoice;
    }

    specificFromJSON(qObj: any): boolean {
        if (qObj.singleChoice) {
            this.singleChoice = qObj.singleChoice;
        }

        if (qObj.answers) {
            this.correctChoices = qObj.answers.slice();
        }

        if (qObj.possibilities) {
            let i = 0;
            for (let pObj of qObj.possibilities) {
                let newPoss: any = {
                    id: pObj.id || String.fromCharCode("a".charCodeAt(0) + i)
                }

                if (pObj.text) {
                    newPoss.text = pObj.text;
                }

                if (pObj.html) {
                    newPoss.html = pObj.html;
                }

                if (pObj.automaton) {
                    if (typeof pObj.automaton === "string") {
                        newPoss.automaton = window.svg2automaton(pObj.automaton);
                    } else {
                        newPoss.automaton = window.automatonFromObj(pObj.automaton);
                    }
                }

                if (pObj.regex) {
                    newPoss.regex = pObj.regex;
                }

                if (pObj.grammar) {
                    newPoss.grammar = string2LinearGrammar(pObj.grammar);
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
    /** Array of correct answers, if the default answer checking is used. */
    correctAnswers: Array<string> = [];
    /** 
     * Function used to validate the user's answer.
     * By default, only checks if the user's answer is in ```correctAnswers```,
     * but can be overridden to create more complex questions.
     */

    usersAnswer: string;

    /**
     * The AudeScript code for the current validator.
     * Used for custom questions.
     */
    answerValidatorAS: string;
    /**
     * The current answer validator.
     * By default, it just checks whether the answer 
     * is in the correctAnswers array.
     * @see TextInputQuestion#correctAnswers
     */
    answerValidator: (q: TextInputQuestion) => { correct: boolean, details: string } = TextInputQuestion.wordlistValidator;
        
    static readonly wordlistValidator = (q) => {
        if (!q.correctAnswers.includes(q.usersAnswer)) {
            return { correct: false, details: AudeGUI.l10n("Your answer isn't correct !") };
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

    constructor(qSubtype?: QuestionSubType) {
        super((qSubtype === undefined) ? QuestionSubType.CustomTextInput : qSubtype);
        this.category = QuestionCategory.TextInput;
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

        if (!this.answerValidator || !this.answerValidatorAS) {
            this.answerValidator = TextInputQuestion.wordlistValidator;
            this.answerValidatorAS = undefined;
        }

        let validatorReturn = this.answerValidator(this);
        // We check the integrity of the validator's return value.
        if (!validatorReturn || validatorReturn.correct === undefined) {
            window.AudeGUI.notify(
                this._("Quiz Format Error"),
                this._("This question's validator didn't return a correct value !"),
                "error",
                4000
            );
            return { correct: false, details: this._("This question's validator doesn't give a correct value !") }
        }
        return validatorReturn;
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    specificToJSON(obj: any): void {
        obj.correctAnswers = this.correctAnswers.slice();
        if (this.answerValidatorAS) {
            obj.answerValidatorAS = this.answerValidatorAS;
        }
        obj.inputPlaceholder = this.inputPlaceholder;
    }

    specificFromJSON(qObj: any): boolean {
        if (qObj.answerValidatorAS) {
            this.answerValidator = eval("(q) => { " + audescript.toJS(qObj.answerValidatorAS).code + " } ");
            this.answerValidatorAS = qObj.answerValidatorAS;
        } else if (qObj.correctAnswers && qObj.correctAnswers instanceof Array) {
            this.correctAnswers = qObj.correctAnswers.slice();
        }

        if (qObj.inputPlaceholder) {
            this.inputPlaceholder = qObj.inputPlaceholder;
        }

        return true;
    }
}