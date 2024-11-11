// topology/data/guac_types.js

// TODO: try to implement hashing to improve performance
// import { hashDump } from "./hash_data.js";
import hash from "./hash_data.js";
export { ConnectionNode, NodeWeight, colors, icons };



/**
 * @enum {number} NodeWeight
 * @description Defines the weight categories for nodes.
 */
const NodeWeight = Object.freeze({
	ROOT: 5,
	GUAC_GROUP: 4,
	ACTIVE_ENDPOINT: 3,
	INACTIVE_ENDPOINT: 2,
	DEFAULT: 1,
});




const NodeClasses = Object.freeze({
  [NodeWeight.DEFAULT]: "default-conn" ,
  [NodeWeight.INACTIVE_ENDPOINT]: "inactive-conn",
  [NodeWeight.ACTIVE_ENDPOINT]: "active-conn",
  [NodeWeight.GUAC_GROUP]: "conn-group",
  [NodeWeight.ROOT]: "root",
});

/**
 * @enum {string} colors
 * @description  the colors associated with each node weight.
 */
const colors = Object.freeze({
	[NodeWeight.DEFAULT]: "rgb(0, 0, 0)", // black
	[NodeWeight.INACTIVE_ENDPOINT]: "rgb(192, 0, 0)", // red
	[NodeWeight.ACTIVE_ENDPOINT]: "rgb(0, 192, 0)", // green
	[NodeWeight.GUAC_GROUP]: "rgb(0, 0, 192)", // blue
	[NodeWeight.ROOT]: "rgb(255, 255, 255)", // white
});

const icons = Object.freeze({
	[NodeWeight.ACTIVE_ENDPOINT]: "endpoint.png",
	[NodeWeight.INACTIVE_ENDPOINT]: "inactive.png",
	[NodeWeight.ROOT]: "root.png",
	[NodeWeight.GUAC_GROUP]: "conn-group.png",
	[NodeWeight.DEFAULT]: "default.png",
});

const fasIconUnicode = Object.freeze({
	SERVER: "\uf233", // fa-solid fa-server
	COMPUTER: "\uf109", // fa-solid fa-laptop
	WINDOWS: "\uf17a", // fa-brands fa-windows
	LINUX: "\uf17c", // fa-brands fa-linux
	NETWORK: "\uf6ff", // fa-solid fa-network-wired
	DEFAULT: "\uf128", // fa-solid fa-question
});

const TopologyIcons = Object.freeze({
	[NodeWeight.ACTIVE_ENDPOINT]: fasIconUnicode.COMPUTER,
	[NodeWeight.INACTIVE_ENDPOINT]: fasIconUnicode.COMPUTER,
	[NodeWeight.ROOT]: fasIconUnicode.SERVER,
	[NodeWeight.GUAC_GROUP]: fasIconUnicode.NETWORK,
	[NodeWeight.DEFAULT]: fasIconUnicode.DEFAULT,
});



/**
 * @class Representation of all connections / node in the topology.
 * @property {string}identifier
 * @property {string} parentIdentifier
 * @property {string} name
 * @property {Object} dump
 * @property {number} weight
 * @property {number} size
 * @property {string} color
 */
class ConnectionNode {
	constructor(jsonData) {
		this.identifier = jsonData.identifier;
		this.parentIdentifier = jsonData.parentIdentifier;
		this.name = jsonData.name;
		this.dump = jsonData;
		this.hashed = hash(this.dump);
		// connStyle
		this.weight = getNodeWeight(jsonData);
		this.size = this.weight * 3 + 5;
		this.color = colors[this.weight] || colors[NodeWeight.DEFAULT];
		this.type = jsonData.type;
		this.icon = TopologyIcons[this.weight] || TopologyIcons[NodeWeight.DEFAULT];
		this.cssClass = NodeClasses[this.weight] || NodeClasses[NodeWeight.DEFAULT];
	}
	
	nodeData() {
		return this.dump;
	}

	isRoot() {
		return this.weight === NodeWeight.ROOT;
	}
	
	isGroup() {
		return this.weight === NodeWeight.GUAC_GROUP;
	}

	isLeafNode() {
		return (
			this.weight === NodeWeight.ACTIVE_ENDPOINT ||
			this.weight === NodeWeight.INACTIVE_ENDPOINT
		);
	}
	isActive() {
		return this.isGroup() || this.weight === NodeWeight.ACTIVE_ENDPOINT;
	}
	getOsIcon() {
		const $icon = $("<i>", {class: "conn-icon"});
		if(this.isGroup()) {
	    return $icon.addClass("fa-solid fa-network-wired");			
		}
		if(this.name.toLowerCase().includes("win")) {
			return $icon.addClass("fa-brands fa-windows");
		}
		return $icon.addClass("fa-brands fa-linux");
	}

	/**
	 * @param {Object} nodeDump 
	 * @returns {Boolean}
	 */
	equals(nodeDump) {
		return this.hashed === hash(nodeDump);
	}
}

/**
 * @param {ConnectionNode} node
 * @returns {number|NodeWeight}
 */
function getNodeWeight(node) {
	if (node.identifier === "ROOT") {
		return NodeWeight.ROOT;
	}
	if (node.type) {
		return NodeWeight.GUAC_GROUP;
	}
	if (node.activeConnections > 0) {
		return NodeWeight.ACTIVE_ENDPOINT;
	}
	if (node.protocol) {
		return NodeWeight.INACTIVE_ENDPOINT;
	}
	return NodeWeight.DEFAULT;
}
