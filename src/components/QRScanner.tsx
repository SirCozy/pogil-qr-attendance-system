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

  const isSecureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        console.info("[QRScanner] initializing camera", {
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          isSecureContext,
          hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
          userAgent: navigator.userAgent,
        });

        if (!isSecureContext) {
          const secureContextError =
            "Camera access requires HTTPS or localhost. If you are testing from a local network IP, switch to https/localhost before scanning.";
          console.error("[QRScanner] secure context check failed", { secureContextError });
          setError(secureContextError);
          setLoading(false);
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          const browserError = "This browser does not support camera access for QR scanning.";
          console.error("[QRScanner] getUserMedia unavailable", { browserError });
          setError(browserError);
          setLoading(false);
          return;
        }

        const { Html5Qrcode, Html5QrcodeScanner } = await import("html5-qrcode");

        // Try to select a camera by deviceId (preferred) to avoid overconstrained
        // facingMode errors on some mobile/embedded browsers (especially iOS).
        const cameras = await Html5Qrcode.getCameras().catch((e: unknown) => {
          console.warn("[QRScanner] getCameras failed", { e });
          return [] as Array<{ id: string; label?: string }>;
        });

        console.info("[QRScanner] available cameras", {
          cameraCount: cameras.length,
          cameras,
        });

        const onDecode = (decoded: string) => {
          if (!scannedRef.current) {
            scannedRef.current = true;
            onScan(decoded);
          }
        };

        const onRuntimeError = (errorMessage: string, error?: unknown) => {
          console.warn("[QRScanner] scan runtime warning", { errorMessage, error });
        };

        // Helper to build a wrapper compatible with the previous `scannerRef.current.clear()` usage
        const makeWrapperForHtml5QrCode = (instance: any) => ({
          clear: async () => {
            try {
              if (typeof instance.stop === "function") await instance.stop();
            } catch (_) {}
            try {
              if (typeof instance.clear === "function") instance.clear();
            } catch (_) {}
          },
        });

        // If cameras found, prefer a rear/back/environment labelled camera
        if (cameras && cameras.length > 0) {
          const preferred = cameras.find((c) => /back|rear|environment/i.test(c.label || "")) || cameras[0];
          const html5QrCode: any = new Html5Qrcode("qr-scanner-container");

          try {
            // Try starting directly with deviceId (most robust)
            await html5QrCode.start(
              preferred.id,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                aspectRatio: 1.0,
              },
              onDecode,
              (errMsg: string) => onRuntimeError(errMsg)
            );

            console.info("[QRScanner] camera start succeeded", { preferred });
            scannerRef.current = makeWrapperForHtml5QrCode(html5QrCode);
          } catch (startErr: unknown) {
            // Log exact error shape for production debugging
            console.error("[QRScanner] start with deviceId failed", {
              name: (startErr as any)?.name,
              message: (startErr as any)?.message,
              stack: (startErr as any)?.stack,
              preferred,
            });

            // Retry without deviceId (let browser choose) and avoid strict facingMode constraint
            try {
              // Stop any partial start before retry
              await html5QrCode.stop().catch(() => {});
            } catch {}

            try {
              await html5QrCode.start(
                // Use a looser constraint object (some browsers accept this form)
                { facingMode: { ideal: "environment" } } as any,
                { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true, aspectRatio: 1.0 },
                onDecode,
                (errMsg: string) => onRuntimeError(errMsg)
              );

              scannerRef.current = makeWrapperForHtml5QrCode(html5QrCode);
            } catch (retryErr: unknown) {
              console.error("[QRScanner] retry without deviceId failed", {
                name: (retryErr as any)?.name,
                message: (retryErr as any)?.message,
                stack: (retryErr as any)?.stack,
              });

              // Fallback to the scanner UI which shows camera options
              const scanner = new Html5QrcodeScanner(
                "qr-scanner-container",
                { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true, aspectRatio: 1.0 },
                true
              );
              scanner.render(onDecode, (m: string, e: unknown) => onRuntimeError(m, e));
              scannerRef.current = { clear: async () => scanner.clear() } as any;
            }
          }
        } else {
          // No camera list available — fall back to the scanner UI that lets the library manage cameras
          const scanner = new Html5QrcodeScanner(
            "qr-scanner-container",
            { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true, aspectRatio: 1.0 },
            true
          );
          scanner.render(onDecode, (m: string, e: unknown) => onRuntimeError(m, e));
          scannerRef.current = { clear: async () => scanner.clear() } as any;
        }

        setLoading(false);
        setError(null);
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Failed to initialize camera";

        console.error("[QRScanner] initialization failed", {
          error: err,
          name: (err as any)?.name,
          message: (err as any)?.message,
          stack: (err as any)?.stack,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          isSecureContext,
          hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
          userAgent: navigator.userAgent,
        });

        setError(errorMsg);
        setLoading(false);

        if (
          errorMsg.includes("permission") ||
          errorMsg.includes("Permission denied") ||
          errorMsg.includes("NotAllowedError") ||
          errorMsg.includes("secure context")
        ) {
          setError(
            errorMsg.includes("secure context")
              ? "Camera access requires HTTPS or localhost. If you are testing from a local network IP, switch to https/localhost before scanning."
              : "Camera permission denied. Please allow camera access in your browser settings and try again."
          );
        }
      }
    };

    init().catch((err) => {
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize scanner";
      console.error("[QRScanner] initialization promise rejected", {
        error: err,
        name: (err as any)?.name,
        message: (err as any)?.message,
        stack: (err as any)?.stack,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        isSecureContext,
        hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
        userAgent: navigator.userAgent,
      });
      setError(errorMsg);
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
      {!error && (
        <div className="relative">
          <div id="qr-scanner-container" className="w-full rounded-xl overflow-hidden border-2 border-blue-200 min-h-[320px]" />

          {loading ? (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-600 font-medium">Initializing camera...</p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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
