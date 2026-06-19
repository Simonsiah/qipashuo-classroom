import { QRCodeSVG } from "qrcode.react";

interface JoinQRProps {
  code: string;
  joinUrl: string;
}

export function JoinQR({ code, joinUrl }: JoinQRProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/95 p-4">
      <QRCodeSVG value={joinUrl} size={120} />
      <span className="text-3xl font-black tabular-nums tracking-widest text-black">
        {code}
      </span>
      <span className="text-sm font-medium text-black/70">扫码投票</span>
    </div>
  );
}
