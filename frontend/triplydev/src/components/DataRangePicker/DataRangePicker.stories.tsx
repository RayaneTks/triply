import type { Meta, StoryObj } from '@storybook/react';
import {DateRangePicker, DateRangePickerProps} from "./DataRangePicker";

const meta: Meta<DateRangePickerProps> = {
    title: 'Components/DateRangePicker',
    component: DateRangePicker,
    tags: ['autodocs'],
    argTypes: {
        startDate: { control: 'text' },
        endDate: { control: 'text' },
        onDatesChange: { action: 'datesChanged' },
        className: { control: 'text' },
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<DateRangePickerProps>;

export const Default: Story = {
    args: {
        startDate: '',
        endDate: '',
    },
};

export const WithPredefinedDates: Story = {
    args: {
        startDate: '2025-12-01',
        endDate: '2025-12-15',
    },
};

export const CustomWidth: Story = {
    args: {
        className: 'max-w-xl',
    },
};