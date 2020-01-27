/**
 * This namespace contains utilities to display, or show inputs for automata.
 */
namespace AutomatonIO {
    const AudeGUI = window.AudeGUI;
    const _ = AudeGUI.l10n;

    /** JSON Object Content for the automaton display (readonly). For libD.jso2dom. */
    const AUTOMATON_DISPLAY_CONTENT = ["div.automaton-svg-display", [
        ["div", {"#": "alphabetDiv"}],
        ["div.automaton-display-svg", {"#": "automatonDiv"}, [
            ["div.spinner-border", {"role": "status"}, [
                ["span.sr-only", _("Rendering...")]
            ]]
        ]]
    ]];
    /** JSON Object Content for the automaton editable (editable). For libD.jso2dom. */
    const AUTOMATON_EDITOR_CONTENT = ["div.automaton-designer border border-primary rounded", [
        ["div", {"#": "alphabetDiv"}],
        ["div.automaton-designer-input", { "#": "designerDiv" }],
        ["div.row", [
            ["div.col-sm-1", [
                ["button.btn btn-outline-primary", { "#": "redrawButton" }, _("Redraw")]
            ]],
            ["div.col-sm-1"],
            ["div.col-sm-2", [
                ["button.btn btn-outline-secondary", {"#": "autocenterButton"}, _("Autocenter")]
            ]]
        ]]
    ]];

    /**
     * Creates an editable automaton designer in a given div.
     * If the given div has any content, it will be cleared.
     * @param div 
     * @param auto - If set, the designer will contain this automaton at the start.
     * @returns The created AudeDesigner object, for further manipulation.
     */
    export function getNewAutomatonEditor(div: HTMLElement, auto?: Automaton): AudeDesigner {
        div.innerHTML = "";

        const refs = {
            designerDiv: undefined as HTMLElement,
            redrawButton: undefined as HTMLButtonElement,
            alphabetDiv: undefined as HTMLElement,
            autocenterButton: undefined as HTMLButtonElement
        };

        div.appendChild(libD.jso2dom(AUTOMATON_EDITOR_CONTENT, refs));

        const designer = new AudeDesigner(refs.designerDiv, false);

        if (auto !== undefined) {
            designer.setAutomatonCode(automaton_code(auto));
        }

        refs.redrawButton.onclick = (e) => {
            Convert.dot2svg(designer.getDot()).then((svg) => {
                designer.setSVG(svg);
            });
        };

        refs.autocenterButton.onclick = (e) => {
            designer.autoCenterZoom();
        };

        // TODO : Add a way to create a new state where double clicking isn't possible (mobile devices).
        //createNewStateButton(div);

        setTimeout(() => {
            designer.redraw();
            designer.autoCenterZoom();
        }, 10);

        return designer;
    }

    /**
     * Shows the given automaton as readonly in the given div.
     * @param div 
     * @param auto 
     */
    export function displayAutomaton(div: HTMLElement, auto: Automaton, showAlphabet = true) {
        const refs = {
            alphabetDiv: undefined as HTMLElement,
            automatonDiv: undefined as HTMLElement
        };

        div.appendChild(libD.jso2dom(AUTOMATON_DISPLAY_CONTENT, refs));

        Convert.automaton2svg(auto).then((svg) => {
            refs.automatonDiv.innerHTML = svg;

            const svgElem = refs.automatonDiv.getElementsByTagName("svg")[0];
            // We remove the white background from the generated svg. 
            // FIXME : Sort of hack-ish, may not always work.
            svgElem.getElementsByTagName("polygon")[0].remove();
            svgElem.removeAttribute("width");
            svgElem.removeAttribute("height");
            svgElem.classList.add("automaton-display-svg");
        });

        if (showAlphabet) {
            FormatUtils.textFormat(
                " $\\Sigma = $ " + FormatUtils.set2Latex(auto.getAlphabet()),
                refs.alphabetDiv
            );
        }
    }
}
