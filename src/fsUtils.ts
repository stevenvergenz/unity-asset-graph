import { readdir, readFile, stat } from 'fs/promises';
import { resolve } from 'path';

const metaIdRegex = /guid: ([0-9a-f]{32})/;
const idRegex = /[0-9a-f]{32}/g;

export async function findFiles(dir: string, pattern: RegExp, maxDepth: number = Infinity): Promise<string[]> {
	// if we're passed a single file, just return if it matches
	const dirStats = await stat(dir);
	if (!dirStats.isDirectory()) {
		if (pattern.test(dir)) {
			return [ dir ];
		} else {
			return [];
		}
	}

	if (maxDepth <= 0) {
		return [];
	}

	// get recursive files
	const subFiles = await readdir(dir);
	const subPromises = subFiles.map(f => findFiles(resolve(dir, f), pattern, maxDepth - 1));
	const subResults = await Promise.all(subPromises);
	return subResults.flat();
}

export async function getId(assetMetaPath: string): Promise<string> {
	const dataString = await readFile(assetMetaPath, { encoding: 'utf-8' });
	const match = metaIdRegex.exec(dataString);
	if (match) {
		return match[1];
	} else {
		throw new Error(`Could not find ID in meta file ${assetMetaPath}`);
	}
}

export async function getDependencies(assetPath: string): Promise<string[]> {

	// scan for IDs
	if (/\.(mat|asset|unity|prefab)$/.test(assetPath)) {
		const dataString = await readFile(assetPath, { encoding: 'utf-8' });
		idRegex.lastIndex = 0;

		let match: string[];
		let ids: string[] = [];
		while (match = idRegex.exec(dataString)) {
			ids.push(match[0]);
		}

		return ids;
	}
	else {
		return [];
	}
}
