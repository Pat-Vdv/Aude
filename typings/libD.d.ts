declare namespace libD {
  export var none: (e?: Event) => boolean;
  export var wm: any;
  export var lang: string;

  // TODO : Find more precise typings.
  export var jsLoad: any;
  export var moduleLoaded: any;
  
  export class Set extends window.Set {
    constructor(values?: Iterable<any>);
    delete(v: any): boolean;
    unionInPlace(set: Iterable<any>): libD.Set;
    interInPlace(set: Iterable<any>): libD.Set;
    minusInPlace(set: Iterable<any>): libD.Set;
    minus(set: Iterable<any>): libD.Set;
    inter(set: Iterable<any>): libD.Set;
    union(set: Iterable<any>): libD.Set;
    cross(set: Iterable<any>): libD.Set;
    subsetOf(set: Iterable<any>): libD.Set;
    symDiff(set: Iterable<any>): libD.Set;
    plus(...args: any[]): libD.Set;
    powerSet(): libD.Set;
    getList(): Array<any>;
    getSortedList(): Array<any>;
    toString(): string;
    every(func: (e: any) => boolean): boolean;
    some(func: (e: any) => boolean): boolean;
    copy(): libD.Set;
    getItem(): any;
    card(): number;

    remove(v: any): void;
    size: number;
  }

  export class Tuple {
    constructor();
    fromList(l: Iterable<any>): Tuple;
    flattenList(l: Iterable<any>): Tuple;
    item(i: number): any;
    setItem(i: number, e: any, noCheckLength?: boolean): Tuple;
    push(e: any): Tuple;
    checkCoupleToTuple(): void;
    asCouple(): Array<any>;
    getList(): Array<any>;
    toString(): string;
    [Symbol.iterator](): Iterator<any>;
  }

  export function format(fmt: string, ...args: any[]): string;

  export class WSwin {
    setPosFromDOM(): void;
    init(): void;
    show(focus?: boolean): void;
    reallyClose(): void;
    close (closeStage?: 0 | 1 | 2): void;
    setPreventClosing(f: any): void;
    setFullscreen(b?: boolean): void;
    focus(): void;
    toBeneath(): void;
    minimize(): void;
    maximize(side? : "width" | "height"): void;
    restore(): void;
    resize(): void;
    setDecoration(b: boolean): void;
    setTop(n: any): void;

    ws: any;
  }

  export function newWin(o?: {
    minWidth?: number | string,
    width?: number | string,
    maxWidth?: number | string,
    minHeight?: number | string,
    height? : number | string,
    maxHeight?: number | string,
    show?: boolean,
    title?: string,
    content?: Node,
    minimize?: boolean,
    focus?: boolean,
    top?: any,
    right?: any,
    bottom?: any,
    left?: any,
    preferRelative?: boolean,
    xPreferRelative?: boolean,
    yPreferRelative?: boolean,
    closable?: boolean,
    resizable?: boolean,
    minimizable?: boolean,
    maximizable?: boolean,
    decoration?: boolean,
    sticky?: boolean,
    iconifiable?: boolean,
    fullscreen?: boolean,
    type?: "normal" | "panel" | "dialog" | "tooltip" | "popup-menu" | "splash"
  }): WSwin;

  export function jso2dom(o: any, refs?: any, parent?: Node, childrenListing?: any): HTMLElement;

  export function getIcon(icon: string, iconSize?: string, iconPack?: string, iconExtension?: string): string;
  export function b64EncodeUnicode(s: string): string;
  export function b64DecodeUnicode(s: string): string;

  export function l10n(): (s: string) => string;
  export var need: any;
  export var notify: any;
}
