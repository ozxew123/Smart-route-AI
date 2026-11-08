import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: session.userId,
        nama: session.name,
        email: session.email,
      },
    },
    { status: 200 }
  );
}

