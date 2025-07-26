import { StartupFirm } from '../../types/agents';

export async function parseStartupFirmsFile(file: File): Promise<StartupFirm[]> {
  const text = await file.text();
  
  try {
    // Try parsing as JSON first
    const jsonData = JSON.parse(text);
    if (Array.isArray(jsonData)) {
      return jsonData.map(item => ({
        name: item.name || item.company || '',
        description: item.description || item.desc || '',
        products: item.products || item.services || [],
        website: item.website || item.url || item.site || ''
      }));
    }
    return [jsonData];
  } catch {
    // If not JSON, try parsing as CSV
    return parseCSV(text);
  }
}

function parseCSV(text: string): StartupFirm[] {
  // Detect delimiter (comma vs tab)
  const delimiter = text.includes('\t') && !text.includes(',') ? '\t' : ',';
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  const firms: StartupFirm[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim());
    const firm: StartupFirm = { name: '', description: '', products: [], website: '' };
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      if (header.includes('name') || header.includes('company')) {
        firm.name = value;
      } else if (header.includes('description') || header.includes('desc')) {
        firm.description = value;
      } else if (header.includes('product') || header.includes('service')) {
        firm.products = value ? value.split(';').map(p => p.trim()) : [];
      } else if (header.includes('website') || header.includes('url') || header.includes('site')) {
        firm.website = value;
      }
    });
    
    if (firm.name) {
      firms.push(firm);
    }
  }
  
  return firms;
}

export function formatStartupFirmsForPrompt(firms: StartupFirm[]): string {
  return firms.map(firm => {
    let output = `**${firm.name}**`;
    if (firm.description) output += `\nDescription: ${firm.description}`;
    if (firm.products && firm.products.length > 0) {
      output += `\nProducts/Services: ${firm.products.join(', ')}`;
    }
    if (firm.website) output += `\nWebsite: ${firm.website}`;
    return output;
  }).join('\n\n---\n\n');
} 