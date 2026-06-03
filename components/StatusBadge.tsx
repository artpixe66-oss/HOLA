import type { ProspectStatus } from "@/lib/types";

const STATUS_STYLES: Record<ProspectStatus, string> = {
  "À contacter": "bg-gray-100 text-gray-700",
  "Contacté": "bg-blue-100 text-blue-700",
  "Intéressé": "bg-yellow-100 text-yellow-700",
  "Client": "bg-green-100 text-green-700",
  "Perdu": "bg-red-100 text-red-700",
  "Pas intéressé": "bg-zinc-200 text-zinc-600",
};

export default function StatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
