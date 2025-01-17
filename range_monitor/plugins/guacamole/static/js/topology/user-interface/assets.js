// ui_setup.js
import { Modal } from "./node-modal/guac-modal.js";
import { modalTypes } from "./node-modal/modal-builder.js";

export class GraphUI {
	constructor() {
		const { svg, container } = setupD3.initSVG();
		this.svg = svg;
		this.container = container;
		setupD3.setupFilters(container);
		this.simulation = setupD3.setupSimulation(svg);
		this.drag = this.setupDrag();
		this.assets = new GraphAssets(this.container);
		this.tickAdded = false;
	}
	/**
	 * @returns {function} - a drag event handler
	 */
	setupDrag() {
		const dragStarted = (event, d) => {
			if (!event.active) {
				this.simulation.alphaTarget(0.1).restart();
			}
			d.fx = d.x;
			d.fy = d.y;
		};

		const dragged = (event, d) => {
			d.fx = event.x;
			d.fy = event.y;
		};

		const dragEnded = (event, d) => {
			if (!event.active) {
				this.simulation.alphaTarget(0.1).restart();
			}
			d.fx = null;
			d.fy = null;
		};

		return d3
			.drag()
			.on("start", dragStarted)
			.on("drag", dragged)
			.on("end", dragEnded);
	}
	/**
	 * @param {ConnectionData} context
	 * @param {String[]} userSelection
	 */
	setAssetData(context, clonedEdges, userSelection) {
		const { nodes, nodeMap } = context;
		this.assets.setEdges(clonedEdges, nodeMap);
		this.assets.setNodes(this.drag, userSelection, context);
		this.assets.setLabels(nodes);
		this.assets.setIcons(nodes);
		this.simulation.nodes(nodes);
		this.simulation.force("link").links(clonedEdges);
	}
	restartSimulation(alphaValue) {
		if (alphaValue < 0) {
			return;
		}
		this.simulation.alpha(alphaValue).alphaTarget(0.1).restart();
		if (this.tickAdded) {
			return;
		}
		this.simulation.on("tick", () => {
			this.assets.onTick();
		});
		this.tickAdded = true;
	}
}

/**
 * static singleton for setting up d3 topology
 */
export const setupD3 = {
	initSVG() {
		const svg = d3.select("svg");
		const container = svg.append("g");
		this.setupZoom(svg, container);
		return { svg, container };
	},
	setupZoom(svg, container) {
		svg.call(
			d3
				.zoom()
				.scaleExtent([0.5, 5])
				.on("zoom", (event) => {
					eventHandlers.onZoom(event, container);
				})
		);
	},
	setupSimulation(svg) {
		const { width, height } = svg.node().getBoundingClientRect();
		const SIM_CONFIG = {
			DISTANCE: 200, // pull a link has
			CHARGE: -400, // the physics of node collisions
			ALPHA_DECAY: 0.05, // [optional] the rate at which the simulation's alpha value decays, improves performance
			VELOCITY_DECAY: 0.3, // [optional] the rate at which the velocity of nodes decays (per tick), , improves performance
		};

		return d3
			.forceSimulation()
			.force(
				"link",
				d3
					.forceLink()
					.id((d) => d.identifier)
					.distance(SIM_CONFIG.DISTANCE)
			)
			.force(
				"charge",
				d3.forceManyBody().strength(SIM_CONFIG.CHARGE) // charge of each node
			)
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force(
				"collision",
				d3.forceCollide().radius((d) => d.size + 10) // collision raidus
			);
		// .velocityDecay(SIM_CONFIG.VELOCITY_DECAY); // velocity decay
		// .alphaDecay(SIM_CONFIG.ALPHA_DECAY)
	},
	setupFilters(svg) {
		const defs = svg.append("defs");
		const filter = defs.append("filter").attr("id", "glow");
		filter
			.append("feGaussianBlur")
			.attr("class", "blur")
			.attr("stdDeviation", 4)
			.attr("result", "coloredBlur");

		const feMerge = filter.append("feMerge");

		feMerge.append("feMergeNode").attr("in", "coloredBlur");
		feMerge.append("feMergeNode").attr("in", "SourceGraphic");
	},
};

/**
 * @class GraphAssets
 * @property {Object} edge - The edges of the graph.
 * @property {Object} node - The nodes of the graph.
 * @property {Object} label - The labels of the nodes.
 */
