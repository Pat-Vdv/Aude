declare var aude: any;

declare class Heap extends Array {
    top(): any
}

interface Window {
  AudeGUI: {
    setCurrentAutomatonIndex: any,
    automatonFileInput: any,
    mainDesigner: AudeDesigner,
    notifier: any,
    openAutomaton: any,
    initEvents: () => void,
    save: any,
    saveAs: any,
    Results: any,
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
  onUndoRedoEvent: any;
  undo: any;
  redo: any;
}

declare class Moore {
    getInitialState(): any;
    getStates(): libD.Set;
    setInitialState(state: any);
    addTransition(start: any, symbol: any, end: any);
    setOutput(start: any, output: any);
    getOutput(state?: any): any;
    getInputAlphabet(): libD.Set;
    next(state: any, symbol:any): any;
    next(state: any, inputSymbol: any): any[];
}

declare class Mealy {
    getInitialState(): any;
    getStates(): libD.Set;
    setInitialState(state: any);
    addTransition(start: any, symbol: any, end: any);
    setOutput(start: any, input: any, output: any);
    getOutput(state?: any): any;
    getInputAlphabet(): libD.Set;
    next(state: any, inputSymbol: any): any[];
}

declare class Pushdown {
    setInitialState(state: any);
    getInitialState(): any;
    setFinalState(state: any);
    getFinalStates(): libD.Set;
    getTransitions(): libD.Set;
    addTransition(start: any, symbol: any, stackSymbol: any, end: any, newStackSymbol: any);
}
