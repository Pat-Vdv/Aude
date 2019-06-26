/// <reference path="automaton.d.ts"/>
declare var aude: any;

interface Window {
  AudeGUI: {
    automatonFileInput: any,
    mainDesigner: AudeDesigner,
    Results: AudeDesigner,
    l10n: (txt: string) => string,
    audeExam: boolean,
    Runtime: {
        loadIncludes: (includes: Array<any>, callback: Function) => void;
    },
    Quiz: any,
    QuestionList: any

    removeCurrentAutomaton();

    getCurrentMode(): string;
    setCurrentMode(mode: string): void;

    addAutomaton(): void;

    notify(title: string, content: string, type?: string, time?: number): void;
    viz(code: string, callback: (res: string) => void): void;
  };

  svg2automaton(svg: string): Automaton;
}

declare var audescript: {
    m: (moduleName: string, newModule?: boolean) => any;
    toJS: (str, moduleName?, fname?) => any;
};

declare function automaton2svg(A: Automaton, callback: (result: string) => void): void;

declare class AudeDesigner {
  constructor(svgContainer: HTMLElement, readOnly?: boolean);

  currentIndex: number;

  setAutomatonCode: (automaton: string, index?: any) => void;
  getAutomaton: (index: number, onlyStrings?: boolean) => Automaton;
  autoCenterZoom: () => void;
  redraw: () => void;
  getDot: () => string;
  getSVG(index?: number): string;
  setSVG: (svg?: string, index?: number, dontSnapshot?: boolean) => void;
  static initiateNewState(): void;
}