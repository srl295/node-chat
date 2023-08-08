
var net = require("net")


var util = require('util');


var telnetServer = net.createServer()
var ActiveUserList = []
var DisconnectedUserList = []

const PORT = 9000;


const fakenamestr = 'Apple Banana Cherry Dandelion Elephant Foxtail Gerbil Handkerchief ' +
	'Ibex Jello Klondike Llama Mouse Nutmeg Ostrich Penguin Quill Roobois Salad Trex Utahraptor ' +
	'Vulture Walrus Xylophone Yak Zebra';

let fakenames = fakenamestr.split(' ');

telnetServer.on('connection', function (client) {
	client.info = client.remoteAddress + ":" + client.remotePort;
	client.write(`* welcome from ${client.info} at ${now()}\n`);
	client.name = fakenames.pop();
	if (!client.name) {
		fakenames = fakenamestr.split(' ');
		client.name = 'Acorn';
	}
	client.write(`You are ${client.name} - change it with /nick NAME\nThere are ${ActiveUserList.length} here\n`);
	client.write(`* Here: ` + ActiveUserList.map(({name, info}) => `${name} (${info})`).join(',') + '\n');
	ActiveUserList.push(client)
	broadcast(" = " + client.info + " has joined the conversation\r\n", client)
	client.on('data', function (data) {
		const str = data.toString('utf-8');
		console.log(`${now()}\t${client.info}\t${client.name}\t${str.trim()}`);
		if (str.indexOf('/nick ') === 0) {
			const oldname = client.name;
			const newname = str.substring(6).trim();
			if (newname) {
				client.name = newname;
				client.write(`* You are now ${client.name}.\n`);
				broadcast(`was renamed from ${oldname}`, client);
			} else {
				client.write(`* try that again..\n`);
			}
		} else if (str.indexOf('/quit') === 0) {
			client.write(`* Goodbye!\n\n\n`);
			client.destroy();
		} else if (str.indexOf('/who') === 0) {
			client.write(`* Here: ` + ActiveUserList.map(({name, info}) => `${name} (${info})`).join(',') + '\n');
		} else if (str[0] === '/') {
			client.write(`* I don't know this command: ${str.trim()}\n`);
			client.write(`* Commands:  /who /quit /nick\n\n`);
		} else {
			broadcast(data, client);
		}
		client.write('> ');
	})
	client.write('> ');

	client.on('end', function (data) {
		broadcast("has left the conversation\n", client);
		console.log(`${now()}\t${client.info}\t${client.name}\tDISCONNECT`);
	})
	console.log(`${now()}\t${client.info}\t${client.name}\tCONNECT`);
})

function now() {
	return new Date().toLocaleString([], {dateStyle: "short", timeStyle: "short"});
}

function broadcast(message, client) {
	console.log(`${now()}\t${client.info}\t${client.name}\t${message.toString('utf-8').trim()}`);
	var i;
	for (var i = 0; i < ActiveUserList.length; i++) {
		if (client !== ActiveUserList[i]) {
			// debug
			// console.log(util.inspect(ActiveUserList[i], false, null));
			if (ActiveUserList[i].writable === true) {
				ActiveUserList[i].write(client.name + ":\t" + message);
			}
			else {
				DisconnectedUserList.push(ActiveUserList[i]);
				ActiveUserList[i].destroy();
			}
		}
	}

	for (var j = 0; j < DisconnectedUserList.length; j++) {
		ActiveUserList.splice(ActiveUserList.indexOf(DisconnectedUserList[j]), 1);
	}
}

telnetServer.listen(PORT);
console.log(now() + `\t*\t*\tListening on ${PORT}`);
