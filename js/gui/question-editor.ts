/**
 * This class provides a component to edit and create questions.
 */
class QuestionEditor {
    _ = window.AudeGUI.l10n;

    /** 
     * The object (to be passed to jso2dom) to be displayed 
     * when there is no preview for the wording text. 
     */
    private static readonly NO_PREVIEW_MESSAGE = ["p.text-muted", window.AudeGUI.l10n("Write your question in the text area and its rendered preview will appear here.")];
    /** The object (to be passed to jso2dom) for the common inputs of a question editor. */
    private static readonly COMMON_INPUT_CONTENT =
        ["div", [
            ["h4", window.AudeGUI.l10n("Wording")],
            ["h5", window.AudeGUI.l10n("Wording Text")],
            ["div.row", [
                ["div.col-md-6", [
                    ["textarea#question-editor-wording-text-area.form-control", { "#": "wordingTextField", "rows": "10" }],
                    ["br"],
                    ["div.form-check", [
                        ["input#question-editor-wording-html-check.form-check-input", { "#": "wordingTextHTMLCheck", "type": "checkbox" }],
                        ["label.form-check-label", { "for": "question-editor-wording-html-check" }, window.AudeGUI.l10n("Parse HTML")]
                    ]]
                ]],

                ["div.col-md-6", [
                    ["div#question-editor-wording-preview-card.card", [
                        ["div.card-header", window.AudeGUI.l10n("Preview")],
                        ["div.card-body", { "#": "wordingTextPreview" }, [
                            QuestionEditor.NO_PREVIEW_MESSAGE
                        ]]
                    ]]
                ]]
            ]],

            ["h5", window.AudeGUI.l10n("Wording Details")],
            ["div.row", [
                ["div.col-md-6", [
                    ["span.font-weight-bold", window.AudeGUI.l10n("Element N°1")],
                    ["select#question-editor-wording-figure1-type.form-control", { "#": "fig1TypeSelect" }, [
                        ["option", { "value": "None", "selected": "true" }, window.AudeGUI.l10n("None")],
                        ["option", { "value": "Automaton" }, window.AudeGUI.l10n("Automaton")],
                        ["option", { "value": "Regexp" }, window.AudeGUI.l10n("Regular expression")],
                        ["option", { "value": "LinearGrammar" }, window.AudeGUI.l10n("Regular Grammar")],
                    ]],
                    ["br"],
                    ["div#question-editor-wording-figure1-content", { "#": "fig1Content" }]
                ]],

                ["div.col-md-6", [
                    ["span.font-weight-bold", window.AudeGUI.l10n("Element N°2")],
                    ["select#question-editor-wording-figure1-type.form-control", { "#": "fig2TypeSelect" }, [
                        ["option", { "value": "None", "selected": "true" }, window.AudeGUI.l10n("None")],
                        ["option", { "value": "Automaton" }, window.AudeGUI.l10n("Automaton")],
                        ["option", { "value": "Regexp" }, window.AudeGUI.l10n("Regular expression")],
                        ["option", { "value": "LinearGrammar" }, window.AudeGUI.l10n("Regular Grammar")],
                    ]],
                    ["br"],
                    ["div#question-editor-wording-figure2-content", { "#": "fig2Content" }]
                ]]
            ]]
        ]];
    /** The object (to be passed to jso2dom) for the specific inputs for a TextInputQuestion */
    private static readonly TEXTINPUT_INPUT_CONTENT =
        ["div", [
            ["h4", window.AudeGUI.l10n("Text Input Answer")],
            ["h6", window.AudeGUI.l10n("Answer verification method")],
            ["div.row", [
                ["div.col-md-6", [
                    ["div.form-check", [
                        ["input#question-editor-radio-wordlist.form-check-input", { "#": "radioWordlist", "type": "radio", "name": "textInputVerifMethod", "value": "wordList", "checked": "true" }],
                        ["label", { "for": "question-editor-radio-wordlist" }, window.AudeGUI.l10n("List of correct answers")],
                        ["small", { "class": "form-text text-muted" }, window.AudeGUI.l10n("The user's answer will be correct only if it is in a given list.")]
                    ]]
                ]],

                ["div.col-md-6", [
                    ["div.form-check", [
                        ["input#question-editor-radio-audescript.form-check-input", { "#": "radioAudescript", "type": "radio", "name": "textInputVerifMethod", "value": "audescript" }],
                        ["label", { "for": "question-editor-radio-audescript" }, window.AudeGUI.l10n("Audescript")],
                        ["small", { "class": "form-text text-muted" }, window.AudeGUI.l10n("An algorithm will check if the answer is correct.")]
                    ]]
                ]]
            ]],

            ["div#question-editor-textinput-verif-content", [
                ["input#question-editor-textinput-validation-wordlist.form-control", { "#": "wordlistContent", "type": "text", "placeholder": window.AudeGUI.l10n("Enter the correct answers here, separated by commas.") }],
                ["textarea#question-editor-textinput-validation-audescript.form-control", { "#": "audescriptContent", "rows": "10", "placeholder": window.AudeGUI.l10n("Write your AudeScript code here.") }]
            ]]
        ]];

