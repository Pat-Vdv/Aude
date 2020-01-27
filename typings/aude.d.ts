declare var aude: any;

interface Window {
  AudeGUI: {
    automatonFileInput: any,
    mainDesigner: AudeDesigner,
    notifier: any,
    Results: {
      deferedResultShow: boolean,
      enable: () => void,
      splitterMove: (e: { clientX: number }) => void,
      setText: (t: string, dontNotify?: boolean) => void,
      setDOM: (n: Node, dontNotify?: boolean) => void,
      setAutomaton: (A: Automaton) => void,
      set: (res: any) => void,
      setMealy: (M) => void,
      setMoore: (M) => void,
      setPushdownAutomaton: (P) => void,
      load: () => void,
      export: () => void,
      redraw: () => void
    },
    onResize: () => void,
    programResultUpdated(dontNotify, res),
    l10n: (txt: string) => string,
    audeExam: boolean,
    Runtime: {
      loadIncludes: (includes: Array<any>, callback: Function) => void;
      get_pushdown_automaton(index: number);
      get_turing_machine(index: number);
    },
    Quiz: any,
    QuestionList: any,
    QuizEditor: any,
    WordExecution: any,
    Moore: any,
    Mealy: any,
    AutomatonCodeEditor: any

    removeCurrentAutomaton(): void;

    getCurrentMode(): string;
    setCurrentMode(mode: string): void;

    addAutomaton(): void;

    notify(title: string, content: string | HTMLElement, type?: "info" | "ok" | "error", time?: number): void;
    viz(code: string, callback: (res: string) => void): void;
  };

  Hammer: any;

  svg2automaton(svg: string): Automaton;
  automatonFromObj(obj: any): Automaton;
}

declare var audescript: {
  m: (moduleName: string, newModule?: boolean) => any;
  toJS: (str: string, moduleName?: any, fname?: any) => any;
};

declare function automaton2svg(A: Automaton, callback: (result: string) => void): void;

declare function automaton2dot(A: Automaton): string;

declare class AudeDesigner {
  constructor(svgContainer: HTMLElement, readOnly?: boolean);

  currentIndex: number;

  setAutomatonCode: (automaton: string, index?: any) => void;
  clearSVG(index, dontSnapshot): void;
  getAutomaton: (index: number, onlyStrings?: boolean) => Automaton;
  transitionPulseColor(index?, startState?, symbol?, endState?, color?, pulseTime?): void;
  autoCenterZoom: () => void;
  enable(): void;
  redraw: () => void;
  getDot: () => string;
  getSVG(index?: number): string;
  cleanSVG(index: number, dontCleanColors?): void;
  setSVG: (svg?: string, index?: number, dontSnapshot?: boolean) => void;
  stateSetBackgroundColor(index?, state?, color?): void;
  stateRemoveBackgroundColor(index?, state?): void;
  static initiateNewState(): void;
  static outerHTML(node: Node): string;
}
