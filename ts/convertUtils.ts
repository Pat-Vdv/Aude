/**
 * This module centralizes the functions that allow conversion
 * between different representations for objects.
 */
namespace Convert {
  export function automaton2Obj(a: Automaton): object {
    const obj: any = {};

    const initialState = a.getInitialState();
    // We put the initial state in the first position.
    obj.states = [initialState];
    for (const st of a.getStates()) {
      if (st !== initialState) {
        obj.states.push(st);
      }
    }

    obj.finalStates = Array.from(a.getFinalStates());

    obj.transitions = [];
    for (const tr of a.getTransitions() as Iterable<Transition>) {
      let symbol = tr.symbol;
      if (!symbol) {
        symbol = epsilon;
      }
      obj.transitions.push([tr.startState, symbol, tr.endState]);
    }

    return obj;
  }

  export function obj2automaton(o: any): Automaton {
    let k = 0;
    const A = new Automaton();

    A.setInitialState(o.states[0]);

    for (k = 1; k < o.states.length; ++k) {
      A.addState(o.states[k]);
    }

    for (k = 0; k < o.finalStates.length; ++k) {
      A.addFinalState(o.finalStates[k]);
    }

    for (k = 0; k < o.transitions.length; ++k) {
      let symbol = o.transitions[k][1];
      if (!symbol) {
        symbol = epsilon;
      }
      A.addTransition(o.transitions[k][0], symbol, o.transitions[k][2]);
    }

    return A;
  }

  export function automatonCode2Automaton(code: string): Automaton {
    return Automaton.parse(code);
  }

  export async function dot2svg(dot: string): Promise<string> {
    return new Promise((resolve, reject) => {
      window.AudeGUI.viz(
        dot,
        (svg) => {
          resolve(svg);
        }
      );
    });
  }

  export function svg2automaton(svg: string): Automaton {
    const div = document.createElement("div");
    const des = new AudeDesigner(div, true);
    des.setSVG(svg, 0);
    return des.getAutomaton(0);
  }

  export async function automaton2svg(a: Automaton): Promise<string> {
    return dot2svg(automaton2dot(a));
  }
}
