all: dirlist.txt js/audescript/audescript.js

.PHONY: dirlist.txt

dirlist.txt:
	find quiz examples-automata algos l10n/js -type f > dirlist.txt

js/audescript/audescript.js:
	cd js/audescript/ && make

clean:
	rm -rf js/boot.js dirlist.txt

.PHONY:
count-lines:
	echo "  lines\t size" && cat `find | grep -E '(\.html|\.js|\.ajs|\.css|Makefile)$$' | grep -v ./js/lib/ | grep -v ./node_modules/ | grep -v ./doc/` | wc -l -c
