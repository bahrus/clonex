import { test, expect } from '@playwright/test';

test.describe('spawnAll', () => {
    test.beforeEach(async ({ page }) => {
        // Set up a basic HTML structure for testing
        await page.setContent(`
            <html>
                <body>
                    <div id="root">
                        <div class="container">
                            <span class="item">Item 1</span>
                            <span class="item">Item 2</span>
                        </div>
                    </div>
                </body>
            </html>
        `);

        // Inject the spawnAll module
        await page.addScriptTag({
            path: './spawnAll.js',
            type: 'module'
        });
    });

    test('should instantiate a spawn class with element and spawnInfo', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            // Define a test class
            class TestSpawn {
                constructor(el, info) {
                    this.el = el;
                    this.info = info;
                    el.textContent = 'Spawned!';
                }
                dispose(el, info) {
                    el.textContent = '';
                }
            }

            // Create a template and clone
            const template = document.createElement('template');
            template.innerHTML = '<div class="spawned"></div>';
            const clone = template.content.cloneNode(true);

            // Define spawn mapping
            const options = {
                0: [{
                    spawn: TestSpawn,
                    spawnInfo: { data: 'test' }
                }]
            };

            // Execute spawnAll
            const instanceMap = await spawnAll(clone, options);
            return {
                success: instanceMap instanceof WeakMap,
                childCount: clone.childNodes.length,
                childText: clone.childNodes[0]?.textContent
            };
        });

        expect(result.success).toBe(true);
        expect(result.childText).toBe('Spawned!');
    });

    test('should handle async spawn constructors', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            class AsyncTestSpawn {
                constructor(el, info) {
                    this.el = el;
                    el.textContent = 'Async spawned!';
                }
                dispose(el, info) {
                    el.textContent = '';
                }
            }

            // Async function that returns the constructor
            async function getAsyncConstructor() {
                return AsyncTestSpawn;
            }

            const template = document.createElement('template');
            template.innerHTML = '<div class="async-spawned"></div>';
            const clone = template.content.cloneNode(true);

            const options = {
                0: [{
                    spawn: getAsyncConstructor,
                    spawnInfo: { async: true }
                }]
            };

            const instanceMap = await spawnAll(clone, options);
            return {
                success: instanceMap instanceof WeakMap,
                childText: clone.childNodes[0]?.textContent
            };
        });

        expect(result.success).toBe(true);
        expect(result.childText).toBe('Async spawned!');
    });

    test('should handle nested spawn mappings', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            class ParentSpawn {
                constructor(el, info) {
                    this.el = el;
                    el.textContent = 'Parent';
                }
                dispose() {}
            }

            class ChildSpawn {
                constructor(el, info) {
                    this.el = el;
                    el.textContent = 'Child';
                }
                dispose() {}
            }

            const template = document.createElement('template');
            template.innerHTML = '<div><span></span></div>';
            const clone = template.content.cloneNode(true);

            const options = {
                0: [{
                    spawn: ParentSpawn,
                    spawnInfo: { role: 'parent' },
                    1: [{
                        spawn: ChildSpawn,
                        spawnInfo: { role: 'child' }
                    }]
                }]
            };

            const instanceMap = await spawnAll(clone, options);
            const parentDiv = clone.childNodes[0];
            const childSpan = parentDiv.childNodes[0];

            return {
                success: instanceMap instanceof WeakMap,
                parentText: parentDiv.textContent,
                childText: childSpan.textContent
            };
        });

        expect(result.success).toBe(true);
        expect(result.parentText).toContain('Parent');
        expect(result.childText).toBe('Child');
    });

    test('should call spawn callback when provided', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            const callbacks = [];

            class CallbackTestSpawn {
                constructor(el, info) {
                    this.el = el;
                }
                dispose() {}
            }

            const template = document.createElement('template');
            template.innerHTML = '<div></div>';
            const clone = template.content.cloneNode(true);

            const options = {
                0: [{
                    spawn: CallbackTestSpawn,
                    spawnInfo: { id: 'test' }
                }],
                spawnCallback: (el, instance, spawnInfo) => {
                    callbacks.push({
                        element: el.tagName,
                        hasInstance: instance instanceof CallbackTestSpawn,
                        infoId: spawnInfo.id
                    });
                }
            };

            const instanceMap = await spawnAll(clone, options);
            return {
                success: instanceMap instanceof WeakMap,
                callbackCount: callbacks.length,
                callbackData: callbacks[0]
            };
        });

        expect(result.success).toBe(true);
        expect(result.callbackCount).toBe(1);
        expect(result.callbackData.element).toBe('DIV');
        expect(result.callbackData.hasInstance).toBe(true);
        expect(result.callbackData.infoId).toBe('test');
    });

    test('should store instances in nested WeakMaps', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            class StorageTestSpawn {
                constructor(el, info) {
                    this.el = el;
                    this.testValue = 'stored';
                }
                dispose() {}
            }

            const template = document.createElement('template');
            template.innerHTML = '<div></div>';
            const clone = template.content.cloneNode(true);
            const element = clone.childNodes[0];

            const options = {
                0: [{
                    spawn: StorageTestSpawn,
                    spawnInfo: { key: 'myInfo' }
                }]
            };

            const instanceMap = await spawnAll(clone, options);
            
            // Verify the instance is stored correctly
            const elementMap = instanceMap.get(element);
            const instance = elementMap?.get({ key: 'myInfo' });

            return {
                hasElementMap: instanceMap.has(element),
                hasElementInnerMap: elementMap instanceof WeakMap,
                instanceExists: instance !== undefined,
                instanceValue: instance?.testValue
            };
        });

        expect(result.hasElementMap).toBe(true);
        expect(result.hasElementInnerMap).toBe(true);
        expect(result.instanceValue).toBe('stored');
    });

    test('should skip mappings with invalid elements', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            let spawnCount = 0;

            class CountingSpawn {
                constructor(el, info) {
                    spawnCount++;
                    this.el = el;
                }
                dispose() {}
            }

            const template = document.createElement('template');
            template.innerHTML = '<div></div>';
            const clone = template.content.cloneNode(true);

            const options = {
                0: [{
                    spawn: CountingSpawn,
                    spawnInfo: { id: 'test' }
                }],
                5: [{
                    spawn: CountingSpawn,
                    spawnInfo: { id: 'out-of-bounds' }
                }]
            };

            const instanceMap = await spawnAll(clone, options);
            return {
                spawnCount: spawnCount,
                instanceMapValid: instanceMap instanceof WeakMap
            };
        });

        expect(result.spawnCount).toBe(1);
        expect(result.instanceMapValid).toBe(true);
    });

    test('should handle multiple spawn mappings on the same element', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { spawnAll } = window;
            
            class SpawnA {
                constructor(el, info) {
                    this.el = el;
                    this.name = 'A';
                }
                dispose() {}
            }

            class SpawnB {
                constructor(el, info) {
                    this.el = el;
                    this.name = 'B';
                }
                dispose() {}
            }

            const template = document.createElement('template');
            template.innerHTML = '<div></div>';
            const clone = template.content.cloneNode(true);
            const element = clone.childNodes[0];

            const options = {
                0: [
                    {
                        spawn: SpawnA,
                        spawnInfo: { type: 'A' }
                    },
                    {
                        spawn: SpawnB,
                        spawnInfo: { type: 'B' }
                    }
                ]
            };

            const instanceMap = await spawnAll(clone, options);
            const elementMap = instanceMap.get(element);

            return {
                hasElementMap: instanceMap.has(element),
                mapSize: Array.from(elementMap || new Map()).length
            };
        });

        expect(result.hasElementMap).toBe(true);
        expect(result.mapSize).toBe(2);
    });
});
