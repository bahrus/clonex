export class TestSpawn {
    constructor(el, info) {
        this.el = el;
        this.info = info;
        el.textContent = 'Spawned!';
    }
    dispose(el, info) {
        el.textContent = '';
    }
}