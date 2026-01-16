import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    const { messages } = await request.json();

    const result = streamText({
        model: openai.responses('gpt-4o'),
        messages,
        tools: {
            web_search_preview: openai.tools.webSearchPreview()
        }
    });

    return result.toDataStreamResponse();
};
