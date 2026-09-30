import { AutomatonDefinition } from '../types/automata';

// Export Automaton as JSON file
export function exportAutomatonAsJSON(machine: AutomatonDefinition): void {
  const json = JSON.stringify(machine, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${machine.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-automaton.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export SVG Element as SVG file
export function exportSVG(svgElement: SVGSVGElement, filename = 'automaton.svg'): void {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Add namespaces if missing
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export SVG Element as PNG image
export function exportPNG(svgElement: SVGSVGElement, filename = 'automaton.png'): void {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svgElement.clientWidth || 800;
    canvas.height = svgElement.clientHeight || 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#090d16'; // sleek dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(blob => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(pngUrl);
        }
      });
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// Validate imported JSON object as a valid AutomatonDefinition
export function validateImportedAutomaton(data: any): { valid: boolean; machine?: AutomatonDefinition; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File does not contain valid JSON.' };
  }

  if (!Array.isArray(data.states) || !Array.isArray(data.transitions)) {
    return { valid: false, error: 'JSON missing "states" or "transitions" array.' };
  }

  // Sanitize
  const machine: AutomatonDefinition = {
    id: data.id || `imported-${Date.now()}`,
    name: data.name || 'Imported Automaton',
    type: data.type || 'DFA',
    alphabet: Array.isArray(data.alphabet) ? data.alphabet : ['0', '1'],
    states: data.states.map((s: any, idx: number) => ({
      id: s.id || `q${idx}`,
      label: s.label || s.id || `q${idx}`,
      x: typeof s.x === 'number' ? s.x : 200 + idx * 80,
      y: typeof s.y === 'number' ? s.y : 200,
      isStart: Boolean(s.isStart),
      isFinal: Boolean(s.isFinal),
      output: s.output,
      description: s.description,
    })),
    transitions: data.transitions.map((t: any, idx: number) => ({
      id: t.id || `e-${idx}`,
      from: t.from,
      to: t.to,
      symbols: Array.isArray(t.symbols) ? t.symbols : [String(t.symbol || '0')],
      output: t.output,
    })),
    startStateId: data.startStateId || (data.states[0] ? data.states[0].id : ''),
    finalStateIds: Array.isArray(data.finalStateIds) ? data.finalStateIds : [],
    description: data.description,
  };

  return { valid: true, machine };
}
