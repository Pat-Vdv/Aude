
/**
 * Namespace for UI elements relating to user account management.
 */
namespace UserAccountGUI {
  const AudeGUI = window.AudeGUI;
  const _ = AudeGUI.l10n;

  export class UserAccountWidget {
    private static readonly widgetContents = ["div.container", { "#": "contentDiv" }, [
      ["div", { "#": "signinPane" }, [
        ["h6.text-center", _("Sign In")],
        ["form.form form-inline", { "action": "#" }, [
          ["input.form-control", { "#": "signinLoginField", "placeholder": _("Username") }],
          ["input.form-control", { "#": "signinPasswordField", "type": "password", "placeholder": _("Password") }],
          ["button.btn btn-primary", { "#": "signinButton", "type": "button" }, _("Sign In")]
        ]]
      ]],
      ["div.user-hidden", {"#": "userPane"}, [
        ["button.btn btn-outline-danger", {"#": "userLogoutButton"}, _("Logout")]
      ]]
    ]];

    private static currentInstance: UserAccountWidget;

    static show() {
      if (UserAccountWidget.currentInstance !== undefined) {
        UserAccountWidget.currentInstance.display();
      } else {
        UserAccountWidget.currentInstance = new UserAccountWidget();
        UserAccountWidget.currentInstance.display();
      }
    }

    static hide() {
      if (UserAccountWidget.currentInstance !== undefined) {
        UserAccountWidget.currentInstance.hide();
      }
    }

    static toggleShown() {
      if (UserAccountWidget.currentInstance === undefined) {
        UserAccountWidget.currentInstance = new UserAccountWidget();
        return;
      }

      UserAccountWidget.currentInstance.container.classList.toggle("user-hidden");
    }

    private container: HTMLElement;
    private readonly contentRefs = {
      contentDiv: undefined as HTMLElement,
      signinPane: undefined as HTMLElement,
      signinLoginField: undefined as HTMLInputElement,
      signinPasswordField: undefined as HTMLInputElement,
      signinButton: undefined as HTMLButtonElement,

      userPane: undefined as HTMLInputElement,
      userLogoutButton: undefined as HTMLButtonElement,
    };

    constructor() {
      this.container = document.getElementById("user-menu");

      this.initComponents();
      this.display();
    }

    hide() {
      this.container.classList.add("user-hidden");
    }

    display() {
      this.container.classList.remove("user-hidden");
    }

    private initComponents() {
      this.container.appendChild(libD.jso2dom(UserAccountWidget.widgetContents, this.contentRefs));

      this.contentRefs.signinButton.onclick = (e) => {
        AudeUsers.attemptLogin(
          this.contentRefs.signinLoginField.value,
          this.contentRefs.signinPasswordField.value
        ).then((state) => {
          switch (state) {
            case AudeUsers.ReturnState.NO_SUCH_USER:
              AudeGUI.notify(
                _("Login error"),
                _("This user doesn't exist !"),
                "error",
                4000
              );
              this.contentRefs.signinLoginField.classList.add("is-invalid");
              break;

            case AudeUsers.ReturnState.LOGIN_WRONG_PASSWORD:
              AudeGUI.notify(
                _("Login error"),
                _("Incorrect password !"),
                "error",
                4000
              );
              this.contentRefs.signinPasswordField.classList.add("is-invalid");
              break;

            case AudeUsers.ReturnState.OK:
              AudeGUI.notify(
                _("Login success"),
                libD.format(_("Successfully logged in as {0}"), AudeUsers.CurrentUser.getUsername()),
                "ok",
                4000
              );
              this.contentRefs.signinLoginField.value = "";
              this.contentRefs.signinPasswordField.value = "";
              break;

            default:
              AudeGUI.notify(
                _("Login error"),
                _("Unexpected error !"),
                "error",
                4000
              );
              break;
          }

          this.updateDisplay();
        });
      };

      this.contentRefs.signinLoginField.onkeydown = (e) => {
        this.contentRefs.signinLoginField.classList.remove("is-invalid");
      };

      this.contentRefs.signinPasswordField.onkeydown = (e) => {
        this.contentRefs.signinPasswordField.classList.remove("is-invalid");
      };

      /*
       *  Initialize connected user pane.    
       */
      this.contentRefs.userLogoutButton.onclick = () => {
        AudeUsers.logout();
        this.updateDisplay();
      };

      this.updateDisplay();
    }

    private updateDisplay() {
      if (AudeUsers.isUserLoggedIn()) {
        // Hide signin pane
        this.contentRefs.signinPane.classList.add("user-hidden");

        // Populate and show user pane.
        this.contentRefs.userPane.classList.remove("user-hidden");
      } else {
        // Hide user pane.
        this.contentRefs.signinPane.classList.remove("user-hidden");
        // Show signin pane.
        this.contentRefs.userPane.classList.add("user-hidden");
      }
    }
  }
}