import { NextRequest, NextResponse } from 'next/server';

// 管理员账号配置（建议后续迁移到数据库或环境变量）
const ADMIN_ACCOUNTS: Record<string, { password: string; name: string }> = {
  'admin': { password: 'admin123', name: '管理员' },
  'teacher': { password: 'teacher123', name: '教师' },
};

export async function POST(request: NextRequest) {
  try {
    const { studentId, password } = await request.json();

    if (!studentId || !password) {
      return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 });
    }

    const admin = ADMIN_ACCOUNTS[studentId];
    if (!admin || admin.password !== password) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      admin: { name: admin.name, id: studentId }
    });
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
