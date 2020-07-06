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

namespace AudeGUI.AutomatonCodeEditor {
    let automatoncodeedit = null;

    export function getText(): string {
        return automatoncodeedit.value;
    };

    export function setText(t: string): void {
        automatoncodeedit.value = t;
    };

    export function load(): void {
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
}

namespace AudeGUI.ProgramEditor {
    let aceEditor = null;

    export function getText(): string {
        return aceEditor ? aceEditor.getValue() : "";
    };

    export function setText(t: string): void {
        AudeGUI.ProgramEditor.enable();
        aceEditor.setValue(t);
    };

    export function enable(): void {
        if (!aceEditor) {
            aceEditor = ace.edit("codeedit");
            aceEditor.getSession().setOption("useWorker", false);
            aceEditor.getSession().setMode("ace/mode/audescript");
            aceEditor.$blockScrolling = Infinity;
        }
    };

    export function load(): void {
        // Nothing to do here yet
    };
};
