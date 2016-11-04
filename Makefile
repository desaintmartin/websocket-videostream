deploy:
	npm install
	browserify -o www/js/streamWSclient.js video-client.js

run:
	node .
