// source : http://www.jflap.org/tutorial/mealy/mooreExamples.html
// returns a sequence containing the output of a Moore machine

//insatiation of a new moore machine
// a machine that halves a binary number
var statesExx = new Set(["00","01","10","11"]);
var initial_stateExx = "00";
var inputAlphExx = new Set(["0","1"]);
var outputAlphExx = new Set(["0","1"]);
let transitionExx = new Map();
transitionExx.set(["00","0"],"00"); transitionExx.set(["00","1"],"01");
transitionExx.set(["01","0"],"10"); transitionExx.set(["01","1"],"11");
transitionExx.set(["10","0"],"00"); transitionExx.set(["10","1"],"01");
transitionExx.set(["11","0"],"10"); transitionExx.set(["11","1"],"11");

let outputExx = new Map([
    ["00","0"],
    ["01","0"],
    ["10","1"],
    ["11","1"]
]);


var moore1 = new Moore (statesExx, initial_stateExx, inputAlphExx, outputAlphExx, transitionExx, outputExx);

// execution example
var resultat = moore1.execute(["1","0"]);



//******************************************************************************

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
var mealy2obj = {
    "states": ["q0","q1","q2"],
    "initialState": "q0",
    "inputAlph": ["0","1"],
    "outputAlph": ["0","1"],
    "transitions":[
       ["q0","0","q1"],   ["q0","1","q2"],
       ["q1","0","q1"],   ["q1","1","q2"],
       ["q2","0","q1"],   ["q2","1","q2"]
     ],
    "outputs":[
       ["q0","0","0"],   ["q0","1","0"],
       ["q1","0","0"],   ["q1","1","1"],
       ["q2","0","1"],   ["q2","1","0"]
    ]
}
// source for the following example http://www.vlsifacts.com/mealy-to-moore-and-moore-to-mealy-transformation/

var mealy3obj = {
    "states": ["q0","q1"],
    "initialState": "q0",
    "inputAlph": ["0","1"],
    "outputAlph": ["A","B"],
    "transitions":[
       ["q0","0","q0"],  ["q0","1","q1"],
       ["q1","0","q1"],  ["q1","1","q0"]
     ],
    "outputs":[
       ["q0","0","A"],  ["q0","1","A"],
       ["q1","0","B"],  ["q1","1","B"]
    ]
}


























