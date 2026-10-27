import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { vi } from 'date-fns/locale/vi';
import 'react-day-picker/dist/style.css';

export default function CalendarPicker(props: DayPickerProps) {
  return <DayPicker {...props} locale={vi} />;
}
