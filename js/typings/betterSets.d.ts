/** This file exposes the betterSets.js additions in Typescript. */
declare interface Set<T> {
  minusInPlace(other: Iterable<T>): Set<T>;
  minus(other: Iterable<T>): Set<T>;

  unionInPlace(other: Iterable<T>): Set<T>;
  union(other: Iterable<T>): Set<T>;

  interInPlace(other: Iterable<T>): Set<T>;
  inter(other: Iterable<T>): Set<T>;

  cross(other: Iterable<T>): Set<[T, T]>;

  remove(e: T): boolean;

  isSubsetOf(other: Iterable<T>): boolean;

  symDiff(other: Iterable<T>): Set<T>;

  getAnyItem(): T;
  card(): number;
}