class GraphAssets {
	constructor(svg) {
		this.edge = svg
			.append("g")
			.attr("id", "edge-container")
			.attr("stroke-width", 1)
			.selectAll("line");
		this.node = svg
			.append("g")
			.attr("id", "node-container")
			.selectAll("circle");
		this.label = svg
			.append("g")
			.attr("pointer-events", "none")
			.attr("text-anchor", "middle")
			.selectAll("text");
		this.icon = svg.append("g").attr("id", "icon-container").selectAll("text");
	}
	/**
	 * @param {Object[]} edgeData - {source: string, target: string}[]
	 * @param {Map<string, ConnectionNode>} nodeMap - { identifier: ConnectionNode }
	 */
	setEdges(edgeData, nodeMap) {
		this.edge = this.edge
			.data(edgeData, (d) => `${d.source}-${d.target}`)
			.join("line")
			.attr("class", (d) => {
				const target = nodeMap.get(d.target);
				const status = target.isActive() ? "active-edge" : "inactive-edge";
				return `graph-edge ${status}`;
			})
			.attr("data-parent-id", (d) => d.source)  
			.attr("data-target-id", (d) => d.target);
	}

	/**
	 * @param {callback} dragHandler
	 * @param {string[]} userSelection - the selected nodes
	 * @param {ConnectionData} - destructured { nodes, nodeMap }
	 */
	setNodes(dragHandler, userSelection, { nodes, nodeMap }) {
		this.node = this.node
			.data(nodes, (d) => d.identifier)
			.join("circle")
			.attr("data-parent-id", (d) => d.parentIdentifier ?? "None")
			.attr("id", (d) => d.identifier)
			.attr("class", (d) => `${d.cssClass} graph-node`)
			.attr("r", (d) => d.size)
			.attr("fill", (d) => d.color)
			.call(dragHandler)
			.on("click", (event) => {
				event.preventDefault();
				eventHandlers.nodeClick(event, userSelection);
			})
			.on("auxclick", (event) => {
				event.preventDefault();
				eventHandlers.showNodeModal(userSelection, nodes, nodeMap);
			})
			.on("mouseover", (event) => {
				eventHandlers.onNodeMouseover(event);
			})
			.on("mousemove", (event) => {
				eventHandlers.onNodeMousemove(event);
			})
			.on("mouseout", () => {
				eventHandlers.onNodeMouseout();
			});
	}

	/**
	 * @param {ConnectionNode[]} dataNodes -  the nodes property of ConnectionData
	 */
	setIcons(dataNodes) {
		this.icon = this.icon
			.data(dataNodes, (d) => `icon-${d.identifier}`)
			.join("text")
			.classed("node-icon", true)
			.attr("fill", (d) => {
				return d.isRoot() ? "black" : "white";
			})
			.text((d) => d.icon)
			.attr("dy", (d) => d.size / 6)
			.attr("dominant-baseline", "middle")
			.style("font-size", (d) => d.size + "px");
	}
	/**
	 * @param {ConnectionNode[]} dataNodes
	 */
	setLabels(dataNodes) {
		this.label = this.label
			.data(dataNodes, (d) => `label-${d.identifier}`)
			.join("text")
			.text((d) => d.name || "Unamed Node")
			.attr("font-size", (d) => d.size + "px")
			.attr("dy", (d) => d.size + 5)
			.attr("class", (d) => (d.isActive() ? "active-label" : "inactive-label"));
	}

	/**
	 * logic for when the simulation ticks
	 */
	onTick() {
		this.edge
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);
		this.node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		this.label.attr("x", (d) => d.x).attr("y", (d) => d.y);
		this.icon.attr("x", (d) => d.x).attr("y", (d) => d.y);
	}
}

function getLineById(targetId) {
	return $(`line[data-target-id="${targetId}"]`);
}

/**-
 * static singleton for setting up d3 topology
 *
 * to the next person that reads this you can most likely
 * optimize and reduce DOM queries by caching containers
 */
