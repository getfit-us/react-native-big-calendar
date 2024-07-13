import dayjs from 'dayjs'
import * as React from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'

import { u } from '../commonStyles'
import { CalendarCellStyle } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'

interface HourGuideCellProps {
  cellHeight: number
  onLongPress: (d: dayjs.Dayjs) => void
  onPress: (d: dayjs.Dayjs) => void
  date: dayjs.Dayjs
  hour: number
  minute: number
  index: number
  calendarCellStyle?: CalendarCellStyle
  onPressElement?: React.ReactNode
}

const _HourGuideCell = ({
  cellHeight,
  onLongPress,
  onPress,
  date,
  hour,
  minute,
  index,
  calendarCellStyle,
  onPressElement,
}: HourGuideCellProps) => {
  const theme = useTheme()
  const [showElement, setShowElement] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const getCalendarCellStyle = React.useMemo(
    () => (typeof calendarCellStyle === 'function' ? calendarCellStyle : () => calendarCellStyle),
    [calendarCellStyle],
  )

  const handlePress = React.useCallback(() => {
    setShowElement(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onPress(date.hour(hour).minute(minute))
    timeoutRef.current = setTimeout(() => {
      setShowElement(false)
    }, 800)
  }, [timeoutRef, setShowElement, onPress, date, hour, minute])

  return (
    <TouchableWithoutFeedback
      onLongPress={() => onLongPress(date.hour(hour).minute(minute))}
      onPress={handlePress}
    >
      <View
        style={[
          u['border-l'],
          u['border-b'],
          { borderColor: theme.palette.gray['200'] },
          { height: cellHeight },
          { ...getCalendarCellStyle(date.toDate(), index) },
        ]}
      >
        {showElement && onPressElement}
      </View>
    </TouchableWithoutFeedback>
  )
}

export const HourGuideCell = React.memo(_HourGuideCell)
