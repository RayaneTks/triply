import React from 'react';
import {PaperAirplaneProps} from "../../types/paperAirplane.ts";

export const PaperAirplane: React.FC<PaperAirplaneProps> = ({
                                                                size = 48,
                                                                color = '#0096c7'
                                                            }) => {

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: 'rotate(45deg)' }}
        >
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
        </svg>
    );
};