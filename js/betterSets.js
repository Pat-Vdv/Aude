/*
 * This file implements all the new operations added
 * to the standard sets.
 * It is Javascript since you cannot add members to another
 * class in Typescript.
 */
Set.prototype.minusInPlace = function(other) {
  for (let i of other) {
    this.delete(i);
  }
  return this;
}

Set.prototype.minus = function(other) {
  return new Set(this).minusInPlace(other);
}

Set.prototype.unionInPlace = function(other) {
  for (let i of other) {
    this.add(i);
  }
  return this;
}

Set.prototype.union = function(other) {
  return new Set(this).unionInPlace(other);
}

Set.prototype.interInPlace = function(other) {
  if (!(other instanceof Set)) {
    other = new Set(other);
  }

  for (let v of this) {
    if (!other.has(v)) {
      this.delete(v);
    }
  }

  return this
}

Set.prototype.inter = function(other) {
  return new Set(this).interInPlace(other);
}

Set.prototype.cross = function(other) {
  let res = new Set();

  for (let x of this) {
    for (let y of other) {
      res.add([x, y]);
    }
  }

  return res;
}

Set.prototype.remove = Set.prototype.delete;

Set.prototype.isSubsetOf = function (other) {
  for (let i of this) {
    if (!other.has(i)) {
      return false;
    }
  }
  return true;
}

Set.prototype.symDiff = function(other) {
  if (!(other instanceof Set)) {
    other = new Set(other);
  }

  let diff = new Set();

  for (let e of this) {
    if (!other.has(e)) {
      diff.add(e);
    }
  }

  for (let e of other) {
    if (!this.has(e)) {
      diff.add(e);
    }
  }

  return diff;
}

Set.prototype.getAnyItem = function() { for (let v of this) { return v; } }
Set.prototype.card = function() { return this.size; }