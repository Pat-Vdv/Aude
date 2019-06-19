
/** Enumeration of all existing question subtypes. */
enum QuestionSubType {
    Complement,
    Complete,
    Product,
    Minimize,
    EquivalentStates,
    EquivalentAutomata,
    Automaton2Table,
    Table2Automaton,
    Reachable,
    Coreachable,
    Word,
    WordNonDet,
    WordEpsilon,
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
    QuizStateList,
    QuizAutomaton,
}

/** Enumeration of all categories of questions. 
*  Each category should correspond to a subclass of Question.
*/
enum QuestionCategory {
    AutomatonTransformation,
    GrammarTransformation,
    Automaton_Table_Conversion, // TODO Implement subclass
    MCQ,
    Automaton_Regexp_Conversion,
    Automaton_Grammar_Conversion,
    RecognizedWord,
    NaturalLanguage_Automaton,
    AutomatonStatesList
}

/**
* Formats a regular expression to a LaTeX string.
*/
function regexp2Latex(regexp: string): string {
    let latex = "$$";

    latex += regexp.replace(/\*/g, "^*");

    return latex + "$$";
}

/**
 * @abstract
 * Abstract Question type from which all question variants must inherit.
 */
abstract class Question {
    _ = window.AudeGUI.l10n;

    // For the creation of the automaton
    static createAutomatonCoreachable:
        (nbStates: number,
            alphabet: Iterable<any>,
            nbAcceptingStates: number,
            typeAutomaton: number,
            nbTransitions: number | string) => Automaton = null;

    static createAutomaton:
        (nbStates: number,
            alphabet: Iterable<any>,
            nbAcceptingStates: number,
            typeAutomaton: number,
            nbTransitions: number | string) => Automaton = null;

    // Function references for operations on automata, needed for automatic correction.
    static complete: (a: Automaton) => Automaton = null;
    static isCompleted: (a: Automaton) => boolean = null;
    static automataAreEquivalent: (a1: Automaton, a2: Automaton) => boolean = null;
    static product: (a1: Automaton, a2: Automaton) => Automaton = null;
    static minimize: (a: Automaton) => Automaton = null;
    static isMinimized: (a: Automaton) => boolean = null;
    static complement: (a: Automaton) => Automaton = null;
    static distinguableStates = null;
    static notDistinguableStates: (a: Automaton) => libD.Set;
    static coreachableStates: (a: Automaton) => libD.Set = null;
    static reachableStates: (a: Automaton) => libD.Set = null;
    static automaton2HTMLTable = null;
    static createTable = null;
    static HTMLTable2automaton = null;
    static smallerWord = null;

    /*Chapter 2*/
    static determinize: (a: Automaton) => Automaton = null;
    static isDeterminized: (a: Automaton) => boolean = null;

    /*Chapter 3*/
    static epsElim: (a: Automaton) => Automaton = null;
    static hasEpsilonTransitions: (a: Automaton) => boolean = null;

    /*Chapter 4*/
    static regexToAutomaton = null;
    static automatonToRegex = null;

    /*Chapter 5*/
    static leftLinear2RightLinearGrammar = null;
    static rightLinear2LeftLinearGrammar = null;
    static linearGrammar2Automaton: (g: linearGrammar | string) => Automaton = null;
    static automaton2RightLinearGrammar = null;
    static isLeftLinear = null;

    /**
     * Loads automata-related algorithms (minimization, completion, etc...) from audescript.
     */
    static loadPrograms(): void {
        window.AudeGUI.Runtime.loadIncludes([
            "completion", "equivalence", "product", "minimization",
            "complementation", "distinguishability", "coreachability",
            "reachability", "automaton2htmltable", "htmltable2automaton",
            "createAutomaton", "smallerWord", "determinization",
            "epsElimination", "regex2automaton", "automaton2regex",
            "automaton2RightLinearGrammar", "linearGrammar2Automaton",
            "leftLinear2RightLinearGrammar", "rightLinear2LeftLinearGrammar"
        ], () => {
            Question.createAutomatonCoreachable = audescript.m("createAutomaton").createAutomatonCoreachable;
            Question.createAutomaton = audescript.m("createAutomaton").createAutomaton;
            Question.complete = audescript.m("completion").complete;
            Question.isCompleted = audescript.m("completion").isCompleted;
            Question.automataAreEquivalent = audescript.m("equivalence").automataAreEquivalent;
            Question.product = audescript.m("product").product;
            Question.minimize = audescript.m("minimization").minimize;
            Question.isMinimized = audescript.m("minimization").isMinimized;
            Question.complement = audescript.m("complementation").complement;
            Question.distinguableStates = audescript.m("distinguishability").distinguableStates;
            Question.notDistinguableStates = audescript.m("distinguishability").notDistinguableStates;
            Question.coreachableStates = audescript.m("coreachability").coreachableStates;
            Question.reachableStates = audescript.m("reachability").reachableStates;
            Question.automaton2HTMLTable = audescript.m("automaton2htmltable").automaton2HTMLTable;
            Question.createTable = audescript.m("htmltable2automaton").createTable;
            Question.HTMLTable2automaton = audescript.m("htmltable2automaton").HTMLTable2automaton;
            Question.determinize = audescript.m("determinization").determinize;
            Question.isDeterminized = audescript.m("determinization").isDeterminized;
            Question.smallerWord = audescript.m("smallerWord").smallerWord;
            Question.epsElim = audescript.m("epsElimination").epsElim;
            Question.hasEpsilonTransitions = audescript.m("epsElimination").hasEpsilonTransitions
            Question.regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
            Question.automatonToRegex = audescript.m("automaton2regex").automatonToRegex;
            Question.leftLinear2RightLinearGrammar = audescript.m("leftLinear2RightLinearGrammar").leftLinear2RightLinearGrammar;
            Question.rightLinear2LeftLinearGrammar = audescript.m("rightLinear2LeftLinearGrammar").rightLinear2LeftLinearGrammar;
            Question.linearGrammar2Automaton = audescript.m("linearGrammar2Automaton").linearGrammar2Automaton;
            Question.automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
            Question.isLeftLinear = audescript.m("leftLinear2RightLinearGrammar").isLeftLinear;
        });
    }

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
                return QuestionCategory.AutomatonTransformation;

