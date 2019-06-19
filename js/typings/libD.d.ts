declare namespace libD {
  
  export class Set {
    constructor(values?: Iterable<any>);
    add(v: any): void;
    delete(v: any): boolean;
    clear(): void;
    has(v: any): boolean;
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
    [Symbol.iterator](): Iterator<any>;
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

  export interface WSwin {
    show(focus?: boolean): void;
    close (closeStage?: number): void;

    ws: any;
  }
  export function newWin(o: any): WSwin;

  export function jso2dom(o: any, refs?: any, parent?: Node, childrenListing?: any): HTMLElement;
}