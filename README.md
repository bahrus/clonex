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
    spawnCallback?: (el: Element, instance: Disposable, spawnInfo: ) => void;
}

```

This package contains a public function spawnAll:

```TypeScript
const template = document.createElement('template');
template.innerHTML = String.raw `<div>...</div>`;

const clone = template.cloneNode(true);



async function spawnAll(clone: DOMFragment, options: SpawnRoot): WeakMap<Element, WeakMap<SpawnInfo, Disposable>>;
```