            case QuestionSubType.EquivalentStates:
            case QuestionSubType.Reachable:
            case QuestionSubType.Coreachable:
                return QuestionCategory.AutomatonStatesList;

            case QuestionSubType.Automaton2Table:
            case QuestionSubType.Table2Automaton:
                return QuestionCategory.Automaton_Table_Conversion;

            case QuestionSubType.Word:
            case QuestionSubType.WordNonDet:
            case QuestionSubType.WordEpsilon:
                return QuestionCategory.RecognizedWord;

            case QuestionSubType.Automaton2Regexp:
            case QuestionSubType.Regexp2Automaton:
                return QuestionCategory.Automaton_Regexp_Conversion;

            case QuestionSubType.Automaton2Grammar:
            case QuestionSubType.Grammar2Automaton:
                return QuestionCategory.Automaton_Grammar_Conversion;

            case QuestionSubType.LeftGrammar2RightGrammar:
                return QuestionCategory.GrammarTransformation;

            case QuestionSubType.RecognizeLanguageAutomaton:
            case QuestionSubType.RecognizeLanguageRE:
                return QuestionCategory.NaturalLanguage_Automaton;
        }
    }

    subtype: QuestionSubType; // Precise subtype of the question.
    wordingText: string; // The general textual description of the question.

    constructor(subtype: QuestionSubType, wordingText?: string) {
        this.subtype = subtype;
        if (wordingText) {
            this.wordingText = wordingText;
        } else {
            this.wordingText = this.createWording();
        }
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
        window.AudeGUI.Quiz.textFormat(this.wordingText, refs.divWordingText);

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
     * @returns An object containing a boolean ```correct``` that is true if the answer was right,
     * and a string ```details``` detailing the mistake if ```correct``` is false.
     */
    abstract checkUsersAnswer(): { correct: boolean, details: string };

    /**
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
     * Initializes this question's wording completely at random (with some constraints set by the subtype).
     */
    abstract generateRandomly();

    /**
     * Initializes this question's wording from a random file.
     */
    abstract generateFromFile();

    /**
     * Generates wording for this question automatically, based on its subtype.
     */
    createWording(): string {
        if (QuestionSubType[this.subtype].startsWith("MCQ")) {
            return this._("Which of the following assertions are true ?");
        }

        switch (this.subtype) {
            case QuestionSubType.Complement:
                return this._("Create the complementary automaton of the following automaton");

            case QuestionSubType.Complete:
                return this._("Give a complete automaton that recognizes the same language as the following :");

            case QuestionSubType.Product:
                return this._("Compute the product of the following automata :");

            case QuestionSubType.Minimize:
                return this._("Minimize the following automaton :");

            case QuestionSubType.EquivalentStates:
                return this._("Give the equivalent states of the following automaton :");

            case QuestionSubType.EquivalentAutomata:
                return this._("Are the following automatons equivalent ?");

            case QuestionSubType.Automaton2Table:
                return this._("Fill the table corresponding to the automaton ");

            case QuestionSubType.Table2Automaton:
                return this._("Create the automaton corresponding to the table ");

            case QuestionSubType.Reachable:
                return this._("Give the reachable states of the following automaton");

            case QuestionSubType.Coreachable:
                return this._("Give the co-reachable states of the following automaton");

            case QuestionSubType.Word:
                return this._("Give a word recognized by the following automaton");

            case QuestionSubType.Determinize:
                return this._("Create the determinized automaton of the following automaton");

            case QuestionSubType.Determinize_Minimize:
                return this._("Create the determinized and minimize automaton of the following automaton");

            case QuestionSubType.EliminateEpsilon:
                return this._("Eliminate the ε-transitions of the following automaton");

            case QuestionSubType.Determinize_EliminateEpsilon:
                return this._("Eliminate the ε-transitions and determinize the following automaton");

            case QuestionSubType.Automaton2Regexp:
                return this._("Write the regular expression corresponding to the following automaton");

            case QuestionSubType.Regexp2Automaton:
                return this._("Give the automaton corresponding to the following RE");

            case QuestionSubType.Grammar2Automaton:
                return this._("Give the automaton corresponding to the following right linear grammar");

            case QuestionSubType.Automaton2Grammar:
                return this._("Give the linear grammar corresponding to the following automaton");

            case QuestionSubType.LeftGrammar2RightGrammar:
                return this._("Give the right linear grammar corresponding to the following left linear grammar");

            default:
                return "";
        }
    }
}

