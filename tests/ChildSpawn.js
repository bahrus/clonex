export class ChildSpawn {
    constructor(el, info) {
        this.el = el;
        el.textContent = 'Child';
    }
    dispose() {}
}