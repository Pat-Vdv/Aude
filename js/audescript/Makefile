all: audescript.js

audescript.js: audescript.ts
	cp audescript.ts audescript.bundle.ts
	echo >> audescript.bundle.ts
	cat audescript.identifier.js >> audescript.bundle.ts
	tsc audescript.bundle.ts --sourceMap --module commonjs
	echo -n "(function(that) {" > audescript.js
	cat audescript.bundle.js >> audescript.js
	echo "\n}(this));" >> audescript.js
	mv GenericLexer.bundle.js.map GenericLexer.js.map
	rm audescript.bundle.js
	sed -i s/audescript.bundle.ts/audescript.ts/g audescript.js.map
	chmod +x audescript.js

clean:
	rm -f audescript.js.part audescript.js
