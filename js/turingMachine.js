(function (pkg) {
    "use strict";

    // "Enum" for tape movement symbols.
    const tape_movement = {
        left: "<",
        right: ">",
        none: "-"
    };

    const NO_WRITE_SYMBOL = "-";

    // Class that represents a transition of a Turing machine.
    pkg.TuringTransition = class {
        constructor(startState, tapeSymbol, endState, writeSymbol, movement) {
            this.startState = startState;
            this.tapeSymbol = tapeSymbol;
            this.endState = endState;
            this.writeSymbol = writeSymbol;
            this.movement = movement;
        }

        toString() {
            return "Transition(" +
                aude.elementToString(this.startState) + ", " +
                aude.elementToString(this.tapeSymbol) + ", " +
                aude.elementToString(this.endState) + ", " +
                aude.elementToString(this.writeSymbol) + ", " +
                aude.elementToString(this.movement) +
                ")";
        }
    };

    pkg.TuringTransition.prototype.serializeElement = pkg.TuringTransition.prototype.toString;

    // Class to handle (Deterministic) Turing Machine Automata.
    pkg.TuringMachine = class {
        constructor(states, tapeAlphabet, qInit, transitions, finalStates, emptyTapeValue) {
            this.states = states || new Set();
            this.tapeAlphabet = tapeAlphabet || new Set();
            this.transitions = transitions || new Set();
            this.qInit = qInit;
            this.emptyTapeValue = emptyTapeValue || "0";
            this.finalStates = finalStates || new Set();

            this.setCurrentState(qInit);

            this.tape = [this.emptyTapeValue];
            this.tapePosition = 0;

            this.lastTakenTransition = new Set();
        };

        /* Tape head management */
        moveTapeHeadLeft() {
            // If at start of array, we shift the whole array right to add a new space.
            if (this.tapePosition == 0) {
                this.tape.unshift(this.emptyTapeValue);
                return;
            }
            this.tapePosition--;
        }

        moveTapeHeadRight() {
            // If at end of array, we add a new empty space.
            if (this.tapePosition == this.tape.length - 1) {
                this.tape.push(this.emptyTapeValue);
            }
            this.tapePosition++;
        }

        readTape() {
            return this.tape[this.tapePosition];
        }

        // Reads from tape at a given position. Returns default if position is out of bounds.
        readTapeAt(position) {
            if (position >= 0 && position < this.tape.length) {
                return this.tape[position];
            } else {
                return this.emptyTapeValue;
            }
        }

        writeTape(symbol) {
            // Symbol is undefined, doesn't exist in alphabet or is "no write" symbol : don't do anything.
            if (!symbol || !this.tapeAlphabet.has(symbol)
                || symbol === NO_WRITE_SYMBOL) return;

            this.tape[this.tapePosition] = symbol;
        }

        /* State management */
        isOnFinalState() {
            return this.isStateFinal(this.currentState);
        }

        addState(state, final) {
            this.states.add(state);
            if (final) {
                this.finalStates.add(state);
            }
        }

        popState(state) {
            this.states.remove(state);
            this.finalStates.remove(state);

            this.transitions.forEach(
                function (trans) {
                    if (trans.startState == state || trans.endState == state) {
                        this.transitions.remove(trans);
                    }
                }
            )
        }

        hasState(state) {
            return this.states.has(state);
        }

        getStates() {
            return this.states;
        }

        /* Tape Alphabet Management */
        // Adds set of symbols to tape alphabet.
        addToAlphabet(symbols) {
            this.tapeAlphabet.unionInPlace(symbols);
        }

        // Removes set of symbols from tape alphabet.
        removeFromAlphabet(symbols) {
            this.tapeAlphabet.minusInPlace(symbols);
        }

        getTapeAlphabet() {
            return this.tapeAlphabet;
        }

        // Adds single symbol to tape alphabet.
        addSymbol(symbol) {
            this.tapeAlphabet.add(symbol);
        }

        // Removes single symbol from tape alphabet.
        removeSymbol(symbol) {
            this.tapeAlphabet.remove(symbol);
        }

        // Returns true if symbol is in tape alphabet.
        symbolExists(symbol) {
            return this.tapeAlphabet.has(symbol);
        }

        /* Transition Management */
        // Adds transition to transition list.
        // Also adds its symbols and states to the alphabet and state list.
        addTransition(startState, tapeSymbol, endState, writeSymbol, movement) {
            this.addState(startState);
            this.addState(endState);
            this.addSymbol(tapeSymbol);
            this.addSymbol(writeSymbol);
            this.transitions.add(
                new pkg.TuringTransition(startState, tapeSymbol, endState, writeSymbol, movement)
            );
        }

        getTransitions() {
            return this.transitions;
        } 

        /* Initial & Final State(s) Management */
        setInitialState(state) {
            this.addState(state);
            this.qInit = state;
        }

        getInitialState() {
            return this.qInit;
        }

        addFinalState(state) {
            this.addState(state, true);
        }

        setStateFinal(state) {
            this.addState(state, true);
        }

        setStateNonFinal(state) {
            this.finalStates.remove(state);
        }

        getFinalStates() {
            return this.finalStates;
        }

        isAcceptingState(state) {
            return this.finalStates.has(state);
        }

        setCurrentState(state) {
            this.states.add(state);
            this.currentState = state;
        }

        getCurrentStates() {
            return [this.currentState];
        }

        placeWordOnTape(word) {
            for (let i = 0; i < word.length; i++) {
                this.tape[i] = word.charAt(i);
            }
            // We remove all leftover chars from previous words.
            this.tape.splice(word.length);
            this.tapePosition = 0;
        }

        getTape() {
            return this.tape;
        }

        getTapePosition() {
            return this.tapePosition;
        }

        getLastTakenTransitions() {
            return this.lastTakenTransition;
        }

        // Executes one "iteration" of the machine. Returns true if the new state is final.
        step() {
            let symbol = this.readTape();
            let transitionToTake;
            let transitionFound = false;
            let that = this;

            // We search for a transition corresponding to the current state and tape symbol.
            this.transitions.forEach(
                function (t) {
                    if (t.startState == that.currentState && t.tapeSymbol == symbol) {
                        transitionToTake = t;
                        transitionFound = true;
                    }
                }
            );
            // No transition found : the machine halts.
            if (!transitionFound) return true;
            
            // 1 - Go to new state.
            this.setCurrentState(transitionToTake.endState);

            // 2 - Writing the symbol to tape.
            this.writeTape(transitionToTake.writeSymbol);

            // 3 - Moving the tape head.
            if (transitionToTake.movement == tape_movement.left) {
                this.moveTapeHeadLeft();
            } else if (transitionToTake.movement == tape_movement.right) {
                this.moveTapeHeadRight();
            }

            // Setting last taken transitions.
            this.lastTakenTransition.clear();
            this.lastTakenTransition.add(transitionToTake);

            // 4 - Checking if new state is final.
            return this.isAcceptingState(this.currentState);
        }
    };
}(this));