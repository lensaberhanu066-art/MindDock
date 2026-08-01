export default function TasksPage() {
  return (
    <section className="page">
      <h1>Task List</h1>
      <p>Track your priorities and build momentum with a simple daily checklist.</p>
      <div className="list">
        <article className="item-card">
          <h2>✓ Plan the day</h2>
          <p>Choose your top 3 priorities before the day starts.</p>
        </article>
        <article className="item-card">
          <h2>✓ Review progress</h2>
          <p>Check off finished tasks and note what needs attention.</p>
        </article>
      </div>
    </section>
  );
}