    private static readonly MCQ_INPUT_CONTENT = ["div", [
        ["h4", window.AudeGUI.l10n("Multiple Choice Question Answers")],
        ["div.form-check", [
            ["input#question-editor-mcq-single-check.form-check-input", { "#": "singleCheckbox", "type": "checkbox" }],
            ["label.form-check-label", { "for": "question-editor-mcq-single-check" }, window.AudeGUI.l10n("Allow only one choice to be chosen")]
        ]],
        ["table.table table-bordered table-hover table-sm", [
            ["thead", [
                ["tr", [
                    ["th", window.AudeGUI.l10n("Id")],
                    ["th", window.AudeGUI.l10n("Wording")],
                    ["th", window.AudeGUI.l10n("Details")],
                    ["th", window.AudeGUI.l10n("Correct")]
                ]]
            ]],
            ["tbody", { "#": "choiceTableBody" }, [

            ]]
        ]],

        ["div.card text-center", [
            ["div.card-header", window.AudeGUI.l10n("New Choice")],
            ["div.card-body", [
                ["input.form-control", { "#": "newChoiceText", "type": "text", "placeholder": window.AudeGUI.l10n("Text/HTML/LaTeX for the choice here.") }],
                ["br"],
                ["div.form-group", [
                    ["label", { "for": "question-editor-mcq-choice-detail" }, window.AudeGUI.l10n("Detail")],
                    ["select#question-editor-mcq-choice-detail.form-control", { "#": "newChoiceDetailType" }, [
                        ["option", { "value": "None", "selected": "true" }, window.AudeGUI.l10n("None")],
                        ["option", { "value": "Automaton" }, window.AudeGUI.l10n("Automaton")],
                        ["option", { "value": "Regexp" }, window.AudeGUI.l10n("Regular expression")],
                        ["option", { "value": "LinearGrammar" }, window.AudeGUI.l10n("Linear Grammar")]
                    ]]
                ]],
                ["div", { "#": "newChoiceDetailContent" }, [

                ]],
                ["br"],
                ["button.btn btn-primary btn-block", { "#": "newChoiceAddButton" }, window.AudeGUI.l10n("Add this choice to the question")]
            ]]
        ]]
    ]];

    private static readonly AUTOEQUIV_CONSTRAINT_HELP = ["small.text-muted", [
        ["ul", [
            ["li", window.AudeGUI.l10n("Every constraint must return an object of the form {correct: boolean, details: string}")],
            ["li", window.AudeGUI.l10n("The user's answer is available through the variable called a, re or g if it's an automaton, a regular expression or a grammar")]
        ]]
    ]];

    private static readonly AUTOEQUIV_CONTENT = [
        ["h4", window.AudeGUI.l10n("Automaton Equivalency Answers")],
        ["h5", window.AudeGUI.l10n("User's answer type")],
        ["select.form-control", { "#": "usersAnswerTypeSelect" }, [
            ["option", { "value": "Automaton" }, window.AudeGUI.l10n("Automaton")],
            ["option", { "value": "Regexp" }, window.AudeGUI.l10n("Regular expression")],
            ["option", { "value": "LinearGrammar" }, window.AudeGUI.l10n("Linear Grammar")]
        ]],

        ["h5", window.AudeGUI.l10n("Reference")],
        ["div.form-group", [
            ["small.form-text text-muted", window.AudeGUI.l10n("If set, the user's answer will be correct only if it is equivalent to this automaton, regular expression or grammar.")],
            ["select.form-control", { "#": "referenceTypeSelect" }, [
                ["option", { "value": "None", "selected": "true" }, window.AudeGUI.l10n("None")],
                ["option", { "value": "Automaton" }, window.AudeGUI.l10n("Automaton")],
                ["option", { "value": "Regexp" }, window.AudeGUI.l10n("Regular expression")],
                ["option", { "value": "LinearGrammar" }, window.AudeGUI.l10n("Linear Grammar")]
            ]]
        ]],

        ["div#question-editor-autoequiv-ref-content", { "#": "referenceEditContent" }, [

        ]],

        ["h5", window.AudeGUI.l10n("Constraints")],
        QuestionEditor.AUTOEQUIV_CONSTRAINT_HELP,
        ["ul", { "#": "constraintList" }, [

        ]],
        ["button.btn btn-primary btn-block", { "#": "addConstraintButton" }, window.AudeGUI.l10n("Add new constraint")]
    ];
    private autoEquivReferenceInput: AudeDesigner | HTMLInputElement | GrammarDesigner;

