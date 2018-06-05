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


(function(pkg,that){
    //CLass Question: wording, typeQuestion, underTypeQuestion, automaton if needed
    pkg.Question = function (wording,typeQuestion,underTypeQuestion,automaton) {
        this.wording = wording; //The wording of the question
        if (typeQuestion!="MCQ" && typeQuestion!="RE" && typeQuestion!="Automaton")
            console.log("Error: creation of question impossible. typeQuestion: "+typeQuestion +" is not valid");
        else
            this.typeQuestion = typeQuestion; //The type of the question (MCQ,Automaton,RE (Regular expression))
        this.underTypeQuestion = underTypeQuestion;

        this.automaton = automaton; //The automaton associated with the question
    }

    pkg.Question.prototype = {

        //Return true if the question needs to display an automaton for the wording
        needAutomatonQuestion: function() {
            return true;
        }
    };

})(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this);



(function (pkg) {
    "use strict";
    var q = new Question("aa","MCQ");
    var AudeGUI = pkg.AudeGUI;
    var _ = AudeGUI.l10n;

    var win = null; //Creation of a new window
    var questionList = null;
    var questionListContent = null;
    var chapterSelected = null; //Chapter selected by the user
    var questionSelected = null;




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

    function drawQuestionList () {
        if (win && win.ws) {
            win.close();
            questionList.parentNode.removeChild(questionList);
        }

        let refs = {}; //  List of the references, {"#":"reference"}

        let questionListWindowContent = ["div#questionList.libD-ws-colors-auto libD-ws-size-auto", {"#":"root"}, [
                ["button#close-questionList", {"#": "close"}, _("Close the question list")],
                ["div", {"style": "min-height:5%"} ],
                ["div#questionList-container", [ //Contains the chapter, and question
                    ["div#questionList", [ //To select the chapter
                        ["table#questionList-selection-chapter", [
                            ["tr", [
                                ["td",{"class":"questionList-selection-chapter-cell"},["button",{"class":"questionList-selection-chapter-cell-button","value": "1"}, _("Chapter 1: Deterministic finite state machines")]],
                                ["td",{"class":"questionList-selection-chapter-cell"},["button",{"class":"questionList-selection-chapter-cell-button","value": "2"}, _("Chapter 2: Non-deterministic finite state machines")]],
                                ["td",{"class":"questionList-selection-chapter-cell"},["button",{"class":"questionList-selection-chapter-cell-button","value": "3"}, _("Chapter 3: Non-deterministic finite state machines with ε-transitions")]],
                                ["td",{"class":"questionList-selection-chapter-cell"},["button",{"class":"questionList-selection-chapter-cell-button","value": "4"}, _("Chapter 4: Regular expressions and Kleene theorem")]],
                                ["td",{"class":"questionList-selection-chapter-cell"},["button",{"class":"questionList-selection-chapter-cell-button","value": "5"}, _("Chapter 5: Grammars and regular grammars")]],
                                ["td",{"class":"questionList-selection-chapter-cell"},["button",{"class":"questionList-selection-chapter-cell-button","value": "6"}, _("Chapter 6: Non-regular langages and iterative lemme")]],
                            ]]
                        ]],
                    ]],
                    ["div#questionList-selection-question", {"style": "min-height:5%"}, _("No chapter selected.") ]
                ]],
            ]];


        win = libD.newWin({ //Create a new window
            title:      _("Question List"),
            show:       true,
            fullscreen: true,
            content: libD.jso2dom(questionListWindowContent,refs) //Send the html
        });
        var buttons = document.getElementsByClassName('questionList-selection-chapter-cell-button');

        for (var i=0,l=buttons.length;i<l;i++) { // Add event on the td
            buttons[i].addEventListener('click',function(e) {
                if (chapterSelected)
                    chapterSelected.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ; //Change the color of the previous selected chapter
                e.target.style.backgroundColor = 'rgba(239, 100, 100)'; //CHange to red when we click
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

    //Dislpay the list of question corresponding to the selected chapter
    function drawQuestionChapter (chapter) {
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
                ]
                ));
                break;
            default:
                div.appendChild(libD.jso2dom([
                ["span",{"class":"questionList-question"}, _("No question")]]));
        }
        var A = new Automaton();
        A.addState("0");
        A.setInitialState("0");

        var q = new Question("J'aime les gauffres ! Mais j'aime aussi les crêpes et les patîsseries mais pas autant que les gauffres ! 風夏 ","Automaton","complete",A);

        var buttonQuestion = document.getElementsByClassName('questionList-question-select') //To display the question
        for (var i=0,l=buttonQuestion.length;i<l;i++) {
            buttonQuestion[i].addEventListener('click',function(e) {
                questionSelected = e.target.value;
                var div = document.getElementById("questionList-container"); //Area to display the question
                div.innerHTML="";
                div.appendChild(libD.jso2dom([
                    ["button#menu-questionList", _("Menu questions")],
                    ]
                ));
                var but = document.getElementById("menu-questionList"); //The button permits to return to the menu
                but.onclick = reDrawQuestionList;
                drawQuestion(q,div);
            });
        }
    }

    //Redraw the menu as it was before selected an question
    function reDrawQuestionList () {
        drawQuestionList(); //Display the main page
        drawQuestionChapter(chapterSelected.value); //Display the question for the chapter we were looking
        chapterSelected = document.getElementsByClassName('questionList-selection-chapter-cell-button')[chapterSelected.value-1];
        chapterSelected.style.backgroundColor='rgba(239, 100, 100)'; //Draw in red the chapter
    }



    //Display the question on the div
    function drawQuestion (question,div) {

        div.appendChild( libD.jso2dom([
            ["div#question-wording", _("Wording: ")],
            ["div#question-automata-designer"], //To put the automaton for the questions
            ["div#question-answers"], //Answer of the user
            ["div#question-button-container",[
                ["button",_("Validate")]
            ]],
            ]
        ));

        var divWording = document.getElementById("question-wording");
        divWording.innerHTML += question.wording;
        var divAutomatonQuestion = document.getElementById("question-automata-designer");
        console.log(automaton_code(question.automaton));
        if (question.needAutomatonQuestion() ) {
            var designer = new AudeDesigner(divAutomatonQuestion, true);
            designer.setAutomatonCode(automaton_code(question.automaton));
            designer.autoCenterZoom();
        } else {
            refs.questionAutomata.style.display = "none";
        }


    }




}(window));
