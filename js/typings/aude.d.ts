/// <reference path="automaton.d.ts"/>
declare var aude: any;

interface Window {
  AudeGUI: {
    automatonFileInput: any,
    l10n: (txt: string) => string,
    audeExam: boolean,
    Runtime: {
        loadIncludes: (includes: Array<any>, callback: Function) => void;
    },
    Quiz: {
      textFormat: (text: string | Array<string>, node?: HTMLElement, html?: boolean) => HTMLElement;
    }
    QuestionList: any

    notify: (title: string, content: string, type?: string, time?: number) => void;
    viz: (code: string, callback: (res: string) => void) => void;
  };
}

declare var audescript: {
    m: (moduleName: string, newModule?: boolean) => any;
};


declare class AudeDesigner {
  constructor(svgContainer: HTMLElement, readOnly?: boolean);

  setAutomatonCode: (automaton: string, index?: any) => void;
  getAutomaton: (index: number, onlyStrings?: boolean) => Automaton;
  autoCenterZoom: () => void;
  redraw: () => void;
  getDot: () => string;
  setSVG: (svg?: string, index?: number, dontSnapshot?: boolean) => void;
}