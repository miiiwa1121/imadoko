import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { shareId, hostId } = await request.json();

    if (!shareId || !hostId) {
      return NextResponse.json({ error: "Missing shareId or hostId" }, { status: 400 });
    }

    // ホストの検証
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("host_id")
      .eq("id", shareId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.host_id !== hostId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ステータスを 'stopped' に更新
    const { error } = await supabase
      .from("sessions")
      .update({ status: "stopped" })
      .eq("id", shareId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // エラー変数をコンソールに出力することで「未使用変数」の警告を回避します
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}