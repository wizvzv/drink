import { NextResponse } from "next/server";
import { getAllUsers } from "../../../lib/multi-user-store";

export async function GET() {
  try {
    const users = getAllUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
