import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const PASSWORDS_FILE = path.join(process.cwd(), 'data', 'passwords.json');

const DEFAULT_PASSWORDS: Record<string, string> = {
  '202240608136': '408136', '202340408101': '408101', '202340408102': '408102',
  '202340408103': '408103', '202340408104': '408104', '202340408105': '408105',
  '202340408106': '408106', '202340408107': '408107', '202340408108': '408108',
  '202340408109': '408109', '202340408110': '408110', '202340408111': '408111',
  '202340408112': '408112', '202340408113': '408113', '202340408114': '408114',
  '202340408115': '408115', '202340408116': '408116', '202340408117': '408117',
  '202340408118': '408118', '202340408119': '408119', '202340408120': '408120',
  '202340408122': '408122', '202340408124': '408124', '202340408125': '408125',
  '202340408126': '408126', '202340408127': '408127', '202340408128': '408128',
  '202340408129': '408129', '202340408130': '408130', '202340408131': '408131',
  '202340408132': '408132', '202340408133': '408133', '202340408134': '408134',
  '202340408135': '408135', '202340408136': '408136', '202340408137': '408137',
  '202340408138': '408138', '202340408139': '408139', '202340408140': '408140',
  '202340408141': '408141', '202340408142': '408142', '202340408143': '408143',
  '202340408144': '408144', '202340408145': '408145', '202340408146': '408146',
  '202340408147': '408147', '202340408148': '408148', '202340408149': '408149',
  '202340408150': '408150', '202340506342': '506342', '202341102144': '102144',
};

async function getPasswords(): Promise<Record<string, string>> {
  try {
    if (existsSync(PASSWORDS_FILE)) {
      const data = await readFile(PASSWORDS_FILE, 'utf-8');
      const saved = JSON.parse(data);
      return { ...DEFAULT_PASSWORDS, ...saved };
    }
  } catch {}
  return DEFAULT_PASSWORDS;
}

async function savePasswords(passwords: Record<string, string>) {
  await mkdir(path.dirname(PASSWORDS_FILE), { recursive: true });
  // 只保存修改过的密码
  const modified: Record<string, string> = {};
  for (const [id, pwd] of Object.entries(passwords)) {
    if (pwd !== DEFAULT_PASSWORDS[id]) {
      modified[id] = pwd;
    }
  }
  await writeFile(PASSWORDS_FILE, JSON.stringify(modified, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, oldPassword, newPassword } = await request.json();

    if (!studentId || !oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
    }

    const passwords = await getPasswords();
    
    if (passwords[studentId] !== oldPassword) {
      return NextResponse.json({ error: '原密码错误' }, { status: 401 });
    }

    passwords[studentId] = newPassword;
    await savePasswords(passwords);

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
  }
}
