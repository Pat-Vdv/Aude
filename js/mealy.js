(function (pkg) {
    "use strict";

    pkg.Mealy = function (states, initialState, inputAlphabet, outputAlphabet, transition, output) {
        this.initialState   = initialState;
        this.states         = states         || new Set();
        this.inputAlphabet  = inputAlphabet  || new Set();
        this.outputAlphabet = outputAlphabet || new Set();
        this.transition     = transition     || new Map();
        this.output         = output         || new Map();
    };

    pkg.Mealy.prototype = {
        getStates: function () {
            return this.states;
        },

        getOutput: function (state) {
            if (state === undefined) {
                return this.output;
            }

            return this.output.get(state);
        },

        // Returns the next state of the machine
        // and produces an output value form the current state and the current input
        next: function (state, inputSymbol) {
            var nextState = this.transition.get([state, inputSymbol]);
            var output = this.output.get([state, inputSymbol]);
            return [nextState, output];
        },

        // Execution of the mealy machine M: produces a sequence of outputs
        execute: function (word) {
            var totalOutput = [];
            //we start at initial_state
            var S = this.initial_state;

            // execution
            for (var i = 0; i < word.length; i++) {
                // we take one by one
                var input = word[i];
                // N is an array containing the next state
                // and an output
                var N = this.next(S, input);
                //console.log("ici", N, S, input);
                S = N[0];
                totalOutput[i] = N[1];
            }
            return totalOutput;
        },

        // Adds a state to the mealy machine
        addState: function (state) {
            if ( this.states === undefined ) {
                this.states = new Set();
            }
            this.states.add(state);
        },

        // Defines the initial state of the mealy machine
        setInitialState: function (state) {
            this.addState(state);
            this.initialState = state;
        },

        // Returns the initial state of the moore machine
        getInitialState: function (state) {
            return this.initialState;
        },

        // Adds a letter to the input alphabet of the moore machine
        addInputSymbol: function (s) {
            this.inputAlphabet.add(s);
        },

        // Adds a letter to the output alphabet of the moore machine
        addOutputSymbol: function (s) {
            this.outputAlphabet.add(s);
        },

        getInputAlphabet: function () {
            return this.inputAlphabet;
        },

        getOutputAlphabet: function () {
            return this.outputAlphabet;
        },

        setInputAlphabet: function (alphabet) {
            this.inputAlphabet = alphabet.copy();
        },

        setOutputAlphabet: function (alphabet) {
            this.outputAlphabet = alphabet.copy();
        },

        getTransition: function (stateSymb) {
            if (stateSymb) {
                return this.transition.get(stateSymb);
            }
            return this.transition;
        },

        // Adds a transition to the transition function
        addTransition: function (startState, s, destState) {
            this.addState(startState);
            this.addInputSymbol(s);
            this.addState(destState);

            this.transition.set([startState, s], destState);
        },

        // Adds an output to the output function
        setOutput: function (startState, inputSymbol, outputSymbol) {
            this.addState(startState);
            this.addInputSymbol(inputSymbol);
            this.addOutputSymbol(outputSymbol);
            this.output.set([startState, inputSymbol], outputSymbol);
        }
    };
}(this));

