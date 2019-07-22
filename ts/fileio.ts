/*
    Copyright (c) 2013, Raphaël Jakse (Université Joseph Fourier)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Université Joseph Fourier nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * This namespace contains functions that allow loading files from the server.
 */
namespace FileIO {
    const cache = new Map<string, any>();

    /**
     * Tries to load a file.
     * If the loading succeeds, calls the given success callback 
     * with the string contents of the file.
     * Else, calls the given failure callback with a message and eventual
     * error code.
     * @param fileName - The name of the file to load.
     * @param success - The success callback.
     * @param failure - The failure callback.
     * @param keep - If true, tries to load from cached files before reading disk.
     */
    export function getFile(
        fileName: string,
        success: (fileContent: string) => void,
        failure: (message: string, status?: number) => void = (m, s) => { return; },
        keep: boolean = false
    ) {
        if (keep && cache[fileName] !== undefined) {
            success(cache[fileName]);
            return;
        }

        try {
            const xhr = new XMLHttpRequest();
            //workaround chromium issue #45702
            xhr.open("get", fileName + (location.protocol === "file:" ? "?" + (new Date().toString()) : ""), true);
            xhr.setRequestHeader("Cache-Control", "no-cache");

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (!xhr.status || (xhr.status === 200 && success)) {
                        if (keep) {
                            cache[fileName] = xhr.responseText;
                        }
                        success(xhr.responseText);
                    } else if (failure) {
                        failure("status", xhr.status);
                    }
                }
            };

            xhr.overrideMimeType("text/plain");

            try {
                xhr.send();
            } catch (e) {
                failure("send", 0);
            }
        } catch (e) {
            if (failure) {
                failure(e.message);
            }
        }
    }

    /** Sets the data for a file in cache. */
    export function setFile(fileName: string, data: any) {
        cache[fileName] = data;
    }
    // Legacy exports to global namespace for JS.
    globalThis.getFile = getFile;
    globalThis.setFile = setFile;
}
