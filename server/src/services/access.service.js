import { prisma } from '../db/prisma.js';

const ROLE_PROVIDER = 'PROVIDER';
const ROLE_FRONT_DESK = 'FRONT_DESK';

const CLINIC_STAFF_ROLES = [ROLE_PROVIDER, ROLE_FRONT_DESK];

function createHttpError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export async function assertClinicStaffUser({ userId, clinicId }) {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            clinicId,
        },
        select: {
            id: true,
            clinicId: true,
            role: true,
        },
    });
    if (!user) {
        throw createHttpError('User is not authorized', 403);
    }
    if (!CLINIC_STAFF_ROLES.includes(user.role)) {
        throw createHttpError(
            'User does not have permission to perform this action',
            403,
        );
    }
    return user;
}
