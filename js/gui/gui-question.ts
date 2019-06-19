/// <reference path="../typings/libD.d.ts"/>
/// <reference path="../typings/aude.d.ts"/>
/// <reference path="../typings/automaton.d.ts"/>
/// <reference path="../typings/linearGrammar.d.ts"/>
/// <reference path="../typings/katex.d.ts" />

(function (pkg) {
    let AudeGUI = window.AudeGUI;
    let _ = window.AudeGUI.l10n;

    /**
     * "Static class" that handles the question list.
     */
    class QuestionList {

        /** The libD window object for the Question List */
        static win: any;

        /** Reference to the HTML element containing the question list. */
        static questionList: HTMLElement = null;
        /** HTML Button element that corresponds to the currently selected chapter. */
        static selectedChapterButton: HTMLButtonElement = null;

        static load(): void { }
        static run(): void { QuestionList.openQuestionList(); }

        /** Question list window's content as JSON array (to be fed into libD.jso2dom) */
        static readonly questionWindowContent = (
            ["div#questionList.libD-ws-colors-auto libD-ws-size-auto", { "#": "root" }, [
                ["button#generate-automaton-specification-questionList", { "#": "btnSettings" }, _("Settings")],
                ["div#questionList-container-button-navigation", [
                    ["button#close-questionList", { "#": "btnClose" }, _("Close the question list")]]],
                ["div#questionList-container", [
                    // Contains the chapter, and question
                    ["div#questionList-selection-chapter", [
                        // To select the chapter
                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "1" },
                            _("Deterministic finite state machines")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "2" },
                            _("Non-deterministic finite state machines")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "3" },
                            _("Non-deterministic finite state machines with ε-transitions")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "4" },
                            _("Regular expressions and Kleene theorem")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "5" },
                            _("Grammars and regular grammars")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "6" },
                            _("Non-regular langages and iterative lemma")
                        ],
                    ]],

                    ["div#questionList-selection-question",
                        { "#": "chapterContentDiv", "style": "min-height:5%" },
                        _("No chapter selected.")
                    ],
                ]],
            ]]
        );

        /** Returns the JSON array corresponding to a question button with the value and text given. */
        static getQuestionButton(value: string, text: string) {
            return ["button.questionList-question-select", { "value": value }, text];
        }

        /** Array of the question button element's JSON for each chapter. */
        static readonly chapterQuestionLists = <Array<any>>[
            [
                QuestionList.getQuestionButton("MCQ_C1", _("Multiple choice questions")), ["br"],
                QuestionList.getQuestionButton("Complement", _("Complement the automaton")), ["br"],
                QuestionList.getQuestionButton("Complete", _("Complete the automaton")), ["br"],
                QuestionList.getQuestionButton("Product", _("Do the product of 2 automata")), ["br"],
                QuestionList.getQuestionButton("Minimize", _("Minimize the automaton")), ["br"],
                QuestionList.getQuestionButton("EquivalentStates", _("List all the equivalent states")), ["br"],
                QuestionList.getQuestionButton("EquivalentAutomata", _("Equivalency between 2 automata")), ["br"],
                QuestionList.getQuestionButton("Automaton2Table", _("Give the tabular form of the automaton")), ["br"],
                QuestionList.getQuestionButton("Table2Automaton", _("Give the automaton from the table")), ["br"],
                QuestionList.getQuestionButton("Reachable", _("List the reachable states")), ["br"],
                QuestionList.getQuestionButton("Coreachable", _("List the co-reachable states")), ["br"],
                QuestionList.getQuestionButton("RecognizeLanguageAutomaton", _("Give an automaton that recognizes a given language")), ["br"],
                QuestionList.getQuestionButton("Word", _("Give a word recognized by the automata")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("MCQ_C2", _("Multiple choice questions")), ["br"],
                QuestionList.getQuestionButton("Determinize", _("Determinize the automaton")), ["br"],
                QuestionList.getQuestionButton("Determinize_Minimize", _("Determinize and minimize the automaton")), ["br"],
                QuestionList.getQuestionButton("WordNonDet", _("Give a word recognized by the automata")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("EliminateEpsilon", _("Eliminate the ε-transitions")), ["br"],
                QuestionList.getQuestionButton("Determinize_EliminateEpsilon", _("Determinize and eliminate the ε-transitions")), ["br"],
                QuestionList.getQuestionButton("WordEpsilon", _("Give a word recognized by the automata")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("Automaton2Regexp", _("Give a RE which corresponds to the automaton")), ["br"],
                QuestionList.getQuestionButton("Regexp2Automaton", _("Give the automaton corresponding to the RE")), ["br"],
                QuestionList.getQuestionButton("RecognizeLanguageRegexp", _("Give a regular expression that recognizes a given language")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("Grammar2Automaton", _("Give the automaton corresponding to the right linear grammar")), ["br"],
                QuestionList.getQuestionButton("Automaton2Grammar", _("Give the right linear grammar corresponding to the automaton")), ["br"],
                QuestionList.getQuestionButton("LeftGrammar2RightGrammar", _("Convert the left linear grammar to the right linear grammar")), ["br"],
            ]
        ];

        /** Shows the list of questions. */
        static openQuestionList(): void {
            // If the window already exists, we simply show it.
            if (QuestionList.win && QuestionList.win.ws) {
                QuestionList.win.show();
                return;
            }
            QuestionList.drawQuestionList();
        }

        /** Draws the question list into a new window (if another is already opened, closes it) */
        static drawQuestionList(): void {
            Question.loadPrograms();

            if (QuestionList.win && QuestionList.win.ws) {
                window.close();
                QuestionList.questionList.parentNode.removeChild(QuestionList.questionList);
            }

            // We create the new window and its contents.
            var refs = {
                btnSettings: <HTMLElement>null, root: <HTMLElement>null,
                btnClose: <HTMLElement>null, chapterContentDiv: <HTMLElement>null
            };
            QuestionList.win = libD.newWin({
                title: _("Question List"),
                show: true,
                fullscreen: true,
                content: libD.jso2dom(QuestionList.questionWindowContent, refs)
            });

            // We bind their action to the settings and close button.
            refs.btnSettings.addEventListener("click", e => QuestionList.openRandomGenerationSettings());
            refs.btnClose.addEventListener("click", e => QuestionList.close());

            // We add the action to each of the chapter button.
            let chapterButtons = document.getElementsByClassName("questionList-selection-chapter-cell-button");

            for (let chapBtn of chapterButtons) {
                chapBtn.addEventListener("click", e => {
                    if (QuestionList.selectedChapterButton) {
                        // Change color of the previously selected chapter button.
                        QuestionList.selectedChapterButton.classList.remove("questionList-selected");
                    }

                    QuestionList.selectedChapterButton = e.target as HTMLButtonElement;
                    QuestionList.selectedChapterButton.classList.add("questionList-selected");

                    QuestionList.drawQuestionsForChapter(parseInt(QuestionList.selectedChapterButton.value, 10), refs.chapterContentDiv);
                });
            }

            QuestionList.questionList = refs.root;
        }

        /**
         * Returns the array (to be used in jso2dom) that represents the list of question buttons for 
         * a given chapter. This pulls the array from the field ```chapterQuestionLists```.
         * If the chapter doesn't exist, returns a placeholder node.
         * @see QuestionList#chapterQuestionLists
         * @param chapterNumber - The chapter for which to get the HTML questions.
         */
        static getQuestionsHTMLForChapter(chapterNumber: number) {
            if (chapterNumber >= 1 && chapterNumber <= QuestionList.chapterQuestionLists.length) {
                return QuestionList.chapterQuestionLists[chapterNumber - 1];
            } else {
                return ["span.questionList-question", _("No question")];
            }
        }

        /**
         * Draws a chapter's questions into a specified HTML element.
         * @param chapterNumber - The number of the chapter to draw.
         * @param chapterContentDiv - The HTML element to draw the chapter in.
         */
        static drawQuestionsForChapter(chapterNumber: number, chapterContentDiv: HTMLElement): void {
            chapterContentDiv.textContent = "";

            chapterContentDiv.appendChild(libD.jso2dom(QuestionList.getQuestionsHTMLForChapter(chapterNumber)));

            // We bind its action to each of the question button for this chapter.
            let questionButtons =
                document.getElementsByClassName("questionList-question-select") as HTMLCollectionOf<HTMLButtonElement>;

            for (let qBtn of questionButtons) {
                qBtn.onclick = (e) => {
                    let currentButton = e.target as HTMLButtonElement;
                    let qSubtype: QuestionSubType = QuestionSubType[currentButton.value.trim()];
                    if (qSubtype === undefined) {
                        AudeGUI.notify(_("Error !"), _("Unknown question type : ") + currentButton.value, "error");
                        return;
                    }

                    this.initiateNewQuestion(qSubtype, chapterContentDiv);
                }
            }
        }

        /**
         * Creates, and starts execution of a new question of a given subtype.
         * @param qSubtype - The subtype of the question to launch.
         * @param div - The Element in which to display the question.
         */
        static initiateNewQuestion(qSubtype: QuestionSubType, div: HTMLElement) {
            let q = QuestionList.createQuestionFromSubtype(qSubtype);
            QuestionList.startQuestion(q, div);
        }

        /**
         * Generates question according to the given subtype.
         */
        static createQuestionFromSubtype(qSubtype: QuestionSubType): Question {
            let questionGen = new QuestionGenerator();
            let q = questionGen.generateFromSubtype(qSubtype);

            if (q === undefined) {
                switch (Question.deduceQuestionCategory(qSubtype)) {
                    case QuestionCategory.AutomatonTransformation:
                        q = new AutomatonTransformQuestion(qSubtype);
                        break;

                    case QuestionCategory.MCQ:
                        let wa = new Automaton([0, 1, 2], ["a", "b"], 0);
                        wa.addFinalState(2);
                        wa.addTransition(0, "a", 1);
                        wa.addTransition(1, "a", 2);
                        wa.addTransition(2, "a", 2);
                        wa.addTransition(2, "b", 2);
                        q = new MCQQuestion(qSubtype,
                            [{ text: "owo" },
                            { text: "what's" },
                            { text: "this" },
                            { text: "uWu", correct: true }],
                            true,
                            wa);
                        break;

                    case QuestionCategory.RecognizedWord:
                        q = questionGen.generateFromSubtype(qSubtype);
                        break;

                    case QuestionCategory.NaturalLanguage_Automaton:
                        q = new NaturalLanguage2AutomatonQuestion(qSubtype);
                        let qc = <NaturalLanguage2AutomatonQuestion>q;
                        q.wordingText = "Words that start with two 'a's. Alphabet : {'a', 'b'}";
                        qc.answerMode = AutomatonDataType.LinearGrammar;
                        qc.correctAnswerAutomaton = new Automaton([0, 1, 2], ["a", "b"], 0);
                        qc.correctAnswerAutomaton.addFinalState(2);
                        qc.correctAnswerAutomaton.addTransition(0, "a", 1);
                        qc.correctAnswerAutomaton.addTransition(1, "a", 2);
                        qc.correctAnswerAutomaton.addTransition(2, "a", 2);
                        qc.correctAnswerAutomaton.addTransition(2, "b", 2);

                        break;

                    case QuestionCategory.GrammarTransformation:
                        q = new GrammarTransformationQuestion(qSubtype);
                        let qt = <GrammarTransformationQuestion>q;
                        let g = new linearGrammar(["a", "b"], ["S", "T"], "S");
                        g.addRule("S", "a", "T", "left");
                        g.addRule("T", "b");
                        g.addRule("T", "a", "T", "left");
                        qt.wordingGrammar = g;

                        break;

                    case QuestionCategory.Automaton_Regexp_Conversion:
                        q = new AutomatonRegexpConversionQuestion(qSubtype);
                        let qu = <AutomatonRegexpConversionQuestion>q;
                        if (qSubtype === QuestionSubType.Automaton2Regexp) {
                            qu.wordingDetails = new Automaton([0, 1, 2], ["a", "b"], 0);
                            qu.wordingDetails.addFinalState(2);
                            qu.wordingDetails.addTransition(0, "a", 1);
                            qu.wordingDetails.addTransition(1, "a", 2);
                            qu.wordingDetails.addTransition(2, "a", 2);
                            qu.wordingDetails.addTransition(2, "b", 2);
                        } else if (qSubtype === QuestionSubType.Regexp2Automaton) {
                            qu.wordingDetails = "aa(a+b)*";
                        }

                        break;

                    case QuestionCategory.Automaton_Grammar_Conversion:
                        q = new AutomatonGrammarConversionQuestion(qSubtype);
                        let qr = <AutomatonGrammarConversionQuestion>q;
                        if (qSubtype === QuestionSubType.Automaton2Grammar) {
                            qr.wordingDetails = new Automaton([0, 1, 2], ["a", "b"], 0);
                            qr.wordingDetails.addFinalState(2);
                            qr.wordingDetails.addTransition(0, "a", 1);
                            qr.wordingDetails.addTransition(1, "a", 2);
                            qr.wordingDetails.addTransition(2, "a", 2);
                            qr.wordingDetails.addTransition(2, "b", 2);
                        } else if (qSubtype === QuestionSubType.Grammar2Automaton) {
                            let g = new linearGrammar(["a", "b"], ["S", "T"], "S");
                            g.addRule("S", "a", "T", "right");
                            g.addRule("T", "b");
                            g.addRule("T", "a", "T", "right");
                            qr.wordingDetails = g;
                        }
                        break;

                    case QuestionCategory.AutomatonStatesList:
                        q = new AutomatonStatelistQuestion(qSubtype);
                        let qs = <AutomatonStatelistQuestion>q;
                        qs.wordingAutomaton = new Automaton([0, 1, 2], ["a", "b"], 0);
                        qs.wordingAutomaton.addFinalState(2);
                        qs.wordingAutomaton.addTransition(0, "a", 1);
                        qs.wordingAutomaton.addTransition(1, "a", 2);
                        qs.wordingAutomaton.addTransition(2, "a", 2);
                        qs.wordingAutomaton.addTransition(2, "b", 2);
                        qs.wordingAutomaton.addState(3);

                        break;
                }
            }

            return q;
        }

        /**
         * Displays the question, the buttons for answering, 
         * and sets up validation of that question (showing wrong/false).
         * @param q - The question to present to the user.
         * @param div - The HTML DOM Element to display the question in. Will be cleared.
         */
        static startQuestion(q: Question, div: HTMLElement) {
            div.innerHTML = "";

            // We display the question's details.
            q.displayQuestion(div);

            // We add the question controls.
            let refs = {
                btnValidate: <HTMLButtonElement>null,
                btnRestart: <HTMLElement>null
            };
            div.appendChild(
                libD.jso2dom(["div.button-container", [
                    ["button#question-validate", { "#": "btnValidate" }, _("Validate")],
                    ["button#question-restart", { "#": "btnRestart" }, _("New question")]
                ]], refs)
            );

            refs.btnValidate.onclick = (e) => {
                if (q.parseUsersAnswer()) {
                    console.error("Couldn't parse the user's input !");
                }

                let correction = q.checkUsersAnswer();
                if (correction.correct) {
                    AudeGUI.notify(_("Success !"), _("Your answer was correct !"), "ok", 4000);
                    setTimeout(
                        () => {
                             QuestionList.initiateNewQuestion(q.subtype, div);
                        }, 
                        1500);
                } else {
                    AudeGUI.notify(_("Incorrect !"), correction.details, "error", 4000);
                }
            };

            refs.btnRestart.onclick = (e) => {
                QuestionList.initiateNewQuestion(q.subtype, div);
            };
        }

        static openRandomGenerationSettings() {

        }

        /** Hides the question list window. */
        static close() {
            if (!QuestionList.questionList || !QuestionList.win) {
                return;
            }
            QuestionList.win.minimize();
        }
    }
    AudeGUI.QuestionList = QuestionList;
})(typeof this.exports === "object" ? this.exports : this);