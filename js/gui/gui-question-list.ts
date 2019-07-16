/**
 * "Static class" that handles the question list.
 */
class QuestionList {
    _ = window.AudeGUI.l10n;

    /** The libD window object for the Question List */
    static win: any;

    /** Reference to the HTML element containing the question list. */
    static questionList: HTMLElement;
    /** HTML Button element that corresponds to the currently selected chapter. */
    static selectedChapterButton: HTMLButtonElement = undefined;

    static selectedChapter: number = undefined;

    static load(): void { return; }
    static run(): void { QuestionList.openQuestionList(); }

    /** Question list window's content as JSON array (to be fed into libD.jso2dom) */
    static readonly questionWindowContent = (
        ["div#questionList.libD-ws-colors-auto libD-ws-size-auto", { "#": "root" }, [
            ["div#questionList-container-button-navigation",
                [
                    ["button#generate-automaton-specification-questionList", { "#": "btnSettings" }, window.AudeGUI.l10n("Settings")],
                    ["button#close-questionList", { "#": "btnClose" }, window.AudeGUI.l10n("x")],
                    ["button#questionList-btnbar-chapterMenu", { "#": "btnChapterMenu" }, window.AudeGUI.l10n("Return to chapter menu")]
                ]
            ],
            ["div#questionList-container", [
                // Contains the chapter, and question
                ["div#questionList-selection-chapter", [
                    // To select the chapter
                    ["button.questionList-selection-chapter-cell-button",
                        { "value": "1" },
                        window.AudeGUI.l10n("Deterministic finite state machines")
                    ],

                    ["button.questionList-selection-chapter-cell-button",
                        { "value": "2" },
                        window.AudeGUI.l10n("Non-deterministic finite state machines")
                    ],

                    ["button.questionList-selection-chapter-cell-button",
                        { "value": "3" },
                        window.AudeGUI.l10n("Non-deterministic finite state machines with ε-transitions")
                    ],

                    ["button.questionList-selection-chapter-cell-button",
                        { "value": "4" },
                        window.AudeGUI.l10n("Regular expressions and Kleene's theorem")
                    ],

                    ["button.questionList-selection-chapter-cell-button",
                        { "value": "5" },
                        window.AudeGUI.l10n("Regular grammars")
                    ],

                    ["button.questionList-selection-chapter-cell-button",
                        { "value": "6" },
                        window.AudeGUI.l10n("Non-regular langages")
                    ],
                ]],

                ["div#questionList-selection-question",
                    { "#": "chapterContentDiv", "style": "min-height:5%" },
                    window.AudeGUI.l10n("Select a chapter from the ones above to see its questions here.")
                ],
            ]],
        ]]
    );

    /** Returns the JSON array corresponding to a question button with the value and text given. */
    static getQuestionButton(value: string, text: string) {
        return ["button.questionList-question-select", { "value": value }, text];
    }

