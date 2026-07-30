import Image from "next/image";

export default function Loading() {
  return (
    <main className="shell grid min-h-[65vh] place-items-center">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16 animate-pulse overflow-hidden rounded-3xl shadow-brand">
          <Image src="/brand/joye-mark-dark.png" alt="" fill sizes="64px" className="object-cover" priority />
        </div>
        <p className="mt-4 text-sm font-semibold text-black/50">Loading Joye Life…</p>
      </div>
    </main>
  );
}
