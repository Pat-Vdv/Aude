/**
 * This "static" class holds all the Audescript programs 
 * that may be used throughout Aude. 
 * In order to use the programs, they must be loaded first
 * by calling AutomatonPrograms.loadPrograms.
 */
class AutomatonPrograms {
    private static areProgramsLoaded: boolean = false;

    static createAutomatonCoreachable:
        (nbStates: number,
            alphabet: Iterable<any>,
            nbAcceptingStates: number,
            typeAutomaton: number,
            nbTransitions: number | string) => Automaton;

    static createAutomaton:
        (nbStates: number,
            alphabet: Iterable<any>,
            nbAcceptingStates: number,
            typeAutomaton: number,
            nbTransitions: number | string) => Automaton;

    static complete: (a: Automaton) => Automaton;
    static isCompleted: (a: Automaton) => boolean;
    static automataAreEquivalent: (a1: Automaton, a2: Automaton) => boolean;
    static product: (a1: Automaton, a2: Automaton) => Automaton;
    static minimize: (a: Automaton) => Automaton;
    static isMinimized: (a: Automaton) => boolean;
    static complement: (a: Automaton) => Automaton;
    static distinguableStates: (a: Automaton) => libD.Set;
    static notDistinguableStates: (a: Automaton) => libD.Set;
    static coreachableStates: (a: Automaton) => libD.Set;
    static reachableStates: (a: Automaton) => libD.Set;
    static automaton2HTMLTable: any;
    static createTable: any;
    static HTMLTable2automaton: any;
    static smallerWord: any;

    static determinize: (a: Automaton) => Automaton;
    static isDeterminized: (a: Automaton) => boolean;

    /*Chapter 3*/
    static epsElim: (a: Automaton) => Automaton;
    static hasEpsilonTransitions: (a: Automaton) => boolean;

    /*Chapter 4*/
    static regexToAutomaton: (regex: string) => Automaton;
    static automatonToRegex: (a: Automaton) => string;

    /*Chapter 5*/
    static leftLinear2RightLinearGrammar: (l: linearGrammar | string) => linearGrammar;
    static rightLinear2LeftLinearGrammar: (r: linearGrammar | string) => linearGrammar;
    static linearGrammar2Automaton: (g: linearGrammar | string) => Automaton;
    static automaton2RightLinearGrammar: (a: Automaton) => linearGrammar;
    static isLeftLinear: (a: linearGrammar) => boolean;

    /**
     * Loads automata-related algorithms (minimization, completion, etc...) from audescript.
     * WARNING : The programs may not be availible immediately after calling this function,
     * since they are loaded asynchronously.
     */
    static loadPrograms(forceReload: boolean = false): void {
        if (AutomatonPrograms.areProgramsLoaded && !forceReload) {
            return;
        }

        try {
            window.AudeGUI.Runtime.loadIncludes([
                "completion", "equivalence", "product", "minimization",
                "complementation", "distinguishability", "coreachability",
                "reachability", "automaton2htmltable", "htmltable2automaton",
                "createAutomaton", "smallerWord", "determinization",
                "epsElimination", "regex2automaton", "automaton2regex",
                "automaton2RightLinearGrammar", "linearGrammar2Automaton",
                "leftLinear2RightLinearGrammar", "rightLinear2LeftLinearGrammar"
            ], () => {
                try {
                    AutomatonPrograms.createAutomatonCoreachable = audescript.m("createAutomaton").createAutomatonCoreachable;
                AutomatonPrograms.createAutomaton = audescript.m("createAutomaton").createAutomaton;
                AutomatonPrograms.complete = audescript.m("completion").complete;
                AutomatonPrograms.isCompleted = audescript.m("completion").isCompleted;
                AutomatonPrograms.automataAreEquivalent = audescript.m("equivalence").automataAreEquivalent;
                AutomatonPrograms.product = audescript.m("product").product;
                AutomatonPrograms.minimize = audescript.m("minimization").minimize;
                AutomatonPrograms.isMinimized = audescript.m("minimization").isMinimized;
                AutomatonPrograms.complement = audescript.m("complementation").complement;
                AutomatonPrograms.distinguableStates = audescript.m("distinguishability").distinguableStates;
                AutomatonPrograms.notDistinguableStates = audescript.m("distinguishability").notDistinguableStates;
                AutomatonPrograms.coreachableStates = audescript.m("coreachability").coreachableStates;
                AutomatonPrograms.reachableStates = audescript.m("reachability").reachableStates;
                AutomatonPrograms.automaton2HTMLTable = audescript.m("automaton2htmltable").automaton2HTMLTable;
                AutomatonPrograms.createTable = audescript.m("htmltable2automaton").createTable;
                AutomatonPrograms.HTMLTable2automaton = audescript.m("htmltable2automaton").HTMLTable2automaton;
                AutomatonPrograms.determinize = audescript.m("determinization").determinize;
                AutomatonPrograms.isDeterminized = audescript.m("determinization").isDeterminized;
                AutomatonPrograms.smallerWord = audescript.m("smallerWord").smallerWord;
                AutomatonPrograms.epsElim = audescript.m("epsElimination").epsElim;
                AutomatonPrograms.hasEpsilonTransitions = audescript.m("epsElimination").hasEpsilonTransitions;
                AutomatonPrograms.regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
                AutomatonPrograms.automatonToRegex = audescript.m("automaton2regex").automatonToRegex;
                AutomatonPrograms.leftLinear2RightLinearGrammar = audescript.m("leftLinear2RightLinearGrammar").leftLinear2RightLinearGrammar;
                AutomatonPrograms.rightLinear2LeftLinearGrammar = audescript.m("rightLinear2LeftLinearGrammar").rightLinear2LeftLinearGrammar;
                AutomatonPrograms.linearGrammar2Automaton = audescript.m("linearGrammar2Automaton").linearGrammar2Automaton;
                AutomatonPrograms.automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
                AutomatonPrograms.isLeftLinear = audescript.m("leftLinear2RightLinearGrammar").isLeftLinear;
                AutomatonPrograms.areProgramsLoaded = true;
                } catch (e) {
                    window.AudeGUI.notify(window.AudeGUI.l10n("Error loading programs"), window.AudeGUI.l10n("The default audescript files couldn't be loaded. Your browser prevents getting local files. Many features will not work properly !"), "error");
                }
            });
        } catch (e) {
            window.AudeGUI.notify(window.AudeGUI.l10n("Error loading programs"), window.AudeGUI.l10n("The default audescript files couldn't be loaded. Your browser prevents getting local files. Many features will not work properly !"), "error");
        }
    }
}

window.addEventListener("load", () => {
    AutomatonPrograms.loadPrograms();
});