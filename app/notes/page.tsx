"use client";

import { useEffect, useState } from "react";

type ProjectIdea = {
  id: string;
  title: string;
  description: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "minddock-notes";
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
    const stored = globalThis.window?.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setIdeas(JSON.parse(stored));
      } catch {
        setIdeas([]);
      }
    }
  }, []);

  useEffect(() => {
    if (ideas.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [ideas]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLanguage("");
    setEditingId(null);
  };

  const saveIdea = () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLanguage = language.trim();

    if (!trimmedTitle || !trimmedDescription || !trimmedLanguage) return;

    const now = new Date().toISOString();

    if (editingId) {
      setIdeas((current) =>
        current.map((idea) =>
          idea.id === editingId
            ? {
                ...idea,
                title: trimmedTitle,
                description: trimmedDescription,
                language: trimmedLanguage,
                updatedAt: now,
              }
            : idea
        )
      );
    } else {
      setIdeas((current) => [
        {
          id: crypto.randomUUID(),
          title: trimmedTitle,
          description: trimmedDescription,
          language: trimmedLanguage,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    resetForm();
  };

  const startEditing = (idea: ProjectIdea) => {
    setEditingId(idea.id);
    setTitle(idea.title);
    setDescription(idea.description);
    setLanguage(idea.language);
  };

  const removeIdea = (id: string) => {
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
        <div className="task-form" style={{ flexDirection: "column", alignItems: "stretch" }}>
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
            className="task-input"
            rows={5}
            style={{ resize: "vertical", minHeight: "120px" }}
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

          <div className="flex gap-3 flex-wrap">
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
              <article
                key={idea.id}
                className="item-card"
                style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #172554 100%)",
                  borderColor: "rgba(255,255,255,0.24)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-white" style={{ fontSize: "1.05rem" }}>{idea.title}</h2>
                    <p className="mb-3 text-sm font-semibold text-cyan-300">
                      Language: {idea.language}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEditing(idea)} className="secondary-btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeIdea(idea.id)} className="secondary-btn">
                      Remove
                    </button>
                  </div>
                </div>
                <p style={{ whiteSpace: "pre-wrap", color: "#f8fbff", lineHeight: 1.8, fontSize: "0.96rem" }}>{idea.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
