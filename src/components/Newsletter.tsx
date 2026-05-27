export function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 md:p-16 text-center">
        <div className="absolute inset-0 bg-gradient-brand opacity-10 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-5xl font-bold">Stay Ahead of the Curve.</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Early access to drops, exclusive offers, and stories from the edge of tech.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="you@future.com"
              className="flex-1 rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button className="rounded-xl bg-gradient-brand px-6 py-3 font-medium text-white glow-brand transition-transform hover:scale-[1.03]">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
