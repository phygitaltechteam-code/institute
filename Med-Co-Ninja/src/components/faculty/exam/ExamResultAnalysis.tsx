import { useState } from "react";
import { Route, useNavigate, useParams } from "@tanstack/react-router";
import { useAdminGetExamAnalysis, useGetExamAnalysis } from "@/lib/react-query/queriesAndMutations/studentExam";
import { useAuthContext } from "@/context/AuthContext";
import GenericButton from "@/components/Forms/Buttons/GenericButton";


interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string;
  marks: number;
}

interface StudentAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  question: {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    answer: string;
    explanation: string;
    marks: number;
  };
}

interface ExamAnalysisData {
  id: string;
  examId: string;
  studentId: string;
  marks: number;
  totalAnswer: number;
  correctAnswer: number;
  wrongAnswer: number;
  percentage: number;
  remarks: string | null;
  studentExamSubmitteds: StudentAnswer[];
}

const ExamResultAnalysis = () => {

  const user = useAuthContext()
  const role = user?.role as string

  const params = useParams({ strict: false }) as { studentId: string; examId: string };
  const { data: examAnalysis, isLoading, isError, refetch } = useAdminGetExamAnalysis(params.studentId, params.examId, role);

  console.log("examAnalysis", examAnalysis);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const navigate = useNavigate();

  // ✅ Transform backend data to match component structure
  const transformAnalysisData = (data: any) => {
    if (!data || data.length === 0) {
      return {
        questions: [],
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        notSubmitted: 0,
        marks: 0,
        percentage: 0
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    const submissions = result?.studentExamSubmitteds || [];

    const questions = submissions.map((submission: StudentAnswer) => {
      const q = submission.question;

      let status = "notSubmitted";
      if (submission.isCorrect === true) {
        status = "right";
      } else if (submission.isCorrect === false) {
        status = "wrong";
      }

      let selectedOption = "";
      const studentAnswer = submission.answer?.trim() || "";

      if (studentAnswer === q.optionA?.trim()) selectedOption = "option_1";
      else if (studentAnswer === q.optionB?.trim()) selectedOption = "option_2";
      else if (studentAnswer === q.optionC?.trim()) selectedOption = "option_3";
      else if (studentAnswer === q.optionD?.trim()) selectedOption = "option_4";

      if (!selectedOption) {
        console.log("⚠️ Could not find option for answer:", {
          studentAnswer,
          options: {
            A: q.optionA,
            B: q.optionB,
            C: q.optionC,
            D: q.optionD
          }
        });
      }

      let correctOption = "";
      if (q.answer === "optionA") correctOption = "option_1";
      else if (q.answer === "optionB") correctOption = "option_2";
      else if (q.answer === "optionC") correctOption = "option_3";
      else if (q.answer === "optionD") correctOption = "option_4";

      return {
        _id: q.id,
        question: q.question,
        option_1: q.optionA,
        option_2: q.optionB,
        option_3: q.optionC,
        option_4: q.optionD,
        selectedOption: selectedOption,
        correctOption: correctOption,
        explanation: q.explanation || "No explanation available",
        status: status,
        isCorrect: submission.isCorrect,
        selectedAnswer: submission.answer,
        correctAnswer: q.answer,
        marks: q.marks || 1
      };
    });

    const correctAnswers = questions.filter((q: any) => q.status === "right").length;
    const wrongAnswers = questions.filter((q: any) => q.status === "wrong").length;
    const notSubmitted = questions.filter((q: any) => q.status === "notSubmitted").length;

    return {
      questions,
      totalQuestions: questions.length,
      correctAnswers,
      wrongAnswers,
      notSubmitted,
      marks: result?.marks || 0,
      percentage: result?.percentage || 0
    };
  };

  // ✅ Transform the data
  const examData = transformAnalysisData(examAnalysis);
  const currentQuestion = examData.questions[currentQuestionIndex];

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-text-charcoal">Loading analysis...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl font-semibold text-danger">Failed to load exam analysis</p>
          <p className="text-text-charcoal mt-2">Please try again later</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded bg-primary-navy px-6 py-2 text-pure-white transition hover:bg-opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No Data State
  if (examData.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl font-semibold text-text-charcoal">No analysis data available</p>
          <button
            onClick={() => navigate({ to: "/student/studentdahboard" })}
            className="mt-4 rounded bg-primary-navy px-6 py-2 text-pure-white transition hover:bg-opacity-90"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "right":
        return "bg-accent-teal";
      case "wrong":
        return "bg-danger";
      default:
        return "bg-bodydark2";
    }
  };

  return (
    <div className="mx-auto max-w-7xl  px-2 sm:px-2 py-4 sm:py-4 md:py-4 ">
      <GenericButton
        label="Back"
        children="Back"
        onClick={() => window.history.back()}
        variant="navy"
      />
      <div className="grid gap-2 sm:gap-6 grid-cols-1 lg:grid-cols-4 px-5">
        {/* LEFT */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <h1 className="mb-3 sm:mb-4 border-b border-stroke pb-3 sm:pb-4 text-lg sm:text-xl md:text-2xl font-extrabold text-primary-navy dark:text-pure-white dark:border-strokedark">
            Question No {currentQuestionIndex + 1}
          </h1>

          <p className="mb-4 sm:mb-6 text-base sm:text-lg md:text-xl font-semibold leading-relaxed text-text-charcoal dark:text-bodydark">
            {currentQuestion?.question || "Question not available"}
          </p>

          <div className="mb-2 sm:mb-2 flex ">
            {currentQuestion?.status === "right" && (
              <span className="font-bold text-base sm:text-lg text-accent-teal">
                ✓ Right Answer
              </span>
            )}

            {currentQuestion?.status === "wrong" && (
              <span className="font-bold text-base sm:text-lg text-danger">
                ✗ Wrong Answer
              </span>
            )}

            {currentQuestion?.status === "notSubmitted" && (
              <span className="font-bold text-base sm:text-lg text-bodydark2">
                Not Submitted
              </span>
            )}
          </div>

          <h3 className="mb-2 sm:mb-3 text-base sm:text-lg md:text-xl font-bold text-primary-navy">
            Explanation
          </h3>

          <p className="mb-4 md:mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed text-text-charcoal dark:text-bodydark">
            {currentQuestion?.explanation || "No explanation available"}
          </p>

          <h3 className="mb-3 sm:mb-4 text-base sm:text-lg md:text-xl font-bold text-primary-navy dark:text-pure-white">
            All Options
          </h3>

          <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg md:text-xl">
            {[
              { key: 'option_1', label: 'A', value: currentQuestion?.option_1 },
              { key: 'option_2', label: 'B', value: currentQuestion?.option_2 },
              { key: 'option_3', label: 'C', value: currentQuestion?.option_3 },
              { key: 'option_4', label: 'D', value: currentQuestion?.option_4 }
            ].map((option) => {
              const isSelected = currentQuestion?.selectedOption === option.key;
              const isCorrectOption = currentQuestion?.correctOption === option.key;

              let className = "font-medium";
              let indicator = "";

              if (isSelected && currentQuestion?.isCorrect) {
                className = "text-accent-teal font-bold";
                indicator = " ✓";
              } else if (isSelected && !currentQuestion?.isCorrect) {
                className = "text-danger font-bold";
                indicator = "";
              } else if (isCorrectOption && !isSelected) {
                className = "text-accent-teal font-bold";
                indicator = "";
              }

              return (
                <li key={option.key} className={className}>
                  {option.label}. {option.value || "N/A"}
                  {indicator}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 sm:mt-4 flex flex-wrap gap-3 sm:gap-4">
            <GenericButton
            variant="navy"
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  prev > 0 ? prev - 1 : prev
                )
              }
              className="bg-danger text-pure-white font-bold"
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </GenericButton>

            <GenericButton
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  prev < examData.questions.length - 1
                    ? prev + 1
                    : prev
                )
              }
              className="bg-primary-navy text-pure-white font-bold"
              disabled={currentQuestionIndex === examData.questions.length - 1}
            >
              Next Question
            </GenericButton>
          </div>
        </div>

        {/* RIGHT */}
        <div className="order-1 lg:order-2">
          <h2 className="mb-3 sm:mb-4 border-b border-stroke pb-3 sm:pb-4 text-lg sm:text-xl md:text-2xl font-bold text-primary-navy dark:text-pure-white dark:border-strokedark">
            Exam Analysis
          </h2>

          <div className="mb-3 sm:mb-4 flex flex-wrap gap-3 sm:gap-4 text-base font-bold">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-accent-teal" />
              <span className="text-accent-teal text-base sm:text-lg">Right</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-danger" />
              <span className="text-danger text-base sm:text-lg">Wrong</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-bodydark2" />
              <span className="text-bodydark2 text-base sm:text-lg">Not Submitted</span>
            </div>
          </div>

          <div className="rounded-lg border border-stroke bg-pure-white p-2 sm:p-2 shadow dark:border-strokedark dark:bg-primary-navy">
            <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-start max-h-[300px] sm:max-h-[400px] overflow-y-auto p-2">
              {examData.questions.map((question: any, index: number) => (
                <button
                  key={question._id || index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`
                    flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded text-pure-white text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-105
                    ${getStatusColor(question.status)}
                    ${currentQuestionIndex === index
                      ? "ring-4 ring-offset-2 ring-primary-navy dark:ring-offset-primary-navy dark:ring-pure-white"
                      : ""
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ExamResultAnalysis;