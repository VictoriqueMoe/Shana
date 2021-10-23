import {ArgsOf} from "discordx";

export type RoleUpdateTrigger = ArgsOf<"roleUpdate"> | ArgsOf<"roleCreate"> | ArgsOf<"roleDelete">
export type RoleTypes = "roleUpdate" | "roleCreate" | "roleDelete";

/**
 * If you implement this interface, you will be able to Role delete, modification and creation
 */
export interface IPermissionEventListener {
    /**
     * Will trigger when there is a role addition, modification or deletion
     * @param event
     * @param type
     */
    trigger(event: RoleUpdateTrigger, type: RoleTypes): Promise<void>;
}