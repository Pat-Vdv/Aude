// "Enum" for tape movement symbols.
enum TapeMovement {
    Left = "<",
    Right = ">",
    None = "-"
}

const NO_WRITE_SYMBOL = "-";

// Class that represents a transition of a Turing machine.
class TuringTransition {
    startState: any;
    endState: any;
    tapeSymbol: any;
    writeSymbol: any;
    movement: TapeMovement;

    constructor(startState: any, tapeSymbol: any, endState: any, writeSymbol: any, movement: TapeMovement) {
        this.startState = startState;
        this.tapeSymbol = tapeSymbol;
        this.endState = endState;
        this.writeSymbol = writeSymbol;
        this.movement = movement;
    }

    toString(): string {
        return "Transition(" +
            aude.elementToString(this.startState) + ", " +
            aude.elementToString(this.tapeSymbol) + ", " +
            aude.elementToString(this.endState) + ", " +
            aude.elementToString(this.writeSymbol) + ", " +
            aude.elementToString(this.movement) +
            ")";
    }

    serializeElement(): string { return this.toString(); }
}

// Class to handle (Deterministic) Turing Machine Automata.
class TuringMachine {
    states: libD.Set;
    finalStates: libD.Set;
    currentState: any;

    tapeAlphabet: libD.Set;
    transitions: Set<TuringTransition>;
    qInit: any;
    emptyTapeValue: any;
    tape: Array<any>;
    tapePosition: number;
    lastTakenTransition: TuringTransition;

    constructor(states: libD.Set, tapeAlphabet: libD.Set, qInit: any, transitions: Set<TuringTransition>, finalStates: libD.Set, emptyTapeValue: any) {
        this.states = states || new libD.Set();
        this.tapeAlphabet = tapeAlphabet || new libD.Set();
        this.transitions = transitions || new Set();
        this.qInit = qInit;
        this.emptyTapeValue = emptyTapeValue || "0";
        this.finalStates = finalStates || new libD.Set();

        this.setCurrentState(qInit);

        this.tape = [this.emptyTapeValue];
        this.tapePosition = 0;

        this.lastTakenTransition = null;
    };

    /* Tape head management */
    moveTapeHeadLeft(): void {
        // If at start of array, we shift the whole array right to add a new space.
        if (this.tapePosition == 0) {
            this.tape.unshift(this.emptyTapeValue);
            return;
        }
        this.tapePosition--;
    }

    moveTapeHeadRight(): void {
        // If at end of array, we add a new empty space.
        if (this.tapePosition == this.tape.length - 1) {
            this.tape.push(this.emptyTapeValue);
        }
        this.tapePosition++;
    }

    readTape(): any {
        return this.tape[this.tapePosition];
    }

    // Reads from tape at a given position. Returns default if position is out of bounds.
    readTapeAt(position: number): any {
        if (position >= 0 && position < this.tape.length) {
            return this.tape[position];
        } else {
            return this.emptyTapeValue;
        }
    }

    writeTape(symbol: any): void {
        // Symbol is undefined, doesn't exist in alphabet or is "no write" symbol : don't do anything.
        if (!symbol || !this.tapeAlphabet.has(symbol)
            || symbol === NO_WRITE_SYMBOL) return;

        this.tape[this.tapePosition] = symbol;
    }

    /* State management */
    isOnFinalState(): boolean {
        return this.isAcceptingState(this.currentState);
    }

    addState(state: any, final: boolean = false): void {
        this.states.add(state);
        if (final) {
            this.finalStates.add(state);
        }
    }

    popState(state: any): void {
        this.states.delete(state);
        this.finalStates.delete(state);

        this.transitions.forEach(
            function (trans) {
                if (trans.startState == state || trans.endState == state) {
                    this.transitions.remove(trans);
                }
            }
        )
    }

    hasState(state: any): boolean {
        return this.states.has(state);
    }

    getStates(): libD.Set {
        return this.states;
    }

