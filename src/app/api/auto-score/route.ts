import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json');

async function getSubmissions(): Promise<any[]> {
  try {
    if (existsSync(DATA_FILE)) {
      const data = await readFile(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}
  return [];
}

async function saveSubmissions(data: any[]) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

const GRADE_SCORES: Record<string, number> = {
  'A': 12.5,
  'B': 11,
  'C': 9.5,
  'D': 8
};

// 自动评分
export async function POST(request: NextRequest) {
  try {
    const { homeworkTitle, defaultGrade, onlyUnscored } = await request.json();
    
    if (!homeworkTitle || !defaultGrade) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }
    
    if (!GRADE_SCORES[defaultGrade]) {
      return NextResponse.json({ error: '无效的等级' }, { status: 400 });
    }
    
    const submissions = await getSubmissions();
    let updatedCount = 0;
    
    for (let i = 0; i < submissions.length; i++) {
      const s = submissions[i];
      if (s.homeworkTitle !== homeworkTitle) continue;
      
      // 如果只评未评分的，且已有评分，则跳过
      if (onlyUnscored && s.grade) continue;
      
      submissions[i].grade = defaultGrade;
      submissions[i].bonus = submissions[i].bonus || 0;
      submissions[i].score = GRADE_SCORES[defaultGrade] + submissions[i].bonus;
      updatedCount++;
    }
    
    if (updatedCount === 0) {
      return NextResponse.json({ error: '没有符合条件的提交记录' }, { status: 400 });
    }
    
    await saveSubmissions(submissions);
    
    return NextResponse.json({ 
      success: true, 
      message: `已为 ${updatedCount} 份作业自动评分：${defaultGrade}级 (${GRADE_SCORES[defaultGrade]}分)`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Auto score error:', error);
    return NextResponse.json({ error: '自动评分失败' }, { status: 500 });
  }
}
