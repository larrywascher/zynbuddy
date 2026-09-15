import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-bold text-sm dark:text-white">ZynBuddy</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Find the best nicotine pouch prices near you. Community-driven, real-time pricing.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-3">Explore</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Find Prices</Link>
              <Link href="/trending" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Trending</Link>
              <Link href="/rewards" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Rewards</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-3">Account</h4>
            <div className="space-y-2">
              <Link href="/profile" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Profile</Link>
              <Link href="/auth/signin" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Sign In</Link>
              <Link href="/auth/register" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Register</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-3">Legal</h4>
            <div className="space-y-2">
              <Link href="/terms" className="block text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">Terms of Service</Link>
              <span className="block text-xs text-gray-400">Privacy Policy</span>
              <span className="block text-xs text-gray-400">Community Guidelines</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-gray-400">
            &copy; {new Date().getFullYear()} ZynBuddy. All rights reserved. Prices are user-reported and may not be accurate.
          </p>
          <p className="text-[10px] text-gray-400">
            Not affiliated with any nicotine product manufacturer.
          </p>
        </div>
      </div>
    </footer>
  );
}
