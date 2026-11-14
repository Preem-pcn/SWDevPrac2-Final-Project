import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-6 px-5 py-24 md:px-10">
      <h1 className="display text-7xl">This stall is empty.</h1>
      <p className="text-lg text-muted">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="btn bg-lantern text-onlight hover:bg-glow">Back to the market</Link>
    </div>
  );
}
