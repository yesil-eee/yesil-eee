import { ProcessRecord } from "@shared/schema";

export function recordsToCSV(records: ProcessRecord[]): string {
  if (records.length === 0) return '';
  
  const headers = 'Tarih;Ad Soyad;Ürün Kodu;İşlem Türü;İşlem Ölçüsü;Adet;Açıklama';
  const rows = records.map(record => 
    `${record.date};${record.name};${record.productCode};${record.operationType};${record.operationMeasure};${record.quantity};${record.description || ''}`
  );
  
  return [headers, ...rows].join('\n');
}

export function csvToRecords(csvContent: string): ProcessRecord[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  return dataLines.map((line, index) => {
    const columns = line.split(';');
    return {
      id: `imported-${Date.now()}-${index}`,
      date: columns[0] || '',
      name: columns[1] || '',
      productCode: columns[2] || '',
      operationType: columns[3] || '',
      operationMeasure: columns[4] || '',
      quantity: parseInt(columns[5]) || 0,
      description: columns[6] || '',
      createdAt: new Date().toISOString()
    };
  });
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[monthNumber - 1] || '';
}

export function generateCSVFileName(name: string, date: string): string {
  const dateObj = new Date(date);
  const month = getMonthName(dateObj.getMonth() + 1);
  const year = dateObj.getFullYear();
  return `${name} - ${month} ${year}.csv`;
}
