/**
 * Slack Streaming Module - SIMPLIFIED (Animation Disabled)
 *
 * ⚠️ ANIMATION AND STATUS UPDATES DISABLED ⚠️
 *
 * This module has been simplified to disable the animated status updates and
 * real-time progress indicators. It now only:
 * 1. Posts an initial "thinking" message
 * 2. Streams agent response in the background
 * 3. Posts the final response
 *
 * DISABLED FEATURES:
 * - ❌ Animated spinners (Braille pattern animation)
 * - ❌ Progress indicators for tool calls
 * - ❌ Live message updates every 300ms
 * - ❌ Special indicators for workflows/steps
 * - ❌ Real-time status text updates
 *
 * ORIGINAL FEATURES (Commented out below):
 * - Animated spinners while agent is thinking
 * - Progress indicators for tool calls and workflow steps
 * - Live message updates (no message spam)
 * - Animation timer (updates message every 300ms)
 * - State tracking for chunk types
 * - Special indicators for tools/workflows
 *
 * Current Flow:
 * 1. Post initial "⏳ Processing..." message
 * 2. Stream chunks from Mastra agent (collect text silently)
 * 3. Post final response once complete
 *
 * Error Handling:
 * - Errors are posted to Slack thread
 * - Retry logic for final message (3 attempts)
 */

import type { WebClient } from '@slack/web-api';
import { sleep } from './utils';
import type { StreamingOptions } from './types';

export type { StreamingOptions } from './types';

/**
 * Stream agent response to Slack with animated status updates
 *
 * This is the main entry point for processing agent responses and
 * displaying them in Slack with real-time progress indicators.
 *
 * @param options - Configuration including mastra instance, Slack client,
 *                  channel info, agent name, and message context
 */
export async function streamToSlack(options: StreamingOptions): Promise<void> {
	const {
		mastra,
		slackClient,
		channel,
		threadTs,
		agentName,
		message,
		resourceId,
		threadId,
	} = options;

	let messageTs: string | undefined;
	let responseText = '';

	// ─────────────────────────────────────────────────────────────────────────────
	// Slack helpers (SIMPLIFIED - No animation)
	// ─────────────────────────────────────────────────────────────────────────────

	const sendFinalMessage = async (text: string) => {
		await retrySlackUpdate(slackClient, channel, messageTs!, text);
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Main (SIMPLIFIED - No animation or status updates)
	// ─────────────────────────────────────────────────────────────────────────────

	try {
		// Post initial "processing" message (no animation)
		const initial = await slackClient.chat.postMessage({
			channel,
			thread_ts: threadTs,
			text: '⏳ Processing your request...',
		});
		messageTs = initial.ts as string;

		// Get agent and start streaming
		const agent = mastra.getAgent(agentName);
		if (!agent) throw new Error(`Agent "${agentName}" not found`);

		const stream = await agent.stream(message, {
			resourceId,
			threadId,
		});

		// Process chunks (SIMPLIFIED - Only collect text, no status updates)
		for await (const chunk of stream.fullStream) {
			switch (chunk.type) {
				case 'text-delta':
					if (chunk.payload.text) {
						responseText += chunk.payload.text;
					}
					break;

				// Ignore other chunk types (tool-call, workflow events, etc.)
				// No status updates or progress indicators
				default:
					break;
			}
		}

		// Done — send final response
		await sendFinalMessage(
			responseText || "Sorry, I couldn't generate a response.",
		);
		console.log('✅ Response sent to Slack');
	} catch (error) {
		console.error('❌ Error streaming to Slack:', error);

		const errorText = `❌ Error: ${
			error instanceof Error ? error.message : String(error)
		}`;
		if (messageTs) {
			await sendFinalMessage(errorText);
		} else {
			await slackClient.chat
				.postMessage({ channel, thread_ts: threadTs, text: errorText })
				.catch(() => {});
		}

		throw error;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retry sending final message to Slack with exponential backoff
 *
 * The final message is critical for user experience, so we retry up to 3 times
 * if the update fails due to rate limits or transient errors.
 *
 * @param client - Slack WebClient instance
 * @param channel - Channel ID where message was posted
 * @param ts - Message timestamp to update
 * @param text - Final text content to display
 * @param maxAttempts - Maximum retry attempts (default: 3)
 */
async function retrySlackUpdate(
	client: WebClient,
	channel: string,
	ts: string,
	text: string,
	maxAttempts = 3,
) {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			await client.chat.update({ channel, ts, text });
			return;
		} catch (err) {
			console.error(`❌ Final message attempt ${attempt + 1} failed:`, err);
			if (attempt < maxAttempts - 1) await sleep(500);
		}
	}
	console.error(`❌ Failed to send final message after ${maxAttempts} attempts`);
}
