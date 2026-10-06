import z from "zod";
import { createUserSchema, trashUserSchema, updateUserSchema } from "../schemas/user";
import { updatePasswordSchema } from "../schemas/auth";
import { USER_ALREADY_EXISTS } from "../schemas/messages";
import { UserEntity } from "../database/user.server";

export async function getManyUsers({
    exclude = {},
    isActive,
    query,
    siteId,
    departmentId,
    role,
}: { exclude?: Record<string, unknown>; isActive?: boolean | null; query?: string; siteId?: string; departmentId?: string; role?: import("../../../db/enums").UserRole } = {}) {

    return await UserEntity.getAll({
        exclude,
        ...(isActive !== undefined ? { isActive } : {}),
        ...(query ? { query } : {}),
        ...(siteId ? { siteId } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(role ? { role } : {}),
    })
}

export async function createUser(input: Record<string, unknown>) {
    const parsed =
        await createUserSchema.safeParseAsync(input);

    if (!parsed.success) {
        return { error: z.treeifyError(parsed.error) }
    }

    const newUser = await UserEntity.create(parsed.data)

    if (!newUser) {
        return {
            success: false,
            error: {
                properties: {
                    username: { errors: [USER_ALREADY_EXISTS] },
                },
            },
        }
    }

    return { success: true }
}

export async function updateUser(input: Record<string, unknown>) {
    if (!input.id) {
        return { success: false, error: "The user ID is missing" }
    }

    const parsed = await updateUserSchema.safeParseAsync(input)

    if (!parsed.success) {
        return { success: false, error: z.treeifyError(parsed.error) }
    }

    const { id, ...data } = parsed.data
    const updatedUser = await UserEntity.update(id, data)

    if (!updatedUser) {
        return { success: false }
    }

    return { success: true }
}

export async function trashUser(input: Record<string, unknown>) {
    const parsed = await trashUserSchema.safeParseAsync(input)

    if (!parsed.success) {
        return { success: false, error: z.treeifyError(parsed.error) }
    }

    const trashedUser = await UserEntity.trash(parsed.data.id)

    if (!trashedUser) {
        return { success: false }
    }

    return { success: true }
}

export async function resetUserPassword(
    userId: string,
    input: Record<string, unknown>,
) {
    const parsed = await updatePasswordSchema.safeParseAsync(input);

    if (!parsed.success) {
        return { errors: z.treeifyError(parsed.error) };
    }

    const updatedUser = await UserEntity.updatePassword(userId, parsed.data);

    if (!updatedUser) {
        return { success: false, error: "No se encontró el usuario." };
    }

    return { success: true };
}
