import { FC, useState } from 'react';

export interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onDatesChange?: (startDate: string, endDate: string) => void;
    className?: string;
}

const CalendarIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const DateRangePicker: FC<DateRangePickerProps> = ({
                                                              startDate: initialStartDate = '',
                                                              endDate: initialEndDate = '',
                                                              onDatesChange,
                                                              className = '',
                                                          }) => {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const handleChange = (type: 'start' | 'end', value: string) => {
        let newStartDate = startDate;
        let newEndDate = endDate;

        if (type === 'start') {
            newStartDate = value;
            setStartDate(value);
        } else {
            newEndDate = value;
            setEndDate(value);
        }

        onDatesChange?.(newStartDate, newEndDate);
    };

    return (
        <div
            className={`flex items-center bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm w-full max-w-md ${className}`}
        >
            {CalendarIcon}

            <div className="flex flex-grow justify-between items-center gap-4">
                <div className="flex flex-col flex-1">
                    <label htmlFor="startDate" className="text-xs text-gray-500 font-medium">Départ</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => handleChange('start', e.target.value)}
                        className="text-gray-700 placeholder-gray-500 focus:outline-none border-0 p-0"
                    />
                </div>

                <span className="text-gray-400 mx-1">→</span>

                <div className="flex flex-col flex-1">
                    <label htmlFor="endDate" className="text-xs text-gray-500 font-medium">Retour</label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => handleChange('end', e.target.value)}
                        className="text-gray-700 placeholder-gray-500 focus:outline-none border-0 p-0"
                    />
                </div>
            </div>
        </div>
    );
};