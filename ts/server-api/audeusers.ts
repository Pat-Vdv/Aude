namespace AudeUsers {
  const AudeGUI = window.AudeGUI;
  const _ = AudeGUI.l10n;

  const USER_SERVER_ADDRESS = "http://localhost:8080";

  export async function isServerAvailable(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        fetch(
          USER_SERVER_ADDRESS + "/status",
          {
            method: "GET"
          }
        ).then(
          (response) => {
            resolve(true);
          },
          (reason) => {
            resolve(false);
          }
        );
      } catch (ignore) {
        resolve(false);
      }
    });
  }

  export function isUserLoggedIn(): boolean {
    return Boolean(sessionStorage.getItem("username")) &&
      Boolean(sessionStorage.getItem("passwordHash"));
  }

  export async function attemptLogin(username: string, password: string) {
    if (!(await isServerAvailable())) return;
    const loginData = new FormData();
    loginData.append("username", username);
    loginData.append("passwd", password);

    fetch(
      USER_SERVER_ADDRESS + "/user/login",
      {
        method: "POST",
        body: loginData
      }
    ).then(
      (response) => {
        response.text().then((text) => {
          const jsonResponse = JSON.parse(text);

          // Error code is set : there is an error.
          if (jsonResponse.code) {
            AudeGUI.notify(_("Login error"), _("The username or password is incorrect !"), "error", 4000);
          } else {
            sessionStorage.setItem("username", jsonResponse.uname);
            sessionStorage.setItem("passwordHash", jsonResponse.passwd);
          }
        });
      },
      (reason) => {
        console.error(reason);
      });
  }

  export function logout() {
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("passHash");
  }

  export namespace CurrentUser {
    export function getUsername() {
      return sessionStorage.getItem("username");
    }

    export function getPasswordHash() {
      return sessionStorage.getItem("passwordHash");
    }

    export function changePassword(newPassword: string) {
      const loginData = new FormData();
      loginData.append("username", getUsername());
      loginData.append("passwd", getPasswordHash());
      loginData.append("newPasswd", newPassword);

      fetch(
        USER_SERVER_ADDRESS + "/user/updatePassword",
        {
          method: "POST",
          body: loginData
        }
      ).then(
        (response) => {
          response.text().then((text) => {
            const jsonResponse = JSON.parse(text);

            // Error code is set : there is an error.
            if (jsonResponse.code) {
              AudeGUI.notify(_("API Error"), _("Couldn't log in using stored crendtials !"), "error", 4000);
              console.log(jsonResponse);
            } else {
              sessionStorage.setItem("username", jsonResponse.uname);
              sessionStorage.setItem("passwordHash", jsonResponse.passwd);
            }
          });
        },
        (reason) => {
          AudeGUI.notify(_("API Error"), reason, "error", 4000);
        }
      );
    }
  }
}