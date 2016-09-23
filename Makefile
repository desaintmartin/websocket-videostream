deploy:
	npm install
	browserify -o www/js/streamWSclient.js video-client.js
	#browserify -o www/js/jpeg-extractor.js node_modules/jpeg-extractor/lib/jpeg-extractor.js
	browserify -o www/js/jpeg-extractor.js jpeg-extractor.js

run:
	node main-server.js
