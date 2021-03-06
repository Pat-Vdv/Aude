/**
 * This class provides a component to edit and create questions.
 */
class QuestionEditor {
    private readonly _ = window.AudeGUI.l10n;

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
                ["div#question-editor-textinput-validation-audescript", { "#": "audescriptContent" }]
            ]]
        ]];
    /** The object (to be passed to jso2dom) for the specific inputs for a MCQQuestion */
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
            ["div.card-header", { "#": "choiceCardHeader" }, window.AudeGUI.l10n("New Choice")],
            ["div.card-body", [
                ["input.form-control", { "#": "newChoiceText", "type": "text", "placeholder": window.AudeGUI.l10n("Text/HTML/LaTeX for the choice here.") }],
                ["div", { "#": "newChoiceTextPreview" }],
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
                ["button.btn btn-primary btn-block", { "#": "newChoiceAddButton" }, window.AudeGUI.l10n("Add this choice to the question")],
                ["div.row question-editor-hidden", { "#": "choiceEditButtonBar" }, [
                    ["div.col-sm-6", [
                        ["button.btn btn-primary btn-block", { "#": "choiceEditApplyButton" }, window.AudeGUI.l10n("Apply")]
                    ]],
                    ["div.col-sm-6", [
                        ["button.btn btn-danger btn-block", { "#": "choiceEditCancelButton" }, window.AudeGUI.l10n("Cancel")]
                    ]]
                ]]
            ]]
        ]]
    ]];
    /** The object (for jso2dom) for the help attached to constraint input for AutomatonEquivQuestions. */
    private static readonly AUTOEQUIV_CONSTRAINT_HELP = ["small.text-muted", [
        ["ul", [
            ["li", window.AudeGUI.l10n("Every constraint must return an object of the form {correct: boolean, details: string}")],
            ["li", window.AudeGUI.l10n("The user's answer is available through the variable called a, re or g if it's an automaton, a regular expression or a grammar")]
        ]]
    ]];
    /** The object (to be passed to jso2dom) for the specific inputs for a AutomatonEquivQuestions */
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

    /** The HTMLElement containing this question editor. */
    container: HTMLElement;

    /**
     * The question currently being edited by this editor.
     * NEVER get it directly from here, as it will be missing some information
     * that can only be parsed at the time of retrieval.
     * Use getCurrentQuestion instead.
     * @see getCurrentQuestion
     */
    private currentQuestion: Question;

    /** Couple containing the input elements for the wording details. */
    private readonly wordingDetailInputs: [AudeDesigner | HTMLInputElement | GrammarDesigner, AudeDesigner | HTMLInputElement | GrammarDesigner]
        = [undefined, undefined];
    /** The HTML DOM References for the common inputs. */
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
    /** The HTML DOM References for the inputs specific to the text input questions. */
    private readonly textInputRefs = {
        radioWordlist: undefined as HTMLInputElement,
        radioAudescript: undefined as HTMLInputElement,
        wordlistContent: undefined as HTMLInputElement,
        audescriptContent: undefined as HTMLElement
    };
    /** The Ace editor object for the text input validator audescript code. */
    private aceEditorAudescript: AceAjax.Editor;

    // Fields for MCQ Questions.
    /** The HTML DOM References for the inputs specific to MCQ questions. */
    private readonly mcqRefs = {
        choiceTableBody: undefined as HTMLTableSectionElement,
        singleCheckbox: undefined as HTMLInputElement,
        newChoiceText: undefined as HTMLInputElement,
        newChoiceTextPreview: undefined as HTMLElement,
        newChoiceDetailType: undefined as HTMLSelectElement,
        newChoiceAddButton: undefined as HTMLButtonElement,
        newChoiceDetailContent: undefined as HTMLElement,

        choiceEditApplyButton: undefined as HTMLButtonElement,
        choiceCardHeader: undefined as HTMLElement,
        choiceEditButtonBar: undefined as HTMLElement,
        choiceEditCancelButton: undefined as HTMLButtonElement
    };
    /** Array containing choices for the currently edited MCQ Question. */
    private readonly mcqChoices: Array<{
        id?: string,
        text?: string,
        html?: string,
        automaton?: Automaton,
        regex?: string,
        grammar?: linearGrammar,
        correct?: boolean
    }> = [];
    /** The input for a new choice's detail in an MCQ question. */
    private mcqChoiceDetailInput: AudeDesigner | HTMLInputElement | GrammarDesigner;
    /** Stores the choice that is currently being edited. 
     * If instead a new choice is being created, this will be undefined. */
    private mcqCurrentlyEditingChoiceId: string;

    // Fields for AutomatonEquiv Questions
    /** The HTML DOM References for the inputs specific to automaton equivalency questions. */
    private readonly autoEquivRefs = {
        usersAnswerTypeSelect: undefined as HTMLSelectElement,
        referenceTypeSelect: undefined as HTMLSelectElement,
        referenceEditContent: undefined as HTMLElement,
        constraintList: undefined as HTMLUListElement,
        addConstraintButton: undefined as HTMLButtonElement
    };
    /** The input object for the reference structure in an autoequiv question. */
    private autoEquivReferenceInput: AudeDesigner | HTMLInputElement | GrammarDesigner;
    /** Array of the Ace editors for each constraint of an Automaton Equiv question. */
    private readonly autoEquivConstraintEditors: AceAjax.Editor[] = [];

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

    /** Parses the input and returns the currently edited question. */
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

    /** Sets the current question to the given one. */
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

    /**
     * Displays the input element for one of the wording details, of the given type,
     * and saves it to wordingDetailInputs.
     * @param detailIndex - The index of the wording detail to show input for (0 or 1)
     * @param type - The type of the wording detail input.
     */
    private displayWordingDetailInput(detailIndex: 0 | 1, type: AutomatonDataType) {
        const htmlDiv = (detailIndex === 0 ? this.commonRefs.fig1Content : this.commonRefs.fig2Content);

        htmlDiv.innerHTML = "";

        switch (type) {
            case AutomatonDataType.Automaton: {
                this.wordingDetailInputs[detailIndex] = AutomatonIO.getNewAutomatonEditor(htmlDiv);
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

    /** Initializes the components specific to text input questions. */
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

        if (this.aceEditorAudescript !== undefined) {
            this.aceEditorAudescript.destroy();
            this.aceEditorAudescript.container.remove();
        }
        this.aceEditorAudescript = ace.edit(this.textInputRefs.audescriptContent);
        this.aceEditorAudescript.getSession().setOption("useWorker", false);
        this.aceEditorAudescript.getSession().setMode("ace/mode/audescript");
        this.aceEditorAudescript.resize(true);

        // If set retrieve values from the question (for editing questions).
        if (tiq.answerValidatorAS) {
            this.textInputRefs.radioWordlist.checked = false;
            this.textInputRefs.radioAudescript.checked = true;
            this.aceEditorAudescript.getSession().setValue(tiq.answerValidatorAS);
            this.textInputRefs.radioAudescript.dispatchEvent(new Event("change"));
        } else {
            this.textInputRefs.radioWordlist.checked = true;
            this.textInputRefs.radioAudescript.checked = false;
            this.textInputRefs.wordlistContent.value = tiq.correctAnswers.join(",");
            this.textInputRefs.radioWordlist.dispatchEvent(new Event("change"));
        }
    }

    /** Parses the input components specific to text input questions 
     * and places this data in currentQuestion. */
    private parseTextInputSpecificComponents() {
        const qti = (this.currentQuestion) as TextInputQuestion;
        // Word list.
        if (this.textInputRefs.radioWordlist.checked) {
            qti.correctAnswers = this.textInputRefs.wordlistContent.value.split(",").map((v, i, a) => { return v.trim(); });
            qti.answerValidatorAS = undefined;
            qti.answerValidatorAS = undefined;
        } else {
            qti.answerValidatorAS = this.aceEditorAudescript.getSession().getValue();
            qti.answerValidator = eval("(q) => { " + audescript.toJS(qti.answerValidatorAS).code + " } ");
        }
    }

    /** Initializes the components specific to MCQ questions. */
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

        this.mcqRefs.newChoiceText.onchange = this.mcqRefs.newChoiceText.onkeyup = (e) => {
            try {
                this.mcqRefs.newChoiceText.classList.remove("is-invalid");
                FormatUtils.textFormat(
                    this.mcqRefs.newChoiceText.value,
                    this.mcqRefs.newChoiceTextPreview,
                    true
                );
            } catch (e) {
                this.mcqRefs.newChoiceText.classList.add("is-invalid");
            }
        };

        // If they exist, put the current question's choices into this editor's.
        for (const choice of mcq.wordingChoices) {
            const choiceC: any = choice;
            choiceC.correct = (mcq.correctChoices.includes(choiceC.id));
            this.mcqChoices.push(choiceC);
        }
        this.redraw();

        const getChoiceFromInputs = (id?: string) => {
            // If ID hasn't been given, we create a new one, since we will add a new choice.
            if (id === undefined) {
                id = "a";

                const choiceIdExists = (choiceId: string): boolean => {
                    for (const choice of this.mcqChoices) {
                        if (choice.id === choiceId) {
                            return true;
                        }
                    }
                    return false;
                };

                while (choiceIdExists(id)) {
                    id = String.fromCodePoint(id.codePointAt(0) + 1);
                }
            }

            let choice: {
                id?: string,
                text?: string,
                html?: string,
                automaton?: Automaton,
                regex?: string,
                grammar?: linearGrammar,
                correct?: boolean
            };

            for (const c of this.mcqChoices) {
                if (c.id === id) {
                    choice = c;
                }
            }

            if (choice === undefined) {
                choice = {
                    id: id,
                    text: undefined,
                    html: undefined,
                    automaton: undefined as Automaton,
                    regex: undefined as string,
                    grammar: undefined as linearGrammar
                };
            }

            choice.html = this.mcqRefs.newChoiceText.value;

            if (this.mcqRefs.newChoiceDetailType.value !== "None") {
                switch (AutomatonDataType[this.mcqRefs.newChoiceDetailType.value]) {
                    case AutomatonDataType.Automaton: {
                        if (this.mcqChoiceDetailInput instanceof AudeDesigner) {
                            choice.automaton = this.mcqChoiceDetailInput.getAutomaton(0);
                        }
                        break;
                    }

                    case AutomatonDataType.Regexp: {
                        if (this.mcqChoiceDetailInput instanceof HTMLInputElement) {
                            choice.regex = this.mcqChoiceDetailInput.value;
                        }
                        break;
                    }

                    case AutomatonDataType.LinearGrammar: {
                        if (this.mcqChoiceDetailInput instanceof GrammarDesigner) {
                            choice.grammar = this.mcqChoiceDetailInput.getGrammar();
                        }
                        break;
                    }
                }
            }

            return choice;
        };

        const cleanMCQInputs = () => {
            this.mcqRefs.newChoiceTextPreview.innerHTML = "";

            this.mcqRefs.newChoiceText.value = "";
            this.mcqRefs.newChoiceDetailType.selectedIndex = 0;
            this.mcqRefs.newChoiceDetailType.dispatchEvent(new Event("change"));
        };

        this.mcqRefs.newChoiceAddButton.onclick = (e) => {
            const newChoice = getChoiceFromInputs();

            this.mcqChoices.push(newChoice);
            cleanMCQInputs();
            this.redraw();
        };

        this.mcqRefs.choiceEditApplyButton.onclick = (e) => {
            if (this.mcqCurrentlyEditingChoiceId === undefined) {
                return;
            }

            const choice = getChoiceFromInputs(this.mcqCurrentlyEditingChoiceId);

            let choiceIndex: number;
            for (let i = 0; i < this.mcqChoices.length; i++) {
                if (this.mcqChoices[i].id === this.mcqCurrentlyEditingChoiceId) {
                    choiceIndex = i;
                }
            }

            if (choiceIndex) {
                this.mcqChoices[choiceIndex] = choice;
            }

            cleanMCQInputs();

            this.mcqCurrentlyEditingChoiceId = undefined;
            this.mcqRefs.choiceCardHeader.innerHTML = this._("New Choice");
            this.mcqRefs.choiceEditButtonBar.classList.add("question-editor-hidden");
            this.mcqRefs.newChoiceAddButton.classList.remove("question-editor-hidden");
            this.redraw();
        };

        this.mcqRefs.choiceEditCancelButton.onclick = (e) => {
            cleanMCQInputs();

            this.mcqCurrentlyEditingChoiceId = undefined;
            this.mcqRefs.choiceCardHeader.innerHTML = this._("New Choice");
            this.mcqRefs.choiceEditButtonBar.classList.add("question-editor-hidden");
            this.mcqRefs.newChoiceAddButton.classList.remove("question-editor-hidden");
            this.redraw();
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
                    this.mcqChoiceDetailInput = AutomatonIO.getNewAutomatonEditor(this.mcqRefs.newChoiceDetailContent);
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

    /** Initializes the components specific to automaton equivalency questions. */
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
                    this.autoEquivReferenceInput = AutomatonIO.getNewAutomatonEditor(this.autoEquivRefs.referenceEditContent);
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
        const newConstraintEditor = () => {
            const newEditorDiv = libD.jso2dom(["div.question-editor-audescript-editor"]);
            const newEditor = ace.edit(newEditorDiv);

            this.autoEquivRefs.constraintList.appendChild(newEditorDiv);
            this.autoEquivConstraintEditors.push(newEditor);

            return newEditor;
        };

        this.autoEquivRefs.addConstraintButton.onclick = newConstraintEditor;

        // If set in question, we retrieve and add editors for the already existing constraints.
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
            const constraintEdit = newConstraintEditor();

            constraintEdit.getSession().setValue(constAS);
        }
    }

    /** Parses the input components specific to automaton equivalency questions 
     * and places this data in currentQuestion. */
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
        for (const cta of this.autoEquivConstraintEditors) {
            const constraintText = cta.getSession().getValue().trim();
            // Skip empty text areas.
            if (constraintText.length === 0) {
                continue;
            }

            switch (usersAnswerType) {
                case AutomatonDataType.Automaton:
                    try {
                        aeq.automatonAnswerConstraints.push(
                            eval(
                                "(a, q) => { " + audescript.toJS(constraintText).code + "}"
                            )
                        );
                        aeq.automatonAnswerConstraintsAudescript.push(constraintText);
                    } catch (e) {
                        window.AudeGUI.notify(this._("Audescript error"), e.message, "error");
                    }
                    break;

                case AutomatonDataType.Regexp:
                    try {
                        aeq.regexpAnswerConstraints.push(
                            eval(
                                "(re, q) => { " + audescript.toJS(constraintText).code + "}"
                            )
                        );
                        aeq.regexpAnswerConstraintsAudescript.push(constraintText);
                    } catch (e) {
                        window.AudeGUI.notify(this._("Audescript error"), e.message, "error");
                    }

                    break;

                case AutomatonDataType.LinearGrammar:
                    try {
                        aeq.grammarAnswerConstraints.push(
                            eval(
                                "(g, q) => { " + audescript.toJS(constraintText).code + "}"
                            )
                        );
                        aeq.grammarAnswerConstraintsAudescript.push(constraintText);
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

    /** 
     * Refreshes the display of this editor. 
     * If the current question is an MCQ, it updates its choices' list display.
     */
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
                    btnMoveOrderDown: undefined as HTMLButtonElement,
                    editChoiceButton: undefined as HTMLButtonElement
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
                        ]],
                        ["button.btn btn-outline-secondary question-editor-choice-edit", { "#": "editChoiceButton", "value": choice.id }, [
                            ["img", { "src": libD.getIcon("actions/document-edit"), "alt": this._("Edit") }]
                        ]]
                    ]]
                ]], newChoiceRefs);

                FormatUtils.textFormat(choice.html, newChoiceRefs.wordingTD, true);
                newChoiceRefs.wordingCorrect.checked = choice.correct;

                if (choice.automaton !== undefined) {
                    AutomatonIO.displayAutomaton(newChoiceRefs.detailsTD, choice.automaton);
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

                newChoiceRefs.editChoiceButton.onclick = (e) => {
                    this.mcqRefs.choiceCardHeader.innerHTML = this._("Edit Choice");

                    this.mcqRefs.choiceEditButtonBar.classList.remove("question-editor-hidden");
                    this.mcqRefs.newChoiceAddButton.classList.add("question-editor-hidden");

                    let foundChoice: {
                        id?: string,
                        text?: string,
                        html?: string,
                        automaton?: Automaton,
                        regex?: string,
                        grammar?: linearGrammar,
                        correct?: boolean
                    };
                    for (const c of this.mcqChoices) {
                        if (c.id === (e.currentTarget as HTMLButtonElement).value) {
                            foundChoice = c;
                        }
                    }

                    if (foundChoice === undefined) {
                        return; // shouldn't happen.
                    }

                    this.mcqCurrentlyEditingChoiceId = foundChoice.id;
                    this.mcqRefs.newChoiceText.value = foundChoice.html;
                    this.mcqRefs.newChoiceText.dispatchEvent(new Event("change"));

                    let detailType: AutomatonDataType;
                    if (foundChoice.automaton) {
                        detailType = AutomatonDataType.Automaton;
                    } else if (foundChoice.regex) {
                        detailType = AutomatonDataType.Regexp;
                    } else if (foundChoice.grammar) {
                        detailType = AutomatonDataType.LinearGrammar;
                    }

                    if (detailType === undefined) {
                        this.mcqRefs.newChoiceDetailType.value = "None";
                    } else {
                        this.mcqRefs.newChoiceDetailType.value = AutomatonDataType[detailType];
                    }
                    this.mcqRefs.newChoiceDetailType.dispatchEvent(new Event("change"));

                    switch (detailType) {
                        case AutomatonDataType.Automaton:
                            const ad = this.mcqChoiceDetailInput as AudeDesigner;
                            ad.setAutomatonCode(automaton_code(foundChoice.automaton));
                            ad.autoCenterZoom();
                            break;

                        case AutomatonDataType.Regexp:
                            (this.mcqChoiceDetailInput as HTMLInputElement).value = foundChoice.regex;
                            break;

                        case AutomatonDataType.LinearGrammar:
                            (this.mcqChoiceDetailInput as GrammarDesigner).setGrammar(foundChoice.grammar);
                            break;
                    }

                    newChoiceRefs.deleteChoiceButton.disabled = true;
                };

                this.mcqRefs.choiceTableBody.appendChild(newChoiceTR);
            }
        }
    }
}
