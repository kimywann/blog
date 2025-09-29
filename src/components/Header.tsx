import Link from "next/link";

export default function Header() {
  return (
    <header>
      <nav className="flex items-center justify-between">
        <Link href="/" className="font-medium cursor-pointer text-gray-400">
          Kimyngwan
        </Link>

        <div className="flex items-center space-x-6">
          <Link
            href="https://imminent-lunch-7f5.notion.site/Frontend-Developer-1e06975159448067af00fad1fba789b7?source=copy_link"
            className="cursor-pointer text-blue-500 font-medium"
          >
            resume
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-blue-500 font-medium"
          >
            github
          </Link>
        </div>
      </nav>
    </header>
  );
}
