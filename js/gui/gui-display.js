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

(function(pkg) {
    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    //Inputs to enter a grammar
    pkg.inputGrammar = function (divAnswersUser) {
        divAnswersUser.appendChild(libD.jso2dom([
            ["div#input-block-grammar",[
                ["span",_("Write directly the grammar: ")],
                ["input#input-plain-grammar"],["br"],
                ["div#div-enter-easy-grammar",_("Or enter easily the grammar: ")],
                ["span",_("Write the terminal symbols: ")],
                ["input#input-term-symbol"],["br"],
                ["span",_("Write the non terminal symbols: ")],
                ["input#input-non-term-symbol"],["br"],
                ["select#input-start-symbol",[
                    ["option",_("Select the start symbol")],
                ]],
                ["div#input-production-rules",[
                    ["div.question-answers-input-rule",[
                        ["input.input-rule-non-term-symbol",{"type":"text","placeholder":_("Non terminal symbol")}],
                        ["span.arrow",("→")],
                        ["input.input-rule-non-term-symbol",{"type":"text","placeholder":_("Body")}],
                        ["button.input-rule-remove",('X')],
                    ]]
                ]],
                ["button#add-rule",("Add a rule")],
            ]]
        ]));

        //Create the list od start symbol with the non terminal symbols
        var startSymbol = document.getElementById("input-start-symbol");
        var nonTermSym = document.getElementById("input-non-term-symbol");
        var startSymbolSelected = null;
        nonTermSym.oninput = function () {
            startSymbolSelected = startSymbol.value; //Save the current value
            var syms = nonTermSym.value.split(',');
            if (syms.length>0)
                startSymbol.innerHTML="<option id='select-start-symbol'>Select the start symbol</option>";
            for (var s of syms) {
                if (s !== "" && s !== " " ) {
                    var option = document.createElement("option");
                    option.value = s;
                    option.textContent = s;
                    startSymbol.appendChild(option);
                }
            }
            startSymbol.value = startSymbolSelected; //Reset the value after recreating the options
        };

        //To enter the production rules
        var divRules = document.getElementById("input-production-rules");
        document.getElementById("add-rule").onclick = function () {
            divRules.appendChild(libD.jso2dom([
                ["div.question-answers-input-rule",[
                    ["input.input-rule-non-term-symbol",{"type":"text","placeholder":_("Non terminal symbol")}],
                    ["span.arrow",("→")],
                    ["input.input-rule-non-term-symbol",{"type":"text","placeholder":_("Body")}],
                    ["button.input-rule-remove",('X')],
                ]]
            ]));
            document.getElementsByClassName('input-rule-remove')[divRules.childElementCount-1].onclick = function(e) {
                e.target.parentNode.parentNode.removeChild(e.target.parentNode);
            }
        }
    }

    //Get the string grammar (to use after inputGrammar)
    pkg.getInputGrammar = function (){
        var grammar = document.getElementById("input-plain-grammar");
        if (grammar.value === "") {
            var divTerm = document.getElementById("input-term-symbol");
            var divNonTerm = document.getElementById("input-non-term-symbol");
            var divStart = document.getElementById("input-start-symbol");
            var divRules = document.getElementById("input-production-rules");
            var G = "({"+divTerm.value+"},{"+divNonTerm.value+"},"+divStart.value+",{"; //The grammar is created thanks to the input

            var rule = divRules.childNodes[0];
            G+=rule.childNodes[0].value+"->"+rule.childNodes[2].value
            for (var i=1,l=divRules.childElementCount;i<l;i++) { //For each rule we take the informations from the input
                rule = divRules.childNodes[i];
                if (rule.childNodes[0].value!=="" && rule.childNodes[2].value !== "")
                    G+=","+rule.childNodes[0].value+"->"+rule.childNodes[2].value;
            }
            G+="})";
        }
        else
            var G = grammar.value;
        console.log(G);
        return G;
    }



    //Let the user selects the mode (automaton,RE,grammar)
    pkg.drawSelectMode = function (accept) {
         //Let the user selects the mode:
        if (document.getElementById("selection-mode-algorithm")===undefined || document.getElementById("selection-mode-algorithm")===null) {  //To prevent opening multiple windows
            var div = document.createElement("div");
            div.className = "libD-ws-colors-auto auto-size";
            div.id = "selection-mode-algorithm";
            div.appendChild(libD.jso2dom([
                ["div",_("Choose the entry of the algorithm: ")],
                ["input.selection-mode-type",{"type":"radio","name":"mode","value":"automaton","checked":"true"}],
                ["span",_("Automaton")],["br"],
                ["input.selection-mode-type",{"type":"radio","name":"mode","value":"RE"}],
                ["span",_("Regular expression")],["br"],
                ["div",[
                    ["input#input-regex",{"type":"text","style":"display:none"}],
                ]],
                ["input.selection-mode-type",{"type":"radio","name":"mode","value":"grammar"}],
                ["span",_("Grammar")],["br"],
                ["div",[
                    ["div#input-grammar",{"style":"display:none"}],
                ]],
                ["button#accept-mode-language",_("Validate")],["br"],
            ]));


            var win = libD.newWin({ //Create a new window
                title:      _("Choose type"),
                show:       true,
                fullscreen: false,
                content: div
            });


            var regex = document.getElementById("input-regex");
            var grammar = document.getElementById("input-grammar");

            inputGrammar(grammar);
            //Add the resize event when we add or delete a rule
            document.getElementById("add-rule").addEventListener("click",function() {
                win.resize();
                var removes = document.getElementsByClassName("input-rule-remove");
                var parent = document.getElementById("input-production-rules");
                removes[parent.childElementCount-1].addEventListener("click",function()
                {win.resize()});
            });


            var radioButton = document.getElementsByClassName("selection-mode-type")
            radioButton[0].oninput = function() {
                win.resize();
                regex.style.display = "none";
                grammar.style.display = "none";
            }
            radioButton[1].oninput = function() {
                win.resize();
                if (getComputedStyle(regex).display == "none") {
                    regex.style.display = "inline";
                    grammar.style.display = "none";
                }
                else
                    regex.style.display = "none";
            }
            radioButton[2].oninput = function() {
                win.resize();
                if (getComputedStyle(grammar).display == "none") {
                    grammar.style.display = "inline";
                    regex.style.display = "none";
                }
                else
                    grammar.style.display = "none";
            }

            //Button to validate the choice
            document.getElementById("accept-mode-language").onclick = function() {
                accept(radioButton,regex.value,getInputGrammar(),win);
            }


        }
        else
            return "You have already launched the program!";
    }

    //Resize the window when adding elements
    //Now use win.resize()
    /*pkg.resize = function (div) {
        div.parentNode.className = "libD-wm-content auto-size";
        div.parentNode.parentNode.style.width = "";
        div.parentNode.parentNode.style.height = "";
    }*/

    //Area to allow the users to write the grammar
    //Take a function in parameters, the function is launched when the user clicks on the button
    pkg.askGrammarAlgorithm = function (validate) {
        if (document.getElementById("input-grammar-algorithm")===undefined || document.getElementById("input-grammar-algorithm")===null) {  //To prevent opening multiple windows
            var div = document.createElement("div");
            div.className = "libD-ws-colors-auto auto-size";
            div.id = "input-grammar-algorithm";

            var win = libD.newWin({ //Create a new window
                title:      _("Enter a grammar"),
                show:       true,
                fullscreen: false,
                content: div
            });
            inputGrammar(div);
            div.appendChild(libD.jso2dom([
                ["br"],
                ["button#validate-grammar",_("Validate")]
            ]));

            document.getElementById("validate-grammar").onclick = validate;

            //Add the resize event when we add or delete a rule
            document.getElementById("add-rule").addEventListener("click",function(){
                win.resize();
            });
        }
        else
            return "You have already launched the program!";
    }

    //Ask the value to create an automaton
    //activate the function validate
    pkg.askSettingsAutomaton = function (validate) {
        let div = document.createElement('div');
        div.className=("libD-ws-colors-auto auto-size");
        div.appendChild(libD.jso2dom([
            ["div",{"class":"div-settings-question-container-row"}, [
                ["div",{"class":"div-settings-question-container-column"}, [
                    ["span",{"class":"span-settings-question"},_("Number of states: ")],
                    ["span",{"class":"span-settings-question"},_("Alphabet ")],
                    ["span",{"class":"span-settings-question"},_("Number of final states: ")],
                    ["span",{"class":"span-settings-question","title":_("Automaton determinist: 1\nAutomaton non determinist: 2 \nAutomaton non determinist with ε-transitions: 3")},_("Mode: ")],
                    ["span",{"class":"span-settings-question"},_("Number of transitions: ")],
                ]],
                ["div",{"class":"div-settings-question-container-column"}, [
                    ["input",{"class":"input-settings-question","type":"number","min":"1"}],
                    ["input",{"class":"input-settings-question","type":"text"}],
                    ["input",{"class":"input-settings-question","type":"number","min":"0"}],
                    ["input",{"class":"input-settings-question","type":"number","min":"1","max":"3"}],
                    ["input",{"class":"input-settings-question","type":"number","min":"0"}],
                ]],
            ]],
            ["button#validate-automaton",_("Validate")],
        ]))

        var win = libD.newWin({ //Create a new window
            title:      _("Settings automaton"),
            show:       true,
            fullscreen: false,
            content: div
        });

        //Validate the choice
        document.getElementById("validate-automaton").onclick = function() {
            var inputs = document.getElementsByClassName("input-settings-question");
            var alphabet = inputs[1].value.split(',');
            validate(inputs[0].value,alphabet,inputs[2].value,inputs[3].value,inputs[4].value);
        }
    }


}(window));
