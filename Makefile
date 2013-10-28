all: js/boot.js minify-css minify-html dirlist.txt clean-src clean-git

js/boot.js: js/lib/libD/1.0/core.js js/lib/libD/1.0/numbers.js js/lib/libD/1.0/selection.js js/lib/libD/1.0/sizepos.js js/lib/libD/1.0/notify.js js/lib/libD/1.0/ws.js js/lib/libD/1.0/fx.js js/lib/libD/1.0/wm.js js/lib/libD/1.0/jso2dom.js js/lib/hammer.min.js js/mousewheel.js js/getFile.js js/set.js js/mappingfunction.js js/automata.js js/automaton2dot.js js/audescript.js js/automatadesigner.js js/lib/fileSaver.js js/gui.js js/touch2click.js js/lib/codemirror/lib/codemirror.js js/codemirror-audescript/audescript.js
	uglifyjs $^ --screw-ie8 --mangle --compress > js/boot.js

clean-src:
	rm -rf Makefile js/getFile.js js/lib/libD/1.0/*.js js/lib/libD/1.0/jso2dom.js js/lib/hammer.min.js js/mousewheel.js js/set.js js/mappingfunction.js js/automata.js js/automaton2dot.js js/audescript.js js/automatadesigner.js js/lib/fileSaver.js js/gui.js js/touch2click.js js/lib/codemirror/lib/codemirror.js js/codemirror-audescript/audescript.js

clean-git:
	rm -rf .git
	
dirlist.txt:
	find quiz examples-automata algos -type f > dirlist.txt

minify-css:
	css=`uglifycss style/gui.css`;\
	echo "$$css" > style/gui.css

# this breaks things
minify-html:
# 	html=`nodejs -e "console.log(\
# 			require('html-minifier').minify(\
# 				require('fs').readFileSync(\
# 					'index.html',\
# 					'utf8' \
# 				 ), {\
# 					removeComments: true,\
# 					removeCommentsFromCDATA: true,\
# 					collapseWhitespace: true,\
# 					collapseBooleanAttributes: true\
# 				}\
# 			)\
# 		);"`;\
# 	echo "$$html" > index.html
clean:
	rm -rf js/boot.js dirlist.txt
