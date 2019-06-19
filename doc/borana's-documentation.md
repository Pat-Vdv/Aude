# First off - Introduction

This documentation is an attempt to clarify most of my work during the internship with Team Aude. My algorithms aren't perfect, so further improvement wouldn't be a bad idea. If the reader has any questions regarding what I've coded, I invite you to email me at boranadollomaja[at]gmail[dot]com.

# Moore and Mealy machines

These automata are defined in `mealy.js` and `moore.js` in the form of classes. Read the content of these two files for more information.

# JSON format for Moore and Mealy machines

A JSON (JavaScript Object Notation) object is a format that is often used for serializing and transmitting structured data over a network connection. These objects are
sorrounded by curly braces `{}` and written in key/value pairs. Keys must be strings, and values must be a valid JSON data type (string, number, object, array, boolean or null). For example, here are two JSON object representing a Moore machine and a Mealy machine:

    var moore_json = {
            "states": ["00","01","10","11"],
            "initialState": "00",
            "inputAlph": ["0","1"],
            "outputAlph": ["0","1"],
            "transitions":[
                ["00","0","00"],
                ["00","1","01"],
                ["01","0","10"],
                ["01","1","11"],
                ["10","0","00"],
                ["10","1","01"],
                ["11","0","10"],
                ["11","1","11"]
            ],
            "outputs":[
                ["00","0"],
                ["01","0"],
                ["10","1"],
                ["11","1"]
            ]
          }

    //source for the following example http://www.vlsifacts.com/mealy-to-moore-and-moore-to-mealy-transformation/

    var mealy_json = {
        "states": ["q0","q1"],
        "initialState": "q0",
        "inputAlph": ["0","1"],
        "outputAlph": ["A","B"],
        "transitions":[
            ["q0","0","q0"],  ["q0","1","q1"],
            ["q1","0","q1"],  ["q1","1","q0"]
        ],
        "outputs":[
            ["q0","0","A"],  ["q0","1","A"],
            ["q1","0","B"],  ["q1","1","B"]
        ]
    }

You can find in `automaton2json.ajs` an algorithm that transforms a JSON object into a Moore or Mealy machine. Here's an example of how we can do that transformation, using that algorithm (wich I've divided in two function, called `object2mealy` and `object2moore`):

    let mealyEx := object2mealy(
                {
                "states": ["q0","q1","q2"],
                "initialState": "q0",
                "inputAlph": ["0","1"],
                "outputAlph": ["0","1"],
                "transitions":[
                    ["q0","0","q1"],   ["q0","1","q2"],
                    ["q1","0","q1"],   ["q1","1","q2"],
                    ["q2","0","q1"],   ["q2","1","q2"]
                 ],
                "outputs":[
                    ["q0","0","0"],   ["q0","1","0"],
                    ["q1","0","0"],   ["q1","1","1"],
                    ["q2","0","1"],   ["q2","1","0"]
                 ]
                }
            )
In this case, `mealyEx` is a Mealy class. This works similarly for a Moore class.

# Transforming a Moore machine into an equivalent Mealy machine

The code for this part is to be found in `MooreToMealy.ajs`.


The algorithm is the folowing:

Input − Moore Machine

Output − Mealy Machine

Step 1 − Take a blank Mealy Machine transition table format.

Step 2 − Copy all the Moore Machine transition states into this table format.

Step 3 − Check the present states and their corresponding outputs in the Moore Machine state table; if for a state Qi output is m, copy it into the output columns of the Mealy Machine state table wherever Qi appears in the next state.

