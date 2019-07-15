/**
 * Class that handles a grammar designer.
 * The grammar designer allows the user to create and edit a grammar
 * in a more convenient way than a basic textual syntax.
 */
class GrammarDesigner {
    _ = window.AudeGUI.l10n;

    static readonly EDITOR_CONTENT = ["div", [
        ["div.row", [
            ["div.col-md-6", [
                ["div.card", [
                    ["div.card-header", window.AudeGUI.l10n("Terminal symbols")],
                    ["div.card-body", [
                        ["div", { "#": "terminalSymbolsDiv" }],
                        ["div.input-group", { "#": "terminalEditSpan" }, [
                            ["input#grammar-designer-terminal-input.form-control", { "#": "terminalInput", "maxlength": "1", "placeholder": window.AudeGUI.l10n("Enter a symbol here") }],
                            ["div.input-group-append", [
                                ["button#grammar-designer-add-terminal-button.btn btn-outline-primary", { "#": "terminalAddButton" }, "+"],
                                ["button#grammar-designer-remove-terminal-button.btn btn-outline-danger", { "#": "terminalRemoveButton" }, "×"],
                            ]]
                        ]]
                    ]]
                ]]
            ]],
            ["div.col-md-6", [
                ["div.card", [
                    ["div.card-header", window.AudeGUI.l10n("Non-terminal symbols")],
                    ["div.card-body", [
                        ["div", { "#": "nonTerminalSymbolsDiv" }],
                        ["div.input-group", { "#": "nonTerminalEditSpan" }, [
                            ["input#grammar-designer-nonterminal-input.form-control", { "#": "nonTerminalInput", "maxlength": "1", "placeholder": window.AudeGUI.l10n("Enter a symbol here") }],
                            ["div.input-group-append", [
                                ["button#grammar-designer-add-nonterminal-button.btn btn-outline-primary", { "#": "nonTerminalAddButton" }, "+"],
                                ["button#grammar-designer-remove-nonterminal-button.btn btn-outline-danger", { "#": "nonTerminalRemoveButton" }, "×"],
                            ]]
                        ]]
                    ]]
                ]]
            ]]
        ]],
        ["br"],
        ["div.card", [
            ["div.card-header", window.AudeGUI.l10n("Derivation rules")],
            ["div.card-body", [
                ["div.input-group", [
                    ["div.input-group-prepend", [
                        ["span.input-group-text", window.AudeGUI.l10n("Start symbol : ")],
                    ]],
                    ["select.form-control", { "#": "selectStartSymbol" }]
                ]],
                ["br"],
                ["div.input-group", { "#": "newRuleSpan" }, [
                    ["select.form-control", { "#": "selectNonTerminalNewRule" }],
                    ["span", { "#": "spanNewRuleArrow" }],
                    ["input.form-control", { "#": "inputLeftTerminalNewRule", "type": "text", "placeholder": window.AudeGUI.l10n("Left terminal symbols") }],
                    ["input.form-control", { "#": "inputNonTerminalNewRule", "type": "text", "maxlength": "1", "placeholder": window.AudeGUI.l10n("Non terminal symbol") }],
                    ["input.form-control", { "#": "inputRightTerminalNewRule", "type": "text", "placeholder": window.AudeGUI.l10n("Right terminal symbols") }],
                    ["div.input-group-append", [
                        ["button.btn btn-primary", { "#": "buttonNewRule" }, "+"]
                    ]]
                ]],
                ["ol#grammar-designer-rules-list", { "#": "rulesList" }]
            ]]
        ]]
    ]];

    currentGrammar: linearGrammar = new linearGrammar();

    containerDiv: HTMLElement;
    editable: boolean;

    refs = {
        terminalSymbolsDiv: <HTMLElement>undefined,
        terminalEditSpan: <HTMLElement>undefined,
        terminalInput: <HTMLInputElement>undefined,
        terminalAddButton: <HTMLButtonElement>undefined,
        terminalRemoveButton: <HTMLButtonElement>undefined,

        nonTerminalSymbolsDiv: <HTMLElement>undefined,
        nonTerminalEditSpan: <HTMLElement>undefined,
        nonTerminalInput: <HTMLInputElement>undefined,
        nonTerminalAddButton: <HTMLButtonElement>undefined,
        nonTerminalRemoveButton: <HTMLButtonElement>undefined,

        rulesList: <HTMLOListElement>undefined,
        selectStartSymbol: <HTMLSelectElement>undefined,
        newRuleSpan: <HTMLElement>undefined,
        selectNonTerminalNewRule: <HTMLSelectElement>undefined,
        spanNewRuleArrow: <HTMLElement>undefined,
        inputLeftTerminalNewRule: <HTMLInputElement>undefined,
        inputNonTerminalNewRule: <HTMLInputElement>undefined,
        inputRightTerminalNewRule: <HTMLInputElement>undefined,
        buttonNewRule: <HTMLButtonElement>undefined
    };

