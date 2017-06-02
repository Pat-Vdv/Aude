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

/* globals libD */

(function (pkg) {
    "use strict";

    var AudeGUI = pkg.AudeGUI;

    var _ = AudeGUI.l10n;

    var automataList       = [];
    var salc_cur_automaton = -1;

    var automataListClose = null;
    var automataListIntro = null;
    var automataListDiv   = null;
    var automataListBtn   = null;
    var automataListUL    = null;

    function automataListClick(e) {
        if (e.currentTarget.lastChild.textContent) {
            var j = parseInt(e.currentTarget.lastChild.textContent, 10);
            e.currentTarget.lastChild.textContent = "";
            automataList.splice(j, 1);

            for (var l = 0; l < AudeGUI.AutomataList.automatonCount; ++l) {
                var lastChild = automataListUL.childNodes[l].firstChild.lastChild;
                var k = parseInt(lastChild.textContent, 10);

                if (k >= j) {
                    lastChild.textContent = k - 1;
                }
            }
        } else {
            e.currentTarget.lastChild.textContent = automataList.length;
            automataList.push(e.currentTarget._index);
        }
    }

    function automataListMouseOver(e) {
        if (salc_cur_automaton !== -1) {
            AudeGUI.Designer.setCurrentIndex(e.currentTarget._index);
        }
    }

    AudeGUI.AutomataList = {
        automatonCount: 0,

        load: function () {
            automataListClose = document.getElementById("automata-list-chooser-close");
            automataListIntro = document.getElementById("automata-list-chooser-intro");
            automataListDiv   = document.getElementById("automata-list-chooser");
            automataListBtn   = document.getElementById("automata-list-chooser-btn");
            automataListUL    = document.getElementById("automata-list-chooser-content");

            automataListUL.onmouseout = function (ev) {
                var e = ev.toElement || ev.relatedTarget;

                if ((e === automataListUL || e === automataListUL.parentNode) && salc_cur_automaton !== -1) {
                    AudeGUI.Designer.setCurrentIndex(salc_cur_automaton);
                    salc_cur_automaton = -1;
                }
            };

            automataListUL.onmouseover = function () {
                if (salc_cur_automaton === -1) {
                    salc_cur_automaton = AudeGUI.Designer.currentIndex;
                }
            };

            automataListDiv.querySelector("p:last-child").innerHTML = libD.format(
                AudeGUI.l10n(
                    "This order will be used for future algorithm executions. If you want to change this order, you can call this list using the <img src=\"{0}\" /> toolbar icon.<br />Notice: Algorithms taking only one automaton work with the current automaton, they don’t use this ordering."
                ),
                libD.getIcon("actions/format-list-ordered")
            );
        },

        removeAutomaton: function (A) {
            var i = automataList.indexOf(A);

            if (i !== -1) {
                automataList.splice(i, 1);
                for (var j = 0, len = automataList.length; j < len; ++j) {
                    if (automataList[j] > i) {
                        --automataList[j];
                    }
                }
            }
        },

        getIndex: function (i) {
            return automataList[i];
        },

        length: function () {
            return automataList.length;
        },

        hide: function () {
            automataListDiv.classList.add("disabled");
        },

        show: function (count, callback) {
            if (!automataListDiv.classList.contains("disabled")) {
                return;
            }

            if (callback || automataListBtn.onclick) {
                automataListBtn.classList.remove("disabled");

                if (callback) {
                    automataListIntro.innerHTML = libD.format(
                        _("The algorithm you want to use needs {0} automata. Please select these automata in the order you want and click \"Continue execution\" when you are ready."),
                        count
                    );

                    automataListBtn.onclick = function () {
                        if (automataList.length < count) {
                            window.alert(
                                libD.format(
                                    _("You didn’t select enough automata. Please select {0} automata."),
                                    count
                                )
                            );

                            return;
                        }

                        automataListClose.onclick();
                        automataListBtn.onclick = null;
                        AudeGUI.Runtime.callWithList(count, callback);
                    };
                }
            } else {
                automataListBtn.classList.add("disabled");

                automataListIntro.textContent = _(
                    "You can choose the order in which automata will be used in algorithms."
                );
            }

            automataListUL.textContent = "";

            for (var k = 0; k < AudeGUI.AutomataList.automatonCount; ++k) {
                var li = document.createElement("li");
                var a  = document.createElement("a");
                a.href = "#";
                a._index = k;
                var indexInList = automataList.indexOf(k);
                var number = document.createElement("span");
                number.className = "automaton-number";

                if (indexInList !== -1) {
                    number.textContent = indexInList;
                }

                a.onclick = automataListClick;

                a.onmouseover = automataListMouseOver;

                a.appendChild(document.createElement("span"));
                a.lastChild.textContent = libD.format(_("Automaton #{0}"), k);
                a.appendChild(number);
                li.appendChild(a);
                automataListUL.appendChild(li);
            }

            automataListDiv.classList.remove("disabled");
        }
    };
}(window));
