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
        static selectedChapterButton: HTMLButtonElement = undefined;

        static selectedChapter: number = undefined;

        static load(): void { }
        static run(): void { QuestionList.openQuestionList(); }

        /** Question list window's content as JSON array (to be fed into libD.jso2dom) */
        static readonly questionWindowContent = (
            ["div#questionList.libD-ws-colors-auto libD-ws-size-auto", { "#": "root" }, [
                ["div#questionList-container-button-navigation",
                    [
                        ["button#generate-automaton-specification-questionList", { "#": "btnSettings" }, _("Settings")],
                        ["button#close-questionList", { "#": "btnClose" }, _("x")],
                        ["button#questionList-btnbar-chapterMenu", { "#": "btnChapterMenu" }, _("Return to chapter menu")]
                    ]
                ],
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
                            _("Regular expressions and Kleene's theorem")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "5" },
                            _("Regular grammars")
                        ],

                        ["button.questionList-selection-chapter-cell-button",
                            { "value": "6" },
                            _("Non-regular langages")
                        ],
                    ]],

                    ["div#questionList-selection-question",
                        { "#": "chapterContentDiv", "style": "min-height:5%" },
                        _("Select a chapter from the ones above to see its questions here.")
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
                QuestionList.getQuestionButton("Complement", _("Complement an automaton")), ["br"],
                QuestionList.getQuestionButton("Complete", _("Complete an automaton")), ["br"],
                QuestionList.getQuestionButton("Product", _("Find the product of 2 automata")), ["br"],
                QuestionList.getQuestionButton("Minimize", _("Minimize an automaton")), ["br"],
                QuestionList.getQuestionButton("EquivalentStates", _("List all the equivalent states of an automaton")), ["br"],
                QuestionList.getQuestionButton("EquivalentAutomata", _("Equivalency between 2 automata")), ["br"],
                //QuestionList.getQuestionButton("Automaton2Table", _("Give the tabular form of the automaton")), ["br"],
                //QuestionList.getQuestionButton("Table2Automaton", _("Give the automaton from the table")), ["br"],
                QuestionList.getQuestionButton("Reachable", _("List all reachable states of an automaton")), ["br"],
                QuestionList.getQuestionButton("Coreachable", _("List all co-reachable states of an automaton")), ["br"],
                QuestionList.getQuestionButton("RecognizeLanguageAutomaton", _("Give an automaton that recognizes a given language")), ["br"],
                QuestionList.getQuestionButton("Word", _("Give a word recognized by an automaton")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("MCQ_C2", _("Multiple choice questions")), ["br"],
                QuestionList.getQuestionButton("Determinize", _("Determinize an automaton")), ["br"],
                QuestionList.getQuestionButton("Determinize_Minimize", _("Determinize and minimize an automaton")), ["br"],
                QuestionList.getQuestionButton("WordNonDet", _("Give a word recognized by an automaton")), ["br"],
            ],
            [   
                QuestionList.getQuestionButton("MCQ_C3", _("Multiple choice questions")), ["br"],
                QuestionList.getQuestionButton("EliminateEpsilon", _("Eliminate the ε-transitions from an automaton")), ["br"],
                QuestionList.getQuestionButton("Determinize_EliminateEpsilon", _("Determinize an automaton and eliminate its ε-transitions")), ["br"],
                QuestionList.getQuestionButton("WordEpsilon", _("Give a word recognized by an automaton")), ["br"],
            ],
            [   
                QuestionList.getQuestionButton("MCQ_C4", _("Multiple choice questions")), ["br"],
                QuestionList.getQuestionButton("Automaton2Regexp", _("Give a regular expression equivalent to an automaton")), ["br"],
                QuestionList.getQuestionButton("Regexp2Automaton", _("Give an automaton equivalent to a regular expression")), ["br"],
                QuestionList.getQuestionButton("RecognizeLanguageRegexp", _("Give a regular expression that recognizes a given language")), ["br"],
                QuestionList.getQuestionButton("WordRegexp", _("Give a word recognized by a regular expression")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("MCQ_C5", _("Multiple choice questions")), ["br"],
                QuestionList.getQuestionButton("Grammar2Automaton", _("Give an automaton equivalent to a right linear grammar")), ["br"],
                QuestionList.getQuestionButton("Automaton2Grammar", _("Give a right linear grammar equivalent to an automaton")), ["br"],
                QuestionList.getQuestionButton("LeftGrammar2RightGrammar", _("Convert a left linear grammar to a right linear grammar")), ["br"],
                QuestionList.getQuestionButton("WordGrammar", _("Give a word recognized by a linear grammar")), ["br"],
            ],
            [
                QuestionList.getQuestionButton("MCQ_C6", _("Multiple choice questions")), ["br"],
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
            AutomatonPrograms.loadPrograms();

            if (QuestionList.win && QuestionList.win.ws) {
                QuestionList.win.close();
                QuestionList.questionList.parentNode.removeChild(QuestionList.questionList);
            }

            // We create the new window and its contents.
            var refs = {
                btnSettings: <HTMLButtonElement>null, root: <HTMLElement>null,
                btnClose: <HTMLButtonElement>null, chapterContentDiv: <HTMLElement>null,
                btnChapterMenu: <HTMLButtonElement>undefined,
            };
            QuestionList.win = libD.newWin({
                title: _("Question List"),
                show: true,
                fullscreen: true,
                content: libD.jso2dom(QuestionList.questionWindowContent, refs)
            });

            // We bind their action to the settings and close button.
            refs.btnSettings.onclick = QuestionList.openRandomGenerationSettings;
            refs.btnChapterMenu.onclick = QuestionList.drawQuestionList;
            refs.btnChapterMenu.style.display = "none";
            refs.btnClose.onclick = QuestionList.close;

            // We add the action to each of the chapter button.
            let chapterButtons = document.getElementsByClassName("questionList-selection-chapter-cell-button");

            for (let chapBtn of chapterButtons as HTMLCollectionOf<HTMLButtonElement>) {
                chapBtn.addEventListener("click", e => {
                    if (QuestionList.selectedChapterButton) {
                        // Change color of the previously selected chapter button.
                        QuestionList.selectedChapterButton.classList.remove("questionList-selected");
                    }

                    QuestionList.selectedChapterButton = e.target as HTMLButtonElement;
                    QuestionList.selectedChapterButton.classList.add("questionList-selected");

                    QuestionList.selectedChapter = parseInt(QuestionList.selectedChapterButton.value, 10);
                    QuestionList.drawQuestionsForChapter(QuestionList.selectedChapter, refs.chapterContentDiv);
                });

                if (QuestionList.selectedChapter !== undefined && parseInt(chapBtn.value, 10) === QuestionList.selectedChapter) {
                    chapBtn.classList.add("questionList-selected");
                    QuestionList.selectedChapterButton = chapBtn;
                }
            }

            QuestionList.questionList = refs.root;

            // If a chapter was previously selected, display its questions.
            if (QuestionList.selectedChapter !== undefined) {
                QuestionList.drawQuestionsForChapter(QuestionList.selectedChapter, refs.chapterContentDiv);
            }
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
                return ["span.questionList-question", _("This chapter doesn't contain any question (yet)...")];
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

                    document.getElementById("questionList-btnbar-chapterMenu").style.display = "unset";
                    document.getElementById("questionList-selection-chapter").style.display = "none";
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
            let questionGen = new QuestionGenerator();
            let q = questionGen.generateFromSubtype(qSubtype);
            QuestionList.startQuestion(q, div);
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
                libD.jso2dom(["div#question-answer-button-container", [
                    ["button#question-validate", { "#": "btnValidate" }, _("Check my answer")],
                    ["button#question-restart", { "#": "btnRestart" }, _("Skip this question")]
                ]], refs)
            );

            refs.btnValidate.onclick = (e) => {
                if (q.parseUsersAnswer()) {
                    console.error("Couldn't parse the user's input !");
                }

                let correction = q.checkUsersAnswer()
                if (correction.correct) {
                    AudeGUI.notify(_("Success !"), _("Your answer was correct ! Moving you to a new question..."), "ok", 4000);
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