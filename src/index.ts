import { Database } from './database';

async function main(argv: string[]): Promise<void> {
	const command = argv[0];

	if (command === "extract"){
		const db = new Database();
		await db.extract(argv[1]);
		await db.save(argv[2]);
	}
	else if (command === "query") {
		const db = new Database();
		await db.load(argv[1]);

		const subc = argv[2];
		if (subc == "dependencies") {
			console.log(db.formatDependencies(db.findByName(argv[3])));
		}
	}
}

const argBase = process.argv.indexOf(__filename);
main(process.argv.slice(argBase + 1))
.catch(err => console.error(err));
