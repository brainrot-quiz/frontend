'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, UserGroupIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-1/4 h-full ${
              isActive('/') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">홈</span>
          </Link>
          
          <Link
            href="/characters"
            className={`flex flex-col items-center justify-center w-1/4 h-full ${
              isActive('/characters') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <UserGroupIcon className="w-6 h-6" />
            <span className="text-xs mt-1">캐릭터</span>
          </Link>
          
          <Link
            href="/fortune"
            className={`flex flex-col items-center justify-center w-1/4 h-full ${
              isActive('/fortune') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <SparklesIcon className="w-6 h-6" />
            <span className="text-xs mt-1">운세</span>
          </Link>
          
          <Link
            href="/ranking"
            className={`flex flex-col items-center justify-center w-1/4 h-full ${
              isActive('/ranking') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <TrophyIcon className="w-6 h-6" />
            <span className="text-xs mt-1">랭킹</span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 