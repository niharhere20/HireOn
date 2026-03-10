import prisma from '../config/database';

export type NotificationType =
    | 'WELCOME'
    | 'RESUME_UPLOADED'
    | 'SHORTLISTED'
    | 'INTERVIEW_SCHEDULED'
    | 'INTERVIEW_COMPLETED'
    | 'HIRED'
    | 'AI_ANALYZED';

export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string
) {
    return prisma.notification.create({
        data: { userId, type, title, message },
    });
}

export async function getNotificationsForUser(userId: string) {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
    });
}

export async function markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
}
