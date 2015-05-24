Set.prototype.iterator =  function () {
    for (var i in this.l) {
        yield this.l[i];
    }
};

try {
    eval("\
        (function () {\
            var symbol;\
            try { symbol = Symbol.iterator; }\
            catch (e) { symbol = '@@iterator'; }\
            Set.prototype[symbol] = function*() {\
                for(var i in this.l) {\
                    if (this.l.hasOwnProperty(i)) {\
                        yield this.l[i];\
                    }\
                }\
            };\
        })();\
    ");
} catch (e) {}
