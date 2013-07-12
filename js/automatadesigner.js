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

   // set current automaton's SVG 
   pkg.setSVG = function (svg, index) {
      var svgWorkingNode;
      if(index === pkg.currentIndex) {
         if(typeof svg === "string") {
            pkg.svgContainer.innerHTML = svg.replace(/<\?[\s\S]*\?>/g, '').replace(/<![^>]*>/g, '');
         }
         else {
            pkg.svgContainer.textContent = '';
            console.log(svg.cloneNode(true));
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
         setInitialState(svgWorkingNode.getElementById(btoa(workingInitialStateArrow.querySelector('title').textContent.substr(8))));
         // 8 : size of "_begin->"
      }
      pkg.setCurrentIndex(pkg.currentIndex);
   };

   // Choose the current automaton
   pkg.setCurrentIndex = function (index) {
      pkg.cleanSVG(pkg.currentIndex);
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
   pkg.cleanSVG = function (index) {
      if(pathEditor && pathEditor.parentNode) {
         pathEditor.parentNode.removeChild(pathEditor);
         pathEditor = null;
      }
      if(svgs[index]) {
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

   pkg.enabled = true; // if the editor is currently enabled

   // enable the editor (default : the editor is enabled)
   pkg.enable = function () {
      pkg.enabled = true;
      pkg.redraw();
   };

   // disable the editor. IMPORTANT: If the editor gets hidden, disable it or things will break
   pkg.disable = function () {
      pkg.enabled = false;
   };

   // pkg.redraw the editor. IMPORTANT: call this whenever you mess around with the svg container.
   pkg.redraw = function () {
      if(pkg.svgNode) {
         var centerX = pkg.svgNode.viewBox.baseVal.x + pkg.svgNode.viewBox.baseVal.width/2;
         var centerY = pkg.svgNode.viewBox.baseVal.y + pkg.svgNode.viewBox.baseVal.height/2;
         pkg.setViewBoxSize();
         pkg.svgNode.viewBox.baseVal.x = centerX - pkg.svgNode.viewBox.baseVal.width/2;
         pkg.svgNode.viewBox.baseVal.y = centerY - pkg.svgNode.viewBox.baseVal.height/2;
      }
   };


   // reset the viewBox size (uses the size of the svg container and the zoom level to do it)
   pkg.setViewBoxSize = function () {
      var w = pkg.svgContainer.offsetWidth;
      if(w) {
         pkg.svgNode.viewBox.baseVal.width  = (pkg.svgNode.width.baseVal.value  = pkg.svgContainer.offsetWidth) / pkg.svgZoom;
         pkg.svgNode.viewBox.baseVal.height = (pkg.svgNode.height.baseVal.value = pkg.svgContainer.offsetHeight) / pkg.svgZoom;
      }
   };

   // Retrieve the code of the automaton #index, svg code included.
   // if the <svg> representation is not desired (e.g. you need a cleaner visual representation of the automaton),
   // set withoutSVG to true
   pkg.getAutomatonCode = function (index, withoutSVG) {
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

      var code = atob(initialStates[index].id) + '\n';

      for(i=0, len = states.length; i < len; ++i) {
         code += states[i] + '\n';
      }

      code += '\n';

      for(i=0, len = finalStates.length; i < len; ++i) {
         code += finalStates[i] + '\n';
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
               code +=  JSON.stringify(f) + ' ' + symbols[s] + ' ' + JSON.stringify(t) + '\n';
            }
         }
      }
      return code + (withoutSVG ? '':'\n<representation type="image/svg+xml">\n' + pkg.outerHTML(svgs[index]).trim() + '\n</representation>\n');
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
      function svgcursorPoint(evt){ // thx http://stackoverflow.com/questions/5901607/svg-coordiantes
         var pt = pkg.svgNode.createSVGPoint();
         pt.x = evt.clientX;
         pt.y = evt.clientY;
         var a = pkg.svgNode.getScreenCTM();
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
            posTriangleArrow(nodeMoving._arrow, nodeMoving._ellipse, seg);
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
      function viewBoxMove(e) {
         pkg.svgNode.viewBox.baseVal.x = coords.viewBoxX - (e.clientX - coords.x)/pkg.svgZoom;
         pkg.svgNode.viewBox.baseVal.y = coords.viewBoxY - (e.clientY - coords.y)/pkg.svgZoom;
      }

      pkg.svgContainer.addEventListener('mousedown', function(e) {
         if(!e.button) { // left button
            if(nodeMoving = parentHasClass(e.target, 'pathedit-handle')) {
               coords = {
                  x:e.clientX,
                  y:e.clientY
               };
               pkg.svgContainer.onmousemove = nodeMoving._mousemove;
            }
            else {
               pkg.cleanSVG(pkg.currentIndex);

               if(nodeMoving = parentHasClass(e.target, 'node')) {
                  if(pkg.svgContainer.onmousemove === nodeBinding) {
                     var id = nodeEdit.id + ' ' + nodeMoving.id;
                     if(document.getElementById(id)) {
                        // Désolé, une fèche existe déjà entre ces deux états dans ce sens.
                        alert(_('Sorry, there is already a transition between these states in this way.'));
                        pkg.svgNode.removeChild(pathEdit);
                        pkg.svgContainer.onmousemove = null;
                        return;
                     }
                     var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                     g.id = id;
                     g.setAttribute('class', 'edge');
                     var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                     title.textContent = atob(nodeEdit.id) + '->' + atob(nodeMoving.id);
                     g.appendChild(title);

                     var polygon = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');

                     polygon.setAttribute('fill', 'black');
                     polygon.setAttribute('stroke', 'black');

                     var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                     text.textContent = format_transition(prompt(_("New transition: ") + _("Please give the list of this transitions's symbols separating them by a comma.\nIn case of special characters, put symbols between double quotes; escaping characters with an antislash is possible."), '') || "\\e");
                     text.setAttribute('text-anchor', 'middle');
                     text.setAttribute('font-family', 'Times Roman,serif');
                     text.setAttribute('font-size', '14.00');
                     cleanTransitionPos(pathEdit, polygon, text, nodeEdit, nodeMoving);
                     g.appendChild(pathEdit);
                     g.appendChild(polygon);
                     g.appendChild(text);
                     pkg.svgNode.querySelector('g').appendChild(g);
                     pkg.svgContainer.onmousemove = null;
                     nodeList[atob(nodeMoving.id)].t.push([g, false]); // false : state is not origin
                     if(nodeEdit !== nodeMoving) {
                        nodeList[atob(nodeEdit.id)].t.push([g, true]); // true : state is origin
                     }
                  }
                  else if(e.shiftKey) {
                     nodeEdit = nodeMoving;
                     pkg.svgContainer.onmousemove = nodeBinding;
                     pathEdit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                     pathEdit.setAttribute('fill', 'none');
                     pathEdit.setAttribute('stroke', 'black');

                     var ellipse = getBigEllipse(nodeMoving);
                     var pt = svgcursorPoint(e), p = pointOntoEllipse(ellipse, pt.x, pt.y);
                     pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegMovetoAbs(p.x, p.y));
                     pathEdit.pathSegList.appendItem(pathEdit.createSVGPathSegCurvetoCubicAbs(pt.x, pt.y, p.x, p.y,pt.x, pt.y));
                     pkg.svgNode.appendChild(pathEdit);
                  }
                  else if(e.ctrlKey) {
                     // initial state
                     setInitialState(nodeMoving);
                  }
                  else {
                     pkg.svgContainer.style.cursor = "move";
                     pkg.svgContainer.onmousemove = nodeMove;
                     coords = {
                        x:e.clientX,
                        y:e.clientY,
                        ellipse:nodeMoving.querySelectorAll('ellipse'),
                        text:nodeMoving.querySelector('text'),
                     };
                     coords.cx = parseFloat(coords.ellipse[0].getAttribute('cx'));
                     coords.cy = parseFloat(coords.ellipse[0].getAttribute('cy'));
                     coords.tx = parseFloat(coords.text.getAttribute('x'));
                     coords.ty = parseFloat(coords.text.getAttribute('y'));
                     if(coords.ellipse[1]) {
                        coords.cx1 = parseFloat(coords.ellipse[1].getAttribute('cx'));
                        coords.cy1 = parseFloat(coords.ellipse[1].getAttribute('cy'));
                     }

                     coords.t = [];
                     nodeMovingData = nodeList[atob(nodeMoving.id)];
                     var n          = nodeMovingData;
                     for(var i=0, len = n.t.length; i < len; ++i) {
                        coords.t[i] = [n.t[i], n.t[i][0].cloneNode(true)];
                     }
                  }
               }
               else if(nodeMoving = parentHasClass(e.target, 'edge')) {
                  if(e.ctrlKey) {
                     var tid = nodeMoving.id.split(' ');

                     cleanTransitionPos(
                        nodeMoving.querySelector('path'),
                        nodeMoving.querySelector('polygon'),
                        nodeMoving.querySelector('text'),
                        document.getElementById(tid[0]),
                        document.getElementById(tid[1])
                     );
                  }
                  else if(e.target.nodeName === 'text') {
                     nodeMoving = e.target;
                     coords = [e.clientX, e.clientY, parseFloat(e.target.getAttribute('x')), parseFloat(e.target.getAttribute('y'))];
                     pkg.svgContainer.onmousemove = labelMove;
                     pkg.svgContainer.cursor = 'move';
                  }
                  else if(!e.shiftKey) {
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
               }
               else if(!pkg.svgContainer.onmousemove) {
                  coords = {x:e.clientX, y:e.clientY, viewBoxX:pkg.svgNode.viewBox.baseVal.x, viewBoxY:pkg.svgNode.viewBox.baseVal.y};
                  pkg.svgContainer.onmousemove = viewBoxMove;
               }
            }
         }
         else {
            if(pathEditor) {
               pkg.svgNode.removeChild(pathEditor);
               pathEditor = null;
            }
            
            if(e.button === 1) {
               // moving viewBox
               coords = {x:e.clientX, y:e.clientY, viewBoxX:pkg.svgNode.viewBox.baseVal.x, viewBoxY:pkg.svgNode.viewBox.baseVal.y};
               pkg.svgContainer.onmousemove = viewBoxMove;
            }
            else if(e.button === 2) {
               if(nodeMoving = parentHasClass(e.target, 'node')) {

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
                     ry = parseFloat(ellipses[0].getAttribute('ry')) - 4;
                     ellipse = ellipses[0];
                  }
                  else {
                     ellipse = ellipses[0].cloneNode(false);
                     ry = parseFloat(ellipse.getAttribute('ry')) + 4;
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
            }
         }
      }, false);

      // move event when two nodes must be bound (the transition is following the cursor)
      function nodeBinding(e) {
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

      pkg.svgContainer.addEventListener('dblclick', function(e) {
         if(nodeEdit = parentHasClass(e.target, 'node')) {
            if(e.ctrlKey) { // remove node
               if(nodeEdit === initialState) {
                  alert(_("Sorry, but you can't remove the initial state."));
               }
               else {
                  var tid = atob(nodeEdit.id);
                  var n = nodeList[tid];
                  for(var i in n.t) {
                     deleteTransition(n.t[i][0], tid);
                  }
                  delete nodeList[tid];
                  nodeEdit.parentNode.removeChild(nodeEdit);
               }
            }
            else if(!e.button) { // rename node
               var text = nodeEdit.querySelector('text');
               var t = prompt(_("Which name do you want for the new state ?"), text.textContent);
               if(t) {
                  var tb = btoa(t);
                  var existingNode;
                  if(existingNode = pkg.svgNode.getElementById(tb)) {
                     if(nodeEdit !== existingNode) {
                        alert(_("Sorry, but a state is already named like this."));
                     }
                  }
                  else {
                     var oldid = atob(nodeEdit.id),
                         n = nodeList[oldid];
                     for(var i=0, len = n.t.length; i < len; ++i) {
                        var tid = n.t[i][0].id.split(' ');
                        if(tid[0] === tid[1]) {
                           n.t[i][0].id = tb + ' ' + tb;
                           n.t[i][0].querySelector('title').textContent = t + '->' + t;
                        }
                        else if(n.t[i][1]) {// if node is origin
                           n.t[i][0].id = tb + ' ' + tid[1];
                           n.t[i][0].querySelector('title').textContent = t + '->' + atob(tid[1]);
                        }
                        else {
                           n.t[i][0].id = tid[0] + ' ' + tb;
                           n.t[i][0].querySelector('title').textContent = atob(tid[0]) + '->' + t;
                        }
                     }
                     nodeList[t] = nodeList[oldid];
                     delete nodeList[oldid];
                     nodeEdit.querySelector('title').textContent = text.textContent = t;
                     nodeEdit.setAttribute('id', tb);
                  }
               }
            }
         }
         else if(nodeEdit = parentHasClass(e.target, 'edge')) {
            if(e.ctrlKey) { // delete transition
               deleteTransition(nodeEdit, null);
            }
            else {
               var text = nodeEdit.querySelector('text');
               var t = prompt(_("Please give the list of this transitions's symbols separating them by a comma.\nIn case of special characters, put symbols between double quotes; escaping characters with an antislash is possible."), text.textContent);
               if(t) {
                  text.textContent = format_transition(t);
               }
            }
         }
         else if(!e.ctrlKey && !e.shiftKey) { // new state
            // node creation
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'node');
            var id = 0;
            while(id in nodeList) {
               ++id;
            }
            g.id = btoa(id);
            var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = id;
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

      }, false);

      // event when a node is moved
      function nodeMove(e) {
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
            setInitialState(nodeMoving); // FIXME: isn't this inefficient ?
         }

         var nodes, n = nodeMovingData;
         for(var i=0, len = n.t.length; i < len; ++i) {
            nodes = coords.t[i][0][0].id.split(" ");
            var seg, origSeg,
                segs     = coords.t[i][0][0].querySelector('path').pathSegList,
                origSegs = coords.t[i][1].querySelector('path').pathSegList,
                text     = coords.t[i][0][0].querySelector('text'),
                textOrig = coords.t[i][1].querySelector('text'),
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
               text.setAttribute('x', parseFloat(textOrig.getAttribute('x')) + (coefTextX*dx));
               text.setAttribute('y', parseFloat(textOrig.getAttribute('y')) + (coefTextY*dy));
            } else {
               var origSegStart = origSegs.getItem(0),
                   origSegEnd = origSegs.getItem(segs.numberOfItems-1),
                   width  = Math.abs(origSegEnd.x - origSegStart.x),
                   height = Math.abs(origSegEnd.y - origSegStart.y),
                   textOrigX = parseFloat(textOrig.getAttribute('x')),
                   textOrigY = parseFloat(textOrig.getAttribute('y'));
                   
               if(coords.t[i][0][1]) { // if the state is the origin
                  var ech = origSegStart;
                  origSegStart = origSegEnd;
                  origSegEnd = ech;
               }

               text.setAttribute('x', newPos(textOrigX, origSegStart.x, origSegEnd.x, textOrigY, origSegStart.y, origSegEnd.y, width, dx, height, dy));
               text.setAttribute('y', newPos(textOrigY, origSegStart.y, origSegEnd.y, textOrigX, origSegStart.x, origSegEnd.x, height, dy, width, dx));

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

            if(!coords.t[i][0][1]) { // the state is the destination, we move the arrow
               var polygonPoints = coords.t[i][0][0].querySelector('polygon').points,
                   pointsOrig    = coords.t[i][1].querySelector('polygon').points,
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

      window.addEventListener('keydown', function (e) {
         if(e.keyCode === 27) {
            if(pkg.svgContainer.onmousemove === nodeBinding) {
               pathEdit.parentNode.removeChild(pathEdit);
               pkg.svgContainer.onmousemove = null;
            }
         }
      }, false);

      listenMouseWheel(function(e, delta) {
         if(!pkg.enabled) {
            return;
         }

         var pt = svgcursorPoint(e);
         var oldZoom = pkg.svgZoom;
         pkg.svgZoom = Math.round((pkg.svgZoom + delta * 0.1)*10)/10;
         if(!pkg.svgZoom) {
            pkg.svgZoom = 0.1;
            return;
         }
         pkg.setViewBoxSize();
         pkg.svgNode.viewBox.baseVal.x = pt.x - (pt.x - pkg.svgNode.viewBox.baseVal.x)*oldZoom/pkg.svgZoom;
         pkg.svgNode.viewBox.baseVal.y = pt.y - (pt.y - pkg.svgNode.viewBox.baseVal.y)*oldZoom/pkg.svgZoom;
      });

      // event when a transition label is moved
      function labelMove(e) {
         nodeMoving.setAttribute('x', (e.clientX - coords[0])/pkg.svgZoom + coords[2]);
         nodeMoving.setAttribute('y', (e.clientY - coords[1])/pkg.svgZoom + coords[3]);
      }

      pkg.svgContainer.addEventListener('mouseup', function() {
         if(pkg.svgContainer.onmousemove !== nodeBinding) {
            pkg.svgContainer.style.cursor = "";
            pkg.svgContainer.onmousemove = null;
         }
      }, false);

      pkg.svgContainer.ondragstart = pkg.svgContainer.onselectstart = pkg.svgContainer.oncontextmenu = function(e) {
         e.preventDefault();
         return false;
      };

      pkg.clearSVG(pkg.currentIndex);
   };

   //set the initial state for the current automaton
   function setInitialState (node) {
      var path, polygon, title;

      if(!initialStateArrow) {
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
      else {
         path    = initialStateArrow.querySelector('path');
         polygon = initialStateArrow.querySelector('polygon');
         title   = initialStateArrow.querySelector('title');
      }
      var ellipse = getBigEllipse(node), cy = ellipse.cy.baseVal.value, cx = ellipse.cx.baseVal.value, rx = ellipse.rx.baseVal.value;
      path.setAttribute('d', 'M' + (cx-rx-38) + ',' + cy +
                             'C' + (cx-10-(rx+28)*2/3) + ',' + cy +
                             ' ' + (cx-10-(rx+28)/3)   + ',' + cy +
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
      if("pkg.outerHTML" in node) {
         return node.pkg.outerHTML;
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
   function parentHasClass(node, c) {
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
         cy = parseFloat(ellipse.getAttribute('cy'));
      }
      if(!cx) {
         cx = parseFloat(ellipse.getAttribute('cx'));
      }

      var alpha = Math.atan((x-cx)/(y-cy)),
          r     = parseFloat(ellipse.getAttribute('ry')) + (distanceToEllipse || 0);

      if(!p) {
         p = {};
      }

      if(y >= cy) {
         if(x > cx) {
            p.x = cx - r * Math.cos(alpha - Math.PI/2) + 2 * r * Math.abs(Math.cos(alpha - Math.PI/2));
            p.y = cy + r * Math.sin(alpha - Math.PI/2) + 2 * r * Math.abs(Math.sin(alpha - Math.PI/2));
         }
         else {
            p.x = cx - r * Math.cos(alpha - Math.PI/2) - 2 * r * Math.abs(Math.cos(alpha - Math.PI/2));
            p.y = cy + r * Math.sin(alpha - Math.PI/2) + 2 * r * Math.abs(Math.sin(alpha - Math.PI/2));
         }
      }
      else {
         p.x = cx - r * Math.cos(alpha - Math.PI/2);
         p.y = cy + r * Math.sin(alpha - Math.PI/2);
      }
      return p;
   }

   // Given a node representing a state, gives the biggest ellipse of the node in case of a final state.
   // Otherwise, give the only ellipse of the node
   function getBigEllipse(n) {
      var ellipses = n.querySelectorAll('ellipse');
      return ellipses[1] || ellipses[0];
   }

   // Position the triangle <polygon /> of a transition correctly on the svg <ellipse /> at point p{x,y}.
   // Parameters :
   //  - polygon : the SVG node representing the triangle
   //  - ellipse : the SVG node representing the ellipse
   //  - cx, cy (optional) : the center of the ellipse, if already known
   function posTriangleArrow(polygon, ellipse, p, cx, cy) {

      if(!cy) {
         cy = parseFloat(ellipse.getAttribute('cy'));
      }

      if(!cx) {
         cx = parseFloat(ellipse.getAttribute('cx'));
      }


      var beta   = Math.PI/2 - (Math.atan((cx-p.x)/(cy-p.y)) || 0),
          haut   = pkg.svgNode.createSVGPoint(),
          bas    = pkg.svgNode.createSVGPoint(),
          haut2  = pkg.svgNode.createSVGPoint(),
          pointe = pkg.svgNode.createSVGPoint();

      haut.y = p.y - 3.5 * (Math.cos(beta) || 1);
      haut.x = p.x + 3.5 * (Math.sin(beta) || 0);

      bas.y = p.y + 3.5 * (Math.cos(beta) || 1);
      bas.x = p.x - 3.5 * (Math.sin(beta) || 0);

      haut2.x = haut.x;
      haut2.y = haut.y;

      pointOntoEllipse(ellipse, p.x, p.y, pointe, 0, cx, cy);

      while(polygon.points.numberOfItems) {
         polygon.points.removeItem(0);
      }

      polygon.points.appendItem(haut);
      polygon.points.appendItem(pointe);
      polygon.points.appendItem(bas);
      polygon.points.appendItem(haut2);
   }

   // Make a transition straighforward.
   // Parameters:
   //  - path: the <path /> node of the transition
   //  - polygon: the triangle node of the transition
   //  - text: the <text /> label node of the transition
   //  - stateOrig: the node representing the start state of the transition
   //  - stateDest: the node representing the end state of the transition
   function cleanTransitionPos(path, polygon, text, stateOrig, stateDest) {
      if(stateOrig === stateDest) {
         while(path.pathSegList.numberOfItems > 3) {
            path.pathSegList.removeItem(2);
         }
         while(path.pathSegList.numberOfItems < 3) {
            path.pathSegList.appendItem(path.createSVGPathSegCurvetoCubicAbs(0,0,0,0,0,0));
         }
         var po = path.pathSegList.getItem(0);
         var pi = path.pathSegList.getItem(1);
         var p = path.pathSegList.getItem(2);
         var ellipse = getBigEllipse(stateDest);
         var cx = parseFloat(ellipse.getAttribute('cx')),
             cy = parseFloat(ellipse.getAttribute('cy')),
             ry = parseFloat(ellipse.getAttribute('ry')),
             rx = parseFloat(ellipse.getAttribute('rx')),
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
         posTriangleArrow(polygon, ellipse, p, cx+rx/2, cy+ry-y);
         text.setAttribute('x', pi.x);
         text.setAttribute('y', (pi.y - 5));
      }
      else {
         while(path.pathSegList.numberOfItems > 2) {
            path.pathSegList.removeItem(2);
         }
         var p = path.pathSegList.getItem(path.pathSegList.numberOfItems-1);
         var po = path.pathSegList.getItem(0);
         var ellipseD = getBigEllipse(stateDest);
         var ellipseO = getBigEllipse(stateOrig);
         var cx = parseFloat(ellipseD.getAttribute('cx')), 
             cy = parseFloat(ellipseD.getAttribute('cy'));
         pointOntoEllipse(ellipseO, cx, cy, po);
         pointOntoEllipse(ellipseD, parseFloat(ellipseO.getAttribute('cx')), parseFloat(ellipseO.getAttribute('cy')), p, 10);
         p.x2 = po.x + (p.x - po.x)*2/3;
         p.y2 = po.y + (p.y - po.y)*2/3;
         p.x1 = po.x + (p.x - po.x)*1/3;
         p.y1 = po.y + (p.y - po.y)*1/3;
         text.setAttribute('x', (p.x + po.x) / 2);
         text.setAttribute('y', (p.y + po.y) / 2 - 5);
         posTriangleArrow(polygon, ellipseD, p);
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
         var state = s.getElementById(btoa(state));
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

   _("fr", "New transition: ", "Nouvelle transition :");
   _("fr", "Please give the list of this transitions's symbols separating them by a comma.\nIn case of special characters, put symbols between double quotes; escaping characters with an antislash is possible.", "Veuillez donner les symboles de cette transition en les séparant par des vigules.\nEn cas de caractères spéciaux, encadrez par des guillemets doubles. La barre oblique permet d'échapper les caractères.");
   _("fr", "Sorry, but you can't remove the initial state.", "Désolé, mais vous ne pouvez pas supprimer l'état initial.");
   _("fr", "Which name do you want for the new state ?", "Quel nom voulez-vous donner au nouvel état ?");
   _("fr", "Sorry, but a state is already named like this.", "Désolé, mais un état porte déjà ce nom.");

   
})(window.AutomataDesigner = {}, window.AutomataDesignerGlue || (window.AutomataDesignerGlue = {}), this);