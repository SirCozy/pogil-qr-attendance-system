"use client";

import QRCode from "react-qr-code";

interface QRDisplayProps {
  value: string;
  size?: number;
}

export default function QRDisplay({ value, size = 200 }: QRDisplayProps) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl inline-block">
      <QRCode value={value} size={size} />
    </div>
  );
}
