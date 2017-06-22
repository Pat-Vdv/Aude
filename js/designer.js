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
/*global libD.b64DecodeUnicode:false, DOMParser:false, SVGPathSeg: false, parse_transition: false, pkg.formatTrans: false, listenMouseWheel: false, epsilon: false, Set: false, automataMap:false, Automaton: false*/

// NEEDS: automaton.js, mousewheel.js;

// TODO: move initial state's arrow.

(function (pkg) {
    "use strict";

    var svgNS = "http://www.w3.org/2000/svg";
    var RESIZE_HANDLE_WIDTH = 12;
    var TRANSITION_HANDLE_WIDTH = 6;
    var CSSP = "automata-designer-";
    var OVERLAY_TIMEOUT = 1500;
    var OVERLAY_TOP_OFFSET = 10;
    var MOVE_BEFORE_BLOCK_OVERLAY = 3;

    function id(node, value) {
        if (value === undefined) {
            return node.getAttribute("data-id") || node.getAttribute("id");
        }

        node.setAttribute("data-id", value);
        return value;
    }

    function byId(node, nid) {
        return node.querySelector("[data-id=" + JSON.stringify(nid) + "]");
    }

    function fill(node, color) {
        if (color === "none") {
            node.setAttribute("fill", "white");
            node.setAttribute("fill-opacity", "0");
        } else {
            node.setAttribute("fill", color);
            node.removeAttribute("fill-opacity");
        }
    }

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

    // get the right coordinates of the cursor of the <svg> node
    function svgcursorPoint(svgNode, evt) { // thx http://stackoverflow.com/questions/5901607/svg-coordiantes
        var pt = svgNode.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        var a = svgNode.getScreenCTM();
        if (!a) {
            throw new Error("coordinates unavailable");
        }
        var b = a.inverse();
        return pt.matrixTransform(b);
    }

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
    function posTriangleArrow(svgNode, polygonPoints, ellipse, p, cx, cy) {

        if (!cy) {
            cy = ellipse.cy.baseVal.value;
        }

        if (!cx) {
            cx = ellipse.cx.baseVal.value;
        }

        var beta    = Math.PI / 2 - (Math.atan((cx - p.x) / (cy - p.y)) || 0),
            top     = svgNode.createSVGPoint(),
            bot     = svgNode.createSVGPoint(),
            top2    = svgNode.createSVGPoint(),
            peak    = svgNode.createSVGPoint(),
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
    function cleanTransitionPos(svgNode, path, polygonPoints, text, stateOrig, stateDest) {
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
            posTriangleArrow(svgNode, polygonPoints, ellipseD, p, cx, cy);

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

        posTriangleArrow(svgNode, polygonPoints, ellipseD, p);

        if (text) {
            text.setAttribute("x", (p.x + po.x) / 2);
            text.setAttribute("y", (p.y + po.y) / 2 - 5);
        }
    }

    function fixBrokenGraphvizTitle(t) {
        return t.replace(/\\\\/g, "\\");
    }

    function toBrokenGraphvizTitle(t) {
        return t.toString().replace(/\\/g, "\\\\");
    }

    function dataIdToId(svgNode) {
        svgNode = svgNode.cloneNode(true);
        var identifiedElements = svgNode.querySelectorAll("[data-id]");

        for (var nid, i = 0, len = identifiedElements.length; i < len; i++) {
            nid = identifiedElements[i].getAttribute("data-id");
            identifiedElements[i].removeAttribute("data-id");
            identifiedElements[i].setAttribute("id", nid);
        }

        return svgNode;
    }

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

    function parseTransition(text, f, t) {
        try {
            return parse_transition(text);
        } catch (e) {
            alert(
                libD.format(
                    _("Sorry! the transition “{2}” from state “{0}” to state “{1}” could not be understood. Please check that the transition is a comma separated symbol list. Special characters must be put inside quotes (' or \"). Epsilons are written '\\e' or 'ɛ' (without quotes)."),
                    f,
                    t,
                    text
                )
            );
            throw e;
        }
    }

    function AudeDesigner(svgContainer, readOnly) {
        this.nodeLists            = [];    // array containing all the automata's "nodeList"s
        this.initialStateArrows   = [];    // array containing all the automata's initial state's arrow
        this.initialStates        = [];    // array containing all the automata's initial state's node
        this.svgs                 = [];    // will contain all currently opened automata
        this.snapshotStacks       = [];    // contains the all the automata's snapshots to allow undo/redo
        this.nodeList             = null;  // list of the states' nodes of the currently designed automaton
        this.initialStateArrow    = null;  // current initial state arrow node (<g>)
        this.pathEditor           = null;  // <g> to edit paths and control points of these paths
        this.initialState         = null;  // current automaton initial state's note (<g>)
        this.snapshotStack        = null;

        this.resizeHandle         = null;
        this.resizeHandledElement = null;
        this.currentOverlay       = null;
        this.overlay              = null;
        this.blockNewState        = false;

        this.svgNode              = null;      // <svg> editor
        this.svgZoom              = 1;         // current zoom level
        this.oldZoom              = 1;
        this.currentIndex         = 0;         // index of the currently designed automaton

        this.load(svgContainer, readOnly);
    }

    AudeDesigner.prototype.transitionPulseColor = function (index, startState, symbol, endState, color, pulseTime) {
        var s = this.svgs[index];

        if (s) {
            var edge = byId(s, libD.b64EncodeUnicode(startState) + " " + libD.b64EncodeUnicode(endState));

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

    AudeDesigner.getStringValueFunction = function (s) {
        return s === "ε" ? "\\e" : JSON.stringify(s);
    };

    AudeDesigner.getValueFunction = AudeDesigner.standardizeStringValueFunction = function (s) {
        return s === "\\e" ? "ε" : s;
    };

    // utility function : gets the outerHTML of a node.
    // WARNING: please don"t use this function for anything,
    //          it's not universal and could break your code.
    //          Check its implementation for more details.
    AudeDesigner.outerHTML = function (node) {
        // webkit does not support inner/AudeDesigner.outerHTML for pure XML nodes
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

    AudeDesigner.prompt = function (title, descr, def, fun) {
        fun(window.prompt(title + ": " + descr, def));
    };

    pkg.AudeDesigner = AudeDesigner;
    var _ = AudeDesigner.l10n = pkg.libD && pkg.libD.l10n ? pkg.libD.l10n() : function (s) { return s; };


    AudeDesigner.formatTrans = function (t) {
        return t.replace(/\\e/g, "ε");
    };

    AudeDesigner.prototype.triggerUndoRedoEvent = function triggerUndoRedoEvent() {
        if (this.onUndoRedoEvent) {
            let snapshotStack = this.snapshotStack;
            this.onUndoRedoEvent(
                !!snapshotStack.stack[snapshotStack.currentIndex - 1],
                !!snapshotStack.stack[snapshotStack.currentIndex + 1]
            );
        }
    };

     AudeDesigner.prototype.snapshot = function snapshot(dontSnapshot) {
        let snapshotStack = this.snapshotStack;
        if (!dontSnapshot || !snapshotStack.stack[snapshotStack.currentIndex]) {
            snapshotStack.stack = snapshotStack.stack.slice(0, ++snapshotStack.currentIndex);
            snapshotStack.stack[snapshotStack.currentIndex] = this.svgNode.cloneNode(true);
        }

        this.triggerUndoRedoEvent();
    };

    AudeDesigner.prototype.snapshotRestore = function snapshotRestore(snapshotIndex) {
        let snapshotStack = this.snapshotStack;

        this.setSVG(snapshotStack.stack[snapshotIndex], this.currentIndex, true);
        snapshotStack.currentIndex = snapshotIndex;

        this.pathEditor = null;
        var pathEditorLocal = this.svgContainer.querySelector("[data-id='path-editor']");

        if (pathEditorLocal) {
            pathEditorLocal.parentNode.removeChild(pathEditorLocal);
        }

        this.resizeHandle = null;
        var resizeHandleLocal = document.querySelector("[data-id='resize-handle']");

        if (resizeHandleLocal) {
            resizeHandleLocal.parentNode.removeChild(resizeHandleLocal);
        }


        this.triggerUndoRedoEvent();
    }

    AudeDesigner.prototype.redo = function () {
        var newIndex = this.snapshotStack.currentIndex + 1;

        if (this.snapshotStack.stack[newIndex]) {
            this.snapshotRestore(newIndex);
        }

        this.triggerUndoRedoEvent();
    };

    AudeDesigner.prototype.undo = function () {
        var newIndex = this.snapshotStack.currentIndex - 1;

        if (this.snapshotStack.stack[newIndex]) {
            if (!this.snapshotStack.stack[this.snapshotStack.currentIndex]) {
                this.snapshot();
            }

            this.snapshotRestore(newIndex);
        }

        this.triggerUndoRedoEvent();
    };

    //set the initial state for the current automaton
    AudeDesigner.prototype.setInitialState = function (node) {
        var path, polygon, title;

        if (this.initialStateArrow) {
            path    = this.initialStateArrow.getElementsByTagName("path")[0];
            polygon = this.initialStateArrow.querySelector("polygon");
            title   = this.initialStateArrow.querySelector("title");
        } else {
            this.initialStateArrow = this.initialStateArrows[this.currentIndex] = document.createElementNS(svgNS, "g");
            id(this.initialStateArrow, "initialStateArrow");
            title = document.createElementNS(svgNS, "title");
            path =  document.createElementNS(svgNS, "path");
            polygon = document.createElementNS(svgNS, "polygon");
            path.setAttribute("stroke", "black");
            polygon.setAttribute("stroke", "black");
            polygon.setAttribute("fill", "black");
            this.initialStateArrow.appendChild(title);
            this.initialStateArrow.appendChild(path);
            this.initialStateArrow.appendChild(polygon);
            this.svgNode.querySelector("g").appendChild(this.initialStateArrow);
        }

        let ellipse = getBigEllipse(node);

        let cy   = ellipse.cy.baseVal.value;
        let cx   = ellipse.cx.baseVal.value;
        let rx   = ellipse.rx.baseVal.value;
        let dx   = cx - rx;
        let dx10 = dx - 10;
        let dx5  = dx - 5;

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

        title.textContent = "_begin->" + libD.b64DecodeUnicode(id(node));
        this.initialState = this.initialStates[this.currentIndex] = node;
    };

    AudeDesigner.prototype.overlayHide = function overlayHide() {
        if (this.overlay) {
            if (this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }

            this.currentOverlay = null;
        }
    };

    AudeDesigner.prototype.resizeHandlesHide = function () {
        if (!this.resizeHandle || !this.resizeHandle.g.parentNode) {
            return;
        }

        var p = this.resizeHandle.g.parentNode;
        p.removeChild(this.resizeHandle.g);

        if (this.resizeHandledElement) {
            this.resizeHandledElement.classList.remove(CSSP + "resize-handled");
            this.resizeHandledElement = null;
        }
    };

    // set the automaton #<index>'s code
    AudeDesigner.prototype.setAutomatonCode = function (automaton, index) {
        var matches = automaton.match(/<representation type=['"]image\/svg\+xml['"]>([\s\S]+)<\/representation>/);
        if (matches) {
            this.setSVG(matches[1], index);
        } else {
            var that = this;
            AudeGUI.viz(
                automaton2dot(Automaton.parse(automaton)),
                function (res) {
                    that.setSVG(res, index);
                }
            );
        }
    };

    // reset the automaton #<index>
    AudeDesigner.prototype.clearSVG = function (index, dontSnapshot) {
        this.setSVG("<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'> <g id='graph1' class='graph' transform='scale(1 1) rotate(0) translate(0 0)'> <title>automaton</title></g></svg>", index, dontSnapshot);
    };

    // set current automaton's SVG
    AudeDesigner.prototype.setSVG = function (svg, index, dontSnapshot = false) {
        if (!svg) {
            return this.clearSVG(index);
        }

        if (index === undefined) {
            index = this.currentIndex;
        }

        var svgWorkingNode;
        if (index === this.currentIndex) {
            if (typeof svg === "string") {
                this.svgContainer.innerHTML = svg.replace(/<\?[\s\S]*\?>/g, "").replace(/<![\s\S]*?>/g, "");
            } else {
                this.svgContainer.textContent = "";
                this.svgContainer.appendChild(svg.cloneNode(true));
            }

            svgWorkingNode = this.svgNode = this.svgContainer.querySelector("svg");
        } else {
            svgWorkingNode = new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("svg");
        }

        this.svgs[index] = svgWorkingNode;
        svgWorkingNode.setAttribute("width",  this.svgContainer.offsetWidth);
        svgWorkingNode.setAttribute("height", this.svgContainer.offsetHeight);

        if (!svgWorkingNode.viewBox.baseVal) {
            svgWorkingNode.setAttribute("viewBox", "0 0 " + this.svgContainer.offsetWidth + " " + this.svgContainer.offsetHeight);
        }

        var workingNodeList = this.nodeLists[index] = Object.create(null),
            states = svgWorkingNode.querySelectorAll(".node"),
            len,
            i;

        for (i = 0, len = states.length; i < len; ++i) {
            fill(states[i].querySelector("ellipse"), "none");
            workingNodeList[libD.b64DecodeUnicode(id(states[i]))] = {
                t: []
            };
        }

        var edges = svgWorkingNode.querySelectorAll(".edge");
        for (i = 0, len = edges.length; i < len; ++i) {
            if (id(edges[i]) !== "initialStateArrow") {
                states = id(edges[i]).split(" ");
                workingNodeList[libD.b64DecodeUnicode(states[1])].t.push([edges[i], false]); // false : state is not origin
                if (states[1] !==  states[0]) {
                    workingNodeList[libD.b64DecodeUnicode(states[0])].t.push([edges[i], true]); // true : state is origin
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

        var identifiedElements = svgWorkingNode.querySelectorAll("[id]");

        var nid, len = identifiedElements.length;
        for (i = 0; i < len; i++) {
            nid = identifiedElements[i].getAttribute("id");
            identifiedElements[i].removeAttribute("id");
            identifiedElements[i].setAttribute("data-id", nid);
        }

        var workingInitialStateArrow = this.initialStateArrows[index] = byId(svgWorkingNode, "initialStateArrow");

        if (index === this.currentIndex) {
            this.initialStateArrow = workingInitialStateArrow;
        }

        if (workingInitialStateArrow) {
            this.setInitialState(
                byId(svgWorkingNode,
                    libD.b64EncodeUnicode(
                        fixBrokenGraphvizTitle(
                            workingInitialStateArrow.querySelector("title").textContent.substr(8)
                        )
                    )
                )
            );

            // 8 : size of "_begin->"
        } else {
            this.initialState = this.initialStates[index] = null;
        }

        this.setCurrentIndex(this.currentIndex);
        this.redraw();
        this.snapshot(dontSnapshot);
    };

    // Choose the current automaton
    AudeDesigner.prototype.setCurrentIndex = function (index) {
        this.cleanSVG(this.currentIndex, true);
        this.currentIndex = index;
        if (!this.svgs[index]) {
            this.clearSVG(this.currentIndex);
        }

        this.nodeList = this.nodeLists[index];
        this.initialStateArrow = this.initialStateArrows[index];
        this.initialState = this.initialStates[index];

        if (!this.snapshotStacks[index]) {
            this.snapshotStacks[index] = {
                currentIndex: 0,
                stack: []
            };
        }

        this.snapshotStack = this.snapshotStacks[index];

        if (this.svgNode) {
            this.svgContainer.replaceChild(this.svgs[index], this.svgNode);
        } else {
            this.svgContainer.appendChild(this.svgs[index]);
        }

        this.svgNode = this.svgs[index];
        this.redraw();
    };

    // this function is to be called when a new automaton with index <index> must be created
    AudeDesigner.prototype.newAutomaton = function (index) {
        if (this.nodeLists[index]) {
            this.clearSVG(index, true);
        }
    };

    // remove the automaton #<index>
    AudeDesigner.prototype.removeAutomaton = function (index) {
        this.svgs.splice(index, 1);
        this.nodeLists.splice(index, 1);
        this.snapshotStacks.splice(index, 1);
        this.initialStateArrows.splice(index, 1);
    };

    // this function is to be called when the SVG code of an automaton has to be retrieved
    AudeDesigner.prototype.cleanSVG = function (index, dontCleanColors) {
        if (this.pathEditor && this.pathEditor.parentNode) {
            this.pathEditor.parentNode.removeChild(this.pathEditor);
            this.pathEditor = null;
        }

        this.overlayHide();
        this.resizeHandlesHide();

        var pathEditorLocal = this.svgContainer.querySelector("[data-id=path-editor]");
        if (pathEditorLocal) {
            pathEditorLocal.parentNode.removeChild(pathEditorLocal);
        }

        if (!dontCleanColors && this.svgs[index]) {
            var ellipses = this.svgs[index].getElementsByTagName("ellipse"),
                edges    = this.svgs[index].getElementsByClassName("edge"),
                len,
                i;

            for (i = 0, len = ellipses.length; i < len; ++i) {
                fill(ellipses[i], "none");
                ellipses[i].classList.remove(CSSP + "resize-handled");
            }

            for (i = 0, len = edges.length; i < len; ++i) {
                if (id(edges[i]) !== "initialStateArrow") {
                    edges[i].getElementsByTagName("text")[0].removeAttribute("fill");
                    edges[i].querySelector("polygon").setAttribute("fill", "black");
                    edges[i].querySelector("polygon").setAttribute("stroke", "black");
                    edges[i].getElementsByTagName("path")[0].setAttribute("stroke", "black");
                }
            }
        }
    };

    //IMPORTANT: call this whenever you mess around with the svg container.
    AudeDesigner.prototype.redraw = function () {
        if (this.svgNode) {
            this.setViewBoxSize();
        }
    };


    // reset the viewBox size (uses the size of the svg container and the zoom level to do it)
    AudeDesigner.prototype.setViewBoxSize = function () {
        if (this.svgContainer && this.svgContainer.offsetWidth) {
            this.svgNode.viewBox.baseVal.width  = (this.svgNode.width.baseVal.value  = this.svgContainer.offsetWidth) / this.svgZoom;
            this.svgNode.viewBox.baseVal.height = (this.svgNode.height.baseVal.value = this.svgContainer.offsetHeight) / this.svgZoom;
        }
    };

    // Retrieve the code of the automaton #index, svg code included.
    // if the <svg> representation is not desired (e.g. you need a cleaner visual representation of the automaton),
    // set withoutSVG to true
    AudeDesigner.prototype.getAutomatonCode = function (index, withoutSVG) {
        var getStringValue = AudeDesigner.getStringValueFunction;

        this.cleanSVG(this.currentIndex);
        if (!this.initialStates[index]) {
            return ""; // automata without initial states are not supported
        }

        var states      = [],
            finalStates = [],
            nodes       = this.svgs[index].querySelectorAll(".node"),
            len,
            i;

        for (i = 0, len = nodes.length; i < len; ++i) {
            if (nodes[i].querySelectorAll("ellipse").length > 1) {
                finalStates.push(libD.b64DecodeUnicode(id(nodes[i])));
            } else if (nodes[i] !== this.initialState) {
                states.push(libD.b64DecodeUnicode(id(nodes[i])));
            }
        }

        var code = getStringValue(libD.b64DecodeUnicode(id(this.initialStates[index]))) + "\n";

        for (i = 0, len = states.length; i < len; ++i) {
            code += getStringValue(states[i]) + "\n";
        }

        code += "\n";

        for (i = 0, len = finalStates.length; i < len; ++i) {
            code += getStringValue(finalStates[i]) + "\n";
        }

        code += "\n";

        var s, leng, symbols, tid, f, t, text, trans = this.svgs[index].querySelectorAll(".edge");

        for (i = 0, len = trans.length; i < len; ++i) {
            if (trans[i] !== this.initialStateArrows[index]) {
                tid  = id(trans[i]).split(" ");
                text = trans[i].getElementsByTagName("text")[0].textContent;
                f = libD.b64DecodeUnicode(tid[0]);
                t = libD.b64DecodeUnicode(tid[1]);

                symbols = parseTransition(text, f, t);
                for (s = 0, leng = symbols.length; s < leng; ++s) {
                    code +=  getStringValue(f) + " " + (symbols[s] === epsilon ? "\\e" : aude.elementToString(symbols[s], automataMap)) + " " + getStringValue(t) + "\n";
                }
            }
        }
        return code + (withoutSVG ? "" : "\n<representation type='image/svg+xml'>\n" + AudeDesigner.outerHTML(this.svgs[index]).trim() + "\n</representation>\n");
    };

    AudeDesigner.prototype.getAutomaton = function (index, onlyStrings) {
        var A = new Automaton();
        this.cleanSVG(this.currentIndex);

        if (!this.initialStates[index]) {
            return null; // automata without initial states are not supported
        }

        var getValue = (
            onlyStrings
                ? v => AudeDesigner.getValueFunction(v).toString()
                : AudeDesigner.getValueFunction
        );

        var nodes = this.svgs[index].querySelectorAll(".node");

        for (let i = 0, len = nodes.length; i < len; ++i) {
            if (nodes[i].querySelectorAll("ellipse").length > 1) {
                A.addFinalState(getValue(libD.b64DecodeUnicode(id(nodes[i]))));
            } else if (nodes[i] !== this.initialState) {
                A.addState(getValue(libD.b64DecodeUnicode(id(nodes[i]))));
            }
        }

        A.setInitialState(getValue(libD.b64DecodeUnicode(id(this.initialStates[index]))));

        var trans = this.svgs[index].querySelectorAll(".edge");

        for (let i = 0, len = trans.length; i < len; ++i) {
            if (trans[i] !== this.initialStateArrows[index]) {
                let tid  = id(trans[i]).split(" ");
                let text = trans[i].getElementsByTagName("text")[0].textContent;
                let f    = libD.b64DecodeUnicode(tid[0]);
                let t    = libD.b64DecodeUnicode(tid[1]);

                let symbols = parseTransition(text, f, t);

                for (let s = 0, leng = symbols.length; s < leng; ++s) {
                    A.addTransition(getValue(f), (onlyStrings && (symbols[s] !== epsilon)) ? symbols[s].toString() : symbols[s], getValue(t));
                }
            }
        }

        return A;
    };

    AudeDesigner.prototype.getDot = function (index, title) {
        if (index === undefined) {
            index = this.currentIndex;
        }

        var A = new Automaton();
        this.cleanSVG(this.currentIndex);
        if (!this.initialStates[index]) {
            return null; // automata without initial states are not supported
        }

        var getValue = function (v) { return AudeDesigner.getValueFunction(v).toString(); };

        this.cleanSVG(this.currentIndex);

        if (!title) {
            title = "automaton";
        }


        var dot = "digraph " +
                  JSON.stringify(title) +
                  " {\n\trankdir=LR\n\t_begin [style = invis];\n";


        var nodes = this.svgs[index].querySelectorAll(".node");

        for (let i = 0, len = nodes.length; i < len; ++i) {
            if (nodes[i].querySelectorAll("ellipse").length > 1) {
                A.addFinalState(libD.b64DecodeUnicode(id(nodes[i])));
            } else if (nodes[i] !== this.initialState) {
                A.addState(getValue(libD.b64DecodeUnicode(id(nodes[i]))));
            }
        }

        A.setInitialState(getValue(libD.b64DecodeUnicode(id(this.initialStates[index]))));

        var trans = this.svgs[index].querySelectorAll(".edge");

        for (let i = 0, len = trans.length; i < len; ++i) {
            if (trans[i] !== this.initialStateArrows[index]) {
                let tid  = id(trans[i]).split(" ");
                let text = trans[i].getElementsByTagName("text")[0].textContent;
                let f    = libD.b64DecodeUnicode(tid[0]);
                let t    = libD.b64DecodeUnicode(tid[1]);

                let symbols = parseTransition(text, f, t);

                for (let s = 0, leng = symbols.length; s < leng; ++s) {
                    A.addTransition(getValue(f), (symbols[s] !== epsilon) ? symbols[s].toString() : symbols[s], getValue(t));
                }
            }
        }

        return automaton2dot(A);
    };

    AudeDesigner.prototype.getSVG = function (index) {
        if (this.svgs[index]) {
            this.cleanSVG(index);
            return AudeDesigner.outerHTML(dataIdToId(this.svgs[index])).trim();
        }

        return "";
    };

    AudeDesigner.prototype.getSVGNode = function (index) {
        return this.svgs[index];
    };

    AudeDesigner.prototype.load = function (svgContainer, readOnly) {
        svgContainer.appendChild(document.createElement("div"));
        this.svgContainer = svgContainer.lastChild;
        this.svgContainer.style.position = "absolute";
        this.svgContainer.style.top = "0";
        this.svgContainer.style.left = "0";
        this.svgContainer.style.right = "0";
        this.svgContainer.style.bottom = "0";

        this.redraw();

        window.addEventListener("resize", this.redraw.bind(this), false);

        var that = this;

        that.userZoom();
        that.enable();

        that.svgContainer.ondragstart = that.svgContainer.onselectstart = that.svgContainer.oncontextmenu = function (e) {
            e.preventDefault();
            return false;
        };

        that.clearSVG(that.currentIndex, true);

        if (readOnly) {
            return;
        }

        var nodeMoving, nodeEdit, pathEdit, coords, nodeMovingData, blockClick, mouseCoords = null, origMouseCoords = null, currentMoveAction = null, insertNodeMsg = null, newTransitionMsg = null, stateOverlay = null, transitionOverlay = null, frameModifiedSVG = false;

        function cancelMsg() {
            if (insertNodeMsg) {
                insertNodeMsg.close();
                insertNodeMsg = null;
            }

            if (newTransitionMsg) {
                newTransitionMsg.close();
                newTransitionMsg = null;
            }
        }

        function msg(o, tip) {
            cancelMsg();
            var res = AudeDesigner.msg(o);
            res.addButton(_("Cancel"), cancelMsg);
            return res;
        }

        function pathEditEllipseMoveFrame() {
            if (!mouseCoords) {
                return;
            }

            requestAnimationFrame(currentMoveAction);

            var e = mouseCoords;

            var pt = svgcursorPoint(that.svgNode, e);
            var seg = pointOnEllipse(nodeMoving._ellipse, pt.x, pt.y, nodeMoving._seg[0].getItem(nodeMoving._seg[1]), nodeMoving._seg[1] ? 10 : 0);
            nodeMoving.setAttribute("cx", seg.x);
            nodeMoving.setAttribute("cy", seg.y);
            if (nodeMoving._arrow) {
                posTriangleArrow(that.svgNode, nodeMoving._arrow.points, nodeMoving._ellipse, seg);
            }

            frameModifiedSVG = true;
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

        function pathEditSolidMoveFrame() {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            var segMove = nodeMoving._seg[0].getItem(nodeMoving._seg[1]);
            var origSegStart = nodeMoving._seg[2].getItem(0);
            var origSegEnd   = nodeMoving._seg[2].getItem(nodeMoving._seg[1]);

            var dx = (e.clientX - coords.x) / that.svgZoom,
                dy = (e.clientY - coords.y) / that.svgZoom;

            movePoints(origSegStart, origSegEnd, nodeMoving._seg[0], nodeMoving._seg[2], 1, nodeMoving._seg[1], dx, dy);
            origSegStart = nodeMoving._seg[2].getItem(nodeMoving._seg[2].numberOfItems - 1);
            movePoints(origSegStart, origSegEnd, nodeMoving._seg[0], nodeMoving._seg[2], nodeMoving._seg[1] + 1, nodeMoving._seg[0].numberOfItems - 1, dx, dy);
            nodeMoving.setAttribute("cx", segMove.x);
            nodeMoving.setAttribute("cy", segMove.y);
            nodeMoving._seg[3] && fixTransition(nodeMoving._seg[3]);
            frameModifiedSVG = true;
        }

        function pathEditControlMoveFrame() {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            var pt = svgcursorPoint(that.svgNode, e);
            nodeMoving.setAttribute("cx", nodeMoving._seg[0][nodeMoving._seg[1]] = pt.x);
            nodeMoving.setAttribute("cy", nodeMoving._seg[0][nodeMoving._seg[2]] = pt.y);
            nodeMoving._seg[3] && fixTransition(nodeMoving._seg[3]);
            fixPathEditor();
            frameModifiedSVG = true;
        }

        // move the visible area
        function viewBoxMoveFrame(e) {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            e = mouseCoords;

            var c = coords;

            that.blockNewState = true;

            that.svgNode.viewBox.baseVal.x = c.viewBoxX - (e.clientX - c.x) / that.svgZoom;
            that.svgNode.viewBox.baseVal.y = c.viewBoxY - (e.clientY - c.y) / that.svgZoom;
            frameModifiedSVG = true;
        }

        function isTransitionStraight(edge) {
            var tid = id(edge).split(" ");

            var errorMargin = 1,
                path        = edge.getElementsByTagName("path")[0].pathSegList,
                state1      = byId(that.svgNode, tid[0]).querySelector("ellipse"),
                state2      = byId(that.svgNode, tid[1]).querySelector("ellipse"),
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
            var label        = node.getElementsByTagName("text")[0];

            if (bigEllipse !== smallEllipse) {
                var smallBBox = smallEllipse.getBBox();

                bigEllipse.setAttribute("rx", 4 + smallBBox.width  / 2);
                bigEllipse.setAttribute("ry", 4 + smallBBox.height / 2);
                bigEllipse.setAttribute("cx", smallEllipse.getAttribute("cx"));
                bigEllipse.setAttribute("cy", smallEllipse.getAttribute("cy"));
            }

            var bcr = label.getBoundingClientRect();

            label.setAttribute("x", smallEllipse.cx.baseVal.value);
            label.setAttribute("y", smallEllipse.cy.baseVal.value + 4);

            if (node === that.initialState) {
                that.setInitialState(node);
            }
        }

        function fixTransition(path, text) {
            var segs = path.pathSegList;

            var origEllipse = getBigEllipse(
                byId(that.svgNode, id(path.parentNode).split(" ")[0])
            );

            var targetEllipse = getBigEllipse(
                byId(that.svgNode, id(path.parentNode).split(" ")[1])
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
                that.svgNode,
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
            resizeHandlesOn(that.resizeHandledElement);

            fixNode(node);

            var path, text, n = nodeMovingData;

            for (var i = 0, len = n.t.length; i < len; ++i) {
                path = coords.t[i][0][0].getElementsByTagName("path")[0];
                text = coords.t[i][0][0].getElementsByTagName("text")[0];
                fixTransition(path, text);
            }
        }

        function nodeResizeFrame() {
            if (!mouseCoords) {
                return;
            }

            var e = mouseCoords;

            requestAnimationFrame(currentMoveAction);

            if (e === true || that.stopMoveNode) {
                return;
            }

            mouseCoords = true;

            var dx = (e.clientX - coords.x) / that.svgZoom,
                dy = (e.clientY - coords.y) / that.svgZoom;

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
            frameModifiedSVG = true;
        }

        function nodeMoveFrame() {
            if (!mouseCoords) {
                return;
            }

            var e = mouseCoords;

            requestAnimationFrame(currentMoveAction);

            if (e === true || that.stopMoveNode) {
                return;
            }

            mouseCoords = true;


            var dx = (e.clientX - coords.x) / that.svgZoom,
                dy = (e.clientY - coords.y) / that.svgZoom;

            coords.text.setAttribute("x", coords.tx + dx);
            coords.text.setAttribute("y", coords.ty + dy);
            coords.ellipse[0].setAttribute("cx", coords.cx + dx);
            coords.ellipse[0].setAttribute("cy", coords.cy + dy);
            if (coords.ellipse[1]) {
                coords.ellipse[1].setAttribute("cx", coords.cx1 + dx);
                coords.ellipse[1].setAttribute("cy", coords.cy1 + dy);
            }

            if (that.initialState === nodeMoving) {
                // moving the initial state arrow
                that.setInitialState(nodeMoving);
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
                nodes         = id(coords.t[i][0][0]).split(" ");
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
                            that.svgNode,
                            path,
                            polygonPoints,
                            null,
                            byId(that.svgNode, nodes[0]),
                            byId(that.svgNode, nodes[1])
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

            frameModifiedSVG = true;
        }

        function mouseMove(e) {
            if (origMouseCoords) {
                var dx = Math.abs(origMouseCoords.clientX - e.clientX),
                    dy = Math.abs(origMouseCoords.clientY - e.clientY);

                if (Math.sqrt(dx * dx + dy * dy) > MOVE_BEFORE_BLOCK_OVERLAY) {
                    mouseCoords = e;
                    stopOverlay = true;
                    origMouseCoords = null;
                }
            } else {
                mouseCoords = e;
            }
        }

        function cancelMoveAction() {
            that.svgContainer.onmousemove = null;
            currentMoveAction             = null;
            mouseCoords                   = null;
        }

        function setMoveAction(frameFunction, e) {
            that.svgContainer.onmousemove = mouseMove;
            currentMoveAction = frameFunction;
            mouseCoords = e;
            requestAnimationFrame(currentMoveAction);
        }

        function prepareNodeMove(nodeMoving, e) {
            that.stopMove = true;
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
            var i, len, n = that.nodeList[libD.b64DecodeUnicode(id(nodeMoving))];

            nodeMovingData = n;

            for (i = 0, len = n.t.length; i < len; ++i) {
                coords.t[i] = [n.t[i], n.t[i][0].cloneNode(true)];
                coords.t[i].transitionStraight = isTransitionStraight(n.t[i][0]);
            }
        }

        function beginNodeResizing(nodeMoving, e) {
            prepareNodeMove(nodeMoving, e);

            var bbox = that.resizeHandledElement.getBBox();
            var node = parentWithClass(that.resizeHandledElement, "node");

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
            origMouseCoords = e;
            prepareNodeMove(nodeMoving, e);
            that.svgContainer.style.cursor = "move";
            setMoveAction(nodeMoveFrame, e);
        }

        // move event when two nodes must be bound (the transition is following the cursor)
        function nodeBindingFrame() {
            if (!mouseCoords) {
                return;
            }

            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            that.blockNewState = false;
            var pt = svgcursorPoint(that.svgNode, e);
            var p = pathEdit.pathSegList.getItem(1);
            var po = pathEdit.pathSegList.getItem(0);
            p.x = p.x2 = pt.x - (p.x - po.x > 0 ? 1 : -1);
            p.y = p.y2 = pt.y - (p.y - po.y > 0 ? 1 : -1);
            pointOnEllipse(getBigEllipse(nodeEdit), p.x, p.y, po);
            p.x1 = po.x;
            p.y1 = po.y;
            frameModifiedSVG = true;
        }

        function beginNewTransition(startState, e) {
            that.stopMove = true;
            nodeEdit = startState;
            setMoveAction(nodeBindingFrame, e);

            pathEdit = document.createElementNS(svgNS, "path");
            pathEdit.setAttribute("fill", "none");
            pathEdit.setAttribute("stroke", "black");

            var ellipse = getBigEllipse(startState);
            var pt = svgcursorPoint(that.svgNode, e), p = pointOnEllipse(ellipse, pt.x, pt.y);
            pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegMovetoAbs(p.x, p.y));
            pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegCurvetoCubicAbs(pt.x, pt.y, p.x, p.y, pt.x, pt.y));
            that.svgNode.appendChild(pathEdit);
        }

        function endNewTransition(endState) {
            that.stopMove = true;
            var nid = id(nodeEdit) + " " + id(endState);
            if (byId(that.svgNode, nid)) {
                window.alert(_("Sorry, there is already a transition between these states in this way."));
                that.svgNode.removeChild(pathEdit);
                cancelMoveAction();
                return;
            }

            cancelMoveAction();

            AudeDesigner.prompt(
                _("New transition"),
                _("Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes.  Epsilons are written '\\e' or 'ɛ' (without quotes)."),
                "",
                function (trans) {
                    if (trans === null) {
                        pathEdit.parentNode.removeChild(pathEdit);
                    } else {
                        var g = document.createElementNS(svgNS, "g");
                        id(g, nid);
                        g.setAttribute("class", "edge");
                        var title = document.createElementNS(svgNS, "title");
                        title.textContent = toBrokenGraphvizTitle(libD.b64DecodeUnicode(id(nodeEdit))) + "->" + toBrokenGraphvizTitle(libD.b64DecodeUnicode(id(endState)));
                        g.appendChild(title);

                        var polygon = document.createElementNS(svgNS, "polygon");

                        polygon.setAttribute("fill", "black");
                        polygon.setAttribute("stroke", "black");

                        var text = document.createElementNS(svgNS, "text");
                        text.textContent = AudeDesigner.formatTrans(trans || "\\e");
                        text.setAttribute("text-anchor", "middle");
                        text.setAttribute("font-family", "Times Roman,serif");
                        text.setAttribute("font-size", "14.00");
                        cleanTransitionPos(that.svgNode, pathEdit, polygon.points, text, nodeEdit, endState);
                        g.appendChild(pathEdit);
                        g.appendChild(polygon);
                        g.appendChild(text);
                        that.svgNode.querySelector("g").appendChild(g);
                        that.nodeList[libD.b64DecodeUnicode(id(endState))].t.push([g, false]); // false : state is not origin
                        if (nodeEdit !== endState) {
                            that.nodeList[libD.b64DecodeUnicode(id(nodeEdit))].t.push([g, true]); // true : state is origin
                        }

                        that.snapshot();
                    }
                }
            );
        }

        function transitionStraight(edge) {
            var tid = id(edge).split(" ");

            cleanTransitionPos(
                that.svgNode,
                edge.getElementsByTagName("path")[0],
                edge.querySelector("polygon").points,
                edge.getElementsByTagName("text")[0],
                byId(that.svgNode, tid[0]),
                byId(that.svgNode, tid[1])
            );

            fixPathEditor();
            that.snapshot();
        }

        // event when a transition label is moved
        function labelMoveFrame() {
            if (!mouseCoords) {
                return;
            }
            requestAnimationFrame(currentMoveAction);
            var e = mouseCoords;

            nodeMoving.setAttribute("x", (e.clientX - coords[0]) / that.svgZoom + coords[2]);
            nodeMoving.setAttribute("y", (e.clientY - coords[1]) / that.svgZoom + coords[3]);
            frameModifiedSVG = true;
        }

        function beginMoveTransitionLabel(text, e) {
            that.stopMove = true;
            origMouseCoords = e;
            nodeMoving = text;
            coords = [e.clientX, e.clientY, e.target.x.baseVal.getItem(0).value, e.target.y.baseVal.getItem(0).value];
            setMoveAction(labelMoveFrame, e);
            that.svgContainer.cursor = "move";
        }

        function fixPathEditor(appending) {
            if (!appending && (!that.pathEditor || that.pathEditor !== document.getElementById("path-editor"))) {
                var pathEditorLocal = document.getElementById("path-editor");
                if (pathEditorLocal) {
                    pathEditorLocal.parentNode.removeChild(pathEditorLocal);
                }

                that.pathEditor = null;
                return;
            }

            var p = that.pathEditor._path;

            var segs = p.pathSegList;
            var tid = id(p.parentNode).split(" ");

            while (that.pathEditor.firstChild) {
                that.pathEditor.removeChild(that.pathEditor.firstChild);
            }
            var handle, seg, i, len;
            for (i = 0, len = segs.numberOfItems; i < len; ++i) {
                seg = segs.getItem(i);
                if (seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                    if (seg.x1 !== segs.getItem(i - 1).x || seg.y1 !== segs.getItem(i - 1).y) {
                        handle = document.createElementNS(svgNS, "circle");
                        handle.setAttribute("class", "pathedit-handle");
                        handle.setAttribute("r", TRANSITION_HANDLE_WIDTH);
                        handle.setAttribute("fill", "#F50");
                        handle.setAttribute("stroke", "black");
                        handle._moveFrame = pathEditControlMoveFrame;
                        handle.setAttribute("cx", seg.x1);
                        handle.setAttribute("cy", seg.y1);
                        handle._seg = [seg, "x1", "y1", p];
                        that.pathEditor.appendChild(handle);
                    }
                    if (seg.x2 !== seg.x || seg.y2 !== seg.y) {
                        handle = document.createElementNS(svgNS, "circle");
                        handle.setAttribute("class", "pathedit-handle");
                        handle.setAttribute("r", TRANSITION_HANDLE_WIDTH);
                        handle.setAttribute("fill", "#F50");
                        handle.setAttribute("stroke", "black");
                        handle._moveFrame = pathEditControlMoveFrame;
                        handle.setAttribute("cx", seg.x2);
                        handle.setAttribute("cy", seg.y2);
                        handle._seg = [seg, "x2", "y2", p];
                        that.pathEditor.appendChild(handle);
                    }
                }

                handle = document.createElementNS(svgNS, "circle");
                handle.setAttribute("class", "pathedit-handle");
                handle.setAttribute("cx", seg.x);
                handle.setAttribute("cy", seg.y);
                handle.setAttribute("r", TRANSITION_HANDLE_WIDTH);
                if (i === len - 1) {
                    handle._moveFrame = pathEditEllipseMoveFrame;
                    handle._ellipse   = getBigEllipse(byId(that.svgNode, tid[1]));
                    handle._arrow     = p.parentNode.querySelector("polygon");
                } else if (!i) {
                    handle._moveFrame = pathEditEllipseMoveFrame;
                    handle._ellipse   = getBigEllipse(byId(that.svgNode, tid[0]));
                } else {
                    handle._moveFrame = pathEditSolidMoveFrame;
                }

                handle._seg = [segs, i, p.cloneNode(false).pathSegList];

                handle.setAttribute("fill", "#4AF");
                handle.setAttribute("stroke", "black");
                that.pathEditor.appendChild(handle);
            }
        }

        function beginNewTransitionEdit(nodeMoving) {
            if (!that.pathEditor) {
                that.pathEditor = document.createElementNS(svgNS, "g");
            }

            that.pathEditor.setAttribute("data-id", "path-editor");
            that.pathEditor._path = nodeMoving.getElementsByTagName("path")[0];
            fixPathEditor(true);
            that.svgNode.appendChild(that.pathEditor);
        }

        function endNewTransitionEdit() {
            if (that.pathEditor) {
                that.svgNode.removeChild(that.pathEditor);
                that.pathEditor = null;
            }
        }

        function beginViewBoxMove(e) {
            coords = {
                viewBoxX: that.svgNode.viewBox.baseVal.x,
                viewBoxY: that.svgNode.viewBox.baseVal.y,
                x:        e.clientX,
                y:        e.clientY
            };

            setMoveAction(viewBoxMoveFrame, e);
        }

        function toggleAccepting(nodeMoving) {
            var ellipses = nodeMoving.querySelectorAll("ellipse"),
                tl       = that.nodeList[libD.b64DecodeUnicode(id(nodeMoving))].t,
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

                fill(ellipse, "none");
                nodeMoving.insertBefore(ellipse, ellipses[0].nextSibling);
            }

            fixNode(nodeMoving);

            for (t = 0, len = tl.length; t < len; ++t) {
                tid = id(tl[t][0]).split(" ");

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

            that.snapshot();
        }

        // delete the transition tNode
        // if tstate is given, dont handle the state which tid is <tstate>
        function deleteTransition(tNode, tstate) {
            var j, k, n, len;
            for (j in that.nodeList) {
                if (j !== tstate) {
                    for (k = 0, n = that.nodeList[j], len = n.t.length; k < len; ++k) {
                        if (n.t[k][0] === tNode) {
                            n.t.splice(k, 1);
                            --len;
                        }
                    }
                }
            }

            tNode.parentNode.removeChild(tNode);

            that.snapshot();
        }

        function removeNode(node) {
            if (node === that.initialState) {
                that.initialStateArrow.parentNode.removeChild(that.initialStateArrow);
                that.initialState = that.initialStates[that.currentIndex] = that.initialStateArrows[that.currentIndex] = that.initialStateArrow = null;
            }

            var tid = libD.b64DecodeUnicode(id(node)), n = that.nodeList[tid], i, len;

            for (i = 0, len = n.t.length; i < len; ++i) {
                deleteTransition(n.t[i][0], tid);
            }

            delete that.nodeList[tid];
            node.parentNode.removeChild(node);

            that.snapshot();
        }

        function editNodeName(node) {
            var text = node.getElementsByTagName("text")[0];
            AudeDesigner.prompt(
                _("Name of the state"),
                _("Which name do you want for the state?"),
                text.textContent,
                function (t) {
                    if (t) {
                        t = AudeDesigner.standardizeStringValueFunction(t);
                        var tb = libD.b64EncodeUnicode(t);
                        var existingNode = byId(that.svgNode, tb);

                        if (existingNode) {
                            if (node !== existingNode) {
                                window.alert(_("Sorry, but a state is already named like this."));
                            }
                        } else {
                            var oldid = libD.b64DecodeUnicode(id(node)),
                                n     = that.nodeList[oldid],
                                tid,
                                len,
                                i;

                            for (i = 0, len = n.t.length; i < len; ++i) {
                                tid = id(n.t[i][0]).split(" ");

                                if (tid[0] === tid[1]) {
                                    id(n.t[i][0], tb + " " + tb);
                                    n.t[i][0].querySelector("title").textContent = toBrokenGraphvizTitle(t) + "->" + toBrokenGraphvizTitle(t);
                                } else if (n.t[i][1]) {// if node is origin
                                    id(n.t[i][0], tb + " " + tid[1]);
                                    n.t[i][0].querySelector("title").textContent = toBrokenGraphvizTitle(t) + "->" + toBrokenGraphvizTitle(libD.b64DecodeUnicode(tid[1]));
                                } else {
                                    id(n.t[i][0], tid[0] + " " + tb);
                                    n.t[i][0].querySelector("title").textContent = toBrokenGraphvizTitle(libD.b64DecodeUnicode(tid[0])) + "->" + toBrokenGraphvizTitle(t);
                                }
                            }

                            that.nodeList[t] = that.nodeList[oldid];
                            delete that.nodeList[oldid];
                            node.querySelector("title").textContent = toBrokenGraphvizTitle(text.textContent = t);
                            id(node, tb);

                            var ellipse = getSmallEllipse(node);
                            var minWidth = text.getBBox().width + 28;

                            if (ellipse.getBBox().width < minWidth) {
                                ellipse.setAttribute("rx", minWidth / 2);
                            }

                            // FIXME terrible hack to "repair" the node after resize
                            prepareNodeMove(node, {});
                            fixNodeAndTransition(node);
                            that.snapshot();
                        }
                    }
                }
            );
        }

        function editTransitionSymbols(edge) {
            var text = edge.getElementsByTagName("text")[0];
            AudeDesigner.prompt(
                _("Transitions' symbols"),
                _("Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes."),
                text.textContent,
                function (t) {
                    if (t !== null) {
                        text.textContent = AudeDesigner.formatTrans(t || "\\e");
                        that.snapshot();
                    }
                }
            );
        }

        function createNode(e) {
            var g = document.createElementNS(svgNS, "g");
            g.setAttribute("class", "node");
            var nid = 0;

            while (nid in that.nodeList) {
                ++nid;
            }

            id(g, libD.b64EncodeUnicode(nid));
            var title = document.createElementNS(svgNS, "title");
            title.textContent = toBrokenGraphvizTitle(nid);
            var ellipse = document.createElementNS(svgNS, "ellipse");

            var pt = svgcursorPoint(that.svgNode, e);
            var ry = 18.3848;
            var cy = pt.y;
            fill(ellipse, "none");
            ellipse.setAttribute("stroke", "black");
            ellipse.setAttribute("rx", 17.8879);
            ellipse.setAttribute("ry", ry);
            ellipse.setAttribute("cx", pt.x);
            ellipse.setAttribute("cy", cy);
            var text = document.createElementNS(svgNS, "text");
            text.textContent = nid;
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-family", "Times Roman, serif");
            text.setAttribute("font-size", "14.00");
            text.setAttribute("x", pt.x);
            text.setAttribute("y", cy + 4);
            g.appendChild(title);
            g.appendChild(ellipse);
            g.appendChild(text);
            that.svgNode.querySelector("g").appendChild(g);

            if (!that.initialState) {
                that.setInitialState(g);
            }

            that.nodeList[nid] = {
                t: []
            };

            return g;
        }

        // checks if the node or one of its parent has class c. Specific to the AutomatonAudeDesigner.
        function parentWithClass(node, c) {
            do {
                if (node.classList.contains(c)) {
                    return node;
                }
                node = node.parentNode;
            } while (node && node.classList && node !== that.svgContainer);
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
        that.svgContainer.addEventListener("mousedown", function (e) {
            that.blockNewState = true;
            if (blockClick) {
                return;
            }
            blockClick = true;
            if (!e.button) { // left button
                if (insertNodeMsg) {
                    createNode(e);
                    insertNodeMsg.close();
                    insertNodeMsg = null;
                }

                nodeMoving = parentWithClass(e.target, "pathedit-handle");
                if (nodeMoving) {
                    that.overlayHide();

                    // handle path editing
                    coords = {
                        x: e.clientX,
                        y: e.clientY
                    };

                    that.stopMove = true;
                    setMoveAction(nodeMoving._moveFrame, e);
                } else if (e.target.classList.contains(CSSP + "resize-handle")) {
                    that.overlayHide();
                    beginNodeResizing(parentWithClass(that.resizeHandledElement, "node"), e);
                } else if (!parentWithClass(e.target, CSSP + "overlay")) {
                    var cso = that.currentOverlay;
                    that.cleanSVG(that.currentIndex, true);

                    if ( (nodeMoving = parentWithClass(e.target, "node")) ) {
                        if (newTransitionMsg) {
                            beginNewTransition(newTransitionMsg.beginState, e);
                            newTransitionMsg.close();
                            newTransitionMsg = null;
                        } else if (currentMoveAction === nodeBindingFrame) {
                            setTimeout(
                                endNewTransition.bind(null, nodeMoving),
                                0
                            ); // setTimeout: workaround to get focus
                            stopOverlay = true;
                        } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                            that.stopMove = true;
                            removeNode(nodeMoving);
                            that.snapshot();
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
                            that.snapshot();
                        } else {
                            beginNewTransitionEdit(nodeMoving);
                            if (e.target.nodeName === "text") {
                                beginMoveTransitionLabel(e.target, e);
                            }
                        }
                    } else if (!currentMoveAction) {
                        that.blockNewState = false;
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
                                that.setInitialState(nodeMoving);
                                that.snapshot();
                            } else {
                                toggleAccepting(nodeMoving);
                                that.snapshot();
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
                        frameModifiedSVG = false; // block snapshot
                    }
                }
            } else if (currentMoveAction !== nodeResizeFrame) {
                that.resizeHandlesHide();

                node = parentWithClass(e.target, "edge");
                if (node) {
                    if (stopOverlay) {
                        stopOverlay = false;
                    } else {
                        frameModifiedSVG = false; // block snapshot
                        overlayOn(node);
                    }
                } else {
                    that.overlayHide();
                }
            }

            that.svgContainer.style.cursor = "";
            cancelMoveAction();

            if (frameModifiedSVG) {
                that.snapshot();
                frameModifiedSVG = false;
            }
        }

        that.svgContainer.addEventListener("mouseup", function (e) {
            blockClick = false;

            if (parentWithClass(e.target, CSSP + "overlay")) {
                return;
            }

            if (currentMoveAction === nodeBindingFrame) {
                if (!that.blockNewState && (nodeMoving = parentWithClass(e.target, "node"))) {
                    endNewTransition(nodeMoving);
                    stopOverlay = false;
                }
            } else {
                nodeMouseUp(e);

                if (that.pathEditor) {
                    fixPathEditor();
                }
            }
        }, false);

        function makeResizeHandle() {
            var rect = document.createElementNS(svgNS, "rect");
            that.resizeHandle = {
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

            that.resizeHandle.g.appendChild(that.resizeHandle.rect);
            that.resizeHandle.g.appendChild(that.resizeHandle.topLeft);
            that.resizeHandle.g.appendChild(that.resizeHandle.top);
            that.resizeHandle.g.appendChild(that.resizeHandle.topRight);
            that.resizeHandle.g.appendChild(that.resizeHandle.bottomLeft);
            that.resizeHandle.g.appendChild(that.resizeHandle.bottom);
            that.resizeHandle.g.appendChild(that.resizeHandle.bottomRight);
            that.resizeHandle.g.appendChild(that.resizeHandle.left);
            that.resizeHandle.g.appendChild(that.resizeHandle.right);
            that.resizeHandle.g.setAttribute("class", "resize-handle");

            that.resizeHandle.topLeft.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.top.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.topRight.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.bottomLeft.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.bottom.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.bottomRight.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.left.setAttribute("width", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.right.setAttribute("width", RESIZE_HANDLE_WIDTH);

            that.resizeHandle.topLeft.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.top.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.topRight.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.bottomLeft.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.bottom.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.bottomRight.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.left.setAttribute("height", RESIZE_HANDLE_WIDTH);
            that.resizeHandle.right.setAttribute("height", RESIZE_HANDLE_WIDTH);


            that.resizeHandle.topLeft.classList.add(CSSP + "resize-handle");
            that.resizeHandle.top.classList.add(CSSP + "resize-handle");
            that.resizeHandle.topRight.classList.add(CSSP + "resize-handle");
            that.resizeHandle.bottomLeft.classList.add(CSSP + "resize-handle");
            that.resizeHandle.bottom.classList.add(CSSP + "resize-handle");
            that.resizeHandle.bottomRight.classList.add(CSSP + "resize-handle");
            that.resizeHandle.left.classList.add(CSSP + "resize-handle");
            that.resizeHandle.right.classList.add(CSSP + "resize-handle");

            that.resizeHandle.topLeft.classList.add(CSSP + "resize-top-left");
            that.resizeHandle.top.classList.add(CSSP + "resize-top");
            that.resizeHandle.topRight.classList.add(CSSP + "resize-top-right");
            that.resizeHandle.bottomLeft.classList.add(CSSP + "resize-bottom-left");
            that.resizeHandle.bottom.classList.add(CSSP + "resize-bottom");
            that.resizeHandle.bottomRight.classList.add(CSSP + "resize-bottom-right");
            that.resizeHandle.left.classList.add(CSSP + "resize-left");
            that.resizeHandle.right.classList.add(CSSP + "resize-right");


            that.resizeHandle.topLeft.style.cursor = "nw-resize";
            that.resizeHandle.top.style.cursor = "n-resize";
            that.resizeHandle.topRight.style.cursor = "ne-resize";
            that.resizeHandle.bottomLeft.style.cursor = "sw-resize";
            that.resizeHandle.bottom.style.cursor = "s-resize";
            that.resizeHandle.bottomRight.style.cursor = "se-resize";
            that.resizeHandle.left.style.cursor = "w-resize";
            that.resizeHandle.right.style.cursor = "e-resize";

            that.resizeHandle.rect.classList.add(CSSP + "resize-handle-rect");
        }

        function makeStateOverlay() {
            stateOverlay = document.createElement("ul");
            stateOverlay.classList.add(CSSP + "overlay");

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Toggle accepting");

            stateOverlay.lastChild.lastChild.onclick = function () {
                toggleAccepting(that.currentOverlay);
                that.overlayHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Rename");

            stateOverlay.lastChild.lastChild.onclick = function () {
                editNodeName(that.currentOverlay);
                that.overlayHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Make initial");

            stateOverlay.lastChild.lastChild.onclick = function () {
                that.setInitialState(that.currentOverlay);
                that.overlayHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("Delete");

            stateOverlay.lastChild.lastChild.onclick = function () {
                removeNode(that.currentOverlay);
                that.overlayHide();
                that.resizeHandlesHide();
            };

            stateOverlay.appendChild(document.createElement("li"));
            stateOverlay.lastChild.appendChild(document.createElement("a"));
            stateOverlay.lastChild.lastChild.href = "#";
            stateOverlay.lastChild.lastChild.textContent = _("New transition");

            stateOverlay.lastChild.lastChild.onclick = function (e) {
                newTransitionMsg = msg({
                    title: _("New transition"),
                    content: _("Click on the destination state of the new transition."),
                });
                newTransitionMsg.beginState = that.currentOverlay;
                that.overlayHide();
            };

            transitionOverlay = document.createElement("ul");
            transitionOverlay.classList.add(CSSP + "overlay");

            transitionOverlay.appendChild(document.createElement("li"));
            transitionOverlay.lastChild.appendChild(document.createElement("a"));
            transitionOverlay.lastChild.lastChild.href = "#";
            transitionOverlay.lastChild.lastChild.textContent = _("Modify symbols");

            transitionOverlay.lastChild.lastChild.onclick = function () {
                editTransitionSymbols(that.currentOverlay);
                that.overlayHide();
            };

            transitionOverlay.appendChild(document.createElement("li"));
            transitionOverlay.lastChild.appendChild(document.createElement("a"));
            transitionOverlay.lastChild.lastChild.href = "#";
            transitionOverlay.lastChild.lastChild.textContent = _("Make straight");

            transitionOverlay.lastChild.lastChild.onclick = function () {
                transitionStraight(that.currentOverlay);
                that.overlayHide();
            };
            transitionOverlay.appendChild(document.createElement("li"));
            transitionOverlay.lastChild.appendChild(document.createElement("a"));
            transitionOverlay.lastChild.lastChild.href = "#";
            transitionOverlay.lastChild.lastChild.textContent = _("Delete");

            transitionOverlay.lastChild.lastChild.onclick = function () {
                deleteTransition(that.currentOverlay);
                endNewTransitionEdit();
                that.overlayHide();
            };
        }

        function setOverlayOn(node) {
            that.currentOverlay = node;

            var elem;

            if (node.classList.contains("edge")) {
                elem = node.getElementsByTagName("text")[0];
                that.overlay = transitionOverlay;
            } else {
                elem = node;
                that.overlay = stateOverlay;
            }

            var bcr = elem.getBoundingClientRect();
            var parentBcr = that.svgNode.parentNode.getBoundingClientRect();
            var x = bcr.left - parentBcr.left;
            var y = bcr.top - parentBcr.top;

            if (bcr.left < parentBcr.width - bcr.right) {
                that.overlay.style.left = Math.max(0, x) + "px";
                that.overlay.style.right = "";
            } else {
                that.overlay.style.right = Math.max(0, parentBcr.width - x - bcr.width) + "px";
                that.overlay.style.left = "";
            }

            if (bcr.top < parentBcr.height - bcr.bottom) {
                that.overlay.style.top  = Math.max(0, OVERLAY_TOP_OFFSET + bcr.height + y + RESIZE_HANDLE_WIDTH * that.svgZoom) + "px";
                that.overlay.style.bottom = "";
            } else {
                that.overlay.style.bottom = Math.max(0, parentBcr.height - y + RESIZE_HANDLE_WIDTH * that.svgZoom + OVERLAY_TOP_OFFSET) + "px";
                that.overlay.style.top = "";
            }

            that.svgNode.parentNode.appendChild(that.overlay);
        }

        function overlayOn(node) {
            if (!that.overlay) {
                makeStateOverlay();
            }

            setOverlayOn(node);
        }

        function resizeHandlesOn(ele) {
            if (!ele) {
                return;
            }

            var r = ele.getBBox();

            r = {
                left:   r.x,
                top:    r.y,
                right:  r.x + r.width,
                bottom: r.y + r.height,
                width:  r.width,
                height: r.height
            };


            that.resizeHandle.rect.setAttribute("x",        r.left);
            that.resizeHandle.left.setAttribute("x",        r.left - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.topLeft.setAttribute("x",     r.left - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.bottomLeft.setAttribute("x",  r.left - (RESIZE_HANDLE_WIDTH / 2));

            that.resizeHandle.rect.setAttribute("width",    r.width);
            that.resizeHandle.right.setAttribute("x",       r.right - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.topRight.setAttribute("x",    r.right - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.bottomRight.setAttribute("x", r.right - (RESIZE_HANDLE_WIDTH / 2));

            that.resizeHandle.rect.setAttribute("y",        r.top);
            that.resizeHandle.top.setAttribute("y",         r.top - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.topLeft.setAttribute("y",     r.top - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.topRight.setAttribute("y",    r.top - (RESIZE_HANDLE_WIDTH / 2));

            that.resizeHandle.rect.setAttribute("height",   r.height);
            that.resizeHandle.bottom.setAttribute("y",      r.bottom - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.bottomLeft.setAttribute("y",  r.bottom - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.bottomRight.setAttribute("y", r.bottom - (RESIZE_HANDLE_WIDTH / 2));

            that.resizeHandle.bottom.setAttribute("x",      r.left + r.width  / 2 - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.top.setAttribute("x",         r.left + r.width  / 2 - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.left.setAttribute("y",        r.top  + r.height / 2 - (RESIZE_HANDLE_WIDTH / 2));
            that.resizeHandle.right.setAttribute("y",       r.top  + r.height / 2 - (RESIZE_HANDLE_WIDTH / 2));

            if (that.resizeHandledElement !== ele) {

                if (that.resizeHandledElement) {
                    that.resizeHandledElement.classList.remove(CSSP + "resize-handled");
                }

                that.resizeHandledElement = ele;
                ele.classList.add(CSSP + "resize-handled");

                that.svgNode.appendChild(that.resizeHandle.g);
            }
        }

        function stateResizeHandlesOn(state) {
            if (!that.resizeHandle) {
                makeResizeHandle();
            }

            resizeHandlesOn(getBigEllipse(state));
        }

        that.svgContainer.addEventListener("dblclick", function (e) {
            if ( (nodeEdit = parentWithClass(e.target, "node")) ) {
                if (!(e.button || e.shiftKey || e.ctrlKey || e.metaKey)) {
                    editNodeName(nodeEdit);
                }
            } else if ( (nodeEdit = parentWithClass(e.target, "edge")) ) {
                if (!(e.ctrlKey || e.metaKey || e.shiftKey)) { // delete transition
                    editTransitionSymbols(nodeEdit);
                }
            } else if (!(e.button || that.blockNewState || e.ctrlKey || e.metaKey || e.shiftKey)) {
                createNode(e);
                that.snapshot();
            }
        }, false);

        window.addEventListener("keydown", function (e) {
            if (e.keyCode === 27) {
                if (currentMoveAction === nodeBindingFrame) {
                    pathEdit.parentNode.removeChild(pathEdit);
                    cancelMoveAction();
                }

                if (insertNodeMsg) {
                    insertNodeMsg.close();
                    insertNodeMsg = null;
                }

                if (newTransitionMsg) {
                    newTransitionMsg.close();
                    newTransitionMsg = null;
                }
            }
        }, false);
    };


    AudeDesigner.prototype.newZoom = function (zoom, x, y) {
        if (!zoom) {
            this.svgZoom = 0.1;
            return;
        }

        this.svgZoom = zoom;
        this.setViewBoxSize();

        if (!isNaN(x)) {
            this.svgNode.viewBox.baseVal.x = x - (x - this.svgNode.viewBox.baseVal.x) * this.oldZoom / this.svgZoom;
            this.svgNode.viewBox.baseVal.y = y - (y - this.svgNode.viewBox.baseVal.y) * this.oldZoom / this.svgZoom;
        }
    }

    AudeDesigner.prototype.autoCenterZoom = function () {
        var wantedRatio = 0.8;
        var states = this.svgNode.querySelectorAll(".node,path,polygon,text");

        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;

        var parentBcr = this.svgNode.getBoundingClientRect();

        for (var state, i = 0; i < states.length; i++) {
            state = states[i];

            var bcr = state.getBoundingClientRect();
            var x = bcr.left - parentBcr.left;
            var y = bcr.top - parentBcr.top;

            if (x < minX) {
                minX = x;
            }

            if (y < minY) {
                minY = y;
            }

            x += bcr.width;
            y += bcr.height;

            if (x > maxX) {
                maxX = x;
            }

            if (y > maxY) {
                maxY = y;
            }
        }

        if (
            minX ===  Infinity ||
            minY ===  Infinity ||
            maxY === -Infinity ||
            maxX === -Infinity
        ) {
            return;
        }

        var currentRatio = Math.max(
            (maxX - minX) / parentBcr.width,
            (maxY - minY) / parentBcr.height
        );

        var previousZoom = this.svgZoom;
        var factorRatio = (wantedRatio / currentRatio);
        var nz = Math.min(1, this.svgZoom * factorRatio);

        this.newZoom(nz);

        this.svgNode.viewBox.baseVal.x += (
            minX / previousZoom - (
                this.svgNode.viewBox.baseVal.width
                    -
                (maxX - minX) / previousZoom
            ) / 2
        );

        this.svgNode.viewBox.baseVal.y += (
            minY / previousZoom - (
                this.svgNode.viewBox.baseVal.height
                    -
                (maxY - minY) / previousZoom
            ) / 2
        );
    };

    AudeDesigner.prototype.disable = function () {
        this.disabled = true;
    };

    AudeDesigner.prototype.enable = function () {
        this.disabled = false;
    };

    AudeDesigner.prototype.userZoom = function () {
        var that = this;

        this.disabled = true;

        var initialZoom, lastDeltaX, lastDeltaY;

        listenMouseWheel(function (e, delta) {
            if (!that.svgNode || that.disabled) {
                return null;
            }

            var pt = svgcursorPoint(that.svgNode, e);
            that.oldZoom = that.svgZoom;
            that.newZoom(Math.round((that.svgZoom + delta * 0.1) * 10) / 10, pt.x, pt.y);

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
                if (that.disabled) {
                    return;
                }

                initialZoom = that.svgZoom;
                lastDeltaX = 0;
                lastDeltaY = 0;
            });

            window.Hammer(that.svgContainer).on("pinch", function (e) {
                if (that.disabled) {
                    return;
                }

                that.blockNewState = true;
                that.stopMove = true;
                that.stopMoveNode = true;

                that.oldZoom = that.svgZoom;
                var nz = initialZoom * e.gesture.scale;

                if (nz !== that.svgZoom) {
                    var pt = svgcursorPoint(that.svgNode, {
                        clientX: e.gesture.center.pageX,
                        clientY: e.gesture.center.pageY
                    });

                    that.newZoom(nz, pt.x, pt.y);
                }

                drag(e);
            });

            window.Hammer(that.svgContainer).on("drag", function (e) {
                if (that.disabled) {
                    return;
                }

                if (!that.stopMove) {
                    that.blockNewState = true;
                    drag(e);
                }
            });

            window.Hammer(that.svgContainer).on("release", function () {
                if (that.disabled) {
                    return;
                }

                that.stopMove = false;
                that.stopMoveNode = false;
            });
        }
    };

    AudeDesigner.prototype.stateSetBackgroundColor = function (index, state, color) {
        var s = this.svgs[index];

        if (s) {
            state = byId(s, libD.b64EncodeUnicode(AudeDesigner.getStringValueFunction(state)));
            if (state) {
                fill(getBigEllipse(state), color);
            }
        }
    };

    AudeDesigner.prototype.stateRemoveBackgroundColor = function (index, state) {
        this.stateSetBackgroundColor(index, state, "none");
    };

    AudeDesigner.prototype.transitionSetColor = function (index, startState, symbol, endState, color) {
        var s = this.svgs[index];
        startState = AudeDesigner.getStringValueFunction(startState);
        endState   = AudeDesigner.getStringValueFunction(endState);

        if (s) {
            var edge = byId(s, libD.b64EncodeUnicode(startState) + " " + libD.b64EncodeUnicode(endState));
            if (edge) {
                edge.getElementsByTagName("text")[0].setAttribute("fill", color);
                edge.querySelector("polygon").setAttribute("fill", color);
                edge.querySelector("polygon").setAttribute("stroke", color);
                edge.getElementsByTagName("path")[0].setAttribute("stroke", color);
            }
        }
    };

    AudeDesigner.prototype.transitionRemoveColor = function (index, startState, symbol, endState) {
        var s = this.svgs[index];

        if (s) {
            var edge = byId(s, libD.b64EncodeUnicode(startState) + " " + libD.b64EncodeUnicode(endState));

            if (edge) {
                edge.getElementsByTagName("text")[0].removeAttribute("fill");
                edge.querySelector("polygon").setAttribute("fill", "black");
                edge.querySelector("polygon").setAttribute("stroke", "black");
                edge.getElementsByTagName("path")[0].setAttribute("stroke", "black");
            }
        }
    };

    (function () {
        var fakeMsg = {close: function () {}, addButton : function () {}};
        AudeDesigner.msg = function () {
            return fakeMsg;
        };

        if (libD.need) {
            libD.need(["notify"], function () {
                AudeDesigner.msg = libD.notify;
            });
        }
    }());
}(this));
