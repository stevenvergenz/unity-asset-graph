import { readdir, readFile, stat } from 'fs/promises';
import { resolve } from 'path';

const metaIdRegex = /guid: ([0-9a-f]{32})/;
const idRegex = /[0-9a-f]{32}/g;

export async function findFiles(
	dir: string,
	include: RegExp,
	exclude: RegExp = null,
	maxDepth: number = Infinity,
	matchStartIndex: number = 0
): Promise<string[]> {
	if (include) {
		include.lastIndex = 0;
	}
	if (exclude) {
		exclude.lastIndex = 0;
	}

	const searchStr = dir.substr(matchStartIndex);

	// if we're passed a single file and it passes filter, return it
	const dirStats = await stat(dir);
	if (!dirStats.isDirectory() && (!include || include.test(searchStr)) && (!exclude || !exclude.test(searchStr))) {
		return [ dir ];
	}
	// it's a directory, but we're maxed out on depth
	else if (dirStats.isDirectory() && maxDepth <= 0) {
		return [];
	}
	// it's a directory that passes the exclude filter, recurse
	else if (dirStats.isDirectory() && (!exclude || !exclude.test(searchStr))) {
		const subFiles = await readdir(dir);
		const subPromises = subFiles.map(f =>
			findFiles(resolve(dir, f), include, exclude, maxDepth - 1, matchStartIndex));
		const subResults = await Promise.all(subPromises);
		return subResults.flat();
	}
	// it's something that failed the filter, return empty
	else {
		return [];
	}
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
		let ids = new Set<string>();
		while (match = idRegex.exec(dataString)) {
			ids.add(match[0]);
		}

		return [...ids];
	}
	else {
		return [];
	}
}
