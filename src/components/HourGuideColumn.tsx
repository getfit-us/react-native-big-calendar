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
  index: number
}

const _HourGuideColumn = ({
  cellHeight,
  hour,
  minute,
  ampm,
  index,
  hourStyle = {},
}: HourGuideColumnProps) => {
  const theme = useTheme()
  const textStyle = React.useMemo(
    () =>
      ({
        color: theme.palette.gray[500],
        fontSize: theme.typography.xs.fontSize,
      }) as const,
    [theme],
  )
  const viewStyle = React.useMemo(
    () =>
      ({
        height: cellHeight,
        // borderWidth: 1,
        // borderColor: theme.palette.gray[200],
        // borderLeftWidth: 0,
        // borderTopWidth: 0,
        // borderRightWidth: 0,
        // justifyContent: 'flex-start',
        justifyContent: 'center',

        position: 'relative',
      }) as const,
    [cellHeight],
  )

  const viewStyleChild: any = React.useMemo(
    () =>
      index > 0
        ? {
            position: 'absolute' as 'absolute',
            top: -8,
            left: 2,
          }
        : {
            position: 'absolute' as 'absolute',
            top: 0,
            left: 2,
          },
    [index],
  )
  return (
    <View style={viewStyle}>
      <View style={viewStyleChild}>
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
    </View>
  )
}

export const HourGuideColumn = React.memo(_HourGuideColumn, () => true)
