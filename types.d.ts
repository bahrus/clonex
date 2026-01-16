/**
 * Internally used interface for tracking spawn information tied to an element
 */
export interface ElementXSynchronousSpawnInfo {
    element: Element;
    spawn: SpawnConstructor
    spawnInfo: SpawnInfo;
    initVals?: unknown;   
}


/**
 * Interface for spawn information
 * At a minimum, this object is required in 
 * order to guarantee that there is a key that can be used
 * to locate the class instance.
 */
export interface SpawnInfo {
    spawn: SpawnConstructor | (() => Promise<SpawnConstructor>);
}

/**
 * Constructor for a class that can be spawned
 */
export interface SpawnConstructor<TSpawnKey = SpawnInfo> {
    new (el: Element, info: TSpawnKey, initVals?: unknown): Disposable;
}

/**
 * Interface for classes that can be spawned.  Assumed to have a dispose method
 * (but this package doesn't require or call such a method)
 */
export interface Disposable {
    dispose(el: Element, info: SpawnInfo): void;
}

/**
 * Spawn configuration
 */
export interface SIN {
    spawnInfo: SpawnInfo;
    initVals?: unknown;
    nodes?: NxSIN[];
}

/**
 * Tuple mapping a node index to its spawn configuration
 */
export type NxSIN = [number, SIN];

/**
 * Root configuration for spawning
 */
export interface SpawnRoot {
    // Array of node mappings as tuples [index, configuration]
    nodes: NxSIN[];
    // Optional callback invoked when an instance is about to be spawned
    // This provides the opportunity to merge existing data in with initVals
    preSpawnCallback?: (el: Element, spawnInfo: SpawnInfo, initVals: unknown) => void;

    // Optional callback invoked after an instance has been spawned
    postSpawnCallback?: (el: Element, instance: Disposable, spawnInfo: SpawnInfo) => void;
    /**
     * Optional debounce interval in milliseconds for node change of nodes before returning the instance map
     */
    mutationDebounceInterval?: number;
}

// /**
//  * Spawns class instances tied to a cloned DOM fragment based on a mapping
//  * @param clone - The cloned DOM fragment
//  * @param options - The spawn mapping and configuration
//  * @returns A nested WeakMap for tracking instances
//  */
// export declare function spawnAll(
//     clone: DocumentFragment,
//     options: SpawnRoot
// ): Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>;
