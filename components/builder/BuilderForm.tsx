interface Props {
  siteData: {
    name: string;
    tagline: string;
    color: string;
  };
  setSiteData: (data: any) => void;
}

export default function BuilderForm({ siteData, setSiteData }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Site Details</h2>

      <input
        placeholder="Site Name"
        value={siteData.name}
        onChange={(e) =>
          setSiteData({ ...siteData, name: e.target.value })
        }
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="Tagline"
        value={siteData.tagline}
        onChange={(e) =>
          setSiteData({ ...siteData, tagline: e.target.value })
        }
        className="w-full border p-2 rounded"
      />

      <input
        type="color"
        value={siteData.color}
        onChange={(e) =>
          setSiteData({ ...siteData, color: e.target.value })
        }
      />
    </div>
  );
}
