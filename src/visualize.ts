import * as d3 from 'd3';
import * as d3f from 'd3-force';
import { Asset, Database } from './database';

export function visualize(db: Database, width = 1920, height = 1080): SVGSVGElement {
	const data = generateSimData(db);
	const sim = d3f.forceSimulation(data.nodes)
		.force("links", d3f.forceLink(data.links).id((a: Asset) => a.id))
		.force("charge", d3f.forceManyBody())
		.force("center", d3f.forceCenter(width / 2, height / 2));

	const svg = d3.create("svg")
		.attr("viewBox", `0 0 ${width} ${height}`);

	return svg.node();
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
