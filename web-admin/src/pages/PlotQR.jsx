import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Sprout } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApi } from '../hooks/useApi';
import { plotsAPI } from '../services/api';
import { Card, LoadingSpinner, ErrorAlert, SectionHeader } from '../components/Shared';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export default function PlotQR() {
  const { id: plotId } = useParams();
  const navigate = useNavigate();
  const { data: plot, loading, error, execute } = useApi(() => plotsAPI.get(plotId));
  const printRef = useRef();

  const qrUrl = `${window.location.origin}/scan/plot/${plotId}`;

  useEffect(() => {
    execute();
  }, [plotId]);

  const handlePrint = () => {
    const plotName = escapeHtml(plot?.name || `แปลง #${plotId}`);
    const plantType = escapeHtml(plot?.plant_type || '');
    const WinPrint = window.open('', '', 'width=400,height=520');
    if (!WinPrint) return;
    WinPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${plotName}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 24px; background: #fff; }
            h2 { margin-bottom: 4px; font-size: 20px; color: #111; }
            p { color: #666; margin-top: 4px; font-size: 14px; }
            .hint { font-size: 12px; color: #bbb; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div id="plot-qr-svg" style="display:flex;justify-content:center;margin-bottom:16px;">
            ${printRef.current.innerHTML}
          </div>
          <h2>${plotName}</h2>
          ${plantType ? `<p>🌱 ${plantType}</p>` : '<p style="color:#ccc;">—</p>'}
          <p class="hint">สแกนเพื่อดูข้อมูลแปลง</p>
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  const handleDownload = () => {
    const svg = document.getElementById('plot-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 300, 300);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const safeName = (plot?.name || `plot-${plotId}`).replace(/[^a-z0-9_-]/gi, '_');
      downloadLink.download = `qr-plot-${safeName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
      const safeSvg = unescape(encodeURIComponent(svgData));
      img.src = 'data:image/svg+xml;charset=utf-8,' + safeSvg;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  const plotName = plot?.name || `แปลง #${plotId}`;

  return (
    <div className="max-w-md mx-auto">
      {/* Back nav */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="กลับ"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">QR Code แปลง</h1>
          <p className="text-sm text-gray-500">{plotName}</p>
        </div>
      </div>

      {/* QR Card */}
      <Card padding="lg" className="text-center">
        <div ref={printRef}>
          <div
            id="plot-qr-svg"
            className="flex justify-center mb-6 p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200"
          >
            <QRCodeSVG value={qrUrl} size={200} level="H" />
          </div>
        </div>

        {/* Plot info */}
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-bold text-gray-900">{plotName}</h2>
          {plot?.plant_type ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <Sprout size={14} aria-hidden="true" />
              {plot.plant_type}
            </div>
          ) : (
            <p className="text-sm text-gray-400">ยังไม่ระบุพืชที่ปลูก</p>
          )}
        </div>

        {/* Hint */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            📱 สแกน QR Code เพื่อดูข้อมูลแปลงและอัปเดตสถานะ
          </p>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleDownload}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3
            bg-green-600 text-white text-sm font-semibold rounded-xl
            hover:bg-green-700 active:bg-green-800
            transition-colors shadow-sm"
        >
          <Download size={18} aria-hidden="true" />
          ดาวน์โหลด
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3
            bg-white text-gray-700 text-sm font-semibold rounded-xl
            border border-gray-200
            hover:bg-gray-50 active:bg-gray-100
            transition-colors"
        >
          <Printer size={18} aria-hidden="true" />
          พิมพ์
        </button>
      </div>

      {/* QR URL info */}
      <p className="text-center text-xs text-gray-400 mt-4 break-all">
        {qrUrl}
      </p>
    </div>
  );
}
