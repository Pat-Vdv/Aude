[Aude](http://automata.forge.imag.fr/) is a free (as in free speech and in free
beer) software to teach and experiment with finite state machines.

# What is a Finite State Machine?

An a finite state machine is a mathematical object behind regular
expressions and robots. More precisely, we can define a finite state
machine as a quintuplet composed of:

 - Q     : a set of states
 - Sigma : a set of symbols
 - q0    : an initial state
 - Delta : a set of transitions, a transition being a (state, symbol, state)
   triplet.
 - F     : a subset of Q in which states are considered accepting / final

# What does Aude do?

This program lets the user write, draw or represent automata, run or write
automata/set-related algorithms. To write algorithms, a convenient language
strongly inspired of Javascript has been designed: Audescript. This language
as native support for automata and sets. Sets have their own dedicated
notation and the language defines common set operations as operators such as
minus, inter, union and allow set iteration thanks to a foreach structure.
But you don’t have to write algorithms: Aude comes with a set of predefined
algorithms commonly found in lectures about finite state automata.

# Running Aude

Due to restriction of current browsers for accessing files locally, you need to run a web server.
Mac / Linux users can run the following command in Aude's folder:

    python3 -m "http.server" 8010 --bind localhost

Then, Aude is accessible at http://localhost:8010/ and will work on any recent major browser.

Supported browsers are:
 - The last version of Firefox
 - A recent version of Rekonq or any other browser that makes use of Webkit
 - The last version of Google Chrome / Chromium
 - The last version of Opera

Should work on:
 - a recent version of Safari

Probably does not work on Internet Explorer / Edge as Aude is untested in
these browser. Yell at Microsoft to provide a Linux version which doesn't
requires downloading Gigabytes of Windows virtual machines and having
hundreds of gigabytes of RAM to run them. We advise users of Internet
Explorer and Edge to consider using another browser for their own sanity
anyway.

Note that in browsers using a relatively old version of WebKit, you won't be
able to see line numbers when an error in a audescript program occurs. If
you intend to program in Audescript, you might want to use Firefox, Chromium
or a new version of Opera.

# Installing

Place the folder of Aude anywhere you want Aude to be installed.
If you got the code of Aude from the sources, you need to install [Typescript](https://github.com/Microsoft/TypeScript)
and then type `make`.

# Unit tests

Run the Unit Tests algorithm in Aude. Running unit tests in a terminal may come
at some point.

# Code documentation

Documentation is available in [folder `doc`](doc/index.md).
`make` downloads mdwiki to doc/index.html, which can be used to read this
documentation using a browser.

# Running Audescript Programs Outside of the Browser

This is not possible yet, but we are working on it. Everything was thought
to make this possible.

In the meantime, you can get the Javascript output of any program by
running:

    nodejs js/audescript/audescript.js your-program.ajs

your-program.js is produced. Running it directly is not possible yet though,
as it requires a package yet to be written, audescript-runtime, providing
function needed to run Audescript programs and a way to handle dependencies
between Audescript program.

# Licenses

Some parts of Aude are under a BSD license: set.js, automaton.js,
automaton2dot.js ; these pieces of code are completely independent from other
parts.

Most parts are under GPLv3+: index.html, the GUI and Audescript.

One file is under WTFPL: mousewheel.js (you can do almost whatever you want with it).

This program makes use of the following external projects:
 - libD, under GPLv3+.
 - viz.js, which is Graphviz compiled in Javascript. See lib/COPYING.viz.txt
   for more information
 - fileSaver.js, which is under X11/MIT, see lib/LICENSE.fileSaver.md for
   more information
 - Ace, which is under a BSD license.
 - KaTeX, which is under MIT.
 - Hammer, which is under MIT.
 - A subset of the Breeze iconset (https://github.com/KDE/breeze-icons) which is licensed under
   the GNU Library General Public License.

The GPLv3 license is provided in the file gpl.txt.
The WTFPL license is provided in the file wtfpl.txt.

# Authors

Main author: Raphaël Jakse (UGA) : raphael dot jakse at univ-grenoble-alpes dot fr
Supervised by Yliès Falcone : ylies dot falcone at univ-grenoble-alpes dot fr

This program was started as a personal project around November 2012. The main
goal was to get to know automata and related algorithms, and also help
friends in their revisions, in the hope more people, teachers included, would
find it useful.

A big part of Aude, however, was written during an internship in summer 2013
at Verimag, supervised by Yliès Falcone (from the LIG Laboratory) and paid by
Université Joseph Fourier (now Université Grenoble Alpes).

It has now been improved by multiple interns across the years.
