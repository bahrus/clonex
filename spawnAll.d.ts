
export interface ElementXSynchronousSpawnInfo {
    element: Element;
    spawn: SpawnConstructor
    spawnInfo: SpawnInfo;
    initVals?: unknown;   
}

export interface ElementXAsynchronousSpawnInfo {
    element: Element;
    spawn: () => Promise<SpawnConstructor>;
    spawnInfo: SpawnInfo;
    initVals?: unknown;
}

/**
 * Interface for spawn information
 * At a minimum, this object is required in 
 * order to guarantee that there is a key that can be used
 * to locate the class instance.
 */
interface SpawnInfo {}

/**
 * Constructor for a class that can be spawned
 */
interface SpawnConstructor<TSpawnKey = SpawnInfo> {
    new (el: Element, info: TSpawnKey, initVals?: unknown): Disposable;
}

/**
 * Interface for classes that can be spawned.  Assumed to have a dispose method
 * (but this package doesn't require or call such a method)
 */
interface Disposable {
    dispose(el: Element, info: SpawnInfo): void;
}

/**
 * Spawn configuration
 */
interface SSI {
    spawn: SpawnConstructor | (() => Promise<SpawnConstructor>);
    spawnInfo: SpawnInfo;
    initVals?: unknown;
    nodes?: NodeSSI[];
}

/**
 * Tuple mapping a node index to its spawn configuration
 */
type NodeSSI = [number, SSI];

/**
 * Root configuration for spawning
 */
interface SpawnRoot {
    // Array of node mappings as tuples [index, configuration]
    nodes: NodeSSI[];
    spawnCallback?: (el: Element, instance: Disposable, spawnInfo: SpawnInfo) => void;
}

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param clone - The cloned DOM fragment
 * @param options - The spawn mapping and configuration
 * @returns A nested WeakMap for tracking instances
 */
export declare function spawnAll(
    clone: DocumentFragment,
    options: SpawnRoot
): Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>;
