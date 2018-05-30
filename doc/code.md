# Make Aude
Aude does not run as-is when retrieved from sources.
One has to run `make` in the root folder of Aude before running it.

# Hitchhiker's Survival Guide to Aude Code

This documentation aims at easing the study of the code of Aude.
Sadly, the reality is harsh.
This documentation is not, and will never be, complete and up to date.
So Aude code hitchhiker's best and definitive friends are `grep` and the Web
Inspector.
In order to know where something is in Aude:
 - in the browser, right-click on it and pick Inspect.
 - in a UNIX command prompt

        cd aude/
        fgrep -n -R 'something' .

Aude comes with several libraries that are briefly presented here. These
libraries are used in the code of Aude. For concrete usage examples, grep the
code.

# Generalities

## Audescript
Audescript is a custom programming language. The goal of this language is to be
close to pseudo code notations used in computer science courses, for students to
fiddle with finite state machines.

See [the Audescript Documentation](audescript.md) for a brief overview of the
language.

## Coding Standards

A few rules must be respected when writing code in Aude.
See [coding-standards.md](coding-standards.md).

# Code Organization

## Entry Point: `index.html`

The entry point if the code of Aude is `index.html`.

### HTML vs XHTML

Aude is written in HTML5 and the code looks like it is written in its XHTML
variant, but handling Aude in XHTML would actually break it because
`innerHTML` and `document.write` are used at some places.
We plan to fix this and this should not be too hard, but at the time being,
`index.html` should be served as `text/html` and not as `application/xml+xhtml`.

### `boot`

Few things are loaded directly in the HTML code: `gui.css`, a big stylesheet to
style the whole User Interface, and `katex.min.css`, the CSS file for KaTeX.

Javascript code is loaded using function `boot`.

## js/lib/source-map.min.js

This is used by Audescript to map generated Javascript code to source written in
Audescript.
This eases debbugging Audescript code.

## js/lib/libD/1.1/core.js

This is the entry point of `libD`, a library that does a various things.

