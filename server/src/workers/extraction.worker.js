import { prisma } from '../db/prisma.js';

const JOB_STATUS_QUEUED = 'QUEUED';
const JOB_STATUS_RUNNING = 'RUNNING';
const JOB_STATUS_SUCCEEDED = 'SUCCEEDED';
const JOB_STATUS_FAILED = 'FAILED';

const UPLOAD_STATUS_PENDING_EXTRACTION = 'PENDING_EXTRACTION';
const UPLOAD_STATUS_NEEDS_REVIEW = 'NEEDS_REVIEW';
const UPLOAD_STATUS_FAILED = 'FAILED';

function createSimulatedExtractionPayload() {
    return {
        patient: {
            firstName: 'Ximena',
            lastName: 'Richardson',
            dateOfBirth: '1991-04-12',
            sex: 'female',
            phone: '555-123-4567',
            email: 'ximena.richardson@example.com',
        },
        source: {
            documentType: 'patient_intake_form',
            extractionMethod: 'simulated_ai',
        },
    };
}

function shouldSimulateFailure() {
    return process.env.SIMULATE_EXTRACTION_FAILURE === 'true';
}

async function processNextQueuedJob() {
    // select queued job
    const queuedJob = await prisma.extractionJob.findFirst({
        where: {
            status: JOB_STATUS_QUEUED,
            attemptCount: {
                lt: 3,
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            id: true,
            uploadId: true,
            createdAt: true,
            attemptCount: true,
            maxAttempts: true,
        },
    });
    if (!queuedJob) {
        console.log('No queued jobs found.');
        return;
    }

    // claim and update queued job
    const claimResult = await prisma.extractionJob.updateMany({
        where: {
            id: queuedJob.id,
            status: JOB_STATUS_QUEUED,
            attemptCount: {
                lt: queuedJob.maxAttempts,
            },
        },
        data: {
            status: JOB_STATUS_RUNNING,
            attemptCount: {
                increment: 1,
            },
        },
    });
    if (claimResult.count === 0) return;

    // re-read claimed queued job with updated count
    const runningJob = await prisma.extractionJob.findUnique({
        where: {
            id: queuedJob.id,
        },
        select: {
            id: true,
            uploadId: true,
            attemptCount: true,
            maxAttempts: true,
        },
    });
    if (!runningJob) {
        throw new Error('Claimed extraction job not found');
    }

    const extractedPayload = createSimulatedExtractionPayload();

    try {
        // run only to simulated failure
        if (shouldSimulateFailure()) {
            throw new Error('Simulated extraction failure');
        }

        await prisma.$transaction(async (tx) => {
            // mark job as succeeded
            await tx.extractionJob.update({
                where: {
                    id: runningJob.id,
                },
                data: {
                    status: JOB_STATUS_SUCCEEDED,
                },
            });

            // create/update extraction result
            await tx.extractionResult.upsert({
                where: {
                    uploadId: runningJob.uploadId,
                },
                update: {
                    extractionJobId: runningJob.id,
                    extractedPayload,
                    confidence: 0.92,
                },
                create: {
                    uploadId: runningJob.uploadId,
                    extractionJobId: runningJob.id,
                    extractedPayload,
                    confidence: 0.92,
                },
            });

            // confirm upload can move to 'needs review'
            const uploadUpdateResult = await tx.upload.updateMany({
                where: {
                    id: runningJob.uploadId,
                    status: UPLOAD_STATUS_PENDING_EXTRACTION,
                },
                data: {
                    status: UPLOAD_STATUS_NEEDS_REVIEW,
                },
            });
            if (uploadUpdateResult.count === 0) {
                throw new Error(
                    'Upload not in expected pending extraction state',
                );
            }
        });

        console.log(
            `Processed extraction job ${runningJob.id} for upload ${runningJob.uploadId}`,
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Unknown extraction worker error';

        const shouldRetry = runningJob.attemptCount < runningJob.maxAttempts;

        await prisma.$transaction(async (tx) => {
            if (shouldRetry) {
                await tx.extractionJob.update({
                    where: {
                        id: runningJob.id,
                    },
                    data: {
                        status: JOB_STATUS_QUEUED,
                        errorMessage,
                    },
                });

                console.error(
                    `Extraction job ${runningJob.id} failed attempt ${runningJob.attemptCount}/${runningJob.maxAttempts}. Retrying...`,
                );

                return;
            }

            await tx.extractionJob.update({
                where: {
                    id: runningJob.id,
                },
                data: {
                    status: JOB_STATUS_FAILED,
                    errorMessage,
                },
            });

            await tx.upload.updateMany({
                where: {
                    id: runningJob.uploadId,
                    status: UPLOAD_STATUS_PENDING_EXTRACTION,
                },
                data: {
                    status: UPLOAD_STATUS_FAILED,
                },
            });
        });

        if (!shouldRetry) {
            console.error(
                `Extraction job ${runningJob.id} failed permanently after ${runningJob.attemptCount}/${runningJob.maxAttempts} attempts.`,
                error,
            );
        }
    }
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
