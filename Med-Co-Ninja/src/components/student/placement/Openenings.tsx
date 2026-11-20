import React, { useState } from 'react';
import { Building2, MapPin, IndianRupee, Clock, Briefcase, GraduationCap, Calendar, FileText, ListChecks, Info, X, Upload } from 'lucide-react';
import { useApplyForPlacement, useGetStudentPlacements } from '@/lib/react-query/queriesAndMutations/studentplacement';
import toast from 'react-hot-toast';

interface Opening {
  id: string;
  PN: number;
  companyName: string;
  jobRole: string;
  qualification: string;
  jobDescription?: string;
  requiredSkills?: string;
  otherDetails?: string;
  experience: string;
  interviewDate: string;
  interviewMode: string;
  workSchedule: string;
  salary: string;
  location?: string | null;
  adminId: string;
  deadLine?: string | null;
  isApplied?: boolean;
}

const Openings = () => {
  const { data: response, isLoading, isError, refetch } = useGetStudentPlacements();
  const { mutateAsync: applyForPlacement, isPending: isApplying } = useApplyForPlacement();
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicationTitle, setApplicationTitle] = useState('');

  // Get the data array from response
  const openings = response || [];

  console.log("Openings data:", openings);

  // Format date to DD/MM/YY
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');

      return `${hoursStr}:${minutes} ${ampm}`;
    } catch {
      return 'N/A';
    }
  };

  // Format deadline with date and time (12-hour AM/PM)
  const formatDeadline = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');

      return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
    } catch {
      return 'N/A';
    }
  };

  // Format salary
  const formatSalary = (salary: string) => {
    if (!salary) return 'Competitive';
    const num = parseInt(salary);
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} LPA`;
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)}K`;
    }
    return `₹${salary}`;
  };

  // Handle view details
  const handleViewDetails = (opening: Opening) => {
    if (opening.isApplied) {
      return;
    }
    setSelectedOpening(opening);
    setShowModal(true);
    setResumeFile(null);
    setCoverLetter('');
    setApplicationTitle('');
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOpening(null);
    setResumeFile(null);
    setCoverLetter('');
    setApplicationTitle('');
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' && file.size <= 2 * 1024 * 1024) {
        setResumeFile(file);
      } else {
        toast.error('Please upload a PDF file under 2MB');
        e.target.value = '';
      }
    }
  };

  // Handle apply
  const handleApply = async () => {
    if (!selectedOpening) {
      toast.error('No opening selected');
      return;
    }

    try {
      await applyForPlacement({ placementId: selectedOpening.id });

      // toast.success('Application submitted successfully!');
      handleCloseModal();
      await refetch();
    } catch (error: any) {
      // if (error.response.data.message) {
      //   toast.error("You Alredy Apply")
      // }
      // else {
      //   toast.error(error?.response?.data?.message || 'Failed to submit application');
      // }
      console.error(error);
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-pure-white uppercase tracking-wide">
            Available Openings
          </h3>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading openings...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-pure-white uppercase tracking-wide">
            Available Openings
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Failed to load openings. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-pure-white uppercase tracking-wide">
          Available Openings ({openings.length})
        </h3>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {openings.map((item: Opening) => {
          const isApplied = item.isApplied || false;

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-stroke bg-pure-white p-6 shadow-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-strokedark dark:bg-primary-navy"
            >
              {/* Card Content Top */}
              <div>
                {/* Job Role / Title */}
                <h4 className="text-lg font-extrabold text-primary-navy dark:text-pure-white hover:text-accent-teal transition-colors">
                  {item.jobRole || 'Position Available'}
                </h4>

                {/* Company Name */}
                <div className="mt-2 flex items-center gap-2 text-sm text-text-charcoal dark:text-bodydark">
                  <Building2 size={16} className="text-slate-400 dark:text-bodydark" />
                  <span className="font-semibold">{item.companyName || 'Company'}</span>
                </div>

                {/* Location */}
                {item.location && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-text-charcoal dark:text-bodydark">
                    <MapPin size={16} className="text-slate-400 dark:text-bodydark" />
                    <span className="font-medium">{item.location}</span>
                  </div>
                )}

                {/* Qualification */}
                <div className="mt-2 flex items-start gap-2 text-sm text-text-charcoal dark:text-bodydark">
                  <GraduationCap size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item.qualification || 'N/A'}</span>
                </div>

                {/* Experience */}
                <div className="mt-2 flex items-start gap-2 text-sm text-text-charcoal dark:text-bodydark">
                  <Briefcase size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item.experience || '0'} years experience</span>
                </div>

                {/* Salary */}
                {item.salary && (
                  <div className="mt-2 flex items-center gap-2 text-sm font-extrabold text-text-charcoal dark:text-bodydark">
                    <IndianRupee size={16} className="shrink-0" />
                    <span>{formatSalary(item.salary)}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="inline-block rounded bg-primary-navy px-3 py-0.5 text-xs font-extrabold text-white shadow-sm">
                    {item.workSchedule}
                  </span>
                  <span className="inline-block rounded bg-gray-600 px-3 py-0.5 text-xs font-extrabold text-white shadow-sm">
                    {item.interviewMode}
                  </span>
                </div>
              </div>

              {/* Card Bottom / Actions */}
              <div className="mt-3">
                {/* Deadline */}
                {item.deadLine && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                    <Clock size={14} className="shrink-0" />
                    <span>Deadline: {formatDeadline(item.deadLine)}</span>
                  </div>
                )}

                {/* View Details Button - Readable style when applied */}
                {isApplied ? (
                  <button
                    onClick={() => { }}
                    className="mt-3 w-full rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 cursor-default"
                  >
                    ✓ Already Applied
                  </button>
                ) : (
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="mt-3 w-full rounded-lg bg-primary-navy px-4 py-1.5 text-xs font-semibold text-pure-white shadow-sm transition hover:bg-opacity-95 hover:shadow-md active:scale-98"
                  >
                    View Details & Apply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Modal */}
      {showModal && selectedOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-primary-navy rounded-xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-4 shadow-2xl sm:p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-primary-navy dark:text-pure-white sm:text-xl">
                Apply - {selectedOpening.jobRole}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Compact Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 mb-4 text-sm ">
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Company</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOpening.companyName || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Role</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOpening.jobRole || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Salary</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOpening.salary || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Date</p>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(selectedOpening.interviewDate) || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Time</p>
                    <p className="text-gray-600 dark:text-gray-400">{formatTime(selectedOpening.interviewDate) || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Mode</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOpening.interviewMode || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-semibold text-black dark:text-gray-200">Location</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedOpening.location || 'N/A'}</p>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              {/* Job Description */}
              {selectedOpening.jobDescription && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-gray-200">
                    Job Description
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedOpening.jobDescription}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              {selectedOpening.requiredSkills && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-gray-200">
                    Required Skills
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedOpening.requiredSkills}
                  </p>
                </div>
              )}

              {/* Other Details */}
              {selectedOpening.otherDetails && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-gray-200">
                    Other Details
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedOpening.otherDetails}
                  </p>
                </div>
              )}
            </div>

            {/* Application Form */}
            <div className="mt-6 pt-4 border-t border-stroke dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Application Form
              </h3>

              {/* Upload Document */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Resume (PDF only, max 2MB) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 hover:border-gray-400 transition-colors">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Choose file</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {resumeFile ? resumeFile.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              {/* Cover Letter */}
              {/* <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Letter <span className="text-xs text-gray-400 dark:text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Why are you a good fit for this role?"
                  rows={3}
                  className="w-full rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div> */}

              {/* Action Buttons - Right Aligned */}
              <div className='w-full flex gap-3 justify-end'>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className={`rounded-lg px-6 py-3 text-base font-extrabold text-pure-white shadow-sm transition ${isApplying
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-primary-navy hover:bg-opacity-95 hover:shadow-md active:scale-98'
                    }`}
                >
                  {isApplying ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Apply Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Openings;