/*
    Copyright (c)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function (pkg) {
    // Transform a string ((a, b), (c, d), ...) to a set
    pkg.str2Set = function (set, nbElements) {
        if (nbElements === 2 || nbElements === undefined) {
            if (typeof set === "string") {
                var setT = new Set(); // The true set
                var str = "" ;

                while (/\( *([^,\(\)\{\} ]+) *, *([^,\(\)\{\} ]+) *\)/.test(set)) {
                    /\( *([^,\(\)\{\} ]+) *, *([^,\(\)\{\} ]+) *\)/.exec(set);
                    str = "(" + RegExp.$1 + ", " + RegExp.$2 + ")";
                    set = set.replace(
                        /\( *([^,\(\)\{\} ] + ) *, *([^,\(\)\{\} ]+) *\)/,
                        ""
                    );
                    setT.add(str);
                }

                return setT;
            }

            return set;
        } else if (nbElements === 1) {
            if (typeof set === "string") {
                var setT = new Set(); // The true set
                var str = "" ;
                while (/\(? *([^,\(\)\{\} ]+) *\)? *,?/.test(set)) {
                    /\(? *([^,\(\)\{\} ]+) *\)? *,?/.exec(set);
                    str = "(" + RegExp.$1 + ")";
                    set = set.replace(/\(? *([^,\(\)\{\}]+) *\)? *,?/, "");
                    setT.add(str);
                }
                return setT;
            }
            return set;
        }
    }

    // Return true if the setL is include in the setB (the elements have this
    //form (a, b), (c, d) if nbElements = 2)
    pkg.setInclude = function (setL, setB, nbElements) {
        var pres= false, final = true, a, b, c, d;
        if (nbElements === 2 || nbElements === undefined) {
            for (var eleL of setL) {
                /(\d)+,(\d)+/.exec(eleL);
                a = RegExp.$1;
                b = RegExp.$2;

                for (var eleB of setB) {
                    /\((\d+),(\d+)\)/.exec(eleB);
                    c = RegExp.$1;
                    d = RegExp.$2;
                    if (eleL === eleB || (a === d && b === c)) {
                        pres = true;
                    }
                }

                final = final && pres;
                pres = false;
            }
            return final;
        }

        if (nbElements === 1) {
            for (var eleL of setL) {
                for (var eleB of setB) {
                    if (eleL === eleB) {
                        pres = true;
                    }
                }
                final = final && pres;
                pres = false;
            }
            return final;
        }
    }

    // Return true if 2 sets are identical ((0, 1) and (1, 0) are considered identical)
    pkg.identicalSets = function (seta, setb, nbElements) {
        setb = str2Set(String(setb), nbElements); // transform to a Set
        seta = str2Set(String(seta), nbElements);

        return (
            setInclude(seta, setb, nbElements) &&
            setInclude(setb, seta, nbElements)
        );
    }

    // Convert an SVG code to an automaton.
    // Used to validate a quiz.
    pkg.svg2automaton = function (svg) {
        var div  = document.createElement("div");
        var designer = new AudeDesigner(div, true);
        document.getElementById("div-quiz").appendChild(div);
        div.display = "none";
        designer.setAutomatonCode(svg);
        var A = designer.getAutomaton(designer.currentIndex);
        document.getElementById("div-quiz").removeChild(div);
        return A;
    }
}(window));

(function (pkg, that) {
    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    // List of all the question
    var underTypeQuestionList = [
        "complement", "complete", "product", "minimize", "equivalenceStates",
        "equivalencyAutomata", "automaton2Table", "table2Automaton",
        "reachable", "coreachable", "word", "determinize",
        "determinize_minimize", "eliminate", "determinize_eliminate",
        "automaton2RE", "RE2automaton", "grammar2Automaton",
        "automaton2Grammar", "leftGrammar2RightGrammar", "mcq1", "mcq2", "mcq3",
        "mcq4", "mcq5", "mcq6", "recognizeLanguageAutomaton",
        "recognizeLanguageRE"
    ];

    // Need automaton for the response
    var underTypeQuestionNeedAutomaton = [
        "complement", "complete", "product", "minimize", "determinize",
        "determinize_minimize", "eliminate", "determinize_eliminate",
        "RE2automaton", "grammar2Automaton", "recognizeLanguageAutomaton"
    ];

    // Need automaton for the wording
    var underTypeQuestionNeedAutomatonWording = [
        "complement", "complete", "product", "minimize", "equivalenceStates",
        "equivalencyAutomata", "automaton2Table", "reachable", "coreachable",
        "word", "determinize", "determinize_minimize", "eliminate",
        "determinize_eliminate", "automaton2RE", "automaton2Grammar"
    ];

    // For the creation of the automaton
    var createAutomatonCoreachable = null;

    // The algorithm for the automatic correction
    var complete                      = null;
    var isCompleted                   = null;
    var automataAreEquivalent         = null;
    var product                       = null;
    var minimize                      = null;
    var isMinimized                   = null;
    var complement                    = null;
    var distinguableStates            = null;
    var notDistinguableStates         = null;
    var coreachableStates             = null;
    var reachableStates               = null;
    var automaton2HTMLTable           = null;
    var createTable                   = null;
    var HTMLTable2automaton           = null;
    var smallerWord                   = null;

    /*Chapter 2*/
    var determinize                   = null;
    var isDeterminized                = null;

    /*Chapter 3*/
    var epsElim                       = null;
    var hasEpsilonTransitions         = null;

    /*Chapter 4*/
    var regexToAutomaton              = null;
    var automatonToRegex              = null;

    /*Chapter 5*/
    var leftLinear2RightLinearGrammar = null;
    var rightLinear2LeftLinearGrammar = null;
    var linearGrammar2Automaton       = null;
    var automaton2RightLinearGrammar  = null;
    var isLeftLinear                  = null;

    pkg.loadPrograms = function () {
        window.AudeGUI.Runtime.loadIncludes([
            "completion", "equivalence", "product", "minimization",
            "complementation", "distinguishability", "coreachability",
            "reachability", "automaton2htmltable", "htmltable2automaton",
            "createAutomaton", "smallerWord", "determinization",
            "epsElimination", "regex2automaton", "automaton2regex",
            "automaton2RightLinearGrammar", "linearGrammar2Automaton",
            "leftLinear2RightLinearGrammar", "rightLinear2LeftLinearGrammar"
        ], function () {
            createAutomatonCoreachable = audescript.m("createAutomaton").createAutomatonCoreachable;
            complete = audescript.m("completion").complete;
            isCompleted = audescript.m("completion").isCompleted;
            automataAreEquivalent = audescript.m("equivalence").automataAreEquivalent;
            product = audescript.m("product").product;
            minimize = audescript.m("minimization").minimize;
            isMinimized = audescript.m("minimization").isMinimized;
            complement = audescript.m("complementation").complement;
            distinguableStates = audescript.m("distinguishability").distinguableStates;
            notDistinguableStates = audescript.m("distinguishability").notDistinguableStates;
            coreachableStates = audescript.m("coreachability").coreachableStates;
            reachableStates = audescript.m("reachability").reachableStates;
            automaton2HTMLTable = audescript.m("automaton2htmltable").automaton2HTMLTable;
            createTable = audescript.m("htmltable2automaton").createTable;
            HTMLTable2automaton = audescript.m("htmltable2automaton").HTMLTable2automaton;
            determinize = audescript.m("determinization").determinize;
            isDeterminized = audescript.m("determinization").isDeterminized;
            smallerWord = audescript.m("smallerWord").smallerWord;
            epsElim = audescript.m("epsElimination").epsElim;
            hasEpsilonTransitions = audescript.m("epsElimination").hasEpsilonTransitions
            regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
            automatonToRegex = audescript.m("automaton2regex").automatonToRegex;
            leftLinear2RightLinearGrammar = audescript.m("leftLinear2RightLinearGrammar").leftLinear2RightLinearGrammar;
            rightLinear2LeftLinearGrammar = audescript.m("rightLinear2LeftLinearGrammar").rightLinear2LeftLinearGrammar;
            linearGrammar2Automaton = audescript.m("linearGrammar2Automaton").linearGrammar2Automaton;
            automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
            isLeftLinear = audescript.m("leftLinear2RightLinearGrammar").isLeftLinear;
        });
    };


    // Class Question: wording, typeQuestion, underTypeQuestion, automata if
    // needed, regex, a response, type of response, the response of the user
     pkg.Question =  function (underTypeQuestion, wording, typeQuestion, automaton, regex, grammar, response, typeResponse, userResponse) {
        this.underTypeQuestion = underTypeQuestion;

        // The wording of the question (create automatically or we can specify it)
        this.wording = wording || this.createWording(this.underTypeQuestion);

        if (!typeQuestion) {
            if (/^mcq/i.test(this.underTypeQuestion)) {
                this.typeQuestion = "mcq";
            } else if (this.underTypeQuestion === "automaton2regex") {
                this.typeQuestion = "RE";
            } else if (
                this.underTypeQuestion === "grammar2Automaton" ||
                this.underTypeQuestion === "leftGrammar2RightGrammar"
            ) {
                this.typeQuestion = "grammar";
            }

            for (var i = 0, l = underTypeQuestionNeedAutomatonWording.length; i < l; i++) {
                if (this.underTypeQuestion === underTypeQuestionNeedAutomatonWording[i]) {
                    this.typeQuestion = "automaton";
                }
            }
        } else if (
            typeQuestion !== "mcq" &&
            typeQuestion !== "RE" &&
            typeQuestion !== "automaton"
        ) {
            throw new Error("Error: creation of question impossible. typeQuestion:" + typeQuestion +" is not valid");
        } else {
            // The type of the question (mcq, Automaton, RE (Regular expression))
            this.typeQuestion = typeQuestion;
        }

        this.automaton = [null, null, null, null];
        var i = 0;

        if (automaton) {
            for (var auto of automaton) {
                this.automaton[i] = auto;
                i ++;
            }
        }

        this.response = response;
        this.typeResponse = typeResponse || this.answerMode();
        this.userResponse = userResponse;
        this.regex = regex;
        this.grammar = grammar;
    }

    pkg.Question.prototype = {
        // Get the response of the question
        getResponse : function () {
            return this.response;
        },

        // Multiple choices question

        // Create a mcq: wording, the chapter (1-6 or nothing), array choice,
        // array of solution, otherInfo: for the wording automata, grammar, re
        // Other Info not yet working
        createMCQ : function (wording, choices, response, otherInfo, chapter) {
            this.wording           = wording;
            this.typeQuestion      = "mcq";
            this.underTypeQuestion = "mcq" + (chapter||"");

            // An array of choices, choice is defined by an id and a text
            this.choices = choices;

            // An array with all the correct answers which corresponds to the id
            // of the choice
            this.response = response;

            // Other information
            if (otherInfo) {
                if (Array.isArray(otherInfo)) {
                    for (element of otherInfo) {
                        this.otherInfo.tab.push(element);
                    }
                } else {
                    this.otherInfo.tab.push(otherInfo)
                }

                // The type of element: Automaton, grammar, er(String)
                otherInfo.type = otherInfo[0].constructor.name;
            }
        },

        // Get the choices for the MCQ
        getChoices : function () {
            return this.choices;
        },

        getPossibilities : this.getChoices,

        // Create an automaton question
        // The type is the undertype question(minimize, complete...),
        // automataWording is an array of automata
        // Wording and response are created automatically or can be given
        createAutomatonQuestion : function (type, automataWording, wording, response) {
            this.typeQuestion = "automaton";
            this.underTypeQuestion = type;
            this.wording = wording || this.createWording();
            this.automaton = automataWording.slice();
            this.response = response || this.getResponse();
        },

        // Create an regular expression question
        // The type is the undertype question automata
        // Wording is an array of automata
        // Wording and response are create automatically or can be given
        createREQuestion : function (type, automataWording, wording, response) {
            this.typeQuestion = "RE";
            this.underTypeQuestion = type;
            this.wording = wording || this.createWording();
            this.automaton = automataWording.slice();
            this.response = response || this.getResponse();
        },

        // Create the wording corresponding to the type of question
        createWording: function (type) {
            switch (type || this.underTypeQuestion) {
                case "complement":
                    return _("Create the complementary automaton of the following automaton ");

                case "complete":
                    return _("Create the complete automaton of the following automaton ");

                case "product":
                    return _("Do the product of the following automata ");

                case "minimize":
                    return _("Minimize the following automaton ");

                case "equivalenceStates":
                    return _("Write the equivalent states of the following automaton ");

                case "equivalencyAutomata":
                    return _("Are the following automatons equivalent? ");

                case "automaton2Table":
                    return _("Fill the table corresponding to the automaton ");

                case "table2Automaton":
                    return _("Create the automaton corresponding to the table ");

                case "reachable":
                    return _("Write the reachable states of the following automaton");

                case "coreachable":
                    return _("Write the co-reachable states of the following automaton");

                case "word":
                    return _("Write a word recognized by the following automaton");

                case "determinize":
                    return _("Create the determinized automaton of the following automaton");

                case "determinize_minimize":
                    return _("Create the determinized and minimize automaton of the following automaton");

                case "eliminate":
                    return _("Eleminate the ε-transitions of the following automaton");

                case "determinize_eliminate":
                    return _("Eleminate the ε-transitions and determinize the following automaton");

                case "automaton2RE":
                    return _("Write the regular expression corresponding to the following automaton");

                case "RE2automaton":
                    return _("Give the automaton corresponding to the following RE");

                case "grammar2Automaton":
                    return _("Give the automaton corresponding to the following right linear grammar");

                case "automaton2Grammar":
                    return _("Give the linear grammar corresponding to the following automaton");

                case "leftGrammar2RightGrammar":
                    return _("Give the right linear grammar corresponding to the following left linear grammar");

                default:
                    return "";
            }
        },


        // Return true if the question needs to display an automaton for the wording
        needAutomatonQuestion: function () {
            for(var i = 0, l = underTypeQuestionNeedAutomatonWording.length; i < l; i++) {
                if (this.underTypeQuestion === underTypeQuestionNeedAutomatonWording[i]) {
                    return true;
                }
            }
            return false;
        },

        // Return true if the question needs 2 automata
        need2AutomataQuestion : function () {
            if (this.underTypeQuestion === "product" || this.underTypeQuestion === "equivalencyAutomata") {
                return true;
            }
            return false;
        },

        // Return true if the users need to create an automaton
        needAutomatonAnswers: function () {
            for (var i = 0, l = underTypeQuestionNeedAutomaton.length; i < l; i++) {
                if (this.underTypeQuestion === underTypeQuestionNeedAutomaton[i]) {
                    return true;
                }
            }
            return false;
        },

        // Return the answers type corresponding to the question: (automaton, re, mcq, table, input)
        answerMode: function () {
            switch (this.underTypeQuestion) {
                case "complement":
                case "complete":
                case "product":
                case "minimize":
                case "table2Automaton":
                case "determinize":
                case "determinize_minimize":
                case "eliminate":
                case "determinize_eliminate":
                case "RE2automaton":
                case "grammar2Automaton":
                case "recognizeLanguageAutomaton":
                    return "automaton";

                case "equivalenceStates":
                case "reachable":
                case "coreachable":
                case "word" :
                    return "input";

                case "automaton2Grammar":
                case "leftGrammar2RightGrammar":
                    // It's also an input
                    return "grammar";

                case "automaton2RE":
                case "recognizeLanguageRE":
                    return "re";

                case "equivalencyAutomata" :
                    return "radio";

                case "automaton2Table":
                    return "table";

                case "mcq1":
                    return "checkbox";

                default:
                    return "not defined";
            }
        },

        // Create the response with the algorithm and put it in the .response
         getResponse : function () {
            switch (this.underTypeQuestion) {
                case "complement":
                    return complement(this.automaton[0]);

                case "complete":
                    return complete(
                        this.automaton[0],
                        this.automaton[0].getAlphabet()
                    );

                case "minimize":
                    return minimize(
                        this.automaton[0],
                        this.automaton[0].getAlphabet()
                    );

                case "product":
                    return product(
                        this.automaton[0],
                        this.automaton[1],
                        false
                    );

                case "equivalenceStates":
                    return notDistinguableStates(this.automaton[0]);

                case "equivalencyAutomata":
                    return automataAreEquivalent(
                        this.automaton[0],
                        this.automaton[1]
                    );

                case "automaton2Table":
                    return automaton2HTMLTable(this.automaton[0]);

                case "table2Automaton":
                    return this.automaton[0];

                case "coreachable":
                    return coreachableStates(this.automaton[0]);

                case "reachable":
                    return reachableStates(this.automaton[0]);

                case "word":
                    return smallerWord(this.automaton[0]);

                case "determinize":
                    return determinize(this.automaton[0]);

                case "determinize_minimize":
                    return determinize(this.automaton[0], 1);

                case "eliminate":
                    return epsElim(this.automaton[0]);

                case "determinize_eliminate":
                    return determinize(epsElim(this.automaton[0]));

                case "automaton2RE":
                    return automatonToRegex(this.automaton[0]);

                case "RE2automaton":
                    return regexToAutomaton(this.regex)

                case "grammar2Automaton":
                    return linearGrammar2Automaton(this.grammar);


                case "automaton2Grammar":
                    // Return the string of the grammar
                    return automaton2RightLinearGrammar(this.automaton[0]).toString();

                case "leftGrammar2RightGrammar":
                    return leftLinear2RightLinearGrammar(this.grammar, 0).toString();

                case "mcq": // Can't correct automatically a mcq

                default:
                    return null;
            }
        },

        // Return true if the response is correct or false otherwise
        isCorrect: function () {
            response = this.response;

            // If the user needs to draw an automaton and didn't do it
            if (this.userResponse === undefined || this.userResponse === null) {
                return false;
            }

            switch (this.underTypeQuestion) {
                case "complete":
                    return (
                        automataAreEquivalent(response, this.userResponse) &&
                        isCompleted(this.userResponse)
                    );

                case "complement":
                case "product":
                case "table2Automaton":
                case "grammar2Automaton":
                    return automataAreEquivalent(response, this.userResponse);

                case "minimize":
                    return (
                        automataAreEquivalent(response, this.userResponse) &&
                        isMinimized(response, this.userResponse)
                    );

                case "determinize":
                    return (
                        automataAreEquivalent(response, this.userResponse) &&
                        isDeterminized(this.userResponse)
                    );

                case  "determinize_minimize":
                    return (
                        automataAreEquivalent(response, this.userResponse) &&
                        isDeterminized(this.userResponse) &&
                        isMinimized(this.userResponse)
                    );

                case "equivalenceStates":
                    return identicalSets(response, this.userResponse);

                case "equivalencyAutomata":
                    return this.userResponse === String(response);

                case "automaton2Table":
                    return automataAreEquivalent(
                        this.automaton[0],
                        HTMLTable2automaton(this.userResponse)
                    );

                case "coreachable":
                    return identicalSets(response, this.userResponse);

                case "reachable":
                    return identicalSets(response, this.userResponse, 1);

                case "word":
                    return this.automaton[0].acceptedWord(this.userResponse);

                case "eleminate":
                    return (
                        automataAreEquivalent(response, this.userResponse) &&
                        !hasEpsilonTransitions(this.userResponse)
                    );

                case "determinize_eliminate":
                    return (
                        automataAreEquivalent(response, this.userResponse) &&
                        !hasEpsilonTransitions(this.userResponse) &&
                        isDeterminized(this.userResponse)
                    );

                case "automaton2RE":
                    return automataAreEquivalent(
                        this.automaton[0],
                        regexToAutomaton(this.userResponse)
                    );

                case "RE2automaton":
                    return automataAreEquivalent(
                        this.response,
                        this.userResponse
                    );

                case "recognizeLanguageRE":
                    return automataAreEquivalent(
                        regexToAutomaton(this.response),
                        regexToAutomaton(this.userResponse)
                    );

                case "automaton2Grammar":
                    return automataAreEquivalent(
                        this.automaton[0],
                        linearGrammar2Automaton(this.userResponse)
                    );

                case "leftGrammar2RightGrammar":
                    // Compare the 2 automata generated by the grammars,
                    // and look if the given grammar is right linear
                    return (
                        automataAreEquivalent(
                            linearGrammar2Automaton(this.grammar),
                            linearGrammar2Automaton(this.userResponse)
                        ) && !isLeftLinear(this.userResponse)
                    );

                case  "mcq":
                case "mcq1":
                case "mcq2":
                case "mcq3":
                case "mcq4":
                case "mcq5":
                case "mcq6":
                    var bool;

                    if (this.response.length !== this.userResponse.length) {
                        // If the number of response is different
                        return false;
                    }

                    for (var i = 0, l = this.response.length;i<l;i++) {
                        // Look for each response
                        bool = false;
                        for (var j = 0, len = this.userResponse.length; j < len; j++) {
                            if (this.response[i] === this.userResponse[j]) {
                                bool = true;
                            }
                        }

                        if (!bool) {
                            return false;
                        }
                    }

                    return true;

                case "recognizeLanguageAutomaton":
                    // TODO Add specific property, (isDetermnized, isMinimized ...)
                    automataAreEquivalent(this.automaton[0], this.userResponse);
                    break;

                default:
                    // Not a specified question
                    break;
                }
        },

        // Settings for creation of automaton, there are arrays
        settingsCreateAutomaton : function (rand, st, al, fi, mo, tr) {
            this.nbrState = st.slice();

            // Use slice to copy an array
            this.alphabet = al.slice();
            this.nbrFinalStates = fi.slice();
            this.mode = mo.slice();
            this.nbTransitions = tr.slice();
            this.randomly = rand.slice()
        },

        // Initialize automata needed for the question by generating them or use
        // the given automata (array)
        initializeAutomata: function (automata) {
            var j = 0;
            for (var rand of this.randomly) {
                if (rand === 1 && !automata[j]) {
                    if (j === 0 && (this.needAutomatonQuestion() || this.underTypeQuestion === "table2Automaton")) {
                        this.createAutomaton(0) ;
                    } else if (j === 1 && this.need2AutomataQuestion()) {
                         this.createAutomaton(1) ;
                    }
                } else if (rand === 0 || automata[j]) {
                    this.automaton[j] = automata[j];
                }

                j++;
            }
        },

        // Initialize the regex needed for the question by generating it or use the given RE
        initializeRegex: function (re) {
            if (re && this.randomly[2] === 0) {
                this.regex = re;
            } else if (this.underTypeQuestion === "RE2automaton") {
                // Randomly create a regex if none was given
                this.createAutomaton(0);
                this.regex = automatonToRegex(this.automaton[0]);
            }
        },

        // Initialize the grammar needed for the question by generating it or
        // use the given grammar
        initializeGrammar: function (grammar) {
            if (grammar && this.randomly[3] === 0) {
                this.grammar = grammar;
            } else if (this.underTypeQuestion === "grammar2Automaton") {
                // Create an automaton and convert it to a grammar
                this.createAutomaton(0);
                this.grammar = automaton2RightLinearGrammar(this.automaton[0]);
            } else if (this.underTypeQuestion === "leftGrammar2RightGrammar") {
                // Create an automaton to convert to a right linear grammar then
                // convert it to a left linear grammar
                this.createAutomaton(0);
                this.grammar = rightLinear2LeftLinearGrammar(
                    automaton2RightLinearGrammar(this.automaton[0])
                );
            }
        },

        // Create randomly an automaton and save it in the .automaton[numAuto]
        createAutomaton: function (numAuto) {
            var A = createAutomatonCoreachable(
                this.nbrState[numAuto],
                this.alphabet[numAuto],
                this.nbrFinalStates[numAuto],
                this.mode[numAuto],
                this.nbTransitions[numAuto]
            );

            if (typeof A === "string") {
                // There is a problem
                alert(A);
            }

            if (numAuto > 1 || numAuto < 0) {
                throw new Error("Only support 2 automata");
            }

            this.automaton[numAuto] = A
        },

        // Method to modify the properties
        // Add an Automaton on the numAuto
        addAutomaton: function (Automaton, numAuto) {
            this.automaton[numAuto || 0] = Automaton;
        },

        // Add a grammar
        addGrammar: function (grammar) {
            this.grammar = grammar;
        },

        // Add a regular expression
        addRE: function (re) {
            this.regex = re;
        },

        // Returns the question in a string json, or saves it if a name is given
        save : function (filename) {
            if (!filename) {
                return JSON.stringify(this);
            }

            var jsonQuestion = JSON.stringify(this);
            var blob     = new Blob([jsonQuestion], {type: "application/json"});
            var fileName = filename + ".json";
            saveAs(blob, fileName);
        },

        // Load the string json given or load the file given, file is a boolean,
        // true means that code is a name of file
        // Otherwise it means it's a string json
        // The better is to give directly the json code
        load : function (code, file) {
            var obj = this;

            if (!file) {
                obj = JSON.parse(code);
                for (let prop in obj) {
                    // To load an automaton if it is a string representation
                    if (
                        prop === "automaton" &&
                        typeof obj.automaton[0] === "string"
                    ) {
                        this.automaton = [];
                        for (var i = 0, l = obj.automaton.length; i < l; i++) {
                            this.automaton.push(svg2automaton(obj.automaton[i]));
                        }
                    } else {
                        this[prop] = obj[prop];
                    }
                }
            } else {
                getFile(
                    code,
                    function (text)   { obj.load(text); },
                    function (erreur) { throw new Error("Bug loading file"); }
                );
            }
        }
    };

})(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this);

