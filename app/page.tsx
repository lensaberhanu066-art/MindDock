'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type DiaryEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type ProjectIdea = {
  id: string;
  title: string;
  description: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEYS = {
  tasks: 'minddock-tasks',
  diary: 'minddock-diary',
  notes: 'minddock-notes',
};

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);

  useEffect(() => {
    const storedTasks = window.localStorage.getItem(STORAGE_KEYS.tasks);
    const storedEntries = window.localStorage.getItem(STORAGE_KEYS.diary);
    const storedIdeas = window.localStorage.getItem(STORAGE_KEYS.notes);

    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks));
      } catch {
        setTasks([]);
      }
    }

    if (storedEntries) {
      try {
        setEntries(JSON.parse(storedEntries));
      } catch {
        setEntries([]);
      }
    }

    if (storedIdeas) {
      try {
        setIdeas(JSON.parse(storedIdeas));
      } catch {
        setIdeas([]);
      }
    }
  }, []);

  const activeTasks = tasks.filter((task) => !task.completed).length;
  const completedTasks = tasks.length - activeTasks;
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const recentTasks = tasks.slice(0, 3);
  const recentEntries = entries.slice(0, 2);
  const recentIdeas = ideas.slice(0, 2);

  const overviewCards = useMemo(
    () => [
      {
        label: 'Open tasks',
        value: activeTasks,
        detail: `${tasks.length} total task${tasks.length === 1 ? '' : 's'}`,
        href: '/tasks',
        accent: 'tasks',
      },
      {
        label: 'Diary entries',
        value: entries.length,
        detail: entries.length === 1 ? 'One entry saved' : 'Entries saved',
        href: '/diary',
        accent: 'diary',
      },
      {
        label: 'Notes',
        value: ideas.length,
        detail: ideas.length === 1 ? 'One idea captured' : 'Ideas captured',
        href: '/notes',
        accent: 'notes',
      },
    ],
    [activeTasks, tasks.length, entries.length, ideas.length],
  );

  return (
    <section className="dashboard">
      <div className="hero-copy dashboard-reveal">
        <p className="eyebrow">All your work in one place</p>
        <h1>Dashboard</h1>
        <p className="subtext">
          See your tasks, diary entries, and notes together so you can stay focused and reflect without switching pages.
        </p>
        <div className="hero-actions">
          <Link href="/tasks" className="primary-btn interactive-btn">Go to Tasks</Link>
          <Link href="/diary" className="secondary-btn interactive-btn">Go to Diary</Link>
          <Link href="/notes" className="secondary-btn interactive-btn">Go to Notes</Link>
        </div>
      </div>

      <div className="dashboard-overview">
        {overviewCards.map((card, index) => (
          <Link
            key={card.label}
            href={card.href}
            className={`overview-card overview-card--${card.accent} dashboard-reveal`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <p className="overview-label">{card.label}</p>
            <h2 className="overview-value">{card.value}</h2>
            <p>{card.detail}</p>
            <span className="overview-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="progress-strip dashboard-reveal" style={{ animationDelay: '240ms' }}>
          <div className="progress-strip-copy">
            <p className="overview-label">Task completion</p>
            <p className="progress-strip-value">{taskProgress}% complete</p>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={taskProgress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${taskProgress}%` }} />
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-reveal" style={{ animationDelay: '120ms' }}>
          <div className="dashboard-panel-header">
            <div>
              <h2>Tasks</h2>
              <p className="panel-subtext">Your most recent items and quick access.</p>
            </div>
            <Link href="/tasks" className="secondary-btn panel-link interactive-btn">Open</Link>
          </div>

          {recentTasks.length === 0 ? (
            <Link href="/tasks" className="panel-empty panel-empty--action">
              No tasks yet. Add one on the Tasks page →
            </Link>
          ) : (
            <div className="mini-list">
              {recentTasks.map((task) => (
                <Link key={task.id} href="/tasks" className="mini-list-item mini-list-item--interactive">
                  <span className={`status-dot ${task.completed ? 'completed' : ''}`} />
                  <span className={task.completed ? 'mini-text completed' : 'mini-text'}>{task.title}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-reveal" style={{ animationDelay: '200ms' }}>
          <div className="dashboard-panel-header">
            <div>
              <h2>Diary</h2>
              <p className="panel-subtext">Recent reflections and notes from your journal.</p>
            </div>
            <Link href="/diary" className="secondary-btn panel-link interactive-btn">Open</Link>
          </div>

          {recentEntries.length === 0 ? (
            <Link href="/diary" className="panel-empty panel-empty--action">
              No diary entries yet. Start capturing your day →
            </Link>
          ) : (
            <div className="mini-list">
              {recentEntries.map((entry) => (
                <Link key={entry.id} href="/diary" className="mini-list-item mini-list-item--interactive">
                  <div>
                    <p className="mini-text bold">{entry.title}</p>
                    <p className="mini-caption">{new Date(entry.updatedAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-reveal" style={{ animationDelay: '280ms' }}>
          <div className="dashboard-panel-header">
            <div>
              <h2>Notes</h2>
              <p className="panel-subtext">Quick project ideas and thoughts ready for review.</p>
            </div>
            <Link href="/notes" className="secondary-btn panel-link interactive-btn">Open</Link>
          </div>

          {recentIdeas.length === 0 ? (
            <Link href="/notes" className="panel-empty panel-empty--action">
              No notes yet. Capture ideas and inspiration here →
            </Link>
          ) : (
            <div className="mini-list">
              {recentIdeas.map((idea) => (
                <Link key={idea.id} href="/notes" className="mini-list-item mini-list-item--interactive">
                  <div>
                    <p className="mini-text bold">{idea.title}</p>
                    <p className="mini-caption">{idea.language}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
