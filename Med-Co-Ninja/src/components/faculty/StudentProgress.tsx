import { Column } from '@/types/index'
import React from 'react'
import { User, Calendar, BookOpen, BarChart2, Award } from 'lucide-react'
import GenericTable from '../Forms/Table/GenericTable'
import z from 'zod'

const StudentProgress = () => {

        type columnType= {
          courseName:string,
          examName:string,
          marks:string,
          date:string
          avgMarks:string

        }

type StudentProgressValues ={
  studentName:string,
  batchName:string,
  startDate:string,
  endDate:string,
  attendance:string,
  avgMarks:string
}

     const tableColumns:Column<columnType>[] = [
        {
            accessor: "courseName",
            header: "Course Name",
        },
        {
            accessor: "examName",
            header: "Exam Name",
        },
        {
            accessor: "marks",
            header: "Marks",
        },
        {
            accessor: "date",
            header: "Date",
        }
    ]

   const data:columnType[] = [
    {
        courseName:"Course 1",
        examName:"Exam 1",
        marks:"100",
        date:"2022-01-01",
        avgMarks:"100"
    },
    {
        courseName:"Course 2",
        examName:"Exam 2",
        marks:"200",
        date:"2022-01-02",
        avgMarks:"100"  
    },
    {
        courseName:"Course 3",
        examName:"Exam 3",
        marks:"300",
        date:"2022-01-03",
        avgMarks:"100"
    }
   ]

   const studentData:StudentProgressValues ={
    studentName:"John Doe",
    batchName:"Batch 1",
    startDate:"2022-01-01",
    endDate:"2022-01-02",
    attendance:"100%",
    avgMarks:"80"
   }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10">
      {/* Student Profile Info Card */}
      <div className="mb-6 rounded-xl border border-stroke bg-pure-white p-6 shadow-default dark:border-strokedark dark:bg-primary-navy">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-stroke pb-6 dark:border-strokedark mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-teal/10 text-accent-teal dark:bg-meta-4">
              <User size={30} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-navy dark:text-pure-white">
                {studentData.studentName}
              </h2>
              <p className="text-sm font-semibold text-bodydark2 flex items-center gap-1.5 mt-1.5">
                <BookOpen size={14} className="text-accent-teal" />
                <span>Batch: {studentData.batchName}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <div className="rounded-lg bg-bg-light-mint/50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark px-4 py-2 flex items-center gap-2">
              <Calendar size={16} className="text-accent-teal" />
              <div>
                <span className="block text-xs text-bodydark2">Start Date</span>
                <span className="text-primary-navy dark:text-pure-white font-bold">{studentData.startDate}</span>
              </div>
            </div>
            <div className="rounded-lg bg-bg-light-mint/50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark px-4 py-2 flex items-center gap-2">
              <Calendar size={16} className="text-accent-teal" />
              <div>
                <span className="block text-xs text-bodydark2">End Date</span>
                <span className="text-primary-navy dark:text-pure-white font-bold">{studentData.endDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Attendance stat */}
          <div className="rounded-xl border border-stroke bg-bg-light-mint/10 dark:border-strokedark/50 p-4.5 flex items-center gap-4.5 hover:shadow-sm transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <BarChart2 size={22} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-bodydark2 uppercase tracking-wider">Attendance</span>
              <span className="text-xl font-bold text-slate-800 dark:text-pure-white">{studentData.attendance}</span>
            </div>
          </div>

          {/* Performance stat */}
          <div className="rounded-xl border border-stroke bg-bg-light-mint/10 dark:border-strokedark/50 p-4.5 flex items-center gap-4.5 hover:shadow-sm transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-teal/10 text-accent-teal">
              <Award size={22} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-bodydark2 uppercase tracking-wider">Total Marks</span>
              <span className="text-xl font-bold text-slate-800 dark:text-pure-white">{studentData.attendance}</span>
            </div>
          </div>

          <div className="rounded-xl border border-stroke bg-bg-light-mint/10 dark:border-strokedark/50 p-4.5 flex items-center gap-4.5 hover:shadow-sm transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-teal/10 text-accent-teal">
              <Award size={22} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-bodydark2 uppercase tracking-wider">Average Marks</span>
              <span className="text-xl font-bold text-slate-800 dark:text-pure-white">{studentData.avgMarks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Table */}
      <GenericTable 
        title="Student Exam Progress" 
        searchAble={true}
        data={data} 
        columns={tableColumns} 
      />
    </div>
  )
}

export default StudentProgress;