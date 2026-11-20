import * as XLSX from 'xlsx';

export interface MCQQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  answer: 'optionA' | 'optionB' | 'optionC' | 'optionD';
  correctAnswerLetter: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface MCQValidationError {
  rowNumber: number; // 1-indexed Excel row (header is 1, data starts at 2)
  questionIndex: number; // 1-indexed question count among valid/attempted data rows
  field: string;
  message: string;
  value?: any;
}

export interface MCQValidationWarning {
  message: string;
  rowNumbers: number[];
}

export interface MCQValidationResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  questions: MCQQuestion[];
  errors: MCQValidationError[];
  warnings: MCQValidationWarning[];
  missingColumns?: string[];
}

// Canonical required and optional column names
export const REQUIRED_COLUMNS = [
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Marks per question',
  'Correct Answer',
] as const;

export const OPTIONAL_COLUMNS = ['Explanation'] as const;

/**
 * Downloads a professional, pre-formatted MCQ Excel template.
 */
export const downloadMCQTemplate = () => {
  const headers = [
    'Question',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Marks per question',
    'Correct Answer',
    'Explanation',
  ];

  const sampleData = [
    [
      'What is 2 + 2?',
      '3',
      '4',
      '5',
      '6',
      1,
      'B',
      '2 + 2 equals 4',
    ],
    [
      'What is JavaScript?',
      'Programming Language',
      'Relational Database',
      'Operating System',
      'Web Browser',
      2,
      'A',
      'JavaScript is a high-level programming language used for web development.',
    ],
    [
      'Which of the following is a utility-first CSS framework?',
      'Django',
      'Tailwind CSS',
      'PostgreSQL',
      'Flask',
      1,
      'B',
      'Tailwind CSS provides low-level utility classes to build custom designs.',
    ],
  ];

  const worksheetData = [headers, ...sampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set professional column widths
  worksheet['!cols'] = [
    { wch: 45 }, // Question
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 20 }, // Marks per question
    { wch: 16 }, // Correct Answer
    { wch: 40 }, // Explanation
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'MCQ_Template');

  XLSX.writeFile(workbook, 'MCQ_Questions_Template.xlsx');
};

/**
 * Parses an Excel file (.xlsx or .xls) into a 2D array of rows.
 */
