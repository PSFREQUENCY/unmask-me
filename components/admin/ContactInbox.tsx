/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin: incoming contact + Safe-Hub partner messages. Triages each
 * message to one of three terminal states via the store actions.
 */

import { useState } from "react";
import { Inbox, MailCheck, Archive, Trash, Building2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/store";

function relativeTime(at: number): string {
  const minutes = Math.floor((Date.now() - at) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_COLOR: Record<string, string> = {
  open: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  responded: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  archived: "text-slate-400 border-slate-500/30 bg-slate-500/10",
};

function MessageRow({
  id,
  from,
  body,
  status,
  at,
}: {
  id: string;
  from: string;
  body: string;
  status: "open" | "responded" | "archived";
  at: number;
}) {
  return (
    <div className="bg-black/50 p-3 rounded-lg border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-cyan-400 truncate max-w-[140px]">{from}</p>
        <span className={`text-[8px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-[10px] text-slate-300 leading-snug mb-2">{body}</p>
      <div className="flex items-center justify-between">
        <span className="text-[8px] text-slate-500 font-mono">{relativeTime(at)}</span>
        <div className="flex gap-1">
          <Button
            size="xs"
            variant="outline"
            className="text-[8px] h-5 px-1.5 border-emerald-500/30 text-emerald-400"
            onClick={() => store.resolveMessage(id, "responded")}
            disabled={status === "responded"}
          >
            <MailCheck className="w-3 h-3" />
          </Button>
          <Button
            size="xs"
            variant="outline"
            className="text-[8px] h-5 px-1.5 border-slate-500/30 text-slate-300"
            onClick={() => store.resolveMessage(id, "archived")}
            disabled={status === "archived"}
          >
            <Archive className="w-3 h-3" />
          </Button>
          <Button
            size="xs"
            variant="outline"
            className="text-[8px] h-5 px-1.5 border-red-500/30 text-red-400"
            onClick={() => store.resolveMessage(id, "archived")}
          >
            <Trash className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PartnerRow({
  id,
  name,
  type,
  status,
}: {
  id: string;
  name: string;
  type: string;
  status: "pending" | "approved" | "rejected";
}) {
  return (
    <div className="bg-black/50 p-3 rounded-lg border border-white/5">
      <p className="text-xs text-emerald-400">{name}</p>
      <p className="text-[9px] text-slate-500 mb-2">{type}</p>
      <div className="flex gap-2 items-center">
        <span className="text-[8px] text-slate-400 flex-1">{status}</span>
        <Button
          size="xs"
          className="h-5 text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          onClick={() => store.decideApplication(id, "approved")}
          disabled={status !== "pending"}
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="xs"
          className="h-5 text-[8px] bg-red-500/20 text-red-400 border border-red-500/30"
          onClick={() => store.decideApplication(id, "rejected")}
          disabled={status !== "pending"}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function ContactInbox() {
  const messages = useStore((s) => s.admin.contactMessages);
  const applications = useStore((s) => s.admin.partnerApplications);
  const [tab, setTab] = useState<"messages" | "partners">("messages");

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-xs text-slate-500 mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
        <Inbox className="w-3 h-3" /> Inbox & Applications
      </h3>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("messages")}
          className={`text-[9px] px-2 py-1 rounded font-mono uppercase ${
            tab === "messages" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
          }`}
        >
          Messages ({messages.length})
        </button>
        <button
          onClick={() => setTab("partners")}
          className={`text-[9px] px-2 py-1 rounded font-mono uppercase flex items-center gap-1 ${
            tab === "partners" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"
          }`}
        >
          <Building2 className="w-3 h-3" /> Partners ({applications.length})
        </button>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
        {tab === "messages" &&
          (messages.length ? (
            messages.map((m) => <MessageRow key={m.id} {...m} />)
          ) : (
            <p className="text-[10px] text-slate-500 italic">No messages.</p>
          ))}
        {tab === "partners" &&
          (applications.length ? (
            applications.map((a) => <PartnerRow key={a.id} {...a} />)
          ) : (
            <p className="text-[10px] text-slate-500 italic">No applications.</p>
          ))}
      </div>
    </div>
  );
}
