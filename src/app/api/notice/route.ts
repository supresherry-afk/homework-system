import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'data');
const NOTICE_FILE = path.join(DATA_DIR, 'notice.json');

const ADMIN_PASSWORD = 'admin123';

async function getNotice(): Promise<string> {
  try {
    if (existsSync(NOTICE_FILE)) {
      const data = await readFile(NOTICE_FILE, 'utf-8');
      return JSON.parse(data).notice || '';
    }
  } catch {}
  return '';
}

async function saveNotice(notice: string): Promise<void> {
  const { mkdirSync } = require('fs');
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  await writeFile(NOTICE_FILE, JSON.stringify({ notice, updatedAt: new Date().toISOString() }));
}

export async function GET() {
  const notice = await getNotice();
  return NextResponse.json({ notice });
}

export async function POST(request: NextRequest) {
  try {
    const { notice, password } = await request.json();
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }
    
    if (notice && notice.length > 20) {
      return NextResponse.json({ error: '提示内容不能超过20字' }, { status: 400 });
    }
    
    await saveNotice(notice || '');
    return NextResponse.json({ success: true, notice });
  } catch (error) {
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
