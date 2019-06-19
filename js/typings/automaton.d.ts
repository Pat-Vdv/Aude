// A Typescript typing for the automaton.js file.
declare var epsilon: {
    toString: () => string
};

declare var automataMap: {
    "\\e": typeof epsilon;
    "ε": typeof epsilon;
}

declare class Transition {
    startState: any;
    symbol: any;
    endState: any;

    constructor(startState: any, symbol: any, endState: any);
    toString(): string;
    serializeElement(): string;
}

declare class Automaton {
    constructor(states?: Automaton | Iterable<any>, Sigma?: Iterable<any>, qInit?: any, trans?: libD.Set, finalStates?: Iterable<any>);
    addState(state: any, final?: boolean): void;
    addFinalState(state: any): void;
    addAcceptingState(state: any): void;
    setFinalState(state: any): void;
    setNonFinalState(state: any): void;
    toggleFinalState(state: any): void;

    setAcceptingState(state: any): void;
    toggleAcceptingState(state: any): void;
    setNonAcceptingState(state: any): void;

    getNonFinalStates(): libD.Set;
    getNonAcceptingStates(): libD.Set;

    getStates(): libD.Set;

    setStates(states: libD.Set, dontCopy?: boolean): void;

    getFinalStates(): libD.Set;
    getAcceptingStates(): libD.Set;

    setFinalStates(states: libD.Set, dontcopy?: boolean): void;
    setAcceptingStates(states: libD.Set): void;

    setInitialState(state: any): void;
    getInitialState(): any;

    removeState(state: any): void;

    hasState(state: any): boolean;
    isFinalState(state: any): boolean;
    isAcceptingState(state: any): boolean;

    addTransition(t: Transition | any, t1?: any, t2?: any): void;
    removeTransition(t: Transition | any, t1?: any, t2?: any): void;
    hasTransition(t: Transition | any, t1?: any, t2?: any): boolean;
    getTransitions(): libD.Set;
    setTransitions(trans: Iterable<Transition> | libD.Set): void;
    hasEpsilonTransitions(): boolean;

    getAlphabet(): libD.Set;
    setAlphabet(alphabet: libD.Set | Iterable<any>, byRef?: boolean): void;
    addAlphabet(alphabet: libD.Set): void;
    removeAlphabet(alphabet: libD.Set): void;
    addSymbol(symbol: any): void;

    getTransitionFunction(determinizedFunction?: boolean):
        (startState?: any, symbol?: any, getEndStates?: boolean) => libD.Set;

    hasSymbol(symbol: any): boolean;
    removeSymbol(symbol: any): void;
    
    toString(): string;
    serializeElement(): string;

    setCurrentState(state: any): void;
    setCurrentStates(states: Iterable<any>): void;
    addCurrentState(state: any): void;
    removeCurrentState(state: any): void;
    addCurrentStates(states: libD.Set): void;
    getCurrentStates(): libD.Set;
    currentStatesAddReachablesByEpsilon(transitionFunction: (startState?: any, symbol?: any, getEndStates?: boolean) => libD.Set
        , visited: libD.Set): void;
    
    getSuccessors(state: any, symbol: any): libD.Set;
    getReachable(state: any, visited: libD.Set): libD.Set;

    runSymbol(symbol: any, 
            transitionFunction: (startState?: any, symbol?: any, getEndStates?: boolean) => libD.Set, 
            dontEraseTakenTransitions: boolean
        ): void;
    
    runWord(symbols: string | Array<any>): void;
    acceptedWord(symbols: string | Array<any>): boolean;

    getLastTakenTransitions(): libD.Set;
    copy(): Automaton;
}

declare var automaton_code: (a: Automaton) => string;
declare var parse_transition: (text: string) => Array<any>;
declare var format_transition: (trans: string) => string;