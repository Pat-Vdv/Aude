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


(function () {
    let automatoncodeedit = null;
    let aceEditor = null;

    let AudeGUI = window.AudeGUI;

    class AutomatonCodeEditor {
        static getText(): string {
            return automatoncodeedit.value;
        };

        static setText(t: string): void {
            automatoncodeedit.value = t;
        };

        static load(): void {
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

    AudeGUI.AutomatonCodeEditor = AutomatonCodeEditor;

    class ProgramEditor {
        static getText(): string {
            return aceEditor ? aceEditor.getValue() : "";
        };

        static setText(t: string): void {
            AudeGUI.ProgramEditor.enable();
            aceEditor.setValue(t);
        };

        static enable(): void {
            if (!aceEditor) {
                aceEditor = ace.edit("codeedit");
                aceEditor.getSession().setOption("useWorker", false);
                aceEditor.getSession().setMode("ace/mode/audescript");
                aceEditor.$blockScrolling = Infinity;
            }
        };

        static load(): void {
            // Nothing to do here yet
        };
    };

    AudeGUI.ProgramEditor = ProgramEditor;
}());
