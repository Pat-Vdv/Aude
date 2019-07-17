declare class Rule {
    constructor(nonTerminalSymbol: any, listSymbolTerminal: string, nonTerminalSymbolBody: string, side: "left" | "right");

    getNonTerminalSymbol(): any;
    getNonTerminalSymbolBody(): string;
    getListSymbolTerminal(): string;
    getSide(): "left" | "right";
    toString(): string;
}

declare class linearGrammar {
    constructor(terminalSymbols?: Iterable<any>,
        nonTerminalSymbols?: Iterable<any>,
        startSymbol?: any,
        productionRules?: libD.Set);

    addTerminalSymbol(symbol: any): void;
    removeTerminalSymbol(symbol: any): void;
    getTerminalSymbols(): libD.Set;
    hasTerminalSymbols(symbol: any): boolean;

    addNonTerminalSymbol(symbol: any): void;
    removeNonTerminalSymbols(symbol: any): void;
    getNonTerminalSymbols(): libD.Set;
    hasNonTerminalSymbols(symbol: any): boolean;

    setStartSymbol(symbol: any): void;
    setAxiom(symbol: any): void;
    getStartSymbol(): any;

    addRule(nonTerminalSymbol: any, listSymbolTerminal?: string, nonTerminalSymbolBody?: string, side?: "left" | "right"): void;
    getProductionRules(): libD.Set;
    removeRule(nonTerminalSymbol: any, listSymbolTerminal?: string, nonTerminalSymbolBody?: string, side?: "left" | "right"): void;
    hasRule(nonTerminalSymbol: any, listSymbolTerminal?: string, nonTerminalSymbolBody?: string, side?: "left" | "right"): boolean;
    
    toString(): string;
}

declare var string2LinearGrammar: (grammar: string) => linearGrammar;