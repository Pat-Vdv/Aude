
/// <reference path="./automaton-manager.ts" />
/**
 * Namespace for UI elements relating to user account management.
 */
namespace UserAccountGUI {
  const AudeGUI = window.AudeGUI;
  const _ = AudeGUI.l10n;

  export class UserAccountWidget {
    private static readonly widgetContents = ["div.container-fluid", { "#": "contentDiv" }, [
      ["div.user-pane", { "#": "signinPane" }, [
        ["h6.text-center", _("Sign In")],
        ["form.form form-inline", { "action": "#" }, [
          ["input.form-control", { "#": "signinLoginField", "placeholder": _("Username") }],
          ["input.form-control", { "#": "signinPasswordField", "type": "password", "placeholder": _("Password") }],
          ["button.btn btn-primary", { "#": "signinButton", "type": "button" }, _("Sign In")]
        ]],
        ["a", { "#": "signupButton", "href": "#" }, _("Create an account")], ["br"],
        ["small", [
          ["a", {"#": "signinLoadFromId", "href": "#"}, _("Load an automaton from share code")]
        ]],
      ]],
      ["div.user-pane", { "#": "userPane" }, [
        ["h5.text-center", { "#": "userGreeting" }],
        ["h6.text-left", _("Automata")],
        ["button.btn btn-primary btn-sm", { "#": "automatonManageButton" }, _("My automata")], ["br"],
        ["small", [
          ["a", {"#": "userLoadFromId", "href": "#"}, _("Load an automaton from share code")]
        ]],
        ["br"],
        ["br"],
        ["button.btn btn-outline-danger btn-sm", { "#": "userLogoutButton" }, _("Logout")]
      ]],
      ["div.user-pane", { "#": "signupPane" }, [
        ["h6.text-center", _("Sign Up")],
        ["form", { "action": "#" }, [
          ["input.form-control", { "#": "signupUsername", "placeholder": _("Username") }], ["br"],
          ["input.form-control", { "#": "signupPassword", "type": "password", "placeholder": _("Password") }], ["br"],
          ["input.form-control", { "#": "signupPasswordConfirm", "type": "password", "placeholder": _("Confirm password") }], ["br"],
          ["button.btn btn-sm btn-primary", { "#": "signupValidate", "type": "button" }, _("Create account")],
          ["button.btn btn-sm btn-danger", { "#": "signupCancel", "type": "button" }, _("Cancel")]
        ]]
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

    container: HTMLElement;
    private readonly contentRefs = {
      contentDiv: undefined as HTMLElement,
      signinPane: undefined as HTMLElement,
      signinLoginField: undefined as HTMLInputElement,
      signinPasswordField: undefined as HTMLInputElement,
      signinButton: undefined as HTMLButtonElement,
      signupButton: undefined as HTMLAnchorElement,
      signinLoadFromId: undefined as HTMLAnchorElement,

      userPane: undefined as HTMLInputElement,
      userLogoutButton: undefined as HTMLButtonElement,
      userGreeting: undefined as HTMLElement,
      automatonManageButton: undefined as HTMLButtonElement,
      userLoadFromId: undefined as HTMLButtonElement,


      signupPane: undefined as HTMLElement,
      signupUsername: undefined as HTMLInputElement,
      signupPassword: undefined as HTMLInputElement,
      signupPasswordConfirm: undefined as HTMLInputElement,
      signupValidate: undefined as HTMLButtonElement,
      signupCancel: undefined as HTMLButtonElement,
    };
    private currentPane: HTMLElement;

    private currentAutomatonManager: AutomatonManager;

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

      this.initSigninPane();

      this.initUserPane();

      this.initSignupPane();

      this.contentRefs.signinLoadFromId.onclick = this.contentRefs.userLoadFromId.onclick = () => {
        const id = parseInt(prompt("Give the code for the automaton"), 10);
        if (isNaN(id)) {
          AudeGUI.notify(
            _("Error"),
            _("The input wasn't a valid integer automaton share code"),
            "error",
            4000
          );
          return;
        }

        AudeUsers.CurrentUser.Automata.getAutomaton(id).then(
          (reqres) => {
            if (reqres[0] === AudeUsers.ReturnState.NO_SUCH_AUTOMATON) {
              AudeGUI.notify(
                _("Error"),
                _("No automaton exists with this share code."),
                "error",
                4000
              );
              return;
            }

            if (reqres[0] === AudeUsers.ReturnState.OK) {
              if (!window.confirm(_("Loading this automaton will replace the one in the current editor ? Continue ?"))) {
                return;
              }
              AudeGUI.mainDesigner.setAutomatonCode(automaton_code(reqres[1]));
              AudeGUI.notify(
                _("Success !"),
                _("Successfully loaded automaton from share code !"),
                "ok",
                4000
              );
            }
          }
        );
      };

      this.updateDisplay();
    }

    /**
     * Subroutine that initializes the sign in pane's components.
     * (doesn't show it, just binds its elements' actions)
     */
    private initSigninPane() {
      this.contentRefs.signinButton.onclick = (e) => {
        AudeUsers.attemptLogin(
          this.contentRefs.signinLoginField.value,
          this.contentRefs.signinPasswordField.value
        ).then((state) => {
          switch (state) {
            case AudeUsers.ReturnState.SERVER_UNREACHABLE:
              AudeGUI.notify(
                _("Server error"),
                _("The content server is unavailable."),
                "error",
                4000
              );
              break;
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


      this.contentRefs.signupButton.onclick = () => {
        this.setCurrentPane(this.contentRefs.signupPane);
      };

      this.contentRefs.signinLoginField.onkeydown = (e) => {
        this.contentRefs.signinLoginField.classList.remove("is-invalid");
      };

      this.contentRefs.signinPasswordField.onkeydown = (e) => {
        this.contentRefs.signinPasswordField.classList.remove("is-invalid");
      };
    }

    /**
     *  Initializes connected user pane.    
     */
    private initUserPane() {
      this.contentRefs.userLogoutButton.onclick = () => {
        AudeUsers.logout();
        this.updateDisplay();
        this.hide();
      };

      this.contentRefs.automatonManageButton.onclick = () => {
        if (this.currentAutomatonManager === undefined) {
          this.currentAutomatonManager = new AutomatonManager();
        } else {
          this.currentAutomatonManager.show();
        }
      };
    }

    private initSignupPane() {
      this.contentRefs.signupValidate.onclick = () => {
        const username = this.contentRefs.signupUsername.value.trim();
        const password = this.contentRefs.signupPassword.value;
        const passwordConfirm = this.contentRefs.signupPasswordConfirm.value;

        if (username.length === 0) {
          AudeGUI.notify(_("Sign Up Error"), _("Username cannot be empty"), "error", 4000);
          this.contentRefs.signupUsername.classList.add("is-invalid");
          return;
        }

        if (password.length === 0) {
          AudeGUI.notify(_("Sign Up Error"), _("Password cannot be empty"), "error", 4000);
          this.contentRefs.signupPassword.classList.add("is-invalid");
          return;
        }

        if (password !== passwordConfirm) {
          AudeGUI.notify(_("Sign Up Error"), _("Password and confirmation don't match !"), "error", 4000);
          this.contentRefs.signupPassword.classList.add("is-invalid");
          this.contentRefs.signupPasswordConfirm.classList.add("is-invalid");
          return;
        }

        AudeUsers.createNewUser(username, password).then(
          (rs) => {
            console.log(AudeUsers.ReturnState[rs]);
            switch (rs) {
              case AudeUsers.ReturnState.SIGNUP_ACCOUNT_EXISTS:
                AudeGUI.notify(_("Sign Up Error"), _("This exact account already exists ! Try signing in instead..."), "error", 4000);
                this.contentRefs.signupUsername.classList.add("is-invalid");
                this.contentRefs.signupPassword.classList.add("is-invalid");
                this.contentRefs.signupPasswordConfirm.classList.add("is-invalid");
                break;

              case AudeUsers.ReturnState.USERNAME_TAKEN:
                AudeGUI.notify(_("Sign Up Error"), _("This username is taken !"), "error", 4000);
                this.contentRefs.signupUsername.classList.add("is-invalid");
                break;

              case AudeUsers.ReturnState.PASSWORD_TOO_SHORT:
                AudeGUI.notify(_("Sign Up Error"), _("This password is too short (6 characters minimum) !"), "error", 4000);
                this.contentRefs.signupPassword.classList.add("is-invalid");
                this.contentRefs.signupPasswordConfirm.classList.add("is-invalid");
                break;

              case AudeUsers.ReturnState.OK:
                AudeGUI.notify(
                  _("Success"),
                  libD.format(_("Account {0} successfully created !"), AudeUsers.CurrentUser.getUsername()),
                  "ok",
                  4000
                );
                this.updateDisplay();

                // Clear inputs.
                this.contentRefs.signupUsername.value = "";
                this.contentRefs.signupPassword.value = "";
                this.contentRefs.signupPasswordConfirm.value = "";
                break;
            }
          }
        );
      };

      // Clean up invalid state when field changes.
      this.contentRefs.signupUsername.onkeydown = () => {
        this.contentRefs.signupUsername.classList.remove("is-invalid");
      };

      this.contentRefs.signupPassword.onkeydown = () => {
        this.contentRefs.signupPassword.classList.remove("is-invalid");
      };

      this.contentRefs.signupPasswordConfirm.onkeydown = () => {
        this.contentRefs.signupPasswordConfirm.classList.remove("is-invalid");
      };

      this.contentRefs.signupCancel.onclick = () => {
        this.contentRefs.signupUsername.value = "";
        this.contentRefs.signupPassword.value = "";
        this.contentRefs.signupPasswordConfirm.value = "";
        this.updateDisplay();
      };
    }

    /**
     * Checks whether a user is logged in and automatically switches to 
     * sign in pane or connected user pane.
     */
    private updateDisplay() {
      if (AudeUsers.isUserLoggedIn()) {
        this.setCurrentPane(this.contentRefs.userPane);

        // Populate and show user pane.
        this.contentRefs.userGreeting.innerHTML = AudeUsers.CurrentUser.getUsername();
      } else {
        this.setCurrentPane(this.contentRefs.signinPane);
      }
    }

    private setCurrentPane(pane: HTMLElement) {
      if (pane === this.currentPane) {
        return;
      }

      if (this.currentPane !== undefined) {
        this.currentPane.classList.remove("user-pane-current");
      }
      this.currentPane = pane;
      this.currentPane.classList.add("user-pane-current");
    }
  }
}