# spawning

This package contains a utility that spawns classes tied to a (newly cloned) DOM fragment, based on a mapping.

The mapping structure looks as follows:

```TypeScript

interface SpawnInfo {}

interface SpawnConstructor {
    new (el: Element, info: SpawnInfo, initVals?: unknown): Disposable;
}

interface Disposable {
    dispose(el: Element, info: SpawnInfo);
}

interface SpawnMapping {
    spawn: SpawnConstructor | () => Promise<SpawnConstructor>
    spawnInfo: SpawnInfo
    //key is the index of the node
    [key: number] : SpawnMapping[]
}

interface SpawnRoot {
    //key is the index of the node
    [key: number] : SpawnMapping[],
    spawnCallback?: (el: Element, instance: Disposable, spawnInfo: SpawnInfo) => void;
}

```

This package contains public functions for spawning class instances:

```TypeScript
const template = document.createElement('template');
template.innerHTML = String.raw `<div>...</div>`;

const clone = template.cloneNode(true);

// Main entry point - processes both sync and async spawn mappings
async function spawnAll(clone: DOMFragment, options: SpawnRoot): WeakMap<Element, WeakMap<SpawnInfo, Disposable>>;

// Process synchronous spawn mappings only
function doSyncSpawns(mappings: SpawnMapping[], nodeIndex: number, nodes: Node[], options: SpawnRoot, elementToInfoMap: WeakMap<Element, WeakMap<SpawnInfo, Disposable>>): void;

// Process asynchronous spawn mappings (including async constructors)
async function doAsyncSpawns(mappings: SpawnMapping[], nodeIndex: number, nodes: Node[], options: SpawnRoot, elementToInfoMap: WeakMap<Element, WeakMap<SpawnInfo, Disposable>>): Promise<void>;
```

**spawnAll**: The main entry point that orchestrates both synchronous and asynchronous spawning. It processes all sync spawns first, then handles any async constructors.

**doSyncSpawns**: Helper function that processes only synchronous spawn mappings. Useful if you need to handle sync spawns separately.

**doAsyncSpawns**: Helper function that processes asynchronous spawn mappings, including handling async constructors that return `Promise<SpawnConstructor>`. Useful if you need to handle async spawns separately.
