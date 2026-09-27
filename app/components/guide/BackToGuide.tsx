import Link from "next/link";
import { IconArrowRight } from "../icons";

export default function BackToGuide({ basePath }: { basePath: string }) {
  return (
    <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800">
      <IconArrowRight className="h-4 w-4" />
      رجوع للدليل
    </Link>
  );
}
