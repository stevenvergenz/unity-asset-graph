import { exec } from 'child_process';
import { writeFile } from 'fs/promises';

import { Database } from './database.js';
import { visualize } from './visualize.js';

async function main(argv: string[]): Promise<void> {
	const [command, arg1, arg2, arg3] = argv;

	if (command === "extract"){
		const db = new Database();
		await db.extract(arg1);
		await db.save(arg2);
	}
	else if (command === "query") {
		const db = new Database();
		await db.load(arg1);

		const subc = arg2;
		if (subc == "dependencies") {
			console.log(db.formatDependencies(db.findByName(arg3)));
		}
	}
	else if (command === "visualize") {
		const db = new Database();
		await db.load(arg1)

		const svg = visualize(db, 1920, 1080);
		await writeFile(arg2, svg.html());
		exec(`open "${arg2}"`);
	}
}

const argBase = process.argv.findIndex(arg => /extract|query|visualize/.test(arg));
main(process.argv.slice(argBase))
.catch(err => console.error(err));
