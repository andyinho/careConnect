import { prisma } from '../src/db/prisma.js';

const main = async () => {
    try {
        const clinicA = await prisma.clinic.upsert({
            where: {
                name: 'CareConnect Mobile',
            },
            update: {},
            create: {
                name: 'CareConnect Mobile',
            },
        });

        const clinicB = await prisma.clinic.upsert({
            where: {
                name: 'CareConnect San Francisco',
            },
            update: {},
            create: {
                name: 'CareConnect San Francisco',
            },
        });

        const staffA = await prisma.user.upsert({
            where: {
                email: 'andres@careconnect.care',
            },
            update: {
                clinicId: clinicA.id,
                role: 'PROVIDER',
            },
            create: {
                clinicId: clinicA.id,
                email: 'andres@careconnect.care',
                role: 'PROVIDER',
            },
        });

        const staffB = await prisma.user.upsert({
            where: {
                email: 'rebecca@careconnect.care',
            },
            update: {
                clinicId: clinicA.id,
                role: 'FRONT_DESK',
            },
            create: {
                clinicId: clinicA.id,
                email: 'rebecca@careconnect.care',
                role: 'FRONT_DESK',
            },
        });

        const staffC = await prisma.user.upsert({
            where: {
                email: 'steve@careconnect.care',
            },
            update: {
                clinicId: clinicB.id,
                role: 'FRONT_DESK',
            },
            create: {
                clinicId: clinicB.id,
                email: 'steve@careconnect.care',
                role: 'FRONT_DESK',
            },
        });

        const staffD = await prisma.user.upsert({
            where: {
                email: 'samantha@careconnect.care',
            },
            update: {
                clinicId: clinicB.id,
                role: 'ADMINISTRATIVE',
            },
            create: {
                clinicId: clinicB.id,
                email: 'samantha@careconnect.care',
                role: 'ADMINISTRATIVE',
            },
        });

        console.log('Seed connected!');
        console.log({
            clinicA,
            staffA,
            staffB,
            clinicB,
            staffC,
            staffD,
        });
    } catch (error) {
        console.error('Seed failed', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

main();
