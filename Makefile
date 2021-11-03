all: dist

dist: $(shell find -type f) node_modules
	npm run build

node_modules:
	npm install

clean:
	rm -rf dist node_modules

