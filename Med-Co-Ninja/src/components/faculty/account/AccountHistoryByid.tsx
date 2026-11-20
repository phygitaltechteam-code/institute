import { formatDateTimeAuto } from '@/utils/dateTimeUtils';
import { useGetAccountHistoryById } from "@/lib/react-query/queriesAndMutations/account";
import { Route } from "@/routes/_app/_admin/admin/account/acounthistorybyid.$id";
import { FaUpRightAndDownLeftFromCenter } from "react-icons/fa6";
import GenericButton from "@/components/Forms/Buttons/GenericButton";
import { useNavigate } from "@tanstack/react-router";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import GenericTable, { Column } from "@/components/Forms/Table/GenericTable";
import { useEffect, useRef } from "react";
import { useAuthContext } from "@/context/AuthContext";

type AccountHistoryType = {
  id: string;
  amount: number;
  type: string;
  notes: string;
  afterWalletBalance: number;
  createdAt: string;
};

export const AccountHistoryByid = () => {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const role = user?.role;
  const printRef = useRef<HTMLDivElement>(null);

  console.log("✅ Account ID from URL:", id);
  console.log("✅ Role:", role);

  // ✅ Pass role to the hook
  const { data: accountData, isLoading, isError, refetch } = useGetAccountHistoryById(id, role);

  console.log("📊 Account Data:", accountData);

  // Refetch when ID changes
  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id, refetch]);

  const handleBack = () => {
    navigate({ to: '/admin/account/addaccount' });
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ Get account data from the response
  const account = accountData?.data || accountData || {};
  const accountHistories = account.accountHistories || [];

  // Get account details
  const accountName = account?.user?.fullname || account?.user?.username || 'Account';
  const accountType = account?.type || 'N/A';
  const currentBalance = account?.balance || 0;

  // Transform data for table
  const tableData: AccountHistoryType[] = accountHistories.map((item: any) => ({
    id: item.id,
    amount: item.amount,
    type: item.type,
    notes: item.notes || item.description || '-',
    afterWalletBalance: item.afterWalletBalance,
    createdAt: item.createdAt,
  }));

  const columns: Column<AccountHistoryType>[] = [
    {
      accessor: 'createdAt',
      header: 'Date',
      render: (item) =>
        item.createdAt ? formatDateTimeAuto(item.createdAt) : 'N/A',
    },
    {
      accessor: 'type',
      header: 'Type',
      render: (item) => (
        <span>
          {item.type || 'N/A'}
        </span>
      ),
    },
    {
      accessor: 'amount',
      header: 'Amount',
      render: (item) => (
        <span>
          {item.type === 'CREDIT' ? '+' : '-'} ₹{item.amount?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      accessor: 'notes',
      header: 'Notes',
      render: (item) => item.notes || '-',
    },
    {
      accessor: 'afterWalletBalance',
      header: 'Balance After',
      render: (item) => `₹${item.afterWalletBalance?.toLocaleString() || 0}`,
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-primary-navy border-t-transparent"></div>
          <p className="text-text-charcoal">Loading account history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex justify-center py-5 md:py-8">
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-red-600">Failed to load account history. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 rounded-lg bg-primary-blue px-4 py-2 text-white hover:bg-primary-navy"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6">
      {/* Header with Back Button and Print Button */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5 md:mb-6">
        <div className="flex items-center gap-3">
          <GenericButton
            onClick={handleBack}
            variant="navy"
            aria-label="Go back"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </GenericButton>
          <h1 className="text-lg font-bold text-text-charcoal sm:text-xl md:text-2xl">
            Account History
          </h1>
        </div>
        <GenericButton
          onClick={handlePrint}
          variant="primary-navy"
          className="!border-primary-navy !text-primary-navy hover:!bg-primary-navy hover:!text-white"
        >
          <FaPrint className="mr-2" />
          Print
        </GenericButton>
      </div>

      {/* Account Summary - Print Section */}
      <div ref={printRef} className="print-container">
        {/* Account Header - Visible in print */}
        <div className="mb-6 hidden border-b pb-4 print:block">
          <h2 className="text-2xl font-bold text-primary-navy">Account Statement</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div>
              <p className="text-sm text-gray-600">Account Name</p>
              <p className="font-semibold">{accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-semibold">{accountType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="font-semibold text-[#785600]">₹{currentBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">Statement Period</p>
            <p className="font-semibold">
              {tableData.length > 0 
                ? `${new Date(tableData[tableData.length - 1]?.createdAt).toLocaleDateString()} - ${new Date(tableData[0]?.createdAt).toLocaleDateString()}`
                : 'N/A'}
            </p>
          </div>
        </div>

     

        {/* Account History Table */}
        <div className="print:mt-4">
          {tableData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 md:py-12">
              <FaUpRightAndDownLeftFromCenter className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-text-charcoal">No transactions found for this account</p>
            </div>
          ) : (
            <>
              {/* Print-only table with full data */}
              <div className="hidden print:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Sr No.</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Notes</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.createdAt ? formatDateTimeAuto(item.createdAt) : 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`font-semibold ${
                            item.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.type || 'N/A'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                          <span className={item.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                            {item.type === 'CREDIT' ? '+' : '-'} ₹{item.amount?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{item.notes || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                          ₹{item.afterWalletBalance?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right">Total Transactions:</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tableData.length}</td>
                      <td colSpan={2} className="border border-gray-300 px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>Generated on: {new Date().toLocaleString()}</p>
                  <p className="mt-1">This is a system-generated statement</p>
                </div>
              </div>

              {/* Screen view table */}
              <div className="print:hidden">
                <GenericTable
                  columns={columns}
                  data={tableData}
                  searchAble={true}
                  itemsPerPage={10}
                  showSrNo={true}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:mt-4 {
            margin-top: 1rem !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
};