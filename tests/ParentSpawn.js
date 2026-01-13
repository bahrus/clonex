export class ParentSpawn {
    constructor(el, info) {
        this.el = el;
        el.dataset.parent = 'yes';
    }
    dispose() {}
}