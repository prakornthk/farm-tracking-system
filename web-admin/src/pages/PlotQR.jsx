import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApi } from '../hooks/useApi';
import { plotsAPI } from '../services/api';
import { LoadingSpinner, ErrorAlert } from '../components/Shared';

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
    const WinPrint = window.open('', '', 'width=400,height=500');
    if (!WinPrint) return;
    WinPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${plotName}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            h2 { margin-bottom: 5px; }
            p { color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div id="plot-qr-svg" class="flex justify-center mb-4">
            ${printRef.current.innerHTML}
          </div>
          <h2>${plotName}</h2>
          ${plantType ? `<p>🌱 ${plantType}</p>` : ''}
          <p style="font-size:12px;color:#999;margin-top:12px;">สแกนเพื่อดูข้อมูลแปลง</p>
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
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 300, 300);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const safeName = (plot?.name || `plot-${plotId}`).replace(/[^a-z0-9_-]/gi, '_');
      downloadLink.download = `qr-plot-${safeName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
          aria-label="กลับ"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">QR Code แปลง #{plotId}</h1>
      </div>

      <div className="max-w-sm mx-auto">
        <div ref={printRef} className="card p-8 text-center">
          <div id="plot-qr-svg" className="flex justify-center mb-4">
            <QRCodeSVG value={qrUrl} size={200} level="H" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{plot?.name || `แปลง #${plotId}`}</h2>
          {plot?.plant_type && <p className="text-gray-500 mt-1">🌱 {plot.plant_type}</p>}
          <p className="text-xs text-gray-400 mt-3">สแกนเพื่อดูข้อมูลแปลง</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
          >
            <Download size={18} aria-hidden="true" />
            ดาวน์โหลด
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
          >
            <Printer size={18} aria-hidden="true" />
            พิมพ์
          </button>
        </div>
      </div>
    </div>
  );
}
