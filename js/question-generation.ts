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

class AutomatonGenerator {
    /**
     * Default generator constraints.
     */
    static readonly DEFAULT_GENERATOR = {
        alphabet: new Set(["a", "b", "c", "d", "e"]),
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

    private alphabet: Set<any>;

    private stateCount: number;
    private finalStateCount: number;
    private transitionCount: number;
    private isDeterministic: boolean;
    private hasEpsilon: boolean;
    private allStatesReachable: boolean;
    private allStatesCoreachable: boolean;
    private minimal: boolean;
    private noEmptyLanguage: boolean;

    // The following only affect the generation of pairs of automata.
    private languageInterNonEmpty: boolean;
    private areEquivalent: boolean;

    private static areProgramsLoaded = false;
    private static programs = {
        isMinimal: <(a: Automaton) => boolean>undefined,
        minimize: <(a: Automaton,
            isAlreadyDeterminized?: boolean,
            isAlreadyDeterminizedAndComplete?: boolean,
            alphabet?: libD.Set) => Automaton>undefined,
        reachableStates: <(a: Automaton) => libD.Set>undefined,
        automaton2Regex: <(a: Automaton) => string>undefined,
        automaton2RightLinearGrammar: <(a: Automaton) => linearGrammar>undefined
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
            "minimization", "reachability", "automaton2regex", "automaton2RightLinearGrammar"
        ], () => {
            AutomatonGenerator.programs.minimize = audescript.m("minimization").minimize;
            AutomatonGenerator.programs.isMinimal = audescript.m("minimization").isMinimized;
            AutomatonGenerator.programs.reachableStates = audescript.m("reachability").reachableStates;
            AutomatonGenerator.programs.automaton2Regex = audescript.m("automaton2regex").automatonToRegex;
            AutomatonGenerator.programs.automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
        });
        AutomatonGenerator.areProgramsLoaded = true;
    }

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

        console.log("zoom");

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

        console.log("bazoom");

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

        console.log("bazoomzoom");

        console.timeEnd("Automaton Generation Timer");

        return A;
    }

    generateGrammar(): linearGrammar {
        return AutomatonGenerator.programs.automaton2RightLinearGrammar(this.generateAutomaton());
    }

    generateRegexp(): string {
        return AutomatonGenerator.programs.automaton2Regex(this.generateAutomaton());
    }

    /**
     * Generates a pair of automata, following
     * the constraints set in the object's properties.
     */
    generateAutomataPair(): Array<Automaton> {
        return [];
    }

    allowEmptyLanguage(): void { this.noEmptyLanguage = false; }
    forbidEmptyLanguage(): void { this.noEmptyLanguage = true; }

    allowNonDeterministic(): void { this.isDeterministic = false; }
    forbidNonDeterministic(): void { this.isDeterministic = true; }

    allowEpsilonTransitions(): void { this.hasEpsilon = true; }
    forbidEpsilonTransitions(): void { this.hasEpsilon = false; }

    allowEmptyLanguageInter(): void { this.languageInterNonEmpty = false; }
    forbidEmptyLanguageInter(): void { this.languageInterNonEmpty = true; }

    allowNonMinimal(): void { this.minimal = false; }
    forbidNonMinimal(): void { this.minimal = true; }
}

class QuestionGenerator {
    automatonGenerator: AutomatonGenerator;

    constructor() {
        this.automatonGenerator = new AutomatonGenerator();
    }

    generateFromSubtype(qSubtype: QuestionSubType): Question {
        let q: Question;

        switch (Question.deduceQuestionCategory(qSubtype)) {
            case QuestionCategory.AutomatonTransformation:
                q = new AutomatonTransformQuestion(qSubtype);
                let qat = <AutomatonTransformQuestion>q;

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

                    case QuestionSubType.Determinize_EliminateEpsilon:
                        this.automatonGenerator.allowNonDeterministic();
                        this.automatonGenerator.allowEpsilonTransitions();
                        break;
                }

                for (let i = 0; i < qat.automataInWording; i++) {
                    qat.wordingAutomata[i] = this.automatonGenerator.generateAutomaton();
                }
                break;

            case QuestionCategory.AutomatonStatesList: {
                q = new AutomatonStatelistQuestion(qSubtype);
                let qasl = <AutomatonStatelistQuestion>q;
                qasl.wordingAutomaton = this.automatonGenerator.generateAutomaton();
                break;
            }

            case QuestionCategory.RecognizedWord: {
                q = new RecognizedWordQuestion(qSubtype);
                // Question cast to its more precise type.
                let qrwq = <RecognizedWordQuestion>q;

                if (qSubtype === QuestionSubType.WordNonDet ||
                    qSubtype === QuestionSubType.WordEpsilon) {
                    this.automatonGenerator.allowNonDeterministic();

                    if (qSubtype === QuestionSubType.WordEpsilon) {
                        this.automatonGenerator.allowEpsilonTransitions();
                    }
                }

                // We pick a random type of wording.
                let wordingType: AutomatonDataType = AutomatonDataType.Automaton;
                switch (randomInteger(0, 3)) {
                    case 0:
                        wordingType = AutomatonDataType.Automaton;
                        break;
                    case 1:
                        wordingType = AutomatonDataType.LinearGrammar;
                        break;
                    default:
                        wordingType = AutomatonDataType.Regexp;
                        break;
                }

                qrwq.wordingType = wordingType;
                //qrwq.wordingType = AutomatonDataType.Automaton;
                this.automatonGenerator.forbidEmptyLanguage();

                switch (qrwq.wordingType) {
                    case AutomatonDataType.Automaton:
                        qrwq.correctAnswerAutomaton = this.automatonGenerator.generateAutomaton();
                        break;

                    case AutomatonDataType.LinearGrammar:
                        qrwq.wordingGrammar = this.automatonGenerator.generateGrammar();
                        break;

                    case AutomatonDataType.Regexp:
                        qrwq.wordingRegexp = this.automatonGenerator.generateRegexp();
                        break;
                }
                break;
            }



        }

        return q;
    }
}