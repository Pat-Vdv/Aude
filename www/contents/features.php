<h2> Features &amp; Screenshots </h2>
<h3>Drawing automata</h3>
<p>Like others tools of the domain, the tool provides a means to input automata by drawing them with mouse and keyboard in a hopefully intuitive way.</p>
<p>However, for repetitive tasks or big automata, it may be more convenient to write automata instead of drawing it. As a consequence, the tool also allows to input automata by writing them in a concise language.</p>
<p>To display results of algorithms or automata which were written rather than drawn, the tool embeds a Javascript version of Graphviz to render graphical version of automata automatically.</p>
<p>To help writing documents about automata, the tool provides a way to export images or DOT codes of automata produced by the user or the tool. DOT documents can then be translated into TiKZ format in order to include automata in a LaTeX document.</p>

<h3>Algorithms</h3>
<p>One of the most important features of the tool is its ability to run algorithms on automaton, and having these algorithm written and readable by the user in a dedicated language especially designed for manipulating sets and automata, still remaining generalist by being based on Javascript.</p>
<p>The tool comes with some basic algorithms such as:</p>
<ul>
   <li> determinization, </li>
   <li> completion, </li>
   <li> minimization, </li>
   <li> epsilon removal, </li>
   <li> product between automata, </li>
   <li> equivalence between automata, </li>
   <li> complementation, </li>
   <li> empty and infinite language tests, </li>
   <li> regular expression to automaton. </li>
</ul>
<div class="whata-illustr"><img alt="" src="aude/doc/aude-algo.png" /></div>
<p>In addition, users can write their own algorithms using the same dedicated language as the one used for writing embedded algorithms.</p>
<div class="whata-illustr"><img alt="" src="aude/doc/aude-prog.png" /></div>
<p>
   Algorithms can take several automata as parameters. The user will be asked to choose which automata are to send to the algorithm when running it.
</p>
<div class="whata-illustr"><img alt="" src="aude/doc/aude-list-automata.png" /></div>

<h3>Running words</h3>
<p>The tool features word execution on automata. Special care was taken to make it pleasant and easy to follow by showing the execution progressively taking place, the word proressively being “eaten”, with smooth transitions.</p>
<div class="whata-illustr"><img alt="" src="aude/doc/word-execution.png" /></div>

<h3>Quiz</h3>
<p>With the tool, you can write or run custom quizzes featuring:</p>
<ul>
   <li> mere multiple choice questions, with zero, one or more answers, with any number of possible answers (stay reasonable however!); </li>
   <li> questions that ask the user to draw an automaton corresponding to a set of words; </li>
   <li> questions that ask the user to draw an automaton corresponding to a language defined by an automaton or a regular expression in the quiz file. </li>
</ul>
<p>LaTeX can be used to write mathematics in the quiz, thanks to MathJax.</p>
<div class="whata-illustr"><img alt="" src="aude/doc/aude-quiz.png" /></div>
<h3>Internationalization</h3>
<p>It is almost always easier to learn something non-trivial in one's native language. While the tool is still only available in English and in French, it was conceived to make internationalization as easy as possible. Some work is still needed to make this happen, but not so much: in addition to a couple of lines of code, what is essentially needed is contributions from people who can speak well English and another language in which the tool is still not translated.</p>
<p> Please contact us if you are interested in translating the tool to your language. </p>
<div class="whata-illustr">
   <img alt="" src="aude/doc/translate.png" style="width:200pt">
</div>
