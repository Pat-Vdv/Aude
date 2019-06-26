/**
 * Class that handles a grammar designer.
 * The grammar designer allows the user to create and edit a grammar
 * in a more convenient way than a basic textual syntax.
 */
class GrammarDesigner {
    _ = window.AudeGUI.l10n;

    currentGrammar: linearGrammar = new linearGrammar();

    containerDiv: HTMLElement;
    editable: boolean;

    terminalSymbolsDiv: HTMLElement;
    nonTerminalSymbolsDiv: HTMLElement;
    rulesList: HTMLOListElement;

    terminalEditSpan: HTMLElement;
    inputNonTerminal: HTMLInputElement;

    nonTerminalEditSpan: HTMLElement;
    inputTerminal: HTMLInputElement;

    selectStartSymbol: HTMLSelectElement;

    newRuleSpan: HTMLElement;
    selectNonTerminalNewRule: HTMLSelectElement;
    inputLeftTerminalNewRule: HTMLInputElement;
    inputNonTerminalNewRule: HTMLInputElement;
    inputRightTerminalNewRule: HTMLInputElement;

    constructor(designerDiv: HTMLElement, editable: boolean = true) {
        this.containerDiv = designerDiv;
        this.editable = editable;

        let refs = {
            terminalSymbolsDiv: <HTMLElement>null,
            terminalEditSpan: <HTMLElement>null,
            terminalInput: <HTMLInputElement>null,
            terminalAddButton: <HTMLButtonElement>null,
            terminalRemoveButton: <HTMLButtonElement>null,

            nonTerminalSymbolsDiv: <HTMLElement>null,
            nonTerminalEditSpan: <HTMLElement>null,
            nonTerminalInput: <HTMLInputElement>null,
            nonTerminalAddButton: <HTMLButtonElement>null,
            nonTerminalRemoveButton: <HTMLButtonElement>null,
        };

        // Initialize terminal symbols section.
        designerDiv.appendChild(libD.jso2dom(
            ["div#grammar-designer-terminal-div", [
                ["div.grammar-designer-section-title", this._("Terminal symbols")],
                ["span", { "#": "terminalEditSpan" }, [
                    ["input#grammar-designer-terminal-input", { "#": "terminalInput", "maxlength": "1", "placeholder": this._("Enter symbol here") }],
                    ["button#grammar-designer-add-terminal-button", { "#": "terminalAddButton" }, this._("Add")],
                    ["button#grammar-designer-remove-terminal-button", { "#": "terminalRemoveButton" }, this._("Remove")],
                ]],
                ["div#grammar-designer-terminal-contents", { "#": "terminalSymbolsDiv" }, "n o t h i n g h e r e y e t"]
            ]],
            refs
        ));
        this.terminalSymbolsDiv = refs.terminalSymbolsDiv;
        this.inputTerminal = refs.terminalInput;
        this.terminalEditSpan = refs.terminalEditSpan;

        this.inputTerminal.onkeyup = (e) => {
            if (e.keyCode === 13) {
                refs.terminalAddButton.click();
            }
        };

        refs.terminalAddButton.onclick = (e) => {
            let val = this.inputTerminal.value;
            if (val.trim().length === 0) {
                return;
            }

            this.inputTerminal.value = "";

            if (this.currentGrammar.hasNonTerminalSymbols(val)) {
                window.AudeGUI.notify(this._("Error !"),
                    this._("A symbol cannot be final and not final at the same time !"),
                    "error",
                    4000
                );

                return;
            }

            this.currentGrammar.addTerminalSymbol(val);
            this.updateDisplay();
            this.inputTerminal.focus();
        };

        refs.terminalRemoveButton.onclick = (e) => {
            let val = this.inputTerminal.value;
            if (val.trim().length === 0) {
                return;
            }

            this.inputTerminal.value = "";

            this.currentGrammar.removeTerminalSymbol(val);
            this.updateDisplay();
        };

        // Intialize non-terminal symbols section.
        designerDiv.appendChild(libD.jso2dom(
            ["div#grammar-designer-nonterminal-div", [
                ["div.grammar-designer-section-title", this._("Non terminal symbols")],
                ["span", { "#": "nonTerminalEditSpan" }, [
                    ["input#grammar-designer-nonterminal-input", { "#": "nonTerminalInput", "maxlength": "1" }],
                    ["button#grammar-designer-add-nonterminal-button", { "#": "nonTerminalAddButton" }, this._("Add")],
                    ["button#grammar-designer-remove-nonterminal-button", { "#": "nonTerminalRemoveButton" }, this._("Remove")],
                ]],
                ["div#grammar-designer-nonterminal-contents", { "#": "nonTerminalSymbolsDiv" }, "n o t h i n g h e r e y e t"]
            ]],
            refs
        ));
        this.nonTerminalSymbolsDiv = refs.nonTerminalSymbolsDiv;
        this.inputNonTerminal = refs.nonTerminalInput;
        this.nonTerminalEditSpan = refs.nonTerminalEditSpan;

        this.inputNonTerminal.onkeyup = (e) => {
            if (e.keyCode === 13) {
                refs.nonTerminalAddButton.click();
            }
        };

        refs.nonTerminalAddButton.onclick = (e) => {
            let val = this.inputNonTerminal.value;
            if (val.trim().length === 0) {
                return;
            }

            this.inputNonTerminal.value = "";

            if (this.currentGrammar.hasTerminalSymbols(val)) {
                window.AudeGUI.notify(this._("Error !"),
                    this._("A symbol cannot be final and not final at the same time !"),
                    "error",
                    4000
                );

                return;
            }

            this.currentGrammar.addNonTerminalSymbol(val);

            if (this.currentGrammar.getStartSymbol() === undefined) {
                this.currentGrammar.setStartSymbol(val);
            }

            this.updateDisplay();
            this.inputNonTerminal.focus();
        };

        refs.nonTerminalRemoveButton.onclick = (e) => {
            let val = this.inputNonTerminal.value;
            if (val.trim().length === 0) {
                return;
            }

            this.inputNonTerminal.value = "";

            this.currentGrammar.removeNonTerminalSymbols(val);
            this.updateDisplay();
        };

        // Initialize the rules section.
        let rulesRefs = {
            rulesList: <HTMLOListElement>null,
            selectStartSymbol: <HTMLSelectElement>null,
            newRuleSpan: <HTMLElement>null,
            selectNonTerminalNewRule: <HTMLSelectElement>null,
            spanNewRuleArrow: <HTMLElement>null,
            inputLeftTerminalNewRule: <HTMLInputElement>null,
            inputNonTerminalNewRule: <HTMLInputElement>null,
            inputRightTerminalNewRule: <HTMLInputElement>null,
            buttonNewRule: <HTMLButtonElement>null
        }
        designerDiv.appendChild(libD.jso2dom(
            ["div#grammar-designer-rules-div", [
                ["div.grammar-designer-section-title", this._("Derivation rules")],
                ["div#grammar-designer-start-div", [
                    ["span", this._("Start symbol : ")],
                    ["select#grammar-designer-select-start", { "#": "selectStartSymbol" }]
                ]],
                ["span", { "#": "newRuleSpan" }, [
                    ["select#grammar-designer-rule-select-nonterminal", { "#": "selectNonTerminalNewRule" }],
                    ["span", { "#": "spanNewRuleArrow" }, ""],
                    ["input.grammar-designer-input-new-rule",
                        { "#": "inputLeftTerminalNewRule", "placeholder": this._("Left terminal symbols") }],
                    ["input#grammar-designer-input-new-rule",
                        { "#": "inputNonTerminalNewRule", "maxlength": "1", "placeholder": this._("Non terminal symbol") }],
                    ["input#grammar-designer-input-new-rule",
                        { "#": "inputRightTerminalNewRule", "placeholder": this._("Right terminal symbols") }],
                    ["button#grammar-designer-button-new-rule",
                        { "#": "buttonNewRule" }, this._("Add new rule")]
                ]],
                ["ol#grammar-designer-rules-list", { "#": "rulesList" }]
            ]],
            rulesRefs
        ));
        this.rulesList = rulesRefs.rulesList;
        this.selectStartSymbol = rulesRefs.selectStartSymbol;
        this.newRuleSpan = rulesRefs.newRuleSpan;

        // When the start symbol is changed, we assign it to the grammar.
        this.selectStartSymbol.onchange = (e) => {
            let selectedValue = this.selectStartSymbol.value;
            if (!selectedValue) {
                return;
            }

            this.currentGrammar.setStartSymbol(selectedValue);
            this.updateDisplay();
        };

        window.AudeGUI.Quiz.textFormat("$\\rightarrow$", rulesRefs.spanNewRuleArrow);

        this.selectNonTerminalNewRule = rulesRefs.selectNonTerminalNewRule;

        this.inputLeftTerminalNewRule = rulesRefs.inputLeftTerminalNewRule;
        this.inputNonTerminalNewRule = rulesRefs.inputNonTerminalNewRule;
        this.inputRightTerminalNewRule = rulesRefs.inputRightTerminalNewRule;

        // Disable left symbols when right isn't empty, and vice-versa.
        this.inputLeftTerminalNewRule.oninput = (e) => {
            if (this.inputLeftTerminalNewRule.value.length != 0) {
                this.inputRightTerminalNewRule.setAttribute("disabled", "true");
            } else {
                this.inputRightTerminalNewRule.removeAttribute("disabled");
            }
        }

        this.inputLeftTerminalNewRule.onkeyup = (e) => {
            if (e.keyCode === 13) {
                rulesRefs.buttonNewRule.click();
            }
        };

        this.inputRightTerminalNewRule.oninput = (e) => {
            if (this.inputRightTerminalNewRule.value.length != 0) {
                this.inputLeftTerminalNewRule.setAttribute("disabled", "true");
            } else {
                this.inputLeftTerminalNewRule.removeAttribute("disabled");
            }
        };

        this.inputRightTerminalNewRule.onkeyup = (e) => {
            if (e.keyCode === 13) {
                rulesRefs.buttonNewRule.click();
            }
        }

        this.inputNonTerminalNewRule.onkeydown = (e) => {
            if (e.keyCode === 13) {
                rulesRefs.buttonNewRule.click();
            }
        };

        rulesRefs.buttonNewRule.onclick = (e) => {
            let terminalPart: string;
            let direction: "left" | "right";

            if (this.inputLeftTerminalNewRule.value.length !== 0) {
                terminalPart = this.inputLeftTerminalNewRule.value;
                direction = "right";
            } else if (this.inputRightTerminalNewRule.value.length !== 0) {
                terminalPart = this.inputRightTerminalNewRule.value;
                direction = "left";
            } else {
                terminalPart = "ε";
                direction = "right";
            }

            this.currentGrammar.addRule(
                this.selectNonTerminalNewRule.value,
                terminalPart,
                this.inputNonTerminalNewRule.value,
                direction
            );

            this.updateDisplay();
            // Re-focus the lefthand symbol <select>, so another rule can be added easily.
            this.selectNonTerminalNewRule.focus();
        };


        this.updateDisplay();
    }

