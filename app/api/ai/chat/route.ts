import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { aiChatRequestSchema } from '@/lib/ai/ai.schemas';
import { chatAi } from '@/lib/ai/ai.service';

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return jsonError(message, 400);
  }

  const parsed = aiChatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await getAuthenticatedUser();
    const cookieHeader = request.headers.get('cookie') ?? '';

    console.log('[AI Route] Chat request from user:', user.id, '— message:', parsed.data.message.slice(0, 80));

    const response = await chatAi({
      userId: user.id,
      message: parsed.data.message,
      contextWindowMonths: parsed.data.contextWindowMonths,
      cookies: cookieHeader,
    });

    console.log('[AI Route] Reply length:', response.reply.length);
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[AI Route] Error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized();
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonError(message, 500);
  }
}
