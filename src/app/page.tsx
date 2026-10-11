export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col justify-center gap-6 px-6 py-24 sm:px-12">
      <p className="text-sm uppercase tracking-widest text-foreground/60">
        Support &amp; Care
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        SBOM Reporting
      </h1>
      <p className="max-w-2xl text-lg leading-8 text-foreground/70">
        Reporting frontend for software bill of materials data managed in
        Dependency-Track.
      </p>
    </main>
  );
}
