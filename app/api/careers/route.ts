import { NextResponse } from "next/server";
import { careers, getCareerFacets } from "@/data/careers";

export async function GET() {
  const facets = getCareerFacets(careers);
  return NextResponse.json({ careers, facets });
}
