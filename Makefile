deploy:
	npm install
	browserify -o www/js/streamWSclient.js client/video-client.js

run:
	node .
