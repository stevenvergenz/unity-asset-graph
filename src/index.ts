import { writeFile } from 'fs/promises';

import { Database } from './database';

const argBase = process.argv.indexOf(__filename);
console.log(`argBase: ${argBase}`);
const command = process.argv[argBase + 1];

if (command === "extract"){
	const db = new Database();
	db.extract(process.argv[argBase + 2])
	.then(() => db.save(process.argv[argBase + 3]))
	.catch((err: Error) => console.error(err));
}
else if (command === "query") {
	const db = new Database();
	db.load(process.argv[argBase + 2]);
}
