import { useState, useEffect } from "react";
import { Send01, Trash02, Pencil01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import {
  getPeladaNotes,
  createPeladaNote,
  deletePeladaNote,
  type PeladaNote,
} from "@/lib/peladas";
import { useAuth } from "@/providers/auth-provider";
import { cx } from "@/utils/cx";

interface PeladaNotesProps {
  peladaId: string;
  isAdmin: boolean;
}

export function PeladaNotes({ peladaId, isAdmin }: PeladaNotesProps) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<PeladaNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadNotes();
  }, [peladaId]);

  const loadNotes = async () => {
    setIsLoading(true);
    const notesData = await getPeladaNotes(peladaId);
    setNotes(notesData);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !profile?.id) return;

    setIsSubmitting(true);
    const result = await createPeladaNote(peladaId, profile.id, newNote.trim());
    setIsSubmitting(false);

    if (result.data) {
      setNewNote("");
      loadNotes();
    }
  };

  const handleDelete = async (noteId: string) => {
    await deletePeladaNote(noteId);
    loadNotes();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-sm text-secondary">Carregando avisos...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={isAdmin ? "Escrever um aviso..." : "Ver avisos"}
          className={cx(
            "flex-1 rounded-xl border border-secondary bg-primary px-4 py-3 font-medium text-primary placeholder:text-quaternary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
            !isAdmin && "cursor-not-allowed opacity-50",
          )}
          disabled={!isAdmin}
        />
        {isAdmin && (
          <button
            type="submit"
            disabled={!newNote.trim() || isSubmitting}
            className="flex size-12 items-center justify-center rounded-xl bg-brand text-white transition-all hover:bg-brand-solid disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send01 className="size-5" />
          </button>
        )}
      </form>

      {notes.length > 0 && (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative flex items-start gap-3 rounded-xl bg-warning-primary/10 p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-solid">
                {note.author?.avatar_url ? (
                  <Avatar
                    src={note.author.avatar_url}
                    alt={note.author.name ?? ""}
                    size="xs"
                    rounded
                  />
                ) : (
                  <Pencil01 className="size-4 text-warning-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">{note.content}</p>
                <span className="text-xs text-tertiary">
                  {formatTime(note.created_at)}
                </span>
              </div>
              {isAdmin && profile?.id === note.author_id && (
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="absolute right-2 top-2 rounded-lg p-1.5 text-tertiary opacity-0 transition-all hover:bg-error-secondary hover:text-error-primary group-hover:opacity-100"
                >
                  <Trash02 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
