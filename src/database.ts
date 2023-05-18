import { readFile, stat, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { SimulationNodeDatum } from 'd3-force';

import { findFiles, getId, getDependencies } from './fsUtils.js';

export class Asset implements SimulationNodeDatum {
	public db: Database;

	public id: string;
	public name: string;
	public path: string;
	public assetSize: number;
	public dependencies: string[];

	public x = 0;
	public y = 0;
	public vx = 0;
	public vy = 0;

	public constructor(db: Database, id: string, name: string, path: string, assetSize: number = 0,
		dependencies: string[] = []) {
		this.db = db;
		this.id = id;
		this.name = name;
		this.path = path;
		this.assetSize = assetSize;
		this.dependencies = dependencies;
	}

	public toJSON(): any {
		return { id: this.id, name: this.name, path: this.path, assetSize: this.assetSize,
			dependencies: this.dependencies };
	}
}

export class Database {
	public projectPath: string;
	public assets: { [id: string]: Asset } = {};

	public async extract(projectPath: string): Promise<void> {
		this.projectPath = resolve(projectPath);
		this.assets = {};

		// filter out Unity root folders with no assets
		let includeRegex: RegExp;
		const assetsInfo = await stat(resolve(this.projectPath, 'Assets'));
		const projectSettingsInfo = await stat(resolve(this.projectPath, 'ProjectSettings'));
		if (assetsInfo?.isDirectory && projectSettingsInfo?.isDirectory) {
			includeRegex = /^(Assets|ProjectSettings)[\\\/].*\.meta$/;
		}
		else {
			includeRegex = /\.meta$/;
		}

		// populate database
		const metaFiles = await findFiles(this.projectPath, includeRegex, null, Infinity, this.projectPath.length + 1);
		console.log(`Found ${metaFiles.length} asset files`);
		for (const meta of metaFiles) {
			const id = await getId(meta);
			const path = meta.substring(0, meta.length - 5);
			const displayName = path.substring(this.projectPath.length + 1).replace(/\\/g, "/");
			const stats = await stat(path);
			if (stats.isFile()) {
				this.assets[id] = new Asset(this, id, displayName, path, stats.size);
			}
		}

		// populate dependencies
		for (const asset of Object.values(this.assets)) {
			asset.dependencies = await getDependencies(asset.path, this);
		}

		// clean out unresolved dependencies
		for (const asset of Object.values(this.assets)) {
			asset.dependencies = asset.dependencies.filter(a => this.assets[a]);
		}
	}

	public save(outputPath: string): Promise<void> {
		return writeFile(outputPath, JSON.stringify(this, null, '\t'));
	}

	public async load(savedPath: string): Promise<void> {
		const readData = await readFile(savedPath, { encoding: 'utf-8' });
		const json = JSON.parse(readData);
		this.projectPath = json.projectPath;
		this.assets = json.assets;
	}

	public findByName(name: string): Asset {
		return Object.values(this.assets).find(a => a.name === name);
	}

	public formatDependencies(asset: Asset, indent = 0): string {
		if (!asset) {
			return "null asset";
		}

		let indentStr = "";
		if (indent > 0) {
			indentStr = "  ".repeat(indent - 1) + " \u2515 ";
		}

		return [indentStr + asset.name, ...asset.dependencies.map(id =>
			this.formatDependencies(this.assets[id], indent + 1))]
			.join("\n");
	}
}
