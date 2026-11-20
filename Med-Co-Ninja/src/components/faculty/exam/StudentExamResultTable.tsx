import GenericTable, { Column } from '@/components/Forms/Table/GenericTable'
import React from 'react'

export default function StudentExamResultTable() {
    type examResultData = {
        studentName:string,
        dateTime:string,
        marks:string,
        time:string,
        view:string,
        

    }

    const resultTable:Column<examResultData>[] =[
        {
            accessor:"sNo",
            header:"S.No",
            render:(item:examResultData,index:number)=>{
                return index+1;
            }
        },
        {
            accessor:"studentName",
            header:"Student Name",
        },
        {
            accessor:"dateTime",
            header:"Date & Time",
        },
        {
            accessor:"marks",
            header:"Marks",
        },
        {
            accessor:"time",
            header:"Time",
        },
        {
            accessor:"view",
            header:"View",
        },
    ]


  return (
    <div className='p-5'>StudentExamResultTable
    
    
        <GenericTable title="Student Exam Results" columns={resultTable} data={[]} />
    
    
    
    </div>
  )
}
