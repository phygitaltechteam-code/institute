import { Column } from "@/types";
import GenericTable from "../Forms/Table/GenericTable";
import { useNavigate } from "@tanstack/react-router";
import { useGetStudentExams } from "@/lib/react-query/queriesAndMutations/studentExam";
import GenericButton from "../Forms/Buttons/GenericButton";

type dailyTask = {
  srno: number,
  subject: string;
  topic: string,
  title: string,
  totalQuestions: number,
  timeLimit: string,
  examStatus: string,
  action: string
  exam: string;
}

const Exam = () => {
  const { data: getExams } = useGetStudentExams();
  console.log("getexam", getExams)

  const mappedExam = getExams?.map((exam: any, index: number) => ({

    id: exam?.id,
    subject: exam.subject || "N/A",
    topic: exam.name || "N/A",
    title: exam.title || "N/A",
remarks: exam?.examResults?.map(r => r.remarks).join(", ") || "N/A",    totalQuestions: exam?.examQuestions?.length || 0,
    hours: exam.hours || 0,
    minutes: exam?.minutes || 0,
    examStatus: exam.isSubmitted === true ? "Submitted" : "Pending",
  }))
  console.log("map exam", mappedExam)

  const navigate = useNavigate();

  const examColmn: Column<dailyTask>[] = [

    { header: "Subject", accessor: "subject" },
    { header: "Topic", accessor: "topic" },
    { header: "Title", accessor: "title" },
    { header: "Total Question", accessor: "totalQuestions" },
    { header: "Time Limit", accessor: (row: any) => `${row.minutes}Min` },
    { header: "Remarks", accessor: "remarks" },
    {
      header: "Exam",
      accessor: "exam",
      render: (row: any) =>
        row.examStatus === "Submitted" ? (
          <div className="flex justify-center">
            <button
              onClick={() => navigate({ to: `/student/examresult/${row.id}` })}
              className="bg-primary-navy text-pure-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 hover:shadow-md transition-all duration-200"
            >
              View Result
            </button>
          </div>
        ) : (
          <button
            onClick={() => onView(row.id)}
            className="bg-primary-navy text-pure-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 hover:shadow-md transition-all duration-200"
          >
            Start Exam
          </button>
        )
    }
  ]

  const onView = (id: string) => {
    navigate({
      to: `/student/exam/${id}`,
      params: { id: id }
    })
  }

  return (
    <div className="">
      <h1 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">Your Pending Exams</h1>
      <hr className="mb-3 opacity-25" />
      <GenericTable columns={examColmn} data={mappedExam || []} showSrNo={true} />
    </div>
  );
};

export default Exam;