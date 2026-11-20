import React from 'react';
import ReactQuill from 'react-quill';
import {Controller, useFormContext} from 'react-hook-form';
import 'react-quill/dist/quill.snow.css';

interface RichTextProps {
  name: string;
  label: string;
  disabled?: boolean;
}

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  [{header: [1, 2, 3, false]}],
  [{list: 'ordered'}, {list: 'bullet'}],
  [{align: []}],
  ['link', 'image'],
  ['clean'],
];

const GenericRichTextEditor: React.FC<RichTextProps> = ({
  name,
  label,
  disabled = false,
}) => {
  const {
    control,
    formState: {errors},
  } = useFormContext();

  const errorMessage = errors[name]?.message as string | undefined;

  return (
    <div>
      <label className="mb-3 block text-black dark:text-white">{label}</label>

      <div
        className={`rounded-lg border-[1.5px] border-stroke bg-transparent transition dark:border-form-strokedark dark:bg-form-input ${errorMessage ? 'border-red-500' : ''}`}
      >
        <Controller
          name={name}
          control={control}
          render={({field}) => (
            <ReactQuill
              theme="snow"
              value={field.value || ''}
              onChange={field.onChange}
              readOnly={disabled}
              modules={{toolbar: toolbarOptions}}
              className="text-black dark:text-white"
            />
          )}
        />
      </div>

      {errorMessage && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}

      {/* Dark mode styles */}
      <style>
        {`
          .dark .ql-toolbar {
            background-color: transparent;
            border-color: #3d4d60;
          }

          .dark .ql-container {
            background-color: transparent;
            border-color: #3d4d60;
          }

          .dark .ql-editor {
            color: white;
          }

          .dark .ql-stroke {
            stroke: white;
          }

          .dark .ql-fill {
            fill: white;
          }

          .dark .ql-picker {
            color: white;
          }
        `}
      </style>
    </div>
  );
};

export default GenericRichTextEditor;
