'use client';
import { Brain } from 'lucide-react';

// Footer
const Footer = () => (
  <footer className="bg-gray-900 py-12 dark:bg-black">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between md:flex-row">
        <div className="mb-4 flex items-center gap-3 md:mb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">DPV Research</span>
        </div>

        <div className="mb-4 flex gap-6 md:mb-0">
          <a href="/ethics-privacy-participation" className="text-gray-400 transition-colors hover:text-white">
            Ethics & Privacy
          </a>
          <a href="/terms-conditions" className="text-gray-400 transition-colors hover:text-white">
            Terms
          </a>
          <a href="/contact-us" className="text-gray-400 transition-colors hover:text-white">
            Contact
          </a>
        </div>

        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} DPV Research. Built with ❤️ by Anthony Laguan.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
