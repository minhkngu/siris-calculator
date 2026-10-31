import { useState, useEffect, useRef, createElement as rce } from 'react';
import { TRANSLATIONS } from './constants';
import { Accommodation, Room } from './types';
import { Flyer } from './components/Flyer';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Loader2, RefreshCw, ChevronDown, Check, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchAccommodations, hydrateRoomImages } from './services/flyerService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MenuOption = { id: string; label: string; detail?: string };

function FlyerMenu({ label, value, options, onSelect }: { label: string; value: string; options: MenuOption[]; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = options.find(option => option.id === value);
  return <div className="relative" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); (event.currentTarget.querySelector('button') as HTMLButtonElement)?.focus(); } }}>
    <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
    <button type="button" aria-label={label} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)} className={cn('w-full min-h-12 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-3 flex items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700', open && 'border-brand-700 ring-1 ring-brand-700')}>
      <span className="min-w-0 text-sm font-semibold text-slate-900">{current?.label}</span><ChevronDown size={16} className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
    </button>
    {open && <><div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" /><div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl max-h-72 overflow-y-auto" role="group" aria-label={label}>
      {options.map(option => <button key={option.id} type="button" onClick={() => { onSelect(option.id); setOpen(false); }} className={cn('w-full flex items-center justify-between gap-3 rounded-lg p-2.5 text-left hover:bg-slate-50', option.id === value && 'bg-slate-100')}>
        <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{option.label}</span>{option.detail && <span className="block text-xs text-slate-500 mt-0.5">{option.detail}</span>}</span>{option.id === value && <Check size={16} className="shrink-0 text-slate-700" />}
      </button>)}
    </div></>}
  </div>;
}

function readFlyerView(): { branchId?: string; roomId?: string; scale?: number; variant?: 'full' | 'monthly' } {
  try { return JSON.parse(sessionStorage.getItem('siris-flyer-view') || '{}'); } catch { return {}; }
}