/**
* A class to represent a question whose wording details and answer are automata.
* (Minimization, product, ...)
*/
class AutomatonTransformQuestion extends Question {
    /** Automata array storing all the automata needed for the wording details. */
    wordingAutomata: Array<Automaton> = new Array();
    /** The number of automata needed in the wording */
    automataInWording: number;
    /** Automata designer in which the user inputs his answer */
    answerDesigner: AudeDesigner = undefined;
    /** The user's answer if it has been parsed. */
    usersAnswer: Automaton = undefined;

    constructor(subtype: QuestionSubType) {
        super(subtype);

        if (subtype === QuestionSubType.Product) {
            this.automataInWording = 2;
        } else {
            this.automataInWording = 1;
        }
    }

    parseUsersAnswer(): boolean {
        if (this.answerDesigner === undefined) {
            return true;
        }
        this.usersAnswer = this.answerDesigner.getAutomaton(0);
        return false;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        if (!this.usersAnswer) {
            return { correct: false, details: this._("Answer wasn't given !") };
        }

        let correct: boolean = false;
        let details: string = "";

        switch (this.subtype) {
            case QuestionSubType.Complement:
                correct = Question.automataAreEquivalent(
                    this.usersAnswer,
                    Question.complement(this.wordingAutomata[0])
                );

                if (!correct) {
                    details = this._("Your answer isn't the complement of the given automaton !");
                }
                break;

            case QuestionSubType.Complete:
                correct = Question.automataAreEquivalent(this.usersAnswer, this.wordingAutomata[0]);
                if (!correct) {
                    details = this._("Your answer isn't equivalent to the given automaton !");
                    break;
                }

                correct = Question.isCompleted(this.usersAnswer);
                if (!correct) {
                    details = this._("Your answer isn't complete !");
                }
                break;

            case QuestionSubType.Product:
                correct = Question.automataAreEquivalent(
                    this.usersAnswer,
                    Question.product(this.wordingAutomata[0], this.wordingAutomata[1])
                );
                if (!correct) {
                    details = "Your answer isn't the product of the two given automata !";
                }
                break;

            case QuestionSubType.Minimize:
                correct = Question.automataAreEquivalent(this.usersAnswer, this.wordingAutomata[0]);
                if (!correct) {
                    details = this._("Your answer isn't equivalent to the given automaton !");
                    break;
                }

                correct = Question.isMinimized(this.usersAnswer);
                if (!correct) {
                    details = this._("Your answer isn't minimal !");
                }
                break;

            case QuestionSubType.Determinize:
            case QuestionSubType.Determinize_Minimize:
            case QuestionSubType.Determinize_EliminateEpsilon:
                correct = Question.automataAreEquivalent(this.usersAnswer, this.wordingAutomata[0]);
                if (!correct) {
                    details = this._("Your answer isn't equivalent to the given automaton !");
                    break;
                }

                correct = Question.isDeterminized(this.usersAnswer);
                if (!correct) {
                    details = this._("Your answer isn't deterministic !");
                    break;
                }

                if (this.subtype === QuestionSubType.Determinize_Minimize) {
                    correct = Question.isMinimized(this.usersAnswer);
                    if (!correct) {
                        details = this._("Your answer isn't minimal !");
                    }
                } else if (this.subtype === QuestionSubType.Determinize_EliminateEpsilon) {
                    correct = Question.hasEpsilonTransitions(this.usersAnswer);
                    if (!correct) {
                        details = this._("Your answer still contains epsilon transitions !");
                    }
                }
                break;

            case QuestionSubType.EliminateEpsilon:
                correct = Question.automataAreEquivalent(this.usersAnswer, this.wordingAutomata[0]);
                if (!correct) {
                    details = this._("Your answer isn't equivalent to the given automaton !");
                    break;
                }

                correct = Question.hasEpsilonTransitions(this.usersAnswer);
                if (!correct) {
                    details = this._("Your answer still contains epsilon transitions !");
                }
                break;

            default:
                correct = false;
                details = "This is an error. It shouldn't happen."
                break;
        }
        return { correct: correct, details: details };
    }

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        wordingDetailsDiv.innerHTML = "";
        if (this.automataInWording != this.wordingAutomata.length) {
            this.generateRandomly();
        }

