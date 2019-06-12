DEST_EXAM?=../aude-exam

all: js/lib/viz/viz.js l10n dirlist.txt js/audescript/audescript.js doc/index.html

.PHONY: zip uncommited-zip dirlist.txt count-lines clean /tmp/aude-uncommited.zip  /tmp/aude.zip l10n count-lines exam prod

l10n:
	cd l10n && make

dirlist.txt:
	find quiz examples-automata algos l10n/js -type f | sort > dirlist.txt

js/audescript/audescript.js:
	cd js/audescript/ && make

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
	rm -rf dirlist.txt

${DEST_EXAM}:
exam:
	mkdir -p "${DEST_EXAM}/l10n"
	cp -r icons index.html js style Makefile "${DEST_EXAM}/"
	cp -r l10n/js l10n/po l10n/pot l10n/makejs.js l10n/Makefile "${DEST_EXAM}/l10n/"
	rm -rf "${DEST_EXAM}/js/gui/gui-quiz.js" "${DEST_EXAM}/js/gui/quiz-editor.js" "${DEST_EXAM}/js/lib/katex" "${DEST_EXAM}/js/lib/ace-builds" "${DEST_EXAM}/js/lib/libD/1.1/css/old" "${DEST_EXAM}/js/lib/libD/1.1/css/default/wm" "${DEST_EXAM}/js/lib/libD/1.1/css/wm.css"
	cd "${DEST_EXAM}" && make
	rm -rf "${DEST_EXAM}/js/audescript" "${DEST_EXAM}/js/mealy.js" "${DEST_EXAM}/js/moore.js" "${DEST_EXAM}/Makefile" "${DEST_EXAM}/l10n/Makefile" "${DEST_EXAM}/l10n/makejs.js" "${DEST_EXAM}/l10n/po" "${DEST_EXAM}/l10n/pot"
	cp index-exam.html "${DEST_EXAM}/index.html"

prod:
	make
	make exam
	cd .. ; rm aude-exam.zip ; zip aude-exam.zip -r aude-exam

js/lib/viz/viz.js:
	cd js/lib/viz; \
	wget https://github.com/mdaines/viz.js/releases/download/v2.1.2/lite.render.js; \
	wget https://github.com/mdaines/viz.js/releases/download/v2.1.2/viz.js; \
	if ! sha1sum -c --status SHA1SUMS; then \
		rm lite.render.js; \
		rm viz.js; \
		exit 1; \
	fi

doc/index.html:
	if [ ! -f "$@" ]; then wget "http://dynalon.github.io/mdwiki/mdwiki-latest-debug.html" -O "$@"; fi
	@if ! [ "$$(sha256sum "$@" | cut -d' ' -f1)" = "52cbf4005207c1d962ee20b2e60d45ed0cc4946117cb4cdc758aee1647d1fe89" ]; then \
		rm "$@"; echo "Checksum mismatch! Please update the Makefile."; exit 1; \
	fi

count-lines:
	echo "  lines\t size" && cat `find | grep -E '(\.html|\.js|\.ajs|\.css|Makefile|\.ts)$$' | grep -v ./js/lib/ | grep -v ./node_modules/ | grep -v ./doc/` | wc -l -c