    constructor(designerDiv: HTMLElement, editable: boolean = true) {
        this.containerDiv = designerDiv;
        this.editable = editable;

        designerDiv.appendChild(libD.jso2dom(GrammarDesigner.EDITOR_CONTENT, this.refs));

        this.refs.terminalInput.onkeyup = (e) => {
            if (e.keyCode === 13) {
                this.refs.terminalAddButton.click();
            }
        };

        this.refs.terminalAddButton.onclick = (e) => {
            let val = this.refs.terminalInput.value;
            if (val.trim().length === 0) {
                return;
            }

            this.refs.terminalInput.value = "";

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
            this.refs.terminalInput.focus();
        };

        this.refs.terminalRemoveButton.onclick = (e) => {
            let val = this.refs.terminalInput.value;
            if (val.trim().length === 0) {
                return;
            }

            this.refs.terminalInput.value = "";

            this.currentGrammar.removeTerminalSymbol(val);
            this.updateDisplay();
        };

        this.refs.nonTerminalInput.onkeyup = (e) => {
            if (e.keyCode === 13) {
                this.refs.nonTerminalAddButton.click();
            }
        };

        this.refs.nonTerminalAddButton.onclick = (e) => {
            let val = this.refs.nonTerminalInput.value;
            if (val.trim().length === 0) {
                return;
            }

            this.refs.nonTerminalInput.value = "";

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
            this.refs.nonTerminalInput.focus();
        };

        this.refs.nonTerminalRemoveButton.onclick = (e) => {
            let val = this.refs.nonTerminalInput.value;
            if (val.trim().length === 0) {
                return;
            }

            this.refs.nonTerminalInput.value = "";

            this.currentGrammar.removeNonTerminalSymbols(val);
            this.updateDisplay();
        };

        // Initialize the rules section.
        // When the start symbol is changed, we assign it to the grammar.
        this.refs.selectStartSymbol.onchange = (e) => {
            let selectedValue = this.refs.selectStartSymbol.value;
            if (!selectedValue) {
                return;
            }

            this.currentGrammar.setStartSymbol(selectedValue);
            this.updateDisplay();
        };

        FormatUtils.textFormat("$\\rightarrow$", this.refs.spanNewRuleArrow);

        // Disable left symbols when right isn't empty, and vice-versa.
        this.refs.inputLeftTerminalNewRule.oninput = (e) => {
            if (this.refs.inputLeftTerminalNewRule.value.length != 0) {
                this.refs.inputRightTerminalNewRule.setAttribute("disabled", "true");
            } else {
                this.refs.inputRightTerminalNewRule.removeAttribute("disabled");
            }
        }

        this.refs.inputLeftTerminalNewRule.onkeyup = (e) => {
            if (e.keyCode === 13) {
                this.refs.buttonNewRule.click();
            }
        };

        this.refs.inputRightTerminalNewRule.oninput = (e) => {
            if (this.refs.inputRightTerminalNewRule.value.length != 0) {
                this.refs.inputLeftTerminalNewRule.setAttribute("disabled", "true");
            } else {
                this.refs.inputLeftTerminalNewRule.removeAttribute("disabled");
            }
        };

        this.refs.inputRightTerminalNewRule.onkeyup = (e) => {
            if (e.keyCode === 13) {
                this.refs.buttonNewRule.click();
            }
        }

        this.refs.inputNonTerminalNewRule.onkeydown = (e) => {
            if (e.keyCode === 13) {
                this.refs.buttonNewRule.click();
            }
        };

        this.refs.buttonNewRule.onclick = (e) => {
            let terminalPart: string;
            let direction: "left" | "right";

            if (this.refs.inputLeftTerminalNewRule.value.length !== 0) {
                terminalPart = this.refs.inputLeftTerminalNewRule.value;
                direction = "right";
            } else if (this.refs.inputRightTerminalNewRule.value.length !== 0) {
                terminalPart = this.refs.inputRightTerminalNewRule.value;
                direction = "left";
            } else {
                terminalPart = "ε";
                direction = "right";
            }

            this.currentGrammar.addRule(
                this.refs.selectNonTerminalNewRule.value,
                terminalPart,
                this.refs.inputNonTerminalNewRule.value,
                direction
            );

            this.updateDisplay();
            // Re-focus the lefthand symbol <select>, so another rule can be added easily.
            this.refs.selectNonTerminalNewRule.focus();
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
        FormatUtils.textFormat(FormatUtils.set2Latex(this.currentGrammar.getTerminalSymbols()), this.refs.terminalSymbolsDiv, true);
        FormatUtils.textFormat(FormatUtils.set2Latex(this.currentGrammar.getNonTerminalSymbols()), this.refs.nonTerminalSymbolsDiv, true);

        this.refs.rulesList.innerHTML = "";
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

            FormatUtils.textFormat(
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

            this.refs.rulesList.appendChild(newItem);

            ruleNumber++;
        }

        // Update start symbol select options.
        this.refs.selectStartSymbol.innerHTML = "";
        this.refs.selectNonTerminalNewRule.innerHTML = "";
        for (let nonTerminalSymbol of this.currentGrammar.getNonTerminalSymbols()) {
            let newOptionStart = libD.jso2dom(
                ["option", { "value": nonTerminalSymbol }, String(nonTerminalSymbol)]
            );

            if (nonTerminalSymbol === this.currentGrammar.getStartSymbol()) {
                newOptionStart.setAttribute("selected", "true");
            }
            this.refs.selectStartSymbol.appendChild(newOptionStart);

            let newOptionNewRule = libD.jso2dom(
                ["option", { "value": nonTerminalSymbol }, String(nonTerminalSymbol)]
            );
            this.refs.selectNonTerminalNewRule.appendChild(newOptionNewRule);
        }

        if (!this.editable) {
            this.refs.selectStartSymbol.setAttribute("disabled", "true");
            this.refs.newRuleSpan.classList.add("grammar-designer-hidden");
            this.refs.terminalEditSpan.classList.add("grammar-designer-hidden");
            this.refs.nonTerminalEditSpan.classList.add("grammar-designer-hidden");
        } else {
            this.refs.selectStartSymbol.removeAttribute("disabled");
            this.refs.newRuleSpan.classList.remove("grammar-designer-hidden");
            this.refs.terminalEditSpan.classList.remove("grammar-designer-hidden");
            this.refs.nonTerminalEditSpan.classList.remove("grammar-designer-hidden");
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