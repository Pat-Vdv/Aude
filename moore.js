// source : http://www.jflap.org/tutorial/mealy/mooreExamples.html
// returns a sequence containing the output of a Moore machine

//insatiation of a new moore machine
// a machine that halves a binary number
var statesEx = new Set(["00","01","10","11"]);
var initial_stateEx = "00";
var inputAlphEx = new Set(["0","1"]);
var outputAlphEx = new Set(["0","1"]);
let transitionEx = new Map();
transitionEx.set(["00","0"],"00"); transitionEx.set(["00","1"],"01");
transitionEx.set(["01","0"],"10"); transitionEx.set(["01","1"],"11");
transitionEx.set(["10","0"],"00"); transitionEx.set(["10","1"],"01");
transitionEx.set(["11","0"],"10"); transitionEx.set(["11","1"],"11");

let outputEx = new Map([
    ["00","0"],
    ["01","0"],
    ["10","1"],
    ["11","1"]
]);

//defining the class Mealy
function Moore ( states, initial_state, input_alphabet, output_alphabet, transition, output)
{
    // adding object properties
    this.states = states;
    this.initial_state = initial_state;
    this.input_alphabet = input_alphabet;
    this.output_alphabet = output_alphabet;
    this.transition = transition;
    this.output = output;
}

// this method returns the next state of the machine
// and an output value from the current state
Moore.prototype.next = function(currentState, currentInput)
{
    var next_state = this.transition.get([currentState,currentInput]);
    var output = this.output.get(next_state);
    return [next_state, output];
};

// execution of the moore machine M
// produces a sequence of outputs
Moore.prototype.execute = function (word)
{
    var total_output = [];
    //we start at initial_state
    var S = this.initial_state;
    total_output[0]="0";
    // execution
    for (var i = 0; i<word.length; i++)
    {
        var input = word[i];
        var N = this.next(S, input);
        S = N[0];
        total_output[i+1]=N[1];
    }

    return total_output;
};


var moore1 = new Moore (statesEx, initial_stateEx, inputAlphEx, outputAlphEx, transitionEx, outputEx);

// execution example
var resultat = moore1.execute(["1","0"]);
