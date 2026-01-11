
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  
  // Get all unique keys from the objects
  const headers = Array.from(new Set(data.flatMap(Object.keys)));
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const val = row[fieldName];
      // Handle strings that might contain commas
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val ?? '';
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result;
      if (typeof text !== 'string') {
        resolve([]);
        return;
      }

      // Remove Byte Order Mark (BOM) if present (common in Excel CSVs)
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      // Handle different line endings
      const lines = text.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line);
      if (lines.length < 2) {
        resolve([]);
        return;
      }

      // Clean headers: remove quotes and trim
      const headers = lines[0].split(',').map(h => {
        let header = h.trim();
        if (header.startsWith('"') && header.endsWith('"')) {
          header = header.substring(1, header.length - 1);
        }
        return header;
      });

      const results = [];

      for (let i = 1; i < lines.length; i++) {
        // Naive split by comma. 
        // Note: This does not handle commas inside quoted values correctly.
        // For a robust system, a regex or parser state machine is needed, 
        // but for simple student lists, this usually suffices.
        const values = lines[i].split(',').map(v => v.trim());
        const obj: any = {};
        
        headers.forEach((header, index) => {
          let value = values[index];
          if (value && value.startsWith('"') && value.endsWith('"')) {
             value = value.substring(1, value.length - 1);
          }
          obj[header] = value;
        });
        results.push(obj);
      }
      resolve(results);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
