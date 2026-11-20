import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  Home,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import GenericButton from "@/components/Forms/Buttons/GenericButton";
import { Route } from "@/routes/_student/student/examresult/$id";
import { useGetExamResult } from "@/lib/react-query/queriesAndMutations/studentExam";
import { useEffect, useState } from "react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

type ExamResultType = {
  totalQuestions: number;
  answersSubmitted: number;
  rightAnswer: number;
  wrongAnswer: number;
  notSubmittedAnswer: number;
};

const ExamResult = () => {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: examResult, isLoading, isError, refetch } = useGetExamResult(id);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  console.log("examResult", examResult);

  const result = {
    totalQuestions: examResult?.exam?._count?.examQuestions || 0,
    answersSubmitted: examResult?.totalAnswer || 0,
    rightAnswer: examResult?.correctAnswer || 0,
    wrongAnswer: examResult?.wrongAnswer || 0,
    notSubmittedAnswer: examResult?.notSubmittedAnswer || 0,
  };

  const chartData = {
    labels: [
      "Right Answer",
      "Wrong Answer",
      "Not Submitted",
    ],
    datasets: [
      {
        data: [
          result.rightAnswer,
          result.wrongAnswer,
          result.notSubmittedAnswer,
        ],
        backgroundColor: [
          "#139a8c",
          "#DC3545",
          "#8A99AF",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
    },
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-blue border-t-transparent"></div>
          <p className="text-text-charcoal">Loading exam result...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex justify-center py-5 md:py-8">
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-red-600">Failed to load exam result. Please try again.</p>
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
    <div className="mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-3 border-b border-stroke pb-3 sm:pb-4 dark:border-strokedark">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary-navy dark:text-pure-white truncate">
          Exam Result
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Result Table */}
        <div className="order-2 lg:order-1">
          <div className="overflow-hidden rounded-lg bg-pure-white shadow-md border border-stroke dark:border-strokedark">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-stroke dark:border-strokedark">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold text-primary-navy dark:text-pure-white">
                    Total Questions
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-primary-navy dark:text-pure-white">
                    {result.totalQuestions}
                  </td>
                </tr>

                <tr className="border-b border-stroke dark:border-strokedark">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold text-accent-teal">
                    <span className="flex items-center gap-1">
                      Answers Submitted
                      <CheckCircle size={isMobile ? 14 : 16} className="inline ml-1" />
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-accent-teal">
                    {result.answersSubmitted}
                  </td>
                </tr>

                <tr className="border-b border-stroke dark:border-strokedark">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold text-accent-teal">
                    <span className="flex items-center gap-1">
                      Right Answer
                      <CheckCircle size={isMobile ? 14 : 16} className="inline ml-1" />
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-accent-teal">
                    {result.rightAnswer}
                  </td>
                </tr>

                <tr className="border-b border-stroke dark:border-strokedark">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold text-danger">
                    <span className="flex items-center gap-1">
                      Wrong Answer
                      <XCircle size={isMobile ? 14 : 16} className="inline ml-1" />
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-danger">
                    {result.wrongAnswer}
                  </td>
                </tr>

                <tr>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold text-bodydark2">
                    <span className="flex items-center gap-1">
                      Not Submitted
                      <XCircle size={isMobile ? 14 : 16} className="inline ml-1" />
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base font-bold text-bodydark2">
                    {result.totalQuestions - result.answersSubmitted}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Buttons */}
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
            <GenericButton
              onClick={() => navigate({ to: `/student/resultanalysis/${id}` })}
              children="View Analysis"
              variant="navy"
              className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
            />
            <GenericButton
              onClick={() => navigate({ to: "/student/studentdahboard" })}
              children="Go Home"
              variant="navy"
              className="flex-1 sm:flex-none text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="order-1 lg:order-2">
          <div className="rounded-lg bg-pure-white p-3 sm:p-4 shadow-md border border-stroke dark:border-strokedark">
            <h3 className="mb-2 sm:mb-3 text-center text-sm sm:text-base font-semibold text-text-charcoal">
              Result Overview
            </h3>
            <div className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px]">
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;