/// <reference path="../typings/katex.d.ts" />

/**
 * Namespace containing useful functions for text formatting.
 */
namespace FormatUtils {
  "use strict";
  
  /**
     * Formats a set into LaTeX syntax.
     * @param s - The iterable object (set, array, etc...) to format.
     */
  export function set2Latex(s: libD.Set): string {
    let latex = "$\\{";

    let size = s.size;
    if (size === 0) {
      return "$$\\emptyset$$";
    }

    let i = 0;
    for (let elem of s) {
      latex += elem;

      if (i != size - 1) {
        latex += ", ";
      }
      i++;
    }

    return latex + "\\}$";
  }

  /**
  * Formats a regular expression to a LaTeX string.
  */
  export function regexp2Latex(regexp: string): string {
    let latex = "$$";

    latex += regexp.replace(/\*/g, "^*");
    latex.replace(/\(/g, "\left(");
    latex.replace(/\)/g, "\right)");

    return latex + "$$";
  }

  /** 
   * Render a text in the given node, given as plain text or html.
   * This text can be an array. In this case, elements of the array are
   * concatenated.
   * The node is returned. If no node is given, a new span element is used.
   */
  export function textFormat(text: Array<string> | string, node?: HTMLElement, html: boolean = false) {
    if (!node) {
      node = document.createElement("span");
    }

    node[html ? "innerHTML" : "textContent"] = text instanceof Array ? text.join("") : text;

    window.renderMathInElement(
      node, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ]
      }
    );

    return node;
  }
}