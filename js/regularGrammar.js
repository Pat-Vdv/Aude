//Class to handle a right linear grammar
(function (pkg, that) {
    "use strict";

    pkg.rightLinearGrammar = function (terminalSymbols,nonTerminalSymbols,startSymbol,productionRules) {

        this.terminalSymbols = aude.toSet(terminalSymbols);
        this.nonTerminalSymbols = aude.toSet(nonTerminalSymbols);
        this.startSymbol = startSymbol;
        this.productionRules =  aude.toSet(productionRules) || new Set();
    };

    pkg.rightLinearGrammar.prototype = {
        //Add a terminal symbol
        addTerminalSymbol : function (symbol) {
            if (!this.terminalSymbols.has(symbol))
                this.terminalSymbols.add(symbol);
        },

        //Remove the terminal symbol
        removeTerminalSymbol : function (symbol) {
            this.terminalSymbols.remove(symbol);
            for (var r of this.productionRules) { //Delete all the rule where the symbols was
                for (var c of r.listSymbolTerminal) {
                    if (c===symbol)
                        this.removeRule(r);
                }
            }
        },

        //Return the set of terminal symbols
        getTerminalSymbols : function () {
            return this.terminalSymbols;
        },

        //Return true if the symbol is present in the set terminalSymbols
        hasTerminalSymbols : function (symbol) {
                return this.terminalSymbols.has(symbol);
        },

        //Add a non terminal symbol
        addNonTerminalSymbol : function (symbol) {
            if (!this.nonTerminalSymbols.has(symbol))
                this.nonTerminalSymbols.add(symbol);
        },

        //Remove the non terminal symbol
        removeNonTerminalSymbols : function (symbol) {
            this.nonTerminalSymbols.remove(symbol);
            for (var r of this.productionRules) { //Delete all the rule where the symbols was
                if (r.nonTerminalSymbol===symbol || r.nonTerminalSymbolBody===symbol)
                    this.removeRule(r);
            }
        },

        //Return the set of non terminal symbols
        getNonTerminalSymbols : function () {
            return this.nonTerminalSymbols;
        },

        hasNonTerminalSymbols : function (symbol) {
                return this.nonTerminalSymbols.has(symbol);
        },

        //Set the start symbol
        setStartSymbol : function (symbol) {
            this.startSymbol=symbol;
            this.addNonTerminalSymbol(symbol);
        },

        //Set the start symbol
        setAxiom : function (symbol) {
            this.setStartSymbol(symbol);
        },

        //Return the start symbol
        getStartSymbol : function () {
            return this.startSymbol;
        },

        //Add a rule to the production rule
        //
        //Ex: to add S -> aS, .addRule("S","a","S")
        //Ex: to add S -> abS, .addRule("S","ab","S") or .addRule("S",["a","b"],"S")
        addRule : function (nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody) {
            if (!nonTerminalSymbol && nonTerminalSymbol!="" )
                this.addNonTerminalSymbol(nonTerminalSymbol);
            if (!nonTerminalSymbolBody && nonTerminalSymbolBody!="" )
                this.addNonTerminalSymbol(nonTerminalSymbolBody);
            if (nonTerminalSymbol instanceof Rule)
                this.productionRules.add(nonTerminalSymbol);
            else
                this.productionRules.add(new pkg.Rule(nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody));
        },

        //Return the production rules
        getProductionRules : function () {
            return this.productionRules;
        },

        //Remove a rule
        removeRule : function (nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody) {
            if (nonTerminalSymbol instanceof Rule)
                this.productionRules.remove(nonTerminalSymbol);
            else
                this.productionRules.remove(new pkg.Rule(nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody));
        },

        //Return true if the given Rule is present
        hasRule : function (nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody) {
            if (nonTerminalSymbol instanceof Rule)
                this.productionRules.has(nonTerminalSymbol);
            else
                this.productionRules.hasRule(new pkg.Rule(nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody));
        },

        //Return a string format of the grammar
        toString : function () {
            var i=1;
            var rules="";
            for (var r of this.productionRules) {
                if (i==this.productionRules.size)
                    rules += r.toString();
                else
                    rules += r.toString()+",";
                i++;
            }
            return "(" +this.terminalSymbols+","+this.nonTerminalSymbols+","+this.startSymbol+"," + "{"+ rules+ "})";
            ;
        },



    };

// Class to handle rules use in grammar
    pkg.Rule = function(nonTerminalSymbol,listSymbolTerminal,nonTerminalSymbolBody) {
        this.nonTerminalSymbol = nonTerminalSymbol;
        this.listSymbolTerminal = listSymbolTerminal;
        this.nonTerminalSymbolBody = nonTerminalSymbolBody;
    }

    pkg.Rule.prototype = {
        //Return a string format of the rule
        toString : function () {
            return this.nonTerminalSymbol +" -> "+this.listSymbolTerminal+this.nonTerminalSymbolBody;
        },

    }


}(typeof this.exports === "object" ? this.exports : this, typeof this.exports === "object" ? this.exports : this));