(function (pkg) {
    "use strict";
    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var win                    = null;
    var winLoadAutomaton       = null;// Window to load an automaton
    var questionList           = null;
    var questionListContent    = null;
    var chapterSelected        = null; // Chapter selected by the user
    var questionSelected       = null; // Question selected by the user

    var contentListFilesParsed = null; // Content of the listFiles.json parsed

    // The name of question already solved for the random selection of files
    var randomQuestionDone     = {}

    var createTable            = null;
    var automaton2HTMLTable    = null;

    var randomFiles            = false; // If the program loads random files
    var grammarLoaded          = null; // If the users loads a grammar from file
    var RELoaded               = null; // RE from file
    var automataLoaded         = [null, null]; // If the user loads an automaton

    // For the generation of automaton

    // If 0 doesn't generate randomly an automaton, if 1 generates randomly
    var randomly = [1, 1, 1, 1];

    var nbrState = [5, 4];
    var alphabet = [["a", "b"], ["a", "b"]];
    var nbrFinalStates = [1, 1];
    var mode = [1, 1];
    var nbTransitions = [8, 6];

    AudeGUI.QuestionList = {
        load: function () {},

        run: openQuestionList,

        close: function () {
            if (!questionList) {
                return;
            }
            win.minimize();
        },

        tableRandomAutomateGeneration: function () {
            return ["table", [
                ["tr", [
                    ["td", ["label.span-settings-question", {"for": "create-automaton-nbstates"}, _("Number of states:")]],
                    ["td", ["input.input-settings-question#create-automaton-nbstates", {
                        "type": "number",
                        "min": "1"
                    }]]
                ]],
                ["tr", [
                    ["td", ["label.span-settings-question", {"for": "create-automaton-alphabet"}, _("Alphabet")]],
                    ["td", ["input.input-settings-question#create-automaton-alphabet", {
                        "type": "text"
                    }]]
                ]],
                ["tr", [
                    ["td", ["label.span-settings-question", {"for": "create-automaton-nbaccepting"}, _("Number of accepting states:")]],
                    ["td", ["input.input-settings-question#create-automaton-nbaccepting", {
                        "type": "number",
                        "min": "0"
                    }]]
                ]],
                ["tr", [
                    ["td", ["label.span-settings-question", {"for": "create-automaton-mode"}, _("Mode:")]],
                    ["td", ["select.input-settings-question#create-automaton-mode", [
                        ["option", {"value": 1}, _("Deterministic automaton")],
                        ["option", {"value": 2}, _("Non deterministic automaton")],
                        ["option", {"value": 3}, _("Non deterministic automaton with ε-transitions")],
                    ]]]
                ]],
                ["tr", [
                    ["td", ["label.span-settings-question", {"for": "create-automaton-nbtrans"}, _("Number of transitions:")]],
                    ["td", ["input.input-settings-question#create-automaton-nbtrans", {
                        "type": "number",
                        "min": "0"
                    }]]
                ]],
                ["tr", [
                    ["td", ["label.span-settings-question", {"for":"create-automaton-allstatesreachable"}, _("All states are reachable:")]],
                    ["td", ["input.input-settings-question#create-automaton-allstatesreachable", {"type": "checkbox"}]]
                ]],
                ["tr", [
                    ["td", ["label.span-settings-question", {"for": "create-automaton-allstatescoreachable"}, _("All states are co-reachable:")]],
                    ["td", ["input.input-settings-question#create-automaton-allstatescoreachable", {"type": "checkbox"}]]
                ]],
            ]];
        }
    };

    function openQuestionList () {
        if (win) {
            win.show();
            return;
        }
        drawQuestionList();
    }

    // Create the page that shows the list of question
    function  drawQuestionList () {
        // Before using the class question you need to use loadPrograms which loads the audescript program
        loadPrograms();

        // Needs for the creation of table
        window.AudeGUI.Runtime.loadIncludes(
            ["htmltable2automaton", "automaton2htmltable"],
            function () {
                createTable = audescript.m("htmltable2automaton").createTable;
                automaton2HTMLTable = audescript.m("automaton2htmltable").automaton2HTMLTable;
            }
        );

        if (win && win.ws) {
            win.close();
            questionList.parentNode.removeChild(questionList);
        }

        let refs = {}; //  List of the references, {"#": "reference"}
        let questionListWindowContent = (
            ["div#questionList.libD-ws-colors-auto libD-ws-size-auto", {"#": "root"}, [
                ["button#generate-automaton-specification-questionList", _("Settings")],
                ["div#questionList-container-button-navigation", [
                ["button#close-questionList", {"#": "close"}, _("Close the question list")]]],
                ["div#questionList-container", [
                    // Contains the chapter, and question
                    ["div#questionList-selection-chapter", [
                        // To select the chapter
                        ["button.questionList-selection-chapter-cell-button",
                            {"value": "1"},
                            _("Deterministic finite state machines")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            {"value": "2"},
                            _("Non-deterministic finite state machines")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            {"value": "3"},
                            _("Non-deterministic finite state machines with ε-transitions")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            {"value": "4"},
                            _("Regular expressions and Kleene theorem")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            {"value": "5"},
                            _("Grammars and regular grammars")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            {"value": "6"},
                            _("Non-regular langages and iterative lemma")
                        ],
                    ]],

                    ["div#questionList-selection-question",
                        {"style": "min-height:5%"},
                        _("No chapter selected.")
                    ],
                ]],
            ]]
        );

        win = libD.newWin({ // Create a new window
            title: _("Question List"),
            show: true,
            fullscreen: true,
            content: libD.jso2dom(questionListWindowContent, refs)
        });

        // To use specification
        var buttonSpe = document.getElementById("generate-automaton-specification-questionList");
        buttonSpe.onclick = settingsAutomaton ;

        // When we chose a chapter
        var buttons = document.getElementsByClassName("questionList-selection-chapter-cell-button");

        for (var i = 0, l = buttons.length; i < l; i++) {
            buttons[i].addEventListener("click", function (e) {
                if (chapterSelected) {
                    // Change the color of the previous selected chapter
                    chapterSelected.style.backgroundColor = "rgba(239, 240, 241, 0.93)";
                }

                // Change to red when we click
                e.target.style.backgroundColor = "rgba(239, 100, 100)";
                chapterSelected = e.target;
                drawQuestionChapter(e.target.value);
            });

            buttons[i].addEventListener("mouseover", function (e) {
                // Change the color to grey when mouseover
                if (getComputedStyle(e.target).backgroundColor !== "rgb(239, 100, 100)") {
                    e.target.style.backgroundColor = "rgba(150, 150, 150)";
                }
            });

            buttons[i].addEventListener("mouseout", function (e) {
                // Change the color to white when mouseout
                if (getComputedStyle(e.target).backgroundColor !== "rgb(239, 100, 100)") {
                    e.target.style.backgroundColor = "rgba(239, 240, 241, 0.93)" ;
                }
            });
        }

        questionList = refs.root;
        questionListContent = refs.content;

        // Close the question list
        refs.close.onclick = AudeGUI.QuestionList.close;
    }


    // Display a new window for the settings
    var settingsWin = null; // Contains the window

    // Name of the files that the users choose
    var nameSelectedFile = ["none", "none", "none", "none"];

    // Mode: automaton1_2, grammar, er
    var modeSelected = null;

    function settingsAutomaton () {
        // Local variable for the automataLoaded, when the user saved,
        // put them in the global variable
        var automataL             = automataLoaded.slice();
        var localNameSelectedFile = nameSelectedFile.slice();
        var localAutomataLoaded   = automataLoaded.slice() ;
        var localRandomly         = randomly.slice();
        var localNbrState         = nbrState.slice();
        var localAlphabet         = alphabet.slice();
        var localNbrFinalStates   = nbrFinalStates.slice();
        var localMode             = mode.slice();
        var localNbTransitions    = nbTransitions.slice();
        var localGrammarLoaded    = null;
        var localRELoaded         = null;
        var localRandomFiles      = randomFiles;

        if (settingsWin === null || !settingsWin.ws) {
            settingsWin = libD.newWin({
                minimizable: false,
                resizable: false,
                title: _("Setting for the questions"),
                content: libD.jso2dom([
                    ["div#div-settings-question", {"class": "libD-wm-content auto-size"}, [
                        ["h1", _("Settings")],
                        ["div#questionList-selection-option", [ // To select the chapter
                            ["button.load-mode", {"value": "auto1"}, _("Automaton1")],
                            ["button.load-mode", {"value": "auto2"}, _("Automaton2")],
                            ["button.load-mode", {"value": "re"}, _("Regular expression")],
                            ["button.load-mode", {"value": "grammar"}, _("Grammar")],
                        ]],
                        ["table", [
                            ["tr", [
                                ["td", ["label", {"for": "question-selection-select-file"}, _("Select file ")]],
                                ["td", ["input#question-selection-select-file.input-automaton-generate", {"type": "radio", "name": "randomAutomaton", "value": "selectFiles"}]],
                            ]],
                            ["tr", [
                                ["td", ["label", {"for": "question-selection-random-automaton"}, _("Generate randomly ")]],
                                ["td", ["input#question-selection-random-automaton.input-automaton-generate", {"type": "radio", "name": "randomAutomaton", "value": "randomAutomaton"}]],
                            ]],
                            ["tr", [
                                ["td", ["label", {"for": "question-selection-random-files"}, _("Get random files ")]],
                                ["td", ["input#question-selection-random-files.input-automaton-generate", {"type": "radio", "name": "randomAutomaton", "value": "randomFiles"}]],
                            ]]
                        ]],
                        ["div#div-settings-question-automaton-random", [
                            // To enter information to generate randomly an automaton
                            ["h2", _("Automaton generated randomly")],
                            AudeGUI.QuestionList.tableRandomAutomateGeneration()
                        ]],

                        ["div#div-settings-question-automaton-select", {"style": "display:none"}, [
                            // To select an automaton
                            ["h2", _("Automaton selection")],
                            ["div", _("Select an automaton from the list or from your computer")],
                            ["button#selection-automaton", _("Open automaton")],
                            ["span#", _("Selected automaton:"), [
                                ["span#display-name-file", _("none")],
                            ]],
                            ["br"],
                        ]],

                        ["div#div-settings-question-automaton-random-file", {"style": "display:none"}, [
                            ["h2", _("Automaton selection")],
                            ["div", _("The automaton is selected randomly from files")],
                            ["br"],
                        ]],

                        ["div#div-settings-question-re-random", {"style": "display:none"}, [
                            ["h2", _("Regular expression generated randomly")],
                            ["div", _("Create a random automaton by using the pararametes of the automaton 1 and converts it to a RE")],
                            ["div", _("Prefearbly select a regular expression from files")],
                        ]],

                        ["div#div-settings-question-re-select", {"style": "display:none"}, [
                            // To select a regular expression
                            ["h2", _("Regular expression selection")],
                            ["div", _("Select a regular expression from the list or from your computer")],
                            ["button#selection-re", _("Open regular expression")],
                            ["span#", _("Selected regular expression:"), [
                                ["span#display-name-file-re", _("none")],
                            ]],
                            ["br"],
                        ]],

                        ["div#div-settings-question-re-random-file", {"style": "display:none"}, [
                            ["h2", _("Regular expression selection")],
                            ["div", _("The regular expression is selected randomly from files")],
                            ["br"],
                        ]],

                        ["div#div-settings-question-grammar-random", {"style": "display:none"}, [
                            ["h2", _("Grammar generated randomly")],
                            ["div", _("Create a random automaton by using the pararametes of the automaton 1 and converts it to a RE")],
                            ["div", _("Prefearbly select a grammar from files")],
                        ]],

                        ["div#div-settings-question-grammar-select", {"style": "display:none"}, [
                            // To select a grammar
                            ["h2", _("Grammar selection")],
                            ["div", _("Select a grammar from the list or from your computer")],
                            ["button#selection-grammar", _("Open grammar")],
                            ["span#", _("Selected grammar:"), [
                                ["span#display-name-file-grammar", _("none")],
                            ]],
                            ["br"],
                        ]],

                        ["div#div-settings-question-grammar-random-file", {"style": "display:none"}, [
                            ["h2", _("Grammar selection")],
                            ["div", _("The grammar is selected randomly from files")],
                            ["br"],
                        ]],

                        ["button#save-question-settings", _("Save")],
                        ["button#save-exit-question-settings", _("Save and exit")],
                    ]],
                ])
            });

            settingsWin.setAlwaysOnTop(100); // The window will be a at top
            settingsWin.show();

            // To change the menu
            var buttons = document.getElementsByClassName("load-mode");
            for (var i = 0, l = buttons.length;i < l; i++) {
                buttons[i].addEventListener("click", function (e) {
                    if (modeSelected) {
                        // Change the color of the previous selected chapter
                        modeSelected.style.backgroundColor = "rgba(239, 240, 241, 0.93)";
                    }

                    // Change to red when we click
                    e.target.style.backgroundColor = "rgba(239, 100, 100)";
                    modeSelected = e.target;

                    switch (e.target.value) {
                        case "auto1":
                            displayModeSelected(0);
                            break;

                        case "auto2":
                            displayModeSelected(1);
                            break;

                        case "re":
                            displayModeSelected(2);
                            break;

                        case "grammar":
                            displayModeSelected(3);
                    }

                    settingsWin.resize(); // Resize the window when we change mode
                });

                buttons[i].addEventListener("mouseover", function (e) {
                    // Change the color to grey when mouseover
                    if (getComputedStyle(e.target).backgroundColor !== "rgb(239, 100, 100)") {
                        e.target.style.backgroundColor = "rgba(150, 150, 150)";
                    }
                });

                buttons[i].addEventListener("mouseout", function (e) {
                    // Change the color to white when mouseout
                    if (getComputedStyle(e.target).backgroundColor !== "rgb(239, 100, 100)") {
                        e.target.style.backgroundColor = "rgba(239, 240, 241, 0.93)" ;
                    }
                });
            }

            // The radio button
            var chec = document.getElementsByClassName("input-automaton-generate");

            // By default it's the first mode (automaton 1) selected
            displayModeSelected(0);
            modeSelected = buttons[0];

            // Change the color of the previous selected chapter
            modeSelected.style.backgroundColor = "rgb(239, 100, 100)" ;

            // Save and quit
            document.getElementById("save-exit-question-settings").onclick = function () {
                saveSettings();
                settingsWin.close();
            };

            // Save the informations
            document.getElementById("save-question-settings").onclick = saveSettings;

            function saveSettings () {
                randomly = localRandomly.slice();
                for (var numAutomaton = 0; numAutomaton < 2; numAutomaton++) {
                    if (randomly[numAutomaton] === 1) {
                        nbrState[numAutomaton] = parseInt(localNbrState[numAutomaton], 10);
                        alphabet[numAutomaton] = [];

                        var cara = "";
                        for  (var c of String(localAlphabet[numAutomaton])) {
                            // Get the alphabet
                            if (c === ",") {
                                alphabet[numAutomaton].push(cara);
                                cara = "";
                            } else {
                                cara += c;
                            }
                        }

                        alphabet[numAutomaton].push(cara);

                        nbrFinalStates[numAutomaton] = parseInt(
                            localNbrFinalStates[numAutomaton],
                            10
                        );

                        mode[numAutomaton]           = parseInt(localMode[numAutomaton], 10);
                        nbTransitions[numAutomaton]  = parseInt(localNbTransitions[numAutomaton], 10);
                        automataLoaded[numAutomaton] = null;
                    } else if (randomly[numAutomaton] === 0) {
                        automataLoaded[numAutomaton]   = automataL[numAutomaton];
                        nameSelectedFile[numAutomaton] = localNameSelectedFile[numAutomaton];
                    }
                }

                for (var numAutomaton = 2; numAutomaton < 4; numAutomaton++) {
                    if (randomly[numAutomaton] === 0) {
                        nameSelectedFile[numAutomaton] = localNameSelectedFile[numAutomaton];
                    }
                }

                grammarLoaded = localGrammarLoaded;
                RELoaded = localRELoaded;
            }

            function hideDivSettingQuestion(setting) {
                document.getElementById("div-settings-question-" + setting).style.display = "none";
            }

            // Display the selected mode between automaton1, automaton2, ER, grammar
            function displayModeSelected(numAutomaton) {
                // For menu automaton1 and automaton2
                if (numAutomaton < 2) {
                    // Hide the other menus
                    hideDivSettingQuestion("re-random");
                    hideDivSettingQuestion("re-select");
                    hideDivSettingQuestion("re-random-file");
                    hideDivSettingQuestion("grammar-random");
                    hideDivSettingQuestion("grammar-select");
                    hideDivSettingQuestion("grammar-random-file");

                    // Display the name of the current automaton loaded
                    document.getElementById("display-name-file").textContent = localNameSelectedFile[numAutomaton];

                    // Button to open a window for the selection on an automaton
                    document.getElementById("selection-automaton").onclick = chooseFile.bind(null, "automaton");

                    chec[0].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-automaton-select",
                        "div-settings-question-automaton-random",
                        "div-settings-question-automaton-random-file",
                        0
                    );

                    chec[1].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-automaton-select",
                        "div-settings-question-automaton-random",
                        "div-settings-question-automaton-random-file",
                        1
                    );

                    chec[2].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-automaton-select",
                        "div-settings-question-automaton-random",
                        "div-settings-question-automaton-random-file",
                        2
                    );

                    checkRemove(
                        "div-settings-question-automaton-select",
                        "div-settings-question-automaton-random",
                        "div-settings-question-automaton-random-file",
                        localRandomly[numAutomaton]
                    );

                    var inputs = document.getElementsByClassName("input-settings-question");

                    inputs[0].onchange = function () {
                        // Change the local variable when writing new informations
                        localNbrState[numAutomaton] = inputs[0].value;
                    };

                    inputs[1].onchange = function () {
                        localAlphabet[numAutomaton] = inputs[1].value;
                    };

                    inputs[2].onchange = function () {
                        localNbrFinalStates[numAutomaton] = inputs[2].value;
                    };

                    inputs[3].onchange = function () {
                        localMode[numAutomaton] = inputs[3].value;
                    };

                    inputs[4].onchange = function () {
                        localNbTransitions[numAutomaton] = inputs[4].value;
                    };

                    // Put the local variable in the inputs when loading the window
                    inputs[0].value = localNbrState[numAutomaton];
                    inputs[1].value = localAlphabet[numAutomaton];
                    inputs[2].value = localNbrFinalStates[numAutomaton];
                    inputs[3].value = localMode[numAutomaton];
                    inputs[4].value = localNbTransitions[numAutomaton];
                }

                // To select regex
                else if (numAutomaton === 2) {
                    // Hide the other menus
                    hideDivSettingQuestion("automaton-random");
                    hideDivSettingQuestion("automaton-select");
                    hideDivSettingQuestion("automaton-random-file");
                    hideDivSettingQuestion("grammar-random");
                    hideDivSettingQuestion("grammar-select");
                    hideDivSettingQuestion("grammar-random-file");

                    // Display the name of the currently loaded file
                    document.getElementById("display-name-file-re").textContent = localNameSelectedFile[numAutomaton];

                    // Button to open a window for the selection on an automaton
                    document.getElementById("selection-re").onclick = chooseFile.bind(null, "re");

                    // For the check input
                    chec[0].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-re-select",
                        "div-settings-question-re-random",
                        "div-settings-question-re-random-file",
                        0
                    );

                    chec[1].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-re-select",
                        "div-settings-question-re-random",
                        "div-settings-question-re-random-file",
                        1
                    );

                    chec[2].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-re-select",
                        "div-settings-question-re-random",
                        "div-settings-question-re-random-file",
                        2
                    );

                    checkRemove(
                        "div-settings-question-re-select",
                        "div-settings-question-re-random",
                        "div-settings-question-re-random-file",
                        localRandomly[numAutomaton]
                    );
                } else if (numAutomaton === 3) {
                    // To select grammar

                    // Hide the other menus
                    hideDivSettingQuestion("automaton-random");
                    hideDivSettingQuestion("automaton-random-file");
                    hideDivSettingQuestion("automaton-select");
                    hideDivSettingQuestion("re-random");
                    hideDivSettingQuestion("re-select");
                    hideDivSettingQuestion("re-random-file");

                    // Display the name of the current file loaded
                    document.getElementById("display-name-file-grammar").textContent = localNameSelectedFile[numAutomaton];
                    // Button to open a window for the selection on an automaton
                    document.getElementById("selection-grammar").onclick = chooseFile.bind(null, "grammar");

                    chec[0].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-grammar-select",
                        "div-settings-question-grammar-random",
                        "div-settings-question-grammar-random-file",
                        0
                    );

                    chec[1].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-grammar-select",
                        "div-settings-question-grammar-random",
                        "div-settings-question-grammar-random-file",
                        1
                    );

                    chec[2].onclick = checkRemove.bind(
                        null,
                        "div-settings-question-grammar-select",
                        "div-settings-question-grammar-random",
                        "div-settings-question-grammar-random-file",
                        2
                    );

                    checkRemove(
                        "div-settings-question-grammar-select",
                        "div-settings-question-grammar-random",
                        "div-settings-question-grammar-random-file",
                        localRandomly[numAutomaton]
                    );
                }

                // To hide and show the 3 names of divs given
                // number indicates which will be shown
                function checkRemove (name1, name2, name3, number) {
                    if (number === 0)  {
                        document.getElementById(name1).style.display = "inherit";
                        document.getElementById(name2).style.display = "none";
                        document.getElementById(name3).style.display = "none";
                        localRandomly[numAutomaton] = 0;
                        chec[0].checked = true;
                    } else if (number === 1) {
                        document.getElementById(name1).style.display = "none";
                        document.getElementById(name2).style.display = "inherit";
                        document.getElementById(name3).style.display = "none";
                        localRandomly[numAutomaton] = 1;
                        chec[1].checked = true;
                    } else if (number === 2) {
                        document.getElementById(name1).style.display = "none";
                        document.getElementById(name2).style.display = "none";
                        document.getElementById(name3).style.display = "inherit";
                        localRandomly[numAutomaton] = 2;
                        chec[2].checked = true;
                    }

                    // Resize the window when we change random generation
                    settingsWin.resize();
                }


                // Display a window which lets the user selects a file,
                //  type = automaton, er, grammar
                function chooseFile (type) {
                    // List of all the automata for each exercice
                    var listFiles = null;

                    var selectedQuestion = null;

                    if (contentListFilesParsed) {
                        makeWindow();
                        return;
                    } else {
                        getFile(
                            "files_question/listFiles.json",
                            function (content) {
                                displayWin(content)
                            },
                            function (message, status) {
                                var msg = null;

                                if (message === "status") {
                                    msg = libD.format(
                                        _("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"),
                                        status
                                    );
                                }

                                if (message === "send") {
                                    msg = _("This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information");
                                }

                                AudeGUI.notify(
                                    _("Unable to get the list of needed files"),
                                    msg
                                );
                            }
                        );
                    }

                    function displayWin(content) {
                        // Transform the JSON file (where there are the folders
                        // and names of automata) in object
                        contentListFilesParsed = JSON.parse(content);
                        makeWindow();
                    }

                    // Creation of the window to select an automaton
                    function makeWindow() {
                        if (winLoadAutomaton && winLoadAutomaton.ws) {
                            winLoadAutomaton.close();
                        } else {
                            winLoadAutomaton = libD.newWin({
                                title:   "Load file",
                                height:  "80%",
                                width:   "75%",
                                left:    "12.5%",
                                top:     "12.5%",
                                show:    true,
                                content: libD.jso2dom(["div#loaddistantfile.libD-ws-colors-auto libD-ws-size-auto", [
                                    ["div#pane-localfile", [
                                        ["p.title", _("From your computer")],
                                        ["p", ["button#but-load-localfile", _("Load a file")]],

                                        // To load file
                                        ["input#input-file-auto", {"type": "file", "style": "display:none"}],
                                    ]],
                                    ["div#load-automaton-main-container", [
                                        ["div#load-automaton-question", [
                                            // The list of exercices
                                            ["p", {"class": "title"}, _("List of questions")],
                                        ]],
                                        ["span", {"class": "load-automaton-sep"}],
                                        ["div#load-automaton-question-list", [
                                            // The list of automata for the selected exercice
                                            ["p", {"class": "title"}, _("List of automata")],
                                        ]],
                                        ["span", {"class": "load-automaton-sep"}],
                                        ["div#display-loaded-automaton"],
                                    ]]
                                ]])
                            });

                            winLoadAutomaton.setAlwaysOnTop(1001);

                            // To load local file
                            document.getElementById("but-load-localfile").onclick = function () {
                                var inputFile = document.getElementById("input-file-auto");

                                // Let the user select a file
                                inputFile.click();

                                inputFile.onchange = function () {
                                    // When a file is selected, it opens it
                                    localNameSelectedFile[numAutomaton] = inputFile.value;
                                    var freader = new FileReader();

                                    if (type === "automaton") {
                                        // To display the name of the file on the settings window
                                        document.getElementById("display-name-file").textContent = inputFile.value;
                                        divContentFile.textContent = "";
                                        var designer = new AudeDesigner(divContentFile, true); // Create a designer to put the automaton in

                                        // load the file
                                        freader.onload = function () {
                                            if (/.txt$/.test(inputFile.value)) {
                                                // Load a text file
                                                // Display the automaton
                                                designer.setAutomatonCode(freader.result);
                                            } else if (/.svg$/.test(inputFile.value)) {
                                                // Load a svg file
                                                designer.setSVG(freader.result);
                                            }

                                            // Get the displayed automaton
                                            automataL[numAutomaton] = designer.getAutomaton(0);
                                            designer.autoCenterZoom();
                                        };
                                    } else if (type === "re") {
                                        // To display the name on the settings window
                                        document.getElementById("display-name-file-re").textContent = inputFile.value;
                                        freader.onload = function () {
                                            // load the file
                                            divContentFile.textContent = freader.result;
                                            localRELoaded = freader.result;
                                        };
                                    } else if (type === "grammar") {
                                        // To display the name on the settings window
                                        document.getElementById("display-name-file-grammar").textContent = inputFile.value;

                                        // load the file
                                        freader.onload = function () {
                                            divContentFile.textContent = freader.result;
                                            localGrammar = freader.result;
                                        };
                                    }
                                    freader.readAsText(inputFile.files[0], "utf-8");
                                 };
                            }


                            var div = document.getElementById("load-automaton-question");
                            var divListFiles = document.getElementById("load-automaton-question-list");
                            var divContentFile = document.getElementById("display-loaded-automaton");
                            var namesQuestion = Object.keys(contentListFilesParsed); // The list of name exercice


                            // Display the list of question
                            for (var i = 0, l = namesQuestion.length; i < l; i++) {
                                if (contentListFilesParsed[namesQuestion[i]].type === type) {
                                    var but = document.createElement("button");
                                    // The first letter in upper case
                                    but.textContent = namesQuestion[i].charAt(0).toUpperCase() + namesQuestion[i].slice(1);
                                    but.className = "load-automaton-button";
                                    but.value = namesQuestion[i];

                                    // When we click on the button it shows the list of automata corresponding to the question
                                    but.addEventListener("click", function (e) {
                                        if (selectedQuestion) {
                                            // Change the color of the previous selected question
                                            selectedQuestion.style.backgroundColor = "inherit";
                                        }

                                        butDispListFiles(e.target);
                                        // Change to red when we click
                                        e.target.style.backgroundColor = "rgba(239, 100, 100)";
                                        selectedQuestion = e.target;
                                    });

                                    but.addEventListener("mouseover", function (e) {
                                        // Change the color to grey when mouseover
                                        if (getComputedStyle(e.target).backgroundColor !== "rgb(239, 100, 100)") {
                                            e.target.style.backgroundColor = "rgba(150, 150, 150)";
                                        }
                                    });

                                    but.addEventListener("mouseout", function (e) {
                                        // Change the color to white when mouseout
                                        if (getComputedStyle(e.target).backgroundColor !== "rgb(239, 100, 100)") {
                                            e.target.style.backgroundColor = "inherit" ;
                                        }
                                    });

                                    div.appendChild(but);
                                }
                            }

                            // Display the list of files
                            function butDispListFiles (question) {
                                selectedQuestion = question.value;

                                divListFiles.textContent = "";
                                divListFiles.appendChild(
                                    libD.jso2dom(["p.title", _("File list")])
                                );

                                for (var j = 0, len = contentListFilesParsed[question.value].tab.length; j < len; j++) {
                                    if (contentListFilesParsed[question.value].type === type) {
                                        var auto = document.createElement("div");
                                        auto.className = "load-button";
                                        auto.textContent = contentListFilesParsed[question.value].tab[j].replace(/.(txt)|(.svg)$/, "");
                                        divListFiles.appendChild(auto);

                                        // Display the file when you click on the name
                                        auto.addEventListener(
                                            "click",
                                            butDispFile.bind(
                                                null,
                                                question.value,
                                                contentListFilesParsed[question.value].tab[j]
                                            )
                                        );
                                    }
                                }
                            }

                            // Display the selected file
                            function butDispFile (nameQuestion, filename) {
                                localNameSelectedFile[numAutomaton] = filename;

                                if (type === "automaton") {
                                    // To display the name on the settings window
                                    document.getElementById("display-name-file").textContent = filename;
                                    divContentFile.textContent = "";

                                    // Create a designer to put the automaton in
                                    var designer = new AudeDesigner(divContentFile, true);

                                    getFile(
                                        "files_question/" + nameQuestion + "/" + filename,
                                        function (text) {
                                            // load the file
                                            if (/.txt$/.test(filename)) {
                                                // Load a text file
                                                // Display the automaton
                                                designer.setAutomatonCode(text);
                                            } else if (/.svg$/.test(filename)) {
                                                // Load a svg file
                                                // Display the automaton
                                                designer.setSVG(text);
                                            }

                                            automataL[numAutomaton]= designer.getAutomaton(0);
                                            designer.autoCenterZoom();
                                        }
                                    );
                                } else if (type === "re") {
                                    // To display the name on the settings window
                                    document.getElementById("display-name-file-re").textContent = filename;
                                    getFile(
                                        "files_question/" + nameQuestion + "/" + filename,
                                        function (text) {
                                            // load the file
                                            divContentFile.textContent = text;
                                            localRELoaded = text;
                                        }
                                    );
                                } else if (type === "grammar") {
                                    // To display the name on the settings window
                                    document.getElementById("display-name-file-grammar").textContent = filename;
                                    getFile(
                                        "files_question/" + nameQuestion + "/" + filename,
                                        function (text) {
                                            // load the file
                                            divContentFile.textContent = text;
                                            localGrammarLoaded = text;
                                        }
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Dislpay the list of question corresponding to the selected chapter
    function  drawQuestionChapter (chapter) {
        // Area to display the list
        var div = document.getElementById("questionList-selection-question");
        div.textContent = "";

        let bQuectionSelect = function (value, text) {
            return ["button.questionList-question-select", {"value": value}, text];
        };

        switch (parseInt(chapter, 10)) {
            case 1:
                div.appendChild(libD.jso2dom([
                    bQuectionSelect("mcq1", _("Multiple choice questions")), ["br"],
                    bQuectionSelect("complement", _("Complement the automaton")), ["br"],
                    bQuectionSelect("complete", _("Complete the automaton")), ["br"],
                    bQuectionSelect("product", _("Do the product of 2 automata")), ["br"],
                    bQuectionSelect("minimize", _("Minimize the automaton")), ["br"],
                    bQuectionSelect("equivalenceStates", _("List all the equivalent states")), ["br"],
                    bQuectionSelect("equivalencyAutomata", _("Equivalency between 2 automata")), ["br"],
                    bQuectionSelect("automaton2Table", _("Give the tabular form of the automaton")), ["br"],
                    bQuectionSelect("table2Automaton", _("Give the automaton from the table")), ["br"],
                    bQuectionSelect("reachable", _("List the reachable states")), ["br"],
                    bQuectionSelect("coreachable", _("List the co-reachable states")), ["br"],
                    bQuectionSelect("word", _("Give a word recognized by the automata")), ["br"],
                ]));
                break;
            case 2:
                div.appendChild(libD.jso2dom([
                    bQuectionSelect("determinize", _("Determinize the automaton")), ["br"],
                    bQuectionSelect("determinize_minimize", _("Determinize and minimize the automaton")), ["br"],
                    bQuectionSelect("word", _("Give a word recognized by the automata")), ["br"],
                ]));
                break;
            case 3:
                div.appendChild(libD.jso2dom([
                    bQuectionSelect("eliminate", _("Eliminate the ε-transitions")), ["br"],
                    bQuectionSelect("determinize_eliminate", _("Determinize and eliminate the ε-transitions")), ["br"],
                    bQuectionSelect("word", _("Give a word recognized by the automata")), ["br"],
                ]));
                break;
            case 4:
                div.appendChild(libD.jso2dom([
                    bQuectionSelect("automaton2RE", _("Give a RE which corresponds to the automaton")), ["br"],
                    bQuectionSelect("RE2automaton", _("Give the automaton corresponding to the RE")), ["br"],
                ]));
                break;
            case 5:
                div.appendChild(libD.jso2dom([
                    bQuectionSelect("grammar2Automaton", _("Give the automaton corresponding to the right linear grammar")), ["br"],
                    bQuectionSelect("automaton2Grammar", _("Give the right linear grammar corresponding to the automaton")), ["br"],
                    bQuectionSelect("leftGrammar2RightGrammar", _("Convert the left linear grammar to the right linear grammar")), ["br"],
                ]));
                break;
            default:
                div.appendChild(libD.jso2dom(["span.questionList-question", _("No question")]));
        }

        // To display the question when clicked
        var buttonQuestion = document.getElementsByClassName("questionList-question-select");

        for (var i = 0, l = buttonQuestion.length; i < l; i++) {
            buttonQuestion[i].addEventListener("click", async function (e) {
                // We create the question
                var q = new Question(e.target.value);

                // If no automaton/grammar/re loaded and the automaton/grammar/re is not created hazardly
                if (
                    q.typeQuestion === "mcq" ||
                    (randomly[0] === 2 && q.typeQuestion === "automaton") ||
                    (randomly[2] === 2 && q.typeQuestion === "RE") ||
                    (randomly[3] === 2 && q.typeQuestion === "grammar") || (
                        automataLoaded[0] === null &&
                        randomly[0] === 0 &&
                        q.typeQuestion === "automaton"
                    ) || (
                        RELoaded === null &&
                        randomly[2] === 0 &&
                        q.typeQuestion === "RE"
                    ) || (
                        grammarLoaded === null &&
                        randomly[3] === 0 &&
                        q.typeQuestion === "grammar"
                    )
                ) {
                    // Load the file json with all the exercice
                    await getListFiles();
                    // Load a random automaton / grammar... from the file
                    await getRandomFiles(q, e.target.value);

                    q.response = q.getResponse();
                } else {
                    // Other question we initialize automaton/grammar... and
                    // correct automaticaly the question
                    q.settingsCreateAutomaton(
                        randomly,
                        nbrState,
                        alphabet,
                        nbrFinalStates,
                        mode,
                        nbTransitions
                    );

                    q.initializeAutomata(automataLoaded);
                    q.initializeRegex(RELoaded);
                    q.initializeGrammar(grammarLoaded);
                    q.response = q.getResponse();
                }

                questionSelected = e.target.value;

                // Area to display the question
                var div = document.getElementById("questionList-container");

                // Area to display the question
                var divBut = document.getElementById("questionList-container-button-navigation");

                div.textContent = "";

                divBut.appendChild(libD.jso2dom([
                    ["button#menu-questionList", _("Menu questions")],
                    ["button#questionList-restart", _("Restart")],
                    ]
                ));

                // The button permits to return to the menu
                var but = document.getElementById("menu-questionList");
                but.onclick = reDrawQuestionList;

                // The button permits to regenerate the question

                var butRestart = document.getElementById("questionList-restart");
                butRestart.onclick = async function () {
                    // Recreate the page with a new element (automaton-re-grammar) for the question
                    // If no automaton loaded and the automaton is not created hazardly
                    if (
                        q.typeQuestion === "mcq" || (
                            randomly[0] === 2 &&
                            q.typeQuestion === "automaton"
                        ) || (
                            randomly[2] === 2 &&
                            q.typeQuestion === "RE"
                        ) || (
                            randomly[3] === 2 &&
                            q.typeQuestion === "grammar"
                        ) || (
                            automataLoaded[0] === null &&
                            randomly[0] === 0 &&
                            q.typeQuestion === "automaton"
                        ) || (
                            RELoaded === null &&
                            randomly[2] === 0 &&
                            q.typeQuestion === "RE"
                        ) || (
                            grammarLoaded === null &&
                            randomly[3] === 0 &&
                            q.typeQuestion === "grammar"
                        )
                    ) {
                        await getListFiles();
                        await getRandomFiles(q, q.underTypeQuestion);
                        q.response = q.getResponse();
                        div.textContent = "";
                        drawQuestion(q, div);
                    } else {
                        q.settingsCreateAutomaton(
                            randomly,
                            nbrState,
                            alphabet,
                            nbrFinalStates,
                            mode,
                            nbTransitions
                        );

                        // Create a new automaton
                        q.initializeAutomata(automataLoaded);

                        // Create a new regex if needed
                        q.initializeRegex(RELoaded);

                        q.initializeGrammar(grammarLoaded);
                        q.response = q.getResponse();
                        div.textContent = "";
                        drawQuestion(q, div);
                    }
                };
                drawQuestion(q, div);
            });
        }
    }

    // Get a random files for the given question
    function getRandomFiles(q, nameQuestion) {
        return new Promise (function (resolve, reject) {
            if (!randomQuestionDone[nameQuestion]) {
                randomQuestionDone[nameQuestion] = [];
            }

            if (!contentListFilesParsed[nameQuestion]) {
                throw new Error("The exercice has no file to load");
            }

            // The list of files for the question
            var files = contentListFilesParsed[nameQuestion].tab;

            var rand = Math.floor(Math.random() * files.length);

            if (randomQuestionDone[nameQuestion].length === files.length) {
                // If all exercices done, reset the array
                console.log("You have done all the exercices.");
                randomQuestionDone[nameQuestion].length = 0;
            }

            while (randomQuestionDone[nameQuestion].indexOf(files[rand]) > -1) {
                // Look for the first exercice not already done
                rand = (rand + 1) % (files.length);
            }

            randomQuestionDone[nameQuestion].push(files[rand]);


            getFile("files_question/" + nameQuestion + "/" + files[rand],
                async function (text) {
                    // Get a file randomly

                    switch (q.typeQuestion) {
                        case "mcq":
                            // A mcq we load the question
                            q.load(text);
                            break;

                        case "RE":
                            // A RE we load the string(re)
                            q.addRE(text);
                            break;

                        case "grammar":
                            // A grammar we load the string(grammar)
                            q.addGrammar(text);
                            break;

                        case "automaton":
                            var div = document.createElement("div");
                            var designer = new AudeDesigner(div, true);
                            designer.setAutomatonCode(text);

                            // Load the automaton
                            q.addAutomaton(designer.getAutomaton(0));

                            // Need to load a second automaton
                            if (q.need2AutomataQuestion()) {
                                if (!/([\d])\./.test(files[rand])) {
                                    throw new error("Can't load the second automaton.");
                                }

                                var T = (parseInt(RegExp.$1, 10)%2 + 1) + ".";
                                var complFile = files[rand].replace(/([\d])\./, T);

                                (await function () {
                                    // Wait for the second file to be loaded
                                    return new Promise(
                                        function (resolve, reject) {
                                            getFile(
                                                "files_question/" + nameQuestion + "/" + complFile,
                                                function (text) {
                                                    designer.setAutomatonCode(text);
                                                    q.addAutomaton(designer.getAutomaton(0), 1);
                                                    resolve();
                                                }
                                            );
                                        }
                                    );
                                })();
                            }

                            break;
                    }

                    resolve();
                },
                function () { throw new error("Error loading file"); }
            );
        })
    }

    // Get the list of files and parse it
    function getListFiles () {
        return new Promise (function (resolve, reject) {
            if (contentListFilesParsed) {
                getFile("files_question/listFiles.json", function (content) {
                    contentListFilesParsed = JSON.parse(content);
                    resolve();
                })
            } else {
                resolve();
            }
        });
    }

    // Redraw the menu as it was before selected a question
    function reDrawQuestionList () {
        drawQuestionList(); // Display the main page
        drawQuestionChapter(chapterSelected.value); // Display the question for the chapter we were looking
        chapterSelected = document.getElementsByClassName("questionList-selection-chapter-cell-button")[chapterSelected.value-1];
        chapterSelected.style.backgroundColor = "rgba(239, 100, 100)"; // Draw in red the chapter
    }

    // Get the response of the user for the question
    function getUserResponse(question) {
        switch (question.answerMode()) {
            case "automaton":
                // Give the automaton
                return designerAnswer.getAutomaton(0);

            case "input":
            case "re":
                // Give the value of the input
                return document.getElementById("question-answers-input").value;

            case "radio":
                var repCheck = "";
                // Give the checked radio-button
                var radio =  document.getElementsByClassName("question-answers-radio");

                for (var i = 0, l = radio.length;i < l;i++) {
                    if (radio[i].checked)
                        repCheck = radio[i].value;
                }

                return repCheck;

            case "table":
                // Give the div containing the table
                return document.getElementById("question-answers-table");

            case "checkbox":
                var repCheck = [];

                // Give the ul which contains the checkbox
                var divCheckbox =  document.getElementById("question-answers-checkbox").firstChild;

                for (var i = 0, l = divCheckbox.children.length;i < l;i++) {
                    if (divCheckbox.children[i].children[0].children[0].checked) {
                        // Look if the checkbox is checked
                        repCheck.push(divCheckbox.children[i].children[0].children[0].value);
                    }
                }

                return repCheck;

            case "grammar":
                return getInputGrammar();
        }

        return null;
    }

    // Display the question on the div
    function drawQuestion (question, div) {
        div.appendChild(libD.jso2dom([
            ["div#question-wording", _("Question:")],

            // To put the automaton for the question
            ["div#question-automata-designer"],

            ["div.button-container", [
                ["button#question-validate", _("Validate")],
                ["button#question-display-response", _("Display response")]
            ]],

            // Answer of the user
            ["div#question-answers"],
        ]));

        // Validate the response
        var butValidate = document.getElementById("question-validate");
        butValidate.addEventListener("click", function (e) {
            question.userResponse = getUserResponse(question);
            showAnswer(question);
        });

        // To display the response
        var butDispResp = document.getElementById("question-display-response");
        butDispResp.onclick = displayResponse.bind(null, question, "")

        // Display the wording
        var divWording = document.getElementById("question-wording");
        textFormat(question.wording, divWording, true);

        // Display other informations for the question (automaton, er, grammar)
        var divInformationWording = document.getElementById("question-automata-designer");
        if (!question.needAutomatonQuestion()) {
            divInformationWording.id = "question-wordindg-information";
        }

        // Display other informations (automaton, table, grammar...)
        // If there are 2 automata needed
        if (question.need2AutomataQuestion()) {
            divInformationWording.appendChild(libD.jso2dom(["div#question-automata-designer-right"]));
            divInformationWording.appendChild(libD.jso2dom(["div#question-automata-designer-left"]));

            var designerRight = new AudeDesigner(
                document.getElementById("question-automata-designer-right"),
                true
            );

            designerRight.setAutomatonCode(automaton_code(question.automaton[0]));
            designerRight.autoCenterZoom();

            var designerLeft = new AudeDesigner(
                document.getElementById("question-automata-designer-left"),
                true
            );

            designerLeft.setAutomatonCode(automaton_code(question.automaton[1]));
            designerLeft.autoCenterZoom();
        } else if (question.needAutomatonQuestion()) {
            // If there is 1 automaton needed
            var designer = new AudeDesigner(divInformationWording, true);
            designer.setAutomatonCode(automaton_code(question.automaton[0]));
            designer.autoCenterZoom();

        // Draw a table
        } else if (question.underTypeQuestion === "table2Automaton") {
            divInformationWording.appendChild(automaton2HTMLTable(question.automaton[0]));
        } else if (question.underTypeQuestion === "RE2automaton") {
            // Draw the RE
            divInformationWording.appendChild(document.createTextNode(question.regex));
        } else if (
            question.underTypeQuestion === "grammar2Automaton" ||
            question.underTypeQuestion === "leftGrammar2RightGrammar"
        ) {
            // Draw the the grammar
            divInformationWording.appendChild(document.createTextNode(question.grammar.toString()));
       } else {
            divInformationWording.style.display = "none";
        }

        // Area to allow the user to write the answer
        var divAnswersUser = document.getElementById("question-answers");
        switch (question.answerMode()) {
            case "automaton":
                divAnswersUser.appendChild(libD.jso2dom(
                    ["div#question-answers-automaton",
                    _("You can draw the automaton bellow.")]
                ));

                // Contains the automata
                var designerAnswer = new AudeDesigner(
                    document.getElementById("question-answers-automaton"),
                    false
                );
                break;

            case "input": case "re":
                divAnswersUser.appendChild(libD.jso2dom(
                    ["input#question-answers-input", {"type": "text"}]
                ));

                document.getElementById("question-answers-input").placeholder = (
                    question.underTypeQuestion === "equivalenceStates"
                        ? _("Enter couples of states")
                        : _("Enter the answer here")
                );
                break;

            case "grammar":
                inputGrammar(divAnswersUser);
                break;

            case "radio":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["form", [
                        ["fieldset", [
                            ["input.question-answers-radio",
                                {"type": "radio", "name": "response", "value": "true"}],
                            ["label", _("Yes")], ["br"],

                            ["input.question-answers-radio",
                                {"type": "radio", "name": "response", "value": "false"}],

                            ["label", _("No")], ["br"]
                        ]],
                    ]],
                ]));
                break;

            case "table":
                divAnswersUser.appendChild(
                    libD.jso2dom(["div#question-answers-table"])
                );

                createTable(
                    "",
                    document.getElementById("question-answers-table")
                );

                var divT = document.getElementById("div-container-table");

                // Remove buttons "create automaton", "×"
                divT.childNodes[4].style.display = "none";
                break;

            // For the mcq
            case "checkbox":
                var qid = 0; var refs = [];
                var divCheckbox= document.createElement("div");
                divCheckbox.id = "question-answers-checkbox";
                divAnswersUser.appendChild(divCheckbox);
                divCheckbox.appendChild(document.createElement("ul"))

                var choices = question.choices;

                for (var j = 0, leng = choices.length; j < leng; ++j) {
                    qid = (
                        choices[j].hasOwnProperty("id")
                            ? choices[j].id
                            : (parseInt(i, 10) + 1)
                    );

                    divCheckbox.firstChild.appendChild(
                        libD.jso2dom(["li", ["label", [
                            ["input", {"type": "checkbox", "value":qid}],
                            ["span.quiz-answer-id", qid + ". "],
                            ["span", {"#": j + "content"}]
                        ]]], refs)
                    );

                    if (choices[j].automaton) {
                            automaton2svg(
                                automatonFromObj(choices[j].automaton),
                                function (res) {
                                    refs[j + "content"].textContent = res;
                                }
                            );

                    } else if (choices[j].html) {
                        refs[j + "content"].innerHTML = choices[j].html;
                    } else if (choices[j].text) {
                        textFormat(choices[j].text, refs[j + "content"]);
                    } else if (choices[j].html) {
                        textFormat(choices[j].html, refs[j + "content"], true);
                    }
                }
                break;
        }
    }

    // Show if the user response is correct
    function showAnswer(question) {
        var dispResp;
        var div = document.createElement("div");

        if (!question.isCorrect()) {
            dispResp = _("Wrong answer");
            div.style.color = "red";
        } else if (!question.isCorrect()) {
            dispResp = _("Correct answer");
            div.style.color = "green";
        }

        div.innerHTML = dispResp;
        AudeGUI.notify(("Correction"), div , "normal", 4000);
    }

    // Display the solution of the question in the div
    function displayResponse(question, div) {
        var response = question.response;
        switch (question.answerMode()) {
            case "automaton":
                if (!div) {
                    // Create an area to display the automaton response
                    var div = document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-automaton")) {
                        // If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-automaton"));
                    }
                }

                div.appendChild(libD.jso2dom(["div#question-solution-automaton"]));

                var designer = new AudeDesigner(
                    document.getElementById("question-solution-automaton"),
                    true
                );

                // Display the automaton response
                designer.setAutomatonCode(automaton_code(response));
                designer.autoCenterZoom();
                break;

            case "input":
            case "re":
            case "grammar":
                if (!div) {
                    // Create an area to display the input response
                    var div = document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-input")) {
                        // If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }

                div.appendChild(libD.jso2dom(["span#question-solution-input"]));
                document.getElementById("question-solution-input").innerHTML = response;
                break;

            case "radio":
                if (!div) {
                    // Create an area to display the input response
                    var div = document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-input")) {
                        // If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }

                div.appendChild(libD.jso2dom(["span#question-solution-input"]));
                document.getElementById("question-solution-input").innerHTML = response;
                break;

            case "table":
                if (!div) {
                    // Create an area to display the input response
                    var div = document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-table")) {
                        // If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-table"));
                    }
                }

                div.appendChild(libD.jso2dom(["span#question-solution-table"]));
                document.getElementById("question-solution-table").appendChild(response);
                break;

            case "checkbox":
                if (!div) {
                    // Create an area to display the input response
                    var div = document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-input")) {
                        // If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }

                div.appendChild(libD.jso2dom(["span#question-solution-input"]));
                document.getElementById("question-solution-input").innerHTML = "The correct choice:" + response;
                // FIXME translate
                break;
        }
    }

    // To diplay katex
    function textFormat(text, node, html) {
        if (!node) {
            node = document.createElement("span");
        }

        node[html ? "innerHTML" : "textContent"] = (
            (text instanceof Array)
                ? mathDisplay(text.join(""))
                : text
        );

        renderMathInElement(
            node, {
                delimiters: [
                    {left: "$$",  right: "$$",  display: true},
                    {left: "$",   right: "$",   display: false},
                    {left: "\\[", right: "\\]", display: true},
                    {left: "\\(", right: "\\)", display: false}
                ]
            }
        );

        return node;
    }
}(window));
