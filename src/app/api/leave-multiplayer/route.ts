import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { participantId, sessionId } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: 'Missing participantId' }, { status: 400 });
    }

    // セッション参加情報から自身を削除
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // もしその参加者がホストで、セッション全体を終える必要がある場合などはここに追加可能
    // 現状は退室(delete)のみ

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