    /** The HTMLElement containing this question editor. */
    container: HTMLElement;

    /** The question currently being edited by this editor. */
    private currentQuestion: Question;

    /** Couple containing the input elements for the wording details. */
    private readonly wordingDetailInputs: [AudeDesigner | HTMLInputElement | GrammarDesigner, AudeDesigner | HTMLInputElement | GrammarDesigner]
        = [undefined, undefined];

    private readonly commonRefs = {
        wordingTextField: undefined as HTMLTextAreaElement,
        wordingTextHTMLCheck: undefined as HTMLInputElement,
        wordingTextPreview: undefined as HTMLElement,
        fig1TypeSelect: undefined as HTMLSelectElement,
        fig2TypeSelect: undefined as HTMLSelectElement,
        fig1Content: undefined as HTMLElement,
        fig2Content: undefined as HTMLElement
    };

    // Fields for TextInput Questions
    private readonly textInputRefs = {
        radioWordlist: undefined as HTMLInputElement,
        radioAudescript: undefined as HTMLInputElement,
        wordlistContent: undefined as HTMLInputElement,
        audescriptContent: undefined as HTMLTextAreaElement
    };

    // Fields for MCQ Questions.
    private readonly mcqRefs = {
        choiceTableBody: undefined as HTMLTableSectionElement,
        singleCheckbox: undefined as HTMLInputElement,
        newChoiceText: undefined as HTMLInputElement,
        newChoiceDetailType: undefined as HTMLSelectElement,
        newChoiceAddButton: undefined as HTMLButtonElement,
        newChoiceDetailContent: undefined as HTMLElement
    };
    private readonly mcqChoices: Array<{
        id?: string,
        text?: string,
        html?: string,
        automaton?: Automaton,
        regex?: string,
        grammar?: linearGrammar,
        correct?: boolean
    }> = [];
    private mcqChoiceDetailInput: AudeDesigner | HTMLInputElement | GrammarDesigner;

    // Fields for AutomatonEquiv Questions
    private readonly autoEquivRefs = {
        usersAnswerTypeSelect: undefined as HTMLSelectElement,
        referenceTypeSelect: undefined as HTMLSelectElement,
        referenceEditContent: undefined as HTMLElement,
        constraintList: undefined as HTMLUListElement,
        addConstraintButton: undefined as HTMLButtonElement
    };
    private readonly autoEquivContraintTextAreas: HTMLTextAreaElement[] = [];

    constructor(container: HTMLElement, questionCategory: QuestionCategory) {
        this.container = container;

        switch (questionCategory) {
            case QuestionCategory.MCQ:
                this.currentQuestion = new MCQQuestion();
                this.currentQuestion.wordingText = "";
                break;
            case QuestionCategory.TextInput:
                this.currentQuestion = new TextInputQuestion();
                break;
            case QuestionCategory.AutomatonEquivQuestion:
                this.currentQuestion = new AutomatonEquivQuestion();
                break;
        }

        this.draw();
    }

    getCurrentQuestion() {
        // Retrieve wording details from inputs.
        this.currentQuestion.wordingDetails = [];
        for (const wdi of this.wordingDetailInputs) {
            if (wdi === undefined) {
                continue;
            }

            if (wdi instanceof AudeDesigner) {
                this.currentQuestion.wordingDetails.push(wdi.getAutomaton(0));
            }

            if (wdi instanceof HTMLInputElement) {
                this.currentQuestion.wordingDetails.push(wdi.value);
            }

            if (wdi instanceof GrammarDesigner) {
                this.currentQuestion.wordingDetails.push(wdi.getGrammar());
            }
        }

        if (this.currentQuestion.category === QuestionCategory.TextInput) {
            this.parseTextInputSpecificComponents();
        } else if (this.currentQuestion.category === QuestionCategory.MCQ) {
            this.parseMCQSpecificComponents();
        } else if (this.currentQuestion.category === QuestionCategory.AutomatonEquivQuestion) {
            this.parseAutoEquivSpecificComponents();
        }
        return this.currentQuestion;
    }

    setCurrentQuestion(q: Question) {
        this.currentQuestion = q;

        this.draw();

        this.redraw();
    }

