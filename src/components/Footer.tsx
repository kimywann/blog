import React from "react";
import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer>
      <nav className="flex items-center justify-between">
        <p className="text-gray-500">© 2025 kimywann</p>
        <div className="flex items-center space-x-4 mr-2">
          <a
            href="mailto:kimywan10@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <Image src="/email.svg" alt="email" width={23} height={23} />
          </a>
          <Link
            href="https://github.com/kimywann"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <Image src="/github.svg" alt="github" width={23} height={23} />
          </Link>
        </div>
      </nav>
    </footer>
  );
};