    private rule2Latex(rule: Rule, isStartSymbol: boolean = false): string {
        let latex = "$";

        if (isStartSymbol) {
            latex += "\\mathbf{" + rule.getNonTerminalSymbol() + "}";
        } else {
            latex += rule.getNonTerminalSymbol();
        }
        latex += " \\rightarrow ";

        let nonTermBody = rule.getNonTerminalSymbolBody();
        if (rule.getNonTerminalSymbolBody() === undefined) {
            latex += rule.getListSymbolTerminal();
        } else if (rule.getListSymbolTerminal() === undefined) {
            latex += rule.getNonTerminalSymbolBody();
        } else if (rule.getSide() === "right") {
            latex += rule.getListSymbolTerminal() + rule.getNonTerminalSymbolBody();
        } else {
            latex += rule.getNonTerminalSymbolBody() + rule.getListSymbolTerminal();
        }

        return latex + "$";
    }

    /**
     * Re-draws all the info about the grammar.
     * Should be called everytime this.currentGrammar changes.
     */
    updateDisplay(): void {
        // Update symbols.
        window.AudeGUI.Quiz.textFormat(FormatUtils.set2Latex(this.currentGrammar.getTerminalSymbols()), this.terminalSymbolsDiv, true);
        window.AudeGUI.Quiz.textFormat(FormatUtils.set2Latex(this.currentGrammar.getNonTerminalSymbols()), this.nonTerminalSymbolsDiv, true);

        this.rulesList.innerHTML = "";
        let ruleNumber = 0;
        let rules = Array.from(this.currentGrammar.getProductionRules()) as Array<Rule>;
        rules.sort((a, b) => {
            if (a.getNonTerminalSymbol() === this.currentGrammar.getStartSymbol()) {
                return -1;
            } else if (b.getNonTerminalSymbol() === this.currentGrammar.getStartSymbol()) {
                return 1;
            } else {
                return a.toString().localeCompare(b.toString());
            }
        });

        for (let rule of rules) {
            let refs = {
                ruleContent: <HTMLElement>null
            };

            let newItem = libD.jso2dom(["li", [
                ["span.grammar-designer-rule-item", { "#": "ruleContent" }]
            ]],
                refs
            );

            window.AudeGUI.Quiz.textFormat(
                this.rule2Latex(rule, rule.getNonTerminalSymbol() === this.currentGrammar.getStartSymbol()),
                refs.ruleContent
            );

            // If designer is editable, we create the delete button for each rule.
            if (this.editable) {
                let ruleDeleteButton = libD.jso2dom(["button.grammar-designer-delete-button", { "value": String(ruleNumber) }, this._("x")]);

                ruleDeleteButton.onclick = (e) => {
                    this.currentGrammar.removeRule(rule);
                    this.updateDisplay();
                };

                newItem.appendChild(ruleDeleteButton);
            }

            this.rulesList.appendChild(newItem);

            ruleNumber++;
        }

        // Update start symbol select options.
        this.selectStartSymbol.innerHTML = "";
        this.selectNonTerminalNewRule.innerHTML = "";
        for (let nonTerminalSymbol of this.currentGrammar.getNonTerminalSymbols()) {
            let newOptionStart = libD.jso2dom(
                ["option", { "value": nonTerminalSymbol }, String(nonTerminalSymbol)]
            );

            if (nonTerminalSymbol === this.currentGrammar.getStartSymbol()) {
                newOptionStart.setAttribute("selected", "true");
            }
            this.selectStartSymbol.appendChild(newOptionStart);

            let newOptionNewRule = libD.jso2dom(
                ["option", { "value": nonTerminalSymbol }, String(nonTerminalSymbol)]
            );
            this.selectNonTerminalNewRule.appendChild(newOptionNewRule);
        }

        if (!this.editable) {
            this.selectStartSymbol.setAttribute("disabled", "true");
            this.newRuleSpan.style.display = "none";
            this.terminalEditSpan.style.display = "none";
            this.nonTerminalEditSpan.style.display = "none";
        } else {
            this.selectStartSymbol.removeAttribute("disabled");
            this.newRuleSpan.style.display = "inherit";
            this.terminalEditSpan.style.display = "inherit";
            this.nonTerminalEditSpan.style.display = "inherit";
        }
    }

    /**
     * Returns the grammar this designer is editing.
     */
    getGrammar(): linearGrammar {
        return this.currentGrammar;
    }

    /**
     * Sets the grammar this designer is working on.
     * @param grammar - The grammar to set.
     */
    setGrammar(grammar: linearGrammar): void {
        this.currentGrammar = grammar;
        this.updateDisplay();
    }

    setEditable(editable: boolean) {
        this.editable = editable;
        this.updateDisplay();
    }
}