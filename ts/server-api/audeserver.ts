namespace AudeServer {
  export const SERVER_ADDRESS = "http://localhost:8080";

  export async function isServerAvailable(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        fetch(
          SERVER_ADDRESS + "/status",
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
}