        // If wording only has a single automaton, show it in the middle.
        if (this.automataInWording === 1) {
            let refs = { divDesigner: <HTMLElement>null };
            wordingDetailsDiv.appendChild(
                libD.jso2dom(["div#question-automaton-designer", { "#": "divDesigner" }],
                    refs));

            let designer = new AudeDesigner(refs.divDesigner, true);
            designer.setAutomatonCode(automaton_code(this.wordingAutomata[0]));
            designer.autoCenterZoom();
        } else if (this.automataInWording === 2) {
            // Otherwise, if wording has 2 automata, show them side by side.
            let refs = { divDesignerLeft: <HTMLElement>null, divDesignerRight: <HTMLElement>null };
            wordingDetailsDiv.appendChild(
                libD.jso2dom([
                    ["div#question-automaton-designer", [
                        ["div#question-automata-designer-left", { "#": "divDesignerLeft" }],
                        ["div#question-automata-designer-right", { "#": "divDesignerRight" }]
                    ]
                    ]
                ], refs)
            );

            let designerLeft = new AudeDesigner(refs.divDesignerLeft, true);
            designerLeft.setAutomatonCode(automaton_code(this.wordingAutomata[0]));
            designerLeft.autoCenterZoom();

            let designerRight = new AudeDesigner(refs.divDesignerRight, true);
            designerRight.setAutomatonCode(automaton_code(this.wordingAutomata[1]));
            designerRight.autoCenterZoom();
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        // We clear the given <div>
        answerInputDiv.innerHTML = "";

        let refs = { automatonAnswerDiv: <HTMLElement>null };
        answerInputDiv.appendChild(libD.jso2dom([
            "div#question-answers-automaton",
            { "#": "automatonAnswerDiv" },
            this._("You can draw your automaton below.")],
            refs));

        this.answerDesigner = new AudeDesigner(refs.automatonAnswerDiv, false);
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        let ag = new AutomatonGenerator();
        for (let i = 0; i < this.automataInWording; i++) {
            console.time("timer" + String(i + 1));
            this.wordingAutomata[i] = ag.generateAutomaton();
            console.timeEnd("timer" + String(i + 1));
        }
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }
}

/** 
* A class to handle MCQ-type questions.
*/
class MCQQuestion extends Question {
    /** Every choice's text. */
    wordingChoices = new Array<string>();
    /** HTML DOM Elements for every choice's checkbox/ radio button. */
    choicesCheckboxes = new Array<HTMLInputElement>();

    /** Indices of the correct choices from wordingChoices. */
    correctChoices = new Array<number>();
    /** Indices of the user's choices from wordingChoices. */
    usersChoices = new Array<number>();
    /** Automaton for the wording, if needed. */
    wordingAutomaton: Automaton = undefined;

    /** 
     * Whether only a single choice should be availible to the user.
     * If true, radio buttons are displayed instead of checkboxes.
     */
    singleChoice: boolean;

    /**
     * Creates a new MCQ Question object.
     * @param subtype - The subtype of this question (usually MCQ here).
     * @param wordingChoices - For every choice, its wording and whether it is correct.
     * @param singleChoice - If true, only a single choice will be availible to the user.
     */
    constructor(subtype: QuestionSubType,
        wordingChoices: Iterable<{ text: string, correct?: boolean }> = [],
        singleChoice: boolean = false,
        wordingAutomaton?: Automaton) {
        super(subtype);

        for (let choice of wordingChoices) {
            this.addWordingChoice(choice.text, choice.correct);
        }
        this.singleChoice = singleChoice;
        this.wordingAutomaton = wordingAutomaton;
    }

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        if (this.wordingAutomaton !== undefined) {
            let designerDiv = libD.jso2dom(["div#question-automaton-designer"]);
            let wordingDesigner = new AudeDesigner(designerDiv, true);
            wordingDesigner.setAutomatonCode(automaton_code(this.wordingAutomaton));
            wordingDesigner.autoCenterZoom();
            wordingDetailsDiv.appendChild(designerDiv);
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        // We create an unordered list to put the checkboxes into.
        let refs = { checkBoxList: <HTMLUListElement>null };
        answerInputDiv.appendChild(
            libD.jso2dom(
                ["div#question-answers-checkbox",
                    ["ul", { "#": "checkBoxList" }]
                ],
                refs
            )
        );

        // We create every checkbox/radio button
        // and place them into choicesCheckboxes (to fetch their state later).
        for (let i = 0; i < this.wordingChoices.length; i++) {
            let choice = this.wordingChoices[i];

            let ref_cb = {
                choiceCheckbox: <HTMLInputElement>null
            };

            refs.checkBoxList.appendChild(
                libD.jso2dom(["li", ["label", [
                    ["input", {
                        "#": "choiceCheckbox",
                        "type": (this.singleChoice ? "radio" : "checkbox"),
                        "name": "mcq-question",
                        "value": String(i)
                    }],
                    ["span", this._("#") + (i + 1) + " - " + this.wordingChoices[i]]
                ]
                ]], ref_cb)
            );

            this.choicesCheckboxes.push(ref_cb.choiceCheckbox);
        }
    }

