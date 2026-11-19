"use client";

import { useEffect, useState } from "react";
import { apiRequest, ProjectIdea, resourceRequest } from "../lib/api-client";
import LoadingState from "../components/LoadingState";
import { MAX_NOTE_DESCRIPTION_LENGTH, MAX_NOTE_LANGUAGE_LENGTH, MAX_NOTE_TITLE_LENGTH } from "../lib/input-limits";
const LANGUAGE_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
];

export default function NotesPage() {
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    resourceRequest<ProjectIdea[]>("notes")
      .then((result) => {
        if (active) setIdeas(result.data);
      })
      .catch((error: unknown) => {
        if (active) {
          setHasLoadError(true);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load notes.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLanguage("");
    setEditingId(null);
  };

  const saveIdea = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLanguage = language.trim();

    if (!trimmedTitle || !trimmedDescription || !trimmedLanguage || isMutating) return;

    setIsMutating(true);
    setErrorMessage("");
    try {
      const result = await resourceRequest<ProjectIdea>("notes", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ id: editingId, title: trimmedTitle, description: trimmedDescription, language: trimmedLanguage }),
      });
      setIdeas((current) => editingId
        ? current.map((idea) => idea.id === editingId ? result.data : idea)
        : [result.data, ...current]);
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save this note.");
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (idea: ProjectIdea) => {
    setEditingId(idea.id);
    setTitle(idea.title);
    setDescription(idea.description);
    setLanguage(idea.language);
  };

  const removeIdea = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setErrorMessage("");
    try {
      await apiRequest(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setIdeas((current) => current.filter((idea) => idea.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to remove this note.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="page">
      <div className="hero-copy">
        <h1>Project Ideas</h1>
        <p className="subtext">
          Capture an idea, describe it clearly, and decide which language fits best.
        </p>
      </div>

      <div className="task-board">
        {errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
        <div className="task-form task-form--stacked">
          <label className="sr-only" htmlFor="idea-title">
            Project idea title
          </label>
          <input
            id="idea-title"
            value={title}
            maxLength={MAX_NOTE_TITLE_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Project idea"
            className="task-input"
          />

          <label className="sr-only" htmlFor="idea-description">
            Project description
          </label>
          <textarea
            id="idea-description"
            value={description}
            maxLength={MAX_NOTE_DESCRIPTION_LENGTH}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the project..."
            className="task-input task-textarea task-textarea--short"
            rows={5}
          />

          <label className="sr-only" htmlFor="idea-language">
            Programming language
          </label>
          <select
            id="idea-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="task-input"
          >
            <option value="">Select a language</option>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="form-actions">
            <button type="button" onClick={saveIdea} disabled={isMutating} className="primary-btn task-add-button">
              {isMutating ? "Saving..." : editingId ? "Save idea" : "Add idea"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} disabled={isMutating} className="secondary-btn task-remove-button">
                Cancel
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading notes..." />
        ) : hasLoadError ? null : ideas.length === 0 ? (
          <div className="item-card">
            <p>No project ideas yet. Add one to start planning.</p>
          </div>
        ) : (
          <div className="list">
            {ideas.map((idea) => (
              <article key={idea.id} className="item-card idea-card">
                <div className="entry-header">
                  <div>
                    <h2>{idea.title}</h2>
                    <p className="idea-language">Language: {idea.language}</p>
                  </div>
                  <div className="entry-actions">
                    <button type="button" onClick={() => startEditing(idea)} disabled={isMutating} className="secondary-btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeIdea(idea.id)} disabled={isMutating} className="secondary-btn">
                      Remove
                    </button>
                  </div>
                </div>
                <p className="idea-body">{idea.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
