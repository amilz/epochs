import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/UI/Arrows"

interface EpochOverlayProps {
  children: React.ReactNode;
  prevPath?: string;
  nextPath?: string;
}

export default function EpochOverlay(
  { children, prevPath, nextPath }: EpochOverlayProps
) {
  return (
    <div className="grid h-screen min-h-screen overflow-hidden">
      {prevPath && <Link
        className="absolute top-0 bottom-0 flex items-center left-0 ml-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
        href={prevPath}
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </Link>}
      {nextPath && <Link
        className="absolute top-0 bottom-0 flex items-center right-0 mr-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
        href={nextPath}
      >
        <ChevronRightIcon className="w-6 h-6" />
      </Link>}
      {children}
    </div>
  )
}
