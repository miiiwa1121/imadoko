import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { shareId } = await request.json();

    if (!shareId) {
      return NextResponse.json({ error: "No shareId provided" }, { status: 400 });
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}