export default function App() {
  const [savedView] = useState(readFlyerView);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAcc, setSelectedAcc] = useState<Accommodation | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(savedView.scale && savedView.scale >= 0.2 && savedView.scale <= 1 ? savedView.scale : 0.75);
  const [flyerVariant, setFlyerVariant] = useState<'full' | 'monthly'>(savedView.variant === 'monthly' ? 'monthly' : 'full');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingScrollRestore = useRef<number | null>(null);
  const t = TRANSLATIONS['vi'];

  useEffect(() => {
    const scrollKey = 'flyer-scroll-position';
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    if (pendingScrollRestore.current === null) {
      const savedPosition = window.sessionStorage.getItem(scrollKey);
      if (savedPosition !== null) {
        const parsedPosition = Number(savedPosition);
        pendingScrollRestore.current = Number.isFinite(parsedPosition) ? parsedPosition : 0;
        window.sessionStorage.removeItem(scrollKey);
      }
    }

    const saveScrollPosition = () => {
      window.sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
    window.addEventListener('pagehide', saveScrollPosition);

    loadData();

    return () => {
      window.removeEventListener('pagehide', saveScrollPosition);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    if (isLoading || pendingScrollRestore.current === null) return;

    const savedPosition = pendingScrollRestore.current;
    pendingScrollRestore.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, savedPosition));
    });
  }, [isLoading]);

  useEffect(() => {
    if (!selectedAcc || !selectedRoom) return;
    try { sessionStorage.setItem('siris-flyer-view', JSON.stringify({ branchId: selectedAcc.id, roomId: selectedRoom.id, scale: previewScale, variant: flyerVariant })); } catch { /* Storage may be unavailable. */ }
  }, [selectedAcc, selectedRoom, previewScale, flyerVariant]);

  const loadData = async (refresh = false) => {
    setIsLoading(true);
    setImagesReady(false);
    setError(null);
    try {
      const data = await fetchAccommodations(refresh);

      const sortedData = data.map(acc => ({
        ...acc,
        rooms: [...acc.rooms].sort((a, b) => {
          const priceA = parseInt(a.priceSunThu.replace(/[^0-9]/g, '')) || 0;
          const priceB = parseInt(b.priceSunThu.replace(/[^0-9]/g, '')) || 0;
          return priceA - priceB;
        })
      }));

      setAccommodations(sortedData);
      const nextAcc = sortedData.find(acc => acc.id === (selectedAcc?.id || savedView.branchId)) || sortedData[0] || null;
      setSelectedAcc(nextAcc);
      setSelectedRoom(nextAcc?.rooms.find(room => room.id === (selectedRoom?.id || savedView.roomId)) || nextAcc?.rooms[0] || null);

      // Show controls immediately; image manifests resolve independently of the data request.
      void hydrateRoomImages(sortedData).then(hydrated => {
        setImagesReady(true);
        setAccommodations(hydrated);
        setSelectedAcc(current => hydrated.find(acc => acc.id === current?.id) || current);
        setSelectedRoom(current => hydrated.flatMap(acc => acc.rooms).find(room => room.id === current?.id) || current);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Không thể tải ảnh Cloudinary.');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu từ Supabase.');
      // Keep the current flyer mounted when a manual refresh fails.
      // This preserves both the user's place on the page and the last usable data.
      if (accommodations.length === 0) {
        setSelectedAcc(null);
        setSelectedRoom(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const captureFlyerToPng = async (
    acc: Accommodation,
    room: Room,
    variant: 'full' | 'monthly' = flyerVariant,
  ): Promise<string | null> => {
    return new Promise(async (resolve) => {
      // 1. Fetch images as Blob -> DataURL (Base64) in parallel to bypass CORS/Network bottleneck during capture
      const base64ImagesMap = new Map<string, string>();
      await Promise.all(
        room.imageUrls.map(async (url) => {
          try {
            const resp = await fetch(url, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              const base64 = await new Promise<string>((res) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result as string);
                reader.readAsDataURL(blob);
              });
              base64ImagesMap.set(url, base64);
            }
          } catch (e) {
            console.warn('Failed to pre-fetch image to base64:', url, e);
          }
        })
      );

      // Create a modified room object with inline Base64 images
      const roomWithBase64Images: Room = {
        ...room,
        imageUrls: room.imageUrls.map(url => base64ImagesMap.get(url) || url)
      };

      // Create a fully visible off-screen container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '900px';
      container.style.zIndex = '99999';
      container.style.background = 'white';
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);

      const mountPoint = document.createElement('div');
      mountPoint.id = `flyer-capture-${room.id}`;
      container.appendChild(mountPoint);

      // Render using ReactDOM
      let root: import('react-dom/client').Root | undefined;
      try {
        const { createRoot } = await import('react-dom/client');
        root = createRoot(mountPoint);

        root.render(rce(Flyer, {
          id: `flyer-capture-${room.id}`,
          accommodation: acc,
          room: roomWithBase64Images,
          variant,
        }));

        // Short wait for React render commit
        await new Promise(r => setTimeout(r, 150));

        // Wait for all images inside the container to load (Base64 loads almost instantly)
        const imgs = container.querySelectorAll('img');
        if (imgs.length > 0) {
          await Promise.all(Array.from(imgs).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((res) => {
              img.onload = () => res();
              img.onerror = () => res();
              setTimeout(res, 2000);
            });
          }));
        }

        const dataUrl = await toPng(mountPoint, {
          quality: 0.95,
          pixelRatio: 3,
          skipFonts: true,
        });

        resolve(dataUrl);
      } catch (err) {
        console.error('Capture error:', err);
        resolve(null);
      } finally {
        // Cleanup DOM
        root?.unmount();
        document.body.removeChild(container);
      }
    });
  };

  const handleDownload = async (room: Room) => {
    if (!selectedAcc) return;
    setIsDownloading(true);
    try {
      const dataUrl = await captureFlyerToPng(selectedAcc, room);
      if (dataUrl) {
        const link = document.createElement('a');
        const variantSuffix = flyerVariant === 'monthly' ? '-gia-thang' : '';
        link.download = `flyer-${selectedAcc.name}-${room.name}${variantSuffix}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const dataURLToBlob = (dataURL: string) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleDownloadAcc = async (acc: Accommodation) => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();

      for (const room of acc.rooms) {
        const dataUrl = await captureFlyerToPng(acc, room);
        if (dataUrl) {
          const blob = dataURLToBlob(dataUrl);
          const variantSuffix = flyerVariant === 'monthly' ? '-gia-thang' : '';
          zip.folder(acc.name)?.file(`${room.name}${variantSuffix}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const variantSuffix = flyerVariant === 'monthly' ? '_gia-thang' : '';
      saveAs(content, `${acc.name}_flyers${variantSuffix}.zip`);
    } catch (err) {
      console.error('Download acc failed', err);
      setError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="text-slate-900">
      <main className="mx-auto py-2">
        {isLoading && accommodations.length === 0 ? null : !selectedAcc || !selectedRoom ? (
          <div className="mx-auto max-w-lg rounded-lg border border-neutral-200 bg-white p-8 text-center">
            <p role={error ? 'alert' : 'status'} className="text-sm text-neutral-600">{error || 'Chưa có cơ sở hoặc phòng được hiển thị trong Supabase.'}</p>
            <button onClick={() => void loadData(true)} className="mt-5 rounded-xl bg-slate-600 px-5 py-3 font-bold text-white">Tải lại dữ liệu</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Sidebar - Selection */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-900">
                <div className="space-y-4">
                  <FlyerMenu label={t.selectAccommodation} value={selectedAcc.id} options={accommodations.map(acc => ({ id: acc.id, label: acc.name, detail: acc.address }))} onSelect={id => {
                    const acc = accommodations.find(item => item.id === id);
                    if (acc) { setSelectedAcc(acc); setSelectedRoom(acc.rooms[0] || null); }
                  }} />
                  <FlyerMenu label={t.selectRoom} value={selectedRoom.id} options={selectedAcc.rooms.map(room => ({ id: room.id, label: room.name, detail: `CN–T5: ${room.priceSunThu} · T6–T7: ${room.priceFriSat}` }))} onSelect={id => {
                    const room = selectedAcc.rooms.find(item => item.id === id);
                    if (room) setSelectedRoom(room);
                  }} />

                  <div>
                    <p className="text-[10px] font-semibold  text-slate-500 mb-2">Phiên bản flyer</p>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setFlyerVariant('full')}
                        className={cn(
                          'rounded-lg px-3 py-2 text-xs font-bold transition-all',
                          flyerVariant === 'full'
                            ? 'bg-white text-slate-700 shadow-sm'
                            : 'text-slate-600 hover:bg-white',
                        )}
                      >
                        Đầy đủ
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlyerVariant('monthly')}
                        className={cn(
                          'rounded-lg px-3 py-2 text-xs font-bold transition-all',
                          flyerVariant === 'monthly'
                            ? 'bg-white text-slate-700 shadow-sm'
                            : 'text-slate-600 hover:bg-white',
                        )}
                      >
                        Chỉ giá tháng
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-500/50">
                    <p className="text-[10px] font-semibold  text-slate-500 mb-2">Tải theo toà nhà</p>
                    <div className="space-y-2">
                      {accommodations.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => handleDownloadAcc(acc)}
                          disabled={isDownloading || !imagesReady}
                          className="w-full text-left text-xs text-slate-700 hover:text-slate-900 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg"
                        >
                          {acc.name}
                          <Download className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-xs text-red-600 font-medium">{error}</span>
                </div>
              )}

              <button
                onClick={() => void loadData(true)}
                disabled={isLoading}
                className="w-full py-3 px-4 border border-neutral-200 rounded-lg text-sm font-bold text-neutral-600 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Tải lại dữ liệu
              </button>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-8">
              <div className="sticky top-28">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-4 flex w-full flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handleDownload(selectedRoom)}
                      disabled={isDownloading || !imagesReady}
                      className="box-border w-56 h-11 shrink-0 bg-brand-700 text-white px-3 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      {t.downloadSingle}
                    </button>
                    <div role="group" aria-label="Thu phóng ảnh xem trước" className="flex h-11 shrink-0 items-center rounded-lg bg-white p-1 ring-1 ring-inset ring-slate-200">
                      <button type="button" aria-label="Thu nhỏ" disabled={previewScale <= 0.2} onClick={() => setPreviewScale(value => Math.max(0.2, Math.round((value - 0.05) * 100) / 100))} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-30"><Minus size={16} /></button>
                      <button type="button" title="Về mức mặc định 75%" aria-label="Đặt lại thu phóng về 75%" onClick={() => setPreviewScale(0.75)} className="h-9 w-16 rounded-md text-sm font-semibold tabular-nums text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-900">{Math.round(previewScale * 100)}%</button>
                      <button type="button" aria-label="Phóng to" disabled={previewScale >= 1} onClick={() => setPreviewScale(value => Math.min(1, Math.round((value + 0.05) * 100) / 100))} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-900 disabled:opacity-30"><Plus size={16} /></button>
                    </div>
                  </div>

                  {/* Preview - only render the selected flyer */}
                  <div className="relative group">
                    <div style={{ transform: `scale(${previewScale})` }} className="origin-top transform transition-transform duration-100">
                      <Flyer
                        id={`flyer-preview-${selectedRoom.id}`}
                        accommodation={selectedAcc}
                        room={selectedRoom}
                        variant={flyerVariant}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </main>


    </div>
  );
}