    /** Array of the question button element's JSON for each chapter. */
    static readonly chapterQuestionLists = [
        [
            QuestionList.getQuestionButton("MCQ_C1", window.AudeGUI.l10n("Multiple choice questions")), ["br"],
            QuestionList.getQuestionButton("Complement", window.AudeGUI.l10n("Complement an automaton")), ["br"],
            QuestionList.getQuestionButton("Complete", window.AudeGUI.l10n("Complete an automaton")), ["br"],
            QuestionList.getQuestionButton("Product", window.AudeGUI.l10n("Find the product of 2 automata")), ["br"],
            QuestionList.getQuestionButton("Minimize", window.AudeGUI.l10n("Minimize an automaton")), ["br"],
            QuestionList.getQuestionButton("EquivalentStates", window.AudeGUI.l10n("List all the equivalent states of an automaton")), ["br"],
            QuestionList.getQuestionButton("EquivalentAutomata", window.AudeGUI.l10n("Equivalency between 2 automata")), ["br"],
            //QuestionList.getQuestionButton("Automaton2Table", window.AudeGUI.l10n("Give the tabular form of the automaton")), ["br"],
            //QuestionList.getQuestionButton("Table2Automaton", window.AudeGUI.l10n("Give the automaton from the table")), ["br"],
            QuestionList.getQuestionButton("Reachable", window.AudeGUI.l10n("List all reachable states of an automaton")), ["br"],
            QuestionList.getQuestionButton("Coreachable", window.AudeGUI.l10n("List all co-reachable states of an automaton")), ["br"],
            QuestionList.getQuestionButton("RecognizeLanguageAutomaton", window.AudeGUI.l10n("Give an automaton that recognizes a given language")), ["br"],
            QuestionList.getQuestionButton("Word", window.AudeGUI.l10n("Give a word recognized by an automaton")), ["br"],
        ],
        [
            QuestionList.getQuestionButton("MCQ_C2", window.AudeGUI.l10n("Multiple choice questions")), ["br"],
            QuestionList.getQuestionButton("Determinize", window.AudeGUI.l10n("Determinize an automaton")), ["br"],
            QuestionList.getQuestionButton("Determinize_Minimize", window.AudeGUI.l10n("Determinize and minimize an automaton")), ["br"],
            QuestionList.getQuestionButton("WordNonDet", window.AudeGUI.l10n("Give a word recognized by an automaton")), ["br"],
        ],
        [
            QuestionList.getQuestionButton("MCQ_C3", window.AudeGUI.l10n("Multiple choice questions")), ["br"],
            QuestionList.getQuestionButton("EliminateEpsilon", window.AudeGUI.l10n("Eliminate the ε-transitions from an automaton")), ["br"],
            QuestionList.getQuestionButton("Determinize_EliminateEpsilon", window.AudeGUI.l10n("Determinize an automaton and eliminate its ε-transitions")), ["br"],
            QuestionList.getQuestionButton("WordEpsilon", window.AudeGUI.l10n("Give a word recognized by an automaton")), ["br"],
        ],
        [
            QuestionList.getQuestionButton("MCQ_C4", window.AudeGUI.l10n("Multiple choice questions")), ["br"],
            QuestionList.getQuestionButton("Automaton2Regexp", window.AudeGUI.l10n("Give a regular expression equivalent to an automaton")), ["br"],
            QuestionList.getQuestionButton("Regexp2Automaton", window.AudeGUI.l10n("Give an automaton equivalent to a regular expression")), ["br"],
            QuestionList.getQuestionButton("RecognizeLanguageRegexp", window.AudeGUI.l10n("Give a regular expression that recognizes a given language")), ["br"],
            QuestionList.getQuestionButton("WordRegexp", window.AudeGUI.l10n("Give a word recognized by a regular expression")), ["br"],
        ],
        [
            QuestionList.getQuestionButton("MCQ_C5", window.AudeGUI.l10n("Multiple choice questions")), ["br"],
            QuestionList.getQuestionButton("Grammar2Automaton", window.AudeGUI.l10n("Give an automaton equivalent to a right linear grammar")), ["br"],
            QuestionList.getQuestionButton("Automaton2Grammar", window.AudeGUI.l10n("Give a right linear grammar equivalent to an automaton")), ["br"],
            QuestionList.getQuestionButton("LeftGrammar2RightGrammar", window.AudeGUI.l10n("Convert a left linear grammar to a right linear grammar")), ["br"],
            QuestionList.getQuestionButton("WordGrammar", window.AudeGUI.l10n("Give a word recognized by a linear grammar")), ["br"],
        ],
        [
            QuestionList.getQuestionButton("MCQ_C6", window.AudeGUI.l10n("Multiple choice questions")), ["br"],
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
        const refs = {
            btnSettings: undefined as HTMLButtonElement,
            root: undefined as HTMLElement,
            btnClose: undefined as HTMLButtonElement,
            chapterContentDiv: undefined as HTMLElement,
            btnChapterMenu: undefined as HTMLButtonElement,
        };
        QuestionList.win = libD.newWin({
            title: window.AudeGUI.l10n("Question List"),
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
        const chapterButtons = document.getElementsByClassName("questionList-selection-chapter-cell-button");

        for (const chapBtn of chapterButtons as HTMLCollectionOf<HTMLButtonElement>) {
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
            return ["span.questionList-question", window.AudeGUI.l10n("This chapter doesn't contain any question (yet)...")];
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
        const questionButtons =
            document.getElementsByClassName("questionList-question-select") as HTMLCollectionOf<HTMLButtonElement>;

        for (const qBtn of questionButtons) {
            qBtn.onclick = (e) => {
                const currentButton = e.target as HTMLButtonElement;
                const qSubtype: QuestionSubType = QuestionSubType[currentButton.value.trim()];
                if (qSubtype === undefined) {
                    window.AudeGUI.notify(window.AudeGUI.l10n("Error !"), window.AudeGUI.l10n("Unknown question type : ") + currentButton.value, "error");
                    return;
                }

                document.getElementById("questionList-btnbar-chapterMenu").style.display = "unset";
                document.getElementById("questionList-selection-chapter").style.display = "none";
                QuestionList.initiateNewQuestion(qSubtype, chapterContentDiv);
            };
        }
    }

    /**
     * Creates, and starts execution of a new question of a given subtype.
     * @param qSubtype - The subtype of the question to launch.
     * @param div - The Element in which to display the question.
     */
    static initiateNewQuestion(qSubtype: QuestionSubType, div: HTMLElement) {
        const questionGen = new QuestionGenerator();
        const q = questionGen.generateFromSubtype(qSubtype);
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
        const refs = {
            btnValidate: undefined as HTMLButtonElement ,
            btnRestart: undefined as HTMLElement
        };
        div.appendChild(
            libD.jso2dom(["div#question-answer-button-container", [
                ["button#question-validate", { "#": "btnValidate" }, window.AudeGUI.l10n("Check my answer")],
                ["button#question-restart", { "#": "btnRestart" }, window.AudeGUI.l10n("Skip this question")]
            ]], refs)
        );

        refs.btnValidate.onclick = (e) => {
            if (q.parseUsersAnswer()) {
                console.error("Couldn't parse the user's input !");
            }

            const correction = q.checkUsersAnswer();
            if (correction.correct) {
                window.AudeGUI.notify(window.AudeGUI.l10n("Success !"), window.AudeGUI.l10n("Your answer was correct ! Moving you to a new question..."), "ok", 4000);
                setTimeout(
                    () => {
                        QuestionList.initiateNewQuestion(q.subtype, div);
                    },
                    1500);
            } else {
                window.AudeGUI.notify(window.AudeGUI.l10n("Incorrect !"), correction.details, "error", 4000);
            }
        };

        refs.btnRestart.onclick = (e) => {
            QuestionList.initiateNewQuestion(q.subtype, div);
        };
    }

    static openRandomGenerationSettings() {
        return;
    }

    /** Hides the question list window. */
    static close() {
        if (!QuestionList.questionList || !QuestionList.win) {
            return;
        }
        QuestionList.win.minimize();
    }
}
window.AudeGUI.QuestionList = QuestionList;