    /* Tape Alphabet Management */
    // Adds set of symbols to tape alphabet.
    addToAlphabet(symbols: Iterable<any>): void {
        this.tapeAlphabet.unionInPlace(symbols);
    }

    // Removes set of symbolsd from tape alphabet.
    removeFromAlphabet(symbols: Iterable<any>): void {
        this.tapeAlphabet.minusInPlace(symbols);
    }

    getTapeAlphabet(): libD.Set {
        return this.tapeAlphabet;
    }

    // Adds single symbol to tape alphabet.
    addSymbol(symbol: any): void {
        this.tapeAlphabet.add(symbol);
    }

    // Removes single symbol from tape alphabet.
    removeSymbol(symbol: any): void {
        this.tapeAlphabet.remove(symbol);
    }

    // Returns true if symbol is in tape alphabet.
    symbolExists(symbol: any): boolean {
        return this.tapeAlphabet.has(symbol);
    }

    /* Transition Management */
    // Adds transition to transition list.
    // Also adds its symbols and states to the alphabet and state list.
    addTransition(startState: any, tapeSymbol: any, endState: any, writeSymbol: any, movement: TapeMovement): void {
        this.addState(startState);
        this.addState(endState);
        this.addSymbol(tapeSymbol);
        this.addSymbol(writeSymbol);
        this.transitions.add(
            new TuringTransition(startState, tapeSymbol, endState, writeSymbol, movement)
        );
    }

    getTransitions(): Set<TuringTransition> {
        return this.transitions;
    }

    /* Initial & Final State(s) Management */
    setInitialState(state: any): void {
        this.addState(state);
        this.qInit = state;
    }

    getInitialState(): any {
        return this.qInit;
    }

    addFinalState(state: any): void {
        this.addState(state, true);
    }

    setStateFinal(state: any): void {
        this.addState(state, true);
    }

    setStateNonFinal(state: any): void {
        this.finalStates.remove(state);
    }

    getFinalStates(): libD.Set {
        return this.finalStates;
    }

    isAcceptingState(state: any): boolean {
        return this.finalStates.has(state);
    }

    setCurrentState(state: any): void {
        this.states.add(state);
        this.currentState = state;
    }

    getCurrentStates(): Array<any> {
        return [this.currentState];
    }

    placeWordOnTape(word: string): void {
        for (var i = 0; i < word.length; i++) {
            this.tape[i] = word.charAt(i);
        }
        // We remove all leftover chars from previous words.
        this.tape.splice(word.length);
        this.tapePosition = 0;
    }

    getTape(): Array<any> {
        return this.tape;
    }

    getTapePosition(): number {
        return this.tapePosition;
    }

    getLastTakenTransitions(): Array<any> {
        return this.lastTakenTransition ? new Array<any>(this.lastTakenTransition) : new Array<any>();
    }

    // Executes one "iteration" of the machine. Returns true if the new state is final.
    step(): boolean {
        let symbol = this.readTape();
        let transitionToTake: TuringTransition = null;
        let that = this;

        // We search for a transition corresponding to the current state and tape symbol.
        for (let t of this.transitions) {
            if (t.startState == that.currentState && t.tapeSymbol == symbol) {
                transitionToTake = t;
            }
        }

        // No transition found : the machine should halt.
        if (!transitionToTake) return true;

        // 1 - Go to new state.
        this.setCurrentState(transitionToTake.endState);

        // 2 - Writing the symbol to tape.
        this.writeTape(transitionToTake.writeSymbol);

        // 3 - Moving the tape head.
        if (transitionToTake.movement == TapeMovement.Left) {
            this.moveTapeHeadLeft();
        } else if (transitionToTake.movement == TapeMovement.Right) {
            this.moveTapeHeadRight();
        }

        // Setting last taken transitions
        this.lastTakenTransition = transitionToTake;

        // 4 - Checking if new state is final.
        return this.isAcceptingState(this.currentState);
    }
}