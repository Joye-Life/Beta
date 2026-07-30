export function FlashMessage({ saved, error }: { saved?: string; error?: string }) {
  if (!saved && !error) return null;
  return (
    <div className={`mt-6 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      {error || saved}
    </div>
  );
}
