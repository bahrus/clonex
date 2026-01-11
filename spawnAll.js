//@ts-check
/** @import {SpawnRoot, SpawnInfo, Disposable, SpawnMapping, SpawnConstructor} from "./spawnAll.d.ts" */

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param {DocumentFragment} clone - The cloned DOM fragment
 * @param {SpawnRoot} options - The spawn mapping and configuration
 * @returns {Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>} A nested WeakMap for tracking instances
 */
export async function spawnAll(clone, options) {
    const elementToInfoMap = new WeakMap();

    /**
     * Helper function to get all nodes in a flat array (pre-order traversal)
     * @param {DocumentFragment} node 
     * @returns 
     */
    function getNodeArray(node) {
        /** @type {Node[]} */
        const nodes = [];
        /**
         * 
         * @param {Node} n 
         */
        function traverse(n) {
            nodes.push(n);
            for (let child of n.childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    traverse(child);
                }
            }
        }
        traverse(node);
        return nodes;
    }

    // Get all nodes in the fragment
    const nodes = getNodeArray(clone);

    /**
     * Process spawn mappings
     * @param {SpawnMapping[]} mappings 
     * @param {number} nodeIndex 
     * @returns 
     */
    async function processMapping(mappings, nodeIndex) {
        if (!mappings || !Array.isArray(mappings)) {
            return;
        }

        for (const mapping of mappings) {
            if (!mapping) continue;

            const element = nodes[nodeIndex];
            if (!element || !(element instanceof Element)) {
                continue;
            }

            // Get the spawn constructor
            let spawnConstructor = mapping.spawn;
            if (typeof spawnConstructor === 'function' && spawnConstructor.constructor.name === 'AsyncFunction') {
                spawnConstructor = await /** @type {() => Promise<SpawnConstructor>} */ (spawnConstructor)();
            }

            // Instantiate the class
            if (typeof spawnConstructor === 'function') {
                const instance = new /** @type {SpawnConstructor} */ (spawnConstructor)(element, mapping.spawnInfo);

                // Store the instance in the nested WeakMap
                if (!elementToInfoMap.has(element)) {
                    elementToInfoMap.set(element, new WeakMap());
                }
                elementToInfoMap.get(element).set(mapping.spawnInfo, instance);

                // Call the spawn callback if provided
                if (options.spawnCallback) {
                    options.spawnCallback(element, instance, mapping.spawnInfo);
                }
            }

            // Process nested mappings for child nodes
            for (const key in mapping) {
                if (key !== 'spawn' && key !== 'spawnInfo' && !isNaN(parseInt(key))) {
                    const childIndex = parseInt(key);
                    await processMapping(mapping[key], nodeIndex + childIndex);
                }
            }
        }
    }

    // Start processing from root level
    for (const key in options) {
        if (key !== 'spawnCallback' && !isNaN(parseInt(key))) {
            const nodeIndex = parseInt(key);
            await processMapping(options[key], nodeIndex);
        }
    }

    return elementToInfoMap;
}
