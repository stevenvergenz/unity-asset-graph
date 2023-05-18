import { extname } from 'path';
import * as d3 from 'd3';
import * as d3f from 'd3-force';
import { JSDOM } from 'jsdom';

import { Asset, Database } from './database.js';

const assetTypeColors: { [assetType: string]: string } = {
	".shader": "purple",
	".png": "blue",
	".jpg": "blue",
	".exr": "blue",
	".mp4": "blue",
	".mat": "green",
	".blend": "gold",
	".fbx": "gold",
	".obj": "gold",
	".prefab": "cyan",
	".unity": "pink",
	".asset": "grey",
	".giparams": "grey",
	".lighting": "grey"
};

export function visualize(db: Database, screenRatio = 1) {
	const dbSize = Object.keys(db.assets).length;
	const height = 1.3 * dbSize, width = height * screenRatio;

	const data = generateSimData(db);
	const sim = d3f.forceSimulation(data.nodes)
		.force("links", d3f.forceLink(data.links).id((a: Asset) => a.id))
		.force("charge", d3f.forceManyBody())
		.force("center", d3f.forceCenter(width / 2, height / 2))
		.stop();

	for (let i = 0; i < 20; i++) {
		sim.tick();
	}

	const doc = new JSDOM(`
	<!DOCTYPE html>
	<body>
		<svg viewBox="0 0 ${width} ${height}" style="width: ${width}; height: ${height};">
			<defs>
				<marker id="triangle" viewBox="0 0 4 4"
					refX="7" refY="2"
					markerUnits="strokeWidth"
					markerWidth="4" markerHeight="4"
					orient="auto">
					<path d="M 0 0 L 4 2 L 0 4 z" fill="#999"/>
				</marker>
			</defs>
		</svg>
	</body>
	`);
	const body = d3.select(doc.window.document.body)
	const svg = body.select("svg");

	svg.append("g")
		.attr("stroke", "#999")
		.attr("stroke-opacity", 0.6)
		.attr("stroke-width", 2)
		.attr("marker-end", "url(#triangle)")
		.selectAll("line")
		.data(data.links)
		.join("line")
		.attr("x1", d => (d.source as Asset).x)
		.attr("y1", d => (d.source as Asset).y)
		.attr("x2", d => (d.target as Asset).x)
		.attr("y2", d => (d.target as Asset).y);

	svg.append("g")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("circle")
		.data(data.nodes)
		.join("circle")
		.attr("r", 7)
		.attr("fill", d => assetTypeColors[extname(d.name)] ?? "black")
		.attr("cx", d => d.x)
		.attr("cy", d => d.y)
		.append("title")
		.text(d => d.name);

	return doc.window.document.documentElement;
}

function generateSimData(db: Database): { nodes: Asset[], links: d3f.SimulationLinkDatum<Asset>[] } {
	const nodes: Asset[] = [];
	const links: d3f.SimulationLinkDatum<Asset>[] = [];

	for (const asset of Object.values(db.assets)) {
		nodes.push(asset);
		for (const dep of asset.dependencies) {
			links.push({ source: asset.id, target: dep });
		}
	}

	return { nodes, links };
}
