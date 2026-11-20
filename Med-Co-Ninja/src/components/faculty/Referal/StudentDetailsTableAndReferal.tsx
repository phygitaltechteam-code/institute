import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericTable from '@/components/Forms/Table/GenericTable';
import { Column } from '@/types/index';
import { useState } from 'react';
import { ReferalForm } from './ReferalForm';
import { useNavigate } from '@tanstack/react-router';
import { useAuthContext } from '@/context/AuthContext';
import { FiUsers, FiPlus, FiDollarSign, FiAlertCircle, FiUpload, FiEye, FiEdit2 } from 'react-icons/fi';
import { useGetAccounts } from '@/lib/react-query/queriesAndMutations/account';
import { formatDate } from '@/utils/dateTimeUtils';
import { useGetReferrals } from '@/lib/react-query/queriesAndMutations/referralapi';
import { MdPayment } from 'react-icons/md';
import { usePayReferToStudent } from '@/lib/react-query/queriesAndMutations/studentMutation';

interface StudentDetailsTableReferalProps {
  batchId: string;
}

const StudentDetailsTableReferal = ({
  batchId,
}: StudentDetailsTableReferalProps) => {
  const [openReferalForm, setOpenReferalForm] = useState(false);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] =
    useState<StudentDetailsTable | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [amountToPay, setAmountToPay] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const role = user?.role;

  // Fetch students by batch ID using the correct API
  const { data: referralsData, isLoading, isError, refetch } = useGetReferrals(role, batchId);
  const { data: accountsData } = useGetAccounts(role);

  console.log('Referrals Data:', referralsData);
  console.log('Batch ID:', batchId);
  console.log('Role:', role);

  const accounts = accountsData?.data?.data || accountsData?.data || [];

  type StudentDetailsTable = {
    id: string;
    name: string;
    mobile: string;
    totalAttendance: string;
    totalExam: string;
    finalExam: string;
    placementForm: string;
    internship: string;
    paidFees: string;
    pendingFees: string;
    followUpDate: string;
    totalInterviewGiven: string;
    placementRecieved: string;
    referals: string;
    referalBonus: string;
    paidBonus: string;
    action: string;
    referralId?: string;
    referId?: string;
    leadId?: string;
    leads?: any[];
  };

  // Map API data to table structure
  const referralList =
    referralsData?.data?.data || referralsData?.data || referralsData || [];

  const studentData: StudentDetailsTable[] = Array.isArray(referralList)
    ? referralList.map((referral: any) => {
      // Get all lead IDs
      const leadIds = referral?.leads?.map((lead: any) => lead.id) || [];
      const firstLeadId = leadIds[0] || '';

      return {
        id: referral.id || referral._id || 'N/A',
        name: referral?.name || referral?.user?.fullname || 'N/A',
        mobile: referral?.phoneNumber || referral?.user?.phoneNumber || referral?.mobile || 'N/A',
        totalAttendance: referral?.totalAttendance || '0%',
        totalExam: referral?.totalExam || '0',
        finalExam: referral?.finalExam || 'N/A',
        placementForm: referral?.placementForm || 'N/A',
        internship: referral?.internship || 'N/A',
        paidFees: referral?.paidFees ? `₹${referral.paidFees}` : '₹0',
        pendingFees: referral?.pendingFees ? `₹${referral.pendingFees}` : '₹0',
        followUpDate: referral?.followUpDate || 'N/A',
        totalInterviewGiven: referral?.interviewsGiven || referral?.totalInterviewGiven || '0',
        placementRecieved: referral?.placementRecieved || 'No',
        referals: referral?.referrals || referral?.referals?.length || '0',
        referalBonus: referral?.referAmount ? `₹${referral.referAmount}` : '₹0',
        paidBonus: referral?.paidBonus ? `₹${referral.paidBonus}` : '₹0',
        action: '',
        referralId: referral?.referralId || referral?.referId || '',
        referId: referral?.referId || referral?.referralId || '',
        leadId: firstLeadId,
        leads: referral?.leads || [],
      };
    })
    : [];

  const columns: Column<StudentDetailsTable>[] = [
    {
      accessor: 'name',
      header: 'Name',
      render: (item: StudentDetailsTable) => (
        <span className="font-medium text-text-charcoal cursor-pointer hover:text-accent-teal">
          {item.name}
        </span>
      ),
    },
    {
      accessor: 'mobile',
      header: 'Phone Number',
    },
    {
      accessor: 'paidFees',
      header: 'Paid Fees',
    },
    {
      accessor: 'pendingFees',
      header: 'Pending Fees',
    },
    {
      accessor: 'referals',
      header: 'Referrals',
      render: (item: StudentDetailsTable) => (
        <span className="font-medium text-primary-navy">
          {item.referals || '0'}
        </span>
      ),
    },
    {
      accessor: 'referalBonus',
      header: 'Referral Bonus',
    },
    {
      accessor: 'paidBonus',
      header: 'Paid Bonus',
    },
    {
      accessor: 'action',
      header: 'Action',
      render: (item: StudentDetailsTable) => (
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePayment(item);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary-navy px-3 py-1.5 text-sm font-semibold text-pure-white shadow-lg transition hover:bg-primary-navy/90"
          title="Payment"
        >
          <MdPayment className="h-4 w-4" />
          Payment
        </button>
      </div>
      ),
    },
  ];

  const handlePayment = (student: StudentDetailsTable) => {
    setSelectedStudent(student);
    setSelectedAccount(null);
    setAmountToPay('');
    setPaymentMethod('');
    setOpenPaymentForm(true);
  };

  const handleAddReferal = (studentId: string) => {
    setStudentId(studentId);
    setOpenReferalForm(true);
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((acc: any) => acc.id === accountId);
    setSelectedAccount(account);
  };

  const { mutate: payReferToStudent } = usePayReferToStudent();

  const handlePaymentSubmit = () => {
    // if (!amountToPay || parseFloat(amountToPay) <= 0) {
    //   alert('Please enter a valid amount');
    //   return;
    // }

    
    const paymentData = {
      studentId: selectedStudent?.id,
      ...(selectedAccount ? { accountId: selectedAccount.id } : null),
    }

    payReferToStudent({payload:paymentData , role:role})

    refetch()

    console.log('Payment Data:', paymentData);
    setOpenPaymentForm(false);
    setSelectedStudent(null);
    setSelectedAccount(null);
    setAmountToPay('');
    setPaymentMethod('');
  };

  // Handle row click - Navigate to referral income page with lead data
  const handleRowClick = (student: StudentDetailsTable) => {
    const idToPass = student.leadId || student.id;

    if (!idToPass || idToPass === 'N/A') {
      console.error('No valid ID to navigate');
      return;
    }

    // Navigate to referral income page with leads data
    if (role === 'ADMIN' || role === 'SUPERADMIN') {
      navigate({
        to: '/admin/referal/refaral-income/$id',
        params: { id: idToPass },
        state: {
          studentId: student.id,
          studentName: student.name,
          leads: student.leads,
          batchId: batchId
        }
      });
    } else if (role === 'TEACHER' || role === 'FACULTY') {
      navigate({
        to: '/faculty/referal/refaral-income/$id',
        params: { id: idToPass },
        state: {
          studentId: student.id,
          studentName: student.name,
          leads: student.leads,
          batchId: batchId
        }
      });
    } else {
      navigate({
        to: '/admin/referal/refaral-income/$id',
        params: { id: idToPass },
        state: {
          studentId: student.id,
          studentName: student.name,
          leads: student.leads,
          batchId: batchId
        }
      });
    }
  };


  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-pure-white p-4 shadow">
        <div className="text-center">
          <div className="border-primary-blue mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-text-charcoal">Loading student data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg bg-pure-white p-4 shadow">
        <div className="rounded-lg bg-red-50 p-4 md:p-8 text-center">
          <FiAlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-red-600">
            Failed to load student data
          </p>
          <p className="mt-2 text-sm text-red-500">Please try again later</p>
          <button
            onClick={() => refetch()}
            className="bg-primary-blue mt-4 rounded-lg px-6 py-2 text-white transition hover:bg-primary-navy"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GenericTable
        columns={columns}
        data={studentData.length > 0 ? studentData : []}
        title="Student Referrals"
        showSrNo={true}
        searchAble={true}
        onRowClick={handleRowClick}
      />

      {/* Payment Popup */}
      {openPaymentForm && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-pure-white shadow-lg">
            <button
              className="absolute right-4 top-4 z-10 text-2xl font-bold text-red-500 hover:text-red-700"
              onClick={() => setOpenPaymentForm(false)}
            >
              ×
            </button>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-charcoal mb-4">
                Payment Details
              </h2>

              {/* Student Info */}
              <div className="mb-2 rounded-lg bg-gray-50 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Student Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-sm font-medium text-gray-800">{selectedStudent.mobile}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending Fees</p>
                    <p className="text-sm font-medium text-red-600">{selectedStudent.pendingFees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid Fees</p>
                    <p className="text-sm font-medium text-green-600">{selectedStudent.paidFees}</p>
                  </div>
                   <div>
                    <p className="text-md text-gray-500">Referal Bonus</p>
                    <p className="text-md font-medium text-green-600">{selectedStudent.referalBonus}</p>
                  </div>
                </div>
              </div>

              {/* Account Dropdown */}
              {(() => {
                const pending = parseFloat(selectedStudent.pendingFees?.replace(/[₹,]/g, '') || '0');
                const bonus = parseFloat(selectedStudent.referalBonus?.replace(/[₹,]/g, '') || '0');
                return (pending === 0 || (pending > 0 && pending < bonus));
              })() && <div className="mt-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Account
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-navy focus:outline-none"
                  onChange={(e) => handleAccountChange(e.target.value)}
                  value={selectedAccount?.id || ''}
                >
                  <option value="">Select Account</option>
                  {accounts.map((account: any) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ₹{account.balance?.toLocaleString() || 0}
                    </option>
                  ))}
                </select>
              </div>}

              {/* Account Balance Display */}
              {selectedAccount &&  (
                <div className="mt-3 rounded-lg bg-green-50 p-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Account Balance:</span>
                    <span className="font-semibold text-primary-navy">
                      ₹{selectedAccount.balance?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="font-medium text-gray-700">Account Name:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedAccount.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount to Pay */}
              {/* <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount to Pay
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-navy focus:outline-none"
                />
              </div> */}

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <GenericButton
                  type="button"
                  onClick={() => setOpenPaymentForm(false)}
                  variant="cancel"
                  className="flex-1 rounded-lg px-4 py-2 text-center"
                >
                  Cancel
                </GenericButton>
                <GenericButton
                  type="button"
                  onClick={handlePaymentSubmit}
                  variant="navy"
                  className="flex-1 rounded-lg px-4 py-2 text-center"
                >
                  Pay Now
                </GenericButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Form Popup */}
      {openReferalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-pure-white shadow-lg">
            <button
              className="absolute right-4 top-4 z-10 text-2xl font-bold text-red-500 hover:text-red-700"
              onClick={() => setOpenReferalForm(false)}
            >
              ×
            </button>
            <div className="p-6">
              <ReferalForm
                studentId={studentId}
                batchId={batchId}
                onSuccess={() => {
                  setOpenReferalForm(false);
                  refetch();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailsTableReferal;