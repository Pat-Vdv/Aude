all: dirlist.txt js/audescript/audescript.js

.PHONY: zip uncommited-zip dirlist.txt count-lines clean /tmp/aude-uncommited.zip  /tmp/aude.zip update-www

dirlist.txt:
	find quiz examples-automata algos l10n/js -type f > dirlist.txt

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
	rm -rf .git www .gitignore; \
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
	rm -rf .git www .gitignore; \
	cd ..; \
	rm aude.zip; \
	zip -r9 aude.zip aude; \
	rm -rf aude;

update-www: www
	mkdir -p www-built; \
	cd www-built; \
	rsync  --exclude aude/ -avz --delete www www-built; \
	if [ -d aude ]; then \
		cd aude; \
		if [ "`git --git-dir=./.git log -n 1 --pretty=%H`" != "`git --git-dir=../../.git log -n 1 --pretty=%H`" ]; then \
			git fetch --all; \
			git reset --hard origin/master; \
			make; \
			make zip; \
			cp /tmp/aude.zip ..; \
		fi; \
	else \
		git clone "$$(pwd)/../.git" aude; \
		cd aude; \
		make; \
		make zip; \
		cp /tmp/aude.zip ..; \
	fi; \
	cd ../..; \
	rsync  --exclude aude/.git \
	       --exclude aude/.gitignore \
	       --exclude aude/www  \
	       --exclude aude/www-built \
	       --rsync-path="~/bin/rsync" \
	       -vaz \
	       --delete \
	       www-built/ \
	       jakser@forge.imag.fr:/var/lib/gforge/chroot/home/groups/aude/htdocs/

clean:
	rm -rf js/boot.js dirlist.txt www-built

.PHONY:
count-lines:
	echo "  lines\t size" && cat `find | grep -E '(\.html|\.js|\.ajs|\.css|Makefile|\.ts)$$' | grep -v ./js/lib/ | grep -v ./node_modules/ | grep -v ./doc/` | wc -l -c
