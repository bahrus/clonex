//@ts-check
/** @import { SpawnRoot, SpawnInfo, Disposable, SpawnConstructor, NxSIN, ElementXSynchronousSpawnInfo, SIN} from "./types.d.ts" */

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param {DocumentFragment} clone - The cloned DOM fragment
 * @param {SpawnRoot} options - The spawn mapping and configuration
 * @returns {Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>} A nested WeakMap for tracking instances
 */
export async function spawnAll(clone, options) {
    const spawnedSynchronous = spawnSynchronous(clone, options);
    const spawnedAsynchronous = await spawnAsynchronous(clone, options);

    // Merge the two WeakMaps
    const elementToInfoMap = new WeakMap();
    
    // Copy synchronous spawns
    for (const [element, infoMap] of spawnedSynchronous.entries()) {
        elementToInfoMap.set(element, infoMap);
    }
    
    // Merge asynchronous spawns
    for (const [element, asyncInfoMap] of spawnedAsynchronous.entries()) {
        elementToInfoMap.set(element, asyncInfoMap);
    }
    
    // If mutationDebounceInterval is specified, wait for DOM mutations to settle
    if (options.mutationDebounceInterval !== undefined && options.mutationDebounceInterval > 0) {
        await waitForMutations(clone, options.mutationDebounceInterval);
    }
    
    return elementToInfoMap;
}

/**
 * Waits for DOM mutations to settle using MutationObserver
 * @param {DocumentFragment} fragment - The fragment to observe
 * @param {number} debounceMs - Debounce interval in milliseconds
 * @returns {Promise<void>}
 */
function waitForMutations(fragment, debounceMs) {
    return new Promise((resolve) => {
        let timeoutId;
        
        const observer = new MutationObserver(() => {
            // Clear existing timeout
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            
            // Set new timeout
            timeoutId = setTimeout(() => {
                observer.disconnect();
                resolve();
            }, debounceMs);
        });
        
        // Observe all child elements in the fragment
        const childElements = fragment.querySelectorAll('*');
        for (const element of childElements) {
            observer.observe(element, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
        // Also observe the fragment itself if it has children
        if (fragment.childNodes.length > 0) {
            for (const child of fragment.childNodes) {
                if (child instanceof Element) {
                    observer.observe(child, {
                        attributes: true,
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                }
            }
        }
        
        // Start the initial timeout in case no mutations occur
        timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve();
        }, debounceMs);
    });
}

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param {DocumentFragment} clone - The cloned DOM fragment
 * @param {SpawnRoot} options - The spawn mapping and configuration
 * @returns {Map<Element, WeakMap<SpawnInfo, Disposable>>} A nested WeakMap for tracking instances
 */
export function spawnSynchronous(clone, options) {
    const synchronousSpawns = getSynchronousSpawns(clone, options);
    const elementToInfoMap = new Map();
    for (const elXSpawnInfo of synchronousSpawns) {
        const {element, spawnInfo, spawn, initVals} = elXSpawnInfo;
        //kind of silly, maybe should skip
        const spawnConstructor =  spawn;
        const instance = new spawnConstructor(element, spawnInfo, initVals);
        const infoMap = elementToInfoMap.get(element) || new WeakMap();
        infoMap.set(spawnInfo, instance);
        elementToInfoMap.set(element, infoMap);
    }
    return elementToInfoMap;
}

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param {DocumentFragment} clone - The cloned DOM fragment
 * @param {SpawnRoot} options - The spawn mapping and configuration
 * @returns {Promise<Map<Element, WeakMap<SpawnInfo, Disposable>>>} A nested WeakMap for tracking instances
 */
export async function spawnAsynchronous(clone, options) {
    const asynchronousSpawns = await getAsynchronousSpawns(clone, options);
    const elementToInfoMap = new Map();
    for (const elXSpawnInfo of asynchronousSpawns) {
        const {element, spawnInfo, spawn, initVals} = elXSpawnInfo;
        //kind of silly, maybe should skip
        const spawnConstructor =  spawn;
        const instance = new spawnConstructor(element, spawnInfo, initVals);
        const infoMap = elementToInfoMap.get(element) || new WeakMap();
        infoMap.set(spawnInfo, instance);
        elementToInfoMap.set(element, infoMap);
    }
    return elementToInfoMap;
}

/**
 * 
 * @param {DocumentFragment | Element} node 
 * @param {NxSIN[] | undefined} nodeMappings 
 * @param {ElementXSynchronousSpawnInfo[]} accumulator
 * @param {SIN | undefined} ssi
 * 
 */
function processNodeForSynchronousSpawns(node, nodeMappings, accumulator, ssi ){
    if(ssi !== undefined && node instanceof Element){
        const {spawnInfo, initVals} = ssi;
        const {spawn} = spawnInfo;
        if(typeof spawn === 'function' && spawn.constructor.name !== 'AsyncFunction'){
            accumulator.push({
                element: node,
                spawn: /** @type {SpawnConstructor} */ (spawn),
                spawnInfo: spawnInfo,
                initVals: initVals,
            });
        }
    }
    if(nodeMappings === undefined) return;
    for(const nodeMapping of nodeMappings){
        const [index, ssi] = nodeMapping;
        const {nodes} = ssi;
        const childNode = node.children[index];
        processNodeForSynchronousSpawns(childNode, nodes, accumulator, ssi);
    }
}

/**
 * 
 * @param {DocumentFragment | Element} node 
 * @param {NxSIN[] | undefined} nodeMappings 
 * @param {ElementXSynchronousSpawnInfo[]} accumulator
 * @param {SIN | undefined} ssi
 * 
 */
async function processNodeForAsynchronousSpawns(node, nodeMappings, accumulator, ssi ){
    if(ssi !== undefined && node instanceof Element){
        const {spawnInfo, initVals} = ssi;
        const {spawn} = spawnInfo;
        if(typeof spawn === 'function' && spawn.constructor.name === 'AsyncFunction'){
            const asyncSpawn = await spawn();
            accumulator.push({
                element: node,
                spawn: /** @type {SpawnConstructor} */ (asyncSpawn),
                spawnInfo: spawnInfo,
                initVals: initVals,
            });
        }
    }
    if(nodeMappings === undefined) return;
    for(const nodeMapping of nodeMappings){
        const [index, ssi] = nodeMapping;
        const {nodes} = ssi;
        const childNode = node.children[index];
        await processNodeForAsynchronousSpawns(childNode, nodes, accumulator, ssi);
        
    }
}


/**
 * 
 * @param {DocumentFragment} clone 
 * @param {SpawnRoot} options 
 * @returns {ElementXSynchronousSpawnInfo[]} 
 */
function getSynchronousSpawns(clone, options){
    /** @type {ElementXSynchronousSpawnInfo[]} */
    const accumulator = [];
    const {nodes} = options;
    processNodeForSynchronousSpawns(clone, nodes, accumulator, undefined);
    return accumulator;
}

/**
 * 
 * @param {DocumentFragment} clone 
 * @param {SpawnRoot} options 
 * @returns {Promise<ElementXSynchronousSpawnInfo[]>} 
 */
async function getAsynchronousSpawns(clone, options){
    /** @type {ElementXSynchronousSpawnInfo[]} */
    const accumulator = [];
    const {nodes} = options;
    await processNodeForAsynchronousSpawns(clone, nodes, accumulator, undefined);
    return accumulator;
}