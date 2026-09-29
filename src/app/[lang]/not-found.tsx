import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card text-center">
      <h1 className="mb-2 text-3xl">404</h1>
      <p className="mb-4 text-muted">Page not found · पेज नहीं मिला</p>
      <Link href="/en" className="btn">🏠 Home</Link>
    </div>
  );
}
