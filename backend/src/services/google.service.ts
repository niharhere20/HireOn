import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const TOKENS_FILE = path.join(__dirname, '../../tokens.json');
const REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export function createOAuth2Client() {
    return new google.auth.OAuth2(
        config.googleClientId,
        config.googleClientSecret,
        REDIRECT_URI
    );
}

export function getAuthUrl(): string {
    const client = createOAuth2Client();
    return client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });
}

export function saveTokens(tokens: object) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export function loadTokens(): object | null {
    try {
        if (!fs.existsSync(TOKENS_FILE)) return null;
        return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
    } catch {
        return null;
    }
}

export function isAuthorized(): boolean {
    return loadTokens() !== null;
}

/**
 * Create a Google Calendar event with a Meet link.
 * Returns the Meet join URL, or null if not authorized / API fails.
 */
export async function createCalendarEvent(params: {
    summary: string;
    startTime: Date;
    endTime: Date;
    attendeeEmails: string[];
    requestId: string;
}): Promise<string | null> {
    const tokens = loadTokens();
    if (!tokens) return null;

    try {
        const client = createOAuth2Client();
        client.setCredentials(tokens as any);

        // Auto-refresh tokens when they expire
        client.on('tokens', (newTokens) => {
            const existing = loadTokens() as any;
            saveTokens({ ...existing, ...newTokens });
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

        const event = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            sendUpdates: 'none', // We send our own emails via nodemailer
            requestBody: {
                summary: params.summary,
                start: { dateTime: params.startTime.toISOString() },
                end: { dateTime: params.endTime.toISOString() },
                attendees: params.attendeeEmails.map((email) => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: params.requestId,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            },
        });

        const meetLink = event.data.conferenceData?.entryPoints?.find(
            (ep) => ep.entryPointType === 'video'
        )?.uri ?? null;

        return meetLink;
    } catch (err) {
        console.error('[google] Calendar API error:', err);
        return null;
    }
}