    /**
     * Initializes the fields that are common for every question category.
     */
    private initCommonComponents(commonComponentsDiv: HTMLElement) {
        commonComponentsDiv.appendChild(libD.jso2dom(QuestionEditor.COMMON_INPUT_CONTENT, this.commonRefs));

        this.commonRefs.wordingTextHTMLCheck.checked = this.currentQuestion.isWordingHtml;
        if (this.currentQuestion.wordingText.length !== 0) {
            this.commonRefs.wordingTextField.value = this.currentQuestion.wordingText;
            this.refreshWordingPreview();
        }

        this.commonRefs.wordingTextField.onchange = () => { this.refreshWordingPreview(); };
        this.commonRefs.wordingTextField.onkeyup = () => {
            this.refreshWordingPreview();
            this.currentQuestion.wordingText = this.commonRefs.wordingTextField.value;
        };

        this.commonRefs.wordingTextHTMLCheck.onchange = () => {
            this.refreshWordingPreview();
            this.currentQuestion.isWordingHtml = this.commonRefs.wordingTextHTMLCheck.checked;
        };

        this.commonRefs.fig1Content.classList.add("question-editor-hidden");
        this.commonRefs.fig2Content.classList.add("question-editor-hidden");

        const findDataTypeName = (s: Automaton | string | linearGrammar): string => {
            if (s instanceof Automaton) {
                return "Automaton";
            } else if (typeof s === "string") {
                return "Regexp";
            } else if (s instanceof linearGrammar) {
                return "LinearGrammar";
            } else {
                return "None";
            }
        };

        this.commonRefs.fig1TypeSelect.onchange = (e) => {
            if (this.commonRefs.fig1TypeSelect.value === "None") {
                this.commonRefs.fig1Content.classList.add("question-editor-hidden");
                this.wordingDetailInputs[0] = undefined;
                return;
            }
            this.commonRefs.fig1Content.classList.remove("question-editor-hidden");
            this.displayWordingDetailInput(0, AutomatonDataType[this.commonRefs.fig1TypeSelect.value]);
        };

        this.commonRefs.fig1TypeSelect.value = findDataTypeName(this.currentQuestion.wordingDetails[0]);
        this.commonRefs.fig1TypeSelect.dispatchEvent(new Event("change", { "bubbles": true, "cancelable": false }));

        this.commonRefs.fig2TypeSelect.onchange = (e) => {
            if (this.commonRefs.fig2TypeSelect.value === "None") {
                this.commonRefs.fig2Content.classList.add("question-editor-hidden");
                this.wordingDetailInputs[1] = undefined;
                return;
            }
            this.commonRefs.fig2Content.classList.remove("question-editor-hidden");
            this.displayWordingDetailInput(1, AutomatonDataType[this.commonRefs.fig2TypeSelect.value]);
        };

        this.commonRefs.fig2TypeSelect.value = findDataTypeName(this.currentQuestion.wordingDetails[1]);
        this.commonRefs.fig2TypeSelect.dispatchEvent(new Event("change", { "bubbles": true, "cancelable": false }));

        for (let i = 0; i < 2; i++) {
            if (this.currentQuestion.wordingDetails[i] instanceof Automaton) {
                (this.wordingDetailInputs[i] as AudeDesigner).setAutomatonCode(automaton_code(this.currentQuestion.wordingDetails[i] as Automaton));
            } else if (typeof this.currentQuestion.wordingDetails[i] === "string") {
                (this.wordingDetailInputs[i] as HTMLInputElement).value = this.currentQuestion.wordingDetails[i] as string;
            } else if (this.currentQuestion.wordingDetails[i] instanceof linearGrammar) {
                (this.wordingDetailInputs[i] as GrammarDesigner).setGrammar(this.currentQuestion.wordingDetails[i] as linearGrammar);
            }
        }
    }

    private displayWordingDetailInput(detailIndex: 0 | 1, type: AutomatonDataType) {
        const htmlDiv = (detailIndex === 0 ? this.commonRefs.fig1Content : this.commonRefs.fig2Content);

        htmlDiv.innerHTML = "";

        switch (type) {
            case AutomatonDataType.Automaton: {
                const designerDiv = document.createElement("div");
                designerDiv.classList.add(
                    "question-editor-wording-figure-automaton",
                    "border", "border-primary", "rounded-sm"
                );

                const designer = new AudeDesigner(designerDiv);

                this.wordingDetailInputs[detailIndex] = designer;
                htmlDiv.appendChild(designerDiv);
                break;
            }

            case AutomatonDataType.Regexp: {
                const regexInput = document.createElement("input");
                regexInput.classList.add("form-control");
                regexInput.setAttribute("placeholder", this._("Input your regular expression here."));

                this.wordingDetailInputs[detailIndex] = regexInput;
                htmlDiv.appendChild(regexInput);
                break;
            }

            case AutomatonDataType.LinearGrammar: {
                const gramDesigner = new GrammarDesigner(htmlDiv, true);

                this.wordingDetailInputs[detailIndex] = gramDesigner;
                break;
            }
        }
    }

