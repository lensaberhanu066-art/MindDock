import Link from 'next/link';

const cards = [
  {
    title: 'Task List',
    description: 'Plan the day, capture priorities, and check off progress.',
    href: '/tasks'
  },
  {
    title: 'Diary',
    description: 'Write reflections, moods, and milestone moments in one place.',
    href: '/diary'
  },
  {
    title: 'Notes',
    description: 'Keep ideas, quick reminders, and inspiration close at hand.',
    href: '/notes'
  }
];

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Calm planning for your daily life</p>
        <h1>MindDock brings your tasks, thoughts, and memories together.</h1>
        <p className="subtext">
          This starter experience is designed to feel simple, focused, and mobile-friendly as you grow it into a full app.
        </p>
        <div className="hero-actions">
          <Link href="/tasks" className="primary-btn">Start with Tasks</Link>
          <Link href="/notes" className="secondary-btn">Open Notes</Link>
        </div>
      </div>

      <div className="card-grid">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="feature-card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
