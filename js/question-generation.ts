/**
  * Generates a random integer in the interval [a; b[.
  * @param a - Lower bound of generation interval.
  * @param b - Upper bound of generation interval.
  */
function randomInteger(a: number, b: number): number {
    if (a > b) {
        return this.randomInteger(b, a);
    }
    return Math.floor(Math.random() * (b - a)) + a;
}

function shuffleArrayInPlace(array: Array<any>): void {
    let j: number;
    let tmp: any;
    for (let i = array.length - 1; i > 0; i--) {
        j = randomInteger(0, i + 1);
        tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
}

function shuffleArray(array: Array<any>): Array<any> {
    let newArray = [];

    let oldArray = array.slice();
    let i = array.length;
    while (i > 0) {
        let randomIndex = randomInteger(0, i);
        newArray.push(oldArray[randomIndex]);
        oldArray.splice(randomIndex, 1);

        i--;
    }

    return newArray;
}

/**
 * Class that handles random automata generation and its parameters. 
 */
class AutomatonGenerator {
    /**
     * Default generator constraints.
     */
    static readonly DEFAULT_GENERATOR = {
        alphabet: new Set(["a", "b", "c"]),
        stateCount: 7,
        finalStateCount: 1,
        transitionCount: 10,
        isDeterministic: true,
        hasEpsilon: false,
        allStatesReachable: true,
        allStatesCoreachable: true,
        minimal: true,
        noEmptyLanguage: true,
        languageInterNonEmpty: false,
        areEquivalent: false
    };

    /** The alphabet used by the generated automata */
    private alphabet: Set<any>;

    /** The number of states in the generated automata. */
    private stateCount: number;
    /** The number of states of the generated automata that will be final. */
    private finalStateCount: number;
    /** The number of transitions that the generated automata will contain. */
    private transitionCount: number;
    /** If true, the generated automata will be deterministic. */
    private isDeterministic: boolean;
    /** If true, the generated automata will contain epsilon-transitions. */
    private hasEpsilon: boolean;
    /** If true, all generated automata will be reachable. */
    private allStatesReachable: boolean;
    /** If true, all generated automata will be coreachable. */
    private allStatesCoreachable: boolean;
    /** If true, all the generated automata will be minimal. */
    private minimal: boolean;
    /** If true, none of the generated automata will recognize the empty language. */
    private noEmptyLanguage: boolean;

    // The following only affect the generation of pairs of automata.
    /** If true, the pairs of generated automata's recognized languages will have a non empty intersection. */
    private languageInterNonEmpty: boolean;
    /** If true, the automata in each generated pair will be equivalent. */
    private areEquivalent: boolean;

    private static areProgramsLoaded = false;
    private static programs = {
        isMinimal: <(a: Automaton) => boolean>undefined,
        minimize: <(a: Automaton,
            isAlreadyDeterminized?: boolean,
            isAlreadyDeterminizedAndComplete?: boolean,
            alphabet?: libD.Set) => Automaton>undefined,
        reachableStates: <(a: Automaton) => libD.Set>undefined,
        coreachableStates: <(a: Automaton) => libD.Set>undefined,
        automaton2Regex: <(a: Automaton) => string>undefined,
        automaton2RightLinearGrammar: <(a: Automaton) => linearGrammar>undefined,
        rightLinear2LeftLinearGrammar: <(g: linearGrammar) => linearGrammar>undefined,
        normalize: <(a: Automaton, start?: any) => Automaton>undefined
    };

    constructor(alphabet: Iterable<any> = AutomatonGenerator.DEFAULT_GENERATOR.alphabet,
        stateCount: number = AutomatonGenerator.DEFAULT_GENERATOR.stateCount,
        finalStateCount: number = AutomatonGenerator.DEFAULT_GENERATOR.finalStateCount,
        transitionCount: number = AutomatonGenerator.DEFAULT_GENERATOR.transitionCount) {
        // We set the given constraints.
        this.alphabet = new Set(alphabet);
        this.stateCount = stateCount;
        this.finalStateCount = finalStateCount;
        this.transitionCount = transitionCount;

        // We set the other constraints to default.
        this.isDeterministic = AutomatonGenerator.DEFAULT_GENERATOR.isDeterministic;
        this.hasEpsilon = AutomatonGenerator.DEFAULT_GENERATOR.hasEpsilon;
        this.allStatesReachable = AutomatonGenerator.DEFAULT_GENERATOR.allStatesReachable;
        this.allStatesCoreachable = AutomatonGenerator.DEFAULT_GENERATOR.allStatesCoreachable;
        this.minimal = AutomatonGenerator.DEFAULT_GENERATOR.minimal;
        this.noEmptyLanguage = AutomatonGenerator.DEFAULT_GENERATOR.noEmptyLanguage;
        this.languageInterNonEmpty = AutomatonGenerator.DEFAULT_GENERATOR.languageInterNonEmpty;
        this.areEquivalent = AutomatonGenerator.DEFAULT_GENERATOR.areEquivalent;

        // If needed, we load the programs from AudeScript.
        if (!AutomatonGenerator.areProgramsLoaded) {
            AutomatonGenerator.loadPrograms();
        }
    }

    /**
     * Loads some required algorithms from AudeScript.
     * Sets the flag AutomatonGenerator.areProgramsLoaded.
     */
    private static loadPrograms() {
        window.AudeGUI.Runtime.loadIncludes([
            "minimization", "reachability", "automaton2regex",
            "automaton2RightLinearGrammar", "rightLinear2LeftLinearGrammar", "normalization",
            "coreachability"
        ], () => {
            AutomatonGenerator.programs.minimize = audescript.m("minimization").minimize;
            AutomatonGenerator.programs.isMinimal = audescript.m("minimization").isMinimized;
            AutomatonGenerator.programs.reachableStates = audescript.m("reachability").reachableStates;
            AutomatonGenerator.programs.automaton2Regex = audescript.m("automaton2regex").automatonToRegex;
            AutomatonGenerator.programs.automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
            AutomatonGenerator.programs.rightLinear2LeftLinearGrammar = audescript.m("rightLinear2LeftLinearGrammar").rightLinear2LeftLinearGrammar;
            AutomatonGenerator.programs.normalize = audescript.m("normalization").normalize;
            AutomatonGenerator.programs.coreachableStates = audescript.m("coreachability").coreachableStates;
        });
        AutomatonGenerator.areProgramsLoaded = true;
    }

    /**
     * Array of functions that modify an automaton, while ensuring that the
     * language recognized only grows.
     * These functions take a single automaton and return true
     * iff the modification was able to be made.
     */
    private static semiDestructiveAutomatonMutations = [
        // Add a transition from and to a random state.
        (a: Automaton) => {
            let states = Array.from(a.getStates());
            let alphabet = Array.from(a.getAlphabet());
            let numTrans = a.getTransitions().size;

            if (numTrans < states.length * alphabet.length) {
                shuffleArrayInPlace(alphabet);
                shuffleArrayInPlace(states);
                let statesDests = states.slice();
                shuffleArrayInPlace(statesDests);

                for (let sState of states) {
                    for (let dState of statesDests) {
                        for (let symb of alphabet) {
                            if (!a.hasTransition(sState, symb, dState) &&
                                a.getSuccessors(sState, symb).size === 0) {

                                a.addTransition(sState, symb, dState);
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        },
        // Add a state that's both accessible and coaccessible.
        (a: Automaton) => {
            let states = Array.from(a.getStates());

            let newState = 0;
            while (a.hasState(newState) || a.hasState(String(newState))) {
                newState++;
            }

            let reachableStates = Array.from(AutomatonGenerator.programs.reachableStates(a));
            let alphabet = Array.from(a.getAlphabet());

            // We shuffle the arrays to iterate through them at random.
            shuffleArrayInPlace(reachableStates);
            shuffleArrayInPlace(alphabet);

            let startState: any = undefined;
            let fromReachableTransitionSymbol: any = undefined;

            stateLoop:
            for (let rState of reachableStates) {
                for (let symb of alphabet) {
                    if (a.getSuccessors(rState, symb).size === 0) {
                        startState = rState;
                        fromReachableTransitionSymbol = symb;
                        break stateLoop;
                    }
                }
            }

            if (startState === undefined) {
                return false;
            }

            // We look for a coreachable state to link our new state to.
            let coreachableStates = Array.from(AutomatonGenerator.programs.coreachableStates(a));
            if (coreachableStates.length === 0) {
                return false;
            }
            let endState = coreachableStates[randomInteger(0, coreachableStates.length)];
            // alphabet is already shuffled, we take the first element
            let toCoreachableTransitionSymbol = alphabet[0];

            a.addState(newState);
            a.addTransition(startState, fromReachableTransitionSymbol, newState);
            a.addTransition(newState, toCoreachableTransitionSymbol, endState);
            return true;
        }
    ]

    /**
     * Array of functions that modify an automaton, while 
     * ensuring the recognized language doesn't change.
     */
    private static nonDestructiveAutomatonMutations = [

    ]

    /**
     * Generates a single automaton, following
     * the contraints set in the object's properties.
     */
    generateAutomaton(): Automaton {
        console.time("Automaton Generation Timer");
        let A = new Automaton();

        // We add states numbered from 0 to the number of states (exclusive).
        for (let i = 0; i < this.stateCount; i++) {
            A.addState(i);
        }

        // We initialize the automaton's alphabet.
        for (let s of this.alphabet) {
            A.addSymbol(s);
        }

        // We pick a state at random to be the initial state.
        A.setInitialState(randomInteger(0, this.stateCount));

        // If we generate an automaton with epsilon transitions, we
        // add them to our possible transition symbols.
        let transitionSymbolPool = Array.from(this.alphabet);
        if (this.hasEpsilon) {
            let numEpsilon = transitionSymbolPool.length / 4;
            for (let i = 0; i < numEpsilon; i++) {
                transitionSymbolPool.push(epsilon);
            }
        }

        // We generate transitions by "walking" the automaton at random.
        let numTransitionsAdded = 0;
        let currentState = A.getInitialState();
        let previousStates = [];
        while (numTransitionsAdded != this.transitionCount) {
            // We sometimes go back to a previously visited state, to avoid linearity.
            if (Math.random() < 0.5 && previousStates.length != 0) {
                currentState = previousStates[randomInteger(0, previousStates.length)];
            }

            let isolatedStates = A.getStates().copy();
            for (let tr of A.getTransitions() as Iterable<Transition>) {
                isolatedStates.remove(tr.startState);
                isolatedStates.remove(tr.endState);
            }
            let endState: any;
            if (isolatedStates.size > 0) {
                endState = Array.from(isolatedStates)[0];
            } else {
                endState = randomInteger(0, this.stateCount);
            }

            let transitionSymbol = transitionSymbolPool[randomInteger(0, transitionSymbolPool.length)];

            // If the transition already exists, don't add it.
            if (A.hasTransition(currentState, transitionSymbol, endState)) {
                continue;
            }

            // If we are creating a deterministic automaton
            // and the symbol is already used, we "take" that transition.
            let successors = Array.from(A.getSuccessors(currentState, transitionSymbol));
            if (this.isDeterministic && successors.length !== 0) {
                currentState = successors[0];
                continue;
            }

            A.addTransition(currentState, transitionSymbol, endState);
            previousStates.push(currentState);
            currentState = endState;
            numTransitionsAdded++;
        }

        let numFinalStates = 0;
        let reachableStates = Array.from(AutomatonGenerator.programs.reachableStates(A));
        if (!this.noEmptyLanguage || reachableStates.includes(currentState)) {
            A.setFinalState(currentState);
            numFinalStates++;
        }

        while (numFinalStates != this.finalStateCount) {
            let finalState: any;
            do {
                if (numFinalStates >= reachableStates.length) {
                    finalState = randomInteger(0, this.stateCount);
                } else {
                    finalState = reachableStates[randomInteger(0, reachableStates.length)];
                }
            } while (A.isFinalState(finalState));
            A.setFinalState(finalState);
            numFinalStates++;
        }

        console.timeEnd("Automaton Generation Timer");

        return A;
    }

    /**
     * Generates a linear grammar.
     */
    generateGrammar(leftOrRightLinear: "left" | "right" = "right"): linearGrammar {
        let G = AutomatonGenerator.programs.automaton2RightLinearGrammar(this.generateAutomaton());
        return (leftOrRightLinear === "left" ?
            AutomatonGenerator.programs.rightLinear2LeftLinearGrammar(G) :
            G);
    }

    /**
     * Generates a regular expression.
     * The generated regexps are converted from a random
     * automaton and thus, might have problems.
     */
    generateRegexp(): string {
        return AutomatonGenerator.programs.automaton2Regex(this.generateAutomaton());
    }

    /**
     * Generates a pair of automata, following
     * the constraints set in the object's properties.
     */
    generateAutomataPair(): Array<Automaton> {
        let oldStateCount = this.stateCount;
        let oldTransCount = this.transitionCount;

        this.stateCount = Math.ceil(this.stateCount / 2);
        this.transitionCount = Math.ceil(this.transitionCount / 2);
        let A = this.generateAutomaton();
        let automata = [A, A.copy()];

        for (let i = 0; i < Math.floor(this.stateCount / 2); i++) {
            let chosenOperation =
                AutomatonGenerator.semiDestructiveAutomatonMutations[
                randomInteger(0, AutomatonGenerator.semiDestructiveAutomatonMutations.length)
                ];

            let changesMade = false;
            if (Math.random() < 0.5) {
                changesMade = chosenOperation(automata[0]);
            } else {
                changesMade = chosenOperation(automata[1]);
            }

            if (!changesMade) {
                i--;
                continue;
            }
        }

        this.stateCount = oldStateCount;
        this.transitionCount = oldTransCount;
        return automata;
    }

    setAlphabet(newAlphabet: Iterable<any>) { this.alphabet = new Set(newAlphabet); }
    getAlphabet(): Set<any> { return this.alphabet; }

    allowNonDeterministic(): void { this.isDeterministic = false; }
    forbidNonDeterministic(): void { this.isDeterministic = true; }

    allowEpsilonTransitions(): void { this.hasEpsilon = true; }
    forbidEpsilonTransitions(): void { this.hasEpsilon = false; }

    allowNonReachableStates(): void { this.allStatesReachable = false; }
    forbidNonReachableStates(): void { this.allStatesReachable = true; }

    allowNonCoreachableStates(): void { this.allStatesCoreachable = false; }
    forbidNonCoreachableStates(): void { this.allStatesCoreachable = true; }

    allowEmptyLanguage(): void { this.noEmptyLanguage = false; }
    forbidEmptyLanguage(): void { this.noEmptyLanguage = true; }

    allowEmptyLanguageInter(): void { this.languageInterNonEmpty = false; }
    forbidEmptyLanguageInter(): void { this.languageInterNonEmpty = true; }

    allowNonMinimal(): void { this.minimal = false; }
    forbidNonMinimal(): void { this.minimal = true; }

    allowNonEquivalent(): void { this.areEquivalent = false; }
    forbidNonEquivalent(): void { this.areEquivalent = true; }
}

/**
 * Class that handles generation of questions (randomly or from question database).
 */
class QuestionGenerator {
    /** The generator used for questions that need automata in their instructions. */
    automatonGenerator: AutomatonGenerator;
    private _ = window.AudeGUI.l10n;

    constructor() {
        this.automatonGenerator = new AutomatonGenerator();
    }

    generateFromSubtype(qSubtype: QuestionSubType): Question {
        let q: Question;

        switch (Question.deduceQuestionCategory(qSubtype)) {
            case QuestionCategory.AutomatonEquivQuestion: {
                q = new AutomatonEquivQuestion(qSubtype);
                let qae = <AutomatonEquivQuestion>q;

                // According to the subtype, we set different constraints on generation.
                switch (qSubtype) {
                    case QuestionSubType.Product:
                        this.automatonGenerator.forbidEmptyLanguageInter();
                        break;

                    case QuestionSubType.Minimize:
                        this.automatonGenerator.allowNonMinimal();
                        break;

                    case QuestionSubType.Determinize:
                        this.automatonGenerator.allowNonDeterministic();
                        break;

                    case QuestionSubType.Determinize_Minimize:
                        this.automatonGenerator.allowNonDeterministic();
                        this.automatonGenerator.allowNonMinimal();
                        break;

                    case QuestionSubType.EliminateEpsilon:
                    case QuestionSubType.Determinize_EliminateEpsilon:
                        this.automatonGenerator.allowNonDeterministic();
                        this.automatonGenerator.allowEpsilonTransitions();
                        break;
                }


                switch (qSubtype) {
                    case QuestionSubType.Regexp2Automaton:
                        qae.correctAnswerAutomaton = this.automatonGenerator.generateAutomaton();
                        qae.wordingDetails[0] = AutomatonPrograms.automatonToRegex(qae.correctAnswerAutomaton);
                        break;

                    case QuestionSubType.Automaton2Regexp:
                        qae.usersAnswerType = AutomatonDataType.Regexp;
                        qae.correctAnswerAutomaton = this.automatonGenerator.generateAutomaton();
                        qae.wordingDetails[0] = qae.correctAnswerAutomaton.copy();
                        break;

                    case QuestionSubType.LeftGrammar2RightGrammar:
                        qae.correctAnswerAutomaton = this.automatonGenerator.generateAutomaton();
                        qae.wordingDetails[0] = AutomatonPrograms.rightLinear2LeftLinearGrammar(
                            AutomatonPrograms.automaton2RightLinearGrammar(qae.correctAnswerAutomaton)
                        );
                        qae.usersAnswerType = AutomatonDataType.LinearGrammar;
                        break;

                    case QuestionSubType.Grammar2Automaton:
                        qae.correctAnswerAutomaton = this.automatonGenerator.generateAutomaton();
                        qae.wordingDetails[0] = AutomatonPrograms.automaton2RightLinearGrammar(qae.correctAnswerAutomaton);
                        break;

                    case QuestionSubType.Automaton2Grammar:
                        qae.usersAnswerType = AutomatonDataType.LinearGrammar;
                        qae.correctAnswerAutomaton = this.automatonGenerator.generateAutomaton();
                        qae.wordingDetails[0] = qae.correctAnswerAutomaton.copy();
                        break;

                    case QuestionSubType.Product:
                        qae.wordingDetails = this.automatonGenerator.generateAutomataPair();
                        qae.correctAnswerAutomaton =
                            AutomatonPrograms.product(qae.wordingDetails[0] as Automaton, qae.wordingDetails[1] as Automaton);
                        break;

                    case QuestionSubType.Complement:
                        qae.wordingDetails[0] = this.automatonGenerator.generateAutomaton();
                        qae.correctAnswerAutomaton = AutomatonPrograms.complement(qae.wordingDetails[0] as Automaton);
                        break;

                    default:
                        qae.wordingDetails[0] = this.automatonGenerator.generateAutomaton();
                        qae.correctAnswerAutomaton = (qae.wordingDetails[0] as Automaton).copy();
                }
                break;
            }
            case QuestionCategory.TextInput: {
                q = new TextInputQuestion(qSubtype);
                let tiq = <TextInputQuestion>q;

                this.automatonGenerator.forbidNonDeterministic();
                this.automatonGenerator.forbidEpsilonTransitions();

                switch (qSubtype) {
                    case QuestionSubType.EquivalentStates:
                        this.automatonGenerator.allowNonMinimal();
                        tiq.answerValidator = TextInputQuestion.defaultValidators.EquivalentStateCouples;
                        tiq.inputPlaceholder = this._("Give the couples here in the format (A;B), separated by commas");
                        break;

                    case QuestionSubType.Reachable:
                        this.automatonGenerator.allowNonReachableStates();
                        tiq.answerValidator = TextInputQuestion.defaultValidators.ReachableStates;
                        break;

                    case QuestionSubType.Coreachable:
                        this.automatonGenerator.allowNonCoreachableStates();
                        tiq.answerValidator = TextInputQuestion.defaultValidators.CoreachableStates;
                        break;

                    case QuestionSubType.WordNonDet:
                        this.automatonGenerator.allowNonDeterministic();
                        tiq.answerValidator = TextInputQuestion.defaultValidators.RecognizedWordAutomaton;
                        break;

                    case QuestionSubType.WordEpsilon:
                        this.automatonGenerator.allowNonDeterministic();
                        this.automatonGenerator.allowEpsilonTransitions();
                        tiq.answerValidator = TextInputQuestion.defaultValidators.RecognizedWordAutomaton;
                        break;

                    case QuestionSubType.Word:
                        tiq.answerValidator = TextInputQuestion.defaultValidators.RecognizedWordAutomaton;
                        break;
                }

                if (qSubtype === QuestionSubType.WordGrammar) {
                    tiq.wordingDetails.push(this.automatonGenerator.generateGrammar());
                    tiq.answerValidator = TextInputQuestion.defaultValidators.RecognizedWordGrammar;
                } else if (qSubtype === QuestionSubType.WordRegexp) {
                    tiq.wordingDetails.push(this.automatonGenerator.generateRegexp());
                    tiq.answerValidator = TextInputQuestion.defaultValidators.RecognizedWordRegexp;
                } else {
                    tiq.wordingDetails.push(this.automatonGenerator.generateAutomaton());
                }

                break;
            }
            case QuestionCategory.MCQ: {
                q = new MCQQuestion(qSubtype);
                let mcq = <MCQQuestion>q;

                switch (qSubtype) {
                    case QuestionSubType.EquivalentAutomata:
                        let areEquivalent = Math.random() < 0.5;
                        if (areEquivalent) {
                            this.automatonGenerator.forbidNonEquivalent();
                        } else {
                            this.automatonGenerator.allowNonEquivalent();
                        }
                        mcq.wordingDetails = this.automatonGenerator.generateAutomataPair();
                        mcq.setWordingChoices([
                            { id: "a", text: this._("Yes") },
                            { id: "b", text: this._("No") }
                        ], true);
                        break;

                    default:
                        mcq.setWordingChoices(
                            [
                                { id: "a", text: "OwO" },
                                { id: "b", text: "What's" },
                                { id: "c", text: "This" },
                                { id: "d", text: "Bruuuuuuuh", correct: true }
                            ],
                            true
                        )
                }
                break;
            }
        }

        return q;
    }


}