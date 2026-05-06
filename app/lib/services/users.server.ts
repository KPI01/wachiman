import z from "zod";
import { createUserSchema, trashUserSchema, updateUserSchema } from "../schemas/user";
import { UserEntity } from "../database/user.server";

export async function getManyUsers() {
    return await UserEntity.getAll()
}

export async function createUser(input: Record<string, unknown>) {
    const parsed =
        await createUserSchema.safeParseAsync(input);

    if (!parsed.success) {
        return { error: z.treeifyError(parsed.error) }
    }

    const newUser = await UserEntity.create(parsed.data)

    if (!newUser) {
        return { success: false }
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