(function (pkg) {
    pkg.str2LRG = function (grammar) {
        return string2RightLinearGrammar(grammar);
    };

    pkg.string2RightLinearGrammar = function (grammar) {
        var G = new rightLinearGrammar();
        var i = 0;
        var c = grammar[i]; //the current caracter to analyse

        if (c==="(")
            nextC();
        recSymTer();
        recComma();
        recSymNoTer();
        recComma();
        recAxiome();
        recComma();
        recProductionRules();
        if (c===")")
            nextC();


        //Reconnait les symboles terminaux
        function recSymTer () {
            if (c === '{') {
                nextC();
                recList("ter");
                if (c === '}')
                    nextC();
                else
                    throw "Erreur Symter";
            }
            else
                nextC();
        }

        //Reconnait les symboles non terminaux
        function recSymNoTer () {
            if (c = '{') {
                nextC();
                recList("nonTer");
                if (c === '}')
                    nextC();
                else
                    throw "Erreur Symter";
            }
            else
                nextC();

        }

        //Reconnait une liste : a,b...
        function recList (list) {
            if (/[^{}(), ]/.test(c)) {
                if (list === "nonTer")
                    G.addNonTerminalSymbol(c);
                else if (list === "ter")
                    G.addTerminalSymbol(c);
                nextC();
                if (c===',') {
                    nextC ();
                    recList (list);
                }
            }
        }

        //Reconnait l'axiome
        function recAxiome () {
            if (G.hasNonTerminalSymbols(c))  {
                G.setStartSymbol(c);
                nextC();
            }
            else
                throw "Axiome doit faire partie des symboles non terminaux: "+c ;
        }

        //Reconnait les règles de production
        function recProductionRules () {
            if (c === '{') {
                nextC();
                recListRules();
                if (c = '}')
                    nextC();
                else
                    throw "Erreur recProductionRules: attend } et le caractère est "+c;
            }
            else
                throw "Erreur recProductionRules: attend {";
            }

        //Reconnait une liste de regles de production
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
        //Reconnait une regle de production
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
                        ter = recListTerminalSymbol();
                        nonTerBody = recNonTerminalSymbol();
                        G.addRule(nonTer,ter,nonTerBody);
                        }
                    else
                        throw "Erreur recRules: attend un >";
                }
                else
                    throw "Erreur recRules: attend un -";
            }
            else
                throw "Erreur recRules: attend un symbole non Terminal c= "+c;
        }

        //Reconnait une suite de symboles terminaux
        function recListTerminalSymbol() {
            let str = "";
            while (G.hasTerminalSymbols(c) || c==="ε" || c==="\e") {
                str += c;
                nextC();
            }
            return str;
        }

        //Reconnait une suite de symboles terminaux
        function recNonTerminalSymbol() {
            var str = "";
            if (G.hasNonTerminalSymbols(c)) {
                str = c;
                nextC();
            }
            return str;
        }

        //Reconnait une virgule
        function recComma () {
            if (c === ',')
                nextC();
            else
                throw "Erreur: attend un virgule";
        }

        function nextC () {
            do {
                i++;
                c = grammar[i];
            }
            while (c === ' ');
        }
        return G;
    };

}(typeof this.exports === "object" ? this.exports : this));