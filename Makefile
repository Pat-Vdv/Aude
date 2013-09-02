js/boot.js: js/lib/libD/1.0/core.js js/lib/libD/1.0/numbers.js js/lib/libD/1.0/selection.js js/lib/libD/1.0/sizepos.js js/lib/libD/1.0/notify.js js/lib/libD/1.0/ws.js js/lib/libD/1.0/fx.js js/lib/libD/1.0/wm.js js/lib/libD/1.0/jso2dom.js js/lib/hammer.min.js js/mousewheel.js js/set.js js/automata.js js/automaton2dot.js js/automataJS.js js/automatadesigner.js js/lib/fileSaver.js js/gui.js js/touch2click.js js/lib/codemirror/lib/codemirror.js js/codemirror-automataJS/automataJS.js  
	uglifyjs $^ --screw-ie8 --mangle --compress > js/boot.js

-src:
	rm -rf js/lib/libD js/lib/libD/1.0/jso2dom.js js/lib/hammer.min.js js/mousewheel.js js/set.js js/automata.js js/automaton2dot.js js/automataJS.js js/automatadesigner.js js/lib/fileSaver.js js/gui.js js/touch2click.js js/lib/codemirror/lib/codemirror.js js/codemirror-automataJS/automataJS.js
	
dirlist.txt:
	find quiz examples-automata algos > dirlist.txt

all: js/boot.js clean-src minify-css

minify-css:
	css=`uglifycss style/gui.css`; \
	echo $$css > style/gui.css

clean:
	rm -rf js/boot.js dirlist.txt