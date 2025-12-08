import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { shareId } = await request.json();

    if (!shareId) {
      return NextResponse.json({ error: "No shareId provided" }, { status: 400 });
    }

    // ゲストの位置情報(guest_lat, guest_lng)のみを削除(null)にする
    // セッション自体の status は変更しない
    const { error } = await supabase
      .from("sessions")
      .update({ guest_lat: null, guest_lng: null })
      .eq("id", shareId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}