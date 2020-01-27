# Quiz & Questions

Aude includes an extensive framework to help create and design questions, and assemble them to create quizzes or exercises.

## Question Structure
Every category of question is represented by a class that inherits ```Question```, which defines the basic functionality of a question.

## Question Categories

Questions are divided into three categories, each having some specific feature.

### **Automaton Equivalency Questions**

Internally, these are represented by the ```AutomatonEquivQuestion``` class.

#### Wording

The instructions for this question category can be any combination of one, or two of the following : automata, regular expressions and linear grammars.

#### User's answer

The answer for this category can be an automaton, regular expression or a linear grammar.

#### Answer validation

First, the user's answer can be converted to an automaton, and checked for equivalency against a reference answer. <br>
Also, constraints can be added to the answer. These constraints are functions that take an object corresponding to the user's answer (```Automaton``` if it's an automaton, ```string``` for regular expressions and ```linearGrammar``` for linear grammars), and return an object with the following protoype : 

```ts 
{correct: boolean, details: string}
```

These functions can be defined in Audescript.

The two methods can be used, alone or in combination (equivalent automaton AND minimized constraint). 

### **Multiple Choice Questions**

Internally, these are represented by the ```MCQQuestion``` class.

#### Wording

The instructions for this question category are a list of choices. Choices can include ONE of the following : text, HTML code, an automaton, a regular expression, or a linear grammar. <br>
Additionnally, a question can be set a single choice, so only one choice will be able to be selected at a time by the user (radio buttons are shown instead of checkboxes).

#### Answer validation

The user's answer are checked against a set of correct choices. For the answer to be correct, the set selected by the user and the correct set should be equal.

### **Text Input Questions**

Internally, these are represented by the ```TextInputQuestion``` class.

#### Wording

The instructions for this question category can be any combination of one, or two of the following : automata, regular expressions and linear grammars.

#### User's answer

The answer for this category will be a string.

#### Answer validation
By default, the user's answer is checked against a set of correct strings. <br>
This behaviour can be overridden by using a validator. A validator is a function that has the following prototype :
```ts
(q: TextInputQuestion) => { correct: boolean, details: string }
```
Again, validators can be defined in Audescript.

## Quiz Files
This section aims at guiding people who want to create quizzes outside of the editor.
### JSON Quiz Format
Quizzes are stored using a JSON file. Here are descriptions of its fields.

* ```title: string``` : Title of the quiz.
* ```author: string``` : Author of the quiz .
* ```date: string``` : Creation date for the quiz.
* ```description: string | Array<string>``` : A description for the quiz, can contain LaTeX code. 
* ```questions: Array<Question>``` : An array of all the quizz's questions.

### JSON Question format
The following fields exist for any question category :

* `type: string` : Describes the type (and thus category) of question. Possible values are : `"mcq"`, `"automatonEquiv"`, or `"textInput"`.
* `instruction: string` : Wording text.
* `isInstructionHTML: boolean` : If `true`, the `instruction` field will be rendered as HTML.
* `point: number` : The number of points this question is worth (currently unused).
* `wordingDetails: Array | any` : Gives up to two wording "details", that is, objects that are displayed alongside the question. <br>
These are objects of the form ```{aType: string, content: any}```, where ```aType``` specifies the type of that object (can be ```"Automaton"```, ```"Regexp"``` or ```"LinearGrammar"```), and ```content``` actually contains the data for that object. The data is different according to the type, see [JSON Data Structures](#json-data-structures) for details on each type.

Moreover, every category has its own fields :
#### Automaton Equivalency Specific Fields

* `usersAnswerType` : The type of the answer expected from the user (`"Automaton"`, `"Regexp"`, or `"LinearGrammar"`).
* `correctAnswerGrammar`, `correctAnswerRegexp` and `correctAnswerAutomaton` (optional) : The reference structure to which the user's answer must be equivalent to be correct.
* `automatonAnswerConstraintsAudescript`, `regexpAnswerConstraintsAudescript` and `grammarAnswerConstraintsAudescript` (optional) : Arrays of the Audescript code for each constraint. Only the array corresponding to the `usersAnswerType` will be used.

#### Multiple Choice Questions Specific Fields
* ```wordingDetails: Array | any``` : Gives up to two wording "details", that is, objects that are displayed alongside the question. <br>
    These are objects of the form ```{aType: string, content: any}```, where ```aType``` specifies the type of that object (can be ```"Automaton"```, ```"Regexp"``` or ```"LinearGrammar"```), and ```content``` actually contains the data for that object. The data is different according to the type, see [JSON Data Structures](#json-data-structures) for details on each type.
* ```possibilities: Array```: Gives all the possibilities for this question.
A possibility is an object with the following prototype :
```ts
    {id: string, text?: string, html?: string, automaton?: Automaton, regex?: string, grammar?: linearGrammar}
```
A possibility is identified by its ```id``` field.
* ```answers: Array<string>```: The IDs of all the correct choices.
* ```singleChoice: boolean```: If truthy, only one choice will be selectable by the user.

#### Text Input Questions Specific Fields
* ```wordingDetails: Array | any``` : Gives up to two wording "details", that is, objects that are displayed alongside the question. <br>
    These are objects of the form ```{aType: string, content: any}```, where ```aType``` specifies the type of that object (can be ```"Automaton"```, ```"Regexp"``` or ```"LinearGrammar"```), and ```content``` actually contains the data for that object. The data is different according to the type, see [JSON Data Structures](#json-data-structures) for details on each type.
* ```correctAnswers: Array<string>```: Array of correct text answers (if validators not given).
* ```validatorAudescript: string```: Audescript code for the validator function. <br>
The given code will be the body (and only the body) of the function which must return an object of type :
```ts
{correct: boolean, details: string}
```
Inside of it, the ```TextInputQuestion``` object shall be available under the name ```q```, along with its most important member : ```q.usersAnswer```, the string for the user's answer.

**Example :**
```js
let r := new Object();
if (q.usersAnswer.startsWith("abcd")) then
    r.correct := true;
fi

if not r.correct then
    r.details = "Your answer doesn't start with abcd !";
fi

return r;
```

### JSON Data Structures {#json-data-structures}
#### Automata
Two possibilities here, either a specially formatted string, or a more user-friendly object of the form :
```ts
{states: Array<any>, finalStates: Array<any>, transitions: Array<Array<any>>}
```
Each transition is an array of the form : ```[<startState>, <transitionSymbol>, <endState>]```<br>
**Example :** 
```json
{
    "states": ["0","1","2"],
    "finalStates": ["0"],
    "transitions": [
        ["0","a","1"],
        ["1","a","2"],
        ["2","a","0"],
        ["0","b","0"],
        ["1","b","1"],
        ["2","b","2"]
    ]
}
```

#### Regular Expressions
Regular expressions are simply represented as a string.<br>
**Example** : 
```json
"a*(bc)d*"
```

#### Linear Grammars
Linear grammars use a specific string format.
**Example** :
```json
"({a,b,c},{0,1,2},1,{0 -> ε,1 -> c0,0 -> a2,2 -> c2,2 -> a0})"
```
