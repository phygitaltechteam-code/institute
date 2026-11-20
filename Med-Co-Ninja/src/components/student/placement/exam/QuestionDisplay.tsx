import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/_student/student/exam/$id";
import { useGetExamById, useSubmitExam } from "@/lib/react-query/queriesAndMutations/studentExam";
import { toast } from "react-hot-toast";
import GenericButton from "@/components/Forms/Buttons/GenericButton";

// Types for exam data
interface ExamQuestion {
    id: string | number;
    question: string;
    options: string[];
    marks: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

const QuestionDisplay = () => {
    const { id } = Route.useParams();
    const { data: questionsData, isLoading, error } = useGetExamById(id);
    const { mutate: submitExam, isPending: submitPending } = useSubmitExam();
    const navigate = useNavigate();

    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    
    // Timer state
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerInitialized = useRef(false);
    const hasSubmitted = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ FIXED: Access exam data from the correct path
    const exam = questionsData?.data?.exam || questionsData?.exam;
    
    // Map backend data to our shape
    const questions: ExamQuestion[] =
        exam?.examQuestions?.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: [q.optionA, q.optionB, q.optionC, q.optionD],
            marks: q.marks ?? 1,
        })) ?? [];

    const totalQuestions = questions.length;
    const currentQuestionData = questions[currentQuestion - 1];
    const savedAnswer = answers[currentQuestion] ?? null;
    const displaySelected = selectedOption !== null ? selectedOption : savedAnswer;

    // Build submission payload
    const handleEndExam = useCallback(() => {
        // Prevent double submission
        if (hasSubmitted.current) return;
        hasSubmitted.current = true;

        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

       // ✅ Only map over answered questions
const submissionPayload = Object.keys(answers).map((key) => {
    const questionNum = parseInt(key);
    const selectedOptionIndex = answers[questionNum];
    const question = questions[questionNum - 1];
    
    return {
        questionId: question.id,
        question: question.question,
        answer: question.options[selectedOptionIndex],
    };
});

       const examData = {
    totalQuestions,
    attemptedCount: Object.keys(answers).length,  // ✅ Renamed for clarity
    skippedCount: totalQuestions - Object.keys(answers).length,
    answers: submissionPayload,  // ✅ Only contains answered questions
};

        console.log("📋 Exam Submission Payload:", examData);

        submitExam(
            { examId: id, payload: examData },
            {
                onSuccess: () => {
                    // toast.success("Exam submitted successfully!");
                    navigate({ to: "/student/studentdahboard" });
                },
                onError: (error) => {
                    toast.error("Failed to submit exam. Please try again.");
                    console.error("Submission error:", error);
                    hasSubmitted.current = false;
                }
            }
        );
    }, [questions, answers, id, totalQuestions, navigate, submitExam]);

    // Initialize timer once data loads
    useEffect(() => {
        if (!exam || timerInitialized.current) return;
        
        // ✅ FIXED: Get hours and minutes from the exam object
        const totalSeconds =
            (exam.hours ?? 0) * 3600 + (exam.minutes ?? 0) * 60;
        
        // Only set timer if there's time allocated
        if (totalSeconds > 0) {
            setTimeLeft(totalSeconds);
            timerInitialized.current = true;
        } else {
            // No time limit, set to null (no timer)
            setTimeLeft(null);
            timerInitialized.current = true;
        }
    }, [exam]);

    // Countdown tick
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) {
            // Only submit if time has expired and we haven't submitted yet
            if (timeLeft === 0 && !hasSubmitted.current && timerInitialized.current) {
                handleEndExam();
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : 0));
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [timeLeft, handleEndExam]);

    // Handle page unload / navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (Object.keys(answers).length > 0 && !hasSubmitted.current) {
                e.preventDefault();
                e.returnValue = "You have unsaved answers. Are you sure you want to leave?";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [answers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    // Derived timer display
    const displayHours = timeLeft !== null ? Math.floor(timeLeft / 3600) : 0;
    const displayMinutes = timeLeft !== null ? Math.floor((timeLeft % 3600) / 60) : 0;
    const displaySeconds = timeLeft !== null ? timeLeft % 60 : 0;
    const isLow = timeLeft !== null && timeLeft <= 300;

    const handleOptionSelect = (index: number) => {
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption !== null) {
            setAnswers(prev => ({ ...prev, [currentQuestion]: selectedOption }));
            if (currentQuestion < totalQuestions) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedOption(null);
            }
        }
    };

    const handleSkip = () => {
        if (currentQuestion < totalQuestions) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedOption(null);
        }
    };

    const handleQuestionClick = (questionNum: number) => {
        setCurrentQuestion(questionNum);
        setSelectedOption(null);
    };

    const getQuestionStatus = (num: number) => {
        if (num === currentQuestion) return "current";
        if (answers[num] !== undefined) return "answered";
        return "unanswered";
    };


    const getQuestionBtnClass = (num: number) => {
        const status = getQuestionStatus(num);
        const base =
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-pure-white text-xs font-bold transition-all duration-150 hover:scale-105";
        if (status === "current")
            return `${base} bg-primary-navy ring-2 ring-offset-1 ring-primary-navy dark:ring-offset-primary-navy dark:ring-pure-white`;
        if (status === "answered") return `${base} bg-accent-teal`;
        return `${base} bg-bodydark2`;
    };

    // Loading / error / empty states
    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center px-4">
                <p className="animate-pulse text-lg font-semibold text-primary-navy dark:text-pure-white">
                    Loading exam questions…
                </p>
            </div>
        );
    }

    if (error || !exam) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center px-4">
                <p className="text-lg font-semibold text-danger">
                    Failed to load exam. Please try again.
                </p>
            </div>
        );
    }

    if (totalQuestions === 0) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-lg font-semibold text-bodydark2">
                        No questions found for this exam.
                    </p>
                    <p className="mt-1 text-sm text-bodydark2">
                        Exam: {exam.name || "N/A"}
                    </p>
                    <button
                        onClick={() => navigate({ to: "/student/studentdahboard" })}
                        className="mt-4 rounded-lg bg-primary-navy px-5 py-2 text-sm text-pure-white transition-colors hover:bg-primary-navy/90"
                    >
                        Back to Exams
                    </button>
                </div>
            </div>
        );
    }

    const answeredCount = Object.keys(answers).length;
    const progress = Math.round((answeredCount / totalQuestions) * 100);

    return (
        <div className="mx-auto max-w-7xl px-2.5 py-3 sm:px-4 md:py-4">
            {/* Top bar: exam name, question counter, progress, timer */}
            <div className="sticky top-12 z-30 mb-3 rounded-lg border border-stroke bg-pure-white px-3 py-2 shadow-sm sm:top-14 dark:border-strokedark dark:bg-primary-navy">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-bodydark2">
                            {exam.name || exam.title || "Exam"}
                        </p>
                        <h1 className="text-base font-bold text-primary-navy dark:text-pure-white sm:text-lg">
                            Question {currentQuestion}
                            <span className="ml-1 text-sm font-medium text-bodydark2">/ {totalQuestions}</span>
                        </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs font-medium text-bodydark2 sm:inline">
                            Answered <b className="text-accent-teal">{answeredCount}</b>/{totalQuestions}
                        </span>
                        {timeLeft !== null && (
                            <div
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-sm font-bold sm:text-base
                                ${isLow ? "animate-pulse bg-danger text-pure-white" : "bg-primary-navy text-pure-white"}`}
                            >
                                <span>⏱</span>
                                <span>{pad(displayHours)}:{pad(displayMinutes)}:{pad(displaySeconds)}</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stroke dark:bg-strokedark">
                    <div className="h-full rounded-full bg-accent-teal transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Mobile / tablet: question palette as a slim scrollable strip */}
            <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
                {questions.map((_, i) => {
                    const num = i + 1;
                    return (
                        <button key={num} onClick={() => handleQuestionClick(num)} className={getQuestionBtnClass(num)}>
                            {num}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-4">
                {/* LEFT — Question Area */}
                <div className="rounded-lg border border-stroke bg-pure-white p-3 shadow-sm sm:p-4 lg:col-span-3 dark:border-strokedark dark:bg-primary-navy">
                    <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="text-base font-semibold leading-relaxed text-text-charcoal dark:text-bodydark sm:text-lg">
                            {currentQuestionData?.question}
                        </p>
                        <span className="shrink-0 rounded bg-bg-light-mint px-2 py-0.5 text-[11px] font-semibold text-primary-navy">
                            {currentQuestionData?.marks ?? 1} mark{(currentQuestionData?.marks ?? 1) > 1 ? "s" : ""}
                        </span>
                    </div>

                    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
                        {currentQuestionData?.options.map((option, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => handleOptionSelect(index)}
                                    className={`flex h-full w-full items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 sm:text-base
                                        ${displaySelected === index
                                            ? "border-accent-teal bg-accent-teal text-pure-white shadow-md"
                                            : "border-stroke text-text-charcoal hover:border-primary-navy dark:border-strokedark dark:text-bodydark dark:hover:border-pure-white"
                                        }`}
                                >
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                                        ${displaySelected === index ? "bg-white/20" : "bg-bg-light-mint text-primary-navy"}`}
                                    >
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="pt-0.5">{option}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stroke pt-3 dark:border-strokedark">
                        <GenericButton
                            onClick={handleSubmitAnswer}
                            variant="navy"
                            disabled={selectedOption === null || submitPending}
                            className="bg-accent-teal font-bold text-white"
                        >
                            Submit Answer
                        </GenericButton>

                        <GenericButton
                            onClick={handleSkip}
                            disabled={currentQuestion >= totalQuestions || submitPending}
                            className="bg-bodydark2 font-bold text-white"
                        >
                            Skip
                        </GenericButton>

                        <GenericButton
                            onClick={handleEndExam}
                            variant="danger"
                            disabled={submitPending}
                            className="ml-auto bg-danger font-bold text-white"
                        >
                            {submitPending ? "Submitting..." : "End Exam"}
                        </GenericButton>
                    </div>
                </div>

                {/* RIGHT — Navigation panel (desktop) */}
                <aside className="hidden lg:block">
                    <div className="sticky top-32 rounded-lg border border-stroke bg-pure-white p-3 shadow-sm dark:border-strokedark dark:bg-primary-navy">
                        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary-navy dark:text-pure-white">
                            Questions
                        </h2>

                        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold">
                            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary-navy" />Current</span>
                            <span className="flex items-center gap-1 text-accent-teal"><span className="h-3 w-3 rounded bg-accent-teal" />Answered</span>
                            <span className="flex items-center gap-1 text-bodydark2"><span className="h-3 w-3 rounded bg-bodydark2" />Not answered</span>
                        </div>

                        <div className="grid max-h-[50vh] grid-cols-5 gap-1.5 overflow-y-auto p-0.5 xl:grid-cols-6">
                            {questions.map((_, i) => {
                                const num = i + 1;
                                return (
                                    <button key={num} onClick={() => handleQuestionClick(num)} className={getQuestionBtnClass(num)}>
                                        {num}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 space-y-0.5 border-t border-stroke pt-2 text-xs font-medium text-bodydark2 dark:border-strokedark">
                            <p>
                                Answered: <span className="font-bold text-accent-teal">{answeredCount}</span> / {totalQuestions}
                            </p>
                            <p>
                                Marks per question:{" "}
                                <span className="font-bold text-primary-navy dark:text-pure-white">{currentQuestionData?.marks ?? 1}</span>
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default QuestionDisplay;
