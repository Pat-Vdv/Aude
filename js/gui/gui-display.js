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
            ["span",_("Write directly the grammar: ")],
            ["input#input-plain-grammar"],["br"],
            ["Div",_("Or enter the grammar easily: ")],
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
        ]));

        //Create the list od start symbol with the non terminal symbols
        var startSymbol = document.getElementById("input-start-symbol");
        var nonTermSym = document.getElementById("input-non-term-symbol");
        nonTermSym.oninput = function () {
            var syms = nonTermSym.value.split(',');
            if (syms.length>0)
                startSymbol.innerHTML="<option>Select the start symbol</option>";
            for (var s of syms) {
                var option = document.createElement("option");
                option.value = s;
                option.textContent = s;
                startSymbol.appendChild(option);
            }
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
                title:      _("Chose type"),
                show:       true,
                fullscreen: false,
                content: div
            });

            var regex = document.getElementById("input-regex");
            var grammar = document.getElementById("input-grammar");

            inputGrammar(grammar);
            //Add the resize event when we add or delete a rule
            document.getElementById("add-rule").addEventListener("click",function() {
                resize(div);
                var removes = document.getElementsByClassName("inpur-rule-remove");
                removes[removes.childElementCount-1].addEventListener("click",resize.bind(null,div));
            });


            var radioButton = document.getElementsByClassName("selection-mode-type")
            radioButton[0].oninput = function() {
                resize(div);
                regex.style.display = "none";
                grammar.style.display = "none";
            }
            radioButton[1].oninput = function() {
                resize(div)
                if (getComputedStyle(regex).display == "none") {
                    regex.style.display = "inline";
                    grammar.style.display = "none";
                }
                else
                    regex.style.display = "none";
            }
            radioButton[2].oninput = function() {
                resize(div);
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
    function resize(div) {
        div.parentNode.className = "libD-wm-content auto-size";
        div.parentNode.parentNode.style.width = "";
        div.parentNode.parentNode.style.height = "";
    }

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
            document.getElementById("add-rule").addEventListener("click",resize.bind(null,div));
        }
        else
            return "You have already launched the program!";
    }


}(window));
