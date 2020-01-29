declare var aude: any;

declare class Heap extends Array {
    top(): any
}

interface Window {
  AudeGUI: {
    automatonFileInput: any,
    mainDesigner: AudeDesigner,
    notifier: any,
    openAutomaton: any,
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
    Programs: any,
    Quiz: any,
    QuestionList: any,
    QuizEditor: any,
    WordExecution: any,
    Runtime: any,
    AutomatonCodeEditor: any,
    ProgramEditor: any,
    AutomataList: any,
    Help: any,

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
  pushSymbol(symbols: string, stack: string[]); // FIXME put in a namespace specific to pushdown automata
  heap(l: any[]): Heap;
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
  setCurrentIndex: (index: number) => void;
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

declare class Moore {
    setInitialState(state: any);
    addTransition(start: any, symbol: any, end: any);
    setOutput(start: any, output: any);
}

declare class Mealy {
    setInitialState(state: any);
    addTransition(start: any, symbol: any, end: any);
    setOutput(start: any, input: any, output: any);
}

declare class Pushdown {
    setInitialState(state: any);
    setFinalState(state: any);
    addTransition(start: any, symbol: any, stackSymbol: any, end: any, newStackSymbol: any);
}
