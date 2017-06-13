// definition of a Mealy object
(function (pkg) {
    "use strict";


//defining the class Mealy
  pkg.Mealy = function ( states, initial_state, input_alphabet, output_alphabet, transition, output ) {
    // adding object properties
    this.states = states;
    this.initial_state = initial_state;
    this.input_alphabet = input_alphabet;
    this.output_alphabet = output_alphabet;
    this.transition = transition;
    this.output = output;
  };

pkg.Mealy.prototype ={

    // adding a method for Mealy
    // returns the next state of the machine
    // and produces an output value form the current state and the current input
    next: function(currentState, currentInput)
    {
        var next_state = this.transition.get([currentState,currentInput]);
        var output = this.output.get([currentState,currentInput]);
        return [next_state,output];
    },

    // execution of the mealy machine M
    // produces a sequence of outputs
    execute: function (word)
    {
        var total_output = [];
        //we start at initial_state
        var S = this.initial_state;

        // execution
        for (var i = 0; i<word.length; i++)
        {
            // we take one by one
            var input = word[i];
            // N is an array containing the next state
            // and an output
            var N = this.next(S, input);
            //console.log("ici", N, S, input);
            S = N[0];
            total_output[i]=N[1];
        }
        return total_output;
    },

    // adds a state to the mealy machine
    addState: function (state){
        if ( this.states === undefined ) {
            this.states = new Set();
        }
        this.states.add(state);
    },

    // defines the initial state of the mealy machine
    initialState: function (state){
        this.initial_state=state;
    },

    // adds a letter to the input alphabet of the mealy machine
    addInAlphabet: function (word) {
         if ( this.input_alphabet === undefined ) {
            this.input_alphabet = new Set();
         }
            this.input_alphabet.add(word);
    },

    // adds a letter to the output alphabet of the mealy machine
    addOutAlphabet: function(word){
        if ( this.output_alphabet === undefined ) {
            this.output_alphabet = new Set();
        }
        this.output_alphabet.add(word);
    },

    // adds a transition to the transition function
    addTransition: function(t1, t2, t3){
        if ( this.transition === undefined ) {
            this.transition = new Map();
        }
        this.transition.set([t1,t2],t3);
    },

    // adds an output to the output function
    addOutput: function(o1,o2,o3){
        if ( this.output === undefined ) {
            this.output = new Map();
        }
        this.output.set([o1,o2],o3);
    }
};

pkg.Mealy = Mealy;

}(this));