    private initTextInputSpecificComponents(specificComponentsDiv: HTMLElement) {
        const tiq = this.currentQuestion as TextInputQuestion;
        specificComponentsDiv.innerHTML = "";
        specificComponentsDiv.appendChild(
            libD.jso2dom(QuestionEditor.TEXTINPUT_INPUT_CONTENT, this.textInputRefs)
        );

        this.textInputRefs.audescriptContent.classList.add("question-editor-hidden");

        this.textInputRefs.radioWordlist.onchange = (e) => {
            this.textInputRefs.wordlistContent.classList.remove("question-editor-hidden");
            this.textInputRefs.audescriptContent.classList.add("question-editor-hidden");
        };

        this.textInputRefs.radioAudescript.onchange = (e) => {
            this.textInputRefs.audescriptContent.classList.remove("question-editor-hidden");
            this.textInputRefs.wordlistContent.classList.add("question-editor-hidden");
        };

        if (tiq.answerValidatorAS) {
            this.textInputRefs.radioWordlist.checked = false;
            this.textInputRefs.radioAudescript.checked = true;
            this.textInputRefs.audescriptContent.value = tiq.answerValidatorAS;
            this.textInputRefs.radioAudescript.dispatchEvent(new Event("change"));
        } else {
            this.textInputRefs.radioWordlist.checked = true;
            this.textInputRefs.radioAudescript.checked = false;
            this.textInputRefs.wordlistContent.value = tiq.correctAnswers.join(",");
            this.textInputRefs.radioWordlist.dispatchEvent(new Event("change"));
        }
    }

    private parseTextInputSpecificComponents() {
        const qti = (this.currentQuestion) as TextInputQuestion;
        // Word list.
        if (this.textInputRefs.radioWordlist.checked) {
            qti.correctAnswers = this.textInputRefs.wordlistContent.value.split(",").map((v, i, a) => { return v.trim(); });
            qti.answerValidatorAS = undefined;
            qti.answerValidatorAS = undefined;
        } else {
            qti.answerValidatorAS = this.textInputRefs.audescriptContent.value;
            qti.answerValidator = eval("(q) => { " + audescript.toJS(qti.answerValidatorAS).code + " } ");
        }
    }

    private initMCQSpecificComponents(specificComponentsDiv: HTMLElement) {
        const mcq = (this.currentQuestion as MCQQuestion);
        specificComponentsDiv.innerHTML = "";
        specificComponentsDiv.appendChild(
            libD.jso2dom(QuestionEditor.MCQ_INPUT_CONTENT, this.mcqRefs)
        );

        this.mcqRefs.singleCheckbox.onchange = (e) => {
            mcq.singleChoice = this.mcqRefs.singleCheckbox.checked;
            this.redraw();
        };
        this.mcqRefs.singleCheckbox.checked = mcq.singleChoice;
        this.mcqRefs.singleCheckbox.dispatchEvent(new Event("change"));

        // If they exist, put the current question's choices into this editor's.
        for (const choice of mcq.wordingChoices) {
            const choiceC: any = choice;
            choiceC.correct = (mcq.correctChoices.includes(choiceC.id));
            this.mcqChoices.push(choiceC);
        }
        this.redraw();
        this.mcqRefs.newChoiceAddButton.onclick = (e) => {
            let newChoiceId = "a";
            const choiceIdExists = (choiceId: string): boolean => {
                for (const choice of this.mcqChoices) {
                    if (choice.id === choiceId) {
                        return true;
                    }
                }
                return false;
            };

            while (choiceIdExists(newChoiceId)) {
                newChoiceId = String.fromCodePoint(newChoiceId.codePointAt(0) + 1);
            }

            const newChoice = {
                id: newChoiceId,
                text: undefined,
                html: this.mcqRefs.newChoiceText.value,
                automaton: undefined as Automaton,
                regex: undefined as string,
                grammar: undefined as linearGrammar
            };

            if (this.mcqRefs.newChoiceDetailType.value !== "None") {
                switch (AutomatonDataType[this.mcqRefs.newChoiceDetailType.value]) {
                    case AutomatonDataType.Automaton: {
                        if (this.mcqChoiceDetailInput instanceof AudeDesigner) {
                            newChoice.automaton = this.mcqChoiceDetailInput.getAutomaton(0);
                        }
                        break;
                    }

                    case AutomatonDataType.Regexp: {
                        if (this.mcqChoiceDetailInput instanceof HTMLInputElement) {
                            newChoice.regex = this.mcqChoiceDetailInput.value;
                        }
                        break;
                    }

                    case AutomatonDataType.LinearGrammar: {
                        if (this.mcqChoiceDetailInput instanceof GrammarDesigner) {
                            newChoice.grammar = this.mcqChoiceDetailInput.getGrammar();
                        }
                        break;
                    }
                }
            }

            this.mcqChoices.push(newChoice);
            this.redraw();

            this.mcqRefs.newChoiceText.value = "";
            this.mcqRefs.newChoiceDetailType.selectedIndex = 0;
            this.mcqRefs.newChoiceDetailContent.classList.add("question-editor-hidden");
            this.mcqRefs.newChoiceDetailContent.innerHTML = "";
        };

        this.mcqRefs.newChoiceDetailType.onchange = (e) => {
            this.mcqRefs.newChoiceDetailContent.innerHTML = "";
            this.mcqRefs.newChoiceDetailContent.className = "";
            if (this.mcqRefs.newChoiceDetailType.value === "None") {
                this.mcqRefs.newChoiceDetailContent.classList.add("question-editor-hidden");
                return;
            }

            switch (AutomatonDataType[this.mcqRefs.newChoiceDetailType.value]) {
                case AutomatonDataType.Automaton:
                    this.mcqChoiceDetailInput = new AudeDesigner(this.mcqRefs.newChoiceDetailContent, false);
                    this.mcqRefs.newChoiceDetailContent.classList.add("question-editor-wording-figure-automaton");
                    break;

                case AutomatonDataType.Regexp:
                    this.mcqChoiceDetailInput = libD.jso2dom(["input.form-control", { "type": "text" }]) as HTMLInputElement;
                    this.mcqRefs.newChoiceDetailContent.appendChild(this.mcqChoiceDetailInput);
                    break;

                case AutomatonDataType.LinearGrammar:
                    this.mcqChoiceDetailInput = new GrammarDesigner(this.mcqRefs.newChoiceDetailContent, true);
                    break;
            }
        };
    }

