import { showPopup } from '@/components/Common/AlertPopup';
import GenericTable from "@/components/Forms/Table/GenericTable";
import { Column } from "@/types";

type quetions={
   company:string ,
   fileName :string,
   uploadedOn :string,
   action:string
}

const Question = () => {

    const examColmn: Column<quetions>[]=[
            {header:"Company",accessor:"company"},
            {header:"File Name",accessor:"fileName"},
            {header:"Uploaded On",accessor:"uploadedOn"},
            {header:"Action",accessor:"action",render:({row}:any)=>(
                <button onClick={onDownload} className="bg-accent-teal text-pure-white p-1">Download</button>
            ) },

    
    ]

    const onDownload=()=>{
        showPopup("No file available to download yet");
    }
const data:quetions[]=[{company:"Company 1",fileName:"File 1",uploadedOn:"2022-01-01",action:"Action 1"}]

    return (
        <div className="">
            <h1 className="mb-2 text-lg font-bold sm:text-xl">📚 Question Banks for Interview Preparation</h1>
            <hr className="mb-3 opacity-25" />

        <GenericTable title="Questions" columns={examColmn} data={data} />
        </div>
    );
};

export default Question;