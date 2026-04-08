import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 提交记录存储路径
const SUBMISSIONS_FILE = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'data', 'submissions.json');

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  homeworkTitle: string;
  description: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  submittedAt: string;
}

// 读取提交记录
async function getSubmissions(): Promise<Submission[]> {
  try {
    if (!existsSync(SUBMISSIONS_FILE)) {
      return [];
    }
    const data = await readFile(SUBMISSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取提交记录失败:', error);
    return [];
  }
}

// 保存提交记录
async function saveSubmissions(submissions: Submission[]): Promise<void> {
  const dir = path.dirname(SUBMISSIONS_FILE);
  // 确保目录存在
  const { mkdir } = await import('fs/promises');
  await mkdir(dir, { recursive: true });
  await writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const studentName = formData.get('studentName') as string;
    const studentId = formData.get('studentId') as string;
    const className = formData.get('className') as string;
    const homeworkTitle = formData.get('homeworkTitle') as string;
    const description = formData.get('description') as string || '';

    // 验证必填字段
    if (!file || !studentName || !studentId || !className || !homeworkTitle) {
      return NextResponse.json(
        { error: '请填写所有必填项并上传文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);

    // 生成文件名（包含时间戳和学生信息）
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `homeworks/${className}_${studentId}_${timestamp}_${sanitizedFileName}`;

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.type || 'application/octet-stream',
    });

    // 生成签名 URL（有效期 7 天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 60 * 60,
    });

    // 创建提交记录
    const submission: Submission = {
      id: `sub_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      studentName,
      studentId,
      className,
      homeworkTitle,
      description,
      fileName: file.name,
      fileKey,
      fileUrl,
      submittedAt: new Date().toISOString(),
    };

    // 保存到提交记录
    const submissions = await getSubmissions();
    submissions.unshift(submission); // 新记录放在最前面
    await saveSubmissions(submissions);

    return NextResponse.json({
      success: true,
      message: '作业提交成功',
      submission: {
        id: submission.id,
        fileName: submission.fileName,
        submittedAt: submission.submittedAt,
      },
    });

  } catch (error) {
    console.error('作业提交失败:', error);
    return NextResponse.json(
      { error: '作业提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}
