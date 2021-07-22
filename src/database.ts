import { readFile, stat, writeFile } from 'fs/promises';
import { findFiles, getId, getDependencies } from './fsUtils';

export class Asset {
	public db: Database;

	public id: string;
	public name: string;
	public assetSize: number;
	public dependencies: string[];

	public constructor(db: Database, id: string, name: string, assetSize: number = 0, dependencies: string[] = []) {
		this.db = db;
		this.id = id;
		this.name = name;
		this.assetSize = assetSize;
		this.dependencies = dependencies;
	}

	public toJSON(): any {
		return { id: this.id, name: this.name, assetSize: this.assetSize, dependencies: this.dependencies };
	}
}

export class Database {
	public assets: { [id: string]: Asset } = {};

	public async extract(projectPath: string): Promise<void> {
		this.assets = {};

		const metaFiles = await findFiles(projectPath, /\.meta$/);
		console.log("Found files:", metaFiles);
		for (const meta of metaFiles) {
			const id = await getId(meta);
			const name = meta.substr(0, meta.length - 5);
			const size = (await stat(name)).size;
			console.log("getting dependencies of:", name);
			const deps = await getDependencies(name);
			this.assets[id] = new Asset(this, id, name, size, deps);
		}
	}

	public save(outputPath: string): Promise<void> {
		return writeFile(outputPath, JSON.stringify(this));
	}

	public async load(savedPath: string): Promise<void> {
		const readData = await readFile(savedPath, { encoding: 'utf-8' });
		this.assets = JSON.parse(readData);
	}
}
