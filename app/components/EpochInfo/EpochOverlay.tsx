import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/UI/Arrows"

interface EpochOverlayProps {
  children: React.ReactNode;
  prevPath?: string;
  nextPath?: string;
}

export default function EpochOverlay({ children, prevPath, nextPath }: EpochOverlayProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 grid h-screen min-h-screen pointer-events-none">
        {prevPath && (
          <a
            href={prevPath}
            className="flex items-center justify-center h-full left-0 absolute pointer-events-auto w-12 hover:bg-gradient-to-r from-gray-900  to-transparent focus:outline-none focus:bg-gradient-to-r "
            style={{ opacity: 0.7 }}
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
          </a>
        )}
        {nextPath && (
          <a
            href={nextPath}
            className="flex items-center justify-center h-full right-0 absolute pointer-events-auto w-12 hover:bg-gradient-to-l from-gray-900  to-transparent focus:outline-none focus:bg-gradient-to-r "
            style={{ opacity: 0.7 }}
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
          </a>
        )}
      </div>
      <div className="z-40">{children}</div>
    </>
  );
}
