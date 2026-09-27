/**
 * Shared brand mark for header/footer/loading splash — every consumer renders through this
 * one component, so the approved logo only needs to be wired up here.
 *
 * Source file: public/brand/logo.png.jpeg (1254x1254, opaque white background — real JPEG,
 * no alpha channel possible in that format). Used as-is: not cropped, not recolored, not
 * regenerated. next/image is given the actual display size per context (not the full
 * 1254x1254), so it requests an appropriately small optimized asset instead of serving the
 * full-resolution file into a 44px header slot.
 */
import Image from "next/image";

const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 32,
  md: 44,
  lg: 128,
};

export default function Logo({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const px = SIZE_PX[size];

  const image = (
    <Image
      src="/brand/logo.png.jpeg"
      alt="Travel Smarter"
      width={px}
      height={px}
      priority={size !== "sm"}
      className="h-full w-full object-contain"
    />
  );

  if (!light) {
    return (
      <span style={{ width: px, height: px }} className="inline-flex shrink-0">
        {image}
      </span>
    );
  }

  // The source file has an opaque white background -- on the Footer's dark background that
  // would show as a stray white box, so it's wrapped in a small white rounded chip here so it
  // reads as an intentional badge. This is presentation only; the image file itself is
  // untouched.
  const chipSize = px + 12;
  return (
    <span
      style={{ width: chipSize, height: chipSize }}
      className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm"
    >
      {image}
    </span>
  );
}
