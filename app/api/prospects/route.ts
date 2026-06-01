import { NextRequest, NextResponse } from "next/server";
import {
  getAllProspects,
  createProspect,
  updateProspect,
  deleteProspect,
} from "@/lib/db";

export async function GET() {
  try {
    const prospects = getAllProspects();
    return NextResponse.json(prospects);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prospect = createProspect(body);
    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const updated = updateProspect(Number(id), updates);
    if (!updated)
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const deleted = deleteProspect(Number(id));
    if (!deleted)
      return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
