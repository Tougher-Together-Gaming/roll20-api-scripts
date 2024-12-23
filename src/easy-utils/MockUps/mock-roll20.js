// mock-roll20.js

global.on = (event, callback) => {
	if (event === "ready") {
		setTimeout(() => {
			console.log("Simulating Roll20 'ready' event...");
			callback();
		}, 1000);
	}
};

global.state = {};
global.log = (message) => {
	console.log(`[Roll20 Log]: ${message}`);
};

global.sendChat = (sender, message) => {
	console.log(`[Chat][${sender}]: ${message}`);
};