    /**
     * If the current question is a multiple choice, 
     * parses the input components to get the question info and places it in 
     * the currentQuestion field.
     */
    private parseMCQSpecificComponents() {
        const mcq = this.currentQuestion as MCQQuestion;
        for (const tr of this.mcqRefs.choiceTableBody.children) {
            const check = (tr.children[3].firstChild as HTMLInputElement);

            let choiceIndex = -1;
            for (let i = 0; i < this.mcqChoices.length; i++) {
                if (this.mcqChoices[i].id === check.value) {
                    choiceIndex = i;
                    break;
                }
            }

            if (choiceIndex === -1) return;

            this.mcqChoices[choiceIndex].correct = check.checked;
        }
        mcq.setWordingChoices(this.mcqChoices);
    }

    private initAutoEquivSpecificComponents(specificComponentsDiv: HTMLElement) {
        const aeq = this.currentQuestion as AutomatonEquivQuestion;
        specificComponentsDiv.appendChild(libD.jso2dom(QuestionEditor.AUTOEQUIV_CONTENT, this.autoEquivRefs));

        this.autoEquivRefs.usersAnswerTypeSelect.onchange = (e) => {
            aeq.usersAnswerType = AutomatonDataType[this.autoEquivRefs.usersAnswerTypeSelect.value];
        };
        this.autoEquivRefs.usersAnswerTypeSelect.value = AutomatonDataType[aeq.usersAnswerType];

        this.autoEquivRefs.referenceTypeSelect.onchange = (e) => {
            this.autoEquivRefs.referenceEditContent.innerHTML = "";
            this.autoEquivRefs.referenceEditContent.classList.remove("question-editor-hidden");

            switch (this.autoEquivRefs.referenceTypeSelect.value) {
                case "None":
                    this.autoEquivRefs.referenceEditContent.classList.add("question-editor-hidden");
                    this.autoEquivReferenceInput = undefined;
                    break;

                case "Automaton":
                    const designerDiv = libD.jso2dom(["div.question-editor-wording-figure-automaton"]);
                    this.autoEquivReferenceInput = new AudeDesigner(designerDiv, false);
                    this.autoEquivRefs.referenceEditContent.appendChild(designerDiv);
                    if (aeq.correctAnswerAutomaton) {
                        this.autoEquivReferenceInput.setAutomatonCode(automaton_code(aeq.correctAnswerAutomaton));
                    }
                    break;

                case "Regexp":
                    this.autoEquivReferenceInput = libD.jso2dom(["input.form-control", { "type": "text", "placeholder": this._("Input your regular expression here.") }]) as HTMLInputElement;
                    this.autoEquivRefs.referenceEditContent.appendChild(this.autoEquivReferenceInput);
                    if (aeq.correctAnswerRegexp) {
                        this.autoEquivReferenceInput.value = aeq.correctAnswerRegexp;
                    }
                    break;

                case "LinearGrammar":
                    this.autoEquivReferenceInput = new GrammarDesigner(this.autoEquivRefs.referenceEditContent, true);
                    if (aeq.correctAnswerGrammar) {
                        this.autoEquivReferenceInput.setGrammar(aeq.correctAnswerGrammar);
                    }
                    break;
            }
        };

        if (aeq.correctAnswerGrammar) {
            this.autoEquivRefs.referenceTypeSelect.value = "LinearGrammar";
        } else if (aeq.correctAnswerRegexp) {
            this.autoEquivRefs.referenceTypeSelect.value = "Regexp";
        } else if (aeq.correctAnswerAutomaton) {
            this.autoEquivRefs.referenceTypeSelect.value = "Automaton";
        } else {
            this.autoEquivRefs.referenceTypeSelect.value = "None";
        }
        this.autoEquivRefs.referenceTypeSelect.dispatchEvent(new Event("change"));

        // Creates a text area for a new constraint and adds it to the current editor.
        const newConstraintTextArea = () => {
            const constraintTextArea = libD.jso2dom(["textarea.form-control", { "rows": "8", "placeholder": this._("Give your Audescript constraint here."), "spellcheck": "false" }]) as HTMLTextAreaElement;

            constraintTextArea.onkeydown = (e) => {
                if (e.code === "Tab") {
                    const oldSelectStart = constraintTextArea.selectionStart;
                    constraintTextArea.value = constraintTextArea.value.substring(0, constraintTextArea.selectionStart) + "\t" + constraintTextArea.value.substring(constraintTextArea.selectionStart);
                    constraintTextArea.selectionStart = constraintTextArea.selectionEnd = oldSelectStart + 1;
                    e.preventDefault();
                }
            };

            this.autoEquivRefs.constraintList.appendChild(constraintTextArea);
            this.autoEquivContraintTextAreas.push(constraintTextArea);

            return constraintTextArea;
        };

        this.autoEquivRefs.addConstraintButton.onclick = newConstraintTextArea;

        let constraintList = undefined;
        switch (aeq.usersAnswerType) {
            case AutomatonDataType.Automaton:
                constraintList = aeq.automatonAnswerConstraintsAudescript;
                break;
            case AutomatonDataType.Regexp:
                constraintList = aeq.regexpAnswerConstraintsAudescript;
                break;
            case AutomatonDataType.LinearGrammar:
                constraintList = aeq.grammarAnswerConstraintsAudescript;
                break;
        }
        if (!constraintList) return;

        for (const constAS of constraintList) {
            const constraintTA = newConstraintTextArea();

            constraintTA.value = constAS;
        }
    }