export const parseMCQExcel = (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('File data is empty');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error('No worksheets found in the Excel file');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Parse as raw 2D array to preserve exact row indexing
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: true,
        });

        resolve(rawRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Normalizes header string for robust matching
 */
const normalizeHeader = (header: any): string => {
  if (header === null || header === undefined) return '';
  return String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Normalizes answer string (e.g., "A", "Option A", "option a", "a") into
 * normalized letter ('A'|'B'|'C'|'D') and form key ('optionA'|'optionB'|'optionC'|'optionD').
 */
export const normalizeAnswer = (
  rawAnswer: any
): { letter: 'A' | 'B' | 'C' | 'D'; key: 'optionA' | 'optionB' | 'optionC' | 'optionD' } | null => {
  if (rawAnswer === null || rawAnswer === undefined) return null;
  const str = String(rawAnswer).trim().toUpperCase();

  if (str === 'A' || str === 'OPTION A' || str === 'OPTIONA' || str === '1') {
    return { letter: 'A', key: 'optionA' };
  }
  if (str === 'B' || str === 'OPTION B' || str === 'OPTIONB' || str === '2') {
    return { letter: 'B', key: 'optionB' };
  }
  if (str === 'C' || str === 'OPTION C' || str === 'OPTIONC' || str === '3') {
    return { letter: 'C', key: 'optionC' };
  }
  if (str === 'D' || str === 'OPTION D' || str === 'OPTIOND' || str === '4') {
    return { letter: 'D', key: 'optionD' };
  }

  return null;
};

/**
 * Validates and normalizes raw Excel rows into MCQ questions and errors.
 */
export const validateAndNormalizeMCQRows = (rawRows: any[][]): MCQValidationResult => {
  if (!rawRows || rawRows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      questions: [],
      errors: [
        {
          rowNumber: 1,
          questionIndex: 0,
          field: 'File',
          message: 'The uploaded Excel file is empty.',
        },
      ],
      warnings: [],
    };
  }

  // 1. Locate header row (search first 5 rows for header containing "question")
  let headerRowIndex = -1;
  let headerRow: any[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
    const row = rawRows[r];
    if (Array.isArray(row)) {
      const hasQuestionHeader = row.some((cell) =>
        normalizeHeader(cell).includes('question')
      );
      if (hasQuestionHeader) {
        headerRowIndex = r;
        headerRow = row;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    return {
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      questions: [],
      errors: [
        {
          rowNumber: 1,
          questionIndex: 0,
          field: 'Header',
          message:
            'Could not find valid column headers. Please use the official template.',
        },
      ],
      warnings: [],
      missingColumns: [...REQUIRED_COLUMNS],
    };
  }

  // Map header normalized names to column indexes
  const colIndexMap: Record<string, number> = {};
  headerRow.forEach((cell, idx) => {
    const norm = normalizeHeader(cell);
    if (norm) {
      colIndexMap[norm] = idx;
    }
  });

  // Canonical key finder
  const findColIndex = (candidates: string[]): number => {
    for (const c of candidates) {
      const norm = normalizeHeader(c);
      if (colIndexMap[norm] !== undefined) return colIndexMap[norm];
    }
    return -1;
  };

  const questionIdx = findColIndex(['Question', 'question']);
  const optionAIdx = findColIndex(['Option A', 'OptionA', 'A']);
  const optionBIdx = findColIndex(['Option B', 'OptionB', 'B']);
  const optionCIdx = findColIndex(['Option C', 'OptionC', 'C']);
  const optionDIdx = findColIndex(['Option D', 'OptionD', 'D']);
  const marksIdx = findColIndex([
    'Marks per question',
    'Marks',
    'Mark',
    'Marksperquestion',
  ]);
  const answerIdx = findColIndex([
    'Correct Answer',
    'CorrectAnswer',
    'Answer',
    'Correct',
  ]);
  const explanationIdx = findColIndex(['Explanation', 'Explain', 'Reason']);

  // Check required columns
  const missingCols: string[] = [];
  if (questionIdx === -1) missingCols.push('Question');
  if (optionAIdx === -1) missingCols.push('Option A');
  if (optionBIdx === -1) missingCols.push('Option B');
  if (optionCIdx === -1) missingCols.push('Option C');
  if (optionDIdx === -1) missingCols.push('Option D');
  if (marksIdx === -1) missingCols.push('Marks per question');
  if (answerIdx === -1) missingCols.push('Correct Answer');

  if (missingCols.length > 0) {
    return {
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      questions: [],
      errors: [
        {
          rowNumber: headerRowIndex + 1,
          questionIndex: 0,
          field: 'Headers',
          message: `Missing required column(s): ${missingCols.join(', ')}`,
        },
      ],
      warnings: [],
      missingColumns: missingCols,
    };
  }

  const questions: MCQQuestion[] = [];
  const errors: MCQValidationError[] = [];
  const warnings: MCQValidationWarning[] = [];
  const questionTextMap = new Map<string, number[]>(); // for duplicate detection

  let attemptedQuestionCount = 0;

  // Process data rows
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i] || [];
    const excelRowNum = i + 1; // 1-based Excel row number

    // Helper to get raw cell value safely
    const getCell = (idx: number) => {
      if (idx === -1 || idx >= row.length) return '';
      return row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';
    };

    const rawQuestion = getCell(questionIdx);
    const rawOptionA = getCell(optionAIdx);
    const rawOptionB = getCell(optionBIdx);
    const rawOptionC = getCell(optionCIdx);
    const rawOptionD = getCell(optionDIdx);
    const rawMarks = getCell(marksIdx);
    const rawAnswer = getCell(answerIdx);
    const rawExplanation = getCell(explanationIdx);

    // Rule 3: Ignore completely empty rows
    const isCompletelyEmpty =
      !rawQuestion &&
      !rawOptionA &&
      !rawOptionB &&
      !rawOptionC &&
      !rawOptionD &&
      !rawMarks &&
      !rawAnswer &&
      !rawExplanation;

    if (isCompletelyEmpty) {
      continue;
    }

    attemptedQuestionCount++;
    const rowErrors: MCQValidationError[] = [];

    // Rule 4: Question validation
    if (!rawQuestion) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Question',
        message: 'Question cannot be empty.',
      });
    } else if (rawQuestion.length < 5) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Question',
        message: 'Question must be at least 5 characters long.',
        value: rawQuestion,
      });
    }

    // Rules 5-8: Options validation
    if (!rawOptionA) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Option A',
        message: 'Option A cannot be empty.',
      });
    }
    if (!rawOptionB) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Option B',
        message: 'Option B cannot be empty.',
      });
    }
    if (!rawOptionC) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Option C',
        message: 'Option C cannot be empty.',
      });
    }
    if (!rawOptionD) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Option D',
        message: 'Option D cannot be empty.',
      });
    }

    // Rule 9: Marks validation
    let marksVal = 0;
    if (!rawMarks) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Marks per question',
        message: 'Marks per question is required.',
      });
    } else {
      const parsedMarks = Number(rawMarks);
      if (isNaN(parsedMarks) || parsedMarks <= 0) {
        rowErrors.push({
          rowNumber: excelRowNum,
          questionIndex: attemptedQuestionCount,
          field: 'Marks per question',
          message: `Marks per question must be a positive number. Invalid value "${rawMarks}".`,
          value: rawMarks,
        });
      } else {
        marksVal = parsedMarks;
      }
    }

    // Rule 10: Correct Answer validation & normalization
    let normalizedAnswer: ReturnType<typeof normalizeAnswer> = null;
    if (!rawAnswer) {
      rowErrors.push({
        rowNumber: excelRowNum,
        questionIndex: attemptedQuestionCount,
        field: 'Correct Answer',
        message: 'Correct Answer cannot be empty. Allowed values: A, B, C, D.',
      });
    } else {
      normalizedAnswer = normalizeAnswer(rawAnswer);
      if (!normalizedAnswer) {
        rowErrors.push({
          rowNumber: excelRowNum,
          questionIndex: attemptedQuestionCount,
          field: 'Correct Answer',
          message: `Invalid value "${rawAnswer}". Allowed values: A, B, C, D (or Option A, Option B, etc.).`,
          value: rawAnswer,
        });
      }
    }

    // If row has errors, add them to total errors list
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (normalizedAnswer) {
      // Row is completely valid!
      const validQuestion: MCQQuestion = {
        question: rawQuestion,
        optionA: rawOptionA,
        optionB: rawOptionB,
        optionC: rawOptionC,
        optionD: rawOptionD,
        marks: marksVal,
        answer: normalizedAnswer.key,
        correctAnswerLetter: normalizedAnswer.letter,
        ...(rawExplanation ? { explanation: rawExplanation } : {}),
      };

      questions.push(validQuestion);

      // Track duplicate questions
      const normalizedQText = rawQuestion.toLowerCase().replace(/\s+/g, ' ');
      const existingRows = questionTextMap.get(normalizedQText) || [];
      existingRows.push(excelRowNum);
      questionTextMap.set(normalizedQText, existingRows);
    }
  }

  // Feature 9: Detect duplicate questions
  questionTextMap.forEach((rows, qText) => {
    if (rows.length > 1) {
      const snippet = qText.length > 50 ? qText.substring(0, 50) + '...' : qText;
      warnings.push({
        message: `Duplicate question detected at rows ${rows.join(' and ')}: "${snippet}"`,
        rowNumbers: rows,
      });
    }
  });

  const validCount = questions.length;
  // Unique rows that had errors
  const invalidRowsSet = new Set(errors.map((e) => e.rowNumber));
  const invalidCount = invalidRowsSet.size;

  return {
    totalRows: attemptedQuestionCount,
    validCount,
    invalidCount,
    questions,
    errors,
    warnings,
  };
};

/**
 * Calculates sum of marks for all questions
 */
export const calculateTotalMarks = (questions: MCQQuestion[]): number => {
  return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
};
