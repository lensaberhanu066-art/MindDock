"use client";

import { useEffect, useState } from "react";
import { apiRequest, ProjectIdea, resourceRequest } from "../lib/api-client";
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

  useEffect(() => {
    resourceRequest<ProjectIdea[]>("notes").then((result) => setIdeas(result.data)).catch(() => setIdeas([]));
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

    if (!trimmedTitle || !trimmedDescription || !trimmedLanguage) return;

    const result = await resourceRequest<ProjectIdea>("notes", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify({ id: editingId, title: trimmedTitle, description: trimmedDescription, language: trimmedLanguage }),
    });
    setIdeas((current) => editingId
      ? current.map((idea) => idea.id === editingId ? result.data : idea)
      : [result.data, ...current]);
    resetForm();
  };

  const startEditing = (idea: ProjectIdea) => {
    setEditingId(idea.id);
    setTitle(idea.title);
    setDescription(idea.description);
    setLanguage(idea.language);
  };

  const removeIdea = async (id: string) => {
    await apiRequest(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setIdeas((current) => current.filter((idea) => idea.id !== id));
    if (editingId === id) resetForm();
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
        <div className="task-form task-form--stacked">
          <label className="sr-only" htmlFor="idea-title">
            Project idea title
          </label>
          <input
            id="idea-title"
            value={title}
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
            <button type="button" onClick={saveIdea} className="primary-btn task-add-button">
              {editingId ? "Save idea" : "Add idea"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="secondary-btn task-remove-button">
                Cancel
              </button>
            )}
          </div>
        </div>

        {ideas.length === 0 ? (
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
                    <button type="button" onClick={() => startEditing(idea)} className="secondary-btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeIdea(idea.id)} className="secondary-btn">
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
