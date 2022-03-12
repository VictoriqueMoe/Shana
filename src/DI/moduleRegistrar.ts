import {container} from "tsyringe";
import Anilist from "anilist-node";

export function moduleRegistrar(): void {
    container.registerInstance(Anilist, new Anilist());
}

export function registerInstance(...instances: any): void {
    for (const instance of instances) {
        container.registerInstance(instance.constructor, instance);
    }
}
