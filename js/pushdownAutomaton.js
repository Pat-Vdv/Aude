

//Class to handle pushdown automaton
(function (pkg) {
    "use strict";

    //Return true if the symbols are in top of the stack
    function isTopStack(symbols,stack) {
        var i=stack.length-1;
        for (var c of symbols) {
            if (c!==stack[i] || i<0)
                return false;
            i--;
        }
        return true;
    }

    //Push the given symbols to the stack
    // pushSymbols("Cat") -> stack: [0:t,1:a,2:C]
    function pushSymbol(symbols,stack) {
        for (var c of symbols.split("").reverse().join("")) {
            stack.push(c);
        }
    }

    pkg.Pushdown = function (states,inputAlphabet,stackAlphabet,transition,initialState,initialStackSymbol,finalStates) {
        this.states         = states         || new Set();
        this.inputAlphabet  = inputAlphabet  || new Set();
        this.stackAlphabet  = stackAlphabet  || new Set();
        this.transition     = transition     || new Set();
        this.initialState   = initialState;
        this.initialStackSymbol = initialStackSymbol || "Z";
        this.finalStates = finalStates || new Set();

        if (!this.currentStates) {
            this.currentStates = new Set();
            this.lastTakenTransitions = new Set();
            this.stack = []; //Stack of the automaton
            this.pushSymbols(this.initialStackSymbol);
        }
    };

    pkg.Pushdown.prototype = {

        /*Stack*/

        //Return the top of the stack
        getTopStack : function() {
            return this.stack[this.stack.length-1];
        },

        //Return true if the top of the stack contains the symbols
        isTopStack : function(symbols) {
            var i=this.stack.length-1;
            for (var c of symbols) {
                if (c!==this.stack[i] || i<0)
                    return false;
                i--;
            }
            return true;
        },

        //Push the given symbols to the stack
        // pushSymbols("Cat") -> stack: [0:t,1:a,2:C]
        pushSymbols : function(symbols) {
            for (var c of symbols.split("").reverse().join("")) {
                this.stack.push(c);
            }
        },

        getStack : function() {
            return this.stack;
        },

        //Look at all current states, and see if one the stack is empty
        isStackEmpty : function() {
            for(var sta of this.getCurrentStatesStacks()) {
                if (sta.stack.length === this.initialStackSymbol.length)
                    return true
            }
            return false;

        },


        /*States*/


        //Add a state to the automaton
        addState : function (state,accepting) {
            this.states.add(state);
            if (accepting)
                this.finalStates.add(state);
        },

        //Remove the state and all the transition were the state was present
        removeState : function(state) {
            this.states.remove(state);
            this.finalStates.remove(state);
        },

        //Return true if the automaton has the given state
        hasState : function(state) {
            return this.states.has(state);
        },

        //Return the set of states
        getStates : function() {
            return this.states;
        },

        getNonFinalStates : function () {
            return (this.getStates()).minus(this.getFinalStates());
        },


        /*Input alphabet*/


        //Add the set aphabet to the input alphabet
        addInputAlphabet : function (alphabet) {
            this.inputAlphabet.unionInPlace(alphabet);
        },

        //Remove the set alphabet to the input alphabet
        removeInputAlphabet : function (alphabet) {
            this.inputAlphabet.minusInPlace(alphabet);
        },

        //Return the set of input alphabet
        getInputAlphabet : function (alphabet) {
            return this.InputAlphabet;
        },

        //Add the symbol to the input alphabet
        addInputSymbol : function (s) {
            if (s !== "ε" && s !== "\\e" && s !== pkg.epsilon) { //Not add epsilon to the input alphabet
                this.inputAlphabet.add(s);
            }
        },

        //Remove the symbol from the input alphabet
        removeInputSymbol : function (s) {
            this.inputAlphabet.remove(s);
        },

        //Return true if the symbol is present to the input alphabet
        hasInputSymbol : function (s) {
            return this.inputAlphabet.has(s);
        },


        /*Stack alphabet*/


        //Add the set alphabet to the input alphabet
        addStackAlphabet : function (alphabet) {
            this.stackAlphabet.unionInPlace(alphabet);
        },

        //Remove the set alphabet to the input alphabet
        removeStackAlphabet : function (alphabet) {
            this.stackAlphabet.minusInPlace(alphabet);
        },

        //Return the set of input alphabet
        getStackAlphabet : function (alphabet) {
            return this.InputAlphabet;
        },

        //Add the symbol to the input alphabet
        addStackSymbol : function (s) {
            if (s !== "ε" && s !== "\\e" && s !== pkg.epsilon) //Not add epsilon to the stack alphabet
                this.stackAlphabet.add(s);
        },

        //Remove the symbol from the input alphabet
        removeStackSymbol : function (s) {
            this.stackAlphabet.remove(s);
        },

        //Return true if the symbol is present to the input alphabet
        hasStackSymbol : function (s) {
            return this.stackAlphabet.has(s);
        },


        /*Transition*/


        //A transition is composed of :
        //(startState,symbol,stackSymbol,endState,newStackSymbol)
        addTransition : function(t,symbol,stackSymbol,endState,newStackSymbol) {
            if (arguments.length > 1) {
                return this.addTransition(new pkg.PushdownTransition(t,symbol,stackSymbol,endState,newStackSymbol));
            }
            this.addState(t.startState);
            this.addState(t.endState);
            this.addInputSymbol(t.symbol);
            this.addStackSymbol(t.stackSymbol);
            this.addStackSymbol(t.newStackSymbol);
            this.transition.add(t);
        },

        getTransitions:function() {
            return this.transition;
        },

        /*
        * This method returns the transition function of the automaton. This function is such that:
        *  - f() returns the set of start states
        *  - f(startState) return the set of symbols, stackSymbol, and newStackSymbol such that one more (startState, symbol, stackSymbol, newStackSymbol, endState) transitions exist(s)
        *  - f(startState, symbol) returns the set of states reachable, the stackSymbol and the newStackSymbol. If determinizedFunction is true, return the only state reachable with (startState, symbol).
        *  - f(startState, symbol, stackSymbol) returns the set of states reachable and the newStackSymbol with. If determinizedFunction is true, return the only state reachable with (startState, symbol).
        *  - f(null, null, null, null, true) returns the set of endStates of all transitions.
        */
        getTransitionFunction : function(determinizedFunction) {
            var transList = aude.toArray(this.getTransitions()),
                transition,
                symbolsByState = [],
                startState,
                startStates = new Set(),
                endStates   = new Set(),
                endStatesNewStackSymbolByStartStateBySymbols = {}, //Contains a set with object: states, newStackSymbol
                endStatesNewStackSymbolByStartStateEpsilon = {},
                endStatesStackSymbolNewStackSymbolByStartStateBySymbols = {}, //Contains a set with object: states, stackSymbol, newStackSymbol
                endStatesStackSymbolNewStackSymbolByStartStateEpsilon = {},
                symbol,
                stackSymbol,
                newStackSymbol,
                t;

            for (t in transList) {
                transition = transList[t]; //For each transition
                startStates.add(transition.startState); //Add the start state and end state
                endStates.add(transition.endState);
                startState = aude.elementToString(transition.startState);
                newStackSymbol = (transition.newStackSymbol);
                stackSymbol = (transition.stackSymbol);
                symbol = aude.elementToString(transition.symbol);
                if (!symbolsByState[startState]) {
                    symbolsByState[startState] = new Set();
                    endStatesNewStackSymbolByStartStateEpsilon[startState] ={};
                    endStatesNewStackSymbolByStartStateBySymbols[startState] = {};
                    endStatesStackSymbolNewStackSymbolByStartStateBySymbols[startState] = {};
                    endStatesStackSymbolNewStackSymbolByStartStateEpsilon[startState] = new Set();;
                }

                if (transition.symbol === pkg.epsilon || transition.symbol === "\\e" || transition.symbol === "ε") {
                    if (determinizedFunction) {
                        endStatesNewStackSymbolByStartStateEpsilon[startState][stackSymbol] = {"endState" : transition.endState, "newStackSymbol" : newStackSymbol};
                        endStatesStackSymbolNewStackSymbolByStartStateEpsilon[startState] = {"endState" : transition.endState," newStackSymbol" : newStackSymbol, "stackSymbol" : stackSymbol};
                    } else {
                        endStatesStackSymbolNewStackSymbolByStartStateEpsilon[startState].add({"endState" : transition.endState, "newStackSymbol" : newStackSymbol, "stackSymbol" : stackSymbol});

                        if (!endStatesNewStackSymbolByStartStateEpsilon[startState][stackSymbol]) {
                            endStatesNewStackSymbolByStartStateEpsilon[startState][stackSymbol] = new Set();                        }
                        endStatesNewStackSymbolByStartStateEpsilon[startState][stackSymbol].add({"endState" : transition.endState, "newStackSymbol" : newStackSymbol});
                    }
                } else {
                    if (!endStatesNewStackSymbolByStartStateBySymbols[startState][symbol]) {
                        endStatesNewStackSymbolByStartStateBySymbols[startState][symbol] = {};
                    }
                    if (!endStatesStackSymbolNewStackSymbolByStartStateBySymbols[startState][symbol]) {
                        endStatesStackSymbolNewStackSymbolByStartStateBySymbols[startState][symbol] = new Set();
                    }
                    if (determinizedFunction) {
                        endStatesNewStackSymbolByStartStateBySymbols[startState][symbol][stackSymbol] = {"endState" : transition.endState, "newStackSymbol" : newStackSymbol};
                        endStatesStackSymbolNewStackSymbolByStartStateBySymbols[startState][symbol] = {"endState" : transition.endState, "newStackSymbol" : newStackSymbol, "stackSymbol" : stackSymbol};
                    } else {
                        if (!endStatesNewStackSymbolByStartStateBySymbols[startState][symbol][stackSymbol]) {
                            endStatesNewStackSymbolByStartStateBySymbols[startState][symbol][stackSymbol] = new Set();
                        }
                        endStatesStackSymbolNewStackSymbolByStartStateBySymbols[startState][symbol].add({"endState" : transition.endState, "newStackSymbol" : newStackSymbol, "stackSymbol" : stackSymbol});
                        endStatesNewStackSymbolByStartStateBySymbols[startState][symbol][stackSymbol].add({"endState" : transition.endState, "newStackSymbol" : newStackSymbol});
                    }
                }
                symbolsByState[startState].add({"symbol" : transition.symbol, "stackSymbol" : transition.stackSymbol, "newStackSymbol" : transition.newStackSymbol});
            }

            transList = null;
            return function (startState, symbol, stackSymbol, newStackSymbol, getEndStates) {
                if (getEndStates) {
                    return endStates;
                }

                switch (arguments.length) {
                    case 0:
                        return startStates;
                    case 1:
                        return symbolsByState[aude.elementToString(startState)] || new Set();

                    case 2:
                        var s;
                        if (symbol === pkg.epsilon || symbol === "\\e" || symbol === "ε") {
                            s = (endStatesStackSymbolNewStackSymbolByStartStateEpsilon[aude.elementToString(startState)]) || new Set();
                            if (!determinizedFunction && s === undefined) {
                                return new Set();
                            }

                            return s;
                        }

                        s = (endStatesStackSymbolNewStackSymbolByStartStateBySymbols[aude.elementToString(startState)] || [])[aude.elementToString(symbol)];
                        if (!determinizedFunction && s === undefined) {
                            return new Set();
                        }
                        return s;


                    case 3:
                        var s;
                        if (symbol === pkg.epsilon || symbol === "\\e" || symbol === "ε") {
                            s = (endStatesNewStackSymbolByStartStateEpsilon[aude.elementToString(startState)] || [])[aude.elementToString(stackSymbol)];
                            if (!determinizedFunction && s === undefined) {
                                return new Set();
                            }
                            return s;
                        }

                        s = ((endStatesNewStackSymbolByStartStateBySymbols[aude.elementToString(startState)] || [])[aude.elementToString(symbol)] || [])[aude.elementToString(stackSymbol)];
                        if (!determinizedFunction && s === undefined) {
                            return new Set();
                        }
                        return s;
                }
            };
        },

        /*Initial state*/


        //Set the initial state
        setInitialState : function (state) {
            this.addState(state);
            this.initialState = state;
        },

        //Get the initial state
        getInitialState : function () {
            return this.initialState;
        },


        /*Initial stack Symbol*/


        //Set the initial stack symbol and push it in the stack
        setInitialStackSymbol : function (s) {
            this.addStackSymbol(s);
            this.initialStackSymbol = s;
            this.stack = [];
            this.pushSymbols(s);
        },

        //Get the initial stack symbol
        getInitialStackSymbol : function () {
            return this.initialStackSymbol;
        },


        /*Final states*/


        //Add a final state to the automaton
        addFinalState : function (state) {
            this.addState(state,true);
        },

        //Set the given state to accepting
        setFinalState : function(state) {
            this.addState(state,true);
        },

        //Set the given state to non accepting
        setNonFinalState : function(state) {
            this.finalStates.remove(state);
        },

        //Return the set of final states
        getFinalStates : function() {
            return this.finalStates;
        },

        //Return true if the given state is final
        isFinalState : function(state) {
            return this.finalStates.has(state);
        },
        isAcceptingState : function(state) {
            return this.finalStates.has(state);
        },



        /*Run a word*/


        //Set the current state of the automaton
        setCurrentState: function (stateStack) {
            this.lastTakenTransitions.clear();
            if (this.hasState(stateStack.state)) {
                this.currentStates.clear();
                this.currentStates.add(stateStack);
                this.currentStatesAddAccessiblesByEpsilon();
            }
        },

        //Set the current states of the automaton
        setCurrentStates: function (stateStacks) {
            this.lastTakenTransitions.clear();
            var sta = [];
            for (var s of stateStacks)
                sta.push(s.state);
            sta = aude.toSet(sta);
            if (sta.subsetOf(this.states)) {
                this.currentStates.clear();
                this.currentStates.unionInPlace(aude.toSet(stateStacks));
                this.currentStatesAddAccessiblesByEpsilon();
            }
        },

        //Add a state to the current state
        addCurrentState: function (stateStack) {

            if (this.hasState(stateStack.state)) {
                this.currentStates.add(stateStack);
                this.currentStatesAddAccessiblesByEpsilon();
            }
        },

        //Add states to the current state
        addCurrentStates: function (stateStacks) {
            this.currentStates.unionInPlace(stateStacks);
            this.currentStatesAddAccessiblesByEpsilon();
        },

        //Remove a state to the current state
        removeCurrentState: function (stateStacks) {
            this.currentStates.remove(stateStacks);
            this.currentStatesAddAccessiblesByEpsilon();
        },


        //Return the set of currentState with their stack
        getCurrentStatesStacks : function() {
            return this.currentStates;
        },

        //Return the set of current states
        getCurrentStates: function () {
            var currentStates = new Set()
            for (var st of this.currentStates)
                currentStates.add(st.state);
            return currentStates;
        },

        //This method looks at current states and transitions of the Automaton to add all states accessible with epsilon to the current states.
        currentStatesAddAccessiblesByEpsilon: function (transitionFunction, visited) {
            var cs   = aude.toArray(this.currentStates),
                cont = false, // we continue if we added states
                th   = this;

            if (!visited) {
                visited = new Set();
            }

            if (!transitionFunction) {
                transitionFunction = this.getTransitionFunction();
            }

            var i;
            function browseState(tab) {
                if (!visited.has(tab.endState) && tab.stackSymbol===null && tab.newStackSymbol===null) {
                    console.log("COUCOU");
                    var nStack = cs[i].stack.slice();
                    th.lastTakenTransitions.add(new pkg.PushdownTransition(cs[i].state, pkg.epsilon, null, tab.endState, null));
                    th.currentStates.add({"state":tab.endState,"stack":nStack});
                    cont = true;
                } else if (!visited.has(tab.endState) && (tab.stackSymbol===pkg.epsilon || isTopStack(tab.stackSymbol,cs[i].stack))) {
                    var nStack = cs[i].stack.slice();
                    th.lastTakenTransitions.add(new pkg.PushdownTransition(cs[i].state, pkg.epsilon, tab.stackSymbol, tab.endState, tab.newStackSymbol));
                    if (tab.stackSymbol!==pkg.epsilon) {
                        for (var c of tab.stackSymbol)
                            nStack.pop();
                    }
                    if (tab.newStackSymbol !== pkg.epsilon && tab.newStackSymbol !== "ε" )
                        pushSymbol(tab.newStackSymbol,nStack);
                    th.currentStates.add({"state":tab.endState,"stack":nStack});

                    cont = true;
                }
            }
            //For each current state
            for (i = 0; i < cs.length; ++i) {
                if (!visited.has(cs[i].state)) { //If the current has not been visited
                    visited.add(cs[i].state); //Make it visited
                    transitionFunction(cs[i].state, pkg.epsilon).forEach(browseState); //Look
                }
            }

            if (cont) {
                this.currentStatesAddAccessiblesByEpsilon(transitionFunction, visited);
            }
        },

        //TODO NOT WORKING
        //This methods returns the set of successors of a state. Its behavior is well defined only on determinized automata.
        getSuccessors: function (state, stackSymbol, symbol) {
            var successors = new Set();
            var allSymbols = arguments.length === 2;

            this.trans.forEach(
                function (t) {
                    if (t.startState === state) {
                        if ((allSymbols || t.symbol === symbol) && (t.stackSymbol === stackSymbol)) {
                            successors.add(t.endState);
                        }
                    }
                }
            );

            return successors;
        },

        //TODO NOT WORKING
        getReachable : function (state, visited) {
            if (state === undefined) {
                state = this.getInitialState();
            }

            if (!visited) {
                visited = new Set();
            }

            var that = this;

            this.getSuccessors(state,this.getTopStack()).forEach(
                function (s) {
                    if (s !== state && !visited.has(s)) {
                        visited.add(s);
                        visited.unionInPlace(that.getReachable(s, visited));
                    }
                }
            );

            return visited;
        },



        // This methods looks at current states and transitions of the Automaton to replace current states by all states accessible with the given symbol.
        runSymbol: function (symbol, transitionFunction, dontEraseTakenTransitions) {
            if (symbol === pkg.epsilon || symbol === "ε") {
                throw new Error(_("Automaton.runSymbol(): epsilon is forbidden."));
            }
            if (!this.hasInputSymbol(symbol)) {
                this.lastTakenTransitions.clear();
                this.currentStates.clear();
                return false;
            }

            if (!transitionFunction) {
                transitionFunction = this.getTransitionFunction();
            }

            if (!dontEraseTakenTransitions) {
                this.lastTakenTransitions.clear();
            }

            var cs = aude.toArray(this.currentStates),
                th = this;

            var i;

            function addState(tab) {
                if (tab.stackSymbol===pkg.epsilon || isTopStack(tab.stackSymbol,cs[i].stack)) {
                    var nStack = cs[i].stack.slice();
                    th.lastTakenTransitions.add(new pkg.PushdownTransition(cs[i].state, symbol, tab.stackSymbol, tab.endState, tab.newStackSymbol));
                    if (tab.stackSymbol!==pkg.epsilon) { //Pop the stack only if the transition is not a;ε/A
                        for (var c of tab.stackSymbol)
                            nStack.pop();
                    }
                    if (tab.newStackSymbol !== pkg.epsilon && tab.newStackSymbol !== "ε")
                        pushSymbol(tab.newStackSymbol,nStack);

                    th.addCurrentState({"state":tab.endState,"stack":nStack});
                }
            }

            for (i = 0; i < cs.length; ++i) {
                this.currentStates.remove(cs[i]);
            }

            for (i = 0; i < cs.length; ++i) {
                transitionFunction(cs[i].state, symbol).forEach(addState); //Return all the transitions: with the  stackSymbol, current top stack symbol and current state
            }

            this.currentStatesAddAccessiblesByEpsilon(transitionFunction);
        },


        // This method runs each symbol of the list of symbol given. See the description of the runSymbol for more information. Don't forget to Set the current state to the initial state if you need it.
        runWord: function (symbols) {
            var i, transitionFunction = this.getTransitionFunction();
            for (i in symbols) {
                this.runSymbol(symbols[i], transitionFunction);
            }
       },

        //This method runs a word from the initial state and checks if this word is accepted by the automaton. It takes care to restore current states, last taken transitions and the stack after the run.
        //mode:
        // stack: Word accepted if the stack is empty
        // final: word accepted if the current state is final
        // stackFinal: word accepted if the current state is final and the stack is empty
        acceptedWord: function (symbols,mode) {
            var states = aude.toArray(this.getCurrentStatesStacks()), //Save the current stack,states,last taken transitions
            stack = this.getStack().slice(),
            transitions = new Set(this.getLastTakenTransitions());

            this.setCurrentState({"state":this.getInitialState(),"stack":this.getStack()});
            this.runWord(symbols);
            if (mode===0 || mode==="stack")
                var accepted = this.isStackEmpty() && this.currentStates.card()>0; //The stack is empty (only the initial stackS ymbol) and we read all the symbols of the word
            else if (mode===1 || mode==="final")
                var accepted = (this.currentStates.inter(this.finalStates)).card() !== 0; //End on a final state
            else if (mode===2 || mode==="stackFinal")
                var accepted = (this.currentStates.inter(this.finalStates)).card() && this.isStackEmpty();

            this.setCurrentStates(states);
            this.lastTakenTransitions = transitions;
            this.stack = stack.slice();
            return accepted;
        },


       // This method returns the Set of transitions that were taken while running on the last symbol. See the runSymbol method for more information.
       getLastTakenTransitions: function () {
           return this.lastTakenTransitions;
       },
    };





    //Class to handle transition for pushdown automata
    pkg.PushdownTransition = function(startState,symbol,stackSymbol,endState,newStackSymbol) {
        this.startState = startState;
        this.symbol     = symbol;
        this.stackSymbol = stackSymbol;
        this.endState   = endState;
        this.newStackSymbol = newStackSymbol;
    };

    pkg.PushdownTransition.prototype = {
        toString: function () {
            return "Transition(" + aude.elementToString(this.startState) + ", " + aude.elementToString(this.symbol) + ", " + aude.elementToString(this.stackSymbol) +
", " + aude.elementToString(this.endState) + ", " + aude.elementToString(this.newStackSymbol) + ")";
        },

    };
    pkg.PushdownTransition.prototype.serializeElement = pkg.PushdownTransition.prototype.toString;

}(this));
