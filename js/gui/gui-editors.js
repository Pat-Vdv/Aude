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

/* globals ace */


(function (pkg) {
    "use strict";

    var automatoncodeedit = null;
    var AudeGUI = pkg.AudeGUI;

    AudeGUI.AutomatonCodeEditor = {
        getText: function () {
            return automatoncodeedit.value;
        },

        setText: function (t) {
            automatoncodeedit.value = t;
        },

        load: function () {
            automatoncodeedit = document.getElementById("automatoncodeedit");
            automatoncodeedit.spellcheck = false;

            automatoncodeedit.onchange = function () {
                if (automatoncodeedit.value) {
                    AudeGUI.mainDesigner.setAutomatonCode(
                        automatoncodeedit.value,
                        AudeGUI.mainDesigner.currentIndex
                    );
                }
            };
        }
    };

    var aceEditor = null;

    AudeGUI.ProgramEditor = {
        getText: function () {
            return aceEditor ? aceEditor.getValue() : "";
        },

        setText: function (t) {
            AudeGUI.ProgramEditor.enable();
            aceEditor.setValue(t);
        },

        enable: function () {
            if (!aceEditor) {
                aceEditor = ace.edit("codeedit");
                aceEditor.getSession().setOption("useWorker", false);
                aceEditor.getSession().setMode("ace/mode/audescript");
                aceEditor.$blockScrolling = Infinity;
            }
        },

        load: function () {
            // Nothing to do here yet
        }
    };
}(window));
