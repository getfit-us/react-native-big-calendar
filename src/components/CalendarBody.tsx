import dayjs from 'dayjs'
import * as React from 'react'
import { useMemo } from 'react'
import { Platform, ScrollView, StyleSheet, TextStyle, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { useNow } from '../hooks/useNow'
import { usePanResponder } from '../hooks/usePanResponder'
import {
  CalendarCellStyle,
  EventCellStyle,
  EventRenderer,
  HorizontalDirection,
  ICalendarEventBase,
} from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import {
  SIMPLE_DATE_FORMAT,
  enrichEvents,
  getCountOfEventsAtEvent,
  getOrderOfEvent,
  getRelativeTopInDay,
  getHours,
  isToday,
} from '../utils/datetime'
import { typedMemo } from '../utils/react'
import { CalendarEvent } from './CalendarEvent'
import { HourGuideCell } from './HourGuideCell'
import { HourGuideColumn } from './HourGuideColumn'

const styles = StyleSheet.create({
  nowIndicator: {
    position: 'absolute',
    zIndex: 10000,
    height: 2,
    width: '100%',
  },
})

interface CalendarBodyProps<T extends ICalendarEventBase> {
  cellHeight: number
  containerHeight: number
  dateRange: dayjs.Dayjs[]
  events: T[]
  scrollOffsetMinutes: number
  scrollViewRef?: React.RefObject<ScrollView>
  ampm: boolean
  showTime: boolean
  style: ViewStyle
  eventCellStyle?: EventCellStyle<T>
  calendarCellStyle?: CalendarCellStyle
  hideNowIndicator?: boolean
  overlapOffset?: number
  onLongPressCell?: (date: Date) => void
  onPressCell?: (date: Date) => void
  selectedCell?: Date
  onPressEvent?: (event: T) => void
  onSwipeHorizontal?: (d: HorizontalDirection) => void
  renderEvent?: EventRenderer<T>
  onPressElement?: React.ReactNode
  headerComponent?: React.ReactElement | null
  headerComponentStyle?: ViewStyle
  hourStyle?: TextStyle
  minuteStep?: number
  hideHours?: Boolean
  isEventOrderingEnabled?: boolean
  showWeekNumber?: boolean
  showVerticalScrollIndicator?: boolean
  enrichedEventsByDate?: Record<string, T[]>
  enableEnrichedEvents?: boolean
  eventsAreSorted?: boolean
}

function _CalendarBody<T extends ICalendarEventBase>({
  containerHeight,
  cellHeight,
  dateRange,
  style,
  onLongPressCell,
  onPressCell,
  events,
  onPressEvent,
  eventCellStyle,
  calendarCellStyle,
  ampm,
  showTime,
  scrollOffsetMinutes,
  scrollViewRef,
  onSwipeHorizontal,
  hideNowIndicator,
  overlapOffset,
  renderEvent,
  onPressElement,
  headerComponent = null,
  headerComponentStyle = {},
  hourStyle = {},
  hideHours = false,
  isEventOrderingEnabled = true,
  showWeekNumber = false,
  showVerticalScrollIndicator = false,
  enrichedEventsByDate,
  enableEnrichedEvents = false,
  eventsAreSorted = false,
  minuteStep = 60,
}: CalendarBodyProps<T>) {
  const scrollView = React.useRef<ScrollView>(null)
  const { now } = useNow(!hideNowIndicator)

  React.useEffect(() => {
    let timeout: NodeJS.Timeout
    if (scrollView.current && scrollOffsetMinutes && Platform.OS !== 'ios') {
      // We add delay here to work correct on React Native
      // see: https://stackoverflow.com/questions/33208477/react-native-android-scrollview-scrollto-not-working
      timeout = setTimeout(
        () => {
          if (scrollView && scrollView.current) {
            scrollView.current.scrollTo({
              y: (cellHeight * scrollOffsetMinutes) / 60,
              animated: false,
            })
          }
        },
        Platform.OS === 'web' ? 0 : 10,
      )
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [scrollView, scrollOffsetMinutes, cellHeight, scrollViewRef])

  const panResponder = usePanResponder({
    onSwipeHorizontal,
  })

  const _onPressCell = React.useCallback(
    (date: dayjs.Dayjs) => {
      onPressCell && onPressCell(date.toDate())
    },
    [onPressCell],
  )

  const _onLongPressCell = React.useCallback(
    (date: dayjs.Dayjs) => {
      onLongPressCell && onLongPressCell(date.toDate())
    },
    [onLongPressCell],
  )

  const internalEnrichedEventsByDate = useMemo(() => {
    if (enableEnrichedEvents) {
      return enrichedEventsByDate || enrichEvents(events, eventsAreSorted)
    }
    return {}
  }, [enableEnrichedEvents, enrichedEventsByDate, events, eventsAreSorted])

  const enrichedEvents = useMemo(() => {
    if (enableEnrichedEvents) return []

    if (isEventOrderingEnabled) {
      return events.map((event) => ({
        ...event,
        overlapPosition: getOrderOfEvent(event, events),
        overlapCount: getCountOfEventsAtEvent(event, events),
      }))
    }

    return events
  }, [enableEnrichedEvents, events, isEventOrderingEnabled])

  const _renderMappedEvent = React.useCallback(
    (event: T, index: number) => {
      return (
        <CalendarEvent
          key={`${index}${event.start}${event.title}${event.end}`}
          event={event}
          onPressEvent={onPressEvent}
          eventCellStyle={eventCellStyle}
          showTime={showTime}
          eventCount={event.overlapCount}
          eventOrder={event.overlapPosition}
          overlapOffset={overlapOffset}
          renderEvent={renderEvent}
          ampm={ampm}
        />
      )
    },
    [ampm, eventCellStyle, onPressEvent, overlapOffset, renderEvent, showTime],
  )

  const _renderEvents = React.useCallback(
    (date) => {
      if (enableEnrichedEvents) {
        return (internalEnrichedEventsByDate[date.format(SIMPLE_DATE_FORMAT)] || []).map(
          _renderMappedEvent,
        )
      } else {
        return (
          <>
            {/* Render events of this date */}
            {/* M  T  (W)  T  F  S  S */}
            {/*       S-E             */}
            {(enrichedEvents as T[])
              .filter(({ start }) =>
                dayjs(start).isBetween(date.startOf('day'), date.endOf('day'), null, '[)'),
              )
              .map(_renderMappedEvent)}

            {/* Render events which starts before this date and ends on this date */}
            {/* M  T  (W)  T  F  S  S */}
            {/* S------E              */}
            {(enrichedEvents as T[])
              .filter(
                ({ start, end }) =>
                  dayjs(start).isBefore(date.startOf('day')) &&
                  dayjs(end).isBetween(date.startOf('day'), date.endOf('day'), null, '[)'),
              )
              .map((event) => ({
                ...event,
                start: dayjs(event.end).startOf('day'),
              }))
              .map(_renderMappedEvent)}

            {/* Render events which starts before this date and ends after this date */}
            {/* M  T  (W)  T  F  S  S */}
            {/*    S-------E          */}
            {(enrichedEvents as T[])
              .filter(
                ({ start, end }) =>
                  dayjs(start).isBefore(date.startOf('day')) &&
                  dayjs(end).isAfter(date.endOf('day')),
              )
              .map((event) => ({
                ...event,
                start: dayjs(event.end).startOf('day'),
                end: dayjs(event.end).endOf('day'),
              }))
              .map(_renderMappedEvent)}
          </>
        )
      }
    },
    [_renderMappedEvent, enableEnrichedEvents, enrichedEvents, internalEnrichedEventsByDate],
  )

  const theme = useTheme()

  return (
    <React.Fragment>
      {headerComponent != null ? <View style={headerComponentStyle}>{headerComponent}</View> : null}
      <ScrollView
        style={[
          {
            height: containerHeight,
          },
          style,
        ]}
        ref={scrollViewRef ? scrollViewRef : scrollView}
        scrollEventThrottle={32}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        showsVerticalScrollIndicator={showVerticalScrollIndicator}
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never" // Disable over-scroll for Android
        contentOffset={Platform.OS === 'ios' ? { x: 0, y: scrollOffsetMinutes } : { x: 0, y: 0 }}
      >
        <View
          style={[u['flex-1'], theme.isRTL ? u['flex-row-reverse'] : u['flex-row']]}
          {...(Platform.OS === 'web' ? panResponder.panHandlers : {})}
        >
          {(!hideHours || showWeekNumber) && (
            <View style={[u['z-20'], u['w-50']]}>
              {getHours(minuteStep).map((time, index) => (
                <HourGuideColumn
                  key={time.hour + time.minute}
                  cellHeight={cellHeight}
                  hour={time.hour}
                  minute={time.minute}
                  ampm={ampm}
                  hourStyle={hourStyle}
                  index={index}
                />
              ))}
            </View>
          )}

          {dateRange.map((date) => (
            <View style={[u['flex-1'], u['overflow-hidden']]} key={date.toString()}>
              {getHours(minuteStep).map((time, index) => (
                <HourGuideCell
                  key={time.hour + time.minute}
                  cellHeight={cellHeight}
                  date={date}
                  hour={time.hour}
                  minute={time.minute}
                  onLongPress={_onLongPressCell}
                  onPress={_onPressCell}
                  index={index}
                  calendarCellStyle={calendarCellStyle}
                  onPressElement={onPressElement}
                />
              ))}
              {_renderEvents(date)}
              {isToday(date) && !hideNowIndicator && (
                <View
                  style={[
                    styles.nowIndicator,
                    { backgroundColor: theme.palette.nowIndicator },
                    {
                      height: 3,
                    },
                    { top: `${getRelativeTopInDay(now)}%` },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </React.Fragment>
  )
}

export const CalendarBody = typedMemo(_CalendarBody)
