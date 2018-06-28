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
}(window));


(function(pkg,that){
    //List of all the question
    var underTypeQuestionList = ["complement","complete","product","minimize","equivalenceStates","equivalencyAutomata","automaton2Table","table2Automaton"
    ,"accessible","coaccessible","word","determinize","determinize_minimize","eliminate","determinize_eliminate","automaton2RE","RE2automaton","grammar2Automaton",
"automaton2Grammar","leftGrammar2RightGrammar"];
    //Need automaton for the response
    var underTypeQuestionNeedAutomaton = ["complement","complete","product","minimize","determinize","determinize_minimize","eliminate",
    "determinize_eliminate","RE2automaton","grammar2Automaton"];
    //Need automaton for the wording
    var underTypeQuestionNeedAutomatonWording = ["complement","complete","product","minimize","equivalenceStates","equivalencyAutomata",
    "table2Automaton","automaton2Table","accessible","coaccessible","word","determinize","determinize_minimize","eliminate","determinize_eliminate",
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
    var giveLittlerWord = null;
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
    "automaton2htmltable","htmltable2automaton","createAutomaton","littlerWord","determinization","epsElimination","regex2automaton","automaton2regex","automaton2RightLinearGrammar",
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
        giveLittlerWord = audescript.m("littlerWord").giveLittlerWord;
        epsElim = audescript.m("epsElimination").epsElim;
        hasEpsilonTransitions = audescript.m("epsElimination").hasEpsilonTransitions
        regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
        automatonToRegex = audescript.m("automaton2regex").automatonToRegex;
        leftLinear2RightLinearGrammar = audescript.m("leftLinear2RightLinearGrammar").leftLinear2RightLinearGrammar;
        rightLinear2LeftLinearGrammar = audescript.m("rightLinear2LeftLinearGrammar").rightLinear2LeftLinearGrammar;
        linearGrammar2Automaton = audescript.m("linearGrammar2Automaton").linearGrammar2Automaton;
        automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
        isLeftLinear = audescript.m("leftLinear2RightLinearGrammar").isLeftLinear;
        //regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
    });
    }

    //Class Question: wording, typeQuestion, underTypeQuestion, automata if needed,regex, a response, type of response, the response of the user
     pkg.Question =  function (wording,typeQuestion,underTypeQuestion,automaton,regex,grammar,response,typeResponse,userResponse) {

        this.underTypeQuestion = underTypeQuestion;

        //The wording of the question (create automatically or we can specify it)
        this.wording =( wording==='' ? this.createWording(this.underTypeQuestion) : wording );

        if (typeQuestion!="MCQ" && typeQuestion!="RE" && typeQuestion!="Automaton" && typeQuestion!='')
            console.log("Error: creation of question impossible. typeQuestion: "+typeQuestion +" is not valid");
        else
            this.typeQuestion = typeQuestion; //The type of the question (MCQ,Automaton,RE (Regular expression))

        this.automaton=[0,0,0,0];
        var i =0;
        if (automaton) {
            for (var auto of automaton) {
                this.automaton[i]=auto;
                i++;
            }
        }

        if ((response==='' || response===undefined) && (automaton!== undefined && automaton!=='') )
            this.correctionQuestion();
        else
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
        //Create the wording corresponding to the type of question
        createWording: function (type) {
            switch (type)
            {
                case "complement":
                    return "Create the complementary automaton of the following automaton ";
                    break;
                case "complete":
                    return "Create the complete automaton of the following automaton ";
                    break;
                case "product":
                    return "Do the product of the following automata ";
                    break;
                case "minimize":
                    return "Minimize the following automaton ";
                    break;
                case "equivalenceStates":
                    return "Write the equivalent states of the following automaton ";
                    break;
                case "equivalencyAutomata":
                    return "Are the following automatons equivalent? ";
                    break;
                case "automaton2Table":
                    return "Fill the table corresponding to the automaton ";
                    break;
                case "table2Automaton":
                    return "Create the automaton corresponding to the following automaton ";
                    break;
                case "accessible":
                    return "Write the accessible states of the following automaton ";
                    break;
                case "coaccessible":
                    return "Write the co-accessible states of the following automaton ";
                    break;
                case "word":
                    return "Write a word recognized by the following automaton ";
                    break;
                case "determinize":
                    return "Create the determinized automaton of the following automaton ";
                    break;
                case "determinize_minimize":
                    return "Create the determinized and minimize automaton of the following automaton ";
                    break;
                case "eliminate":
                    return "Eleminate the ε-transitions of the following automaton ";
                    break;
                case "determinize_eliminate":
                    return "Eleminate the ε-transitions and determinize the following automaton ";
                    break;
                case "automaton2RE":
                    return "Write the regular expression corresponding to the following automaton ";
                    break;
                case "RE2automaton":
                    return "Give the automaton corresponding to the following RE ";
                    break;
                case "grammar2Automaton":
                    return "Give the automaton corresponding to the following right linear grammar ";
                    break;
                case "automaton2Grammar":
                    return "Give the linear grammar corresponding to the following automaton ";
                    break;
                case "leftGrammar2RightGrammar":
                    return "Give the right linear grammar corresponding to the following left linear grammar ";
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
            if (this.typeResponse!=='' && !this.typeResponse=== undefined)
                return this.typeResponse;
            switch (this.underTypeQuestion)
            {
                case "complement": case "complete":case "product": case"minimize": case"table2Automaton": case "determinize": case "determinize_minimize":
                case "eliminate": case "determinize_eliminate": case "RE2automaton": case "grammar2Automaton":
                    return "automaton";
                    break;
                case "equivalenceStates" : case "accessible" : case "coaccessible" : case "word" :
                    return "input";
                    break;
                case "automaton2Grammar": case "leftGrammar2RightGrammar":
                    return "grammar"; //It's also an input
                case "automaton2RE":
                    return "re";
                    break;
                case "equivalencyAutomata" :
                    return "checkbox";
                    break;
                case "automaton2Table":
                    return "table";
                    break;
            }
        },

        //Create the response with the algorithm and put it in the .response
         correctionQuestion :  function () {
            var response= null;
            switch (this.underTypeQuestion) {
                case "complement":
                    response = complement(this.automaton[0],this.automaton[0].getAlphabet());
                    break;
                case "complete":
                    response = complete(this.automaton[0],this.automaton[0].getAlphabet());
                    break;
                case "minimize":
                    response = minimize(this.automaton[0],this.automaton[0].getAlphabet());
                    break;
                case "product":
                    response = product(this.automaton[0],this.automaton[1],false);
                    break;
                case "equivalenceStates":
                    response = notDistinguableStates(this.automaton[0]);
                    break;
                case "equivalencyAutomata":
                    response = automataAreEquivalent(this.automaton[0],this.automaton[1]);
                    break;
                case "automaton2Table":
                    response = automaton2HTMLTable(this.automaton[0]);
                    break;
                case "table2Automaton":
                    response = this.automaton[0];
                    break;
                case "coaccessible":
                    response = coaccessibleStates(this.automaton[0]);
                    break;
                case "accessible":
                    response = accessibleStates(this.automaton[0]);
                    break;
                case "word":
                    response = giveLittlerWord(this.automaton[0]);
                    break;
                case "determinize":
                    response = determinize(this.automaton[0]);
                    break;
                case "determinize_minimize":
                    response = determinize(this.automaton[0],1);
                    break;
                case "eliminate":
                    response = epsElim(this.automaton[0]);
                    break;
                case "determinize_eliminate":
                    response = determinize(epsElim(this.automaton[0]));
                    break;
                case "automaton2RE":
                    response = automatonToRegex(this.automaton[0]);
                    break;
                case "RE2automaton":
                    response = regexToAutomaton(this.regex)
                    break;
                case "grammar2Automaton":
                    response = linearGrammar2Automaton(this.grammar);
                    break;
                case "automaton2Grammar":
                    response = automaton2RightLinearGrammar(this.automaton[0]).toString(); //Return the string of the grammar
                    break;
                case "leftGrammar2RightGrammar":
                    response = leftLinear2RightLinearGrammar(this.grammar,0).toString();
                    break;
                }
                this.response=response;
        },

        //return true if the response is correct or false otherwise
        isCorrect: function () {
            response = this.response;

            //If thue user needs to draw an automaton and didn't do it
            if(this.typeResponse==="automaton" && (this.userResponse===undefined || this.userResponse===null)) {
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
                case "automaton2Grammar":
                    return automataAreEquivalent(this.automaton[0],linearGrammar2Automaton(this.userResponse));
                    break;
                case "leftGrammar2RightGrammar": //Compare the 2 automata generated by the grammars, and look if the given grammar is right linear
                    return automataAreEquivalent( linearGrammar2Automaton(this.grammar),linearGrammar2Automaton(this.userResponse)) && isLeftLinear(this.userResponse)===false;
                    break;
                }
        },
        //Settings for creation of automaton
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
                    if (j==0 & this.needAutomatonQuestion() )
                        this.createAutomaton(0) ;
                    else if (j==1 && this.need2AutomataQuestion() )
                         this.createAutomaton(1) ;

                }else if (rand==0 || (automata[j]!==null && automata[j]!==undefined)) {
                this.automaton[j] = automata[j];
                }
                j++;
            }
            console.log(this.automaton[0]);
        },

        //Initialize the regex needed for the question by generating it or use the given RE
        initializeRegex: function (re) {
            if (re!==undefined && re!==null) {
                this.regex = re;
            }
            else if (this.underTypeQuestion=="RE2automaton") {
                //this.createAutomaton(0);
                this.regex = automatonToRegex(this.automaton[0]);
            }
        },

        //Initialize the grammar needed for the question by generating it or use the given grammar
        initializeGrammar: function (grammar) {
            if (grammar!==undefined && grammar!==null ) {
                this.grammar = grammar;
            }
            else if (this.underTypeQuestion=="grammar2Automaton") { //Need to have an automaton and convert it to a grammar
                this.createAutomaton(0) ;
                this.grammar = automaton2RightLinearGrammar(this.automaton[0]);
            }
            else if (this.underTypeQuestion=="leftGrammar2RightGrammar") { //Need to have an automaton to convert to a right linear grammar then converts it to a left linear grammar
                this.createAutomaton(0) ;
                this.grammar = rightLinear2LeftLinearGrammar(automaton2RightLinearGrammar(this.automaton[0]));
            }
        },



        //Create randomly an automaton
        createAutomaton: function (numAuto) {
            var A = new Automaton();
/*
            var t= function (content) {
                    console.log("fin charger");
                    var text=content;
                    console.log(text);

                    var div  = document.createElement("div");
                    var designer = new AudeDesigner(div, true);
                    document.querySelectorAll('body')[0].appendChild(div);
                    div.display = "none";
                    designer.setAutomatonCode(text);
                    A = designer.getAutomaton(0);
                    document.querySelectorAll('body')[0].removeChild(div);
                    console.log(A);
            };
            getFile("tt.txt",t);
*/
            A = createAutomatonCoaccessible(this.nbrState[numAuto],this.alphabet[numAuto],this.nbrFinalStates[numAuto],this.mode[numAuto],this.nbTransitions[numAuto]);
            if (typeof A === 'string' || A instanceof String) { //If there is a problem return a string
                alert(A);
            }
            if (numAuto>1 ||numAuto<0 )
                throw("Erreur createAutomaton");
            this.automaton[numAuto]=A
        },



        /*
        Method to modify the property
        */

        addAutomaton : function (Automaton,numAuto) {
            if (numAuto===undefined)
                this.automaton[0] = Automaton;
            else
                this.automaton[numAuto] = Automaton;
        },

        addGrammar: function (grammar) {
            this.grammar = grammar;
        },

        addRE: function (re) {
            this.regex = re;
        },


        /*
        Returns the question in a string json, or saves it if a name is given
        */
        save : function (nameFile) {
            if (nameFile===null  || nameFile===undefined) {
                return JSON.stringify(this);
            }
            var jsonQuestion = JSON.stringify(this);
            var blob     = new Blob([jsonQuestion], {type: "application/json"});
            var fileName = nameFile+".json";
            saveAs(blob, fileName);
        },

        //Load the string json given or load the file given
        load : function (code) {
            this= JSON.parse(code);
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
    var questionSelected = null; ////Question selected by the user

    var createTable = null;
    var automaton2HTMLTable = null;

    //For the generation of automaton
    var grammarLoaded = null;
    var RELoaded = null;
    var automataLoaded = [null,null]; //If the users loads an automaton
    var randomly = [1,1,0,0]; //If 0 doesn't generate randomly an automaton, if 1 generates randomly
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

        //Before using the class question you need to us loadPrograms which loads the audescript program
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
                ["button#generate-automaton-specification-questionList",_("Settings automaton generation")],
                ["div#questionList-container-button-navigation",[
                ["button#close-questionList", {"#": "close"}, _("Close the question list")]]],
                ["div#questionList-container", [ //Contains the chapter, and question
                    ["div#questionList-selection-chapter", [ //To select the chapter
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "1"}, _("Chapter 1: Deterministic finite state machines")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "2"}, _("Chapter 2: Non-deterministic finite state machines")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "3"}, _("Chapter 3: Non-deterministic finite state machines with ε-transitions")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "4"}, _("Chapter 4: Regular expressions and Kleene theorem")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "5"}, _("Chapter 5: Grammars and regular grammars")],
                        ["button",{"class":"questionList-selection-chapter-cell-button","value": "6"}, _("Chapter 6: Non-regular langages and iterative lemme")],
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


    //Display the settings
    var settingsWin = null;
    var nameSelectedFile = ["none","none","none","none"];
    var modeSelected = null;

    function settingsAutomaton () {
        var automataL = automataLoaded.slice(); //Local variable for the automataLoaded
        var localNameSelectedFile = nameSelectedFile.slice(); //Local variable for the nameSelectedAutomaton, when the user saved ,put them in the global variable

        var localAutomataLoaded = automataLoaded.slice() ;
        var localRandomly = randomly.slice();
        var localNbrState = nbrState.slice();
        var localAlphabet = alphabet.slice();
        var localNbrFinalStates = nbrFinalStates.slice();
        var localMode = mode.slice();
        var localNbTransitions = nbTransitions.slice();
        var localGrammarLoaded = null;
        var localRELoaded = null;

        if (settingsWin===null || !settingsWin.ws ) {
                settingsWin = libD.newWin({
                minimizable: false,
                title:       _("Setting for the questions"),
                content : libD.jso2dom([
                ["div#div-settings-question",[
                    ["h1",_("Settings")],
                    ["div#questionList-selection-chapter", [ //To select the chapter
                        ["button",{"class":"load-mode","value": "auto1"}, _("Automaton1")],
                        ["button",{"class":"load-mode","value": "auto2"}, _("Automaton2")],
                        ["button",{"class":"load-mode","value": "re"}, _("Regular expression")],
                        ["button",{"class":"load-mode","value": "grammar"}, _("Grammar")],
                    ]],
                    ["div",[
                        ["span",_("Generate randomly ")],
                        ["input#input-automaton-generate",{"type":"checkbox","name":"randomAutomaton"}],
                    ]],
                    ["span#div-settings-question-automaton-random",[ //To enter information to generate randomly an automaton
                        ["h2",_("Automaton generated randomly")],
                        ["div#div-settings-question-container-row", [
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
                    ["span#div-settings-question-grammar-random",{"style":"display:none"},[
                        ["h2",_("Grammar generated randomly")],
                        ["div",_("Create a random automaton by using the pararametes of the automaton 1 and converts it to a RE")],
                        ["div",_("Prefearbly select a grammar from files")],
                    ]],
                    ["span#div-settings-question-grammar-select",{"style":"display:none"},[ //To select a regular expression
                        ["h2",_("Grammar selection")],
                        ["div",_("Select a grammar from the list or from your computer")],
                        ["button#selection-grammar",_("Open grammar")],
                        ["span#",_("Selected grammar: "),[
                            ["span#display-name-file-grammar",_("none")],
                        ]],
                        ["br"],
                    ]],
                    ["button#save-question-settings", _("Save")],
                    ["button#save-exit-question-settings", _("Save and exit")],
                ]],
            ])});
            settingsWin.setAlwaysOnTop(100);
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

            //By default it's the first mode selected
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

            /*Display the selected mode between automaton1 automaton2 et ER */
            function displayModeSelected(numAutomaton) {

                //For menu automaton1 and automaton2
                if(numAutomaton===0 || numAutomaton===1) {
                    //Hide the menu regular expressions
                    document.getElementById("div-settings-question-re-random").style.display="none";
                    document.getElementById("div-settings-question-re-select").style.display="none";
                    document.getElementById("div-settings-question-grammar-random").style.display="none";
                    document.getElementById("div-settings-question-grammar-select").style.display="none";

                    //Display the name of the current automaton loaded
                    document.getElementById("display-name-file").innerHTML = localNameSelectedFile[numAutomaton];

                    //Button to open a window for the selection on an automaton
                    document.getElementById('selection-automaton').onclick = chooseFile.bind(null,"automaton");

                    //checkbox to choose if the automaton are chosen or generate randomly
                    var chec = document.getElementById("input-automaton-generate");

                    //For the check input
                    if (localRandomly[numAutomaton]==1) {
                        chec.checked = true;
                        document.getElementById('div-settings-question-automaton-random').style.display = "inherit";
                        document.getElementById('div-settings-question-automaton-select').style.display = "none";
                    } else {
                        document.getElementById('div-settings-question-automaton-random').style.display = "none";
                        document.getElementById('div-settings-question-automaton-select').style.display = "inherit";
                        chec.checked = false;
                    }

                    chec.onclick= checkRemove.bind(null,'div-settings-question-automaton-random','div-settings-question-automaton-select');

                    var inputs = document.getElementsByClassName('input-settings-question');

                    //Local save to not lose modification when changing mode (automaton1 to automaton2 and vice-versa)
                    chec.onchange = function () { chec.checked ? localRandomly[numAutomaton]=1 : localRandomly[numAutomaton]=0; console.log(localRandomly + " "+ numAutomaton )};

                    inputs[0].onchange = function () {localNbrState[numAutomaton]=inputs[0].value};
                    inputs[1].onchange = function () {localAlphabet[numAutomaton]=inputs[1].value};
                    inputs[2].onchange = function () {localNbrFinalStates[numAutomaton]=inputs[2].value};
                    inputs[3].onchange = function () {localMode[numAutomaton]=inputs[3].value};
                    inputs[4].onchange = function () {localNbTransitions[numAutomaton]=inputs[4].value};

                    //Put the local variable in the inputs
                    inputs[0].value=localNbrState[numAutomaton];
                    inputs[1].value=localAlphabet[numAutomaton];
                    inputs[2].value=localNbrFinalStates[numAutomaton];
                    inputs[3].value=localMode[numAutomaton];
                    inputs[4].value=localNbTransitions[numAutomaton];

                }

                //To select regex
                else if (numAutomaton===2) {
                    //Hide the menu automaton
                    document.getElementById("div-settings-question-automaton-random").style.display="none";
                    document.getElementById("div-settings-question-automaton-select").style.display="none";
                    document.getElementById("div-settings-question-grammar-random").style.display="none";
                    document.getElementById("div-settings-question-grammar-select").style.display="none";
                    //Display the name of the current file loaded
                    document.getElementById("display-name-file-re").innerHTML = localNameSelectedFile[numAutomaton];
                    //Button to open a window for the selection on an automaton
                    document.getElementById('selection-re').onclick = chooseFile.bind(null,"re");
                    //checkbox to choose if the automaton are chosen or generate randomly
                    var chec = document.getElementById("input-automaton-generate");
                    chec.onchange = function () { chec.checked ? localRandomly[numAutomaton]=1 : localRandomly[numAutomaton]=0; console.log(localRandomly + " "+ numAutomaton )};
                    //For the check input
                    if (localRandomly[numAutomaton]==1) {
                        chec.checked = true;
                        document.getElementById('div-settings-question-re-random').style.display = "inherit";
                        document.getElementById('div-settings-question-re-select').style.display = "none";
                    } else {
                        document.getElementById('div-settings-question-re-random').style.display = "none";
                        document.getElementById('div-settings-question-re-select').style.display = "inherit";
                        chec.checked = false;
                    }
                    chec.onclick= checkRemove.bind(null,'div-settings-question-re-random','div-settings-question-re-select');
                }

                //To select grammar
                else if (numAutomaton===3) {
                    //Hide the menu automaton
                    document.getElementById("div-settings-question-automaton-random").style.display="none";
                    document.getElementById("div-settings-question-automaton-select").style.display="none";
                    document.getElementById("div-settings-question-re-random").style.display="none";
                    document.getElementById("div-settings-question-re-select").style.display="none";
                    //Display the name of the current file loaded
                    document.getElementById("display-name-file-grammar").innerHTML = localNameSelectedFile[numAutomaton];
                    //Button to open a window for the selection on an automaton
                    document.getElementById('selection-grammar').onclick = chooseFile.bind(null,"grammar");
                    //checkbox to choose if the automaton are chosen or generate randomly
                    var chec = document.getElementById("input-automaton-generate");
                    //For the check input
                    if (localRandomly[numAutomaton]==1) {
                        chec.checked = true;
                        document.getElementById('div-settings-question-grammar-random').style.display = "inherit";
                        document.getElementById('div-settings-question-grammar-select').style.display = "none";
                    } else {
                        document.getElementById('div-settings-question-grammar-random').style.display = "none";
                        document.getElementById('div-settings-question-grammar-select').style.display = "inherit";
                        chec.checked = false;
                    }
                    chec.onclick= checkRemove.bind(null,'div-settings-question-grammar-random','div-settings-question-grammar-select');
                }

                //To hide and show the 2 names of divs given
                function checkRemove (name1,name2) {
                    console.log(numAutomaton);
                    if (chec.checked !== true) {
                        document.getElementById(name1).style.display = "none";
                        document.getElementById(name2).style.display = "inherit";

                        localRandomly[numAutomaton] = 0;
                    } else {
                        document.getElementById(name1).style.display = "inherit";
                        document.getElementById(name2).style.display = "none";
                        localRandomly[numAutomaton] = 1;
                    }
                }


                //Display a window which lets the user selects a file, type=automaton, er, grammar
                function chooseFile (type) {

                    var listFiles = null; //List of all the automata for each exercice
                    var selectedQuestion = null;

                    getFile(
                        "automata_question/listAutomata.json",
                        function(automata_question) {displayWin(automata_question)},
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

                    function displayWin (automata_question) {
                        listFiles= JSON.parse(automata_question); //Transform the JSON file (where there are the folders and names of automata) in object
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
                                        document.getElementById("display-name-file").innerHTML=inputFile.value; //To display the name on the settings window
                                        divAutomaton.innerHTML="";
                                        var designer = new AudeDesigner(divAutomaton, true); //Create a designer to put the automaton in

                                        freader.onload = function () { //load the file
                                            designer.setAutomatonCode(freader.result);    //Display the automaton
                                            automataL[numAutomaton]= designer.getAutomaton(0);
                                            designer.autoCenterZoom();
                                        };
                                    }
                                    else if(type==="re") {
                                        document.getElementById("display-name-file-re").innerHTML=inputFile.value; //To display the name on the settings window
                                        freader.onload = function () { //load the file
                                                divAutomaton.innerHTML=freader.result;
                                                localRELoaded = freader.result;
                                        };
                                    }
                                    else if(type==="grammar") {
                                        document.getElementById("display-name-file-grammar").innerHTML=inputFile.value; //To display the name on the settings window
                                        freader.onload = function () { //load the file
                                                divAutomaton.innerHTML=freader.result;
                                                localGrammar = freader.result;
                                        };
                                    }
                                    freader.readAsText(inputFile.files[0], "utf-8");
                                 };
                             }


                            var div = document.getElementById('load-automaton-question');
                            var divListFiles = document.getElementById('load-automaton-question-list');
                            var divAutomaton = document.getElementById('display-loaded-automaton');
                            var namesQuestion = Object.keys(listFiles); //The list of name exercice


                            //Display the list of question
                            for (var i = 0, l=namesQuestion.length; i < l; i++) {
                                if (listFiles[namesQuestion[i]].type===type) {
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
                                for (var j = 0, len=listFiles[question.value].tab.length; j < len; j++) {
                                    if (listFiles[question.value].type===type) {
                                        var auto = document.createElement("div");
                                        auto.className = "load-button";
                                        auto.innerHTML = listFiles[question.value].tab[j].replace(/.txt$/,'');
                                        divListFiles.appendChild(auto);

                                        //Display the file when you click on the name
                                        auto.addEventListener('click',butDispFile.bind(null,question.value,listFiles[question.value].tab[j]) );
                                    }
                                }
                            }

                            //Display the selected file
                            function butDispFile (nameQuestion,nameFile) {

                                localNameSelectedFile[numAutomaton] = nameFile;

                                if (type==="automaton") {
                                    document.getElementById("display-name-file").innerHTML=nameFile; //To display the name on the settings window
                                    divAutomaton.innerHTML="";
                                    var designer = new AudeDesigner(divAutomaton, true); //Create a designer to put the automaton in

                                    getFile("automata_question/"+nameQuestion+"/"+nameFile,function(text) { //load the file
                                        designer.setAutomatonCode(text);    //Display the automaton
                                        automataL[numAutomaton]= designer.getAutomaton(0);
                                        designer.autoCenterZoom();
                                    });
                                }
                                else if(type==="re") {
                                    document.getElementById("display-name-file-re").innerHTML=nameFile; //To display the name on the settings window
                                    getFile("automata_question/"+nameQuestion+"/"+nameFile,function(text) { //load the file
                                            divAutomaton.innerHTML=text;
                                            localRELoaded = text;
                                    });
                                }
                                else if(type==="grammar") {
                                    document.getElementById("display-name-file-grammar").innerHTML=nameFile; //To display the name on the settings window
                                    getFile("automata_question/"+nameQuestion+"/"+nameFile,function(text) { //load the file
                                            divAutomaton.innerHTML=text;
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

        var buttonQuestion = document.getElementsByClassName('questionList-question-select') //To display the question
        for (var i=0,l=buttonQuestion.length;i<l;i++) {
            buttonQuestion[i].addEventListener('click', function(e) {

                //We create the question
                var q = new Question ('','',e.target.value);
                q.settingsCreateAutomaton(randomly,nbrState,alphabet,nbrFinalStates,mode,nbTransitions);
                q.initializeAutomata(automataLoaded);
                q.initializeRegex(RELoaded);
                q.initializeGrammar(grammarLoaded);
                q.correctionQuestion();

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
                butRestart.onclick = function () { //Recreate the page with a new automaton
                    q.settingsCreateAutomaton(randomly,nbrState,alphabet,nbrFinalStates,mode,nbTransitions);
                    q.initializeAutomata(automataLoaded); // Create a new automaton
                    q.initializeRegex(RELoaded); //Create a new regex if needed
                    q.initializeGrammar(grammarLoaded);
                    q.correctionQuestion(); //Correct the question
                    div.innerHTML='';
                    drawQuestion(q,div);
                };
                drawQuestion(q,div);
            });
        }
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
                ["button#question-dispay-response",_("Display response")]
            ]],
            ["div#question-answers"], //Answer of the user
            ]
        ));
        //Validate the response
        var butValidate = document.getElementById("question-validate");
        butValidate.addEventListener("click",function(e){
            switch (question.answerMode()) {
                case "automaton":
                    question.userResponse = designerAnswer.getAutomaton(0); //Give the automaton
                    break;
                case "input": case "re": case "grammar":
                    question.userResponse = document.getElementById("question-answers-input").value; //Give the value of the input
                    break;
                case "checkbox":
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
            }
            correctionQuestion(question);
        });

        //To display the response
        var butDispResp = document.getElementById("question-dispay-response");
        butDispResp.onclick = displayResponse.bind(null,question,"")

        //Display the wording
        var divWording = document.getElementById("question-wording");
        divWording.innerHTML += question.wording;
        var divAutomatonQuestion = document.getElementById("question-automata-designer");


        //Display other informations (automaton,table,grammar...)
        //If there are 2 automata needed
        if (question.need2AutomataQuestion()) {
            divAutomatonQuestion.appendChild(libD.jso2dom([
                ["div#question-automata-designer-right"]]));
            divAutomatonQuestion.appendChild(libD.jso2dom([
                ["div#question-automata-designer-left"]]));
            var designerRight = new AudeDesigner(document.getElementById("question-automata-designer-right"), true);
            designerRight.setAutomatonCode(automaton_code(question.automaton[0]));
            designerRight.autoCenterZoom();
            var designerLeft = new AudeDesigner(document.getElementById("question-automata-designer-left"), true);
            designerLeft.setAutomatonCode(automaton_code(question.automaton[1]));
            designerLeft.autoCenterZoom();
        }
        //If there is 1 automaton needed
        else if (question.needAutomatonQuestion() && question.underTypeQuestion !== "table2Automaton" ) {
            var designer = new AudeDesigner(divAutomatonQuestion, true);
            designer.setAutomatonCode(automaton_code(question.automaton[0]));
            designer.autoCenterZoom();

        //Draw a table
        } else if (question.underTypeQuestion === "table2Automaton") {
            divAutomatonQuestion.appendChild(automaton2HTMLTable(question.automaton[0]));

        //Draw the RE
        } else if (question.underTypeQuestion === "RE2automaton") {
            divAutomatonQuestion.appendChild(document.createTextNode(question.regex));
        }

        //Draw the the grammar
        else if (question.underTypeQuestion === "grammar2Automaton" || question.underTypeQuestion === "leftGrammar2RightGrammar") {
            divAutomatonQuestion.appendChild(document.createTextNode(question.grammar.toString()));
        }

        else {
            divAutomatonQuestion.style.display = "none";
        }

        //Area to allow the user to write the answer
        var divAnswersUser = document.getElementById("question-answers");
        switch (question.answerMode()) {
            case "automaton":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["div#question-answers-automaton",_("You can draw the automaton bellow.")]]));
                var designerAnswer = new AudeDesigner(document.getElementById("question-answers-automaton"), false); //Contains the automata
                break;
            case "input": case "re": case "grammar":
                divAnswersUser.appendChild(libD.jso2dom([
                    ["input#question-answers-input",{"type":"text"}]]));
                if(question.underTypeQuestion==="equivalenceStates")
                    document.getElementById("question-answers-input").placeholder="Write couples of states";
                else
                    document.getElementById("question-answers-input").placeholder="Write the answer here";
                break;
            case "checkbox":
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
                createTable(document.getElementById("question-answers-table"));
                var divT = document.getElementById('div-container-table');
                divT.childNodes[4].style.display = "none"; //Remove buttons "create automaton","X"
                divT.childNodes[5].style.display = "none";
            break;
        }
    }


    function correctionQuestion(question) {
        var dispResp;
        var div = document.createElement("div");
        if (question.isCorrect()===false) {
            dispResp="Wrong answer";
            div.style.color="red";
        }
        else {
            dispResp="True answer";
            div.style.color="green";
        }

        div.innerHTML = dispResp;

        AudeGUI.notify(_("Correction"), div , "normal",4000);
    }

    //display the solution in the div
    function displayResponse(question,div) {
        var response = question.response;
        question.save("yolo");
        switch (question.answerMode()) {
            case "automaton":

                if (div==='' || div==undefined  ) { //Create an area to display the automaton response
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
                if (div==='' || div==undefined  ) { //Create an area to display the input response
                    var div=document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-input")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-input"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["span#question-solution-input"]]));
                document.getElementById("question-solution-input").innerHTML = response;

                break;

            case "checkbox":
                if (div==='' || div==undefined  ) { //Create an area to display the input response
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
                if (div==='' || div==undefined  ) { //Create an area to display the input response
                    var div=document.getElementById("question-wording").parentNode;
                    if (document.getElementById("question-solution-table")!==null) { //If we already created it we destroy the div
                        div.removeChild(document.getElementById("question-solution-table"));
                    }
                }
                div.appendChild(libD.jso2dom([
                ["span#question-solution-table"]]));
                document.getElementById("question-solution-table").appendChild(response);

                break;
        }
    }
}(window));
