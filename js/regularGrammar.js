// Class to handle a right linear grammar
(function (pkg, that) {
    "use strict";

    pkg.linearGrammar = function (terminalSymbols,nonTerminalSymbols,startSymbol,productionRules) {
        this.terminalSymbols    = aude.toSet(terminalSymbols)    || new Set();
        this.nonTerminalSymbols = aude.toSet(nonTerminalSymbols) || new Set();
        this.startSymbol        = startSymbol;
        this.productionRules    = aude.toSet(productionRules)    || new Set();
    };

    pkg.linearGrammar.prototype = {
        // Add a terminal symbol
        addTerminalSymbol: function (symbol) {
            if (!this.terminalSymbols.has(symbol)) {
                this.terminalSymbols.add(symbol);
            }
        },

        // Remove the terminal symbol
        removeTerminalSymbol: function (symbol) {
            this.terminalSymbols.remove(symbol);
            for (var r of this.productionRules) {
                // Delete all the rule where the symbols was
                for (var c of r.listSymbolTerminal) {
                    if (c === symbol) {
                        this.removeRule(r);
                    }
                }
            }
        },

        // Return the set of terminal symbols
        getTerminalSymbols: function () {
            return this.terminalSymbols;
        },

        // Return true if the symbol is present in the set terminalSymbols
        hasTerminalSymbols: function (symbol) {
                return this.terminalSymbols.has(symbol);
        },

        // Add a non terminal symbol
        addNonTerminalSymbol: function (symbol) {
            if (!this.nonTerminalSymbols.has(symbol))
                this.nonTerminalSymbols.add(symbol);
        },

        // Remove the non terminal symbol
        removeNonTerminalSymbols: function (symbol) {
            this.nonTerminalSymbols.remove(symbol);
            for (var r of this.productionRules) {
                // Delete all the rule where the symbols was
                if (r.nonTerminalSymbol === symbol || r.nonTerminalSymbolBody === symbol) {
                    this.removeRule(r);
                }
            }
        },

        // Return the set of non terminal symbols
        getNonTerminalSymbols: function () {
            return this.nonTerminalSymbols;
        },

        hasNonTerminalSymbols: function (symbol) {
                return this.nonTerminalSymbols.has(symbol);
        },

        // Set the start symbol
        setStartSymbol: function (symbol) {
            this.startSymbol = symbol;
            this.addNonTerminalSymbol(symbol);
        },

        // Set the start symbol
        setAxiom: function (symbol) {
            this.setStartSymbol(symbol);
        },

        // Return the start symbol
        getStartSymbol: function () {
            return this.startSymbol;
        },

        // Add a rule to the production rule
        //
        // side: left or right, if not specified right by default
        // Ex: to add S -> aS, .addRule("S","a","S","right")
        // Ex: to add S -> abS, .addRule("S","ab","S","right")
        // Ex: to add S -> Sa, .addRule("S","a","S","left". WARNING: same order of parameter as the right side
        // Ex: to add S -> Sab, .addRule("S","ab","S","left")
        addRule: function (nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody,side) {
            if (nonTerminalSymbol !== undefined && nonTerminalSymbol !== "") {
                this.addNonTerminalSymbol(nonTerminalSymbol);
            } else if (nonTerminalSymbolBody !== undefined && nonTerminalSymbolBody !== "") {
                this.addNonTerminalSymbol(nonTerminalSymbolBody);
            } if (nonTerminalSymbol instanceof Rule) {
                this.productionRules.add(nonTerminalSymbol);
            } else {
                this.productionRules.add(
                    new pkg.Rule(
                        nonTerminalSymbol,
                        listSymbolTerminal,
                        nonTerminalSymbolBody,
                        side
                    )
                );
            }
        },

        // Return the production rules
        getProductionRules: function () {
            return this.productionRules;
        },

        // Remove a rule
        removeRule: function (nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody,side) {
            this.productionRules.remove(
                nonTerminalSymbol instanceof Rule
                    ? nonTerminalSymbol
                    : new pkg.Rule(
                        nonTerminalSymbol,
                        listSymbolTerminal,
                        nonTerminalSymbolBody,
                        side
                    )
            );
        },

        // Return true if the given Rule is present
        hasRule: function (nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody,side) {
            if (nonTerminalSymbol instanceof Rule) {
                this.productionRules.has(nonTerminalSymbol);
            } else {
                this.productionRules.hasRule(
                    new pkg.Rule(
                        nonTerminalSymbol,
                        listSymbolTerminal,
                        nonTerminalSymbolBody,
                        side
                    )
                );
            }
        },

        // Return a string format of the grammar
        toString: function () {
            var i = 1;
            var rules = "";

            for (var r of this.productionRules) {
                rules += r.toString();

                if (i < this.productionRules.size) {
                    rules += ",";
                }

                i++;
            }

            return (
                "(" +
                this.terminalSymbols    + "," +
                this.nonTerminalSymbols + "," +
                this.startSymbol        + "," + "{" + rules + "})"
            );
        },
    };

    // Class to handle rules use in grammar
    // side: right means that the rule is right linear
    // side: left means that the rule is left linear
    pkg.Rule = function(nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody,side) {
        this.nonTerminalSymbol     = nonTerminalSymbol;
        this.listSymbolTerminal    = listSymbolTerminal;
        this.nonTerminalSymbolBody = nonTerminalSymbolBody;

        this.side = (
            (side === undefined || side === "")
                ? "right"
                : side
        );
    };

    pkg.Rule.prototype = {
        // Return a string format of the rule
        toString: function () {
            var l = this.nonTerminalSymbol + " -> ";

            if (this.nonTerminalSymbolBody === undefined) {
                return l + this.listSymbolTerminal;
            }

            if (this.listSymbolTerminal === undefined) {
                return l + this.nonTerminalSymbolBody;
            }

            if (this.side === "right") {
                return l + this.listSymbolTerminal + this.nonTerminalSymbolBody;
            }

            return l + this.nonTerminalSymbolBody + this.listSymbolTerminal;
        },

        getNonTerminalSymbol: function () {
            return this.nonTerminalSymbol;
        },

        getNonTerminalSymbolBody: function () {
            return this.nonTerminalSymbolBody;
        },

        getListSymbolTerminal: function () {
            if (this.listSymbolTerminal === undefined || this.listSymbolTerminal === "") {
                return "??";
            }

            return this.listSymbolTerminal;
        },

        // Return the side of the rule
        getSide: function () {
            return this.side;
        }
    };
}(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this));


