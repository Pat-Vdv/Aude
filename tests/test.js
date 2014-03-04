function evalAudeScript(s) {
    try {
        return eval(Audescript.toPureJS(s));
    } catch (e) {
        return e;
    }
}

function doTests(testCorrect, testFailed, testFailInfo) {
   var tests = {
      "1": // test minimization
         automataAreEquivalent(
            minimize(
               object2automaton({
                  "states": ["1","4","7"],
                  "finalStates": ["1","2","3","5","6"],
                  "transitions": [
                     ["1","b","4"],
                     ["1","a","2"],
                     ["4","b","4"],
                     ["4","a","5"],
                     ["7","a","7"],
                     ["7","b","7"],
                     ["2","a","3"],
                     ["2","b","5"],
                     ["3","a","3"],
                     ["3","b","6"],
                     ["5","b","7"],
                     ["5","a","6"],
                     ["6","b","7"],
                     ["6","a","6"]
                  ]
               })
            ),
            object2automaton({
               "states": ["{1}","{4}","{7}"],
               "finalStates": ["{1}","{2,3}","{5,6}"],
               "transitions": [
                  ["{1}","b","{4}"],
                  ["{1}","a","{2,3}"],
                  ["{4}","b","{4}"],
                  ["{4}","a","{5,6}"],
                  ["{7}","a","{7}"],
                  ["{7}","b","{7}"],
                  ["{2,3}","a","{2,3}"],
                  ["{2,3}","b","{5,6}"],
                  ["{5,6}","b","{7}"],
                  ["{5,6}","a","{5,6}"]
               ]
            })
         ),
      "2": // test transition function
         (function() {
            var o, A = object2automaton(o = {
               "states": ["1","4","7"],
               "finalStates": ["1","2","3","5","6"],
               "transitions": [
                  ["1","b","4"],
                  ["1","a","2"],
                  ["4","b","4"],
                  ["4","a","5"],
                  ["7","a","7"],
                  ["7","b","7"],
                  ["2","a","3"],
                  ["2","b","5"],
                  ["3","a","3"],
                  ["3","b","6"],
                  ["5","b","7"],
                  ["5","a","6"],
                  ["6","b","7"],
                  ["6","a","6"]
                  ]
            });
            var f = A.getTransitionFunction(true);
            for(var i=0; i < o.transitions.length; ++i) {
               if(
                  f(
                     Set.prototype.getValue(o.transitions[i][0]),
                     Set.prototype.getValue(o.transitions[i][1])
                  ) !== Set.prototype.getValue(o.transitions[i][2])
               ) {
                  testFailInfo("2",
                     "f(" +
                        o.transitions[i][0] +
                        "," +
                        o.transitions[i][1]
                     + ") is " +
                        Set.prototype.elementToString(f(o.transitions[i][0], o.transitions[i][1])) +
                        ' instead of ' +
                        o.transitions[i][2]
                  );
                  return false;
               }
            }
            return true;
         })(),
      "3": automataAreEquivalent(object2automaton({
            "states": ["1","2","4","5"],
            "finalStates": ["3"],
            "transitions": [
               ["1","5","4"],
               ["1","6","3"],
               ["2","5","5"],
               ["2","6","3"],
               ["4","5","2"],
               ["4","6","4"],
               ["5","5","5"],
               ["5","6","5"],
               ["3","5","4"],
               ["3","6","3"]
            ]
         }), minimize(object2automaton({
            "states": ["1","2","4","5"],
            "finalStates": ["3"],
            "transitions": [
               ["1","5","4"],
               ["1","6","3"],
               ["2","5","5"],
               ["2","6","3"],
               ["4","5","2"],
               ["4","6","4"],
               ["5","5","5"],
               ["5","6","5"],
               ["3","5","4"],
               ["3","6","3"]
            ]
         }))
      ),
      "4":  Audescript.toPureJS('{"a":(f)(),"b":f}') === '{"a":(f)(),"b":f}',
      "5":  evalAudeScript("(function(){const [a,b,c] = [1,2,3]; return a === 1 && b === 2 && c === 3;})()"),
      "6":  (function(){try{eval(Audescript.toPureJS("(function(){const [a,b,c] = [1,2,3]; a =2;})()"))}catch(e){return true;} return false;})(),
      "7":  evalAudeScript("(function(){let [a,,c] = [1,2,3];return [a,c]})().toString() === '1,3'"),
      "8":  evalAudeScript("1+2 belongsTo {3}"),
      "9":  evalAudeScript("3 belongsTo {1} union {3}"),
      "10": evalAudeScript("Tuple(1,2,3) != Tuple(1,Tuple(2,3))"),
      "11": evalAudeScript("Tuple(1,2,3) == Tuple(Tuple(1,2),3)"),
      "12": evalAudeScript("{Tuple(1,2,3)} == {1} cross {2} cross {3}"),
      "13": evalAudeScript("1 belongsTo {0,1} belongsTo {true,false}"),
      "14": evalAudeScript("({3} contains 1+2) === true"),
      "15": evalAudeScript("({1} union {3} contains 1) === true"),
      "16": evalAudeScript("((a, b) => a + b)(10, 32) === 42"),
      "17": evalAudeScript("(a => a + 10)(32) === 42"),
      "18": evalAudeScript("1 == 2 || 1 == 1")
   };

   tryParse = [
      "../algos/automaton2json.ajs",
      "../algos/automaton2regex.ajs",
      "../algos/complementation.ajs",
      "../algos/completion.ajs",
      "../algos/determinization.ajs",
      "../algos/determinize.ajs",
      "../algos/differentiability.ajs",
      "../algos/emptyLanguage.ajs",
      "../algos/epsElim.ajs",
      "../algos/equivalence.ajs",
      "../algos/infiniteLanguage.ajs",
      "../algos/minimization.ajs",
      "../algos/mirror.ajs",
      "../algos/normalization.ajs",
      "../algos/product.ajs",
      "../algos/regex2automaton.ajs",
      "../algos/regex2minautomaton.ajs",
   ];

   function parse(f) {
      try {
         eval(Audescript.toPureJS(fs.readFileSync(f, 'utf8')));
         return "OK";
      } catch (e) {
         return "Failed (" + e + ")\n" + e.stack;
      }
   }

   for (var i in tryParse) {
      console.log("Parsing " + tryParse[i] + ": " + parse(tryParse[i]));
   }

   for (var i in tests) {
      if(tests.hasOwnProperty(i)) {
         if(tests[i] === true) {
            testCorrect(i);
         }
         else {
            testFailed(i, tests[i] !== false ? tests[i] : null);
         }
      }
   }
}

getNeeds([
  'minimization',
  'equivalence',
  'automaton2json'
]);

function testCorrect(i) {
   console.log("Test " + i + ": OK");
}

function testFailed(i, e) {
   console.log("Test " + i + ": Failed" + (e ? ', got : ' + e : ''));
}

function testFailInfo(n, s) {
   console.log("Test " + n + ": info: " + s);
}
doTests(testCorrect, testFailed, testFailInfo);