import { prisma } from '../src/db/prisma.js';

const main = async () => {
    try {
        const clinic = await prisma.clinic.upsert({
            where: {
                name: 'CareConnect Mobile',
            },
            update: {},
            create: {
                name: 'CareConnect Mobile',
            },
        });

        const staff = await prisma.user.upsert({
            where: {
                email: 'andres@careconnect.care',
            },
            update: {},
            create: {
                clinicId: clinic.id,
                email: 'andres@careconnect.care',
                role: 'STAFF',
            },
        });

        console.log('Seed Connected!');
        console.log(clinic, staff);
    } catch (error) {
        console.error('Seed Failed', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};
main();
