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