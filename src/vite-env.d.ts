/// <reference types="vite/client" />

interface Window {
  __hotelInitialData?: {
    scope: 'room' | 'items';
    response: Promise<Response>;
  };
}
