namespace AudeUsers {
    const AudeGUI = window.AudeGUI;
    const _ = AudeGUI.l10n;

    const MIN_PASSWORD_LENGTH = 6;

    export enum ReturnState {
        OK, // Everything went well.
        SERVER_UNREACHABLE,// Couldn't access the server side API.
        NO_USER_LOGGED_IN, // Operation needed login, but no user is logged in. 
        LOGIN_WRONG_PASSWORD,
        NO_SUCH_USER,
        STORED_CREDENTIALS_ERROR, // The credentials stored on the browser are incorrect.
        MISC_ERROR, // Unclassified error (avoid using if possible)
        PASSWORD_TOO_SHORT, // Password given for sign up or password change is too short.
        USERNAME_TAKEN, // Tried to create a user with an already used username.
        SIGNUP_ACCOUNT_EXISTS, // Tried to create an account with same username and password as existing one.
    }

    function errorMessageToreturnState(errorMessage: string): ReturnState {
        switch (errorMessage) {
            case "accountExists":
                return ReturnState.SIGNUP_ACCOUNT_EXISTS;

            case "usernameTaken":
                return ReturnState.USERNAME_TAKEN;

            case "incorrectPassword":
                return ReturnState.LOGIN_WRONG_PASSWORD;

            case "noSuchUser":
                return ReturnState.NO_SUCH_USER;

            default:
                return ReturnState.MISC_ERROR;
        }
    }

    export function getReturnStateMessage(rs: ReturnState): string {
        switch (rs) {
            case ReturnState.OK:
                return _("OK");

            case ReturnState.NO_USER_LOGGED_IN:
                return _("You are not logged in !");

            case ReturnState.SERVER_UNREACHABLE:
                return _("The content server is unreachable.");
        }
    }

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

    export async function attemptLogin(username: string, password: string): Promise<ReturnState> {
        if (!(await isServerAvailable())) return Promise.resolve(ReturnState.SERVER_UNREACHABLE);
        const loginData = new FormData();
        loginData.append("username", username);
        loginData.append("passwd", password);

        return fetch(
            USER_SERVER_ADDRESS + "/user/login",
            {
                method: "POST",
                body: loginData
            }
        )
            .then(response => response.json())
            .then(
                (jsonResponse) => {
                    // Error code is set : there is an error.
                    if (jsonResponse.code) {
                        return errorMessageToreturnState(jsonResponse.message);
                    }

                    sessionStorage.setItem("username", jsonResponse.uname);
                    sessionStorage.setItem("passwordHash", jsonResponse.passwd);
                    return ReturnState.OK;
                },
                (reason) => {
                    console.error(reason);
                    return ReturnState.MISC_ERROR;
                });
    }

    export function logout() {
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("passwordHash");
    }

    export async function createNewUser(username: string, password: string): Promise<ReturnState> {
        if (password.length < MIN_PASSWORD_LENGTH) return Promise.resolve(ReturnState.PASSWORD_TOO_SHORT);

        const postData = new FormData();
        postData.set("username", username);
        postData.set("passwd", password);

        return fetch(
            USER_SERVER_ADDRESS + "/user/add",
            {
                method: "POST",
                body: postData
            }
        )
            .then(response => response.json())
            .then(
                (jsonResponse) => {
                    // code field is set : there is an error.
                    if (jsonResponse.code) {
                        switch (jsonResponse.message) {
                            case "accountExists":
                                return ReturnState.SIGNUP_ACCOUNT_EXISTS;
                            case "usernameTaken":
                                return ReturnState.USERNAME_TAKEN;
                            default:
                                console.error(jsonResponse);
                                return ReturnState.MISC_ERROR;
                        }
                    }

                    sessionStorage.setItem("username", jsonResponse.uname);
                    sessionStorage.setItem("passwordHash", jsonResponse.passwd);
                    return ReturnState.OK;
                },
                (reason) => {
                    console.error(reason);
                    return ReturnState.MISC_ERROR;
                }
            );
    }

    export async function getAllUsernames(): Promise<ReturnState | Array<string>> {
        if (!(await isServerAvailable())) return ReturnState.SERVER_UNREACHABLE;

        return fetch (
            USER_SERVER_ADDRESS + "/user/all",
            {
                method: "GET"
            }
        )
        .then(response => response.json())
        .then(
            (jsonResponse) => {
                if (jsonResponse.code) {
                    return errorMessageToreturnState(jsonResponse.message);
                }

                return jsonResponse;
            },
            (reason) => {
                return ReturnState.MISC_ERROR;
            }
        )
    }

    /**
     * Contains all functions relating to operations on the
     * currently logged in user.
     */
    export namespace CurrentUser {
        /**
         * Return current logged in user's username.
         * If no user is logged in, returns undefined.
         */
        export function getUsername() {
            const uname = sessionStorage.getItem("username");
            return (uname === null ? undefined : uname);
        }

        /**
         * Return current logged in user's password hash.
         * If no user is logged in, returns undefined.
         */
        export function getPasswordHash() {
            const hash = sessionStorage.getItem("passwordHash");
            return (hash === null ? undefined : hash);
        }