    parseUsersAnswer(): boolean {
        this.usersChoices = [];
        for (let check of this.choicesCheckboxes) {
            if (check.checked) {
                let choiceNumber = parseInt(check.value);
                if (isNaN(choiceNumber)) {
                    return true;
                }
                this.usersChoices.push(choiceNumber);
            }
        }
        return false;
    }

    checkUsersAnswer(): { correct: boolean, details: string } {
        let correct: boolean = true;
        let details: string = "";

        // Check if user's choices are a subset of the right choices.
        for (let uChoice of this.usersChoices) {
            if (!this.correctChoices.includes(uChoice)) {
                correct = false;
                details = this._("Answer #" + (uChoice + 1) + " isn't correct !");
                break;
            }
        }

        // Check if the right choices are a subset of the user's choices.
        for (let cChoice of this.correctChoices) {
            if (!this.usersChoices.includes(cChoice)) {
                correct = false;
                details = this._("You haven't checked answer #" + (cChoice + 1) + ", although it is correct.");
                break;
            }
        }

        return { correct: correct, details: details };
    }


    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }

    addWordingChoice(choice: string, correct: boolean = false): void {
        this.wordingChoices.push(choice);
        if (correct) {
            this.correctChoices.push(this.wordingChoices.length - 1);
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
* Class to handle questions that ask a word recognized by a given 
* automaton, regular expression or grammar.
*/
class RecognizedWordQuestion extends Question {
    /** The automaton corresponding to the answer.
     *  Used for correcting the question. 
     */
    correctAnswerAutomaton: Automaton = null;

    wordingGrammar: linearGrammar = null;
    wordingRegexp: string = null;
    /**
     * Whether this question shows an automaton, regexp or grammar as wording.
     * By default, it's an automaton.
     */
    wordingType = AutomatonDataType.Automaton;

    usersInputField: HTMLInputElement = undefined;
    usersAnswer: string;

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        wordingDetailsDiv.innerHTML = "";
        switch (this.wordingType) {
            case AutomatonDataType.Automaton:
                // Display the automaton.
                let designerDiv = libD.jso2dom(["div#question-automaton-designer"]);
                let wordingDesigner = new AudeDesigner(designerDiv, true);
                wordingDesigner.setAutomatonCode(automaton_code(this.correctAnswerAutomaton));
                wordingDesigner.autoCenterZoom();
                wordingDetailsDiv.appendChild(designerDiv);
                break;

            case AutomatonDataType.LinearGrammar:
                // Display the grammar.
                let grammarDesigner = new GrammarDesigner(wordingDetailsDiv, false);
                grammarDesigner.setGrammar(this.wordingGrammar);
                break;

            case AutomatonDataType.Regexp:
                // Display the regexp.
                window.AudeGUI.Quiz.textFormat(regexp2Latex(this.wordingRegexp), wordingDetailsDiv, true);
                break;
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        let refs = { wordInput: <HTMLInputElement>null };
        answerInputDiv.appendChild(libD.jso2dom(["div",
            [["p", this._("Your answer :")],
            ["input#question-answers-input", { "#": "wordInput", "type": "text" }]]
        ], refs));

        this.usersInputField = refs.wordInput;
    }

    parseUsersAnswer(): boolean {
        if (this.usersInputField === undefined) {
            return true;
        }
        this.usersAnswer = this.usersInputField.value;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        if (this.wordingType === AutomatonDataType.LinearGrammar) {
            this.correctAnswerAutomaton = Question.linearGrammar2Automaton(this.wordingGrammar);
        }
        if (this.wordingType === AutomatonDataType.Regexp) {
            this.correctAnswerAutomaton = Question.regexToAutomaton(this.wordingRegexp);
        }
        let correct = true;
        let details = "";
        correct = this.correctAnswerAutomaton.acceptedWord(this.usersAnswer.trim());
        console.log(this.usersAnswer);
        console.log(this.correctAnswerAutomaton);
        console.log(this.wordingGrammar);
        if (!correct) {
            details = this._("This word isn't recognized by the automaton !");
        }
        return { correct: correct, details: details };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }
}

/**
* Class that handles questions that involve creating an
* automaton, regular expression, or grammar that recognizes
* a language that is described in natural language.
* Example : Words that have an even number of 'a's.
*/
class NaturalLanguage2AutomatonQuestion extends Question {
    answerMode: AutomatonDataType = AutomatonDataType.Automaton;

    inputAutomatonDesigner: AudeDesigner = undefined;
    inputGrammarDesigner: GrammarDesigner = undefined;
    inputRegexpField: HTMLInputElement = undefined;

    usersAnswerAutomaton: Automaton;
    usersAnswerGrammar: linearGrammar;
    usersAnswerRegexp: string;

    correctAnswerAutomaton: Automaton = undefined;

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        /*if (this.answerMode === AutomatonDataType.LinearGrammar) {
            wordingDetailsDiv.innerHTML = NaturalLanguage2AutomatonQuestion.grammarInputHelp;
        }*/
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        switch (this.answerMode) {
            case AutomatonDataType.Automaton:
                // Display an automaton designer.
                let refsAuto = { designerDiv: <HTMLElement>null }
                answerInputDiv.appendChild(libD.jso2dom(
                    ["div#question-automaton-designer", { "#": "designerDiv" }],
                    refsAuto
                ));
                this.inputAutomatonDesigner = new AudeDesigner(refsAuto.designerDiv, false);
                break;

            case AutomatonDataType.LinearGrammar:
                this.inputGrammarDesigner = new GrammarDesigner(answerInputDiv, true);
                let g = new linearGrammar(["a", "b"], ["S", "T"], "S");
                g.addRule("S", "a", "T", "right");
                g.addRule("T", "b");
                g.addRule("T", "a", "T", "right");
                this.inputGrammarDesigner.setGrammar(g);
                break;

            case AutomatonDataType.Regexp:
                // Display a text input (could be improved later).
                let refs = { textInput: <HTMLInputElement>null };
                answerInputDiv.appendChild(
                    libD.jso2dom(
                        ["input#question-answers-input", { "#": "textInput", "type": "text" }],
                        refs
                    )
                );
                this.inputRegexpField = refs.textInput;
                break;
        }
    }

    parseUsersAnswer(): boolean {
        switch (this.answerMode) {
            case AutomatonDataType.Automaton:
                if (this.inputAutomatonDesigner === undefined) {
                    return true;
                }
                this.usersAnswerAutomaton = this.inputAutomatonDesigner.getAutomaton(0);
                return false;

            case AutomatonDataType.LinearGrammar:
                if (this.inputGrammarDesigner === undefined) {
                    return true;
                }
                this.usersAnswerGrammar = this.inputGrammarDesigner.getGrammar();
                return false;

            case AutomatonDataType.Regexp:
                if (this.inputRegexpField === undefined) {
                    return true;
                }
                this.usersAnswerRegexp = this.inputRegexpField.value;
                return false;
        }
        return true;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        if (this.answerMode === AutomatonDataType.Regexp) {
            this.usersAnswerAutomaton = Question.regexToAutomaton(this.usersAnswerRegexp);
        } else if (this.answerMode === AutomatonDataType.LinearGrammar) {
            this.usersAnswerAutomaton = Question.linearGrammar2Automaton(this.usersAnswerGrammar);
        }

        if (this.correctAnswerAutomaton === undefined) {
            return { correct: false, details: this._("This question wasn't initialized correctly.") };
        }

        let correct = true;
        let details = "";
        correct = Question.automataAreEquivalent(this.usersAnswerAutomaton, this.correctAnswerAutomaton);
        if (!correct) {
            details = this._("Your answer doesn't recognize the right language !");
        }
        return { correct: correct, details: details };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }
}

/**
* Class that handles question that involves transforming grammars.
* Example : leftLinear -> rightLinear
*/
class GrammarTransformationQuestion extends Question {
    wordingGrammar: linearGrammar;

    answerGrammarDesigner: GrammarDesigner;
    usersAnswer: linearGrammar;

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        wordingDetailsDiv.innerHTML = "";
        let wordingDesigner = new GrammarDesigner(wordingDetailsDiv, false);
        wordingDesigner.setGrammar(this.wordingGrammar);
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        answerInputDiv.innerHTML = "";
        this.answerGrammarDesigner = new GrammarDesigner(answerInputDiv, true);
    }

    parseUsersAnswer(): boolean {
        if (this.answerGrammarDesigner === undefined) {
            return true;
        }
        this.usersAnswer = this.answerGrammarDesigner.getGrammar();
        return false;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        let correct = true;
        let details = "";

        switch (this.subtype) {
            case QuestionSubType.LeftGrammar2RightGrammar:
                for (let rule of this.usersAnswer.getProductionRules()) {
                    if (rule.getSide() !== "right") {
                        correct = false;
                        break;
                    }
                }
                if (!correct) {
                    details = this._("Your answer isn't right-linear.");
                }

                correct = Question.automataAreEquivalent(
                    Question.linearGrammar2Automaton(this.usersAnswer),
                    Question.linearGrammar2Automaton(this.wordingGrammar)
                );

                if (!correct) {
                    details = this._("Your answer doesn't recognize the right language.");
                }
                break;
        }

        return { correct: correct, details: details };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }


}

