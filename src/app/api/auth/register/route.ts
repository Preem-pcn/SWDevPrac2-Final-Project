import { authenticate } from "../_shared";

export async function POST(request: Request) {
  const { name, email, tel, role, password } = await request.json();
  return authenticate("/auth/register", { name, email, tel, role, password });
}
