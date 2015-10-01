all: dirlist.txt js/audescript/audescript.js

.PHONY: zip uncommited-zip dirlist.txt count-lines clean /tmp/aude-uncommited.zip  /tmp/aude.zip

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
	rm -rf .git .gitignore; \
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
	rm -rf .git .gitignore; \
	cd ..; \
	rm aude.zip; \
	zip -r9 aude.zip aude; \
	rm -rf aude;

clean:
	rm -rf dirlist.txt

.PHONY:
count-lines:
	echo "  lines\t size" && cat `find | grep -E '(\.html|\.js|\.ajs|\.css|Makefile|\.ts)$$' | grep -v ./js/lib/ | grep -v ./node_modules/ | grep -v ./doc/` | wc -l -c
