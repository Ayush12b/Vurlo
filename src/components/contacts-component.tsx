import { useEffect, useState } from "react";
import {
  collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Mail, Trash2, CheckCheck, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  timestamp?: { seconds: number };
}

export default function ContactsComponent() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const q = query(collection(db, "contacts"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact)));
      } catch (e) {
        toast.error("Failed to load contacts.");
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "contacts", id), { read: true });
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, read: true } : c));
  };

  const deleteContact = async (id: string) => {
    await deleteDoc(doc(db, "contacts", id));
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Deleted.");
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-white/40">Loading Contacts...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Support Contacts</h1>
        <p className="text-sm text-white/40 mt-1">{contacts.length} submission{contacts.length !== 1 ? "s" : ""}</p>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No contact submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl border p-5 transition-all ${
                c.read
                  ? "border-white/[0.06] bg-[#0b0b12]"
                  : "border-violet-500/30 bg-[#0f0f1a]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!c.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                    <span className="text-xs text-white/40 truncate">{c.email}</span>
                  </div>
                  {c.timestamp && (
                    <p className="text-[11px] text-white/25 mb-2">
                      {new Date(c.timestamp.seconds * 1000).toLocaleString()}
                    </p>
                  )}
                  <p
                    className={`text-sm text-white/60 leading-relaxed cursor-pointer ${
                      expanded === c.id ? "" : "line-clamp-2"
                    }`}
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    {c.message}
                  </p>
                  {c.message.length > 120 && (
                    <button
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="text-[11px] text-violet-400 mt-1 hover:text-violet-300"
                    >
                      {expanded === c.id ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`mailto:${c.email}`}
                    className="p-2 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-white/[0.04] transition-colors"
                    title="Reply via email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  {!c.read && (
                    <button
                      onClick={() => markRead(c.id)}
                      className="p-2 rounded-lg text-white/40 hover:text-green-400 hover:bg-white/[0.04] transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
