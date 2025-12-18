interface Props {
  template: {
    id: string;
    name: string;
    description: string;
  };
  selected: boolean;
  onSelect: () => void;
}

export default function TemplateCard({ template, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-4 cursor-pointer transition
        ${selected ? "border-black bg-gray-100" : "border-gray-300"}
      `}
    >
      <h3 className="font-semibold">{template.name}</h3>
      <p className="text-sm text-gray-600">{template.description}</p>
    </div>
  );
}
