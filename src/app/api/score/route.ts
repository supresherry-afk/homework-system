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

// 获取分数
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentName = searchParams.get('studentName');
    const homeworkTitle = searchParams.get('homeworkTitle');
    
    const submissions = await getSubmissions();
    
    if (studentName && homeworkTitle) {
      const submission = submissions.find(
        s => s.studentName === studentName && s.homeworkTitle === homeworkTitle
      );
      return NextResponse.json({ 
        grade: submission?.grade || null,
        bonus: submission?.bonus || 0,
        score: submission?.score || null
      });
    }
    
    // 返回所有分数
    const scores: Record<string, Record<string, any>> = {};
    for (const s of submissions) {
      if (!scores[s.studentName]) scores[s.studentName] = {};
      if (s.score !== undefined) {
        scores[s.studentName][s.homeworkTitle] = {
          grade: s.grade,
          bonus: s.bonus || 0,
          score: s.score
        };
      }
    }
    
    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ error: '获取分数失败' }, { status: 500 });
  }
}

// 设置分数（管理员）
export async function POST(request: NextRequest) {
  try {
    const { studentName, homeworkTitle, grade, bonus } = await request.json();
    
    if (!studentName || !homeworkTitle || !grade) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }
    
    const gradeScores: Record<string, number> = {
      'A': 12.5,
      'B': 11,
      'C': 9.5,
      'D': 8
    };
    
    const baseScore = gradeScores[grade] || 0;
    const bonusScore = Number(bonus) || 0;
    const totalScore = baseScore + bonusScore;
    
    const submissions = await getSubmissions();
    const index = submissions.findIndex(
      s => s.studentName === studentName && s.homeworkTitle === homeworkTitle
    );
    
    if (index === -1) {
      return NextResponse.json({ error: '提交记录不存在' }, { status: 404 });
    }
    
    submissions[index].grade = grade;
    submissions[index].bonus = bonusScore;
    submissions[index].score = totalScore;
    await saveSubmissions(submissions);
    
    return NextResponse.json({ 
      success: true, 
      message: '评分成功',
      score: totalScore
    });
  } catch {
    return NextResponse.json({ error: '保存分数失败' }, { status: 500 });
  }
}
