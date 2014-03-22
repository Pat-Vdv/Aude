/*
    Copyright (c) 2013-2014, Raphaël Jakse (Université Joseph Fourier)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, that list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, that list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Université Joseph Fourier nor the
      names of its contributors may be used to endorse or promote products
      derived from that software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint node:true, rhino:true, indent: 4, nomen: true, ass: true, vars: true, evil: true, plusplus: true, eqeq: true, todo: true, bitwise: true, stupid:true */
/*jshint -W020*/
/*global global:true, require:true, readFile:false, Packages:false, java:false, console:true, arguments:false, Audescript:false, Set:false */

(function (that) {
    "use strict";

    var i, j, p;

    // thanks colors.js (BSD license, Copyright (c) 2010 Marak Squires, Alexis Sellier (cloudhead))
    var styles = {
        //styles
        'bold' : ['\x1B[1m', '\x1B[22m'],
        'italic' : ['\x1B[3m', '\x1B[23m'],
        'underline' : ['\x1B[4m', '\x1B[24m'],
        'inverse' : ['\x1B[7m', '\x1B[27m'],
        'strikethrough' : ['\x1B[9m', '\x1B[29m'],
        //text colors
        //grayscale
        'white' : ['\x1B[37m', '\x1B[39m'],
        'grey' : ['\x1B[90m', '\x1B[39m'],
        'black' : ['\x1B[30m', '\x1B[39m'],
        //colors
        'blue' : ['\x1B[34m', '\x1B[39m'],
        'cyan' : ['\x1B[36m', '\x1B[39m'],
        'green' : ['\x1B[32m', '\x1B[39m'],
        'magenta' : ['\x1B[35m', '\x1B[39m'],
        'red' : ['\x1B[31m', '\x1B[39m'],
        'yellow' : ['\x1B[33m', '\x1B[39m'],
        //background colors
        //grayscale
        'whiteBG' : ['\x1B[47m', '\x1B[49m'],
        'greyBG' : ['\x1B[49;5;8m', '\x1B[49m'],
        'blackBG' : ['\x1B[40m', '\x1B[49m'],
        //colors
        'blueBG' : ['\x1B[44m', '\x1B[49m'],
        'cyanBG' : ['\x1B[46m', '\x1B[49m'],
        'greenBG' : ['\x1B[42m', '\x1B[49m'],
        'magentaBG' : ['\x1B[45m', '\x1B[49m'],
        'redBG' : ['\x1B[41m', '\x1B[49m'],
        'yellowBG' : ['\x1B[43m', '\x1B[49m']
    };

    function style(s, st) {
        return styles[st][0] + s + styles[st][1];
    }

    try {
        that.fs = require('fs');
    } catch (e) {
        if (that.readFile) {
            that.fs = {
                readFileSync: function (f) {
                    return readFile(f);
                },
                existsSync: function (f) {
                    return new java.lang.io.File(f).exists();
                }
            };
        }
    }

    try {
        that.path = require('path');
    } catch (e) {
        that.path = {
            dirname: function (f) {
                return new java.lang.io.File(f).getParentFile();
            }
        };
    }

    if (!that.console) {
        that.console = {
            log: function (l) {
                java.lang.System.out.println(l);
            }
        };
    }

    if (!that.process) {
        var stdinClosedFunction = [];

        that.process = {
            argv: ['', ''].concat(that.arguments),
            stdin: {
                isTTY: false,
                on: function (evt, f) {
                    switch (evt) {
                    case 'data':
                        var reader = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System['in']));
                        var s;
                        do {
                            s = reader.readLine();

                            if (s) {
                                f(s + '\n');
                            }
                        } while (s);
                        if (stdinClosedFunction) {
                            var k;
                            for (k = 0; k < stdinClosedFunction.length; ++k) {
                                stdinClosedFunction[k]();
                            }
                        }
                        break;
                    case 'end':
                    case 'close':
                        stdinClosedFunction.push(f);
                        break;
                    }
                }
            }
        };
    }

    var audePath = that.path.dirname(that.process.argv[1]);

    if (typeof that.Packages === "object" && String(Packages) === "[JavaPackage ]") {
        // for Rhino
        that.global = that;
        that.require = function (js) {
            eval.call(global, readFile(js));
        };
    } else {
        that.global = global;
    }

    var packages = ['set', 'automata', 'mappingfunction', 'audescript'];
    for (i in packages) {
        if (packages.hasOwnProperty(i)) {
            p = require(audePath + '/js/' + packages[i] + '.js');
            for (j in p) {
                if (p.hasOwnProperty(j)) {
                    that.global[j] = p[j];
                }
            }
        }
    }

    // ignore run lines
    that.global.run = that.global.get_automaton = that.global.get_automatons = function () { return; };
    that.global.currentAutomaton = 0;

    var gots = new Set();

    function loadAJS(f) {
        var needs = [];
        var code = that.fs.readFileSync(f, {encoding: 'utf8'});
        var jscode = Audescript.toPureJS(code, needs);
        that.global.getNeeds(needs, f);
        that.global.require = require;
        that.global.process = process;
        that.global.path    = that.path;
        that.global.fs      = that.fs;
        that.global.arguments = process.argv.slice(2);
        eval.call(global, jscode);
    }

    global.getNeeds = function (needs, keepArgument) {
        if (keepArgument) {
            needs = needs.slice();
        }

        var algo, pa;

        while (needs[0]) {
            algo = needs.shift();
            if (!gots.contains(algo)) {
                gots.add(algo);
                pa = that.path.dirname(keepArgument) + '/' + algo + '.ajs';
                if (that.fs.existsSync(pa)) {
                    loadAJS(pa);
                } else {
                    loadAJS(audePath + '/algos/' + algo + '.ajs');
                }
            }
        }
    };

    if (process.argv[2]) {
        loadAJS(process.argv[2]);
    } else {

        var rl;

        if (process.stdin.isTTY) {
            var readline = require('readline');

            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.setPrompt("> ");
            rl.prompt();
        } else {
            rl = process.stdin;
        }

        var audeString = '', sigIntAgain = false;
        var ctx = {};

        rl.on('close', function () {
            if (audeString) {
                var res = eval.call(ctx, Audescript.toPureJS(audeString));
                if (process.stdin.isTTY) {
                    console.log(res);
                }
            }
            audeString = '';
        });

        if (process.stdin.isTTY) {
            rl.on('line', function (s) {
                var res, needs = [];
                sigIntAgain = false;
                audeString += s + '\n';
                try {
                    res = eval.call(ctx, Audescript.toPureJS(audeString, needs));
                    that.global.getNeeds(needs, '#interpreter');
                    rl.setPrompt("> ");
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        rl.setPrompt("... ");
                        rl.prompt();
                        return;
                    }
                    console.log(e.stack);
                }

                if (res && typeof res === 'object' && typeof res.toString === 'function') {
                    if (res instanceof Set) {
                        console.log(style(res, 'cyan'));
                    } else {
                        console.log(res.toString());
                    }
                } else {
                    switch (res) {
                    case undefined:
                        console.log(style('undefined', 'grey'));
                        break;
                    case null:
                        console.log(style('null', 'bold'));
                        break;
                    case true:
                    case false:
                        console.log(style(res, 'yellow'));
                        break;
                    default:
                        if (typeof res === 'number') {
                            console.log(style(res, 'yellow'));
                        } else if (typeof res === 'string') {
                            console.log(style("'" + res.replace(/\'|\\/g, '\\$&') + "'", 'green'));
                        } else {
                            console.log(res);
                        }
                    }
                }

                audeString = '';
                rl.prompt();
            });

            rl.on('SIGINT', function () {
                if (sigIntAgain) {
                    console.log();
                    rl.close();
                    return;
                }

                rl.clearLine(process.stdin, 0);

                console.log();

                if (audeString) {
                    audeString = '';
                } else {
                    sigIntAgain = true;
                    console.log('(^C again to quit)');
                }

                rl.setPrompt('> ');
                rl.prompt();
            });

            rl.on('SIGCONT', function () {
                // `prompt` will automatically resume the stream
                rl.prompt();
            });

        } else {
            rl.on('data', function (chunk) {
                audeString += chunk;
            });
        }
    }
}(this));