
//@ts-check
/** @import {
 * SpawnRoot, 
 * SpawnInfo, 
 * Disposable, 
 * SpawnMapping, 
 * SpawnConstructor,
 * ElementXSynchronousSpawnInfo,
 * ElementXAsynchronousSpawnInfo
 * } from "./spawnAll.d.ts" */

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param {DocumentFragment} clone - The cloned DOM fragment
 * @param {SpawnRoot} options - The spawn mapping and configuration
 * @returns {Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>} A nested WeakMap for tracking instances
 */
export async function spawnAll(clone, options) {
    const spawnedSynchronous = spawnSynchronous(clone, options);
}

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param {DocumentFragment} clone - The cloned DOM fragment
 * @param {SpawnRoot} options - The spawn mapping and configuration
 * @returns {WeakMap<Element, WeakMap<SpawnInfo, Disposable>>} A nested WeakMap for tracking instances
 */
export function spawnSynchronous(clone, options) {
    const synchronousSpawns = getSynchronousSpawns(clone, options);
    const elementToInfoMap = new WeakMap();
    for (const elXSpawnInfo of synchronousSpawns) {
        const {element, spawnInfo, spawn, initVals} = elXSpawnInfo;
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
 * @returns {Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>} A nested WeakMap for tracking instances
 */
export async function spawnAsynchronous(clone, options) {
    const asynchronousSpawns = await getAsynchronousSpawns(clone, options);
    const elementToInfoMap = new WeakMap();
    for (const elXSpawnInfo of asynchronousSpawns) {
        const {element, spawnInfo, spawn, initVals} = elXSpawnInfo;
        const spawnConstructor = await spawn();
        const instance = new spawnConstructor(element, spawnInfo, initVals);
        const infoMap = elementToInfoMap.get(element) || new WeakMap();
        infoMap.set(spawnInfo, instance);
        elementToInfoMap.set(element, infoMap);
    }
    return elementToInfoMap;
}

/**
 * 
 * @param {DocumentFragment} clone 
 * @param {SpawnRoot} options 
 * @returns {ElementXSynchronousSpawnInfo[]} 
 */
function getSynchronousSpawns(clone, options){

}

/**
 * 
 * @param {DocumentFragment} clone 
 * @param {SpawnRoot} options 
 * @returns {ElementXAsynchronousSpawnInfo[]} 
 */
function getAsynchronousSpawns(clone, options){
}