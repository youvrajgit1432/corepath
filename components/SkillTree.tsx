import { SkillNode } from "../data/roadmaps";

interface Props {
  nodes: SkillNode[];
}

function computeLayers(nodes: SkillNode[]): SkillNode[][] {
  const depthMap: Record<string, number> = {};

  for (const node of nodes) {
    if (!node.dependsOn || node.dependsOn.length === 0) {
      depthMap[node.id] = 0;
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (depthMap[node.id] !== undefined) continue;
      if (!node.dependsOn) continue;
      const parentDepths = node.dependsOn.map((pid) => depthMap[pid]);
      if (parentDepths.every((d) => d !== undefined)) {
        depthMap[node.id] = Math.max(...(parentDepths as number[])) + 1;
        changed = true;
      }
    }
  }

  const maxDepth = Math.max(...Object.values(depthMap));
  const layers: SkillNode[][] = Array.from({ length: maxDepth + 1 }, () => []);

  for (const node of nodes) {
    const d = depthMap[node.id] ?? 0;
    layers[d].push(node);
  }

  return layers;
}

const nodeStyles: Record<SkillNode["type"], string> = {
  core: "border-core-accent text-core-accent bg-core-accent/10",
  supporting: "border-core-border text-core-text bg-core-surface",
  optional: "border-core-border/50 text-core-muted bg-core-bg",
};

const typeLabel: Record<SkillNode["type"], string> = {
  core: "Core",
  supporting: "Supporting",
  optional: "Optional",
};

export default function SkillTree({ nodes }: Props) {
  const layers = computeLayers(nodes);

  return (
    <div>
      <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
        Skill Tree
      </p>

      <div className="flex flex-wrap gap-4 mb-6 text-xs font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-core-accent bg-core-accent/10" />
          <span className="text-core-muted">Core skill</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-core-border bg-core-surface" />
          <span className="text-core-muted">Supporting</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-core-border/50 bg-core-bg" />
          <span className="text-core-muted">Optional</span>
        </span>
      </div>

      <div className="space-y-3">
        {layers.map((layer, layerIndex) => (
          <div key={layerIndex}>
            <p className="text-xs font-mono text-core-muted/60 mb-2 ml-1">
              Layer {layerIndex + 1}
              {layerIndex === 0 ? " — Start here" : ""}
            </p>

            <div className="flex flex-wrap gap-2">
              {layer.map((node) => (
                <div
                  key={node.id}
                  className={`inline-flex flex-col items-start px-3 py-2 rounded-lg border text-xs font-mono transition-all duration-150 hover:scale-105 ${
                    nodeStyles[node.type]
                  }`}
                >
                  <span className="font-medium">{node.label}</span>
                  <span className="opacity-50 text-[10px] mt-0.5">{typeLabel[node.type]}</span>
                </div>
              ))}
            </div>

            {layerIndex < layers.length - 1 && (
              <div className="ml-3 mt-2 text-core-border text-sm" aria-hidden="true">
                ↓
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-core-muted font-mono">
        Read top to bottom — each layer builds on the previous.
      </p>
    </div>
  );
}
