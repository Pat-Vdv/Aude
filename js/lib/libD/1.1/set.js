/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

/*
    Copyright (c) 2013, Raphaël Jakse (Université Joseph Fourier)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Université Joseph Fourier nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint nomen: true, plusplus: true, indent:4 */
/*eslint no-console:0*/
/*global console:0*/

/**
 * @author  Raphaël Jakse
 * @file This is a library for manipulating mathematical sets.
 * @note Any function of this package that takes a Set also accepts any object that can be turned into a set (e.g. Object, Array variables).
 * @version 0.1a
 */

(function (pkg) {
    "use strict";

    function listToString(l) {
        let res = "";

        for (let v of l) {
            if (res) {
                res += ",";
            }

            res += pkg.elementToString(v);
        }

        if (l instanceof PkgTuple) {
            if (l.length === 1) {
                return res;
            }

            return "(" + res + ")";
        }

        return "[" + res + "]";
    }

    pkg.elementToString = function (e, map) {
        if (typeof e === "number" && isNaN(e)) {
            return "NaN";
        }

        switch (e) {
        case undefined:
            return "undefined";
        case null:
            return "null";
        case -Infinity:
            return "-Infinity";
        case Infinity:
            return "Infinity";
        default:
            if (e instanceof Array || e instanceof PkgTuple) {
                return listToString(e);
            }

            if (typeof e === "string") {
                if (!e.length || /["'\\{\[\]}\(\),\s]/.test(e) || parseFloat(e).toString() === e || (typeof map === "object" && map.hasOwnProperty(e))) {
                    e = JSON.stringify(e);
                }
                return e.toString();
            }

            if (e instanceof Date) {
                return "Date(\"" + e.toString() + "\")";
            }


            if (typeof e === "object") {
                if (e instanceof Object) {
                    if (e.serializeElement) {
                        return e.serializeElement();
                    }

                    if (e.toJSON) {
                        return JSON.stringify(e);
                    }
                }

                var i, res = "", keys = Object.keys(e).sort();
                for (i in keys) {
                    if (res) {
                        res += ",";
                    } else {
                        res = "{";
                    }

                    res += JSON.stringify(keys[i]) + ":" + pkg.elementToString(e[keys[i]]);
                }
                return res ? res + "}" : "Object()";
            }

            return e.toString();
        }
    }

    class PkgMap extends Map {
        constructor(keyValueIterable) {
            super();

            this.keyStringToKeyObject = Object.create(null);

            if (keyValueIterable) {
                for (let [k, v] of keyValueIterable) {
                    this.set(k, v);
                }
            }
        }

        set(key, value) {
            let keyString = pkg.elementToString(key);

            if (keyString in this.keyStringToKeyObject) {
                key = this.keyStringToKeyObject[keyString];
            } else {
                this.keyStringToKeyObject[keyString] = key;
            }

            super.set(key, value);
        }

        get(key) {
            let keyString = pkg.elementToString(key);

            if (keyString in this.keyStringToKeyObject) {
                return super.get(this.keyStringToKeyObject[keyString]);
            }

            return undefined;
        }

        has(key) {
            return pkg.elementToString(key) in this.keyStringToKeyObject
        }

        delete(key) {
            let keyString = pkg.elementToString(key);

            if (keyString in this.keyStringToKeyObject) {
                key = this.keyStringToKeyObject[keyString];
                delete this.keyStringToKeyObject[keyString];
                super.delete(key);
                return true;
            }

            return false;
        }

        clear() {
            this.keyStringToKeyObject = Object.create(null);
            super.clear();
        }
    }

    PkgMap.prototype.contains = PkgMap.prototype.has;
    PkgMap.prototype.remove = PkgMap.prototype.delete;
    PkgMap.prototype.empty = PkgMap.prototype.clear;
    PkgMap.prototype.serializeElement = PkgMap.prototype.toString;

    class PkgSet extends Set {
        constructor(values) {
            super();
            this.valStringToValObject = Object.create(null);

            if (values) {
                for (let v of values) {
                    this.add(v);
                }
            }
        }

        add(v) {
            let valString = pkg.elementToString(v);

            if (valString in this.valStringToValObject) {
                return;
            }

            this.valStringToValObject[valString] = v;

            super.add(v);
        }

        delete(v) {
            let valString = pkg.elementToString(v);

            if (!(valString in this.valStringToValObject)) {
                return false;
            }

            super.delete(this.valStringToValObject[valString]);
            delete this.valStringToValObject[valString];

            return true;
        }

        clear() {
            this.valStringToValObject = Object.create(null);
            super.clear();
        }

        has(v) {
            return pkg.elementToString(v) in this.valStringToValObject;
        }

        unionInPlace(set) {
            for (let v of set) {
                this.add(v);
            }

            return this;
        }

        interInPlace(set) {
            if (!(set instanceof PkgSet)) {
                set = new PkgSet(set);
            }

            for (let v of this) {
                if (!set.has(v)) {
                    this.delete(v);
                }
            }

            return this;
        }

        minusInPlace(set) {
            for (let v of set) {
                this.delete(v);
            }

            return this;
        }

        minus(set) {
            return new PkgSet(this).minusInPlace(set);
        }

        inter(set) {
            return new PkgSet(this).interInPlace(set);
        }

        union(set) {
            return new PkgSet(this).unionInPlace(set);
        }

        cross(set) {
            var res = new PkgSet();

            for (let v1 of this) {
                for (let v2 of set) {
                    res.add((new PkgTuple()).fromList([v1, v2]));
                }
            }

            return res;
        }

        subsetOf (set) {
            if (!(set instanceof PkgSet)) {
                set = new PkgSet(set);
            }

            for (let v of this) {
                if (!set.has(v)) {
                    return false;
                }
            }

            return true;
        }

        symDiff(set) {
            let r = new pkg.Set();

            if (!(set instanceof PkgSet)) {
                set = new PkgSet(set);
            }

            for (let v of this) {
                if (!set.has(v)) {
                    r.add(v);
                }
            }

            for (let v of set) {
                if (!this.has(v)) {
                    r.add(v);
                }
            }

            return r;
        }

        plus(...args) {
            r = new PkgSet(this);
            r.unionInPlace(args);
            return r;
        }

        powerset() {
            if (this.size === 0) {
                return new PkgSet([new PkgSet()]);
            }

            let lastE, Complement = new PkgSet();

            for (let v of this) {
                Complement.add(v);
                lastE = v;
            }

            Complement.remove(lastE);

            let PCompl = Complement.powerset();
            let U = new pkg.Set();

            for (let underset of PCompl) {
                U.add(underset.plus(lastE));
            }

            return PCompl.union(U);
        }

        // DEPRECATED. Use Array.from(set)
        getList() {
            return Array.from(this);
        }

        getSortedList() {
            return Array.from(this).sort(
                function sort(a, b) {
                    // FIXME continue
                    if (typeof a === "number") {
                        if (typeof b === "number") {
                            return a - b;
                        }
                        return 1;
                    }

                    if (typeof b === "number") {
                        return -1;
                    }

                    return pkg.elementToString(a) > pkg.elementToString(b);
                }
            );
        }

        toString() {
            return this.size ? "{" + this.getSortedList().join(",") + "}" : "∅";
        }

        every(func) {
            for (v of this) {
                if (!func(this.l[i])) {
                    return false;
                }
            }

            return true;
        }

        some(func) {
            for (v of this) {
                if (func(this.l[i])) {
                    return true;
                }
            }
            return false;
        }

        copy() {
            return new PkgSet(this);
        }

        getItem() {
            for (let v of this) {
                return v;
            }
        }

        card() {
            return this.size;
        }
    }

    PkgSet.prototype.contains = PkgSet.prototype.has;
    PkgSet.prototype.remove = PkgSet.prototype.delete;
    PkgSet.prototype.empty = PkgSet.prototype.clear;
    PkgSet.prototype.serializeElement = PkgSet.prototype.toString;

    function PkgTuple() {
        var length = 0;
        Object.defineProperty(this, "length", {
            enumerable: false,
            configurable: false,
            get : function () {
                return length;
            },
            set : function (v) {
                if (v < length) {
                    while (length > v) {
                        delete this[length - 1];
                        --length;
                    }
                } else if (v > length) {
                    this.setItem(length, undefined, true);
                    ++length;
                }
            }

        });
    };

    Object.defineProperties(PkgTuple.prototype, {
        fromList: {
            enumerable:false,
            value: function (l) {
                this.blockCheckCoupleToTuple = true;
                var i, len;
                for (i = 0, len = l.length; i < len; ++i) {
                    this.push(l[i]);
                }
                this.blockCheckCoupleToTuple = false;
                this.checkCoupleToTuple();
                return this;
            }
        },

        flattenList: {
            enumerable:false,
            value: function (l) {
                var cur = 0, th = this;
                function add(e) {
                    if (e instanceof PkgTuple || e instanceof Array) {
                        var i, len;
                        for (i = 0, len = e.length; i < len; ++i) {
                            add(e[i]);
                        }
                    } else {
                        th.setItem(cur, e);
                        ++cur;
                    }
                }
                add(l);
                return this;
            }
        },

        item: {
            enumerable:false,
            value: function (i) {
                return this[i];
            }
        },

        setItem: {
            enumerable:false,
            value: function (i, e, noCheckLength) {
                if (!noCheckLength && this.length <= i) {
                    while (this.length <= i) {
                        this.length = i + 1;
                    }
                }
                Object.defineProperty(this, i, {
                    enumerable:true,
                    configurable:true,
                    get : function () {
                        return e;
                    },

                    set : function (nv) {
                        e = nv;
                        this.checkCoupleToTuple();
                    }
                });
                this.checkCoupleToTuple();
                return this;
            }
        },

        push: {
            enumerable:false,
            value: function (e) {
                this.setItem(this.length, e);
                this.checkCoupleToTuple();
                return this;
            }
        },

        checkCoupleToTuple: {
            enumerable:false,
            value: function () {
                if (!this.blockCheckCoupleToTuple) {
                    this.blockCheckCoupleToTuple = true;
                    if (this.length !== 2 || !(this[0] instanceof PkgTuple)) {
                        return;
                    }

                    var lastItem = this[1], t = this[0];
                    this.length = 0;

                    var i, len;
                    for (i = 0, len = t.length; i < len; ++i) {
                        this.setItem(i, t[i]);
                    }

                    this.push(lastItem);
                    delete this.blockCheckCoupleToTuple;
                    this.checkCoupleToTuple();
                }
            }
        },

        asCouple: {
            enumerable:false,
            value: function () {
                switch (this.length) {
                case 0:
                    return [];
                case 1:
                    return [
                        this[0]
                    ];
                case 2:
                    return [
                        this[0],
                        this[1]
                    ];
                default:
                    return [
                        PkgTuple(Array.prototype.slice.call(this, 0, this.length - 1)),
                        this[this.length - 1]
                    ];
                }
            }
        },

        getList: {
            enumerable:false,
            value: function () {
                var i, l = [];
                l.length = this.length;
                for (i = 0; i <  this.length; ++i) {
                    l[i] = this[i];
                }
                return i;
            }
        },

        toString: {
            enumerable:false,
            value: function () {
                return pkg.elementToString(this);
            }
        }
    });

    PkgTuple.prototype[Symbol.iterator] = function*() {
        for (var i = 0; i < this.length; i++) {
            yield this[i];
        }
    };

    pkg.Tuple = PkgTuple;
    pkg.Set = PkgSet;
    pkg.Map = PkgMap;

    pkg.toSet = function (iterable) {
        if (!(iterable instanceof PkgSet)) {
            return new PkgSet(iterable);
        }
    }

    if (pkg.moduleLoaded) {
        pkg.moduleLoaded("set");
    }

}(this.libD || (this.libD = {}), this));
