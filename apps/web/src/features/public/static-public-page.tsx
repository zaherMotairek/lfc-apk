export function StaticPublicPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-4 text-4xl font-bold">{title}</h1>
      <p className="text-lg text-black/70">{description}</p>
    </section>
  );
}
