# spawning

When instantiating a cloned template repeatedly, a common need is to be able to attach functionality to certain elements with each iteration.  This package assumes that the fastest way to do this association is based on the numerical "coordinates" of the elements within the cloned template (prior to any actual processing of the functionality).  This package provides a formal mechanism for doing this.

It is part of a [larger effort](https://github.com/bahrus/x-elm/wiki) to convert declarative custom elements or DOM fragments into an optimized set of instructions that does not compromise on performance.  This means turning "custom attributes" into quiet "enhancements" that need not expose a public API (or can provide an API without expensive DOM Node's that add to the bulk weight due to css styling and other concerns). 

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
interface SpawnInfo {
    spawn: SpawnConstructor | (() => Promise<SpawnConstructor>);
}

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
interface SIN {
    spawnInfo: SpawnInfo;
    initVals?: unknown;
    nodes?: NxSIN[];
}

/**
 * Tuple mapping a node index to its spawn configuration
 */
type NxSIN = [number, SIN];

/**
 * Root configuration for spawning
 */
interface SpawnRoot {
    // Array of node mappings as tuples [index, configuration]
    nodes: NxSIN[];
    spawnCallback?: (el: Element, instance: Disposable, spawnInfo: SpawnInfo) => void;
    /**
     * Optional debounce interval in milliseconds for DOM mutations before returning the instance map
     */
    mutationDebounceInterval?: number;
}
```

## Public API

The main exported function is:

```TypeScript
const template = document.createElement('template');
template.innerHTML = String.raw`<div>...</div>`;

const clone = template.content.cloneNode(true);

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
```

Additional helper functions are available but not part of the official type definitions:

```TypeScript
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

**spawnAll**: The main entry point that orchestrates both synchronous and asynchronous spawning. Returns a promise that resolves to a WeakMap structure mapping elements to their spawned instances and their associated spawn information. The function merges results from both synchronous and asynchronous spawns. If `mutationDebounceInterval` is specified in the options, the function will wait for DOM mutations to settle before returning, using a MutationObserver to detect changes and debouncing them by the specified interval in milliseconds.

**spawnSynchronous**: Processes only synchronous spawn constructors from the mapping. Returns a Map (not WeakMap) for tracking instances. Useful when you need to handle sync spawns separately before async operations.

**spawnAsynchronous**: Processes only asynchronous spawn constructors (functions that return Promise<SpawnConstructor>). Returns a promise that resolves to a Map (not WeakMap) for tracking instances. Useful when you need to handle async spawns separately.

## Mutation Debouncing

When spawned class instances modify the DOM (e.g., adding attributes, child elements, or other changes), you may want to wait for these mutations to complete before the `spawnAll` function returns. Use the `mutationDebounceInterval` option to specify a debounce interval in milliseconds:

```typescript
const result = await spawnAll(clone, {
    nodes: [...],
    mutationDebounceInterval: 100 // Wait 100ms after last mutation
});
```

This uses a MutationObserver to watch for DOM changes and waits for the specified interval of inactivity before resolving. This is particularly useful when:
- Spawned instances perform asynchronous DOM updates
- You need to ensure all DOM modifications are complete before proceeding
- Multiple instances might trigger cascading DOM changes


