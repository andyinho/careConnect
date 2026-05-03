import { prisma } from '../db/prisma.js';

const JOB_STATUS_QUEUED = 'QUEUED';
const JOB_STATUS_RUNNING = 'RUNNING';
const JOB_STATUS_SUCCEEDED = 'SUCCEEDED';
const JOB_STATUS_FAILED = 'FAILED';

const UPLOAD_STATUS_PENDING_EXTRACTION = 'PENDING_EXTRACTION';
const UPLOAD_STATUS_NEEDS_REVIEW = 'NEEDS_REVIEW';
const UPLOAD_STATUS_FAILED = 'FAILED';

async function processNextQueuedJob() {
    const queuedJob = await prisma.extractionJob.findFirst({
        where: {
            status: JOB_STATUS_QUEUED,
        },
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            id: true,
            uploadId: true,
            createdAt: true,
        },
    });
    if (!queuedJob) {
        console.log('No queued jobs found.');
        return;
    }

    const claimResult = await prisma.extractionJob.updateMany({
        where: {
            id: queuedJob.id,
            status: JOB_STATUS_QUEUED,
        },
        data: {
            status: JOB_STATUS_RUNNING,
        },
    });
    if (claimResult.count === 0) return;

    await prisma.$transaction(async (tx) => {
        await tx.extractionJob.update({
            where: {
                id: queuedJob.id,
            },
            data: {
                status: JOB_STATUS_SUCCEEDED,
            },
        });

        const uploadUpdateResult = await tx.upload.updateMany({
            where: {
                id: queuedJob.uploadId,
                status: UPLOAD_STATUS_PENDING_EXTRACTION,
            },
            data: {
                status: UPLOAD_STATUS_NEEDS_REVIEW,
            },
        });
        if (uploadUpdateResult.count === 0) {
            throw new Error('Upload not in expected pending extraction state');
        }
    });

    console.log(
        `Processed extraction job ${queuedJob.id} for upload ${queuedJob.uploadId}`,
    );
}

async function runWorkerOnce() {
    console.log('Worker Tick Started...');
    await processNextQueuedJob();
    console.log('Worker Tick Completed...');
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function startWorkerLoop() {
    console.log('Worker loop started. Polling every 5 seconds...');
    while (true) {
        try {
            await runWorkerOnce();
        } catch (error) {
            console.error('Worker loop error:', error);
        }

        await sleep(5000);
    }
}

startWorkerLoop().catch(async (error) => {
    console.error('Fatal worker error:', error);
    await prisma.$disconnect();
    process.exit(1);
});