Notable parts of `libD` used in Aude are:

 - `libD.need` : this function loads libD modules that are required and calls
   the callback function that is passed in parameter when everything is loaded.
   The special module `ready` is not really a module but rather is considered
   loaded when the DOM of the web page is loaded (that is, when [DOMContentLoaded](https://developer.mozilla.org/fr/docs/Web/Events/DOMContentLoaded) has been fired).
   This is used in `js/gui/gui.js`.

 - `libD.ws` (Window System) and `libD.wm` (Window Manager): these module
   provides define a way to create windows like in a regular desktop environment.

   When loaded, these module create the function `libD.newWin`. Good usage
   examples of this function are in the files `js/gui/gui-word-execution.js` and
   `js/gui/gui-algo-list.js`.

   Anyway, you would have found them using grep, right? :-)

        fgrep -n libD.newWin . -R

 - `libD.jso2dom` (Javascript Object to DOM). This module provides a way to
   create complex interfaces in HTML without having to write lengthy code using
   the DOM interface by describing them with javascript objects.
   An example can be found in `js/gui/gui-word-execution.js` and using `grep`.

   This module could be compared to
   [JSX](https://facebook.github.io/react/docs/introducing-jsx.html), that
   appeared later and makes writing HTML in Javascript even easier.
   The main advantage of `jso2dom` compared to JSX is that it can be used with
   native Javascript (and is dead simple and lightweight).
   Using JSX should be considered though.

 - `libD.notify`. This module provides a desktop-like popup notification and is
   used in various places to display results and messages. This module also
   supports notifications with buttons. Please grep the code of Aude for good
   usage examples.
   The source code of this module is also quite simple and straightforward and
   skimming it is encouraged (js/lib/libD/1.1/notify.js).

 - `libD.Set`, `libD.Map`, `libD.Tuple`, `libD.elementToString` (`libD/set`).
   This is a library to handle sets, maps and tuples.
   Javascript already provides built-in sets and maps (but not tuples). However,
   specific functionality provided by this custom implementation is needed in
   Aude and Audescript. e.g.
   `new Set([1, new Set([4,5,6]), 3]).has(new Set([4,5,6]))` is true with this
   implementation and false with native sets.

   This implementation actually extends native sets and maps instead of
   completely ignoring them. As a consequence, most documentation about
   Javascript [native sets](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
   and [native maps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
   apply, but they still breaks compatibility with them by design.

   In Aude, `Set` and `Map` refer to this implementation and not to native
   Javascript implementations. See `js/aude.js`.

   `libD.elementToString` creates a unique string representation of any non
   circular object in javascript. This is used in the implementations of `Set`
   and `Map`, as well as at various places in Aude and Aude algorithms.

Examples:

    let s = new Set();
    s.add(2);

    if (s.contains(3)) {
        let s2 = s.union(new Set([5,6,7]));
    }

    if (s.card() == 3) {
        let p = s.powerset();
    }

    let s3 = s.inter(new Set([5,6,7]));

    let m = new Map();
    m.set({1: "hello"}, "hi");

    if (m.has({1: "hello"})) {
        let h = m.get({1: "hello"});
        m.set("hola", h);
        m.remove({1: "hello"});
    }

For a comprehensive list of supported methods, look at the source.


## js/lib/hammer.min.js, js/touch2click.js

These files are used to map touch events from tablets and phones to regular mouse events.
They effectively makes Aude compatible with tablets.

## js/mousewheel.js

This file handles mousewheel events.

## js/getFile.js

This file defines function `getFile(fname, success, failure, keep)` meant to
read a file stored from the working folder of Aude.
 - `fname` is the name of the file to get
 - `success : function (textContent : string)` is a callback function called with the file contents as text in parameter.
 - `failure (optional) : function (shortReason : string, details ?: any)` is a callback function that is called if the file could not be retreived. `details` may or may not be provided. Read the source code for more information.
 - `keep (optional): boolean` if provided and true, the file with be cached in memory so subsequent calls to `getFile` for this file will not access to the network or to the local filesystem.

## js/lib/babel-core/*

The Audescript transpiler outputs modern Javascript that might not be understood by all browsers.
Babel is used to transpile newer Javascript constructs to a Javascript version that is understood by today's browsers.

This is getting less and less relevent as time passes.

## js/audescript/audescript.js

This is Javascript generated version of the Audescript Transpiler. The actual source code of Audescript is in `audescript.ts`, written in Typescript.
To generate the javascript version, type `make` in the folder `js/audescript/`.

## js/audescript/runtime.js

This file contains a small set of functions used in code generated by the
Audescript Transpiler.

## js/aude.js

This file defines the namespace `aude` in which several functions are defined.
Reorganisation (and deletion?) of this file should be considered.

## js/automaton.js

This file defines the class `Automaton` used to represent finite state machines. For documentation, please read the comments in the source code.

## js/automaton2dot.js

This file defines a function to convert an automaton to the `dot` format of GraphViz.
It provides a usage example of the class `Automaton`.

## js/lib/

This folder contains code that is developed outside of Aude, used by Aude.

## js/lib/requestAnimationFrame.js

This is a [polyfill](https://en.wikipedia.org/wiki/Polyfill) for [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

## js/lib/katex/katex.min.js

This is a library to draw maths in a HTML document. We used to use MathJax, that
is more powerfull, but also slower and much more heavy.

## js/lib/fileSaver.js

This provides a function that can be called to save files locally.

## js/lib/ace-builds/src-noconflict/ace.js

Ace is the program editor used in Aude. We used to use CodeMirror.

### js/designer.js

This defines the module `AudeDesigner`, handling automata drawing in SVG.
This is complex code in which everything is tangled, containing geometry that
tries to resemble and be compatible with Graphviz output.

Usage examples in `js/gui.js` and `js/gui/gui-results.js`.

A designer can be created by using `let designer = new AudeDesigner(someDiv)` where
`someDiv` is a DOM div (`created using document.createElement("div")` for
example).

`let designer = AudeDesigner(someDiv, true)` will create a readonly designer
that allows to show an automaton with zoom and pan features.
`designer.getAutomaton()` returns the automaton that is currently drawn.
`designer.getAutomatonCode()` returns the code of the automaton.
`designer.redraw()` should be called whenever the container (`someDiv`) is
resized, except if the container is resized because the browser is resized.

## js/gui.js

`gui.js` is a file that contains everything related to the User Interface of
Aude.
It is generated by concatenating all javascript files in the folder `js/gui`
(there is a `Makefile` for that in this folder).

PLEASE do not modify this file by hand.
If you do not understand why, read the previous paragraph again.

To work on the interface of Aude, modify the relevant files in the folder
`js/gui` and run `make`.


### js/gui/gui.js
This is the main entry of Aude. It defines the namespace `AudeGUI` in which
every module of the interface should appear. On page load, it runs the `load`
method of each of these parts. Please look at `js/gui/gui-editors.js` for easy
to understand AudeGUI modules.

### js/gui/gui-algo-list.js

This creates the list of algorithms that are provided with Aude in the interface.
This is run on page load and never called again, so nothing about this file
appears in the namespace `AudeGUI`.

### js/gui/gui-automata-list.js

This defines the module `AudeGUI.AutomataList`, handling the part of the
interface that allows the user to choose on which automata algorithms should
run.

### js/gui/gui-editors.js

This defines the modules `AudeGUI.AutomatonCodeEditor` and
`AudeGUI.ProgramEditor` that handle edition of automata and programs,
respectively. These modules are very small and constitute good examples of
AudeGUI module.

### js/gui/gui-events.js

This binds events from the user interface to actions defined in the different
`AudeGUI` modules. This mostly concerns parts of the interfaces that are defined
in `index.html` and not created in Javascript.

### js/gui/gui-quiz.js

This defines the module `AudeGUI.Quiz`, that runs quizzes.

### js/gui/gui-results.js

This defines the module `AudeGUI.Results`, used to show results from algorithms
and Audescript programs in the main view of Aude.

### js/gui/gui-run.js

This defines the module `AudeGUI.Runtime`, that handles program and algorithm
execution.

### js/gui/gui-word-execution.js

This defines the module `AudeGUI.WordExecution`, used to animate the execution
of a word.
