// export interface TreeNode {
//     children: TreeNode[];
//     element: Element;
// }

// export interface RootNode {
//     children: TreeNode[];
// }

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
 */
export interface SpawnInfo {}

/**
 * Constructor for a class that can be spawned
 */
export interface SpawnConstructor {
    new (el: Element, info: SpawnInfo, initVals?: unknown): Disposable;
}

/**
 * Interface for objects with a dispose method
 */
export interface Disposable {
    dispose(el: Element, info: SpawnInfo): void;
}

export interface SSI {
    spawn: SpawnConstructor | (() => Promise<SpawnConstructor>);
    spawnInfo: SpawnInfo;
    initVals?: unknown;
    nodes?: NodeSSI[];
}

export type NodeSSI = [number, SSI];

// /**
//  * Mapping for spawning classes to specific nodes and their children
//  */
// export interface SpawnMapping extends SSI {
//     // Child node mappings indexed by node position
//     [key: number]: SpawnMapping[];
// }

/**
 * Root configuration for spawning
 */
export interface SpawnRoot {
    // Root node mappings indexed by node position
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
