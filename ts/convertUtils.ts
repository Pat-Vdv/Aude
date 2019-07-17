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
      obj.transitions.push([tr.startState, tr.symbol, tr.endState]);
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
      A.addTransition(o.transitions[k][0], o.transitions[k][1], o.transitions[k][2]);
    }

    return A;
  }

  export function automatonCode2Automaton(code: string): Automaton {
    return Automaton.parse(code);
  }

  export function svg2Automaton(svg: string): Automaton {
    const div = document.createElement("div");
    const des = new AudeDesigner(div, true);
    des.setSVG(svg, 0);
    return des.getAutomaton(0);
  }
}