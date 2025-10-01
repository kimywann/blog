import Link from "next/link";

export default function Header() {
  return (
    <header>
      <nav className="flex items-center">
        <Link
          href="/"
          className="font-medium text-2xl cursor-pointer text-gray-400"
        >
          김영완 블로그
        </Link>
      </nav>
    </header>
  );
}
