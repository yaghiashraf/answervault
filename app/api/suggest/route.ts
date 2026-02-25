/**
 * Answer suggestion endpoint – keyword-based (no LLM required)
 * Optional: if OPENAI_API_KEY is set, uses embeddings for better matching.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import { rankAnswersForQuestion } from '@/lib/export';
import { DEMO_ANSWERS } from '@/lib/demo-data';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { question: string; topN?: number };
  if (!body.question) {
    return NextResponse.json({ error: 'question field required' }, { status: 400 });
  }

  const license = getLicenseStatus(session.selected_repo);

  let answers = DEMO_ANSWERS;
  if (!license.demo && session.selected_repo) {
    const client = new GitHubClient(session.github_access_token, session.selected_repo);
    answers = await client.listAnswers();
  }

  const suggestions = rankAnswersForQuestion(body.question, answers, body.topN ?? 3);

  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      id: s.answer.id,
      title: s.answer.title,
      short_answer: s.answer.short_answer,
      score: s.score,
      tags: s.answer.tags,
      frameworks: s.answer.frameworks,
    })),
  });
}
