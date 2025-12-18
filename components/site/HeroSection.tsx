export default function HeroSection({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="py-16 bg-white text-center">
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </section>
  );
}