/**
* Class that handles questions involving conversions 
* between automata and regular expressions.
* Examples : Automaton -> Regexp, Regexp -> Automaton
*/
class AutomatonRegexpConversionQuestion extends Question {
    wordingDetails: Automaton | string;
    usersAnswer: Automaton | string;

    answerInput: AudeDesigner | HTMLInputElement;

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        if (this.wordingDetails instanceof Automaton) {
            let refs = { designerDiv: <HTMLElement>null };
            wordingDetailsDiv.appendChild(libD.jso2dom(
                ["div#question-automaton-designer", { "#": "designerDiv" }],
                refs
            ));
            let wordingDesigner = new AudeDesigner(refs.designerDiv, false);
            wordingDesigner.setAutomatonCode(automaton_code(this.wordingDetails));
        } else {
            window.AudeGUI.Quiz.textFormat(regexp2Latex(this.wordingDetails), wordingDetailsDiv);
        }
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        // Wording is automaton => answer will be a regexp.
        if (this.wordingDetails instanceof Automaton) {
            let refs = { regexpField: <HTMLInputElement>null };
            answerInputDiv.appendChild(libD.jso2dom(["input",
                {
                    "#": "regexpField",
                    "placeholder": this._("Input your grammar here")
                }],
                refs));

            this.answerInput = refs.regexpField;
        } else { // Wording is regexp => answer will be an automaton.
            let refs = { designerDiv: <HTMLElement>null };
            answerInputDiv.appendChild(libD.jso2dom(
                ["div#question-automaton-designer", { "#": "designerDiv" }],
                refs
            ));
            this.answerInput = new AudeDesigner(refs.designerDiv, false);
        }
    }

    parseUsersAnswer(): boolean {
        if (this.answerInput === undefined) {
            return true;
        }

        if (this.answerInput instanceof AudeDesigner) {
            this.usersAnswer = this.answerInput.getAutomaton(0);
        } else {
            this.usersAnswer = this.answerInput.value;
        }
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        let correct = true;
        let details = "";
        if (this.usersAnswer instanceof Automaton) {
            correct = Question.automataAreEquivalent(
                Question.regexToAutomaton(this.wordingDetails),
                this.usersAnswer
            );
        } else {
            if (this.wordingDetails instanceof Automaton) {
                correct = Question.automataAreEquivalent(
                    this.wordingDetails,
                    Question.regexToAutomaton(this.usersAnswer)
                );
            } else {
                // ERROR ! Shoudln't happen.
                console.error("Automaton to regexp question hasn't been initialized properly.");
            }
        }

        if (!correct) {
            details = this._("Your answer doesn't recognize the right language.");
        }
        return { correct: correct, details: details };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }


}

