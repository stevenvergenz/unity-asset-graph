import * as d3 from 'd3';
import * as d3f from 'd3-force';
import { JSDOM } from 'jsdom';

import { Asset, Database } from './database.js';

export function visualize(db: Database, width = 1920, height = 1080) {
	const data = generateSimData(db);
	const sim = d3f.forceSimulation(data.nodes)
		.force("links", d3f.forceLink(data.links).id((a: Asset) => a.id))
		.force("charge", d3f.forceManyBody())
		.force("center", d3f.forceCenter(width / 2, height / 2))
		.stop();

	for (let i = 0; i < 20; i++) {
		sim.tick();
	}

	const doc = new JSDOM("<body></body>");
	const body = d3.select(doc.window.document.body)
	const svg = body.append("svg")
		.attr("viewBox", `0 0 ${width} ${height}`);

	svg.append("g")
		.attr("stroke", "#999")
		.attr("stroke-opacity", 0.6)
		.attr("stroke-width", 2)
		.selectAll("line")
		.data(data.links)
		.join("line");

	svg.append("g")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("circle")
		.data(data.nodes)
		.join("circle")
		.attr("r", 5)
		.attr("fill", "#555");

	return body;
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
