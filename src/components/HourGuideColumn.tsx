import * as React from 'react'
import { Text, TextStyle, View } from 'react-native'

import { u } from '../commonStyles'
import { useTheme } from '../theme/ThemeContext'
import { formatHour } from '../utils/datetime'
import { objHasContent } from '../utils/object'

interface HourGuideColumnProps {
  cellHeight: number
  hour: number
  minute: number
  ampm: boolean
  hourStyle: TextStyle
}

const _HourGuideColumn = ({
  cellHeight,
  hour,
  minute,
  ampm,
  hourStyle = {},
}: HourGuideColumnProps) => {
  const theme = useTheme()
  const textStyle = React.useMemo(
    () => ({ color: theme.palette.gray[500], fontSize: theme.typography.xs.fontSize }),
    [theme],
  )

  return (
    <View style={{ height: cellHeight }}>
      <Text style={[objHasContent(hourStyle) ? hourStyle : textStyle, u['text-center']]}>
        {formatHour(
          {
            hour,
            minute,
          },
          ampm,
        )}
      </Text>
    </View>
  )
}

export const HourGuideColumn = React.memo(_HourGuideColumn, () => true)
