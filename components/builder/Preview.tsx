interface Props {
  template: string;
  siteData: {
    name: string;
    tagline: string;
    color: string;
  };
}

export default function Preview({ template, siteData }: Props) {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">Preview</h2>

      <div style={{ color: siteData.color }}>
        <h1 className="text-2xl font-bold">{siteData.name || "Site Name"}</h1>
        <p>{siteData.tagline || "Your tagline goes here"}</p>
        <p className="text-sm mt-2 text-gray-500">
          Template: {template}
        </p>
      </div>
    </div>
  );
}
