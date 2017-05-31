// source : http://www.jflap.org/tutorial/mealy/mealyExamples.html
// returns a sequence containing the output of a Mealy machine

//insatiation of a new mealy machine
// a vending machine that dispenses 20 cents candy bars
var statesEx = new Set(["0c","5c","10c","15c"]);
var initial_stateEx = "0c";
var inputAlphEx = new Set(["n","d","q"]);
var outputAlphEx = new Set(["c0","c1","c2","c3","c4"]);

let transitionEx = new Map();
transitionEx.set(["0c","n"],"5c"); transitionEx.set(["0c","d"],"10c"); transitionEx.set(["0c","q"],"0c");
transitionEx.set(["5c","n"],"10c"); transitionEx.set(["5c","d"],"15c"); transitionEx.set(["5c","q"],"0c");
transitionEx.set(["10c","n"],"15c"); transitionEx.set(["10c","d"],"0c"); transitionEx.set(["10c","q"],"0c");
transitionEx.set(["15c","n"],"0c"); transitionEx.set(["15c","d"],"0c"); transitionEx.set(["15c","q"],"0c");

let outputEx = new Map();
outputEx.set(["0c","n"],""); outputEx.set(["0c","d"],""); outputEx.set(["0c","q"],"c1");
outputEx.set(["5c","n"],""); outputEx.set(["5c","d"],""); outputEx.set(["5c","q"],"c2");
outputEx.set(["10c","n"],""); outputEx.set(["10c","d"],"c0"); outputEx.set(["10c","q"],"c3");
outputEx.set(["15c","n"],"c0"); outputEx.set(["15c","d"],"c1"); outputEx.set(["15c","q"],"c4");


//defining the class Mealy
function Mealy ( states, initial_state, input_alphabet, output_alphabet, transition, output )
{
    // adding object properties
    this.states = states;
    this.initial_state = initial_state;
    this.input_alphabet = input_alphabet;
    this.output_alphabet = output_alphabet;
    this.transition = transition;
    this.output = output;
};

// adding a method for Mealy
// returns the next state of the machine
// and produces an output value form the current state and the current input
Mealy.prototype.next = function(currentState, currentInput)
{
    var next_state = this.transition.get([currentState,currentInput]);
    var output = this.output.get([currentState,currentInput]);
    return [next_state,output];
};

// execution of the mealy machine M
// produces a sequence of outputs
Mealy.prototype.execute = function (word)
{
    var total_output = [];
    //we start at initial_state
    S = this.initial_state;

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
};


var mealy1 = new Mealy (statesEx, initial_stateEx, inputAlphEx, outputAlphEx, transitionEx, outputEx);

// execution example
var result = mealy1.execute(["d","d"]);

/*m = new Map()
Object { f: f() }
m.set([1,2], 3)
undefinedm = new Map()
Object { f: f() }
m.set([1,2], 3)
undefined
m.get([1,2])
3
m.get([1,2])
3*/
/*
let s = new Set([1,2,3])
undefined
for (let e of s){ console.log(e); }
1
2
3
 */
