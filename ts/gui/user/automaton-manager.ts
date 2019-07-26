namespace UserAccountGUI {
  const AudeGUI = window.AudeGUI;
  const _ = AudeGUI.l10n;

  /**
   * Class that handles a user's automaton manager.
   */
  export class AutomatonManager {
    private static readonly MANAGER_CONTENTS = ["div#automaton-manager.overflow-auto", [
      ["button.btn btn-sm btn-primary", { "#": "uploadAutomatonButton" }, _("+ Upload the current automaton")],
      ["div", { "#": "usersAutomatonList" }],
    ]];

    private win: libD.WSwin;
    private readonly manRefs = {
      uploadAutomatonButton: undefined as HTMLButtonElement,
      usersAutomatonList: undefined as HTMLElement,
    };

    constructor() {
      this.init();
    }

    /**
     * Displays this automaton manager.
     * Reopens the same window if possible.
     */
    show() {
      if (this.win && this.win.ws) {
        this.win.show();
      } else {
        this.init();
      }
    }

    /**
     * Initializes this automaton manager's window
     * and components.
     */
    private init() {
      this.win = libD.newWin(
        {
          title: libD.format(_("{0}'s Automata"), AudeUsers.CurrentUser.getUsername()),
          show: true,
          width: 640,
          height: 360,
          content: libD.jso2dom(AutomatonManager.MANAGER_CONTENTS, this.manRefs)
        }
      );

      this.manRefs.uploadAutomatonButton.onclick = () => {
        const title = window.prompt("Give a title to the uploaded automaton :", "Title here.");
        if (title.length === 0) {
          AudeGUI.notify(_("Error"), _("The title cannot be empty !"), "error", 4000);
          return;
        }

        AudeUsers.CurrentUser.Automata.uploadAutomaton(title, AudeGUI.mainDesigner.getAutomaton(AudeGUI.mainDesigner.currentIndex)).then(
          (state) => {
            if (state === AudeUsers.ReturnState.OK) {
              AudeGUI.notify(
                _("Success"),
                _("Your automaton was successfully uploaded, find it in your automata."),
                "ok",
                4000
              );
              this.fetchAndDisplayUsersAutomata();
            } else {
              AudeGUI.notify(
                _("Error Uploading"),
                _("Couldn't upload your automaton..."),
                "error",
                4000
              );
              console.error(state);
            }
          }
        );
      };

      this.fetchAndDisplayUsersAutomata();
      this.win.show();
    }

    /**
     * Populates the automaton list by fetching them from the server.
     */
    private fetchAndDisplayUsersAutomata() {
      this.manRefs.usersAutomatonList.innerHTML = "";

      AudeUsers.CurrentUser.Automata.getUsersAutomata().then(
        (reqresult) => {
          if (reqresult[0] !== AudeUsers.ReturnState.OK) {
            AudeGUI.notify(
              _("Error !"),
              _("An error has occurred !"),
              "error",
              4000
            );
            return;
          }

          if (reqresult[1].length === 0) {
            this.manRefs.usersAutomatonList.appendChild(libD.jso2dom(["div.text-center", _("You still haven't saved any automaton.")]));
            return;
          }

          const ulist = this.manRefs.usersAutomatonList.appendChild(libD.jso2dom(["ul"])) as HTMLUListElement;
          for (const o of reqresult[1]) {
            const itemRefs = { openButton: undefined as HTMLButtonElement, deleteButton: undefined as HTMLButtonElement };
            const autoItem = libD.jso2dom(["li", [
              ["span.font-weight-bold", o.title], ["br"],
              ["span", _("Share code : ")],
              ["span", String(o.id)], ["br"],
              ["button.btn btn-sm btn-outline-primary", { "#": "openButton" }, _("Load into designer")],
              ["button.btn btn-sm btn-outline-danger", { "#": "deleteButton" }, [
                ["img", { src: libD.getIcon("actions/list-remove"), alt: "Remove" }]
              ]],
            ]], itemRefs);
            ulist.appendChild(autoItem);

            itemRefs.openButton.onclick = (e) => {
              if (!window.confirm(_("Loading this automaton will replace the one in the current editor ? Continue ?"))) {
                return;
              }
              AudeUsers.CurrentUser.Automata.getAutomaton(o.id).then(
                (reqret) => {
                  if (reqret[0] !== AudeUsers.ReturnState.OK) {
                    AudeGUI.notify(
                      _("Error !"),
                      _("An error has occurred !"),
                      "error",
                      4000
                    );
                    return;
                  }

                  AudeGUI.mainDesigner.setAutomatonCode(automaton_code(reqret[1]));
                }
              );
            };

            itemRefs.deleteButton.onclick = (e) => {
              if (!window.confirm(_("Do you really want to delete this automaton from your account ?"))) {
                return;
              }

              AudeUsers.CurrentUser.Automata.deleteAutomaton(o.id).then(
                (reqret) => {
                  console.log(AudeUsers.ReturnState[reqret]);
                  if (reqret !== AudeUsers.ReturnState.OK) {
                    AudeGUI.notify(
                      _("Error !"),
                      _("An error has occurred !"),
                      "error",
                      4000
                    );
                    return;
                  }

                  AudeGUI.notify(
                    _("Success"),
                    libD.format(_("Successfully deleted automaton {0} from your account."), o.id),
                    "ok",
                    4000
                  );

                  autoItem.remove();
                }
              );
            };
          }
        }
      );
    }
  }
}