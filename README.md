# spawning

This package contains a utility that spawns classes tied to a (newly cloned) DOM fragment, based on a mapping.

The mapping structure looks as follows:

```TypeScript

interface SpawnConstructor {
    new (el: Element, info: SpawnInfo, initVals?: unknown): Disposable;
}

interface Disposable {
    dispose(el: Element, info: SpawnInfo);
}

interface SpawnMapping {
    spawn: SpawnConstructor | () => Promise<SpawnConstructor>
    [key: number] : SpawnMapping
}

interface SpawnRoot {
    [key: number] : SpawnMapping,
    spawnCallback?: (el: Element, instance: Disposable) => void;
}
```
