/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */

/*
    Copyright (c) Raphaël Jakse (Université Joseph Fourier), 2013

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint browser: true, ass: true, todo: true, vars: true, indent: 4, plusplus: true, nomen: true, unparam: true */
/*jshint boss: true*/
/*eslint-env browser*/
/*eslint no-console:0, no-alert:0, no-underscore-dangle:0 */
/*global atob:false, btoa:false, DOMParser:false, SVGPathSeg: false, parse_transition: false, format_transition: false, listenMouseWheel: false, epsilon: false, Set: false, automataMap:false, Automaton: false*/

// NEEDS: automaton.js, mousewheel.js;

// TODO: move initial state's arrow.

(function (pkg, pkgGlue, that) {
    "use strict";

    var svgNS = "http://www.w3.org/2000/svg";
    var RESIZE_HANDLE_WIDTH = 6;
    var CSSP = "automata-designer-";
    var OVERLAY_TIMEOUT = 1500;
    var OVERLAY_TOP_OFFSET = 10;

    // translate the node with the vector (tx,ty)
    function translate(n, tx, ty) {
        var attrsx = ["x", "cx", "x1", "x2"],
            attrsy = ["y", "cy", "y1", "y2"],
            p      = n.pathSegList || n.points,
            leng,
            attr,
            seg,
            a,
            s;

        if (p) {
            for (seg = 0, leng = p.numberOfItems; seg < leng; ++seg) {
                s = p.getItem(seg);
                if (s.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                    s.x1 += tx;
                    s.x2 += tx;
                    s.y1 += ty;
                    s.y2 += ty;
                }

                s.x  += tx;
                s.y  += ty;
            }
        } else {
            for (attr = 0; attr < 4; ++attr) {
                a = attrsx[attr];
                if (n.hasAttribute(a)) {
                    n.setAttribute(a, parseFloat(n.getAttribute(a)) + tx);
                }

                a = attrsy[attr];
                if (n.hasAttribute(a)) {
                    n.setAttribute(a, parseFloat(n.getAttribute(a)) + ty);
                }
            }
        }
    }

    var nodeLists          = [], // array containing all the automata's "nodeList"s
        initialStateArrows = [], // array containing all the automata's initial state's arrow
        initialStates      = [], // array containing all the automata's initial state's node
        svgs               = [], // will contain all currently opened automata
        nodeList,                // list of the states' nodes of the currently designed automaton
        initialStateArrow,       // current initial state arrow node (<g>)
        pathEditor,              // <g> to edit paths and control points of these paths
        initialState;            // current automaton initial state's note (<g>)


    // Given a node representing a state, gives the biggest ellipse of the node in case of a final state.
    // Otherwise, give the only ellipse of the node
    function getBigEllipse(n) {
        var ellipse = null, c = n.childNodes, i, len;
        for (i = 0, len = c.length; i < len; ++i) {
            if (c[i].cx) {
                ellipse = c[i];
            }
        }
        return ellipse;
    }

    function getSmallEllipse(n) {
        var c = n.childNodes, i, len;
        for (i = 0, len = c.length; i < len; ++i) {
            if (c[i].cx) {
                return c[i];
            }
        }
        return null;
    }

    //set the initial state for the current automaton
    function setInitialState(node) {
        var path, polygon, title;

        if (initialStateArrow) {
            path    = initialStateArrow.getElementsByTagName("path")[0];
            polygon = initialStateArrow.querySelector("polygon");
            title   = initialStateArrow.querySelector("title");
        } else {
            initialStateArrow = initialStateArrows[pkg.currentIndex] = document.createElementNS(svgNS, "g");
            initialStateArrow.id = "initialStateArrow";
            title = document.createElementNS(svgNS, "title");
            path =  document.createElementNS(svgNS, "path");
            polygon = document.createElementNS(svgNS, "polygon");
            path.setAttribute("stroke", "black");
            polygon.setAttribute("stroke", "black");
            polygon.setAttribute("fill", "black");
            initialStateArrow.appendChild(title);
            initialStateArrow.appendChild(path);
            initialStateArrow.appendChild(polygon);
            pkg.svgNode.querySelector("g").appendChild(initialStateArrow);
        }

        var ellipse = getBigEllipse(node),
            cy   = ellipse.cy.baseVal.value,
            cx   = ellipse.cx.baseVal.value,
            rx   = ellipse.rx.baseVal.value,
            dx   = cx - rx,
            dx10 = dx - 10,
            dx5  = dx - 5;

        path.setAttribute("d",
            "M" + (dx - 38)           + "," + cy +
            "C" + (dx - (28 * 2 / 3)) + "," + cy +
            " " + (dx - (28 / 3))     + "," + cy +
            " " + dx10                + "," + cy);

        polygon.setAttribute("points",
                  dx   + "," + cy       +
            " " + dx10 + "," + (cy - 4) +
            " " + dx5  + "," + cy       +
            " " + dx10 + "," + cy       +
            " " + dx10 + "," + cy       +
            " " + dx10 + "," + cy       +
            " " + dx5  + "," + cy       +
            " " + dx10 + "," + (cy + 4) +
            " " + dx   + "," + cy       +
            " " + dx   + "," + cy);

        title.textContent = "_begin->" + atob(node.id);
        initialState = initialStates[pkg.currentIndex] = node;
    }

    var resizeHandle = null, resizeHandledElement = null;
    var currentOverlay = null, overlay = null, stateOverlay = null, transitionOverlay = null;

    function overlayHide() {
        if (overlay) {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            currentOverlay = null;
        }
    }

    function resizeHandlesHide() {
        if (!resizeHandle || !resizeHandle.g.parentNode) {
            return;
        }

        var p = resizeHandle.g.parentNode;
        p.removeChild(resizeHandle.g);

        if (resizeHandledElement) {
            resizeHandledElement.classList.remove(CSSP + "resize-handled");
            resizeHandledElement = null;
        }
    }

    function addDist(p, cx, cy, dist) {
        if (dist) {
            var dx = p.x - cx;
            var dy = p.y - cy;
            var oldD = Math.sqrt(dx * dx + dy * dy);
            var newD = oldD + dist;

            p.x = cx + dx * newD / oldD;
            p.y = cy + dy * newD / oldD;
        }
        return p;
    }

    // Given a SVG <ellispe /> and its center (cx, cy), a point (x,y), a distance to the ellipse in pixels,
    // gives the coordinates of the point placed around the ellipse to the desired distance.
    // Parameters:
    //  - ellipse : svg <ellipse /> node.
    //  - x, y : coordinates of the point to place
    //  - p (optional) : an object which x and y will be set to the result coordinates
    //  - distanceToEllipse (optional, defaults to 0) : the distance to which the point must be placed
    //  - cx, cy (optional) : the center of the ellipse, if already known
    //  Optional parameters can get null in case they have to be passed (distanceToEllipse must be set to 0 instead)
    function pointOnEllipse(ellipse, x, y, p, distanceToEllipse, cx, cy) {
        if (!cy) {
            cy = ellipse.cy.baseVal.value;
        }

        if (!cx) {
            cx = ellipse.cx.baseVal.value;
        }

        var ry = ellipse.ry.baseVal.value,
            rx = ellipse.rx.baseVal.value;

        if (!p) {
            p = {};
        }

        var c = y - cy;
        var d = x - cx;

        var common = rx * ry / Math.sqrt(rx * rx * c * c + ry * ry * d * d);
        p.x = cx + common * d;
        p.y = cy + common * c;

        return addDist(p, cx, cy, distanceToEllipse);
    }

    // Position the triangle polygonPoints of a transition correctly on the svg <ellipse /> at point p{x,y}.
    // Parameters :
    //  - polygonPoints : points of the SVG node representing the triangle
    //  - ellipse : the SVG node representing the ellipse
    //  - cx, cy (optional) : the center of the ellipse, if already known
    function posTriangleArrow(polygonPoints, ellipse, p, cx, cy) {

        if (!cy) {
            cy = ellipse.cy.baseVal.value;
        }

        if (!cx) {
            cx = ellipse.cx.baseVal.value;
        }

        var beta    = Math.PI / 2 - (Math.atan((cx - p.x) / (cy - p.y)) || 0),
            top     = pkg.svgNode.createSVGPoint(),
            bot     = pkg.svgNode.createSVGPoint(),
            top2    = pkg.svgNode.createSVGPoint(),
            peak    = pkg.svgNode.createSVGPoint(),
            cosBeta = 3.5 * (Math.cos(beta) || 1),
            sinBeta = 3.5 * (Math.sin(beta) || 0),
            i;

        top.y = p.y - cosBeta;
        top.x = p.x + sinBeta;

        bot.y = p.y + cosBeta;
        bot.x = p.x - sinBeta;

        top2.x = top.x;
        top2.y = top.y;

        pointOnEllipse(ellipse, p.x, p.y, peak, 0, cx, cy);

        for (i = polygonPoints.numberOfItems; i; --i) {
            polygonPoints.removeItem(0);
        }

        polygonPoints.appendItem(top);
        polygonPoints.appendItem(peak);
        polygonPoints.appendItem(bot);
        polygonPoints.appendItem(top2);
    }

    // Make a transition straighforward.
    // Parameters:
    //  - path: the <path /> node of the transition
    //  - polygonPoints: points of the triangle node of the transition
    //  - text: the <text /> label node of the transition
    //  - stateOrig: the node representing the start state of the transition
    //  - stateDest: the node representing the end state of the transition
    function cleanTransitionPos(path, polygonPoints, text, stateOrig, stateDest) {
        var pathSegList = path.pathSegList,
            ellipseD    = getBigEllipse(stateDest),
            cx          = ellipseD.cx.baseVal.value,
            cy          = ellipseD.cy.baseVal.value,
            po          = pathSegList.getItem(0),
            p,
            i;

        if (stateOrig === stateDest) {
            for (i = pathSegList.numberOfItems; i > 3; --i) {
                pathSegList.removeItem(2);
            }

            while (i < 3) {
                pathSegList.appendItem(path.createSVGPathSegCurvetoCubicAbs(0, 0, 0, 0, 0, 0));
                ++i;
            }

            p = pathSegList.getItem(2);

            var pi = pathSegList.getItem(1);
            var rx = ellipseD.rx.baseVal.value,
                ry = ellipseD.ry.baseVal.value;

            pointOnEllipse(ellipseD, cx - 10, cy - 18 - ry, po, 0, cx, cy);

            p.x   = cx + 10;
            p.y   = po.y - 10;
            pi.x1 = po.x - 1;
            pi.y1 = po.y - 10;
            pi.x  = cx;
            pi.y  = po.y - 19;
            pi.x2 = pi.x - 8;
            pi.y2 = pi.y;
            p.x1  = pi.x + 5;
            p.y1  = pi.y;
            p.x2  = p.x - 1;
            p.y2  = p.y - 6;
            posTriangleArrow(polygonPoints, ellipseD, p, cx, cy);

            text.setAttribute("x", pi.x);
            text.setAttribute("y", pi.y - 5);
            return;
        }

        i = pathSegList.numberOfItems;

        while (i > 2) {
            pathSegList.removeItem(2);
            --i;
        }

        p = pathSegList.getItem(pathSegList.numberOfItems - 1);

        var ellipseO = getBigEllipse(stateOrig);

        pointOnEllipse(ellipseO, cx, cy, po);
        pointOnEllipse(ellipseD, ellipseO.cx.baseVal.value, ellipseO.cy.baseVal.value, p, 10);

        p.x1 = po.x + (p.x - po.x) / 3;
        p.y1 = po.y + (p.y - po.y) / 3;
        p.x2 = po.x + (p.x - po.x) * 2 / 3;
        p.y2 = po.y + (p.y - po.y) * 2 / 3;

        posTriangleArrow(polygonPoints, ellipseD, p);

        if (text) {
            text.setAttribute("x", (p.x + po.x) / 2);
            text.setAttribute("y", (p.y + po.y) / 2 - 5);
        }
    }

    var _ = pkg.l10n = that.libD && that.libD.l10n ? that.libD.l10n() : function (s) { return s; };

    pkg.svgNode      = null;      // <svg> editor
    pkg.svgZoom      = 1;         // current zoom level
    pkg.currentIndex = 0;         // index of the currently designed automaton

    // set the automaton #<index>'s code
    pkg.setAutomatonCode = function (automaton, index) {
        var matches = automaton.match(/<representation type="image\/svg\+xml">([\s\S]+)<\/representation>/);
        if (matches) {
            pkg.setSVG(matches[1], index);
        } else {
            pkgGlue.requestSVG(index);
        }
    };

    // reset the automaton #<index>
    pkg.clearSVG = function (index) {
        pkg.setSVG("<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'> <g id='graph1' class='graph' transform='scale(1 1) rotate(0) translate(0 0)'> <title>automaton</title></g></svg>", index);
    };

    function fixBrokenGraphvizTitle(t) {
        return t.replace(/\\\\/g, "\\");
    }

    function toBrokenGraphvizTitle(t) {
        return t.toString().replace(/\\/g, "\\\\");
    }

    // set current automaton's SVG
    pkg.setSVG = function (svg, index) {
        if (!svg) {
            return pkg.clearSVG(index);
        }

        var svgWorkingNode;
        if (index === pkg.currentIndex) {
            if (typeof svg === "string") {
                pkg.svgContainer.innerHTML = svg.replace(/<\?[\s\S]*\?>/g, "").replace(/<![\s\S]*?>/g, "");
            } else {
                pkg.svgContainer.textContent = "";
                pkg.svgContainer.appendChild(svg.cloneNode(true));
            }

            svgWorkingNode = pkg.svgNode = svgs[index] = pkg.svgContainer.querySelector("svg");
        } else {
            svgWorkingNode = svgs[index] = new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("svg");
        }

        svgWorkingNode.setAttribute("width",  pkg.svgContainer.offsetWidth);
        svgWorkingNode.setAttribute("height", pkg.svgContainer.offsetHeight);

        if (!svgWorkingNode.viewBox.baseVal) {
            svgWorkingNode.setAttribute("viewBox", "0 0 " + pkg.svgContainer.offsetWidth + " " + pkg.svgContainer.offsetHeight);
        }

        var workingNodeList = nodeLists[index] =  {},
            states = svgWorkingNode.querySelectorAll(".node"),
            len,
            i;

        for (i = 0, len = states.length; i < len; ++i) {
            states[i].querySelector("ellipse").setAttribute("fill", "transparent");
            workingNodeList[atob(states[i].id)] = {
                t: []
            };
        }

        var edges = svgWorkingNode.querySelectorAll(".edge");
        for (i = 0, len = edges.length; i < len; ++i) {
            if (edges[i].id !== "initialStateArrow") {
                states = edges[i].id.split(" ");
                workingNodeList[atob(states[1])].t.push([edges[i], false]); // false : state is not origin
                if (states[1] !==  states[0]) {
                    workingNodeList[atob(states[0])].t.push([edges[i], true]); // true : state is origin
                }
            }
        }

        var g = svgWorkingNode.querySelector("g");
        if (g.hasAttribute("transform")) {
            var translates = g.getAttribute("transform").match(/translate\(([0-9.]+)(?:[\s]+([0-9.]+)\))/),
                tx = translates ? (parseFloat(translates[1]) || 0) : 0,
                ty = translates ? (parseFloat(translates[2]) || 0) : 0;

            g.removeAttribute("transform");
            var ln = g.querySelectorAll("*");
            for (i = 0, len = ln.length; i < len; ++i) {
                translate(ln[i], tx, ty);
            }
        }

        var childNodes = g.childNodes;
        for (i = 0, len = childNodes.length; i < len; ++i) {
            if (childNodes[i].nodeName === "polygon") {
                g.removeChild(childNodes[i]);
                break;
            }
        }

        var workingInitialStateArrow = initialStateArrows[index] = svgWorkingNode.getElementById("initialStateArrow");
        if (index === pkg.currentIndex) {
            initialStateArrow = workingInitialStateArrow;
        }
        if (workingInitialStateArrow) {
            setInitialState(
                svgWorkingNode.getElementById(
                    btoa(
                        fixBrokenGraphvizTitle(
                            workingInitialStateArrow.querySelector("title").textContent.substr(8)
                        )
                    )
                )
            );

            // 8 : size of "_begin->"
        } else {
            initialState = initialStates[index] = null;
        }
        pkg.setCurrentIndex(pkg.currentIndex);
    };

    // Choose the current automaton
    pkg.setCurrentIndex = function (index) {
        pkg.cleanSVG(pkg.currentIndex, true);
        pkg.currentIndex = index;
        if (!svgs[index]) {
            pkg.clearSVG(pkg.currentIndex);
        }

        nodeList = nodeLists[index];
        initialStateArrow = initialStateArrows[index];
        initialState = initialStates[index];

        if (pkg.svgNode) {
            pkg.svgContainer.replaceChild(svgs[index], pkg.svgNode);
        } else {
            pkg.svgContainer.appendChild(svgs[index]);
        }

        pkg.svgNode = svgs[index];
        pkg.redraw();
    };

    // this function is to be called when a new automaton with index <index> must be created
    pkg.newAutomaton = function (index) {
        if (nodeLists[index]) {
            pkg.clearSVG(index);
        }
    };

    // remove the automaton #<index>
    pkg.removeAutomaton = function (index) {
        svgs.splice(index, 1);
        nodeLists.splice(index, 1);
        initialStateArrows.splice(index, 1);
    };

    // this function is to be called when the SVG code of an automaton has to be retrieved
    pkg.cleanSVG = function (index, dontCleanColors) {
        if (pathEditor && pathEditor.parentNode) {
            pathEditor.parentNode.removeChild(pathEditor);
            pathEditor = null;
        }

        overlayHide();
        resizeHandlesHide();

        if (!dontCleanColors && svgs[index]) {
            var ellipses = svgs[index].getElementsByTagName("ellipse"),
                edges    = svgs[index].getElementsByClassName("edge"),
                len,
                i;

            for (i = 0, len = ellipses.length; i < len; ++i) {
                ellipses[i].setAttribute("fill", "transparent");
                ellipses[i].classList.remove(CSSP + "resize-handled");
            }

            for (i = 0, len = edges.length; i < len; ++i) {
                if (edges[i].id !== "initialStateArrow") {
                    edges[i].getElementsByTagName("text")[0].removeAttribute("fill");
                    edges[i].querySelector("polygon").setAttribute("fill", "black");
                    edges[i].querySelector("polygon").setAttribute("stroke", "black");
                    edges[i].getElementsByTagName("path")[0].setAttribute("stroke", "black");
                }
            }
        }
    };

    // pkg.redraw the editor. IMPORTANT: call this whenever you mess around with the svg container.
    pkg.redraw = function (that) {
        if (!that) {
            that = pkg;
        }

        if (that.svgNode) {
            pkg.setViewBoxSize(that);
        }
    };


    // reset the viewBox size (uses the size of the svg container and the zoom level to do it)
    pkg.setViewBoxSize = function (that) {
        if (!that) {
            that = pkg;
        }

        if (!that.svgContainer || that.svgContainer.offsetWidth) {
            that.svgNode.viewBox.baseVal.width  = (that.svgNode.width.baseVal.value  = that.svgContainer.offsetWidth) / that.svgZoom;
            that.svgNode.viewBox.baseVal.height = (that.svgNode.height.baseVal.value = that.svgContainer.offsetHeight) / that.svgZoom;
        }
    };

    pkg.getStringValueFunction = function (s) {
        return s === "ε" ? "\\e" : JSON.stringify(s);
    };

    // Retrieve the code of the automaton #index, svg code included.
    // if the <svg> representation is not desired (e.g. you need a cleaner visual representation of the automaton),
    // set withoutSVG to true
    pkg.getAutomatonCode = function (index, withoutSVG) {
        var getStringValue = pkg.getStringValueFunction;

        pkg.cleanSVG(pkg.currentIndex);
        if (!initialStates[index]) {
            return ""; // automata without initial states are not supported
        }

        var states      = [],
            finalStates = [],
            nodes       = svgs[index].querySelectorAll(".node"),
            len,
            i;

        for (i = 0, len = nodes.length; i < len; ++i) {
            if (nodes[i].querySelectorAll("ellipse").length > 1) {
                finalStates.push(atob(nodes[i].id));
            } else if (nodes[i] !== initialState) {
                states.push(atob(nodes[i].id));
            }
        }

        var code = getStringValue(atob(initialStates[index].id)) + "\n";

        for (i = 0, len = states.length; i < len; ++i) {
            code += getStringValue(states[i]) + "\n";
        }

        code += "\n";

        for (i = 0, len = finalStates.length; i < len; ++i) {
            code += getStringValue(finalStates[i]) + "\n";
        }

        code += "\n";

        var s, leng, symbols, tid, f, t, text, trans = svgs[index].querySelectorAll(".edge");

        for (i = 0, len = trans.length; i < len; ++i) {
            if (trans[i] !== initialStateArrows[index]) {
                tid  = trans[i].id.split(" ");
                text = trans[i].getElementsByTagName("text")[0].textContent;
                f = atob(tid[0]);
                t = atob(tid[1]);

                symbols = parse_transition(text);
                for (s = 0, leng = symbols.length; s < leng; ++s) {
                    code +=  getStringValue(f) + " " + (symbols[s] === epsilon ? "\\e" : Set.prototype.elementToString(symbols[s], automataMap)) + " " + getStringValue(t) + "\n";
                }
            }
        }
        return code + (withoutSVG ? "" : "\n<representation type='image/svg+xml'>\n" + pkg.outerHTML(svgs[index]).trim() + "\n</representation>\n");
    };

    pkg.getValueFunction = pkg.standardizeStringValueFunction = function (s) {
        return s === "\\e" ? "ε" : s;
    };

    pkg.getAutomaton = function (index, onlyStrings) {
        var A = new Automaton();
        pkg.cleanSVG(pkg.currentIndex);
        if (!initialStates[index]) {
            return null; // automata without initial states are not supported
        }

        var getValue = onlyStrings ? function (v) { return pkg.getValueFunction(v).toString(); } : pkg.getValueFunction;

        var nodes = svgs[index].querySelectorAll(".node"), i, len;

        for (i = 0, len = nodes.length; i < len; ++i) {
            if (nodes[i].querySelectorAll("ellipse").length > 1) {
                A.addFinalState(getValue(atob(nodes[i].id)));
            } else if (nodes[i] !== initialState) {
                A.addState(getValue(atob(nodes[i].id)));
            }
        }

        A.setInitialState(getValue(atob(initialStates[index].id)));

        var symbols, leng, s, tid, f, t, text, trans = svgs[index].querySelectorAll(".edge");

        for (i = 0, len = trans.length; i < len; ++i) {
            if (trans[i] !== initialStateArrows[index]) {
                tid  = trans[i].id.split(" ");
                text = trans[i].getElementsByTagName("text")[0].textContent;
                f    = atob(tid[0]);
                t    = atob(tid[1]);

                symbols = parse_transition(text);
                for (s = 0, leng = symbols.length; s < leng; ++s) {
                    A.addTransition(getValue(f), (onlyStrings && (symbols[s] !== epsilon)) ? symbols[s].toString() : symbols[s], getValue(t));
                }
            }
        }
        return A;
    };

    pkg.getSVG = function (index) {
        if (svgs[index]) {
            return pkg.outerHTML(svgs[index]).trim();
        }
        return "";
    };

    pkg.getSVGNode = function (index) {
        return svgs[index];
    };

    // utility function to position a point at the right place during a movement.
    // see movePoints for usage
    function newPos(origCoord, origCoord0, origCoordFin, otherCoord, otherOrigCoord0, otherOrigCoordFin, size, d, otherSize) {
        var percent;

        if (!otherSize) {
            percent = (origCoord - origCoord0) / size;
        } else if (!size) {
            percent = (otherCoord - otherOrigCoord0) / otherSize;
        } else if (otherSize > size) {
            percent = (otherCoord - otherOrigCoord0) / otherSize;
        } else {
            percent = (origCoord - origCoord0) / size;
        }

        return origCoord + Math.abs(percent) * d;
    }

    pkg.load = function () {
        if (!pkg.svgContainer) {
            pkg.svgContainer = document.getElementById("svg-container");
        }

        pkg.svgContainer.appendChild(document.createElement("div"));
        pkg.svgContainer = pkg.svgContainer.lastChild;
        pkg.svgContainer.style.position = "absolute";
        pkg.svgContainer.style.top = "0";
        pkg.svgContainer.style.left = "0";
        pkg.svgContainer.style.right = "0";
        pkg.svgContainer.style.bottom = "0";

        window.addEventListener("resize", pkg.redraw, false);

        // get the right coordinates of the cursor of the <svg> node
        function svgcursorPoint(evt, that) { // thx http://stackoverflow.com/questions/5901607/svg-coordiantes
            if (!that) {
                that = pkg;
            }

            var pt = that.svgNode.createSVGPoint();
            pt.x = evt.clientX;
            pt.y = evt.clientY;
            var a = that.svgNode.getScreenCTM();
            if (!a) {
                throw new Error("coordinates unavailable");
            }
            var b = a.inverse();
            return pt.matrixTransform(b);
        }

        var nodeMoving, nodeEdit, pathEdit, coords, nodeMovingData, blockNewState, blockClick, mouseCoords = null, currentMoveAction = null;

        function pathEditEllipseMoveFrame(e) {
            if (!mouseCoords) {
                return;
            }

            requestAnimationFrame(currentMoveAction);

            var e = mouseCoords;

            var pt = svgcursorPoint(e);
            var seg = pointOnEllipse(nodeMoving._ellipse, pt.x, pt.y, nodeMoving._seg[0].getItem(nodeMoving._seg[1]), nodeMoving._seg[1] ? 10 : 0);
            nodeMoving.setAttribute("cx", seg.x);
            nodeMoving.setAttribute("cy", seg.y);
            if (nodeMoving._arrow) {
                posTriangleArrow(nodeMoving._arrow.points, nodeMoving._ellipse, seg);
            }
        }

        // move the points of a path during a movement
        // Parameters:
        // - path if the path to move
        // - origPath is the same path, before any movement
        // - dx, dy is how much the cursor of the user has moved
        // - start / max limit the indexes of the points of the path to move
        // - origSegStart / origSegEnd are the begining / ending of the path
        function movePoints(origSegStart, origSegEnd, path, origPath, start, max, dx, dy) {
            var width  = Math.abs(origSegEnd.x - origSegStart.x),
                height = Math.abs(origSegEnd.y - origSegStart.y),
                origSeg,
                seg,
                i;

            for (i = start; i <= max; ++i) {
                origSeg = origPath.getItem(i);
                seg     = path.getItem(i);

                if (seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                    seg.x1 = newPos(origSeg.x1, origSegStart.x, origSegEnd.x, origSeg.y1, origSegStart.y, origSegEnd.y, width,  dx, height);
                    seg.y1 = newPos(origSeg.y1, origSegStart.y, origSegEnd.y, origSeg.x1, origSegStart.x, origSegEnd.x, height, dy, width);
                    seg.x2 = newPos(origSeg.x2, origSegStart.x, origSegEnd.x, origSeg.y2, origSegStart.y, origSegEnd.y, width,  dx, height);
                    seg.y2 = newPos(origSeg.y2, origSegStart.y, origSegEnd.y, origSeg.x2, origSegStart.x, origSegEnd.x, height, dy, width);
                }

                seg.x = newPos(origSeg.x, origSegStart.x, origSegEnd.x, origSeg.y, origSegStart.y, origSegEnd.y, width,  dx, height);
                seg.y = newPos(origSeg.y, origSegStart.y, origSegEnd.y, origSeg.x, origSegStart.x, origSegEnd.x, height, dy, width);
            }
        }

        function pathEditSolidMoveFrame(e) {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            var segMove = nodeMoving._seg[0].getItem(nodeMoving._seg[1]);
            var origSegStart = nodeMoving._seg[2].getItem(0);
            var origSegEnd   = nodeMoving._seg[2].getItem(nodeMoving._seg[1]);

            var dx = (e.clientX - coords.x) / pkg.svgZoom,
                dy = (e.clientY - coords.y) / pkg.svgZoom;

            movePoints(origSegStart, origSegEnd, nodeMoving._seg[0], nodeMoving._seg[2], 1, nodeMoving._seg[1], dx, dy);
            origSegStart = nodeMoving._seg[2].getItem(nodeMoving._seg[2].numberOfItems - 1);
            movePoints(origSegStart, origSegEnd, nodeMoving._seg[0], nodeMoving._seg[2], nodeMoving._seg[1] + 1, nodeMoving._seg[0].numberOfItems - 1, dx, dy);
            nodeMoving.setAttribute("cx", segMove.x);
            nodeMoving.setAttribute("cy", segMove.y);
            nodeMoving._seg[3] && fixTransition(nodeMoving._seg[3]);
        }

        function pathEditControlMoveFrame(e) {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            var pt = svgcursorPoint(e);
            nodeMoving.setAttribute("cx", nodeMoving._seg[0][nodeMoving._seg[1]] = pt.x);
            nodeMoving.setAttribute("cy", nodeMoving._seg[0][nodeMoving._seg[2]] = pt.y);
            nodeMoving._seg[3] && fixTransition(nodeMoving._seg[3]);
            fixPathEditor();
        }

        // move the visible area
        function viewBoxMoveFrame(e, that) {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            blockNewState = true;

            var c;

            if (that) {
                c = that;
            } else {
                c = coords;
                that = pkg;
            }

            that.svgNode.viewBox.baseVal.x = c.viewBoxX - (e.clientX - c.x) / that.svgZoom;
            that.svgNode.viewBox.baseVal.y = c.viewBoxY - (e.clientY - c.y) / that.svgZoom;
        }

        function isTransitionStraight(edge) {
            var tid = edge.id.split(" ");

            var errorMargin = 1,
                path        = edge.getElementsByTagName("path")[0].pathSegList,
                state1      = document.getElementById(tid[0]).querySelector("ellipse"),
                state2      = document.getElementById(tid[1]).querySelector("ellipse"),
                cx1         = state1.cx.baseVal.value,
                cy1         = state1.cy.baseVal.value,
                cx2         = state2.cx.baseVal.value,
                cy2         = state2.cy.baseVal.value,
                m           = (cy2 - cy1) / (cx2 - cx1),
                p           = cy1 - (m * cx1),
                seg,
                len,
                i;

            for (i = 0, len = path.numberOfItems; i < len; ++i) {
                seg = path.getItem(i);
                if (seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                    if (
                        Math.abs(m * seg.x1 + p - seg.y1) > errorMargin
                     || Math.abs(m * seg.x2 + p - seg.y2) > errorMargin
                    ) {
                        return false;
                    }
                }

                if (Math.abs(m * seg.x + p - seg.y) > errorMargin) {
                    return false;
                }
            }

            return true;
        }

        function fixNode(node) {
            var bigEllipse   = getBigEllipse(node);
            var smallEllipse = getSmallEllipse(node);

            if (bigEllipse !== smallEllipse) {
                var smallBBox = smallEllipse.getBBox();

                bigEllipse.setAttribute("rx", 4 + smallBBox.width  / 2);
                bigEllipse.setAttribute("ry", 4 + smallBBox.height / 2);
                bigEllipse.setAttribute("cx", smallEllipse.getAttribute("cx"));
                bigEllipse.setAttribute("cy", smallEllipse.getAttribute("cy"));
            }

            if (node === initialState) {
                setInitialState(node);
            }
        }

        function fixTransition(path, text) {
            var segs = path.pathSegList;

            var origEllipse = getBigEllipse(
                document.getElementById(path.parentNode.id.split(" ")[0])
            );

            var targetEllipse = getBigEllipse(
                document.getElementById(path.parentNode.id.split(" ")[1])
            );

            var p0 = segs.getItem(0)
            var p = {
                x: p0.x,
                y: p0.y
            };

            pointOnEllipse(
                origEllipse,
                segs.getItem(1).x1,
                segs.getItem(1).y1,
                p0
            );

            var dx = p0.x - p.x;
            var dy = p0.y - p.y;

            if (origEllipse === targetEllipse) {
                for (var point, i = 1; i < segs.length; i++) {
                    point = segs.getItem(i)
                    if (point.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                        point.x1 += dx;
                        point.y1 += dy;
                        point.x2 += dx;
                        point.y2 += dy;
                    }

                    point.x += dx;
                    point.y += dy;
                }

                if (text) {
                    text.setAttribute("x", text.x.baseVal[0].value + dx);
                    text.setAttribute("y", text.y.baseVal[0].value + dy);
                }
            }

            var seg = segs.getItem(segs.numberOfItems-1);

            pointOnEllipse(
                targetEllipse,
                seg.x2,
                seg.y2,
                seg,
                10
            );

            posTriangleArrow(
                path.parentNode.getElementsByTagName("polygon")[0].points,
                targetEllipse,
                seg
            );
        }

        function resizePS(ele, relativeBBox, bbox, coords, newBBox, shift) {
            var newWidth, newHeight;

            if (coords.width || shift) {
                newWidth = newBBox.width * relativeBBox.width;
                ele.setAttribute("rx", newWidth / 2);
            } else {
                newWidth = bbox.width;
            }

            if (coords.height || shift) {
                newHeight = newBBox.height * relativeBBox.height;
                ele.setAttribute("ry", newHeight / 2);
            } else {
                newHeight = bbox.height;
            }

            if (coords.left) {
                ele.setAttribute("cx", newBBox.x + newWidth / 2);
            }

            if (coords.top) {
                ele.setAttribute("cy", newBBox.y + newHeight / 2);
            }
        }

        function fixNodeAndTransition(node) {
            resizeHandlesOn(resizeHandledElement);

            fixNode(node);

            var path, text, n = nodeMovingData;

            for (var i = 0, len = n.t.length; i < len; ++i) {
                path = coords.t[i][0][0].getElementsByTagName("path")[0];
                text = coords.t[i][0][0].getElementsByTagName("text")[0];
                fixTransition(path, text);
            }
        }

        function nodeResizeFrame(e) {
            if (!mouseCoords) {
                return;
            }

            var e = mouseCoords;

            requestAnimationFrame(currentMoveAction);

            if (e === true || pkg.stopMoveNode) {
                return;
            }

            mouseCoords = true;

            var dx = (e.clientX - coords.x) / pkg.svgZoom,
                dy = (e.clientY - coords.y) / pkg.svgZoom;

            var newBBox = {
                x:      coords.left   ? coords.bbox.x + dx : coords.bbox.x,
                y:      coords.top    ? coords.bbox.y + dy : coords.bbox.y,
                width:  coords.width  ? coords.bbox.width  + dx * (coords.left ? -2 : 2) : coords.bbox.width,
                height: coords.height ? coords.bbox.height + dy * (coords.top  ? -2 : 2) : coords.bbox.height
            };

            if (e.shiftKey) {
                newBBox.width = newBBox.height = (
                    !coords.height
                        ? newBBox.width
                        : (!coords.width
                            ? newBBox.height
                            : Math.min(newBBox.width, newBBox.height)
                        )
                );
            }

            var c = coords.smallEllipse;

            resizePS(
                c.ele,
                c.relativeBBox,
                c.bbox,
                coords,
                newBBox,
                e.shiftKey
            );

            fixNodeAndTransition(coords.node);
        }

        function nodeMoveFrame() {
            if (!mouseCoords) {
                return;
            }

            var e = mouseCoords;

            requestAnimationFrame(currentMoveAction);

            if (e === true || pkg.stopMoveNode) {
                return;
            }

            mouseCoords = true;


            var dx = (e.clientX - coords.x) / pkg.svgZoom,
                dy = (e.clientY - coords.y) / pkg.svgZoom;

            coords.text.setAttribute("x", coords.tx + dx);
            coords.text.setAttribute("y", coords.ty + dy);
            coords.ellipse[0].setAttribute("cx", coords.cx + dx);
            coords.ellipse[0].setAttribute("cy", coords.cy + dy);
            if (coords.ellipse[1]) {
                coords.ellipse[1].setAttribute("cx", coords.cx1 + dx);
                coords.ellipse[1].setAttribute("cy", coords.cy1 + dy);
            }

            if (initialState === nodeMoving) {
                // moving the initial state arrow
                setInitialState(nodeMoving);
            }

            var coefTextX = 1,
                coefTextY = 1,
                n = nodeMovingData,
                polygonPoints,
                origSegStart,
                origSegEnd,
                textOrigX,
                textOrigY,
                pointsOrig,
                textOrig,
                origSegs,
                origSeg,
                height,
                width,
                nodes,
                path,
                segs,
                text,
                seg,
                leng,
                len,
                ech,
                pp,
                po,
                s,
                i;

            for (i = 0, len = n.t.length; i < len; ++i) {
                nodes         = coords.t[i][0][0].id.split(" ");
                path          = coords.t[i][0][0].getElementsByTagName("path")[0];
                segs          = path.pathSegList;
                origSegs      = coords.t[i][1].getElementsByTagName("path")[0].pathSegList;
                text          = coords.t[i][0][0].getElementsByTagName("text")[0];
                textOrig      = coords.t[i][1].getElementsByTagName("text")[0];
                polygonPoints = coords.t[i][0][0].querySelector("polygon").points;

                if (nodes[0] === nodes[1]) {// transition from / to the same state, just moving
                    for (s = 0, leng = segs.numberOfItems; s < leng; ++s) {
                        seg = segs.getItem(s);
                        origSeg = origSegs.getItem(s);
                        if (seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                            seg.x1 = origSeg.x1 + dx;
                            seg.x2 = origSeg.x2 + dx;
                            seg.y1 = origSeg.y1 + dy;
                            seg.y2 = origSeg.y2 + dy;
                        }

                        seg.x = origSeg.x + dx;
                        seg.y = origSeg.y + dy;
                    }
                    text.setAttribute("x", textOrig.x.baseVal.getItem(0).value + (coefTextX * dx));
                    text.setAttribute("y", textOrig.y.baseVal.getItem(0).value + (coefTextY * dy));

                    if (nodes[0] === nodes[1] || (!coords.t[i].transitionStraight && !coords.t[i][0][1])) { // the state is the destination, we move the arrow
                        pointsOrig = coords.t[i][1].querySelector("polygon").points;

                        for (s = 0, leng = polygonPoints.numberOfItems; s < leng; ++s) {
                            pp = polygonPoints.getItem(s);
                            po = pointsOrig.getItem(s);
                            pp.x = po.x + dx;
                            pp.y = po.y + dy;
                        }
                    }
                } else {
                    origSegStart = origSegs.getItem(0);
                    origSegEnd   = origSegs.getItem(segs.numberOfItems - 1);
                    width        = Math.abs(origSegEnd.x - origSegStart.x);
                    height       = Math.abs(origSegEnd.y - origSegStart.y);
                    textOrigX    = textOrig.x.baseVal.getItem(0).value;
                    textOrigY    = textOrig.y.baseVal.getItem(0).value;

                    if (coords.t[i][0][1]) { // if the state is the origin
                        ech          = origSegStart;
                        origSegStart = origSegEnd;
                        origSegEnd   = ech;
                    }

                    text.setAttribute("x", newPos(textOrigX, origSegStart.x, origSegEnd.x, textOrigY, origSegStart.y, origSegEnd.y, width, dx, height, dy));
                    text.setAttribute("y", newPos(textOrigY, origSegStart.y, origSegEnd.y, textOrigX, origSegStart.x, origSegEnd.x, height, dy, width, dx));

                    if (coords.t[i].transitionStraight) {
                        cleanTransitionPos(
                            path,
                            polygonPoints,
                            null,
                            document.getElementById(nodes[0]),
                            document.getElementById(nodes[1])
                        );
                    } else {
                        for (s = 0, leng = segs.numberOfItems; s < leng; ++s) {
                            seg = segs.getItem(s);
                            origSeg = origSegs.getItem(s);

                            if (seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                                seg.x1 = newPos(origSeg.x1, origSegStart.x, origSegEnd.x, origSeg.y1, origSegStart.y, origSegEnd.y, width, dx, height, dy);
                                seg.y1 = newPos(origSeg.y1, origSegStart.y, origSegEnd.y, origSeg.x1, origSegStart.x, origSegEnd.x, height, dy, width, dx);
                                seg.x2 = newPos(origSeg.x2, origSegStart.x, origSegEnd.x, origSeg.y2, origSegStart.y, origSegEnd.y, width, dx, height, dy);
                                seg.y2 = newPos(origSeg.y2, origSegStart.y, origSegEnd.y, origSeg.x2, origSegStart.x, origSegEnd.x, height, dy, width, dx);
                            }

                            seg.x = newPos(origSeg.x, origSegStart.x, origSegEnd.x, origSeg.y, origSegStart.y, origSegEnd.y, width, dx, height, dy);
                            seg.y = newPos(origSeg.y, origSegStart.y, origSegEnd.y, origSeg.x, origSegStart.x, origSegEnd.x, height, dy, width, dx);
                        }

                        fixTransition(path);
                    }
                }
            }
        }

        function mouseMove(e) {
            mouseCoords = e;
            stopOverlay = true;
        }

        function cancelMoveAction() {
            pkg.svgContainer.onmousemove = null;
            currentMoveAction            = null;
            mouseCoords                  = null;
        }

        function setMoveAction(frameFunction, e) {
            pkg.svgContainer.onmousemove = mouseMove;
            currentMoveAction = frameFunction;
            mouseCoords = e;
            requestAnimationFrame(currentMoveAction);
        }

        function prepareNodeMove(nodeMoving, e) {
            pkg.stopMove = true;
            coords = {
                ellipse: nodeMoving.getElementsByTagName("ellipse"),
                text:    nodeMoving.getElementsByTagName("text")[0],
                x:       e.clientX,
                y:       e.clientY
            };

            coords.cx = coords.ellipse[0].cx.baseVal.value;
            coords.cy = coords.ellipse[0].cy.baseVal.value;
            coords.tx = coords.text.x.baseVal.getItem(0).value;
            coords.ty = coords.text.y.baseVal.getItem(0).value;

            if (coords.ellipse[1]) {
                coords.cx1 = coords.ellipse[1].cx.baseVal.value;
                coords.cy1 = coords.ellipse[1].cy.baseVal.value;
            }

            coords.t = [];
            var i, len, n = nodeList[atob(nodeMoving.id)];

            nodeMovingData = n;

            for (i = 0, len = n.t.length; i < len; ++i) {
                coords.t[i] = [n.t[i], n.t[i][0].cloneNode(true)];
                coords.t[i].transitionStraight = isTransitionStraight(n.t[i][0]);
            }
        }

        function beginNodeResizing(nodeMoving, e) {
            prepareNodeMove(nodeMoving, e);

            var bbox = resizeHandledElement.getBBox();
            var node = parentWithClass(resizeHandledElement, "node");

            coords.top    = e.target.className.baseVal.indexOf("-top") !== -1;
            coords.left   = e.target.className.baseVal.indexOf("-left") !== -1;
            coords.width  = coords.left || e.target.className.baseVal.indexOf("-right") !== -1;
            coords.height = coords.top  || e.target.className.baseVal.indexOf("-bottom") !== -1;
            coords.bbox   = bbox;
            coords.node   = node;

            var smallEllipse = getSmallEllipse(node);
            var smallEllipseBBox = smallEllipse.getBBox();

            coords.smallEllipse = {
                ele: smallEllipse,
                bbox: smallEllipseBBox,
                relativeBBox: relativePS(smallEllipseBBox, bbox)
            }

            setMoveAction(nodeResizeFrame, e);
        }

        function beginNodeMoving(nodeMoving, e) {
            prepareNodeMove(nodeMoving, e);
            pkg.svgContainer.style.cursor = "move";
            setMoveAction(nodeMoveFrame, e);
        }

        // move event when two nodes must be bound (the transition is following the cursor)
        function nodeBindingFrame() {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            blockNewState = false;
            var pt = svgcursorPoint(e);
            var p = pathEdit.pathSegList.getItem(1);
            var po = pathEdit.pathSegList.getItem(0);
            p.x = p.x2 = pt.x - (p.x - po.x > 0 ? 1 : -1);
            p.y = p.y2 = pt.y - (p.y - po.y > 0 ? 1 : -1);
            pointOnEllipse(getBigEllipse(nodeEdit), p.x, p.y, po);
            p.x1 = po.x;
            p.y1 = po.y;
        }

        function beginNewTransition(startState, e) {
            pkg.stopMove = true;
            nodeEdit = startState;
            setMoveAction(nodeBindingFrame, e);

            pathEdit = document.createElementNS(svgNS, "path");
            pathEdit.setAttribute("fill", "none");
            pathEdit.setAttribute("stroke", "black");

            var ellipse = getBigEllipse(startState);
            var pt = svgcursorPoint(e), p = pointOnEllipse(ellipse, pt.x, pt.y);
            pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegMovetoAbs(p.x, p.y));
            pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegCurvetoCubicAbs(pt.x, pt.y, p.x, p.y, pt.x, pt.y));
            pkg.svgNode.appendChild(pathEdit);
        }

        function endNewTransition(endState) {
            pkg.stopMove = true;
            var id = nodeEdit.id + " " + endState.id;
            if (document.getElementById(id)) {
                // Désolé, une fèche existe déjà entre ces deux états dans ce sens.
                window.alert(_("Sorry, there is already a transition between these states in this way."));
                pkg.svgNode.removeChild(pathEdit);
                cancelMoveAction();
                return;
            }

            cancelMoveAction();

            pkg.prompt(
                _("New transition"),
                _("Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes."),
                "",
                function (trans) {
                    if (trans === null) {
                        pathEdit.parentNode.removeChild(pathEdit);
                    } else {
                        var g = document.createElementNS(svgNS, "g");
                        g.id = id;
                        g.setAttribute("class", "edge");
                        var title = document.createElementNS(svgNS, "title");
                        title.textContent = toBrokenGraphvizTitle(atob(nodeEdit.id)) + "->" + toBrokenGraphvizTitle(atob(endState.id));
                        g.appendChild(title);

                        var polygon = document.createElementNS(svgNS, "polygon");

                        polygon.setAttribute("fill", "black");
                        polygon.setAttribute("stroke", "black");

                        var text = document.createElementNS(svgNS, "text");
                        text.textContent = format_transition(trans || "\\e");
                        text.setAttribute("text-anchor", "middle");
                        text.setAttribute("font-family", "Times Roman,serif");
                        text.setAttribute("font-size", "14.00");
                        cleanTransitionPos(pathEdit, polygon.points, text, nodeEdit, endState);
                        g.appendChild(pathEdit);
                        g.appendChild(polygon);
                        g.appendChild(text);
                        pkg.svgNode.querySelector("g").appendChild(g);
                        nodeList[atob(endState.id)].t.push([g, false]); // false : state is not origin
                        if (nodeEdit !== endState) {
                            nodeList[atob(nodeEdit.id)].t.push([g, true]); // true : state is origin
                        }
                    }
                }
            );
        }

        function transitionStraight(edge) {
            var tid = edge.id.split(" ");

            cleanTransitionPos(
                edge.getElementsByTagName("path")[0],
                edge.querySelector("polygon").points,
                edge.getElementsByTagName("text")[0],
                document.getElementById(tid[0]),
                document.getElementById(tid[1])
            );

            fixPathEditor();
        }

        // event when a transition label is moved
        function labelMoveFrame(e) {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            nodeMoving.setAttribute("x", (e.clientX - coords[0]) / pkg.svgZoom + coords[2]);
            nodeMoving.setAttribute("y", (e.clientY - coords[1]) / pkg.svgZoom + coords[3]);
        }

        function beginMoveTransitionLabel(text, e) {
            pkg.stopMove = true;
            nodeMoving = text;
            coords = [e.clientX, e.clientY, e.target.x.baseVal.getItem(0).value, e.target.y.baseVal.getItem(0).value];
            setMoveAction(labelMoveFrame, e);
            pkg.svgContainer.cursor = "move";
        }

        function fixPathEditor() {
            if (!pathEditor) {
                return;
            }

            var p = pathEditor._path;

            var segs = p.pathSegList;
            var tid = p.parentNode.id.split(" ");

            while (pathEditor.firstChild) {
                pathEditor.removeChild(pathEditor.firstChild);
            }
            var handle, seg, i, len;
            for (i = 0, len = segs.numberOfItems; i < len; ++i) {
                seg = segs.getItem(i);
                if (seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                    if (seg.x1 !== segs.getItem(i - 1).x || seg.y1 !== segs.getItem(i - 1).y) {
                        handle = document.createElementNS(svgNS, "circle");
                        handle.setAttribute("class", "pathedit-handle");
                        handle.setAttribute("r", 3);
                        handle.setAttribute("fill", "#F50");
                        handle.setAttribute("stroke", "black");
                        handle._moveFrame = pathEditControlMoveFrame;
                        handle.setAttribute("cx", seg.x1);
                        handle.setAttribute("cy", seg.y1);
                        handle._seg = [seg, "x1", "y1", p];
                        pathEditor.appendChild(handle);
                    }
                    if (seg.x2 !== seg.x || seg.y2 !== seg.y) {
                        handle = document.createElementNS(svgNS, "circle");
                        handle.setAttribute("class", "pathedit-handle");
                        handle.setAttribute("r", 3);
                        handle.setAttribute("fill", "#F50");
                        handle.setAttribute("stroke", "black");
                        handle._moveFrame = pathEditControlMoveFrame;
                        handle.setAttribute("cx", seg.x2);
                        handle.setAttribute("cy", seg.y2);
                        handle._seg = [seg, "x2", "y2", p];
                        pathEditor.appendChild(handle);
                    }
                }

                handle = document.createElementNS(svgNS, "circle");
                handle.setAttribute("class", "pathedit-handle");
                handle.setAttribute("cx", seg.x);
                handle.setAttribute("cy", seg.y);
                handle.setAttribute("r", 3);
                if (i === len - 1) {
                    handle._moveFrame = pathEditEllipseMoveFrame;
                    handle._ellipse   = getBigEllipse(document.getElementById(tid[1]));
                    handle._arrow     = p.parentNode.querySelector("polygon");
                } else if (!i) {
                    handle._moveFrame = pathEditEllipseMoveFrame;
                    handle._ellipse   = getBigEllipse(document.getElementById(tid[0]));
                } else {
                    handle._moveFrame = pathEditSolidMoveFrame;
                }

                handle._seg = [segs, i, p.cloneNode(false).pathSegList];

                handle.setAttribute("fill", "#4AF");
                handle.setAttribute("stroke", "black");
                pathEditor.appendChild(handle);
            }
        }

        function beginNewTransitionEdit(nodeMoving) {
            if (!pathEditor) {
                pathEditor = document.createElementNS(svgNS, "g");
            }

            pathEditor.id = "path-editor";
            pathEditor._path = nodeMoving.getElementsByTagName("path")[0];
            fixPathEditor();
            pkg.svgNode.appendChild(pathEditor);
        }

        function endNewTransitionEdit() {
            if (pathEditor) {
                pkg.svgNode.removeChild(pathEditor);
                pathEditor = null;
            }
        }

        function beginViewBoxMove(e) {
            coords = {
                viewBoxX: pkg.svgNode.viewBox.baseVal.x,
                viewBoxY: pkg.svgNode.viewBox.baseVal.y,
                x:        e.clientX,
                y:        e.clientY
            };

            setMoveAction(viewBoxMoveFrame, e);
        }

        function toggleAccepting(nodeMoving) {
            var ellipses = nodeMoving.querySelectorAll("ellipse"),
                tl       = nodeList[atob(nodeMoving.id)].t,
                segs,
                ellipse,
                path,
                tid,
                ndx,
                ndy,
                len,
                np,
                p,
                s,
                t;

            if (ellipses.length > 1) { // to non accepting state
                nodeMoving.removeChild(ellipses[1]);
                ellipse = ellipses[0];
            } else {
                ellipse = ellipses[0].cloneNode(false);
                var rx = ellipse.rx.baseVal.value + 4,
                    ry = ellipse.ry.baseVal.value + 4;

                ellipse.setAttribute("fill", "none");
                nodeMoving.insertBefore(ellipse, ellipses[0].nextSibling);
            }

            fixNode(nodeMoving);

            for (t = 0, len = tl.length; t < len; ++t) {
                tid = tl[t][0].id.split(" ");

                if (tid[1] === tid[0]) {
                    fixTransition(
                        tl[t][0].getElementsByTagName("path")[0],
                        tl[t][0].getElementsByTagName("text")[0]
                    );
                } else {
                    if (tl[t][1]) { // state n is the origin of the transition t
                        // we get the first point of the transition
                        p = tl[t][0].getElementsByTagName("path")[0].pathSegList.getItem(0);
                    } else {
                        // we get the last point of the transition
                        p = tl[t][0].querySelector("polygon").points.getItem(1);
                    }

                    np = pointOnEllipse(ellipse, p.x, p.y);
                    ndx = np.x - p.x;
                    ndy = np.y - p.y;

                    if (tl[t][1]) {
                        p.x = np.x;
                        p.y = np.y;
                    } else {
                        segs = tl[t][0].getElementsByTagName("path")[0].pathSegList;
                        s = segs.getItem(segs.numberOfItems - 1);
                        s.x += ndx;
                        s.y += ndy;
                        translate(tl[t][0].querySelector("polygon"), ndx, ndy);
                        p.x = np.x;
                        p.y = np.y;
                    }
                }
            }
        }

        // delete the transition tNode
        // if tstate is given, dont handle the state which tid is <tstate>
        function deleteTransition(tNode, tstate) {
            var j, k, n, len;
            for (j in nodeList) {
                if (nodeList.hasOwnProperty(j) && j !== tstate) {
                    for (k = 0, n = nodeList[j], len = n.t.length; k < len; ++k) {
                        if (n.t[k][0] === tNode) {
                            n.t.splice(k, 1);
                            --len;
                        }
                    }
                }
            }
            tNode.parentNode.removeChild(tNode);
        }

        function removeNode(node) {
            if (node === initialState) {
                initialStateArrow.parentNode.removeChild(initialStateArrow);
                initialState = initialStates[pkg.currentIndex] = initialStateArrows[pkg.currentIndex] = initialStateArrow = null;
            }

            var tid = atob(node.id), n = nodeList[tid], i, len;
            for (i = 0, len = n.t.length; i < len; ++i) {
                deleteTransition(n.t[i][0], tid);
            }
            delete nodeList[tid];
            node.parentNode.removeChild(node);
        }

        function editNodeName(node) {
            var text = node.getElementsByTagName("text")[0];
            pkg.prompt(
                _("Name of the state"),
                _("Which name do you want for the state ?"),
                text.textContent,
                function (t) {
                    if (t) {
                        t = pkg.standardizeStringValueFunction(t);
                        var tb = btoa(t);
                        var existingNode = pkg.svgNode.getElementById(tb);

                        if (existingNode) {
                            if (node !== existingNode) {
                                window.alert(_("Sorry, but a state is already named like this."));
                            }
                        } else {
                            var oldid = atob(node.id),
                                n     = nodeList[oldid],
                                tid,
                                len,
                                i;

                            for (i = 0, len = n.t.length; i < len; ++i) {
                                tid = n.t[i][0].id.split(" ");

                                if (tid[0] === tid[1]) {
                                    n.t[i][0].id = tb + " " + tb;
                                    n.t[i][0].querySelector("title").textContent = toBrokenGraphvizTitle(t) + "->" + toBrokenGraphvizTitle(t);
                                } else if (n.t[i][1]) {// if node is origin
                                    n.t[i][0].id = tb + " " + tid[1];
                                    n.t[i][0].querySelector("title").textContent = toBrokenGraphvizTitle(t) + "->" + toBrokenGraphvizTitle(atob(tid[1]));
                                } else {
                                    n.t[i][0].id = tid[0] + " " + tb;
                                    n.t[i][0].querySelector("title").textContent = toBrokenGraphvizTitle(atob(tid[0])) + "->" + toBrokenGraphvizTitle(t);
                                }
                            }
                            nodeList[t] = nodeList[oldid];
                            delete nodeList[oldid];
                            node.querySelector("title").textContent = toBrokenGraphvizTitle(text.textContent = t);
                            node.setAttribute("id", tb);

                            var ellipse = getSmallEllipse(node);
                            var minWidth = text.getBBox().width + 28;

                            if (ellipse.getBBox().width < minWidth) {
                                ellipse.setAttribute("rx", minWidth / 2);
                            }
                        }

                        // FIXME terrible hack to "repair" the node after resize
                        prepareNodeMove(node, {});
                        fixNodeAndTransition(node);
                    }
                }
            );
        }

        function editTransitionSymbols(edge) {
            var text = edge.getElementsByTagName("text")[0];
            pkg.prompt(
                _("Transitions' symbols"),
                _("Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes."),
                text.textContent,
                function (t) {
                    if (t !== null) {
                        text.textContent = format_transition(t || "\\e");
                    }
                }
            );
        }

        function createNode(e) {
            var g = document.createElementNS(svgNS, "g");
            g.setAttribute("class", "node");
            var id = 0;

            while (nodeList[id]) {
                ++id;
            }

            g.id = btoa(id);
            var title = document.createElementNS(svgNS, "title");
            title.textContent = toBrokenGraphvizTitle(id);
            var ellipse = document.createElementNS(svgNS, "ellipse");

            var pt = svgcursorPoint(e);
            var ry = 18.3848;
            var cy = pt.y;
            ellipse.setAttribute("fill", "transparent");
            ellipse.setAttribute("stroke", "black");
            ellipse.setAttribute("rx", 17.8879);
            ellipse.setAttribute("ry", ry);
            ellipse.setAttribute("cx", pt.x);
            ellipse.setAttribute("cy", cy);
            var text = document.createElementNS(svgNS, "text");
            text.textContent = id;
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-family", "Times Roman, serif");
            text.setAttribute("font-size", "14.00");
            text.setAttribute("x", pt.x);
            text.setAttribute("y", cy + 4);
            g.appendChild(title);
            g.appendChild(ellipse);
            g.appendChild(text);
            pkg.svgNode.querySelector("g").appendChild(g);
            if (!initialState) {
                setInitialState(g);
            }
            nodeList[id] = {
                t: []
            };

            return g;
        }

        // checks if the node or one of its parent has class c. Specific to the AutomatonDesigner.
        function parentWithClass(node, c) {
            do {
                if (node.getAttribute("class") === c) {
                    return node;
                }
                node = node.parentNode;
            } while (node && node !== pkg.svgContainer);
            return false;
        }

        function relativePS(bbox, refBbox) {
            return {
                x: (bbox.x - refBbox.x) / refBbox.width,
                y: (bbox.y - refBbox.y) / refBbox.height,
                width:  bbox.width / refBbox.width,
                height: bbox.height / refBbox.height
            };
        }

        var stopOverlay = false;
        pkg.svgContainer.addEventListener("mousedown", function (e) {
            blockNewState = true;
            if (blockClick) {
                return;
            }
            blockClick = true;
            if (!e.button) { // left button
                nodeMoving = parentWithClass(e.target, "pathedit-handle");
                if (nodeMoving) {
                    overlayHide();

                    // handle path editing
                    coords = {
                        x: e.clientX,
                        y: e.clientY
                    };

                    pkg.stopMove = true;
                    setMoveAction(nodeMoving._moveFrame, e);
                } else if (e.target.classList.contains(CSSP + "resize-handle")) {
                    overlayHide();
                    beginNodeResizing(parentWithClass(resizeHandledElement, "node"), e);
                } else if (!parentWithClass(e.target, CSSP + "overlay")) {
                    var cso = currentOverlay;
                    pkg.cleanSVG(pkg.currentIndex, true);

                    if ( (nodeMoving = parentWithClass(e.target, "node")) ) {
                        if (currentMoveAction === nodeBindingFrame) {
                            setTimeout(
                                endNewTransition.bind(null, nodeMoving),
                                0
                            ); // setTimeout: workaround to get focus
                            stopOverlay = true;
                        } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                            pkg.stopMove = true;
                            removeNode(nodeMoving);
                        } else if (e.shiftKey) {
                            beginNewTransition(nodeMoving, e);
                        } else {
                            if (cso === nodeMoving) {
                                stopOverlay = true;
                            }
                            beginNodeMoving(nodeMoving, e);
                        }
                    } else if ( (nodeMoving = parentWithClass(e.target, "edge")) ) {
                        if (cso === nodeMoving) {
                            stopOverlay = true;
                        }

                        if (e.shiftKey) {
                            transitionStraight(nodeMoving);
                        } else if (e.ctrlKey || e.metaKey) {
                            deleteTransition(nodeMoving, null);
                        } else {
                            beginNewTransitionEdit(nodeMoving);
                            if (e.target.nodeName === "text") {
                                beginMoveTransitionLabel(e.target, e);
                            }
                        }
                    } else if (!currentMoveAction) {
                        blockNewState = false;
                    }
                }
            } else {
                endNewTransitionEdit();

                if (e.button === 1) {
                    beginViewBoxMove(e);
                } else if (e.button === 2) {
                    if ( (nodeMoving = parentWithClass(e.target, "node")) ) {
                        if (!e.shiftKey) {
                            if ((e.ctrlKey || e.metaKey)) {
                                setInitialState(nodeMoving);
                            } else {
                                toggleAccepting(nodeMoving);
                            }
                        }
                    }
                }
            }
        }, false);

        function nodeMouseUp(e) {
            var node = parentWithClass(e.target, "node");

            if (node) {
                if (!e.button) {
                    if (stopOverlay) {
                        stopOverlay = false;
                    } else {
                        stateResizeHandlesOn(node);
                        overlayOn(node);
                    }
                }
            } else if (currentMoveAction !== nodeResizeFrame) {
                resizeHandlesHide();

                node = parentWithClass(e.target, "edge");
                if (node) {
                    if (stopOverlay) {
                        stopOverlay = false;
                    } else {
                        overlayOn(node);
                    }
                } else {
                    overlayHide();
                }
            }

            pkg.svgContainer.style.cursor = "";
            cancelMoveAction();
        }

        pkg.svgContainer.addEventListener("mouseup", function (e) {
            blockClick = false;

            if (parentWithClass(e.target, CSSP + "overlay")) {
                return;
            }

            if (currentMoveAction === nodeBindingFrame) {
                if (!blockNewState && (nodeMoving = parentWithClass(e.target, "node"))) {
                    endNewTransition(nodeMoving);
                    stopOverlay = false;
                }
            } else {
                nodeMouseUp(e);

                if (pathEditor) {
                    fixPathEditor();
                }
            }
        }, false);

        function makeResizeHandle() {
            var rect = document.createElementNS(svgNS, "rect");
            resizeHandle = {
                g: document.createElementNS(svgNS, "g"),
                rect: rect,
                topLeft    : rect.cloneNode(false),
                top        : rect.cloneNode(false),
                topRight   : rect.cloneNode(false),
                bottomLeft : rect.cloneNode(false),
                bottom     : rect.cloneNode(false),
                bottomRight: rect.cloneNode(false),
                left       : rect.cloneNode(false),
                right      : rect.cloneNode(false)
            };

            resizeHandle.g.appendChild(resizeHandle.rect);
            resizeHandle.g.appendChild(resizeHandle.topLeft);
            resizeHandle.g.appendChild(resizeHandle.top);
            resizeHandle.g.appendChild(resizeHandle.topRight);
            resizeHandle.g.appendChild(resizeHandle.bottomLeft);
            resizeHandle.g.appendChild(resizeHandle.bottom);
            resizeHandle.g.appendChild(resizeHandle.bottomRight);
            resizeHandle.g.appendChild(resizeHandle.left);
            resizeHandle.g.appendChild(resizeHandle.right);

            resizeHandle.topLeft.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.top.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.topRight.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.bottomLeft.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.bottom.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.bottomRight.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.left.setAttribute("width", RESIZE_HANDLE_WIDTH);
            resizeHandle.right.setAttribute("width", RESIZE_HANDLE_WIDTH);

            resizeHandle.topLeft.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.top.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.topRight.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.bottomLeft.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.bottom.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.bottomRight.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.left.setAttribute("height", RESIZE_HANDLE_WIDTH);
            resizeHandle.right.setAttribute("height", RESIZE_HANDLE_WIDTH);


            resizeHandle.topLeft.classList.add(CSSP + "resize-handle");
            resizeHandle.top.classList.add(CSSP + "resize-handle");
            resizeHandle.topRight.classList.add(CSSP + "resize-handle");
            resizeHandle.bottomLeft.classList.add(CSSP + "resize-handle");
            resizeHandle.bottom.classList.add(CSSP + "resize-handle");
            resizeHandle.bottomRight.classList.add(CSSP + "resize-handle");
            resizeHandle.left.classList.add(CSSP + "resize-handle");
            resizeHandle.right.classList.add(CSSP + "resize-handle");

            resizeHandle.topLeft.classList.add(CSSP + "resize-top-left");
            resizeHandle.top.classList.add(CSSP + "resize-top");
            resizeHandle.topRight.classList.add(CSSP + "resize-top-right");
            resizeHandle.bottomLeft.classList.add(CSSP + "resize-bottom-left");
            resizeHandle.bottom.classList.add(CSSP + "resize-bottom");
            resizeHandle.bottomRight.classList.add(CSSP + "resize-bottom-right");
            resizeHandle.left.classList.add(CSSP + "resize-left");
            resizeHandle.right.classList.add(CSSP + "resize-right");


            resizeHandle.topLeft.style.cursor = "nw-resize";
            resizeHandle.top.style.cursor = "n-resize";
            resizeHandle.topRight.style.cursor = "ne-resize";
            resizeHandle.bottomLeft.style.cursor = "sw-resize";
            resizeHandle.bottom.style.cursor = "s-resize";
            resizeHandle.bottomRight.style.cursor = "se-resize";
            resizeHandle.left.style.cursor = "w-resize";
            resizeHandle.right.style.cursor = "e-resize";

            resizeHandle.rect.classList.add(CSSP + "resize-handle-rect");
        }

        function makeStateOverlay() {
            stateOverlay = document.createElement("ul");
            stateOverlay.classList.add(CSSP + "overlay");

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Toggle accepting");

            stateOverlay.lastChild.lastChild.onclick = function () {
                toggleAccepting(currentOverlay);
                overlayHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Rename");

            stateOverlay.lastChild.lastChild.onclick = function () {
                editNodeName(currentOverlay);
                overlayHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Make initial");

            stateOverlay.lastChild.lastChild.onclick = function () {
                setInitialState(currentOverlay);
                overlayHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Delete");

            stateOverlay.lastChild.lastChild.onclick = function () {
                removeNode(currentOverlay);
                overlayHide();
                resizeHandlesHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("New transition");

            stateOverlay.lastChild.lastChild.onclick = function (e) {
                beginNewTransition(currentOverlay, e);
                overlayHide();
            };

            transitionOverlay = document.createElement("ul");
            transitionOverlay.classList.add(CSSP + "overlay");

            transitionOverlay.appendChild(document.createElement("li"));
            transitionOverlay.lastChild.appendChild(document.createElement("a"));
            transitionOverlay.lastChild.lastChild.href = "#";
            transitionOverlay.lastChild.lastChild.textContent = _("Modify symbols");

            transitionOverlay.lastChild.lastChild.onclick = function () {
                editTransitionSymbols(currentOverlay);
                overlayHide();
            };

            transitionOverlay.appendChild(document.createElement("li"));
            transitionOverlay.lastChild.appendChild(document.createElement("a"));
            transitionOverlay.lastChild.lastChild.href = "#";
            transitionOverlay.lastChild.lastChild.textContent = _("Make straight");

            transitionOverlay.lastChild.lastChild.onclick = function () {
                transitionStraight(currentOverlay);
                overlayHide();
            };
            transitionOverlay.appendChild(document.createElement("li"));
            transitionOverlay.lastChild.appendChild(document.createElement("a"));
            transitionOverlay.lastChild.lastChild.href = "#";
            transitionOverlay.lastChild.lastChild.textContent = _("Delete");

            transitionOverlay.lastChild.lastChild.onclick = function () {
                deleteTransition(currentOverlay);
                endNewTransitionEdit();
                overlayHide();
            };
       }

        function setOverlayOn(node, e) {
            currentOverlay = node;

            var elem;

            if (node.classList.contains("edge")) {
                elem = node.getElementsByTagName("text")[0];
                overlay = transitionOverlay;
            } else {
                elem = node;
                overlay = stateOverlay;
            }

            if (e) {
                overlay.style.left = (e.clientX + 2) + "px";
                overlay.style.top = (e.clientY + 2) + "px";
            } else {
                var bcr = elem.getBoundingClientRect();
                var parentBcr = pkg.svgNode.parentNode.getBoundingClientRect();
                overlay.style.left = (bcr.left - parentBcr.left) + "px";
                overlay.style.top  = (OVERLAY_TOP_OFFSET + bcr.height + bcr.top - parentBcr.top) + "px";
            }

            pkg.svgNode.parentNode.appendChild(overlay);
        }

        function overlayOn(node) {
            if (!overlay) {
                makeStateOverlay();
            }

            setOverlayOn(node);
        }

        function resizeHandlesOn(ele) {

            var r = ele.getBBox();

            r = {
                left:   r.x,
                top:    r.y,
                right:  r.x + r.width,
                bottom: r.y + r.height,
                width:  r.width,
                height: r.height
            };


            resizeHandle.rect.setAttribute("x",        r.left);
            resizeHandle.left.setAttribute("x",        r.left - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.topLeft.setAttribute("x",     r.left - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.bottomLeft.setAttribute("x",  r.left - (RESIZE_HANDLE_WIDTH / 2));

            resizeHandle.rect.setAttribute("width",    r.width);
            resizeHandle.right.setAttribute("x",       r.right - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.topRight.setAttribute("x",    r.right - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.bottomRight.setAttribute("x", r.right - (RESIZE_HANDLE_WIDTH / 2));

            resizeHandle.rect.setAttribute("y",        r.top);
            resizeHandle.top.setAttribute("y",         r.top - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.topLeft.setAttribute("y",     r.top - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.topRight.setAttribute("y",    r.top - (RESIZE_HANDLE_WIDTH / 2));

            resizeHandle.rect.setAttribute("height",   r.height);
            resizeHandle.bottom.setAttribute("y",      r.bottom - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.bottomLeft.setAttribute("y",  r.bottom - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.bottomRight.setAttribute("y", r.bottom - (RESIZE_HANDLE_WIDTH / 2));

            resizeHandle.bottom.setAttribute("x",      r.left + r.width  / 2 - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.top.setAttribute("x",         r.left + r.width  / 2 - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.left.setAttribute("y",        r.top  + r.height / 2 - (RESIZE_HANDLE_WIDTH / 2));
            resizeHandle.right.setAttribute("y",       r.top  + r.height / 2 - (RESIZE_HANDLE_WIDTH / 2));

            if (resizeHandledElement !== ele) {

                if (resizeHandledElement) {
                    resizeHandledElement.classList.remove(CSSP + "resize-handled");
                }

                resizeHandledElement = ele;
                ele.classList.add(CSSP + "resize-handled");

                pkg.svgNode.appendChild(resizeHandle.g);
            }
        }

        function stateResizeHandlesOn(state) {
            if (!resizeHandle) {
                makeResizeHandle();
            }

            resizeHandlesOn(getBigEllipse(state));
        }

        pkg.svgContainer.addEventListener("dblclick", function (e) {
            if ( (nodeEdit = parentWithClass(e.target, "node")) ) {
                if (!(e.button || e.shiftKey || e.ctrlKey || e.metaKey)) {
                    editNodeName(nodeEdit);
                }
            } else if ( (nodeEdit = parentWithClass(e.target, "edge")) ) {
                if (!(e.ctrlKey || e.metaKey || e.shiftKey)) { // delete transition
                    editTransitionSymbols(nodeEdit);
                }
            } else if (!(e.button || blockNewState || e.ctrlKey || e.metaKey || e.shiftKey)) {
                createNode(e);
            }
        }, false);

        window.addEventListener("keydown", function (e) {
            if (e.keyCode === 27) {
                if (currentMoveAction === nodeBindingFrame) {
                    pathEdit.parentNode.removeChild(pathEdit);
                    cancelMoveAction();
                }
            }
        }, false);

        (pkg.userZoom = function (that) {
            if (!that.redraw) {
                that.redraw = function () {
                    pkg.redraw(that);
                };
            }

            var oldZoom, initialZoom, lastDeltaX, lastDeltaY;

            function newZoom(zoom, x, y) {
                if (!zoom) {
                    that.svgZoom = 0.1;
                    return;
                }

                that.svgZoom = zoom;
                pkg.setViewBoxSize(that);

                if (!isNaN(x)) {
                    that.svgNode.viewBox.baseVal.x = x - (x - that.svgNode.viewBox.baseVal.x) * oldZoom / that.svgZoom;
                    that.svgNode.viewBox.baseVal.y = y - (y - that.svgNode.viewBox.baseVal.y) * oldZoom / that.svgZoom;
                }
            }

            listenMouseWheel(function (e, delta) {
                if (!that.svgNode) {
                    return null;
                }

                var pt = svgcursorPoint(e, that);
                oldZoom = that.svgZoom;
                newZoom(Math.round((that.svgZoom + delta * 0.1) * 10) / 10, pt.x, pt.y);

                e.preventDefault();
                e.stopPropagation();
                return false;
            }, that.svgContainer);

            function drag(e) {
                if (lastDeltaX || lastDeltaY) {
                    that.svgNode.viewBox.baseVal.x -= (e.gesture.deltaX - lastDeltaX) / that.svgZoom;
                    that.svgNode.viewBox.baseVal.y -= (e.gesture.deltaY - lastDeltaY) / that.svgZoom;
                }
                lastDeltaX = e.gesture.deltaX;
                lastDeltaY = e.gesture.deltaY;
            }

            if (window.Hammer) {
                window.Hammer(that.svgContainer).on("touch", function () {
                    initialZoom = that.svgZoom;
                    lastDeltaX = 0;
                    lastDeltaY = 0;
                });
                window.Hammer(that.svgContainer).on("pinch", function (e) {
                    if (that === pkg) {
                        blockNewState = true;
                    }
                    that.stopMove = true;
                    that.stopMoveNode = true;

                    oldZoom = that.svgZoom;
                    var nz = initialZoom * e.gesture.scale;

                    if (nz !== that.svgZoom) {
                        var pt = svgcursorPoint({
                            clientX: e.gesture.center.pageX,
                            clientY: e.gesture.center.pageY
                        }, that);

                        newZoom(nz, pt.x, pt.y);
                    }

                    drag(e);
                });

                window.Hammer(that.svgContainer).on("drag", function (e) {
                    if (!that.stopMove) {
                        blockNewState = true;
                        drag(e);
                    }
                });

                window.Hammer(that.svgContainer).on("release", function () {
                    that.stopMove = false;
                    that.stopMoveNode = false;
                });
            }
        })(pkg);

        pkg.svgContainer.ondragstart = pkg.svgContainer.onselectstart = pkg.svgContainer.oncontextmenu = function (e) {
            e.preventDefault();
            return false;
        };

        pkg.clearSVG(pkg.currentIndex);

        pkg.svgContainer.parentNode.appendChild(document.createElement("button"));
        pkg.svgContainer.parentNode.lastChild.id = "new-state-btn";

        pkg.svgContainer.parentNode.lastChild.onclick = function (e) {
            beginNodeMoving(createNode(e), e);
        };

        pkg.svgContainer.parentNode.lastChild.textContent = _("New state");

    };

    // utility function : gets the outerHTML of a node.
    // WARNING: please don"t use this function for anything,
    //          it's not universal and could break your code.
    //          Check its implementation for more details.
    pkg.outerHTML = function (node) {
        // webkit does not support inner/pkg.outerHTML for pure XML nodes
        if ("outerHTML" in node) {
            return node.outerHTML;
        }

        if (node.parentNode && node.parentNode.childNodes.length === 1) {
            return node.parentNode.innerHTML;
        }

        var ns = node.nextSibling;
        var pn = node.parentNode;
        var div = document.createElement("div");
        div.appendChild(node);
        var o = div.innerHTML;

        if (pn) {
            pn.insertBefore(node, ns);
        } else {
            div.removeChild(node);
        }

        div = null;
        return o;
    };

    pkg.stateSetBackgroundColor = function (index, state, color) {
        var s = svgs[index];
        if (s) {
            state = s.getElementById(btoa(pkg.getStringValueFunction(state)));
            if (state) {
                getBigEllipse(state).setAttribute("fill", color);
            }
        }
    };

    pkg.stateRemoveBackgroundColor = function (index, state) {
        pkg.stateSetBackgroundColor(index, state, "transparent");
    };

    pkg.transitionSetColor = function (index, startState, symbol, endState, color) {
        var s = svgs[index];
        startState = pkg.getStringValueFunction(startState);
        endState   = pkg.getStringValueFunction(endState);

        if (s) {
            var edge = s.getElementById(btoa(startState) + " " + btoa(endState));
            if (edge) {
                edge.getElementsByTagName("text")[0].setAttribute("fill", color);
                edge.querySelector("polygon").setAttribute("fill", color);
                edge.querySelector("polygon").setAttribute("stroke", color);
                edge.getElementsByTagName("path")[0].setAttribute("stroke", color);
            }
        }
    };

    function handlePulse(text, polygon, path, step, pulseTime) {
        if (step) {
            text.style.transition = text.style.webkitTransition = text.style.msTransition = polygon.style.transition = polygon.style.webkitTransition = polygon.style.msTransition = path.style.transition = path.style.webkitTransition = path.style.msTransition = "";
        } else {
            text.removeAttribute("fill");
            polygon.setAttribute("fill", "black");
            polygon.setAttribute("stroke", "black");
            path.setAttribute("stroke", "black");
            text.style.transition = text.style.webkitTransition = text.style.msTransition = polygon.style.transition = polygon.style.webkitTransition = polygon.style.msTransition = path.style.transition = path.style.webkitTransition = path.style.msTransition = pulseTime + "ms";
            setTimeout(handlePulse, pulseTime / 2, text, polygon, path, 1);
        }
    }
    pkg.transitionPulseColor = function (index, startState, symbol, endState, color, pulseTime) {
        var s = svgs[index];

        if (s) {
            var edge = s.getElementById(btoa(startState) + " " + btoa(endState));

            if (edge) {
                var text     = edge.getElementsByTagName("text")[0],
                    polygon  = edge.querySelector("polygon"),
                    path     = edge.getElementsByTagName("path")[0];

                text.setAttribute("fill", color);
                polygon.setAttribute("fill", color);
                polygon.setAttribute("stroke", color);
                path.setAttribute("stroke", color);
                setTimeout(handlePulse, pulseTime / 2, text, polygon, path, 0, pulseTime);
            }
        }
    };

    pkg.transitionRemoveColor = function (index, startState, symbol, endState) {
        var s = svgs[index];

        if (s) {
            var edge = s.getElementById(btoa(startState) + " " + btoa(endState));

            if (edge) {
                edge.getElementsByTagName("text")[0].removeAttribute("fill");
                edge.querySelector("polygon").setAttribute("fill", "black");
                edge.querySelector("polygon").setAttribute("stroke", "black");
                edge.getElementsByTagName("path")[0].setAttribute("stroke", "black");
            }
        }
    };

    pkg.prompt = function (title, descr, def, fun) {
        fun(window.prompt(title + ": " + descr, def));
    };
}(window.automataDesigner = {}, window.automataDesignerGlue || (window.automataDesignerGlue = {}), this));
