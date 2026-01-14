# spawning

When instantiating a cloned template repeatedly, a common need is to be able to attach functionality to certain elements with each iteration.  This package assumes that the fastest way to do this associate is based on the "coordinates" of the cloned template (prior to any actual processing of the functionality).  This package provides a formal mechanism for doing this.

It is part of a larger effort to convert declarative custom elements or DOM fragments into an optimized set of instructions that does not compromise on performance.  This means turning "custom attributes" into quiet "enhancements" that need not expose a public API (or can provide an API without expensive DOM Node's that add to the bulk weight due to css styling and other concerns). 

So the focus of this package is to provide utilities  that spawn class instances tied to a cloned DOM fragment, based on a mapping configuration.

## Type Definitions

The core interfaces are:

```TypeScript
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
interface SpawnConstructor {
    new (el: Element, info: SpawnInfo, initVals?: unknown): Disposable;
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

**spawnAll**: The main entry point that orchestrates both synchronous and asynchronous spawning. Returns a promise that resolves to a WeakMap structure mapping elements to their spawned instances and their associated spawn information. The function merges results from both synchronous and asynchronous spawns.

**spawnSynchronous**: Processes only synchronous spawn constructors from the mapping. Returns a Map (not WeakMap) for tracking instances. Useful when you need to handle sync spawns separately before async operations.

**spawnAsynchronous**: Processes only asynchronous spawn constructors (functions that return Promise<SpawnConstructor>). Returns a promise that resolves to a Map (not WeakMap) for tracking instances. Useful when you need to handle async spawns separately.
