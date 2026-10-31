import type { Accommodation } from '../types';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const manifests = new Map<string, Promise<string[]>>();

async function cloudinaryImages(tag?: string): Promise<string[]> {
  if (!tag || !cloudName) return [];
  if (!manifests.has(tag)) {
    manifests.set(tag, (async () => {
      try {
        const response = await fetch(`https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/list/${encodeURIComponent(tag)}.json`, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Cloudinary manifest unavailable');
        const data = await response.json();
        return (data.resources || []).sort((a: { public_id: string }, b: { public_id: string }) => a.public_id.localeCompare(b.public_id)).map((item: { public_id: string; version: number; format: string }) =>
          `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/f_auto,q_auto,w_1600/v${item.version}/${item.public_id}.${item.format}`);
      } catch {
        manifests.delete(tag);
        return [];
      }
    })());
  }
  return manifests.get(tag)!;
}

async function loadAccommodations(): Promise<Accommodation[]> {
  const response = await fetch('/api/flyer-data', { cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Không thể kết nối với API Supabase.');
  if (!Array.isArray(data?.accommodations)) throw new Error('API Supabase trả dữ liệu không hợp lệ.');
  return data.accommodations;
}

export async function hydrateRoomImages(accommodations: Accommodation[]): Promise<Accommodation[]> {
  return Promise.all(accommodations.map(async acc => ({
    ...acc,
    rooms: await Promise.all(acc.rooms.map(async room => ({ ...room, imageUrls: await cloudinaryImages(room.cloudinaryTag) }))),
  })));
}

let accommodationsRequest: Promise<Accommodation[]> | undefined;

export function fetchAccommodations(refresh = false): Promise<Accommodation[]> {
  if (refresh || !accommodationsRequest) {
    const request = loadAccommodations();
    accommodationsRequest = request;
    void request.catch(() => {
      if (accommodationsRequest === request) accommodationsRequest = undefined;
    });
  }
  return accommodationsRequest;
}
