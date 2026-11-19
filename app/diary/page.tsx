"use client";

import { useEffect, useState } from "react";
import { apiRequest, DiaryEntry, resourceRequest } from "../lib/api-client";
import LoadingState from "../components/LoadingState";
import { MAX_DIARY_CONTENT_LENGTH, MAX_DIARY_TITLE_LENGTH } from "../lib/input-limits";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    resourceRequest<DiaryEntry[]>("diary")
      .then((result) => {
        if (active) setEntries(result.data);
      })
      .catch((error: unknown) => {
        if (active) {
          setHasLoadError(true);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load diary entries.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const saveEntry = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent || isMutating) return;

    setIsMutating(true);
    setErrorMessage("");
    try {
      const result = await resourceRequest<DiaryEntry>("diary", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ id: editingId, title: trimmedTitle, content: trimmedContent }),
      });
      setEntries((current) => editingId
        ? current.map((entry) => entry.id === editingId ? result.data : entry)
        : [result.data, ...current]);
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save this diary entry.");
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
  };

  const removeEntry = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setErrorMessage("");
    try {
      await apiRequest(`/api/diary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setEntries((current) => current.filter((entry) => entry.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to remove this diary entry.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="page">
      <div className="hero-copy">
        <h1>Diary</h1>
        <p className="subtext">
          Capture reflections, wins, and moments that matter in one place.
        </p>
      </div>

      <div className="task-board">
        {errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
        <div className="task-form task-form--stacked">
          <label className="sr-only" htmlFor="diary-title">
            Entry title
          </label>
          <input
            id="diary-title"
            value={title}
            maxLength={MAX_DIARY_TITLE_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Entry title"
            className="task-input"
          />

          <label className="sr-only" htmlFor="diary-content">
            Entry content
          </label>
          <textarea
            id="diary-content"
            value={content}
            maxLength={MAX_DIARY_CONTENT_LENGTH}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write about your day..."
            className="task-input task-textarea"
            rows={6}
          />

          <div className="form-actions">
            <button type="button" onClick={saveEntry} disabled={isMutating} className="primary-btn task-add-button">
              {isMutating ? "Saving..." : editingId ? "Save changes" : "Add entry"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} disabled={isMutating} className="secondary-btn task-remove-button">
                Cancel
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading diary..." />
        ) : hasLoadError ? null : entries.length === 0 ? (
          <div className="item-card">
            <p>No diary entries yet. Add your first note to get started.</p>
          </div>
        ) : (
          <div className="list">
            {entries.map((entry) => (
              <article key={entry.id} className="item-card">
                <div className="entry-header">
                  <div>
                    <h2>{entry.title}</h2>
                    <p className="entry-meta">
                      {new Date(entry.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="entry-actions">
                    <button type="button" onClick={() => startEditing(entry)} disabled={isMutating} className="secondary-btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeEntry(entry.id)} disabled={isMutating} className="secondary-btn">
                      Remove
                    </button>
                  </div>
                </div>
                <p className="entry-body">{entry.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
