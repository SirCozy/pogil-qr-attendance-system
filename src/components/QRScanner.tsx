"use client";

import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const initialized = useRef(false);
  const scannedRef = useRef(false);
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        const scanner = new Html5QrcodeScanner(
          "qr-scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
          },
          false
        );
        scannerRef.current = scanner;

        scanner.render(
          (decoded: string) => {
            // Prevent duplicate scans
            if (!scannedRef.current) {
              scannedRef.current = true;
              onScan(decoded);
            }
          },
          () => {}
        );

        setLoading(false);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to initialize camera";
        setError(errorMsg);
        setLoading(false);

        if (
          errorMsg.includes("permission") ||
          errorMsg.includes("Permission denied") ||
          errorMsg.includes("NotAllowedError")
        ) {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        }
      }
    };

    init().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to initialize scanner");
      setLoading(false);
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {loading && (
        <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-medium">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="w-full bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-800 font-medium mb-1">Camera Error</p>
          <p className="text-red-700 text-sm">{error}</p>
          <p className="text-red-600 text-xs mt-3">Please check your browser settings and try again</p>
        </div>
      )}

      {/* Scanner Container */}
      {!loading && !error && (
        <div className="relative">
          <div id="qr-scanner-container" className="w-full rounded-xl overflow-hidden border-2 border-blue-200" />
          
          {/* Scanning Helper Overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Corner indicators */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500" />

              {/* Scanning pulse indicator */}
              <div className="animate-pulse">
                <div className="w-16 h-16 border-2 border-blue-500 rounded-lg opacity-70" />
              </div>
            </div>
          </div>

          {/* Helper text */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 font-medium">Position QR code inside the frame</p>
            <p className="text-xs text-gray-500 mt-1">Keep steady and well-lit for best results</p>
          </div>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3 text-gray-700 border-2 border-gray-300 bg-white rounded-xl hover:bg-gray-50 transition-colors font-medium"
      >
        Cancel Scanning
      </button>
    </div>
  );
}
