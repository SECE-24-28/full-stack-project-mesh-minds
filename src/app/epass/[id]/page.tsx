'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { Loader2, Calendar, MapPin, Clock, Download, Printer } from 'lucide-react';

interface EPass {
  id: string;
  passCode: string;
  qrCodeUrl: string;
  event?: {
    title: string;
    venue: string;
    startDate: string;
    endDate: string;
  };
  student?: {
    name: string;
    department: string;
    rollNumber: string;
  };
}

export default function EPassPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [epass, setEpass] = useState<EPass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!params.id) return;

    fetch(`/api/epass/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setEpass(data.epass);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load e-pass');
        setLoading(false);
      });
  }, [session, params.id, router]);

  function handleDownload() {
    if (!epass) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>E-Pass - ${epass.event?.title}</title></head>
          <body style="padding: 20px; font-family: sans-serif;">
            <h1>${epass.event?.title}</h1>
            <p>Pass Code: ${epass.passCode}</p>
            <img src="${epass.qrCodeUrl}" alt="QR Code" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-slate-500">Loading e-pass...</p>
        </div>
      </div>
    );
  }

  if (!epass) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-500">E-Pass not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Digital Event Pass</h1>
        <p className="mt-1 text-sm text-slate-500">Your entry pass for the event.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-slate-900/50 p-6 print:border-none print:bg-white print:text-black">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white print:text-black">{epass.event?.title}</h2>
            <p className="text-sm text-slate-400 print:text-gray-600">Event Pass</p>
          </div>

          <div className="mb-6 flex justify-center">
            <img src={epass.qrCodeUrl} alt="QR Code" className="h-48 w-48" />
          </div>

          <div className="space-y-3 border-t border-white/5 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-400 print:text-gray-600">Pass Code</span>
              <span className="font-mono font-medium text-white print:text-black">{epass.passCode}</span>
            </div>
            {epass.student && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Student</span>
                  <span className="text-white print:text-black">{epass.student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Roll Number</span>
                  <span className="text-white print:text-black">{epass.student.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Department</span>
                  <span className="text-white print:text-black">{epass.student.department}</span>
                </div>
              </>
            )}
            {epass.event && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Venue</span>
                  <span className="text-white print:text-black">{epass.event.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Date</span>
                  <span className="text-white print:text-black">{new Date(epass.event.startDate).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-2.5 text-sm font-semibold text-white"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}