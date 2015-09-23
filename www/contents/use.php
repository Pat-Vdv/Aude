<p>
    Be sure to check the <a href="?p=browsers">browser support</a> page. In
    particular, <strong>Internet Explorer and Edge are not supported and Firefox
    is the recommended browser</strong>, though Aude is also well tested in
    Chromium / Chrome and should mostly work in Opera, Safari and other
    Webkit-based browsers.
</p>

<h2> Use online </h2>

<p>
    The easiest way to use Aude is to use its online version at
    <a href="aude/">automata.forge.imag.fr/aude/</a>.
</p>

<h2 id="offline"> Download for offline use </h2>

<p>
    You can also use Aude offline. Aude was thought from the begining as a
    software which can be used without an Internet connection, so you can use it
    everywhere, even on a plane. You can download <a href="aude.zip">a zip
    archive here</a> and open the <code>index.html</code> file in your browser.
</p>
<p>
    This archive might be slightly outdated. If you need a more recent version
    of Aude, either use it online or check the <a href="#source-code"> Source
    code </a> section.
</p>

<p>
    The only supported way to run Aude offline is to use
    <a href="https://www.mozilla.org/fr/firefox/new/"> Mozilla Firefox </a>.
    Rekonq and Arora are also known to work. Other Webkit-based browsers might
    also work as well but not Epiphany nor Chrome.
</p>

<h3> Offline usage on Chrome, Opera and Epiphany</h3>

<p> If you really really want to use these browsers, you need to set up an HTTP
    server. Nothing crazy if you are on Mac, GNU/Linux or other Unix-like
    systems, it involves typing a single command in the Aude folder:
</p>

<pre><code>python -m SimpleHTTPServer 8010</code></pre>

<p> Then, visit <a href="http://localhost:8010/">http://localhost:8010/</a> with
your browser. (you can change 8010 by any number greater than 1024 as long as
you also change it in the command above).</p>

<p>
    On Windows, it is also possible but this is a bit more involved. The idea is
    the same, you need to set up a HTTP server. If you don't know how to do it,
    consider using Firefox, it will make your life easier, trust me.
</p>

<h2 id="source-code"> Getting the source code </h2>

<p>
    The best way to get the source code of Aude is to clone its git repository.
</p>

<ul>
    <li>
        As an anonymous visitor:
        <p style="text-align:left">
            <code>git clone https://forge.imag.fr/anonscm/git/aude/aude.git</code>
        </p>
    </li>
    <li>
        As an user of the IMAG's forge:
        <p style="text-align:left">
            <code> git clone git+ssh://username@scm.forge.imag.fr/var/lib/gforge/chroot/scmrepos/git/aude/aude.git </code>
        </p>
    </li>
</ul>

<p> Once cloned, make sure you run <code>make</code> in the cloned folder.
You'll need:</p>
<ul>
    <li> <a href="https://nodejs.org/">Node.js</a>.</li>
    <li> <a href="http://www.typescriptlang.org/">Typescript</a> (to build the Audescript transpiler).</li>
</ul>

<p>
    Contributions are very welcome, almost as much as black chocolate bars!
    Please contact us at aude {at} imag {dot} {please remove this and replace {at} and {dot}  by @ and ., respectively} fr.</p>
