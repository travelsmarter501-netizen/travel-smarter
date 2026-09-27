export default function SmartPlannerGenerateButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-6 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-8 lg:-mx-10">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full rounded-full px-6 py-3.5 text-base font-bold transition-colors ${
          disabled ? "cursor-not-allowed bg-slate-200 text-slate-400" : "bg-teal-700 text-white shadow-sm hover:bg-teal-800"
        }`}
      >
        اعمل خطتي
      </button>
    </div>
  );
}
