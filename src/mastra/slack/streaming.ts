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
import {
	ANIMATION_INTERVAL,
	STEP_DISPLAY_DELAY,
	TOOL_DISPLAY_DELAY,
} from './constants';
import { getStatusText } from './status';
import { formatName, sleep } from './utils';
import type { StreamingOptions, StreamState } from './types';

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
// ORIGINAL IMPLEMENTATION (DISABLED)
// ─────────────────────────────────────────────────────────────────────────────
/*
export async function streamToSlack_ORIGINAL(options: StreamingOptions): Promise<void> {
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

	const state: StreamState = { text: '', chunkType: 'start' };

	let messageTs: string | undefined;
	let frame = 0;
	let animationTimer: NodeJS.Timeout | undefined;
	let isFinished = false;

	const stopAnimation = () => {
		isFinished = true;
		if (animationTimer) {
			clearInterval(animationTimer);
			animationTimer = undefined;
		}
	};

	const updateSlack = async (text?: string) => {
		if (!messageTs || isFinished) return;
		try {
			await slackClient.chat.update({
				channel,
				ts: messageTs,
				text: text ?? getStatusText(state, frame),
			});
		} catch {
			// ignore rate limits during animation
		}
	};

	const sendFinalMessage = async (text: string) => {
		await retrySlackUpdate(slackClient, channel, messageTs!, text);
	};

	try {
		// Post initial "thinking" message
		const initial = await slackClient.chat.postMessage({
			channel,
			thread_ts: threadTs,
			text: getStatusText(state, 0),
		});
		messageTs = initial.ts as string;

		// Start animation loop
		animationTimer = setInterval(() => {
			if (!isFinished) {
				frame++;
				updateSlack();
			}
		}, ANIMATION_INTERVAL);

		// Get agent and start streaming
		const agent = mastra.getAgent(agentName);
		if (!agent) throw new Error(`Agent "${agentName}" not found`);

		const stream = await agent.stream(message, {
			resourceId,
			threadId,
		});

		// Process chunks
		for await (const chunk of stream.fullStream) {
			state.chunkType = chunk.type;

			switch (chunk.type) {
				case 'text-delta':
					if (chunk.payload.text) {
						state.text += chunk.payload.text;
					}
					break;

				case 'tool-call':
					state.toolName = formatName(chunk.payload.toolName);
					frame++;
					await updateSlack();
					await sleep(TOOL_DISPLAY_DELAY);
					break;

				case 'tool-output':
					// Workflow events come wrapped in tool-output chunks
					if (
						chunk.payload.output &&
						typeof chunk.payload.output === 'object'
					) {
						const output = chunk.payload.output as {
							type?: string;
							payload?: { id?: string; stepId?: string };
						};
						// Use the inner workflow event type for display
						if (output.type) {
							state.chunkType = output.type;
						}
						if (output.type === 'workflow-step-start') {
							state.stepName = formatName(
								output.payload?.id ||
									output.payload?.stepId ||
									'step',
							);
							frame++;
							await updateSlack();
							await sleep(STEP_DISPLAY_DELAY);
						}
					}
					break;

				case 'workflow-execution-start':
					state.workflowName = formatName(
						chunk.payload.name || chunk.payload.workflowId,
					);
					state.stepName = 'Starting';
					break;
			}
		}

		// Done — send final response
		stopAnimation();
		await sendFinalMessage(
			state.text || "Sorry, I couldn't generate a response.",
		);
		console.log('✅ Response sent to Slack');
	} catch (error) {
		console.error('❌ Error streaming to Slack:', error);
		stopAnimation();

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
*/

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