/**
* Class that handles questions involving conversions
* between automata and linear grammars.
* Examples : Automaton -> Grammar, Grammar -> Automaton
*/
class AutomatonGrammarConversionQuestion extends Question {
    wordingDetails: Automaton | linearGrammar;
    usersAnswer: Automaton | linearGrammar;
    userAnswerInput: AudeDesigner | GrammarDesigner;

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        let designerDiv: HTMLElement;
        if (this.wordingDetails instanceof Automaton) {
            designerDiv = libD.jso2dom(["div#question-automaton-designer"]);
            let wordingDesigner = new AudeDesigner(designerDiv, true);
            wordingDesigner.setAutomatonCode(automaton_code(this.wordingDetails));
        } else if (this.wordingDetails instanceof linearGrammar) {
            designerDiv = libD.jso2dom(["div"]);
            let wordingGrammarDesigner = new GrammarDesigner(designerDiv, false);
            wordingGrammarDesigner.setGrammar(this.wordingDetails);
        }
        wordingDetailsDiv.appendChild(designerDiv);
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        // Automaton in wording => Grammar as answer. 
        if (this.wordingDetails instanceof Automaton) {
            this.userAnswerInput = new GrammarDesigner(answerInputDiv, true);
        } else if (this.wordingDetails instanceof linearGrammar) {
            // Grammar as wording => Automaton as answer
            let designerDiv = libD.jso2dom(["div#question-automaton-designer"]);
            this.userAnswerInput = new AudeDesigner(designerDiv, false);
            answerInputDiv.appendChild(designerDiv);
        }
    }

    parseUsersAnswer(): boolean {
        if (!this.userAnswerInput) {
            return true;
        }

        if (this.userAnswerInput instanceof AudeDesigner) {
            this.usersAnswer = this.userAnswerInput.getAutomaton(0);
        } else if (this.userAnswerInput instanceof GrammarDesigner) {
            this.usersAnswer = this.userAnswerInput.getGrammar();
        } else {
            return true;
        }
        return false;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        let correct = true;
        let details = "";

        if (this.usersAnswer instanceof Automaton) {
            correct = Question.automataAreEquivalent(
                this.usersAnswer as Automaton,
                Question.linearGrammar2Automaton(this.wordingDetails as linearGrammar)
            );

            if (!correct) {
                details = "Your automaton doesn't recognize the same language as the grammar.";
            }
        } else if (this.usersAnswer instanceof linearGrammar) {
            correct = Question.automataAreEquivalent(
                Question.linearGrammar2Automaton(this.usersAnswer as linearGrammar),
                this.wordingDetails as Automaton
            );

            if (!correct) {
                details = "Your grammar doesn't recognize the same language as the automaton.";
            }
        }

        return { correct: correct, details: details };
    }


    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }
}

