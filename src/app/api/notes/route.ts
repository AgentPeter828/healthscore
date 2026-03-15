import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { noteCreationSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const accountId = request.nextUrl.searchParams.get("accountId");

  let query = supabase
    .from("hs_notes")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data: notes } = await query;
  return NextResponse.json(notes || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 });

  const body = await request.json();

  // Validate with Zod
  const parsed = noteCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid note data", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { account_id, content, type } = parsed.data;

  const { data: note, error } = await supabase
    .from("hs_notes")
    .insert({
      organization_id: profile.organization_id,
      account_id,
      author_id: user.id,
      content,
      type: type || "note",
    })
    .select("*, author:profiles(full_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(note);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("organization_id").eq("id", user.id).single();

  const { id } = await request.json();

  await supabase
    .from("hs_notes")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)
    .eq("organization_id", profile?.organization_id);

  return NextResponse.json({ success: true });
}
