export default function NotesPage() {
  return (
    <section className="page">
      <h1>Notes</h1>
      <p>Keep ideas, reminders, and inspirations ready whenever you need them.</p>
      <div className="list">
        <article className="item-card">
          <h2>Product idea</h2>
          <p>Add a calm dark mode and mobile-friendly widgets later.</p>
        </article>
        <article className="item-card">
          <h2>Next step</h2>
          <p>Connect a backend and sync data across web and mobile.</p>
        </article>
      </div>
    </section>
  );
}
