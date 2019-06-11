declare namespace libD {
  export interface Set {
    unionInPlace(set: Iterable<any>): libD.Set;
    minusInPlace(set: Iterable<any>): libD.Set;
    add(v: any): void;
    has(v: any): boolean;
    delete(v: any): boolean;
    remove(v: any): boolean;
    [Symbol.iterator](): Iterator<any>;
  }
}

declare var libD: any;