        /**
         * Changes the current logged in user's password to
         * the newly given one.
         */
        export async function changePassword(newPassword: string): Promise<ReturnState> {
            if (!isUserLoggedIn()) return Promise.resolve(ReturnState.NO_USER_LOGGED_IN);
            if (!isServerAvailable()) return Promise.resolve(ReturnState.SERVER_UNREACHABLE);

            if (newPassword.length < MIN_PASSWORD_LENGTH) return ReturnState.PASSWORD_TOO_SHORT;

            const loginData = new FormData();
            loginData.append("username", getUsername());
            loginData.append("passwd", getPasswordHash());
            loginData.append("newPasswd", newPassword);

            return fetch(
                USER_SERVER_ADDRESS + "/user/updatePassword",
                {
                    method: "POST",
                    body: loginData
                }
            )
                .then(response => response.json())
                .then(
                    (jsonResponse) => {
                        // Error code is set : there is an error.
                        if (jsonResponse.code) {
                            AudeGUI.notify(_("API Error"), _("Couldn't log in using stored crendtials !"), "error", 4000);
                            return ReturnState.STORED_CREDENTIALS_ERROR;
                        }
                        sessionStorage.setItem("username", jsonResponse.uname);
                        sessionStorage.setItem("passwordHash", jsonResponse.passwd);
                        return ReturnState.OK;
                    },
                    (reason) => {
                        AudeGUI.notify(_("API Error"), reason, "error", 4000);
                        return ReturnState.MISC_ERROR;
                    }
                );
        }

        export async function changeUsername(newUsername: string): Promise<ReturnState> {
            if (!isUserLoggedIn()) return Promise.resolve(ReturnState.NO_USER_LOGGED_IN);
            if (!isServerAvailable()) return Promise.resolve(ReturnState.SERVER_UNREACHABLE);

            const postData = new FormData();
            postData.set("username", getUsername());
            postData.set("passwd", getPasswordHash());
            postData.set("newUsername", newUsername);

            return fetch(
                USER_SERVER_ADDRESS + "/user/updateUsername",
                {
                    method: "POST",
                    body: postData
                }
            )
                .then(response => response.json())
                .then(
                    (jsonResponse) => {
                        if (jsonResponse.code) {
                            return errorMessageToreturnState(jsonResponse.message);
                        }

                        // Set the new credentials in session.
                        sessionStorage.setItem("username", jsonResponse.uname);
                        sessionStorage.setItem("passwordHash", jsonResponse.passwd);
                        return ReturnState.OK;
                    },
                    (reason) => {
                        console.error(reason);
                        return ReturnState.MISC_ERROR;
                    }
                );
        }

        /**
         * 
         */
        export async function deleteAccount(): Promise<ReturnState> {
            if (!(await isServerAvailable())) return Promise.resolve(ReturnState.SERVER_UNREACHABLE);
            if (!isUserLoggedIn()) return Promise.resolve(ReturnState.NO_USER_LOGGED_IN);

            const postData = new FormData();
            postData.set("username", getUsername());
            postData.set("passwd", getPasswordHash());

            return fetch(
                USER_SERVER_ADDRESS + "/user/deleteUser",
                {
                    method: "POST",
                    body: postData
                }
            )
                .then(response => response.json())
                .then(
                    (jsonReponse) => {
                        if (jsonReponse.code) {
                            console.error(jsonReponse);
                            return ReturnState.MISC_ERROR;
                        }
                        logout();
                        return ReturnState.OK;
                    },
                    (reason) => {
                        console.error(reason);
                        return ReturnState.MISC_ERROR;
                    }
                );
        }

        export namespace Automata {
            export async function uploadAutomaton(automatonName: string, automaton: Automaton): Promise<ReturnState> {
                if (!(await isServerAvailable())) return Promise.resolve(ReturnState.SERVER_UNREACHABLE);
                if (!isUserLoggedIn()) return Promise.resolve(ReturnState.NO_USER_LOGGED_IN);

                const postData = new FormData();
                postData.set("username", getUsername());
                postData.set("passwd", getPasswordHash());
                postData.set("nameAuto", automatonName);
                postData.set("contents", automaton_code(automaton));

                return fetch(
                    USER_SERVER_ADDRESS + "/automata/create",
                    {
                        method: "POST",
                        body: postData
                    }
                )
                .then (r => r.json())
                .then(json => {
                    if (json.code) {
                        return errorMessageToreturnState(json.message);
                    }
                    return ReturnState.OK;
                });
            }

            export async function editAutomaton(automatonId: number, newContent: Automaton): Promise<ReturnState> {
                const postData = new FormData();
                postData.set("username", getUsername());
                postData.set("passwd", getPasswordHash());
                postData.set("automatonId", String(automatonId));
                postData.set("newContents", automaton_code(newContent));

                return fetch(
                    USER_SERVER_ADDRESS + "/automata/update",
                    {
                        method: "POST",
                        body: postData
                    }
                )
                .then(r => r.json())
                .then(
                    (json) => {
                        if (json.code) {
                            return errorMessageToreturnState(json.message);
                        }
                        return ReturnState.OK;
                    },
                    (reason) => {
                        console.error(reason);
                        return ReturnState.MISC_ERROR;
                    }
                );
            }

            export async function deleteAutomaton(automatonId: number): Promise<ReturnState> {
                return ReturnState.MISC_ERROR;
            }

            export async function getAutomaton(automatonId: number): Promise<[ReturnState, Automaton]> {
                return fetch(
                    USER_SERVER_ADDRESS + "/automata/show?automatonId=" + String(automatonId),
                    {
                        method: "GET"
                    }
                )
                .then(r => r.json())
                .then(
                    (json) => {
                        console.log(json);
                        if (json.code) {
                            return [errorMessageToreturnState(json.message), undefined];
                        }
                        return [ReturnState.OK, Convert.automatonCode2Automaton(json.contents)];
                    },
                    (reason) => {
                        console.error(reason);
                        return [ReturnState.MISC_ERROR, undefined];
                    }
                )
            }
        }
    }
}