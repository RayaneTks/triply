import { FC, useState } from 'react';

export interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onDatesChange?: (startDate: string, endDate: string) => void;
    className?: string;
    containerStyle?: React.CSSProperties;
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
                                                              startDate: propStartDate = '',
                                                              endDate: propEndDate = '',
                                                              onDatesChange,
                                                              className = '',
                                                              containerStyle,
                                                          }) => {
    const [internalStartDate, setInternalStartDate] = useState(propStartDate);
    const [internalEndDate, setInternalEndDate] = useState(propEndDate);
    
    const startDate = propStartDate !== undefined ? propStartDate : internalStartDate;
    const endDate = propEndDate !== undefined ? propEndDate : internalEndDate;

    const handleChange = (type: 'start' | 'end', value: string) => {
        let newStartDate = startDate;
        let newEndDate = endDate;

        if (type === 'start') {
            newStartDate = value;
            setInternalStartDate(value);
        } else {
            newEndDate = value;
            setInternalEndDate(value);
        }

        onDatesChange?.(newStartDate, newEndDate);
    };

    return (
        <div
            className={`flex items-center bg-white border border-gray-300 rounded-lg py-2.5 px-3 md:px-4 shadow-sm w-full overflow-hidden ${className}`}
            style={containerStyle}
        >
            <div className="flex-shrink-0 mr-2 md:mr-3" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.5)' }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="flex flex-grow justify-between items-center gap-2 md:gap-3 min-w-0 overflow-hidden">
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <label htmlFor="startDate" className="text-xs font-medium mb-0.5 whitespace-nowrap" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>Départ</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => handleChange('start', e.target.value)}
                        className="focus:outline-none border-0 p-0 bg-transparent w-full text-xs md:text-sm min-w-0"
                        style={{ color: 'var(--foreground, #ededed)', maxWidth: '100%' }}
                    />
                </div>

                <span className="flex-shrink-0 px-1 text-xs md:text-sm" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.5)' }}>→</span>

                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <label htmlFor="endDate" className="text-xs font-medium mb-0.5 whitespace-nowrap" style={{ color: containerStyle?.color || 'rgba(255, 255, 255, 0.7)' }}>Retour</label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => handleChange('end', e.target.value)}
                        className="focus:outline-none border-0 p-0 bg-transparent w-full text-xs md:text-sm min-w-0"
                        style={{ color: 'var(--foreground, #ededed)', maxWidth: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};