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

(function(pkg){
    //Transform a string ( (a,b),(c,d)... ) to a set
    pkg.str2Set = function(set,nbrElement) {
        if (nbrElement===2 || nbrElement===undefined ) {
            if (typeof set === 'string' || set instanceof String) {
                var setT = new Set(); //The true set
                var str = '' ;
                while(/\( *([^,\(\)\{\} ]+) *, *([^,\(\)\{\} ]+) *\)/.test(set)) {
                    /\( *([^,\(\)\{\} ]+) *, *([^,\(\)\{\} ]+) *\)/.exec(set);
                    str = "("+RegExp.$1+","+RegExp.$2+")";
                    set=set.replace(/\( *([^,\(\)\{\} ]+) *, *([^,\(\)\{\} ]+) *\)/,'');
                    setT.add(str);
                }
                return setT;
            }
            return set;
        }
        else if (nbrElement===1) {
            if (typeof set === 'string' || set instanceof String) {
                var setT = new Set(); //The true set
                var str = '' ;
                while(/\(? *([^,\(\)\{\} ]+) *\)? *,?/.test(set)) {
                    /\(? *([^,\(\)\{\} ]+) *\)? *,?/.exec(set);
                    str = "("+RegExp.$1+")";
                    set=set.replace(/\(? *([^,\(\)\{\}]+) *\)? *,?/,'');
                    setT.add(str);
                }
                return setT;
            }
            return set;
        }
    }

    //Return true if the setL is include in the setB (the elements have this form (a,b),(c,d) if nbrElement=2)
     pkg.setInclude = function(setL,setB,nbrElement) {
        var pres= false, final = true,a,b,c,d;
        if (nbrElement===2 || nbrElement===undefined) {
            for (var eleL of setL) {
                /(\d)+,(\d)+/.exec(eleL);
                a = RegExp.$1;
                b = RegExp.$2;
                for (var eleB of setB) {
                    /\((\d+),(\d+)\)/.exec(eleB);
                    c = RegExp.$1;
                    d = RegExp.$2;
                    if (eleL===eleB || (a===d && b === c )) {
                        pres = true;
                    }
                }
                final = final && pres;
                pres=false;
            }
            return final;
        }
        else if (nbrElement===1) {
            for (var eleL of setL) {
                for (var eleB of setB) {
                    if (eleL===eleB ) {
                        pres = true;
                    }
                }
                final = final && pres;
                pres=false;
            }
            return final;
        }
    }
    //Return true if 2 sets are identical ((0,1) and (1,0) are considered identical)
    pkg.identicalSets=function (seta,setb,nbrElement) {
        setb=str2Set(String(setb),nbrElement); //transform to a Set
        seta=str2Set(String(seta),nbrElement);

        return setInclude(seta,setb,nbrElement) && setInclude(setb,seta,nbrElement);
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


(function(pkg,that){

    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;
    //List of all the question
    var underTypeQuestionList = ["complement","complete","product","minimize","equivalenceStates","equivalencyAutomata","automaton2Table","table2Automaton"
    ,"accessible","coaccessible","word","determinize","determinize_minimize","eliminate","determinize_eliminate","automaton2RE","RE2automaton","grammar2Automaton",
    "automaton2Grammar","leftGrammar2RightGrammar","mcq1","mcq2","mcq3","mcq4","mcq5","mcq6","recognizeLanguageAutomaton","recognizeLanguageRE"];
    //Need automaton for the response
    var underTypeQuestionNeedAutomaton = ["complement","complete","product","minimize","determinize","determinize_minimize","eliminate",
    "determinize_eliminate","RE2automaton","grammar2Automaton","recognizeLanguageAutomaton"];
    //Need automaton for the wording
    var underTypeQuestionNeedAutomatonWording = ["complement","complete","product","minimize","equivalenceStates","equivalencyAutomata",
    "automaton2Table","accessible","coaccessible","word","determinize","determinize_minimize","eliminate","determinize_eliminate",
    "automaton2RE","automaton2Grammar"];

    //For the creation of the automaton
    var createAutomatonCoaccessible = null ;

    //The algorithm for the automatic correction
    var complete = null;
    var isCompleted = null;
    var automataAreEquivalent = null;
    var product =null;
    var minimize =null;
    var isMinimized =null;
    var complement =null;
    var distinguableStates =null;
    var notDistinguableStates = null;
    var coaccessibleStates = null;
    var accessibleStates = null;
    var automaton2HTMLTable = null;
    var createTable = null;
    var HTMLTable2automaton = null;
    var smallerWord = null;
    /*Chapter 2*/
    var determinize = null;
    var isDeterminized = null;
    /*Chapter 3*/
    var epsElim = null;
    var hasEpsilonTransitions = null;
    /*Chapter 4*/
    var regexToAutomaton = null;
    var automatonToRegex = null;
    /*Chapter 5*/
    var leftLinear2RightLinearGrammar = null;
    var rightLinear2LeftLinearGrammar = null;
    var linearGrammar2Automaton = null;
    var automaton2RightLinearGrammar = null;
    var isLeftLinear = null;

     pkg.loadPrograms = function () {
    window.AudeGUI.Runtime.loadIncludes(["completion","equivalence", "product", "minimization","complementation","distinguishability","coaccessibility","accessibility",
    "automaton2htmltable","htmltable2automaton","createAutomaton","smallerWord","determinization","epsElimination","regex2automaton","automaton2regex","automaton2RightLinearGrammar",
    "linearGrammar2Automaton","leftLinear2RightLinearGrammar","rightLinear2LeftLinearGrammar"],
    function () {
        createAutomatonCoaccessible = audescript.m("createAutomaton").createAutomatonCoaccessible;
        complete = audescript.m("completion").complete;
        isCompleted = audescript.m("completion").isCompleted;
        automataAreEquivalent = audescript.m("equivalence").automataAreEquivalent;
        product = audescript.m("product").product;
        minimize = audescript.m("minimization").minimize;
        isMinimized = audescript.m("minimization").isMinimized;
        complement = audescript.m("complementation").complement;
        distinguableStates = audescript.m("distinguishability").distinguableStates;
        notDistinguableStates = audescript.m("distinguishability").notDistinguableStates;
        coaccessibleStates = audescript.m("coaccessibility").coaccessibleStates;
        accessibleStates = audescript.m("accessibility").accessibleStates;
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
    }


    //Class Question: wording, typeQuestion, underTypeQuestion, automata if needed,regex, a response, type of response, the response of the user
     pkg.Question =  function (underTypeQuestion,wording,typeQuestion,automaton,regex,grammar,response,typeResponse,userResponse) {

        this.underTypeQuestion = underTypeQuestion;

        //The wording of the question (create automatically or we can specify it)
        this.wording =( wording===''||wording===undefined ? this.createWording(this.underTypeQuestion) : wording );

        if (typeQuestion==undefined) {
            if (/^mcq/i.test(this.underTypeQuestion))
                this.typeQuestion = "mcq";
            else if (this.underTypeQuestion=="automaton2regex")
                this.typeQuestion = "RE";
            else if (this.underTypeQuestion=="grammar2Automaton" || this.underTypeQuestion=="leftGrammar2RightGrammar")
                this.typeQuestion = "grammar";
            for(var i=0,l=underTypeQuestionNeedAutomatonWording.length;i<l;i++){
                if (this.underTypeQuestion == underTypeQuestionNeedAutomatonWording[i])
                    this.typeQuestion = "automaton";
            }
        }

        else if (typeQuestion!="mcq" && typeQuestion!="RE" && typeQuestion!="automaton")
            throw new Error("Error: creation of question impossible. typeQuestion: "+typeQuestion +" is not valid");
        else
            this.typeQuestion = typeQuestion; //The type of the question (mcq,Automaton,RE (Regular expression))

        this.automaton=[null,null,null,null];
        var i =0;
        if (automaton) {
            for (var auto of automaton) {
                this.automaton[i]=auto;
                i++;
            }
        }

        this.response = response;

        if (typeResponse==='' || typeResponse===undefined)
            this.typeResponse = this.answerMode();
        else
            this.typeResponse = typeResponse;

        this.userResponse = userResponse;

        this.regex = regex;

        this.grammar = grammar;

    }

    pkg.Question.prototype = {


        //Get the response of the question
        getResponse : function () {
            return this.response;
        },
        getAnswer : this.getResponse,


        // Multiple choices question

        // Create a mcq: wording,the chapter (1-6 or nothing), array choice, array of solution, otherInfo: for the wording automata, grammar, re
        //Other Info not yet working
        createMCQ : function (wording,choices,response,otherInfo,chapter) {
            this.wording = wording;
            this.typeQuestion = "mcq";
            this.underTypeQuestion = "mcq"+(chapter||"");
            this.choices = choices; //An array of choices, choice is defined by an id and a text
            this.response = response; //An array with all the correct answers which corresponds to the id of the choice

            //Other information
            if (otherInfo!==undefined && otherInfo!=null) {
                if (Array.isArray(otherInfo)) {
                    for (element of otherInfo) {
                        this.otherInfo.tab.push(element);
                    }
                }
                else {
                    this.otherInfo.tab.push(otherInfo)
                }
                otherInfo.type = otherInfo[0].constructor.name; //The type of element //Automaton, grammar, er(String)
            }
        },

        //Get the choices for the MCQ
        getChoices : function () {
            return this.choices;
        },
        getPossibilities : this.getChoices,

        // Create an automaton question
        //The type is the undertype question(minimize, complete...), automataWording is an array of automata
        //Wording and response are create automatically  or can be given
        createAutomatonQuestion : function (type, automataWording, wording, response) {
            this.typeQuestion="automaton";
            this.underTypeQuestion = type;
            if (wording=== null || wording === undefined || wording === "")
                this.wording = this.createWording();
            else
                this.wording = wording;
            this.automaton = automataWording.slice();
            if (response === null || response === undefined || response === "")
                this.correctionQuestion();
            else
                this.response = response;
        },

        // Create an regular expression question
        //The type is the undertype question automataWording is an array of automata
        //Wording and response are create automatically or can be given
        createREQuestion : function (type, automataWording, wording, response) {
            this.typeQuestion="RE";
            this.underTypeQuestion = type;
            if (wording=== null || wording === undefined || wording === "")
                this.wording = this.createWording();
            else
                this.wording = wording;
            this.automaton = automataWording.slice();
            if (response === null || response === undefined || response === "")
                this.correctionQuestion();
            else
                this.response = response;
        },

        //Create the wording corresponding to the type of question
        createWording: function (type) {
            if (type===undefined)
                type = this.underTypeQuestion;
            switch (type)
            {
                case "complement":
                    return _("Create the complementary automaton of the following automaton ");
                    break;
                case "complete":
                    return _("Create the complete automaton of the following automaton ");
                    break;
                case "product":
                    return _("Do the product of the following automata ");
                    break;
                case "minimize":
                    return _("Minimize the following automaton ");
                    break;
                case "equivalenceStates":
                    return _("Write the equivalent states of the following automaton ");
                    break;
                case "equivalencyAutomata":
                    return _("Are the following automatons equivalent? ");
                    break;
                case "automaton2Table":
                    return _("Fill the table corresponding to the automaton ");
                    break;
                case "table2Automaton":
                    return _("Create the automaton corresponding to the table ");
                    break;
                case "accessible":
                    return _("Write the accessible states of the following automaton ");
                    break;
                case "coaccessible":
                    return _("Write the co-accessible states of the following automaton ");
                    break;
                case "word":
                    return _("Write a word recognized by the following automaton ");
                    break;
                case "determinize":
                    return _("Create the determinized automaton of the following automaton ");
                    break;
                case "determinize_minimize":
                    return _("Create the determinized and minimize automaton of the following automaton ");
                    break;
                case "eliminate":
                    return _("Eleminate the ε-transitions of the following automaton ");
                    break;
                case "determinize_eliminate":
                    return _("Eleminate the ε-transitions and determinize the following automaton ");
                    break;
                case "automaton2RE":
                    return _("Write the regular expression corresponding to the following automaton ");
                    break;
                case "RE2automaton":
                    return _("Give the automaton corresponding to the following RE ");
                    break;
                case "grammar2Automaton":
                    return _("Give the automaton corresponding to the following right linear grammar ");
                    break;
                case "automaton2Grammar":
                    return _("Give the linear grammar corresponding to the following automaton ");
                    break;
                case "leftGrammar2RightGrammar":
                    return _("Give the right linear grammar corresponding to the following left linear grammar ");
                    break;
                default:
                    return "";
                    break;
            }
        },


        //Return true if the question needs to display an automaton for the wording
        needAutomatonQuestion: function () {
            for(var i=0,l=underTypeQuestionNeedAutomatonWording.length;i<l;i++){
                if (this.underTypeQuestion == underTypeQuestionNeedAutomatonWording[i] )
                    return true;
            }
            return false;
        },

        //Return true if the question needs 2 automata
        need2AutomataQuestion : function () {
            if (this.underTypeQuestion==="product" ||this.underTypeQuestion==="equivalencyAutomata")
                return true;
            return false;
        },

        //Return true if the users need to create an automaton
        needAutomatonAnswers: function () {
            for(var i=0,l=underTypeQuestionNeedAutomaton.length;i<l;i++){
                if (this.underTypeQuestion == underTypeQuestionNeedAutomaton[i] )
                    return true;
            }
            return false;
        },

        //Return the answers type corresponding to the question: (automaton,re,mcq,table,input)
        answerMode: function () {
            switch (this.underTypeQuestion)
            {
                case "complement": case "complete":case "product": case"minimize": case"table2Automaton": case "determinize": case "determinize_minimize":
                case "eliminate": case "determinize_eliminate": case "RE2automaton": case "grammar2Automaton":  case "recognizeLanguageAutomaton":
                    return "automaton";
                    break;
                case "equivalenceStates" : case "accessible" : case "coaccessible" : case "word" :
                    return "input";
                    break;
                case "automaton2Grammar": case "leftGrammar2RightGrammar":
                    return "grammar"; //It's also an input
                case "automaton2RE": case "recognizeLanguageRE":
                    return "re";
                    break;
                case "equivalencyAutomata" :
                    return "radio";
                    break;
                case "automaton2Table":
                    return "table";
                    break;
                case "mcq1":
                    return "checkbox";
                    break;
                default:
                    return "not defined";
                    break;
            }
        },

        //Create the response with the algorithm and put it in the .response
         correctionQuestion : function () {
            switch (this.underTypeQuestion) {
                case "complement":
                    this.response = complement(this.automaton[0]);
                    break;
                case "complete":
                    this.response = complete(this.automaton[0],this.automaton[0].getAlphabet());
                    break;
                case "minimize":
                    this.response = minimize(this.automaton[0],this.automaton[0].getAlphabet());
                    break;
                case "product":
                    this.response = product(this.automaton[0],this.automaton[1],false);
                    break;
                case "equivalenceStates":
                    this.response = notDistinguableStates(this.automaton[0]);
                    break;
                case "equivalencyAutomata":
                    this.response = automataAreEquivalent(this.automaton[0],this.automaton[1]);
                    break;
                case "automaton2Table":
                    this.response = automaton2HTMLTable(this.automaton[0]);
                    break;
                case "table2Automaton":
                    this.response = this.automaton[0];
                    break;
                case "coaccessible":
                    this.response = coaccessibleStates(this.automaton[0]);
                    break;
                case "accessible":
                    this.response = accessibleStates(this.automaton[0]);
                    break;
                case "word":
                    this.response = smallerWord(this.automaton[0]);
                    break;
                case "determinize":
                    this.response = determinize(this.automaton[0]);
                    break;
                case "determinize_minimize":
                    this.response = determinize(this.automaton[0],1);
                    break;
                case "eliminate":
                    this.response = epsElim(this.automaton[0]);
                    break;
                case "determinize_eliminate":
                    this.response = determinize(epsElim(this.automaton[0]));
                    break;
                case "automaton2RE":
                    this.response = automatonToRegex(this.automaton[0]);
                    break;
                case "RE2automaton":
                    this.response = regexToAutomaton(this.regex)
                    break;
                case "grammar2Automaton":
                    this.response = linearGrammar2Automaton(this.grammar);
                    break;
                case "automaton2Grammar":
                    this.response = automaton2RightLinearGrammar(this.automaton[0]).toString(); //Return the string of the grammar
                    break;
                case "leftGrammar2RightGrammar":
                    this.response = leftLinear2RightLinearGrammar(this.grammar,0).toString();
                    break;
                case 'mcq': //Can't correct automatically a mcq
                    break;
                default:
                    break;
                }
        },

        //return true if the response is correct or false otherwise
        isCorrect: function () {
            response = this.response;
            //If the user needs to draw an automaton and didn't do it
            if(this.userResponse===undefined || this.userResponse===null) {
                return false;
            }

            switch (this.underTypeQuestion) {
                case "complete":
                    return automataAreEquivalent(response,this.userResponse) && isCompleted(this.userResponse);
                    break;
                case "complement": case "product": case "table2Automaton": case "grammar2Automaton":
                    return automataAreEquivalent(response,this.userResponse);
                    break;
                case "minimize":
                    return automataAreEquivalent(response,this.userResponse) && isMinimized(response,this.userResponse);
                    break;
                case "determinize":
                    return automataAreEquivalent(response,this.userResponse) && isDeterminized(this.userResponse);
                    break;
                case  "determinize_minimize":
                    return automataAreEquivalent(response,this.userResponse) && isDeterminized(this.userResponse) && isMinimized(this.userResponse);
                    break;
                case "equivalenceStates":
                    return identicalSets(response,this.userResponse) ;
                    break;
                case "equivalencyAutomata":
                    return this.userResponse === String(response);
                    break;
                case "automaton2Table":
                    return automataAreEquivalent(this.automaton[0],HTMLTable2automaton(this.userResponse));
                    break;
                case "coaccessible":
                    return identicalSets(response,this.userResponse);
                    break;
                case "accessible":
                    return identicalSets(response,this.userResponse,1);
                    break;
                case "word":
                    return this.automaton[0].acceptedWord(this.userResponse);
                    break;
                case "eleminate":
                    return automataAreEquivalent(response,this.userResponse) && !hasEpsilonTransitions(this.userResponse);
                    break;
                case "determinize_eliminate":
                    return automataAreEquivalent(response,this.userResponse) && !hasEpsilonTransitions(this.userResponse) && isDeterminized(this.userResponse);
                    break;
                case "automaton2RE":
                    return  automataAreEquivalent(this.automaton[0],regexToAutomaton(this.userResponse));
                    break;
                case "RE2automaton":
                    return automataAreEquivalent(this.response,this.userResponse);
                    break;
                case "recognizeLanguageRE":
                    return automataAreEquivalent(regexToAutomaton(this.response),regexToAutomaton(this.userResponse))
                case "automaton2Grammar":
                    return automataAreEquivalent(this.automaton[0],linearGrammar2Automaton(this.userResponse));
                    break;
                case "leftGrammar2RightGrammar": //Compare the 2 automata generated by the grammars, and look if the given grammar is right linear
                    return automataAreEquivalent( linearGrammar2Automaton(this.grammar),linearGrammar2Automaton(this.userResponse)) && isLeftLinear(this.userResponse)===false;
                    break;
                case  "mcq": case "mcq1": case "mcq2": case "mcq3": case "mcq4": case "mcq5": case "mcq6": //For the mcq
                    var bool;
                    if (this.response.length != this.userResponse.length) { //If the number of response is different
                        return false;
                    }
                    for (var i=0,l= this.response.length;i<l;i++) { //Look for each response
                        bool=false;
                        for (var j=0,len= this.userResponse.length;j<len;j++ ) {
                            if (this.response[i] == this.userResponse[j] )
                                bool=true;
                        }
                        if (!bool)
                            return false;
                    }
                    return true;
                    break;
                case "recognizeLanguageAutomaton": //TODO Add specific property, (isDetermnized, isMinimized ...)
                    automataAreEquivalent(this.automaton[0],this.userResponse);
                    break;
                default: //Not a specified question
                    break;
                }
        },
        //Settings for creation of automaton,there are arrays
        settingsCreateAutomaton : function (rand,st,al,fi,mo,tr) {
            this.nbrState = st.slice(); //Use slice to copy an array
            this.alphabet = al.slice();
            this.nbrFinalStates = fi.slice();
            this.mode = mo.slice();
            this.nbTransitions = tr.slice();
            this.randomly = rand.slice()
        },

        //Initialize automata needed for the question by generating them or use the given automata (array)
        initializeAutomata: function (automata) {
            var j=0;
            for (var rand of this.randomly) {
                if(rand==1 && (automata[j]===null || automata[j]===undefined)) {
                    if (j==0 & this.needAutomatonQuestion() || this.underTypeQuestion == "table2Automaton")
                        this.createAutomaton(0) ;
                    else if (j==1 && this.need2AutomataQuestion() )
                         this.createAutomaton(1) ;

                }else if (rand==0 || (automata[j]!==null && automata[j]!==undefined)) {
                this.automaton[j] = automata[j];
                }
                j++;
            }
        },

        //Initialize the regex needed for the question by generating it or use the given RE
        initializeRegex: function (re) {
            if (re!==undefined && re!==null && this.randomly[2]==0 ) { //Set the re given
                this.regex = re;
            }
            else if (this.underTypeQuestion=="RE2automaton") { //Create randomly a regex if non was given
                this.createAutomaton(0);
                this.regex = automatonToRegex(this.automaton[0]);
            }
        },

        //Initialize the grammar needed for the question by generating it or use the given grammar
        initializeGrammar: function (grammar) {
            if (grammar!==undefined && grammar!==null && this.randomly[3]==0 ) { //Set the given grammar
                this.grammar = grammar;
            }
            else if (this.underTypeQuestion=="grammar2Automaton") { //Create an automaton and convert it to a grammar
                this.createAutomaton(0);
                this.grammar = automaton2RightLinearGrammar(this.automaton[0]);
            }
            else if (this.underTypeQuestion=="leftGrammar2RightGrammar") { //Create an automaton to convert to a right linear grammar then convert it to a left linear grammar
                this.createAutomaton(0);
                this.grammar = rightLinear2LeftLinearGrammar(automaton2RightLinearGrammar(this.automaton[0]));
            }
        },

        //Create randomly an automaton and save it in the .automaton[numAuto]
        createAutomaton: function (numAuto) {
            var A = new Automaton();
            A = createAutomatonCoaccessible(this.nbrState[numAuto],this.alphabet[numAuto],this.nbrFinalStates[numAuto],this.mode[numAuto],this.nbTransitions[numAuto]);
            if (typeof A === 'string' || A instanceof String) { //If there is a problem the creation of automaton return a string
                alert(A);
            }
            if (numAuto>1 ||numAuto<0 )
                throw new Error("Only support 2 automata");
            this.automaton[numAuto]=A
        },

        /*
        Method to modify the properties
        */
        //Add an Automaton on the numAuto
        addAutomaton : function (Automaton,numAuto) {
            if (numAuto===undefined)
                this.automaton[0] = Automaton;
            else
                this.automaton[numAuto] = Automaton;
        },
        //Add a grammar
        addGrammar: function (grammar) {
            this.grammar = grammar;
        },
        //Add a regular expression
        addRE: function (re) {
            this.regex = re;
        },

        //Returns the question in a string json, or saves it if a name is given
        save : function (nameFile) {
            if (nameFile===null  || nameFile===undefined) {
                return JSON.stringify(this);
            }
            var jsonQuestion = JSON.stringify(this);
            var blob     = new Blob([jsonQuestion], {type: "application/json"});
            var fileName = nameFile+".json";
            saveAs(blob, fileName);
        },

        //Load the string json given or load the file given, file is a boolean,true means that code is a name of file
        //Otherwise it means it's a string json
        //The better is to give directly the json code
        load : function (code,file) {
            var obj = this;
            // this;
            if (file==false || file===undefined) {
                obj = JSON.parse(code);
                for (prop in obj){
                    //To load an automaton if it is a string representation
                    if(prop === "automaton" && (typeof obj.automaton[0]==="string" || obj.automaton[0] instanceof String)) {
                        this.automaton = [];
                        for(var i=0,l=obj.automaton.length;i<l;i++) {
                            this.automaton.push(svg2automaton(obj.automaton[i]));
                        }
                    }
                    else
                        this[prop]=obj[prop];
                }
            }
            else if (file==true) {
                getFile(
                    code,
                    function(text) {
                        obj.load(text);
                    },
                    function (erreur) {
                            throw new Error("Bug loading file");
                    }
                );
            }
        },



    };

})(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this);

(function (pkg) {
    "use strict";
    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var win = null; //Creation of a new window
    var winLoadAutomaton = null;//Window to load an automaton
    var questionList = null;
    var questionListContent = null;
    var chapterSelected = null; //Chapter selected by the user
    var questionSelected = null; //Question selected by the user

    var contentListFilesParsed = null; //Content of the listFiles.json parsed
    var randomQuestionDone = new Object() //The name of question already solved for the random selection of files

    var createTable = null;
    var automaton2HTMLTable = null;

    var randomFiles = false; //If the program loads random files
    var grammarLoaded = null; //If the users loads a grammar from file
    var RELoaded = null; // RE from file
    var automataLoaded = [null,null]; //If the users loads an automaton

    //For the generation of automaton
    var randomly = [1,1,1,1]; //If 0 doesn't generate randomly an automaton, if 1 generates randomly
    var nbrState = [5,4];
    var alphabet = [['a','b'],['a','b']];
    var nbrFinalStates = [1,1];
    var mode = [1,1];
    var nbTransitions = [8,6];

    AudeGUI.QuestionList = {
        load: function () {
            //Rien
        },

        run: openQuestionList,

        close: function () {
            if (!questionList) {
                return;
            }
            win.minimize();
        }
    };

    function openQuestionList () {
        if (win) {
            win.show();
            return;
        }
        drawQuestionList();
    }

    /*
    * Create the page that shows the list of question
    */
    function  drawQuestionList () {

        //Before using the class question you need to use loadPrograms which loads the audescript program
        loadPrograms();

        //Needs for the creation of table
        window.AudeGUI.Runtime.loadIncludes(["htmltable2automaton","automaton2htmltable"],
        function () {
            createTable = audescript.m("htmltable2automaton").createTable;
            automaton2HTMLTable = audescript.m("automaton2htmltable").automaton2HTMLTable;
        });

        if (win && win.ws) {
            win.close();
            questionList.parentNode.removeChild(questionList);
        }

        let refs = {}; //  List of the references, {"#":"reference"}
        let questionListWindowContent = ["div#questionList.libD-ws-colors-auto libD-ws-size-auto", {"#":"root"}, [
                ["button#generate-automaton-specification-questionList",_("Settings")],
                ["div#questionList-container-button-navigation",[
                ["button#close-questionList", {"#": "close"}, _("Close the question list")]]],
                ["div#questionList-container", [ //Contains the chapter, and question
                    ["div#questionList-selection-chapter", [ //To select the chapter
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "1"}, _("Deterministic finite state machines")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "2"}, _("Non-deterministic finite state machines")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "3"}, _("Non-deterministic finite state machines with ε-transitions")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "4"}, _("Regular expressions and Kleene theorem")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "5"}, _("Grammars and regular grammars")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "6"}, _("Non-regular langages and iterative lemme")],
                        ]],
                        ["div#questionList-selection-question", {"style": "min-height:5%"}, _("No chapter selected.") ],
                    ]],
                ]];


        win = libD.newWin({ //Create a new window
            title:      _("Question List"),
            show:       true,
            fullscreen: true,
            content: libD.jso2dom(questionListWindowContent,refs)
        });

        //To use specification
        var buttonSpe = document.getElementById("generate-automaton-specification-questionList");
        buttonSpe.onclick = settingsAutomaton ;

        //When we chose a chapter
        var buttons = document.getElementsByClassName('questionList-selection-chapter-cell-button');
        for (var i=0,l=buttons.length;i<l;i++) {
            buttons[i].addEventListener('click',function(e) {
                if (chapterSelected)
                    chapterSelected.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ; //Change the color of the previous selected chapter
                e.target.style.backgroundColor = 'rgba(239, 100, 100)'; //Change to red when we click
                chapterSelected = e.target;
                drawQuestionChapter(e.target.value);
            });
            buttons[i].addEventListener('mouseover',function(e) { //Change the color to grey when mouseover
                if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                    e.target.style.backgroundColor = 'rgba(150, 150, 150)';
            });
            buttons[i].addEventListener('mouseout',function(e) { //Change the color to white when mouseout
                if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                    e.target.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ;
            });
        }

        questionList = refs.root;
        questionListContent = refs.content;

        // Close the question list
        refs.close.onclick = AudeGUI.QuestionList.close;
    }


    //Display a new window for the settings
    var settingsWin = null; //Contains the window
    var nameSelectedFile = ["none","none","none","none"]; //Name of the files that the users choose
    var modeSelected = null; //Mode: automaton1_2, grammar, er

    function settingsAutomaton () {
        //Local variable for the automataLoaded , when the user saved ,put them in the global variable
        var automataL = automataLoaded.slice();
        var localNameSelectedFile = nameSelectedFile.slice();
        var localAutomataLoaded = automataLoaded.slice() ;
        var localRandomly = randomly.slice();
        var localNbrState = nbrState.slice();
        var localAlphabet = alphabet.slice();
        var localNbrFinalStates = nbrFinalStates.slice();
        var localMode = mode.slice();
        var localNbTransitions = nbTransitions.slice();
        var localGrammarLoaded = null;
        var localRELoaded = null;
        var localRandomFiles = randomFiles;

        if (settingsWin===null || !settingsWin.ws ) {
            settingsWin = libD.newWin({
            minimizable: false,
            resizable: false,
            title:       _("Setting for the questions"),
            content : libD.jso2dom([
            ["div#div-settings-question",{"class":"libD-wm-content auto-size"},[
                ["h1",_("Settings")],
                ["div#questionList-selection-option", [ //To select the chapter
                    ["button",{"class":"load-mode","value": "auto1"}, _("Automaton1")],
                    ["button",{"class":"load-mode","value": "auto2"}, _("Automaton2")],
                    ["button",{"class":"load-mode","value": "re"}, _("Regular expression")],
                    ["button",{"class":"load-mode","value": "grammar"}, _("Grammar")],
                ]],
                ["div",{"class":"div-settings-question-container-row"},[
                    ["div",{"class":"div-settings-question-container-column"}, [
                        ["span",_("Select file ")],
                        ["span",_("Generate randomly ")],
                        ["span",_("Get random files ")],
                    ]],
                    ["div",{"class":"div-settings-question-container-column"}, [
                        ["input",{"class":"input-automaton-generate","type":"radio","name":"randomAutomaton","value":"selectFiles"}],
                        ["input",{"class":"input-automaton-generate","type":"radio","name":"randomAutomaton","value":"randomAutomaton"}],
                        ["input",{"class":"input-automaton-generate","type":"radio","name":"randomAutomaton","value":"randomFiles"}],
                    ]],
                ]],
                ["span#div-settings-question-automaton-random",[ //To enter information to generate randomly an automaton
                    ["h2",_("Automaton generated randomly")],
                    ["div",{"class":"div-settings-question-container-row"}, [
                        ["div",{"class":"div-settings-question-container-column"}, [
                            ["span",{"class":"span-settings-question"},_("Number of states: ")],
                            ["span",{"class":"span-settings-question"},_("Alphabet ")],
                            ["span",{"class":"span-settings-question"},_("Number of final states: ")],
                            ["span",{"class":"span-settings-question"},_("Mode: ")],
                            ["span",{"class":"span-settings-question"},_("Number of transitions: ")],
                        ]],
                        ["div",{"class":"div-settings-question-container-column"}, [
                            ["input",{"class":"input-settings-question","type":"text"}],
                            ["input",{"class":"input-settings-question","type":"text"}],
                            ["input",{"class":"input-settings-question","type":"text"}],
                            ["input",{"class":"input-settings-question","type":"text"}],
                            ["input",{"class":"input-settings-question","type":"text"}],
                        ]],
                    ]],
                ]],
                ["span#div-settings-question-automaton-select",{"style":"display:none"},[ //To select an automaton
                    ["h2",_("Automaton selection")],
                    ["div",_("Select an automaton from the list or from your computer")],
                    ["button#selection-automaton",_("Open automaton")],
                    ["span#",_("Selected automaton: "),[
                        ["span#display-name-file",_("none")],
                    ]],
                    ["br"],
                ]],
                ["span#div-settings-question-automaton-random-file",{"style":"display:none"},[
                    ["h2",_("Automaton selection")],
                    ["div",_("The automaton is selected randomly from files")],
                    ["br"],
                ]],
                ["span#div-settings-question-re-random",{"style":"display:none"},[
                    ["h2",_("Regular expression generated randomly")],
                    ["div",_("Create a random automaton by using the pararametes of the automaton 1 and converts it to a RE")],
                    ["div",_("Prefearbly select a regular expression from files")],
                ]],
                ["span#div-settings-question-re-select",{"style":"display:none"},[ //To select a regular expression
                    ["h2",_("Regular expression selection")],
                    ["div",_("Select a regular expression from the list or from your computer")],
                    ["button#selection-re",_("Open regular expression")],
                    ["span#",_("Selected regular expression: "),[
                        ["span#display-name-file-re",_("none")],
                    ]],
                    ["br"],
                ]],
                ["span#div-settings-question-re-random-file",{"style":"display:none"},[
                    ["h2",_("Regular expression selection")],
                    ["div",_("The regular expression is selected randomly from files")],
                    ["br"],
                ]],
                ["span#div-settings-question-grammar-random",{"style":"display:none"},[
                    ["h2",_("Grammar generated randomly")],
                    ["div",_("Create a random automaton by using the pararametes of the automaton 1 and converts it to a RE")],
                    ["div",_("Prefearbly select a grammar from files")],
                ]],
                ["span#div-settings-question-grammar-select",{"style":"display:none"},[ //To select a grammar
                    ["h2",_("Grammar selection")],
                    ["div",_("Select a grammar from the list or from your computer")],
                    ["button#selection-grammar",_("Open grammar")],
                    ["span#",_("Selected grammar: "),[
                        ["span#display-name-file-grammar",_("none")],
                    ]],
                    ["br"],
                ]],
                ["span#div-settings-question-grammar-random-file",{"style":"display:none"},[
                    ["h2",_("Grammar selection")],
                    ["div",_("The grammar is selected randomly from files")],
                    ["br"],
                ]],
                ["button#save-question-settings", _("Save")],
                ["button#save-exit-question-settings", _("Save and exit")],
            ]],
            ])});
            settingsWin.setAlwaysOnTop(100); //The window will be a at top
        }
            settingsWin.show();

            //To change the menu
            var buttons = document.getElementsByClassName('load-mode');
            for (var i=0,l=buttons.length;i<l;i++) {
                buttons[i].addEventListener('click',function(e) {
                    if (modeSelected)
                        modeSelected.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ; //Change the color of the previous selected chapter
                    e.target.style.backgroundColor = 'rgba(239, 100, 100)'; //Change to red when we click
                    modeSelected = e.target;
                    if (e.target.value==="auto1")
                        displayModeSelected(0);
                    else if (e.target.value==="auto2")
                        displayModeSelected(1);
                    else if (e.target.value==="re")
                        displayModeSelected(2);
                    else if (e.target.value==="grammar")
                        displayModeSelected(3);
                    settingsWin.resize(); //Resize the window when we change mode
                });
                buttons[i].addEventListener('mouseover',function(e) { //Change the color to grey when mouseover
                    if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                        e.target.style.backgroundColor = 'rgba(150, 150, 150)';
                });
                buttons[i].addEventListener('mouseout',function(e) { //Change the color to white when mouseout
                    if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                        e.target.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ;
                });
            }
            //The radio button
            var chec = document.getElementsByClassName("input-automaton-generate");

            //By default it's the first mode (automaton 1) selected
            displayModeSelected(0);
            modeSelected = buttons[0];
            modeSelected.style.backgroundColor = 'rgb(239, 100, 100)' ; //Change the color of the previous selected chapter

            //Save and quit
            document.getElementById("save-exit-question-settings").onclick = function() {
                saveSettings();
                settingsWin.close();
            };

            //Save the informations
            document.getElementById("save-question-settings").onclick = saveSettings;
            function saveSettings () {
                randomly = localRandomly.slice();
                for (var numAutomaton=0; numAutomaton<2;numAutomaton++) {
                    if (randomly[numAutomaton] == 1) {
                        nbrState[numAutomaton] = parseInt(localNbrState[numAutomaton],10);
                        alphabet[numAutomaton] = [];
                        var cara= "";
                        for  (var c of String(localAlphabet[numAutomaton]))  { //Get the alphabet
                            if (c==',') {
                                alphabet[numAutomaton].push(cara);
                                cara="";
                            }
                            else
                                cara+=c;
                        }
                        alphabet[numAutomaton].push(cara);
                        nbrFinalStates[numAutomaton] = parseInt(localNbrFinalStates[numAutomaton],10);
                        mode[numAutomaton] = parseInt(localMode[numAutomaton],10);
                        nbTransitions[numAutomaton] = parseInt(localNbTransitions[numAutomaton],10);
                        automataLoaded[numAutomaton] = null;

                    }
                    else if (randomly[numAutomaton] == 0) {
                        automataLoaded[numAutomaton] = automataL[numAutomaton];
                        nameSelectedFile[numAutomaton] = localNameSelectedFile[numAutomaton];
                    }
                }

                for (var numAutomaton=2; numAutomaton<4;numAutomaton++) {
                    if (randomly[numAutomaton] == 0) {
                        nameSelectedFile[numAutomaton] = localNameSelectedFile[numAutomaton];
                    }
                }

                grammarLoaded = localGrammarLoaded;
                RELoaded = localRELoaded;
            };

            /*Display the selected mode between automaton1, automaton2, ER, grammar */
            function displayModeSelected(numAutomaton) {

                //For menu automaton1 and automaton2
                if(numAutomaton===0 || numAutomaton===1) {
                    //Hide the other menus
                    document.getElementById("div-settings-question-re-random").style.display="none";
                    document.getElementById("div-settings-question-re-select").style.display="none";
                    document.getElementById("div-settings-question-re-random-file").style.display="none";
                    document.getElementById("div-settings-question-grammar-random").style.display="none";
                    document.getElementById("div-settings-question-grammar-select").style.display="none";
                    document.getElementById("div-settings-question-grammar-random-file").style.display="none";

                    //Display the name of the current automaton loaded
                    document.getElementById("display-name-file").innerHTML = localNameSelectedFile[numAutomaton];

                    //Button to open a window for the selection on an automaton
                    document.getElementById('selection-automaton').onclick = chooseFile.bind(null,"automaton");

                    chec[0].onclick= checkRemove.bind(null,'div-settings-question-automaton-select','div-settings-question-automaton-random','div-settings-question-automaton-random-file',0);
                    chec[1].onclick= checkRemove.bind(null,'div-settings-question-automaton-select','div-settings-question-automaton-random','div-settings-question-automaton-random-file',1);
                    chec[2].onclick= checkRemove.bind(null,'div-settings-question-automaton-select','div-settings-question-automaton-random','div-settings-question-automaton-random-file',2);

                    checkRemove('div-settings-question-automaton-select','div-settings-question-automaton-random','div-settings-question-automaton-random-file',localRandomly[numAutomaton]);

                    var inputs = document.getElementsByClassName('input-settings-question');

                    inputs[0].onchange = function () {localNbrState[numAutomaton]=inputs[0].value}; //Change the local variable when writing new informations
                    inputs[1].onchange = function () {localAlphabet[numAutomaton]=inputs[1].value};
                    inputs[2].onchange = function () {localNbrFinalStates[numAutomaton]=inputs[2].value};
                    inputs[3].onchange = function () {localMode[numAutomaton]=inputs[3].value};
                    inputs[4].onchange = function () {localNbTransitions[numAutomaton]=inputs[4].value};

                    //Put the local variable in the inputs when loading the window
                    inputs[0].value=localNbrState[numAutomaton];
                    inputs[1].value=localAlphabet[numAutomaton];
                    inputs[2].value=localNbrFinalStates[numAutomaton];
                    inputs[3].value=localMode[numAutomaton];
                    inputs[4].value=localNbTransitions[numAutomaton];

                }

                //To select regex
                else if (numAutomaton===2) {
                    //Hide the other menus
                    document.getElementById("div-settings-question-automaton-random").style.display="none";
                    document.getElementById("div-settings-question-automaton-select").style.display="none";
                    document.getElementById("div-settings-question-automaton-random-file").style.display="none";
                    document.getElementById("div-settings-question-grammar-random").style.display="none";
                    document.getElementById("div-settings-question-grammar-select").style.display="none";
                    document.getElementById("div-settings-question-grammar-random-file").style.display="none";

                    //Display the name of the current file loaded
                    document.getElementById("display-name-file-re").innerHTML = localNameSelectedFile[numAutomaton];
                    //Button to open a window for the selection on an automaton
                    document.getElementById('selection-re').onclick = chooseFile.bind(null,"re");

                    //For the check input
                    chec[0].onclick= checkRemove.bind(null,'div-settings-question-re-select','div-settings-question-re-random','div-settings-question-re-random-file',0);
                    chec[1].onclick= checkRemove.bind(null,'div-settings-question-re-select','div-settings-question-re-random','div-settings-question-re-random-file',1);
                    chec[2].onclick= checkRemove.bind(null,'div-settings-question-re-select','div-settings-question-re-random','div-settings-question-re-random-file',2);
                    checkRemove('div-settings-question-re-select','div-settings-question-re-random','div-settings-question-re-random-file',localRandomly[numAutomaton]);
                }

                //To select grammar
                else if (numAutomaton===3) {
                    //Hide the other menus
                    document.getElementById("div-settings-question-automaton-random").style.display="none";
                    document.getElementById("div-settings-question-automaton-random-file").style.display="none";
                    document.getElementById("div-settings-question-automaton-select").style.display="none";
                    document.getElementById("div-settings-question-re-random").style.display="none";
                    document.getElementById("div-settings-question-re-select").style.display="none";
                    document.getElementById("div-settings-question-re-random-file").style.display="none";
                    //Display the name of the current file loaded
                    document.getElementById("display-name-file-grammar").innerHTML = localNameSelectedFile[numAutomaton];
                    //Button to open a window for the selection on an automaton
                    document.getElementById('selection-grammar').onclick = chooseFile.bind(null,"grammar");

                    chec[0].onclick= checkRemove.bind(null,'div-settings-question-grammar-select','div-settings-question-grammar-random','div-settings-question-grammar-random-file',0);
                    chec[1].onclick= checkRemove.bind(null,'div-settings-question-grammar-select','div-settings-question-grammar-random','div-settings-question-grammar-random-file',1);
                    chec[2].onclick= checkRemove.bind(null,'div-settings-question-grammar-select','div-settings-question-grammar-random','div-settings-question-grammar-random-file',2);
                    checkRemove('div-settings-question-grammar-select','div-settings-question-grammar-random','div-settings-question-grammar-random-file',localRandomly[numAutomaton]);
                }

                //To hide and show the 3 names of divs given
                //number indicates which will be shown
                function checkRemove (name1, name2, name3, number) {
                    if (number==0 )  {
                        document.getElementById(name1).style.display = "inherit";
                        document.getElementById(name2).style.display = "none";
                        document.getElementById(name3).style.display = "none";
                        localRandomly[numAutomaton] = 0;
                        chec[0].checked = true;
                    } else if (number==1) {
                        document.getElementById(name1).style.display = "none";
                        document.getElementById(name2).style.display = "inherit";
                        document.getElementById(name3).style.display = "none";
                        localRandomly[numAutomaton] = 1;
                        chec[1].checked = true;
                    } else if (number==2) {
                        document.getElementById(name1).style.display = "none";
                        document.getElementById(name2).style.display = "none";
                        document.getElementById(name3).style.display = "inherit";
                        localRandomly[numAutomaton] = 2;
                        chec[2].checked = true;
                    }
                    settingsWin.resize(); //Resize the window when we change random generation
                }


                //Display a window which lets the user selects a file, type=automaton, er, grammar
                function chooseFile (type) {

                    var listFiles = null; //List of all the automata for each exercice
                    var selectedQuestion = null;
                    if (contentListFilesParsed==null){
                        getFile(
                            "files_question/listFiles.json",
                            function(content) {displayWin(content)},
                            function (message, status) {
                                var msg = null;
                                if (message === "status") {
                                    msg = libD.format(_("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"), status);
                                }
                                if (message === "send") {
                                    msg = _("This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information");
                                }
                                AudeGUI.notify(_("Unable to get the list of needed files"), msg);
                            }
                        );
                    }
                    else
                        makeWindow();

                    function displayWin (content) {
                        contentListFilesParsed= JSON.parse(content); //Transform the JSON file (where there are the folders and names of automata) in object
                        makeWindow();
                    }

                    //Creation of the window to select an automaton
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
                                        ["p", ["button#but-load-localfile",_("Load a file")]],
                                        ["input#input-file-auto",{"type":"file","style":"display:none"}], //To load file
                                    ]],
                                    ["div#load-automaton-main-container",[
                                        ["div#load-automaton-question", [ //The list of exercice
                                            ["p",{"class":"title"},_("List of questions")],
                                        ]],
                                        ["span",{"class":"load-automaton-sep"}],
                                        ["div#load-automaton-question-list", [ //The list of automata for the selected exercice
                                            ["p",{"class":"title"},_("List of automata")],
                                        ]],
                                        ["span",{"class":"load-automaton-sep"}],
                                        ["div#display-loaded-automaton"],
                                    ]]
                                ]])
                            });
                            winLoadAutomaton.setAlwaysOnTop(1001); //To put in front window

                            //To load local file
                            document.getElementById("but-load-localfile").onclick = function() {
                                var inputFile=document.getElementById("input-file-auto");
                                inputFile.click(); //When we click on the button it allows the user to select a file

                                inputFile.onchange = function() { //When he had selected the file, it opens it
                                    localNameSelectedFile[numAutomaton] = inputFile.value;
                                    var freader = new FileReader();

                                    if (type==="automaton") {
                                        document.getElementById("display-name-file").innerHTML=inputFile.value; //To display the name of the file on the settings window
                                        divContentFile.innerHTML="";
                                        var designer = new AudeDesigner(divContentFile, true); //Create a designer to put the automaton in

                                        freader.onload = function () { //load the file
                                            if (/.txt$/.test(inputFile.value)) //Load a text file
                                                designer.setAutomatonCode(freader.result); //Display the automaton
                                            else if (/.svg$/.test(inputFile.value)) //Load a svg file
                                                designer.setSVG(freader.result);
                                            automataL[numAutomaton]= designer.getAutomaton(0); //Get the automaton displayed
                                            designer.autoCenterZoom();
                                        };
                                    }
                                    else if(type==="re") {
                                        document.getElementById("display-name-file-re").innerHTML=inputFile.value; //To display the name on the settings window
                                        freader.onload = function () { //load the file
                                                divContentFile.innerHTML=freader.result;
                                                localRELoaded = freader.result;
                                        };
                                    }
                                    else if(type==="grammar") {
                                        document.getElementById("display-name-file-grammar").innerHTML=inputFile.value; //To display the name on the settings window
                                        freader.onload = function () { //load the file
                                                divContentFile.innerHTML=freader.result;
                                                localGrammar = freader.result;
                                        };
                                    }
                                    freader.readAsText(inputFile.files[0], "utf-8");
                                 };
                            }


                            var div = document.getElementById('load-automaton-question');
                            var divListFiles = document.getElementById('load-automaton-question-list');
                            var divContentFile = document.getElementById('display-loaded-automaton');
                            var namesQuestion = Object.keys(contentListFilesParsed); //The list of name exercice


                            //Display the list of question
                            for (var i = 0, l=namesQuestion.length; i < l; i++) {
                                if (contentListFilesParsed[namesQuestion[i]].type===type) {
                                    var but = document.createElement("button");
                                    but.innerHTML = namesQuestion[i][0].toUpperCase() + namesQuestion[i].slice(1); //The first letter in uppercase
                                    but.className = "load-automaton-button";
                                    but.value = namesQuestion[i];

                                    //When we click on the button it shows the list of automata corresponding to the question
                                    but.addEventListener('click',function(e) {
                                        if (selectedQuestion)
                                            selectedQuestion.style.backgroundColor = 'inherit' ; //Change the color of the previous selected question
                                        butDispListFiles(e.target);
                                        e.target.style.backgroundColor = 'rgba(239, 100, 100)'; //Change to red when we click
                                        selectedQuestion = e.target;
                                    });
                                    but.addEventListener('mouseover',function(e) { //Change the color to grey when mouseover
                                        if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                                            e.target.style.backgroundColor = 'rgba(150, 150, 150)';
                                    });
                                    but.addEventListener('mouseout',function(e) { //Change the color to white when mouseout
                                        if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                                            e.target.style.backgroundColor = 'inherit' ;
                                    });

                                    div.appendChild(but);
                                }
                            }

                            //Display the list of files
                            function butDispListFiles (question) {
                                selectedQuestion = question.value;
                                divListFiles.innerHTML = "<p class='title'>List of files</p>";
                                for (var j = 0, len=contentListFilesParsed[question.value].tab.length; j < len; j++) {
                                    if (contentListFilesParsed[question.value].type===type) {
                                        var auto = document.createElement("div");
                                        auto.className = "load-button";
                                        auto.innerHTML = contentListFilesParsed[question.value].tab[j].replace(/.(txt)|(.svg)$/,'');
                                        divListFiles.appendChild(auto);

                                        //Display the file when you click on the name
                                        auto.addEventListener('click',butDispFile.bind(null,question.value,contentListFilesParsed[question.value].tab[j]) );
                                    }
                                }
                            }

                            //Display the selected file
                            function butDispFile (nameQuestion,nameFile) {

                                localNameSelectedFile[numAutomaton] = nameFile;

                                if (type==="automaton") {
                                    document.getElementById("display-name-file").innerHTML=nameFile; //To display the name on the settings window
                                    divContentFile.innerHTML="";
                                    var designer = new AudeDesigner(divContentFile, true); //Create a designer to put the automaton in

                                    getFile("files_question/"+nameQuestion+"/"+nameFile,function(text) { //load the file
                                        if (/.txt$/.test(nameFile)) //Load a text file
                                            designer.setAutomatonCode(text); //Display the automaton
                                        else if (/.svg$/.test(nameFile))  //Load a svg file
                                            designer.setSVG(text); //Display the automaton
                                        automataL[numAutomaton]= designer.getAutomaton(0);
                                        designer.autoCenterZoom();
                                    });
                                }
                                else if(type==="re") {
                                    document.getElementById("display-name-file-re").innerHTML=nameFile; //To display the name on the settings window
                                    getFile("files_question/"+nameQuestion+"/"+nameFile,function(text) { //load the file
                                            divContentFile.innerHTML=text;
                                            localRELoaded = text;
                                    });
                                }
                                else if(type==="grammar") {
                                    document.getElementById("display-name-file-grammar").innerHTML=nameFile; //To display the name on the settings window
                                    getFile("files_question/"+nameQuestion+"/"+nameFile,function(text) { //load the file
                                            divContentFile.innerHTML=text;
                                            localGrammarLoaded = text;
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

    //Dislpay the list of question corresponding to the selected chapter
    function  drawQuestionChapter (chapter) {
        var div = document.getElementById('questionList-selection-question'); //Area to display the list
        div.innerHTML="";
        switch (parseInt(chapter))
        {   case 1:
                div.appendChild(libD.jso2dom([
                ["button", {"value": ("mcq1"), "class":"questionList-question-select"}, _("Multiple choice questions")],["br"],
                ["button", {"value": ("complement"), "class":"questionList-question-select"}, _("Complement the automaton")],["br"],
                ["button", {"value": ("complete"), "class":"questionList-question-select"}, _("Complete the automaton")],["br"],
                ["button", {"value": ("product"), "class":"questionList-question-select"}, _("Do the product of 2 automata")],["br"],
                ["button", {"value": ("minimize"), "class":"questionList-question-select"}, _("Minimize the automaton")],["br"],
                ["button", {"value": ("equivalenceStates"), "class":"questionList-question-select"}, _("List all the equivalent states")],["br"],
                ["button", {"value": ("equivalencyAutomata"), "class":"questionList-question-select"}, _("Equivalency between 2 automata")],["br"],
                ["button", {"value": ("automaton2Table"), "class":"questionList-question-select"}, _("Give the tabular form of the automaton")],["br"],
                ["button", {"value": ("table2Automaton"), "class":"questionList-question-select"}, _("Give the automaton from the table")],["br"],
                ["button", {"value": ("accessible"), "class":"questionList-question-select"}, _("List the accessible states")],["br"],
                ["button", {"value": ("coaccessible"), "class":"questionList-question-select"}, _("List the co-accessible states")],["br"],
                ["button", {"value": ("word"), "class":"questionList-question-select"}, _("Give a word recognized by the automata")],["br"],
                ]));
                break;
            case 2:
                div.appendChild(libD.jso2dom([
                ["button", {"value": ("determinize"), "class":"questionList-question-select"}, _("Determinize the automaton")],["br"],
                ["button", {"value": ("determinize_minimize"), "class":"questionList-question-select"}, _("Determinize and minimize the automaton")],["br"],
                ["button", {"value": ("word"), "class":"questionList-question-select"}, _("Give a word recognized by the automata")],["br"],
                ]
                ));
                break;
            case 3:
                div.appendChild(libD.jso2dom([
                ["button", {"value": ("eliminate"), "class":"questionList-question-select"}, _("Eliminate the ε-transitions")],["br"],
                ["button", {"value": ("determinize_eliminate"), "class":"questionList-question-select"}, _("Determinize and eliminate the ε-transitions")],["br"],
                ["button", {"value": ("word"), "class":"questionList-question-select"}, _("Give a word recognized by the automata")],["br"],
                ]));
                break;
            case 4:
                div.appendChild(libD.jso2dom([
                ["button", {"value": ("automaton2RE"), "class":"questionList-question-select"}, _("Give a RE which corresponds to the automaton")],["br"],
                ["button", {"value": ("RE2automaton"), "class":"questionList-question-select"}, _("Give the automaton corresponding to the RE")],["br"],
                ]));
                break;
            case 5:
                div.appendChild(libD.jso2dom([
                ["button", {"value": ("grammar2Automaton"), "class":"questionList-question-select"}, _("Give the automaton corresponding to the right linear grammar")],["br"],
                ["button", {"value": ("automaton2Grammar"), "class":"questionList-question-select"}, _("Give the right linear grammar corresponding to the automaton")],["br"],
                ["button", {"value": ("leftGrammar2RightGrammar"), "class":"questionList-question-select"}, _("Convert the left linear grammar to the right linear grammar")],["br"],
                ]));
                break;

            default:
                div.appendChild(libD.jso2dom([
                ["span",{"class":"questionList-question"}, _("No question")]]));
        }

        //To display the question when clicked
        var buttonQuestion = document.getElementsByClassName('questionList-question-select')
        for (var i=0,l=buttonQuestion.length;i<l;i++) {
            buttonQuestion[i].addEventListener('click',async function(e) {

                //We create the question
                var q = new Question(e.target.value);
                //If no automaton/grammar/re loaded and the automaton/grammar/re is not created hazardly
                if (q.typeQuestion=="mcq" || (randomly[0]===2 && q.typeQuestion=="automaton") || (randomly[2]===2 && q.typeQuestion=="RE") || (randomly[3]===2 && q.typeQuestion=="grammar") ||
                (automataLoaded[0]===null && randomly[0]===0 && q.typeQuestion=="automaton") || (RELoaded===null && randomly[2]===0 && q.typeQuestion=="RE") ||
                grammarLoaded===null && randomly[3]===0 && q.typeQuestion=="grammar") {
                    await getListFiles(); //Load the file json with all the exercice
                    await getRandomFiles(q,e.target.value); //Load a random automaton/grammar... from the file
                    q.correctionQuestion();
                }

                //Other question we initialize automaton/grammar... and correct automaticaly the question
                else {
                    q.settingsCreateAutomaton(randomly,nbrState,alphabet,nbrFinalStates,mode,nbTransitions);
                    q.initializeAutomata(automataLoaded);
                    q.initializeRegex(RELoaded);
                    q.initializeGrammar(grammarLoaded);
                    q.correctionQuestion();
                }

                questionSelected = e.target.value;
                var div = document.getElementById("questionList-container"); //Area to display the question
                var divBut = document.getElementById("questionList-container-button-navigation"); //Area to display the question
                div.innerHTML="";
                divBut.appendChild(libD.jso2dom([
                    ["button#menu-questionList", _("Menu questions")],
                    ["button#questionList-restart", _("Restart")],
                    ]
                ));
                var but = document.getElementById("menu-questionList"); //The button permits to return to the menu
                but.onclick = reDrawQuestionList;
                var butRestart = document.getElementById("questionList-restart"); //The button permits to regenerate the question
                butRestart.onclick = async function () { //Recreate the page with a new element (automaton-re-grammar) for the question
                    //If no automaton loaded and the automaton is not created hazardly
                    if (q.typeQuestion=="mcq" || (randomly[0]===2 && q.typeQuestion=="automaton") || (randomly[2]===2 && q.typeQuestion=="RE") || (randomly[3]===2 && q.typeQuestion=="grammar") ||
                    (automataLoaded[0]===null && randomly[0]===0 && q.typeQuestion=="automaton") || (RELoaded===null && randomly[2]===0 && q.typeQuestion=="RE") ||
                    grammarLoaded===null && randomly[3]===0 && q.typeQuestion=="grammar") {
                        await getListFiles();
                        await getRandomFiles(q,q.underTypeQuestion);
                        q.correctionQuestion();
                        div.innerHTML='';
                        drawQuestion(q,div);
                    }
                    else {
                        q.settingsCreateAutomaton(randomly,nbrState,alphabet,nbrFinalStates,mode,nbTransitions);
                        q.initializeAutomata(automataLoaded); // Create a new automaton
                        q.initializeRegex(RELoaded); //Create a new regex if needed
                        q.initializeGrammar(grammarLoaded);
                        q.correctionQuestion(); //Correct the question
                        div.innerHTML='';
                        drawQuestion(q,div);
                    }
                };
                drawQuestion(q,div);
            });
        }
    }

    //Get a random files for the given question
    function getRandomFiles(q,nameQuestion) {
        return new Promise (function(resolve,reject) {
            if (randomQuestionDone[nameQuestion] === undefined)
                randomQuestionDone[nameQuestion] = [];
            if (contentListFilesParsed[nameQuestion]===undefined)
                throw new Error("The exercice has no file to load");
            else
                var files = contentListFilesParsed[nameQuestion].tab; //The list of files for the question

            var rand = Math.floor(Math.random() * (files.length));

            if(randomQuestionDone[nameQuestion].length===files.length) { //If all exercices done, reset the array
                console.log("You have done all the exercices.");
                randomQuestionDone[nameQuestion].length=0;
            }
            while (randomQuestionDone[nameQuestion].indexOf(files[rand]) > -1) { //Look for the first exercice not already done
                rand = (rand +1) % (files.length);
            }
            randomQuestionDone[nameQuestion].push(files[rand]);


            getFile("files_question/"+nameQuestion+"/"+files[rand], async function(text) { //Get a random file

                if(q.typeQuestion=="mcq") //A mcq we load the question
                    q.load(text);
                else if(q.typeQuestion=="RE") //A RE we load the string(re)
                    q.addRE(text);
                else if(q.typeQuestion=="grammar") //A grammar we load the string(grammar)
                    q.addGrammar(text);

                else if(q.typeQuestion=="automaton") {
                    var div = document.createElement("div");
                    var designer = new AudeDesigner(div, true);
                    designer.setAutomatonCode(text);
                    q.addAutomaton(designer.getAutomaton(0)); //Load the automaton

                    //Need to load a second automaton
                    if (q.need2AutomataQuestion()) {
                        if (/([\d])\./.test(files[rand])) {
                            var T=(parseInt(RegExp.$1,10)%2+1)+".";
                            var complFile = files[rand].replace(/([\d])\./,T);
                            await function() { //Wait for the second file to be loaded
                                return new Promise (function(resolve,reject) {
                                    getFile("files_question/"+nameQuestion+"/"+complFile, function(text) {
                                        designer.setAutomatonCode(text);
                                        q.addAutomaton(designer.getAutomaton(0),1);
                                        resolve();
                                    });
                                })
                            }();
                        }
                        else {
                            throw new error("Can't load the second automaton.");
                        }
                    }
                }
                resolve();
            },function() {throw new error("Error loading file");});
        })
    }

    //Get the list of files and parse it
    function getListFiles () {
        return new Promise (function(resolve,reject) {
            if (contentListFilesParsed!==null)
                resolve();
            else {
                getFile("files_question/listFiles.json", function(content) {
                    contentListFilesParsed = JSON.parse(content);
                    resolve();
                })
            }
        })
    }




    //Redraw the menu as it was before selected a question
    function reDrawQuestionList () {
        drawQuestionList(); //Display the main page
        drawQuestionChapter(chapterSelected.value); //Display the question for the chapter we were looking
        chapterSelected = document.getElementsByClassName('questionList-selection-chapter-cell-button')[chapterSelected.value-1];
        chapterSelected.style.backgroundColor='rgba(239, 100, 100)'; //Draw in red the chapter
    }

    //Display the question on the div
    function drawQuestion (question,div) {
        div.appendChild( libD.jso2dom([
            ["div#question-wording", _("Question: ")],
            ["div#question-automata-designer"], //To put the automaton for the question
            ["div.button-container",[
                ["button#question-validate",_("Validate")],
                ["button#question-display-response",_("Display response")]
            ]],
            ["div#question-answers"], //Answer of the user
            ]
        ));
        //Validate the response
        var butValidate = document.getElementById("question-validate");
        butValidate.addEventListener("click",function(e) {
            switch (question.answerMode()) {
                case "automaton":
                    question.userResponse = designerAnswer.getAutomaton(0); //Give the automaton
                    break;
                case "input": case "re":
                    question.userResponse = document.getElementById("question-answers-input").value; //Give the value of the input
                    break;
                case "radio":
                    var repCheck = "";
                    var radio =  document.getElementsByClassName("question-answers-radio"); //Give the checked radio-button
                    for (var i=0,l=radio.length;i<l;i++) {
                        if (radio[i].checked)
                            repCheck = radio[i].value;
                    }
                    question.userResponse = repCheck;
                    break;
                case "table":
                    question.userResponse = document.getElementById("question-answers-table"); //Give the div containing the table
                    break;
                case "checkbox":
                    var repCheck = [];
                    var divCheckbox =  document.getElementById("question-answers-checkbox").firstChild; //Give the ul which contains the checkbox
                    for (var i=0,l=divCheckbox.children.length;i<l;i++) {
                        if (divCheckbox.children[i].children[0].children[0].checked) //Look if the checkbox is checked
                            repCheck.push(divCheckbox.children[i].children[0].children[0].value);
                    }
                    question.userResponse = repCheck;
                    break;
                case "grammar":
                    question.userResponse = getInputGrammar();
                    break;
            }
            correctionQuestion(question);
        });
        //To display the response
        var butDispResp = document.getElementById("question-display-response");
        butDispResp.onclick = displayResponse.bind(null,question,"")

        //Display the wording
        var divWording = document.getElementById("question-wording");
        textFormat(question.wording,divWording,true);

        //Display other informations for the question (automaton,er,grammar)
        var divInformationWording = document.getElementById("question-automata-designer");
        if (!question.needAutomatonQuestion())
            divInformationWording.id = "question-wordindg-information";


        //Display other informations (automaton,table,grammar...)
        //If there are 2 automata needed
        if (question.need2AutomataQuestion()) {
            divInformationWording.appendChild(libD.jso2dom([
                ["div#question-automata-designer-right"]]));
            divInformationWording.appendChild(libD.jso2dom([
                ["div#question-automata-designer-left"]]));
            var designerRight = new AudeDesigner(document.getElementById("question-automata-designer-right"), true);
            designerRight.setAutomatonCode(automaton_code(question.automaton[0]));
            designerRight.autoCenterZoom();
            var designerLeft = new AudeDesigner(document.getElementById("question-automata-designer-left"), true);
            designerLeft.setAutomatonCode(automaton_code(question.automaton[1]));
            designerLeft.autoCenterZoom();
        }
        //If there is 1 automaton needed
        else if (question.needAutomatonQuestion()) {
            var designer = new AudeDesigner(divInformationWording, true);
            designer.setAutomatonCode(automaton_code(question.automaton[0]));
            designer.autoCenterZoom();

        //Draw a table
        } else if (question.underTypeQuestion === "table2Automaton") {
            divInformationWording.appendChild(automaton2HTMLTable(question.automaton[0]));

        //Draw the RE
        } else if (question.underTypeQuestion === "RE2automaton") {
            divInformationWording.appendChild(document.createTextNode(question.regex));


        //Draw the the grammar
        } else if (question.underTypeQuestion === "grammar2Automaton" || question.underTypeQuestion === "leftGrammar2RightGrammar") {
            divInformationWording.appendChild(document.createTextNode(question.grammar.toString()));


        } else {
            divInformationWording.style.display = "none";
        }

        //Area to allow the user to write the answer
        var divAnswersUser = document.getElementById("question-answers");
        switch (question.answerMode()) {
            case "automaton":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["div#question-answers-automaton",_("You can draw the automaton bellow.")]]));
                var designerAnswer = new AudeDesigner(document.getElementById("question-answers-automaton"), false); //Contains the automata
                break;
            case "input": case "re":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["input#question-answers-input",{"type":"text"}]]));
                if(question.underTypeQuestion==="equivalenceStates")
                    document.getElementById("question-answers-input").placeholder="Write couples of states";
                else
                    document.getElementById("question-answers-input").placeholder="Write the answer here";
                break;
            case "grammar":
                inputGrammar(divAnswersUser);
                break;

            case "radio":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["form",[
                        ["fieldset",[
                            ["input",{"class":"question-answers-radio","type":"radio","name":"response","value":"true"}],
                            ["label",("Yes")],["br"],
                            ["input",{"class":"question-answers-radio","type":"radio","name":"response","value":"false"}],
                            ["label",("No")],["br"]
                        ]],
                    ]],
                ]));
                break;

            case "table":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["div#question-answers-table"]]));
                createTable("",document.getElementById("question-answers-table"));
                var divT = document.getElementById('div-container-table');
                divT.childNodes[4].style.display = "none"; //Remove buttons "create automaton","X"
                break;

            //For the mcq
            case "checkbox":
                var qid = 0; var refs=[];
                var divCheckbox= document.createElement("div");
                divCheckbox.id="question-answers-checkbox";
                divAnswersUser.appendChild(divCheckbox);
                divCheckbox.appendChild(document.createElement("ul"))

                for (var j = 0, leng = question.choices.length; j < leng; ++j) {
                    qid = question.choices[j].hasOwnProperty("id") ? question.choices[j].id : (parseInt(i, 10) + 1);
                    divCheckbox.firstChild.appendChild(libD.jso2dom(["li", ["label", [
                        ["input", {"type": "checkbox","value":qid}],
                        ["span.quiz-answer-id", qid + ". "],
                        ["span", {"#": j + "content"}]
                    ]]], refs));

                    if (question.choices[j].automaton) {
                            automaton2svg(
                                automatonFromObj(question.choices[j].automaton),
                                function (res) {
                                    refs[j + "content"].innerHTML = res;
                                }
                            );

                    } else if (question.choices[j].html) {
                        refs[j + "content"].innerHTML = question.choices[j].html;
                    } else if (question.choices[j].text) {
                        textFormat(question.choices[j].text, refs[j + "content"]);
                    } else if (question.choices[j].html) {
                        textFormat(question.choices[j].html, refs[j + "content"], true);
                    }
                }
                break;
        }
    }

    //Show if the user response is correct
    function correctionQuestion(question) {
        var dispResp;
        var div = document.createElement("div");
        if (question.isCorrect()===false) {
            dispResp=_("Wrong answer");
            div.style.color="red";
        }
        else if (question.isCorrect()===true) {
            dispResp=_("True answer");
            div.style.color="green";
        }
        div.innerHTML = dispResp;
        AudeGUI.notify(("Correction"),div ,"normal",4000); //Show the notification
    }

    //Display the solution of the question in the div
    function displayResponse(question,div) {
        var response = question.response;
        switch (question.answerMode()) {
            case "automaton":
                if (div==='' || div===undefined  ) { //Create an area to display the automaton response
                    var div=document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-automaton")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-automaton"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["div#question-solution-automaton"]]));
                var designer = new AudeDesigner(document.getElementById("question-solution-automaton"), true);
                designer.setAutomatonCode(automaton_code(response)); //Display the automaton response
                designer.autoCenterZoom();
                break;

            case "input": case "re": case "grammar":
                if (div==='' || div===undefined  ) { //Create an area to display the input response
                    var div=document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-input")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["span#question-solution-input"]]));
                document.getElementById("question-solution-input").innerHTML = response;
                break;

            case "radio":
                if (div==='' || div===undefined  ) { //Create an area to display the input response
                    var div=document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-input")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["span#question-solution-input"]]));
                document.getElementById("question-solution-input").innerHTML = response;
                break;

            case "table":
                if (div==='' || div===undefined  ) { //Create an area to display the input response
                    var div=document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-table")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-table"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["span#question-solution-table"]]));
                document.getElementById("question-solution-table").appendChild(response);
                break;

            case "checkbox":
                if (div==='' || div===undefined  ) { //Create an area to display the input response
                    var div=document.getElementById("question-wording").parentNode;
                        if (document.getElementById("question-solution-input")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["span#question-solution-input"]]));
                document.getElementById("question-solution-input").innerHTML = "The correct choice: "+ response;
                break;
        }
    }

    //To diplay katex
    function textFormat(text, node, html) {
        if (!node) {
            node = document.createElement("span");
        }

        node[html ? "innerHTML" : "textContent"] = text instanceof Array ? mathDisplay(text.join("")) : text;

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
