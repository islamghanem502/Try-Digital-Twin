import { Heart, Brain, Wind, Eye, Bone, Droplets } from "lucide-react";

interface OrganNavBarProps {
  selectedOrgan: string | null;
  onSelectOrgan: (organ: string | null) => void;
}

const organs = [
  { id: "full", label: "Full Body", icon: Bone },
  { id: "brain", label: "Brain", icon: Brain },
  { id: "heart", label: "Heart", icon: Heart },
  { id: "kidneys", label: "Kidney", icon: Droplets },
  { id: "lung", label: "Lungs", icon: Wind },
  { id: "liver", label: "Liver", icon: Eye },
];

const OrganNavBar = ({ selectedOrgan, onSelectOrgan }: OrganNavBarProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => {
          const prev = organs.findIndex((o) => o.id === selectedOrgan);
          const idx = prev <= 0 ? organs.length - 1 : prev - 1;
          onSelectOrgan(organs[idx].id === "full" ? null : organs[idx].id);
        }}
      >
        ‹
      </button>
      <div className="flex items-center gap-2 overflow-x-auto flex-1 justify-center no-scrollbar">
        {organs.map((organ) => {
          const isActive =
            organ.id === "full"
              ? selectedOrgan === null
              : selectedOrgan === organ.id;
          const Icon = organ.icon;
          return (
            <button
              key={organ.id}
              onClick={() =>
                onSelectOrgan(organ.id === "full" ? null : organ.id)
              }
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "organ-btn-active"
                  : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {organ.label}
            </button>
          );
        })}
      </div>
      <button
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => {
          const prev = organs.findIndex((o) => o.id === selectedOrgan);
          const idx = prev >= organs.length - 1 ? 0 : prev + 1;
          onSelectOrgan(organs[idx].id === "full" ? null : organs[idx].id);
        }}
      >
        ›
      </button>
    </div>
  );
};

export default OrganNavBar;
