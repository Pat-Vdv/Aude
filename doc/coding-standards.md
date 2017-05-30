The coding style used in Aude aims at being familiar for most people. It is
close to the one that is used in a good part of the Java community. It is also
close to what is used in the Linux Kernel. It is also inspired by the coding
style described by
[Douglas Crockford](http://javascript.crockford.com/code.html), who wrote [JSLint](http://www.jslint.com/), a [linter for Javascript](https://raygun.com/blog/using-linters-for-faster-safer-coding-with-less-javascript-errors/).

I (mostly) do not really care what convention is used, but I do care about
consistency accross a given codebase.
Any part of Aude should follow the conventions used everywhere else in Aude.

Rules that must be followed are:
 - Common sense wins over silly rules.
 - No clever tricks. Value clarity over consiseness.
 - Avoid spaces at the end of lines. Make your editor automatically remove extra spaces for you!
 - Indentation: 4 spaces, everywhere. No tabs.
 - One space between `if`, `function`, `do`, `while` or any structure keyword and the opening parenthesis.

        // Right
        if (b) {
            console.log("hello");
        }

        // Wrong
        if(b){
            console.log("hello");
        }

 - No space between the name of a function and an opening parenthesis.
 
        // Right
        myFun(2)

        // Wrong
        myFun (2)


 - No space after an opening parenthesis, brace or bracket and before a closing one.

        // Right
        f(1 + (2 + 3))

        // Wrong
        f( 1 + ( 2 + 3 ) )

   Except for assignment in conditionals:

        // Right
        if ( (i = isTrue()) ) {
            // ..
        }

        // Wrong
        if ((i = isTrue())) {
            // ..
        }

        // Extremely Dangerous
        if (i = isTrue()) {
            // ..
        }

 - Spaces around binary operators.

        // Right
        i = 1 + 2;

        // Wrong
        i=1+2;

 - No spaces with unary operators

        // Right
        i++

        if (!b) {
            // ...
        }

        // Wrong
        i ++

        if (! b) {
            // ...
        }

 - A semicolon to end each statement.

        // Right
        console.log("hello");

        // Wrong
        console.log("hello")


 - The opening brace of a block in a structure is not on its own line.

        // Right
        if (b) {
            console.log("hello");
        }

        // Wrong
        if (b)
        {
            console.log("hello");
        }


        // Right
        if (b) {
            console.log("hello");
        } else {
            // ...
        }

        // Wrong
        if (b) {
            console.log("hello");
        }
        else {
            // ...
        }

 - Each statement is on its own line, except if you really have something to hide.

        // Wrong
        doSomething(); doSomethingElse();

        // Right
        doSomething();
        doSomethingElse();

 - A line should not be longer than 80 characters, indentation included.
   If longer, it should be broken into multiple lines, except if it makes the
   code ugly.

 - If a function call is to be broken into multiple lines, each arguments must
   be on its own line.

        // Wrong
        reallyLongFunctionName(reallyLongParameter1, reallyLongParameter2, reallyLongParameter3, reallyLongParameter4)

        // Wrong
        reallyLongFunctionName(reallyLongParameter1, reallyLongParameter2
                               reallyLongParameter3, reallyLongParameter4)

        // Wrong
        reallyLongFunctionName(reallyLongParameter1, reallyLongParameter2
                reallyLongParameter3, reallyLongParameter4)

        // Right. Notice: 4 spaces for indentation of parameters.
        // This is different from many coding styles.
        reallyLongFunctionCall(
            reallyLongParameter1,
            reallyLongParameter2,
            reallyLongParameter3,
            reallyLongParameter4
        )

 - Ternaries can be nice, even if they are nested, if they are indented in a
   proper way:

        // Right
        reallyLongFunctionCall(
            isThisTrue
                ? value_if_true
                : value_if_false
        )

        // Wrong
        reallyLongFunctionCall(
            isThisTrue ?
                value_if_true
                : value_if_false
            )

        // Wrong
        reallyLongFunctionCall(
            isThisTrue ?
                value_if_true : value_if_false
        )

        // Right, in a very limited set of cases when things are really small
        reallyLongFunctionCall(isTrue ? iftrue : iffalse)

 - Don't fear of using parentheses. There is no shortage of them yet.
   - If something spreads across several lines, put parentheses.
   - Ternaries should be inside parentheses.
   - Use parentheses in complex logical expressions, even if they are not
     strictly necessary because of precedence rules.

            // Right
            if ((v1 == a1 && v2 == a2) || (v3 == a3 && v3 == a3))

            // Wrong
            if (v1 == a1 && v2 == a2 || v3 == a3 && v3 == a3)

     However, avoid making the code more difficult to read by using too many parentheses.

 - Braces for `if`, `else` and loop blocks are mandatory.

            // Wrong
            if (...)
                doSomething()

            // Wrong
            if (...) doSomething()

            // Right
            if (...) {
                doSomething()
            }

            // Ugly
            if (...)
                doSomething()
            else {
                // ...
            }

 - Comments are often best on their own line, using `//` even for multiple line
   comments.
 - Long and explicit variable names are great! Comments become obsolete,
   variable name not so much and can be changed easily. Names make great and
   cheap documentation.
 - In order to be connected correctly with the rest of the Javascript world, camelCase must be used everywhere for variable and function names.
   PascalCase must be used for contructors (class) names. underscores_must_be_avoided. Dont_Use_Ada_Style_Please.
 - In file names, camelCase should not be used for new files. dashes-are-used-instead (but_no_underscores).
 - Strict mode should be used everywhere. Source for each file should be contained in a closure like this:

        (function () {
            "use strict";

            // contents
        }());

   The only exception is if the file defines exactly one function:

        function whatever() {
            "use strict";

            // contents
        }

 - variable should be defined as close as when they are used, in the most
   restricted scope possible.
 - For new code, `let` (for mutable variables) and `const` (for immutable
   variables) should be prefered to `var`. `var` acts weirdly and eventually,
   occurences of this keyword in the code of Aude will be removed.

   Each variable declaration on its own line with its own declaration keyword.
   You can align things if you like to do it. It looks nicer but comes with its
   own set of problems.

        // Right
        let meaningfulName1 = null;
        let meaningfulInt2  = 0;
        let variable3       = "hello";

        // Wrong
        let meaningfulName1 = null,
            meaningfulInt2  = 0,
            variable3       = "hello";

        // Wrong
        let meaningfulName1 = null,
        meaningfulInt2  = 0,
        variable3       = "hello";

        // Wrong
        let meaningfulName1 = null, meaningfulInt2 = 0, variable3 = "hello";

 - Initialize variables when they are declared.

        // Wrong
        let v;

        // Right
        let v = null;

 - Vertical space is cheap. Compact code is hard to read.
   Put empty lines between groups of statements that are related to each other.
   One empty line is sufficient, no need for more.

   Put one empty line between a block and another block or a statement.

        // Wrong 
        if (cond1) {
            // ...
        }
        if (cond1) {
            // ...
        }

        // Right
        if (cond1) {
            // ...
        }

        if (cond1) {
            // ...
        }

 - Like in many C-like languages, the "[downto](https://stackoverflow.com/questions/1642028/what-is-the-operator-in-c)" operator is pretty:

        while (i --> 0) {
            // do this until while i is positive and not 0
        }

   But `i` must often be initialized just before the loop anyway, in which case
   a `for` loop should be used instead.

        for (int i = 10; i > 0; i--) {
            // do this until while i is positive and not 0
        }

 - In new code, use `for..of` to iterate over set and arrays:

        // Not wrong, but not right anymore, unless you need the index.
        for (let i = 0; i < array.length; i++) {
            console.log(a[i]);
        }

        // Better
        for (let v of array) {
            console.log(v);
        }

 - In new code, avoid the operator `in`. For iterating over Javascript objects:

        // Avoid in new code
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                console.log(obj[i]);
            }
        }

        // Outright dangerous
        for (var i in obj) {
            console.log(i, obj[i]);
        }

        // Right
        for (let i of Object.keys(obj)) {
            console.log(i, obj[i]);
        }

        // Better if you don't need the keys
        for (let v of Object.values(obj)) {
            console.log(v);
        }

   You might need [Object.getOwnPropertyNames](https://stackoverflow.com/questions/22658488/object-getownpropertynames-vs-object-keys) in some advanced cases.

Some of these rules are not respected at some places because some features were
not supported by browsers at the time of writting. This is not the case anymore.

Don't forget to proofread your modification before commiting them. Use and abuse [`git add -p`](http://johnkary.net/blog/git-add-p-the-most-powerful-git-feature-youre-not-using-yet/).
