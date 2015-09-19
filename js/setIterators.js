if (typeof Symbol === "undefined") {
    try {
        eval("\
            Set.prototype.iterator =  function () {\
                for (var i in this.l) {\
                    yield this.l[i];\
                }\
            };\
            Tuple.prototype.iterator =  function () {\
                for (var i = 0; i < this.length; i++) {\
                    yield this[i];\
                }\
            };\
            Object.prototype.iterator = function () {\
                for (var i in this) {\
                    if (this.hasOwnProperty(i)) {\
                        yield new Tuple().fromList(i, this[i]);\
                    }\
                }\
            }\
        ");
    } catch (e) {}
}

try {
    eval("\
        (function () {\
            var symbol;\
            try { symbol = Symbol.iterator; }\
            catch (e) { symbol = '@@iterator'; }\
            Set.prototype[symbol] = function*() {\
                for (var i in this.l) {\
                    if (this.l.hasOwnProperty(i)) {\
                        yield this.l[i];\
                    }\
                }\
            };\
            Tuple.prototype[symbol] = function*() {\
                for (var i = 0; i < this.length; i++) {\
                    yield this[i];\
                }\
            };\
            Object.prototype[symbol] = function*() {\
                for (var i in this) {\
                    if (this.hasOwnProperty(i)) {\
                        yield new Tuple().fromList([i, this[i]]);\
                    }\
                }\
            }\
        })();\
    ");
} catch (e) {}
