/**
 * This namespace contains functions and fields relating to the 
 * Aude content server in general (status, address, ...)
 */
namespace AudeServer {
  /** Server's address. */
  export const SERVER_ADDRESS = "http://localhost:8080";

  /**
   * Returns true if the server can be reached.
   */
  export async function isServerAvailable(): Promise<boolean> {
    return fetch(
      SERVER_ADDRESS + "/status",
      {
        method: "GET"
      }
    ).then(
      (r) => {
        return true;
      },
      (r) => {
        return false;
      }
    );
  }
}