// To convert a string of a grammar to a grammar
// ({Terminal symbol},{Non terminal symbol},Start symbol,{Production rules})
// Ex ({a,b},{A,S,T},T,{A -> bS,S -> bS,A -> aA,T -> aA,S -> ??})
// Can't handle multi caracter name for terminal and non terminal symbol
(function (pkg) {
    pkg.string2LinearGrammar = function (grammar) {
        var G = new linearGrammar();
        var i = 0;

        // the current caracter to analyse
        var c = grammar[i];

        if (c==="(") {
            nextC();
        } else {
            throw new Error("Error: expected ( at char " + i);
        }

        recSym(true);
        recComma();
        recSym(false);
        recComma();
        recAxiome();
        recComma();
        recProductionRules();

        if (c === ")") {
            nextC();
        } else {
            throw new Error("Error: expected ) at char " + i);
        }

        // Recognize the (non-)terminal symbols
        function recSym(isTerminal) {
            if (c === '{') {
                nextC();
                recList(isTerminal ? "ter" : "nonTer");

                if (c === '}') {
                    nextC();
                } else {
                    throw new Error("Error terminal symbol at char " + i);
                }
            } else {
                nextC();
            }
        }

        // Recognize a list: a, b...
        function recList (list) {
            if (/[^{}(), ]/.test(c)) {
                if (list === "nonTer") {
                    G.addNonTerminalSymbol(c);
                } else if (list === "ter") {
                    G.addTerminalSymbol(c);
                }

                nextC();

                if (c===',') {
                    nextC ();
                    recList (list);
                }
            }
        }

        // Recognize the start symbol
        function recAxiome () {
            if (G.hasNonTerminalSymbols(c))  {
                G.setStartSymbol(c);
                nextC();
            } else {
                throw new Error("Axiom must be part of non-terminal symbols at char " + i);
            }
        }

        // Recognize the prodution rules
        function recProductionRules () {
            if (c === '{') {
                nextC();
                recListRules();
                if (c = '}') {
                    nextC();
                } else {
                    throw new Error("recProductionRules: expected } at char " + i);
                }
            } else {
                throw new Error("recProductionRules: expected { at char " + i);
            }
        }

        // Recognize a list of rules
        function recListRules () {
            recRules();
            if (c === ',') {
                nextC();
                recListRules();
            }
        }


        // nonTermSymbol -> nonTermSymbol
        // nonTermSymbol -> listTermSymbol
        // nonTermSymbol -> listTermSymbol nonTermSymbol
        // Recognize a rule
        function recRules () {
            var nonTer = "";
            var ter = "";
            var nonTerBody = "";
            if  (G.hasNonTerminalSymbols(c)) {
                nonTer = c;
                nextC();
                if (c === '-') {
                    nextC();
                    if (c === '>') {
                        nextC();
                        if (G.hasTerminalSymbols(c) || c === "??") {
                            // For right linear
                            ter = recListTerminalSymbol();
                            nonTerBody = recNonTerminalSymbol();
                            G.addRule(nonTer,ter,nonTerBody);
                        } else if (G.hasNonTerminalSymbols(c)) {
                            // For left linear
                            nonTerBody = recNonTerminalSymbol();
                            ter = recListTerminalSymbol();
                            G.addRule(nonTer,ter,nonTerBody,"left");
                        } else {
                            throw new Error("recRules: error at char " + i);
                        }
                    } else {
                        throw new Error("recRules: expected '>' at char " + i);
                    }
                } else {
                    throw new Error("recRules: expected '-' at char " + i);
                }
            } else {
                throw new Error("recRules: expected a non terminal symbol at char " + i);
            }
        }

        // Recognize a list terminal symbols
        function recListTerminalSymbol() {
            let str = "";
            while (G.hasTerminalSymbols(c) || c==="??") {
                str += c;
                nextC();
            }
            return str;
        }

        // Recognizea  non terminal symbols
        function recNonTerminalSymbol() {
            var str = "";
            if (G.hasNonTerminalSymbols(c)) {
                str = c;
                nextC();
            }
            return str;
        }

        // Recognize a coma
        function recComma () {
            if (c === ',') {
                nextC();
            } else {
                throw new Error("Expecting a comma at char " + i);
            }
        }

        // Next caracter of the string
        function nextC () {
            do {
                i++;
                c = grammar[i];
                if (c === "\\") {
                    i++;
                    c += grammar[i];
                    if (c === "\\e") {
                        c="??";
                    }
                }
            } while (c === ' ');
        }

        return G;
    };
}(typeof this.exports === "object" ? this.exports : this));
