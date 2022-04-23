import type {ArgsOf} from "discordx";

export type RoleUpdateTrigger = ArgsOf<"roleUpdate"> | ArgsOf<"roleCreate"> | ArgsOf<"roleDelete">
export type RoleTypes = "roleUpdate" | "roleCreate" | "roleDelete";

/**
 * If you implement this interface, you will receive Role delete, modification and creation events
 */
export interface IPermissionEventListener {
    /**
     * Will trigger when there is a role addition, modification or deletion
     * @param event
     * @param type
     */
    trigger(event: RoleUpdateTrigger, type: RoleTypes): Promise<void>;
}
