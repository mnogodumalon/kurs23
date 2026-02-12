// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Kategorien, Kurse } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- KATEGORIEN ---
  static async getKategorien(): Promise<Kategorien[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KATEGORIEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKategorienEntry(id: string): Promise<Kategorien | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KATEGORIEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createKategorienEntry(fields: Kategorien['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KATEGORIEN}/records`, { fields });
  }
  static async updateKategorienEntry(id: string, fields: Partial<Kategorien['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KATEGORIEN}/records/${id}`, { fields });
  }
  static async deleteKategorienEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KATEGORIEN}/records/${id}`);
  }

  // --- KURSE ---
  static async getKurse(): Promise<Kurse[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KURSE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKurseEntry(id: string): Promise<Kurse | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KURSE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createKurseEntry(fields: Kurse['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KURSE}/records`, { fields });
  }
  static async updateKurseEntry(id: string, fields: Partial<Kurse['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KURSE}/records/${id}`, { fields });
  }
  static async deleteKurseEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KURSE}/records/${id}`);
  }

}