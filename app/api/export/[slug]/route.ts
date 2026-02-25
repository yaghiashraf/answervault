import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { GitHubClient } from '@/lib/github';
import { getLicenseStatus } from '@/lib/license';
import {
  buildExportRows,
  buildEvidenceIndexRows,
  exportToCSV,
  exportToXLSX,
  exportEvidenceIndexToCSV,
  exportEvidenceIndexToMarkdown,
} from '@/lib/export';
import {
  DEMO_ANSWERS,
  DEMO_EVIDENCE,
  DEMO_QUESTIONNAIRE,
  DEMO_MAPPING,
} from '@/lib/demo-data';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const format = (searchParams.get('format') ?? 'csv').toLowerCase();
  const target = searchParams.get('target') ?? 'questionnaire';

  const license = getLicenseStatus(session.selected_repo);

  if (format === 'xlsx' && license.demo) {
    return NextResponse.json({
      error: 'XLSX export requires a valid license. Demo mode: CSV only.',
    }, { status: 403 });
  }

  let answers = DEMO_ANSWERS;
  let evidence = DEMO_EVIDENCE;
  let questionnaire = DEMO_QUESTIONNAIRE;
  let mapping = DEMO_MAPPING;

  if (!license.demo) {
    if (!session.selected_repo) {
      return NextResponse.json({ error: 'No repo selected' }, { status: 400 });
    }
    const client = new GitHubClient(session.github_access_token, session.selected_repo);
    [answers, evidence, questionnaire, mapping] = await Promise.all([
      client.listAnswers(),
      client.listEvidence(),
      client.getQuestionnaire(slug).then((q) => q ?? DEMO_QUESTIONNAIRE),
      client.getMapping(slug),
    ]);
  } else if (slug !== DEMO_QUESTIONNAIRE.slug) {
    return NextResponse.json({ error: 'Demo: only the demo questionnaire is available' }, { status: 400 });
  }

  const rows = buildExportRows(questionnaire, mapping, answers, license.demo);
  const evidenceRows = buildEvidenceIndexRows(questionnaire, mapping, answers, evidence);
  const filename = `${slug}-${new Date().toISOString().split('T')[0]}`;

  if (format === 'xlsx') {
    const buffer = exportToXLSX(rows, evidenceRows, slug);
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  if (target === 'evidence-md') {
    const md = exportEvidenceIndexToMarkdown(evidenceRows, slug, license.demo);
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}-evidence-index.md"`,
      },
    });
  }

  if (target === 'evidence-csv') {
    const csv = exportEvidenceIndexToCSV(evidenceRows);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}-evidence-index.csv"`,
      },
    });
  }

  const csv = exportToCSV(rows, license.demo);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