/**
* Class that handles questions that
* take a list of states that fullfill a certain
* condition as an answer.
* Examples : list reachable/coreachable states
*/
class AutomatonStatelistQuestion extends Question {
    wordingAutomaton: Automaton;

    stateListInput: HTMLInputElement;

    usersAnswer: Array<any>;

    /** 
     * Method used to validate the conditions on the state list
     * Could be a compiled audescript function
     */
    validator: (wordingAutomaton: Automaton, stateList: Array<any>) => { correct: boolean, details: string };

    displayWordingDetails(wordingDetailsDiv: HTMLElement): void {
        let designerDiv = libD.jso2dom(["div#question-automaton-designer"]);
        let wordingAutomatonDesigner = new AudeDesigner(designerDiv, true);
        wordingAutomatonDesigner.setAutomatonCode(automaton_code(this.wordingAutomaton));
        wordingAutomatonDesigner.autoCenterZoom();
        wordingDetailsDiv.appendChild(designerDiv);
    }

    displayAnswerInputs(answerInputDiv: HTMLElement): void {
        this.stateListInput = <HTMLInputElement>libD.jso2dom(
            ["input#question-answers-input", { "placeholder": this._("Comma-separated list of states") }]
        );

        answerInputDiv.appendChild(this.stateListInput);
    }

    parseUsersAnswer(): boolean {
        if (this.stateListInput === undefined) {
            return true;
        }

        this.usersAnswer = this.stateListInput.value.split(",");
        for (let i = 0; i < this.usersAnswer.length; i++) {
            this.usersAnswer[i] = this.usersAnswer[i].trim();
        }

        return false;
    }

    checkUsersAnswer(): { correct: boolean; details: string; } {
        let correct = true;
        let details = "";

        switch (this.subtype) {
            case QuestionSubType.Reachable:
            case QuestionSubType.Coreachable:
                let statesRaw = (this.subtype === QuestionSubType.Reachable ?
                    Question.reachableStates(this.wordingAutomaton) :
                    Question.coreachableStates(this.wordingAutomaton));
                // We have to cast the states to string to avoid comparison errors (0 !== "0").
                let correctStates = new libD.Set();
                for (let state of (this.subtype === QuestionSubType.Reachable ? 
                                    Question.reachableStates(this.wordingAutomaton) :
                                    Question.coreachableStates(this.wordingAutomaton))) {
                    correctStates.add(String(state));
                }

                let diff = correctStates.symDiff(this.usersAnswer);
                if (diff.size !== 0) {
                    correct = false;

                    for (let err of diff) {
                        // If the state isn't in the correct answer : it was checked when it shouldn't have.
                        if (!correctStates.has(err)) {
                            if (this.subtype === QuestionSubType.Reachable) {
                                details = libD.format(this._("State {0} isn't reachable."), err);
                            } else {
                                details = libD.format(this._("State {0} isn't coreachable."), err);
                            }
                        }

                        // If the state isn't in user's answer : it wasn't checked when it should have.
                        if (!this.usersAnswer.includes(err)) {
                            if (this.subtype === QuestionSubType.Reachable) {
                                details = libD.format(this._("State {0} is reachable."), err);
                            } else {
                                details = libD.format(this._("State {0} is coreachable."), err);
                            }
                        }
                    }
                }
                break;

            case QuestionSubType.EquivalentStates:
                let stateCouples = [];
                
                for (let couple of this.usersAnswer as Iterable<string>) {
                    if (couple.length === 0) {
                        continue;
                    }

                    let coupleRegexp = /^[(]([^;]+)[;]([^;]+)[)]$/g;
                    let match = coupleRegexp.exec(couple.trim());
                    if (!match || match.length === 0) {
                        correct = false;
                        details = libD.format(this._("Formatting error : {0} isn't a valid couple."), couple);
                        break;
                    }

                    stateCouples.push([match[1].trim(), match[2].trim()]);
                }

                if (!correct) {
                    break;
                }

                let equivalentStates = [];
                for (let couple of Question.notDistinguableStates(this.wordingAutomaton) as Iterable<libD.Tuple>) {
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
                        correct = false;
                        details = libD.format(
                            this._("States {0} and {1} aren't equivalent."),
                            answerCouple[0],
                            answerCouple[1]
                        );
                    }
                }

                if (!correct) {
                    break;
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
                        correct = false;
                        details = libD.format(
                            this._("States {0} and {1} are equivalent, but you didn't list them as such."),
                            equivCouple[0],
                            equivCouple[1]
                        )
                    }
                }
                break;

            case QuestionSubType.QuizStateList:
                return this.validator(this.wordingAutomaton, this.usersAnswer);
        }
        return { correct: correct, details: details };
    }

    displayCorrectAnswer(correctAnswerDiv: HTMLElement): void {
        throw new Error("Method not implemented.");
    }

    generateRandomly() {
        throw new Error("Method not implemented.");
    }

    generateFromFile() {
        throw new Error("Method not implemented.");
    }
}