    private parseAutoEquivSpecificComponents() {
        const aeq = this.currentQuestion as AutomatonEquivQuestion;

        aeq.automatonAnswerConstraints = [];
        aeq.automatonAnswerConstraintsAudescript = [];
        aeq.regexpAnswerConstraints = [];
        aeq.regexpAnswerConstraintsAudescript = [];
        aeq.grammarAnswerConstraints = [];
        aeq.grammarAnswerConstraintsAudescript = [];

        if (this.autoEquivReferenceInput instanceof AudeDesigner) {
            aeq.setReferenceAnswer(this.autoEquivReferenceInput.getAutomaton(0));
        } else if (this.autoEquivReferenceInput instanceof HTMLInputElement) {
            aeq.setReferenceAnswer(this.autoEquivReferenceInput.value);
        } else if (this.autoEquivReferenceInput instanceof GrammarDesigner) {
            aeq.setReferenceAnswer(this.autoEquivReferenceInput.getGrammar());
        }

        const usersAnswerType = AutomatonDataType[this.autoEquivRefs.usersAnswerTypeSelect.value];
        for (const cta of this.autoEquivContraintTextAreas) {
            // Skip empty text areas.
            if (cta.value.trim().length === 0) {
                continue;
            }

            switch (usersAnswerType) {
                case AutomatonDataType.Automaton:
                    try {
                        aeq.automatonAnswerConstraints.push(
                            eval(
                                "(a, q) => { " + audescript.toJS(cta.value).code + "}"
                            )
                        );
                        aeq.automatonAnswerConstraintsAudescript.push(cta.value);
                    } catch (e) {
                        window.AudeGUI.notify(this._("Audescript error"), e.message, "error");
                    }
                    break;

                case AutomatonDataType.Regexp:
                    try {
                        aeq.regexpAnswerConstraints.push(
                            eval(
                                "(re, q) => { " + audescript.toJS(cta.value).code + "}"
                            )
                        );
                        aeq.regexpAnswerConstraintsAudescript.push(cta.value);
                    } catch (e) {
                        window.AudeGUI.notify(this._("Audescript error"), e.message, "error");
                    }

                    break;

                case AutomatonDataType.LinearGrammar:
                    try {
                        aeq.grammarAnswerConstraints.push(
                            eval(
                                "(g, q) => { " + audescript.toJS(cta.value).code + "}"
                            )
                        );
                        aeq.grammarAnswerConstraintsAudescript.push(cta.value);
                    } catch (e) {
                        window.AudeGUI.notify(this._("Audescript error"), e.message, "error");
                    }

                    break;
            }
        }
    }

