(function (pkg) {
    "use strict";

    pkg.Moore = function (states, initialState, inputAlphabet, outputAlphabet, transition, output) {
        this.initialState   = initialState;
        this.states         = states         || new Set();
        this.inputAlphabet  = inputAlphabet  || new Set();
        this.outputAlphabet = outputAlphabet || new Set();
        this.transition     = transition     || new Map();
        this.output         = output         || new Map();
    };

    pkg.Moore.prototype = {
        getStates: function () {
            return this.states;
        },

        getOutput: function (state) {
            if (state === undefined) {
                return this.output;
            }

            return this.output.get(state);
        },

        // Returns the next state of the machine and an output value from the current state
        next: function (state, symbol) {
            var nextState = this.transition.get([state, symbol]);
            var output = this.output.get(nextState);
            return [nextState, output];
        },

        // Execution of the moore machine M: produces a sequence of outputs
        execute: function (word) {
            var totalOutput = [];
            //we start at initial_state
            var S = this.initial_state;
            totalOutput[0] = this.output.get(S);
            // execution
            for (var i = 0; i < word.length; i++)
            {
                var input = word[i];
                var N = this.next(S, input);
                S = N[0];
                totalOutput[i+1] = N[1];
            }

            return totalOutput;
        },

        // Adds a state to the moore machine
        addState: function (state) {
            this.states.add(state);
        },

        // Defines the initial state of the moore machine
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
            this.inputAlphabet = alphabet;
        },

        setOutputAlphabet: function (alphabet) {
            this.outputAlphabet = alphabet;
        },

        getTransition: function (stateSymb) {
            if (stateSymb) {
                return this.transition.get(stateSymb);
            }
            return this.transition;
        },

        // Adds a transition to the transition function
        addTransition: function (startState, inputSymbol, destState) {
            this.addState(startState);
            this.addInputSymbol(inputSymbol);
            this.addState(destState);

            this.transition.set([startState, inputSymbol], destState);
        },

        // Adds an output to the output function
        setOutput: function (state, symbol) {
            this.addState(state);
            this.addOutputSymbol(symbol);
            this.output.set(state, symbol);
        }
    };
}(this));


