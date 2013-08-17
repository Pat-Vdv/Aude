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

/*jslint browser: true, ass: true, continue: true, es5: false, forin: true, todo: true, vars: true, white: true, indent: 3 */
/*jshint noarg:true, noempty:true, eqeqeq:true, boss:true, bitwise:false, strict:true, undef:true, unused:true, curly:true, indent:3, maxerr:50, browser:true, es5:false, forin:false, onevar:false, white:false */

// NEEDS: automaton.js, mousewheel.js;

// TODO: move initial state's arrow.

(function(pkg, pkgGlue, that) {
   "use strict";
   var nodeList,                // list of the states' nodes of the currently designed automaton
       initialStateArrow,       // current initial state arrow node (<g>)
       pathEditor,              // <g> to edit paths and control points of these paths
       initialState,            // current automaton initial state's note (<g>)
       nodeLists          = [], // array containing all the automata's "nodeList"s
       initialStateArrows = [], // array containing all the automata's initial state's arrow
       initialStates      = [], // array containing all the automata's initial state's node
       svgs               = []; // will contain all currently opened automata

   var _ = pkg.AutomataDesignerl10n = that.libD && that.libD.l10n ? that.libD.l10n() : function(s){return s;};

   pkg.svgNode      = null;     // <svg> editor
   pkg.svgZoom      = 1;        // current zoom level
   pkg.currentIndex = 0;        // index of the currently designed automaton

   // set the automaton #<index>'s code
   pkg.setAutomatonCode = function(automaton, index) {
      var matches = automaton.match(/<representation type="image\/svg\+xml">([\s\S]+)<\/representation>/);
      if(matches) {
         pkg.setSVG(matches[1], index);
      }
      else {
         pkgGlue.requestSVG(index);
      }
   };

   // reset the automaton #<index>
   pkg.clearSVG = function (index) {
      pkg.setSVG('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> <g id="graph1" class="graph" transform="scale(1 1) rotate(0) translate(0 0)"> <title>automaton</title></g></svg>', index);
   };

   function fixBrokenGraphvizTitle(t) {
      return t.replace(/\\\\/g, "\\");
   }

   function toBrokenGraphvizTitle(t) {
      return t.toString().replace(/\\/g, "\\\\");
   }

   // set current automaton's SVG 
   pkg.setSVG = function (svg, index) {
      if(!svg) {
         return pkg.clearSVG(index);
      }

      var svgWorkingNode;
      if(index === pkg.currentIndex) {
         if(typeof svg === "string") {
            pkg.svgContainer.innerHTML = svg.replace(/<\?[\s\S]*\?>/g, '').replace(/<![^>]*>/g, '');
         }
         else {
            pkg.svgContainer.textContent = '';
            pkg.svgContainer.appendChild(svg.cloneNode(true));
         }

         svgWorkingNode = pkg.svgNode = svgs[index] = pkg.svgContainer.querySelector('svg');
      }
      else {
         svgWorkingNode = svgs[index] = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('svg');
      }

      svgWorkingNode.setAttribute('width',  pkg.svgContainer.offsetWidth);
      svgWorkingNode.setAttribute('height', pkg.svgContainer.offsetHeight);

      if(!svgWorkingNode.viewBox.baseVal) {
         svgWorkingNode.setAttribute('viewBox', '0 0 ' + pkg.svgContainer.offsetWidth + ' ' + pkg.svgContainer.offsetHeight);
      }

      var workingNodeList = nodeLists[index] =  {},
          states = svgWorkingNode.querySelectorAll('.node'),
          i, len;

      for(i=0, len = states.length; i < len; ++i) {
         states[i].querySelector('ellipse').setAttribute('fill', 'transparent');
         workingNodeList[atob(states[i].id)] = {t:[]};
      }

      var edges = svgWorkingNode.querySelectorAll('.edge');
      for(i=0, len = edges.length; i < len; ++i) {
         if(edges[i].id !== "initialStateArrow") {
            states = edges[i].id.split(' ');
            workingNodeList[atob(states[1])].t.push([edges[i], false]); // false : state is not origin
            if(states[1]!== states[0]) {
               workingNodeList[atob(states[0])].t.push([edges[i], true]); // true : state is origin
            }
         }
      }

      var g = svgWorkingNode.querySelector('g');
      if(g.hasAttribute('transform')) {
         var translates = g.getAttribute('transform').match(/translate\(([0-9.]+)(?:[\s]+([0-9.]+)\))/),
             tx = parseFloat((translates ? translates[1] : '0') || '0'),
             ty = parseFloat((translates ? translates[2] : '0') || '0');
         g.removeAttribute('transform');
         var ln = g.querySelectorAll('*');
         for(i=0,len=ln.length; i < len; ++i) {
            translate(ln[i], tx, ty);
         }
      }

      var childNodes = g.childNodes;
      for(i = 0, len = childNodes.length; i < len;++i) {
         if(childNodes[i].nodeName === 'polygon') {
            g.removeChild(childNodes[i]);
            break;
         }
      }

      var workingInitialStateArrow = initialStateArrows[index] = svgWorkingNode.getElementById('initialStateArrow');
      if(index === pkg.currentIndex) {
         initialStateArrow = workingInitialStateArrow;
      }
      if(workingInitialStateArrow) {
         setInitialState (
            svgWorkingNode.getElementById(
               btoa(
                  fixBrokenGraphvizTitle(
                     workingInitialStateArrow.querySelector('title').textContent.substr(8)
                  )
               )
            )
         );
         // 8 : size of "_begin->"
      }
      else {
         initialState = initialStates[index] = null;
      }
      pkg.setCurrentIndex(pkg.currentIndex);
   };

   // Choose the current automaton
   pkg.setCurrentIndex = function (index) {
      pkg.cleanSVG(pkg.currentIndex, true);
      pkg.currentIndex = index;
      if(!svgs[index]) {
         pkg.clearSVG(pkg.currentIndex);
      }

      nodeList = nodeLists[index];
      initialStateArrow = initialStateArrows[index];
      initialState = initialStates[index];
      if(pkg.svgNode) {
         pkg.svgContainer.replaceChild(svgs[index], pkg.svgNode);
      }
      else {
         pkg.svgContainer.appendChild(svgs[index]);
      }
      pkg.svgNode = svgs[index];
      pkg.redraw();
   };

   // this function is to be called when a new automaton with index <index> must be created
   pkg.newAutomaton = function (index) {
      if(nodeLists[index]) {
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
      if(pathEditor && pathEditor.parentNode) {
         pathEditor.parentNode.removeChild(pathEditor);
         pathEditor = null;
      }
      if(!dontCleanColors && svgs[index]) {
         var ellipses = svgs[index].querySelectorAll('ellipse'),
             edges    = svgs[index].querySelectorAll('.edge'),
             i, len;

         for(i = 0, len = ellipses.length; i < len; ++i) {
            ellipses[i].setAttribute('fill', 'transparent');
         }

         for(i = 0, len = edges.length; i < len; ++i) {
            if(edges[i].id !== "initialStateArrow") {
               edges[i].querySelector('text').removeAttribute('fill');
               edges[i].querySelector('polygon').setAttribute('fill', 'black');
               edges[i].querySelector('polygon').setAttribute('stroke', 'black');
               edges[i].querySelector('path').setAttribute('stroke', 'black');
            }
         }
      }
   };

   // pkg.redraw the editor. IMPORTANT: call this whenever you mess around with the svg container.
   pkg.redraw = function (that) {
      if(!that) {
         that = pkg;
      }

      if(that.svgNode) {
         var centerX = that.svgNode.viewBox.baseVal.x + that.svgNode.viewBox.baseVal.width/2;
         var centerY = that.svgNode.viewBox.baseVal.y + that.svgNode.viewBox.baseVal.height/2;
         pkg.setViewBoxSize(that);
         that.svgNode.viewBox.baseVal.x = centerX - that.svgNode.viewBox.baseVal.width/2;
         that.svgNode.viewBox.baseVal.y = centerY - that.svgNode.viewBox.baseVal.height/2;
      }
   };


   // reset the viewBox size (uses the size of the svg container and the zoom level to do it)
   pkg.setViewBoxSize = function (that) {
      if(!that) {
         that = pkg;
      }

      if(!that.svgContainer || that.svgContainer.offsetWidth) {
         that.svgNode.viewBox.baseVal.width  = (that.svgNode.width.baseVal.value  = that.svgContainer.offsetWidth) / that.svgZoom;
         that.svgNode.viewBox.baseVal.height = (that.svgNode.height.baseVal.value = that.svgContainer.offsetHeight) / that.svgZoom;
      }
   };

   pkg.getStringValueFunction = function(s){return s === 'ε' ? '\\e' : JSON.stringify(s);};

   var map = {'\\e':epsilon, 'ε':epsilon};

   // Retrieve the code of the automaton #index, svg code included.
   // if the <svg> representation is not desired (e.g. you need a cleaner visual representation of the automaton),
   // set withoutSVG to true
   pkg.getAutomatonCode = function (index, withoutSVG) {
      var getStringValue = pkg.getStringValueFunction;

      pkg.cleanSVG(pkg.currentIndex);
      if(!initialStates[index]) {
         return ''; // automata without initial states are not supported
      }

      var states = [],
          finalStates = [],
          nodes = svgs[index].querySelectorAll('.node'),
          i, len;

      for(i=0, len = nodes.length; i < len; ++i) {
         if(nodes[i].querySelectorAll('ellipse').length > 1) {
            finalStates.push(atob(nodes[i].id));
         }
         else if(nodes[i] !== initialState) {
            states.push(atob(nodes[i].id));
         }
      }

      var code = getStringValue(atob(initialStates[index].id)) + '\n';

      for(i=0, len = states.length; i < len; ++i) {
         code += getStringValue(states[i]) + '\n';
      }

      code += '\n';

      for(i=0, len = finalStates.length; i < len; ++i) {
         code += getStringValue(finalStates[i]) + '\n';
      }

      code += '\n';

      var tid,f,t,text,trans = svgs[index].querySelectorAll('.edge');

      for(i=0, len = trans.length; i < len; ++i) {
         if(trans[i] !== initialStateArrows[index]) {
            tid  = trans[i].id.split(' ');
            text = trans[i].querySelector('text').textContent;
            f = atob(tid[0]);
            t = atob(tid[1]);

            var symbols = parse_transition(text);
            for(var s in symbols) {
               code +=  getStringValue(f) + ' ' + (symbols[s] === epsilon ? '\\e' : Set.prototype.elementToString(symbols[s], map)) + ' ' + getStringValue(t) + '\n';
            }
         }
      }
      return code + (withoutSVG ? '':'\n<representation type="image/svg+xml">\n' + pkg.outerHTML(svgs[index]).trim() + '\n</representation>\n');
   };

   pkg.getValueFunction = pkg.standardizeStringValueFunction = function(s) {return s === '\\e' ? 'ε' : s;};

   pkg.getAutomaton = function (index) {
      var A = new Automaton();
      pkg.cleanSVG(pkg.currentIndex);
      if(!initialStates[index]) {
         return null; // automata without initial states are not supported
      }

      var getValue = pkg.getValueFunction;

      var nodes = svgs[index].querySelectorAll('.node'), i, len;

      for(i=0, len = nodes.length; i < len; ++i) {
         if(nodes[i].querySelectorAll('ellipse').length > 1) {
            A.addFinalState(getValue(atob(nodes[i].id)));
         }
         else if(nodes[i] !== initialState) {
            A.addState(getValue(atob(nodes[i].id)));
         }
      }

      A.setInitialState(getValue(atob(initialStates[index].id)));

      var tid,f,t,text,trans = svgs[index].querySelectorAll('.edge');

      for(i=0, len = trans.length; i < len; ++i) {
         if(trans[i] !== initialStateArrows[index]) {
            tid  = trans[i].id.split(' ');
            text = trans[i].querySelector('text').textContent;
            f = atob(tid[0]);
            t = atob(tid[1]);

            var symbols = parse_transition(text);
            for(var s in symbols) {
               A.addTransition(getValue(f), symbols[s], getValue(t));
            }
         }
      }
      return A;
   };

   pkg.getSVG = function(index) {
      if(svgs[index]) {
         return pkg.outerHTML(svgs[index]).trim();
      }
      return '';
   };

   pkg.load = function() {
      if(!pkg.svgContainer) {
         pkg.svgContainer = document.getElementById('svg-container');
      }

      window.addEventListener('resize', pkg.redraw, false);

      // get the right coordinates of the cursor of the <svg> node
      function svgcursorPoint(evt, that) { // thx http://stackoverflow.com/questions/5901607/svg-coordiantes
         if(!that) {
            that = pkg;
         }

         var pt = that.svgNode.createSVGPoint();
         pt.x = evt.clientX;
         pt.y = evt.clientY;
         var a = that.svgNode.getScreenCTM();
         if(!a) {
            throw('coordinates unavailable');
         }
         var b = a.inverse();
         return pt.matrixTransform(b);
      }

      var nodeMoving, nodeEdit, pathEdit, coords, nodeMovingData;

      // move the path editor when a state is moved
      function pathEditEllipseMove(e) {
         //TODO : handle control points ?
         var pt = svgcursorPoint(e);
         var seg = pointOntoEllipse(nodeMoving._ellipse,pt.x, pt.y, nodeMoving._seg[0].getItem(nodeMoving._seg[1]), nodeMoving._seg[1] ? 10 : 0);
         nodeMoving.setAttribute('cx', seg.x);
         nodeMoving.setAttribute('cy', seg.y);
         if(nodeMoving._arrow) {
            posTriangleArrow(nodeMoving._arrow.points, nodeMoving._ellipse, seg);
         }
      }

      // move the path editor when a point is moved
      function pathEditSolidMove(e) {
         var segMove = nodeMoving._seg[0].getItem(nodeMoving._seg[1]);
         var origSegStart = nodeMoving._seg[2].getItem(0);
         var origSegEnd   = nodeMoving._seg[2].getItem(nodeMoving._seg[1]);

         var dx = (e.clientX - coords.x)/pkg.svgZoom,
             dy = (e.clientY - coords.y)/pkg.svgZoom;

         movePoints(origSegStart, origSegEnd, nodeMoving._seg[0], nodeMoving._seg[2], 1, nodeMoving._seg[1], dx, dy);
         origSegStart = nodeMoving._seg[2].getItem(nodeMoving._seg[2].numberOfItems-1);
         movePoints(origSegStart, origSegEnd, nodeMoving._seg[0], nodeMoving._seg[2], nodeMoving._seg[1]+1, nodeMoving._seg[0].numberOfItems-1, dx, dy);
         nodeMoving.setAttribute('cx', segMove.x);
         nodeMoving.setAttribute('cy', segMove.y);
      }

      // move the path editor when a control point is moved
      function pathEditControlMove(e) {
         var pt = svgcursorPoint(e);
         nodeMoving.setAttribute('cx', nodeMoving._seg[0][nodeMoving._seg[1]] = pt.x);
         nodeMoving.setAttribute('cy', nodeMoving._seg[0][nodeMoving._seg[2]] = pt.y);
      }

      // move the visible area
      function viewBoxMove(e, that) {
         blockNewState = true;
         if(that) {
            var c = that;
         }
         else {
            var c = coords;
            that = pkg;
         }

         that.svgNode.viewBox.baseVal.x = c.viewBoxX - (e.clientX - c.x)/that.svgZoom;
         that.svgNode.viewBox.baseVal.y = c.viewBoxY - (e.clientY - c.y)/that.svgZoom;
      }

      function isTransitionStraight(edge) {
         var tid = edge.id.split(' ');

         var path   = edge.querySelector('path').pathSegList,
             state1 = document.getElementById(tid[0]).querySelector('ellipse'),
             state2 = document.getElementById(tid[1]).querySelector('ellipse'),
             cx1    = state1.cx.baseVal.value,
             cy1    = state1.cy.baseVal.value,
             cx2    = state2.cx.baseVal.value,
             cy2    = state2.cy.baseVal.value,
             m      = (cy2-cy1)/(cx2-cx1),
             p      = cy1 - m*cx1,
             errorMargin = 1;

         for(var seg,i=0,len=path.numberOfItems; i < len; ++i) {
            seg = path.getItem(i);
            if(seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
               if(    Math.abs(m * seg.x1 + p - seg.y1) > errorMargin
                   || Math.abs(m * seg.x2 + p - seg.y2) > errorMargin) {
                  return false;
               }
            }
            if(Math.abs(m * seg.x + p - seg.y) > errorMargin) {
               return false;
            }
         }
         return true;
      }
      function beginNodeMoving(nodeMoving, e) {
         pkg.stopMove = true;
         pkg.svgContainer.style.cursor = "move";
         pkg.svgContainer.onmousemove = nodeMove;
         coords = {
            x:e.clientX,
            y:e.clientY,
            ellipse:nodeMoving.querySelectorAll('ellipse'),
            text:nodeMoving.querySelector('text'),
         };
         coords.cx = coords.ellipse[0].cx.baseVal.value;
         coords.cy = coords.ellipse[0].cy.baseVal.value;
         coords.tx = coords.text.x.baseVal.getItem(0).value;
         coords.ty = coords.text.y.baseVal.getItem(0).value;
         if(coords.ellipse[1]) {
            coords.cx1 = coords.ellipse[1].cx.baseVal.value;
            coords.cy1 = coords.ellipse[1].cy.baseVal.value;
         }

         coords.t = [];
         var n = nodeMovingData = nodeList[atob(nodeMoving.id)];
         for(var i=0, len = n.t.length; i < len; ++i) {
            coords.t[i] = [n.t[i], n.t[i][0].cloneNode(true)];
            coords.t[i].transitionStraight = isTransitionStraight(n.t[i][0]);
         }
      }
      function beginNewTransition(startState, e) {
         pkg.stopMove = true;
         nodeEdit = startState;
         pkg.svgContainer.onmousemove = nodeBinding;
         pathEdit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
         pathEdit.setAttribute('fill', 'none');
         pathEdit.setAttribute('stroke', 'black');

         var ellipse = getBigEllipse(startState);
         var pt = svgcursorPoint(e), p = pointOntoEllipse(ellipse, pt.x, pt.y);
         pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegMovetoAbs(p.x, p.y));
         pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegCurvetoCubicAbs(pt.x, pt.y, p.x, p.y,pt.x, pt.y));
         pkg.svgNode.appendChild(pathEdit);
      }

      function endNewTransition(endState, e) {
         pkg.stopMove = true;
         var id = nodeEdit.id + ' ' + endState.id;
         if(document.getElementById(id)) {
            // Désolé, une fèche existe déjà entre ces deux états dans ce sens.
            alert(_('Sorry, there is already a transition between these states in this way.'));
            pkg.svgNode.removeChild(pathEdit);
            pkg.svgContainer.onmousemove = null;
            return;
         }

         pkg.svgContainer.onmousemove = null;
         pkg.prompt(
            _("New transition"),
            _("Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes."),
            '',
            function(trans) {
               if(trans === null) {
                  pathEdit.parentNode.removeChild(pathEdit);
               }
               else {
                  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  g.id = id;
                  g.setAttribute('class', 'edge');
                  var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                  title.textContent = toBrokenGraphvizTitle(atob(nodeEdit.id)) + '->' + toBrokenGraphvizTitle(atob(endState.id));
                  g.appendChild(title);

                  var polygon = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');

                  polygon.setAttribute('fill', 'black');
                  polygon.setAttribute('stroke', 'black');

                  var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  text.textContent = format_transition(trans || "\\e");
                  text.setAttribute('text-anchor', 'middle');
                  text.setAttribute('font-family', 'Times Roman,serif');
                  text.setAttribute('font-size', '14.00');
                  cleanTransitionPos(pathEdit, polygon.points, text, nodeEdit, endState);
                  g.appendChild(pathEdit);
                  g.appendChild(polygon);
                  g.appendChild(text);
                  pkg.svgNode.querySelector('g').appendChild(g);
                  nodeList[atob(endState.id)].t.push([g, false]); // false : state is not origin
                  if(nodeEdit !== endState) {
                     nodeList[atob(nodeEdit.id)].t.push([g, true]); // true : state is origin
                  }
               }
            }
         );
      }

      function transitionStraight(edge) {
         var tid = edge.id.split(' ');

         cleanTransitionPos(
            edge.querySelector('path'),
            edge.querySelector('polygon').points,
            edge.querySelector('text'),
            document.getElementById(tid[0]),
            document.getElementById(tid[1])
         );
      }

      function beginMoveTransitionLabel(text, e) {
         pkg.stopMove = true;
         nodeMoving = text;
         coords = [e.clientX, e.clientY, e.target.x.baseVal.getItem(0).value, e.target.y.baseVal.getItem(0).value];
         pkg.svgContainer.onmousemove = labelMove;
         pkg.svgContainer.cursor = 'move';
      }

      function beginNewTransitionEdit(nodeMoving, e) {
         var p = nodeMoving.querySelector('path'), segs = p.pathSegList;
         var tid = nodeMoving.id.split(' ');

         if(!pathEditor)
            pathEditor = document.createElementNS('http://www.w3.org/2000/svg', 'g');

         pathEditor.id = 'path-editor';
         while(pathEditor.firstChild) {
            pathEditor.removeChild(pathEditor.firstChild);
         }
         var handle, seg;
         for(var i=0, len = segs.numberOfItems; i < len; ++i) {
            seg = segs.getItem(i);
            if(seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
               if(seg.x1 !== segs.getItem(i-1).x || seg.y1 !== segs.getItem(i-1).y) {
                  handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  handle.setAttribute('class', 'pathedit-handle');
                  handle.setAttribute('r', 3);
                  handle.setAttribute('fill', '#F50');
                  handle.setAttribute('stroke', 'black');
                  handle._mousemove = pathEditControlMove;
                  handle.setAttribute('cx', seg.x1);
                  handle.setAttribute('cy', seg.y1);
                  handle._seg = [seg, 'x1', 'y1'];
                  pathEditor.appendChild(handle);
               }
               if(seg.x2 !== seg.x || seg.y2 !== seg.y) {
                  handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  handle.setAttribute('class', 'pathedit-handle');
                  handle.setAttribute('r', 3);
                  handle.setAttribute('fill', '#F50');
                  handle.setAttribute('stroke', 'black');
                  handle._mousemove = pathEditControlMove;
                  handle.setAttribute('cx', seg.x2);
                  handle.setAttribute('cy', seg.y2);
                  handle._seg = [seg, 'x2', 'y2'];
                  pathEditor.appendChild(handle);
               }
            }

            handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('class', 'pathedit-handle');
            handle.setAttribute('cx', seg.x);
            handle.setAttribute('cy', seg.y);
            handle.setAttribute('r', 3);
            if(i === len-1) {
               handle._mousemove = pathEditEllipseMove;
               handle._ellipse   = getBigEllipse(document.getElementById(tid[1]));
               handle._arrow     = nodeMoving.querySelector('polygon');
            }
            else if(!i) {
               handle._mousemove = pathEditEllipseMove;
               handle._ellipse   = getBigEllipse(document.getElementById(tid[0]));
            }
            else {
               handle._mousemove = pathEditSolidMove;
            }

            handle._seg = [segs, i, p.cloneNode(false).pathSegList];

            handle.setAttribute('fill', '#4AF');
            handle.setAttribute('stroke', 'black');
            pathEditor.appendChild(handle);
         }
         // TODO: handle parabola
         pkg.svgNode.appendChild(pathEditor);
      }
      
      function endNewTransitionEdit() {
         if(pathEditor) {
            pkg.svgNode.removeChild(pathEditor);
            pathEditor = null;
         }
      }

      function beginViewBoxMove(e) {
         coords = {x:e.clientX, y:e.clientY, viewBoxX:pkg.svgNode.viewBox.baseVal.x, viewBoxY:pkg.svgNode.viewBox.baseVal.y};
         pkg.svgContainer.onmousemove = viewBoxMove;
      }

      function toggleAccepting(nodeMoving, e) {
         var ellipses = nodeMoving.querySelectorAll('ellipse'),
             tl       = nodeList[atob(nodeMoving.id)].t,
             ellipse,
             ry,
             path,
             tid,
             np,
             p;

         if(ellipses.length > 1) { // to non accepting state
            nodeMoving.removeChild(ellipses[1]);
            ry = ellipses[0].ry.baseVal.value - 4;
            ellipse = ellipses[0];
         }
         else {
            ellipse = ellipses[0].cloneNode(false);
            ry = ellipse.ry.baseVal.value + 4;
            ellipse.setAttribute('fill', 'none');
            ellipse.setAttribute('rx', ry);
            ellipse.setAttribute('ry', ry);
            nodeMoving.insertBefore(ellipse, ellipses[0].nextSibling);
         }
         if(initialState === nodeMoving) {
            // we translate the initial state arrow
            path = initialStateArrow.querySelector('path');
            p = path.pathSegList.getItem(path.pathSegList.numberOfItems-1);
            np = pointOntoEllipse(ellipse, p.x, p.y, null, 10);
            translate(initialStateArrow.querySelector('polygon'), np.x - p.x, np.y-p.y);
            translate(path, np.x - p.x, np.y-p.y);
         }

         for(var t in tl) {
            tid = tl[t][0].id.split(" ");
            if(tl[t][1] || tid[1] === tid[0]) { // state n is the origin of the transition t
               // we get the first point of the transition
               p = tl[t][0].querySelector('path').pathSegList.getItem(0);
            }
            else {
               // we get the last point of the transition
               p = tl[t][0].querySelector('polygon').points.getItem(1);
            }
            np = pointOntoEllipse(ellipse, p.x, p.y);
            
            if(tl[t][1] && tid[0] !== tid[1]) {
               p.x = np.x;
               p.y = np.y;
            }
            else {
               var segs = tl[t][0].querySelector('path').pathSegList;
               if(tid[0] === tid[1]) { // FIXME: crappy but kinda works.
                  translate(tl[t][0].querySelector('polygon'), np.x-p.x, np.y-p.y);
                  translate(tl[t][0].querySelector('path'), np.x-p.x, np.y-p.y);
                  p = segs.getItem(segs.numberOfItems-1);
                  pointOntoEllipse(ellipse, p.x, p.y, np, 10);
                  translate(tl[t][0].querySelector('polygon'), np.x-p.x, np.y-p.y);
                  p.x = np.x;
                  p.y = np.y;
               }
               else {
                  var s = segs.getItem(segs.numberOfItems-1);
                  s.x += np.x-p.x;
                  s.y += np.y-p.y;
                  translate(tl[t][0].querySelector('polygon'), np.x-p.x, np.y-p.y);
                  p.x = np.x;
                  p.y = np.y;
               }
            }
         }
      }

      // move event when two nodes must be bound (the transition is following the cursor)
      function nodeBinding(e) {
         blockNewState = false;
         var pt = svgcursorPoint(e);
         var p = pathEdit.pathSegList.getItem(1);
         var po = pathEdit.pathSegList.getItem(0);
         p.x = p.x2 =pt.x - (p.x-po.x > 0 ? 1 : -1);
         p.y = p.y2 = pt.y - (p.y-po.y > 0 ? 1 : -1);
         pointOntoEllipse(getBigEllipse(nodeEdit), p.x, p.y, po);
         p.x1 = po.x;
         p.y1 = po.y;
      }

      // delete the transition tNode
      // if tstate is given, dont handle the state which tid is <tstate>
      function deleteTransition(tNode, tstate) {
         for(var j in nodeList) {
            if(j !== tstate) {
               for(var k = 0, n = nodeList[j], len = n.t.length; k < len; ++k) {
                  if(n.t[k][0] === tNode) {
                     n.t.splice(k, 1);
                     --len;
                  }
               }
            }
         }
         tNode.parentNode.removeChild(tNode);
      }

      function removeNode(node) {
         if(node === initialState) {
            alert(_("Sorry, but you can't remove the initial state."));
         }
         else {
            var tid = atob(node.id);
            var n = nodeList[tid];
            for(var i in n.t) {
               deleteTransition(n.t[i][0], tid);
            }
            delete nodeList[tid];
            node.parentNode.removeChild(node);
         }
      }

      function editNodeName(node) {
         var text = node.querySelector('text');
         pkg.prompt(_("Name of the state"), _("Which name do you want for the state ?"), text.textContent, function(t) {
            if(t) {
               t = pkg.standardizeStringValueFunction(t);
               var tb = btoa(t);
               var existingNode;
               if(existingNode = pkg.svgNode.getElementById(tb)) {
                  if(node !== existingNode) {
                     alert(_("Sorry, but a state is already named like this."));
                  }
               }
               else {
                  var oldid = atob(node.id),
                      n = nodeList[oldid];
                  for(var i=0, len = n.t.length; i < len; ++i) {
                     var tid = n.t[i][0].id.split(' ');
                     if(tid[0] === tid[1]) {
                        n.t[i][0].id = tb + ' ' + tb;
                        n.t[i][0].querySelector('title').textContent = toBrokenGraphvizTitle(t) + '->' + toBrokenGraphvizTitle(t);
                     }
                     else if(n.t[i][1]) {// if node is origin
                        n.t[i][0].id = tb + ' ' + tid[1];
                        n.t[i][0].querySelector('title').textContent = toBrokenGraphvizTitle(t) + '->' + toBrokenGraphvizTitle(atob(tid[1]));
                     }
                     else {
                        n.t[i][0].id = tid[0] + ' ' + tb;
                        n.t[i][0].querySelector('title').textContent = toBrokenGraphvizTitle(atob(tid[0])) + '->' + toBrokenGraphvizTitle(t);
                     }
                  }
                  nodeList[t] = nodeList[oldid];
                  delete nodeList[oldid];
                  node.querySelector('title').textContent = toBrokenGraphvizTitle(text.textContent = t);
                  node.setAttribute('id', tb);
                  if(node === initialState) {
                     setInitialState(node);
                  }
               }
            }
         });
      }

      function editTransitionSymbols(edge) {
         var text = edge.querySelector('text');
         var t = pkg.prompt(
            _("Transitions' symbols"),
            _("Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes."),
            text.textContent,
            function(t) {
               if(t !== null) {
                  text.textContent = format_transition(t || '\\e');
               }
            }
         );
      }

      function createNode(e) {
         var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
         g.setAttribute('class', 'node');
         var id = 0;
         while(id in nodeList) {
            ++id;
         }
         g.id = btoa(id);
         var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
         title.textContent = toBrokenGraphvizTitle(id);
         var ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');

         var pt = svgcursorPoint(e);
         var ry = 18.3848;
         var cy = pt.y;
         ellipse.setAttribute('fill', 'transparent');
         ellipse.setAttribute('stroke', 'black');
         ellipse.setAttribute('rx', 17.8879);
         ellipse.setAttribute('ry', ry);
         ellipse.setAttribute('cx', pt.x);
         ellipse.setAttribute('cy', cy);
         var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
         text.textContent = id;
         text.setAttribute('text-anchor', 'middle');
         text.setAttribute('font-family', 'Times Roman, serif');
         text.setAttribute('font-size', '14.00');
         text.setAttribute('x', pt.x);
         text.setAttribute('y', cy+4);
         g.appendChild(title);
         g.appendChild(ellipse);
         g.appendChild(text);
         pkg.svgNode.querySelector('g').appendChild(g);
         if(!initialState) {
            setInitialState(g);
         }
         nodeList[id] = {t:[]};
      }

      // event when a node is moved
      function nodeMove(e) {
         if(pkg.stopMoveNode) {
            return;
         }
         var dy = (e.clientY - coords.y)/pkg.svgZoom, dx = (e.clientX - coords.x)/pkg.svgZoom;
         coords.text.setAttribute('x', coords.tx + dx);
         coords.text.setAttribute('y', coords.ty + dy);
         coords.ellipse[0].setAttribute('cx', coords.cx + dx);
         coords.ellipse[0].setAttribute('cy', coords.cy + dy);
         if(coords.ellipse[1]) {
            coords.ellipse[1].setAttribute('cx', coords.cx1 + dx);
            coords.ellipse[1].setAttribute('cy', coords.cy1 + dy);
         }

         if(initialState === nodeMoving) {
            // moving the initial state arrow
            setInitialState(nodeMoving); // FIXME: isn't this inefficient ?
         }

         
         var nodes, n = nodeMovingData;
         for(var i=0, len = n.t.length; i < len; ++i) {
            nodes = coords.t[i][0][0].id.split(" ");
            var seg, origSeg,
                path     = coords.t[i][0][0].querySelector('path'),
                segs     = path.pathSegList,
                origSegs = coords.t[i][1].querySelector('path').pathSegList,
                text     = coords.t[i][0][0].querySelector('text'),
                textOrig = coords.t[i][1].querySelector('text'),
                polygonPoints = coords.t[i][0][0].querySelector('polygon').points,
                s, leng;

            if(nodes[0] === nodes[1]) {// transition from / to the same state, just moving
               var coefTextX = 1, coefTextY = 1;
               for(s = 0, leng = segs.numberOfItems ; s < leng; ++s) {
                  seg = segs.getItem(s);
                  origSeg = origSegs.getItem(s);
                  if(seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                     seg.x1 = origSeg.x1 + dx;
                     seg.x2 = origSeg.x2 + dx;
                     seg.y1 = origSeg.y1 + dy;
                     seg.y2 = origSeg.y2 + dy;
                  }

                  seg.x = origSeg.x + dx;
                  seg.y = origSeg.y + dy;
               }
               text.setAttribute('x', textOrig.x.baseVal.getItem(0).value + (coefTextX*dx));
               text.setAttribute('y', textOrig.y.baseVal.getItem(0).value + (coefTextY*dy));
            }
            else {
               var origSegStart = origSegs.getItem(0),
                   origSegEnd = origSegs.getItem(segs.numberOfItems-1),
                   width  = Math.abs(origSegEnd.x - origSegStart.x),
                   height = Math.abs(origSegEnd.y - origSegStart.y),
                   textOrigX = textOrig.x.baseVal.getItem(0).value,
                   textOrigY = textOrig.y.baseVal.getItem(0).value;
                   
               if(coords.t[i][0][1]) { // if the state is the origin
                  var ech = origSegStart;
                  origSegStart = origSegEnd;
                  origSegEnd = ech;
               }

               text.setAttribute('x', newPos(textOrigX, origSegStart.x, origSegEnd.x, textOrigY, origSegStart.y, origSegEnd.y, width, dx, height, dy));
               text.setAttribute('y', newPos(textOrigY, origSegStart.y, origSegEnd.y, textOrigX, origSegStart.x, origSegEnd.x, height, dy, width, dx));

               if(coords.t[i].transitionStraight) {
                  cleanTransitionPos(
                     path,
                     polygonPoints,
                     null,
                     document.getElementById(nodes[0]),
                     document.getElementById(nodes[1])
                  );
               }
               else {
                  for(s = 0, leng = segs.numberOfItems ; s < leng; ++s) {
                     seg = segs.getItem(s);
                     origSeg = origSegs.getItem(s);
                     if(seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
                        seg.x1 = newPos(origSeg.x1, origSegStart.x, origSegEnd.x, origSeg.y1, origSegStart.y, origSegEnd.y, width, dx, height, dy);
                        seg.y1 = newPos(origSeg.y1, origSegStart.y, origSegEnd.y, origSeg.x1, origSegStart.x, origSegEnd.x, height, dy, width, dx);
                        seg.x2 = newPos(origSeg.x2, origSegStart.x, origSegEnd.x, origSeg.y2, origSegStart.y, origSegEnd.y, width, dx, height, dy);
                        seg.y2 = newPos(origSeg.y2, origSegStart.y, origSegEnd.y, origSeg.x2, origSegStart.x, origSegEnd.x, height, dy, width, dx);
                     }
                     seg.x = newPos(origSeg.x, origSegStart.x, origSegEnd.x, origSeg.y, origSegStart.y, origSegEnd.y, width, dx, height, dy);
                     seg.y = newPos(origSeg.y, origSegStart.y, origSegEnd.y, origSeg.x, origSegStart.x, origSegEnd.x, height, dy, width, dx);
                  }
               }
            }

            if(nodes[0] === nodes[1] || !coords.t[i].transitionStraight && !coords.t[i][0][1]) { // the state is the destination, we move the arrow
               var pointsOrig    = coords.t[i][1].querySelector('polygon').points,
                   pp,po;

               for(s = 0, leng = polygonPoints.numberOfItems; s < leng; ++s) {
                  pp = polygonPoints.getItem(s);
                  po = pointsOrig.getItem(s);
                  pp.x = po.x + dx;
                  pp.y = po.y + dy;
               }
            }
         }
      }

      // event when a transition label is moved
      function labelMove(e) {
         nodeMoving.setAttribute('x', (e.clientX - coords[0])/pkg.svgZoom + coords[2]);
         nodeMoving.setAttribute('y', (e.clientY - coords[1])/pkg.svgZoom + coords[3]);
      }

      var blockNewState, blockClick;

      pkg.svgContainer.addEventListener('mousedown', function(e) {
         blockNewState = true;
         if(blockClick) {
            return;
         }
         blockClick = true;
         if(!e.button) { // left button
            if(nodeMoving = parentWithClass(e.target, 'pathedit-handle')) {
               // handle path editing
               coords = {
                  x:e.clientX,
                  y:e.clientY
               };
               pkg.stopMove = true;
               pkg.svgContainer.onmousemove = nodeMoving._mousemove;
            }
            else {
               pkg.cleanSVG(pkg.currentIndex, true);

               if(nodeMoving = parentWithClass(e.target, 'node')) {
                  if(pkg.svgContainer.onmousemove === nodeBinding) {
                     endNewTransition(nodeMoving, e);
                  }
                  else if((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                     pkg.stopMove = true;
                     removeNode(nodeMoving);
                  }
                  else if(e.shiftKey) {
                     beginNewTransition(nodeMoving, e);
                  }
                  else {
                     beginNodeMoving(nodeMoving, e);
                  }
               }
               else if(nodeMoving = parentWithClass(e.target, 'edge')) {
                  if(e.shiftKey) {
                     transitionStraight(nodeMoving);
                  }
                  else if(e.ctrlKey || e.metaKey) {
                     deleteTransition(nodeMoving, null);
                  }
                  else if(e.target.nodeName === 'text') {
                     beginMoveTransitionLabel(e.target, e);
                  }
                  else {
                     beginNewTransitionEdit(nodeMoving, e);
                  }
               }
               else if(!pkg.svgContainer.onmousemove) {
                  blockNewState = false;
//                   beginViewBoxMove(e);
               }
            }
         }
         else {
            endNewTransitionEdit();

            if(e.button === 1) {
               beginViewBoxMove(e);
            }
            else if(e.button === 2) {
               if(nodeMoving = parentWithClass(e.target, 'node')) {
                  if(!e.shiftKey) {
                     if((e.ctrlKey || e.metaKey)) {
                        setInitialState(nodeMoving);
                     }
                     else {
                        toggleAccepting(nodeMoving, e);
                     }
                  }
               }
            }
         }
      }, false);

      pkg.svgContainer.addEventListener('mouseup', function(e) {
         blockClick = false;
         if(pkg.svgContainer.onmousemove === nodeBinding) {
            if(!blockNewState && (nodeMoving = parentWithClass(e.target, 'node'))) {
               endNewTransition(nodeMoving, e);
            }
         }
         else {
            pkg.svgContainer.style.cursor = "";
            pkg.svgContainer.onmousemove = null;
         }
      }, false);

      pkg.svgContainer.addEventListener('dblclick', function(e) {
         if(nodeEdit = parentWithClass(e.target, 'node')) {
            if(!(e.button || e.shiftKey || e.ctrlKey || e.metaKey)) {
               editNodeName(nodeEdit);
            }
         }
         else if(nodeEdit = parentWithClass(e.target, 'edge')) {
            if(!(e.ctrlKey || e.metaKey || e.shiftKey)) { // delete transition
               editTransitionSymbols(nodeEdit);
            }
         }
         else if(!(e.button || blockNewState || e.ctrlKey || e.metaKey || e.shiftKey)) {
            createNode(e);
         }
      }, false);

      window.addEventListener('keydown', function (e) {
         if(e.keyCode === 27) {
            if(pkg.svgContainer.onmousemove === nodeBinding) {
               pathEdit.parentNode.removeChild(pathEdit);
               pkg.svgContainer.onmousemove = null;
            }
         }
      }, false);

      (pkg.userZoom = function (that) {
         if(!that.redraw) {
            that.redraw = function() {
               pkg.redraw(that);
            };
         }

         function newZoom(zoom, x, y) {
            if(!(that.svgZoom = zoom)) {
               that.svgZoom = 0.1;
               return;
            }
            pkg.setViewBoxSize(that);
            if(!isNaN(x)) {
               that.svgNode.viewBox.baseVal.x = x - (x - that.svgNode.viewBox.baseVal.x)*oldZoom/that.svgZoom;
               that.svgNode.viewBox.baseVal.y = y - (y - that.svgNode.viewBox.baseVal.y)*oldZoom/that.svgZoom;
            }
         }

         var oldZoom, initialZoom, lastDeltaX, lastDeltaY;

         listenMouseWheel(function(e, delta) {
            if(!that.svgNode) {
               return;
            }

            var pt = svgcursorPoint(e, that);
            oldZoom = that.svgZoom;
            newZoom(Math.round((that.svgZoom + delta * 0.1)*10)/10, pt.x, pt.y);

            e.preventDefault();
            e.stopPropagation();
            return false;
         }, that.svgContainer);

         function drag(e) {
            if(lastDeltaX || lastDeltaY) {
               that.svgNode.viewBox.baseVal.x -= (e.gesture.deltaX - lastDeltaX) / that.svgZoom;
               that.svgNode.viewBox.baseVal.y -= (e.gesture.deltaY - lastDeltaY) / that.svgZoom;
            }
            lastDeltaX = e.gesture.deltaX;
            lastDeltaY = e.gesture.deltaY;
         }

         if(window.Hammer) {
            window.Hammer(that.svgContainer).on("touch", function(e) {
               initialZoom = that.svgZoom;
               lastDeltaX = 0;
               lastDeltaY = 0;
            });
            window.Hammer(that.svgContainer).on("pinch", function(e) {
               if(that === pkg) {
                  blockNewState = true;
               }
               that.stopMove = true;
               that.stopMoveNode = true;

               oldZoom = that.svgZoom;
               var nz = initialZoom * e.gesture.scale;
               if(nz !== that.svgZoom) {
                  var pt = svgcursorPoint({clientX:e.gesture.center.pageX, clientY:e.gesture.center.pageY}, that);
                  newZoom(nz, pt.x, pt.y);
               }
               drag(e);
            });
            window.Hammer(that.svgContainer).on("drag", function(e) {
               if(!that.stopMove) {
                  blockNewState = true;
                  drag(e);
               }
            });
            window.Hammer(that.svgContainer).on("release", function(e) {
               that.stopMove = false;
               that.stopMoveNode = false;
            });
         }
      })(pkg);

      pkg.svgContainer.ondragstart = pkg.svgContainer.onselectstart = pkg.svgContainer.oncontextmenu = function(e) {
         e.preventDefault();
         return false;
      };

      pkg.clearSVG(pkg.currentIndex);
   };

   //set the initial state for the current automaton
   function setInitialState (node) {
      var path, polygon, title;

      if(initialStateArrow) {
         path    = initialStateArrow.querySelector('path');
         polygon = initialStateArrow.querySelector('polygon');
         title   = initialStateArrow.querySelector('title');
      }
      else {
         initialStateArrow = initialStateArrows[pkg.currentIndex] = document.createElementNS('http://www.w3.org/2000/svg', 'g');
         initialStateArrow.id = 'initialStateArrow';
         title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
         path =  document.createElementNS('http://www.w3.org/2000/svg', 'path');
         polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
         path.setAttribute('stroke', 'black');
         polygon.setAttribute('stroke', 'black');
         polygon.setAttribute('fill', 'black');
         initialStateArrow.appendChild(title);
         initialStateArrow.appendChild(path);
         initialStateArrow.appendChild(polygon);
         pkg.svgNode.querySelector('g').appendChild(initialStateArrow);
      }

      var ellipse = getBigEllipse(node),
               cy = ellipse.cy.baseVal.value,
               cx = ellipse.cx.baseVal.value,
               rx = ellipse.rx.baseVal.value;

      path.setAttribute('d', 'M' + (cx-rx-38) + ',' + cy +
                             'C' + (cx-rx-(38-10)*2/3) + ',' + cy +
                             ' ' + (cx-rx-(38-10)/3)   + ',' + cy +
                             ' ' + (cx-rx-10) + ',' + cy
      );

      polygon.setAttribute('points',
               (cx-rx)    + ',' + cy     +
         ' ' + (cx-rx-10) + ',' + (cy-4) +
         ' ' + (cx-rx-5)  + ',' + cy     +
         ' ' + (cx-rx-10) + ',' + cy     +
         ' ' + (cx-rx-10) + ',' + cy     +
         ' ' + (cx-rx-10) + ',' + cy     +
         ' ' + (cx-rx-5)  + ',' + cy     +
         ' ' + (cx-rx-10) + ',' + (cy+4) +
         ' ' + (cx-rx)    + ',' + cy     +
         ' ' + (cx-rx)    + ',' + cy
      );
      title.textContent = '_begin->' + atob(node.id);
      initialState = initialStates[pkg.currentIndex] = node;
   }

   // translate the node with the vector (tx,ty)
   function translate(n, tx, ty) {
      var  p, a, s, seg, leng, attr, attrsx = ['x','cx', 'x1', 'x2'], attrsy = ['y','cy', 'y1', 'y2'];
      if(p = n.pathSegList || n.points) {
         for(seg=0,leng = p.numberOfItems; seg < leng; ++seg) {
            s = p.getItem(seg);
            if(s.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
               s.x1 += tx;
               s.x2 += tx;
               s.y1 += ty;
               s.y2 += ty;
            }

            s.x  += tx;
            s.y  += ty;
         }
      }
      else {
         for(attr in attrsx) {
            a = attrsx[attr];
            if(n.hasAttribute(a)) {
               n.setAttribute(a, parseFloat(n.getAttribute(a)) + tx);
            }
         }
         for(attr in attrsy) {
            a = attrsy[attr];
            if(n.hasAttribute(a)) {
               n.setAttribute(a, parseFloat(n.getAttribute(a)) + ty);
            }
         }
      }
   }

   // utility function : gets the pkg.outerHTML of a node.
   // WARNING: please don't use this function for anything,
   //          it's not universal and could break your code.
   //          Check its implementation for more details.
   pkg.outerHTML = function (node) {
      // webkit does not support inner/pkg.outerHTML for pure XML nodes
      if("outerHTML" in node) {
         return node.outerHTML;
      }
      else {
         if(node.parentNode && node.parentNode.childNodes.length === 1) {
            return node.parentNode.innerHTML;
         }
         else {
            var ns = node.nextSibling;
            var pn = node.parentNode;
            var div = document.createElement('div');
            div.appendChild(node);
            var o = div.innerHTML;
            if(pn) {
               pn.insertBefore(node, ns);
            }
            else {
               div.removeChild(node);
            }
            div = null;
            return o;
         }
      }
   }

   // checks if the node or one of its parent has class c. Specific to the AutomatonDesigner.
   function parentWithClass(node, c) {
      do {
         if(node.getAttribute('class') === c) {
            return node;
         }
      } while((node = node.parentNode) && node !== pkg.svgContainer);
      return false;
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
   function pointOntoEllipse(ellipse, x, y, p, distanceToEllipse, cx, cy) {

      if(!cy) {
         cy = ellipse.cy.baseVal.value;
      }
      if(!cx) {
         cx = ellipse.cx.baseVal.value;
      }

      var alpha = Math.atan((x-cx)/(y-cy)),
          r     = ellipse.ry.baseVal.value + (distanceToEllipse || 0);

      if(!p) {
         p = {};
      }

      var alphaMsemiPi    = alpha - Math.PI/2 || 0,
          cosAlphaMsemiPi = Math.cos(alphaMsemiPi),
          sinAlphaMsemiPi = Math.sin(alphaMsemiPi);
      if(y >= cy) {
         if(x > cx) {
            p.x = cx - r * (cosAlphaMsemiPi - 2 * Math.abs(cosAlphaMsemiPi));
            p.y = cy + r * (sinAlphaMsemiPi + 2 * Math.abs(sinAlphaMsemiPi));
         }
         else {
            p.x = cx - r * (cosAlphaMsemiPi + 2 * Math.abs(cosAlphaMsemiPi));
            p.y = cy + r * (sinAlphaMsemiPi + 2 * Math.abs(sinAlphaMsemiPi));
         }
      }
      else {
         p.x = cx - r * cosAlphaMsemiPi;
         p.y = cy + r * sinAlphaMsemiPi;
      }

      return p;
   }

   // Given a node representing a state, gives the biggest ellipse of the node in case of a final state.
   // Otherwise, give the only ellipse of the node
   function getBigEllipse(n) {
      var ellipse;
      for(var i=0, c=n.childNodes, len=c.length; i < len; ++i) {
         if(c[i].cx) {
            ellipse = c[i];
         }
      }
      return ellipse;
   }

   // Position the triangle polygonPoints of a transition correctly on the svg <ellipse /> at point p{x,y}.
   // Parameters :
   //  - polygonPoints : points of the SVG node representing the triangle
   //  - ellipse : the SVG node representing the ellipse
   //  - cx, cy (optional) : the center of the ellipse, if already known
   function posTriangleArrow(polygonPoints, ellipse, p, cx, cy) {

      if(!cy) {
         cy = ellipse.cy.baseVal.value;
      }

      if(!cx) {
         cx = ellipse.cx.baseVal.value;
      }

      var beta    = Math.PI/2 - (Math.atan((cx-p.x)/(cy-p.y)) || 0),
          top     = pkg.svgNode.createSVGPoint(),
          bot     = pkg.svgNode.createSVGPoint(),
          top2    = pkg.svgNode.createSVGPoint(),
          peak    = pkg.svgNode.createSVGPoint(),
          cosBeta = 3.5 * (Math.cos(beta) || 1),
          sinBeta = 3.5 * (Math.sin(beta) || 0);

      top.y = p.y - cosBeta;
      top.x = p.x + sinBeta;

      bot.y = p.y + cosBeta;
      bot.x = p.x - sinBeta;

      top2.x = top.x;
      top2.y = top.y;

      pointOntoEllipse(ellipse, p.x, p.y, peak, 0, cx, cy);

      for(var i = polygonPoints.numberOfItems; i ; --i) {
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
          i = pathSegList.numberOfItems;
      if(stateOrig === stateDest) {
         for(; i > 3; --i) {
            pathSegList.removeItem(2);
         }

         while(i < 3) {
            pathSegList.appendItem(path.createSVGPathSegCurvetoCubicAbs(0,0,0,0,0,0));
            ++i;
         }

         var po = pathSegList.getItem(0);
         var pi = pathSegList.getItem(1);
         var p = pathSegList.getItem(2);
         var ellipse = getBigEllipse(stateDest);
         var cx = ellipse.cx.baseVal.value,
             cy = ellipse.cy.baseVal.value,
             ry = ellipse.ry.baseVal.value,
             rx = ellipse.rx.baseVal.value,
             y  = Math.sqrt(ry*ry - rx*rx/4);
         po.x = cx - rx/2;
         po.y = cy - y;
         p.x  = cx + rx/2;
         p.y = po.y-10;
         pi.x1 = po.x-1;
         pi.y1 = po.y-10;
         pi.x = cx;
         pi.y = po.y-19;
         pi.x2 = pi.x-8;
         pi.y2 = pi.y;
         p.x1 = pi.x+5;
         p.y1 = pi.y;
         p.x2 = p.x-1;
         p.y2 = p.y-6;
         posTriangleArrow(polygonPoints, ellipse, p, cx+rx/2, cy+ry-y);

         text.setAttribute('x', pi.x);
         text.setAttribute('y', (pi.y - 5));
      }
      else {
         while(i > 2) {
            pathSegList.removeItem(2);
            --i;
         }
         var p = pathSegList.getItem(pathSegList.numberOfItems-1);
         var po = pathSegList.getItem(0);
         var ellipseD = getBigEllipse(stateDest);
         var ellipseO = getBigEllipse(stateOrig);
         var cx = ellipseD.cx.baseVal.value, 
             cy = ellipseD.cy.baseVal.value;
         pointOntoEllipse(ellipseO, cx, cy, po);
         pointOntoEllipse(ellipseD, ellipseO.cx.baseVal.value, ellipseO.cy.baseVal.value, p, 10);
         p.x2 = po.x + (p.x - po.x)*2/3;
         p.y2 = po.y + (p.y - po.y)*2/3;
         p.x1 = po.x + (p.x - po.x)*1/3;
         p.y1 = po.y + (p.y - po.y)*1/3;
         posTriangleArrow(polygonPoints, ellipseD, p);
         if(text) {
            text.setAttribute('x', (p.x + po.x) / 2);
            text.setAttribute('y', (p.y + po.y) / 2 - 5);
         }
      }
   }

   // utility function to position a point at the right place during a movement.
   // see movePoints for usage
   function newPos(origCoord, origCoord0, origCoordFin, otherCoord, otherOrigCoord0, otherOrigCoordFin, size, d, otherSize) {
      var percent;
      if(!otherSize) {
         percent = (origCoord - origCoord0) / size;
      }
      else if(!size) {
         percent = (otherCoord - otherOrigCoord0) / otherSize;
      }
      else if(otherSize > size) {
         percent = (otherCoord - otherOrigCoord0) / otherSize;
      }
      else {
         percent = (origCoord - origCoord0) / size;
      }

      return origCoord + Math.abs(percent) * d;
   }

   pkg.stateSetBackgroundColor = function (index, state, color) {
      var s = svgs[index];
      if(s) {
         var state = s.getElementById(btoa(pkg.getStringValueFunction(state)));
         if(state) {
            getBigEllipse(state).setAttribute('fill', color);
         }
      }
   };

   pkg.stateRemoveBackgroundColor = function (index, state) {
      pkg.stateSetBackgroundColor(index, state, 'transparent');
   };

   pkg.transitionSetColor = function (index, startState, symbol, endState, color) {
      var s = svgs[index];
      startState = pkg.getStringValueFunction(startState);
      endState   = pkg.getStringValueFunction(endState);
      if(s) {
         var edge = s.getElementById(btoa(startState) + ' ' + btoa(endState));
         if(edge) {
            edge.querySelector('text').setAttribute('fill', color);
            edge.querySelector('polygon').setAttribute('fill', color);
            edge.querySelector('polygon').setAttribute('stroke', color);
            edge.querySelector('path').setAttribute('stroke', color);
         }
      }
   };

   function handlePulse(text, polygon, path, step, pulseTime) {
      if(step) {
            text.style.transition = text.style.webkitTransition = text.style.msTransition = polygon.style.transition = polygon.style.webkitTransition = polygon.style.msTransition = path.style.transition = path.style.webkitTransition = path.style.msTransition = '';
      }
      else {
         text.removeAttribute('fill');
         polygon.setAttribute('fill', 'black');
         polygon.setAttribute('stroke', 'black');
         path.setAttribute('stroke', 'black');
         text.style.transition = text.style.webkitTransition = text.style.msTransition = polygon.style.transition = polygon.style.webkitTransition = polygon.style.msTransition = path.style.transition = path.style.webkitTransition = path.style.msTransition = pulseTime + 'ms';
         setTimeout(handlePulse, pulseTime/2, text, polygon, path, 1);
      }
   }
   pkg.transitionPulseColor = function (index, startState, symbol, endState, color, pulseTime) {
      var s = svgs[index];
      if(s) {
         var edge = s.getElementById(btoa(startState) + ' ' + btoa(endState));
         if(edge) {
            var text    = edge.querySelector('text'),
                polygon = edge.querySelector('polygon'),
                path    = edge.querySelector('path');

            text.setAttribute('fill', color);
            polygon.setAttribute('fill', color);
            polygon.setAttribute('stroke', color);
            path.setAttribute('stroke', color);
            setTimeout(handlePulse, pulseTime/2, text, polygon, path, 0, pulseTime);
         }
      }
   };

   pkg.transitionRemoveColor = function (index, startState, symbol, endState) {
      var s = svgs[index];
      if(s) {
         var edge = s.getElementById(btoa(startState) + ' ' + btoa(endState));
         if(edge) {
            edge.querySelector('text').removeAttribute('fill');
            edge.querySelector('polygon').setAttribute('fill', 'black');
            edge.querySelector('polygon').setAttribute('stroke', 'black');
            edge.querySelector('path').setAttribute('stroke', 'black');
         }
      }
   };

   // move the points of a path during a movement
   // Parameters:
   // - path if the path to move
   // - origPath is the same path, before any movement
   // - dx, dy is how much the cursor of the user has moved
   // - start / max limit the indexes of the points of the path to move
   // - origSegStart / origSegEnd are the begining / ending of the path
   function movePoints(origSegStart, origSegEnd, path, origPath, start, max, dx, dy) {
      var width  = Math.abs(origSegEnd.x - origSegStart.x),
          height = Math.abs(origSegEnd.y - origSegStart.y);

      for(var seg,origSeg, i=start; i <= max; ++i) {
         seg = path.getItem(i);
         origSeg = origPath.getItem(i);
         if(seg.pathSegType === SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS) {
            seg.x1 = newPos(origSeg.x1, origSegStart.x, origSegEnd.x, origSeg.y1, origSegStart.y, origSegEnd.y, width, dx, height);
            seg.y1 = newPos(origSeg.y1, origSegStart.y, origSegEnd.y, origSeg.x1, origSegStart.x, origSegEnd.x, height, dy, width);
            seg.x2 = newPos(origSeg.x2, origSegStart.x, origSegEnd.x, origSeg.y2, origSegStart.y, origSegEnd.y, width, dx, height);
            seg.y2 = newPos(origSeg.y2, origSegStart.y, origSegEnd.y, origSeg.x2, origSegStart.x, origSegEnd.x, height, dy, width);
         }
         seg.x = newPos(origSeg.x, origSegStart.x, origSegEnd.x, origSeg.y, origSegStart.y, origSegEnd.y, width, dx, height);
         seg.y = newPos(origSeg.y, origSegStart.y, origSegEnd.y, origSeg.x, origSegStart.x, origSegEnd.x, height, dy, width);
      }
   }

   pkg.prompt = function(title, descr, def, fun) {
      fun(window.prompt(title + ': ' + descr, def));
   };

   _("fr", "New transition", "Nouvelle transition");
   _("fr", "Name of the state", "Nom de l’état");
   _("fr", "Please give a comma-separated list of labels.\nYou can suround special characters with simple or double quotes.", "Veuillez donner les symboles de la transition en les séparant par des vigules.\nVous pouvez encadrer les caractères spéciaux par des guillemets simples ou doubles.");
   _("fr", "Sorry, but you can't remove the initial state.", "Désolé, mais vous ne pouvez pas supprimer l’état initial.");
   _("fr", "Which name do you want for the state ?", "Quel nom voulez-vous donner à l’état ?");
   _("fr", "Sorry, but a state is already named like this.", "Désolé, mais un état porte déjà ce nom.");
   _("fr", "Sorry, there is already a transition between these states in this way.", "Désolé, il y a déjà une transition dans ce sens entre ces états.");

   
})(window.AutomataDesigner = {}, window.AutomataDesignerGlue || (window.AutomataDesignerGlue = {}), this);