    /**
     * Draws all the editing component for the current question according
     * to its category.
     * Does only the initial drawing and should be called once, 
     * if currentQuestion changes, call redraw instead.
     */
    draw() {
        this.container.innerHTML = "";
        const refs = {
            commonInputs: undefined as HTMLElement,
            specificInputs: undefined as HTMLElement
        };

        this.container.appendChild(libD.jso2dom([
            ["div#question-editor-common-inputs", { "#": "commonInputs" }],
            ["div#question-editor-specific-inputs", { "#": "specificInputs" }]
        ], refs));

        this.initCommonComponents(refs.commonInputs);

        switch (this.currentQuestion.category) {
            case QuestionCategory.AutomatonEquivQuestion:
                this.initAutoEquivSpecificComponents(refs.specificInputs);
                break;
            case QuestionCategory.MCQ:
                this.initMCQSpecificComponents(refs.specificInputs);
                break;
            case QuestionCategory.TextInput:
                this.initTextInputSpecificComponents(refs.specificInputs);
                break;
        }
    }

    /**
     * Refreshes the preview element for the formatted wording text.
     */
    refreshWordingPreview() {
        if (this.commonRefs.wordingTextField.value.trim().length === 0) {
            this.commonRefs.wordingTextPreview.innerHTML = "";
            this.commonRefs.wordingTextPreview.appendChild(libD.jso2dom(QuestionEditor.NO_PREVIEW_MESSAGE));
            return;
        }
        try {
            FormatUtils.textFormat(this.commonRefs.wordingTextField.value, this.commonRefs.wordingTextPreview, this.commonRefs.wordingTextHTMLCheck.checked);
        } catch (e) {
            this.commonRefs.wordingTextPreview.appendChild(e.message);
        }
    }

    redraw() {
        if (this.currentQuestion.category === QuestionCategory.MCQ) {
            this.mcqRefs.choiceTableBody.innerHTML = "";

            for (const choice of this.mcqChoices) {
                const newChoiceRefs = {
                    wordingTD: undefined as HTMLTableCellElement,
                    detailsTD: undefined as HTMLTableCellElement,
                    wordingCorrect: undefined as HTMLInputElement,
                    deleteChoiceButton: undefined as HTMLInputElement,
                    btnMoveOrderUp: undefined as HTMLButtonElement,
                    btnMoveOrderDown: undefined as HTMLButtonElement
                };
                const correctCheckType = (this.mcqRefs.singleCheckbox.checked ? "radio" : "checkbox");

                const newChoiceTR = libD.jso2dom(["tr", [
                    ["td", choice.id],
                    ["td", { "#": "wordingTD" }],
                    ["td", { "#": "detailsTD" }],
                    ["td", [
                        ["input", { "#": "wordingCorrect", "name": "mcqChoiceCorrect", "value": choice.id, "type": correctCheckType }]
                    ]],
                    ["td", [
                        ["button.btn btn-outline-danger question-editor-choice-delete", { "#": "deleteChoiceButton", "value": choice.id }, [
                            ["img", { "src": libD.getIcon("actions/list-remove"), "alt": this._("Remove") }]
                        ]]
                    ]]
                ]], newChoiceRefs);

                FormatUtils.textFormat(choice.html, newChoiceRefs.wordingTD, true);
                newChoiceRefs.wordingCorrect.checked = choice.correct;

                if (choice.automaton !== undefined) {
                    const designerDiv = libD.jso2dom(["div#quiz-automata-designer"]);
                    const designer = new AudeDesigner(designerDiv, true);
                    designer.setAutomatonCode(automaton_code(choice.automaton));
                    designer.autoCenterZoom();
                    newChoiceRefs.detailsTD.appendChild(designerDiv);
                } else if (choice.regex !== undefined) {
                    FormatUtils.textFormat(
                        FormatUtils.regexp2Latex(choice.regex),
                        newChoiceRefs.detailsTD
                    );
                } else if (choice.grammar !== undefined) {
                    const gd = new GrammarDesigner(newChoiceRefs.detailsTD, false);
                    gd.setGrammar(choice.grammar);
                }

                /** Deletion button binding. */
                newChoiceRefs.deleteChoiceButton.onclick = (e) => {
                    let index_for_removal = -1;
                    for (let i = 0; i < this.mcqChoices.length; i++) {
                        if (this.mcqChoices[i].id === choice.id) {
                            index_for_removal = i;
                            break;
                        }
                    }

                    if (index_for_removal === -1) {
                        return;
                    }
                    this.mcqChoices.splice(index_for_removal, 1);

                    for (let i = 0; i < this.mcqChoices.length; i++) {
                        this.mcqChoices[i].id = String.fromCodePoint("a".codePointAt(0) + i);
                    }

                    this.redraw();
                };

                newChoiceRefs.wordingCorrect.onchange = (e) => { this.parseMCQSpecificComponents(); };

                this.mcqRefs.choiceTableBody.appendChild(newChoiceTR);
            }
        }
    }
}