You can find the algorithm [here] (https://www.tutorialspoint.com/automata_theory/moore_and_mealy_machines.htm).
Notice that the main thing that has to change is the output function of the machine.


# Transforming a Mealy machine to an equivalent Moore machine# Transforming a Moore machine into an equivalent Mealy machine

The code for this part is to be found in `MealyToMoore.ajs`.

This algorithm is harder than the previous one, so errors (hopefully not too many) and confusions with my implementation method can arise.
There were certain choices I made in order to implement the algorithm, such as the output of the start state in the Moore machine. Most of the time the output for this state is epsilon, since it generally cannot be defined.

The algorithm is the following:

Input − Mealy Machine

Output − Moore Machine

Step 1 − Calculate the number of different outputs for each state (Qi) that are available in the state table of the Mealy machine.

Step 2 − If all the outputs of Qi are same, copy state Qi. If it has n distinct outputs, break Qi into n states as Qin where n = 0, 1, 2.......

Step 3 − If the output of the initial state is 1, insert a new initial state at the beginning which gives 0 output.

You can find the algorithm [here] (https://www.tutorialspoint.com/automata_theory/moore_and_mealy_machines.htm).


I detailed the steps a little further in french in order to organize my steps before starting to code. It felt too bad to erase this chunk of
'thinking', so I'm putting here just in case.
    /*
    parcours de la liste des etats:
    pour chaque etat e faire
        pour chaque entree x faire
            etat_suivant := transition (etat, entree)
            sortie := output (etat, entree)
            couple(etat_suivant, sortie) <- construire tous les couples possibles commme ça
        fin pour
    fin pour

    pour chaque etat e faire
        deduire de l'ensemble des couples tous les sorties possibles pour e
        construire les nouveaux etats
        et leur associer les sorties correspondantes qu'on a deduit
    fin pour

    //reste a faire les nouveaux transitions

    pour chaque etat de moore (t1, o1) faire
        pour chaque entree a faire
            determiner transition (t1, a, t2) et sortie (t1, a, o2)
            trouver l'etat de moore (t2, o2) et lui associer a à partir de t1 <- nouveau transition
            ajouter ce nouveau transition dans l'ensemble des nouveaux transitions
        fin pour
    fin pour
    */
Here's an example showing a way to use this algorithm:

    from automaton2json   import object2mealymoore
    from automaton2json   import object2mealy
    from MealyToMoore     import mealy2moore

    let mealyEx := object2mealy(
                {
                "states": ["q0","q1","q2"],
                "initialState": "q0",
                "inputAlph": ["0","1"],
                "outputAlph": ["0","1"],
                "transitions":[
                    ["q0","0","q1"],   ["q0","1","q2"],
                    ["q1","0","q1"],   ["q1","1","q2"],
                    ["q2","0","q1"],   ["q2","1","q2"]
                ],
                "outputs":[
                    ["q0","0","0"],   ["q0","1","0"],
                    ["q1","0","0"],   ["q1","1","1"],
                    ["q2","0","1"],   ["q2","1","0"]
                ]
                },0
            )
    let moore := mealy2moore(mealyEx)
    console.log(moore.states)

    foreach x in moore.transition do
        foreach y in x do
            console.log(y)
        done
    done


# Drawing Mealy and Moore machines in Aude

I was curious to find out how the conversion of the Automaton class into an automaton drawing worked, and inversly the conversion of an automaton drawing into an Automaton class. So I tried to do the same thing for the Moore and Mealy machine, by using the Automaton class. This was a quick way to reach my goal, but if the reader is interested he/she can take this part a step further and create a passage Moore/Mealy class <-> moore/mealy machine drawing without using automatons at all!

For this task, we decided to represent a moore machine drawing by naming the states "state_name/output", and a mealy machine by naming the transitions "input/output".
This way we could have a simple way of representing these two machines by using the existing functionalities of Aude.

For this task, I have used and added code to the files `gui-run.js` and `gui-results.js`. I have added the methods `get_mealy`, `get_moore`, `setMealy` and `setMoore`.

In the methods `get_mealy` and `get_moore`, an existing function that converts an automaton drawing into the Automaton class is used. Then, the Automaton object is converted into a Mealy/Moore object. This way, in the end we have a Mealy/Moore object extracted from a drawing in Aude's site. Like I said in the beginning, we can take this task further and not use the Automaton class at all, and directly pass from a moore/mealy drawing into a Moore/Mealy object.

In the methods `setMealy` and `setMoore` I have converted the Moore/Mealy object into an equivalent Automaton and then used an existing function that drawed the Automaton in Aude. In the end we're left with a drawing of a moore/mealy machine. Here too, we can replace the Automaton with a careful transition from Moore/Mealy to a moore/mealy machine drawing.

# Creating false automata

An important part of Aude was the creation of quizzes. And the idea of taking an automaton and creating subltle false versions of it was useful to generate different options for a multiple choice test. You can find the algorithms dedicated to doing this in `makeFaultyAutomata.ajs`.
There are functions that change symbols of an existing transition, that erase a transition or add a random one, that remove an epsilon transition and more. Most of it is done randomly and there's a small interface that allows selecting the functions to apply to an automaton.

# Complicating automata

One thing we can do with an automaton is we can minimize it. But if given a minimized automaton, can we reverse the minimization algorithm and end up with a more complicated automaton equivalent to the one in the beginning?
This is what the idea of complicating automata consists of.
There a few functions at the moment in `complicate.ajs` that try to add transitions, states etc. to an automaton without changing the language it recognizes.

Here's a brief explanation of the idea behind each one of them:
(Note: A is the Automaton object)

 - addNotReachable(A) : adds a non reachable state to the automaton. Since by definition a non reachable state can never be reached from the intial state, it cannot change the language recognized by the automaton. The new state's name will be a number which will correspond to the number of states in the automaton, supposing that the other states are named '0' to 'Number_of_states-1'. Then we add a random number of transitions (I chose this random number to be from 1 to 4, this can be changed) from this new state to the other ones.

 - transitionNotCoreachable(A) : adds a random transition between two not co-reachable states. To implement this function I implemented another function calculating the co-reachable states of the automaton (to be found in `reachability.ajs`), so that the rest of the states of the automaton would be the not co-reachable ones. This function works if there are at least two not co-reachable states in the automaton. On second thought this part needs to be modified to at least one not co-reachable state, since we can add a transition even in the case of a single not co-reachable state. The language of the automaton will remain the same since both states end up in a not acceppting state.

 - addTransitionToANotCoreachable(A) : adds a random transition that goes to a not co-reachable state, this way the words that pass from this transition can never get to an accepting state therefore can never be recognized. This function, which in my opinion includes the previous one, is coded in a similar way, except that one of the states doesn't have to be not co-reachable.

 - copyTransitions(A) : this function starts off from a random state of the automaton and copies a random number of times transitions and states that come after that state for a certain number of times. This doesn't change the language the automaton recognizes as it is just a copy of existing states and transitions, the last copied transitions ties together a copied state with an existing state in the automaton. This is an interesting function of this section, and it could be rethought and complexified more. The results it produces are pretty interesting.

# Identifying the differences between two automata

To look at the differences between two automata we can look at:
 - the difference between the sets of transitions/states/reachable_states/coreachable_states/etc. (functions: setsDiff, transitionsDiff, statesDiff)
 - if the automatons have the same states, for two similar states we can look at the differences in their transitions
 - ... ?
I started doing this in `differences.ajs` but I haven't tested my functions. The problem of finding how two automata are different requires quite a lot of thought as to what kind of differences are we looking for, are the two automata similar in any way, how do we approach searching for these differences, etc. So this is a task that requires quite some work in the future, I've just scratched the surface of the problem.

[Back to the index](index.md)
