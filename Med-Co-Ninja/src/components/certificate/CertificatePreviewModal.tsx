import React, { useRef, useState } from 'react';
import certificateBg from '../../assets/cirtificate4.jpeg';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Send } from 'lucide-react';

const formatCertDate = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export interface CertificateDetails {
  studentId: string;
  studentName: string;
  phoneNumber: string;
  courseName: string;
  duration: string;
  grade: string;
  batchId?: string;
  batchName?: string;
}

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateDetails | null;
  onGenerateSubmit?: (
    cert: CertificateDetails,
    fileBlob?: Blob
  ) => void;
  isSubmitting?: boolean;
}

export const CertificatePreviewModal: React.FC<
  CertificatePreviewModalProps
> = ({
  isOpen,
  onClose,
  certificate,
  onGenerateSubmit,
  isSubmitting,
}) => {
    const certificateRef = useRef<HTMLDivElement>(null);

    const [isGeneratingCanvas, setIsGeneratingCanvas] =
      useState(false);

    if (!isOpen || !certificate) return null;

    /*
     * Extract only the number from duration.
     *
     * Examples:
     * "2 Month"   -> "2"
     * "2 Months"  -> "2"
     * "2 month"   -> "2"
     * "6 Months"  -> "6"
     */
    const displayMonths =
      certificate.duration?.match(/\d+/)?.[0] ||
      certificate.duration ||
      '';

    /*
     * Remove "Grade" if backend sends:
     *
     * "A Grade" -> "A"
     * "A grade" -> "A"
     * "A"       -> "A"
     */
    const displayGrade =
      certificate.grade
        ?.replace(/\s*[Gg]rade\s*/g, '')
        .trim() || '';

    /*
     * Generate PDF
     */
    const handleGenerate = async () => {
      if (
        !certificateRef.current ||
        !onGenerateSubmit ||
        !certificate
      ) {
        return;
      }

      setIsGeneratingCanvas(true);

      try {
        const canvas = await html2canvas(
          certificateRef.current,
          {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          }
        );

        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(
          imgData,
          'PNG',
          0,
          0,
          canvas.width,
          canvas.height
        );

        const pdfBlob = pdf.output('blob');

        onGenerateSubmit(certificate, pdfBlob);
      } catch (error) {
        console.error(
          'Certificate PDF generation failed:',
          error
        );
      } finally {
        setIsGeneratingCanvas(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="max-h-[95vh] max-w-[95vw] overflow-auto rounded-xl bg-white p-4 shadow-2xl">

          {/* =====================================================
            HEADER
        ====================================================== */}
          <div className="mb-3 flex w-full justify-end gap-3">
            {onGenerateSubmit && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={
                  isSubmitting || isGeneratingCanvas
                }
                className="flex items-center gap-1.5 rounded-lg bg-accent-teal px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />

                {isSubmitting || isGeneratingCanvas
                  ? 'Generating...'
                  : 'Generate'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          {/* =====================================================
            CERTIFICATE PREVIEW

            Original certificate ratio:
            2048 x 1445

            We use:
            1200 x 847
        ====================================================== */}

          <div
            className="overflow-hidden rounded-lg border border-slate-200 shadow-lg"
            style={{
              width: '840px',
              height: '593px',
            }}
          >
            <div
              ref={certificateRef}
              className="relative h-[847px] w-[1200px] origin-top-left"
              style={{
                transform: 'scale(0.7)',
              }}
            >

              {/* =================================================
                CERTIFICATE BACKGROUND
            ================================================== */}

              <img
                src={certificateBg}
                alt="Certificate Background"
                className="absolute inset-0 h-full w-full select-none"
                crossOrigin="anonymous"
              />

              {/* =================================================
                STUDENT NAME
            ================================================== */}

              <div
                className="
                absolute
                left-0
                top-[430px]
                w-full
                text-center
                font-serif
                text-[42px]
                font-bold
                text-primary-navy
              "
              >
                {certificate.studentName}
              </div>
              {/* Certificate Issue Date */}
              <div
                className="
    absolute
    left-[118px]
    top-[670px]
    w-[360px]
    text-[25px]
    text-center
    font-serif
    text-[20px]
    text-slate-800
  "
              >
                {formatCertDate(new Date())}
              </div>

              {/* =================================================
                DYNAMIC CERTIFICATE DESCRIPTION

                STATIC:
                has successfully completed our
                Month Certification Program in
                with
                Grade.

                DYNAMIC:
                duration
                courseName
                grade
            ================================================== */}

              {/* =================================================
    CERTIFICATE DESCRIPTION
================================================== */}

             {/* =================================================
    CERTIFICATE DESCRIPTION
================================================= */}

<div
  className="
    absolute
    left-[80px]
    top-[480px]
    w-[1040px]
    text-center
    font-serif
    text-[25px]
    italic
    leading-[30px]
    text-slate-800
         
  "
>
  {/* LINE 1 */}
  <div>
    <span>
      Reg no. {certificate.username} You have successfully completed our{' '}
    </span>

    <span className="font-bold not-italic">
      {displayMonths} month training program
    </span>
  </div>

  {/* LINE 2 */}
  <div>
    <span>in </span>

    <span className="font-bold not-italic">
      {certificate.courseName}
    </span>

    <span> with </span>

    <span className="font-bold not-italic">
      {displayGrade}
    </span>

    <span> Grade!</span>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
    );
  };