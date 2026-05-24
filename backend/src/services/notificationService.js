// backend/src/services/notificationService.js
//
// Small helper that creates a Notification document. Use from any
// controller when an event happens that should appear in the user's
// notification bell. Fire-and-forget — never lets a notification
// failure break the parent request.

import Notification from '../models/Notification.js';

/**
 * Create a notification for a user.
 *
 * @param {Object} options
 * @param {ObjectId|String} options.userId - recipient user ID
 * @param {String} options.text - notification text
 * @param {String} [options.type='info'] - one of: info|success|warning|milestone|event|message
 * @param {String} [options.link] - optional URL to open when clicked
 * @returns {Promise<Notification|null>}
 */
export async function notify({ userId, text, type = 'info', link }) {
    if (!userId || !text) {
        console.warn('[notify] missing userId or text:', { userId, text });
        return null;
    }
    try {
        const notif = await Notification.create({
            user: userId,
            text,
            type,
            link: link || undefined,
            read: false,
        });
        return notif;
    } catch (err) {
        console.error('[notify] failed:', err.message);
        return null;
    }
}

/** Bulk notify multiple users with the same payload */
export async function notifyMany(userIds, payload) {
    return Promise.all(userIds.map((id) => notify({ ...payload, userId: id })));
}