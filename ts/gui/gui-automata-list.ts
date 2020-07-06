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

namespace AudeGUI.AutomataList {
    const AudeGUI = window.AudeGUI;

    const _ = AudeGUI.l10n;

    const automataList       = [];
    let salcCurAutomaton = -1;

    let automataListClose = null;
    let automataListIntro = null;
    let automataListDiv   = null;
    let automataListBtn   = null;
    let automataListUL    = null;

    function automataListClick(e: Event): void {
        const target = e.currentTarget as Element;
        if (target.lastChild.textContent) {
            const j = parseInt(target.lastChild.textContent, 10);
            target.lastChild.textContent = "";
            automataList.splice(j, 1);

            for (let l = 0; l < AutomataList.automatonCount; ++l) {
                const lastChild = automataListUL.childNodes[l].firstChild.lastChild;
                const k = parseInt(lastChild.textContent, 10);

                if (k >= j) {
                    lastChild.textContent = k - 1;
                }
            }
        } else {
            target.lastChild.textContent = "" + automataList.length;
            automataList.push((target as any)._index);
        }
    }

    function automataListMouseOver(e: Event): void {
        if (salcCurAutomaton !== -1) {
            AudeGUI.mainDesigner.setCurrentIndex((e.currentTarget as any)._index);
        }
    }

    export let automatonCount: number = 0;

    export function load(): void {
        automataListClose = document.getElementById("automata-list-chooser-close");
        automataListIntro = document.getElementById("automata-list-chooser-intro");
        automataListDiv   = document.getElementById("automata-list-chooser");
        automataListBtn   = document.getElementById("automata-list-chooser-btn");
        automataListUL    = document.getElementById("automata-list-chooser-content");

        automataListUL.onmouseout = (ev: MouseEvent) => {
            const e = (ev as any).toElement || ev.relatedTarget;

            if ((e === automataListUL || e === automataListUL.parentNode) && salcCurAutomaton !== -1) {
                AudeGUI.mainDesigner.setCurrentIndex(salcCurAutomaton);
                salcCurAutomaton = -1;
            }
        };

        automataListUL.onmouseover = () => {
            if (salcCurAutomaton === -1) {
                salcCurAutomaton = AudeGUI.mainDesigner.currentIndex;
            }
        };

        automataListDiv.querySelector("p:last-child").innerHTML = libD.format(
            AudeGUI.l10n(
                "This order will be used for future algorithm executions. If you want to change this order, you can call this list using the <img src=\"{0}\" /> toolbar icon.<br />Notice: Algorithms taking only one automaton work with the current automaton, they don’t use this ordering."
            ),
            libD.getIcon("actions/format-list-ordered")
        );
    }

    export function removeAutomaton(A: Automaton): void {
        const i = automataList.indexOf(A);

        if (i !== -1) {
            automataList.splice(i, 1);
            for (let j = 0, len = automataList.length; j < len; ++j) {
                if (automataList[j] > i) {
                    --automataList[j];
                }
            }
        }
    }

    export function getIndex(i: number): Automaton {
        return automataList[i];
    }

    export function length(): number {
        return automataList.length;
    }

    export function hide(): void {
        automataListDiv.classList.add("disabled");
    }

    export function show(count?: number, callback?: any): void {
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

                automataListBtn.onclick = () => {
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

        for (let k = 0; k < AutomataList.automatonCount; ++k) {
            const li = document.createElement("li");
            const a  = document.createElement("a");
            a.href = "#";
            (a as any)._index = k;
            const indexInList = automataList.indexOf(k);
            const nb = document.createElement("span");
            nb.className = "automaton-number";

            if (indexInList !== -1) {
                nb.textContent = "" + indexInList;
            }

            a.onclick = automataListClick;

            a.onmouseover = automataListMouseOver;

            a.appendChild(document.createElement("span"));
            a.lastChild.textContent = libD.format(_("Automaton #{0}"), k);
            a.appendChild(nb);
            li.appendChild(a);
            automataListUL.appendChild(li);
        }

        automataListDiv.classList.remove("disabled");
    }
}
