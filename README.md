# spawning

This package contains a utility that spawns class instances tied to a cloned DOM fragment, based on a mapping configuration.

## Type Definitions

The core interfaces are:

```TypeScript
/**
 * Interface for spawn information
 */
interface SpawnInfo {}

/**
 * Constructor for a class that can be spawned
 */
interface SpawnConstructor {
    new (el: Element, info: SpawnInfo, initVals?: unknown): Disposable;
}

/**
 * Interface for objects with a dispose method
 */
interface Disposable {
    dispose(el: Element, info: SpawnInfo): void;
}

/**
 * Common spawn configuration
 */
interface SSI {
    spawn: SpawnConstructor | (() => Promise<SpawnConstructor>);
    spawnInfo: SpawnInfo;
    initVals?: unknown;
}

/**
 * Mapping for spawning classes to specific nodes and their children
 */
interface SpawnMapping extends SSI {
    // Child node mappings indexed by node position
    [key: number]: SpawnMapping[];
}

/**
 * Root configuration for spawning
 */
interface SpawnRoot {
    // Root node mappings indexed by node position
    [key: number]: SpawnMapping[];
    spawnCallback?: (el: Element, instance: Disposable, spawnInfo: SpawnInfo) => void;
}
```

## Public API

```TypeScript
const template = document.createElement('template');
template.innerHTML = String.raw<div>...</div>;

const clone = template.cloneNode(true);

/**
 * Spawns class instances tied to a cloned DOM fragment based on a mapping
 * @param clone - The cloned DOM fragment
 * @param options - The spawn mapping and configuration
 * @returns A nested WeakMap for tracking instances
 */
async function spawnAll(
    clone: DocumentFragment,
    options: SpawnRoot
): Promise<WeakMap<Element, WeakMap<SpawnInfo, Disposable>>>;

/**
 * Spawns synchronous class instances tied to a cloned DOM fragment
 * @param clone - The cloned DOM fragment
 * @param options - The spawn mapping and configuration
 * @returns A nested Map/WeakMap for tracking instances
 */
function spawnSynchronous(
    clone: DocumentFragment,
    options: SpawnRoot
): Map<Element, WeakMap<SpawnInfo, Disposable>>;

/**
 * Spawns asynchronous class instances tied to a cloned DOM fragment
 * @param clone - The cloned DOM fragment
 * @param options - The spawn mapping and configuration
 * @returns A nested Map/WeakMap for tracking instances
 */
async function spawnAsynchronous(
    clone: DocumentFragment,
    options: SpawnRoot
): Promise<Map<Element, WeakMap<SpawnInfo, Disposable>>>;
```

## Function Descriptions

**spawnAll**: The main entry point that orchestrates both synchronous and asynchronous spawning. Returns a promise that resolves to a WeakMap structure mapping elements to their spawned instances and their associated spawn information.

**spawnSynchronous**: Processes only synchronous spawn constructors from the mapping. Useful when you need to handle sync spawns separately before async operations.

**spawnAsynchronous**: Processes only asynchronous spawn constructors (functions that return Promise<SpawnConstructor>). Useful when you need to handle async spawns separately.
