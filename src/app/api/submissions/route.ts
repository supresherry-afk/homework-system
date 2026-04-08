import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const SUBMISSIONS_FILE = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'data', 'submissions.json');

export async function GET() {
  try {
    if (!existsSync(SUBMISSIONS_FILE)) {
      return NextResponse.json({ submissions: [] });
    }

    const data = await readFile(SUBMISSIONS_FILE, 'utf-8');
    const submissions = JSON.parse(data);

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('获取提交记录失败:', error);
    return NextResponse.json(
      { error: '获取提交记录失败' },
      { status: 500 }
    );
  }
}
