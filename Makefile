DEST_EXAM?=../aude-exam

all: l10n dirlist.txt js/audescript/audescript.js js/gui.js

.PHONY: zip uncommited-zip dirlist.txt count-lines clean /tmp/aude-uncommited.zip  /tmp/aude.zip l10n count-lines exam

l10n:
	cd l10n && make

dirlist.txt:
	find quiz examples-automata algos l10n/js -type f | sort > dirlist.txt

js/audescript/audescript.js:
	cd js/audescript/ && make

js/gui.js: $(wildcard js/gui/*.js) js/gui/Makefile
	cd js/gui/ && make

uncommited-zip: /tmp/aude-uncommited.zip

/tmp/aude-uncommited.zip:
	if [ "`pwd`" = "/tmp/aude" ]; then \
		echo "Cannot make zip from /tmp/aude"; \
		exit 1; \
	fi; \
	rm -rf /tmp/aude; \
	cp -r . /tmp/aude; \
	cd /tmp/aude; \
	make; \
	echo "Archive built on $$(date -u +%Y-%m-%dT%H:%M:%S%z)" > ARCHIVE_DATE; \
	rm -rf .git .gitignore js/lib/ace-builds/src-min-noconflict; \
	cd ..; \
	rm aude-uncommited.zip; \
	zip -r9 aude-uncommited.zip aude; \
	rm -rf aude;

zip: /tmp/aude.zip
/tmp/aude.zip: .git
	if [ "`pwd`" = "/tmp/aude" ]; then \
		echo "Cannot make zip from /tmp/aude"; \
		exit 1; \
	fi; \
	rm -rf /tmp/aude; \
	git clone .git /tmp/aude; \
	cd /tmp/aude; \
	make; \
	echo "Built from Aude's repository" > ARCHIVE_DATE; \
	git log -n 1 --pretty=oneline >> ARCHIVE_DATE; \
	rm -rf .git .gitignore js/lib/ace-builds/src-min-noconflict js/lib/ace-builds/src-noconflict/snippets/ js/lib/ace-builds/src-noconflict/worker-*; \
	for file in js/lib/ace-builds/src-noconflict/mode-*; do \
		if [ "$$file" != "js/lib/ace-builds/src-noconflict/mode-audescript.js" ]; then \
			rm "$$file"; \
		fi; \
	done; \
	cd ..; \
	rm aude.zip; \
	zip -r9 aude.zip aude; \
	rm -rf aude;

clean:
	rm -rf dirlist.txt js/gui.js

${DEST_EXAM}:
exam:
	mkdir -p "${DEST_EXAM}/l10n"
	cp -r icons index.html js style Makefile "${DEST_EXAM}/"
	cp -r l10n/js l10n/po l10n/pot l10n/makejs.js l10n/Makefile "${DEST_EXAM}/l10n/"
	rm -rf "${DEST_EXAM}/js/gui/gui-quiz.js" "${DEST_EXAM}/js/gui/quiz-editor.js"
	cd "${DEST_EXAM}" && make
	rm -rf "${DEST_EXAM}/js/gui" "${DEST_EXAM}/js/audescript" "${DEST_EXAM}/js/mealy.js" "${DEST_EXAM}/js/moore.js" "${DEST_EXAM}/Makefile" "${DEST_EXAM}/l10n/Makefile" "${DEST_EXAM}/l10n/makejs.js" "${DEST_EXAM}/l10n/po" "${DEST_EXAM}/l10n/pot"
	cp index-exam.html "${DEST_EXAM}/index.html"

count-lines:
	echo "  lines\t size" && cat `find | grep -E '(\.html|\.js|\.ajs|\.css|Makefile|\.ts)$$' | grep -v ./js/lib/ | grep -v ./node_modules/ | grep -v ./doc/` | wc -l -c