export const eventHandlers = {
	/**
	 * @param {d3.event} event
	 * @param {ConnectionNode>} userSelection
	 * @returns {void}
	 */
	nodeClick(event, userSelection) {
		const targetData = event.target.__data__;
		if (targetData.isRoot()) {
			return;
		}
		const isGroupSelect = event.ctrlKey || event.metaKey;
		const $pressed = $(event.target);
		const selectedNodes = new Set(userSelection);
		if (!isGroupSelect || targetData.isGroup()) {
			eventHandlers.handleDefaultClick($pressed, selectedNodes, targetData);
		} else {
			eventHandlers.handleGroupClick(
				$pressed,
				selectedNodes,
				targetData.identifier
			);
		}
		userSelection.length = 0;
		userSelection.push(...selectedNodes);
		$("#showSelected").text(userSelection.length);
	},
	deselectAll() {
		$(".selected").each(function () {
			const targetId = $(this).attr("id");
			getLineById(targetId).removeClass("pressed-edge");
			$(this).removeClass("selected");
		});
	},
	handleDefaultClick($pressed, selectedNodes, targetData) {
		const wasSelected = !$pressed.hasClass("selected");
		eventHandlers.deselectAll();
		selectedNodes.clear();
		if (!wasSelected) {
			return;
		}
		$pressed.addClass("selected");
		getLineById(targetData.identifier).addClass("pressed-edge");
		selectedNodes.add(targetData.identifier);
	},
	handleGroupClick($pressed, selectedNodes, targetId) {
		$pressed.toggleClass("selected");
		if (selectedNodes.has(targetId)) {
			selectedNodes.delete(targetId);
			getLineById(targetId).removeClass("pressed-edge");
		} else {
			selectedNodes.add(targetId);
			getLineById(targetId).addClass("pressed-edge");
		}
	},
	/**
	 * triggers the corresponding node modal
	 * when a node is middle clicked
	 * @param {Set<string>} userSelection
	 * @param {ConnectionNode[]} nodes
	 * @param {Map<string, ConnectionNode>} nodeMap
	 */
	showNodeModal(userSelection, nodes, nodeMap) {
		if (userSelection.length === 0) {
			return;
		}
		const modal = new Modal();
		let modalData, title;
		let icon = null;
		const firstItem = userSelection[0];
		if (!firstItem) {
			throw new Error("The first user selected node was undefined, cannot open Modal.");
		}
		const first = nodeMap.get(firstItem);
		if (first.identifier === "ROOT") {
			return;
		} else if (first.isGroup()) {
			modalData = modalTypes.connectionGroup(first, nodes, nodeMap);
			title = `Connection Group: ${first.name} `;
			icon = $("i", { class: "fa-solid fa-network-wired" });
		} else if (userSelection.length === 1) {
			modalData = modalTypes.singleConnection(first, nodeMap);
			title = `Connection Details: ${first.name} `;
		} else {
			modalData = modalTypes.manyConnections(userSelection, nodeMap);
			title = `Selected Connections Overview (${userSelection.length}) `;
			icon = $("i", { class: "fa-solid fa-users-viewfinder" });
		}
		modal.init(title, modalData);
		const $title = $("#modalTitle");
		if (!icon) {
			icon = first.getOsIcon();
		}
		$title.append(icon);
		modal.openModal(() => {
			userSelection.length = 0; 
			$("#showSelected").text(0);
			eventHandlers.deselectAll();
		});
	},
	onZoom(event, container) {
		container.attr("transform", event.transform);
		const zoomPercent = Math.round(event.transform.k * 100);
		d3.select("#zoomPercent").text(`${zoomPercent}%`);
	},
	onNodeMouseover(event) {
		const targetData = event.target.__data__;
		if (!targetData.isLeafNode()) {
			return;
		}
		getLineById(targetData.identifier).addClass("glow-effect");
		$(`#${targetData.identifier}`).addClass("glow-circle");

		const nodeTooltip = `
		<strong>
			<i class="fa-solid fa-wifi tooltip-icon 
			${targetData.isActive() ? "online" : "offline"}"></i>
			 Active Connections:
		</strong> 
		${targetData.activeConnections}
		`;
		const rect = event.target.getBoundingClientRect();
		$("#node-tooltip")
			.addClass("show")
			.html(nodeTooltip)
			.css({
				left: rect.left + rect.width / 2 + window.scrollX + "px",
				top: rect.top - 30 + window.scrollY + "px",
			});
	},
	onNodeMousemove(event) {
		const rect = event.target.getBoundingClientRect();
		$("#node-tooltip").css({
			left: rect.left + rect.width / 2 + window.scrollX + "px",
			top: rect.top - 30 + window.scrollY + "px",
		});
	},
	onNodeMouseout() {
		$(".glow-effect").removeClass("glow-effect");
		$(".glow-circle").removeClass("glow-circle");
		$("#node-tooltip").removeClass("show");
	},
};
