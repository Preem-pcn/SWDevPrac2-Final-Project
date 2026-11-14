import { authenticate } from "../_shared";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  return authenticate("/auth/login", { email, password });
}
