//@ts-check
/** @import {
 * SpawnRoot, 
 * SpawnInfo, 
 * Disposable, 
 * SpawnConstructor,
 * NodeSSI,
 * ElementXSynchronousSpawnInfo,
 * ElementXAsynchronousSpawnInfo,
 * SSI
 * } from "./spawnAll.d.ts" */

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
    
    return elementToInfoMap;
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

// /**
//  * 
//  * @param {SpawnMapping} mapping 
//  */
// function partitionMappings(mapping){
//     const ssi = {};
//     const keyToSpawnMappings = {};
//     for(const key in mapping){
//         if(typeof key === 'number'){
//             keyToSpawnMappings[key] = mapping[key];
//         }else{
//             ssi[key] = mapping[key];
//         }
//     }
//     return {ssi, keyToSpawnMappings};
// }

/**
 * 
 * @param {DocumentFragment | Element} node 
 * @param {NodeSSI[] | undefined} nodeMappings 
 * @param {ElementXSynchronousSpawnInfo[]} accumulator
 * @param {SSI | undefined} ssi
 * 
 */
function processNodeForSynchronousSpawns(node, nodeMappings, accumulator, ssi ){
    if(ssi !== undefined && node instanceof Element){
        const {spawn, spawnInfo, initVals} = ssi;
        if(typeof spawn === 'function' && spawn.constructor.name !== 'AsyncFunction'){
            accumulator.push({
                element: node,
                spawn: /** @type {SpawnConstructor} */ (spawn),
                spawnInfo: ssi.spawnInfo,
                initVals: ssi.initVals,
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
 * @param {NodeSSI[] | undefined} nodeMappings 
 * @param {ElementXAsynchronousSpawnInfo[]} accumulator
 * @param {SSI | undefined} ssi
 * 
 */
async function processNodeForAsynchronousSpawns(node, nodeMappings, accumulator, ssi ){
    if(ssi !== undefined && node instanceof Element){
        const {spawn, spawnInfo, initVals} = ssi;
        if(typeof spawn === 'function' && spawn.constructor.name === 'AsyncFunction'){
            const asyncSpawn = await spawn();
            accumulator.push({
                element: node,
                spawn: /** @type {SpawnConstructor} */ (asyncSpawn),
                spawnInfo: ssi.spawnInfo,
                initVals: ssi.initVals,
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
 * @returns {Promise<ElementXAsynchronousSpawnInfo[]>} 
 */
async function getAsynchronousSpawns(clone, options){
    /** @type {ElementXAsynchronousSpawnInfo[]} */
    const accumulator = [];
    const {nodes} = options;
    await processNodeForAsynchronousSpawns(clone, nodes, accumulator, undefined);
    return accumulator;
}