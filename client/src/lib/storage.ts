import { ProcessRecord, AdminSettings, CSVFile } from "@shared/schema";

const STORAGE_KEYS = {
  RECORDS: 'processRecords',
  ADMIN_SETTINGS: 'adminSettings',
  CSV_FILES: 'csvFiles',
  RECENT_NAMES: 'recentNames',
  IS_ADMIN_LOGGED_IN: 'isAdminLoggedIn'
};

export class LocalStorage {
  static getRecords(): ProcessRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  }

  static saveRecord(record: ProcessRecord): void {
    const records = this.getRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  static deleteRecord(id: string): void {
    const records = this.getRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  static getAdminSettings(): AdminSettings {
    const data = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
    return data ? JSON.parse(data) : {
      password: '12345',
      companyName: 'Eko Tek',
      productCodes: ['ZAR001', 'ETK002', 'TAM003'],
      operationTypes: ['Saçak', 'Etiket', 'Tamir', 'Nostalji'],
      operationMeasures: ['90cm', '120cm', '160cm', 'Q120']
    };
  }

  static saveAdminSettings(settings: AdminSettings): void {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(settings));
  }

  static getCSVFiles(): CSVFile[] {
    const data = localStorage.getItem(STORAGE_KEYS.CSV_FILES);
    return data ? JSON.parse(data) : [];
  }

  static saveCSVFile(csvFile: CSVFile): void {
    const files = this.getCSVFiles();
    const existingIndex = files.findIndex(f => f.id === csvFile.id);
    if (existingIndex >= 0) {
      files[existingIndex] = csvFile;
    } else {
      files.push(csvFile);
    }
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(files));
  }

  static deleteCSVFile(id: string): void {
    const files = this.getCSVFiles().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify(files));
  }

  static deleteAllCSVFiles(): void {
    localStorage.setItem(STORAGE_KEYS.CSV_FILES, JSON.stringify([]));
  }

  static getRecentNames(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_NAMES);
    return data ? JSON.parse(data) : [];
  }

  static addRecentName(name: string): void {
    const names = this.getRecentNames();
    const filtered = names.filter(n => n !== name);
    filtered.unshift(name);
    if (filtered.length > 10) filtered.pop();
    localStorage.setItem(STORAGE_KEYS.RECENT_NAMES, JSON.stringify(filtered));
  }

  static getAdminLoginStatus(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN_LOGGED_IN) === 'true';
  }

  static setAdminLoginStatus(status: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN_LOGGED_IN, status.toString());
  }

  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
