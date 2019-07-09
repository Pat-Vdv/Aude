
var _ = window.AudeGUI.l10n;
/**
 * This class holds all the Audescript programs 
 * that may be used throughout Aude. 
 * In order to use the programs, they must be loaded first
 * by calling AutomatonPrograms.loadPrograms.
 */
class AutomatonPrograms {
    private static areProgramsLoaded: boolean = false;

    // For the creation of the automaton
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
    static regexToAutomaton = null;
    static automatonToRegex = null;

    /*Chapter 5*/
    static leftLinear2RightLinearGrammar = null;
    static rightLinear2LeftLinearGrammar = null;
    static linearGrammar2Automaton: (g: linearGrammar | string) => Automaton;
    static automaton2RightLinearGrammar = null;
    static isLeftLinear = null;

    static tableRandomAutomateGeneration() {
        return ["table", [
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-nbstates" }, _("Number of states:")]],
                ["td", ["input.input-settings-question#create-automaton-nbstates", {
                    "type": "number",
                    "min": "1"
                }]]
            ]],
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-alphabet" }, _("Alphabet")]],
                ["td", ["input.input-settings-question#create-automaton-alphabet", {
                    "type": "text"
                }]]
            ]],
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-nbaccepting" }, _("Number of accepting states:")]],
                ["td", ["input.input-settings-question#create-automaton-nbaccepting", {
                    "type": "number",
                    "min": "0"
                }]]
            ]],
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-mode" }, _("Mode:")]],
                ["td", ["select.input-settings-question#create-automaton-mode", [
                    ["option", { "value": 1 }, _("Deterministic automaton")],
                    ["option", { "value": 2 }, _("Non deterministic automaton")],
                    ["option", { "value": 3 }, _("Non deterministic automaton with ε-transitions")],
                ]]]
            ]],
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-nbtrans" }, _("Number of transitions:")]],
                ["td", ["input.input-settings-question#create-automaton-nbtrans", {
                    "type": "number",
                    "min": "0"
                }]]
            ]],
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-allstatesreachable" }, _("All states are reachable:")]],
                ["td", ["input.input-settings-question#create-automaton-allstatesreachable", { "type": "checkbox" }]]
            ]],
            ["tr", [
                ["td", ["label.span-settings-question", { "for": "create-automaton-allstatescoreachable" }, _("All states are co-reachable:")]],
                ["td", ["input.input-settings-question#create-automaton-allstatescoreachable", { "type": "checkbox" }]]
            ]],
        ]];
    }

    /**
     * Loads automata-related algorithms (minimization, completion, etc...) from audescript.
     * WARNING : The programs may not be availible immediately after calling this function,
     * since they are loaded asynchronously.
     */
    static loadPrograms(forceReload: boolean = false): void {
        if (this.areProgramsLoaded && !forceReload) {
            return;
        }

        window.AudeGUI.Runtime.loadIncludes([
            "completion", "equivalence", "product", "minimization",
            "complementation", "distinguishability", "coreachability",
            "reachability", "automaton2htmltable", "htmltable2automaton",
            "createAutomaton", "smallerWord", "determinization",
            "epsElimination", "regex2automaton", "automaton2regex",
            "automaton2RightLinearGrammar", "linearGrammar2Automaton",
            "leftLinear2RightLinearGrammar", "rightLinear2LeftLinearGrammar"
        ], () => {
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
            AutomatonPrograms.hasEpsilonTransitions = audescript.m("epsElimination").hasEpsilonTransitions
            AutomatonPrograms.regexToAutomaton = audescript.m("regex2automaton").regexToAutomaton;
            AutomatonPrograms.automatonToRegex = audescript.m("automaton2regex").automatonToRegex;
            AutomatonPrograms.leftLinear2RightLinearGrammar = audescript.m("leftLinear2RightLinearGrammar").leftLinear2RightLinearGrammar;
            AutomatonPrograms.rightLinear2LeftLinearGrammar = audescript.m("rightLinear2LeftLinearGrammar").rightLinear2LeftLinearGrammar;
            AutomatonPrograms.linearGrammar2Automaton = audescript.m("linearGrammar2Automaton").linearGrammar2Automaton;
            AutomatonPrograms.automaton2RightLinearGrammar = audescript.m("automaton2RightLinearGrammar").automaton2RightLinearGrammar;
            AutomatonPrograms.isLeftLinear = audescript.m("leftLinear2RightLinearGrammar").isLeftLinear;
            AutomatonPrograms.areProgramsLoaded = true;
        });
    }
}