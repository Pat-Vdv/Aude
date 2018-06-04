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
    var exerciceList = null;
    var exerciceListContent = null;
    var chapterSelected = null;

    AudeGUI.ExerciceList = {

        load: function () {
            //Rien
        },

        run: openExerciceList,

        close: function () {
            if (!exerciceList) {
                return;
            }
            win.minimize();
        }


    };

    function openExerciceList () {
        if (win) {
            win.show();
            return;
        }
        drawExerciceList();
    }


    /*
    * Create the page that shows the list of exercice
    *
    */

    function drawExerciceList () {
        if (win && win.ws) {
            win.close();
            exerciceList.parentNode.removeChild(exerciceList);
        }

        let refs = {};

        let exerciceListWindowContent = ["div#exerciceList.libD-ws-colors-auto libD-ws-size-auto", {"#":"root"}, [
                ["a#close-exerciceList", {"#": "close", "href": "#"}, _("Close the exercice list")],
                ["div", {"style": "min-height:5%"} ],
                ["div", [ //To select the chapter
                    ["table#exerciceList-selection-chapter", [
                        ["tr", [
                            ["td",{"class":"exerciceList-selection-chapter-cell"}, _("Chapitre 1")],
                            ["td",{"class":"exerciceList-selection-chapter-cell"}, _("Chapitre 2")],
                            ["td",{"class":"exerciceList-selection-chapter-cell"}, _("Chapitre 3")],
                            ["td",{"class":"exerciceList-selection-chapter-cell"}, _("Chapitre 4")],
                            ["td",{"class":"exerciceList-selection-chapter-cell"}, _("Chapitre 5")],
                            ["td",{"class":"exerciceList-selection-chapter-cell"}, _("Chapitre 6")],
                        ]]
                    ]],
                ]],
                ["div#exerciceList-selection-exercice", {"style": "min-height:5%"}, _("No chapter selected.") ]
            ]];


        win = libD.newWin({ //Create a new window
            title:      _("Exercice List"),
            show:       true,
            fullscreen: true,
            content: libD.jso2dom(exerciceListWindowContent,refs) //Send the html
        });

        var tds = document.getElementsByClassName('exerciceList-selection-chapter-cell');

        for (var i=0,l=tds.length;i<l;i++) { // Add event on the td
            tds[i].addEventListener('click',function(e){
                if (chapterSelected)
                    chapterSelected.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ; //Change the color of the previous selected chapter
                e.target.style.backgroundColor = 'rgba(239, 100, 100)';
                chapterSelected = e.target;
                drawExerciceChapter(parseInt(/\d+/.exec(e.target.innerHTML,10)));
            });
            tds[i].addEventListener('mouseover',function(e){ //Change the color to grey when mouseover
                if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                    e.target.style.backgroundColor = 'rgba(150, 150, 150)';
            });
            tds[i].addEventListener('mouseout',function(e){ //Change the color to white when mouseout
                if (getComputedStyle(e.target).backgroundColor!="rgb(239, 100, 100)")
                    e.target.style.backgroundColor = 'rgba(239, 240, 241, 0.93)' ;
            });
        }

        exerciceList = refs.root;
        exerciceListContent = refs.content;

        // Close the exercice list
        refs.close.onclick = AudeGUI.ExerciceList.close;
    }


    //Dislpay the list of exercice corresponding to the selected chapter
    function drawExerciceChapter (chapter) {
        var div = document.getElementById('exerciceList-selection-exercice'); //Aera to display the list
        div.innerHTML="";
        switch (chapter)
        {   case 1:
                div.appendChild(libD.jso2dom([
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Complement the automaton")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Complete the automaton")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Do the product of 2 automata")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Minimize the automaton")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("List all the equivalent states")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Equivalency between 2 automata")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Give the tabular form of the automaton")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Give the automaton from the table")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("List the accessible states")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("List the co-accessible states")],["br"],
                ["button", {"value": ("complement"), "class":"exerciceList-exercice-select"}, _("Give a word recognized by the automata")],["br"],
                ]
                ));
                break;
            default:
                div.appendChild(libD.jso2dom([
                ["span",{"class":"exerciceList-exercice"}, _("No exercice")]]));
        }
    }


}(window));
