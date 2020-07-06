declare var aude: any;

declare class Heap extends Array {
    top(): any
}

interface Window {
  Hammer: any;

  svg2automaton(svg: string): Automaton;
  automatonFromObj(obj: any): Automaton;
  pushSymbol(symbols: string, stack: string[]); // FIXME put in a namespace specific to pushdown automata
  heap(l: any[]): Heap;
  Module: any;
  audeExam: boolean;
  Viz?: Viz;
}

declare var audescript: {
  m: (moduleName: string, newModule?: boolean) => any;
  toJS: (str: string, moduleName?: any, fName?: any) => any;
};

declare function automaton2svg(A: Automaton, callback: (result: string) => void): void;

declare function automaton2dot(A: Automaton): string;

declare class AudeDesigner {
  constructor(svgContainer: HTMLElement, readOnly?: boolean);

  currentIndex: number;
  svgContainer: SVGElement;
  setViewBoxSize: () => void;
  static getValueFunction: (s: string) => any; 
  static getStringValueFunction: (s: string) => string; 
  newAutomaton: (index: number) => void;
  removeAutomaton: (index: number) => void;
  setAutomatonCode: (automaton: string, index?: any) => void;
  getAutomatonCode: (index?: any, withoutSVG?: boolean) => string;
  setCurrentIndex: (index: number) => void;
  clearSVG(index, dontSnapshot): void;
  getAutomaton: (index: number, onlyStrings?: boolean) => Automaton;
  transitionPulseColor(index?: number, startState?, symbol?, endState?, color?: string, pulseTime?: number): void;
  autoCenterZoom: () => void;
  enable(): void;
  redraw: () => void;
  getDot: () => string;
  getSVG(index?: number, dontCleanColors?: boolean): string;
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
    isAcceptingState(): boolean;
    setCurrentState(state: any);
    setInitialStackSymbol(symbol: any);
    setFinalState(state: any);
    getCurrentStates(): libD.Set;
    getCurrentStatesStacks(): libD.Set;
    getInitialStackSymbol(): any;
    getFinalStates(): libD.Set;
    getTransitions(): libD.Set;
    getLastTakenTransitions(): libD.Set;
    addTransition(start: any, symbol: any, stackSymbol: any, end: any, newStackSymbol: any);
}

declare class Viz {
  renderString(code: string): Promise<string>
}