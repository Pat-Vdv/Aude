/*
    Copyright (c) Raphaël Jakse (Université Grenoble-Alpes), 2013-2016

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

    "use strict";
    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var win = null; //Creation of a new window
    var help = null;
    var helpContent = null;

    var helpChapter = null;

    AudeGUI.Help = {
        load: function () {
            //Rien
        },

        run: openHelp,

    };

    function openHelp () {
        console.log(AudeGUI.getCurrentMode());
        if (win && win.ws) {
            win.close();
        }
        else if (AudeGUI.getCurrentMode()==="program" )
            drawHelpAlgo();
    }

    /*
    * Create the page that shows the help for algorithm
    */
    function  drawHelpAlgo () {

        console.log("Creation help");



        let helpWindowContent = ["div#help-main", [
            ["div#questionList-selection-chapter", [ //To select the chapter
                ["button",{"class":"help-selection-chapter","value": "audescript"}, _("Audescipt")],
                ["button",{"class":"help-selection-chapter","value": "automaton"}, _("Automaton")],
                ["button",{"class":"help-selection-chapter","value": "other"}, _("Other")],
            ]],
            ["div#help-content",_("Select a chapter") ],

            ]];

        win = libD.newWin({ //Create a new window
            title:      _("Help algo"),
            show:       true,
            fullscreen: false,
            top: "5%",
            right: "1%",
            content: libD.jso2dom(helpWindowContent) //Send the html
        });

        var buttons = document.getElementsByClassName('help-selection-chapter');
        for (var i=0,l=buttons.length;i<l;i++) { // Add event on the buttons
            buttons[i].addEventListener('click',function(e) {
                if (helpChapter)
                    helpChapter.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ; //Change the color of the previous selected chapter
                e.target.style.backgroundColor = 'rgba(239, 100, 100)'; //Change to red when we click
                helpChapter = e.target;
                drawHelpIndex(e.target.value);
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

    }


    // Draw the index composed by the buttons
    function drawHelpIndex (chapter) {
        var div = document.getElementById('help-content'); //Area to display the list
        div.innerHTML = "";
        switch (chapter) {
            case "audescript":
                div.appendChild(libD.jso2dom([
                    ["div#help-index",[
                        ["button",{"class":"help-index-button","value": "comment"},_("Comment")],["br"],
                        ["button",{"class":"help-index-button","value": "variable"},_("Variable and Constant Declaration")],["br"],
                        ["button",{"class":"help-index-button","value": "function"},_("Functions and Procedures")],["br"],
                        ["button",{"class":"help-index-button","value": "if"},_("If")],["br"],
                        ["button",{"class":"help-index-button","value": "unless"},_("Unless")],["br"],
                        ["button",{"class":"help-index-button","value": "for"},_("For")],["br"],
                        ["button",{"class":"help-index-button","value": "doWhile"},_("Do while")],["br"],
                        ["button",{"class":"help-index-button","value": "foreach"},_("Foreach")],["br"],
                        ["button",{"class":"help-index-button","value": "while"},_("While")],["br"],
                        ["button",{"class":"help-index-button","value": "boolean"},_("Boolean")],["br"],
                        ["button",{"class":"help-index-button","value": "operators"},_("Operators")],["br"],
                        ["button",{"class":"help-index-button","value": "set"},_("Set operations")],["br"],
                    ]]
                ]));
                break;

            case "automaton":
                div.appendChild(libD.jso2dom([
                    ["div#help-index",[
                        ["button",{"class":"help-index-button","value": "initial"},_("Initial state")],["br"],
                        ["button",{"class":"help-index-button","value": "state"},_("State")],["br"],
                        ["button",{"class":"help-index-button","value": "final"},_("Final state")],["br"],
                        ["button",{"class":"help-index-button","value": "transition"},_("Transition")],["br"],
                        ["button",{"class":"help-index-button","value": "alphabet"},_("Alphabet")],["br"],
                        ["button",{"class":"help-index-button","value": "example"},_("Example")],["br"],
                        ["button",{"class":"help-index-button","value": "other"},_("Other")],["br"],
                    ]]
                ]));
            break;

        }
        var buttons = document.getElementsByClassName('help-index-button');

        for (var i=0,l=buttons.length;i<l;i++) { // Add event on the buttons
            buttons[i].addEventListener('click',function(e) {
                drawHelpCommand(e.target.value);
            });
        }
    }


    function drawHelpCommand (command) {
        console.log (command);
        var content = null;
        var ifInstr = ["div",[
            ["span",{"class":"help-instruction"},("if ")],
            ["span",("condition ")],
            ["span",{"class":"help-instruction"},("then ")]
        ]];
        switch (command) {
            case "comment":
                content = ["div#help-command",[
                    ["div",_("# This is a comment")],
                    ["div",_("// This is another comment")],
                    ["div",_("/* This is a multiline")],
                    ["div",("comment */")],
                ]];
                break;
            case "variable":
                content = ["div#help-command",[
                    ["div",("The assignation in audescript uses "),["b",(":=")]],
                    ["div",_("let variable := 0")],
                    ["div",_("const variable := 42")],
                ]];
                break;

            case "function":
                content = ["div#help-command",[
                    ["div",[
                        ["span",{"class":"help-instruction"},("function ")],
                        ["span",("f(arg1, arg2...)")],
                    ]],
                    ["div",{"class":"help-indent"},("code")],
                    ["div",{"class":"help-indent"},[
                        ["span",{"class":"help-instruction"},("return ")],
                        ["span",("something")],
                    ]],
                    ["div",{"class":"help-instruction"},("end function")],["br"],
                    ["div",[
                        ["span",{"class":"help-instruction"},("procedure ")],
                        ["span",("p(arg1, arg2...)")],
                    ]],
                    ["div",{"class":"help-indent"},("code")],
                    ["div",{"class":"help-instruction"},("end procedure")],
                ]];
                break;

            case "if":
                content = ["div#help-command",[
                    ifInstr,
                    ["div",{"class":"help-indent"},_("code")],
                    ["div",{"class":"help-instruction"},_("end if")],["br"],
                    ["div",_("You can also use fi instead of end if")],["br"],["br"],
                    ifInstr,
                    ["div",{"class":"help-indent"},_("code")],
                    ["div",[
                        ["span",{"class":"help-instruction"},("else if ")] ,
                        ["span",("condition ")] ,
                        ["span",{"class":"help-instruction"},("then")] ,
                    ]],
                    ["div",{"class":"help-indent"},_("code")],
                    ["div",{"class":"help-instruction"},("else")],
                    ["div",{"class":"help-indent"},_("code")],
                    ["div",{"class":"help-instruction"},("end if")],["br"],
                ]];
                break;

            case "unless":
                content = ["div#help-command",[
                    ["div",[
                        ["span",{"class":"help-instruction"},("unless ")],
                        ["span",("condition ")],
                        ["span",{"class":"help-instruction"},("then")],
                    ]],
                    ["div",{"class":"help-indent"},("code")],
                    ["div",{"class":"help-instruction"},("end unless")],
                ]];
                break;

            case "for":
                content = ["div#help-command",[
                    ["div",[
                        ["span",{"class":"help-instruction"},("for ")],
                        ["span",("i ")],
                        ["span",{"class":"help-instruction"},("from ")],
                        ["span",("1 ")],
                        ["span",{"class":"help-instruction"},("to ")],
                        ["span",("10 ")],
                        ["span",{"class":"help-instruction"},("do")],
                    ]],
                    ["div",{"class":"help-indent"},("code")],
                    ["div",{"class":"help-instruction"},("end for")],["br"],
                    ["div",_("You can use end do or done instead of end for")],
                ]];
                break;

            case "doWhile":
                content = ["div#help-command",[
                    ["div",{"class":"help-instruction"},("do")],
                    ["div",{"class":"help-indent"},("i++")],
                    ["div",[
                        ["span",{"class":"help-instruction"},("while ")],
                        ["span",("i < 10")],
                    ]],
                ]];
                break;

            case "foreach":
                content = ["div#help-command",[
                    ["div",[
                        ["span",{"class":"help-instruction"},("foreach ")],
                        ["span",("v ")],
                        ["span",{"class":"help-instruction"},("in ")],
                        ["span",("{1,2,3} ")],
                        ["span",{"class":"help-instruction"},("do ")],
                    ]],
                    ["div",{"class":"help-indent"},("code")],
                    ["div",{"class":"help-instruction"},("end while")],["br"],
                    ["div",_("end do and done can be used instead of end while")],
                ]];
                break;

            case "while":
                content = ["div#help-command",[
                    ["div",[
                        ["span",{"class":"help-instruction"},("while ")],
                        ["span",("condition ")],
                        ["span",{"class":"help-instruction"},("do")],
                    ]],
                    ["div",{"class":"help-indent"},("code")],
                    ["div",{"class":"help-instruction"},("end while")],["br"],
                    ["div",_("end do and done can be used instead of end while")],
                ]];
                break;

            case "boolean":
                content = ["div#help-command",[
                    ["div", _("Booleans in audescript work like in python")],
                    ["span", _("You can use ")],
                    ["span",{"class":"help-instruction"}, ("true ")],
                    ["span", ("or 1 ")],["br"],
                    ["span", _("You can use ")],
                    ["span",{"class":"help-instruction"}, ("false ")],
                    ["span", _("or 0 ")],["br"],
                    ["span", ("You can use ")],
                    ["span",{"class":"help-instruction"}, ("and ")],
                    ["span", ("or ")],
                    ["span",{"class":"help-instruction"}, ("& ")],
                    ["br"],
                    ["span", _("You can use ")],
                    ["span",{"class":"help-instruction"}, ("or ")],
                    ["span", _("or ")],
                    ["span",{"class":"help-instruction"}, ("| ")],
                    ["br"],
                    ["span", _("For the negation you can only use ")],
                    ["span",{"class":"help-instruction"}, ("not")],
                ]];
                break;

            case "operators":
                content = ["div#help-command",[
                    ["div", _("This works like in Javascript")],
                    ["div", _("You can use +,-,*,/,mod for arithmetic")],
                    ["div", _("You can concatenate 2 strings with +")],
                ]];
                break;

            case "set":
                content = ["div#help-command",[
                    ["div", [
                        ["b", _("To create an empty set: ")],
                        ["div", _("let s := {}")],
                        ["div", _("let s := empty set")],
                        ["b", _("To create a set with elements: ")],
                        ["div", _("let s := {1,2,3}")],
                        ["b", _("To add element: ")],
                        ["div", _("s.add(element)")],
                        ["b", _("To remove element: ")],
                        ["div", _("s.remove(element)")],["br"],
                    ]],
                    ["div", [
                        ["b", _("The union: ")],
                        ["span", _("set1 ")],
                        ["span",{"class":"help-instruction"}, ("union ")],
                        ["span", ("set2")],["br"],
                        ["span", _("Or set1 ")],
                        ["span",{"class":"help-instruction"}, ("U ")],
                        ["span", ("set2")],["br"],
                        ["b", _("The Cartesian product: ")],
                        ["span", ("set1 ")],
                        ["span",{"class":"help-instruction"}, ("cross ")],
                        ["span", ("set2")],["br"],
                        ["span", _("Or set1 ")],
                        ["span",{"class":"help-instruction"}, _("X ")],
                        ["span", ("set2")],["br"],
                        ["b", _("The intersection: ")],
                        ["span", ("set1 ")],
                        ["span",{"class":"help-instruction"}, ("inter ")],
                        ["span", ("set2")],["br"],
                        ["b", _("The difference: ")],
                        ["span", ("set1 ")],
                        ["span",{"class":"help-instruction"}, ("minus ")],
                        ["span", ("set2")],["br"],
                        ["span", _("Or set1 ")],
                        ["span",{"class":"help-instruction"}, _("\\ ")],
                        ["span", ("set2")],["br"],
                        ["span", ("set1 ")],
                        ["span",{"class":"help-instruction"}, ("symdiff ")],
                        ["span", ("set2 The order of set is not important")],["br"],["br"],
                    ]],
                    ["div", [
                        ["b", _("Element belongs to a set: ")],
                        ["span", _("element ")],
                        ["span",{"class":"help-instruction"},("belongs to ")],
                        ["span",("set")],["br"],
                        ["span", _("element ")],
                        ["span",{"class":"help-instruction"},("element of ")],
                        ["span",("set")],["br"],
                        ["span", _("set ")],
                        ["span",{"class":"help-instruction"},("contains ")],
                        ["span",("element")],["br"],
                        ["b", _("Element doesn't belong to a set: ")],
                        ["span", _("element ")],
                        ["span",{"class":"help-instruction"},("does not belong to ")],
                        ["span",("set")],["br"],
                        ["span", _("element ")],
                        ["span",{"class":"help-instruction"},("not element of ")],
                        ["span",("set")],["br"],
                        ["span", _("set ")],
                        ["span",{"class":"help-instruction"},("does not contain ")],
                        ["span",("element")],["br"]

                    ]],
                ]];
                break;
            case "initial":
                content = ["div#help-command",[
                    ["b",_("Add an initial state or if it exists makes it initial:")],
                    ["div", ("setInitialState(state)")],
                    ["b",_("Return the initial state:")],
                    ["div", ("getInitialState(state)")],
                ]];
                break;

            case "state":
                content = ["div#help-command",[
                    ["b",_("Add a new state:")],
                    ["div", ("addState(state) ")],
                    ["b",_("Add a set of states:")],
                    ["div", ("setStates(set) ")],
                    ["b",_("Return the set of states:")],
                    ["div", ("getStates(state)")],
                    ["b",_("Remove the given state:")],
                    ["div", ("removeState(state) ")],
                    ["b",_("Return true if the automaton has the given state:")],
                    ["div", ("hasState(state) ")],
                ]];
                break;

            case "final":
                content = ["div#help-command",[
                    ["b",_("Add a new final state or if it exists makes it accepting:")],
                    ["div", ("addFinalState(state) ")],
                    ["div", ("addAcceptingState(state) ")],
                    ["div", ("setAcceptingState(state) ")],
                    ["div", ("setFinalState(state): ")],["br"],
                    ["b",_("Make a state non final:")],
                    ["div", ("setNonFinalState(state) ")],
                    ["div", ("setNonAcceptingState(state) ")],["br"],
                    ["b",_("Toggles a state in the Set of final states:")],
                    ["div", ("toggleFinalState(state) ")],
                    ["div", ("toggleAcceptingState(state) ")],["br"],
                    ["b",_("Return true if the state given is accepting")],
                    ["div", ("isAcceptingState(state) ")],
                    ["div", ("isFinalState(state) ")],["br"],
                    ["b",_("Return the set of final states:")],
                    ["div", ("getAcceptingStates() ")],
                    ["div", ("getFinalStates() ")],["br"],
                    ["b",_("Return the set of non final states:")],
                    ["div", ("getNonFinalStates() ")],
                    ["div", ("getNonAcceptingStates() ")],

                ]];
                break;
            case "transition":
                content = ["div#help-command",[
                    ["b",_("Add the transition to the automaton")],
                    ["div", ("addTransition(startState,symbol,endState) or addTransition(transition)")],
                    ["b",_("Remove a transition from the automaton:")],
                    ["div", ("removeTransition(startState,symbol,endState) or removeTransition(transition)")],
                    ["b",_("Return true if the automaton contains the transition given:")],
                    ["div", ("hasTransition(startState,symbol,endState)")],
                    ["b",_("Return the set of transitions:")],
                    ["div", ("getTransitions() ")],["br"],
                    ["b",_("Return the transition function:")],
                    ["div", ("getTransitionFunction()")],
                    ["div", ("This function is such that:")],
                    ["div", ("f() return the set of start states")],
                    ["div", ("f(startState) return the set of symbols such that (startState, symbol, endState) transitions exist(s)")],
                    ["div", ("f(startState, symbol) returns the set of states reachable with (startState, symbol)")],
                    ["div", ("f(null, null, true) returns the set of endStates of all transitions")],
                ]];
            break;

            case "alphabet":
                content = ["div#help-command",[
                    ["b",_("Add the set of symbols to the alphabet:")],
                    ["div", ("addAlphabet(set)")],
                    ["b",_("Sets the set of symbols of the automaton:")],
                    ["div", ("setAlphabet(set)")],
                    ["b",_("Return the set of symbols of the automaton:")],
                    ["div", ("getAlphabet() ")],
                    ["b",_("Remove the set of symbols from the automaton:")],
                    ["div", ("removeAlphabet(set) ")],
                    ["b",_("Add a symbol from the alphabet:")],
                    ["div", ("addSymbol(symbol)")],
                    ["b",_("Remove a symbol from the alphabet:")],
                    ["div", ("removeSymbol(symbol) ")],
                    ["b",_("Return true if the symbol belongs to the alphabet:")],
                    ["div", ("hasSymbol(symbol) ")],
                ]];
                break;

            case "example":
                content = ["div#help-command",[
                    ["div",("A := new Automaton ()")],
                    ["div", ("A.setInitialState(1)")],
                    ["div", ("A.setFinalState(3)")],
                    ["div", ("A.setStates({2,4})")],
                    ["div", ("A.setAlphabet({'a','b'})")],
                    ["div", ("A.addTransition(1,'a',2)")],
                    ["div", ("A.addTransition(2,'a',4)")],
                    ["div", ("A.addTransition(2,'b',3)")],
                    ["div", ("A.addTransition(3,'a',1)")],
                    ["div", ("A.addTransition(3,'b',1)")],
                    ["div", ("A.addTransition(4,'b',4)")],
                ]];
                break;

            case "other":

        }

        var ele = getOffset (document.getElementById("help-main"));

        var winCommand = libD.newWin({ //Create a new window
            title:      _(command),
            show:       true,
            fullscreen: false,
            content: libD.jso2dom(content) //Send the html
        });
        winCommand.top = ele.top+"px";
        winCommand.left = ele.left-document.getElementById("help-command").offsetWidth+"px";
    }


    function getOffset(element) { // Notre fonction qui calcule le positionnement complet
        var top = 0,left = 0;
        do {
            top += element.offsetTop;
            left += element.offsetLeft;
        } while (element = element.offsetParent); // Tant que « element » reçoit un « offsetParent » valide alors on additionne les valeurs des offsets
        return { // On retourne un objet, cela nous permet de retourner les deux valeurs calculées
            top: top,
            left: left
        };
    }

}(window));
