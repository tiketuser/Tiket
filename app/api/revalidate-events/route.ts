import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST() {
  revalidatePath("/");
  revalidatePath("/ViewMore");
  revalidatePath("/Favorites");
  revalidatePath("/SearchResults/[query]", "page");
  revalidatePath("/EventPage/[title]", "page");
  return NextResponse.json({ revalidated: true });
}
